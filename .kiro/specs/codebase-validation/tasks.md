# Implementation Plan

- [-] 1. Phase 1: Backend Core Infrastructure Validation

  - [x] 1.1 Perform git status check and create branch `validate/phase-1-backend-core`

    - Check current branch, verify if branch exists locally/remotely

    - Create branch from main if needed
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 10.1_

  - [x] 1.2 Perform super deep analysis using all specification documents against backend/_ and client/_

    - Read and analyze docs/prompt.md, docs/build-prompt.md, docs/validate-correct-update-enhance-complete.md, docs/phase5-controllers-detailed.md, docs/dev-phase-tracker.md
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3_

  - [x] 1.3 Validate and correct backend/config/allowedOrigins.js

    - Verify array exports, development origins, production env vars, no wildcards, ES module syntax
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 10.3_

  - [x] 1.4 Validate and correct backend/config/authorizationMatrix.json

    - Verify 6 resources, 4 roles, 4 operations, correct scopes, Platform SuperAdmin crossOrg for Organization only
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 10.4_

  - [ ] 1.5 Validate and correct backend/config/corsOptions.js

    - Verify origin validation function, credentials, methods, headers, maxAge, optionsSuccessStatus

    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 10.5_

  - [ ] 1.6 Validate and correct backend/config/db.js

    - Verify mongoose.connect, MONGODB_URI, retry logic, max 5 attempts, winston logging

    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 10.6_

  - [ ] 1.7 Validate and correct backend/errorHandler/CustomError.js

    - Verify class extends Error, static methods for all error types with correct status codes

    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 10.7_

  - [ ] 1.8 Validate and correct backend/errorHandler/ErrorController.js

    - Verify middleware signature, error handling for all types, hidden stack in production
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 10.8_

  - [ ] 1.9 Validate and correct backend/utils/constants.js

    - Verify all constants: USER_ROLES, TASK_STATUS, TASK_PRIORITY, TASK_TYPES, MATERIAL_CATEGORIES, UNIT_TYPES, INDUSTRIES, PAGINATION, LIMITS, FILE_SIZE_LIMITS, NOTIFICATION_TYPES, ATTACHMENT_TYPES

    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 10.9_

  - [ ] 1.10 Validate and correct backend/utils/logger.js

    - Verify winston configuration, log levels, transports, exception handling

    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 10.10_

  - [ ] 1.11 Validate and correct backend/utils/helpers.js

    - Verify helper functions match specifications

    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 10.2_

  - [ ] 1.12 Validate and correct backend/utils/generateTokens.js

    - Verify access token (15m), refresh token (7d), separate secrets, payload fields

    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 10.11_

  - [ ] 1.13 Validate and correct backend/utils/authorizationMatrix.js

    - Verify checkPermission, getUserScope, validateResourceAccess functions

    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 10.12_

  - [ ] 1.14 Validate and correct backend/utils/validateEnv.js

    - Verify validation of MONGODB_URI, JWT secrets (min 32 chars), CLIENT_URL, NODE_ENV

    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 10.13_

  - [ ] 1.15 Validate and correct backend/app.js

    - Verify middleware order, rate limiter only in production, routes at /api, error handler last
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 10.14_

  - [ ] 1.16 Validate and correct backend/server.js

    - Verify TZ=UTC first line, HTTP server, Socket.IO init, DB connection before start, graceful shutdown

    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 10.15_

  - [ ] 1.17 Write property test for authorization matrix enforcement

    - **Property 7: Authorization Matrix Enforcement**
    - **Validates: Requirements 10.4, 12.4, 14.3**

    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3_

  - [ ] 1.18 Write unit tests for Phase 1 files

    - Create tests in backend/tests/unit/ for config, errorHandler, utils
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 10.16_

  - [ ] 1.19 Checkpoint - Ensure all tests pass

    - Run `npm test` in backend directory
    - Verify 100% pass rate and ≥80% coverage

    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 9.7, 10.16_

  - [ ] 1.20 Update phase tracker and merge branch

    - Update docs/dev-phase-tracker.md with Phase 1 completion
    - Merge validate/phase-1-backend-core to main
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 10.16_

