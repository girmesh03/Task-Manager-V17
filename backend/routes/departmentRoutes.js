// backend/routes/departmentRoutes.js
import express from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorization.js";
import {
  validateCreateDepartment,
  validateGetAllDepartments,
  validateUpdateDepartment,
  validateDeleteDepartment,
  validateRestoreDepartment,
} from "../middlewares/validators/departmentValidators.js";
import {
  createDepartment,
  getAllDepartments,
  getDepartment,
  updateDepartment,
  deleteDepartment,
  restoreDepartment,
} from "../controllers/departmentControllers.js";

const router = express.Router();

router.use(verifyJWT);

/**
 * @json {
 *   "method": "POST",
 *   "path": "/departments",
 *   "description": "Create a new department within the user's organization",
 *   "validators": ["validateCreateDepartment"],
 *   "controller": "createDepartment"
 * }
 */
router.post(
  "/departments",
  authorize("Department", "create"),
  validateCreateDepartment,
  createDepartment
);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/departments",
 *   "description": "List departments based on authorization scope",
 *   "validators": ["validateGetAllDepartments"],
 *   "controller": "getAllDepartments"
 * }
 */
router.get(
  "/departments",
  authorize("Department", "read"),
  validateGetAllDepartments,
  getAllDepartments
);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/departments/:departmentId",
 *   "description": "Get single department by ID with complete dashboard",
 *   "validators": ["validateGetDepartment"],
 *   "controller": "getDepartment"
 * }
 */
router.get(
  "/departments/:departmentId",
  authorize("Department", "read"),
  validateDeleteDepartment,
  getDepartment
);

/**
 * @json {
 *   "method": "PUT",
 *   "path": "/departments/:departmentId",
 *   "description": "Update department details",
 *   "validators": ["validateUpdateDepartment"],
 *   "controller": "updateDepartment"
 * }
 */
router.put(
  "/departments/:departmentId",
  authorize("Department", "update"),
  validateUpdateDepartment,
  updateDepartment
);

/**
 * @json {
 *   "method": "DELETE",
 *   "path": "/departments/:departmentId",
 *   "description": "Soft delete a department with full cascade deletion",
 *   "validators": ["validateDeleteDepartment"],
 *   "controller": "deleteDepartment"
 * }
 */
router.delete(
  "/departments/:departmentId",
  authorize("Department", "delete"),
  validateDeleteDepartment,
  deleteDepartment
);

/**
 * @json {
 *   "method": "POST",
 *   "path": "/departments/:departmentId/restore",
 *   "description": "Restore a soft-deleted department",
 *   "validators": ["validateRestoreDepartment"],
 *   "controller": "restoreDepartment"
 * }
 */
router.post(
  "/departments/:departmentId/restore",
  authorize("Department", "update"),
  validateRestoreDepartment,
  restoreDepartment
);

export default router;
