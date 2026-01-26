import streamlit as st
import pickle
import numpy as np
from pymongo import MongoClient
from datetime import datetime

# ---------------------------
# MongoDB Setup
# ---------------------------
MONGO_URI = "mongodb://127.0.0.1:27017/AgriVista"
client = MongoClient(MONGO_URI)
db = client['AgriVista']
collection = db['details']

def store_prediction(data: dict):
    data['timestamp'] = datetime.now()
    collection.insert_one(data)

# ---------------------------
# Load Models Once
# ---------------------------
@st.cache_resource
def load_models():
    crop_model = pickle.load(open("models/crop_model.pkl", "rb"))
    crop_le = pickle.load(open("models/crop_label_encoder.pkl", "rb"))
    yield_model = pickle.load(open("models/yield_model.pkl", "rb"))
    fertilizer_model = pickle.load(open("models/fertilizer_model.pkl", "rb"))
    return crop_model, crop_le, yield_model, fertilizer_model

crop_model, crop_le, yield_model, fertilizer_model = load_models()

# ---------------------------
# Prediction Functions
# ---------------------------
def predict_crop(N, P, K, temperature, humidity, ph, rainfall):
    features = np.array([[N, P, K, temperature, humidity, ph, rainfall]])
    prediction = crop_model.predict(features)
    return crop_le.inverse_transform(prediction)[0]

def predict_yield(soil_moisture, ph, temperature, rainfall, humidity, NDVI_index, total_days):
    features = np.array([[soil_moisture, ph, temperature, rainfall, humidity, NDVI_index, total_days]])
    prediction = yield_model.predict(features)
    return round(float(prediction[0]), 2)

def predict_fertilizer(N, P, K, soil_type, crop_type):
    features = np.array([[N, P, K, 0, 0, 0]])
    prediction = fertilizer_model.predict(features)
    return prediction[0]

# ---------------------------
# Streamlit Layout
# ---------------------------
st.set_page_config(page_title="AgriVista – Smart Farming", layout="wide")
st.title("AgriVista – Smart Farming Assistant")

# Use Tabs for services to save vertical space
tab1, tab2, tab3 = st.tabs(["Crop Recommendation", "Yield Prediction", "Fertilizer Suggestion"])

# ---------------------------
# Tab 1: Crop Recommendation
# ---------------------------
with tab1:
    st.subheader("Soil & Climate Parameters")
    with st.form(key="crop_form"):
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            N = st.number_input("Nitrogen (N)", min_value=0.0, step=1.0)
            P = st.number_input("Phosphorus (P)", min_value=0.0, step=1.0)
        with col2:
            K = st.number_input("Potassium (K)", min_value=0.0, step=1.0)
            temperature = st.number_input("Temperature (°C)", min_value=0.0, step=0.5)
        with col3:
            humidity = st.number_input("Humidity (%)", min_value=0.0, step=0.5)
            rainfall = st.number_input("Rainfall (mm)", min_value=0.0, step=1.0)
        with col4:
            ph = st.number_input("Soil pH", min_value=0.0, max_value=14.0, step=0.1)

        submit_crop = st.form_submit_button("Predict Crop")
        if submit_crop:
            result = predict_crop(N, P, K, temperature, humidity, ph, rainfall)
            st.success(f"Recommended Crop: {result}")

            record = {
                "service": "Crop Recommendation",
                "inputs": {"N": N, "P": P, "K": K, "temperature": temperature,
                           "humidity": humidity, "rainfall": rainfall, "ph": ph},
                "prediction": result
            }
            store_prediction(record)
            st.info("Prediction and inputs stored in MongoDB successfully!")

# ---------------------------
# Tab 2: Yield Prediction
# ---------------------------
with tab2:
    st.subheader("Yield Prediction Parameters")
    with st.form(key="yield_form"):
        col1, col2, col3 = st.columns(3)
        with col1:
            soil_moisture = st.number_input("Soil Moisture (%)", min_value=0.0, step=0.5)
            NDVI_index = st.number_input("NDVI Index", min_value=0.0, step=0.01)
        with col2:
            ph = st.number_input("Soil pH", min_value=0.0, max_value=14.0, step=0.1)
            temperature = st.number_input("Temperature (°C)", min_value=0.0, step=0.5)
        with col3:
            rainfall = st.number_input("Rainfall (mm)", min_value=0.0, step=1.0)
            humidity = st.number_input("Humidity (%)", min_value=0.0, step=0.5)

        area = st.number_input("Area (hectares)", min_value=0.0, step=0.1)
        total_days = st.number_input("Total Days of Crop Growth", min_value=0, step=1)

        submit_yield = st.form_submit_button("Predict Yield")
        if submit_yield:
            result = predict_yield(soil_moisture, ph, temperature, rainfall, humidity, NDVI_index, total_days)
            st.success(f"Estimated Yield: {result} tons/hectare")

            record = {
                "service": "Yield Prediction",
                "inputs": {"soil_moisture": soil_moisture, "ph": ph, "temperature": temperature,
                           "rainfall": rainfall, "humidity": humidity,
                           "NDVI_index": NDVI_index, "total_days": total_days, "area": area},
                "prediction": result
            }
            store_prediction(record)
            st.info("Prediction and inputs stored in MongoDB successfully!")

# ---------------------------
# Tab 3: Fertilizer Suggestion
# ---------------------------
with tab3:
    st.subheader("Fertilizer Suggestion")
    with st.form(key="fertilizer_form"):
        col1, col2, col3 = st.columns(3)
        with col1:
            N = st.number_input("Nitrogen (N)", min_value=0.0, step=1.0)
            P = st.number_input("Phosphorus (P)", min_value=0.0, step=1.0)
        with col2:
            K = st.number_input("Potassium (K)", min_value=0.0, step=1.0)
            soil_type = st.selectbox("Soil Type", ["Sandy", "Loamy", "Clay"])
        with col3:
            crop_type = st.text_input("Crop Name")

        submit_fertilizer = st.form_submit_button("Predict Fertilizer")
        if submit_fertilizer:
            result = predict_fertilizer(N, P, K, soil_type, crop_type)
            st.success(f"Recommended Fertilizer: {result}")

            record = {
                "service": "Fertilizer Suggestion",
                "inputs": {"N": N, "P": P, "K": K, "soil_type": soil_type, "crop_type": crop_type},
                "prediction": result
            }
            store_prediction(record)
            st.info("Prediction and inputs stored in MongoDB successfully!")
