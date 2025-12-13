// backend/tests/property/securityHeaders.property.test.js
/**
 * Property-Based Tests for Security Headers (Helmet Configuration)
 * Uses fast-check to verify correctness properties across many random inputs
 *
 * **Feature: production-readiness-validation, Property 21: Security Headers Present**
 * **Validates: Requirements 3.1, 3.2**
 */

import { describe, it, expect, beforeAll, afterAll, jest } from "@jest/globals";
import request from "supertest";
import fc from "fast-check";

describe("Security Headers - Property-Based Tests", () => {
  let originalNodeEnv;

  beforeAll(async () => {
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe("Property 21: Security Headers Present", () => {
    /**
     * **Feature: production-readiness-validation, Property 21: Security Headers Present**
     * For any HTTP response, Helmet security headers (CSP, X-Frame-Options, X-Content-Type-Options)
     * SHALL be present.
     * **Validates: Requirements 3.1, 3.2**
     */

    // Arbitrary for generating random valid HTTP paths
    const validPathArb = fc.constantFrom("/health", "/ready", "/live");

    // Arbitrary for generating random HTTP methods
    const httpMethodArb = fc.constantFrom("GET", "HEAD", "OPTIONS");

    it("Property 21: X-Content-Type-Options header should always be present and set to nosniff", async () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const appModule = await import("../../app.js");
      const app = appModule.default;

      await fc.assert(
        fc.asyncProperty(validPathArb, async (path) => {
          const response = await request(app).get(path);

          // X-Content-Type-Options should always be present
          expect(response.headers).toHaveProperty("x-content-type-options");
          expect(response.headers["x-content-type-options"]).toBe("nosniff");
        }),
        { numRuns: 100 }
      );
    });

    it("Property 21: X-Frame-Options header should always be present and set to DENY", async () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const appModule = await import("../../app.js");
      const app = appModule.default;

      await fc.assert(
        fc.asyncProperty(validPathArb, async (path) => {
          const response = await request(app).get(path);

          // X-Frame-Options should always be present
          expect(response.headers).toHaveProperty("x-frame-options");
          expect(response.headers["x-frame-options"]).toBe("DENY");
        }),
        { numRuns: 100 }
      );
    });

    it("Property 21: X-XSS-Protection header should always be present", async () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const appModule = await import("../../app.js");
      const app = appModule.default;

      await fc.assert(
        fc.asyncProperty(validPathArb, async (path) => {
          const response = await request(app).get(path);

          // X-XSS-Protection should always be present
          expect(response.headers).toHaveProperty("x-xss-protection");
        }),
        { numRuns: 100 }
      );
    });

    it("Property 21: X-DNS-Prefetch-Control header should always be present and set to off", async () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const appModule = await import("../../app.js");
      const app = appModule.default;

      await fc.assert(
        fc.asyncProperty(validPathArb, async (path) => {
          const response = await request(app).get(path);

          // X-DNS-Prefetch-Control should always be present
          expect(response.headers).toHaveProperty("x-dns-prefetch-control");
          expect(response.headers["x-dns-prefetch-control"]).toBe("off");
        }),
        { numRuns: 100 }
      );
    });

    it("Property 21: X-Download-Options header should always be present and set to noopen", async () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const appModule = await import("../../app.js");
      const app = appModule.default;

      await fc.assert(
        fc.asyncProperty(validPathArb, async (path) => {
          const response = await request(app).get(path);

          // X-Download-Options should always be present
          expect(response.headers).toHaveProperty("x-download-options");
          expect(response.headers["x-download-options"]).toBe("noopen");
        }),
        { numRuns: 100 }
      );
    });

    it("Property 21: X-Permitted-Cross-Domain-Policies header should always be present and set to none", async () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const appModule = await import("../../app.js");
      const app = appModule.default;

      await fc.assert(
        fc.asyncProperty(validPathArb, async (path) => {
          const response = await request(app).get(path);

          // X-Permitted-Cross-Domain-Policies should always be present
          expect(response.headers).toHaveProperty(
            "x-permitted-cross-domain-policies"
          );
          expect(response.headers["x-permitted-cross-domain-policies"]).toBe(
            "none"
          );
        }),
        { numRuns: 100 }
      );
    });

    it("Property 21: Referrer-Policy header should always be present", async () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const appModule = await import("../../app.js");
      const app = appModule.default;

      await fc.assert(
        fc.asyncProperty(validPathArb, async (path) => {
          const response = await request(app).get(path);

          // Referrer-Policy should always be present
          expect(response.headers).toHaveProperty("referrer-policy");
          expect(response.headers["referrer-policy"]).toBe(
            "strict-origin-when-cross-origin"
          );
        }),
        { numRuns: 100 }
      );
    });

    it("Property 21: X-Powered-By header should never be present", async () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const appModule = await import("../../app.js");
      const app = appModule.default;

      await fc.assert(
        fc.asyncProperty(validPathArb, async (path) => {
          const response = await request(app).get(path);

          // X-Powered-By should be hidden for security
          expect(response.headers).not.toHaveProperty("x-powered-by");
        }),
        { numRuns: 100 }
      );
    });

    it("Property 21: All core security headers should be present for any valid endpoint", async () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const appModule = await import("../../app.js");
      const app = appModule.default;

      // Required security headers that must always be present
      const requiredHeaders = [
        "x-content-type-options",
        "x-frame-options",
        "x-xss-protection",
        "x-dns-prefetch-control",
        "x-download-options",
        "x-permitted-cross-domain-policies",
        "referrer-policy",
      ];

      await fc.assert(
        fc.asyncProperty(validPathArb, httpMethodArb, async (path, method) => {
          let response;
          switch (method) {
            case "GET":
              response = await request(app).get(path);
              break;
            case "HEAD":
              response = await request(app).head(path);
              break;
            case "OPTIONS":
              response = await request(app).options(path);
              break;
            default:
              response = await request(app).get(path);
          }

          // All required headers should be present
          for (const header of requiredHeaders) {
            expect(response.headers).toHaveProperty(header);
          }

          // X-Powered-By should NOT be present
          expect(response.headers).not.toHaveProperty("x-powered-by");
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 21: Production-Specific Security Headers", () => {
    /**
     * Tests for production-specific security headers (CSP, HSTS)
     * These are only enabled in production mode
     */

    it("Property 21: CSP header should include Cloudinary CDN in production", async () => {
      process.env.NODE_ENV = "production";

      // Clear require cache and reimport
      jest.resetModules();
      const appModule = await import("../../app.js");
      const prodApp = appModule.default;

      const validPathArb = fc.constantFrom("/health", "/ready", "/live");

      await fc.assert(
        fc.asyncProperty(validPathArb, async (path) => {
          const response = await request(prodApp).get(path);

          const csp = response.headers["content-security-policy"];
          expect(csp).toBeDefined();

          // CSP should include Cloudinary CDN for images
          expect(csp).toMatch(/img-src[^;]*res\.cloudinary\.com/i);

          // CSP should include Cloudinary API for uploads
          expect(csp).toMatch(/connect-src[^;]*api\.cloudinary\.com/i);

          // CSP should include Cloudinary CDN in connect-src
          expect(csp).toMatch(/connect-src[^;]*res\.cloudinary\.com/i);

          // CSP should include WebSocket for Socket.IO
          expect(csp).toMatch(/connect-src[^;]*wss:/i);

          // CSP should include Cloudinary for media
          expect(csp).toMatch(/media-src[^;]*res\.cloudinary\.com/i);
        }),
        { numRuns: 50 }
      );
    });

    it("Property 21: HSTS header should be present with correct maxAge in production", async () => {
      process.env.NODE_ENV = "production";

      jest.resetModules();
      const appModule = await import("../../app.js");
      const prodApp = appModule.default;

      const validPathArb = fc.constantFrom("/health", "/ready", "/live");

      await fc.assert(
        fc.asyncProperty(validPathArb, async (path) => {
          const response = await request(prodApp).get(path);

          // HSTS header should be present in production
          expect(response.headers).toHaveProperty("strict-transport-security");

          const hsts = response.headers["strict-transport-security"];

          // HSTS should have maxAge of 31536000 (1 year)
          expect(hsts).toMatch(/max-age=31536000/);

          // HSTS should include subdomains
          expect(hsts).toMatch(/includeSubDomains/i);

          // HSTS should have preload directive
          expect(hsts).toMatch(/preload/i);
        }),
        { numRuns: 50 }
      );
    });

    it("Property 21: CSP and HSTS should NOT be present in development mode", async () => {
      process.env.NODE_ENV = "development";

      jest.resetModules();
      const appModule = await import("../../app.js");
      const devApp = appModule.default;

      const validPathArb = fc.constantFrom("/health", "/ready", "/live");

      await fc.assert(
        fc.asyncProperty(validPathArb, async (path) => {
          const response = await request(devApp).get(path);

          // CSP should be disabled in development for easier debugging
          expect(response.headers["content-security-policy"]).toBeUndefined();

          // HSTS should be disabled in development
          expect(response.headers["strict-transport-security"]).toBeUndefined();
        }),
        { numRuns: 50 }
      );
    });
  });
});
