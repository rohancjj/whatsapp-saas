import express from "express";
import crypto from "crypto";
import authMiddleware from "../middlewares/authMiddleware.js";
import User from "../models/User.js";
import WhatsAppSession from "../models/WhatsAppSession.js";
import { resetIfNeeded } from "../utils/resetMessageLimit.js";


import {
  createInstanceForUser,
  getUserSock,
  checkWhatsAppNumber
} from "../services/whatsappManager.js";

const router = express.Router();


const generateApiKey = () => `wa_${crypto.randomBytes(32).toString("hex")}`;


const syncApiKeys = async (userId) => {
  try {
    const session = await WhatsAppSession.findOne({ userId });
    const user = await User.findById(userId);
    if (!session || !user) return null;

    if (user.activePlan?.apiKey !== session.apiKey) {
      await User.findByIdAndUpdate(userId, {
        "activePlan.apiKey": session.apiKey,
      });
    }

    return session.apiKey;
  } catch (err) {
    console.error("API sync error:", err);
    return null;
  }
};


router.post("/link", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.activePlan) {
      return res.status(400).json({ message: "Please activate a plan first" });
    }

    
    if (user.role === "admin") {
      return res.status(403).json({ 
        message: "Admin accounts cannot link user WhatsApp. Use Admin Dashboard instead." 
      });
    }

    const io = req.app.get("io");
    const existing = getUserSock(userId);

    if (existing) {
      const session = await WhatsAppSession.findOne({ userId });
      return res.json({
        message: "WhatsApp already running",
        apiKey: session?.apiKey,
      });
    }

    let session = await WhatsAppSession.findOne({ userId });
    let apiKey = session?.apiKey;

    if (!apiKey) {
      apiKey = generateApiKey();

      await User.findByIdAndUpdate(userId, {
        "activePlan.apiKey": apiKey,
      });

      await WhatsAppSession.findOneAndUpdate(
        { userId },
        { apiKey, connected: false, updatedAt: new Date() },
        { upsert: true }
      );
    }

    
    await createInstanceForUser(io, {
      ...user.toObject(),
      activePlan: { ...user.activePlan, apiKey },
    });

    return res.json({
      message: "WhatsApp linking started. Scan QR",
      apiKey,
    });
  } catch (err) {
    console.error("Link error:", err);
    res.status(500).json({ message: "Internal error", error: err.message });
  }
});


router.get("/status", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    await syncApiKeys(userId);

    const session = await WhatsAppSession.findOne({ userId });

    if (!session)
      return res.json({ connected: false, message: "No WhatsApp session" });

    res.json({
      connected: session.connected,
      number: session.phoneNumber,
      apiKey: session.apiKey,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/api-key", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    
    if (user?.role === "admin") {
      return res.status(403).json({ 
        message: "Admin accounts use separate WhatsApp system" 
      });
    }

    const syncedKey = await syncApiKeys(userId);
    let session = await WhatsAppSession.findOne({ userId });

    let apiKey = session?.apiKey || syncedKey;

    if (!apiKey) {
      apiKey = generateApiKey();

      await User.findByIdAndUpdate(userId, {
        "activePlan.apiKey": apiKey,
      });

      await WhatsAppSession.findOneAndUpdate(
        { userId },
        { apiKey, updatedAt: new Date() },
        { upsert: true }
      );

      session = await WhatsAppSession.findOne({ userId });
    }

    res.json({
      apiKey,
      connected: session?.connected || false,
      phoneNumber: session?.phoneNumber || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post("/regenerate-key", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

   
    if (user?.role === "admin") {
      return res.status(403).json({ 
        message: "Admin accounts use separate system" 
      });
    }

    const newKey = generateApiKey();

    await User.findByIdAndUpdate(userId, {
      "activePlan.apiKey": newKey,
    });

    await WhatsAppSession.findOneAndUpdate(
      { userId },
      { apiKey: newKey, updatedAt: new Date() },
      { upsert: true }
    );

    res.json({ message: "API key regenerated", apiKey: newKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




router.post("/send", async (req, res) => {
  try {
    const apiKey =
      req.headers["x-api-key"] ||
      req.headers.authorization?.split(" ")[1];

    if (!apiKey) return res.status(401).json({ message: "API key missing" });

    const session = await WhatsAppSession.findOne({ apiKey });
    if (!session) return res.status(404).json({ message: "Invalid API key" });

    const user = await User.findById(session.userId).populate("activePlan.planId");

    if (!user || !user.activePlan?.planId)
      return res.status(403).json({ message: "No active plan found. Please subscribe." });

    
    await resetIfNeeded(user);

    const dailyLimit = user.activePlan.planId.messages; 
    const usedToday = user.activePlan.messagesUsedToday;

    
    if (usedToday >= dailyLimit) {
      return res.status(429).json({
        message: "❌ Daily limit reached. Upgrade your plan or wait until tomorrow.",
        limit: dailyLimit,
        usedToday,
        remainingToday: 0
      });
    }

    if (!session.connected)
      return res.status(400).json({ message: "WhatsApp not connected" });

    const sock = getUserSock(session.userId.toString());
    if (!sock)
      return res.status(500).json({ message: "WhatsApp session offline" });

    const { to, text } = req.body;
    if (!to || !text)
      return res.status(400).json({ message: "Missing 'to' or 'text' fields" });

    const jid = to.includes("@") ? to : `${to}@s.whatsapp.net`;

    await sock.sendMessage(jid, { text });

    
    user.activePlan.messagesUsed += 1;
    user.activePlan.messagesUsedToday += 1;
    await user.save();

    return res.json({
      success: true,
      message: "Message sent 👌",
      usedToday: user.activePlan.messagesUsedToday,
      limit: dailyLimit,
      remainingToday: dailyLimit - user.activePlan.messagesUsedToday
    });

  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: err.message });
  }
});



router.post("/disconnect", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const sock = getUserSock(userId);

    if (sock) {
      try {
        await sock.logout();
      } catch (err) {
        console.error("Logout error:", err);
      }
    }

    await WhatsAppSession.updateOne(
      { userId },
      { connected: false, updatedAt: new Date() }
    );

    res.json({ message: "WhatsApp disconnected" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post("/check-number", async (req, res) => {
  try {
    const { number } = req.body;

    if (!number)
      return res.status(400).json({ message: "Number required" });

    const exists = await checkWhatsAppNumber(number);

    return res.json({
      exists,
      verified: exists === true,
      message:
        exists === true
          ? "WhatsApp number exists"
          : exists === false
          ? "Number is not on WhatsApp"
          : "Cannot verify right now",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;