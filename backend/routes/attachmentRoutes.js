// backend/routes/attachmentRoutes.js
import express from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorization.js";
import {
  validateCreateAttachment,
  validateUpdateAttachment,
  validateGetAttachment,
  validateDeleteAttachment,
} from "../middlewares/validators/attachmentValidators.js";
import {
  createAttachment,
  getAttachment,
  getAllAttachments,
  updateAttachment,
  deleteAttachment,
} from "../controllers/attachmentControllers.js";

const router = express.Router();

/**
 * @json {
 *   "method": "POST",
 *   "path": "/api/attachments",
 *   "middleware": ["verifyJWT", "authorize('Attachment', 'create')", "validateCreateAttachment"],
 *   "controller": "createAttachment",
 *   "description": "Create a new attachment for a parent entity (task, activity, or comment)"
 * }
 */
router.post(
  "/",
  verifyJWT,
  authorize("Attachment", "create"),
  validateCreateAttachment,
  createAttachment
);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/api/attachments",
 *   "middleware": ["verifyJWT", "authorize('Attachment', 'read')"],
 *   "controller": "getAllAttachments",
 *   "description": "Get all attachments with pagination and filtering"
 * }
 */
router.get("/", verifyJWT, authorize("Attachment", "read"), getAllAttachments);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/api/attachments/:attachmentId",
 *   "middleware": ["verifyJWT", "authorize('Attachment', 'read')", "validateGetAttachment"],
 *   "controller": "getAttachment",
 *   "description": "Get a specific attachment by ID with populated references"
 * }
 */
router.get(
  "/:attachmentId",
  verifyJWT,
  authorize("Attachment", "read"),
  validateGetAttachment,
  getAttachment
);

/**
 * @json {
 *   "method": "PATCH",
 *   "path": "/api/attachments/:attachmentId",
 *   "middleware": ["verifyJWT", "authorize('Attachment', 'update')", "validateUpdateAttachment"],
 *   "controller": "updateAttachment",
 *   "description": "Update an attachment's metadata"
 * }
 */
router.patch(
  "/:attachmentId",
  verifyJWT,
  authorize("Attachment", "update"),
  validateUpdateAttachment,
  updateAttachment
);

/**
 * @json {
 *   "method": "DELETE",
 *   "path": "/api/attachments/:attachmentId",
 *   "middleware": ["verifyJWT", "authorize('Attachment', 'delete')", "validateDeleteAttachment"],
 *   "controller": "deleteAttachment",
 *   "description": "Soft delete an attachment and schedule Cloudinary cleanup"
 * }
 */
router.delete(
  "/:attachmentId",
  verifyJWT,
  authorize("Attachment", "delete"),
  validateDeleteAttachment,
  deleteAttachment
);

export default router;
