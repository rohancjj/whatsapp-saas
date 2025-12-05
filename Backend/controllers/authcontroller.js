import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Notifications } from "../services/sendNotification.js";
import { cleanPhone } from "../utils/phoneUtils.js";
import { SYSTEM_EVENTS } from "../constants/systemEvents.js";

export const signup = async (req, res) => {
  try {
    const { fullName, email, password, phone, usageReason } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hash = await bcrypt.hash(password, 10);
    const cleanedPhone = cleanPhone(phone);

    const user = await User.create({
      fullName,
      email,
      password: hash,
      phone: cleanedPhone,
      usageReason,
      lastLogin: null,
    });

    
    const userNotification = await Notifications.sendSystemTemplate(
      user._id, 
      SYSTEM_EVENTS.USER_SIGNUP, 
      { name: fullName, email, phone: cleanedPhone }
    );
    
    if (!userNotification.success) {
      console.error("Failed to send user signup notification:", userNotification.error);
    }


    const adminNotification = await Notifications.sendSystemTemplateToAdmin(
      SYSTEM_EVENTS.ADMIN_NEW_USER,
      { name: fullName, email, phone: cleanedPhone }
    );
    
    if (!adminNotification.success) {
      console.error("Failed to notify admin of new user:", adminNotification.error);
    }

    return res.json({
      message: "Account created successfully.",
      userId: user._id,
    });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Signup error", error: err.message });
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