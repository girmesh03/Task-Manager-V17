// backend/routes/authRoutes.js
import express from "express";

import {
  registerOrganization,
  loginUser,
  logoutUser,
  getRefreshToken,
  forgotPassword,
  resetPassword,
} from "../controllers/authControllers.js";

import {
  validateOrgRegistration,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} from "../middlewares/validators/authValidators.js";

import rateLimiter from "../middlewares/rateLimiter.js";
import {
  verifyJWT,
  verifyRefreshToken,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Apply rate limiter to all auth routes
router.use(rateLimiter);

// @route   POST /api/auth/register
// @desc    Register a new organization, department and tenant super admin user
// @access  Public
router.route("/register").post(validateOrgRegistration, registerOrganization);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.route("/login").post(validateLogin, loginUser);

// @route   DELETE /api/auth/logout
// @desc    Logout user
// @access  Private
router.route("/logout").delete(verifyJWT, logoutUser);

// @route   GET /api/auth/refresh-token
// @desc    Get new access token using refresh token
// @access  Private - Requires valid refresh token
router.route("/refresh-token").get(verifyRefreshToken, getRefreshToken);

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.route("/forgot-password").post(validateForgotPassword, forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.route("/reset-password").post(validateResetPassword, resetPassword);

export default router;
