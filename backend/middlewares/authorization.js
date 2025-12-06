/**
 * Authorization Middleware
 * Checks user permissions based on authorization matrix
 * Enforces multi-tenant isolation and role-based access control
 */

import asyncHandler from "express-async-handler";
import CustomError from "../errorHandler/CustomError.js";
import authorizationMatrix from "../config/authorizationMatrix.json" assert { type: "json" };

/**
 * Check if user has permission for a resource and operation
 * @param {string} resource - Resource name (User, Organization, Task, etc.)
 * @param {string} operation - Operation (create, read, update, delete)
 * @returns {Function} Express middleware
 */
const authorize = (resource, operation) => {
  return asyncHandler(async (req, res, next) => {
    const { role, organization, department, isPlatformUser } = req.user;

    // Get permissions for this role and resource
    const permissions = authorizationMatrix[resource]?.[role];

    if (!permissions) {
      throw CustomError.forbidden(
        `Role ${role} does not have access to ${resource}`
      );
    }

    // Get allowed scopes for this operation
    const allowedScopes = permissions[operation];

    if (!allowedScopes || allowedScopes.length === 0) {
      throw CustomError.forbidden(
        `Role ${role} cannot perform ${operation} on ${resource}`
      );
    }

    // Attach authorization info to request for use in controllers
    req.authorization = {
      resource,
      operation,
      allowedScopes,
      role,
      organization,  // ObjectId
      department,    // ObjectId
      isPlatformUser,
    };

    next();
  });
};

/**
 * Check if user can access a specific resource instance
 * Used in controllers after fetching the resource
 * @param {Object} resourceDoc - Resource document from database
 * @param {Object} req - Express request object
 * @returns {boolean} True if user has access
 * @throws {CustomError} If user doesn't have access
 */
export const checkResourceAccess = (resourceDoc, req) => {
  const { allowedScopes, organization, department, isPlatformUser, role } =
    req.authorization || req.user;
  const userId = req.user.userId;

  // Platform SuperAdmin with crossOrg scope can access everything
  if (isPlatformUser && allowedScopes?.includes("crossOrg")) {
    return true;
  }

  // Check organization-level access
  if (resourceDoc.organization) {
    const resourceOrgId = resourceDoc.organization.toString();

    // Must be in same organization
    if (resourceOrgId !== organization.toString()) {
      throw CustomError.forbidden(
        "You don't have access to resources from other organizations"
      );
    }

    // Check department-level access
    if (resourceDoc.department) {
      const resourceDeptId = resourceDoc.department.toString();

      if (allowedScopes?.includes("crossDept")) {
        // Can access any department in organization
        return true;
      }

      if (allowedScopes?.includes("ownDept")) {
        // Can only access own department
        if (resourceDeptId !== department.toString()) {
          throw CustomError.forbidden(
            "You don't have access to resources from other departments"
          );
        }
        return true;
      }

      if (allowedScopes?.includes("own")) {
        // Can only access own resources
        const resourceOwnerId = resourceDoc.createdBy?.toString() || resourceDoc._id?.toString();

        if (resourceOwnerId !== userId.toString() && resourceDoc._id?.toString() !== userId.toString()) {
          throw CustomError.forbidden(
            "You can only access your own resources"
          );
        }
        return true;
      }
    } else {
      // Resource doesn't have department (e.g., Organization)
      if (allowedScopes?.includes("crossDept") || allowedScopes?.includes("ownDept")) {
        return true;
      }

      if (allowedScopes?.includes("own")) {
        const resourceOwnerId = resourceDoc.createdBy?.toString() || resourceDoc._id?.toString();

        if (resourceOwnerId !== userId.toString() && resourceDoc._id?.toString() !== userId.toString()) {
          throw CustomError.forbidden("You can only access your own resources");
        }
        return true;
      }
    }
  }

  // If no organization (shouldn't happen for multi-tenant resources)
  if (allowedScopes?.includes("own")) {
    const resourceOwnerId = resourceDoc.createdBy?.toString() || resourceDoc._id?.toString();

    if (resourceOwnerId !== userId.toString() && resourceDoc._id?.toString() !== userId.toString()) {
      throw CustomError.forbidden("You can only access your own resources");
    }
    return true;
  }

  throw CustomError.forbidden("Access denied to this resource");
};

/**
 * Build query filter based on user's authorization scopes
 * Used in list/read operations to filter results
 * @param {Object} req - Express request object
 * @returns {Object} MongoDB query filter
 */
export const buildAuthFilter = (req) => {
  const { allowedScopes, organization, department, isPlatformUser } =
    req.authorization || req.user;
  const userId = req.user.userId;

  const filter = {};

  // Platform SuperAdmin with crossOrg can see everything
  if (isPlatformUser && allowedScopes?.includes("crossOrg")) {
    return filter; // No filter - return all
  }

  // Must be in same organization
  filter.organization = organization;

  // Check department scoping
  if (allowedScopes?.includes("crossDept")) {
    // Can see all departments in organization - no department filter
    return filter;
  }

  if (allowedScopes?.includes("ownDept")) {
    // Can only see own department
    filter.department = department;
    return filter;
  }

  if (allowedScopes?.includes("own")) {
    // Can only see own resources
    filter.createdBy = userId;
    return filter;
  }

  return filter;
};

/**
 * Require specific role (helper middleware)
 * @param  {...string} roles - Allowed roles
 * @returns {Function} Express middleware
 */
export const requireRole = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw CustomError.unauthenticated("Authentication required");
    }

    if (!roles.includes(req.user.role)) {
      throw CustomError.forbidden(
        `This action requires one of the following roles: ${roles.join(", ")}`
      );
    }

    next();
  });
};

/**
 * Require platform user (SuperAdmin from platform organization)
 * @returns {Function} Express middleware
 */
export const requirePlatformUser = () => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw CustomError.unauthenticated("Authentication required");
    }

    if (!req.user.isPlatformUser) {
      throw CustomError.forbidden(
        "This action is restricted to platform administrators"
      );
    }

    next();
  });
};

export default authorize;
