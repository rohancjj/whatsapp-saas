// ==============================================================
// ✅ WHATSAPP MANAGER – MULTI-USER, MULTI-SESSION (FULL VERSION)
// ==============================================================

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from "@whiskeysockets/baileys";

import fs from "fs";
import path from "path";
import WhatsAppSession from "../models/WhatsAppSession.js";
import { Boom } from "@hapi/boom";


// ---------------------------------------------------------------
// 🔇 SILENT LOGGER (Fixes all logger.child errors)
// ---------------------------------------------------------------
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

// ---------------------------------------------------------------
// 🧾 Extract disconnect reason
// ---------------------------------------------------------------
const getStatusCode = (lastDisconnect) => {
  if (!lastDisconnect?.error) return null;

  if (lastDisconnect.error.output?.statusCode)
    return lastDisconnect.error.output.statusCode;

  if (lastDisconnect.error.statusCode)
    return lastDisconnect.error.statusCode;

  if (lastDisconnect.error.data?.attrs?.code)
    return parseInt(lastDisconnect.error.data.attrs.code);

  return null;
};

// ---------------------------------------------------------------
// 📁 SESSION DIRECTORY
// ---------------------------------------------------------------
const SESSIONS_DIR = path.join(process.cwd(), "wa_sessions");
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// ---------------------------------------------------------------
// 🚀 ACTIVE SOCKETS
// ---------------------------------------------------------------
const userSockets = {};
const userInitializers = {};
const reconnectTimeouts = {};

export const getUserSock = (userId) => userSockets[userId];

// ---------------------------------------------------------------
// 🗑️ Delete session folder
// ---------------------------------------------------------------
const clearSession = (userId) => {
  const sessionPath = path.join(SESSIONS_DIR, userId);
  try {
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
      console.log(`🗑️ Cleared session for user ${userId}`);
    }
  } catch (err) {
    console.error("Failed to clear session:", err);
  }
};

// ---------------------------------------------------------------
// 🚀 CREATE INSTANCE FOR USER (MAIN FUNCTION)
// ---------------------------------------------------------------
export const createInstanceForUser = async (io, user) => {
  const userId = user._id.toString();
  const sessionPath = path.join(SESSIONS_DIR, userId);

  const logger = createLogger();

  // prevent double reconnect
  if (reconnectTimeouts[userId]) {
    clearTimeout(reconnectTimeouts[userId]);
    delete reconnectTimeouts[userId];
  }

  // reuse active socket
  if (userSockets[userId]) {
    const sock = userSockets[userId];
    if (sock.ws?.readyState === 1 && sock.user) {
      console.log("ℹ️ Reusing active socket for:", userId);
      return sock;
    }

    try {
      sock.ws?.close();
      sock.end?.();
    } catch {}
    delete userSockets[userId];
  }

  // prevent duplicate init
  if (userInitializers[userId]) return userInitializers[userId];

  userInitializers[userId] = (async () => {
    try {
      console.log("🟦 Creating WhatsApp socket for:", userId);

      if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
      }

      // Fetch correct version
      let version = [2, 3000, 1010];
      try {
        const res = await fetchLatestBaileysVersion();
        version = res.version;
      } catch {
        console.log("⚠️ Using fallback version");
      }

      const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

      // SOCKET INIT
      const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        browser: ["Chrome (Linux)", "", ""],

        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },

        markOnlineOnConnect: false,
        syncFullHistory: false,
        fireInitQueries: false,

        retryRequestDelayMs: 300,
        connectTimeoutMs: 60_000,
        keepAliveIntervalMs: 30_000,
      });

      userSockets[userId] = sock;

      // -------------------------------------------------------------
      // 📲 MESSAGES RECEIVED
      // -------------------------------------------------------------
      sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.message) return;

        const from = msg.key.remoteJid;

        const text =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          "";

        const messageData = {
          from,
          text,
          timestamp: new Date(),
        };

        console.log("📩 Incoming:", messageData);

        io.to(userId).emit("incoming_message", messageData);
      });

      // -------------------------------------------------------------
      // 🔌 CONNECTION EVENTS
      // -------------------------------------------------------------
      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // 🔳 SEND QR TO USER
        if (qr) {
          console.log("📲 QR generated for", userId);
          io.to(userId).emit("qr", qr);
        }

        // 🟢 CONNECTED
        if (connection === "open") {
          console.log("✅ WA Connected:", userId);

          await WhatsAppSession.findOneAndUpdate(
            { userId },
            {
              apiKey: user.activePlan?.apiKey,
              connected: true,
              phoneNumber: sock.user?.id?.split(":")[0] || null,
              updatedAt: new Date(),
            },
            { upsert: true }
          );

          io.to(userId).emit("whatsapp_connected", {
            phoneNumber: sock.user?.id?.split(":")[0] || null,
          });
        }

        // 🔴 DISCONNECTED
        if (connection === "close") {
          const code = getStatusCode(lastDisconnect);
          console.log(`❌ Disconnected (${code}) for user ${userId}`);

          // logged out
          if (code === DisconnectReason.loggedOut) {
            clearSession(userId);

            await WhatsAppSession.findOneAndUpdate(
              { userId },
              { connected: false }
            );

            delete userSockets[userId];

            io.to(userId).emit("whatsapp_logged_out");
            return;
          }

          // temporary disconnect → reconnect
          if (
            [
              DisconnectReason.connectionClosed,
              DisconnectReason.connectionLost,
              DisconnectReason.timedOut,
              DisconnectReason.restartRequired,
            ].includes(code)
          ) {
            reconnectTimeouts[userId] = setTimeout(() => {
              console.log("🔄 Reconnecting user:", userId);
              delete userSockets[userId];
              createInstanceForUser(io, user);
            }, 3000);
            return;
          }

          // unknown fail
          await WhatsAppSession.findOneAndUpdate(
            { userId },
            { connected: false }
          );
          delete userSockets[userId];
        }
      });

      sock.ev.on("creds.update", saveCreds);

      return sock;
    } catch (err) {
      console.error(`❌ Instance init failed (${userId}):`, err);
      delete userSockets[userId];
      throw err;
    } finally {
      delete userInitializers[userId];
    }
  })();

  return userInitializers[userId];
};

// ---------------------------------------------------------------
// ♻️ RESTORE SESSIONS ON SERVER START
// ---------------------------------------------------------------
export const loadAllSessionsOnStart = async (io) => {
  try {
    const active = await WhatsAppSession.find({ connected: true });

    if (!active.length) {
      console.log("➡️ No sessions to restore");
      return;
    }

    console.log(`♻️ Restoring ${active.length} sessions...`);

    for (const session of active) {
      const userId = session.userId.toString();
      const sessionPath = path.join(SESSIONS_DIR, userId);

      // no folder? mark disconnected
      if (!fs.existsSync(sessionPath)) {
        await WhatsAppSession.findOneAndUpdate(
          { userId },
          { connected: false }
        );
        continue;
      }

      const fakeUser = {
        _id: userId,
        activePlan: { apiKey: session.apiKey },
        toObject: function () {
          return {
            _id: this._id,
            activePlan: this.activePlan,
          };
        },
      };

      try {
        await createInstanceForUser(io, fakeUser);
      } catch (err) {
        await WhatsAppSession.findOneAndUpdate(
          { userId },
          { connected: false }
        );
      }
    }
  } catch (err) {
    console.error("❌ Failed to restore sessions:", err);
  }
};