- [ ] 2. Phase 2: Backend Models Validation

  - [ ] 2.1 Perform git status check and create branch `validate/phase-2-backend-models`
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 11.1_
  - [ ] 2.2 Validate and correct backend/models/plugins/softDelete.js
    - Verify fields, query helpers, instance methods, static methods, blocked hard delete, session support
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 11.3_
  - [ ] 2.3 Write property test for soft delete plugin
    - **Property 5: Soft Delete Plugin Application**
    - **Validates: Requirements 11.3, 22.8, 28.9**
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3_
  - [ ] 2.4 Validate and correct backend/models/Organization.js
    - Verify fields, partial unique indexes, TTL never, cascade delete, platform org deletion protection
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 11.4_
  - [ ] 2.5 Validate and correct backend/models/Department.js
    - Verify fields, compound unique index, HOD deletion protection, cascade delete, TTL 365 days
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 11.5_
  - [ ] 2.6 Validate and correct backend/models/User.js
    - Verify all fields, password hashing, auto-set isHod/isPlatformUser, unique indexes, deletion protection
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 11.6_
  - [ ] 2.7 Validate and correct backend/models/BaseTask.js
    - Verify discriminator base, watchers HOD-only, tags uniqueness, indexes, TTL 180 days
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 11.7_
  - [ ] 2.8 Validate and correct backend/models/ProjectTask.js
    - Verify discriminator extension, required vendor, cost tracking, date validation, HOD watchers
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 11.8_
  - [ ] 2.9 Write property test for HOD watcher restriction
    - **Property 10: HOD Watcher Restriction**
    - **Validates: Requirements 5.5, 11.6, 14.7**
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3_
  - [ ] 2.10 Validate and correct backend/models/RoutineTask.js
    - Verify discriminator extension, direct materials, required dates, status/priority restrictions
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 11.9_
  - [ ] 2.11 Write property test for task type restrictions
    - **Property 9: Task Type Restrictions**
    - **Validates: Requirements 5.6, 11.9, 12.8, 14.7**
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3_
  - [ ] 2.12 Validate and correct backend/models/AssignedTask.js
    - Verify discriminator extension, required assignees, date validation, materials via TaskActivity
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 11.10_
  - [ ] 2.13 Validate and correct backend/models/TaskActivity.js
    - Verify parent validation (NOT RoutineTask), materials, cascade delete, TTL 90 days
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 11.11_
  - [ ] 2.14 Validate and correct backend/models/TaskComment.js
    - Verify threading max depth 3, mentions max 5, recursive cascade delete, TTL 90 days
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 11.12_
  - [ ] 2.15 Validate and correct backend/models/Material.js
    - Verify category enum, unitType enum, price non-negative, TTL 180 days
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 11.13_
  - [ ] 2.16 Validate and correct backend/models/Vendor.js
    - Verify Ethiopian phone format, ProjectTask check before deletion, TTL 180 days
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 11.14_
  - [ ] 2.17 Validate and correct backend/models/Attachment.js
    - Verify file type validation, file size limits, max 10 per parent, TTL 90 days
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 11.15_
  - [ ] 2.18 Validate and correct backend/models/Notification.js
    - Verify 7 notification types, TTL index on expiresAt, default 30 days expiry
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 11.16_
  - [ ] 2.19 Validate and correct backend/models/index.js
    - Verify all 13 models exported using ES module syntax
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 11.17_
  - [ ] 2.20 Write unit tests for Phase 2 models
    - Create tests in backend/tests/unit/models/
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 11.2_
  - [ ] 2.21 Checkpoint - Ensure all tests pass
    - Run `npm test` in backend directory
    - Verify 100% pass rate and ≥80% coverage
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 9.7_
  - [ ] 2.22 Update phase tracker and merge branch
    - Update docs/dev-phase-tracker.md with Phase 2 completion
    - Merge validate/phase-2-backend-models to main
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 11.2_

