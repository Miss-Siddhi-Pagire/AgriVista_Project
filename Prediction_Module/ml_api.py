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

    prediction = crop_model.predict(features)
    crop = crop_le.inverse_transform(prediction)[0]

    collection.insert_one({
        "service": "Crop Recommendation",
        "inputs": data.dict(),
        "prediction": crop,
        "timestamp": datetime.now()
    })

    return {"recommended_crop": crop}


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

    prediction = fertilizer_model.predict(features)
    fertilizer = prediction[0]

    collection.insert_one({
        "service": "Fertilizer Suggestion",
        "inputs": data.dict(),
        "prediction": fertilizer,
        "timestamp": datetime.now()
    })

    return {"recommended_fertilizer": fertilizer}
