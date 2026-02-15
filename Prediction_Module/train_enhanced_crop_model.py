import os
import pandas as pd
import numpy as np
import pickle
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# Setup paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATASETS_DIR = os.path.join(BASE_DIR, "datasets")
os.makedirs(MODELS_DIR, exist_ok=True)

# 1. Load Datasets
print("Loading datasets...")
df_soil = pd.read_csv(os.path.join(DATASETS_DIR, "Crop_recommendation.csv"))
df_prod = pd.read_csv(os.path.join(DATASETS_DIR, "Indian_crop_production_yield_dataset.csv"))

# 2. Normalize and Map Crop Names
print("Normalizing crop names...")

# MAPPING DICTIONARY (Model Name -> Dataset Name) from analysis
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

# Invert mapping for easier lookup: production_name -> soil_name
PROD_TO_SOIL_MAP = {}
for soil_name, prod_names in CROP_NAME_MAPPING.items():
    for pn in prod_names:
        PROD_TO_SOIL_MAP[pn] = soil_name

# Get unique valid seasons per crop from Production Dataset
# We map production names back to soil names to link them
crop_seasons = {}

# Clean and normalize Production Dataset
df_prod['Crop'] = df_prod['Crop'].astype(str).str.lower().str.strip()
df_prod['Season'] = df_prod['Season'].astype(str).str.strip()

for crop in df_prod['Crop'].unique():
    # Determine the 'Standard' (Soil DB) name for this crop
    std_name = crop # Default
    if crop in PROD_TO_SOIL_MAP:
        std_name = PROD_TO_SOIL_MAP[crop]
    
    # Get all seasons this crop is grown in
    seasons = df_prod[df_prod['Crop'] == crop]['Season'].unique()
    valid_seasons = [s for s in seasons if s.lower() != 'nan' and s.lower() != 'whole year']
    
    if std_name not in crop_seasons:
        crop_seasons[std_name] = set()
    
    for s in valid_seasons:
        crop_seasons[std_name].add(s)

# Manual overrides for crops that might be missing or 'Whole Year'
# This ensures we don't drop crops completely if season data is messy
FALLBACK_SEASONS = ['Kharif', 'Rabi', 'Summer', 'Winter', 'Autumn'] 

print(f"Mapped seasons for {len(crop_seasons)} crops.")

# 3. Augment Soil Dataset with Seasons
print("Augmenting training data with Seasons...")

augmented_rows = []

for _, row in df_soil.iterrows():
    crop = row['label'].lower().strip()
    
    # Get valid seasons for this crop
    if crop in crop_seasons and crop_seasons[crop]:
        seasons_for_crop = list(crop_seasons[crop])
    else:
        # If no specific season found (e.g. coffee usually doesn't have season in this DB), 
        # distinct "Whole Year" or generic approach?
        # Let's assign it to ALL major seasons so it's recommendable anytime 
        # (or maybe 'Whole Year' if we support that label)
        seasons_for_crop = ['Whole Year'] 
    
    for season in seasons_for_crop:
        new_row = row.copy()
        new_row['Season'] = season
        augmented_rows.append(new_row)

df_augmented = pd.DataFrame(augmented_rows)

print(f"Original Size: {len(df_soil)}")
print(f"Augmented Size: {len(df_augmented)}")

# 4. Encoders & Training
print("Training Model...")

# Features: N, P, K, temperature, humidity, ph, rainfall, Season
# Season needs encoding
season_le = LabelEncoder()
df_augmented['Season_Encoded'] = season_le.fit_transform(df_augmented['Season'])

# Crop Label Encoding
crop_le = LabelEncoder()
df_augmented['label_encoded'] = crop_le.fit_transform(df_augmented['label'])

FEATURES = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall', 'Season_Encoded']
TARGET = 'label_encoded'

X = df_augmented[FEATURES]
y = df_augmented[TARGET]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

model = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

# 5. Evaluation & Saving
y_pred = model.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"Model Accuracy: {acc * 100:.2f}%")

# Save artifacts
pickle.dump(model, open(os.path.join(MODELS_DIR, "crop_model.pkl"), "wb"))
pickle.dump(crop_le, open(os.path.join(MODELS_DIR, "crop_label_encoder.pkl"), "wb"))
pickle.dump(season_le, open(os.path.join(MODELS_DIR, "season_label_encoder.pkl"), "wb"))

print("Model and Encoders saved successfully.")
