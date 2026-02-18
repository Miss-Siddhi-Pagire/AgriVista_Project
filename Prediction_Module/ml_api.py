from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import numpy as np
from pymongo import MongoClient
from datetime import datetime
import os
import gc
import psutil

def print_memory(tag=""):
    process = psutil.Process(os.getpid())
    mem_info = process.memory_info()
    print(f"[{tag}] Memory Usage: {mem_info.rss / 1024 / 1024:.2f} MB")

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
# Load Models (LAZY LOADING)
# ---------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Global variables to hold models (initialized as None)
crop_model = None
crop_le = None
season_le = None
yield_model = None
fertilizer_model = None
fertilizer_le = None

def get_crop_model():
    global crop_model
    if crop_model is None:
        crop_model = pickle.load(open(os.path.join(BASE_DIR, "models/crop_model.pkl"), "rb"))
    return crop_model

def get_crop_le():
    global crop_le
    if crop_le is None:
        crop_le = pickle.load(open(os.path.join(BASE_DIR, "models/crop_label_encoder.pkl"), "rb"))
    return crop_le

def get_season_le():
    global season_le
    if season_le is None:
        season_le = pickle.load(open(os.path.join(BASE_DIR, "models/season_label_encoder.pkl"), "rb"))
    return season_le
    
def get_yield_model():
    global yield_model
    if yield_model is None:
        yield_model = pickle.load(open(os.path.join(BASE_DIR, "models/yield_model.pkl"), "rb"))
    return yield_model

def get_fertilizer_model():
    global fertilizer_model
    if fertilizer_model is None:
        fertilizer_model = pickle.load(open(os.path.join(BASE_DIR, "models/fertilizer_model.pkl"), "rb"))
    return fertilizer_model

def get_fertilizer_le():
    global fertilizer_le
    if fertilizer_le is None:
        fertilizer_le = pickle.load(open(os.path.join(BASE_DIR, "models/fertilizer_label_encoder.pkl"), "rb"))
    return fertilizer_le

# ---------------------------
# MongoDB
# ---------------------------
# Use MONGO_URL environment variable if available (Render), else localhost
MONGO_URI = os.getenv("MONGO_URL", "mongodb://127.0.0.1:27017/AgriVista")

try:
    client = MongoClient(MONGO_URI)
    db = client["AgriVista"] # The database name is usually part of the URI in production, but let's be safe
    # If the URI includes the DB name, client.get_database() effectively returns it, 
    # but explicit access by name "AgriVista" works if the user's Atlas string is correct.
    # However, standard practice with Atlas is the DB name is in the connection string or we just use a specific one.
    # Let's trust the "AgriVista" name for now as per local setup.
    collection = db["details"]
    print(f"Connected to MongoDB at {MONGO_URI.split('@')[-1] if '@' in MONGO_URI else 'localhost'}")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    # Don't crash immediately, allow app to start but API calls might fail
    client = None
    collection = None

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
    # Lazy Load
    current_season_le = get_season_le()
    current_crop_model = get_crop_model()
    current_crop_le = get_crop_le()

    # Encode Season
    try:
        if data.Season:
            season_encoded = current_season_le.transform([data.Season.strip()])[0]
        else:
             print("Warning: Season missing in request")
             season_encoded = 0 
    except Exception as e:
        print(f"Error encoding season '{data.Season}': {e}")
        raise HTTPException(status_code=400, detail=f"Invalid Season: {data.Season}. Supported seasons: {list(current_season_le.classes_)}")

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
    try:
        proba = current_crop_model.predict_proba(features)[0]
        classes = current_crop_model.classes_
    except Exception as e:
        # Fallback if probability not supported or error
        print(f"Prediction Error (predict_proba failed): {e}. Falling back to predict.")
        prediction_encoded = current_crop_model.predict(features)[0]
        # Create dummy probabilities and classes for a single prediction
        classes = np.array([prediction_encoded])
        proba = np.array([1.0]) # Assign 100% confidence to the single predicted class

    # Decode labels to crop names
    try:
        class_names = current_crop_le.inverse_transform(classes)
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
        
        crop_models_classes = current_crop_le.classes_
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

    # Convert numpy types to native Python types for JSON serialization
    response_data = {
        "recommended_crop": top_prediction,
        "confidence": round(top_conf, 2),
        "alternatives": alternatives
    }

    try:
        if collection is not None:
            collection.insert_one({
                "service": "Crop Recommendation",
                "inputs": data.dict(),
                "prediction": response_data,
                "timestamp": datetime.now()
            })
    except Exception as e:
        print(f"DB Log Error: {e}")

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

    try:
        if collection is not None:
            collection.insert_one({
                "service": "Yield Prediction",
                "inputs": data.dict(),
                "prediction": yield_value,
                "timestamp": datetime.now()
            })
    except Exception as e:
        print(f"DB Log Error: {e}")

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
    
    # Lazy Load
    fertilizer_model = get_fertilizer_model()
    fertilizer_le = get_fertilizer_le()

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

    # Convert numpy types
    response_data = {
        "recommended_fertilizer": top_prediction,
        "confidence": round(float(boosted_probs[0]), 2),
        "alternatives": alternatives
    }

    try:
        if collection is not None:
            collection.insert_one({
                "service": "Fertilizer Suggestion",
                "inputs": data.dict(),
                "prediction": response_data,
                "timestamp": datetime.now()
            })
    except Exception as e:
        print(f"DB Log Error: {e}")

    return response_data


