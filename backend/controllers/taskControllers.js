// backend/controllers/taskControllers.js
import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import CustomError from "../errorHandler/CustomError.js";
import {
  BaseTask,
  AssignedTask,
  ProjectTask,
  RoutineTask,
  Attachment,
  TaskActivity,
  TaskComment,
  Notification,
} from "../models/index.js";
import { createNotification, escapeRegex } from "../utils/helpers.js";
import {
  TASK_TYPES,
  HEAD_OF_DEPARTMENT_ROLES,
  MAX_ATTACHMENTS_PER_ENTITY,
} from "../utils/constants.js";
import {
  emitToRecipients,
  emitToDepartment,
  emitToOrganization,
} from "../utils/socketEmitter.js";

/**
 * Helper to populate a task comprehensively
 */
const populateTask = async (taskId, session) => {
  const basePopulate = BaseTask.findOne({ _id: taskId })
    .session(session || null)
    .populate({
      path: "attachments",
      match: { isDeleted: false },
    })
    .populate({
      path: "watchers",
      match: { isDeleted: false },
      select: "firstName lastName role department",
    })
    .populate({
      path: "createdBy",
      match: { isDeleted: false },
      select: "firstName lastName role department",
    });

  const task = await basePopulate.exec();

  if (!task) return null;

  // Type-specific population
  if (task.taskType === "AssignedTask") {
    await task.populate({
      path: "assignees",
      match: { isDeleted: false },
      select: "firstName lastName role department",
    });
  } else if (task.taskType === "ProjectTask") {
    await task.populate({
      path: "vendor",
      match: { isDeleted: false },
    });
  } else if (task.taskType === "RoutineTask") {
    await task.populate({
      path: "materials.material",
      match: { isDeleted: false },
    });
  }

  return task;
};

/**
 * Collect default recipients for task notifications
 */
const collectTaskRecipients = (task) => {
  const watcherIds = Array.isArray(task.watchers)
    ? task.watchers.map((w) => w.toString())
    : [];
  const assigneeIds =
    task.taskType === "AssignedTask" && Array.isArray(task.assignees)
      ? task.assignees.map((a) => a.toString())
      : [];
  return [...new Set([...watcherIds, ...assigneeIds])];
};

/**
 * Create Attachment docs for a parent entity
 */
const createAttachments = async ({
  parentId,
  parentModel,
  orgId,
  uploaderId,
  attachments,
  session,
}) => {
  if (!attachments || attachments.length === 0) return [];
  if (attachments.length > MAX_ATTACHMENTS_PER_ENTITY) {
    throw new CustomError(
      `Attachments cannot exceed ${MAX_ATTACHMENTS_PER_ENTITY}`,
      400,
      "ATTACHMENT_LIMIT_ERROR"
    );
  }
  const docs = attachments.map((att) => ({
    originalName: att.originalName,
    storedName: att.storedName,
    mimeType: att.mimeType,
    size: att.size,
    type: att.type,
    url: att.url,
    publicId: att.publicId,
    format: att.format,
    width: att.width,
    height: att.height,
    parent: parentId,
    parentModel,
    organization: orgId,
    uploadedBy: uploaderId,
  }));
  const created = await Attachment.insertMany(docs, { session });
  return created.map((d) => d._id);
};

/**
 * Restore TaskComment tree recursively
 */
const restoreCommentTree = async (commentId, session) => {
  await TaskComment.restoreById(commentId, { session });
  const children = await TaskComment.find({
    parent: commentId,
    parentModel: "TaskComment",
  })
    .onlyDeleted()
    .session(session);
  for (const child of children) {
    await restoreCommentTree(child._id, session);
  }
  const attachments = await Attachment.find({
    parent: commentId,
    parentModel: "TaskComment",
  })
    .onlyDeleted()
    .session(session);
  for (const att of attachments) {
    await Attachment.restoreById(att._id, { session });
  }
};

/**
 * @json {
 *   "controller": "createTask",
 *   "route": "POST /tasks",
 *   "purpose": "Create a new task of any type (RoutineTask, AssignedTask, ProjectTask) based on taskType field.",
 *   "transaction": true,
 *   "returns": "Created task object with all relationships populated"
 * }
 */
