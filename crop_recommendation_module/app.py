# app.py
import streamlit as st
import pickle
import numpy as np
import pandas as pd
from pymongo import MongoClient

# -------------------------------
# Streamlit Page Config
# -------------------------------
st.set_page_config(page_title="AgriVista", layout="wide", page_icon="🌾")

# -------------------------------
# Load trained model and tools
# -------------------------------
model = pickle.load(open("rf_crop_model.pkl", "rb"))
scaler = pickle.load(open("feature_scaler.pkl", "rb"))
le = pickle.load(open("label_encoder.pkl", "rb"))

feature_names = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']

# -------------------------------
# Connect to MongoDB
# -------------------------------
try:
    client = MongoClient("mongodb://127.0.0.1:27017/AgriVista")
    db = client['AgriVista']
    collection = db['details']
    st.success("Connected to MongoDB successfully ✅")
except Exception as e:
    st.error(f"Failed to connect to MongoDB: {e}")

# -------------------------------
# Title
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
# User Info
# -------------------------------
st.subheader("User Details")
name = st.text_input("Enter Your Name")
email = st.text_input("Enter Your Email")

# -------------------------------
# Crop Inputs
# -------------------------------
st.subheader("Crop & Soil Data")
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
    soil_type = st.selectbox("Soil Type", ["Sandy", "Loamy", "Clay"])

# -------------------------------
# Predict & Save Button
# -------------------------------
st.markdown("<hr style='margin:10px 0;'>", unsafe_allow_html=True)
b_col, r_col = st.columns([1, 1.5])

predicted_crop = None
confidence = None

with b_col:
    if st.button("🌿 Recommend Crop & Save"):
        if not name or not email:
            st.warning("Please enter your Name and Email!")
        else:
            # Prepare input for ML model
            input_df = pd.DataFrame([[N, P, K, temperature, humidity, ph, rainfall]], columns=feature_names)
            scaled_data = scaler.transform(input_df)
            prediction = model.predict(scaled_data)
            predicted_crop = le.inverse_transform(prediction)[0]

            probabilities = model.predict_proba(scaled_data)
            confidence = np.max(probabilities) * 100

            # Prepare MongoDB data
            mongo_data = {
                "name": name,
                "email": email,
                "N": float(N),
                "P": float(P),
                "K": float(K),
                "temperature": float(temperature),
                "humidity": float(humidity),
                "ph": float(ph),
                "rainfall": float(rainfall),
                "soil_type": soil_type,
                "predicted_crop": predicted_crop,
                "confidence": float(confidence)
            }

            # Save to MongoDB with error handling
            try:
                collection.insert_one(mongo_data)
                st.success(f"Data saved for {name}! ✅")
                print("Saved to MongoDB:", mongo_data)
            except Exception as e:
                st.error(f"Failed to save data: {e}")

with r_col:
    if predicted_crop:
        st.markdown(
            f"""
            <h4 style='color:green;text-align:left;margin-top:3px;'>
                ✅ Recommended Crop: <b style='color:red'>{predicted_crop.upper()} ({confidence:.2f}%)</b>
            </h4>
            """,
            unsafe_allow_html=True
        )

# -------------------------------
# View User History (Optional)
# -------------------------------
st.markdown("<hr>", unsafe_allow_html=True)
st.subheader("View Your Previous Recommendations")
search_email = st.text_input("Enter your email to see past recommendations")
if st.button("Show History"):
    if search_email:
        try:
            user_data = list(collection.find({"email": search_email}))
            if user_data:
                df = pd.DataFrame(user_data)
                st.dataframe(df[['name','N','P','K','temperature','humidity','ph','rainfall','soil_type','predicted_crop','confidence']])
            else:
                st.info("No records found for this email.")
        except Exception as e:
            st.error(f"Error fetching data: {e}")
