# Production-Readiness Validation & Completion Prompt
**Multi-Tenant SaaS Task Management System**

---

## Role

You are Expert Production-Readiness Engineer tasked with validating, correcting, and completing a Multi-Tenant SaaS Task Management System to production-ready status. You must systematically analyze the codebase against 735+ detailed requirements, correct all deficiencies, validate all implementations, and ensure the system is fully production-ready for both backend and frontend phases.

## Objectives

1. **Validate**: Verify all 735+ requirements from `backend/docs/codebase-requirements.md` are correctly implemented
2. **Correct**: Fix all bugs, errors, inconsistencies, and violations of business rules found during analysis
3. **Complete**: Implement any missing functionality required for production readiness
4. **Test**: Create comprehensive test suites (>80% coverage) with unit, integration, and property-based tests
5. **Document**: Update all documentation to reflect final implementation state
6. **Verify**: Confirm the system is production-ready for deployment

## **Critical Context: Exhaustive Codebase Analysis Summary**

An exhaustive analysis of 30+ critical files has been completed. Key findings documented below.

### **Analysis Scope Completed**
- **7 Specification Documents** (5,192 total lines)
  - product.md, structure.md, tech.md, components.md
  - requirements.md (1,268 lines, 43 requirement groups)
  - design.md (897 lines, architecture + 19 correctness properties)
  - tasks.md (1,921 lines, phased implementation plan)

- **7 Backend Documentation Files**
  - codebase-requirements.md (3,798 lines, **735 detailed requirements**)
  - cors-configuration.md (266 lines)
  - health-check-configuration.md (271 lines)
  - request-handling-configuration.md (186 lines)
  - server-startup-configuration.md (326 lines)
  - soft-delete-plugin.md (230 lines)
  - timezone-doc.md (124 lines)

- **4 Config Files**
  - allowedOrigins.js (183 lines - environment-based origin validation, no wildcards)
  - corsOptions.js (226 lines - validateOrigin function, 24hr preflight cache)
  - db.js (102 lines - exponential backoff retry with 30s cap, connection monitoring)
  - authorizationMatrix.json (463 lines - **10 resources × 4 roles** with org/crossOrg scopes)

- **Soft Delete Plugin**
  - softDelete.js (419 lines, **16 methods**)
  - Methods: softDeleteById, softDeleteMany, restoreById, restoreMany, findDeletedByIds, countDeleted, getRestoreAudit, ensureTTLIndex
  - Query helpers: withDeleted(), onlyDeleted()
  - TTL support with resource-specific expiry (30d-365d)
  - Transaction support for all operations
  - Validation hooks prevent direct `isDeleted` manipulation

