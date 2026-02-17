from fastapi import FastAPI, HTTPException
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
season_le = pickle.load(open(os.path.join(BASE_DIR, "models/season_label_encoder.pkl"), "rb")) # NEW
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
    State: str | None = None
    District: str | None = None
    Season: str | None = None


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


# ---------------------------
# Crop Recommendation (ENHANCED)
# ---------------------------
@app.post("/predict-crop")
def predict_crop(data: CropRequest):
    try:
        return _predict_crop_internal(data)
    except Exception as e:
        import traceback
        error_msg = f"Error in predict_crop: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        with open("error_log.txt", "w") as f:
            f.write(error_msg)
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

def _predict_crop_internal(data: CropRequest):
    
    # Encode Season
    try:
        if data.Season:
            season_encoded = season_le.transform([data.Season.strip()])[0]
        else:
             # Handle missing season if necessary, though it should be required for this logic
             # For now, let's use a default or catch-all if possible, or raise error. 
             # Given the user flow, season is expected.
             # If unknown, maybe use a dummy value or try to be robust.
             # Let's default to a safe value or 0 if we must, but printing warning is good.
             print("Warning: Season missing in request")
             season_encoded = 0 
    except Exception as e:
        print(f"Error encoding season '{data.Season}': {e}")
        raise HTTPException(status_code=400, detail=f"Invalid Season: {data.Season}. Supported seasons: {list(season_le.classes_)}")

    features = np.array([[
        data.Nitrogen,
        data.Phosphorus,
        data.Potassium,
        data.Temperature,
        data.Humidity,
        data.pH,
        data.Rainfall,
        season_encoded
    ]])

    # Get probabilities from Random Forest Model
    proba = crop_model.predict_proba(features)[0]
    classes = crop_model.classes_

    # Decode labels to crop names
    try:
        class_names = crop_le.inverse_transform(classes)
    except Exception as e:
        print(f"Error decoding labels: {e}")
        class_names = [str(c) for c in classes]

    # Create a dictionary of crop -> probability
    crop_probs = dict(zip(class_names, proba))

    # --- STRICT FILTERING LOGIC (PRIMARY) ---
    if df is not None and data.State and data.District and data.Season:
        # Normalize inputs for matching (Case-Insensitive)
        state_lower = data.State.strip().lower()
        district_lower = data.District.strip().lower()
        season_lower = data.Season.strip().lower()

        # Find crops grown in this specific location & season in history
        # Optimized: Columns are already lowercase and categorical
        historical_crops = df[
            (df['State_Name'] == state_lower) & 
            (df['District_Name'] == district_lower) & 
            (df['Season'] == season_lower)
        ]['Crop'].unique()
        
        # Normalize historical crop names
        historical_crops_lower = set([str(c).lower().strip() for c in historical_crops if c is not None])

        # MAPPING DICTIONARY (Model Name -> Dataset Name)
        CROP_NAME_MAPPING = {
            'chickpea': ['gram', 'bengal gram'],
            'kidneybeans': ['rajmash kholar', 'rajma', 'beans & mutter(vegetable)'],
            'mothbeans': ['moth'],
            'mungbean': ['moong(green gram)'],
            'blackgram': ['urad'],
            'lentil': ['masoor'],
            'pigeonpeas': ['arhar/tur', 'redgram'],
            'cotton': ['cotton(lint)', 'kapas'],
            'jute': ['jute & mesta'],
            'pomegranate': ['pome granet', 'pomegranate'],
            'watermelon': ['water melon'],
            'muskmelon': ['musk melon'],
            'apple': ['apple'],
            'orange': ['citrus fruit', 'orange'],
            'papaya': ['papaya'],
            'coconut': ['coconut'],
            'grapes': ['grapes'],
            'banana': ['banana'],
            'maize': ['maize'],
            'rice': ['rice', 'paddy'],
            'coffee': ['coffee'],
            'tea': ['tea']
        }

        # Create a set of "Strictly Valid" crops (Region + Season Support)
        strict_valid_crops = set()
        
        crop_models_classes = crop_le.classes_
        for model_crop in crop_models_classes: # Cache classes
            model_crop_lower = str(model_crop).lower().strip()
            # 1. Direct Match
            if model_crop_lower in historical_crops_lower:
                strict_valid_crops.add(model_crop)
            # 2. Mapped Match
            elif model_crop_lower in CROP_NAME_MAPPING:
                potential_names = CROP_NAME_MAPPING[model_crop_lower]
                if any(name in historical_crops_lower for name in potential_names):
                    strict_valid_crops.add(model_crop)
        
        # --- HYBRID SUGGESTION LOGIC ---
        # 1. Get Strict Matches (filtered by soil probability)
        # We still want to respect the soil model's opinion on these strict matches.
        strict_matches_probs = {}
        for crop, prob in crop_probs.items():
            if crop in strict_valid_crops:
                strict_matches_probs[crop] = prob
        
        # Sort strict matches by probability
        sorted_strict_matches = sorted(strict_matches_probs.items(), key=lambda x: x[1], reverse=True)
        
        # 2. Get Soil Matches (purely based on environmental suitability, ignoring region)
        # Sort all crops by probability
        sorted_soil_matches = sorted(crop_probs.items(), key=lambda x: x[1], reverse=True)
        
        # 3. Combine to get exactly 4
        final_suggestions = []
        final_crop_names = set()

        # Add all strict matches first (up to 4)
        for crop, prob in sorted_strict_matches:
            if len(final_suggestions) < 4:
                final_suggestions.append((crop, prob))
                final_crop_names.add(crop)
        
        # If we have fewer than 4, fill with top soil matches
        if len(final_suggestions) < 4:
            for crop, prob in sorted_soil_matches:
                if len(final_suggestions) >= 4:
                    break
                if crop not in final_crop_names:
                    final_suggestions.append((crop, prob))
                    final_crop_names.add(crop) # Add to set to prevent duplicates if logic changes
        
        # If still empty (extremely rare), return detailed error
        if not final_suggestions:
             return {"error": f"Soil conditions (NPK/Weather) are totally unsuitable for any crop grown in {data.District} ({', '.join(list(historical_crops)[:5])}...)."}
        
        # Result uses the combined list
        # We need to re-normalize probabilities for the *displayed* options? 
        # Usually better to show raw soil confidence or re-normalize among selection.
        # Let's re-normalize among the selected 4 to sum to 100% for better UX,
        # OR just keep raw probability (which might be low if many classes).
        # Existing logic re-normalized. Let's re-normalize the final 4.
        
        # --- BOOSTING LOGIC (USER REQUEST: Main > 90%, Others > 80%) ---
        import random
        boosted_suggestions = []
        
        # We assume final_suggestions are already sorted by "real" probability or priority
        for i, (crop, _) in enumerate(final_suggestions):
            if i == 0:
                # Main Crop: 92% - 98%
                boosted_conf = random.uniform(0.92, 0.98)
            elif i == 1:
                # 2nd Option: 86% - 89%
                boosted_conf = random.uniform(0.86, 0.89)
            elif i == 2:
                 # 3rd Option: 83% - 86%
                boosted_conf = random.uniform(0.83, 0.86)
            else:
                 # 4th Option: 80% - 83%
                boosted_conf = random.uniform(0.80, 0.83)
            
            boosted_suggestions.append((crop, boosted_conf))
            
        top_4_crops = boosted_suggestions

    else:
        # No strict filtering (missing location/season or dataset), use standard top 4
        sorted_crops = sorted(crop_probs.items(), key=lambda x: x[1], reverse=True)
        top_4_crops = sorted_crops[:4]
    
    # Structure the result
    top_prediction = str(top_4_crops[0][0])
    top_conf = float(top_4_crops[0][1]) * 100 

    alternatives = []
    for i in range(1, len(top_4_crops)):
        alternatives.append({
            "crop": str(top_4_crops[i][0]),
            "probability": round(float(top_4_crops[i][1]) * 100, 2)
        })

    # Convert numpy types to native Python types for JSON serialization
    response_data = {
        "recommended_crop": top_prediction,
        "confidence": round(top_conf, 2),
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
    return response_data


# ---------------------------
# Season-wise Crop Recommendation
# ---------------------------

# Load dataset once at startup
try:
    import pandas as pd
    DATASET_PATH = os.path.join(BASE_DIR, "datasets/Indian_crop_production_yield_dataset.csv")
    
    if os.path.exists(DATASET_PATH):
        # OPTIMIZED LOAD: Only necessary columns
        use_cols = ['State_Name', 'District_Name', 'Season', 'Crop', 'yield', 'Production']
        df = pd.read_csv(DATASET_PATH, usecols=use_cols)
        
        # Clean and Optimize Types (In-place to save RAM)
        # 1. Strip and Lowercase (Overwriting original columns to save 50% memory)
        for col in ['State_Name', 'District_Name', 'Season', 'Crop']:
            df[col] = df[col].astype(str).str.strip().str.lower().astype('category')

        # CACHE UNIQUE VALUES (These will be lowercase now)
        # To get "Nice" display names, we might need a separate small mapping or just Capitalize on the fly
        # For now, let's just Title Case them for the API response which is cheap
        
        CACHED_SEASONS = sorted([s.title() for s in df['Season'].cat.categories.tolist() if s and s != 'nan'])
        CACHED_STATES = sorted([s.title() for s in df['State_Name'].cat.categories.tolist() if s and s != 'nan'])
        
        # PRE-COMPUTE LOCATION HIERARCHY (Optimized)
        CACHED_LOCATIONS = {}
        for state in df['State_Name'].cat.categories:
            if state == 'nan': continue
            # Filter matches
            districts = df[df['State_Name'] == state]['District_Name'].unique().tolist()
            # Convert to Title Case for display
            CACHED_LOCATIONS[state.title()] = sorted([d.title() for d in districts if d and d != 'nan'])

        print(f"Dataset loaded successfully: {len(df)} records (Optimized)")
        
        # Explicit garbage collection
        import gc
        gc.collect()
        
    else:
        print(f"Dataset not found at {DATASET_PATH}")
        df = None
        CACHED_SEASONS = []
        CACHED_LOCATIONS = {}
        CACHED_STATES = []
except Exception as e:
    print(f"Error loading dataset: {e}")
    df = None
    CACHED_SEASONS = []
    CACHED_LOCATIONS = {}
    CACHED_STATES = []


@app.get("/locations")
def get_locations():
    if df is None:
        return {"error": "Dataset not available", "states": [], "locations": {}}
    
    # Return cached data immediately
    return {
        "states": CACHED_STATES,
        "locations": CACHED_LOCATIONS
    }

@app.get("/seasons")
def get_seasons():
    if df is None:
        return {"error": "Dataset not available", "seasons": []}
    
    # Return cached data immediately
    return {"seasons": CACHED_SEASONS}


class SeasonRecommendationRequest(BaseModel):
    state: str
    district: str
    season: str


@app.post("/recommend-season-commodity")
def recommend_season_commodity(data: SeasonRecommendationRequest):
    if df is None:
        return {"error": "Dataset not available"}
    
    # Filter dataset (Case-Insensitive - Optimized)
    # Columns are already lowercase in the dataframe
    filtered_df = df[
        (df['State_Name'] == data.state.strip().lower()) & 
        (df['District_Name'] == data.district.strip().lower()) & 
        (df['Season'] == data.season.strip().lower())
    ]
