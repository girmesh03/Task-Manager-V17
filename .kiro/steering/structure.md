---
inclusion: always
---

# Architecture & Code Patterns

Monorepo structure: `backend/` (Node.js/Express) + `client/` (React/Vite)

## Critical Project Requirements, Design and Tasks:

> **The existing codebase MUST be respected.** Do not impose arbitrary patterns. Work > WITH the existing architecture, not against it.
>
> **To install any new packages that doesn't exist in backend/package.json and client/package.json, ask the user as yes or no. If the user provide yes, install the package and proceed accordingly and if the user provide no, then proceed to validate and correct without using a package.**

## Backend Architecture

**Layer Flow:** Routes → Controllers → Services → Models

### Source of Truth Files

- **`middlewares/validators/*`** - Field names and validation rules (frontend MUST match exactly)
- **`utils/constants.js`** - All enums (roles, statuses, priorities, limits)
- **`config/authorizationMatrix.json`** - Permission definitions per role per resource
- **`utils/socketInstance.js`** - Socket.IO singleton instance
- **`models/plugins/softDelete.js`** - Soft delete plugin for all models

### Before Coding Backend Features

1. Check validators in `middlewares/validators/*` for exact field names
2. Import constants from `utils/constants.js` instead of hardcoding values
3. Use `errorHandler/CustomError.js` for all error throwing
4. All models use soft delete plugin (`isDeleted` flag)
5. Use `express-async-handler` for async route handlers
6. Follow controller → service → model pattern

### Backend File Structure

```
backend/
├── config/
│   ├── allowedOrigins.js          # CORS allowed origins
│   ├── authorizationMatrix.json   # Role-based permissions
│   ├── corsOptions.js             # CORS configuration
│   └── db.js                      # MongoDB connection
├── controllers/
│   ├── attachmentControllers.js   # Attachment CRUD
│   ├── authControllers.js         # Login, register, refresh, logout
│   ├── departmentControllers.js   # Department CRUD
│   ├── materialControllers.js     # Material CRUD
│   ├── notificationControllers.js # Notification CRUD, mark as read
│   ├── organizationControllers.js # Organization CRUD
│   ├── taskControllers.js         # Task CRUD (all types)
│   ├── userControllers.js         # User CRUD, profile, status
│   └── vendorControllers.js       # Vendor CRUD
├── errorHandler/
│   ├── CustomError.js             # Custom error class
│   └── ErrorController.js         # Global error handler middleware
├── middlewares/
│   ├── validators/
│   │   ├── attachmentValidators.js
│   │   ├── authValidators.js
│   │   ├── departmentValidators.js
│   │   ├── materialValidators.js
│   │   ├── notificationValidators.js
│   │   ├── organizationValidators.js
│   │   ├── taskValidators.js
│   │   ├── userValidators.js
│   │   ├── validation.js          # Validation result handler
│   │   └── vendorValidators.js
│   ├── authMiddleware.js          # JWT verification
│   ├── authorization.js           # Role-based authorization
│   └── rateLimiter.js             # Rate limiting (production)
├── mock/
│   ├── cleanSeedSetup.js          # Seed data initialization
│   └── data.js                    # Mock data
├── models/
│   ├── plugins/
│   │   └── softDelete.js          # Soft delete plugin
│   ├── AssignedTask.js            # Assigned task model
│   ├── Attachment.js              # Attachment model
│   ├── BaseTask.js                # Base task model (discriminator)
│   ├── Department.js              # Department model
│   ├── index.js                   # Model exports
│   ├── Material.js                # Material model
│   ├── Notification.js            # Notification model
│   ├── Organization.js            # Organization model
│   ├── ProjectTask.js             # Project task model
│   ├── RoutineTask.js             # Routine task model
│   ├── TaskActivity.js            # Task activity model
│   ├── TaskComment.js             # Task comment model
│   ├── User.js                    # User model
│   └── Vendor.js                  # Vendor model
├── routes/
│   ├── attachmentRoutes.js        # Attachment routes
│   ├── authRoutes.js              # Auth routes
│   ├── departmentRoutes.js        # Department routes
│   ├── index.js                   # Route aggregator
│   ├── materialRoutes.js          # Material routes
│   ├── notificationRoutes.js      # Notification routes
│   ├── organizationRoutes.js      # Organization routes
│   ├── taskRoutes.js              # Task routes
│   ├── userRoutes.js              # User routes
│   └── vendorRoutes.js            # Vendor routes
├── services/
│   ├── emailService.js            # Email sending (Nodemailer)
│   └── notificationService.js     # Notification creation
├── templates/
│   └── emailTemplates.js          # Email HTML templates
├── utils/
│   ├── authorizationMatrix.js     # Authorization helper
│   ├── constants.js               # All constants
│   ├── generateTokens.js          # JWT token generation
│   ├── helpers.js                 # Utility functions
│   ├── materialTransform.js       # Material data transformation
│   ├── responseTransform.js       # Response formatting
│   ├── socket.js                  # Socket.IO event handlers
│   ├── socketEmitter.js           # Socket.IO event emitters
│   ├── socketInstance.js          # Socket.IO singleton
│   └── userStatus.js              # User status tracking
├── .env                           # Environment variables
├── app.js                         # Express app configuration
├── package.json                   # Dependencies and scripts
└── server.js                      # Server startup and lifecycle
```

## Frontend Architecture

**Layer Flow:** Pages → Components → Services (API/Socket.IO)

### Architecture Overview

The frontend follows a layered architecture with clear separation of concerns:

1. **Presentation Layer** (Pages): Route-level components that orchestrate data fetching and state management
2. **Component Layer** (Components): Reusable UI components organized by function (cards, forms, filters, etc.)
3. **State Layer** (Redux): Centralized state management with RTK Query for API caching
4. **Service Layer** (Services): External integrations (Socket.IO, Cloudinary)
5. **Utility Layer** (Utils): Helper functions, constants, error handling

### Layer Flow Diagram

```
User Interaction
      ↓
   Pages (Route Components)
      ↓
   Components (UI Components)
      ↓
   Redux Store (State Management)
      ↓
   RTK Query APIs (Data Fetching)
      ↓
   Backend API (HTTP/REST)
      ↓
   Database (MongoDB)

Parallel Flow:
   Socket.IO Client ←→ Socket.IO Server
      ↓                    ↓
   Event Handlers    Real-time Events
      ↓
   Redux Cache Invalidation
```

### Critical Files

- **`utils/constants.js`** - Mirror backend constants exactly (MUST be synchronized)
- **`hooks/useAuth.js`** - Authentication hook (login, logout, user state)
- **`hooks/useSocket.js`** - Socket.IO hook (connect, disconnect, events)
- **`redux/features/*`** - State management with RTK Query and slices
- **`services/socketService.js`** - Socket.IO client service
- **`services/socketEvents.js`** - Socket.IO event handlers
- **`utils/errorHandler.js`** - Custom error class (AppError)

### File Naming Conventions

- **Components**: PascalCase `.jsx` (e.g., `UserCard.jsx`, `CreateUpdateUser.jsx`)
- **Utilities**: camelCase `.js` (e.g., `constants.js`, `errorHandler.js`)
- **Hooks**: camelCase `.js` with `use` prefix (e.g., `useAuth.js`, `useSocket.js`)
- **Services**: camelCase `.js` (e.g., `socketService.js`)

### Component Hierarchy

