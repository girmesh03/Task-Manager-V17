---
inclusion: always
---

# Backend API Documentation

Complete documentation of all backend API endpoints, controllers, validators, and business logic.

## Critical Rules

- **Field Names**: Backend validators are the ONLY source of truth for field names
- **Constants**: Always import from `utils/constants.js`, never hardcode values
- **Error Handling**: Use `CustomError` class for all errors
- **Async Handlers**: Wrap all async route handlers with `express-async-handler`
- **Soft Delete**: All resources support soft delete via `isDeleted` flag
- **Authorization**: All protected routes require JWT authentication and role-based authorization

## API Base URL

- **Development**: `http://localhost:4000/api`
- **Production**: `https://yourdomain.com/api`

## Authentication

All protected endpoints require JWT authentication via HTTP-only cookies:

- **Access Token**: 15 minutes expiry, stored in `access_token` cookie
- **Refresh Token**: 7 days expiry, stored in `refresh_token` cookie
- **Cookie Settings**: httpOnly, secure (production), sameSite: 'strict'

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    /* resource data */
  },
  "pagination": {
    /* pagination info (list endpoints only) */
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errorCode": "ERROR_CODE",
  "stack": "..." // development only
}
```

### Pagination Response

```json
{
  "success": true,
  "data": {
    "[resource]": [
      /* array of resources */
    ],
    "pagination": {
      "page": 1, // 1-based (backend)
      "limit": 10,
      "totalCount": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

**Note**: Backend uses 1-based pagination. Frontend MUI DataGrid uses 0-based. The `MuiDataGrid` component automatically handles conversion.

## Rate Limiting

**Production Only**:

- **General API**: 100 requests per 15 minutes per IP
- **Auth Endpoints**: 5 requests per 15 minutes per IP

**Headers**:

- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets

## Common Query Parameters

### List Endpoints

- `page` (number): Page number (1-based, default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `sortBy` (string): Field to sort by (default: 'createdAt')
- `sortOrder` (string): 'asc' or 'desc' (default: 'desc')
- `search` (string): Search term for text fields
- `includeDeleted` (boolean): Include soft-deleted resources (SuperAdmin only)

### Filtering

Resource-specific filters are documented in each endpoint section.

## Authentication Endpoints

### POST /api/auth/register

Register a new organization with department and SuperAdmin user.

**Authentication**: None (public endpoint)

**Rate Limit**: 5 requests per 15 minutes

**Request Body**:

```json
{
  "organization": {
    "name": "string (required, max 100)",
    "description": "string (optional, max 2000)",
    "industry": "string (required, one of 24 industries)",
    "address": "string (optional)",
    "phone": "string (optional)",
    "email": "string (required, valid email)"
  },
  "department": {
    "name": "string (required, max 100)",
    "description": "string (optional, max 2000)"
  },
  "user": {
    "firstName": "string (required, max 20)",
    "lastName": "string (required, max 20)",
    "email": "string (required, valid email, max 50)",
    "password": "string (required, min 8)",
    "phone": "string (optional)",
    "position": "string (optional)"
  }
}
```

**Response (201)**:

```json
{
  "success": true,
  "message": "Organization registered successfully",
  "data": {
    "organization": {
      /* organization object */
    },
    "department": {
      /* department object */
    },
    "user": {
      /* user object without password */
    }
  }
}
```

**Side Effects**:

- Creates organization, department, and user in single transaction
- User assigned SuperAdmin role
- Welcome email sent to user
- Socket.IO: Emits `organization:created` to platform organization room

**Validation Rules** (`authValidators.js`):

- Organization name: required, 1-100 characters
- Organization email: required, valid email format
- Organization industry: required, must be one of predefined industries
- Department name: required, 1-100 characters
- User email: required, valid email, unique
- User password: required, min 8 characters
- User firstName/lastName: required, max 20 characters each

### POST /api/auth/login

Authenticate user and set JWT tokens in HTTP-only cookies.

**Authentication**: None (public endpoint)

**Rate Limit**: 5 requests per 15 minutes

**Request Body**:

```json
{
  "email": "string (required, valid email)",
  "password": "string (required)"
}
```

**Response (200)**:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "role": "string",
      "departmentId": "string",
      "organizationId": "string",
      "status": "string",
      "profilePicture": "string",
      "skills": [{ "name": "string", "proficiency": "number" }]
    }
  }
}
```

**Cookies Set**:

- `access_token`: JWT access token (15 min expiry)
- `refresh_token`: JWT refresh token (7 days expiry)

**Side Effects**:

- User status updated to 'Online'
- Socket.IO: User joins user, department, and organization rooms
- Socket.IO: Emits `user:online` to department and organization rooms

**Business Logic**:

1. Find user by email (including soft-deleted check)
2. Verify password with bcrypt
3. Check if user is soft-deleted
4. Generate access and refresh tokens
5. Set HTTP-only cookies
6. Update user status to 'Online'
7. Return user data (password excluded)

### DELETE /api/auth/logout

Logout user and clear authentication cookies.

**Authentication**: Required (refresh token)

**Rate Limit**: 5 requests per 15 minutes

**Response (200)**:

```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Side Effects**:

- Cookies cleared (access_token, refresh_token)
- User status updated to 'Offline'
- Socket.IO: User disconnected from all rooms
- Socket.IO: Emits `user:offline` to department and organization rooms

### GET /api/auth/refresh-token

Get new access token using refresh token.

**Authentication**: Required (refresh token)

**Rate Limit**: 5 requests per 15 minutes

**Response (200)**:

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "user": {
      /* user object */
    }
  }
}
```

**Cookies Set**:

- `access_token`: New JWT access token (15 min expiry)
- `refresh_token`: New JWT refresh token (7 days expiry) - Token rotation

**Business Logic**:

1. Verify refresh token from cookie
2. Find user by ID from token
3. Generate new access and refresh tokens
4. Set new HTTP-only cookies
5. Return user data

### POST /api/auth/forgot-password

Request password reset email.

**Authentication**: None (public endpoint)

**Rate Limit**: 5 requests per 15 minutes

**Request Body**:

```json
{
  "email": "string (required, valid email)"
}
```

**Response (200)**:

```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

