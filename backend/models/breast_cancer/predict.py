import torch
import torchvision.transforms as transforms
from PIL import Image
import os
import torch.nn as nn

class CancerDetectionModel(nn.Module):
    def __init__(self):
        super(CancerDetectionModel, self).__init__()
        # Initial conv layer
        self.conv1 = nn.Conv2d(3, 64, kernel_size=7, stride=2, padding=3, bias=False)
        self.bn1 = nn.BatchNorm2d(64)
        self.relu = nn.ReLU(inplace=True)
        self.maxpool = nn.MaxPool2d(kernel_size=3, stride=2, padding=1)
        
        # Layer 1
        self.layer1 = nn.Sequential(
            self._make_bottleneck_block(64, 64, 256, downsample=True),
            self._make_bottleneck_block(256, 64, 256),
            self._make_bottleneck_block(256, 64, 256)
        )
        
        # Layer 2
        self.layer2 = nn.Sequential(
            self._make_bottleneck_block(256, 128, 512, stride=2, downsample=True),
            self._make_bottleneck_block(512, 128, 512),
            self._make_bottleneck_block(512, 128, 512),
            self._make_bottleneck_block(512, 128, 512)
        )
        
        # Layer 3
        self.layer3 = nn.Sequential(
            self._make_bottleneck_block(512, 256, 1024, stride=2, downsample=True),
            self._make_bottleneck_block(1024, 256, 1024),
            self._make_bottleneck_block(1024, 256, 1024),
            self._make_bottleneck_block(1024, 256, 1024),
            self._make_bottleneck_block(1024, 256, 1024),
            self._make_bottleneck_block(1024, 256, 1024)
        )
        
        # Layer 4
        self.layer4 = nn.Sequential(
            self._make_bottleneck_block(1024, 512, 2048, stride=2, downsample=True),
            self._make_bottleneck_block(2048, 512, 2048),
            self._make_bottleneck_block(2048, 512, 2048)
        )
        
        # Final layers
        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
        self.fc = nn.Sequential(
            nn.Linear(2048, 1024),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(1024, 512),
            nn.ReLU(inplace=True),
            nn.Linear(512, 2)
        )
        
    def _make_bottleneck_block(self, in_channels, mid_channels, out_channels, stride=1, downsample=False):
        layers = nn.Sequential()
        
        # Downsample if needed
        if downsample:
            downsample_layers = nn.Sequential(
                nn.Conv2d(in_channels, out_channels, kernel_size=1, stride=stride, bias=False),
                nn.BatchNorm2d(out_channels)
            )
        else:
            downsample_layers = None
        
        # First 1x1 conv
        layers.add_module('conv1', nn.Conv2d(in_channels, mid_channels, kernel_size=1, stride=1, bias=False))
        layers.add_module('bn1', nn.BatchNorm2d(mid_channels))
        layers.add_module('relu1', nn.ReLU(inplace=True))
        
        # 3x3 conv
        layers.add_module('conv2', nn.Conv2d(mid_channels, mid_channels, kernel_size=3, stride=stride, padding=1, bias=False))
        layers.add_module('bn2', nn.BatchNorm2d(mid_channels))
        layers.add_module('relu2', nn.ReLU(inplace=True))
        
        # Second 1x1 conv
        layers.add_module('conv3', nn.Conv2d(mid_channels, out_channels, kernel_size=1, stride=1, bias=False))
        layers.add_module('bn3', nn.BatchNorm2d(out_channels))
        
        # Add downsample branch if needed
        if downsample_layers is not None:
            layers.add_module('downsample', downsample_layers)
        
        # Final ReLU
        layers.add_module('relu3', nn.ReLU(inplace=True))
        
        return layers
        
    def forward(self, x):
        x = self.conv1(x)
        x = self.bn1(x)
        x = self.relu(x)
        x = self.maxpool(x)
        
        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)
        
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
        
        # Debug print before modification
        print("Original state dict keys:", state_dict.keys())
        
        # Remove 'model.' prefix from state dict keys if present
        if any(k.startswith('model.') for k in state_dict.keys()):
            state_dict = {k.replace('model.', ''): v for k, v in state_dict.items()}
        
        # Debug print after modification
        print("Modified state dict keys:", state_dict.keys())
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
            probabilities = torch.softmax(output, dim=1)
            probability = probabilities[0][1].item()
        
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
    