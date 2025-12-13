### Phase 5: Backend Controllers Validation

**Branch**: `validate/phase-5-backend-controllers`

#### Critical Implementation Workflow

1. **Branch Creation**

   ```bash
   git checkout -b validate/phase-5-backend-controllers
   ```

2. **Search & Read Files**

   Files to validate (9 controller files):

   - `backend/controllers/authControllers.js`
   - `backend/controllers/userControllers.js`
   - `backend/controllers/organizationControllers.js`
   - `backend/controllers/departmentControllers.js`
   - `backend/controllers/taskControllers.js`
   - `backend/controllers/materialControllers.js`
   - `backend/controllers/vendorControllers.js`
   - `backend/controllers/attachmentControllers.js`
   - `backend/controllers/notificationControllers.js`

3. **Analysis for Each Controller**

   **UNIVERSAL CONTROLLER PATTERNS TO VALIDATE:**

   For EVERY controller function, validate:

   **A. Function Signature & Wrapper**

   - ✅ Wrapped with `asyncHandler(async (req, res, next) => {})`
   - ✅ Parameters: req, res, next (in that order)
   - ✅ Async function (uses await)
   - ✅ No try/catch at function level (asyncHandler handles it)

   **B. Data Extraction from req.user**

   - ✅ `const orgId = req.user.organization._id;` (for multi-tenancy)
   - ✅ `const deptId = req.user.department._id;` (for department isolation)
   - ✅ `const callerId = req.user._id;` (for audit trails)
   - ✅ `const caller = req.user;` (when full user object needed)
   - ✅ `const userRole = req.user.role;` (for role-based logic)
   - ✅ `const isPlatformUser = req.user.isPlatformUser;` (for platform checks)

   **C. Data Extraction from req.validated**

   - ✅ `const { field1, field2 } = req.validated.body;` (for POST/PUT/PATCH)
   - ✅ `const { resourceId } = req.validated.params;` (for route params)
   - ✅ `const { page, limit, search, deleted } = req.validated.query;` (for GET with filters)
   - ✅ NEVER access req.body, req.params, req.query directly
   - ✅ ALWAYS use req.validated (validated by express-validator middleware)

   **D. Session Management for Write Operations**

   - ✅ Create session: `const session = await mongoose.startSession();`
   - ✅ Start transaction: `session.startTransaction();`
   - ✅ Wrap in try/catch/finally
   - ✅ Pass session to all DB operations: `.save({ session })`, `.findOne().session(session)`
   - ✅ Commit on success: `await session.commitTransaction();`
   - ✅ Abort on error: `await session.abortTransaction();`
   - ✅ Pass error to next: `next(error);`
   - ✅ End session in finally: `session.endSession();`

   **E. Pagination for List Operations**

   - ✅ Extract pagination params: `const { page = 1, limit = 10 } = req.validated.query;`
   - ✅ Use mongoose-paginate-v2: `Model.paginate(filter, options)`
   - ✅ Options include: page, limit, sort, select, lean, populate
   - ✅ Return pagination metadata: page, limit, totalPages, totalCount, hasNext, hasPrev

   **F. Soft Delete Plugin Utilities**

   - ✅ Default queries exclude soft-deleted (plugin behavior)
   - ✅ Include deleted: `Model.withDeleted().find(filter)`
   - ✅ Only deleted: `Model.onlyDeleted().find(filter)`
   - ✅ Soft delete: `await doc.softDelete(session, deletedBy)`
   - ✅ Restore: `await doc.restore(session, restoredBy)`
   - ✅ Check deleted query param: `if (deleted === true) query = query.onlyDeleted();`

   **G. Cascade Delete Operations**

   - ✅ Use transactions for cascade operations
   - ✅ Soft delete parent first
   - ✅ Cascade to all children (departments, users, tasks, etc.)
   - ✅ Update references in related documents
   - ✅ Emit socket events for each affected resource
   - ✅ Create notifications for affected users

   **H. Cascade Restore Operations**

   - ✅ Use transactions for cascade operations
   - ✅ Restore parent first
   - ✅ Optionally restore children (based on business logic)
   - ✅ Update references in related documents
   - ✅ Emit socket events for each affected resource
   - ✅ Create notifications for affected users

   **I. Resource Linking/Unlinking**

   - ✅ When deleting vendor: Check for linked ProjectTasks, require reassignment
   - ✅ When deleting material: Check for linked tasks/activities, require reassignment
   - ✅ When deleting user: Remove from task watchers/assignees
   - ✅ When restoring: Re-link if original references still exist
   - ✅ Validate references exist before linking

   **J. Multi-Tenancy Isolation**

   - ✅ ALWAYS filter by organization: `{ organization: orgId }`
   - ✅ Platform SuperAdmin exception: Can access all orgs for Organization resource only
   - ✅ Validate resource belongs to user's organization before operations
   - ✅ Throw 404 if resource not found in user's organization

   **K. Department Isolation**

   - ✅ Filter by department for Manager/User roles: `{ department: deptId }`
   - ✅ SuperAdmin/Admin can access all departments in their organization
   - ✅ Validate resource belongs to user's department (if required)

   **L. Ownership Checks**

   - ✅ For updates: Verify user owns resource or has permission
   - ✅ For deletes: Verify user owns resource or has permission
   - ✅ Check createdBy, uploadedBy, or assignees fields
   - ✅ Throw 403 if user doesn't have permission

   **M. Socket.IO Event Emission**

   - ✅ Import emitters: `emitToUser`, `emitToDepartment`, `emitToOrganization`, `emitToRecipients`
   - ✅ Emit after successful operation (after commit)
   - ✅ Event naming: `resource:action` (e.g., `task:created`, `user:updated`)
   - ✅ Emit to appropriate rooms based on scope
   - ✅ Include resource ID in event payload

   **N. Notification Creation**

   - ✅ Import helper: `createNotification` from utils/helpers.js
   - ✅ Create notifications for relevant actions (create, update, delete, mention)
   - ✅ Pass session for transaction consistency
   - ✅ Determine recipients based on business logic (HODs, watchers, assignees, mentions)
   - ✅ Include entity reference and type

   **O. Response Format**

   - ✅ Success: `res.status(200|201).json({ success: true, message, data, pagination })`
   - ✅ Use appropriate status codes: 200 (OK), 201 (Created), 204 (No Content)
   - ✅ Include descriptive messages
   - ✅ Return created/updated resource in response

   **P. Error Handling**

   - ✅ Use CustomError class: `CustomError.notFound()`, `CustomError.validation()`, etc.
   - ✅ Provide context in errors: `{ resourceId, organizationId }`
   - ✅ Let asyncHandler catch and pass to error middleware
   - ✅ Abort transaction on error
   - ✅ Pass error to next middleware: `next(error)`

   **Q. TIMEZONE MANAGEMENT (CRITICAL)**

   **CRITICAL:** This Multi-Tenant SaaS Task Manager serves users worldwide. Proper timezone management ensures all users see dates and times correctly for their location while maintaining data consistency.

   **Core Principles:**

   - ✅ Store in UTC: All database dates stored in UTC (Universal Coordinated Time)
   - ✅ Convert at Boundaries: Frontend → Backend (Local → UTC), Backend → Frontend (UTC → Local)
   - ✅ Use ISO Format: Standardized date communication (ISO 8601)
   - ✅ Dayjs Consistency: Use same dayjs setup across frontend and backend

   **Backend Timezone Validation:**

   **1. Server Timezone Setup**

   - ✅ File: `backend/server.js`
   - ✅ Set timezone: `process.env.TZ = "UTC";` (MUST be first line)
   - ✅ Verify timezone: Log server timezone and UTC time
   - ✅ Validation: Check `new Date().toString()` shows UTC

   **2. Dayjs Configuration**

   - ✅ File: `backend/utils/dateUtils.js`
   - ✅ Import: `dayjs`, `utc` plugin, `timezone` plugin
   - ✅ Extend: `dayjs.extend(utc)`, `dayjs.extend(timezone)`
   - ✅ Export utilities: `toUTC(date)`, `formatISO(date)`, `isValidDate(date)`

   **3. Model Date Handling**

   - ✅ Pre-save hook: Convert all date fields to UTC
   - ✅ Example: `this.dueDate = dayjs(this.dueDate).utc().toDate();`
   - ✅ toJSON transform: Convert dates to ISO strings for API responses
   - ✅ Example: `if (ret.dueDate) ret.dueDate = dayjs(ret.dueDate).utc().toISOString();`
   - ✅ Timestamps: createdAt and updatedAt automatically in UTC

   **4. Controller Date Handling**

   - ✅ Import: `import dayjs from "../utils/dateUtils.js";`
   - ✅ Convert incoming dates: `startDate: startDate ? dayjs(startDate).utc().toDate() : undefined`
   - ✅ Before saving: Convert all date fields from req.validated.body to UTC
   - ✅ Response: Dates automatically converted to ISO strings by toJSON transform
   - ✅ Validation: Check date validity before conversion

   **5. Date Field Validation in Controllers**

   - ✅ Check date is valid: `if (!dayjs(date).isValid()) throw CustomError.validation('Invalid date')`
   - ✅ Check date not in past (if required): `if (dayjs(date).isBefore(dayjs())) throw CustomError.validation('Date cannot be in past')`
   - ✅ Check dueDate after startDate: `if (dayjs(dueDate).isBefore(startDate)) throw CustomError.validation('Due date must be after start date')`
   - ✅ Convert to UTC before saving: `dayjs(date).utc().toDate()`

   **Controllers with Date Fields to Validate:**

   **authControllers.js:**

   - registerOrganization: userData.joinedAt (convert to UTC)
   - loginUser: Update lastLogin (use `new Date()` - already UTC)

   **userControllers.js:**

   - createUser: dateOfBirth, joinedAt (convert to UTC, validate not future)
   - updateUserBy: dateOfBirth, joinedAt (convert to UTC if changing)
   - updateMyProfile: dateOfBirth (convert to UTC if changing)

   **taskControllers.js:**

   - createTask: startDate, dueDate (convert to UTC, validate dueDate > startDate)
   - updateTask: startDate, dueDate (convert to UTC if changing, validate)
   - createTaskActivity: createdAt (automatic, UTC)
   - createTaskComment: createdAt (automatic, UTC)

   **Common Issues:**

   - ❌ Not converting incoming dates to UTC
   - ❌ Storing dates in local timezone
   - ❌ Not validating date fields
   - ❌ Not checking dueDate > startDate
   - ❌ Not checking dates not in past (when required)
   - ❌ Using native Date() instead of dayjs
   - ❌ Not using toJSON transform for responses

   **Tests Required:**

   - Unit test: Date conversion to UTC works
   - Unit test: Invalid dates rejected
   - Unit test: Past dates rejected (when required)
   - Unit test: dueDate before startDate rejected
   - Unit test: API responses return ISO strings
   - Integration test: Create task with dates in different timezone
   - Integration test: Dates stored as UTC in database
   - Integration test: Dates returned as ISO strings

   ***

   **For `backend/controllers/authControllers.js`:**

   **Controllers to Validate:**

   1. registerOrganization
   2. loginUser
   3. logoutUser
   4. getRefreshToken
   5. forgotPassword
   6. resetPassword

   **Logic to Extract:**

   **1. registerOrganization**

   - Extract: organizationData, userData from req.validated.body
   - Session: YES (creates org, dept, user)
   - Business Logic:
     - Create organization (isPlatformOrg: false by default)
     - Check department name uniqueness within organization
     - Create department
     - Create SuperAdmin user (role: SuperAdmin, isHod: true auto-set)
     - Auto-set isPlatformUser from organization
     - Send welcome email (optional)
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Creates organization first
     - ✅ Checks department name uniqueness
     - ✅ Creates department with org reference
     - ✅ Creates user with SuperAdmin role
     - ✅ User has org and dept references
     - ✅ Commits transaction on success
     - ✅ Aborts on error
     - ✅ Returns 201 status
   - Common Issues:
     - ❌ Not using transaction
     - ❌ Not checking department uniqueness
     - ❌ Not setting user role to SuperAdmin
     - ❌ Not linking user to org/dept
   - Tests Required:
     - Unit test: Successful registration
     - Unit test: Duplicate department name fails
     - Unit test: Transaction rollback on error
     - Integration test: Full registration flow

   **2. loginUser**

   - Extract: email, password from req.validated.body
   - Session: NO (read-only)
   - Business Logic:
     - Find user by email (include password field)
     - Check user not soft-deleted
     - Verify password with bcrypt
     - Check user status (active/suspended)
     - Generate access token (15min)
     - Generate refresh token (7d)
     - Set HTTP-only cookies
     - Update lastLogin timestamp
     - Return user data (without password)
   - Validation Checks:
     - ✅ Finds user with password field: `.select('+password')`
     - ✅ Checks isDeleted: false
     - ✅ Uses user.comparePassword() method
     - ✅ Generates both tokens
     - ✅ Sets cookies with correct options (httpOnly, secure, sameSite)
     - ✅ Updates lastLogin
     - ✅ Returns user without password
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not selecting password field
     - ❌ Not checking if user is deleted
     - ❌ Not using comparePassword method
     - ❌ Tokens in response body instead of cookies
     - ❌ Not setting httpOnly flag
   - Tests Required:
     - Unit test: Successful login
     - Unit test: Invalid email fails
     - Unit test: Invalid password fails
     - Unit test: Deleted user cannot login
     - Unit test: Cookies set correctly
     - Integration test: Full login flow

   **3. logoutUser**

   - Extract: User from req.user (already authenticated via verifyRefreshToken)
   - Session: NO
   - Business Logic:
     - Clear access_token cookie
     - Clear refresh_token cookie
     - Return success message
   - Validation Checks:
     - ✅ Clears both cookies
     - ✅ Sets maxAge: 0 or expires: past date
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not clearing both cookies
     - ❌ Not setting proper cookie options
   - Tests Required:
     - Unit test: Cookies cleared
     - Integration test: Logout flow

   **4. getRefreshToken**

   - Extract: User from req.user (already authenticated via verifyRefreshToken)
   - Session: NO
   - Business Logic:
     - Generate new access token (15min)
     - Generate new refresh token (7d) - TOKEN ROTATION
     - Set HTTP-only cookies
     - Return success message
   - Validation Checks:
     - ✅ Generates new access token
     - ✅ Generates new refresh token (rotation)
     - ✅ Sets both cookies
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not rotating refresh token
     - ❌ Only generating access token
   - Tests Required:
     - Unit test: Both tokens generated
     - Unit test: Token rotation works
     - Integration test: Refresh flow

   **5. forgotPassword**

   - Extract: email from req.validated.body
   - Session: NO
   - Business Logic:
     - Find user by email
     - Generate password reset token (random)
     - Hash token with bcrypt (10 rounds)
     - Save hashed token and expiry (1 hour) to user
     - Send reset email with unhashed token
     - ALWAYS return success (prevent email enumeration)
   - Validation Checks:
     - ✅ Finds user by email
     - ✅ Generates random reset token
     - ✅ Hashes token before saving
     - ✅ Sets expiry (1 hour from now)
     - ✅ Sends email with unhashed token
     - ✅ Returns success even if user not found (security)
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not hashing reset token
     - ❌ Revealing if email exists
     - ❌ Not setting expiry
     - ❌ Sending hashed token in email
   - Tests Required:
     - Unit test: Token generated and hashed
     - Unit test: Expiry set correctly
     - Unit test: Email sent
     - Unit test: Returns success for non-existent email
     - Integration test: Full forgot password flow

   **6. resetPassword**

   - Extract: token, newPassword from req.validated.body
   - Session: NO
   - Business Logic:
     - Hash provided token
     - Find user with matching hashed token
     - Check token not expired
     - Set new password (will be hashed by pre-save hook)
     - Clear reset token and expiry
     - Save user
     - Send confirmation email
     - Return success message
   - Validation Checks:
     - ✅ Hashes provided token for comparison
     - ✅ Finds user with matching token
     - ✅ Checks passwordResetExpires > now
     - ✅ Sets new password
     - ✅ Clears passwordResetToken and passwordResetExpires
     - ✅ Password hashed by pre-save hook
     - ✅ Sends confirmation email
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not hashing token for comparison
     - ❌ Not checking expiry
     - ❌ Not clearing reset fields
     - ❌ Manually hashing password (should use pre-save hook)
   - Tests Required:
     - Unit test: Successful password reset
     - Unit test: Invalid token fails
     - Unit test: Expired token fails
     - Unit test: Reset fields cleared
     - Integration test: Full reset flow

   ***

   **For `backend/controllers/userControllers.js`:**

   **Controllers to Validate:**

   1. createUser
   2. getAllUsers
   3. getUser
   4. updateUserBy (admin updates user)
   5. updateMyProfile (user updates own profile)
   6. getMyAccount
   7. deleteUser
   8. restoreUser

   **Logic to Extract:**

   **1. createUser**

   - Extract: orgId, callerId from req.user
   - Extract: firstName, lastName, position, role, email, password, departmentId, profilePicture, skills, employeeId, dateOfBirth, joinedAt from req.validated.body
   - Session: YES
   - Business Logic:
     - Validate department exists in organization
     - Create user with provided data
     - Auto-set isHod based on role (SuperAdmin/Admin = true)
     - Auto-set isPlatformUser from organization
     - Find HOD recipients in department
     - Create notifications for HODs
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Validates department exists and belongs to org
     - ✅ Creates user with all fields
     - ✅ isHod auto-set (not manually set)
     - ✅ isPlatformUser auto-set (not manually set)
     - ✅ Finds HOD recipients
     - ✅ Creates notifications
     - ✅ Emits to department and recipients
     - ✅ Returns 201 status
   - Common Issues:
     - ❌ Not validating department
     - ❌ Manually setting isHod or isPlatformUser
     - ❌ Not creating notifications
     - ❌ Not emitting socket events
   - Tests Required:
     - Unit test: Successful user creation
     - Unit test: Invalid department fails
     - Unit test: isHod auto-set for SuperAdmin/Admin
     - Unit test: Notifications created
     - Integration test: Full creation flow

   **2. getAllUsers**

   - Extract: orgId, caller from req.user
   - Extract: page, limit, search, deleted, role, department, sortBy, sortOrder from req.validated.query
   - Session: NO
   - Business Logic:
     - Build filter based on user role and permissions
     - Platform SuperAdmin: Can see all users in all orgs
     - Customer SuperAdmin/Admin: Can see all users in own org
     - Manager/User: Can see users in own department
     - Apply search, role, department filters
     - Use pagination plugin
     - Return users with pagination metadata
   - Validation Checks:
     - ✅ Filters by organization (except platform SuperAdmin)
     - ✅ Filters by department for Manager/User
     - ✅ Applies search filter (name, email)
     - ✅ Applies role filter
     - ✅ Applies department filter
     - ✅ Uses deleted query param correctly
     - ✅ Uses pagination plugin
     - ✅ Returns pagination metadata
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not filtering by organization
     - ❌ Not filtering by department for Manager/User
     - ❌ Not using pagination plugin
     - ❌ Not handling deleted query param
   - Tests Required:
     - Unit test: Platform SuperAdmin sees all users
     - Unit test: Customer Admin sees only own org users
     - Unit test: Manager sees only own dept users
     - Unit test: Search filter works
     - Unit test: Pagination works
     - Integration test: Full list flow

   **3. getUser**

   - Extract: userId from req.validated.params
   - Extract: orgId from req.user
   - Session: NO
   - Business Logic:
     - Find user by ID
     - Validate user belongs to organization
     - Populate organization and department
     - Return user details
   - Validation Checks:
     - ✅ Finds user by ID
     - ✅ Validates organization match
     - ✅ Populates references
     - ✅ Returns 404 if not found
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not validating organization match
     - ❌ Not populating references
   - Tests Required:
     - Unit test: Successful user retrieval
     - Unit test: User from different org returns 404
     - Integration test: Full get flow

   **4. updateUserBy (Admin updates user)**

   - Extract: userId from req.validated.params
   - Extract: update fields from req.validated.body
   - Extract: orgId, callerId from req.user
   - Session: YES
   - Business Logic:
     - Find user by ID in organization
     - Validate department if changing
     - Update user fields
     - If role changed, isHod auto-updates
     - Create notification
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Validates user exists in org
     - ✅ Validates department if changing
     - ✅ Updates fields
     - ✅ isHod auto-updates on role change
     - ✅ Creates notification
     - ✅ Emits events
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not using transaction
     - ❌ Not validating department
     - ❌ Manually setting isHod
     - ❌ Not creating notification
   - Tests Required:
     - Unit test: Successful update
     - Unit test: isHod updates on role change
     - Unit test: Invalid department fails
     - Integration test: Full update flow

   **5. updateMyProfile (User updates own profile)**

   - Extract: userId from req.validated.params
   - Extract: update fields from req.validated.body
   - Extract: callerId from req.user
   - Session: YES
   - Business Logic:
     - Validate userId matches callerId (user can only update own profile)
     - Find user
     - Update allowed fields only (not role, not department)
     - Save user
     - Return updated user
   - Validation Checks:
     - ✅ Validates userId === callerId
     - ✅ Updates only allowed fields
     - ✅ Cannot change role
     - ✅ Cannot change department
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not validating ownership
     - ❌ Allowing role/department changes
   - Tests Required:
     - Unit test: Successful profile update
     - Unit test: Cannot update other user's profile
     - Unit test: Cannot change role
     - Integration test: Full profile update flow

   **6. getMyAccount**

   - Extract: userId from req.validated.params
   - Extract: callerId from req.user
   - Session: NO
   - Business Logic:
     - Validate userId matches callerId
     - Find user with populated references
     - Return user details
   - Validation Checks:
     - ✅ Validates userId === callerId
     - ✅ Populates references
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not validating ownership
   - Tests Required:
     - Unit test: Successful account retrieval
     - Unit test: Cannot get other user's account

   **7. deleteUser**

   - Extract: userId from req.validated.params
   - Extract: orgId, deptId, callerId from req.user
   - Session: YES
   - Business Logic:
     - Find user in organization
     - Check not last SuperAdmin in organization
     - Check not last HOD in department
     - Soft delete user
     - Remove user from task watchers/assignees
     - Create notifications
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Validates user exists in org
     - ✅ Checks not last SuperAdmin
     - ✅ Checks not last HOD
     - ✅ Soft deletes user
     - ✅ Removes from task watchers
     - ✅ Removes from task assignees
     - ✅ Creates notifications
     - ✅ Emits events
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not checking last SuperAdmin
     - ❌ Not checking last HOD
     - ❌ Not removing from tasks
     - ❌ Hard delete instead of soft delete
   - Tests Required:
     - Unit test: Successful deletion
     - Unit test: Cannot delete last SuperAdmin
     - Unit test: Cannot delete last HOD
     - Unit test: Removed from tasks
     - Integration test: Full delete flow

   **8. restoreUser**

   - Extract: userId from req.validated.params
   - Extract: orgId, callerId from req.user
   - Session: YES
   - Business Logic:
     - Find soft-deleted user
     - Validate department still exists
     - Restore user
     - Create notification
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Finds only deleted user
     - ✅ Validates department exists
     - ✅ Restores user
     - ✅ Creates notification
     - ✅ Emits events
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not checking department exists
     - ❌ Not using onlyDeleted query
   - Tests Required:
     - Unit test: Successful restore
     - Unit test: Cannot restore if department deleted
     - Integration test: Full restore flow

   ***

   **For `backend/controllers/organizationControllers.js`:**

   **Controllers to Validate:**

   1. getAllOrganizations
   2. getOrganizationDashboard
   3. updateOrganization
   4. deleteOrganization
   5. restoreOrganization

   **Logic to Extract:**

   **1. getAllOrganizations**

   - Extract: orgId, isPlatformUser from req.user
   - Extract: page, limit, search, deleted, industry, sortBy, sortOrder from req.validated.query
   - Session: NO
   - Business Logic:
     - Platform SuperAdmin: Can see all organizations
     - Customer users: Can only see own organization
     - Apply search, industry filters
     - Use pagination plugin
     - Return organizations with pagination metadata
   - Validation Checks:
     - ✅ Filters by organization for non-platform users
     - ✅ Platform users see all organizations
     - ✅ Applies search filter
     - ✅ Applies industry filter
     - ✅ Uses deleted query param
     - ✅ Uses pagination plugin
     - ✅ Returns pagination metadata
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not checking isPlatformUser
     - ❌ Customer users can see other orgs
   - Tests Required:
     - Unit test: Platform user sees all orgs
     - Unit test: Customer user sees only own org
     - Unit test: Search filter works
     - Integration test: Full list flow

   **2. getOrganizationDashboard**

   - Extract: organizationId from req.validated.params
   - Extract: orgId, isPlatformUser from req.user
   - Session: NO
   - Business Logic:
     - Validate access (platform user or own org)
     - Find organization
     - Get stats: department count, user count, task count
     - Return organization with stats
   - Validation Checks:
     - ✅ Validates access permission
     - ✅ Finds organization
     - ✅ Calculates stats
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not validating access
     - ❌ Not calculating stats
   - Tests Required:
     - Unit test: Platform user can access any org
     - Unit test: Customer user can only access own org
     - Unit test: Stats calculated correctly

   **3. updateOrganization**

   - Extract: organizationId from req.validated.params
   - Extract: update fields from req.validated.body
   - Extract: orgId, isPlatformUser, callerId from req.user
   - Session: YES
   - Business Logic:
     - Validate access (platform user or own org)
     - Find organization
     - Cannot change isPlatformOrg (immutable)
     - Update fields
     - Create notification
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Validates access
     - ✅ Cannot change isPlatformOrg
     - ✅ Updates fields
     - ✅ Creates notification
     - ✅ Emits events
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Allowing isPlatformOrg change
     - ❌ Not validating access
   - Tests Required:
     - Unit test: Successful update
     - Unit test: Cannot change isPlatformOrg
     - Unit test: Access validation works

   **4. deleteOrganization**

   - Extract: organizationId from req.validated.params
   - Extract: orgId, isPlatformUser, callerId from req.user
   - Session: YES
   - Business Logic:
     - Validate access (platform user only)
     - Find organization
     - Check not platform organization (cannot delete)
     - Soft delete organization
     - Cascade delete to departments, users, tasks, materials, vendors, notifications
     - Create notifications
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Validates platform user access
     - ✅ Cannot delete platform organization
     - ✅ Soft deletes organization
     - ✅ Cascades to all children
     - ✅ Creates notifications
     - ✅ Emits events
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Allowing platform org deletion
     - ❌ Not cascading to children
     - ❌ Hard delete instead of soft delete
   - Tests Required:
     - Unit test: Successful deletion
     - Unit test: Cannot delete platform org
     - Unit test: Cascade works
     - Integration test: Full delete flow

   **5. restoreOrganization**

   - Extract: organizationId from req.validated.params
   - Extract: isPlatformUser, callerId from req.user
   - Session: YES
   - Business Logic:
     - Validate platform user access
     - Find soft-deleted organization
     - Restore organization
     - Optionally restore departments and users
     - Create notifications
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Validates platform user access
     - ✅ Finds only deleted org
     - ✅ Restores organization
     - ✅ Creates notifications
     - ✅ Emits events
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not validating platform access
     - ❌ Not using onlyDeleted query
   - Tests Required:
     - Unit test: Successful restore
     - Unit test: Only platform user can restore
     - Integration test: Full restore flow

   ***

   **For `backend/controllers/departmentControllers.js`:**

   **Controllers to Validate:**

   1. createDepartment
   2. getAllDepartments
   3. getDepartment
   4. updateDepartment
   5. deleteDepartment
   6. restoreDepartment

   **Logic to Extract:**

   **1. createDepartment**

   - Extract: orgId, callerId from req.user
   - Extract: name, description from req.validated.body
   - Session: YES
   - Business Logic:
     - Check department name uniqueness within organization
     - Create department with org reference
     - Find HOD recipients in organization
     - Create notifications for HODs
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Checks name uniqueness within organization
     - ✅ Creates department with org reference
     - ✅ Finds HOD recipients
     - ✅ Creates notifications
     - ✅ Emits to organization and recipients
     - ✅ Returns 201 status
   - Common Issues:
     - ❌ Not checking name uniqueness
     - ❌ Not scoping uniqueness to organization
     - ❌ Not creating notifications
     - ❌ Not emitting socket events
   - Tests Required:
     - Unit test: Successful department creation
     - Unit test: Duplicate name in same org fails
     - Unit test: Same name in different org succeeds
     - Unit test: Notifications created
     - Integration test: Full creation flow

   **2. getAllDepartments**

   - Extract: orgId from req.user
   - Extract: page, limit, search, deleted, sortBy, sortOrder from req.validated.query
   - Session: NO
   - Business Logic:
     - Filter by organization
     - Apply search filter (name, description)
     - Use pagination plugin
     - Return departments with pagination metadata
   - Validation Checks:
     - ✅ Filters by organization
     - ✅ Applies search filter
     - ✅ Uses deleted query param correctly
     - ✅ Uses pagination plugin
     - ✅ Returns pagination metadata
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not filtering by organization
     - ❌ Not using pagination plugin
     - ❌ Not handling deleted query param
   - Tests Required:
     - Unit test: Only own org departments returned
     - Unit test: Search filter works
     - Unit test: Pagination works
     - Unit test: Deleted param works
     - Integration test: Full list flow

   **3. getDepartment**

   - Extract: departmentId from req.validated.params
   - Extract: orgId from req.user
   - Session: NO
   - Business Logic:
     - Find department by ID
     - Validate department belongs to organization
     - Populate users and tasks (optional)
     - Return department details with stats
   - Validation Checks:
     - ✅ Finds department by ID
     - ✅ Validates organization match
     - ✅ Populates references
     - ✅ Calculates stats (user count, task count)
     - ✅ Returns 404 if not found
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not validating organization match
     - ❌ Not populating references
     - ❌ Not calculating stats
   - Tests Required:
     - Unit test: Successful department retrieval
     - Unit test: Department from different org returns 404
     - Unit test: Stats calculated correctly
     - Integration test: Full get flow

   **4. updateDepartment**

   - Extract: departmentId from req.validated.params
   - Extract: name, description from req.validated.body
   - Extract: orgId, callerId from req.user
   - Session: YES
   - Business Logic:
     - Find department in organization
     - Check name uniqueness if changing name
     - Update department fields
     - Create notification
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Validates department exists in org
     - ✅ Checks name uniqueness if changing
     - ✅ Updates fields
     - ✅ Creates notification
     - ✅ Emits events
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not using transaction
     - ❌ Not checking name uniqueness
     - ❌ Not creating notification
   - Tests Required:
     - Unit test: Successful update
     - Unit test: Duplicate name fails
     - Unit test: Notification created
     - Integration test: Full update flow

   **5. deleteDepartment**

   - Extract: departmentId from req.validated.params
   - Extract: orgId, callerId from req.user
   - Session: YES
   - Business Logic:
     - Find department in organization
     - Check not last department in organization
     - Soft delete department
     - Cascade delete to users, tasks, materials
     - Create notifications
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Validates department exists in org
     - ✅ Checks not last department
     - ✅ Soft deletes department
     - ✅ Cascades to users, tasks, materials
     - ✅ Creates notifications
     - ✅ Emits events
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not checking last department
     - ❌ Not cascading to children
     - ❌ Hard delete instead of soft delete
   - Tests Required:
     - Unit test: Successful deletion
     - Unit test: Cannot delete last department
     - Unit test: Cascade works
     - Integration test: Full delete flow

   **6. restoreDepartment**

   - Extract: departmentId from req.validated.params
   - Extract: orgId, callerId from req.user
   - Session: YES
   - Business Logic:
     - Find soft-deleted department
     - Validate organization still exists
     - Restore department
     - Optionally restore users
     - Create notification
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Finds only deleted department
     - ✅ Validates organization exists
     - ✅ Restores department
     - ✅ Creates notification
     - ✅ Emits events
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not checking organization exists
     - ❌ Not using onlyDeleted query
   - Tests Required:
     - Unit test: Successful restore
     - Unit test: Cannot restore if org deleted
     - Integration test: Full restore flow

   ***

   **For `backend/controllers/taskControllers.js`:**

   **Controllers to Validate:**

   1. createTask
   2. getAllTasks
   3. getTask
   4. updateTask
   5. deleteTask
   6. restoreTask
   7. createTaskActivity
   8. getAllTaskActivities
   9. getTaskActivity
   10. updateTaskActivity
   11. deleteTaskActivity
   12. restoreTaskActivity
   13. createTaskComment
   14. getAllTaskComments
   15. getTaskComment
   16. updateTaskComment
   17. deleteTaskComment
   18. restoreTaskComment

   **Logic to Extract:**

   **1. createTask**

   - Extract: orgId, deptId, callerId from req.user
   - Extract: taskType, description, status, priority, tags, watchers, attachments from req.validated.body
   - Extract type-specific fields:
     - ProjectTask: title, vendor, estimatedCost, startDate, dueDate
     - RoutineTask: materials (direct), startDate (required), dueDate (required)
     - AssignedTask: title, assignees, startDate, dueDate
   - Session: YES
   - Business Logic:
     - Validate task type (ProjectTask, RoutineTask, AssignedTask)
     - ProjectTask: Validate vendor exists, watchers HOD only
     - RoutineTask: Cannot be "To Do", cannot be "Low" priority, materials added directly
     - AssignedTask: Validate assignees exist, watchers HOD only
     - Validate watchers are HOD users
     - Validate date constraints (dueDate after startDate)
     - Create task with discriminator
     - Create notifications for watchers/assignees
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Validates task type
     - ✅ ProjectTask: vendor required, vendor exists
     - ✅ RoutineTask: status not "To Do", priority not "Low", dates required
     - ✅ AssignedTask: assignees required, assignees exist
     - ✅ Watchers are HOD only
     - ✅ Date validation (dueDate > startDate)
     - ✅ Creates task with correct discriminator
     - ✅ Creates notifications
     - ✅ Emits events
     - ✅ Returns 201 status
   - Common Issues:
     - ❌ Not validating task type restrictions
     - ❌ Allowing non-HOD watchers
     - ❌ RoutineTask with "To Do" status
     - ❌ RoutineTask with "Low" priority
     - ❌ Not validating vendor/assignees exist
   - Tests Required:
     - Unit test: ProjectTask creation with vendor
     - Unit test: RoutineTask creation with materials
     - Unit test: AssignedTask creation with assignees
     - Unit test: RoutineTask cannot be "To Do"
     - Unit test: RoutineTask cannot be "Low" priority
     - Unit test: Watchers must be HOD
     - Unit test: Date validation
     - Integration test: Full creation flow for each type

   **2. getAllTasks**

   - Extract: orgId, deptId from req.user
   - Extract: page, limit, search, deleted, taskType, status, priority, sortBy, sortOrder from req.validated.query
   - Session: NO
   - Business Logic:
     - Filter by organization and department
     - Apply task type filter
     - Apply status filter
     - Apply priority filter
     - Apply search filter (title, description, tags)
     - Use pagination plugin
     - Return tasks with pagination metadata
   - Validation Checks:
     - ✅ Filters by organization and department
     - ✅ Applies task type filter
     - ✅ Applies status filter
     - ✅ Applies priority filter
     - ✅ Applies search filter
     - ✅ Uses deleted query param
     - ✅ Uses pagination plugin
     - ✅ Returns pagination metadata
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not filtering by organization/department
     - ❌ Not using pagination plugin
   - Tests Required:
     - Unit test: Filters work correctly
     - Unit test: Pagination works
     - Unit test: Search works
     - Integration test: Full list flow

   **3. getTask**

   - Extract: taskId from req.validated.params
   - Extract: orgId from req.user
   - Session: NO
   - Business Logic:
     - Find task by ID
     - Validate task belongs to organization
     - Populate all references (vendor, assignees, watchers, materials, attachments)
     - Return task details with activities and comments
   - Validation Checks:
     - ✅ Finds task by ID
     - ✅ Validates organization match
     - ✅ Populates all references
     - ✅ Includes activities and comments
     - ✅ Returns 404 if not found
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not validating organization match
     - ❌ Not populating references
   - Tests Required:
     - Unit test: Successful task retrieval
     - Unit test: Task from different org returns 404
     - Integration test: Full get flow

   **4. updateTask**

   - Extract: taskId from req.validated.params
   - Extract: update fields from req.validated.body
   - Extract: orgId, deptId, callerId from req.user
   - Session: YES
   - Business Logic:
     - Find task in organization
     - Validate task type restrictions (RoutineTask status/priority)
     - Validate watchers are HOD if changing
     - Validate vendor/assignees exist if changing
     - Update task fields
     - Create notifications for watchers/assignees
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Validates task exists in org
     - ✅ Validates task type restrictions
     - ✅ Validates watchers are HOD
     - ✅ Validates vendor/assignees exist
     - ✅ Updates fields
     - ✅ Creates notifications
     - ✅ Emits events
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not validating task type restrictions
     - ❌ Allowing non-HOD watchers
     - ❌ Not validating references
   - Tests Required:
     - Unit test: Successful update
     - Unit test: RoutineTask restrictions enforced
     - Unit test: Watchers HOD validation
     - Integration test: Full update flow

   **5. deleteTask**

   - Extract: taskId from req.validated.params
   - Extract: orgId, deptId, callerId from req.user
   - Session: YES
   - Business Logic:
     - Find task in organization
     - Soft delete task
     - Cascade delete to activities, comments, attachments
     - Create notifications
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Validates task exists in org
     - ✅ Soft deletes task
     - ✅ Cascades to activities, comments, attachments
     - ✅ Creates notifications
     - ✅ Emits events
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not cascading to children
     - ❌ Hard delete instead of soft delete
   - Tests Required:
     - Unit test: Successful deletion
     - Unit test: Cascade works
     - Integration test: Full delete flow

   **6. restoreTask**

   - Extract: taskId from req.validated.params
   - Extract: orgId, deptId, callerId from req.user
   - Session: YES
   - Business Logic:
     - Find soft-deleted task
     - Validate vendor/assignees still exist
     - Validate department still exists
     - Restore task
     - Create notification
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Finds only deleted task
     - ✅ Validates references exist
     - ✅ Restores task
     - ✅ Creates notification
     - ✅ Emits events
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not checking references exist
     - ❌ Not using onlyDeleted query
   - Tests Required:
     - Unit test: Successful restore
     - Unit test: Cannot restore if vendor deleted
     - Integration test: Full restore flow

   **7. createTaskActivity**

   - Extract: orgId, deptId, callerId from req.user
   - Extract: taskId from req.validated.params
   - Extract: activity, materials from req.validated.body
   - Session: YES
   - Business Logic:
     - Find task by ID
     - Validate task is ProjectTask or AssignedTask (NOT RoutineTask)
     - Validate task belongs to organization
     - Validate materials exist
     - Create activity with materials
     - Create notifications for watchers
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Validates task exists in org
     - ✅ Validates task is ProjectTask or AssignedTask
     - ✅ Throws error if task is RoutineTask
     - ✅ Validates materials exist
     - ✅ Creates activity
     - ✅ Creates notifications
     - ✅ Emits events
     - ✅ Returns 201 status
   - Common Issues:
     - ❌ Allowing activity for RoutineTask
     - ❌ Not validating task type
     - ❌ Not validating materials
   - Tests Required:
     - Unit test: Activity for ProjectTask succeeds
     - Unit test: Activity for AssignedTask succeeds
     - Unit test: Activity for RoutineTask fails
     - Unit test: Materials validated
     - Integration test: Full creation flow

   **8. getAllTaskActivities**

   - Extract: orgId from req.user
   - Extract: taskId from req.validated.params
   - Extract: page, limit from req.validated.query
   - Session: NO
   - Business Logic:
     - Find task by ID
     - Validate task belongs to organization
     - Get activities for task with pagination
     - Return activities with pagination metadata
   - Validation Checks:
     - ✅ Validates task exists in org
     - ✅ Filters activities by task
     - ✅ Uses pagination plugin
     - ✅ Returns pagination metadata
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not validating task exists
     - ❌ Not using pagination
   - Tests Required:
     - Unit test: Activities returned for task
     - Unit test: Pagination works
     - Integration test: Full list flow

   **9. getTaskActivity**

   - Extract: activityId from req.validated.params
   - Extract: orgId from req.user
   - Session: NO
   - Business Logic:
     - Find activity by ID
     - Validate activity belongs to organization
     - Populate references (task, materials, createdBy)
     - Return activity details
   - Validation Checks:
     - ✅ Finds activity by ID
     - ✅ Validates organization match
     - ✅ Populates references
     - ✅ Returns 404 if not found
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not validating organization match
     - ❌ Not populating references
   - Tests Required:
     - Unit test: Successful activity retrieval
     - Unit test: Activity from different org returns 404
     - Integration test: Full get flow

   **10. updateTaskActivity**

   - Extract: activityId from req.validated.params
   - Extract: activity, materials from req.validated.body
   - Extract: orgId, deptId, callerId from req.user
   - Session: YES
   - Business Logic:
     - Find activity in organization
     - Validate materials exist if changing
     - Update activity fields
     - Create notification
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Validates activity exists in org
     - ✅ Validates materials exist
     - ✅ Updates fields
     - ✅ Creates notification
     - ✅ Emits events
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not using transaction
     - ❌ Not validating materials
   - Tests Required:
     - Unit test: Successful update
     - Unit test: Materials validated
     - Integration test: Full update flow

   **11. deleteTaskActivity**

   - Extract: activityId from req.validated.params
   - Extract: orgId, deptId, callerId from req.user
   - Session: YES
   - Business Logic:
     - Find activity in organization
     - Soft delete activity
     - Cascade delete to comments and attachments
     - Create notification
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Validates activity exists in org
     - ✅ Soft deletes activity
     - ✅ Cascades to comments and attachments
     - ✅ Creates notification
     - ✅ Emits events
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not cascading to children
     - ❌ Hard delete instead of soft delete
   - Tests Required:
     - Unit test: Successful deletion
     - Unit test: Cascade works
     - Integration test: Full delete flow

   **12. restoreTaskActivity**

   - Extract: activityId from req.validated.params
   - Extract: orgId, deptId, callerId from req.user
   - Session: YES
   - Business Logic:
     - Find soft-deleted activity
     - Validate parent task still exists
     - Restore activity
     - Create notification
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Finds only deleted activity
     - ✅ Validates parent task exists
     - ✅ Restores activity
     - ✅ Creates notification
     - ✅ Emits events
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not checking parent exists
     - ❌ Not using onlyDeleted query
   - Tests Required:
     - Unit test: Successful restore
     - Unit test: Cannot restore if task deleted
     - Integration test: Full restore flow

   **13. createTaskComment**

   - Extract: orgId, deptId, callerId from req.user
   - Extract: parent, parentModel, comment, mentions from req.validated.body
   - Session: YES
   - Business Logic:
     - Validate parent exists (Task, TaskActivity, or TaskComment)
     - Check comment depth (max 3 levels)
     - Validate mentions are valid users
     - Create comment
     - Create notifications for mentions
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Validates parent exists
     - ✅ Checks max depth 3
     - ✅ Validates mentions exist
     - ✅ Creates comment
     - ✅ Creates notifications for mentions
     - ✅ Emits events
     - ✅ Returns 201 status
   - Common Issues:
     - ❌ Not checking max depth
     - ❌ Not validating parent
     - ❌ Not validating mentions
   - Tests Required:
     - Unit test: Comment on task succeeds
     - Unit test: Comment on activity succeeds
     - Unit test: Comment on comment succeeds
     - Unit test: Depth 4 fails
     - Unit test: Mentions validated
     - Integration test: Full creation flow

   **14. getAllTaskComments**

   - Extract: orgId from req.user
   - Extract: parent, parentModel from req.validated.query
   - Extract: page, limit from req.validated.query
   - Session: NO
   - Business Logic:
     - Filter comments by parent
     - Use pagination plugin
     - Return comments with pagination metadata
   - Validation Checks:
     - ✅ Filters by parent
     - ✅ Uses pagination plugin
     - ✅ Returns pagination metadata
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not filtering by parent
     - ❌ Not using pagination
   - Tests Required:
     - Unit test: Comments returned for parent
     - Unit test: Pagination works
     - Integration test: Full list flow

   **15. getTaskComment**

   - Extract: commentId from req.validated.params
   - Extract: orgId from req.user
   - Session: NO
   - Business Logic:
     - Find comment by ID
     - Validate comment belongs to organization
     - Populate references (parent, mentions, createdBy)
     - Return comment details
   - Validation Checks:
     - ✅ Finds comment by ID
     - ✅ Validates organization match
     - ✅ Populates references
     - ✅ Returns 404 if not found
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not validating organization match
     - ❌ Not populating references
   - Tests Required:
     - Unit test: Successful comment retrieval
     - Unit test: Comment from different org returns 404
     - Integration test: Full get flow

   **16. updateTaskComment**

   - Extract: commentId from req.validated.params
   - Extract: comment, mentions from req.validated.body
   - Extract: orgId, deptId, callerId from req.user
   - Session: YES
   - Business Logic:
     - Find comment in organization
     - Validate mentions exist if changing
     - Update comment fields
     - Create notifications for new mentions
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Validates comment exists in org
     - ✅ Validates mentions exist
     - ✅ Updates fields
     - ✅ Creates notifications
     - ✅ Emits events
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not using transaction
     - ❌ Not validating mentions
   - Tests Required:
     - Unit test: Successful update
     - Unit test: Mentions validated
     - Integration test: Full update flow

   **17. deleteTaskComment**

   - Extract: commentId from req.validated.params
   - Extract: orgId, deptId, callerId from req.user
   - Session: YES
   - Business Logic:
     - Find comment in organization
     - Soft delete comment
     - Cascade delete to child comments (recursive)
     - Cascade delete to attachments
     - Create notification
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Validates comment exists in org
     - ✅ Soft deletes comment
     - ✅ Cascades to child comments recursively
     - ✅ Cascades to attachments
     - ✅ Creates notification
     - ✅ Emits events
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not cascading recursively
     - ❌ Hard delete instead of soft delete
   - Tests Required:
     - Unit test: Successful deletion
     - Unit test: Recursive cascade works
     - Integration test: Full delete flow

   **18. restoreTaskComment**

   - Extract: commentId from req.validated.params
   - Extract: orgId, deptId, callerId from req.user
   - Session: YES
   - Business Logic:
     - Find soft-deleted comment
     - Validate parent still exists
     - Restore comment
     - Create notification
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Finds only deleted comment
     - ✅ Validates parent exists
     - ✅ Restores comment
     - ✅ Creates notification
     - ✅ Emits events
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not checking parent exists
     - ❌ Not using onlyDeleted query
   - Tests Required:
     - Unit test: Successful restore
     - Unit test: Cannot restore if parent deleted
     - Integration test: Full restore flow

   ***

   **For `backend/controllers/materialControllers.js`:**

   **Controllers to Validate:**

   1. createMaterial
   2. getAllMaterials
   3. getMaterial
   4. updateMaterial
   5. deleteMaterial
   6. restoreMaterial

   **Logic to Extract:**

   **1. createMaterial**

   - Extract: orgId, deptId, callerId from req.user
   - Extract: name, description, category, unitType, price from req.validated.body
   - Session: YES
   - Business Logic:
     - Create material with org and dept references
     - Find HOD recipients in department
     - Create notifications for HODs
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Creates material with all fields
     - ✅ Sets org and dept references
     - ✅ Finds HOD recipients
     - ✅ Creates notifications
     - ✅ Emits to department and recipients
     - ✅ Returns 201 status
   - Common Issues:
     - ❌ Not using transaction
     - ❌ Not creating notifications
     - ❌ Not emitting socket events
   - Tests Required:
     - Unit test: Successful material creation
     - Unit test: Category validation
     - Unit test: Unit type validation
     - Unit test: Notifications created
     - Integration test: Full creation flow

   **2. getAllMaterials**

   - Extract: orgId, deptId from req.user
   - Extract: page, limit, search, deleted, category, sortBy, sortOrder from req.validated.query
   - Session: NO
   - Business Logic:
     - Filter by organization and department
     - Apply category filter
     - Apply search filter (name, description)
     - Use pagination plugin
     - Return materials with pagination metadata
   - Validation Checks:
     - ✅ Filters by organization and department
     - ✅ Applies category filter
     - ✅ Applies search filter
     - ✅ Uses deleted query param
     - ✅ Uses pagination plugin
     - ✅ Returns pagination metadata
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not filtering by organization/department
     - ❌ Not using pagination plugin
   - Tests Required:
     - Unit test: Filters work correctly
     - Unit test: Pagination works
     - Unit test: Search works
     - Integration test: Full list flow

   **3. getMaterial**

   - Extract: materialId from req.validated.params
   - Extract: orgId from req.user
   - Extract: includeUsage, includeTasks, includeActivities from req.validated.query
   - Session: NO
   - Business Logic:
     - Find material by ID
     - Validate material belongs to organization
     - Optionally include usage statistics
     - Optionally include linked tasks
     - Optionally include linked activities
     - Return material details with stats
   - Validation Checks:
     - ✅ Finds material by ID
     - ✅ Validates organization match
     - ✅ Calculates usage stats if requested
     - ✅ Includes linked tasks if requested
     - ✅ Includes linked activities if requested
     - ✅ Returns 404 if not found
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not validating organization match
     - ❌ Not calculating usage stats
   - Tests Required:
     - Unit test: Successful material retrieval
     - Unit test: Material from different org returns 404
     - Unit test: Usage stats calculated correctly
     - Integration test: Full get flow

   **4. updateMaterial**

   - Extract: materialId from req.validated.params
   - Extract: name, description, category, unitType, price from req.validated.body
   - Extract: orgId, deptId, callerId from req.user
   - Session: YES
   - Business Logic:
     - Find material in organization
     - Update material fields
     - Create notification
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Validates material exists in org
     - ✅ Updates fields
     - ✅ Creates notification
     - ✅ Emits events
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not using transaction
     - ❌ Not creating notification
   - Tests Required:
     - Unit test: Successful update
     - Unit test: Category/unit type validation
     - Unit test: Notification created
     - Integration test: Full update flow

   **5. deleteMaterial**

   - Extract: materialId from req.validated.params
   - Extract: orgId, deptId, callerId from req.user
   - Session: YES
   - Business Logic:
     - Find material in organization
     - Check for linked tasks (RoutineTask materials array)
     - Check for linked activities (TaskActivity materials array)
     - Require unlinking before deletion OR auto-unlink
     - Soft delete material
     - Create notifications
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Validates material exists in org
     - ✅ Checks for linked tasks
     - ✅ Checks for linked activities
     - ✅ Handles unlinking (throws error or auto-unlinks)
     - ✅ Soft deletes material
     - ✅ Creates notifications
     - ✅ Emits events
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not checking for linked tasks/activities
     - ❌ Allowing deletion with active links
     - ❌ Hard delete instead of soft delete
   - Tests Required:
     - Unit test: Successful deletion (no links)
     - Unit test: Deletion fails with linked tasks
     - Unit test: Deletion fails with linked activities
     - Unit test: Auto-unlinking works (if implemented)
     - Integration test: Full delete flow

   **6. restoreMaterial**

   - Extract: materialId from req.validated.params
   - Extract: orgId, deptId, callerId from req.user
   - Session: YES
   - Business Logic:
     - Find soft-deleted material
     - Validate department still exists
     - Restore material
     - Create notification
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Finds only deleted material
     - ✅ Validates department exists
     - ✅ Restores material
     - ✅ Creates notification
     - ✅ Emits events
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not checking department exists
     - ❌ Not using onlyDeleted query
   - Tests Required:
     - Unit test: Successful restore
     - Unit test: Cannot restore if dept deleted
     - Integration test: Full restore flow

   ***

   **For `backend/controllers/vendorControllers.js`:**

   **Controllers to Validate:**

   1. createVendor
   2. getAllVendors
   3. getVendor
   4. updateVendor
   5. deleteVendor
   6. restoreVendor

   **Logic to Extract:**

   **1. createVendor**

   - Extract: orgId, deptId, callerId from req.user
   - Extract: name, description, contactPerson, email, phone, address from req.validated.body
   - Session: YES
   - Business Logic:
     - Create vendor with org and dept references
     - Find HOD recipients in department
     - Create notifications for HODs
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Creates vendor with all fields
     - ✅ Sets org and dept references
     - ✅ Validates phone format (Ethiopian)
     - ✅ Finds HOD recipients
     - ✅ Creates notifications
     - ✅ Emits to department and recipients
     - ✅ Returns 201 status
   - Common Issues:
     - ❌ Not using transaction
     - ❌ Not validating phone format
     - ❌ Not creating notifications
   - Tests Required:
     - Unit test: Successful vendor creation
     - Unit test: Phone format validation
     - Unit test: Email validation
     - Unit test: Notifications created
     - Integration test: Full creation flow

   **2. getAllVendors**

   - Extract: orgId, deptId from req.user
   - Extract: page, limit, search, deleted, sortBy, sortOrder from req.validated.query
   - Session: NO
   - Business Logic:
     - Filter by organization and department
     - Apply search filter (name, contactPerson, email)
     - Use pagination plugin
     - Return vendors with pagination metadata
   - Validation Checks:
     - ✅ Filters by organization and department
     - ✅ Applies search filter
     - ✅ Uses deleted query param
     - ✅ Uses pagination plugin
     - ✅ Returns pagination metadata
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not filtering by organization/department
     - ❌ Not using pagination plugin
   - Tests Required:
     - Unit test: Filters work correctly
     - Unit test: Pagination works
     - Unit test: Search works
     - Integration test: Full list flow

   **3. getVendor**

   - Extract: vendorId from req.validated.params
   - Extract: orgId from req.user
   - Extract: includeProjects from req.validated.query
   - Session: NO
   - Business Logic:
     - Find vendor by ID
     - Validate vendor belongs to organization
     - Optionally include linked ProjectTasks
     - Return vendor details with stats
   - Validation Checks:
     - ✅ Finds vendor by ID
     - ✅ Validates organization match
     - ✅ Includes linked ProjectTasks if requested
     - ✅ Calculates project count
     - ✅ Returns 404 if not found
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not validating organization match
     - ❌ Not including linked projects
   - Tests Required:
     - Unit test: Successful vendor retrieval
     - Unit test: Vendor from different org returns 404
     - Unit test: Linked projects included
     - Integration test: Full get flow

   **4. updateVendor**

   - Extract: vendorId from req.validated.params
   - Extract: name, description, contactPerson, email, phone, address from req.validated.body
   - Extract: orgId, deptId, callerId from req.user
   - Session: YES
   - Business Logic:
     - Find vendor in organization
     - Update vendor fields
     - Create notification
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Validates vendor exists in org
     - ✅ Validates phone format if changing
     - ✅ Updates fields
     - ✅ Creates notification
     - ✅ Emits events
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not using transaction
     - ❌ Not validating phone format
   - Tests Required:
     - Unit test: Successful update
     - Unit test: Phone format validation
     - Unit test: Notification created
     - Integration test: Full update flow

   **5. deleteVendor**

   - Extract: vendorId from req.validated.params
   - Extract: orgId, deptId, callerId from req.user
   - Session: YES
   - Business Logic:
     - Find vendor in organization
     - Check for linked ProjectTasks
     - Require reassignment of ProjectTasks to another vendor
     - Soft delete vendor
     - Create notifications
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Validates vendor exists in org
     - ✅ Checks for linked ProjectTasks
     - ✅ Throws error if ProjectTasks exist (requires reassignment)
     - ✅ Soft deletes vendor
     - ✅ Creates notifications
     - ✅ Emits events
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not checking for linked ProjectTasks
     - ❌ Allowing deletion with active projects
     - ❌ Hard delete instead of soft delete
   - Tests Required:
     - Unit test: Successful deletion (no projects)
     - Unit test: Deletion fails with linked ProjectTasks
     - Unit test: Error message includes reassignment instruction
     - Integration test: Full delete flow

   **6. restoreVendor**

   - Extract: vendorId from req.validated.params
   - Extract: orgId, deptId, callerId from req.user
   - Session: YES
   - Business Logic:
     - Find soft-deleted vendor
     - Validate department still exists
     - Restore vendor
     - Create notification
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Finds only deleted vendor
     - ✅ Validates department exists
     - ✅ Restores vendor
     - ✅ Creates notification
     - ✅ Emits events
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not checking department exists
     - ❌ Not using onlyDeleted query
   - Tests Required:
     - Unit test: Successful restore
     - Unit test: Cannot restore if dept deleted
     - Integration test: Full restore flow

   ***

   **For `backend/controllers/attachmentControllers.js`:**

   **Controllers to Validate:**

   1. createAttachment
   2. getAllAttachments
   3. getAttachment
   4. updateAttachment
   5. deleteAttachment

   **Logic to Extract:**

   **1. createAttachment**

   - Extract: orgId, deptId, callerId from req.user
   - Extract: parent, parentModel, file from req.validated.body
   - Session: YES
   - Business Logic:
     - Validate parent exists (Task, TaskActivity, TaskComment)
     - Validate file type (Image, Video, Document, Audio, Other)
     - Validate file size limits
     - Check max 10 attachments per parent
     - Upload file to Cloudinary
     - Create attachment record
     - Create notification
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Validates parent exists
     - ✅ Validates file type
     - ✅ Validates file size (Image 10MB, Video 100MB, Document 25MB, Audio 20MB, Other 50MB)
     - ✅ Checks max 10 attachments per parent
     - ✅ Uploads to Cloudinary
     - ✅ Creates attachment record
     - ✅ Creates notification
     - ✅ Emits events
     - ✅ Returns 201 status
   - Common Issues:
     - ❌ Not validating parent
     - ❌ Not validating file type/size
     - ❌ Not checking max attachments
     - ❌ Not uploading to Cloudinary
   - Tests Required:
     - Unit test: Successful attachment creation
     - Unit test: File type validation
     - Unit test: File size validation
     - Unit test: Max 10 attachments enforced
     - Unit test: Cloudinary upload
     - Integration test: Full creation flow

   **2. getAllAttachments**

   - Extract: orgId from req.user
   - Extract: page, limit, parent, parentModel, fileType, deleted from req.validated.query
   - Session: NO
   - Business Logic:
     - Filter by organization
     - Filter by parent if provided
     - Filter by file type if provided
     - Use pagination plugin
     - Return attachments with pagination metadata
   - Validation Checks:
     - ✅ Filters by organization
     - ✅ Filters by parent if provided
     - ✅ Filters by file type if provided
     - ✅ Uses deleted query param
     - ✅ Uses pagination plugin
     - ✅ Returns pagination metadata
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not filtering by organization
     - ❌ Not using pagination plugin
   - Tests Required:
     - Unit test: Filters work correctly
     - Unit test: Pagination works
     - Integration test: Full list flow

   **3. getAttachment**

   - Extract: attachmentId from req.validated.params
   - Extract: orgId from req.user
   - Session: NO
   - Business Logic:
     - Find attachment by ID
     - Validate attachment belongs to organization
     - Populate references (parent, uploadedBy)
     - Return attachment details
   - Validation Checks:
     - ✅ Finds attachment by ID
     - ✅ Validates organization match
     - ✅ Populates references
     - ✅ Returns 404 if not found
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not validating organization match
     - ❌ Not populating references
   - Tests Required:
     - Unit test: Successful attachment retrieval
     - Unit test: Attachment from different org returns 404
     - Integration test: Full get flow

   **4. updateAttachment**

   - Extract: attachmentId from req.validated.params
   - Extract: filename from req.validated.body (metadata only, not file)
   - Extract: orgId, deptId, callerId from req.user
   - Session: YES
   - Business Logic:
     - Find attachment in organization
     - Update metadata only (filename)
     - Cannot change file itself
     - Create notification
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Validates attachment exists in org
     - ✅ Updates metadata only
     - ✅ Cannot change fileUrl or fileType
     - ✅ Creates notification
     - ✅ Emits events
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Allowing file change
     - ❌ Not using transaction
   - Tests Required:
     - Unit test: Successful metadata update
     - Unit test: Cannot change file
     - Integration test: Full update flow

   **5. deleteAttachment**

   - Extract: attachmentId from req.validated.params
   - Extract: orgId, deptId, callerId from req.user
   - Session: YES
   - Business Logic:
     - Find attachment in organization
     - Delete file from Cloudinary
     - Soft delete attachment record
     - Create notification
     - Emit socket events
   - Validation Checks:
     - ✅ Uses transaction
     - ✅ Validates attachment exists in org
     - ✅ Deletes from Cloudinary
     - ✅ Soft deletes record
     - ✅ Creates notification
     - ✅ Emits events
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not deleting from Cloudinary
     - ❌ Hard delete instead of soft delete
   - Tests Required:
     - Unit test: Successful deletion
     - Unit test: Cloudinary deletion
     - Integration test: Full delete flow

   ***

   **For `backend/controllers/notificationControllers.js`:**

   **Controllers to Validate:**

   1. getAllNotifications
   2. markNotificationRead
   3. getUnreadCount

   **Logic to Extract:**

   **1. getAllNotifications**

   - Extract: orgId, userId from req.user
   - Extract: page, limit, isRead, type from req.validated.query
   - Session: NO
   - Business Logic:
     - Filter by recipient (current user)
     - Filter by organization
     - Filter by read status if provided
     - Filter by type if provided
     - Use pagination plugin
     - Return notifications with pagination metadata
   - Validation Checks:
     - ✅ Filters by recipient (userId)
     - ✅ Filters by organization
     - ✅ Filters by read status if provided
     - ✅ Filters by type if provided
     - ✅ Uses pagination plugin
     - ✅ Returns pagination metadata
     - ✅ Sorts by createdAt desc (newest first)
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not filtering by recipient
     - ❌ Not filtering by organization
     - ❌ Not using pagination plugin
   - Tests Required:
     - Unit test: Only user's notifications returned
     - Unit test: Read status filter works
     - Unit test: Type filter works
     - Unit test: Pagination works
     - Integration test: Full list flow

   **2. markNotificationRead**

   - Extract: notificationId from req.validated.params
   - Extract: userId from req.user
   - Session: NO (simple update)
   - Business Logic:
     - Find notification by ID
     - Validate notification belongs to user
     - Update isRead to true
     - Return updated notification
   - Validation Checks:
     - ✅ Finds notification by ID
     - ✅ Validates recipient matches userId
     - ✅ Updates isRead to true
     - ✅ Returns 404 if not found
     - ✅ Returns 403 if not user's notification
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not validating recipient
     - ❌ Allowing marking other user's notifications
   - Tests Required:
     - Unit test: Successful mark as read
     - Unit test: Cannot mark other user's notification
     - Integration test: Full mark read flow

   **3. getUnreadCount**

   - Extract: orgId, userId from req.user
   - Session: NO
   - Business Logic:
     - Count unread notifications for user
     - Filter by recipient and isRead: false
     - Return count
   - Validation Checks:
     - ✅ Filters by recipient (userId)
     - ✅ Filters by organization
     - ✅ Filters by isRead: false
     - ✅ Returns count
     - ✅ Returns 200 status
   - Common Issues:
     - ❌ Not filtering by recipient
     - ❌ Not filtering by organization
   - Tests Required:
     - Unit test: Correct count returned
     - Unit test: Only unread counted
     - Integration test: Full count flow

   ***