**Side Effects**:

- Password reset token generated (1 hour expiry)
- Reset email sent with reset link
- Token stored in user document

**Security**: Always returns success even if email not found (prevents email enumeration)

### POST /api/auth/reset-password

Reset password using valid reset token.

**Authentication**: None (public endpoint)

**Rate Limit**: 5 requests per 15 minutes

**Request Body**:

```json
{
  "token": "string (required)",
  "password": "string (required, min 8)"
}
```

**Response (200)**:

```json
{
  "success": true,
  "message": "Password reset successful"
}
```

**Business Logic**:

1. Verify reset token is valid and not expired
2. Hash new password with bcrypt
3. Update user password
4. Clear reset token
5. Send confirmation email

## User Endpoinoiire JWT authentication and role-based authorization.

### POST /api/users

Create a new user within a department.

**Authentication**: Required

**Authorization**: `User` resource, `create` operation

**Request Body**:

```json
{
  "firstName": "string (required, max 20)",
  "lastName": "string (required, max 20)",
  "email": "string (required, valid email, unique, max 50)",
  "password": "string (required, min 8)",
  "role": "string (required, one of: SuperAdmin, Admin, Manager, User)",
  "departmentId": "string (required, valid ObjectId)",
  "employeeId": "string (optional)",
  "position": "string (optional)",
  "phone": "string (optional)",
  "profilePicture": "string (optional, Cloudinary URL)",
  "skills    {
      "name": "string (required)",
      "proficiency": "number (required, 0-100)"
    }
  ]
}
```

**Response (201)**:

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      /* user object without password */
    }
  }
}
```

**Side Effects**:

- Welcome email sent to new user
- Socket.IO: Emieated` to department and organization rooms
- Notification created for department admins

**Vdation Rules** (`userValidators.js`):

- Email: required, valid format, unique, max 50 chars
- Password: required, min 8 chars
- Role: required, must be valid role from constants
- DepartmentId: required, must exist and not be soft-deleted
- Skills: max 10 skills, each with name and proficiency (0-100)
- FirstName/LastName: required, max 20 chars each

