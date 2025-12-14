# COMPREHENSIVE VALIDATION, CORRECTION, UPDATE, ENHANCEMENT & COMPLETION INSTRUCTION

## YOUR ROLE

You are a **Senior MERN Full Stack Developer**, **Multi-Tenant SaaS System Architect**, **Code Auditor**, and **Quality Assurance Specialist** with deep expertise in validating, correcting, updating, enhancing, and completing complex multi-tenant SaaS applications.

## YOUR OBJECTIVE

Perform a **comprehensive, line-by-line validation** of the entire Multi-Tenant SaaS Task Manager codebase (`backend/*` and `client/*`) against the specifications in `docs/validate-correct-update-enhance-complete.md`, `docs/phase5-controllers-detailed.md`, `docs/build-prompt.md` and `docs/dev-phase-tracker.md`. You must:

1. **VALIDATE** every single file, function, logic, pattern, and implementation
2. **CORRECT** any mismatches, errors, bugs, or deviations from specifications
3. **UPDATE** outdated patterns, deprecated syntax, or non-optimal implementations
4. **ENHANCE** performance, security, maintainability, and user experience
5. **COMPLETE** any missing implementations, incomplete features, or TODO items

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

## VALIDATION METHODOLOGY

For each file, you must:

1. **SEARCH**: Use `grepSearch` or `readFile` to locate and read the file
2. **ANALYZE**: Extract all logic, patterns, dependencies, and flows
3. **COMPARE**: Match against `docs/build-prompt.md`, `docs/validate-correct-update-enhance-complete.md`, `docs/phase5-controllers-detailed.md`, `docs/dev-phase-tracker.md` specifications
4. **IDENTIFY**: List all issues (logical, business logic, mismatch, incomplete)
5. **CATEGORIZE**: Group issues by severity (Critical, High, Medium, Low)
6. **DOCUMENT**: Provide WHAT (issue), WHY (impact), HOW (solution)
7. **IMPLEMENT**: Apply corrections with complete, working code
8. **TEST**: Validate fixes with appropriate tests
9. **VERIFY**: Ensure 100% pass rate and 80%+ coverage

## PHASE-BY-PHASE VALIDATION WORKFLOW

### Phase 1: Backend Core Infrastructure Validation

**Branch**: `validate/phase-1-backend-core`

#### Critical Implementation Workflow

1. **Branch Creation**

   ```bash
   git checkout -b validate/phase-1-backend-core
   ```

2. **Search & Read Files**

   - Use `grepSearch` to locate all core infrastructure files
   - Use `readFile` to read each file completely
   - Files to validate:
     - `backend/config/allowedOrigins.js`
     - `backend/config/authorizationMatrix.json`
     - `backend/config/corsOptions.js`
     - `backend/config/db.js`
     - `backend/errorHandler/CustomError.js`
     - `backend/errorHandler/ErrorController.js`
     - `backend/utils/constants.js`
     - `backend/utils/logger.js`
     - `backend/utils/helpers.js`
     - `backend/utils/generateTokens.js`
     - `backend/utils/authorizationMatrix.js`
     - `backend/utils/validateEnv.js`
     - `backend/app.js`
     - `backend/server.js`

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

7. **Merge: Complete Phase 1**

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

8. **Update Phase Tracker**
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

---

### Phase 2: Backend Models Validation

**Branch**: `validate/phase-2-backend-models`

#### Critical Implementation Workflow

1. **Branch Creation**

   ```bash
   git checkout -b validate/phase-2-backend-models
   ```

2. **Search & Read Files**
   Files to validate:

   - `backend/models/plugins/softDelete.js`
   - `backend/models/Organization.js`
   - `backend/models/Department.js`
   - `backend/models/User.js`
   - `backend/models/BaseTask.js`
   - `backend/models/ProjectTask.js`
   - `backend/models/RoutineTask.js`
   - `backend/models/AssignedTask.js`
   - `backend/models/TaskActivity.js`
   - `backend/models/TaskComment.js`
   - `backend/models/Material.js`
   - `backend/models/Vendor.js`
   - `backend/models/Attachment.js`
   - `backend/models/Notification.js`
   - `backend/models/index.js`

