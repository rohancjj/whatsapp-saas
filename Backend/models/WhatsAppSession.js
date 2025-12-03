
import mongoose from "mongoose";

const WhatsAppSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  apiKey: { type: String, required: true },
  phoneNumber: { type: String }, 
  creds: { type: Object }, 
  keys: { type: Object },  
  connected: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("WhatsAppSession", WhatsAppSessionSchema);
