import express from "express";
import crypto from "crypto";
import authMiddleware from "../middlewares/authMiddleware.js";
import User from "../models/User.js";
import WhatsAppSession from "../models/WhatsAppSession.js";
import { resetIfNeeded } from "../utils/resetMessageLimit.js";
import axios from "axios";
import mime from "mime-types";

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

/* ===========================
   LINK WHATSAPP
===========================*/
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

    if (user.activePlan.messagesUsedToday >= user.activePlan.planId.messages) {
      return res.status(429).json({
        message: "Daily limit reached",
        used: user.activePlan.messagesUsedToday,
        limit: user.activePlan.planId.messages
      });
    }

    if (!session.connected)
      return res.status(400).json({ message: "WhatsApp not connected" });

    const sock = getUserSock(session.userId.toString());
    if (!sock)
      return res.status(500).json({ message: "WhatsApp session offline" });

    const { to, type, text, image_url, file_url, button, template, list } = req.body;

    if (!to || !type)
      return res.status(400).json({ message: "Missing fields: to, type" });

    const jid = to.includes("@") ? to : `${to}@s.whatsapp.net`;

    let messageOptions = {};
    const messageType = type.toLowerCase().trim();

    console.log("📍 Message Type:", messageType); // Debug log

    switch (messageType) {
      case "text":
        if (!text) return res.status(400).json({ message: "Text required" });
        messageOptions = { text };
        break;

      case "image":
        if (!image_url) return res.status(400).json({ message: "image_url required" });
        messageOptions = {
          image: { url: image_url },
          caption: text || ""
        };
        break;

      case "file":
      case "document":
        if (!file_url) return res.status(400).json({ message: "file_url required" });

        messageOptions = {
          document: { url: file_url },
          mimetype: mime.lookup(file_url) || "application/octet-stream",
          fileName: file_url.split("/").pop() || "file",
          caption: text || ""
        };
        break;

      case "button":
      case "buttons":
        // ⚠️ Buttons are deprecated by WhatsApp (May 2023)
        // Using POLL as alternative (works 100%)
        if (!button || !button.body || !button.buttons)
          return res.status(400).json({ message: "Invalid button payload" });

        const pollOptions = button.buttons.map(b => b.buttonText.displayText);

        messageOptions = {
          poll: {
            name: button.body + (button.footer ? `\n\n${button.footer}` : ""),
            values: pollOptions,
            selectableCount: 1
          }
        };
        break;

      case "poll":
        if (!req.body.poll || !req.body.poll.options)
          return res.status(400).json({ message: "Invalid poll payload" });

        messageOptions = {
          poll: {
            name: req.body.poll.question,
            values: req.body.poll.options,
            selectableCount: req.body.poll.selectableCount || 1
          }
        };
        break;

      case "list":
        if (!list || !list.sections)
          return res.status(400).json({ message: "Invalid list payload" });

        // ✅ Correct list message format
        messageOptions = {
          text: list.body,
          footer: list.footer || "",
          title: list.title || "",
          buttonText: list.buttonText || "View Options",
          sections: list.sections.map(section => ({
            title: section.title,
            rows: section.rows.map(row => ({
              title: row.title,
              rowId: row.rowId,
              description: row.description || ""
            }))
          }))
        };
        break;

      case "template":
        if (!template)
          return res.status(400).json({ message: "template payload required" });

        messageOptions = template;
        break;

      default:
        console.error("❌ Unrecognized type:", type);
        return res.status(400).json({ 
          message: "Invalid message type",
          receivedType: type,
          allowedTypes: ["text", "image", "file", "document", "button", "buttons", "list", "template"]
        });
    }

    console.log("📤 Sending message with options:", JSON.stringify(messageOptions, null, 2));

    const result = await sock.sendMessage(jid, messageOptions);

    user.activePlan.messagesUsed += 1;
    user.activePlan.messagesUsedToday += 1;
    await user.save();

    return res.json({
      success: true,
      message: "Message sent successfully ✨",
      messageId: result.key.id,
      usedToday: user.activePlan.messagesUsedToday,
      limit: user.activePlan.planId.messages,
      remainingToday: user.activePlan.planId.messages - user.activePlan.messagesUsedToday
    });

  } catch (err) {
    console.error("❌ Send Error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message
    });
  }
});


/* ===========================
   📌 WEBHOOK HANDLER
===========================*/

router.post("/webhook", async (req, res) => {
  try {
    const data = req.body;

    console.log("\n📩 Incoming Webhook:", JSON.stringify(data, null, 2));

    const { from, type, text, buttonId } = data;

    const sock = getUserSock(String(data.userId));

    if (!sock) {
      console.log("☠️ No active WhatsApp session to reply");
      return res.sendStatus(200);
    }

    // Auto Reply for Button Click
    if (type === "button_reply") {
      await sock.sendMessage(from, { text: `You selected: *${buttonId}*` });
    }

    // Auto Reply for Text Messages
    if (type === "text") {
      await sock.sendMessage(from, { text: `You said: "${text}" 👀` });
    }

    res.sendStatus(200);

  } catch (err) {
    console.error("Webhook Error:", err);
    res.status(500).json({ error: err.message });
  }
});


export default router;