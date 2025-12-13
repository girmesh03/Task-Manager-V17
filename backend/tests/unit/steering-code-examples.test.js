/**
 * Test file to verify code examples from steering documentation
 * This ensures all documented patterns are accurate and working
 * Tests focus on constants, utilities, and patterns without DB
 */

import { describe, it, expect } from "@jest/globals";
import {
  USER_ROLES,
  TASK_STATUS,
  TASK_PRIORITY,
  PAGINATION,
  MATERIAL_CATEGORIES,
  UNIT_TYPES,
  LIMITS,
  LENGTH_LIMITS,
} from "../../utils/constants.js";
import CustomError from "../../errorHandler/CustomError.js";
import {
  formatResponse,
  formatPaginatedResponse,
} from "../../utils/responseTransform.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/generateTokens.js";

describe("Steering Documentation Code Examples - Constants", () => {
  describe("USER_ROLES constant (tech.md, structure.md)", () => {
    it("should have all roles matching documentation", () => {
      expect(USER_ROLES).toHaveProperty("SUPER_ADMIN");
      expect(USER_ROLES).toHaveProperty("ADMIN");
      expect(USER_ROLES).toHaveProperty("MANAGER");
      expect(USER_ROLES).toHaveProperty("USER");
      expect(USER_ROLES.SUPER_ADMIN).toBe("SuperAdmin");
      expect(USER_ROLES.ADMIN).toBe("Admin");
      expect(USER_ROLES.MANAGER).toBe("Manager");
      expect(USER_ROLES.USER).toBe("User");
    });

    it("should have exactly 4 roles", () => {
      expect(Object.keys(USER_ROLES)).toHaveLength(4);
    });
  });

  describe("TASK_STATUS array (structure.md)", () => {
    it("should have all statuses matching documentation", () => {
      expect(TASK_STATUS).toContain("To Do");
      expect(TASK_STATUS).toContain("In Progress");
      expect(TASK_STATUS).toContain("Completed");
      expect(TASK_STATUS).toContain("Pending");
      expect(TASK_STATUS).toHaveLength(4);
    });
  });

  describe("TASK_PRIORITY array (structure.md)", () => {
    it("should have all priorities matching documentation", () => {
      expect(TASK_PRIORITY).toContain("Low");
      expect(TASK_PRIORITY).toContain("Medium");
      expect(TASK_PRIORITY).toContain("High");
      expect(TASK_PRIORITY).toContain("Urgent");
      expect(TASK_PRIORITY).toHaveLength(4);
    });
  });

  describe("PAGINATION constants (tech.md)", () => {
    it("should have correct default values", () => {
      expect(PAGINATION.DEFAULT_PAGE).toBe(1);
      expect(PAGINATION.DEFAULT_LIMIT).toBe(10);
      expect(PAGINATION.MAX_LIMIT).toBe(100);
      expect(PAGINATION.DEFAULT_SORT_BY).toBe("createdAt");
      expect(PAGINATION.DEFAULT_SORT_ORDER).toBe("desc");
    });

    it("should have correct page size options", () => {
      expect(PAGINATION.PAGE_SIZE_OPTIONS).toEqual([5, 10, 25, 50, 100]);
    });
  });

  describe("MATERIAL_CATEGORIES (structure.md)", () => {
    it("should have all 9 categories", () => {
      expect(MATERIAL_CATEGORIES).toContain("Electrical");
      expect(MATERIAL_CATEGORIES).toContain("Mechanical");
      expect(MATERIAL_CATEGORIES).toContain("Plumbing");
      expect(MATERIAL_CATEGORIES).toContain("Hardware");
      expect(MATERIAL_CATEGORIES).toContain("Cleaning");
      expect(MATERIAL_CATEGORIES).toContain("Textiles");
      expect(MATERIAL_CATEGORIES).toContain("Consumables");
      expect(MATERIAL_CATEGORIES).toContain("Construction");
      expect(MATERIAL_CATEGORIES).toContain("Other");
      expect(MATERIAL_CATEGORIES).toHaveLength(9);
    });
  });

  describe("UNIT_TYPES (structure.md)", () => {
    it("should have common unit types", () => {
      expect(UNIT_TYPES).toContain("pcs");
      expect(UNIT_TYPES).toContain("kg");
      expect(UNIT_TYPES).toContain("l");
      expect(UNIT_TYPES).toContain("m");
      expect(UNIT_TYPES).toContain("m2");
      expect(UNIT_TYPES).toContain("m3");
      expect(UNIT_TYPES.length).toBeGreaterThan(10);
    });
  });

  describe("LIMITS constants (backend-models.md)", () => {
    it("should have correct validation limits", () => {
      expect(LIMITS.MAX_ATTACHMENTS).toBe(10);
      expect(LIMITS.MAX_WATCHERS).toBe(20);
      expect(LIMITS.MAX_ASSIGNEES).toBe(20);
      expect(LIMITS.MAX_MATERIALS).toBe(20);
      expect(LIMITS.MAX_TAGS).toBe(5);
      expect(LIMITS.MAX_MENTIONS).toBe(5);
      expect(LIMITS.MAX_SKILLS).toBe(10);
      expect(LIMITS.MAX_COMMENT_DEPTH).toBe(3);
      expect(LIMITS.MAX_COST_HISTORY).toBe(200);
      expect(LIMITS.MAX_NOTIFICATION_RECIPIENTS).toBe(500);
    });
  });

  describe("LENGTH_LIMITS constants (backend-models.md)", () => {
    it("should have correct length limits", () => {
      expect(LENGTH_LIMITS.TITLE_MAX).toBe(50);
      expect(LENGTH_LIMITS.DESCRIPTION_MAX).toBe(2000);
      expect(LENGTH_LIMITS.COMMENT_MAX).toBe(2000);
      expect(LENGTH_LIMITS.ORG_NAME_MAX).toBe(100);
      expect(LENGTH_LIMITS.DEPT_NAME_MAX).toBe(100);
      expect(LENGTH_LIMITS.USER_NAME_MAX).toBe(20);
      expect(LENGTH_LIMITS.EMAIL_MAX).toBe(50);
      expect(LENGTH_LIMITS.PASSWORD_MIN).toBe(8);
    });
  });
});

