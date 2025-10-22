// client/src/utils/errorHandler.js
/**
 * Comprehensive Error Handling Utility
 *
 * Handles all types of errors in the application:
 * 1. Backend API errors (from RTK Query/Axios)
 * 2. Frontend React errors (component errors)
 * 3. Network errors
 * 4. Validation errors
 * 5. Authentication/Authorization errors
 */

import { toast } from "react-toastify";

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

  // Frontend errors
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

/**
 * Normalized error structure
 */
class AppError {
  constructor({
    message,
    errorCode,
    statusCode,
    type,
    severity,
    context = {},
    originalError = null,
    isOperational = true,
  }) {
    this.message = message;
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.type = type;
    this.severity = severity;
    this.context = context;
    this.originalError = originalError;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Check if error should be displayed to user
   */
  shouldDisplay() {
    return this.isOperational;
  }

  /**
   * Check if error should be logged
   */
  shouldLog() {
    return (
      this.severity === ERROR_SEVERITY.HIGH ||
      this.severity === ERROR_SEVERITY.CRITICAL
    );
  }

  /**
   * Get user-friendly message
   */
  getUserMessage() {
    // In production, sanitize technical error messages
    if (import.meta.env.PROD && !this.isOperational) {
      return "An unexpected error occurred. Please try again later.";
    }
    return this.message;
  }

  /**
   * Convert to JSON for logging
   */
  toJSON() {
    return {
      message: this.message,
      errorCode: this.errorCode,
      statusCode: this.statusCode,
      type: this.type,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
      isOperational: this.isOperational,
      ...(import.meta.env.DEV &&
        this.originalError && {
          stack: this.originalError.stack,
        }),
    };
  }
}

/**
 * Parse backend API error response
 *
 * Backend error format from ErrorController.js:
 * {
 *   success: false,
 *   status: "fail" | "error",
 *   message: string,
 *   errorCode: string,
 *   statusCode: number (not in response, derived from HTTP status),
 *   path?: string,
 *   timestamp?: string,
 *   context?: object,
 *   stack?: string (dev only)
 * }
 *
 * Error Flow:
 * 1. RTK Query: error = { status: 401, data: { backend response } }
 * 2. Redux Thunk unwrap(): error = rejectWithValue(error.response?.data) = { backend response }
 * 3. Axios direct: error = { response: { status, data: { backend response } } }
 */
const parseBackendError = (error) => {
  // 1. RTK Query error structure (from apiSlice via useGetTasksQuery, etc.)
  // Structure: { status: 401, data: { success, status, message, errorCode, context } }
  if (error?.status && error?.data) {
    return {
      message: error.data.message || "An error occurred",
      errorCode: error.data.errorCode || ERROR_CODES.INTERNAL_SERVER_ERROR,
      statusCode: error.status,
      context: error.data.context || {},
    };
  }

  // 2. Redux Thunk unwrap() error (from authApi via login().unwrap())
  // When unwrap() throws, it throws the value from rejectWithValue()
  // Structure: { success, status, message, errorCode, context } (backend response)
  // OR: { message, errorCode, statusCode } (network error fallback)
  if (error?.message && error?.errorCode) {
    return {
      message: error.message,
      errorCode: error.errorCode,
      statusCode: error.statusCode || 500,
      context: error.context || {},
    };
  }

  // 3. Axios error structure (direct axios calls, not through Redux)
  // Structure: { response: { status, data: { backend response } } }
  if (error?.response?.data) {
    return {
      message:
        error.response.data.message || error.message || "An error occurred",
      errorCode:
        error.response.data.errorCode || ERROR_CODES.INTERNAL_SERVER_ERROR,
      statusCode: error.response.status || 500,
      context: error.response.data.context || {},
    };
  }

  // 4. Network error (no response received from server)
  // Structure: { request: {}, message: "Network Error" }
  if (error?.request && !error?.response) {
    return {
      message: "Network error. Please check your connection.",
      errorCode: ERROR_CODES.NETWORK_ERROR,
      statusCode: 0,
      context: { type: "network" },
    };
  }

  // 5. Legacy string error (backward compatibility)
  if (typeof error === "string") {
    // Determine error code based on message content
    let errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR;
    let statusCode = 500;

    const lowerError = error.toLowerCase();

    if (
      lowerError.includes("invalid") ||
      lowerError.includes("incorrect") ||
      lowerError.includes("wrong") ||
      lowerError.includes("authentication") ||
      lowerError.includes("credentials")
    ) {
      errorCode = ERROR_CODES.AUTHENTICATION_ERROR;
      statusCode = 401;
    } else if (lowerError.includes("not found")) {
      errorCode = ERROR_CODES.NOT_FOUND_ERROR;
      statusCode = 404;
    } else if (
      lowerError.includes("already exists") ||
      lowerError.includes("duplicate")
    ) {
      errorCode = ERROR_CODES.CONFLICT_ERROR;
      statusCode = 409;
    } else if (
      lowerError.includes("validation") ||
      lowerError.includes("required")
    ) {
      errorCode = ERROR_CODES.VALIDATION_ERROR;
      statusCode = 400;
    } else if (
      lowerError.includes("unauthorized") ||
      lowerError.includes("not authorized")
    ) {
      errorCode = ERROR_CODES.AUTHENTICATION_ERROR;
      statusCode = 401;
    } else if (
      lowerError.includes("forbidden") ||
      lowerError.includes("permission")
    ) {
      errorCode = ERROR_CODES.AUTHORIZATION_ERROR;
      statusCode = 403;
    }

    return {
      message: error,
      errorCode,
      statusCode,
      context: {},
    };
  }

  // 6. Fallback for any other error type
  return {
    message:
      error?.message || error?.toString() || "An unexpected error occurred",
    errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
    statusCode: 500,
    context: {},
  };
};

/**
 * Determine error severity based on error code and status
 */
const determineErrorSeverity = (errorCode, statusCode) => {
  // Critical errors
  if (statusCode >= 500) {
    return ERROR_SEVERITY.CRITICAL;
  }

  // High severity errors
  if (
    [
      ERROR_CODES.AUTHENTICATION_ERROR,
      ERROR_CODES.AUTHORIZATION_ERROR,
      ERROR_CODES.NETWORK_ERROR,
    ].includes(errorCode)
  ) {
    return ERROR_SEVERITY.HIGH;
  }

  // Medium severity errors
  if (
    [
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_CODES.CONFLICT_ERROR,
      ERROR_CODES.NOT_FOUND_ERROR,
    ].includes(errorCode)
  ) {
    return ERROR_SEVERITY.MEDIUM;
  }

  // Low severity errors
  return ERROR_SEVERITY.LOW;
};

/**
 * Determine error type based on error code
 */
const determineErrorType = (errorCode, originalError) => {
  // Authentication/Authorization errors
  if (
    [
      ERROR_CODES.AUTHENTICATION_ERROR,
      ERROR_CODES.AUTHORIZATION_ERROR,
    ].includes(errorCode)
  ) {
    return ERROR_TYPES.AUTH;
  }

  // Validation errors
  if (errorCode === ERROR_CODES.VALIDATION_ERROR) {
    return ERROR_TYPES.VALIDATION;
  }

  // Network errors
  if (
    [ERROR_CODES.NETWORK_ERROR, ERROR_CODES.TIMEOUT_ERROR].includes(errorCode)
  ) {
    return ERROR_TYPES.NETWORK;
  }

  // Frontend errors
  if (
    [
      ERROR_CODES.COMPONENT_ERROR,
      ERROR_CODES.CHUNK_LOAD_ERROR,
      ERROR_CODES.ROUTE_ERROR,
    ].includes(errorCode)
  ) {
    return ERROR_TYPES.FRONTEND;
  }

  // Check if it's a React error
  if (originalError?.componentStack) {
    return ERROR_TYPES.FRONTEND;
  }

  // Default to backend error
  return ERROR_TYPES.BACKEND;
};

/**
 * Main error handler - normalizes all error types
 */
export const handleError = (error, context = {}) => {
  let parsedError;

  // Handle different error sources
  if (error instanceof AppError) {
    // Already normalized
    return error;
  }

  // Check for chunk loading errors first (before checking message property)
  if (
    error?.message?.includes("Loading chunk") ||
    error?.message?.includes("ChunkLoadError")
  ) {
    parsedError = {
      message: "Failed to load application resources. Please refresh the page.",
      errorCode: ERROR_CODES.CHUNK_LOAD_ERROR,
      statusCode: 0,
      context: { type: "chunk_load" },
    };
  }
  // Check for React component errors
  else if (error?.componentStack) {
    parsedError = {
      message: error.message || "A component error occurred",
      errorCode: ERROR_CODES.COMPONENT_ERROR,
      statusCode: 0,
      context: {
        componentStack: error.componentStack,
        ...context,
      },
    };
  }
  // Check for backend/API errors (RTK Query, Redux Thunk, Axios, Network)
  // This includes: error.status, error.data, error.message+errorCode, error.response, error.request
  else if (
    error?.status !== undefined || // RTK Query
    error?.data !== undefined || // RTK Query
    error?.errorCode !== undefined || // Redux Thunk unwrap()
    error?.response !== undefined || // Axios
    error?.request !== undefined || // Network error
    typeof error === "string" // Legacy string error
  ) {
    parsedError = parseBackendError(error);
  }
  // Fallback for any other error type
  else {
    parsedError = {
      message:
        error?.message || error?.toString() || "An unexpected error occurred",
      errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
      statusCode: 500,
      context: {},
    };
  }

  // Create normalized AppError
  const appError = new AppError({
    message: parsedError.message,
    errorCode: parsedError.errorCode,
    statusCode: parsedError.statusCode,
    type: determineErrorType(parsedError.errorCode, error),
    severity: determineErrorSeverity(
      parsedError.errorCode,
      parsedError.statusCode
    ),
    context: { ...parsedError.context, ...context },
    originalError: error,
    isOperational: parsedError.statusCode < 500,
  });

  // Log error if needed
  if (appError.shouldLog()) {
    logError(appError);
  }

  return appError;
};

/**
 * Display error to user via toast notification
 */
export const displayError = (error, options = {}) => {
  const appError = error instanceof AppError ? error : handleError(error);
  const message = appError.getUserMessage();

  const toastOptions = {
    autoClose: 5000,
    ...options,
  };

  // Choose toast type based on severity
  switch (appError.severity) {
    case ERROR_SEVERITY.CRITICAL:
    case ERROR_SEVERITY.HIGH:
      toast.error(message, toastOptions);
      break;
    case ERROR_SEVERITY.MEDIUM:
      toast.warning(message, toastOptions);
      break;
    case ERROR_SEVERITY.LOW:
      toast.info(message, toastOptions);
      break;
    default:
      toast.error(message, toastOptions);
  }

  return appError;
};

/**
 * Log error to console (and external service in production)
 */
export const logError = (error) => {
  const appError = error instanceof AppError ? error : handleError(error);
  const isDevelopment = import.meta.env.DEV;

  if (isDevelopment) {
    console.group(
      `🚨 ${appError.type.toUpperCase()} ERROR [${appError.severity}]`
    );
    console.error("Message:", appError.message);
    console.error("Error Code:", appError.errorCode);
    console.error("Status Code:", appError.statusCode);
    console.error("Context:", appError.context);
    console.error("Timestamp:", appError.timestamp);
    if (appError.originalError) {
      console.error("Original Error:", appError.originalError);
      if (appError.originalError.stack) {
        console.error("Stack:", appError.originalError.stack);
      }
    }
    console.groupEnd();
  } else {
    // In production, send to logging service (e.g., Sentry, LogRocket)
    // sendToLoggingService(appError.toJSON());
    console.error(`[${appError.errorCode}] ${appError.message}`);
  }
};

/**
 * Handle async errors with automatic error handling
 */
export const withErrorHandling = (asyncFn, options = {}) => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      const appError = handleError(error, options.context);

