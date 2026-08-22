import { performOCR, thaiToArabic } from "../services/ocrService.js";
import { sendSlipStat } from "../services/adminService.js";
import { cloudinary } from "../middleware/uploadMiddleware.js";
import FormData from "form-data";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { randomUUID } from "crypto";
import {
  getPendingUploadForShop,
  requireShopIdValue,
} from "../services/tenantRecordService.js";

dotenv.config();

const ADMIN_API_BASE = (process.env.ADMIN_API_BASE || "https://cmes-admin-server.onrender.com").replace(/\/$/, "");

// In-memory pending uploads store
export const pendingUploads = new Map();
const paymentReservationLocks = new Map();

const withPaymentReservationLock = async (key, work) => {
  const previous = paymentReservationLocks.get(key) || Promise.resolve();
  const current = previous.catch(() => undefined).then(work);
  paymentReservationLocks.set(key, current);
  try {
    return await current;
  } finally {
    if (paymentReservationLocks.get(key) === current) paymentReservationLocks.delete(key);
  }
};

const hasUserQueueQuota = (userId) => userId && !['guest', 'unknown'].includes(userId);

const pendingPaidReservationCount = (shopId, userId) => [...pendingUploads.values()]
  .filter((upload) => (
    upload.shopId === shopId
    && upload.userId === userId
    && Number(upload.price) > 0
  )).length;

// The User service proxies submissions to Admin. Preserve an actionable
// upstream message instead of returning a long "Admin backend error" string.
async function readUpstreamError(response, fallbackMessage) {
  const rawBody = (await response.text()).trim();
  if (!rawBody || rawBody.startsWith("<")) return fallbackMessage;

  try {
    const body = JSON.parse(rawBody);
    return body?.message || body?.error || fallbackMessage;
  } catch {
    // Do not expose a full proxy/HTML error page to the guest.
    return rawBody.length <= 240 ? rawBody : fallbackMessage;
  }
}

async function assertQueueEligibility(shopId, userId) {
  // The active-queue quota currently applies to signed-in users. Guests are
  // protected by the submission/IP rate limiter instead.
  if (!userId || ['guest', 'unknown'].includes(userId)) return;

  const response = await fetch(`${ADMIN_API_BASE}/api/queue/eligibility`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-shop-id': shopId,
      'x-cmes-service-token': process.env.USER_SERVICE_TOKEN || '',
    },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    const fallbackMessage = response.status === 404
      ? 'ระบบยังไม่พร้อมรับรายการ กรุณาลองใหม่อีกครั้ง (ยังไม่ได้มีการรับชำระเงิน)'
      : 'ไม่สามารถตรวจสอบคิวได้ กรุณาลองใหม่อีกครั้ง';
    const error = new Error(await readUpstreamError(
      response,
      fallbackMessage
    ));
    error.status = response.status;
    throw error;
  }

  return response.json();
}

