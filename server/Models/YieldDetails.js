const mongoose = require("mongoose");

const YieldSchema = mongoose.Schema({
    id: {
        type: String,
        required: true,
    },
    Crop: {
        type: String,
        required: true,
    },
    SoilMoisture: {
        type: Number,
        required: true,
    },
    Temperature: {
        type: Number,
        required: true,
    },
    Humidity: {
        type: Number,
        required: true,
    },
    Rainfall: {
        type: Number,
        required: true,
    },
    TotalDays: {
        type: Number,
        required: true,
    },
    PredictedYield: {
        type: Number,
        required: true,
    }
}, {
    // This creates createdAt and updatedAt automatically
    timestamps: true
});

module.exports = mongoose.model("yield_details", YieldSchema);