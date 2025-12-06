---
inclusion: always
---

# Technology Stack & Configuration

## Critical Project Requirements, Design and Tasks:

> **To install any new packages that doesn't exist in backend/package.json and client/package.json, ask the user as yes or no. If the user provide yes, install the package and proceed accordingly and if the user provide no, then proceed to validate and correct without using a package.**
>
> **The existing codebase MUST be respected.** Do not impose arbitrary patterns. Work WITH the existing architecture, not against it.

## Backend Stack

### Runtime & Framework

- **Node.js**: ES modules (`"type": "module"` in package.json)
- **Express.js**: ^4.21.2 - Web application framework
- **Version**: 1.0.0

### Database & ODM

- **MongoDB**: NoSQL database
- **Mongoose**: ^8.19.1 - MongoDB object modeling
- **mongoose-paginate-v2**: ^1.9.1 - Pagination plugin
- **Custom Plugins**: softDelete plugin (`models/plugins/softDelete.js`)

**MongoDB Connection Configuration:**

- **Server Selection Timeout**: 5000ms - Time to wait for server selection
- **Socket Timeout**: 45000ms - Time to wait for socket operations
- **Max Pool Size**: 10 - Maximum number of connections in the pool
- **Min Pool Size**: 2 - Minimum number of connections maintained
- **Retry Strategy**: Exponential backoff with max 30s delay
- **Connection Monitoring**: Health check every 30 seconds
- **Auto-Reconnect**: Automatic reconnection on disconnection

**Connection States:**

- 0: disconnected
- 1: connected
- 2: connecting
- 3: disconnecting

### Authentication & Security

- **jsonwebtoken**: ^9.0.2 - JWT token generation/verification
- **bcrypt**: ^6.0.0 - Password hashing (≥12 salt rounds)
- **cookie-parser**: ^1.4.7 - Parse HTTP-only cookies
- **helmet**: ^8.1.0 - Security headers (CSP, HSTS in production)
- **cors**: ^2.8.5 - Cross-origin resource sharing
- **express-mongo-sanitize**: ^2.2.0 - NoSQL injection prevention
- **express-rate-limit**: ^8.1.0 - Rate limiting (production only)

**JWT Configuration:**

- **Access Token**: 15 minutes expiry
- **Refresh Token**: 7 days expiry
- **Storage**: HTTP-only, secure, sameSite cookies
- **Token Rotation**: Refresh token rotates on each refresh

**Cookie Configuration:**

- **httpOnly**: true - Prevents JavaScript access
- **secure**: true (production) - HTTPS only
- **sameSite**: 'strict' - CSRF protection
- **path**: '/' - Available on all routes

**Password Security:**

- **Algorithm**: bcrypt
- **Salt Rounds**: ≥12 (configurable)
- **Min Length**: 8 characters

### Validation

- **express-validator**: ^7.2.1 - Request validation
- **validator**: ^13.15.15 - String validation utilities
- **Custom Validators**: `middlewares/validators/*` for each resource

### Real-time Communication

- **socket.io**: ^4.8.1 - WebSocket server
- **Singleton Pattern**: `utils/socketInstance.js` manages single instance
- **Event Handlers**: `utils/socket.js`, `utils/socketEmitter.js`

**Socket.IO Configuration:**

- **Authentication**: HTTP-only cookies (same JWT as HTTP)
- **CORS**: Same configuration as Express CORS
- **Transports**: WebSocket, polling (fallback)
- **Reconnection**: Client-side automatic reconnection
- **Rooms**: User, department, and organization-based rooms

**Room Structure:**

- `user:${userId}` - User-specific events
- `department:${departmentId}` - Department-wide events
- `organization:${organizationId}` - Organization-wide events

**Event Types:**

- Task events: `task:created`, `task:updated`, `task:deleted`, `task:restored`
- Activity events: `activity:created`, `activity:updated`
- Comment events: `comment:created`, `comment:updated`, `comment:deleted`
- Notification events: `notification:created`
- User status: `user:online`, `user:offline`, `user:away`

### Email

- **nodemailer**: ^7.0.9 - Email sending
- **SMTP**: Gmail SMTP with app passwords
- **Queue-Based**: Asynchronous email sending
- **Templates**: HTML email templates in `templates/emailTemplates.js`

**Email Service Configuration:**

- **Provider**: Gmail SMTP
- **Host**: smtp.gmail.com
- **Port**: 587 (TLS)
- **Authentication**: App-specific passwords (not regular Gmail password)
- **Queue**: In-memory queue for async sending
- **Retry**: Automatic retry on failure
- **Templates**: HTML templates with variable substitution

**Email Types:**

- Task notifications (created, updated, deleted, restored)
- User mentions in comments
- Welcome emails for new users
- System announcements

### Utilities

- **dayjs**: ^1.11.18 - Date manipulation (with UTC and timezone plugins)
- **dotenv**: ^17.2.3 - Environment variable management
- **compression**: ^1.8.1 - Response compression (gzip)
- **express-async-handler**: ^1.2.0 - Async error handling

**Compression Configuration:**

- **Algorithm**: gzip
- **Threshold**: 1KB - Only compress responses larger than 1KB
- **Level**: Default (6) - Balance between speed and compression ratio

**Request Handling:**

- **Body Parser**: JSON and URL-encoded
- **Size Limit**: 10MB - For file upload support
- **Extended URL Encoding**: true - Supports nested objects

**Date/Time Configuration:**

- **Timezone**: UTC (enforced via process.env.TZ)
- **Storage**: All dates stored in UTC
- **API Responses**: ISO 8601 format
- **Plugins**: dayjs-utc, dayjs-timezone

### Logging

- **winston**: ^3.18.3 - Structured logging with file and console transports
- **morgan**: ^1.10.1 - HTTP request logger (development only)

### Development Tools

- **nodemon**: ^3.1.10 - Auto-restart on file changes

