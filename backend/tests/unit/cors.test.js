// backend/tests/unit/cors.test.js
import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import request from "supertest";

/**
 * Unit Tests for CORS Configuration
 *
 * Tests the CORS configuration including:
 * - Origin validation
 * - Credentials support
 * - Preflight caching
 * - Allowed methods and headers
 * - Environment-specific behavior
 * - Wildcard rejection
 *
 * Requirements: 4.1-4.10, 19, 160, 191-200
 */

describe("CORS Configuration", () => {
  let app;
  let originalEnv;

  beforeEach(async () => {
    // Save original environment
    originalEnv = { ...process.env };

    // Reset modules to ensure clean state
    jest.resetModules();

    // Set test environment
    process.env.NODE_ENV = "test";
    process.env.CLIENT_URL = "http://localhost:3000";

    // Import app fresh for each test
    const appModule = await import("../../app.js");
    app = appModule.default;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe("Origin Validation", () => {
    /**
     * Requirement 4.1: CORS configuration must align with allowedOrigins.js
     * Requirement 191: Verify origins match production frontend URLs
     */

    it("should allow requests from CLIENT_URL origin", async () => {
      const response = await request(app)
        .options("/api/test")
        .set("Origin", "http://localhost:3000")
        .set("Access-Control-Request-Method", "GET");

      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://localhost:3000"
      );
    });

    it("should allow requests from Vite development server in development mode", async () => {
      // Reset modules and set development environment
      jest.resetModules();
      process.env.NODE_ENV = "development";
      delete process.env.CLIENT_URL;

      const appModule = await import("../../app.js");
      const devApp = appModule.default;

      const response = await request(devApp)
        .options("/api/test")
        .set("Origin", "http://localhost:5173")
        .set("Access-Control-Request-Method", "GET");

      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://localhost:5173"
      );
    });

    it("should allow requests with no origin (same-origin/server-to-server)", async () => {
      const response = await request(app).get("/health").expect(200);

      // Request without Origin header should succeed
      expect(response.body.success).toBe(true);
    });

    it("should reject requests from unauthorized origins", async () => {
      const response = await request(app)
        .options("/api/test")
        .set("Origin", "http://malicious-site.com")
        .set("Access-Control-Request-Method", "GET");

      // Should not have Access-Control-Allow-Origin for unauthorized origin
      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    });

    it("should reject requests from unauthorized localhost ports", async () => {
      const response = await request(app)
        .options("/api/test")
        .set("Origin", "http://localhost:9999")
        .set("Access-Control-Request-Method", "GET");

      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    });
  });

  describe("Credentials Support", () => {
    /**
     * Requirement 4.2: Enable credentials for cookie-based auth
     * Requirement 192: Check credentials are enabled for cookie-based auth
     */

    it("should enable credentials for cookie-based authentication", async () => {
      const response = await request(app)
        .options("/api/test")
        .set("Origin", "http://localhost:3000")
        .set("Access-Control-Request-Method", "GET");

      expect(response.headers["access-control-allow-credentials"]).toBe("true");
    });

    it("should allow cookies to be sent with requests", async () => {
      const response = await request(app)
        .get("/health")
        .set("Origin", "http://localhost:3000")
        .set("Cookie", "accessToken=test-token");

      expect(response.status).toBe(200);
      expect(response.headers["access-control-allow-credentials"]).toBe("true");
    });
  });

  describe("Preflight Caching", () => {
    /**
     * Requirement 4.3: Validate preflight caching is appropriate
     * Requirement 193: Validate preflight caching is appropriate
     */

    it("should set Access-Control-Max-Age header for preflight caching", async () => {
      const response = await request(app)
        .options("/api/test")
        .set("Origin", "http://localhost:3000")
        .set("Access-Control-Request-Method", "POST");

      expect(response.headers["access-control-max-age"]).toBeDefined();
      // Should be 24 hours (86400 seconds)
      expect(parseInt(response.headers["access-control-max-age"])).toBe(86400);
    });

    it("should return 200 for OPTIONS preflight requests", async () => {
      const response = await request(app)
        .options("/api/test")
        .set("Origin", "http://localhost:3000")
        .set("Access-Control-Request-Method", "POST");

      expect(response.status).toBe(200);
    });
  });

  describe("Allowed Methods", () => {
    /**
     * Requirement: CORS must allow all RESTful API methods
     */

    it("should allow GET method", async () => {
      const response = await request(app)
        .options("/api/test")
        .set("Origin", "http://localhost:3000")
        .set("Access-Control-Request-Method", "GET");

      expect(response.headers["access-control-allow-methods"]).toMatch(/GET/);
    });

    it("should allow POST method", async () => {
      const response = await request(app)
        .options("/api/test")
        .set("Origin", "http://localhost:3000")
        .set("Access-Control-Request-Method", "POST");

      expect(response.headers["access-control-allow-methods"]).toMatch(/POST/);
    });

    it("should allow PUT method", async () => {
      const response = await request(app)
        .options("/api/test")
        .set("Origin", "http://localhost:3000")
        .set("Access-Control-Request-Method", "PUT");

      expect(response.headers["access-control-allow-methods"]).toMatch(/PUT/);
    });

    it("should allow PATCH method", async () => {
      const response = await request(app)
        .options("/api/test")
        .set("Origin", "http://localhost:3000")
        .set("Access-Control-Request-Method", "PATCH");

      expect(response.headers["access-control-allow-methods"]).toMatch(/PATCH/);
    });

    it("should allow DELETE method", async () => {
      const response = await request(app)
        .options("/api/test")
        .set("Origin", "http://localhost:3000")
        .set("Access-Control-Request-Method", "DELETE");

      expect(response.headers["access-control-allow-methods"]).toMatch(
        /DELETE/
      );
    });

    it("should allow OPTIONS method", async () => {
      const response = await request(app)
        .options("/api/test")
        .set("Origin", "http://localhost:3000")
        .set("Access-Control-Request-Method", "OPTIONS");

      expect(response.headers["access-control-allow-methods"]).toMatch(
        /OPTIONS/
      );
    });
  });

  describe("Allowed Headers", () => {
    /**
     * Requirement: CORS must allow Content-Type and Authorization headers
     */

    it("should allow Content-Type header", async () => {
      const response = await request(app)
        .options("/api/test")
        .set("Origin", "http://localhost:3000")
        .set("Access-Control-Request-Method", "POST")
        .set("Access-Control-Request-Headers", "Content-Type");

      expect(response.headers["access-control-allow-headers"]).toMatch(
        /content-type/i
      );
    });

    it("should allow Authorization header", async () => {
      const response = await request(app)
        .options("/api/test")
        .set("Origin", "http://localhost:3000")
        .set("Access-Control-Request-Method", "GET")
        .set("Access-Control-Request-Headers", "Authorization");

      expect(response.headers["access-control-allow-headers"]).toMatch(
        /authorization/i
      );
    });

    it("should allow X-Request-ID header", async () => {
      const response = await request(app)
        .options("/api/test")
        .set("Origin", "http://localhost:3000")
        .set("Access-Control-Request-Method", "GET")
        .set("Access-Control-Request-Headers", "X-Request-ID");

      expect(response.headers["access-control-allow-headers"]).toMatch(
        /x-request-id/i
      );
    });
  });

  describe("Exposed Headers", () => {
    /**
     * Test that response headers are exposed to JavaScript
     */

    it("should expose X-Request-ID header", async () => {
      const response = await request(app)
        .get("/health")
        .set("Origin", "http://localhost:3000");

      expect(response.headers["access-control-expose-headers"]).toMatch(
        /x-request-id/i
      );
    });
  });
});

