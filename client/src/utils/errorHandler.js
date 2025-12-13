// client/src/utils/errorHandler.js
/**
 * Comprehensive Error Handling Utility
 */

import { toast } from "react-toastify";
import { ERROR_CODES, ERROR_SEVERITY, ERROR_TYPES } from "./constants.js";

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
    status = "error",
    context = {},
    originalError = null,
    isOperational = true,
  }) {
    this.message = message;
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.type = type;
    this.severity = severity;
    this.status = status;
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
    // In production, sanitize technical error messages for frontend errors
    if (import.meta.env.PROD && this.type === ERROR_TYPES.FRONTEND) {
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
      status: this.status,
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
 */
const parseBackendError = (error) => {
  // 1. RTK Query error structure (from apiSlice via useGetTasksQuery, etc.)
  // Structure: { status: status, data: { success, status, message, errorCode, context } }
  if (error?.status && error?.data) {
    return {
      message: error.data.message || "An error occurred",
      errorCode: error.data.errorCode || ERROR_CODES.INTERNAL_SERVER_ERROR,
      statusCode: error.status,
      status: error.data.status || "error",
      context: error.data.context || {},
      isBackendError: true,
    };
  }

  // 2. Redux Thunk unwrap() error (from authApi via login().unwrap())
  // When unwrap() throws, it throws the value from rejectWithValue()
  // Structure: { success, status, message, errorCode, context } (backend response)
  if (error?.message && error?.errorCode && error?.status) {
    return {
      message: error.message,
      errorCode: error.errorCode,
      statusCode: error.statusCode || 500,
      status: error.status || "error",
      context: error.context || {},
      isBackendError: true,
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
      status: error.response.data.status || "error",
      context: error.response.data.context || {},
      isBackendError: true,
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
      isBackendError: false, // Network errors are client-side
    };
  }

  return null; // Not a backend error
};

/**
 * Parse frontend/client-side errors - generic handler for all non-backend errors
 */
const parseFrontendError = (error) => {
  // Get the error type/constructor name dynamically
  const errorType = error?.constructor?.name || "UnknownError";
  const errorName = error?.name || "Error";

  // Special case: Chunk loading errors (dynamic import failures)
  if (
    error?.message?.includes("Loading chunk") ||
    error?.message?.includes("ChunkLoadError")
  ) {
    return {
      message: "Failed to load application resources. Please refresh the page.",
      errorCode: ERROR_CODES.CHUNK_LOAD_ERROR,
      statusCode: 0,
      context: {
        type: "chunk_load",
        errorType,
        errorName,
        originalMessage: error.message,
      },
      isBackendError: false,
    };
  }

  // Special case: React component errors
  if (error?.componentStack) {
    return {
      message: error.message || "A React component error occurred",
      errorCode: ERROR_CODES.COMPONENT_ERROR,
      statusCode: 0,
      context: {
        componentStack: error.componentStack,
        type: "react_component",
        errorType,
        errorName,
      },
      isBackendError: false,
    };
  }

  // Generic frontend error - catch all other frontend errors
  return {
    message:
      error?.message || error?.toString() || "An unexpected error occurred",
    errorCode: ERROR_CODES.FRONTEND_ERROR,
    statusCode: 0,
    context: {
      type: "frontend_runtime",
      errorType,
      errorName,
      stack: error?.stack,
    },
    isBackendError: false,
  };
};

/**
 * Determine error severity based on error code and status
 */
const determineErrorSeverity = (errorCode, statusCode) => {
  // Critical errors - backend 5xx and critical frontend errors
  if (statusCode >= 500) {
    return ERROR_SEVERITY.CRITICAL;
  }

  // High severity errors
  if (
    [
      ERROR_CODES.AUTHENTICATION_ERROR,
      ERROR_CODES.AUTHORIZATION_ERROR,
      ERROR_CODES.NETWORK_ERROR,
      ERROR_CODES.CHUNK_LOAD_ERROR,
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
      ERROR_CODES.COMPONENT_ERROR,
    ].includes(errorCode)
  ) {
    return ERROR_SEVERITY.MEDIUM;
  }

  // Low severity errors
  return ERROR_SEVERITY.LOW;
};

/**
 * Determine error type based on error code and source
 */
const determineErrorType = (errorCode, isBackendError) => {
  // Backend errors
  if (isBackendError) {
    if (
      [
        ERROR_CODES.AUTHENTICATION_ERROR,
        ERROR_CODES.AUTHORIZATION_ERROR,
      ].includes(errorCode)
    ) {
      return ERROR_TYPES.AUTH;
    }
    if (errorCode === ERROR_CODES.VALIDATION_ERROR) {
      return ERROR_TYPES.VALIDATION;
    }
    return ERROR_TYPES.BACKEND;
  }

  // Network errors
  if (
    [ERROR_CODES.NETWORK_ERROR, ERROR_CODES.TIMEOUT_ERROR].includes(errorCode)
  ) {
    return ERROR_TYPES.NETWORK;
  }

  // Frontend errors
  return ERROR_TYPES.FRONTEND;
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

  // First, try to parse as a backend/API error
  const backendError = parseBackendError(error);
  if (backendError) {
    parsedError = backendError;
  }
  // If not a backend error, parse as frontend error
  else {
    parsedError = parseFrontendError(error);
  }

  // Create normalized AppError
  const appError = new AppError({
    message: parsedError.message,
    errorCode: parsedError.errorCode,
    statusCode: parsedError.statusCode,
    type: determineErrorType(parsedError.errorCode, parsedError.isBackendError),
    severity: determineErrorSeverity(
      parsedError.errorCode,
      parsedError.statusCode
    ),
    status: parsedError.status,
    context: { ...parsedError.context, ...context },
    originalError: error,
  });

  // Log error if needed
  // if (appError.shouldLog()) {
  //   logError(appError);
  // }

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
  if (!error) return false;

  // Check error codes
  if (
    isErrorType(error, ERROR_CODES.AUTHENTICATION_ERROR) ||
    isErrorType(error, ERROR_CODES.AUTHORIZATION_ERROR)
  ) {
    return true;
  }

  // Check HTTP status codes
  const errorMessage = error.message || error.error || "";
  const errorStatus = error.status || error.statusCode;

  if (errorStatus === 401 || errorStatus === 403) {
    return true;
  }

  // Check for authentication-related error messages
  const authKeywords = [
    "authentication",
    "unauthorized",
    "token",
    "expired",
    "invalid token",
    "no token",
    "jwt",
    "forbidden",
  ];

  return authKeywords.some((keyword) =>
    errorMessage.toLowerCase().includes(keyword)
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

/**
 * Check if error is a frontend error
 */
export const isFrontendError = (error) => {
  const appError = error instanceof AppError ? error : handleError(error);
  return appError.type === ERROR_TYPES.FRONTEND;
};

/**
 * Centralized Authentication Error Handler
 *
 * Handles authentication errors from both Socket.IO and RTK Query.
 * Clears credentials, disconnects socket, resets API state, and redirects to login.
 *
 * @param {Error|Object} error - Error object
 * @param {string} [source="unknown"] - Source of the error (socket, api, etc.)
 */
export const handleAuthError = (error, source = "unknown") => {
  console.error(`🚨 Auth error from ${source}:`, error);

  // Import store and actions dynamically to avoid circular dependency
  Promise.all([
    import("../redux/app/store"),
    import("../redux/features/auth/authSlice"),
  ]).then(([{ store }, { clearCredentials }]) => {
    // Clear authentication credentials
    store.dispatch(clearCredentials());

    // Reset API state to clear all cached data
    store.dispatch({ type: "api/resetApiState" });
  });

  // Disconnect socket if error is not from socket
  if (source !== "socket") {
    import("../services/socketService").then(({ socketService }) => {
      if (socketService.isConnected) {
        console.log("🔌 Disconnecting socket due to auth error");
        socketService.disconnect();
      }
    });
  }

  // Show user-friendly message
  import("react-toastify").then(({ toast }) => {
    toast.error("Your session has expired. Please log in again.", {
      toastId: "session-expired",
      autoClose: 3000,
    });
  });

  // Redirect to login page after a short delay
  setTimeout(() => {
    console.log("🚪 Redirecting to login page");
    window.location.href = "/login";
  }, 500);
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
  isFrontendError,
  handleAuthError,
  AppError,
};
