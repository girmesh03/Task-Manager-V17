# Requirements Document

## Introduction

This specification defines the comprehensive validation, correction, update, enhancement, and completion requirements for the Multi-Tenant SaaS Task Manager codebase. The validation covers both `backend/*` and `client/*` directories against the specifications defined in `docs/prompt.md`, `docs/build-prompt.md`, `docs/validate-correct-update-enhance-complete.md`, `docs/phase5-controllers-detailed.md`, and `docs/dev-phase-tracker.md`.

## Glossary

- **Platform Organization**: The service provider organization with `isPlatformOrg: true`, managing the entire SaaS system
- **Customer Organization**: Regular tenant organizations with `isPlatformOrg: false`
- **HOD (Head of Department)**: Users with SuperAdmin or Admin roles, automatically designated as department heads
- **Soft Delete**: Logical deletion marking records as deleted without physical removal
- **TTL (Time To Live)**: Automatic cleanup period after soft deletion
- **Discriminator Pattern**: Mongoose pattern for task type inheritance (BaseTask → ProjectTask/RoutineTask/AssignedTask)
- **Cross Validation**: Validating changes across all related directories to ensure consistency
- **EARS Pattern**: Easy Approach to Requirements Syntax for structured requirements
- **Scope**: Authorization level (own, ownDept, crossDept, crossOrg)
- **Validation_System**: The AI agent performing the validation workflow
- **asyncHandler**: Express middleware wrapper for async error handling
- **RTK Query**: Redux Toolkit Query for data fetching and caching

## Requirements

### Requirement 1: Role Requirements

**User Story:** As a project stakeholder, I want the validation to be performed by a qualified expert, so that the codebase meets enterprise-grade quality standards.

#### Acceptance Criteria

1. THE Validation_System SHALL operate as a Senior MERN Full Stack Developer with deep expertise in Node.js (ES modules) and Express.js backend development
2. THE Validation_System SHALL operate as a Multi-Tenant SaaS System Architect with expertise in MongoDB/Mongoose with advanced patterns (discriminators, soft delete, transactions)
3. THE Validation_System SHALL operate as a Code Auditor with expertise in React 19 with modern hooks and performance optimization
4. THE Validation_System SHALL operate as a Quality Assurance Specialist with expertise in Material-UI (MUI) v7 with responsive design
5. THE Validation_System SHALL have expertise in Redux Toolkit with RTK Query for state management
6. THE Validation_System SHALL have expertise in real-time communication with Socket.IO
7. THE Validation_System SHALL have expertise in role-based access control (RBAC) and multi-tenancy isolation
8. THE Validation_System SHALL have expertise in JWT authentication with HTTP-only cookies
9. THE Validation_System SHALL have expertise in property-based testing and comprehensive validation

### Requirement 2: Objective Requirements

**User Story:** As a project stakeholder, I want the validation to achieve five specific objectives, so that the codebase is fully compliant with specifications.

#### Acceptance Criteria

1. THE Validation_System SHALL VALIDATE every single file, function, logic, pattern, mismatches, and implementation of the `backend/*` and `client/*` against the specification documents
2. THE Validation_System SHALL CORRECT any mismatches, errors, bugs, or deviations from the specification documents
3. THE Validation_System SHALL UPDATE outdated patterns, deprecated syntax, non-optimal implementations or anything that doesn't match the specification documents
4. THE Validation_System SHALL ENHANCE performance, security, maintainability, and user experience by identifying improvements from `backend/*`, `client/*` and the specification documents
5. THE Validation_System SHALL COMPLETE any missing implementations, incomplete features, and TODO items by identifying what needs to be completed from `backend/*`, `client/*` and the specification documents

### Requirement 3: Context Requirements - Platform Organization

**User Story:** As a system architect, I want the Platform Organization to be correctly understood and validated, so that the service provider functionality works correctly.

#### Acceptance Criteria

1. WHEN validating Platform Organization THEN the Validation_System SHALL verify the identifier is `isPlatformOrg: true` as an immutable field in Organization model
2. WHEN validating Platform Organization THEN the Validation_System SHALL verify exactly ONE platform organization exists in the system
3. WHEN validating Platform Organization THEN the Validation_System SHALL verify creation is via backend seed data during initial system setup
4. WHEN validating Platform Organization THEN the Validation_System SHALL verify all users in platform organization have `isPlatformUser: true` auto-set
5. WHEN validating Platform Organization THEN the Validation_System SHALL verify Platform SuperAdmin can view and manage ALL customer organizations (crossOrg scope)
6. WHEN validating Platform Organization THEN the Validation_System SHALL verify platform organization CANNOT be deleted (hard-coded protection)
7. WHEN validating Platform Organization THEN the Validation_System SHALL verify TTL never expires (TTL = null)

### Requirement 4: Context Requirements - Customer Organization

**User Story:** As a system architect, I want Customer Organizations to be correctly understood and validated, so that tenant isolation works correctly.

#### Acceptance Criteria

1. WHEN validating Customer Organization THEN the Validation_System SHALL verify the identifier is `isPlatformOrg: false` as the default value
2. WHEN validating Customer Organization THEN the Validation_System SHALL verify multiple customer organizations can exist
3. WHEN validating Customer Organization THEN the Validation_System SHALL verify creation is via frontend registration/onboarding process
4. WHEN validating Customer Organization THEN the Validation_System SHALL verify all users in customer organization have `isPlatformUser: false` auto-set
5. WHEN validating Customer Organization THEN the Validation_System SHALL verify complete data isolation from other customer organizations
6. WHEN validating Customer Organization THEN the Validation_System SHALL verify Customer SuperAdmin can only access own organization (crossDept scope within org)
7. WHEN validating Customer Organization THEN the Validation_System SHALL verify customer organizations CAN be deleted (soft delete with cascade)

