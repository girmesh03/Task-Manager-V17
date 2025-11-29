> **Phase 1.1 - Task 8: Configuration - MongoDB Connection**
>
> This document describes the MongoDB connection configuration for production readiness.

## Overview

The MongoDB connection layer has been enhanced to meet production requirements for:

1. **Connection Pooling** – Efficient reuse of connections with bounded pool sizes
2. **Timeouts** – Predictable behaviour when the cluster is unavailable or slow
3. **Retry Logic** – Exponential backoff with a bounded number of retries
4. **Connection Health Monitoring** – Periodic checks and automatic reconnects
5. **Write Concerns** – Majority write concern for data durability
6. **Index Initialization** – Ensuring model indexes (including TTL) are in sync at startup

**Location:** `backend/config/db.js`

---

## WHAT Exists (Current Implementation)

### Connection Options

MongoDB is connected via Mongoose with the following options:

```javascript
const getConnectionOptions = () => ({
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 50,
  minPoolSize: 5,
  retryWrites: true,
  w: "majority",
});
```

- **serverSelectionTimeoutMS (5000 ms)** – Limits how long the driver waits to find a suitable server
- **socketTimeoutMS (45000 ms)** – Limits inactivity on an established socket
- **maxPoolSize (50)** – Caps concurrent connections from this process
- **minPoolSize (5)** – Keeps a warm pool of connections ready
- **retryWrites: true** – Enables retryable writes where supported
- **w: "majority"** – Ensures writes are acknowledged by a majority of replica set members

### Retry Logic

The connection is established via `connectWithRetry` using exponential backoff:

```javascript
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 30000; // Cap at 30 seconds
const MAX_STARTUP_RETRIES = 5;

const connectWithRetry = async (maxRetries = MAX_STARTUP_RETRIES) => {
  if (mongoose.connection.readyState === 1) return;
  if (isConnecting) return;

  isConnecting = true;
  let attempt = 0;
  let lastError;

  while (attempt < maxRetries && mongoose.connection.readyState !== 1) {
    attempt += 1;
    try {
      await tryConnectOnce();
      // ... success path (logs + index sync)
      lastError = undefined;
      break;
    } catch (error) {
      lastError = error;
      const delay = Math.min(
        INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1),
        MAX_RETRY_DELAY_MS
      );
      // ... logging and await new Promise(setTimeout(resolve, delay))
    }
  }

  isConnecting = false;

  if (mongoose.connection.readyState !== 1 && lastError) {
    throw lastError;
  }
};
```

Key characteristics:

- **Exponential backoff:** Delays grow as `1s, 2s, 4s, 8s, 16s` (capped at 30s)
- **Bounded retries:** Maximum of **5 attempts** during startup or explicit reconnect
- **Fail-fast on startup:** If all attempts fail, `connectWithRetry` throws and server startup fails
- **Idempotent:** Early returns when already connected or a connection attempt is in flight

### Connection Health Monitoring

Connection health is monitored in two ways:

1. **Periodic polling** via `monitorConnection()`
2. **Mongoose connection events** (`connected`, `disconnected`, `error`)

```javascript
const HEALTH_CHECK_INTERVAL_MS = 30000;

const monitorConnection = () => {
  setInterval(async () => {
    const state = mongoose.connection.readyState;
    const stateMap = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    if (state !== 1 && !isConnecting) {
      console.log(
        `MongoDB connection state: ${stateMap[state] || "unknown"} (${state})`
      );

      if (state === 0) {
        console.log("Attempting to reconnect to MongoDB...");
        try {
          await connectWithRetry(MAX_STARTUP_RETRIES);
        } catch (error) {
          console.error(
            `❌ MongoDB reconnection failed after retries: ${error.message}`
          );
        }
      }
    }
  }, HEALTH_CHECK_INTERVAL_MS);
};
```

Additionally, event listeners provide real-time hooks:

```javascript
mongoose.connection.on("connecting", () => {
  console.log("Attempting to connect to MongoDB...");
});

mongoose.connection.on("connected", () => {
  console.log("MongoDB connection established.");
});

mongoose.connection.on("disconnected", () => {
  console.log("🔌 MongoDB connection lost. Attempting to reconnect...");

  if (!isConnecting) {
    setTimeout(async () => {
      try {
        await connectWithRetry(MAX_STARTUP_RETRIES);
      } catch (error) {
        console.error(
          `❌ MongoDB reconnection failed after retries: ${error.message}`
        );
      }
    }, 1000);
  }
});

mongoose.connection.on("error", (err) => {
  if (err.name === "MongoServerSelectionError") {
    console.warn("MongoDB server selection error, will retry...");
  } else {
    console.error("❌ MongoDB connection error:", err.message);
  }
});
```

### Index Initialization

After the first successful connection, model indexes are synchronized:

```javascript
const modelNames = mongoose.modelNames();
if (modelNames.length > 0 && mongoose.connection.db) {
  await Promise.all(
    modelNames.map((name) => mongoose.model(name).syncIndexes())
  );
  console.log("✅ MongoDB indexes are in sync.");
}
```

This ensures:

- All declared indexes on models (including TTL indexes from the soft delete plugin) exist in MongoDB
- Index mismatches are corrected on startup

> Note: `syncIndexes()` is guarded behind checks for existing models and a valid database connection to avoid unnecessary errors.

---

## WHY Change

The previous implementation had:

- Smaller, hard-coded pool sizes (`minPoolSize: 2`, `maxPoolSize: 10`)
- Infinite retry loop with `setTimeout` and no upper bound on attempts
- No explicit write concern configuration
- No explicit index synchronization after connection

These behaviours do not fully satisfy the production requirements:

- **REQ-022 / REQ-063 / REQ-067 / REQ-178 / REQ-183-190 / REQ-418 / REQ-423**:
  - Require proper connection pooling, timeouts, and retry logic
  - Require monitoring and predictable behaviour under failure
- **Model requirements** rely on indexes (including TTL) being present for
  soft delete cleanup and query performance.

Without these changes:

- The application could exhaust DB connections under high load
- Infinite retries could hide persistent failures and delay failure detection
- Missing or stale indexes could break TTL-based cleanup or degrade performance

---

## HOW It Works (Design & Behaviour)

### 1. Startup Connection (`connectDB`)

```javascript
const connectDB = async () => {
  await connectWithRetry(MAX_STARTUP_RETRIES);
  monitorConnection();
  return mongoose.connection;
};
```

- Called once from `backend/server.js` during startup
- Attempts to connect up to **5 times** with exponential backoff
- Throws an error if all retries fail, causing server startup to fail fast
- Starts the periodic health monitor after a successful connection

### 2. Retry Strategy

- Exponential backoff sequence: `1s → 2s → 4s → 8s → 16s` (capped at 30s)
- Bounded by `MAX_STARTUP_RETRIES = 5`
- For each failed attempt:
  - Logs the error and the attempt number
  - Waits for the computed delay using `await new Promise(setTimeout)`

This satisfies the requirement for **predictable, bounded retry behaviour** while still providing resilience to transient outages.

### 3. Connection Pooling

- `minPoolSize: 5` ensures a small pool of warm connections ready to serve traffic
- `maxPoolSize: 50` prevents the application from opening unbounded connections

These values balance:

- **Throughput** for typical workloads
- **Resource constraints** on the MongoDB cluster

### 4. Write Concern & Durability

- `w: "majority"` ensures writes are acknowledged by a majority of replica set members
- `retryWrites: true` allows the driver to retry certain idempotent writes in case of transient failures

This aligns with production durability expectations for multi-tenant data.

### 5. Health Monitoring & Reconnection

- `monitorConnection()` periodically checks `mongoose.connection.readyState`
- If the state is **disconnected (0)** and no connection is in progress, it triggers `connectWithRetry`
- Mongoose event listeners provide immediate reaction to `disconnected` and `error` events, scheduling a reconnect attempt after a short delay (1s)

Combined with the `/health`, `/ready`, and `/live` endpoints (documented separately), this provides a clear and observable health model for orchestration systems like Kubernetes.

### 6. Index Synchronization

- After the first successful connection, `syncIndexes()` is invoked for all registered models
- Ensures:
  - TTL indexes exist for soft-deleted documents
  - Query performance indexes are created as defined in schema
- Errors during index sync are logged but **do not prevent the server from starting**, allowing operational teams to diagnose issues while keeping the service online.

---

## Testing Strategy

Unit tests have been added in `backend/tests/unit/db.test.js` to validate:

1. **Connection Options**
   - `mongoose.connect` is called with:
     - `serverSelectionTimeoutMS: 5000`
     - `socketTimeoutMS: 45000`
     - `maxPoolSize: 50`
     - `minPoolSize: 5`
     - `retryWrites: true`
     - `w: "majority"`

2. **Retry Behaviour**
   - When the first `mongoose.connect` call fails, `connectDB` retries and eventually succeeds on a subsequent attempt.

3. **Environment Validation**
   - When `MONGODB_URI` is not defined, `connectDB` rejects with a clear error message, aligning with environment validation requirements.

These tests use Jest spies on `mongoose.connect` to avoid external DB dependencies and to assert the configuration directly.

---

## Summary

The MongoDB connection layer now:

- Uses **production-ready pooling and timeouts**
- Implements **bounded exponential backoff retry logic**
- Provides **connection health monitoring and automatic reconnection**
- Enforces **majority write concern** for durability
- **Synchronizes indexes** on startup to support TTL and performance requirements
- Is covered by **unit tests** that validate configuration and error handling

This satisfies Task 8 of Phase 1.1 and the related configuration and performance requirements for MongoDB connectivity in a production-ready, multi-tenant SaaS environment.
