// backend/errorHandler/ErrorController.js
import CustomError from "./CustomError.js";

/**
 * Collect comprehensive error context for debugging and monitoring
 */
const collectErrorContext = (error, req) => {
  const context = {
    // Request tracking
    correlationId:
      req.id || req.headers["x-correlation-id"] || generateCorrelationId(),

    // Request information
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),

    // User context (if available)
    userId: req.user?._id?.toString(),
    userRole: req.user?.role,
    organizationId: req.user?.organization?._id?.toString(),
    departmentId: req.user?.department?._id?.toString(),

    // Authorization context (if available)
    authzResource: req.authz?.resource,
    authzOperation: req.authz?.operation,
    authzScope: req.authz?.scope,

    // Request body/params (sanitized)
    params: req.params,
    query: sanitizeQuery(req.query),

    // Error details
    errorName: error.name,
    errorMessage: error.message,

    // Stack trace (for operational errors only)
    ...(error.isOperational && { stack: error.stack }),
  };

  // Add request body for non-sensitive operations
  if (req.body && !containsSensitiveData(req.originalUrl)) {
    context.body = sanitizeBody(req.body);
  }

  return context;
};

/**
 * Sanitize query parameters to remove sensitive information
 */
const sanitizeQuery = (query) => {
  const sanitized = { ...query };
  const sensitiveFields = ["password"];

  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = "[REDACTED]";
    }
  });

  return sanitized;
};

/**
 * Sanitize request body to remove sensitive information
 */
const sanitizeBody = (body) => {
  const sanitized = { ...body };
  const sensitiveFields = ["password"];

  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = "[REDACTED]";
    }
  });

  return sanitized;
};

/**
 * Check if URL contains sensitive operations
 */
const containsSensitiveData = (url) => {
  const sensitivePatterns = ["/auth/", "/password", "/login", "/register"];
  return sensitivePatterns.some((pattern) => url.includes(pattern));
};

/**
 * Log security events for monitoring and audit purposes
 */
const logSecurityEvent = (error, req, context) => {
  const securityEvents = [
    "AUTHENTICATION_ERROR",
    "AUTHORIZATION_ERROR",
    "INVALID_TOKEN_ERROR",
    "TOKEN_EXPIRED_ERROR",
    "FORBIDDEN_ERROR",
    "TOO_MANY_REQUESTS_ERROR",
  ];

  if (securityEvents.includes(error.errorCode)) {
    console.warn("🔒 SECURITY EVENT:", {
      event: error.errorCode,
      message: error.message,
      userId: context.userId,
      ip: context.ip,
      userAgent: context.userAgent,
      url: context.url,
      method: context.method,
      timestamp: context.timestamp,
    });
  }
};

