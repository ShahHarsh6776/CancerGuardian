import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import numpy as np
import os

class CancerDetectionModel:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Create the same model architecture as used in training
        self.model = nn.Module()
        self.model.conv1 = nn.Conv2d(in_channels=3, out_channels=64, kernel_size=3, padding=1)
        self.model.conv2 = nn.Conv2d(in_channels=64, out_channels=128, kernel_size=3, padding=1)
        self.model.conv3 = nn.Conv2d(in_channels=128, out_channels=256, kernel_size=3, padding=1)
        self.model.pool = nn.MaxPool2d(kernel_size=2, stride=2)
        self.model.dropout = nn.Dropout(0.5)
        
        # Calculate the size of flattened features
        # After 3 pooling layers: 224 -> 112 -> 56 -> 28
        self.flatten_size = 256 * 28 * 28
        
        # Fully connected layers
        self.model.fc1 = nn.Linear(self.flatten_size, 512)
        self.model.fc2 = nn.Linear(512, 2)  # 2 classes: benign and malignant
        
        self.model = self.model.to(self.device)
        
        self.transform = transforms.Compose([
            transforms.Resize((256, 256)),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                              std=[0.229, 0.224, 0.225]),
        ])

    def forward(self, x):
        # Convolutional layers with ReLU and pooling
        x = self.model.pool(torch.relu(self.model.conv1(x)))
        x = self.model.pool(torch.relu(self.model.conv2(x)))
        x = self.model.pool(torch.relu(self.model.conv3(x)))
        
        # Flatten the output
        x = x.view(-1, self.flatten_size)
        
        # Fully connected layers with dropout
        x = torch.relu(self.model.fc1(x))
        x = self.model.dropout(x)
        x = self.model.fc2(x)
        return x

    def is_valid_medical_image(self, img):
        """Check if the image appears to be a medical image"""
        try:
            # Convert to grayscale for analysis
            gray_img = img.convert('L')
            img_array = np.array(gray_img)
            
            # Get image statistics
            mean_intensity = np.mean(img_array)
            std_intensity = np.std(img_array)
            
            # For skin cancer images, we need to be more lenient
            # as they can be regular photographs of skin
            if img.mode == 'RGB':
                rgb_img = np.array(img)
                color_std = np.std(rgb_img, axis=(0,1))
                color_variation = np.mean(color_std)
                
                # More lenient criteria for skin images
                # Skin images can have more color variation than typical medical images
                is_valid = (
                    # Check if it's not completely black or white
                    mean_intensity > 20 and mean_intensity < 240 and
                    # Check if there's some variation in the image
                    std_intensity > 5 and std_intensity < 100
                )
                
                return is_valid
            return False
        except Exception:
            return False

    def preprocess_image(self, img_path):
        try:
            # Load and check the image
            img = Image.open(img_path)
            img = img.convert('RGB')
            
            # Validate if it's a valid image
            if not self.is_valid_medical_image(img):
                return None, "Error: Please upload a valid image. The image appears to be corrupted or invalid."
            
            # Preprocess if valid
            img_tensor = self.transform(img)
            img_tensor = img_tensor.unsqueeze(0)
            return img_tensor.to(self.device), None
        except Exception as e:
            return None, f"Error: Unable to process image. Please reupload. Details: {str(e)}"

    def predict(self, img_path):
        # Preprocess the image
        img_tensor, error = self.preprocess_image(img_path)
        if error:
            return error

        # Make prediction
        self.model.eval()
        with torch.no_grad():
            outputs = self.forward(img_tensor)
            probabilities = torch.softmax(outputs, dim=1)[0]
            
            # Get probabilities for each class
            # Index 0: benign (non-skin cancer)
            # Index 1: malignant (skin cancer)
            non_cancer_prob = probabilities[0].item() * 100
            cancer_prob = probabilities[1].item() * 100
            
            # Make decision based on probabilities
            if cancer_prob > non_cancer_prob:
                if cancer_prob > 60:
                    return f"breast Cancer Detected (Confidence: {cancer_prob:.1f}%)"
                else:
                    return f"Possible breast Cancer (Low Confidence: {cancer_prob:.1f}%)\nRecommend further medical examination"
            else:
                return f"No  breast Cancer Detected (Confidence: {non_cancer_prob:.1f}%)"

# Example usage
if __name__ == "__main__":
    model = CancerDetectionModel()
    
    # Example prediction
    test_image_path = "path_to_test_image.jpg"
    if os.path.exists(test_image_path):
        result = model.predict(test_image_path)
        print(f"Prediction: {result}")
