// backend/middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import checkUserStatus from "../utils/userStatus.js";
import CustomError from "../errorHandler/CustomError.js";

/**
 * Extract JWT from either the httpOnly cookie or the Authorization header.
 */
function extractRefreshToken(req) {
  const cookieToken = req.cookies?.refresh_token;
  return cookieToken || null;
}

// Middleware to verify refresh token for token refresh route
export const verifyRefreshToken = async (req, res, next) => {
  try {
    // 1) Extract refresh token
    const refreshToken = extractRefreshToken(req);
    if (!refreshToken) {
      return next(
        CustomError.authentication("Refresh token is required", {
          missingToken: 'refresh_token',
          source: 'cookie'
        })
      );
    }

    // 2) Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return next(
          CustomError.authentication("Refresh token has expired", {
            tokenType: 'refresh_token',
            expiredAt: jwtError.expiredAt,
            jwtError: jwtError.name
          })
        );
      } else {
        return next(
          CustomError.authentication("Invalid refresh token", {
            tokenType: 'refresh_token',
            jwtError: jwtError.name,
            reason: 'Token verification failed'
          })
        );
      }
    }

    // 3) Load user
    const user = await User.findById(decoded.userId)
      .populate({ path: "organization", select: "name isDeleted" })
      .populate({
        path: "department",
        select: "name organization isDeleted",
      });

    if (!user) {
      return next(
        CustomError.authentication("User not found", {
          userId: decoded.userId,
          reason: 'User account may have been deleted or deactivated'
        })
      );
    }

    // 4) Status checks for user
    const userStatus = checkUserStatus(user);
    if (userStatus.status) {
      return next(
        CustomError.authentication(userStatus.message, {
          userId: user._id,
          userStatus: userStatus.errorCode,
          organizationId: user.organization?._id,
          departmentId: user.department?._id
        })
      );
    }

    // Attach user to request
    req.user = user;

    return next();
  } catch (error) {
    return next(
      CustomError.internal(
        `Internal server error during refresh token verification: ${error.message}`,
        {
          operation: 'refresh_token_verification',
          originalError: error.message,
          stack: error.stack
        }
      )
    );
  }
};

/**
 * Extract JWT from either the httpOnly cookie or the Authorization header.
 */
function extractAccessToken(req) {
  const cookieToken = req.cookies?.access_token;
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (cookieToken) return cookieToken;
  if (authHeader && typeof authHeader === "string") {
    const parts = authHeader.split(" ");
    if (parts.length === 2) {
      const scheme = parts[0];
      const token = parts[1];
      if (
        typeof scheme === "string" &&
        scheme.toLowerCase() === "bearer" &&
        token
      )
        return token;
    }
  }
  return null;
}

// Middleware to verify JWT token with multi-tenant integrity and externalized Subscription
export const verifyJWT = async (req, res, next) => {
  try {
    // 1) Extract token
    const token = extractAccessToken(req);
    if (!token) {
      return next(
        CustomError.authentication("Access token is required", {
          missingToken: 'access_token',
          sources: ['cookie', 'authorization_header']
        })
      );
    }

    // 2) Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return next(
          CustomError.authentication("Access token has expired", {
            tokenType: 'access_token',
            expiredAt: jwtError.expiredAt,
            jwtError: jwtError.name
          })
        );
      } else if (jwtError.name === "JsonWebTokenError") {
        return next(
          CustomError.authentication("Invalid access token", {
            tokenType: 'access_token',
            jwtError: jwtError.name,
            reason: 'Token format is invalid'
          })
        );
      } else {
        return next(
          CustomError.authentication("Token verification failed", {
            tokenType: 'access_token',
            jwtError: jwtError.name,
            reason: 'Unknown JWT error'
          })
        );
      }
    }

    // 3) Load user with tenant context (organization & department)
    const user = await User.findById(decoded.userId)
      .populate({ path: "organization", select: "name isDeleted" })
      .populate({
        path: "department",
        select: "name organization isDeleted",
      });

    if (!user) {
      return next(
        CustomError.authentication("User not found", {
          userId: decoded.userId,
          reason: 'User account may have been deleted or deactivated'
        })
      );
    }

    // 4) Status checks for user, department and organization
    const userStatus = checkUserStatus(user);
    if (userStatus.status) {
      return next(
        CustomError.authentication(userStatus.message, {
          userId: user._id,
          userStatus: userStatus.errorCode,
          organizationId: user.organization?._id,
          departmentId: user.department?._id
        })
      );
    }

    // Attach context to request
    req.user = user;

    return next();
  } catch (error) {
    return next(
      CustomError.internal(
        `Internal server error during authentication: ${error.message}`,
        {
          operation: 'access_token_verification',
          originalError: error.message,
          stack: error.stack
        }
      )
    );
  }
};

// Export token extraction utilities for use in Socket.IO
export { extractAccessToken, extractRefreshToken };
