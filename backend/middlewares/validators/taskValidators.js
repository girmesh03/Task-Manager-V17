// backend/middlewares/validators/taskValidators.js
import { body, param, query } from "express-validator";
import mongoose from "mongoose";
import { handleValidationErrors } from "./validation.js";
import {
  BaseTask,
  TaskActivity,
  TaskComment,
  Vendor,
  User,
  Material,
} from "../../models/index.js";
import {
  escapeRegex,
  isStartDateBeforeDueDate,
  isStartDateTodayOrFuture,
  isDateNotInFuture,
} from "../../utils/helpers.js";
import {
  TASK_TYPES,
  TASK_STATUS,
  TASK_PRIORITY,
  ROUTINE_TASK_STATUS,
  ROUTINE_TASK_PRIORITY,
  ATTACHMENT_TYPES,
  TASK_COMMENT_PARENT_MODELS,
  TASK_ACTIVITY_PARENT_MODELS,
  SUPPORTED_CURRENCIES,
  MATERIAL_CATEGORIES,
  MAX_ATTACHMENTS_PER_ENTITY,
  MAX_WATCHERS_PER_TASK,
  MAX_ASSIGNEES_PER_TASK,
  MAX_MATERIALS_PER_ENTITY,
  MAX_TAGS_PER_TASK,
  MAX_MENTIONS_PER_COMMENT,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_TAG_LENGTH,
  MAX_FILENAME_LENGTH,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  MAX_DOCUMENT_SIZE,
  MAX_AUDIO_SIZE,
  MAX_OTHER_SIZE,
  HEAD_OF_DEPARTMENT_ROLES,
  MAX_LIST_ITEM_LIMIT,
} from "../../utils/constants.js";

/**
 * Normalize and deduplicate array of MongoIds (strings)
 */
const dedupeIds = (arr) =>
  Array.isArray(arr)
    ? [...new Set(arr.map((id) => (id ? id.toString() : id)).filter(Boolean))]
    : [];

/**
 * Validate attachments array length
 */
const validateAttachmentsArray = body("attachments")
  .optional({ nullable: true })
  .isArray()
  .withMessage("Attachments must be an array")
  .bail()
  .custom((array) => {
    if (array && array?.length > MAX_ATTACHMENTS_PER_ENTITY) {
      throw new Error(
        `Attachments cannot exceed ${MAX_ATTACHMENTS_PER_ENTITY}`
      );
    }
    return true;
  });

/**
 * Per-attachment validations
 */
const validateAttachmentFields = [
  body("attachments.*.originalName")
    .if(body("attachments").exists())
    .exists({ checkFalsy: true })
    .withMessage("Attachment original name is required")
    .bail()
    .isString()
    .withMessage("Original name must be a string")
    .bail()
    .trim()
    .isLength({ max: MAX_FILENAME_LENGTH })
    .withMessage(
      `Original name cannot exceed ${MAX_FILENAME_LENGTH} characters`
    ),

  body("attachments.*.storedName")
    .if(body("attachments").exists())
    .exists({ checkFalsy: true })
    .withMessage("Attachment stored name is required")
    .bail()
    .isString()
    .withMessage("Stored name must be a string")
    .bail()
    .trim(),

  body("attachments.*.mimeType")
    .if(body("attachments").exists())
    .exists({ checkFalsy: true })
    .withMessage("MIME type is required")
    .bail()
    .isString()
    .withMessage("MIME type must be a string")
    .bail()
    .trim(),

  body("attachments.*.size")
    .if(body("attachments").exists())
    .exists({ checkFalsy: true })
    .withMessage("File size is required")
    .bail()
    .isInt({ min: 0 })
    .withMessage("File size must be a non-negative integer")
    .bail()
    .custom((size, { req, path }) => {
      const idxMatch = path.match(/\[(\d+)\]/);
      const attachmentIndex = idxMatch ? parseInt(idxMatch[1], 10) : -1;
      const attachmentType =
        attachmentIndex >= 0
          ? req.body.attachments[attachmentIndex]?.type
          : "other";

      let maxSize;
      switch (attachmentType) {
        case "image":
          maxSize = MAX_IMAGE_SIZE;
          break;
        case "video":
          maxSize = MAX_VIDEO_SIZE;
          break;
        case "document":
          maxSize = MAX_DOCUMENT_SIZE;
          break;
        case "audio":
          maxSize = MAX_AUDIO_SIZE;
          break;
        default:
          maxSize = MAX_OTHER_SIZE;
      }

      if (Number(size) > maxSize) {
        throw new Error(
          `File size exceeds maximum allowed for ${attachmentType} files (${
            maxSize / (1024 * 1024)
          }MB)`
        );
      }
      return true;
    }),

  body("attachments.*.type")
    .if(body("attachments").exists())
    .exists({ checkFalsy: true })
    .withMessage("Attachment type is required")
    .bail()
    .isIn(ATTACHMENT_TYPES)
    .withMessage(
      `Attachment type must be one of: ${ATTACHMENT_TYPES.join(", ")}`
    ),

  body("attachments.*.url")
    .if(body("attachments").exists())
    .exists({ checkFalsy: true })
    .withMessage("File URL is required")
    .bail()
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("File URL must be a valid HTTP or HTTPS URL"),

  body("attachments.*.publicId")
    .if(body("attachments").exists())
    .exists({ checkFalsy: true })
    .withMessage("Cloudinary publicId is required")
    .bail()
    .isString()
    .withMessage("Public ID must be a string")
    .bail()
    .trim(),

  body("attachments.*.format")
    .if(body("attachments").exists())
    .optional({ nullable: true })
    .isString()
    .withMessage("Format must be a string")
    .bail()
    .trim(),
  body("attachments.*.width")
    .if(body("attachments").exists())
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage("Width must be a non-negative integer"),
  body("attachments.*.height")
    .if(body("attachments").exists())
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage("Height must be a non-negative integer"),
];

/**
 * Shared validators for base task fields
 */
