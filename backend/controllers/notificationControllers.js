// backend/controllers/notificationControllers.js
import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import CustomError from "../errorHandler/CustomError.js";
import { Notification } from "../models/index.js";

/**
 * @json {
 *   "controller": "getAllNotifications",
 *   "route": "GET /notifications",
 *   "purpose": "Get user notifications with pagination",
 *   "transaction": false,
 *   "returns": "Notifications array with pagination metadata"
 * }
 */
export const getAllNotifications = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const userId = req.user._id;
  const {
    page = 1,
    limit = 10,
    unreadOnly,
    type,
    deleted,
    sortBy = "sentAt",
    sortOrder = "desc",
  } = req.validated.query;

  const filter = {
    organization: orgId,
    recipients: [userId],
  };
  if (type) filter.type = type;

  if (unreadOnly) {
    filter.readBy = { $not: { $elemMatch: { user: userId } } };
  }

  const options = {
    page,
    limit,
    sort: { [sortBy]: sortOrder === "asc" || sortOrder === "1" ? 1 : -1 },
    select:
      "_id type title message entity entityModel recipients readBy organization department createdBy sentAt isDeleted",
    populate: [
      {
        path: "recipients",
        match: { isDeleted: false },
        select:
          "_id firstName lastName email role position department organization profilePicture",
      },
      {
        path: "createdBy",
        match: { isDeleted: false },
        select:
          "_id firstName lastName email role position department organization profilePicture",
        populate: {
          path: "department",
          match: { isDeleted: false },
          select: "_id name",
        },
      },
      {
        path: "entity",
        match: { isDeleted: false },
      },
      {
        path: "organization",
        match: { isDeleted: false },
        select: "_id name",
      },
      {
        path: "department",
        match: { isDeleted: false },
        select: "_id name",
      },
    ],
    lean: true,
  };

  let query = Notification;
  if (deleted === true) query = query.onlyDeleted();

  const result = await query.paginate(filter, options);

  return res.status(200).json({
    success: true,
    message: "Notifications fetched successfully",
    pagination: {
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalCount: result.totalDocs,
      hasNext: result.hasNextPage,
      hasPrev: result.hasPrevPage,
    },
    notifications: result.docs,
  });
});

/**
 * @json {
 *   "controller": "markNotificationRead",
 *   "route": "PATCH /notifications/:notificationId/read",
 *   "purpose": "Mark a notification as read",
 *   "transaction": true,
 *   "returns": "Updated notification object with read status"
 * }
 */
export const markNotificationRead = asyncHandler(async (req, res, next) => {
  const { notificationId } = req.validated.params;
  const userId = req.user._id;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const notif = await Notification.findOne({
      _id: notificationId,
      recipients: userId,
    }).session(session);
    if (!notif) {
      throw CustomError.notFound("Notification not found", {
        notificationId,
        userId,
      });
    }

    const alreadyRead = (notif.readBy || []).some(
      (rb) => String(rb.user) === String(userId)
    );
    if (!alreadyRead) {
      await Notification.updateOne(
        { _id: notificationId, "readBy.user": { $ne: userId } },
        { $push: { readBy: { user: userId, readAt: new Date() } } },
        { session }
      );
    }

    const updated = await Notification.findById(notificationId)
      .populate({
        path: "recipients",
        match: { isDeleted: false },
        select:
          "_id firstName lastName email role position department organization profilePicture",
      })
      .populate({
        path: "createdBy",
        match: { isDeleted: false },
        select:
          "_id firstName lastName email role position department organization profilePicture",
        populate: {
          path: "department",
          match: { isDeleted: false },
          select: "_id name",
        },
      })
      .populate({
        path: "entity",
        match: { isDeleted: false },
      })
      .populate({
        path: "organization",
        match: { isDeleted: false },
        select: "_id name",
      })
      .populate({
        path: "department",
        match: { isDeleted: false },
        select: "_id name",
      })
      .session(session);

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification: updated,
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
 *   "controller": "getUnreadCount",
 *   "route": "GET /notifications/unread-count",
 *   "purpose": "Get count of unread notifications for the authenticated user",
 *   "transaction": false,
 *   "returns": "Count object with unread notification total"
 * }
 */
export const getUnreadCount = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const userId = req.user._id;
  const { type } = req.validated.query;

  const filter = {
    organization: orgId,
    recipients: userId,
    isDeleted: false,
    readBy: { $not: { $elemMatch: { user: userId } } },
  };
  if (type) filter.type = type;

  const count = await Notification.countDocuments(filter);

  return res.status(200).json({
    success: true,
    message: "Unread notification count fetched successfully",
    notification: { count },
  });
});
