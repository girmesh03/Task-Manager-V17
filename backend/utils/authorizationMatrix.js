// backend/utils/authorizationMatrix.js
import authorizationMatrixData from "../config/authorizationMatrix.json" with { type: "json" };

export const authorizationMatrix = authorizationMatrixData;

/**
 * Check if a user has permission for a specific resource and operation
 * Useful for conditional logic in controllers
 */
export const hasPermission = (user, resource, operation, context = null) => {
  if (!user) return false;

  const userRole = user.role;
  const isPlatformUser =
    user.organization._id.toString() === process.env.PLATFORM_ORGANIZATION_ID;

  const rolePermissions = authorizationMatrix[resource]?.[userRole];
  if (!rolePermissions) return false;

  // Check cross-org permissions for platform users
  if (isPlatformUser && rolePermissions.crossOrg) {
    if (rolePermissions.crossOrg.ops.includes(operation)) {
      return true;
    }
  }

  // Check organization scope permissions
  if (rolePermissions.org) {
    // If context is provided, check specific context
    if (context && rolePermissions.org[context]?.includes(operation)) {
      return true;
    }

    // If no context provided, check if any context allows the operation
    const contexts = ["own", "ownDept", "crossDept"];
    for (const ctx of contexts) {
      if (rolePermissions.org[ctx]?.includes(operation)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Get all allowed operations for a user on a specific resource
 */
export const getAllowedOperations = (user, resource) => {
  if (!user) return [];

  const userRole = user.role;
  const isPlatformUser =
    user.organization._id.toString() === process.env.PLATFORM_ORGANIZATION_ID;

  const rolePermissions = authorizationMatrix[resource]?.[userRole];
  if (!rolePermissions) return [];

  const allowedOperations = new Set();

  // Add cross-org operations for platform users
  if (isPlatformUser && rolePermissions.crossOrg) {
    rolePermissions.crossOrg.ops.forEach((op) => allowedOperations.add(op));
  }

  // Add organization scope operations
  if (rolePermissions.org) {
    Object.values(rolePermissions.org).forEach((operations) => {
      operations.forEach((op) => allowedOperations.add(op));
    });
  }

  return Array.from(allowedOperations);
};