export const createTask = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const deptId = req.user.department._id;
  const callerId = req.user._id;

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
    materialIds,
  } = req.validated.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let taskDoc;

    if (!TASK_TYPES.includes(taskType)) {
      throw new CustomError("Invalid taskType", 400, "VALIDATION_ERROR");
    }

    const base = {
      title,
      description,
      status:
        taskType === "RoutineTask" ? status || "Completed" : status || "To Do",
      priority:
        taskType === "RoutineTask"
          ? priority || "Medium"
          : priority || "Medium",
      organization: orgId,
      department: deptId,
      createdBy: callerId,
      watchers: watcherIds || [],
      tags: tags || [],
    };

    if (taskType === "AssignedTask") {
      taskDoc = await AssignedTask.create(
        [
          {
            ...base,
            startDate,
            dueDate,
            assignees: assigneeIds || [],
          },
        ],
        { session }
      );
      taskDoc = taskDoc[0];
    } else if (taskType === "ProjectTask") {
      taskDoc = await ProjectTask.create(
        [
          {
            ...base,
            startDate,
            dueDate,
            vendor: vendorId,
            estimatedCost,
            actualCost,
            currency,
          },
        ],
        { session }
      );
      taskDoc = taskDoc[0];
    } else if (taskType === "RoutineTask") {
      taskDoc = await RoutineTask.create(
        [
          {
            ...base,
            date,
            materials:
              Array.isArray(materialIds) && materialIds.length > 0
                ? materialIds
                : [],
          },
        ],
        { session }
      );
      taskDoc = taskDoc[0];
    }

    const createdAttachmentIds = await createAttachments({
      parentId: taskDoc._id,
      parentModel: taskType,
      orgId,
      uploaderId: callerId,
      attachments,
      session,
    });

    if (createdAttachmentIds.length > 0) {
      taskDoc.attachments = [
        ...(taskDoc.attachments || []),
        ...createdAttachmentIds,
      ];
      await taskDoc.save({ session });
    }

    const populatedTask = await populateTask(taskDoc._id, session);

    // Notifications & realtime
    const recipientIds = collectTaskRecipients(taskDoc);
    const notification = await createNotification(session, {
      type: "Created",
      title: "Task Created",
      message: `Task "${title}" has been created`,
      entity: taskDoc._id,
      entityModel: taskType,
      recipients: recipientIds,
      organization: orgId,
      department: deptId,
      createdBy: callerId,
    });

    if (notification && recipientIds.length > 0) {
      emitToRecipients(recipientIds, "task:created", {
        taskId: taskDoc._id,
        title: taskDoc.title,
      });
    }
    emitToDepartment(deptId, "department:task:created", {
      taskId: taskDoc._id,
    });
    emitToOrganization(orgId, "organization:task:created", {
      taskId: taskDoc._id,
    });

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: populatedTask,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

/**
 * @json {
 *   "controller": "getAllTasks",
 *   "route": "GET /tasks",
 *   "purpose": "List all tasks across all types with filtering and pagination.",
 *   "transaction": false,
 *   "returns": "Tasks array with pagination metadata"
 * }
 */
export const getAllTasks = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const deptId = req.user.department._id;
  const role = req.user.role;

  const {
    page = 1,
    limit = 10,
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
    sortBy = "createdAt",
    sortOrder = "desc",
    deleted = false,
    createdBy,
    watcherId,
    tags,
  } = req.validated.query;

  const filter = {
    organization: orgId,
  };

  // Role scope: HOD can see crossDept; others restricted to own dept
  if (HEAD_OF_DEPARTMENT_ROLES.includes(role)) {
    if (departmentId) {
      filter.department = departmentId;
    }
  } else {
    filter.department = deptId;
  }

  if (taskType) filter.taskType = taskType;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assigneeId) filter.assignees = assigneeId;
  if (vendorId) filter.vendor = vendorId;
  if (createdBy) filter.createdBy = createdBy;
  if (watcherId) filter.watchers = watcherId;
  if (Array.isArray(tags) && tags.length > 0) {
    filter.tags = { $in: tags };
  }

  // Date range filters
  if (dueDateFrom || dueDateTo) {
    filter.dueDate = {};
    if (dueDateFrom) filter.dueDate.$gte = new Date(dueDateFrom);
    if (dueDateTo) filter.dueDate.$lte = new Date(dueDateTo);
  }
  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = new Date(dateFrom);
    if (dateTo) filter.date.$lte = new Date(dateTo);
  }

  // Search by title/description (regex)
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ title: rx }, { description: rx }, { tags: rx }];
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const paginateOptions = {
    page,
    limit,
    sort,
    populate: [
      {
        path: "createdBy",
        match: { isDeleted: false },
        select: "firstName lastName role department",
      },
      {
        path: "watchers",
        match: { isDeleted: false },
        select: "firstName lastName role department",
      },
      {
        path: "assignees",
        match: { isDeleted: false },
        select: "firstName lastName role department",
      },
    ],
  };

  let query = BaseTask.find(filter);
  if (deleted) {
    query = query.onlyDeleted();
  }

  const result = await BaseTask.paginate(query.getFilter(), paginateOptions);

  return res.status(200).json({
    success: true,
    message: "Tasks fetched successfully",
    pagination: {
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalCount: result.totalDocs,
      hasNext: result.hasNextPage,
      hasPrev: result.hasPrevPage,
    },
    data: result.docs,
  });
});

/**
 * @json {
 *   "controller": "getTask",
 *   "route": "GET /tasks/:taskId",
 *   "purpose": "Get single task by ID with complete details including all activities, comments, attachments, assignees, vendor information, materials, and cost history.",
 *   "transaction": false,
 *   "returns": "Comprehensive task document with activities and comments collections"
 * }
 */
