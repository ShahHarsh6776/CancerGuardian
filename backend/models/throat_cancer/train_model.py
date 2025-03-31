import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image
import os
from cancer_detection_model import CancerDetectionModel

class CancerDataset(Dataset):
    def __init__(self, data_dir, transform=None):
        self.data_dir = data_dir
        self.transform = transform
        self.classes = ['benign', 'malignant']  # Subdirectories for each class
        
        self.images = []
        self.labels = []
        
        # Load images and labels from directory structure
        for class_idx, class_name in enumerate(self.classes):
            class_dir = os.path.join(data_dir, class_name)
            if os.path.exists(class_dir):
                for img_name in os.listdir(class_dir):
                    if img_name.endswith(('.jpg', '.jpeg', '.png')):
                        img_path = os.path.join(class_dir, img_name)
                        self.images.append(img_path)
                        self.labels.append(class_idx)
    
    def __len__(self):
        return len(self.images)
    
    def __getitem__(self, idx):
        img_path = self.images[idx]
        label = self.labels[idx]
        
        image = Image.open(img_path).convert('RGB')
        if self.transform:
            image = self.transform(image)
        
        return image, label

def train_model(model, train_loader, val_loader, num_epochs=10):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.model.parameters(), lr=0.001)
    
    best_val_acc = 0.0
    
    for epoch in range(num_epochs):
        # Training phase
        model.model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        for inputs, labels in train_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
        
        train_acc = 100. * correct / total
        print(f'Epoch [{epoch+1}/{num_epochs}]')
        print(f'Training Loss: {running_loss/len(train_loader):.3f}')
        print(f'Training Accuracy: {train_acc:.2f}%')
        
        # Validation phase
        model.model.eval()
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                outputs = model(inputs)
                _, predicted = outputs.max(1)
                val_total += labels.size(0)
                val_correct += predicted.eq(labels).sum().item()
        
        val_acc = 100. * val_correct / val_total
        print(f'Validation Accuracy: {val_acc:.2f}%\n')
        
        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), 'best_model.pth')

def main():
    # Data augmentation and normalization for training
    train_transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(10),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # Only normalization for validation
    val_transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # Create datasets
    train_dir = "dataset/train"  # Path to training data
    val_dir = "dataset/val"      # Path to validation data
    
    if not os.path.exists(train_dir):
        os.makedirs(os.path.join(train_dir, 'benign'))
        os.makedirs(os.path.join(train_dir, 'malignant'))
        print(f"Created training directories at {train_dir}")
        print("Please add training images to:")
        print(f"- {os.path.join(train_dir, 'benign')} (for non-cancer images)")
        print(f"- {os.path.join(train_dir, 'malignant')} (for cancer images)")
        return
    
    if not os.path.exists(val_dir):
        os.makedirs(os.path.join(val_dir, 'benign'))
        os.makedirs(os.path.join(val_dir, 'malignant'))
        print(f"Created validation directories at {val_dir}")
        print("Please add validation images to:")
        print(f"- {os.path.join(val_dir, 'benign')} (for non-cancer images)")
        print(f"- {os.path.join(val_dir, 'malignant')} (for cancer images)")
        return
    
    train_dataset = CancerDataset(train_dir, transform=train_transform)
    val_dataset = CancerDataset(val_dir, transform=val_transform)
    
    if len(train_dataset) == 0 or len(val_dataset) == 0:
        print("No images found in the dataset directories.")
        print("Please add images to the benign and malignant folders.")
        return
    
    # Create data loaders
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)
    
    # Initialize and train the model
    model = CancerDetectionModel()
    train_model(model, train_loader, val_loader)
    print("Training completed! Model saved as 'best_model.pth'")

if __name__ == "__main__":
    main()
