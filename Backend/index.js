import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDb from "./config/dbConnection.js";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";
import WhatsAppSession from "./models/WhatsAppSession.js";

import whatsappRoutes from "./routes/whatsappRoutes.js";
import authroutes from "./routes/authroutes.js";
import pricingroutes from "./routes/pricingroutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import notificationTemplateRoutes from "./routes/notificationTemplatesroutes.js";
import notificationsRoutes from "./routes/notificationsroutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import otpRoutes from "./routes/otpRoutes.js";


// ❌ Removed invalid import:
// import { upload } from "./middlewares/upload.js";

import { loadAllSessionsOnStart } from "./services/whatsappManager.js";
import { 
  initializeAdminWhatsApp, 
  shutdownAdminWhatsApp,
  getAdminConnectionStatus 
} from "./services/adminWhatsapp.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;
const server = http.createServer(app);

const io = new Server(server, { 
  cors: { origin: "*" },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"]
});

app.set("io", io);

// SOCKET.IO START
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  let currentUserId = null;

  const sendInitialStatus = () => {
    const adminStatus = getAdminConnectionStatus();
    
    if (adminStatus.connected) {
      socket.emit("admin_connected", { phoneNumber: adminStatus.phone });
      socket.emit("admin_qr", null);
    } else {
      socket.emit("admin_disconnected");
    }
  };

  setTimeout(sendInitialStatus, 500);

  socket.on("join", (userId) => {
    if (!userId) return;

    if (currentUserId && currentUserId !== userId) {
      socket.leave(currentUserId);
    }

    socket.join(userId);
    currentUserId = userId;

    WhatsAppSession.findOne({ userId })
      .then(session => {
        if (session?.connected) {
          socket.emit("whatsapp_connected", { phoneNumber: session.phoneNumber });
        }
      });
  });

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// END SOCKET.IO

connectDb();

const initializeServices = async () => {
  try {
    await initializeAdminWhatsApp(io);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await loadAllSessionsOnStart(io);

    const adminStatus = getAdminConnectionStatus();
    if (adminStatus.connected) {
      io.emit("admin_connected", { phoneNumber: adminStatus.phone });
      io.emit("admin_qr", null);
    }
  } catch (err) {
    console.error("❌ Initialization error:", err);
  }
};

app.use("/api/v1/whatsapp", whatsappRoutes);
app.use("/auth", authroutes);
app.use("/pricing", pricingroutes);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);
app.use("/api/v1", paymentRoutes);
app.use("/api/notification-templates", notificationTemplateRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/v1/support", supportRoutes);
app.use("/api/v1/otp", otpRoutes);

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (req, res) => {
  res.send("WhatsApp SaaS Backend Running 🚀");
});

app.get("/health", (req, res) => {
  const adminStatus = getAdminConnectionStatus();
  res.json({
    status: "ok",
    adminWhatsApp: adminStatus.connected ? "connected" : "disconnected",
    adminPhone: adminStatus.phone,
    timestamp: new Date().toISOString()
  });
});

server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await initializeServices();
});

const gracefulShutdown = async (signal) => {
  console.log(`${signal} received. Shutting down...`);

  try {
    server.close();
    await shutdownAdminWhatsApp();
    io.close();
    process.exit(0);
  } catch (err) {
    console.error("Shutdown error:", err);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
