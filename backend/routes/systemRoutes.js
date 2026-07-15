import express from "express";
import {
  postReport,
  generateAICaption,
  checkBirthday,
  sendSMSOTP,
  verifySMSOTP,
  verifyPayment,
  getStatus,
  getRankings,
} from "../controllers/systemController.js";
import { optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Reporting bugs / feedback
router.post("/api/report", optionalAuth, postReport);

// AI Caption generation (Gemini)
router.post("/api/generate-caption", generateAICaption);

// User Birthday eligibility check
router.get("/api/check-birthday", checkBirthday);

// SMS OTP endpoints
router.post("/send-otp", sendSMSOTP);
router.post("/verify-otp", verifySMSOTP);

// expectedAmount & payment mock validation
router.post("/verify-payment", verifyPayment);

// System statuses and configs from admin
router.get("/api/status", getStatus);

// Rankings proxy
router.get("/api/rankings/top", getRankings);

export default router;
