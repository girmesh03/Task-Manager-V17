// backend/tests/globalTeardown.js
/**
 * Global Test Teardown
 *
 * Cleans up after all tests complete.
 * Uses real MongoDB instance as per specification.
 */

export default async function globalTeardown() {
  // Clean up global variables
  delete global.__MONGO_URI__;

  console.log("Test teardown complete");
}
