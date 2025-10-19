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
 *   "path": "/api/departments",
 *   "middleware": ["verifyJWT", "authorize('Department', 'create')", "validateCreateDepartment"],
 *   "controller": "createDepartment",
 *   "description": "Create a new department within the authenticated user's organization"
 * }
 */
router.post(
  "/",
  authorize("Department", "create"),
  validateCreateDepartment,
  createDepartment
);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/api/departments",
 *   "middleware": ["verifyJWT", "authorize('Department', 'read')", "validateGetAllDepartments"],
 *   "controller": "getAllDepartments",
 *   "description": "List departments based on authorization scope (organization from auth context)"
 * }
 */
router.get(
  "/",
  authorize("Department", "read"),
  validateGetAllDepartments,
  getAllDepartments
);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/api/departments/:departmentId",
 *   "middleware": ["verifyJWT", "authorize('Department', 'read')", "validateGetDepartment"],
 *   "controller": "getDepartment",
 *   "description": "Get single department by ID with complete dashboard"
 * }
 */
router.get(
  "/:departmentId",
  authorize("Department", "read"),
  validateDeleteDepartment,
  getDepartment
);

/**
 * @json {
 *   "method": "PUT",
 *   "path": "/api/departments/:departmentId",
 *   "middleware": ["verifyJWT", "authorize('Department', 'update')", "validateUpdateDepartment"],
 *   "controller": "updateDepartment",
 *   "description": "Update department details (organization from auth context)"
 * }
 */
router.put(
  "/:departmentId",
  authorize("Department", "update"),
  validateUpdateDepartment,
  updateDepartment
);

/**
 * @json {
 *   "method": "DELETE",
 *   "path": "/api/departments/:departmentId",
 *   "middleware": ["verifyJWT", "authorize('Department', 'delete')", "validateDeleteDepartment"],
 *   "controller": "deleteDepartment",
 *   "description": "Soft delete a department with full cascade deletion"
 * }
 */
router.delete(
  "/:departmentId",
  authorize("Department", "delete"),
  validateDeleteDepartment,
  deleteDepartment
);

/**
 * @json {
 *   "method": "PATCH",
 *   "path": "/api/departments/:departmentId/restore",
 *   "middleware": ["verifyJWT", "authorize('Department', 'update')", "validateRestoreDepartment"],
 *   "controller": "restoreDepartment",
 *   "description": "Restore a soft-deleted department"
 * }
 */
router.patch(
  "/:departmentId/restore",
  authorize("Department", "update"),
  validateRestoreDepartment,
  restoreDepartment
);

export default router;
