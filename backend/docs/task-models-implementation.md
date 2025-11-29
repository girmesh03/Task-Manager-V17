> **Phase 1.1 - Task 13: Task Models Implementation (BaseTask, ProjectTask, RoutineTask, AssignedTask)**
>
> This document describes the task models, their discriminator pattern, and the changes/tests added for production readiness.

## WHAT Exists

**Files:**
- `backend/models/BaseTask.js`
- `backend/models/ProjectTask.js`
- `backend/models/RoutineTask.js`
- `backend/models/AssignedTask.js`

### BaseTask

BaseTask is the abstract root for all task types using Mongoose discriminators.

Key fields:
- `title`, `description` with max lengths via `MAX_TITLE_LENGTH`, `MAX_DESCRIPTION_LENGTH`.
- `status` (enum `TASK_STATUS`, default `"To Do"`).
- `priority` (enum `TASK_PRIORITY`, default `"Medium"`).
- `organization` (required `Organization` ref).
- `department` (required `Department` ref).
- `createdBy` (required `User` ref).
- `attachments`: ObjectId[] → `Attachment` with:
  - Max length `MAX_ATTACHMENTS_PER_ENTITY`.
  - No duplicate IDs.
- `watchers`: ObjectId[] → `User` with:
  - Max length `MAX_WATCHERS_PER_TASK`.
  - No duplicates.
  - Pre-save validation: all watchers must be users in the same organization with roles in `HEAD_OF_DEPARTMENT_ROLES` (HOD roles: `SuperAdmin`/`Admin`).
- `tags`: string[] with:
  - Max length `MAX_TAGS_PER_TASK`.
  - No duplicates (case-insensitive) with per-tag `MAX_TAG_LENGTH`.

Schema options:
- `discriminatorKey: "taskType"` for discriminator pattern.
- `timestamps: true`, `versionKey: false`.
- `toJSON` / `toObject` strip `id`, `__v`, soft-delete fields.

Indexes:
- `{ organization, department, createdAt }`, `{ organization, createdBy, createdAt }`, `{ organization, department, startDate, dueDate }`, `{ organization, department, status, priority, dueDate }` (all soft-delete-aware).
- Text index on `tags`.

Hooks & plugins:
- `pre('save')`:
  - Ensures `department` belongs to `organization`.
  - Ensures `createdBy` belongs to the specified organization and department.
  - Ensures `watchers` are HOD users within the same organization.
- `softDeletePlugin(BaseTaskSchema)` prevents hard deletes, adds `isDeleted` fields, soft-delete methods, and TTL helpers.
- `paginate` from `mongoose-paginate-v2`.

Cascade soft delete:
- `BaseTaskSchema.statics.softDeleteByIdWithCascade(taskId, { session, deletedBy })`:
  - Validates `session` (transaction required).
  - Loads the task, then cascades via:
    - `TaskActivity`: find by `task`, then `TaskActivity.softDeleteByIdWithCascade` per activity.
    - `TaskComment`: `softDeleteManyCascade` for comments whose parent is the task and whose parentModel is one of the task discriminators.
    - `Attachment`: `softDeleteMany` for attachments whose parent is the task and parentModel is one of the task discriminators.
    - `Notification`: `softDeleteMany` for notifications whose `entity` is the task and `entityModel` matches.
  - Finally calls `softDeleteById` on the task itself.

TTL:
- `BaseTaskSchema.statics.initializeTTL()` uses `TTL_EXPIRY.TASKS` via soft delete plugin’s `ensureTTLIndex` (180 days).

### ProjectTask

Discriminator of `BaseTask` for vendor-based project tasks.

Additional fields:
- `startDate`, `dueDate` with validation using helper functions:
  - `startDate` must be today or future (`isStartDateTodayOrFuture`).
  - `dueDate` ≥ `startDate` (`isStartDateBeforeDueDate`).
