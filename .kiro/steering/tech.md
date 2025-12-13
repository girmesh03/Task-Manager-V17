---
inclusion: always
---

# Technology Stack & Code Conventions

## Backend Stack

### Core Technologies

**Runtime & Framework**:

- Node.js v20.x LTS with ES modules (`"type": "module"`)
- Express.js ^4.21.2

**Database**:

- MongoDB v7.0 with Mongoose ^8.19.1
- mongoose-paginate-v2 ^1.9.1 for pagination

**Authentication & Security**:

- JWT authentication (jsonwebtoken ^9.0.2)
- bcrypt ^6.0.0 for password hashing (≥12 salt rounds)
- helmet ^8.1.0 for security headers
- cors ^2.8.5 for CORS configuration
- express-mongo-sanitize ^2.2.0 for NoSQL injection prevention
- express-rate-limit ^8.1.0 for rate limiting (production only)

**Validation & Error Handling**:

- express-validator ^7.2.1 for request validation
- express-async-handler for async route handlers

**Real-Time & Communication**:

- Socket.IO ^4.8.1 for real-time communication
- Nodemailer ^7.0.9 for email (Gmail SMTP)

**Utilities**:

- winston ^3.18.3 for logging
- dayjs ^1.11.18 for date manipulation (UTC plugin)
- compression for response compression

**Development**:

- nodemon ^3.1.10 for backend auto-restart

**Testing**:

- Jest ^30.2.0 for testing with ES modules
- **CRITICAL**: DO NOT use mongodb-memory-server - Use real MongoDB instance for testing
- supertest for API testing
- fast-check for property-based testing

### Critical Backend Rules

1. **ALWAYS use ES Modules syntax** (`import`/`export`, NOT `require`)
2. **ALWAYS wrap async route handlers** with `express-async-handler`
3. **ALWAYS use `dayjs`** for date operations (NOT native Date)
4. **ALWAYS import constants** from `backend/utils/constants.js` - NEVER hardcode values
5. **Use `winston` logger** for all logging (NOT console.log in production code)
6. **Use Mongoose sessions** for transactions (multi-document operations, cascades)
7. **Apply `softDelete` plugin** to ALL models
8. **Use discriminators** for task types (BaseTask → ProjectTask/AssignedTask/RoutineTask)
9. **Use `mongoose-paginate-v2`** for pagination
10. **Socket.IO singleton pattern** via `backend/utils/socketInstance.js`
11. **Validators are source of truth** - `backend/middlewares/validators/` for field names and constraints

### Authentication Pattern

**JWT stored in httpOnly cookies (NOT localStorage)**:

```javascript
// Access token: 15min, Refresh token: 7 days
import jwt from "jsonwebtoken";

const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
  expiresIn: "15m",
});

const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
  expiresIn: "7d",
});

// Set HTTP-only cookies
res.cookie("access_token", accessToken, {
  httpOnly: true, // Prevents JavaScript access (XSS protection)
  secure: isProduction, // HTTPS only in production
  sameSite: "strict", // CSRF protection
  maxAge: 15 * 60 * 1000, // 15 minutes
});

res.cookie("refresh_token", refreshToken, {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

**Token Rotation**: New refresh token issued on each refresh

### Password Security

**Hashing (bcrypt)**:

```javascript
// Hash password on user creation/update
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12); // 12 salt rounds
  }
  next();
});

// Compare entered password with hash
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
```

**Requirements**:

- Minimum 8 characters
- Bcrypt with ≥12 salt rounds
- Never stored in plain text
- Never returned in API responses (select: false)

**Password Reset**:

- Generate random reset token
- Hash token with bcrypt (10 rounds)
- Store hashed token in user document
- Set expiry (1 hour)
- Send reset email with unhashed token
- Always return success (prevents email enumeration)

### Async Handler Pattern

```javascript
import asyncHandler from "express-async-handler";

