// backend/middlewares/validators/organizationValidators.js
import { body, param, query } from "express-validator";
import validator from "validator";
import { handleValidationErrors } from "./validation.js";
import { Organization } from "../../models/index.js";
import { escapeRegex } from "../../utils/helpers.js";
import {
  MAX_ORG_NAME_LENGTH,
  MAX_ORG_DESCRIPTION_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_ADDRESS_LENGTH,
  MAX_INDUSTRY_LENGTH,
  VALID_INDUSTRIES,
  PHONE_REGEX,
  SUPPORTED_IMAGE_EXTENSIONS,
  CLOUDINARY_DOMAINS,
} from "../../utils/constants.js";

/**
 * @json {
 *   "route": "GET /organizations",
 *   "purpose": "List organizations based on user authorization. Platform SuperAdmins can see all organizations. Customer organization users can only see their own organization.",
 *   "validates": ["page", "limit", "search", "deleted", "industry", "sortBy", "sortOrder"],
 *   "rules": [
 *     "Pagination integers with bounds",
 *     "Optional search string",
 *     "Optional deleted boolean to include soft-deleted",
 *     "Optional industry constrained by VALID_INDUSTRIES",
 *     "Optional sortBy string and sortOrder in ['asc','desc','1','-1']",
 *     "Attach sanitized query to req.validated.query"
 *   ]
 * }
 */
export const validateGetAllOrganizations = [
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
  query("industry")
    .optional({ nullable: true })
    .isString()
    .withMessage("Industry must be a string")
    .trim()
    .isIn(VALID_INDUSTRIES)
    .withMessage(`Industry must be one of: ${VALID_INDUSTRIES.join(", ")}`),
  query("sortBy")
    .optional()
    .isString()
    .withMessage("sortBy must be a string")
    .trim(),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc", "1", "-1"])
    .withMessage("sortOrder must be one of: asc, desc, 1, -1"),
  query().custom((_, { req }) => {
    req.validated = req.validated || {};
    req.validated.query = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      search: req.query.search?.trim(),
      deleted: req.query.deleted === true || req.query.deleted === "true",
      industry: req.query.industry,
      sortBy: req.query.sortBy?.trim(),
      sortOrder: req.query.sortOrder || "desc",
    };
    return true;
  }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "GET /organizations/:organizationId",
 *   "purpose": "Get single organization by ID with complete dashboard",
 *   "validates": ["organizationId"],
 *   "rules": [
 *     "organizationId must be a valid MongoDB ID",
 *     "Organization must exist (including if soft-deleted when authorized)",
 *     "Attach sanitized params to req.validated"
 *   ]
 * }
 */
export const validateGetOrganization = [
  param("organizationId")
    .isMongoId()
    .withMessage("Organization ID must be a valid MongoDB ID")
    .bail()
    .custom(async (organizationId) => {
      const org = await Organization.findOne({
        _id: organizationId,
      }).withDeleted();
      if (!org) throw new Error("Organization not found");
      return true;
    }),

  param().custom(async (_, { req }) => {
    req.validated = req.validated || {};
    req.validated.params = { organizationId: req.params.organizationId };
    return true;
  }),

  handleValidationErrors,
];

/**
 * @json {
 *   "route": "PUT /organizations/:organizationId",
 *   "purpose": "Update organization details. Platform and customer SuperAdmins can update their organization.",
 *   "validates": ["organizationId", "name", "description", "email", "phone", "address", "industry", "logoUrl"],
 *   "rules": [
 *     "Param organizationId must exist and match an organization",
 *     "Name/description/email/phone/address/industry validations with length and pattern constraints",
 *     "Case-insensitive uniqueness for name/email/phone across all organizations (including soft-deleted), excluding current",
 *     "logoUrl object validation: url must be http/https and from trusted domain or image extension; publicId required if url provided",
 *     "Attach sanitized body to req.validated.body"
 *   ]
 * }
 */
