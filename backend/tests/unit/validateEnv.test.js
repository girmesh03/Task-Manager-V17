import { jest } from "@jest/globals";
import { validateEnvironment, getEnv } from "../../utils/validateEnv.js";
import logger from "../../utils/logger.js";

// Mock logger to avoid console spam during tests
jest.mock("../../utils/logger.js", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe("validateEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("getEnv", () => {
    it("should return string value", () => {
      process.env.TEST_STR = "hello";
      expect(getEnv("TEST_STR")).toBe("hello"); // Plain getEnv for non-defined might behave differently, but let's test defined ones if we can mock definitions.
      // Since definitions are hardcoded in the file, we test known vars.
      process.env.APP_NAME = "Test App";
      expect(getEnv("APP_NAME")).toBe("Test App");
    });

    it("should return number for port", () => {
      process.env.PORT = "5000";
      expect(getEnv("PORT")).toBe(5000);
    });

    it("should return boolean for INITIALIZE_SEED_DATA", () => {
      process.env.INITIALIZE_SEED_DATA = "true";
      expect(getEnv("INITIALIZE_SEED_DATA")).toBe(true);
    });

    it("should return default value if not set", () => {
        delete process.env.PORT; // Default is 4000
        expect(getEnv("PORT")).toBe(4000);
    });
  });

  describe("validateEnvironment", () => {
    it("should validate valid environment", () => {
        // Setup minimal valid env
        process.env.NODE_ENV = "test";
        process.env.PORT = "4000";
        process.env.APP_NAME = "Test";
        process.env.CLIENT_URL = "http://localhost:3000";
        process.env.MONGODB_URI = "mongodb://localhost:27017/test";
        process.env.JWT_ACCESS_SECRET = "12345678901234567890123456789012";
        process.env.JWT_REFRESH_SECRET = "12345678901234567890123456789012";
        process.env.SMTP_HOST = "smtp.mailtrap.io";
        process.env.SMTP_PORT = "2525";
        process.env.SMTP_USER = "user@test.com";
        process.env.SMTP_PASS = "password";

        const result = validateEnvironment({ exitOnError: false, logResults: false });
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it("should fail on missing required variables", () => {
        process.env = {}; // Empty env
        const result = validateEnvironment({ exitOnError: false, logResults: false });
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors).toContainEqual(expect.stringContaining("environment variable")); // checking typical error message part? No, implementation specific.
        // It says "Required environment variable ... is not set"
    });

    it("should fail on invalid enum (NODE_ENV)", () => {
        process.env.NODE_ENV = "invalid_env";
        const result = validateEnvironment({ exitOnError: false, logResults: false });
        expect(result.valid).toBe(false);
    });
  });
});