const baseTaskFieldValidators = [
  body("taskType")
    .exists({ checkFalsy: true })
    .withMessage("taskType is required")
    .bail()
    .isIn(TASK_TYPES)
    .withMessage(`taskType must be one of: ${TASK_TYPES.join(", ")}`),

  body("title")
    .exists({ checkFalsy: true })
    .withMessage("Title is required")
    .bail()
    .isString()
    .withMessage("Title must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: MAX_TITLE_LENGTH })
    .withMessage(`Title must be between 1 and ${MAX_TITLE_LENGTH} characters`),

  body("description")
    .exists({ checkFalsy: true })
    .withMessage("Description is required")
    .bail()
    .isString()
    .withMessage("Description must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: MAX_DESCRIPTION_LENGTH })
    .withMessage(
      `Description must be between 1 and ${MAX_DESCRIPTION_LENGTH} characters`
    ),

  body("status")
    .optional({ nullable: true })
    .isString()
    .withMessage("Status must be a string")
    .bail()
    .custom((status, { req }) => {
      if (!status) return true;
      const type = req.body.taskType;
      const allowed =
        type === "RoutineTask" ? ROUTINE_TASK_STATUS : TASK_STATUS;
      if (!allowed.includes(status)) {
        throw new Error(
          `Status must be one of: ${allowed.join(", ")} for ${type}`
        );
      }
      return true;
    }),

  body("priority")
    .optional({ nullable: true })
    .isString()
    .withMessage("Priority must be a string")
    .bail()
    .custom((priority, { req }) => {
      if (!priority) return true;
      const type = req.body.taskType;
      const allowed =
        type === "RoutineTask" ? ROUTINE_TASK_PRIORITY : TASK_PRIORITY;
      if (!allowed.includes(priority)) {
        throw new Error(
          `Priority must be one of: ${allowed.join(", ")} for ${type}`
        );
      }
      return true;
    }),

  body("watcherIds")
    .optional({ nullable: true })
    .isArray()
    .withMessage("watcherIds must be an array")
    .bail()
    .custom((ids) => {
      if (ids?.length > MAX_WATCHERS_PER_TASK) {
        throw new Error(
          `Watchers cannot exceed ${MAX_WATCHERS_PER_TASK} users`
        );
      }
      return true;
    })
    .bail()
    .customSanitizer((ids) => dedupeIds(ids))
    .custom(async (ids, { req }) => {
      if (!ids || ids?.length === 0) return true;
      const orgId = req.user?.organization?._id;
      const users = await User.find({
        _id: { $in: ids },
        organization: orgId,
        role: { $in: HEAD_OF_DEPARTMENT_ROLES },
        isDeleted: false,
      });
      if (users?.length !== ids?.length) {
        throw new Error(
          "All watchers must be SuperAdmin/Admin within your organization"
        );
      }
      return true;
    }),

  body("tags")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Tags must be an array")
    .bail()
    .custom((tags) => {
      if (tags?.length > MAX_TAGS_PER_TASK) {
        throw new Error(`Tags cannot exceed ${MAX_TAGS_PER_TASK} items`);
      }
      const uniqueTags = new Set(
        tags.map((t) => t?.toLowerCase().trim()).filter(Boolean)
      );
      if (uniqueTags.size !== tags.filter((t) => t && t.trim())?.length) {
        throw new Error("Duplicate tags are not allowed");
      }
      for (const t of tags) {
        if (typeof t !== "string") throw new Error("All tags must be strings");
        if (t.trim()?.length > MAX_TAG_LENGTH)
          throw new Error(
            `Each tag cannot exceed ${MAX_TAG_LENGTH} characters`
          );
      }
      return true;
    }),
];

/**
 * Type-specific validators for AssignedTask
 */
const assignedTaskValidators = [
  body("startDate")
    .if(body("taskType").equals("AssignedTask"))
    .exists({ checkFalsy: true })
    .withMessage("Start date is required")
    .bail()
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date")
    .bail()
    .custom((startDate) => {
      if (!isStartDateTodayOrFuture(startDate)) {
        throw new Error("Start date cannot be in the past");
      }
      return true;
    }),
  body("dueDate")
    .if(body("taskType").equals("AssignedTask"))
    .exists({ checkFalsy: true })
    .withMessage("Due date is required")
    .bail()
    .isISO8601()
    .withMessage("Due date must be a valid ISO 8601 date")
    .bail()
    .custom((dueDate, { req }) => {
      if (!isStartDateBeforeDueDate(req.body.startDate, dueDate)) {
        throw new Error("Due date must be greater than or equal to start date");
      }
      return true;
    }),
  body("assigneeIds")
    .if(body("taskType").equals("AssignedTask"))
    .exists({ checkFalsy: true })
    .withMessage("Assignee IDs are required")
    .bail()
    .isArray({ min: 1 })
    .withMessage("Assignee IDs must be a non-empty array")
    .bail()
    .custom((array) => {
      if (array?.length > MAX_ASSIGNEES_PER_TASK) {
        throw new Error(
          `Number of user assigned to a task cannot exceed ${MAX_ASSIGNEES_PER_TASK}`
        );
      }
      return true;
    })
    .customSanitizer((array) => dedupeIds(array))
    .custom(async (ids, { req }) => {
      const orgId = req.user?.organization?._id;
      const deptId = req.user?.department?._id;
      const users = await User.find({
        _id: { $in: ids },
        organization: orgId,
        department: deptId,
        isDeleted: false,
      });
      if (users?.length !== ids?.length) {
        throw new Error(
          "All assignees must belong to your organization and department"
        );
      }
      return true;
    }),
];

/**
 * Type-specific validators for ProjectTask
 */
const projectTaskValidators = [
  body("startDate")
    .if(body("taskType").equals("ProjectTask"))
    .exists({ checkFalsy: true })
    .withMessage("Start date is required")
    .bail()
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date")
    .bail()
    .custom((startDate) => {
      if (!isStartDateTodayOrFuture(startDate)) {
        throw new Error("Start date cannot be in the past");
      }
      return true;
    }),
  body("dueDate")
    .if(body("taskType").equals("ProjectTask"))
    .exists({ checkFalsy: true })
    .withMessage("Due date is required")
    .bail()
    .isISO8601()
    .withMessage("Due date must be a valid ISO 8601 date")
    .bail()
    .custom((dueDate, { req }) => {
      if (!isStartDateBeforeDueDate(req.body.startDate, dueDate)) {
        throw new Error("Due date must be greater than or equal to start date");
      }
      return true;
    }),
  body("vendorId")
    .if(body("taskType").equals("ProjectTask"))
    .exists({ checkFalsy: true })
    .withMessage("Vendor ID is required")
    .bail()
    .isMongoId()
    .withMessage("Vendor ID must be a valid MongoDB ID")
    .bail()
    .custom(async (vendorId, { req }) => {
      const orgId = req.user?.organization?._id;
      const vendor = await Vendor.findOne({
        _id: vendorId,
        organization: orgId,
        isDeleted: false,
      });
      if (!vendor) {
        throw new Error("Vendor not found in your organization");
      }
      return true;
    }),
  body("estimatedCost")
    .if(body("taskType").equals("ProjectTask"))
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Estimated cost must be a non-negative number"),
  body("actualCost")
    .if(body("taskType").equals("ProjectTask"))
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Actual cost must be a non-negative number"),
  body("currency")
    .if(body("taskType").equals("ProjectTask"))
    .optional({ nullable: true })
    .isIn(SUPPORTED_CURRENCIES)
    .withMessage(`Currency must be one of: ${SUPPORTED_CURRENCIES.join(", ")}`),
];

/**
 * Type-specific validators for RoutineTask
 */
const routineTaskValidators = [
  body("date")
    .if(body("taskType").equals("RoutineTask"))
    .exists({ checkFalsy: true })
    .withMessage("Routine task date is required")
    .bail()
    .isISO8601()
    .withMessage("Routine task date must be a valid ISO 8601 date")
    .bail()
    .custom((date) => {
      if (!isDateNotInFuture(date)) {
        throw new Error("Routine task log date cannot be in the future");
      }
      return true;
    }),

  body("materials")
    .if(body("taskType").equals("RoutineTask"))
    .optional({ nullable: true })
    .isArray()
    .withMessage("Materials must be an array")
    .bail()
    .custom((materials) => {
      if (materials?.length > MAX_MATERIALS_PER_ENTITY) {
        throw new Error(
          `Materials cannot exceed ${MAX_MATERIALS_PER_ENTITY} items`
        );
      }
      return true;
    }),
  body("materials.*.materialId")
    .if(body("taskType").equals("RoutineTask"))
    .exists({ checkFalsy: true })
    .withMessage("Material ID is required")
    .bail()
    .isMongoId()
    .withMessage("Material ID must be a valid MongoDB ID")
    .bail()
    .custom(async (materialId, { req }) => {
      const orgId = req.user?.organization?._id;
      const deptId = req.user?.department?._id;
      const mat = await Material.findOne({
        _id: materialId,
        organization: orgId,
        department: deptId,
        isDeleted: false,
      });
      if (!mat) throw new Error("Material not found in your organization");
      return true;
    }),
  body("materials.*.quantity")
    .if(body("taskType").equals("RoutineTask"))
    .exists({ checkFalsy: true })
    .withMessage("Quantity is required")
    .bail()
    .isFloat({ min: 0 })
    .withMessage("Quantity must be a non-negative number"),
];

/**
 * @json {
 *   "route": "POST /api/tasks",
 *   "purpose": "Create a new task of any type (RoutineTask, AssignedTask, ProjectTask) based on taskType field.",
 *   "validates": ["taskType","title","description","status","priority","attachments","watcherIds","tags","startDate","dueDate","assigneeIds","vendorId","estimatedCost","actualCost","currency","date","materials"],
 *   "rules": ["Tenant-scoped uniqueness and existence checks", "Field-specific constraints per constants.js", "Date constraints via helpers", "Attachment Cloudinary constraints"]
 * }
 */
export const validateCreateTask = [
  ...baseTaskFieldValidators,
  validateAttachmentsArray,
  ...validateAttachmentFields,

  ...assignedTaskValidators,
  ...projectTaskValidators,
  ...routineTaskValidators,

  body("organizationId")
    .not()
    .exists()
    .withMessage(
      "organizationId cannot be provided. Organization is determined from authentication context"
    ),
  body().custom((_, { req }) => {
    req.validated = req.validated || {};
    const {
      taskType,
      title,
      description,
      status,
      priority,
      watcherIds,
      tags,
      attachments,
      startDate,
      dueDate,
      assigneeIds,
      vendorId,
      estimatedCost,
      actualCost,
      currency,
      date,
      materials,
    } = req.body;

    req.validated.body = {
      taskType,
      title: title?.trim(),
      description: description?.trim(),
      status,
      priority,
      watcherIds: dedupeIds(watcherIds),
      tags: Array.isArray(tags)
        ? [...new Set(tags.map((t) => t?.toString().trim()).filter(Boolean))]
        : undefined,
      attachments: attachments || [],
      startDate: startDate ? new Date(startDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assigneeIds: dedupeIds(assigneeIds),
      vendorId,
      estimatedCost:
        estimatedCost !== undefined ? Number(estimatedCost) : undefined,
      actualCost: actualCost !== undefined ? Number(actualCost) : undefined,
      currency,
      date: date ? new Date(date) : undefined,
      materials:
        Array.isArray(materials) && materials?.length > 0
          ? materials.map((m) => ({
              materialId: m.materialId?.toString(),
              quantity:
                m.quantity !== undefined ? Number(m.quantity) : undefined,
            }))
          : undefined,
    };
    return true;
  }),

  handleValidationErrors,
];

/**
 * @json {
 *   "route": "GET /api/tasks",
 *   "purpose": "List all tasks across all types with filtering and pagination.",
 *   "validates": ["page","limit","taskType","status","priority","departmentId","assigneeId","vendorId","dueDateFrom","dueDateTo","dateFrom","dateTo","search","sortBy","sortOrder","deleted","createdBy","watcherId","tags"],
 *   "rules": ["Tenant-scoped", "Pagination", "Filter validation", "Sort validation"]
 * }
 */
export const validateGetAllTasks = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be >= 1"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("taskType")
    .optional({ nullable: true })
    .isIn(TASK_TYPES)
    .withMessage(`taskType must be one of: ${TASK_TYPES.join(", ")}`),
  query("status")
    .optional({ nullable: true })
    .isString()
    .withMessage("status must be a string"),
  query("priority")
    .optional({ nullable: true })
    .isString()
    .withMessage("priority must be a string"),
  query("departmentId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("departmentId must be a valid MongoDB ID"),
  query("assigneeId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("assigneeId must be a valid MongoDB ID"),
  query("vendorId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("vendorId must be a valid MongoDB ID"),
  query("dueDateFrom")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("dueDateFrom must be ISO 8601 date"),
  query("dueDateTo")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("dueDateTo must be ISO 8601 date"),
  query("dateFrom")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("dateFrom must be ISO 8601 date"),
  query("dateTo")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("dateTo must be ISO 8601 date"),
  query("search")
    .optional({ nullable: true })
    .isString()
    .withMessage("search must be a string")
    .bail()
    .trim(),
  query("sortBy")
    .optional({ nullable: true })
    .isIn([
      "createdAt",
      "dueDate",
      "date",
      "priority",
      "status",
      "startDate",
      "title",
    ])
    .withMessage(
      "sortBy must be one of: createdAt, dueDate, date, priority, status, startDate, title"
    ),
  query("sortOrder")
    .optional({ nullable: true })
    .isIn(["asc", "desc"])
    .withMessage("sortOrder must be 'asc' or 'desc'"),
  query("deleted")
    .optional({ nullable: true })
    .isBoolean()
    .withMessage("deleted must be boolean")
    .bail()
    .toBoolean(),
  query("createdBy")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("createdBy must be a valid MongoDB ID"),
  query("watcherId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("watcherId must be a valid MongoDB ID"),
  query("tags")
    .optional({ nullable: true })
    .isArray()
    .withMessage("tags must be an array")
    .bail()
    .custom((tags) => {
      for (const t of tags) {
        if (typeof t !== "string") throw new Error("All tags must be strings");
        if (t.trim()?.length > MAX_TAG_LENGTH)
          throw new Error(
            `Each tag cannot exceed ${MAX_TAG_LENGTH} characters`
          );
      }
      return true;
    }),
  query().custom((_, { req }) => {
    req.validated = req.validated || {};
    const {
      page,
      limit,
      taskType,
      status,
      priority,
      departmentId,
      assigneeId,
      vendorId,
      dueDateFrom,
      dueDateTo,
      dateFrom,
      dateTo,
      search,
      sortBy,
      sortOrder,
      deleted,
      createdBy,
      watcherId,
      tags,
    } = req.query;

    req.validated.query = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      taskType,
      status,
      priority,
      departmentId,
      assigneeId,
      vendorId,
      dueDateFrom: dueDateFrom ? new Date(dueDateFrom) : undefined,
      dueDateTo: dueDateTo ? new Date(dueDateTo) : undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      search: search?.toString().trim(),
      sortBy,
      sortOrder,
      deleted: deleted === true,
      createdBy,
      watcherId,
      tags: Array.isArray(tags)
        ? [...new Set(tags.map((t) => t?.toString().trim()).filter(Boolean))]
        : undefined,
    };
    return true;
  }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "GET /api/tasks/:taskId",
 *   "purpose": "Get single task by ID with complete details including all activities, comments, attachments, assignees, vendor information, materials, and cost history.",
 *   "validates": ["taskId"],
 *   "rules": ["Tenant-scoped existence validation"]
 * }
 */
export const validateGetTask = [
  param("taskId")
    .exists({ checkFalsy: true })
    .withMessage("Task ID is required")
    .bail()
    .isMongoId()
    .withMessage("Task ID must be a valid MongoDB ID")
    .bail()
    .custom(async (taskId, { req }) => {
      const orgId = req.user?.organization?._id;
      const deptId = req.user?.department?._id;
      const deleted =
        req.query?.deleted === "true" || req.query?.deleted === true;

      // Build query based on deleted flag
      let query = BaseTask.findOne({
        _id: taskId,
        organization: orgId,
        department: deptId,
      });

      if (deleted) {
        query = query.withDeleted();
      } else {
        query = query.where({ isDeleted: false });
      }

      const task = await query.exec();
      if (!task) throw new Error("Task not found in your organization");
      return true;
    }),
  query("deleted")
    .optional()
    .isBoolean()
    .withMessage("Deleted must be a boolean")
    .toBoolean(),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "PUT /api/tasks/:taskId",
 *   "purpose": "Update a task of any type.",
 *   "validates": ["taskId","title","description","status","priority","attachments","watcherIds","tags","startDate","dueDate","assigneeIds","vendorId","estimatedCost","actualCost","currency","date","materials"],
 *   "rules": ["Tenant-scoped", "Field-specific per task type", "Attachment constraints"]
 * }
 */
export const validateUpdateTask = [
  param("taskId")
    .exists({ checkFalsy: true })
    .withMessage("Task ID is required")
    .bail()
    .isMongoId()
    .withMessage("Task ID must be a valid MongoDB ID")
    .bail()
    .custom(async (taskId, { req }) => {
      const orgId = req.user?.organization?._id;
      const deptId = req.user?.department?._id;
      const task = await BaseTask.findOne({
        _id: taskId,
        organization: orgId,
        department: deptId,
        isDeleted: false,
      });
      if (!task) throw new Error("Task not found in your organization");
      // Attach found taskType for downstream validation decisions
      req.foundTaskType = task.taskType;
      return true;
    }),

  body("title")
    .optional({ nullable: true })
    .isString()
    .withMessage("Title must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: MAX_TITLE_LENGTH })
    .withMessage(`Title must be between 1 and ${MAX_TITLE_LENGTH} characters`),

  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Description must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: MAX_DESCRIPTION_LENGTH })
    .withMessage(
      `Description must be between 1 and ${MAX_DESCRIPTION_LENGTH} characters`
    ),

  body("status")
    .optional({ nullable: true })
    .isString()
    .withMessage("Status must be a string")
    .bail()
    .custom((status, { req }) => {
      if (!status) return true;
      const type = req.foundTaskType;
      const allowed =
        type === "RoutineTask" ? ROUTINE_TASK_STATUS : TASK_STATUS;
      if (!allowed.includes(status)) {
        throw new Error(
          `Status must be one of: ${allowed.join(", ")} for ${type}`
        );
      }
      return true;
    }),

  body("priority")
    .optional({ nullable: true })
    .isString()
    .withMessage("Priority must be a string")
    .bail()
    .custom((priority, { req }) => {
      if (!priority) return true;
      const type = req.foundTaskType;
      const allowed =
        type === "RoutineTask" ? ROUTINE_TASK_PRIORITY : TASK_PRIORITY;
      if (!allowed.includes(priority)) {
        throw new Error(
          `Priority must be one of: ${allowed.join(", ")} for ${type}`
        );
      }
      return true;
    }),

  body("watcherIds")
    .optional({ nullable: true })
    .isArray()
    .withMessage("watcherIds must be an array")
    .bail()
    .custom((ids) => {
      if (ids?.length > MAX_WATCHERS_PER_TASK) {
        throw new Error(
          `Watchers cannot exceed ${MAX_WATCHERS_PER_TASK} users`
        );
      }
      return true;
    })
    .bail()
    .customSanitizer((ids) => dedupeIds(ids))
    .custom(async (ids, { req }) => {
      if (!ids || ids?.length === 0) return true;
      const orgId = req.user?.organization?._id;
      const users = await User.find({
        _id: { $in: ids },
        organization: orgId,
        role: { $in: HEAD_OF_DEPARTMENT_ROLES },
        isDeleted: false,
      });
      if (users?.length !== ids?.length) {
        throw new Error(
          "All watchers must be SuperAdmin/Admin within your organization"
        );
      }
      return true;
    }),

  body("tags")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Tags must be an array")
    .bail()
    .custom((tags) => {
      if (tags?.length > MAX_TAGS_PER_TASK) {
        throw new Error(`Tags cannot exceed ${MAX_TAGS_PER_TASK} items`);
      }
      const uniqueTags = new Set(
        tags.map((t) => t?.toLowerCase().trim()).filter(Boolean)
      );
      if (uniqueTags.size !== tags.filter((t) => t && t.trim())?.length) {
        throw new Error("Duplicate tags are not allowed");
      }
      for (const t of tags) {
        if (typeof t !== "string") throw new Error("All tags must be strings");
        if (t.trim()?.length > MAX_TAG_LENGTH)
          throw new Error(
            `Each tag cannot exceed ${MAX_TAG_LENGTH} characters`
          );
      }
      return true;
    }),

  validateAttachmentsArray,
  ...validateAttachmentFields,

  // AssignedTask fields (conditional)
  body("startDate")
    .if((value, { req }) => req.foundTaskType === "AssignedTask")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date")
    .bail()
    .custom((startDate) => {
      if (!isStartDateTodayOrFuture(startDate)) {
        throw new Error("Start date cannot be in the past");
      }
      return true;
    }),
  body("dueDate")
    .if((value, { req }) => req.foundTaskType === "AssignedTask")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Due date must be a valid ISO 8601 date")
    .bail()
    .custom((dueDate, { req }) => {
      if (
        req.body.startDate &&
        !isStartDateBeforeDueDate(req.body.startDate, dueDate)
      ) {
        throw new Error("Due date must be greater than or equal to start date");
      }
      return true;
    }),
  body("assigneeIds")
    .if((value, { req }) => req.foundTaskType === "AssignedTask")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Assignee IDs must be an array")
    .bail()
    .custom((array) => {
      if (array && array?.length > MAX_ASSIGNEES_PER_TASK) {
        throw new Error(
          `Number of user assigned to a task cannot exceed ${MAX_ASSIGNEES_PER_TASK}`
        );
      }
      return true;
    })
    .customSanitizer((array) => dedupeIds(array))
    .custom(async (ids, { req }) => {
      if (!ids || ids?.length === 0) return true;
      const orgId = req.user?.organization?._id;
      const deptId = req.user?.department?._id;
      const users = await User.find({
        _id: { $in: ids },
        organization: orgId,
        department: deptId,
        isDeleted: false,
      });
      if (users?.length !== ids?.length) {
        throw new Error(
          "All assignees must belong to your organization and department"
        );
      }
      return true;
    }),

  // ProjectTask fields (conditional)
  body("startDate")
    .if((value, { req }) => req.foundTaskType === "ProjectTask")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date")
    .bail()
    .custom((startDate) => {
      if (!isStartDateTodayOrFuture(startDate)) {
        throw new Error("Start date cannot be in the past");
      }
      return true;
    }),
  body("dueDate")
    .if((value, { req }) => req.foundTaskType === "ProjectTask")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Due date must be a valid ISO 8601 date")
    .bail()
    .custom((dueDate, { req }) => {
      if (
        req.body.startDate &&
        !isStartDateBeforeDueDate(req.body.startDate, dueDate)
      ) {
        throw new Error("Due date must be greater than or equal to start date");
      }
      return true;
    }),
  body("vendorId")
    .if((value, { req }) => req.foundTaskType === "ProjectTask")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("Vendor ID must be a valid MongoDB ID")
    .bail()
    .custom(async (vendorId, { req }) => {
      if (!vendorId) return true;
      const orgId = req.user?.organization?._id;
      const vendor = await Vendor.findOne({
        _id: vendorId,
        organization: orgId,
        isDeleted: false,
      });
      if (!vendor) throw new Error("Vendor not found in your organization");
      return true;
    }),
  body("estimatedCost")
    .if((value, { req }) => req.foundTaskType === "ProjectTask")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Estimated cost must be a non-negative number"),
  body("actualCost")
    .if((value, { req }) => req.foundTaskType === "ProjectTask")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Actual cost must be a non-negative number"),
  body("currency")
    .if((value, { req }) => req.foundTaskType === "ProjectTask")
    .optional({ nullable: true })
    .isIn(SUPPORTED_CURRENCIES)
    .withMessage(`Currency must be one of: ${SUPPORTED_CURRENCIES.join(", ")}`),

  // RoutineTask fields (conditional)
  body("date")
    .if((value, { req }) => req.foundTaskType === "RoutineTask")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Routine task date must be a valid ISO 8601 date")
    .bail()
    .custom((date) => {
      if (!isDateNotInFuture(date)) {
        throw new Error("Routine task log date cannot be in the future");
      }
      return true;
    }),
  body("materials")
    .if((value, { req }) => req.foundTaskType === "RoutineTask")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Materials must be an array")
    .bail()
    .custom((materials) => {
      if (materials?.length > MAX_MATERIALS_PER_ENTITY) {
        throw new Error(
          `Materials cannot exceed ${MAX_MATERIALS_PER_ENTITY} items`
        );
      }
      return true;
    }),
  body("materials.*.materialId")
    .if((value, { req }) => req.foundTaskType === "RoutineTask")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("Material ID must be a valid MongoDB ID")
    .bail()
    .custom(async (materialId, { req }) => {
      if (!materialId) return true;
      const orgId = req.user?.organization?._id;
      const deptId = req.user?.department?._id;
      const mat = await Material.findOne({
        _id: materialId,
        organization: orgId,
        department: deptId,
        isDeleted: false,
      });
      if (!mat) throw new Error("Material not found in your organization");
      return true;
    }),
  body("materials.*.quantity")
    .if((value, { req }) => req.foundTaskType === "RoutineTask")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Quantity must be a non-negative number"),

  body("organizationId")
    .not()
    .exists()
    .withMessage(
      "organizationId cannot be provided. Organization is determined from authentication context"
    ),
  body().custom((_, { req }) => {
    req.validated = req.validated || {};
    const {
      title,
      description,
      status,
      priority,
      watcherIds,
      tags,
      attachments,
      startDate,
      dueDate,
      assigneeIds,
      vendorId,
      estimatedCost,
      actualCost,
      currency,
      date,
      materials,
    } = req.body;

    req.validated.body = {
      title: title?.trim(),
      description: description?.trim(),
      status,
      priority,
      watcherIds: dedupeIds(watcherIds),
      tags: Array.isArray(tags)
        ? [...new Set(tags.map((t) => t?.toString().trim()).filter(Boolean))]
        : undefined,
      attachments: attachments || [],
      startDate: startDate ? new Date(startDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assigneeIds: dedupeIds(assigneeIds),
      vendorId,
      estimatedCost:
        estimatedCost !== undefined ? Number(estimatedCost) : undefined,
      actualCost: actualCost !== undefined ? Number(actualCost) : undefined,
      currency,
      date: date ? new Date(date) : undefined,
      materials:
        Array.isArray(materials) && materials?.length > 0
          ? materials.map((m) => ({
              materialId: m.materialId?.toString(),
              quantity:
                m.quantity !== undefined ? Number(m.quantity) : undefined,
            }))
          : undefined,
    };
    return true;
  }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "DELETE /api/tasks/:taskId",
 *   "purpose": "Soft delete a task with full cascade deletion.",
 *   "validates": ["taskId"],
 *   "rules": ["Tenant-scoped existence validation"]
 * }
 */
export const validateDeleteTask = [
  param("taskId")
    .exists({ checkFalsy: true })
    .withMessage("Task ID is required")
    .bail()
    .isMongoId()
    .withMessage("Task ID must be a valid MongoDB ID")
    .bail()
    .custom(async (taskId, { req }) => {
      const orgId = req.user?.organization?._id;
      const deptId = req.user?.department?._id;
      const exists = await BaseTask.findOne({
        _id: taskId,
        organization: orgId,
        department: deptId,
        isDeleted: false,
      });
      if (!exists) throw new Error("Task not found in your organization");
      return true;
    }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "POST /tasks/:taskId/restore",
 *   "purpose": "Restore a soft-deleted task with full cascade restoration.",
 *   "validates": ["taskId"],
 *   "rules": ["Tenant-scoped existence (deleted) validation"]
 * }
 */
export const validateRestoreTask = [
  param("taskId")
    .exists({ checkFalsy: true })
    .withMessage("Task ID is required")
    .bail()
    .isMongoId()
    .withMessage("Task ID must be a valid MongoDB ID")
    .bail()
    .custom(async (taskId, { req }) => {
      const orgId = req.user?.organization?._id;
      const deptId = req.user?.department?._id;
      const task = await BaseTask.findOne({
        _id: taskId,
        organization: orgId,
        department: deptId,
      }).withDeleted();
      if (!task || task.isDeleted !== true) {
        throw new Error("Soft-deleted task not found in your organization");
      }
      return true;
    }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "POST /api/tasks/:taskId/activities",
 *   "purpose": "Create a new activity log for a specific task.",
 *   "validates": ["taskId","activity","attachments","materials"],
 *   "rules": ["Tenant-scoped existence for task", "Attachment constraints", "Materials validation"]
 * }
 */
export const validateCreateTaskActivity = [
  param("taskId")
    .exists({ checkFalsy: true })
    .withMessage("Task ID is required")
    .bail()
    .isMongoId()
    .withMessage("Task ID must be a valid MongoDB ID")
    .bail()
    .custom(async (taskId, { req }) => {
      const orgId = req.user?.organization?._id;
      const deptId = req.user?.department?._id;
      const task = await BaseTask.findOne({
        _id: taskId,
        organization: orgId,
        department: deptId,
        isDeleted: false,
      });
      if (!task) throw new Error("Task not found in your department");
      if (!TASK_ACTIVITY_PARENT_MODELS.includes(task.taskType)) {
        throw new Error(
          "Activities can only be created for AssignedTask or ProjectTask"
        );
      }
      req.foundTaskType = task.taskType;
      return true;
    }),
  body("activity")
    .exists({ checkFalsy: true })
    .withMessage("Activity is required")
    .bail()
    .isString()
    .withMessage("Activity must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: MAX_DESCRIPTION_LENGTH })
    .withMessage(`Activity cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`),

  validateAttachmentsArray,
  ...validateAttachmentFields,

  body("materials")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Materials must be an array")
    .bail()
    .custom((materials) => {
      if (materials?.length > MAX_MATERIALS_PER_ENTITY) {
        throw new Error(`Materials cannot exceed ${MAX_MATERIALS_PER_ENTITY}`);
      }
      return true;
    }),
  body("materials.*.materialId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("Material ID must be a valid MongoDB ID")
    .bail()
    .custom(async (materialId, { req }) => {
      if (!materialId) return true;
      const orgId = req.user?.organization?._id;
      const deptId = req.user?.department?._id;
      const mat = await Material.findOne({
        _id: materialId,
        organization: orgId,
        department: deptId,
        isDeleted: false,
      });
      if (!mat) throw new Error("Material not found in your department");
      return true;
    }),
  body("materials.*.quantity")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Quantity must be a non-negative number"),

  body("organizationId")
    .not()
    .exists()
    .withMessage(
      "organizationId cannot be provided. Organization is determined from authentication context"
    ),
  body("task")
    .not()
    .exists()
    .withMessage(
      "task cannot be provided. Parent task is determined from URL parameters"
    ),
  body("taskModel")
    .not()
    .exists()
    .withMessage(
      "taskModel cannot be provided. Parent task model is determined from URL parameters"
    ),
  body("parent")
    .not()
    .exists()
    .withMessage(
      "parent cannot be provided. Parent is determined from URL parameters"
    ),
  body("parentId")
    .not()
    .exists()
    .withMessage(
      "parentId cannot be provided. Parent is determined from URL parameters"
    ),
  body().custom((_, { req }) => {
    req.validated = req.validated || {};
    const { activity, attachments, materials } = req.body;
    req.validated.body = {
      activity: activity?.trim(),
      attachments: attachments || [],
      materials:
        Array.isArray(materials) && materials?.length > 0
          ? materials.map((m) => ({
              materialId: m.materialId?.toString(),
              quantity:
                m.quantity !== undefined ? Number(m.quantity) : undefined,
            }))
          : undefined,
    };
    return true;
  }),

  handleValidationErrors,
];

/**
 * @json {
 *   "route": "GET /api/tasks/:taskId/activities",
 *   "purpose": "List all activities for a specific task with pagination.",
 *   "validates": ["taskId","page","limit","sortBy","sortOrder","deleted","createdBy"],
 *   "rules": ["Tenant-scoped", "Pagination", "Sorting"]
 * }
 */
export const validateGetAllTaskActivities = [
  param("taskId")
    .exists({ checkFalsy: true })
    .withMessage("Task ID is required")
    .bail()
    .isMongoId()
    .withMessage("Task ID must be a valid MongoDB ID")
    .bail()
    .custom(async (taskId, { req }) => {
      const orgId = req.user?.organization?._id;
      const deptId = req.user?.department?._id;
      const task = await BaseTask.findOne({
        _id: taskId,
        organization: orgId,
        department: deptId,
        isDeleted: false,
      });
      if (!task) throw new Error("Task not found in your department");
      return true;
    }),
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be >= 1"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: MAX_LIST_ITEM_LIMIT })
    .withMessage("Limit must be between 1 and 100"),
  query("sortBy")
    .optional({ nullable: true })
    .isIn(["createdAt", "loggedAt"])
    .withMessage("sortBy must be one of: createdAt, loggedAt"),
  query("sortOrder")
    .optional({ nullable: true })
    .isIn(["asc", "desc"])
    .withMessage("sortOrder must be 'asc' or 'desc'"),
  query("deleted")
    .optional({ nullable: true })
    .isBoolean()
    .withMessage("deleted must be boolean")
    .bail()
    .toBoolean(),
  query("createdBy")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("createdBy must be a valid MongoDB ID"),
  query().custom((_, { req }) => {
    req.validated = req.validated || {};
    const { page, limit, sortBy, sortOrder, deleted, createdBy } = req.query;
    req.validated.query = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      sortBy,
      sortOrder,
      deleted: deleted === true,
      createdBy,
    };
    return true;
  }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "GET /tasks/:taskId/activities/:activityId",
 *   "purpose": "Get single activity by ID with complete details.",
 *   "validates": ["activityId"],
 *   "rules": ["Tenant-scoped existence validation"]
 * }
 */
export const validateGetTaskActivity = [
  param("activityId")
    .exists({ checkFalsy: true })
    .withMessage("Activity ID is required")
    .bail()
    .isMongoId()
    .withMessage("Activity ID must be a valid MongoDB ID")
    .bail()
    .custom(async (activityId, { req }) => {
      const orgId = req.user?.organization?._id;
      const deptId = req.user?.department?._id;
      const activity = await TaskActivity.findOne({
        _id: activityId,
        organization: orgId,
        department: deptId,
        isDeleted: false,
      });
      if (!activity) throw new Error("Activity not found in your organization");
      return true;
    }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "PUT /api/tasks/:taskId/activities/:activityId",
 *   "purpose": "Update an existing activity.",
 *   "validates": ["activityId","activity","attachments","materials"],
 *   "rules": ["Tenant-scoped", "Attachments constraints", "Materials validation"]
 * }
 */
export const validateUpdateTaskActivity = [
  param("activityId")
    .exists({ checkFalsy: true })
    .withMessage("Activity ID is required")
    .bail()
    .isMongoId()
    .withMessage("Activity ID must be a valid MongoDB ID")
    .bail()
    .custom(async (activityId, { req }) => {
      const orgId = req.user?.organization?._id;
      const deptId = req.user?.department?._id;
      const activity = await TaskActivity.findOne({
        _id: activityId,
        organization: orgId,
        department: deptId,
        isDeleted: false,
      });
      if (!activity) throw new Error("Activity not found in your organization");
      return true;
    }),

  body("activity")
    .optional({ nullable: true })
    .isString()
    .withMessage("Activity must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: MAX_DESCRIPTION_LENGTH })
    .withMessage(`Activity cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`),

  validateAttachmentsArray,
  ...validateAttachmentFields,

  body("materials")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Materials must be an array")
    .bail()
    .custom((materials) => {
      if (materials?.length > MAX_MATERIALS_PER_ENTITY) {
        throw new Error(`Materials cannot exceed ${MAX_MATERIALS_PER_ENTITY}`);
      }
      return true;
    }),
  body("materials.*.materialId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("Material ID must be a valid MongoDB ID")
    .bail()
    .custom(async (materialId, { req }) => {
      if (!materialId) return true;
      const orgId = req.user?.organization?._id;
      const mat = await Material.findOne({
        _id: materialId,
        organization: orgId,
        isDeleted: false,
      });
      if (!mat) throw new Error("Material not found in your organization");
      return true;
    }),
  body("materials.*.quantity")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Quantity must be a non-negative number"),

  body("organizationId")
    .not()
    .exists()
    .withMessage(
      "organizationId cannot be provided. Organization is determined from authentication context"
    ),
  body("task")
    .not()
    .exists()
    .withMessage(
      "task cannot be provided. Parent task is determined from URL parameters"
    ),
  body("taskModel")
    .not()
    .exists()
    .withMessage(
      "taskModel cannot be provided. Parent task model is determined from URL parameters"
    ),
  body("parent")
    .not()
    .exists()
    .withMessage(
      "parent cannot be provided. Parent is determined from URL parameters"
    ),
  body("parentId")
    .not()
    .exists()
    .withMessage(
      "parentId cannot be provided. Parent is determined from URL parameters"
    ),
  body().custom((_, { req }) => {
    req.validated = req.validated || {};
    const { activity, attachments, materials } = req.body;
    req.validated.body = {
      activity: activity?.trim(),
      attachments: attachments || [],
      materials:
        Array.isArray(materials) && materials?.length > 0
          ? materials.map((m) => ({
              materialId: m.materialId?.toString(),
              quantity:
                m.quantity !== undefined ? Number(m.quantity) : undefined,
            }))
          : undefined,
    };
    return true;
  }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "DELETE /api/tasks/:taskId/activities/:activityId",
 *   "purpose": "Soft delete an activity with cascade deletion.",
 *   "validates": ["activityId"],
 *   "rules": ["Tenant-scoped existence validation"]
 * }
 */
export const validateDeleteTaskActivity = [
  param("activityId")
    .exists({ checkFalsy: true })
    .withMessage("Activity ID is required")
    .bail()
    .isMongoId()
    .withMessage("Activity ID must be a valid MongoDB ID")
    .bail()
    .custom(async (activityId, { req }) => {
      const orgId = req.user?.organization?._id;
      const activity = await TaskActivity.findOne({
        _id: activityId,
        organization: orgId,
        isDeleted: false,
      });
      if (!activity) throw new Error("Activity not found in your organization");
      return true;
    }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "POST /api/tasks/:taskId/activities/:activityId/restore",
 *   "purpose": "Restore a soft-deleted activity with cascade restoration.",
 *   "validates": ["activityId"],
 *   "rules": ["Tenant-scoped existence (deleted) validation"]
 * }
 */
export const validateRestoreTaskActivity = [
  param("activityId")
    .exists({ checkFalsy: true })
    .withMessage("Activity ID is required")
    .bail()
    .isMongoId()
    .withMessage("Activity ID must be a valid MongoDB ID")
    .bail()
    .custom(async (activityId, { req }) => {
      const orgId = req.user?.organization?._id;
      const activity = await TaskActivity.findOne({
        _id: activityId,
        organization: orgId,
      }).withDeleted();
      if (!activity || activity.isDeleted !== true) {
        throw new Error("Soft-deleted activity not found in your organization");
      }
      return true;
    }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "POST /tasks/:taskId/comments",
 *   "purpose": "Create a new comment on any entity (tasks, activities, or other comments for threading).",
 *   "validates": ["taskId","parentId","parentModel","comment","mentionIds","attachments"],
 *   "rules": ["Tenant-scoped existence for parent", "Mentions uniqueness and existence", "Attachment constraints", "Parent determined from URL for task comments"]
 * }
 */
export const validateCreateTaskComment = [
  param("taskId")
    .exists({ checkFalsy: true })
    .withMessage("Task ID is required")
    .bail()
    .isMongoId()
    .withMessage("Task ID must be a valid MongoDB ID")
    .bail()
    .custom(async (taskId, { req }) => {
      const orgId = req.user?.organization?._id;
      const task = await BaseTask.findOne({
        _id: taskId,
        organization: orgId,
        isDeleted: false,
      });
      if (!task) throw new Error("Task not found in your organization");
      req.foundTask = task;
      return true;
    }),
  body("parentId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("parentId must be a valid MongoDB ID"),
  body("parentModel")
    .optional({ nullable: true })
    .isIn(TASK_COMMENT_PARENT_MODELS)
    .withMessage(
      `parentModel must be one of: ${TASK_COMMENT_PARENT_MODELS.join(", ")}`
    )
    .bail()
    .custom(async (parentModel, { req }) => {
      const orgId = req.user?.organization?._id;
      const parentId = req.body.parentId;
      const taskId = req.params.taskId;

      // If no parentId/parentModel provided, default to task from URL
      if (!parentId && !parentModel) {
        return true;
      }

      // Both must be provided together
      if ((parentId && !parentModel) || (!parentId && parentModel)) {
        throw new Error("parentId and parentModel must be provided together");
      }

      if (!mongoose.isValidObjectId(parentId)) return false;

      if (
        ["RoutineTask", "AssignedTask", "ProjectTask"].includes(parentModel)
      ) {
        // If commenting on a task, it must be the task from the URL
        if (parentId !== taskId) {
          throw new Error(
            "When commenting on a task, parentId must match the taskId from URL"
          );
        }
        const task = await BaseTask.findOne({
          _id: parentId,
          organization: orgId,
          isDeleted: false,
        });
        if (!task)
          throw new Error("Parent task not found in your organization");
      } else if (parentModel === "TaskActivity") {
        const act = await TaskActivity.findOne({
          _id: parentId,
          task: taskId,
          organization: orgId,
          isDeleted: false,
        });
        if (!act)
          throw new Error(
            "Parent activity not found or does not belong to this task"
          );
      } else if (parentModel === "TaskComment") {
        const com = await TaskComment.findOne({
          _id: parentId,
          organization: orgId,
          isDeleted: false,
        });
        if (!com)
          throw new Error("Parent comment not found in your organization");
      }
      return true;
    }),

  body("comment")
    .exists({ checkFalsy: true })
    .withMessage("Comment content is required")
    .bail()
    .isString()
    .withMessage("Comment must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: MAX_DESCRIPTION_LENGTH })
    .withMessage(`Comment cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`),

  body("mentionIds")
    .optional({ nullable: true })
    .isArray()
    .withMessage("mentionIds must be an array")
    .bail()
    .custom((ids) => {
      if (ids?.length > MAX_MENTIONS_PER_COMMENT) {
        throw new Error(
          `You can only mention up to ${MAX_MENTIONS_PER_COMMENT} users`
        );
      }
      const unique = new Set(ids.map((i) => i?.toString()).filter(Boolean));
      if (unique.size !== ids?.length) {
        throw new Error("Duplicate mentions are not allowed");
      }
      return true;
    })
    .customSanitizer((ids) => dedupeIds(ids))
    .custom(async (ids, { req }) => {
      if (!ids || ids?.length === 0) return true;
      const orgId = req.user?.organization?._id;
      const users = await User.find({
        _id: { $in: ids },
        organization: orgId,
        isDeleted: false,
      });
      if (users?.length !== ids?.length) {
        throw new Error("All mentioned users must belong to your organization");
      }
      return true;
    }),

  validateAttachmentsArray,
  ...validateAttachmentFields,

  body("organizationId")
    .not()
    .exists()
    .withMessage(
      "organizationId cannot be provided. Organization is determined from authentication context"
    ),
  body("parent")
    .not()
    .exists()
    .withMessage(
      "parent cannot be provided. Use parentId and parentModel, or omit to comment on the task from URL"
    ),
  body().custom((_, { req }) => {
    req.validated = req.validated || {};
    const { parentId, parentModel, comment, mentionIds, attachments } =
      req.body;

    // If no parentId/parentModel provided, default to task from URL
    const finalParentId = parentId || req.params.taskId;
    const finalParentModel = parentModel || req.foundTask.taskType;

    req.validated.body = {
      parentId: finalParentId,
      parentModel: finalParentModel,
      comment: comment?.trim(),
      mentionIds: dedupeIds(mentionIds),
      attachments: attachments || [],
    };
    return true;
  }),

  handleValidationErrors,
];

/**
 * @json {
 *   "route": "GET /tasks/:taskId/comments",
 *   "purpose": "List comments for a specific parent entity with threading support.",
 *   "validates": ["parentId","parentModel","page","limit","includeThreads","deleted","createdBy","sortBy","sortOrder"],
 *   "rules": ["Tenant-scoped", "Pagination", "Threading flag handling"]
 * }
 */
export const validateListTaskComments = [
  query("parentId")
    .exists({ checkFalsy: true })
    .withMessage("parentId is required")
    .bail()
    .isMongoId()
    .withMessage("parentId must be a valid MongoDB ID"),
  query("parentModel")
    .exists({ checkFalsy: true })
    .withMessage("parentModel is required")
    .bail()
    .isIn(TASK_COMMENT_PARENT_MODELS)
    .withMessage(
      `parentModel must be one of: ${TASK_COMMENT_PARENT_MODELS.join(", ")}`
    ),
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be >= 1"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("includeThreads")
    .optional({ nullable: true })
    .isBoolean()
    .withMessage("includeThreads must be boolean")
    .toBoolean(),
  query("deleted")
    .optional({ nullable: true })
    .isBoolean()
    .withMessage("deleted must be boolean")
    .toBoolean(),
  query("createdBy")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("createdBy must be a valid MongoDB ID"),
  query("sortBy")
    .optional({ nullable: true })
    .isIn(["createdAt"])
    .withMessage("sortBy must be 'createdAt'"),
  query("sortOrder")
    .optional({ nullable: true })
    .isIn(["asc", "desc"])
    .withMessage("sortOrder must be 'asc' or 'desc'"),
  query().custom((_, { req }) => {
    req.validated = req.validated || {};
    const {
      parentId,
      parentModel,
      page,
      limit,
      includeThreads,
      deleted,
      createdBy,
      sortBy,
      sortOrder,
    } = req.query;

    req.validated.query = {
      parentId,
      parentModel,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      includeThreads: includeThreads === true,
      deleted: deleted === true,
      createdBy,
      sortBy,
      sortOrder,
    };
    return true;
  }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "GET /tasks/:taskId/comments/:commentId",
 *   "purpose": "Get single comment by ID with complete details including mentions, attachments, and threaded replies.",
 *   "validates": ["commentId"],
 *   "rules": ["Tenant-scoped existence validation"]
 * }
 */
export const validateGetTaskComment = [
  param("commentId")
    .exists({ checkFalsy: true })
    .withMessage("Comment ID is required")
    .bail()
    .isMongoId()
    .withMessage("Comment ID must be a valid MongoDB ID")
    .bail()
    .custom(async (commentId, { req }) => {
      const orgId = req.user?.organization?._id;
      const comment = await TaskComment.findOne({
        _id: commentId,
        organization: orgId,
        isDeleted: false,
      });
      if (!comment) throw new Error("Comment not found in your organization");
      return true;
    }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "PUT /tasks/:taskId/comments/:commentId",
 *   "purpose": "Update a comment.",
 *   "validates": ["commentId","comment","mentionIds","attachments"],
 *   "rules": ["Tenant-scoped", "Mentions and attachments constraints"]
 * }
 */
export const validateUpdateTaskComment = [
  param("commentId")
    .exists({ checkFalsy: true })
    .withMessage("Comment ID is required")
    .bail()
    .isMongoId()
    .withMessage("Comment ID must be a valid MongoDB ID")
    .bail()
    .custom(async (commentId, { req }) => {
      const orgId = req.user?.organization?._id;
      const comment = await TaskComment.findOne({
        _id: commentId,
        organization: orgId,
        isDeleted: false,
      });
      if (!comment) throw new Error("Comment not found in your organization");
      return true;
    }),

  body("comment")
    .optional({ nullable: true })
    .isString()
    .withMessage("Comment must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: MAX_DESCRIPTION_LENGTH })
    .withMessage(`Comment cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`),

  body("mentionIds")
    .optional({ nullable: true })
    .isArray()
    .withMessage("mentionIds must be an array")
    .bail()
    .custom((ids) => {
      if (ids?.length > MAX_MENTIONS_PER_COMMENT) {
        throw new Error(
          `You can only mention up to ${MAX_MENTIONS_PER_COMMENT} users`
        );
      }
      const unique = new Set(ids.map((i) => i?.toString()).filter(Boolean));
      if (unique.size !== ids?.length) {
        throw new Error("Duplicate mentions are not allowed");
      }
      return true;
    })
    .customSanitizer((ids) => dedupeIds(ids))
    .custom(async (ids, { req }) => {
      if (!ids || ids?.length === 0) return true;
      const orgId = req.user?.organization?._id;
      const users = await User.find({
        _id: { $in: ids },
        organization: orgId,
        isDeleted: false,
      });
      if (users?.length !== ids?.length) {
        throw new Error("All mentioned users must belong to your organization");
      }
      return true;
    }),

  validateAttachmentsArray,
  ...validateAttachmentFields,

  body("organizationId")
    .not()
    .exists()
    .withMessage(
      "organizationId cannot be provided. Organization is determined from authentication context"
    ),
  body("parent")
    .not()
    .exists()
    .withMessage(
      "parent cannot be modified. Parent is determined at creation time"
    ),
  body("parentId")
    .not()
    .exists()
    .withMessage(
      "parentId cannot be modified. Parent is determined at creation time"
    ),
  body("parentModel")
    .not()
    .exists()
    .withMessage(
      "parentModel cannot be modified. Parent is determined at creation time"
    ),
  body().custom((_, { req }) => {
    req.validated = req.validated || {};
    const { comment, mentionIds, attachments } = req.body;
    req.validated.body = {
      comment: comment?.trim(),
      mentionIds: dedupeIds(mentionIds),
      attachments: attachments || [],
    };
    return true;
  }),

  handleValidationErrors,
];

/**
 * @json {
 *   "route": "DELETE /tasks/:taskId/comments/:commentId",
 *   "purpose": "Soft delete a comment with full cascade deletion for threaded replies.",
 *   "validates": ["commentId"],
 *   "rules": ["Tenant-scoped existence validation"]
 * }
 */
export const validateDeleteTaskComment = [
  param("commentId")
    .exists({ checkFalsy: true })
    .withMessage("Comment ID is required")
    .bail()
    .isMongoId()
    .withMessage("Comment ID must be a valid MongoDB ID")
    .bail()
    .custom(async (commentId, { req }) => {
      const orgId = req.user?.organization?._id;
      const comment = await TaskComment.findOne({
        _id: commentId,
        organization: orgId,
        isDeleted: false,
      });
      if (!comment) throw new Error("Comment not found in your organization");
      return true;
    }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "POST /tasks/:taskId/comments/:commentId/restore",
 *   "purpose": "Restore a soft-deleted comment with full cascade restoration for threaded replies.",
 *   "validates": ["commentId"],
 *   "rules": ["Tenant-scoped existence (deleted) validation"]
 * }
 */
export const validateRestoreTaskComment = [
  param("commentId")
    .exists({ checkFalsy: true })
    .withMessage("Comment ID is required")
    .bail()
    .isMongoId()
    .withMessage("Comment ID must be a valid MongoDB ID")
    .bail()
    .custom(async (commentId, { req }) => {
      const orgId = req.user?.organization?._id;
      const comment = await TaskComment.findOne({
        _id: commentId,
        organization: orgId,
      }).withDeleted();
      if (!comment || comment.isDeleted !== true) {
        throw new Error("Soft-deleted comment not found in your organization");
      }
      return true;
    }),
  handleValidationErrors,
];
