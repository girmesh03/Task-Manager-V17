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

// ==================== UI MESSAGES ====================
/**
 * User interface messages and placeholders
 * Used for consistent UI text
 */
export const UI_MESSAGES = {
  PLACEHOLDERS: {
    SELECT_OPTION: "Select an option",
    SELECT_OPTIONS: "Select options",
    SEARCH: "Search...",
    ENTER_TEXT: "Enter text...",
  },
  ERRORS: {
    SOMETHING_WENT_WRONG: "Something went wrong",
    PLEASE_TRY_AGAIN: "Please try again",
    NETWORK_ERROR: "Network connection issue. Please check your internet.",
    SESSION_EXPIRED: "Your session has expired. Please log in again.",
    AUTHENTICATION_REQUIRED: "Authentication Required",
    UNABLE_TO_LOAD: "Unable to Load Content",
  },
  ACTIONS: {
    RELOAD_PAGE: "Reload Page",
    GO_HOME: "Go Home",
    TRY_AGAIN: "Try Again",
    GO_TO_LOGIN: "Go to Login",
    CLOSE: "Close",
  },
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

// ==================== USER ROLE CONSTANTS ====================
// export const USER_ROLES = ["SuperAdmin", "Admin", "Manager", "User"];
export const HEAD_OF_DEPARTMENT_ROLES = ["SuperAdmin", "Admin"];
export const DEFAULT_USER_ROLE = "User";
export const SUPER_ADMIN_ROLE = "SuperAdmin";
export const ADMIN_ROLE = "Admin";
export const MANAGER_ROLE = "Manager";
export const USER_ROLE = "User";

// ==================== TASK TYPE, STATUS & PRIORITY CONSTANTS ====================
export const TASK_STATUS = ["To Do", "In Progress", "Completed", "Pending"];
export const TASK_PRIORITY = ["Low", "Medium", "High", "Urgent"];
export const TASK_TYPES = ["ProjectTask", "AssignedTask", "RoutineTask"];

// Routine Task Specific Constants (overrides base task for routine tasks)
export const ROUTINE_TASK_STATUS = ["In Progress", "Completed", "Pending"];
export const ROUTINE_TASK_PRIORITY = ["Medium", "High", "Urgent"];

// ==================== ATTACHMENT CONSTANTS ====================
export const ATTACHMENT_TYPES = [
  "image",
  "video",
  "document",
  "audio",
  "other",
];
export const ATTACHMENT_PARENT_MODELS = [
  "RoutineTask",
  "AssignedTask",
  "ProjectTask",
  "TaskActivity",
  "TaskComment",
];

// ==================== MATERIAL CONSTANTS ====================
export const MAX_MATERIAL_QUANTITY = 1000000;
export const MAX_MATERIAL_COST = 1000000;
export const MAX_MATERIAL_PRICE = 1000000;
export const MATERIAL_UNIT_TYPES = [
  "pcs",
  "units",
  "each",
  "kg",
  "g",
  "lb",
  "oz",
  "ton",
  "l",
  "ml",
  "gal",
  "qt",
  "pt",
  "m",
  "cm",
  "mm",
  "ft",
  "in",
  "m2",
  "cm2",
  "ft2",
  "in2",
  "m3",
  "cm3",
  "ft3",
  "in3",
];
export const MATERIAL_CATEGORIES = [
  "Electrical",
  "Mechanical",
  "Plumbing",
  "Hardware",
  "Cleaning",
  "Textiles",
  "Consumables",
  "Construction",
  "Other",
];

// ==================== POLYMORPHIC REFERENCE CONSTANTS ====================
export const TASK_ACTIVITY_PARENT_MODELS = ["AssignedTask", "ProjectTask"];
export const TASK_COMMENT_PARENT_MODELS = [
  "RoutineTask",
  "AssignedTask",
  "ProjectTask",
  "TaskActivity",
  "TaskComment", // Self-referencing for comment replies
];

// ==================== NOTIFICATION CONSTANTS ====================
export const MAX_NOTIFICATION_TITLE_LENGTH = 50;
export const MAX_NOTIFICATION_MESSAGE_LENGTH = 200;
export const NOTIFICATION_EXPIRY_DAYS = 30;
export const NOTIFICATION_TYPES = [
  "Created",
  "Updated",
  "Deleted",
  "Restored",
  "Mention",
  "Welcome",
  "Announcement",
];
export const NOTIFICATION_ENTITY_MODELS = [
  "RoutineTask",
  "AssignedTask",
  "ProjectTask",
  "TaskActivity",
  "TaskComment",
  "User",
  "Department",
  "Organization",
];

// ==================== PROJECT TASK CONSTANTS ====================
export const PROJECT_TASK_COST_HISTORY_FIELDS = [
  "estimatedCost",
  "actualCost",
  "currency",
];
export const DEFAULT_CURRENCY = "USD";

// ==================== TASK COMMENT CONSTANTS ====================
export const MAX_COMMENT_THREADING_DEPTH = 3;

// ==================== USER PROFILE CONSTANTS ====================
export const SUPPORTED_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
];
export const CLOUDINARY_DOMAINS = ["cloudinary.com", "res.cloudinary.com"];
export const MIN_SKILL_PERCENTAGE = 0;
export const MAX_SKILL_PERCENTAGE = 100;

