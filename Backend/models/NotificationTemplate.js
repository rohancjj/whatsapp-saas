import mongoose from "mongoose";

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
  },
  { timestamps: true }
);

export default mongoose.model("NotificationTemplate", notificationTemplateSchema);
