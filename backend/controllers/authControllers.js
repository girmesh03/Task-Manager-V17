/**
 * Authentication Controllers
 * Handles user registration, login, logout, token refresh, password reset
 */

import asyncHandler from "express-async-handler";
import CustomError from "../errorHandler/CustomError.js";
import { generateTokens, verifyRefreshToken } from "../utils/generateTokens.js";
import { COOKIE_CONFIG, JWT_CONFIG, USER_ROLES } from "../utils/constants.js";
import { successResponse } from "../utils/helpers.js";

// NOTE: Models will be imported from Phase 3
// For now, these are placeholders for the structure
// import User from "../models/User.js";
// import Organization from "../models/Organization.js";
// import Department from "../models/Department.js";

/**
 * @desc    Register new user with organization and department
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const {
    // User fields
    firstName,
    lastName,
    email,
    password,
    phone,
    position,
    // Organization fields
    organizationName,
    organizationEmail,
    organizationPhone,
    industry,
    address,
    logoUrl,
    // Department fields
    departmentName,
    departmentDescription,
  } = req.body;

  // TODO: Implement in Phase 3 when models are ready
  // Steps:
  // 1. Check if email already exists
  // 2. Start MongoDB transaction
  // 3. Create organization (isPlatformOrg: false)
  // 4. Create department with organization reference
  // 5. Create user with SuperAdmin role, isHod: true
  // 6. Commit transaction
  // 7. Generate tokens
  // 8. Set cookies
  // 9. Return success response

  // Placeholder response
  res.status(501).json({
    success: false,
    message: "Register endpoint will be implemented in Phase 3 (Models)",
    note: "Validator is ready and working",
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // TODO: Implement in Phase 3 when User model is ready
  // Steps:
  // 1. Find user by email (populate organization and department)
  // 2. Check if user exists and not soft-deleted
  // 3. Verify password using user.comparePassword()
  // 4. Generate tokens
  // 5. Set HTTP-only cookies
  // 6. Return user data and success response

  // Placeholder response
  res.status(501).json({
    success: false,
    message: "Login endpoint will be implemented in Phase 3 (Models)",
    note: "Validator is ready and working",
  });
});

/**
 * @desc    Logout user (clear cookies)
 * @route   DELETE /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  // Clear access token cookie
  res.clearCookie(JWT_CONFIG.ACCESS_TOKEN_COOKIE_NAME, {
    httpOnly: COOKIE_CONFIG.HTTP_ONLY,
    secure: COOKIE_CONFIG.SECURE,
    sameSite: COOKIE_CONFIG.SAME_SITE,
    path: COOKIE_CONFIG.PATH,
  });

  // Clear refresh token cookie
  res.clearCookie(JWT_CONFIG.REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: COOKIE_CONFIG.HTTP_ONLY,
    secure: COOKIE_CONFIG.SECURE,
    sameSite: COOKIE_CONFIG.SAME_SITE,
    path: COOKIE_CONFIG.PATH,
  });

  res.json(successResponse("Logged out successfully"));
});

/**
 * @desc    Refresh access token using refresh token
 * @route   GET /api/auth/refresh-token
 * @access  Public (uses refresh token)
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies[JWT_CONFIG.REFRESH_TOKEN_COOKIE_NAME];

  if (!refreshToken) {
    throw CustomError.unauthenticated("No refresh token provided");
  }

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // TODO: Implement in Phase 3 when User model is ready
    // Steps:
    // 1. Find user by decoded.userId
    // 2. Check if user exists and not deleted
    // 3. Generate new access token
    // 4. Set new access token cookie
    // 5. Return success response

    // Placeholder response
    res.status(501).json({
      success: false,
      message: "Refresh token endpoint will be implemented in Phase 3 (Models)",
      note: "Token verification is working",
      decoded,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw CustomError.unauthenticated("Refresh token expired. Please login again.");
    }

    if (error.name === "JsonWebTokenError") {
      throw CustomError.unauthenticated("Invalid refresh token. Please login again.");
    }

    throw error;
  }
});

/**
 * @desc    Send password reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // TODO: Implement in Phase 3 when User model is ready
  // Steps:
  // 1. Find user by email
  // 2. Generate password reset token (user.generatePasswordResetToken())
  // 3. Save user with reset token and expiry
  // 4. Send password reset email (Phase 7 - Email service)
  // 5. Return success response

  // Placeholder response
  res.status(501).json({
    success: false,
    message: "Forgot password endpoint will be implemented in Phase 3 (Models) and Phase 7 (Email)",
    note: "Validator is ready and working",
  });
});

/**
 * @desc    Reset password using reset token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;

  // TODO: Implement in Phase 3 when User model is ready
  // Steps:
  // 1. Find user with valid reset token and not expired
  // 2. Hash new password
  // 3. Update user password and clear reset token
  // 4. Generate new tokens
  // 5. Set cookies
  // 6. Return success response

  // Placeholder response
  res.status(501).json({
    success: false,
    message: "Reset password endpoint will be implemented in Phase 3 (Models)",
    note: "Validator is ready and working",
  });
});

/**
 * @desc    Get current user info
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  // TODO: Implement in Phase 3 when User model is ready
  // Steps:
  // 1. Find user by req.user.userId
  // 2. Populate organization and department
  // 3. Return user data

  // For now, return data from JWT token
  res.json(
    successResponse("Current user info from token", {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      organization: req.user.organization, // ObjectId
      department: req.user.department,     // ObjectId
      isPlatformUser: req.user.isPlatformUser,
    })
  );
});

export default {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
};
