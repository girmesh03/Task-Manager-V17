# Implementation Plan

> **CRITICAL: WHAT-WHY-HOW Analysis Required for Every Task**
> Before making ANY change:
>
> 1. **WHAT exists?** - Read ENTIRE existing file, understand current implementation
> 2. **WHY change?** - Justify against requirements, what breaks if not changed
> 3. **HOW to change?** - Plan respecting existing codebase patterns
>
> **The existing codebase MUST be respected.** Do not impose arbitrary patterns. Work > WITH the existing architecture, not against it.
>
> All tests in backend/tests/, all docs in backend/docs/
> Reference: #[[file: backend/docs/codebase-requirements.md, .kiro\specs\production-readiness-validation\requirements.md and .kiro\specs\production-readiness-validation\design.md]]

**To install any new packages that doesn't exist in backend/package.json and client/> package.json, ask the user as yes or no. If the user provide yes, install the package and proceed accordingly and if the user provide no, then proceed to validate and correct without using a package.**

## Phase 1: Backend Production Readiness (BLOCKING)

### Phase 1.1: Backend Core Components

- [x] 1. Configuration - Helmet and Security Headers

  - Validate and configure Helmet CSP directives including Cloudinary CDN (https://res.cloudinary.com)
  - Verify all security headers: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, HSTS
  - **WHAT:** Read backend/app.js Helmet configuration
  - **WHY:** CSP must include Cloudinary for images, headers protect against XSS/clickjacking
  - **HOW:** Configure directives: defaultSrc, imgSrc, scriptSrc, styleSrc, connectSrc
  - **Tests:** Verify security headers in responses, CSP allows Cloudinary images, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 18, 52, 159, 166, 170, 409, 412_

- [x] 2. Configuration - CORS

  - Validate CORS configuration alignment with allowedOrigins.js
  - Enable credentials for cookie-based auth
  - Add environment-specific origin lists for dev/staging/production
  - Implement origin validation logging
  - Verify no wildcard origins in production
  - Document each origin's purpose
  - **WHAT:** Read backend/config/corsOptions.js and allowedOrigins.js
  - **WHY:** CORS misconfigurations block legitimate requests or allow unauthorized access
  - **HOW:** Verify origins include CLIENT_URL, credentials: true, methods, headers
  - **Tests:** Test CORS preflight, reject unauthorized origins, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 19, 160, 191-200_

- [x] 3. Configuration - Request Handling

  - Configure request payload limits (10mb) for production
  - Add request ID middleware for tracing
  - Configure compression threshold (1KB)
  - Implement API versioning in route paths (/api/\*)
  - **WHAT:** Read express.json and compression configuration in app.js
  - **WHY:** Production needs appropriate limits, tracing, compression
  - **HOW:** Set express.json({ limit: '10mb' }), compression({ threshold: 1024 })
  - **Tests:** Test payload limit, request ID in headers, compression for large responses
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 20, 24, 25, 161, 167, 168, 169, 305_

- [x] 4. Configuration - Rate Limiting

  - Validate rate limiting on all API routes (General: 100/15min, Auth: 5/15min)
  - Configure Redis-based rate limiting for production
  - Add configurable rate limits per endpoint
  - Implement rate limit bypass for trusted IPs
  - Add rate limit monitoring/alerting
  - **WHAT:** Read backend/middlewares/rateLimiter.js
  - **WHY:** Rate limiting prevents abuse and DDoS attacks
  - **HOW:** Use Redis in production, memory in development
  - **Tests:** Test rate limit enforcement, headers, different limits per endpoint, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 21, 42, 162, 294, 358-364, 411_

- [x] 5. Configuration - Server Startup and Environment

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Validate the environment variables used in backend/config/_, backend/controllers/_, backend/middlewares/_, backend/mock/_, backend/models/_, backend/routes/_, backend/services/_, backend/templates/_, backend/tests/_, backend/utils/_, app.js and server.js defined in backend/.env. If not defined, define them in backend/.env and verify by writing and running a script all of them loaded correctly and accessable (not undefined) in all files.
  - Validate all required env vars on startup (MONGODB_URI, JWT secrets, CLIENT_URL, SMTP)
  - Set timezone to UTC globally (process.env.TZ = 'UTC') and get a super deep undersanding from backend/docs/timezone-doc.md, why it's required
  - Add structured logging (Winston or Pino)
  - Validate PORT environment variable parsing
  - Verify email service initialization doesn't block server startup
  - Confirm seed data only runs in development
  - **WHAT:** Read backend/server.js startup sequence
  - **WHY:** Missing env vars cause runtime errors, UTC prevents timezone confusion
  - **HOW:** Validate env vars at startup, set TZ before any date operations
  - **Tests:** Test startup with missing vars, verify dates stored in UTC, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 23, 110, 171, 174, 176, 181, 182_

- [x] 6. Configuration - Graceful Shutdown

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Implement graceful shutdown for HTTP server
  - Implement graceful shutdown for Socket.IO
  - Implement graceful shutdown for MongoDB
  - Test all process handlers (SIGINT, SIGTERM)
  - **WHAT:** Check SIGTERM/SIGINT handlers in server.js
  - **WHY:** Graceful shutdown prevents data loss and connection leaks
  - **HOW:** Stop accepting connections, close sockets, close DB, then exit
  - **Tests:** Test shutdown on SIGTERM/SIGINT, verify all connections closed
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 27, 172, 180_

- [x] 7. Configuration - Health Check

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Implement health check endpoint (/health) returning status, database, timestamp, uptime
  - Add readiness/liveness probes for K8s (/ready, /live)
  - **WHAT:** Check if health endpoints exist
  - **WHY:** Health checks enable monitoring and orchestration
  - **HOW:** Return JSON with status, database connection state, timestamp, uptime
  - **Tests:** Test health endpoint response, probe endpoints, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 26, 177, 179, 307_

- [x] 8. Configuration - MongoDB Connection

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Configure connection pooling (minPoolSize: 5, maxPoolSize: 50)
  - Configure connection timeouts (serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000)
  - Implement retry logic with exponential backoff (5 retries, 1s-30s delay)
  - Implement connection health monitoring
  - Configure read/write concerns for production (w: 'majority')
  - Handle replica set failures
  - Verify indexes created on schema initialization
  - **WHAT:** Read backend/config/db.js connection options
  - **WHY:** Production databases require pooling, timeouts, retry logic
  - **HOW:** Configure mongoose connection options, add retry logic
  - **Tests:** Test connection pool, timeout behavior, retry on failure, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 22, 63, 67, 178, 183-190, 418, 423_

- [x] 9. Soft Delete Plugin Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify soft delete prevents hard deletes completely (override remove, deleteOne, deleteMany)
  - Verify withDeleted() and onlyDeleted() query helpers work
  - Validate aggregate pipeline filtering for isDeleted
  - Confirm deletedBy tracks user who deleted
  - Check restore functionality clears all soft-delete fields
  - Validate TTL index creation for auto-cleanup
  - Test cascade soft-delete across ALL relationships
  - Test cascade restore across ALL relationships
  - Ensure softDeleteMany works with filters
  - Add validation hooks to prevent isDeleted manipulation outside methods
  - Implement audit trail for restore operations
  - Add bulk restore method if missing
  - Test transaction support for all soft-delete operations
  - **WHAT:** Read backend/models/plugins/softDelete.js completely
  - **WHY:** Soft delete is foundation of data recovery, hard deletes must be prevented
  - **HOW:** Override native methods to throw, implement query helpers, add TTL index
  - **Tests:** Property tests for hard delete prevention, query filtering, restore, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 28, 34, 36, 201-212_

- [x] 10. User Model Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Validate each user schema fields, preferences, methods and static methods
  - Validate password hashing uses bcrypt with ≥12 salt rounds
  - Check email validation and uniqueness scoped to organization
  - Verify role enum values match authorization matrix
  - Confirm sensitive fields (similar to password) excluded from queries (select: false)
  - Validate comparePassword method is secure
  - Check token generation/validation methods
  - Add index on email + organization for multi-tenancy
  - Implement password complexity validation
  - Add account lockout after failed login attempts
  - Validate email verification workflow
  - Add lastLogin tracking
  - Ensure cascade soft-delete handles user's tasks, comments, activities
  - Add isPlatformUser field with index
  - Add isHod field (Head of Department)
  - **WHAT:** Read backend/models/User.js schema, hooks, methods
  - **WHY:** Security requires strong hashing, sensitive field exclusion, platform identification
  - **HOW:** Use bcrypt.hash(password, 12), add select: false, add platform fields
  - **Tests:** Property tests for password hashing, sensitive field exclusion, cascade delete, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 32, 46, 47, 55, 101-105, 213-224_

- [ ] 11. Organization Model Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Validate each organization schema fields, methods and static methods
  - Validate organization name uniqueness
  - Check owner reference integrity
  - Verify subscription/billing fields are indexed
  - Validate settings schema completeness
  - Add cascade soft-delete for ALL child resources (departments, users, tasks, materials, vendors)
  - Implement organization archival workflow
  - Add billing/subscription validation hooks
  - Ensure owner cannot be deleted while owning organization
  - Add organization transfer functionality validation
  - Add isPlatformOrg field with index
  - **WHAT:** Read backend/models/Organization.js schema and hooks
  - **WHY:** Multi-tenancy requires proper scoping, cascade ensures data integrity
  - **HOW:** Add unique index, cascade hooks, isPlatformOrg field
  - **Tests:** Property tests for cascade delete to all children, platform org identification, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 29, 100, 106-109, 225-233_

- [ ] 12. Department Model Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Validate each deparment schema fields, methods and static methods
  - Validate department belongs to organization (multi-tenancy)
  - Check manager reference integrity
  - Verify unique constraint on name + organization
  - Add cascade soft-delete for tasks and users in department
  - Validate manager is part of same organization
  - Add hierarchy validation if departments have parent/child
  - Ensure restore checks organization existence
  - **WHAT:** Read backend/models/Department.js schema and relationships
  - **WHY:** Department model requires proper multi-tenancy and cascade operations
  - **HOW:** Add compound unique index, cascade hooks, parent validation
  - **Tests:** Test department scoping, cascade delete, manager validation, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 30, 234-240_

- [ ] 13. Task Models Implementation (BaseTask, ProjectTask, RoutineTask, AssignedTask)

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Validate each of the BaseTask, ProjectTask, RoutineTask, AssignedTask schema fields, methods and static methods
  - Validate discriminator pattern implementation
  - Check all task types inherit base fields correctly
  - Verify timestamps and status transitions
  - Validate assignees are scoped to organization and department
  - Check priority, status enum values
  - Implement cascade soft-delete for TaskComment, TaskActivity, Attachment
  - Ensure assignees are validated against organization and department membership, watchers are validated against organization only
  - Validate startDate, dueDate and date logic
  - Implement recurrence logic validation for RoutineTask
  - Validate project milestones for ProjectTask
  - Add bulk operations with transaction support
  - **WHAT:** Read all task model files and discriminator implementation
  - **WHY:** Discriminator pattern enables inheritance, cascade ensures no orphans
  - **HOW:** Verify discriminatorKey: 'taskType', implement cascade hooks
  - **Tests:** Test discriminator inheritance, type-specific validation, cascade delete, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 31, 241-252_

- [ ] 14. TaskActivity Model Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
    alidate each task activity schema fields, methods and static methods
  - Validate author belongs to task's organization and department
  - Check task reference integrity
  - Verify activity type enum coverage
  - Add cascade soft-delete when task is deleted
  - Add cascade soft-delete when author (user) is deleted
  - **WHAT:** Read backend/models/TaskActivity.js schema and relationships
  - **WHY:** Task activities require proper tracking and cascade operations
  - **HOW:** Add validation hooks, cascade delete hooks
  - **Tests:** Test activity creation, cascade delete scenarios, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 253-257_

- [ ] 15. TaskComment Model Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Validate each task comment schema fields, methods and static methods
  - Validate comment edit/delete permissions
  - Add mentions/notifications integration
  - Ensure restore validates parent task existence
  - Enforce max depth 3 for threaded comments
  - **WHAT:** Read backend/models/TaskComment.js schema and threading logic
  - **WHY:** Comments require proper threading and cascade operations
  - **HOW:** Add depth validation, parent validation on restore
  - **Tests:** Test comment threading, max depth enforcement, cascade delete, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 258-260_

- [ ] 16. Attachment Model Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Validate Cloudinary URL format
  - Check file size and type restrictions
  - Verify uploader is org member
  - Validate reference integrity (task, material, etc.)
  - Delete from Cloudinary when attachment is hard-deleted
  - Add virus scanning validation hook
  - Implement storage quota validation per organization
  - Add cascade delete when parent resource (task/material) is deleted
  - Validate supported file types against whitelist
  - Add thumbnail generation for images
  - **WHAT:** Read backend/models/Attachment.js schema and Cloudinary integration
  - **WHY:** Attachments require proper file management and cleanup
  - **HOW:** Add URL validation, Cloudinary cleanup hooks, cascade delete
  - **Tests:** Test Cloudinary integration, file validation, cascade cleanup, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 35, 91-99, 261-270_

- [ ] 17. Material Model Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Validate each material schema fields, methods and static methods
  - Validate material belongs to organization and department
  - Check quantity/unit validations
  - Validate all schema level business logic
  - **WHAT:** Read backend/models/Material.js schema and it's logic
  - **WHY:** Materials require proper relationships
  - **HOW:** Add organization validation, audit trail
  - **Tests:** Test relationships, cascade operations, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 271-277_

- [ ] 18. Vendor Model Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Validate vendor scoped to organization
  - Check contact information format
  - Verify name/email/phone uniqueness validation
  - Add cascade handling for materials
  - Validate unique constraint on name + organization
  - Add vendor rating/status validation
  - **WHAT:** Read backend/models/Vendor.js schema and relationships
  - **WHY:** Require proper scoping and relationship management
  - **HOW:** Add organization scoping, contact validation, cascade handling
  - **Tests:** Test scoping, contact validation, material relationships, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 278-283_

- [ ] 19. Notification Model Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Validate recipient is org member
  - Check notification type enum
  - Verify read status tracking
  - Add cascade soft-delete when recipient is deleted
  - Implement notification expiry/cleanup (30 days TTL)
  - Add batch mark-as-read functionality
  - Validate notification payload structure
  - **WHAT:** Read backend/models/Notification.js schema and TTL implementation
  - **WHY:** Notifications require proper recipient management and expiry
  - **HOW:** Add recipient validation, TTL index, batch operations
  - **Tests:** Test notification delivery, TTL expiry, batch operations, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 284-290_

- [ ] 20. Utils - Cascade Delete/Restore Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify all helper functions have proper error handling
  - Check cascadeDelete implementation handles all relationships
  - Ensure cascadeDelete recursive logic covers ALL models and relationships
  - Add cascade restore functionality with parent validation
  - Implement transaction support for cascade operations
  - Add cascade operation logging
  - Validate circular dependency handling
  - Enforce cascade depth limits to prevent stack overflow
  - **WHAT:** Read backend/utils/helpers.js cascade implementation
  - **WHY:** Cascade operations ensure referential integrity, transactions prevent partial deletes
  - **HOW:** Implement cascadeDelete/cascadeRestore with session, track visited entities, max depth
  - **Tests:** Property tests for cascade completeness, transaction rollback, depth , use --testPathPatterns instead of --testPathPattern, wait until the test completelimits
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 33-38, 375-381_

- [ ] 21. Utils - Socket.IO Configuration

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify Socket.IO authentication using JWT
  - Check room/namespace isolation by organization
  - Validate event emission patterns
  - Implement proper error handling for socket events
  - Add socket connection logging
  - Validate organization-based room isolation
  - Add reconnection handling
  - Implement socket event validation
  - Use same JWT secrets for both HTTP and Socket.IO
  - Use centralized token generation for both user and socket authentication
  - **WHAT:** Read backend/utils/socket.js, socketEmitter.js, socketInstance.js
  - **WHY:** Singleton prevents multiple instances, JWT ensures security, rooms enable scoped updates
  - **HOW:** Implement singleton, JWT auth in connection handler, room joining
  - **Tests:** Integration test for connection/disconnection, JWT auth, room , use --testPathPatterns instead of --testPathPattern, wait until the test completebroadcasting
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 69-75, 175, 382-389_

- [ ] 22. Utils Validation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify all enums match model definitions
  - Check constant values are immutable
  - Add JSDoc for all constants
  - Validate enum completeness
  - Export constants in structured format
  - Search codebase for hardcoded values and replace with constants
  - **WHAT:** Read backend/utils/constants.js and search for hardcoded values
  - **WHY:** Constants are single source of truth, hardcoded values cause maintenance issues
  - **HOW:** Verify all enums exist, search for "Completed", "Admin", "High", replace with constants
  - **Tests:** Test enum completeness, verify no hardcoded values remain, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 122-123, 390-394_

- [ ] 23. Utils - Token Generation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Implement generateAccessToken(user) with 15min expiry
  - Implement generateRefreshToken(user) with 7 days expiry
  - Use same JWT secrets for HTTP and Socket.IO
  - Implement refresh token rotation
  - Add token blacklisting support
  - **WHAT:** Read backend/utils/generateTokens.js implementation
  - **WHY:** Centralized generation ensures consistency between HTTP and Socket.IO
  - **HOW:** Use JWT_ACCESS_SECRET and JWT_REFRESH_SECRET from env
  - **Tests:** Test token generation, expiry, refresh token rotation, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 44, 45, 69-75_

- [ ] 24. Utils - Timezone Management

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Configure Dayjs with UTC and timezone plugins
  - Create date utility functions for UTC conversion
  - Update controllers to convert incoming dates to UTC
  - **WHAT:** Check current date handling across codebase
  - **WHY:** UTC standardization prevents timezone confusion, ISO format ensures consistent parsing
  - **HOW:** Set TZ=UTC, configure dayjs, create toUTC/toLocal utilities
  - **Tests:** Test date storage in UTC, API responses in ISO format, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 110-121, 148_

- [ ] 25. Auth Middleware Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify JWT verification uses correct secrets
  - Check token expiry handling
  - Validate refresh token logic
  - Add token blacklist check for logged-out tokens
  - Implement token refresh logic
  - Add request context (req.user) population with organization/department populated
  - Validate token payload structure
  - Add graceful handling for expired tokens
  - **WHAT:** Read backend/middlewares/authMiddleware.js implementation
  - **WHY:** Cookie-based JWT improves security, proper error codes enable frontend behavior
  - **HOW:** Extract JWT from req.cookies.access_token, verify, populate req.user
  - **Tests:** Test valid token populates req.user, invalid/missing/expired returns 401, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 39, 343-350_

- [ ] 26. Authorization Matrix Configuration

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Replace existing authorization matrix with new configuration
  - Validate and update all occurrences of authorization matrix usage
  - **WHAT:** Read backend/config/authorizationMatrix.json
  - **WHY:** New matrix reflects updated business rules for role-based access control
  - **HOW:** Complete replacement with structure from design document
  - **Tests:** Test matrix loading and structure validation, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 40, 425-426_

- [ ] 27. Authorization Middleware Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Check authorization matrix covers all roles and resources
  - Verify permission checking logic
  - Validate organization-scoped authorization
  - Add dynamic permission loading
  - Implement resource-level permissions (own tasks vs all tasks)
  - Add logging for authorization failures
  - Validate role hierarchy (SuperAdmin > Admin > Manager > User)
  - Implement ownership verification for all resources
  - Verify platform SuperAdmin cross-org rules
  - **WHAT:** Read backend/middlewares/authorization.js implementation
  - **WHY:** Matrix-based authorization centralizes permission logic, ownership verification ensures security
  - **HOW:** Load matrix, implement checkPermission, checkOwnership for all ownership fields
  - **Tests:** Test each role's permissions, ownership verification, platform , use --testPathPatterns instead of --testPathPattern, wait until the test completeSuperAdmin cross-org access
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 40, 48-50, 76-83, 150, 156, 351-357_

- [ ] 28. Validators Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify all required fields are validated
  - Check data type validations
  - Validate sanitization methods
  - Confirm custom validators work correctly
  - Add comprehensive error messages for validation failures
  - Implement conditional validations
  - Add cross-field validations
  - Validate array/nested object structures
  - Add custom validators for business logic
  - Ensure validation error responses are user-friendly
  - **WHAT:** Read all validator files in backend/middlewares/validators/
  - **WHY:** Validators are source of truth for field names and constraints
  - **HOW:** Verify field names match controllers, enums use constants, ObjectId validation
  - **Tests:** Test all validation rules, error message clarity, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 365-374_

- [ ] 29. Email Service Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify Nodemailer Gmail SMTP configuration
  - Implement email queue for asynchronous sending
  - Add error handling and graceful degradation
  - Ensure service initialization doesn't block server startup
  - **WHAT:** Read backend/services/emailService.js implementation
  - **WHY:** Asynchronous email prevents blocking, queue ensures delivery
  - **HOW:** Configure SMTP, implement queue, add error handling
  - **Tests:** Test email sending success/failure, queue processing, mock SMTP, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 173_

- [ ] 30. Notification Service Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify notification creation
  - Verify recipient handling
  - Verify entity linking
  - Integrate with Socket.IO emitter
  - **WHAT:** Read backend/services/notificationService.js implementation
  - **WHY:** Centralized notification handling ensures consistency
  - **HOW:** Create notifications, emit via Socket.IO
  - **Tests:** Test notification creation and delivery, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, Related to notification model_

- [ ] 31. Property-Based Tests for Phase 1.1

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Create softDelete.property.test.js with Properties 1-3
  - Create cascade.property.test.js with Properties 4-8
  - Create authorization.property.test.js with Properties 9-12
  - Create user.property.test.js with Properties 13-14
  - Create timezone.property.test.js with Properties 15-16
  - Create ttl.property.test.js with Properties 17-18
  - Create token.property.test.js with Property 19
  - **WHAT:** Create property-based tests using fast-check
  - **WHY:** Property tests verify correctness across all possible inputs
  - **HOW:** Use fast-check library, minimum 100 iterations per property
  - **Tests:** All properties must pass with 100+ iterations, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 58, 395-408_

- [ ] 32. Unit Tests for Phase 1.1

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Create unit tests for each model method and static
  - Create unit tests for each middleware function
  - Create unit tests for each utility function
  - Mock external dependencies (MongoDB, Cloudinary, Email)
  - **WHAT:** Create comprehensive unit tests
  - **WHY:** Unit tests verify individual component behavior
  - **HOW:** Test each function, mock dependencies
  - **Tests:** >80% coverage, all tests passing, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 56, 403_

- [ ] 33. Integration Tests for Phase 1.1

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Create integration tests for complete flows
  - Test cascade operations end-to-end
  - Test authentication flows
  - Test authorization scenarios
  - Use transactions for database isolation
  - **WHAT:** Create integration tests
  - **WHY:** Integration tests verify component interaction
  - **HOW:** Test complete request/response cycles, use transactions
  - **Tests:** All critical flows covered, database isolation working, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 57, 404_

- [ ] 34. Phase 1.1 Checkpoint
  - E
  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.nsure all tests pass (npm test)
  - Run coverage report (npm run test:coverage)
  - Verify >80% coverage
  - Document all changes in backend/docs/phase-1.1/
  - Update steering documents if affected
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 14-17, 60_

### Phase 1.2: Backend Resource Modules

- [ ] 35. Auth Routes Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify authentication middleware applied to protected routes
  - Apply stricter rate limiting (5/15min) to auth endpoints
  - Add request logging middleware for audit trail
  - Ensure consistent error responses
  - Verify middleware order: authMiddleware → validator → authorization → controller
  - **WHAT:** Read backend/routes/authRoutes.js route definitions
  - **WHY:** Authentication routes need proper middleware order and rate limiting
  - **HOW:** Verify middleware order, apply rate limiting
  - **Tests:** Test middleware order, rate limiting, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 41, 291-307_

- [ ] 36. Auth Controllers Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Implement JWT refresh token rotation
  - Implement token blacklisting on logout
  - Add brute-force protection on login
  - Validate password reset token expiry
  - Ensure email verification workflow
  - Add proper authorization checks
  - Validate socket emission for real-time updates
  - **WHAT:** Read backend/controllers/authControllers.js implementation
  - **WHY:** Auth controllers need secure token handling and brute-force protection
  - **HOW:** Implement token rotation, blacklisting, lockout
  - **Tests:** Test login/logout flows, brute-force protection, token rotation, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 47, 337-342_

- [ ] 37. Auth Validators Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify email validation and normalization
  - Verify password complexity validation
  - Add comprehensive error messages
  - Implement conditional validations
  - **WHAT:** Read backend/middlewares/validators/authValidators.js
  - **WHY:** Auth validation prevents security vulnerabilities
  - **HOW:** Validate email format, password complexity
  - **Tests:** Test all validation rules, error messages, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 365-374_

- [ ] 38. Auth Integration Tests

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Test complete login/logout flows
  - Test token refresh flow
  - Test brute-force protection
  - Test password reset flow
  - Test all roles authentication
  - **WHAT:** Create comprehensive auth module tests
  - **WHY:** Authentication is critical for security
  - **HOW:** Test all auth scenarios, all roles
  - **Tests:** All auth scenarios covered, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 154, 395-408_

- [ ] 39. Material Routes Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify all CRUD routes defined
  - Check middleware order: authMiddleware → validator → authorization → controller
  - Add rate limiting for sensitive operations
  - Verify route parameter validation (MongoDB ObjectId format)
  - **WHAT:** Read backend/routes/materialRoutes.js route definitions
  - **WHY:** Routes need proper middleware order and authorization
  - **HOW:** Verify middleware order, add rate limiting
  - **Tests:** Test all routes, middleware order, authorization, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 43, 291-307_

- [ ] 40. Material Controllers Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify all async operations use async/await
  - Check error handling wraps operations
  - Validate input sanitization before database operations
  - Confirm multi-tenancy: all queries filter by organization/department
  - Verify pagination uses mongoose-paginate-v2 correctly
  - Check soft-delete operations use plugin methods
  - Validate transaction usage for multi-document operations
  - Ensure all responses use consistent format
  - Add proper authorization checks (req.user permissions)
  - **WHAT:** Read backend/controllers/materialControllers.js implementation
  - **WHY:** Controllers need proper scoping, soft delete, and error handling
  - **HOW:** Verify scoping, use plugin methods, consistent responses
  - **Tests:** Test all CRUD operations, scoping, soft delete, error handling, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 155, 308-324_

- [ ] 41. Material Validators Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify field names match controller expectations
  - Verify enum validation uses constants
  - Verify ObjectId validation for vendor references
  - Add comprehensive error messages
  - **WHAT:** Read backend/middlewares/validators/materialValidators.js
  - **WHY:** Validators ensure data integrity and match backend expectations
  - **HOW:** Verify field names, enum validation
  - **Tests:** Test all validation rules, enum validation, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 365-374_

- [ ] 42. Material Integration Tests

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - CRUD Operation Tests (create, read, update, delete, restore)
  - Authorization Tests (ALL roles: SuperAdmin, Admin, Manager, User)
  - Validation Error Tests (all validation rules)
  - Edge Case Tests (concurrent updates, duplicates, boundaries)
  - Multi-Tenancy Isolation Tests
  - Error Scenario Tests (400, 401, 403, 404, 409, 500)
  - Frontend Behavior Simulation Tests
  - **WHAT:** Create comprehensive material module tests
  - **WHY:** Frontend simulation tests ensure production readiness
  - **HOW:** Test all scenarios, all roles, all error codes
  - **Tests:** All scenarios covered, >80% coverage, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 154, 395-408_

- [ ] 43. Vendor Routes Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify all CRUD routes defined
  - Check middleware order
  - Add rate limiting for sensitive operations
  - **WHAT:** Read backend/routes/vendorRoutes.js route definitions
  - **WHY:** Routes need proper middleware order and authorization
  - **HOW:** Same pattern as Material routes
  - **Tests:** Test all routes, middleware order, authorization, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 291-307_

- [ ] 44. Vendor Controllers Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify scoping to organization
  - Check cascade handling for materials using vendor
  - Validate soft-delete operations
  - **WHAT:** Read backend/controllers/vendorControllers.js implementation
  - **WHY:** Controllers need proper scoping and cascade handling
  - **HOW:** Same pattern as Material controllers, plus cascade handling
  - **Tests:** Test CRUD operations, cascade handling, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 308-324_

- [ ] 45. Vendor Validators Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify email/phone validation
  - Verify organization scoping
  - **WHAT:** Read backend/middlewares/validators/vendorValidators.js
  - **WHY:** Validators ensure contact information format
  - **HOW:** Verify email/phone validation, organization scoping
  - **Tests:** Test contact validation, scoping, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 365-374_

- [ ] 46. Vendor Integration Tests

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - CRUD Operation Tests
  - Authorization Tests (ALL roles)
  - Validation Error Tests
  - Edge Case Tests
  - Multi-Tenancy Isolation Tests
  - Error Scenario Tests
  - **WHAT:** Create comprehensive vendor module tests
  - **WHY:** Same as material module
  - **HOW:** Same test categories as Material module
  - **Tests:** All scenarios covered, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 154, 395-408_

- [ ] 47. Attachment Routes Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify Cloudinary integration routes
  - Check file validation middleware
  - **WHAT:** Read backend/routes/attachmentRoutes.js route definitions
  - **WHY:** File upload routes need special handling
  - **HOW:** Verify Cloudinary integration, file validation
  - **Tests:** Test file upload flow, validation, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 291-307_

- [ ] 48. Attachment Controllers Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify Cloudinary URL storage
  - Implement cleanup on delete
  - Handle failed create/update cleanup
  - Validate file types and sizes
  - **WHAT:** Read backend/controllers/attachmentControllers.js implementation
  - **WHY:** Attachments need Cloudinary cleanup and reference management
  - **HOW:** Store URL, cleanup on delete, handle failures
  - **Tests:** Test Cloudinary integration, cleanup scenarios, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 35, 91-99, 308-324_

- [ ] 49. Attachment Validators Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify file type whitelist
  - Verify size limits
  - Verify Cloudinary URL format
  - **WHAT:** Read backend/middlewares/validators/attachmentValidators.js
  - **WHY:** File validation prevents security issues
  - **HOW:** Verify file type whitelist, size limits
  - **Tests:** Test file validation rules, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 365-374_

- [ ] 50. Attachment Integration Tests

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - CRUD Operation Tests
  - Cloudinary cleanup tests
  - File validation tests
  - **WHAT:** Create comprehensive attachment module tests
  - **WHY:** File handling requires thorough testing
  - **HOW:** Include Cloudinary cleanup tests, file validation tests
  - **Tests:** All file scenarios covered, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 154, 395-408_

- [ ] 51. Notification Routes Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify Socket.IO integration routes
  - Check batch operations routes
  - **WHAT:** Read backend/routes/notificationRoutes.js route definitions
  - **WHY:** Notification routes need real-time integration
  - **HOW:** Verify Socket.IO integration, batch operations
  - **Tests:** Test real-time delivery, batch operations, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 291-307_

- [ ] 52. Notification Controllers Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify recipient is org member
  - Implement batch mark-as-read
  - Handle TTL expiry (30 days)
  - Integrate with Socket.IO for real-time delivery
  - **WHAT:** Read backend/controllers/notificationControllers.js implementation
  - **WHY:** Notifications need proper recipient validation and TTL
  - **HOW:** Validate recipient, implement batch operations, TTL
  - **Tests:** Test recipient validation, TTL expiry, real-time delivery, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 308-324_

- [ ] 53. Notification Validators Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify notification type enum
  - Verify recipient validation
  - Verify payload structure
  - **WHAT:** Read backend/middlewares/validators/notificationValidators.js
  - **WHY:** Notification validation ensures proper payload structure
  - **HOW:** Verify type enum, recipient validation
  - **Tests:** Test notification validation, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 365-374_

- [ ] 54. Notification Integration Tests

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - CRUD Operation Tests
  - Socket.IO integration tests
  - TTL tests
  - Batch operation tests
  - **WHAT:** Create comprehensive notification module tests
  - **WHY:** Real-time features need thorough testing
  - **HOW:** Include Socket.IO integration tests, TTL tests
  - **Tests:** All notification scenarios covered, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 154, 395-408_

- [ ] 55. Task Routes Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify routes for all task types (Project, Routine, Assigned)
  - Check middleware order
  - **WHAT:** Read backend/routes/taskRoutes.js route definitions
  - **WHY:** Task routes handle multiple task types
  - **HOW:** Verify routes for all task types
  - **Tests:** Test type-specific routes, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 291-307_

- [ ] 56. Task Controllers Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Validate task assignment logic checks assignee organization membership
  - Implement task status workflow validation
  - Add validation for task type-specific fields
  - Ensure subtask handling works correctly
  - Validate task dependencies
  - Add bulk import/export validation
  - Validate cascade delete for comments, activities, attachments
  - Validate business logic of each controller
  - **WHAT:** Read backend/controllers/taskControllers.js implementation
  - **WHY:** Tasks need type-specific validation and cascade operations
  - **HOW:** Validate assignment, status workflow, cascade delete
  - **Tests:** Test all task types, status workflow, cascade operations, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 325-330, 308-324_

- [ ] 57. Task Validators Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify type-specific validation
  - Verify assignee validation
  - Verify status workflow
  - Validate fields, existence, uniqueness, constants, etc.
  - **WHAT:** Read backend/middlewares/validators/taskValidators.js
  - **WHY:** Task validation handles complex type-specific rules
  - **HOW:** Verify type-specific validation, assignee validation
  - **Tests:** Test type-specific validation, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 365-374_

- [ ] 58. Task Integration Tests

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - CRUD Operation Tests for all task types with authorization
  - Status workflow tests
  - Cascade operation tests
  - Assignment tests
  - **WHAT:** Create comprehensive task module tests
  - **WHY:** Tasks are core functionality requiring extensive testing
  - **HOW:** Include all task types, status workflows, cascade operations
  - **Tests:** All task scenarios covered, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 154, 395-408_

- [ ] 59. TaskActivity Routes Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify task reference validation routes
  - Check activity type handling
  - Check middleware order
  - **WHAT:** Read backend/routes/taskRoutes.js
  - **WHY:** Activity routes need task relationship validation
  - **HOW:** Verify task reference validation
  - **Tests:** Test activity creation, task relationships, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 291-307_

- [ ] 60. TaskActivity Controllers Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Validate author belongs to task's organization
  - Check task reference integrity
  - Verify activity type enum coverage
  - Handle cascade delete scenarios
  - **WHAT:** Read backend/controllers/taskControllers.js
  - **WHY:** Activities need proper task and author validation
  - **HOW:** Validate author, task reference, activity type
  - **Tests:** Test activity creation, validation, cascade scenarios, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 308-324_

- [ ] 61. TaskActivity Validators Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify task reference validation
  - Verify activity type validation
  - Validate fields, existence, uniqueness, constants, etc.
  - **WHAT:** Read backend/middlewares/validators/taskValidators.js
  - **WHY:** Activity validation ensures proper task relationships
  - **HOW:** Verify task reference, activity type
  - **Tests:** Test activity validation, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 365-374_

- [ ] 62. TaskActivity Integration Tests

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - CRUD Operation Tests
  - Task relationship tests
  - Cascade tests
  - **WHAT:** Create comprehensive task activity module tests
  - **WHY:** Activities are part of task workflow
  - **HOW:** Include task relationship tests, cascade tests
  - **Tests:** All activity scenarios covered, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 154, 395-408_

- [ ] 63. TaskComment Routes Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify threaded comment support routes
  - Check max depth enforcement
  - Check middleware order
  - **WHAT:** Read backend/routes/taskRoutes.js
  - **WHY:** Comment routes need threading support
  - **HOW:** Verify threaded comment support, max depth
  - **Tests:** Test comment threading, depth limits, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 291-307_

- [ ] 64. TaskComment Controllers Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Validate comment edit/delete permissions
  - Add mentions/notifications integration
  - Ensure restore validates parent task existence
  - Enforce max depth 3 for threaded comments
  - **WHAT:** Read backend/controllers/taskControllers.js
  - **WHY:** Comments need threading and mention support
  - **HOW:** Validate permissions, mentions, max depth
  - **Tests:** Test comment threading, mentions, max depth, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 308-324_

- [ ] 65. TaskComment Validators Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify parent validation
  - Verify depth validation
  - Verify mention validation
  - Validate fields, existence, uniqueness, constants, etc.
  - **WHAT:** Read backend/middlewares/validators/taskValidators.js (if exists)
  - **WHY:** Comment validation handles threading rules
  - **HOW:** Verify parent, depth, mention validation
  - **Tests:** Test comment validation rules, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 365-374_

- [ ] 66. TaskComment Integration Tests

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - CRUD Operation Tests
  - Threading tests
  - Mention tests
  - Real-time tests
  - **WHAT:** Create comprehensive task comment module tests
  - **WHY:** Comments support collaboration features
  - **HOW:** Include threading tests, mention tests, real-time tests
  - **Tests:** All comment scenarios covered, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 154, 395-408_

- [ ] 67. User Routes Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify role management routes
  - Check profile routes
  - **WHAT:** Read backend/routes/userRoutes.js route definitions
  - **WHY:** User routes need role-based access control
  - **HOW:** Verify role management routes, profile routes
  - **Tests:** Test role-based access, profile management, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 291-307_

- [ ] 68. User Controllers Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Validate user deletion checks for task ownership/assignment
  - Implement user deactivation vs deletion logic
  - Add password change validation (old password verification)
  - Ensure email change requires verification
  - Validate role changes respect authorization matrix
  - Add audit logging for permission changes
  - Handle cascade delete scenarios
  - **WHAT:** Read backend/controllers/userControllers.js implementation
  - **WHY:** User management needs careful permission handling
  - **HOW:** Validate deletion, deactivation, password change, role changes
  - **Tests:** Test user management, role changes, cascade operations, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 331-336, 308-324_

- [ ] 69. User Validators Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify email uniqueness per org
  - Verify role validation
  - Verify password complexity
  - **WHAT:** Read backend/middlewares/validators/userValidators.js
  - **WHY:** User validation ensures security and data integrity
  - **HOW:** Verify email uniqueness, role validation, password complexity
  - **Tests:** Test user validation rules, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 365-374_

- [ ] 70. User Integration Tests

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - CRUD Operation Tests
  - Role management tests
  - Cascade tests
  - Security tests
  - **WHAT:** Create comprehensive user module tests
  - **WHY:** User management is critical for security
  - **HOW:** Include role management tests, cascade tests, security tests
  - **Tests:** All user scenarios covered, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 154, 395-408_

- [ ] 71. Department Routes Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify organization scoping routes
  - Check manager assignment routes
  - **WHAT:** Read backend/routes/departmentRoutes.js route definitions
  - **WHY:** Department routes need organization scoping
  - **HOW:** Verify organization scoping, manager assignment
  - **Tests:** Test department management, scoping, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 291-307_

- [ ] 72. Department Controllers Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Validate department belongs to organization
  - Check manager reference integrity
  - Verify unique constraint on name + organization
  - Add cascade soft-delete for tasks and users in department
  - Validate manager is part of same organization
  - **WHAT:** Read backend/controllers/departmentControllers.js implementation
  - **WHY:** Departments need proper hierarchy and cascade handling
  - **HOW:** Validate organization, manager, cascade delete
  - **Tests:** Test department management, cascade operations, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 308-324_

- [ ] 73. Department Validators Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify organization scoping
  - Verify manager validation
  - Verify name uniqueness
  - **WHAT:** Read backend/middlewares/validators/departmentValidators.js
  - **WHY:** Department validation ensures organizational integrity
  - **HOW:** Verify organization scoping, manager validation
  - **Tests:** Test department validation, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 365-374_

- [ ] 74. Department Integration Tests

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - CRUD Operation Tests
  - Hierarchy tests
  - Cascade tests
  - Manager tests
  - **WHAT:** Create comprehensive department module tests
  - **WHY:** Departments are key to organizational structure
  - **HOW:** Include hierarchy tests, cascade tests, manager tests
  - **Tests:** All department scenarios covered, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 154, 395-408_

- [ ] 75. Organization Routes Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify NO CREATE ROUTE exists
  - Check platform-only delete/restore routes
  - **WHAT:** Read backend/routes/organizationRoutes.js route definitions
  - **WHY:** Organization routes need platform vs customer handling
  - **HOW:** Verify NO CREATE ROUTE, platform-only operations
  - **Tests:** Test route restrictions, platform access, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 152, 291-307_

- [ ] 76. Organization Controllers Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify NO CREATE operation (should return 404/405)
  - Add cascade soft-delete for ALL child resources
  - Prevent platform organization deletion
  - Implement organization archival workflow
  - Add billing/subscription validation hooks
  - Ensure owner cannot be deleted while owning organization
  - **WHAT:** Read backend/controllers/organizationControllers.js implementation
  - **WHY:** Organizations need careful cascade and platform handling
  - **HOW:** Verify no create, cascade delete, platform protection
  - **Tests:** Test no create route, cascade operations, platform protection, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 152, 308-324_

- [ ] 77. Organization Validators Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify name uniqueness
  - Verify subscription validation
  - Verify settings validation
  - **WHAT:** Read backend/middlewares/validators/organizationValidators.js
  - **WHY:** Organization validation ensures data integrity
  - **HOW:** Verify name uniqueness, subscription validation
  - **Tests:** Test organization validation, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 365-374_

- [ ] 78. Organization Integration Tests

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - CRUD Operation Tests (no create)
  - Cascade tests
  - Platform tests
  - Subscription tests
  - **WHAT:** Create comprehensive organization module tests
  - **WHY:** Organizations are the root of multi-tenancy
  - **HOW:** Include cascade tests, platform tests, subscription tests
  - **Tests:** All organization scenarios covered, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 154, 395-408_

- [ ] 79. Security Implementation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Apply SQL/NoSQL injection prevention (mongoose sanitization)
  - Apply XSS protection (input sanitization, CSP headers)
  - Apply CSRF protection (SameSite cookies, CSRF tokens if needed)
  - Implement rate limiting on all endpoints
  - Apply Helmet.js security headers
  - Implement JWT secret rotation strategy
  - Apply HTTPS in production (enforce with HSTS)
  - Implement sensitive data encryption at rest
  - Ensure environment variable security (.env not committed)
  - Run dependency vulnerability scan (npm audit)
  - **WHAT:** Implement comprehensive security measures
  - **WHY:** Production security requires multiple layers of protection
  - **HOW:** Apply all security measures, run vulnerability scans
  - **Tests:** Test security measures, vulnerability scans, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 51, 53, 54, 408-417_

- [ ] 80. Performance Optimization

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Create database indexes on frequently queried fields
  - Implement pagination for all list endpoints
  - Apply query optimization (avoid N+1, use lean())
  - Implement response compression
  - Create caching strategy for static data (consider Redis)
  - Configure connection pooling
  - Implement Cloudinary image optimization
  - **WHAT:** Implement performance optimizations
  - **WHY:** Production performance requires optimization
  - **HOW:** Create indexes, implement pagination, optimize queries
  - **Tests:** Test performance improvements, query optimization, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 63-68, 418-424_

- [ ] 81. Phase 1.2 Checkpoint

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Ensure all tests pass (npm test)
  - Run coverage report (npm run test:coverage)
  - Verify >80% coverage
  - Document all changes in backend/docs/phase-1.2/
  - Update steering documents if affected
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 14-17, 60_

- [ ] 82. Final Backend Testing

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks
  - Run all unit tests
  - Run all integration tests
  - Run all property-based tests
  - Run cascade operation tests
  - Verify >80% coverage
  - Fix any failing tests
  - **WHAT:** Run complete backend test suite
  - **WHY:** Ensure all backend functionality works correctly
  - **HOW:** Run npm test, npm run test:coverage
  - **Tests:** All tests passing, >80% coverage, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 56-61, 395-408_

## Phase 2: Frontend Production Readiness

### Phase 2.1: Frontend Configuration

- [ ] 83. Frontend Dependencies Validation

  - Include backend/docs/\*, read and understand what have been done on the previous codebase tasks.
  - Verify all dependencies are up-to-date and secure
  - Check no unused dependencies
  - Validate build scripts work correctly
  - Run npm audit and fix vulnerabilities
  - Add production build optimization
  - Ensure dev dependencies are only in devDependencies
  - Add bundle size analysis script
  - Verify production build settings
  - Check environment variable handling
  - Validate proxy configuration for API
  - **WHAT:** Read client/package.json and audit dependencies
  - **WHY:** Secure and up-to-date dependencies prevent vulnerabilities
  - **HOW:** Run npm audit, remove unused deps, optimize build
  - **Tests:** Test build process, dependency audit, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 427-440_

- [ ] 84. Frontend Environment Configuration

  - Verify all required env vars are present
  - Check API URL formatting
  - Add validation in main.jsx for missing vars
  - Document all environment variables
  - Separate configs for dev/staging/production
  - Remove VITE_PLATFORM_ORG (use isPlatformOrg field)
  - **WHAT:** Read client/.env and main.jsx configuration
  - **WHY:** Proper environment configuration prevents runtime errors
  - **HOW:** Validate env vars, remove VITE_PLATFORM_ORG
  - **Tests:** Test environment validation, missing var handling, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 107-109, 441-446_

- [ ] 85. App Initialization Validation

  - Validate Redux store and persist setup
  - Add performance monitoring initialization
  - Implement error tracking (Sentry integration if needed)
  - Add service worker registration for PWA
  - Validate strict mode compatibility with all dependencies
  - Verify provider hierarchy is correct
  - Check theme provider wraps all components
  - Validate router setup
  - Add global error boundary
  - Implement loading states for provider initialization
  - **WHAT:** Read client/src/main.jsx app setup
  - **WHY:** Proper initialization ensures all providers work correctly
  - **HOW:** Validate Redux, theme, router setup
  - **Tests:** Test app initialization, provider setup, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 447-458_

- [ ] 86. Constants Synchronization

  - Map constants from backend/utils/constants.js to client/src/utils/constants.js
  - Import TASK_STATUS, TASK_PRIORITY, USER_ROLES from constants instead of hardcoding
  - Search for hardcoded values ("Completed", "Admin", "High")
  - Replace ALL with constant imports
  - **WHAT:** Read frontend constants and compare with backend
  - **WHY:** Constants synchronization ensures consistency
  - **HOW:** Map constants, search for hardcoded values, replace
  - **Tests:** Test constant usage, verify no hardcoded values, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 122-123, 144-145_

- [ ] 87. Frontend Timezone Handling
  - Configure dayjs with UTC and timezone plugins
  - Create utilities: toUTC(localDate), toLocal(utcDate)
  - Update all date displays to use toLocal
  - Update all date inputs to use toUTC
  - Handle timezone conversion transparently in DateTimePicker
  - **WHAT:** Implement UTC ↔ local conversion utilities
  - **WHY:** Consistent timezone handling prevents date confusion
  - **HOW:** Configure dayjs, create utilities, update components
  - **Tests:** Test date conversion utilities, timezone handling, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 116-121, 148_

### Phase 2.2: Theme and Styling

- [ ] 88. Remove Hardcoded Styling

  - Search all components for hardcoded styling values (color:, fontSize:, padding:)
  - Replace with theme references (theme.palette, theme.typography, theme.spacing)
  - Use MUI styled() API for custom styling
  - Use theme breakpoints for responsive design
  - Use theme spacing units for spacing
  - **WHAT:** Search all components for hardcoded styling values
  - **WHY:** Theme-first approach ensures consistency
  - **HOW:** Search for hardcoded values, replace with theme references
  - **Tests:** Test theme integration, responsive design, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 124-128, 146, 470-472_

- [ ] 89. MUI v7 Grid Updates

  - Find all Grid components using deprecated item prop
  - Replace item prop with size prop: `<Grid size={{ xs: 12, md: 6 }}>`
  - **WHAT:** Find all Grid components using deprecated props
  - **WHY:** MUI v7 compatibility
  - **HOW:** Replace item prop with size prop
  - **Tests:** Test Grid component functionality, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 132-133_

- [ ] 90. MUI v7 Autocomplete Updates

  - Find all Autocomplete components using deprecated renderTags
  - Replace renderTags with slots API
  - **WHAT:** Find all Autocomplete components using deprecated props
  - **WHY:** MUI v7 compatibility
  - **HOW:** Replace renderTags with slots API
  - **Tests:** Test Autocomplete functionality, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 134-135_

- [ ] 91. React Hook Form Updates
  - Search for watch() method usage in forms
  - Replace with controlled components using Controller
  - Use value and onChange when controlled for form fields
  - Use Controller with control prop for complex form fields
  - **WHAT:** Search for watch() method usage in forms
  - **WHY:** watch() causes unnecessary re-renders
  - **HOW:** Replace with Controller, controlled components
  - **Tests:** Test form performance, controlled components, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 129-131_

### Phase 2.3: Error Handling

- [ ] 92. ErrorBoundary Implementation

  - Use react-error-boundary package
  - Catch root-level errors and display user-friendly error page
  - Catch nested component errors at nearest error boundary without crashing entire app
  - Log errors for debugging
  - Provide reset/retry options when possible
  - **WHAT:** Read client/src/components/common/ErrorBoundary.jsx implementation
  - **WHY:** Prevents entire app crashes
  - **HOW:** Use react-error-boundary, wrap root app
  - **Tests:** Test error boundary functionality, error recovery, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 84-90, 143_

- [ ] 93. API Error Handling
  - Handle API response errors (4xx, 5xx)
  - 401 → logout user automatically
  - 403 → show error message, do NOT logout
  - Display appropriate error messages via toast notifications
  - Add global error handling for API calls
  - **WHAT:** Implement API error handling
  - **WHY:** Proper error handling improves UX
  - **HOW:** Handle 401/403 differently, use toast notifications
  - **Tests:** Test error handling scenarios, logout behavior, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 84-90, 157-158_

### Phase 2.4: File Upload

- [ ] 94. File Upload Implementation
  - Verify uses react-dropzone for file selection
  - Verify Cloudinary upload flow (Client → Cloudinary → Backend)
  - Verify backend receives URL
  - Implement gallery view with react-photo-album
  - Implement lightbox with yet-another-react-lightbox
  - **WHAT:** Read client/src/components/common/MuiFileUpload.jsx implementation
  - **WHY:** File uploads need proper Cloudinary integration
  - **HOW:** Use react-dropzone, Cloudinary upload, gallery/lightbox
  - **Tests:** Test file upload flow, Cloudinary integration, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 91-99, 142, 667-676_

### Phase 2.5: Routes and Navigation

- [ ] 95. Route Configuration Validation
  - Verify all routes are defined
  - Check protected route authentication logic
  - Validate route lazy loading
  - Confirm 404 fallback route
  - Add route-based code splitting
  - Implement route transition animations
  - Add breadcrumb support
  - Validate nested route authorization
  - Add route meta tags for SEO
  - Implement route guards for role-based access
  - **WHAT:** Read route configuration
  - **WHY:** Proper routing ensures navigation works correctly
  - **HOW:** Verify routes, lazy loading, protection
  - **Tests:** Test route navigation, protection, lazy loading, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 459-469_

### Phase 2.6: Authentication Components

- [ ] 96. Authentication Flow Validation
  - Verify token refresh logic
  - Check logout cleanup (clear tokens, Redux state)
  - Validate authentication state persistence
  - Add automatic token refresh before expiry
  - Implement logout on 401 responses globally
  - Add session timeout warning
  - Validate token storage security (httpOnly cookies vs localStorage)
  - Add multi-tab logout synchronization
  - Add role-based route protection
  - Implement intended destination after login
  - **WHAT:** Read authentication-related components
  - **WHY:** Authentication must work correctly for security
  - **HOW:** Verify token refresh, logout cleanup, persistence
  - **Tests:** Test authentication flow, token refresh, logout, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 70-75, 473-487_

### Phase 2.7: Pages Implementation

- [ ] 97. Dashboard Page Implementation

  - Implement dashboard widgets with real-time updates via Socket.IO
  - Add data visualization using MUI X Charts
  - Implement filters and date range selectors
  - Add export functionality
  - Validate responsive layout for all screen sizes
  - Add empty state for new organizations
  - **WHAT:** Read client/src/pages/Dashboard.jsx implementation
  - **WHY:** Dashboard provides overview of user's work
  - **HOW:** Implement widgets, charts, filters, real-time updates
  - **Tests:** Test dashboard functionality, real-time updates, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 488-503_

- [ ] 98. Organizations Page Implementation

  - Verify CRUD operations align with backend API
  - Check multi-tenancy handling (org switching)
  - Validate permission-based UI rendering
  - Implement organization switcher in header
  - Add organization creation workflow (wizard)
  - Validate organization deletion confirmation with cascade warning
  - Add organization settings page
  - Implement billing/subscription UI if applicable
  - **WHAT:** Read organizations page implementation
  - **WHY:** Platform administrators need to manage organizations
  - **HOW:** Verify CRUD, multi-tenancy, permissions
  - **Tests:** Test organization management, permissions, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 504-511_

- [ ] 99. Departments Page Implementation

  - Verify department list filtered by current organization
  - Check CRUD operations use correct API endpoints
  - Validate manager selection limited to org members
  - Add department hierarchy visualization if applicable
  - Implement drag-and-drop reordering
  - Add department member management
  - Validate empty state for new organizations
  - Add bulk operations (import/export)
  - **WHAT:** Read departments page implementation
  - **WHY:** Organization administrators need to manage departments
  - **HOW:** Verify filtering, CRUD, manager selection
  - **Tests:** Test department management, hierarchy, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 512-519_

- [ ] 100. Users Page Implementation

  - Verify user list scoped to organization
  - Check role assignment UI matches authorization matrix
  - Validate user invitation workflow
  - Implement user invitation via email
  - Add user deactivation vs deletion UI
  - Validate role change confirmation dialogs
  - Add user filtering by role, department, status
  - Implement user profile editing
  - Add password reset functionality
  - Validate user avatar upload with Cloudinary
  - **WHAT:** Read users page implementation
  - **WHY:** Administrators need to manage users
  - **HOW:** Verify scoping, role assignment, invitation
  - **Tests:** Test user management, role assignment, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 520-529_

- [ ] 101. Tasks Page Implementation

  - Verify task list filtered by organization
  - Check task type-specific forms (project, routine, assigned)
  - Validate task assignment UI shows only org members
  - Confirm task status workflow in UI
  - Implement Kanban board view with drag-and-drop
  - Add task filtering (status, priority, assignee, department, dates)
  - Validate task creation wizard for different types
  - Implement task comments with real-time updates
  - Add task activity timeline
  - Validate file attachment upload/preview
  - Implement subtask management
  - Add task dependencies visualization
  - Validate recurrence UI for routine tasks
  - Add milestone tracking for project tasks
  - Implement bulk task operations (assign, update status)
  - Add task export functionality
  - **WHAT:** Read tasks page implementation
  - **WHY:** Users need to manage tasks
  - **HOW:** Verify filtering, type-specific forms, Kanban
  - **Tests:** Test task management, Kanban board, real-time updates, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 530-545_

- [ ] 102. Materials Page Implementation

  - Verify material list scoped to organization
  - Check vendor selection limited to org vendors
  - Validate inventory tracking display
  - Add material search and filtering
  - Implement quantity adjustment workflow
  - Validate material categorization
  - Add low stock alerts
  - Implement material attachments (images, specs)
  - Add bulk import/export
  - **WHAT:** Read materials page implementation
  - **WHY:** Inventory managers need to manage materials
  - **HOW:** Verify scoping, vendor selection, inventory
  - **Tests:** Test material management, inventory tracking, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 546-554_

- [ ] 103. Vendors Page Implementation

  - Verify vendor list scoped to organization
  - Check vendor contact validation (email, phone)
  - Validate vendor-material relationship display
  - Add vendor search and filtering
  - Implement vendor rating system UI
  - Validate vendor contact management
  - Add vendor performance metrics
  - Implement vendor document attachments
  - **WHAT:** Read vendors page implementation
  - **WHY:** Procurement managers need to manage vendors
  - **HOW:** Verify scoping, contact validation, relationships
  - **Tests:** Test vendor management, relationships, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 555-562_

- [ ] 104. Home Page Implementation

  - Verify landing page for unauthenticated users
  - Check login/signup navigation
  - Add compelling landing page copy
  - Implement feature showcase
  - Add pricing/plans display if applicable
  - Validate responsive mobile design
  - **WHAT:** Read home page implementation
  - **WHY:** Visitors need informative landing page
  - **HOW:** Verify landing page, navigation
  - **Tests:** Test landing page, navigation, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 563-568_

- [ ] 105. Not Found Page Implementation

  - Verify 404 page displays correctly
  - Check navigation back to app
  - Add helpful navigation links
  - Implement search suggestion for mistyped routes
  - Add back to dashboard button
  - **WHAT:** Read 404 page implementation
  - **WHY:** Users need helpful 404 page
  - **HOW:** Verify 404 display, navigation
  - **Tests:** Test 404 page, navigation, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 569-573_

- [ ] 106. Forgot Password Page Implementation
  - Verify email submission workflow
  - Check success message display
  - Validate error handling
  - Add email format validation
  - Implement rate limiting UI feedback
  - Validate redirect after password reset
  - Add resend link functionality
  - **WHAT:** Read forgot password page implementation
  - **WHY:** Users need password reset functionality
  - **HOW:** Verify email submission, error handling
  - **Tests:** Test password reset flow, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 574-580_

### Phase 2.8: Common Components

- [ ] 107. Common Components Validation

  - Validate prop types for all common components
  - Ensure accessibility for all common components
  - Implement error boundaries for all common components
  - Add loading states for all common components
  - Ensure theme integration for all common components
  - Add PropTypes or TypeScript interfaces for all components
  - Implement comprehensive error handling for all components
  - Add loading/skeleton states for all components
  - Validate accessibility (ARIA labels, keyboard navigation) for all components
  - Ensure responsive design for all components
  - **WHAT:** Read all common components
  - **WHY:** Reusable components ensure UI consistency
  - **HOW:** Validate prop types, accessibility, error handling
  - **Tests:** Test component functionality, accessibility, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 581-591_

- [ ] 108. Form Components Validation

  - Validate form validation using react-hook-form for all forms
  - Implement error display for all forms
  - Add submission handling for all forms
  - Implement field dependencies for all forms
  - Add reset behavior for all forms
  - Implement proper form validation rules matching backend validators
  - Add client-side validation for UX (before API call)
  - Validate form submission error handling (network errors, 400/422 responses)
  - Add form field dependencies (conditional fields)
  - Implement form auto-save for drafts
  - Add form reset after successful submission
  - Validate file upload forms integrate with Cloudinary
  - Add form progress indicators for multi-step forms
  - **WHAT:** Read all form components
  - **WHY:** Forms need proper validation and error handling
  - **HOW:** Validate react-hook-form usage, error display
  - **Tests:** Test form validation, submission, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 592-604_

- [ ] 109. Card Components Validation

  - Validate data display for all card components
  - Implement actions (edit, delete, view) for all card components
  - Ensure responsive layout for all card components
  - Add empty states for all card components
  - Add skeleton loading states for all card components
  - Implement card actions with permission checks
  - Validate responsive grid layout for all card components
  - Add card hover effects (theme-based)
  - Implement card selection for bulk operations
  - **WHAT:** Read all card components
  - **WHY:** Cards display data consistently
  - **HOW:** Validate data display, actions, responsive layout
  - **Tests:** Test card functionality, responsiveness, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 605-613_

- [ ] 110. Column Definitions Validation

  - Validate MUI DataGrid column configs for all column definitions
  - Implement custom renderers for all column definitions
  - Add sorting for all column definitions
  - Implement filtering for all column definitions
  - Add action columns for all column definitions
  - Add custom cell renderers for complex data (status chips, avatars)
  - Implement action columns with permission-based visibility
  - Validate sortable/filterable columns
  - Add column resize/reorder functionality
  - Implement column visibility toggles
  - **WHAT:** Read all column definition files
  - **WHY:** DataGrid columns need proper configuration
  - **HOW:** Validate column configs, renderers, sorting
  - **Tests:** Test DataGrid functionality, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 614-623_

- [ ] 111. Filter Components Validation

  - Verify filters update URL query params
  - Check filter state persists on navigation
  - Validate filter reset functionality
  - Implement advanced filter builder
  - Add filter presets (saved filters)
  - Validate filter debouncing for performance
  - Add filter count badges
  - **WHAT:** Read all filter components
  - **WHY:** Filters need proper state management
  - **HOW:** Verify URL params, persistence, reset
  - **Tests:** Test filter functionality, persistence, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 624-630_

- [ ] 112. List Components Validation
  - Verify list rendering performance (virtualization if needed)
  - Check empty state display
  - Validate infinite scroll or pagination
  - Add skeleton loading for lists
  - Implement pull-to-refresh for mobile
  - Validate list item actions
  - **WHAT:** Read all list components
  - **WHY:** Lists need performance optimization
  - **HOW:** Verify virtualization, empty states, pagination
  - **Tests:** Test list performance, empty states, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 631-636_

### Phase 2.9: Redux Implementation

- [ ] 113. Redux Store Configuration

  - Verify Redux persist configuration
  - Check middleware setup
  - Validate reducer combination
  - Add Redux DevTools extension for development
  - Implement state migration for persist upgrades
  - Validate state shape consistency
  - Add performance monitoring middleware
  - **WHAT:** Read Redux store configuration
  - **WHY:** Redux needs proper configuration
  - **HOW:** Verify persist, middleware, reducers
  - **Tests:** Test store configuration, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 637-643_

- [ ] 114. Redux Feature Slices Validation
  - Verify async thunks use correct API endpoints for all feature slices
  - Check loading/error state handling for all feature slices
  - Validate optimistic updates for better UX for all feature slices
  - Confirm state normalization for relational data for all feature slices
  - Validate selector memoization for all feature slices
  - Implement proper error serialization for all feature slices
  - Add retry logic for failed API calls for all feature slices
  - Validate state cleanup on logout for all feature slices
  - Add cache invalidation logic for all feature slices
  - Implement optimistic updates with rollback on error for all feature slices
  - Validate organization-scoped state isolation for all feature slices
  - Add real-time state updates via Socket.IO integration for all feature slices
  - Implement pagination state management for all feature slices
  - Add filter/search state persistence for all feature slices
  - **WHAT:** Read all Redux feature slices
  - **WHY:** Feature slices need proper state management
  - **HOW:** Verify API endpoints, loading/error states, optimistic updates
  - **Tests:** Test feature slice functionality, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 644-657_

### Phase 2.10: Services Implementation

- [ ] 115. Socket.IO Service Validation

  - Verify Socket.IO connection uses JWT authentication
  - Check organization room joining
  - Validate event handlers update Redux state
  - Confirm reconnection logic
  - Add connection error handling
  - Implement exponential backoff for reconnections
  - Validate event payload structure
  - Add socket connection status indicator in UI
  - Implement heartbeat/ping-pong
  - Validate event unsubscription on component unmount
  - **WHAT:** Read Socket.IO service implementation
  - **WHY:** Real-time features need proper Socket.IO integration
  - **HOW:** Verify JWT auth, room joining, event handlers
  - **Tests:** Test Socket.IO connection, events, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 658-666_

- [ ] 116. Cloudinary Service Validation

  - Verify upload uses correct Cloudinary preset
  - Check file size/type validation
  - Validate progress tracking
  - Confirm upload error handling
  - Add image transformation (resize, crop) before upload
  - Implement upload cancellation
  - Validate upload retry logic
  - Add preview generation
  - Implement secure upload signatures if needed
  - **WHAT:** Read Cloudinary service implementation
  - **WHY:** File uploads need proper Cloudinary integration
  - **HOW:** Verify preset, validation, progress tracking
  - **Tests:** Test Cloudinary upload functionality, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 667-676_

- [ ] 117. Frontend Utils Validation
  - Verify all utility functions are pure and testable
  - Check date formatting uses dayjs consistently
  - Validate API client (axios) configuration
  - Add axios interceptors for auth tokens
  - Implement global error handling for API calls
  - Validate request/response transformations
  - Add request retry logic
  - Implement request deduplication
  - Add API client logging for debugging
  - **WHAT:** Read frontend utility functions
  - **WHY:** Utilities need proper implementation
  - **HOW:** Verify purity, date formatting, API client
  - **Tests:** Test utility functions, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 677-685_

### Phase 2.11: Global Frontend Requirements

- [ ] 118. Global Error Handling

  - Implement global error boundary
  - Add toast notifications for API errors (react-toastify)
  - Validate user-friendly error messages
  - Add error logging/reporting service integration
  - Implement offline detection and UI
  - **WHAT:** Implement global error handling
  - **WHY:** Errors need consistent handling
  - **HOW:** Add error boundary, toast notifications
  - **Tests:** Test error handling, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 686-690_

- [ ] 119. Loading States Implementation

  - Add skeleton loaders for all data-dependent components
  - Implement global loading indicator
  - Validate suspense boundaries for lazy-loaded routes
  - Add progressive loading for large lists
  - **WHAT:** Implement loading states
  - **WHY:** Loading states improve UX
  - **HOW:** Add skeleton loaders, suspense boundaries
  - **Tests:** Test loading states, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 691-694_

- [ ] 120. Responsive Design Validation

  - Validate mobile-first approach
  - Check tablet layout (768px-1024px)
  - Validate desktop optimization (>1024px)
  - Add touch-friendly UI elements
  - Implement mobile navigation (hamburger menu)
  - **WHAT:** Validate responsive design
  - **WHY:** Application must work on all devices
  - **HOW:** Test all breakpoints, touch elements
  - **Tests:** Test responsive design on all devices, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 695-699_

- [ ] 121. Accessibility Implementation

  - Validate WCAG 2.1 AA compliance
  - Add proper ARIA labels and roles
  - Implement keyboard navigation
  - Validate color contrast ratios
  - Add screen reader support
  - Implement focus management
  - **WHAT:** Implement accessibility features
  - **WHY:** Application must be accessible
  - **HOW:** Add ARIA labels, keyboard navigation
  - **Tests:** Test accessibility compliance, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 700-705_

- [ ] 122. Performance Optimization

  - Add code splitting for routes
  - Implement lazy loading for heavy components
  - Validate bundle size (<500KB initial)
  - Add image optimization (WebP, lazy loading)
  - Implement virtual scrolling for long lists
  - Add performance monitoring (Web Vitals)
  - **WHAT:** Implement performance optimizations
  - **WHY:** Performance affects user experience
  - **HOW:** Add code splitting, lazy loading, optimization
  - **Tests:** Test bundle size, performance metrics, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 706-711_

- [ ] 123. Frontend Security Implementation

  - Validate XSS prevention (sanitize user-generated content)
  - Implement CSP compliance
  - Validate secure token storage
  - Add HTTPS enforcement
  - Implement rate limiting feedback in UI
  - Validate input sanitization before API calls
  - **WHAT:** Implement frontend security
  - **WHY:** Security is critical
  - **HOW:** Sanitize content, validate storage
  - **Tests:** Test security measures, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 712-717_

- [ ] 124. Real-time Features Implementation

  - Implement notification bell with real-time updates
  - Add online user indicator
  - Validate task updates broadcast to relevant users
  - Implement collaborative editing indicators
  - Add typing indicators for comments
  - **WHAT:** Implement real-time features
  - **WHY:** Real-time updates improve collaboration
  - **HOW:** Use Socket.IO for real-time updates
  - **Tests:** Test real-time functionality, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 718-722_

- [ ] 125. State Management Best Practices
  - Validate no prop drilling (use Redux for shared state)
  - Implement local state for UI-only concerns
  - Validate state persistence (Redux persist)
  - Add state reset on logout
  - Implement undo/redo for critical operations
  - **WHAT:** Validate state management
  - **WHY:** Proper state management prevents bugs
  - **HOW:** Use Redux for shared state, local for UI
  - **Tests:** Test state management, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 723-727_

### Phase 2.12: Frontend Testing

- [ ] 126. Frontend Unit Tests

  - Add unit tests for utility functions
  - Implement component tests with React Testing Library
  - **WHAT:** Create frontend unit tests
  - **WHY:** Unit tests verify component behavior
  - **HOW:** Use React Testing Library
  - **Tests:** Test utility functions, components, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 728-729_

- [ ] 127. Frontend Integration Tests

  - Add integration tests for critical flows
  - Validate E2E tests with Playwright or Cypress
  - **WHAT:** Create frontend integration tests
  - **WHY:** Integration tests verify complete flows
  - **HOW:** Use Playwright or Cypress
  - **Tests:** Test critical user flows, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 730-731_

- [ ] 128. Phase 2 Checkpoint
  - Ensure all frontend tests pass
  - Verify production build succeeds
  - Validate bundle size (<500KB initial)
  - Document all changes
  - Update steering documents
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 14-17_

## Final Verification

- [ ] 129. Complete System Testing

  - Run all backend tests (npm test in backend/)
  - Run all frontend tests (npm test in client/)
  - Verify production build (npm run build in client/)
  - Test complete user flows end-to-end
  - Verify all 735 requirements addressed
  - **WHAT:** Complete system verification
  - **WHY:** Ensure production readiness
  - **HOW:** Run all tests, verify builds, test flows
  - **Tests:** All tests passing, builds succeeding, use --testPathPatterns instead of --testPathPattern, wait until the test complete
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 1-735_

- [ ] 130. Documentation Completion

  - Verify all changes documented in backend/docs
  - Update steering documents (tech.md, structure.md, product.md)
  - Create deployment checklist
  - Document API endpoints (OpenAPI/Swagger)
  - Create user documentation
  - **WHAT:** Complete documentation
  - **WHY:** Documentation enables maintenance
  - **HOW:** Document all changes, create guides
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 137-141_

- [ ] 131. Production Readiness Checklist
  - All 735 requirements validated and addressed
  - All tests passing with >80% coverage
  - No npm audit vulnerabilities
  - Environment variables documented
  - Graceful shutdown implemented
  - Health checks working
  - Rate limiting configured
  - Security headers validated
  - Database indexes created
  - Socket.IO authentication working
  - Email service functional
  - Cloudinary integration working
  - All cascade operations working
  - All authorization rules enforced
  - **WHAT:** Final production readiness verification
  - **WHY:** Ensure system is production-ready
  - **HOW:** Verify all checklist items
  - _Requirements: 2.1-2.6, 6-11, 12-17, 74.1, 732-735_
