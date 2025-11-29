// backend/tests/unit/organizationModel.test.js
// Unit tests for Organization model configuration and behavior
// Requirements (partial): 29, 100, 106-109, 225-233

import { describe, it, expect, beforeAll } from "@jest/globals";
import mongoose from "mongoose";
import { Organization, Department, User, AssignedTask } from "../../models/index.js";

describe("Organization Model", () => {
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

  it("should enforce unique organization name per non-deleted document", async () => {
    await Organization.create({
      name: "unique-org",
      description: "First org",
      email: "org1@example.com",
      phone: "+10000000001",
      address: "Address 1",
      industry: "Hospitality",
    });

    await expect(
      Organization.create({
        name: "UNIQUE-org", // same name different case
        description: "Second org",
        email: "org2@example.com",
        phone: "+10000000002",
        address: "Address 2",
        industry: "Hospitality",
      })
    ).rejects.toThrow();
  });

  it("should treat isPlatformOrg as immutable flag for platform organizations", async () => {
    const org = await Organization.create({
      name: "platform-org",
      description: "Platform organization",
      email: "platform@example.com",
      phone: "+10000000003",
      address: "Platform Address",
      industry: "Hospitality",
      isPlatformOrg: true,
    });

    expect(org.isPlatformOrg).toBe(true);

    org.isPlatformOrg = false;
    await org.save();

    const reloaded = await Organization.findById(org._id);
    expect(reloaded.isPlatformOrg).toBe(true);
  });

  it("should cascade soft-delete to departments, users and tasks", async () => {
    const { organization, department, user } =
      await global.testUtils.createTestContext();

    const startDate = new Date();
    const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const task = await AssignedTask.create({
      title: "Test Task",
      description: "Task linked to organization for cascade test",
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
      await Organization.softDeleteByIdWithCascade(organization._id, {
        session,
        deletedBy: user._id,
      });
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
    session.endSession();

    const orgAfter = await Organization.findById(organization._id)
      .select("+isDeleted")
      .setOptions({ withDeleted: true });
    const deptAfter = await Department.findById(department._id)
      .select("+isDeleted")
      .setOptions({ withDeleted: true });
    const userAfter = await User.findById(user._id)
      .select("+isDeleted")
      .setOptions({ withDeleted: true });
    const taskAfter = await AssignedTask.findOne({ _id: task._id })
      .select("+isDeleted")
      .setOptions({ withDeleted: true });

    expect(orgAfter?.isDeleted).toBe(true);
    expect(deptAfter?.isDeleted).toBe(true);
    expect(userAfter?.isDeleted).toBe(true);
    expect(taskAfter?.isDeleted).toBe(true);
  });

  it("initializeTTL should configure TTL index without throwing (no auto-delete)", async () => {
    await expect(Organization.initializeTTL()).resolves.not.toThrow;
  });
});