- [ ] 3. Phase 3: Backend Middleware & Validators Validation

  - [ ] 3.1 Perform git status check and create branch `validate/phase-3-backend-middleware`
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 12.1_
  - [ ] 3.2 Validate and correct backend/middlewares/authMiddleware.js
    - Verify JWT from cookies, user fetch with populated refs, 401 for invalid tokens
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 12.3_
  - [ ] 3.3 Write property test for HTTP-only cookie authentication
    - **Property 8: HTTP-Only Cookie Authentication**
    - **Validates: Requirements 14.4, 21.5**
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3_
  - [ ] 3.4 Validate and correct backend/middlewares/authorization.js
    - Verify factory function, scope validation, Platform SuperAdmin crossOrg for Organization only
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 12.4_
  - [ ] 3.5 Validate and correct backend/middlewares/rateLimiter.js
    - Verify production only, general limiter 100/15min, auth limiter 5/15min, IP tracking
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 12.5_
  - [ ] 3.6 Validate and correct backend/middlewares/validators/validation.js
    - Verify validationResult, matchedData extraction to req.validated
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 12.6_
  - [ ] 3.7 Validate and correct all resource validators
    - Verify constants import, no hardcoded values, field validations match models
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 12.7_
  - [ ] 3.8 Validate and correct backend/middlewares/validators/taskValidators.js
    - Verify RoutineTask status/priority restrictions
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 12.8_
  - [ ] 3.9 Write unit tests for Phase 3 middleware
    - Create tests in backend/tests/unit/middlewares/
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 12.2_
  - [ ] 3.10 Checkpoint - Ensure all tests pass
    - Run `npm test` in backend directory
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 9.7_
  - [ ] 3.11 Update phase tracker and merge branch
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 12.2_

- [ ] 4. Phase 4: Backend Services & Utils Validation

  - [ ] 4.1 Perform git status check and create branch `validate/phase-4-backend-services`
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 13.1_
  - [ ] 4.2 Validate and correct backend/services/emailService.js
    - Verify Nodemailer, Gmail SMTP, queue-based sending, retry logic
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 13.3_
  - [ ] 4.3 Validate and correct backend/services/notificationService.js
    - Verify createNotification, 7 types, expiresAt 30 days, session support
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 13.4_
  - [ ] 4.4 Validate and correct backend/utils/socketInstance.js
    - Verify singleton pattern, initializeSocket, getIO throws before init
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 13.5_
  - [ ] 4.5 Validate and correct backend/utils/socket.js
    - Verify setupSocketHandlers, room joining, disconnect handling
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 13.5_
  - [ ] 4.6 Validate and correct backend/utils/socketEmitter.js
    - Verify emitToUser, emitToDepartment, emitToOrganization, emitToRecipients
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 13.5_
  - [ ] 4.7 Validate and correct backend/utils/userStatus.js
    - Verify updateUserStatus, getUserStatus, status types
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 13.6_
  - [ ] 4.8 Validate and correct backend/utils/responseTransform.js
    - Verify formatSuccessResponse, formatPaginationResponse
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 13.7_
  - [ ] 4.9 Validate and correct backend/utils/materialTransform.js
    - Verify material transformation functions
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 13.2_
  - [ ] 4.10 Write unit tests for Phase 4 services and utils
    - Create tests in backend/tests/unit/services/ and backend/tests/unit/utils/
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 13.2_
  - [ ] 4.11 Checkpoint - Ensure all tests pass
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 9.7_
  - [ ] 4.12 Update phase tracker and merge branch
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 13.2_

- [ ] 5. Phase 5: Backend Controllers Validation

  - [ ] 5.1 Perform git status check and create branch `validate/phasend-controllers`
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 14.1_
  - [ ] 5.2 Validate and correct backend/controllers/authControllers.js
    - Verify registerOrganization, loginUser, logoutUser, getRefreshToken, forgotPassword, resetPassword
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 14.4_
  - [ ] 5.3 Validate and correct backend/controllers/userControllers.js
    - Verify createUser, getAllUsers, getUser, updateUserBy, updateMyProfile, getMyAccount, deleteUser, restoreUser
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 14.5_
  - [ ] 5.4 Validate and correct backend/controllers/organizationControllers.js
    - Verify getAllOrganizations, getOrganizationDashboard, updateOrganization, deleteOrganization, restoreOrganization
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 14.6_
  - [ ] 5.5 Validate and correct backend/controllers/departmentControllers.js
    - Verify createDepartment, getAllDepartments, getDepartment, updateDepartment, deleteDepartment, restoreDepartment
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 14.2_
  - [ ] 5.6 Validate and correct backend/controllers/taskControllers.js
    - Verify all 18 task controller functions including activities and comments
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 14.7_
  - [ ] 5.7 Write property test for transaction usage
    - **Property 6: Transaction Usage for Write Operations**
    - **Validates: Requirements 14.3, 22.10, 28.10**
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3_
  - [ ] 5.8 Validate and correct backend/controllers/materialControllers.js
    - Verify createMaterial, getAllMaterials, getMaterial, updateMaterial, deleteMaterial, restoreMaterial
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 14.9_
  - [ ] 5.9 Validate and correct backend/controllers/vendorControllers.js
    - Verify createVendor, getAllVendors, getVendor, updateVendor, deleteVendor, restoreVendor
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 14.8_
  - [ ] 5.10 Validate and correct backend/controllers/attachmentControllers.js
    - Verify createAttachment, getAllAttachments, getAttachment, updateAttachment, deleteAttachment
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 14.2_
  - [ ] 5.11 Validate and correct backend/controllers/notificationControllers.js
    - Verify getAllNotifications, markNotificationRead, getUnreadCount
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 14.2_
  - [ ] 5.12 Write unit tests for Phase 5 controllers
    - Create tests in backend/tests/unit/controllers/
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 14.2_
  - [ ] 5.13 Checkpoint - Ensure all tests pass
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 9.7_
  - [ ] 5.14 Update phase tracker and merge branch
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 14.2_

