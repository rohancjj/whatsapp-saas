import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDb from "./config/dbConnection.js";
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';





import whatsappRoutes from './routes/whatsappRoutes.js'
import { initWhatsApp,emitCurrentQR,IsWHConnected } from "./services/whatsappService.js";
import { initializeGlobalWhatsApp } from "./services/whatsappManager.js";
import authroutes from './routes/authroutes.js'
import pricingroutes from './routes/pricingroutes.js'
import userRoutes from "./routes/userRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());




app.use('/api/v1',whatsappRoutes)
app.use('/auth',authroutes)
app.use("/pricing", pricingroutes);
app.use("/user", userRoutes);

connectDb();

const PORT = process.env.PORT || 8080;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

initializeGlobalWhatsApp(io)
  .then(() => console.log("✅ WhatsApp socket ready globally"))
  .catch((err) => console.error("❌ Failed to init WhatsApp:", err));

io.on('connection', (socket) => {
  console.log(`✅ New client connected: ${socket.id}`);

  if (IsWHConnected()) socket.emit('whatsapp_connected');
  emitCurrentQR(socket);
});

app.get("/", (req, res) => {
  res.send("Hello world!");
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
