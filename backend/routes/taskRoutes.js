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
 *   "path": "/api/tasks",
 *   "middleware": ["verifyJWT", "authorize('Task', 'create')", "validateCreateTask"],
 *   "controller": "createTask",
 *   "description": "Create a new task of any type (RoutineTask, AssignedTask, ProjectTask) based on taskType field"
 * }
 */
router.post("/", authorize("Task", "create"), validateCreateTask, createTask);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/api/tasks",
 *   "middleware": ["verifyJWT", "authorize('Task', 'read')", "validateGetAllTasks"],
 *   "controller": "getAllTasks",
 *   "description": "List all tasks across all types with filtering and pagination"
 * }
 */
router.get("/", authorize("Task", "read"), validateGetAllTasks, getAllTasks);

/**
 * @json {
 *   "method": "GET",
 *   "path": "/api/tasks/:taskId",
 *   "middleware": ["verifyJWT", "authorize('Task', 'read')", "validateGetTask"],
 *   "controller": "getTask",
 *   "description": "Get single task by ID with complete details including all activities, comments, attachments, assignees, vendor information, materials, and cost history"
 * }
 */
router.get("/:taskId", authorize("Task", "read"), validateGetTask, getTask);

/**
 * @json {
 *   "method": "PUT",
 *   "path": "/api/tasks/:taskId",
 *   "middleware": ["verifyJWT", "authorize('Task', 'update')", "validateUpdateTask"],
 *   "controller": "updateTask",
 *   "description": "Update a task of any type"
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
 *   "path": "/api/tasks/:taskId",
 *   "middleware": ["verifyJWT", "authorize('Task', 'delete')", "validateDeleteTask"],
 *   "controller": "deleteTask",
 *   "description": "Soft delete a task with full cascade deletion"
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
 *   "method": "PATCH",
 *   "path": "/api/tasks/:taskId/restore",
 *   "middleware": ["verifyJWT", "authorize('Task', 'update')", "validateRestoreTask"],
 *   "controller": "restoreTask",
 *   "description": "Restore a soft-deleted task with full cascade restoration"
 * }
 */
router.patch(
  "/:taskId/restore",
  authorize("Task", "update"),
  validateRestoreTask,
  restoreTask
);

/**
 * @json {
 *   "method": "POST",
 *   "path": "/api/tasks/:taskId/activities",
 *   "middleware": ["verifyJWT", "authorize('TaskActivity', 'create')", "validateCreateTaskActivity"],
 *   "controller": "createTaskActivity",
 *   "description": "Create a new activity log for a specific task"
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
 *   "path": "/api/tasks/:taskId/activities",
 *   "middleware": ["verifyJWT", "authorize('TaskActivity', 'read')", "validateGetAllTaskActivities"],
 *   "controller": "getAllTaskActivities",
 *   "description": "List all activities for a specific task with pagination"
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
 *   "path": "/api/tasks/:taskId/activities/:activityId",
 *   "middleware": ["verifyJWT", "authorize('TaskActivity', 'read')", "validateGetTaskActivity"],
 *   "controller": "getTaskActivity",
 *   "description": "Get single activity by ID with complete details"
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
 *   "path": "/api/tasks/:taskId/activities/:activityId",
 *   "middleware": ["verifyJWT", "authorize('TaskActivity', 'update')", "validateUpdateTaskActivity"],
 *   "controller": "updateTaskActivity",
 *   "description": "Update an existing activity"
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
 *   "path": "/api/tasks/:taskId/activities/:activityId",
 *   "middleware": ["verifyJWT", "authorize('TaskActivity', 'delete')", "validateDeleteTaskActivity"],
 *   "controller": "deleteTaskActivity",
 *   "description": "Soft delete an activity with cascade deletion"
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
 *   "method": "PATCH",
 *   "path": "/api/tasks/:taskId/activities/:activityId/restore",
 *   "middleware": ["verifyJWT", "authorize('TaskActivity', 'update')", "validateRestoreTaskActivity"],
 *   "controller": "restoreTaskActivity",
 *   "description": "Restore a soft-deleted activity with cascade restoration"
 * }
 */
router.patch(
  "/:taskId/activities/:activityId/restore",
  authorize("TaskActivity", "update"),
  validateRestoreTaskActivity,
  restoreTaskActivity
);

/**
 * @json {
 *   "method": "POST",
 *   "path": "/api/tasks/:taskId/comments",
 *   "middleware": ["verifyJWT", "authorize('TaskComment', 'create')", "validateCreateTaskComment"],
 *   "controller": "createTaskComment",
 *   "description": "Create a new comment on any entity (tasks, activities, or other comments for threading)"
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
 *   "path": "/api/tasks/:taskId/comments",
 *   "middleware": ["verifyJWT", "authorize('TaskComment', 'read')", "validateListTaskComments"],
 *   "controller": "getAllTaskComments",
 *   "description": "List comments for a specific parent entity with threading support"
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
 *   "path": "/api/tasks/:taskId/comments/:commentId",
 *   "middleware": ["verifyJWT", "authorize('TaskComment', 'read')", "validateGetTaskComment"],
 *   "controller": "getTaskComment",
 *   "description": "Get single comment by ID with complete details"
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
 *   "path": "/api/tasks/:taskId/comments/:commentId",
 *   "middleware": ["verifyJWT", "authorize('TaskComment', 'update')", "validateUpdateTaskComment"],
 *   "controller": "updateTaskComment",
 *   "description": "Update a comment"
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
 *   "path": "/api/tasks/:taskId/comments/:commentId",
 *   "middleware": ["verifyJWT", "authorize('TaskComment', 'delete')", "validateDeleteTaskComment"],
 *   "controller": "deleteTaskComment",
 *   "description": "Soft delete a comment with full cascade deletion for threaded replies"
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
 *   "method": "PATCH",
 *   "path": "/api/tasks/:taskId/comments/:commentId/restore",
 *   "middleware": ["verifyJWT", "authorize('TaskComment', 'update')", "validateRestoreTaskComment"],
 *   "controller": "restoreTaskComment",
 *   "description": "Restore a soft-deleted comment with full cascade restoration for threaded replies"
 * }
 */
router.patch(
  "/:taskId/comments/:commentId/restore",
  authorize("TaskComment", "update"),
  validateRestoreTaskComment,
  restoreTaskComment
);

export default router;