export const getTask = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const { taskId } = req.params;

  const session = null;

  const task = await populateTask(taskId, session);
  if (!task || task.organization.toString() !== orgId.toString()) {
    throw new CustomError("Task not found", 404, "NOT_FOUND");
  }

  // Activities
  const activities = await TaskActivity.find({
    task: taskId,
    organization: orgId,
    isDeleted: false,
  })
    .populate({
      path: "attachments",
      match: { isDeleted: false },
    })
    .populate({
      path: "materials.material",
      match: { isDeleted: false },
    })
    .populate({
      path: "createdBy",
      match: { isDeleted: false },
      select: "firstName lastName role department",
    })
    .sort({ createdAt: -1 });

  // Top-level comments (task-level)
  const topComments = await TaskComment.find({
    parent: taskId,
    parentModel: { $in: ["RoutineTask", "AssignedTask", "ProjectTask"] },
    organization: orgId,
    isDeleted: false,
  })
    .populate({
      path: "mentions",
      match: { isDeleted: false },
      select: "firstName lastName role department",
    })
    .populate({
      path: "attachments",
      match: { isDeleted: false },
    })
    .populate({
      path: "createdBy",
      match: { isDeleted: false },
      select: "firstName lastName role department",
    })
    .sort({ createdAt: -1 });

  // Fetch replies (one level deep, recursive logic could be added for more)
  const replies = await TaskComment.find({
    parent: { $in: topComments.map((c) => c._id) },
    parentModel: "TaskComment",
    organization: orgId,
    isDeleted: false,
  })
    .populate({
      path: "mentions",
      match: { isDeleted: false },
      select: "firstName lastName role department",
    })
    .populate({
      path: "attachments",
      match: { isDeleted: false },
    })
    .populate({
      path: "createdBy",
      match: { isDeleted: false },
      select: "firstName lastName role department",
    })
    .sort({ createdAt: 1 });

  // Attach replies to their parents
  const commentsWithThreads = topComments.map((c) => ({
    ...c.toObject(),
    replies: replies.filter((r) => r.parent.toString() === c._id.toString()),
  }));

  return res.status(200).json({
    success: true,
    message: "Task fetched successfully",
    data: {
      task,
      activities,
      comments: commentsWithThreads,
    },
  });
});

/**
 * @json {
 *   "controller": "updateTask",
 *   "route": "PUT /tasks/:taskId",
 *   "purpose": "Update a task of any type.",
 *   "transaction": true,
 *   "returns": "Updated task object with all relationships populated"
 * }
 */
export const updateTask = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const deptId = req.user.department._id;
  const callerId = req.user._id;
  const { taskId } = req.params;

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
    materialIds,
  } = req.validated.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let task = await BaseTask.findOne({
      _id: taskId,
      organization: orgId,
      isDeleted: false,
    }).session(session);

    if (!task)
      throw new CustomError("Task not found", 404, "TASK_NOT_FOUND_ERROR");

    // Assign base fields if provided
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (Array.isArray(watcherIds)) task.watchers = watcherIds;
    if (Array.isArray(tags)) task.tags = tags;

    // Type-specific
    if (task.taskType === "AssignedTask") {
      if (startDate !== undefined) task.startDate = startDate;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (Array.isArray(assigneeIds)) task.assignees = assigneeIds;
    } else if (task.taskType === "ProjectTask") {
      let costOrCurrencyModified = false;
      if (startDate !== undefined) task.startDate = startDate;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (vendorId !== undefined) task.vendor = vendorId;
      if (estimatedCost !== undefined) {
        task.estimatedCost = estimatedCost;
        costOrCurrencyModified = true;
      }
      if (actualCost !== undefined) {
        task.actualCost = actualCost;
        costOrCurrencyModified = true;
      }
      if (currency !== undefined) {
        task.currency = currency;
        costOrCurrencyModified = true;
      }
      if (costOrCurrencyModified) {
        task.modifiedBy = callerId;
      }
    } else if (task.taskType === "RoutineTask") {
      if (date !== undefined) task.date = date;
      if (Array.isArray(materialIds)) {
        task.materials = materialIds;
      }
    }

    // Save to trigger schema validations
    await task.save({ session });

    // Add new attachments if any (append)
    if (Array.isArray(attachments) && attachments.length > 0) {
      const newAttachmentIds = await createAttachments({
        parentId: task._id,
        parentModel: task.taskType,
        orgId,
        uploaderId: callerId,
        attachments,
        session,
      });
      if (newAttachmentIds.length > 0) {
        task.attachments = [...(task.attachments || []), ...newAttachmentIds];
        await task.save({ session });
      }
    }

    const populatedTask = await populateTask(task._id, session);

    // Notifications & realtime
    const recipientIds = collectTaskRecipients(task);
    const notification = await createNotification(session, {
      type: "Updated",
      title: "Task Updated",
      message: `Task "${task.title}" has been updated`,
      entity: task._id,
      entityModel: task.taskType,
      recipients: recipientIds,
      organization: orgId,
      department: deptId,
      createdBy: callerId,
    });

    if (notification && recipientIds.length > 0) {
      emitToRecipients(recipientIds, "task:updated", {
        taskId: task._id,
        title: task.title,
      });
    }
    emitToDepartment(deptId, "department:task:updated", { taskId: task._id });
    emitToOrganization(orgId, "organization:task:updated", {
      taskId: task._id,
    });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: populatedTask,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

/**
 * @json {
 *   "controller": "deleteTask",
 *   "route": "DELETE /tasks/:taskId",
 *   "purpose": "Soft delete a task with full cascade deletion.",
 *   "transaction": true,
 *   "returns": "Success with deletion timestamp and affected resources count"
 * }
 */
