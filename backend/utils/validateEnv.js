// backend/utils/validateEnv.js
/**
 * Environment Variable Validation Utility
 *
 * Validates all required and optional environment variables on startup.
 * Provides clear error messages for missing or invalid variables.
 *
 * Requirements: 6.1, 23, 110, 171, 174, 176, 181, 182
 */

import logger from "./logger.js";

/**
 * Environment variable definitions with validation rules
 */
const ENV_DEFINITIONS = {
  // === REQUIRED: Core Application ===
  NODE_ENV: {
    required: true,
    type: "enum",
    values: ["development", "production", "test", "staging"],
    default: "development",
    description: "Application environment mode",
  },
  PORT: {
    required: true,
    type: "port",
    default: "4000",
    description: "Server port number",
  },
  APP_NAME: {
    required: true,
    type: "string",
    default: "Task Manager",
    description: "Application name for emails and logs",
  },
  CLIENT_URL: {
    required: true,
    type: "url",
    description: "Frontend application URL for CORS and email links",
  },

  // === REQUIRED: Database ===
  MONGODB_URI: {
    required: true,
    type: "string",
    description: "MongoDB connection string",
  },

  // === REQUIRED: Authentication ===
  JWT_ACCESS_SECRET: {
    required: true,
    type: "string",
    minLength: 32,
    description: "Secret key for JWT access tokens",
  },
  JWT_REFRESH_SECRET: {
    required: true,
    type: "string",
    minLength: 32,
    description: "Secret key for JWT refresh tokens",
  },
  JWT_ACCESS_EXPIRES_IN: {
    required: false,
    type: "string",
    default: "15m",
    description: "Access token expiration time",
  },
  JWT_REFRESH_EXPIRES_IN: {
    required: false,
    type: "string",
    default: "7d",
    description: "Refresh token expiration time",
  },

  // === REQUIRED: Email (SMTP) ===
  SMTP_HOST: {
    required: true,
    type: "string",
    description: "SMTP server hostname",
  },
  SMTP_PORT: {
    required: true,
    type: "port",
    description: "SMTP server port",
  },
  SMTP_USER: {
    required: true,
    type: "email",
    description: "SMTP authentication username/email",
  },
  SMTP_PASS: {
    required: true,
    type: "string",
    description: "SMTP authentication password",
  },

  // === OPTIONAL: Rate Limiting ===
  API_RATE_LIMIT_WINDOW_MINUTES: {
    required: false,
    type: "number",
    default: "15",
    description: "API rate limit window in minutes",
  },
  API_RATE_LIMIT_MAX_REQUESTS: {
    required: false,
    type: "number",
    default: "100",
    description: "Maximum API requests per window",
  },
  AUTH_RATE_LIMIT_WINDOW_MINUTES: {
    required: false,
    type: "number",
    default: "15",
    description: "Auth rate limit window in minutes",
  },
  AUTH_RATE_LIMIT_MAX_REQUESTS: {
    required: false,
    type: "number",
    default: "5",
    description: "Maximum auth requests per window",
  },
  STRICT_RATE_LIMIT_WINDOW_MINUTES: {
    required: false,
    type: "number",
    default: "60",
    description: "Strict rate limit window in minutes",
  },
  STRICT_RATE_LIMIT_MAX_REQUESTS: {
    required: false,
    type: "number",
    default: "3",
    description: "Maximum strict requests per window",
  },
  CREATE_RATE_LIMIT_WINDOW_MINUTES: {
    required: false,
    type: "number",
    default: "15",
    description: "Create operation rate limit window",
  },
  CREATE_RATE_LIMIT_MAX_REQUESTS: {
    required: false,
    type: "number",
    default: "30",
    description: "Maximum create requests per window",
  },
  UPDATE_RATE_LIMIT_WINDOW_MINUTES: {
    required: false,
    type: "number",
    default: "15",
    description: "Update operation rate limit window",
  },
  UPDATE_RATE_LIMIT_MAX_REQUESTS: {
    required: false,
    type: "number",
    default: "50",
    description: "Maximum update requests per window",
  },
  DELETE_RATE_LIMIT_WINDOW_MINUTES: {
    required: false,
    type: "number",
    default: "15",
    description: "Delete operation rate limit window",
  },
  DELETE_RATE_LIMIT_MAX_REQUESTS: {
    required: false,
    type: "number",
    default: "20",
    description: "Maximum delete requests per window",
  },
  TRUSTED_IPS: {
    required: false,
    type: "string",
    default: "",
    description: "Comma-separated list of trusted IPs for rate limit bypass",
  },
  REDIS_URL: {
    required: false,
    type: "string",
    description: "Redis URL for distributed rate limiting",
  },
  RATE_LIMIT_WEBHOOK_URL: {
    required: false,
    type: "url",
    description: "Webhook URL for rate limit alerts",
  },
  RATE_LIMIT_WEBHOOK_SECRET: {
    required: false,
    type: "string",
    description: "Secret for rate limit webhook authentication",
  },

  // === OPTIONAL: CORS ===
  ALLOWED_ORIGINS: {
    required: false,
    type: "string",
    description: "Comma-separated list of additional allowed origins",
  },

  // === OPTIONAL: Seed Data ===
  INITIALIZE_SEED_DATA: {
    required: false,
    type: "boolean",
    default: "false",
    description: "Initialize seed data on startup (development only)",
  },

  // === OPTIONAL: Platform Configuration ===
  PLATFORM_ORGANIZATION_ID: {
    required: false,
    type: "string",
    description: "Platform organization MongoDB ObjectId",
  },
  PLATFORM_ORGANIZATION_NAME: {
    required: false,
    type: "string",
    description: "Platform organization name",
  },
  PLATFORM_ORGANIZATION_DESCRIPTION: {
    required: false,
    type: "string",
    description: "Platform organization description",
  },
  PLATFORM_ORGANIZATION_EMAIL: {
    required: false,
    type: "email",
    description: "Platform organization email",
  },
  PLATFORM_ORGANIZATION_PHONE: {
    required: false,
    type: "string",
    description: "Platform organization phone",
  },
  PLATFORM_ORGANIZATION_ADDRESS: {
    required: false,
    type: "string",
    description: "Platform organization address",
  },
  PLATFORM_ORGANIZATION_SIZE: {
    required: false,
    type: "string",
    description: "Platform organization size",
  },
  PLATFORM_ORGANIZATION_INDUSTRY: {
    required: false,
    type: "string",
    description: "Platform organization industry",
  },
  PLATFORM_DEPARTMENT_NAME: {
    required: false,
    type: "string",
    description: "Platform department name",
  },
  PLATFORM_DEPARTMENT_DESCRIPTION: {
    required: false,
    type: "string",
    description: "Platform department description",
  },
  PLATFORM_ADMIN_FIRST_NAME: {
    required: false,
    type: "string",
    description: "Platform admin first name",
  },
  PLATFORM_ADMIN_LAST_NAME: {
    required: false,
    type: "string",
    description: "Platform admin last name",
  },
  PLATFORM_ADMIN_POSITION: {
    required: false,
    type: "string",
    description: "Platform admin position",
  },
  PLATFORM_ADMIN_ROLE: {
    required: false,
    type: "string",
    description: "Platform admin role",
  },
  PLATFORM_ADMIN_EMAIL: {
    required: false,
    type: "email",
    description: "Platform admin email",
  },
  PLATFORM_ADMIN_PASSWORD: {
    required: false,
    type: "string",
    description: "Platform admin password",
  },

  // === OPTIONAL: Logging ===
  LOG_LEVEL: {
    required: false,
    type: "enum",
    values: ["error", "warn", "info", "http", "debug"],
    default: "info",
    description: "Logging level",
  },
};

