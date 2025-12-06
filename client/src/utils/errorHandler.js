/**
 * Custom Error Class for Frontend
 * Provides consistent error handling matching backend CustomError
 */

class AppError extends Error {
  /**
   * @param {string} message - Error message
   * @param {string} code - Machine-readable error code
   * @param {string} severity - Error severity (error, warning, info)
   * @param {string} type - Error type (general, validation, auth, network)
   */
  constructor(
    message,
    code = "ERROR",
    severity = "error",
    type = "general"
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.severity = severity;
    this.type = type;

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Factory method for bad request errors
   * @param {string} message - Error message
   * @returns {AppError}
   */
  static badRequest(message = "Bad Request") {
    return new AppError(message, "BAD_REQUEST", "error", "validation");
  }

  /**
   * Factory method for 401 Unauthenticated errors (Not Authenticated)
   * @param {string} message - Error message
   * @returns {AppError}
   */
  static unauthenticated(message = "Unauthenticated - Please login") {
    return new AppError(message, "UNAUTHENTICATED", "error", "auth");
  }

  /**
   * Factory method for 403 Forbidden errors (Authenticated but Insufficient Permissions)
   * @param {string} message - Error message
   * @returns {AppError}
   */
  static forbidden(message = "Forbidden - Insufficient permissions") {
    return new AppError(message, "FORBIDDEN", "error", "auth");
  }

  /**
   * Alias for backward compatibility
   * @deprecated Use unauthenticated() instead
   */
  static unauthorized(message = "Unauthorized - Please login") {
    return AppError.unauthenticated(message);
  }

  /**
   * Factory method for not found errors
   * @param {string} message - Error message
   * @returns {AppError}
   */
  static notFound(message = "Resource not found") {
    return new AppError(message, "NOT_FOUND", "error", "general");
  }

  /**
   * Factory method for network errors
   * @param {string} message - Error message
   * @returns {AppError}
   */
  static networkError(message = "Network error - Please check your connection") {
    return new AppError(message, "NETWORK_ERROR", "error", "network");
  }

  /**
   * Factory method for validation errors
   * @param {string} message - Error message
   * @returns {AppError}
   */
  static validationError(message = "Validation failed") {
    return new AppError(message, "VALIDATION_ERROR", "error", "validation");
  }

  /**
   * Convert error to plain object
   * @returns {Object}
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      type: this.type,
    };
  }
}

export default AppError;
