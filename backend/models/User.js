// backend/models/User.js
import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import bcrypt from "bcrypt";
import validator from "validator";
import softDeletePlugin from "./plugins/softDelete.js";
import {
  USER_ROLES,
  MAX_USER_NAME_LENGTH,
  MAX_POSITION_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_SKILLS_PER_USER,
  MAX_SKILL_NAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  EMPLOYEE_ID_MIN,
  EMPLOYEE_ID_MAX,
  SUPPORTED_IMAGE_EXTENSIONS,
  CLOUDINARY_DOMAINS,
  MIN_SKILL_PERCENTAGE,
  MAX_SKILL_PERCENTAGE,
  HEAD_OF_DEPARTMENT_ROLES,
  SUPER_ADMIN_ROLE,
  DEFAULT_USER_ROLE,
} from "../utils/constants.js";
import { isDateNotInFuture } from "../utils/helpers.js";

/**
 * User Schema - Represents users within organizations for the task management system
 * Provides user authentication, role-based access control, and profile management
 */

const profilePictureSchema = new mongoose.Schema(
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
          message: "Profile picture URL must be a valid HTTP or HTTPS URL",
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
            "Profile picture URL must be a valid image URL or Cloudinary URL",
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

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [
        MAX_USER_NAME_LENGTH,
        `First name cannot exceed ${MAX_USER_NAME_LENGTH} characters`,
      ],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [
        MAX_USER_NAME_LENGTH,
        `Last name cannot exceed ${MAX_USER_NAME_LENGTH} characters`,
      ],
    },
    position: {
      type: String,
      required: [true, "Position is required"],
      trim: true,
      maxlength: [
        MAX_POSITION_LENGTH,
        `Position cannot exceed ${MAX_POSITION_LENGTH} characters`,
      ],
    },
    role: {
      type: String,
      enum: {
        values: USER_ROLES,
        message: "Role must be SuperAdmin, Admin, Manager, or User",
      },
      default: DEFAULT_USER_ROLE,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => validator.isEmail(v),
        message: "Please provide a valid email address",
      },
      maxLength: [
        MAX_EMAIL_LENGTH,
        `Email must be less than ${MAX_EMAIL_LENGTH} characters`,
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [
        MIN_PASSWORD_LENGTH,
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      ],
      select: false,
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
    profilePicture: profilePictureSchema,
    skills: {
      type: [
        {
          skill: {
            type: String,
            trim: true,
            maxlength: [
              MAX_SKILL_NAME_LENGTH,
              `Skill cannot exceed ${MAX_SKILL_NAME_LENGTH} characters`,
            ],
          },
          percentage: {
            type: Number,
            min: [
              MIN_SKILL_PERCENTAGE,
              `Skill percentage must be between ${MIN_SKILL_PERCENTAGE} and ${MAX_SKILL_PERCENTAGE}`,
            ],
            max: [
              MAX_SKILL_PERCENTAGE,
              `Skill percentage must be between ${MIN_SKILL_PERCENTAGE} and ${MAX_SKILL_PERCENTAGE}`,
            ],
          },
        },
      ],
      validate: [
        {
          validator: function (skills) {
            return !skills || skills.length <= MAX_SKILLS_PER_USER;
          },
          message: `A user can have at most ${MAX_SKILLS_PER_USER} skills`,
        },
        {
          validator: function (skills) {
            if (!skills || skills.length === 0) return true;
            const skillNames = skills
              .map((s) => s.skill?.toLowerCase().trim())
              .filter(Boolean);
            return skillNames.length === new Set(skillNames).size;
          },
          message: "Skill names must be unique (case-insensitive)",
        },
      ],
    },
    employeeId: {
      type: Number,
      validate: {
        validator: (v) =>
          v == null ||
          (Number.isInteger(v) && v >= EMPLOYEE_ID_MIN && v <= EMPLOYEE_ID_MAX),
        message: `employeeId must be a 4-digit number between ${EMPLOYEE_ID_MIN.toString().padStart(
          4,
          "0"
        )} and ${EMPLOYEE_ID_MAX}`,
      },
    },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: function (v) {
          if (!v) return true;
          const birthDate = new Date(v);
          if (isNaN(birthDate.getTime())) return false;

          // Fixed: Use proper future date check
          return isDateNotInFuture(v);
        },
        message: "dateOfBirth cannot be in the future",
      },
    },
    joinedAt: {
      type: Date,
      required: [true, "The user date of joining is required"],
      validate: {
        validator: function (v) {
          if (!v) return true;
          const joinDate = new Date(v);
          if (isNaN(joinDate.getTime())) return false;

          // Fixed: Use proper future date check
          return isDateNotInFuture(v);
        },
        message: "joinedAt cannot be in the future",
      },
    },
    emailPreferences: {
      enabled: {
        type: Boolean,
        default: true,
      },
      taskNotifications: {
        type: Boolean,
        default: true,
      },
      taskReminders: {
        type: Boolean,
        default: true,
      },
      mentions: {
        type: Boolean,
        default: true,
      },
      announcements: {
        type: Boolean,
        default: true,
      },
      welcomeEmails: {
        type: Boolean,
        default: true,
      },
      passwordReset: {
        type: Boolean,
        default: true,
      },
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    isPlatformUser: {
      type: Boolean,
      default: false,
      immutable: true,
      index: true,
    },
    isHod: {
      type: Boolean,
      default: false,
      index: true,
      description: "Head of Department - SuperAdmin or Admin role with unique departmental position",
    },
    lastLogin: {
      type: Date,
      default: null,
      description: "Timestamp of user's last successful login",
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
        delete ret.password;
        delete ret.isDeleted;
        delete ret.deletedAt;
        delete ret.deletedBy;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.id;
        delete ret.__v;
        delete ret.password;
        delete ret.isDeleted;
        delete ret.deletedAt;
        delete ret.deletedBy;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        return ret;
      },
    },
  }
);

