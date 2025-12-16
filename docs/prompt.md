# COMPREHENSIVE MULTI-TENANT SAAS TASK MANAGER - VALIDATION, CORRECTION, UPDATE, ENHANCEMENT & COMPLETION PROMPT

## YOUR ROLE

You are a **Senior MERN Full Stack Developer**, **Multi-Tenant SaaS System Architect**, **Code Auditor**, and **Quality Assurance Specialist** with deep expertise in:

- Node.js (ES modules) and Express.js backend development
- MongoDB/Mongoose with advanced patterns (discriminators, soft delete, transactions)
- React 19 with modern hooks and performance optimization
- Material-UI (MUI) v7 with responsive design
- Redux Toolkit with RTK Query for state management
- Real-time communication with Socket.IO
- Role-based access control (RBAC) and multi-tenancy isolation
- JWT authentication with HTTP-only cookies
- Property-based testing and comprehensive validation

## YOUR OBJECTIVE

Perform a **comprehensive, line-by-line validation** of the entire Multi-Tenant SaaS Task Manager codebase (`backend/*` and `client/*`) against the specifications in `docs/validate-correct-update-enhance-complete.md`, `docs/phase5-controllers-detailed.md`, `docs/build-prompt.md` and `docs/dev-phase-tracker.md`. You must:

1. **VALIDATE** every single file, function, logic, pattern, mismatches, and implementation of the `backend/*`, `client/*` against [`docs/validate-correct-update-enhance-complete.md`, `docs/phase5-controllers-detailed.md`, `docs/build-prompt.md` and `docs/dev-phase-tracker.md`]
2. **CORRECT** any mismatches, errors, bugs, or deviations from [`docs/validate-correct-update-enhance-complete.md`, `docs/phase5-controllers-detailed.md`, `docs/build-prompt.md` and `docs/dev-phase-tracker.md`]
3. **UPDATE** outdated patterns, deprecated syntax, non-optimal implementations or anything that doesn't match/respect the [`docs/validate-correct-update-enhance-complete.md`, `docs/phase5-controllers-detailed.md`, `docs/build-prompt.md` and `docs/dev-phase-tracker.md`]
4. **ENHANCE** performance, security, maintainability, and user experience by identifying from `backend/*`, `client/*` and [`docs/validate-correct-update-enhance-complete.md`, `docs/phase5-controllers-detailed.md`, `docs/build-prompt.md` and `docs/dev-phase-tracker.md`]
5. **COMPLETE** any missing implementations, incomplete features, TODO items and by identifying what to be completed in from `backend/*`, `client/*` and [`docs/validate-correct-update-enhance-complete.md`, `docs/phase5-controllers-detailed.md`, `docs/build-prompt.md` and `docs/dev-phase-tracker.md`]

## CONTEXT: UNDERSTANDING THE SYSTEM

### Platform Organization

A **Platform Organization** is the service provider that manages the entire SaaS system:

- **Identifier**: `isPlatformOrg: true` (immutable field in Organization model)
- **Purpose**: Oversees all customer organizations, manages system-wide operations
- **Quantity**: Exactly ONE platform organization exists in the system
- **Creation**: Created via backend seed data during initial system setup
- **Users**: All users in platform organization have `isPlatformUser: true` (auto-set)
- **Special Access**: Platform SuperAdmin can view and manage ALL customer organizations (crossOrg scope)
- **Deletion Protection**: Platform organization CANNOT be deleted (hard-coded protection)
- **TTL**: Never expires (no automatic cleanup)
- **Use Case**: System administrators, support staff, platform management team

### Customer Organization

A **Customer Organization** is a regular tenant using the platform:

- **Identifier**: `isPlatformOrg: false` (default value in Organization model)
- **Purpose**: Independent business entity using the task management system
- **Quantity**: Multiple customer organizations can exist
- **Creation**: Created via frontend registration/onboarding process
- **Users**: All users in customer organization have `isPlatformUser: false` (auto-set)
- **Data Isolation**: Completely isolated from other customer organizations
- **Access Scope**: Customer SuperAdmin can only access own organization (crossDept scope within org)
- **Deletion**: CAN be deleted (soft delete with cascade to all related data)
- **TTL**: Never expires (no automatic cleanup)
- **Use Case**: Companies, businesses, teams using the platform as tenants

### Schema Overview

**Organization (Tenant Root)**

- The top-level entity representing either platform or customer organization
- Contains: name, description, contact info, industry, logo {url, publicId}, isPlatformOrg
- Cascades to: Departments, Users, Tasks, Materials, Vendors, Notifications

**Department (Organizational Unit)**

- Subdivision within an organization for team/functional grouping
- Contains: name, description, hod, organization reference
- Cascades to: Users, Tasks, Materials
- Constraint: Must have at least one HOD (Head of Department)

**User (System Actor)**

- Individual with authentication and role-based permissions
- Contains: firstName, lastName, dateOfBirth, employeeId (4 digit, unique), skills [{skill, percentage}], role, password, email, position (if isHod, unique within organization), organization, department references, isHod, isPlatformUser, profilePicture {url, publicId}, lastLogin, passwordResetExpires, passwordResetToken
- Roles: SuperAdmin (highest), Admin, Manager, User (lowest)
- HOD Status: Automatically set based on role (SuperAdmin/Admin = HOD)
- Cascades to: Created tasks, activities, comments, attachments, notifications

**BaseTask (Abstract Task Model)**

- Base discriminator model for all task types
- Contains: description, status, priority, organization and department references, attachments, watchers ([ref]), tags
- Discriminator Key: taskType (ProjectTask, RoutineTask, AssignedTask)
- Cascades to: Activities, Comments, Attachments, Notifications

**ProjectTask (Vendor-Outsourced Task)**

- Task outsourced to external vendor/client due to complexity or resource limitation
- Contains: title, vendor reference (required), cost tracking, materials via activities start/due dates
- Materials: Added through TaskActivity with attachments as proof
- TaskActivity: YES - Department users log vendor's work progress
- Watchers: Only HOD users allowed

**RoutineTask (Outlet-Received Task)**

- Daily routine task received by department user from organization outlet
- Contains: materials (added directly), required task performed date, can't be in future
- Materials: Added DIRECTLY to task (NO TaskActivity intermediary)
- TaskActivity: NO - Not applicable for routine tasks
- Status Restriction: Cannot be "To Do" (must be In Progress, Completed, or Pending)
- Priority Restriction: Cannot be "Low" (must be Medium, High, or Urgent)

**AssignedTask (User-Assigned Task)**

- Task assigned to single user or group of users within department
- Contains: title, assignees (required), start/due dates can't be in future/past, materials via activities
- Materials: Added through TaskActivity with attachments as proof
- TaskActivity: YES - Assigned users log their own work progress

**TaskActivity (Progress Log)**

- Tracks updates and progress on ProjectTask and AssignedTask ONLY (NOT RoutineTask)
- Contains: content, parent task reference (Task), materials with quantities, createdBy, organization, department
- Purpose: Log vendor work (ProjectTask) or user work (AssignedTask)
- Cascades to: Comments, Attachments

**TaskComment (Discussion Thread)**

- Comments on tasks, activities, or other comments (threaded)
- Contains: content, parent reference (Task, TaskActivity), mentions, createdBy, organization, department
- Max Depth: 3 levels (comment → reply → reply to reply)
- Cascades to: Child comments (recursive), Attachments

**Material (Inventory Item)**

- Physical or consumable item used in tasks
- Contains: name, description, category, unit type, price, organization, department
- Usage: Via TaskActivity (ProjectTask/AssignedTask) or directly (RoutineTask)

**Vendor (External Client)**

- External vendor/client who takes and completes outsourced ProjectTasks
- Contains: name, description, contact info, only organization references
- Business Logic: Communicates orally with department users, work logged via TaskActivity

**Attachment (File Reference)**

- File uploaded to Cloudinary linked to task, activity, or comment
- Contains: filename, URL, type, size, parent reference (Task, TaskActivity, TaskComment), uploadedBy, organization, department
- File Types: Image (10MB), Video (100MB), Document (25MB), Audio (20MB), Other (50MB)
- Max per Entity: 10 attachments

**Notification (User Alert)**

- System notification for user about events and mentions
- Contains: title, message, type, read status, recipients, entity reference, organization, department
- TTL: 30 days (auto-cleanup after expiry)
- Types: Created, Updated, Deleted, Restored, Mention, Welcome, Announcement

---

## CRITICAL INSTRUCTIONS

**YOU ARE STRICTLY FORBIDDEN FROM:**

- Skipping ANY file from `backend/*` or `client/*` directories
- Skipping ANY line, statement, or character from `docs/validate-correct-update-enhance-complete.md`, `docs/phase5-controllers-detailed.md`, `docs/build-prompt.md` and `docs/dev-phase-tracker.md`
- For controllers validation, correction, update, enhancement utilize `docs/validate-correct-update-enhance-complete.md`, and `docs/phase5-controllers-detailed.md` effectively in addition to what is given on this prompt.
- Making assumptions or using default knowledge
- Accepting "good enough" implementations
- Ignoring edge cases or error scenarios
- Skipping validation tests

**YOU MUST:**

- Read and analyze EVERY SINGLE FILE in the codebase
- Compare EVERY implementation against `docs/build-prompt.md`, `docs/validate-correct-update-enhance-complete.md`, `docs/phase5-controllers-detailed.md`, `docs/dev-phase-tracker.md` specifications
- Validate EVERY business logic, permission check, and data flow
- Test EVERY edge case, error scenario, and validation rule
- Document EVERY issue found with WHAT, WHY, and HOW to fix
- Provide COMPLETE, WORKING solutions for every issue
- Update `docs/dev-phase-tracker.md` after each phase completion

---

## VALIDATION METHODOLOGY

For each file, you must:

1. **SEARCH**: Use `grepSearch`, `readFile` or any tools available to locate and read the file
2. **ANALYZE**: Extract all logic, patterns, dependencies, and flows
3. **COMPARE**: Match against `docs/build-prompt.md`, `docs/validate-correct-update-enhance-complete.md`, `docs/phase5-controllers-detailed.md`, `docs/dev-phase-tracker.md` specifications
4. **IDENTIFY**: List all issues (logical, business logic, mismatch, incomplete)
5. **CATEGORIZE**: Group issues by severity (Critical, High, Medium, Low)
6. **DOCUMENT**: Provide WHAT (issue), WHY (impact), HOW (solution)
7. **IMPLEMENT**: Apply corrections with complete, working code
8. **TEST**: Validate fixes with appropriate tests
9. **VERIFY**: Ensure 100% pass rate and 80%+ coverage

---

## CROSS VALIDATION APPROACH

**CRITICAL**: For every phase, you MUST apply the **Cross Validation Approach**. This means that for any task (e.g., validating the Soft Delete Plugin during Phase 2: Backend Models), the operations of validating, correcting, updating, enhancing, and completing must be performed on **ALL relevant directories**:

- **For Backend Phases (1-6)**: Validate across the entire `backend/*` structure
- **For Frontend Phases (7-10)**: Validate across the entire `client/*` structure

### Cross Validation Directory Scope (Backend)

For EVERY backend phase, cross validation MUST be done by identifying/searching the item, logic, and everything related to the thing being validated in ALL occurrences across:

- `backend/config/*`
- `backend/controllers/*`
- `backend/errorHandler/*`
- `backend/middlewares/*`
- `backend/middlewares/validators/*`
- `backend/mock/*`
- `backend/models/*`
- `backend/models/plugins/*`
- `backend/routes/*`
- `backend/scripts/*`
- `backend/services/*`
- `backend/templates/*`
- `backend/utils/*`
- `backend/.env`
- `backend/app.js`
- `backend/server.js`

---

## MANDATORY PHASE EXECUTION RULES

**THESE RULES APPLY TO EVERY SINGLE PHASE WITHOUT EXCEPTION:**

### 1. Task and Sub-Task Execution Rule

- **Each phase is a TASK containing SUB-TASKS**
- **When a TASK is started, ALL its SUB-TASKS MUST be started and completed TOGETHER with the TASK**
- **It is STRICTLY FORBIDDEN for a sub-task to be started on its own**
- **A phase is ONLY complete when ALL sub-tasks within it are complete**

### 2. Super Deep Analysis Requirement

- **On EACH phase/task sub-task, a SUPER DEEP ANALYSIS must be performed**
- **Analysis MUST use ALL of the following documentation:**
  - `docs/validate-correct-update-enhance-complete.md`
  - `docs/phase5-controllers-detailed.md`
  - `docs/build-prompt.md`
  - `docs/dev-phase-tracker.md`
- **Analysis MUST be performed AGAINST:**
  - `backend/*` (all backend directories and files)
  - `client/*` (all frontend directories and files)
- **It is STRICTLY FORBIDDEN to skip this deep analysis step**

### 3. Testing Requirements

- **Real MongoDB Test Database**: Use real MongoDB test database (NOT mongodb-memory-server)
- **After running a test, NO MATTER HOW LONG IT TAKES, skipping the test is STRICTLY FORBIDDEN**
- **It is STRICTLY FORBIDDEN to skip a failed test**
- **All failed tests MUST be fixed before proceeding**
- **At the END of EACH phase (task), the codebase MUST be tested by running `npm test`**
- **ALL tests MUST pass before the phase can be considered complete**

### 4. Terminal Command Compatibility

- **Every terminal command MUST be suitable for GitBash WSL VSCode integrated terminal**
- **Use forward slashes (/) for paths**
- **Use `&&` for command chaining in bash**
- **Avoid Windows-specific commands**

### 5. Phase Completion Criteria

A phase is ONLY complete when:

1. ✅ All sub-tasks started and completed together
2. ✅ Super deep analysis performed against all documentation
3. ✅ Cross validation done across all relevant directories
4. ✅ All issues identified, documented, and fixed
5. ✅ All tests run (no skipping, no matter how long)
6. ✅ All tests pass (100% pass rate)
7. ✅ Coverage ≥80% achieved
8. ✅ Phase tracker updated

This ensures that changes in one area are properly reflected and consistent across all related files.

---

## PHASE-BY-PHASE VALIDATION WORKFLOW

---

### Phase 1: Backend Core Infrastructure Validation

**Branch**: `validate/phase-1-backend-core`

#### BEFORE STARTING ANY CODE - GIT STATUS CHECK

**CRITICAL**: Before starting ANY validation work, perform a comprehensive git status check:

```bash
# Check current branch
git branch --show-current

# Check if branch exists locally
git branch --list validate/phase-1-backend-core

# Check if branch exists remotely
git ls-remote --heads origin validate/phase-1-backend-core

# Get full git status
git status --porcelain

# Get diff of current branch vs main
git diff main...HEAD

# Check for uncommitted changes
git diff --stat

# If branch exists remotely, pull latest changes
git pull origin validate/phase-1-backend-core

# If branch doesn't exist, create it from main
git checkout main
git pull origin main
git checkout -b validate/phase-1-backend-core
```

### Cross Validation Approach for Phase 1

**CRITICAL INSTRUCTION**: While this phase focuses on Backend Core Infrastructure, you must ALSO validate that:
- All models in `backend/models/` properly import and use configurations from this phase
- All controllers in `backend/controllers/` correctly reference these configurations
- All middleware in `backend/middlewares/` properly integrate with these core files
- All routes in `backend/routes/` use the correct configuration patterns
- All services in `backend/services/` follow the established patterns

#### Files to Validate (14 files)

**Configuration Files:**

- `backend/config/allowedOrigins.js`
- `backend/config/authorizationMatrix.json`
- `backend/config/corsOptions.js`
- `backend/config/db.js`

**Error Handling:**

- `backend/errorHandler/CustomError.js`
- `backend/errorHandler/ErrorController.js`

**Utilities:**

- `backend/utils/constants.js`
- `backend/utils/logger.js`
- `backend/utils/helpers.js`
- `backend/utils/generateTokens.js`
- `backend/utils/authorizationMatrix.js`
- `backend/utils/validateEnv.js`

**Application Setup:**

- `backend/app.js`
- `backend/server.js`

#### MANDATORY: Cross Validation Scope

For this phase, cross validation MUST search for all occurrences of config, error handling, and utility logic across:

```
backend/config/*
backend/controllers/*
backend/errorHandler/*
backend/middlewares/*
backend/middlewares/validators/*
backend/mock/*
backend/models/*
backend/models/plugins/*
backend/routes/*
backend/scripts/*
backend/services/*
backend/templates/*
backend/utils/*
backend/.env
backend/app.js
backend/server.js
```

#### MANDATORY: Super Deep Analysis

Before ANY code changes, perform super deep analysis using:

- `docs/validate-correct-update-enhance-complete.md`
- `docs/phase5-controllers-detailed.md`
- `docs/build-prompt.md`
- `docs/dev-phase-tracker.md`

Against: `backend/*` and `client/*`

#### MANDATORY: Task/Sub-Task Rule

- This phase is a TASK with multiple SUB-TASKS
- ALL sub-tasks MUST be started and completed TOGETHER
- It is STRICTLY FORBIDDEN to start a sub-task on its own

#### MANDATORY: Testing Rules

- Use Real MongoDB test database (NOT mongodb-memory-server)
- NEVER skip a test, no matter how long it takes
- NEVER skip a failed test - fix it
- At phase end: run `npm test` - ALL tests MUST pass

#### Critical Implementation Workflow [1 - 8]

1. **Branch Creation**

   ```bash
   git checkout -b validate/phase-1-backend-core
   ```

2. **Search & Read Files**

   - Use `grepSearch` to locate all core infrastructure files
   - Use `readFile` to read each file completely
   - **Cross validate** across ALL directories listed in Cross Validation Scope

