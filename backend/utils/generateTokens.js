/**
 * JWT Token Generation Utilities
 * Generates access and refresh tokens with user payload
 */

import jwt from "jsonwebtoken";
import { JWT_CONFIG } from "./constants.js";

/**
 * Generate access token (15 minutes expiry)
 * @param {Object} user - User object
 * @returns {string} JWT access token
 */
export const generateAccessToken = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
    organizationId: user.organization,
    departmentId: user.department,
    isPlatformUser: user.isPlatformUser,
  };

  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
  });
};

/**
 * Generate refresh token (7 days expiry)
 * @param {Object} user - User object
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN,
  });
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} Object with accessToken and refreshToken
 */
export const generateTokens = (user) => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
  };
};

/**
 * Verify access token
 * @param {string} token - JWT access token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};

export default {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
};
