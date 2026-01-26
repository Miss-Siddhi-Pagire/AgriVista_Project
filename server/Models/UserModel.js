const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  // ===== EXISTING FIELDS (UNCHANGED) =====
  email: {
    type: String,
    required: [true, "Your email address is required"],
    unique: true,
  },
  name: {
    type: String,
    required: [true, "Your Name is required"],
  },
  password: {
    type: String,
    required: [true, "Your password is required"],
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
  language: {
    type: String,
    default: "deff",
  },

  // ===== ADDED FARMER IDENTITY DETAILS =====

  phone: {
    type: String,
  },

  age: {
    type: Number,
    min: 18,
  },

  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
  },

  address: {
    village: String,
    taluka: String,
    district: String,
    state: String,
    pincode: String,
  },

  preferredLanguage: {
    type: String,
  },

});

// ===== EXISTING PASSWORD HASHING (UNCHANGED) =====
userSchema.pre("save", async function () {
  this.password = await bcrypt.hash(this.password, 12);
});

module.exports = mongoose.model("User", userSchema);