### Requirement 5: Context Requirements - Schema Overview

**User Story:** As a system architect, I want all schema definitions to be correctly validated, so that data models match specifications exactly.

#### Acceptance Criteria

1. WHEN validating Organization schema THEN the Validation_System SHALL verify fields: name, description, contact info, industry, logo {url, publicId}, isPlatformOrg with cascades to Departments, Users, Tasks, Materials, Vendors, Notifications
2. WHEN validating Department schema THEN the Validation_System SHALL verify fields: name, description, hod, organization reference with cascades to Users, Tasks, Materials and constraint for at least one HOD
3. WHEN validating User schema THEN the Validation_System SHALL verify fields: firstName, lastName, dateOfBirth, employeeId (4 digit unique), skills [{skill, percentage}], role, password, email, position, organization, department, isHod, isPlatformUser, profilePicture {url, publicId}, lastLogin, passwordResetExpires, passwordResetToken
4. WHEN validating BaseTask schema THEN the Validation_System SHALL verify discriminator base with fields: description, status, priority, organization, department, attachments, watchers ([ref]), tags with discriminator key taskType
5. WHEN validating ProjectTask schema THEN the Validation_System SHALL verify fields: title, vendor reference (required), cost tracking, materials via activities, start/due dates with watchers restricted to HOD users only
6. WHEN validating RoutineTask schema THEN the Validation_System SHALL verify fields: materials (added directly), required task performed date with status restriction (cannot be "To Do") and priority restriction (cannot be "Low")
7. WHEN validating AssignedTask schema THEN the Validation_System SHALL verify fields: title, assignees (required), start/due dates with materials via TaskActivity
8. WHEN validating TaskActivity schema THEN the Validation_System SHALL verify it tracks progress on ProjectTask and AssignedTask ONLY (NOT RoutineTask) with fields: content, parent task reference, materials with quantities, createdBy, organization, department
9. WHEN validating TaskComment schema THEN the Validation_System SHALL verify threading with max depth 3 levels and fields: content, parent reference, mentions, createdBy, organization, department
10. WHEN validating Material schema THEN the Validation_System SHALL verify fields: name, description, category (9 options), unit type (30+ options), price, organization, department
11. WHEN validating Vendor schema THEN the Validation_System SHALL verify fields: name, description, contact info with only organization references and phone validation for Ethiopian format
12. WHEN validating Attachment schema THEN the Validation_System SHALL verify fields: filename, URL, type, size, parent reference with file size limits (Image 10MB, Video 100MB, Document 25MB, Audio 20MB, Other 50MB) and max 10 per entity
13. WHEN validating Notification schema THEN the Validation_System SHALL verify fields: title, message, type (7 types), read status, recipients, entity reference with TTL 30 days

### Requirement 6: Critical Instructions Requirements

**User Story:** As a project stakeholder, I want strict rules enforced during validation, so that no shortcuts are taken.

#### Acceptance Criteria

1. THE Validation_System SHALL NOT skip ANY file from `backend/*` or `client/*` directories
2. THE Validation_System SHALL NOT skip ANY line, statement, or character from the specification documents
3. THE Validation_System SHALL NOT make assumptions or use default knowledge
4. THE Validation_System SHALL NOT accept "good enough" implementations
5. THE Validation_System SHALL NOT ignore edge cases or error scenarios
6. THE Validation_System SHALL NOT skip validation tests
7. THE Validation_System SHALL read and analyze EVERY SINGLE FILE in the codebase
8. THE Validation_System SHALL compare EVERY implementation against specification documents
9. THE Validation_System SHALL validate EVERY business logic, permission check, and data flow
10. THE Validation_System SHALL test EVERY edge case, error scenario, and validation rule
11. THE Validation_System SHALL document EVERY issue found with WHAT, WHY, and HOW to fix
12. THE Validation_System SHALL provide COMPLETE, WORKING solutions for every issue
13. THE Validation_System SHALL update `docs/dev-phase-tracker.md` after each phase completion

### Requirement 7: Validation Methodology Requirements

**User Story:** As a project stakeholder, I want a systematic validation methodology, so that validation is thorough and consistent.

#### Acceptance Criteria

1. WHEN validating each file THEN the Validation_System SHALL SEARCH using grepSearch, readFile or any available tools to locate and read the file
2. WHEN validating each file THEN the Validation_System SHALL ANALYZE to extract all logic, patterns, dependencies, and flows
3. WHEN validating each file THEN the Validation_System SHALL COMPARE against specification documents
4. WHEN validating each file THEN the Validation_System SHALL IDENTIFY and list all issues (logical, business logic, mismatch, incomplete)
5. WHEN validating each file THEN the Validation_System SHALL CATEGORIZE issues by severity (Critical, High, Medium, Low)
6. WHEN validating each file THEN the Validation_System SHALL DOCUMENT providing WHAT (issue), WHY (impact), HOW (solution)
7. WHEN validating each file THEN the Validation_System SHALL IMPLEMENT corrections with complete, working code
8. WHEN validating each file THEN the Validation_System SHALL TEST to validate fixes with appropriate tests
9. WHEN validating each file THEN the Validation_System SHALL VERIFY to ensure 100% pass rate and 80%+ coverage

### Requirement 8: Cross Validation Approach Requirements

**User Story:** As a project stakeholder, I want cross-validation across all directories, so that changes are consistent throughout the codebase.

#### Acceptance Criteria

