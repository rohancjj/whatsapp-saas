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
const maxReconnectAttempts = {}; // Track reconnection attempts

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

  // Clear any existing reconnect timeout
  if (reconnectTimeouts[userId]) {
    clearTimeout(reconnectTimeouts[userId]);
    delete reconnectTimeouts[userId];
  }

  // Don't close existing socket if it's already connected
  if (userSockets[userId]) {
    const sock = userSockets[userId];
    // If socket is open and authenticated, return it
    if (sock.ws?.readyState === 1 && sock.user) {
      console.log(`♻️ Reusing existing connection for user ${userId}`);
      return sock;
    }

    // Only cleanup if socket is not in good state
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
        // IMPORTANT: Keep connection alive even when no clients are connected
        emitOwnEvents: true,
        getMessage: async () => undefined,
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

          // Reset reconnect attempts on successful connection
          maxReconnectAttempts[userId] = 0;

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
          const reason = lastDisconnect?.error?.output?.payload?.error;
          
          console.log(`❌ Connection closed for user ${userId}, code: ${code}, reason: ${reason}`);

          // ONLY disconnect on explicit logout
          if (code === DisconnectReason.loggedOut) {
            console.log(`🚪 User ${userId} explicitly logged out - clearing session`);
            clearSession(userId);
            await WhatsAppSession.updateOne({ userId }, { connected: false });
            delete userSockets[userId];
            delete maxReconnectAttempts[userId];
            io.to(userId).emit("whatsapp_logged_out");
            return;
          }

          // Handle connection lost errors - but keep reconnecting
          const shouldReconnect = [
            DisconnectReason.connectionClosed,
            DisconnectReason.connectionLost,
            DisconnectReason.connectionReplaced,
            DisconnectReason.timedOut,
            DisconnectReason.restartRequired,
            DisconnectReason.badSession,
            428, // Connection timeout
            500, // Internal error
            503, // Service unavailable
          ].includes(code);

          if (shouldReconnect || !code) {
            // Initialize reconnect attempt counter
            if (!maxReconnectAttempts[userId]) {
              maxReconnectAttempts[userId] = 0;
            }

            maxReconnectAttempts[userId]++;
            
            // Exponential backoff: 3s, 6s, 12s, 24s, max 60s
            const delay = Math.min(3000 * Math.pow(2, maxReconnectAttempts[userId] - 1), 60000);

            console.log(`🔄 Auto-reconnect scheduled for user ${userId} (attempt ${maxReconnectAttempts[userId]}) in ${delay/1000}s`);
            console.log(`📡 Keeping session active - user can still use API from other devices`);

            reconnectTimeouts[userId] = setTimeout(async () => {
              console.log(`🔌 Attempting reconnection for user ${userId}...`);
              delete userSockets[userId];
              
              try {
                await createInstanceForUser(io, user);
              } catch (error) {
                console.error(`❌ Reconnection failed for user ${userId}:`, error.message);
                // Schedule another attempt
                if (maxReconnectAttempts[userId] < 50) { // Maximum 50 attempts
                  setTimeout(() => createInstanceForUser(io, user), delay);
                }
              }
            }, delay);

            return;
          }

          // For any other disconnection reason, try to reconnect
          console.log(`⚠️ Unexpected disconnection for user ${userId} - attempting reconnect`);
          reconnectTimeouts[userId] = setTimeout(() => {
            delete userSockets[userId];
            createInstanceForUser(io, user);
          }, 5000);
        }
      });

      sock.ev.on("creds.update", saveCreds);

      // Handle WebSocket errors without disconnecting
      sock.ev.on("ws.close", (data) => {
        console.log(`⚠️ WebSocket closed for user ${userId}, but keeping session alive`);
        // Don't delete socket, let connection.update handle reconnection
      });

      sock.ev.on('connection.error', (error) => {
        console.error(`⚠️ Connection error for user ${userId}:`, error.message);
        // Don't disconnect, let auto-reconnect handle it
      });

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

// Manual disconnect function - only for explicit user action
export const manualDisconnect = async (userId, io) => {
  const sock = userSockets[userId];
  
  console.log(`🚫 Manual disconnect initiated for user: ${userId}`);

  // Clear any reconnect timeouts
  if (reconnectTimeouts[userId]) {
    clearTimeout(reconnectTimeouts[userId]);
    delete reconnectTimeouts[userId];
  }

  // Logout from WhatsApp
  if (sock && sock.user) {
    try { 
      await sock.logout(); 
      console.log("✅ Logged out successfully");
    } catch (err) {
      console.log("⚠️ Logout error:", err.message);
    }
  }

  // Close WebSocket
  if (sock) {
    try { sock.ws?.close(); } catch {}
    try { sock.end?.(); } catch {}
  }

  // Clear session files
  clearSession(userId);

  // Update database
  await WhatsAppSession.findOneAndUpdate(
    { userId },
    { connected: false, phoneNumber: null }
  );

  // Clean up memory
  delete userSockets[userId];
  delete maxReconnectAttempts[userId];

  // Notify frontend
  io.to(userId).emit("whatsapp_logged_out");

  return true;
};