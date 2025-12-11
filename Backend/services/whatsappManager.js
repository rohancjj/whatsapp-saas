import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from "@whiskeysockets/baileys";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import WhatsAppSession from "../models/WhatsAppSession.js";

const createLogger = () => {
  const noop = () => {};
  return {
    level: "silent",
    trace: noop,
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    fatal: noop,
    silent: noop,
    child: () => createLogger(),
  };
};

const SESSIONS_DIR = path.join(process.cwd(), "wa_sessions");
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

const userSockets = {};
const reconnectTimeouts = {};
const userInitializers = {};

export const getUserSock = (userId) => userSockets[userId];

export const checkWhatsAppNumber = async (number) => {
  try {
    const clean = number.replace(/\D/g, "");
    const sanitized = clean.startsWith('+') ? clean.slice(1) : clean;
    const jid = `${sanitized}@s.whatsapp.net`;

    console.log(`🔍 Checking WhatsApp number: ${jid}`);

    let sock = null;
    for (const userId in userSockets) {
      const userSock = userSockets[userId];
      if (userSock && userSock.user && userSock.ws?.readyState === 1) {
        sock = userSock;
        console.log(`✅ Using active session from user ${userId} for number check`);
        break;
      }
    }

    if (!sock) {
      console.log("⚠️ No active WhatsApp sessions available for number check");
      return null;
    }

    const result = await sock.onWhatsApp(jid);
    console.log(`✅ WhatsApp check result for ${jid}:`, result);
    return result?.[0]?.exists || false;
    
  } catch (err) {
    console.error("❌ Error checking WhatsApp number:", err.message);
    return null;
  }
};

const clearSession = (userId) => {
  const sessionPath = path.join(SESSIONS_DIR, userId);
  try {
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
      console.log(`🗑️ Cleared session for user ${userId}`);
    }
  } catch (err) {
    console.error("❌ Failed to clear session:", err);
  }
};

export const createInstanceForUser = async (io, user) => {
  const userId = user._id.toString();
  const sessionPath = path.join(SESSIONS_DIR, userId);
  const logger = createLogger();

  if (reconnectTimeouts[userId]) {
    clearTimeout(reconnectTimeouts[userId]);
    delete reconnectTimeouts[userId];
  }

  if (userSockets[userId]) {
    const sock = userSockets[userId];
    if (sock.ws?.readyState === 1 && sock.user) return sock;

    try {
      sock.ws?.close();
      sock.end?.();
    } catch {}
    delete userSockets[userId];
  }

  if (userInitializers[userId]) return userInitializers[userId];

  userInitializers[userId] = (async () => {
    try {
      if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
      }

      let version = [2, 3000, 1010];
      try {
        const v = await fetchLatestBaileysVersion();
        version = v.version;
      } catch {
        console.log("⚠ Using fallback WA version");
      }

      const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

      const sock = makeWASocket({
        logger,
        version,
        printQRInTerminal: false,
        browser: ["Chrome (Linux)", "", ""],
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        markOnlineOnConnect: false,
        syncFullHistory: false,
        fireInitQueries: false,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
      });

      userSockets[userId] = sock;

      sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
        if (qr) {
          console.log(`📷 Emitting QR code for user ${userId}`);
          io.to(userId).emit("qr", qr);
        }

        if (connection === "open") {
          const phoneNumber = sock.user?.id?.split(":")[0];
          
          console.log(`✅ WhatsApp connected for user ${userId}, phone: ${phoneNumber}`);

          // CRITICAL FIX: Ensure API key is preserved/generated
          let session = await WhatsAppSession.findOne({ userId });
          let apiKey = session?.apiKey || user.activePlan?.apiKey;

          // If still no API key, generate one
          if (!apiKey) {
            apiKey = `wa_${crypto.randomBytes(32).toString("hex")}`;
            console.log(`🔑 Generated new API key: ${apiKey.slice(0, 20)}...`);
          }

          // Update session with connection info AND API key
          await WhatsAppSession.findOneAndUpdate(
            { userId },
            {
              connected: true,
              apiKey: apiKey,
              phoneNumber: phoneNumber,
              updatedAt: new Date(),
            },
            { upsert: true }
          );

          console.log(`💾 Saved session for user ${userId} with API key: ${apiKey.slice(0, 20)}...`);

          // Emit connection event with phone number
          io.to(userId).emit("whatsapp_connected", {
            phoneNumber: phoneNumber,
            apiKey: apiKey
          });
        }

        if (connection === "close") {
          const code = lastDisconnect?.error?.output?.statusCode;
          console.log(`❌ Connection closed for user ${userId}, code: ${code}`);

          if (code === DisconnectReason.loggedOut) {
            clearSession(userId);
            await WhatsAppSession.updateOne({ userId }, { connected: false });
            delete userSockets[userId];
            io.to(userId).emit("whatsapp_logged_out");
            console.log(`🚪 User ${userId} logged out`);
            return;
          }

          // Auto-reconnect for other disconnection reasons
          console.log(`🔄 Scheduling reconnect for user ${userId}`);
          reconnectTimeouts[userId] = setTimeout(() => {
            delete userSockets[userId];
            createInstanceForUser(io, user);
          }, 3000);
        }
      });

      sock.ev.on("creds.update", saveCreds);

      return sock;
    } finally {
      delete userInitializers[userId];
    }
  })();

  return userInitializers[userId];
};

export const loadAllSessionsOnStart = async (io) => {
  try {
    console.log("♻️ Loading all active WhatsApp sessions...");
    const active = await WhatsAppSession.find({ connected: true });

    console.log(`📊 Found ${active.length} active sessions to restore`);

    for (const session of active) {
      const userId = session.userId.toString();
      const sessionPath = path.join(SESSIONS_DIR, userId);

      if (!fs.existsSync(sessionPath)) {
        console.log(`⚠️ Session files missing for user ${userId}, marking as disconnected`);
        await WhatsAppSession.updateOne({ userId }, { connected: false });
        continue;
      }

      console.log(`🔄 Restoring session for user ${userId}`);
      await createInstanceForUser(io, {
        _id: userId,
        activePlan: { apiKey: session.apiKey },
      });
    }

    console.log("✅ Session restoration complete");
  } catch (err) {
    console.error("❌ Failed to restore WhatsApp sessions:", err);
  }
};