### Testing Tools

- **jest**: ^30.2.0 - Testing framework
- **@jest/globals**: ^30.2.0 - Jest global functions
- **jest-circus**: ^30.2.0 - Jest test runner
- **supertest**: ^7.1.4 - HTTP assertion library
- **fast-check**: ^4.3.0 - Property-based testing library
- **mongodb-memory-server**: ^10.3.0 - In-memory MongoDB for testing

### Backend Scripts

```json
{
  "start": "node server.js",
  "start:prod": "NODE_ENV=production node server.js",
  "dev": "nodemon server.js",
  "server": "nodemon server.js",
  "verify:env": "node scripts/verifyEnv.js",
  "test": "node --experimental-vm-modules --no-warnings node_modules/jest/bin/jest.js --runInBand",
  "test:watch": "node --experimental-vm-modules --no-warnings node_modules/jest/bin/jest.js --watch --runInBand",
  "test:coverage": "node --experimental-vm-modules --no-warnings node_modules/jest/bin/jest.js --coverage --runInBand",
  "test:property": "node --experimental-vm-modules --no-warnings node_modules/jest/bin/jest.js --testNamePattern='Property' --runInBand",
  "test:unit": "node --experimental-vm-modules --no-warnings node_modules/jest/bin/jest.js --testPathIgnorePatterns='property' --runInBand"
}
```

**Development (port 4000):**

```bash
cd backend
npm run dev          # nodemon with auto-restart
npm run server       # alias for dev
```

**Production:**

```bash
cd backend
npm run start:prod   # NODE_ENV=production
npm start            # default production
```

**Testing:**

```bash
cd backend
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:property # Run only property-based tests
npm run test:unit    # Run only unit tests
```

**Environment Validation:**

```bash
cd backend
npm run verify:env   # Validate environment variables
```

## Frontend Stack

### Framework & Build Tool

- **React**: ^19.1.1 - UI library with concurrent features
- **React DOM**: ^19.1.1 - React renderer for web
- **Vite**: ^7.1.7 - Next-generation build tool and dev server
- **@vitejs/plugin-react-swc**: ^4.1.0 - SWC-based React plugin for fast refresh

**Vite Features:**

- **Lightning Fast HMR**: Hot Module Replacement with instant updates
- **ES Modules**: Native ESM-based dev server
- **Optimized Build**: Rollup-based production builds
- **Plugin System**: Extensible via plugins
- **TypeScript Support**: Built-in TypeScript support

### UI Framework

**Material-UI (MUI) v7.3.4** - Complete component library with breaking changes from v6

**Core Packages:**

- `@mui/material`: ^7.3.4 - Core components (Button, TextField, Dialog, etc.)
- `@mui/icons-material`: ^7.3.4 - 2000+ Material Design icons
- `@mui/lab`: ^7.0.1-beta.18 - Experimental components (LoadingButton, etc.)
- `@mui/x-data-grid`: ^8.14.1 - Advanced DataGrid with pagination, sorting, filtering
- `@mui/x-date-pickers`: ^8.14.1 - Date and time picker components
- `@mui/x-charts`: ^8.14.1 - Chart components (Line, Bar, Pie, etc.)

**Styling Engine:**

- `@emotion/react`: ^11.14.0 - CSS-in-JS library for styling
- `@emotion/styled`: ^11.14.1 - Styled components API
- `@fontsource/inter`: ^5.2.8 - Inter font family (self-hosted)

**MUI v7 Breaking Changes:**

- **Grid Component**: `item` prop removed, use `size` prop instead
  - Old: `<Grid item xs={12} md={6}>`
  - New: `<Grid size={{ xs: 12, md: 6 }}>`
- **Autocomplete**: `renderTags` deprecated, use `slots` API
- **Dialog**: Requires accessibility props (disableEnforceFocus, disableRestoreFocus, aria-labelledby, aria-describedby)

**MUI Configuration:**

- **Theme System**: Custom theme with light/dark mode support
- **Component Overrides**: Global style overrides in `theme/customizations/`
- **Responsive Breakpoints**: xs (0px), sm (600px), md (900px), lg (1200px), xl (1536px)
- **Typography**: Inter font family with 8 variants (h1-h6, body1, body2)
- **Color Palette**: Primary, secondary, error, warning, info, success colors

### State Management

**Redux Toolkit**: ^2.9.0 - Official Redux toolset with simplified API

**Core Features:**

- **configureStore**: Simplified store setup with good defaults
- **createSlice**: Combines reducers and actions
- **createAsyncThunk**: Handles async logic
- **RTK Query**: Built-in data fetching and caching

**Redux Packages:**

- `@reduxjs/toolkit`: ^2.9.0 - Redux Toolkit core
- `react-redux`: ^9.2.0 - React bindings for Redux
- `redux-persist`: ^6.0.0 - Persist and rehydrate Redux state

**RTK Query Configuration:**

- **Base API**: Configured in `redux/features/api.js`
- **Endpoints**: 8 resource APIs (auth, user, organization, department, task, material, vendor, notification)
- **Cache Tags**: Automatic cache invalidation with tags
- **Transformations**: Response and request transformations
- **Error Handling**: Automatic error handling with toast notifications

**Redux Store Structure:**

```javascript
{
  api: {}, // RTK Query cache
  auth: {
    user: null,
    isAuthenticated: false,
    isLoading: false
  }
}
```

**Persisted State:**

- `auth` slice - User authentication state
- Storage: localStorage
- Whitelist: Only auth slice persisted

### Routing

**React Router**: ^7.9.4 - Declarative routing for React

**Router Features:**

- **Nested Routes**: Hierarchical route structure
- **Lazy Loading**: Code splitting with React.lazy()
- **Protected Routes**: Authentication and authorization guards
- **Route Parameters**: Dynamic route segments
- **Query Parameters**: URL search params
- **Navigation**: Programmatic navigation with useNavigate
- **Error Boundaries**: Route-level error handling

