import pickle
import numpy as np

model = pickle.load(open("models/crop_model.pkl", "rb"))
le = pickle.load(open("models/crop_label_encoder.pkl", "rb"))

def predict_crop(N, P, K, temperature, humidity, ph, rainfall):
    data = np.array([[N, P, K, temperature, humidity, ph, rainfall]])
    pred = model.predict(data)
    return le.inverse_transform(pred)[0]
