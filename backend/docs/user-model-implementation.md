> **Phase 1.1 - Task 10: User Model Implementation**
>
> This document describes the User model configuration and the changes made for production readiness.

## WHAT Exists

**Location:** `backend/models/User.js`

The `User` schema represents application users within an organization/department (multi-tenant). Key characteristics:

- Core identity fields: `firstName`, `lastName`, `position`, `email`, `role`
- Multi-tenant scoping: `organization` (ObjectId → Organization), `department` (ObjectId → Department)
- Security-critical fields:
  - `password` (bcrypt hashed, `select: false`)
  - `passwordResetToken`, `passwordResetExpires` (for reset flow, `select: false`)
- Profile fields:
  - `profilePicture` (Cloudinary URL + `publicId` with strict validation)
  - `skills` array with max length, unique names (case-insensitive) and percentage bounds
- Employment metadata: `employeeId`, `dateOfBirth`, `joinedAt`
- Preferences: `emailPreferences` sub-document for notification toggles
- Platform / multi-tenant flags:
  - `isPlatformUser` (derived from organization’s `isPlatformOrg`, immutable, indexed)
- Soft delete integration via `softDeletePlugin` (adds `isDeleted`, `deletedAt`, etc.)
- Pagination integration via `mongoose-paginate-v2`
- Indexes:
  - Unique `(organization, email)` with partial filter on `isDeleted: false`
  - Unique `(organization, employeeId)` for numeric `employeeId` with partial filter
  - TTL initialization via `initializeTTL()` using `TTL_EXPIRY.USERS`
- Cascade delete helper: `softDeleteByIdWithCascade` which soft-deletes all user-owned entities (tasks, activities, comments, attachments, materials, notifications) within a transaction and removes the user from task watchers

## WHY Change

Requirements from `backend/docs/codebase-requirements.md` and `.kiro/specs/production-readiness-validation/tasks.md` for the User model include:

- **Security & Auth (REQ-32, 46, 55, 101-105, 213-224)**
  - Passwords must be hashed with bcrypt (≥ 12 rounds) and never returned in API responses
  - Sensitive fields (password, reset tokens, refresh tokens, lockout state) must be excluded from default queries/JSON
  - Account lockout support via `failedLoginAttempts` and `lockUntil`
  - Refresh token storage for rotation and synchronized HTTP/Socket.IO auth
- **Multi-tenancy & Platform Organisation (REQ-100-105)**
  - `isPlatformUser` must derive from `Organization.isPlatformOrg` (not from env IDs)
  - `isHod` flag must exist for Head-of-Department, with uniqueness per department
- **Data Quality & Validation**
  - Optional but validated `phone` field
  - User presence/state tracking via `status` (online/offline/away)
- **Referential Integrity & Cascade Operations (REQ-29, 32, 33, 34)**
  - Deleting a user must cascade soft-delete related resources in a transaction

Without these changes, the system would lack a proper account lockout model, platform/HOD identification, and secure storage of long-lived refresh tokens.

## HOW It Was Implemented

### 1. Schema Fields (Security & Profile)

Added/updated fields:

```javascript
phone: {
  type: String,
  trim: true,
  validate: {
    validator: (v) => !v || PHONE_REGEX.test(v),
    message: "Phone number must be a valid E.164 number (e.g. +1234567890)",
  },
},
status: {
  type: String,
  enum: {
    values: ["online", "offline", "away"],
    message: "Status must be one of: online, offline, away",
  },
  default: "offline",
},
password: {
  // unchanged but enforced via bcrypt in pre-save hook
  select: false,
},
refreshToken: {
  type: String,
  select: false,
},
refreshTokenExpiry: {
  type: Date,
  select: false,
},
lastLogin: { type: Date },
failedLoginAttempts: {
  type: Number,
  default: 0,
  min: 0,
  select: false,
},
lockUntil: {
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
},
```

Rationale:

- `phone` – optional but validated with `PHONE_REGEX` from `utils/constants.js`
- `status` – explicit online presence field with a small, fixed enum
- `refreshToken` / `refreshTokenExpiry` – persist refresh tokens to support rotation/blacklisting (auth controller and middleware will use these in Phase 1.2)
- `lastLogin`, `failedLoginAttempts`, `lockUntil` – enable account lockout and login tracking
- `isPlatformUser` – remains derived from organization (see hook below)
- `isHod` – independent boolean flag for Head of Department semantics

### 2. JSON/Object Transforms (Sensitive Data Hiding)

`toJSON` and `toObject` transforms now remove all sensitive internal fields:

```javascript
transform: (doc, ret) => {
  delete ret.id;
  delete ret.__v;
  delete ret.password;
  delete ret.isDeleted;
  delete ret.deletedAt;
  delete ret.deletedBy;
  delete ret.passwordResetToken;
  delete ret.passwordResetExpires;
  delete ret.refreshToken;
  delete ret.refreshTokenExpiry;
  delete ret.failedLoginAttempts;
  delete ret.lockUntil;
  return ret;
},
```

This ensures API consumers never see password hashes, reset tokens, refresh tokens, or lockout state by default.

### 3. Password Hashing

The `pre('save')` hook hashes passwords using bcrypt with 12 rounds whenever `password` is modified:

