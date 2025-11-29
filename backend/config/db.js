// backend/config/db.js
import mongoose from "mongoose";

const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 30000; // Cap at 30 seconds
const MAX_STARTUP_RETRIES = 5;
const HEALTH_CHECK_INTERVAL_MS = 30000;

let isConnecting = false;

const getConnectionOptions = () => ({
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 50,
  minPoolSize: 5,
  retryWrites: true,
  w: "majority",
});

const tryConnectOnce = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable not defined");
  }

  await mongoose.connect(process.env.MONGODB_URI, getConnectionOptions());
};

const connectWithRetry = async (maxRetries = MAX_STARTUP_RETRIES) => {
  if (mongoose.connection.readyState === 1) return;
  if (isConnecting) return;

  isConnecting = true;
  let attempt = 0;
  let lastError;

  while (attempt < maxRetries && mongoose.connection.readyState !== 1) {
    attempt += 1;

    try {
      await tryConnectOnce();

      console.log("💾 Connected to MongoDB successfully.");

      try {
        const modelNames = mongoose.modelNames();
        if (modelNames.length > 0 && mongoose.connection.db) {
          await Promise.all(
            modelNames.map((name) => mongoose.model(name).syncIndexes())
          );
          console.log("✅ MongoDB indexes are in sync.");
        }
      } catch (indexError) {
        console.error(
          `⚠️ Failed to sync MongoDB indexes: ${indexError.message}`
        );
      }

      lastError = undefined;
      break;
    } catch (error) {
      lastError = error;
      const delay = Math.min(
        INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1),
        MAX_RETRY_DELAY_MS
      );

      console.error(
        `MongoDB connection attempt ${attempt} failed: ${error.message}`
      );

      if (attempt >= maxRetries) {
        console.error(
          `❌ Maximum MongoDB connection retry attempts (${maxRetries}) reached.`
        );
        break;
      }

      console.warn(`Retrying MongoDB connection in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  isConnecting = false;

  if (mongoose.connection.readyState !== 1 && lastError) {
    throw lastError;
  }
};

const monitorConnection = () => {
  setInterval(async () => {
    const state = mongoose.connection.readyState;
    const stateMap = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    if (state !== 1 && !isConnecting) {
      console.log(
        `MongoDB connection state: ${stateMap[state] || "unknown"} (${state})`
      );

      if (state === 0) {
        console.log("Attempting to reconnect to MongoDB...");
        try {
          await connectWithRetry(MAX_STARTUP_RETRIES);
        } catch (error) {
          console.error(
            `❌ MongoDB reconnection failed after retries: ${error.message}`
          );
        }
      }
    }
  }, HEALTH_CHECK_INTERVAL_MS);
};

const connectDB = async () => {
  await connectWithRetry(MAX_STARTUP_RETRIES);
  monitorConnection();
  return mongoose.connection;
};

mongoose.connection.on("connecting", () => {
  console.log("Attempting to connect to MongoDB...");
});

mongoose.connection.on("connected", () => {
  console.log("MongoDB connection established.");
});

mongoose.connection.on("disconnected", () => {
  console.log("🔌 MongoDB connection lost. Attempting to reconnect...");

  if (!isConnecting) {
    setTimeout(async () => {
      try {
        await connectWithRetry(MAX_STARTUP_RETRIES);
      } catch (error) {
        console.error(
          `❌ MongoDB reconnection failed after retries: ${error.message}`
        );
      }
    }, 1000);
  }
});

mongoose.connection.on("error", (err) => {
  if (err.name === "MongoServerSelectionError") {
    console.warn("MongoDB server selection error, will retry...");
  } else {
    console.error("❌ MongoDB connection error:", err.message);
  }
});

export default connectDB;