```
App.jsx (Root)
├── AppTheme (Theme Provider)
│   ├── RootLayout
│   │   ├── PublicLayout (Public Routes)
│   │   │   ├── Home
│   │   │   ├── Login (LoginForm)
│   │   │   └── Register (RegisterForm with multi-step)
│   │   │       ├── UserDetailsStep
│   │   │       ├── OrganizationDetailsStep
│   │   │       ├── UploadAttachmentsStep
│   │   │       └── ReviewStep
│   │   └── DashboardLayout (Protected Routes)
│   │       ├── Header (Navigation, NotificationMenu, UserMenu)
│   │       ├── Sidebar (Navigation Links)
│   │       ├── Main Content Area
│   │       │   ├── Dashboard (Widgets, Charts)
│   │       │   ├── Tasks (Three-Layer Pattern)
│   │       │   │   └── TasksList → TaskCard
│   │       │   ├── Users (Three-Layer Pattern)
│   │       │   │   └── UsersList → UserCard
│   │       │   ├── Materials (DataGrid Pattern)
│   │       │   │   ├── MaterialFilter
│   │       │   │   ├── MuiDataGrid
│   │       │   │   └── CreateUpdateMaterial
│   │       │   ├── Vendors (DataGrid Pattern)
│   │       │   ├── Departments (DataGrid Pattern)
│   │       │   └── Organizations (DataGrid Pattern)
│   │       └── Footer
│   └── ErrorBoundary (Error Handling)
```

### State Management Flow

```
Component
   ↓
useSelector (Read State)
   ↓
Redux Store
   ├── auth slice (persisted)
   │   ├── user
   │   ├── isAuthenticated
   │   └── isLoading
   └── RTK Query APIs
       ├── authApi
       ├── userApi
       ├── taskApi
       ├── materialApi
       ├── vendorApi
       ├── departmentApi
       ├── organizationApi
       └── notificationApi

Component
   ↓
useDispatch (Update State)
   ↓
Action/Mutation
   ↓
Redux Store Update
   ↓
Component Re-render
```

### Data Fetching Patterns

**RTK Query Pattern:**

```javascript
// 1. Define API endpoint
const materialApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMaterials: builder.query({
      query: (params) => ({ url: "/materials", params }),
      providesTags: ["Material"],
    }),
  }),
});

// 2. Use in component
const { data, isLoading, error } = useGetMaterialsQuery({ page: 1, limit: 10 });

// 3. Cache invalidation on mutation
createMaterial: builder.mutation({
  invalidatesTags: ["Material"],
});
```

**Cache Tags:**

- `Task`, `TaskActivity`, `TaskComment`
- `User`, `Organization`, `Department`
- `Material`, `Vendor`
- `Notification`, `Attachment`

### Real-time Update Flow

```
Backend Event Occurs
   ↓
Socket.IO Server Emits Event
   ↓
Socket.IO Client Receives Event
   ↓
socketEvents.js Handler
   ↓
Redux Cache Invalidation
   ↓
RTK Query Refetch
   ↓
Component Re-render with New Data
   ↓
Toast Notification (Optional)
```

**Event Types:**

- `task:created`, `task:updated`, `task:deleted`, `task:restored`
- `activity:created`, `activity:updated`
- `comment:created`, `comment:updated`, `comment:deleted`
- `notification:created`
- `user:online`, `user:offline`, `user:away`

### Error Handling Flow

```
Error Occurs
   ↓
Error Type?
   ├── Component Error → ErrorBoundary → Fallback UI
   ├── Route Error → RouteError → Error Page
   ├── API Error → RTK Query Error → Toast Notification
   └── Form Error → Field Error → Inline Error Message

All Errors Logged to Console (Development)
```

### Form Submission Flow

```
User Fills Form
   ↓
react-hook-form Validation (Client-side)
   ↓
Valid?
   ├── No → Display Field Errors
   └── Yes → Submit to Backend
       ↓
   Backend Validation (express-validator)
       ↓
   Valid?
       ├── No → Return 400 Error → Display Toast
       └── Yes → Process Request
           ↓
       Success Response
           ↓
       RTK Query Cache Update
           ↓
       Toast Success Message
           ↓
       Close Dialog/Navigate
```

### Frontend File Structure

