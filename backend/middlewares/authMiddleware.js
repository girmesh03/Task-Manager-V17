/**
 * Authentication Middleware
 * Verifies JWT tokens from HTTP-only cookies and attaches user to request
 */

import asyncHandler from "express-async-handler";
import CustomError from "../errorHandler/CustomError.js";
import { verifyAccessToken } from "../utils/generateTokens.js";
import { JWT_CONFIG } from "../utils/constants.js";

/**
 * Authenticate user from access token cookie
 * Attaches user payload to req.user
 * @throws {CustomError} If token is missing, invalid, or expired
 */
const authenticate = asyncHandler(async (req, res, next) => {
  // Get access token from cookie
  const accessToken = req.cookies[JWT_CONFIG.ACCESS_TOKEN_COOKIE_NAME];

  if (!accessToken) {
    throw CustomError.unauthenticated("No access token provided. Please login.");
  }

  try {
    // Verify token and decode payload
    const decoded = verifyAccessToken(accessToken);

    // Attach user data to request (using schema field names)
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      organization: decoded.organization, // ObjectId from token
      department: decoded.department,     // ObjectId from token
      isPlatformUser: decoded.isPlatformUser,
    };

    next();
  } catch (error) {
    // Handle JWT errors
    if (error.name === "TokenExpiredError") {
      throw CustomError.unauthenticated(
        "Access token expired. Please refresh your token."
      );
    }

    if (error.name === "JsonWebTokenError") {
      throw CustomError.unauthenticated("Invalid access token. Please login again.");
    }

    // Re-throw other errors
    throw error;
  }
});

/**
 * Optional authentication - does not throw error if no token
 * Useful for routes that work differently for authenticated vs unauthenticated users
 */
const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  const accessToken = req.cookies[JWT_CONFIG.ACCESS_TOKEN_COOKIE_NAME];

  if (!accessToken) {
    // No token, but don't throw error - continue as unauthenticated
    req.user = null;
    return next();
  }

  try {
    const decoded = verifyAccessToken(accessToken);

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      organizationId: decoded.organizationId,
      departmentId: decoded.departmentId,
      isPlatformUser: decoded.isPlatformUser,
    };

    next();
  } catch (error) {
    // Token exists but is invalid/expired - set user to null and continue
    req.user = null;
    next();
  }
});

export { authenticate, optionalAuthenticate };
export default authenticate;
