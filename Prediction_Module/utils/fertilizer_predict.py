import pickle
import numpy as np

model = None

def predict_fertilizer(N, P, K, temperature, humidity, ph, rainfall):
    global model
    if model is None:
        model = pickle.load(open("models/fertilizer_model.pkl", "rb"))
    data = np.array([[N, P, K, temperature, humidity, ph, rainfall]])
    return model.predict(data)[0]
