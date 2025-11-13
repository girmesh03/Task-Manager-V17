// backend/middleware/authorization.js
import { authorizationMatrix } from "../utils/authorizationMatrix.js";
import CustomError from "../errorHandler/CustomError.js";

/**
 * Authorization middleware that validates user permissions based on authorizationMatrix.json
 * Determines scope (org vs crossOrg) and context (own, ownDept, crossDept) for resource operations
 */
export const authorize = (resource, operation) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        throw CustomError.authentication("User not authenticated", {
          resource,
          operation,
          reason: "No user context found in request",
        });
      }

      const user = req.user;
      const userRole = user.role;
      const userOrganization = user.organization;

      // Get permissions for user's role from authorization matrix
      const rolePermissions = authorizationMatrix[resource]?.[userRole];

      if (!rolePermissions) {
        throw CustomError.authorization(
          `No permissions defined for role ${userRole} on resource ${resource}`,
          {
            resource,
            operation,
            userRole,
            userId: user._id,
            organizationId: userOrganization._id,
          }
        );
      }

      // Determine if user is from platform organization
      const isPlatformUser =
        userOrganization._id.toString() ===
        process.env.PLATFORM_ORGANIZATION_ID;

      let hasPermission = false;
      let scope = "org";
      let crossOrgSource = null;

      // ==================== CROSS-ORG SCOPE VALIDATION ====================
      if (rolePermissions.crossOrg) {
        const crossOrgPermissions = rolePermissions.crossOrg;
        const crossOrgFrom = crossOrgPermissions.from;

        // Validate cross-org source based on crossOrg.from configuration
        const isValidCrossOrgSource = await validateCrossOrgSource(
          crossOrgFrom,
          userOrganization,
          isPlatformUser
        );

        if (
          isValidCrossOrgSource &&
          crossOrgPermissions.ops.includes(operation)
        ) {
          hasPermission = true;
          scope = "crossOrg";
          crossOrgSource = crossOrgFrom;
        }
      }

      // ==================== ORGANIZATION SCOPE ====================
      if (!hasPermission && rolePermissions.org) {
        const orgPermissions = rolePermissions.org;

        // Determine context for the operation
        const context = await determineContext(resource, req, user);

        if (context && orgPermissions[context]?.includes(operation)) {
          hasPermission = true;
        }
      }

      if (!hasPermission) {
        throw CustomError.authorization(
          "You do not have permission to perform this operation",
          {
            resource,
            operation,
            userRole,
            scope,
            isPlatformUser,
            crossOrgSource,
            userId: user._id,
            organizationId: userOrganization._id,
            departmentId: user.department?._id,
          }
        );
      }

      // Attach authorization context to request for use in controllers
      req.authz = {
        resource,
        operation,
        userRole,
        scope,
        isPlatformUser,
        crossOrgSource,
      };

      next();
    } catch (error) {
      if (error instanceof CustomError) {
        next(error);
      } else {
        console.error("Authorization middleware error:", error);
        return next(
          CustomError.internal("Authorization check failed", {
            resource,
            operation,
            originalError: error.message,
            stack: error.stack,
          })
        );
      }
    }
  };
};

/**
 * Validate cross-organization source based on crossOrg.from configuration
 */
const validateCrossOrgSource = async (
  crossOrgFrom,
  userOrganization,
  isPlatformUser
) => {
  // Handle special platform source
  if (crossOrgFrom === "platform") {
    return isPlatformUser;
  }

  // Handle specific organization ID source
  if (crossOrgFrom === userOrganization._id.toString()) {
    return true;
  }

  // Future: Add support for organization types or groups
  // Example: if (crossOrgFrom === "premium") { return userOrganization.type === "premium"; }

  return false;
};

/**
 * Determine the context (own, ownDept, crossDept) for a resource operation
 */
