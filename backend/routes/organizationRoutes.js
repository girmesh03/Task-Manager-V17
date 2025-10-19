// backend/routes/organizationRoutes.js
import express from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import {
  authorize,
  requirePlatformUser,
} from "../middlewares/authorization.js";
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
 *   "path": "/api/organizations",
 *   "middleware": ["verifyJWT", "authorize('Organization', 'read')", "validateGetAllOrganizations"],
 *   "controller": "getAllOrganizations",
 *   "description": "List organizations based on user authorization"
 * }
 */
router.get(
  "/",
  authorize("Organization", "read"),
  validateGetAllOrganizations,
  getAllOrganizations
);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/api/organizations/:organizationId",
 *   "middleware": ["verifyJWT", "authorize('Organization', 'read')", "validateGetOrganization"],
 *   "controller": "getOrganizationDashboard",
 *   "description": "Get single organization by ID with complete dashboard data"
 * }
 */
router.get(
  "/:organizationId",
  authorize("Organization", "read"),
  validateGetOrganization,
  getOrganizationDashboard
);

/**
 * @json {
 *   "method": "PUT",
 *   "path": "/api/organizations/:organizationId",
 *   "middleware": ["verifyJWT", "authorize('Organization', 'update')", "validateUpdateOrganization"],
 *   "controller": "updateOrganization",
 *   "description": "Update organization details"
 * }
 */
router.put(
  "/:organizationId",
  authorize("Organization", "update"),
  validateUpdateOrganization,
  updateOrganization
);

/**
 * @json {
 *   "method": "DELETE",
 *   "path": "/api/organizations/:organizationId",
 *   "middleware": ["verifyJWT", "requirePlatformUser", "authorize('Organization', 'delete')", "validateDeleteOrganization"],
 *   "controller": "deleteOrganization",
 *   "description": "Soft delete an organization with full cascade deletion (Platform users only)"
 * }
 */
router.delete(
  "/:organizationId",
  requirePlatformUser,
  authorize("Organization", "delete"),
  validateDeleteOrganization,
  deleteOrganization
);

/**
 * @json {
 *   "method": "PATCH",
 *   "path": "/api/organizations/:organizationId/restore",
 *   "middleware": ["verifyJWT", "requirePlatformUser", "authorize('Organization', 'update')", "validateRestoreOrganization"],
 *   "controller": "restoreOrganization",
 *   "description": "Restore a soft-deleted organization (Platform users only)"
 * }
 */
router.patch(
  "/:organizationId/restore",
  requirePlatformUser,
  authorize("Organization", "update"),
  validateRestoreOrganization,
  restoreOrganization
);

export default router;
