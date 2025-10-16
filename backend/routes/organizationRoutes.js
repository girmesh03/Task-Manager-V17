// backend/routes/organizationRoutes.js
import express from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorization.js";
import {
  validateGetAllOrganizations,
  validateGetOrganization,
  validateUpdateOrganization,
  validateDeleteOrganization,
  validateRestoreOrganization,
} from "../middlewares/validators/organizationValidators.js";
import {
  getAllOrganizations,
  getOrganizationDashboard,
  updateOrganization,
  deleteOrganization,
  restoreOrganization,
} from "../controllers/organizationControllers.js";

const router = express.Router();

// Apply JWT verification globally for this router
router.use(verifyJWT);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/organizations",
 *   "description": "List organizations based on user authorization",
 *   "validators": ["validateGetAllOrganizations"],
 *   "controller": "getAllOrganizations"
 * }
 */
router.get(
  "/organizations",
  authorize("Organization", "read"),
  validateGetAllOrganizations,
  getAllOrganizations
);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/organizations/:organizationId",
 *   "description": "Get single organization by ID with complete dashboard data",
 *   "validators": ["validateGetOrganization"],
 *   "controller": "getOrganization"
 * }
 */
router.get(
  "/organizations/:organizationId",
  authorize("Organization", "read"),
  validateGetOrganization,
  getOrganizationDashboard
);

/**
 * @json {
 *   "method": "PUT",
 *   "path": "/organizations/:organizationId",
 *   "description": "Update organization details",
 *   "validators": ["validateUpdateOrganization"],
 *   "controller": "updateOrganization"
 * }
 */
router.put(
  "/organizations/:organizationId",
  authorize("Organization", "update"),
  validateUpdateOrganization,
  updateOrganization
);

/**
 * @json {
 *   "method": "DELETE",
 *   "path": "/organizations/:organizationId",
 *   "description": "Soft delete an organization with full cascade deletion",
 *   "validators": ["validateDeleteOrganization"],
 *   "controller": "deleteOrganization"
 * }
 */
router.delete(
  "/organizations/:organizationId",
  authorize("Organization", "delete"),
  validateDeleteOrganization,
  deleteOrganization
);

/**
 * @json {
 *   "method": "POST",
 *   "path": "/organizations/:organizationId/restore",
 *   "description": "Restore a soft-deleted organization",
 *   "validators": ["validateRestoreOrganization"],
 *   "controller": "restoreOrganization"
 * }
 */
router.post(
  "/organizations/:organizationId/restore",
  authorize("Organization", "update"),
  validateRestoreOrganization,
  restoreOrganization
);

export default router;
