
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


const createLogger = () => {
  const noop = (...args) => {};
  return {
    level: 'silent',
    trace: noop,
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    fatal: noop,
    silent: noop,
    child: (bindings) => createLogger(),
  };
};


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


const SESSIONS_DIR = path.join(process.cwd(), "wa_sessions");
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}


const userSockets = {};
const userInitializers = {};
const reconnectTimeouts = {};

export const getUserSock = (userId) => userSockets[userId];


const clearSession = (userId) => {
  const sessionPath = path.join(SESSIONS_DIR, userId);
  try {
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
      console.log(`🗑️ Cleared session for user ${userId}`);
    }
  } catch (err) {
    console.error(`Failed to clear session:`, err);
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
    if (sock.ws?.readyState === 1 && sock.user) {
      console.log("ℹ️ Reusing existing active socket for:", userId);
      return sock;
    }
   
    try {
      sock.ws?.close();
      sock.end?.();
    } catch {}
    delete userSockets[userId];
  }


  if (userInitializers[userId]) return userInitializers[userId];

  userInitializers[userId] = (async () => {
    try {
      console.log("🟦 Creating WhatsApp socket for:", userId);

      if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
      }

     
      let version = [2, 3000, 1010];
      try {
        const res = await fetchLatestBaileysVersion();
        version = res.version;
        console.log("✅ Using Baileys version:", version);
      } catch (err) {
        console.log("⚠️ Could not fetch latest version, using fallback");
      }

      const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

      
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

     
      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log("📲 QR generated for", userId);
          io.to(userId).emit("qr", qr);
        }

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

        if (connection === "close") {
          const code = getStatusCode(lastDisconnect);
          console.log(`❌ Disconnected (${code}) for user ${userId}`);

        
          if (code === DisconnectReason.loggedOut) {
            clearSession(userId);
            await WhatsAppSession.findOneAndUpdate(
              { userId },
              { connected: false, updatedAt: new Date() }
            );
            delete userSockets[userId];
            io.to(userId).emit("whatsapp_logged_out");
            return;
          }

        
          if (
            code === DisconnectReason.connectionClosed ||
            code === DisconnectReason.connectionLost ||
            code === DisconnectReason.timedOut ||
            code === DisconnectReason.restartRequired
          ) {
            reconnectTimeouts[userId] = setTimeout(() => {
              console.log("🔄 Reconnecting user:", userId);
              delete userSockets[userId];
              createInstanceForUser(io, user);
            }, 3000);
          } else {
           
            console.warn(`⚠️ Unknown disconnect reason (${code})`);
            await WhatsAppSession.findOneAndUpdate(
              { userId },
              { connected: false, updatedAt: new Date() }
            );
            delete userSockets[userId];
          }
        }
      });

      sock.ev.on("creds.update", saveCreds);

      return sock;
    } catch (err) {
      console.error(`❌ Instance creation failed (${userId}):`, err);
      delete userSockets[userId];
      throw err;
    } finally {
      delete userInitializers[userId];
    }
  })();

  return userInitializers[userId];
};


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

      if (!fs.existsSync(sessionPath)) {
        console.log(`⚠️ Session folder not found for ${userId}, marking as disconnected`);
        await WhatsAppSession.findOneAndUpdate(
          { userId },
          { connected: false, updatedAt: new Date() }
        );
        continue;
      }

      const fakeUser = {
        _id: userId,
        activePlan: { 
          apiKey: session.apiKey 
        },
        toObject: function() {
          return {
            _id: this._id,
            activePlan: this.activePlan
          };
        }
      };

      try {
        await createInstanceForUser(io, fakeUser);
        console.log(`✅ Restored session for user ${userId}`);
      } catch (e) {
        console.error(`❌ Session restore error for ${userId}:`, e.message);
        await WhatsAppSession.findOneAndUpdate(
          { userId },
          { connected: false, updatedAt: new Date() }
        );
      }
    }

    console.log("✅ Session restoration complete");
  } catch (err) {
    console.error("❌ Failed to restore sessions:", err);
  }
};