**Authorization Matrix**:

- SuperAdmin: Can create users in any department within organization
- Admin: Can create users in any department within organization
- Manager: Can create users in own department only
- User: Cannot create users

### GET /api/users

List users with pagination, filtering, and sorting.

**Authentication**: Required

**Authorization**: `User` resource, `read` operation

**Query Parameters**:

- `page` (number): Page number (1-based, default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `sortBy` (string): Field to sort by (default: 'createdAt')
- `sortOrder` (string): 'asc' or 'desc' (default: 'desc')
- `search` (string): Search in firstName, lastName, email, employeeId
- `role` (string): Filter by role
- `departmentId` (string): Filter by department
- `status` (string): Filter by status (Online, Offline, Away)
- `includeDeleted` (boolean): Include soft-deleted users (SuperAdmin only)

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "string",
        "firstName": "string",
        "lastName": "string",
        "email": "string",
        "role": "string",
        "departmentId": {
          /* populated department */
        },
        "organizationId": {
          /* populated organization */
        },
        "employeeId": "string",
        "position": "string",
        "phone": "string",
        "profilePicture": "string",
        "skills": [{ "name": "string", "proficiency": "number" }],
        "status": "string",
        "isDeleted": "boolean",
        "createdAt": "ISO date",
        "updatedAt": "ISO date"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalCount": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

**Authorization Scoping**:

- SuperAdmin (Platform): Can view users across all organizations
- SuperAdmin (Customer): Can view all users in own organization
- Admin: Can view all users in own organization
- Manager: Can view users in own department
- User: Can view users in own department

**Business Logic**:

1. Build query based on authorization scope
2. Apply filters (role, department, status, search)
3. Apply soft delete filter (unless includeDeleted=true and SuperAdmin)
4. Apply pagination and sorting
5. Populate department and organization references
6. Return paginated results

### GET /api/users/:userId

Get single user by ID with complete profile.

**Authentication**: Required | **Authorization**: `User` resource, `read` operation

**Response**: User object with populated department and organization

### PUT /api/users/:userId

Update user by SuperAdmin (can change role, department, etc.).

**Authentication**: Required | **Authorization**: `User` resource, `update` operation

**Request Body**: Partial user object (all fields optional except those being updated)

### PUT /api/users/:userId/profile

Update own profile with role-based field restrictions.

**Authentication**: Required | **Authorization**: `User` resource, `update` operation (own resource)

**Restrictions**:

- Users cannot change their own role
- Users cannot change their own department (SuperAdmin only)
- Users cannot change their own organizationId

### GET /api/users/:userId/account

Get current authenticated user's account information.

**Authentication**: Required | **Authorization**: `User` resource, `read` operation (own resource)

**Response**: User object with account details

### GET /api/users/:userId/profile

Get current authenticated user's complete profile and dashboard data.

**Authentication**: Required | **Authorization**: `User` resource, `read` operation (own resource)

**Response**: User object with dashboard statistics (tasks, notifications, etc.)

### DELETE /api/users/:userId

Soft delete a user with cascade deletion.

**Authentication**: Required | **Authorization**: `User` resource, `delete` operation

**Side Effects**:

- User marked as deleted (isDeleted = true)
- User's tasks, activities, comments soft-deleted (cascade)
- Socket.IO: Emits `user:deleted` to department and organization rooms
- Notification sent to affected users

### PATCH /api/users/:userId/restore

Restore a soft-deleted user.

**Authentication**: Required | **Authorization**: `User` resource, `update` operation

**Side Effects**:

- User restored (isDeleted = false)
- User's tasks, activities, comments can be restored separately
- Socket.IO: Emits `user:restored` to department and organization rooms

## Organization Endpoints

**Base Path**: `/api/organizations`

**Resources**: Organization CRUD operations

**Key Endpoints**:

- `GET /api/organizations` - List organizations (Platform SuperAdmin only)
- `GET /api/organizations/:id` - Get organization details
- `POST /api/organizations` - Create organization (Platform SuperAdmin only)
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Soft delete organization (cascade to departments and users)
- `PATCH /api/organizations/:id/restore` - Restore organization

**Special Fields**:

- `isPlatformOrg` (boolean): Identifies the platform organization
- `industry` (string): One of 24 predefined industries

**Validation**: `organizationValidators.js`

**Controller**: `organizationControllers.js`

## Department Endpoints

**Base Path**: `/api/departments`

**Resources**: Department CRUD operations within organizations

**Key Endpoints**:

- `GET /api/departments` - List departments (scoped by organization)
- `GET /api/departments/:id` - Get department details
- `POST /api/departments` - Create department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Soft delete department (cascade to users and tasks)
- `PATCH /api/departments/:id/restore` - Restore department

**Authorization Scoping**:

- SuperAdmin: All departments in organization
- Admin: All departments in organization
- Manager/User: Own department only

**Validation**: `departmentValidators.js`

**Controller**: `departmentControllers.js`

## Task Endpoints

**Base Path**: `/api/tasks`

**Resources**: Task CRUD operations (ProjectTask, RoutineTask, AssignedTask)

**Key Endpoints**:

- `GET /api/tasks` - List tasks with filtering by type, status, priority, assignee
- `GET /api/tasks/:id` - Get task details with activities and comments
- `POST /api/tasks` - Create task (type determined by taskType field)
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Soft delete task (cascade to activities, comments, attachments)
- `PATCH /api/tasks/:id/restore` - Restore task

**Task Types** (Discriminator Pattern):

- **ProjectTask**: Department task outsourced to external vendor. Requires vendorId. Department users log vendor's work via TaskActivity. Materials added to TaskActivity.
- **RoutineTask**: Daily routine task received from outlets. Materials added directly to task (no TaskActivity). Restricted status (no "To Do") and priority (no "Low").
- **AssignedTask**: Task assigned to single user or group. Users log their own work via TaskActivity. Materials added to TaskActivity.

**Special Features**:

- **Vendor Association**: ProjectTask requires vendorId (external client)
- **Activity Logging**:
  - ProjectTask: Department users log vendor's work
  - AssignedTask: Assigned users log their own work
  - RoutineTask: No TaskActivity (materials added directly)
- **Material Tracking**:
  - ProjectTask/AssignedTask: Materials via TaskActivity with quantities
  - RoutineTask: Materials directly on task
- **Cost tracking**: ProjectTask only (estimated, actual, history max 200)
- **Multiple assignees and watchers**: ProjectTask only (max 20 each, watchers HOD only)
- **Tags**: Max 5 per task
- **Due date tracking**: All task types
- **Status workflow**: To Do → In Progress → Completed/Pending

**Validation**: `taskValidators.js`

**Controller**: `taskControllers.js`

## Material Endpoints

**Base Path**: `/api/materials`

**Resources**: Material inventory management

**Key Endpoints**:

- `GET /api/materials` - List materials with filtering by category, vendor
- `GET /api/materials/:id` - Get material details
- `POST /api/materials` - Create material
- `PUT /api/materials/:id` - Update material (quantity, cost, price)
- `DELETE /api/materials/:id` - Soft delete material
- `PATCH /api/materials/:id/restore` - Restore material

**Material Categories**:

- Electrical, Mechanical, Plumbing, Hardware, Cleaning, Textiles, Consumables, Construction, Other

**Unit Types** (30+ types):

- pcs, kg, g, l, ml, m, cm, mm, m2, m3, box, pack, roll, sheet, etc.

**Fields**:

- name, description, category, quantity, unitType, cost, price, currency, vendorId

**Validation**: `materialValidators.js`

**Controller**: `materialControllers.js`

## Vendor Endpoints

**Base Path**: `/api/vendors`

**Resources**: External vendor/client management for outsourced ProjectTasks

**Purpose**: Manage external clients/vendors who take and complete ProjectTasks

**Key Endpoints**:

- `GET /api/vendors` - List vendors
- `GET /api/vendors/:id` - Get vendor details with linked materials and ProjectTasks
- `POST /api/vendors` - Create vendor
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Soft delete vendor (requires material reassignment)
- `PATCH /api/vendors/:id/restore` - Restore vendor

**Business Logic**:

- Vendors are external clients who take outsourced ProjectTasks
- Vendors communicate orally with department users
- Department users log vendor's work progress via TaskActivity
- Deleting vendor requires reassigning all linked materials to another vendor
- Validation ensures vendor has no active materials before deletion

**Fields**:

- name, description, contactPerson, email, phone, address

**Validation**: `vendorValidators.js`

**Controller**: `vendorControllers.js`

## Notification Endpoints

**Base Path**: `/api/notifications`

**Resources**: User notification management

**Key Endpoints**:

- `GET /api/notifications` - List user's notifications (unread first)
- `GET /api/notifications/:id` - Get notification details
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `PATCH /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete notification

**Notification Types**:

- Created, Updated, Deleted, Restored, Mention, Welcome, Announcement

**TTL**: Notifications expire after configured period (default: 30 days)

**Fields**:

- title, message, type, isRead, recipientId, entityId, entityModel, expiresAt

**Validation**: `notificationValidators.js`

**Controller**: `notificationControllers.js`

## Attachment Endpoints

**Base Path**: `/api/attachments`

**Resources**: File attachment management

**Key Endpoints**:

- `GET /api/attachments` - List attachments
- `GET /api/attachments/:id` - Get attachment details
- `POST /api/attachments` - Upload attachment (Cloudinary)
- `DELETE /api/attachments/:id` - Delete attachment

**File Types**:

- Image (.jpg, .jpeg, .png, .gif, .webp, .svg)
- Video (.mp4, .avi, .mov, .wmv)
- Document (.pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx)
- Audio (.mp3, .wav, .ogg)
- Other

**Size Limits**:

- Image: 10MB
- Video: 100MB
- Document: 25MB
- Audio: 20MB
- Other: 50MB

**Max Attachments**: 10 per entity

**Fields**:

- filename, fileUrl, fileType, fileSize, parentId, parentModel, uploadedBy

**Validation**: `attachmentValidators.js`

**Controller**: `attachmentControllers.js`

## Controller Patterns

All controllers follow consistent patterns for maintainability and predictability.

### Standard Controller Structure

```javascript
import asyncHandler from "express-async-handler";
import CustomError from "../errorHandler/CustomError.js";
import { Model } from "../models/index.js";
import { emitSocketEvent } from "../utils/socketEmitter.js";
import { formatResponse } from "../utils/responseTransform.js";

export const createResource = asyncHandler(async (req, res) => {
  // 1. Extract and validate data
  const { field1, field2 } = req.body;
  const { userId, departmentId, organizationId } = req.user;

  // 2. Check authorization and ownership
  // (handled by authorization middleware)

  // 3. Perform business logic
  const resource = await Model.create({
    field1,
    field2,
    createdBy: userId,
    departmentId,
    organizationId,
  });

  // 4. Emit Socket.IO event
  emitSocketEvent("resource:created", resource, {
    rooms: [`department:${departmentId}`, `organization:${organizationId}`],
  });

  // 5. Send response
  res
    .status(201)
    .json(formatResponse(true, "Resource created successfully", { resource }));
});
```

### Common Controller Patterns

**Pagination**:

```javascript
const {
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
} = req.query;

const options = {
  page: parseInt(page),
  limit: parseInt(limit),
  sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
  populate: ["departmentId", "organizationId"],
};

const result = await Model.paginate(query, options);
```

**Soft Delete**:

```javascript
// Delete
await resource.softDelete(); // Sets isDeleted = true, deletedAt = now

// Restore
await resource.restore(); // Sets isDeleted = false, deletedAt = null
```

**Error Handling**:

```javascript
if (!resource) {
  throw CustomError.notFound("Resource not found");
}

if (resource.isDeleted) {
  throw CustomError.gone("Resource has been deleted");
}

if (!hasPermission) {
  throw CustomError.forbidden("Insufficient permissions");
}
```

**Multi-tenancy Scoping**:

```javascript
// Scope query to user's organization
const query = {
  organizationId: req.user.organizationId,
  isDeleted: false,
};

// Scope to user's department (Manager/User)
if (req.user.role === "Manager" || req.user.role === "User") {
  query.departmentId = req.user.departmentId;
}
```

## Validator Patterns

All validators use `express-validator` for request validation. Validators are the **ONLY source of truth** for field names.

### Validator Structure

```javascript
import { body, param, query } from "express-validator";
import { validate } from "./validation.js";
import { USER_ROLES, TASK_STATUS } from "../../utils/constants.js";

export const validateCreateResource = [
  // Body validation
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 })
    .withMessage("Name must not exceed 100 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required")
    .isIn(Object.values(USER_ROLES))
    .withMessage("Invalid role"),

  // Optional fields
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description must not exceed 2000 characters"),

  // Array validation
  body("tags")
    .optional()
    .isArray({ max: 5 })
    .withMessage("Maximum 5 tags allowed"),

  body("tags.*")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Each tag must be 1-50 characters"),

  // Nested object validation
  body("skills")
    .optional()
    .isArray({ max: 10 })
    .withMessage("Maximum 10 skills allowed"),

  body("skills.*.name").trim().notEmpty().withMessage("Skill name is required"),

  body("skills.*.proficiency")
    .isInt({ min: 0, max: 100 })
    .withMessage("Proficiency must be 0-100"),

  // Custom validation
  body("departmentId")
    .trim()
    .notEmpty()
    .withMessage("Department ID is required")
    .isMongoId()
    .withMessage("Invalid department ID")
    .custom(async (value) => {
      const department = await Department.findById(value);
      if (!department || department.isDeleted) {
        throw new Error("Department not found or deleted");
      }
      return true;
    }),

  // Run validation
  validate,
];
```

### Query Parameter Validation

```javascript
export const validateGetAllResources = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be 1-100"),

  query("sortBy")
    .optional()
    .isIn(["createdAt", "updatedAt", "name"])
    .withMessage("Invalid sort field"),

  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be asc or desc"),

  query("search")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search term must be 1-100 characters"),

  query("includeDeleted")
    .optional()
    .isBoolean()
    .withMessage("includeDeleted must be boolean"),

  validate,
];
```

### Path Parameter Validation

```javascript
export const validateGetResource = [
  param("resourceId")
    .trim()
    .notEmpty()
    .withMessage("Resource ID is required")
    .isMongoId()
    .withMessage("Invalid resource ID"),

  validate,
];
```

### Conditional Validation

```javascript
body("taskType")
  .trim()
  .notEmpty()
  .withMessage("Task type is required")
  .isIn(["ProjectTask", "RoutineTask", "AssignedTask"])
  .withMessage("Invalid task type"),

