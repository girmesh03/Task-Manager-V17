// backend/controllers/organizationControllers.js
import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import CustomError from "../errorHandler/CustomError.js";
import {
  Organization,
  Department,
  User,
  BaseTask,
  TaskActivity,
} from "../models/index.js";
import { createNotification } from "../utils/helpers.js";
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITY_MODELS,
  HEAD_OF_DEPARTMENT_ROLES,
} from "../utils/constants.js";
import {
  emitToOrganization,
  emitToRecipients,
} from "../utils/socketEmitter.js";

/**
 * @json {
 *   "controller": "getAllOrganizations",
 *   "route": "GET /organizations",
 *   "purpose": "List organizations based on user authorization",
 *   "transaction": false,
 *   "returns": "Organizations array with basic details, total count, and pagination info"
 * }
 */
export const getAllOrganizations = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const isPlatformUser =
    String(orgId) === String(process.env.PLATFORM_ORGANIZATION_ID);

  const {
    page = 1,
    limit = 10,
    search,
    deleted,
    industry,
    sortBy,
    sortOrder,
  } = req.validated.query;

  const filter = {};
  if (!isPlatformUser) {
    filter._id = orgId;
  }
  if (industry) filter.industry = industry;
  if (search) {
    const rx = new RegExp(search, "i");
    filter.$or = [{ name: rx }, { email: rx }, { address: rx }];
  }

  const options = {
    page,
    limit,
    sort: {
      [sortBy || "createdAt"]:
        sortOrder === "asc" || sortOrder === "1" ? 1 : -1,
    },
    select: "name email phone address industry createdAt updatedAt isDeleted",
    lean: true,
  };

  let query = Organization;
  if (deleted === true) {
    query = query.onlyDeleted();
  } else if (deleted === false) {
    // default behavior excludes deleted via plugin
  } else {
    // default: exclude deleted
  }

  const result = await query.paginate(filter, options);

  return res.status(200).json({
    success: true,
    message: "Organizations fetched successfully",
    pagination: {
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalCount: result.totalDocs,
      hasNext: result.hasNextPage,
      hasPrev: result.hasPrevPage,
    },
    organizations: result.docs,
  });
});

/**
 * @json {
 *   "controller": "getOrganizationDashboard",
 *   "route": "GET /organizations/:organizationId",
 *   "purpose": "Get single organization with complete dashboard",
 *   "transaction": false,
 *   "returns": "Organization object with stats and optional related collections"
 * }
 */
export const getOrganizationDashboard = asyncHandler(async (req, res, next) => {
  const { organizationId } = req.validated.params;

  const organization = await Organization.findOne({
    _id: organizationId,
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
  if (!organization || organization.isDeleted) {
    throw CustomError.notFound("Organization not found", {
      organizationId,
    });
  }
});

/**
 * @json {
 *   "controller": "updateOrganization",
 *   "route": "PUT /organizations/:organizationId",
 *   "purpose": "Update organization details",
 *   "transaction": true,
 *   "returns": "Updated organization object"
 * }
 */
export const updateOrganization = asyncHandler(async (req, res, next) => {
  const { organizationId } = req.validated.params;
  const { name, description, email, phone, address, industry, logoUrl } =
    req.validated.body;
  const orgId = req.user.organization._id;
  const callerId = req.user._id;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const update = {};
    if (name !== undefined) update.name = name.toLowerCase();
    if (description !== undefined) update.description = description;
    if (email !== undefined) update.email = email?.toLowerCase();
    if (phone !== undefined) update.phone = phone;
    if (address !== undefined) update.address = address;
    if (industry !== undefined) update.industry = industry;
    if (logoUrl !== undefined) update.logoUrl = logoUrl;

    await Organization.updateOne(
      { _id: organizationId },
      { $set: update },
      { session }
    );

    const updated = await Organization.findOne({ _id: organizationId })
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
      organization: organizationId,
      role: { $in: HEAD_OF_DEPARTMENT_ROLES },
      isDeleted: false,
      _id: { $ne: callerId },
    })
      .select("_id")
      .session(session);

    const recipientIds = hodRecipients.map((u) => u._id);

    await createNotification(session, {
      type: "Updated",
      title: "Organization updated",
      message: `Organization "${updated.name}" was updated`,
      entity: updated._id,
      entityModel: "Organization",
      recipients: recipientIds,
      organization: organizationId,
      department: req.user.department._id,
      createdBy: callerId,
    });

    emitToOrganization(organizationId, "organization:updated", {
      organizationId,
      updatedFields: Object.keys(update),
      updatedAt: new Date().toISOString(),
    });
    emitToRecipients(recipientIds, "organization:updated", {
      organizationId,
      updatedFields: Object.keys(update),
    });

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Organization updated successfully",
      organization: updated,
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
 *   "controller": "deleteOrganization",
 *   "route": "DELETE /organizations/:organizationId",
 *   "purpose": "Soft delete an organization with full cascade deletion",
 *   "transaction": true,
 *   "returns": "Success message with deletion timestamp"
 * }
 */
export const deleteOrganization = asyncHandler(async (req, res, next) => {
  const { organizationId } = req.validated.params;
  const callerId = req.user._id;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await Organization.softDeleteByIdWithCascade(organizationId, {
      session,
      deletedBy: callerId,
    });

    // Attempt to notify remaining active users (likely none after cascade)
    const recipients = await User.find({
      organization: organizationId,
      isDeleted: false,
      _id: { $ne: callerId },
    })
      .select("_id")
      .session(session);

    const recipientIds = recipients.map((u) => u._id);

    await createNotification(session, {
      type: "Deleted",
      title: "Organization deleted",
      message: "Organization has been soft-deleted",
      entity: undefined,
      entityModel: undefined,
      recipients: recipientIds,
      organization: organizationId,
      department: req.user.department._id,
      createdBy: callerId,
    });

    emitToOrganization(organizationId, "organization:deleted", {
      organizationId,
      deletedAt: new Date().toISOString(),
    });
    emitToRecipients(recipientIds, "organization:deleted", { organizationId });

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Organization soft-deleted successfully",
      organization: { organizationId, deletedAt: new Date().toISOString() },
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
 *   "controller": "restoreOrganization",
 *   "route": "POST /organizations/:organizationId/restore",
 *   "purpose": "Restore a soft-deleted organization",
 *   "transaction": true,
 *   "returns": "Restored organization object"
 * }
 */
export const restoreOrganization = asyncHandler(async (req, res, next) => {
  const { organizationId } = req.validated.params;
  const callerId = req.user._id;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await Organization.restoreById(organizationId, { session });

    const restored = await Organization.findOne({
      _id: organizationId,
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
      organization: organizationId,
      role: { $in: HEAD_OF_DEPARTMENT_ROLES },
      isDeleted: false,
      _id: { $ne: callerId },
    })
      .select("_id")
      .session(session);

    const recipientIds = hodRecipients.map((u) => u._id);

    await createNotification(session, {
      type: "Restored",
      title: "Organization restored",
      message: `Organization "${restored.name}" has been restored`,
      entity: restored._id,
      entityModel: "Organization",
      recipients: recipientIds,
      organization: organizationId,
      department: req.user.department._id,
      createdBy: callerId,
    });

    emitToOrganization(organizationId, "organization:restored", {
      organizationId,
      restoredAt: new Date().toISOString(),
    });
    emitToRecipients(recipientIds, "organization:restored", { organizationId });

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Organization restored successfully",
      organization: restored,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});
