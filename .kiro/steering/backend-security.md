---
inclusion: always
---

# Backend Security Documentation

Complete documentation of authentication, authorization, and security mechanisms.

## Critical Security Rules

- **JWT Tokens**: HTTP-only cookies, never in headers or localStorage
- **Password Hashing**: bcrypt with ≥12 salt rounds
- **Authorization Matrix**: ONLY source of truth for permissions
- **Input Sanitization**: NoSQL injection prevention on all inputs
- **Rate Limiting**: Production-only, per-IP tracking
- **CORS**: No wildcard origins in production
- **Security Headers**: Helmet with CSP, HSTS, X-Frame-Options
- **HTTPS**: Required in production (enforced by cookies and HSTS)

## Authentication

### JWT Token System

**Access Token**:

- **Expiry**: 15 minutes
- **Secret**: `process.env.JWT_ACCESS_SECRET`
- **Storage**: HTTP-only cookie named `access_token`
- **Purpose**: Short-lived token for API requests

**Refresh Token**:

- **Expiry**: 7 days
- **Secret**: `process.env.JWT_REFRESH_SECRET`
- **Storage**: HTTP-only cookie named `refresh_token`
- **Purpose**: Long-lived token for refreshing access tokens
- **Rotation**: New refresh token issued on each refresh

### Cookie Configuration

```javascript
{
  httpOnly: true,              // Prevents JavaScript access
  secure: isProduction,        // HTTPS only in production
  sameSite: 'strict',          // CSRF protection
  maxAge: 15 * 60 * 1000,      // 15 minutes (access token)
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days (refresh token)
}
```

**Security Features**:

- `httpOnly`: Prevents XSS attacks (JavaScript cannot access)
- `secure`: HTTPS-only in production
- `sameSite: 'strict'`: Prevents CSRF attacks
- No token in localStorage or sessionStorage

### Authentication Flow

**Login** (`POST /api/auth/login`):

1. User submits email and password
2. Find user by email (including soft-deleted check)
3. Compare password with bcrypt hash
4. Check if user is soft-deleted
5. Generate access and refresh tokens
6. Set HTTP-only cookies
7. Update user status to 'Online'
8. Return user data (password excluded)

**Refresh** (`GET /api/auth/refresh-token`):

1. Extract refresh token from cookie
2. Verify refresh token with JWT
3. Find user by ID from token
4. Generate new access and refresh tokens (rotation)
5. Set new HTTP-only cookies
6. Return user data

**Logout** (`DELETE /api/auth/logout`):

1. Verify refresh token from cookie
2. Clear both cookies (access_token, refresh_token)
3. Update user status to 'Offline'
4. Disconnect Socket.IO connection

### Authentication Middleware

**File**: `middlewares/authMiddleware.js`

**verifyJWT**:

```javascript
// Extract token from cookie
const token = req.cookies.access_token;

// Verify token
const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

// Find user
const user = await User.findById(decoded.userId);

// Attach user to request
req.user = user;
```

**verifyRefresh_token**:

```javascript
// Extract refresh token from cookie
const token = req.cookies.refresh_token;

// Verify token
const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

// Find user
const user = await User.findById(decoded.userId);

// Attach user to request
req.user = user;
```

### Password Security

**Hashing** (bcrypt):

```javascript
// Hash password on user creation/update
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12); // 12 salt rounds
  }
  next();
});
```

**Comparison**:

```javascript
// Compare entered password with hash
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
```

**Requirements**:

- Minimum 8 characters
- Bcrypt with ≥12 salt rounds
- Never stored in plain text
- Never returned in API responses (select: false)

### Password Reset

**Request Reset** (`POST /api/auth/forgot-password`):

1. User submits email
2. Generate random reset token
3. Hash token with bcrypt (10 rounds)
4. Store hashed token in user document
5. Set expiry (1 hour)
6. Send reset email with unhashed token
7. Always return success (prevents email enumeration)

**Reset Password** (`POST /api/auth/reset-password`):

1. User submits token and new password
2. Find user with valid, non-expired reset token
3. Compare submitted token with hashed token
4. Hash new password with bcrypt (12 rounds)
5. Update user password
6. Clear reset token fields
7. Send confirmation email

## Authorization

### Authorization Matrix

**File**: `config/authorizationMatrix.json`

**Purpose**: Define role-based permissions for all resources