// Only validate materials if taskType is ProjectTask
body("materials")
  .if(body("taskType").equals("ProjectTask"))
  .optional()
  .isArray({ max: 20 })
  .withMessage("Maximum 20 materials allowed"),

body("materials.*.materialId")
  .if(body("taskType").equals("ProjectTask"))
  .trim()
  .notEmpty()
  .withMessage("Material ID is required")
  .isMongoId()
  .withMessage("Invalid material ID"),

body("materials.*.quantity")
  .if(body("taskType").equals("ProjectTask"))
  .isFloat({ min: 0 })
  .withMessage("Quantity must be positive"),
```

### Validation Error Handler

```javascript
// middlewares/validators/validation.js
import { validationResult } from "express-validator";
import CustomError from "../../errorHandler/CustomError.js";

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));

    throw CustomError.badRequest("Validation failed", {
      errors: errorMessages,
    });
  }

  next();
};
```

## Services

### Email Service (`services/emailService.js`)

**Purpose**: Asynchronous email sending with queue management

**Configuration**:

- Provider: Gmail SMTP
- Host: smtp.gmail.com
- Port: 587 (TLS)
- Authentication: App-specific passwords

**Methods**:

- `initialize()`: Initialize email service and verify connection
- `sendEmail(to, subject, html)`: Add email to queue
- `getQueueStatus()`: Get current queue status
- `isInitialized()`: Check if service is ready

**Queue Behavior**:

- In-memory queue for async sending
- Automatic retry on failure
- Non-blocking (email failures don't crash server)

**Email Templates** (`templates/emailTemplates.js`):

- Task notifications (created, updated, deleted, restored)
- User mentions in comments
- Welcome emails for new users
- Password reset emails
- System announcements

### Notification Service (`services/notificationService.js`)

**Purpose**: Create and manage user notifications

**Methods**:

- `createNotification(data)`: Create notification for user(s)
- `createBulkNotifications(recipients, data)`: Create notifications for multiple users
- `markAsRead(notificationId)`: Mark notification as read
- `markAllAsRead(userId)`: Mark all user notifications as read
- `deleteExpired()`: Delete expired notifications (TTL cleanup)

**Notification Flow**:

1. Event occurs (task created, user mentioned, etc.)
2. Notification service creates notification document
3. Socket.IO emits `notification:created` to user room
4. Email service sends email (if configured)
5. Frontend displays toast and updates notification badge

## Utilities

### Constants (`utils/constants.js`)

**CRITICAL**: This file is the ONLY source of truth for all enum values. Never hardcode values.

**Key Constants**:

```javascript
// User Roles (descending privileges)
export const USER_ROLES = {
  SUPER_ADMIN: "SuperAdmin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  USER: "User",
};

