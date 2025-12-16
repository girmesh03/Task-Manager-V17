import mongoose from "mongoose";
import { jest, beforeAll, afterAll, afterEach } from "@jest/globals";

// Increase timeout for tests
jest.setTimeout(30000);

beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = "test";
  process.env.JWT_ACCESS_SECRET = "test-access-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
  process.env.SMTP_HOST = "smtp.test.com";
  process.env.SMTP_PORT = "587";
  process.env.SMTP_USER = "test@example.com";
  process.env.SMTP_PASS = "password";
  process.env.CLIENT_URL = "http://localhost:3000";

  // Use global mongo URI (from globalSetup) or fallback
  const TEST_DB_URI = global.__MONGO_URI__ || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/task-manager-test";
  process.env.MONGODB_URI = TEST_DB_URI;

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI, {
        serverSelectionTimeoutMS: 5000, // Fail fast if no DB
      });
      console.log("Connected to test database");
    }
  } catch (error) {
    console.error("Test setup connection error:", error.message);
    // Don't throw, let tests fail individually if they need DB
    // This allows unit tests (that don't need DB) to pass even if DB is down
  }
});

afterAll(async () => {
  // Disconnect from in-memory database
  await mongoose.disconnect();
});

afterEach(async () => {
  // Clear all mocks
  jest.clearAllMocks();
});
