/**
 * Authentication Routes
 * Handles user registration, login, logout, token refresh, password reset
 */

import express from "express";
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
} from "../controllers/authControllers.js";
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} from "../middlewares/validators/authValidators.js";
import handleValidation from "../middlewares/validators/validation.js";
import authenticate from "../middlewares/authMiddleware.js";
import { authLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user with organization and department
 * @access  Public
 */
router.post(
  "/register",
  authLimiter,
  registerValidation,
  handleValidation,
  register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post("/login", authLimiter, loginValidation, handleValidation, login);

/**
 * @route   DELETE /api/auth/logout
 * @desc    Logout user (clear cookies)
 * @access  Private
 */
router.delete("/logout", authenticate, logout);

/**
 * @route   GET /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public (uses refresh token from cookie)
 */
router.get("/refresh-token", refreshToken);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post(
  "/forgot-password",
  authLimiter,
  forgotPasswordValidation,
  handleValidation,
  forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using reset token
 * @access  Public
 */
router.post(
  "/reset-password",
  authLimiter,
  resetPasswordValidation,
  handleValidation,
  resetPassword
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get("/me", authenticate, getMe);

export default router;
