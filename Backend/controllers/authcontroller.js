import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Notifications } from "../services/sendNotification.js";
import { cleanPhone } from "../utils/phoneUtils.js";
import { SYSTEM_EVENTS } from "../constants/systemEvents.js";
import Otp from "../models/Otp.js";

export const signup = async (req, res) => {
  try {
    const { fullName, email, password, phone, usageReason } = req.body;

    // 1. Check OTP before signup
    const latestOtp = await Otp.findOne({ phone }).sort({ createdAt: -1 });

    if (!latestOtp || !latestOtp.verified || !latestOtp.usedInSignup) {
      return res.status(400).json({
        success: false,
        message: "OTP not verified. Please verify OTP before signup."
      });
    }

    // 2. Continue Signup
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    const user = await User.create({
      fullName,
      email,
      password,
      phone,
      usageReason
    });

    // 3. Consume OTP (one-time-use)
    latestOtp.usedInSignup = false;
    await latestOtp.save();

    res.json({ success: true, message: "Signup successful", user });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const correct = await bcrypt.compare(password, user.password);
    if (!correct) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const isFirstLogin = !user.lastLogin;

   
    if (isFirstLogin) {
      const adminNotification = await Notifications.sendSystemTemplateToAdmin(
        SYSTEM_EVENTS.ADMIN_FIRST_LOGIN,
        { name: user.fullName, email: user.email, phone: user.phone }
      );
      
      if (!adminNotification.success) {
        console.error("Failed to notify admin of first login:", adminNotification.error);
      }
    }

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
    console.error("Login error:", err);
    res.status(500).json({ message: "Login error", error: err.message });
  }
};