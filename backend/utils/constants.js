// backend/utils/constants.js

// ==================== USER ROLE CONSTANTS ====================
export const USER_ROLES = ["SuperAdmin", "Admin", "Manager", "User"];
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

// ==================== TTL EXPIRY PERIODS (in seconds) ====================
// Time-to-live for soft-deleted documents before permanent deletion
export const TTL_EXPIRY = {
  MATERIALS: 90 * 24 * 60 * 60, // 90 days
  VENDORS: 90 * 24 * 60 * 60, // 90 days
  TASKS: 180 * 24 * 60 * 60, // 180 days (BaseTask, ProjectTask, AssignedTask, RoutineTask)
  USERS: 365 * 24 * 60 * 60, // 365 days
  DEPARTMENTS: 365 * 24 * 60 * 60, // 365 days
  ORGANIZATIONS: null, // Never auto-delete
  ATTACHMENTS: 30 * 24 * 60 * 60, // 30 days
  COMMENTS: 180 * 24 * 60 * 60, // 180 days (TaskComment)
  ACTIVITIES: 90 * 24 * 60 * 60, // 90 days (TaskActivity)
  NOTIFICATIONS: 30 * 24 * 60 * 60, // 30 days
};
