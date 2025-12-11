// models/SupportMessage.js
import mongoose from "mongoose";

const SupportMessageSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SupportRequest",
    required: true,
  },

  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  senderRole: {
    type: String,
    enum: ["user", "admin"],
    required: true,
  },

  text: { type: String, default: "" },

  attachments: [{ type: String }], // uploaded file URLs

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("SupportMessage", SupportMessageSchema);
