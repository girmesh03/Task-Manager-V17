# Testing Documentation

Complete documentation of testing strategies, patterns, and best practices for the Multi-Tenant SaaS Task Manager.

## Critical Testing Rules

- **Test Framework**: Jest with ES modules support
- **Property-Based Testing**: fast-check library for universal properties
- **Test Isolation**: Each test suite gets fresh MongoDB Memory Server instance
- **Coverage Requirements**: Focus on core functional logic, not 100% coverage
- **Test Organization**: Unit tests, integration tests, and property-based tests in separate directories
- **Test Naming**: Descriptive test names that explain what is being tested
- **No Mocks for PBT**: Property-based tests must validate real functionality without mocks

## Testing Philosophy

### Test-Driven Correctness

The testing approach prioritizes correctness over coverage:

1. **Specification-First**: Tests validate that code meets acceptance criteria
2. **Property-Based Testing**: Universal properties verified across many inputs
3. **Unit Tests**: Specific examples and edge cases
4. **Integration Tests**: End-to-end API request/response cycles
5. **Minimal Mocking**: Tests validate real functionality whenever possible

### Testing Pyramid

```
       /\
      /  \     Property-Based Tests (Universal Properties)
     /____\
    /      \   Integration Tests (API Endpoints)
   /________\
  /          \ Unit Tests (Functions, Methods, Components)
 /____________\
```

**Distribution**:

- Unit Tests: 60% - Test individual functions and methods
- Integration Tests: 30% - Test API endpoints and workflows
- Property-Based Tests: 10% - Test universal properties

## Test File Structure

### Directory Organization

```
backend/tests/
├── globalSetup.js          # MongoDB Memory Server setup
├── globalTeardown.js       # Cleanup after all tests
├── setup.js                # Test environment configuration
├── unit/                   # Unit tests
│   ├── app.test.js
│   ├── cors.test.js
│   ├── rateLimiter.test.js
│   ├── server.test.js
│   ├── softDelete.test.js
│   ├── validateEnv.test.js
│   ├── steering-code-examples.test.js
│   ├── steering-patterns.test.js
│   └── models/
│       ├── Organization.test.js
│       └── User.test.js
└── property/               # Property-based tests
    ├── authorization.property.test.js
    ├── cascade.property.test.js
    ├── cors.property.test.js
    ├── securityHeaders.property.test.js
    ├── softDelete.property.test.js
    └── timezone.property.test.js
```

### File Naming Conventions

- **Unit Tests**: `*.test.js` - Test individual functions/methods
- **Property Tests**: `*.property.test.js` - Test universal properties
- **Integration Tests**: `*.integration.test.js` - Test API endpoints (future)

## Jest Configuration

**File**: `backend/jest.config.js`

```javascript
export default {
  testEnvironment: "node",
  transform: {},
  extensionsToTreatAsEsm: [".js"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testMatch: ["**/tests/**/*.test.js", "**/tests/**/*.property.test.js"],
  collectCoverageFrom: [
    "app.js",
    "server.js",
    "config/**/*.js",
    "controllers/**/*.js",
    "middlewares/**/*.js",
    "models/**/*.js",
    "routes/**/*.js",
    "services/**/*.js",
    "utils/**/*.js",
    "!**/node_modules/**",
    "!**/tests/**",
    "!**/coverage/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  globalSetup: "./tests/globalSetup.js",
  globalTeardown: "./tests/globalTeardown.js",
  setupFilesAfterEnv: ["./tests/setup.js"],
  testTimeout: 30000,
  maxWorkers: 1,
};
```

**Key Settings**:

- **ES Modules**: `transform: {}` and `extensionsToTreatAsEsm`
- **Test Timeout**: 30 seconds for database operations
- **Max Workers**: 1 (sequential execution for database isolation)
- **Global Setup**: MongoDB Memory Server initialization
- **Coverage**: Excludes tests, node_modules, and coverage directories

## Test Setup

### Global Setup (`tests/globalSetup.js`)

**Purpose**: Initialize MongoDB Memory Server before all tests

