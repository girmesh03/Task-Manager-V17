// backend/server.js
import http from "http";
import mongoose from "mongoose";
import app from "./app.js";

import connectDB from "./config/db.js";
import cleanSeedSetup from "./mock/cleanSeedSetup.js";
import corsOptions from "./config/corsOptions.js";
import setupSocketIO from "./utils/socket.js";
import { setIO, getIO } from "./utils/socketInstance.js";
import emailService from "./services/emailService.js";

let PORT = parseInt(process.env.PORT || "4000", 10);
const GRACEFUL_SHUTDOWN_TIMEOUT = 10000;

const server = http.createServer(app);

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Initialize email service
    try {
      await emailService.initialize();
      console.log("📧 Email service initialized successfully");
    } catch (emailError) {
      console.warn(
        "⚠️  Email service initialization failed:",
        emailError.message
      );
      console.warn("📧 Email notifications will be disabled");
    }

    // Seed database
    if (
      process.env.NODE_ENV === "development" &&
      process.env.INITIALIZE_SEED_DATA === "true"
    ) {
      await cleanSeedSetup();
    }

    // Start HTTP server
    server.listen(PORT, () => {
      // Initialize Socket.IO and set the instance ONCE
      const io = setupSocketIO(server, corsOptions);
      setIO(io); // Single source of truth for io instance

      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`⚙️  Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`📅 Server Time: ${new Date().toISOString()}`);
      console.log(`🔌 Socket.IO enabled with CORS from configured origins`);
    });
  } catch (err) {
    console.error("🚨 Server startup failed:", err.message);
    // Don't exit process on startup failure, let the retry mechanism handle it
    console.log("Attempting to recover from startup failure...");
  }
};

const shutdown = async (signal) => {
  console.log(`🛑 Received ${signal}. Starting graceful shutdown...`);

  try {
    // Stop accepting new connections
    console.log("📡 Stopping new connections...");

    // Close Socket.IO first with proper cleanup
    if (getIO()) {
      console.log("🔌 Closing Socket.IO server...");
      const socketClosePromise = new Promise((resolve) => {
        getIO().close(() => {
          console.log("✅ Socket.IO server closed");
          resolve();
        });
      });

      // Wait for socket close with timeout
      await Promise.race([
        socketClosePromise,
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ]);
    }

    // Close HTTP server and wait for existing connections to finish
    console.log("🌐 Closing HTTP server...");
    const serverClosePromise = new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) {
          console.error("❌ Error closing HTTP server:", err.message);
          reject(err);
        } else {
          console.log("✅ HTTP server closed");
          resolve();
        }
      });
    });

    // Set timeout for graceful shutdown
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.warn("⌛ Graceful shutdown timeout - forcing exit");
        resolve();
      }, GRACEFUL_SHUTDOWN_TIMEOUT);
    });

    await Promise.race([serverClosePromise, timeoutPromise]);

    // Close MongoDB connection
    console.log("🗄️  Closing MongoDB connection...");
    await mongoose.disconnect();
    console.log("✅ MongoDB connection closed");

    // Clean up email service
    console.log("📧 Cleaning up email service...");
    if (emailService && emailService.getQueueStatus) {
      const queueStatus = emailService.getQueueStatus();
      if (queueStatus.queueLength > 0) {
        console.log(`⚠️  ${queueStatus.queueLength} emails remaining in queue`);
      }
    }

    console.log("👋 Shutdown complete");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during shutdown:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("uncaughtException", (err) => {
  console.error("🛑 Uncaught Exception:", err.message);
  console.error("Stack trace:", err.stack);
  console.error("🚨 This is a critical error. Shutting down...");
  shutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("🛑 Unhandled Rejection at:", promise);
  console.error("Reason:", reason);
  console.error("🚨 This indicates a programming error. Shutting down...");
  shutdown("UNHANDLED_REJECTION");
});

startServer();

export { getIO as io };
