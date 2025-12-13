// backend/middlewares/validators/notificationValidators.js
import { param, query } from "express-validator";
import { handleValidationErrors } from "./validation.js";
import { Notification } from "../../models/index.js";
import { NOTIFICATION_TYPES } from "../../utils/constants.js";

/**
 * @json {
 *   "route": "GET /notifications",
 *   "purpose": "Get user notifications with pagination",
 *   "validates": ["page","limit","unreadOnly","type","deleted","sortBy","sortOrder"],
 *   "rules": [
 *     "Pagination integers",
 *     "Optional unreadOnly boolean",
 *     "Optional type constrained by NOTIFICATION_TYPES",
 *     "Optional deleted boolean",
 *     "Attach sanitized query to req.validated.query"
 *   ]
 * }
 */
export const validateGetAllNotifications = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),
  query("unreadOnly")
    .optional()
    .isBoolean()
    .withMessage("unreadOnly must be a boolean")
    .toBoolean(),
  query("type")
    .optional({ nullable: true })
    .isIn(NOTIFICATION_TYPES)
    .withMessage(`type must be one of: ${NOTIFICATION_TYPES.join(", ")}`),
  query("deleted")
    .optional()
    .isBoolean()
    .withMessage("Deleted must be a boolean")
    .toBoolean(),
  query("sortBy")
    .optional()
    .isString()
    .withMessage("sortBy must be a string")
    .trim(),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc", "1", "-1"])
    .withMessage("Invalid sortOrder"),
  query().custom((_, { req }) => {
    req.validated = req.validated || {};
    req.validated.query = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      unreadOnly:
        req.query.unreadOnly === true || req.query.unreadOnly === "true",
      type: req.query.type,
      deleted: req.query.deleted === true || req.query.deleted === "true",
      sortBy: req.query.sortBy || "sentAt",
      sortOrder: req.query.sortOrder || "desc",
    };
    return true;
  }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "PATCH /notifications/:notificationId/read",
 *   "purpose": "Mark a notification as read",
 *   "validates": ["notificationId"],
 *   "rules": [
 *     "notificationId must be a valid MongoDB ID",
 *     "Notification must exist in org and be addressed to the user",
 *     "Attach sanitized params to req.validated.params"
 *   ]
 * }
 */
export const validateMarkNotificationRead = [
  param("notificationId")
    .isMongoId()
    .withMessage("Notification ID must be a valid MongoDB ID")
    .bail()
    .custom(async (notificationId, { req }) => {
      const orgId = req.user.organization._id;
      const notif = await Notification.findOne({
        _id: notificationId,
        organization: orgId,
        recipients: req.user._id,
      });
      if (!notif)
        throw new Error(
          "Notification not found for this user in your organization"
        );
      return true;
    }),
  (req, _res, next) => {
    req.validated = req.validated || {};
    req.validated.params = { notificationId: req.params.notificationId };
    next();
  },
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "GET /notifications/unread-count",
 *   "purpose": "Get count of unread notifications for the authenticated user",
 *   "validates": ["type"],
 *   "rules": [
 *     "Optional type constrained by NOTIFICATION_TYPES",
 *     "Attach sanitized query to req.validated.query"
 *   ]
 * }
 */
export const validateGetUnreadCount = [
  query("type")
    .optional({ nullable: true })
    .isIn(NOTIFICATION_TYPES)
    .withMessage(`type must be one of: ${NOTIFICATION_TYPES.join(", ")}`),
  query().custom((_, { req }) => {
    req.validated = req.validated || {};
    req.validated.query = {
      type: req.query.type,
    };
    return true;
  }),
  handleValidationErrors,
];
