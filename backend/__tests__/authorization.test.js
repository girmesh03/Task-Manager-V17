/**
 * Unit Tests for Authorization Middleware
 */

import authorize, {
  checkResourceAccess,
  buildAuthFilter,
  requireRole,
  requirePlatformUser,
} from "../middlewares/authorization.js";
import CustomError from "../errorHandler/CustomError.js";
import { USER_ROLES } from "../utils/constants.js";

describe("Authorization Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: {
        userId: "507f1f77bcf86cd799439011",
        email: "admin@example.com",
        role: USER_ROLES.ADMIN,
        organization: "507f1f77bcf86cd799439012",
        department: "507f1f77bcf86cd799439013",
        isPlatformUser: false,
      },
    };
    res = {};
    next = () => {};
  });

  describe("authorize", () => {
    it("should grant access for valid role and operation", async () => {
      const middleware = authorize("Task", "create");
      await middleware(req, res, next);

      expect(req.authorization).toBeDefined();
      expect(req.authorization.resource).toBe("Task");
      expect(req.authorization.operation).toBe("create");
    });

    it("should deny access for invalid resource", async () => {
      const middleware = authorize("InvalidResource", "read");

      await expect(middleware(req, res, next)).rejects.toThrow(CustomError);
      await expect(middleware(req, res, next)).rejects.toThrow("does not have access");
    });

    it("should deny access when role cannot perform operation", async () => {
      req.user.role = USER_ROLES.USER;
      const middleware = authorize("Organization", "create");

      await expect(middleware(req, res, next)).rejects.toThrow(CustomError);
      await expect(middleware(req, res, next)).rejects.toThrow("cannot perform");
    });

    it("should attach authorization info to request", async () => {
      const middleware = authorize("User", "read");
      await middleware(req, res, next);

      expect(req.authorization).toMatchObject({
        resource: "User",
        operation: "read",
        role: USER_ROLES.ADMIN,
        organization: req.user.organization,
        department: req.user.department,
        isPlatformUser: false,
      });
      expect(req.authorization.allowedScopes).toBeDefined();
    });
  });

  describe("checkResourceAccess", () => {
    it("should allow platform user with crossOrg to access any resource", () => {
      req.user.isPlatformUser = true;
      req.authorization = {
        allowedScopes: ["crossOrg"],
        organization: req.user.organization,
        department: req.user.department,
        isPlatformUser: true,
      };

      const resourceDoc = {
        _id: "507f1f77bcf86cd799439020",
        organization: "different-org-id",
        department: "different-dept-id",
      };

      expect(() => checkResourceAccess(resourceDoc, req)).not.toThrow();
    });

    it("should deny access to resource from different organization", () => {
      req.authorization = {
        allowedScopes: ["ownDept"],
        organization: req.user.organization,
        department: req.user.department,
        isPlatformUser: false,
      };

      const resourceDoc = {
        organization: "different-org-id",
        department: req.user.department,
      };

      expect(() => checkResourceAccess(resourceDoc, req)).toThrow(CustomError);
      expect(() => checkResourceAccess(resourceDoc, req)).toThrow("other organizations");
    });

    it("should allow crossDept scope to access any department", () => {
      req.authorization = {
        allowedScopes: ["crossDept"],
        organization: req.user.organization,
        department: req.user.department,
        isPlatformUser: false,
      };

      const resourceDoc = {
        organization: req.user.organization,
        department: "different-dept-id",
      };

      expect(() => checkResourceAccess(resourceDoc, req)).not.toThrow();
    });

    it("should deny ownDept scope access to different department", () => {
      req.authorization = {
        allowedScopes: ["ownDept"],
        organization: req.user.organization,
        department: req.user.department,
        isPlatformUser: false,
      };

      const resourceDoc = {
        organization: req.user.organization,
        department: "different-dept-id",
      };

      expect(() => checkResourceAccess(resourceDoc, req)).toThrow(CustomError);
      expect(() => checkResourceAccess(resourceDoc, req)).toThrow("other departments");
    });

    it("should allow ownDept scope to access same department", () => {
      req.authorization = {
        allowedScopes: ["ownDept"],
        organization: req.user.organization,
        department: req.user.department,
        isPlatformUser: false,
      };

      const resourceDoc = {
        organization: req.user.organization,
        department: req.user.department,
      };

      expect(() => checkResourceAccess(resourceDoc, req)).not.toThrow();
    });

    it("should allow own scope to access own resource", () => {
      req.authorization = {
        allowedScopes: ["own"],
        organization: req.user.organization,
        department: req.user.department,
        isPlatformUser: false,
      };

      const resourceDoc = {
        _id: req.user.userId,
        organization: req.user.organization,
        department: req.user.department,
        createdBy: req.user.userId,
      };

      expect(() => checkResourceAccess(resourceDoc, req)).not.toThrow();
    });
  });

  describe("buildAuthFilter", () => {
    it("should return empty filter for platform user with crossOrg", () => {
      req.user.isPlatformUser = true;
      req.authorization = {
        allowedScopes: ["crossOrg"],
        organization: req.user.organization,
        department: req.user.department,
        isPlatformUser: true,
      };

      const filter = buildAuthFilter(req);
      expect(filter).toEqual({});
    });

    it("should filter by organization for crossDept scope", () => {
      req.authorization = {
        allowedScopes: ["crossDept"],
        organization: req.user.organization,
        department: req.user.department,
        isPlatformUser: false,
      };

      const filter = buildAuthFilter(req);
      expect(filter).toEqual({
        organization: req.user.organization,
      });
    });

    it("should filter by organization and department for ownDept scope", () => {
      req.authorization = {
        allowedScopes: ["ownDept"],
        organization: req.user.organization,
        department: req.user.department,
        isPlatformUser: false,
      };

      const filter = buildAuthFilter(req);
      expect(filter).toEqual({
        organization: req.user.organization,
        department: req.user.department,
      });
    });

    it("should filter by createdBy for own scope", () => {
      req.authorization = {
        allowedScopes: ["own"],
        organization: req.user.organization,
        department: req.user.department,
        isPlatformUser: false,
      };

      const filter = buildAuthFilter(req);
      expect(filter).toEqual({
        organization: req.user.organization,
        createdBy: req.user.userId,
      });
    });
  });

  describe("requireRole", () => {
    it("should allow access for matching role", async () => {
      const middleware = requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN);
      await middleware(req, res, next);

      // Just check it doesn't throw
      expect(true).toBe(true);
    });

    it("should deny access for non-matching role", async () => {
      req.user.role = USER_ROLES.USER;
      const middleware = requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN);

      await expect(middleware(req, res, next)).rejects.toThrow(CustomError);
      await expect(middleware(req, res, next)).rejects.toThrow("requires one of the following roles");
    });

    it("should throw error if no user", async () => {
      req.user = null;
      const middleware = requireRole(USER_ROLES.ADMIN);

      await expect(middleware(req, res, next)).rejects.toThrow("Authentication required");
    });
  });

  describe("requirePlatformUser", () => {
    it("should allow access for platform user", async () => {
      req.user.isPlatformUser = true;
      const middleware = requirePlatformUser();
      await middleware(req, res, next);

      // Just check it doesn't throw
      expect(true).toBe(true);
    });

    it("should deny access for non-platform user", async () => {
      req.user.isPlatformUser = false;
      const middleware = requirePlatformUser();

      await expect(middleware(req, res, next)).rejects.toThrow(CustomError);
      await expect(middleware(req, res, next)).rejects.toThrow("platform administrators");
    });
  });
});
