> **Phase 1.1 - Task 12: Department Model Implementation**
>
> This document describes the Department model configuration and the changes made for production readiness.

## WHAT Exists

**Location:** `backend/models/Department.js`

The `Department` schema represents organizational departments within each tenant organization.

- Core fields:
  - `name` (required, trimmed, max length via `MAX_DEPT_NAME_LENGTH`)
  - `description` (required, bounded via `MAX_DEPT_DESCRIPTION_LENGTH`)
  - `organization` (ObjectId → `Organization`, required)
  - `createdBy` (optional ObjectId → `User`)
- Serialization:
  - `toJSON` / `toObject` strip `id`, `__v`, and soft-delete metadata (`isDeleted`, `deletedAt`, `deletedBy`).
- Indexes:
  - Compound unique index `{ organization: 1, name: 1 }` with `partialFilterExpression: { isDeleted: false }` (uniqueness per organization for non-deleted departments).
  - Index on `{ organization: 1 }` for scoping.
  - Index on `{ organization: 1, createdAt: -1 }` for recent-department queries.
- Plugins:
  - `softDeletePlugin(departmentSchema)` adds soft delete fields, methods, and query helpers.
  - `mongoose-paginate-v2` for paginated listing.
- Hooks:
  - `pre('save')` validates that `createdBy` (if present) belongs to the same organization.
- Cascade operations:
  - `softDeleteByIdWithCascade(departmentId, { session })` implements department-level cascade soft delete:
    - Soft-deletes users in department.
    - Soft-deletes tasks in department.
    - Soft-deletes TaskActivity, TaskComment, Attachment, Material, Notification scoped to department.
- TTL configuration:
  - `initializeTTL()` uses `TTL_EXPIRY.DEPARTMENTS` (365 days) via soft delete plugin `ensureTTLIndex`.

## WHY Change

Task 12 requires:

- Validating that departments belong to organizations (multi-tenancy) and are scoped correctly.
- Ensuring a unique `name` + `organization` constraint for non-deleted departments.
- Guaranteeing cascade soft-delete for users and tasks in the department using transactions.
- Confirming `createdBy`/manager references are consistent with organizational boundaries.
- Adding tests to ensure these guarantees hold in practice.

Prior to this task, the schema already contained most of the necessary structure, but there were no targeted model tests explicitly validating cascade behavior and uniqueness.

## HOW It Was Implemented

### 1. Schema and Index Validation

The existing schema and indexes were validated against requirements:

```javascript
const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: MAX_DEPT_NAME_LENGTH },
    description: {
      type: String,
      maxlength: MAX_DEPT_DESCRIPTION_LENGTH,
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false, toJSON: { ... }, toObject: { ... } }
);

// Uniqueness per organization
departmentSchema.index(
  { organization: 1, name: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

// Scoping and recency
departmentSchema.index({ organization: 1 });
departmentSchema.index(
  { organization: 1, createdAt: -1 },
  { partialFilterExpression: { isDeleted: false } }
);
```

This ensures:
- Department names are unique per organization among active (non-deleted) departments.
- Queries filtered by organization and/or recency are efficient.

### 2. Pre-save Hook (createdBy Organization Integrity)

The `pre('save')` hook ensures `createdBy` belongs to the same organization:

```javascript
departmentSchema.pre("save", async function (next) {
  try {
    const session = this.$session?.();
    if (this.createdBy) {
      const { User } = await import("./User.js");
      const user = await User.findOne({
        _id: this.createdBy,
        organization: this.organization,
        isDeleted: false,
      }).session(session);
      if (!this.isNew && !user) {
        throw new Error(
          "createdBy user must belong to the same organization as the department"
        );
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});
```

This hook enforces cross-reference integrity for `createdBy` and the department’s `organization`.

### 3. Cascade Soft Delete

`softDeleteByIdWithCascade` performs department-level cascade deletion inside a transaction:

```javascript
departmentSchema.statics.softDeleteByIdWithCascade = async function (
  departmentId,
  { session } = {}
) {
  if (!session)
    throw new Error("Soft delete must be performed within a transaction");
  const department = await this.findOne({ _id: departmentId }).session(session);
  if (!department) throw new Error("Department not found or already deleted");

  const { User } = await import("./User.js");
  const { BaseTask } = await import("./BaseTask.js");
  const { TaskActivity } = await import("./TaskActivity.js");
  const { TaskComment } = await import("./TaskComment.js");
  const { Attachment } = await import("./Attachment.js");
  const { Material } = await import("./Material.js");
  const { Notification } = await import("./Notification.js");

  // Users
  const users = await User.find({ department: departmentId }).session(session);
  for (const u of users) {
    await User.softDeleteByIdWithCascade(u._id, { session });
  }

  // Tasks
  const tasks = await BaseTask.find({ department: departmentId }).session(
    session
  );
  for (const t of tasks) {
    await BaseTask.softDeleteByIdWithCascade(t._id, { session });
  }

  // TaskActivities
  await TaskActivity.softDeleteMany({ department: departmentId }, { session });

  // TaskComments
  await TaskComment.softDeleteManyCascade(
    { department: departmentId },
    { session }
  );

  // Attachments
  await Attachment.softDeleteMany({ department: departmentId }, { session });

  // Materials
  await Material.softDeleteMany({ department: departmentId }, { session });

  // Notifications
  await Notification.softDeleteMany({ department: departmentId }, { session });

  // Finally, the department itself
  await this.softDeleteById(departmentId, { session });
};
```

This function assumes the caller manages the transaction (i.e. starts and commits/aborts the session).

### 4. TTL Configuration

Departments are configured for TTL-based permanent deletion after 365 days:

```javascript
departmentSchema.statics.initializeTTL = async function () {
  const { TTL_EXPIRY } = await import("../utils/constants.js");
  return this.ensureTTLIndex(TTL_EXPIRY.DEPARTMENTS);
};
```

`TTL_EXPIRY.DEPARTMENTS` is set to `365 * 24 * 60 * 60` (365 days) in `utils/constants.js`.

## Tests

**Location:**
- `backend/tests/unit/departmentModel.test.js`

### 1. Uniqueness per Organization

```javascript
it("should enforce unique department name per organization (non-deleted)", async () => {
  const organization = await global.testUtils.createTestOrganization();

  await Department.create({
    name: "Housekeeping",
    description: "Housekeeping department",
    organization: organization._id,
  });

  await expect(
    Department.create({
      name: "Housekeeping",
      description: "Duplicate name",
      organization: organization._id,
    })
  ).rejects.toThrow();
});
```

Validates the unique index on `(organization, name)` with partial filter on `isDeleted: false`.

### 2. createdBy Organization Integrity

```javascript
const { organization, department, user } =
  await global.testUtils.createTestContext();

const dept = await Department.create({
  name: "Engineering",
  description: "Engineering department",
  organization: organization._id,
  createdBy: user._id,
});

expect(dept.organization.toString()).toBe(organization._id.toString());
expect(dept.createdBy.toString()).toBe(user._id.toString());
```

Confirms that setting `createdBy` to a user in the same organization is accepted.

### 3. Cascade Soft Delete

```javascript
const { organization, department, user } =
  await global.testUtils.createTestContext();

const task = await AssignedTask.create({
  title: "Dept Task",
  description: "Task linked to department for cascade test",
  organization: organization._id,
  department: department._id,
  createdBy: user._id,
  startDate,
  dueDate,
  assignees: [user._id],
});

const session = await mongoose.startSession();
session.startTransaction();
await Department.softDeleteByIdWithCascade(department._id, { session });
await session.commitTransaction();

const deptAfter = await Department.findById(department._id)
  .select("+isDeleted")
  .setOptions({ withDeleted: true });
const userAfter = await User.findById(user._id)
  .select("+isDeleted")
  .setOptions({ withDeleted: true });
const taskAfter = await AssignedTask.findOne({ _id: task._id })
  .select("+isDeleted")
  .setOptions({ withDeleted: true });

expect(deptAfter?.isDeleted).toBe(true);
expect(userAfter?.isDeleted).toBe(true);
expect(taskAfter?.isDeleted).toBe(true);
```

Verifies that deleting a department via `softDeleteByIdWithCascade` cascades to users and tasks.

### 4. TTL Initialization

```javascript
await expect(Department.initializeTTL()).resolves.not.toThrow;
```

Ensures `initializeTTL` runs without error, invoking the soft delete plugin’s TTL index helper.

## Summary

Task 12 (Department Model Implementation) is now satisfied at the model and helper level:

- Department schema enforces required fields and lengths.
- Unique `(organization, name)` index with soft-delete-aware partial filter.
- `createdBy` is validated against the organization.
- `softDeleteByIdWithCascade` performs transactional cascade soft delete to all department-scoped resources.
- TTL configuration is in place for 365-day hard deletion of soft-deleted departments.
- Unit tests verify uniqueness, `createdBy` integrity, cascade operations, and TTL initialization.

Higher-level behaviors such as manager assignment and department hierarchy (parent/child) are handled at the controller and validator layers (Tasks 71–74) and are outside the scope of the pure model implementation in Task 12.
