const mongoose = require("mongoose");

const DetailsSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        // unique: true // 🔥 REMOVED: History cannot exist with unique IDs
    },

    service: {
        type: String,
        enum: ["crop", "fertilizer", "yield"],
        required: true
    },

    inputs: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },

    prediction: {
        type: mongoose.Schema.Types.Mixed
    }
}, { 
    // This adds createdAt and updatedAt automatically
    timestamps: true 
});

// 🔥 REMOVED: Unique index would cause overwriting/errors
// DetailsSchema.index({ id: 1 }, { unique: true });

module.exports = mongoose.model("details", DetailsSchema);