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
 *   "path": "/notifications",
 *   "description": "Get user notifications with pagination",
 *   "validators": ["validateGetAllNotifications"],
 *   "controller": "getAllNotifications"
 * }
 */
router.get(
  "/notifications",
  authorize("Notification", "read"),
  validateGetAllNotifications,
  getAllNotifications
);

/**
 * @json {
 *   "method": "PATCH",
 *   "path": "/notifications/:notificationId/read",
 *   "description": "Mark a notification as read",
 *   "validators": ["validateMarkNotificationRead"],
 *   "controller": "markNotificationRead"
 * }
 */
router.patch(
  "/notifications/:notificationId/read",
  authorize("Notification", "update"),
  validateMarkNotificationRead,
  markNotificationRead
);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/notifications/unread-count",
 *   "description": "Get count of unread notifications for the authenticated user",
 *   "validators": ["validateGetUnreadCount"],
 *   "controller": "getUnreadCount"
 * }
 */
router.get(
  "/notifications/unread-count",
  authorize("Notification", "read"),
  validateGetUnreadCount,
  getUnreadCount
);

export default router;
