# ObjectId Naming Conventions & Development Guidelines

## CRITICAL: ObjectId Naming Rules

These naming conventions **MUST** be followed throughout the entire codebase:

### 1. Schema/Model Definitions (Mongoose)
**NO "Id" suffix on reference fields**

```javascript
// ✅ CORRECT
const userSchema = new Schema({
  organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
  department: { type: Schema.Types.ObjectId, ref: 'Department' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  assignees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  watchers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  materials: [{ type: Schema.Types.ObjectId, ref: 'Material' }],
});

// ❌ WRONG
const userSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },  // NO!
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },      // NO!
  createdById: { type: Schema.Types.ObjectId, ref: 'User' },             // NO!
});
```

### 2. Accessing via `req.user` (Authenticated User)
**Use schema field names without "Id" suffix**

```javascript
// ✅ CORRECT
const organizationId = req.user.organization  // ObjectId
const departmentId = req.user.department      // ObjectId

// If populated (Phase 3+):
const orgName = req.user.organization.name
const deptName = req.user.department.name

// ❌ WRONG
const organizationId = req.user.organizationId  // NO! doesn't exist
const departmentId = req.user.departmentId      // NO! doesn't exist
```

### 3. Request Parameters (req.body, req.query, req.params)
**WITH "Id" suffix for singular, "Ids" suffix for plural**

```javascript
// ✅ CORRECT - Request body/params/query
router.get('/tasks/:taskId', ...)
router.post('/users', validate({ body: { departmentId: '...' } }))
router.post('/tasks', validate({
  body: {
    assigneeIds: [...],   // Array = plural "Ids"
    watcherIds: [...],    // Array = plural "Ids"
    materialIds: [...],   // Array = plural "Ids"
  }
}))

// Backend receives:
const { taskId } = req.params           // Singular with Id
const { departmentId } = req.body       // Singular with Id
const { assigneeIds } = req.body        // Plural with Ids

// ❌ WRONG
const { task } = req.params             // NO! Use taskId
const { department } = req.body         // NO! Use departmentId
const { assignees } = req.body          // NO! Use assigneeIds
```

### 4. Query Filters (Controllers)
**Use schema field names when building queries**

```javascript
// ✅ CORRECT
const filter = {
  organization: req.user.organization,  // Schema field name
  department: req.user.department,      // Schema field name
};

const tasks = await Task.find(filter);

// ❌ WRONG
const filter = {
  organizationId: req.user.organization,  // NO! Wrong field name
};
```

### 5. Summary Table

| Context | Field Type | Naming Convention | Example |
|---------|-----------|-------------------|---------|
| **Mongoose Schema** | Single ref | No "Id" suffix | `organization`, `department`, `createdBy` |
| **Mongoose Schema** | Array refs | No "Ids" suffix (plural name) | `assignees`, `watchers`, `materials` |
| **req.user** (JWT payload) | ObjectId | No "Id" suffix | `req.user.organization`, `req.user.department` |
| **req.params** | ObjectId | With "Id" suffix | `req.params.taskId`, `req.params.userId` |
| **req.body** (singular) | ObjectId | With "Id" suffix | `req.body.departmentId`, `req.body.organizationId` |
| **req.body** (array) | ObjectId[] | With "Ids" suffix | `req.body.assigneeIds`, `req.body.materialIds` |
| **req.query** | ObjectId | With "Id" suffix | `req.query.departmentId` |
| **Query filters** | ObjectId | No "Id" suffix (matches schema) | `{ organization: req.user.organization }` |

---

## Development Guidelines

### Always Reference Steering Documents

When implementing features, **always** consult the steering documents in `.kiro/steering/`:

1. **`product.md`** - Business domain, roles, permissions, business rules
2. **`structure.md`** - Architecture, file structure, data flow, patterns
3. **`tech.md`** - Technology stack, versions, configurations
4. **`backend-api.md`** - API specifications, endpoints, response formats
5. **`backend-models.md`** - Mongoose models, schemas, relationships, cascade rules

**Process**:
- Check `task.md` for what to implement
- Check `implementation_plan.md` for how to implement
- **Always** cross-reference steering docs for requirements, patterns, and validation rules

### Scoping Pattern

Most resources are scoped to organization and department:

```javascript
// ✅ Organization scoping (from req.user)
const filter = {
  organization: req.user.organization,  // Always from req.user
};

// ✅ Department scoping (from req.user)
const filter = {
  organization: req.user.organization,
  department: req.user.department,      // Always from req.user
};

// ⚠️ Rare case: OrganizationId from frontend (e.g., platform admin creating customer org)
const { organizationId } = req.body;  // Only when explicitly sent from frontend
```

**Key Point**: 99% of the time, organization and department come from `req.user`, NOT from request parameters.

---

## JWT Payload Structure

The JWT access token payload contains:

```javascript
{
  userId: user._id,              // User's ObjectId
  email: user.email,             // User's email
  role: user.role,               // User's role (SuperAdmin, Admin, Manager, User)
  organization: user.organization,  // Organization ObjectId (NO Id suffix)
  department: user.department,      // Department ObjectId (NO Id suffix)
  isPlatformUser: user.isPlatformUser,  // Boolean
  iat: ...,                      // Issued at
  exp: ...,                      // Expires at
}
```

When `req.user` is populated from JWT, it contains these exact fields.

---

## Examples from Phase 2

### JWT Token Generation
```javascript
const payload = {
  userId: user._id,
  email: user.email,
  role: user.role,
  organization: user.organization,  // ✅ No Id suffix
  department: user.department,      // ✅ No Id suffix
  isPlatformUser: user.isPlatformUser,
};
```

### Authentication Middleware
```javascript
req.user = {
  userId: decoded.userId,
  email: decoded.email,
  role: decoded.role,
  organization: decoded.organization,  // ✅ ObjectId
  department: decoded.department,      // ✅ ObjectId
  isPlatformUser: decoded.isPlatformUser,
};
```

### Authorization Middleware
```javascript
// Extract from req.user
const { organization, department } = req.user;  // ✅ No Id suffix

// Build filter
const filter = {
  organization: organization,  // ✅ Matches schema field
  department: department,      // ✅ Matches schema field
};
```

### Controller (Route Parameter)
```javascript
// Route definition
router.get('/tasks/:taskId', ...)

// Controller
const { taskId } = req.params;  // ✅ With Id suffix (from frontend)
const task = await Task.findById(taskId);

// Scope check
if (task.organization.toString() !== req.user.organization.toString()) {
  throw CustomError.forbidden();
}
```

---

## Validation

When using express-validator:

```javascript
// ✅ CORRECT - Validate request params with Id suffix
body('departmentId')
  .trim()
  .notEmpty()
  .isMongoId(),

body('assigneeIds')
  .isArray()
  .custom((arr) => arr.every(id => isValidObjectId(id))),

// In controller, map to schema fields:
const department = departmentId;  // Remove Id suffix for query
const assignees = assigneeIds;    // Remove Ids suffix for query
```

---

## Testing

When writing tests:

```javascript
const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  role: 'Admin',
  organization: '507f1f77bcf86cd799439012',  // ✅ No Id suffix
  department: '507f1f77bcf86cd799439013',    // ✅ No Id suffix
  isPlatformUser: false,
};

const token = generateAccessToken(mockUser);
const decoded = decodeToken(token);

expect(decoded.organization).toBe(mockUser.organization);  // ✅ No Id suffix
expect(decoded.department).toBe(mockUser.department);      // ✅ No Id suffix
```
