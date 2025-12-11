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

    // 1. Validate required fields
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, and password are required"
      });
    }

    // 2. Check OTP before signup
    const latestOtp = await Otp.findOne({ phone }).sort({ createdAt: -1 });

    if (!latestOtp || !latestOtp.verified || !latestOtp.usedInSignup) {
      return res.status(400).json({
        success: false,
        message: "OTP not verified. Please verify OTP before signup."
      });
    }

    // 3. Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: "Email already exists" 
      });
    }

    // 4. Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Create user
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      phone,
      usageReason,
      role: "user" // Default role
    });

    // 6. Consume OTP (one-time-use)
    latestOtp.usedInSignup = false;
    await latestOtp.save();

    // 7. Generate JWT token with role
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        role: user.role,
        fullName: user.fullName
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("🔑 Signup successful - Token generated:", {
      userId: user._id,
      email: user.email,
      role: user.role
    });

    res.json({ 
      success: true, 
      message: "Signup successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: err.message 
    });
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }

    // 2. Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    // 3. Verify password
    const correct = await bcrypt.compare(password, user.password);
    if (!correct) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    // 4. Check if user is suspended or terminated
    if (user.suspended) {
      return res.status(403).json({ 
        success: false,
        message: "Your account has been suspended. Please contact support." 
      });
    }
    if (user.terminated) {
      return res.status(403).json({ 
        success: false,
        message: "Your account has been terminated. Please contact support." 
      });
    }

    // 5. Generate JWT token with role (CRITICAL for admin access)
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        role: user.role,  // ✅ This is CRITICAL for admin middleware
        fullName: user.fullName
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 6. Check if first login
    const isFirstLogin = !user.lastLogin;

    // 7. Send notification to admin on first login
    if (isFirstLogin) {
      try {
        const adminNotification = await Notifications.sendSystemTemplateToAdmin(
          SYSTEM_EVENTS.ADMIN_FIRST_LOGIN,
          { 
            name: user.fullName, 
            email: user.email, 
            phone: user.phone 
          }
        );
        
        if (!adminNotification.success) {
          console.error("Failed to notify admin of first login:", adminNotification.error);
        }
      } catch (notifError) {
        console.error("Notification error:", notifError);
        // Don't fail login if notification fails
      }
    }

    // 8. Update last login
    user.lastLogin = new Date();
    await user.save();

    // 9. Debug log
    console.log("🔑 Login successful - Token generated:", {
      userId: user._id,
      email: user.email,
      role: user.role,
      isAdmin: user.role === "admin"
    });

    // 10. Send response
    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        activePlan: user.activePlan
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ 
      success: false,
      message: "Login error", 
      error: err.message 
    });
  }
};

// Optional: Verify token endpoint (useful for debugging)
export const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "No token provided" 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id).select("-password");
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isAdmin: user.role === "admin"
      },
      tokenData: {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email
      }
    });
  } catch (err) {
    console.error("Token verification error:", err);
    res.status(403).json({ 
      success: false,
      message: "Invalid or expired token" 
    });
  }
};