```javascript
userSchema.pre("save", async function (next) {
  try {
    const session = this.$session?.();

    if (this.isNew && this.organization) {
      const { Organization } = await import("./Organization.js");
      const org = await Organization.findById(this.organization).session(
        session
      );
      this.isPlatformUser = org?.isPlatformOrg || false;
    }

    if (this.isModified("password")) {
      this.password = await bcrypt.hash(this.password, 12);
    }

    next();
  } catch (error) {
    next(error);
  }
});
```

The password reset token generation also now uses 12 rounds:

```javascript
userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = /* random string */;
  this.passwordResetToken = bcrypt.hashSync(resetToken, 12);
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return resetToken;
};
```

### 4. Platform User Derivation

`isPlatformUser` is **not** set from any environment variable. Instead, on creation it is derived from the organization document:

```javascript
if (this.isNew && this.organization) {
  const { Organization } = await import("./Organization.js");
  const org = await Organization.findById(this.organization).session(session);
  this.isPlatformUser = org?.isPlatformOrg || false;
}
```

This aligns with the requirement that platform identification uses `Organization.isPlatformOrg` instead of `PLATFORM_ORGANIZATION_ID`.

### 5. Head of Department (`isHod`) and Indexing

A partial unique index enforces a **single HOD per department** when `isHod` is `true` and the role is in `HEAD_OF_DEPARTMENT_ROLES`:

```javascript
userSchema.index(
  { department: 1 },
  {
    unique: true,
    partialFilterExpression: {
      role: { $in: HEAD_OF_DEPARTMENT_ROLES },
      isHod: true,
      isDeleted: false,
    },
  }
);
```

The cascade delete helper protects against deleting the last HOD in a department by checking `isHod` **and** role:

```javascript
if (
  userToDelete.isHod &&
  HEAD_OF_DEPARTMENT_ROLES.includes(userToDelete.role)
) {
  const hodCount = await this.countDocuments({
    organization: userToDelete.organization,
    department: userToDelete.department,
    role: { $in: HEAD_OF_DEPARTMENT_ROLES },
    isHod: true,
    _id: { $ne: userId },
    isDeleted: false,
  }).session(session);
  if (hodCount === 0) {
    throw new Error(
      "Cannot delete the last Head of Department (SuperAdmin/Admin) in this department"
    );
  }
}
```

This satisfies the requirement that HOD identification uses `isHod=true` combined with eligible roles.

### 6. Cascade Soft Delete

`softDeleteByIdWithCascade` remains the central user-level cascade helper and now respects the updated HOD semantics. It:

1. Prevents deleting the last `SuperAdmin` in an organization
2. Prevents deleting the last HOD (`isHod=true` and role in `HEAD_OF_DEPARTMENT_ROLES`) per department
3. Soft-deletes:
   - All tasks created by the user (via `BaseTask.softDeleteByIdWithCascade`)
   - All `TaskActivity` documents created by the user
   - All `TaskComment` documents created by the user (via `softDeleteManyCascade`)
   - All `Attachment` documents uploaded by the user
   - All `Material` documents added by the user
   - All `Notification` documents created by the user
4. Removes the user from any task `watchers` arrays

All operations require a MongoDB session, enforcing transactional integrity.

### 7. TTL Initialization

User documents use a TTL configured in `utils/constants.js`:

```javascript
userSchema.statics.initializeTTL = async function () {
  const { TTL_EXPIRY } = await import("../utils/constants.js");
  return this.ensureTTLIndex(TTL_EXPIRY.USERS);
};
```

`TTL_EXPIRY.USERS` is set to `365 * 24 * 60 * 60` seconds (365 days) and is implemented by the shared soft delete plugin.

## Tests

**Location:** `backend/tests/unit/userModel.test.js`

The unit tests verify:

1. **Password Hashing & Hiding**
   - Passwords are hashed before save and differ from the plain text
   - Hashes look like bcrypt hashes (start with `$2`)
   - `comparePassword` correctly validates the password
   - `toJSON()` output does not include the `password` field

2. **Default Values**
   - New users default to `status = "offline"`
   - `isHod` defaults to `false`

3. **HOD Uniqueness**
   - Creating a second user in the same department with `isHod = true` and role in `HEAD_OF_DEPARTMENT_ROLES` fails due to the unique index

Test helpers in `backend/tests/setup.js` were updated to:

- Create valid `Organization` documents (with `description`, `address`, `industry`)
- Create valid `Department` documents (with `description`)
- Create valid `User` documents (with `position`, `joinedAt`, and valid `role` defaulting to `"User"`)

## Summary

The User model is now aligned with the production-readiness requirements for:

- Secure password storage and reset token handling
- Hiding all sensitive authentication and lockout fields from API responses
- Proper multi-tenant scoping and platform user identification
- Head-of-Department semantics via `isHod` and role-based uniqueness per department
- Transactional cascade soft delete of user-owned data
- TTL-based cleanup of long-lived soft-deleted user records

Subsequent Phase 1 tasks (Auth controllers, Auth middleware, and property-based tests) will build on this model to implement refresh token rotation, account lockout flows, and additional behavioural guarantees.
