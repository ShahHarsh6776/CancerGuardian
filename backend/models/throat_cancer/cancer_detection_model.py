import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import numpy as np
import os

class CancerDetectionModel(nn.Module):
    def __init__(self):
        super(CancerDetectionModel, self).__init__()
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = models.resnet50(pretrained=True)
        
        # Modify the final layer for our classification task
        num_features = self.model.fc.in_features
        self.model.fc = nn.Sequential(
            nn.Linear(num_features, 1024),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(1024, 512),
            nn.ReLU(),
            nn.Linear(512, 2)
        )
        self.model = self.model.to(self.device)
        
        self.transform = transforms.Compose([
            transforms.Resize((256, 256)),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                              std=[0.229, 0.224, 0.225]),
        ])

    def is_valid_medical_image(self, img):
        """Check if the image appears to be a medical image - more relaxed criteria"""
        # This function is now relaxed to allow more images to pass through
        # You may want to remove this check entirely if you're still having issues
        return True  # Bypassing the validation entirely
        
        # Or use a more relaxed validation if needed:
        """
        # Convert to grayscale for analysis
        gray_img = img.convert('L')
        img_array = np.array(gray_img)
        
        # Get image statistics
        mean_intensity = np.mean(img_array)
        std_intensity = np.std(img_array)
        
        # Much more relaxed criteria that will let most images through
        return True  # Most permissive
        """

    def preprocess_image(self, img_path):
        try:
            # Load and check the image
            img = Image.open(img_path)
            img = img.convert('RGB')  # Ensure RGB format
            
            # Preprocess the image
            img_tensor = self.transform(img)
            img_tensor = img_tensor.unsqueeze(0)  # Add batch dimension
            return img_tensor.to(self.device), None
        except Exception as e:
            return None, f"Error: Unable to process image. Details: {str(e)}"

    def predict(self, img_path):
        # Preprocess the image
        img_tensor, error = self.preprocess_image(img_path)
        if error:
            return error

        # Make prediction
        self.model.eval()  # Ensure model is in evaluation mode
        with torch.no_grad():
            outputs = self.model(img_tensor)
            probabilities = torch.softmax(outputs, dim=1)[0]
            
            # IMPORTANT: Check your actual training labels here
            # If you trained with [0=benign, 1=malignant], use:
            benign_prob = probabilities[0].item() * 100
            malignant_prob = probabilities[1].item() * 100
            
            # Make decision based on probabilities
            if malignant_prob > benign_prob:
                if malignant_prob > 60:
                    return f"Cancer Detected (Confidence: {malignant_prob:.1f}%)"
                else:
                    return f"Possible Cancer (Low Confidence: {malignant_prob:.1f}%)\nRecommend further medical examination"
            else:
                return f"No Cancer Detected (Confidence: {benign_prob:.1f}%)"

    def forward(self, x):
        return self.model(x)

    # For model.load_state_dict() to work correctly with the nested model structure:
    def load_state_dict(self, state_dict):
        """Custom load_state_dict to handle the nested model structure"""
        # If you have issues with key mismatches, you might need to modify the keys
        # to match your saved format. This depends on how you saved your model.
        
        try:
            # First try direct loading (if state_dict contains the full model)
            super().load_state_dict(state_dict)
            print("Model loaded with standard method")
        except Exception as e1:
            try:
                # Try loading just the internal model part
                self.model.load_state_dict(state_dict)
                print("Model loaded with internal model method")
            except Exception as e2:
                # Try remapping keys if needed
                print(f"Error loading model: {str(e1)}")
                print(f"Second error: {str(e2)}")
                print("Attempting to remap keys...")
                
                # Example of remapping keys if needed:
                new_state_dict = {}
                for key, value in state_dict.items():
                    if key.startswith('model.'):
                        new_state_dict[key] = value
                    else:
                        new_state_dict[f"model.{key}"] = value
                
                try:
                    self.model.load_state_dict(new_state_dict)
                    print("Model loaded with remapped keys")
                except Exception as e3:
                    raise Exception(f"Failed to load model with all methods: {str(e3)}")