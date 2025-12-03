import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from "@whiskeysockets/baileys";

import fs from "fs";
import path from "path";

// ✅ SEPARATE SESSION DIRECTORY FOR ADMIN
const ADMIN_SESSION_DIR = path.join(process.cwd(), "wa_admin_session");

let adminSock = null;
let initializing = null;
let reconnectTimeout = null;
let lastQREmitTime = 0;
let connectionCheckTimeout = null;
const QR_EMIT_COOLDOWN = 2000;
const CONNECTION_TIMEOUT = 30000; // 30 seconds to connect

/* ==========================================================
   SILENT LOGGER
========================================================== */
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

export const getAdminSock = () => adminSock;

/* ==========================================================
   CHECK IF SESSION EXISTS AND IS VALID
========================================================== */
const hasValidSession = () => {
  const credsPath = path.join(ADMIN_SESSION_DIR, "creds.json");
  return fs.existsSync(credsPath);
};

/* ==========================================================
   CLEANUP FUNCTION
========================================================== */
const cleanupAdminSession = () => {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  
  if (connectionCheckTimeout) {
    clearTimeout(connectionCheckTimeout);
    connectionCheckTimeout = null;
  }
  
  if (adminSock) {
    try {
      adminSock.ev.removeAllListeners();
      adminSock.ws?.close();
    } catch (err) {
      console.error("Error cleaning up admin socket:", err);
    }
    adminSock = null;
  }
};

/* ==========================================================
   EMIT ADMIN STATUS TO ALL CLIENTS
========================================================== */
const emitAdminStatus = (io, connected, phoneNumber = null) => {
  if (connected) {
    io.emit("admin_qr", null);
    io.emit("admin_connected", { phoneNumber });
    console.log("📡 Emitted: admin_connected to all clients");
  } else {
    io.emit("admin_disconnected");
    console.log("📡 Emitted: admin_disconnected to all clients");
  }
};