```javascript
import { MongoMemoryServer } from "mongodb-memory-server";

export default async function globalSetup() {
  const instance = await MongoMemoryServer.create({
    binary: {
      version: "7.0.0",
    },
  });

  const uri = instance.getUri();
  global.__MONGOINSTANCE = instance;
  process.env.MONGODB_URI = uri.slice(0, uri.lastIndexOf("/"));
  process.env.NODE_ENV = "test";
  process.env.JWT_ACCESS_SECRET = "test-access-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
}
```

**Features**:

- Creates in-memory MongoDB instance
- Sets test environment variables
- Provides isolated database for tests

### Global Teardown (`tests/globalTeardown.js`)

**Purpose**: Cleanup MongoDB Memory Server after all tests

```javascript
export default async function globalTeardown() {
  if (global.__MONGOINSTANCE) {
    await global.__MONGOINSTANCE.stop();
  }
}
```

### Test Setup (`tests/setup.js`)

**Purpose**: Configure test environment for each test file

```javascript
import mongoose from "mongoose";

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI + "/test-db");
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

**Features**:

- Connects to test database before tests
- Cleans up all collections after each test
- Drops database and closes connection after all tests

## Unit Testing Patterns

### Test Structure

```javascript
import { describe, test, expect, beforeEach } from "@jest/globals";
import Model from "../models/Model.js";

describe("Model Name", () => {
  describe("Method Name", () => {
    test("should do something specific", async () => {
      // Arrange
      const input = { field: "value" };

      // Act
      const result = await Model.create(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.field).toBe("value");
    });
  });
});
```

**Pattern**: Arrange-Act-Assert (AAA)

- **Arrange**: Set up test data and preconditions
- **Act**: Execute the code being tested
- **Assert**: Verify the expected outcome

### Mocking Strategies

**Minimal Mocking**: Only mock external dependencies (email, file uploads)

```javascript
// Mock email service
jest.mock("../services/emailService.js", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

// Mock Cloudinary
jest.mock("cloudinary", () => ({
  v2: {
    uploader: {
      upload: jest.fn().mockResolvedValue({
        secure_url: "https://example.com/image.jpg",
        public_id: "test-id",
      }),
    },
  },
}));
```

**No Mocking for Core Logic**: Database operations, business logic, and validation should use real implementations

### Assertions

**Common Assertions**:

```javascript
// Existence
expect(result).toBeDefined();
expect(result).not.toBeNull();

// Equality
expect(result.field).toBe("value");
expect(result.count).toEqual(5);

// Objects
expect(result).toMatchObject({ field: "value" });
expect(result).toHaveProperty("field");

// Arrays
expect(array).toHaveLength(3);
expect(array).toContain(item);

// Errors
await expect(async () => {
  await Model.create(invalidData);
}).rejects.toThrow("Validation failed");

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow(error);
```

### Testing Soft Delete

```javascript
describe("Soft Delete", () => {
  test("should mark document as deleted", async () => {
    const doc = await Model.create({ name: "Test" });

    await doc.softDelete();

    expect(doc.isDeleted).toBe(true);
    expect(doc.deletedAt).toBeDefined();
  });

  test("should exclude soft-deleted from queries", async () => {
    const doc = await Model.create({ name: "Test" });
    await doc.softDelete();

    const found = await Model.findById(doc._id);

    expect(found).toBeNull();
  });

  test("should include soft-deleted with withDeleted()", async () => {
    const doc = await Model.create({ name: "Test" });
    await doc.softDelete();

    const found = await Model.findById(doc._id).withDeleted();

    expect(found).toBeDefined();
    expect(found.isDeleted).toBe(true);
  });
});
```

### Testing Cascade Operations

```javascript
describe("Cascade Delete", () => {
  test("should cascade delete children", async () => {
    const parent = await Parent.create({ name: "Parent" });
    const child = await Child.create({
      name: "Child",
      parentId: parent._id,
    });

    await Parent.softDeleteByIdWithCascade(parent._id);

    const foundParent = await Parent.findById(parent._id);
    const foundChild = await Child.findById(child._id);

    expect(foundParent).toBeNull();
    expect(foundChild).toBeNull();
  });
});
```

### Testing Authorization

```javascript
describe("Authorization", () => {
  test("should allow SuperAdmin to access all resources", async () => {
    const user = { role: "SuperAdmin", organizationId: "org1" };
    const resource = { organizationId: "org1" };

    const hasPermission = checkPermission(user, resource, "read");

    expect(hasPermission).toBe(true);
  });

  test("should deny User access to other departments", async () => {
    const user = {
      role: "User",
      departmentId: "dept1",
      organizationId: "org1",
    };
    const resource = {
      departmentId: "dept2",
      organizationId: "org1",
    };

    const hasPermission = checkPermission(user, resource, "read");

    expect(hasPermission).toBe(false);
  });
});
```

## Integration Testing Patterns

### API Request/Response Testing

```javascript
import request from "supertest";
import app from "../app.js";

describe("POST /api/auth/login", () => {
  test("should login with valid credentials", async () => {
    // Create test user
    await User.create({
      email: "test@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "User",
      role: "User",
      departmentId: "dept1",
      organizationId: "org1",
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@example.com",
        password: "password123",
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.user.email).toBe("test@example.com");
    expect(response.headers["set-cookie"]).toBeDefined();
  });

  test("should reject invalid credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@example.com",
        password: "wrongpassword",
      })
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Invalid credentials");
  });
});
```

### Database Isolation

**Transaction-Based Isolation**:

```javascript
describe("Transaction Tests", () => {
  test("should rollback on error", async () => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await Model1.create([{ name: "Test1" }], { session });
      await Model2.create([{ invalid: "data" }], { session }); // Will fail

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
    } finally {
      session.endSession();
    }

    const count1 = await Model1.countDocuments();
    const count2 = await Model2.countDocuments();

    expect(count1).toBe(0); // Rolled back
    expect(count2).toBe(0);
  });
});
```

### Test Fixtures

**Factory Pattern**:

```javascript
// tests/fixtures/userFactory.js
export const createUser = async (overrides = {}) => {
  const defaults = {
    firstName: "Test",
    lastName: "User",
    email: `test${Date.now()}@example.com`,
    password: "password123",
    role: "User",
    departmentId: "dept1",
    organizationId: "org1",
  };

  return await User.create({ ...defaults, ...overrides });
};

