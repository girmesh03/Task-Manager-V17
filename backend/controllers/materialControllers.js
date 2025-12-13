// backend/controllers/materialControllers.js
import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import CustomError from "../errorHandler/CustomError.js";
import { Material, RoutineTask, TaskActivity, User } from "../models/index.js";
import { createNotification } from "../utils/helpers.js";
import { emitToDepartment } from "../utils/socketEmitter.js";

/**
 * @json {
 *   "controller": "createMaterial",
 *   "route": "POST /api/materials",
 *   "purpose": "Create a new material within the organization",
 *   "transaction": true,
 *   "returns": "Created material object"
 * }
 */
export const createMaterial = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const deptId = req.user.department._id;
  const callerId = req.user._id;

  const { name, unit, price, category } = req.validated.body;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const material = await Material.create(
      [
        {
          name,
          unit,
          price,
          category,
          organization: orgId,
          department: deptId,
          addedBy: callerId,
        },
      ],
      { session }
    );
    const created = await Material.findById(material[0]._id)
      .session(session)
      .populate({
        path: "department",
        match: { isDeleted: false },
        select: "_id name",
      })
      .populate({
        path: "organization",
        match: { isDeleted: false },
        select: "_id name",
      })
      .populate({
        path: "addedBy",
        match: { isDeleted: false },
        select: "firstName lastName role department",
      });

    await createNotification(session, {
      type: "Created",
      title: "Material created",
      message: `Material "${created.name}" created`,
      entity: undefined,
      entityModel: undefined,
      recipients: [],
      organization: orgId,
      department: deptId,
      createdBy: callerId,
    });

    emitToDepartment(deptId, "material:created", { materialId: created._id });

    await session.commitTransaction();
    return res.status(201).json({
      success: true,
      message: "Material created successfully",
      material: created,
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
 *   "controller": "getAllMaterials",
 *   "route": "GET /api/materials",
 *   "purpose": "List materials based on authorization scope",
 *   "transaction": false,
 *   "returns": "Materials array with pagination metadata"
 * }
 */
export const getAllMaterials = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const {
    page = 1,
    limit = 10,
    search,
    category,
    departmentId,
    deleted,
    priceMin,
    priceMax,
    sortBy,
    sortOrder,
  } = req.validated.query;

  const filter = { organization: orgId };
  if (category) filter.category = category;
  if (departmentId) filter.department = departmentId;
  if (priceMin !== undefined)
    filter.price = { ...(filter.price || {}), $gte: priceMin };
  if (priceMax !== undefined)
    filter.price = { ...(filter.price || {}), $lte: priceMax };
  if (search) {
    const rx = new RegExp(search, "i");
    filter.$or = [{ name: rx }, { category: rx }];
  }

  const options = {
    page,
    limit,
    sort: {
      [sortBy || "createdAt"]:
        sortOrder === "asc" || sortOrder === "1" ? 1 : -1,
    },
    select:
      "_id name unit price category department organization addedBy createdAt isDeleted",
    populate: [
      { path: "department", match: { isDeleted: false }, select: "_id name" },
      {
        path: "addedBy",
        match: { isDeleted: false },
        select: "_id firstName lastName",
      },
    ],
    lean: true,
  };

  let query = Material;
  if (deleted === true) query = query.onlyDeleted();

  const result = await query.paginate(filter, options);

  return res.status(200).json({
    success: true,
    message: "Materials fetched successfully",
    pagination: {
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalCount: result.totalDocs,
      hasNext: result.hasNextPage,
      hasPrev: result.hasPrevPage,
    },
    materials: result.docs,
  });
});

/**
 * @json {
 *   "controller": "getMaterial",
 *   "route": "GET /api/materials/:materialId",
 *   "purpose": "Get single material by ID with usage statistics, recent tasks and activities, and cost analysis",
 *   "transaction": false,
 *   "returns": "Material object with optional usage details"
 * }
 */
export const getMaterial = asyncHandler(async (req, res, next) => {
  const { materialId } = req.validated.params;
  const { includeUsage, includeTasks, includeActivities } = req.validated.query;
  const orgId = req.user.organization._id;

  const material = await Material.findOne({
    _id: materialId,
    organization: orgId,
  })
    .populate({
      path: "department",
      match: { isDeleted: false },
      select: "_id name",
    })
    .populate({
      path: "organization",
      match: { isDeleted: false },
      select: "_id name",
    })
    .populate({
      path: "addedBy",
      match: { isDeleted: false },
      select: "firstName lastName role department",
    })
    .lean();
  if (!material)
    throw CustomError.notFound("Material not found", { materialId });

  let usage = null;
  let tasks = null;
  let activities = null;

  if (includeUsage) {
    const [routineCount, activityCount] = await Promise.all([
      RoutineTask.countDocuments({
        organization: orgId,
        "materials.material": materialId,
        isDeleted: false,
      }),
      TaskActivity.countDocuments({
        organization: orgId,
        "materials.material": materialId,
        isDeleted: false,
      }),
    ]);
    usage = { routineTasks: routineCount, taskActivities: activityCount };
  }

  if (includeTasks) {
    tasks = await RoutineTask.find({
      organization: orgId,
      "materials.material": materialId,
      isDeleted: false,
    })
      .select("_id title date status priority totalMaterialCost")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
  }

  if (includeActivities) {
    activities = await TaskActivity.find({
      organization: orgId,
      "materials.material": materialId,
      isDeleted: false,
    })
      .select("_id activity task taskModel totalMaterialCost createdAt")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
  }

  return res.status(200).json({
    success: true,
    message: "Material fetched successfully",
    material: {
      ...material,
      usage,
      recentTasks: tasks,
      recentActivities: activities,
    },
  });
});