1. WHEN performing cross validation for backend phases THEN the Validation_System SHALL validate across the entire `backend/*` structure
2. WHEN performing cross validation for frontend phases THEN the Validation_System SHALL validate across the entire `client/*` structure
3. WHEN performing cross validation THEN the Validation_System SHALL search for all occurrences across: `backend/config/*`, `backend/controllers/*`, `backend/errorHandler/*`, `backend/middlewares/*`, `backend/middlewares/validators/*`, `backend/mock/*`, `backend/models/*`, `backend/models/plugins/*`, `backend/routes/*`, `backend/scripts/*`, `backend/services/*`, `backend/templates/*`, `backend/utils/*`, `backend/.env`, `backend/app.js`, `backend/server.js`
4. WHEN performing cross validation for frontend THEN the Validation_System SHALL search across: `client/src/redux/*`, `client/src/services/*`, `client/src/hooks/*`, `client/src/utils/*`, `client/src/theme/*`, `client/src/components/*`, `client/src/pages/*`, `client/src/layouts/*`, `client/src/router/*`

### Requirement 9: Mandatory Phase Execution Rules

**User Story:** As a project stakeholder, I want strict phase execution rules, so that validation is complete and thorough.

#### Acceptance Criteria

1. WHEN executing a phase THEN the Validation_System SHALL treat each phase as a TASK containing SUB-TASKS where ALL sub-tasks MUST be started and completed TOGETHER with the TASK
2. THE Validation_System SHALL NOT start a sub-task on its own without starting the parent task
3. WHEN executing each phase/task sub-task THEN the Validation_System SHALL perform a SUPER DEEP ANALYSIS using all specification documents against `backend/*` and `client/*`
4. THE Validation_System SHALL use Real MongoDB test database and SHALL NOT use mongodb-memory-server
5. WHEN running a test THEN the Validation_System SHALL NOT skip the test no matter how long it takes
6. THE Validation_System SHALL NOT skip a failed test and SHALL fix all failed tests before proceeding
7. WHEN completing each phase THEN the Validation_System SHALL run `npm test` and ALL tests MUST pass
8. WHEN executing terminal commands THEN the Validation_System SHALL ensure commands are suitable for GitBash WSL VSCode integrated terminal using forward slashes for paths

### Requirement 10: Phase-by-Phase Validation Workflow - Phase 1

**User Story:** As a system architect, I want Phase 1 Backend Core Infrastructure validated, so that the foundation is correct and secure.

#### Acceptance Criteria

1. WHEN starting Phase 1 THEN the Validation_System SHALL perform git status check including branch verification, remote check, uncommitted changes check, and create branch `validate/phase-1-backend-core` if needed
2. WHEN validating Phase 1 THEN the Validation_System SHALL validate 14 files: `backend/config/allowedOrigins.js`, `backend/config/authorizationMatrix.json`, `backend/config/corsOptions.js`, `backend/config/db.js`, `backend/errorHandler/CustomError.js`, `backend/errorHandler/ErrorController.js`, `backend/utils/constants.js`, `backend/utils/logger.js`, `backend/utils/helpers.js`, `backend/utils/generateTokens.js`, `backend/utils/authorizationMatrix.js`, `backend/utils/validateEnv.js`, `backend/app.js`, `backend/server.js`
3. WHEN validating `backend/config/allowedOrigins.js` THEN the Validation_System SHALL verify array exports with development origins (`http://localhost:3000`, `http://localhost:5173`), production environment variables, no wildcard origins in production, and ES module syntax
4. WHEN validating `backend/config/authorizationMatrix.json` THEN the Validation_System SHALL verify all 6 resources (User, Task, Material, Vendor, Organization, Department), all 4 roles (SuperAdmin, Admin, Manager, User), all 4 operations (create, read, update, delete), correct scopes, and Platform SuperAdmin has `crossOrg` for Organization only
5. WHEN validating `backend/config/corsOptions.js` THEN the Validation_System SHALL verify origin validation function, `credentials: true`, methods (GET, POST, PUT, PATCH, DELETE, OPTIONS), allowed headers, exposed headers for rate limiting, `maxAge: 86400`, `optionsSuccessStatus: 200`, `preflightContinue: false`
6. WHEN validating `backend/config/db.js` THEN the Validation_System SHALL verify mongoose.connect(), MONGODB_URI from environment, retry logic with exponential backoff, max 5 attempts, connection options, and winston logging
7. WHEN validating `backend/errorHandler/CustomError.js` THEN the Validation_System SHALL verify class extends Error with statusCode, errorCode, context properties and static methods: validation(400), authentication(401), authorization(403), notFound(404), conflict(409), internal(500)
8. WHEN validating `backend/errorHandler/ErrorController.js` THEN the Validation_System SHALL verify middleware signature `(err, req, res, next)`, winston logging, handling of CustomError, Mongoose ValidationError, CastError, JWT errors, duplicate key errors, consistent error format, and hidden stack trace in production
9. WHEN validating `backend/utils/constants.js` THEN the Validation_System SHALL verify USER_ROLES, TASK_STATUS, TASK_PRIORITY, TASK_TYPES, MATERIAL_CATEGORIES (9), UNIT_TYPES (30+), INDUSTRIES (24), PAGINATION defaults, LIMITS, LENGTH_LIMITS, FILE_SIZE_LIMITS, FILE_TYPES, NOTIFICATION_TYPES (7), ATTACHMENT_TYPES (5)
10. WHEN validating `backend/utils/logger.js` THEN the Validation_System SHALL verify winston.createLogger(), log level from environment, format with timestamp, console transport in development, file transports in production, separate error.log and combined.log, exception handling
11. WHEN validating `backend/utils/generateTokens.js` THEN the Validation_System SHALL verify generateAccessToken (15m expiry, JWT_ACCESS_SECRET), generateRefreshToken (7d expiry, JWT_REFRESH_SECRET), payload with userId, email, role, organization, department
12. WHEN validating `backend/utils/authorizationMatrix.js` THEN the Validation_System SHALL verify checkPermission, getUserScope, validateResourceAccess functions handling all scopes including crossOrg for Platform SuperAdmin on Organization only
13. WHEN validating `backend/utils/validateEnv.js` THEN the Validation_System SHALL verify validation of MONGODB_URI, JWT secrets (min 32 chars), CLIENT_URL, NODE_ENV, email credentials in production
14. WHEN validating `backend/app.js` THEN the Validation_System SHALL verify middleware order (helmet → cors → cookieParser → express.json → mongoSanitize → compression → rateLimiter), rate limiter only in production, routes at /api, error handler last
15. WHEN validating `backend/server.js` THEN the Validation_System SHALL verify `process.env.TZ = "UTC"` as first line, HTTP server creation, Socket.IO initialization, database connection before server start, graceful shutdown handling for SIGTERM and SIGINT
16. WHEN completing Phase 1 THEN the Validation_System SHALL run tests with 100% pass rate, achieve 80%+ coverage, update phase tracker, and merge branch