3. **Analysis for Each File**

   **For `backend/config/allowedOrigins.js`:**

   - **Logic to Extract**:
     - Array of allowed origins for CORS
     - Development origins: `http://localhost:3000`, `http://localhost:5173`
     - Production origins: `process.env.CLIENT_URL`, `process.env.ALLOWED_ORIGINS`
   - **Validation Checks**:
     - ✅ Exports array of strings
     - ✅ Includes both development origins
     - ✅ Includes production environment variables
     - ✅ No wildcard origins in production
     - ✅ Proper ES module syntax (`export`)
   - **Common Issues**:
     - ❌ Missing development origins
     - ❌ Using wildcards (`*`) in production
     - ❌ Not reading from environment variables
     - ❌ Using CommonJS syntax (`module.exports`)
   - **Tests Required**:
     - Unit test: Verify array contains expected origins
     - Unit test: Verify no wildcards in production mode
     - Unit test: Verify environment variable usage

   **For `backend/config/authorizationMatrix.json`:**

   - **Logic to Extract**:
     - Complete authorization matrix for all resources
     - Resources: User, Task, Material, Vendor, Organization, Department
     - Roles: SuperAdmin, Admin, Manager, User
     - Operations: create, read, update, delete
     - Scopes: own, ownDept, crossDept, crossOrg
   - **Validation Checks**:
     - ✅ All 6 resources defined
     - ✅ All 4 roles defined for each resource
     - ✅ All 4 operations defined for each role
     - ✅ Scopes match specifications exactly
     - ✅ Platform SuperAdmin has `crossOrg` for Organization only
     - ✅ All other resources use max `crossDept` scope
     - ✅ Manager/User have limited scopes
   - **Common Issues**:
     - ❌ Missing resources or roles
     - ❌ Incorrect scope assignments
     - ❌ Platform SuperAdmin missing `crossOrg` for Organization
     - ❌ Inconsistent permission structure
   - **Tests Required**:
     - Property test: All resources have all roles
     - Property test: All roles have all operations
     - Unit test: Platform SuperAdmin has crossOrg for Organization
     - Unit test: No other resource has crossOrg scope

   **For `backend/config/corsOptions.js`:**

   - **Logic to Extract**:
     - CORS configuration object
     - Origin validation function
     - Credentials enabled
     - Allowed methods, headers, exposed headers
     - Preflight cache duration
   - **Validation Checks**:
     - ✅ `origin` uses validation function (not array)
     - ✅ `credentials: true` for cookie support
     - ✅ Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
     - ✅ Allowed headers: Content-Type, Authorization, X-Requested-With
     - ✅ Exposed headers: X-Request-ID, X-RateLimit-Limit, X-RateLimit-Remaining
     - ✅ `maxAge: 86400` (24 hours)
     - ✅ `optionsSuccessStatus: 200`
     - ✅ `preflightContinue: false`
   - **Common Issues**:
     - ❌ Using array instead of validation function
     - ❌ Missing credentials: true
     - ❌ Incorrect or missing methods
     - ❌ Missing exposed headers for rate limiting
   - **Tests Required**:
     - Unit test: Verify origin validation function
     - Unit test: Verify credentials enabled
     - Unit test: Verify all required methods
     - Unit test: Verify exposed headers

   **For `backend/config/db.js`:**

   - **Logic to Extract**:
     - MongoDB connection function
     - Connection retry logic
     - Connection options
     - Error handling
     - Success logging
   - **Validation Checks**:
     - ✅ Uses `mongoose.connect()`
     - ✅ Reads `MONGODB_URI` from environment
     - ✅ Retry logic with exponential backoff
     - ✅ Max retry attempts (5)
     - ✅ Connection options: `useNewUrlParser`, `useUnifiedTopology`
     - ✅ Error logging with winston
     - ✅ Success logging with connection details
   - **Common Issues**:
     - ❌ No retry logic
     - ❌ Missing connection options
     - ❌ Using console.log instead of winston
     - ❌ Not handling connection errors
   - **Tests Required**:
     - Unit test: Verify connection with valid URI
     - Unit test: Verify retry logic on failure
     - Unit test: Verify error handling
     - Integration test: Connect to real MongoDB

   **For `backend/errorHandler/CustomError.js`:**

   - **Logic to Extract**:
     - Custom error class extending Error
     - Static methods for error types
     - Error types: validation, authentication, authorization, notFound, conflict, internal
     - Status codes: 400, 401, 403, 404, 409, 500
     - Error code generation
   - **Validation Checks**:
     - ✅ Extends Error class
     - ✅ Has `statusCode` property
     - ✅ Has `errorCode` property
     - ✅ Has `context` property for additional data
     - ✅ Static method `validation()` returns 400
     - ✅ Static method `authentication()` returns 401
     - ✅ Static method `authorization()` returns 403
     - ✅ Static method `notFound()` returns 404
     - ✅ Static method `conflict()` returns 409
     - ✅ Static method `internal()` returns 500
   - **Common Issues**:
     - ❌ Not extending Error class
     - ❌ Missing static methods
     - ❌ Incorrect status codes
     - ❌ Missing error code generation
   - **Tests Required**:
     - Unit test: Each static method returns correct status code
     - Unit test: Error instance has all required properties
     - Unit test: Error code generation is unique

   **For `backend/errorHandler/ErrorController.js`:**

   - **Logic to Extract**:
     - Global error handler middleware
     - Error response formatting
     - Environment-specific error details
     - Logging with winston
     - Mongoose validation error handling
     - JWT error handling
   - **Validation Checks**:
     - ✅ Middleware signature: `(err, req, res, next)`
     - ✅ Logs error with winston
     - ✅ Handles CustomError instances
     - ✅ Handles Mongoose ValidationError
     - ✅ Handles Mongoose CastError
     - ✅ Handles JWT errors (JsonWebTokenError, TokenExpiredError)
     - ✅ Handles duplicate key errors (code 11000)
     - ✅ Returns consistent error format
     - ✅ Hides stack trace in production
   - **Common Issues**:
     - ❌ Using console.log instead of winston
     - ❌ Not handling specific error types
     - ❌ Exposing stack trace in production
     - ❌ Inconsistent error response format
   - **Tests Required**:
     - Unit test: CustomError handling
     - Unit test: Mongoose error handling
     - Unit test: JWT error handling
     - Unit test: Production vs development response

   **For `backend/utils/constants.js`:**

   - **Logic to Extract**:
     - ALL application constants
     - User roles, task status, task priority, task types
     - Material categories, unit types, industries
     - Pagination defaults, validation limits, length limits
     - File size limits, file types, notification types
   - **Validation Checks**:
     - ✅ USER_ROLES: SuperAdmin, Admin, Manager, User
     - ✅ TASK_STATUS: To Do, In Progress, Completed, Pending
     - ✅ TASK_PRIORITY: Low, Medium, High, Urgent
     - ✅ TASK_TYPES: ProjectTask, RoutineTask, AssignedTask
     - ✅ MATERIAL_CATEGORIES: 9 categories
     - ✅ UNIT_TYPES: 30+ types
     - ✅ INDUSTRIES: 24 industries
     - ✅ PAGINATION: defaults, limits, page size options
     - ✅ LIMITS: max attachments (10), watchers (20), assignees (20), etc.
     - ✅ LENGTH_LIMITS: title (50), description (2000), etc.
     - ✅ FILE_SIZE_LIMITS: image (10MB), video (100MB), etc.
     - ✅ FILE_TYPES: extensions for each type
     - ✅ NOTIFICATION_TYPES: 7 types
     - ✅ ATTACHMENT_TYPES: 5 types
   - **Common Issues**:
     - ❌ Missing constants
     - ❌ Incorrect values
     - ❌ Hardcoded values in code instead of importing
     - ❌ Inconsistent naming conventions
   - **Tests Required**:
     - Unit test: All constants defined
     - Unit test: Correct values for each constant
     - Property test: No hardcoded values in codebase

   **For `backend/utils/logger.js`:**

   - **Logic to Extract**:
     - Winston logger configuration
     - Log levels: error, warn, info, debug
     - Console transport for development
     - File transports for production
     - Log format with timestamp
     - Error log file separate from combined log
   - **Validation Checks**:
     - ✅ Uses winston.createLogger()
     - ✅ Log level from environment or default 'info'
     - ✅ Format includes timestamp, level, message
     - ✅ Console transport in development
     - ✅ File transports in production
     - ✅ Separate error.log and combined.log
     - ✅ Handles exceptions and rejections
   - **Common Issues**:
     - ❌ Using console.log in production
     - ❌ Missing file transports
     - ❌ No timestamp in logs
     - ❌ Not handling exceptions
   - **Tests Required**:
     - Unit test: Logger instance created
     - Unit test: Correct log level
     - Unit test: File transports in production
     - Integration test: Log to file

   **For `backend/utils/generateTokens.js`:**

   - **Logic to Extract**:
     - JWT token generation function
     - Access token: 15 minutes expiry
     - Refresh token: 7 days expiry
     - Payload: userId, email, role, organization, department
     - Secrets from environment variables
   - **Validation Checks**:
     - ✅ Function exports: generateAccessToken, generateRefreshToken
     - ✅ Access token expiry: '15m'
     - ✅ Refresh token expiry: '7d'
     - ✅ Uses JWT_ACCESS_SECRET for access token
     - ✅ Uses JWT_REFRESH_SECRET for refresh token
     - ✅ Payload includes: userId, email, role, organization, department
     - ✅ Returns signed JWT string
   - **Common Issues**:
     - ❌ Incorrect expiry times
     - ❌ Missing payload fields
     - ❌ Using same secret for both tokens
     - ❌ Not validating secret length (min 32 chars)
   - **Tests Required**:
     - Unit test: Access token generation
     - Unit test: Refresh token generation
     - Unit test: Token payload verification
     - Unit test: Token expiry verification

   **For `backend/utils/authorizationMatrix.js`:**

   - **Logic to Extract**:
     - Authorization helper functions
     - Check permission function
     - Get user scope function
     - Validate resource access function
   - **Validation Checks**:
     - ✅ Imports authorizationMatrix.json
     - ✅ Function: checkPermission(user, resource, operation)
     - ✅ Function: getUserScope(user, resource, operation)
     - ✅ Function: validateResourceAccess(user, resource, resourceDoc)
     - ✅ Handles platform SuperAdmin crossOrg for Organization
     - ✅ Handles organization-level isolation
     - ✅ Handles department-level isolation
     - ✅ Handles ownership checks
   - **Common Issues**:
     - ❌ Not checking isPlatformUser for crossOrg
     - ❌ Not validating organization match
     - ❌ Not validating department match
     - ❌ Not checking ownership for 'own' scope
   - **Tests Required**:
     - Unit test: checkPermission for each role/resource/operation
     - Unit test: getUserScope returns correct scope
     - Unit test: validateResourceAccess for each scenario
     - Property test: All permission combinations

   **For `backend/utils/validateEnv.js`:**

   - **Logic to Extract**:
     - Environment variable validation
     - Required variables check
     - Variable format validation
     - Secret length validation (min 32 chars)
   - **Validation Checks**:
     - ✅ Validates MONGODB_URI exists
     - ✅ Validates JWT_ACCESS_SECRET exists and length >= 32
     - ✅ Validates JWT_REFRESH_SECRET exists and length >= 32
     - ✅ Validates PORT is number
     - ✅ Validates CLIENT_URL exists
     - ✅ Validates NODE_ENV is development/production
     - ✅ Validates EMAIL_USER and EMAIL_PASSWORD in production
     - ✅ Throws error if validation fails
   - **Common Issues**:
     - ❌ Not validating secret length
     - ❌ Not checking required variables
     - ❌ Not validating variable formats
     - ❌ Silent failures
   - **Tests Required**:
     - Unit test: Valid environment passes
     - Unit test: Missing required variable throws error
     - Unit test: Invalid secret length throws error
     - Unit test: Invalid format throws error

   **For `backend/app.js`:**

   - **Logic to Extract**:
     - Express app configuration
     - Security middleware order (CRITICAL)
     - Body parsing middleware
     - Route mounting
     - Error handler mounting
   - **Validation Checks**:
     - ✅ Middleware order: helmet → cors → cookieParser → express.json → mongoSanitize → compression → rateLimiter
     - ✅ helmet() with security headers
     - ✅ cors(corsOptions) with credentials
     - ✅ cookieParser() before auth middleware
     - ✅ express.json({ limit: '10mb' }) for file uploads
     - ✅ mongoSanitize() for NoSQL injection prevention
     - ✅ compression() for response compression
     - ✅ rateLimiter only in production
     - ✅ Routes mounted at /api
     - ✅ Error handler mounted last
   - **Common Issues**:
     - ❌ Incorrect middleware order
     - ❌ Missing security middleware
     - ❌ Rate limiter in development
     - ❌ Error handler not last
   - **Tests Required**:
     - Unit test: Middleware order verification
     - Unit test: Security headers present
     - Integration test: CORS with credentials
     - Integration test: Rate limiting in production

   **For `backend/server.js`:**

   - **Logic to Extract**:
     - Server startup logic
     - HTTP server creation
     - Socket.IO initialization
     - Database connection
     - Graceful shutdown
     - Port configuration
   - **Validation Checks**:
     - ✅ Imports app from app.js
     - ✅ Creates HTTP server with app
     - ✅ Initializes Socket.IO with HTTP server
     - ✅ Connects to database before starting server
     - ✅ Validates environment variables
     - ✅ Listens on PORT from environment
     - ✅ Handles SIGTERM and SIGINT for graceful shutdown
     - ✅ Closes database connection on shutdown
     - ✅ Closes Socket.IO on shutdown
     - ✅ Sets timezone: `process.env.TZ = "UTC";` (MUST be first line)
   - **Common Issues**:
     - ❌ Starting server before database connection
     - ❌ No graceful shutdown handling
     - ❌ Not closing connections on shutdown
     - ❌ Using console.log instead of logger
   - **Tests Required**:
     - Integration test: Server starts successfully
     - Integration test: Database connects before server
     - Integration test: Graceful shutdown works
     - Integration test: Socket.IO initializes

4. **Action: Validate, Correct, Update, Enhance, Complete**

   For EACH file identified with issues:

   **Step 1: Document Issues**

   ```markdown
   ## Issues Found in [filename]

   ### Critical Issues

   - **WHAT**: [Description of issue]
   - **WHY**: [Impact on system]
   - **HOW**: [Solution approach]
   - **CODE**: [Complete corrected code]

   ### High Priority Issues

   [Same format]

   ### Medium Priority Issues

   [Same format]

   ### Low Priority Issues

   [Same format]
   ```

   **Step 2: Implement Corrections**

   - Use `strReplace` for targeted fixes
   - Use `fsWrite` for complete file rewrites if needed
   - Ensure all fixes are complete and working
   - Follow exact specifications from build-prompt.md

   **Step 3: Add/Update Tests**

   - Create test files in `backend/tests/unit/` or `backend/tests/property/`
   - Use Jest with ES modules configuration
   - Test all edge cases and error scenarios
   - Ensure 80%+ coverage for each file

5. **Test: Run All Tests**

   ```bash
   cd backend
   npm test -- --runInBand
   ```

   **Validation Criteria**:

   - ✅ 100% of tests pass
   - ✅ 80%+ code coverage
   - ✅ No lint errors
   - ✅ No console.log statements in production code
   - ✅ All imports use ES modules syntax
   - ✅ All constants imported from utils/constants.js

6. **Validate: Final Checks**

   - Run `npm run lint` (if configured)
   - Check for TODO comments
   - Verify all environment variables validated
   - Confirm security middleware order
   - Verify error handling in all functions

7. **Update Phase Tracker**
   Update `docs/dev-phase-tracker.md`:

   ```markdown
   ## Phase 1: Backend Core Infrastructure ✅

   - [x] Config files validated and corrected
   - [x] Error handlers validated and corrected
   - [x] Utils validated and corrected
   - [x] App.js validated and corrected
   - [x] Server.js validated and corrected
   - [x] Tests added and passing (100%)
   - [x] Coverage achieved (80%+)
   ```

8. **Merge: Complete Phase 1**

   ```bash
   git add .
   git commit -m "Phase 1: Validate and correct backend core infrastructure

   - Validated all config files against specifications
   - Corrected error handling and logging
   - Enhanced security middleware configuration
   - Completed missing environment validation
   - Added comprehensive unit tests
   - Achieved 80%+ test coverage"

   git checkout main
   git merge validate/phase-1-backend-core
   git push origin main
   git branch -d validate/phase-1-backend-core
   ```

---

### Phase 2: Backend Models Validation

**Branch**: `validate/phase-2-backend-models`

#### BEFORE STARTING ANY CODE - GIT STATUS CHECK

```bash
# Check current branch
git branch --show-current

# Check if branch exists locally
git branch --list validate/phase-2-backend-models

# Check if branch exists remotely
git ls-remote --heads origin validate/phase-2-backend-models

# Get full git status
git status --porcelain

# Get diff of current branch vs main
git diff main...HEAD

# Check for uncommitted changes
git diff --stat

# If branch exists remotely, pull latest changes
git pull origin validate/phase-2-backend-models

# If branch doesn't exist, create it from main
git checkout main
git pull origin main
git checkout -b validate/phase-2-backend-models
```

**CRITICAL INSTRUCTION**: While this phase focuses on Backend Models, you must ALSO validate that:
- All controllers in `backend/controllers/` correctly use these models
- All middleware in `backend/middlewares/` properly validate model fields
- All routes in `backend/routes/` correctly reference model paths
- All services in `backend/services/` properly integrate with models
- All tests in `backend/tests/` correctly test model functionality
- The soft delete plugin is properly applied everywhere

#### Files to Validate (15 files)

**Plugin:**

- `backend/models/plugins/softDelete.js`

**Core Models:**

- `backend/models/Organization.js`
- `backend/models/Department.js`
- `backend/models/User.js`

**Task Models (Discriminator Pattern):**

- `backend/models/BaseTask.js`
- `backend/models/ProjectTask.js`
- `backend/models/RoutineTask.js`
- `backend/models/AssignedTask.js`

**Task-Related Models:**

- `backend/models/TaskActivity.js`
- `backend/models/TaskComment.js`

**Resource Models:**

- `backend/models/Material.js`
- `backend/models/Vendor.js`

**Supporting Models:**

- `backend/models/Attachment.js`
- `backend/models/Notification.js`

**Model Exports:**

- `backend/models/index.js`

#### MANDATORY: Cross Validation Scope

For this phase, cross validation MUST search for all occurrences of model logic across:

```
backend/config/*
backend/controllers/*
backend/errorHandler/*
backend/middlewares/*
backend/middlewares/validators/*
backend/mock/*
backend/models/*
backend/models/plugins/*
backend/routes/*
backend/scripts/*
backend/services/*
backend/templates/*
backend/utils/*
backend/.env
backend/app.js
backend/server.js
```

#### MANDATORY: Super Deep Analysis

Before ANY code changes, perform super deep analysis using:

- `docs/validate-correct-update-enhance-complete.md`
- `docs/phase5-controllers-detailed.md`
- `docs/build-prompt.md`
- `docs/dev-phase-tracker.md`

Against: `backend/*` and `client/*`

#### MANDATORY: Task/Sub-Task Rule

- This phase is a TASK with multiple SUB-TASKS
- ALL sub-tasks MUST be started and completed TOGETHER
- It is STRICTLY FORBIDDEN to start a sub-task on its own

#### MANDATORY: Testing Rules

- Use Real MongoDB test database (NOT mongodb-memory-server)
- NEVER skip a test, no matter how long it takes
- NEVER skip a failed test - fix it
- At phase end: run `npm test` - ALL tests MUST pass

#### Critical Implementation Workflow [1 - 8]

1. **Branch Creation**

   ```bash
   git checkout -b validate/phase-2-backend-models
   ```

2. **Search & Read Files**

   - Use `grepSearch` to locate all model files
   - Use `readFile` to read each file completely
   - **Cross validate** across ALL directories listed in Cross Validation Scope