const determineContext = async (resource, req, user) => {
  switch (resource) {
    case "Organization":
      return await determineOrganizationContext(req, user);

    case "Department":
      return await determineDepartmentContext(req, user);

    case "User":
      return await determineUserContext(req, user);

    case "Task":
      return await determineTaskContext(req, user);

    case "TaskActivity":
      return await determineTaskActivityContext(req, user);

    case "TaskComment":
      return await determineTaskCommentContext(req, user);

    case "Material":
      return await determineMaterialContext(req, user);

    case "Vendor":
      return await determineVendorContext(req, user);

    case "Notification":
      return await determineNotificationContext(req, user);

    default:
      throw new Error(
        `No context determination defined for resource: ${resource}`
      );
  }
};

// ==================== CONTEXT DETERMINATION FUNCTIONS ====================

const determineOrganizationContext = async (req, user) => {
  const { organizationId } = req.params;

  // For organization operations, check if user belongs to the organization
  if (organizationId) {
    const targetOrganizationId = organizationId;

    // User can only access their own organization unless platform user
    if (targetOrganizationId === user.organization._id.toString()) {
      return "own";
    }
  } else {
    // For list/create operations, user can only act within their organization
    return "own";
  }

  return null; // No access
};

const determineDepartmentContext = async (req, user) => {
  const { departmentId } = req.params;
  const { organizationId } = req.query;
  const bodyDepartmentId = req.body.departmentId;

  // For specific department operations
  if (departmentId) {
    const { Department } = await import("../models/Department.js");
    const department = await Department.findOne({
      _id: departmentId,
      isDeleted: false,
    });

    if (!department) return null;

    if (department._id.toString() === user.department._id.toString()) {
      return "ownDept";
    } else if (
      department.organization.toString() === user.organization._id.toString()
    ) {
      return "crossDept";
    }
  }

  // For create operations with departmentId in body
  if (bodyDepartmentId) {
    if (bodyDepartmentId === user.department._id.toString()) {
      return "ownDept";
    } else {
      // Check if department belongs to same organization
      const { Department } = await import("../models/Department.js");
      const department = await Department.findOne({
        _id: bodyDepartmentId,
        organization: user.organization._id,
        isDeleted: false,
      });
      return department ? "crossDept" : null;
    }
  }

  // For list operations
  if (organizationId && organizationId !== user.organization._id.toString()) {
    return null; // Cannot access other organizations
  }

  return "ownDept"; // Default to own department for list operations
};

const determineUserContext = async (req, user) => {
  const { userId } = req.params;
  const { departmentId } = req.query;
  const bodyDepartmentId = req.body.departmentId;

  // For specific user operations
  if (userId) {
    if (userId === user._id.toString()) {
      return "own";
    }

    const { User } = await import("../models/User.js");
    const targetUser = await User.findOne({
      _id: userId,
      isDeleted: false,
    }).populate("department");

    if (!targetUser) return null;

    if (
      targetUser.department._id.toString() === user.department._id.toString()
    ) {
      return "ownDept";
    } else if (
      targetUser.organization.toString() === user.organization._id.toString()
    ) {
      return "crossDept";
    }
  }

  // For create operations
  if (bodyDepartmentId) {
    if (bodyDepartmentId === user.department._id.toString()) {
      return "ownDept";
    } else {
      // Check if department belongs to same organization
      const { Department } = await import("../models/Department.js");
      const department = await Department.findOne({
        _id: bodyDepartmentId,
        organization: user.organization._id,
        isDeleted: false,
      });
      return department ? "crossDept" : null;
    }
  }

  // For list operations with department filter
  if (departmentId) {
    if (departmentId === user.department._id.toString()) {
      return "ownDept";
    } else {
      // Check if department belongs to same organization
      const { Department } = await import("../models/Department.js");
      const department = await Department.findOne({
        _id: departmentId,
        organization: user.organization._id,
        isDeleted: false,
      });
      return department ? "crossDept" : null;
    }
  }

  return "ownDept"; // Default to own department for user list
};

