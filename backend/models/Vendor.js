// backend/models/Vendor.js
import mongoose from "mongoose";
import paginate from "mongoose-paginate-v2";
import validator from "validator";
import softDeletePlugin from "./plugins/softDelete.js";
import {
  MAX_VENDOR_NAME_LENGTH,
  MAX_EMAIL_LENGTH,
  PHONE_REGEX,
} from "../utils/constants.js";

/**
 * Vendor Schema - Represents external vendors for project tasks within organizations
 * Provides vendor contact information with uniqueness constraints per organization
 */

const VendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Vendor name is required"],
      trim: true,
      maxlength: [
        MAX_VENDOR_NAME_LENGTH,
        `Vendor name cannot exceed ${MAX_VENDOR_NAME_LENGTH} characters`,
      ],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return !v || validator.isEmail(v);
        },
        message: "Email must be a valid email address",
      },
      maxLength: [
        MAX_EMAIL_LENGTH,
        `Email must be less than ${MAX_EMAIL_LENGTH} characters`,
      ],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      validate: {
        validator: function (v) {
          return PHONE_REGEX.test(v);
        },
        message:
          "Phone number must be in E.164 format (0115171717, +251115171717, 0912140424, +251912140424)",
      },
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is required for vendor"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by is required for vendor"],
    },
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
VendorSchema.index(
  { organization: 1, name: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

VendorSchema.index(
  { organization: 1, phone: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

VendorSchema.index(
  { organization: 1, email: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

VendorSchema.index(
  { organization: 1, createdAt: -1 },
  { partialFilterExpression: { isDeleted: false } }
);

softDeletePlugin(VendorSchema);
VendorSchema.plugin(paginate);

// ==================== METHODS ====================
VendorSchema.statics.softDeleteByIdWithReassign = async function (
  vendorId,
  { reassignToVendorId, session, deletedBy } = {}
) {
  if (!session) {
    throw new Error("Vendor deletion must be performed within a transaction");
  }

  const vendor = await this.findOne({
    _id: vendorId,
    isDeleted: false,
  }).session(session);
  if (!vendor) {
    throw new Error("Vendor not found or already deleted");
  }

  const { ProjectTask } = await import("./ProjectTask.js");

  // Check if vendor is used in any active project tasks
  const activeTasks = await ProjectTask.find({
    vendor: vendorId,
    isDeleted: false,
  }).session(session);

  if (activeTasks.length > 0) {
    if (!reassignToVendorId) {
      throw new Error(
        `Cannot delete vendor "${vendor.name}" - it is assigned to ${activeTasks.length} active project task(s). Provide a 'reassignToVendorId' to reassign these tasks.`
      );
    }

    // Validate the replacement vendor
    const replacementVendor = await this.findOne({
      _id: reassignToVendorId,
      organization: vendor.organization, // Must be same organization
      isDeleted: false,
    }).session(session);

    if (!replacementVendor) {
      throw new Error(
        "Replacement vendor not found or does not belong to the same organization"
      );
    }

    if (replacementVendor._id.toString() === vendorId.toString()) {
      throw new Error("Cannot reassign to the same vendor being deleted");
    }

    // Reassign all project tasks to the new vendor
    await ProjectTask.updateMany(
      { vendor: vendorId, isDeleted: false },
      { $set: { vendor: reassignToVendorId } },
      { session }
    );
  }

  // Now safe to delete the vendor
  return this.softDeleteById(vendorId, { session, deletedBy });
};

VendorSchema.statics.restoreById = async function (vendorId, { session } = {}) {
  // Standard restoration - tasks that were reassigned stay with their current vendors
  return this.restoreById(vendorId, { session });
};

// Initialize TTL index for cleanup after 90 days
VendorSchema.statics.initializeTTL = async function () {
  const { TTL_EXPIRY } = await import("../utils/constants.js");
  return this.ensureTTLIndex(TTL_EXPIRY.VENDORS);
};

export const Vendor = mongoose.model("Vendor", VendorSchema);
export default Vendor;
