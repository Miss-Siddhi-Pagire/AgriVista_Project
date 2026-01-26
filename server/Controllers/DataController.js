const DataModel = require('../Models/DataModel');
const axios = require('axios');

// Save a NEW Prediction (POST /data)
module.exports.Data = async (req, res) => {
    const { id, service, inputs, prediction } = req.body;

    try {
        // Always create a new entry to preserve history
        const newRecord = await DataModel.create({ 
            id, 
            service: service || "crop", 
            inputs, 
            prediction 
        });

        res.status(201).json({ 
            message: 'Prediction saved to history', 
            form: newRecord 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Fetch ALL predictions for a user (GET /get-form/:id)
module.exports.DatafetchById = async (req, res) => {
    const userId = req.params.id;

    try {
        // 🔥 Changed to .find() and sorted by newest first
        const historyData = await DataModel.find({ id: userId }).sort({ createdAt: -1 });

        if (!historyData || historyData.length === 0) {
            return res.status(404).json({ message: "No history found" });
        }

        // Return the full array for the dashboard
        res.status(200).json(historyData.map(item => ({
            Nitrogen: item.inputs?.Nitrogen ?? null,
            Phosphorus: item.inputs?.Phosphorus ?? null,
            Potassium: item.inputs?.Potassium ?? null,
            Temperature: item.inputs?.Temperature ?? null,
            Humidity: item.inputs?.Humidity ?? null,
            pH: item.inputs?.pH ?? null,
            Rainfall: item.inputs?.Rainfall ?? null,
            Prediction: item.prediction ?? null,
            createdAt: item.createdAt // Used by Frontend to show date
        })));

    } catch (error) {
        console.error("Fetch error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Refactored to save as new record (POST /update-form/:id)
// In a history system, "Update" usually means "Add new entry"
module.exports.updateFormById = async (req, res) => {
    const userId = req.params.id;
    const { service, inputs, prediction } = req.body;

    try {
        // Even if the route is "update", we CREATE a new document to keep history
        const newEntry = await DataModel.create({
            id: userId,
            service,
            inputs,
            prediction
        });

        res.status(200).json({
            message: "Prediction added to history successfully",
            form: newEntry
        });

    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// ML request (Unchanged)
module.exports.dataToML = async (req, res, next) => {
    const { id, Nitrogen, Phosphorus, Potassium, Temperature, Humidity, pH, Rainfall } = req.body;

    try {
        const mlApiResponse = await axios.post('http://localhost:8000/predict-crop', {
            id, Nitrogen, Phosphorus, Potassium, Temperature, Humidity, pH, Rainfall
        });

        res.status(200).json(mlApiResponse.data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};