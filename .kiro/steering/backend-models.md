---
inclusion: always
---

# Backend Models Documentation

Complete documentation of all Mongoose models, schemas, relationships, and business rules.

## Critical Rules

- **Soft Delete**: ALL models use soft delete plugin (`isDeleted` flag)
- **Timestamps**: All models have `createdAt` and `updatedAt` timestamps
- **Multi-tenancy**: All resources scoped to organization and/or department
- **Cascade Delete**: Parent deletion cascades to children
- **TTL**: Soft-deleted documents auto-expire after configured period
- **Transactions**: All cascade operations MUST use MongoDB transactions

## Model Overview

### Model Hierarchy

```
Organization (tenant)
├── Department
│   ├── User
│   ├── BaseTask (discriminator)
│   │   ├── ProjectTask
│   │   ├── RoutineTask
│   │   └── AssignedTask
│   ├── Material
│   └── Vendor
├── TaskActivity (linked to ProjectTask/AssignedTask)
├── TaskComment (linked to tasks, activities, comments)
├── Attachment (linked to tasks, activities, comments)
└── Notification (linked to users and entities)
```

### Model Count

- **15 Models**: Organization, Department, User, BaseTask, ProjectTask, RoutineTask, AssignedTask, TaskActivity, TaskComment, Material, Vendor, Attachment, Notification
- **1 Plugin**: softDelete plugin (applied to all models)
- **Total**: 16 files in `backend/models/`

## Soft Delete Plugin

**File**: `models/plugins/softDelete.js`

**Purpose**: Universal soft delete functionality for all models

### Fields Added

```javascript
{
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null, index: true },
  deletedBy: { type: ObjectId, ref: "User", default: null, index: true },
  restoredAt: { type: Date, default: null },
  restoredBy: { type: ObjectId, ref: "User", default: null },
  restoreCount: { type: Number, default: 0 }
}
```

### Query Helpers

- `withDeleted()`: Include soft-deleted documents in query
- `onlyDeleted()`: Return only soft-deleted documents

### Instance Methods

- `softDelete(deletedBy, { session })`: Soft delete this document
- `restore(restoredBy, { session })`: Restore this document

### Static Methods

- `softDeleteById(id, { session, deletedBy })`: Soft delete by ID
- `softDeleteMany(filter, { session, deletedBy })`: Soft delete multiple
- `restoreById(id, { session, restoredBy })`: Restore by ID
- `restoreMany(filter, { session, restoredBy })`: Restore multiple
- `findDeletedByIds(ids, { session })`: Find soft-deleted documents
- `countDeleted(filter, { session })`: Count soft-deleted documents
- `ensureTTLIndex(expireAfterSeconds)`: Create TTL index for auto-cleanup
- `getRestoreAudit(id, { session })`: Get restore audit trail

### Automatic Filtering

All queries automatically filter out soft-deleted documents unless `withDeleted()` is used:

```javascript
// Excludes soft-deleted
const users = await User.find({});

// Includes soft-deleted
const allUsers = await User.find({}).withDeleted();

// Only soft-deleted
const deletedUsers = await User.find({}).onlyDeleted();
```

### Hard Delete Protection

Hard deletes are completely blocked. All delete operations throw errors:

- `deleteOne()` - Blocked
- `deleteMany()` - Blocked
- `findOneAndDelete()` - Blocked
- `remove()` - Blocked

### TTL Configuration

Soft-deleted documents auto-expire after configured period:

- **Users**: 365 days
- **Tasks**: 180 days
- **Organizations**: Never (TTL = null)
- **Departments**: 365 days
- **Materials**: 180 days
- **Vendors**: 180 days
- **Attachments**: 90 days
- **Notifications**: 30 days

## Organization Model

**File**: `models/Organization.js`

**Collection**: `organizations`

**Purpose**: Tenant organizations in multi-tenant system

### Schema

