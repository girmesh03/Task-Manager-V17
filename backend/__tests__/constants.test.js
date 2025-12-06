/**
 * Unit Tests for Constants
 */

import {
  USER_ROLES,
  TASK_STATUS,
  TASK_PRIORITY,
  MATERIAL_CATEGORIES,
  INDUSTRIES,
  PAGINATION,
  VALIDATION_LIMITS,
  STRING_LIMITS,
  getTTLSeconds,
} from "../utils/constants.js";

describe("Constants", () => {
  describe("USER_ROLES", () => {
    it("should have all required roles", () => {
      expect(USER_ROLES.SUPER_ADMIN).toBe("SuperAdmin");
      expect(USER_ROLES.ADMIN).toBe("Admin");
      expect(USER_ROLES.MANAGER).toBe("Manager");
      expect(USER_ROLES.USER).toBe("User");
    });
  });

  describe("TASK_STATUS", () => {
    it("should have all required statuses", () => {
      expect(TASK_STATUS.TO_DO).toBe("To Do");
      expect(TASK_STATUS.IN_PROGRESS).toBe("In Progress");
      expect(TASK_STATUS.COMPLETED).toBe("Completed");
      expect(TASK_STATUS.PENDING).toBe("Pending");
    });
  });

  describe("TASK_PRIORITY", () => {
    it("should have all required priorities", () => {
      expect(TASK_PRIORITY.LOW).toBe("Low");
      expect(TASK_PRIORITY.MEDIUM).toBe("Medium");
      expect(TASK_PRIORITY.HIGH).toBe("High");
      expect(TASK_PRIORITY.URGENT).toBe("Urgent");
    });
  });

  describe("MATERIAL_CATEGORIES", () => {
    it("should have 9 categories", () => {
      expect(MATERIAL_CATEGORIES).toHaveLength(9);
      expect(MATERIAL_CATEGORIES).toContain("Electrical");
      expect(MATERIAL_CATEGORIES).toContain("Mechanical");
      expect(MATERIAL_CATEGORIES).toContain("Other");
    });
  });

  describe("INDUSTRIES", () => {
    it("should have 24 industries", () => {
      expect(INDUSTRIES).toHaveLength(24);
      expect(INDUSTRIES).toContain("Technology");
      expect(INDUSTRIES).toContain("Healthcare");
      expect(INDUSTRIES).toContain("Other");
    });
  });

  describe("PAGINATION", () => {
    it("should have correct default values", () => {
      expect(PAGINATION.DEFAULT_PAGE).toBe(1);
      expect(PAGINATION.DEFAULT_LIMIT).toBe(10);
      expect(PAGINATION.MAX_LIMIT).toBe(100);
      expect(PAGINATION.PAGE_SIZE_OPTIONS).toContain(10);
      expect(PAGINATION.PAGE_SIZE_OPTIONS).toContain(25);
      expect(PAGINATION.PAGE_SIZE_OPTIONS).toContain(50);
    });
  });

  describe("VALIDATION_LIMITS", () => {
    it("should have correct limits", () => {
      expect(VALIDATION_LIMITS.MAX_ATTACHMENTS).toBe(10);
      expect(VALIDATION_LIMITS.MAX_WATCHERS).toBe(20);
      expect(VALIDATION_LIMITS.MAX_ASSIGNEES).toBe(20);
      expect(VALIDATION_LIMITS.MAX_SKILLS).toBe(10);
      expect(VALIDATION_LIMITS.MAX_SKILL_PROFICIENCY).toBe(100);
    });
  });

  describe("STRING_LIMITS", () => {
    it("should have correct string length limits", () => {
      expect(STRING_LIMITS.TITLE_MAX).toBe(50);
      expect(STRING_LIMITS.DESCRIPTION_MAX).toBe(2000);
      expect(STRING_LIMITS.USER_PASSWORD_MIN).toBe(8);
      expect(STRING_LIMITS.USER_EMPLOYEE_ID_MIN).toBe(1000);
      expect(STRING_LIMITS.USER_EMPLOYEE_ID_MAX).toBe(9999);
    });
  });

  describe("getTTLSeconds", () => {
    it("should convert days to seconds", () => {
      expect(getTTLSeconds(1)).toBe(86400); // 1 day = 86400 seconds
      expect(getTTLSeconds(7)).toBe(604800); // 7 days
      expect(getTTLSeconds(30)).toBe(2592000); // 30 days
    });

    it("should return null for null input", () => {
      expect(getTTLSeconds(null)).toBe(null);
      expect(getTTLSeconds(undefined)).toBe(null);
    });
  });
});
