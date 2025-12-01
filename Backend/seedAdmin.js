import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

dotenv.config();

async function seedAdmin() {
  await mongoose.connect(process.env.MONGO_URI);

  const email = "admin@gmail.com";

  const existingAdmin = await User.findOne({ email });

  if (existingAdmin) {
    console.log("Admin already exists!");
    process.exit(0);
  }

  const hashed = await bcrypt.hash("admin123", 10);

  await User.create({
    fullName: "Super Admin",
    email: "admin@gmail.com",
    password: hashed,
    role: "admin",
    phone: "9999999999",
  });

  console.log("Admin created successfully!");
  process.exit(0);
}

seedAdmin();
