// backend/utils/generateTokens.js
/**
 * JWT Token Generation Utilities
 *
 * Requirements: 10.11
 * - Access token: 15 minutes expiry
 * - Refresh token: 7 days expiry
 * - Payload: userId, email, role, organization, department
 * - Separate secrets for access and refresh tokens
 */
import jwt from "jsonwebtoken";

// Token expiry times per specification
const DEFAULT_ACCESS_EXPIRES_IN = "15m"; // 15 minutes per spec
const DEFAULT_REFRESH_EXPIRES_IN = "7d"; // 7 days per spec

const accessExpiresInEnv =
  process.env.JWT_ACCESS_EXPIRES_IN || DEFAULT_ACCESS_EXPIRES_IN;
const refreshExpiresInEnv =
  process.env.JWT_REFRESH_EXPIRES_IN || DEFAULT_REFRESH_EXPIRES_IN;

// Convert expiresIn string to milliseconds
const expiresInToMs = (expiresIn) => {
  if (typeof expiresIn === "number") {
    return expiresIn * 1000;
  }

  const match = String(expiresIn).match(/^(\d+)([smhd])$/);
  if (match) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return value * multipliers[unit];
  }

  // Fallback to 15 minutes if format is unrecognized
  return 15 * 60 * 1000;
};

// Calculate cookie maxAge values
const ACCESS_TOKEN_MAX_AGE = expiresInToMs(accessExpiresInEnv);
const REFRESH_TOKEN_MAX_AGE = expiresInToMs(refreshExpiresInEnv);

/**
 * Generate access token with full user payload
 * Payload includes: userId, email, role, organization, department
 *
 * @param {Object} user - User object with required fields
 * @param {string} user._id - User ID
 * @param {string} user.email - User email
 * @param {string} user.role - User role
 * @param {Object|string} user.organization - Organization reference
 * @param {Object|string} user.department - Department reference
 * @returns {string} Signed JWT access token
 */
export const generateAccessToken = (user) => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET not set");

  // Support both full user object and simple userId for backward compatibility
  const payload =
    typeof user === "object"
      ? {
          userId: user._id?.toString() || user.userId,
          email: user.email,
          role: user.role,
          organization:
            user.organization?._id?.toString() || user.organization?.toString(),
          department:
            user.department?._id?.toString() || user.department?.toString(),
        }
      : { userId: user };

  return jwt.sign(payload, secret, {
    expiresIn: accessExpiresInEnv,
  });
};

/**
 * Generate refresh token with userId only
 * Refresh tokens have minimal payload for security
 *
 * @param {Object|string} user - User object or userId
 * @returns {string} Signed JWT refresh token
 */
export const generateRefreshToken = (user) => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET not set");

  const userId =
    typeof user === "object" ? user._id?.toString() || user.userId : user;

  return jwt.sign({ userId }, secret, {
    expiresIn: refreshExpiresInEnv,
  });
};

// Cookie options
export const getAccessTokenCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: ACCESS_TOKEN_MAX_AGE,
});

export const getRefreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: REFRESH_TOKEN_MAX_AGE,
});
