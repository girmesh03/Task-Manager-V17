/**
 * Custom Error Class for standardized error handling across the application
 * Provides consistent error responses with status codes and error codes
 */

class CustomError extends Error {
  /**
   * @param {string} message - Error message
   * @param {string} errorCode - Machine-readable error code
   * @param {number} statusCode - HTTP status code
   */
  constructor(message, errorCode = "INTERNAL_ERROR", statusCode = 500) {
    super(message);
    this.name = "CustomError";
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguishes operational errors from programming errors

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Factory method for 400 Bad Request errors
   * @param {string} message - Error message
   * @returns {CustomError}
   */
  static badRequest(message = "Bad Request") {
    return new CustomError(message, "BAD_REQUEST", 400);
  }

  /**
   * Factory method for 401 Unauthorized errors
   * @param {string} message - Error message
   * @returns {CustomError}
   */
  static unauthorized(message = "Unauthorized - Authentication required") {
    return new CustomError(message, "UNAUTHORIZED", 401);
  }

  /**
   * Factory method for 403 Forbidden errors
   * @param {string} message - Error message
   * @returns {CustomError}
   */
  static forbidden(message = "Forbidden - Insufficient permissions") {
    return new CustomError(message, "FORBIDDEN", 403);
  }

  /**
   * Factory method for 404 Not Found errors
   * @param {string} message - Error message
   * @returns {CustomError}
   */
  static notFound(message = "Resource not found") {
    return new CustomError(message, "NOT_FOUND", 404);
  }

  /**
   * Factory method for 409 Conflict errors
   * @param {string} message - Error message
   * @returns {CustomError}
   */
  static conflict(message = "Resource conflict") {
    return new CustomError(message, "CONFLICT", 409);
  }

  /**
   * Factory method for 422 Unprocessable Entity errors
   * @param {string} message - Error message
   * @returns {CustomError}
   */
  static validationError(message = "Validation failed") {
    return new CustomError(message, "VALIDATION_ERROR", 422);
  }

  /**
   * Factory method for 500 Internal Server errors
   * @param {string} message - Error message
   * @returns {CustomError}
   */
  static internalError(message = "Internal Server Error") {
    return new CustomError(message, "INTERNAL_ERROR", 500);
  }

  /**
   * Factory method for 503 Service Unavailable errors
   * @param {string} message - Error message
   * @returns {CustomError}
   */
  static serviceUnavailable(message = "Service temporarily unavailable") {
    return new CustomError(message, "SERVICE_UNAVAILABLE", 503);
  }

  /**
   * Convert error to JSON format for API responses
   * @returns {Object}
   */
  toJSON() {
    return {
      success: false,
      message: this.message,
      errorCode: this.errorCode,
      statusCode: this.statusCode,
    };
  }
}

export default CustomError;