// Task Status
export const TASK_STATUS = ["To Do", "In Progress", "Completed", "Pending"];

// Task Priority
export const TASK_PRIORITY = ["Low", "Medium", "High", "Urgent"];

// Task Types
export const TASK_TYPES = ["ProjectTask", "RoutineTask", "AssignedTask"];

// User Status
export const USER_STATUS = ["Online", "Offline", "Away"];

// Material Categories
export const MATERIAL_CATEGORIES = [
  "Electrical",
  "Mechanical",
  "Plumbing",
  "Hardware",
  "Cleaning",
  "Textiles",
  "Consumables",
  "Construction",
  "Other",
];

// Unit Types (30+ types)
export const UNIT_TYPES = [
  "pcs",
  "kg",
  "g",
  "l",
  "ml",
  "m",
  "cm",
  "mm",
  "m2",
  "m3",
  "box",
  "pack",
  "roll",
  "sheet",
  // ... more units
];

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  DEFAULT_SORT_BY: "createdAt",
  DEFAULT_SORT_ORDER: "desc",
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],
  MAX_LIMIT: 100,
};

// Validation Limits
export const LIMITS = {
  MAX_ATTACHMENTS: 10,
  MAX_WATCHERS: 20,
  MAX_ASSIGNEES: 20,
  MAX_MATERIALS: 20,
  MAX_TAGS: 5,
  MAX_MENTIONS: 5,
  MAX_SKILLS: 10,
  MAX_COMMENT_DEPTH: 3,
  MAX_COST_HISTORY: 200,
  MAX_NOTIFICATION_RECIPIENTS: 500,
};

