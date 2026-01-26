const FertilizerModel = require("../Models/FertilizerDetails");
const axios = require("axios");

// POST /api/fertilizer - Saves a NEW record every time
module.exports.FertilizerData = async (req, res) => {
    const { id, Crop, SoilType, Nitrogen, Phosphorus, Potassium } = req.body;

    try {
        const mlResponse = await axios.post("http://127.0.0.1:8000/predict-fertilizer", {
            Nitrogen, Phosphorus, Potassium,
            soil_type: SoilType, crop_type: Crop
        });

        const RecommendedFertilizer = mlResponse.data.recommended_fertilizer;

        // CRITICAL CHANGE: We do NOT use findOne or findOneAndUpdate.
        // We call .create() directly to add a new row to the database history.
        const newEntry = await FertilizerModel.create({
            id,
            Crop,
            SoilType,
            Nitrogen,
            Phosphorus,
            Potassium,
            RecommendedFertilizer
        });

        res.status(201).json({
            message: "Saved to history",
            RecommendedFertilizer,
            data: newEntry
        });

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// GET: Return all records for the user
module.exports.getFertilizerById = async (req, res) => {
    try {
        // Find ALL records for this user and sort by newest date (-1)
        const data = await FertilizerModel.find({ id: req.params.id }).sort({ createdAt: -1 });

        if (!data || data.length === 0) {
            return res.status(404).json({ message: "No history found" });
        }
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
// PUT /api/fertilizer/:id - (Optional) Keep this only if you need to edit a specific entry by its MongoDB _id
module.exports.updateFertilizerById = async (req, res) => {
    try {
        // Note: Use req.params.id as the MongoDB _id here if editing specific records
        const data = await FertilizerModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!data) {
            return res.status(404).json({ message: "Record not found" });
        }

        res.status(200).json({
            message: "Record updated successfully",
            data
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};