- [ ] 6. Phase 6: Backend Routes & Integration Validation

  - [ ] 6.1 Perform git status check and create branch `validate/phase-6-backend-routes`
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 15.1_
  - [ ] 6.2 Validate and correct backend/routes/authRoutes.js
    - Verify public routes, protected routes, rate limiting
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 15.4_
  - [ ] 6.3 Validate and correct backend/routes/userRoutes.js
    - Verify middleware chain: validators → auth → authorization → controller
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 15.3_
  - [ ] 6.4 Validate and correct backend/routes/organizationRoutes.js
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 15.3_
  - [ ] 6.5 Validate and correct backend/routes/departmentRoutes.js
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 15.3_
  - [ ] 6.6 Validate and correct backend/routes/taskRoutes.js
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 15.3_
  - [ ] 6.7 Validate and correct backend/routes/materialRoutes.js
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 15.3_
  - [ ] 6.8 Validate and correct backend/routes/vendorRoutes.js
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 15.3_
  - [ ] 6.9 Validate and correct backend/routes/attachmentRoutes.js
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 15.3_
  - [ ] 6.10 Validate and correct backend/routes/notificationRoutes.js
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 15.3_
  - [ ] 6.11 Validate and correct backend/routes/index.js
    - Verify all routes mounted at /api prefix
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 15.5_
  - [ ] 6.12 Write integration tests for Phase 6 routes
    - Create tests in backend/tests/integration/routes/
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 15.2_
  - [ ] 6.13 Checkpoint - Ensure all tests pass
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 9.7_
  - [ ] 6.14 Update phase tracker and merge branch
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 15.2_

- [ ] 7. Phase 7: Frontend Core Infrastructure Validation

  - [ ] 7.1 Perform git status check and create branch `validate/phase-7-frontend-core`
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 16.1_
  - [ ] 7.2 Validate and correct client/src/redux/app/store.js
    - Verify configureStore, reducers, middleware, persistence
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 16.3_
  - [ ] 7.3 Validate and correct client/src/redux/features/api.js
    - Verify createApi, baseUrl, credentials: 'include', 401 handling with token refresh
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 16.4_
  - [ ] 7.4 Validate and correct client/src/redux/features/auth/authSlice.js
    - Verify initial state, reducers, selectors
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 16.2_
  - [ ] 7.5 Validate and correct client/src/redux/features/auth/authApi.js
    - Verify all auth endpoints
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 16.2_
  - [ ] 7.6 Validate and correct client/src/services/socketService.js
    - Verify socket.io-client, withCredentials, autoConnect: false, singleton
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 16.5_
  - [ ] 7.7 Validate and correct client/src/services/socketEvents.js
    - Verify event handlers, RTK Query cache invalidation
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 16.6_
  - [ ] 7.8 Validate and correct client/src/hooks/useAuth.js
    - Verify useSelector, return values
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 16.2_
  - [ ] 7.9 Validate and correct client/src/hooks/useSocket.js
    - Verify connection lifecycle
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 16.2_
  - [ ] 7.10 Validate and correct client/src/utils/constants.js
    - Verify ALL constants EXACTLY match backend
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 16.7_
  - [ ] 7.11 Write property test for constants consistency
    - **Property 4: Constants Consistency**
    - **Validates: Requirements 16.7, 23.5**
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3_
  - [ ] 7.12 Validate and correct client/src/utils/errorHandler.js
    - Verify handleError function
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 16.2_
  - [ ] 7.13 Validate and correct client/src/utils/dateUtils.js
    - Verify dayjs with utc/timezone plugins
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 16.8_
  - [ ] 7.14 Validate and correct client/src/utils/authorizationHelper.js
    - Verify canAccess, hasScope functions
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 16.2_
  - [ ] 7.15 Validate and correct client/src/theme/AppTheme.jsx
    - Verify ThemeProvider, light/dark mode
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 16.2_
  - [ ] 7.16 Validate and correct client/src/theme/themePrimitives.js
    - Verify color palette, spacing, typography
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 16.2_
  - [ ] 7.17 Validate and correct client/src/theme/customizations/index.js
    - Verify MUI v7 customizations
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 16.2_
  - [ ] 7.18 Write unit tests for Phase 7 frontend core
    - Create tests in client/src/**tests**/
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 16.2_
  - [ ] 7.19 Checkpoint - Ensure all tests pass and no lint errors
    - Run `npm test` and `npm run lint` in client directory
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 9.7_
  - [ ] 7.20 Update phase tracker and merge branch
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 16.2_

