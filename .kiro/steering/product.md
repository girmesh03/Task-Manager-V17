---
inclusion: always
---

# Product Domain: Task Manager V17

Multi-tenant SaaS task management system for hospitality and enterprise with hierarchical organizations.

## System Overview

**Purpose**: Complete, production-ready Multi-Tenant SaaS Task Manager with strict data isolation, role-based access control, and real-time collaboration.

**Key Features**:

- Multi-tenancy with platform and customer organizations
- Three task types: ProjectTask, RoutineTask, AssignedTask
- Four-tier role hierarchy: SuperAdmin, Admin, Manager, User
- Real-time updates via Socket.IO
- Soft delete with cascade operations
- Comprehensive validation and authorization

## Multi-Tenancy Architecture (CRITICAL)

### Platform Organization

A **Platform Organization** is the service provider managing the entire SaaS system:

- **Identifier**: `isPlatformOrg: true` (immutable field in Organization model)
- **Purpose**: Oversees all customer organizations, manages system-wide operations
- **Quantity**: Exactly ONE platform organization exists in the system
- **Creation**: Created via backend seed data during initial system setup
- **Users**: All users have `isPlatformUser: true` (auto-set from organization)
- **Special Access**: Platform SuperAdmin can view/manage ALL customer organizations (crossOrg scope)
- **Deletion Protection**: Platform organization CANNOT be deleted (hard-coded protection)
- **TTL**: Never expires (no automatic cleanup)
- **Use Case**: System administrators, support staff, platform management team

### Customer Organization

A **Customer Organization** is a regular tenant using the platform:

- **Identifier**: `isPlatformOrg: false` (default value in Organization model)
- **Purpose**: Independent business entity using the task management system
- **Quantity**: Multiple customer organizations can exist
- **Creation**: Created via frontend registration/onboarding process
- **Users**: All users have `isPlatformUser: false` (auto-set from organization)
- **Data Isolation**: Completely isolated from other customer organizations
- **Access Scope**: Customer SuperAdmin can only access own organization (crossDept scope within org)
- **Deletion**: CAN be deleted (soft delete with cascade to all related data)
- **TTL**: Never expires (no automatic cleanup)
- **Use Case**: Companies, businesses, teams using the platform as tenants

### Data Isolation Rules

**CRITICAL**: ALL queries MUST filter by organization to prevent cross-tenant data leaks.

**Query Scoping Examples**:

```javascript
// Platform SuperAdmin/Admin query (can access all organizations for read/delete/restore operation)
{
  isDeleted: false
}

// Platform SuperAdmin/Admin query (can access all organizations for all operation except read/delete/restore)
{
  organization: user.organization._id,
  department: user.department._id,
  isDeleted: false
}

// Customer SuperAdmin/Admin query (scoped to own organization for only read operation)
{
  organization: user.organization._id,
  isDeleted: false
}

// Customer SuperAdmin/Admin query (scoped to own organization and department)
{
  organization: user.organization._id,
  department: user.department._id,
  isDeleted: false
}

// Manager/User query (scoped to own department)
{
  organization: user.organization._id,
  department: user.department._id,
  isDeleted: false
}
```

## Role-Based Access Control (RBAC)

### Four Roles (Descending Privileges)

1. **SuperAdmin** (Platform & Organization Level)
2. **Admin** (Organization Level)
3. **Manager** (Department Level)
4. **User** (Standard)

### Platform SuperAdmin

- **Organization Access**: ALL organizations (platform + all customers)
- **Department Access**: All departments in all organizations
- **User Access**: All users in all organizations
- **Resource Access**: All resources in all organizations
- **Special Permissions**: Create/manage customer organizations, view cross-organization data
- **Scope**: `crossOrg` for Organization resource, `crossDept` for all other resources

### Customer SuperAdmin

- **Organization Access**: Own organization ONLY
- **Department Access**: All departments in own organization
- **User Access**: All users in own organization
- **Resource Access**: All resources in own organization
- **Special Permissions**: Create/manage departments, manage all users in organization
- **Scope**: `crossDept` (cannot access other organizations)

### Platform Admin

