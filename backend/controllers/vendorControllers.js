// backend/controllers/vendorControllers.js
import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import CustomError from "../errorHandler/CustomError.js";
import { Vendor, ProjectTask, User } from "../models/index.js";
import { createNotification } from "../utils/helpers.js";
import { HEAD_OF_DEPARTMENT_ROLES } from "../utils/constants.js";
import {
  emitToOrganization,
  emitToRecipients,
} from "../utils/socketEmitter.js";

/**
 * @json {
 *   "controller": "createVendor",
 *   "route": "POST /vendors",
 *   "purpose": "Create a new vendor for the organization",
 *   "transaction": true,
 *   "returns": "Created vendor object"
 * }
 */
export const createVendor = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const callerId = req.user._id;

  const { name, email, phone } = req.validated.body;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const vendor = new Vendor({
      name,
      email,
      phone,
      organization: orgId,
      createdBy: callerId,
    });

    await vendor.save({ session });

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
      title: "Vendor created",
      message: `Vendor "${vendor.name}" created`,
      entity: undefined,
      entityModel: undefined,
      recipients: recipientIds,
      organization: orgId,
      department: req.user.department._id,
      createdBy: callerId,
    });

    emitToOrganization(orgId, "vendor:created", { vendorId: vendor._id });
    emitToRecipients(recipientIds, "vendor:created", { vendorId: vendor._id });

    await session.commitTransaction();
    return res.status(201).json({
      success: true,
      message: "Vendor created successfully",
      vendor: vendor,
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
 *   "controller": "getAllVendors",
 *   "route": "GET /vendors",
 *   "purpose": "List vendors in the organization with pagination and search",
 *   "transaction": false,
 *   "returns": "Vendors array with pagination metadata"
 * }
 */
export const getAllVendors = asyncHandler(async (req, res, next) => {
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
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const options = {
    page,
    limit,
    sort: {
      [sortBy || "createdAt"]:
        sortOrder === "asc" || sortOrder === "1" ? 1 : -1,
    },
    select: "_id name email phone organization createdAt updatedAt isDeleted",
    lean: true,
  };

  let query = Vendor;
  if (deleted === true) query = query.onlyDeleted();

  const result = await query.paginate(filter, options);

  return res.status(200).json({
    success: true,
    message: "Vendors fetched successfully",
    pagination: {
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalCount: result.totalDocs,
      hasNext: result.hasNextPage,
      hasPrev: result.hasPrevPage,
    },
    vendors: result.docs,
  });
});

/**
 * @json {
 *   "controller": "getVendor",
 *   "route": "GET /vendors/:vendorId",
 *   "purpose": "Get single vendor by ID with project tasks, cost statistics, performance metrics, and contact info",
 *   "transaction": false,
 *   "returns": "Vendor object with tasks and statistics"
 * }
 */
export const getVendor = asyncHandler(async (req, res, next) => {
  const { vendorId } = req.validated.params;
  const orgId = req.user.organization._id;

  const vendor = await Vendor.findOne({
    _id: vendorId,
    organization: orgId,
    isDeleted: false,
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
  if (!vendor)
    throw CustomError.notFound("Vendor not found", {
      vendorId,
      organizationId: orgId,
    });

  const tasks = await ProjectTask.find({
    organization: orgId,
    vendor: vendorId,
    isDeleted: false,
  })
    .select(
      "_id title status priority startDate dueDate estimatedCost actualCost currency"
    )
    .lean();

  const stats = tasks.reduce(
    (acc, t) => {
      acc.count += 1;
      acc.estimatedCost += t.estimatedCost || 0;
      acc.actualCost += t.actualCost || 0;
      acc.byStatus[t.status] = (acc.byStatus[t.status] || 0) + 1;
      return acc;
    },
    { count: 0, estimatedCost: 0, actualCost: 0, byStatus: {} }
  );

  return res.status(200).json({
    success: true,
    message: "Vendor fetched successfully",
    vendor: {
      ...vendor,
      projects: tasks,
      stats,
    },
  });
});

/**
 * @json {
 *   "controller": "updateVendor",
 *   "route": "PUT /vendors/:vendorId",
 *   "purpose": "Update vendor details",
 *   "transaction": true,
 *   "returns": "Updated vendor object"
 * }
 */
export const updateVendor = asyncHandler(async (req, res, next) => {
  const { vendorId } = req.validated.params;
  const { name, email, phone } = req.validated.body;
  const orgId = req.user.organization._id;
  const callerId = req.user._id;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const update = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;
    if (phone !== undefined) update.phone = phone;

    await Vendor.updateOne(
      { _id: vendorId, organization: orgId },
      { $set: update },
      { session }
    );
    const updated = await Vendor.findOne({ _id: vendorId })
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
      organization: orgId,
      role: { $in: HEAD_OF_DEPARTMENT_ROLES },
      isDeleted: false,
      _id: { $ne: callerId },
    })
      .select("_id")
      .session(session);
    const recipientIds = hodRecipients.map((u) => u._id);

    await createNotification(session, {
      type: "Updated",
      title: "Vendor updated",
      message: `Vendor "${updated.name}" updated`,
      entity: undefined,
      entityModel: undefined,
      recipients: recipientIds,
      organization: orgId,
      department: req.user.department._id,
      createdBy: callerId,
    });

    emitToOrganization(orgId, "vendor:updated", { vendorId });
    emitToRecipients(recipientIds, "vendor:updated", { vendorId });

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Vendor updated successfully",
      vendor: updated,
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
 *   "controller": "deleteVendor",
 *   "route": "DELETE /vendors/:vendorId",
 *   "purpose": "Soft delete a vendor with reassignment option for active project tasks",
 *   "transaction": true,
 *   "returns": "Success message with deletion timestamp and reassignment details"
 * }
 */
export const deleteVendor = asyncHandler(async (req, res, next) => {
  const { vendorId } = req.validated.params;
  const { reassignToVendorId } = req.validated.body || {};
  const orgId = req.user.organization._id;
  const callerId = req.user._id;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await Vendor.softDeleteByIdWithReassign(vendorId, {
      reassignToVendorId,
      session,
      deletedBy: callerId,
    });

    await createNotification(session, {
      type: "Deleted",
      title: "Vendor deleted",
      message: reassignToVendorId
        ? "Vendor deleted with tasks reassigned"
        : "Vendor deleted",
      entity: undefined,
      entityModel: undefined,
      recipients: [],
      organization: orgId,
      department: req.user.department._id,
      createdBy: callerId,
    });

    emitToOrganization(orgId, "vendor:deleted", {
      vendorId,
      reassignToVendorId,
    });

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Vendor soft-deleted successfully",
      vendor: {
        vendorId,
        reassignToVendorId: reassignToVendorId || null,
        deletedAt: new Date().toISOString(),
      },
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
 *   "controller": "restoreVendor",
 *   "route": "POST /vendors/:vendorId/restore",
 *   "purpose": "Restore a soft-deleted vendor",
 *   "transaction": true,
 *   "returns": "Restored vendor object"
 * }
 */
export const restoreVendor = asyncHandler(async (req, res, next) => {
  const { vendorId } = req.validated.params;
  const orgId = req.user.organization._id;
  const callerId = req.user._id;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Vendor model overrides restoreById incorrectly; perform direct restore to avoid recursion
    await Vendor.updateOne(
      { _id: vendorId, organization: orgId, isDeleted: true },
      { $set: { isDeleted: false }, $unset: { deletedAt: 1, deletedBy: 1 } },
      { session }
    );

    const restored = await Vendor.findOne({ _id: vendorId })
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

    await createNotification(session, {
      type: "Restored",
      title: "Vendor restored",
      message: `Vendor "${restored.name}" has been restored`,
      entity: undefined,
      entityModel: undefined,
      recipients: [],
      organization: orgId,
      department: req.user.department._id,
      createdBy: callerId,
    });

    emitToOrganization(orgId, "vendor:restored", { vendorId });

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Vendor restored successfully",
      vendor: restored,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});
