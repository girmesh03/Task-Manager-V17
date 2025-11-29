# Requirements Document

## Introduction

This specification covers the complete validation, correction, and completion of the Multi-Tenant SaaS Task Manager codebase to make it production-ready. The system follows a strict hierarchy: Organization → Department → User, with JWT-based authentication, role-based authorization (SuperAdmin, Admin, Manager, User), and universal soft delete.

**Critical Execution Rules:**

- Phase 1 (Backend) MUST be 100% complete before Phase 2 (Frontend)
- Phase 1.1 MUST complete before Phase 1.2 begins
- All 735 requirements from backend/docs/codebase-requirements.md MUST be addressed
- All tests MUST pass before proceeding to next phase
- All changes MUST be documented in backend/docs

> [!IMPORTANT] > **Critical Implementation Rules (STRICTLY ENFORCED)**
>
> **#1 MANDATORY: WHAT-WHY-HOW Analysis (APPLIES TO EVERY CHANGE)**
>
> Before making ANY change/update to ANY file:
>
> 1. **WHAT exists?** - First identify what currently exists in the codebase (both backend and frontend)
>
>    - Read the existing file completely
>    - Understand current implementation
>    - Identify current patterns and structure
>    - Document current behavior
>
> 2. **WHY change?** - Justify the change
>
>    - What requirement necessitates this change?
>    - What problem does it solve?
>    - What will break if we don't change it?
>    - Is it aligned with production readiness requirements?
>
> 3. **HOW to change?** - Plan the implementation
>    - How will the change be implemented?
>    - How does it respect existing codebase structure?
>    - How does it integrate with existing patterns?
>    - What tests will verify the change?
>
> **The existing codebase MUST be respected.** Do not impose arbitrary patterns. Work WITH the existing architecture, not against it.

## Glossary

- **Platform Organization**: Organization owning the SaaS platform, identified by `isPlatformOrg: true`
- **Platform User**: User belonging to platform organization, identified by `isPlatformUser: true`
- **Customer Organization**: Tenant organizations using the SaaS platform
- **HOD (Head of Department)**: User with SuperAdmin/Admin role leading a department, `isHod: true`
- **Soft Delete**: Marking records as deleted (`isDeleted: true`) without physical removal
- **Cascade Delete**: Automatically soft-deleting child resources when parent is deleted
- **TTL (Time To Live)**: Automatic permanent deletion of soft-deleted records after expiry
- **Authorization Matrix**: JSON configuration defining permissions per role per resource
- **Scoping**: Filtering queries by organization and department for multi-tenancy

## Requirements

### Requirement 1: Phase Execution

**User Story:** As a project manager, I want strict sequential phase execution, so that dependencies are properly managed.

#### Acceptance Criteria

1. THE System SHALL complete Phase 1 (Backend) 100% before proceeding to Phase 2 (Frontend)
2. THE System SHALL complete Phase 1.1 before Phase 1.2 begins
3. THE System SHALL pass all backend tests before starting Phase 2
4. THE System SHALL ensure cascade deletion/restoration works flawlessly before Phase 2
5. THE System SHALL document all changes in backend/docs

### Requirement 2: Task Execution

**User Story:** As a developer, I want clear task execution requirements, so that work is properly organized and documented.

#### Acceptance Criteria

1. THE System SHALL place all tests in backend/tests folder
2. THE System SHALL place all documentation in backend/docs folder
3. WHEN a task is completed THEN the System SHALL run all tests and ensure they pass
4. WHEN a task is completed THEN the System SHALL document all changes
5. WHEN a task is completed THEN the System SHALL update steering documents
6. WHEN starting a new task THEN the System SHALL reference existing docs in backend/docs

### Requirement 3: Configuration - Helmet and Security Headers

**User Story:** As a security engineer, I want proper security headers configured, so that the application is protected against common attacks.

#### Acceptance Criteria

