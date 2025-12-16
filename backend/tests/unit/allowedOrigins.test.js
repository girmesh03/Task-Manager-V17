import { jest } from "@jest/globals";

describe("allowedOrigins", () => {
  const originalEnv = process.env;
  let allowedOriginsModule;

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // Ensure CLIENT_URL is set for the test
    process.env.CLIENT_URL = "http://localhost:3000";

    // Dynamic import to ensure env vars are picked up
    // We import the module purely for this test instance
    allowedOriginsModule = await import("../../config/allowedOrigins.js");
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should always include CLIENT_URL", () => {
     // Check if the default export (array) includes the client URL
     expect(allowedOriginsModule.default).toContain("http://localhost:3000");
  });

  it("isOriginAllowed should return true for allowed origins", () => {
      expect(allowedOriginsModule.isOriginAllowed("http://localhost:3000")).toBe(true);
  });

  it("isOriginAllowed should return true for no origin (server-to-server)", () => {
      expect(allowedOriginsModule.isOriginAllowed(null)).toBe(true);
      expect(allowedOriginsModule.isOriginAllowed(undefined)).toBe(true);
  });
});