**Structure**:

```json
{
  "Resource": {
    "Role": {
      "operation": ["scope1", "scope2"]
    }
  }
}
```

**Roles** (descending privileges):

1. **SuperAdmin**: Full access within organization (cross-org for platform)
2. **Admin**: Full access within organization
3. **Manager**: Limited access within department
4. **User**: Basic access within department

**Operations**:

- `create`: Create new resources
- `read`: View resources
- `update`: Modify resources
- `delete`: Soft delete resources

**Scopes**:

- `own`: User's own resources only
- `ownDept`: Resources in user's department
- `crossDept`: Resources across departments in organization
- `crossOrg`: Resources across organizations (platform SuperAdmin only)

**Example**:

```json
{
  "User": {
    "SuperAdmin": {
      "create": ["ownDept", "crossDept"],
      "read": ["ownDept", "crossDept"],
      "update": ["ownDept", "crossDept"],
      "delete": ["ownDept", "crossDept"]
    },
    "Admin": {
      "create": ["ownDept", "crossDept"],
      "read": ["ownDept", "crossDept"],
      "update": ["ownDept", "crossDept"],
      "delete": ["ownDept", "crossDept"]
    },
    "Manager": {
      "create": ["ownDept"],
      "read": ["ownDept"],
      "update": ["own"],
      "delete": []
    },
    "User": {
      "create": [],
      "read": ["ownDept"],
      "update": ["own"],
      "delete": []
    }
  }
}
```

### Authorization Middleware

**File**: `middlewares/authorization.js`

**authorize(resource, operation)**:

```javascript
export const authorize = (resource, operation) => {
  return async (req, res, next) => {
    const { user } = req;
    const { role, organizationId, departmentId, isPlatformUser } = user;

    // Get allowed scopes from matrix
    const allowedScopes = getAllowedScopes(role, resource, operation);

    if (!allowedScopes || allowedScopes.length === 0) {
      throw CustomError.forbidden("Insufficient permissions");
    }

    // Determine scope of request
    const requestScope = determineRequestScope(req, user);

    // Check if user has permission for this scope
    if (!allowedScopes.includes(requestScope)) {
      throw CustomError.forbidden("Insufficient permissions for this scope");
    }

    // Attach authorization info to request
    req.authorization = {
      allowedScopes,
      requestScope,
    };

    next();
  };
};
```

### Ownership Verification

**Ownership Fields by Resource**:

- **User**: `_id` (self), `createdBy` (creator)
- **Task**: `createdBy` (creator)
- **Activity**: `createdBy` (creator)
- **Comment**: `createdBy` (creator)
- **Material**: `addedBy` (creator)
- **Vendor**: `createdBy` (creator)
- **Attachment**: `uploadedBy` (uploader)
- **Notification**: `recipient` (recipient)

**Ownership Check**:

```javascript
// Check if user owns the resource
const isOwner = resource.createdBy.toString() === user._id.toString();

// Check if resource is in user's department
const isSameDept =
  resource.departmentId.toString() === user.departmentId.toString();

// Check if resource is in user's organization
const isSameOrg =
  resource.organizationId.toString() === user.organizationId.toString();
```

### Platform vs Customer Organization

**Platform Organization**:

- Identified by `isPlatformOrg: true`
- Only one platform organization exists
- Platform SuperAdmins can view/manage all organizations

**Platform User**:

- Identified by `isPlatformUser: true`
- Automatically set based on organization's `isPlatformOrg` flag
- Platform SuperAdmins have `crossOrg` scope

**Customer Organization**:

- Regular tenant organizations
- `isPlatformOrg: false`
- Cannot access other organizations
- SuperAdmins have `crossDept` scope within organization

**Access Rules**:

```javascript
// Platform SuperAdmin can access all organizations
if (user.isPlatformUser && user.role === "SuperAdmin") {
  // crossOrg scope allowed
}

// Customer SuperAdmin can access all departments in organization
if (!user.isPlatformUser && user.role === "SuperAdmin") {
  // crossDept scope allowed within organization
}

// Admin can access all departments in organization
if (user.role === "Admin") {
  // crossDept scope allowed within organization
}

// Manager can access own department only
if (user.role === "Manager") {
  // ownDept scope only
}

// User can access own department only
if (user.role === "User") {
  // ownDept scope only
}
```

## Security Measures