```
client/
├── public/                        # Static assets
├── src/
│   ├── assets/
│   │   └── notFound_404.svg       # 404 page illustration
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthProvider.jsx   # Auth context provider
│   │   │   ├── index.js           # Auth exports
│   │   │   ├── ProtectedRoute.jsx # Protected route wrapper
│   │   │   └── PublicRoute.jsx    # Public route wrapper
│   │   ├── cards/
│   │   │   ├── AttachmentCard.jsx
│   │   │   ├── DepartmentCard.jsx
│   │   │   ├── MaterialCard.jsx
│   │   │   ├── NotificationCard.jsx
│   │   │   ├── OrganizationCard.jsx
│   │   │   ├── TaskCard.jsx
│   │   │   ├── UserCard.jsx
│   │   │   ├── UsersCardList.jsx
│   │   │   └── VendorCard.jsx
│   │   ├── columns/
│   │   │   ├── AttachmentColumns.jsx
│   │   │   ├── DepartmentColumns.jsx
│   │   │   ├── MaterialColumns.jsx
│   │   │   ├── NotificationColumns.jsx
│   │   │   ├── OrganizationColumns.jsx
│   │   │   ├── TaskColumns.jsx
│   │   │   ├── UserColumns.jsx
│   │   │   └── VendorColumns.jsx
│   │   ├── common/
│   │   │   ├── CustomDataGridToolbar.jsx  # DataGrid toolbar
│   │   │   ├── CustomIcons.jsx            # Custom icons
│   │   │   ├── ErrorBoundary.jsx          # Error boundary
│   │   │   ├── FilterChipGroup.jsx        # Active filters display
│   │   │   ├── FilterDateRange.jsx        # Date range filter
│   │   │   ├── FilterSelect.jsx           # Select filter
│   │   │   ├── FilterTextField.jsx        # Text filter
│   │   │   ├── GlobalSearch.jsx           # Global search bar
│   │   │   ├── index.js                   # Common exports
│   │   │   ├── MuiActionColumn.jsx        # DataGrid action column
│   │   │   ├── MuiCheckbox.jsx            # Checkbox input
│   │   │   ├── MuiDataGrid.jsx            # DataGrid wrapper
│   │   │   ├── MuiDatePicker.jsx          # Date picker
│   │   │   ├── MuiDateRangePicker.jsx     # Date range picker
│   │   │   ├── MuiDialog.jsx              # Dialog wrapper
│   │   │   ├── MuiDialogConfirm.jsx       # Confirmation dialog
│   │   │   ├── MuiFileUpload.jsx          # File upload
│   │   │   ├── MuiLoading.jsx             # Loading spinner
│   │   │   ├── MuiMultiSelect.jsx         # Multi-select
│   │   │   ├── MuiNumberField.jsx         # Number input
│   │   │   ├── MuiRadioGroup.jsx          # Radio group
│   │   │   ├── MuiResourceSelect.jsx      # Resource select
│   │   │   ├── MuiSelectAutocomplete.jsx  # Autocomplete select
│   │   │   ├── MuiTextArea.jsx            # Text area
│   │   │   ├── MuiTextField.jsx           # Text input
│   │   │   ├── MuiThemeDropDown.jsx       # Theme switcher
│   │   │   ├── NotificationMenu.jsx       # Notification dropdown
│   │   │   └── RouteError.jsx             # Route error display
│   │   ├── filters/
│   │   │   ├── MaterialFilter.jsx
│   │   │   ├── TaskFilter.jsx
│   │   │   ├── UserFilter.jsx
│   │   │   └── VendorFilter.jsx
│   │   ├── forms/
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   ├── OrganizationDetailsStep.jsx
│   │   │   │   ├── RegisterForm.jsx
│   │   │   │   ├── ReviewStep.jsx
│   │   │   │   ├── UploadAttachmentsStep.jsx
│   │   │   │   └── UserDetailsStep.jsx
│   │   │   ├── departments/
│   │   │   │   └── CreateUpdateDepartment.jsx
│   │   │   ├── materials/
│   │   │   │   └── CreateUpdateMaterial.jsx
│   │   │   ├── users/
│   │   │   │   └── CreateUpdateUser.jsx
│   │   │   └── vendors/
│   │   │       └── CreateUpdateVendor.jsx
│   │   └── lists/
│   │       ├── TasksList.jsx
│   │       └── UsersList.jsx
│   ├── hooks/
│   │   ├── useAuth.js             # Authentication hook
│   │   └── useSocket.js           # Socket.IO hook
│   ├── layouts/
│   │   ├── DashboardLayout.jsx    # Protected layout
│   │   ├── PublicLayout.jsx       # Public layout
│   │   └── RootLayout.jsx         # Root layout
│   ├── pages/
│   │   ├── Dashboard.jsx          # Dashboard page
│   │   ├── Departments.jsx        # Departments page
│   │   ├── ForgotPassword.jsx     # Forgot password page
│   │   ├── Home.jsx               # Home page
│   │   ├── Materials.jsx          # Materials page
│   │   ├── NotFound.jsx           # 404 page
│   │   ├── Organization.jsx       # Organization detail page
│   │   ├── Organizations.jsx      # Organizations list page
│   │   ├── Tasks.jsx              # Tasks page
│   │   ├── Users.jsx              # Users page
│   │   └── Vendors.jsx            # Vendors page
│   ├── redux/
│   │   ├── app/
│   │   │   └── store.js           # Redux store configuration
│   │   └── features/
│   │       ├── api.js             # Base API configuration
│   │       ├── attachment/
│   │       │   └── attachmentApi.js
│   │       ├── auth/
│   │       │   ├── authApi.js
│   │       │   └── authSlice.js
│   │       ├── department/
│   │       │   ├── departmentApi.js
│   │       │   └── departmentSlice.js
│   │       ├── material/
│   │       │   ├── materialApi.js
│   │       │   └── materialSlice.js
│   │       ├── notification/
│   │       │   ├── notificationApi.js
│   │       │   └── notificationSlice.js
│   │       ├── organization/
│   │       │   ├── organizationApi.js
│   │       │   └── organizationSlice.js
│   │       ├── task/
│   │       │   ├── taskApi.js
│   │       │   └── taskSlice.js
│   │       ├── user/
│   │       │   ├── userApi.js
│   │       │   └── userSlice.js
│   │       └── vendor/
│   │           ├── vendorApi.js
│   │           └── vendorSlice.js
│   ├── router/
│   │   └── routes.jsx             # Route configuration
│   ├── services/
│   │   ├── socketEvents.js        # Socket.IO event handlers
│   │   └── socketService.js       # Socket.IO client service
│   ├── theme/
│   │   ├── customizations/
│   │   │   ├── charts.js          # Chart customizations
│   │   │   ├── dataDisplay.js     # Data display customizations
│   │   │   ├── dataGrid.js        # DataGrid customizations
│   │   │   ├── datePickers.js     # Date picker customizations
│   │   │   ├── feedback.js        # Feedback customizations
│   │   │   ├── index.js           # Customization exports
│   │   │   ├── inputs.js          # Input customizations
│   │   │   ├── navigation.js      # Navigation customizations
│   │   │   └── surfaces.js        # Surface customizations
│   │   ├── AppTheme.jsx           # Theme provider
│   │   └── themePrimitives.js     # Theme primitives
│   ├── utils/
│   │   ├── constants.js           # All constants (mirror backend)
│   │   └── errorHandler.js        # Custom error class
│   ├── App.jsx                    # Root component
│   └── main.jsx                   # Application entry point
├── .env                           # Environment variables
├── eslint.config.js               # ESLint configuration
├── index.html                     # HTML template
├── package.json                   # Dependencies and scripts
└── vite.config.js                 # Vite configuration
```

## Services

### Socket.IO Service

**File:** `services/socketService.js`

**Purpose:** Manage WebSocket connection lifecycle

```javascript
class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(import.meta.env.VITE_API_URL.replace("/api", ""), {
      withCredentials: true, // Send HTTP-only cookies
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.connect();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, handler) {
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  off(event, handler) {
    if (this.socket) {
      this.socket.off(event, handler);
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

export default new SocketService();
```

### Socket Event Handlers

**File:** `services/socketEvents.js`

**Purpose:** Handle real-time events and invalidate cache

```javascript
import { store } from "../redux/app/store";
import { taskApi } from "../redux/features/task/taskApi";
import { notificationApi } from "../redux/features/notification/notificationApi";
import { toast } from "react-toastify";

export const setupSocketEventHandlers = (socket) => {
  // Task events
  socket.on("task:created", (task) => {
    store.dispatch(taskApi.util.invalidateTags(["Task"]));
    toast.info(`New task created: ${task.title}`);
  });

  socket.on("task:updated", (task) => {
    store.dispatch(
      taskApi.util.invalidateTags([{ type: "Task", id: task._id }])
    );
  });

  socket.on("task:deleted", (task) => {
    store.dispatch(taskApi.util.invalidateTags(["Task"]));
    toast.warning(`Task deleted: ${task.title}`);
  });

  // Notification events
  socket.on("notification:created", (notification) => {
    store.dispatch(notificationApi.util.invalidateTags(["Notification"]));
    toast.info(notification.message);
  });

  // User status events
  socket.on("user:online", (user) => {
    console.log("User online:", user);
  });

  socket.on("user:offline", (user) => {
    console.log("User offline:", user);
  });
};
```

### Cloudinary Service

**File:** `services/cloudinaryService.js`

**Purpose:** Upload files directly to Cloudinary

```javascript
const CLOUDINARY_UPLOAD_PRESET = "your_upload_preset";
const CLOUDINARY_CLOUD_NAME = "your_cloud_name";

export const uploadToCloudinary = async (file, folder = "attachments") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
    { method: "POST", body: formData }
  );

  const data = await response.json();
  return {
    url: data.secure_url,
    publicId: data.public_id,
    format: data.format,
    size: data.bytes,
  };
};
```

## Hooks

### useAuth Hook

**File:** `hooks/useAuth.js`

**Purpose:** Access authentication state and methods

```javascript
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUser, clearUser } from "../redux/features/auth/authSlice";
import {
  useLoginMutation,
  useLogoutMutation,
} from "../redux/features/auth/authApi";

const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const [loginMutation] = useLoginMutation();
  const [logoutMutation] = useLogoutMutation();

  const login = async (credentials) => {
    const result = await loginMutation(credentials).unwrap();
    dispatch(setUser(result.user));
    navigate("/dashboard");
  };

  const logout = async () => {
    await logoutMutation().unwrap();
    dispatch(clearUser());
    navigate("/login");
  };

  return { user, isAuthenticated, login, logout };
};

export default useAuth;
```

### useSocket Hook

**File:** `hooks/useSocket.js`

**Purpose:** Access Socket.IO connection and methods

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
    on: socketService.on.bind(socketService),
    off: socketService.off.bind(socketService),
    emit: socketService.emit.bind(socketService),
  };
};

