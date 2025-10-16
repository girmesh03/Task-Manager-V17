// backend/routes/taskRoutes.js
import express from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorization.js";
import {
  validateCreateTask,
  validateGetAllTasks,
  validateGetTask,
  validateUpdateTask,
  validateDeleteTask,
  validateRestoreTask,
  validateCreateTaskActivity,
  validateGetAllTaskActivities,
  validateGetTaskActivity,
  validateUpdateTaskActivity,
  validateDeleteTaskActivity,
  validateRestoreTaskActivity,
  validateCreateTaskComment,
  validateListTaskComments,
  validateGetTaskComment,
  validateUpdateTaskComment,
  validateDeleteTaskComment,
  validateRestoreTaskComment,
} from "../middlewares/validators/taskValidators.js";
import {
  createTask,
  getAllTasks,
  getTask,
  updateTask,
  deleteTask,
  restoreTask,
  createTaskActivity,
  getAllTaskActivities,
  getTaskActivity,
  updateTaskActivity,
  deleteTaskActivity,
  restoreTaskActivity,
  createTaskComment,
  getAllTaskComments,
  getTaskComment,
  updateTaskComment,
  deleteTaskComment,
  restoreTaskComment,
} from "../controllers/taskControllers.js";

const router = express.Router();

// JWT protection for all Task routes
router.use(verifyJWT);

/**
 * @json {
 *   "method": "POST",
 *   "path": "/tasks",
 *   "description": "Create a new task of any type (RoutineTask, AssignedTask, ProjectTask) based on taskType field.",
 *   "validators": ["validateCreateTask"],
 *   "controller": "createTask"
 * }
 */
router.post("/", authorize("Task", "create"), validateCreateTask, createTask);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/tasks",
 *   "description": "List all tasks across all types with filtering and pagination.",
 *   "validators": ["validateGetAllTasks"],
 *   "controller": "getAllTasks"
 * }
 */
router.get("/", authorize("Task", "read"), validateGetAllTasks, getAllTasks);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/tasks/:taskId",
 *   "description": "Get single task by ID with complete details including all activities, comments, attachments, assignees, vendor information, materials, and cost history.",
 *   "validators": ["validateGetTask"],
 *   "controller": "getTask"
 * }
 */
router.get("/:taskId", authorize("Task", "read"), validateGetTask, getTask);

/**
 * @json {
 *   "method": "PUT",
 *   "path": "/:taskId",
 *   "description": "Update a task of any type.",
 *   "validators": ["validateUpdateTask"],
 *   "controller": "updateTask"
 * }
 */
router.put(
  "/:taskId",
  authorize("Task", "update"),
  validateUpdateTask,
  updateTask
);

/**
 * @json {
 *   "method": "DELETE",
 *   "path": "/:taskId",
 *   "description": "Soft delete a task with full cascade deletion.",
 *   "validators": ["validateDeleteTask"],
 *   "controller": "deleteTask"
 * }
 */
router.delete(
  "/:taskId",
  authorize("Task", "delete"),
  validateDeleteTask,
  deleteTask
);

/**
 * @json {
 *   "method": "POST",
 *   "path": "/:taskId/restore",
 *   "description": "Restore a soft-deleted task with full cascade restoration.",
 *   "validators": ["validateRestoreTask"],
 *   "controller": "restoreTask"
 * }
 */
router.post(
  "/:taskId/restore",
  authorize("Task", "update"),
  validateRestoreTask,
  restoreTask
);

/**
 * @json {
 *   "method": "POST",
 *   "path": "/:taskId/activities",
 *   "description": "Create a new activity log for a specific task.",
 *   "validators": ["validateCreateTaskActivity"],
 *   "controller": "createTaskActivity"
 * }
 */
router.post(
  "/:taskId/activities",
  authorize("TaskActivity", "create"),
  validateCreateTaskActivity,
  createTaskActivity
);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/:taskId/activities",
 *   "description": "List all activities for a specific task with pagination.",
 *   "validators": ["validateGetAllTaskActivities"],
 *   "controller": "getAllTaskActivities"
 * }
 */
router.get(
  "/:taskId/activities",
  authorize("TaskActivity", "read"),
  validateGetAllTaskActivities,
  getAllTaskActivities
);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/:taskId/activities/:activityId",
 *   "description": "Get single activity by ID with complete details.",
 *   "validators": ["validateGetTaskActivity"],
 *   "controller": "getTaskActivity"
 * }
 */