export const getResource = asyncHandler(async (req, res, next) => {});
```

### Validation Pattern

Use `express-validator` in middleware chain before controllers:

```javascript
import { body, param, query } from "express-validator";
import { matchedData } from "express-validator";

// Validation middleware
export const createResourceValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 })
    .withMessage("Name must not exceed 100 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail({}),

  // Validation result handler
  handleValidationErrors,
];

// Extract validated data
export const handleValidationErrors = (req, res, next) => {
  req.validated = {
    body: matchedData(req, { locations: ["body"] }),
    params: matchedData(req, { locations: ["params"] }),
    query: matchedData(req, { locations: ["query"] }),
  };
  next();
};
```

**Validators in `backend/middlewares/validators/` are the source of truth for field names and constraints.**

### Database Patterns

**Mongoose Sessions for Transactions**:

```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // All database operations with { session }
  const resource = await Model.create([data], { session });
  await RelatedModel.updateMany(filter, update, { session });

  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

**Soft Delete Plugin**: Apply to ALL models

**Discriminators**: Use for task types (BaseTask → ProjectTask/RoutineTask/AssignedTask)

**Pagination**: Use `mongoose-paginate-v2` for all list endpoints

### Socket.IO Pattern

**Singleton via `backend/utils/socketInstance.js`**:

```javascript
import { Server } from "socket.io";
import corsOptions from "../config/corsOptions.js";

let io = null;

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: corsOptions,
  });
  setupSocketHandlers(io);
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
};
```

**Import and use `getIO()` to emit events**:

```javascript
import { getIO } from "../utils/socketInstance.js";

export const emitTaskEvent = (event, task) => {
  const io = getIO();
  io.to(`department:${task.department}`).emit(event, task);
  io.to(`organization:${task.organization}`).emit(event, task);
};
```

### Testing Pattern

**Jest with ES Modules**:

```javascript
// jest.config.js
export default {
  testEnvironment: "node",
  transform: {},
  extensionsToTreatAsEsm: [".js"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testMatch: ["**/tests/**/*.test.js"],
  globalSetup: "./tests/globalSetup.js",
  globalTeardown: "./tests/globalTeardown.js",
  setupFilesAfterEnv: ["./tests/setup.js"],
  testTimeout: 30000,
  maxWorkers: 1,
};
```

**Use real MongoDB instance** (NOT mongodb-memory-server)

**Run with `--runInBand` flag** to prevent race conditions

### Security Middleware Order (CRITICAL)

**MUST follow this exact order in `backend/app.js`**:

1. **helmet()** - Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, hide X-Powered-By)
2. **cors(corsOptions)** - CORS with credentials (origin validation, no wildcards in production)
3. **cookieParser()** - Parse cookies (required before authentication middleware)
4. **express.json()** - Parse JSON bodies (10mb limit for file uploads)
5. **mongoSanitize()** - NoSQL injection prevention (removes $ and . from user input)
6. **compression()** - Response compression (gzip for responses >1KB)
7. **rateLimiter** - Rate limiting (production only: 100 req/15min general, 5 req/15min auth)

### Rate Limiting (Production Only)

**General API Limiter**:

```javascript
{
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: "Too many requests, please try again later",
  standardHeaders: true,      // Return rate limit info in headers
  keyGenerator: (req) => req.ip  // Track by IP address
}
```

**Auth Endpoints Limiter**:

```javascript
{
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 requests per window
  message: "Too many authentication attempts, please try again later",
  keyGenerator: (req) => req.ip
}
```

**Endpoints with Stricter Limits**:

- POST /api/auth/login - 5/15min
- POST /api/auth/register - 5/15min
- POST /api/auth/forgot-password - 5/15min
- POST /api/auth/reset-password - 5/15min
- GET /api/auth/refresh-token - 5/15min
- DELETE /api/auth/logout - 5/15min

### CORS Configuration

**File**: `backend/config/corsOptions.js`

