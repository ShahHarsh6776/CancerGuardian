# CancerGuardian - Medical Image Analysis System

CancerGuardian is an advanced medical image analysis system that uses deep learning to detect various types of cancer from medical images. The system currently supports detection of:
- Breast Cancer
- Throat Cancer
- Skin Cancer

## Features

- Deep learning-based image analysis using PyTorch
- ResNet-based architecture for high accuracy
- Support for multiple cancer types
- User-friendly interface for image upload and analysis
- Real-time predictions with confidence scores

## Project Structure

```
CancerGuardian/
├── backend/
│   ├── models/
│   │   ├── breast_cancer/
│   │   │   ├── predict.py
│   │   │   └── best_model.pth
│   │   └── throat_cancer/
│   │       ├── predict.py
│   │       └── best_model.pth
│   └── app.py
├── client/
│   └── src/
│       └── pages/
│           └── advanced-test.tsx
├── requirements.txt
└── README.md
```

## Requirements

- Python 3.8+
- PyTorch 2.0+
- torchvision
- PIL (Python Imaging Library)
- FastAPI (for backend)
- React (for frontend)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/CancerGuardian.git
cd CancerGuardian
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Install frontend dependencies:
```bash
cd client
npm install
```

## Usage

1. Start the backend server:
```bash
cd backend
uvicorn app:app --reload
```

2. Start the frontend development server:
```bash
cd client
npm run dev
```

3. Access the application at `http://localhost:3000`

## Model Architecture

The system uses a modified ResNet architecture with the following key features:
- Initial convolution layer with 64 channels
- Four main layers with bottleneck blocks
- Global average pooling
- Fully connected layers for classification
- Binary output (Cancerous/Non-cancerous)

## API Endpoints

- `POST /api/predict/breast`: Analyze breast cancer images
- `POST /api/predict/throat`: Analyze throat cancer images

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to all contributors who have helped with the development
- Special thanks to the medical professionals who provided guidance and validation 
