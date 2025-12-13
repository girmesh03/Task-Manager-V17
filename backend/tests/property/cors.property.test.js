// backend/tests/property/cors.property.test.js
/**
 * Property-Based Tests for CORS Configuration
 * Uses fast-check to verify correctness properties across many random inputs
 *
 * **Feature: production-readiness-validation, Property 22: CORS Credentials Enabled**
 * **Validates: Requirements 4.2**
 */

import { describe, it, expect, beforeAll, afterAll, jest } from "@jest/globals";
import request from "supertest";
import fc from "fast-check";

describe("CORS Configuration - Property-Based Tests", () => {
  let originalEnv;

  beforeAll(async () => {
    originalEnv = { ...process.env };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("Property 22: CORS Credentials Enabled", () => {
    /**
     * **Feature: production-readiness-validation, Property 22: CORS Credentials Enabled**
     * For any CORS preflight response, Access-Control-Allow-Credentials SHALL be true.
     * **Validates: Requirements 4.2**
     */

    // Arbitrary for generating random valid API paths
    const validApiPathArb = fc.constantFrom(
      "/api/auth/login",
      "/api/users",
      "/api/tasks",
      "/api/departments",
      "/api/organizations",
      "/api/materials",
      "/api/vendors",
      "/api/notifications",
      "/api/attachments",
      "/health",
      "/ready",
      "/live"
    );

    // Arbitrary for generating random HTTP methods for preflight
    const httpMethodArb = fc.constantFrom(
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE"
    );

    // Arbitrary for generating allowed origins
    const allowedOriginArb = fc.constantFrom(
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173"
    );

    it("Property 22: Access-Control-Allow-Credentials should be true for all preflight requests from allowed origins", async () => {
      process.env.NODE_ENV = "development";
      process.env.CLIENT_URL = "http://localhost:3000";
      jest.resetModules();

      const appModule = await import("../../app.js");
      const app = appModule.default;

      await fc.assert(
        fc.asyncProperty(
          validApiPathArb,
          httpMethodArb,
          allowedOriginArb,
          async (path, method, origin) => {
            const response = await request(app)
              .options(path)
              .set("Origin", origin)
              .set("Access-Control-Request-Method", method);

            // Access-Control-Allow-Credentials should always be true for allowed origins
            expect(response.headers["access-control-allow-credentials"]).toBe(
              "true"
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("Property 22: Access-Control-Allow-Credentials should be true for actual requests from allowed origins", async () => {
      process.env.NODE_ENV = "development";
      process.env.CLIENT_URL = "http://localhost:3000";
      jest.resetModules();

      const appModule = await import("../../app.js");
      const app = appModule.default;

      // Test with health endpoints that don't require auth
      const healthPathArb = fc.constantFrom("/health", "/ready", "/live");

      await fc.assert(
        fc.asyncProperty(
          healthPathArb,
          allowedOriginArb,
          async (path, origin) => {
            const response = await request(app).get(path).set("Origin", origin);

            // Access-Control-Allow-Credentials should always be true
            expect(response.headers["access-control-allow-credentials"]).toBe(
              "true"
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("Property 22: Access-Control-Allow-Origin should match the request origin for allowed origins", async () => {
      process.env.NODE_ENV = "development";
      process.env.CLIENT_URL = "http://localhost:3000";
      jest.resetModules();

      const appModule = await import("../../app.js");
      const app = appModule.default;

      await fc.assert(
        fc.asyncProperty(
          validApiPathArb,
          httpMethodArb,
          allowedOriginArb,
          async (path, method, origin) => {
            const response = await request(app)
              .options(path)
              .set("Origin", origin)
              .set("Access-Control-Request-Method", method);

            // Access-Control-Allow-Origin should match the request origin
            // (not wildcard, which is incompatible with credentials)
            expect(response.headers["access-control-allow-origin"]).toBe(
              origin
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("Property 22: Access-Control-Allow-Origin should never be wildcard when credentials are enabled", async () => {
      process.env.NODE_ENV = "development";
      process.env.CLIENT_URL = "http://localhost:3000";
      jest.resetModules();

      const appModule = await import("../../app.js");
      const app = appModule.default;

      await fc.assert(
        fc.asyncProperty(
          validApiPathArb,
          httpMethodArb,
          allowedOriginArb,
          async (path, method, origin) => {
            const response = await request(app)
              .options(path)
              .set("Origin", origin)
              .set("Access-Control-Request-Method", method);

            // When credentials are enabled, origin cannot be wildcard
            expect(response.headers["access-control-allow-origin"]).not.toBe(
              "*"
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 22: Preflight Caching", () => {
    /**
     * Tests for preflight caching configuration
     * Requirement 4.3: Configure preflight caching (maxAge: 86400)
     */

    const validApiPathArb = fc.constantFrom(
      "/api/auth/login",
      "/api/users",
      "/api/tasks",
      "/health"
    );

    const httpMethodArb = fc.constantFrom("POST", "PUT", "PATCH", "DELETE");

    it("Property 22: Access-Control-Max-Age should be 86400 (24 hours) for all preflight requests", async () => {
      process.env.NODE_ENV = "development";
      process.env.CLIENT_URL = "http://localhost:3000";
      jest.resetModules();

      const appModule = await import("../../app.js");
      const app = appModule.default;

      await fc.assert(
        fc.asyncProperty(
          validApiPathArb,
          httpMethodArb,
          async (path, method) => {
            const response = await request(app)
              .options(path)
              .set("Origin", "http://localhost:3000")
              .set("Access-Control-Request-Method", method);

            // Access-Control-Max-Age should be 86400 seconds (24 hours)
            expect(response.headers["access-control-max-age"]).toBe("86400");
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 22: Disallowed Origins", () => {
    /**
     * Tests that disallowed origins are properly rejected
     * Requirement 4.8: Verify no wildcard origins in production
     */

    // Arbitrary for generating disallowed origins
    const disallowedOriginArb = fc.constantFrom(
      "http://malicious-site.com",
      "http://evil.example.com",
      "http://localhost:9999",
      "http://attacker.io",
      "https://phishing.net"
    );

    const validApiPathArb = fc.constantFrom(
      "/api/auth/login",
      "/api/users",
      "/health"
    );

    it("Property 22: Disallowed origins should not receive Access-Control-Allow-Origin header", async () => {
      process.env.NODE_ENV = "development";
      process.env.CLIENT_URL = "http://localhost:3000";
      jest.resetModules();

      const appModule = await import("../../app.js");
      const app = appModule.default;

      await fc.assert(
        fc.asyncProperty(
          validApiPathArb,
          disallowedOriginArb,
          async (path, origin) => {
            const response = await request(app)
              .options(path)
              .set("Origin", origin)
              .set("Access-Control-Request-Method", "GET");

            // Disallowed origins should not receive CORS headers
            expect(
              response.headers["access-control-allow-origin"]
            ).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("Property 22: Disallowed origins should not receive Access-Control-Allow-Credentials header", async () => {
      process.env.NODE_ENV = "development";
      process.env.CLIENT_URL = "http://localhost:3000";
      jest.resetModules();

      const appModule = await import("../../app.js");
      const app = appModule.default;

      await fc.assert(
        fc.asyncProperty(
          validApiPathArb,
          disallowedOriginArb,
          async (path, origin) => {
            const response = await request(app)
              .options(path)
              .set("Origin", origin)
              .set("Access-Control-Request-Method", "GET");

            // Disallowed origins should not receive credentials header
            expect(
              response.headers["access-control-allow-credentials"]
            ).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 22: Production Mode", () => {
    /**
     * Tests for production-specific CORS behavior
     * Requirement 4.8: Verify no wildcard origins in production
     */

    it("Property 22: Production mode should only allow CLIENT_URL origin", async () => {
      process.env.NODE_ENV = "production";
      process.env.CLIENT_URL = "https://myapp.example.com";
      jest.resetModules();

      const appModule = await import("../../app.js");
      const app = appModule.default;

      // Test that CLIENT_URL is allowed
      const response = await request(app)
        .options("/health")
        .set("Origin", "https://myapp.example.com")
        .set("Access-Control-Request-Method", "GET");

      expect(response.headers["access-control-allow-origin"]).toBe(
        "https://myapp.example.com"
      );
      expect(response.headers["access-control-allow-credentials"]).toBe("true");
    });

    it("Property 22: Production mode should reject development origins", async () => {
      process.env.NODE_ENV = "production";
      process.env.CLIENT_URL = "https://myapp.example.com";
      jest.resetModules();

      const appModule = await import("../../app.js");
      const app = appModule.default;

      const devOriginArb = fc.constantFrom(
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000"
      );

      await fc.assert(
        fc.asyncProperty(devOriginArb, async (origin) => {
          const response = await request(app)
            .options("/health")
            .set("Origin", origin)
            .set("Access-Control-Request-Method", "GET");

          // Development origins should be rejected in production
          expect(
            response.headers["access-control-allow-origin"]
          ).toBeUndefined();
        }),
        { numRuns: 50 }
      );
    });
  });
});
