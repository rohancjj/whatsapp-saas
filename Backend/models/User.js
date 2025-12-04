import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    phone: { type: String },
    usageReason: { type: String },

    role: { type: String, default: "user" },

    // 🔥 ADD THESE TWO FIELDS
    suspended: { type: Boolean, default: false },
    terminated: { type: Boolean, default: false },

    activePlan: {
      planId: { type: mongoose.Schema.Types.ObjectId, ref: "Pricing" },
      activatedAt: Date,
      expiryAt: Date,

      messagesUsed: { type: Number, default: 0 },
      messagesUsedToday: { type: Number, default: 0 }, 
      resetAt: { type: Date },
      totalMessages: { type: Number, default: 0 },

      apiKey: String, 

      whatsappSession: String, 
      qrCode: String,         
      isConnected: { type: Boolean, default: false }, 
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);