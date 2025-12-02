import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";

import fs from "fs";
import path from "path";
import WhatsAppSession from "../models/WhatsAppSession.js";

const SESSIONS_DIR = path.join(process.cwd(), "wa_sessions");

// Ensure base folder exists
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR);
}

// Store all active sockets in memory
const userSockets = {};

export const getUserSock = (userId) => userSockets[userId];

/**
 * Create WhatsApp instance for a user
 */
export const createInstanceForUser = async (io, user) => {
  try {
    const userId = user._id.toString();
    const sessionPath = path.join(SESSIONS_DIR, userId);

    console.log("🟦 Creating WhatsApp instance for user:", userId);

    // Ensure the folder exists for Baileys
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    // Load session (or create new)
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
      printQRInTerminal: false,
      auth: state,
      browser: ["SaaS Platform", "Chrome", "1.0"],
    });

    userSockets[userId] = sock;

    // SOCKET EVENTS
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log("📲 QR generated for user:", userId);
        io.to(userId).emit("qr", qr);
      }

      if (connection === "open") {
        console.log("✅ WhatsApp connected:", userId);

        await WhatsAppSession.findOneAndUpdate(
          { userId },
          {
            apiKey: user.activePlan.apiKey,
            connected: true,
            phoneNumber: sock.user?.id || null,
          },
          { upsert: true }
        );

        io.to(userId).emit("whatsapp_connected");
      }

      if (connection === "close") {
        const reason =
          lastDisconnect?.error?.output?.statusCode ||
          DisconnectReason.loggedOut;

        console.log("❌ WA Disconnected:", reason);

        if (reason === DisconnectReason.loggedOut) {
          // delete session folder if logged out
          fs.rmSync(sessionPath, { recursive: true, force: true });

          await WhatsAppSession.findOneAndUpdate(
            { userId },
            { connected: false }
          );
        }
      }
    });

    sock.ev.on("creds.update", saveCreds);

    return sock;
  } catch (err) {
    console.error("WhatsApp Link Error:", err);
    throw err;
  }
};

/**
 * Load/restore all sessions on server startup
 */
export const loadAllSessionsOnStart = async (io) => {
  try {
    const allSessions = await WhatsAppSession.find({ connected: true });

    if (!allSessions.length) {
      console.log("➡ No sessions to restore.");
      return;
    }

    console.log("🔁 Restoring sessions:", allSessions.length);

    for (const session of allSessions) {
      const userId = session.userId.toString();
      const sessionPath = path.join(SESSIONS_DIR, userId);

      if (!fs.existsSync(sessionPath)) {
        console.log("⚠ Missing session folder for:", userId);
        continue;
      }

      console.log("♻️ Restoring session for:", userId);

      // Fake user object (needed for createInstanceForUser)
      const fakeUser = {
        _id: userId,
        activePlan: { apiKey: session.apiKey },
      };

      await createInstanceForUser(io, fakeUser);
    }
  } catch (err) {
    console.error("❌ Failed to restore sessions:", err);
  }
};
