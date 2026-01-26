import os
import pandas as pd
import pickle
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score

# Create models folder
os.makedirs("models", exist_ok=True)

# Load dataset
df = pd.read_csv("datasets/Smart_Farming_Crop_Yield_2024.csv")

# Rename columns for consistency
df.rename(columns={
    'soil_moisture_%': 'soil_moisture',
    'soil_pH': 'ph',
    'temperature_C': 'temperature',
    'rainfall_mm': 'rainfall',
    'humidity_%': 'humidity'
}, inplace=True)

FEATURES = [
    'soil_moisture',
    'ph',
    'temperature',
    'rainfall',
    'humidity',
    'NDVI_index',
    'total_days'
]

TARGET = 'yield_kg_per_hectare'

X = df[FEATURES]
y = df[TARGET]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = RandomForestRegressor(
    n_estimators=300,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)

print("R2 Score:", r2_score(y_test, model.predict(X_test)))

pickle.dump(model, open("models/yield_model.pkl", "wb"))
