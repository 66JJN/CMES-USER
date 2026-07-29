import rateLimit, { ipKeyGenerator } from "express-rate-limit";

// Signed users have their own quota. Guests share an IP quota high enough for
// a venue Wi-Fi, while still stopping a runaway browser from filling the queue.
const actorKey = (req) => req.userId
  ? `user:${req.userId}`
  : `ip:${ipKeyGenerator(req.ip)}`;

const tooManyRequests = (res) => res.status(429).json({
  success: false,
  message: "ส่งรายการถี่เกินไป กรุณารอสักครู่แล้วลองใหม่",
});

export const contentSubmissionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: (req) => (req.userId ? 6 : 60),
  keyGenerator: actorKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => tooManyRequests(res),
});

export const paymentConfirmationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: (req) => (req.userId ? 12 : 80),
  keyGenerator: actorKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => tooManyRequests(res),
});

export const giftOrderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: (req) => (req.userId ? 5 : 60),
  keyGenerator: actorKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => tooManyRequests(res),
});
