from cancer_detection_model import CancerDetectionModel
import os

def test_model():
    print("Initializing Cancer Detection Model...")
    model = CancerDetectionModel()
    print("Model initialized successfully!")
    
    # Test with a sample image if provided
    test_image = "C:/Users/Harsh Umesh shah/OneDrive/Desktop/second/dataset/sample/028.jpeg"  # Replace with your test image path
    if os.path.exists(test_image):
        print(f"\nTesting with image: {test_image}")
        result = model.predict(test_image)
        print(f"Prediction: {result}")
    else:
        print(f"\nNo test image found at: {test_image}")
        print("Please provide a test image to make predictions")

if __name__ == "__main__":
    test_model()