```javascript
{
  origin: validateOrigin,  // Function that validates against allowedOrigins
  credentials: true,       // Enable cookies
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["X-Request-ID", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
  maxAge: 86400,          // 24 hours preflight cache
  optionsSuccessStatus: 200,
  preflightContinue: false
}
```

**Allowed Origins**:

- Development: http://localhost:3000, http://localhost:5173
- Production: process.env.CLIENT_URL + process.env.ALLOWED_ORIGINS
- NO wildcards in production

### Error Handling

**Use `CustomError` class with typed methods**:

```javascript
// Validation errors (400)
throw CustomError.validation("Invalid input data");

// Authentication errors (401) - triggers logout on frontend
throw CustomError.authentication("Invalid credentials");

// Authorization errors (403)
throw CustomError.authorization("Insufficient permissions");

// Not found errors (404)
throw CustomError.notFound("Resource not found");

// Conflict errors (409)
throw CustomError.conflict("Resource already exists");

// Internal server errors (500)
throw CustomError.internal("Unexpected error occurred");
```

### Logging

**Use winston logger** with appropriate levels:

```javascript
import logger from "./utils/logger.js";

logger.error("Error message", { error, context });
logger.warn("Warning message", { context });
logger.info("Info message", { context });
logger.debug("Debug message", { context });
```

**NOT console.log in production code**

### Constants

**NEVER hardcode magic strings/numbers**:

```javascript
// ❌ WRONG
const status = "In Progress";
const maxItems = 20;

// ✅ CORRECT
import { TASK_STATUS, LIMITS } from "./utils/constants.js";
const status = TASK_STATUS[1]; // "In Progress"
const maxItems = LIMITS.MAX_ASSIGNEES; // 20
```

**Import from `utils/constants.js`**

## Frontend Stack

### Core Technologies

**UI Framework**:

- React ^19.1.1 with React DOM ^19.1.1
- Vite ^7.1.7 build tool

**UI Library**:

- Material-UI (MUI) v7.3.4 complete suite
  - @mui/material
  - @mui/icons-material
  - @mui/x-data-grid
  - @mui/x-date-pickers

**State Management**:

- Redux Toolkit ^2.9.0 with RTK Query
- redux-persist for auth state persistence

**Routing**:

- React Router ^7.9.4

**Forms**:

- react-hook-form ^7.65.0 (NEVER use watch() method)

**Real-Time**:

- Socket.IO Client ^4.8.1

**Notifications**:

- react-toastify ^11.0.5

**Utilities**:

- dayjs ^1.11.18 (same as backend)

**Development**:

- ESLint for code quality
- Vite HMR for fast development

### Critical Frontend Rules

1. **ALWAYS use RTK Query** for API calls (NOT raw axios in components)
2. **NEVER use `watch()` method** from react-hook-form - use controlled components with `Controller`
3. **MUI v7 Grid**: Use `size` prop (NOT deprecated `item` prop)
4. **ALWAYS use `dayjs`** for date operations (NOT native Date)
5. **Import constants** from `client/src/utils/constants.js` - NEVER hardcode values
6. **Use React.memo, useCallback, useMemo** for performance optimization
7. **Socket.IO**: Connect on authentication, subscribe to rooms (user, department, organization)
8. **Token refresh on 401** with automatic retry
9. **Error boundaries** for graceful error handling
10. **Lazy loading** for routes and components

### Form Pattern (react-hook-form)

**CRITICAL**: NEVER use `watch()` method

```javascript
import { useForm, Controller } from "react-hook-form";

const { control, handleSubmit } = useForm();

// ❌ WRONG: const values = watch();

// ✅ CORRECT: Use Controller for each field
<Controller
  name="fieldName"
  control={control}
  rules={{
    required: "Field is required",
    maxLength: { value: 100, message: "Maximum 100 characters" },
  }}
  ...
/>;
```

