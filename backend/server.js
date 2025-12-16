// backend/server.js
/**
 * Server Entry Point
 *
 * Handles server startup, graceful shutdown, and process management.
 * Implements production-ready configuration with:
 * - UTC timezone enforcement
 * - Environment validation
 * - Structured logging
 * - Graceful shutdown for HTTP, Socket.IO, and MongoDB
 *
 * Requirements: 2.1-2.6, 6-11, 12-17, 23, 110, 171, 174, 176, 181, 182
 */

// CRITICAL: Set timezone to UTC BEFORE any other imports
// This ensures all date operations use UTC consistently
// See: backend/docs/timezone-doc.md
process.env.TZ = "UTC";

import http from "http";
import mongoose from "mongoose";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

// Import logger first for consistent logging
import logger, {
  logStartup,
  logDatabase,
  logSocket,
  logEmail,
  logShutdown,
  logError,
} from "./utils/logger.js";

// Import environment validation
import validateEnvironment, {
  getEnv,
  isDevelopment,
  isProduction,
} from "./utils/validateEnv.js";

import app from "./app.js";
import connectDB from "./config/db.js";
import cleanSeedSetup from "./mock/cleanSeedSetup.js";
import corsOptions from "./config/corsOptions.js";
import setupSocketIO from "./utils/socket.js";
import { setIO, getIO } from "./utils/socketInstance.js";
import emailService from "./services/emailService.js";

// Configure dayjs with UTC and timezone plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Set dayjs default timezone to UTC
dayjs.tz.setDefault("UTC");

// Graceful shutdown timeout (10 seconds)
const GRACEFUL_SHUTDOWN_TIMEOUT = 10000;

// Create HTTP server
const server = http.createServer(app);

/**
 * Start the server with all required services
 */
const startServer = async () => {
  try {
    // Step 1: Validate environment variables
    logStartup("Validating environment configuration...");
    validateEnvironment({ exitOnError: true, logResults: true });

    // Step 2: Parse and validate PORT
    const PORT = getEnv("PORT", 4000);
    if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
      throw new Error(`Invalid PORT: ${PORT}. Must be between 1 and 65535.`);
    }

    // Step 3: Log timezone configuration
    logStartup(`Timezone set to UTC (TZ=${process.env.TZ})`);
    logStartup(`Server time: ${new Date().toISOString()}`);
    logStartup(`Dayjs UTC: ${dayjs.utc().format()}`);

    // Step 4: Connect to MongoDB
    logDatabase("Connecting to MongoDB...");
    await connectDB();

    // Step 5: Initialize email service (non-blocking)
    // Email service failure should NOT prevent server startup
    logEmail("Initializing email service...");
    try {
      await emailService.initialize();
      logEmail("Email service initialized successfully");
    } catch (emailError) {
      logger.warn("⚠️  Email service initialization failed:", {
        error: emailError.message,
      });
      logger.warn("Email notifications will be disabled");
    }

    // Step 6: Seed database (development only)
    if (isDevelopment() && getEnv("INITIALIZE_SEED_DATA", false)) {
      logStartup("Initializing seed data (development mode)...");
      await cleanSeedSetup();
      logStartup("Seed data initialized successfully");
    } else if (isProduction() && process.env.INITIALIZE_SEED_DATA === "true") {
      logger.warn(
        "⚠️  INITIALIZE_SEED_DATA is set to true in production - ignoring for safety"
      );
    }

    // Step 7: Start HTTP server
    server.listen(PORT, () => {
      // Step 8: Initialize Socket.IO after server is listening
      const io = setupSocketIO(server, corsOptions);
      setIO(io);

      logStartup(`Server running on http://localhost:${PORT}`);
      logStartup(`Environment: ${process.env.NODE_ENV || "development"}`);
      logSocket("Socket.IO enabled with CORS from configured origins");

      // Log startup summary
      logger.info("=".repeat(50));
      logger.info("Server Startup Summary:");
      logger.info(`  - Port: ${PORT}`);
      logger.info(`  - Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(`  - Timezone: UTC`);
      logger.info(`  - Database: Connected`);
      logger.info(`  - Socket.IO: Enabled`);
      logger.info(
        `  - Email Service: ${
          emailService.isInitialized() ? "Enabled" : "Disabled"
        }`
      );
      logger.info("=".repeat(50));
    });

    // Handle server errors
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        logError(`Port ${PORT} is already in use`, error);
        process.exit(1);
      } else {
        logError("Server error", error);
      }
    });
  } catch (err) {
    logError("Server startup failed", err);
    process.exit(1);
  }
};

/**
 * Graceful shutdown handler
 * Closes all connections in the correct order:
 * 1. Stop accepting new connections
 * 2. Close Socket.IO connections
 * 3. Close HTTP server
 * 4. Close MongoDB connection
 * 5. Exit process
 *
 * Requirements: 27, 172, 180
 *
 * @param {string} signal - Signal that triggered shutdown
 */
const shutdown = async (signal) => {
  logShutdown(`Received ${signal}. Starting graceful shutdown...`);

  // Set a timeout for forced shutdown
  const forceShutdownTimeout = setTimeout(() => {
    logger.error("⌛ Graceful shutdown timeout - forcing exit");
    process.exit(1);
  }, GRACEFUL_SHUTDOWN_TIMEOUT);

  try {
    // Step 1: Close Socket.IO connections
    // Use try-catch because getIO() throws if not initialized
    try {
      const io = getIO();
      if (io) {
        logSocket("Closing Socket.IO connections...");
        await new Promise((resolve) => {
          io.close(() => {
            logSocket("Socket.IO server closed");
            resolve();
          });
        });
      }
    } catch (socketError) {
      // Socket.IO was never initialized - this is fine during early shutdown
      logSocket("Socket.IO was not initialized - skipping");
    }

    // Step 2: Close HTTP server (stop accepting new connections)
    logShutdown("Closing HTTP server...");
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) {
          logger.error("Error closing HTTP server:", { error: err.message });
          reject(err);
        } else {
          logShutdown("HTTP server closed");
          resolve();
        }
      });
    });

    // Step 3: Close MongoDB connection
    logDatabase("Closing MongoDB connection...");
    await mongoose.disconnect();
    logDatabase("MongoDB connection closed");

    // Step 4: Log email queue status
    if (emailService && emailService.getQueueStatus) {
      const queueStatus = emailService.getQueueStatus();
      if (queueStatus.queueLength > 0) {
        logger.warn(`⚠️  ${queueStatus.queueLength} emails remaining in queue`);
      }
    }

    // Clear the force shutdown timeout
    clearTimeout(forceShutdownTimeout);

    logShutdown("Shutdown complete");
    process.exit(0);
  } catch (err) {
    clearTimeout(forceShutdownTimeout);
    logError("Error during shutdown", err);
    process.exit(1);
  }
};

// Register signal handlers for graceful shutdown
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logError("Uncaught Exception - shutting down", err);
  shutdown("UNCAUGHT_EXCEPTION");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", {
    promise: String(promise),
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  shutdown("UNHANDLED_REJECTION");
});

// Start the server
startServer();

// Export for testing
export { server, shutdown };