**Route Configuration:**

- **Public Routes**: Home, Login, Register, Forgot Password
- **Protected Routes**: Dashboard, Tasks, Users, Materials, Vendors, etc.
- **Admin Routes**: Organizations, Departments (role-based)
- **Platform Routes**: Platform organization management (SuperAdmin only)

**Lazy Loading Pattern:**

```javascript
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tasks = lazy(() => import("./pages/Tasks"));
```

### Forms

**react-hook-form**: ^7.65.0 - Performant form library with easy validation

**Form Features:**

- **Uncontrolled Components**: Better performance with less re-renders
- **Validation**: Built-in validation with custom rules
- **Error Handling**: Field-level and form-level errors
- **Controller**: Wrapper for controlled components (MUI)
- **Watch**: NEVER use watch() method (use controlled components instead)

**Form Patterns:**

- **Create/Update Forms**: Single component for both create and edit
- **Multi-Step Forms**: Registration wizard with steps
- **Validation**: Client-side validation matching backend rules
- **Submission**: Async submission with loading states

**Critical Rule**: NEVER use `watch()` method - always use controlled components with `Controller`

### HTTP & Real-time

**HTTP Client:**

- `axios`: ^1.12.2 - Promise-based HTTP client
- **Base URL**: Configured via `VITE_API_URL` environment variable
- **Credentials**: Includes cookies for authentication
- **Interceptors**: Request/response interceptors for error handling

**Real-time Communication:**

- `socket.io-client`: ^4.8.1 - WebSocket client for real-time updates
- **Connection**: Automatic connection on app mount
- **Reconnection**: Exponential backoff (1s to 5s, max 5 attempts)
- **Authentication**: HTTP-only cookies (same as HTTP)
- **Rooms**: User, department, and organization rooms
- **Events**: Task, activity, comment, notification events

**Socket.IO Configuration:**

```javascript
{
  withCredentials: true,
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  transports: ['websocket', 'polling']
}
```

### Notifications & Feedback

**Toast Notifications:**

- `react-toastify`: ^11.0.5 - Toast notification library
- **Position**: Top-right corner
- **Auto-close**: 3 seconds (configurable)
- **Types**: Success, error, warning, info
- **Styling**: Custom styling with MUI theme colors

**Error Boundaries:**

- `react-error-boundary`: ^6.0.0 - Error boundary component
- **Component-level**: ErrorBoundary.jsx for component errors
- **Route-level**: RouteError.jsx for routing errors
- **Fallback UI**: User-friendly error messages with reload option

### Date Handling

**Date Library:**

- `dayjs`: ^1.11.18 - Lightweight date manipulation (same as backend)
- **Plugins**: UTC, timezone, relativeTime, customParseFormat
- **Format**: ISO 8601 for API communication
- **Display**: Localized formats for UI

**Date Pickers:**

- `@mui/x-date-pickers`: ^8.14.1 - MUI date picker components
- **Components**: DatePicker, DateTimePicker, DateRangePicker
- **Timezone**: Automatic UTC to local conversion
- **Validation**: Min/max date validation

### Media & File Handling

**File Upload:**

- `react-dropzone`: ^14.3.8 - Drag-and-drop file upload
- **Cloudinary**: Direct upload to Cloudinary
- **Validation**: File type and size validation
- **Preview**: Image preview before upload

**Photo Gallery:**

- `react-photo-album`: ^3.2.1 - Responsive photo gallery
- `yet-another-react-lightbox`: ^3.25.0 - Lightbox for image viewing
- **Features**: Zoom, navigation, thumbnails

### Development Tools

**Linting:**

- `eslint`: ^9.36.0 - JavaScript linter
- `@eslint/js`: ^9.36.0 - ESLint JavaScript config
- `eslint-plugin-react-hooks`: ^5.2.0 - React hooks rules
- `eslint-plugin-react-refresh`: ^0.4.22 - React refresh rules
- `globals`: ^16.4.0 - Global variables for ESLint

**TypeScript Types:**

- `@types/react`: ^19.1.16 - React type definitions (IDE support)
- `@types/react-dom`: ^19.1.9 - React DOM type definitions (IDE support)
- **Note**: Project uses JavaScript, types are for IDE IntelliSense only

**Build Tools:**

- `terser`: ^5.44.1 - JavaScript minifier for production builds

### Frontend Scripts

```json
{
  "dev": "vite",
  "build": "vite build",
  "build:prod": "NODE_ENV=production vite build",
  "lint": "eslint .",
  "preview": "vite preview"
}
```

**Development (port 3000):**

```bash
cd client
npm run dev          # Vite dev server with HMR
```

**Production Build:**

```bash
cd client
npm run build:prod   # Production build → dist/
npm run build        # Standard build
npm run preview      # Preview production build locally
```

**Linting:**

```bash
cd client
npm run lint         # Run ESLint on all files
```

### Vite Configuration

**Development Server:**

- **Port**: 3000
- **HMR**: Hot Module Replacement enabled
- **Fast Refresh**: React Fast Refresh for instant updates
- **Proxy**: Not needed (CORS configured on backend)

**Build Configuration:**

```javascript
{
  outDir: 'dist',
  sourcemap: false,
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,      // Remove console.log in production
      drop_debugger: true      // Remove debugger statements
    }
  },
  chunkSizeWarningLimit: 1000  // Warn if chunk > 1000KB
}
```

**Code Splitting (Manual Chunks):**

```javascript
{
  'vendor-react': ['react', 'react-dom', 'react-router'],
  'vendor-mui': ['@mui/material', '@mui/icons-material'],
  'vendor-redux': ['@reduxjs/toolkit', 'react-redux', 'redux-persist']
}
```

**Build Optimization:**