// Length Limits
export const LENGTH_LIMITS = {
  TITLE_MAX: 50,
  DESCRIPTION_MAX: 2000,
  COMMENT_MAX: 2000,
  ORG_NAME_MAX: 100,
  DEPT_NAME_MAX: 100,
  USER_NAME_MAX: 20,
  EMAIL_MAX: 50,
  PASSWORD_MIN: 8,
};
```

### Response Transform (`utils/responseTransform.js`)

**Purpose**: Standardize API response format

**Methods**:

```javascript
// Success response
export const formatResponse = (success, message, data = null) => ({
  success,
  message,
  ...(data && { data }),
});

// Pagination response
export const formatPaginatedResponse = (
  success,
  message,
  resourceName,
  docs,
  pagination
) => ({
  success,
  message,
  data: {
    [resourceName]: docs,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      totalCount: pagination.totalDocs,
      totalPages: pagination.totalPages,
      hasNext: pagination.hasNextPage,
      hasPrev: pagination.hasPrevPage,
    },
  },
});
```

### Socket Emitter (`utils/socketEmitter.js`)

**Purpose**: Emit Socket.IO events to specific rooms

**Methods**:

```javascript
// Emit to specific rooms
export const emitToRooms = (event, data, rooms) => {
  const io = getIO();
  rooms.forEach((room) => {
    io.to(room).emit(event, data);
  });
};