- **Organization Access**: Platform organization ONLY
- **Department Access**: All departments in platform organization
- **User Access**: All users in platform organization
- **Resource Access**: All resources in platform organization
- **Special Permissions**: Same as Customer Admin (no cross-org access)
- **Scope**: `crossDept` within platform organization

### Customer Admin

- **Organization Access**: Own organization ONLY
- **Department Access**: All departments in own organization
- **User Access**: All users in own organization
- **Resource Access**: All resources in own organization
- **Special Permissions**: Manage users, view cross-department resources
- **Scope**: `crossDept` within own organization

### Manager (Platform or Customer)

- **Organization Access**: Own organization (read-only)
- **Department Access**: Own department ONLY
- **User Access**: Users in own department
- **Resource Access**: Resources in own department
- **Special Permissions**: Create tasks, manage own tasks
- **Scope**: `ownDept`

### User (Platform or Customer)

- **Organization Access**: Own organization (read-only)
- **Department Access**: Own department (read-only)
- **User Access**: Users in own department (read-only)
- **Resource Access**: Resources in own department (read-only for materials/vendors)
- **Special Permissions**: Create/manage own tasks
- **Scope**: `ownDept` (read), `own` (write)

### Authorization Matrix

**File**: `backend/config/authorizationMatrix.json` defines all permissions.

**Operations**: create, read, update, delete

**Scopes**: own, ownDept, crossDept, crossOrg

**Check via**: `authorization` middleware before controller execution

## Head of Department (HOD) Rules

### Definition

Users with SuperAdmin or Admin roles are automatically designated as Head of Department.

### Characteristics

- `isHod: true` for SuperAdmin and Admin roles (automatically set)
- `isHod: false` for Manager and User roles (automatically set)
- **Uniqueness**: Only ONE HOD (SuperAdmin or Admin) per department
- Enforced at database level with unique index
- **Special Privilege**: Only HOD users can be watchers on ProjectTasks

### HOD Assignment

- **SuperAdmin**: Always HOD (`isHod: true`)
- **Admin**: Always HOD (`isHod: true`)
- **Manager**: Never HOD (`isHod: false`)
- **User**: Never HOD (`isHod: false`)

### Deletion Protection

- Cannot delete last HOD in department
- System checks HOD count before allowing deletion
- Ensures every department has at least one HOD

### Watcher Eligibility

- Only HOD users can be watchers on ProjectTasks
- Validation enforced at task creation/update
- Non-HOD users cannot be added as watchers

### Automatic Updates

- Changing user role to SuperAdmin/Admin automatically sets `isHod: true`
- Changing user role to Manager/User automatically sets `isHod: false`
- Pre-save hook handles automatic updates

## Task Domain Model

### Three Task Types (Mongoose Discriminators from BaseTask)

#### 1. ProjectTask (Vendor-Outsourced Task)

**Purpose**: Department task outsourced to external vendor/client due to complexity or resource limitation

**Fields**:

- title (max 50, required)
- vendor (ref: Vendor, REQUIRED)
- estimatedCost (min 0)
- actualCost (min 0)
- currency (default: ETB)
- costHistory (array max 200: {amount, type: estimated/actual, updatedBy: ref User, updatedAt})
- startDate
- dueDate (must be after startDate)

**Business Logic**:

- Vendor communicates orally with department users
- Department users log activities tracking vendor's work progress
- Materials added via TaskActivity with attachments as proof

**Statuses**: To Do, In Progress, Completed, Pending (ALL available)

**Priorities**: Low, Medium, High, Urgent (ALL available)

**TaskActivity**: YES - Department users log vendor's work progress

**Watchers**: Only HOD users allowed

#### 2. RoutineTask (Outlet-Received Task)

**Purpose**: Daily routine task received by department user from organization outlet

**Fields**:

- materials (array max 20: {material: ref Material, quantity: min 0}, added DIRECTLY)
- startDate (REQUIRED)
- dueDate (REQUIRED, must be after startDate)

**Business Logic**:

- User receives task to perform, not formally assigned
- Materials added DIRECTLY to RoutineTask (NO TaskActivity intermediary)
- Comment via TaskComment to make changes/update/correction on the task

