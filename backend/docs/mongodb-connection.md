# MongoDB Connection Strategy

This document outlines the production-ready MongoDB connection strategy for the application, addressing `REQ-022`, `REQ-067`, and `REQ-183-190`.

## Strategy: Native Driver Reconnection

The connection logic, located in `backend/config/db.js`, leverages the robust, built-in reconnection and retry mechanisms of the underlying MongoDB Node.js driver, which Mongoose uses.

### Rationale

An earlier implementation used a manual, complex `connectWithRetry` function with exponential backoff. This approach was removed for the following reasons:

1.  **Redundancy**: The MongoDB driver already implements a sophisticated and configurable reconnection strategy (`retryWrites`) that is more reliable than a manual implementation.
2.  **Maintainability**: Relying on the native driver simplifies the codebase, reduces potential bugs, and makes the connection logic easier to maintain and understand.
3.  **Best Practice**: Using the driver's built-in features is the recommended best practice for handling MongoDB connections in a production environment.

## Fail-Fast on Startup

A critical production-readiness principle is to **fail fast**. If the application cannot connect to its primary database upon startup, it should exit immediately. This prevents a "zombie" service state where the application is running but non-functional, which can mislead container orchestrators and monitoring systems.

The `connectDB` function in `backend/config/db.js` enforces this by calling `process.exit(1)` within the `catch` block of the initial connection attempt.

## Production-Ready Configuration

The Mongoose connection is configured with the following production-grade options:

-   **`minPoolSize: 5`**: Ensures a minimum of 5 open connections to the database, reducing connection latency for incoming requests.
-   **`maxPoolSize: 50`**: Allows the connection pool to scale up to 50 concurrent connections to handle peak load.
-   **`serverSelectionTimeoutMS: 5000`**: The driver will try to find a suitable server for an operation for up to 5 seconds before timing out.
-   **`socketTimeoutMS: 45000`**: The driver will wait up to 45 seconds for a response from the server before timing out a socket.
-   **`writeConcern: { w: 'majority' }`**: Ensures that write operations are acknowledged by a majority of the replica set members, guaranteeing data durability.
-   **`retryWrites: true`**: Enables the driver to automatically retry supported write operations once upon encountering a transient network error.

## Graceful Shutdown

The `disconnectDB` function is integrated into the server's graceful shutdown procedure in `backend/server.js`. When the application receives a `SIGINT` or `SIGTERM` signal, it will explicitly close the MongoDB connection, allowing any in-flight operations to complete before exiting. This prevents data corruption and ensures a clean shutdown.
