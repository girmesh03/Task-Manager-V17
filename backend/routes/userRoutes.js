// backend/routes/userRoutes.js
import express from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorization.js";
import {
  validateCreateUser,
  validateGetAllUsers,
  validateGetUser,
  validateUpdateUser,
  validateUpdateMyProfile,
  validateGetMyAccount,
  validateGetMyProfile,
  validateDeleteUser,
  validateRestoreUser,
} from "../middlewares/validators/userValidators.js";
import {
  createUser,
  getAllUsers,
  getUser,
  updateUserBy,
  updateMyProfile,
  getMyAccount,
  getMyProfile,
  deleteUser,
  restoreUser,
} from "../controllers/userControllers.js";

const router = express.Router();

router.use(verifyJWT);

/**
 * @json {
 *   "method": "POST",
 *   "path": "/users",
 *   "description": "Create a new user within a specific department",
 *   "validators": ["validateCreateUser"],
 *   "controller": "createUser"
 * }
 */
router.post(
  "/users",
  authorize("User", "create"),
  validateCreateUser,
  createUser
);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/users",
 *   "description": "List users based on authorization scope",
 *   "validators": ["validateGetAllUsers"],
 *   "controller": "getAllUsers"
 * }
 */
router.get(
  "/users",
  authorize("User", "read"),
  validateGetAllUsers,
  getAllUsers
);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/users/:userId",
 *   "description": "Get single user by ID with complete profile",
 *   "validators": ["validateGetUser"],
 *   "controller": "getUser"
 * }
 */
router.get(
  "/users/:userId",
  authorize("User", "read"),
  validateGetUser,
  getUser
);

/**
 * @json {
 *   "method": "PUT",
 *   "path": "/users/:userId",
 *   "description": "Update user by SuperAdmin",
 *   "validators": ["validateUpdateUser"],
 *   "controller": "updateUserBy"
 * }
 */
router.put(
  "/users/:userId",
  authorize("User", "update"),
  validateUpdateUser,
  updateUserBy
);

/**
 * @json {
 *   "method": "PUT",
 *   "path": "/users/:userId/profile",
 *   "description": "Update own user profile with role-based field restrictions",
 *   "validators": ["validateUpdateMyProfile"],
 *   "controller": "updateMyProfile"
 * }
 */
router.put(
  "/users/:userId/profile",
  authorize("User", "update"),
  validateUpdateMyProfile,
  updateMyProfile
);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/users/:userId/account",
 *   "description": "Get current authenticated user's account information",
 *   "validators": ["validateGetMyAccount"],
 *   "controller": "getMyAccount"
 * }
 */
router.get(
  "/users/:userId/account",
  authorize("User", "read"),
  validateGetMyAccount,
  getMyAccount
);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/users/:userId/profile",
 *   "description": "Get current authenticated user's complete profile and dashboard",
 *   "validators": ["validateGetMyProfile"],
 *   "controller": "getMyProfile"
 * }
 */
router.get(
  "/users/:userId/profile",
  authorize("User", "read"),
  validateGetMyProfile,
  getMyProfile
);

/**
 * @json {
 *   "method": "DELETE",
 *   "path": "/users/:userId",
 *   "description": "Soft delete a user with cascade deletion",
 *   "validators": ["validateDeleteUser"],
 *   "controller": "deleteUser"
 * }
 */
router.delete(
  "/users/:userId",
  authorize("User", "delete"),
  validateDeleteUser,
  deleteUser
);

/**
 * @json {
 *   "method": "POST",
 *   "path": "/users/:userId/restore",
 *   "description": "Restore a soft-deleted user",
 *   "validators": ["validateRestoreUser"],
 *   "controller": "restoreUser"
 * }
 */
router.post(
  "/users/:userId/restore",
  authorize("User", "update"),
  validateRestoreUser,
  restoreUser
);

export default router;

