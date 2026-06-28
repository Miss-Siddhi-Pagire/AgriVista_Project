const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  transactionType: {
    type: String,
    enum: ["income", "expense"],
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  description: {
    type: String,
    default: "",
  },
  relatedCrop: {
    type: String,
    default: "",
  }
}, { timestamps: true });

module.exports = mongoose.model("Ledger", ledgerSchema);
