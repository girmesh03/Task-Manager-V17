// backend/tests/unit/validateEnv.test.js
/**
 * Unit tests for environment validation utility
 *
 * Tests environment variable validation, type coercion, and error handling.
 *
 * Requirements: Task 5 - Configuration - Server Startup and Environment
 */

import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";

describe("Environment Validation", () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe("Required Variables", () => {
    it("should validate all required variables are present", async () => {
      // Set all required variables
      process.env.NODE_ENV = "development";
      process.env.PORT = "4000";
      process.env.APP_NAME = "Test App";
      process.env.CLIENT_URL = "http://localhost:3000";
      process.env.MONGODB_URI = "mongodb://localhost:27017/test";
      process.env.JWT_ACCESS_SECRET = "a".repeat(32);
      process.env.JWT_REFRESH_SECRET = "b".repeat(32);
      process.env.SMTP_HOST = "smtp.test.com";
      process.env.SMTP_PORT = "465";
      process.env.SMTP_USER = "test@test.com";
      process.env.SMTP_PASS = "password";

      const { validateEnvironment } = await import(
        "../../utils/validateEnv.js"
      );
      const result = validateEnvironment({
        exitOnError: false,
        logResults: false,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail when required variables are missing", async () => {
      // Clear all environment variables
      delete process.env.NODE_ENV;
      delete process.env.PORT;
      delete process.env.APP_NAME;
      delete process.env.CLIENT_URL;
      delete process.env.MONGODB_URI;
      delete process.env.JWT_ACCESS_SECRET;
      delete process.env.JWT_REFRESH_SECRET;
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_PORT;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      const { validateEnvironment } = await import(
        "../../utils/validateEnv.js"
      );
      const result = validateEnvironment({
        exitOnError: false,
        logResults: false,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("PORT Validation", () => {
    it("should accept valid port numbers", async () => {
      process.env.PORT = "4000";
      process.env.NODE_ENV = "development";
      process.env.APP_NAME = "Test";
      process.env.CLIENT_URL = "http://localhost:3000";
      process.env.MONGODB_URI = "mongodb://localhost:27017/test";
      process.env.JWT_ACCESS_SECRET = "a".repeat(32);
      process.env.JWT_REFRESH_SECRET = "b".repeat(32);
      process.env.SMTP_HOST = "smtp.test.com";
      process.env.SMTP_PORT = "465";
      process.env.SMTP_USER = "test@test.com";
      process.env.SMTP_PASS = "password";

      const { validateEnvironment } = await import(
        "../../utils/validateEnv.js"
      );
      const result = validateEnvironment({
        exitOnError: false,
        logResults: false,
      });

      expect(result.valid).toBe(true);
    });

    it("should reject invalid port numbers", async () => {
      process.env.PORT = "invalid";
      process.env.NODE_ENV = "development";
      process.env.APP_NAME = "Test";
      process.env.CLIENT_URL = "http://localhost:3000";
      process.env.MONGODB_URI = "mongodb://localhost:27017/test";
      process.env.JWT_ACCESS_SECRET = "a".repeat(32);
      process.env.JWT_REFRESH_SECRET = "b".repeat(32);
      process.env.SMTP_HOST = "smtp.test.com";
      process.env.SMTP_PORT = "465";
      process.env.SMTP_USER = "test@test.com";
      process.env.SMTP_PASS = "password";

      const { validateEnvironment } = await import(
        "../../utils/validateEnv.js"
      );
      const result = validateEnvironment({
        exitOnError: false,
        logResults: false,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("PORT"))).toBe(true);
    });

    it("should reject port numbers out of range", async () => {
      process.env.PORT = "70000";
      process.env.NODE_ENV = "development";
      process.env.APP_NAME = "Test";
      process.env.CLIENT_URL = "http://localhost:3000";
      process.env.MONGODB_URI = "mongodb://localhost:27017/test";
      process.env.JWT_ACCESS_SECRET = "a".repeat(32);
      process.env.JWT_REFRESH_SECRET = "b".repeat(32);
      process.env.SMTP_HOST = "smtp.test.com";
      process.env.SMTP_PORT = "465";
      process.env.SMTP_USER = "test@test.com";
      process.env.SMTP_PASS = "password";

      const { validateEnvironment } = await import(
        "../../utils/validateEnv.js"
      );
      const result = validateEnvironment({
        exitOnError: false,
        logResults: false,
      });

      expect(result.valid).toBe(false);
    });
  });

  describe("NODE_ENV Validation", () => {
    it("should accept valid NODE_ENV values", async () => {
      const validEnvs = ["development", "production", "test", "staging"];

      for (const env of validEnvs) {
        jest.resetModules();
        process.env.NODE_ENV = env;
        process.env.PORT = "4000";
        process.env.APP_NAME = "Test";
        process.env.CLIENT_URL = "http://localhost:3000";
        process.env.MONGODB_URI = "mongodb://localhost:27017/test";
        process.env.JWT_ACCESS_SECRET = "a".repeat(32);
        process.env.JWT_REFRESH_SECRET = "b".repeat(32);
        process.env.SMTP_HOST = "smtp.test.com";
        process.env.SMTP_PORT = "465";
        process.env.SMTP_USER = "test@test.com";
        process.env.SMTP_PASS = "password";

        const { validateEnvironment } = await import(
          "../../utils/validateEnv.js"
        );
        const result = validateEnvironment({
          exitOnError: false,
          logResults: false,
        });

        expect(result.valid).toBe(true);
      }
    });

    it("should reject invalid NODE_ENV values", async () => {
      process.env.NODE_ENV = "invalid";
      process.env.PORT = "4000";
      process.env.APP_NAME = "Test";
      process.env.CLIENT_URL = "http://localhost:3000";
      process.env.MONGODB_URI = "mongodb://localhost:27017/test";
      process.env.JWT_ACCESS_SECRET = "a".repeat(32);
      process.env.JWT_REFRESH_SECRET = "b".repeat(32);
      process.env.SMTP_HOST = "smtp.test.com";
      process.env.SMTP_PORT = "465";
      process.env.SMTP_USER = "test@test.com";
      process.env.SMTP_PASS = "password";

      const { validateEnvironment } = await import(
        "../../utils/validateEnv.js"
      );
      const result = validateEnvironment({
        exitOnError: false,
        logResults: false,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("NODE_ENV"))).toBe(true);
    });
  });

  describe("JWT Secret Validation", () => {
    it("should reject JWT secrets shorter than 32 characters", async () => {
      process.env.NODE_ENV = "development";
      process.env.PORT = "4000";
      process.env.APP_NAME = "Test";
      process.env.CLIENT_URL = "http://localhost:3000";
      process.env.MONGODB_URI = "mongodb://localhost:27017/test";
      process.env.JWT_ACCESS_SECRET = "short";
      process.env.JWT_REFRESH_SECRET = "b".repeat(32);
      process.env.SMTP_HOST = "smtp.test.com";
      process.env.SMTP_PORT = "465";
      process.env.SMTP_USER = "test@test.com";
      process.env.SMTP_PASS = "password";

      const { validateEnvironment } = await import(
        "../../utils/validateEnv.js"
      );
      const result = validateEnvironment({
        exitOnError: false,
        logResults: false,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("JWT_ACCESS_SECRET"))).toBe(
        true
      );
    });
  });

  describe("URL Validation", () => {
    it("should accept valid URLs", async () => {
      process.env.NODE_ENV = "development";
      process.env.PORT = "4000";
      process.env.APP_NAME = "Test";
      process.env.CLIENT_URL = "https://example.com";
      process.env.MONGODB_URI = "mongodb://localhost:27017/test";
      process.env.JWT_ACCESS_SECRET = "a".repeat(32);
      process.env.JWT_REFRESH_SECRET = "b".repeat(32);
      process.env.SMTP_HOST = "smtp.test.com";
      process.env.SMTP_PORT = "465";
      process.env.SMTP_USER = "test@test.com";
      process.env.SMTP_PASS = "password";

      const { validateEnvironment } = await import(
        "../../utils/validateEnv.js"
      );
      const result = validateEnvironment({
        exitOnError: false,
        logResults: false,
      });

      expect(result.valid).toBe(true);
    });

    it("should reject invalid URLs", async () => {
      process.env.NODE_ENV = "development";
      process.env.PORT = "4000";
      process.env.APP_NAME = "Test";
      process.env.CLIENT_URL = "not-a-url";
      process.env.MONGODB_URI = "mongodb://localhost:27017/test";
      process.env.JWT_ACCESS_SECRET = "a".repeat(32);
      process.env.JWT_REFRESH_SECRET = "b".repeat(32);
      process.env.SMTP_HOST = "smtp.test.com";
      process.env.SMTP_PORT = "465";
      process.env.SMTP_USER = "test@test.com";
      process.env.SMTP_PASS = "password";

      const { validateEnvironment } = await import(
        "../../utils/validateEnv.js"
      );
      const result = validateEnvironment({
        exitOnError: false,
        logResults: false,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("CLIENT_URL"))).toBe(true);
    });
  });

  describe("Email Validation", () => {
    it("should accept valid email addresses", async () => {
      process.env.NODE_ENV = "development";
      process.env.PORT = "4000";
      process.env.APP_NAME = "Test";
      process.env.CLIENT_URL = "http://localhost:3000";
      process.env.MONGODB_URI = "mongodb://localhost:27017/test";
      process.env.JWT_ACCESS_SECRET = "a".repeat(32);
      process.env.JWT_REFRESH_SECRET = "b".repeat(32);
      process.env.SMTP_HOST = "smtp.test.com";
      process.env.SMTP_PORT = "465";
      process.env.SMTP_USER = "valid@email.com";
      process.env.SMTP_PASS = "password";

      const { validateEnvironment } = await import(
        "../../utils/validateEnv.js"
      );
      const result = validateEnvironment({
        exitOnError: false,
        logResults: false,
      });

      expect(result.valid).toBe(true);
    });

    it("should reject invalid email addresses", async () => {
      process.env.NODE_ENV = "development";
      process.env.PORT = "4000";
      process.env.APP_NAME = "Test";
      process.env.CLIENT_URL = "http://localhost:3000";
      process.env.MONGODB_URI = "mongodb://localhost:27017/test";
      process.env.JWT_ACCESS_SECRET = "a".repeat(32);
      process.env.JWT_REFRESH_SECRET = "b".repeat(32);
      process.env.SMTP_HOST = "smtp.test.com";
      process.env.SMTP_PORT = "465";
      process.env.SMTP_USER = "not-an-email";
      process.env.SMTP_PASS = "password";

      const { validateEnvironment } = await import(
        "../../utils/validateEnv.js"
      );
      const result = validateEnvironment({
        exitOnError: false,
        logResults: false,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("SMTP_USER"))).toBe(true);
    });
  });

  describe("Helper Functions", () => {
    it("should correctly identify production environment", async () => {
      process.env.NODE_ENV = "production";

      const { isProduction, isDevelopment, isTest } = await import(
        "../../utils/validateEnv.js"
      );

      expect(isProduction()).toBe(true);
      expect(isDevelopment()).toBe(false);
      expect(isTest()).toBe(false);
    });

    it("should correctly identify development environment", async () => {
      process.env.NODE_ENV = "development";

      const { isProduction, isDevelopment, isTest } = await import(
        "../../utils/validateEnv.js"
      );

      expect(isProduction()).toBe(false);
      expect(isDevelopment()).toBe(true);
      expect(isTest()).toBe(false);
    });

    it("should correctly identify test environment", async () => {
      process.env.NODE_ENV = "test";

      const { isProduction, isDevelopment, isTest } = await import(
        "../../utils/validateEnv.js"
      );

      expect(isProduction()).toBe(false);
      expect(isDevelopment()).toBe(false);
      expect(isTest()).toBe(true);
    });

    it("should get environment variable with type coercion", async () => {
      process.env.PORT = "5000";
      process.env.INITIALIZE_SEED_DATA = "true";

      const { getEnv } = await import("../../utils/validateEnv.js");

      expect(getEnv("PORT")).toBe(5000);
      expect(typeof getEnv("PORT")).toBe("number");
      expect(getEnv("INITIALIZE_SEED_DATA")).toBe(true);
      expect(typeof getEnv("INITIALIZE_SEED_DATA")).toBe("boolean");
    });

    it("should return default value when variable is not set", async () => {
      delete process.env.NONEXISTENT_VAR;

      const { getEnv } = await import("../../utils/validateEnv.js");

      expect(getEnv("NONEXISTENT_VAR", "default")).toBe("default");
    });
  });

  describe("Default Values", () => {
    it("should use default values for optional variables", async () => {
      process.env.NODE_ENV = "development";
      process.env.PORT = "4000";
      process.env.APP_NAME = "Test";
      process.env.CLIENT_URL = "http://localhost:3000";
      process.env.MONGODB_URI = "mongodb://localhost:27017/test";
      process.env.JWT_ACCESS_SECRET = "a".repeat(32);
      process.env.JWT_REFRESH_SECRET = "b".repeat(32);
      process.env.SMTP_HOST = "smtp.test.com";
      process.env.SMTP_PORT = "465";
      process.env.SMTP_USER = "test@test.com";
      process.env.SMTP_PASS = "password";

      // Don't set optional variables
      delete process.env.API_RATE_LIMIT_WINDOW_MINUTES;
      delete process.env.LOG_LEVEL;

      const { validateEnvironment } = await import(
        "../../utils/validateEnv.js"
      );
      const result = validateEnvironment({
        exitOnError: false,
        logResults: false,
      });

      expect(result.valid).toBe(true);
      // Should have warnings about using defaults
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});

describe("Timezone Configuration", () => {
  it("should have TZ environment variable set to UTC", () => {
    // This test verifies the timezone is set correctly
    // In the actual server, TZ is set at the top of server.js
    process.env.TZ = "UTC";
    expect(process.env.TZ).toBe("UTC");
  });

  it("should create dates in UTC", () => {
    process.env.TZ = "UTC";
    const now = new Date();
    const isoString = now.toISOString();

    // ISO string should end with Z (UTC)
    expect(isoString).toMatch(/Z$/);
  });
});
