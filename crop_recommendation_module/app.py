# app.py
import streamlit as st
import pickle
import numpy as np
import pandas as pd

# -------------------------------
# Streamlit must start here
# -------------------------------
st.set_page_config(page_title="AgriVista", layout="wide", page_icon="🌾")

# -------------------------------
# Load trained model and tools
# -------------------------------
model = pickle.load(open("rf_crop_model.pkl", "rb"))
scaler = pickle.load(open("feature_scaler.pkl", "rb"))
le = pickle.load(open("label_encoder.pkl", "rb"))

# Feature names used during training
feature_names = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']

# -------------------------------
# Title and description
# -------------------------------
st.markdown(
    """
    <h2 style='text-align:center;margin-bottom:5px;'>🌾 <b>AgriVista</b></h2>
    <p style='text-align:center;color:gray;font-size:15px;margin-top:-5px;'>
    Recommend the best crop based on soil and weather conditions
    </p>
    <hr style='margin:5px 0 10px 0;'>
    """,
    unsafe_allow_html=True
)

# -------------------------------
# Input section - Compact 2 Columns
# -------------------------------
col1, col2 = st.columns(2, gap="medium")

with col1:
    N = st.number_input("Nitrogen (N)", 0.0, 150.0, 50.0)
    P = st.number_input("Phosphorus (P)", 0.0, 150.0, 50.0)
    K = st.number_input("Potassium (K)", 0.0, 210.0, 50.0)
    temperature = st.number_input("Temperature (°C)", 0.0, 50.0, 25.0)

with col2:
    humidity = st.number_input("Humidity (%)", 0.0, 100.0, 60.0)
    ph = st.number_input("pH Value", 0.0, 14.0, 6.5)
    rainfall = st.number_input("Rainfall (mm)", 0.0, 300.0, 100.0)

# -------------------------------
# Inline Button + Result Section
# -------------------------------
st.markdown("<hr style='margin:10px 0;'>", unsafe_allow_html=True)
b_col, r_col = st.columns([1, 1.5])

predicted_crop = None

with b_col:
    if st.button("🌿 Recommend Crop", use_container_width=True):
        # Convert input to DataFrame to keep feature names
        input_df = pd.DataFrame([[N, P, K, temperature, humidity, ph, rainfall]], columns=feature_names)
        scaled_data = scaler.transform(input_df)
        prediction = model.predict(scaled_data)
        predicted_crop = le.inverse_transform(prediction)[0]

with r_col:
    if predicted_crop:
        st.markdown(
            f"<h4 style='color:green;text-align:left;margin-top:3px;'>✅ Recommended Crop: <b>{predicted_crop.upper()}</b></h4>",
            unsafe_allow_html=True
        )
