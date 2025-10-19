// backend/routes/vendorRoutes.js
import express from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorization.js";
import {
  validateCreateVendor,
  validateGetAllVendors,
  validateGetVendor,
  validateUpdateVendor,
  validateDeleteVendor,
  validateRestoreVendor,
} from "../middlewares/validators/vendorValidators.js";
import {
  createVendor,
  getAllVendors,
  getVendor,
  updateVendor,
  deleteVendor,
  restoreVendor,
} from "../controllers/vendorControllers.js";

const router = express.Router();

router.use(verifyJWT);

/**
 * @json {
 *   "method": "POST",
 *   "path": "/api/vendors",
 *   "middleware": ["verifyJWT", "authorize('Vendor', 'create')", "validateCreateVendor"],
 *   "controller": "createVendor",
 *   "description": "Create a new vendor for the organization"
 * }
 */
router.post(
  "/",
  authorize("Vendor", "create"),
  validateCreateVendor,
  createVendor
);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/api/vendors",
 *   "middleware": ["verifyJWT", "authorize('Vendor', 'read')", "validateGetAllVendors"],
 *   "controller": "getAllVendors",
 *   "description": "List vendors in the organization with pagination and search"
 * }
 */
router.get(
  "/",
  authorize("Vendor", "read"),
  validateGetAllVendors,
  getAllVendors
);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/api/vendors/:vendorId",
 *   "middleware": ["verifyJWT", "authorize('Vendor', 'read')", "validateGetVendor"],
 *   "controller": "getVendor",
 *   "description": "Get single vendor by ID with complete details"
 * }
 */
router.get(
  "/:vendorId",
  authorize("Vendor", "read"),
  validateGetVendor,
  getVendor
);

/**
 * @json {
 *   "method": "PUT",
 *   "path": "/api/vendors/:vendorId",
 *   "middleware": ["verifyJWT", "authorize('Vendor', 'update')", "validateUpdateVendor"],
 *   "controller": "updateVendor",
 *   "description": "Update vendor details"
 * }
 */
router.put(
  "/:vendorId",
  authorize("Vendor", "update"),
  validateUpdateVendor,
  updateVendor
);

/**
 * @json {
 *   "method": "DELETE",
 *   "path": "/api/vendors/:vendorId",
 *   "middleware": ["verifyJWT", "authorize('Vendor', 'delete')", "validateDeleteVendor"],
 *   "controller": "deleteVendor",
 *   "description": "Soft delete a vendor with reassignment option for active project tasks"
 * }
 */
router.delete(
  "/:vendorId",
  authorize("Vendor", "delete"),
  validateDeleteVendor,
  deleteVendor
);

/**
 * @json {
 *   "method": "PATCH",
 *   "path": "/api/vendors/:vendorId/restore",
 *   "middleware": ["verifyJWT", "authorize('Vendor', 'update')", "validateRestoreVendor"],
 *   "controller": "restoreVendor",
 *   "description": "Restore a soft-deleted vendor"
 * }
 */
router.patch(
  "/:vendorId/restore",
  authorize("Vendor", "update"),
  validateRestoreVendor,
  restoreVendor
);

export default router;
