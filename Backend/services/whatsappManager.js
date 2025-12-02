// services/whatsappManager.js
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from "@whiskeysockets/baileys";
import fs from "fs";
import path from "path";
import { Boom } from "@hapi/boom";
import WhatsAppSession from "../models/WhatsAppSession.js";


const getStatusCode = (lastDisconnect) => {
  if (!lastDisconnect?.error) return null;
  

  if (lastDisconnect.error.output?.statusCode) {
    return lastDisconnect.error.output.statusCode;
  }
  
 
  if (lastDisconnect.error.statusCode) {
    return lastDisconnect.error.statusCode;
  }
  

  if (lastDisconnect.error.data?.attrs?.code) {
    return parseInt(lastDisconnect.error.data.attrs.code);
  }
  
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
      console.log(`🗑️ Cleared session files for user: ${userId}`);
    }
  } catch (e) {
    console.error(`Failed to clear session for ${userId}:`, e);
  }
};


export const createInstanceForUser = async (io, user) => {
  const userId = user._id.toString();
  const sessionPath = path.join(SESSIONS_DIR, userId);

  if (reconnectTimeouts[userId]) {
    clearTimeout(reconnectTimeouts[userId]);
    delete reconnectTimeouts[userId];
  }


  if (userSockets[userId]) {
    try {
      const sock = userSockets[userId];
      if (sock.ws?.readyState === 1 && sock.user) {
        console.log("ℹ️ Reusing existing healthy socket for user:", userId);
        return sock;
      } else {
        console.log("⚠️ Existing socket unhealthy, cleaning up...");
        try {
          sock.ws?.close();
          sock.end();
        } catch (e) {
          console.warn("Cleanup error:", e.message);
        }
        delete userSockets[userId];
      }
    } catch (e) {
      console.warn("Socket health check failed:", e.message);
      delete userSockets[userId];
    }
  }


  if (userInitializers[userId]) {
    console.log("⏳ Waiting for existing initializer for user:", userId);
    return userInitializers[userId];
  }


  userInitializers[userId] = (async () => {
    try {
      console.log("🟦 Creating WhatsApp instance for user:", userId);
      

      if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
      }

      let version;
      try {
        const latestVersion = await fetchLatestBaileysVersion();
        version = latestVersion.version;
        console.log(`📦 Using Baileys version: ${version.join(".")}`);
      } catch (e) {
        console.warn("⚠️ Could not fetch latest version:", e.message);
      }

      const { state, saveCreds } = await useMultiFileAuthState(sessionPath);


      const sock = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, {
            logger: undefined
          }),
        },
        printQRInTerminal: false,
        browser: ["Chrome (Linux)", "", ""],
        
       
        markOnlineOnConnect: false,
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
        patchMessageBeforeSending: (message) => {
          const requiresPatch = !!(
            message.buttonsMessage ||
            message.templateMessage ||
            message.listMessage
          );
          if (requiresPatch) {
            message = {
              viewOnceMessage: {
                message: {
                  messageContextInfo: {
                    deviceListMetadataVersion: 2,
                    deviceListMetadata: {},
                  },
                  ...message,
                },
              },
            };
          }
          return message;
        },
        
     
        retryRequestDelayMs: 250,
        maxMsgRetryCount: 5,
        connectTimeoutMs: 60_000,
        keepAliveIntervalMs: 30_000,
        defaultQueryTimeoutMs: 60_000,
        
        
        fireInitQueries: false,
        emitOwnEvents: false,
        getMessage: async () => undefined,
      });

  
      userSockets[userId] = sock;

   
      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr, isNewLogin } = update;

        if (qr) {
          console.log("📲 QR generated for user:", userId);
          io.to(userId).emit("qr", qr);
        }

        if (isNewLogin) {
          console.log("🆕 New login detected for user:", userId);
        }

        if (connection === "open") {
          console.log("✅ WhatsApp connected for user:", userId);
          
        
          try {
            await WhatsAppSession.findOneAndUpdate(
              { userId },
              {
                apiKey: user.activePlan?.apiKey || undefined,
                connected: true,
                phoneNumber: sock.user?.id?.split(":")[0] || null,
                updatedAt: new Date(),
              },
              { upsert: true }
            );
          } catch (e) {
            console.error("DB update error:", e);
          }

          io.to(userId).emit("whatsapp_connected", {
            phoneNumber: sock.user?.id?.split(":")[0] || null,
          });
        }

        if (connection === "close") {
          const statusCode = getStatusCode(lastDisconnect);
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          
          console.log(`❌ Connection closed for ${userId}, code: ${statusCode}`);

          
          if (statusCode === DisconnectReason.loggedOut) {
            console.log("🚪 User logged out, clearing session");
            clearSession(userId);
            
            try {
              await WhatsAppSession.findOneAndUpdate(
                { userId },
                { connected: false, phoneNumber: null }
              );
            } catch (e) {
              console.error("DB update error:", e);
            }

            delete userSockets[userId];
            io.to(userId).emit("whatsapp_disconnected", { 
              reason: "logged_out",
              message: "You have been logged out of WhatsApp"
            });
          } 
          
          else if (statusCode === 401) {
            console.log("🔒 Session unauthorized (401), clearing and restarting");
            clearSession(userId);
            delete userSockets[userId];
            
           
            reconnectTimeouts[userId] = setTimeout(async () => {
              console.log(`🔄 Retrying connection for ${userId} after 401 error`);
              try {
                await createInstanceForUser(io, user);
              } catch (e) {
                console.error(`Reconnect failed for ${userId}:`, e);
              }
            }, 5000);
          }
          
          else if (statusCode === 515 || statusCode === DisconnectReason.restartRequired) {
            console.log(`🔄 Stream error (515), reconnecting for ${userId}...`);
            delete userSockets[userId];
            
         
            reconnectTimeouts[userId] = setTimeout(async () => {
              try {
                console.log(`♻️ Reconnecting ${userId} after stream error`);
                await createInstanceForUser(io, user);
              } catch (e) {
                console.error(`Reconnect failed for ${userId}:`, e);
              }
            }, 2000);
          }
       
          else if (shouldReconnect) {
            console.log(`🔄 Temporary disconnect (${statusCode}), will reconnect automatically`);
           
          } 
         
          else {
            console.log(`⚠️ Unknown disconnect reason (${statusCode}), cleaning up`);
            delete userSockets[userId];
          }
        }
      });


      sock.ev.on("creds.update", saveCreds);

      
      sock.ev.on("messages.upsert", async (m) => {
        try {
          const msg = m.messages?.[0];
          if (!msg || msg.key?.fromMe) return;

          const from = msg.key.remoteJid;
          const text =
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            "";

          console.log(`📨 Message from ${from}: ${text}`);
          
          io.to(userId).emit("newMessage", {
            from,
            text,
            timestamp: new Date(),
          });
        } catch (e) {
          console.error("Message handler error:", e);
        }
      });

      return sock;
    } catch (err) {
      console.error(`❌ Failed to create instance for ${userId}:`, err);
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
    const sessions = await WhatsAppSession.find({ connected: true });

    if (!sessions.length) {
      console.log("➡️ No sessions to restore");
      return;
    }

    console.log(`🔄 Restoring ${sessions.length} sessions...`);

    for (const session of sessions) {
      const userId = session.userId.toString();
      const sessionPath = path.join(SESSIONS_DIR, userId);

     
      if (!fs.existsSync(sessionPath)) {
        console.log(`⚠️ No session files for ${userId}, marking disconnected`);
        await WhatsAppSession.findOneAndUpdate(
          { userId },
          { connected: false }
        );
        continue;
      }

      try {
        console.log(`♻️ Restoring session for: ${userId}`);
        
        const fakeUser = {
          _id: userId,
          activePlan: { apiKey: session.apiKey },
        };

        await createInstanceForUser(io, fakeUser);
      } catch (e) {
        console.error(`Failed to restore ${userId}:`, e.message);
      }
    }

    console.log("✅ Session restoration complete");
  } catch (err) {
    console.error("❌ Session restore error:", err);
  }
};

export const disconnectUser = async (userId) => {
  const sock = userSockets[userId];
  
  if (sock) {
    try {
      await sock.logout();
    } catch (e) {
      console.warn("Logout error:", e);
    }
    
    delete userSockets[userId];
  }

  clearSession(userId);
  
  if (reconnectTimeouts[userId]) {
    clearTimeout(reconnectTimeouts[userId]);
    delete reconnectTimeouts[userId];
  }
};