- **Terser Minification**: Removes console.log and debugger statements
- **Tree Shaking**: Automatic dead code elimination
- **Code Splitting**: Vendor chunks for better caching
- **Asset Optimization**: Image and font optimization
- **Chunk Size Limit**: 1000KB warning threshold

**Preview Server:**

- **Port**: 3000
- **Purpose**: Preview production build locally before deployment

## Environment Variables

### Backend (`backend/.env`)

**Required:**

- `MONGODB_URI` - MongoDB connection string
- `JWT_ACCESS_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens

**Optional:**

- `PORT` - Server port (default: 4000)
- `CLIENT_URL` - Frontend URL for CORS (default: http://localhost:3000)
- `NODE_ENV` - Environment (development/production)
- `INITIALIZE_SEED_DATA` - Run seed data on startup ("true"/"false")

**Email Configuration:**

- `EMAIL_USER` - Gmail email address
- `EMAIL_PASSWORD` - Gmail app password
- `EMAIL_FROM` - From email address

**Example:**

```env
# Database
MONGODB_URI=mongodb://localhost:27017/task-manager

# JWT Secrets
JWT_ACCESS_SECRET=your-access-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Server
PORT=4000
CLIENT_URL=http://localhost:3000
NODE_ENV=development

# Seed Data
INITIALIZE_SEED_DATA=true

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Task Manager <noreply@taskmanager.com>
```

### Frontend (`client/.env`)

**Required:**

- `VITE_API_URL` - Backend API URL
- `VITE_PLATFORM_ORG` - Platform organization ID

**Example:**

```env
VITE_API_URL=http://localhost:4000/api
VITE_PLATFORM_ORG=000000000000000000000000
```

**Access in Code:**

```javascript
import.meta.env.VITE_API_URL;
import.meta.env.VITE_PLATFORM_ORG;
import.meta.env.DEV; // true in development
import.meta.env.PROD; // true in production
```

## Critical Configurations

### Pagination (Backend ↔ Frontend Mismatch)

**Backend (mongoose-paginate-v2)**: 1-based pages

```javascript
{
  [resource]: [],
  pagination: {
    page: 1,           // 1-based
    limit: 10,
    totalCount: 100,
    totalPages: 10,
    hasNext: true,
    hasPrev: false
  }
}
```

**Frontend (MUI DataGrid)**: 0-based pages

```javascript
{
  page: 0,             // 0-based
  pageSize: 10
}
```

**MUST Convert:**

- Frontend → Backend: `page + 1`
- Backend → Frontend: `page - 1`

**MuiDataGrid Component**: Automatically handles conversion

**Page Size Options:**

```javascript
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  DEFAULT_SORT_BY: "createdAt",
  DEFAULT_SORT_ORDER: "desc",
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],
  MAX_LIMIT: 100,
};
```

### Socket.IO Configuration

**Backend Setup:**

1. **Initialization** (`server.js`):

```javascript
import { createServer } from "http";
import { initializeSocket } from "./utils/socketInstance.js";

const httpServer = createServer(app);
initializeSocket(httpServer);
httpServer.listen(PORT);
```

2. **Singleton** (`utils/socketInstance.js`):

```javascript
let io = null;

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: corsOptions,
  });
  setupSocketHandlers(io);
};

export const getIO = () => io;
```

3. **Event Handlers** (`utils/socket.js`):

- Connection/disconnection
- Room joining (user, department, organization)
- User status updates

4. **Event Emitters** (`utils/socketEmitter.js`):

- Task events (created, updated, deleted, restored)
- Activity events
- Comment events
- Notification events

**Frontend Setup:**

1. **Service** (`services/socketService.js`):

```javascript
import { io } from "socket.io-client";

const socket = io(ENV.API_URL.replace("/api", ""), {
  withCredentials: true,
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});
```

2. **Hook** (`hooks/useSocket.js`):

```javascript
const useSocket = () => {
  const connect = () => socketService.connect();
  const disconnect = () => socketService.disconnect();
  const on = (event, handler) => socketService.on(event, handler);
  const off = (event, handler) => socketService.off(event, handler);

  return { connect, disconnect, on, off };
};
```

3. **Event Handlers** (`services/socketEvents.js`):

- Task events → invalidate task cache
- Activity events → invalidate activity cache
- Comment events → invalidate comment cache
- Notification events → show toast, invalidate notification cache

**CORS Configuration** (`config/corsOptions.js`):

```javascript
{
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}
```

**Authentication:**

- HTTP-only cookies automatically sent with Socket.IO handshake
- No manual token passing required
- Server verifies JWT from cookies

**Room Management:**

- User room: `user:${userId}`
- Department room: `department:${departmentId}`
- Organization room: `organization:${organizationId}`

### Security Middleware Order (`backend/app.js`)

**CRITICAL: Order matters for security!**

1. **helmet** - Security headers

   - Content Security Policy (CSP) - Controls resource loading
   - HTTP Strict Transport Security (HSTS) - Enforces HTTPS (production)
   - X-Frame-Options: deny - Prevents clickjacking
   - X-Content-Type-Options: nosniff - Prevents MIME sniffing
   - X-XSS-Protection: enabled - Browser XSS filter
   - Referrer-Policy: strict-origin-when-cross-origin
   - X-DNS-Prefetch-Control: off
   - X-Download-Options: noopen (IE)
   - X-Permitted-Cross-Domain-Policies: none
   - Hide X-Powered-By header

2. **cors** - Cross-origin resource sharing

   - Origin validation with logging
   - Credentials enabled for cookies
   - Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
   - Allowed headers: Content-Type, Authorization, X-Requested-With
   - Exposed headers: X-Request-ID, X-RateLimit-\*
   - Preflight cache: 24 hours
   - No wildcard origins in production

3. **cookieParser** - Parse cookies

   - Required before authentication middleware
   - Parses HTTP-only cookies for JWT

4. **express.json** - Parse JSON bodies

   - 10mb limit for file uploads
   - URL-encoded support with extended: true

5. **mongoSanitize** - NoSQL injection prevention

   - Removes `$` and `.` from user input
   - Prevents MongoDB operator injection

6. **compression** - Response compression

   - Gzip compression for responses >1KB
   - Improves performance for large payloads

7. **rateLimiter** - Rate limiting (production only)
   - General API: 100 requests per 15 minutes per IP
   - Auth endpoints: 5 requests per 15 minutes per IP
   - Prevents brute-force attacks

**Example:**

```javascript
// Security headers
app.use(
  helmet({
    /* config */
  })
);