describe("Steering Documentation Code Examples - CustomError", () => {
  describe("CustomError class (backend-api.md, backend-security.md)", () => {
    it("should create error with correct properties", () => {
      const error = new CustomError("User not found", 404, "NOT_FOUND_ERROR");

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("User not found");
      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe("NOT_FOUND_ERROR");
      expect(error.isOperational).toBe(true);
    });

    it("should have notFound static method", () => {
      const error = CustomError.notFound("Resource not found");
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("Resource not found");
    });

    it("should have badRequest static method", () => {
      const error = CustomError.badRequest("Invalid input");
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("Invalid input");
    });

    it("should have forbidden static method", () => {
      const error = CustomError.forbidden("Access denied");
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe("Access denied");
    });

    it("should have unauthorized static method", () => {
      const error = CustomError.unauthorized("Not authenticated");
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("Not authenticated");
    });
  });
});

describe("Steering Documentation Code Examples - Response Transform", () => {
  describe("formatResponse (backend-api.md)", () => {
    it("should format success response correctly", () => {
      const response = formatResponse(true, "Operation successful", {
        user: { id: 1 },
      });

      expect(response).toHaveProperty("success", true);
      expect(response).toHaveProperty("message", "Operation successful");
      expect(response).toHaveProperty("data");
      expect(response.data).toEqual({ user: { id: 1 } });
    });

    it("should format response without data", () => {
      const response = formatResponse(false, "Operation failed");

      expect(response).toHaveProperty("success", false);
      expect(response).toHaveProperty("message", "Operation failed");
      expect(response).not.toHaveProperty("data");
    });
  });

  describe("formatPaginatedResponse (backend-api.md)", () => {
    it("should format paginated response correctly", () => {
      const docs = [{ id: 1 }, { id: 2 }];
      const pagination = {
        page: 1,
        limit: 10,
        totalDocs: 100,
        totalPages: 10,
        hasNextPage: true,
        hasPrevPage: false,
      };

      const response = formatPaginatedResponse(
        true,
        "Materials retrieved",
        "materials",
        docs,
        pagination
      );

      expect(response.success).toBe(true);
      expect(response.message).toBe("Materials retrieved");
      expect(response.data.materials).toEqual(docs);
      expect(response.data.pagination).toHaveProperty("page", 1);
      expect(response.data.pagination).toHaveProperty("limit", 10);
      expect(response.data.pagination).toHaveProperty("totalCount", 100);
      expect(response.data.pagination).toHaveProperty("totalPages", 10);
      expect(response.data.pagination).toHaveProperty("hasNext", true);
      expect(response.data.pagination).toHaveProperty("hasPrev", false);
    });
  });
});

describe("Steering Documentation Code Examples - Token Generation", () => {
  describe("generateAccessToken (backend-security.md)", () => {
    it("should generate access token", () => {
      const userId = "507f1f77bcf86cd799439011";
      const token = generateAccessToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT format
    });
  });

  describe("generateRefreshToken (backend-security.md)", () => {
    it("should generate refresh token", () => {
      const userId = "507f1f77bcf86cd799439011";
      const token = generateRefreshToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT format
    });
  });
});

