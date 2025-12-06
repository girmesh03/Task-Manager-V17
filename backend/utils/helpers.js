/**
 * Helper Utility Functions
 * Common helper functions for data transformation, validation, and formatting
 */

import { PAGINATION } from "./constants.js";

/**
 * Build pagination response object
 * @param {Object} result - Mongoose paginate result
 * @returns {Object} Standardized pagination object
 */
export const buildPaginationResponse = (result) => {
  return {
    page: result.page,
    limit: result.limit,
    totalCount: result.totalDocs,
    totalPages: result.totalPages,
    hasNext: result.hasNextPage,
    hasPrev: result.hasPrevPage,
  };
};

/**
 * Parse pagination parameters from query
 * @param {Object} query - Express request query object
 * @returns {Object} Parsed pagination parameters
 */
export const parsePaginationParams = (query) => {
  const page = parseInt(query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(
    parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT
  );
  const sortBy = query.sortBy || PAGINATION.DEFAULT_SORT_BY;
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  return {
    page: Math.max(1, page), // Ensure minimum page is 1
    limit: Math.max(1, limit), // Ensure minimum limit is 1
    sortBy,
    sortOrder,
    sort: { [sortBy]: sortOrder },
  };
};

/**
 * Build query filter from request query
 * Filters out pagination and sorting params
 * @param {Object} query - Express request query object
 * @param {Array<string>} excludeFields - Fields to exclude from filter
 * @returns {Object} Filter object for MongoDB query
 */
export const buildQueryFilter = (query, excludeFields = []) => {
  const defaultExcludeFields = [
    "page",
    "limit",
    "sortBy",
    "sortOrder",
    "search",
    "includeDeleted",
  ];

  const allExcludeFields = [...defaultExcludeFields, ...excludeFields];

  const filter = {};

  Object.keys(query).forEach((key) => {
    if (!allExcludeFields.includes(key) && query[key]) {
      filter[key] = query[key];
    }
  });

  return filter;
};

/**
 * Build search query for text fields
 * @param {string} searchTerm - Search term
 * @param {Array<string>} fields - Fields to search in
 * @returns {Object} MongoDB $or query
 */
export const buildSearchQuery = (searchTerm, fields) => {
  if (!searchTerm || !fields || fields.length === 0) {
    return {};
  }

  return {
    $or: fields.map((field) => ({
      [field]: { $regex: searchTerm, $options: "i" }, // case-insensitive
    })),
  };
};

/**
 * Sanitize object by removing undefined and null values
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
export const sanitizeObject = (obj) => {
  return Object.keys(obj).reduce((acc, key) => {
    if (obj[key] !== undefined && obj[key] !== null) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};

/**
 * Pick specific fields from object
 * @param {Object} obj - Source object
 * @param {Array<string>} fields - Fields to pick
 * @returns {Object} Object with only specified fields
 */
export const pickFields = (obj, fields) => {
  return fields.reduce((acc, field) => {
    if (obj[field] !== undefined) {
      acc[field] = obj[field];
    }
    return acc;
  }, {});
};

/**
 * Omit specific fields from object
 * @param {Object} obj - Source object
 * @param {Array<string>} fields - Fields to omit
 * @returns {Object} Object without specified fields
 */
export const omitFields = (obj, fields) => {
  const result = { ...obj };
  fields.forEach((field) => {
    delete result[field];
  });
  return result;
};

/**
 * Check if value is a valid MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean}
 */
export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Format date to ISO string
 * @param {Date|string} date - Date to format
 * @returns {string} ISO date string
 */
export const formatDateToISO = (date) => {
  if (!date) return null;
  return new Date(date).toISOString();
};

/**
 * Calculate percentage
 * @param {number} value - Current value
 * @param {number} total - Total value
 * @param {number} decimals - Decimal places (default: 2)
 * @returns {number} Percentage
 */
export const calculatePercentage = (value, total, decimals = 2) => {
  if (!total || total === 0) return 0;
  return parseFloat(((value / total) * 100).toFixed(decimals));
};

/**
 * Generate random alphanumeric string
 * @param {number} length - Length of string
 * @returns {string} Random string
 */
export const generateRandomString = (length = 32) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate employee ID (4 digits: 1000-9999)
 * @returns {number} Employee ID
 */
export const generateEmployeeId = () => {
  return Math.floor(1000 + Math.random() * 9000);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (E.164 format or local Ethiopia format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  // Accepts: 0XXXXXXXXX (10 digits starting with 0) or +251XXXXXXXXX (9 digits after +251)
  const phoneRegex = /^(\+251\d{9}|0\d{9})$/;
  return phoneRegex.test(phone);
};

/**
 * Format phone number to E.164 format
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export const formatPhoneToE164 = (phone) => {
  if (!phone) return null;

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // If starts with 0, replace with +251
  if (digits.startsWith("0")) {
    return `+251${digits.substring(1)}`;
  }

  // If starts with 251, add +
  if (digits.startsWith("251")) {
    return `+${digits}`;
  }

  // If already has +, return as is
  if (phone.startsWith("+")) {
    return phone;
  }

  return phone;
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Truncate string to specified length
 * @param {string} str - String to truncate
 * @param {number} length - Max length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated string
 */
export const truncateString = (str, length, suffix = "...") => {
  if (!str || str.length <= length) return str;
  return str.substring(0, length) + suffix;
};

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalizeFirst = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert string to title case
 * @param {string} str - String to convert
 * @returns {string} Title case string
 */
export const toTitleCase = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => capitalizeFirst(word))
    .join(" ");
};

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 * @param {Object} obj - Object to check
 * @returns {boolean}
 */
export const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Build success response object
 * @param {string} message - Success message
 * @param {Object} data - Response data
 * @param {Object} pagination - Pagination object (optional)
 * @returns {Object} Success response
 */
export const successResponse = (message, data = null, pagination = null) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  if (pagination !== null) {
    response.pagination = pagination;
  }

  return response;
};

/**
 * Build error response object
 * @param {string} message - Error message
 * @param {string} errorCode - Error code
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Error response
 */
export const errorResponse = (
  message,
  errorCode = "ERROR",
  statusCode = 500
) => {
  return {
    success: false,
    message,
    errorCode,
    statusCode,
  };
};

// Export all helpers as default
export default {
  buildPaginationResponse,
  parsePaginationParams,
  buildQueryFilter,
  buildSearchQuery,
  sanitizeObject,
  pickFields,
  omitFields,
  isValidObjectId,
  formatDateToISO,
  calculatePercentage,
  generateRandomString,
  generateEmployeeId,
  isValidEmail,
  isValidPhone,
  formatPhoneToE164,
  isValidUrl,
  truncateString,
  capitalizeFirst,
  toTitleCase,
  deepClone,
  isEmpty,
  sleep,
  successResponse,
  errorResponse,
};
