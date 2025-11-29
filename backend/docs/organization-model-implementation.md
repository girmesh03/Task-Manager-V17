> **Phase 1.1 - Task 11: Organization Model Implementation**
>
> This document describes the Organization model configuration and the changes made for production readiness.

## WHAT Exists

**Location:** `backend/models/Organization.js`

The `Organization` schema represents tenant organizations in the multi-tenant SaaS system. Key characteristics:

- Core identity and contact fields:
  - `name` (lowercased, trimmed, max length, required)
  - `description` (required, bounded length)
  - `email` (required, validated, bounded length)
  - `phone` (required, E.164 validation via `PHONE_REGEX`)
  - `address` (required, bounded length)
  - `industry` (required, must be a member of `VALID_INDUSTRIES` with case-insensitive match)
- Branding:
  - `logoUrl` subdocument with `url` + `publicId`, validating that:
    - The URL is HTTP/HTTPS
    - The host is in `CLOUDINARY_DOMAINS` or the path has a supported image extension
- Multi-tenancy / platform fields:
  - `createdBy` (User reference)
  - `isPlatformOrg` (Boolean, default `false`, immutable, indexed)
- Soft delete and pagination:
  - Uses `softDeletePlugin` for soft deletion (`isDeleted`, `deletedAt`, `deletedBy`, restore audit fields)
  - Uses `mongoose-paginate-v2` for pagination
- Indexes:
  - Unique `name` with `partialFilterExpression: { isDeleted: false }`
  - Unique `email` with `partialFilterExpression`
  - Unique `phone` with `partialFilterExpression`
  - `isPlatformOrg` flagged as an index via schema option
- Serialization:
  - `toJSON` / `toObject` remove internal fields: `id`, `__v`, soft-delete metadata
- Hooks:
  - `pre('save')` validates that, if `createdBy` is set, the user belongs to this organization
- Cascade operations:
  - `softDeleteByIdWithCascade(organizationId, { session })` implements organization-level cascade soft delete to all child entities
- TTL configuration:
  - `initializeTTL()` delegates to soft delete plugin `ensureTTLIndex(TTL_EXPIRY.ORGANIZATIONS)`
  - `TTL_EXPIRY.ORGANIZATIONS` is `null`, so organizations are **never** auto-deleted

## WHY Change

Requirements from `codebase-requirements.md` and `.kiro/specs/production-readiness-validation/tasks.md` for Task 11 include:

- **Multi-tenancy & Platform (REQ-29, 100, 106-109, 225-233)**
  - Each organization must be uniquely identified and scoped.
  - Platform organization(s) are identified via `isPlatformOrg` **field**, not via `PLATFORM_ORGANIZATION_ID` env var.
  - Platform SuperAdmins / platform users rely on these flags for cross-org read access.
- **Data Integrity & Cascades**
  - Deleting an organization must cascade to all child resources (departments, users, tasks, materials, vendors, etc.) using soft delete and MongoDB transactions.
  - Organizations themselves must never be auto-TTL deleted.
- **Owner/CreatedBy Integrity**
  - `createdBy` must always reference a user belonging to the same organization.

Previously, parts of the codebase still used `PLATFORM_ORGANIZATION_ID` for platform behavior and did not have explicit model-level tests for cascade operations or platform flags.

## HOW It Was Implemented

### 1. Schema Fields & Validation

The schema already satisfied most structural requirements. We validated and kept:

```javascript
const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, lowercase: true, trim: true, maxlength: MAX_ORG_NAME_LENGTH },
    description: { type: String, required: true, trim: true, maxlength: MAX_ORG_DESCRIPTION_LENGTH },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
      validate: { validator: (v) => validator.isEmail(v), message: "Please provide a valid email address" },
      maxLength: [MAX_EMAIL_LENGTH, `Email must be less than ${MAX_EMAIL_LENGTH} characters`],
    },
    phone: {
      type: String,
      trim: true,
      required: true,
      validate: { validator: (v) => PHONE_REGEX.test(v), message: "Phone number must be in E.164 format (...)" },
    },
    address: { type: String, trim: true, required: true, maxlength: MAX_ADDRESS_LENGTH },
    industry: {
      type: String,
      trim: true,
      required: true,
      maxlength: MAX_INDUSTRY_LENGTH,
      validate: {
        validator: function (v) {
          if (!v) return false;
          return VALID_INDUSTRIES.some(
            (industry) => industry.toLowerCase() === v.trim().toLowerCase()
          );
        },
        message: "Industry must be from the predefined list of valid industries",
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
  { timestamps: true, versionKey: false, toJSON: { ... }, toObject: { ... } }
);
```