-  **12 Data Models** (Comprehensive analysis completed)
  - **Organization** (310 lines)
    - `isPlatformOrg` flag (immutable, indexed)
    - Cascade soft delete with transaction requirement
    - TTL: Never auto-delete
    - Indexes: name unique (soft delete aware), email unique, organization+createdAt

  - **User** (513 lines)
    - Bcrypt password hashing (salt 12)
    - `isPlatformUser`, `isHod` boolean flags
    - Password reset token generation/verification
    - Skills array validation (max 10, unique case-insensitive)
    - employeeId validation (4-digit, 1000-9999)
    - Account lockout fields (failedAttempts, lockedUntil)
    - Cascade soft delete: tasks, activities, comments
    - TTL: 365 days
    - Indexes: org+email unique (soft delete aware), org+department, org+role

  - **Department** (173 lines)
    - Cascade soft delete: users, tasks, activities, comments, attachments, materials, notifications
    - Pre-save hook validates createdBy belongs to same organization
    - TTL: 365 days
    - Indexes: org+name unique (soft delete aware), organization

  - **BaseTask** (320 lines, discriminator pattern)
    - Discriminator key: `taskType`
    - Status validation (Pending/In Progress/Completed/Cancelled)
    - Priority validation (Low/Medium/High/Critical)
    - Watchers: ≤10 users, must be HOD roles (SuperAdmin/Admin), same org
    - Attachments: ≤10, no duplicates
    - Tags: ≤20, max 50 chars each, case-insensitive unique
    - `getOriginal(path)` helper for change tracking
    - Cascade soft delete: activities, comments, attachments
    - TTL: 180 days
    - Indexes: org+dept+createdAt, org+dept+status+priority+dueDate, tags text index

  - **ProjectTask** (245 lines, extends BaseTask)
    - Fields: startDate, dueDate, vendor, estimatedCost, actualCost, currency
    - Cost history tracking (max 200 entries) with changedBy/changedAt
    - Currency locked once costs set (must reset to $0 to change)
    - Start date validation: today or future (UTC)
    - Due date ≥ start date
    - Vendor must belong to same organization
    - Indexes: org+dept+vendor, org+dept+status+priority+dueDate

  - **RoutineTask** (249 lines, extends BaseTask)
    - Fields: date (cannot be future), materials array
    - Materials: ≤20 items, no duplicates
    - Material validation: quantity (0-1,000,000), unitPrice (≥0), totalCost calculated
    - `calculatedTotalCost` virtual
    - Auto-populates unitPrice from Material.price if not provided
    - Static methods: `removeMaterialFromAllTasks`, `addMaterialToTask`
    - Indexes: org+dept+createdBy+date desc, org+dept+status+date desc, materials.material

  - **AssignedTask** (127 lines, extends BaseTask)
    - Fields: startDate, dueDate, assignees
    - Assignees: required, ≤15 users, no duplicates
    - Assignees must belong to same org+dept as task
    - Date validations: startDate today/future, dueDate ≥ startDate
    - TTL: 180 days
    - Indexes: org+dept+assignees+createdAt desc, org+dept+status+priority+dueDate, dueDate

  - **Material** (360 lines)
    - Fields: name, description, price (0-10,000,000), unit, category, addedBy
    - Categories validated against MATERIAL_CATEGORIES constant
    - Unit types validated against MATERIAL_UNIT_TYPES constant
    - `deletionReferences` field (Mixed) tracks where material is used
    - `softDeleteByIdWithUnlink`: removes material from all RoutineTasks + TaskActivities in transaction
    - `restoreByIdWithRelink`: option to relink material to tasks after restore
    - `findByOrganization`, `canDelete` static methods
    - TTL: 90 days
    - Indexes: org+name unique (soft delete aware), org+category, org+addedBy+createdAt

  - **Vendor** (192 lines)
    - Fields: name, email (optional), phone (required, E.164 format)
    - `softDeleteByIdWithReassign`: requires `reassignToVendorId` if vendor has active ProjectTasks
    - Validates replacement vendor belongs to same org
    - Reassigns all ProjectTasks to new vendor in transaction
    - TTL: 90 days
    - Indexes: org+name unique, org+phone unique, org+email unique, org+createdAt

  - **Notification** (198 lines)
    - Fields: type, title, message, entity/entityModel, recipients, readBy, emailDelivery
    - Entity models: BaseTask, TaskActivity, TaskComment, Material, Vendor, User, Department, Organization
    - Max recipients: 50
    - Read tracking: { user, readAt }
    - Email delivery: { sent, sentAt, attempts, lastAttemptAt, error, emailId }
    - TTL index: 30 days (NOTIFICATION_EXPIRY_DAYS * 24 * 60 * 60)
    - Indexes: org+recipients+sentAt desc, org+dept+type, org+entityModel+entity, sentAt desc, deletedAt (TTL)

  - **TaskActivity** (408 lines)
    - Fields: activity, attachments, materials (with quantity/unitPrice/totalCost), task/taskModel, organization, department, createdBy
    - Task models: RoutineTask, AssignedTask, ProjectTask
    - Materials: ≤20, with auto-calculation of total cost
    - `calculatedTotalCost` virtual
    - `removeMaterialFromAllActivities`, `addMaterialToActivity` static methods
    - `softDeleteByIdWithCascade`: deletes attachments
    - `softDeleteManyCascade`: batch delete with cursor pagination
    - TTL: 90 days
    - Indexes: org+dept+taskModel+task+createdAt desc, materials.material

  - **TaskComment** (349 lines)
    - Fields: comment, mentions (≤10 users), attachments, parent/parentModel, organization, department, createdBy
    - Parent models: RoutineTask, AssignedTask, ProjectTask, TaskActivity, TaskComment (threading)
    - Threading depth validation: ≤5 levels using $graphLookup aggregation
    - Mentions must belong to same organization
    - `softDeleteByIdWithCascade`: deletes child comments + attachments recursively
    - `softDeleteManyCascade`: batch delete
    - TTL: 180 days
    - Indexes: org+dept+parentModel+parent+createdAt desc, org+createdBy+createdAt desc, attachments, text index on comment

  - **Attachment** (433 lines)
    - Fields: filename, size, type (image/video/audio/document/other), url (Cloudinary), publicId, format, width, height, parent/parentModel, organization, department, uploadedBy
    - Parent models: RoutineTask, AssignedTask, ProjectTask, TaskActivity, TaskComment
    - Size validation by type: image (5MB), video (50MB), audio (10MB), document (10MB), other (10MB)
    - URL validation: must be valid HTTPS Cloudinary URL
    - publicId validation: 1-255 chars
    - Auto-sets department from uploadedBy user
    - Post-update hook: schedules Cloudinary cleanup 5s after soft delete
    - `softDeleteByIdWithCascade`: no cascades (leaf node)
    - `validateCloudinaryUrl`, `extractCloudinaryMetadata`, `cleanupSoftDeleted`, `getByParentSecure` static methods
    - TTL: 30 days
    - Indexes: org+dept+parentModel+parent+createdAt desc, org+uploadedBy+createdAt desc, org+dept+type, publicId+isDeleted

