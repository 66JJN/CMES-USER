import { performOCR, thaiToArabic } from "../services/ocrService.js";
import { sendSlipStat } from "../services/adminService.js";
import { cloudinary } from "../middleware/uploadMiddleware.js";
import FormData from "form-data";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const ADMIN_API_BASE = (process.env.ADMIN_API_BASE || "https://cmes-admin-server.onrender.com").replace(/\/$/, "");

// In-memory pending uploads store
export const pendingUploads = new Map();

/**
 * Helper to delete Cloudinary file to clean up assets
 */
async function deleteCloudinaryFile(filename) {
  if (filename) {
    try {
      await cloudinary.uploader.destroy(filename);
      console.log(`[Cloudinary] ✓ Deleted asset: ${filename}`);
    } catch (err) {
      console.error("[Cloudinary] Failed to delete asset:", err);
    }
  }
}

/**
 * POST /verify-slip
 * Performs Tesseract OCR on payment slips and checks against expected amount.
 */
export async function verifySlip(req, res, next) {
  let status = "failed";
  let detail = "";
  const amount = req.body.amount;

  if (!req.file) {
    detail = "ไม่พบไฟล์สลิป";
    try {
      await sendSlipStat({ category: "payment", detail, status, amount });
    } catch (err) {
      console.error("Failed to log slip stat to Admin:", err.message);
    }
    return res.json({ success: false, message: detail });
  }

  try {
    console.log("[OCR] Verifying slip on Cloudinary path:", req.file.path);
    const text = await performOCR(req.file.path);
    const textArabic = thaiToArabic(text);
    const cleanText = textArabic.replace(/[\s,\,\.]/g, "");
    const cleanAmount = String(amount).replace(/[\s,\,\.]/g, "");
    const cleanAmountDot = String(Number(amount).toFixed(2)).replace(/[\s,\,\.]/g, "");

    console.log("OCR TEXT Output:", text);

    const match1 = cleanText.includes(cleanAmount + "บาท");
    const match2 = cleanText.includes(cleanAmountDot + "บาท");
    const match3 = cleanText.split("บาท")[0].endsWith(cleanAmount);
    const match4 = cleanText.split("บาท")[0].endsWith(cleanAmountDot);

    // Delete slip from Cloudinary after OCR completed to secure user data
    await deleteCloudinaryFile(req.file.filename);

    if (match1 || match2 || match3 || match4) {
      status = "success";
      detail = `ชำระเงินสำเร็จ จำนวนเงิน: ${amount}`;
      await sendSlipStat({ category: "payment", detail, status, amount });
      return res.json({ success: true });
    } else {
      detail = "ชำระเงินไม่ถูกต้อง หรือจำนวนเงินไม่ตรง";
      await sendSlipStat({ category: "payment", detail, status, amount });
      return res.json({ success: false, message: detail });
    }
  } catch (error) {
    detail = "OCR ผิดพลาด";
    console.error("[OCR] Failed with error:", error);
    await deleteCloudinaryFile(req.file?.filename);
    try {
      await sendSlipStat({ category: "payment", detail, status, amount });
    } catch (err) {
      // ignore
    }
    return res.json({ success: false, message: detail });
  }
}

/**
 * POST /api/upload
 * Saves upload metadata in memory awaiting payment confirmation.
 */