const handleSpecificErrors = (error, req) => {
  const baseContext = collectErrorContext(error, req);

  /* ---------- MongoDB CastError ---------- */
  if (error.name === "CastError") {
    return new CustomError(
      `Invalid resource identifier: ${error.value}`,
      400,
      "VALIDATION_ERROR",
      { ...baseContext, invalidValue: error.value, path: error.path }
    );
  }

  /* ---------- Duplicate key error ---------- */
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];
    return new CustomError(
      `${field} '${value}' already exists. Please use a different value.`,
      409,
      "VALIDATION_ERROR",
      { ...baseContext, duplicateField: field, duplicateValue: value }
    );
  }

  /* ---------- Validation error ---------- */
  if (error.name === "ValidationError") {
    const errors = Object.values(error.errors).map((el) => el.message);
    return new CustomError(
      `Validation failed: ${errors.join(". ")}`,
      400,
      "VALIDATION_ERROR",
      {
        ...baseContext,
        validationErrors: errors,
        invalidFields: Object.keys(error.errors),
      }
    );
  }

  /* ---------- JWT errors ---------- */
  if (error.name === "JsonWebTokenError") {
    return new CustomError(
      "Invalid authentication token. Please log in again.",
      401,
      "AUTHENTICATION_ERROR",
      { ...baseContext, jwtError: "Invalid token format" }
    );
  }

  /* ---------- Expired token ---------- */
  if (error.name === "TokenExpiredError") {
    return new CustomError(
      "Your authentication token has expired. Please log in again.",
      401,
      "AUTHENTICATION_ERROR",
      { ...baseContext, jwtError: "Token expired", expiredAt: error.expiredAt }
    );
  }

  /* ---------- Rate-limiting ---------- */
  if (error.statusCode === 429) {
    return new CustomError(
      "Too many requests. Please try again later.",
      429,
      "TOO_MANY_REQUESTS_ERROR",
      { ...baseContext, rateLimitHit: true }
    );
  }

  /* ---------- Authorization errors ---------- */
  if (error.statusCode === 403) {
    return new CustomError(
      error.message || "You do not have permission to perform this operation",
      403,
      "AUTHORIZATION_ERROR",
      baseContext
    );
  }

  /* ---------- Not found errors ---------- */
  if (error.statusCode === 404) {
    return new CustomError(
      error.message || "The requested resource was not found",
      404,
      "NOT_FOUND_ERROR",
      baseContext
    );
  }

  /* ---------- Default: forward with enhanced context ---------- */
  if (error instanceof CustomError) {
    // Enhance existing CustomError with additional context
    error.context = { ...error.context, ...baseContext };
    return error;
  }

  // Convert unknown errors to CustomError with consistent error code
  return new CustomError(
    error.message || "An unexpected error occurred",
    error.statusCode || 500,
    "INTERNAL_SERVER_ERROR",
    baseContext
  );
};

/**
 * Generate a unique correlation ID for request tracking
 */
const generateCorrelationId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const globalErrorHandler = (error, req, res, next) => {
  /* 1. enrich / convert the incoming error */
  const handledError = handleSpecificErrors(error, req);

  /* 2. log security events for monitoring */
  logSecurityEvent(handledError, req, handledError.context);

  /* 3. decide how much to reveal */
  const isDevelopment = process.env.NODE_ENV === "development";
  const isProduction = process.env.NODE_ENV === "production";
  const showDetails = isDevelopment || handledError.isOperational;

  /* 4. build the payload that goes to the client */
  const errorResponse = {
    success: false,
    status: handledError.status || "error",
    message: showDetails
      ? handledError.message
      : "An unexpected error occurred",
    errorCode: handledError.errorCode || "INTERNAL_SERVER_ERROR",
    correlationId: handledError.context?.correlationId,

    /* expose context only when we already show details and not in production */
    ...(showDetails &&
      !isProduction && {
        path: req.originalUrl,
        timestamp: handledError.timestamp || new Date().toISOString(),
        context: {
          // Only include safe context in response
          url: handledError.context?.url,
          method: handledError.context?.method,
          timestamp: handledError.context?.timestamp,
          ...(handledError.context?.validationErrors && {
            validationErrors: handledError.context.validationErrors,
          }),
          ...(handledError.context?.invalidFields && {
            invalidFields: handledError.context.invalidFields,
          }),
        },
      }),

    /* stack traces in dev only */
    ...(isDevelopment && { stack: handledError.stack }),
  };

  /* 5. log error details for debugging (server-side only) */
  if (handledError.statusCode >= 500) {
    console.error("🚨 SERVER ERROR:", {
      message: handledError.message,
      errorCode: handledError.errorCode,
      statusCode: handledError.statusCode,
      context: handledError.context,
      stack: handledError.stack,
    });
  } else if (isDevelopment && handledError.statusCode >= 400) {
    console.warn("⚠️  CLIENT ERROR:", {
      message: handledError.message,
      errorCode: handledError.errorCode,
      statusCode: handledError.statusCode,
      url: handledError.context?.url,
      method: handledError.context?.method,
    });
  }

  /* 6. respond */
  return res.status(handledError.statusCode || 500).json(errorResponse);
};

export default globalErrorHandler;
