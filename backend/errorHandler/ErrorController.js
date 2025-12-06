import CustomError from "./CustomError.js";

/**
 * Global error handler middleware
 * Catches all errors in the application and sends standardized responses
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error("Error occurred:", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Handle CustomError instances
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorCode: err.errorCode,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errorCode: "VALIDATION_ERROR",
      errors: messages,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
      errorCode: "INVALID_ID",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const value = err.keyValue[field];
    return res.status(409).json({
      success: false,
      message: `${field} '${value}' already exists`,
      errorCode: "DUPLICATE_KEY",
      field,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
      errorCode: "INVALID_TOKEN",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
      errorCode: "TOKEN_EXPIRED",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  // Handle multer file upload errors
  if (err.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: err.message,
      errorCode: "FILE_UPLOAD_ERROR",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  // Default to 500 Internal Server Error for unknown errors
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "development"
      ? err.message
      : "Internal Server Error",
    errorCode: "INTERNAL_ERROR",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