// Emit task event
export const emitTaskEvent = (event, task) => {
  emitToRooms(event, task, [
    `department:${task.departmentId}`,
    `organization:${task.organizationId}`,
  ]);
};

// Emit user event
export const emitUserEvent = (event, user) => {
  emitToRooms(event, user, [
    `user:${user._id}`,
    `department:${user.departmentId}`,
    `organization:${user.organizationId}`,
  ]);
};
```

### Authorization Matrix (`utils/authorizationMatrix.js`)

**Purpose**: Check permissions based on authorization matrix

**Methods**:

```javascript
// Check if user has permission
export const hasPermission = (userRole, resource, operation, scope) => {
  const matrix = authorizationMatrix[resource];
  if (!matrix) return false;

  const rolePermissions = matrix[userRole];
  if (!rolePermissions) return false;

  return rolePermissions[operation]?.includes(scope);
};

// Get allowed scopes for operation
export const getAllowedScopes = (userRole, resource, operation) => {
  const matrix = authorizationMatrix[resource];
  if (!matrix) return [];

  const rolePermissions = matrix[userRole];
  if (!rolePermissions) return [];

  return rolePermissions[operation] || [];
};
```

### Token Generation (`utils/generateTokens.js`)

**Purpose**: Generate JWT access and refresh tokens

**Methods**:

```javascript
// Generate access token (15 min)
export const generateAccess_token = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });
};

