# Server Startup and Environment Configuration

> **Phase 1.1 - Task 5: Configuration - Server Startup and Environment**
>
> This document describes the server startup configuration for production readiness.

## Overview

The server startup process has been enhanced with:

1. **UTC Timezone Enforcement** - All dates stored and processed in UTC
2. **Environment Validation** - Comprehensive validation of all environment variables
3. **Structured Logging** - Winston-based logging with JSON format for production
4. **Graceful Shutdown** - Proper cleanup of HTTP, Socket.IO, and MongoDB connections
5. **Non-blocking Email Service** - Email initialization doesn't block server startup
6. **Development-only Seed Data** - Seed data only runs in development mode

## Timezone Configuration

### Why UTC?

As documented in `backend/docs/timezone-doc.md`, UTC is enforced globally to:

- Ensure consistent date/time handling across global users
- Prevent timezone confusion in database storage
- Enable proper date conversion at API boundaries

### Implementation

```javascript
// Set BEFORE any other imports in server.js
process.env.TZ = "UTC";

// Configure dayjs with UTC plugins
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("UTC");
```

### Verification

```javascript
// Server logs UTC time on startup
console.log(`Server time: ${new Date().toISOString()}`);
console.log(`Dayjs UTC: ${dayjs.utc().format()}`);
```

## Environment Variables

### Required Variables

| Variable             | Type   | Description                               |
| -------------------- | ------ | ----------------------------------------- |
| `NODE_ENV`           | enum   | Environment mode (development/production) |
| `PORT`               | port   | Server port number (1-65535)              |
| `APP_NAME`           | string | Application name for emails and logs      |
| `CLIENT_URL`         | url    | Frontend URL for CORS and email links     |
| `MONGODB_URI`        | string | MongoDB connection string                 |
| `JWT_ACCESS_SECRET`  | string | Secret for access tokens (min 32 chars)   |
| `JWT_REFRESH_SECRET` | string | Secret for refresh tokens (min 32 chars)  |
| `SMTP_HOST`          | string | SMTP server hostname                      |
| `SMTP_PORT`          | port   | SMTP server port                          |
| `SMTP_USER`          | email  | SMTP authentication email                 |
| `SMTP_PASS`          | string | SMTP authentication password              |

### Optional Variables

See `backend/utils/validateEnv.js` for complete list with defaults.

### Validation

Environment variables are validated on startup using `validateEnvironment()`:

```javascript
import validateEnvironment from "./utils/validateEnv.js";

// Validates all variables, exits on error
validateEnvironment({ exitOnError: true, logResults: true });
```

### Verification Script

Run the verification script to check all environment variables:

```bash
npm run verify:env
```

## Structured Logging

### Winston Configuration

The application uses Winston for structured logging:

- **Development**: Colorized, human-readable format
- **Production**: JSON format for machine parsing
- **File Logging**: Error and combined logs in production

### Log Levels

| Level | Description            | When to Use                    |
| ----- | ---------------------- | ------------------------------ |
| error | Error conditions       | Exceptions, failures           |
| warn  | Warning conditions     | Deprecations, potential issues |
| info  | Informational messages | Startup, shutdown, operations  |
| http  | HTTP request logs      | Request/response logging       |
| debug | Debug messages         | Development debugging          |

### Usage

```javascript
import logger from "./utils/logger.js";

// Standard logging
logger.info("Server started");
logger.error("Database connection failed", { error: err.message });

// Convenience methods with emojis (development)
import { logStartup, logDatabase, logError } from "./utils/logger.js";

logStartup("Server running on port 4000");
logDatabase("Connected to MongoDB");
logError("Connection failed", error);
```

### Request Correlation

Create a child logger with request ID for tracing:

```javascript
import { createRequestLogger } from "./utils/logger.js";

const reqLogger = createRequestLogger(req.id);
reqLogger.info("Processing request");
```

## Server Startup Sequence

1. **Set UTC Timezone** - `process.env.TZ = "UTC"`
2. **Validate Environment** - Check all required variables
3. **Parse PORT** - Validate port number (1-65535)
4. **Connect to MongoDB** - With retry logic
5. **Initialize Email Service** - Non-blocking, logs warning on failure
6. **Seed Database** - Development only, when `INITIALIZE_SEED_DATA=true`
7. **Start HTTP Server** - Listen on configured port
8. **Initialize Socket.IO** - After server is listening

## Graceful Shutdown

> **Requirements: 27, 172, 180**

