const YieldModel = require("../Models/YieldDetails");
const axios = require("axios");

// POST /api/yield - ALWAYS CREATES A NEW HISTORY ENTRY
module.exports.YieldData = async (req, res) => {
    const {
        id,
        Crop,
        SoilMoisture,
        Temperature,
        Humidity,
        Rainfall,
        TotalDays,
        pH
    } = req.body;

    try {
        // Call FastAPI ML service
        const mlResponse = await axios.post(
            "http://127.0.0.1:8000/predict-yield",
            {
                soil_moisture: SoilMoisture,
                pH: pH || 6.5,
                temperature: Temperature,
                rainfall: Rainfall,
                humidity: Humidity,
                total_days: TotalDays
            }
        );

        const PredictedYield = mlResponse.data.estimated_yield;

        // CRITICAL: We removed the "if (existingData)" check.
        // This creates a brand new document in the collection every time.
        const newRecord = await YieldModel.create({
            id,
            Crop,
            SoilMoisture,
            Temperature,
            Humidity,
            Rainfall,
            TotalDays,
            PredictedYield
        });

        res.status(201).json({
            message: "Yield prediction saved to history",
            PredictedYield,
            data: newRecord
        });

    } catch (error) {
        console.error("Yield Controller Error:", error.message);
        res.status(500).json({
            message: "ML server not reachable or internal error"
        });
    }
};

// GET /api/yield/:id - RETURNS ALL PREDICTIONS (NEWEST FIRST)
module.exports.getYieldById = async (req, res) => {
    try {
        // We use .find() to get the list, and .sort() to put newest first
        const data = await YieldModel.find({ id: req.params.id }).sort({ createdAt: -1 });

        if (!data || data.length === 0) {
            return res.status(404).json({ message: "No yield history found" });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("GET Yield Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// PUT /api/yield/:id - Keep for editing specific rows via MongoDB _id if needed
module.exports.updateYieldById = async (req, res) => {
    try {
        const data = await YieldModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!data) {
            return res.status(404).json({ message: "Yield data not found" });
        }

        res.status(200).json({
            message: "Yield record updated successfully",
            data
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};