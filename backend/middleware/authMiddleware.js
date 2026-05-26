import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const usersFile = path.join(__dirname, "../users-data.json");

// 🛡️ JWT Secret — ต้องตั้งใน .env เพื่อความปลอดภัย
// ถ้าไม่ตั้ง จะใช้ random secret (token หมดอายุทุกครั้งที่ restart)
let JWT_SECRET;
if (process.env.JWT_SECRET) {
  JWT_SECRET = process.env.JWT_SECRET;
} else {
  JWT_SECRET = crypto.randomBytes(64).toString('hex');
  console.warn('⚠️ JWT_SECRET ไม่ได้ตั้งค่า — token จะหมดอายุทุกครั้งที่ restart server');
}

export const verifyAuthToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      error: error.message,
    });
  }
};

export const optionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
    }
    next();
  } catch (error) {
    // Token invalid or expired, but we allow the request to continue
    next();
  }
};

// Export JWT_SECRET สำหรับใช้ใน routes (sign token)
export { JWT_SECRET };

export const getCurrentUser = (req) => {
  try {
    if (!req.userId) return null;

    const data = fs.readFileSync(usersFile, "utf8");
    const users = JSON.parse(data);
    return users[req.userId] || null;
  } catch (error) {
    return null;
  }
};