### MUI v7 Grid Pattern

```javascript
// ❌ WRONG: <Grid item xs={12}>
// ✅ CORRECT:
<Grid size={{ xs: 12, md: 6 }}>
  <Content />
</Grid>
```

### RTK Query Pattern

**Define in feature API slice**:

```javascript
export const resourceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getResources: builder.query({
      query: (params) => ({ url: "/resources", params }),
      providesTags: ["Resource"],
    }),
    createResource: builder.mutation({
      query: (data) => ({ url: "/resources", method: "POST", body: data }),
      invalidatesTags: ["Resource"],
    }),
  }),
});

export const { useGetResourcesQuery, useCreateResourceMutation } = resourceApi;
```

**Use in component**:

```javascript
const { data, isLoading } = useGetResourcesQuery(params);
const [createResource, { isLoading: isCreating }] = useCreateResourceMutation();
```

### Dialog Pattern

```javascript
<Dialog
  open={open}
  onClose={handleClose}
  disableEnforceFocus
  disableRestoreFocus
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
  <DialogTitle id="dialog-title">Title</DialogTitle>
  <DialogContent id="dialog-description">Content</DialogContent>
</Dialog>
```

### Socket.IO Pattern

**Connect on authentication**:

```javascript
import { useEffect } from "react";
import socketService from "../services/socketService";

const useSocket = () => {
  useEffect(() => {
    socketService.connect();
    return () => {
      socketService.disconnect();
    };
  }, []);

  return {
    on: (event, handler) => socketService.on(event, handler),
    off: (event, handler) => socketService.off(event, handler),
    emit: (event, data) => socketService.emit(event, data),
  };
};
```

**Subscribe to rooms** (user, department, organization)

**Use `useSocket` hook** in components

### Performance Optimization

**React.memo for Card components**:

```javascript
const TaskCard = React.memo(({ task, onClick }) => {
  // Component implementation
});

TaskCard.displayName = "TaskCard";
```

**useCallback for event handlers**:

```javascript
const handleClick = useCallback(() => {
  onClick(task);
}, [task, onClick]);
```

**useMemo for computed values**:

```javascript
const formattedDate = useMemo(() => {
  return dayjs(task.createdAt).format("MMM DD, YYYY");
}, [task.createdAt]);
```

### Constants

**MUST mirror backend exactly**:

```javascript
// client/src/utils/constants.js
export const USER_ROLES = {
  SUPER_ADMIN: "SuperAdmin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  USER: "User",
};

export const TASK_STATUS = ["To Do", "In Progress", "Completed", "Pending"];
export const TASK_PRIORITY = ["Low", "Medium", "High", "Urgent"];
```

**Import from `client/src/utils/constants.js` - NEVER hardcode values**

## Development Commands

### Backend (run from `backend/` directory)

```bash
npm run dev          # Development with nodemon
npm start            # Production server
npm test             # All tests
npm run test:unit    # Unit tests only
npm run test:property # Property-based tests
npm run verify:env   # Verify environment variables
```

### Frontend (run from `client/` directory)

```bash
npm run dev          # Vite dev server with HMR
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint check
```

## Environment Variables

### Backend (`backend/.env`)

**Required**:

- `MONGODB_URI` - Database connection string
- `JWT_ACCESS_SECRET` - Access token secret (min 32 chars)
- `JWT_REFRESH_SECRET` - Refresh token secret (min 32 chars)
- `PORT` - Server port (default: 4000)
- `CLIENT_URL` - Frontend URL for CORS
- `NODE_ENV` - development/production

**Email**:

- `EMAIL_USER` - Gmail email address
- `EMAIL_PASSWORD` - Gmail app password
- `EMAIL_FROM` - From address for emails

**Optional**:

- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `LOG_LEVEL` - Logging level (default: info)
- `RATE_LIMIT_WINDOW_MS` - Rate limit window (default: 900000)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 100)

