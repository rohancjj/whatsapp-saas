import mongoose from "mongoose";
import { SYSTEM_EVENTS } from "../constants/systemEvents.js";


const notificationTemplateSchema = new mongoose.Schema(
  {
    name: {
         type: String, 
         required: true, 
         unique: true },  
    
    category: { 
        type: String, 
        default: "general" },

    content: { 
        type: String, 
        required: true },

    
    variables: [{ type: String }],


     systemEvent: {
      type: String,
      enum: [...Object.values(SYSTEM_EVENTS), null],
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("NotificationTemplate", notificationTemplateSchema);
