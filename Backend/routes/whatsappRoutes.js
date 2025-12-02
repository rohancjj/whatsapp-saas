import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import User from "../models/User.js";
import WhatsAppSession from "../models/WhatsAppSession.js";
import { createInstanceForUser, getUserSock } from "../services/whatsappManager.js";

const router = express.Router();

/**
 * Start WhatsApp linking
 * Route: POST /api/v1/whatsapp/link
 */
router.post("/link", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.activePlan || !user.activePlan.apiKey) {
      return res.status(400).json({
        message: "Please activate a plan before linking WhatsApp",
      });
    }

    const io = req.app.get("io");

    await createInstanceForUser(io, user);

    return res.json({
      message: "WhatsApp linking started. Scan the QR on dashboard.",
    });
  } catch (err) {
    console.error("WhatsApp Link Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Get WhatsApp connection status
 * Route: GET /api/v1/whatsapp/status
 */
router.get("/status", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const session = await WhatsAppSession.findOne({ userId });

    if (!session) {
      return res.json({
        connected: false,
        message: "No WhatsApp session found",
      });
    }

    return res.json({
      connected: session.connected,
      number: session.phoneNumber || null,
    });
  } catch (err) {
    console.error("Status error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Send WhatsApp Message using API key
 * Route: POST /api/v1/whatsapp/send
 */
router.post("/send", async (req, res) => {
  try {
    const apiKey =
      req.headers["x-api-key"] ||
      (req.headers.authorization &&
        req.headers.authorization.split(" ")[1]);

    if (!apiKey)
      return res.status(401).json({ message: "API key missing" });

    const session = await WhatsAppSession.findOne({ apiKey });

    if (!session)
      return res.status(404).json({ message: "Invalid API key" });

    if (!session.connected)
      return res.status(400).json({
        message: "WhatsApp is not connected. Reconnect first.",
      });

    const userId = session.userId.toString();
    const waSock = getUserSock(userId);

    if (!waSock)
      return res.status(500).json({
        message: "WhatsApp instance is not running for this user",
      });

    const { to, text } = req.body;

    if (!to || !text)
      return res.status(400).json({
        message: "'to' and 'text' fields are required",
      });

    await waSock.sendMessage(`${to}@s.whatsapp.net`, { text });

    return res.json({ message: "Message sent successfully" });
  } catch (err) {
    console.error("Send Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
