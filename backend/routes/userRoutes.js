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
 *   "path": "/api/users",
 *   "middleware": ["verifyJWT", "authorize('User', 'create')", "validateCreateUser"],
 *   "controller": "createUser",
 *   "description": "Create a new user within a specific department"
 * }
 */
router.post("/", authorize("User", "create"), validateCreateUser, createUser);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/api/users",
 *   "middleware": ["verifyJWT", "authorize('User', 'read')", "validateGetAllUsers"],
 *   "controller": "getAllUsers",
 *   "description": "List users based on authorization scope"
 * }
 */
router.get("/", authorize("User", "read"), validateGetAllUsers, getAllUsers);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/api/users/:userId",
 *   "middleware": ["verifyJWT", "authorize('User', 'read')", "validateGetUser"],
 *   "controller": "getUser",
 *   "description": "Get single user by ID with complete profile"
 * }
 */
router.get("/:userId", authorize("User", "read"), validateGetUser, getUser);

/**
 * @json {
 *   "method": "PUT",
 *   "path": "/api/users/:userId",
 *   "middleware": ["verifyJWT", "authorize('User', 'update')", "validateUpdateUser"],
 *   "controller": "updateUserBy",
 *   "description": "Update user by SuperAdmin"
 * }
 */
router.put(
  "/:userId",
  authorize("User", "update"),
  validateUpdateUser,
  updateUserBy
);

/**
 * @json {
 *   "method": "PUT",
 *   "path": "/api/users/:userId/profile",
 *   "middleware": ["verifyJWT", "authorize('User', 'update')", "validateUpdateMyProfile"],
 *   "controller": "updateMyProfile",
 *   "description": "Update own user profile with role-based field restrictions"
 * }
 */
router.put(
  "/:userId/profile",
  authorize("User", "update"),
  validateUpdateMyProfile,
  updateMyProfile
);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/api/users/:userId/account",
 *   "middleware": ["verifyJWT", "authorize('User', 'read')", "validateGetMyAccount"],
 *   "controller": "getMyAccount",
 *   "description": "Get current authenticated user's account information"
 * }
 */
router.get(
  "/:userId/account",
  authorize("User", "read"),
  validateGetMyAccount,
  getMyAccount
);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/api/users/:userId/profile",
 *   "middleware": ["verifyJWT", "authorize('User', 'read')", "validateGetMyProfile"],
 *   "controller": "getMyProfile",
 *   "description": "Get current authenticated user's complete profile and dashboard"
 * }
 */
router.get(
  "/:userId/profile",
  authorize("User", "read"),
  validateGetMyProfile,
  getMyProfile
);

/**
 * @json {
 *   "method": "DELETE",
 *   "path": "/api/users/:userId",
 *   "middleware": ["verifyJWT", "authorize('User', 'delete')", "validateDeleteUser"],
 *   "controller": "deleteUser",
 *   "description": "Soft delete a user with cascade deletion"
 * }
 */
router.delete(
  "/:userId",
  authorize("User", "delete"),
  validateDeleteUser,
  deleteUser
);

/**
 * @json {
 *   "method": "PATCH",
 *   "path": "/api/users/:userId/restore",
 *   "middleware": ["verifyJWT", "authorize('User', 'update')", "validateRestoreUser"],
 *   "controller": "restoreUser",
 *   "description": "Restore a soft-deleted user"
 * }
 */
router.patch(
  "/:userId/restore",
  authorize("User", "update"),
  validateRestoreUser,
  restoreUser
);

export default router;
