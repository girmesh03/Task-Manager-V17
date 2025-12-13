// backend/models/Notification.js
import mongoose from "mongoose";
import softDeletePlugin from "./plugins/softDelete.js";
import mongoosePaginate from "mongoose-paginate-v2";
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITY_MODELS,
  MAX_NOTIFICATION_TITLE_LENGTH,
  MAX_NOTIFICATION_MESSAGE_LENGTH,
  NOTIFICATION_EXPIRY_DAYS,
  MAX_RECIPIENTS_PER_NOTIFICATION,
} from "../utils/constants.js";

/**
 * Notification Schema - Manages system notifications for task activities and events
 * Provides notification delivery with read tracking and automatic expiration
 */

const NotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, "Notification type is required"],
      enum: {
        values: NOTIFICATION_TYPES,
        message: "Invalid notification type",
      },
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      maxlength: [
        MAX_NOTIFICATION_TITLE_LENGTH,
        `Title cannot exceed ${MAX_NOTIFICATION_TITLE_LENGTH} characters`,
      ],
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      maxlength: [
        MAX_NOTIFICATION_MESSAGE_LENGTH,
        `Message cannot exceed ${MAX_NOTIFICATION_MESSAGE_LENGTH} characters`,
      ],
    },
    entity: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "entityModel",
    },
    entityModel: {
      type: String,
      enum: {
        values: NOTIFICATION_ENTITY_MODELS,
        message: "Invalid entity model",
      },
    },
    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "At least one recipient is required"],
      },
    ],
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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
    sentAt: { type: Date, required: true, default: Date.now },
    emailDelivery: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      attempts: { type: Number, default: 0 },
      lastAttemptAt: { type: Date },
      error: { type: String },
      emailId: { type: String }, // For tracking email service queue ID
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
NotificationSchema.index(
  { organization: 1, recipients: 1, sentAt: -1 },
  { partialFilterExpression: { isDeleted: false } }
);

NotificationSchema.index(
  { organization: 1, department: 1, type: 1 },
  { partialFilterExpression: { isDeleted: false } }
);

NotificationSchema.index(
  { organization: 1, entityModel: 1, entity: 1 },
  { partialFilterExpression: { isDeleted: false } }
);

NotificationSchema.index(
  { organization: 1, createdBy: 1, sentAt: -1 },
  { partialFilterExpression: { isDeleted: false } }
);

NotificationSchema.index(
  { sentAt: -1 },
  { partialFilterExpression: { isDeleted: false } }
);

// TTL index for automatic cleanup after NOTIFICATION_EXPIRY_DAYS days
NotificationSchema.index(
  { deletedAt: 1 },
  { expireAfterSeconds: NOTIFICATION_EXPIRY_DAYS * 24 * 60 * 60 }
);

// ==================== VALIDATIONS ====================
NotificationSchema.path("recipients").validate({
  validator: (v) =>
    !Array.isArray(v) || v.length <= MAX_RECIPIENTS_PER_NOTIFICATION,
  message: `Recipients cannot exceed ${MAX_RECIPIENTS_PER_NOTIFICATION} users`,
});

NotificationSchema.path("readBy").validate({
  validator: (v) =>
    !Array.isArray(v) || v.length <= MAX_RECIPIENTS_PER_NOTIFICATION,
  message: `Read-by entries cannot exceed ${MAX_RECIPIENTS_PER_NOTIFICATION}`,
});

softDeletePlugin(NotificationSchema);
NotificationSchema.plugin(mongoosePaginate);

// ==================== METHODS ====================
NotificationSchema.statics.ensureTTLIndex = async function () {
  await this.db.collection(this.collection.name).createIndex(
    { deletedAt: 1 },
    {
      expireAfterSeconds: NOTIFICATION_EXPIRY_DAYS * 24 * 60 * 60,
      background: true,
    }
  );
};

// Initialize TTL index for cleanup after 30 days
NotificationSchema.statics.initializeTTL = async function () {
  const { TTL_EXPIRY } = await import("../utils/constants.js");
  return this.ensureTTLIndex(TTL_EXPIRY.NOTIFICATIONS);
};

export const Notification = mongoose.model("Notification", NotificationSchema);
export default Notification;