// Usage in tests
import { createUser } from "./fixtures/userFactory.js";

test("should create task", async () => {
  const user = await createUser({ role: "Manager" });
  const task = await Task.create({
    title: "Test Task",
    createdBy: user._id,
    departmentId: user.departmentId,
    organizationId: user.organizationId,
  });

  expect(task).toBeDefined();
});
```

## Property-Based Testing Patterns

### fast-check Usage

**Purpose**: Test universal properties across many randomly generated inputs

**Installation**: Already included in `backend/package.json`

```json
{
  "dependencies": {
    "fast-check": "^4.3.0"
  }
}
```

### Property Definitions

**Format**: Properties must reference design document

```javascript
import { test } from "@jest/globals";
import fc from "fast-check";

/**
 * Feature: comprehensive-steering-documentation, Property 1: Complete File Coverage
 * Validates: Requirements 1-30
 *
 * For any file in the backend/ or client/ directories (excluding node_modules,
 * coverage, dist), there SHALL exist documentation in steering files that
 * describes its purpose, structure, and usage patterns.
 */
test("Property 1: Complete File Coverage", () => {
  fc.assert(
    fc.property(fc.constantFrom(...allCodebaseFiles), (file) => {
      const isDocumented = checkFileDocumented(file);
      return isDocumented;
    }),
    { numRuns: 100 }
  );
});
```

**Critical Rules**:

- **Comment Header**: Must reference feature, property number, and requirements
- **Minimum Iterations**: 100 runs (configurable via `numRuns`)
- **No Mocks**: Test real functionality
- **Descriptive Names**: Property name should explain what is being tested

### Generators

**Built-in Generators**:

```javascript
// Primitives
fc.string(); // Random strings
fc.integer(); // Random integers
fc.boolean(); // Random booleans
fc.float(); // Random floats

