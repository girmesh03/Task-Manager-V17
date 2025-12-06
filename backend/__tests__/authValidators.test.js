/**
 * Unit Tests for Auth Validators
 */

import { validationResult } from "express-validator";
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} from "../middlewares/validators/authValidators.js";

// Helper to run validators
const runValidators = async (validators, req) => {
  for (const validator of validators) {
    await validator.run(req);
  }
  return validationResult(req);
};

// Mock request object
const createMockReq = (body = {}) => ({
  body,
});

describe("Auth Validators", () => {
  describe("registerValidation", () => {
    const validData = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "Password123",
      phone: "0912345678",
      position: "Developer",
      organizationName: "Test Org",
      organizationEmail: "org@example.com",
      organizationPhone: "+251912345678",
      industry: "Technology",
      address: "123 Main St",
      logoUrl: "https://example.com/logo.png",
      departmentName: "IT Department",
      departmentDescription: "Tech department",
    };

    it("should pass with valid registration data", async () => {
      const req = createMockReq(validData);
      const errors = await runValidators(registerValidation, req);

      expect(errors.isEmpty()).toBe(true);
    });

    it("should fail without required fields", async () => {
      const req = createMockReq({});
      const errors = await runValidators(registerValidation, req);

      expect(errors.isEmpty()).toBe(false);
      const errorFields = errors.array().map((e) => e.path);
      expect(errorFields).toContain("firstName");
      expect(errorFields).toContain("lastName");
      expect(errorFields).toContain("email");
      expect(errorFields).toContain("password");
    });

    it("should fail with invalid email", async () => {
      const req = createMockReq({
        ...validData,
        email: "invalid-email",
      });
      const errors = await runValidators(registerValidation, req);

      expect(errors.isEmpty()).toBe(false);
      expect(errors.array().some((e) => e.path === "email")).toBe(true);
    });

    it("should fail with weak password", async () => {
      const req = createMockReq({
        ...validData,
        password: "weak",
      });
      const errors = await runValidators(registerValidation, req);

      expect(errors.isEmpty()).toBe(false);
      expect(errors.array().some((e) => e.path === "password")).toBe(true);
    });

    it("should fail with invalid phone format", async () => {
      const req = createMockReq({
        ...validData,
        phone: "123", // Invalid
      });
      const errors = await runValidators(registerValidation, req);

      expect(errors.isEmpty()).toBe(false);
      expect(errors.array().some((e) => e.path === "phone")).toBe(true);
    });

    it("should pass with valid Ethiopian phone formats", async () => {
      const req1 = createMockReq({
        ...validData,
        phone: "0912345678",
      });
      const errors1 = await runValidators(registerValidation, req1);
      expect(errors1.array().some((e) => e.path === "phone")).toBe(false);

      const req2 = createMockReq({
        ...validData,
        phone: "+251912345678",
      });
      const errors2 = await runValidators(registerValidation, req2);
      expect(errors2.array().some((e) => e.path === "phone")).toBe(false);
    });

    it("should fail with invalid industry", async () => {
      const req = createMockReq({
        ...validData,
        industry: "InvalidIndustry",
      });
      const errors = await runValidators(registerValidation, req);

      expect(errors.isEmpty()).toBe(false);
      expect(errors.array().some((e) => e.path === "industry")).toBe(true);
    });

    it("should trim and normalize email", async () => {
      const req = createMockReq({
        ...validData,
        email: "  JOHN@EXAMPLE.COM  ",
      });
      await runValidators(registerValidation, req);

      expect(req.body.email).toBe("john@example.com");
    });
  });

  describe("loginValidation", () => {
    it("should pass with valid login data", async () => {
      const req = createMockReq({
        email: "test@example.com",
        password: "password123",
      });
      const errors = await runValidators(loginValidation, req);

      expect(errors.isEmpty()).toBe(true);
    });

    it("should fail without email", async () => {
      const req = createMockReq({
        password: "password123",
      });
      const errors = await runValidators(loginValidation, req);

      expect(errors.isEmpty()).toBe(false);
      expect(errors.array().some((e) => e.path === "email")).toBe(true);
    });

    it("should fail without password", async () => {
      const req = createMockReq({
        email: "test@example.com",
      });
      const errors = await runValidators(loginValidation, req);

      expect(errors.isEmpty()).toBe(false);
      expect(errors.array().some((e) => e.path === "password")).toBe(true);
    });

    it("should fail with invalid email format", async () => {
      const req = createMockReq({
        email: "not-an-email",
        password: "password123",
      });
      const errors = await runValidators(loginValidation, req);

      expect(errors.isEmpty()).toBe(false);
      expect(errors.array().some((e) => e.path === "email")).toBe(true);
    });
  });

  describe("forgotPasswordValidation", () => {
    it("should pass with valid email", async () => {
      const req = createMockReq({
        email: "test@example.com",
      });
      const errors = await runValidators(forgotPasswordValidation, req);

      expect(errors.isEmpty()).toBe(true);
    });

    it("should fail without email", async () => {
      const req = createMockReq({});
      const errors = await runValidators(forgotPasswordValidation, req);

      expect(errors.isEmpty()).toBe(false);
      expect(errors.array().some((e) => e.path === "email")).toBe(true);
    });
  });

  describe("resetPasswordValidation", () => {
    it("should pass with valid reset data", async () => {
      const req = createMockReq({
        resetToken: "valid-reset-token-123",
        newPassword: "NewPassword123",
      });
      const errors = await runValidators(resetPasswordValidation, req);

      expect(errors.isEmpty()).toBe(true);
    });

    it("should fail without reset token", async () => {
      const req = createMockReq({
        newPassword: "NewPassword123",
      });
      const errors = await runValidators(resetPasswordValidation, req);

      expect(errors.isEmpty()).toBe(false);
      expect(errors.array().some((e) => e.path === "resetToken")).toBe(true);
    });

    it("should fail with weak new password", async () => {
      const req = createMockReq({
        resetToken: "valid-token",
        newPassword: "weak",
      });
      const errors = await runValidators(resetPasswordValidation, req);

      expect(errors.isEmpty()).toBe(false);
      expect(errors.array().some((e) => e.path === "newPassword")).toBe(true);
    });

    it("should require uppercase, lowercase, and number in password", async () => {
      const req1 = createMockReq({
        resetToken: "token",
        newPassword: "lowercase123", // No uppercase
      });
      const errors1 = await runValidators(resetPasswordValidation, req1);
      expect(errors1.isEmpty()).toBe(false);

      const req2 = createMockReq({
        resetToken: "token",
        newPassword: "UPPERCASE123", // No lowercase
      });
      const errors2 = await runValidators(resetPasswordValidation, req2);
      expect(errors2.isEmpty()).toBe(false);

      const req3 = createMockReq({
        resetToken: "token",
        newPassword: "NoNumbers", // No number
      });
      const errors3 = await runValidators(resetPasswordValidation, req3);
      expect(errors3.isEmpty()).toBe(false);
    });
  });
});
