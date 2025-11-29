# Health Check Configuration

> **Phase 1.1 - Task 7: Configuration - Health Check**
>
> This document describes the health check endpoints for production readiness and Kubernetes orchestration.

## Overview

The application provides three health check endpoints:

1. **`/health`** - Main health check endpoint for monitoring
2. **`/ready`** - Kubernetes readiness probe
3. **`/live`** - Kubernetes liveness probe

## Endpoints

### Main Health Check (`/health`)

Returns comprehensive health status including database connection, timestamp, and uptime.

**Request:**

```http
GET /health
```

**Response (200 OK):**

```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "uptimeFormatted": "1h 0m 0s",
  "environment": "production",
  "database": {
    "status": "connected",
    "connected": true
  },
  "version": "1.0.0"
}
```

**Status Values:**

- `healthy` - Database connected, all systems operational
- `degraded` - Database disconnected or other issues

**Note:** Returns 200 even when degraded for monitoring tools that check response codes. Use `/ready` for strict health checks.

### Kubernetes Readiness Probe (`/ready`)

Returns 200 only when the service is ready to accept traffic. Used by Kubernetes to determine if a pod should receive traffic.

**Request:**

```http
GET /ready
```

**Response (200 OK - Ready):**

```json
{
  "success": true,
  "status": "ready",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": {
    "status": "connected",
    "connected": true
  }
}
```

**Response (503 Service Unavailable - Not Ready):**

```json
{
  "success": false,
  "status": "not_ready",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "reason": "Database not connected",
  "database": {
    "status": "disconnected",
    "connected": false
  }
}
```

### Kubernetes Liveness Probe (`/live`)

Returns 200 if the service is alive (process is running). Used by Kubernetes to determine if a pod should be restarted.

**Request:**

```http
GET /live
```

**Response (200 OK):**

```json
{
  "success": true,
  "status": "alive",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "pid": 12345,
  "memoryUsage": {
    "heapUsed": 50,
    "heapTotal": 100,
    "unit": "MB"
  }
}
```

**Note:** Liveness probe does NOT check database connection. If the process can respond, it's alive. Database issues are handled by the readiness probe.

## Kubernetes Configuration

### Example Deployment Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: task-manager-backend
spec:
  template:
    spec:
      containers:
        - name: backend
          image: task-manager-backend:latest
          ports:
            - containerPort: 4000
          livenessProbe:
            httpGet:
              path: /live
              port: 4000
            initialDelaySeconds: 10
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /ready
              port: 4000
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
```

### Probe Configuration Recommendations

| Probe     | Initial Delay | Period | Timeout | Failure Threshold |
| --------- | ------------- | ------ | ------- | ----------------- |
| Liveness  | 10s           | 10s    | 5s      | 3                 |
| Readiness | 5s            | 5s     | 3s      | 3                 |

## Implementation Details

### Database Status Detection

The health check uses Mongoose connection state to determine database status:

```javascript
const getDatabaseStatus = () => {
  const state = mongoose.connection.readyState;
  const stateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return {
    status: stateMap[state] || "unknown",
    readyState: state,
    isConnected: state === 1,
  };
};
```

### Uptime Calculation

Server uptime is calculated from the application start time:

```javascript
const serverStartTime = Date.now();

const getUptime = () => {
  return Math.floor((Date.now() - serverStartTime) / 1000);
};
```

### Uptime Formatting

Uptime is formatted into a human-readable string:

```javascript
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(" ");
}
```

## Rate Limiting

Health check endpoints are placed BEFORE rate limiting middleware to ensure they are always accessible:

```javascript
// Health check endpoints (before rate limiting)
app.get("/health", ...);
app.get("/ready", ...);
app.get("/live", ...);

// Rate limiting on all API routes (production only)
if (process.env.NODE_ENV === "production") {
  app.use("/api", apiLimiter);
}
```

## Testing

### Manual Testing

```bash
# Test health endpoint
curl http://localhost:4000/health

# Test readiness probe
curl http://localhost:4000/ready

# Test liveness probe
curl http://localhost:4000/live
```

### Automated Tests

Tests are located in `backend/tests/unit/app.test.js`:

```bash
npm test -- --testPathPatterns="app.test" --testNamePattern="Health Check|Readiness|Liveness"
```

## Requirements Satisfied

This configuration satisfies the following requirements:

- **Requirement 26**: Health check endpoint implemented
- **Requirement 177**: Health check for database connection status
- **Requirement 179**: Readiness/liveness probes for K8s
- **Requirement 307**: Health check routes added

## Related Documentation

- [Server Startup Configuration](./server-startup-configuration.md)
- [CORS Configuration](./cors-configuration.md)
- [Request Handling Configuration](./request-handling-configuration.md)