// CORS with validation
app.use(cors(corsOptions));

// Request parsing
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Input sanitization
app.use(mongoSanitize());

// Response compression
app.use(compression({ threshold: 1024 }));

// Request ID for tracing
app.use((req, res, next) => {
  req.id = randomUUID();
  res.setHeader("X-Request-ID", req.id);
  next();
});

// Rate limiting (production only)
if (process.env.NODE_ENV === "production") {
  app.use("/api", apiLimiter);
}
```

### Error Handling

**Backend:**

1. **Custom Error Class** (`errorHandler/CustomError.js`):

```javascript
class CustomError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
  }
}
```

2. **Global Error Handler** (`errorHandler/ErrorController.js`):

```javascript
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";

  res.status(statusCode).json({
    success: false,
    message: err.message,
    errorCode,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
```

3. **Usage:**

```javascript
throw new CustomError("User not found", 404, "NOT_FOUND_ERROR");
```

**Frontend:**

1. **Custom Error Class** (`utils/errorHandler.js`):

```javascript
class AppError extends Error {
  constructor(message, code, severity, type) {
    super(message);
    this.code = code;
    this.severity = severity;
    this.type = type;
  }
}
```

2. **Error Boundaries**:

   - `components/common/ErrorBoundary.jsx` - Component-level errors
   - `components/common/RouteError.jsx` - Route-level errors

3. **Toast Notifications**:
   - react-toastify for user-facing error messages
   - Automatic error handling in RTK Query

### MUI v7 Syntax

**Grid Component (BREAKING CHANGE):**

❌ **Deprecated (MUI v5/v6):**

```jsx
<Grid container>
  <Grid item xs={12} md={6}>
    Content
  </Grid>
</Grid>
```

✅ **Correct (MUI v7):**

```jsx
<Grid container>
  <Grid size={{ xs: 12, md: 6 }}>Content</Grid>
</Grid>
```

**Autocomplete Component:**

❌ **Deprecated:**

```jsx
<Autocomplete
  renderTags={(value, getTagProps) =>
    value.map((option, index) => (
      <Chip {...getTagProps({ index })} label={option} />
    ))
  }
/>
```

✅ **Correct:**

```jsx
<Autocomplete
  slots={{
    tag: CustomTag,
  }}
/>
```

**Dialog Component (Accessibility):**

✅ **Required Props:**

```jsx
<Dialog
  disableEnforceFocus
  disableRestoreFocus
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
  <DialogTitle id="dialog-title">Title</DialogTitle>
  <DialogContent id="dialog-description">Content</DialogContent>
</Dialog>
```

## Build & Deployment

### Production Build Process

1. **Frontend Build:**

```bash
cd client
npm run build:prod
# Output: client/dist/
```

2. **Backend Serves Frontend:**

```javascript
// backend/app.js (production only)
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
  });
}
```

3. **Start Production Server:**

```bash
cd backend
npm run start:prod
# Serves both API and frontend on port 4000
```

### Vite Build Configuration

**Code Splitting:**

```javascript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom', 'react-router'],
        'vendor-mui': ['@mui/material', '@mui/icons-material'],
        'vendor-redux': ['@reduxjs/toolkit', 'react-redux']
      }
    }
  }
}
```

**Optimization:**

- **Terser Minification**: Removes console.log and debugger statements
- **Chunk Size Limit**: 1000KB warning threshold
- **Source Maps**: Disabled in production
- **Tree Shaking**: Automatic dead code elimination

**Build Output:**

```
client/dist/
├── assets/
│   ├── vendor-react.[hash].js
│   ├── vendor-mui.[hash].js
│   ├── vendor-redux.[hash].js
│   ├── index.[hash].js
│   └── index.[hash].css
└── index.html
```

### Logging Configuration

**Winston Logger** (`utils/logger.js`):

- **Transports**: Console and file-based logging
- **Log Levels**: error, warn, info, http, verbose, debug, silly
- **File Rotation**: Separate files for errors and combined logs
- **Format**: JSON in production, colorized in development
- **Files**:
  - `logs/error.log` - Error-level logs only
  - `logs/combined.log` - All logs

**Log Categories:**

- **Startup**: Server initialization, environment validation
- **Database**: MongoDB connection, disconnection, errors
- **Socket**: Socket.IO initialization, connections
- **Email**: Email service initialization, sending
- **Shutdown**: Graceful shutdown process
- **Error**: Application errors with stack traces

**Morgan HTTP Logger** (development only):

- **Format**: 'dev' - Colorized, concise output
- **Usage**: HTTP request logging in development
- **Disabled**: In production (use Winston instead)

## Testing

**Testing Framework**: Jest with ES modules support

**Test Types:**

- **Unit Tests**: Test individual functions and modules
- **Integration Tests**: Test API endpoints with Supertest
- **Property-Based Tests**: Test properties with fast-check

**Test Configuration:**

- **Runner**: Jest with experimental VM modules
- **Flags**: `--experimental-vm-modules --no-warnings`
- **Execution**: `--runInBand` for sequential execution
- **Coverage**: Istanbul coverage reports

**Test Database:**

- **mongodb-memory-server**: In-memory MongoDB for testing
- **Isolation**: Each test suite gets fresh database
- **Cleanup**: Automatic cleanup after tests

**Backend Test Scripts:**

```json
{
  "test": "jest --runInBand",
  "test:watch": "jest --watch --runInBand",
  "test:coverage": "jest --coverage --runInBand",
  "test:property": "jest --testNamePattern='Property' --runInBand",
  "test:unit": "jest --testPathIgnorePatterns='property' --runInBand"
}
```

**Frontend Test Script:**

```json
"test": "echo \"Error: no test specified\" && exit 1"
```

**Future Frontend Recommendations:**

- Vitest + React Testing Library
- E2E: Playwright or Cypress

## Development Workflow

### Local Development

1. **Start MongoDB:**

```bash
mongod
```

2. **Start Backend (Terminal 1):**

```bash
cd backend
npm run dev
# Runs on http://localhost:4000
```

3. **Start Frontend (Terminal 2):**

```bash
cd client
npm run dev
# Runs on http://localhost:3000
```

4. **Access Application:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
- Socket.IO: ws://localhost:4000

### Seed Data

**Initialize seed data on startup:**

```env
INITIALIZE_SEED_DATA=true
```

**Seed data includes:**

- Platform organization
- Sample organizations
- Departments
- Users (all roles)
- Tasks (all types)
- Materials
- Vendors
- Notifications

**File**: `backend/mock/cleanSeedSetup.js`

### Hot Module Replacement (HMR)

**Frontend (Vite):**

- Instant updates without full page reload
- Preserves component state
- Fast refresh for React components

**Backend (Nodemon):**

- Auto-restart on file changes
- Watches all `.js` files
- Ignores `node_modules/`

## Performance Optimizations

### Backend

- **Compression**: Gzip compression for responses
- **Lean Queries**: Mongoose lean queries for read-only data
- **Pagination**: Server-side pagination for all list endpoints
- **Indexing**: MongoDB indexes on frequently queried fields
- **Connection Pooling**: MongoDB connection pooling

### Frontend

- **Code Splitting**: Lazy loading for routes
- **React.memo**: Memoized components for lists/cards
- **useCallback**: Memoized callbacks for event handlers
- **useMemo**: Memoized computed values
- **Redux Persist**: Persist only essential state
- **Image Optimization**: Cloudinary for image hosting

## Deployment

### Prerequisites

**System Requirements:**

- **Node.js**: v20.x LTS or higher
- **MongoDB**: v7.0 or higher
- **npm**: v10.x or higher
- **Operating System**: Linux (Ubuntu 20.04+), macOS, or Windows 10+
- **Memory**: Minimum 2GB RAM (4GB+ recommended)
- **Storage**: Minimum 10GB free space

**Production Server Requirements:**

- **HTTPS**: SSL/TLS certificate required
- **Domain**: Registered domain name
- **Firewall**: Ports 80 (HTTP), 443 (HTTPS), 27017 (MongoDB - internal only)
- **Process Manager**: PM2 or systemd for Node.js process management
- **Reverse Proxy**: Nginx or Apache (recommended)

### Deployment Steps

**1. Clone Repository:**

```bash
git clone <repository-url>
cd task-manager
```

**2. Install Dependencies:**

```bash
# Backend dependencies
cd backend
npm ci --production

