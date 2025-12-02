// models/WhatsAppSession.js
import mongoose from "mongoose";

const WhatsAppSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  apiKey: { type: String, required: true },
  phoneNumber: { type: String }, // optional, Baileys can provide
  creds: { type: Object }, // bailey auth creds object
  keys: { type: Object },  // any other store (optional)
  connected: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("WhatsAppSession", WhatsAppSessionSchema);
