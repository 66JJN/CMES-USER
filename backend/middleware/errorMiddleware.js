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
  res.status(statusCode).json({
    success: false,
    // Stack traces stay in server logs in every environment. Returning them
    // to a browser leaks paths and makes an error message unusably long.
    message: statusCode === 500
      ? "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง"
      : err.message || "Something went wrong!",
  });
};
