# CORS Configuration Documentation

## Overview

This document describes the Cross-Origin Resource Sharing (CORS) configuration for the Multi-Tenant SaaS Task Manager backend. CORS is essential for allowing the frontend application to communicate with the backend API while maintaining security.

## Requirements Addressed

- **Requirement 19**: CORS configuration must align with allowed origins and support credentials
- **Requirement 160**: Check CORS configuration aligns with allowedOrigins.js
- **Requirements 191-200**: Origin validation, credentials, preflight caching, environment-specific origins, wildcard rejection

## Configuration Files

### 1. `backend/config/allowedOrigins.js`

Defines all allowed origins for cross-origin requests.

#### Environment Variables

| Variable          | Required         | Description                                              |
| ----------------- | ---------------- | -------------------------------------------------------- |
| `CLIENT_URL`      | Yes (production) | Primary frontend URL (e.g., `https://app.example.com`)   |
| `ALLOWED_ORIGINS` | No               | Comma-separated list of additional allowed origins       |
| `NODE_ENV`        | No               | Environment mode: `development`, `staging`, `production` |

#### Origin Categories

1. **Primary Frontend (CLIENT_URL)**

   - Purpose: Main application frontend
   - Always included when set
   - Example: `https://app.example.com`

2. **Development Origins** (NODE_ENV=development only)

   - `http://localhost:3000` - React CRA development server
   - `http://localhost:5173` - Vite development server
   - `http://127.0.0.1:3000` - Alternative localhost
   - `http://127.0.0.1:5173` - Alternative localhost for Vite

3. **Staging Origins** (NODE_ENV=staging)

   - Add staging URLs in `stagingOrigins` array
   - Example: `https://staging.example.com`

4. **Production Origins** (NODE_ENV=production)

   - Only CLIENT_URL and explicitly defined production origins
   - No development origins included

5. **Additional Origins (ALLOWED_ORIGINS env var)**
   - Custom origins from environment variable
   - Format: comma-separated URLs
   - Example: `https://admin.example.com,https://mobile.example.com`

### 2. `backend/config/corsOptions.js`

Configures CORS middleware options for Express and Socket.IO.

#### Configuration Options

| Option                 | Value                                    | Description                                 |
| ---------------------- | ---------------------------------------- | ------------------------------------------- |
| `credentials`          | `true`                                   | Enables cookie-based JWT authentication     |
| `methods`              | `GET, POST, PUT, PATCH, DELETE, OPTIONS` | Allowed HTTP methods                        |
| `maxAge`               | `86400` (24 hours)                       | Preflight cache duration in seconds         |
| `optionsSuccessStatus` | `200`                                    | Status code for successful OPTIONS requests |

#### Allowed Headers

- `Content-Type` - For JSON/form data
- `Authorization` - For Bearer token (if used alongside cookies)
- `X-Requested-With` - For AJAX requests
- `Accept` - Content negotiation
- `Origin` - CORS origin header
- `Cache-Control` - Cache control directives
- `X-Request-ID` - Request tracing

#### Exposed Headers

- `X-Request-ID` - Request tracing ID
- `X-RateLimit-Limit` - Rate limit info
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Rate limit reset time

## Security Features

### 1. No Wildcard Origins

Wildcard origins (`*` or `*.example.com`) are **rejected in all environments** for security:

```javascript
// This will be rejected:
ALLOWED_ORIGINS=*,https://app.example.com

// This will also be rejected:
ALLOWED_ORIGINS=https://*.example.com
```

### 2. Origin Validation Logging

All origin validation is logged for security monitoring:

- **Development**: Logs allowed and blocked origins with full details
- **Production**: Logs blocked origins only (error level)

### 3. Credentials Support

Credentials are enabled (`credentials: true`) to support:

- HTTP-only cookies for JWT tokens
- Secure authentication without exposing tokens in headers

### 4. Preflight Caching

Preflight responses are cached for 24 hours to reduce OPTIONS requests:

- Improves performance
- Reduces server load
- Standard browser behavior

## Usage

### Express Middleware

```javascript
import cors from "cors";
import corsOptions from "./config/corsOptions.js";

app.use(cors(corsOptions));
```

### Socket.IO

```javascript
import { getSocketCorsOptions } from "./config/corsOptions.js";

const io = new Server(httpServer, {
  cors: getSocketCorsOptions(),
});
```

### Validation on Startup

```javascript
import { validateCorsConfig } from "./config/corsOptions.js";

// Returns true if configuration is valid
const isValid = validateCorsConfig();
```

## Helper Functions

### `isOriginAllowed(origin)`

Check if an origin is in the allowed list:

```javascript
import { isOriginAllowed } from "./config/allowedOrigins.js";

if (isOriginAllowed("https://app.example.com")) {
  // Origin is allowed
}
```

### `getAllowedOrigins()`

Get a copy of all allowed origins:

```javascript
import { getAllowedOrigins } from "./config/allowedOrigins.js";

const origins = getAllowedOrigins();
console.log(origins); // ['https://app.example.com', ...]
```

## Environment-Specific Configuration

### Development

```env
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

Includes:

- CLIENT_URL
- All development origins (localhost:3000, localhost:5173, etc.)

### Staging

```env
NODE_ENV=staging
CLIENT_URL=https://staging.example.com
ALLOWED_ORIGINS=https://staging-admin.example.com
```

Includes:

- CLIENT_URL
- Staging origins
- Additional origins from ALLOWED_ORIGINS

### Production

```env
NODE_ENV=production
CLIENT_URL=https://app.example.com
ALLOWED_ORIGINS=https://admin.example.com,https://mobile.example.com
```

Includes:

- CLIENT_URL only
- Additional origins from ALLOWED_ORIGINS
- **No development origins**

## Troubleshooting

### CORS Error: Origin Not Allowed

1. Check if the origin is in the allowed list
2. Verify CLIENT_URL is set correctly
3. Check NODE_ENV matches expected environment
4. Look for trailing slashes (automatically removed)

### Preflight Request Failing

1. Verify the requested method is in ALLOWED_METHODS
2. Check if the requested header is in ALLOWED_HEADERS
3. Ensure credentials are enabled if sending cookies

### Cookies Not Being Sent

1. Verify `credentials: true` in CORS options
2. Check `withCredentials: true` in frontend requests
3. Ensure cookies have correct SameSite and Secure flags

## Testing

Run CORS tests:

```bash
cd backend
npm test -- --testPathPatterns="cors.test.js"
```

Tests cover:

- Origin validation (allowed and blocked)
- Credentials support
- Preflight caching
- Allowed methods and headers
- Environment-specific origins
- Wildcard rejection
- Helper functions

## Related Files

- `backend/config/allowedOrigins.js` - Origin list configuration
- `backend/config/corsOptions.js` - CORS middleware options
- `backend/app.js` - CORS middleware application
- `backend/tests/unit/cors.test.js` - CORS unit tests
