// controllers/otpController.js
import Otp from "../models/Otp.js";
import { sendAdminText } from "../services/adminWhatsapp.js"; // path as required
import crypto from "crypto";

const generateCode = () => {
  // 6-digit numeric OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const OTP_TTL_MS = 1000 * 60 * 5; // 5 minutes
const MAX_ATTEMPTS = 5;

export const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: "phone required" });

    const code = generateCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    // store OTP
    await Otp.create({ phone, code, expiresAt });

    // send using admin whatsapp
    const message = `Your verification code is: ${code}\nThis code will expire in 5 minutes.`;
    const sent = await sendAdminText(phone, message);

    if (!sent.success) {
      // still return created but also 실패 notice
      console.warn("OTP created but send failed:", sent.error);
      return res.json({
        success: true,
        message: "OTP created but sending failed. Admin WhatsApp may be offline.",
        info: sent.error
      });
    }

    res.json({ success: true, message: "OTP sent" });
  } catch (err) {
    console.error("sendOtp:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ message: "phone + code required" });

    const otpDoc = await Otp.findOne({ phone }).sort({ createdAt: -1 });
    if (!otpDoc) return res.status(400).json({ message: "No OTP found for this number" });

    // expired?
    if (otpDoc.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // too many attempts
    if (otpDoc.attempts >= MAX_ATTEMPTS) {
      return res.status(429).json({ message: "Too many attempts" });
    }

    // check code
    if (otpDoc.code !== code) {
      otpDoc.attempts = (otpDoc.attempts || 0) + 1;
      await otpDoc.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // mark verified
    otpDoc.verified = true;
otpDoc.verifiedAt = new Date();
otpDoc.usedInSignup = true;
await otpDoc.save();

    

    res.json({ success: true, message: "Verified" });
  } catch (err) {
    console.error("verifyOtp:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