export default useSocket;
```

## Utilities

### Constants

**File:** `utils/constants.js`

**Purpose:** Mirror backend constants exactly (MUST be synchronized)

```javascript
// User Roles (descending privileges)
export const USER_ROLES = {
  SUPER_ADMIN: "SuperAdmin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  USER: "User",
};

// Task Status
export const TASK_STATUS = ["To Do", "In Progress", "Completed", "Pending"];

// Task Priority
export const TASK_PRIORITY = ["Low", "Medium", "High", "Urgent"];

// Material Categories
export const MATERIAL_CATEGORIES = [
  "Electrical",
  "Mechanical",
  "Plumbing",
  "Hardware",
  "Cleaning",
  "Textiles",
  "Consumables",
  "Construction",
  "Other",
];

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],
  MAX_LIMIT: 100,
};
```

### Error Handler

**File:** `utils/errorHandler.js`

**Purpose:** Custom error class for application errors

```javascript
class AppError extends Error {
  constructor(message, code, severity = "error", type = "general") {
    super(message);
    this.code = code;
    this.severity = severity;
    this.type = type;
    this.name = "AppError";
  }

  static badRequest(message) {
    return new AppError(message, "BAD_REQUEST", "error", "validation");
  }

  static unauthorized(message) {
    return new AppError(message, "UNAUTHORIZED", "error", "auth");
  }

  static forbidden(message) {
    return new AppError(message, "FORBIDDEN", "error", "auth");
  }

  static notFound(message) {
    return new AppError(message, "NOT_FOUND", "error", "general");
  }
}

export default AppError;
```

### Date Utilities

**File:** `utils/dateUtils.js`

**Purpose:** Date formatting and timezone conversion

```javascript
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

// Format date for display
export const formatDate = (date, format = "MMM DD, YYYY") => {
  return dayjs(date).format(format);
};

// Convert UTC to local timezone
export const utcToLocal = (date) => {
  return dayjs.utc(date).local();
};

// Convert local to UTC
export const localToUtc = (date) => {
  return dayjs(date).utc();
};
```

### Authorization Helper

**File:** `utils/authorizationHelper.js`

**Purpose:** Check permissions for UI visibility

```javascript
import { USER_ROLES } from "./constants";