router.get(
  "/:taskId/activities/:activityId",
  authorize("TaskActivity", "read"),
  validateGetTaskActivity,
  getTaskActivity
);

/**
 * @json {
 *   "method": "PUT",
 *   "path": "/:taskId/activities/:activityId",
 *   "description": "Update an existing activity.",
 *   "validators": ["validateUpdateTaskActivity"],
 *   "controller": "updateTaskActivity"
 * }
 */
router.put(
  "/:taskId/activities/:activityId",
  authorize("TaskActivity", "update"),
  validateUpdateTaskActivity,
  updateTaskActivity
);

/**
 * @json {
 *   "method": "DELETE",
 *   "path": "/:taskId/activities/:activityId",
 *   "description": "Soft delete an activity with cascade deletion.",
 *   "validators": ["validateDeleteTaskActivity"],
 *   "controller": "deleteTaskActivity"
 * }
 */
router.delete(
  "/:taskId/activities/:activityId",
  authorize("TaskActivity", "delete"),
  validateDeleteTaskActivity,
  deleteTaskActivity
);

/**
 * @json {
 *   "method": "POST",
 *   "path": "/:taskId/activities/:activityId/restore",
 *   "description": "Restore a soft-deleted activity with cascade restoration.",
 *   "validators": ["validateRestoreTaskActivity"],
 *   "controller": "restoreTaskActivity"
 * }
 */
router.post(
  "/:taskId/activities/:activityId/restore",
  authorize("TaskActivity", "update"),
  validateRestoreTaskActivity,
  restoreTaskActivity
);

/**
 * @json {
 *   "method": "POST",
 *   "path": "/:taskId/comments",
 *   "description": "Create a new comment on any entity (tasks, activities, or other comments for threading).",
 *   "validators": ["validateCreateTaskComment"],
 *   "controller": "createTaskComment"
 * }
 */
router.post(
  "/:taskId/comments",
  authorize("TaskComment", "create"),
  validateCreateTaskComment,
  createTaskComment
);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/:taskId/comments",
 *   "description": "List comments for a specific parent entity with threading support.",
 *   "validators": ["validateListTaskComments"],
 *   "controller": "getAllTaskComments"
 * }
 */
router.get(
  "/:taskId/comments",
  authorize("TaskComment", "read"),
  validateListTaskComments,
  getAllTaskComments
);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/:taskId/comments/:commentId",
 *   "description": "Get single comment by ID with complete details.",
 *   "validators": ["validateGetTaskComment"],
 *   "controller": "getTaskComment"
 * }
 */
router.get(
  "/:taskId/comments/:commentId",
  authorize("TaskComment", "read"),
  validateGetTaskComment,
  getTaskComment
);

/**
 * @json {
 *   "method": "PUT",
 *   "path": "/:taskId/comments/:commentId",
 *   "description": "Update a comment.",
 *   "validators": ["validateUpdateTaskComment"],
 *   "controller": "updateTaskComment"
 * }
 */
router.put(
  "/:taskId/comments/:commentId",
  authorize("TaskComment", "update"),
  validateUpdateTaskComment,
  updateTaskComment
);

/**
 * @json {
 *   "method": "DELETE",
 *   "path": "/:taskId/comments/:commentId",
 *   "description": "Soft delete a comment with full cascade deletion for threaded replies.",
 *   "validators": ["validateDeleteTaskComment"],
 *   "controller": "deleteTaskComment"
 * }
 */
router.delete(
  "/:taskId/comments/:commentId",
  authorize("TaskComment", "delete"),
  validateDeleteTaskComment,
  deleteTaskComment
);

/**
 * @json {
 *   "method": "POST",
 *   "path": "/:taskId/comments/:commentId/restore",
 *   "description": "Restore a soft-deleted comment with full cascade restoration for threaded replies.",
 *   "validators": ["validateRestoreTaskComment"],
 *   "controller": "restoreTaskComment"
 * }
 */
router.post(
  "/:taskId/comments/:commentId/restore",
  authorize("TaskComment", "update"),
  validateRestoreTaskComment,
  restoreTaskComment
);

export default router;
