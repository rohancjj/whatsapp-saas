import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Notifications } from "../services/sendNotification.js";
import { cleanPhone } from "../utils/phoneUtils.js";   

export const signup = async (req, res) => {
  try {
    const { fullName, email, password, phone, usageReason } = req.body;

    
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hash = await bcrypt.hash(password, 10);

    // Clean phone using global utility
    const cleanedPhone = cleanPhone(phone);

    // Create User
    const user = await User.create({
      fullName,
      email,
      password: hash,
      phone: cleanedPhone,
      usageReason,
      lastLogin: null, // used for "first login" detection
    });

    /* ===========================
       SEND NOTIFICATION TO USER
    ============================ */
    if (cleanedPhone) {
      await Notifications.sendToUser(
        user._id,
        `🎉 Welcome ${fullName}!\nYour WhatsAPI account has been created successfully.\n\nYou can now log in and access your dashboard.`
      );
    }

    /* ===========================
       SEND NOTIFICATION TO ADMIN
    ============================ */
    await Notifications.sendToAdmin(
      `🆕 *New User Registered*\n\n👤 Name: ${fullName}\n📧 Email: ${email}\n📱 Phone: ${cleanedPhone || "N/A"}`
    );

    return res.json({
      message: "Account created",
      userId: user._id,
    });

  } catch (err) {
    console.log("Signup error:", err);
    res.status(500).json({ message: "Signup error", error: err.message });
  }
};

/* =========================================
   LOGIN
========================================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const correct = await bcrypt.compare(password, user.password);
    if (!correct) return res.status(400).json({ message: "Invalid credentials" });

    // Create token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    /* =========================================
       FIRST TIME LOGIN NOTIFICATION TO ADMIN
    ========================================== */
    const isFirstLogin = !user.lastLogin;

    if (isFirstLogin) {
      await Notifications.sendToAdmin(
        `🔐 *User First Login*\n\n👤 Name: ${user.fullName}\n📧 Email: ${user.email}`
      );
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        role: user.role,
      },
    });

  } catch (err) {
    console.log("Login error:", err);
    res.status(500).json({ message: "Login error", error: err.message });
  }
};