/**
 * Validate a single environment variable
 * @param {string} key - Environment variable name
 * @param {Object} definition - Validation definition
 * @returns {Object} - Validation result { valid, value, error }
 */
const validateVariable = (key, definition) => {
  let value = process.env[key];
  const result = { key, valid: true, value: null, error: null, warning: null };

  // Apply default if not set
  if (value === undefined || value === "") {
    if (definition.default !== undefined) {
      value = definition.default;
      result.warning = `Using default value: ${definition.default}`;
    } else if (definition.required) {
      result.valid = false;
      result.error = `Required environment variable ${key} is not set`;
      return result;
    } else {
      result.value = null;
      return result;
    }
  }

  // Type validation
  switch (definition.type) {
    case "string":
      if (typeof value !== "string") {
        result.valid = false;
        result.error = `${key} must be a string`;
      } else if (definition.minLength && value.length < definition.minLength) {
        result.valid = false;
        result.error = `${key} must be at least ${definition.minLength} characters`;
      }
      break;

    case "number":
      const num = parseInt(value, 10);
      if (isNaN(num)) {
        result.valid = false;
        result.error = `${key} must be a valid number`;
      }
      break;

    case "port":
      const port = parseInt(value, 10);
      if (isNaN(port) || port < 1 || port > 65535) {
        result.valid = false;
        result.error = `${key} must be a valid port number (1-65535)`;
      }
      break;

    case "boolean":
      if (!["true", "false", "1", "0"].includes(value.toLowerCase())) {
        result.valid = false;
        result.error = `${key} must be a boolean (true/false)`;
      }
      break;

    case "enum":
      if (!definition.values.includes(value)) {
        result.valid = false;
        result.error = `${key} must be one of: ${definition.values.join(", ")}`;
      }
      break;

    case "url":
      try {
        new URL(value);
      } catch {
        result.valid = false;
        result.error = `${key} must be a valid URL`;
      }
      break;

    case "email":
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        result.valid = false;
        result.error = `${key} must be a valid email address`;
      }
      break;
  }

  result.value = value;
  return result;
};