### Frontend (`client/.env`)

**Required**:

- `VITE_API_URL` - Backend API URL (e.g., http://localhost:4000/api)

**Optional**:

- `VITE_PLATFORM_ORG` - Platform organization ID
- `VITE_CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `VITE_CLOUDINARY_UPLOAD_PRESET` - Cloudinary upload preset

## Production Build & Deployment

### Build Process

1. **Build frontend**: `cd client && npm run build` (outputs to `client/dist/`)
2. **Backend serves static files** from `../client/dist/` in production
3. **Start backend**: `cd backend && npm start`

### Production Configuration

- Backend serves frontend static files
- Single server deployment
- Environment-specific configurations
- SSL/TLS certificates
- PM2 or systemd for process management
- Nginx reverse proxy (optional)

## Code Style Conventions

### Imports

**Group by**: external, internal, relative

**Use named exports**:

```javascript
// ✅ CORRECT
export const getResource = () => {};
export const createResource = () => {};

// ❌ WRONG
export default { getResource, createResource };
```

### Error Handling

**Use `CustomError` class** with typed methods:

```javascript
throw CustomError.validation("Invalid input");
throw CustomError.authentication("Invalid credentials");
throw CustomError.authorization("Insufficient permissions");
throw CustomError.notFound("Resource not found");
throw CustomError.conflict("Resource already exists");
throw CustomError.internal("Unexpected error");
```

### Logging

**Use winston logger** with appropriate levels (error, warn, info, debug)

**NOT console.log** in production code

### Constants

**NEVER hardcode** magic strings/numbers

**Import from `utils/constants.js`**

### Pagination

**Backend**: 1-based page numbers (page=1 is first page)

**Frontend DataGrid**: 0-based page numbers (page=0 is first page)

**Auto-converted in RTK Query**: Frontend sends `page + 1` to backend

## Architecture Patterns

### Monorepo Layout

```
backend/    # Node.js/Express API server
client/     # React/Vite frontend
docs/       # Documentation
```

### Development Servers

- **Backend**: http://localhost:4000
- **Frontend**: http://localhost:3000 or http://localhost:5173

### Production Deployment

- Backend serves frontend static files
- Single server deployment
- Environment-specific configurations

### Database

- MongoDB with Mongoose ODM
- Pagination plugin for all list endpoints
- Soft delete plugin for all models
- Discriminators for task types

### State Management

- Redux Toolkit with persistence for auth state
- RTK Query for API calls and caching

### Real-Time Communication

- Socket.IO for bidirectional communication
- Room-based broadcasting (user, department, organization)
- Automatic reconnection with exponential backoff

## Critical Rules Summary

### Backend

1. ES Modules (`import`/`export`)
2. Async handlers with `express-async-handler`
3. `dayjs` for dates
4. Constants from `utils/constants.js`
5. Winston logger (not console.log)
6. Mongoose sessions for transactions
7. Soft delete plugin on ALL models
8. Discriminators for task types
9. Validators are source of truth
10. Socket.IO singleton pattern

### Frontend

1. RTK Query for API calls
2. NO `watch()` in react-hook-form
3. MUI v7 `size` prop (not `item`)
4. `dayjs` for dates
5. Constants from `utils/constants.js`
6. React.memo, useCallback, useMemo
7. Socket.IO on auth
8. Token refresh on 401
9. Error boundaries
10. Lazy loading

### Security

1. JWT in HTTP-only cookies
2. Bcrypt ≥12 salt rounds
3. Helmet security headers
4. CORS with credentials
5. NoSQL injection prevention
6. Rate limiting in production
7. Password reset token hashing
8. Email enumeration prevention

### Testing

1. Jest with ES modules
2. Real MongoDB (NOT mongodb-memory-server)
3. Run with `--runInBand`
4. Supertest for API testing
5. Fast-check for property-based testing
6. Coverage goals: 80%+ statements, 75%+ branches
