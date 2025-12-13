// backend/models/Department.js
import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import softDeletePlugin from "./plugins/softDelete.js";
import {
  MAX_DEPT_NAME_LENGTH,
  MAX_DEPT_DESCRIPTION_LENGTH,
} from "../utils/constants.js";

/**
 * Department Schema - Represents organizational departments for task management
 * Provides departmental structure within organizations with hierarchical relationships
 */

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      trim: true,
      maxlength: [
        MAX_DEPT_NAME_LENGTH,
        `Department name cannot exceed ${MAX_DEPT_NAME_LENGTH} characters`,
      ],
    },
    description: {
      type: String,
      maxlength: [
        MAX_DEPT_DESCRIPTION_LENGTH,
        `Description cannot exceed ${MAX_DEPT_DESCRIPTION_LENGTH} characters`,
      ],
      required: [true, "Department description is required"],
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization reference is required"],
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
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
      transform: (doc, ret) => {
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
departmentSchema.index(
  { organization: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

departmentSchema.index({ organization: 1 });

departmentSchema.index(
  { organization: 1, createdAt: -1 },
  { partialFilterExpression: { isDeleted: false } }
);

softDeletePlugin(departmentSchema);
departmentSchema.plugin(mongoosePaginate);

// ==================== HOOKS ====================
departmentSchema.pre("save", async function (next) {
  try {
    const session = this.$session?.();
    if (this.createdBy) {
      const { User } = await import("./User.js");
      const user = await User.findOne({
        _id: this.createdBy,
        organization: this.organization,
        isDeleted: false,
      }).session(session);
      if (!this.isNew && !user) {
        throw new Error(
          "createdBy user must belong to the same organization as the department"
        );
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// ==================== METHODS ====================
departmentSchema.statics.softDeleteByIdWithCascade = async function (
  departmentId,
  { session } = {}
) {
  if (!session)
    throw new Error("Soft delete must be performed within a transaction");
  const department = await this.findOne({ _id: departmentId }).session(session);
  if (!department) throw new Error("Department not found or already deleted");

  const { User } = await import("./User.js");
  const { BaseTask } = await import("./BaseTask.js");
  const { TaskActivity } = await import("./TaskActivity.js");
  const { TaskComment } = await import("./TaskComment.js");
  const { Attachment } = await import("./Attachment.js");
  const { Material } = await import("./Material.js");
  const { Notification } = await import("./Notification.js");

  // Cascade delete related Users
  const users = await User.find({ department: departmentId }).session(session);
  for (const u of users) {
    await User.softDeleteByIdWithCascade(u._id, { session });
  }

  // Cascade delete related Tasks
  const tasks = await BaseTask.find({ department: departmentId }).session(
    session
  );
  for (const t of tasks) {
    await BaseTask.softDeleteByIdWithCascade(t._id, { session });
  }

  // Cascade delete related TaskActivities
  await TaskActivity.softDeleteMany({ department: departmentId }, { session });

  // Cascade delete related TaskComments
  await TaskComment.softDeleteManyCascade(
    { department: departmentId },
    { session }
  );

  // Cascade delete related Attachments
  await Attachment.softDeleteMany({ department: departmentId }, { session });

  // Cascade delete related Materials
  await Material.softDeleteMany({ department: departmentId }, { session });

  // Cascade delete related Notifications
  await Notification.softDeleteMany({ department: departmentId }, { session });

  // Finally, delete the department itself
  await this.softDeleteById(departmentId, { session });
};

// Initialize TTL index for cleanup after 365 days
departmentSchema.statics.initializeTTL = async function () {
  const { TTL_EXPIRY } = await import("../utils/constants.js");
  return this.ensureTTLIndex(TTL_EXPIRY.DEPARTMENTS);
};

export const Department = mongoose.model("Department", departmentSchema);
export default Department;