/**
 * Validate all environment variables
 * @param {Object} options - Validation options
 * @param {boolean} options.exitOnError - Exit process on validation failure
 * @param {boolean} options.logResults - Log validation results
 * @returns {Object} - Validation results { valid, errors, warnings }
 */
export const validateEnvironment = (options = {}) => {
  const { exitOnError = true, logResults = true } = options;

  const results = {
    valid: true,
    errors: [],
    warnings: [],
    validated: {},
  };

  // Validate each defined variable
  for (const [key, definition] of Object.entries(ENV_DEFINITIONS)) {
    const result = validateVariable(key, definition);
    results.validated[key] = result;

    if (!result.valid) {
      results.valid = false;
      results.errors.push(result.error);
    }

    if (result.warning) {
      results.warnings.push(`${key}: ${result.warning}`);
    }
  }

  // Log results
  if (logResults) {
    if (results.valid) {
      logger.info("✅ Environment variables validated successfully");

      if (results.warnings.length > 0) {
        results.warnings.forEach((warning) => {
          logger.warn(`⚠️  ${warning}`);
        });
      }
    } else {
      logger.error("❌ Environment validation failed:");
      results.errors.forEach((error) => {
        logger.error(`   - ${error}`);
      });
    }
  }

  // Exit on error if configured
  if (!results.valid && exitOnError) {
    logger.error(
      "🚨 Server cannot start with invalid environment configuration"
    );
    process.exit(1);
  }

  return results;
};

/**
 * Get a validated environment variable with type coercion
 * @param {string} key - Environment variable name
 * @param {*} defaultValue - Default value if not set
 * @returns {*} - Coerced value
 */
export const getEnv = (key, defaultValue = undefined) => {
  const definition = ENV_DEFINITIONS[key];
  const value = process.env[key];

  if (value === undefined || value === "") {
    return defaultValue !== undefined ? defaultValue : definition?.default;
  }

  // Type coercion
  if (definition) {
    switch (definition.type) {
      case "number":
      case "port":
        return parseInt(value, 10);
      case "boolean":
        return value.toLowerCase() === "true" || value === "1";
      default:
        return value;
    }
  }

  return value;
};

/**
 * Check if running in production
 * @returns {boolean}
 */
export const isProduction = () => {
  return process.env.NODE_ENV === "production";
};

/**
 * Check if running in development
 * @returns {boolean}
 */
export const isDevelopment = () => {
  return process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
};

/**
 * Check if running in test
 * @returns {boolean}
 */
export const isTest = () => {
  return process.env.NODE_ENV === "test";
};

/**
 * Get all environment variable definitions (for documentation)
 * @returns {Object}
 */
export const getEnvDefinitions = () => {
  return { ...ENV_DEFINITIONS };
};

export default validateEnvironment;
