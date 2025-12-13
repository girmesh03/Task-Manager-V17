// backend/middlewares/validators/vendorValidators.js
import { body, param, query } from "express-validator";
import { handleValidationErrors } from "./validation.js";
import { Vendor } from "../../models/index.js";
import { escapeRegex } from "../../utils/helpers.js";
import {
  MAX_VENDOR_NAME_LENGTH,
  MAX_EMAIL_LENGTH,
  PHONE_REGEX,
} from "../../utils/constants.js";

/**
 * @json {
 *   "route": "POST /vendors",
 *   "purpose": "Create a new vendor for the organization",
 *   "validates": ["name","email","phone"],
 *   "rules": [
 *     "Name required with length constraint",
 *     "Optional email format with max length and org uniqueness",
 *     "Phone required with PHONE_REGEX and org uniqueness",
 *     "Attach sanitized body to req.validated.body"
 *   ]
 * }
 */
export const validateCreateVendor = [
  body("name")
    .exists({ checkFalsy: true })
    .withMessage("Vendor name is required")
    .bail()
    .isString()
    .withMessage("Vendor name must be a string")
    .trim()
    .isLength({ min: 1, max: MAX_VENDOR_NAME_LENGTH })
    .withMessage(
      `Vendor name cannot exceed ${MAX_VENDOR_NAME_LENGTH} characters`
    )
    .bail()
    .custom(async (name, { req }) => {
      const existing = await Vendor.findOne({
        organization: req.user.organization._id,
        name: { $regex: new RegExp(`^${escapeRegex(name.trim())}$`, "i") },
      }).withDeleted();
      if (existing)
        throw new Error("Vendor name already exists in your organization");
      return true;
    }),
  body("email")
    .optional({ nullable: true })
    .isEmail()
    .withMessage("Please provide a valid email address")
    .bail()
    .isLength({ max: MAX_EMAIL_LENGTH })
    .withMessage(`Email must be less than ${MAX_EMAIL_LENGTH} characters`)
    .bail()
    .custom(async (email, { req }) => {
      if (!email) return true;
      const existing = await Vendor.findOne({
        organization: req.user.organization._id,
        email: {
          $regex: new RegExp(
            `^${escapeRegex(email.trim().toLowerCase())}$`,
            "i"
          ),
        },
      }).withDeleted();
      if (existing)
        throw new Error("Vendor email already exists in your organization");
      return true;
    }),
  body("phone")
    .exists({ checkFalsy: true })
    .withMessage("Phone number is required")
    .bail()
    .matches(PHONE_REGEX)
    .withMessage("Phone number must be in valid E.164 format")
    .bail()
    .custom(async (phone, { req }) => {
      const existing = await Vendor.findOne({
        organization: req.user.organization._id,
        phone: { $regex: new RegExp(`^${escapeRegex(phone.trim())}$`, "i") },
      }).withDeleted();
      if (existing)
        throw new Error("Vendor phone already exists in your organization");
      return true;
    }),
  body("organizationId")
    .not()
    .exists()
    .withMessage(
      "organizationId cannot be provided. Organization is determined from authentication context"
    ),
  body().custom((_, { req }) => {
    req.validated = req.validated || {};
    const b = req.body;
    req.validated.body = {
      name: b.name?.trim(),
      email: b.email?.trim().toLowerCase(),
      phone: b.phone?.trim(),
    };
    return true;
  }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "GET /vendors",
 *   "purpose": "List vendors in the organization with pagination and search",
 *   "validates": ["page","limit","search","deleted","sortBy","sortOrder"],
 *   "rules": [
 *     "Pagination integers",
 *     "Optional search string",
 *     "Optional deleted boolean",
 *     "Attach sanitized query to req.validated.query"
 *   ]
 * }
 */
export const validateGetAllVendors = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),
  query("search")
    .optional()
    .isString()
    .withMessage("Search must be a string")
    .trim(),
  query("deleted")
    .optional()
    .isBoolean()
    .withMessage("Deleted must be a boolean")
    .toBoolean(),
  query("sortBy")
    .optional()
    .isString()
    .withMessage("sortBy must be a string")
    .trim(),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc", "1", "-1"])
    .withMessage("Invalid sortOrder"),
  query().custom((_, { req }) => {
    req.validated = req.validated || {};
    req.validated.query = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      search: req.query.search?.trim(),
      deleted: req.query.deleted === true || req.query.deleted === "true",
      sortBy: req.query.sortBy?.trim(),
      sortOrder: req.query.sortOrder || "desc",
    };
    return true;
  }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "GET /vendors/:vendorId",
 *   "purpose": "Get single vendor by ID with complete details",
 *   "validates": ["vendorId"],
 *   "rules": [
 *     "vendorId must be valid and belong to user's organization",
 *     "Attach sanitized params to req.validated.params"
 *   ]
 * }
 */
export const validateGetVendor = [
  param("vendorId")
    .isMongoId()
    .withMessage("Vendor ID must be a valid MongoDB ID")
    .bail()
    .custom(async (vendorId, { req }) => {
      const vendor = await Vendor.findOne({
        _id: vendorId,
        organization: req.user.organization._id,
      }).withDeleted();
      if (!vendor) throw new Error("Vendor not found in your organization");
      return true;
    }),
  (req, _res, next) => {
    req.validated = req.validated || {};
    req.validated.params = { vendorId: req.params.vendorId };
    next();
  },
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "PUT /vendors/:vendorId",
 *   "purpose": "Update vendor details",
 *   "validates": ["vendorId","name","email","phone"],
 *   "rules": [
 *     "Param vendorId must exist in org",
 *     "Optional fields with same constraints as create",
 *     "Uniqueness checks within org excluding current vendor",
 *     "Attach sanitized body to req.validated.body"
 *   ]
 * }
 */
