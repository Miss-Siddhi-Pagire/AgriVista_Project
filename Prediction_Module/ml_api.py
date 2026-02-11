from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import numpy as np
from pymongo import MongoClient
from datetime import datetime
import os

# ---------------------------
# FastAPI App
# ---------------------------
app = FastAPI()

# ---------------------------
# CORS
# ---------------------------
origins = [
    "http://localhost:5173",  # React (Vite)
    "http://localhost:3000",
    "http://localhost:7000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Load Models
# ---------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

crop_model = pickle.load(open(os.path.join(BASE_DIR, "models/crop_model.pkl"), "rb"))
crop_le = pickle.load(open(os.path.join(BASE_DIR, "models/crop_label_encoder.pkl"), "rb"))
yield_model = pickle.load(open(os.path.join(BASE_DIR, "models/yield_model.pkl"), "rb"))
fertilizer_model = pickle.load(open(os.path.join(BASE_DIR, "models/fertilizer_model.pkl"), "rb"))
fertilizer_le = pickle.load(open(os.path.join(BASE_DIR, "models/fertilizer_label_encoder.pkl"), "rb"))

# ---------------------------
# MongoDB
# ---------------------------
client = MongoClient("mongodb://127.0.0.1:27017/AgriVista")
db = client["AgriVista"]
collection = db["details"]

# ======================================================
# REQUEST SCHEMAS
# ======================================================

class CropRequest(BaseModel):
    Nitrogen: float
    Phosphorus: float
    Potassium: float
    Temperature: float
    Humidity: float
    pH: float
    Rainfall: float


class YieldRequest(BaseModel):
    soil_moisture: float
    pH: float
    temperature: float
    rainfall: float
    humidity: float
    total_days: int
    area: float | None = None


class FertilizerRequest(BaseModel):
    Nitrogen: float
    Phosphorus: float
    Potassium: float
    soil_type: str
    crop_type: str


# ======================================================
# ROUTES
# ======================================================

# ---------------------------
# Crop Recommendation (UNCHANGED)
# ---------------------------
@app.post("/predict-crop")
def predict_crop(data: CropRequest):
    features = np.array([[
        data.Nitrogen,
        data.Phosphorus,
        data.Potassium,
        data.Temperature,
        data.Humidity,
        data.pH,
        data.Rainfall
    ]])

    # Get probabilities instead of single prediction
    proba = crop_model.predict_proba(features)[0]
    
    # Get top 4 indices
    top_4_indices = proba.argsort()[-4:][::-1]
    
    # Get corresponding class names and probabilities
    top_4_classes = crop_le.inverse_transform(top_4_indices)
    top_4_probs = proba[top_4_indices]

    top_4_probs = proba[top_4_indices]

    # --- BOOSTING LOGIC (User Requested High Confidence & Closer Alternatives) ---
    # 1. Flatten distribution using 4th root (prob^0.25)
    boosted_probs = np.power(top_4_probs, 0.25)
    
    # 2. Scale to 0-100 range
    boosted_probs = boosted_probs * 100
    
    # Structure the result
    top_prediction = top_4_classes[0]
    alternatives = []
    
    for i in range(1, 4): # Skip the first one (top prediction)
        alternatives.append({
            "crop": top_4_classes[i],
            "probability": round(float(boosted_probs[i]), 2)
        })

    # Convert numpy types to native Python types for JSON serialization
    response_data = {
        "recommended_crop": top_prediction,
        "confidence": round(float(boosted_probs[0]), 2), # Use boosted score
        "alternatives": alternatives
    }

    collection.insert_one({
        "service": "Crop Recommendation",
        "inputs": data.dict(),
        "prediction": response_data,
        "timestamp": datetime.now()
    })

    return response_data


# ---------------------------
# Yield Prediction
# ---------------------------
@app.post("/predict-yield")
def predict_yield(data: YieldRequest):
    features = np.array([[
        data.soil_moisture,
        data.pH,
        data.temperature,
        data.rainfall,
        data.humidity,
        0.5, # Default NDVI index since user input is removed
        data.total_days
    ]])

    prediction = yield_model.predict(features)
    yield_value = round(float(prediction[0]), 2)

    collection.insert_one({
        "service": "Yield Prediction",
        "inputs": data.dict(),
        "prediction": yield_value,
        "timestamp": datetime.now()
    })

    return {
        "estimated_yield": yield_value,
        "unit": "tons/hectare"
    }


# ---------------------------
# Fertilizer Recommendation
# ---------------------------
@app.post("/predict-fertilizer")
def predict_fertilizer(data: FertilizerRequest):
    # Model trained only on N, P, K
    features = np.array([[data.Nitrogen, data.Phosphorus, data.Potassium, 0, 0, 0]])

    # Get probabilities
    proba = fertilizer_model.predict_proba(features)[0]
    
    # Get top 4 indices
    top_4_indices = proba.argsort()[-4:][::-1]
    
    # Get corresponding class names and probabilities
    try:
        top_4_classes = fertilizer_le.inverse_transform(top_4_indices)
    except:
        # Fallback if model was trained on strings directly and has classes_
        top_4_classes = fertilizer_model.classes_[top_4_indices]

    top_4_probs = proba[top_4_indices]

    top_4_probs = proba[top_4_indices]

    # --- BOOSTING LOGIC ---
    boosted_probs = np.power(top_4_probs, 0.25)
    boosted_probs = boosted_probs * 100

    # Structure the result
    top_prediction = top_4_classes[0]
    alternatives = []
    
    for i in range(1, len(top_4_classes)): # Iterate available classes (up to 4)
        alternatives.append({
            "fertilizer": top_4_classes[i],
            "probability": round(float(boosted_probs[i]), 2)
        })

    # Convert numpy types
    response_data = {
        "recommended_fertilizer": top_prediction,
        "confidence": round(float(boosted_probs[0]), 2),
        "alternatives": alternatives
    }

    collection.insert_one({
        "service": "Fertilizer Suggestion",
        "inputs": data.dict(),
        "prediction": response_data,
        "timestamp": datetime.now()
    })

    return response_data
