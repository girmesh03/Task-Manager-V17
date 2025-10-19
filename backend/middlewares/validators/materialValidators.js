// backend/middlewares/validators/materialValidators.js
import { body, param, query } from "express-validator";
import { handleValidationErrors } from "./validation.js";
import { Material, Department } from "../../models/index.js";
import { escapeRegex } from "../../utils/helpers.js";
import {
  MATERIAL_UNIT_TYPES,
  MATERIAL_CATEGORIES,
  MAX_MATERIAL_NAME_LENGTH,
  MAX_MATERIAL_PRICE,
} from "../../utils/constants.js";

/**
 * @json {
 *   "route": "POST /materials",
 *   "purpose": "Create a new material within the organization",
 *   "validates": ["name","unit","price","category"],
 *   "rules": [
 *     "Name required with length and org-unique (including soft-deleted)",
 *     "Unit in MATERIAL_UNIT_TYPES",
 *     "Price numeric within range",
 *     "Category in MATERIAL_CATEGORIES",
 *     "Attach sanitized body to req.validated.body"
 *   ]
 * }
 */
export const validateCreateMaterial = [
  body("name")
    .exists({ checkFalsy: true })
    .withMessage("Material name is required")
    .bail()
    .isString()
    .withMessage("Material name must be a string")
    .trim()
    .isLength({ min: 1, max: MAX_MATERIAL_NAME_LENGTH })
    .withMessage(
      `Material name cannot exceed ${MAX_MATERIAL_NAME_LENGTH} characters`
    )
    .bail()
    .custom(async (name, { req }) => {
      const existing = await Material.findOne({
        organization: req.user.organization._id,
        name: { $regex: new RegExp(`^${escapeRegex(name.trim())}$`, "i") },
      }).withDeleted();
      if (existing)
        throw new Error("Material name already exists in your organization");
      return true;
    }),
  body("unit")
    .exists({ checkFalsy: true })
    .withMessage("Unit is required")
    .bail()
    .isIn(MATERIAL_UNIT_TYPES)
    .withMessage(`Unit must be one of: ${MATERIAL_UNIT_TYPES.join(", ")}`),
  body("price")
    .exists({ checkFalsy: true })
    .withMessage("Price is required")
    .bail()
    .isFloat({ min: 0, max: MAX_MATERIAL_PRICE })
    .withMessage(`Price must be between 0 and ${MAX_MATERIAL_PRICE}`),
  body("category")
    .exists({ checkFalsy: true })
    .withMessage("Category is required")
    .bail()
    .isIn(MATERIAL_CATEGORIES)
    .withMessage(`Category must be one of: ${MATERIAL_CATEGORIES.join(", ")}`),
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
      unit: b.unit,
      price: Number(b.price),
      category: b.category,
    };
    return true;
  }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "GET /materials",
 *   "purpose": "List materials based on authorization scope",
 *   "validates": ["page","limit","search","category","departmentId","deleted","priceMin","priceMax","sortBy","sortOrder"],
 *   "rules": [
 *     "Pagination integers",
 *     "Optional search string and category filter",
 *     "Optional departmentId must belong to org",
 *     "Optional price range filtering",
 *     "Attach sanitized query to req.validated.query"
 *   ]
 * }
 */
export const validateGetAllMaterials = [
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
  query("category")
    .optional({ nullable: true })
    .isIn(MATERIAL_CATEGORIES)
    .withMessage(`Category must be one of: ${MATERIAL_CATEGORIES.join(", ")}`),
  query("departmentId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("departmentId must be a valid MongoDB ID")
    .bail()
    .custom(async (departmentId, { req }) => {
      if (!departmentId) return true;
      const dept = await Department.findOne({
        _id: departmentId,
        organization: req.user.organization._id,
        isDeleted: false,
      });
      if (!dept) throw new Error("Department not found in your organization");
      return true;
    }),
  query("deleted")
    .optional()
    .isBoolean()
    .withMessage("Deleted must be a boolean")
    .toBoolean(),
  query("priceMin")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("priceMin must be >= 0")
    .toFloat(),
  query("priceMax")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("priceMax must be >= 0")
    .toFloat(),
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
      category: req.query.category,
      departmentId: req.query.departmentId,
      deleted: req.query.deleted === true || req.query.deleted === "true",
      priceMin:
        req.query.priceMin !== undefined
          ? Number(req.query.priceMin)
          : undefined,
      priceMax:
        req.query.priceMax !== undefined
          ? Number(req.query.priceMax)
          : undefined,
      sortBy: req.query.sortBy?.trim(),
      sortOrder: req.query.sortOrder || "desc",
    };
    return true;
  }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "GET /materials/:materialId",
 *   "purpose": "Get single material by ID with complete details including usage statistics and recent tasks/activities",
 *   "validates": ["materialId","includeUsage","includeTasks","includeActivities"],
 *   "rules": [
 *     "materialId must be valid and belong to org",
 *     "Optional booleans for includes",
 *     "Attach sanitized params/query to req.validated"
 *   ]
 * }
 */
