import axios from "axios";
import { generatePartyCaption } from "../services/geminiService.js";
import { forwardReport, fetchSystemStatus, fetchTopRankings, fetchShopProfile, fetchPerks, fetchBirthdayEligibility, fetchOrderStatus, deleteUserOrder, fetchPaymentQr } from "../services/adminService.js";
import dotenv from "dotenv";

dotenv.config();

const expectedAmount = parseInt(process.env.EXPECTED_AMOUNT, 10) || 100;

// Local config fallback
let systemConfigFallback = {
  enableImage: true,
  enableText: true,
  price: 100,
  time: 10,
};

/**
 * POST /api/report
 * Forwards user issue reports to the Admin backend.
 */
export async function postReport(req, res, next) {
  const { category, detail } = req.body;
  if (!category || !detail) {
    return res.status(400).json({ success: false, message: "category and detail are required" });
  }

  try {
    const shopId = req.headers["x-shop-id"] || "";
    const adminData = await forwardReport(shopId, category, detail);
    res.json({
      status: "ok",
      message: "Report saved successfully",
      reportId: adminData.reportId || null,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/generate-caption
 * Generates automated visual captions using Gemini AI.
 */
export async function generateAICaption(req, res, next) {
  try {
    const { imageBase64, mimeType } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        errorCode: "NO_API_KEY",
        message: "ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน .env",
      });
    }

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        errorCode: "NO_IMAGE",
        message: "กรุณาอัปโหลดรูปภาพก่อน",
      });
    }

    const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
    const detectedMime = mimeType || "image/jpeg";

    const result = await generatePartyCaption(GEMINI_API_KEY, base64Data, detectedMime);

    if (!result || !result.success) {
      const status = result?.status;
      const isQuotaError = status === 429;
      const isTimeout = status === 408;
      const responseStatus = isQuotaError ? 429 : isTimeout ? 504 : 503;
      const errorCode = isQuotaError
        ? "QUOTA_EXCEEDED"
        : isTimeout
          ? "AI_TIMEOUT"
          : "AI_UNAVAILABLE";

      console.error("[AI Caption] Gemini request failed", {
        status: status || 500,
        model: result?.model || "unknown",
        attempts: result?.failures?.map((failure) => ({
          model: failure.model,
          status: failure.status,
        })) || [],
      });

      return res.status(responseStatus).json({
        success: false,
        errorCode,
        message: isQuotaError
          ? "โควตา AI เต็มชั่วคราว กรุณาใช้ปุ่มสุ่มแคปชั่นหรือลองใหม่ภายหลัง"
          : isTimeout
            ? "AI ใช้เวลาวิเคราะห์นานเกินไป กรุณาลองอีกครั้งหรือใช้ปุ่มสุ่มแคปชั่น"
            : "AI ยังไม่พร้อมใช้งาน กรุณาใช้ปุ่มสุ่มแคปชั่นแทนชั่วคราว",
      });
    }

    const geminiData = result.data;
    const caption = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!caption) {
      return res.status(500).json({
        success: false,
        errorCode: "EMPTY_RESPONSE",
        message: "AI ไม่สามารถวิเคราะห์รูปภาพได้",
      });
    }

    const trimmedCaption = caption.substring(0, 36);
    res.json({
      success: true,
      caption: trimmedCaption,
      model: result.model,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/check-birthday
 */
export function checkBirthday(req, res, next) {
  try {
    const birthdayStr = req.query.birthday;
    if (!birthdayStr) {
      return res.json({ isBirthday: false });
    }
    const parts = birthdayStr.split("/");
    if (parts.length !== 3) {
      return res.json({ isBirthday: false });
    }
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const today = new Date();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth() + 1;
    const isBirthday = day === todayDay && month === todayMonth;
    res.json({
      isBirthday,
      debug: {
        birthday: birthdayStr,
        todayDay,
        todayMonth,
        serverTime: today.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /send-otp (SMS OTP)
 */
export async function sendSMSOTP(req, res, next) {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, message: "กรุณาระบุหมายเลขโทรศัพท์" });
  }
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ success: false, message: "หมายเลขโทรศัพท์ไม่ถูกต้อง" });
  }

  const config = {
    method: "post",
    url: "https://portal-otp.smsmkt.com/api/otp-send",
    headers: {
      "Content-Type": "application/json",
      api_key: process.env.SMS_API_KEY,
      secret_key: process.env.SMS_SECRET_KEY,
    },
    data: JSON.stringify({
      project_key: "69a425bf4f",
      phone: phone,
    }),
  };

  try {
    const response = await axios(config);
    if (response.data.code === "000") {
      res.json({
        success: true,
        message: "OTP ส่งสำเร็จ",
        token: response.data.result.token,
      });
    } else {
      res.status(400).json({
        success: false,
        message: response.data.detail,
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * POST /verify-otp
 */
export async function verifySMSOTP(req, res, next) {
  const { otp, token } = req.body;

  if (!otp || !token) {
    return res.status(400).json({ success: false, message: "กรุณาระบุ OTP และ token" });
  }

  const verifyData = {
    otp_code: otp,
    token: token,
    ref_code: "",
  };

  const config = {
    method: "post",
    url: "https://portal-otp.smsmkt.com/api/otp-validate",
    headers: {
      "Content-Type": "application/json",
      api_key: process.env.SMS_API_KEY,
      secret_key: process.env.SMS_SECRET_KEY,
    },
    data: JSON.stringify(verifyData),
  };

  try {
    const response = await axios(config);
    if (response.data.code === "000") {
      res.json({ success: true, message: "OTP verified successfully" });
    } else {
      res.status(400).json({ success: false, message: response.data.detail });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * POST /verify-payment
 */
export function verifyPayment(req, res, next) {
  const { amount, method } = req.body;

  if (!amount || !method) {
    return res.status(400).json({ success: false, message: "กรุณาระบุจำนวนเงินและวิธีการชำระเงิน" });
  }

  if (amount === expectedAmount && method === "promptpay") {
    return res.json({ success: true });
  } else {
    return res.json({ success: false });
  }
}

/**
 * GET /api/status
 */
export async function getStatus(req, res, next) {
  try {
    const shopId = req.query.shopId || req.headers["x-shop-id"] || "";
    if (!shopId) {
      return res.status(400).json({ success: false, message: "Missing shopId" });
    }
    const adminConfig = await fetchSystemStatus(shopId);
    res.json(adminConfig);
  } catch (err) {
    console.error("Error fetching system status from Admin:", err.message);
    res.json(systemConfigFallback);
  }
}

/**
 * GET /api/rankings/top
 */
export async function getRankings(req, res, next) {
  try {
    const shopId = req.headers["x-shop-id"] || "";
    const type = req.query.type || "alltime";
    const rankings = await fetchTopRankings(shopId, type);
    res.json(rankings);
  } catch (error) {
    next(error);
  }
}

export async function getShopProfile(req, res, next) {
  try { res.json(await fetchShopProfile(req.query.shopId || req.headers["x-shop-id"] || "")); }
  catch (error) { next(error); }
}

export async function getPerks(req, res, next) {
  try { res.json(await fetchPerks(req.query.shopId || req.headers["x-shop-id"] || "")); }
  catch (error) { next(error); }
}

export async function getBirthdayEligibility(req, res, next) {
  try { res.json(await fetchBirthdayEligibility(req.query.shopId || req.headers["x-shop-id"] || "", req.params.email)); }
  catch (error) { next(error); }
}

export async function getOrderStatus(req, res, next) {
  try { res.json(await fetchOrderStatus(req.query.shopId || req.headers["x-shop-id"] || "", req.params.orderId)); }
  catch (error) { next(error); }
}

export async function removeUserOrder(req, res, next) {
  try { res.json(await deleteUserOrder(req.query.shopId || req.headers["x-shop-id"] || "", req.params.orderId)); }
  catch (error) { next(error); }
}

export async function getPaymentQr(req, res, next) {
  try { res.json(await fetchPaymentQr(req.query.shopId || req.headers["x-shop-id"] || "")); }
  catch (error) { next(error); }
}
