// backend/middlewares/rateLimiter.js
// Requirements: 21, 42, 162, 294, 358-364, 411
// Rate limiting prevents abuse and DDoS attacks
// General API: 100 requests per 15 minutes
// Auth endpoints: 5 requests per 15 minutes
// Use Redis in production, memory-based in development

import rateLimit from "express-rate-limit";

// ============================================================================
// Configuration Constants
// ============================================================================

const RATE_LIMIT_CONFIG = {
  // General API rate limit
  api: {
    windowMs:
      parseInt(process.env.API_RATE_LIMIT_WINDOW_MINUTES || "15") * 60 * 1000,
    max: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS || "100"),
  },
  // Auth endpoints rate limit (stricter)
  auth: {
    windowMs:
      parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES || "15") * 60 * 1000,
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || "5"),
  },
  // Strict rate limit for sensitive operations
  strict: {
    windowMs:
      parseInt(process.env.STRICT_RATE_LIMIT_WINDOW_MINUTES || "60") *
      60 *
      1000,
    max: parseInt(process.env.STRICT_RATE_LIMIT_MAX_REQUESTS || "3"),
  },
  // Create operations rate limit
  create: {
    windowMs:
      parseInt(process.env.CREATE_RATE_LIMIT_WINDOW_MINUTES || "15") *
      60 *
      1000,
    max: parseInt(process.env.CREATE_RATE_LIMIT_MAX_REQUESTS || "30"),
  },
  // Update operations rate limit
  update: {
    windowMs:
      parseInt(process.env.UPDATE_RATE_LIMIT_WINDOW_MINUTES || "15") *
      60 *
      1000,
    max: parseInt(process.env.UPDATE_RATE_LIMIT_MAX_REQUESTS || "50"),
  },
  // Delete operations rate limit
  delete: {
    windowMs:
      parseInt(process.env.DELETE_RATE_LIMIT_WINDOW_MINUTES || "15") *
      60 *
      1000,
    max: parseInt(process.env.DELETE_RATE_LIMIT_MAX_REQUESTS || "20"),
  },
};

// ============================================================================
// Trusted IPs Configuration
// ============================================================================

/**
 * Parse trusted IPs from environment variable
 * Format: comma-separated list of IPs or CIDR ranges
 * Example: TRUSTED_IPS="127.0.0.1,192.168.1.0/24,10.0.0.0/8"
 */
const getTrustedIPs = () => {
  const trustedIPs = process.env.TRUSTED_IPS || "";
  return trustedIPs
    .split(",")
    .map((ip) => ip.trim())
    .filter((ip) => ip.length > 0);
};

/**
 * Check if an IP is in the trusted list
 * Supports exact match and basic CIDR notation
 * @param {string} ip - The IP address to check
 * @returns {boolean} - True if IP is trusted
 */