```javascript
{
  name: String (required, unique, lowercase, max 100),
  description: String (required, max 2000),
  email: String (required, unique, valid email, max 50),
  phone: String (required, unique, E.164 format),
  address: String (required, max 500),
  industry: String (required, one of 24 industries, max 100),
  logoUrl: {
    url: String (Cloudinary URL or image URL),
    publicId: String (required, Cloudinary public ID)
  },
  createdBy: ObjectId (ref: User),
  isPlatformOrg: Boolean (default: false, immutable, indexed),
  // Soft delete fields (from plugin)
  isDeleted: Boolean,
  deletedAt: Date,
  deletedBy: ObjectId,
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

- `{ name: 1 }` - Unique, partial (isDeleted: false)
- `{ email: 1 }` - Unique, partial (isDeleted: false)
- `{ phone: 1 }` - Unique, partial (isDeleted: false)
- `{ isPlatformOrg: 1 }` - For platform organization queries
- `{ isDeleted: 1 }` - From soft delete plugin
- `{ deletedAt: 1 }` - TTL index (never expires for organizations)

### Validation Rules

- **name**: Required, lowercase, trimmed, 1-100 characters, unique per organization
- **email**: Required, valid email format, unique, max 50 characters
- **phone**: Required, E.164 format (+2510123456789 or 0123456789), unique
- **industry**: Required, must be one of 24 predefined industries
- **logoUrl.url**: Optional, must be valid Cloudinary URL or image URL
- **logoUrl.publicId**: Required if logoUrl provided
- **isPlatformOrg**: Immutable, can only be set on creation

### Industries (24 Options)

Technology, Healthcare, Finance, Education, Retail, Manufacturing, Hospitality, Real Estate, Transportation, Energy, Agriculture, Construction, Media, Telecommunications, Automotive, Aerospace, Pharmaceutical, Legal, Consulting, Non-Profit, Government, Entertainment, Food & Beverage, Other

### Pre-save Hooks

1. **Validate createdBy**: Ensures createdBy user belongs to this organization

### Cascade Delete

**Method**: `softDeleteByIdWithCascade(organizationId, { session })`

**Cascade Order**:

1. Soft delete all departments (with their cascades)
2. Soft delete all users (with their cascades)
3. Soft delete all tasks (with their cascades)
4. Soft delete all task activities
5. Soft delete all task comments
6. Soft delete all attachments
7. Soft delete all materials
8. Soft delete all notifications
9. Soft delete all vendors
10. Finally, soft delete the organization

**Protection**: Platform organization (`isPlatformOrg: true`) CANNOT be deleted

### Business Rules

- **Platform Organization**: Only one platform organization exists, identified by `isPlatformOrg: true`
- **Immutable Platform Flag**: `isPlatformOrg` cannot be changed after creation
- **Unique Constraints**: name, email, and phone must be unique across non-deleted organizations
- **TTL**: Organizations are NEVER auto-deleted (TTL = null)
- **Cascade Protection**: Deleting organization cascades to ALL child resources

## User Model

**File**: `models/User.js`

**Collection**: `users`

**Purpose**: System users with authentication and role-based access

### Schema

```javascript
{
  firstName: String (required, max 20),
  lastName: String (required, max 20),
  position: String (required, max 100),
  role: String (enum: SuperAdmin, Admin, Manager, User, default: User),
  email: String (required, valid email, lowercase, max 50),
  password: String (required, min 8, select: false, bcrypt hashed),
  organization: ObjectId (required, ref: Organization),
  department: ObjectId (required, ref: Department),
  profilePicture: {
    url: String (Cloudinary URL or image URL),
    publicId: String (required, Cloudinary public ID)
  },
  skills: [{
    skill: String (max 50),
    percentage: Number (0-100)
  }] (max 10 skills),
  employeeId: Number (4-digit, 1000-9999),
  dateOfBirth: Date (not in future),
  joinedAt: Date (required, not in future),
  emailPreferences: {
    enabled: Boolean (default: true),
    taskNotifications: Boolean (default: true),
    taskReminders: Boolean (default: true),
    mentions: Boolean (default: true),
    announcements: Boolean (default: true),
    welcomeEmails: Boolean (default: true),
    passwordReset: Boolean (default: true)
  },
  passwordResetToken: String (select: false, bcrypt hashed),
  passwordResetExpires: Date (select: false),
  isPlatformUser: Boolean (default: false, immutable, indexed),
  isHod: Boolean (default: false, indexed, Head of Department),
  lastLogin: Date (default: null),
  // Soft delete fields
  isDeleted: Boolean,
  deletedAt: Date,
  deletedBy: ObjectId,
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

- `{ organization: 1, email: 1 }` - Unique, partial (isDeleted: false)
- `{ department: 1 }` - Unique for HOD roles, partial (role: SuperAdmin/Admin, isDeleted: false)
- `{ organization: 1, employeeId: 1 }` - Unique, partial (isDeleted: false, employeeId exists)
- `{ isPlatformUser: 1 }` - For platform user queries
- `{ isHod: 1 }` - For Head of Department queries
- `{ isDeleted: 1 }` - From soft delete plugin
- `{ deletedAt: 1 }` - TTL index (365 days)

### Virtuals

- `fullName`: Computed as `${firstName} ${lastName}`

### Pre-save Hooks

1. **Set isPlatformUser**: Automatically set based on organization's `isPlatformOrg` flag
2. **Set isHod**: Automatically set to true if role is SuperAdmin or Admin
3. **Hash Password**: Bcrypt hash with 12 salt rounds if password modified

### Instance Methods

- `comparePassword(enteredPassword)`: Compare entered password with hashed password
- `generatePasswordResetToken()`: Generate and hash password reset token (1 hour expiry)
- `verifyPasswordResetToken(token)`: Verify reset token is valid and not expired
- `clearPasswordResetToken()`: Clear reset token fields

### Cascade Delete

**Method**: `softDeleteByIdWithCascade(userId, { session })`

**Protections**:

1. Cannot delete last SuperAdmin in organization
2. Cannot delete last Head of Department (SuperAdmin/Admin) in department

**Cascade Order**:

1. Soft delete all tasks created by user (with their cascades)
2. Soft delete all task activities created by user
3. Soft delete all task comments created by user (with their cascades)
4. Soft delete all attachments uploaded by user
5. Soft delete all materials added by user
6. Soft delete all notifications created by user
7. Remove user from task watchers arrays
8. Finally, soft delete the user

### Business Rules

- **Email Unique**: Email must be unique within organization (case-insensitive)
- **Employee ID Unique**: Employee ID must be unique within organization (if provided)
- **HOD Unique**: Only one SuperAdmin or Admin per department
- **Password Security**: Min 8 characters, bcrypt hashed with ≥12 salt rounds
- **Skills Limit**: Max 10 skills per user, each with unique name (case-insensitive)
- **Skills Proficiency**: 0-100 percentage
- **Platform User**: Automatically set based on organization's isPlatformOrg flag
- **Head of Department**: Automatically set for SuperAdmin and Admin roles
- **TTL**: Users auto-expire 365 days after soft deletion

## BaseTask Model (Discriminator Pattern)

**File**: `models/BaseTask.js`

**Collection**: `basetasks`

**Purpose**: Abstract base model for all task types using Mongoose discriminators

### Schema (Base Fields)

```javascript
{
  title: String (required, max 50),
  description: String (required, max 2000),
  status: String (enum: To Do, In Progress, Completed, Pending, default: To Do),
  priority: String (enum: Low, Medium, High, Urgent, default: Medium),
  organization: ObjectId (required, ref: Organization),
  department: ObjectId (required, ref: Department),
  createdBy: ObjectId (required, ref: User),
  attachments: [ObjectId] (ref: Attachment, max 10, unique),
  watchers: [ObjectId] (ref: User, max 20, unique, HOD only),
  tags: [String] (max 5, max 50 chars each, unique case-insensitive),
  taskType: String (discriminator key: ProjectTask, RoutineTask, AssignedTask),
  // Soft delete fields
  isDeleted: Boolean,
  deletedAt: Date,
  deletedBy: ObjectId,
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

- `{ organization: 1, department: 1, createdAt: -1 }` - List tasks by department
- `{ organization: 1, createdBy: 1, createdAt: -1 }` - List user's tasks
- `{ organization: 1, department: 1, startDate: 1, dueDate: 1 }` - Date range queries
- `{ organization: 1, department: 1, status: 1, priority: 1, dueDate: 1 }` - Filtered queries
- `{ tags: "text" }` - Text search on tags
- `{ isDeleted: 1 }` - From soft delete plugin
- `{ deletedAt: 1 }` - TTL index (180 days)

### Pre-save Hooks

1. **Validate Department**: Ensure department belongs to organization
2. **Validate Creator**: Ensure createdBy user belongs to organization and department
3. **Validate Watchers**: Ensure all watchers are HOD (SuperAdmin/Admin) in same organization

### Cascade Delete

**Method**: `softDeleteByIdWithCascade(taskId, { session })`

**Cascade Order**:

1. Soft delete all task activities (with their cascades)
2. Soft delete all task comments (with their cascades)
3. Soft delete all attachments
4. Soft delete all notifications
5. Finally, soft delete the task

### Business Rules

- **Watchers**: Only Head of Department (SuperAdmin/Admin) can be watchers
- **Attachments**: Max 10 per task, must be unique
- **Tags**: Max 5 per task, unique (case-insensitive), max 50 chars each
- **TTL**: Tasks auto-expire 180 days after soft deletion

## ProjectTask Model (Discriminator)

**File**: `models/ProjectTask.js`

**Extends**: BaseTask

**Purpose**: Department tasks outsourced to external vendors/clients due to complexity or resource limitation

### Additional Fields

```javascript
{
  vendorId: ObjectId (required, ref: Vendor),
  estimatedCost: Number (min 0),
  actualCost: Number (min 0),
  currency: String (default: ETB),
  costHistory: [{
    amount: Number,
    type: String (estimated, actual),
    updatedBy: ObjectId (ref: User),
    updatedAt: Date
  }] (max 200 entries),
  materials: [{
    material: ObjectId (ref: Material),
    quantity: Number (min 0)
  }] (max 20),
  assignees: [ObjectId] (ref: User, max 20, unique),
  startDate: Date,
  dueDate: Date
}
```

### Validation

- **Vendor**: Required, must be external vendor/client taking the task
- **Cost History**: Max 200 entries, auto-tracked on cost changes
- **Materials**: Max 20, must belong to same organization, added via TaskActivity
- **Assignees**: Max 20 department users managing vendor work, must belong to same organization and department
- **Date Range**: startDate must be before dueDate

### Business Logic

- **Vendor Communication**: Vendor communicates orally with department users
- **Activity Logging**: Department users log activities tracking vendor's work progress
- **Material Tracking**: Materials added to TaskActivity (not directly to task) with attachments as proof

## RoutineTask Model (Discriminator)

**File**: `models/RoutineTask.js`

**Extends**: BaseTask

**Purpose**: Daily routine tasks received (not assigned) by department users from organization outlets

### Additional Fields

```javascript
{
  materials: [{
    material: ObjectId (ref: Material),
    quantity: Number (min 0)
  }] (max 20),
  startDate: Date (required),
  dueDate: Date (required)
}
```

### Restrictions

- **Status**: Cannot be "To Do" (must be In Progress, Completed, or Pending)
- **Priority**: Cannot be "Low" (must be Medium, High, or Urgent)
- **Date Range**: startDate must be before dueDate

### Business Logic

- **No Assignment**: User receives task to perform from outlet, not formally assigned
- **No TaskActivity**: Materials added DIRECTLY to RoutineTask (no TaskActivity intermediary)
- **Material Tracking**: Materials linked directly with quantities (different from ProjectTask/AssignedTask)

## AssignedTask Model (Discriminator)

**File**: `models/AssignedTask.js`

**Extends**: BaseTask

**Purpose**: Tasks assigned to single department user or group of department users

### Additional Fields

```javascript
{
  assignedTo: ObjectId | [ObjectId] (required, ref: User),
  startDate: Date,
  dueDate: Date
}
```

### Validation

- **Assigned User(s)**: Single user or array of users, must belong to same organization and department
- **Date Range**: startDate must be before dueDate (if both provided)

### Business Logic

- **Activity Logging**: Assigned users log their own work progress
- **Material Tracking**: Materials added via TaskActivity (not directly to task) with attachments as proof

## Other Models (Summary)

### Department Model

**File**: `models/Department.js` | **Collection**: `departments`

**Key Fields**: name, description, organization, createdBy

**Indexes**: Unique name per organization, organization reference

**Cascade**: Deletes all users, tasks, materials, vendors in department

**TTL**: 365 days

### Material Model

**File**: `models/Material.js` | **Collection**: `materials`

**Key Fields**: name, description, category, quantity, unitType, cost, price, currency, vendor, department, organization

**Categories**: Electrical, Mechanical, Plumbing, Hardware, Cleaning, Textiles, Consumables, Construction, Other

**Unit Types**: 30+ types (pcs, kg, l, m, m2, m3, box, pack, roll, etc.)

**Usage Patterns**:

- **ProjectTask/AssignedTask**: Materials added to TaskActivity with quantities
- **RoutineTask**: Materials added directly to task (no TaskActivity)

**TTL**: 180 days

### Vendor Model

**File**: `models/Vendor.js` | **Collection**: `vendors`

**Purpose**: External clients/vendors who take and complete outsourced ProjectTasks

**Key Fields**: name, description, contactPerson, email, phone, address, department, organization

**Business Logic**:

- External client who takes ProjectTask
- Communicates orally with department users
- Department users log vendor's work via TaskActivity

**Special**: Deletion requires material reassignment

**TTL**: 180 days

### TaskActivity Model

**File**: `models/TaskActivity.js` | **Collection**: `taskactivities`

**Purpose**: Track work progress on ProjectTask and AssignedTask ONLY (not RoutineTask)

**Key Fields**: content, parent (ProjectTask/AssignedTask), parentModel, materials, createdBy, department, organization

**Parent Scope**: ProjectTask or AssignedTask ONLY (RoutineTask does NOT have TaskActivity)

**Material Tracking**: Materials added to TaskActivity with quantities and attachments as proof

**Activity Logging**:

- **ProjectTask**: Department users log vendor's work progress
- **AssignedTask**: Assigned users log their own work progress

**Cascade**: Deletes comments and attachments

**TTL**: 90 days

### TaskComment Model

**File**: `models/TaskComment.js` | **Collection**: `taskcomments`

**Key Fields**: content, parent (task/activity/comment), parentModel, mentions, createdBy, department, organization

**Threading**: Max depth 3 levels

**Cascade**: Deletes child comments and attachments

**TTL**: 90 days

### Attachment Model

**File**: `models/Attachment.js` | **Collection**: `attachments`

**Key Fields**: filename, fileUrl, fileType, fileSize, parent, parentModel, uploadedBy, department, organization

**File Types**: Image, Video, Document, Audio, Other

**Size Limits**: Image (10MB), Video (100MB), Document (25MB), Audio (20MB), Other (50MB)

**TTL**: 90 days

### Notification Model

**File**: `models/Notification.js` | **Collection**: `notifications`

**Key Fields**: title, message, type, isRead, recipient, entity, entityModel, organization, expiresAt

**Types**: Created, Updated, Deleted, Restored, Mention, Welcome, Announcement

**TTL**: 30 days (or custom expiresAt)

## Model Relationships Summary

### One-to-Many

- Organization → Departments
- Organization → Users
- Department → Users
- Department → Tasks
- User → Tasks (createdBy)
- Task → Activities
- Task → Comments
- Activity → Comments
- Comment → Comments (threading)

### Many-to-Many

- ProjectTask ↔ Materials (with quantity)
- ProjectTask ↔ Users (assignees)
- ProjectTask ↔ Users (watchers)

### Polymorphic

- Attachment → parent (Task, Activity, Comment)
- TaskComment → parent (Task, Activity, Comment)
- Notification → entity (any resource)

## Cascade Delete Tree

```
Organization
├── Department
│   ├── User
│   │   ├── Task (createdBy)
│   │   │   ├── Activity
│   │   │   │   ├── Comment
│   │   │   │   │   └── Attachment
│   │   │   │   └── Attachment
│   │   │   ├── Comment
│   │   │   │   ├── Comment (nested)
│   │   │   │   │   └── Attachment
│   │   │   │   └── Attachment
│   │   │   └── Attachment
│   │   ├── Activity (createdBy)
│   │   ├── Comment (createdBy)
│   │   ├── Attachment (uploadedBy)
│   │   ├── Material (addedBy)
│   │   └── Notification (createdBy)
│   ├── Task (department)
│   ├── Material (department)
│   └── Vendor (department)
└── [All resources in organization]
```

## File Coverage

This documentation covers all 16 model files:

1. `models/Organization.js`
2. `models/Department.js`
3. `models/User.js`
4. `models/BaseTask.js`
5. `models/ProjectTask.js`
6. `models/RoutineTask.js`
7. `models/AssignedTask.js`
8. `models/TaskActivity.js`
9. `models/TaskComment.js`
10. `models/Material.js`
11. `models/Vendor.js`
12. `models/Attachment.js`
13. `models/Notification.js`
14. `models/index.js` (model exports)
15. `models/plugins/softDelete.js`

**Total**: 15 models + 1 plugin = 16 files documented
