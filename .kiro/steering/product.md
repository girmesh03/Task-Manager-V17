---
inclusion: always
---

# Product Domain

Multi-tenant SaaS task manager with role-based access control structured in organization -> department -> user and enterprise environments.

## Critical Project Requirements, Design and Tasks:

> **The existing codebase MUST be respected.** Do not impose arbitrary patterns. Work > WITH the existing architecture, not against it.
>
> **To install any new packages that doesn't exist in backend/package.json and client/package.json, ask the user as yes or no. If the user provide yes, install the package and proceed accordingly and if the user provide no, then proceed to validate and correct without using a package.**

## Tenant Hierarchy

Organizations → Departments → Users

### Platform vs Customer Organizations

**Analogy**: Think of a shop that sells products. The shop owner (service provider) is the **platform organization**. Anyone who uses the shop's services (customers) are **customer organizations**. Both the shop owner and customers are organizations, but they have different access levels and purposes.

#### Platform Organization

**Definition**: The service provider organization that manages the entire system and all customer organizations.

**Characteristics**:

- **Identifier**: `isPlatformOrg: true` (immutable)
- **Creation**: Created during initial backend setup (seed data)
- **Purpose**: System administration, customer organization management, platform-wide oversight
- **Quantity**: Only ONE platform organization exists in the system
- **Access Level**: Can view and manage ALL customer organizations

**Structure**:

```
Platform Organization (isPlatformOrg: true)
├── Department 1
│   ├── User 1 (isPlatformUser: true, role: SuperAdmin, isHod: true)
│   ├── User 2 (isPlatformUser: true, role: Admin, isHod: false)
│   ├── User 3 (isPlatformUser: true, role: Manager, isHod: false)
│   └── User 4 (isPlatformUser: true, role: User, isHod: false)
├── Department 2
│   ├── User 5 (isPlatformUser: true, role: Admin, isHod: true)
│   └── User 6 (isPlatformUser: true, role: User, isHod: false)
└── Resources (Tasks, Materials, Vendors, etc.)
```

**User Characteristics**:

- `isPlatformUser: true` (automatically set based on organization)
- `isHod: true` for SuperAdmin and Admin roles only
- Roles: SuperAdmin, Admin, Manager, User (same as customer organizations)
- **Platform SuperAdmin**: Has `crossOrg` scope - can access ALL customer organizations
- **Platform Admin/Manager/User**: Limited to platform organization only (same as customer organizations)

**Creation Process**:

```javascript
// Backend seed data (backend/mock/cleanSeedSetup.js)
1. Create Platform Organization (isPlatformOrg: true)
2. Create Platform Department
3. Create Platform SuperAdmin User (isPlatformUser: true, role: SuperAdmin, isHod: true)
```

#### Customer Organization

**Definition**: Regular tenant organizations that use the platform's services. Each customer organization is isolated from other customer organizations.

**Characteristics**:

- **Identifier**: `isPlatformOrg: false` (default)
- **Creation**: Created through frontend registration/onboarding process
- **Purpose**: Business operations, task management, resource management
- **Quantity**: Multiple customer organizations can exist
- **Access Level**: Can ONLY view and manage own organization (isolated)

**Structure**:

```
Customer Organization (isPlatformOrg: false)
├── Department 1
│   ├── User 1 (isPlatformUser: false, role: SuperAdmin, isHod: true)
│   ├── User 2 (isPlatformUser: false, role: Admin, isHod: false)
│   ├── User 3 (isPlatformUser: false, role: Manager, isHod: false)
│   └── User 4 (isPlatformUser: false, role: User, isHod: false)
├── Department 2
│   ├── User 5 (isPlatformUser: false, role: Admin, isHod: true)
│   └── User 6 (isPlatformUser: false, role: User, isHod: false)
└── Resources (Tasks, Materials, Vendors, etc.)
```

**User Characteristics**:

- `isPlatformUser: false` (automatically set based on organization)
- `isHod: true` for SuperAdmin and Admin roles only
- Roles: SuperAdmin, Admin, Manager, User (same as platform organization)
- **Customer SuperAdmin**: Has `crossDept` scope - can access all departments within own organization ONLY
- **Customer Admin**: Has `crossDept` scope - can access all departments within own organization ONLY
- **Customer Manager/User**: Limited to own department only

**Creation Process**:

```javascript
// Frontend registration form → Backend API
1. User fills registration form (organization + department + user details)
2. POST /api/auth/register
3. Backend creates:
   - Customer Organization (isPlatformOrg: false)
   - Department within organization
   - SuperAdmin User (isPlatformUser: false, role: SuperAdmin, isHod: true)
4. User receives welcome email
5. User can login and start using the system
```

### Structural Similarities

Both platform and customer organizations share the **SAME structure**:

1. **Organization Level**:

   - name, description, email, phone, address, industry, logoUrl
   - createdBy, createdAt, updatedAt
   - Soft delete fields (isDeleted, deletedAt, deletedBy)

2. **Department Level**:

   - name, description
   - organizationId (reference to parent organization)
   - createdBy, createdAt, updatedAt
   - Soft delete fields

3. **User Level**:

   - firstName, lastName, email, password, role, position
   - organizationId, departmentId (references)
   - isPlatformUser (automatically set based on organization)
   - isHod (automatically set based on role: SuperAdmin/Admin)
   - profilePicture, skills, employeeId, dateOfBirth, joinedAt
   - emailPreferences, status (Online/Offline/Away)
   - Soft delete fields

4. **Resource Level** (Tasks, Materials, Vendors, etc.):
   - All resources scoped to organization and department
   - Same fields, validation rules, and business logic
   - Soft delete support

### Key Differences

