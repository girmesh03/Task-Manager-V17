/**
 * Authentication Validators
 * Validation rules for authentication endpoints
 */

import { body } from "express-validator";
import { STRING_LIMITS, USER_ROLES } from "../utils/constants.js";
import { INDUSTRIES } from "../utils/constants.js";

/**
 * Register validation
 * Validates new user registration with organization and department
 */
export const registerValidation = [
  // User fields
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ max: STRING_LIMITS.USER_FIRST_NAME_MAX })
    .withMessage(`First name must not exceed ${STRING_LIMITS.USER_FIRST_NAME_MAX} characters`),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ max: STRING_LIMITS.USER_LAST_NAME_MAX })
    .withMessage(`Last name must not exceed ${STRING_LIMITS.USER_LAST_NAME_MAX} characters`),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .isLength({ max: STRING_LIMITS.USER_EMAIL_MAX })
    .withMessage(`Email must not exceed ${STRING_LIMITS.USER_EMAIL_MAX} characters`)
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: STRING_LIMITS.USER_PASSWORD_MIN })
    .withMessage(`Password must be at least ${STRING_LIMITS.USER_PASSWORD_MIN} characters`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),

  body("phone")
    .optional()
    .trim()
    .matches(/^(\+251\d{9}|0\d{9})$/)
    .withMessage("Invalid phone format. Use +251XXXXXXXXX or 0XXXXXXXXX"),

  body("position")
    .optional()
    .trim()
    .isLength({ max: STRING_LIMITS.USER_POSITION_MAX })
    .withMessage(`Position must not exceed ${STRING_LIMITS.USER_POSITION_MAX} characters`),

  // Organization fields
  body("organizationName")
    .trim()
    .notEmpty()
    .withMessage("Organization name is required")
    .isLength({ max: STRING_LIMITS.ORG_NAME_MAX })
    .withMessage(`Organization name must not exceed ${STRING_LIMITS.ORG_NAME_MAX} characters`),

  body("organizationEmail")
    .trim()
    .notEmpty()
    .withMessage("Organization email is required")
    .isEmail()
    .withMessage("Invalid organization email format")
    .normalizeEmail(),

  body("organizationPhone")
    .optional()
    .trim()
    .matches(/^(\+251\d{9}|0\d{9})$/)
    .withMessage("Invalid phone format"),

  body("industry")
    .trim()
    .notEmpty()
    .withMessage("Industry is required")
    .isIn(INDUSTRIES)
    .withMessage("Invalid industry selection"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: STRING_LIMITS.ORG_ADDRESS_MAX })
    .withMessage(`Address must not exceed ${STRING_LIMITS.ORG_ADDRESS_MAX} characters`),

  body("logoUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("Invalid logo URL"),

  // Department fields
  body("departmentName")
    .trim()
    .notEmpty()
    .withMessage("Department name is required")
    .isLength({ max: STRING_LIMITS.DEPT_NAME_MAX })
    .withMessage(`Department name must not exceed ${STRING_LIMITS.DEPT_NAME_MAX} characters`),

  body("departmentDescription")
    .optional()
    .trim()
    .isLength({ max: STRING_LIMITS.DEPT_DESCRIPTION_MAX })
    .withMessage(`Department description must not exceed ${STRING_LIMITS.DEPT_DESCRIPTION_MAX} characters`),
];

/**
 * Login validation
 */
export const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

/**
 * Forgot password validation
 */
export const forgotPasswordValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
];

/**
 * Reset password validation
 */
export const resetPasswordValidation = [
  body("resetToken")
    .trim()
    .notEmpty()
    .withMessage("Reset token is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: STRING_LIMITS.USER_PASSWORD_MIN })
    .withMessage(`Password must be at least ${STRING_LIMITS.USER_PASSWORD_MIN} characters`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
];

export default {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
};