3. **Analysis for Each File**

   **For `backend/models/plugins/softDelete.js`:**

   - **Logic to Extract**:
     - Soft delete plugin for Mongoose
     - Fields: isDeleted, deletedAt, deletedBy, restoredAt, restoredBy
     - Query helpers: withDeleted(), onlyDeleted()
     - Instance methods: softDelete(), restore()
     - Static methods: softDeleteById(), restoreById(), softDeleteMany(), restoreMany(), findDeletedByIds(), countDeleted(), ensureTTLIndex(), getRestoreAudit()
     - TTL index creation
     - Hard delete protection
   - **Validation Checks**:
     - ✅ Adds all soft delete fields to schema
     - ✅ Indexes on isDeleted, deletedAt, deletedBy
     - ✅ Default query filters out soft-deleted (isDeleted: false)
     - ✅ withDeleted() includes soft-deleted documents
     - ✅ onlyDeleted() returns only soft-deleted documents
     - ✅ softDelete() sets isDeleted, deletedAt, deletedBy
     - ✅ restore() clears isDeleted, sets restoredAt, restoredBy
     - ✅ Blocks deleteOne(), deleteMany(), findOneAndDelete(), remove()
     - ✅ ensureTTLIndex() creates TTL index on deletedAt
     - ✅ Supports MongoDB sessions for transactions
   - **Common Issues**:
     - ❌ Not filtering soft-deleted by default
     - ❌ Not blocking hard delete methods
     - ❌ Missing session support
     - ❌ TTL index not created
   - **Tests Required**:
     - Unit test: Soft delete sets correct fields
     - Unit test: Restore clears isDeleted
     - Unit test: Default query excludes soft-deleted
     - Unit test: withDeleted() includes soft-deleted
     - Unit test: Hard delete methods throw error
     - Property test: All CRUD operations respect soft delete

   **For `backend/models/Organization.js`:**

   - **Logic to Extract**:
     - Organization schema definition
     - Fields: name, description, email, phone, address, industry, logoUrl, isPlatformOrg, createdBy
     - Soft delete fields from plugin
     - Unique indexes on name, email, phone (partial)
     - Index on isPlatformOrg
     - TTL: never (null)
     - Cascade delete to departments, users, tasks, materials, vendors, notifications
     - Platform organization deletion protection
   - **Validation Checks**:
     - ✅ name: unique, lowercase, max 100, required
     - ✅ description: max 2000
     - ✅ email: unique, valid email, max 50, required
     - ✅ phone: unique, matches /^(\+251\d{9}|0\d{9})$/, required
     - ✅ address: max 500
     - ✅ industry: enum of 24 industries, max 100, required
     - ✅ logoUrl: { url: String, publicId: String }
     - ✅ isPlatformOrg: Boolean, default false, immutable, indexed
     - ✅ createdBy: ref User
     - ✅ Applies softDelete plugin
     - ✅ Unique indexes are partial (only non-deleted)
     - ✅ TTL set to null (never expires)
     - ✅ Pre-remove hook cascades to children
     - ✅ Platform org cannot be deleted (validation)
   - **Common Issues**:
     - ❌ Missing isPlatformOrg field
     - ❌ isPlatformOrg not immutable
     - ❌ No platform org deletion protection
     - ❌ Missing cascade delete logic
     - ❌ Unique indexes not partial
   - **Tests Required**:
     - Unit test: Schema validation for all fields
     - Unit test: isPlatformOrg immutability
     - Unit test: Platform org deletion blocked
     - Integration test: Cascade delete to children
     - Property test: Unique constraints work

   **For `backend/models/Department.js`:**

   - **Logic to Extract**:
     - Department schema definition
     - Fields: name, description, hod, organization, createdBy
     - Unique name per organization
     - HOD uniqueness per organization
     - Cascade delete to users, tasks, materials
     - TTL: 365 days
   - **Validation Checks**:
     - ✅ name: max 100, required
     - ✅ description: max 2000
     - ✅ hod: ref User
     - ✅ organization: ref Organization, required
     - ✅ createdBy: ref User
     - ✅ Compound unique index: { organization, name }
     - ✅ Applies softDelete plugin
     - ✅ TTL set to 365 days
     - ✅ Pre-remove hook cascades to users, tasks, materials
     - ✅ Validation: Cannot delete if last HOD in department
   - **Common Issues**:
     - ❌ Missing compound unique index
     - ❌ No HOD deletion protection
     - ❌ Missing cascade delete logic
     - ❌ TTL not set correctly
   - **Tests Required**:
     - Unit test: Schema validation
     - Unit test: Unique name per organization
     - Unit test: Last HOD deletion blocked
     - Integration test: Cascade delete
     - Property test: TTL cleanup works

   **For `backend/models/User.js`:**

   - **Logic to Extract**:
     - User schema definition
     - Fields: firstName, lastName, dateOfBirth, employeeId, skills, role, password, email, position, organization, department, isHod, isPlatformUser, profilePicture, lastLogin, passwordResetToken, passwordResetExpires, emailPreferences, joinedAt
     - Virtual: fullName
     - Unique: { organization, email }, { organization, employeeId }
     - HOD unique per department
     - Password hashing pre-save hook
     - Instance methods: comparePassword, generatePasswordResetToken, verifyPasswordResetToken, clearPasswordResetToken
     - Auto-set isHod based on role
     - Auto-set isPlatformUser from organization
     - TTL: 365 days
   - **Validation Checks**:
     - ✅ firstName: max 20, required
     - ✅ lastName: max 20, required
     - ✅ dateOfBirth: Date, not future
     - ✅ employeeId: 4-digit (1000-9999), unique per org
     - ✅ skills: array max 10, { skill: max 50, percentage: 0-100 }
     - ✅ role: enum (SuperAdmin, Admin, Manager, User), default User
     - ✅ password: min 8, bcrypt ≥12 salt rounds, select: false
     - ✅ email: unique per org, lowercase, max 50, required
     - ✅ position: max 100, unique per org if isHod
     - ✅ organization: ref Organization, required
     - ✅ department: ref Department, required
     - ✅ isHod: Boolean, indexed, auto-set from role
     - ✅ isPlatformUser: Boolean, immutable, indexed, auto-set from org
     - ✅ profilePicture: { url, publicId }
     - ✅ lastLogin: Date
     - ✅ passwordResetToken: String, select: false, bcrypt hashed
     - ✅ passwordResetExpires: Date, select: false
     - ✅ emailPreferences: Object with flags
     - ✅ joinedAt: Date, required, not future
     - ✅ Virtual fullName: firstName + lastName
     - ✅ Compound unique: { organization, email }
     - ✅ Compound unique: { organization, employeeId }
     - ✅ HOD unique per department
     - ✅ Pre-save: hash password if modified
     - ✅ Pre-save: auto-set isHod from role
     - ✅ Pre-save: auto-set isPlatformUser from organization
     - ✅ Instance method: comparePassword
     - ✅ Instance method: generatePasswordResetToken
     - ✅ Instance method: verifyPasswordResetToken
     - ✅ Instance method: clearPasswordResetToken
     - ✅ Applies softDelete plugin
     - ✅ TTL: 365 days
     - ✅ Cascade: remove from task watchers/assignees
     - ✅ Protection: Cannot delete last SuperAdmin in org
     - ✅ Protection: Cannot delete last HOD in department
   - **Common Issues**:
     - ❌ Password not hashed with bcrypt ≥12 rounds
     - ❌ isHod not auto-set from role
     - ❌ isPlatformUser not auto-set from organization
     - ❌ Missing unique constraints
     - ❌ No deletion protection for last SuperAdmin/HOD
     - ❌ Password reset token not hashed
   - **Tests Required**:
     - Unit test: All field validations
     - Unit test: Password hashing on save
     - Unit test: isHod auto-set from role
     - Unit test: isPlatformUser auto-set from org
     - Unit test: comparePassword method
     - Unit test: Password reset token generation
     - Unit test: Last SuperAdmin deletion blocked
     - Unit test: Last HOD deletion blocked
     - Integration test: Cascade operations
     - Property test: All unique constraints

   **For `backend/models/BaseTask.js`:**

   - **Logic to Extract**:
     - Base task schema (discriminator base)
     - Fields: description, status, priority, organization, department, createdBy, attachments, watchers, tags, taskType
     - Discriminator key: taskType
     - Indexes for performance
     - TTL: 180 days
     - Cascade delete to activities, comments, attachments, notifications
   - **Validation Checks**:
     - ✅ description: max 2000
     - ✅ status: enum (To Do, In Progress, Completed, Pending), default To Do
     - ✅ priority: enum (Low, Medium, High, Urgent), default Medium
     - ✅ organization: ref Organization, required
     - ✅ department: ref Department, required
     - ✅ createdBy: ref User, required
     - ✅ attachments: array max 10, ref Attachment, unique
     - ✅ watchers: array max 20, ref User, unique, HOD only validation
     - ✅ tags: array max 5, max 50 each, unique case-insensitive
     - ✅ taskType: String (discriminator key)
     - ✅ Indexes: { organization, department, createdAt }
     - ✅ Indexes: { organization, createdBy, createdAt }
     - ✅ Indexes: { organization, department, startDate, dueDate }
     - ✅ Indexes: { organization, department, status, priority, dueDate }
     - ✅ Text index on tags
     - ✅ Applies softDelete plugin
     - ✅ TTL: 180 days
     - ✅ Discriminator options configured
     - ✅ Cascade delete to activities, comments, attachments, notifications
   - **Common Issues**:
     - ❌ Missing discriminator configuration
     - ❌ Watchers not validated for HOD only
     - ❌ Missing performance indexes
     - ❌ Tags not unique case-insensitive
   - **Tests Required**:
     - Unit test: Schema validation
     - Unit test: Watchers HOD validation
     - Unit test: Tags case-insensitive uniqueness
     - Integration test: Discriminator pattern works
     - Integration test: Cascade delete

   **For `backend/models/ProjectTask.js`:**

   - **Logic to Extract**:
     - ProjectTask discriminator schema
     - Additional fields: title, vendor, estimatedCost, actualCost, currency, costHistory, startDate, dueDate
     - Vendor required
     - Cost tracking with history
     - Date validation (dueDate after startDate)
   - **Validation Checks**:
     - ✅ Extends BaseTask via discriminator
     - ✅ title: max 50, required
     - ✅ vendor: ref Vendor, required
     - ✅ estimatedCost: Number, min 0
     - ✅ actualCost: Number, min 0
     - ✅ currency: String, default ETB
     - ✅ costHistory: array max 200, { amount, type: estimated/actual, updatedBy: ref User, updatedAt }
     - ✅ startDate: Date
     - ✅ dueDate: Date, must be after startDate
     - ✅ All statuses available: To Do, In Progress, Completed, Pending
     - ✅ All priorities available: Low, Medium, High, Urgent
     - ✅ Watchers: HOD only
   - **Common Issues**:
     - ❌ Vendor not required
     - ❌ No date validation (dueDate after startDate)
     - ❌ Cost history not limited to 200
     - ❌ Watchers not restricted to HOD
   - **Tests Required**:
     - Unit test: All field validations
     - Unit test: Vendor required
     - Unit test: Date validation
     - Unit test: Cost history limit
     - Unit test: Watchers HOD only
     - Integration test: Task creation with vendor

   **For `backend/models/RoutineTask.js`:**

   - **Logic to Extract**:
     - RoutineTask discriminator schema
     - Additional fields: materials (direct), startDate, dueDate
     - Status restriction: Cannot be "To Do"
     - Priority restriction: Cannot be "Low"
     - Materials added directly (no TaskActivity)
     - Both dates required
   - **Validation Checks**:
     - ✅ Extends BaseTask via discriminator
     - ✅ materials: array max 20, { material: ref Material, quantity: min 0 }
     - ✅ startDate: Date, required
     - ✅ dueDate: Date, required, must be after startDate
     - ✅ Status validation: Cannot be "To Do"
     - ✅ Priority validation: Cannot be "Low"
     - ✅ Available statuses: In Progress, Completed, Pending
     - ✅ Available priorities: Medium, High, Urgent
     - ✅ No TaskActivity for RoutineTask
   - **Common Issues**:
     - ❌ "To Do" status allowed
     - ❌ "Low" priority allowed
     - ❌ Dates not required
     - ❌ No date validation
     - ❌ Materials not direct (using TaskActivity)
   - **Tests Required**:
     - Unit test: Status restriction
     - Unit test: Priority restriction
     - Unit test: Dates required
     - Unit test: Date validation
     - Unit test: Materials direct addition
     - Integration test: Cannot create with "To Do" status

   **For `backend/models/AssignedTask.js`:**

   - **Logic to Extract**:
     - AssignedTask discriminator schema
     - Additional fields: title, assignees, startDate, dueDate
     - Assignees required (single or array)
     - Materials via TaskActivity
     - Date validation
   - **Validation Checks**:
     - ✅ Extends BaseTask via discriminator
     - ✅ title: max 50, required
     - ✅ assignees: ref User or array of Users, required, max 20
     - ✅ startDate: Date
     - ✅ dueDate: Date, must be after startDate if both provided
     - ✅ All statuses available: To Do, In Progress, Completed, Pending
     - ✅ All priorities available: Low, Medium, High, Urgent
     - ✅ Materials via TaskActivity (not direct)
   - **Common Issues**:
     - ❌ Assignees not required
     - ❌ No max limit on assignees
     - ❌ No date validation
     - ❌ Materials added directly instead of via TaskActivity
   - **Tests Required**:
     - Unit test: Assignees required
     - Unit test: Assignees max 20
     - Unit test: Date validation
     - Integration test: Materials via TaskActivity only

   **For `backend/models/TaskActivity.js`:**

   - **Logic to Extract**:
     - TaskActivity schema
     - Fields: activity, parent, parentModel, materials, createdBy, department, organization
     - Parent: ProjectTask or AssignedTask ONLY (NOT RoutineTask)
     - Materials with quantities
     - Cascade delete to comments, attachments
     - TTL: 90 days
   - **Validation Checks**:
     - ✅ activity: max 2000
     - ✅ parent: ref ProjectTask or AssignedTask, required
     - ✅ parentModel: enum (ProjectTask, AssignedTask), required
     - ✅ materials: array max 20, { material: ref Material, quantity: min 0 }
     - ✅ createdBy: ref User, required
     - ✅ department: ref Department, required
     - ✅ organization: ref Organization, required
     - ✅ Applies softDelete plugin
     - ✅ TTL: 90 days
     - ✅ Validation: parent cannot be RoutineTask
     - ✅ Cascade delete to comments, attachments
   - **Common Issues**:
     - ❌ RoutineTask allowed as parent
     - ❌ No materials quantity validation
     - ❌ Missing cascade delete
     - ❌ TTL not set
   - **Tests Required**:
     - Unit test: Schema validation
     - Unit test: RoutineTask parent blocked
     - Unit test: Materials quantity validation
     - Integration test: Cascade delete

   **For `backend/models/TaskComment.js`:**

   - **Logic to Extract**:
     - TaskComment schema
     - Fields: comment, parent, parentModel, mentions, createdBy, department, organization
     - Parent: Task, TaskActivity, or TaskComment
     - Threading: max depth 3
     - Mentions: max 5 users
     - Cascade delete to child comments, attachments
     - TTL: 90 days
   - **Validation Checks**:
     - ✅ comment: max 2000, required
     - ✅ parent: ref Task/TaskActivity/TaskComment, required
     - ✅ parentModel: enum (Task, TaskActivity, TaskComment), required
     - ✅ mentions: array max 5, ref User
     - ✅ createdBy: ref User, required
     - ✅ department: ref Department, required
     - ✅ organization: ref Organization, required
     - ✅ Applies softDelete plugin
     - ✅ TTL: 90 days
     - ✅ Validation: max depth 3 (prevent infinite nesting)
     - ✅ Cascade delete to child comments (recursive), attachments
   - **Common Issues**:
     - ❌ No max depth validation
     - ❌ Mentions not limited to 5
     - ❌ Missing recursive cascade delete
     - ❌ TTL not set
   - **Tests Required**:
     - Unit test: Schema validation
     - Unit test: Max depth 3 validation
     - Unit test: Mentions max 5
     - Integration test: Recursive cascade delete
     - Integration test: Threading works

   **For `backend/models/Material.js`:**

   - **Logic to Extract**:
     - Material schema
     - Fields: name, description, category, unitType, price, department, organization, addedBy
     - Category: 9 options
     - Unit type: 30+ options
     - TTL: 180 days
   - **Validation Checks**:
     - ✅ name: max 100, required
     - ✅ description: max 2000
     - ✅ category: enum (9 categories), required
     - ✅ unitType: enum (30+ types), required
     - ✅ price: Number, min 0
     - ✅ department: ref Department, required
     - ✅ organization: ref Organization, required
     - ✅ addedBy: ref User
     - ✅ Applies softDelete plugin
     - ✅ TTL: 180 days
     - ✅ Categories: Electrical, Mechanical, Plumbing, Hardware, Cleaning, Textiles, Consumables, Construction, Other
     - ✅ Unit types: pcs, kg, g, l, ml, m, cm, mm, m2, m3, box, pack, roll, sheet, etc.
   - **Common Issues**:
     - ❌ Missing category options
     - ❌ Missing unit type options
     - ❌ Price allows negative values
     - ❌ TTL not set
   - **Tests Required**:
     - Unit test: All field validations
     - Unit test: Category enum
     - Unit test: Unit type enum
     - Unit test: Price non-negative
     - Property test: All categories valid

   **For `backend/models/Vendor.js`:**

   - **Logic to Extract**:
     - Vendor schema
     - Fields: name, description, contactPerson, email, phone, address, department, organization, createdBy
     - Phone validation: Ethiopian format
     - TTL: 180 days
     - Deletion requires ProjectTask reassignment
   - **Validation Checks**:
     - ✅ name: max 100, required
     - ✅ description: max 2000
     - ✅ contactPerson: max 100
     - ✅ email: valid email, max 50
     - ✅ phone: matches /^(\+251\d{9}|0\d{9})$/
     - ✅ address: max 500
     - ✅ department: ref Department, required
     - ✅ organization: ref Organization, required
     - ✅ createdBy: ref User
     - ✅ Applies softDelete plugin
     - ✅ TTL: 180 days
     - ✅ Pre-remove: Check for linked ProjectTasks
     - ✅ Validation: Cannot delete if ProjectTasks exist
   - **Common Issues**:
     - ❌ Phone validation incorrect
     - ❌ No ProjectTask check before deletion
     - ❌ TTL not set
   - **Tests Required**:
     - Unit test: All field validations
     - Unit test: Phone format validation
     - Unit test: Deletion blocked if ProjectTasks exist
     - Integration test: Vendor deletion with reassignment

   **For `backend/models/Attachment.js`:**

   - **Logic to Extract**:
     - Attachment schema
     - Fields: filename, fileUrl, fileType, fileSize, parent, parentModel, uploadedBy, department, organization
     - Parent: Task, TaskActivity, or TaskComment
     - File type validation
     - File size limits
     - Max 10 attachments per entity
     - TTL: 90 days
   - **Validation Checks**:
     - ✅ filename: String, required
     - ✅ fileUrl: String (Cloudinary URL), required
     - ✅ fileType: enum (Image, Video, Document, Audio, Other), required
     - ✅ fileSize: Number (bytes), required
     - ✅ parent: ref Task/TaskActivity/TaskComment, required
     - ✅ parentModel: enum (Task, TaskActivity, TaskComment), required
     - ✅ uploadedBy: ref User, required
     - ✅ department: ref Department, required
     - ✅ organization: ref Organization, required
     - ✅ Applies softDelete plugin
     - ✅ TTL: 90 days
     - ✅ File size limits: Image 10MB, Video 100MB, Document 25MB, Audio 20MB, Other 50MB
     - ✅ File type extensions validated
     - ✅ Max 10 attachments per parent validation
   - **Common Issues**:
     - ❌ No file size validation
     - ❌ No file type extension validation
     - ❌ No max attachments per parent check
     - ❌ TTL not set
   - **Tests Required**:
     - Unit test: All field validations
     - Unit test: File size limits
     - Unit test: File type validation
     - Unit test: Max 10 attachments per parent
     - Integration test: Cloudinary upload

   **For `backend/models/Notification.js`:**

   - **Logic to Extract**:
     - Notification schema
     - Fields: title, message, type, isRead, recipient, entity, entityModel, organization, expiresAt
     - Notification types: 7 types
     - TTL: 30 days (or custom expiresAt)
     - Auto-expire after expiresAt
   - **Validation Checks**:
     - ✅ title: String, required
     - ✅ message: String, required
     - ✅ type: enum (Created, Updated, Deleted, Restored, Mention, Welcome, Announcement), required
     - ✅ isRead: Boolean, default false
     - ✅ recipient: ref User, required
     - ✅ entity: ref any resource
     - ✅ entityModel: String (resource type)
     - ✅ organization: ref Organization, required
     - ✅ expiresAt: Date, default 30 days from creation
     - ✅ TTL index on expiresAt
     - ✅ Types: Created, Updated, Deleted, Restored, Mention, Welcome, Announcement
   - **Common Issues**:
     - ❌ Missing notification types
     - ❌ No TTL index on expiresAt
     - ❌ expiresAt not defaulting to 30 days
   - **Tests Required**:
     - Unit test: All field validations
     - Unit test: Notification types enum
     - Unit test: expiresAt default value
     - Integration test: TTL cleanup works

   **For `backend/models/index.js`:**

   - **Logic to Extract**:
     - Model exports aggregation
     - All models exported
     - Proper import/export syntax
   - **Validation Checks**:
     - ✅ Exports Organization
     - ✅ Exports Department
     - ✅ Exports User
     - ✅ Exports BaseTask
     - ✅ Exports ProjectTask
     - ✅ Exports RoutineTask
     - ✅ Exports AssignedTask
     - ✅ Exports TaskActivity
     - ✅ Exports TaskComment
     - ✅ Exports Material
     - ✅ Exports Vendor
     - ✅ Exports Attachment
     - ✅ Exports Notification
     - ✅ Uses ES module syntax
   - **Common Issues**:
     - ❌ Missing model exports
     - ❌ Using CommonJS syntax
   - **Tests Required**:
     - Unit test: All models exported
     - Unit test: ES module syntax

4. **Action: Validate, Correct, Update, Enhance, Complete**

   For EACH file identified with issues:

   **Step 1: Document Issues**

   ```markdown
   ## Issues Found in [filename]

   ### Critical Issues

   - **WHAT**: [Description of issue]
   - **WHY**: [Impact on system]
   - **HOW**: [Solution approach]
   - **CODE**: [Complete corrected code]

   ### High Priority Issues

   [Same format]

   ### Medium Priority Issues

   [Same format]

   ### Low Priority Issues

   [Same format]
   ```

   **Step 2: Implement Corrections**

   - Use `strReplace` for targeted fixes
   - Use `fsWrite` for complete file rewrites if needed
   - Ensure all fixes are complete and working
   - Follow exact specifications from build-prompt.md

   **Step 3: Add/Update Tests**

   - Create test files in `backend/tests/unit/models/` or `backend/tests/property/`
   - Use Jest with ES modules configuration
   - Test all edge cases and error scenarios
   - Ensure 80%+ coverage for each file

5. **Test: Run All Tests**

   ```bash
   cd backend
   npm test -- --runInBand backend/tests/unit/models/
   ```

   **Validation Criteria**:

   - ✅ 100% of tests pass
   - ✅ 80%+ code coverage
   - ✅ No lint errors
   - ✅ No console.log statements in production code
   - ✅ All imports use ES modules syntax
   - ✅ All constants imported from utils/constants.js

6. **Validate: Final Checks**

   - All models use ES modules
   - All models apply softDelete plugin
   - All models have correct TTL
   - All cascade operations work
   - All unique indexes are partial
   - All validations match specifications

7. **Update Phase Tracker**
   Update `docs/dev-phase-tracker.md`:

   ```markdown
   ## Phase 2: Backend Models ✅

   - [x] Soft delete plugin validated and corrected
   - [x] All 14 models validated and corrected
   - [x] Model index file validated
   - [x] Cascade operations validated
   - [x] Tests added and passing (100%)
   - [x] Coverage achieved (80%+)
   ```

8. **Merge: Complete Phase 2**

   ```bash
   git add .
   git commit -m "Phase 2: Validate and correct backend models

   - Validated all 15 model files against specifications
   - Corrected soft delete plugin implementation
   - Enhanced cascade delete operations
   - Completed missing field validations
   - Added comprehensive model tests
   - Achieved 80%+ test coverage"

   git checkout main
   git merge validate/phase-2-backend-models
   git push origin main
   git branch -d validate/phase-2-backend-models
   ```

---

### Phase 3: Backend Middleware & Validators Validation

**Branch**: `validate/phase-3-backend-middleware`

#### BEFORE STARTING ANY CODE - GIT STATUS CHECK

```bash
# Check current branch
git branch --show-current

# Check if branch exists locally
git branch --list validate/phase-3-backend-middleware

# Check if branch exists remotely
git ls-remote --heads origin validate/phase-3-backend-middleware

# Get full git status
git status --porcelain

# Get diff of current branch vs main
git diff main...HEAD

# Check for uncommitted changes
git diff --stat

# If branch exists remotely, pull latest changes
git pull origin validate/phase-3-backend-middleware

# If branch doesn't exist, create it from main
git checkout main
git pull origin main
git checkout -b validate/phase-3-backend-middleware
```

**CRITICAL INSTRUCTION**: While this phase focuses on Backend Middleware & Validators, you must ALSO validate that:
- All controllers in `backend/controllers/` correctly use middleware in the proper order
- All routes in `backend/routes/` correctly apply middleware chain
- All models in `backend/models/` match validator field definitions exactly
- All services in `backend/services/` follow authorization patterns
- Constants in `backend/utils/constants.js` are used by ALL validators (no hardcoded values)

#### Files to Validate (13 files)

**Core Middleware:**

- `backend/middlewares/authMiddleware.js`
- `backend/middlewares/authorization.js`
- `backend/middlewares/rateLimiter.js`

**Validation Infrastructure:**

- `backend/middlewares/validators/validation.js`

**Resource Validators:**

- `backend/middlewares/validators/authValidators.js`
- `backend/middlewares/validators/userValidators.js`
- `backend/middlewares/validators/organizationValidators.js`
- `backend/middlewares/validators/departmentValidators.js`
- `backend/middlewares/validators/taskValidators.js`
- `backend/middlewares/validators/materialValidators.js`
- `backend/middlewares/validators/vendorValidators.js`
- `backend/middlewares/validators/attachmentValidators.js`
- `backend/middlewares/validators/notificationValidators.js`

#### MANDATORY: Cross Validation Scope

For this phase, cross validation MUST search for all occurrences of middleware and validator logic across:

```
backend/config/*
backend/controllers/*
backend/errorHandler/*
backend/middlewares/*
backend/middlewares/validators/*
backend/mock/*
backend/models/*
backend/models/plugins/*
backend/routes/*
backend/scripts/*
backend/services/*
backend/templates/*
backend/utils/*
backend/.env
backend/app.js
backend/server.js
```

#### MANDATORY: Super Deep Analysis

Before ANY code changes, perform super deep analysis using:

- `docs/validate-correct-update-enhance-complete.md`
- `docs/phase5-controllers-detailed.md`
- `docs/build-prompt.md`
- `docs/dev-phase-tracker.md`

Against: `backend/*` and `client/*`

#### MANDATORY: Task/Sub-Task Rule

- This phase is a TASK with multiple SUB-TASKS
- ALL sub-tasks MUST be started and completed TOGETHER
- It is STRICTLY FORBIDDEN to start a sub-task on its own

#### MANDATORY: Testing Rules

- Use Real MongoDB test database (NOT mongodb-memory-server)
- NEVER skip a test, no matter how long it takes
- NEVER skip a failed test - fix it
- At phase end: run `npm test` - ALL tests MUST pass

#### Critical Implementation Workflow [1 - 8]

1. **Branch Creation**

   ```bash
   git checkout -b validate/phase-3-backend-middleware
   ```

2. **Search & Read Files**

   - Use `grepSearch` to locate all middleware files
   - Use `readFile` to read each file completely
   - **Cross validate** across ALL directoriessted in Cross Validation Scope