export const deleteTask = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const deptId = req.user.department._id;
  const callerId = req.user._id;
  const { taskId } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const task = await BaseTask.findOne({
      _id: taskId,
      organization: orgId,
      isDeleted: false,
    }).session(session);

    if (!task)
      throw new CustomError("Task not found", 404, "TASK_NOT_FOUND_ERROR");

    await BaseTask.softDeleteByIdWithCascade(taskId, {
      session,
      deletedBy: callerId,
    });

    // Notify watchers/assignees
    const recipientIds = collectTaskRecipients(task);
    const notification = await createNotification(session, {
      type: "Deleted",
      title: "Task Deleted",
      message: `Task "${task.title}" has been deleted`,
      entity: task._id,
      entityModel: task.taskType,
      recipients: recipientIds,
      organization: orgId,
      department: deptId,
      createdBy: callerId,
    });

    if (notification && recipientIds.length > 0) {
      emitToRecipients(recipientIds, "task:deleted", { taskId });
    }
    emitToDepartment(deptId, "department:task:deleted", { taskId });
    emitToOrganization(orgId, "organization:task:deleted", { taskId });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Task soft-deleted successfully",
      data: { taskId },
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

/**
 * @json {
 *   "controller": "restoreTask",
 *   "route": "POST /tasks/:taskId/restore",
 *   "purpose": "Restore a soft-deleted task with full cascade restoration.",
 *   "transaction": true,
 *   "returns": "Restored task object with all relationships"
 * }
 */
export const restoreTask = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const deptId = req.user.department._id;
  const callerId = req.user._id;
  const { taskId } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const taskWithDeleted = await BaseTask.findOne({
      _id: taskId,
      organization: orgId,
    })
      .withDeleted()
      .session(session);

    if (!taskWithDeleted || taskWithDeleted.isDeleted !== true) {
      throw new CustomError(
        "Soft-deleted task not found",
        404,
        "TASK_NOT_FOUND_ERROR"
      );
    }

    // Restore linked entities (attachments, activities, comments, notifications)
    const taskType = taskWithDeleted.taskType;

    const taskAttachments = await Attachment.find({
      parent: taskId,
      parentModel: { $in: ["RoutineTask", "AssignedTask", "ProjectTask"] },
    })
      .onlyDeleted()
      .session(session);
    for (const att of taskAttachments) {
      await Attachment.restoreById(att._id, { session });
    }

    const activities = await TaskActivity.find({
      task: taskId,
    })
      .onlyDeleted()
      .session(session);
    for (const act of activities) {
      await TaskActivity.restoreById(act._id, { session });

      const actAttachments = await Attachment.find({
        parent: act._id,
        parentModel: "TaskActivity",
      })
        .onlyDeleted()
        .session(session);
      for (const att of actAttachments) {
        await Attachment.restoreById(att._id, { session });
      }

      const actComments = await TaskComment.find({
        parent: act._id,
        parentModel: "TaskActivity",
      })
        .onlyDeleted()
        .session(session);
      for (const com of actComments) {
        await restoreCommentTree(com._id, session);
      }
    }

    const taskComments = await TaskComment.find({
      parent: taskId,
      parentModel: { $in: ["RoutineTask", "AssignedTask", "ProjectTask"] },
    })
      .onlyDeleted()
      .session(session);
    for (const com of taskComments) {
      await restoreCommentTree(com._id, session);
    }

    const notifications = await Notification.find({
      entity: taskId,
      entityModel: { $in: ["RoutineTask", "AssignedTask", "ProjectTask"] },
    })
      .onlyDeleted()
      .session(session);
    for (const n of notifications) {
      await Notification.restoreById(n._id, { session });
    }

    // Finally restore the task itself
    await BaseTask.restoreById(taskId, { session });

    const restoredTask = await populateTask(taskId, session);

    // Notify
    const recipientIds = collectTaskRecipients(restoredTask);
    const notification = await createNotification(session, {
      type: "Restored",
      title: "Task Restored",
      message: `Task "${restoredTask.title}" has been restored`,
      entity: restoredTask._id,
      entityModel: taskType,
      recipients: recipientIds,
      organization: orgId,
      department: deptId,
      createdBy: callerId,
    });

    if (notification && recipientIds.length > 0) {
      emitToRecipients(recipientIds, "task:restored", { taskId });
    }
    emitToDepartment(deptId, "department:task:restored", { taskId });
    emitToOrganization(orgId, "organization:task:restored", { taskId });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Task restored successfully",
      data: restoredTask,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

/**
 * @json {
 *   "controller": "createTaskActivity",
 *   "route": "POST /tasks/:taskId/activities",
 *   "purpose": "Create a new activity log for a specific task.",
 *   "transaction": true,
 *   "returns": "Created activity with relationships"
 * }
 */
