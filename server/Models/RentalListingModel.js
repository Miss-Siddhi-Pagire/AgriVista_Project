const mongoose = require("mongoose");

const RentalListingSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ownerName: { type: String, required: true },
  ownerPhone: { type: String, default: "" },

  equipmentName: { type: String, required: true },
  category: {
    type: String,
    enum: ["Tractor", "Harvester", "Sprayer", "Plough", "Seeder", "Thresher", "Pump", "Other"],
    required: true
  },
  description: { type: String, default: "" },
  pricePerDay: { type: Number, required: true },
  location: { type: String, required: true }, // e.g. "Ludhiana, Punjab"
  state: { type: String, required: true },
  district: { type: String, required: true },
  imageUrl: { type: String, default: null },
  isAvailable: { type: Boolean, default: true },
  condition: { type: String, enum: ["Excellent", "Good", "Fair"], default: "Good" },

  // Booking requests
  bookings: [{
    renterId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    renterName: String,
    renterPhone: String,
    fromDate: Date,
    toDate: Date,
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    message: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model("RentalListing", RentalListingSchema);
