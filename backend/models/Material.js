// backend/models/Material.js
import mongoose from "mongoose";
import paginate from "mongoose-paginate-v2";
import softDeletePlugin from "./plugins/softDelete.js";
import {
  MATERIAL_CATEGORIES,
  MATERIAL_UNIT_TYPES,
  MAX_MATERIAL_NAME_LENGTH,
  MAX_MATERIAL_PRICE,
} from "../utils/constants.js";

/**
 * Material Schema - Tracks materials used in task activities and routine tasks
 * Provides material usage tracking with price management and unit management
 */

const MaterialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Material name is required"],
      trim: true,
      maxlength: [
        MAX_MATERIAL_NAME_LENGTH,
        `Material name cannot exceed ${MAX_MATERIAL_NAME_LENGTH} characters`,
      ],
    },
    unit: {
      type: String,
      required: [true, "Unit of measurement is required"],
      enum: {
        values: MATERIAL_UNIT_TYPES,
        message: "Invalid measurement unit",
      },
    },
    price: {
      type: Number,
      required: [true, "Price per unit is required"],
      min: [0, "Price cannot be negative"],
      validate: {
        validator: function (v) {
          return v >= 0 && v <= MAX_MATERIAL_PRICE;
        },
        message: `Price must be between 0 and ${MAX_MATERIAL_PRICE.toLocaleString()}`,
      },
    },
    category: {
      type: String,
      required: [true, "Material category is required"],
      enum: {
        values: MATERIAL_CATEGORIES,
        message: "Invalid material category",
      },
      default: "Other",
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
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "addedBy is required"],
    },
    deletionReferences: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
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
MaterialSchema.index(
  { organization: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

MaterialSchema.index(
  { organization: 1, department: 1, category: 1, createdAt: -1 },
  { partialFilterExpression: { isDeleted: false } }
);

MaterialSchema.index(
  { organization: 1, addedBy: 1, createdAt: -1 },
  { partialFilterExpression: { isDeleted: false } }
);

MaterialSchema.index(
  { organization: 1, name: "text" },
  { partialFilterExpression: { isDeleted: false } }
);

// ==================== VIRTUALS ====================
MaterialSchema.virtual("isUsed").get(function () {
  return false;
});

// ==================== HOOKS ====================
MaterialSchema.pre("save", async function (next) {
  try {
    const session = this.$session?.();

    if (
      this.isModified("addedBy") ||
      this.isModified("organization") ||
      this.isModified("department")
    ) {
      const { User } = await import("./User.js");
      const user = await User.findOne({
        _id: this.addedBy,
        organization: this.organization,
        department: this.department,
        isDeleted: false,
      }).session(session);

      if (!user) {
        throw new Error(
          "Material creator must belong to the same organization and department"
        );
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

MaterialSchema.pre("save", function (next) {
  if (this.isModified("isDeleted") && this.isDeleted) {
    console.log(`Material ${this._id} is being soft deleted`);
  }
  next();
});

// ==================== STATIC METHODS ====================
MaterialSchema.statics.findByOrganization = function (
  organizationId,
  options = {}
) {
  const { page = 1, limit = 10, category, search } = options;

  let query = {
    organization: organizationId,
    isDeleted: false,
  };

  if (category) query.category = category;
  if (search) query.name = { $regex: search, $options: "i" };

  return this.paginate(query, {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: ["addedBy", "department"],
  });
};

MaterialSchema.statics.canDelete = async function (materialId) {
  return true;
};

// ==================== UPDATED DELETION METHODS (REMOVED REDUNDANCY) ====================
MaterialSchema.statics.softDeleteByIdWithUnlink = async function (
  materialId,
  { session, deletedBy } = {}
) {
  if (!session) {
    throw new Error("Material deletion must be performed within a transaction");
  }

  const material = await this.findOne({
    _id: materialId,
    isDeleted: false,
  }).session(session);
  if (!material) {
    throw new Error("Material not found or already deleted");
  }

  const { RoutineTask } = await import("./RoutineTask.js");
  const { TaskActivity } = await import("./TaskActivity.js");

  // Store reference data for potential restoration
  const referenceData = {
    routineTasks: [],
    taskActivities: [],
  };

  // Find and store RoutineTask references
  const routineTasks = await RoutineTask.find({
    "materials.material": materialId,
    isDeleted: false,
  }).session(session);

  for (const task of routineTasks) {
    const materialItem = task.materials.find(
      (m) => m.material.toString() === materialId.toString()
    );
    if (materialItem) {
      referenceData.routineTasks.push({
        taskId: task._id,
        materialData: { ...materialItem.toObject() },
      });
    }
  }

  // Find and store TaskActivity references
  const taskActivities = await TaskActivity.find({
    "materials.material": materialId,
    isDeleted: false,
  }).session(session);

  for (const activity of taskActivities) {
    const materialItem = activity.materials.find(
      (m) => m.material.toString() === materialId.toString()
    );
    if (materialItem) {
      referenceData.taskActivities.push({
        activityId: activity._id,
        materialData: { ...materialItem.toObject() },
      });
    }
  }

  // Use dedicated methods from RoutineTask and TaskActivity to remove materials (NO REDUNDANCY)
  await RoutineTask.removeMaterialFromAllTasks(materialId, { session });
  await TaskActivity.removeMaterialFromAllActivities(materialId, { session });

  // Store reference data and delete material
  const updateFields = {
    isDeleted: true,
    deletedAt: new Date(),
    deletionReferences: referenceData,
  };

  if (deletedBy) updateFields.deletedBy = deletedBy;

  return this.updateOne(
    { _id: materialId },
    { $set: updateFields },
    { session }
  );
};

MaterialSchema.statics.restoreByIdWithRelink = async function (
  materialId,
  { session } = {}
) {
  if (!session) {
    throw new Error(
      "Material restoration must be performed within a transaction"
    );
  }

  const material = await this.findOne({
    _id: materialId,
    isDeleted: true,
  }).session(session);
  if (!material) {
    throw new Error("Material not found or not deleted");
  }

  const { RoutineTask } = await import("./RoutineTask.js");
  const { TaskActivity } = await import("./TaskActivity.js");

  const referenceData = material.deletionReferences || {
    routineTasks: [],
    taskActivities: [],
  };

  // Restore links to RoutineTasks using stored references
  for (const ref of referenceData.routineTasks) {
    await RoutineTask.addMaterialToTask(
      ref.taskId,
      {
        material: materialId,
        quantity: ref.materialData.quantity,
        unitPrice: ref.materialData.unitPrice,
        totalCost: ref.materialData.totalCost,
      },
      { session }
    );
  }

  // Restore links to TaskActivities using stored references
  for (const ref of referenceData.taskActivities) {
    await TaskActivity.addMaterialToActivity(
      ref.activityId,
      {
        material: materialId,
        quantity: ref.materialData.quantity,
        unitPrice: ref.materialData.unitPrice,
        totalCost: ref.materialData.totalCost,
      },
      { session }
    );
  }

  // Restore material and clear reference data
  return this.updateOne(
    { _id: materialId },
    {
      $set: { isDeleted: false },
      $unset: {
        deletedAt: 1,
        deletedBy: 1,
        deletionReferences: 1,
      },
    },
    { session }
  );
};

softDeletePlugin(MaterialSchema);
MaterialSchema.plugin(paginate);

// Initialize TTL index for cleanup after 90 days
MaterialSchema.statics.initializeTTL = async function () {
  const { TTL_EXPIRY } = await import("../utils/constants.js");
  return this.ensureTTLIndex(TTL_EXPIRY.MATERIALS);
};

export const Material = mongoose.model("Material", MaterialSchema);
export default Material;