// Constraints
fc.string({ minLength: 1, maxLength: 100 });
fc.integer({ min: 0, max: 100 });

// Arrays
fc.array(fc.string());
fc.array(fc.integer(), { minLength: 1, maxLength: 10 });

// Objects
fc.record({
  name: fc.string(),
  age: fc.integer({ min: 0, max: 120 }),
});

// Enums
fc.constantFrom("To Do", "In Progress", "Completed", "Pending");

// MongoDB ObjectIds
fc.hexaString({ minLength: 24, maxLength: 24 });
```

**Custom Generators**:

```javascript
// User generator
const userArbitrary = fc.record({
  firstName: fc.string({ minLength: 1, maxLength: 20 }),
  lastName: fc.string({ minLength: 1, maxLength: 20 }),
  email: fc.emailAddress(),
  role: fc.constantFrom("SuperAdmin", "Admin", "Manager", "User"),
  departmentId: fc.hexaString({ minLength: 24, maxLength: 24 }),
  organizationId: fc.hexaString({ minLength: 24, maxLength: 24 }),
});

// Task generator (base fields for all task types)
const taskArbitrary = fc.record({
  title: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ minLength: 1, maxLength: 2000 }),
  status: fc.constantFrom("To Do", "In Progress", "Completed", "Pending"),
  priority: fc.constantFrom("Low", "Medium", "High", "Urgent"),
  taskType: fc.constantFrom("ProjectTask", "RoutineTask", "AssignedTask"),
});

// ProjectTask generator (outsourced to vendor)
const projectTaskArbitrary = fc.record({
  ...taskArbitrary,
  vendorId: fc.hexaString({ minLength: 24, maxLength: 24 }), // Required
  estimatedCost: fc.float({ min: 0, max: 100000 }),
  actualCost: fc.float({ min: 0, max: 100000 }),
});

// RoutineTask generator (materials added directly, no TaskActivity)
const routineTaskArbitrary = fc.record({
  ...taskArbitrary,
  status: fc.constantFrom("In Progress", "Completed", "Pending"), // No "To Do"
  priority: fc.constantFrom("Medium", "High", "Urgent"), // No "Low"
  materials: fc.array(
    fc.record({
      material: fc.hexaString({ minLength: 24, maxLength: 24 }),
      quantity: fc.float({ min: 0, max: 1000 }),
    }),
    { maxLength: 20 }
  ),
});

// AssignedTask generator (assigned to user(s))
const assignedTaskArbitrary = fc.record({
  ...taskArbitrary,
  assignedTo: fc.hexaString({ minLength: 24, maxLength: 24 }), // Single or array
});
```

### Property Test Examples

**Example 1: Soft Delete Property**

```javascript
/**
 * Feature: soft-delete, Property 1: Soft delete preserves data
 * Validates: Requirements 2.4
 *
 * For any model instance, soft deleting it should set isDeleted to true
 * and deletedAt to a date, but the document should still exist in the database.
 */
test("Property 1: Soft delete preserves data", () => {
  fc.assert(
    fc.asyncProperty(
      fc.record({
        name: fc.string({ minLength: 1, maxLength: 100 }),
        description: fc.string({ minLength: 1, maxLength: 2000 }),
      }),
      async (data) => {
        const doc = await TestModel.create(data);
        const originalId = doc._id;

        await doc.softDelete();

        const found = await TestModel.findById(originalId).withDeleted();

        return (
          found !== null &&
          found.isDeleted === true &&
          found.deletedAt !== null &&
          found.name === data.name
        );
      }
    ),
    { numRuns: 100 }
  );
});
```

**Example 2: Authorization Property**

```javascript
/**
 * Feature: authorization, Property 2: Role hierarchy
 * Validates: Requirements 7.2
 *
 * For any resource and operation, a user with higher role should have
 * at least the same permissions as a user with lower role.
 */