3. **Analysis for Each File**

   **For `backend/middlewares/authMiddleware.js`:**

   - **Logic to Extract**:
     - JWT verification middleware
     - verifyJWT: Verify access token from cookie
     - verifyRefreshToken: Verify refresh token from cookie
     - Extract user from token
     - Attach user to req.user
   - **Validation Checks**:
     - ✅ verifyJWT reads access_token from cookies
     - ✅ Verifies token with JWT_ACCESS_SECRET
     - ✅ Extracts userId, email, role, organization, department
     - ✅ Fetches user from database with populated org/dept
     - ✅ Attaches user to req.user
     - ✅ Returns 401 if token invalid/expired
     - ✅ verifyRefreshToken reads refresh_token from cookies
     - ✅ Verifies token with JWT_REFRESH_SECRET
     - ✅ Returns 401 if token invalid/expired
     - ✅ Uses CustomError.authentication() for errors
   - **Common Issues**:
     - ❌ Reading token from Authorization header instead of cookie
     - ❌ Not fetching user from database
     - ❌ Not populating organization and department
     - ❌ Not handling token expiration
     - ❌ Using wrong secret for verification
   - **Tests Required**:
     - Unit test: Valid token passes
     - Unit test: Invalid token returns 401
     - Unit test: Expired token returns 401
     - Unit test: Missing token returns 401
     - Unit test: User attached to req.user with populated refs
     - Integration test: Full auth flow

   **For `backend/middlewares/authorization.js`:**

   - **Logic to Extract**:
     - Authorization middleware factory
     - Checks user permissions for resource and operation
     - Uses authorizationMatrix.json
     - Validates scope (own, ownDept, crossDept, crossOrg)
     - Checks organization/department isolation
     - Checks ownership for 'own' scope
   - **Validation Checks**:
     - ✅ Factory function: authorize(resource, operation)
     - ✅ Reads permissions from authorizationMatrix
     - ✅ Checks user role has permission
     - ✅ Validates scope for operation
     - ✅ For 'own' scope: checks ownership (createdBy, uploadedBy, etc.)
     - ✅ For 'ownDept' scope: checks department match
     - ✅ For 'crossDept' scope: checks organization match
     - ✅ For 'crossOrg' scope: checks isPlatformUser
     - ✅ Returns 403 if unauthorized
     - ✅ Uses CustomError.authorization() for errors
     - ✅ Platform SuperAdmin has crossOrg for Organization only
   - **Common Issues**:
     - ❌ Not checking isPlatformUser for crossOrg
     - ❌ Not validating organization match
     - ❌ Not validating department match
     - ❌ Not checking ownership for 'own' scope
     - ❌ Platform SuperAdmin has crossOrg for all resources (should be Organization only)
   - **Tests Required**:
     - Unit test: Each role/resource/operation combination
     - Unit test: Scope validation for each scope
     - Unit test: Organization isolation
     - Unit test: Department isolation
     - Unit test: Ownership checks
     - Property test: All permission combinations
     - Integration test: Full authorization flow

   **For `backend/middlewares/rateLimiter.js`:**

   - **Logic to Extract**:
     - Rate limiting middleware
     - General API limiter: 100 req/15min
     - Auth endpoints limiter: 5 req/15min
     - Production only
     - IP-based tracking
   - **Validation Checks**:
     - ✅ Only active in production (NODE_ENV === 'production')
     - ✅ General limiter: windowMs 15min, max 100
     - ✅ Auth limiter: windowMs 15min, max 5
     - ✅ Uses IP address for tracking
     - ✅ Returns rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining)
     - ✅ Returns 429 when limit exceeded
     - ✅ Auth endpoints: /login, /register, /forgot-password, /reset-password, /refresh-token, /logout
   - **Common Issues**:
     - ❌ Active in development
     - ❌ Incorrect rate limits
     - ❌ Not tracking by IP
     - ❌ Missing rate limit headers
   - **Tests Required**:
     - Unit test: Disabled in development
     - Unit test: Enabled in production
     - Unit test: General limiter enforced
     - Unit test: Auth limiter enforced
     - Integration test: Rate limit headers present

   **For `backend/middlewares/validators/validation.js`:**

   - **Logic to Extract**:
     - Validation result handler
     - Uses express-validator
     - Extracts validated data with matchedData
     - Separates body, params, query
     - Returns 400 if validation errors
   - **Validation Checks**:
     - ✅ Uses validationResult from express-validator
     - ✅ Checks if errors exist
     - ✅ Returns 400 with error details if errors
     - ✅ Uses matchedData to extract validated data
     - ✅ Separates: req.validated.body, req.validated.params, req.validated.query
     - ✅ Calls next() if no errors
     - ✅ Uses CustomError.validation() for errors
   - **Common Issues**:
     - ❌ Not using matchedData
     - ❌ Not separating body/params/query
     - ❌ Not returning 400 on errors
   - **Tests Required**:
     - Unit test: Validation errors return 400
     - Unit test: matchedData extracted correctly
     - Unit test: Separated body/params/query
     - Integration test: Full validation flow

   **For `backend/middlewares/validators/authValidators.js`:**

   - **Logic to Extract**:
     - registerOrganization validator
     - loginUser validator
     - forgotPassword validator
     - resetPassword validator
   - **Validation Checks**:
     - ✅ registerOrganization: organizationData (name, email, phone, industry), userData (firstName, lastName, email, password)
     - ✅ loginUser: email (required, valid), password (required)
     - ✅ forgotPassword: email (required, valid)
     - ✅ resetPassword: token (required), newPassword (required, min 8)
     - ✅ All fields sanitized (trim, toLowerCase for email)
     - ✅ Imports constants from utils/constants.js
   - **Common Issues**:
     - ❌ Missing field validations
     - ❌ Hardcoded values instead of constants
     - ❌ Missing sanitization
   - **Tests Required**:
     - Unit test: Each validator with valid/invalid data
     - Integration test: Full auth validation flow

   **For `backend/middlewares/validators/userValidators.js`:**

   - **Logic to Extract**:
     - createUser validator
     - updateUser validator
     - updateMyProfile validator
     - getUserById validator
     - deleteUser validator
     - restoreUser validator
   - **Validation Checks**:
     - ✅ createUser: firstName (max 20), lastName (max 20), email (valid, max 50), password (min 8), role (enum), departmentId, position (max 100), skills (array max 10), employeeId (4-digit), dateOfBirth (not future), joinedAt (not future)
     - ✅ updateUser: All fields optional, same validations
     - ✅ updateMyProfile: Limited fields (no role, no department)
     - ✅ getUserById: userId (valid ObjectId)
     - ✅ deleteUser: userId (valid ObjectId)
     - ✅ restoreUser: userId (valid ObjectId)
     - ✅ Imports USER_ROLES from constants
   - **Common Issues**:
     - ❌ Missing field validations
     - ❌ Allowing role change in updateMyProfile
     - ❌ Hardcoded role values
   - **Tests Required**:
     - Unit test: Each validator with valid/invalid data
     - Unit test: updateMyProfile cannot change role

   **For `backend/middlewares/validators/organizationValidators.js`:**

   - **Logic to Extract**:
     - updateOrganization validator
     - getOrganizationById validator
     - deleteOrganization validator
     - restoreOrganization validator
   - **Validation Checks**:
     - ✅ updateOrganization: name (max 100), description (max 2000), email (valid, max 50), phone (Ethiopian format), address (max 500), industry (enum 24 options)
     - ✅ Cannot change isPlatformOrg
     - ✅ getOrganizationById: organizationId (valid ObjectId)
     - ✅ deleteOrganization: organizationId (valid ObjectId)
     - ✅ restoreOrganization: organizationId (valid ObjectId)
     - ✅ Imports INDUSTRIES from constants
   - **Common Issues**:
     - ❌ Allowing isPlatformOrg change
     - ❌ Hardcoded industry values
   - **Tests Required**:
     - Unit test: Each validator with valid/invalid data
     - Unit test: isPlatformOrg cannot be changed

   **For `backend/middlewares/validators/departmentValidators.js`:**

   - **Logic to Extract**:
     - createDepartment validator
     - updateDepartment validator
     - getDepartmentById validator
     - deleteDepartment validator
     - restoreDepartment validator
   - **Validation Checks**:
     - ✅ createDepartment: name (max 100, required), description (max 2000)
     - ✅ updateDepartment: name (max 100), description (max 2000)
     - ✅ getDepartmentById: departmentId (valid ObjectId)
     - ✅ deleteDepartment: departmentId (valid ObjectId)
     - ✅ restoreDepartment: departmentId (valid ObjectId)
   - **Common Issues**:
     - ❌ Missing field validations
   - **Tests Required**:
     - Unit test: Each validator with valid/invalid data

   **For `backend/middlewares/validators/taskValidators.js`:**

   - **Logic to Extract**:
     - createTask validator (handles all 3 task types)
     - updateTask validator
     - getTaskById validator
     - deleteTask validator
     - restoreTask validator
     - createTaskActivity validator
     - updateTaskActivity validator
     - createTaskComment validator
     - updateTaskComment validator
   - **Validation Checks**:
     - ✅ createTask: taskType (enum), description (max 2000), status (enum), priority (enum), tags (array max 5), watchers (array max 20)
     - ✅ ProjectTask: title (max 50, required), vendor (required), estimatedCost, startDate, dueDate
     - ✅ RoutineTask: materials (array max 20), startDate (required), dueDate (required), status NOT "To Do", priority NOT "Low"
     - ✅ AssignedTask: title (max 50, required), assignees (required, max 20), startDate, dueDate
     - ✅ Date validation: dueDate after startDate
     - ✅ createTaskActivity: activity (max 2000), materials (array max 20)
     - ✅ createTaskComment: comment (max 2000, required), mentions (array max 5)
     - ✅ Imports TASK_STATUS, TASK_PRIORITY, TASK_TYPES from constants
   - **Common Issues**:
     - ❌ Not validating task type restrictions
     - ❌ Allowing "To Do" for RoutineTask
     - ❌ Allowing "Low" priority for RoutineTask
     - ❌ Hardcoded status/priority values
   - **Tests Required**:
     - Unit test: Each validator with valid/invalid data
     - Unit test: RoutineTask status restriction
     - Unit test: RoutineTask priority restriction
     - Unit test: Date validation

   **For `backend/middlewares/validators/materialValidators.js`:**

   - **Logic to Extract**:
     - createMaterial validator
     - updateMaterial validator
     - getMaterialById validator
     - deleteMaterial validator
     - restoreMaterial validator
   - **Validation Checks**:
     - ✅ createMaterial: name (max 100, required), description (max 2000), category (enum 9 options, required), unitType (enum 30+ options, required), price (min 0)
     - ✅ updateMaterial: All fields optional, same validations
     - ✅ getMaterialById: materialId (valid ObjectId)
     - ✅ deleteMaterial: materialId (valid ObjectId)
     - ✅ restoreMaterial: materialId (valid ObjectId)
     - ✅ Imports MATERIAL_CATEGORIES, UNIT_TYPES from constants
   - **Common Issues**:
     - ❌ Hardcoded category/unit type values
     - ❌ Missing price validation
   - **Tests Required**:
     - Unit test: Each validator with valid/invalid data
     - Unit test: Category enum validation
     - Unit test: Unit type enum validation

   **For `backend/middlewares/validators/vendorValidators.js`:**

   - **Logic to Extract**:
     - createVendor validator
     - updateVendor validator
     - getVendorById validator
     - deleteVendor validator
     - restoreVendor validator
   - **Validation Checks**:
     - ✅ createVendor: name (max 100, required), description (max 2000), contactPerson (max 100), email (valid, max 50), phone (Ethiopian format), address (max 500)
     - ✅ updateVendor: All fields optional, same validations
     - ✅ getVendorById: vendorId (valid ObjectId)
     - ✅ deleteVendor: vendorId (valid ObjectId)
     - ✅ restoreVendor: vendorId (valid ObjectId)
     - ✅ Phone regex: /^(\+251\d{9}|0\d{9})$/
   - **Common Issues**:
     - ❌ Incorrect phone validation regex
   - **Tests Required**:
     - Unit test: Each validator with valid/invalid data
     - Unit test: Phone format validation

   **For `backend/middlewares/validators/attachmentValidators.js`:**

   - **Logic to Extract**:
     - createAttachment validator
     - getAttachmentById validator
     - deleteAttachment validator
   - **Validation Checks**:
     - ✅ createAttachment: parent (valid ObjectId, required), parentModel (enum, required), file validation
     - ✅ File type validation (Image, Video, Document, Audio, Other)
     - ✅ File size validation (Image 10MB, Video 100MB, Document 25MB, Audio 20MB, Other 50MB)
     - ✅ getAttachmentById: attachmentId (valid ObjectId)
     - ✅ deleteAttachment: attachmentId (valid ObjectId)
     - ✅ Imports FILE_SIZE_LIMITS, ATTACHMENT_TYPES from constants
   - **Common Issues**:
     - ❌ Missing file type validation
     - ❌ Missing file size validation
     - ❌ Hardcoded file size limits
   - **Tests Required**:
     - Unit test: Each validator with valid/invalid data
     - Unit test: File type validation
     - Unit test: File size validation

   **For `backend/middlewares/validators/notificationValidators.js`:**

   - **Logic to Extract**:
     - getNotifications validator (query params)
     - markNotificationRead validator
   - **Validation Checks**:
     - ✅ getNotifications: page, limit, isRead (boolean), type (enum 7 types)
     - ✅ markNotificationRead: notificationId (valid ObjectId)
     - ✅ Imports NOTIFICATION_TYPES from constants
   - **Common Issues**:
     - ❌ Hardcoded notification types
   - **Tests Required**:
     - Unit test: Each validator with valid/invalid data

4. **Action: Validate, Correct, Update, Enhance, Complete**

   For EACH file identified with issues:

   **Step 1: Document Issues**

   ```markdown
   ## Issues Found in [filename]

   ### Critical Issues

   - **WHAT**: [Description of issue]
   - **WHY**: [Impact on system]
   - **HOW**: [Solution approach]
   - **CODE**: [Complete corrected code]

   ### High Priority Issues

   [Same format]

   ### Medium Priority Issues

   [Same format]

   ### Low Priority Issues

   [Same format]
   ```

   **Step 2: Implement Corrections**

   - Use `strReplace` for targeted fixes
   - Use `fsWrite` for complete file rewrites if needed
   - Ensure all fixes are complete and working
   - Follow exact specifications from build-prompt.md

   **Step 3: Add/Update Tests**

   - Create test files in `backend/tests/unit/middlewares/`
   - Use Jest with ES modules configuration
   - Test all edge cases and error scenarios
   - Ensure 80%+ coverage for each file

5. **Test: Run All Tests**

   ```bash
   cd backend
   npm test -- --runInBand backend/tests/unit/middlewares/
   ```

   **Validation Criteria**:

   - ✅ 100% of tests pass
   - ✅ 80%+ code coverage
   - ✅ No lint errors
   - ✅ No console.log statements in production code
   - ✅ All imports use ES modules syntax
   - ✅ All constants imported from utils/constants.js

6. **Validate: Final Checks**

   - All middleware use ES modules
   - Authorization checks all scopes correctly
   - Rate limiting only in production
   - All validators import constants
   - No hardcoded values in validators
   - Validators are source of truth for field names

7. **Update Phase Tracker**
   Update `docs/dev-phase-tracker.md`:

   ```markdown
   ## Phase 3: Backend Middleware & Validators ✅

   - [x] Auth middleware validated and corrected
   - [x] Authorization middleware validated and corrected
   - [x] Rate limiter validated and corrected
   - [x] Validation handler validated and corrected
   - [x] All 9 validators validated and corrected
   - [x] Tests added and passing (100%)
   - [x] Coverage achieved (80%+)
   ```

8. **Merge: Complete Phase 3**

   ```bash
   git add .
   git commit -m "Phase 3: Validate and correct backend middleware and validators

   - Validated all 13 middleware/validator files against specifications
   - Corrected authorization scope handling
   - Enhanced rate limiting configuration
   - Completed missing field validations
   - Added comprehensive middleware tests
   - Achieved 80%+ test coverage"

   git checkout main
   git merge validate/phase-3-backend-middleware
   git push origin main
   git branch -d validate/phase-3-backend-middleware
   ```

---

### Phase 4: Backend Services & Utils Validation

**Branch**: `validate/phase-4-backend-services`

#### BEFORE STARTING ANY CODE - GIT STATUS CHECK

```bash
# Check current branch
git branch --show-current

# Check if branch exists locally
git branch --list validate/phase-4-backend-services

# Check if branch exists remotely
git ls-remote --heads origin validate/phase-4-backend-services

# Get full git status
git status --porcelain

# Get diff of current branch vs main
git diff main...HEAD

# Check for uncommitted changes
git diff --stat

# If branch exists remotely, pull latest changes
git pull origin validate/phase-4-backend-services

# If branch doesn't exist, create it from main
git checkout main
git pull origin main
git checkout -b validate/phase-4-backend-services
```

**CRITICAL INSTRUCTION**: While this phase focuses on Backend Services & Utils, you must ALSO validate that:
- All controllers in `backend/controllers/` correctly use services and utils
- All models in `backend/models/` are properly referenced in utils
- All middleware in `backend/middlewares/` integrate with utils
- Socket.IO events are properly emitted from controllers
- Notification service is called from all relevant controllers

#### Files to Validate (8 files)

**Services:**

- `backend/services/emailService.js`
- `backend/services/notificationService.js`

**Socket.IO Infrastructure:**

- `backend/utils/socket.js`
- `backend/utils/socketEmitter.js`
- `backend/utils/socketInstance.js`

**Utilities:**

- `backend/utils/userStatus.js`
- `backend/utils/responseTransform.js`
- `backend/utils/materialTransform.js`

#### MANDATORY: Cross Validation Scope

For this phase, cross validation MUST search for all occurrences of services and utility logic across:

```
backend/config/*
backend/controllers/*
backend/errorHandler/*
backend/middlewares/*
backend/middlewares/validators/*
backend/mock/*
backend/models/*
backend/models/plugins/*
backend/routes/*
backend/scripts/*
backend/services/*
backend/templates/*
backend/utils/*
backend/.env
backend/app.js
backend/server.js
```

#### MANDATORY: Super Deep Analysis

Before ANY code changes, perform super deep analysis using:

- `docs/validate-correct-update-enhance-complete.md`
- `docs/phase5-controllers-detailed.md`
- `docs/build-prompt.md`
- `docs/dev-phase-tracker.md`

Against: `backend/*` and `client/*`

#### MANDATORY: Task/Sub-Task Rule

- This phase is a TASK with multiple SUB-TASKS
- ALL sub-tasks MUST be started and completed TOGETHER
- It is STRICTLY FORBIDDEN to start a sub-task on its own

#### MANDATORY: Testing Rules

- Use Real MongoDB test database (NOT mongodb-memory-server)
- NEVER skip a test, no matter how long it takes
- NEVER skip a failed test - fix it
- At phase end: run `npm test` - ALL tests MUST pass

#### Critical Implementation Workflow [1 - 8]

1. **Branch Creation**

   ```bash
   git checkout -b validate/phase-4-backend-services
   ```

2. **Search & Read Files**

   - Use `grepSearch` to locate all service and utility files
   - Use `readFile` to read each file completely
   - **Cross validate** across ALL directories listed in Cross Validation Scope

3. **Analysis for Each File**

   **For `backend/services/emailService.js`:**

   - **Logic to Extract**:
     - Nodemailer configuration with Gmail SMTP
     - Queue-based email sending
     - Email templates integration
     - Retry logic for failed emails
     - Rate limiting for email sending
   - **Validation Checks**:
     - ✅ Uses Nodemailer with Gmail SMTP
     - ✅ Reads EMAIL_USER and EMAIL_PASSWORD from environment
     - ✅ Queue-based sending to prevent blocking
     - ✅ Retry logic with exponential backoff
     - ✅ HTML email templates from templates/emailTemplates.js
     - ✅ Error logging with winston
     - ✅ Graceful handling of email failures
   - **Common Issues**:
     - ❌ Synchronous email sending (blocks request)
     - ❌ No retry logic
     - ❌ Hardcoded credentials
     - ❌ No error handling
   - **Tests Required**:
     - Unit test: Email configuration
     - Unit test: Queue processing
     - Unit test: Retry logic
     - Integration test: Send email (mock SMTP)

   **For `backend/services/notificationService.js`:**

   - **Logic to Extract**:
     - Notification creation function
     - Recipient determination logic
     - Session support for transactions
     - Notification types handling
     - TTL setting (30 days default)
   - **Validation Checks**:
     - ✅ createNotification(data, session) function
     - ✅ Supports all 7 notification types (Created, Updated, Deleted, Restored, Mention, Welcome, Announcement)
     - ✅ Sets expiresAt to 30 days from creation
     - ✅ Accepts session for transaction consistency
     - ✅ Validates recipient exists
     - ✅ Validates entity reference if provided
     - ✅ Returns created notification
   - **Common Issues**:
     - ❌ Not supporting session parameter
     - ❌ Not setting expiresAt
     - ❌ Not validating recipient
     - ❌ Missing notification types
   - **Tests Required**:
     - Unit test: Create notification with all types
     - Unit test: Session support
     - Unit test: TTL setting
     - Integration test: Notification creation in transaction

   **For `backend/utils/socketInstance.js`:**

   - **Logic to Extract**:
     - Socket.IO singleton pattern
     - Server initialization
     - CORS configuration
     - Instance getter
   - **Validation Checks**:
     - ✅ Singleton pattern (single io instance)
     - ✅ initializeSocket(httpServer) function
     - ✅ Uses corsOptions from config
     - ✅ getIO() throws if not initialized
     - ✅ Returns io instance
   - **Common Issues**:
     - ❌ Multiple io instances created
     - ❌ No error when getIO called before init
     - ❌ Missing CORS configuration
   - **Tests Required**:
     - Unit test: Singleton pattern
     - Unit test: Initialization
     - Unit test: getIO throws before init

   **For `backend/utils/socket.js`:**

   - **Logic to Extract**:
     - Socket.IO event handlers
     - Connection/disconnection handling
     - Room joining logic
     - User status updates
   - **Validation Checks**:
     - ✅ setupSocketHandlers(io) function
     - ✅ On connection: joins user, department, organization rooms
     - ✅ Room naming: `user:${userId}`, `department:${deptId}`, `organization:${orgId}`
     - ✅ On disconnect: leaves all rooms, updates status to 'Offline'
     - ✅ Handles reconnection
     - ✅ Logs connection events with winston
   - **Common Issues**:
     - ❌ Not joining all required rooms
     - ❌ Not updating user status on disconnect
     - ❌ Using console.log instead of winston
     - ❌ Not handling reconnection
   - **Tests Required**:
     - Unit test: Room joining
     - Unit test: Disconnection handling
     - Unit test: Status updates
     - Integration test: Full connection flow

   **For `backend/utils/socketEmitter.js`:**

   - **Logic to Extract**:
     - Event emission functions
     - Room-based broadcasting
     - Event naming conventions
     - Payload formatting
   - **Validation Checks**:
     - ✅ emitToUser(userId, event, data) function
     - ✅ emitToDepartment(deptId, event, data) function
     - ✅ emitToOrganization(orgId, event, data) function
     - ✅ emitToRecipients(recipientIds, event, data) function
     - ✅ Event naming: `resource:action` (e.g., `task:created`, `user:updated`)
     - ✅ Includes resource ID in payload
     - ✅ Uses getIO() from socketInstance
   - **Common Issues**:
     - ❌ Missing emitter functions
     - ❌ Incorrect room names
     - ❌ Not including resource ID in payload
     - ❌ Not using getIO()
   - **Tests Required**:
     - Unit test: Each emitter function
     - Unit test: Event naming
     - Unit test: Payload format
     - Integration test: Event emission

   **For `backend/utils/userStatus.js`:**

   - **Logic to Extract**:
     - User status tracking
     - Status types: Online, Offline, Away
     - Status update functions
     - Status retrieval
   - **Validation Checks**:
     - ✅ updateUserStatus(userId, status) function
     - ✅ getUserStatus(userId) function
     - ✅ Status types: Online, Offline, Away
     - ✅ Imports USER_STATUS from constants
     - ✅ Emits status change events via Socket.IO
   - **Common Issues**:
     - ❌ Hardcoded status values
     - ❌ Not emitting status events
     - ❌ Not validating status type
   - **Tests Required**:
     - Unit test: Status update
     - Unit test: Status retrieval
     - Unit test: Event emission

   **For `backend/utils/responseTransform.js`:**

   - **Logic to Extract**:
     - Response formatting functions
     - Pagination metadata formatting
     - Error response formatting
     - Success response formatting
   - **Validation Checks**:
     - ✅ formatSuccessResponse(data, message) function
     - ✅ formatPaginationResponse(data, pagination) function
     - ✅ Consistent response structure: { success, message, data, pagination }
     - ✅ Pagination includes: page, limit, totalPages, totalCount, hasNext, hasPrev
   - **Common Issues**:
     - ❌ Inconsistent response structure
     - ❌ Missing pagination fields
     - ❌ Not including success flag
   - **Tests Required**:
     - Unit test: Success response format
     - Unit test: Pagination response format
     - Unit test: Error response format

   **For `backend/utils/materialTransform.js`:**

   - **Logic to Extract**:
     - Material data transformation
     - Usage statistics calculation
     - Linked tasks/activities retrieval
   - **Validation Checks**:
     - ✅ transformMaterial(material) function
     - ✅ calculateUsageStats(materialId) function
     - ✅ getLinkedTasks(materialId) function
     - ✅ getLinkedActivities(materialId) function
   - **Common Issues**:
     - ❌ Missing transformation functions
     - ❌ Incorrect usage calculation
   - **Tests Required**:
     - Unit test: Material transformation
     - Unit test: Usage statistics
     - Unit test: Linked resources

4. **Action: Validate, Correct, Update, Enhance, Complete**

   For EACH file identified with issues:

   **Step 1: Document Issues**

   ```markdown
   ## Issues Found in [filename]

   ### Critical Issues

   - **WHAT**: [Description of issue]
   - **WHY**: [Impact on system]
   - **HOW**: [Solution approach]
   - **CODE**: [Complete corrected code]

   ### High Priority Issues

   [Same format]

   ### Medium Priority Issues

   [Same format]

   ### Low Priority Issues

   [Same format]
   ```

   **Step 2: Implement Corrections**

   - Use `strReplace` for targeted fixes
   - Use `fsWrite` for complete file rewrites if needed
   - Ensure all fixes are complete and working
   - Follow exact specifications from build-prompt.md

   **Step 3: Add/Update Tests**

   - Create test files in `backend/tests/unit/services/` or `backend/tests/unit/utils/`
   - Use Jest with ES modules configuration
   - Test all edge cases and error scenarios
   - Ensure 80%+ coverage for each file

5. **Test: Run All Tests**

   ```bash
   cd backend
   npm test -- --runInBand backend/tests/unit/services/
   npm test -- --runInBand backend/tests/unit/utils/
   ```

   **Validation Criteria**:

   - ✅ 100% of tests pass
   - ✅ 80%+ code coverage
   - ✅ No lint errors
   - ✅ No console.log statements in production code
   - ✅ All imports use ES modules syntax
   - ✅ All constants imported from utils/constants.js

6. **Validate: Final Checks**

   - Email service uses Nodemailer with Gmail SMTP
   - Queue-based email sending implemented
   - Notification service creates notifications correctly
   - Socket.IO singleton pattern correct
   - Socket rooms: user, department, organization
   - Event emitters for all resource changes
   - User status tracking works
   - Response transformation consistent

7. **Update Phase Tracker**
   Update `docs/dev-phase-tracker.md`:

   ```markdown
   ## Phase 4: Backend Services & Utils ✅

   - [x] Email service validated and corrected
   - [x] Notification service validated and corrected
   - [x] Socket.IO infrastructure validated and corrected
   - [x] Utility functions validated and corrected
   - [x] Tests added and passing (100%)
   - [x] Coverage achieved (80%+)
   ```

8. **Merge: Complete Phase 4**

   ```bash
   git add .
   git commit -m "Phase 4: Validate and correct backend services and utils

   - Validated all 8 service/utility files against specifications
   - Corrected email service queue implementation
   - Enhanced notification service with session support
   - Completed Socket.IO infrastructure
   - Added comprehensive service tests
   - Achieved 80%+ test coverage"

   git checkout main
   git merge validate/phase-4-backend-services
   git push origin main
   git branch -d validate/phase-4-backend-services
   ```

---

### Phase 5: Backend Controllers Validation

**Branch**: `validate/phase-5-backend-controllers`

**IMPORTANT**: For detailed controller validation, refer to `docs/phase5-controllers-detailed.md`

#### BEFORE STARTING ANY CODE - GIT STATUS CHECK

```bash
# Check current branch
git branch --show-current

# Check if branch exists locally
git branch --list validate/phase-5-backend-controllers

# Check if branch exists remotely
git ls-remote --heads origin validate/phase-5-backend-controllers

# Get full git status
git status --porcelain

# Get diff of current branch vs main
git diff main...HEAD

# Check for uncommitted changes
git diff --stat

# If branch exists remotely, pull latest changes
git pull origin validate/phase-5-backend-controllers

# If branch doesn't exist, create it from main
git checkout main
git pull origin main
git checkout -b validate/phase-5-backend-controllers
```
**CRITICAL INSTRUCTION**: While this phase focuses on Backend Controllers, you must ALSO validate that:
- All models in `backend/models/` are correctly used by controllers
- All middleware in `backend/middlewares/` is properly applied to controller routes
- All routes in `backend/routes/` correctly map to controller functions
- All services in `backend/services/` are correctly called from controllers
- Socket.IO events from controllers are properly handled
- Notifications created by controllers are properly formatted

#### Files to Validate (9 controller files, 59 functions total)

- `backend/controllers/authControllers.js` (6 functions)
- `backend/controllers/userControllers.js` (8 functions)
- `backend/controllers/organizationControllers.js` (5 functions)
- `backend/controllers/departmentControllers.js` (6 functions)
- `backend/controllers/taskControllers.js` (18 functions)
- `backend/controllers/materialControllers.js` (6 functions)
- `backend/controllers/vendorControllers.js` (6 functions)
- `backend/controllers/attachmentControllers.js` (5 functions)
- `backend/controllers/notificationControllers.js` (3 functions)

#### MANDATORY: Cross Validation Scope

For this phase, cross validation MUST search for all occurrences of controller logic across:

```
backend/config/*
backend/controllers/*
backend/errorHandler/*
backend/middlewares/*
backend/middlewares/validators/*
backend/mock/*
backend/models/*
backend/models/plugins/*
backend/routes/*
backend/scripts/*
backend/services/*
backend/templates/*
backend/utils/*
backend/.env
backend/app.js
backend/server.js
```

