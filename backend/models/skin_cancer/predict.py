import torch
import torchvision.transforms as transforms
from PIL import Image
import os
import torch.nn as nn

class CancerDetectionModel(nn.Module):
    def __init__(self):
        super(CancerDetectionModel, self).__init__()
        # Layer 2
        self.layer2_3 = nn.Sequential(
            nn.Conv2d(in_channels=3, out_channels=64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU()
        )
        
        # Layer 3
        self.layer3_0 = nn.Sequential(
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.Conv2d(128, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.Conv2d(128, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU()
        )
        
        # Downsampling
        self.downsample = nn.Sequential(
            nn.Conv2d(128, 256, kernel_size=3, padding=1, stride=2),
            nn.BatchNorm2d(256)
        )
        
        # Layer 3.1 and 3.2
        self.layer3_1 = nn.Sequential(
            nn.Conv2d(256, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(),
            nn.Conv2d(256, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(),
            nn.Conv2d(256, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU()
        )
        
        self.layer3_2 = nn.Sequential(
            nn.Conv2d(256, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(),
            nn.Conv2d(256, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU()
        )
        
        # Global Average Pooling and Final Layer
        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
        self.fc = nn.Linear(256, 1)
        
    def forward(self, x):
        x = self.layer2_3(x)
        x = self.layer3_0(x)
        x = self.downsample(x)
        x = self.layer3_1(x)
        x = self.layer3_2(x)
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.fc(x)
        return x

def get_model():
    return CancerDetectionModel()

def preprocess_image(image_path):
    # Define the same transforms used during training
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # Load and preprocess the image
    image = Image.open(image_path).convert('RGB')
    image_tensor = transform(image)
    return image_tensor.unsqueeze(0)  # Add batch dimension

def predict(image_path, model_path):
    try:
        # Check if model file exists
        if not os.path.exists(model_path):
            return {
                "success": False,
                "error": f"Model file not found at {model_path}"
            }
        
        # Initialize model architecture
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model = get_model()
        
        # Load the state dict
        state_dict = torch.load(model_path, map_location=device)
        
        # Remove 'model.' prefix from state dict keys if present
        if all(k.startswith('model.') for k in state_dict.keys()):
            state_dict = {k.replace('model.', ''): v for k, v in state_dict.items()}
        
        # Debug print
        print("Model state dict keys:", state_dict.keys())
        print("Model's state dict keys:", model.state_dict().keys())
        
        # Load state dict
        model.load_state_dict(state_dict)
        model = model.to(device)
        model.eval()
        
        # Preprocess image
        image_tensor = preprocess_image(image_path).to(device)
        
        # Make prediction
        with torch.no_grad():
            output = model(image_tensor)
            probability = torch.sigmoid(output).item()
        
        return {
            "success": True,
            "probability": probability,
            "prediction": "Cancerous" if probability > 0.5 else "Non-cancerous",
            "confidence": probability if probability > 0.5 else 1 - probability
        }
    except Exception as e:
        print(f"Error during prediction: {str(e)}")  # Add debug print
        return {
            "success": False,
            "error": str(e)
        }

def main():
    # Get image path from user
    print("\nEnter the path to your image (e.g., path/to/your/image.jpg):")
    print("Note: Do not include quotes around the path")
    image_path = input("> ").strip()
    
    # Remove quotes if the user included them anyway
    image_path = image_path.strip('"\'')
    
    if not image_path:
        image_path = "A:/HACK_NU_THON/zip1111/zip/dataset/train/benign/27.jpg"
        print(f"Using default image: {image_path}")
    
    # Get model path from user
    print("\nEnter the path to your model (e.g., path/to/your/model.pth):")
    print("Note: Do not include quotes around the path")
    model_path = input("> ").strip()
    
    # Remove quotes if the user included them anyway
    model_path = model_path.strip('"\'')
    
    if not model_path:
        model_path = "A:/HACK_NU_THON/zip1111/zip/dataset/train/benign/27.jpg"
        print(f"Using default model: {model_path}")
    
    # Make prediction
    result = predict(image_path, model_path)
    
    if result["success"]:
        print(f"\nPrediction for {image_path}:")
        print(f"Probability: {result['probability']}")
        print(f"Prediction: {result['prediction']}")
        print(f"Confidence: {result['confidence']}")
    else:
        print(f"\nError: {result['error']}")

if __name__ == "__main__":
    main()
    