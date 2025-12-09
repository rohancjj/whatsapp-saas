import express from "express";
import crypto from "crypto";
import authMiddleware from "../middlewares/authMiddleware.js";
import User from "../models/User.js";
import WhatsAppSession from "../models/WhatsAppSession.js";
import { resetIfNeeded } from "../utils/resetMessageLimit.js";
import mime from "mime-types";
import { createInstanceForUser, getUserSock } from "../services/whatsappManager.js";

const router = express.Router();
const generateApiKey = () => `wa_${crypto.randomBytes(32).toString("hex")}`;


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

    await User.findByIdAndUpdate(userId, { "activePlan.apiKey": apiKey });
    await WhatsAppSession.findOneAndUpdate({ userId }, { apiKey, connected: false, updatedAt: new Date() }, { upsert: true });

    await createInstanceForUser(io, { ...user.toObject(), activePlan: { ...user.activePlan, apiKey } });

    res.json({ message: "Scan QR Code in WhatsApp", apiKey });
  } catch (err) {
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


      /* 🟢 FIXED — NATIVE FLOW WITH IMAGE SUPPORT */
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

      /* 🟣 CTA COPY BUTTON FIXED */
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

export default router;