// ==================== VALIDATION LIMITS ====================
export const MAX_ATTACHMENTS_PER_ENTITY = 10;
export const MAX_WATCHERS_PER_TASK = 20;
export const MAX_ASSIGNEES_PER_TASK = 20;
export const MAX_MATERIALS_PER_ENTITY = 20;
export const MAX_TAGS_PER_TASK = 5;
export const MAX_MENTIONS_PER_COMMENT = 5;
export const MAX_SKILLS_PER_USER = 10;

// ==================== LENGTH VALIDATION CONSTANTS ====================
export const MAX_TITLE_LENGTH = 50;
export const MAX_DESCRIPTION_LENGTH = 2000;
export const MAX_ACTIVITY_LENGTH = 2000;
export const MAX_COMMENT_LENGTH = 2000;
export const MAX_TAG_LENGTH = 50;
export const MAX_SKILL_NAME_LENGTH = 50;
export const MAX_MATERIAL_NAME_LENGTH = 50;
export const MAX_FILENAME_LENGTH = 200;
export const MAX_ORG_NAME_LENGTH = 100;
export const MAX_ORG_DESCRIPTION_LENGTH = 500;
export const MAX_DEPT_NAME_LENGTH = 100;
export const MAX_DEPT_DESCRIPTION_LENGTH = 500;
export const MAX_USER_NAME_LENGTH = 20;
export const MAX_POSITION_LENGTH = 50;
export const MAX_EMAIL_LENGTH = 50;
export const MAX_ADDRESS_LENGTH = 200;
export const MAX_INDUSTRY_LENGTH = 50;
export const MAX_VENDOR_NAME_LENGTH = 100;
export const MAX_VENDOR_DESCRIPTION_LENGTH = 500;
export const MIN_PASSWORD_LENGTH = 8;

// ==================== VALIDATION PATTERNS & LIMITS ====================
export const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;
export const EMPLOYEE_ID_MIN = 1;
export const EMPLOYEE_ID_MAX = 9999;

// ==================== INDUSTRY STANDARDIZATION ====================
export const VALID_INDUSTRIES = [
  "Hospitality",
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Manufacturing",
  "Retail",
  "Construction",
  "Transportation",
  "Energy",
  "Agriculture",
  "Real Estate",
  "Media",
  "Telecommunications",
  "Automotive",
  "Aerospace",
  "Pharmaceuticals",
  "Consulting",
  "Legal",
  "Non-Profit",
  "Government",
  "Entertainment",
  "Sports",
  "Other",
];

// ==================== FILE SIZE LIMITS ====================
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
export const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024;
export const MAX_AUDIO_SIZE = 20 * 1024 * 1024;
export const MAX_OTHER_SIZE = 50 * 1024 * 1024;

// ==================== CURRENCY CODES ====================
export const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "ETB",
  "JPY",
  "CAD",
  "AUD",
];

// ==================== LIMITS ====================
export const MAX_LIST_PAGE_LIMIT = 100;
export const MAX_LIST_ITEM_LIMIT = 100;
export const MAX_COST_HISTORY_ENTRIES = 200;
export const MAX_RECIPIENTS_PER_NOTIFICATION = 500;