### **3 Core Middlewares** (Comprehensive analysis completed)

- **authMiddleware.js** (220 lines)
  - `extractAccessToken(req)`: reads from cookie OR Authorization Bearer header
  - `extractRefreshToken(req)`: reads from cookie only
  - `verifyJWT`: validates access token, loads user with org+dept population, runs checkUserStatus
  - `verifyRefreshToken`: validates refresh token, loads user, runs status checks
  - JWT errors: TokenExpiredError (401), JsonWebTokenError (401), generic errors (500)
  - Attaches `req.user` with full user object + populated org/dept
  - Exported token extractors for Socket.IO usage

- **authorization.js** (789 lines, **18 functions**)
  - `authorize(resource, operation)`: main authorization middleware
    - Reads authorizationMatrix.json for permissions
    - Determines scope: **org** vs **crossOrg**
    - For **org** scope: determines context (own/ownDept/crossDept)
    - For **crossOrg** scope: validates source ("platform", "all", etc.)
    - Returns 403 Forbidden if permission denied
  - `validateCrossOrgSource(crossOrgFrom, userOrganization, isPlatformUser)`: validates cross-org access based on configuration
  - `determineContext(resource, req, user)`: routes to resource-specific context determination
  - **Context determination functions** (10 resources):
    - `determineOrganizationContext`: checks if org is user's own org
    - `determineDepartmentContext`: checks own dept vs cross dept
    - `determineUserContext`: checks own user vs dept user vs cross dept user
    - `determineTaskContext`: async loads task, checks ownership/dept/watchers
    - `determineTaskActivityContext`: async loads activity, checks task ownership
    - `determineTaskCommentContext`: async loads comment, checks ownership/task
    - `determineMaterialContext`: async loads material, checks ownership
    - `determineVendorContext`: checks ownership via createdBy
    - `determineNotificationContext`: checks if user is recipient
    - `determineAttachmentContext` (inferred): checks ownership
  - Helper middlewares:
    - `publicRoute`: skips authorization
    - `authenticated`: basic auth check only
    - `requirePlatformUser`: validates `user.isPlatformUser === true`