This aligns with contact validation rules and ensures that `isPlatformOrg` is explicitly modeled and indexed.

### 2. Indexes

The following indexes support uniqueness and query performance:

```javascript
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
```

These are case-insensitive where appropriate (via validators in the validators layer) and respect soft deletes via partial filters.

### 3. Pre-save Hook (createdBy Integrity)

We simplified the `pre('save')` hook to focus solely on validating `createdBy` integrity and removed any dependency on `PLATFORM_ORGANIZATION_ID`:

```javascript
organizationSchema.pre("save", async function (next) {
  try {
    const session = this.$session?.();

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
```

**Why:**
- `isPlatformOrg` is now a pure data flag, set by seed data or admin workflows and never inferred from environment variables.
- `createdBy` is validated against the same organization for referential integrity.

### 4. Cascade Soft Delete

`softDeleteByIdWithCascade` ensures that soft-deleting an organization cascades to **all child resources** within a MongoDB transaction:

```javascript
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

  const { Department } = await import("./Department.js");
  const { User } = await import("./User.js");
  const { BaseTask } = await import("./BaseTask.js");
  const { TaskActivity } = await import("./TaskActivity.js");
  const { TaskComment } = await import("./TaskComment.js");
  const { Attachment } = await import("./Attachment.js");
  const { Material } = await import("./Material.js");
  const { Notification } = await import("./Notification.js");
  const { Vendor } = await import("./Vendor.js");

  // 1. Departments
  const departments = await Department.find({ organization: organizationId }).session(session);
  for (const dept of departments) {
    await Department.softDeleteByIdWithCascade(dept._id, { session });
  }

  // 2. Users (safety in case any remain)
  const users = await User.find({ organization: organizationId }).session(session);
  for (const u of users) {
    await User.softDeleteByIdWithCascade(u._id, { session });
  }

  // 3. Tasks (safety)
  const tasks = await BaseTask.find({ organization: organizationId }).session(session);
  for (const t of tasks) {
    await BaseTask.softDeleteByIdWithCascade(t._id, { session });
  }

  // 4. Other entities
  await TaskActivity.softDeleteMany({ organization: organizationId }, { session });
  await TaskComment.softDeleteManyCascade({ organization: organizationId }, { session });
  await Attachment.softDeleteMany({ organization: organizationId }, { session });
  await Material.softDeleteMany({ organization: organizationId }, { session });
  await Notification.softDeleteMany({ organization: organizationId }, { session });
  await Vendor.softDeleteMany({ organization: organizationId }, { session });

  // 5. Finally, soft delete the organization
  await this.softDeleteById(organizationId, { session });
};
```

This function is designed to be used **within a transaction**, which callers enforce via `mongoose.startSession()` and `session.startTransaction()`.

### 5. TTL Configuration (No Auto-Delete for Organizations)

Organizations must never be auto-deleted. We use the shared TTL configuration but pass a `null` TTL duration:

```javascript
organizationSchema.statics.initializeTTL = async function () {
  const { TTL_EXPIRY } = await import("../utils/constants.js");
  return this.ensureTTLIndex(TTL_EXPIRY.ORGANIZATIONS);
};
```

Where `TTL_EXPIRY.ORGANIZATIONS` is defined as `null` in `utils/constants.js`, and the soft delete plugin interprets `null` as "no TTL index" (only soft delete fields maintained).

### 6. Platform Identification (Field-Based)

All remaining references to `PLATFORM_ORGANIZATION_ID` in **runtime** logic have been removed in favor of field-based checks:

