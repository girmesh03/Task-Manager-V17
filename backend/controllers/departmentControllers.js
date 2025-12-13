// backend/controllers/departmentControllers.js
import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import CustomError from "../errorHandler/CustomError.js";
import { Department, User, BaseTask, TaskActivity } from "../models/index.js";
import { createNotification } from "../utils/helpers.js";
import { HEAD_OF_DEPARTMENT_ROLES } from "../utils/constants.js";
import { emitToDepartment, emitToRecipients } from "../utils/socketEmitter.js";

/**
 * @json {
 *   "controller": "createDepartment",
 *   "route": "POST /departments",
 *   "purpose": "Create a new department within the user's organization",
 *   "transaction": true,
 *   "returns": "Created department object"
 * }
 */
export const createDepartment = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const callerId = req.user._id;
  const deptIdOfCaller = req.user.department._id;

  const { name, description } = req.validated.body;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const dept = new Department({
      name,
      description,
      organization: orgId,
      createdBy: callerId,
    });
    await dept.save({ session });
    const created = dept;

    const hodRecipients = await User.find({
      organization: orgId,
      role: { $in: HEAD_OF_DEPARTMENT_ROLES },
      isDeleted: false,
      _id: { $ne: callerId },
    })
      .select("_id")
      .session(session);
    const recipientIds = hodRecipients.map((u) => u._id);

    await createNotification(session, {
      type: "Created",
      title: "Department created",
      message: `Department "${created.name}" created`,
      entity: created._id,
      entityModel: "Department",
      recipients: recipientIds,
      organization: orgId,
      department: deptIdOfCaller,
      createdBy: callerId,
    });

    emitToDepartment(created._id, "department:created", {
      departmentId: created._id,
      name: created.name,
    });
    emitToRecipients(recipientIds, "department:created", {
      departmentId: created._id,
    });

    await session.commitTransaction();
    return res.status(201).json({
      success: true,
      message: "Department created successfully",
      department: created,
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
 *   "controller": "getAllDepartments",
 *   "route": "GET /departments",
 *   "purpose": "List departments based on authorization scope",
 *   "transaction": false,
 *   "returns": "Departments array with pagination metadata"
 * }
 */
export const getAllDepartments = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const {
    page = 1,
    limit = 10,
    search,
    deleted,
    sortBy,
    sortOrder,
  } = req.validated.query;

  const filter = { organization: orgId };
  if (search) {
    const rx = new RegExp(search, "i");
    filter.$or = [{ name: rx }, { description: rx }];
  }

  const options = {
    page,
    limit,
    sort: {
      [sortBy || "createdAt"]:
        sortOrder === "asc" || sortOrder === "1" ? 1 : -1,
    },
    select: "_id name description organization createdAt updatedAt isDeleted",
    lean: true,
  };

  let query = Department;
  if (deleted === true) {
    query = query.onlyDeleted();
  }

  const result = await query.paginate(filter, options);

  return res.status(200).json({
    success: true,
    message: "Departments fetched successfully",
    pagination: {
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalCount: result.totalDocs,
      hasNext: result.hasNextPage,
      hasPrev: result.hasPrevPage,
    },
    departments: result.docs,
  });
});

/**
 * @json {
 *   "controller": "getDepartment",
 *   "route": "GET /departments/:departmentId",
 *   "purpose": "Get single department by ID with users list, task statistics, recent activities, and HOD information",
 *   "transaction": false,
 *   "returns": "Department object with populated relationships and stats"
 * }
 */
