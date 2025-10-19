// backend/middlewares/validators/attachmentValidators.js
import { body, param, query } from "express-validator";
import { handleValidationErrors } from "./validation.js";
import { Attachment } from "../../models/index.js";
import mongoose from "mongoose";
import {
  ATTACHMENT_TYPES,
  ATTACHMENT_PARENT_MODELS,
  MAX_FILENAME_LENGTH,
} from "../../utils/constants.js";

/**
 * @json {
 *   "route": "POST /api/attachments",
 *   "purpose": "Create a new attachment for a parent entity",
 *   "validates": ["originalName", "storedName", "mimeType", "size", "type", "url", "publicId", "parent", "parentModel"],
 *   "rules": [
 *     "All required fields must be provided",
 *     "Type must be in ATTACHMENT_TYPES",
 *     "ParentModel must be in ATTACHMENT_PARENT_MODELS",
 *     "Parent must be valid ObjectId",
 *     "Organization and department determined from auth context",
 *     "Attach sanitized body to req.validated.body"
 *   ]
 * }
 */
export const validateCreateAttachment = [
  body("originalName")
    .exists({ checkFalsy: true })
    .withMessage("Original file name is required")
    .bail()
    .isString()
    .withMessage("Original file name must be a string")
    .trim()
    .isLength({ min: 1, max: MAX_FILENAME_LENGTH })
    .withMessage(
      `Original file name cannot exceed ${MAX_FILENAME_LENGTH} characters`
    ),
  body("storedName")
    .optional()
    .isString()
    .withMessage("Stored name must be a string")
    .trim()
    .isLength({ max: MAX_FILENAME_LENGTH })
    .withMessage(`Stored name cannot exceed ${MAX_FILENAME_LENGTH} characters`),
  body("mimeType")
    .exists({ checkFalsy: true })
    .withMessage("MIME type is required")
    .bail()
    .isString()
    .withMessage("MIME type must be a string")
    .trim(),
  body("size")
    .exists({ checkFalsy: true })
    .withMessage("File size is required")
    .bail()
    .isInt({ min: 0 })
    .withMessage("File size must be a non-negative integer"),
  body("type")
    .exists({ checkFalsy: true })
    .withMessage("Attachment type is required")
    .bail()
    .isIn(ATTACHMENT_TYPES)
    .withMessage(`Type must be one of: ${ATTACHMENT_TYPES.join(", ")}`),
  body("url")
    .exists({ checkFalsy: true })
    .withMessage("File URL is required")
    .bail()
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("File URL must be a valid HTTP or HTTPS URL"),
  body("publicId")
    .exists({ checkFalsy: true })
    .withMessage("Cloudinary publicId is required")
    .bail()
    .isString()
    .withMessage("PublicId must be a string")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("PublicId must be between 1 and 255 characters"),
  body("format")
    .optional()
    .isString()
    .withMessage("Format must be a string")
    .trim(),
  body("width")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Width must be a non-negative integer"),
  body("height")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Height must be a non-negative integer"),
  body("parent")
    .exists({ checkFalsy: true })
    .withMessage("Parent reference is required")
    .bail()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Parent must be a valid ObjectId");
      }
      return true;
    }),
  body("parentModel")
    .exists({ checkFalsy: true })
    .withMessage("Parent model is required")
    .bail()
    .isIn(ATTACHMENT_PARENT_MODELS)
    .withMessage(
      `Parent model must be one of: ${ATTACHMENT_PARENT_MODELS.join(", ")}`
    ),
  body("organizationId")
    .not()
    .exists()
    .withMessage(
      "organizationId cannot be provided. Organization is determined from authentication context"
    ),
  body("departmentId")
    .not()
    .exists()
    .withMessage(
      "departmentId cannot be provided. Department is determined from authentication context"
    ),
  body().custom((_, { req }) => {
    req.validated = req.validated || {};
    const b = req.body;
    req.validated.body = {
      originalName: b.originalName?.trim(),
      storedName: b.storedName?.trim(),
      mimeType: b.mimeType?.trim(),
      size: Number(b.size),
      type: b.type,
      url: b.url,
      publicId: b.publicId?.trim(),
      format: b.format?.trim(),
      width: b.width ? Number(b.width) : undefined,
      height: b.height ? Number(b.height) : undefined,
      parent: b.parent,
      parentModel: b.parentModel,
    };
    return true;
  }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "GET /api/attachments/:attachmentId",
 *   "purpose": "Get a specific attachment by ID",
 *   "validates": ["attachmentId"],
 *   "rules": [
 *     "AttachmentId must be valid ObjectId",
 *     "Attach sanitized params to req.validated.params"
 *   ]
 * }
 */