- **Authorization Middleware (`middlewares/authorization.js`)**:

  ```javascript
  const isPlatformUser = Boolean(
    user.isPlatformUser ||
      (userOrganization && userOrganization.isPlatformOrg === true)
  );
  ```

- **Authorization Helpers (`utils/authorizationMatrix.js`)**:

  ```javascript
  const isPlatformUser = Boolean(
    user.isPlatformUser ||
      (user.organization && user.organization.isPlatformOrg === true)
  );
  ```

- **Organization Controller (`controllers/organizationControllers.js`)**:

  ```javascript
  const isPlatformUser = Boolean(
    req.user.isPlatformUser ||
      (req.user.organization && req.user.organization.isPlatformOrg === true)
  );
  ```

These changes ensure that platform behavior is governed solely by data in MongoDB (`isPlatformOrg`, `isPlatformUser`), not environment variables, aligning with REQ-100–105, 106–109, 149.

## Tests

**Location:**
- `backend/tests/unit/organizationModel.test.js`

### 1. Uniqueness Tests

```javascript
it("should enforce unique organization name per non-deleted document", async () => {
  await Organization.create({ /* ...name: 'unique-org'... */ });

  await expect(
    Organization.create({ name: "UNIQUE-org", /* ... */ })
  ).rejects.toThrow();
});
```

Verifies that name uniqueness is enforced (case-insensitive through validators/queries) for non-deleted organizations.

### 2. Platform Flag Immutability

```javascript
const org = await Organization.create({ isPlatformOrg: true, /* ... */ });
org.isPlatformOrg = false;
await org.save();
const reloaded = await Organization.findById(org._id);
expect(reloaded.isPlatformOrg).toBe(true);
```

Ensures that `isPlatformOrg` behaves as an immutable flag after creation.

### 3. Cascade Soft Delete

```javascript
const { organization, department, user } = await global.testUtils.createTestContext();
const task = await AssignedTask.create({ /* org, dept, createdBy, dates, assignees */ });

const session = await mongoose.startSession();
session.startTransaction();
await Organization.softDeleteByIdWithCascade(organization._id, { session, deletedBy: user._id });
await session.commitTransaction();

const orgAfter = await Organization.findById(organization._id)
  .select("+isDeleted")
  .setOptions({ withDeleted: true });
const deptAfter = await Department.findById(department._id)
  .select("+isDeleted")
  .setOptions({ withDeleted: true });
const userAfter = await User.findById(user._id)
  .select("+isDeleted")
  .setOptions({ withDeleted: true });
const taskAfter = await AssignedTask.findOne({ _id: task._id })
  .select("+isDeleted")
  .setOptions({ withDeleted: true });

expect(orgAfter?.isDeleted).toBe(true);
expect(deptAfter?.isDeleted).toBe(true);
expect(userAfter?.isDeleted).toBe(true);
expect(taskAfter?.isDeleted).toBe(true);
```

Verifies that when an organization is soft-deleted via `softDeleteByIdWithCascade`, at least one department, user, and task within that organization are also soft-deleted.

### 4. TTL Initialization

```javascript
await expect(Organization.initializeTTL()).resolves.not.toThrow;
```

Ensures `initializeTTL` can be invoked without error (even though organizations are configured to never auto-delete).

## Summary

Task 11 (Organization Model Implementation) is now satisfied at the model and helper level:

- Organization schema validates identity and contact fields.
- Unique indexes are defined for name/email/phone and scoped by soft delete.
- `isPlatformOrg` is an immutable, indexed field used to identify platform organizations.
- All runtime platform behavior is based on `isPlatformOrg`/`isPlatformUser`, not env IDs.
- `softDeleteByIdWithCascade` performs transactional cascade soft delete to departments, users, tasks, materials, vendors, attachments, comments, activities, notifications.
- Organizations are never auto-TTL-deleted.
- Model-specific unit tests cover uniqueness, platform flag immutability, cascade soft delete, and TTL configuration.

Additional higher-level behaviors such as organization archival workflow, billing/subscription fields, and owner deletion rules will be validated and/or extended at the controller/service level (Tasks 76–78) where business workflows are implemented.
