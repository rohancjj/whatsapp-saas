// models/Otp.js
import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema({
  phone: { type: String, required: true, index: true },
  code: { type: String, required: true },
  verified: { type: Boolean, default: false },
  verifiedAt: { type: Date },
  usedInSignup: { type: Boolean, default: false }, 
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

OtpSchema.index({ phone: 1, createdAt: -1 });

export default mongoose.model("Otp", OtpSchema);