export const validateGetAttachment = [
  param("attachmentId")
    .exists({ checkFalsy: true })
    .withMessage("Attachment ID is required")
    .bail()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Attachment ID must be a valid ObjectId");
      }
      return true;
    }),
  (req, res, next) => {
    req.validated = req.validated || {};
    req.validated.params = {
      attachmentId: req.params.attachmentId,
    };
    next();
  },
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "PATCH /api/attachments/:attachmentId",
 *   "purpose": "Update an attachment's metadata",
 *   "validates": ["attachmentId", "originalName", "storedName"],
 *   "rules": [
 *     "AttachmentId must be valid ObjectId",
 *     "Only originalName and storedName can be updated",
 *     "At least one field must be provided",
 *     "Attach sanitized data to req.validated"
 *   ]
 * }
 */
export const validateUpdateAttachment = [
  param("attachmentId")
    .exists({ checkFalsy: true })
    .withMessage("Attachment ID is required")
    .bail()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Attachment ID must be a valid ObjectId");
      }
      return true;
    }),
  body("originalName")
    .optional()
    .isString()
    .withMessage("Original file name must be a string")
    .trim()
    .isLength({ min: 1, max: MAX_FILENAME_LENGTH })
    .withMessage(
      `Original file name cannot exceed ${MAX_FILENAME_LENGTH} characters`
    ),
  body("storedName")
    .optional()
    .isString()
    .withMessage("Stored name must be a string")
    .trim()
    .isLength({ min: 1, max: MAX_FILENAME_LENGTH })
    .withMessage(`Stored name cannot exceed ${MAX_FILENAME_LENGTH} characters`),
  body().custom((value, { req }) => {
    const allowedFields = ["originalName", "storedName"];
    const providedFields = Object.keys(req.body);
    const hasValidField = providedFields.some((field) =>
      allowedFields.includes(field)
    );

    if (!hasValidField) {
      throw new Error(
        "At least one field (originalName or storedName) must be provided for update"
      );
    }

    const invalidFields = providedFields.filter(
      (field) => !allowedFields.includes(field)
    );
    if (invalidFields.length > 0) {
      throw new Error(
        `Invalid fields for update: ${invalidFields.join(
          ", "
        )}. Only originalName and storedName can be updated.`
      );
    }

    return true;
  }),
  body().custom((_, { req }) => {
    req.validated = req.validated || {};
    const b = req.body;
    req.validated.params = {
      attachmentId: req.params.attachmentId,
    };
    req.validated.body = {};
    if (b.originalName !== undefined) {
      req.validated.body.originalName = b.originalName.trim();
    }
    if (b.storedName !== undefined) {
      req.validated.body.storedName = b.storedName.trim();
    }
    return true;
  }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "DELETE /api/attachments/:attachmentId",
 *   "purpose": "Soft delete an attachment",
 *   "validates": ["attachmentId"],
 *   "rules": [
 *     "AttachmentId must be valid ObjectId",
 *     "Attach sanitized params to req.validated.params"
 *   ]
 * }
 */
export const validateDeleteAttachment = [
  param("attachmentId")
    .exists({ checkFalsy: true })
    .withMessage("Attachment ID is required")
    .bail()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Attachment ID must be a valid ObjectId");
      }
      return true;
    }),
  (req, res, next) => {
    req.validated = req.validated || {};
    req.validated.params = {
      attachmentId: req.params.attachmentId,
    };
    next();
  },
  handleValidationErrors,
];
