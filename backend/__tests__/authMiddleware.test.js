/**
 * Unit Tests for Authentication Middleware
 */

import { authenticate, optionalAuthenticate } from "../middlewares/authMiddleware.js";
import { generateAccessToken } from "../utils/generateTokens.js";
import CustomError from "../errorHandler/CustomError.js";

// Mock user data
const mockUser = {
  _id: "507f1f77bcf86cd799439011",
  email: "test@example.com",
  role: "Admin",
  organization: "507f1f77bcf86cd799439012",
  department: "507f1f77bcf86cd799439013",
  isPlatformUser: false,
};

describe("Authentication Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      cookies: {},
    };
    res = {};
    next = jest.fn();
  });

  describe("authenticate", () => {
    it("should authenticate with valid access token", async () => {
      const token = generateAccessToken(mockUser);
      req.cookies.accessToken = token;

      await authenticate(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(mockUser._id);
      expect(req.user.email).toBe(mockUser.email);
      expect(req.user.role).toBe(mockUser.role);
      expect(req.user.organization).toBe(mockUser.organization);
      expect(req.user.department).toBe(mockUser.department);
      expect(next).toHaveBeenCalled();
    });

    it("should throw error when no token provided", async () => {
      await expect(authenticate(req, res, next)).rejects.toThrow(CustomError);
      await expect(authenticate(req, res, next)).rejects.toThrow("No access token provided");
    });

    it("should throw error for invalid token", async () => {
      req.cookies.accessToken = "invalid-token";

      await expect(authenticate(req, res, next)).rejects.toThrow(CustomError);
      await expect(authenticate(req, res, next)).rejects.toThrow("Invalid access token");
    });

    it("should attach correct user data to req.user", async () => {
      const token = generateAccessToken(mockUser);
      req.cookies.accessToken = token;

      await authenticate(req, res, next);

      // Check all required fields
      expect(req.user).toHaveProperty("userId");
      expect(req.user).toHaveProperty("email");
      expect(req.user).toHaveProperty("role");
      expect(req.user).toHaveProperty("organization");
      expect(req.user).toHaveProperty("department");
      expect(req.user).toHaveProperty("isPlatformUser");
    });
  });

  describe("optionalAuthenticate", () => {
    it("should set req.user to null when no token", async () => {
      await optionalAuthenticate(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });

    it("should authenticate with valid token", async () => {
      const token = generateAccessToken(mockUser);
      req.cookies.accessToken = token;

      await optionalAuthenticate(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(mockUser._id);
      expect(next).toHaveBeenCalled();
    });

    it("should set req.user to null for invalid token (no error thrown)", async () => {
      req.cookies.accessToken = "invalid-token";

      await optionalAuthenticate(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });

    it("should not throw error for expired token", async () => {
      // Simulate expired token
      req.cookies.accessToken = "expired.token.here";

      await expect(optionalAuthenticate(req, res, next)).resolves.not.toThrow();
      expect(req.user).toBeNull();
    });
  });
});
