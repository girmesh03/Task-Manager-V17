// backend/tests/globalSetup.js
/**
 * Global Test Setup
 *
 * Uses real MongoDB instance for testing.
 */

export default async function globalSetup() {
  process.env.NODE_ENV = "test";

  const mongoUri =
    process.env.MONGODB_URI_TEST ||
    process.env.MONGODB_URI ||
    "mongodb://localhost:27017/task-manager-test";

  global.__MONGO_URI__ = mongoUri;

  console.log("Test setup complete - using MongoDB at:", mongoUri);
}