| Aspect                   | Platform Organization           | Customer Organization               |
| ------------------------ | ------------------------------- | ----------------------------------- |
| **isPlatformOrg**        | `true` (immutable)              | `false` (default)                   |
| **isPlatformUser**       | `true` (all users)              | `false` (all users)                 |
| **Creation**             | Backend seed data               | Frontend registration               |
| **Quantity**             | Only ONE                        | Multiple                            |
| **SuperAdmin Scope**     | `crossOrg` (all organizations)  | `crossDept` (own organization only) |
| **Admin Scope**          | `crossDept` (platform org only) | `crossDept` (own organization only) |
| **Manager/User Scope**   | `ownDept` (own department only) | `ownDept` (own department only)     |
| **Access to Other Orgs** | Platform SuperAdmin: YES        | NO (isolated)                       |
| **Purpose**              | System administration           | Business operations                 |
| **TTL on Deletion**      | Never expires (TTL = null)      | Never expires (TTL = null)          |

### Role-Based Access Comparison

#### Platform SuperAdmin (isPlatformUser: true, role: SuperAdmin)

- **Organization Access**: ALL organizations (platform + all customers)
- **Department Access**: All departments in all organizations
- **User Access**: All users in all organizations
- **Resource Access**: All resources in all organizations
- **Special Permissions**: Create/manage customer organizations, view cross-organization data
- **Scope**: `crossOrg` for Organization resource, `crossDept` for all other resources

#### Customer SuperAdmin (isPlatformUser: false, role: SuperAdmin)

- **Organization Access**: Own organization ONLY
- **Department Access**: All departments in own organization
- **User Access**: All users in own organization
- **Resource Access**: All resources in own organization
- **Special Permissions**: Create/manage departments, manage all users in organization
- **Scope**: `crossDept` (cannot access other organizations)

#### Platform Admin (isPlatformUser: true, role: Admin)

- **Organization Access**: Platform organization ONLY
- **Department Access**: All departments in platform organization
- **User Access**: All users in platform organization
- **Resource Access**: All resources in platform organization
- **Special Permissions**: Same as Customer Admin (no cross-org access)
- **Scope**: `crossDept` within platform organization

#### Customer Admin (isPlatformUser: false, role: Admin)

- **Organization Access**: Own organization ONLY
- **Department Access**: All departments in own organization
- **User Access**: All users in own organization
- **Resource Access**: All resources in own organization
- **Special Permissions**: Manage users, view cross-department resources
- **Scope**: `crossDept` within own organization

#### Manager (Platform or Customer)

- **Organization Access**: Own organization (read-only)
- **Department Access**: Own department ONLY
- **User Access**: Users in own department
- **Resource Access**: Resources in own department
- **Special Permissions**: Create tasks, manage own tasks
- **Scope**: `ownDept`

#### User (Platform or Customer)

- **Organization Access**: Own organization (read-only)
- **Department Access**: Own department (read-only)
- **User Access**: Users in own department (read-only)
- **Resource Access**: Resources in own department (read-only for materials/vendors)
- **Special Permissions**: Create/manage own tasks
- **Scope**: `ownDept` (read), `own` (write)

### Multi-Tenancy Isolation

**Critical Rule**: Customer organizations are completely isolated from each other. Only Platform SuperAdmin can access multiple organizations.

**Data Isolation Examples**:

```javascript
// Platform SuperAdmin query (can access all organizations)
{
  isDeleted: false
}

// Customer SuperAdmin query (scoped to own organization)
{
  organizationId: user.organizationId,
  isDeleted: false
}

// Manager/User query (scoped to own department)
{
  organizationId: user.organizationId,
  departmentId: user.departmentId,
  isDeleted: false
}
```

**Authorization Matrix Scoping**:

- **crossOrg**: Platform SuperAdmin ONLY (Organization resource)
- **crossDept**: SuperAdmin and Admin (within own organization)
- **ownDept**: Manager and User (own department only)
- **own**: All roles (own resources only)

### Head of Department (HOD)

**Definition**: Users with SuperAdmin or Admin roles are automatically designated as Head of Department.

**Characteristics**:

- `isHod: true` (automatically set for SuperAdmin and Admin)
- `isHod: false` (automatically set for Manager and User)
- **Uniqueness**: Only ONE HOD (SuperAdmin or Admin) per department
- **Special Privilege**: Only HOD users can be watchers on ProjectTasks

**HOD Rules**:

- Platform Organization: SuperAdmin and Admin are HOD
- Customer Organization: SuperAdmin and Admin are HOD
- Cannot have multiple HODs in same department
- Deleting last HOD in department is blocked (protection)

## Core Entities

### Primary Resources

- **Organization**: Tenant organizations (platform organization or customer organization)
- **Department**: Organizational units within organizations
- **User**: System users belongs to a department and organization
- **BaseTask**: Abstract base for all task types (discriminator pattern). Holds shared/common fields used by ProjectTask, AssignedTask, and RoutineTask.
  - **ProjectTask**: Department task outsourced to external vendor/client due to task complexity or department resource limitation. Vendor communicates orally with department users. Department users log activities tracking vendor's work.
  - **RoutineTask**: Daily routine task received (not assigned) by department users from organization outlets. No formal assignment. Materials added directly to RoutineTask (no TaskActivity).
  - **AssignedTask**: Task assigned to single department user or group of department users within organization.
- **TaskActivity**: Activities/updates logged on ProjectTask and AssignedTask ONLY (not on RoutineTask). Department users log activities with materials and attachments as proof.
- **TaskComment**: Comments on tasks, activities, and other comments (threaded, max depth 3). Can include attachments as references.
- **Attachment**: File attachments for tasks, activities, and comments
- **Material**: Inventory resource tracked via TaskActivity (for ProjectTask/AssignedTask) or added directly to RoutineTask
- **Vendor**: External client/vendor who takes and completes outsourced ProjectTasks. Communicates orally with department users.
- **Notification**: Real-time and email notifications for system events

### Data Relationships

