import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

dotenv.config();

async function seedAdmin() {
  try {
    // Connect to database
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const email = "admin@gmail.com";
    const password = "admin123";

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log("⚠️  Admin already exists!");
      console.log("📧 Email:", existingAdmin.email);
      console.log("👤 Name:", existingAdmin.fullName);
      console.log("🔐 Role:", existingAdmin.role);
      
      // Update existing user to admin if they're not already
      if (existingAdmin.role !== "admin") {
        existingAdmin.role = "admin";
        await existingAdmin.save();
        console.log("✅ Updated existing user to admin role");
      }
      
      await mongoose.connection.close();
      process.exit(0);
    }

    // Hash password
    console.log("🔒 Hashing password...");
    const hashed = await bcrypt.hash(password, 10);

    // Create admin user
    console.log("👤 Creating admin user...");
    const admin = await User.create({
      fullName: "Super Admin",
      email: email,
      password: hashed,
      role: "admin",  // ✅ This is critical for admin access
      phone: "9999999999",
      usageReason: "System Administrator",
      suspended: false,
      terminated: false
    });

    console.log("\n🎉 Admin created successfully!");
    console.log("═══════════════════════════════════════");
    console.log("📧 Email:    ", admin.email);
    console.log("🔑 Password: ", password);
    console.log("👤 Name:     ", admin.fullName);
    console.log("🔐 Role:     ", admin.role);
    console.log("📱 Phone:    ", admin.phone);
    console.log("🆔 ID:       ", admin._id);
    console.log("═══════════════════════════════════════");
    console.log("\n⚠️  IMPORTANT: Change the default password after first login!");
    console.log("💡 You can now login with these credentials");

    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Error seeding admin:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the seed function
seedAdmin();