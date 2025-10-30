// backend/middlewares/rateLimiter.js
import rateLimit from "express-rate-limit";

// Auth endpoints rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs:
    parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES || "15") * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || "5"),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "development",
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later",
    errorCode: "TOO_MANY_AUTH_ATTEMPTS",
  },
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs:
    parseInt(process.env.API_RATE_LIMIT_WINDOW_MINUTES || "15") * 60 * 1000,
  max: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS || "100"),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "development",
  message: {
    success: false,
    message: "Too many requests, please try again later",
    errorCode: "TOO_MANY_REQUESTS",
  },
});

// Strict rate limiter for sensitive operations
const strictLimiter = rateLimit({
  windowMs:
    parseInt(process.env.STRICT_RATE_LIMIT_WINDOW_MINUTES || "60") * 60 * 1000,
  max: parseInt(process.env.STRICT_RATE_LIMIT_MAX_REQUESTS || "3"),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts, please try again later",
    errorCode: "RATE_LIMIT_EXCEEDED",
  },
});

export { authLimiter, apiLimiter, strictLimiter };
export default authLimiter;