# Frontend dependencies
cd ../client
npm ci
```

**3. Configure Environment Variables:**

```bash
# Backend environment
cd backend
cp .env.example .env
# Edit .env with production values
```

**Required Production Environment Variables:**

```env
# Database
MONGODB_URI=mongodb://username:password@host:27017/task-manager?authSource=admin

# JWT Secrets (use strong random strings)
JWT_ACCESS_SECRET=<generate-strong-secret-min-32-chars>
JWT_REFRESH_SECRET=<generate-strong-secret-min-32-chars>

# Server
PORT=4000
CLIENT_URL=https://yourdomain.com
NODE_ENV=production

# Email (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=<gmail-app-password>
EMAIL_FROM=Task Manager <noreply@yourdomain.com>

# Seed Data (false for production)
INITIALIZE_SEED_DATA=false
```

**Frontend environment:**

```env
VITE_API_URL=https://yourdomain.com/api
VITE_PLATFORM_ORG=<platform-organization-id>
```

**4. Build Frontend:**

```bash
cd client
npm run build:prod
# Output: client/dist/
```

**5. Start Production Server:**

**Option A: Direct Node.js**

```bash
cd backend
npm run start:prod
```

**Option B: PM2 (Recommended)**

```bash
cd backend
pm2 start server.js --name task-manager-api -i max
pm2 save
pm2 startup
```

**Option C: systemd Service**

Create `/etc/systemd/system/task-manager.service`:

```ini
[Unit]
Description=Task Manager API
After=network.target mongodb.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/task-manager/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable task-manager
sudo systemctl start task-manager
sudo systemctl status task-manager
```

### Nginx Configuration

**Reverse Proxy Setup:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API proxy
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Ford_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO proxy
    location /socket.io {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files (frontend)
    location / {
        root /var/www/task-manager/client/dist;
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;
}
```

### Environment-Specific Settings

**Development:**

- `NODE_ENV=development`
- Detailed error messages with stack traces
- Morgan HTTP logging enabled
- CORS allows localhost origins
- Rate limiting disabled
- Source maps enabled
- Hot Module Replacement (HMR)

**Production:**

- `NODE_ENV=production`
- Generic error messages (no stack traces)
- Winston file logging only
- CORS restricted to production domain
- Rate limiting enabled (100 req/15min general, 5 req/15min auth)
- Source maps disabled
- Minified and optimized code
- HTTPS enforced via secure cookies and HSTS
- Compression enabled (gzip)

### Performance Optimization

**Backend Optimizations:**

1. **Database Indexing:**

   - Compound indexes on frequently queried fields
   - Text indexes for search functionality
   - TTL indexes for auto-cleanup of soft-deleted documents