export const hasPermission = (userRole, requiredRole) => {
  const roleHierarchy = {
    [USER_ROLES.SUPER_ADMIN]: 4,
    [USER_ROLES.ADMIN]: 3,
    [USER_ROLES.MANAGER]: 2,
    [USER_ROLES.USER]: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

export const canAccessRoute = (user, route) => {
  if (!route.requiredRole) return true;
  return hasPermission(user.role, route.requiredRole);
};
```

## Theme System

### Theme Provider

**File:** `theme/AppTheme.jsx`

**Purpose:** Provide MUI theme with light/dark mode support

```javascript
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useMemo, useState } from "react";
import { brand, gray } from "./themePrimitives";
import customizations from "./customizations";

export default function AppTheme({ children }) {
  const [mode, setMode] = useState("light");

  const theme = useMemo(() => {
    return createTheme({
      palette: {
        mode,
        primary: { main: brand[500] },
        background: {
          default: mode === "light" ? gray[50] : gray[900],
          paper: mode === "light" ? "#fff" : gray[800],
        },
      },
      typography: {
        fontFamily: "Inter, sans-serif",
      },
      components: customizations,
    });
  }, [mode]);

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
```

### Theme Primitives

**File:** `theme/themePrimitives.js`

**Purpose:** Define color palettes and design tokens

```javascript
export const brand = {
  50: "#F0F7FF",
  100: "#CEE5FD",
  200: "#9CCCFC",
  // ... more shades
  900: "#003A75",
};

export const gray = {
  50: "#FBFCFE",
  100: "#EAF0F5",
  // ... more shades
  900: "#0A1929",
};
```

### Component Customizations

**File:** `theme/customizations/index.js`

**Purpose:** MUI component style overrides

```javascript
import { dataGridCustomizations } from "./dataGrid";
import { inputsCustomizations } from "./inputs";
import { navigationCustomizations } from "./navigation";
// ... more customizations

export default {
  ...dataGridCustomizations,
  ...inputsCustomizations,
  ...navigationCustomizations,
};
```

## UI Patterns

### Admin Views (DataGrid Pattern)

**Use for:** Organizations, Departments, Materials, Vendors, Users (admin view)

**Required Files:**

- `*Page.jsx` - Data fetching, state management, filters
- `*Columns.jsx` - Column definitions for DataGrid
- `*Filter.jsx` - Filter UI components
- `CreateUpdate*.jsx` - Form modal (NOT `*Form.jsx`)

**Required Components:**

- `MuiDataGrid` - Auto-converts pagination (0-based MUI ↔ 1-based backend)
- `MuiActionColumn` - Actions (View/Edit/Delete/Restore), auto-detects soft delete
- `CustomDataGridToolbar` - Optional toolbar with export, filters, columns

**Pattern:**

```jsx
// Page component
const MaterialsPage = () => {
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({ page: 0, pageSize: 10 });

  const { data, isLoading, isFetching } = useGetMaterialsQuery({
    page: pagination.page + 1, // Convert to 1-based
    limit: pagination.pageSize,
    ...filters,
  });

  const columns = getMaterialColumns({ onView, onEdit, onDelete, onRestore });

  return (
    <MuiDataGrid
      rows={data?.materials || []}
      columns={columns}
      loading={isLoading || isFetching}
      rowCount={data?.pagination?.totalCount || 0}
      paginationModel={pagination}
      onPaginationModelChange={setPagination}
    />
  );
};
```

### User Views (Three-Layer Pattern)

**Use for:** Tasks, Users (user view)

**Structure:** Page → List → Card

**Pattern:**

- **Page**: Fetch data, manage state/filters, handle events
- **List**: Layout, map items, delegate events to cards
- **Card**: Display single item, wrap with `React.memo`

**Example:**

```jsx
// TasksPage.jsx
const TasksPage = () => {
  const { data } = useGetTasksQuery();
  return <TasksList tasks={data?.tasks} onTaskClick={handleClick} />;
};

// TasksList.jsx
const TasksList = ({ tasks, onTaskClick }) => {
  return (
    <Grid container spacing={2}>
      {tasks.map((task) => (
        <Grid key={task._id} size={{ xs: 12, md: 6 }}>
          <TaskCard task={task} onClick={onTaskClick} />
        </Grid>
      ))}
    </Grid>
  );
};

// TaskCard.jsx
const TaskCard = React.memo(({ task, onClick }) => {
  return <Card onClick={() => onClick(task)}>{task.title}</Card>;
});
```

## Naming Conventions

| Type     | Pattern         | Example                | Location              |
| -------- | --------------- | ---------------------- | --------------------- |
| Pages    | `*Page`         | `MaterialsPage.jsx`    | `pages/`              |
| Forms    | `CreateUpdate*` | `CreateUpdateUser.jsx` | `components/forms/*/` |
| Filters  | `*Filter`       | `UserFilter.jsx`       | `components/filters/` |
| Columns  | `*Columns`      | `UserColumns.jsx`      | `components/columns/` |
| Cards    | `*Card`         | `TaskCard.jsx`         | `components/cards/`   |
| Lists    | `*List`         | `TasksList.jsx`        | `components/lists/`   |
| Hooks    | `use*`          | `useAuth.js`           | `hooks/`              |
| Services | camelCase       | `socketService.js`     | `services/`           |
| Utils    | camelCase       | `errorHandler.js`      | `utils/`              |

## Critical Rules

### Field Names

**Backend validators are the ONLY source of truth.** Always check `backend/middlewares/validators/*` before coding.

**Common Patterns:**

- Use `departmentId` not `department` (for references)
- Use `assigneeId` not `assignee` (for references)
- Use `vendorId` not `vendor` (for references)
- Use `organizationId` not `organization` (for references)
- Use `createdBy` not `creator` (for user references)
- Use `updatedBy` not `updater` (for user references)

**Validation:**

1. Read validator file for the resource
2. Match field names exactly (case-sensitive)
3. Match validation rules (required, min, max, enum)
4. Match query parameters for list endpoints

### Constants

**NEVER hardcode values.** Always import from `utils/constants.js`.

**Examples:**

- ❌ `if (status === "Completed")`
- ✅ `if (status === TASK_STATUS[2])`
- ❌ `role === "Admin"`
- ✅ `role === USER_ROLES.ADMIN`
- ❌ `priority === "High"`
- ✅ `priority === TASK_PRIORITY[2]`

### React Hook Form

**Rules:**

- ❌ NEVER use `watch()` method
- ✅ ALWAYS use controlled components (`value` + `onChange`)
- ✅ Use `control` prop for custom components
- ✅ Use `register` for native inputs

**Example:**

```jsx
const { control, handleSubmit } = useForm();

// ❌ Wrong
const watchedValue = watch("fieldName");

// ✅ Correct
<Controller
  name="fieldName"
  control={control}
  render={({ field }) => <MuiTextField {...field} />}
/>;
```

### MUI v7 Syntax

**Grid Component:**

- ❌ NEVER use `item` prop: `<Grid item xs={12}>`
- ✅ ALWAYS use `size` prop: `<Grid size={{ xs: 12, md: 6 }}>`

**Autocomplete Component:**

- ❌ NEVER use deprecated `renderTags`
- ✅ ALWAYS use `slots` API: `slots={{ tag: CustomTag }}`

### Dialogs

**ALL dialogs MUST include:**

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

### Controller Responses

**Display ALL fields returned by backend controllers.**

**Process:**

1. Check `backend/controllers/*` for response structure
2. Identify all fields in response
3. Display or use ALL fields in UI
4. Never ignore available data

### Performance

**Optimization Rules:**

- ✅ Wrap list/card components with `React.memo`
- ✅ Use `useCallback` for event handlers passed to children
- ✅ Use `useMemo` for expensive computations
- ✅ Destructure props at component level to prevent re-renders

**Example:**

```jsx
const TaskCard = React.memo(({ task, onClick }) => {
  const handleClick = useCallback(() => {
    onClick(task._id);
  }, [task._id, onClick]);

  const formattedDate = useMemo(() => {
    return dayjs(task.createdAt).format("MMM DD, YYYY");
  }, [task.createdAt]);

  return <Card onClick={handleClick}>{formattedDate}</Card>;
});
```

## Cross-Cutting Patterns

### Pagination Conversion

**Critical:** Backend uses 1-based pagination, MUI DataGrid uses 0-based

```javascript
// Frontend → Backend: Add 1
const { data } = useGetMaterialsQuery({
  page: pagination.page + 1, // 0 → 1, 1 → 2, etc.
  limit: pagination.pageSize,
});

// Backend → Frontend: Subtract 1 (handled by MuiDataGrid component)
// MuiDataGrid automatically converts internally
```

### Real-time Communication Architecture

```
Backend Event
   ↓
Socket.IO Server (utils/socketInstance.js)
   ↓
Emit to Rooms (user:id, department:id, organization:id)
   ↓
Socket.IO Client (services/socketService.js)
   ↓
Event Handler (services/socketEvents.js)
   ↓
Redux Cache Invalidation (store.dispatch)
   ↓
RTK Query Refetch
   ↓
Component Re-render
```

**Authentication:** HTTP-only cookies (same JWT as HTTP requests)

**Rooms:**

- `user:${userId}` - User-specific events
- `department:${departmentId}` - Department-wide events
- `organization:${organizationId}` - Organization-wide events

### File Upload Flow

```
User Selects File
   ↓
Client Validation (type, size)
   ↓
Upload to Cloudinary (Direct Upload)
   ↓
Receive Cloudinary URL
   ↓
Send Metadata to Backend
   ↓
Backend Creates Attachment Record
   ↓
Return Attachment Object
   ↓
Display in UI
```

**File Types:**

- Image: .jpg, .jpeg, .png, .gif, .webp, .svg (max 10MB)
- Video: .mp4, .avi, .mov, .wmv (max 100MB)
- Document: .pdf, .doc, .docx, .xls, .xlsx (max 25MB)
- Audio: .mp3, .wav, .ogg (max 20MB)
- Other: (max 50MB)

### Data Transformation Patterns

**Response Formatting:**

```javascript
// Backend response
{
  success: true,
  data: {
    materials: [...],
    pagination: {
      page: 1,        // 1-based
      limit: 10,
      totalCount: 100,
      totalPages: 10,
      hasNext: true,
      hasPrev: false
    }
  }
}

// Frontend usage
const { materials, pagination } = data;
```

**Date Formatting:**

```javascript
// Backend: UTC storage, ISO format response
createdAt: "2024-01-15T10:30:00.000Z";

// Frontend: Convert to local timezone for display
const formattedDate = dayjs(task.createdAt).format("MMM DD, YYYY");
// Output: "Jan 15, 2024"
```

**Population:**

```javascript
// Backend populates references
{
  _id: "123",
  name: "Material A",
  departmentId: {
    _id: "dept1",
    name: "Engineering"
  },
  organizationId: {
    _id: "org1",
    name: "Company A"
  }
}

// Frontend accesses nested data
material.departmentId.name // "Engineering"
```

### Timezone Management

**Backend:**

- All dates stored in UTC
- `process.env.TZ = 'UTC'`
- dayjs with UTC plugin
- API responses in ISO 8601 format

**Frontend:**

- Automatic local timezone detection
- UTC to local conversion for display
- Local to UTC conversion for submission
- DateTimePicker handles timezone automatically

```javascript
// Display: UTC → Local
const displayDate = dayjs
  .utc(task.createdAt)
  .local()
  .format("MMM DD, YYYY HH:mm");

// Submit: Local → UTC
const utcDate = dayjs(selectedDate).utc().toISOString();
```

### Multi-tenancy Isolation

**Backend Scoping:**

- All queries scoped to user's organization
- Department-level scoping for Manager/User roles
- Platform SuperAdmin can access all organizations

**Frontend Scoping:**

- User can only see data from their organization
- UI elements hidden based on role and permissions
- Authorization helper checks permissions for visibility

```javascript
// Check if user can access feature
if (hasPermission(user.role, USER_ROLES.ADMIN)) {
  // Show admin-only features
}

// Scope queries to user's context
const { data } = useGetTasksQuery({
  departmentId: user.departmentId, // Automatic scoping
  organizationId: user.organizationId,
});
```

## API Routes

All routes prefixed with `/api`:

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Organizations

- `GET /api/organizations` - List organizations (platform SuperAdmin only)
- `GET /api/organizations/:id` - Get organization details
- `POST /api/organizations` - Create organization (platform SuperAdmin only)
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Soft delete organization
- `PATCH /api/organizations/:id/restore` - Restore organization

### Departments

- `GET /api/departments` - List departments
- `GET /api/departments/:id` - Get department details
- `POST /api/departments` - Create department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Soft delete department
- `PATCH /api/departments/:id/restore` - Restore department

### Users

- `GET /api/users` - List users
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Soft delete user
- `PATCH /api/users/:id/restore` - Restore user
- `PATCH /api/users/:id/status` - Update user status

### Tasks

- `GET /api/tasks` - List tasks
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Soft delete task
- `PATCH /api/tasks/:id/restore` - Restore task

### Materials

- `GET /api/materials` - List materials
- `GET /api/materials/:id` - Get material details
- `POST /api/materials` - Create material
- `PUT /api/materials/:id` - Update material
- `DELETE /api/materials/:id` - Soft delete material
- `PATCH /api/materials/:id/restore` - Restore material

### Vendors

- `GET /api/vendors` - List vendors
- `GET /api/vendors/:id` - Get vendor details
- `POST /api/vendors` - Create vendor
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Soft delete vendor (requires reassignment)
- `PATCH /api/vendors/:id/restore` - Restore vendor

### Notifications

- `GET /api/notifications` - List notifications
- `GET /api/notifications/:id` - Get notification details
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `PATCH /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete notification

### Attachments

- `GET /api/attachments` - List attachments
- `GET /api/attachments/:id` - Get attachment details
- `POST /api/attachments` - Upload attachment
- `DELETE /api/attachments/:id` - Delete attachment

## Data Models

### Model Relationships

**Inheritance (Discriminator Pattern):**

- BaseTask → ProjectTask, RoutineTask, AssignedTask

**References (Population):**

- User → Department → Organization (hierarchical)
- ProjectTask → Vendor (required, external client)
- ProjectTask → Materials (via TaskActivity, many-to-many with quantity)
- ProjectTask → Assignees/Watchers (many-to-many, watchers HOD only)
- AssignedTask → Materials (via TaskActivity, many-to-many with quantity)
- RoutineTask → Materials (direct, many-to-many with quantity, no TaskActivity)
- TaskActivity → parent (ProjectTask or AssignedTask ONLY, not RoutineTask)
- TaskComment → parent (RoutineTask, ProjectTask, AssignedTask, TaskActivity, TaskComment)
- Attachment → parent (any task type, TaskActivity, TaskComment)
- Notification → recipient (User), entity (any resource)

**Soft Delete:**

- ALL models include `isDeleted` flag via softDelete plugin
- Soft deleted resources can be restored
- Queries automatically filter out soft deleted resources (unless explicitly included)

### Key Models

**Organization**: name, description, industry, address, phone, email, isDeleted, timestamps

**Department**: name, description, organizationId, isDeleted, timestamps

**User**: firstName, lastName, email, password, role, departmentId, organizationId, employeeId, position, phone, profilePicture, skills, status, isDeleted, timestamps

**BaseTask**: title, description, status, priority, dueDate, tags, createdBy, updatedBy, departmentId, organizationId, taskType (discriminator), isDeleted, timestamps. Abstract base holding shared fields for all task types.

**ProjectTask** (extends BaseTask): vendorId (required), estimatedCost, actualCost, currency, costHistory, assignees, watchers. Outsourced to external vendor. Materials added via TaskActivity.

**RoutineTask** (extends BaseTask): materials (direct), startDate, dueDate. Daily routine task received from outlets. Materials added directly (no TaskActivity). Restricted status/priority.

**AssignedTask** (extends BaseTask): assignedTo (single or group). Assigned to department user(s). Materials added via TaskActivity.

**TaskActivity**: content, parentId (ProjectTask or AssignedTask ONLY), parentModel, materials, createdBy, updatedBy, departmentId, organizationId, isDeleted, timestamps. Does NOT exist for RoutineTask.

**TaskComment**: content, parentId, parentModel, mentions, createdBy, updatedBy, departmentId, organizationId, isDeleted, timestamps

**Material**: name, description, category, quantity, unitType, cost, price, currency, vendorId, departmentId, organizationId, isDeleted, timestamps

**Vendor**: name, description, contactPerson, email, phone, address, departmentId, organizationId, isDeleted, timestamps. External client who takes and completes ProjectTasks.

**Attachment**: filename, fileUrl, fileType, fileSize, parentId, parentModel, uploadedBy, departmentId, organizationId, isDeleted, timestamps

**Notification**: title, message, type, isRead, recipientId, entityId, entityModel, organizationId, expiresAt, timestamps

## Routing Configuration

### Route Structure

```javascript
// routes.jsx
createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      // Public routes
      {
        element: <PublicLayout />,
        children: [
          {
            index: true,
            element: (
              <PublicRoute>
                <Home />
              </PublicRoute>
            ),
          },
          {
            path: "login",
            element: (
              <PublicRoute>
                <Login />
              </PublicRoute>
            ),
          },
          {
            path: "register",
            element: (
              <PublicRoute>
                <Register />
              </PublicRoute>
            ),
          },
        ],
      },
      // Protected routes
      {
        element: <DashboardLayout />,
        children: [
          {
            path: "dashboard",
            element: (
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            ),
          },
          {
            path: "tasks",
            element: (
              <ProtectedRoute>
                <Tasks />
              </ProtectedRoute>
            ),
          },
          // ... more routes
        ],
      },
    ],
  },
]);
```

### Public Routes (PublicLayout)

- `/` - Home page
- `/login` - Login form
- `/register` - Registration form (multi-step wizard)
- `/forgot-password` - Forgot password form
- `/reset-password` - Reset password form

**Behavior:**

- Redirects authenticated users to `/dashboard`
- No authentication required
- No authorization checks

### Protected Routes (DashboardLayout)

- `/dashboard` - Dashboard page (widgets, statistics)
- `/tasks` - Tasks page (three-layer pattern: TasksList → TaskCard)
- `/users` - Users page (three-layer pattern: UsersList → UserCard)
- `/materials` - Materials page (DataGrid pattern)
- `/vendors` - Vendors page (DataGrid pattern)
- `/admin/organization` - Organization detail page (Admin+)
- `/admin/departments` - Departments page (DataGrid pattern, Admin+)
- `/admin/users` - Users admin page (DataGrid pattern, Admin+)
- `/platform/organizations` - Organizations page (Platform SuperAdmin only)

**Behavior:**

- Requires authentication (JWT token in cookie)
- Redirects unauthenticated users to `/login`
- Role-based access control (some routes restricted by role)

### Error Routes

- `*` - 404 Not Found page

### Route Protection Patterns

**ProtectedRoute Component:**

```javascript
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
```

**PublicRoute Component:**

```javascript
const PublicRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
```

### Lazy Loading

All page components are lazy-loaded for code splitting:

```javascript
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Materials = lazy(() => import("./pages/Materials"));

// Wrapped in Suspense with loading fallback
<Suspense fallback={<MuiLoading fullScreen />}>
  <Dashboard />
</Suspense>;
```

**Benefits:**

- Reduced initial bundle size
- Faster initial page load
- Better performance for large applications

## State Management

### Redux Store Structure

```javascript
{
  auth: {
    user: null,
    isAuthenticated: false,
    isLoading: false
  },
  [resourceApi.reducerPath]: {
    // RTK Query cache
    queries: {
      'getMaterials({"page":1,"limit":10})': {
        status: 'fulfilled',
        data: { materials: [...], pagination: {...} },
        endpointName: 'getMaterials'
      }
    },
    mutations: {},
    provided: {
      Material: ['LIST', 'id1', 'id2'],
      Task: ['LIST', 'id3']
    }
  }
}
```

### Redux Store Configuration

**File:** `redux/app/store.js`

```javascript
import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { api } from "../features/api";
import authReducer from "../features/auth/authSlice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"], // Only persist auth slice
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: persistedAuthReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(api.middleware),
});

export const persistor = persistStore(store);
setupListeners(store.dispatch);
```

### RTK Query Base API

**File:** `redux/features/api.js`

```javascript
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    credentials: "include", // Send HTTP-only cookies
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: [
    "Task",
    "TaskActivity",
    "TaskComment",
    "User",
    "Organization",
    "Department",
    "Material",
    "Vendor",
    "Notification",
    "Attachment",
  ],
  endpoints: () => ({}),
});
```

### RTK Query Tags

Used for cache invalidation:

- `Task`, `TaskActivity`, `TaskComment` - Task-related resources
- `User`, `Organization`, `Department` - User management
- `Material`, `Vendor` - Inventory management
- `Notification`, `Attachment` - Supporting resources

**Tag Patterns:**

```javascript
// Provide tags (for queries)
providesTags: (result) =>
  result
    ? [
        ...result.materials.map(({ _id }) => ({ type: "Material", id: _id })),
        { type: "Material", id: "LIST" },
      ]
    : [{ type: "Material", id: "LIST" }];

// Invalidate tags (for mutations)
invalidatesTags: [{ type: "Material", id: "LIST" }];
invalidatesTags: (result, error, { id }) => [
  { type: "Material", id },
  { type: "Material", id: "LIST" },
];
```

### Redux Slices

**Auth Slice** (`redux/features/auth/authSlice.js`):

```javascript
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isAuthenticated: false,
    isLoading: false,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
```

### Redux Persist

**Persisted slices:**

- `auth` - User authentication state (user, isAuthenticated, isLoading)

**Not persisted:**

- RTK Query cache (auto-managed, refetched on mount)

**Storage:** localStorage

**Rehydration:** Automatic on app load

### Resource API Pattern

Each resource follows the same pattern:

**File:** `redux/features/material/materialApi.js`

```javascript
export const materialApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // List with pagination
    getMaterials: builder.query({
      query: (params) => ({ url: "/materials", params }),
      providesTags: (result) => [
        ...result.materials.map(({ _id }) => ({ type: "Material", id: _id })),
        { type: "Material", id: "LIST" },
      ],
    }),

    // Get single
    getMaterial: builder.query({
      query: (id) => `/materials/${id}`,
      providesTags: (result, error, id) => [{ type: "Material", id }],
    }),

    // Create
    createMaterial: builder.mutation({
      query: (body) => ({ url: "/materials", method: "POST", body }),
      invalidatesTags: [{ type: "Material", id: "LIST" }],
    }),

    // Update
    updateMaterial: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/materials/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Material", id },
        { type: "Material", id: "LIST" },
      ],
    }),

    // Delete (soft delete)
    deleteMaterial: builder.mutation({
      query: (id) => ({ url: `/materials/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Material", id: "LIST" }],
    }),

    // Restore
    restoreMaterial: builder.mutation({
      query: (id) => ({ url: `/materials/${id}/restore`, method: "PATCH" }),
      invalidatesTags: [{ type: "Material", id: "LIST" }],
    }),
  }),
});

export const {
  useGetMaterialsQuery,
  useGetMaterialQuery,
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
  useDeleteMaterialMutation,
  useRestoreMaterialMutation,
} = materialApi;
```

## Backend Patterns and Conventions

### Backend Naming Conventions

**Files:**

- Controllers: `*Controllers.js` (e.g., `userControllers.js`)
- Models: PascalCase `.js` (e.g., `User.js`, `BaseTask.js`)
- Routes: `*Routes.js` (e.g., `userRoutes.js`)
- Validators: `*Validators.js` (e.g., `userValidators.js`)
- Services: camelCase `.js` (e.g., `emailService.js`)
- Utils: camelCase `.js` (e.g., `constants.js`, `helpers.js`)
- Middleware: camelCase `.js` (e.g., `authMiddleware.js`)

**Variables and Functions:**

- camelCase for variables and functions
- PascalCase for classes and constructors
- UPPER_SNAKE_CASE for constants

**Database:**

- Collections: lowercase plural (e.g., `users`, `organizations`)
- Fields: camelCase (e.g., `firstName`, `createdAt`)
- References: `*Id` suffix (e.g., `userId`, `departmentId`)

### Controller Patterns

**Standard Controller Structure:**

```javascript
import asyncHandler from "express-async-handler";
import CustomError from "../errorHandler/CustomError.js";
import { Model } from "../models/index.js";
import { emitSocketEvent } from "../utils/socketEmitter.js";
import { formatResponse } from "../utils/responseTransform.js";

export const createResource = asyncHandler(async (req, res) => {
  // 1. Extract and validate data
  const { field1, field2 } = req.body;
  const { userId, departmentId, organizationId } = req.user;

  // 2. Check authorization and ownership
  // (handled by authorization middleware)

  // 3. Perform business logic
  const resource = await Model.create({
    field1,
    field2,
    createdBy: userId,
    departmentId,
    organizationId,
  });

  // 4. Emit Socket.IO event
  emitSocketEvent("resource:created", resource, {
    rooms: [`department:${departmentId}`, `organization:${organizationId}`],
  });

  // 5. Send response
  res
    .status(201)
    .json(formatResponse(true, "Resource created successfully", { resource }));
});
```

**Common Controller Patterns:**

**Pagination:**

```javascript
const {
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
} = req.query;

const options = {
  page: parseInt(page),
  limit: parseInt(limit),
  sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
  populate: ["departmentId", "organizationId"],
};

const result = await Model.paginate(query, options);
```

**Soft Delete:**

```javascript
// Delete
await resource.softDelete(); // Sets isDeleted = true, deletedAt = now

// Restore
await resource.restore(); // Sets isDeleted = false, deletedAt = null
```

**Error Handling:**

```javascript
if (!resource) {
  throw CustomError.notFound("Resource not found");
}

if (resource.isDeleted) {
  throw CustomError.gone("Resource has been deleted");
}

if (!hasPermission) {
  throw CustomError.forbidden("Insufficient permissions");
}
```

**Multi-tenancy Scoping:**

```javascript
// Scope query to user's organization
const query = {
  organizationId: req.user.organizationId,
  isDeleted: false,
};

// Scope to user's department (Manager/User)
if (req.user.role === "Manager" || req.user.role === "User") {
  query.departmentId = req.user.departmentId;
}
```

### Service Patterns

**Service Structure:**

```javascript
// services/resourceService.js
import { Model } from "../models/index.js";
import CustomError from "../errorHandler/CustomError.js";

class ResourceService {
  async create(data) {
    // Business logic
    const resource = await Model.create(data);
    return resource;
  }

  async findById(id) {
    const resource = await Model.findById(id);
    if (!resource) {
      throw CustomError.notFound("Resource not found");
    }
    return resource;
  }

  async update(id, data) {
    const resource = await Model.findByIdAndUpdate(id, data, { new: true });
    if (!resource) {
      throw CustomError.notFound("Resource not found");
    }
    return resource;
  }

  async delete(id) {
    const resource = await Model.findById(id);
    if (!resource) {
      throw CustomError.notFound("Resource not found");
    }
    await resource.softDelete();
    return resource;
  }
}

export default new ResourceService();
```

**Email Service Pattern:**

```javascript
// services/emailService.js
import nodemailer from "nodemailer";
import { emailTemplates } from "../templates/emailTemplates.js";

class EmailService {
  constructor() {
    this.transporter = null;
    this.queue = [];
  }

  async initialize() {
    this.transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendEmail(to, subject, html) {
    this.queue.push({ to, subject, html });
    this.processQueue();
  }

  async processQueue() {
    // Process email queue asynchronously
  }
}

export default new EmailService();
```

### Model Patterns

**Model Structure:**

```javascript
import mongoose from "mongoose";
import softDeletePlugin from "./plugins/softDelete.js";

const resourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name must not exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description must not exceed 2000 characters"],
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
resourceSchema.index({ organizationId: 1, departmentId: 1, createdAt: -1 });
resourceSchema.index({ name: "text" });

// Virtuals
resourceSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save hooks
resourceSchema.pre("save", async function (next) {
  // Validation logic
  next();
});

// Instance methods
resourceSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Static methods
resourceSchema.statics.findByOrganization = function (organizationId) {
  return this.find({ organizationId, isDeleted: false });
};

// Apply soft delete plugin
resourceSchema.plugin(softDeletePlugin);

export default mongoose.model("Resource", resourceSchema);
```

**Discriminator Pattern (Task Models):**

```javascript
// BaseTask.js
const baseTaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  taskType: String, // Discriminator key
});

export default mongoose.model("BaseTask", baseTaskSchema);

// ProjectTask.js
import BaseTask from "./BaseTask.js";

const projectTaskSchema = new mongoose.Schema({
  estimatedCost: Number,
  actualCost: Number,
  materials: [{ type: ObjectId, ref: "Material" }],
});

export default BaseTask.discriminator("ProjectTask", projectTaskSchema);
```

### Middleware Patterns

**Authentication Middleware:**

```javascript
// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import CustomError from "../errorHandler/CustomError.js";
import { User } from "../models/index.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  // Extract token from cookie
  const token = req.cookies.access_token;

  if (!token) {
    throw CustomError.unauthorized("Access token required");
  }

  // Verify token
  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

  // Find user
  const user = await User.findById(decoded.userId);

  if (!user || user.isDeleted) {
    throw CustomError.unauthorized("Invalid token");
  }

  // Attach user to request
  req.user = user;
  next();
});
```

**Authorization Middleware:**

```javascript
// middlewares/authorization.js
import CustomError from "../errorHandler/CustomError.js";
import { hasPermission } from "../utils/authorizationMatrix.js";

export const authorize = (resource, operation) => {
  return async (req, res, next) => {
    const { user } = req;
    const { role, organizationId, departmentId } = user;

    // Get allowed scopes from matrix
    const allowedScopes = getAllowedScopes(role, resource, operation);

    if (!allowedScopes || allowedScopes.length === 0) {
      throw CustomError.forbidden("Insufficient permissions");
    }

    // Determine scope of request
    const requestScope = determineRequestScope(req, user);

    // Check if user has permission for this scope
    if (!allowedScopes.includes(requestScope)) {
      throw CustomError.forbidden("Insufficient permissions for this scope");
    }

    // Attach authorization info to request
    req.authorization = {
      allowedScopes,
      requestScope,
    };

    next();
  };
};
```

**Validation Middleware:**

```javascript
// middlewares/validators/validation.js
import { validationResult } from "express-validator";
import CustomError from "../../errorHandler/CustomError.js";

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));

    throw CustomError.badRequest("Validation failed", {
      errors: errorMessages,
    });
  }

  next();
};
```

### Route Patterns

**Route Structure:**

```javascript
// routes/resourceRoutes.js
import express from "express";
import {
  createResource,
  getAllResources,
  getResource,
  updateResource,
  deleteResource,
  restoreResource,
} from "../controllers/resourceControllers.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorization.js";
import {
  validateCreateResource,
  validateGetAllResources,
  validateGetResource,
  validateUpdateResource,
} from "../middlewares/validators/resourceValidators.js";

const router = express.Router();

// Public routes (none for resources)

// Protected routes
router.use(verifyJWT); // All routes below require authentication

router
  .route("/")
  .get(authorize("Resource", "read"), validateGetAllResources, getAllResources)
  .post(
    authorize("Resource", "create"),
    validateCreateResource,
    createResource
  );

router
  .route("/:resourceId")
  .get(authorize("Resource", "read"), validateGetResource, getResource)
  .put(authorize("Resource", "update"), validateUpdateResource, updateResource)
  .delete(authorize("Resource", "delete"), deleteResource);

router
  .route("/:resourceId/restore")
  .patch(authorize("Resource", "update"), restoreResource);

export default router;
```

**Route Aggregation:**

```javascript
// routes/index.js
import express from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import organizationRoutes from "./organizationRoutes.js";
// ... more routes

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/organizations", organizationRoutes);
// ... more routes

export default router;
```

### Error Handling Patterns

**Custom Error Class:**

```javascript
// errorHandler/CustomError.js
class CustomError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errorCode = "BAD_REQUEST") {
    return new CustomError(message, 400, errorCode);
  }

  static unauthorized(message, errorCode = "UNAUTHORIZED") {
    return new CustomError(message, 401, errorCode);
  }

  static forbidden(message, errorCode = "FORBIDDEN") {
    return new CustomError(message, 403, errorCode);
  }

  static notFound(message, errorCode = "NOT_FOUND") {
    return new CustomError(message, 404, errorCode);
  }

  static conflict(message, errorCode = "CONFLICT") {
    return new CustomError(message, 409, errorCode);
  }

  static gone(message, errorCode = "GONE") {
    return new CustomError(message, 410, errorCode);
  }

  static internalServer(message, errorCode = "INTERNAL_SERVER_ERROR") {
    return new CustomError(message, 500, errorCode);
  }
}

export default CustomError;
```

**Global Error Handler:**

```javascript
// errorHandler/ErrorController.js
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    error = CustomError.badRequest("Invalid ID format");
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = CustomError.conflict(`${field} already exists`);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = CustomError.badRequest(messages.join(", "));
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error = CustomError.unauthorized("Invalid token");
  }

  if (err.name === "TokenExpiredError") {
    error = CustomError.unauthorized("Token expired");
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal server error",
    errorCode: error.errorCode || "INTERNAL_SERVER_ERROR",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
```

### Utility Patterns

**Response Formatting:**

```javascript
// utils/responseTransform.js
export const formatResponse = (success, message, data = null) => ({
  success,
  message,
  ...(data && { data }),
});

export const formatPaginatedResponse = (
  success,
  message,
  resourceName,
  docs,
  pagination
) => ({
  success,
  message,
  data: {
    [resourceName]: docs,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      totalCount: pagination.totalDocs,
      totalPages: pagination.totalPages,
      hasNext: pagination.hasNextPage,
      hasPrev: pagination.hasPrevPage,
    },
  },
});
```

**Socket.IO Emitter:**

```javascript
// utils/socketEmitter.js
import { getIO } from "./socketInstance.js";

export const emitToRooms = (event, data, rooms) => {
  const io = getIO();
  rooms.forEach((room) => {
    io.to(room).emit(event, data);
  });
};

export const emitTaskEvent = (event, task) => {
  emitToRooms(event, task, [
    `department:${task.departmentId}`,
    `organization:${task.organizationId}`,
  ]);
};

export const emitUserEvent = (event, user) => {
  emitToRooms(event, user, [
    `user:${user._id}`,
    `department:${user.departmentId}`,
    `organization:${user.organizationId}`,
  ]);
};
```

---

**Last Updated**: December 5, 2024
**Next Review**: After major architecture changes or new patterns introduced
