// backend/tests/unit/taskModels.test.js
// Unit tests for BaseTask and discriminator task models (ProjectTask, RoutineTask, AssignedTask)
// Requirements (partial): 31, 241-252 (Task Models), 253-260 (TaskComment cascade), 261-270 (Attachment), 284-290 (Notification)

import { describe, it, expect, beforeAll } from "@jest/globals";
import mongoose from "mongoose";
import {
  BaseTask,
  ProjectTask,
  RoutineTask,
  AssignedTask,
  TaskActivity,
  TaskComment,
  Attachment,
  Notification,
  User,
} from "../../models/index.js";
import {
  MAX_ATTACHMENTS_PER_ENTITY,
  MAX_WATCHERS_PER_TASK,
  MAX_TAGS_PER_TASK,
  HEAD_OF_DEPARTMENT_ROLES,
} from "../../utils/constants.js";

// Helper: create a base org/dept/user context using global test utilities
const createContext = async (overrides = {}) => {
  const ctx = await global.testUtils.createTestContext();
  const { organization, department } = ctx;

  // Ensure we have at least one HOD user (Admin) and one non-HOD (User)
  const hodUser = await global.testUtils.createTestUser(
    organization._id,
    department._id,
    {
      email: overrides.hodEmail || "hod@example.com",
      role: HEAD_OF_DEPARTMENT_ROLES[1] || "Admin",
      position: "Head of Department",
      isHod: true,
    }
  );

  const regularUser = await global.testUtils.createTestUser(
    organization._id,
    department._id,
    {
      email: overrides.regularEmail || "regular@example.com",
      role: "User",
      position: "Staff",
    }
  );

  return { ...ctx, hodUser, regularUser };
};

