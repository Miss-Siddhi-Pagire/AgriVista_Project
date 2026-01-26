import os
import pandas as pd
import pickle
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Create models folder
os.makedirs("models", exist_ok=True)

# Load dataset
df = pd.read_csv("datasets/Crop_and_fertilizer_dataset.csv")

# Rename columns to standard names
df.rename(columns={
    'Nitrogen': 'N',
    'Phosphorus': 'P',
    'Potassium': 'K',
    'Temperature': 'temperature',
    'pH': 'ph',
    'Rainfall': 'rainfall'
}, inplace=True)

FEATURES = ['N', 'P', 'K', 'temperature', 'ph', 'rainfall']
TARGET = 'Fertilizer'

X = df[FEATURES]
y = df[TARGET]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = RandomForestClassifier(
    n_estimators=300,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)

print("Accuracy:", accuracy_score(y_test, model.predict(X_test)))

pickle.dump(model, open("models/fertilizer_model.pkl", "wb"))