### Rate Limiting

**File**: `middlewares/rateLimiter.js`

**Production Only**: Rate limiting is disabled in development

**General API Limiter**:

```javascript
{
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: "Too many requests, please try again later",
  standardHeaders: true,      // Return rate limit info in headers
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => req.ip  // Track by IP address
}
```

**Auth Endpoints Limiter**:

```javascript
{
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 requests per window
  message: "Too many authentication attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => req.ip
}
```

**Headers**:

- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets

**Endpoints with Stricter Limits**:

- `POST /api/auth/login` - 5/15min
- `POST /api/auth/register` - 5/15min
- `POST /api/auth/forgot-password` - 5/15min
- `POST /api/auth/reset-password` - 5/15min
- `GET /api/auth/refresh-token` - 5/15min
- `DELETE /api/auth/logout` - 5/15min

### Input Sanitization

**NoSQL Injection Prevention**:

```javascript
import mongoSanitize from "express-mongo-sanitize";

// Remove $ and . from user input
app.use(mongoSanitize());
```

**Prevents**:

```javascript
// Malicious input
{ "email": { "$gt": "" } }  // Bypasses authentication

// Sanitized to
{ "email": "" }  // Safe
```

**Validation**:

- All inputs validated with `express-validator`
- Field types enforced (string, number, boolean, ObjectId)
- Length limits enforced
- Enum values enforced
- Custom validators for complex rules

### Security Headers (Helmet)

**File**: `app.js`

**Content Security Policy (CSP)**:

```javascript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
    connectSrc: ["'self'", "wss:", "https://api.cloudinary.com", "https://res.cloudinary.com"],
    fontSrc: ["'self'", "data:"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'", "https://res.cloudinary.com"],
    frameSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: []
  }
}
```

**HTTP Strict Transport Security (HSTS)**:

```javascript
hsts: {
  maxAge: 31536000,        // 1 year
  includeSubDomains: true,
  preload: true
}
```

**Other Headers**:

- `X-Frame-Options: deny` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - Browser XSS filter
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-DNS-Prefetch-Control: off`
- `X-Download-Options: noopen` (IE)
- `X-Permitted-Cross-Domain-Policies: none`
- Hide `X-Powered-By` header

### CORS Configuration

**File**: `config/corsOptions.js`

**Origin Validation**:

```javascript
origin: (origin, callback) => {
  // Allow requests with no origin (same-origin, server-to-server)
  if (!origin) {
    callback(null, true);
    return;
  }

  // Check if origin is in allowed list
  if (isOriginAllowed(origin)) {
    callback(null, true);
    return;
  }

  // Reject origin
  callback(new Error(`CORS policy: Origin '${origin}' is not allowed`), false);
};
```

**Configuration**:

```javascript
{
  origin: validateOrigin,
  credentials: true,                    // Enable cookies
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["X-Request-ID", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
  maxAge: 86400,                        // 24 hours preflight cache
  optionsSuccessStatus: 200,
  preflightContinue: false
}
```

**Allowed Origins**:

- Development: `http://localhost:3000`, `http://localhost:5173`
- Production: `process.env.CLIENT_URL` + `process.env.ALLOWED_ORIGINS`
- **NO wildcards** in production

### Brute-Force Protection

**Rate Limiting**: 5 attempts per 15 minutes on auth endpoints

**Account Lockout**: Not implemented (use rate limiting instead)

**Password Policies**:

- Minimum 8 characters
- No maximum length (bcrypt handles long passwords)
- No complexity requirements (length is more important)

### XSS Prevention

**HTTP-only Cookies**: Tokens not accessible to JavaScript

**Input Sanitization**: All inputs validated and sanitized

**Output Encoding**: Mongoose automatically escapes data

**CSP Headers**: Restrict script sources

### CSRF Protection

**SameSite Cookies**: `sameSite: 'strict'` prevents CSRF

**No CSRF Tokens**: Not needed with SameSite cookies

**Origin Validation**: CORS validates request origin

## Security Checklist

### Production Security Requirements

**Authentication**:

- [x] JWT tokens in HTTP-only cookies
- [x] Access token: 15 minutes expiry
- [x] Refresh token: 7 days expiry with rotation
- [x] Password hashing with bcrypt (≥12 salt rounds)
- [x] Password reset with hashed tokens (1 hour expiry)
- [x] Secure cookie settings (httpOnly, secure, sameSite)

**Authorization**:

- [x] Authorization matrix for all resources
- [x] Role-based access control (4 roles)
- [x] Scope-based permissions (own, ownDept, crossDept, crossOrg)
- [x] Ownership verification
- [x] Platform vs customer organization rules

**Input Validation**:

- [x] express-validator on all endpoints
- [x] NoSQL injection prevention (mongoSanitize)
- [x] Field type validation
- [x] Length limits enforced
- [x] Enum values enforced
- [x] Custom validators for complex rules

**Rate Limiting**:

- [x] General API: 100 requests per 15 minutes
- [x] Auth endpoints: 5 requests per 15 minutes
- [x] Per-IP tracking
- [x] Production-only (disabled in development)

**Security Headers**:

- [x] Helmet with CSP
- [x] HSTS (1 year, includeSubDomains, preload)
- [x] X-Frame-Options: deny
- [x] X-Content-Type-Options: nosniff
- [x] X-XSS-Protection: enabled
- [x] Referrer-Policy: strict-origin-when-cross-origin
- [x] Hide X-Powered-By

**CORS**:

- [x] Origin validation with logging
- [x] Credentials enabled
- [x] No wildcard origins in production
- [x] Preflight caching (24 hours)
- [x] Allowed methods: GET, POST, PUT, PATCH, DELETE
- [x] Exposed headers for rate limit info

**Data Protection**:

- [x] Soft delete for all resources
- [x] TTL for auto-cleanup
- [x] Cascade delete with transactions
- [x] Multi-tenancy isolation
- [x] Password never in API responses (select: false)

**HTTPS**:

- [x] Enforced in production (secure cookies)
- [x] HSTS header
- [x] Upgrade insecure requests (CSP)

**Logging**:

- [x] Winston structured logging
- [x] Error logs separate file
- [x] Request ID for tracing
- [x] Security events logged

**Environment**:

- [x] Environment variables for secrets
- [x] No secrets in code
- [x] Environment validation on startup
- [x] Different configs for dev/prod

### Vulnerability Scanning

**npm audit**:

```bash
cd backend
npm audit
npm audit fix
```

**Dependency Management**:

- Regular updates for security patches
- Review dependency changes
- Use exact versions in production

### Secret Management

**Environment Variables**:

- `JWT_ACCESS_SECRET` - Access token secret (min 32 chars)
- `JWT_REFRESH_SECRET` - Refresh token secret (min 32 chars)
- `MONGODB_URI` - Database connection string
- `EMAIL_PASSWORD` - Gmail app password
- `CLIENT_URL` - Frontend URL for CORS

**Best Practices**:

- Never commit `.env` files
- Use different secrets for dev/prod
- Rotate secrets periodically
- Use strong, random secrets (min 32 characters)

### Production Hardening

**Server Configuration**:

- Run as non-root user
- Disable directory listing
- Remove unnecessary services
- Keep OS and packages updated

**MongoDB**:

- Enable authentication
- Use strong passwords
- Limit network access
- Enable audit logging
- Regular backups

**Node.js**:

- Use LTS version
- Set `NODE_ENV=production`
- Enable cluster mode for multiple cores
- Use process manager (PM2, systemd)

**Monitoring**:

- Log all security events
- Monitor failed login attempts
- Track rate limit violations
- Alert on suspicious activity

## File Coverage

This documentation covers all security-related backend files:

**Configuration** (4 files):

- `config/allowedOrigins.js` - CORS origin management
- `config/corsOptions.js` - CORS configuration
- `config/authorizationMatrix.json` - Permission matrix
- `config/db.js` - MongoDB connection

**Middleware** (3 files):

- `middlewares/authMiddleware.js` - JWT verification
- `middlewares/authorization.js` - Role-based authorization
- `middlewares/rateLimiter.js` - Rate limiting

**Utilities** (3 files):

- `utils/generateTokens.js` - JWT token generation
- `utils/authorizationMatrix.js` - Authorization helpers
- `utils/validateEnv.js` - Environment validation

**Error Handling** (2 files):

- `errorHandler/CustomError.js` - Custom error class
- `errorHandler/ErrorController.js` - Global error handler

**Entry Points** (2 files):

- `app.js` - Security middleware configuration
- `server.js` - Server startup with security

**Total**: 14 security-related files documented