1. WHEN Helmet is configured THEN the System SHALL include Cloudinary CDN (https://res.cloudinary.com) in CSP directives
2. THE System SHALL verify helmet CSP directives cover all necessary sources
3. THE System SHALL add security headers validation
4. THE System SHALL apply Helmet.js security headers

### Requirement 4: Configuration - CORS

**User Story:** As a developer, I want CORS properly configured, so that cross-origin requests work correctly.

#### Acceptance Criteria

1. THE System SHALL align CORS configuration with allowedOrigins.js
2. THE System SHALL enable credentials for cookie-based auth
3. THE System SHALL validate preflight caching is appropriate
4. THE System SHALL add environment-specific origin lists
5. THE System SHALL implement origin validation logging
6. THE System SHALL add proper error handling for disallowed origins
7. THE System SHALL confirm all production/staging/dev origins are listed
8. THE System SHALL verify no wildcard origins in production
9. THE System SHALL add regex pattern support for dynamic subdomains if needed
10. THE System SHALL document each origin's purpose

### Requirement 5: Configuration - Request Handling

**User Story:** As a developer, I want proper request handling configuration, so that payloads are processed correctly.

#### Acceptance Criteria

1. THE System SHALL use 10mb request payload limits for production
2. THE System SHALL apply rate limiting to all API routes
3. THE System SHALL add request ID middleware for tracing
4. THE System SHALL configure compression threshold (1KB)
5. THE System SHALL implement API versioning in route paths (/api/\*)

### Requirement 6: Configuration - Server and Database

**User Story:** As a DevOps engineer, I want production-ready server and database configuration, so that the system is reliable and performant.

#### Acceptance Criteria

1. THE System SHALL validate all required env vars (MONGODB_URI, JWT secrets, Cloudinary, Email)
2. THE System SHALL implement graceful shutdown for HTTP, Socket.IO, and MongoDB connections
3. THE System SHALL verify email service initialization doesn't block server startup
4. THE System SHALL confirm seed data only runs in development
5. THE System SHALL check Socket.IO instance is set before use
6. THE System SHALL validate timezone is UTC globally
7. THE System SHALL add health check for database connection status
8. THE System SHALL implement retry logic for MongoDB connection failures
9. THE System SHALL add readiness/liveness probes for K8s
10. THE System SHALL ensure all process handlers (SIGINT, SIGTERM) are tested
11. THE System SHALL add structured logging (Winston or Pino)
12. THE System SHALL validate PORT environment variable parsing
13. THE System SHALL check MongoDB connection options are production-ready
14. THE System SHALL verify connection pooling is properly configured
15. THE System SHALL validate retry logic handles transient failures
16. THE System SHALL check indexes are created on schema initialization
17. THE System SHALL add connection timeout configurations
18. THE System SHALL implement connection health monitoring
19. THE System SHALL add read/write concern configurations for production
20. THE System SHALL ensure proper handling of replica set failures

### Requirement 7: Soft Delete Plugin

**User Story:** As a data administrator, I want universal soft delete functionality, so that data can be recovered.

#### Acceptance Criteria

1. THE System SHALL prevent hard deletes completely via soft delete plugin
2. THE System SHALL ensure withDeleted() and onlyDeleted() query helpers work
3. THE System SHALL validate aggregate pipeline filtering for isDeleted
4. THE System SHALL confirm deletedBy tracks user who deleted
5. THE System SHALL check restore functionality clears all soft-delete fields
6. THE System SHALL validate TTL index creation for auto-cleanup
7. THE System SHALL test cascade soft-delete across ALL relationships
8. THE System SHALL ensure softDeleteMany works with filters
9. THE System SHALL add validation hooks to prevent isDeleted manipulation outside methods
10. THE System SHALL implement audit trail for restore operations
11. THE System SHALL add bulk restore method if missing
12. THE System SHALL test transaction support for all soft-delete operations

### Requirement 8: User Model

**User Story:** As a security engineer, I want secure user model implementation, so that credentials and sensitive data are protected.

#### Acceptance Criteria

1. THE System SHALL validate password hashing uses bcrypt with proper salt rounds (≥12)
2. THE System SHALL check email validation and uniqueness (scoped to organization)
3. THE System SHALL verify role enum values match authorization matrix
4. THE System SHALL confirm sensitive fields (password, refreshToken) are excluded from queries
5. THE System SHALL validate comparePassword method is secure
6. THE System SHALL check token generation/validation methods
7. THE System SHALL add index on email + organization for multi-tenancy
8. THE System SHALL implement password complexity validation
9. THE System SHALL add account lockout after failed login attempts
10. THE System SHALL validate email verification workflow
11. THE System SHALL add lastLogin tracking
12. THE System SHALL ensure cascade soft-delete handles user's tasks, comments, activities

### Requirement 9: Organization Model

**User Story:** As a platform administrator, I want proper organization model implementation, so that multi-tenancy works correctly.

#### Acceptance Criteria

1. THE System SHALL validate organization name uniqueness
2. THE System SHALL check owner reference integrity
3. THE System SHALL verify subscription/billing fields are indexed
4. THE System SHALL validate settings schema completeness
5. THE System SHALL add cascade soft-delete for ALL child resources (departments, users, tasks, materials, vendors)
6. THE System SHALL implement organization archival workflow
7. THE System SHALL add billing/subscription validation hooks
8. THE System SHALL ensure owner cannot be deleted while owning organization
9. THE System SHALL add organization transfer functionality validation
10. THE System SHALL include isPlatformOrg boolean field in Organization schema
11. THE System SHALL include isPlatformUser boolean field in User schema
12. THE System SHALL include isHod boolean field in User schema
13. THE System SHALL query platform organization by isPlatformOrg=true instead of PLATFORM_ORGANIZATION_ID env var
14. THE System SHALL check platform user by isPlatformUser=true instead of comparing with env var
15. THE System SHALL check HOD by isHod=true for users with SuperAdmin or Admin role

### Requirement 10: Department Model

**User Story:** As an organization administrator, I want proper department model implementation, so that organizational structure is maintained.

#### Acceptance Criteria

1. THE System SHALL validate department belongs to organization (multi-tenancy)
2. THE System SHALL check manager reference integrity
3. THE System SHALL verify unique constraint on name + organization
4. THE System SHALL add cascade soft-delete for tasks and users in department
5. THE System SHALL validate manager is part of same organization
6. THE System SHALL add hierarchy validation if departments have parent/child
7. THE System SHALL ensure restore checks organization existence

### Requirement 11: Task Models

**User Story:** As a developer, I want proper task model implementation with discriminator pattern, so that task types are handled correctly.

#### Acceptance Criteria

1. THE System SHALL validate discriminator pattern implementation
2. THE System SHALL check all task types inherit base fields correctly
3. THE System SHALL verify timestamps and status transitions
4. THE System SHALL validate assignees are scoped to organization
5. THE System SHALL check priority, status enum values
6. THE System SHALL implement cascade soft-delete for TaskComment, TaskActivity, Attachment
7. THE System SHALL add validation for status workflow (e.g., can't go from completed to pending)
8. THE System SHALL ensure assignees/watchers are validated against organization membership
9. THE System SHALL add due date validation logic
10. THE System SHALL implement recurrence logic validation for RoutineTask
11. THE System SHALL validate project milestones for ProjectTask
12. THE System SHALL add bulk operations with transaction support

### Requirement 12: TaskActivity Model

**User Story:** As a user, I want task activities properly tracked, so that task history is maintained.

#### Acceptance Criteria

1. THE System SHALL validate author belongs to task's organization
2. THE System SHALL check task reference integrity
3. THE System SHALL verify activity type enum coverage
4. THE System SHALL add cascade soft-delete when task is deleted
5. THE System SHALL add cascade soft-delete when author (user) is deleted

### Requirement 13: TaskComment Model

**User Story:** As a user, I want task comments properly managed, so that collaboration is supported.

#### Acceptance Criteria

1. THE System SHALL validate comment edit/delete permissions
2. THE System SHALL add mentions/notifications integration
3. THE System SHALL ensure restore validates parent task existence
4. THE System SHALL enforce max depth 3 for threaded comments

### Requirement 14: Attachment Model

**User Story:** As a user, I want attachments properly managed, so that files are handled correctly.

#### Acceptance Criteria

1. THE System SHALL validate Cloudinary URL format
2. THE System SHALL check file size and type restrictions
3. THE System SHALL verify uploader is org member
4. THE System SHALL validate reference integrity (task, material, etc.)
5. THE System SHALL delete from Cloudinary when attachment is hard-deleted
6. THE System SHALL add virus scanning validation hook
7. THE System SHALL implement storage quota validation per organization
8. THE System SHALL add cascade delete when parent resource (task/material) is deleted
9. THE System SHALL validate supported file types against whitelist
10. THE System SHALL add thumbnail generation for images

### Requirement 15: Material Model

**User Story:** As an inventory manager, I want materials properly managed, so that inventory is tracked correctly.

#### Acceptance Criteria

1. THE System SHALL validate material belongs to organization
2. THE System SHALL check quantity/unit validations
3. THE System SHALL verify supplier/vendor references
4. THE System SHALL add cascade soft-delete for attachments
5. THE System SHALL validate vendor belongs to same organization
6. THE System SHALL add inventory tracking validation
7. THE System SHALL implement audit trail for quantity changes

### Requirement 16: Vendor Model

**User Story:** As a procurement manager, I want vendors properly managed, so that supplier relationships are maintained.

#### Acceptance Criteria

1. THE System SHALL validate vendor scoped to organization
2. THE System SHALL check contact information format
3. THE System SHALL verify email/phone validation
4. THE System SHALL add cascade handling for materials using this vendor
5. THE System SHALL validate unique constraint on name + organization
6. THE System SHALL add vendor rating/status validation

### Requirement 17: Notification Model

**User Story:** As a user, I want notifications properly managed, so that I receive timely updates.

#### Acceptance Criteria

1. THE System SHALL validate recipient is org member
2. THE System SHALL check notification type enum
3. THE System SHALL verify read status tracking
4. THE System SHALL add cascade soft-delete when recipient is deleted
5. THE System SHALL implement notification expiry/cleanup
6. THE System SHALL add batch mark-as-read functionality
7. THE System SHALL validate notification payload structure

### Requirement 18: Routes Configuration

**User Story:** As a developer, I want routes properly configured, so that API endpoints work correctly.

#### Acceptance Criteria

1. THE System SHALL verify authentication middleware applied to protected routes
2. THE System SHALL check authorization middleware uses correct permissions from matrix
3. THE System SHALL validate request validation middleware order (validate → auth → authorize → controller)
4. THE System SHALL confirm rate limiting on expensive operations
5. THE System SHALL verify route parameter validation (e.g., MongoDB ObjectId format)
6. THE System SHALL add request logging middleware for audit trail
7. THE System SHALL ensure consistent error responses (use CustomError)
8. THE System SHALL add pagination validation for list endpoints
9. THE System SHALL implement field filtering/selection validation
10. THE System SHALL add query sanitization for search endpoints
11. THE System SHALL validate bulk operation endpoints use transactions
12. THE System SHALL add OpenAPI/Swagger documentation comments
13. THE System SHALL check all routes are properly mounted
14. THE System SHALL verify route ordering (specific before generic)
15. THE System SHALL add API versioning support
16. THE System SHALL implement route deprecation warnings
17. THE System SHALL add health check routes

### Requirement 19: Controllers

**User Story:** As a developer, I want controllers properly implemented, so that business logic is handled correctly.

#### Acceptance Criteria

1. THE System SHALL verify all async operations use async/await or proper promise handling
2. THE System SHALL check error handling wraps operations (express-async-handler or try/catch)
3. THE System SHALL validate input sanitization before database operations
4. THE System SHALL confirm multi-tenancy: all queries filter by organization
5. THE System SHALL verify pagination uses mongoose-paginate-v2 correctly
6. THE System SHALL check soft-delete operations use plugin methods
7. THE System SHALL validate transaction usage for multi-document operations
8. THE System SHALL implement cascade deletion validation in delete operations
9. THE System SHALL add transaction rollback on cascade delete failures
10. THE System SHALL ensure all responses use consistent format (responseTransform)
11. THE System SHALL add input validation for edge cases (empty strings, null, undefined)
12. THE System SHALL implement proper HTTP status codes (200, 201, 204, 400, 401, 403, 404, 409, 500)
13. THE System SHALL add logging for all errors with context
14. THE System SHALL validate socket emission for real-time updates
15. THE System SHALL add rate limiting for sensitive operations (create, update, delete)
16. THE System SHALL implement idempotency keys for create operations if needed
17. THE System SHALL add proper authorization checks (req.user permissions)

### Requirement 20: Task Controllers

**User Story:** As a user, I want task operations properly handled, so that task management works correctly.

#### Acceptance Criteria

1. THE System SHALL validate task assignment logic checks assignee organization membership
2. THE System SHALL implement task status workflow validation
3. THE System SHALL add validation for task type-specific fields
4. THE System SHALL ensure subtask handling works correctly
5. THE System SHALL validate task dependencies (can't delete if blocking other tasks)
6. THE System SHALL add bulk import/export validation

### Requirement 21: User Controllers

**User Story:** As an administrator, I want user operations properly handled, so that user management works correctly.

#### Acceptance Criteria

1. THE System SHALL validate user deletion checks for task ownership/assignment
2. THE System SHALL implement user deactivation vs deletion logic
3. THE System SHALL add password change validation (old password verification)
4. THE System SHALL ensure email change requires verification
5. THE System SHALL validate role changes respect authorization matrix
6. THE System SHALL add audit logging for permission changes

### Requirement 22: Auth Controllers

**User Story:** As a user, I want authentication properly handled, so that login/logout works securely.

#### Acceptance Criteria

1. THE System SHALL validate JWT refresh token rotation
2. THE System SHALL implement token blacklisting on logout
3. THE System SHALL add brute-force protection on login
4. THE System SHALL validate password reset token expiry
5. THE System SHALL ensure email verification workflow
6. THE System SHALL add OAuth integration validation if applicable

### Requirement 23: Auth Middleware

**User Story:** As a security engineer, I want authentication middleware properly implemented, so that requests are authenticated correctly.

#### Acceptance Criteria

1. THE System SHALL verify JWT verification uses correct secrets
2. THE System SHALL check token expiry handling
3. THE System SHALL validate refresh token logic
4. THE System SHALL add token blacklist check for logged-out tokens
5. THE System SHALL implement token refresh logic
6. THE System SHALL add request context (req.user) population
7. THE System SHALL validate token payload structure
8. THE System SHALL add graceful handling for expired tokens

### Requirement 24: Authorization Middleware

**User Story:** As a security engineer, I want authorization middleware properly implemented, so that permissions are enforced correctly.

#### Acceptance Criteria

1. THE System SHALL check authorization matrix covers all roles and resources
2. THE System SHALL verify permission checking logic
3. THE System SHALL validate organization-scoped authorization
4. THE System SHALL add dynamic permission loading
5. THE System SHALL implement resource-level permissions (e.g., own tasks vs all tasks)
6. THE System SHALL add logging for authorization failures
7. THE System SHALL validate role hierarchy (e.g., admin > manager > member)
8. WHEN checking "Own" permission for tasks THEN the System SHALL verify user is in createdBy or assignees array
9. WHEN checking "Own" permission for attachments THEN the System SHALL verify user is uploadedBy
10. WHEN checking "Own" permission for comments THEN the System SHALL verify user is createdBy
11. WHEN checking "Own" permission for activities THEN the System SHALL verify user is createdBy
12. WHEN checking "Own" permission for notifications THEN the System SHALL verify user is in recipients array
13. WHEN checking "Own" permission for materials THEN the System SHALL verify user is createdBy or uploadedBy
14. WHEN checking "Own" permission for vendors THEN the System SHALL verify user is createdBy
15. THE System SHALL identify all ownership fields (createdBy, uploadedBy, assignees, recipients, watchers)

### Requirement 25: Rate Limiter Middleware

**User Story:** As a security engineer, I want rate limiting properly implemented, so that abuse is prevented.

#### Acceptance Criteria

1. THE System SHALL check rate limit thresholds are production-appropriate
2. THE System SHALL verify rate limit storage (memory vs Redis)
3. THE System SHALL validate rate limit headers are sent
4. THE System SHALL implement Redis-based rate limiting for distributed systems
5. THE System SHALL add configurable rate limits per endpoint
6. THE System SHALL implement rate limit bypass for trusted IPs
7. THE System SHALL add rate limit monitoring/alerting

### Requirement 26: Validators

**User Story:** As a developer, I want validators properly implemented, so that input is validated correctly.

#### Acceptance Criteria

1. THE System SHALL verify all required fields are validated
2. THE System SHALL check data type validations
3. THE System SHALL validate sanitization methods
4. THE System SHALL confirm custom validators work correctly
5. THE System SHALL add comprehensive error messages for validation failures
6. THE System SHALL implement conditional validations (e.g., field required if another is present)
7. THE System SHALL add cross-field validations
8. THE System SHALL validate array/nested object structures
9. THE System SHALL add custom validators for business logic
10. THE System SHALL ensure validation error responses are user-friendly

### Requirement 27: Utils - Helpers and Cascade Operations

**User Story:** As a developer, I want utility functions properly implemented, so that common operations work correctly.

#### Acceptance Criteria

1. THE System SHALL verify all helper functions have proper error handling
2. THE System SHALL check cascadeDelete implementation handles all relationships
3. THE System SHALL ensure cascadeDelete recursive logic covers ALL models and relationships
4. THE System SHALL add cascade restore functionality
5. THE System SHALL implement transaction support for cascade operations
6. THE System SHALL add cascade operation logging
7. THE System SHALL validate circular dependency handling
8. THE System SHALL enforce cascade depth limits to prevent stack overflow

### Requirement 28: Utils - Socket.IO

**User Story:** As a developer, I want Socket.IO utilities properly implemented, so that real-time features work correctly.

#### Acceptance Criteria

1. THE System SHALL verify Socket.IO authentication
2. THE System SHALL check room/namespace isolation by organization
3. THE System SHALL validate event emission patterns
4. THE System SHALL implement proper error handling for socket events
5. THE System SHALL add socket connection logging
6. THE System SHALL validate organization-based room isolation
7. THE System SHALL add reconnection handling
8. THE System SHALL implement socket event validation
9. THE System SHALL use same JWT secrets for both HTTP and Socket.IO
10. THE System SHALL use centralized token generation for both user and socket authentication
11. WHEN access token expires THEN the System SHALL refresh both HTTP and Socket.IO tokens simultaneously
12. WHEN token refresh fails THEN the System SHALL logout user from both HTTP and Socket.IO sessions
13. WHEN user logs out THEN the System SHALL invalidate tokens for both HTTP and Socket.IO connections

### Requirement 29: Utils - Constants

**User Story:** As a developer, I want constants properly defined, so that values are consistent across the codebase.

#### Acceptance Criteria

1. THE System SHALL verify all enums match model definitions
2. THE System SHALL check constant values are immutable
3. THE System SHALL add JSDoc for all constants
4. THE System SHALL validate enum completeness
5. THE System SHALL export constants in structured format

### Requirement 30: Testing Requirements

**User Story:** As a QA engineer, I want comprehensive testing, so that code quality is ensured.

#### Acceptance Criteria

1. THE System SHALL verify MongoDB memory server setup
2. THE System SHALL check test database isolation
3. THE System SHALL validate test data seeding
4. THE System SHALL ensure all tests use transactions for isolation
5. THE System SHALL add comprehensive test fixtures
6. THE System SHALL implement test data factories
7. THE System SHALL add test coverage reporting
8. THE System SHALL validate cleanup after each test
9. THE System SHALL create unit tests for each controller, model, middleware
10. THE System SHALL create integration tests for complete request/response cycles
11. THE System SHALL create property-based tests using fast-check for model validation
12. THE System SHALL create cascade deletion tests for organization, department, task, user deletion scenarios
13. THE System SHALL run all tests with npm test and npm run test:coverage
14. THE System SHALL achieve test coverage >80%
15. THE System SHALL pass all tests without failures
16. THE System SHALL isolate tests using transactions for database cleanup
17. THE System SHALL mock external dependencies (database, emails, Cloudinary)

### Requirement 31: Security Requirements

**User Story:** As a security engineer, I want comprehensive security measures, so that the application is protected.

#### Acceptance Criteria

1. THE System SHALL apply SQL/NoSQL injection prevention (mongoose sanitization)
2. THE System SHALL apply XSS protection (input sanitization, CSP headers)
3. THE System SHALL apply CSRF protection (SameSite cookies, CSRF tokens if needed)
4. THE System SHALL implement rate limiting on all endpoints
5. THE System SHALL apply Helmet.js security headers
6. THE System SHALL implement JWT secret rotation strategy
7. THE System SHALL apply HTTPS in production (enforce with HSTS)
8. THE System SHALL implement sensitive data encryption at rest
9. THE System SHALL ensure environment variable security (.env not committed)
10. THE System SHALL run dependency vulnerability scan (npm audit)
11. THE System SHALL verify protected routes verify JWT authentication
12. THE System SHALL use permissions from authorization matrix
13. THE System SHALL follow middleware order: auth → validate → authorize → controller
14. THE System SHALL limit expensive operations appropriately with rate limiting
15. THE System SHALL validate MongoDB ObjectId format for route parameters
16. THE System SHALL use proper secrets and expiry times for JWT tokens
17. THE System SHALL rotate refresh tokens on each refresh
18. THE System SHALL use bcrypt hashing with ≥12 salt rounds for passwords
19. THE System SHALL implement brute-force protection on login
20. THE System SHALL respect role hierarchy (SuperAdmin > Admin > Manager > User)
21. THE System SHALL allow Platform SuperAdmin cross-organization access (read on all resources, delete/restore on customer organization)
22. THE System SHALL limit Customer organization users to own organization
23. THE System SHALL sanitize user input against NoSQL injection
24. THE System SHALL include proper security headers via Helmet
25. THE System SHALL set httpOnly and secure flags on cookies
26. THE System SHALL enforce HTTPS via HSTS in production mode
27. THE System SHALL exclude sensitive data from queries (password, refreshToken, refreshTokenExpiry)

### Requirement 32: Performance Requirements

**User Story:** As a performance engineer, I want optimized performance, so that the application is fast and efficient.

#### Acceptance Criteria

1. THE System SHALL create database indexes on frequently queried fields
2. THE System SHALL implement pagination for all list endpoints
3. THE System SHALL apply query optimization (avoid N+1, use lean())
4. THE System SHALL implement response compression
5. THE System SHALL create caching strategy for static data (consider Redis)
6. THE System SHALL configure connection pooling
7. THE System SHALL implement Cloudinary image optimization

### Requirement 33: Timezone Management

**User Story:** As a user, I want consistent timezone handling, so that dates are displayed correctly.

#### Acceptance Criteria

1. THE System SHALL set process.env.TZ to 'UTC' on backend server startup
2. THE System SHALL configure Dayjs with utc and timezone plugins
3. THE System SHALL store all dates as UTC in Mongoose schemas
4. THE System SHALL automatically convert dates to UTC when saving to database
5. THE System SHALL return dates in ISO format in API responses
6. THE System SHALL convert incoming dates to UTC before saving in controllers
7. THE System SHALL detect user's local timezone on frontend
8. THE System SHALL convert UTC to local time when displaying dates on frontend
9. THE System SHALL convert local time to UTC when sending dates to API from frontend
10. THE System SHALL handle timezone conversion transparently in DateTimePicker
11. THE System SHALL provide UTC ↔ local conversion methods in date utility functions
12. THE System SHALL use consistent dayjs setup across frontend/backend

### Requirement 34: Frontend Error Handling

**User Story:** As a user, I want proper error handling, so that errors are displayed appropriately.

#### Acceptance Criteria

1. THE System SHALL use react-error-boundary package for ErrorBoundary
2. THE System SHALL catch root-level errors and display user-friendly error page
3. THE System SHALL catch nested component errors at nearest error boundary without crashing entire app
4. THE System SHALL handle API response errors (4xx, 5xx) in RouteError
5. THE System SHALL display appropriate error messages via toast notifications for API errors
6. THE System SHALL log errors for debugging in error boundaries
7. THE System SHALL provide reset/retry options when possible for error recovery
8. WHEN 401 errors occur on frontend THEN the System SHALL automatically logout the user
9. WHEN 403 errors occur on frontend THEN the System SHALL show error but NOT logout

### Requirement 35: File Upload

**User Story:** As a user, I want file uploads to work correctly, so that I can attach files to resources.

#### Acceptance Criteria

1. THE System SHALL use react-dropzone for file selection
2. THE System SHALL upload files directly to Cloudinary from client
3. WHEN Cloudinary upload succeeds THEN the System SHALL send Cloudinary URL to backend
4. WHEN backend receives Cloudinary URL THEN the System SHALL store URL in database
5. THE System SHALL use react-photo-album for gallery view image display
6. THE System SHALL use yet-another-react-lightbox for image lightbox
7. THE System SHALL follow client → Cloudinary → backend flow for profile picture upload
8. THE System SHALL follow client → Cloudinary → backend flow for organization logo upload
9. THE System SHALL follow client → Cloudinary → backend flow for task attachment upload
10. WHEN task create/update fails THEN the System SHALL delete uploaded attachments from Cloudinary

### Requirement 36: Frontend Code Quality

**User Story:** As a developer, I want consistent code quality, so that the codebase is maintainable.

#### Acceptance Criteria

1. THE System SHALL map constants from backend/utils/constants.js to client/src/utils/constants.js
2. THE System SHALL import TASK_STATUS, TASK_PRIORITY, USER_ROLES from constants instead of hardcoding
3. THE System SHALL NEVER use hardcoded styling values in components
4. THE System SHALL use theme.palette, theme.typography, theme.spacing for theme values
5. THE System SHALL use MUI styled() API for custom styling
6. THE System SHALL use theme breakpoints for responsive design
7. THE System SHALL use theme spacing units for spacing
8. THE System SHALL NEVER use watch() method in React Hook Form
9. THE System SHALL ALWAYS use value and onChange when controlled for form fields
10. THE System SHALL use Controller with control prop for complex form fields
11. THE System SHALL NEVER use item prop in Grid component
12. THE System SHALL use size prop for Grid sizing: `<Grid size={{ xs: 12, md: 6 }}>`
13. THE System SHALL NEVER use deprecated renderTags in MUI Autocomplete
14. THE System SHALL use slots API for custom rendering
15. THE System SHALL follow MUI v7 syntax and deprecation guidelines

### Requirement 37: Documentation

**User Story:** As a developer, I want comprehensive documentation, so that the codebase is understandable.

#### Acceptance Criteria

1. THE System SHALL document all changes in backend/docs
2. THE System SHALL log errors with proper context and log/unlog flag in backend/.env
3. THE System SHALL log audit events for compliance
4. THE System SHALL include OpenAPI/Swagger documentation for API
5. THE System SHALL update steering documents after test completion

### Requirement 38: Architecture

**User Story:** As an architect, I want proper architecture implementation, so that the system is well-structured.

#### Acceptance Criteria

1. THE System SHALL implement layered architecture: Client → API Gateway → Authentication → Authorization → Controller → Service → Data → Database
2. THE System SHALL flow client uploads directly to Cloudinary, then send URL to backend
3. THE System SHALL use react-error-boundary for component errors, separate handler for API errors
4. THE System SHALL maintain identical values between backend and frontend for constants synchronization
5. THE System SHALL enforce theme-first approach across all components
6. THE System SHALL use recursive cascade delete/restore with MongoDB transactions for cascade operations
7. THE System SHALL store dates in UTC and convert at boundaries for timezone management
8. THE System SHALL use database fields instead of environment variables for platform organization identification
9. THE System SHALL check multiple ownership fields dynamically for ownership-based authorization

### Requirement 39: Frontend Configuration

**User Story:** As a developer, I want proper frontend configuration, so that the build and runtime work correctly.

#### Acceptance Criteria

1. THE System SHALL verify all dependencies are up-to-date and secure
2. THE System SHALL check no unused dependencies
3. THE System SHALL validate build scripts work correctly
4. THE System SHALL run npm audit and fix vulnerabilities
5. THE System SHALL add production build optimization
6. THE System SHALL ensure dev dependencies are only in devDependencies
7. THE System SHALL add bundle size analysis script
8. THE System SHALL verify production build settings
9. THE System SHALL check environment variable handling
10. THE System SHALL validate proxy configuration for API
11. THE System SHALL add bundle splitting for optimal loading
12. THE System SHALL configure chunk size warnings
13. THE System SHALL implement tree-shaking optimization
14. THE System SHALL add source map generation for debugging
15. THE System SHALL configure Terser for production minification
16. THE System SHALL verify all required env vars are present
17. THE System SHALL check API URL formatting
18. THE System SHALL add validation in main.jsx for missing vars
19. THE System SHALL document all environment variables
20. THE System SHALL separate configs for dev/staging/production
21. THE System SHALL verify env variable validation works
22. THE System SHALL check error boundary for missing config
23. THE System SHALL validate Redux store and persist setup
24. THE System SHALL add performance monitoring initialization
25. THE System SHALL implement error tracking (Sentry integration if needed)
26. THE System SHALL add service worker registration for PWA
27. THE System SHALL validate strict mode compatibility with all dependencies
28. THE System SHALL verify provider hierarchy is correct
29. THE System SHALL check theme provider wraps all components
30. THE System SHALL validate router setup
31. THE System SHALL add global error boundary
32. THE System SHALL implement loading states for provider initialization
33. THE System SHALL add accessibility announcements for route changes

### Requirement 40: Frontend Routes

**User Story:** As a user, I want proper routing, so that navigation works correctly.

#### Acceptance Criteria

1. THE System SHALL verify all routes are defined
2. THE System SHALL check protected route authentication logic
3. THE System SHALL validate route lazy loading
4. THE System SHALL confirm 404 fallback route
5. THE System SHALL add route-based code splitting
6. THE System SHALL implement route transition animations
7. THE System SHALL add breadcrumb support
8. THE System SHALL validate nested route authorization
9. THE System SHALL add route meta tags for SEO
10. THE System SHALL implement route guards for role-based access

### Requirement 41: Theme

**User Story:** As a user, I want consistent theming, so that the UI looks professional.

#### Acceptance Criteria

1. THE System SHALL ensure all components use theme tokens (not hardcoded colors/spacing)
2. THE System SHALL verify responsive design uses theme breakpoints
3. THE System SHALL check dark mode compatibility

### Requirement 42: Authentication Components

**User Story:** As a user, I want authentication to work correctly, so that I can securely access the application.

#### Acceptance Criteria

1. THE System SHALL verify token refresh logic
2. THE System SHALL check logout cleanup (clear tokens, Redux state)
3. THE System SHALL validate authentication state persistence
4. THE System SHALL add automatic token refresh before expiry
5. THE System SHALL implement logout on 401 responses globally
6. THE System SHALL add session timeout warning
7. THE System SHALL validate token storage security (httpOnly cookies vs localStorage)
8. THE System SHALL add multi-tab logout synchronization
9. THE System SHALL verify authentication check logic
10. THE System SHALL check redirect behavior
11. THE System SHALL validate loading states
12. THE System SHALL add role-based route protection
13. THE System SHALL implement intended destination after login
14. THE System SHALL add permission checking for nested routes
15. THE System SHALL validate organization context for routes

### Requirement 43: Pages - General

**User Story:** As a user, I want pages to work correctly, so that I can use the application effectively.

#### Acceptance Criteria

1. THE System SHALL validate alignment with backend APIs for all pages
2. THE System SHALL implement error handling for all pages
3. THE System SHALL add loading states for all pages
4. THE System SHALL implement empty states for all pages
5. THE System SHALL add pagination for all list pages
6. THE System SHALL implement filtering for all list pages
7. THE System SHALL ensure responsive design for all pages
8. THE System SHALL verify data fetching uses correct Redux slices
9. THE System SHALL check error handling for failed API calls
10. THE System SHALL validate loading skeletons/spinners

### Requirement 44: Dashboard Page

**User Story:** As a user, I want a functional dashboard, so that I can see an overview of my work.

#### Acceptance Criteria

1. THE System SHALL implement dashboard widgets with real-time updates via Socket.IO
2. THE System SHALL add data visualization using MUI X Charts
3. THE System SHALL implement filters and date range selectors
4. THE System SHALL add export functionality
5. THE System SHALL validate responsive layout for all screen sizes
6. THE System SHALL add empty state for new organizations

### Requirement 45: Organizations Page

**User Story:** As a platform administrator, I want to manage organizations, so that I can administer tenants.

#### Acceptance Criteria

1. THE System SHALL verify CRUD operations align with backend API
2. THE System SHALL check multi-tenancy handling (org switching)
3. THE System SHALL validate permission-based UI rendering
4. THE System SHALL implement organization switcher in header
5. THE System SHALL add organization creation workflow (wizard)
6. THE System SHALL validate organization deletion confirmation with cascade warning
7. THE System SHALL add organization settings page
8. THE System SHALL implementscription UI if applicable

### Requirement 46: Departments Page

**User Story:** As an organization administrator, I want to manage departments, so that I can organize my team.

#### Acceptance Criteria

1. THE System SHALL verify department list filtered by current organization
2. THE System SHALL check CRUD operations use correct API endpoints
3. THE System SHALL validate manager selection limited to org members
4. THE System SHALL add department hierarchy visualization if applicable
5. THE System SHALL implement drag-and-drop reordering
6. THE System SHALL add department member management
7. THE System SHALL validate empty state for new organizations
8. THE System SHALL add bulk operations (import/export)

### Requirement 47: Users Page

**User Story:** As an administrator, I want to manage users, so that I can control access.

#### Acceptance Criteria

1. THE System SHALL verify user list scoped to organization
2. THE System SHALL check role assignment UI matches authorization matrix
3. THE System SHALL validate user invitation workflow
4. THE System SHALL implement user invitation via email
5. THE System SHALL add user deactivation vs deletion UI
6. THE System SHALL validate role change confirmation dialogs
7. THE System SHALL add user filtering by role, department, status
8. THE System SHALL implement user profile editing
9. THE System SHALL add password reset functionality
10. THE System SHALL validate user avatar upload with Cloudinary

### Requirement 48: Tasks Page

**User Story:** As a user, I want to manage tasks, so that I can track my work.

#### Acceptance Criteria

1. THE System SHALL verify task list filtered by organization
2. THE System SHALL check task type-specific forms (project, routine, assigned)
3. THE System SHALL validate task assignment UI shows only org members
4. THE System SHALL confirm task status workflow in UI
5. THE System SHALL implement Kanban board view with drag-and-drop
6. THE System SHALL add task filtering (status, priority, assignee, department, dates)
7. THE System SHALL validate task creation wizard for different types
8. THE System SHALL implement task comments with real-time updates
9. THE System SHALL add task activity timeline
10. THE System SHALL validate file attachment upload/preview
11. THE System SHALL implement subtask management
12. THE System SHALL add task dependencies visualization
13. THE System SHALL validate recurrence UI for routine tasks
14. THE System SHALL add milestone tracking for project tasks
15. THE System SHALL implement bulk task operations (assign, update status)
16. THE System SHALL add task export functionality

### Requirement 49: Materials Page

**User Story:** As an inventory manager, I want to manage materials, so that I can track inventory.

#### Acceptance Criteria

1. THE System SHALL verify material list scoped to organization
2. THE System SHALL check vendor selection limited to org vendors
3. THE System SHALL validate inventory tracking display
4. THE System SHALL add material search and filtering
5. THE System SHALL implement quantity adjustment workflow
6. THE System SHALL validate material categorization
7. THE System SHALL add low stock alerts
8. THE System SHALL implement material attachments (images, specs)
9. THE System SHALL add bulk import/export

### Requirement 50: Vendors Page

**User Story:** As a procurement manager, I want to manage vendors, so that I can track suppliers.

#### Acceptance Criteria

1. THE System SHALL verify vendor list scoped to organization
2. THE System SHALL check vendor contact validation (email, phone)
3. THE System SHALL validate vendor-material relationship display
4. THE System SHALL add vendor search and filtering
5. THE System SHALL implement vendor rating system UI
6. THE System SHALL validate vendor contact management
7. THE System SHALL add vendor performance metrics
8. THE System SHALL implement vendor document attachments

### Requirement 51: Home Page

**User Story:** As a visitor, I want an informative home page, so that I can learn about the application.

#### Acceptance Criteria

1. THE System SHALL verify landing page for unauthenticated users
2. THE System SHALL check login/signup navigation
3. THE System SHALL add compelling landing page copy
4. THE System SHALL implement feature showcase
5. THE System SHALL add pricing/plans display if applicable
6. THE System SHALL validate responsive mobile design

### Requirement 52: Not Found Page

**User Story:** As a user, I want a helpful 404 page, so that I can navigate when lost.

#### Acceptance Criteria

1. THE System SHALL verify 404 page displays correctly
2. THE System SHALL check navigation back to app
3. THE System SHALL add helpful navigation links
4. THE System SHALL implement search suggestion for mistyped routes
5. THE System SHALL add back to dashboard button

### Requirement 53: Forgot Password Page

**User Story:** As a user, I want to reset my password, so that I can regain access.

#### Acceptance Criteria

1. THE System SHALL verify email submission workflow
2. THE System SHALL check success message display
3. THE System SHALL validate error handling
4. THE System SHALL add email format validation
5. THE System SHALL implement rate limiting UI feedback
6. THE System SHALL validate redirect after password reset
7. THE System SHALL add resend link functionality

### Requirement 54: Common Components

**User Story:** As a developer, I want reusable components, so that UI is consistent.

#### Acceptance Criteria

1. THE System SHALL validate prop types for all common components
2. THE System SHALL ensure accessibility for all common components
3. THE System SHALL implement error boundaries for all common components
4. THE System SHALL add loading states for all common components
5. THE System SHALL ensure theme integration for all common components
6. THE System SHALL add PropTypes or TypeScript interfaces for all components
7. THE System SHALL implement comprehensive error handling for all components
8. THE System SHALL add loading/skeleton states for all components
9. THE System SHALL validate accessibility (ARIA labels, keyboard navigation) for all components
10. THE System SHALL ensure responsive design for all components
11. THE System SHALL add unit tests for reusable components

### Requirement 55: Form Components

**User Story:** As a user, I want forms to work correctly, so that I can input data.

#### Acceptance Criteria

1. THE System SHALL validate form validation using react-hook-form for all forms
2. THE System SHALL implement error display for all forms
3. THE System SHALL add submission handling for all forms
4. THE System SHALL implement field dependencies for all forms
5. THE System SHALL add reset behavior for all forms
6. THE System SHALL implement proper form validation rules matching backend validators
7. THE System SHALL add client-side validation for UX (before API call)
8. THE System SHALL validate form submission error handling (network errors, 400/422 responses)
9. THE System SHALL add form field dependencies (conditional fields)
10. THE System SHALL implement form auto-save for drafts
11. THE System SHALL add form reset after successful submission
12. THE System SHALL validate file upload forms integrate with Cloudinary
13. THE System SHALL add form progress indicators for multi-step forms

### Requirement 56: Card Components

**User Story:** As a user, I want card components to display data correctly, so that I can view information.

#### Acceptance Criteria

1. THE System SHALL validate data display for all card components
2. THE System SHALL implement actions (edit, delete, view) for all card components
3. THE System SHALL ensure responsive layout for all card components
4. THE System SHALL add empty states for all card components
5. THE System SHALL add skeleton loading states for all card components
6. THE System SHALL implement card actions with permission checks
7. THE System SHALL validate responsive grid layout for all card components
8. THE System SHALL add card hover effects (theme-based)
9. THE System SHALL implement card selection for bulk operations

### Requirement 57: Column Definitions

**User Story:** As a developer, I want DataGrid columns properly configured, so that tables display correctly.

#### Acceptance Criteria

1. THE System SHALL validate MUI DataGrid column configs for all column definitions
2. THE System SHALL implement custom renderers for all column definitions
3. THE System SHALL add sorting for all column definitions
4. THE System SHALL implement filtering for all column definitions
5. THE System SHALL add action columns for all column definitions
6. THE System SHALL add custom cell renderers for complex data (status chips, avatars)
7. THE System SHALL implement action columns with permission-based visibility
8. THE System SHALL validate sortable/filterable columns
9. THE System SHALL add column resize/reorder functionality
10. THE System SHALL implement column visibility toggles

### Requirement 58: Filter Components

**User Story:** As a user, I want filters to work correctly, so that I can find data.

#### Acceptance Criteria

1. THE System SHALL verify filters update URL query params
2. THE System SHALL check filter state persists on navigation
3. THE System SHALL validate filter reset functionality
4. THE System SHALL implement advanced filter builder
5. THE System SHALL add filter presets (saved filters)
6. THE System SHALL validate filter debouncing for performance
7. THE System SHALL add filter count badges

### Requirement 59: List Components

**User Story:** As a user, I want lists to display correctly, so that I can view collections.

#### Acceptance Criteria

1. THE System SHALL verify list rendering performance (virtualization if needed)
2. THE System SHALL check empty state display
3. THE System SHALL validate infinite scroll or pagination
4. THE System SHALL add skeleton loading for lists
5. THE System SHALL implement pull-to-refresh for mobile
6. THE System SHALL validate list item actions

### Requirement 60: Redux Store

**User Story:** As a developer, I want Redux properly configured, so that state management works correctly.

#### Acceptance Criteria

1. THE System SHALL verify Redux persist configuration
2. THE System SHALL check middleware setup
3. THE System SHALL validate reducer combination
4. THE System SHALL add Redux DevTools extension for development
5. THE System SHALL implement state migration for persist upgrades
6. THE System SHALL validate state shape consistency
7. THE System SHALL add performance monitoring middleware

### Requirement 61: Redux Feature Slices

**User Story:** As a developer, I want feature slices properly implemented, so that state is managed correctly.

#### Acceptance Criteria

1. THE System SHALL verify async thunks use correct API endpoints for all feature slices
2. THE System SHALL check loading/error state handling for all feature slices
3. THE System SHALL validate optimistic updates for better UX for all feature slices
4. THE System SHALL confirm state normalization for relational data for all feature slices
5. THE System SHALL validate selector memoization for all feature slices
6. THE System SHALL implement proper error serialization for all feature slices
7. THE System SHALL add retry logic for failed API calls for all feature slices
8. THE System SHALL validate state cleanup on logout for all feature slices
9. THE System SHALL add cache invalidation logic for all feature slices
10. THE System SHALL implement optimistic updates with rollback on error for all feature slices
11. THE System SHALL validate organization-scoped state isolation for all feature slices
12. THE System SHALL add real-time state updates via Socket.IO integration for all feature slices
13. THE System SHALL implement pagination state management for all feature slices
14. THE System SHALL add filter/search state persistence for all feature slices

### Requirement 62: Socket.IO Service

**User Story:** As a developer, I want Socket.IO service properly implemented, so that real-time features work.

#### Acceptance Criteria

1. THE System SHALL verify Socket.IO connection uses JWT authentication
2. THE System SHALL check organization room joining
3. THE System SHALL validate event handlers update Redux state
4. THE System SHALL confirm reconnection logic
5. THE System SHALL add connection error handling
6. THE System SHALL implement exponential backoff for reconnections
7. THE System SHALL validate event payload structure
8. THE System SHALL add socket connection status indicator in UI
9. THE System SHALL implement heartbeat/ping-pong
10. THE System SHALL validate event unsubscription on component unmount

### Requirement 63: Cloudinary Service

**User Story:** As a user, I want file uploads to work correctly, so that I can attach files.

#### Acceptance Criteria

1. THE System SHALL verify upload uses correct Cloudinary preset
2. THE System SHALL check file size/type validation
3. THE System SHALL validate progress tracking
4. THE System SHALL confirm upload error handling
5. THE System SHALL add image transformation (resize, crop) before upload
6. THE System SHALL implement upload cancellation
7. THE System SHALL validate upload retry logic
8. THE System SHALL add preview generation
9. THE System SHALL implement secure upload signatures if needed

### Requirement 64: Frontend Utils

**User Story:** As a developer, I want utility functions properly implemented, so that common operations work.

#### Acceptance Criteria

1. THE System SHALL verify all utility functions are pure and testable
2. THE System SHALL check date formatting uses dayjs consistently
3. THE System SHALL validate API client (axios) configuration
4. THE System SHALL add axios interceptors for auth tokens
5. THE System SHALL implement global error handling for API calls
6. THE System SHALL validate request/response transformations
7. THE System SHALL add request retry logic
8. THE System SHALL implement request deduplication
9. THE System SHALL add API client logging for debugging

### Requirement 65: Global Frontend Requirements - Error Handling

**User Story:** As a user, I want errors handled gracefully, so that I can continue using the application.

#### Acceptance Criteria

1. THE System SHALL implement global error boundary
2. THE System SHALL add toast notifications for API errors (react-toastify)
3. THE System SHALL validate user-friendly error messages
4. THE System SHALL add error logging/reporting service integration
5. THE System SHALL implement offline detection and UI

### Requirement 66: Global Frontend Requirements - Loading States

**User Story:** As a user, I want loading states displayed, so that I know when data is loading.

#### Acceptance Criteria

1. THE System SHALL add skeleton loaders for all data-dependent components
2. THE System SHALL implement global loading indicator
3. THE System SHALL validate suspense boundaries for lazy-loaded routes
4. THE System SHALL add progressive loading for large lists

### Requirement 67: Global Frontend Requirements - Responsive Design

**User Story:** As a user, I want the application to work on all devices, so that I can use it anywhere.

#### Acceptance Criteria

1. THE System SHALL validate mobile-first approach
2. THE System SHALL check tablet layout (768px-1024px)
3. THE System SHALL validate desktop optimization (>1024px)
4. THE System SHALL add touch-friendly UI elements
5. THE System SHALL implement mobile navigation (hamburger menu)

### Requirement 68: Global Frontend Requirements - Accessibility

**User Story:** As a user with disabilities, I want the application to be accessible, so that I can use it.

#### Acceptance Criteria

1. THE System SHALL validate WCAG 2.1 AA compliance
2. THE System SHALL add proper ARIA labels and roles
3. THE System SHALL implement keyboard navigation
4. THE System SHALL validate color contrast ratios
5. THE System SHALL add screen reader support
6. THE System SHALL implement focus management

### Requirement 69: Global Frontend Requirements - Performance

**User Story:** As a user, I want the application to be fast, so that I can work efficiently.

#### Acceptance Criteria

1. THE System SHALL add code splitting for routes
2. THE System SHALL implement lazy loading for heavy components
3. THE System SHALL validate bundle size (<500KB initial)
4. THE System SHALL add image optimization (WebP, lazy loading)
5. THE System SHALL implement virtual scrolling for long lists
6. THE System SHALL add performance monitoring (Web Vitals)

### Requirement 70: Global Frontend Requirements - Security

**User Story:** As a security engineer, I want frontend security measures, so that the application is protected.

#### Acceptance Criteria

1. THE System SHALL validate XSS prevention (sanitize user-generated content)
2. THE System SHALL implement CSP compliance
3. THE System SHALL validate secure token storage
4. THE System SHALL add HTTPS enforcement
5. THE System SHALL implement rate limiting feedback in UI
6. THE System SHALL validate input sanitization before API calls

### Requirement 71: Global Frontend Requirements - Real-time Features

**User Story:** As a user, I want real-time updates, so that I see changes immediately.

#### Acceptance Criteria

1. THE System SHALL implement notification bell with real-time updates
2. THE System SHALL add online user indicator
3. THE System SHALL validate task updates broadcast to relevant users
4. THE System SHALL implement collaborative editing indicators
5. THE System SHALL add typing indicators for comments

### Requirement 72: Global Frontend Requirements - State Management

**User Story:** As a developer, I want proper state management, so that data flows correctly.

#### Acceptance Criteria

1. THE System SHALL validate no prop drilling (use Redux for shared state)
2. THE System SHALL implement local state for UI-only concerns
3. THE System SHALL validate state persistence (Redux persist)
4. THE System SHALL add state reset on logout
5. THE System SHALL implement undo/redo for critical operations

### Requirement 73: Frontend Testing

**User Story:** As a QA engineer, I want frontend tests, so that code quality is ensured.

#### Acceptance Criteria

1. THE System SHALL add unit tests for utility functions
2. THE System SHALL implement component tests with React Testing Library
3. THE System SHALL add integration tests for critical flows
4. THE System SHALL validate E2E tests with Playwright or Cypress

### Requirement 74: Critical Execution Rules

**User Story:** As a project manager, I want critical rules enforced, so that quality is maintained.

#### Acceptance Criteria

1. WHEN any change/update is made THEN the System SHALL question WHAT, WHY AND HOW, identify what exists in codebase and respect the codebase. To install any new packages that doesn't exist in backend/package.json and client/package.json, ask the user as yes or no. If the user provide yes, install the package and proceed accordingly and if the user provide no, then proceed to validate and correct without using a package.
2. THE System SHALL NOT create organization route (doesn't exist)
3. THE System SHALL scope everything to organization and department (req.user.organization.\_id and req.user.department.\_id) except read operation for different resource
4. THE System SHALL determine who can do what operation completely by Authorization matrix dynamically
5. THE System SHALL return 403 for unauthorized errors and 401 for unauthenticated errors
6. WHEN frontend receives 401 errors THEN the System SHALL automatically logout the user
7. WHEN frontend receives 403 errors THEN the System SHALL NOT logout the user
8. THE System SHALL utilize installed packages in client/packages.json effectively
9. THE System SHALL do comprehensive tests for routes -> validators -> controllers for each resource
10. THE System SHALL always think of production readiness and best practices
11. THE System SHALL always act as senior software engineer, team lead, architect and validator
12. THE System SHALL always search existing codebase for issues before correcting
13. THE System SHALL always search available docs, utils, middlewares, constants, models, controllers, routes, services
