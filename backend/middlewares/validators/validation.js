// backend/middlewares/validators/validation.js
import { validationResult } from "express-validator";
import CustomError from "../../errorHandler/CustomError.js";

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().reduce((acc, error) => {
      // express-validator exposes the field name in `param`
      const key = error.param || error.path || error.location || "field";
      acc[key] = error.msg;
      return acc;
    }, {});

    return next(
      CustomError.validation(
        `Validation failed: ${Object.values(errorMessages).join(". ")}`,
        {
          url: req.originalUrl,
          method: req.method,
          ip: req.ip,
          invalidFields: Object.keys(errorMessages),
          body: req.body,
          query: req.query,
        }
      )
    );
  }
  next();
};
