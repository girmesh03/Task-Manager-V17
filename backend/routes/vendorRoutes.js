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
 *   "path": "/vendors",
 *   "description": "Create a new vendor for the organization",
 *   "validators": ["validateCreateVendor"],
 *   "controller": "createVendor"
 * }
 */
router.post(
  "/vendors",
  authorize("Vendor", "create"),
  validateCreateVendor,
  createVendor
);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/vendors",
 *   "description": "List vendors in the organization with pagination and search",
 *   "validators": ["validateGetAllVendors"],
 *   "controller": "getAllVendors"
 * }
 */
router.get(
  "/vendors",
  authorize("Vendor", "read"),
  validateGetAllVendors,
  getAllVendors
);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/vendors/:vendorId",
 *   "description": "Get single vendor by ID with complete details",
 *   "validators": ["validateGetVendor"],
 *   "controller": "getVendor"
 * }
 */
router.get(
  "/vendors/:vendorId",
  authorize("Vendor", "read"),
  validateGetVendor,
  getVendor
);

/**
 * @json {
 *   "method": "PUT",
 *   "path": "/vendors/:vendorId",
 *   "description": "Update vendor details",
 *   "validators": ["validateUpdateVendor"],
 *   "controller": "updateVendor"
 * }
 */
router.put(
  "/vendors/:vendorId",
  authorize("Vendor", "update"),
  validateUpdateVendor,
  updateVendor
);

/**
 * @json {
 *   "method": "DELETE",
 *   "path": "/vendors/:vendorId",
 *   "description": "Soft delete a vendor with reassignment option for active project tasks",
 *   "validators": ["validateDeleteVendor"],
 *   "controller": "deleteVendor"
 * }
 */
router.delete(
  "/vendors/:vendorId",
  authorize("Vendor", "delete"),
  validateDeleteVendor,
  deleteVendor
);

/**
 * @json {
 *   "method": "POST",
 *   "path": "/vendors/:vendorId/restore",
 *   "description": "Restore a soft-deleted vendor",
 *   "validators": ["validateRestoreVendor"],
 *   "controller": "restoreVendor"
 * }
 */
router.post(
  "/vendors/:vendorId/restore",
  authorize("Vendor", "update"),
  validateRestoreVendor,
  restoreVendor
);

export default router;