- `vendor`: required `Vendor` ref.
- `estimatedCost`, `actualCost` with non-negative constraints.
- `currency`: limited to `SUPPORTED_CURRENCIES`, default `DEFAULT_CURRENCY`.
- `costHistory`: audit log of changes to `estimatedCost`, `actualCost`, `currency` with max `MAX_COST_HISTORY_ENTRIES` entries.
- `modifiedBy`: `User` ref – required for cost tracking when cost fields change.

Hooks:
- `pre('save')`:
  - Validates `vendor` belongs to same organization.
  - Validates `modifiedBy` belongs to same organization when used.
  - Prevents currency change once non-zero costs exist.
  - Appends entries to `costHistory` when cost fields change.

Indexes:
- `{ organization, department, vendor }` and `{ organization, department, status, priority, dueDate }` with soft-delete-aware filters.

TTL:
- `ProjectTaskSchema.statics.initializeTTL()` delegates to `TTL_EXPIRY.TASKS` via soft delete plugin.

### RoutineTask

Discriminator of `BaseTask` for high-volume routine tasks.

Additional fields:
- `date`: required, cannot be in the future (validated via `isDateNotInFuture`).
- `status`: enum `ROUTINE_TASK_STATUS` (no `"To Do"`), default `"Completed"`.
- `priority`: enum `ROUTINE_TASK_PRIORITY` (no `"Low"`), default `"Medium"`.
- `materials`: array of material usage:
  - `material`: required `Material` ref.
  - `quantity`: required, between 0 and 1,000,000.
  - `unitPrice`: required, non-negative.
  - `totalCost`: required, non-negative.
  - Validations: max `MAX_MATERIALS_PER_ENTITY`, unique material IDs.
- `totalMaterialCost`: derived aggregate cost.

Hooks:
- `pre('save')`:
  - If `materials` modified:
    - Ensures all referenced `Material` documents belong to the same organization and are not soft-deleted.
    - For each material, uses current `Material.price` as `unitPrice` if not provided.
    - Re-calculates `totalCost` per line item and `totalMaterialCost`.

Indexes:
- `{ organization, department, createdBy, date }`.
- `{ organization, department, status, date }`.
- `{ 'materials.material': 1 }` – all soft-delete-aware.

TTL:
- `RoutineTaskSchema.statics.initializeTTL()` uses `TTL_EXPIRY.TASKS` via soft delete plugin.

### AssignedTask

Discriminator of `BaseTask` for tasks assigned to users in the same department.

Additional fields:
- `startDate` / `dueDate` with same validation approach as `ProjectTask`:
  - `startDate` must be today or future.
  - `dueDate` ≥ `startDate`.
- `assignees`: non-empty array of `User` IDs with validations:
  - Max `MAX_ASSIGNEES_PER_TASK`.
  - Unique IDs (no duplicates).
  - Pre-save: all assignees must belong to the same organization **and department** as the task.

Indexes:
- `{ organization, department, assignees, createdAt }`.
- `{ organization, department, status, priority, dueDate }`.
- `{ dueDate: 1 }` – all soft-delete-aware.

Hooks:
- `pre('save')` validates assignees’ org + department membership using `User`.

TTL:
- `AssignedTaskSchema.statics.initializeTTL()` uses `TTL_EXPIRY.TASKS` via soft delete plugin.

## WHY Change

Task 13 requires:
- Verifying discriminator pattern correctness (BaseTask + 3 task types).
- Validating business rules around watchers, assignees, and materials.
- Verifying date logic (no past start dates, dueDate ≥ startDate; routine dates not in future).
- Ensuring cascade soft-delete from tasks to TaskActivity, TaskComment, Attachment, Notification.
- Confirming TTL-based cleanup is configured for tasks according to `TTL_EXPIRY.TASKS`.

The models already implemented most of this behavior; the missing pieces were **explicit tests and documentation** to validate the configuration and cascades.

## HOW It Was Implemented

### 1. Discriminator Validation & Basic Creation

**Tests:** `backend/tests/unit/taskModels.test.js`

