// backend/errorHandler/CustomError.js

/**
 * Standardized error codes mapping to HTTP status codes
 */
const ERROR_CODE_MAPPING = {
  400: "VALIDATION_ERROR",
  401: "AUTHENTICATION_ERROR",
  403: "AUTHORIZATION_ERROR",
  404: "NOT_FOUND_ERROR",
  409: "CONFLICT_ERROR",
  429: "TOO_MANY_REQUESTS_ERROR",
  500: "INTERNAL_SERVER_ERROR"
};

/**
 * Enhanced CustomError class with consistent error codes and comprehensive context
 */
class CustomError extends Error {
  constructor(
    message,
    statusCode = 500,
    errorCode = null,
    context = {}
  ) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    // Use standardized error code if not provided
    this.errorCode = errorCode || ERROR_CODE_MAPPING[statusCode] || "INTERNAL_SERVER_ERROR";

    this.isOperational = true;
    this.timestamp = new Date().toISOString();
    this.context = context;

    // Capture stack trace for debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Create a validation error with consistent error code
   */
  static validation(message, context = {}) {
    return new CustomError(message, 400, "VALIDATION_ERROR", context);
  }

  /**
   * Create an authentication error with consistent error code
   */
  static authentication(message, context = {}) {
    return new CustomError(message, 401, "AUTHENTICATION_ERROR", context);
  }

  /**
   * Create an authorization error with consistent error code
   */
  static authorization(message, context = {}) {
    return new CustomError(message, 403, "AUTHORIZATION_ERROR", context);
  }

  /**
   * Create a not found error with consistent error code
   */
  static notFound(message, context = {}) {
    return new CustomError(message, 404, "NOT_FOUND_ERROR", context);
  }

  /**
   * Create a conflict error with consistent error code
   */
  static conflict(message, context = {}) {
    return new CustomError(message, 409, "CONFLICT_ERROR", context);
  }

  /**
   * Create an internal server error with consistent error code
   */
  static internal(message, context = {}) {
    return new CustomError(message, 500, "INTERNAL_SERVER_ERROR", context);
  }

  /**
   * Convert the error to a JSON representation
   */
  toJSON() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      status: this.status,
      errorCode: this.errorCode,
      timestamp: this.timestamp,
      isOperational: this.isOperational,
      context: this.context
    };
  }
}

export default CustomError;