/**
 * @json {
 *   "controller": "updateMaterial",
 *   "route": "PUT /api/materials/:materialId",
 *   "purpose": "Update material details",
 *   "transaction": true,
 *   "returns": "Updated material object"
 * }
 */
export const updateMaterial = asyncHandler(async (req, res, next) => {
  const { materialId } = req.validated.params;
  const { name, unit, price, category } = req.validated.body;

  const orgId = req.user.organization._id;
  const deptId = req.user.department._id;
  const callerId = req.user._id;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const update = {};
    if (name !== undefined) update.name = name;
    if (unit !== undefined) update.unit = unit;
    if (price !== undefined) update.price = price;
    if (category !== undefined) update.category = category;

    await Material.updateOne(
      { _id: materialId, organization: orgId },
      { $set: update },
      { session }
    );
    const updated = await Material.findOne({ _id: materialId }).session(
      session
    );

    await createNotification(session, {
      type: "Updated",
      title: "Material updated",
      message: `Material "${updated.name}" updated`,
      entity: undefined,
      entityModel: undefined,
      recipients: [],
      organization: orgId,
      department: deptId,
      createdBy: callerId,
    });

    emitToDepartment(updated.department, "material:updated", { materialId });

    const populatedUpdated = await Material.findById(updated._id)
      .session(session)
      .populate({
        path: "department",
        match: { isDeleted: false },
        select: "_id name",
      })
      .populate({
        path: "organization",
        match: { isDeleted: false },
        select: "_id name",
      })
      .populate({
        path: "addedBy",
        match: { isDeleted: false },
        select: "firstName lastName role department",
      });

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Material updated successfully",
      material: populatedUpdated,
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
 *   "controller": "deleteMaterial",
 *   "route": "DELETE /api/materials/:materialId",
 *   "purpose": "Soft delete a material with unlinking from all tasks and activities",
 *   "transaction": true,
 *   "returns": "Success message with deletion timestamp"
 * }
 */
export const deleteMaterial = asyncHandler(async (req, res, next) => {
  const { materialId } = req.validated.params;
  const orgId = req.user.organization._id;
  const deptId = req.user.department._id;
  const callerId = req.user._id;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await Material.softDeleteByIdWithUnlink(materialId, {
      session,
      deletedBy: callerId,
    });

    await createNotification(session, {
      type: "Deleted",
      title: "Material deleted",
      message: "Material soft-deleted and unlinked from tasks and activities",
      entity: undefined,
      entityModel: undefined,
      recipients: [],
      organization: orgId,
      department: deptId,
      createdBy: callerId,
    });

    emitToDepartment(deptId, "material:deleted", { materialId });

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Material soft-deleted successfully",
      material: { materialId, deletedAt: new Date().toISOString() },
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
 *   "controller": "restoreMaterial",
 *   "route": "POST /api/materials/:materialId/restore",
 *   "purpose": "Restore a soft-deleted material with relinking to all tasks and activities",
 *   "transaction": true,
 *   "returns": "Restored material object"
 * }
 */
export const restoreMaterial = asyncHandler(async (req, res, next) => {
  const { materialId } = req.validated.params;
  const orgId = req.user.organization._id;
  const deptId = req.user.department._id;
  const callerId = req.user._id;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await Material.restoreByIdWithRelink(materialId, { session });

    const restored = await Material.findById(materialId)
      .session(session)
      .populate({
        path: "department",
        match: { isDeleted: false },
        select: "_id name",
      })
      .populate({
        path: "organization",
        match: { isDeleted: false },
        select: "_id name",
      })
      .populate({
        path: "addedBy",
        match: { isDeleted: false },
        select: "firstName lastName role department",
      });

    await createNotification(session, {
      type: "Restored",
      title: "Material restored",
      message: "Material restored and relinked to tasks and activities",
      entity: undefined,
      entityModel: undefined,
      recipients: [],
      organization: orgId,
      department: deptId,
      createdBy: callerId,
    });

    emitToDepartment(restored.department, "material:restored", { materialId });

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Material restored successfully",
      material: restored,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});