4. **Action: Validate, Correct, Update, Enhance, Complete**

   For EACH controller function (59 total):

   **Step 1: Document Issues**

   - Read controller function completely
   - Extract all logic and patterns
   - Compare against specifications
   - Identify issues with WHAT, WHY, HOW
   - Categorize by severity (Critical, High, Medium, Low)

   **Step 2: Implement Corrections**

   - Use `strReplace` for targeted fixes
   - Ensure all universal patterns followed
   - Verify transaction handling correct
   - Confirm pagination used for lists
   - Validate soft delete used
   - Check cascade operations
   - Verify socket events emitted
   - Confirm notifications created

   **Step 3: Add/Update Tests**

   - Create unit tests for each function
   - Create integration tests for flows
   - Test all edge cases
   - Test error scenarios
   - Ensure 80%+ coverage

5. **Test: Run All Tests**

   ```bash
   cd backend
   npm test -- --runInBand backend/tests/unit/controllers/
   npm test -- --runInBand backend/tests/integration/controllers/
   ```

   **Validation Criteria**:

   - ✅ 100% of tests pass
   - ✅ 80%+ code coverage for each controller
   - ✅ No lint errors
   - ✅ All patterns validated

6. **Validate: Final Checks**

   - All 59 functions use asyncHandler
   - All write operations use transactions
   - All list operations use pagination
   - All delete operations are soft delete
   - All cascade operations work correctly
   - All socket events emitted
   - All notifications created
   - Multi-tenancy enforced everywhere
   - Department isolation enforced
   - Ownership checks present
   - Resource linking/unlinking works
   - Task type restrictions enforced
   - HOD rules enforced
   - Platform organization protected

