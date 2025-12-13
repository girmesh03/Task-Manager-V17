// backend/controllers/userControllers.js
import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import CustomError from "../errorHandler/CustomError.js";
import { User, Department, BaseTask, AssignedTask } from "../models/index.js";
import { createNotification } from "../utils/helpers.js";
import { HEAD_OF_DEPARTMENT_ROLES } from "../utils/constants.js";
import {
  emitToDepartment,
  emitToRecipients,
  emitToUser,
} from "../utils/socketEmitter.js";

/**
 * @json {
 *   "controller": "createUser",
 *   "route": "POST /users",
 *   "purpose": "Create a new user within a specific department",
 *   "transaction": true,
 *   "returns": "Created user object"
 * }
 */
export const createUser = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const callerId = req.user._id;

  const {
    firstName,
    lastName,
    position,
    role,
    email,
    password,
    departmentId,
    profilePicture,
    skills,
    employeeId,
    dateOfBirth,
    joinedAt,
  } = req.validated.body;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const dept = await Department.findOne({
      _id: departmentId,
      organization: orgId,
      isDeleted: false,
    }).session(session);
    if (!dept)
      throw CustomError.notFound("Department not found in your organization", {
        departmentId,
        organizationId: orgId,
      });

    const user = new User({
      firstName,
      lastName,
      position,
      role,
      email,
      password,
      organization: orgId,
      department: departmentId,
      profilePicture,
      skills,
      employeeId,
      dateOfBirth,
      joinedAt,
    });

    await user.save({ session });

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
      type: "Created",
      title: "User created",
      message: `User "${user.firstName} ${user.lastName}" created`,
      entity: user._id,
      entityModel: "User",
      recipients: recipientIds,
      organization: orgId,
      department: departmentId,
      createdBy: callerId,
    });

    emitToDepartment(departmentId, "user:created", { userId: user._id });
    emitToRecipients(recipientIds, "user:created", { userId: user._id });

    await session.commitTransaction();
    const createdUser = await User.findById(user._id)
      .populate({
        path: "department",
        match: { isDeleted: false },
        select: "_id name description organization createdBy createdAt",
        populate: {
          path: "organization",
          match: { isDeleted: false },
          select: "_id name",
        },
      })
      .populate({
        path: "organization",
        match: { isDeleted: false },
        select:
          "_id name description email phone address industry logoUrl createdBy createdAt",
      })
      .lean();

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: createdUser,
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
 *   "controller": "getAllUsers",
 *   "route": "GET /users",
 *   "purpose": "List users based on authorization scope",
 *   "transaction": false,
 *   "returns": "Users array with basic profile information and pagination metadata"
 * }
 */
export const getAllUsers = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const caller = req.user;
  const {
    page = 1,
    limit = 10,
    search,
    departmentId,
    role,
    position,
    deleted,
    sortBy,
    sortOrder,
  } = req.validated.query;

  const filter = { organization: orgId };
  if (departmentId) {
    filter.department = departmentId;
  } else {
    filter.department = caller.department._id;
  }

  if (role) filter.role = role;
  if (position) filter.position = new RegExp(position, "i");
  if (search) {
    const rx = new RegExp(search, "i");
    filter.$or = [
      { firstName: rx },
      { lastName: rx },
      { email: rx },
      { position: rx },
    ];
  }

  const options = {
    page,
    limit,
    sort: {
      [sortBy || "createdAt"]:
        sortOrder === "asc" || sortOrder === "1" ? 1 : -1,
    },
    select:
      "_id firstName lastName position role email employeeId department organization profilePicture createdAt isDeleted",
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
    lean: true,
  };

  let query = User;
  if (deleted === true) {
    query = query.onlyDeleted();
  }

  const result = await query.paginate(filter, options);

  return res.status(200).json({
    success: true,
    message: "Users fetched successfully",
    pagination: {
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalCount: result.totalDocs,
      hasNext: result.hasNextPage,
      hasPrev: result.hasPrevPage,
    },
    users: result.docs,
  });
});

/**
 * @json {
 *   "controller": "getUser",
 *   "route": "GET /users/:userId",
 *   "purpose": "Get single user with complete profile, assigned tasks, and performance metrics",
 *   "transaction": false,
 *   "returns": "User object with related data"
 * }
 */
