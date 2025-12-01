import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    phone: { type: String },
    usageReason: { type: String },

    role: { type: String, default: "user" },

    activePlan: {
      planId: { type: mongoose.Schema.Types.ObjectId, ref: "Pricing" },
      activatedAt: Date,
      expiryAt: Date,

      messagesUsed: { type: Number, default: 0 },
      totalMessages: { type: Number, default: 0 },

      apiKey: String, // ⭐ user API key for WhatsApp API

      whatsappSession: String, // ⭐ Baileys session data
      qrCode: String,          // ⭐ last QR code sent
      isConnected: { type: Boolean, default: false }, // ⭐ connection status
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