### Requirement 11: Phase-by-Phase Validation Workflow - Phase 2

**User Story:** As a system architect, I want Phase 2 Backend Models validated, so that data models are correct with proper soft delete and discriminator patterns.

#### Acceptance Criteria

1. WHEN starting Phase 2 THEN the Validation_System SHALL create branch `validate/phase-2-backend-models` and perform git status check
2. WHEN validating Phase 2 THEN the Validation_System SHALL validate 15 files: `backend/models/plugins/softDelete.js`, `backend/models/Organization.js`, `backend/models/Department.js`, `backend/models/User.js`, `backend/models/BaseTask.js`, `backend/models/ProjectTask.js`, `backend/models/RoutineTask.js`, `backend/models/AssignedTask.js`, `backend/models/TaskActivity.js`, `backend/models/TaskComment.js`, `backend/models/Material.js`, `backend/models/Vendor.js`, `backend/models/Attachment.js`, `backend/models/Notification.js`, `backend/models/index.js`
3. WHEN validating `backend/models/plugins/softDelete.js` THEN the Validation_System SHALL verify fields (isDeleted, deletedAt, deletedBy, restoredAt, restoredBy), query helpers (withDeleted, onlyDeleted), instance methods (softDelete, restore), static methods (softDeleteById, restoreById, softDeleteMany, restoreMany, findDeletedByIds, countDeleted, ensureTTLIndex, getRestoreAudit), blocked hard delete methods, session support
4. WHEN validating `backend/models/Organization.js` THEN the Validation_System SHALL verify fields (name unique lowercase max 100, description max 2000, email unique valid max 50, phone unique Ethiopian format, address max 500, industry enum 24 options, logoUrl {url, publicId}, isPlatformOrg immutable indexed, createdBy), partial unique indexes, TTL never, cascade delete, platform org deletion protection
5. WHEN validating `backend/models/Department.js` THEN the Validation_System SHALL verify fields (name max 100, description max 2000, hod ref User, organization required, createdBy), compound unique index {organization, name}, HOD deletion protection, cascade delete, TTL 365 days
6. WHEN validating `backend/models/User.js` THEN the Validation_System SHALL verify all fields, password hashing (bcrypt ≥12 rounds), auto-set isHod from role, auto-set isPlatformUser from organization, compound unique indexes, password reset token hashing, deletion protection for last SuperAdmin/HOD, TTL 365 days
7. WHEN validating `backend/models/BaseTask.js` THEN the Validation_System SHALL verify discriminator base with taskType key, watchers HOD-only validation, tags case-insensitive uniqueness, performance indexes, TTL 180 days, cascade delete
8. WHEN validating `backend/models/ProjectTask.js` THEN the Validation_System SHALL verify discriminator extension with required vendor, cost tracking with history (max 200), date validation (dueDate after startDate), HOD-only watchers
9. WHEN validating `backend/models/RoutineTask.js` THEN the Validation_System SHALL verify discriminator extension with direct materials, required dates, status restriction (cannot be "To Do"), priority restriction (cannot be "Low")
10. WHEN validating `backend/models/AssignedTask.js` THEN the Validation_System SHALL verify discriminator extension with required assignees (max 20), date validation, materials via TaskActivity only
11. WHEN validating `backend/models/TaskActivity.js` THEN the Validation_System SHALL verify parent validation (ProjectTask or AssignedTask only, NOT RoutineTask), materials with quantities, cascade delete, TTL 90 days
12. WHEN validating `backend/models/TaskComment.js` THEN the Validation_System SHALL verify threading with max depth 3, mentions (max 5), recursive cascade delete, TTL 90 days
13. WHEN validating `backend/models/Material.js` THEN the Validation_System SHALL verify category enum (9 options), unitType enum (30+ options), price non-negative, TTL 180 days
14. WHEN validating `backend/models/Vendor.js` THEN the Validation_System SHALL verify Ethiopian phone format validation, ProjectTask check before deletion, TTL 180 days
15. WHEN validating `backend/models/Attachment.js` THEN the Validation_System SHALL verify file type validation, file size limits per type, max 10 per parent, TTL 90 days
16. WHEN validating `backend/models/Notification.js` THEN the Validation_System SHALL verify 7 notification types, TTL index on expiresAt, default 30 days expiry
17. WHEN validating `backend/models/index.js` THEN the Validation_System SHALL verify all 13 models exported using ES module syntax

### Requirement 12: Phase-by-Phase Validation Workflow - Phase 3

