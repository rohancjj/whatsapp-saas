import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  jidNormalizedUser
} from "@whiskeysockets/baileys";

import fs from "fs";
import path from "path";
import WhatsAppSession from "../models/WhatsAppSession.js";

/* -------------------------------------------------------
   LOGGER (silent)
-------------------------------------------------------- */
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

/* -------------------------------------------------------
   DIRECTORY FOR SESSIONS
-------------------------------------------------------- */
const SESSIONS_DIR = path.join(process.cwd(), "wa_sessions");
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

const userSockets = {};
const reconnectTimeouts = {};
const userInitializers = {};

export const getUserSock = (userId) => userSockets[userId];

/* -------------------------------------------------------
   🔥 CHECK WHATSAPP NUMBER - USES ACTIVE SESSION
   (Requires at least one user to be connected)
-------------------------------------------------------- */
export const checkWhatsAppNumber = async (number) => {
  try {
    // Clean and format the number
    const clean = number.replace(/\D/g, "");
    const sanitized = clean.startsWith('+') ? clean.slice(1) : clean;
    const jid = `${sanitized}@s.whatsapp.net`;

    console.log(`🔍 Checking WhatsApp number: ${jid}`);

    // Find ANY connected user's socket to use for the check
    // This doesn't expose any data - just uses their connection to query WhatsApp
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
      return null; // Return null = can't verify right now
    }

    // Check if number exists on WhatsApp
    const result = await sock.onWhatsApp(jid);
    
    console.log(`✅ WhatsApp check result for ${jid}:`, result);

    return result?.[0]?.exists || false;
  } catch (err) {
    console.error("❌ Error checking WhatsApp number:", err.message);
    return null; // Return null on error
  }
};

/* -------------------------------------------------------
   CLEAR SESSION
-------------------------------------------------------- */
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

/* -------------------------------------------------------
   CREATE WHATSAPP INSTANCE FOR USER
-------------------------------------------------------- */
export const createInstanceForUser = async (io, user) => {
  const userId = user._id.toString();
  const sessionPath = path.join(SESSIONS_DIR, userId);
  const logger = createLogger();

  // Cancel any pending reconnect
  if (reconnectTimeouts[userId]) {
    clearTimeout(reconnectTimeouts[userId]);
    delete reconnectTimeouts[userId];
  }

  // Reuse active socket
  if (userSockets[userId]) {
    const sock = userSockets[userId];
    if (sock.ws?.readyState === 1 && sock.user) return sock;

    try {
      sock.ws?.close();
      sock.end?.();
    } catch {}
    delete userSockets[userId];
  }

  // Avoid double initialization
  if (userInitializers[userId]) return userInitializers[userId];

  userInitializers[userId] = (async () => {
    try {
      if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
      }

      // Get latest WhatsApp Web Version
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

      /* -------------------------------------------------------
         CONNECTION LOGIC
      -------------------------------------------------------- */
      sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
        if (qr) io.to(userId).emit("qr", qr);

        if (connection === "open") {
          await WhatsAppSession.findOneAndUpdate(
            { userId },
            {
              connected: true,
              apiKey: user.activePlan?.apiKey,
              phoneNumber: sock.user?.id?.split(":")[0],
              updatedAt: new Date(),
            },
            { upsert: true }
          );

          io.to(userId).emit("whatsapp_connected", {
            phoneNumber: sock.user?.id?.split(":")[0],
          });
        }

        if (connection === "close") {
          const code = lastDisconnect?.error?.output?.statusCode;

          if (code === DisconnectReason.loggedOut) {
            clearSession(userId);
            await WhatsAppSession.updateOne({ userId }, { connected: false });
            delete userSockets[userId];
            io.to(userId).emit("whatsapp_logged_out");
            return;
          }

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

/* -------------------------------------------------------
   RESTORE ALL SESSIONS ON SERVER START
-------------------------------------------------------- */
export const loadAllSessionsOnStart = async (io) => {
  try {
    const active = await WhatsAppSession.find({ connected: true });

    for (const session of active) {
      const userId = session.userId.toString();
      const sessionPath = path.join(SESSIONS_DIR, userId);

      if (!fs.existsSync(sessionPath)) {
        await WhatsAppSession.updateOne({ userId }, { connected: false });
        continue;
      }

      await createInstanceForUser(io, {
        _id: userId,
        activePlan: { apiKey: session.apiKey },
      });
    }
  } catch (err) {
    console.error("❌ Failed to restore WhatsApp sessions:", err);
  }
};