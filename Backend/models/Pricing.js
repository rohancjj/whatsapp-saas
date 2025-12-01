import mongoose from "mongoose";

const pricingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },      
    messages: { type: String, required: true },    
    apiAccess: { type: String, required: true },    
    supportLevel: { type: String, required: true},  
    features: [String],                            
    isFeatured: { type: Boolean, default: false },
    active: { type: Boolean, default: true }       
  },
  { timestamps: true }
);

export default mongoose.model("Pricing", pricingSchema);