2. **Connection Pooling:**

   - MongoDB connection pool: min 2, max 10 connections
   - Reuse connections across requests

3. **Caching:**

   - Response compression (gzip) for payloads >1KB
   - Lean queries for read-only operations
   - Pagination to limit result sets

4. **Query Optimization:**
   - Select only required fields
   - Populate references selectively
   - Use aggregation pipelines for complex queries

**Frontend Optimizations:**

1. **Code Splitting:**

   - Lazy loading for route components
   - Vendor chunks (React, MUI, Redux)
   - Dynamic imports for heavy components

2. **Bundle Optimization:**

   - Terser minification (removes console.log, debugger)
   - Tree shaking (removes unused code)
   - Chunk size limit: 1000KB warning

3. **Asset Optimization:**

   - Cloudinary for image hosting and optimization
   - Font subsetting (Inter font)
   - SVG icons from MUI

4. **Runtime Optimization:**

   - React.memo for list/card components
   - useCallback for event handlers
   - useMemo for computed values
   - Redux Persist for auth state only

5. **Network Optimization:**
   - HTTP/2 support
   - Gzip compression
   - Cache-Control headers for static assets
   - CDN for static assets (optional)

### Monitoring & Logging

**Application Logs:**

- **Location**: `backend/logs/`
- **Files**: `error.log`, `combined.log`
- **Format**: JSON (structured logging)
- **Rotation**: Daily rotation with 14-day retention (recommended)

**Log Monitoring:**

```bash
# View real-time logs
tail -f backend/logs/combined.log

# View error logs
tail -f backend/logs/error.log

# PM2 logs
pm2 logs task-manager-api
```

**Health Checks:**

```bash
# API health check
curl https://yourdomain.com/api/health

# Database connection check
curl https://yourdomain.com/api/health/db
```

**Monitoring Tools (Recommended):**

- **PM2 Monitoring**: Built-in process monitoring
- **MongoDB Atlas**: Database monitoring and alerts
- **New Relic / DataDog**: Application performance monitoring
- **Sentry**: Error tracking and reporting
- **Uptime Robot**: Uptime monitoring

### Backup & Recovery

**Database Backup:**

```bash
# Manual backup
mongodump --uri="mongodb://username:password@host:27017/task-manager" --out=/backup/$(date +%Y%m%d)

# Automated daily backup (cron)
0 2 * * * mongodump --uri="mongodb://..." --out=/backup/$(date +\%Y\%m\%d) && find /backup -type d -mtime +7 -exec rm -rf {} \;
```

**Restore from Backup:**

```bash
mongorestore --uri="mongodb://username:password@host:27017/task-manager" /backup/20240101
```

**Application Backup:**

- Source code: Git repository
- Environment variables: Secure vault (e.g., AWS Secrets Manager, HashiCorp Vault)
- Uploaded files: Cloudinary (automatic backup)

### Security Hardening

**Production Security Checklist:**

- [x] HTTPS enforced (secure cookies, HSTS header)
- [x] Strong JWT secrets (min 32 characters, random)
- [x] MongoDB authentication enabled
- [x] Firewall configured (only necessary ports open)
- [x] Rate limiting enabled
- [x] CORS restricted to production domain
- [x] Security headers (Helmet: CSP, X-Frame-Options, etc.)
- [x] Input sanitization (NoSQL injection prevention)
- [x] Password hashing (bcrypt, ≥12 salt rounds)
- [x] HTTP-only cookies (prevents XSS)
- [x] SameSite cookies (prevents CSRF)
- [x] Regular dependency updates (`npm audit`)
- [x] Environment variables not in source code
- [x] Error messages don't expose sensitive info
- [x] Logging doesn't include passwords/tokens

**SSL/TLS Certificate:**

```bash
# Let's Encrypt (free)
sudo certbot --nginx -d yourdomain.com
sudo certbot renew --dry-run
```

### Scaling Considerations

**Horizontal Scaling:**

- **Load Balancer**: Nginx, HAProxy, or cloud load balancer
- **Multiple Instances**: PM2 cluster mode (`-i max`)
- **Session Affinity**: Not required (stateless JWT auth)
- **Shared Storage**: Cloudinary for file uploads

**Vertical Scaling:**

- **CPU**: 2+ cores recommended
- **Memory**: 4GB+ RAM for production
- **Storage**: SSD for database

**Database Scaling:**

- **Replica Set**: MongoDB replica set for high availability
- **Sharding**: For very large datasets (>100GB)
- **Read Replicas**: For read-heavy workloads

## Development Workflow

### Local Development Setup

**Prerequisites:**

- Node.js v20.x LTS or higher
- MongoDB v7.0 or higher
- npm v10.x or higher
- Git
- Code editor (VS Code recommended)

**Installation Steps:**

1. **Clone Repository:**

```bash
git clone <repository-url>
cd task-manager
```

2. **Install Backend Dependencies:**

```bash
cd backend
npm install
```

3. **Install Frontend Dependencies:**

```bash
cd ../client
npm install
```

4. **Configure Environment Variables:**

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with development values
```

**Development Environment Variables:**

```env
# Database (local MongoDB)
MONGODB_URI=mongodb://localhost:27017/task-manager

# JWT Secrets (development only)
JWT_ACCESS_SECRET=dev-access-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production

# Server
PORT=4000
CLIENT_URL=http://localhost:3000
NODE_ENV=development

# Seed Data (true for development)
INITIALIZE_SEED_DATA=true

