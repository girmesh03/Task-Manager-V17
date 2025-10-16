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
 *   "path": "/materials",
 *   "description": "Create a new material within the organization",
 *   "validators": ["validateCreateMaterial"],
 *   "controller": "createMaterial"
 * }
 */
router.post(
  "/materials",
  authorize("Material", "create"),
  validateCreateMaterial,
  createMaterial
);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/materials",
 *   "description": "List materials based on authorization scope",
 *   "validators": ["validateGetAllMaterials"],
 *   "controller": "getAllMaterials"
 * }
 */
router.get(
  "/materials",
  authorize("Material", "read"),
  validateGetAllMaterials,
  getAllMaterials
);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/materials/:materialId",
 *   "description": "Get single material by ID with complete details",
 *   "validators": ["validateGetMaterial"],
 *   "controller": "getMaterial"
 * }
 */
router.get(
  "/materials/:materialId",
  authorize("Material", "read"),
  validateGetMaterial,
  getMaterial
);

/**
 * @json {
 *   "method": "PUT",
 *   "path": "/materials/:materialId",
 *   "description": "Update material details",
 *   "validators": ["validateUpdateMaterial"],
 *   "controller": "updateMaterial"
 * }
 */
router.put(
  "/materials/:materialId",
  authorize("Material", "update"),
  validateUpdateMaterial,
  updateMaterial
);

/**
 * @json {
 *   "method": "DELETE",
 *   "path": "/materials/:materialId",
 *   "description": "Soft delete a material with unlinking from all tasks and activities",
 *   "validators": ["validateDeleteMaterial"],
 *   "controller": "deleteMaterial"
 * }
 */
router.delete(
  "/materials/:materialId",
  authorize("Material", "delete"),
  validateDeleteMaterial,
  deleteMaterial
);

/**
 * @json {
 *   "method": "POST",
 *   "path": "/materials/:materialId/restore",
 *   "description": "Restore a soft-deleted material with relinking to all tasks and activities",
 *   "validators": ["validateRestoreMaterial"],
 *   "controller": "restoreMaterial"
 * }
 */
router.post(
  "/materials/:materialId/restore",
  authorize("Material", "update"),
  validateRestoreMaterial,
  restoreMaterial
);

export default router;