test("Property 2: Role hierarchy", () => {
  const roles = ["User", "Manager", "Admin", "SuperAdmin"];

  fc.assert(
    fc.property(
      fc.constantFrom(...roles),
      fc.constantFrom(...roles),
      fc.constantFrom("User", "Task", "Material"),
      fc.constantFrom("create", "read", "update", "delete"),
      (lowerRole, higherRole, resource, operation) => {
        const lowerIndex = roles.indexOf(lowerRole);
        const higherIndex = roles.indexOf(higherRole);

        if (lowerIndex >= higherIndex) return true;

        const lowerPerms = getPermissions(lowerRole, resource, operation);
        const higherPerms = getPermissions(higherRole, resource, operation);

        return lowerPerms.every((perm) => higherPerms.includes(perm));
      }
    ),
    { numRuns: 100 }
  );
});
```

**Example 3: Pagination Property**

```javascript
/**
 * Feature: pagination, Property 3: Page boundaries
 * Validates: Requirements 4.6
 *
 * For any valid page number and limit, the returned items should not
 * exceed the limit, and the pagination metadata should be consistent.
 */
test("Property 3: Page boundaries", () => {
  fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 1, max: 10 }),
      fc.integer({ min: 1, max: 100 }),
      async (page, limit) => {
        const result = await Model.paginate({}, { page, limit });

        return (
          result.docs.length <= limit &&
          result.page === page &&
          result.limit === limit &&
          result.totalPages >= 0 &&
          (result.hasNextPage === false || result.page < result.totalPages)
        );
      }
    ),
    { numRuns: 100 }
  );
});
```

### Handling Failures

**When a Property Test Fails**:

1. **Review the Counterexample**: fast-check provides the failing input
2. **Reproduce Manually**: Create a unit test with the failing input
3. **Triage**:
   - Is the test incorrect? → Fix the test
   - Is the code incorrect? → Fix the code
   - Is the specification unclear? → Clarify with user
4. **Update PBT Status**: Use `updatePBTStatus` tool to report failure

**Example Failure Output**:

```
Property failed after 42 tests
{ seed: 1234567890, path: "42", endOnFailure: true }
Counterexample: { name: "", description: "test" }
Shrunk 5 time(s)
Got error: ValidationError: name is required
```

## Running Tests

### NPM Scripts

```json
{
  "test": "node --experimental-vm-modules --no-warnings node_modules/jest/bin/jest.js --runInBand",
  "test:watch": "node --experimental-vm-modules --no-warnings node_modules/jest/bin/jest.js --watch --runInBand",
  "test:coverage": "node --experimental-vm-modules --no-warnings node_modules/jest/bin/jest.js --coverage --runInBand",
  "test:property": "node --experimental-vm-modules --no-warnings node_modules/jest/bin/jest.js --testNamePattern='Property' --runInBand",
  "test:unit": "node --experimental-vm-modules --no-warnings node_modules/jest/bin/jest.js --testPathIgnorePatterns='property' --runInBand"
}
```

### Running All Tests

```bash
cd backend
npm test
```

**Output**:

```
PASS  tests/unit/app.test.js
PASS  tests/unit/softDelete.test.js
PASS  tests/property/softDelete.property.test.js

Test Suites: 3 passed, 3 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        15.234 s
```

### Running Specific Tests

```bash
# Run only unit tests
npm run test:unit

# Run only property-based tests
npm run test:property

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- tests/unit/softDelete.test.js

# Run tests matching pattern
npm test -- --testNamePattern="Soft delete"
```

### Coverage Reports

```bash
npm run test:coverage
```

**Output**:

```
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   85.23 |    78.45 |   82.67 |   85.89 |
 models/            |   92.15 |    88.32 |   90.45 |   92.67 |
  User.js           |   95.23 |    91.45 |   94.12 |   95.67 | 45-48,102
  Organization.js   |   89.45 |    85.23 |   87.34 |   90.12 | 67-72
 controllers/       |   78.34 |    72.45 |   75.23 |   79.12 |
  userControllers.js|   82.45 |    76.89 |   79.34 |   83.12 | 123-145,234
--------------------|---------|----------|---------|---------|-------------------
```

**Coverage Files**:

- `backend/coverage/lcov-report/index.html` - HTML coverage report
- `backend/coverage/lcov.info` - LCOV format for CI/CD
- `backend/coverage/coverage-final.json` - JSON format

## Testing Specific Features

### Testing Real-Time Features (Socket.IO)

```javascript
import { io as ioClient } from "socket.io-client";
import { createServer } from "http";
import { initializeSocket } from "../utils/socketInstance.js";

