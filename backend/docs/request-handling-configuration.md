# Request Handling Configuration

> **Phase 1.1 - Task 3: Configuration - Request Handling**
>
> This document describes the request handling configuration for production readiness.

## Overview

The Express application is configured with production-ready request handling including payload limits, request tracing, response compression, and API versioning.

## Configuration Details

### 1. Request Payload Limits (10MB)

**Location:** `backend/app.js`

```javascript
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
```

**Purpose:**

- Prevents denial-of-service attacks from oversized payloads
- Supports file uploads and large data submissions (up to 10MB)
- Applies to both JSON and URL-encoded request bodies

**Behavior:**

- Requests exceeding 10MB will receive HTTP 413 (Payload Too Large) error
- Limit applies per-request, not cumulative

### 2. Request ID Middleware (Tracing)

**Location:** `backend/app.js`

```javascript
import { randomUUID } from "crypto";

app.use((req, res, next) => {
  req.id = randomUUID();
  res.setHeader("X-Request-ID", req.id);
  next();
});
```

**Purpose:**

- Enables request tracing across distributed systems
- Facilitates debugging and log correlation
- Provides unique identifier for each request

**Behavior:**

- Generates UUID v4 for each incoming request
- Attaches ID to `req.id` for use in controllers/middleware
- Returns ID in `X-Request-ID` response header
- Each request receives a unique ID (no duplicates)

**Usage in Logging:**

```javascript
// In controllers or middleware
console.log(`[${req.id}] Processing request...`);
```

### 3. Compression Threshold (1KB)

**Location:** `backend/app.js`

```javascript
import compression from "compression";

app.use(compression({ threshold: 1024 }));
```

**Purpose:**

- Reduces bandwidth usage for large responses
- Improves response times for clients
- Optimizes network transfer

**Behavior:**

- Responses smaller than 1KB (1024 bytes) are NOT compressed
- Responses 1KB or larger are compressed using gzip
- Compression is automatic based on `Accept-Encoding` header
- Small responses skip compression to avoid overhead

**Configuration:**
| Setting | Value | Description |
|---------|-------|-------------|
| threshold | 1024 | Minimum response size in bytes to compress |
| filter | default | Compresses based on Content-Type |
| level | default (-1) | Compression level (zlib default) |

### 4. API Versioning

**Location:** `backend/app.js` and `backend/routes/index.js`

```javascript
// app.js
app.use("/api", routes);

// routes/index.js
router.use("/auth", AuthRoutes);
router.use("/organizations", OrganizationRoutes);
router.use("/departments", DepartmentRoutes);
router.use("/users", UserRoutes);
router.use("/tasks", TaskRoutes);
router.use("/vendors", VendorRoutes);
router.use("/materials", MaterialRoutes);
router.use("/notifications", NotificationRoutes);
router.use("/attachments", AttachmentRoutes);
```

**Purpose:**

- Provides consistent API path structure
- Enables future API versioning (e.g., `/api/v2/`)
- Separates API routes from static file serving

**Available Endpoints:**
| Route | Description |
|-------|-------------|
| `/api/auth/*` | Authentication endpoints |
| `/api/organizations/*` | Organization management |
| `/api/departments/*` | Department management |
| `/api/users/*` | User management |
| `/api/tasks/*` | Task management |
| `/api/vendors/*` | Vendor management |
| `/api/materials/*` | Material management |
| `/api/notifications/*` | Notification management |
| `/api/attachments/*` | Attachment management |

## Middleware Order

The request handling middleware is applied in the following order:

1. `helmet()` - Security headers
2. `cors()` - CORS handling
3. `cookieParser()` - Cookie parsing
4. `express.json()` - JSON body parsing with 10MB limit
5. `express.urlencoded()` - URL-encoded body parsing with 10MB limit
6. `mongoSanitize()` - NoSQL injection prevention
7. `compression()` - Response compression with 1KB threshold
8. **Request ID middleware** - UUID generation and header setting
9. `morgan()` - HTTP logging (development only)
10. Routes - API endpoints

## Testing

Tests are located in `backend/tests/unit/app.test.js`:

### Request Size Limits Tests

- Verifies JSON payloads up to 10MB are accepted
- Verifies URL-encoded payloads up to 10MB are accepted
- Confirms payloads exceeding limit return 413 error

### Request ID Middleware Tests

- Verifies unique UUID is generated for each request
- Confirms `X-Request-ID` header is present in responses
- Validates UUID format (RFC 4122 compliant)

### Compression Tests

- Verifies compression middleware is configured
- Confirms responses below 1KB threshold are not compressed
- Validates gzip compression for large responses

## Requirements Satisfied

This configuration satisfies the following requirements:

- **Requirement 5.1**: 10MB request payload limits for production
- **Requirement 5.3**: Request ID middleware for tracing
- **Requirement 5.4**: Compression threshold (1KB)
- **Requirement 5.5**: API versioning in route paths (/api/\*)

## Related Documentation

- [CORS Configuration](./cors-configuration.md)
- [Codebase Requirements](./codebase-requirements.md)
