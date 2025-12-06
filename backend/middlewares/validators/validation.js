/**
 * Validation Result Handler
 * Processes express-validator results and throws errors if validation fails
 */

import { validationResult } from "express-validator";
import CustomError from "../../errorHandler/CustomError.js";

/**
 * Handle validation errors from express-validator
 * Throws CustomError with validation messages if validation fails
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Extract error messages
    const errorMessages = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
    }));

    // Throw validation error with details
    const error = CustomError.validationError("Validation failed");
    error.errors = errorMessages;
    throw error;
  }

  next();
};

export default handleValidation;