      if (options.displayError !== false) {
        displayError(appError, options.toastOptions);
      }

      if (options.rethrow) {
        throw appError;
      }

      return options.fallbackValue;
    }
  };
};

/**
 * Error handler for RTK Query mutations/queries
 */
export const handleRTKError = (error, customMessage = null) => {
  const appError = handleError(error);

  if (customMessage) {
    appError.message = customMessage;
  }

  displayError(appError);
  return appError;
};

/**
 * Check if error is a specific type
 */
export const isErrorType = (error, errorCode) => {
  if (error instanceof AppError) {
    return error.errorCode === errorCode;
  }

  const appError = handleError(error);
  return appError.errorCode === errorCode;
};

/**
 * Check if error requires authentication
 */
export const isAuthError = (error) => {
  return (
    isErrorType(error, ERROR_CODES.AUTHENTICATION_ERROR) ||
    isErrorType(error, ERROR_CODES.AUTHORIZATION_ERROR)
  );
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error) => {
  return (
    isErrorType(error, ERROR_CODES.NETWORK_ERROR) ||
    isErrorType(error, ERROR_CODES.TIMEOUT_ERROR)
  );
};

/**
 * Check if error is a validation error
 */
export const isValidationError = (error) => {
  return isErrorType(error, ERROR_CODES.VALIDATION_ERROR);
};

export default {
  handleError,
  displayError,
  logError,
  withErrorHandling,
  handleRTKError,
  isErrorType,
  isAuthError,
  isNetworkError,
  isValidationError,
  ERROR_CODES,
  ERROR_SEVERITY,
  ERROR_TYPES,
  AppError,
};
