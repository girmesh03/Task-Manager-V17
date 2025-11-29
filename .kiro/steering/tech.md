---
inclusion: always
---

# Technology Stack & Configuration

## Critical Project Requirements, Design and Tasks:

**To validate, correct, and complete the codebase for production readiness, you must effectively utilize the following resources while respecting the existing codebase:**

- **All 735 requirements and every other specification** in `backend/docs/codebase-requirements.md` and all documents within `backend/docs/*`.
- `/.kiro/specs/production-readiness-validation/requirements.md`
- `/.kiro/specs/production-readiness-validation/design.md`
- `/.kiro/specs/production-readiness-validation/components.md`
- `/.kiro/specs/production-readiness-validation/tech.md`

> [!IMPORTANT] > **Critical Implementation Rules (STRICTLY ENFORCED)**
>
> **#1 MANDATORY: WHAT-WHY-HOW Analysis (APPLIES TO EVERY CHANGE)**
>
> Before making ANY change/update to ANY file:
>
> 1. **WHAT exists?** - First identify what currently exists in the codebase (both backend and frontend)
>
>    - Read the existing file completely
>    - Understand current implementation
>    - Identify current patterns and structure
>    - Document current behavior
>
> 2. **WHY change?** - Justify the change
>
>    - What requirement necessitates this change?
>    - What problem does it solve?
>    - What will break if we don't change it?
>    - Is it aligned with production readiness requirements?
>
> 3. **HOW to change?** - Plan the implementation
>    - How will the change be implemented?
>    - How does it respect existing codebase structure?
>    - How does it integrate with existing patterns?
>    - What tests will verify the change?
>
> **The existing codebase MUST be respected.** Do not impose arbitrary patterns. Work > WITH the existing architecture, not against it.
>
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
- **mongoose-lean-virtuals**: Lean query optimization
- **Custom Plugins**: softDelete plugin (`models/plugins/softDelete.js`)

### Authentication & Security

- **jsonwebtoken**: ^9.0.2 - JWT token generation/verification
- **bcrypt**: ^6.0.0 - Password hashing
- **cookie-parser**: ^1.4.7 - Parse HTTP-only cookies
- **helmet**: ^8.1.0 - Security headers (CSP, HSTS in production)
- **cors**: ^2.8.5 - Cross-origin resource sharing
- **express-mongo-sanitize**: ^2.2.0 - NoSQL injection prevention
- **express-rate-limit**: ^8.1.0 - Rate limiting (production only)

### Validation

- **express-validator**: ^7.2.1 - Request validation
- **validator**: ^13.15.15 - String validation utilities
- **Custom Validators**: `middlewares/validators/*` for each resource

### Real-time Communication

- **socket.io**: ^4.8.1 - WebSocket server
- **Singleton Pattern**: `utils/socketInstance.js` manages single instance
- **Event Handlers**: `utils/socket.js`, `utils/socketEmitter.js`

### Email

- **nodemailer**: ^7.0.9 - Email sending
- **SMTP**: Gmail SMTP with app passwords
- **Queue-Based**: Asynchronous email sending
- **Templates**: HTML email templates in `templates/emailTemplates.js`

### Utilities

- **dayjs**: ^1.11.18 - Date manipulation
- **dotenv**: ^17.2.3 - Environment variable management
- **compression**: ^1.8.1 - Response compression
- **express-async-handler**: ^1.2.0 - Async error handling

### Development Tools

- **nodemon**: ^3.1.10 - Auto-restart on file changes
- **morgan**: ^1.10.1 - HTTP request logger

### Backend Scripts