/* ==========================================================
   INITIALIZE ADMIN WHATSAPP (PRODUCTION STABLE - FIXED)
========================================================== */
export const initializeAdminWhatsApp = async (io) => {
  // Prevent duplicate initialization
  if (initializing) {
    console.log("⏳ Admin WA already initializing...");
    return initializing;
  }

  // ✅ CRITICAL FIX: If already connected and valid, emit status immediately
  if (adminSock?.user?.id) {
    const phone = adminSock.user.id.split(":")[0];
    console.log("✅ Admin WA already connected:", phone);
    emitAdminStatus(io, true, phone);
    return adminSock;
  }

  initializing = (async () => {
    try {
      console.log("🚀 Starting Admin WhatsApp initialization...");

      // Create session directory
      if (!fs.existsSync(ADMIN_SESSION_DIR)) {
        fs.mkdirSync(ADMIN_SESSION_DIR, { recursive: true });
      }

      const sessionExists = hasValidSession();
      console.log(sessionExists ? "📂 Found existing session" : "🆕 No session found");

      // Get Baileys version
      let version = [2, 3000, 1010];
      try {
        const v = await fetchLatestBaileysVersion();
        version = v.version;
        console.log("📦 Using Baileys version:", version);
      } catch {
        console.log("⚠ Using fallback Baileys version for Admin WA");
      }

      const logger = createLogger();
      const { state, saveCreds } = await useMultiFileAuthState(ADMIN_SESSION_DIR);

      const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        browser: ["WhatsAPI Admin", "Chrome", "1.0.0"],
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        syncFullHistory: false,
        markOnlineOnConnect: false,
        getMessage: async () => undefined,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: undefined,
        keepAliveIntervalMs: 30000,
      });

      adminSock = sock;

      // ✅ CRITICAL: Set connection timeout
      connectionCheckTimeout = setTimeout(() => {
        if (sock.user?.id) {
          // Already connected, emit status
          const phone = sock.user.id.split(":")[0];
          console.log("⏰ Connection timeout - but already connected:", phone);
          emitAdminStatus(io, true, phone);
          connectionCheckTimeout = null;
        } else if (!sock.user) {
          console.log("⏰ Connection timeout - still connecting, will retry...");
        }
      }, CONNECTION_TIMEOUT);

      /* ======================================================
         CONNECTION HANDLING (FULLY FIXED - NO DOUBLE QR)
      ====================================================== */
      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr, isNewLogin } = update;

        const logData = {
          connection,
          qr: qr ? "YES" : "NO",
          isNewLogin,
          hasUser: !!sock.user,
          userId: sock.user?.id?.split(":")[0] || "none"
        };
        
        console.log("🔄 Admin Connection Update:", logData);

        /* --- WA CONNECTED (HIGHEST PRIORITY - PROCESS FIRST) --- */
        if (connection === "open") {
          const adminNumber = sock.user?.id?.split(":")[0];
          console.log("✅ ADMIN WhatsApp CONNECTED:", adminNumber);

          // Clear all timeouts
          if (connectionCheckTimeout) {
            clearTimeout(connectionCheckTimeout);
            connectionCheckTimeout = null;
          }

          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
          }

          // ✅ CRITICAL: Emit connected status (this clears QR on frontend)
          emitAdminStatus(io, true, adminNumber);
          
          // Reset QR throttle
          lastQREmitTime = 0;
          
          // ✅ CRITICAL: Return early to prevent any QR emission
          return;
        }

        /* --- QR GENERATED (ONLY WHEN NOT CONNECTED) --- */
        if (qr && connection !== "open" && !sock.user) {
          const now = Date.now();
          if (now - lastQREmitTime > QR_EMIT_COOLDOWN) {
            console.log("📲 Admin QR Generated - Emitting to frontend");
            io.emit("admin_qr", qr);
            io.emit("admin_disconnected");
            lastQREmitTime = now;
          } else {
            console.log("⏸️ QR emission throttled (too frequent)");
          }
          return;
        }

        /* --- CONNECTING STATE --- */
        if (connection === "connecting") {
          console.log("🔄 Admin WA connecting...");
          
          // ✅ FIX: If user exists during connecting, it means we're reconnecting
          if (sock.user?.id) {
            const phone = sock.user.id.split(":")[0];
            console.log("✅ Reconnecting with existing session:", phone);
            
            // Emit connected status even during reconnection
            setTimeout(() => {
              if (sock.user?.id) {
                emitAdminStatus(io, true, phone);
              }
            }, 2000); // Give 2 seconds for full connection
          }
          return;
        }

        /* --- WA DISCONNECTED --- */
        if (connection === "close") {
          const statusCode =
            lastDisconnect?.error?.output?.statusCode ||
            lastDisconnect?.error?.statusCode;

          console.log("❌ Admin Disconnected - Status Code:", statusCode);
          console.log("📋 Error details:", lastDisconnect?.error?.message);

          // Clear timeouts
          if (connectionCheckTimeout) {
            clearTimeout(connectionCheckTimeout);
            connectionCheckTimeout = null;
          }

          // Emit disconnected
          emitAdminStatus(io, false);

          // Cleanup
          cleanupAdminSession();

          // Handle different disconnect reasons
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          if (statusCode === DisconnectReason.loggedOut) {
            console.log("🗑️ Admin logged out → Clearing session");
            try {
              fs.rmSync(ADMIN_SESSION_DIR, { recursive: true, force: true });
            } catch (err) {
              console.error("Error removing admin session:", err);
            }
          } else if (statusCode === 515) {
            console.log("🔄 Server restart detected - will reconnect on next start");
            return;
          } else {
            console.log("⛔ Connection issue → Keeping session for reconnect");
          }

          // Auto reconnect
          if (shouldReconnect && statusCode !== 515) {
            const delay = statusCode === 408 ? 5000 : 3000;
            
            reconnectTimeout = setTimeout(() => {
              console.log("🔄 Reconnecting Admin WA...");
              initializing = null;
              initializeAdminWhatsApp(io).catch(err => {
                console.error("❌ Reconnection failed:", err);
              });
            }, delay);
          }
        }
      });

      // Save credentials on update
      sock.ev.on("creds.update", saveCreds);

      console.log("👑 Admin WhatsApp initialized successfully");
      
      // ✅ CRITICAL: Check if already connected after 5 seconds
      setTimeout(() => {
        if (sock.user?.id && !connectionCheckTimeout) {
          const phone = sock.user.id.split(":")[0];
          console.log("🔍 Post-init check: Already connected:", phone);
          emitAdminStatus(io, true, phone);
        }
      }, 5000);
      
      return sock;

    } catch (err) {
      console.error("❌ Admin WA Initialization Error:", err);
      cleanupAdminSession();
      throw err;
    } finally {
      initializing = null;
    }
  })();

  return initializing;
};