export async function uploadPendingContent(req, res, next) {
  try {
    const {
      text, type, time, price, sender, userId, email, avatar,
      textColor, socialColor, textLayout, socialType, socialName,
    } = req.body;

    const uploadId = Date.now().toString();

    const uploadData = {
      id: uploadId,
      text: text || "",
      type,
      time,
      price,
      sender: sender || "Unknown",
      userId: userId || "guest",
      email: email || "",
      avatar: avatar || "",
      textColor: textColor || "#ffffff",
      socialColor: socialColor || "#ffffff",
      textLayout: textLayout || "right",
      socialType: socialType || "",
      socialName: socialName || "",
      file: req.files?.file?.[0]?.filename || null,
      filePath: req.files?.file?.[0]?.path || null,
      qrCodeFile: req.files?.qrCode?.[0]?.filename || null,
      qrCodePath: req.files?.qrCode?.[0]?.path || null,
      timestamp: new Date(),
      status: "pending",
    };

    pendingUploads.set(uploadId, uploadData);
    console.log(`[Upload pending] Upload ID: ${uploadId} saved. Expires in 10 mins.`);

    // Automatically remove after 10 minutes to avoid memory accumulation
    setTimeout(() => {
      if (pendingUploads.has(uploadId)) {
        console.log(`[Upload pending] Upload ID: ${uploadId} expired.`);
        pendingUploads.delete(uploadId);
      }
    }, 10 * 60 * 1000);

    res.json({
      success: true,
      uploadId,
      fileUrl: uploadData.filePath,
      qrCodeUrl: uploadData.qrCodePath,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/confirm-payment
 * Confirms payment and forwards the payload to the Admin backend.
 */
export async function confirmPayment(req, res, next) {
  try {
    const { uploadId, userId, email, avatar } = req.body;
    const shopId = req.headers["x-shop-id"] || "";

    if (!uploadId) {
      return res.status(400).json({ success: false, message: "Missing uploadId" });
    }
    if (!shopId) {
      return res.status(400).json({ success: false, message: "Missing shopId" });
    }

    const uploadData = pendingUploads.get(uploadId);
    if (!uploadData) {
      return res.status(404).json({ success: false, message: "Upload not found or expired" });
    }

    // Build FormData to send to Admin
    const formData = new FormData();
    formData.append("text", uploadData.text || "");
    formData.append("type", uploadData.type);
    formData.append("time", uploadData.time.toString());
    formData.append("price", uploadData.price.toString());
    formData.append("sender", uploadData.sender);
    formData.append("textColor", uploadData.textColor || "#ffffff");
    formData.append("socialColor", uploadData.socialColor || "#ffffff");
    formData.append("textLayout", uploadData.textLayout || "right");
    formData.append("socialType", uploadData.socialType || "");
    formData.append("socialName", uploadData.socialName || "");

    if (userId) formData.append("userId", userId);
    if (email) formData.append("email", email);
    if (avatar) formData.append("avatar", avatar);

    if (uploadData.filePath) {
      formData.append("imageUrl", uploadData.filePath);
    }
    if (uploadData.qrCodePath) {
      formData.append("qrCodeUrl", uploadData.qrCodePath);
    }

    // Forwarding to Admin API via fetch (applying timeout)
    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), 30000); // 30 seconds for upload + AI moderation

    const response = await fetch(`${ADMIN_API_BASE}/api/upload`, {
      method: "POST",
      body: formData,
      headers: {
        ...formData.getHeaders(),
        "x-shop-id": shopId,
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(timerId));

    if (response.ok) {
      const adminResult = await response.json();
      pendingUploads.delete(uploadId);
      res.json({
        success: true,
        message: "Payment confirmed and data sent to admin",
        uploadId: adminResult.uploadId,
      });
    } else {
      const errBody = await response.text();
      console.error("[Confirm Payment] Admin returned error:", response.status, errBody);
      throw new Error(`Admin backend error: ${response.status} ${errBody}`);
    }
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/upload-status/:uploadId
 */
export function getUploadStatus(req, res, next) {
  const { uploadId } = req.params;
  if (pendingUploads.has(uploadId)) {
    const data = pendingUploads.get(uploadId);
    res.json({ exists: true, status: data.status });
  } else {
    res.json({ exists: false });
  }
}

/**
 * POST /api/upload-avatar
 */
export function uploadProfileAvatar(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }
  res.json({ success: true, imageUrl: req.file.path });
}

/**
 * POST /upload-content
 */
export function uploadContent(req, res, next) {
  const { message } = req.body;
  const baseUrl = process.env.BASE_URL || "https://cmes-user.onrender.com";
  const imageUrl = req.file ? `${baseUrl}/uploads/others/${req.file.filename}` : null;
  res.json({ success: true, message, imageUrl });
}

/**
 * POST /upload (generic Cloudinary upload)
 */
export function uploadGenericImage(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }
  res.json({ imageUrl: req.file.path });
}

/**
 * POST /api/ocr (Generic OCR parsing)
 */
export async function processOCR(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ status: "error", message: "No file uploaded" });
  }
  try {
    const text = await performOCR(req.file.path);
    res.json({ status: "ok", text });
  } catch (error) {
    next(error);
  }
}
