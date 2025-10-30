// client/src/utils/constants.js
/**
 * Centralized Application Constants
 *
 * This file contains ALL constants used throughout the frontend application.
 * Centralizing constants makes them easy to find, update, and maintain.
 *
 * Sections:
 * 1. Error Constants
 * 2. HTTP Status Codes
 * 3. Route Paths
 * 4. Socket.IO Events
 * 5. Socket.IO Configuration
 * 6. API Endpoints
 * 7. User Roles
 * 8. Loading Messages
 * 9. Toast Configuration
 * 10. Pagination Configuration
 * 11. RTK Query Tags
 */

// ==================== ERROR CONSTANTS ====================
/**
 * Standardized error codes matching backend
 */
export const ERROR_CODES = {
  // Client errors (4xx)
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  NOT_FOUND_ERROR: "NOT_FOUND_ERROR",
  CONFLICT_ERROR: "CONFLICT_ERROR",
  TOO_MANY_REQUESTS_ERROR: "TOO_MANY_REQUESTS_ERROR",

  // Server errors (5xx)
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",

  // Network errors
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",

  // Frontend errors - generic codes that capture all frontend errors
  FRONTEND_ERROR: "FRONTEND_ERROR",
  COMPONENT_ERROR: "COMPONENT_ERROR",
  CHUNK_LOAD_ERROR: "CHUNK_LOAD_ERROR",
  ROUTE_ERROR: "ROUTE_ERROR",
};

/**
 * Error severity levels
 */
export const ERROR_SEVERITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

/**
 * Error type classifications
 */
export const ERROR_TYPES = {
  BACKEND: "backend",
  FRONTEND: "frontend",
  NETWORK: "network",
  VALIDATION: "validation",
  AUTH: "auth",
  ROUTE: "route",
};

// ==================== HTTP STATUS CODES ====================
/**
 * HTTP status codes for consistent error handling
 */
export const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// ==================== ROUTE PATHS ====================
/**
 * Application route paths
 * Used for navigation and route configuration
 */
export const ROUTES = {
  // Public routes
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",

  // Protected routes
  DASHBOARD: "/dashboard",
  TASKS: "/tasks",
  USERS: "/users",

  // Resources (HODs)
  MATERIALS: "/materials",
  VENDORS: "/vendors",

  // Administration (SuperAdmins)
  ORGANIZATION: "/admin/organization",
  DEPARTMENTS: "/admin/departments",
  ADMIN_USERS: "/admin/users",

  // Platform (Platform SuperAdmins)
  PLATFORM_ORGANIZATIONS: "/platform/organizations",

  // Error pages
  NOT_FOUND: "*",
};

// ==================== SOCKET.IO EVENTS ====================
/**
 * Socket.IO event names
 * Used for real-time communication between client and server
 */
export const SOCKET_EVENTS = {
  // Connection events
  CONNECTED: "connected",
  DISCONNECT: "disconnect",
  RECONNECT: "reconnect",
  CONNECT_ERROR: "connect_error",
  ERROR: "error",
  SERVER_SHUTDOWN: "server_shutdown",

  // Task events
  TASK_CREATED: "task:created",
  TASK_UPDATED: "task:updated",
  TASK_DELETED: "task:deleted",
  TASK_RESTORED: "task:restored",

  // Department task events
  DEPT_TASK_CREATED: "department:task:created",
  DEPT_TASK_UPDATED: "department:task:updated",
  DEPT_TASK_DELETED: "department:task:deleted",
  DEPT_TASK_RESTORED: "department:task:restored",

  // Organization task events
  ORG_TASK_CREATED: "organization:task:created",
  ORG_TASK_UPDATED: "organization:task:updated",
  ORG_TASK_DELETED: "organization:task:deleted",
  ORG_TASK_RESTORED: "organization:task:restored",

  // Activity events
  ACTIVITY_CREATED: "activity:created",
  ACTIVITY_UPDATED: "activity:updated",
  ACTIVITY_DELETED: "activity:deleted",
  ACTIVITY_RESTORED: "activity:restored",

  // Department activity events
  DEPT_ACTIVITY_CREATED: "department:activity:created",
  DEPT_ACTIVITY_UPDATED: "department:activity:updated",
  DEPT_ACTIVITY_DELETED: "department:activity:deleted",
  DEPT_ACTIVITY_RESTORED: "department:activity:restored",

  // Organization activity events
  ORG_ACTIVITY_CREATED: "organization:activity:created",
  ORG_ACTIVITY_UPDATED: "organization:activity:updated",
  ORG_ACTIVITY_DELETED: "organization:activity:deleted",
  ORG_ACTIVITY_RESTORED: "organization:activity:restored",

  // Comment events
  COMMENT_CREATED: "comment:created",
  COMMENT_UPDATED: "comment:updated",
  COMMENT_DELETED: "comment:deleted",

  // Notification events
  NOTIFICATION_CREATED: "notification:created",
  NOTIFICATION_READ: "notification:read",
};

