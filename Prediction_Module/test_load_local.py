import pickle
import numpy as np
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

print("Testing Model Loading...")

try:
    print("Loading Season LE...")
    season_le = pickle.load(open(os.path.join(BASE_DIR, "models/season_label_encoder.pkl"), "rb"))
    print("Season LE Loaded.")

    print("Loading Crop Model...")
    crop_model = pickle.load(open(os.path.join(BASE_DIR, "models/crop_model.pkl"), "rb"))
    print("Crop Model Loaded.")

    print("Loading Crop LE...")
    crop_le = pickle.load(open(os.path.join(BASE_DIR, "models/crop_label_encoder.pkl"), "rb"))
    print("Crop LE Loaded.")

    print("Simulating Prediction...")
    # Mock data
    features = np.array([[90, 42, 43, 25, 70, 6.5, 200, 0]]) # Dummy season encoded 0
    proba = crop_model.predict_proba(features)[0]
    print(f"Prediction Success! Probs: {proba[:2]}...") # Print first 2 probs

except Exception as e:
    print(f"FAILED: {e}")
    sys.exit(1)