- User → Department → Organization (hierarchical)
- BaseTask → ProjectTask/RoutineTask/AssignedTask (inheritance via discriminator)
- ProjectTask → Vendor (required, external client taking the task)
- ProjectTask → Materials (via TaskActivity, many-to-many with quantity)
- ProjectTask → Assignees/Watchers (many-to-many with Users, watchers HOD only)
- AssignedTask → Materials (via TaskActivity, many-to-many with quantity)
- RoutineTask → Materials (direct, many-to-many with quantity, no TaskActivity)
- TaskActivity → parent (ProjectTask or AssignedTask ONLY, not RoutineTask)
- TaskComment → parent (RoutineTask, ProjectTask, AssignedTask, TaskActivity, or TaskComment)
- Attachment → parent (any task type, TaskActivity, or TaskComment)
- Notification → recipient (User), entity (any resource)

## Roles & Permissions (Descending Privileges)

### 1. SuperAdmin (Platform & Organization Level)

**Platform SuperAdmin** (from platform org):

- Manage all tenant organizations (create, read, update, delete)
- View cross-organization data
- Full system administration

**Organization SuperAdmin**:

- Manage own organization (read, update, delete)
- Full department management (create, read, update, delete)
- Full user management within organization
- Full task, material, vendor management within own department
- Read access to cross-department resources
- Cannot access other organizations

### 2. Admin (Organization Level)

- Read own organization
- Read/update own department
- Read other departments
- Read all users in organization
- Full task, material, vendor management within own department
- Read access to cross-department resources

### 3. Manager (Department Level)

- Read own organization and department
- Read users in own department
- Create/read tasks in own department
- Update/delete own tasks
- Read materials and vendors

### 4. User (Standard)

- Read own organization and department
- Read users in own department
- Create/read tasks in own department
- Update/delete own tasks
- Read materials and vendors

**Authorization Matrix**: `backend/config/authorizationMatrix.json` defines exact permissions per role per resource (own, ownDept, crossDept, crossOrg operations).

## Core Features

### Task Management

- **Three Task Types**:
  - **ProjectTask**: Outsourced to external vendors with costs, materials via TaskActivity, multiple assignees, and watchers (HOD only)
  - **RoutineTask**: Daily routine tasks received from outlets. Materials added directly (no TaskActivity). Restricted status (no "To Do") and priority (no "Low")
  - **AssignedTask**: Assigned to single user or group with materials via TaskActivity
- **Task Lifecycle**: To Do → In Progress → Completed/Pending
- **Priority Levels**: Low, Medium, High, Urgent
- **Task Activities**: Track updates and progress on ProjectTask/AssignedTask ONLY. Department users log vendor work (ProjectTask) or own work (AssignedTask). Materials and attachments added to activities.
- **Task Comments**: Threaded comments (max depth 3) with mentions and attachments as references
- **Attachments**: Multiple file types (image, video, document, audio, other)
- **Materials Tracking**:
  - **ProjectTask/AssignedTask**: Materials linked via TaskActivity with quantities
  - **RoutineTask**: Materials added directly to task (no TaskActivity)
- **Assignees & Watchers**: Multiple users per task (max 20 each, watchers HOD only on ProjectTask)
- **Tags**: Categorize tasks (max 5 per task)
- **Cost Tracking**: Estimated vs actual costs with history (ProjectTask only)
- **Vendor Association**: ProjectTask must have vendorId for external client taking the task

### Material & Vendor Management

- **Material Inventory**: Track quantity, cost, price, unit types, categories
- **Material Categories**: Electrical, Mechanical, Plumbing, Hardware, Cleaning, Textiles, Consumables, Construction, Other
- **Unit Types**: 30+ unit types (pcs, kg, l, m, m2, m3, etc.)
- **Material Usage**:
  - **ProjectTask/AssignedTask**: Materials added to TaskActivity with quantities and attachments as proof
  - **RoutineTask**: Materials added directly to task (no TaskActivity intermediary)
- **Vendor Management**: External clients/vendors who take outsourced ProjectTasks. Contact info, descriptions, soft delete with reassignment
- **Material-Vendor Linking**: Associate materials with vendors for inventory tracking

### User Management

- **User Profiles**: Name, email, phone, position, employee ID, profile picture
- **Skills Tracking**: User skills with proficiency percentages (0-100%)
- **User Status**: Online/Offline/Away tracking
- **Department Assignment**: Users belong to one department
- **Role-Based Access**: Four role levels with granular permissions

### Organization & Department Management

- **Multi-tenant Organizations**: Isolated data per organization
- **Industry Classification**: 24 predefined industries
- **Department Structure**: Multiple departments per organization
- **Contact Information**: Address, phone, email for organizations
- **Soft Delete**: All resources support soft delete and restore

### Real-time Features

- **Socket.IO Integration**: Real-time updates for tasks, activities, comments
- **Room-Based Broadcasting**: User, department, and organization rooms
- **Event Types**: Created, Updated, Deleted, Restored events
- **Notification System**: Real-time notifications with read/unread status
- **User Status Tracking**: Online/offline/away status updates

### Email Notifications

- **Queue-Based System**: Asynchronous email sending via Nodemailer
- **Gmail SMTP**: Configured for Gmail with app passwords
- **Email Templates**: Standardized templates for task updates, mentions, welcomes
- **Notification Types**: Created, Updated, Deleted, Restored, Mention, Welcome, Announcement

### File Management

- **Attachment Types**: Image, video, document, audio, other
- **Size Limits**: 10MB (image), 100MB (video), 25MB (document), 20MB (audio), 50MB (other)
- **Supported Formats**: Images (.jpg, .jpeg, .png, .gif, .webp, .svg)
- **Cloudinary Integration**: Profile pictures and attachments
- **Max Attachments**: 10 per entity

## Critical Business Rules

### Authorization