describe("allowedOrigins.js", () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Environment-Specific Origins", () => {
    /**
     * Requirement 4.4: Add environment-specific origin lists
     * Requirement 194: Add environment-specific origin lists
     * Requirement 197: Confirm all production/staging/dev origins are listed
     */

    it("should include development origins in development mode", async () => {
      process.env.NODE_ENV = "development";
      delete process.env.CLIENT_URL;
      delete process.env.ALLOWED_ORIGINS;

      const { default: allowedOrigins } = await import(
        "../../config/allowedOrigins.js"
      );

      expect(allowedOrigins).toContain("http://localhost:3000");
      expect(allowedOrigins).toContain("http://localhost:5173");
    });

    it("should include CLIENT_URL when set", async () => {
      process.env.NODE_ENV = "development";
      process.env.CLIENT_URL = "https://myapp.example.com";

      const { default: allowedOrigins } = await import(
        "../../config/allowedOrigins.js"
      );

      expect(allowedOrigins).toContain("https://myapp.example.com");
    });

    it("should parse ALLOWED_ORIGINS environment variable", async () => {
      process.env.NODE_ENV = "development";
      process.env.ALLOWED_ORIGINS =
        "https://app1.example.com,https://app2.example.com";

      const { default: allowedOrigins } = await import(
        "../../config/allowedOrigins.js"
      );

      expect(allowedOrigins).toContain("https://app1.example.com");
      expect(allowedOrigins).toContain("https://app2.example.com");
    });

    it("should remove trailing slashes from origins", async () => {
      process.env.NODE_ENV = "development";
      process.env.CLIENT_URL = "https://myapp.example.com/";

      const { default: allowedOrigins } = await import(
        "../../config/allowedOrigins.js"
      );

      expect(allowedOrigins).toContain("https://myapp.example.com");
      expect(allowedOrigins).not.toContain("https://myapp.example.com/");
    });

    it("should remove duplicate origins", async () => {
      process.env.NODE_ENV = "development";
      process.env.CLIENT_URL = "http://localhost:3000";
      process.env.ALLOWED_ORIGINS =
        "http://localhost:3000,http://localhost:3000";

      const { default: allowedOrigins } = await import(
        "../../config/allowedOrigins.js"
      );

      const count = allowedOrigins.filter(
        (o) => o === "http://localhost:3000"
      ).length;
      expect(count).toBe(1);
    });
  });

  describe("Wildcard Rejection", () => {
    /**
     * Requirement 4.8: Verify no wildcard origins in production
     * Requirement 198: Verify no wildcard origins in production
     */

    it("should reject wildcard (*) origins", async () => {
      process.env.NODE_ENV = "production";
      process.env.ALLOWED_ORIGINS = "*,https://valid.example.com";

      const { default: allowedOrigins } = await import(
        "../../config/allowedOrigins.js"
      );

      expect(allowedOrigins).not.toContain("*");
      expect(allowedOrigins).toContain("https://valid.example.com");
    });

    it("should reject origins containing wildcards", async () => {
      process.env.NODE_ENV = "production";
      process.env.ALLOWED_ORIGINS = "https://*.example.com";

      const { default: allowedOrigins } = await import(
        "../../config/allowedOrigins.js"
      );

      expect(allowedOrigins).not.toContain("https://*.example.com");
    });
  });

  describe("Helper Functions", () => {
    it("isOriginAllowed should return true for allowed origins", async () => {
      process.env.NODE_ENV = "development";
      process.env.CLIENT_URL = "http://localhost:3000";

      const { isOriginAllowed } = await import(
        "../../config/allowedOrigins.js"
      );

      expect(isOriginAllowed("http://localhost:3000")).toBe(true);
    });

    it("isOriginAllowed should return false for disallowed origins", async () => {
      process.env.NODE_ENV = "development";
      process.env.CLIENT_URL = "http://localhost:3000";

      const { isOriginAllowed } = await import(
        "../../config/allowedOrigins.js"
      );

      expect(isOriginAllowed("http://malicious.com")).toBe(false);
    });

    it("isOriginAllowed should return true for null/undefined origin", async () => {
      process.env.NODE_ENV = "development";

      const { isOriginAllowed } = await import(
        "../../config/allowedOrigins.js"
      );

      expect(isOriginAllowed(null)).toBe(true);
      expect(isOriginAllowed(undefined)).toBe(true);
    });

    it("getAllowedOrigins should return a copy of origins array", async () => {
      process.env.NODE_ENV = "development";

      const { getAllowedOrigins, default: allowedOrigins } = await import(
        "../../config/allowedOrigins.js"
      );

      const copy = getAllowedOrigins();
      expect(copy).toEqual(allowedOrigins);
      expect(copy).not.toBe(allowedOrigins); // Should be a copy, not the same reference
    });
  });
});