- [ ] 8. Phase 8: Frontend Features Validation

  - [ ] 8.1 Perform git status check and create branch `validate/phase-8-frontend-features`
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 17.1_
  - [ ] 8.2 Validate and correct client/src/redux/features/user/userApi.js and userSlice.js
    - Verify injectEndpoints, pagination conversion, tags, selectors
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 17.3, 17.4_
  - [ ] 8.3 Validate and correct client/src/redux/features/organization/organizationApi.js and organizationSlice.js
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 17.3, 17.4_
  - [ ] 8.4 Validate and correct client/src/redux/features/department/departmentApi.js and departmentSlice.js
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 17.3, 17.4_
  - [ ] 8.5 Validate and correct client/src/redux/features/task/taskApi.js and taskSlice.js
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 17.3, 17.4_
  - [ ] 8.6 Validate and correct client/src/redux/features/material/materialApi.js and materialSlice.js
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 17.3, 17.4_
  - [ ] 8.7 Validate and correct client/src/redux/features/vendor/vendorApi.js and vendorSlice.js
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 17.3, 17.4_
  - [ ] 8.8 Validate and correct client/src/redux/features/attachment/attachmentApi.js
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 17.3_
  - [ ] 8.9 Validate and correct client/src/redux/features/notification/notificationApi.js and notificationSlice.js
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 17.3, 17.4_
  - [ ] 8.10 Write unit tests for Phase 8 frontend features
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 17.2_
  - [ ] 8.11 Checkpoint - Ensure all tests pass and no lint errors
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 9.7_
  - [ ] 8.12 Update phase tracker and merge branch
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 17.2_

- [ ] 9. Phase 9: Frontend Components Validation

  - [ ] 9.1 Perform git status check and create branch `validate/phase-9-frontend-components`
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 18.1_
  - [ ] 9.2 Validate and correct common components (MuiDataGrid, MuiDialog, etc.)
    - Verify server-side pagination, disableEnforceFocus, ARIA attributes
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 18.3, 18.4_
  - [ ] 9.3 Validate and correct form components
    - Verify react-hook-form with Controller, NO watch() usage
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 18.5_
  - [ ] 9.4 Validate and correct card components
    - Verify React.memo, displayName, useCallback, useMemo
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 18.6_
  - [ ] 9.5 Validate and correct column definitions
    - Verify action column settings, field names
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 18.2_
  - [ ] 9.6 Validate and correct filter components
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 18.2_
  - [ ] 9.7 Validate and correct list components
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 18.2_
  - [ ] 9.8 Validate and correct auth components
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 18.2_
  - [ ] 9.9 Validate MUI Grid usage
    - Verify size prop (NOT item prop) for MUI v7
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 18.7_
  - [ ] 9.10 Write unit tests for Phase 9 components
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 18.2_
  - [ ] 9.11 Checkpoint - Ensure all tests pass and no lint errors
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 9.7_
  - [ ] 9.12 Update phase tracker and merge branch
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 18.2_

