// backend/models/RoutineTask.js
import mongoose from "mongoose";
import { BaseTask } from "./BaseTask.js";
import {
  ROUTINE_TASK_STATUS,
  ROUTINE_TASK_PRIORITY,
  MAX_MATERIALS_PER_ENTITY,
} from "../utils/constants.js";
import { isDateNotInFuture } from "../utils/helpers.js";

/**
 * RoutineTask Schema - Discriminator of BaseTask for high-volume repetitive task logging
 * Extends BaseTask with materials tracking and date-based validation
 */

const RoutineTaskSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, "Routine task log date is required"],
      validate: {
        validator: function (v) {
          if (!v) return false;
          const taskDate = new Date(v);
          if (isNaN(taskDate.getTime())) return false;

          // Fixed: Use proper future date check
          return isDateNotInFuture(v);
        },
        message: "Routine task log date cannot be in the future",
      },
    },
    status: {
      type: String,
      enum: {
        values: ROUTINE_TASK_STATUS,
        message: `Status must be ${ROUTINE_TASK_STATUS.join(", ")}.`,
      },
      default: "Completed",
    },
    priority: {
      type: String,
      enum: {
        values: ROUTINE_TASK_PRIORITY,
        message: `Priority must be ${ROUTINE_TASK_PRIORITY.join(", ")}.`,
      },
      default: "Medium",
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
      validate: [
        {
          validator: (v) =>
            !Array.isArray(v) || v.length <= MAX_MATERIALS_PER_ENTITY,
          message: `Materials cannot exceed ${MAX_MATERIALS_PER_ENTITY} items`,
        },
        {
          validator: function (materials) {
            if (!Array.isArray(materials)) return true;
            const uniqueIds = new Set(
              materials.map((item) => item.material.toString())
            );
            return uniqueIds.size === materials.length;
          },
          message: "Duplicate materials are not allowed",
        },
      ],
    },
    totalMaterialCost: {
      type: Number,
      default: 0,
      min: [0, "Total material cost cannot be negative"],
    },
  },
  {
    toJSON: BaseTask.schema.options.toJSON,
    toObject: BaseTask.schema.options.toObject,
  }
);

// ==================== INDEXES ====================
RoutineTaskSchema.index(
  { organization: 1, department: 1, createdBy: 1, date: -1 },
  { partialFilterExpression: { isDeleted: false } }
);

RoutineTaskSchema.index(
  { organization: 1, department: 1, status: 1, date: -1 },
  { partialFilterExpression: { isDeleted: false } }
);

RoutineTaskSchema.index(
  { "materials.material": 1 },
  { partialFilterExpression: { isDeleted: false } }
);

// ==================== VIRTUALS ====================
RoutineTaskSchema.virtual("calculatedTotalCost").get(function () {
  if (!this.materials || !Array.isArray(this.materials)) return 0;
  return this.materials.reduce((total, item) => {
    return total + (item.totalCost || 0);
  }, 0);
});

// ==================== VALIDATION HOOKS ====================
RoutineTaskSchema.pre("save", async function (next) {
  try {
    const session = this.$session?.();

    // Calculate total material cost
    if (this.isModified("materials")) {
      this.totalMaterialCost = this.calculatedTotalCost;
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

      // Update material prices and calculate costs
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

// ==================== NEW METHODS FOR MATERIAL MANAGEMENT ====================
RoutineTaskSchema.statics.removeMaterialFromAllTasks = async function (
  materialId,
  { session } = {}
) {
  if (!session) {
    throw new Error("Material removal must be performed within a transaction");
  }

  // Remove the specific material from all routine tasks
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

RoutineTaskSchema.statics.addMaterialToTask = async function (
  taskId,
  materialData,
  { session } = {}
) {
  if (!session) {
    throw new Error("Material addition must be performed within a transaction");
  }

  const task = await this.findOne({ _id: taskId, isDeleted: false }).session(
    session
  );
  if (!task) {
    throw new Error("RoutineTask not found or deleted");
  }

  // Check if material already exists in task
  const existingIndex = task.materials.findIndex(
    (m) => m.material.toString() === materialData.material.toString()
  );

  if (existingIndex !== -1) {
    // Update existing material entry
    task.materials[existingIndex] = materialData;
  } else {
    // Add new material entry
    task.materials.push(materialData);
  }

  await task.save({ session });
  return task;
};

export const RoutineTask = BaseTask.discriminator(
  "RoutineTask",
  RoutineTaskSchema
);
export default RoutineTask;