export const createTaskActivity = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const deptId = req.user.department._id;
  const callerId = req.user._id;
  const { taskId } = req.params;
  const { activity, attachments, materialIds } = req.validated.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const task = await BaseTask.findOne({
      _id: taskId,
      organization: orgId,
      isDeleted: false,
    }).session(session);

    if (!task)
      throw new CustomError("Task not found", 404, "TASK_NOT_FOUND_ERROR");

    if (!["AssignedTask", "ProjectTask"].includes(task.taskType)) {
      throw new CustomError(
        "Activities can only be created for AssignedTask or ProjectTask",
        400,
        "VALIDATION_ERROR"
      );
    }

    const activityDocArr = await TaskActivity.create(
      [
        {
          task: taskId,
          taskModel: task.taskType,
          activity,
          materials:
            Array.isArray(materialIds) && materialIds.length > 0
              ? materialIds
              : [],
          organization: orgId,
          department: deptId,
          createdBy: callerId,
        },
      ],
      { session }
    );
    const activityDoc = activityDocArr[0];

    const createdAttachmentIds = await createAttachments({
      parentId: activityDoc._id,
      parentModel: "TaskActivity",
      orgId,
      uploaderId: callerId,
      attachments,
      session,
    });

    if (createdAttachmentIds.length > 0) {
      activityDoc.attachments = [
        ...(activityDoc.attachments || []),
        ...createdAttachmentIds,
      ];
      await activityDoc.save({ session });
    }

    const populatedActivity = await TaskActivity.findById(activityDoc._id)
      .session(session)
      .populate({
        path: "attachments",
        match: { isDeleted: false },
      })
      .populate({
        path: "materials.material",
        match: { isDeleted: false },
      })
      .populate({
        path: "createdBy",
        match: { isDeleted: false },
        select: "firstName lastName role department",
      });

    // Notifications & realtime
    const recipientIds = collectTaskRecipients(task);
    const notification = await createNotification(session, {
      type: "Created",
      title: "Activity Logged",
      message: `An activity was added to "${task.title}"`,
      entity: activityDoc._id,
      entityModel: "TaskActivity",
      recipients: recipientIds,
      organization: orgId,
      department: deptId,
      createdBy: callerId,
    });

    if (notification && recipientIds.length > 0) {
      emitToRecipients(recipientIds, "activity:created", {
        taskId,
        activityId: activityDoc._id,
      });
    }
    emitToDepartment(deptId, "department:activity:created", {
      taskId,
      activityId: activityDoc._id,
    });
    emitToOrganization(orgId, "organization:activity:created", {
      taskId,
      activityId: activityDoc._id,
    });

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Activity created successfully",
      data: populatedActivity,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

/**
 * @json {
 *   "controller": "getAllTaskActivities",
 *   "route": "GET /tasks/:taskId/activities",
 *   "purpose": "List all activities for a specific task with pagination.",
 *   "transaction": false,
 *   "returns": "Activities array with pagination metadata"
 * }
 */
export const getAllTaskActivities = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const { taskId } = req.params;
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    deleted = false,
    createdBy,
  } = req.validated.query;

  const filter = {
    organization: orgId,
    task: taskId,
  };
  if (createdBy) filter.createdBy = createdBy;

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  let query = TaskActivity.find(filter);
  if (deleted) query = query.onlyDeleted();

  const options = {
    page,
    limit,
    sort,
    populate: [
      { path: "attachments", match: { isDeleted: false } },
      { path: "materials.material", match: { isDeleted: false } },
      {
        path: "createdBy",
        match: { isDeleted: false },
        select: "firstName lastName role department",
      },
    ],
  };

  const result = await TaskActivity.paginate(query.getFilter(), options);

  return res.status(200).json({
    success: true,
    message: "Activities fetched successfully",
    pagination: {
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalCount: result.totalDocs,
      hasNext: result.hasNextPage,
      hasPrev: result.hasPrevPage,
    },
    data: result.docs,
  });
});

/**
 * @json {
 *   "controller": "getTaskActivity",
 *   "route": "GET /tasks/:taskId/activities/:activityId",
 *   "purpose": "Get single activity by ID with complete details.",
 *   "transaction": false,
 *   "returns": "Activity document with relationships"
 * }
 */
export const getTaskActivity = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const { activityId } = req.params;

  const activity = await TaskActivity.findOne({
    _id: activityId,
    organization: orgId,
    isDeleted: false,
  })
    .populate({
      path: "attachments",
      match: { isDeleted: false },
    })
    .populate({
      path: "materials.material",
      match: { isDeleted: false },
    })
    .populate({
      path: "createdBy",
      match: { isDeleted: false },
      select: "firstName lastName role department",
    });

  if (!activity) throw new CustomError("Activity not found", 404, "NOT_FOUND");

  return res.status(200).json({
    success: true,
    message: "Activity fetched successfully",
    data: activity,
  });
});

/**
 * @json {
 *   "controller": "updateTaskActivity",
 *   "route": "PUT /tasks/:taskId/activities/:activityId",
 *   "purpose": "Update an existing activity.",
 *   "transaction": true,
 *   "returns": "Updated activity with relationships"
 * }
 */
export const updateTaskActivity = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const deptId = req.user.department._id;
  const callerId = req.user._id;
  const { activityId } = req.params;
  const { activity, attachments, materialIds } = req.validated.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const act = await TaskActivity.findOne({
      _id: activityId,
      organization: orgId,
      isDeleted: false,
    }).session(session);

    if (!act) throw new CustomError("Activity not found", 404, "NOT_FOUND");

    if (activity !== undefined) act.activity = activity;
    if (Array.isArray(materialIds)) act.materials = materialIds;

    await act.save({ session });

    if (Array.isArray(attachments) && attachments.length > 0) {
      const newAttIds = await createAttachments({
        parentId: act._id,
        parentModel: "TaskActivity",
        orgId,
        uploaderId: callerId,
        attachments,
        session,
      });
      if (newAttIds.length > 0) {
        act.attachments = [...(act.attachments || []), ...newAttIds];
        await act.save({ session });
      }
    }

    const populated = await TaskActivity.findById(act._id)
      .session(session)
      .populate({ path: "attachments", match: { isDeleted: false } })
      .populate({
        path: "materials.material",
        match: { isDeleted: false },
      })
      .populate({
        path: "createdBy",
        match: { isDeleted: false },
        select: "firstName lastName role department",
      });

    // Notify task stakeholders
    const task = await BaseTask.findById(act.task).session(session);
    const recipients = collectTaskRecipients(task);
    const notification = await createNotification(session, {
      type: "Updated",
      title: "Activity Updated",
      message: `An activity was updated on "${task.title}"`,
      entity: act._id,
      entityModel: "TaskActivity",
      recipients,
      organization: orgId,
      department: deptId,
      createdBy: callerId,
    });

    if (notification && recipients.length > 0) {
      emitToRecipients(recipients, "activity:updated", {
        taskId: String(task._id),
        activityId: String(act._id),
      });
    }
    emitToDepartment(deptId, "department:activity:updated", {
      taskId: String(task._id),
      activityId: String(act._id),
    });
    emitToOrganization(orgId, "organization:activity:updated", {
      taskId: String(task._id),
      activityId: String(act._id),
    });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Activity updated successfully",
      data: populated,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