- [ ] 10. Phase 10: Frontend Pages & Routing Validation

  - [ ] 10.1 Perform git status check and create branch `validate/phase-10-frontend-pages`
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 19.1_
  - [ ] 10.2 Validate and correct all page components
    - Verify DataGrid pattern for admin views, three-layer pattern for user views
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 19.3_
  - [ ] 10.3 Validate and correct layout components
    - Verify RootLayout, PublicLayout, DashboardLayout
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 19.4_
  - [ ] 10.4 Validate and correct client/src/router/routes.jsx
    - Verify lazy loading, ProtectedRoute, PublicRoute, 404 page
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 19.5_
  - [ ] 10.5 Validate and correct client/src/App.jsx
    - Verify Socket.IO connection on mount
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 19.6_
  - [ ] 10.6 Validate and correct client/src/main.jsx
    - Verify React 19 createRoot, StrictMode
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 19.2_
  - [ ] 10.7 Write unit tests for Phase 10 pages and routing
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 19.2_
  - [ ] 10.8 Checkpoint - Ensure all tests pass and no lint errors
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 9.7_
  - [ ] 10.9 Update phase tracker and merge branch
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 19.2_

- [ ] 11. Phase 11: Testing & Quality Assurance Validation

  - [ ] 11.1 Perform git status check and create branch `validate/phase-11-testing-qa`
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 20.1_
  - [ ] 11.2 Validate and correct backend/jest.config.js
    - Verify testEnvironment, ES modules, testTimeout, maxWorkers
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 20.3_
  - [ ] 11.3 Validate and correct backend/tests/globalSetup.js
    - Verify real MongoDB connection (NOT mongodb-memory-server)
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 20.4_
  - [ ] 11.4 Validate and correct backend/tests/globalTeardown.js
    - Verify database cleanup, connection close
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 20.2_
  - [ ] 11.5 Validate and correct backend/tests/setup.js
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 20.2_
  - [ ] 11.6 Validate all existing unit tests
    - Verify Arrange-Act-Assert pattern, no skipped tests, no console.log
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 20.5_
  - [ ] 11.7 Validate all existing property tests
    - Verify fast-check usage, authorization tests, soft delete tests
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 20.6_
  - [ ] 11.8 Write property test for cross-validation consistency
    - **Property 1: Cross-Validation Consistency**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3_
  - [ ] 11.9 Write property test for test pass rate invariant
    - **Property 2: Test Pass Rate Invariant**
    - **Validates: Requirements 9.6, 9.7, 27.4**
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3_
  - [ ] 11.10 Write property test for coverage threshold invariant
    - **Property 3: Coverage Threshold Invariant**
    - **Validates: Requirements 20.5, 27.5**
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3_
  - [ ] 11.11 Run full test suite with coverage
    - Verify 100% pass rate, ≥80% coverage
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 20.5_
  - [ ] 11.12 Update phase tracker and merge branch
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 20.2_

- [ ] 12. Phase 12: Final Integration & Deployment Validation
  - [ ] 12.1 Perform git status check and create branch `validate/phase-12-final-integration`
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 21.1_
  - [ ] 12.2 Validate and correct environment configuration
    - Verify .env.example files, validation script, no secrets in repo
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 21.2_
  - [ ] 12.3 Validate and correct build configuration
    - Verify backend npm start, frontend npm run build
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 21.3_
  - [ ] 12.4 Validate production readiness
    - Verify security middleware, rate limiting, CORS, logging, error handling
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 21.4_
  - [ ] 12.5 Validate security measures
    - Verify JWT cookies, bcrypt rounds, helmet, NoSQL injection prevention
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 21.5_
  - [ ] 12.6 Validate and correct seed data
    - Verify platform org, SuperAdmin, sample data
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 21.6_
  - [ ] 12.7 Validate documentation
    - Verify README, API docs, architecture docs, deployment instructions
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 26.1, 26.2, 26.3, 26.4, 26.5_
  - [ ] 12.8 Run final integration tests
    - Verify backend-frontend communication, auth flow, Socket.IO
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 24.1, 24.2, 24.3, 24.4_
  - [ ] 12.9 Final Checkpoint - Ensure all tests pass
    - Run full test suite for both backend and frontend
    - Verify 100% pass rate and ≥80% coverage
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 27.1, 27.2, 27.3, 27.4, 27.5_
  - [ ] 12.10 Update phase tracker with final completion
    - Mark all phases complete
    - Update overall progress to 100%
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 27.8, 27.9, 27.10_
  - [ ] 12.11 Merge branch and complete validation
    - Merge validate/phase-12-final-integration to main
    - Delete all validation branches
    - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9.3, 27.1_
