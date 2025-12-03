import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDb from "./config/dbConnection.js";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";

import whatsappRoutes from "./routes/whatsappRoutes.js";
import authroutes from "./routes/authroutes.js";
import pricingroutes from "./routes/pricingroutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

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

// Attach socket.io with proper config
const io = new Server(server, { 
  cors: { origin: "*" },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"]
});

// Make io accessible inside routes
app.set("io", io);

/* =======================================================
   SOCKET IO MAIN CONNECTION (FIXED - NO DOUBLE QR)
======================================================= */
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  // ✅ CRITICAL FIX: Send current admin status immediately and correctly
  const sendInitialStatus = () => {
    const adminStatus = getAdminConnectionStatus();
    console.log("📡 Sending status to new client:", adminStatus);
    
    if (adminStatus.connected && adminStatus.phone) {
      // ✅ IMPORTANT: Send connected event FIRST, then clear QR
      socket.emit("admin_connected", { phoneNumber: adminStatus.phone });
      socket.emit("admin_qr", null); // Explicitly clear any QR
      console.log(`✅ Sent connected status to ${socket.id}: ${adminStatus.phone}`);
    } else {
      // Not connected - send disconnected event only (QR will come from adminWhatsapp.js)
      socket.emit("admin_disconnected");
      console.log(`📤 Sent disconnected status to ${socket.id}`);
      
      // ⚠️ DO NOT emit QR here - let adminWhatsapp.js handle it
      // This prevents double QR emission
    }
  };

  // Send status after a small delay to ensure socket is ready
  setTimeout(sendInitialStatus, 500);

  // USERS JOIN PERSONAL ROOM
  socket.on("join", (userId) => {
    if (!userId) return;
    socket.join(userId);
    console.log(`📌 User ${userId} joined their socket room.`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

/* =======================================================
   DATABASE CONNECTION
======================================================= */
connectDb();

/* =======================================================
   INITIALIZE SERVICES (IN CORRECT ORDER)
======================================================= */
const initializeServices = async () => {
  try {
    // 1. Initialize Admin WhatsApp FIRST
    console.log("👑 Initializing Admin WhatsApp...");
    await initializeAdminWhatsApp(io);
    
    // 2. Wait a moment for admin WA to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. Then restore user sessions
    console.log("♻️ Restoring user WhatsApp sessions...");
    await loadAllSessionsOnStart(io);
    
    // 4. Emit current admin status to all connected clients
    const adminStatus = getAdminConnectionStatus();
    if (adminStatus.connected) {
      console.log("📢 Broadcasting admin connected status to all clients");
      io.emit("admin_connected", { phoneNumber: adminStatus.phone });
      io.emit("admin_qr", null);
    }
    
    console.log("✅ All services initialized successfully");
  } catch (err) {
    console.error("❌ Service initialization error:", err);
  }
};

/* =======================================================
   ROUTES
======================================================= */
app.use("/api/v1/whatsapp", whatsappRoutes);
app.use("/auth", authroutes);
app.use("/pricing", pricingroutes);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("WhatsApp SaaS Backend Running 🚀");
});

// Health check endpoint
app.get("/health", (req, res) => {
  const adminStatus = getAdminConnectionStatus();
  res.json({
    status: "ok",
    adminWhatsApp: adminStatus.connected ? "connected" : "disconnected",
    adminPhone: adminStatus.phone,
    timestamp: new Date().toISOString()
  });
});

/* =======================================================
   START SERVER
======================================================= */
server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Initialize services after server starts
  await initializeServices();
});

/* =======================================================
   GRACEFUL SHUTDOWN
======================================================= */
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  try {
    // 1. Stop accepting new connections
    server.close(() => {
      console.log("✅ HTTP server closed");
    });
    
    // 2. Shutdown Admin WhatsApp
    await shutdownAdminWhatsApp();
    
    // 3. Close socket connections
    io.close(() => {
      console.log("✅ Socket.IO closed");
    });
    
    console.log("✅ Graceful shutdown completed");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during shutdown:", err);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught errors
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});