7. **Merge: Complete Phase 5**

   ```bash
   git add .
   git commit -m "Phase 5: Validate and correct backend controllers

   - Validated all 9 controller files (59 functions total)
   - Corrected transaction handling in all write operations
   - Enhanced cascade delete/restore operations
   - Completed missing socket event emissions
   - Completed missing notification creation
   - Added resource linking/unlinking validation
   - Enforced task type restrictions
   - Enforced HOD rules for watchers
   - Protected platform organization from deletion
   - Added comprehensive controller tests (unit + integration)
   - Achieved 80%+ test coverage for all controllers"

   git checkout main
   git merge validate/phase-5-backend-controllers
   git push origin main
   git branch -d validate/phase-5-backend-controllers
   ```

8. **Update Phase Tracker**

   Update `docs/dev-phase-tracker.md`:

   ```markdown
   ## Phase 5: Backend Controllers ✅

   - [x] All 9 controller files validated and corrected
   - [x] All 59 functions validated
   - [x] authControllers.js (6 functions) - Complete
   - [x] userControllers.js (8 functions) - Complete
   - [x] organizationControllers.js (5 functions) - Complete
   - [x] departmentControllers.js (6 functions) - Complete
   - [x] taskControllers.js (18 functions) - Complete
   - [x] materialControllers.js (6 functions) - Complete
   - [x] vendorControllers.js (6 functions) - Complete
   - [x] attachmentControllers.js (5 functions) - Complete
   - [x] notificationControllers.js (3 functions) - Complete
   - [x] Universal patterns validated for all functions
   - [x] Transaction handling corrected
   - [x] Cascade operations validated
   - [x] Socket events validated
   - [x] Notifications validated
   - [x] Resource linking/unlinking validated
   - [x] Task type restrictions enforced
   - [x] HOD rules enforced
   - [x] Platform organization protection enforced
   - [x] Tests added and passing (100%)
   - [x] Coverage achieved (80%+)
   - [x] Branch merged to main
   ```

