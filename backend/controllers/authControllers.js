// backend/controllers/authControllers.js
import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import { Organization, Department, User } from "../models/index.js";
import {
  generateAccessToken,
  generateRefreshToken,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
} from "../utils/generateTokens.js";
import CustomError from "../errorHandler/CustomError.js";
import checkUserStatus from "../utils/userStatus.js";
import emailService from "../services/emailService.js";

/**
 * @json {
 *   "controller": "registerOrganization",
 *   "route": "POST /api/auth/register",
 *   "purpose": "Register a new organization with department and SuperAdmin user",
 *   "transaction": true,
 *   "returns": "Success message confirming organization, department, and user creation"
 * }
 */
export const registerOrganization = asyncHandler(async (req, res, next) => {
  const { organizationData, userData } = req.validated.body;

  // Start a new session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create a new organization
    const organization = new Organization({
      ...organizationData,
    });
    await organization.save({ session });

    // Check department name uniqueness within organization
    const existingDepartment = await Department.findOne({
      name: { $regex: new RegExp(`^${userData.departmentName}$`, "i") },
      organization: organization._id,
    }).session(session);

    if (existingDepartment) {
      throw CustomError.conflict(
        "Department name already exists in this organization",
        {
          departmentName: userData.departmentName,
          organizationId: organization._id,
        }
      );
    }

    // Create a new department
    const department = new Department({
      name: userData.departmentName,
      description: userData.departmentDesc,
      organization: organization._id,
    });
    await department.save({ session });

    // Create SuperAdmin user
    const adminUser = new User({
      firstName: userData.firstName,
      lastName: userData.lastName,
      position: userData.position,
      email: userData.email,
      password: userData.password,
      role: "SuperAdmin",
      organization: organization._id,
      department: department._id,
      joinedAt: new Date(),
    });
    await adminUser.save({ session });

    // Email verification here

    // Commit transaction
    await session.commitTransaction();

    // Send response
    return res.status(201).json({
      success: true,
      message:
        "Organization, department and super admin user created successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

/**
 * @json {
 *   "controller": "loginUser",
 *   "route": "POST /api/auth/login",
 *   "purpose": "Authenticate user and set access/refresh tokens via cookies",
 *   "transaction": false,
 *   "returns": "User object with populated organization and department"
 * }
 */
export const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.validated.body;

  // Find user with organization and department details
  const user = await User.findOne({ email })
    .select("+password")
    .populate({
      path: "organization",
      match: { isDeleted: false },
      select:
        "_id name description email phone address industry logoUrl createdBy createdAt",
    })
    .populate({
      path: "department",
      match: { isDeleted: false },
      select: "_id name description organization createdBy createdAt",
      populate: {
        path: "organization",
        match: { isDeleted: false },
        select: "_id name",
      },
    });

  // Check if user exists
  if (!user) {
    throw CustomError.authentication("Invalid email or password", {
      email: email,
      reason: "User not found or invalid credentials",
    });
  }

  // Check organization, department and user status
  const userStatus = checkUserStatus(user);
  if (userStatus.status) {
    throw CustomError.authentication(userStatus.message, {
      userId: user._id,
      email: user.email,
      userStatus: userStatus.errorCode,
      organizationId: user.organization?._id,
      departmentId: user.department?._id,
    });
  }

  // Verify password
  if (!(await user.comparePassword(password))) {
    throw CustomError.authentication("Invalid email or password", {
      email: email,
      reason: "Password verification failed",
    });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Set cookies
  res.cookie("access_token", accessToken, getAccessTokenCookieOptions());
  res.cookie("refresh_token", refreshToken, getRefreshTokenCookieOptions());

  // Remove password from response
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.isDeleted;
  delete userResponse.organization.isDeleted;
  delete userResponse.department.isDeleted;

  return res.status(200).json({
    success: true,
    message: "Login successful",
    user: userResponse,
  });
});

/**
 * @json {
 *   "controller": "logoutUser",
 *   "route": "DELETE /api/auth/logout",
 *   "purpose": "Logout user and clear authentication cookies",
 *   "transaction": false,
 *   "returns": "Success message confirming logout"
 * }
 */
export const logoutUser = asyncHandler(async (req, res, next) => {
  // User is already authenticated via verifyRefreshToken middleware
  // We can access the user via req.user

  // Clear cookies
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
});

/**
 * @json {
 *   "controller": "getRefreshToken",
 *   "route": "GET /api/auth/refresh-token",
 *   "purpose": "Get new access token using refresh token",
 *   "transaction": false,
 *   "returns": "User object with new access token set in cookie"
 * }
 */
export const getRefreshToken = asyncHandler(async (req, res, next) => {
  // User is already authenticated via verifyRefreshToken middleware
  // We can access the authenticated user via req.user
  const user = req.user;

  // The refresh token has already been verified by the middleware
  // No need to extract or verify it again

  // Check organization, department and user status
  const userStatus = checkUserStatus(user);
  if (userStatus.status) {
    throw CustomError.authentication(userStatus.message, {
      userId: user._id,
      userStatus: userStatus.errorCode,
      organizationId: user.organization?._id,
      departmentId: user.department?._id,
    });
  }

  // Generate new access token
  const newAccessToken = generateAccessToken(user._id);

  // Set new access token cookie
  res.cookie("access_token", newAccessToken, getAccessTokenCookieOptions());

  // Prepare user response without internal flags
  const userResponse =
    typeof user.toObject === "function" ? user.toObject() : { ...user };

  // Remove isDeleted flag from user, organization and department if present
  if (
    userResponse &&
    Object.prototype.hasOwnProperty.call(userResponse, "isDeleted")
  ) {
    delete userResponse.isDeleted;
  }

  if (
    userResponse &&
    userResponse.organization &&
    typeof userResponse.organization === "object" &&
    Object.prototype.hasOwnProperty.call(userResponse.organization, "isDeleted")
  ) {
    delete userResponse.organization.isDeleted;
  }

  if (
    userResponse &&
    userResponse.department &&
    typeof userResponse.department === "object" &&
    Object.prototype.hasOwnProperty.call(userResponse.department, "isDeleted")
  ) {
    delete userResponse.department.isDeleted;
  }

  return res.status(200).json({
    success: true,
    message: "Token refreshed successfully",
    user: userResponse,
  });
});

/**
 * @json {
 *   "controller": "forgotPassword",
 *   "route": "POST /api/auth/forgot-password",
 *   "purpose": "Request password reset and send reset email",
 *   "transaction": false,
 *   "returns": "Success message (generic for security)"
 * }
 */
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.validated.body;

  // Find user by email with organization details
  const user = await User.findOne({ email })
    .populate({ path: "organization", select: "name isDeleted" })
    .populate({
      path: "department",
      select: "name organization isDeleted",
    });

  if (!user) {
    // Don't reveal if user exists or not for security
    return res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  }

  // Check if user's email preferences allow password reset emails
  if (!user.emailPreferences.enabled || !user.emailPreferences.passwordReset) {
    return res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  }

  // Check organization and user status
  const userStatus = checkUserStatus(user);
  if (userStatus.status) {
    throw CustomError.authentication(userStatus.message, {
      userId: user._id,
      email: user.email,
      userStatus: userStatus.errorCode,
      organizationId: user.organization?._id,
    });
  }

  // Generate password reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    // Send password reset email
    await emailService.sendPasswordResetEmail({
      email: user.email,
      firstName: user.firstName,
      resetToken: resetToken,
      organizationName: user.organization?.name || "Unknown Organization",
      userId: user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Password reset link has been sent to your email address.",
    });
  } catch (emailError) {
    // Clear the reset token if email fails
    user.clearPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    console.error("Password reset email failed:", emailError);
    throw CustomError.internal(
      "Failed to send password reset email. Please try again later.",
      {
        userId: user._id,
        email: user.email,
        emailError: emailError.message,
      }
    );
  }
});