- **Backend Authority**: `backend/config/authorizationMatrix.json` is the ONLY source of truth
- **Frontend Role**: Frontend NEVER decides permissions, only references matrix for UI visibility
- **Permission Scopes**: own (user's own resources), ownDept (same department), crossDept (other departments), crossOrg (other organizations)
- **Operation Types**: create, read, update, delete

### Soft Delete

- **Universal Soft Delete**: ALL resources use `isDeleted` flag (via softDelete plugin)
- **Never Hard Delete**: Physical deletion is prohibited
- **Restore Functionality**: All soft-deleted resources can be restored
- **Cascade Behavior**: Soft deleting parent resources affects children
- **Special Handling**: Vendor deletion requires material reassignment

### Data Validation

- **Backend Validators**: `backend/middlewares/validators/*` define ALL field names and rules
- **Frontend Compliance**: Frontend MUST match backend field names exactly
- **Constants Synchronization**: `backend/utils/constants.js` and `client/src/utils/constants.js` must be identical
- **No Hardcoding**: Always import constants, never hardcode "Completed", "Admin", etc.

### Real-time Communication

- **Socket.IO Singleton**: `backend/utils/socketInstance.js` manages single instance
- **HTTP-Only Cookies**: Authentication via cookies, not tokens in headers
- **Auto-Reconnect**: Client automatically reconnects with exponential backoff
- **Room Management**: Users join user, department, and organization rooms
- **Event Broadcasting**: Events broadcast to relevant rooms only

### Authentication & Security

- **JWT Tokens**: Access token (15min) + refresh token (7 days)
- **HTTP-Only Cookies**: Tokens stored in secure, httpOnly cookies
- **Token Rotation**: Refresh token rotates on each refresh
- **Password Security**: bcrypt hashing with salt rounds
- **Rate Limiting**: Production rate limiting on all API endpoints
- **Input Sanitization**: NoSQL injection prevention via express-mongo-sanitize

### Multi-tenancy

- **Data Isolation**: Organizations cannot access other organizations' data
- **Platform Exception**: Platform org SuperAdmins can view all organizations
- **Department Scoping**: Most operations scoped to user's department
- **Cross-Department Access**: Limited read access based on role

### Validation Limits

- **Attachments**: Max 10 per entity
- **Watchers**: Max 20 per task
- **Assignees**: Max 20 per task
- **Materials**: Max 20 per entity
- **Tags**: Max 5 per task
- **Mentions**: Max 5 per comment
- **Skills**: Max 10 per user
- **Comment Threading**: Max depth 3
- **Cost History**: Max 200 entries per ProjectTask
- **Notification Recipients**: Max 500 per notification

### Length Limits

- **Titles**: 50 characters
- **Descriptions**: 2000 characters
- **Comments**: 2000 characters
- **Organization Name**: 100 characters
- **Department Name**: 100 characters
- **User Names**: 20 characters each (firstName, lastName)
- **Email**: 50 characters
- **Password**: Min 8 characters
- **Position**: 100 characters
- **Address**: 500 characters
- **Phone**: E.164 format (+2510123456789 or 0123456789)
- **Skill Name**: 50 characters
- **Tag**: 50 characters each

## Complete Business Rules

### Ownership Fields by Resource

**Critical**: Ownership verification is required for authorization checks

- **User**: `_id` (self), `createdBy` (creator)
- **Organization**: `createdBy` (creator)
- **Department**: `createdBy` (creator)
- **Task** (all types): `createdBy` (creator)
- **TaskActivity**: `createdBy` (creator)
- **TaskComment**: `createdBy` (creator)
- **Material**: `addedBy` (creator)
- **Vendor**: `createdBy` (creator)
- **Attachment**: `uploadedBy` (uploader)
- **Notification**: `recipient` (recipient)

### TTL Expiry Periods

**Purpose**: Soft-deleted documents auto-expire after configured period

- **Users**: 365 days
- **Tasks** (all types): 180 days
- **TaskActivity**: 90 days
- **TaskComment**: 90 days
- **Organizations**: Never (TTL = null)
- **Departments**: 365 days
- **Materials**: 180 days
- **Vendors**: 180 days
- **Attachments**: 90 days
- **Notifications**: 30 days (or custom expiresAt)

### Cascade Relationships (Complete Tree)

**Critical**: All cascade operations MUST use MongoDB transactions

```
Organization
├── Department
│   ├── User
│   │   ├── Task (createdBy)
│   │   │   ├── TaskActivity
│   │   │   │   ├── TaskComment
│   │   │   │   │   └── Attachment
│   │   │   │   └── Attachment
│   │   │   ├── TaskComment
│   │   │   │   ├── TaskComment (nested, max depth 3)
│   │   │   │   │   └── Attachment
│   │   │   │   └── Attachment
│   │   │   └── Attachment
│   │   ├── TaskActivity (createdBy)
│   │   ├── TaskComment (createdBy)
│   │   ├── Attachment (uploadedBy)
│   │   ├── Material (addedBy)
│   │   └── Notification (createdBy)
│   ├── Task (department)
│   ├── Material (department)
│   └── Vendor (department)
└── [All resources in organization]
```

**Cascade Delete Order**:

1. **Organization**: Departments → Users → Tasks → Activities → Comments → Attachments → Materials → Vendors → Notifications
2. **Department**: Users → Tasks → Materials → Vendors (all in department)
3. **User**: Tasks (createdBy) → Activities (createdBy) → Comments (createdBy) → Attachments (uploadedBy) → Materials (addedBy) → Notifications (createdBy)
4. **Task**: Activities → Comments → Attachments → Notifications
5. **TaskActivity**: Comments → Attachments
6. **TaskComment**: Child Comments (recursive, max depth 3) → Attachments

**Cascade Protections**:

- Cannot delete last SuperAdmin in organization
- Cannot delete last Head of Department (SuperAdmin/Admin) in department
- Cannot delete platform organization (isPlatformOrg: true)
- Vendor deletion requires material reassignment

### Platform vs Customer Organization Rules (Detailed)

#### Platform Organization Rules

**Identification**:

- `isPlatformOrg: true` (immutable field, cannot be changed after creation)
- Only ONE platform organization exists in the entire system
- Created during initial backend setup (seed data)

**Purpose**:

- System administration and management
- Customer organization oversight
- Platform-wide configuration and monitoring
- Service provider operations

**User Management**:

- All users in platform organization have `isPlatformUser: true`
- Users automatically inherit platform status from organization
- Platform users CANNOT be moved to customer organizations (protection)
- Platform users CANNOT change their `isPlatformUser` flag

**Access Levels by Role**:

- **Platform SuperAdmin**:

  - `crossOrg` scope for Organization resource (can access ALL organizations)
  - `crossDept` scope for all other resources within platform organization
  - Can create, view, update, delete customer organizations
  - Can view cross-organization data and reports
  - Special permission: Manage all tenant organizations

- **Platform Admin**:

  - `crossDept` scope within platform organization ONLY
  - CANNOT access customer organizations
  - Same permissions as Customer Admin within platform organization

- **Platform Manager**:

  - `ownDept` scope within platform organization
  - CANNOT access customer organizations
  - Same permissions as Customer Manager

- **Platform User**:
  - `ownDept` scope (read), `own` scope (write)
  - CANNOT access customer organizations
  - Same permissions as Customer User

**Deletion Protection**:

- Platform organization CANNOT be deleted (hard-coded protection)
- Attempting to delete platform organization throws error
- TTL = null (never expires even if soft-deleted)

**Unique Constraints**:

- Only one organization can have `isPlatformOrg: true`
- Enforced at application level (not database level)

#### Customer Organization Rules

**Identification**:

- `isPlatformOrg: false` (default value)
- Multiple customer organizations can exist
- Created through frontend registration/onboarding process

**Purpose**:

- Business operations and task management
- Resource management (materials, vendors)
- Department and user management within organization
- Isolated tenant operations

**User Management**:

- All users in customer organization have `isPlatformUser: false`
- Users automatically inherit customer status from organization
- Customer users CANNOT be moved to platform organization (protection)
- Customer users CANNOT change their `isPlatformUser` flag

**Access Levels by Role**:

- **Customer SuperAdmin**:

  - `crossDept` scope within own organization ONLY
  - CANNOT access other customer organizations
  - CANNOT access platform organization
  - Can create, view, update, delete departments in own organization
  - Can manage all users in own organization
  - Can view cross-department resources

- **Customer Admin**:

  - `crossDept` scope within own organization ONLY
  - CANNOT access other customer organizations
  - CANNOT access platform organization
  - Can view all departments in own organization
  - Can manage users in own organization
  - Can view cross-department resources

- **Customer Manager**:

  - `ownDept` scope within own department
  - CANNOT access other
  - CANNOT access other organizations
  - Can create tasks in own department
  - Can manage own tasks

- **Customer User**:
  - `ownDept` scope (read), `own` scope (write)
  - CANNOT access other departments
  - CANNOT access other organizations
  - Can create tasks in own department
  - Can manage own tasks

**Multi-Tenancy Isolation**:

- Customer organizations are completely isolated from each other
- No customer organization can access another customer organization's data
- Database queries automatically scoped to user's organization
- Authorization middleware enforces organization boundaries

**Deletion Rules**:

- Customer organizations CAN be deleted (soft delete)
- Deletion cascades to all departments, users, and resources
- TTL = null (never expires even if soft-deleted)
- Deleted organizations can be restored by Platform SuperAdmin

#### Head of Department (HOD) Rules

**Identification**:

- `isHod: true` field (automatically set)
- Automatically set to `true` for SuperAdmin and Admin roles
- Automatically set to `false` for Manager and User roles

**Purpose**:

- Department leadership and oversight
- Task watcher eligibility (only HOD can be watchers on ProjectTasks)
- Department-level decision making

**HOD Assignment**:

- **SuperAdmin**: Always HOD (`isHod: true`)
- **Admin**: Always HOD (`isHod: true`)
- **Manager**: Never HOD (`isHod: false`)
- **User**: Never HOD (`isHod: false`)

**Uniqueness Constraint**:

- Only ONE HOD (SuperAdmin or Admin) per department
- Enforced at database level with unique index
- Attempting to create second HOD in same department throws error

**Deletion Protection**:

- Cannot delete last HOD in department
- System checks HOD count before allowing deletion
- Ensures every department has at least one HOD

**Watcher Eligibility**:

- Only HOD users can be watchers on ProjectTasks
- Validation enforced at task creation/update
- Non-HOD users cannot be added as watchers

**Automatic Updates**:

- Changing user role to SuperAdmin/Admin automatically sets `isHod: true`
- Changing user role to Manager/User automatically sets `isHod: false`
- Pre-save hook handles automatic updates

#### Cross-Organization Access Matrix

| User Type               | Platform Org Access | Own Org Access     | Other Customer Org Access |
| ----------------------- | ------------------- | ------------------ | ------------------------- |
| **Platform SuperAdmin** | Full (crossDept)    | Full (crossOrg)    | Full (crossOrg)           |
| **Platform Admin**      | Full (crossDept)    | No                 | No                        |
| **Platform Manager**    | Own Dept (ownDept)  | No                 | No                        |
| **Platform User**       | Own Dept (ownDept)  | No                 | No                        |
| **Customer SuperAdmin** | No                  | Full (crossDept)   | No                        |
| **Customer Admin**      | No                  | Full (crossDept)   | No                        |
| **Customer Manager**    | No                  | Own Dept (ownDept) | No                        |
| **Customer User**       | No                  | Own Dept (ownDept) | No                        |

#### Organization Creation Flows

**Platform Organization Creation** (Backend Seed Data):

```javascript
// backend/mock/cleanSeedSetup.js
1. Check if platform organization exists
2. If not exists:
   a. Create Organization (isPlatformOrg: true)
   b. Create Department (name: "Platform Department")
   c. Create SuperAdmin User (isPlatformUser: true, role: SuperAdmin, isHod: true)
3. Log success message
```

**Customer Organization Creation** (Frontend Registration):

```javascript
// Frontend: Registration Form
1. User fills form:
   - Organization details (name, email, industry, etc.)
   - Department details (name, description)
   - User details (firstName, lastName, email, password, etc.)
2. Submit to POST /api/auth/register

// Backend: Registration Controller
3. Validate all inputs (organization, department, user)
4. Start MongoDB transaction
5. Create Organization (isPlatformOrg: false)
6. Create Department (organizationId: new organization)
7. Create User (isPlatformUser: false, role: SuperAdmin, isHod: true)
8. Commit transaction
9. Send welcome email
10. Return success response

// Frontend: Post-Registration
11. Redirect to login page
12. User logs in with credentials
13. User accesses dashboard
```

#### Field Immutability Rules

**Immutable Fields** (cannot be changed after creation):

- `isPlatformOrg` (Organization model)
- `isPlatformUser` (User model) - automatically set, cannot be manually changed
- `isHod` (User model) - automatically set based on role, cannot be manually changed

**Automatic Field Updates**:

- `isPlatformUser`: Updated automatically when user's organization changes (blocked by validation)
- `isHod`: Updated automatically when user's role changes (SuperAdmin/Admin → true, Manager/User → false)

#### Validation Rules

**Organization Validation**:

- `isPlatformOrg` can only be set during creation
- Only one organization can have `isPlatformOrg: true`
- Platform organization cannot be deleted
- Customer organizations must have unique name, email, phone

**User Validation**:

- `isPlatformUser` must match organization's `isPlatformOrg` flag
- Users cannot be moved between platform and customer organizations
- `isHod` must be true for SuperAdmin/Admin, false for Manager/User
- Only one HOD per department

**Department Validation**:

- Department must belong to valid organization
- Department name must be unique within organization
- Cannot delete department if it's the last department in organization

### Multi-Tenancy Isolation Rules

**Data Isolation**:

- All queries automatically scoped to user's organization
- Organizations cannot access other organizations' data
- Exception: Platform SuperAdmin can access all organizations

**Department Scoping**:

- Manager/User: Can only access own department resources
- Admin/SuperAdmin: Can access all departments in organization
- Platform SuperAdmin: Can access all departments in all organizations

**Query Scoping Examples**:

```javascript
// Manager/User query (department-scoped)
{
  organizationId: user.organizationId,
  departmentId: user.departmentId,
  isDeleted: false
}

// Admin/SuperAdmin query (organization-scoped)
{
  organizationId: user.organizationId,
  isDeleted: false
}

// Platform SuperAdmin query (no scoping)
{
  isDeleted: false
}
```

### Soft Delete Rules (Detailed)

**Universal Soft Delete**:

- ALL models use soft delete plugin
- Soft delete sets `isDeleted: true`, `deletedAt: Date.now()`, `deletedBy: userId`
- Hard delete is completely blocked (throws error)
- Queries automatically filter out soft-deleted documents

**Restore Functionality**:

- All soft-deleted resources can be restored
- Restore sets `isDeleted: false`, `deletedAt: null`, `restoredAt: Date.now()`, `restoredBy: userId`
- Restore increments `restoreCount` for audit trail
- Restore validation ensures parent resources are not deleted

**Cascade Behavior**:

- Soft deleting parent cascades to all children
- Children are soft-deleted with same `deletedBy` user
- Cascade operations use MongoDB transactions (all-or-nothing)
- Restore does NOT automatically restore children (manual restore required)

**TTL Cleanup**:

- Soft-deleted documents auto-expire after configured period
- TTL index on `deletedAt` field triggers automatic cleanup
- Organizations never expire (TTL = null)
- Expired documents are permanently deleted by MongoDB

**Query Helpers**:

- `find()`: Excludes soft-deleted (default)
- `find().withDeleted()`: Includes soft-deleted
- `find().onlyDeleted()`: Only soft-deleted

### Task Type Rules (Detailed)

**ProjectTask** (Outsourced to external vendor):

- **Purpose**: Department task outsourced to external vendor/client due to complexity or resource limitation
- **Vendor**: `vendorId` field (required) - External client who takes and completes the task
- **Communication**: Vendor communicates orally with department users
- **Activity Logging**: Department users log activities tracking vendor's work progress
- **Costs**: `estimatedCost`, `actualCost`, `currency` fields
- **Cost History**: Max 200 entries, auto-tracked on cost changes
- **Materials**: Max 20 materials with quantities, added via TaskActivity
- **Assignees**: Max 20 users from same organization/department (department users managing vendor work)
- **Watchers**: Max 20 HOD users (SuperAdmin/Admin only)
- **Date Range**: `startDate` and `dueDate` (startDate < dueDate)
- **All Statuses**: To Do, In Progress, Completed, Pending
- **All Priorities**: Low, Medium, High, Urgent
- **TaskActivity**: Department users log vendor's work with materials and attachments as proof

**RoutineTask** (Daily routine tasks received from outlets):

- **Purpose**: Daily routine task received (not assigned) by department user from organization outlet
- **No Assignment**: User receives task to perform, not formally assigned
- **Date Range**: `startDate` and `dueDate` (both required, startDate < dueDate)
- **Status Restriction**: Cannot be "To Do" (must be In Progress, Completed, or Pending)
- **Priority Restriction**: Cannot be "Low" (must be Medium, High, or Urgent)
- **No Costs**: No cost tracking fields
- **Materials**: Added DIRECTLY to RoutineTask (no TaskActivity intermediary)
- **No Assignees**: No assignee field
- **No Watchers**: No watcher field
- **No TaskActivity**: Materials added directly to task, not via activities

**AssignedTask** (Assigned to department user(s)):

- **Purpose**: Task assigned to single department user or group of department users
- **Assignee**: `assignedTo` field (required) - Single user or array of users
- **Activity Logging**: Assigned users log their own work progress
- **Date Range**: `startDate` and `dueDate` (optional, startDate < dueDate if both provided)
- **All Statuses**: To Do, In Progress, Completed, Pending
- **All Priorities**: Low, Medium, High, Urgent
- **No Costs**: No cost tracking fields
- **Materials**: Added via TaskActivity with quantities
- **No Watchers**: No watcher field
- **TaskActivity**: Assigned users log their work with materials and attachments as proof

**Common Task Fields** (All types):

- **Title**: Required, max 50 characters
- **Description**: Required, max 2000 characters
- **Tags**: Max 5 tags, each max 50 characters, unique (case-insensitive)
- **Attachments**: Max 10 attachments, unique
- **Organization**: Required, reference to Organization
- **Department**: Required, reference to Department
- **CreatedBy**: Required, reference to User

### Material and Vendor Rules

**Material Rules**:

- **Categories**: Electrical, Mechanical, Plumbing, Hardware, Cleaning, Textiles, Consumables, Construction, Other
- **Unit Types**: 30+ types (pcs, kg, g, l, ml, m, cm, mm, m2, m3, box, pack, roll, sheet, etc.)
- **Quantity**: Must be positive number (min 0)
- **Cost/Price**: Must be positive number (min 0)
- **Currency**: Default ETB (Ethiopian Birr)
- **Vendor Link**: Optional reference to Vendor
- **Department Scoped**: Must belong to department
- **Organization Scoped**: Must belong to organization

**Vendor Rules**:

- **Definition**: External client/vendor who takes and completes outsourced ProjectTasks
- **Communication**: Communicates orally with department users within organization
- **Contact Person**: Required, max 100 characters
- **Email**: Required, valid email format, max 50 characters
- **Phone**: Required, E.164 format
- **Address**: Required, max 500 characters
- **Department Scoped**: Must belong to department
- **Organization Scoped**: Must belong to organization
- **Deletion**: Requires material reassignment before deletion
- **Material Link**: Can be linked to multiple materials

### Notification Rules

**Notification Types**:

- **Created**: Resource created (task, user, etc.)
- **Updated**: Resource updated
- **Deleted**: Resource soft-deleted
- **Restored**: Resource restored
- **Mention**: User mentioned in comment
- **Welcome**: New user welcome email
- **Announcement**: System-wide announcement

**Notification Delivery**:

- **Real-time**: Socket.IO event to user room
- **Email**: Asynchronous email via queue (if user preferences allow)
- **In-App**: Stored in database with read/unread status

**Notification Expiry**:

- **Default TTL**: 30 days
- **Custom Expiry**: Can set custom `expiresAt` date
- **Auto-Cleanup**: Expired notifications automatically deleted

**Notification Limits**:

- **Max Recipients**: 500 per notification
- **Batch Creation**: Use `createBulkNotifications` for multiple recipients

**User Email Preferences**:

- **enabled**: Master switch for all emails
- **taskNotifications**: Task created/updated/deleted
- **taskReminders**: Task due date reminders
- **mentions**: User mentioned in comments
- **announcements**: System announcements
- **welcomeEmails**: Welcome email for new users
- **passwordReset**: Password reset emails

### Comment Threading Rules

**Threading Structure**:

- **Max Depth**: 3 levels (comment → reply → reply to reply)
- **Parent Types**: Task (all types), TaskActivity, TaskComment
- **Polymorphic**: Uses `parentId` and `parentModel` fields

**Comment Limits**:

- **Content**: Max 2000 characters
- **Mentions**: Max 5 users per comment
- **Attachments**: Max 10 per comment

**Comment Cascade**:

- Deleting comment cascades to child comments (recursive)
- Deleting comment cascades to attachments
- Max depth 3 prevents infinite recursion

**Mention Rules**:

- Mentioned users must be in same organization
- Mentioned users receive notification
- Mentioned users receive email (if preferences allow)

### Activity Tracking Rules

**TaskActivity Purpose**:

- Track updates and progress on ProjectTask and AssignedTask
- Cannot be created for RoutineTask

**Activity Fields**:

- **Content**: Required, max 2000 characters
- **Parent**: Required, reference to ProjectTask or AssignedTask
- **ParentModel**: Required, "ProjectTask" or "AssignedTask"
- **CreatedBy**: Required, reference to User
- **Department**: Required, reference to Department
- **Organization**: Required, reference to Organization

**Activity Limits**:

- **Attachments**: Max 10 per activity
- **Comments**: Unlimited comments on activity

**Activity Cascade**:

- Deleting activity cascades to comments
- Deleting activity cascades to attachments
- Deleting parent task cascades to activities

### File Upload Rules (Detailed)

**File Types and Size Limits**:

- **Image** (.jpg, .jpeg, .png, .gif, .webp, .svg): Max 10MB
- **Video** (.mp4, .avi, .mov, .wmv): Max 100MB
- **Document** (.pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx): Max 25MB
- **Audio** (.mp3, .wav, .ogg): Max 20MB
- **Other**: Max 50MB

**Cloudinary Integration**:

- **Direct Upload**: Client → Cloudinary → Backend
- **URL Storage**: Cloudinary URL stored in database
- **Public ID**: Cloudinary public ID for deletion
- **Folder Structure**: Organized by resource type

**Attachment Model**:

- **Filename**: Original filename
- **FileUrl**: Cloudinary URL
- **FileType**: Image, Video, Document, Audio, Other
- **FileSize**: Size in bytes
- **ParentId**: Reference to parent resource
- **ParentModel**: Task, TaskActivity, TaskComment
- **UploadedBy**: Reference to User
- **Department**: Reference to Department
- **Organization**: Reference to Organization

**Attachment Limits**:

- **Max per Entity**: 10 attachments
- **Unique**: No duplicate attachments per entity

**Attachment Cascade**:

- Deleting parent resource cascades to attachments
- Soft-deleted attachments can be restored

### Authorization Matrix (Complete)

**Permission Scopes**:

- **own**: User's own resources only
- **ownDept**: Resources in user's department
- **crossDept**: Resources across departments in organization
- **crossOrg**: Resources across organizations (Platform SuperAdmin only)

**Operation Types**:

- **create**: Create new resources
- **read**: View resources
- **update**: Modify resources
- **delete**: Soft delete resources

**Role Hierarchy** (descending privileges):

1. **SuperAdmin** (Platform or Organization)
2. **Admin** (Organization)
3. **Manager** (Department)
4. **User** (Standard)

**Complete Authorization Matrix**:

```json
{
  "User": {
    "SuperAdmin": {
      "create": ["ownDept", "crossDept"],
      "read": ["ownDept", "crossDept"],
      "update": ["ownDept", "crossDept"],
      "delete": ["ownDept", "crossDept"]
    },
    "Admin": {
      "create": ["ownDept", "crossDept"],
      "read": ["ownDept", "crossDept"],
      "update": ["ownDept", "crossDept"],
      "delete": ["ownDept", "crossDept"]
    },
    "Manager": {
      "create": ["ownDept"],
      "read": ["ownDept"],
      "update": ["own"],
      "delete": []
    },
    "User": {
      "create": [],
      "read": ["ownDept"],
      "update": ["own"],
      "delete": []
    }
  },
  "Task": {
    "SuperAdmin": {
      "create": ["ownDept", "crossDept"],
      "read": ["ownDept", "crossDept"],
      "update": ["ownDept", "crossDept"],
      "delete": ["ownDept", "crossDept"]
    },
    "Admin": {
      "create": ["ownDept", "crossDept"],
      "read": ["ownDept", "crossDept"],
      "update": ["ownDept", "crossDept"],
      "delete": ["ownDept", "crossDept"]
    },
    "Manager": {
      "create": ["ownDept"],
      "read": ["ownDept"],
      "update": ["own"],
      "delete": ["own"]
    },
    "User": {
      "create": ["ownDept"],
      "read": ["ownDept"],
      "update": ["own"],
      "delete": ["own"]
    }
  },
  "Material": {
    "SuperAdmin": {
      "create": ["ownDept", "crossDept"],
      "read": ["ownDept", "crossDept"],
      "update": ["ownDept", "crossDept"],
      "delete": ["ownDept", "crossDept"]
    },
    "Admin": {
      "create": ["ownDept", "crossDept"],
      "read": ["ownDept", "crossDept"],
      "update": ["ownDept", "crossDept"],
      "delete": ["ownDept", "crossDept"]
    },
    "Manager": {
      "create": [],
      "read": ["ownDept"],
      "update": [],
      "delete": []
    },
    "User": {
      "create": [],
      "read": ["ownDept"],
      "update": [],
      "delete": []
    }
  },
  "Vendor": {
    "SuperAdmin": {
      "create": ["ownDept", "crossDept"],
      "read": ["ownDept", "crossDept"],
      "update": ["ownDept", "crossDept"],
      "delete": ["ownDept", "crossDept"]
    },
    "Admin": {
      "create": ["ownDept", "crossDept"],
      "read": ["ownDept", "crossDept"],
      "update": ["ownDept", "crossDept"],
      "delete": ["ownDept", "crossDept"]
    },
    "Manager": {
      "create": [],
      "read": ["ownDept"],
      "update": [],
      "delete": []
    },
    "User": {
      "create": [],
      "read": ["ownDept"],
      "update": [],
      "delete": []
    }
  },
  "Organization": {
    "SuperAdmin": {
      "create": ["crossOrg"],
      "read": ["own", "crossOrg"],
      "update": ["own"],
      "delete": ["own"]
    },
    "Admin": {
      "create": [],
      "read": ["own"],
      "update": [],
      "delete": []
    },
    "Manager": {
      "create": [],
      "read": ["own"],
      "update": [],
      "delete": []
    },
    "User": {
      "create": [],
      "read": ["own"],
      "update": [],
      "delete": []
    }
  },
  "Department": {
    "SuperAdmin": {
      "create": ["own"],
      "read": ["own", "crossDept"],
      "update": ["own", "crossDept"],
      "delete": ["own", "crossDept"]
    },
    "Admin": {
      "create": [],
      "read": ["own", "crossDept"],
      "update": ["own"],
      "delete": []
    },
    "Manager": {
      "create": [],
      "read": ["own"],
      "update": [],
      "delete": []
    },
    "User": {
      "create": [],
      "read": ["own"],
      "update": [],
      "delete": []
    }
  }
}
```

**Note**: Platform SuperAdmin has `crossOrg` scope for Organization resource only. All other resources use `crossDept` as maximum scope.

## Architecture

Full-stack JavaScript monorepo with separate backend (Node.js/Express) and frontend (React/Vite) codebases.

**Deployment Model**: Production backend serves frontend static files from `../client/dist`.

**Development Model**: Separate dev servers (backend:4000, frontend:3000) with CORS configuration.

**Database**: MongoDB with Mongoose ODM, pagination plugin, and soft delete plugin.

**State Management**: Redux Toolkit with persistence for auth, user, and resource state.

**Real-time**: Socket.IO for bidirectional communication with room-based broadcasting.
