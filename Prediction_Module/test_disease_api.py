import requests
import os

# Configuration
API_URL = "http://localhost:10000/predict-disease"
# Using a fixed path for a test image from the Apple - Apple Scab directory
TEST_IMAGE_PATH = r"c:\Users\Sai PC\Desktop\AgriVista\Disease_Detection\Plant Village Dataset\Test\Apple - Apple Scab\03354abb-aa1c-4f9d-a1ef-9f40505cd539___FREC_Scab 3355.JPG"

def test_disease_api():
    if not os.path.exists(TEST_IMAGE_PATH):
        print(f"Test image not found at {TEST_IMAGE_PATH}")
        return

    print(f"Testing API at {API_URL} with image {os.path.basename(TEST_IMAGE_PATH)}...")
    
    try:
        with open(TEST_IMAGE_PATH, "rb") as f:
            files = {"file": f}
            response = requests.post(API_URL, files=files)
        
        if response.status_code == 200:
            print("Success!")
            print("Response:", response.json())
        else:
            print(f"Failed with status code {response.status_code}")
            print("Detail:", response.text)
            
    except Exception as e:
        print(f"Error connecting to API: {e}")

if __name__ == "__main__":
    test_disease_api()
