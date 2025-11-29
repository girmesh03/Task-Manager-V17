// backend/tests/unit/rateLimiter.test.js
// Tests for rate limiting middleware
// Requirements: 21, 42, 162, 294, 358-364, 411

import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";

// Mock environment variables before importing the module
const originalEnv = process.env;

describe("Rate Limiter Middleware", () => {
  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Configuration", () => {
    it("should export all required rate limiters", async () => {
      const rateLimiter = await import("../../middlewares/rateLimiter.js");

      expect(rateLimiter.authLimiter).toBeDefined();
      expect(rateLimiter.apiLimiter).toBeDefined();
      expect(rateLimiter.strictLimiter).toBeDefined();
      expect(rateLimiter.createLimiter).toBeDefined();
      expect(rateLimiter.updateLimiter).toBeDefined();
      expect(rateLimiter.deleteLimiter).toBeDefined();
      expect(rateLimiter.createCustomLimiter).toBeDefined();
      expect(rateLimiter.getRateLimitStatus).toBeDefined();
    });

    it("should have correct default rate limit configuration", async () => {
      const { RATE_LIMIT_CONFIG } = await import(
        "../../middlewares/rateLimiter.js"
      );

      // API: 100 requests per 15 minutes
      expect(RATE_LIMIT_CONFIG.api.windowMs).toBe(15 * 60 * 1000);
      expect(RATE_LIMIT_CONFIG.api.max).toBe(100);

      // Auth: 5 requests per 15 minutes
      expect(RATE_LIMIT_CONFIG.auth.windowMs).toBe(15 * 60 * 1000);
      expect(RATE_LIMIT_CONFIG.auth.max).toBe(5);

      // Strict: 3 requests per 60 minutes
      expect(RATE_LIMIT_CONFIG.strict.windowMs).toBe(60 * 60 * 1000);
      expect(RATE_LIMIT_CONFIG.strict.max).toBe(3);
    });

    it("should respect environment variable overrides", async () => {
      process.env.API_RATE_LIMIT_WINDOW_MINUTES = "30";
      process.env.API_RATE_LIMIT_MAX_REQUESTS = "200";
      process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES = "10";
      process.env.AUTH_RATE_LIMIT_MAX_REQUESTS = "3";

      // Re-import to pick up new env vars
      jest.resetModules();
      const { RATE_LIMIT_CONFIG } = await import(
        "../../middlewares/rateLimiter.js"
      );

      expect(RATE_LIMIT_CONFIG.api.windowMs).toBe(30 * 60 * 1000);
      expect(RATE_LIMIT_CONFIG.api.max).toBe(200);
      expect(RATE_LIMIT_CONFIG.auth.windowMs).toBe(10 * 60 * 1000);
      expect(RATE_LIMIT_CONFIG.auth.max).toBe(3);
    });
  });

  describe("Rate Limit Status", () => {
    it("should return correct status in development mode", async () => {
      process.env.NODE_ENV = "development";
      jest.resetModules();

      const { getRateLimitStatus } = await import(
        "../../middlewares/rateLimiter.js"
      );
      const status = getRateLimitStatus();

      expect(status.enabled).toBe(false);
      expect(status.store).toBe("memory");
      expect(status.limits).toBeDefined();
      expect(status.limits.api).toBeDefined();
      expect(status.limits.auth).toBeDefined();
      expect(status.limits.strict).toBeDefined();
    });

    it("should return correct status in production mode", async () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();

      const { getRateLimitStatus } = await import(
        "../../middlewares/rateLimiter.js"
      );
      const status = getRateLimitStatus();

      expect(status.enabled).toBe(true);
      expect(status.store).toBe("memory"); // No Redis URL configured
    });

    it("should indicate Redis store when REDIS_URL is set", async () => {
      process.env.NODE_ENV = "production";
      process.env.REDIS_URL = "redis://localhost:6379";
      jest.resetModules();

      const { getRateLimitStatus } = await import(
        "../../middlewares/rateLimiter.js"
      );
      const status = getRateLimitStatus();

      expect(status.store).toBe("redis");
    });
  });

  describe("Trusted IPs", () => {
    it("should return false when no trusted IPs configured", async () => {
      process.env.TRUSTED_IPS = "";
      jest.resetModules();

      const { isTrustedIP } = await import("../../middlewares/rateLimiter.js");

      expect(isTrustedIP("192.168.1.1")).toBe(false);
      expect(isTrustedIP("10.0.0.1")).toBe(false);
    });

    it("should match exact IP addresses", async () => {
      process.env.TRUSTED_IPS = "192.168.1.1,10.0.0.1";
      jest.resetModules();

      const { isTrustedIP } = await import("../../middlewares/rateLimiter.js");

      expect(isTrustedIP("192.168.1.1")).toBe(true);
      expect(isTrustedIP("10.0.0.1")).toBe(true);
      expect(isTrustedIP("192.168.1.2")).toBe(false);
    });

    it("should handle IPv6-mapped IPv4 addresses", async () => {
      process.env.TRUSTED_IPS = "192.168.1.1";
      jest.resetModules();

      const { isTrustedIP } = await import("../../middlewares/rateLimiter.js");

      expect(isTrustedIP("::ffff:192.168.1.1")).toBe(true);
      expect(isTrustedIP("::ffff:192.168.1.2")).toBe(false);
    });

    it("should match CIDR ranges", async () => {
      process.env.TRUSTED_IPS = "192.168.1.0/24,10.0.0.0/8";
      jest.resetModules();

      const { isTrustedIP } = await import("../../middlewares/rateLimiter.js");

      // 192.168.1.0/24 range
      expect(isTrustedIP("192.168.1.1")).toBe(true);
      expect(isTrustedIP("192.168.1.255")).toBe(true);
      expect(isTrustedIP("192.168.2.1")).toBe(false);

      // 10.0.0.0/8 range
      expect(isTrustedIP("10.0.0.1")).toBe(true);
      expect(isTrustedIP("10.255.255.255")).toBe(true);
      expect(isTrustedIP("11.0.0.1")).toBe(false);
    });

    it("should handle whitespace in trusted IPs list", async () => {
      process.env.TRUSTED_IPS = " 192.168.1.1 , 10.0.0.1 ";
      jest.resetModules();

      const { isTrustedIP } = await import("../../middlewares/rateLimiter.js");

      expect(isTrustedIP("192.168.1.1")).toBe(true);
      expect(isTrustedIP("10.0.0.1")).toBe(true);
    });
  });

  describe("Client IP Extraction", () => {
    it("should extract IP from x-forwarded-for header", async () => {
      const { getClientIP } = await import("../../middlewares/rateLimiter.js");

      const req = {
        headers: {
          "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178",
        },
        connection: { remoteAddress: "127.0.0.1" },
      };

      expect(getClientIP(req)).toBe("203.0.113.195");
    });

    it("should extract IP from x-real-ip header", async () => {
      const { getClientIP } = await import("../../middlewares/rateLimiter.js");

      const req = {
        headers: {
          "x-real-ip": "203.0.113.195",
        },
        connection: { remoteAddress: "127.0.0.1" },
      };

      expect(getClientIP(req)).toBe("203.0.113.195");
    });

    it("should fall back to connection remote address", async () => {
      const { getClientIP } = await import("../../middlewares/rateLimiter.js");

      const req = {
        headers: {},
        connection: { remoteAddress: "192.168.1.100" },
      };

      expect(getClientIP(req)).toBe("192.168.1.100");
    });

    it("should fall back to socket remote address", async () => {
      const { getClientIP } = await import("../../middlewares/rateLimiter.js");

      const req = {
        headers: {},
        connection: {},
        socket: { remoteAddress: "192.168.1.100" },
      };

      expect(getClientIP(req)).toBe("192.168.1.100");
    });

    it("should fall back to req.ip", async () => {
      const { getClientIP } = await import("../../middlewares/rateLimiter.js");

      const req = {
        headers: {},
        connection: {},
        socket: {},
        ip: "192.168.1.100",
      };

      expect(getClientIP(req)).toBe("192.168.1.100");
    });
  });

  describe("Custom Rate Limiter", () => {
    it("should create custom limiter with specified options", async () => {
      const { createCustomLimiter } = await import(
        "../../middlewares/rateLimiter.js"
      );

      const customLimiter = createCustomLimiter({
        windowMinutes: 5,
        maxRequests: 10,
        message: "Custom rate limit exceeded",
        errorCode: "CUSTOM_RATE_LIMIT",
      });

      expect(customLimiter).toBeDefined();
      expect(typeof customLimiter).toBe("function");
    });

    it("should use default values when options not provided", async () => {
      const { createCustomLimiter } = await import(
        "../../middlewares/rateLimiter.js"
      );

      const customLimiter = createCustomLimiter({});

      expect(customLimiter).toBeDefined();
      expect(typeof customLimiter).toBe("function");
    });
  });

  describe("Rate Limiter Middleware Functions", () => {
    it("authLimiter should be a valid middleware function", async () => {
      const { authLimiter } = await import("../../middlewares/rateLimiter.js");

      expect(typeof authLimiter).toBe("function");
      expect(authLimiter.length).toBe(3); // Express middleware signature (req, res, next)
    });

    it("apiLimiter should be a valid middleware function", async () => {
      const { apiLimiter } = await import("../../middlewares/rateLimiter.js");

      expect(typeof apiLimiter).toBe("function");
      expect(apiLimiter.length).toBe(3);
    });

    it("strictLimiter should be a valid middleware function", async () => {
      const { strictLimiter } = await import(
        "../../middlewares/rateLimiter.js"
      );

      expect(typeof strictLimiter).toBe("function");
      expect(strictLimiter.length).toBe(3);
    });

    it("createLimiter should be a valid middleware function", async () => {
      const { createLimiter } = await import(
        "../../middlewares/rateLimiter.js"
      );

      expect(typeof createLimiter).toBe("function");
      expect(createLimiter.length).toBe(3);
    });

    it("updateLimiter should be a valid middleware function", async () => {
      const { updateLimiter } = await import(
        "../../middlewares/rateLimiter.js"
      );

      expect(typeof updateLimiter).toBe("function");
      expect(updateLimiter.length).toBe(3);
    });

    it("deleteLimiter should be a valid middleware function", async () => {
      const { deleteLimiter } = await import(
        "../../middlewares/rateLimiter.js"
      );

      expect(typeof deleteLimiter).toBe("function");
      expect(deleteLimiter.length).toBe(3);
    });
  });

  describe("Default Export", () => {
    it("should export authLimiter as default for backward compatibility", async () => {
      const rateLimiter = await import("../../middlewares/rateLimiter.js");

      expect(rateLimiter.default).toBe(rateLimiter.authLimiter);
    });
  });
});
