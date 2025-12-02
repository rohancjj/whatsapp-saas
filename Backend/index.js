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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

connectDb();


const PORT = process.env.PORT || 8080;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });


app.set("io", io);


io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);


  socket.on("join", (userId) => {
    if (!userId) return;

    socket.join(userId);
    console.log(`📌 User ${userId} joined their socket room.`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});


loadAllSessionsOnStart(io)
  .then(() => console.log("♻️ All WhatsApp sessions restored"))
  .catch((err) => console.error("❌ Session restore failed:", err));


app.use("/api/v1/whatsapp", whatsappRoutes);
app.use("/auth", authroutes);
app.use("/pricing", pricingroutes);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);


app.get("/", (req, res) => {
  res.send("WhatsApp SaaS Backend Running 🚀");
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