**Status Restriction**: Cannot be "To Do" (must be In Progress, Completed, or Pending)

**Priority Restriction**: Cannot be "Low" (must be Medium, High, or Urgent)

**TaskActivity**: NO - Not applicable for routine tasks

**Watchers**: Allowed (HOD only)

#### 3. AssignedTask (User-Assigned Task)

**Purpose**: Task assigned to single department user or group of department users

**Fields**:

- title (max 50, required)
- assignees (ref: User or array of Users, REQUIRED)
- startDate
- dueDate (must be after startDate if both provided)

**Business Logic**:

- Assigned users log their own work progress
- Materials added via TaskActivity with attachments as proof
- Comment via TaskComment to make changes/update/correction on the task

**Statuses**: To Do, In Progress, Completed, Pending (ALL available)

**Priorities**: Low, Medium, High, Urgent (ALL available)

**TaskActivity**: YES - Assigned users log their own work progress

**Watchers**: Allowed (HOD only)

### Task Lifecycle

To Do → In Progress → Completed/Pending

### Assignees vs Watchers

- **Assignees** (max 20): Users assigned to complete the task
- **Watchers** (max 20): Head of Department roles only, receive notifications but don't execute

## Core Entities and Data Models

### Organization (Tenant Root)

**Purpose**: Top-level entity representing either platform or customer organization

**Fields**:

- name (unique, lowercase, max 100)
- description (max 2000)
- email (unique, valid, max 50)
- phone (unique, /^(\+251\d{9}|0\d{9})$/)
- address (max 500)
- industry (one of 24 industries, max 100)
- logoUrl (url, publicId)
- createdBy (ref: User)
- isPlatformOrg (boolean, immutable, indexed)
- isDeleted, deletedAt, deletedBy, restoredAt, restoredBy
- createdAt, updatedAt

**Indexes**: name (unique, partial), email (unique, partial), phone (unique, partial), isPlatformOrg, isDeleted, deletedAt (TTL: never)

**Cascades to**: Departments, Users, Tasks, Materials, Vendors, Notifications

**Protection**: Platform organization CANNOT be deleted

### Department (Organizational Unit)

**Purpose**: Subdivision within an organization for team/functional grouping

**Fields**:

- name (max 100)
- description (max 2000)
- hod (ref: User)
- organization (ref: Organization, required)
- createdBy (ref: User)
- isDeleted, deletedAt, deletedBy, restoredAt, restoredBy
- createdAt, updatedAt

**Indexes**: Unique name per organization, organization reference

**Cascades to**: Users, Tasks, Materials

**Constraint**: Must have at least one HOD (Head of Department)

**TTL**: 365 days

### User (System Actor)

**Purpose**: Individual with authentication and role-based permissions

**Fields**:

- firstName (max 20)
- lastName (max 20)
- dateOfBirth (not future)
- employeeId (4-digit: 1000-9999, unique per org)
- skills (array max 10: {skill: max 50, percentage: 0-100})
- role (enum: SuperAdmin/Admin/Manager/User, default: User)
- password (min 8, bcrypt ≥12 salt rounds, select: false)
- email (unique per org, lowercase, max 50)
- position (max 100, if isHod unique within organization)
- organization (ref: Organization, required)
- department (ref: Department, required)
- isHod (boolean, indexed, auto-set from role)
- isPlatformUser (boolean, immutable, indexed, auto-set from org)
- profilePicture (url, publicId)
- lastLogin
- passwordResetToken (select: false, bcrypt hashed)
- passwordResetExpires (select: false)
- emailPreferences (enabled, taskNotifications, taskReminders, mentions, announcements, welcomeEmails, passwordReset)
- joinedAt (required, not future)
- isDeleted, deletedAt, deletedBy, restoredAt, restoredBy
- createdAt, updatedAt

**Virtuals**: fullName (firstName + lastName)

**Indexes**: {organization, email} unique, {department} unique for HOD, {organization, employeeId} unique, isPlatformUser, isHod, isDeleted, deletedAt (TTL: 365 days)

**Instance Methods**: comparePassword, generatePasswordResetToken, verifyPasswordResetToken, clearPasswordResetToken