export const getUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.validated.params;
  const orgId = req.user.organization._id;

  const user = await User.findOne({
    _id: userId,
    organization: orgId,
    isDeleted: false,
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
    .lean();
  if (!user)
    throw CustomError.notFound("User not found", {
      userId,
      organizationId: orgId,
    });

  const [assignedTasks, completedCount, inProgressCount] = await Promise.all([
    AssignedTask.find({
      organization: orgId,
      assignees: userId,
      isDeleted: false,
    })
      .select("_id title status priority dueDate")
      .lean(),
    BaseTask.countDocuments({
      organization: orgId,
      createdBy: userId,
      status: "Completed",
      isDeleted: false,
    }),
    BaseTask.countDocuments({
      organization: orgId,
      createdBy: userId,
      status: "In Progress",
      isDeleted: false,
    }),
  ]);

  return res.status(200).json({
    success: true,
    message: "User fetched successfully",
    user: {
      ...user,
      assignedTasks,
      performance: {
        createdTasksCompleted: completedCount,
        createdTasksInProgress: inProgressCount,
      },
    },
  });
});

/**
 * @json {
 *   "controller": "updateUserBy",
 *   "route": "PUT /users/:userId",
 *   "purpose": "Update user by SuperAdmin - can update any user fields including role changes and department transfers",
 *   "transaction": true,
 *   "returns": "Updated user object"
 * }
 */
