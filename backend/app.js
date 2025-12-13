// backend/app.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import { randomUUID } from "crypto";
import mongoose from "mongoose";

import corsOptions, { validateCorsConfig } from "./config/corsOptions.js";
import globalErrorHandler from "./errorHandler/ErrorController.js";
import CustomError from "./errorHandler/CustomError.js";
import { apiLimiter, getRateLimitStatus } from "./middlewares/rateLimiter.js";

// Import routes
import routes from "./routes/index.js";

// Initialize express
const app = express();

// Validate CORS configuration on startup
// Requirements: 4.1-4.10, 19, 160, 191-200
validateCorsConfig();

// Security and performance middleware
// Helmet configuration for security headers
// Requirements: 18, 52, 159, 166, 170, 409, 412
app.use(
  helmet({
    // Content Security Policy - controls which resources can be loaded
    contentSecurityPolicy:
      process.env.NODE_ENV === "production"
        ? {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'"],
              imgSrc: [
                "'self'",
                "data:",
                "blob:",
                "https://res.cloudinary.com", // Cloudinary CDN for images
              ],
              connectSrc: [
                "'self'",
                "wss:", // WebSocket connections for Socket.IO
                "https://api.cloudinary.com", // Cloudinary API for uploads
                "https://res.cloudinary.com", // Cloudinary CDN
              ],
              fontSrc: ["'self'", "data:"],
              objectSrc: ["'none'"],
              mediaSrc: ["'self'", "https://res.cloudinary.com"], // Cloudinary for video/audio
              frameSrc: ["'none'"],
              baseUri: ["'self'"],
              formAction: ["'self'"],
              upgradeInsecureRequests: [],
            },
          }
        : false,
    // HTTP Strict Transport Security - enforces HTTPS
    hsts:
      process.env.NODE_ENV === "production"
        ? {
            maxAge: 31536000, // 1 year in seconds
            includeSubDomains: true,
            preload: true,
          }
        : false,
    // X-Frame-Options - prevents clickjacking attacks
    frameguard: {
      action: "deny",
    },
    // X-Content-Type-Options - prevents MIME type sniffing
    noSniff: true,
    // X-XSS-Protection - enables browser XSS filter (legacy, but still useful)
    xssFilter: true,
    // Referrer-Policy - controls referrer information
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },
    // X-DNS-Prefetch-Control - controls DNS prefetching
    dnsPrefetchControl: {
      allow: false,
    },
    // X-Download-Options - prevents IE from executing downloads
    ieNoOpen: true,
    // X-Permitted-Cross-Domain-Policies - restricts Adobe Flash/PDF
    permittedCrossDomainPolicies: {
      permittedPolicies: "none",
    },
    // Hide X-Powered-By header
    hidePoweredBy: true,
  })
);
// CORS configuration for cross-origin requests
// Requirements: 4.1-4.10, 19, 160, 191-200
// - Credentials enabled for cookie-based JWT auth
// - Origin validation with logging
// - Preflight caching for performance
// - No wildcard origins in production
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(mongoSanitize());
app.use(compression({ threshold: 1024 })); // 1KB threshold

// Request ID middleware for tracing
app.use((req, res, next) => {
  req.id = randomUUID();
  res.setHeader("X-Request-ID", req.id);
  next();
});

// Logging in development
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// Health check endpoints (before rate limiting)
// Requirements: 26, 177, 179, 307

// Server start time for uptime calculation
const serverStartTime = Date.now();

/**
 * Get database connection status
 * @returns {Object} Database status object
 */
const getDatabaseStatus = () => {
  const state = mongoose.connection.readyState;
  const stateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return {
    status: stateMap[state] || "unknown",
    readyState: state,
    isConnected: state === 1,
  };
};

/**
 * Get server uptime in seconds
 * @returns {number} Uptime in seconds
 */
const getUptime = () => {
  return Math.floor((Date.now() - serverStartTime) / 1000);
};

/**
 * Main health check endpoint
 * Returns comprehensive health status including database, timestamp, and uptime
 * Requirements: 26, 177, 307
 */
app.get("/health", (req, res) => {
  const dbStatus = getDatabaseStatus();
  const uptime = getUptime();

  const healthStatus = {
    success: true,
    status: dbStatus.isConnected ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: uptime,
    uptimeFormatted: formatUptime(uptime),
    environment: process.env.NODE_ENV || "development",
    database: {
      status: dbStatus.status,
      connected: dbStatus.isConnected,
    },
    version: process.env.npm_package_version || "1.0.0",
  };

  // Return 200 even if degraded (for monitoring tools that check response)
  // Use /ready for strict health checks
  res.status(200).json(healthStatus);
});

/**
 * Kubernetes Readiness Probe
 * Returns 200 only when the service is ready to accept traffic
 * Used by K8s to determine if pod should receive traffic
 * Requirements: 179, 307
 */
app.get("/ready", (req, res) => {
  const dbStatus = getDatabaseStatus();

  if (!dbStatus.isConnected) {
    return res.status(503).json({
      success: false,
      status: "not_ready",
      timestamp: new Date().toISOString(),
      reason: "Database not connected",
      database: {
        status: dbStatus.status,
        connected: false,
      },
    });
  }

  res.status(200).json({
    success: true,
    status: "ready",
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus.status,
      connected: true,
    },
  });
});

/**
 * Kubernetes Liveness Probe
 * Returns 200 if the service is alive (process is running)
 * Used by K8s to determine if pod should be restarted
 * Requirements: 179, 307
 */
app.get("/live", (req, res) => {
  // Liveness check is simple - if we can respond, we're alive
  // Don't check database here - that's for readiness
  res.status(200).json({
    success: true,
    status: "alive",
    timestamp: new Date().toISOString(),
    uptime: getUptime(),
    pid: process.pid,
    memoryUsage: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: "MB",
    },
  });
});

/**
 * Format uptime into human-readable string
 * @param {number} seconds - Uptime in seconds
 * @returns {string} Formatted uptime string
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(" ");
}
// Rate limit status endpoint (for monitoring)
// Requirements: 358-364, 411
app.get("/api/rate-limit-status", (req, res) => {
  // Only allow in development or for authenticated admin requests
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({
      success: false,
      message: "Rate limit status is only available in development mode",
    });
  }

  res.status(200).json({
    success: true,
    data: getRateLimitStatus(),
  });
});

// Rate limiting on all API routes (production only)
// Requirements: 21, 42, 162, 294, 358-364, 411
// General API: 100 requests per 15 minutes
// Auth endpoints have stricter limits (5/15min) applied in authRoutes.js
if (process.env.NODE_ENV === "production") {
  app.use("/api", apiLimiter);
  console.log("[App] Rate limiting enabled for production");
}

// Main API routes
app.use("/api", routes);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  const path = await import("path");
  const { fileURLToPath } = await import("url");
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, "../client/dist")));

  // SPA fallback - serve index.html for all non-API routes
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
  });
}

// Catch-all route for undefined endpoints
app.all("*", (req, res, next) => {
  const errorMessage = `Resource not found. The requested URL ${req.originalUrl} was not found on this server.`;
  next(
    CustomError.notFound(errorMessage, {
      requestedUrl: req.originalUrl,
      method: req.method,
      availableRoutes: [
        "/api/auth",
        "/api/organizations",
        "/api/departments",
        "/api/users",
        "/api/tasks",
        "/api/materials",
        "/api/vendors",
        "/api/notifications",
      ],
    })
  );
});

// Global error handler
app.use(globalErrorHandler);

export default app;
