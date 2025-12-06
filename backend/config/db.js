import mongoose from "mongoose";
import winston from "winston";

// Configure logger for database operations
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ timestamp, level, message }) =>
        `${timestamp} [${level.toUpperCase()}]: ${message}`
    )
  ),
  transports: [new winston.transports.Console()],
});

// Connection state tracking
const CONNECTION_STATES = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

// Retry configuration with exponential backoff
const RETRY_CONFIG = {
  maxRetries: 5,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
};

/**
 * Calculate exponential backoff delay
 * @param {number} retryCount - Current retry attempt
 * @returns {number} Delay in milliseconds
 */
const getRetryDelay = (retryCount) => {
  const delay = Math.min(
    RETRY_CONFIG.baseDelay * Math.pow(2, retryCount),
    RETRY_CONFIG.maxDelay
  );
  return delay;
};

/**
 * Connect to MongoDB with retry logic and health monitoring
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  let retryCount = 0;

  const connect = async () => {
    try {
      const options = {
        serverSelectionTimeoutMS: 5000, // 5 seconds
        socketTimeoutMS: 45000, // 45 seconds
        maxPoolSize: 10,
        minPoolSize: 2,
      };

      logger.info(`Attempting to connect to MongoDB... (Attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`);

      await mongoose.connect(process.env.MONGODB_URI, options);

      logger.info(
        `MongoDB Connected Successfully: ${mongoose.connection.host}`
      );
      logger.info(`Database: ${mongoose.connection.name}`);
      logger.info(
        `Connection State: ${CONNECTION_STATES[mongoose.connection.readyState]}`
      );

      // Reset retry count on successful connection
      retryCount = 0;
    } catch (error) {
      logger.error(`MongoDB Connection Error: ${error.message}`);

      if (retryCount < RETRY_CONFIG.maxRetries) {
        const delay = getRetryDelay(retryCount);
        logger.info(`Retrying in ${delay / 1000} seconds...`);

        retryCount++;

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Recursive retry
        return connect();
      } else {
        logger.error(
          `Failed to connect to MongoDB after ${RETRY_CONFIG.maxRetries} attempts`
        );
        throw error;
      }
    }
  };

  await connect();

  // Connection event handlers
  mongoose.connection.on("connected", () => {
    logger.info("Mongoose connected to MongoDB");
  });

  mongoose.connection.on("error", (err) => {
    logger.error(`Mongoose connection error: ${err.message}`);
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("Mongoose disconnected from MongoDB");

    // Attempt to reconnect
    if (retryCount < RETRY_CONFIG.maxRetries) {
      logger.info("Attempting to reconnect...");
      connect();
    }
  });

  // Graceful shutdown
  process.on("SIGINT", async () => {
    try {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed through app termination");
      process.exit(0);
    } catch (err) {
      logger.error(`Error closing MongoDB connection: ${err.message}`);
      process.exit(1);
    }
  });
};

/**
 * Get current connection state
 * @returns {string} Connection state name
 */
export const getConnectionState = () => {
  return CONNECTION_STATES[mongoose.connection.readyState];
};

/**
 * Health check for MongoDB connection
 * @returns {Promise<Object>} Health status
 */
export const healthCheck = async () => {
  try {
    const state = getConnectionState();

    if (state !== "connected") {
      return {
        status: "unhealthy",
        state,
        message: "Database not connected",
      };
    }

    // Ping the database
    await mongoose.connection.db.admin().ping();

    return {
      status: "healthy",
      state,
      database: mongoose.connection.name,
      host: mongoose.connection.host,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      state: getConnectionState(),
      message: error.message,
    };
  }
};

// Health monitoring (every 30 seconds)
let healthCheckInterval;

export const startHealthMonitoring = () => {
  if (healthCheckInterval) return;

  healthCheckInterval = setInterval(async () => {
    const health = await healthCheck();
    if (health.status === "unhealthy") {
      logger.warn(`Database health check failed: ${health.message}`);
    }
  }, 30000);

  logger.info("Database health monitoring started (30s interval)");
};

export const stopHealthMonitoring = () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    logger.info("Database health monitoring stopped");
  }
};

export default connectDB;
