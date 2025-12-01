import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    phone: { type: String },
    usageReason: { type: String }, 

    role: { type: String, default: "user" }, 
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
