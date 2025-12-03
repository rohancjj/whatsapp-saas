import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Notifications } from "../services/sendNotification.js";


export const signup = async (req, res) => {
  try {
    const { fullName, email, password, phone, usageReason } = req.body;

    // Check email already exists
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      fullName,
      email,
      password: hash,
      phone,
      usageReason,
    });

    /* ======================================
       SEND WHATSAPP NOTIFICATIONS
    ======================================= */

    // 🟩 Notify USER
    if (phone) {
      await Notifications.sendToUser(
        phone,
        `🎉 Welcome ${fullName}!\nYour WhatsAPI account has been created successfully.\n\nLogin and start using your dashboard.`
      );
    }

    // 🟦 Notify ADMIN
    await Notifications.sendToAdmin(
      `🆕 New User Registered\n\nName: ${fullName}\nEmail: ${email}\nPhone: ${phone || "N/A"}`
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



export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Check password
    const correct = await bcrypt.compare(password, user.password);
    if (!correct) return res.status(400).json({ message: "Invalid credentials" });

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    /* ======================================
       NOTIFY ADMIN ON LOGIN
    ======================================= */
    await Notifications.sendToAdmin(
      `🔐 User Logged In\n\nName: ${user.fullName}\nEmail: ${user.email}`
    );

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
