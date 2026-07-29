/**
 * Global Error Handling Middleware
 * Prevents server from crashing and returns uniform, sanitized error structures.
 */
export const errorHandler = (err, req, res, next) => {
  console.error("[Error] Unhandled exception occurred:", err.stack || err.message);

  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ success: false, message: "ไฟล์รูปต้องมีขนาดไม่เกิน 10 MB" });
  }
  if (err?.status === 415) {
    return res.status(415).json({ success: false, message: err.message });
  }

  const statusCode = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && isProduction
      ? "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง"
      : err.message || "Something went wrong!",
    ...(isProduction ? {} : { stack: err.stack }),
  });
};
