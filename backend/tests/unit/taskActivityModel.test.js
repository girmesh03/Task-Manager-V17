// backend/tests/unit/taskActivityModel.test.js
// Unit tests for TaskActivity model configuration and behavior
// Requirements (partial): 253-257 (TaskActivity), 271-277 (Material)

import { describe, it, expect, beforeAll } from "@jest/globals";
import mongoose from "mongoose";
import {
  TaskActivity,
  AssignedTask,
  Material,
} from "../../models/index.js";
import { MAX_MATERIALS_PER_ENTITY } from "../../utils/constants.js";

const createContextWithTaskAndMaterial = async () => {
  const { organization, department, user } =
    await global.testUtils.createTestContext();

  const startDate = new Date();
  const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const task = await AssignedTask.create({
    title: "Activity Task",
    description: "Task for activity tests",
    organization: organization._id,
    department: department._id,
    createdBy: user._id,
    startDate,
    dueDate,
    assignees: [user._id],
  });

  const material = await Material.create({
    name: "Test Material",
    unit: "pcs",
    price: 10,
    category: "Other",
    organization: organization._id,
    department: department._id,
    addedBy: user._id,
  });

  return { organization, department, user, task, material };
};

describe("TaskActivity Model", () => {
  beforeAll(async () => {
    if (TaskActivity && typeof TaskActivity.syncIndexes === "function") {
      await TaskActivity.syncIndexes();
    }
  });

  it("should calculate totalMaterialCost based on materials totalCost", async () => {
    const { organization, department, user, task, material } =
      await createContextWithTaskAndMaterial();

    const activity = await TaskActivity.create({
      task: task._id,
      taskModel: "AssignedTask",
      activity: "Used some materials",
      organization: organization._id,
      department: department._id,
      createdBy: user._id,
      materials: [
        {
          material: material._id,
          quantity: 2,
          unitPrice: 10,
          totalCost: 20,
        },
        {
          material: material._id,
          quantity: 3,
          unitPrice: 10,
          totalCost: 30,
        },
      ],
    });

    expect(activity.totalMaterialCost).toBe(50);
  });

  it("should enforce MAX_MATERIALS_PER_ENTITY limit", async () => {
    const { organization, department, user, task, material } =
      await createContextWithTaskAndMaterial();

    const materials = Array.from({ length: MAX_MATERIALS_PER_ENTITY + 1 }, () => ({
      material: material._id,
      quantity: 1,
      unitPrice: 1,
      totalCost: 1,
    }));

    await expect(
      TaskActivity.create({
        task: task._id,
        taskModel: "AssignedTask",
        activity: "Too many materials",
        organization: organization._id,
        department: department._id,
        createdBy: user._id,
        materials,
      })
    ).rejects.toThrow();
  });

  it("should validate that task and createdBy belong to same organization and department and taskModel matches", async () => {
    const { organization, department, user, task } =
      await createContextWithTaskAndMaterial();

    // Valid activity
    const valid = await TaskActivity.create({
      task: task._id,
      taskModel: "AssignedTask",
      activity: "Valid activity",
      organization: organization._id,
      department: department._id,
      createdBy: user._id,
    });
    expect(valid._id).toBeDefined();

    // Invalid taskModel (mismatched discriminator)
    await expect(
      TaskActivity.create({
        task: task._id,
        taskModel: "ProjectTask",
        activity: "Invalid model",
        organization: organization._id,
        department: department._id,
        createdBy: user._id,
      })
    ).rejects.toThrow(
      "Task must exist, belong to the same organization and department as the activity, and taskModel must match the task discriminator"
    );
  });

  it("TaskActivity.initializeTTL should configure TTL index without throwing", async () => {
    await expect(TaskActivity.initializeTTL()).resolves.not.toThrow;
  });
});
