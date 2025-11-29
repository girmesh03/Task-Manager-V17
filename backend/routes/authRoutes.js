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

import { authLimiter } from "../middlewares/rateLimiter.js";
import {
  verifyJWT,
  verifyRefreshToken,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Apply stricter rate limiter to all auth routes (5 requests per 15 minutes)
// Requirements: 21, 42, 162, 294, 358-364, 411
router.use(authLimiter);

/**
 * @json {
 *   "method": "POST",
 *   "path": "/api/auth/register",
 *   "middleware": ["rateLimiter", "validateOrgRegistration"],
 *   "controller": "registerOrganization",
 *   "description": "Register a new organization, department and tenant super admin user"
 * }
 */
router.route("/register").post(validateOrgRegistration, registerOrganization);

/**
 * @json {
 *   "method": "POST",
 *   "path": "/api/auth/login",
 *   "middleware": ["rateLimiter", "validateLogin"],
 *   "controller": "loginUser",
 *   "description": "Authenticate user and set access/refresh tokens via cookies"
 * }
 */
router.route("/login").post(validateLogin, loginUser);

/**
 * @json {
 *   "method": "DELETE",
 *   "path": "/api/auth/logout",
 *   "middleware": ["rateLimiter", "verifyRefreshToken"],
 *   "controller": "logoutUser",
 *   "description": "Logout user and clear authentication cookies"
 * }
 */
router.route("/logout").delete(verifyRefreshToken, logoutUser);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/api/auth/refresh-token",
 *   "middleware": ["rateLimiter", "verifyRefreshToken"],
 *   "controller": "getRefreshToken",
 *   "description": "Get new access token using refresh token"
 * }
 */
router.route("/refresh-token").get(verifyRefreshToken, getRefreshToken);

/**
 * @json {
 *   "method": "POST",
 *   "path": "/api/auth/forgot-password",
 *   "middleware": ["rateLimiter", "validateForgotPassword"],
 *   "controller": "forgotPassword",
 *   "description": "Request password reset and send reset email"
 * }
 */
router.route("/forgot-password").post(validateForgotPassword, forgotPassword);

/**
 * @json {
 *   "method": "POST",
 *   "path": "/api/auth/reset-password",
 *   "middleware": ["rateLimiter", "validateResetPassword"],
 *   "controller": "resetPassword",
 *   "description": "Reset password using valid reset token"
 * }
 */
router.route("/reset-password").post(validateResetPassword, resetPassword);

export default router;