const determineTaskContext = async (req, user) => {
  const { taskId } = req.params;
  const { departmentId, assigneeId, deleted } = req.query;
  const bodyDepartmentId = req.body.departmentId;
  const bodyAssigneeIds = req.body.assigneeIds || [];

  // For specific task operations
  if (taskId) {
    const { BaseTask } = await import("../models/BaseTask.js");

    // Support fetching deleted tasks if deleted=true query param is present
    let taskQuery = BaseTask.findOne({ _id: taskId });
    if (deleted === "true" || deleted === true) {
      taskQuery = taskQuery.withDeleted();
    } else {
      taskQuery = taskQuery.where({ isDeleted: false });
    }

    const task = await taskQuery.populate("department").exec();

    if (!task) return null;

    // Check if user created the task
    if (task.createdBy.toString() === user._id.toString()) {
      return "own";
    }

    // Check if user is in assigneeIds (for ProjectTask types)
    if (task.assignees && Array.isArray(task.assignees)) {
      const assigneeIds = task.assignees.map((id) => id.toString());
      if (assigneeIds.includes(user._id.toString())) {
        return "own";
      }
    }

    // Check if user is in watcherIds
    if (task.watchers && Array.isArray(task.watchers)) {
      const watcherIds = task.watchers.map((id) => id.toString());
      if (watcherIds.includes(user._id.toString())) {
        return "own";
      }
    }

    // Check department context
    if (task.department._id.toString() === user.department._id.toString()) {
      return "ownDept";
    } else if (
      task.organization.toString() === user.organization._id.toString()
    ) {
      return "crossDept";
    }
  }

  // For create operations
  if (bodyDepartmentId) {
    if (bodyDepartmentId === user.department._id.toString()) {
      return "ownDept";
    } else {
      const { Department } = await import("../models/Department.js");
      const department = await Department.findOne({
        _id: bodyDepartmentId,
        organization: user.organization._id,
        isDeleted: false,
      });
      return department ? "crossDept" : null;
    }
  }

  // Check if creating task with assigneeIds including self
  if (bodyAssigneeIds.length > 0) {
    const assigneeIds = bodyAssigneeIds.map((id) => id.toString());
    if (assigneeIds.includes(user._id.toString())) {
      return "own";
    }
  }

  // For list operations with filters
  if (departmentId && departmentId !== user.department._id.toString()) {
    const { Department } = await import("../models/Department.js");
    const department = await Department.findOne({
      _id: departmentId,
      organization: user.organization._id,
      isDeleted: false,
    });
    return department ? "crossDept" : null;
  }

  if (assigneeId && assigneeId === user._id.toString()) {
    return "own";
  }

  return "ownDept"; // Default to own department for task list
};

const determineTaskActivityContext = async (req, user) => {
  const { activityId, taskId } = req.params;
  const { deleted } = req.query;

  // For specific activity operations
  if (activityId) {
    const { TaskActivity } = await import("../models/TaskActivity.js");

    // Support fetching deleted activities if deleted=true query param is present
    let activityQuery = TaskActivity.findOne({ _id: activityId });
    if (deleted === "true" || deleted === true) {
      activityQuery = activityQuery.withDeleted();
    } else {
      activityQuery = activityQuery.where({ isDeleted: false });
    }

    const activity = await activityQuery.populate("department").exec();

    if (!activity) return null;

    // Check if user created the activity
    if (activity.createdBy.toString() === user._id.toString()) {
      return "own";
    }

    if (activity.department._id.toString() === user.department._id.toString()) {
      return "ownDept";
    } else if (
      activity.organization.toString() === user.organization._id.toString()
    ) {
      return "crossDept";
    }
  }

  // For activity creation on a task
  if (taskId) {
    const { BaseTask } = await import("../models/BaseTask.js");

    // Support fetching deleted tasks if deleted=true query param is present
    let taskQuery = BaseTask.findOne({ _id: taskId });
    if (deleted === "true" || deleted === true) {
      taskQuery = taskQuery.withDeleted();
    } else {
      taskQuery = taskQuery.where({ isDeleted: false });
    }

    const task = await taskQuery.exec();

    if (!task) return null;

    if (task.department.toString() === user.department._id.toString()) {
      return "ownDept";
    } else if (
      task.organization.toString() === user.organization._id.toString()
    ) {
      return "crossDept";
    }
  }

  return "ownDept"; // Default context
};

