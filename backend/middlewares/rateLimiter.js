/**
 * Rate Limiting Middleware
 * Prevents brute force attacks and API abuse
 */

import rateLimit from "express-rate-limit";
import { RATE_LIMITS } from "../utils/constants.js";

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
export const generalLimiter = rateLimit({
  windowMs: RATE_LIMITS.GENERAL.WINDOW_MS,
  max: RATE_LIMITS.GENERAL.MAX_REQUESTS,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
    errorCode: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip rate limiting in test environment
  skip: (req) => process.env.NODE_ENV === "test",
});

/**
 * Auth routes rate limiter (stricter)
 * 5 requests per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH.WINDOW_MS,
  max: RATE_LIMITS.AUTH.MAX_REQUESTS,
  message: {
    success: false,
    message:
      "Too many authentication attempts from this IP, please try again later.",
    errorCode: "AUTH_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "test",
});

/**
 * Create custom rate limiter
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} max - Maximum requests in window
 * @param {string} message - Error message
 * @returns {Function} Rate limiter middleware
 */
export const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || "Too many requests, please try again later.",
      errorCode: "RATE_LIMIT_EXCEEDED",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === "test",
  });
};

export default {
  generalLimiter,
  authLimiter,
  createRateLimiter,
};