// Generate refresh token (7 days)
export const generateRefresh_token = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

// Set tokens in HTTP-only cookies
export const setTokenCookies = (res, access_token, refresh_token) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("access_token", access_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refresh_token", refresh_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};
```

## File Coverage

This documentation covers all backend API files:

**Configuration** (4 files):

- `config/allowedOrigins.js` - CORS origin management
- `config/corsOptions.js` - CORS configuration
- `config/authorizationMatrix.json` - Permission matrix
- `config/db.js` - MongoDB connection

**Controllers** (10 files):

- `controllers/authControllers.js`
- `controllers/userControllers.js`
- `controllers/organizationControllers.js`
- `controllers/departmentControllers.js`
- `controllers/taskControllers.js`
- `controllers/materialControllers.js`
- `controllers/vendorControllers.js`
- `controllers/notificationControllers.js`
- `controllers/attachmentControllers.js`

**Routes** (10 files):

- `routes/index.js` - Route aggregator
- `routes/authRoutes.js`
- `routes/userRoutes.js`
- `routes/organizationRoutes.js`
- `routes/departmentRoutes.js`
- `routes/taskRoutes.js`
- `routes/materialRoutes.js`
- `routes/vendorRoutes.js`
- `routes/notificationRoutes.js`
- `routes/attachmentRoutes.js`

**Validators** (10 files):

- `middlewares/validators/validation.js` - Validation handler
- `middlewares/validators/authValidators.js`
- `middlewares/validators/userValidators.js`
- `middlewares/validators/organizationValidators.js`
- `middlewares/validators/departmentValidators.js`
- `middlewares/validators/taskValidators.js`
- `middlewares/validators/materialValidators.js`
- `middlewares/validators/vendorValidators.js`
- `middlewares/validators/notificationValidators.js`
- `middlewares/validators/attachmentValidators.js`

**Services** (2 files):

- `services/emailService.js`
- `services/notificationService.js`

**Utilities** (13 files):

- `utils/constants.js`
- `utils/responseTransform.js`
- `utils/socketEmitter.js`
- `utils/socketInstance.js`
- `utils/socket.js`
- `utils/authorizationMatrix.js`
- `utils/generateTokens.js`
- `utils/helpers.js`
- `utils/materialTransform.js`
- `utils/userStatus.js`
- `utils/logger.js`
- `utils/validateEnv.js`

**Templates** (1 file):

- `templates/emailTemplates.js`

**Entry Points** (2 files):

- `app.js` - Express app configuration
- `server.js` - Server startup and lifecycle

**Total**: 52+ backend files documented in this API reference.