const determineTaskCommentContext = async (req, user) => {
  const { commentId } = req.params;
  const { parentId } = req.body;
  const { deleted } = req.query;
  const bodyMentionIds = req.body.mentionIds || [];

  // For specific comment operations
  if (commentId) {
    const { TaskComment } = await import("../models/TaskComment.js");

    // Support fetching deleted comments if deleted=true query param is present
    let commentQuery = TaskComment.findOne({ _id: commentId });
    if (deleted === "true" || deleted === true) {
      commentQuery = commentQuery.withDeleted();
    } else {
      commentQuery = commentQuery.where({ isDeleted: false });
    }

    const comment = await commentQuery.populate("department").exec();

    if (!comment) return null;

    // Check if user created the comment
    if (comment.createdBy.toString() === user._id.toString()) {
      return "own";
    }

    // Check if user is mentioned in the comment
    if (comment.mentions && Array.isArray(comment.mentions)) {
      const mentionIds = comment.mentions.map((id) => id.toString());
      if (mentionIds.includes(user._id.toString())) {
        return "own";
      }
    }

    if (comment.department._id.toString() === user.department._id.toString()) {
      return "ownDept";
    } else if (
      comment.organization.toString() === user.organization._id.toString()
    ) {
      return "crossDept";
    }
  }

  // For comment creation with mentionIds
  if (bodyMentionIds.length > 0) {
    const mentionIds = bodyMentionIds.map((id) => id.toString());
    if (mentionIds.includes(user._id.toString())) {
      return "own";
    }
  }

  // For comment creation with parentId
  if (parentId) {
    // Validate parent belongs to same organization/department
    return "ownDept";
  }

  return "ownDept"; // Default context
};

const determineMaterialContext = async (req, user) => {
  const { materialId } = req.params;
  const { departmentId } = req.query;
  const bodyDepartmentId = req.body.departmentId;

  // For specific material operations
  if (materialId) {
    const { Material } = await import("../models/Material.js");
    const material = await Material.findOne({
      _id: materialId,
      isDeleted: false,
    }).populate("department");

    if (!material) return null;

    // Check if user added the material
    if (material.addedBy.toString() === user._id.toString()) {
      return "own";
    }

    if (material.department._id.toString() === user.department._id.toString()) {
      return "ownDept";
    } else if (
      material.organization.toString() === user.organization._id.toString()
    ) {
      return "crossDept";
    }
  }

  // For create operations
  if (bodyDepartmentId) {
    if (bodyDepartmentId === user.department._id.toString()) {
      return "ownDept";
    } else {
      const { Department } = await import("../models/Department.js");
      const department = await Department.findOne({
        _id: bodyDepartmentId,
        organization: user.organization._id,
        isDeleted: false,
      });
      return department ? "crossDept" : null;
    }
  }

  // For list operations with department filter
  if (departmentId && departmentId !== user.department._id.toString()) {
    const { Department } = await import("../models/Department.js");
    const department = await Department.findOne({
      _id: departmentId,
      organization: user.organization._id,
      isDeleted: false,
    });
    return department ? "crossDept" : null;
  }

  return "ownDept"; // Default to own department for material list
};

const determineVendorContext = async (req, user) => {
  const { vendorId } = req.params;

  // For specific vendor operations
  if (vendorId) {
    const { Vendor } = await import("../models/Vendor.js");
    const vendor = await Vendor.findOne({
      _id: vendorId,
      isDeleted: false,
    });

    if (!vendor) return null;

    // Check if user created the vendor
    if (vendor.createdBy.toString() === user._id.toString()) {
      return "own";
    }

    // Vendors are organization-wide, so check organization context
    if (vendor.organization.toString() === user.organization._id.toString()) {
      return "ownDept"; // Treat vendor access as department-level within organization
    }
  }

  // For create and list operations - vendors are organization-wide
  return user.organization._id ? "ownDept" : null;
};