#### MANDATORY: Super Deep Analysis

Before ANY code changes, perform super deep analysis using:

- `docs/validate-correct-update-enhance-complete.md`
- `docs/phase5-controllers-detailed.md`
- `docs/build-prompt.md`
- `docs/dev-phase-tracker.md`

Against: `backend/*` and `client/*`

#### MANDATORY: Task/Sub-Task Rule

- This phase is a TASK with multiple SUB-TASKS
- ALL sub-tasks MUST be started and completed TOGETHER
- It is STRICTLY FORBIDDEN to start a sub-task on its own

#### MANDATORY: Testing Rules

- Use Real MongoDB test database (NOT mongodb-memory-server)
- NEVER skip a test, no matter how long it takes
- NEVER skip a failed test - fix it
- At phase end: run `npm test` - ALL tests MUST pass

#### UNIVERSAL CONTROLLER PATTERNS (Apply to ALL controllers)

**A. Function Signature & Wrapper**

- ✅ Wrapped with `asyncHandler(async (req, res, next) => {})`
- ✅ Parameters: req, res, next (in that order)
- ✅ Async function (uses await)
- ✅ No try/catch at function level (asyncHandler handles it)

**B. Data Extraction from req.user**

- ✅ `const orgId = req.user.organization._id;`
- ✅ `const deptId = req.user.department._id;`
- ✅ `const callerId = req.user._id;`
- ✅ `const isPlatformUser = req.user.isPlatformUser;`

**C. Data Extraction from req.validated**

- ✅ `const { fields } = req.validated.body;` (POST/PUT/PATCH)
- ✅ `const { resourceId } = req.validated.params;`
- ✅ `const { page, limit, search, deleted } = req.validated.query;`
- ✅ NEVER access req.body/params/query directly

**D. Session Management for Write Operations**

- ✅ `const session = await mongoose.startSession();`
- ✅ `session.startTransaction();`
- ✅ try/catch/finally block
- ✅ Pass session: `.save({ session })`, `.session(session)`
- ✅ `await session.commitTransaction();` on success
- ✅ `await session.abortTransaction();` on error
- ✅ `next(error);` to pass error
- ✅ `session.endSession();` in finally

**E. Pagination for List Operations**

- ✅ Extract: `const { page = 1, limit = 10 } = req.validated.query;`
- ✅ Use: `Model.paginate(filter, options)`
- ✅ Return: page, limit, totalPages, totalCount, hasNext, hasPrev

**F. Soft Delete Plugin Utilities**

- ✅ Default excludes deleted
- ✅ Include: `Model.withDeleted().find()`
- ✅ Only deleted: `Model.onlyDeleted().find()`
- ✅ Soft delete: `await doc.softDelete(session, deletedBy)`
- ✅ Restore: `await doc.restore(session, restoredBy)`

**G. Cascade Delete Operations**

- ✅ Use transactions
- ✅ Soft delete parent first
- ✅ Cascade to all children
- ✅ Update references
- ✅ Emit socket events
- ✅ Create notifications

**H. Cascade Restore Operations**

- ✅ Use transactions
- ✅ Restore parent first
- ✅ Optionally restore children
- ✅ Update references
- ✅ Emit socket events

**I. Resource Linking/Unlinking**

- ✅ Vendor delete: Check ProjectTasks, require reassignment
- ✅ Material delete: Check tasks/activities, require reassignment
- ✅ User delete: Remove from task watchers/assignees
- ✅ Restore: Re-link if references exist

**J. Multi-Tenancy Isolation**

- ✅ ALWAYS filter: `{ organization: orgId }`
- ✅ Platform SuperAdmin exception: crossOrg for Organization only
- ✅ Validate resource belongs to user's org
- ✅ Throw 404 if not found in org

**K. Department Isolation**

- ✅ Manager/User filter: `{ department: deptId }`
- ✅ SuperAdmin/Admin: All departments in org
- ✅ Validate resource belongs to department

**L. Ownership Checks**

- ✅ Verify user owns resource or has permission
- ✅ Check createdBy, uploadedBy, assignees
- ✅ Throw 403 if unauthorized

**M. Socket.IO Event Emission**

- ✅ Import: `emitToUser`, `emitToDepartment`, `emitToOrganization`, `emitToRecipients`
- ✅ Emit after commit
- ✅ Event naming: `resource:action`
- ✅ Include resource ID in payload

**N. Notification Creation**

- ✅ Import: `createNotification` from utils/helpers.js
- ✅ Pass session
- ✅ Determine recipients (HODs, watchers, assignees, mentions)
- ✅ Include entity reference

**O. Response Format**

- ✅ Success: `res.status(200|201).json({ success: true, message, data, pagination })`
- ✅ Appropriate status codes
- ✅ Descriptive messages

**P. Error Handling**

- ✅ Use CustomError class
- ✅ Provide context
- ✅ Abort transaction on error
- ✅ Pass to next middleware

**Q. TIMEZONE MANAGEMENT (CRITICAL)**

- ✅ Store in UTC: All database dates stored in UTC
- ✅ Convert at Boundaries: Frontend → Backend (Local → UTC), Backend → Frontend (UTC → Local)
- ✅ Use ISO Format: Standardized date communication (ISO 8601)
- ✅ Server Timezone: `process.env.TZ = "UTC";` (MUST be first line in server.js)
- ✅ Dayjs Configuration: Import dayjs with utc and timezone plugins
- ✅ Convert incoming dates: `dayjs(date).utc().toDate()`
- ✅ Validate dates: Check validity, not in past (when required), dueDate > startDate

#### Controller-Specific Validation

**authControllers.js (6 functions):**

- registerOrganization: Transaction, creates org+dept+user, checks dept uniqueness, SuperAdmin role, returns 201
- loginUser: Finds user with password, comparePassword(), generates tokens, sets HTTP-only cookies, updates lastLogin, returns 200
- logoutUser: Clears both cookies, returns 200
- getRefreshToken: Generates new access+refresh tokens (rotation), sets cookies, returns 200
- forgotPassword: Generates token, hashes before saving, sets expiry, sends email, ALWAYS returns success, returns 200
- resetPassword: Hashes token for comparison, checks expiry, sets new password, clears reset fields, returns 200

**userControllers.js (8 functions):**

- createUser: Transaction, validates dept, creates user, isHod/isPlatformUser auto-set, notifies HODs, emits events, returns 201
- getAllUsers: Filters by org/dept based on role, pagination, search, deleted param, returns 200
- getUser: Validates org match, populates references, returns 200
- updateUserBy: Transaction, validates dept if changing, isHod auto-updates on role change, notifies, emits, returns 200
- updateMyProfile: Validates ownership, updates allowed fields only, cannot change role/dept, returns 200
- getMyAccount: Validates ownership, populates references, returns 200
- deleteUser: Transaction, checks not last SuperAdmin/HOD, soft deletes, removes from tasks, notifies, emits, returns 200
- restoreUser: Transaction, validates dept exists, restores, notifies, emits, returns 200

**organizationControllers.js (5 functions):**

- getAllOrganizations: Platform sees all, customer sees own, pagination, search, industry filter, returns 200
- getOrganizationDashboard: Validates access, calculates stats, returns 200
- updateOrganization: Transaction, validates access, cannot change isPlatformOrg, notifies, emits, returns 200
- deleteOrganization: Transaction, platform only, cannot delete platform org, cascades to all children, notifies, emits, returns 200
- restoreOrganization: Transaction, platform only, restores org, optionally restores children, notifies, emits, returns 200

**departmentControllers.js (6 functions):**

- createDepartment: Transaction, checks name uniqueness in org, creates dept, notifies HODs, emits, returns 201
- getAllDepartments: Filters by org, pagination, search, deleted param, returns 200
- getDepartment: Validates org match, populates users/tasks, returns 200
- updateDepartment: Transaction, checks name uniqueness, updates, notifies, emits, returns 200
- deleteDepartment: Transaction, checks not last dept, cascades to users/tasks/materials, notifies, emits, returns 200
- restoreDepartment: Transaction, validates org exists, restores, notifies, emits, returns 200

**taskControllers.js (18 functions):**

- createTask: Transaction, validates task type, vendor (ProjectTask), assignees (AssignedTask), materials (RoutineTask), watchers HOD only, notifies, emits, returns 201
- getAllTasks: Filters by org/dept, task type, status, priority, pagination, search, deleted param, returns 200
- getTask: Validates org match, populates all references, returns 200
- updateTask: Transaction, validates task type restrictions, updates, notifies watchers/assignees, emits, returns 200
- deleteTask: Transaction, cascades to activities/comments/attachments, notifies, emits, returns 200
- restoreTask: Transaction, validates references exist, restores, notifies, emits, returns 200
- createTaskActivity: Transaction, validates parent is ProjectTask/AssignedTask (NOT RoutineTask), creates activity, notifies, emits, returns 201
- getAllTaskActivities: Filters by task, pagination, returns 200
- getTaskActivity: Validates org match, populates references, returns 200
- updateTaskActivity: Transaction, updates, notifies, emits, returns 200
- deleteTaskActivity: Transaction, cascades to comments/attachments, notifies, emits, returns 200
- restoreTaskActivity: Transaction, validates parent exists, restores, notifies, emits, returns 200
- createTaskComment: Transaction, validates parent, checks max depth 3, validates mentions, creates comment, notifies mentions, emits, returns 201
- getAllTaskComments: Filters by parent, pagination, returns 200
- getTaskComment: Validates org match, populates references, returns 200
- updateTaskComment: Transaction, updates, notifies, emits, returns 200
- deleteTaskComment: Transaction, cascades to child comments (recursive), notifies, emits, returns 200
- restoreTaskComment: Transaction, validates parent exists, restores, notifies, emits, returns 200

**materialControllers.js (6 functions):**

- createMaterial: Transaction, creates material, notifies HODs, emits, returns 201
- getAllMaterials: Filters by org/dept, category, pagination, search, deleted param, returns 200
- getMaterial: Validates org match, includes usage stats, returns 200
- updateMaterial: Transaction, updates, notifies, emits, returns 200
- deleteMaterial: Transaction, checks for linked tasks/activities, requires unlinking, soft deletes, notifies, emits, returns 200
- restoreMaterial: Transaction, restores, notifies, emits, returns 200

**vendorControllers.js (6 functions):**

- createVendor: Transaction, creates vendor, notifies HODs, emits, returns 201
- getAllVendors: Filters by org/dept, pagination, search, deleted param, returns 200
- getVendor: Validates org match, includes linked ProjectTasks, returns 200
- updateVendor: Transaction, updates, notifies, emits, returns 200
- deleteVendor: Transaction, checks for linked ProjectTasks, requires reassignment, soft deletes, notifies, emits, returns 200
- restoreVendor: Transaction, restores, notifies, emits, returns 200

**attachmentControllers.js (5 functions):**

- createAttachment: Transaction, validates parent, validates file type/size, uploads to Cloudinary, creates attachment, notifies, emits, returns 201
- getAllAttachments: Filters by org/parent, pagination, file type filter, deleted param, returns 200
- getAttachment: Validates org match, returns 200
- updateAttachment: Transaction, updates metadata only (not file), notifies, emits, returns 200
- deleteAttachment: Transaction, deletes from Cloudinary, soft deletes record, notifies, emits, returns 200

**notificationControllers.js (3 functions):**

- getAllNotifications: Filters by recipient, read status, pagination, returns 200
- markNotificationRead: Updates isRead, returns 200
- getUnreadCount: Counts unread notifications for user, returns 200

#### Critical Implementation Workflow [1 - 8]

1. **Branch Creation**

   ```bash
   git checkout -b validate/phase-5-backend-controllers
   ```

2. **Search & Read Files**

   - Use `grepSearch` to locate all controller files
   - Use `readFile` to read each file completely
   - Refer to `docs/phase5-controllers-detailed.md` for detailed validation instructions

3. **Analysis for Each File**

   For EACH controller file, validate against the UNIVERSAL CONTROLLER PATTERNS (A-Q) listed above, plus the controller-specific validation points.

   **For `backend/controllers/authControllers.js`:**

   - **Logic to Extract**:
     - registerOrganization: Creates org, dept, user in transaction
     - loginUser: Authenticates user, sets HTTP-only cookies
     - logoutUser: Clears authentication cookies
     - getRefreshToken: Token rotation
     - forgotPassword: Password reset token generation
     - resetPassword: Password reset with token verification
   - **Validation Checks**:
     - ✅ registerOrganization uses transaction
     - ✅ loginUser uses comparePassword() method
     - ✅ loginUser sets HTTP-only cookies (not localStorage)
     - ✅ getRefreshToken rotates both tokens
     - ✅ forgotPassword hashes token before saving
     - ✅ forgotPassword ALWAYS returns success (email enumeration prevention)
     - ✅ resetPassword hashes token for comparison
     - ✅ resetPassword clears reset fields after success
   - **Common Issues**:
     - ❌ Tokens in response body instead of cookies
     - ❌ Not hashing password reset token
     - ❌ Revealing if email exists in forgotPassword
     - ❌ Not using transaction for registration
   - **Tests Required**:
     - Unit test: Each controller function
     - Unit test: Token generation and verification
     - Unit test: Cookie settings
     - Integration test: Full auth flow

   **For `backend/controllers/userControllers.js`:**

   - **Logic to Extract**:
     - createUser: Creates user with auto-set isHod/isPlatformUser
     - getAllUsers: Filters by org/dept based on role
     - getUser: Validates org match
     - updateUserBy: Admin updates user
     - updateMyProfile: User updates own profile
     - getMyAccount: Gets own account
     - deleteUser: Soft delete with cascade
     - restoreUser: Restore soft-deleted user
   - **Validation Checks**:
     - ✅ createUser uses transaction
     - ✅ isHod auto-set from role (SuperAdmin/Admin = true)
     - ✅ isPlatformUser auto-set from organization
     - ✅ getAllUsers filters by org for non-platform users
     - ✅ getAllUsers filters by dept for Manager/User
     - ✅ updateMyProfile cannot change role or department
     - ✅ deleteUser checks not last SuperAdmin in org
     - ✅ deleteUser checks not last HOD in department
     - ✅ deleteUser removes from task watchers/assignees
   - **Common Issues**:
     - ❌ Manually setting isHod or isPlatformUser
     - ❌ Not filtering by org/dept
     - ❌ Allowing role change in updateMyProfile
     - ❌ Not checking last SuperAdmin/HOD
   - **Tests Required**:
     - Unit test: Each controller function
     - Unit test: isHod/isPlatformUser auto-set
     - Unit test: Role-based filtering
     - Integration test: Full user CRUD flow

   **For `backend/controllers/organizationControllers.js`:**

   - **Logic to Extract**:
     - getAllOrganizations: Platform sees all, customer sees own
     - getOrganizationDashboard: Stats calculation
     - updateOrganization: Cannot change isPlatformOrg
     - deleteOrganization: Platform only, cascade delete
     - restoreOrganization: Platform only
   - **Validation Checks**:
     - ✅ getAllOrganizations checks isPlatformUser for crossOrg
     - ✅ updateOrganization blocks isPlatformOrg change
     - ✅ deleteOrganization blocks platform org deletion
     - ✅ deleteOrganization cascades to all children
     - ✅ Only platform users can delete/restore organizations
   - **Common Issues**:
     - ❌ Customer users can see other orgs
     - ❌ Allowing isPlatformOrg change
     - ❌ Allowing platform org deletion
     - ❌ Not cascading to children
   - **Tests Required**:
     - Unit test: Each controller function
     - Unit test: Platform vs customer access
     - Unit test: Cascade operations
     - Integration test: Full org CRUD flow

   **For `backend/controllers/departmentControllers.js`:**

   - **Logic to Extract**:
     - createDepartment: Checks name uniqueness in org
     - getAllDepartments: Filters by org
     - getDepartment: Validates org match
     - updateDepartment: Checks name uniqueness
     - deleteDepartment: Cascade delete
     - restoreDepartment: Validates org exists
   - **Validation Checks**:
     - ✅ createDepartment checks name uniqueness within org
     - ✅ deleteDepartment checks not last department
     - ✅ deleteDepartment cascades to users, tasks, materials
     - ✅ restoreDepartment validates org still exists
   - **Common Issues**:
     - ❌ Not checking name uniqueness
     - ❌ Not checking last department
     - ❌ Not cascading to children
   - **Tests Required**:
     - Unit test: Each controller function
     - Unit test: Name uniqueness
     - Unit test: Cascade operations
     - Integration test: Full dept CRUD flow

   **For `backend/controllers/taskControllers.js`:**

   - **Logic to Extract**:
     - createTask: Validates task type, vendor/assignees/materials
     - getAllTasks: Filters by org/dept, task type, status, priority
     - getTask: Populates all references
     - updateTask: Validates task type restrictions
     - deleteTask: Cascade delete
     - restoreTask: Validates references exist
     - createTaskActivity: Validates parent is NOT RoutineTask
     - createTaskComment: Checks max depth 3
   - **Validation Checks**:
     - ✅ createTask validates task type (ProjectTask/RoutineTask/AssignedTask)
     - ✅ ProjectTask requires vendor
     - ✅ RoutineTask cannot be "To Do" status
     - ✅ RoutineTask cannot be "Low" priority
     - ✅ AssignedTask requires assignees
     - ✅ Watchers must be HOD users only
     - ✅ createTaskActivity throws error for RoutineTask parent
     - ✅ createTaskComment checks max depth 3
   - **Common Issues**:
     - ❌ Allowing "To Do" for RoutineTask
     - ❌ Allowing "Low" priority for RoutineTask
     - ❌ Allowing non-HOD watchers
     - ❌ Allowing TaskActivity for RoutineTask
     - ❌ Not checking comment depth
   - **Tests Required**:
     - Unit test: Each controller function
     - Unit test: Task type restrictions
     - Unit test: Watcher HOD validation
     - Unit test: Comment depth validation
     - Integration test: Full task CRUD flow

   **For `backend/controllers/materialControllers.js`:**

   - **Logic to Extract**:
     - createMaterial: Creates with org/dept references
     - getAllMaterials: Filters by org/dept, category
     - getMaterial: Includes usage stats
     - updateMaterial: Updates fields
     - deleteMaterial: Checks linked tasks/activities
     - restoreMaterial: Restores material
   - **Validation Checks**:
     - ✅ deleteMaterial checks for linked tasks (RoutineTask materials)
     - ✅ deleteMaterial checks for linked activities (TaskActivity materials)
     - ✅ deleteMaterial requires unlinking before deletion
   - **Common Issues**:
     - ❌ Not checking linked resources before deletion
   - **Tests Required**:
     - Unit test: Each controller function
     - Unit test: Linked resource checks
     - Integration test: Full material CRUD flow

   **For `backend/controllers/vendorControllers.js`:**

   - **Logic to Extract**:
     - createVendor: Creates with org/dept references
     - getAllVendors: Filters by org/dept
     - getVendor: Includes linked ProjectTasks
     - updateVendor: Updates fields
     - deleteVendor: Checks linked ProjectTasks
     - restoreVendor: Restores vendor
   - **Validation Checks**:
     - ✅ deleteVendor checks for linked ProjectTasks
     - ✅ deleteVendor requires reassignment before deletion
   - **Common Issues**:
     - ❌ Not checking linked ProjectTasks before deletion
   - **Tests Required**:
     - Unit test: Each controller function
     - Unit test: Linked ProjectTask checks
     - Integration test: Full vendor CRUD flow

   **For `backend/controllers/attachmentControllers.js`:**

   - **Logic to Extract**:
     - createAttachment: Validates parent, file type/size, uploads to Cloudinary
     - getAllAttachments: Filters by org/parent
     - getAttachment: Validates org match
     - updateAttachment: Updates metadata only
     - deleteAttachment: Deletes from Cloudinary
   - **Validation Checks**:
     - ✅ createAttachment validates file type (Image, Video, Document, Audio, Other)
     - ✅ createAttachment validates file size limits
     - ✅ createAttachment checks max 10 attachments per parent
     - ✅ deleteAttachment removes from Cloudinary
   - **Common Issues**:
     - ❌ Not validating file type/size
     - ❌ Not checking max attachments
     - ❌ Not deleting from Cloudinary
   - **Tests Required**:
     - Unit test: Each controller function
     - Unit test: File validation
     - Integration test: Full attachment CRUD flow

   **For `backend/controllers/notificationControllers.js`:**

   - **Logic to Extract**:
     - getAllNotifications: Filters by recipient, read status
     - markNotificationRead: Updates isRead
     - getUnreadCount: Counts unread
   - **Validation Checks**:
     - ✅ getAllNotifications filters by recipient (user can only see own)
     - ✅ markNotificationRead validates ownership
   - **Common Issues**:
     - ❌ User can see other users' notifications
   - **Tests Required**:
     - Unit test: Each controller function
     - Unit test: Ownership validation
     - Integration test: Full notification flow

4. **Action: Validate, Correct, Update, Enhance, Complete**

   For EACH file identified with issues:

   **Step 1: Document Issues**

   ```markdown
   ## Issues Found in [filename]

   ### Critical Issues

   - **WHAT**: [Description of issue]
   - **WHY**: [Impact on system]
   - **HOW**: [Solution approach]
   - **CODE**: [Complete corrected code]

   ### High Priority Issues

   [Same format]

   ### Medium Priority Issues

   [Same format]

   ### Low Priority Issues

   [Same format]
   ```

   **Step 2: Implement Corrections**

   - Use `strReplace` for targeted fixes
   - Use `fsWrite` for complete file rewrites if needed
   - Ensure all fixes are complete and working
   - Follow exact specifications from build-prompt.md and phase5-controllers-detailed.md

   **Step 3: Add/Update Tests**

   - Create test files in `backend/tests/unit/controllers/`
   - Use Jest with ES modules configuration
   - Test all edge cases and error scenarios
   - Ensure 80%+ coverage for each file

5. **Test: Run All Tests**

   ```bash
   cd backend
   npm test -- --runInBand backend/tests/unit/controllers/
   npm test -- --runInBand backend/tests/integration/controllers/
   ```

   **Validation Criteria**:

   - ✅ 100% of tests pass
   - ✅ 80%+ code coverage
   - ✅ No lint errors
   - ✅ No console.log statements in production code
   - ✅ All imports use ES modules syntax
   - ✅ All constants imported from utils/constants.js

6. **Validate: Final Checks**

   - All controllers use asyncHandler
   - All write operations use transactions
   - All list operations use pagination
   - All delete operations are soft delete
   - All cascade operations work
   - All socket events emitted
   - All notifications created
   - Multi-tenancy enforced
   - Department isolation enforced
   - Ownership checks present
   - Task type restrictions enforced
   - HOD watcher validation enforced

7. **Update Phase Tracker**
   Update `docs/dev-phase-tracker.md`:

   ```markdown
   ## Phase 5: Backend Controllers ✅

   - [x] All 9 controllers validated and corrected
   - [x] All 59 functions validated
   - [x] Transaction handling corrected
   - [x] Cascade operations validated
   - [x] Socket events validated
   - [x] Notifications validated
   - [x] Tests added and passing (100%)
   - [x] Coverage achieved (80%+)
   ```

8. **Merge: Complete Phase 5**

   ```bash
   git add .
   git commit -m "Phase 5: Validate and correct backend controllers

   - Validated all 9 controller files (59 functions total)
   - Corrected transaction handling
   - Enhanced cascade operations
   - Completed missing notifications
   - Added comprehensive controller tests
   - Achieved 80%+ test coverage"

   git checkout main
   git merge validate/phase-5-backend-controllers
   git push origin main
   git branch -d validate/phase-5-backend-controllers
   ```

---

### Phase 6: Backend Routes & Integration Validation

**Branch**: `validate/phase-6-backend-routes`

#### BEFORE STARTING ANY CODE - GIT STATUS CHECK

