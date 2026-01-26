import pickle
import numpy as np

model = pickle.load(open("models/yield_model.pkl", "rb"))

def predict_yield(N, P, K, temperature, humidity, ph, rainfall):
    data = np.array([[N, P, K, temperature, humidity, ph, rainfall]])
    return round(model.predict(data)[0], 2)
