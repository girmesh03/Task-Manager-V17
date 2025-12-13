// backend/models/AssignedTask.js
import mongoose from "mongoose";
import { BaseTask } from "./BaseTask.js";
import { MAX_ASSIGNEES_PER_TASK } from "../utils/constants.js";
import {
  isStartDateBeforeDueDate,
  isStartDateTodayOrFuture,
} from "../utils/helpers.js";

/**
 * AssignedTask Schema - Discriminator of BaseTask for tasks assigned to users within the same department
 * Extends BaseTask with start/due dates and assignee management
 */

const AssignedTaskSchema = new mongoose.Schema(
  {
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      validate: {
        validator: function (v) {
          if (!v) return false;
          const startDate = new Date(v);
          if (isNaN(startDate.getTime())) return false;

          // Fixed: Use UTC comparison to avoid timezone issues
          return isStartDateTodayOrFuture(v);
        },
        message: "Start date cannot be in the past and must be a valid date",
      },
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
      validate: {
        validator: function (v) {
          if (!v || !this.startDate) return false;

          // Fixed: Use proper date comparison
          return isStartDateBeforeDueDate(this.startDate, v);
        },
        message: "Due date must be greater than or equal to start date",
      },
    },
    assignees: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      required: [true, "Assignees are required for an assigned task"],
      validate: [
        {
          validator: (v) =>
            !Array.isArray(v) || v.length <= MAX_ASSIGNEES_PER_TASK,
          message: `Number of user assigned to a task cannot exceed ${MAX_ASSIGNEES_PER_TASK}`,
        },
        {
          validator: function (assignees) {
            if (!Array.isArray(assignees)) return true;
            const uniqueIds = new Set(assignees.map((id) => id.toString()));
            return uniqueIds.size === assignees.length;
          },
          message: "Duplicate assignees are not allowed",
        },
      ],
    },
  },
  {
    toJSON: BaseTask.schema.options.toJSON,
    toObject: BaseTask.schema.options.toObject,
  }
);

// ==================== INDEXES ====================
AssignedTaskSchema.index(
  { organization: 1, department: 1, assignees: 1, createdAt: -1 },
  { partialFilterExpression: { isDeleted: false } }
);

AssignedTaskSchema.index(
  { organization: 1, department: 1, status: 1, priority: 1, dueDate: 1 },
  { partialFilterExpression: { isDeleted: false } }
);

AssignedTaskSchema.index(
  { dueDate: 1 },
  { partialFilterExpression: { isDeleted: false } }
);

// ==================== VALIDATION HOOKS ====================
AssignedTaskSchema.pre("save", async function (next) {
  try {
    const session = this.$session?.();

    // Validate assignees belong to same org/dept as task
    if (this.isModified("assignees")) {
      const { User } = await import("./User.js");

      const validUsers = await User.find({
        _id: { $in: this.assignees },
        organization: this.organization,
        department: this.department,
        isDeleted: false,
      }).session(session);

      if (validUsers.length !== this.assignees.length) {
        throw new Error(
          "All assignees must belong to the same organization and department as the task"
        );
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Initialize TTL index for cleanup after 180 days
AssignedTaskSchema.statics.initializeTTL = async function () {
  const { TTL_EXPIRY } = await import("../utils/constants.js");
  return this.ensureTTLIndex(TTL_EXPIRY.TASKS);
};

export const AssignedTask = BaseTask.discriminator(
  "AssignedTask",
  AssignedTaskSchema
);
export default AssignedTask;