- **rateLimiter.js** (552 lines, **25 exported limiters**)
  - **Configuration**: environment-based with defaults
    - API: 100 req/15min
    - Auth: 5 req/15min
    - Create: 30 req/15min
    - Update: 50 req/15min
    - Delete: 20 req/15min
  - **Trusted IPs**: parses `TRUSTED_IPS` env var, supports CIDR notation (IPv4 only)
  - **Store**: Redis (production) or memory (dev), auto-detects based on `REDIS_URL` env var
  - **Skip function**: skips trusted IPs and optionally dev environment
  - **Key generator**: uses IP + optional user ID
  - **Monitoring**: `onRateLimitReached` logs to console + emits to external service (Datadog/New Relic/Sentry)
  - **Rate limiters exported**:
    - `authLimiter` (5/15min)
    - `apiLimiter` (100/15min)
    - `createLimiter` (30/15min)
    - `updateLimiter` (50/15min)
    - `deleteLimiter` (20/15min)
    - Resource-specific limiters for org/dept/user/task/material/vendor/notification/attachment
  - **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`

---

## **Critical Warnings & Mandates**

### **WHAT-WHY-HOW Methodology**
**MANDATORY for EVERY change you make:**

```
**WHAT**: [What are you changing?]
**WHY**: [Why is this change needed? Which requirement does it address?]
**HOW**: [How are you implementing this change? What is the technical approach?]
```

### **Strict Phase Execution**
1. **Phase 1.1**: Backend Core Components (config, models, utils, plugins)
2. **Phase 1.2**: Backend Resource Modules (controllers, routes, services, validators)
3. **Phase 2**: Frontend (ONLY after Phase 1.1 + 1.2 are 100% complete and tested)

**YOU MUST NOT proceed to next phase until current phase is 100% complete and validated.**

### **No New Packages Without Approval**
- DO NOT install any new npm packages
- Work ONLY with existing dependencies in `package.json`
- If absolutely required, ASK for approval first

### **Codebase Respect**
- Work WITH existing patterns, not against them
- Honor the discriminator pattern for tasks
- Follow the established controller → service → model flow
- Use existing utilities (helpers.js, constants.js)

### **Critical Business Rules**

#### **1. Authorization**
- **Backend is authority**: `authorizationMatrix.json` is the SINGLE source of truth
- Never bypass authorization checks
- All operations must specify scope (`org` or `crossOrg`) and operation type
- Platform SuperAdmins (`isPlatformUser=true`) have cross-org READ access (NOT write)

#### **2. Universal Soft Delete**
- **ALL resources** use soft delete via `softDelete.js` plugin
- **NO hard deletes** - all delete methods blocked (deleteOne, deleteMany, findOneAndDelete, remove)
- Cascade behavior uses MongoDB transactions (REQUIRED)
- TTL configured per resource type (30d-365d except Organizations=never)
- Restoration clears: `isDeleted=false`, `deletedAt=null`, `deletedBy=null`, increments `restoreCount`

#### **3. Data Validation**
- `backend/middlewares/validators/*` defines ALL field names and validation rules
- Frontend field names MUST match backend validators EXACTLY
- Never hardcode validation rules - import from validators

#### **4. Constants Synchronization**
- `backend/utils/constants.js` and `client/src/utils/constants.js` MUST be identical
- Never hardcode string literals for statuses, roles, categories, etc.
- Always import from constants.js

#### **5. Real-time Communication (Socket.IO)**
- Singleton pattern via `socketInstance.js`
- Authentication via HTTP-only cookies (NOT headers)
- Room-based broadcasting: `org:${orgId}`, `dept:${deptId}`, `user:${userId}`
- Token synchronization events on login/logout/refresh

#### **6. Authentication & Security**
- JWT: access token (HTTP-only cookie), refresh token (HTTP-only cookie)
- Token rotation on refresh
- Bcrypt for password hashing (salt rounds: 12)
- Rate limiting on ALL routes (production)
- Input sanitization (express-mongo-sanitize for NoSQL injection)
- Helmet for security headers (CSP, HSTS, etc.)

#### **7. Multi-tenancy & Data Isolation**
- Every resource scoped to `organization`
- Platform users identified via `isPlatformUser` flag (NOT environment variables)
- HOD (Head of Department) identified via `isHod` field
- Cross-org access strictly controlled via authorizationMatrix

#### **8. Platform Identification**
**CRITICAL CHANGE**: System no longer uses `PLATFORM_ORG_ID` or `PLATFORM_USER_ID` environment variables.
- Organizations: Use `isPlatformOrg: Boolean` field (immutable, indexed)
- Users: Use `isPlatformUser: Boolean` field (immutable, indexed)
- HOD status: Use `isHod: Boolean` field
- These fields replace all environment variable checks

#### **9. Timezone Management**
- **Backend**: ALL dates stored as UTC (MongoDB native Date type)
- **Server**: `process.env.TZ = "UTC"` set in server.js BEFORE any imports
- **Dayjs**: UTC plugin extended globally, `dayjs.tz.setDefault("UTC")`
- **Frontend**: Convert UTC → local for display, local → UTC for API calls
- **API responses**: ISO 8601 format (e.g., `2024-01-15T10:30:00.000Z`)

#### **10. Frontend Code Quality**
- **React Hook Form**:
  - NEVER use `watch()` - use controlled components
  - Always use `control` prop
  - Use `Controller` for MUI components
  - Form state managed via RHF, not local state

- **MUI v7 Syntax**:
  - `Grid` uses `size` prop (NOT `xs`, `sm`, `md`, `lg`, `xl`)
  - `Autocomplete` uses `slots` API (NOT `renderInput`)
  - Example: `<Grid size={{ xs: 12, md: 6 }}>`
  - Example: `<Autocomplete slots={{ input: TextField }} />`

- **Theme Usage**:
  - Import theme: `import { useTheme } from '@mui/material/styles'`
  - Use theme values: `theme.palette.primary.main`, `theme.spacing(2)`
  - NEVER hardcode colors, spacing, breakpoints

---

## **Complete Requirements** (All 735+ Embedded)

The following requirements are extracted from `backend/docs/codebase-requirements.md` and MUST be validated/implemented:

### **Phase & Task Execution**
1. Validate tasks execute in strict sequential order (Phase 1.1 → 1.2 → 2)
2. Confirm no frontend work starts before backend completion
3. Verify all tasks document WHAT/WHY/HOW methodology
4. Check all code changes update corresponding documentation
5. Validate all features have test coverage

### **Configuration Requirements**

#### **Helmet Security** (Requirements 1-4.9)
1. CSP configured with appropriate directives
2. HSTS enabled with 1-year max-age
3. Frame options set to DENY
4. Content-type sniffing disabled
5. XSS protection enabled
6. Referrer policy configured
7. Security headers verified in responses
8. Helmet applied globally before routes
9. Custom CSP for development vs production

#### **CORS** (Requirements 4.1-4.10, 19, 160, 191-200)
10. CORS origin validation aligns with `allowedOrigins.js`
11. Credentials enabled for cookie-based auth
12. Preflight caching set to 24 hours
13. Allowed methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
14. Allowed headers include Content-Type, Authorization
15. Environment-specific origins (dev/staging/prod)
16. No wildcard origins in ANY environment
17. Origin logging for security monitoring
18. Socket.IO CORS uses same origin validation
19. ValidateCorsConfig() runs on startup

*(Continue with all 735 requirements...)*

**Note**: Due to space constraints, the full 735 requirements are documented in `backend/docs/codebase-requirements.md`. You MUST cross-reference every implementation against this document.

---

## **Design Specifications**

### **Architecture Diagram**

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│  Pages → Components → Services (RTK Query) → Redux       │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP + Socket.IO
┌──────────────────────▼──────────────────────────────────┐
│                   API Gateway (Express)                  │
│  CORS → Helmet → Rate Limit → Auth → Authorization      │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│           Business Logic Layer (Controllers)             │
│        Services → Models → Soft Delete Plugin            │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│               Data Layer (MongoDB + Mongoose)            │
│  Transactions → Indexes → TTL → Cascade Operations       │
└─────────────────────────────────────────────────────────┘
```

### **Authorization Matrix Structure**

```json
{
  "Resource": {
    "RoleName": {
      "org": {
        "own": ["operation1", ...],
        "ownDept": ["operation2", ...],
        "crossDept": ["operation3", ...]
      },
      "crossOrg": {
        "from": "platform|all|none",
        "ops": ["read"]
      }
    }
  }
}
```

**10 Resources**: Organization, Department, User, Task, TaskActivity, TaskComment, Material, Vendor, Notification, Attachment
**4 Roles**: SuperAdmin, Admin, Manager, User
**Operations**: create, read, update, delete

### **19 Correctness Properties** (Property-Based Testing)

These are **formal statements** about system behavior that MUST hold true under all conditions:

1. **Soft Delete Plugin Prevents Hard Deletes**
   - ∀ model with softDelete plugin: `deleteOne()`, `deleteMany()`, `findOneAndDelete()` MUST throw error
   - Soft delete methods MUST be used exclusively

2. **Soft Delete Query Filtering**
   - ∀ query without `.withDeleted()`: result set MUST exclude documents where `isDeleted=true`
   - ∀ query with `.onlyDeleted()`: result set MUST include ONLY documents where `isDeleted=true`

3. **Soft Delete State Transitions**
   - Document state transitions: Active → Deleted → Restored → Active
   - `restoreCount` increments on each restore
   - `deletedAt`, `deletedBy` cleared on restore

4. **Cascade Soft Delete Integrity**
   - If Organization soft deleted → ALL departments, users, tasks, etc. MUST be soft deleted
   - If Department soft deleted → ALL users, tasks within dept MUST be soft deleted
   - Cascade MUST use MongoDB transactions

5. **TTL Auto-Cleanup**
   - Documents soft deleted for ≥ TTL period MUST be permanently deleted by MongoDB TTL index
   - Organizations NEVER auto-deleted (TTL = null)

6. **Multi-tenancy Data Isolation**
   - ∀ user U in organization O: U can ONLY access resources where `resource.organization = O`
   - Exception: Platform users with `isPlatformUser=true` have cross-org read access

7. **Authorization Matrix Consistency**
   - ∀ (resource, role, operation): permission granted IFF operation ∈ permissions[resource][role][scope][context]
   - Scope = "org" | "crossOrg"
   - Context = "own" | "ownDept" | "crossDept"

8. **JWT Token Lifecycle**
   - Access token expires after 15 minutes
   - Refresh token expires after 7 days
   - Token refresh generates NEW access + refresh tokens (rotation)
   - Expired tokens MUST result in 401 Unauthorized

9. **Password Security**
   - Passwords MUST be hashed with bcrypt (salt rounds 12)
   - Raw passwords NEVER stored or logged
   - Password reset tokens expire after 1 hour

10. **Rate Limiting Enforcement**
    - ∀ IP address: requests/window ≤ configured limit
    - Trusted IPs exempt from rate limiting
    - Rate limit exceeded → 429 Too Many Requests

11. **Timezone Consistency**
    - ALL dates stored in MongoDB as UTC
    - ALL API responses return ISO 8601 UTC timestamps
    - Frontend converts UTC ↔ user's local timezone

12. **Task Discriminator Integrity**
    - ProjectTask discriminator: `taskType="ProjectTask"`
    - RoutineTask discriminator: `taskType="RoutineTask"`
    - AssignedTask discriminator: `taskType="AssignedTask"`
    - All share BaseTask fields + discriminator-specific fields

13. **Material UnLink/Relink Atomicity**
    - `softDeleteByIdWithUnlink`: removes material from ALL tasks + activities atomically
    - `restoreByIdWithRelink`: restores material + optionally relinks atomically
    - MUST use transactions

14. **Vendor Reassignment Atomicity**
    - `softDeleteByIdWithReassign`: validates replacement vendor + reassigns all ProjectTasks atomically
    - MUST fail if vendor has active tasks AND no `reassignToVendorId` provided

15. **Comment Threading Depth Limit**
    - TaskComment threading depth ≤ 5 levels
    - Validation uses `$graphLookup` aggregation
    - Exceeding limit MUST throw validation error

16. **Notification Recipient Validity**
    - ALL recipients MUST be active users in same organization
    - Max recipients = 50
    - `readBy` array ≤ 50 entries

17. **Attachment File Size Limits by Type**
    - Image: ≤5MB, Video: ≤50MB, Audio: ≤10MB, Document: ≤10MB, Other: ≤10MB
    - Exceeding limit MUST fail validation

18. **Email Delivery Idempotency**
    - Email send attempts tracked in `emailDelivery.attempts`
    - Failed emails retried with exponential backoff
    - Max retry attempts = 3

19. **Socket.IO Room Isolation**
    - Users ONLY receive events for rooms they've joined
    - Room types: `org:${orgId}`, `dept:${deptId}`, `user:${userId}`
    - Cross-org events forbidden (except platform users)

---

## **Detailed Phase 1 Tasks** (Backend)

### **Phase 1.1: Core Components**

#### **Task 1.1.1: Helmet Security Configuration**

**WHAT**: Validate Helmet middleware is correctly configured with appropriate security headers.

**WHY**: Helmet prevents common web vulnerabilities (XSS, clickjacking, MIME sniffing). Requirements 1-4.9 mandate specific CSP, HSTS, and frame options.

**HOW**:
1. Open `backend/app.js`
2. Verify Helmet is imported: `import helmet from 'helmet'`
3. Verify Helmet is applied BEFORE all routes: `app.use(helmet(...))`
4. Check CSP configuration includes:
   - `defaultSrc: ["'self'"]`
   - `scriptSrc: ["'self'", "'unsafe-inline'"]` (only if needed)
   - `styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com']`
   - `fontSrc: ["'self'", 'https://fonts.gstatic.com']`
   - `imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com']`
   - `connectSrc: ["'self'"]`
5. Verify HSTS: `hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }`
6. Verify frame options: `frameguard: { action: 'deny' }`
7. Verify noSn iff: `noSniff: true`
8. Verify XSS filter: `xssFilter: true`

**Test**:
```bash
# Start server
npm run dev

# Check response headers
curl -I http://localhost:4000/health

# Expected headers:
# Content-Security-Policy: ...
# Strict-Transport-Security: max-age=31536000
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
```

**Additional Validation**:
- Verify Helmet is NOT bypassed for any routes
- Confirm CSP doesn't allow `'unsafe-eval'`
- Check HSTS maxAge is exactly 1 year (31536000 seconds)

---

*(Continue with 100+ detailed backend tasks...)*

---

## **Detailed Phase 2 Tasks** (Frontend)

*(Continue with 60+ detailed frontend tasks...)*

---

## **Validation Checklist**

Before marking any phase as complete, verify ALL of the following:

### **Phase 1.1 Checklist** (Backend Core)
- [ ] All models have softDelete plugin applied
- [ ] All models have proper indexes (soft delete aware)
- [ ] All models validate references belong to same org
- [ ] TTL indexes configured per resource type
- [ ] Cascade operations use MongoDB transactions
- [ ] Environment variables validated on startup
- [ ] CORS configured with no wildcards
- [ ] Helmet security headers present
- [ ] Rate limiting configured for all routes
- [ ] MongoDB retry logic with exponential backoff
- [ ] Health check endpoints respond correctly
- [ ] Graceful shutdown handles all signals

### **Phase 1.2 Checklist** (Backend Resources)
- [ ] All controllers use async/await with error handling
- [ ] All endpoints have authorization checks
- [ ] All validators match model field names
- [ ] All routes have rate limiting
- [ ] Pagination uses 1-based indexing
- [ ] Soft delete endpoints implemented
- [ ] Transaction support for multi-step operations
- [ ] Consistent response format across all endpoints
- [ ] Socket.IO events emitted for real-time updates
- [ ] Email notifications queued properly

### **Phase 2 Checklist** (Frontend)
- [ ] Constants synchronized with backend
- [ ] All forms use React Hook Form (no `watch()`)
- [ ] MUI v7 syntax used throughout
- [ ] Theme values used (no hardcoded colors)
- [ ] Error boundaries catch component errors
- [ ] 401 errors trigger auto-logout
- [ ] 403 errors display error (NO auto-logout)
- [ ] RTK Query cache invalidation on mutations
- [ ] Redux Persist configured for auth + user slices
- [ ] Timezone conversion for all date displays
- [ ] Loading states for all async operations
- [ ] Empty states for all list views

---

## **Testing Strategy**

### **Unit Tests** (>80% coverage required)
- Test all model validation rules
- Test all utility functions
- Test all middleware logic
- Test all service methods

### **Integration Tests**
- Test full request/response cycles
- Test authentication flows
- Test authorization for all resources
- Test cascade operations with transactions

### **Property-Based Tests** (fast-check)
- Implement tests for all 19 Correctness Properties
- Generate randomized test data
- Verify invariants hold across 1000+ test cases

### **Manual Testing**
- Create platform organization with `isPlatformOrg=true`
- Create platform user with `isPlatformUser=true`
- Test cross-org read access for platform users
- Test cross-org write access is forbidden
- Test soft delete → restore flows
- Test TTL cleanup (accelerated for testing)
- Test Socket.IO real-time updates
- Test email delivery with retry logic

---

## **Final Deliverables**

1. **Backend Phase**
   - All 735+ requirements validated ✓
   - All models, controllers, routes tested ✓
   - Test coverage >80% ✓
   - Documentation updated ✓

2. **Frontend Phase**
   - All pages/components implement design ✓
   - Constants synchronized ✓
   - Code quality rules enforced ✓
   - Error handling complete ✓

3. **Production Readiness**
   - Environment variable validation ✓
   - Graceful shutdown implemented ✓
   - Health checks functional ✓
   - Rate limiting enforced ✓
   - Security headers configured ✓
   - Logging structured (Winston) ✓
   - Database indexes optimized ✓
   - TTL cleanup verified ✓

---

**BEGIN VALIDATION AND CORRECTION NOW. Report progress after each phase completion.**