const isTrustedIP = (ip) => {
  const trustedIPs = getTrustedIPs();
  if (trustedIPs.length === 0) return false;

  // Normalize IP (handle IPv6-mapped IPv4)
  const normalizedIP = ip.replace(/^::ffff:/, "");

  for (const trusted of trustedIPs) {
    // Exact match
    if (trusted === normalizedIP) return true;

    // CIDR notation check (basic implementation)
    if (trusted.includes("/")) {
      const [network, bits] = trusted.split("/");
      const maskBits = parseInt(bits, 10);

      if (isIPInCIDR(normalizedIP, network, maskBits)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Check if an IP is within a CIDR range (IPv4 only)
 * @param {string} ip - IP to check
 * @param {string} network - Network address
 * @param {number} maskBits - CIDR mask bits
 * @returns {boolean}
 */
const isIPInCIDR = (ip, network, maskBits) => {
  try {
    const ipParts = ip.split(".").map(Number);
    const networkParts = network.split(".").map(Number);

    if (ipParts.length !== 4 || networkParts.length !== 4) return false;

    const ipNum =
      (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
    const networkNum =
      (networkParts[0] << 24) |
      (networkParts[1] << 16) |
      (networkParts[2] << 8) |
      networkParts[3];
    const mask = ~((1 << (32 - maskBits)) - 1);

    return (ipNum & mask) === (networkNum & mask);
  } catch {
    return false;
  }
};

// ============================================================================
// Rate Limit Store Configuration
// ============================================================================

/**
 * Get the rate limit store based on environment
 * In production with Redis configured, use Redis store
 * Otherwise, use default memory store
 *
 * To enable Redis:
 * 1. Install packages: npm install rate-limit-redis ioredis
 * 2. Set REDIS_URL environment variable
 *
 * @returns {Object|undefined} - Store configuration or undefined for default
 */
const getStore = async () => {
  // Only attempt Redis in production
  if (process.env.NODE_ENV !== "production" || !process.env.REDIS_URL) {
    return undefined; // Use default memory store
  }

  try {
    // Dynamic import to avoid errors if packages not installed
    const { default: RedisStore } = await import("rate-limit-redis");
    const { default: Redis } = await import("ioredis");

    const redisClient = new Redis(process.env.REDIS_URL, {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
    });

    // Test connection
    await redisClient.connect();

    console.log("[RateLimiter] Redis store connected successfully");

    return new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
      prefix: "rl:",
    });
  } catch (error) {
    console.warn(
      "[RateLimiter] Redis not available, falling back to memory store:",
      error.message
    );
    return undefined; // Fall back to memory store
  }
};

// ============================================================================
// Monitoring and Alerting
// ============================================================================

/**
 * Rate limit event handler for monitoring/alerting
 * Called when a client hits the rate limit
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} options - Rate limit options
 */
const onRateLimitReached = (req, res, options) => {
  const clientIP = getClientIP(req);
  const endpoint = req.originalUrl || req.url;
  const method = req.method;
  const userId = req.user?._id || "anonymous";
  const timestamp = new Date().toISOString();

  // Log rate limit event
  console.warn(`[RateLimiter] Rate limit reached:`, {
    timestamp,
    clientIP,
    endpoint,
    method,
    userId,
    limit: options.max,
    windowMs: options.windowMs,
    requestId: req.id,
  });

  // Emit event for external monitoring (if configured)
  if (process.env.RATE_LIMIT_WEBHOOK_URL) {
    emitRateLimitAlert({
      timestamp,
      clientIP,
      endpoint,
      method,
      userId,
      limit: options.max,
      windowMs: options.windowMs,
    }).catch((err) => {
      console.error("[RateLimiter] Failed to emit alert:", err.message);
    });
  }
};

/**
 * Emit rate limit alert to external monitoring service
 * @param {Object} data - Alert data
 */
const emitRateLimitAlert = async (data) => {
  const webhookUrl = process.env.RATE_LIMIT_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.RATE_LIMIT_WEBHOOK_SECRET && {
          Authorization: `Bearer ${process.env.RATE_LIMIT_WEBHOOK_SECRET}`,
        }),
      },
      body: JSON.stringify({
        type: "rate_limit_exceeded",
        ...data,
      }),
    });

    if (!response.ok) {
      console.warn(`[RateLimiter] Webhook returned ${response.status}`);
    }
  } catch (error) {
    console.error("[RateLimiter] Webhook error:", error.message);
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get client IP address from request
 * Handles proxies and load balancers
 * @param {Object} req - Express request object
 * @returns {string} - Client IP address
 */
const getClientIP = (req) => {
  // Check for forwarded headers (behind proxy/load balancer)
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    // Get the first IP in the chain (original client)
    return forwarded.split(",")[0].trim();
  }

  // Check for real IP header (nginx)
  const realIP = req.headers["x-real-ip"];
  if (realIP) {
    return realIP;
  }

  // Fall back to connection remote address
  return req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip;
};

/**
 * Create skip function for rate limiter
 * Skips rate limiting for trusted IPs and optionally in development
 * @param {boolean} skipInDev - Whether to skip in development mode
 * @returns {Function} - Skip function
 */
const createSkipFunction = (skipInDev = true) => {
  return (req) => {
    // Skip in development if configured
    if (skipInDev && process.env.NODE_ENV === "development") {
      return true;
    }

    // Skip for trusted IPs
    const clientIP = getClientIP(req);
    if (isTrustedIP(clientIP)) {
      return true;
    }

    return false;
  };
};

/**
 * Create key generator for rate limiter
 * Uses IP address as the key, with optional user ID for authenticated requests
 * @returns {Function} - Key generator function
 */
const createKeyGenerator = () => {
  return (req) => {
    const ip = getClientIP(req);
    // Include user ID if authenticated for more granular limiting
    const userId = req.user?._id;
    return userId ? `${ip}:${userId}` : ip;
  };
};

// ============================================================================
// Rate Limiter Factory
// ============================================================================

/**
 * Create a rate limiter with the specified configuration
 * @param {Object} config - Rate limit configuration
 * @param {number} config.windowMs - Time window in milliseconds
 * @param {number} config.max - Maximum requests per window
 * @param {string} config.message - Error message
 * @param {string} config.errorCode - Error code for response
 * @param {boolean} config.skipInDev - Whether to skip in development
 * @returns {Function} - Express middleware
 */
const createRateLimiter = ({
  windowMs,
  max,
  message,
  errorCode,
  skipInDev = true,
}) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skip: createSkipFunction(skipInDev),
    keyGenerator: createKeyGenerator(),
    handler: (req, res, next, options) => {
      // Call monitoring handler
      onRateLimitReached(req, res, options);

      // Send error response
      res.status(429).json({
        success: false,
        message,
        errorCode,
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
    // Standard headers configuration
    standardHeaders: "draft-7", // Use draft-7 standard headers
  });
};

// ============================================================================
// Rate Limiters
// ============================================================================

/**
 * Auth endpoints rate limiter (stricter)
 * 5 requests per 15 minutes by default
 * Applied to: /api/auth/*
 */
const authLimiter = createRateLimiter({
  windowMs: RATE_LIMIT_CONFIG.auth.windowMs,
  max: RATE_LIMIT_CONFIG.auth.max,
  message: "Too many authentication attempts, please try again later",
  errorCode: "TOO_MANY_AUTH_ATTEMPTS",
  skipInDev: true,
});