/**
 * @json {
 *   "controller": "deleteTaskActivity",
 *   "route": "DELETE /tasks/:taskId/activities/:activityId",
 *   "purpose": "Soft delete an activity with cascade deletion.",
 *   "transaction": true,
 *   "returns": "Success message with deletion timestamp"
 * }
 */
export const deleteTaskActivity = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const deptId = req.user.department._id;
  const callerId = req.user._id;
  const { activityId } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const act = await TaskActivity.findOne({
      _id: activityId,
      organization: orgId,
      isDeleted: false,
    }).session(session);

    if (!act) throw new CustomError("Activity not found", 404, "NOT_FOUND");

    await TaskActivity.softDeleteByIdWithCascade(activityId, {
      session,
      deletedBy: callerId,
    });

    const task = await BaseTask.findById(act.task).session(session);
    const recipients = collectTaskRecipients(task);
    const notification = await createNotification(session, {
      type: "Deleted",
      title: "Activity Deleted",
      message: `An activity was deleted from "${task.title}"`,
      entity: act._id,
      entityModel: "TaskActivity",
      recipients,
      organization: orgId,
      department: deptId,
      createdBy: callerId,
    });

    if (notification && recipients.length > 0) {
      emitToRecipients(recipients, "activity:deleted", {
        taskId: String(task._id),
        activityId: String(act._id),
      });
    }
    emitToDepartment(deptId, "department:activity:deleted", {
      taskId: String(task._id),
      activityId: String(act._id),
    });
    emitToOrganization(orgId, "organization:activity:deleted", {
      taskId: String(task._id),
      activityId: String(act._id),
    });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Activity soft-deleted successfully",
      data: { activityId },
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

/**
 * @json {
 *   "controller": "restoreTaskActivity",
 *   "route": "POST /tasks/:taskId/activities/:activityId/restore",
 *   "purpose": "Restore a soft-deleted activity with cascade restoration.",
 *   "transaction": true,
 *   "returns": "Restored activity with relationships"
 * }
 */
export const restoreTaskActivity = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const deptId = req.user.department._id;
  const callerId = req.user._id;
  const { activityId } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const actWithDeleted = await TaskActivity.findOne({
      _id: activityId,
      organization: orgId,
    })
      .withDeleted()
      .session(session);

    if (!actWithDeleted || actWithDeleted.isDeleted !== true) {
      throw new CustomError(
        "Soft-deleted activity not found",
        404,
        "NOT_FOUND"
      );
    }

    // Restore linked comments and attachments
    const attToRestore = await Attachment.find({
      parent: activityId,
      parentModel: "TaskActivity",
    })
      .onlyDeleted()
      .session(session);
    for (const att of attToRestore) {
      await Attachment.restoreById(att._id, { session });
    }

    const commentsToRestore = await TaskComment.find({
      parent: activityId,
      parentModel: "TaskActivity",
    })
      .onlyDeleted()
      .session(session);
    for (const com of commentsToRestore) {
      await restoreCommentTree(com._id, session);
    }

    await TaskActivity.restoreById(activityId, { session });

    const restored = await TaskActivity.findById(activityId)
      .session(session)
      .populate({ path: "attachments", match: { isDeleted: false } })
      .populate({
        path: "materials.material",
        match: { isDeleted: false },
      })
      .populate({
        path: "createdBy",
        match: { isDeleted: false },
        select: "firstName lastName role department",
      });

    const task = await BaseTask.findById(restored.task).session(session);
    const recipients = collectTaskRecipients(task);
    const notification = await createNotification(session, {
      type: "Restored",
      title: "Activity Restored",
      message: `An activity was restored on "${task.title}"`,
      entity: restored._id,
      entityModel: "TaskActivity",
      recipients,
      organization: orgId,
      department: deptId,
      createdBy: callerId,
    });

    if (notification && recipients.length > 0) {
      emitToRecipients(recipients, "activity:restored", {
        taskId: String(task._id),
        activityId: String(restored._id),
      });
    }
    emitToDepartment(deptId, "department:activity:restored", {
      taskId: String(task._id),
      activityId: String(restored._id),
    });
    emitToOrganization(orgId, "organization:activity:restored", {
      taskId: String(task._id),
      activityId: String(restored._id),
    });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Activity restored successfully",
      data: restored,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

/**
 * @json {
 *   "controller": "createTaskComment",
 *   "route": "POST /tasks/:taskId/comments",
 *   "purpose": "Create a new comment on any entity.",
 *   "transaction": true,
 *   "returns": "Created comment with relationships"
 * }
 */
