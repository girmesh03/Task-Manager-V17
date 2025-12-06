/**
 * Unit Tests for Helper Utilities
 */

import {
  buildPaginationResponse,
  parsePaginationParams,
  buildQueryFilter,
  buildSearchQuery,
  sanitizeObject,
  isValidEmail,
  isValidPhone,
  formatPhoneToE164,
  generateEmployeeId,
  isValidObjectId,
  calculatePercentage,
} from "../utils/helpers.js";

describe("Helper Utilities", () => {
  describe("parsePaginationParams", () => {
    it("should use default values when no query provided", () => {
      const result = parsePaginationParams({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.sortBy).toBe("createdAt");
      expect(result.sortOrder).toBe(-1);
    });

    it("should parse valid pagination params", () => {
      const query = { page: "2", limit: "25", sortBy: "name", sortOrder: "asc" };
      const result = parsePaginationParams(query);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(25);
      expect(result.sortBy).toBe("name");
      expect(result.sortOrder).toBe(1);
    });

    it("should enforce maximum limit", () => {
      const query = { limit: "200" };
      const result = parsePaginationParams(query);
      expect(result.limit).toBe(100); // MAX_LIMIT
    });

    it("should enforce minimum page of 1", () => {
      const query = { page: "-5" };
      const result = parsePaginationParams(query);
      expect(result.page).toBe(1);
    });
  });

  describe("buildQueryFilter", () => {
    it("should exclude pagination fields", () => {
      const query = {
        page: "1",
        limit: "10",
        sortBy: "name",
        status: "active",
        role: "Admin",
      };
      const result = buildQueryFilter(query);
      expect(result).toEqual({ status: "active", role: "Admin" });
      expect(result.page).toBeUndefined();
      expect(result.limit).toBeUndefined();
    });

    it("should exclude custom fields", () => {
      const query = { name: "John", email: "john@example.com", password: "secret" };
      const result = buildQueryFilter(query, ["password"]);
      expect(result).toEqual({ name: "John", email: "john@example.com" });
      expect(result.password).toBeUndefined();
    });
  });

  describe("buildSearchQuery", () => {
    it("should build regex OR query for multiple fields", () => {
      const result = buildSearchQuery("test", ["name", "email"]);
      expect(result.$or).toHaveLength(2);
      expect(result.$or[0].name).toEqual({ $regex: "test", $options: "i" });
      expect(result.$or[1].email).toEqual({ $regex: "test", $options: "i" });
    });

    it("should return empty object when no search term", () => {
      const result = buildSearchQuery("", ["name"]);
      expect(result).toEqual({});
    });

    it("should return empty object when no fields", () => {
      const result = buildSearchQuery("test", []);
      expect(result).toEqual({});
    });
  });

  describe("sanitizeObject", () => {
    it("should remove null and undefined values", () => {
      const obj = { a: 1, b: null, c: undefined, d: "test", e: 0 };
      const result = sanitizeObject(obj);
      expect(result).toEqual({ a: 1, d: "test", e: 0 });
    });
  });

  describe("isValidEmail", () => {
    it("should validate correct email formats", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
    });

    it("should reject invalid email formats", () => {
      expect(isValidEmail("invalid")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("test@")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });
  });

  describe("isValidPhone", () => {
    it("should validate Ethiopian phone numbers", () => {
      expect(isValidPhone("0912345678")).toBe(true);
      expect(isValidPhone("+251912345678")).toBe(true);
    });

    it("should reject invalid phone numbers", () => {
      expect(isValidPhone("12345")).toBe(false);
      expect(isValidPhone("091234567")).toBe(false); // too short
      expect(isValidPhone("09123456789")).toBe(false); // too long
    });
  });

  describe("formatPhoneToE164", () => {
    it("should format Ethiopian phone to E.164", () => {
      expect(formatPhoneToE164("0912345678")).toBe("+251912345678");
      expect(formatPhoneToE164("251912345678")).toBe("+251912345678");
    });

    it("should return null for empty input", () => {
      expect(formatPhoneToE164("")).toBe(null);
      expect(formatPhoneToE164(null)).toBe(null);
    });
  });

  describe("generateEmployeeId", () => {
    it("should generate 4-digit number between 1000-9999", () => {
      const id = generateEmployeeId();
      expect(id).toBeGreaterThanOrEqual(1000);
      expect(id).toBeLessThan(10000);
    });
  });

  describe("isValidObjectId", () => {
    it("should validate MongoDB ObjectId format", () => {
      expect(isValidObjectId("507f1f77bcf86cd799439011")).toBe(true);
      expect(isValidObjectId("507f191e810c19729de860ea")).toBe(true);
    });

    it("should reject invalid ObjectId format", () => {
      expect(isValidObjectId("invalid")).toBe(false);
      expect(isValidObjectId("507f1f77bcf86cd79943901")).toBe(false); // too short
      expect(isValidObjectId("507f1f77bcf86cd799439011z")).toBe(false); // invalid char
    });
  });

  describe("calculatePercentage", () => {
    it("should calculate correct percentage", () => {
      expect(calculatePercentage(50, 100)).toBe(50);
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(1, 3, 2)).toBe(33.33);
    });

    it("should return 0 when total is 0", () => {
      expect(calculatePercentage(50, 0)).toBe(0);
    });
  });
});