export const updateUserBy = asyncHandler(async (req, res, next) => {
  const { userId } = req.validated.params;
  const {
    firstName,
    lastName,
    position,
    role,
    departmentId,
    profilePicture,
    skills,
    employeeId,
    dateOfBirth,
    joinedAt,
  } = req.validated.body;

  const orgId = req.user.organization._id;
  const callerId = req.user._id;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = await User.findOne({
      _id: userId,
      organization: orgId,
    }).session(session);
    if (!user)
      throw CustomError.notFound("User not found", {
        userId,
        organizationId: orgId,
      });

    if (departmentId) {
      const dept = await Department.findOne({
        _id: departmentId,
        organization: orgId,
        isDeleted: false,
      }).session(session);
      if (!dept)
        throw CustomError.notFound("Target department not found", {
          departmentId,
          organizationId: orgId,
        });
      user.department = departmentId;
    }

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (position !== undefined) user.position = position;
    if (role !== undefined) user.role = role;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    if (skills !== undefined) user.skills = skills;
    if (employeeId !== undefined) user.employeeId = employeeId;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (joinedAt !== undefined) user.joinedAt = joinedAt;

    await user.save({ session });

    const hodRecipients = await User.find({
      department: user.department,
      role: { $in: HEAD_OF_DEPARTMENT_ROLES },
      isDeleted: false,
      _id: { $ne: callerId },
    })
      .select("_id")
      .session(session);
    const recipientIds = hodRecipients.map((u) => u._id);

    await createNotification(session, {
      type: "Updated",
      title: "User updated",
      message: `User "${user.firstName} ${user.lastName}" updated`,
      entity: user._id,
      entityModel: "User",
      recipients: recipientIds,
      organization: orgId,
      department: user.department,
      createdBy: callerId,
    });

    emitToDepartment(user.department, "user:updated", { userId });
    emitToRecipients(recipientIds, "user:updated", { userId });

    await session.commitTransaction();
    const updatedUser = await User.findById(userId)
      .populate({
        path: "department",
        match: { isDeleted: false },
        select: "_id name description organization createdBy createdAt",
        populate: {
          path: "organization",
          match: { isDeleted: false },
          select: "_id name",
        },
      })
      .populate({
        path: "organization",
        match: { isDeleted: false },
        select:
          "_id name description email phone address industry logoUrl createdBy createdAt",
      })
      .lean();

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
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
 *   "controller": "updateMyProfile",
 *   "route": "PUT /users/:userId/profile",
 *   "purpose": "Update own user profile",
 *   "transaction": true,
 *   "returns": "Updated user profile object"
 * }
 */
export const updateMyProfile = asyncHandler(async (req, res, next) => {
  const { userId } = req.validated.params;
  const {
    firstName,
    lastName,
    position,
    role,
    email,
    password,
    profilePicture,
    skills,
    employeeId,
    dateOfBirth,
    joinedAt,
  } = req.validated.body;

  if (String(userId) !== String(req.user._id)) {
    throw CustomError.authorization("You can only update your own profile", {
      userId,
      authenticatedUserId: req.user._id,
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = await User.findOne({ _id: userId })
      .select("+password")
      .session(session);
    if (!user)
      throw CustomError.notFound("User not found", {
        userId,
      });

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (position !== undefined) user.position = position;
    if (role !== undefined) user.role = role;
    if (email !== undefined) user.email = email;
    if (password !== undefined) user.password = password;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    if (skills !== undefined) user.skills = skills;
    if (employeeId !== undefined) user.employeeId = employeeId;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (joinedAt !== undefined) user.joinedAt = joinedAt;

    await user.save({ session });

    await createNotification(session, {
      type: "Updated",
      title: "Profile updated",
      message: "Your profile has been updated",
      entity: user._id,
      entityModel: "User",
      recipients: [], // helper will filter and result in no notification if no recipients
      organization: user.organization,
      department: user.department,
      createdBy: user._id,
    });

    emitToUser(user._id, "user:profile-updated", { userId: user._id });

    await session.commitTransaction();
    const updatedProfile = await User.findById(userId)
      .populate({
        path: "department",
        match: { isDeleted: false },
        select: "_id name description organization createdBy createdAt",
        populate: {
          path: "organization",
          match: { isDeleted: false },
          select: "_id name",
        },
      })
      .populate({
        path: "organization",
        match: { isDeleted: false },
        select:
          "_id name description email phone address industry logoUrl createdBy createdAt",
      })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedProfile,
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
 *   "controller": "getMyAccount",
 *   "route": "GET /users/:userId/account",
 *   "purpose": "Get current authenticated user's account information",
 *   "transaction": false,
 *   "returns": "User account object with security-related information"
 * }
 */
export const getMyAccount = asyncHandler(async (req, res, next) => {
  const { userId } = req.validated.params;
  if (String(userId) !== String(req.user._id)) {
    throw CustomError.authorization("You can only access your own account", {
      userId,
      authenticatedUserId: req.user._id,
    });
  }

  const user = await User.findById(userId)
    .populate({
      path: "organization",
      match: { isDeleted: false },
      select: "_id name email",
    })
    .populate({
      path: "department",
      match: { isDeleted: false },
      select: "_id name",
    })
    .lean();

  return res.status(200).json({
    success: true,
    message: "Account fetched successfully",
    user: {
      _id: user._id,
      email: user.email,
      role: user.role,
      organization: user.organization,
      department: user.department,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

/**
 * @json {
 *   "controller": "getMyProfile",
 *   "route": "GET /users/:userId/profile",
 *   "purpose": "Get current authenticated user's complete profile",
 *   "transaction": false,
 *   "returns": "User profile object with personal data"
 * }
 */
export const getMyProfile = asyncHandler(async (req, res, next) => {
  const { userId } = req.validated.params;
  const { includeSkills, includeStats } = req.validated.query;

  if (String(userId) !== String(req.user._id)) {
    throw CustomError.authorization("You can only access your own profile", {
      userId,
      authenticatedUserId: req.user._id,
    });
  }

  const user = await User.findById(userId)
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
    .lean();
  if (!user)
    throw CustomError.notFound("User not found", {
      userId,
    });

  let stats = null;
  if (includeStats) {
    const [createdCompleted, createdInProgress] = await Promise.all([
      (
        await import("../models/index.js")
      ).BaseTask.countDocuments({
        createdBy: userId,
        status: "Completed",
        isDeleted: false,
      }),
      (
        await import("../models/index.js")
      ).BaseTask.countDocuments({
        createdBy: userId,
        status: "In Progress",
        isDeleted: false,
      }),
    ]);
    stats = {
      createdTasksCompleted: createdCompleted,
      createdTasksInProgress: createdInProgress,
    };
  }

  return res.status(200).json({
    success: true,
    message: "Profile fetched successfully",
    user: {
      ...user,
      skills: includeSkills ? user.skills : undefined,
      stats,
    },
  });
});

/**
 * @json {
 *   "controller": "deleteUser",
 *   "route": "DELETE /users/:userId",
 *   "purpose": "Soft delete a user with cascade deletion",
 *   "transaction": true,
 *   "returns": "Success message with deletion timestamp"
 * }
 */
export const deleteUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.validated.params;
  const orgId = req.user.organization._id;
  const deptId = req.user.department._id;
  const callerId = req.user._id;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await User.softDeleteByIdWithCascade(userId, { session });

    await createNotification(session, {
      type: "Deleted",
      title: "User deleted",
      message: "A user has been soft-deleted",
      entity: undefined,
      entityModel: undefined,
      recipients: [],
      organization: orgId,
      department: deptId,
      createdBy: callerId,
    });

    emitToDepartment(deptId, "user:deleted", { userId });

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "User soft-deleted successfully",
      user: { userId, deletedAt: new Date().toISOString() },
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
 *   "controller": "restoreUser",
 *   "route": "POST /users/:userId/restore",
 *   "purpose": "Restore a soft-deleted user",
 *   "transaction": true,
 *   "returns": "Restored user object"
 * }
 */
export const restoreUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.validated.params;
  const orgId = req.user.organization._id;
  const deptId = req.user.department._id;
  const callerId = req.user._id;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await User.restoreById(userId, { session });
    const restored = await User.findById(userId)
      .populate({
        path: "department",
        match: { isDeleted: false },
        select: "_id name description organization createdBy createdAt",
        populate: {
          path: "organization",
          match: { isDeleted: false },
          select: "_id name",
        },
      })
      .populate({
        path: "organization",
        match: { isDeleted: false },
        select:
          "_id name description email phone address industry logoUrl createdBy createdAt",
      })
      .session(session);

    await createNotification(session, {
      type: "Restored",
      title: "User restored",
      message: "A user has been restored",
      entity: restored._id,
      entityModel: "User",
      recipients: [],
      organization: orgId,
      department: deptId,
      createdBy: callerId,
    });

    emitToDepartment(restored.department, "user:restored", { userId });

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "User restored successfully",
      user: restored,
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
 *   "controller": "getEmailPreferences",
 *   "route": "GET /users/:userId/email-preferences",
 *   "purpose": "Get user's email notification preferences",
 *   "returns": "User email preferences object"
 * }
 */
export const getEmailPreferences = asyncHandler(async (req, res, next) => {
  const { userId } = req.validated.params;
  const orgId = req.user.organization._id;

  // Users can only access their own preferences, or admins can access any user's preferences
  if (
    String(userId) !== String(req.user._id) &&
    !HEAD_OF_DEPARTMENT_ROLES.includes(req.user.role)
  ) {
    throw CustomError.authorization(
      "You can only access your own email preferences",
      {
        userId,
        authenticatedUserId: req.user._id,
      }
    );
  }

  const user = await User.findOne({
    _id: userId,
    organization: orgId,
    isDeleted: false,
  }).select("emailPreferences firstName lastName email");

  if (!user) {
    throw CustomError.notFound("User not found", {
      userId,
      organizationId: orgId,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Email preferences retrieved successfully",
    user: {
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      emailPreferences: user.emailPreferences || {
        enabled: true,
        taskNotifications: true,
        taskReminders: true,
        mentions: true,
        announcements: true,
        welcomeEmails: true,
        passwordReset: true,
      },
    },
  });
});

/**
 * @json {
 *   "controller": "updateEmailPreferences",
 *   "route": "PUT /users/:userId/email-preferences",
 *   "purpose": "Update user's email notification preferences",
 *   "returns": "Updated email preferences object"
 * }
 */
export const updateEmailPreferences = asyncHandler(async (req, res, next) => {
  const { userId } = req.validated.params;
  const orgId = req.user.organization._id;
  const {
    enabled,
    taskNotifications,
    taskReminders,
    mentions,
    announcements,
    welcomeEmails,
    passwordReset,
  } = req.validated.body;

  // Users can only update their own preferences, or admins can update any user's preferences
  if (
    String(userId) !== String(req.user._id) &&
    !HEAD_OF_DEPARTMENT_ROLES.includes(req.user.role)
  ) {
    throw CustomError.authorization(
      "You can only update your own email preferences",
      {
        userId,
        authenticatedUserId: req.user._id,
      }
    );
  }

  const user = await User.findOne({
    _id: userId,
    organization: orgId,
    isDeleted: false,
  });

  if (!user) {
    throw CustomError.notFound("User not found", {
      userId,
      organizationId: orgId,
    });
  }

  // Update email preferences
  const updatedPreferences = {
    enabled:
      enabled !== undefined ? enabled : user.emailPreferences?.enabled ?? true,
    taskNotifications:
      taskNotifications !== undefined
        ? taskNotifications
        : user.emailPreferences?.taskNotifications ?? true,
    taskReminders:
      taskReminders !== undefined
        ? taskReminders
        : user.emailPreferences?.taskReminders ?? true,
    mentions:
      mentions !== undefined
        ? mentions
        : user.emailPreferences?.mentions ?? true,
    announcements:
      announcements !== undefined
        ? announcements
        : user.emailPreferences?.announcements ?? true,
    welcomeEmails:
      welcomeEmails !== undefined
        ? welcomeEmails
        : user.emailPreferences?.welcomeEmails ?? true,
    passwordReset:
      passwordReset !== undefined
        ? passwordReset
        : user.emailPreferences?.passwordReset ?? true,
  };

  user.emailPreferences = updatedPreferences;
  await user.save();

  // Emit real-time update to user
  emitToUser(userId, "emailPreferencesUpdated", {
    userId,
    emailPreferences: updatedPreferences,
    updatedBy: req.user._id,
    updatedAt: new Date(),
  });

  return res.status(200).json({
    success: true,
    message: "Email preferences updated successfully",
    user: {
      userId: user._id,
      emailPreferences: updatedPreferences,
    },
  });
});

/**
 * @json {
 *   "controller": "getMyEmailPreferences",
 *   "route": "GET /users/me/email-preferences",
 *   "purpose": "Get current user's email notification preferences",
 *   "returns": "Current user's email preferences object"
 * }
 */
export const getMyEmailPreferences = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const user = await User.findOne({
    _id: userId,
    isDeleted: false,
  }).select("emailPreferences firstName lastName email");

  if (!user) {
    throw CustomError.notFound("User not found", {
      userId,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Email preferences retrieved successfully",
    user: {
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      emailPreferences: user.emailPreferences || {
        enabled: true,
        taskNotifications: true,
        taskReminders: true,
        mentions: true,
        announcements: true,
        welcomeEmails: true,
        passwordReset: true,
      },
    },
  });
});

/**
 * @json {
 *   "controller": "updateMyEmailPreferences",
 *   "route": "PUT /users/me/email-preferences",
 *   "purpose": "Update current user's email notification preferences",
 *   "returns": "Updated email preferences object"
 * }
 */
export const updateMyEmailPreferences = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const {
    enabled,
    taskNotifications,
    taskReminders,
    mentions,
    announcements,
    welcomeEmails,
    passwordReset,
  } = req.validated.body;

  const user = await User.findOne({
    _id: userId,
    isDeleted: false,
  });

  if (!user) {
    throw CustomError.notFound("User not found", {
      userId,
    });
  }

  // Update email preferences
  const updatedPreferences = {
    enabled:
      enabled !== undefined ? enabled : user.emailPreferences?.enabled ?? true,
    taskNotifications:
      taskNotifications !== undefined
        ? taskNotifications
        : user.emailPreferences?.taskNotifications ?? true,
    taskReminders:
      taskReminders !== undefined
        ? taskReminders
        : user.emailPreferences?.taskReminders ?? true,
    mentions:
      mentions !== undefined
        ? mentions
        : user.emailPreferences?.mentions ?? true,
    announcements:
      announcements !== undefined
        ? announcements
        : user.emailPreferences?.announcements ?? true,
    welcomeEmails:
      welcomeEmails !== undefined
        ? welcomeEmails
        : user.emailPreferences?.welcomeEmails ?? true,
    passwordReset:
      passwordReset !== undefined
        ? passwordReset
        : user.emailPreferences?.passwordReset ?? true,
  };

  user.emailPreferences = updatedPreferences;
  await user.save();

  // Emit real-time update to user
  emitToUser(userId, "emailPreferencesUpdated", {
    userId,
    emailPreferences: updatedPreferences,
    updatedBy: userId,
    updatedAt: new Date(),
  });

  return res.status(200).json({
    success: true,
    message: "Email preferences updated successfully",
    user: {
      userId: user._id,
      emailPreferences: updatedPreferences,
    },
  });
});

/**
 * @json {
 *   "controller": "sendBulkAnnouncement",
 *   "route": "POST /users/bulk-announcement",
 *   "purpose": "Send bulk announcement email to organization or department users",
 *   "transaction": true,
 *   "returns": "Announcement notification object"
 * }
 */
export const sendBulkAnnouncement = asyncHandler(async (req, res, next) => {
  const orgId = req.user.organization._id;
  const callerId = req.user._id;
  const callerDeptId = req.user.department._id;

  const {
    title,
    message,
    targetType, // 'organization' or 'department'
    targetDepartmentId, // Required if targetType is 'department'
  } = req.validated.body;

  // Only HODs can send announcements
  if (!HEAD_OF_DEPARTMENT_ROLES.includes(req.user.role)) {
    throw CustomError.authorization(
      "Only SuperAdmin and Admin users can send announcements",
      {
        userRole: req.user.role,
        requiredRoles: HEAD_OF_DEPARTMENT_ROLES,
      }
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let recipients = [];
    let targetDepartment = callerDeptId;

    if (targetType === "organization") {
      // SuperAdmin can send to entire organization
      if (req.user.role !== "SuperAdmin") {
        throw CustomError.authorization(
          "Only SuperAdmin can send organization-wide announcements",
          {
            userRole: req.user.role,
            requiredRole: "SuperAdmin",
          }
        );
      }

      recipients = await User.find({
        organization: orgId,
        isDeleted: false,
        _id: { $ne: callerId },
      }).session(session);
    } else if (targetType === "department") {
      const deptId = targetDepartmentId || callerDeptId;

      // Verify department exists and user has access
      const department = await Department.findOne({
        _id: deptId,
        organization: orgId,
        isDeleted: false,
      }).session(session);

      if (!department) {
        throw CustomError.notFound("Department not found", {
          departmentId: deptId,
          organizationId: orgId,
        });
      }

      // Admin can only send to their own department, SuperAdmin can send to any department
      if (
        req.user.role === "Admin" &&
        String(deptId) !== String(callerDeptId)
      ) {
        throw CustomError.authorization(
          "Admin users can only send announcements to their own department",
          {
            userRole: req.user.role,
            userDepartmentId: callerDeptId,
            targetDepartmentId: deptId,
          }
        );
      }

      recipients = await User.find({
        organization: orgId,
        department: deptId,
        isDeleted: false,
        _id: { $ne: callerId },
      }).session(session);

      targetDepartment = deptId;
    } else {
      throw CustomError.validation(
        "Invalid targetType. Must be 'organization' or 'department'",
        {
          targetType,
          validValues: ["organization", "department"],
        }
      );
    }

    if (recipients.length === 0) {
      throw CustomError.validation("No recipients found for announcement", {
        targetType,
        targetDepartmentId:
          targetType === "department" ? targetDepartment : null,
      });
    }

    const recipientIds = recipients.map((user) => user._id);

    // Create notification with email integration
    const notification = await createNotification(session, {
      type: "Announcement",
      title,
      message,
      recipients: recipientIds,
      organization: orgId,
      department: targetDepartment,
      createdBy: callerId,
      emailData: {
        senderName: `${req.user.firstName} ${req.user.lastName}`,
        senderPosition: req.user.position,
      },
      sendEmail: true,
    });

    await session.commitTransaction();

    // Emit real-time notification
    emitToRecipients(recipientIds, "announcementReceived", {
      notificationId: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      senderName: `${req.user.firstName} ${req.user.lastName}`,
      sentAt: notification.sentAt,
    });

    return res.status(201).json({
      success: true,
      message: `Announcement sent to ${recipients.length} users`,
      notification: {
        notificationId: notification._id,
        recipientCount: recipients.length,
        targetType,
        targetDepartment: targetType === "department" ? targetDepartment : null,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});