**Cascades to**: Tasks (createdBy), Activities (createdBy), Comments (createdBy), Attachments (uploadedBy), Materials (addedBy), Notifications (createdBy), remove from task watchers

**Protection**: Cannot delete last SuperAdmin in organization, cannot delete last HOD in department

**TTL**: 365 days

### BaseTask (Abstract Base - Discriminator Pattern)

**Purpose**: Base discriminator model for all task types

**Fields**:

- description (max 2000)
- status (enum: To Do/In Progress/Completed/Pending, default: To Do)
- priority (enum: Low/Medium/High/Urgent, default: Medium)
- organization (ref: Organization, required)
- department (ref: Department, required)
- createdBy (ref: User, required)
- attachments (array max 10, ref: Attachment, unique)
- watchers (array max 20, ref: User, unique, HOD only)
- tags (array max 5, max 50 each, unique case-insensitive)
- taskType (discriminator key: ProjectTask/RoutineTask/AssignedTask)
- isDeleted, deletedAt, deletedBy, restoredAt, restoredBy
- createdAt, updatedAt

**Indexes**: {organization, department, createdAt}, {organization, createdBy, createdAt}, {organization, department, startDate, dueDate}, {organization, department, status, priority, dueDate}, tags (text), isDeleted, deletedAt (TTL: 180 days)

**Cascades to**: Activities, Comments, Attachments, Notifications

**TTL**: 180 days

### TaskActivity (Progress Log)

**Purpose**: Track updates and progress on ProjectTask and AssignedTask ONLY (NOT RoutineTask)

**Fields**:

- activity (max 2000)
- parent (ref: ProjectTask or AssignedTask ONLY)
- parentModel (ProjectTask or AssignedTask)
- materials (array max 20: {material: ref Material, quantity: min 0})
- createdBy (ref: User, required)
- department (ref: Department, required)
- organization (ref: Organization, required)
- isDeleted, deletedAt, deletedBy, restoredAt, restoredBy
- createdAt, updatedAt

**Activity Logging**:

- ProjectTask: Department users log vendor's work
- AssignedTask: Assigned users log their own work

**Material Tracking**: Materials added to TaskActivity with quantities and attachments as proof

**Cascades to**: Comments, Attachments

**TTL**: 90 days

### TaskComment (Discussion Thread)

**Purpose**: Comments on tasks, activities, or other comments (threaded)

**Fields**:

- comment (max 2000)
- parent (ref: Task/TaskActivity/TaskComment)
- parentModel (Task/TaskActivity/TaskComment)
- mentions (array max 5, ref: User)
- createdBy (ref: User, required)
- department (ref: Department, required)
- organization (ref: Organization, required)
- isDeleted, deletedAt, deletedBy, restoredAt, restoredBy
- createdAt, updatedAt

**Threading**: Max depth 3 levels (comment → reply → reply to reply)

**Cascades to**: Child Comments (recursive), Attachments

**TTL**: 90 days

### Material (Inventory Item)

**Purpose**: Physical or consumable item used in tasks

**Fields**:

- name (max 100)
- description (max 2000)
- category (enum: Electrical/Mechanical/Plumbing/Hardware/Cleaning/Textiles/Consumables/Construction/Other)
- unitType (enum: 30+ types - pcs/kg/g/l/ml/m/cm/mm/m2/m3/box/pack/roll/sheet/etc)
- price (min 0)
- department (ref: Department, required)
- organization (ref: Organization, required)
- addedBy (ref: User)
- isDeleted, deletedAt, deletedBy, restoredAt, restoredBy
- createdAt, updatedAt

**Usage Patterns**:

- ProjectTask/AssignedTask: Materials added to TaskActivity with quantities
- RoutineTask: Materials added directly to task (no TaskActivity)

**TTL**: 180 days

### Vendor (External Client)

**Purpose**: External vendor/client who takes and completes outsourced ProjectTasks

**Fields**:

- name (max 100)
- description (max 2000)
- contactPerson (max 100)
- email (valid, max 50)
- phone (/^(\+251\d{9}|0\d{9})$/)
- address (max 500)
- department (ref: Department, required)
- organization (ref: Organization, required)
- createdBy (ref: User)
- isDeleted, deletedAt, deletedBy, restoredAt, restoredBy
- createdAt, updatedAt