The server handles shutdown signals (SIGINT, SIGTERM) gracefully to prevent data loss and connection leaks.

### Shutdown Sequence

1. **Stop Socket.IO** - Close all WebSocket connections first
2. **Stop HTTP Server** - Stop accepting new connections, wait for existing requests
3. **Close MongoDB** - Disconnect from database cleanly
4. **Log Queue Status** - Report pending emails in queue
5. **Exit Process** - Clean exit with code 0

### Signal Handlers

```javascript
// Registered in server.js
process.on("SIGINT", () => shutdown("SIGINT")); // Ctrl+C
process.on("SIGTERM", () => shutdown("SIGTERM")); // Docker/K8s termination
```

### Error Handlers

```javascript
// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logError("Uncaught Exception - shutting down", err);
  shutdown("UNCAUGHT_EXCEPTION");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", { promise, reason });
  shutdown("UNHANDLED_REJECTION");
});
```

### Timeout

Graceful shutdown has a 10-second timeout (`GRACEFUL_SHUTDOWN_TIMEOUT = 10000`). If cleanup takes longer, the process is forcefully terminated with exit code 1.

### Socket.IO Handling

The shutdown function safely handles the case where Socket.IO may not be initialized:

```javascript
try {
  const io = getIO();
  if (io) {
    await new Promise((resolve) => {
      io.close(() => resolve());
    });
  }
} catch (socketError) {
  // Socket.IO was never initialized - this is fine during early shutdown
  logSocket("Socket.IO was not initialized - skipping");
}
```

### Testing Graceful Shutdown

To test graceful shutdown locally:

```bash
# Start the server
npm run dev

# In another terminal, send SIGTERM
kill -SIGTERM <pid>

# Or use Ctrl+C for SIGINT
```

Expected log output:

```
🛑 Received SIGTERM. Starting graceful shutdown...
🔌 Closing Socket.IO connections...
🔌 Socket.IO server closed
🛑 Closing HTTP server...
🛑 HTTP server closed
💾 Closing MongoDB connection...
💾 MongoDB connection closed
🛑 Shutdown complete
```

## Email Service

### Non-blocking Initialization

Email service initialization is wrapped in try/catch to prevent blocking server startup:

```javascript
try {
  await emailService.initialize();
  logEmail("Email service initialized successfully");
} catch (emailError) {
  logger.warn("Email service initialization failed");
  logger.warn("Email notifications will be disabled");
}
```

### Queue Status

On shutdown, the email queue status is logged:

```javascript
const queueStatus = emailService.getQueueStatus();
if (queueStatus.queueLength > 0) {
  logger.warn(`${queueStatus.queueLength} emails remaining in queue`);
}
```

## Seed Data

### Development Only

Seed data only runs when:

1. `NODE_ENV=development`
2. `INITIALIZE_SEED_DATA=true`

### Production Safety

In production, even if `INITIALIZE_SEED_DATA=true`, seed data is NOT run:

```javascript
if (isProduction() && process.env.INITIALIZE_SEED_DATA === "true") {
  logger.warn("INITIALIZE_SEED_DATA is set to true in production - ignoring");
}
```

## Testing

### Environment Validation Tests

Tests are located in `backend/tests/unit/server.test.js`:

- PORT environment variable parsing
- NODE_ENV validation
- JWT secrets configuration
- Timezone support

### Running Tests

```bash
npm test -- --testPathPatterns="server.test"
```

## Requirements Satisfied

This configuration satisfies the following requirements:

- **Requirement 6.1**: Validate all required env vars on startup
- **Requirement 6.3**: Verify email service doesn't block startup
- **Requirement 6.4**: Confirm seed data only runs in development
- **Requirement 6.6**: Validate timezone is UTC globally
- **Requirement 6.11**: Add structured logging (Winston)
- **Requirement 6.12**: Validate PORT environment variable parsing
- **Requirement 23**: Environment validation on startup
- **Requirement 110**: UTC timezone configuration
- **Requirement 171**: Structured logging
- **Requirement 174**: Environment variable validation
- **Requirement 176**: Non-blocking email initialization
- **Requirement 181**: Seed data development-only
- **Requirement 182**: PORT validation

## Related Documentation

- [Timezone Documentation](./timezone-doc.md)
- [CORS Configuration](./cors-configuration.md)
- [Request Handling Configuration](./request-handling-configuration.md)
- [Health Check Configuration](./health-check-configuration.md)