# Email (optional for development)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Task Manager <noreply@taskmanager.com>
```

```bash
# Frontend
cd client
cp .env.example .env
# Edit .env with development values
```

```env
VITE_API_URL=http://localhost:4000/api
VITE_PLATFORM_ORG=000000000000000000000000
```

5. **Start MongoDB:**

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod

# Windows
net start MongoDB

# Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

6. **Verify Environment:**

```bash
cd backend
npm run verify:env
```

7. **Start Development Servers:**

**Terminal 1 (Backend):**

```bash
cd backend
npm run dev
# Server running on http://localhost:4000
```

**Terminal 2 (Frontend):**

```bash
cd client
npm run dev
# Server running on http://localhost:3000
```

8. **Access Application:**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000/api
- **Socket.IO**: ws://localhost:4000

### Development Commands

**Backend:**

```bash
# Development server with auto-restart
npm run dev

# Production mode
npm run start:prod

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only property-based tests
npm run test:property

# Run only unit tests
npm run test:unit

# Validate environment variables
npm run verify:env
```

**Frontend:**

```bash
# Development server with HMR
npm run dev

# Production build
npm run build:prod

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Hot Module Replacement (HMR)

**Frontend (Vite):**

- **Instant Updates**: Changes reflect immediately without full page reload
- **State Preservation**: Component state preserved during updates
- **Fast Refresh**: React Fast Refresh for component updates
- **CSS HMR**: Style changes without page reload

**Backend (Nodemon):**

- **Auto-Restart**: Server restarts on file changes
- **Watch Patterns**: Watches all `.js` files in project
- **Ignore Patterns**: Ignores `node_modules/`, `tests/`, `coverage/`
- **Delay**: 1 second delay before restart

### Debugging

**Backend Debugging:**

**VS Code Launch Configuration** (`.vscode/launch.json`):

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/backend/server.js",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

**Chrome DevTools:**

```bash
node --inspect server.js
# Open chrome://inspect in Chrome
```

**Logging:**

```javascript
import logger from "./utils/logger.js";

logger.info("Info message");
logger.error("Error message", { error });
logger.debug("Debug message", { data });
```

**Frontend Debugging:**

**React DevTools:**

- Install React DevTools browser extension
- Inspect component tree, props, state
- Profile component performance

**Redux DevTools:**

- Install Redux DevTools browser extension
- Inspect Redux state, actions, time-travel debugging

**Browser DevTools:**

- Console: `console.log()`, `console.error()`, `console.table()`
- Network: Monitor API requests, WebSocket connections
- Sources: Set breakpoints, step through code
- Performance: Profile rendering performance

### Seed Data

**Purpose**: Populate database with sample data for development and testing

**Enable Seed Data:**

```env
INITIALIZE_SEED_DATA=true
```

**Seed Data Includes:**

- **Platform Organization**: Special organization for platform management
- **Sample Organizations**: 2-3 customer organizations
- **Departments**: Multiple departments per organization
- **Users**: All roles (SuperAdmin, Admin, Manager, User)
- **Tasks**: All types (ProjectTask outsourced to vendors, RoutineTask from outlets, AssignedTask to users)
- **Materials**: Sample materials with categories (linked via TaskActivity or directly to RoutineTask)
- **Vendors**: Sample external vendors/clients for ProjectTasks
- **Notifications**: Sample notifications

**Seed Data File**: `backend/mock/cleanSeedSetup.js`

**Manual Seed:**

```bash
cd backend
node mock/cleanSeedSetup.js
```

**Clear Database:**

```bash
# MongoDB shell
mongosh task-manager
db.dropDatabase()
```

### Code Style & Linting

**Backend:**

- **ES Modules**: Use `import/export` syntax
- **Async/Await**: Prefer async/await over promises
- **Error Handling**: Use `express-async-handler` for async routes
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Constants**: Import from `utils/constants.js`

**Frontend:**

- **ES Modules**: Use `import/export` syntax
- **JSX**: Use `.jsx` extension for React components
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Hooks**: Follow React Hooks rules
- **MUI v7**: Use `size` prop for Grid (not `item`)

**ESLint Configuration** (`client/eslint.config.js`):

```bash
cd client
npm run lint
```

### Git Workflow

**Branch Strategy:**

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Production hotfixes

**Commit Messages:**

```
feat: Add user authentication
fix: Fix pagination bug in materials list
docs: Update API documentation
refactor: Refactor task controller
test: Add property tests for soft delete
chore: Update dependencies
```

**Pull Request Process:**

1. Create feature branch from `develop`
2. Make changes and commit
3. Push branch and create pull request
4. Code review and approval
5. Merge to `develop`
6. Deploy to staging for testing
7. Merge to `main` for production

### Troubleshooting

**Common Issues:**

**1. MongoDB Connection Error:**

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution**: Ensure MongoDB is running

```bash
# Check MongoDB status
mongosh --eval "db.adminCommand('ping')"

# Start MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
net start MongoDB                      # Windows
```

**2. Port Already in Use:**

```
Error: listen EADDRINUSE: address already in use :::4000
```

**Solution**: Kill process using the port

```bash
# Find process
lsof -i :4000  # macOS/Linux
netstat -ano | findstr :4000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

**3. JWT Token Error:**

```
Error: jwt malformed
```

**Solution**: Clear cookies and login again, or check JWT secrets in `.env`

**4. CORS Error:**

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution**: Ensure `CLIENT_URL` in backend `.env` matches frontend URL

**5. Module Not Found:**

```
Error: Cannot find module 'express'
```

**Solution**: Install dependencies

```bash
npm install
```

**6. Environment Variables Not Loaded:**

```
Error: JWT_ACCESS_SECRET is not defined
```

**Solution**: Ensure `.env` file exists and is in correct location

```bash
cd backend
ls -la .env
npm run verify:env
```

## Browser Support

**Target Browsers:**

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

**Polyfills**: Not required (modern browsers only)

## Accessibility

**WCAG 2.1 Level AA Compliance:**

- Semantic HTML
- ARIA labels on dialogs
- Keyboard navigation
- Focus management
- Color contrast ratios
- Screen reader support

**MUI Components**: Built-in accessibility features

---

**Last Updated**: December 5, 2024
**Next Review**: After major dependency updates or architecture changes
