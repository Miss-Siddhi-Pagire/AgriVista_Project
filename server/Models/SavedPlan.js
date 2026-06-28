const mongoose = require("mongoose");

const savedPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  crop: {
    type: String,
    required: true
  },
  season: {
    type: String,
    required: true
  },
  location: {
    district: String,
    state: String,
    taluka: String,
    city: String
  },
  planData: {
    type: Object,
    required: true
  },
  isSaved: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("SavedPlan", savedPlanSchema);
