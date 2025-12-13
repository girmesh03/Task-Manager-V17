// backend/models/ProjectTask.js
import mongoose from "mongoose";
import { BaseTask } from "./BaseTask.js";
import {
  SUPPORTED_CURRENCIES,
  DEFAULT_CURRENCY,
  PROJECT_TASK_COST_HISTORY_FIELDS,
  MAX_COST_HISTORY_ENTRIES,
} from "../utils/constants.js";
import {
  isStartDateBeforeDueDate,
  isStartDateTodayOrFuture,
} from "../utils/helpers.js";

/**
 * ProjectTask Schema - Discriminator of BaseTask for outsourced tasks managed by vendors
 * Extends BaseTask with vendor management, cost tracking, and history
 */

const ProjectTaskSchema = new mongoose.Schema(
  {
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      validate: {
        validator: function (v) {
          if (!v) return false;
          const startDate = new Date(v);
          if (isNaN(startDate.getTime())) return false;

          // Fixed: Use UTC comparison for consistent validation
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
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: [true, "Vendor reference is required"],
    },
    estimatedCost: {
      type: Number,
      min: [0, "Estimated cost cannot be negative"],
      validate: {
        validator: function (v) {
          return (
            v === undefined || v === null || (typeof v === "number" && v >= 0)
          );
        },
        message: "Estimated cost must be a non-negative number",
      },
    },
    actualCost: {
      type: Number,
      min: [0, "Actual cost cannot be negative"],
      validate: {
        validator: function (v) {
          return (
            v === undefined || v === null || (typeof v === "number" && v >= 0)
          );
        },
        message: "Actual cost must be a non-negative number",
      },
    },
    currency: {
      type: String,
      default: DEFAULT_CURRENCY,
      enum: {
        values: SUPPORTED_CURRENCIES,
        message: "Currency must be a valid currency code",
      },
    },
    costHistory: {
      type: [
        {
          fieldChanged: {
            type: String,
            enum: PROJECT_TASK_COST_HISTORY_FIELDS,
            required: true,
          },
          oldValue: mongoose.Schema.Types.Mixed,
          newValue: mongoose.Schema.Types.Mixed,
          changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          changedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
      validate: {
        validator: function (arr) {
          return (
            !Array.isArray(arr) ||
            arr.length <= (MAX_COST_HISTORY_ENTRIES || 200)
          );
        },
        message: "Cost history cannot exceed 200 entries",
      },
    },
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    toJSON: BaseTask.schema.options.toJSON,
    toObject: BaseTask.schema.options.toObject,
  }
);

// ==================== INDEXES ====================
ProjectTaskSchema.index(
  { organization: 1, department: 1, vendor: 1 },
  { partialFilterExpression: { isDeleted: false } }
);

ProjectTaskSchema.index(
  { organization: 1, department: 1, status: 1, priority: 1, dueDate: 1 },
  { partialFilterExpression: { isDeleted: false } }
);

// ==================== VALIDATION HOOKS ====================
ProjectTaskSchema.pre("save", async function (next) {
  try {
    const session = this.$session?.();

    // Validate vendor belongs to same organization
    if (this.isModified("vendor")) {
      const { Vendor } = await import("./Vendor.js");
      const vendor = await Vendor.findOne({
        _id: this.vendor,
        organization: this.organization,
        isDeleted: false,
      }).session(session);
      if (!vendor) {
        throw new Error(
          "Vendor must belong to the same organization as the task"
        );
      }
    }

    // Validate modifiedBy user belongs to same organization
    if (this.modifiedBy && this.isModified("modifiedBy")) {
      const { User } = await import("./User.js");
      const user = await User.findOne({
        _id: this.modifiedBy,
        organization: this.organization,
        isDeleted: false,
      }).session(session);
      if (!user) {
        throw new Error(
          "modifiedBy user must belong to the same organization as the task"
        );
      }
    }

    // Prevent currency changes when costs are set
    if (this.isModified("currency") && !this.isNew) {
      const hasCosts =
        (this.estimatedCost || 0) > 0 || (this.actualCost || 0) > 0;
      if (hasCosts) {
        throw new Error(
          "Cannot change currency once costs are set. Reset costs to zero first to change currency."
        );
      }
    }

    // Track cost history for audit trail
    if (
      this.isModified("estimatedCost") ||
      this.isModified("actualCost") ||
      this.isModified("currency")
    ) {
      const changedBy = this.modifiedBy || this.createdBy;
      if (!changedBy) {
        throw new Error("modifiedBy is required for cost tracking");
      }
      const history = this.costHistory || [];
      if (this.isModified("estimatedCost")) {
        history.push({
          fieldChanged: "estimatedCost",
          oldValue: this.getOriginal("estimatedCost"),
          newValue: this.estimatedCost,
          changedBy,
          changedAt: new Date(),
        });
      }
      if (this.isModified("actualCost")) {
        history.push({
          fieldChanged: "actualCost",
          oldValue: this.getOriginal("actualCost"),
          newValue: this.actualCost,
          changedBy,
          changedAt: new Date(),
        });
      }
      if (this.isModified("currency")) {
        history.push({
          fieldChanged: "currency",
          oldValue: this.getOriginal("currency"),
          newValue: this.currency,
          changedBy,
          changedAt: new Date(),
        });
      }
      this.costHistory = history;
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Initialize TTL index for cleanup after 180 days
ProjectTaskSchema.statics.initializeTTL = async function () {
  const { TTL_EXPIRY } = await import("../utils/constants.js");
  return this.ensureTTLIndex(TTL_EXPIRY.TASKS);
};

export const ProjectTask = BaseTask.discriminator(
  "ProjectTask",
  ProjectTaskSchema
);
export default ProjectTask;
