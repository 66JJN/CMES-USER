import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const imageOnlyFilter = (_req, file, callback) => {
  if (IMAGE_MIME_TYPES.has(file.mimetype)) return callback(null, true);
  const error = new Error("รองรับเฉพาะไฟล์รูป JPG, PNG หรือ WebP เท่านั้น");
  error.status = 415;
  return callback(error);
};

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
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
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
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    public_id: (req, file) => `file-${Date.now()}`,
  },
});

// Multer instances
export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter: imageOnlyFilter,
});

export const uploadSlip = multer({
  storage: slipStorage,
  limits: { fileSize: MAX_IMAGE_BYTES },
});

export const uploadGeneric = multer({
  storage: genericStorage,
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter: imageOnlyFilter,
});

export { cloudinary };