**Business Logic**: External client who takes ProjectTask. Communicates orally with department users. Department users log vendor's work via TaskActivity.

**Special**: Deletion requires material reassignment

**TTL**: 180 days

### Attachment (File Reference)

**Purpose**: File uploaded to Cloudinary linked to task, activity, or comment

**Fields**:

- filename
- fileUrl (Cloudinary URL)
- fileType (enum: Image/Video/Document/Audio/Other)
- fileSize (bytes)
- parent (ref: Task/TaskActivity/TaskComment)
- parentModel (Task/TaskActivity/TaskComment)
- uploadedBy (ref: User, required)
- department (ref: Department, required)
- organization (ref: Organization, required)
- isDeleted, deletedAt, deletedBy, restoredAt, restoredBy
- createdAt, updatedAt

**File Types**:

- Image (.jpg/.jpeg/.png/.gif/.webp/.svg max 10MB)
- Video (.mp4/.avi/.mov/.wmv max 100MB)
- Document (.pdf/.doc/.docx/.xls/.xlsx/.ppt/.pptx max 25MB)
- Audio (.mp3/.wav/.ogg max 20MB)
- Other (max 50MB)

**Max Attachments**: 10 per entity

**TTL**: 90 days

### Notification (User Alert)

**Purpose**: System notification for user about events and mentions

**Fields**:

- title
- message
- type (enum: Created/Updated/Deleted/Restored/Mention/Welcome/Announcement)
- isRead (default: false)
- recipient (ref: User, required)
- entity (ref: any resource)
- entityModel (any resource type)
- organization (ref: Organization, required)
- expiresAt (default: 30 days from creation)
- createdAt, updatedAt

**TTL**: 30 days (or custom expiresAt)

## Validation Constraints (ENFORCE)

### Task Limits

- Assignees: max 20
- Watchers: max 20 (Head of Department only)
- Attachments: max 10 per entity
- Tags: max 5
- Comments: max depth 3 (prevent infinite nesting)
- Mentions per comment: max 5
- Materials per task/activity: max 20
- Cost history entries: max 200
- Skills per user: max 10

### Material Categories (9 total)

Electrical, Mechanical, Plumbing, Hardware, Cleaning, Textiles, Consumables, Construction, Other

### Unit Types (30+ options)

pcs, kg, g, l, ml, m, cm, mm, m², cm², m³, ft, ft², ft³, in, in², in³, yd, yd², yd³, gal, qt, pt, oz, lb, ton, box, roll, bag, set, liter, milliliter, cubic meter, square meter

### Attachment Types

Images, videos, documents (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX), audio

### Length Limits

- Title: max 50
- Description: max 2000
- Comment: max 2000
- Organization name: max 100
- Department name: max 100
- User name: max 20
- Email: max 50
- Password: min 8
- Position: max 100
- Address: max 500
- Skill name: max 50
- Tag: max 50

### File Size Limits

- Image: 10MB
- Video: 100MB
- Document: 25MB
- Audio: 20MB
- Other: 50MB

## Soft Delete System

### Universal Soft Delete

**All Resources**: Support soft delete (isDeleted flag) and restore

**Fields Added to Every Model**:

- isDeleted (Boolean, default: false, indexed)
- deletedAt (Date, default: null, indexed)
- deletedBy (ref: User, default: null, indexed)
- restoredAt (Date, default: null)
- restoredBy (ref: User, default: null)

### Cascade Behavior

When parent deleted, cascade to children:

- **Organization** → Departments, Users, Tasks, Materials, Vendors, Notifications
- **Department** → Users, Tasks, Materials
- **Task** → Activities, Comments, Attachments, Notifications
- **User** → Tasks (createdBy), Activities, Comments, Attachments, remove from task watchers
- **TaskActivity** → Comments, Attachments
- **TaskComment** → Child Comments (recursive), Attachments

### TTL Cleanup (Auto-Expiry After Soft Delete)

Permanent deletion after retention period:

