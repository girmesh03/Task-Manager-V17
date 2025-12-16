import { jest } from "@jest/globals";
import {
  hasPermission,
  getAllowedOperations,
  authorizationMatrix,
} from "../../utils/authorizationMatrix.js";

describe("Authorization Matrix Utils", () => {
  const REGULAR_ORG_ID = "regular-org-id";

  const createMockUser = (role, orgId, isPlatformUser = false) => ({
    _id: "user-id",
    role,
    organization: { _id: orgId },
    isPlatformUser, // Now explicitly passing this property
  });

  describe("hasPermission", () => {
    it("should deny permission if user is undefined", () => {
      expect(hasPermission(null, "Organization", "connected")).toBe(false);
    });

    it("should deny permission if resource does not exist", () => {
      const user = createMockUser("SuperAdmin", REGULAR_ORG_ID);
      expect(hasPermission(user, "NonExistentResource", "read")).toBe(false);
    });

    it("should allow Platform SuperAdmin to read cross-org Organization", () => {
      // Mocking a platform user by setting isPlatformUser: true
      const user = createMockUser("SuperAdmin", REGULAR_ORG_ID, true);
      expect(hasPermission(user, "Organization", "read")).toBe(true);
    });

    // THE FIX VERIFICATION
    it("should allow Platform SuperAdmin to update cross-org Organization", () => {
      const user = createMockUser("SuperAdmin", REGULAR_ORG_ID, true);
      expect(hasPermission(user, "Organization", "update")).toBe(true);
    });

    it("should allow Platform SuperAdmin to delete cross-org Organization", () => {
      const user = createMockUser("SuperAdmin", REGULAR_ORG_ID, true);
      expect(hasPermission(user, "Organization", "delete")).toBe(true);
    });

    it("should allow Regular SuperAdmin to update Organization (via own scope)", () => {
      // Regular user (isPlatformUser: false)
      const user = createMockUser("SuperAdmin", REGULAR_ORG_ID, false);
      // Returns true because they have 'own' scope permission, even if strict cross-org is denied
      expect(hasPermission(user, "Organization", "update")).toBe(true);
    });

    it("should allow SuperAdmin to read own Organization", () => {
      const user = createMockUser("SuperAdmin", REGULAR_ORG_ID);
      expect(hasPermission(user, "Organization", "read", "own")).toBe(true);
    });

    it("should allow Department SuperAdmin to read ownDept Department", () => {
      const user = createMockUser("SuperAdmin", REGULAR_ORG_ID);
      expect(hasPermission(user, "Department", "read", "ownDept")).toBe(true);
    });
  });

  describe("getAllowedOperations", () => {
    it("should return correct operations for Platform SuperAdmin on Organization", () => {
      const user = createMockUser("SuperAdmin", REGULAR_ORG_ID, true);
      const ops = getAllowedOperations(user, "Organization");
      expect(ops).toContain("read");
      expect(ops).toContain("update");
      expect(ops).toContain("delete");
    });

    it("should return empty array for invalid user", () => {
      expect(getAllowedOperations(null, "Organization")).toEqual([]);
    });
  });
});
