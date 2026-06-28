const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  date: {
    type: String, // Stored as DD/MM/YYYY for easy comparison
    required: true
  },
  dateObj: {
    type: Date, // For sorting and backend logic
    required: true
  },
  activityStage: String,
  crop: String,
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Notification", notificationSchema);