- Organizations: Never (TTL = null)
- Departments: 365 days
- Users: 365 days
- Tasks (all types): 180 days
- TaskActivity: 90 days
- TaskComment: 90 days
- Materials: 180 days
- Vendors: 180 days
- Attachments: 90 days
- Notifications: 30 days

### Query Pattern

- Exclude soft-deleted by default unless `deleted=true` query param
- Use `withDeleted()` to include soft-deleted documents
- Use `onlyDeleted()` to return only soft-deleted documents

### Hard Delete Protection

- `deleteOne()` - Blocked (throws error)
- `deleteMany()` - Blocked (throws error)
- `findOneAndDelete()` - Blocked (throws error)
- `remove()` - Blocked (throws error)

## Real-Time Features

### Socket.IO Rooms

- **User room**: `user:{userId}` - Personal notifications
- **Department room**: `department:{deptId}` - Department updates
- **Organization room**: `organization:{orgId}` - Organization-wide events

### User Status

Online, Offline, Away (tracked via Socket.IO connection)

### Event Types

- `task:created`, `task:updated`, `task:deleted`, `task:restored`
- `activity:created`, `activity:updated`
- `comment:created`, `comment:updated`, `comment:deleted`
- `notification:created`
- `user:online`, `user:offline`, `user:away`
- `organization:created`, `department:created`, `material:created`, `vendor:created`

### Notification Types

Task assignment, status change, comment mention, watcher notification, deadline reminder, welcome, announcement

## Material & Vendor Management

### Material Model

- Category (9 options)
- Unit type (30+ options)
- Cost and price tracking
- Vendor association (optional)
- Quantity management
- Organization and department scoped

### Vendor Model

- Contact information (name, person, email, phone, address)
- Material associations
- Organization-scoped
- Used exclusively for ProjectTasks

### ProjectTask Integration

Materials linked to tasks with quantities for cost calculation via TaskActivity

## Email System

### Queue-Based Email

Nodemailer with Gmail integration (app passwords required)

### Template Events

- User registration
- Task assignment
- Status changes
- Deadline reminders
- Comment mentions
- Password reset
- Welcome emails

### Configuration

`EMAIL_USER` and `EMAIL_PASSWORD` in backend/.env

## Pagination Convention

### Backend

1-based page numbers (page=1 is first page)

### Frontend DataGrid

0-based page numbers (page=0 is first page)

### Automatic Conversion

RTK Query transforms between conventions

### Default Settings

- Items per page: 10
- Max items per page: 100
- Page size options: [5, 10, 25, 50, 100]

## Industry Classifications

24 predefined options:

Technology, Healthcare, Finance, Education, Retail, Manufacturing, Hospitality, Real Estate, Transportation, Energy, Agriculture, Construction, Media, Telecommunications, Automotive, Aerospace, Pharmaceutical, Legal, Consulting, Non-Profit, Government, Entertainment, Food & Beverage, Other

## Critical Implementation Rules

1. **Multi-Tenancy**: ALWAYS filter by organization in queries to prevent cross-tenant data leaks
2. **Watchers**: Validate Head of Department role before allowing watcher assignment on ProjectTasks
3. **Task Type Restrictions**: Enforce RoutineTask status/priority constraints (no "To Do", no "Low")
4. **Soft Delete**: Never hard delete - use soft delete with cascade operations
5. **Comment Depth**: Prevent nesting beyond 3 levels to avoid infinite recursion
6. **Validation Source**: Backend validators are single source of truth for field names and constraints
7. **Constants**: Import from `utils/constants.js` - never hardcode domain values
8. **Authorization**: Check permissions via middleware before business logic execution
9. **Socket Rooms**: Emit to appropriate rooms based on scope (user/department/organization)
10. **Discriminators**: Use BaseTask discriminators for task type polymorphism
11. **Transactions**: Use MongoDB sessions for all write operations with cascade
12. **HOD Uniqueness**: Enforce only ONE HOD per department at database level
13. **Platform Protection**: Platform organization cannot be deleted (hard-coded protection)
14. **Auto-set Fields**: isPlatformUser and isHod are automatically set, never manually assigned
15. **Material Handling**: RoutineTask adds materials directly, ProjectTask/AssignedTask via TaskActivity
