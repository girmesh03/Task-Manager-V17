---
inclusion: always
---

# Product Domain

Multi-tenant SaaS task manager with role-based access control for hospitality and enterprise environments.

## Tenant Hierarchy

Platform Org (ID: `000000000000000000000000`) → Organizations → Departments → Users

**Platform Organization**: Special organization that manages all tenant organizations. Only SuperAdmins from platform org can view/manage other organizations.

## Core Entities

### Primary Resources

- **Organization**: Tenant organizations with industry, address, contact info
- **Department**: Organizational units within organizations
- **User**: System users with roles, profiles, skills, and status tracking
- **BaseTask**: Abstract base for all task types (discriminator pattern)
  - **ProjectTask**: Tasks with cost tracking, materials, assignees, watchers
  - **RoutineTask**: Recurring tasks with restricted status/priority
  - **AssignedTask**: Tasks assigned to specific users
- **TaskActivity**: Activities/updates on ProjectTask and AssignedTask
- **TaskComment**: Comments on tasks, activities, and other comments (threaded, max depth 3)
- **Attachment**: File attachments for tasks, activities, and comments
- **Material**: Inventory items with quantity, cost, pricing, categories
- **Vendor**: Supplier/vendor information with contact details
- **Notification**: Real-time and email notifications for system events

### Data Relationships

- User → Department → Organization (hierarchical)
- BaseTask → ProjectTask/RoutineTask/AssignedTask (inheritance via discriminator)
- ProjectTask → Materials (many-to-many with quantity)
- ProjectTask → Assignees/Watchers (many-to-many with Users)
- TaskActivity → parent (ProjectTask or AssignedTask)
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

- **Three Task Types**: ProjectTask (with costs/materials), RoutineTask (recurring), AssignedTask (user-specific)
- **Task Lifecycle**: To Do → In Progress → Completed/Pending
- **Priority Levels**: Low, Medium, High, Urgent
- **Routine Task Restrictions**: No "To Do" status, no "Low" priority
- **Task Activities**: Track updates and progress on ProjectTask/AssignedTask
- **Task Comments**: Threaded comments (max depth 3) with mentions
- **Attachments**: Multiple file types (image, video, document, audio, other)
- **Materials Tracking**: Link materials to tasks with quantities
- **Assignees & Watchers**: Multiple users per task (max 20 each)
- **Tags**: Categorize tasks (max 5 per task)
- **Cost Tracking**: Estimated vs actual costs with history (ProjectTask only)

### Material & Vendor Management

- **Material Inventory**: Track quantity, cost, price, unit types, categories
- **Material Categories**: Electrical, Mechanical, Plumbing, Hardware, Cleaning, Textiles, Consumables, Construction, Other
- **Unit Types**: 30+ unit types (pcs, kg, l, m, m2, m3, etc.)
- **Vendor Management**: Contact info, descriptions, soft delete with reassignment
- **Material-Vendor Linking**: Associate materials with vendors

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
- **User Names**: 20 characters each
- **Email**: 50 characters
- **Password**: Min 8 characters

## Architecture

Full-stack JavaScript monorepo with separate backend (Node.js/Express) and frontend (React/Vite) codebases.

**Deployment Model**: Production backend serves frontend static files from `../client/dist`.

**Development Model**: Separate dev servers (backend:4000, frontend:3000) with CORS configuration.

**Database**: MongoDB with Mongoose ODM, pagination plugin, and soft delete plugin.

**State Management**: Redux Toolkit with persistence for auth, user, and resource state.

**Real-time**: Socket.IO for bidirectional communication with room-based broadcasting.
