const mongoose = require("mongoose");

const DiseaseReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true },
  cropName: { type: String, required: true },
  diseaseName: { type: String, required: true },
  severity: { 
    type: String, 
    enum: ["Low", "Moderate", "High", "Critical"],
    required: true 
  },
  description: { type: String, default: "" },
  state: { type: String, required: true },
  district: { type: String, required: true },
  // Lat/Long for map pin
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  imageUrl: { type: String, default: null },
  verified: { type: Boolean, default: false },
  upvotes: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("DiseaseReport", DiseaseReportSchema);
