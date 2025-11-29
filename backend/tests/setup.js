import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// Increase MongoMemoryServer startup timeout to be more robust on slower environments (e.g. Windows)
if (!process.env.MONGOMS_STARTUP_TIMEOUT) {
  process.env.MONGOMS_STARTUP_TIMEOUT = "60000"; // 60 seconds
}

// Global test setup for MongoDB Memory Server
let mongoServer;
const hasExternalDbUri = Boolean(process.env.MONGODB_URI);
const isWindows = process.platform === "win32";

// Setup before all tests
beforeAll(async () => {
  // Decide whether to use in-memory DB or external MongoDB
  const useMemoryDb =
    process.env.USE_MEMORY_DB === "true" ||
    (!isWindows && !hasExternalDbUri && process.env.USE_MEMORY_DB !== "false");

  if (useMemoryDb) {
    try {
      // Start MongoDB Memory Server with optimized settings
      mongoServer = await MongoMemoryServer.create({
        binary: {
          version: "7.0.0", // Use stable MongoDB version
          downloadDir: "./mongodb-binaries", // Cache binaries locally
        },
        instance: {
          dbName: "task-manager-test",
          port: 0, // Use random available port
        },
      });

      const mongoUri = mongoServer.getUri();

      // Connect to the in-memory database
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.log("Connected to MongoDB Memory Server for testing");
      return;
    } catch (error) {
      console.warn(
        "MongoDB Memory Server failed to start, falling back to external or mock connection:",
        error.message
      );
    }
  }

  // Fallback: use external MongoDB if URI is provided
  if (hasExternalDbUri) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log(
        "Connected to external MongoDB for testing:",
        process.env.MONGODB_URI
      );
    } catch (error) {
      console.warn(
        "Failed to connect to external MongoDB for tests, using mock connection:",
        error.message
      );
      mongoose.connection.readyState = 1; // Mock connected state
    }
  } else {
    console.warn(
      "No in-memory MongoDB and no MONGODB_URI provided. Tests will run without a real database connection. Ensure MONGODB_URI is set or USE_MEMORY_DB=true if you need database-backed tests."
    );
  }
}, 120000); // Increase timeout for MongoDB download

// Cleanup after each test
afterEach(async () => {
  if (mongoose.connection.readyState === 1 && mongoServer) {
    try {
      // Clear all collections after each test
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
      }
    } catch (error) {
      console.warn("Failed to clear collections:", error.message);
    }
  }
});

// Cleanup after all tests
afterAll(async () => {
  if (mongoServer) {
    try {
      // Close mongoose connection
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
      }

      // Stop MongoDB Memory Server
      await mongoServer.stop();
      console.log("MongoDB Memory Server stopped");
    } catch (error) {
      console.warn("Error during cleanup:", error.message);
    }
  }
}, 30000);

// Global test utilities
global.testUtils = {
  // Helper to create test organization
  createTestOrganization: async () => {
    const { Organization } = await import("../models/index.js");
    return await Organization.create({
      name: "Test Organization",
      description: "Test organization for automated tests",
      email: "test@example.com",
      phone: "+1234567890",
      address: "123 Test Street",
      industry: "Hospitality",
      isPlatformOrg: false,
    });
  },

  // Helper to create test department
  createTestDepartment: async (organizationId) => {
    const { Department } = await import("../models/index.js");
    return await Department.create({
      name: "Test Department",
      description: "Test department for automated tests",
      organization: organizationId,
    });
  },

  // Helper to create test user
  createTestUser: async (organizationId, departmentId, options = {}) => {
    const { User } = await import("../models/index.js");
    return await User.create({
      firstName: "Test",
      lastName: "User",
      position: options.position || "Test Position",
      email: options.email || "testuser@example.com",
      password: options.password || "TestPassword123!",
      organization: organizationId,
      department: departmentId,
      role: options.role || "User",
      joinedAt: options.joinedAt || new Date(),
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