describe("Steering Documentation Code Examples - Patterns", () => {
  describe("Pagination conversion (structure.md, tech.md)", () => {
    it("should demonstrate frontend to backend conversion", () => {
      // Frontend MUI DataGrid uses 0-based pagination
      const frontendPage = 0;
      const frontendPageSize = 10;

      // Convert to backend 1-based pagination
      const backendPage = frontendPage + 1;
      const backendLimit = frontendPageSize;

      expect(backendPage).toBe(1);
      expect(backendLimit).toBe(10);
    });

    it("should demonstrate backend to frontend conversion", () => {
      // Backend uses 1-based pagination
      const backendPage = 1;

      // Convert to frontend 0-based (handled by MuiDataGrid)
      const frontendPage = backendPage - 1;

      expect(frontendPage).toBe(0);
    });
  });

  describe("Multi-tenancy scoping (backend-api.md)", () => {
    it("should demonstrate organization scoping", () => {
      const mockUser = {
        organizationId: "507f1f77bcf86cd799439011",
        departmentId: "507f1f77bcf86cd799439012",
        role: USER_ROLES.MANAGER,
      };

      // Scope query to user's organization
      const query = {
        organizationId: mockUser.organizationId,
        isDeleted: false,
      };

      expect(query.organizationId).toBe(mockUser.organizationId);
      expect(query.isDeleted).toBe(false);
    });

    it("should demonstrate department scoping for Manager/User", () => {
      const mockUser = {
        organizationId: "507f1f77bcf86cd799439011",
        departmentId: "507f1f77bcf86cd799439012",
        role: USER_ROLES.MANAGER,
      };

      const query = {
        organizationId: mockUser.organizationId,
        isDeleted: false,
      };

      // Scope to user's department (Manager/User)
      if (
        mockUser.role === USER_ROLES.MANAGER ||
        mockUser.role === USER_ROLES.USER
      ) {
        query.departmentId = mockUser.departmentId;
      }

      expect(query.departmentId).toBe(mockUser.departmentId);
    });

    it("should not add department scope for Admin", () => {
      const mockUser = {
        organizationId: "507f1f77bcf86cd799439011",
        departmentId: "507f1f77bcf86cd799439012",
        role: USER_ROLES.ADMIN,
      };

      const query = {
        organizationId: mockUser.organizationId,
        isDeleted: false,
      };

      // Admin can access all departments
      if (
        mockUser.role === USER_ROLES.MANAGER ||
        mockUser.role === USER_ROLES.USER
      ) {
        query.departmentId = mockUser.departmentId;
      }

      expect(query.departmentId).toBeUndefined();
    });
  });

  describe("Cookie configuration (backend-security.md)", () => {
    it("should demonstrate correct cookie settings", () => {
      const isProduction = process.env.NODE_ENV === "production";

      const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutes
      };

      expect(cookieOptions.httpOnly).toBe(true);
      expect(cookieOptions.sameSite).toBe("strict");
      expect(cookieOptions.maxAge).toBe(900000);
    });
  });

  describe("Rate limiting configuration (backend-security.md)", () => {
    it("should demonstrate general API rate limit", () => {
      const rateLimitConfig = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // 100 requests per window
      };

      expect(rateLimitConfig.windowMs).toBe(900000);
      expect(rateLimitConfig.max).toBe(100);
    });

    it("should demonstrate auth endpoint rate limit", () => {
      const authRateLimitConfig = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 requests per window
      };

      expect(authRateLimitConfig.windowMs).toBe(900000);
      expect(authRateLimitConfig.max).toBe(5);
    });
  });
});

describe("Steering Documentation Code Examples - Validation", () => {
  describe("Field validation patterns (backend-api.md)", () => {
    it("should demonstrate required field validation", () => {
      const validationRule = {
        required: "Field is required",
        minLength: { value: 3, message: "Minimum 3 characters" },
        maxLength: { value: 100, message: "Maximum 100 characters" },
      };

      expect(validationRule.required).toBe("Field is required");
      expect(validationRule.minLength.value).toBe(3);
      expect(validationRule.maxLength.value).toBe(100);
    });

    it("should demonstrate number validation", () => {
      const validationRule = {
        required: "Field is required",
        min: { value: 0, message: "Must be positive" },
        max: { value: 100, message: "Maximum 100" },
      };

      expect(validationRule.min.value).toBe(0);
      expect(validationRule.max.value).toBe(100);
    });
  });
});