export const createTaskComment = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const deptId = req.user.department._id;
  const callerId = req.user._id;
  const { parentId, parentModel, comment, mentionIds, attachments } =
    req.validated.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const commentArr = await TaskComment.create(
      [
        {
          parent: parentId,
          parentModel,
          comment,
          mentions: Array.isArray(mentionIds) ? mentionIds : [],
          organization: orgId,
          department: deptId,
          createdBy: callerId,
        },
      ],
      { session }
    );
    const com = commentArr[0];

    const attachmentIds = await createAttachments({
      parentId: com._id,
      parentModel: "TaskComment",
      orgId,
      uploaderId: callerId,
      attachments,
      session,
    });

    if (attachmentIds.length > 0) {
      com.attachments = [...(com.attachments || []), ...attachmentIds];
      await com.save({ session });
    }

    const populated = await TaskComment.findById(com._id)
      .session(session)
      .populate({
        path: "mentions",
        match: { isDeleted: false },
        select: "firstName lastName role department",
      })
      .populate({
        path: "attachments",
        match: { isDeleted: false },
      })
      .populate({
        path: "createdBy",
        match: { isDeleted: false },
        select: "firstName lastName role department",
      });

    // Notifications: Mention recipients
    const recipients = Array.isArray(mentionIds) ? mentionIds : [];
    const notification = await createNotification(session, {
      type: "Mention",
      title: "You were mentioned",
      message: `${req.user.firstName} mentioned you in a comment`,
      entity: com._id,
      entityModel: "TaskComment",
      recipients,
      organization: orgId,
      department: deptId,
      createdBy: callerId,
    });
    if (notification && recipients.length > 0) {
      emitToRecipients(recipients, "comment:created", {
        commentId: String(com._id),
      });
    }
    emitToDepartment(deptId, "department:comment:created", {
      commentId: String(com._id),
    });
    emitToOrganization(orgId, "organization:comment:created", {
      commentId: String(com._id),
    });

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: populated,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

/**
 * @json {
 *   "controller": "getAllTaskComments",
 *   "route": "GET /tasks/:taskId/comments",
 *   "purpose": "List comments for a specific parent entity with threading support.",
 *   "transaction": false,
 *   "returns": "Comments array (optionally threaded) with pagination metadata"
 * }
 */
export const getAllTaskComments = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const {
    parentId,
    parentModel,
    page = 1,
    limit = 10,
    includeThreads = false,
    deleted = false,
    createdBy,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.validated.query;

  const filter = {
    organization: orgId,
    parent: parentId,
    parentModel,
  };
  if (createdBy) filter.createdBy = createdBy;

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  let query = TaskComment.find(filter).sort(sort);
  if (deleted) query = query.onlyDeleted();

  const result = await TaskComment.paginate(query.getFilter(), {
    page,
    limit,
    sort,
    populate: [
      {
        path: "mentions",
        match: { isDeleted: false },
        select: "firstName lastName role department",
      },
      { path: "attachments", match: { isDeleted: false } },
      {
        path: "createdBy",
        match: { isDeleted: false },
        select: "firstName lastName role department",
      },
    ],
  });

  let docs = result.docs;
  if (includeThreads && parentModel !== "TaskComment") {
    const parentIds = docs.map((d) => d._id);
    const childComments = await TaskComment.find({
      parent: { $in: parentIds },
      parentModel: "TaskComment",
      organization: orgId,
      isDeleted: false,
    })
      .populate({
        path: "mentions",
        match: { isDeleted: false },
        select: "firstName lastName role department",
      })
      .populate({ path: "attachments", match: { isDeleted: false } })
      .populate({
        path: "createdBy",
        match: { isDeleted: false },
        select: "firstName lastName role department",
      });

    const childrenByParent = childComments.reduce((acc, c) => {
      const key = c.parent.toString();
      acc[key] = acc[key] || [];
      acc[key].push(c);
      return acc;
    }, {});
    docs = docs.map((d) => ({
      ...d.toObject(),
      replies: childrenByParent[d._id.toString()] || [],
    }));
  }

  return res.status(200).json({
    success: true,
    message: "Comments fetched successfully",
    pagination: {
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalCount: result.totalDocs,
      hasNext: result.hasNextPage,
      hasPrev: result.hasPrevPage,
    },
    data: docs,
  });
});

/**
 * @json {
 *   "controller": "getTaskComment",
 *   "route": "GET /tasks/:taskId/comments/:commentId",
 *   "purpose": "Get single comment by ID with complete details including threaded replies.",
 *   "transaction": false,
 *   "returns": "Comment document with nested replies"
 * }
 */
export const getTaskComment = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const { commentId } = req.params;

  const comment = await TaskComment.findOne({
    _id: commentId,
    organization: orgId,
    isDeleted: false,
  })
    .populate({
      path: "mentions",
      match: { isDeleted: false },
      select: "firstName lastName role department",
    })
    .populate({ path: "attachments", match: { isDeleted: false } })
    .populate({
      path: "createdBy",
      match: { isDeleted: false },
      select: "firstName lastName role department",
    });

  if (!comment) throw new CustomError("Comment not found", 404, "NOT_FOUND");

  // Fetch replies (one level for brevity)
  const replies = await TaskComment.find({
    parent: comment._id,
    parentModel: "TaskComment",
    organization: orgId,
    isDeleted: false,
  })
    .populate({
      path: "mentions",
      match: { isDeleted: false },
      select: "firstName lastName role department",
    })
    .populate({ path: "attachments", match: { isDeleted: false } })
    .populate({
      path: "createdBy",
      match: { isDeleted: false },
      select: "firstName lastName role department",
    })
    .sort({ createdAt: 1 });

  return res.status(200).json({
    success: true,
    message: "Comment fetched successfully",
    data: { ...comment.toObject(), replies },
  });
});

