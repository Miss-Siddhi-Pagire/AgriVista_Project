import requests
import os

# Configuration
API_URL = "http://localhost:7000/api/ml/predict-disease"
TEST_IMAGE_PATH = r"c:\Users\Sai PC\Desktop\AgriVista\Disease_Detection\Plant Village Dataset\Test\Cherry - Healthy\06904803-b778-4d54-b7ac-fd3f28cc82d9___JR_HL 9820.JPG"

def test_cherry():
    if not os.path.exists(TEST_IMAGE_PATH):
        print(f"Test image not found at {TEST_IMAGE_PATH}")
        return

    print(f"Testing Cherry Healthy image with the IMPROVED model...")
    
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
        print(f"Error connecting to Proxy: {e}")

if __name__ == "__main__":
    test_cherry()
