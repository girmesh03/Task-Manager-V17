> **Phase 1.1 - Task 14: TaskActivity Model Implementation**
>
> This document describes the TaskActivity model configuration and the tests added for production readiness.

## WHAT Exists

**File:** `backend/models/TaskActivity.js`

The `TaskActivity` schema logs activity for tasks and supports materials and attachments.

Key fields:
- `task`: ObjectId ref via `refPath: "taskModel"`, required.
- `taskModel`: string, required, enum `TASK_ACTIVITY_PARENT_MODELS` (`["AssignedTask", "ProjectTask"]`).
- `activity`: required text with max length `MAX_ACTIVITY_LENGTH`.
- `attachments`: ObjectId[] → `Attachment` with:
  - Max length `MAX_ATTACHMENTS_PER_ENTITY`.
  - No duplicate IDs.
- `materials`: array of usage:
  - `material`: required `Material` ref.
  - `quantity`: required, 0–1,000,000.
  - `unitPrice`: required, non-negative.
  - `totalCost`: required, non-negative.
  - Max `MAX_MATERIALS_PER_ENTITY` entries.
- `totalMaterialCost`: aggregate numeric field (derived in hook).
- `loggedAt`: date, default `Date.now`.
- `organization`, `department`, `createdBy`: required references for multi-tenancy.

Serialization:
- `toJSON` / `toObject` remove internal fields (`id`, `__v`, soft-delete metadata).

Indexes:
- `{ organization, department, taskModel, task, createdAt }`.
- `{ organization, createdBy, createdAt }`.

Plugins:
- `softDeletePlugin(TaskActivitySchema)`.
- `mongoose-paginate-v2`.

Hooks & validation:
- `virtual calculatedTotalCost` computes sum of `materials[].totalCost`.
- `pre('save')`:
  - If `materials` modified:
    - Updates `totalMaterialCost` from `calculatedTotalCost`.
    - Validates that all referenced `Material` documents belong to `organization` and are not soft-deleted.
    - For each material entry, if `unitPrice` not provided, fills it from `Material.price`, and recomputes `totalCost = quantity * unitPrice`.
  - On changes to `task`, `taskModel`, `organization`, `department`:
    - Ensures a `BaseTask` exists with `_id=task`, `taskType=taskModel`, `organization`, `department`, `isDeleted: false`.
    - Enforces that the referenced task belongs to the same organization and department and that `taskModel` matches the task discriminator.
  - On changes to `createdBy`, `organization`, `department`:
    - Ensures a `User` exists with `_id=createdBy`, `organization`, `department`, `isDeleted: false`.
    - Enforces that the activity creator belongs to the same organization and department.
  - On changes to `attachments`:
    - Ensures that each attachment in `attachments` array points back to this activity as `(parent=this._id, parentModel="TaskActivity")`.

Cascade soft delete:
- `softDeleteByIdWithCascade(activityId, { session, deletedBy })`:
  - Validates `session`.
  - Cascades to `Attachment` and `TaskComment` with `parent=activityId` and `parentModel="TaskActivity"`.
  - Soft-deletes the activity itself.
- `softDeleteManyCascade(filter, { session, deletedBy, batchSize })`:
  - Streams through matches using a cursor and invokes `softDeleteByIdWithCascade` per activity.

Material management helpers:
- `removeMaterialFromAllActivities(materialId, { session })`.
- `addMaterialToActivity(activityId, materialData, { session })`.

TTL configuration:
- `TaskActivitySchema.statics.initializeTTL()` uses `TTL_EXPIRY.ACTIVITIES` via soft delete plugin to configure TTL-based cleanup (90 days) for soft-deleted activities.

## WHY Change

Task 14 requires:
- Validating all TaskActivity fields and relationships.
- Ensuring author and task references are scoped correctly to organization and department.
- Verifying cascade soft-delete behavior for activities when tasks are deleted.
- Ensuring TTL cleanup is configured for soft-deleted activities.

The model implementation already aligned with these constraints; the main missing parts were explicit tests and documentation to assert correctness.

## HOW It Was Implemented

### 1. Helper for tests

**File:** `backend/tests/unit/taskActivityModel.test.js`

Helper function `createContextWithTaskAndMaterial`:
- Uses `global.testUtils.createTestContext()` to create an Organization, Department, and User.
- Creates an `AssignedTask` in that organization/department with valid dates and assignees.
- Creates a `Material` document in the same organization/department with unit `"pcs"`, `price: 10`, `category: "Other"`, and `addedBy` set to the test user.

### 2. Material Cost Calculation

- Test: `should calculate totalMaterialCost based on materials totalCost`.
  - Creates a `TaskActivity` for the assigned task with two material entries (each referencing the same material, with explicit `quantity`, `unitPrice`, `totalCost`).
  - Asserts `activity.totalMaterialCost === 50` (20 + 30), validating the `calculatedTotalCost` virtual and pre-save aggregation logic.

### 3. MAX_MATERIALS_PER_ENTITY Limit

- Test: `should enforce MAX_MATERIALS_PER_ENTITY limit`.
  - Constructs a `materials` array with `MAX_MATERIALS_PER_ENTITY + 1` entries.
  - Attempts to create a `TaskActivity` document with this array and expects a validation error, confirming the upper bound enforcement.

### 4. Task & Author Scoping and taskModel Validation

- Test: `should validate that task and createdBy belong to same organization and department and taskModel matches`.
  - First creates a valid `TaskActivity` using the assigned task, matching organization/department/createdBy and `taskModel: "AssignedTask"`; expects it to succeed.
  - Then attempts to create another `TaskActivity` with the same task but `taskModel: "ProjectTask"`, expecting the pre-save hook to reject with the error message:

    > "Task must exist, belong to the same organization and department as the activity, and taskModel must match the task discriminator"

  - This directly validates both task existence and discriminator consistency.

### 5. TTL Initialization

- Test: `TaskActivity.initializeTTL should configure TTL index without throwing`.
  - Calls `TaskActivity.initializeTTL()` and asserts the returned promise resolves without errors, confirming TTL wiring for TaskActivity.

## Tests Summary

**File:** `backend/tests/unit/taskActivityModel.test.js`

Covers:
- Material cost aggregation for activities.
- Max materials per activity constraint.
- Task and creator scoping to the same org/dept and `taskModel` consistency with the underlying task discriminator.
- TTL initialization for TaskActivity.

Cascade soft-delete behavior for TaskActivity when tasks or users are deleted is also exercised indirectly in:
- `backend/tests/unit/taskModels.test.js` (task cascade test), and
- User/Organization/Department cascade tests (Tasks 10–12),
with additional property-based cascade tests to be added in Task 31.