```json
{
  "start": "node server.js",
  "start:prod": "NODE_ENV=production node server.js",
  "dev": "nodemon server.js",
  "server": "nodemon server.js",
  "test": "echo \"Error: no test specified\" && exit 1"
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

## Frontend Stack

### Framework & Build Tool

- **React**: ^19.1.1 - UI library
- **React DOM**: ^19.1.1 - React renderer
- **Vite**: ^7.1.7 - Build tool and dev server
- **@vitejs/plugin-react-swc**: ^4.1.0 - SWC-based React plugin

### UI Framework

- **Material-UI (MUI)**: v7.3.4
  - `@mui/material`: ^7.3.4 - Core components
  - `@mui/icons-material`: ^7.3.4 - Icon library
  - `@mui/lab`: ^7.0.1-beta.18 - Lab components
  - `@mui/x-data-grid`: ^8.14.1 - DataGrid component
  - `@mui/x-date-pickers`: ^8.14.1 - Date picker components
  - `@mui/x-charts`: ^8.14.1 - Chart components
- **@emotion/react**: ^11.14.0 - CSS-in-JS
- **@emotion/styled**: ^11.14.1 - Styled components
- **@fontsource/inter**: ^5.2.8 - Inter font

### State Management

- **Redux Toolkit**: ^2.9.0 - State management
- **React Redux**: ^9.2.0 - React bindings for Redux
- **redux-persist**: ^6.0.0 - Persist Redux state
- **RTK Query**: Built into Redux Toolkit for API calls

### Routing

- **React Router**: ^7.9.4 - Client-side routing
- **Lazy Loading**: Code splitting for routes

### Forms

- **react-hook-form**: ^7.65.0 - Form state management
- **Controlled Components**: NEVER use `watch()` method
- **Validation**: Integrated with MUI components

### HTTP & Real-time

- **axios**: ^1.12.2 - HTTP client
- **socket.io-client**: ^4.8.1 - WebSocket client
- **Custom Services**: `services/socketService.js`, `services/socketEvents.js`

### Notifications & Feedback

- **react-toastify**: ^11.0.5 - Toast notifications
- **react-error-boundary**: ^6.0.0 - Error boundaries

### Date Handling

- **dayjs**: ^1.11.18 - Date manipulation (same as backend)
- **@mui/x-date-pickers**: Date picker components

### Development Tools

- **ESLint**: ^9.36.0 - Linting
- **@eslint/js**: ^9.36.0 - ESLint JavaScript config
- **eslint-plugin-react-hooks**: ^5.2.0 - React hooks linting
- **eslint-plugin-react-refresh**: ^0.4.22 - React refresh linting
- **globals**: ^16.4.0 - Global variables
- **TypeScript Types**: @types/react, @types/react-dom (for IDE support)

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
npm run preview      # Preview production build
```

**Linting:**

```bash
cd client
npm run lint         # Run ESLint
```

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

   - Content Security Policy (CSP)
   - HTTP Strict Transport Security (HSTS) in production
   - X-Frame-Options, X-Content-Type-Options, etc.

2. **cors** - Cross-origin resource sharing

   - Allowed origins from `config/allowedOrigins.js`
   - Credentials enabled for cookies

3. **cookieParser** - Parse cookies

   - Required before authentication middleware

4. **express.json** - Parse JSON bodies

   - 10mb limit for file uploads

5. **mongoSanitize** - NoSQL injection prevention

   - Removes `$` and `.` from user input

6. **compression** - Response compression

   - Gzip compression for responses

7. **rateLimiter** - Rate limiting (production only)
   - General API: 100 requests per 15 minutes
   - Auth endpoints: 5 requests per 15 minutes

**Example:**

```javascript
// Security
app.use(helmet());
app.use(cors(corsOptions));

// Parsing
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));

// Sanitization
app.use(mongoSanitize());

// Compression
app.use(compression());

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

## Testing

**Current Status**: No test suite configured

**Backend Test Script:**

```json
"test": "echo \"Error: no test specified\" && exit 1"
```

**Frontend Test Script:**

```json
"test": "echo \"Error: no test specified\" && exit 1"
```

**Future Recommendations:**

- Backend: Jest + Supertest for API testing
- Frontend: Vitest + React Testing Library
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