// ==================== INDEXES ====================
userSchema.index(
  { organization: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

userSchema.index(
  { department: 1 },
  {
    unique: true,
    partialFilterExpression: {
      role: { $in: HEAD_OF_DEPARTMENT_ROLES },
      isDeleted: false,
    },
  }
);

userSchema.index(
  { organization: 1, employeeId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      employeeId: { $type: "number" },
    },
  }
);

// ==================== VIRTUALS ====================
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ==================== HOOKS ====================
userSchema.pre("save", async function (next) {
  try {
    const session = this.$session?.();

    // Set isPlatformUser based on organization's isPlatformOrg
    if (this.isNew && this.organization) {
      const { Organization } = await import("./Organization.js");
      const org = await Organization.findById(this.organization).session(
        session
      );
      this.isPlatformUser = org?.isPlatformOrg || false;
    }

    // Set isHod based on role (Head of Department)
    if (this.isModified("role") || this.isNew) {
      this.isHod = HEAD_OF_DEPARTMENT_ROLES.includes(this.role);
    }

    // Hash password if modified
    if (this.isModified("password")) {
      this.password = await bcrypt.hash(this.password, 12);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// ==================== METHODS ====================
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) {
    throw new Error(
      "Password hash not selected. Query the user with '+password' to compare."
    );
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generatePasswordResetToken = function () {
  // Generate random token
  const resetToken =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36);

  // Hash token and set to passwordResetToken field
  this.passwordResetToken = bcrypt.hashSync(resetToken, 10);

  // Set expire time (1 hour)
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour

  // Return unhashed token
  return resetToken;
};

userSchema.methods.verifyPasswordResetToken = function (token) {
  // Check if token exists and hasn't expired
  if (!this.passwordResetToken || !this.passwordResetExpires) {
    return false;
  }

  if (Date.now() > this.passwordResetExpires) {
    return false;
  }

  // Compare token
  return bcrypt.compareSync(token, this.passwordResetToken);
};

userSchema.methods.clearPasswordResetToken = function () {
  this.passwordResetToken = undefined;
  this.passwordResetExpires = undefined;
};

softDeletePlugin(userSchema);
userSchema.plugin(mongoosePaginate);

// ==================== STATIC METHODS ====================
userSchema.statics.softDeleteByIdWithCascade = async function (
  userId,
  { session } = {}
) {
  if (!session)
    throw new Error("Soft delete must be performed within a transaction");
  const userToDelete = await this.findOne({ _id: userId }).session(session);
  if (!userToDelete) throw new Error("User not found or already deleted");

  // Protect against deleting the last SuperAdmin in organization
  if (userToDelete.role === SUPER_ADMIN_ROLE) {
    const superAdminCount = await this.countDocuments({
      organization: userToDelete.organization,
      role: SUPER_ADMIN_ROLE,
      _id: { $ne: userId },
      isDeleted: false,
    }).session(session);
    if (superAdminCount === 0) {
      throw new Error("Cannot delete the last SuperAdmin in the organization");
    }
  }

  // Protect against deleting the last Head of Department in department
  if (HEAD_OF_DEPARTMENT_ROLES.includes(userToDelete.role)) {
    const hodCount = await this.countDocuments({
      organization: userToDelete.organization,
      department: userToDelete.department,
      role: { $in: HEAD_OF_DEPARTMENT_ROLES },
      _id: { $ne: userId },
      isDeleted: false,
    }).session(session);
    if (hodCount === 0) {
      throw new Error(
        "Cannot delete the last Head of Department (SuperAdmin/Admin) in this department"
      );
    }
  }

  const { BaseTask } = await import("./BaseTask.js");
  const { TaskActivity } = await import("./TaskActivity.js");
  const { TaskComment } = await import("./TaskComment.js");
  const { Attachment } = await import("./Attachment.js");
  const { Material } = await import("./Material.js");
  const { Notification } = await import("./Notification.js");

  // Cascade delete related Tasks
  const tasksToDelete = await BaseTask.find({ createdBy: userId }).session(
    session
  );
  for (const task of tasksToDelete) {
    await BaseTask.softDeleteByIdWithCascade(task._id, { session });
  }

  // Cascade delete related TaskActivities
  await TaskActivity.softDeleteMany({ createdBy: userId }, { session });

  // Cascade delete related TaskComments
  await TaskComment.softDeleteManyCascade({ createdBy: userId }, { session });

  // Cascade delete related Attachments
  await Attachment.softDeleteMany({ uploadedBy: userId }, { session });

  // Cascade delete related Materials
  await Material.softDeleteMany({ addedBy: userId }, { session });

  // Cascade delete related Notifications
  await Notification.softDeleteMany({ createdBy: userId }, { session });

  // Remove user from task watchers
  await BaseTask.updateMany(
    {
      organization: userToDelete.organization,
      watchers: userId,
      isDeleted: false,
    },
    { $pull: { watchers: userId } },
    { session }
  );

  // Finally, delete the user itself
  await this.softDeleteById(userId, { session });
};

// Initialize TTL index for cleanup after 365 days
userSchema.statics.initializeTTL = async function () {
  const { TTL_EXPIRY } = await import("../utils/constants.js");
  return this.ensureTTLIndex(TTL_EXPIRY.USERS);
};

export const User = mongoose.model("User", userSchema);
export default User;
