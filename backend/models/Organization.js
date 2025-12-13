// backend/models/Organization.js
import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import validator from "validator";
import softDeletePlugin from "./plugins/softDelete.js";
import {
  SUPPORTED_IMAGE_EXTENSIONS,
  CLOUDINARY_DOMAINS,
  VALID_INDUSTRIES,
  MAX_ORG_NAME_LENGTH,
  MAX_ORG_DESCRIPTION_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_ADDRESS_LENGTH,
  MAX_INDUSTRY_LENGTH,
  PHONE_REGEX,
} from "../utils/constants.js";

/**
 * Organization Schema - Represents tenant organizations in the multi-tenant task management system
 * Provides organizational structure with contact information and industry categorization
 */

const logoUrlSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      validate: [
        {
          validator: (v) =>
            !v ||
            validator.isURL(v, {
              protocols: ["http", "https"],
              require_protocol: true,
            }),
          message: "Logo URL must be a valid HTTP or HTTPS URL",
        },
        {
          validator: async function (v) {
            if (!v) return true;
            try {
              const url = new URL(v);
              const hasImageExtension = SUPPORTED_IMAGE_EXTENSIONS.some((ext) =>
                url.pathname.toLowerCase().includes(ext)
              );
              return (
                CLOUDINARY_DOMAINS.some((domain) =>
                  url.hostname.includes(domain)
                ) || hasImageExtension
              );
            } catch (error) {
              return false;
            }
          },
          message:
            "Logo URL must be a valid image URL from a trusted hosting service",
        },
      ],
    },
    publicId: {
      type: String,
      required: [true, "Cloudinary publicId is required"],
      trim: true,
    },
  },
  { _id: false }
);

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      lowercase: true,
      trim: true,
      maxlength: [
        MAX_ORG_NAME_LENGTH,
        `Organization name cannot exceed ${MAX_ORG_NAME_LENGTH} characters`,
      ],
    },
    description: {
      type: String,
      required: [true, "Organization description is required"],
      trim: true,
      maxlength: [
        MAX_ORG_DESCRIPTION_LENGTH,
        `Description cannot exceed ${MAX_ORG_DESCRIPTION_LENGTH} characters`,
      ],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      required: [true, "Organization email is required"],
      validate: {
        validator: (v) => validator.isEmail(v),
        message: "Please provide a valid email address",
      },
      maxLength: [
        MAX_EMAIL_LENGTH,
        `Email must be less than ${MAX_EMAIL_LENGTH} characters`,
      ],
    },
    phone: {
      type: String,
      trim: true,
      required: [true, "Organization phone number is required"],
      validate: {
        validator: (v) => PHONE_REGEX.test(v),
        message:
          "Phone number must be in E.164 format (+2510123456789, +251123456789 or 0123456789)",
      },
    },
    address: {
      type: String,
      trim: true,
      required: [true, "Organization address is required"],
      maxlength: [
        MAX_ADDRESS_LENGTH,
        `Address cannot exceed ${MAX_ADDRESS_LENGTH} characters`,
      ],
    },
    industry: {
      type: String,
      trim: true,
      required: [true, "Organization industry is required"],
      maxlength: [
        MAX_INDUSTRY_LENGTH,
        `Industry cannot exceed ${MAX_INDUSTRY_LENGTH} characters`,
      ],
      validate: {
        validator: function (v) {
          if (!v) return false;
          return VALID_INDUSTRIES.some(
            (industry) => industry.toLowerCase() === v.trim().toLowerCase()
          );
        },
        message:
          "Industry must be from the predefined list of valid industries",
      },
    },
    logoUrl: logoUrlSchema,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isPlatformOrg: {
      type: Boolean,
      default: false,
      immutable: true,
      index: true,
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
organizationSchema.index(
  { name: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

organizationSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

organizationSchema.index(
  { phone: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

// Apply plugins
organizationSchema.plugin(softDeletePlugin);
organizationSchema.plugin(mongoosePaginate);

// ==================== HOOKS ====================
organizationSchema.pre("save", async function (next) {
  try {
    const session = this.$session?.();

    // NOTE: isPlatformOrg should be set explicitly when creating the platform organization
    // Requirements 106, 108: Do NOT use PLATFORM_ORGANIZATION_ID environment variable

    if (this.createdBy) {
      const { User } = await import("./User.js");

      const user = await User.findOne({
        _id: this.createdBy,
        organization: this._id,
        isDeleted: false,
      }).session(session);

      if (!this.isNew && !user) {
        throw new Error("createdBy user must belong to this organization");
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// ==================== METHODS ====================
organizationSchema.statics.softDeleteByIdWithCascade = async function (
  organizationId,
  { session } = {}
) {
  if (!session) {
    throw new Error("Soft delete must be performed within a transaction");
  }

  const org = await this.findOne({ _id: organizationId }).session(session);
  if (!org) {
    throw new Error("Organization not found or already deleted");
  }

  // CRITICAL: Protect platform organization from deletion (Property 8)
  // Requirements: 106, 108, 149
  if (org.isPlatformOrg === true) {
    throw new Error(
      "Platform organization cannot be deleted. This is the main system organization and must remain active."
    );
  }

  // Import models dynamically to avoid circular dependencies
  const { Department } = await import("./Department.js");
  const { User } = await import("./User.js");
  const { BaseTask } = await import("./BaseTask.js");
  const { TaskActivity } = await import("./TaskActivity.js");
  const { TaskComment } = await import("./TaskComment.js");
  const { Attachment } = await import("./Attachment.js");
  const { Material } = await import("./Material.js");
  const { Notification } = await import("./Notification.js");
  const { Vendor } = await import("./Vendor.js");

  // 1. Soft delete all departments in this organization
  const departments = await Department.find({
    organization: organizationId,
  }).session(session);
  for (const dept of departments) {
    await Department.softDeleteByIdWithCascade(dept._id, { session });
  }

  // 2. Soft delete all users in this organization (safety, in case any remain)
  const users = await User.find({ organization: organizationId }).session(
    session
  );
  for (const u of users) {
    await User.softDeleteByIdWithCascade(u._id, { session });
  }

  // 3. Soft delete all tasks in this organization (safety)
  const tasks = await BaseTask.find({ organization: organizationId }).session(
    session
  );
  for (const t of tasks) {
    await BaseTask.softDeleteByIdWithCascade(t._id, { session });
  }

  // 4. Soft delete all other entities in this organization
  await TaskActivity.softDeleteMany(
    { organization: organizationId },
    { session }
  );
  await TaskComment.softDeleteManyCascade(
    { organization: organizationId },
    { session }
  );
  await Attachment.softDeleteMany(
    { organization: organizationId },
    { session }
  );
  await Material.softDeleteMany({ organization: organizationId }, { session });
  await Notification.softDeleteMany(
    { organization: organizationId },
    { session }
  );
  await Vendor.softDeleteMany({ organization: organizationId }, { session });

  // 5. Finally, soft delete the organization
  await this.softDeleteById(organizationId, { session });
};

// Organizations should NEVER be auto-deleted (TTL = null)
organizationSchema.statics.initializeTTL = async function () {
  const { TTL_EXPIRY } = await import("../utils/constants.js");
  return this.ensureTTLIndex(TTL_EXPIRY.ORGANIZATIONS);
};

export const Organization = mongoose.model("Organization", organizationSchema);
export default Organization;
