// backend/controllers/attachmentControllers.js
import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import CustomError from "../errorHandler/CustomError.js";
import { Attachment } from "../models/index.js";

/**
 * @json {
 *   "controller": "createAttachment",
 *   "route": "POST /api/attachments",
 *   "purpose": "Create a new attachment for a parent entity (task, activity, or comment)",
 *   "transaction": true,
 *   "returns": "Created attachment object with populated references"
 * }
 */
export const createAttachment = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const deptId = req.user.department._id;
  const userId = req.user._id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create attachment using new Model() pattern
    const attachment = new Attachment({
      ...req.validated.body,
      organization: orgId,
      department: deptId,
      uploadedBy: userId,
    });

    await attachment.save({ session });

    // Populate references
    await attachment.populate([
      {
        path: "uploadedBy",
        match: { isDeleted: false },
        select:
          "_id firstName lastName email role position department organization profilePicture",
        populate: [
          {
            path: "department",
            match: { isDeleted: false },
            select: "_id name",
          },
          {
            path: "organization",
            match: { isDeleted: false },
            select: "_id name",
          },
        ],
      },
      {
        path: "department",
        match: { isDeleted: false },
        select: "_id name description organization createdBy createdAt",
      },
      {
        path: "organization",
        match: { isDeleted: false },
        select:
          "_id name description email phone address industry logoUrl createdBy createdAt",
      },
      {
        path: "parent",
        match: { isDeleted: false },
      },
    ]);

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Attachment created successfully",
      attachment: attachment,
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
 *   "controller": "getAttachment",
 *   "route": "GET /api/attachments/:attachmentId",
 *   "purpose": "Get a specific attachment by ID with complete population",
 *   "transaction": false,
 *   "returns": "Attachment object with populated references"
 * }
 */
export const getAttachment = asyncHandler(async (req, res, next) => {
  const { attachmentId } = req.validated.params;
  const orgId = req.user.organization._id;

  const attachment = await Attachment.findOne({
    _id: attachmentId,
    organization: orgId,
    isDeleted: false,
  })
    .populate({
      path: "uploadedBy",
      match: { isDeleted: false },
      select:
        "_id firstName lastName email role position department organization profilePicture",
      populate: [
        {
          path: "department",
          match: { isDeleted: false },
          select: "_id name",
        },
        {
          path: "organization",
          match: { isDeleted: false },
          select: "_id name",
        },
      ],
    })
    .populate({
      path: "department",
      match: { isDeleted: false },
      select: "_id name description organization createdBy createdAt",
    })
    .populate({
      path: "organization",
      match: { isDeleted: false },
      select:
        "_id name description email phone address industry logoUrl createdBy createdAt",
    })
    .populate({
      path: "parent",
      match: { isDeleted: false },
    });

  if (!attachment) {
    throw CustomError.notFound("Attachment not found", { attachmentId });
  }

  return res.status(200).json({
    success: true,
    attachment: attachment,
  });
});

/**
 * @json {
 *   "controller": "getAllAttachments",
 *   "route": "GET /api/attachments",
 *   "purpose": "Get all attachments with pagination and filtering",
 *   "transaction": false,
 *   "returns": "Attachments array with pagination metadata"
 * }
 */
export const getAllAttachments = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const {
    page = 1,
    limit = 20,
    type,
    parentModel,
    parent,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build query
  const query = {
    organization: orgId,
    isDeleted: false,
  };

  if (type) {
    query.type = type;
  }

  if (parentModel) {
    query.parentModel = parentModel;
  }

  if (parent && mongoose.Types.ObjectId.isValid(parent)) {
    query.parent = parent;
  }

  // Build sort
  const sort = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  // Calculate pagination
  const skip = (Number(page) - 1) * Number(limit);

  // Execute query
  const [attachments, total] = await Promise.all([
    Attachment.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate({
        path: "uploadedBy",
        match: { isDeleted: false },
        select: "_id firstName lastName email profilePicture",
      })
      .populate({
        path: "department",
        match: { isDeleted: false },
        select: "_id name",
      })
      .populate({
        path: "parent",
        match: { isDeleted: false },
      }),
    Attachment.countDocuments(query),
  ]);

  return res.status(200).json({
    success: true,
    attachments: attachments,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * @json {
 *   "controller": "updateAttachment",
 *   "route": "PATCH /api/attachments/:attachmentId",
 *   "purpose": "Update an attachment's metadata (originalName, storedName)",
 *   "transaction": true,
 *   "returns": "Updated attachment object with populated references"
 * }
 */
export const updateAttachment = asyncHandler(async (req, res, next) => {
  const { attachmentId } = req.validated.params;
  const orgId = req.user.organization._id;
  const updates = req.validated.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find attachment
    const attachment = await Attachment.findOne({
      _id: attachmentId,
      organization: orgId,
      isDeleted: false,
    }).session(session);

    if (!attachment) {
      throw CustomError.notFound("Attachment not found", { attachmentId });
    }

    // Apply updates
    Object.keys(updates).forEach((key) => {
      attachment[key] = updates[key];
    });

    await attachment.save({ session });

    // Populate references
    await attachment.populate([
      {
        path: "uploadedBy",
        match: { isDeleted: false },
        select:
          "_id firstName lastName email role position department profilePicture",
      },
      {
        path: "department",
        match: { isDeleted: false },
        select: "_id name",
      },
      {
        path: "organization",
        match: { isDeleted: false },
        select: "_id name",
      },
      {
        path: "parent",
        match: { isDeleted: false },
      },
    ]);

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Attachment updated successfully",
      attachment: attachment,
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
 *   "controller": "deleteAttachment",
 *   "route": "DELETE /api/attachments/:attachmentId",
 *   "purpose": "Soft delete an attachment and schedule Cloudinary cleanup",
 *   "transaction": true,
 *   "returns": "Success message with deleted attachment ID"
 * }
 */
export const deleteAttachment = asyncHandler(async (req, res, next) => {
  const { attachmentId } = req.validated.params;
  const orgId = req.user.organization._id;
  const userId = req.user._id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find attachment
    const attachment = await Attachment.findOne({
      _id: attachmentId,
      organization: orgId,
      isDeleted: false,
    }).session(session);

    if (!attachment) {
      throw CustomError.notFound("Attachment not found", { attachmentId });
    }

    // Soft delete using the model's method
    await Attachment.softDeleteById(attachmentId, {
      session,
      deletedBy: userId,
    });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Attachment deleted successfully",
      attachment: {
        attachmentId,
        publicId: attachment.publicId,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});