describe("corsOptions.js", () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("validateCorsConfig", () => {
    /**
     * Requirement 4.5: Implement origin validation logging
     * Requirement 195: Implement origin validation logging
     */

    it("should return true when CLIENT_URL is configured", async () => {
      process.env.NODE_ENV = "development";
      process.env.CLIENT_URL = "http://localhost:3000";

      const { validateCorsConfig } = await import(
        "../../config/corsOptions.js"
      );

      expect(validateCorsConfig()).toBe(true);
    });

    it("should return false when no origins are configured in production", async () => {
      process.env.NODE_ENV = "production";
      delete process.env.CLIENT_URL;
      delete process.env.ALLOWED_ORIGINS;

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const { validateCorsConfig } = await import(
        "../../config/corsOptions.js"
      );

      expect(validateCorsConfig()).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe("getSocketCorsOptions", () => {
    it("should return CORS options for Socket.IO", async () => {
      process.env.NODE_ENV = "development";
      process.env.CLIENT_URL = "http://localhost:3000";

      const { getSocketCorsOptions } = await import(
        "../../config/corsOptions.js"
      );

      const socketOptions = getSocketCorsOptions();

      expect(socketOptions).toHaveProperty("origin");
      expect(socketOptions).toHaveProperty("credentials", true);
      expect(socketOptions).toHaveProperty("methods");
      expect(socketOptions.methods).toContain("GET");
      expect(socketOptions.methods).toContain("POST");
    });
  });
});
