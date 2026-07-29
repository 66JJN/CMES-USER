import express from "express";
import { getGifts, createGiftOrder, getGiftOrder, confirmGiftOrder } from "../controllers/giftController.js";
import { optionalAuth } from "../middleware/authMiddleware.js";
import { giftOrderLimiter, paymentConfirmationLimiter } from "../middleware/submissionRateLimit.js";

const router = express.Router();

// Gift listing
router.get("/api/gifts", getGifts);

// Order creation
router.post("/api/gifts/order", optionalAuth, giftOrderLimiter, createGiftOrder);

// Order retrieval
router.get("/api/gifts/order/:orderId", getGiftOrder);

// Order payment confirmation
router.post("/api/gifts/order/:orderId/confirm", optionalAuth, paymentConfirmationLimiter, confirmGiftOrder);

export default router;
