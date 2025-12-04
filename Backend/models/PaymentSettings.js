import mongoose from "mongoose";

const paymentSettingsSchema = new mongoose.Schema({
  qrCodeUrl: { type: String, default: null },
  upiId: { type: String, default: null },
  bank: {
    name: String,
    accountNumber: String,
    ifsc: String,
    holderName: String,
  },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("PaymentSettings", paymentSettingsSchema);
