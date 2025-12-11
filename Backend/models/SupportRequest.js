// models/SupportRequest.js
import mongoose from "mongoose";

const SupportRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  subject: { type: String, required: true },
  description: { type: String, default: "" },

  status: {
    type: String,
    enum: ["open", "pending", "resolved", "closed"],
    default: "open",
  },

  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "low",
  },

  tags: [{ type: String }],

  attachments: [{ type: String }], // initial uploaded files

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null, // admin who handles ticket
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

/** Auto-update timestamps */
SupportRequestSchema.pre("save", function () {
  this.updatedAt = new Date();
});

export default mongoose.model("SupportRequest", SupportRequestSchema);
