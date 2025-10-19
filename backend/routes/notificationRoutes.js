// backend/routes/notificationRoutes.js
import express from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorization.js";
import {
  validateGetAllNotifications,
  validateMarkNotificationRead,
  validateGetUnreadCount,
} from "../middlewares/validators/notificationValidators.js";
import {
  getAllNotifications,
  markNotificationRead,
  getUnreadCount,
} from "../controllers/notificationControllers.js";

const router = express.Router();

router.use(verifyJWT);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/api/notifications",
 *   "middleware": ["verifyJWT", "authorize('Notification', 'read')", "validateGetAllNotifications"],
 *   "controller": "getAllNotifications",
 *   "description": "Get user notifications with pagination"
 * }
 */
router.get(
  "/",
  authorize("Notification", "read"),
  validateGetAllNotifications,
  getAllNotifications
);

/**
 * @json {
 *   "method": "PATCH",
 *   "path": "/api/notifications/:notificationId/read",
 *   "middleware": ["verifyJWT", "authorize('Notification', 'update')", "validateMarkNotificationRead"],
 *   "controller": "markNotificationRead",
 *   "description": "Mark a notification as read"
 * }
 */
router.patch(
  "/:notificationId/read",
  authorize("Notification", "update"),
  validateMarkNotificationRead,
  markNotificationRead
);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/api/notifications/unread-count",
 *   "middleware": ["verifyJWT", "authorize('Notification', 'read')", "validateGetUnreadCount"],
 *   "controller": "getUnreadCount",
 *   "description": "Get count of unread notifications for the authenticated user"
 * }
 */
router.get(
  "/unread-count",
  authorize("Notification", "read"),
  validateGetUnreadCount,
  getUnreadCount
);

export default router;