async function forwardUploadToAdmin(uploadData, shopId) {
  const formData = new FormData();
  formData.append("text", uploadData.text || "");
  formData.append("type", uploadData.type || "image");
  formData.append("time", String(uploadData.time || 0));
  formData.append("price", String(uploadData.price || 0));
  formData.append("sender", uploadData.sender || "Unknown");
  formData.append("textColor", uploadData.textColor || "#ffffff");
  formData.append("socialColor", uploadData.socialColor || "#ffffff");
  formData.append("textLayout", uploadData.textLayout || "right");
  formData.append("socialType", uploadData.socialType || "");
  formData.append("socialName", uploadData.socialName || "");
  formData.append("submissionId", uploadData.submissionId);
  if (uploadData.userId) formData.append("userId", uploadData.userId);
  if (uploadData.email) formData.append("email", uploadData.email);
  if (uploadData.avatar) formData.append("avatar", uploadData.avatar);
  if (uploadData.filePath) formData.append("imageUrl", uploadData.filePath);
  if (uploadData.qrCodePath) formData.append("qrCodeUrl", uploadData.qrCodePath);

  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${ADMIN_API_BASE}/api/upload`, {
      method: "POST",
      body: formData,
      headers: {
        ...formData.getHeaders(),
        "x-shop-id": shopId,
        "x-cmes-service-token": process.env.USER_SERVICE_TOKEN || "",
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      const error = new Error(await readUpstreamError(
        response,
        "ยังส่งรายการไม่ได้ กรุณาลองใหม่อีกครั้ง"
      ));
      error.status = response.status;
      throw error;
    }
    return response.json();
  } finally {
    clearTimeout(timerId);
  }
}

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
      await sendSlipStat(req.headers["x-shop-id"] || "", { category: "payment", detail, status, amount });
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
      await sendSlipStat(req.headers["x-shop-id"] || "", { category: "payment", detail, status, amount });
      return res.json({ success: true });
    } else {
      detail = "ชำระเงินไม่ถูกต้อง หรือจำนวนเงินไม่ตรง";
      await sendSlipStat(req.headers["x-shop-id"] || "", { category: "payment", detail, status, amount });
      return res.json({ success: false, message: detail });
    }
  } catch (error) {
    detail = "OCR ผิดพลาด";
    console.error("[OCR] Failed with error:", error);
    await deleteCloudinaryFile(req.file?.filename);
    try {
      await sendSlipStat(req.headers["x-shop-id"] || "", { category: "payment", detail, status, amount });
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

    const shopId = requireShopIdValue(req.headers["x-shop-id"]);
    const uploadId = randomUUID();

    const uploadData = {
      id: uploadId,
      submissionId: randomUUID(),
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
      shopId,
    };

    // Do this before returning an uploadId / opening PromptPay. Otherwise a
    // full queue would only be discovered after the guest had paid.
    // A zero-price package skips payment, but it is still submitted through
    // this server. The browser never receives Admin credentials or calls it.
    if (Number(price) === 0) {
      const adminResult = await forwardUploadToAdmin(uploadData, shopId);
      return res.json({ success: true, uploadId: adminResult.uploadId });
    }

    try {
      if (hasUserQueueQuota(uploadData.userId)) {
        await withPaymentReservationLock(`${shopId}:${uploadData.userId}`, async () => {
          const eligibility = await assertQueueEligibility(shopId, uploadData.userId);
          const reservedCount = pendingPaidReservationCount(shopId, uploadData.userId);
          if (eligibility.activeCount + reservedCount >= eligibility.limit) {
            const error = new Error(`คุณมีคิวที่กำลังรออยู่ครบ ${eligibility.limit} รายการแล้ว กรุณารอให้คิวเดิมแสดงเสร็จก่อน`);
            error.status = 429;
            throw error;
          }
          pendingUploads.set(uploadId, uploadData);
        });
      } else {
        await assertQueueEligibility(shopId, uploadData.userId);
        pendingUploads.set(uploadId, uploadData);
      }
    } catch (error) {
      // The files have already reached Cloudinary at this point. A rejected
      // pre-check must not leave unused guest media behind.
      await deleteCloudinaryFile(uploadData.file);
      await deleteCloudinaryFile(uploadData.qrCodeFile);
      throw error;
    }
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
    const shopId = requireShopIdValue(req.headers["x-shop-id"]);

    if (!uploadId) {
      return res.status(400).json({ success: false, message: "Missing uploadId" });
    }
    const uploadData = getPendingUploadForShop({ shopId, uploadId, pendingUploads });
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
    formData.append("submissionId", uploadData.submissionId);

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
        "x-cmes-service-token": process.env.USER_SERVICE_TOKEN || "",
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
      const message = await readUpstreamError(
        response,
        "ยังยืนยันรายการไม่ได้ กรุณาลองใหม่อีกครั้ง"
      );
      console.error("[Confirm Payment] Admin returned error:", response.status, message);
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/upload-status/:uploadId
 */
export function getUploadStatus(req, res, next) {
  try {
    const shopId = requireShopIdValue(req.headers["x-shop-id"]);
    const data = getPendingUploadForShop({
      shopId,
      uploadId: req.params.uploadId,
      pendingUploads,
    });
    if (!data) return res.status(404).json({ exists: false });
    return res.json({ exists: true, status: data.status });
  } catch (error) {
    return next(error);
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
