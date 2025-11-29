// backend/models/TaskActivity.js
import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import softDeletePlugin from "./plugins/softDelete.js";
import {
  TASK_ACTIVITY_PARENT_MODELS,
  MAX_ACTIVITY_LENGTH,
  MAX_ATTACHMENTS_PER_ENTITY,
  MAX_MATERIALS_PER_ENTITY,
} from "../utils/constants.js";

/**
 * TaskActivity Schema - Activity logs for tracking progress on AssignedTask and ProjectTask
 * Supports polymorphic relationships with tasks, attachments, and materials
 */

const TaskActivitySchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "taskModel",
      required: [true, "Task reference is required"],
    },
    taskModel: {
      type: String,
      required: [true, "Task model is required"],
      enum: {
        values: TASK_ACTIVITY_PARENT_MODELS,
        message: "Invalid task model",
      },
    },
    activity: {
      type: String,
      required: [true, "Activity is required"],
      trim: true,
      maxlength: [
        MAX_ACTIVITY_LENGTH,
        `Activity cannot exceed ${MAX_ACTIVITY_LENGTH} characters`,
      ],
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
    materials: {
      type: [
        {
          material: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Material",
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
            min: [0, "Quantity cannot be negative"],
            validate: {
              validator: function (v) {
                return v >= 0 && v <= 1000000;
              },
              message: "Quantity must be between 0 and 1,000,000",
            },
          },
          unitPrice: {
            type: Number,
            required: true,
            min: [0, "Unit price cannot be negative"],
          },
          totalCost: {
            type: Number,
            required: true,
            min: [0, "Total cost cannot be negative"],
          },
        },
      ],
      validate: {
        validator: function (materials) {
          if (!Array.isArray(materials)) return true;
          return materials.length <= MAX_MATERIALS_PER_ENTITY;
        },
        message: `Materials cannot exceed ${MAX_MATERIALS_PER_ENTITY}`,
      },
    },
    totalMaterialCost: {
      type: Number,
      default: 0,
      min: [0, "Total material cost cannot be negative"],
    },
    loggedAt: { type: Date, default: Date.now },
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
  },
  {
    timestamps: true,
    versionKey: false,
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
TaskActivitySchema.index(
  {
    organization: 1,
    department: 1,
    taskModel: 1,
    task: 1,
    createdAt: -1,
  },
  { partialFilterExpression: { isDeleted: false } }
);

TaskActivitySchema.index(
  { organization: 1, createdBy: 1, createdAt: -1 },
  { partialFilterExpression: { isDeleted: false } }
);

// ==================== VIRTUALS ====================
TaskActivitySchema.virtual("calculatedTotalCost").get(function () {
  if (!this.materials || !Array.isArray(this.materials)) return 0;
  return this.materials.reduce((total, item) => {
    return total + (item.totalCost || 0);
  }, 0);
});

// ==================== HOOKS ====================
TaskActivitySchema.pre("save", async function (next) {
  try {
    const session = this.$session?.();

    // Calculate total material cost
    if (this.isModified("materials")) {
      this.totalMaterialCost = this.calculatedTotalCost;
    }

    // Validate task exists and belongs to same org/dept with taskModel consistency
    if (
      this.isModified("task") ||
      this.isModified("taskModel") ||
      this.isModified("organization") ||
      this.isModified("department")
    ) {
      const { BaseTask } = await import("./BaseTask.js");

      const task = await BaseTask.findOne({
        _id: this.task,
        taskType: this.taskModel,
        organization: this.organization,
        department: this.department,
        isDeleted: false,
      }).session(session);

      if (!task) {
        throw new Error(
          "Task must exist, belong to the same organization and department as the activity, and taskModel must match the task discriminator"
        );
      }
    }

    // Validate creator belongs to same org/dept
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
          "Activity creator must belong to the same organization and department"
        );
      }
    }

    // Validate attachments belong to this activity (if modified)
    if (this.isModified("attachments") && this.attachments?.length > 0) {
      const { Attachment } = await import("./Attachment.js");

      const validAttachments = await Attachment.find({
        _id: { $in: this.attachments },
        parent: this._id,
        parentModel: "TaskActivity",
        isDeleted: false,
      }).session(session);

      if (validAttachments.length !== this.attachments.length) {
        throw new Error(
          "All referenced attachments must belong to this activity as parent"
        );
      }
    }

    // Validate materials exist and belong to same organization (if modified)
    if (this.isModified("materials") && this.materials?.length > 0) {
      const { Material } = await import("./Material.js");
      const materialIds = this.materials.map((m) => m.material);

      const validMaterials = await Material.find({
        _id: { $in: materialIds },
        organization: this.organization,
        isDeleted: false,
      }).session(session);

      if (validMaterials.length !== materialIds.length) {
        throw new Error(
          "All referenced materials must belong to the same organization"
        );
      }

      // Update material prices if not provided or validate provided prices
      for (let materialItem of this.materials) {
        const materialDoc = validMaterials.find((m) =>
          m._id.equals(materialItem.material)
        );
        if (materialDoc) {
          // Use current material price if unitPrice not provided
          if (!materialItem.unitPrice && materialDoc.price) {
            materialItem.unitPrice = materialDoc.price;
          }

          // Calculate total cost
          if (materialItem.quantity && materialItem.unitPrice) {
            materialItem.totalCost =
              materialItem.quantity * materialItem.unitPrice;
          }
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Plugins
TaskActivitySchema.plugin(softDeletePlugin);
TaskActivitySchema.plugin(mongoosePaginate);

// ==================== NEW METHODS FOR MATERIAL MANAGEMENT ====================
TaskActivitySchema.statics.removeMaterialFromAllActivities = async function (
  materialId,
  { session } = {}
) {
  if (!session) {
    throw new Error("Material removal must be performed within a transaction");
  }

  // Remove the specific material from all task activities
  const result = await this.updateMany(
    {
      "materials.material": materialId,
      isDeleted: false,
    },
    {
      $pull: { materials: { material: materialId } },
    },
    { session }
  );

  return result;
};

TaskActivitySchema.statics.addMaterialToActivity = async function (
  activityId,
  materialData,
  { session } = {}
) {
  if (!session) {
    throw new Error("Material addition must be performed within a transaction");
  }

  const activity = await this.findOne({
    _id: activityId,
    isDeleted: false,
  }).session(session);
  if (!activity) {
    throw new Error("TaskActivity not found or deleted");
  }

  // Check if material already exists in activity
  const existingIndex = activity.materials.findIndex(
    (m) => m.material.toString() === materialData.material.toString()
  );

  if (existingIndex !== -1) {
    // Update existing material entry
    activity.materials[existingIndex] = materialData;
  } else {
    // Add new material entry
    activity.materials.push(materialData);
  }

  await activity.save({ session });
  return activity;
};

// ==================== CASCADE SOFT DELETE ====================
TaskActivitySchema.statics.softDeleteByIdWithCascade = async function (
  activityId,
  { session, deletedBy } = {}
) {
  if (!session) {
    throw new Error("Soft delete must be performed within a transaction");
  }

  const activity = await this.findOne({ _id: activityId }).session(session);
  if (!activity) {
    throw new Error("TaskActivity not found or already deleted");
  }

  const { Attachment } = await import("./Attachment.js");
  const { TaskComment } = await import("./TaskComment.js");

  // Cascade delete attachments directly on this activity
  await Attachment.softDeleteMany(
    { parent: activityId, parentModel: "TaskActivity" },
    { session, deletedBy }
  );

  // Cascade delete comments linked to this activity
  await TaskComment.softDeleteManyCascade(
    { parent: activityId, parentModel: "TaskActivity" },
    { session, deletedBy }
  );

  // Finally, delete the activity itself
  await this.softDeleteById(activityId, { session, deletedBy });
};

TaskActivitySchema.statics.softDeleteManyCascade = async function (
  filter = {},
  { session, deletedBy, batchSize = 100 } = {}
) {
  if (!session) {
    throw new Error("Soft delete must be performed within a transaction");
  }

  const cursor = this.find(filter).session(session).cursor({ batchSize });

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    await this.softDeleteByIdWithCascade(doc._id, { session, deletedBy });
  }
};

// Initialize TTL index for cleanup after 90 days
TaskActivitySchema.statics.initializeTTL = async function () {
  const { TTL_EXPIRY } = await import("../utils/constants.js");
  return this.ensureTTLIndex(TTL_EXPIRY.ACTIVITIES);
};

export const TaskActivity = mongoose.model("TaskActivity", TaskActivitySchema);
export default TaskActivity;