export const validateGetMaterial = [
  param("materialId")
    .isMongoId()
    .withMessage("Material ID must be a valid MongoDB ID")
    .bail()
    .custom(async (materialId, { req }) => {
      const material = await Material.findOne({
        _id: materialId,
        organization: req.user.organization._id,
      }).withDeleted();
      if (!material) throw new Error("Material not found in your organization");
      return true;
    }),
  query("includeUsage")
    .optional()
    .isBoolean()
    .withMessage("includeUsage must be a boolean")
    .toBoolean(),
  query("includeTasks")
    .optional()
    .isBoolean()
    .withMessage("includeTasks must be a boolean")
    .toBoolean(),
  query("includeActivities")
    .optional()
    .isBoolean()
    .withMessage("includeActivities must be a boolean")
    .toBoolean(),
  (req, _res, next) => {
    req.validated = req.validated || {};
    req.validated.params = { materialId: req.params.materialId };
    req.validated.query = {
      includeUsage:
        req.query.includeUsage === true || req.query.includeUsage === "true",
      includeTasks:
        req.query.includeTasks === true || req.query.includeTasks === "true",
      includeActivities:
        req.query.includeActivities === true ||
        req.query.includeActivities === "true",
    };
    next();
  },
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "PUT /materials/:materialId",
 *   "purpose": "Update material details",
 *   "validates": ["materialId","name","unit","price","category"],
 *   "rules": [
 *     "materialId must exist in org",
 *     "Optional fields with same constraints as create",
 *     "Org-unique name excluding current",
 *     "Attach sanitized body/params to req.validated"
 *   ]
 * }
 */
export const validateUpdateMaterial = [
  param("materialId")
    .isMongoId()
    .withMessage("Material ID must be a valid MongoDB ID")
    .bail()
    .custom(async (materialId, { req }) => {
      const material = await Material.findOne({
        _id: materialId,
        organization: req.user.organization._id,
      }).withDeleted();
      if (!material) throw new Error("Material not found in your organization");
      return true;
    }),
  body("name")
    .optional({ nullable: true })
    .isString()
    .withMessage("Material name must be a string")
    .trim()
    .isLength({ min: 1, max: MAX_MATERIAL_NAME_LENGTH })
    .withMessage(
      `Material name cannot exceed ${MAX_MATERIAL_NAME_LENGTH} characters`
    )
    .bail()
    .custom(async (name, { req }) => {
      const existing = await Material.findOne({
        organization: req.user.organization._id,
        name: { $regex: new RegExp(`^${escapeRegex(name.trim())}$`, "i") },
        _id: { $ne: req.params.materialId },
      }).withDeleted();
      if (existing)
        throw new Error("Material name already exists in your organization");
      return true;
    }),
  body("unit")
    .optional({ nullable: true })
    .isIn(MATERIAL_UNIT_TYPES)
    .withMessage(`Unit must be one of: ${MATERIAL_UNIT_TYPES.join(", ")}`),
  body("price")
    .optional({ nullable: true })
    .isFloat({ min: 0, max: MAX_MATERIAL_PRICE })
    .withMessage(`Price must be between 0 and ${MAX_MATERIAL_PRICE}`),
  body("category")
    .optional({ nullable: true })
    .isIn(MATERIAL_CATEGORIES)
    .withMessage(`Category must be one of: ${MATERIAL_CATEGORIES.join(", ")}`),
  body("organizationId")
    .not()
    .exists()
    .withMessage(
      "organizationId cannot be provided. Organization is determined from authentication context"
    ),
  body().custom((_, { req }) => {
    req.validated = req.validated || {};
    const b = req.body;
    req.validated.params = { materialId: req.params.materialId };
    req.validated.body = {
      name: b.name?.trim(),
      unit: b.unit,
      price: b.price !== undefined ? Number(b.price) : undefined,
      category: b.category,
    };
    return true;
  }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "DELETE /materials/:materialId",
 *   "purpose": "Soft delete a material with unlinking from all tasks and activities",
 *   "validates": ["materialId"],
 *   "rules": [
 *     "materialId must be valid and belong to org",
 *     "Attach sanitized params to req.validated.params"
 *   ]
 * }
 */
export const validateDeleteMaterial = [
  param("materialId")
    .isMongoId()
    .withMessage("Material ID must be a valid MongoDB ID")
    .bail()
    .custom(async (materialId, { req }) => {
      const material = await Material.findOne({
        _id: materialId,
        organization: req.user.organization._id,
      });
      if (!material) throw new Error("Material not found in your organization");
      return true;
    }),
  (req, _res, next) => {
    req.validated = req.validated || {};
    req.validated.params = { materialId: req.params.materialId };
    next();
  },
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "POST /materials/:materialId/restore",
 *   "purpose": "Restore a soft-deleted material with relinking to all tasks and activities",
 *   "validates": ["materialId"],
 *   "rules": [
 *     "materialId must be valid and belong to org",
 *     "Material must be soft-deleted",
 *     "Attach sanitized params to req.validated.params"
 *   ]
 * }
 */
export const validateRestoreMaterial = [
  param("materialId")
    .isMongoId()
    .withMessage("Material ID must be a valid MongoDB ID")
    .bail()
    .custom(async (materialId, { req }) => {
      const material = await Material.findOne({
        _id: materialId,
        organization: req.user.organization._id,
      }).onlyDeleted();
      if (!material)
        throw new Error("Soft-deleted material not found in your organization");
      return true;
    }),
  (req, _res, next) => {
    req.validated = req.validated || {};
    req.validated.params = { materialId: req.params.materialId };
    next();
  },
  handleValidationErrors,
];
