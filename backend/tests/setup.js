import mongoose from "mongoose";
import { jest, beforeAll, afterAll, afterEach } from "@jest/globals";

jest.setTimeout(30000);

beforeAll(async () => {
  process.env.NODE_ENV = "test";

  process.env.JWT_ACCESS_SECRET =
    process.env.JWT_ACCESS_SECRET || "12345678901234567890123456789012";
  process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET || "12345678901234567890123456789012";

  process.env.SMTP_HOST = process.env.SMTP_HOST || "smtp.test.com";
  process.env.SMTP_PORT = process.env.SMTP_PORT || "587";
  process.env.SMTP_USER = process.env.SMTP_USER || "test@example.com";
  process.env.SMTP_PASS = process.env.SMTP_PASS || "password";

  process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
  process.env.APP_NAME = process.env.APP_NAME || "Task Manager";

  const TEST_DB_URI =
    process.env.MONGODB_URI_TEST ||
    global.__MONGO_URI__ ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/task-manager-test";

  process.env.MONGODB_URI_TEST = TEST_DB_URI;
  process.env.MONGODB_URI = TEST_DB_URI;

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
    }
  } catch (error) {
    console.error("Test setup connection error:", error.message);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

afterEach(() => {
  jest.clearAllMocks();
});
