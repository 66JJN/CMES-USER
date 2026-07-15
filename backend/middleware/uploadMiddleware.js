import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 1. Avatar storage setup
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "cmes/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
    public_id: (req, file) => `avatar-${Date.now()}`,
  },
});

// 2. Slip storage setup
const slipStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "cmes/slips",
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
    public_id: (req, file) => `slip-${Date.now()}`,
  },
});

// 3. Generic upload storage setup
const genericStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "cmes/others",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "mp4", "pdf"],
    public_id: (req, file) => `file-${Date.now()}`,
  },
});

// Multer instances
export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});

export const uploadSlip = multer({
  storage: slipStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});

export const uploadGeneric = multer({
  storage: genericStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});

export { cloudinary };