describe("Socket.IO Events", () => {
  let httpServer;
  let clientSocket;

  beforeAll((done) => {
    httpServer = createServer();
    initializeSocket(httpServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = ioClient(`http://localhost:${port}`, {
        withCredentials: true,
      });
      clientSocket.on("connect", done);
    });
  });

  afterAll(() => {
    clientSocket.close();
    httpServer.close();
  });

  test("should emit task:created event", (done) => {
    clientSocket.on("task:created", (task) => {
      expect(task).toBeDefined();
      expect(task.title).toBe("Test Task");
      done();
    });

    // Trigger task creation
    emitTaskEvent("task:created", { title: "Test Task" });
  });
});
```

### Testing File Uploads

```javascript
describe("File Upload", () => {
  test("should upload file to Cloudinary", async () => {
    const mockFile = {
      originalname: "test.jpg",
      mimetype: "image/jpeg",
      size: 1024 * 1024, // 1MB
      buffer: Buffer.from("fake image data"),
    };

    const result = await uploadToCloudinary(mockFile);

    expect(result).toHaveProperty("url");
    expect(result).toHaveProperty("publicId");
    expect(result.url).toContain("cloudinary.com");
  });

  test("should reject oversized files", async () => {
    const mockFile = {
      originalname: "large.jpg",
      mimetype: "image/jpeg",
      size: 11 * 1024 * 1024, // 11MB (exceeds 10MB limit)
      buffer: Buffer.from("fake large image data"),
    };

    await expect(uploadToCloudinary(mockFile)).rejects.toThrow(
      "File size exceeds limit"
    );
  });
});
```

### Testing Timezone Handling

```javascript
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

describe("Timezone Handling", () => {
  test("should store dates in UTC", async () => {
    const localDate = dayjs.tz("2024-01-15 10:30:00", "America/New_York");

    const task = await Task.create({
      title: "Test Task",
      dueDate: localDate.toDate(),
    });

    const storedDate = dayjs(task.dueDate);
    expect(storedDate.isUTC()).toBe(true);
  });

  test("should return dates in ISO format", async () => {
    const task = await Task.create({
      title: "Test Task",
      dueDate: new Date("2024-01-15T15:30:00Z"),
    });

    const response = task.toJSON();
    expect(response.dueDate).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
  });
});
```

### Testing Error Handling

```javascript
describe("Error Handling", () => {
  test("should throw CustomError for validation failures", async () => {
    await expect(User.create({ email: "invalid-email" })).rejects.toThrow(
      CustomError
    );
  });

  test("should return 400 for validation errors", async () => {
    const response = await request(app)
      .post("/api/users")
      .send({ email: "invalid-email" })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.errorCode).toBe("VALIDATION_ERROR");
  });

  test("should return 404 for not found", async () => {
    const response = await request(app)
      .get("/api/users/000000000000000000000000")
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.errorCode).toBe("NOT_FOUND_ERROR");
  });
});
```

## Test Isolation

### Database Cleanup

**After Each Test**:

```javascript
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

**Why**: Ensures each test starts with clean database state

### Transaction Isolation

**For Cascade Tests**:

```javascript
test("should use transaction for cascade delete", async () => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await Parent.softDeleteByIdWithCascade(parentId, { session });
    });
  } finally {
    session.endSession();
  }
});
```

### Test Data Factories

**Reusable Test Data**:

```javascript
// tests/fixtures/factories.js
export const factories = {
  user: (overrides = {}) => ({
    firstName: "Test",
    lastName: "User",
    email: `test${Date.now()}@example.com`,
    password: "password123",
    role: "User",
    ...overrides,
  }),

  task: (overrides = {}) => ({
    title: "Test Task",
    description: "Test Description",
    status: "To Do",
    priority: "Medium",
    taskType: "ProjectTask",
    ...overrides,
  }),

  projectTask: (overrides = {}) => ({
    title: "Test Project Task",
    description: "Outsourced to vendor",
    status: "To Do",
    priority: "Medium",
    taskType: "ProjectTask",
    vendorId: "vendor123", // Required for ProjectTask
    estimatedCost: 1000,
    ...overrides,
  }),

  routineTask: (overrides = {}) => ({
    title: "Test Routine Task",
    description: "Daily routine from outlet",
    status: "In Progress", // Cannot be "To Do"
    priority: "Medium", // Cannot be "Low"
    taskType: "RoutineTask",
    materials: [], // Added directly (no TaskActivity)
    ...overrides,
  }),

  assignedTask: (overrides = {}) => ({
    title: "Test Assigned Task",
    description: "Assigned to user",
    status: "To Do",
    priority: "Medium",
    taskType: "AssignedTask",
    assignedTo: "user123", // Required for AssignedTask
    ...overrides,
  }),

  organization: (overrides = {}) => ({
    name: `Test Org ${Date.now()}`,
    description: "Test Organization",
    industry: "Technology",
    email: `org${Date.now()}@example.com`,
    phone: "+1234567890",
    address: "123 Test St",
    ...overrides,
  }),
};
```

## Coverage Requirements

### Coverage Goals

- **Statements**: 80%+ (focus on core logic)
- **Branches**: 75%+ (test main paths and error cases)
- **Functions**: 80%+ (test all exported functions)
- **Lines**: 80%+ (similar to statements)

### What to Test

**High Priority**:

- Business logic (controllers, services)
- Data models (validation, hooks, methods)
- Authorization logic
- Soft delete and cascade operations
- API endpoints (integration tests)
- Universal properties (property-based tests)

**Medium Priority**:

- Utility functions
- Middleware
- Error handling
- Data transformations

**Low Priority**:

- Configuration files
- Constants
- Simple getters/setters
- Third-party library wrappers

### What NOT to Test

- External libraries (Express, Mongoose, etc.)
- Node.js built-ins
- Configuration objects
- Type definitions
- Simple pass-through functions

## Continuous Integration

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Install dependencies
        run: |
          cd backend
          npm ci

      - name: Run tests
        run: |
          cd backend
          npm test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
```

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test",
      "pre-push": "npm run test:coverage"
    }
  }
}
```

## Best Practices

### DO

✅ Write descriptive test names that explain what is being tested
✅ Use AAA pattern (Arrange-Act-Assert)
✅ Test one thing per test
✅ Use factories for test data
✅ Clean up after each test
✅ Use property-based tests for universal properties
✅ Test error cases and edge cases
✅ Use real database for integration tests
✅ Document property tests with feature and requirement references

### DON'T

❌ Don't test implementation details
❌ Don't use mocks for core business logic
❌ Don't share state between tests
❌ Don't test third-party libraries
❌ Don't aim for 100% coverage
❌ Don't write tests that depend on execution order
❌ Don't use production database for tests
❌ Don't skip failing tests (fix them or remove them)

## Troubleshooting

### Common Issues

**Issue**: Tests timeout
**Solution**: Increase timeout in jest.config.js or use `jest.setTimeout(30000)`

**Issue**: MongoDB connection errors
**Solution**: Ensure MongoDB Memory Server is initialized in globalSetup.js

**Issue**: Tests fail randomly
**Solution**: Check for shared state between tests, ensure proper cleanup

**Issue**: Property test fails with shrinking
**Solution**: Review the counterexample, create unit test to reproduce

**Issue**: Coverage not generated
**Solution**: Ensure `collectCoverageFrom` in jest.config.js includes all files

## File Coverage

This testing documentation covers:

**Test Files** (15+ files):

- `tests/globalSetup.js` - MongoDB Memory Server setup
- `tests/globalTeardown.js` - Cleanup
- `tests/setup.js` - Test environment
- `tests/unit/*.test.js` - Unit tests (8+ files)
- `tests/property/*.property.test.js` - Property tests (6+ files)

**Configuration** (1 file):

- `backend/jest.config.js` - Jest configuration

**Total**: 16+ testing-related files documented

---

**Last Updated**: December 5, 2024
**Next Review**: After adding new test patterns or frameworks