export const validateUpdateOrganization = [
  param("organizationId")
    .isMongoId()
    .withMessage("Organization ID must be a valid MongoDB ID")
    .bail()
    .custom(async (organizationId) => {
      const org = await Organization.findOne({
        _id: organizationId,
      }).withDeleted();
      if (!org) throw new Error("Organization not found");
      return true;
    }),
  body("name")
    .optional({ nullable: true })
    .isString()
    .withMessage("Name must be a string")
    .trim()
    .isLength({ min: 1, max: MAX_ORG_NAME_LENGTH })
    .withMessage(
      `Organization name cannot exceed ${MAX_ORG_NAME_LENGTH} characters`
    )
    .bail()
    .custom(async (name, { req }) => {
      const existing = await Organization.findOne({
        name: {
          $regex: new RegExp(
            `^${escapeRegex(name.trim().toLowerCase())}$`,
            "i"
          ),
        },
        _id: { $ne: req.params.organizationId },
      }).withDeleted();
      if (existing) throw new Error("Organization name already exists");
      return true;
    }),
  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Description must be a string")
    .trim()
    .isLength({ min: 1, max: MAX_ORG_DESCRIPTION_LENGTH })
    .withMessage(
      `Description cannot exceed ${MAX_ORG_DESCRIPTION_LENGTH} characters`
    ),
  body("email")
    .optional({ nullable: true })
    .isEmail()
    .withMessage("Please provide a valid email address")
    .bail()
    .isLength({ max: MAX_EMAIL_LENGTH })
    .withMessage(`Email must be less than ${MAX_EMAIL_LENGTH} characters`)
    .bail()
    .custom(async (email, { req }) => {
      const existing = await Organization.findOne({
        email: {
          $regex: new RegExp(
            `^${escapeRegex(email.trim().toLowerCase())}$`,
            "i"
          ),
        },
        _id: { $ne: req.params.organizationId },
      }).withDeleted();
      if (existing) throw new Error("Email already exists");
      return true;
    }),
  body("phone")
    .optional({ nullable: true })
    .matches(PHONE_REGEX)
    .withMessage("Phone number must be in valid E.164 format")
    .bail()
    .custom(async (phone, { req }) => {
      const existing = await Organization.findOne({
        phone: { $regex: new RegExp(`^${escapeRegex(phone.trim())}$`, "i") },
        _id: { $ne: req.params.organizationId },
      }).withDeleted();
      if (existing) throw new Error("Phone already exists");
      return true;
    }),
  body("address")
    .optional({ nullable: true })
    .isString()
    .withMessage("Address must be a string")
    .trim()
    .isLength({ min: 1, max: MAX_ADDRESS_LENGTH })
    .withMessage(`Address cannot exceed ${MAX_ADDRESS_LENGTH} characters`),
  body("industry")
    .optional({ nullable: true })
    .isString()
    .withMessage("Industry must be a string")
    .trim()
    .isLength({ max: MAX_INDUSTRY_LENGTH })
    .withMessage(`Industry cannot exceed ${MAX_INDUSTRY_LENGTH} characters`)
    .bail()
    .isIn(VALID_INDUSTRIES)
    .withMessage(`Industry must be one of: ${VALID_INDUSTRIES.join(", ")}`),
  body("logoUrl")
    .optional({ nullable: true })
    .isObject()
    .withMessage("logoUrl must be an object"),
  body("logoUrl.url")
    .optional({ nullable: true })
    .custom((url) => {
      if (!url) return true;
      if (
        !validator.isURL(url, {
          protocols: ["http", "https"],
          require_protocol: true,
        })
      ) {
        throw new Error("Logo URL must be a valid HTTP or HTTPS URL");
      }
      try {
        const u = new URL(url);
        const hasImageExt = SUPPORTED_IMAGE_EXTENSIONS.some((ext) =>
          u.pathname.toLowerCase().endsWith(ext)
        );
        const trusted = CLOUDINARY_DOMAINS.some((d) => u.hostname.includes(d));
        if (!trusted && !hasImageExt) {
          throw new Error(
            "Logo URL must be a valid image URL from a trusted hosting service"
          );
        }
        return true;
      } catch {
        throw new Error("Invalid logo URL format");
      }
    }),
  body("logoUrl.publicId")
    .optional({ nullable: true })
    .isString()
    .withMessage("Cloudinary publicId must be a string")
    .trim(),
  body("isPlatformOrg")
    .not()
    .exists()
    .withMessage(
      "isPlatformOrg cannot be manually set. It is automatically determined by the system"
    ),
  body().custom((_, { req }) => {
    req.validated = req.validated || {};
    const b = req.body;
    req.validated.body = {
      name: b.name?.trim(),
      description: b.description?.trim(),
      email: b.email?.trim().toLowerCase(),
      phone: b.phone?.trim(),
      address: b.address?.trim(),
      industry: b.industry?.trim(),
      logoUrl: b.logoUrl
        ? {
            url: b.logoUrl.url,
            publicId: b.logoUrl.publicId?.trim(),
          }
        : undefined,
    };
    req.validated.params = { organizationId: req.params.organizationId };
    return true;
  }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "DELETE /organizations/:organizationId",
 *   "purpose": "Soft delete an organization with full cascade deletion.",
 *   "validates": ["organizationId"],
 *   "rules": [
 *     "organizationId must be a valid MongoDB ID",
 *     "Organization must exist",
 *     "Attach sanitized params to req.validated.params"
 *   ]
 * }
 */
export const validateDeleteOrganization = [
  param("organizationId")
    .isMongoId()
    .withMessage("Organization ID must be a valid MongoDB ID")
    .bail()
    .custom(async (organizationId) => {
      const org = await Organization.findOne({ _id: organizationId });
      if (!org) throw new Error("Organization not found");
      return true;
    }),
  (req, _res, next) => {
    req.validated = req.validated || {};
    req.validated.params = { organizationId: req.params.organizationId };
    next();
  },
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "POST /organizations/:organizationId/restore",
 *   "purpose": "Restore a soft-deleted organization.",
 *   "validates": ["organizationId"],
 *   "rules": [
 *     "organizationId must be a valid MongoDB ID",
 *     "Organization must exist and be soft-deleted",
 *     "Attach sanitized params to req.validated.params"
 *   ]
 * }
 */
export const validateRestoreOrganization = [
  param("organizationId")
    .isMongoId()
    .withMessage("Organization ID must be a valid MongoDB ID")
    .bail()
    .custom(async (organizationId) => {
      const org = await Organization.findOne({
        _id: organizationId,
      }).onlyDeleted();
      if (!org) throw new Error("Soft-deleted organization not found");
      return true;
    }),
  (req, _res, next) => {
    req.validated = req.validated || {};
    req.validated.params = { organizationId: req.params.organizationId };
    next();
  },
  handleValidationErrors,
];
