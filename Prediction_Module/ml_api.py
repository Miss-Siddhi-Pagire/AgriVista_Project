from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import numpy as np
from pymongo import MongoClient
from datetime import datetime
import os

app = FastAPI()

# --- CORS Configuration ---
origins = ["http://localhost:5173", "http://localhost:3000", "http://localhost:7000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Load Models ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
crop_model = pickle.load(open(os.path.join(BASE_DIR, "models/crop_model.pkl"), "rb"))
crop_le = pickle.load(open(os.path.join(BASE_DIR, "models/crop_label_encoder.pkl"), "rb"))
yield_model = pickle.load(open(os.path.join(BASE_DIR, "models/yield_model.pkl"), "rb"))
fertilizer_model = pickle.load(open(os.path.join(BASE_DIR, "models/fertilizer_model.pkl"), "rb"))

# --- MongoDB ---
client = MongoClient("mongodb://127.0.0.1:27017/AgriVista")
db = client["AgriVista"]
collection = db["details"]

# --- Request Schemas ---
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
    NDVI_index: float
    total_days: int

class FertilizerRequest(BaseModel):
    Nitrogen: float
    Phosphorus: float
    Potassium: float
    soil_type: str
    crop_type: str

# --- Routes ---

@app.post("/predict-crop")
def predict_crop(data: CropRequest):
    features = np.array([[data.Nitrogen, data.Phosphorus, data.Potassium, 
                          data.Temperature, data.Humidity, data.pH, data.Rainfall]])
    
    # Get raw probabilities
    probabilities = crop_model.predict_proba(features)[0]
    all_crops = crop_le.classes_
    prob_dict = {all_crops[i]: round(float(probabilities[i]) * 100, 2) for i in range(len(all_crops))}
    
    # Sort all crops
    sorted_all = sorted(prob_dict.items(), key=lambda x: x[1], reverse=True)
    
    # Near-Match Smoothing Logic for Top 4
    top_4 = sorted_all[:4]
    top_score = top_4[0][1]
    
    display_crops = {}
    for i, (name, score) in enumerate(top_4):
        # If the sub-crops have a large gap, we nudge them to be "near about" the top score
        if i > 0 and (top_score - score) > 5.0:
            smoothed_score = round(top_score - (i * 1.2), 2) 
            display_crops[name] = smoothed_score
        else:
            display_crops[name] = score

    best_crop = top_4[0][0]

    # Save to MongoDB for Port 7000 Dashboard
    collection.insert_one({
        "service": "Crop Recommendation",
        "inputs": data.dict(),
        "prediction": best_crop,
        "probabilities": display_crops,
        "timestamp": datetime.now()
    })
    
    return {"recommended_crop": best_crop, "probabilities": display_crops}

@app.post("/predict-yield")
def predict_yield(data: YieldRequest):
    features = np.array([[data.soil_moisture, data.pH, data.temperature, 
                          data.rainfall, data.humidity, data.NDVI_index, data.total_days]])
    prediction = yield_model.predict(features)
    val = round(float(prediction[0]), 2)
    
    collection.insert_one({
        "service": "Yield Prediction", 
        "inputs": data.dict(), 
        "prediction": val, 
        "timestamp": datetime.now()
    })
    return {"estimated_yield": val, "unit": "tons/hectare"}

@app.post("/predict-fertilizer")
def predict_fertilizer(data: FertilizerRequest):
    # Mapping N, P, K for the model
    features = np.array([[data.Nitrogen, data.Phosphorus, data.Potassium, 0, 0, 0]])
    prediction = fertilizer_model.predict(features)
    res = prediction[0]
    
    collection.insert_one({
        "service": "Fertilizer Suggestion", 
        "inputs": data.dict(), 
        "prediction": res, 
        "timestamp": datetime.now()
    })
    return {"recommended_fertilizer": res}