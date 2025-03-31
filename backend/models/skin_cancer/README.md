# Cancer Detection Model

A deep learning model for detecting cancer from medical images using PyTorch and ResNet50 architecture.

## Features

- Supports multiple types of medical images (X-rays, MRI, microscope images)
- Automatic validation of medical images
- Confidence scores for predictions
- Data augmentation during training
- Easy-to-use training and prediction scripts

## Project Structure

```
.
├── cancer_detection_model.py  # Main model architecture
├── train_model.py            # Training script
├── test_model.py            # Testing/inference script
├── requirements.txt         # Python dependencies
└── dataset/                # Dataset directory
    ├── train/             
    │   ├── benign/        # Non-cancer training images
    │   └── malignant/     # Cancer training images
    └── val/
        ├── benign/        # Non-cancer validation images
        └── malignant/     # Cancer validation images
```

## Setup

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/cancer-detection-model.git
cd cancer-detection-model
```

2. Create a virtual environment and install dependencies:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Prepare your dataset:
   - Place non-cancer images in `dataset/train/benign/` and `dataset/val/benign/`
   - Place cancer images in `dataset/train/malignant/` and `dataset/val/malignant/`

## Training

To train the model:
```bash
python train_model.py
```

The script will:
1. Load images from the dataset directory
2. Train the model using data augmentation
3. Validate on the validation set
4. Save the best model as 'best_model.pth'

## Testing

To test the model with your images:
```bash
python test_model.py
```

The model will:
1. Validate if the image is a medical image
2. Provide cancer detection results with confidence scores

## Model Architecture

- Base: ResNet50 pretrained on ImageNet
- Custom layers added for cancer detection
- Binary classification (cancer/non-cancer)
- Image validation for medical image characteristics

## Requirements

- Python 3.8+
- PyTorch
- torchvision
- PIL
- numpy
- scikit-learn

## License

MIT License
