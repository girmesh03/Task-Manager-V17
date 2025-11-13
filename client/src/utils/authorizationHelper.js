// client/src/utils/authorizationHelper.js
import authorizationMatrix from "../../../backend/config/authorizationMatrix.json";
import { ENV } from "./constants";

/**
 * Authorization Helper Utilities
 *
 * Provides client-side authorization checks based on the backend authorization matrix.
 * These checks are for UI/UX purposes only - all actual authorization is enforced on the backend.
 *
 * IMPORTANT: Frontend authorization is ONLY for UI visibility and user experience.
 * The backend ALWAYS enforces actual authorization. Never rely on frontend checks for security.
 *
 * Authorization Matrix Structure:
 * {
 *   "Resource": {
 *     "Role": {
 *       "org": {
 *         "own": ["operations"],        // User's own resources
 *         "ownDept": ["operations"],    // Resources in user's department
 *         "crossDept": ["operations"]   // Resources in other departments (same org)
 *       },
 *       "crossOrg": {
 *         "from": "platform",           // Only from platform organization
 *         "ops": ["operations"]         // Operations allowed across organizations
 *       }
 *     }
 *   }
 * }
 *
 * Scopes:
 * - own: Resources created by or belonging to the user
 * - ownDept: Resources within the user's department
 * - crossDept: Resources in other departments within the same organization
 * - crossOrg: Resources in other organizations (platform SuperAdmin only)
 */

/**
 * Check if user has permission to perform an action on a resource
 *
 * @param {Object} user - Current user object with role, _id, departmentId, organizationId
 * @param {string} resource - Resource name (e.g., 'Task', 'User', 'Material')
 * @param {string} action - Action to perform (e.g., 'create', 'read', 'update', 'delete')
 * @param {string} [scope='own'] - Permission scope: 'own', 'ownDept', 'crossDept', 'crossOrg'
 * @returns {boolean} True if user has permission, false otherwise
 *
 * @example
 * // Check if user can update their own task
 * hasPermission(user, 'Task', 'update', 'own') // true/false
 *
 * // Check if user can create tasks in their department
 * hasPermission(user, 'Task', 'create', 'ownDept') // true/false
 *
 * // Check if user can read tasks in other departments
 * hasPermission(user, 'Task', 'read', 'crossDept') // true/false
 */
export const hasPermission = (user, resource, action, scope = "own") => {
  // Validate inputs
  if (!user || !resource || !action) {
    console.warn("hasPermission: Missing required parameters", {
      user: !!user,
      resource,
      action,
    });
    return false;
  }

  // Get user role
  const userRole = user.role;
  if (!userRole) {
    console.warn("hasPermission: User has no role", user);
    return false;
  }

  // Get resource permissions for user's role
  const resourceMatrix = authorizationMatrix[resource];
  if (!resourceMatrix) {
    console.warn(`hasPermission: Resource "${resource}" not found in matrix`);
    return false;
  }

  const roleMatrix = resourceMatrix[userRole];
  if (!roleMatrix) {
    console.warn(
      `hasPermission: Role "${userRole}" not found for resource "${resource}"`
    );
    return false;
  }

  // Check cross-org permissions (platform SuperAdmin only)
  if (scope === "crossOrg") {
    // Only platform organization users can have cross-org permissions
    if (user.organizationId === ENV.PLATFORM_ORG) {
      const crossOrgPermissions = roleMatrix.crossOrg?.ops || [];
      return crossOrgPermissions.includes(action);
    }
    return false;
  }

  // Check org-level permissions (own, ownDept, crossDept)
  const orgPermissions = roleMatrix.org?.[scope] || [];
  return orgPermissions.includes(action);
};

/**
 * Determine the scope of a resource relative to the current user
 *
 * @param {Object} user - Current user object
 * @param {Object} resource - Resource object to check
 * @returns {string|null} Scope: 'own', 'ownDept', 'crossDept', 'crossOrg', or null if no access
 *
 * @example
 * // Determine scope for a task
 * const scope = determineScope(user, task);
 * // Returns: 'own' if user created it
 * //          'ownDept' if in same department
 * //          'crossDept' if in different department (same org)
 * //          'crossOrg' if in different organization
 * //          null if no relationship
 */
export const determineScope = (user, resource) => {
  // Validate inputs
  if (!user || !resource) {
    console.warn("determineScope: Missing required parameters");
    return null;
  }

  // Check if resource belongs to user (own)
  if (resource.createdBy === user._id || resource._id === user._id) {
    return "own";
  }

  // Check if resource is in user's department (ownDept)
  if (
    resource.departmentId &&
    user.departmentId &&
    resource.departmentId === user.departmentId
  ) {
    return "ownDept";
  }

  // Check if resource is in same organization but different department (crossDept)
  if (
    resource.organizationId &&
    user.organizationId &&
    resource.organizationId === user.organizationId
  ) {
    return "crossDept";
  }

  // Check if resource is in different organization (crossOrg)
  if (
    resource.organizationId &&
    user.organizationId &&
    resource.organizationId !== user.organizationId
  ) {
    return "crossOrg";
  }

  // No relationship found
  return null;
};

/**
 * Check if user can perform action on a specific resource instance
 * Combines scope determination and permission checking
 *
 * @param {Object} user - Current user object
 * @param {Object} resource - Resource object to check
 * @param {string} resourceType - Resource type name (e.g., 'Task', 'User')
 * @param {string} action - Action to perform
 * @returns {boolean} True if user has permission, false otherwise
 *
 * @example
 * // Check if user can edit a specific task
 * canPerformAction(user, task, 'Task', 'update') // true/false
 *
 * // Check if user can delete a specific material
 * canPerformAction(user, material, 'Material', 'delete') // true/false
 */
