import fs from "fs";
import path from "path";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";

const AUTH_DIR = path.join(process.cwd(), "auth_info_multi");
const QR_FILE_PATH = path.join(process.cwd(), "qr_base64.txt");


let sock = null;
let ioRef = null;
let latestQR = null;
let initializing = false;
let isConnected = false;


export async function initWhatsApp(io) {
  if (initializing || sock) return sock;
  initializing = true;
  ioRef = io;

  try {
    if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ["Ubuntu", "Chrome", "22.04.4"],
      version,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        latestQR = qr;
        fs.writeFileSync(QR_FILE_PATH, qr, "utf8");
        ioRef?.emit("qr", qr);
        console.log("📲 New QR generated");
      }

      if (connection === "open") {
        console.log("✅ WhatsApp connected");
        isConnected = true;
        latestQR = null;
        ioRef?.emit("whatsapp_connected");
      }

      if (connection === "close") {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        console.log("❌ WhatsApp disconnected:", reason);
        isConnected = false;
        sock = null;
        initializing = false;

        if (reason === DisconnectReason.loggedOut) {
          fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          console.log("⚠️ Logged out. Session cleared.");
          setTimeout(() => initWhatsApp(ioRef), 5000);
        } else {
          console.log("💡 Reconnecting in 5s...");
          setTimeout(() => initWhatsApp(ioRef), 5000);
        }
      }
    });

    sock.ev.on("messages.upsert", async (m) => {
      const msg = m.messages[0];
      if (!msg.message || msg.key.fromMe) return;

      const from = msg.key.remoteJid;
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

      console.log("Received:", text, "from:", from);

      ioRef?.emit("newMessage", { sender: from, text, timestamp: new Date() });

      const lower = text.toLowerCase().trim();
      if (lower === "hi" || lower === "hello") {
        await sock.sendMessage(from, { text: "👋 Hello! How can I help you today?" });
      } else if (lower.includes("leave")) {
        await sock.sendMessage(from, { text: "🗓️ To apply for leave, please visit the HR portal or type 'help'." });
      } else if (lower === "help") {
        await sock.sendMessage(from, {
          text:
            "🤖 Available commands:\n" +
            "• hi / hello — Greet the bot\n" +
            "• leave — Leave request info\n" +
            "• help — Show this menu",
        });
      }
    });

    initializing = false;
    return sock;
  } catch (err) {
    console.error("❌ WhatsApp init failed:", err.message);
    sock = null;
    initializing = false;
    setTimeout(() => initWhatsApp(ioRef), 5000);
  }
}


export async function sendWhatsAppText(phone, message) {
  try {
    if (!sock) throw new Error("WhatsApp not connected");
    const jid = phone.includes("@s.whatsapp.net") ? phone : `${phone}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: message });
    console.log(`✅ Text message sent to ${phone}`);
  } catch (err) {
    console.error("❌ sendWhatsAppText Error:", err.message);
  }
}


export async function sendWhatsAppImage(phone, imageUrl, caption = "") {
  try {
    if (!sock) throw new Error("WhatsApp not connected");
    const jid = phone.includes("@s.whatsapp.net") ? phone : `${phone}@s.whatsapp.net`;
    await sock.sendMessage(jid, { image: { url: imageUrl }, caption });
    console.log(`✅ Image sent to ${phone}`);
  } catch (err) {
    console.error("❌ sendWhatsAppImage Error:", err.message);
  }
}


export function emitCurrentQR(socket) {
  if (latestQR) socket.emit("qr", latestQR);
}


export function IsWHConnected() {
  return isConnected;
}


export function getSock() {
  return sock;
}