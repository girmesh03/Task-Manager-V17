/**
 * Frontend Application Constants
 * CRITICAL: MUST mirror backend/utils/constants.js EXACTLY
 * This is the single source of truth for frontend
 */

// ==================== USER ROLES ====================
export const USER_ROLES = {
  SUPER_ADMIN: "SuperAdmin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  USER: "User",
};

// Role hierarchy (descending privileges)
export const ROLE_HIERARCHY = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.ADMIN,
  USER_ROLES.MANAGER,
  USER_ROLES.USER,
];

// Head of Department roles (SuperAdmin and Admin)
export const HOD_ROLES = [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN];

// ==================== TASK STATUS ====================
export const TASK_STATUS = {
  TO_DO: "To Do",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  PENDING: "Pending",
};

export const TASK_STATUS_VALUES = Object.values(TASK_STATUS);

// ==================== TASK PRIORITY ====================
export const TASK_PRIORITY = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const TASK_PRIORITY_VALUES = Object.values(TASK_PRIORITY);

// ==================== TASK TYPES ====================
export const TASK_TYPES = {
  PROJECT_TASK: "ProjectTask",
  ROUTINE_TASK: "RoutineTask",
  ASSIGNED_TASK: "AssignedTask",
};

export const TASK_TYPE_VALUES = Object.values(TASK_TYPES);

// ==================== USER STATUS ====================
export const USER_STATUS = {
  ONLINE: "Online",
  OFFLINE: "Offline",
  AWAY: "Away",
};

export const USER_STATUS_VALUES = Object.values(USER_STATUS);

// ==================== MATERIAL CATEGORIES ====================
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

// ==================== UNIT TYPES ====================
export const UNIT_TYPES = [
  "pcs", // pieces
  "kg", // kilogram
  "g", // gram
  "l", // liter
  "ml", // milliliter
  "m", // meter
  "cm", // centimeter
  "mm", // millimeter
  "m2", // square meter
  "m3", // cubic meter
  "ft", // feet
  "in", // inch
  "yd", // yard
  "lb", // pound
  "oz", // ounce
  "gal", // gallon
  "qt", // quart
  "pt", // pint
  "box",
  "pack",
  "roll",
  "sheet",
  "bag",
  "bottle",
  "can",
  "pair",
  "set",
  "dozen",
  "unit",
  "coil",
  "bundle",
];

// ==================== INDUSTRIES (24 Options) ====================
export const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Retail",
  "Manufacturing",
  "Hospitality",
  "Real Estate",
  "Transportation",
  "Energy",
  "Agriculture",
  "Construction",
  "Media",
  "Telecommunications",
  "Automotive",
  "Aerospace",
  "Pharmaceutical",
  "Legal",
  "Consulting",
  "Non-Profit",
  "Government",
  "Entertainment",
  "Food & Beverage",
  "Other",
];

// ==================== FILE TYPES ====================
export const FILE_TYPES = {
  IMAGE: "Image",
  VIDEO: "Video",
  DOCUMENT: "Document",
  AUDIO: "Audio",
  OTHER: "Other",
};

export const FILE_TYPE_VALUES = Object.values(FILE_TYPES);

// ==================== ATTACHMENT EXTENSIONS ====================
export const FILE_EXTENSIONS = {
  IMAGE: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
  VIDEO: [".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv"],
  DOCUMENT: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt"],
  AUDIO: [".mp3", ".wav", ".ogg", ".m4a"],
};

// ==================== FILE SIZE LIMITS (in bytes) ====================
export const FILE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  VIDEO: 100 * 1024 * 1024, // 100MB
  DOCUMENT: 25 * 1024 * 1024, // 25MB
  AUDIO: 20 * 1024 * 1024, // 20MB
  OTHER: 50 * 1024 * 1024, // 50MB
};

// ==================== NOTIFICATION TYPES ====================
export const NOTIFICATION_TYPES = {
  CREATED: "Created",
  UPDATED: "Updated",
  DELETED: "Deleted",
  RESTORED: "Restored",
  MENTION: "Mention",
  WELCOME: "Welcome",
  ANNOUNCEMENT: "Announcement",
};

export const NOTIFICATION_TYPE_VALUES = Object.values(NOTIFICATION_TYPES);

// ==================== PAGINATION ====================
export const PAGINATION = {
  DEFAULT_PAGE: 0, // MUI DataGrid uses 0-based pagination
  DEFAULT_LIMIT: 10,
  DEFAULT_SORT_BY: "createdAt",
  DEFAULT_SORT_ORDER: "desc",
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],
  MAX_LIMIT: 100,
};

// ==================== VALIDATION LIMITS ====================
export const VALIDATION_LIMITS = {
  // Attachments
  MAX_ATTACHMENTS: 10,

  // Task-related
  MAX_WATCHERS: 20,
  MAX_ASSIGNEES: 20,
  MAX_MATERIALS: 20,
  MAX_TAGS: 5,
  MAX_TAG_LENGTH: 50,
  MAX_COST_HISTORY: 200,

  // User-related
  MAX_SKILLS: 10,
  MAX_SKILL_NAME_LENGTH: 50,
  MIN_SKILL_PROFICIENCY: 0,
  MAX_SKILL_PROFICIENCY: 100,

  // Comment-related
  MAX_MENTIONS: 5,
  MAX_COMMENT_DEPTH: 3,

  // Notification-related
  MAX_NOTIFICATION_RECIPIENTS: 500,
  NOTIFICATION_TTL_DAYS: 30,
};

