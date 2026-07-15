import express from "express";
import {
  verifySlip,
  uploadPendingContent,
  confirmPayment,
  getUploadStatus,
  uploadProfileAvatar,
  uploadContent,
  uploadGenericImage,
  processOCR,
} from "../controllers/uploadController.js";
import { uploadGeneric, uploadSlip, uploadAvatar } from "../middleware/uploadMiddleware.js";

const router = express.Router();

const uploadFields = uploadGeneric.fields([
  { name: "file", maxCount: 1 },
  { name: "qrCode", maxCount: 1 },
]);

// Slip verification with OCR
router.post("/verify-slip", uploadSlip.single("slip"), verifySlip);

// Metadata uploading before payment
router.post("/api/upload", uploadFields, uploadPendingContent);

// Confirming payment
router.post("/api/confirm-payment", confirmPayment);

// Checking pending upload status
router.get("/api/upload-status/:uploadId", getUploadStatus);

// Profile avatar uploads
router.post("/api/upload-avatar", uploadAvatar.single("avatar"), uploadProfileAvatar);

// Unused legacy upload formats (retained for frontend calls safety)
router.post("/upload-content", uploadGeneric.single("image"), uploadContent);
router.post("/upload", uploadGeneric.single("image"), uploadGenericImage);
router.post("/api/ocr", uploadGeneric.single("image"), processOCR);

export default router;