/* ==========================================================
   GRACEFUL SHUTDOWN
========================================================== */
export const shutdownAdminWhatsApp = async () => {
  console.log("🛑 Shutting down Admin WhatsApp...");
  cleanupAdminSession();
  console.log("Admin session preserved for next startup");
};

/* ==========================================================
   CHECK ADMIN CONNECTION STATUS
========================================================== */
export const getAdminConnectionStatus = () => {
  if (!adminSock) {
    return { connected: false, phone: null };
  }
  
  const phone = adminSock.user?.id?.split(":")[0];
  const connected = !!adminSock.user;
  
  return {
    connected,
    phone: phone || null
  };
};

/* ==========================================================
   FORCE EMIT ADMIN STATUS (For new connections)
========================================================== */
export const emitCurrentAdminStatus = (io) => {
  const status = getAdminConnectionStatus();
  if (status.connected) {
    emitAdminStatus(io, true, status.phone);
  } else {
    emitAdminStatus(io, false);
  }
};

/* ==========================================================
   NOTIFICATIONS MODULE
========================================================== */
const cleanPhone = (number) => {
  if (!number) return null;

  let cleaned = number.toString().trim().replace(/[^0-9]/g, "");

  if (cleaned.length === 10) {
    cleaned = "91" + cleaned;
  }

  return cleaned;
};

export const Notifications = {
  sendToUser: async (phone, text) => {
    try {
      const adminSock = getAdminSock();
      if (!adminSock || !adminSock.user) {
        console.log("❌ Admin WhatsApp not connected.");
        return { success: false, error: "Admin WhatsApp not connected" };
      }

      const cleaned = cleanPhone(phone);
      if (!cleaned) {
        console.log("❌ Invalid user phone number.");
        return { success: false, error: "Invalid phone number" };
      }

      const jid = `${cleaned}@s.whatsapp.net`;

      await adminSock.sendMessage(jid, { text });
      console.log("📩 User Notification Sent:", cleaned);
      
      return { success: true, to: cleaned };

    } catch (err) {
      console.error("❌ Error sending user notification:", err.message);
      return { success: false, error: err.message };
    }
  },

  sendToAdmin: async (text) => {
    try {
      const adminSock = getAdminSock();
      if (!adminSock || !adminSock.user) {
        console.log("❌ Admin WhatsApp not connected.");
        return { success: false, error: "Admin WhatsApp not connected" };
      }

      const adminNumber = cleanPhone(process.env.ADMIN_PHONE);
      if (!adminNumber) {
        console.log("❌ ADMIN_PHONE missing in .env");
        return { success: false, error: "ADMIN_PHONE not configured" };
      }

      const jid = `${adminNumber}@s.whatsapp.net`;

      await adminSock.sendMessage(jid, { text });
      console.log("👑 Admin Notification Sent:", adminNumber);
      
      return { success: true, to: adminNumber };

    } catch (err) {
      console.error("❌ Error sending admin notification:", err.message);
      return { success: false, error: err.message };
    }
  }
};