export const canPerformAction = (user, resource, resourceType, action) => {
  const scope = determineScope(user, resource);
  if (!scope) {
    return false;
  }
  return hasPermission(user, resourceType, action, scope);
};

/**
 * Get all allowed actions for a user on a specific resource instance
 *
 * @param {Object} user - Current user object
 * @param {Object} resource - Resource object to check
 * @param {string} resourceType - Resource type name
 * @returns {Object} Object with action names as keys and boolean values
 *
 * @example
 * const actions = getAllowedActions(user, task, 'Task');
 * // Returns: { create: false, read: true, update: true, delete: false }
 */
export const getAllowedActions = (user, resource, resourceType) => {
  const scope = determineScope(user, resource);
  if (!scope) {
    return {
      create: false,
      read: false,
      update: false,
      delete: false,
    };
  }

  return {
    create: hasPermission(user, resourceType, "create", scope),
    read: hasPermission(user, resourceType, "read", scope),
    update: hasPermission(user, resourceType, "update", scope),
    delete: hasPermission(user, resourceType, "delete", scope),
  };
};

/**
 * Check if user is platform SuperAdmin
 *
 * @param {Object} user - Current user object
 * @returns {boolean} True if user is platform SuperAdmin
 */
export const isPlatformSuperAdmin = (user) => {
  if (!user) return false;
  return user.role === "SuperAdmin" && user.organizationId === ENV.PLATFORM_ORG;
};

/**
 * Check if user is organization SuperAdmin (not platform)
 *
 * @param {Object} user - Current user object
 * @returns {boolean} True if user is organization SuperAdmin
 */
export const isOrganizationSuperAdmin = (user) => {
  if (!user) return false;
  return user.role === "SuperAdmin" && user.organizationId !== ENV.PLATFORM_ORG;
};

/**
 * Check if user is any type of SuperAdmin
 *
 * @param {Object} user - Current user object
 * @returns {boolean} True if user is SuperAdmin
 */
export const isSuperAdmin = (user) => {
  if (!user) return false;
  return user.role === "SuperAdmin";
};

/**
 * Check if user is Admin
 *
 * @param {Object} user - Current user object
 * @returns {boolean} True if user is Admin
 */
export const isAdmin = (user) => {
  if (!user) return false;
  return user.role === "Admin";
};

/**
 * Check if user is Manager
 *
 * @param {Object} user - Current user object
 * @returns {boolean} True if user is Manager
 */
export const isManager = (user) => {
  if (!user) return false;
  return user.role === "Manager";
};

/**
 * Check if user is regular User
 *
 * @param {Object} user - Current user object
 * @returns {boolean} True if user is regular User
 */
export const isRegularUser = (user) => {
  if (!user) return false;
  return user.role === "User";
};

/**
 * Check if user is Head of Department (SuperAdmin or Admin)
 *
 * @param {Object} user - Current user object
 * @returns {boolean} True if user is HOD
 */
export const isHeadOfDepartment = (user) => {
  if (!user) return false;
  return user.role === "SuperAdmin" || user.role === "Admin";
};

/**
 * Get user's permission level as a number (higher = more permissions)
 *
 * @param {Object} user - Current user object
 * @returns {number} Permission level (0-3)
 */
export const getPermissionLevel = (user) => {
  if (!user) return 0;

  const levels = {
    User: 1,
    Manager: 2,
    Admin: 3,
    SuperAdmin: 4,
  };

  return levels[user.role] || 0;
};

/**
 * Check if user has higher or equal permission level than required
 *
 * @param {Object} user - Current user object
 * @param {string} requiredRole - Required role
 * @returns {boolean} True if user has sufficient permissions
 */
export const hasMinimumRole = (user, requiredRole) => {
  const userLevel = getPermissionLevel(user);
  const requiredLevel = getPermissionLevel({ role: requiredRole });
  return userLevel >= requiredLevel;
};

/**
 * Example usage in components:
 *
 * import { hasPermission, determineScope, canPerformAction } from '@/utils/authorizationHelper';
 * import { useAuth } from '@/hooks/useAuth';
 *
 * const TaskActions = ({ task }) => {
 *   const { user } = useAuth();
 *   const scope = determineScope(user, task);
 *
 *   return (
 *     <>
 *       {hasPermission(user, 'Task', 'read', scope) && (
 *         <IconButton onClick={handleView}>
 *           <VisibilityIcon />
 *         </IconButton>
 *       )}
 *       {hasPermission(user, 'Task', 'update', scope) && (
 *         <IconButton onClick={handleEdit}>
 *           <EditIcon />
 *         </IconButton>
 *       )}
 *       {hasPermission(user, 'Task', 'delete', scope) && (
 *         <IconButton onClick={handleDelete}>
 *           <DeleteIcon />
 *         </IconButton>
 *       )}
 *     </>
 *   );
 * };
 *
 * // Or use the combined helper
 * const TaskActions = ({ task }) => {
 *   const { user } = useAuth();
 *
 *   return (
 *     <>
 *       {canPerformAction(user, task, 'Task', 'read') && (
 *         <IconButton onClick={handleView}>
 *           <VisibilityIcon />
 *         </IconButton>
 *       )}
 *       {canPerformAction(user, task, 'Task', 'update') && (
 *         <IconButton onClick={handleEdit}>
 *           <EditIcon />
 *         </IconButton>
 *       )}
 *       {canPerformAction(user, task, 'Task', 'delete') && (
 *         <IconButton onClick={handleDelete}>
 *           <DeleteIcon />
 *         </IconButton>
 *       )}
 *     </>
 *   );
 * };
 */
