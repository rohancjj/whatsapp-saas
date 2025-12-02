import express from "express";
import crypto from "crypto";
import authMiddleware from "../middlewares/authMiddleware.js";
import User from "../models/User.js";
import WhatsAppSession from "../models/WhatsAppSession.js";
import { createInstanceForUser, getUserSock } from "../services/whatsappManager.js";

const router = express.Router();

const generateApiKey = () => {
  return `wa_${crypto.randomBytes(32).toString("hex")}`;
};


const syncApiKeys = async (userId) => {
  try {
    const session = await WhatsAppSession.findOne({ userId });
    const user = await User.findById(userId);
    
    if (!session || !user || !session.apiKey) return null;
    

    const correctApiKey = session.apiKey;
    
    
    if (user.activePlan?.apiKey !== correctApiKey) {
      await User.findByIdAndUpdate(userId, {
        "activePlan.apiKey": correctApiKey
      });
      console.log(`✅ Synced API key for user ${userId}`);
    }
    
    return correctApiKey;
  } catch (err) {
    console.error("Failed to sync API keys:", err);
    return null;
  }
};


router.post("/link", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.activePlan) {
      return res.status(400).json({
        message: "Please activate a plan before linking WhatsApp",
      });
    }

    const io = req.app.get("io");
    const existingSock = getUserSock(userId);
    
 
    if (existingSock) {
      const session = await WhatsAppSession.findOne({ userId });
      return res.json({ 
        message: "WhatsApp instance already running for this user",
        apiKey: session?.apiKey
      });
    }

    
    let session = await WhatsAppSession.findOne({ userId });
    let apiKey = session?.apiKey;
    
    if (!apiKey) {
     
      apiKey = generateApiKey();
      
   
      await User.findByIdAndUpdate(userId, {
        "activePlan.apiKey": apiKey
      });
      
   
      await WhatsAppSession.findOneAndUpdate(
        { userId },
        { 
          apiKey,
          connected: false,
          updatedAt: new Date()
        },
        { upsert: true }
      );
    } else {
      
      if (user.activePlan?.apiKey !== apiKey) {
        await User.findByIdAndUpdate(userId, {
          "activePlan.apiKey": apiKey
        });
      }
      
     
      await WhatsAppSession.findOneAndUpdate(
        { userId },
        { 
          connected: false,
          updatedAt: new Date()
        }
      );
    }

    
    await createInstanceForUser(io, { 
      ...user.toObject(), 
      activePlan: { ...user.activePlan, apiKey } 
    });

    return res.json({
      message: "WhatsApp linking started. Scan the QR on dashboard.",
      apiKey: apiKey
    });
  } catch (err) {
    console.error("WhatsApp Link Error:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
});


router.get("/status", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;


    await syncApiKeys(userId);

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
      apiKey: session.apiKey
    });
  } catch (err) {
    console.error("Status error:", err);
    res.status(500).json({ error: err.message });
  }
});


router.get("/api-key", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    

    const syncedKey = await syncApiKeys(userId);
    
    const user = await User.findById(userId);

    if (!user.activePlan) {
      return res.status(400).json({ 
        message: "No active plan found. Please activate a plan first." 
      });
    }

    
    let session = await WhatsAppSession.findOne({ userId });
    let apiKey = session?.apiKey || syncedKey;
    
    
    if (!apiKey) {
      apiKey = generateApiKey();
      
      
      await User.findByIdAndUpdate(userId, {
        "activePlan.apiKey": apiKey
      });
      
      
      await WhatsAppSession.findOneAndUpdate(
        { userId },
        { apiKey, updatedAt: new Date() },
        { upsert: true }
      );
      
      
      session = await WhatsAppSession.findOne({ userId });
    }

    return res.json({
      apiKey: apiKey,
      connected: session?.connected || false,
      phoneNumber: session?.phoneNumber || null
    });
  } catch (err) {
    console.error("API Key fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});


router.post("/regenerate-key", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user.activePlan) {
      return res.status(400).json({ 
        message: "No active plan found." 
      });
    }

    
    const newApiKey = generateApiKey();


    await User.findByIdAndUpdate(userId, {
      "activePlan.apiKey": newApiKey
    });

 
    await WhatsAppSession.findOneAndUpdate(
      { userId },
      { apiKey: newApiKey, updatedAt: new Date() },
      { upsert: true }
    );

    return res.json({
      message: "API key regenerated successfully",
      apiKey: newApiKey
    });
  } catch (err) {
    console.error("Regenerate key error:", err);
    res.status(500).json({ error: err.message });
  }
});


router.post("/send", async (req, res) => {
  try {
    
    const apiKey =
      req.headers["x-api-key"] ||
      (req.headers.authorization &&
        req.headers.authorization.split(" ")[1]);

    if (!apiKey) {
      return res.status(401).json({ message: "API key missing" });
    }


    const session = await WhatsAppSession.findOne({ apiKey });

    if (!session) {
      return res.status(404).json({ message: "Invalid API key" });
    }

    if (!session.connected) {
      return res.status(400).json({
        message: "WhatsApp is not connected. Please scan QR code first.",
      });
    }

    const userId = session.userId.toString();
    const waSock = getUserSock(userId);

    if (!waSock) {
      return res.status(500).json({
        message: "WhatsApp instance is not running. Please reconnect.",
      });
    }

    const { to, text } = req.body;

    if (!to || !text) {
      return res.status(400).json({
        message: "'to' and 'text' fields are required",
      });
    }

 
    const jid = to.includes("@s.whatsapp.net") ? to : `${to}@s.whatsapp.net`;

   
    await waSock.sendMessage(jid, { text });

 
    await User.findByIdAndUpdate(
      session.userId,
      { $inc: { "activePlan.messagesUsed": 1 } }
    );

    return res.json({ 
      success: true,
      message: "Message sent successfully",
      to: to
    });
  } catch (err) {
    console.error("Send Error:", err);
    res.status(500).json({ 
      message: "Internal server error", 
      error: err.message 
    });
  }
});


router.post("/disconnect", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const sock = getUserSock(userId);

    
    if (sock) {
      try {
        await sock.logout();
        console.log(`✅ User ${userId} logged out from WhatsApp`);
      } catch (e) {
        console.warn("Logout error:", e);
      }
    }


    await WhatsAppSession.findOneAndUpdate(
      { userId },
      { connected: false, updatedAt: new Date() }
    );

    return res.json({ message: "WhatsApp disconnected successfully" });
  } catch (err) {
    console.error("Disconnect error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;