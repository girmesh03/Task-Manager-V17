/**
 * Unit Tests for JWT Token Generation
 */

import {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
} from "../utils/generateTokens.js";

// Mock user data
const mockUser = {
  _id: "507f1f77bcf86cd799439011",
  email: "test@example.com",
  role: "Admin",
  organization: "507f1f77bcf86cd799439012",
  department: "507f1f77bcf86cd799439013",
  isPlatformUser: false,
};

describe("JWT Token Generation", () => {
  describe("generateAccessToken", () => {
    it("should generate a valid access token", () => {
      const token = generateAccessToken(mockUser);
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
    });

    it("should include user data in token payload", () => {
      const token = generateAccessToken(mockUser);
      const decoded = decodeToken(token);

      expect(decoded.userId).toBe(mockUser._id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role);
      expect(decoded.organization).toBe(mockUser.organization); // No Id suffix
      expect(decoded.department).toBe(mockUser.department);     // No Id suffix
      expect(decoded.isPlatformUser).toBe(mockUser.isPlatformUser);
    });

    it("should have expiration time", () => {
      const token = generateAccessToken(mockUser);
      const decoded = decodeToken(token);
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });
  });

  describe("generateRefreshToken", () => {
    it("should generate a valid refresh token", () => {
      const token = generateRefreshToken(mockUser);
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
    });

    it("should include minimal user data in token payload", () => {
      const token = generateRefreshToken(mockUser);
      const decoded = decodeToken(token);

      expect(decoded.userId).toBe(mockUser._id);
      expect(decoded.email).toBe(mockUser.email);
      // Refresh token should not have role/org/dept
      expect(decoded.role).toBeUndefined();
    });
  });

  describe("generateTokens", () => {
    it("should generate both access and refresh tokens", () => {
      const tokens = generateTokens(mockUser);
      expect(tokens).toHaveProperty("accessToken");
      expect(tokens).toHaveProperty("refreshToken");
      expect(typeof tokens.accessToken).toBe("string");
      expect(typeof tokens.refreshToken).toBe("string");
    });
  });

  describe("verifyAccessToken", () => {
    it("should verify a valid access token", () => {
      const token = generateAccessToken(mockUser);
      const decoded = verifyAccessToken(token);

      expect(decoded.userId).toBe(mockUser._id);
      expect(decoded.email).toBe(mockUser.email);
    });

    it("should throw error for invalid token", () => {
      expect(() => verifyAccessToken("invalid-token")).toThrow();
    });
  });

  describe("verifyRefreshToken", () => {
    it("should verify a valid refresh token", () => {
      const token = generateRefreshToken(mockUser);
      const decoded = verifyRefreshToken(token);

      expect(decoded.userId).toBe(mockUser._id);
      expect(decoded.email).toBe(mockUser.email);
    });

    it("should throw error for invalid token", () => {
      expect(() => verifyRefreshToken("invalid-token")).toThrow();
    });
  });

  describe("Token Separation", () => {
    it("access token should not verify with refresh secret", () => {
      const accessToken = generateAccessToken(mockUser);
      expect(() => verifyRefreshToken(accessToken)).toThrow();
    });

    it("refresh token should not verify with access secret", () => {
      const refreshToken = generateRefreshToken(mockUser);
      expect(() => verifyAccessToken(refreshToken)).toThrow();
    });
  });

  describe("decodeToken", () => {
    it("should decode token without verification", () => {
      const token = generateAccessToken(mockUser);
      const decoded = decodeToken(token);

      expect(decoded.userId).toBe(mockUser._id);
      expect(decoded.email).toBe(mockUser.email);
    });

    it("should decode expired token without error", () => {
      // This would normally throw with verify, but decode should work
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJleHAiOjF9.invalid";
      const decoded = decodeToken(token);
      expect(decoded).toBeDefined();
    });
  });
});
