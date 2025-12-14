// backend/models/BaseTask.js
import mongoose from "mongoose";
import paginate from "mongoose-paginate-v2";
import softDeletePlugin from "./plugins/softDelete.js";
import {
  TASK_STATUS,
  TASK_PRIORITY,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_ATTACHMENTS_PER_ENTITY,
  MAX_WATCHERS_PER_TASK,
  MAX_TAGS_PER_TASK,
  MAX_TAG_LENGTH,
  HEAD_OF_DEPARTMENT_ROLES,
} from "../utils/constants.js";

/**
 * Base Task Schema - Abstract model for all task types using Mongoose discriminators
 * Provides common fields and behaviors for RoutineTask, AssignedTask, and ProjectTask
 */

const BaseTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [
        MAX_TITLE_LENGTH,
        `Title cannot exceed ${MAX_TITLE_LENGTH} characters`,
      ],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [
        MAX_DESCRIPTION_LENGTH,
        `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`,
      ],
    },
    status: {
      type: String,
      enum: { values: TASK_STATUS, message: "Invalid task status" },
      default: TASK_STATUS[0], // "To Do"
    },
    priority: {
      type: String,
      enum: { values: TASK_PRIORITY, message: "Invalid task priority" },
      default: "Medium",
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization reference is required"],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department reference is required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator (createdBy) is required"],
    },
    attachments: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Attachment" }],
      validate: [
        {
          validator: (v) =>
            !Array.isArray(v) || v.length <= MAX_ATTACHMENTS_PER_ENTITY,
          message: `Attachments cannot exceed ${MAX_ATTACHMENTS_PER_ENTITY}`,
        },
        {
          validator: function (attachments) {
            if (!Array.isArray(attachments)) return true;
            const uniqueIds = new Set(attachments.map((id) => id.toString()));
            return uniqueIds.size === attachments.length;
          },
          message: "Duplicate attachments are not allowed",
        },
      ],
    },
    watchers: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      validate: [
        {
          validator: (v) =>
            !Array.isArray(v) || v.length <= MAX_WATCHERS_PER_TASK,
          message: `Watchers cannot exceed ${MAX_WATCHERS_PER_TASK} users`,
        },
        {
          validator: function (watchers) {
            if (!Array.isArray(watchers)) return true;
            const uniqueIds = new Set(watchers.map((id) => id.toString()));
            return uniqueIds.size === watchers.length;
          },
          message: "Duplicate watchers are not allowed",
        },
      ],
    },
    tags: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: [
            MAX_TAG_LENGTH,
            `Tag cannot exceed ${MAX_TAG_LENGTH} characters`,
          ],
        },
      ],
      validate: [
        {
          validator: (v) => !Array.isArray(v) || v.length <= MAX_TAGS_PER_TASK,
          message: `Tags cannot exceed ${MAX_TAGS_PER_TASK} items`,
        },
        {
          validator: function (tags) {
            if (!Array.isArray(tags)) return true;
            const uniqueTags = new Set(
              tags.map((tag) => tag.toLowerCase().trim()).filter(Boolean)
            );
            const validTags = tags.filter((tag) => tag && tag.trim());
            return uniqueTags.size === validTags.length;
          },
          message: "Duplicate tags are not allowed (case-insensitive)",
        },
      ],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    discriminatorKey: "taskType",
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.id;
        delete ret.__v;
        delete ret.isDeleted;
        delete ret.deletedAt;
        delete ret.deletedBy;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.id;
        delete ret.__v;
        delete ret.isDeleted;
        delete ret.deletedAt;
        delete ret.deletedBy;
        return ret;
      },
    },
  }
);

// ==================== INDEXES ====================
BaseTaskSchema.index(
  { organization: 1, department: 1, createdAt: -1 },
  { partialFilterExpression: { isDeleted: false } }
);

BaseTaskSchema.index(
  { organization: 1, createdBy: 1, createdAt: -1 },
  { partialFilterExpression: { isDeleted: false } }
);

BaseTaskSchema.index(
  { organization: 1, department: 1, startDate: 1, dueDate: 1 },
  { partialFilterExpression: { isDeleted: false } }
);

