import pickle
import numpy as np

model = pickle.load(open("models/fertilizer_model.pkl", "rb"))

def predict_fertilizer(N, P, K, temperature, humidity, ph, rainfall):
    data = np.array([[N, P, K, temperature, humidity, ph, rainfall]])
    return model.predict(data)[0]