export const getDepartment = asyncHandler(async (req, res, next) => {
  const { departmentId } = req.validated.params;
  const orgId = req.user.organization._id;

  const department = await Department.findOne({
    _id: departmentId,
    organization: orgId,
  })
    .populate({
      path: "organization",
      match: { isDeleted: false },
      select:
        "_id name description email phone address industry logoUrl createdBy createdAt",
    })
    .populate({
      path: "createdBy",
      match: { isDeleted: false },
      select:
        "_id firstName lastName email role position department organization profilePicture",
      populate: [
        {
          path: "department",
          match: { isDeleted: false },
          select: "_id name description",
        },
        {
          path: "organization",
          match: { isDeleted: false },
          select: "_id name",
        },
      ],
    })
    .lean();
  if (!department || department.isDeleted) {
    throw CustomError.notFound("Department not found", {
      departmentId,
      organizationId: orgId,
    });
  }

  const [users, tasksByStatus, recentActivities, hodUsers] = await Promise.all([
    // Users in department
    // Avoid populating password (schema select: false)
    (
      await import("../models/index.js")
    ).then(({ User }) =>
      User.find({ department: departmentId, isDeleted: false })
        .select(
          "_id firstName lastName position role email employeeId profilePicture"
        )
        .lean()
    ),
    (async () => {
      const [todo, inProgress, completed, pending] = await Promise.all([
        BaseTask.countDocuments({
          department: departmentId,
          status: "To Do",
          isDeleted: false,
        }),
        BaseTask.countDocuments({
          department: departmentId,
          status: "In Progress",
          isDeleted: false,
        }),
        BaseTask.countDocuments({
          department: departmentId,
          status: "Completed",
          isDeleted: false,
        }),
        BaseTask.countDocuments({
          department: departmentId,
          status: "Pending",
          isDeleted: false,
        }),
      ]);
      return { todo, inProgress, completed, pending };
    })(),
    TaskActivity.find({ department: departmentId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("_id activity createdBy task taskModel createdAt")
      .lean(),
    User.find({
      department: departmentId,
      role: { $in: HEAD_OF_DEPARTMENT_ROLES },
      isDeleted: false,
    })
      .select("_id firstName lastName role")
      .lean(),
  ]);

  return res.status(200).json({
    success: true,
    message: "Department fetched successfully",
    department: {
      ...department,
      users,
      stats: { tasks: tasksByStatus },
      recentActivities,
      headsOfDepartment: hodUsers,
    },
  });
});

/**
 * @json {
 *   "controller": "updateDepartment",
 *   "route": "PUT /departments/:departmentId",
 *   "purpose": "Update department details",
 *   "transaction": true,
 *   "returns": "Updated department object"
 * }
 */
export const updateDepartment = asyncHandler(async (req, res, next) => {
  const { departmentId } = req.validated.params;
  const { name, description } = req.validated.body;
  const orgId = req.user.organization._id;
  const callerId = req.user._id;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const update = {};
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;

    await Department.updateOne(
      { _id: departmentId, organization: orgId },
      { $set: update },
      { session }
    );

    const updated = await Department.findOne({ _id: departmentId })
      .populate({
        path: "organization",
        match: { isDeleted: false },
        select:
          "_id name description email phone address industry logoUrl createdBy createdAt",
      })
      .populate({
        path: "createdBy",
        match: { isDeleted: false },
        select:
          "_id firstName lastName email role position department organization profilePicture",
        populate: [
          {
            path: "department",
            match: { isDeleted: false },
            select: "_id name description",
          },
          {
            path: "organization",
            match: { isDeleted: false },
            select: "_id name",
          },
        ],
      })
      .session(session);

    const hodRecipients = await User.find({
      department: departmentId,
      role: { $in: HEAD_OF_DEPARTMENT_ROLES },
      isDeleted: false,
      _id: { $ne: callerId },
    })
      .select("_id")
      .session(session);
    const recipientIds = hodRecipients.map((u) => u._id);

    await createNotification(session, {
      type: "Updated",
      title: "Department updated",
      message: `Department "${updated.name}" updated`,
      entity: updated._id,
      entityModel: "Department",
      recipients: recipientIds,
      organization: orgId,
      department: departmentId,
      createdBy: callerId,
    });

    emitToDepartment(departmentId, "department:updated", {
      departmentId,
      updatedFields: Object.keys(update),
    });
    emitToRecipients(recipientIds, "department:updated", { departmentId });

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Department updated successfully",
      department: updated,
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
 *   "controller": "deleteDepartment",
 *   "route": "DELETE /departments/:departmentId",
 *   "purpose": "Soft delete a department with full cascade deletion",
 *   "transaction": true,
 *   "returns": "Success message with deletion timestamp"
 * }
 */
export const deleteDepartment = asyncHandler(async (req, res, next) => {
  const { departmentId } = req.validated.params;
  const orgId = req.user.organization._id;
  const callerId = req.user._id;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await Department.softDeleteByIdWithCascade(departmentId, { session });

    const hodRecipients = await User.find({
      department: departmentId,
      role: { $in: HEAD_OF_DEPARTMENT_ROLES },
      isDeleted: false,
      _id: { $ne: callerId },
    })
      .select("_id")
      .session(session);

    const recipientIds = hodRecipients.map((u) => u._id);

    await createNotification(session, {
      type: "Deleted",
      title: "Department deleted",
      message: "Department has been soft-deleted",
      entity: undefined,
      entityModel: undefined,
      recipients: recipientIds,
      organization: orgId,
      department: departmentId,
      createdBy: callerId,
    });

    emitToDepartment(departmentId, "department:deleted", { departmentId });

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Department soft-deleted successfully",
      department: { departmentId, deletedAt: new Date().toISOString() },
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
 *   "controller": "restoreDepartment",
 *   "route": "POST /departments/:departmentId/restore",
 *   "purpose": "Restore a soft-deleted department",
 *   "transaction": true,
 *   "returns": "Restored department object"
 * }
 */
export const restoreDepartment = asyncHandler(async (req, res, next) => {
  const { departmentId } = req.validated.params;
  const orgId = req.user.organization._id;
  const callerId = req.user._id;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await Department.restoreById(departmentId, { session });
    const restored = await Department.findOne({ _id: departmentId })
      .populate({
        path: "organization",
        match: { isDeleted: false },
        select:
          "_id name description email phone address industry logoUrl createdBy createdAt",
      })
      .populate({
        path: "createdBy",
        match: { isDeleted: false },
        select:
          "_id firstName lastName email role position department organization profilePicture",
        populate: [
          {
            path: "department",
            match: { isDeleted: false },
            select: "_id name description",
          },
          {
            path: "organization",
            match: { isDeleted: false },
            select: "_id name",
          },
        ],
      })
      .session(session);

    const hodRecipients = await User.find({
      department: departmentId,
      role: { $in: HEAD_OF_DEPARTMENT_ROLES },
      isDeleted: false,
      _id: { $ne: callerId },
    })
      .select("_id")
      .session(session);
    const recipientIds = hodRecipients.map((u) => u._id);

    await createNotification(session, {
      type: "Restored",
      title: "Department restored",
      message: `Department "${restored.name}" has been restored`,
      entity: restored._id,
      entityModel: "Department",
      recipients: recipientIds,
      organization: orgId,
      department: departmentId,
      createdBy: callerId,
    });

    emitToDepartment(departmentId, "department:restored", { departmentId });

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Department restored successfully",
      department: restored,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});