---

## PHASE 5 COMPLETION SUMMARY

**Total Controllers**: 9
**Total Functions**: 59

**Breakdown by Controller**:

1. authControllers.js: 6 functions
2. userControllers.js: 8 functions
3. organizationControllers.js: 5 functions
4. departmentControllers.js: 6 functions
5. taskControllers.js: 18 functions
6. materialControllers.js: 6 functions
7. vendorControllers.js: 6 functions
8. attachmentControllers.js: 5 functions
9. notificationControllers.js: 3 functions

**Universal Patterns Validated** (16 patterns × 59 functions = 944 validation points):

- A. Function Signature & Wrapper
- B. Data Extraction from req.user
- C. Data Extraction from req.validated
- D. Session Management for Write Operations
- E. Pagination for List Operations
- F. Soft Delete Plugin Utilities
- G. Cascade Delete Operations
- H. Cascade Restore Operations
- I. Resource Linking/Unlinking
- J. Multi-Tenancy Isolation
- K. Department Isolation
- L. Ownership Checks
- M. Socket.IO Event Emission
- N. Notification Creation
- O. Response Format
- P. Error Handling

**Critical Business Logic Validated**:

- HTTP-only cookies for JWT (auth)
- Token rotation (auth)
- Password reset token hashing (auth)
- isHod/isPlatformUser auto-set (user)
- Last SuperAdmin/HOD protection (user)
- Platform organization protection (organization)
- isPlatformOrg immutability (organization)
- Department name uniqueness (department)
- Task type restrictions (task)
- TaskActivity only for ProjectTask/AssignedTask (task)
- Comment max depth 3 (task)
- Watchers HOD only for ProjectTask (task)
- Material unlinking on delete (material)
- Vendor reassignment on delete (vendor)
- Cloudinary integration (attachment)
- File type/size validation (attachment)
- Recipient filtering (notification)

Phase 5 validation is now COMPLETE with comprehensive, detailed instructions for validating all 59 controller functions! 🚀