/**
 * @json {
 *   "controller": "updateTaskComment",
 *   "route": "PUT /tasks/:taskId/comments/:commentId",
 *   "purpose": "Update a comment.",
 *   "transaction": true,
 *   "returns": "Updated comment with relationships"
 * }
 */
export const updateTaskComment = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const deptId = req.user.department._id;
  const callerId = req.user._id;
  const { commentId } = req.params;
  const { comment, mentionIds, attachments } = req.validated.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const com = await TaskComment.findOne({
      _id: commentId,
      organization: orgId,
      isDeleted: false,
    }).session(session);

    if (!com) throw new CustomError("Comment not found", 404, "NOT_FOUND");

    if (comment !== undefined) com.comment = comment;
    if (Array.isArray(mentionIds)) com.mentions = mentionIds;

    await com.save({ session });

    if (Array.isArray(attachments) && attachments.length > 0) {
      const attIds = await createAttachments({
        parentId: com._id,
        parentModel: "TaskComment",
        orgId,
        uploaderId: callerId,
        attachments,
        session,
      });
      if (attIds.length > 0) {
        com.attachments = [...(com.attachments || []), ...attIds];
        await com.save({ session });
      }
    }

    const populated = await TaskComment.findById(com._id)
      .session(session)
      .populate({
        path: "mentions",
        match: { isDeleted: false },
        select: "firstName lastName role department",
      })
      .populate({ path: "attachments", match: { isDeleted: false } })
      .populate({
        path: "createdBy",
        match: { isDeleted: false },
        select: "firstName lastName role department",
      });

    // Notify mentions
    const recipients = Array.isArray(mentionIds) ? mentionIds : [];
    const notification = await createNotification(session, {
      type: "Updated",
      title: "Comment Updated",
      message: "A comment you are mentioned in was updated",
      entity: com._id,
      entityModel: "TaskComment",
      recipients,
      organization: orgId,
      department: deptId,
      createdBy: callerId,
    });
    if (notification && recipients.length > 0) {
      emitToRecipients(recipients, "comment:updated", {
        commentId: String(com._id),
      });
    }
    emitToDepartment(deptId, "department:comment:updated", {
      commentId: String(com._id),
    });
    emitToOrganization(orgId, "organization:comment:updated", {
      commentId: String(com._id),
    });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: populated,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

/**
 * @json {
 *   "controller": "deleteTaskComment",
 *   "route": "DELETE /tasks/:taskId/comments/:commentId",
 *   "purpose": "Soft delete a comment with full cascade deletion for threaded replies.",
 *   "transaction": true,
 *   "returns": "Success message with deletion timestamp and affected replies count"
 * }
 */
export const deleteTaskComment = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const deptId = req.user.department._id;
  const callerId = req.user._id;
  const { commentId } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const com = await TaskComment.findOne({
      _id: commentId,
      organization: orgId,
      isDeleted: false,
    }).session(session);

    if (!com) throw new CustomError("Comment not found", 404, "NOT_FOUND");

    await TaskComment.softDeleteByIdWithCascade(commentId, {
      session,
      deletedBy: callerId,
    });

    emitToDepartment(deptId, "department:comment:deleted", {
      commentId: String(commentId),
    });
    emitToOrganization(orgId, "organization:comment:deleted", {
      commentId: String(commentId),
    });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Comment soft-deleted successfully",
      data: { commentId },
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

/**
 * @json {
 *   "controller": "restoreTaskComment",
 *   "route": "POST /tasks/:taskId/comments/:commentId/restore",
 *   "purpose": "Restore a soft-deleted comment with full cascade restoration for threaded replies.",
 *   "transaction": true,
 *   "returns": "Restored comment with relationships"
 * }
 */
export const restoreTaskComment = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const deptId = req.user.department._id;
  const callerId = req.user._id;
  const { commentId } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const comWithDeleted = await TaskComment.findOne({
      _id: commentId,
      organization: orgId,
    })
      .withDeleted()
      .session(session);

    if (!comWithDeleted || comWithDeleted.isDeleted !== true) {
      throw new CustomError("Soft-deleted comment not found", 404, "NOT_FOUND");
    }

    await restoreCommentTree(commentId, session);

    const restored = await TaskComment.findById(commentId)
      .session(session)
      .populate({
        path: "mentions",
        match: { isDeleted: false },
        select: "firstName lastName role department",
      })
      .populate({ path: "attachments", match: { isDeleted: false } })
      .populate({
        path: "createdBy",
        match: { isDeleted: false },
        select: "firstName lastName role department",
      });

    emitToDepartment(deptId, "department:comment:restored", {
      commentId: String(commentId),
    });
    emitToOrganization(orgId, "organization:comment:restored", {
      commentId: String(commentId),
    });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Comment restored successfully",
      data: restored,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});