```bash
# Check current branch
git branch --show-current

# Check if branch exists locally
git branch --list validate/phase-6-backend-routes

# Check if branch exists remotely
git ls-remote --heads origin validate/phase-6-backend-routes

# Get full git status
git status --porcelain

# Get diff of current branch vs main
git diff main...HEAD

# Check for uncommitted changes
git diff --stat

# If branch exists remotely, pull latest changes
git pull origin validate/phase-6-backend-routes

# If branch doesn't exist, create it from main
git checkout main
git pull origin main
git checkout -b validate/phase-6-backend-routes
```
**CRITICAL INSTRUCTION**: While this phase focuses on Backend Routes & Integration, you must ALSO validate that:
- All controllers in `backend/controllers/` are correctly mapped to routes
- All middleware in `backend/middlewares/` is correctly applied in routes
- All validators in `backend/middlewares/validators/` are correctly chained
- All routes properly handle authentication and authorization
- Route aggregation correctly includes all endpoints

#### Files to Validate (10 files)

- `backend/routes/authRoutes.js`
- `backend/routes/userRoutes.js`
- `backend/routes/organizationRoutes.js`
- `backend/routes/departmentRoutes.js`
- `backend/routes/taskRoutes.js`
- `backend/routes/materialRoutes.js`
- `backend/routes/vendorRoutes.js`
- `backend/routes/attachmentRoutes.js`
- `backend/routes/notificationRoutes.js`
- `backend/routes/index.js`

#### MANDATORY: Cross Validation Scope

For this phase, cross validation MUST search for all occurrences of route logic across:

```
backend/config/*
backend/controllers/*
backend/errorHandler/*
backend/middlewares/*
backend/middlewares/validators/*
backend/mock/*
backend/models/*
backend/models/plugins/*
backend/routes/*
backend/scripts/*
backend/services/*
backend/templates/*
backend/utils/*
backend/.env
backend/app.js
backend/server.js
```

#### MANDATORY: Super Deep Analysis

Before ANY code changes, perform super deep analysis using:

- `docs/validate-correct-update-enhance-complete.md`
- `docs/phase5-controllers-detailed.md`
- `docs/build-prompt.md`
- `docs/dev-phase-tracker.md`

Against: `backend/*` and `client/*`

#### MANDATORY: Task/Sub-Task Rule

- This phase is a TASK with multiple SUB-TASKS
- ALL sub-tasks MUST be started and completed TOGETHER
- It is STRICTLY FORBIDDEN to start a sub-task on its own

#### MANDATORY: Testing Rules

- Use Real MongoDB test database (NOT mongodb-memory-server)
- NEVER skip a test, no matter how long it takes
- NEVER skip a failed test - fix it
- At phase end: run `npm test` - ALL tests MUST pass

#### Critical Implementation Workflow [1 - 8]

1. **Branch Creation**

   ```bash
   git checkout -b validate/phase-6-backend-routes
   ```

2. **Search & Read Files**

   - Use `grepSearch` to locate all route files
   - Use `readFile` to read each file completely
   - **Cross validate** across ALL directories listed in Cross Validation Scope

3. **Analysis for Each File**

   **For `backend/routes/authRoutes.js`:**

   - **Logic to Extract**:
     - Public routes: register, login, forgot-password, reset-password
     - Protected routes: logout, refresh-token
     - Rate limiting on all auth endpoints
   - **Validation Checks**:
     - ✅ POST /register - public, rate limited (5/15min)
     - ✅ POST /login - public, rate limited (5/15min)
     - ✅ POST /forgot-password - public, rate limited (5/15min)
     - ✅ POST /reset-password - public, rate limited (5/15min)
     - ✅ DELETE /logout - protected (verifyRefreshToken), rate limited (5/15min)
     - ✅ GET /refresh-token - protected (verifyRefreshToken), rate limited (5/15min)
     - ✅ Middleware chain: validators → controller (public) or validators → auth → controller (protected)
   - **Common Issues**:
     - ❌ Missing rate limiting on auth routes
     - ❌ Logout/refresh not protected
     - ❌ Wrong middleware order
   - **Tests Required**:
     - Integration test: Each route accessible
     - Integration test: Rate limiting works
     - Integration test: Protected routes require auth

   **For `backend/routes/userRoutes.js`:**

   - **Logic to Extract**:
     - All routes protected
     - CRUD operations with authorization
     - Profile routes for self-management
   - **Validation Checks**:
     - ✅ POST / - protected, authorize(User, create)
     - ✅ GET / - protected, authorize(User, read)
     - ✅ GET /:userId - protected, authorize(User, read)
     - ✅ PUT /:userId - protected, authorize(User, update)
     - ✅ PUT /:userId/profile - protected, authorize(User, update) with ownership check
     - ✅ GET /:userId/account - protected, authorize(User, read) with ownership check
     - ✅ DELETE /:userId - protected, authorize(User, delete)
     - ✅ PATCH /:userId/restore - protected, authorize(User, update)
     - ✅ Middleware chain: validators → verifyJWT → authorize → controller
   - **Common Issues**:
     - ❌ Missing authorization middleware
     - ❌ Wrong middleware order
     - ❌ Missing validators
   - **Tests Required**:
     - Integration test: Each route with valid auth
     - Integration test: Authorization enforced
     - Integration test: Validators work

   **For `backend/routes/organizationRoutes.js`:**

   - **Logic to Extract**:
     - All routes protected
     - Platform SuperAdmin has crossOrg access
   - **Validation Checks**:
     - ✅ GET / - protected, authorize(Organization, read)
     - ✅ GET /:resourceId - protected, authorize(Organization, read)
     - ✅ GET /:resourceId/dashboard - protected, authorize(Organization, read)
     - ✅ PUT /:resourceId - protected, authorize(Organization, update)
     - ✅ DELETE /:resourceId - protected, authorize(Organization, delete)
     - ✅ PATCH /:resourceId/restore - protected, authorize(Organization, update)
     - ✅ Middleware chain: validators → verifyJWT → authorize → controller
   - **Common Issues**:
     - ❌ Missing authorization middleware
     - ❌ Not checking platform user for crossOrg
   - **Tests Required**:
     - Integration test: Platform user access
     - Integration test: Customer user restricted

   **For `backend/routes/departmentRoutes.js`:**

   - **Logic to Extract**:
     - All routes protected
     - CRUD operations with authorization
   - **Validation Checks**:
     - ✅ POST / - protected, authorize(Department, create)
     - ✅ GET / - protected, authorize(Department, read)
     - ✅ GET /:resourceId - protected, authorize(Department, read)
     - ✅ PUT /:resourceId - protected, authorize(Department, update)
     - ✅ DELETE /:resourceId - protected, authorize(Department, delete)
     - ✅ PATCH /:resourceId/restore - protected, authorize(Department, update)
     - ✅ Middleware chain: validators → verifyJWT → authorize → controller
   - **Common Issues**:
     - ❌ Missing authorization middleware
     - ❌ Wrong middleware order
   - **Tests Required**:
     - Integration test: Each route with valid auth
     - Integration test: Authorization enforced

   **For `backend/routes/taskRoutes.js`:**

   - **Logic to Extract**:
     - All routes protected
     - Task CRUD with nested activity and comment routes
   - **Validation Checks**:
     - ✅ POST / - protected, authorize(Task, create)
     - ✅ GET / - protected, authorize(Task, read)
     - ✅ GET /:resourceId - protected, authorize(Task, read)
     - ✅ PUT /:resourceId - protected, authorize(Task, update)
     - ✅ DELETE /:resourceId - protected, authorize(Task, delete)
     - ✅ PATCH /:resourceId/restore - protected, authorize(Task, update)
     - ✅ POST /:taskId/activities - protected, authorize(Task, update)
     - ✅ GET /:taskId/activities - protected, authorize(Task, read)
     - ✅ POST /:taskId/comments - protected, authorize(Task, update)
     - ✅ GET /:taskId/comments - protected, authorize(Task, read)
     - ✅ Middleware chain: validators → verifyJWT → authorize → controller
   - **Common Issues**:
     - ❌ Missing nested routes for activities/comments
     - ❌ Wrong authorization for nested routes
   - **Tests Required**:
     - Integration test: Task CRUD
     - Integration test: Activity CRUD
     - Integration test: Comment CRUD

   **For `backend/routes/materialRoutes.js`:**

   - **Logic to Extract**:
     - All routes protected
     - CRUD operations with authorization
   - **Validation Checks**:
     - ✅ POST / - protected, authorize(Material, create)
     - ✅ GET / - protected, authorize(Material, read)
     - ✅ GET /:resourceId - protected, authorize(Material, read)
     - ✅ PUT /:resourceId - protected, authorize(Material, update)
     - ✅ DELETE /:resourceId - protected, authorize(Material, delete)
     - ✅ PATCH /:resourceId/restore - protected, authorize(Material, update)
     - ✅ Middleware chain: validators → verifyJWT → authorize → controller
   - **Common Issues**:
     - ❌ Missing authorization middleware
   - **Tests Required**:
     - Integration test: Each route with valid auth

   **For `backend/routes/vendorRoutes.js`:**

   - **Logic to Extract**:
     - All routes protected
     - CRUD operations with authorization
   - **Validation Checks**:
     - ✅ POST / - protected, authorize(Vendor, create)
     - ✅ GET / - protected, authorize(Vendor, read)
     - ✅ GET /:resourceId - protected, authorize(Vendor, read)
     - ✅ PUT /:resourceId - protected, authorize(Vendor, update)
     - ✅ DELETE /:resourceId - protected, authorize(Vendor, delete)
     - ✅ PATCH /:resourceId/restore - protected, authorize(Vendor, update)
     - ✅ Middleware chain: validators → verifyJWT → authorize → controller
   - **Common Issues**:
     - ❌ Missing authorization middleware
   - **Tests Required**:
     - Integration test: Each route with valid auth

   **For `backend/routes/attachmentRoutes.js`:**

   - **Logic to Extract**:
     - All routes protected
     - File upload handling
   - **Validation Checks**:
     - ✅ POST / - protected, authorize(Attachment, create)
     - ✅ GET / - protected, authorize(Attachment, read)
     - ✅ GET /:resourceId - protected, authorize(Attachment, read)
     - ✅ DELETE /:resourceId - protected, authorize(Attachment, delete)
     - ✅ Middleware chain: validators → verifyJWT → authorize → controller
   - **Common Issues**:
     - ❌ Missing file upload middleware
   - **Tests Required**:
     - Integration test: File upload
     - Integration test: File retrieval

   **For `backend/routes/notificationRoutes.js`:**

   - **Logic to Extract**:
     - All routes protected
     - User can only access own notifications
   - **Validation Checks**:
     - ✅ GET / - protected, authorize(Notification, read)
     - ✅ GET /:resourceId - protected, authorize(Notification, read)
     - ✅ PATCH /:resourceId/read - protected, authorize(Notification, update)
     - ✅ PATCH /read-all - protected, authorize(Notification, update)
     - ✅ DELETE /:resourceId - protected, authorize(Notification, delete)
     - ✅ Middleware chain: validators → verifyJWT → authorize → controller
   - **Common Issues**:
     - ❌ User can access other users' notifications
   - **Tests Required**:
     - Integration test: Own notifications only

   **For `backend/routes/index.js`:**

   - **Logic to Extract**:
     - Route aggregation
     - All routes mounted at /api
   - **Validation Checks**:
     - ✅ Imports all route files
     - ✅ Mounts authRoutes at /api/auth
     - ✅ Mounts userRoutes at /api/users
     - ✅ Mounts organizationRoutes at /api/organizations
     - ✅ Mounts departmentRoutes at /api/departments
     - ✅ Mounts taskRoutes at /api/tasks
     - ✅ Mounts materialRoutes at /api/materials
     - ✅ Mounts vendorRoutes at /api/vendors
     - ✅ Mounts attachmentRoutes at /api/attachments
     - ✅ Mounts notificationRoutes at /api/notifications
     - ✅ Exports router
   - **Common Issues**:
     - ❌ Missing route imports
     - ❌ Wrong mount paths
   - **Tests Required**:
     - Integration test: All routes accessible at correct paths

4. **Action: Validate, Correct, Update, Enhance, Complete**

   For EACH file identified with issues:

   **Step 1: Document Issues**

   ```markdown
   ## Issues Found in [filename]

   ### Critical Issues

   - **WHAT**: [Description of issue]
   - **WHY**: [Impact on system]
   - **HOW**: [Solution approach]
   - **CODE**: [Complete corrected code]

   ### High Priority Issues

   [Same format]

   ### Medium Priority Issues

   [Same format]

   ### Low Priority Issues

   [Same format]
   ```

   **Step 2: Implement Corrections**

   - Use `strReplace` for targeted fixes
   - Use `fsWrite` for complete file rewrites if needed
   - Ensure all fixes are complete and working
   - Follow exact specifications from build-prompt.md

   **Step 3: Add/Update Tests**

   - Create test files in `backend/tests/integration/routes/`
   - Use Jest with ES modules configuration
   - Test all edge cases and error scenarios
   - Ensure 80%+ coverage for each file

5. **Test: Run All Tests**

   ```bash
   cd backend
   npm test -- --runInBand backend/tests/integration/routes/
   ```

   **Validation Criteria**:

   - ✅ 100% of tests pass
   - ✅ 80%+ code coverage
   - ✅ No lint errors
   - ✅ No console.log statements in production code
   - ✅ All imports use ES modules syntax
   - ✅ All constants imported from utils/constants.js

6. **Validate: Final Checks**

   - Correct middleware chain: validators → auth → authorization → controller
   - Public routes: register, login, forgot-password, reset-password
   - Protected routes: all others
   - Rate limiting on auth routes (5/15min)
   - Rate limiting on general API (100/15min) in production
   - Route aggregation in index.js correct
   - All routes mounted at /api

7. **Update Phase Tracker**
   Update `docs/dev-phase-tracker.md`:

   ```markdown
   ## Phase 6: Backend Routes & Integration ✅

   - [x] All 10 route files validated and corrected
   - [x] Middleware chain order validated
   - [x] Public/protected routes validated
   - [x] Rate limiting validated
   - [x] Route aggregation validated
   - [x] Tests added and passing (100%)
   - [x] Coverage achieved (80%+)
   ```

8. **Merge: Complete Phase 6**

   ```bash
   git add .
   git commit -m "Phase 6: Validate and correct backend routes

   - Validated all 10 route files against specifications
   - Corrected middleware chain order
   - Enhanced rate limiting configuration
   - Completed route aggregation
   - Added comprehensive route tests
   - Achieved 80%+ test coverage"

   git checkout main
   git merge validate/phase-6-backend-routes
   git push origin main
   git branch -d validate/phase-6-backend-routes
   ```

---

### Phase 7: Frontend Core Infrastructure Validation

**Branch**: `validate/phase-7-frontend-core`

#### BEFORE STARTING ANY CODE - GIT STATUS CHECK

```bash
# Check current branch
git branch --show-current

# Check if branch exists locally
git branch --list validate/phase-7-frontend-core

# Check if branch exists remotely
git ls-remote --heads origin validate/phase-7-frontend-core

# Get full git status
git status --porcelain

# Get diff of current branch vs main
git diff main...HEAD

# Check for uncommitted changes
git diff --stat

# If branch exists remotely, pull latest changes
git pull origin validate/phase-7-frontend-core

# If branch doesn't exist, create it from main
git checkout main
git pull origin main
git checkout -b validate/phase-7-frontend-core
```

#### Files to Validate (15 files)

**Redux Infrastructure:**

- `client/src/redux/app/store.js`
- `client/src/redux/features/api.js`
- `client/src/redux/features/auth/authSlice.js`
- `client/src/redux/features/auth/authApi.js`

**Services:**

- `client/src/services/socketService.js`
- `client/src/services/socketEvents.js`

**Hooks:**

- `client/src/hooks/useAuth.js`
- `client/src/hooks/useSocket.js`

**Utilities:**

- `client/src/utils/constants.js`
- `client/src/utils/errorHandler.js`
- `client/src/utils/dateUtils.js`
- `client/src/utils/authorizationHelper.js`

**Theme:**

- `client/src/theme/AppTheme.jsx`
- `client/src/theme/themePrimitives.js`
- `client/src/theme/customizations/index.js`

#### MANDATORY: Cross Validation Scope

For this phase, cross validation MUST search for all occurrences of frontend core logic across:

```
client/src/redux/*
client/src/services/*
client/src/hooks/*
client/src/utils/*
client/src/theme/*
client/src/components/*
client/src/pages/*
client/src/layouts/*
client/src/router/*
client/.env
client/src/App.jsx
client/src/main.jsx
```

**Additionally, validate against backend for consistency:**

```
backend/config/*
backend/controllers/*
backend/errorHandler/*
backend/middlewares/*
backend/middlewares/validators/*
backend/mock/*
backend/models/*
backend/models/plugins/*
backend/routes/*
backend/scripts/*
backend/services/*
backend/templates/*
backend/utils/*
backend/.env
backend/app.js
backend/server.js
```

#### MANDATORY: Super Deep Analysis

Before ANY code changes, perform super deep analysis using:

- `docs/validate-correct-update-enhance-complete.md`
- `docs/phase5-controllers-detailed.md`
- `docs/build-prompt.md`
- `docs/dev-phase-tracker.md`

Against: `backend/*` and `client/*`

#### MANDATORY: Task/Sub-Task Rule

- This phase is a TASK with multiple SUB-TASKS
- ALL sub-tasks MUST be started and completed TOGETHER
- It is STRICTLY FORBIDDEN to start a sub-task on its own

#### MANDATORY: Testing Rules

- Use Real MongoDB test database (NOT mongodb-memory-server)
- NEVER skip a test, no matter how long it takes
- NEVER skip a failed test - fix it
- At phase end: run `npm test` - ALL tests MUST pass

#### Critical Implementation Workflow [1 - 8]

1. **Branch Creation**

   ```bash
   git checkout -b validate/phase-7-frontend-core
   ```

2. **Search & Read Files**

   - Use `grepSearch` to locate all frontend core files
   - Use `readFile` to read each file completely
   - **Cross validate** across ALL directories listed in Cross Validation Scope

3. **Analysis for Each File**

   **For `client/src/redux/app/store.js`:**

   - **Logic to Extract**:
     - Redux store configuration
     - Persistence for auth state
     - RTK Query middleware
   - **Validation Checks**:
     - ✅ Uses configureStore from @reduxjs/toolkit
     - ✅ Includes api.reducer for RTK Query
     - ✅ Includes authSlice reducer
     - ✅ Adds api.middleware to middleware chain
     - ✅ Persistence configured for auth state (redux-persist)
     - ✅ Exports store and persistor
   - **Common Issues**:
     - ❌ Missing RTK Query middleware
     - ❌ No persistence for auth state
     - ❌ Wrong reducer structure
   - **Tests Required**:
     - Unit test: Store configuration
     - Unit test: Persistence works

   **For `client/src/redux/features/api.js`:**

   - **Logic to Extract**:
     - RTK Query base API configuration
     - Base URL from environment
     - Credentials for cookies
     - Token refresh on 401
   - **Validation Checks**:
     - ✅ Uses createApi from @reduxjs/toolkit/query/react
     - ✅ baseUrl from import.meta.env.VITE_API_URL
     - ✅ credentials: 'include' for HTTP-only cookies
     - ✅ baseQueryWithReauth handles 401 errors
     - ✅ On 401: calls refresh-token endpoint
     - ✅ On refresh success: retries original request
     - ✅ On refresh failure: logs out user
     - ✅ Exports api for injectEndpoints
   - **Common Issues**:
     - ❌ Missing credentials: 'include'
     - ❌ No token refresh on 401
     - ❌ Not retrying original request after refresh
   - **Tests Required**:
     - Unit test: Base query configuration
     - Unit test: 401 handling
     - Integration test: Token refresh flow

   **For `client/src/redux/features/auth/authSlice.js`:**

   - **Logic to Extract**:
     - Auth state management
     - User data storage
     - Login/logout actions
   - **Validation Checks**:
     - ✅ Initial state: { user: null, isAuthenticated: false }
     - ✅ setCredentials reducer: sets user and isAuthenticated
     - ✅ logout reducer: clears user and isAuthenticated
     - ✅ Selectors: selectCurrentUser, selectIsAuthenticated
     - ✅ Exports actions and selectors
   - **Common Issues**:
     - ❌ Missing selectors
     - ❌ Wrong initial state
   - **Tests Required**:
     - Unit test: Each reducer
     - Unit test: Selectors

   **For `client/src/redux/features/auth/authApi.js`:**

   - **Logic to Extract**:
     - Auth API endpoints
     - Login, logout, register, refresh, password reset
   - **Validation Checks**:
     - ✅ Uses api.injectEndpoints
     - ✅ login mutation: POST /auth/login
     - ✅ logout mutation: DELETE /auth/logout
     - ✅ register mutation: POST /auth/register
     - ✅ refreshToken query: GET /auth/refresh-token
     - ✅ forgotPassword mutation: POST /auth/forgot-password
     - ✅ resetPassword mutation: POST /auth/reset-password
     - ✅ Proper tags for cache invalidation
   - **Common Issues**:
     - ❌ Wrong HTTP methods
     - ❌ Missing endpoints
   - **Tests Required**:
     - Unit test: Each endpoint configuration

   **For `client/src/services/socketService.js`:**

   - **Logic to Extract**:
     - Socket.IO client service
     - Connection management
     - Event handling
   - **Validation Checks**:
     - ✅ Uses socket.io-client
     - ✅ Connects to backend URL (without /api)
     - ✅ withCredentials: true for cookies
     - ✅ autoConnect: false (manual connection)
     - ✅ Reconnection settings configured
     - ✅ connect(), disconnect(), on(), off(), emit() methods
     - ✅ Singleton pattern (single instance)
   - **Common Issues**:
     - ❌ Missing withCredentials
     - ❌ Auto-connecting before auth
     - ❌ Multiple instances created
   - **Tests Required**:
     - Unit test: Connection management
     - Unit test: Event handling

   **For `client/src/services/socketEvents.js`:**

   - **Logic to Extract**:
     - Socket.IO event handlers
     - RTK Query cache invalidation
     - Toast notifications
   - **Validation Checks**:
     - ✅ setupSocketEventHandlers(socket) function
     - ✅ Handles task:created, task:updated, task:deleted, task:restored
     - ✅ Handles user:online, user:offline
     - ✅ Handles notification:created
     - ✅ Invalidates RTK Query cache on events
     - ✅ Shows toast notifications for relevant events
   - **Common Issues**:
     - ❌ Not invalidating cache
     - ❌ Missing event handlers
   - **Tests Required**:
     - Unit test: Each event handler
     - Unit test: Cache invalidation

   **For `client/src/hooks/useAuth.js`:**

   - **Logic to Extract**:
     - Authentication hook
     - User data access
     - Auth state access
   - **Validation Checks**:
     - ✅ Uses useSelector for auth state
     - ✅ Returns user, isAuthenticated
     - ✅ Returns role, organization, department from user
     - ✅ Returns isPlatformUser, isHod from user
   - **Common Issues**:
     - ❌ Missing user properties
   - **Tests Required**:
     - Unit test: Hook returns correct data

   **For `client/src/hooks/useSocket.js`:**

   - **Logic to Extract**:
     - Socket.IO hook
     - Connection on mount
     - Disconnection on unmount
   - **Validation Checks**:
     - ✅ Connects socket on mount
     - ✅ Disconnects socket on unmount
     - ✅ Returns on, off, emit functions
   - **Common Issues**:
     - ❌ Not disconnecting on unmount
   - **Tests Required**:
     - Unit test: Connection lifecycle

   **For `client/src/utils/constants.js`:**

   - **Logic to Extract**:
     - All frontend constants
     - Must EXACTLY match backend constants
   - **Validation Checks**:
     - ✅ USER_ROLES matches backend exactly
     - ✅ TASK_STATUS matches backend exactly
     - ✅ TASK_PRIORITY matches backend exactly
     - ✅ TASK_TYPES matches backend exactly
     - ✅ MATERIAL_CATEGORIES matches backend exactly
     - ✅ UNIT_TYPES matches backend exactly
     - ✅ INDUSTRIES matches backend exactly
     - ✅ PAGINATION matches backend exactly
     - ✅ LIMITS matches backend exactly
     - ✅ LENGTH_LIMITS matches backend exactly
     - ✅ FILE_SIZE_LIMITS matches backend exactly
     - ✅ FILE_TYPES matches backend exactly
     - ✅ NOTIFICATION_TYPES matches backend exactly
     - ✅ ATTACHMENT_TYPES matches backend exactly
   - **Common Issues**:
     - ❌ Values don't match backend
     - ❌ Missing constants
   - **Tests Required**:
     - Unit test: Compare with backend constants

   **For `client/src/utils/errorHandler.js`:**

   - **Logic to Extract**:
     - Error handling utilities
     - Error message extraction
     - Toast notification for errors
   - **Validation Checks**:
     - ✅ handleError(error) function
     - ✅ Extracts message from RTK Query errors
     - ✅ Extracts message from API errors
     - ✅ Shows toast notification
     - ✅ Returns user-friendly message
   - **Common Issues**:
     - ❌ Not handling all error types
   - **Tests Required**:
     - Unit test: Each error type

   **For `client/src/utils/dateUtils.js`:**

   - **Logic to Extract**:
     - Date utilities with dayjs
     - UTC conversion
     - Date formatting
   - **Validation Checks**:
     - ✅ Uses dayjs with utc plugin
     - ✅ Uses dayjs with timezone plugin
     - ✅ toUTC(date) function
     - ✅ fromUTC(date) function
     - ✅ formatDate(date, format) function
     - ✅ formatISO(date) function
     - ✅ isValidDate(date) function
   - **Common Issues**:
     - ❌ Not using UTC plugin
     - ❌ Missing conversion functions
   - **Tests Required**:
     - Unit test: Each utility function

   **For `client/src/utils/authorizationHelper.js`:**

   - **Logic to Extract**:
     - Authorization helper functions
     - Permission checking
     - Scope validation
   - **Validation Checks**:
     - ✅ canAccess(user, resource, operation) function
     - ✅ hasScope(user, resource, operation, scope) function
     - ✅ Uses authorization matrix logic
     - ✅ Handles platform user crossOrg for Organization
   - **Common Issues**:
     - ❌ Not matching backend authorization logic
   - **Tests Required**:
     - Unit test: Permission checking
     - Unit test: Scope validation

   **For `client/src/theme/AppTheme.jsx`:**

   - **Logic to Extract**:
     - Theme provider component
     - Light/dark mode support
     - MUI theme configuration
   - **Validation Checks**:
     - ✅ Uses ThemeProvider from @mui/material
     - ✅ Creates theme with createTheme
     - ✅ Supports light and dark mode
     - ✅ Applies customizations
     - ✅ Provides theme context
   - **Common Issues**:
     - ❌ No dark mode support
     - ❌ Missing customizations
   - **Tests Required**:
     - Unit test: Theme switching

   **For `client/src/theme/themePrimitives.js`:**

   - **Logic to Extract**:
     - Theme primitives
     - Colors, spacing, typography
   - **Validation Checks**:
     - ✅ Defines color palette
     - ✅ Defines spacing
     - ✅ Defines typography
     - ✅ Exports primitives for theme
   - **Common Issues**:
     - ❌ Missing primitives
   - **Tests Required**:
     - Unit test: Primitives defined

   **For `client/src/theme/customizations/index.js`:**

   - **Logic to Extract**:
     - MUI component customizations
     - MUI v7 specific customizations
   - **Validation Checks**:
     - ✅ Exports all customizations
     - ✅ MUI v7 compatible
     - ✅ Includes DataGrid customizations
     - ✅ Includes input customizations
     - ✅ Includes navigation customizations
   - **Common Issues**:
     - ❌ MUI v6 syntax instead of v7
   - **Tests Required**:
     - Unit test: Customizations apply correctly