BaseTaskSchema.index(
  { organization: 1, department: 1, status: 1, priority: 1, dueDate: 1 },
  { partialFilterExpression: { isDeleted: false } }
);

BaseTaskSchema.index({ tags: "text" });

// ==================== VALIDATION HOOKS ====================
BaseTaskSchema.pre("save", async function (next) {
  try {
    const session = this.$session?.();

    if (this.isModified("department") || this.isModified("organization")) {
      const { Department } = await import("./Department.js");
      const department = await Department.findOne({
        _id: this.department,
        organization: this.organization,
        isDeleted: false,
      }).session(session);
      if (!department) {
        throw new Error(
          "Department does not belong to the specified organization"
        );
      }
    }

    if (
      this.isModified("createdBy") ||
      this.isModified("organization") ||
      this.isModified("department")
    ) {
      const { User } = await import("./User.js");
      const user = await User.findOne({
        _id: this.createdBy,
        organization: this.organization,
        department: this.department,
        isDeleted: false,
      }).session(session);
      if (!user) {
        throw new Error(
          "Creator user does not belong to the specified organization and department"
        );
      }
    }

    if (
      this.isModified("watchers") &&
      this.watchers &&
      this.watchers.length > 0
    ) {
      const { User } = await import("./User.js");
      const watcherUsers = await User.find({
        _id: { $in: this.watchers },
        organization: this.organization,
        role: { $in: HEAD_OF_DEPARTMENT_ROLES },
        isDeleted: false,
      }).session(session);
      if (watcherUsers.length !== this.watchers.length) {
        throw new Error(
          "All watchers must be Head of Department (SuperAdmin or Admin) within the same organization"
        );
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

softDeletePlugin(BaseTaskSchema);
BaseTaskSchema.plugin(paginate);

// Expose getOriginal helper for all descendants
BaseTaskSchema.methods.getOriginal = function (path) {
  if (this.isNew) return undefined;
  return this.get(path, null, { getters: false });
};

// ==================== CASCADE SOFT DELETE ====================
BaseTaskSchema.statics.softDeleteByIdWithCascade = async function (
  taskId,
  { session, deletedBy } = {}
) {
  if (!session)
    throw new Error("Soft delete must be performed within a transaction");
  const task = await this.findOne({ _id: taskId }).session(session);
  if (!task) throw new Error("Task not found or already deleted");

  const { TaskActivity } = await import("./TaskActivity.js");
  const { TaskComment } = await import("./TaskComment.js");
  const { Attachment } = await import("./Attachment.js");
  const { Notification } = await import("./Notification.js");

  // Cascade delete related TaskActivities
  const activities = await TaskActivity.find({ task: taskId }).session(session);
  for (const act of activities) {
    await TaskActivity.softDeleteByIdWithCascade(act._id, {
      session,
      deletedBy,
    });
  }

  // Cascade delete related TaskComments
  await TaskComment.softDeleteManyCascade(
    {
      parent: taskId,
      parentModel: { $in: ["AssignedTask", "ProjectTask", "RoutineTask"] },
    },
    { session, deletedBy }
  );

  // Cascade delete related Attachments
  await Attachment.softDeleteMany(
    {
      parent: taskId,
      parentModel: { $in: ["AssignedTask", "ProjectTask", "RoutineTask"] },
    },
    { session, deletedBy }
  );

  // CRITICAL: Cascade delete related Notifications to prevent cross-tenant dangling pointers
  await Notification.softDeleteMany(
    {
      entity: taskId,
      entityModel: { $in: ["AssignedTask", "ProjectTask", "RoutineTask"] },
    },
    { session, deletedBy }
  );

  // Finally, delete the task itself
  await this.softDeleteById(taskId, { session, deletedBy });
};

// Initialize TTL index for cleanup after 180 days
BaseTaskSchema.statics.initializeTTL = async function () {
  const { TTL_EXPIRY } = await import("../utils/constants.js");
  return this.ensureTTLIndex(TTL_EXPIRY.TASKS);
};

export const BaseTask = mongoose.model("BaseTask", BaseTaskSchema);
export default BaseTask;