/**
 * General API rate limiter
 * 100 requests per 15 minutes by default
 * Applied to: /api/*
 */
const apiLimiter = createRateLimiter({
  windowMs: RATE_LIMIT_CONFIG.api.windowMs,
  max: RATE_LIMIT_CONFIG.api.max,
  message: "Too many requests, please try again later",
  errorCode: "TOO_MANY_REQUESTS",
  skipInDev: true,
});

/**
 * Strict rate limiter for sensitive operations
 * 3 requests per 60 minutes by default
 * Applied to: password reset, account deletion, etc.
 */
const strictLimiter = createRateLimiter({
  windowMs: RATE_LIMIT_CONFIG.strict.windowMs,
  max: RATE_LIMIT_CONFIG.strict.max,
  message: "Too many attempts, please try again later",
  errorCode: "RATE_LIMIT_EXCEEDED",
  skipInDev: false, // Always enforce for sensitive operations
});

/**
 * Create operations rate limiter
 * 30 requests per 15 minutes by default
 * Applied to: POST endpoints
 */
const createLimiter = createRateLimiter({
  windowMs: RATE_LIMIT_CONFIG.create.windowMs,
  max: RATE_LIMIT_CONFIG.create.max,
  message: "Too many create requests, please try again later",
  errorCode: "TOO_MANY_CREATE_REQUESTS",
  skipInDev: true,
});

/**
 * Update operations rate limiter
 * 50 requests per 15 minutes by default
 * Applied to: PUT/PATCH endpoints
 */
const updateLimiter = createRateLimiter({
  windowMs: RATE_LIMIT_CONFIG.update.windowMs,
  max: RATE_LIMIT_CONFIG.update.max,
  message: "Too many update requests, please try again later",
  errorCode: "TOO_MANY_UPDATE_REQUESTS",
  skipInDev: true,
});

/**
 * Delete operations rate limiter
 * 20 requests per 15 minutes by default
 * Applied to: DELETE endpoints
 */
const deleteLimiter = createRateLimiter({
  windowMs: RATE_LIMIT_CONFIG.delete.windowMs,
  max: RATE_LIMIT_CONFIG.delete.max,
  message: "Too many delete requests, please try again later",
  errorCode: "TOO_MANY_DELETE_REQUESTS",
  skipInDev: true,
});

// ============================================================================
// Dynamic Rate Limiter
// ============================================================================

/**
 * Create a custom rate limiter with specific configuration
 * Useful for endpoint-specific rate limiting
 * @param {Object} options - Rate limit options
 * @param {number} options.windowMinutes - Time window in minutes
 * @param {number} options.maxRequests - Maximum requests per window
 * @param {string} options.message - Custom error message
 * @param {string} options.errorCode - Custom error code
 * @param {boolean} options.skipInDev - Whether to skip in development
 * @returns {Function} - Express middleware
 */
const createCustomLimiter = ({
  windowMinutes = 15,
  maxRequests = 100,
  message = "Too many requests, please try again later",
  errorCode = "RATE_LIMIT_EXCEEDED",
  skipInDev = true,
}) => {
  return createRateLimiter({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    message,
    errorCode,
    skipInDev,
  });
};

// ============================================================================
// Rate Limit Status Endpoint Helper
// ============================================================================

/**
 * Get rate limit status for monitoring
 * Can be used in health check or admin endpoints
 * @returns {Object} - Rate limit configuration status
 */
const getRateLimitStatus = () => {
  return {
    enabled: process.env.NODE_ENV === "production",
    store: process.env.REDIS_URL ? "redis" : "memory",
    trustedIPs: getTrustedIPs().length,
    limits: {
      api: {
        windowMinutes: RATE_LIMIT_CONFIG.api.windowMs / 60000,
        maxRequests: RATE_LIMIT_CONFIG.api.max,
      },
      auth: {
        windowMinutes: RATE_LIMIT_CONFIG.auth.windowMs / 60000,
        maxRequests: RATE_LIMIT_CONFIG.auth.max,
      },
      strict: {
        windowMinutes: RATE_LIMIT_CONFIG.strict.windowMs / 60000,
        maxRequests: RATE_LIMIT_CONFIG.strict.max,
      },
      create: {
        windowMinutes: RATE_LIMIT_CONFIG.create.windowMs / 60000,
        maxRequests: RATE_LIMIT_CONFIG.create.max,
      },
      update: {
        windowMinutes: RATE_LIMIT_CONFIG.update.windowMs / 60000,
        maxRequests: RATE_LIMIT_CONFIG.update.max,
      },
      delete: {
        windowMinutes: RATE_LIMIT_CONFIG.delete.windowMs / 60000,
        maxRequests: RATE_LIMIT_CONFIG.delete.max,
      },
    },
  };
};

// ============================================================================
// Exports
// ============================================================================

export {
  authLimiter,
  apiLimiter,
  strictLimiter,
  createLimiter,
  updateLimiter,
  deleteLimiter,
  createCustomLimiter,
  getRateLimitStatus,
  getClientIP,
  isTrustedIP,
  RATE_LIMIT_CONFIG,
};

// Default export for backward compatibility
export default authLimiter;