4. **Action: Validate, Correct, Update, Enhance, Complete**

   For EACH file identified with issues:

   **Step 1: Document Issues**

   ```markdown
   ## Issues Found in [filename]

   ### Critical Issues

   - **WHAT**: [Description of issue]
   - **WHY**: [Impact on system]
   - **HOW**: [Solution approach]
   - **CODE**: [Complete corrected code]

   ### High Priority Issues

   [Same format]

   ### Medium Priority Issues

   [Same format]

   ### Low Priority Issues

   [Same format]
   ```

   **Step 2: Implement Corrections**

   - Use `strReplace` for targeted fixes
   - Use `fsWrite` for complete file rewrites if needed
   - Ensure all fixes are complete and working
   - Follow exact specifications from build-prompt.md

   **Step 3: Add/Update Tests**

   - Create test files in `client/src/__tests__/`
   - Use Jest/Vitest with React Testing Library
   - Test all edge cases and error scenarios
   - Ensure 80%+ coverage for each file

5. **Test: Run All Tests**

   ```bash
   cd client
   npm test
   npm run lint
   ```

   **Validation Criteria**:

   - ✅ 100% of tests pass
   - ✅ No lint errors
   - ✅ No console.log statements in production code
   - ✅ All imports use ES modules syntax
   - ✅ All constants match backend exactly

6. **Validate: Final Checks**

   - Redux store with persistence for auth
   - RTK Query base API with credentials
   - Token refresh on 401 with automatic retry
   - Socket.IO connects on authentication
   - Socket rooms: user, department, organization
   - Socket event handlers invalidate RTK Query cache
   - Constants EXACTLY match backend constants
   - Error handler for consistent error display
   - Date utils use dayjs with UTC
   - Authorization helper checks user permissions
   - Theme supports light/dark mode
   - MUI v7 customizations correct

7. **Update Phase Tracker**
   Update `docs/dev-phase-tracker.md`:

   ```markdown
   ## Phase 7: Frontend Core Infrastructure ✅

   - [x] Redux store validated and corrected
   - [x] RTK Query base API validated and corrected
   - [x] Socket.IO service validated and corrected
   - [x] Hooks validated and corrected
   - [x] Utils validated and corrected
   - [x] Theme validated and corrected
   - [x] Constants match backend exactly
   - [x] No lint errors
   ```

8. **Merge: Complete Phase 7**

   ```bash
   git add .
   git commit -m "Phase 7: Validate and correct frontend core infrastructure

   - Validated all 15 core frontend files against specifications
   - Corrected RTK Query token refresh logic
   - Enhanced Socket.IO cache invalidation
   - Completed constants to match backend exactly
   - Added comprehensive frontend tests
   - No lint errors"

   git checkout main
   git merge validate/phase-7-frontend-core
   git push origin main
   git branch -d validate/phase-7-frontend-core
   ```

---

### Phase 8: Frontend Features Validation

**Branch**: `validate/phase-8-frontend-features`

#### BEFORE STARTING ANY CODE - GIT STATUS CHECK

```bash
git branch
git branch -r
git status
git diff
git log --oneline -10
```

#### Files to Validate (18 files)

**User Feature:**

- `client/src/redux/features/user/userApi.js`
- `client/src/redux/features/user/userSlice.js`

**Organization Feature:**

- `client/src/redux/features/organization/organizationApi.js`
- `client/src/redux/features/organization/organizationSlice.js`

**Department Feature:**

- `client/src/redux/features/department/departmentApi.js`
- `client/src/redux/features/department/departmentSlice.js`

**Task Feature:**

- `client/src/redux/features/task/taskApi.js`
- `client/src/redux/features/task/taskSlice.js`

**Material Feature:**

- `client/src/redux/features/material/materialApi.js`
- `client/src/redux/features/material/materialSlice.js`

**Vendor Feature:**

- `client/src/redux/features/vendor/vendorApi.js`
- `client/src/redux/features/vendor/vendorSlice.js`

**Attachment Feature:**

- `client/src/redux/features/attachment/attachmentApi.js`

**Notification Feature:**

- `client/src/redux/features/notification/notificationApi.js`
- `client/src/redux/features/notification/notificationSlice.js`

#### Key Validation Points

**RTK Query APIs:**

- ✅ Use injectEndpoints pattern
- ✅ Pagination conversion: frontend 0-based → backend 1-based
- ✅ Proper tags for cache invalidation
- ✅ Credentials included in all requests
- ✅ Query parameters match backend expectations

**Slices:**

- ✅ Initial state correct
- ✅ Reducers handle all actions
- ✅ Selectors exported

#### MANDATORY: Cross Validation Scope

For this phase, cross validation MUST search for all occurrences of frontend feature logic across:

```
client/src/redux/*
client/src/services/*
client/src/hooks/*
client/src/utils/*
client/src/theme/*
client/src/components/*
client/src/pages/*
client/src/layouts/*
client/src/router/*
client/.env
client/src/App.jsx
client/src/main.jsx
```

**Additionally, validate against backend for consistency:**

```
backend/config/*
backend/controllers/*
backend/errorHandler/*
backend/middlewares/*
backend/middlewares/validators/*
backend/mock/*
backend/models/*
backend/models/plugins/*
backend/routes/*
backend/scripts/*
backend/services/*
backend/templates/*
backend/utils/*
backend/.env
backend/app.js
backend/server.js
```

#### MANDATORY: Super Deep Analysis

Before ANY code changes, perform super deep analysis using:

- `docs/validate-correct-update-enhance-complete.md`
- `docs/phase5-controllers-detailed.md`
- `docs/build-prompt.md`
- `docs/dev-phase-tracker.md`

Against: `backend/*` and `client/*`

#### MANDATORY: Task/Sub-Task Rule

- This phase is a TASK with multiple SUB-TASKS
- ALL sub-tasks MUST be started and completed TOGETHER
- It is STRICTLY FORBIDDEN to start a sub-task on its own

#### MANDATORY: Testing Rules

- Use Real MongoDB test database (NOT mongodb-memory-server)
- NEVER skip a test, no matter how long it takes
- NEVER skip a failed test - fix it
- At phase end: run `npm test` - ALL tests MUST pass

#### Critical Implementation Workflow [1 - 8]

1. **Branch Creation**

   ```bash
   git checkout -b validate/phase-8-frontend-features
   ```

2. **Search & Read Files**

   - Use `grepSearch` to locate all frontend feature files
   - Use `readFile` to read each file completely
   - **Cross validate** across ALL directories listed in Cross Validation Scope

3. **Analysis for Each File**

   For EACH feature API and slice file, validate against the Key Validation Points listed above.

4. **Action: Validate, Correct, Update, Enhance, Complete**

   For EACH file identified with issues:

   **Step 1: Document Issues**

   ```markdown
   ## Issues Found in [filename]

   ### Critical Issues

   - **WHAT**: [Description of issue]
   - **WHY**: [Impact on system]
   - **HOW**: [Solution approach]
   - **CODE**: [Complete corrected code]
   ```

   **Step 2: Implement Corrections**

   - Use `strReplace` for targeted fixes
   - Use `fsWrite` for complete file rewrites if needed
   - Ensure all fixes are complete and working

   **Step 3: Add/Update Tests**

   - Create test files in `client/src/__tests__/`
   - Use Jest/Vitest with React Testing Library
   - Test all edge cases and error scenarios

5. **Test: Run All Tests**

   ```bash
   cd client
   npm test
   npm run lint
   ```

   **Validation Criteria**:

   - ✅ 100% of tests pass
   - ✅ No lint errors
   - ✅ All constants match backend exactly

6. **Validate: Final Checks**

   - All RTK Query APIs use injectEndpoints
   - Pagination conversion correct (0-based → 1-based)
   - Cache invalidation tags correct
   - All slices have correct initial state

7. **Update Phase Tracker**
   Update `docs/dev-phase-tracker.md`:

   ```markdown
   ## Phase 8: Frontend Features ✅

   - [x] All 9 feature APIs validated and corrected
   - [x] All slices validated and corrected
   - [x] Pagination conversion validated
   - [x] Cache invalidation validated
   - [x] Tests added and passing (100%)
   ```

8. **Merge: Complete Phase 8**

   ```bash
   git add .
   git commit -m "Phase 8: Validate and correct frontend features

   - Validated all 18 feature files against specifications
   - Corrected pagination conversion
   - Enhanced cache invalidation
   - Added comprehensive feature tests"

   git checkout main
   git merge validate/phase-8-frontend-features
   git push origin main
   git branch -d validate/phase-8-frontend-features
   ```

---

### Phase 9: Frontend Components Validation

**Branch**: `validate/phase-9-frontend-components`

#### BEFORE STARTING ANY CODE - GIT STATUS CHECK

```bash
git branch
git branch -r
git status
git diff
git log --oneline -10
```

#### Files to Validate (70+ files)

**Common Components (30+ files):**

- `client/src/components/common/MuiDataGrid.jsx`
- `client/src/components/common/MuiActionColumn.jsx`
- `client/src/components/common/MuiDialog.jsx`
- `client/src/components/common/MuiDialogConfirm.jsx`
- `client/src/components/common/MuiTextField.jsx`
- `client/src/components/common/MuiTextArea.jsx`
- `client/src/components/common/MuiNumberField.jsx`
- `client/src/components/common/MuiDatePicker.jsx`
- `client/src/components/common/MuiDateRangePicker.jsx`
- `client/src/components/common/MuiSelectAutocomplete.jsx`
- `client/src/components/common/MuiMultiSelect.jsx`
- `client/src/components/common/MuiResourceSelect.jsx`
- `client/src/components/common/MuiCheckbox.jsx`
- `client/src/components/common/MuiRadioGroup.jsx`
- `client/src/components/common/MuiFileUpload.jsx`
- `client/src/components/common/MuiLoading.jsx`
- `client/src/components/common/CustomDataGridToolbar.jsx`
- `client/src/components/common/FilterTextField.jsx`
- `client/src/components/common/FilterSelect.jsx`
- `client/src/components/common/FilterDateRange.jsx`
- `client/src/components/common/FilterChipGroup.jsx`
- `client/src/components/common/GlobalSearch.jsx`
- `client/src/components/common/NotificationMenu.jsx`
- `client/src/components/common/MuiThemeDropDown.jsx`
- `client/src/components/common/ErrorBoundary.jsx`
- `client/src/components/common/RouteError.jsx`
- `client/src/components/common/CustomIcons.jsx`

**Card Components (9 files):**

- `client/src/components/cards/UserCard.jsx`
- `client/src/components/cards/OrganizationCard.jsx`
- `client/src/components/cards/DepartmentCard.jsx`
- `client/src/components/cards/TaskCard.jsx`
- `client/src/components/cards/MaterialCard.jsx`
- `client/src/components/cards/VendorCard.jsx`
- `client/src/components/cards/AttachmentCard.jsx`
- `client/src/components/cards/NotificationCard.jsx`
- `client/src/components/cards/UsersCardList.jsx`

**Column Definitions (8 files):**

- `client/src/components/columns/UserColumns.jsx`
- `client/src/components/columns/OrganizationColumns.jsx`
- `client/src/components/columns/DepartmentColumns.jsx`
- `client/src/components/columns/TaskColumns.jsx`
- `client/src/components/columns/MaterialColumns.jsx`
- `client/src/components/columns/VendorColumns.jsx`
- `client/src/components/columns/AttachmentColumns.jsx`
- `client/src/components/columns/NotificationColumns.jsx`

**Filter Components (4 files):**

- `client/src/components/filters/UserFilter.jsx`
- `client/src/components/filters/TaskFilter.jsx`
- `client/src/components/filters/MaterialFilter.jsx`
- `client/src/components/filters/VendorFilter.jsx`

**Form Components (15+ files):**

- `client/src/components/forms/auth/LoginForm.jsx`
- `client/src/components/forms/auth/RegisterForm.jsx`
- `client/src/components/forms/auth/UserDetailsStep.jsx`
- `client/src/components/forms/auth/OrganizationDetailsStep.jsx`
- `client/src/components/forms/auth/UploadAttachmentsStep.jsx`
- `client/src/components/forms/auth/ReviewStep.jsx`
- `client/src/components/forms/users/CreateUpdateUser.jsx`
- `client/src/components/forms/departments/CreateUpdateDepartment.jsx`
- `client/src/components/forms/materials/CreateUpdateMaterial.jsx`
- `client/src/components/forms/vendors/CreateUpdateVendor.jsx`

**List Components (2 files):**

- `client/src/components/lists/UsersList.jsx`
- `client/src/components/lists/TasksList.jsx`

**Auth Components (4 files):**

- `client/src/components/auth/AuthProvider.jsx`
- `client/src/components/auth/ProtectedRoute.jsx`
- `client/src/components/auth/PublicRoute.jsx`
- `client/src/components/auth/index.js`

#### Key Validation Points

**MuiDataGrid:**

- ✅ Server-side pagination (paginationMode: "server")
- ✅ Auto-converts pagination: 0-based MUI ↔ 1-based backend
- ✅ Loading state: loading={isLoading || isFetching}
- ✅ Empty message displayed
- ✅ Row count from backend pagination

**MuiActionColumn:**

- ✅ Auto-detects soft delete (isDeleted field)
- ✅ Shows View, Edit, Delete buttons
- ✅ Shows Restore button if soft-deleted
- ✅ Confirmation dialog for delete

**MuiDialog:**

- ✅ disableEnforceFocus prop
- ✅ disableRestoreFocus prop
- ✅ ARIA attributes (aria-labelledby, aria-describedby)

**Form Components:**

- ✅ Use react-hook-form with Controller
- ❌ NEVER use watch() method
- ✅ Controlled components only
- ✅ Validation rules match backend validators

**Card Components:**

- ✅ Wrapped with React.memo
- ✅ displayName set for debugging
- ✅ useCallback for event handlers
- ✅ useMemo for computed values

**Column Definitions:**

- ✅ Action column: sortable: false, filterable: false, disableColumnMenu: true
- ✅ Proper field names matching backend

**MUI v7 Grid:**

- ✅ Use size prop (NOT item prop)
- ✅ Responsive sizes: { xs: 12, sm: 6, md: 4 }

#### MANDATORY: Cross Validation Scope

For this phase, cross validation MUST search for all occurrences of component logic across:

```
client/src/redux/*
client/src/services/*
client/src/hooks/*
client/src/utils/*
client/src/theme/*
client/src/components/*
client/src/pages/*
client/src/layouts/*
client/src/router/*
client/.env
client/src/App.jsx
client/src/main.jsx
```

**Additionally, validate against backend for consistency:**

```
backend/config/*
backend/controllers/*
backend/errorHandler/*
backend/middlewares/*
backend/middlewares/validators/*
backend/mock/*
backend/models/*
backend/models/plugins/*
backend/routes/*
backend/scripts/*
backend/services/*
backend/templates/*
backend/utils/*
backend/.env
backend/app.js
backend/server.js
```

#### MANDATORY: Super Deep Analysis

Before ANY code changes, perform super deep analysis using:

- `docs/validate-correct-update-enhance-complete.md`
- `docs/phase5-controllers-detailed.md`
- `docs/build-prompt.md`
- `docs/dev-phase-tracker.md`

Against: `backend/*` and `client/*`

#### MANDATORY: Task/Sub-Task Rule

- This phase is a TASK with multiple SUB-TASKS
- ALL sub-tasks MUST be started and completed TOGETHER
- It is STRICTLY FORBIDDEN to start a sub-task on its own

#### MANDATORY: Testing Rules

- Use Real MongoDB test database (NOT mongodb-memory-server)
- NEVER skip a test, no matter how long it takes
- NEVER skip a failed test - fix it
- At phase end: run `npm test` - ALL tests MUST pass

#### Critical Implementation Workflow [1 - 8]

1. **Branch Creation**

   ```bash
   git checkout -b validate/phase-9-frontend-components
   ```

2. **Search & Read Files**

   - Use `grepSearch` to locate all component files
   - Use `readFile` to read each file completely
   - **Cross validate** across ALL directories listed in Cross Validation Scope

3. **Analysis for Each File**

   For EACH component file, validate against the Key Validation Points listed above.

4. **Action: Validate, Correct, Update, Enhance, Complete**

   For EACH file identified with issues:

   **Step 1: Document Issues**

   ```markdown
   ## Issues Found in [filename]

   ### Critical Issues

   - **WHAT**: [Description of issue]
   - **WHY**: [Impact on system]
   - **HOW**: [Solution approach]
   - **CODE**: [Complete corrected code]
   ```

   **Step 2: Implement Corrections**

   - Use `strReplace` for targeted fixes
   - Use `fsWrite` for complete file rewrites if needed
   - Ensure all fixes are complete and working

   **Step 3: Add/Update Tests**

   - Create test files in `client/src/__tests__/`
   - Use Jest/Vitest with React Testing Library
   - Test all edge cases and error scenarios

5. **Test: Run All Tests**

   ```bash
   cd client
   npm test
   npm run lint
   ```

   **Validation Criteria**:

   - ✅ 100% of tests pass
   - ✅ No lint errors
   - ✅ MUI v7 patterns correct
   - ✅ React.memo patterns correct

6. **Validate: Final Checks**

   - All common components follow MUI v7 patterns
   - All card components use React.memo
   - All form components use react-hook-form with Controller
   - No watch() method usage
   - All column definitions have correct action column settings

7. **Update Phase Tracker**
   Update `docs/dev-phase-tracker.md`:

   ```markdown
   ## Phase 9: Frontend Components ✅

   - [x] All common components validated and corrected
   - [x] All card components validated and corrected
   - [x] All column definitions validated and corrected
   - [x] All filter components validated and corrected
   - [x] All form components validated and corrected
   - [x] All list components validated and corrected
   - [x] All auth components validated and corrected
   - [x] MUI v7 patterns validated
   - [x] React.memo patterns validated
   - [x] Tests added and passing (100%)
   ```

8. **Merge: Complete Phase 9**

   ```bash
   git add .
   git commit -m "Phase 9: Validate and correct frontend components

   - Validated all 70+ component files against specifications
   - Corrected MUI v7 patterns
   - Enhanced React.memo usage
   - Added comprehensive component tests"

   git checkout main
   git merge validate/phase-9-frontend-components
   git push origin main
   git branch -d validate/phase-9-frontend-components
   ```

---

### Phase 10: Frontend Pages & Routing Validation

**Branch**: `validate/phase-10-frontend-pages`

#### BEFORE STARTING ANY CODE - GIT STATUS CHECK

```bash
git branch
git branch -r
git status
git diff
git log --oneline -10
```

#### Files to Validate (18 files)

**Pages (12 files):**

- `client/src/pages/Home.jsx`
- `client/src/pages/Dashboard.jsx`
- `client/src/pages/Users.jsx`
- `client/src/pages/Organizations.jsx`
- `client/src/pages/Organization.jsx`
- `client/src/pages/Departments.jsx`
- `client/src/pages/Tasks.jsx`
- `client/src/pages/Materials.jsx`
- `client/src/pages/Vendors.jsx`
- `client/src/pages/ForgotPassword.jsx`
- `client/src/pages/NotFound.jsx`

**Layouts (3 files):**

- `client/src/layouts/RootLayout.jsx`
- `client/src/layouts/PublicLayout.jsx`
- `client/src/layouts/DashboardLayout.jsx`

**Routing (1 file):**

- `client/src/router/routes.jsx`

**App Entry (2 files):**

- `client/src/App.jsx`
- `client/src/main.jsx`

#### Key Validation Points

**Pages:**

- ✅ DataGrid pattern for admin views (Organizations, Departments, Materials, Vendors)
- ✅ Three-layer pattern for user views (Tasks, Users)
- ✅ RTK Query for data fetching
- ✅ Loading states displayed
- ✅ Error handling with error boundaries
- ✅ Empty states displayed
- ✅ Filters integrated
- ✅ Create/Update dialogs integrated

**Layouts:**

- ✅ RootLayout: Theme provider, Redux provider, Router, Toast, Error boundary
- ✅ PublicLayout: Simple layout for auth pages
- ✅ DashboardLayout: Header, Sidebar, Footer, Notification menu

**Routing:**

- ✅ Lazy loading for all pages
- ✅ Protected routes use ProtectedRoute wrapper
- ✅ Public routes use PublicRoute wrapper
- ✅ 404 page for unknown routes
- ✅ Proper route hierarchy

**App.jsx:**

- ✅ Imports RootLayout
- ✅ Imports routes
- ✅ Socket.IO connection on mount
- ✅ Socket event handlers setup

**main.jsx:**

- ✅ React 19 createRoot
- ✅ StrictMode enabled
- ✅ Renders App component