const determineNotificationContext = async (req, user) => {
  const { notificationId } = req.params;
  const { userId, departmentId } = req.query;
  const bodyRecipientIds = req.body.recipientIds || [];

  // For specific notification operations
  if (notificationId) {
    const { Notification } = await import("../models/Notification.js");
    const notification = await Notification.findOne({
      _id: notificationId,
      isDeleted: false,
    });

    if (!notification) return null;

    // Check if user is a recipient of the notification
    if (notification.recipients && Array.isArray(notification.recipients)) {
      const recipientIds = notification.recipients.map((id) => id.toString());
      if (recipientIds.includes(user._id.toString())) {
        return "own";
      }
    }

    // Check if user created the notification
    if (notification.createdBy.toString() === user._id.toString()) {
      return "own";
    }

    // Check if user has read the notification
    if (notification.readBy && Array.isArray(notification.readBy)) {
      const readBy = notification.readBy.map((id) => id.toString());
      if (readBy.includes(user._id.toString())) {
        return "own";
      }
    }

    // Check if notification belongs to user's department
    if (
      notification.department &&
      notification.department.toString() === user.department._id.toString()
    ) {
      return "ownDept";
    }

    // Check if notification belongs to same organization
    if (
      notification.organization.toString() === user.organization._id.toString()
    ) {
      return "crossDept";
    }
  }

  // For create operations with recipientIds
  if (bodyRecipientIds.length > 0) {
    const recipientIds = bodyRecipientIds.map((id) => id.toString());
    if (recipientIds.includes(user._id.toString())) {
      return "own";
    }
  }

  // For list operations with user filter
  if (userId) {
    if (userId === user._id.toString()) {
      return "own";
    } else {
      // Check if target user is in same department or organization
      const { User } = await import("../models/User.js");
      const targetUser = await User.findOne({
        _id: userId,
        isDeleted: false,
      }).populate("department");

      if (!targetUser) return null;

      if (
        targetUser.department._id.toString() === user.department._id.toString()
      ) {
        return "ownDept";
      } else if (
        targetUser.organization.toString() === user.organization._id.toString()
      ) {
        return "crossDept";
      }
    }
  }

  // For list operations with department filter
  if (departmentId) {
    if (departmentId === user.department._id.toString()) {
      return "ownDept";
    } else {
      // Check if department belongs to same organization
      const { Department } = await import("../models/Department.js");
      const department = await Department.findOne({
        _id: departmentId,
        organization: user.organization._id,
        isDeleted: false,
      });
      return department ? "crossDept" : null;
    }
  }

  // Default to own notifications for listing
  return "own";
};

// Helper middleware for public routes that don't require authorization
export const publicRoute = (req, res, next) => {
  req.authz = { isPublic: true };
  next();
};

// Helper middleware for basic authentication check
export const authenticated = (req, res, next) => {
  if (!req.user) {
    return next(
      CustomError.authentication("Authentication required", {
        reason: "No authenticated user found in request context",
      })
    );
  }
  next();
};

/**
 * Middleware to require platform user privileges
 * Checks if the authenticated user belongs to the platform organization
 */
export const requirePlatformUser = (req, res, next) => {
  if (!req.user) {
    return next(
      CustomError.authentication("Authentication required", {
        reason: "No authenticated user found in request context",
      })
    );
  }

  if (!req.user.isPlatformUser) {
    return next(
      CustomError.authorization(
        "This action requires platform user privileges",
        {
          userId: req.user._id,
          organizationId: req.user.organization._id,
          isPlatformUser: req.user.isPlatformUser,
        }
      )
    );
  }

  next();
};

export default {
  authorize,
  authenticated,
  publicRoute,
  requirePlatformUser,
};