describe("Task Models - Discriminators and Validation", () => {
  beforeAll(async () => {
    // Sync indexes for discriminator models to avoid uniqueness race conditions
    if (BaseTask && typeof BaseTask.syncIndexes === "function") {
      await BaseTask.syncIndexes();
    }
    if (AssignedTask && typeof AssignedTask.syncIndexes === "function") {
      await AssignedTask.syncIndexes();
    }
    if (ProjectTask && typeof ProjectTask.syncIndexes === "function") {
      await ProjectTask.syncIndexes();
    }
    if (RoutineTask && typeof RoutineTask.syncIndexes === "function") {
      await RoutineTask.syncIndexes();
    }
  });

  it("should create discriminator tasks with correct taskType", async () => {
    const { organization, department, user } =
      await global.testUtils.createTestContext();

    const now = new Date();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const assigned = await AssignedTask.create({
      title: "Assigned Task",
      description: "Assigned task description",
      organization: organization._id,
      department: department._id,
      createdBy: user._id,
      startDate: now,
      dueDate: tomorrow,
      assignees: [user._id],
    });

    const project = await ProjectTask.create({
      title: "Project Task",
      description: "Project task description",
      organization: organization._id,
      department: department._id,
      createdBy: user._id,
      startDate: now,
      dueDate: tomorrow,
      vendor: new mongoose.Types.ObjectId(), // Vendor validation is tested separately
    });

    const routine = await RoutineTask.create({
      title: "Routine Task",
      description: "Routine task description",
      organization: organization._id,
      department: department._id,
      createdBy: user._id,
      date: now,
    });

    expect(assigned.taskType).toBe("AssignedTask");
    expect(project.taskType).toBe("ProjectTask");
    expect(routine.taskType).toBe("RoutineTask");

    const baseTasks = await BaseTask.find({ _id: { $in: [
      assigned._id,
      project._id,
      routine._id,
    ] } }).setOptions({ withDeleted: true });

    expect(baseTasks).toHaveLength(3);
    const types = baseTasks.map((t) => t.taskType).sort();
    expect(types).toEqual([
      "AssignedTask",
      "ProjectTask",
      "RoutineTask",
    ].sort());
  });

  it("should validate startDate and dueDate for AssignedTask", async () => {
    const { organization, department, user } =
      await global.testUtils.createTestContext();

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const today = new Date();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Past startDate should fail
    await expect(
      AssignedTask.create({
        title: "Invalid Task",
        description: "Past start date",
        organization: organization._id,
        department: department._id,
        createdBy: user._id,
        startDate: yesterday,
        dueDate: tomorrow,
        assignees: [user._id],
      })
    ).rejects.toThrow();

    // dueDate before startDate should fail
    await expect(
      AssignedTask.create({
        title: "Invalid Task 2",
        description: "Due before start",
        organization: organization._id,
        department: department._id,
        createdBy: user._id,
        startDate: tomorrow,
        dueDate: today,
        assignees: [user._id],
      })
    ).rejects.toThrow();

    // Valid dates should succeed
    const valid = await AssignedTask.create({
      title: "Valid Task",
      description: "Valid dates",
      organization: organization._id,
      department: department._id,
      createdBy: user._id,
      startDate: today,
      dueDate: tomorrow,
      assignees: [user._id],
    });
    expect(valid._id).toBeDefined();
  });

  it("should prevent RoutineTask date from being in the future", async () => {
    const { organization, department, user } =
      await global.testUtils.createTestContext();

    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await expect(
      RoutineTask.create({
        title: "Future Routine",
        description: "Date in the future",
        organization: organization._id,
        department: department._id,
        createdBy: user._id,
        date: futureDate,
      })
    ).rejects.toThrow();
  });

  it("should validate watchers are HOD users within same organization", async () => {
    const { organization, department, hodUser, regularUser } =
      await createContext();

    const now = new Date();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Valid: watcher is HOD in same org
    const validTask = await AssignedTask.create({
      title: "Task with watcher",
      description: "Valid watcher",
      organization: organization._id,
      department: department._id,
      createdBy: hodUser._id,
      startDate: now,
      dueDate: tomorrow,
      assignees: [hodUser._id],
      watchers: [hodUser._id],
    });
    expect(validTask.watchers).toHaveLength(1);

    // Invalid: watcher is regular user (non-HOD)
    await expect(
      AssignedTask.create({
        title: "Task with invalid watcher",
        description: "Watcher must be HOD",
        organization: organization._id,
        department: department._id,
        createdBy: hodUser._id,
        startDate: now,
        dueDate: tomorrow,
        assignees: [hodUser._id],
        watchers: [regularUser._id],
      })
    ).rejects.toThrow("All watchers must be Head of Department");

    // Invalid: too many watchers
    const watchers = [];
    for (let i = 0; i < MAX_WATCHERS_PER_TASK + 1; i++) {
      const w = await global.testUtils.createTestUser(
        organization._id,
        department._id,
        {
          email: `hod-${i}@example.com`,
          role: HEAD_OF_DEPARTMENT_ROLES[0],
          position: "Head of Department",
          isHod: true,
        }
      );
      watchers.push(w._id);
    }

    await expect(
      AssignedTask.create({
        title: "Task with too many watchers",
        description: "Exceeds max watchers",
        organization: organization._id,
        department: department._id,
        createdBy: hodUser._id,
        startDate: now,
        dueDate: tomorrow,
        assignees: [hodUser._id],
        watchers,
      })
    ).rejects.toThrow();
  });

  it("should validate assignees are unique and belong to same organization and department", async () => {
    const ctx = await createContext();
    const { organization, department, hodUser, regularUser } = ctx;

    const otherDepartment = await global.testUtils.createTestDepartment(
      organization._id
    );
    const otherDeptUser = await global.testUtils.createTestUser(
      organization._id,
      otherDepartment._id,
      {
        email: "otherdept@example.com",
        role: "User",
      }
    );

    const now = new Date();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Duplicate assignees should fail
    await expect(
      AssignedTask.create({
        title: "Task dup assignees",
        description: "Duplicate assignees",
        organization: organization._id,
        department: department._id,
        createdBy: hodUser._id,
        startDate: now,
        dueDate: tomorrow,
        assignees: [regularUser._id, regularUser._id],
      })
    ).rejects.toThrow("Duplicate assignees are not allowed");

    // Assignee from different department should fail
    await expect(
      AssignedTask.create({
        title: "Task cross dept assignees",
        description: "Assignee in different department",
        organization: organization._id,
        department: department._id,
        createdBy: hodUser._id,
        startDate: now,
        dueDate: tomorrow,
        assignees: [regularUser._id, otherDeptUser._id],
      })
    ).rejects.toThrow(
      "All assignees must belong to the same organization and department" // from AssignedTask pre-save
    );
  });

  it("should prevent exceeding attachment and tag limits", async () => {
    const { organization, department, hodUser } = await createContext();

    const now = new Date();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const tooManyAttachments = Array.from(
      { length: MAX_ATTACHMENTS_PER_ENTITY + 1 },
      () => new mongoose.Types.ObjectId()
    );

    await expect(
      AssignedTask.create({
        title: "Too many attachments",
        description: "Attachment limit exceeded",
        organization: organization._id,
        department: department._id,
        createdBy: hodUser._id,
        startDate: now,
        dueDate: tomorrow,
        assignees: [hodUser._id],
        attachments: tooManyAttachments,
      })
    ).rejects.toThrow();

    const tooManyTags = Array.from(
      { length: MAX_TAGS_PER_TASK + 1 },
      (_, i) => `tag-${i}`
    );

    await expect(
      AssignedTask.create({
        title: "Too many tags",
        description: "Tag limit exceeded",
        organization: organization._id,
        department: department._id,
        createdBy: hodUser._id,
        startDate: now,
        dueDate: tomorrow,
        assignees: [hodUser._id],
        tags: tooManyTags,
      })
    ).rejects.toThrow();
  });

  it("should cascade soft-delete task to activities, comments, attachments and notifications", async () => {
    const { organization, department, user } =
      await global.testUtils.createTestContext();

    const now = new Date();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const task = await AssignedTask.create({
      title: "Cascade Task",
      description: "Task for cascade testing",
      organization: organization._id,
      department: department._id,
      createdBy: user._id,
      startDate: now,
      dueDate: tomorrow,
      assignees: [user._id],
    });

    const activity = await TaskActivity.create({
      task: task._id,
      taskModel: "AssignedTask",
      activity: "Did something",
      organization: organization._id,
      department: department._id,
      createdBy: user._id,
    });

    const comment = await TaskComment.create({
      parent: task._id,
      parentModel: "AssignedTask",
      comment: "Comment on task",
      organization: organization._id,
      department: department._id,
      createdBy: user._id,
    });

    const attachment = await Attachment.create({
      originalName: "file.txt",
      storedName: "file.txt",
      mimeType: "text/plain",
      size: 100,
      type: "document",
      url: "https://res.cloudinary.com/demo/file.txt",
      publicId: "demo/file.txt",
      parent: task._id,
      parentModel: "AssignedTask",
      organization: organization._id,
      department: department._id,
      uploadedBy: user._id,
    });

    const notification = await Notification.create({
      type: "Created",
      title: "Task created",
      message: "A task was created",
      entity: task._id,
      entityModel: "AssignedTask",
      recipients: [user._id],
      organization: organization._id,
      department: department._id,
      createdBy: user._id,
    });

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await BaseTask.softDeleteByIdWithCascade(task._id, {
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

    const taskAfter = await AssignedTask.findById(task._id)
      .select("+isDeleted")
      .setOptions({ withDeleted: true });
    const activityAfter = await TaskActivity.findById(activity._id)
      .select("+isDeleted")
      .setOptions({ withDeleted: true });
    const commentAfter = await TaskComment.findById(comment._id)
      .select("+isDeleted")
      .setOptions({ withDeleted: true });
    const attachmentAfter = await Attachment.findById(attachment._id)
      .select("+isDeleted")
      .setOptions({ withDeleted: true });
    const notificationAfter = await Notification.findById(notification._id)
      .select("+isDeleted")
      .setOptions({ withDeleted: true });

    expect(taskAfter?.isDeleted).toBe(true);
    expect(activityAfter?.isDeleted).toBe(true);
    expect(commentAfter?.isDeleted).toBe(true);
    expect(attachmentAfter?.isDeleted).toBe(true);
    expect(notificationAfter?.isDeleted).toBe(true);
  });

  it("BaseTask.initializeTTL should configure TTL index without throwing", async () => {
    await expect(BaseTask.initializeTTL()).resolves.not.toThrow;
  });
});