#### MANDATORY: Cross Validation Scope

For this phase, cross validation MUST search for all occurrences of page and routing logic across:

```
client/src/redux/*
client/src/services/*
client/src/hooks/*
client/src/utils/*
client/src/theme/*
client/src/components/*
client/src/pages/*
client/src/layouts/*
client/src/router/*
client/.env
client/src/App.jsx
client/src/main.jsx
```

**Additionally, validate against backend for consistency:**

```
backend/config/*
backend/controllers/*
backend/errorHandler/*
backend/middlewares/*
backend/middlewares/validators/*
backend/mock/*
backend/models/*
backend/models/plugins/*
backend/routes/*
backend/scripts/*
backend/services/*
backend/templates/*
backend/utils/*
backend/.env
backend/app.js
backend/server.js
```

#### MANDATORY: Super Deep Analysis

Before ANY code changes, perform super deep analysis using:

- `docs/validate-correct-update-enhance-complete.md`
- `docs/phase5-controllers-detailed.md`
- `docs/build-prompt.md`
- `docs/dev-phase-tracker.md`

Against: `backend/*` and `client/*`

#### MANDATORY: Task/Sub-Task Rule

- This phase is a TASK with multiple SUB-TASKS
- ALL sub-tasks MUST be started and completed TOGETHER
- It is STRICTLY FORBIDDEN to start a sub-task on its own

#### MANDATORY: Testing Rules

- Use Real MongoDB test database (NOT mongodb-memory-server)
- NEVER skip a test, no matter how long it takes
- NEVER skip a failed test - fix it
- At phase end: run `npm test` - ALL tests MUST pass

#### Critical Implementation Workflow [1 - 8]

1. **Branch Creation**

   ```bash
   git checkout -b validate/phase-10-frontend-pages
   ```

2. **Search & Read Files**

   - Use `grepSearch` to locate all page and routing files
   - Use `readFile` to read each file completely
   - **Cross validate** across ALL directories listed in Cross Validation Scope

3. **Analysis for Each File**

   For EACH page, layout, and routing file, validate against the Key Validation Points listed above.

4. **Action: Validate, Correct, Update, Enhance, Complete**

   For EACH file identified with issues:

   **Step 1: Document Issues**

   ```markdown
   ## Issues Found in [filename]

   ### Critical Issues

   - **WHAT**: [Description of issue]
   - **WHY**: [Impact on system]
   - **HOW**: [Solution approach]
   - **CODE**: [Complete corrected code]
   ```

   **Step 2: Implement Corrections**

   - Use `strReplace` for targeted fixes
   - Use `fsWrite` for complete file rewrites if needed
   - Ensure all fixes are complete and working

   **Step 3: Add/Update Tests**

   - Create test files in `client/src/__tests__/`
   - Use Jest/Vitest with React Testing Library
   - Test all edge cases and error scenarios

5. **Test: Run All Tests**

   ```bash
   cd client
   npm test
   npm run lint
   ```

   **Validation Criteria**:

   - ✅ 100% of tests pass
   - ✅ No lint errors
   - ✅ Lazy loading works
   - ✅ Protected/public routes work

6. **Validate: Final Checks**

   - All pages use RTK Query for data fetching
   - All pages have loading and empty states
   - All layouts are correctly structured
   - Routing uses lazy loading
   - Protected routes require authentication
   - Socket.IO connects on mount

7. **Update Phase Tracker**
   Update `docs/dev-phase-tracker.md`:

   ```markdown
   ## Phase 10: Frontend Pages & Routing ✅

   - [x] All pages validated and corrected
   - [x] All layouts validated and corrected
   - [x] Routing validated and corrected
   - [x] App entry validated and corrected
   - [x] Lazy loading validated
   - [x] Protected/public routes validated
   - [x] Tests added and passing (100%)
   ```

8. **Merge: Complete Phase 10**

   ```bash
   git add .
   git commit -m "Phase 10: Validate and correct frontend pages and routing

   - Validated all 18 page/layout/routing files against specifications
   - Corrected lazy loading implementation
   - Enhanced protected route handling
   - Added comprehensive page tests"

   git checkout main
   git merge validate/phase-10-frontend-pages
   git push origin main
   git branch -d validate/phase-10-frontend-pages
   ```

---

### Phase 11: Testing & Quality Assurance Validation

**Branch**: `validate/phase-11-testing-qa`

#### BEFORE STARTING ANY CODE - GIT STATUS CHECK

```bash
git branch
git branch -r
git status
git diff
git log --oneline -10
```

#### Files to Validate

**Test Configuration:**

- `backend/tests/globalSetup.js`
- `backend/tests/globalTeardown.js`
- `backend/tests/setup.js`
- `backend/jest.config.js`

**Test Suites:**

- All unit tests in `backend/tests/unit/`
- All property tests in `backend/tests/property/`

#### Key Validation Points

**Jest Configuration:**

- ✅ testEnvironment: "node"
- ✅ transform: {} (ES modules)
- ✅ extensionsToTreatAsEsm: [".js"]
- ✅ moduleNameMapper for .js extensions
- ✅ testMatch: ["**/tests/**/*.test.js"]
- ✅ globalSetup, globalTeardown, setupFilesAfterEnv
- ✅ testTimeout: 30000
- ✅ maxWorkers: 1 (--runInBand)

**Global Setup:**

- ✅ Connects to real MongoDB (NOT mongodb-memory-server)
- ✅ Creates test database
- ✅ Seeds initial data if needed

**Global Teardown:**

- ✅ Drops test database
- ✅ Closes MongoDB connection

**Test Quality:**

- ✅ All tests pass (100%)
- ✅ Coverage: 80%+ statements
- ✅ Coverage: 75%+ branches
- ✅ Coverage: 80%+ functions
- ✅ Coverage: 80%+ lines
- ✅ No skipped tests
- ✅ No console.log in tests
- ✅ Proper test descriptions
- ✅ Arrange-Act-Assert pattern
- ✅ Cleanup after each test

**Property-Based Tests:**

- ✅ Use fast-check library
- ✅ Test authorization matrix exhaustively
- ✅ Test soft delete operations
- ✅ Test cascade operations
- ✅ Test all permission combinations

#### MANDATORY: Cross Validation Scope

For this phase, cross validation MUST search for all occurrences of test-related logic across:

```
backend/config/*
backend/controllers/*
backend/errorHandler/*
backend/middlewares/*
backend/middlewares/validators/*
backend/mock/*
backend/models/*
backend/models/plugins/*
backend/routes/*
backend/scripts/*
backend/services/*
backend/templates/*
backend/utils/*
backend/tests/*
backend/.env
backend/app.js
backend/server.js
backend/jest.config.js
```

**Additionally, validate frontend tests:**

```
client/src/__tests__/*
client/src/redux/*
client/src/services/*
client/src/hooks/*
client/src/utils/*
client/src/components/*
client/src/pages/*
```

#### MANDATORY: Super Deep Analysis

Before ANY code changes, perform super deep analysis using:

- `docs/validate-correct-update-enhance-complete.md`
- `docs/phase5-controllers-detailed.md`
- `docs/build-prompt.md`
- `docs/dev-phase-tracker.md`

Against: `backend/*` and `client/*`

#### MANDATORY: Task/Sub-Task Rule

- This phase is a TASK with multiple SUB-TASKS
- ALL sub-tasks MUST be started and completed TOGETHER
- It is STRICTLY FORBIDDEN to start a sub-task on its own

#### MANDATORY: Testing Rules

- Use Real MongoDB test database (NOT mongodb-memory-server)
- NEVER skip a test, no matter how long it takes
- NEVER skip a failed test - fix it
- At phase end: run `npm test` - ALL tests MUST pass

#### Critical Implementation Workflow [1 - 8]

1. **Branch Creation**

   ```bash
   git checkout -b validate/phase-11-testing-qa
   ```

2. **Search & Read Files**

   - Use `grepSearch` to locate all test configuration and test files
   - Use `readFile` to read each file completely
   - **Cross validate** across ALL directories listed in Cross Validation Scope

3. **Analysis for Each File**

   For EACH test configuration and test file, validate against the Key Validation Points listed above.

4. **Action: Validate, Correct, Update, Enhance, Complete**

   For EACH file identified with issues:

   **Step 1: Document Issues**

   ```markdown
   ## Issues Found in [filename]

   ### Critical Issues

   - **WHAT**: [Description of issue]
   - **WHY**: [Impact on system]
   - **HOW**: [Solution approach]
   - **CODE**: [Complete corrected code]
   ```

   **Step 2: Implement Corrections**

   - Use `strReplace` for targeted fixes
   - Use `fsWrite` for complete file rewrites if needed
   - Ensure all fixes are complete and working

   **Step 3: Add/Update Tests**

   - Ensure all tests use real MongoDB (NOT mongodb-memory-server)
   - Ensure all tests follow Arrange-Act-Assert pattern
   - Ensure cleanup after each test

5. **Test: Run All Tests**

   ```bash
   cd backend
   npm test -- --runInBand --coverage
   ```

   **Validation Criteria**:

   - ✅ 100% of tests pass
   - ✅ 80%+ code coverage
   - ✅ No skipped tests
   - ✅ No console.log in tests
   - ✅ Real MongoDB used (NOT mongodb-memory-server)

6. **Validate: Final Checks**

   - Jest configuration correct for ES modules
   - Global setup connects to real MongoDB
   - Global teardown cleans up properly
   - All unit tests pass
   - All property tests pass
   - Coverage ≥80%

7. **Update Phase Tracker**
   Update `docs/dev-phase-tracker.md`:

   ```markdown
   ## Phase 11: Testing & Quality Assurance ✅

   - [x] Jest configuration validated and corrected
   - [x] Global setup/teardown validated and corrected
   - [x] All unit tests validated and corrected
   - [x] All property tests validated and corrected
   - [x] All tests pass (100%)
   - [x] Coverage achieved (80%+)
   ```

8. **Merge: Complete Phase 11**

   ```bash
   git add .
   git commit -m "Phase 11: Validate and correct testing and quality assurance

   - Validated all test configuration files
   - Corrected Jest configuration for ES modules
   - Enhanced global setup/teardown
   - Fixed all failing tests
   - Achieved 80%+ coverage"

   git checkout main
   git merge validate/phase-11-testing-qa
   git push origin main
   git branch -d validate/phase-11-testing-qa
   ```

---

### Phase 12: Final Integration & Deployment Validation

**Branch**: `validate/phase-12-final-integration`

#### BEFORE STARTING ANY CODE - GIT STATUS CHECK

```bash
git branch
git branch -r
git status
git diff
git log --oneline -10
```

#### Files to Validate

**Environment Configuration:**

- `backend/.env.example`
- `client/.env.example`
- `backend/scripts/verifyEnv.js`

**Build Configuration:**

- `backend/package.json`
- `client/package.json`
- `client/vite.config.js`
- `client/eslint.config.js`

**Documentation:**

- `README.md`
- `docs/build-prompt.md`
- `docs/dev-phase-tracker.md`

**Seed Data:**

- `backend/mock/data.js`
- `backend/mock/cleanSeedSetup.js`

#### Key Validation Points

**Environment Variables:**

- ✅ All required variables documented
- ✅ Example values provided
- ✅ Validation script works
- ✅ No secrets in repository

**Build Process:**

- ✅ Backend: npm start works
- ✅ Frontend: npm run build works
- ✅ Frontend build outputs to dist/
- ✅ Backend serves frontend static files in production
- ✅ No build errors or warnings

**Production Readiness:**

- ✅ Security middleware configured correctly
- ✅ Rate limiting enabled in production
- ✅ CORS configured for production
- ✅ Logging configured for production
- ✅ Error handling production-ready
- ✅ No console.log in production code
- ✅ Environment variables validated on startup

**Performance:**

- ✅ Database indexes created
- ✅ Query optimization applied
- ✅ React.memo used appropriately
- ✅ useCallback used for event handlers
- ✅ useMemo used for computed values
- ✅ Lazy loading for routes
- ✅ Code splitting configured

**Security:**

- ✅ JWT in HTTP-only cookies
- ✅ Bcrypt ≥12 salt rounds
- ✅ Helmet security headers
- ✅ CORS with credentials
- ✅ NoSQL injection prevention
- ✅ Rate limiting
- ✅ Password reset token hashing
- ✅ Email enumeration prevention

**Documentation:**

- ✅ README complete with setup instructions
- ✅ API documentation complete
- ✅ Architecture documented
- ✅ Deployment instructions provided

**Seed Data:**

- ✅ Platform organization created
- ✅ Platform SuperAdmin user created
- ✅ Sample customer organization created
- ✅ Sample departments created
- ✅ Sample users created
- ✅ Sample tasks created

#### MANDATORY: Cross Validation Scope

For this phase, cross validation MUST search for all occurrences of configuration, build, and deployment logic across:

```
backend/config/*
backend/controllers/*
backend/errorHandler/*
backend/middlewares/*
backend/middlewares/validators/*
backend/mock/*
backend/models/*
backend/models/plugins/*
backend/routes/*
backend/scripts/*
backend/services/*
backend/templates/*
backend/utils/*
backend/tests/*
backend/.env
backend/app.js
backend/server.js
backend/package.json
```

**Additionally, validate frontend:**

```
client/src/redux/*
client/src/services/*
client/src/hooks/*
client/src/utils/*
client/src/theme/*
client/src/components/*
client/src/pages/*
client/src/layouts/*
client/src/router/*
client/.env
client/src/App.jsx
client/src/main.jsx
client/package.json
client/vite.config.js
client/eslint.config.js
```

#### MANDATORY: Super Deep Analysis

Before ANY code changes, perform super deep analysis using:

- `docs/validate-correct-update-enhance-complete.md`
- `docs/phase5-controllers-detailed.md`
- `docs/build-prompt.md`
- `docs/dev-phase-tracker.md`

Against: `backend/*` and `client/*`

#### MANDATORY: Task/Sub-Task Rule

- This phase is a TASK with multiple SUB-TASKS
- ALL sub-tasks MUST be started and completed TOGETHER
- It is STRICTLY FORBIDDEN to start a sub-task on its own

#### MANDATORY: Testing Rules

- Use Real MongoDB test database (NOT mongodb-memory-server)
- NEVER skip a test, no matter how long it takes
- NEVER skip a failed test - fix it
- At phase end: run `npm test` - ALL tests MUST pass

#### Critical Implementation Workflow [1 - 8]

1. **Branch Creation**

   ```bash
   git checkout -b validate/phase-12-final-integration
   ```

2. **Search & Read Files**

   - Use `grepSearch` to locate all configuration and build files
   - Use `readFile` to read each file completely
   - **Cross validate** across ALL directories listed in Cross Validation Scope

3. **Analysis for Each File**

   For EACH configuration, build, and deployment file, validate against the Key Validation Points listed above.

4. **Action: Validate, Correct, Update, Enhance, Complete**

   For EACH file identified with issues:

   **Step 1: Document Issues**

   ```markdown
   ## Issues Found in [filename]

   ### Critical Issues

   - **WHAT**: [Description of issue]
   - **WHY**: [Impact on system]
   - **HOW**: [Solution approach]
   - **CODE**: [Complete corrected code]
   ```

   **Step 2: Implement Corrections**

   - Use `strReplace` for targeted fixes
   - Use `fsWrite` for complete file rewrites if needed
   - Ensure all fixes are complete and working

   **Step 3: Add/Update Tests**

   - Ensure all integration tests pass
   - Ensure build process works
   - Ensure production configuration is correct

5. **Test: Run All Tests**

   ```bash
   cd backend
   npm test -- --runInBand --coverage
   npm start

   cd ../client
   npm run build
   npm run lint
   ```

   **Validation Criteria**:

   - ✅ 100% of tests pass
   - ✅ 80%+ code coverage
   - ✅ Backend starts successfully
   - ✅ Frontend builds successfully
   - ✅ No lint errors

6. **Validate: Final Checks**

   - Environment variables documented and validated
   - Build process works for both backend and frontend
   - Production readiness verified
   - Security measures in place
   - Performance optimizations applied
   - Documentation complete
   - Seed data works correctly

7. **Update Phase Tracker**
   Update `docs/dev-phase-tracker.md`:

   ```markdown
   ## Phase 12: Final Integration & Deployment ✅

   - [x] Environment configuration validated
   - [x] Build process validated
   - [x] Production readiness validated
   - [x] Performance optimizations validated
   - [x] Security measures validated
   - [x] Documentation complete
   - [x] Seed data validated
   - [x] All tests pass (100%)
   - [x] Coverage achieved (80%+)
   ```

8. **Merge: Complete Phase 12**

   ```bash
   git add .
   git commit -m "Phase 12: Final integration and deployment validation

   - Validated all configuration and build files
   - Verified production readiness
   - Confirmed security measures
   - Completed documentation
   - All tests pass with 80%+ coverage"

   git checkout main
   git merge validate/phase-12-final-integration
   git push origin main
   git branch -d validate/phase-12-final-integration
   ```

---

## FINAL VALIDATION CHECKLIST

Before considering the validation complete, verify ALL of the following:

### Backend Validation ✅

- [ ] All 14 files in Phase 1 validated and corrected
- [ ] All 15 models in Phase 2 validated and corrected
- [ ] All 13 middleware/validators in Phase 3 validated and corrected
- [ ] All 8 services/utils in Phase 4 validated and corrected
- [ ] All 9 controllers in Phase 5 validated and corrected
- [ ] All 10 routes in Phase 6 validated and corrected
- [ ] All tests pass (100%)
- [ ] Coverage ≥80% for all files
- [ ] No lint errors
- [ ] No console.log in production code
- [ ] All constants imported from utils/constants.js
- [ ] All ES module syntax
- [ ] Soft delete plugin applied to all models
- [ ] Authorization matrix enforced everywhere
- [ ] Multi-tenancy isolation enforced
- [ ] HOD rules enforced
- [ ] Task type restrictions enforced
- [ ] Cascade operations use transactions
- [ ] Socket.IO events emitted correctly

### Frontend Validation ✅

- [ ] All 15 core files in Phase 7 validated and corrected
- [ ] All 18 feature files in Phase 8 validated and corrected
- [ ] All 70+ component files in Phase 9 validated and corrected
- [ ] All 18 page/layout/routing files in Phase 10 validated and corrected
- [ ] Constants EXACTLY match backend
- [ ] RTK Query for ALL API calls
- [ ] NEVER use watch() in react-hook-form
- [ ] MUI v7 size prop (NOT item prop)
- [ ] React.memo for Card components
- [ ] useCallback for event handlers
- [ ] useMemo for computed values
- [ ] DataGrid pagination conversion correct
- [ ] Socket.IO cache invalidation works
- [ ] Error boundaries in place
- [ ] Loading states everywhere
- [ ] Empty states everywhere
- [ ] No lint errors

### Integration Validation ✅

- [ ] Backend and frontend communicate correctly
- [ ] Authentication flow works end-to-end
- [ ] Authorization enforced on frontend and backend
- [ ] Socket.IO real-time updates work
- [ ] File uploads work (Cloudinary)
- [ ] Email sending works (Nodemailer)
- [ ] Notifications created and displayed
- [ ] Soft delete and restore work
- [ ] Cascade operations work
- [ ] Multi-tenancy isolation works
- [ ] Platform organization cannot be deleted
- [ ] HOD rules enforced
- [ ] Task type restrictions enforced

### Quality Assurance ✅

- [ ] All tests pass (100%)
- [ ] Coverage ≥80%
- [ ] No skipped tests
- [ ] No TODO comments
- [ ] No console.log statements
- [ ] No hardcoded values
- [ ] All error scenarios handled
- [ ] All edge cases tested
- [ ] Performance optimized
- [ ] Security best practices followed

### Documentation ✅

- [ ] README complete
- [ ] API documentation complete
- [ ] Architecture documented
- [ ] Deployment instructions provided
- [ ] Environment variables documented
- [ ] Phase tracker updated

---

## COMPLETION CRITERIA

The validation is ONLY complete when:

1. ✅ ALL 12 phases completed
2. ✅ ALL files validated against specifications
3. ✅ ALL issues corrected with complete code
4. ✅ ALL tests pass (100%)
5. ✅ ALL coverage ≥80%
6. ✅ ALL lint errors resolved
7. ✅ ALL integration tests pass
8. ✅ ALL documentation updated
9. ✅ Phase tracker shows all phases complete
10. ✅ Final checklist 100% complete

---

## REPORTING FORMAT

For each phase, provide a report in this format:

```markdown
# Phase [N]: [Phase Name] - Validation Report

## Summary

- Files Validated: [count]
- Issues Found: [count]
- Issues Fixed: [count]
- Tests Added: [count]
- Tests Passing: [count]/[total]
- Coverage: [percentage]%

## Critical Issues Fixed

1. **[Filename]**: [Issue description]
   - **Impact**: [Why this was critical]
   - **Solution**: [How it was fixed]

## High Priority Issues Fixed

[Same format]

## Medium Priority Issues Fixed

[Same format]

## Low Priority Issues Fixed

[Same format]

## Tests Added

- [Test description]
- [Test description]

## Coverage Report

- Statements: [percentage]%
- Branches: [percentage]%
- Functions: [percentage]%
- Lines: [percentage]%

## Phase Completion Status

- [x] All files validated
- [x] All issues corrected
- [x] All tests passing
- [x] Coverage ≥80%
- [x] Phase tracker updated
- [x] Branch merged to main
```

---

## IMPORTANT NOTES

1. **Cross Validation Approach**: For every phase, validate across ALL relevant directories:

   - Backend: `backend/config/*`, `backend/controllers/*`, `backend/errorHandler/*`, `backend/middlewares/*`, `backend/middlewares/validators/*`, `backend/mock/*`, `backend/models/*`, `backend/models/plugins/*`, `backend/routes/*`, `backend/scripts/*`, `backend/services/*`, `backend/templates/*`, `backend/utils/*`, `backend/.env`, `backend/app.js`, `backend/server.js`
   - Frontend: `client/src/*` for frontend phases

2. **No Skipping**: You are STRICTLY FORBIDDEN from skipping any file, line, or requirement

3. **Test Coverage**: Do NOT proceed to the next phase until test coverage ≥80% is achieved

4. **Git Workflow**: Always create a branch, commit changes, merge to main, and delete the branch

5. **Phase Tracker**: Update `docs/dev-phase-tracker.md` after each phase completion

6. **Documentation References**: Always refer to:

   - `docs/build-prompt.md` - Main specifications
   - `docs/validate-correct-update-enhance-complete.md` - Validation instructions
   - `docs/phase5-controllers-detailed.md` - Controller-specific details
   - `docs/dev-phase-tracker.md` - Progress tracking

7. **Constants**: NEVER hardcode values - always import from utils/constants.js

8. **ES Modules**: Use ES module syntax throughout (import/export, not require/module.exports)

9. **Soft Delete**: All models MUST use the soft delete plugin

10. **Transactions**: All write operations MUST use MongoDB transactions

11. **Real MongoDB**: Use Real MongoDB test database (NOT mongodb-memory-server)

12. **Terminal Commands**: Every terminal command MUST be suitable for GitBash WSL VSCode integrated terminal

13. **Task/Sub-Task Rule**: Each phase is a TASK with SUB-TASKS - ALL sub-tasks MUST be started and completed TOGETHER with the TASK. It is STRICTLY FORBIDDEN for a sub-task to be started on its own.

14. **Super Deep Analysis**: On EACH phase/task sub-task, a SUPER DEEP ANALYSIS must be done using `docs/validate-correct-update-enhance-complete.md`, `docs/phase5-controllers-detailed.md`, `docs/build-prompt.md` and `docs/dev-phase-tracker.md` against `backend/*` and `client/*`. It is STRICTLY FORBIDDEN to skip this.

15. **Test Execution**: After running a test, NO MATTER HOW LONG IT TAKES, skipping the test is STRICTLY FORBIDDEN. It is STRICTLY FORBIDDEN to skip a failed test.

16. **Phase Completion Testing**: At the END of EACH phase (task), the codebase MUST be tested by running `npm test` and ALL tests MUST pass.

---

**Last Updated**: [To be updated by AI agent]
**Updated By**: [To be updated by AI agent]