/**
 * @json {
 *   "controller": "resetPassword",
 *   "route": "POST /api/auth/reset-password",
 *   "purpose": "Reset password using valid reset token",
 *   "transaction": false,
 *   "returns": "Success message confirming password reset"
 * }
 */
export const resetPassword = asyncHandler(async (req, res, next) => {
  const { token, newPassword } = req.validated.body;

  // Find user with valid reset token
  const user = await User.findOne({
    passwordResetExpires: { $gt: Date.now() },
  })
    .select("+passwordResetToken +passwordResetExpires")
    .populate({ path: "organization", select: "name isDeleted" })
    .populate({
      path: "department",
      select: "name organization isDeleted",
    });

  if (!user || !user.verifyPasswordResetToken(token)) {
    throw CustomError.authentication(
      "Password reset token is invalid or has expired",
      {
        reason: "Invalid or expired reset token",
      }
    );
  }

  // Check organization and user status
  const userStatus = checkUserStatus(user);
  if (userStatus.status) {
    throw CustomError.authentication(userStatus.message, {
      userId: user._id,
      userStatus: userStatus.errorCode,
      organizationId: user.organization?._id,
    });
  }

  // Set new password and clear reset token
  user.password = newPassword;
  user.clearPasswordResetToken();
  await user.save();

  return res.status(200).json({
    success: true,
    message:
      "Password has been reset successfully. You can now login with your new password.",
  });
});
