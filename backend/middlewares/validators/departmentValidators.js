// backend/middlewares/validators/departmentValidators.js
import { body, param, query } from "express-validator";
import { handleValidationErrors } from "./validation.js";
import { Department, Organization } from "../../models/index.js";
import { escapeRegex } from "../../utils/helpers.js";
import {
  MAX_DEPT_NAME_LENGTH,
  MAX_DEPT_DESCRIPTION_LENGTH,
} from "../../utils/constants.js";

/**
 * @json {
 *   "route": "POST /departments",
 *   "purpose": "Create a new department within the user's organization",
 *   "validates": ["name", "description"],
 *   "rules": [
 *     "Name/description required with length constraints",
 *     "Unique department name within the organization (including soft-deleted)",
 *     "Attach sanitized body to req.validated.body"
 *   ]
 * }
 */
export const validateCreateDepartment = [
  body("name")
    .exists({ checkFalsy: true })
    .withMessage("Department name is required")
    .bail()
    .isString()
    .withMessage("Department name must be a string")
    .trim()
    .isLength({ min: 1, max: MAX_DEPT_NAME_LENGTH })
    .withMessage(
      `Department name cannot exceed ${MAX_DEPT_NAME_LENGTH} characters`
    )
    .bail()
    .custom(async (name, { req }) => {
      const orgId = req.user.organization._id;
      const existing = await Department.findOne({
        organization: orgId,
        name: { $regex: new RegExp(`^${escapeRegex(name.trim())}$`, "i") },
      }).withDeleted();
      if (existing)
        throw new Error("Department name already exists in your organization");
      return true;
    }),
  body("description")
    .exists({ checkFalsy: true })
    .withMessage("Department description is required")
    .bail()
    .isString()
    .withMessage("Description must be a string")
    .trim()
    .isLength({ min: 1, max: MAX_DEPT_DESCRIPTION_LENGTH })
    .withMessage(
      `Description cannot exceed ${MAX_DEPT_DESCRIPTION_LENGTH} characters`
    ),
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
      description: b.description?.trim(),
    };
    return true;
  }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "GET /departments",
 *   "purpose": "List departments based on authorization scope",
 *   "validates": ["page", "limit", "search", "deleted", "sortBy", "sortOrder"],
 *   "rules": [
 *     "Pagination integers with bounds",
 *     "Optional search string",
 *     "Optional deleted boolean",
 *     "Attach sanitized query to req.validated.query"
 *   ]
 * }
 */
export const validateGetAllDepartments = [
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
    .withMessage("sortOrder must be one of: asc, desc, 1, -1"),
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
 *   "route": "GET /departments/:departmentId",
 *   "purpose": "Get single department with details including users, task statistics, recent activities, and HOD information",
 *   "validates": ["departmentId"],
 *   "rules": [
 *     "departmentId must be a valid MongoDB ID",
 *     "Department must belong to the user's organization",
 *     "Attach sanitized params to req.validated.params"
 *   ]
 * }
 */
export const validateGetDepartment = [
  param("departmentId")
    .isMongoId()
    .withMessage("Department ID must be a valid MongoDB ID")
    .bail()
    .custom(async (departmentId, { req }) => {
      const orgId = req.user.organization._id;
      const dept = await Department.findOne({
        _id: departmentId,
        organization: orgId,
      }).withDeleted();
      if (!dept) throw new Error("Department not found in your organization");
      return true;
    }),
  (req, _res, next) => {
    req.validated = req.validated || {};
    req.validated.params = { departmentId: req.params.departmentId };
    next();
  },
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "PUT /departments/:departmentId",
 *   "purpose": "Update department details",
 *   "validates": ["departmentId", "name", "description"],
 *   "rules": [
 *     "Param departmentId must exist in user's organization",
 *     "Name/description optional with length constraints",
 *     "Unique department name within the organization (including soft-deleted), excluding self",
 *     "Attach sanitized body/params to req.validated"
 *   ]
 * }
 */
export const validateUpdateDepartment = [
  param("departmentId")
    .isMongoId()
    .withMessage("Department ID must be a valid MongoDB ID")
    .bail()
    .custom(async (departmentId, { req }) => {
      const orgId = req.user.organization._id;
      const dept = await Department.findOne({
        _id: departmentId,
        organization: orgId,
      }).withDeleted();
      if (!dept) throw new Error("Department not found in your organization");
      return true;
    }),
  body("name")
    .optional({ nullable: true })
    .isString()
    .withMessage("Department name must be a string")
    .trim()
    .isLength({ min: 1, max: MAX_DEPT_NAME_LENGTH })
    .withMessage(
      `Department name cannot exceed ${MAX_DEPT_NAME_LENGTH} characters`
    )
    .bail()
    .custom(async (name, { req }) => {
      const orgId = req.user.organization._id;
      const existing = await Department.findOne({
        organization: orgId,
        name: { $regex: new RegExp(`^${escapeRegex(name.trim())}$`, "i") },
        _id: { $ne: req.params.departmentId },
      }).withDeleted();
      if (existing)
        throw new Error("Department name already exists in your organization");
      return true;
    }),
  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Description must be a string")
    .trim()
    .isLength({ min: 1, max: MAX_DEPT_DESCRIPTION_LENGTH })
    .withMessage(
      `Description cannot exceed ${MAX_DEPT_DESCRIPTION_LENGTH} characters`
    ),
  body("organizationId")
    .not()
    .exists()
    .withMessage(
      "organizationId cannot be provided. Organization is determined from authentication context"
    ),
  body().custom((_, { req }) => {
    req.validated = req.validated || {};
    const b = req.body;
    req.validated.params = { departmentId: req.params.departmentId };
    req.validated.body = {
      name: b.name?.trim(),
      description: b.description?.trim(),
    };
    return true;
  }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "DELETE /departments/:departmentId",
 *   "purpose": "Soft delete a department with full cascade deletion",
 *   "validates": ["departmentId"],
 *   "rules": [
 *     "departmentId must be valid and belong to user's organization",
 *     "Attach sanitized params to req.validated.params"
 *   ]
 * }
 */
export const validateDeleteDepartment = [
  param("departmentId")
    .isMongoId()
    .withMessage("Department ID must be a valid MongoDB ID")
    .bail()
    .custom(async (departmentId, { req }) => {
      const orgId = req.user.organization._id;
      const dept = await Department.findOne({
        _id: departmentId,
        organization: orgId,
      });
      if (!dept) throw new Error("Department not found in your organization");
      return true;
    }),
  (req, _res, next) => {
    req.validated = req.validated || {};
    req.validated.params = { departmentId: req.params.departmentId };
    next();
  },
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "POST /departments/:departmentId/restore",
 *   "purpose": "Restore a soft-deleted department",
 *   "validates": ["departmentId"],
 *   "rules": [
 *     "departmentId must be valid and belong to user's organization",
 *     "Department must be soft-deleted",
 *     "Attach sanitized params to req.validated.params"
 *   ]
 * }
 */
export const validateRestoreDepartment = [
  param("departmentId")
    .isMongoId()
    .withMessage("Department ID must be a valid MongoDB ID")
    .bail()
    .custom(async (departmentId, { req }) => {
      const orgId = req.user.organization._id;
      const dept = await Department.findOne({
        _id: departmentId,
        organization: orgId,
      }).onlyDeleted();
      if (!dept)
        throw new Error(
          "Soft-deleted department not found in your organization"
        );
      return true;
    }),
  (req, _res, next) => {
    req.validated = req.validated || {};
    req.validated.params = { departmentId: req.params.departmentId };
    next();
  },
  handleValidationErrors,
];
