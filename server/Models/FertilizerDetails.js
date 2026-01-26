const mongoose = require("mongoose");

const FertilizerSchema = mongoose.Schema({
    id: { type: String, required: true }, // The User ID from Cookies
    Crop: { type: String, required: true },
    SoilType: { type: String, required: true },
    Nitrogen: { type: Number, required: true },
    Phosphorus: { type: Number, required: true },
    Potassium: { type: Number, required: true },
    RecommendedFertilizer: { type: String, required: true }
}, {
    timestamps: true // CRITICAL: This adds 'createdAt' automatically
});

module.exports = mongoose.model("fertilizer_details", FertilizerSchema);