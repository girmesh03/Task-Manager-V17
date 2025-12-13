// backend/models/Attachment.js
import mongoose from "mongoose";
import validator from "validator";
import softDeletePlugin from "./plugins/softDelete.js";
import {
  ATTACHMENT_TYPES,
  ATTACHMENT_PARENT_MODELS,
  MAX_FILENAME_LENGTH,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  MAX_DOCUMENT_SIZE,
  MAX_AUDIO_SIZE,
  MAX_OTHER_SIZE,
  CLOUDINARY_DOMAINS,
} from "../utils/constants.js";

/**
 * Attachment Schema - Manages file attachments for various entities in the task management system
 * Supports multiple file types with size validation and Cloudinary integration
 */

const AttachmentSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: [true, "Original file name is required"],
      trim: true,
      maxlength: [
        MAX_FILENAME_LENGTH,
        `File name cannot exceed ${MAX_FILENAME_LENGTH} characters`,
      ],
    },
    storedName: {
      type: String,
      trim: true,
      maxlength: [
        MAX_FILENAME_LENGTH,
        `Stored name cannot exceed ${MAX_FILENAME_LENGTH} characters`,
      ],
    },
    mimeType: {
      type: String,
      required: [true, "MIME type is required"],
      trim: true,
    },
    size: {
      type: Number,
      required: [true, "File size is required"],
      min: [0, "File size must be >= 0"],
      max: [
        MAX_OTHER_SIZE,
        `File size cannot exceed ${MAX_OTHER_SIZE / (1024 * 1024)}MB`,
      ],
      validate: {
        validator: function (v) {
          switch (this.type) {
            case "image":
              return v <= MAX_IMAGE_SIZE;
            case "video":
              return v <= MAX_VIDEO_SIZE;
            case "document":
              return v <= MAX_DOCUMENT_SIZE;
            case "audio":
              return v <= MAX_AUDIO_SIZE;
            default:
              return v <= MAX_OTHER_SIZE;
          }
        },
        message: function () {
          const limitsMB = {
            image: MAX_IMAGE_SIZE / (1024 * 1024),
            video: MAX_VIDEO_SIZE / (1024 * 1024),
            document: MAX_DOCUMENT_SIZE / (1024 * 1024),
            audio: MAX_AUDIO_SIZE / (1024 * 1024),
            other: MAX_OTHER_SIZE / (1024 * 1024),
          };
          return `File size exceeds limit for ${this.type} files (max: ${
            limitsMB[this.type]
          }MB)`;
        },
      },
    },
    type: {
      type: String,
      required: [true, "Attachment type is required"],
      enum: {
        values: ATTACHMENT_TYPES,
        message: "Invalid attachment type",
      },
    },
    url: {
      type: String,
      required: [true, "File URL is required"],
      validate: [
        {
          validator: (v) =>
            !!v &&
            validator.isURL(v, {
              protocols: ["http", "https"],
              require_protocol: true,
            }),
          message: "File URL must be a valid HTTP or HTTPS URL",
        },
        {
          validator: function (v) {
            try {
              const url = new URL(v);
              return CLOUDINARY_DOMAINS.some((domain) =>
                url.hostname.includes(domain)
              );
            } catch {
              return false;
            }
          },
          message: "File URL must be from a trusted Cloudinary domain",
        },
      ],
    },
    publicId: {
      type: String,
      required: [true, "Cloudinary publicId is required"],
      trim: true,
      validate: {
        validator: function (v) {
          // Validate publicId format (should not be empty and should be a valid string)
          return v && typeof v === "string" && v.length > 0 && v.length <= 255;
        },
        message:
          "Cloudinary publicId must be a valid non-empty string (max 255 characters)",
      },
    },
    format: { type: String, trim: true },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "parentModel",
      required: [true, "Parent reference is required"],
    },
    parentModel: {
      type: String,
      required: [true, "Parent model is required"],
      enum: {
        values: ATTACHMENT_PARENT_MODELS,
        message: "Invalid parent model",
      },
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization reference is required"],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Department reference is required"],
      ref: "Department",
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploader (uploadedBy) is required"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
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
      transform(doc, ret) {
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
AttachmentSchema.index(
  { organization: 1, department: 1, parentModel: 1, parent: 1, createdAt: -1 },
  { partialFilterExpression: { isDeleted: false } }
);

AttachmentSchema.index(
  { organization: 1, uploadedBy: 1, createdAt: -1 },
  { partialFilterExpression: { isDeleted: false } }
);

AttachmentSchema.index(
  { organization: 1, department: 1, type: 1 },
  { partialFilterExpression: { isDeleted: false } }
);

AttachmentSchema.index({ publicId: 1, isDeleted: 1 });

softDeletePlugin(AttachmentSchema);

// ==================== HOOKS ====================
AttachmentSchema.pre("save", async function (next) {
  try {
    const session = this.$session?.();

    if (this.isModified("uploadedBy") || this.isModified("organization")) {
      const { User } = await import("./User.js");
      const user = await User.findOne({
        _id: this.uploadedBy,
        organization: this.organization,
        isDeleted: false,
      }).session(session);
      if (!user) {
        throw new Error("Uploader must belong to the same organization");
      }
      // Always set department from uploader
      this.department = user.department;
    }

    if (
      this.isModified("parent") ||
      this.isModified("parentModel") ||
      this.isModified("organization")
    ) {
      let ParentModel;
      switch (this.parentModel) {
        case "RoutineTask":
        case "AssignedTask":
        case "ProjectTask":
          const { BaseTask } = await import("./BaseTask.js");
          ParentModel = BaseTask;
          break;
        case "TaskActivity":
          const { TaskActivity } = await import("./TaskActivity.js");
          ParentModel = TaskActivity;
          break;
        case "TaskComment":
          const { TaskComment } = await import("./TaskComment.js");
          ParentModel = TaskComment;
          break;
        default:
          throw new Error(`Invalid parent model: ${this.parentModel}`);
      }
      const parentEntity = await ParentModel.findOne({
        _id: this.parent,
        organization: this.organization,
        isDeleted: false,
      }).session(session);
      if (!parentEntity) {
        throw new Error("Parent entity must belong to the same organization");
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

AttachmentSchema.post("updateOne", async function () {
  const q = this.getQuery();
  const update = this.getUpdate() || {};
  const setObj = update.$set || {};
  if (setObj.isDeleted === true) {
    try {
      const doc = await this.model.findOne(q).withDeleted();
      if (doc?.publicId) {
        console.log(
          `Attachment soft-deleted - schedule Cloudinary cleanup for publicId: ${doc.publicId}`
        );

        // Schedule cleanup (this could be enhanced with a job queue in production)
        setTimeout(async () => {
          try {
            const { deleteFromCloudinary } = await import(
              "../services/cloudinaryService.js"
            );
            const result = await deleteFromCloudinary(doc.publicId);
            if (result.success) {
              console.log(
                `Successfully deleted file from Cloudinary: ${doc.publicId}`
              );
            } else {
              console.error(
                `Failed to delete file from Cloudinary: ${doc.publicId}`,
                result.error
              );
            }
          } catch (error) {
            console.error(
              `Error during Cloudinary cleanup for ${doc.publicId}:`,
              error
            );
          }
        }, 5000); // 5 second delay to allow for potential restoration
      }
    } catch (e) {
      console.error("Attachment post-update cleanup error:", e);
    }
  }
});

// ==================== METHODS ====================
AttachmentSchema.statics.softDeleteByIdWithCascade = async function (
  attachmentId,
  { session, deletedBy } = {}
) {
  await this.softDeleteById(attachmentId, { session, deletedBy });
};

// Initialize TTL index for cleanup after 30 days
AttachmentSchema.statics.initializeTTL = async function () {
  const { TTL_EXPIRY } = await import("../utils/constants.js");
  return this.ensureTTLIndex(TTL_EXPIRY.ATTACHMENTS);
};

// Validate Cloudinary URL and extract metadata
AttachmentSchema.statics.validateCloudinaryUrl = async function (url) {
  const { validateCloudinaryUrl } = await import(
    "../services/cloudinaryService.js"
  );
  return validateCloudinaryUrl(url);
};

// Extract metadata from Cloudinary URL
AttachmentSchema.statics.extractCloudinaryMetadata = async function (url) {
  const { extractCloudinaryMetadata } = await import(
    "../services/cloudinaryService.js"
  );
  return extractCloudinaryMetadata(url);
};

// Cleanup soft-deleted attachments from Cloudinary
AttachmentSchema.statics.cleanupSoftDeleted = async function (daysOld = 30) {
  const { cleanupSoftDeletedAttachments } = await import(
    "../services/cloudinaryService.js"
  );
  return cleanupSoftDeletedAttachments(daysOld);
};

// Get attachments by parent with secure access validation
AttachmentSchema.statics.getByParentSecure = async function (
  parentId,
  parentModel,
  organizationId,
  options = {}
) {
  const query = {
    parent: parentId,
    parentModel,
    organization: organizationId,
    isDeleted: false,
  };

  if (options.type) {
    query.type = options.type;
  }

  const attachments = await this.find(query)
    .populate("uploadedBy", "firstName lastName email")
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);

  return attachments;
};

// Bulk soft delete attachments by parent
AttachmentSchema.statics.bulkSoftDeleteByParent = async function (
  parentId,
  parentModel,
  organizationId,
  { session, deletedBy } = {}
) {
  const attachments = await this.find({
    parent: parentId,
    parentModel,
    organization: organizationId,
    isDeleted: false,
  }).session(session);

  const updatePromises = attachments.map((attachment) =>
    this.softDeleteById(attachment._id, { session, deletedBy })
  );

  await Promise.all(updatePromises);

  return {
    deletedCount: attachments.length,
    deletedIds: attachments.map((att) => att._id),
  };
};

// Validate file access permissions
AttachmentSchema.methods.validateAccess = async function (
  userId,
  userRole,
  userOrganization
) {
  // Check organization access
  if (!this.organization.equals(userOrganization)) {
    return { hasAccess: false, reason: "Organization mismatch" };
  }

  // Check if user is the uploader
  if (this.uploadedBy.equals(userId)) {
    return { hasAccess: true, reason: "Owner access" };
  }

  // Check if user has admin privileges
  const { HEAD_OF_DEPARTMENT_ROLES } = await import("../utils/constants.js");
  if (HEAD_OF_DEPARTMENT_ROLES.includes(userRole)) {
    return { hasAccess: true, reason: "Admin access" };
  }

  // For other users, check if they have access to the parent entity
  // This would need to be implemented based on the parent model's access rules
  return { hasAccess: true, reason: "Default access" }; // Simplified for now
};

export const Attachment = mongoose.model("Attachment", AttachmentSchema);
export default Attachment;
