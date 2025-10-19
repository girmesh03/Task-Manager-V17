// backend/routes/materialRoutes.js
import express from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorization.js";
import {
  validateCreateMaterial,
  validateGetAllMaterials,
  validateGetMaterial,
  validateUpdateMaterial,
  validateDeleteMaterial,
  validateRestoreMaterial,
} from "../middlewares/validators/materialValidators.js";
import {
  createMaterial,
  getAllMaterials,
  getMaterial,
  updateMaterial,
  deleteMaterial,
  restoreMaterial,
} from "../controllers/materialControllers.js";

const router = express.Router();

router.use(verifyJWT);

/**
 * @json {
 *   "method": "POST",
 *   "path": "/api/materials",
 *   "middleware": ["verifyJWT", "authorize('Material', 'create')", "validateCreateMaterial"],
 *   "controller": "createMaterial",
 *   "description": "Create a new material within the organization"
 * }
 */
router.post(
  "/",
  authorize("Material", "create"),
  validateCreateMaterial,
  createMaterial
);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/api/materials",
 *   "middleware": ["verifyJWT", "authorize('Material', 'read')", "validateGetAllMaterials"],
 *   "controller": "getAllMaterials",
 *   "description": "List materials based on authorization scope"
 * }
 */
router.get(
  "/",
  authorize("Material", "read"),
  validateGetAllMaterials,
  getAllMaterials
);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/api/materials/:materialId",
 *   "middleware": ["verifyJWT", "authorize('Material', 'read')", "validateGetMaterial"],
 *   "controller": "getMaterial",
 *   "description": "Get single material by ID with complete details"
 * }
 */
router.get(
  "/:materialId",
  authorize("Material", "read"),
  validateGetMaterial,
  getMaterial
);

/**
 * @json {
 *   "method": "PUT",
 *   "path": "/api/materials/:materialId",
 *   "middleware": ["verifyJWT", "authorize('Material', 'update')", "validateUpdateMaterial"],
 *   "controller": "updateMaterial",
 *   "description": "Update material details"
 * }
 */
router.put(
  "/:materialId",
  authorize("Material", "update"),
  validateUpdateMaterial,
  updateMaterial
);

/**
 * @json {
 *   "method": "DELETE",
 *   "path": "/api/materials/:materialId",
 *   "middleware": ["verifyJWT", "authorize('Material', 'delete')", "validateDeleteMaterial"],
 *   "controller": "deleteMaterial",
 *   "description": "Soft delete a material with unlinking from all tasks and activities"
 * }
 */
router.delete(
  "/:materialId",
  authorize("Material", "delete"),
  validateDeleteMaterial,
  deleteMaterial
);

/**
 * @json {
 *   "method": "PATCH",
 *   "path": "/api/materials/:materialId/restore",
 *   "middleware": ["verifyJWT", "authorize('Material', 'update')", "validateRestoreMaterial"],
 *   "controller": "restoreMaterial",
 *   "description": "Restore a soft-deleted material with relinking to all tasks and activities"
 * }
 */
router.patch(
  "/:materialId/restore",
  authorize("Material", "update"),
  validateRestoreMaterial,
  restoreMaterial
);

export default router;
