// backend/models/TaskComment.js
import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import softDeletePlugin from "./plugins/softDelete.js";
import {
  TASK_COMMENT_PARENT_MODELS,
  MAX_COMMENT_LENGTH,
  MAX_MENTIONS_PER_COMMENT,
  MAX_ATTACHMENTS_PER_ENTITY,
  MAX_COMMENT_THREADING_DEPTH,
} from "../utils/constants.js";

/**
 * TaskComment Schema - Hierarchical comment system supporting threading with mentions and attachments
 * Supports polymorphic relationships with tasks, activities, and other comments (for threading)
 */

const TaskCommentSchema = new mongoose.Schema(
  {
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "parentModel",
      required: [true, "Parent reference is required"],
    },
    parentModel: {
      type: String,
      required: [true, "Parent model is required"],
      enum: {
        values: TASK_COMMENT_PARENT_MODELS,
        message: "Invalid parent model",
      },
    },
    comment: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
      maxlength: [
        MAX_COMMENT_LENGTH,
        `Comment cannot exceed ${MAX_COMMENT_LENGTH} characters`,
      ],
    },
    mentions: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      validate: [
        {
          validator: (v) =>
            !Array.isArray(v) || v.length <= MAX_MENTIONS_PER_COMMENT,
          message: `You can only mention up to ${MAX_MENTIONS_PER_COMMENT} users`,
        },
        {
          validator: function (mentions) {
            if (!Array.isArray(mentions)) return true;
            const uniqueIds = new Set(mentions.map((id) => id.toString()));
            return uniqueIds.size === mentions.length;
          },
          message: "Duplicate mentions are not allowed",
        },
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
TaskCommentSchema.index(
  { organization: 1, department: 1, parentModel: 1, parent: 1, createdAt: -1 },
  { partialFilterExpression: { isDeleted: false } }
);

TaskCommentSchema.index(
  { organization: 1, createdBy: 1, createdAt: -1 },
  { partialFilterExpression: { isDeleted: false } }
);

TaskCommentSchema.index(
  { organization: 1, mentions: 1, createdAt: -1 },
  { partialFilterExpression: { isDeleted: false } }
);

TaskCommentSchema.index(
  { attachments: 1 },
  { partialFilterExpression: { isDeleted: false } }
);

TaskCommentSchema.index({ comment: "text" });

// ==================== VALIDATION HOOKS ====================
TaskCommentSchema.pre("save", async function (next) {
  try {
    const session = this.$session?.();

    // Validate mentioned users belong to same organization
    if (
      this.isModified("mentions") &&
      this.mentions &&
      this.mentions.length > 0
    ) {
      const { User } = await import("./User.js");
      const validUsers = await User.find({
        _id: { $in: this.mentions },
        organization: this.organization,
        isDeleted: false,
      }).session(session);
      if (validUsers.length !== this.mentions.length) {
        throw new Error(
          "All mentioned users must belong to the same organization"
        );
      }
    }

    // Validate attachments belong to this comment (if modified)
    if (this.isModified("attachments") && this.attachments?.length > 0) {
      const { Attachment } = await import("./Attachment.js");

      const validAttachments = await Attachment.find({
        _id: { $in: this.attachments },
        parent: this._id,
        parentModel: "TaskComment",
        isDeleted: false,
      }).session(session);

      if (validAttachments.length !== this.attachments.length) {
        throw new Error(
          "All referenced attachments must belong to this comment as parent"
        );
      }
    }

    // Handle comment threading validation
    if (this.parentModel === "TaskComment") {
      // Use efficient aggregation to fetch lineage in one round-trip
      const ancestry = await this.constructor
        .aggregate([
          { $match: { _id: this.parent, isDeleted: false } },
          {
            $graphLookup: {
              from: this.constructor.collection.name,
              startWith: "$_id",
              connectFromField: "_id",
              connectToField: "parent",
              as: "lineage",
              maxDepth: MAX_COMMENT_THREADING_DEPTH,
              restrictSearchWithMatch: {
                parentModel: "TaskComment",
                isDeleted: false,
              },
            },
          },
        ])
        .session(session);

      if (!ancestry.length) {
        throw new Error("Parent comment not found or has been deleted");
      }

      // Check for circular references and depth limits
      const visited = new Set([this._id?.toString()].filter(Boolean));
      let depth = 1;

      for (const ancestor of ancestry[0].lineage) {
        if (visited.has(ancestor._id.toString())) {
          throw new Error("Circular reference detected in comment threading");
        }
        visited.add(ancestor._id.toString());
        depth++;
      }

      if (depth > MAX_COMMENT_THREADING_DEPTH) {
        throw new Error(
          `Comment threading depth cannot exceed ${MAX_COMMENT_THREADING_DEPTH} levels`
        );
      }

      // Ensure parent comment belongs to same org/dept
      const parentComment = ancestry[0];
      if (
        parentComment.organization.toString() !==
          this.organization.toString() ||
        parentComment.department.toString() !== this.department.toString()
      ) {
        throw new Error(
          "Parent comment must belong to the same organization and department"
        );
      }
    } else {
      // Validate non-comment parent entities
      if (this.isModified("parent") || this.isModified("parentModel")) {
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
          default:
            throw new Error(`Invalid parent model: ${this.parentModel}`);
        }

        const parentEntity = await ParentModel.findOne({
          _id: this.parent,
          organization: this.organization,
          department: this.department,
          isDeleted: false,
        }).session(session);

        if (!parentEntity) {
          throw new Error(
            "Parent entity must belong to the same organization and department"
          );
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Plugins
softDeletePlugin(TaskCommentSchema);
TaskCommentSchema.plugin(mongoosePaginate);

// ==================== CASCADE SOFT DELETE ====================
TaskCommentSchema.statics.softDeleteByIdWithCascade = async function (
  commentId,
  { session, deletedBy } = {}
) {
  if (!session) {
    throw new Error("Soft delete must be performed within a transaction");
  }

  const comment = await this.findOne({ _id: commentId }).session(session);
  if (!comment) {
    throw new Error("Comment not found or already deleted");
  }

  const { Attachment } = await import("./Attachment.js");

  // Recursively delete child comments (threading)
  const children = await this.find({
    parent: commentId,
    parentModel: "TaskComment",
    isDeleted: false,
  }).session(session);

  for (const child of children) {
    await this.softDeleteByIdWithCascade(child._id, { session, deletedBy });
  }

  // Delete attachments belonging to this comment
  await Attachment.softDeleteMany(
    { parent: commentId, parentModel: "TaskComment" },
    { session, deletedBy }
  );

  // Finally, delete the comment itself
  await this.softDeleteById(commentId, { session, deletedBy });
};

TaskCommentSchema.statics.softDeleteManyCascade = async function (
  filter = {},
  { session, deletedBy, batchSize = 100 } = {}
) {
  if (!session) {
    throw new Error("Soft delete must be performed within a transaction");
  }

  const cursor = this.find({ ...filter, isDeleted: false })
    .session(session)
    .cursor({ batchSize });

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    await this.softDeleteByIdWithCascade(doc._id, { session, deletedBy });
  }
};

// Initialize TTL index for cleanup after 180 days
TaskCommentSchema.statics.initializeTTL = async function () {
  const { TTL_EXPIRY } = await import("../utils/constants.js");
  return this.ensureTTLIndex(TTL_EXPIRY.COMMENTS);
};

export const TaskComment = mongoose.model("TaskComment", TaskCommentSchema);
export default TaskComment;