- `should create discriminator tasks with correct taskType`:
  - Uses `AssignedTask.create`, `ProjectTask.create`, and `RoutineTask.create` with valid fields.
  - Asserts their `taskType` values.
  - Queries `BaseTask` by IDs and confirms all three discriminator instances are returned with the correct `taskType` values.

### 2. Date Logic Validation

- `should validate startDate and dueDate for AssignedTask`:
  - Attempts to create tasks with:
    - Past `startDate` → expects validation error.
    - `dueDate` earlier than `startDate` → expects validation error.
  - Successfully creates a task with `startDate = today` and `dueDate = tomorrow`.

- `should prevent RoutineTask date from being in the future`:
  - Attempts to create a `RoutineTask` with `date` set to tomorrow → expects validation error.

These tests exercise the helper-based date validation logic used in the models.

### 3. Watchers Validation

- `should validate watchers are HOD users within same organization`:
  - Uses `createContext()` helper to create an organization, department, and two users: a HOD user (role in `HEAD_OF_DEPARTMENT_ROLES`, `isHod: true`) and a regular user.
  - Successfully creates an `AssignedTask` with a watcher list containing only the HOD user.
  - Fails to create an `AssignedTask` where the watcher is a regular user, asserting the error message about watchers needing to be Head of Department.
  - Attempts to exceed `MAX_WATCHERS_PER_TASK` by creating many HOD users and adding all to the watchers array; expects a validation error.

### 4. Assignees Validation

- `should validate assignees are unique and belong to same organization and department`:
  - Creates:
    - A regular user in the default department.
    - Another user in a different department of the same organization.
  - Asserts:
    - Duplicate assignee IDs in `assignees` cause a validation error (duplicate assignees validator).
    - Mixing users from different departments in `assignees` causes pre-save validation failure (`All assignees must belong to the same organization and department ...`).

### 5. Attachment & Tag Limits

- `should prevent exceeding attachment and tag limits`:
  - Attempts to create an `AssignedTask` with `attachments.length > MAX_ATTACHMENTS_PER_ENTITY` and ensures it throws.
  - Attempts to create an `AssignedTask` with `tags.length > MAX_TAGS_PER_TASK` and ensures it throws.

### 6. Cascade Soft Delete from Tasks

- `should cascade soft-delete task to activities, comments, attachments and notifications`:
  - Uses `createTestContext` to create org/dept/user.
  - Creates an `AssignedTask`.
  - Creates related entities:
    - `TaskActivity` with `taskModel: "AssignedTask"`, pointing to the task.
    - `TaskComment` with `parentModel: "AssignedTask"`, parent=task.
    - `Attachment` with `parentModel: "AssignedTask"`, parent=task.
    - `Notification` with `entityModel: "AssignedTask"`, `entity=task` and one recipient.
  - Starts a session/transaction and calls:

    ```js
    await BaseTask.softDeleteByIdWithCascade(task._id, { session, deletedBy: user._id });
    ```

  - Commits the transaction and then loads all entities with `setOptions({ withDeleted: true })` and `select("+isDeleted")`.
  - Asserts `isDeleted === true` for task, activity, comment, attachment and notification, proving the cascade soft-delete chain is functional.

### 7. TTL Initialization

- `BaseTask.initializeTTL should configure TTL index without throwing`:
  - Calls `BaseTask.initializeTTL()` and asserts it resolves without throwing, confirming TTL configuration wiring for tasks.

## Tests Summary

**File:** `backend/tests/unit/taskModels.test.js`

Test coverage includes:
- Discriminator pattern (BaseTask + 3 concrete task types).
- Date validation for AssignedTask and RoutineTask.
- Watchers validation (HOD-only, same organization, max count).
- Assignees validation (unique, same org/dept, non-empty by schema).
- Attachment and tag length limits.
- Cascade soft delete from tasks to TaskActivity, TaskComment, Attachment, Notification.
- TTL initialization for task TTL configuration.

Additional cascade and TTL behaviors for `TaskActivity`, `TaskComment`, `Attachment`, `Notification` are further validated in their respective model implementation tasks (Tasks 14–19) and property-based cascade tests (Task 31).
