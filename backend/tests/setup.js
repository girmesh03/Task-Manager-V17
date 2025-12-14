import mongoose from "mongoose";
import logger from "../utils/logger.js";

// Global test setup for Real MongoDB
// CRITICAL: Per specification, tests MUST use real MongoDB, NOT MongoDB Memory Server

// Setup before all tests
beforeAll(async () => {
  try {
    // Connect to real MongoDB using MONGODB_URI from environment
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/task-manager-test";

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000,
      maxPoolSize: 10, // Connection pool size
      minPoolSize: 2,
    });

    logger.info(`Connected to MongoDB for testing: ${mongoUri}`);

    // Clear all collections before tests
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  } catch (error) {
    logger.error("MongoDB connection failed:", error);
    throw new Error(`Failed to connect to MongoDB: ${error.message}`);
  }
}, 60000); // 1 minute timeout for beforeAll

// Cleanup after each test
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      // Clear all collections after each test to ensure isolation
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
      }
    } catch (error) {
      logger.warn("Failed to clear collections:", error.message);
    }
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      // Drop test database and close connection
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
      logger.info("MongoDB connection closed after tests");
    }
  } catch (error) {
    logger.warn("Error during cleanup:", error.message);
  }
}, 30000);

// Global test utilities
global.testUtils = {
  // Helper to create test organization
  createTestOrganization: async () => {
    const { Organization } = await import("../models/index.js");
    return await Organization.create({
      name: "Test Organization",
      email: "test@example.com",
      phone: "+1234567890",
      isPlatformOrg: false,
    });
  },

  // Helper to create test department
  createTestDepartment: async (organizationId) => {
    const { Department } = await import("../models/index.js");
    return await Department.create({
      name: "Test Department",
      organization: organizationId,
    });
  },

  // Helper to create test user
  createTestUser: async (organizationId, departmentId, options = {}) => {
    const { User } = await import("../models/index.js");
    return await User.create({
      firstName: "Test",
      lastName: "User",
      email: options.email || "testuser@example.com",
      password: "TestPassword123!",
      organization: organizationId,
      department: departmentId,
      role: options.role || "EMPLOYEE",
      isPlatformUser: options.isPlatformUser || false,
      isHod: options.isHod || false,
      ...options,
    });
  },

  // Helper to create test context
  createTestContext: async () => {
    const organization = await global.testUtils.createTestOrganization();
    const department = await global.testUtils.createTestDepartment(
      organization._id
    );
    const user = await global.testUtils.createTestUser(
      organization._id,
      department._id
    );

    return {
      organization,
      department,
      user,
    };
  },
};
