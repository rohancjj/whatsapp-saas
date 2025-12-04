import mongoose from "mongoose";

const manualPaymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "Pricing", required: true }, //⭐ Added
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  method: { type: String, default: "manual" },
  screenshotUrl: String,
  note: String,
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  adminNote: String,
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: Date,
});

export default mongoose.model("ManualPayment", manualPaymentSchema);