export const validateUpdateVendor = [
  param("vendorId")
    .isMongoId()
    .withMessage("Vendor ID must be a valid MongoDB ID")
    .bail()
    .custom(async (vendorId, { req }) => {
      const vendor = await Vendor.findOne({
        _id: vendorId,
        organization: req.user.organization._id,
      }).withDeleted();
      if (!vendor) throw new Error("Vendor not found in your organization");
      return true;
    }),
  body("name")
    .optional({ nullable: true })
    .isString()
    .withMessage("Vendor name must be a string")
    .trim()
    .isLength({ min: 1, max: MAX_VENDOR_NAME_LENGTH })
    .withMessage(
      `Vendor name cannot exceed ${MAX_VENDOR_NAME_LENGTH} characters`
    )
    .bail()
    .custom(async (name, { req }) => {
      const existing = await Vendor.findOne({
        organization: req.user.organization._id,
        name: { $regex: new RegExp(`^${escapeRegex(name.trim())}$`, "i") },
        _id: { $ne: req.params.vendorId },
      }).withDeleted();
      if (existing)
        throw new Error("Vendor name already exists in your organization");
      return true;
    }),
  body("email")
    .optional({ nullable: true })
    .isEmail()
    .withMessage("Please provide a valid email address")
    .bail()
    .isLength({ max: MAX_EMAIL_LENGTH })
    .withMessage(`Email must be less than ${MAX_EMAIL_LENGTH} characters`)
    .bail()
    .custom(async (email, { req }) => {
      if (!email) return true;
      const existing = await Vendor.findOne({
        organization: req.user.organization._id,
        email: {
          $regex: new RegExp(
            `^${escapeRegex(email.trim().toLowerCase())}$`,
            "i"
          ),
        },
        _id: { $ne: req.params.vendorId },
      }).withDeleted();
      if (existing)
        throw new Error("Vendor email already exists in your organization");
      return true;
    }),
  body("phone")
    .optional({ nullable: true })
    .matches(PHONE_REGEX)
    .withMessage("Phone number must be in valid E.164 format")
    .bail()
    .custom(async (phone, { req }) => {
      const existing = await Vendor.findOne({
        organization: req.user.organization._id,
        phone: { $regex: new RegExp(`^${escapeRegex(phone.trim())}$`, "i") },
        _id: { $ne: req.params.vendorId },
      }).withDeleted();
      if (existing)
        throw new Error("Vendor phone already exists in your organization");
      return true;
    }),
  body("organizationId")
    .not()
    .exists()
    .withMessage(
      "organizationId cannot be provided. Organization is determined from authentication context"
    ),
  body().custom((_, { req }) => {
    req.validated = req.validated || {};
    const b = req.body;
    req.validated.params = { vendorId: req.params.vendorId };
    req.validated.body = {
      name: b.name?.trim(),
      email: b.email?.trim().toLowerCase(),
      phone: b.phone?.trim(),
    };
    return true;
  }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "DELETE /vendors/:vendorId",
 *   "purpose": "Soft delete a vendor with reassignment option for active project tasks",
 *   "validates": ["vendorId","reassignToVendorId"],
 *   "rules": [
 *     "vendorId must be valid and belong to org",
 *     "Optional reassignToVendorId must be a vendor in the same org and not deleted",
 *     "Attach sanitized params/body to req.validated"
 *   ]
 * }
 */
export const validateDeleteVendor = [
  param("vendorId")
    .isMongoId()
    .withMessage("Vendor ID must be a valid MongoDB ID")
    .bail()
    .custom(async (vendorId, { req }) => {
      const vendor = await Vendor.findOne({
        _id: vendorId,
        organization: req.user.organization._id,
      });
      if (!vendor) throw new Error("Vendor not found in your organization");
      return true;
    }),
  body("reassignToVendorId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("reassignToVendorId must be a valid MongoDB ID")
    .bail()
    .custom(async (reassignToVendorId, { req }) => {
      if (!reassignToVendorId) return true;
      if (String(reassignToVendorId) === String(req.params.vendorId)) {
        throw new Error("Cannot reassign to the same vendor being deleted");
      }
      const replacement = await Vendor.findOne({
        _id: reassignToVendorId,
        organization: req.user.organization._id,
        isDeleted: false,
      });
      if (!replacement)
        throw new Error("Replacement vendor not found in your organization");
      return true;
    }),
  (req, _res, next) => {
    req.validated = req.validated || {};
    req.validated.params = { vendorId: req.params.vendorId };
    req.validated.body = { reassignToVendorId: req.body.reassignToVendorId };
    next();
  },
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "POST /vendors/:vendorId/restore",
 *   "purpose": "Restore a soft-deleted vendor",
 *   "validates": ["vendorId"],
 *   "rules": [
 *     "vendorId must be valid and belong to org",
 *     "Vendor must be soft-deleted",
 *     "Attach sanitized params to req.validated.params"
 *   ]
 * }
 */
export const validateRestoreVendor = [
  param("vendorId")
    .isMongoId()
    .withMessage("Vendor ID must be a valid MongoDB ID")
    .bail()
    .custom(async (vendorId, { req }) => {
      const vendor = await Vendor.findOne({
        _id: vendorId,
        organization: req.user.organization._id,
      }).onlyDeleted();
      if (!vendor)
        throw new Error("Soft-deleted vendor not found in your organization");
      return true;
    }),
  (req, _res, next) => {
    req.validated = req.validated || {};
    req.validated.params = { vendorId: req.params.vendorId };
    next();
  },
  handleValidationErrors,
];