**User Story:** As a system architect, I want Phase 3 Backend Middleware & Validators validated, so that authentication, authorization, and request validation work correctly.

#### Acceptance Criteria

1. WHEN starting Phase 3 THEN the Validation_System SHALL create branch `validate/phase-3-backend-middleware` and perform git status check
2. WHEN validating Phase 3 THEN the Validation_System SHALL validate 13 files: `backend/middlewares/authMiddleware.js`, `backend/middlewares/authorization.js`, `backend/middlewares/rateLimiter.js`, `backend/middlewares/validators/validation.js`, and 9 resource validators
3. WHEN validating `backend/middlewares/authMiddleware.js` THEN the Validation_System SHALL verify verifyJWT reads access_token from cookies, verifies with JWT_ACCESS_SECRET, fetches user from database with populated org/dept, attaches to req.user, returns 401 for invalid/expired tokens
4. WHEN validating `backend/middlewares/authorization.js` THEN the Validation_System SHALL verify factory function authorize(resource, operation), checks permissions from authorizationMatrix, validates all scopes (own, ownDept, crossDept, crossOrg), Platform SuperAdmin has crossOrg for Organization only
5. WHEN validating `backend/middlewares/rateLimiter.js` THEN the Validation_System SHALL verify only active in production, general limiter (100 req/15min), auth limiter (5 req/15min), IP-based tracking, rate limit headers
6. WHEN validating `backend/middlewares/validators/validation.js` THEN the Validation_System SHALL verify validationResult usage, matchedData extraction into req.validated.body, req.validated.params, req.validated.query
7. WHEN validating all resource validators THEN the Validation_System SHALL verify all validators import constants from utils/constants.js with no hardcoded values
8. WHEN validating `backend/middlewares/validators/taskValidators.js` THEN the Validation_System SHALL verify RoutineTask status restriction (cannot be "To Do") and priority restriction (cannot be "Low")

### Requirement 13: Phase-by-Phase Validation Workflow - Phase 4

**User Story:** As a system architect, I want Phase 4 Backend Services & Utils validated, so that email, notifications, Socket.IO, and transformations work correctly.

#### Acceptance Criteria

1. WHEN starting Phase 4 THEN the Validation_System SHALL create branch `validate/phase-4-backend-services` and perform git status check
2. WHEN validating Phase 4 THEN the Validation_System SHALL validate 8 files: `backend/services/emailService.js`, `backend/services/notificationService.js`, `backend/utils/socket.js`, `backend/utils/socketEmitter.js`, `backend/utils/socketInstance.js`, `backend/utils/userStatus.js`, `backend/utils/responseTransform.js`, `backend/utils/materialTransform.js`
3. WHEN validating `backend/services/emailService.js` THEN the Validation_System SHALL verify Nodemailer with Gmail SMTP, queue-based sending, retry logic, HTML templates, winston logging
4. WHEN validating `backend/services/notificationService.js` THEN the Validation_System SHALL verify createNotification function, all 7 notification types, expiresAt 30 days, session support
5. WHEN validating Socket.IO infrastructure THEN the Validation_System SHALL verify singleton pattern, room-based broadcasting (user, department, organization rooms), event emission functions (emitToUser, emitToDepartment, emitToOrganization, emitToRecipients)
6. WHEN validating `backend/utils/userStatus.js` THEN the Validation_System SHALL verify updateUserStatus, getUserStatus functions with status types (Online, Offline, Away)
7. WHEN validating `backend/utils/responseTransform.js` THEN the Validation_System SHALL verify formatSuccessResponse, formatPaginationResponse with consistent structure including pagination fields

### Requirement 14: Phase-by-Phase Validation Workflow - Phase 5

**User Story:** As a system architect, I want Phase 5 Backend Controllers validated, so that business logic, authorization, and data operations are correct.

#### Acceptance Criteria

1. WHEN starting Phase 5 THEN the Validation_System SHALL create branch `validate/phase-5-backend-controllers` and perform git status check
2. WHEN validating Phase 5 THEN the Validation_System SHALL validate 9 controller files with 59 functions total using `docs/phase5-controllers-detailed.md`
3. WHEN validating all controllers THEN the Validation_System SHALL verify universal patterns: asyncHandler wrapper, data extraction from req.user and req.validated, session management for write operations, pagination for list operations, soft delete utilities, cascade operations, multi-tenancy isolation, department isolation, ownership checks, Socket.IO events, notifications, response format, error handling, timezone management with UTC
4. WHEN validating `backend/controllers/authControllers.js` THEN the Validation_System SHALL verify registerOrganization (transaction, creates org+dept+user), loginUser (comparePassword, HTTP-only cookies), logoutUser (clears cookies), getRefreshToken (token rotation), forgotPassword (hashes token, ALWAYS returns success), resetPassword (hashes token for comparison)
5. WHEN validating `backend/controllers/userControllers.js` THEN the Validation_System SHALL verify createUser (auto-set isHod/isPlatformUser), getAllUsers (role-based filtering), updateMyProfile (cannot change role/dept), deleteUser (checks last SuperAdmin/HOD)
6. WHEN validating `backend/controllers/organizationControllers.js` THEN the Validation_System SHALL verify getAllOrganizations (platform sees all), updateOrganization (cannot change isPlatformOrg), deleteOrganization (platform only, cannot delete platform org, cascades)
7. WHEN validating `backend/controllers/taskControllers.js` THEN the Validation_System SHALL verify createTask (validates task type, vendor for ProjectTask, assignees for AssignedTask, materials for RoutineTask, watchers HOD only), createTaskActivity (NOT for RoutineTask), createTaskComment (max depth 3)
8. WHEN validating `backend/controllers/vendorControllers.js` THEN the Validation_System SHALL verify deleteVendor checks for linked ProjectTasks and requires reassignment
9. WHEN validating `backend/controllers/materialControllers.js` THEN the Validation_System SHALL verify deleteMaterial checks for linked tasks/activities and requires unlinking