// ==================== SOCKET.IO CONFIGURATION ====================
/**
 * Socket.IO client configuration
 * Used in socketService.js
 */
export const SOCKET_CONFIG = {
  WITH_CREDENTIALS: true, // Include httpOnly cookies for authentication
  AUTO_CONNECT: false, // Manual connection control
  RECONNECTION: true, // Enable automatic reconnection
  RECONNECTION_DELAY: 1000, // Initial delay before reconnection (1s)
  RECONNECTION_DELAY_MAX: 5000, // Maximum delay between reconnection attempts (5s)
  RECONNECTION_ATTEMPTS: 5, // Maximum number of reconnection attempts
};

// ==================== API ENDPOINTS ====================
/**
 * API endpoint paths
 * Used for HTTP requests to the backend
 */
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REGISTER: "/auth/register",
    REFRESH_TOKEN: "/auth/refresh-token",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },

  // Resource endpoints
  TASKS: "/tasks",
  USERS: "/users",
  ORGANIZATIONS: "/organizations",
  DEPARTMENTS: "/departments",
  MATERIALS: "/materials",
  VENDORS: "/vendors",
  NOTIFICATIONS: "/notifications",
  ATTACHMENTS: "/attachments",
};

// ==================== USER ROLES ====================
/**
 * User role constants
 * Must match backend USER_ROLES
 */
export const USER_ROLES = {
  SUPER_ADMIN: "SuperAdmin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  USER: "User",
};

// ==================== LOADING MESSAGES ====================
/**
 * Loading state messages
 * Used for consistent loading indicators
 */
export const LOADING_MESSAGES = {
  CHECKING_AUTH: "Checking authentication...",
  LOADING: "Loading...",
  PLEASE_WAIT: "Please wait...",
  CONNECTING: "Connecting...",
  RECONNECTING: "Reconnecting...",
};

// ==================== TOAST CONFIGURATION ====================
/**
 * Toast notification configuration
 * Used with react-toastify
 */
export const TOAST_CONFIG = {
  // Default toast options
  DEFAULT: {
    position: "bottom-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  },

  // Quick toast (shorter duration)
  QUICK: {
    autoClose: 3000,
  },

  // Persistent toast (longer duration)
  PERSISTENT: {
    autoClose: 10000,
  },

  // No auto-close (manual dismiss only)
  MANUAL: {
    autoClose: false,
  },
};

// ==================== PAGINATION CONFIGURATION ====================
/**
 * Pagination configuration
 * Used for data tables and lists
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  DEFAULT_SORT_BY: "createdAt",
  DEFAULT_SORT_ORDER: "desc",

  // Page size options for dropdowns
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],

  // Maximum items per page
  MAX_LIMIT: 100,
};

// ==================== RTK QUERY TAGS ====================
/**
 * RTK Query cache tags
 * Used for cache invalidation
 */
export const RTK_TAGS = {
  // Resource tags
  TASK: "Task",
  TASK_ACTIVITY: "TaskActivity",
  TASK_COMMENT: "TaskComment",
  USER: "User",
  ORGANIZATION: "Organization",
  DEPARTMENT: "Department",
  MATERIAL: "Material",
  VENDOR: "Vendor",
  NOTIFICATION: "Notification",
  ATTACHMENT: "Attachment",
};

// ==================== ENVIRONMENT ====================
/**
 * Environment configuration
 * Centralized access to environment variables
 */
export const ENV = {
  API_URL: import.meta.env.VITE_API_URL,
  PLATFORM_ORG: import.meta.env.VITE_PLATFORM_ORG,
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
};
