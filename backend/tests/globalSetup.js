// backend/tests/globalSetup.js
/**
 * Global Test Setup
 *
 * Uses real MongoDB instance for testing as per specification.
 * Requirements: 9.4 - Use Real MongoDB test database (NOT mongodb-memory-server)
 */

export default async function globalSetup() {
  // Set test environment
  process.env.NODE_ENV = "test";

  // Use real MongoDB URI from environment or default test database
  const mongoUri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/task-manager-test";

  // Store the URI globally for tests
  global.__MONGO_URI__ = mongoUri;

  console.log("Test setup complete - using MongoDB at:", mongoUri);
}
