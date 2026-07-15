/**
 * Global Error Handling Middleware
 * Prevents server from crashing and returns uniform, sanitized error structures.
 */
export const errorHandler = (err, req, res, next) => {
  console.error("[Error] Unhandled exception occurred:", err.stack || err.message);

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
