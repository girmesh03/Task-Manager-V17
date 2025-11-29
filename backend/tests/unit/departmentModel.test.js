// backend/tests/unit/departmentModel.test.js
// Unit tests for Department model configuration and behavior
// Requirements (partial): 30, 234-240

import { describe, it, expect, beforeAll } from "@jest/globals";
import mongoose from "mongoose";
import { Organization, Department, User, AssignedTask } from "../../models/index.js";

describe("Department Model", () => {
  beforeAll(async () => {
    if (Organization && typeof Organization.syncIndexes === "function") {
      await Organization.syncIndexes();
    }
    if (Department && typeof Department.syncIndexes === "function") {
      await Department.syncIndexes();
    }
    if (User && typeof User.syncIndexes === "function") {
      await User.syncIndexes();
    }
    if (AssignedTask && typeof AssignedTask.syncIndexes === "function") {
      await AssignedTask.syncIndexes();
    }
  });

  it("should enforce unique department name per organization (non-deleted)", async () => {
    const organization = await global.testUtils.createTestOrganization();

    await Department.create({
      name: "Housekeeping",
      description: "Housekeeping department",
      organization: organization._id,
    });

    await expect(
      Department.create({
        name: "Housekeeping",
        description: "Duplicate name",
        organization: organization._id,
      })
    ).rejects.toThrow();
  });

  it("should allow createdBy user from same organization", async () => {
    const { organization, department, user } =
      await global.testUtils.createTestContext();

    const dept = await Department.create({
      name: "Engineering",
      description: "Engineering department",
      organization: organization._id,
      createdBy: user._id,
    });

    expect(dept.organization.toString()).toBe(organization._id.toString());
    expect(dept.createdBy.toString()).toBe(user._id.toString());
  });

  it("should cascade soft-delete to users and tasks when department is deleted", async () => {
    const { organization, department, user } =
      await global.testUtils.createTestContext();

    const startDate = new Date();
    const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const task = await AssignedTask.create({
      title: "Dept Task",
      description: "Task linked to department for cascade test",
      organization: organization._id,
      department: department._id,
      createdBy: user._id,
      startDate,
      dueDate,
      assignees: [user._id],
    });

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await Department.softDeleteByIdWithCascade(department._id, {
        session,
      });
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
    session.endSession();

    const deptAfter = await Department.findById(department._id)
      .select("+isDeleted")
      .setOptions({ withDeleted: true });
    const userAfter = await User.findById(user._id)
      .select("+isDeleted")
      .setOptions({ withDeleted: true });
    const taskAfter = await AssignedTask.findOne({ _id: task._id })
      .select("+isDeleted")
      .setOptions({ withDeleted: true });

    expect(deptAfter?.isDeleted).toBe(true);
    expect(userAfter?.isDeleted).toBe(true);
    expect(taskAfter?.isDeleted).toBe(true);
  });

  it("initializeTTL should configure TTL index without throwing", async () => {
    await expect(Department.initializeTTL()).resolves.not.toThrow;
  });
});
