# train_model.py
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
import pickle

# -----------------------------------
# 1. Load Dataset
# -----------------------------------
df = pd.read_csv("Crop_recommendation.csv")
print("✅ Dataset loaded successfully. Shape:", df.shape)

# -----------------------------------
# 2. Split features and target
# -----------------------------------
X = df.drop(columns=["label"])
y = df["label"]

# -----------------------------------
# 3. Encode target labels
# -----------------------------------
le = LabelEncoder()
y = le.fit_transform(y)

# -----------------------------------
# 4. Scale numeric features
# -----------------------------------
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# -----------------------------------
# 5. Train-test split
# -----------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42, stratify=y
)

# -----------------------------------
# 6. Train Random Forest model
# -----------------------------------
rf = RandomForestClassifier(n_estimators=200, random_state=42)
rf.fit(X_train, y_train)

# -----------------------------------
# 7. Save model, scaler, and label encoder
# -----------------------------------
pickle.dump(rf, open("rf_crop_model.pkl", "wb"))
pickle.dump(scaler, open("feature_scaler.pkl", "wb"))
pickle.dump(le, open("label_encoder.pkl", "wb"))
print("✅ Model, Scaler, and Label Encoder saved successfully!")

# -----------------------------------
# 8. Evaluate model (optional)
# -----------------------------------
accuracy = rf.score(X_test, y_test)
print(f"✅ Model accuracy on test data: {accuracy*100:.2f}%")