3. **Analysis for Each Model**

   **For `backend/models/plugins/softDelete.js`:**

   - **Logic to Extract**:
     - Soft delete plugin for Mongoose
     - Fields: isDeleted, deletedAt, deletedBy, restoredAt, restoredBy
     - Query helpers: withDeleted(), onlyDeleted()
     - Instance methods: softDelete(), restore()
     - Static methods: softDeleteById(), restoreById(), etc.
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

   - Document all issues found in each model
   - Implement corrections with complete code
   - Add/update model tests
   - Verify cascade operations work correctly
   - Ensure soft delete plugin applied to all models
   - Validate TTL indexes created

5. **Test: Run All Tests**

   ```bash
   cd backend
   npm test -- --runInBand backend/tests/unit/models/
   ```

6. **Validate: Final Checks**

   - All models use ES modules
   - All models apply softDelete plugin
   - All models have correct TTL
   - All cascade operations work
   - All unique indexes are partial
   - All validations match specifications

7. **Merge: Complete Phase 2**

   ```bash
   git add .
   git commit -m "Phase 2: Validate and correct backend models

   - Validated all 14 models against specifications
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

8. **Update Phase Tracker**

   ```markdown
   ## Phase 2: Backend Models ✅

   - [x] Soft delete plugin validated and corrected
   - [x] All 13 models validated and corrected
   - [x] Model index file validated
   - [x] Cascade operations validated
   - [x] Tests added and passing (100%)
   - [x] Coverage achieved (80%+)
   ```

---

### Phase 3: Backend Middleware & Validators Validation

**Branch**: `validate/phase-3-backend-middleware`

#### Critical Implementation Workflow

1. **Branch Creation**

   ```bash
   git checkout -b validate/phase-3-backend-middleware
   ```

2. **Search & Read Files**
   Files to validate:

   - `backend/middlewares/authMiddleware.js`
   - `backend/middlewares/authorization.js`
   - `backend/middlewares/rateLimiter.js`
   - `backend/middlewares/validators/validation.js`
   - `backend/middlewares/validators/authValidators.js`
   - `backend/middlewares/validators/userValidators.js`
   - `backend/middlewares/validators/organizationValidators.js`
   - `backend/middlewares/validators/departmentValidators.js`
   - `backend/middlewares/validators/taskValidators.js`
   - `backend/middlewares/validators/materialValidators.js`
   - `backend/middlewares/validators/vendorValidators.js`
   - `backend/middlewares/validators/attachmentValidators.js`
   - `backend/middlewares/validators/notificationValidators.js`

3. **Analysis for Each Middleware**

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
     - ✅ Fetches user from database
     - ✅ Attaches user to req.user
     - ✅ Returns 401 if token invalid/expired
     - ✅ verifyRefreshToken reads refresh_token from cookies
     - ✅ Verifies token with JWT_REFRESH_SECRET
     - ✅ Returns 401 if token invalid/expired
     - ✅ Uses CustomError.authentication() for errors
   - **Common Issues**:
     - ❌ Reading token from Authorization header instead of cookie
     - ❌ Not fetching user from database
     - ❌ Not handling token expiration
     - ❌ Using wrong secret for verification
   - **Tests Required**:
     - Unit test: Valid token passes
     - Unit test: Invalid token returns 401
     - Unit test: Expired token returns 401
     - Unit test: Missing token returns 401
     - Unit test: User attached to req.user
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
     - ❌ Platform SuperAdmin has crossOrg for all resources
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
     - ✅ Returns rate limit headers
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

   **For ALL Validator Files:**

   - **Logic to Extract**:
     - Validation rules using express-validator
     - Field-level validations
     - Custom validators
     - Sanitization
     - Error messages
   - **Validation Checks**:
     - ✅ All fields from specifications validated
     - ✅ Correct validation rules (required, min, max, enum, etc.)
     - ✅ Custom validators for complex rules
     - ✅ Sanitization (trim, toLowerCase, normalizeEmail, etc.)
     - ✅ Clear error messages
     - ✅ Imports constants from utils/constants.js
     - ✅ No hardcoded values
     - ✅ Validation middleware exported as array
   - **Common Issues**:
     - ❌ Missing field validations
     - ❌ Incorrect validation rules
     - ❌ Hardcoded values instead of constants
     - ❌ Missing sanitization
     - ❌ Unclear error messages
   - **Tests Required**:
     - Unit test: Each field validation
     - Unit test: Custom validators
     - Unit test: Sanitization works
     - Integration test: Full validation flow

4. **Action: Validate, Correct, Update, Enhance, Complete**

   - Document all issues in middleware and validators
   - Implement corrections
   - Add/update middleware tests
   - Verify authorization matrix works correctly
   - Ensure validators are source of truth for field names

5. **Test: Run All Tests**

   ```bash
   cd backend
   npm test -- --runInBand backend/tests/unit/middlewares/
   ```

6. **Validate: Final Checks**

   - All middleware use ES modules
   - Authorization checks all scopes correctly
   - Rate limiting only in production
   - All validators import constants
   - No hardcoded values in validators

7. **Merge: Complete Phase 3**

8. **Update Phase Tracker**

---

### Phase 4: Backend Services & Utils Validation

**Branch**: `validate/phase-4-backend-services`

#### Files to Validate:

- `backend/services/emailService.js`
- `backend/services/notificationService.js`
- `backend/utils/socket.js`
- `backend/utils/socketEmitter.js`
- `backend/utils/socketInstance.js`
- `backend/utils/userStatus.js`
- `backend/utils/responseTransform.js`
- `backend/utils/materialTransform.js`

#### Key Validation Points:

- Email service uses Nodemailer with Gmail SMTP
- Queue-based email sending
- Notification service creates notifications correctly
- Socket.IO singleton pattern
- Socket rooms: user, department, organization
- Event emitters for all resource changes
- User status tracking (Online, Offline, Away)
- Response transformation consistent

---

### Phase 5: Backend Controllers Validation

**Branch**: `validate/phase-5-backend-controllers`
**Include the phase5-controllers-detailed from `docs/phase5-controllers-detailed.md`**

#### Critical Implementation Workflow

1. **Branch Creation**

   ```bash
   git checkout -b validate/phase-5-backend-controllers
   ```

2. **Search & Read Files**

   - `backend/controllers/authControllers.js` (6 functions)
   - `backend/controllers/userControllers.js` (8 functions)
   - `backend/controllers/organizationControllers.js` (5 functions)
   - `backend/controllers/departmentControllers.js` (5 functions)
   - `backend/controllers/taskControllers.js` (17 functions)
   - `backend/controllers/materialControllers.js` (5 functions)
   - `backend/controllers/vendorControllers.js` (5 functions)
   - `backend/controllers/attachmentControllers.js` (5 functions)
   - `backend/controllers/notificationControllers.js` (3 functions)

3. **UNIVERSAL CONTROLLER PATTERNS (Apply to ALL controllers)**

   **A. Function Signature**

   - ✅ Wrapped: `asyncHandler(async (req, res, next) => {})`
   - ✅ Parameters: req, res, next
   - ✅ Async function with await
   - ✅ No try/catch at function level

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

   **D. Session for Write Operations**

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

   **F. Soft Delete Plugin**

   - ✅ Default excludes deleted
   - ✅ Include: `Model.withDeleted().find()`
   - ✅ Only deleted: `Model.onlyDeleted().find()`
   - ✅ Soft delete: `await doc.softDelete(session, deletedBy)`
   - ✅ Restore: `await doc.restore(session, restoredBy)`

   **G. Cascade Delete**

   - ✅ Use transactions
   - ✅ Soft delete parent first
   - ✅ Cascade to all children
   - ✅ Update references
   - ✅ Emit socket events
   - ✅ Create notifications

   **H. Cascade Restore**

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

   **M. Socket.IO Events**

   - ✅ Import: `emitToUser`, `emitToDepartment`, `emitToOrganization`, `emitToRecipients`
   - ✅ Emit after commit
   - ✅ Event naming: `resource:action`
   - ✅ Include resource ID in payload

   **N. Notifications**

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

4. **Controller-Specific Validation**

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

   **departmentControllers.js (5 functions):**

   - createDepartment: Transaction, checks name uniqueness in org, creates dept, notifies HODs, emits, returns 201
   - getAllDepartments: Filters by org, pagination, search, deleted param, returns 200
   - getDepartment: Validates org match, populates users/tasks, returns 200
   - updateDepartment: Transaction, checks name uniqueness, updates, notifies, emits, returns 200
   - deleteDepartment: Transaction, checks not last dept, cascades to users/tasks/materials, notifies, emits, returns 200
   - restoreDepartment: Transaction, validates org exists, restores, notifies, emits, returns 200

   **taskControllers.js (17 functions):**

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

   **materialControllers.js (5 functions):**

   - createMaterial: Transaction, creates material, notifies HODs, emits, returns 201
   - getAllMaterials: Filters by org/dept, category, pagination, search, deleted param, returns 200
   - getMaterial: Validates org match, includes usage stats, returns 200
   - updateMaterial: Transaction, updates, notifies, emits, returns 200
   - deleteMaterial: Transaction, checks for linked tasks/activities, requires unlinking, soft deletes, notifies, emits, returns 200
   - restoreMaterial: Transaction, restores, notifies, emits, returns 200

   **vendorControllers.js (5 functions):**

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

5. **Action: Validate, Correct, Update, Enhance, Complete**

   For EACH controller function:

   - Document all issues with WHAT, WHY, HOW
   - Implement corrections with complete code
   - Add/update controller tests
   - Verify all patterns followed
   - Ensure transactions used correctly
   - Validate socket events emitted
   - Confirm notifications created

6. **Test: Run All Tests**

   ```bash
   cd backend
   npm test -- --runInBand backend/tests/unit/controllers/
   npm test -- --runInBand backend/tests/integration/controllers/
   ```

7. **Validate: Final Checks**

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

9. **Update Phase Tracker**

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

---

### Phase 6: Backend Routes & Integration Validation

**Branch**: `validate/phase-6-backend-routes`

#### Files to Validate:

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

#### Key Validation Points:

- Correct middleware chain: validators → auth → authorization → controller
- Public routes: register, login, forgot-password, reset-password
- Protected routes: all others
- Rate limiting on auth routes
- Route aggregation in index.js
- All routes mounted at /api

---

### Phase 7: Frontend Core Infrastructure Validation

**Branch**: `validate/phase-7-frontend-core`

#### Files to Validate:

- `client/src/redux/app/store.js`
- `client/src/redux/features/api.js`
- `client/src/redux/features/auth/authSlice.js`
- `client/src/redux/features/auth/authApi.js`
- `client/src/services/socketService.js`
- `client/src/services/socketEvents.js`
- `client/src/hooks/useAuth.js`
- `client/src/hooks/useSocket.js`
- `client/src/utils/constants.js`
- `client/src/utils/errorHandler.js`
- `client/src/utils/dateUtils.js`
- `client/src/utils/authorizationHelper.js`
- `client/src/theme/AppTheme.jsx`
- `client/src/theme/themePrimitives.js`
- `client/src/theme/customizations/index.js`

#### Key Validation Points:

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
- MUI v7 customizations

---

### Phase 8: Frontend Features Validation

**Branch**: `validate/phase-8-frontend-features`

#### Files to Validate (9 feature slices):

- `client/src/redux/features/user/userApi.js`
- `client/src/redux/features/user/userSlice.js`
- `client/src/redux/features/organization/organizationApi.js`
- `client/src/redux/features/organization/organizationSlice.js`
- `client/src/redux/features/department/departmentApi.js`
- `client/src/redux/features/department/departmentSlice.js`
- `client/src/redux/features/task/taskApi.js`
- `client/src/redux/features/task/taskSlice.js`
- `client/src/redux/features/material/materialApi.js`
- `client/src/redux/features/material/materialSlice.js`
- `client/src/redux/features/vendor/vendorApi.js`
- `client/src/redux/features/vendor/vendorSlice.js`
- `client/src/redux/features/attachment/attachmentApi.js`
- `client/src/redux/features/notification/notificationApi.js`
- `client/src/redux/features/notification/notificationSlice.js`

#### Key Validation Points:

- All APIs use RTK Query injectEndpoints
- Pagination conversion: frontend 0-based → backend 1-based
- Proper tags for cache invalidation
- Optimistic updates where appropriate
- Error handling with toast notifications
- Credentials included in all requests
- Query parameters match backend expectations
- Response transformation if needed

---

### Phase 9: Frontend Components Validation

**Branch**: `validate/phase-9-frontend-components`

#### Files to Validate:

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
- `client/src/components/common/RTKQueryErrorBoundary.jsx`
- `client/src/components/common/RouteError.jsx`
- `client/src/components/common/TaskActivityList.jsx`
- `client/src/components/common/TaskCommentList.jsx`
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
- `client/src/components/forms/tasks/CreateUpdateTask.jsx`
- `client/src/components/forms/tasks/CreateUpdateTaskActivity.jsx`
- `client/src/components/forms/tasks/CreateUpdateTaskComment.jsx`
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

#### Key Validation Points:

**MuiDataGrid:**

- ✅ Server-side pagination (paginationMode: "server")
- ✅ Auto-converts pagination: 0-based MUI ↔ 1-based backend
- ✅ Loading state: loading={isLoading || isFetching}
- ✅ Empty message displayed
- ✅ Row count from backend pagination
- ✅ Pagination model controlled

**MuiActionColumn:**

- ✅ Auto-detects soft delete (isDeleted field)
- ✅ Shows View, Edit, Delete buttons
- ✅ Shows Restore button if soft-deleted
- ✅ Confirmation dialog for delete
- ✅ Handles all actions via callbacks

**MuiDialog:**

- ✅ disableEnforceFocus prop
- ✅ disableRestoreFocus prop
- ✅ ARIA attributes (aria-labelledby, aria-describedby)
- ✅ Proper close handling

**Form Components:**

- ✅ Use react-hook-form with Controller
- ✅ NEVER use watch() method
- ✅ Controlled components only
- ✅ Validation rules match backend validators
- ✅ Error messages displayed
- ✅ Loading states during submission

**Card Components:**

- ✅ Wrapped with React.memo
- ✅ displayName set for debugging
- ✅ useCallback for event handlers
- ✅ useMemo for computed values
- ✅ Proper prop types

**Column Definitions:**

- ✅ Action column: sortable: false, filterable: false, disableColumnMenu: true
- ✅ Proper field names matching backend
- ✅ Value formatters for dates, numbers, etc.
- ✅ Render cells for complex data

**MUI v7 Grid:**

- ✅ Use size prop (NOT item prop)
- ✅ Responsive sizes: { xs: 12, sm: 6, md: 4 }
- ✅ Proper spacing

---

### Phase 10: Frontend Pages & Routing Validation

**Branch**: `validate/phase-10-frontend-pages`

#### Files to Validate:

**Pages (12 files):**

- `client/src/pages/Home.jsx`
- `client/src/pages/Dashboard.jsx`
- `client/src/pages/Users.jsx`
- `client/src/pages/Organizations.jsx`
- `client/src/pages/Organization.jsx`
- `client/src/pages/Departments.jsx`
- `client/src/pages/Tasks.jsx`
- `client/src/pages/TaskDetails.jsx`
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

#### Key Validation Points:

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

---

### Phase 11: Testing & Quality Assurance Validation

**Branch**: `validate/phase-11-testing-qa`

#### Files to Validate:

**Backend Tests:**

- `backend/tests/globalSetup.js`
- `backend/tests/globalTeardown.js`
- `backend/tests/setup.js`
- `backend/jest.config.js`
- All unit tests in `backend/tests/unit/`
- All property tests in `backend/tests/property/`

**Test Categories:**

- Unit tests for all models
- Unit tests for all controllers
- Unit tests for all middleware
- Unit tests for all services
- Unit tests for all utils
- Property-based tests for authorization
- Property-based tests for soft delete
- Property-based tests for cascade operations
- Integration tests for API endpoints

#### Key Validation Points:

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

---

### Phase 12: Final Integration & Deployment Validation

**Branch**: `validate/phase-12-final-integration`

#### Files to Validate:

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

#### Key Validation Points:

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

---

## FINAL VALIDATION CHECKLIST

Before considering the validation complete, verify ALL of the following:

### Backend Validation ✅

- [ ] All 14 files in Phase 1 validated and corrected
- [ ] All 14 models in Phase 2 validated and corrected
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
      -oads work (Cloudinary)
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

## FINAL NOTES

This validation document provides a comprehensive, systematic approach to validating, correcting, updating, enhancing, and completing the entire Multi-Tenant SaaS Task Manager codebase.

**Remember:**

- NEVER skip a file
- NEVER skip a validation check
- NEVER accept "good enough"
- ALWAYS provide complete, working solutions
- ALWAYS test thoroughly
- ALWAYS document everything

The specifications in `docs/build-prompt.md` are the ONLY source of truth. When in doubt, refer to the specifications. For controllers validation, correction, update, enhancement utilize `docs/phase5-controllers-detailed.md` effectively.

Good luck with the validation! 🚀
