// backend/tests/unit/userModel.test.js
// Unit tests for User model configuration and behaviour
// Requirements covered (partial): 32, 46, 55, 101-105, 213-224

import { describe, it, expect, beforeAll } from "@jest/globals";
import { User } from "../../models/index.js";

describe("User Model", () => {
  beforeAll(async () => {
    // Ensure indexes are in sync before running uniqueness-related tests
    if (User && typeof User.syncIndexes === "function") {
      await User.syncIndexes();
    }
  });

  it("should hash password before save and hide it from JSON output", async () => {
    const organization = await global.testUtils.createTestOrganization();
    const department = await global.testUtils.createTestDepartment(
      organization._id
    );

    const plainPassword = "StrongPass123!";

    const user = await User.create({
      firstName: "John",
      lastName: "Doe",
      position: "QA Engineer",
      email: "john.doe@example.com",
      password: plainPassword,
      organization: organization._id,
      department: department._id,
      joinedAt: new Date(),
    });

    const userWithPassword = await User.findById(user._id).select("+password");

    expect(userWithPassword).not.toBeNull();
    expect(userWithPassword.password).toBeDefined();
    expect(userWithPassword.password).not.toBe(plainPassword);
    expect(userWithPassword.password.startsWith("$2")).toBe(true);

    const isMatch = await userWithPassword.comparePassword(plainPassword);
    expect(isMatch).toBe(true);

    const json = userWithPassword.toJSON();
    expect(json.password).toBeUndefined();
  });

  it("should apply default values for status and isHod", async () => {
    const organization = await global.testUtils.createTestOrganization();
    const department = await global.testUtils.createTestDepartment(
      organization._id
    );

    const user = await User.create({
      firstName: "Alice",
      lastName: "Smith",
      position: "Developer",
      email: "alice.smith@example.com",
      password: "StrongPass123!",
      organization: organization._id,
      department: department._id,
      joinedAt: new Date(),
    });

    expect(user.status).toBe("offline");
    expect(user.isHod).toBe(false);
  });

  it("should enforce unique Head of Department per department when isHod is true", async () => {
    const organization = await global.testUtils.createTestOrganization();
    const department = await global.testUtils.createTestDepartment(
      organization._id
    );

    await User.create({
      firstName: "HOD",
      lastName: "One",
      position: "Head of Department",
      email: "hod.one@example.com",
      password: "StrongPass123!",
      organization: organization._id,
      department: department._id,
      role: "Admin",
      joinedAt: new Date(),
      isHod: true,
    });

    await expect(
      User.create({
        firstName: "HOD",
        lastName: "Two",
        position: "Head of Department",
        email: "hod.two@example.com",
        password: "StrongPass123!",
        organization: organization._id,
        department: department._id,
        role: "SuperAdmin",
        joinedAt: new Date(),
        isHod: true,
      })
    ).rejects.toThrow();
  });
});