# ---------------------------
# Season-wise Crop Recommendation
# ---------------------------

# Load dataset once at startup
try:
    import pandas as pd
    DATASET_PATH = os.path.join(BASE_DIR, "datasets/Indian_crop_production_yield_dataset.csv")
    
    print_memory("Pre-Load")
    
    if os.path.exists(DATASET_PATH):
        # OPTIMIZED LOAD: Dropped 'yield' and 'Production' as they are not used for recommendation
        # This significantly reduces memory usage
        use_cols = ['State_Name', 'District_Name', 'Season', 'Crop']
        
        # Specify dtypes to minimize string object creation overhead
        dtype_spec = {
            'State_Name': 'category',
            'District_Name': 'category',
            'Season': 'category',
            'Crop': 'category'
        }
        
        # Load with optimization
        df = pd.read_csv(DATASET_PATH, usecols=use_cols, dtype=dtype_spec)
        
        # Clean categories (Strip/Lower) - Iterating categories is much faster than rows
        for col in use_cols:
            if hasattr(df[col], 'cat'):
                # Get current categories
                cats = df[col].cat.categories
                # Create a mapping of old -> new (cleaned)
                new_cats = [str(x).strip().lower() for x in cats]
                # If duplicates exist (e.g. 'Rice' and 'rice' both become 'rice'), we can't just rename.
                # We need to map the values to the new categories.
                
                # Check for duplicates in new_cats
                if len(new_cats) != len(set(new_cats)):
                    # Duplicates found! Need to collapse.
                    # Create a dictionary map
                    mapper = dict(zip(cats, new_cats))
                    # Map the column (this temporarily converts to object/code, but it's safe)
                    df[col] = df[col].map(mapper).astype('category')
                else:
                    # No duplicates, safe to rename
                    df[col] = df[col].cat.rename_categories(new_cats)

        # CACHE UNIQUE VALUES
        # filter out nan/empty
        CACHED_SEASONS = sorted([s.title() for s in df['Season'].cat.categories.tolist() if s and str(s) != 'nan'])
        CACHED_STATES = sorted([s.title() for s in df['State_Name'].cat.categories.tolist() if s and str(s) != 'nan'])
        
        # PRE-COMPUTE LOCATION HIERARCHY (Optimized via GroupBy)
        # GroupBy on Categorical columns is very fast
        CACHED_LOCATIONS = {}
        grouped = df.groupby('State_Name', observed=True)['District_Name'].unique()
        
        for state, districts in grouped.items():
            if str(state) == 'nan': continue
            display_state = state.title()
            # districts is a Categorical array
            display_districts = sorted([d.title() for d in districts.tolist() if d and str(d) != 'nan'])
            CACHED_LOCATIONS[display_state] = display_districts

        print(f"Dataset loaded successfully: {len(df)} records (Highly Optimized)")
        print_memory("Post-Load")
        
        # Explicit garbage collection
        gc.collect()
        print_memory("Post-GC")
        
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
    
    if filtered_df.empty:
        return {"recommendations": []}

    # Count crops in this condition
    crop_counts = filtered_df['Crop'].value_counts()
    
    # Get top 5 crops
    top_crops = crop_counts.head(5).index.tolist()
    
    # Capitalize for display
    formatted_crops = [crop.title() for crop in top_crops]
    
    return {"recommendations": formatted_crops}

# ---------------------------
# Health Check Endpoint
# ---------------------------
@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ML API"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