### Requirement 15: Phase-by-Phase Validation Workflow - Phase 6

**User Story:** As a system architect, I want Phase 6 Backend Routes validated, so that middleware chains and route organization are correct.

#### Acceptance Criteria

1. WHEN starting Phase 6 THEN the Validation_System SHALL create branch `validate/phase-6-backend-routes` and perform git status check
2. WHEN validating Phase 6 THEN the Validation_System SHALL validate 10 route files
3. WHEN validating all routes THEN the Validation_System SHALL verify middleware chain order: validators → auth → authorization → controller
4. WHEN validating `backend/routes/authRoutes.js` THEN the Validation_System SHALL verify public routes (register, login, forgot-password, reset-password), protected routes (logout, refresh-token), rate limiting (5/15min)
5. WHEN validating `backend/routes/index.js` THEN the Validation_System SHALL verify all routes mounted at /api prefix with correct paths

### Requirement 16: Phase-by-Phase Validation Workflow - Phase 7

**User Story:** As a frontend architect, I want Phase 7 Frontend Core Infrastructure validated, so that Redux, Socket.IO, and utilities are correctly configured.

#### Acceptance Criteria

1. WHEN starting Phase 7 THEN the Validation_System SHALL create branch `validate/phase-7-frontend-core` and perform git status check
2. WHEN validating Phase 7 THEN the Validation_System SHALL validate 15 files: Redux infrastructure (store.js, api.js, authSlice.js, authApi.js), services (socketService.js, socketEvents.js), hooks (useAuth.js, useSocket.js), utilities (constants.js, errorHandler.js, dateUtils.js, authorizationHelper.js), theme (AppTheme.jsx, themePrimitives.js, customizations/index.js)
3. WHEN validating `client/src/redux/app/store.js` THEN the Validation_System SHALL verify configureStore, api.reducer, authSlice reducer, api.middleware, persistence for auth state
4. WHEN validating `client/src/redux/features/api.js` THEN the Validation_System SHALL verify createApi, baseUrl from environment, `credentials: 'include'`, baseQueryWithReauth handling 401 with token refresh and retry
5. WHEN validating `client/src/services/socketService.js` THEN the Validation_System SHALL verify socket.io-client, withCredentials: true, autoConnect: false, singleton pattern
6. WHEN validating `client/src/services/socketEvents.js` THEN the Validation_System SHALL verify event handlers for task/user/notification events with RTK Query cache invalidation
7. WHEN validating `client/src/utils/constants.js` THEN the Validation_System SHALL verify ALL constants EXACTLY match backend constants
8. WHEN validating `client/src/utils/dateUtils.js` THEN the Validation_System SHALL verify dayjs with utc and timezone plugins, toUTC, fromUTC, formatDate functions

### Requirement 17: Phase-by-Phase Validation Workflow - Phase 8

**User Story:** As a frontend architect, I want Phase 8 Frontend Features validated, so that data fetching and state management work correctly.

#### Acceptance Criteria

1. WHEN starting Phase 8 THEN the Validation_System SHALL create branch `validate/phase-8-frontend-features` and perform git status check
2. WHEN validating Phase 8 THEN the Validation_System SHALL validate 18 feature files (userApi.js, userSlice.js, organizationApi.js, organizationSlice.js, departmentApi.js, departmentSlice.js, taskApi.js, taskSlice.js, materialApi.js, materialSlice.js, vendorApi.js, vendorSlice.js, attachmentApi.js, notificationApi.js, notificationSlice.js)
3. WHEN validating RTK Query APIs THEN the Validation_System SHALL verify injectEndpoints pattern, pagination conversion (frontend 0-based → backend 1-based), proper tags for cache invalidation, credentials included
4. WHEN validating slices THEN the Validation_System SHALL verify correct initial state, reducers handle all actions, selectors exported

### Requirement 18: Phase-by-Phase Validation Workflow - Phase 9

**User Story:** As a frontend architect, I want Phase 9 Frontend Components validated, so that UI components follow MUI v7 patterns and performance best practices.

#### Acceptance Criteria

1. WHEN starting Phase 9 THEN the Validation_System SHALL create branch `validate/phase-9-frontend-components` and perform git status check
2. WHEN validating Phase 9 THEN the Validation_System SHALL validate 70+ component files including common components, card components, column definitions, filter components, form components, list components, auth components
3. WHEN validating MuiDataGrid THEN the Validation_System SHALL verify server-side pagination (paginationMode: "server"), auto-conversion (0-based MUI ↔ 1-based backend), loading state, empty message, row count from backend
4. WHEN validating MuiDialog THEN the Validation_System SHALL verify disableEnforceFocus, disableRestoreFocus, ARIA attributes
5. WHEN validating form components THEN the Validation_System SHALL verify react-hook-form with Controller and SHALL verify watch() method is NEVER used
6. WHEN validating card components THEN the Validation_System SHALL verify React.memo wrapper, displayName, useCallback for event handlers, useMemo for computed values
7. WHEN validating MUI Grid THEN the Validation_System SHALL verify size prop usage (NOT item prop) for MUI v7

### Requirement 19: Phase-by-Phase Validation Workflow - Phase 10

**User Story:** As a frontend architect, I want Phase 10 Frontend Pages & Routing validated, so that navigation, layouts, and data display work correctly.

#### Acceptance Criteria

