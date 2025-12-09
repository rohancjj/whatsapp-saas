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

/* ===========================
   SEND MESSAGE (UPDATED)
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

    // Limit check
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

    const { to, type, text, image_url, file_url, template, list, poll } = req.body;

    if (!to || !type) return res.status(400).json({ message: "Missing fields: to, type" });

    const jid = to.includes("@") ? to : `${to}@s.whatsapp.net`;
    let messageOptions = {};

    switch (type.toLowerCase()) {

      /** 📌 TEXT MESSAGE */
      case "text":
        if (!text) return res.status(400).json({ message: "Text required" });
        messageOptions = { text };
        break;

      /** 📌 IMAGE MESSAGE */
      case "image":
        if (!image_url) return res.status(400).json({ message: "image_url required" });
        messageOptions = { image: { url: image_url }, caption: text || "" };
        break;

      /** 📌 FILE MESSAGE */
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

      /** 📌 POLL (NEW METADATA FORMAT) */
      case "poll":
        if (!poll?.options || !poll?.question)
          return res.status(400).json({ message: "Poll requires question and options" });

        messageOptions = {
          poll: {
            name: poll.question,
            values: poll.options,
            selectableCount: poll.selectableCount || 1
          }
        };
        break;

      /** 📌 LIST MESSAGE (Fully updated for Baileys 7.x.x) */
      case "list":
  if (!list?.message) {
    return res.status(400).json({ message: "Invalid list payload" });
  }

  messageOptions = list.message; // pass full interactive payload
  break;


      /** 📌 TEMPLATE BUTTON MESSAGE (Baileys v7 Interactive Format) */
      case "template":
        if (!template?.buttons || !template?.text)
          return res.status(400).json({ message: "Template requires text + buttons array" });

        messageOptions = {
          interactive: {
            type: "button",
            body: { text: template.text },
            footer: { text: template.footer || "" },
            action: {
              buttons: template.buttons.map((btn, index) => ({
                type: "reply",
                reply: {
                  id: btn.id || `btn_${index}`,
                  title: btn.title
                }
              }))
            }
          }
        };
        break;

      default:
        return res.status(400).json({
          message: "Invalid message type",
          receivedType: type,
          allowedTypes: ["text","image","file","document","poll","list","template"]
        });
    }

    console.log("📤 Sending →", messageOptions);

    const result = await sock.sendMessage(jid, messageOptions);

    user.activePlan.messagesUsed += 1;
    user.activePlan.messagesUsedToday += 1;
    await user.save();

    res.json({
      success: true,
      message: "Message sent successfully ✨",
      messageId: result.key.id
    });

  } catch (err) {
    console.error("❌ Send Error:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
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