// ==================== STRING LENGTH LIMITS ====================
export const STRING_LIMITS = {
  // General
  TITLE_MAX: 50,
  DESCRIPTION_MAX: 2000,
  COMMENT_MAX: 2000,

  // Organization
  ORG_NAME_MAX: 100,
  ORG_EMAIL_MAX: 50,
  ORG_PHONE_MAX: 20,
  ORG_ADDRESS_MAX: 500,

  // Department
  DEPT_NAME_MAX: 100,
  DEPT_DESCRIPTION_MAX: 2000,

  // User
  USER_FIRST_NAME_MAX: 20,
  USER_LAST_NAME_MAX: 20,
  USER_EMAIL_MAX: 50,
  USER_PASSWORD_MIN: 8,
  USER_POSITION_MAX: 100,
  USER_EMPLOYEE_ID_MIN: 1000,
  USER_EMPLOYEE_ID_MAX: 9999,

  // Material
  MATERIAL_NAME_MAX: 100,
  MATERIAL_DESCRIPTION_MAX: 2000,

  // Vendor
  VENDOR_NAME_MAX: 100,
  VENDOR_DESCRIPTION_MAX: 2000,
  VENDOR_CONTACT_PERSON_MAX: 100,
};

// ==================== PHONE NUMBER REGEX ====================
export const PHONE_REGEX = /^(\+2510\d{9}|0\d{9})$/;

// ==================== EMAIL REGEX ====================
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ==================== CURRENCY ====================
export const DEFAULT_CURRENCY = "ETB"; // Ethiopian Birr

// ==================== AUTHORIZATION SCOPES ====================
export const AUTH_SCOPES = {
  OWN: "own", // User's own resources
  OWN_DEPT: "ownDept", // Same department
  CROSS_DEPT: "crossDept", // Other departments in organization
  CROSS_ORG: "crossOrg", // Other organizations (Platform SuperAdmin only)
};

export const AUTH_SCOPE_VALUES = Object.values(AUTH_SCOPES);

// ==================== OPERATIONS ====================
export const OPERATIONS = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
};

export const OPERATION_VALUES = Object.values(OPERATIONS);

// ==================== RESOURCES ====================
export const RESOURCES = {
  USER: "User",
  ORGANIZATION: "Organization",
  DEPARTMENT: "Department",
  TASK: "Task",
  TASK_ACTIVITY: "TaskActivity",
  TASK_COMMENT: "TaskComment",
  MATERIAL: "Material",
  VENDOR: "Vendor",
  ATTACHMENT: "Attachment",
  NOTIFICATION: "Notification",
};

export const RESOURCE_VALUES = Object.values(RESOURCES);

// ==================== CLOUDINARY CONFIGURATION ====================
export const CLOUDINARY = {
  CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  API_KEY: import.meta.env.VITE_CLOUDINARY_API_KEY,
  UPLOAD_PRESET_ATTACHMENTS: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_ATTACHMENTS,
  UPLOAD_PRESET_ORGANIZATIONS: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_ORGANIZATIONS,
  UPLOAD_PRESET_PROFILE: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_PROFILE,
  FOLDER_ATTACHMENTS: import.meta.env.VITE_CLOUDINARY_FOLDER_ATTACHMENTS,
  FOLDER_ORGANIZATIONS: import.meta.env.VITE_CLOUDINARY_FOLDER_ORGANIZATIONS,
  FOLDER_PROFILE: import.meta.env.VITE_CLOUDINARY_FOLDER_PROFILE,
};

// ==================== API CONFIGURATION ====================
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// Export all constants as default
export default {
  USER_ROLES,
  ROLE_HIERARCHY,
  HOD_ROLES,
  TASK_STATUS,
  TASK_STATUS_VALUES,
  TASK_PRIORITY,
  TASK_PRIORITY_VALUES,
  TASK_TYPES,
  TASK_TYPE_VALUES,
  USER_STATUS,
  USER_STATUS_VALUES,
  MATERIAL_CATEGORIES,
  UNIT_TYPES,
  INDUSTRIES,
  FILE_TYPES,
  FILE_TYPE_VALUES,
  FILE_EXTENSIONS,
  FILE_SIZE_LIMITS,
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_VALUES,
  PAGINATION,
  VALIDATION_LIMITS,
  STRING_LIMITS,
  PHONE_REGEX,
  EMAIL_REGEX,
  DEFAULT_CURRENCY,
  AUTH_SCOPES,
  AUTH_SCOPE_VALUES,
  OPERATIONS,
  OPERATION_VALUES,
  RESOURCES,
  RESOURCE_VALUES,
  CLOUDINARY,
  API_URL,
};
