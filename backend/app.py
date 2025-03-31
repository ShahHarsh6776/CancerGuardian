from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
import numpy as np
from PIL import Image
import io
import torch
from typing import Optional
import base64
import os
from datetime import datetime
import shutil
import json
from pathlib import Path
import uuid
from models.skin_cancer import predict as skin_predict
from models.throat_cancer import predict as throat_predict
from models.breast_cancer import predict as breast_predict
import glob

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount the uploads directory
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Model paths
MODEL_PATHS = {
    "skin": os.path.join(os.path.dirname(__file__), "models", "skin_cancer", "best_model.pth"),
    "throat": os.path.join(os.path.dirname(__file__), "models", "throat_cancer", "best_model.pth"),
    "breast": os.path.join(os.path.dirname(__file__), "models", "breast_cancer", "best_model.pth")
}

# Create necessary directories
SESSION_DIR = "sessions"
MODEL_DIR = "models"
for directory in [UPLOAD_DIR, SESSION_DIR, MODEL_DIR]:
    if not os.path.exists(directory):
        os.makedirs(directory)

def get_latest_image(user_upload_dir):
    """Get the most recently uploaded image in the user's directory"""
    list_of_files = glob.glob(os.path.join(user_upload_dir, '*'))
    if not list_of_files:
        return None
    latest_file = max(list_of_files, key=os.path.getctime)
    return latest_file

def save_to_session(user_id: str, image_filename: str, analysis_result: dict):
    """Save analysis result to user's session file"""
    session_dir = os.path.join(os.path.dirname(__file__), "sessions")
    os.makedirs(session_dir, exist_ok=True)
    
    session_file = os.path.join(session_dir, f"{user_id}_session.json")
    
    # Load existing session data
    session_data = []
    if os.path.exists(session_file):
        with open(session_file, 'r') as f:
            try:
                session_data = json.load(f)
            except json.JSONDecodeError:
                session_data = []
    
    # Add new result
    session_data.append({
        "timestamp": datetime.now().isoformat(),
        "image_filename": image_filename,
        "analysis_result": analysis_result
    })
    
    # Save updated session data
    with open(session_file, 'w') as f:
        json.dump(session_data, f, indent=2)

def get_session_data(user_id: str):
    """Retrieve user's session data"""
    session_file = os.path.join(SESSION_DIR, f"{user_id}_session.json")
    if os.path.exists(session_file):
        with open(session_file, 'r') as f:
            return json.load(f)
    return []

@app.get("/")
def read_root():
    return {"status": "API is running"}

@app.post("/predict")
async def predict_image(
    file: UploadFile = File(...),
    cancer_type: str = Form(...),
    user_id: str = Form(...)
):
    try:
        # Create user directory if it doesn't exist
        user_upload_dir = os.path.join(UPLOAD_DIR, user_id)
        os.makedirs(user_upload_dir, exist_ok=True)
        
        # Generate unique filename with timestamp
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}{file_ext}"
        file_path = os.path.join(user_upload_dir, unique_filename)
        
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Get the latest uploaded image path
        image_path = get_latest_image(user_upload_dir)
        if not image_path:
            raise HTTPException(status_code=404, detail="No image found in upload directory")
        
        # Select appropriate prediction function and model path based on cancer type
        if cancer_type == "skin":
            predict_fn = skin_predict.predict
            model_path = MODEL_PATHS["skin"]
        elif cancer_type == "throat":
            predict_fn = throat_predict.predict
            model_path = MODEL_PATHS["throat"]
        elif cancer_type == "breast":
            predict_fn = breast_predict.predict
            model_path = MODEL_PATHS["breast"]
        else:
            raise HTTPException(status_code=400, detail="Invalid cancer type")
        
        # Make prediction using the appropriate model
        result = predict_fn(image_path, model_path)
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
        # Return prediction results with image URL for frontend
        response_data = {
            **result,
            "image_url": f"/uploads/{user_id}/{unique_filename}",
            "timestamp": datetime.now().isoformat(),
            "cancer_type": cancer_type
        }
        
        # Save result to session if needed
        save_to_session(user_id, unique_filename, response_data)
        
        return response_data
        
    except Exception as e:
        print(f"Error in predict_image: {str(e)}")  # Debug print
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/session/{user_id}")
async def get_user_session(user_id: str):
    """Get all analysis results for a user"""
    try:
        session_data = get_session_data(user_id)
        return {"session_data": session_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/image/{filename}")
async def get_image(filename: str):
    """Serve an image file"""
    filepath = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(filepath)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)