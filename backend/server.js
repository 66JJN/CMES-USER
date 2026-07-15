import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import http from "http";
import { Server as SocketIoServer } from "socket.io";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Middleware
import { errorHandler } from "./middleware/errorMiddleware.js";
import { mongoSanitize } from "./middleware/securityMiddleware.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import giftRoutes from "./routes/giftRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import systemRoutes from "./routes/systemRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);

// ===== CORS CONFIGURATION =====
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://cmesuserfrontend.vercel.app",
  "https://cmesadminfrontend.vercel.app",
  process.env.USER_FRONTEND_URL,
  process.env.ADMIN_FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-shop-id"],
}));

// ===== SECURITY HEADERS & SANITIZATION =====
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

const isDev = process.env.NODE_ENV === "development";

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100000 : 10000,
  message: { success: false, message: "คำขอมากเกินไป กรุณารอสักครู่" },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 100,
  message: { success: false, message: "พยายามเข้าสู่ระบบมากเกินไป กรุณารอ 15 นาที" },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 200,
  message: { success: false, message: "อัปโหลดมากเกินไป กรุณารอสักครู่" },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiCaptionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 50,
  message: { success: false, message: "ใช้ AI บ่อยเกินไป กรุณารอสักครู่" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", globalLimiter);
app.use("/api/auth", authLimiter);
app.use("/send-otp", authLimiter);
app.use("/verify-otp", authLimiter);
app.use("/api/upload", uploadLimiter);
app.use("/upload", uploadLimiter);
app.use("/api/upload-avatar", uploadLimiter);
app.use("/verify-slip", uploadLimiter);
app.use("/api/generate-caption", aiCaptionLimiter);

// Body Parsing
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(mongoSanitize);

// ===== STATIC FILES =====
const avatarDir = path.join(__dirname, "uploads/avatars");
const slipDir = path.join(__dirname, "uploads/slips");
const genericDir = path.join(__dirname, "uploads/others");
const tempUploads = path.join(__dirname, "uploads");

if (!fs.existsSync(tempUploads)) fs.mkdirSync(tempUploads, { recursive: true });
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });
if (!fs.existsSync(slipDir)) fs.mkdirSync(slipDir, { recursive: true });
if (!fs.existsSync(genericDir)) fs.mkdirSync(genericDir, { recursive: true });

app.use("/uploads/avatars", express.static(avatarDir));
app.use("/uploads/slips", express.static(slipDir));
app.use("/uploads", express.static(genericDir));

// ===== DATABASE CONNECTION =====
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("✗ MONGODB_URI is not defined in .env file");
  process.exit(1);
}

mongoose.connect(MONGODB_URI, { dbName: "cmes-user" })
  .then(() => console.log("✓ Connected to MongoDB (cmes-user)"))
  .catch((err) => {
    console.error("✗ MongoDB connection error:", err);
    process.exit(1);
  });

// ===== MOUNT ROUTES =====
app.use("/api/auth", authRoutes);
app.use("/", giftRoutes);
app.use("/", uploadRoutes);
app.use("/", systemRoutes);

// Global Error Handler Middleware
app.use(errorHandler);

// ===== START SERVER =====
const port = process.env.PORT ? Number(process.env.PORT) : 5002;
const server = http.createServer(app);
const io = new SocketIoServer(server, { cors: { origin: "*" } });

// Local status fallback config cache
let localConfig = {
  enableImage: true,
  enableText: true,
  price: 100,
  time: 10,
};

io.on("connection", (socket) => {
  socket.emit("configUpdate", localConfig);

  socket.on("adminUpdateConfig", (newConfig) => {
    localConfig = { ...localConfig, ...newConfig };
    io.emit("configUpdate", localConfig);
  });
});

server.listen(port, () => {
  console.log(`✓ CMES-USER Server + Socket.IO running on http://localhost:${port}`);
});

// Graceful Shutdown
process.on("SIGTERM", async () => {
  console.log("[Server] SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    mongoose.connection.close(false).then(() => {
      console.log("[Server] MongoDB connection closed.");
      process.exit(0);
    });
  });
});