1. WHEN starting Phase 10 THEN the Validation_System SHALL create branch `validate/phase-10-frontend-pages` and perform git status check
2. WHEN validating Phase 10 THEN the Validation_System SHALL validate 18 files: 12 pages, 3 layouts, 1 routing file, 2 app entry files
3. WHEN validating pages THEN the Validation_System SHALL verify DataGrid pattern for admin views, three-layer pattern for user views, RTK Query for data fetching, loading states, error handling, empty states, filters, create/update dialogs
4. WHEN validating layouts THEN the Validation_System SHALL verify RootLayout (providers, router, toast, error boundary), PublicLayout (simple auth layout), DashboardLayout (header, sidebar, footer, notifications)
5. WHEN validating routing THEN the Validation_System SHALL verify lazy loading for all pages, ProtectedRoute wrapper, PublicRoute wrapper, 404 page
6. WHEN validating App.jsx THEN the Validation_System SHALL verify Socket.IO connection on mount and event handlers setup

### Requirement 20: Phase-by-Phase Validation Workflow - Phase 11

**User Story:** As a QA engineer, I want Phase 11 Testing & QA validated, so that testing is comprehensive and reliable.

#### Acceptance Criteria

1. WHEN starting Phase 11 THEN the Validation_System SHALL create branch `validate/phase-11-testing-qa` and perform git status check
2. WHEN validating Phase 11 THEN the Validation_System SHALL validate test configuration files and all test suites
3. WHEN validating Jest configuration THEN the Validation_System SHALL verify testEnvironment: "node", ES modules transform, extensionsToTreatAsEsm, testTimeout: 30000, maxWorkers: 1
4. WHEN validating global setup THEN the Validation_System SHALL verify connection to real MongoDB (NOT mongodb-memory-server), test database creation
5. WHEN validating test quality THEN the Validation_System SHALL verify 100% pass rate, 80%+ statements coverage, 75%+ branches coverage, 80%+ functions coverage, 80%+ lines coverage, no skipped tests, Arrange-Act-Assert pattern
6. WHEN validating property-based tests THEN the Validation_System SHALL verify fast-check library usage, authorization matrix tests, soft delete tests, cascade operation tests

### Requirement 21: Phase-by-Phase Validation Workflow - Phase 12

**User Story:** As a DevOps engineer, I want Phase 12 Final Integration & Deployment validated, so that the application is production-ready.

#### Acceptance Criteria

1. WHEN starting Phase 12 THEN the Validation_System SHALL create branch `validate/phase-12-final-integration` and perform git status check
2. WHEN validating environment configuration THEN the Validation_System SHALL verify all required variables documented, example values provided, validation script works, no secrets in repository
3. WHEN validating build process THEN the Validation_System SHALL verify backend npm start works, frontend npm run build works, frontend outputs to dist/, backend serves static files in production
4. WHEN validating production readiness THEN the Validation_System SHALL verify security middleware, rate limiting in production, CORS for production, logging, error handling, no console.log, environment validation on startup
5. WHEN validating security THEN the Validation_System SHALL verify JWT in HTTP-only cookies, bcrypt ≥12 rounds, helmet headers, CORS with credentials, NoSQL injection prevention, rate limiting, password reset token hashing, email enumeration prevention
6. WHEN validating seed data THEN the Validation_System SHALL verify platform organization, platform SuperAdmin, sample customer organization, departments, users, tasks created

### Requirement 22: Final Validation Checklist Requirements - Backend

**User Story:** As a project stakeholder, I want a comprehensive backend validation checklist, so that all backend requirements are verified.

#### Acceptance Criteria

1. WHEN completing validation THEN the Validation_System SHALL verify all 14 files in Phase 1 validated and corrected
2. WHEN completing validation THEN the Validation_System SHALL verify all 15 models in Phase 2 validated and corrected
3. WHEN completing validation THEN the Validation_System SHALL verify all 13 middleware/validators in Phase 3 validated and corrected
4. WHEN completing validation THEN the Validation_System SHALL verify all 8 services/utils in Phase 4 validated and corrected
5. WHEN completing validation THEN the Validation_System SHALL verify all 9 controllers in Phase 5 validated and corrected
6. WHEN completing validation THEN the Validation_System SHALL verify all 10 routes in Phase 6 validated and corrected
7. WHEN completing validation THEN the Validation_System SHALL verify all tests pass (100%), coverage ≥80%, no lint errors, no console.log in production code
8. WHEN completing validation THEN the Validation_System SHALL verify all constants imported from utils/constants.js, all ES module syntax, soft delete plugin applied to all models
9. WHEN completing validation THEN the Validation_System SHALL verify authorization matrix enforced everywhere, multi-tenancy isolation enforced, HOD rules enforced, task type restrictions enforced
10. WHEN completing validation THEN the Validation_System SHALL verify cascade operations use transactions, Socket.IO events emitted correctly

### Requirement 23: Final Validation Checklist Requirements - Frontend

**User Story:** As a project stakeholder, I want a comprehensive frontend validation checklist, so that all frontend requirements are verified.

#### Acceptance Criteria

1. WHEN completing validation THEN the Validation_System SHALL verify all 15 core files in Phase 7 validated and corrected
2. WHEN completing validation THEN the Validation_System SHALL verify all 18 feature files in Phase 8 validated and corrected
3. WHEN completing validation THEN the Validation_System SHALL verify all 70+ component files in Phase 9 validated and corrected
4. WHEN completing validation THEN the Validation_System SHALL verify all 18 page/layout/routing files in Phase 10 validated and corrected
5. WHEN completing validation THEN the Validation_System SHALL verify constants EXACTLY match backend, RTK Query for ALL API calls, NEVER use watch() in react-hook-form
6. WHEN completing validation THEN the Validation_System SHALL verify MUI v7 size prop (NOT item prop), React.memo for Card components, useCallback for event handlers, useMemo for computed values
7. WHEN completing validation THEN the Validation_System SHALL verify DataGrid pagination conversion correct, Socket.IO cache invalidation works, error boundaries in place, loading states everywhere, empty states everywhere, no lint errors

