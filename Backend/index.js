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
import paymentRoutes from './routes/paymentRoutes.js'
import { upload } from "./middlewares/upload.js";

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


io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  const sendInitialStatus = () => {
    const adminStatus = getAdminConnectionStatus();
    console.log("📡 Sending status to new client:", adminStatus);
    
    if (adminStatus.connected && adminStatus.phone) {
     
      socket.emit("admin_connected", { phoneNumber: adminStatus.phone });
      socket.emit("admin_qr", null); 
      console.log(`✅ Sent connected status to ${socket.id}: ${adminStatus.phone}`);
    } else {
     
      socket.emit("admin_disconnected");
      console.log(`📤 Sent disconnected status to ${socket.id}`);
      

      
    }
  };


  setTimeout(sendInitialStatus, 500);


  socket.on("join", (userId) => {
    if (!userId) return;
    socket.join(userId);
    console.log(`📌 User ${userId} joined their socket room.`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});


connectDb();

const initializeServices = async () => {
  try {

    console.log("👑 Initializing Admin WhatsApp...");
    await initializeAdminWhatsApp(io);
    
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
   
    console.log("♻️ Restoring user WhatsApp sessions...");
    await loadAllSessionsOnStart(io);
    
    
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


app.use("/api/v1/whatsapp", whatsappRoutes);
app.use("/auth", authroutes);
app.use("/pricing", pricingroutes);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);
app.use("/api/v1", paymentRoutes);
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
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  try {
   
    server.close(() => {
      console.log("✅ HTTP server closed");
    });
    

    await shutdownAdminWhatsApp();
    

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


process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));


process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});