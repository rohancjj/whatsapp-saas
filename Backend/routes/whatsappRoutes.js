import express from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import authMiddleware from "../middlewares/authMiddleware.js";
import User from "../models/User.js";
import WhatsAppSession from "../models/WhatsAppSession.js";
import { resetIfNeeded } from "../utils/resetMessageLimit.js";
import mime from "mime-types";
import { createInstanceForUser, getUserSock } from "../services/whatsappManager.js";

const router = express.Router();
const generateApiKey = () => `wa_${crypto.randomBytes(32).toString("hex")}`;

// Helper function to clear ALL session files
const clearAllSessions = () => {
  const sessionsDir = path.join(process.cwd(), "wa_sessions");
  try {
    if (fs.existsSync(sessionsDir)) {
      const files = fs.readdirSync(sessionsDir);
      files.forEach(file => {
        const filePath = path.join(sessionsDir, file);
        if (fs.statSync(filePath).isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
          console.log(`🗑️ Cleared session: ${file}`);
        }
      });
      console.log("✅ All sessions cleared");
    }
  } catch (err) {
    console.error("❌ Failed to clear sessions:", err);
  }
};

/* ===========================
   GET API KEY - FIXED
===========================*/
router.get("/api-key", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`🔑 Fetching API key for user: ${userId}`);

    // Get session from database
    const session = await WhatsAppSession.findOne({ userId });
    
    if (!session) {
      console.log(`⚠️ No session found for user ${userId}`);
      return res.json({ 
        apiKey: null, 
        connected: false, 
        phoneNumber: null 
      });
    }

    console.log(`✅ Found session for user ${userId}:`, {
      connected: session.connected,
      hasApiKey: !!session.apiKey,
      phoneNumber: session.phoneNumber
    });

    res.json({
      apiKey: session.apiKey || null,
      connected: session.connected || false,
      phoneNumber: session.phoneNumber || null
    });

  } catch (err) {
    console.error("❌ Error fetching API key:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===========================
   LINK WHATSAPP
===========================*/
router.post("/link", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.activePlan) return res.status(400).json({ message: "Activate a plan first" });

    const io = req.app.get("io");
    const existing = getUserSock(userId);

    if (existing) {
      const session = await WhatsAppSession.findOne({ userId });
      return res.json({ message: "WhatsApp already running", apiKey: session?.apiKey });
    }

    let session = await WhatsAppSession.findOne({ userId });
    let apiKey = session?.apiKey || generateApiKey();

    console.log(`🔑 Generated/Retrieved API key for user ${userId}: ${apiKey.slice(0, 20)}...`);

    // Update user's active plan with API key
    await User.findByIdAndUpdate(userId, { "activePlan.apiKey": apiKey });
    
    // Update or create session with API key
    await WhatsAppSession.findOneAndUpdate(
      { userId }, 
      { 
        apiKey, 
        connected: false, 
        updatedAt: new Date() 
      }, 
      { upsert: true }
    );

    await createInstanceForUser(io, { 
      ...user.toObject(), 
      activePlan: { ...user.activePlan, apiKey } 
    });

    res.json({ message: "Scan QR Code in WhatsApp", apiKey });
  } catch (err) {
    console.error("❌ Link error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===========================
   REGENERATE API KEY
===========================*/
router.post("/regenerate-key", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const newApiKey = generateApiKey();

    console.log(`🔄 Regenerating API key for user ${userId}`);

    // Update session
    await WhatsAppSession.findOneAndUpdate(
      { userId },
      { apiKey: newApiKey, updatedAt: new Date() },
      { upsert: true }
    );

    // Update user's active plan
    await User.findByIdAndUpdate(userId, { "activePlan.apiKey": newApiKey });

    console.log(`✅ New API key generated: ${newApiKey.slice(0, 20)}...`);

    res.json({ 
      success: true, 
      apiKey: newApiKey,
      message: "API key regenerated successfully" 
    });

  } catch (err) {
    console.error("❌ Regenerate key error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===========================
   SEND MESSAGE
===========================*/
router.post("/send", async (req, res) => {
  try {
    const apiKey = req.headers["x-api-key"] || req.headers.authorization?.split(" ")[1];
    if (!apiKey) return res.status(401).json({ message: "API key missing" });

    const session = await WhatsAppSession.findOne({ apiKey });
    if (!session) return res.status(404).json({ message: "Invalid API key" });

    const user = await User.findById(session.userId).populate("activePlan.planId");
    if (!user) return res.status(403).json({ message: "No active plan found" });

    await resetIfNeeded(user);

    if (!session.connected) return res.status(400).json({ message: "WhatsApp not connected" });

    const sock = getUserSock(session.userId.toString());
    if (!sock) return res.status(500).json({ message: "WhatsApp offline" });

    const { to, type, text, image_url, file_url, template, list, poll, buttons, footer, copyCode } = req.body;
    if (!to || !type) return res.status(400).json({ message: "to + type required" });

    const jid = to.includes("@") ? to : `${to}@s.whatsapp.net`;

    let messageOptions = {};

    switch (type.toLowerCase()) {
      case "text":
        messageOptions = { text };
        break;

      case "image":
        messageOptions = { image: { url: image_url }, caption: text };
        break;

      case "document":
      case "file":
        messageOptions = {
          document: { url: file_url },
          mimetype: mime.lookup(file_url) || "application/pdf",
          fileName: file_url.split("/").pop()
        };
        break;

      case "poll":
        messageOptions = {
          poll: {
            name: poll.question,
            values: poll.options,
            selectableCount: poll.selectableCount || 1
          }
        };
        break;

      case "list":
        messageOptions = list.message;
        break;

      case "template":
        messageOptions = {
          interactive: {
            type: "button",
            body: { text },
            footer: { text: footer || "" },
            action: {
              buttons: template.buttons.map((b, i) => ({
                type: "reply",
                reply: { id: b.id || `btn_${i}`, title: b.title }
              }))
            }
          }
        };
        break;

      case "quick_buttons":
      case "native":
      case "flow":
        messageOptions = {
          viewOnceMessage: {
            message: {
              interactiveMessage: {
                header: image_url
                  ? {
                      hasMediaAttachment: true,
                      imageMessage: { url: image_url }
                    }
                  : undefined,
                body: { text },
                footer: { text: footer || "" },
                nativeFlowMessage: {
                  buttons: buttons.map(btn => ({
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                      display_text: btn.title,
                      id: btn.id
                    })
                  }))
                }
              }
            }
          }
        };
        break;

      case "cta_copy":
        messageOptions = {
          viewOnceMessage: {
            message: {
              interactiveMessage: {
                body: { text: text || "Tap to copy" },
                footer: { text: footer || "" },
                nativeFlowMessage: {
                  buttons: [
                    {
                      name: "cta_copy",
                      buttonParamsJson: JSON.stringify({
                        display_text: req.body.button_text || "COPY",
                        id: req.body.button_id || "copy_btn",
                        copy_code: copyCode
                      })
                    }
                  ]
                }
              }
            }
          }
        };
        break;

      default:
        return res.status(400).json({
          message: "Invalid type",
          allowed: ["text","image","document","poll","list","template","quick_buttons","cta_copy"]
        });
    }

    const result = await sock.sendMessage(jid, messageOptions);

    user.activePlan.messagesUsed++;
    user.activePlan.messagesUsedToday++;
    await user.save();

    res.json({ success: true, messageId: result.key.id });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===========================
   WEBHOOK HANDLER
===========================*/
router.post("/webhook", async (req, res) => {
  try {
    const data = req.body;
    const sock = getUserSock(String(data.userId));
    if (!sock) return res.sendStatus(200);

    if (data.type === "button_reply")
      await sock.sendMessage(data.from, { text: `You clicked: ${data.buttonId}` });

    if (data.type === "text")
      await sock.sendMessage(data.from, { text: `You said: ${data.text}` });

    res.sendStatus(200);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===========================
   DISCONNECT WHATSAPP
===========================*/
router.post("/disconnect", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const io = req.app.get("io");
    const sock = getUserSock(userId);

    console.log(`🚫 Disconnect request for user: ${userId}`);

    // Step 1: Logout if session exists
    if (sock && sock.user) {
      try { 
        await sock.logout(); 
        console.log("✅ Logged out successfully");
      } catch (err) {
        console.log("⚠️ Logout error:", err.message);
      }
    }

    // Step 2: Close WebSocket connection
    if (sock) {
      try { sock.ws?.close(); } catch {}
      try { sock.end?.(); } catch {}
    }

    // Step 3: Clear user session files
    const sessionsDir = path.join(process.cwd(), "wa_sessions", userId);
    if (fs.existsSync(sessionsDir)) {
      fs.rmSync(sessionsDir, { recursive: true, force: true });
      console.log(`🗑️ Cleared session for user ${userId}`);
    }

    // Step 4: Update database
    await WhatsAppSession.findOneAndUpdate(
      { userId },
      { connected: false, phoneNumber: null }
    );

    // Step 5: Emit disconnected event
    io.to(userId).emit("whatsapp_logged_out");

    res.json({ 
      success: true, 
      message: "WhatsApp disconnected successfully" 
    });

  } catch (err) {
    console.error("❌ Disconnect error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;