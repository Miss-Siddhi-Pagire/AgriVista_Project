const mongoose = require("mongoose");

const TrendSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Trend title is required"],
    },
    description: {
        type: String,
        required: [true, "Description is required"],
    },
    image: {
        type: String, // URL to image
        required: [true, "Image URL is required"],
    },
    category: {
        type: String, // E.g., "New Crop", "Market Risk", "Technology"
        required: true,
        enum: ["Trend", "Risk", "New Crop", "Technology"],
        default: "Trend"
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model("Trend", TrendSchema);
