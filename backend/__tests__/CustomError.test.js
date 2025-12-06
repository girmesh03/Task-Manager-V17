/**
 * Unit Tests for CustomError Class
 */

import CustomError from "../errorHandler/CustomError.js";

describe("CustomError", () => {
  describe("Constructor", () => {
    it("should create error with message, errorCode, and statusCode", () => {
      const error = new CustomError("Test error", "TEST_ERROR", 400);
      expect(error.message).toBe("Test error");
      expect(error.errorCode).toBe("TEST_ERROR");
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it("should use default values", () => {
      const error = new CustomError("Test error");
      expect(error.errorCode).toBe("INTERNAL_ERROR");
      expect(error.statusCode).toBe(500);
    });
  });

  describe("Factory Methods", () => {
    it("badRequest should return 400 error", () => {
      const error = CustomError.badRequest("Invalid input");
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe("BAD_REQUEST");
      expect(error.message).toBe("Invalid input");
    });

    it("unauthenticated should return 401 error", () => {
      const error = CustomError.unauthenticated();
      expect(error.statusCode).toBe(401);
      expect(error.errorCode).toBe("UNAUTHENTICATED");
    });

    it("forbidden should return 403 error", () => {
      const error = CustomError.forbidden();
      expect(error.statusCode).toBe(403);
      expect(error.errorCode).toBe("FORBIDDEN");
    });

    it("notFound should return 404 error", () => {
      const error = CustomError.notFound("Resource not found");
      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe("NOT_FOUND");
      expect(error.message).toBe("Resource not found");
    });

    it("conflict should return 409 error", () => {
      const error = CustomError.conflict("Duplicate entry");
      expect(error.statusCode).toBe(409);
      expect(error.errorCode).toBe("CONFLICT");
    });

    it("validationError should return 422 error", () => {
      const error = CustomError.validationError();
      expect(error.statusCode).toBe(422);
      expect(error.errorCode).toBe("VALIDATION_ERROR");
    });

    it("internalError should return 500 error", () => {
      const error = CustomError.internalError();
      expect(error.statusCode).toBe(500);
      expect(error.errorCode).toBe("INTERNAL_ERROR");
    });

    it("unauthorized (deprecated) should call unauthenticated", () => {
      const error = CustomError.unauthorized("Please login");
      expect(error.statusCode).toBe(401);
      expect(error.errorCode).toBe("UNAUTHENTICATED");
      expect(error.message).toBe("Please login");
    });
  });

  describe("toJSON", () => {
    it("should convert error to JSON format", () => {
      const error = CustomError.badRequest("Test");
      const json = error.toJSON();
      expect(json).toEqual({
        success: false,
        message: "Test",
        errorCode: "BAD_REQUEST",
        statusCode: 400,
      });
    });
  });
});