### Requirement 24: Final Validation Checklist Requirements - Integration

**User Story:** As a project stakeholder, I want a comprehensive integration validation checklist, so that end-to-end functionality is verified.

#### Acceptance Criteria

1. WHEN completing validation THEN the Validation_System SHALL verify backend and frontend communicate correctly
2. WHEN completing validation THEN the Validation_System SHALL verify authentication flow works end-to-end
3. WHEN completing validation THEN the Validation_System SHALL verify authorization enforced on frontend and backend
4. WHEN completing validation THEN the Validation_System SHALL verify Socket.IO real-time updates work
5. WHEN completing validation THEN the Validation_System SHALL verify file uploads work (Cloudinary), email sending works (Nodemailer)
6. WHEN completing validation THEN the Validation_System SHALL verify notifications created and displayed, soft delete and restore work, cascade operations work
7. WHEN completing validation THEN the Validation_System SHALL verify multi-tenancy isolation works, platform organization cannot be deleted, HOD rules enforced, task type restrictions enforced

### Requirement 25: Final Validation Checklist Requirements - Quality Assurance

**User Story:** As a project stakeholder, I want a comprehensive QA validation checklist, so that quality standards are met.

#### Acceptance Criteria

1. WHEN completing validation THEN the Validation_System SHALL verify all tests pass (100%), coverage ≥80%, no skipped tests
2. WHEN completing validation THEN the Validation_System SHALL verify no TODO comments, no console.log statements, no hardcoded values
3. WHEN completing validation THEN the Validation_System SHALL verify all error scenarios handled, all edge cases tested
4. WHEN completing validation THEN the Validation_System SHALL verify performance optimized, security best practices followed

### Requirement 26: Final Validation Checklist Requirements - Documentation

**User Story:** As a project stakeholder, I want a comprehensive documentation validation checklist, so that documentation is complete.

#### Acceptance Criteria

1. WHEN completing validation THEN the Validation_System SHALL verify README complete with setup instructions
2. WHEN completing validation THEN the Validation_System SHALL verify API documentation complete
3. WHEN completing validation THEN the Validation_System SHALL verify architecture documented
4. WHEN completing validation THEN the Validation_System SHALL verify deployment instructions provided
5. WHEN completing validation THEN the Validation_System SHALL verify environment variables documented
6. WHEN completing validation THEN the Validation_System SHALL verify phase tracker updated

### Requirement 27: Completion Criteria Requirements

**User Story:** As a project stakeholder, I want clear completion criteria, so that validation is only considered complete when all requirements are met.

#### Acceptance Criteria

1. THE Validation_System SHALL only consider validation complete when ALL 12 phases are completed
2. THE Validation_System SHALL only consider validation complete when ALL files are validated against specifications
3. THE Validation_System SHALL only consider validation complete when ALL issues are corrected with complete code
4. THE Validation_System SHALL only consider validation complete when ALL tests pass (100%)
5. THE Validation_System SHALL only consider validation complete when ALL coverage ≥80%
6. THE Validation_System SHALL only consider validation complete when ALL lint errors are resolved
7. THE Validation_System SHALL only consider validation complete when ALL integration tests pass
8. THE Validation_System SHALL only consider validation complete when ALL documentation is updated
9. THE Validation_System SHALL only consider validation complete when phase tracker shows all phases complete
10. THE Validation_System SHALL only consider validation complete when final checklist is 100% complete

### Requirement 28: Important Notes Requirements

**User Story:** As a project stakeholder, I want important notes documented, so that critical rules are not forgotten.

#### Acceptance Criteria

1. THE Validation_System SHALL perform cross validation for every phase across ALL relevant directories
2. THE Validation_System SHALL NOT skip any file, line, or requirement
3. THE Validation_System SHALL NOT proceed to next phase until test coverage ≥80% is achieved
4. THE Validation_System SHALL follow git workflow: create branch, commit changes, merge to main, delete branch
5. THE Validation_System SHALL update `docs/dev-phase-tracker.md` after each phase completion
6. THE Validation_System SHALL always refer to specification documents: `docs/build-prompt.md`, `docs/validate-correct-update-enhance-complete.md`, `docs/phase5-controllers-detailed.md`, `docs/dev-phase-tracker.md`
7. THE Validation_System SHALL NEVER hardcode values and SHALL always import from utils/constants.js
8. THE Validation_System SHALL use ES module syntax throughout (import/export, not require/module.exports)
9. THE Validation_System SHALL ensure all models use the soft delete plugin
10. THE Validation_System SHALL ensure all write operations use MongoDB transactions
11. THE Validation_System SHALL use Real MongoDB test database (NOT mongodb-memory-server)
12. THE Validation_System SHALL ensure every terminal command is suitable for GitBash WSL VSCode integrated terminal
13. THE Validation_System SHALL treat each phase as a TASK with SUB-TASKS where ALL sub-tasks MUST be started and completed TOGETHER
14. THE Validation_System SHALL perform SUPER DEEP ANALYSIS on each phase/task sub-task using all specification documents
15. THE Validation_System SHALL NOT skip tests no matter how long they take and SHALL NOT skip failed tests
16. THE Validation_System SHALL run `npm test` at the END of EACH phase and ALL tests MUST pass
