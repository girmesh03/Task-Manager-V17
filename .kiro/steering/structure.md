---
inclusion: always
---

# Project Structure & Architecture

## Monorepo Layout

```
backend/    # Node.js/Express API server
client/     # React/Vite frontend
docs/       # Documentation
```

## Backend Architecture

### Layer Flow (MANDATORY)

Routes → Controllers → Services → Models

**NEVER skip layers.** Controllers handle HTTP, services contain business logic, models define data.

### Directory Map

- `config/` - CORS, DB, authorization matrix
- `controllers/` - HTTP handlers (req/res only, no business logic)
- `services/` - Business logic and external integrations
- `models/` - Mongoose schemas with validation
- `routes/` - Endpoint definitions with middleware chain
- `middlewares/` - Auth, validation, rate limiting
  - `validators/` - **SOURCE OF TRUTH for all field names and constraints**
- `utils/` - Shared utilities and `constants.js` (import, never hardcode)
- `errorHandler/` - CustomError class with typed methods
- `templates/` - Email templates
- `mock/` - Seed data
- `tests/` - Unit and property-based tests

### Complete Backend File Structure

```
backend/
├── config/
│   ├── allowedOrigins.js          # CORS allowed origins list
│   ├── authorizationMatrix.json   # Role-based permissions (ONLY source of truth)
│   ├── corsOptions.js             # CORS configuration with validation
│   └── db.js                      # MongoDB connection with retry logic
├── controllers/
│   ├── attachmentControllers.js   # Attachment CRUD operations
│   ├── authControllers.js         # Login, register, refresh, logout, password reset
│   ├── departmentControllers.js   # Department CRUD with cascade
│   ├── materialControllers.js     # Material CRUD operations
│   ├── notificationControllers.js # Notification CRUD, mark as read
│   ├── organizationControllers.js # Organization CRUD (platform SuperAdmin)
│   ├── taskControllers.js         # Task CRUD (all types: ProjectTask/RoutineTask/AssignedTask)
│   ├── userControllers.js         # User CRUD, profile, status updates
│   └── vendorControllers.js       # Vendor CRUD with material reassignment
```

├── errorHandler/
│ ├── CustomError.js # Custom error class with status codes
│ └── ErrorController.js # Global error handler middleware
├── middlewares/
│ ├── validators/
│ │ ├── attachmentValidators.js # Attachment validation rules
│ │ ├── authValidators.js # Auth validation (register, login, reset)
│ │ ├── departmentValidators.js # Department validation rules
│ │ ├── materialValidators.js # Material validation rules
│ │ ├── notificationValidators.js # Notification validation rules
│ │ ├── organizationValidators.js # Organization validation rules
│ │ ├── taskValidators.js # Task validation (all types)
│ │ ├── userValidators.js # User validation rules
│ │ ├── validation.js # Validation result handler
│ │ └── vendorValidators.js # Vendor validation rules
│ ├── authMiddleware.js # JWT verification (verifyJWT, verifyRefresh_token)
│ ├── authorization.js # Role-based authorization middleware
│ └── rateLimiter.js # Rate limiting (production only)
├── mock/
│ ├── cleanSeedSetup.js # Seed data initialization script
│ └── data.js # Mock data for seeding
├── models/
│ ├── plugins/
│ │ └── softDelete.js # Universal soft delete plugin
│ ├── AssignedTask.js # Assigned task model (discriminator)
│ ├── Attachment.js # Attachment model (polymorphic parent)
│ ├── BaseTask.js # Base task model (discriminator base)
│ ├── Department.js # Department model with cascade
│ ├── index.js # Model exports
│ ├── Material.js # Material model
│ ├── Notification.js # Notification model with TTL
│ ├── Organization.js # Organization model (tenant)
│ ├── ProjectTask.js # Project task model (discriminator)
│ ├── RoutineTask.js # Routine task model (discriminator)
│ ├── TaskActivity.js # Task activity model (ProjectTask/AssignedTask only)
│ ├── TaskComment.js # Task comment model (threaded, max depth 3)
│ ├── User.js # User model with authentication
│ └── Vendor.js # Vendor model (external clients)
├── routes/
│ ├── attachmentRoutes.js # Attachment routes
│ ├── authRoutes.js # Auth routes (public + protected)
│ ├── departmentRoutes.js # Department routes
│ ├── index.js # Route aggregator
│ ├── materialRoutes.js # Material routes
│ ├── notificationRoutes.js # Notification routes
│ ├── organizationRoutes.js # Organization routes
│ ├── taskRoutes.js # Task routes (all types)
│ ├── userRoutes.js # User routes
│ └── vendorRoutes.js # Vendor routes
├── services/
│ ├── emailService.js # Email sending (Nodemailer, Gmail SMTP, queue-based)
│ └── notificationService.js # Notification creation and management
├── templates/
│ └── emailTemplates.js # HTML email templates
├── utils/
│ ├── authorizationMatrix.js # Authorization helper functions
│ ├── constants.js # ALL constants (ONLY source of truth)
│ ├── generateTokens.js # JWT token generation
│ ├── helpers.js # Utility functions
│ ├── logger.js # Winston logger configuration
│ ├── materialTransform.js # Material data transformation
│ ├── responseTransform.js # Response formatting
│ ├── socket.js # Socket.IO event handlers
│ ├── socketEmitter.js # Socket.IO event emitters
│ ├── socketInstance.js # Socket.IO singleton
│ ├── userStatus.js # User status tracking
│ └── validateEnv.js # Environment validation
├── tests/
│ ├── unit/ # Unit tests
│ ├── property/ # Property-based tests
│ ├── globalSetup.js # Test setup
│ ├── globalTeardown.js # Test cleanup
│ └── setup.js # Test configuration
├── .env # Environment variables
├── app.js # Express app configuration
├── jest.config.js # Jest configuration (ES modules)
├── package.json # Dependencies and scripts
└── server.js # Server startup and lifecycle

````

### Controller Template

```javascript
export const create = asyncHandler(async (req, res) => {
  const result = await service.create(req.body);
  res.status(201).json({ success: true, data: result });
});
````

### Service Template

```javascript
export const create = async (data) => {
  // Business logic here
  return await Model.create(data);
};
```

### Critical Backend Rules

- Use ES Modules (`import`/`export`)
- Wrap async handlers with `express-async-handler`
- Use Mongoose discriminators for task types (BaseTask → ProjectTask/AssignedTask/RoutineTask)
- Apply softDelete plugin to ALL models
- Use sessions for transactions (cascade operations, multi-document updates)
- Socket.IO singleton pattern via `utils/socketInstance.js`
- Import constants from `utils/constants.js` - NEVER hardcode values
- Validators in `middlewares/validators/*` are the ONLY source of truth for field names

## Frontend Architecture

### Layer Flow

Pages → Components → Redux (RTK Query) → API

### Directory Map

- `pages/` - Route components with data fetching
- `components/` - Organized by type:
  - `auth/` - AuthProvider, ProtectedRoute, PublicRoute
  - `cards/` - Card components for list views
  - `columns/` - DataGrid column definitions
  - `common/` - Reusable MUI wrappers, filters, dialogs
  - `filters/` - DataGrid filter components
  - `forms/` - Domain-organized form components
  - `lists/` - List components for user views
- `redux/`
  - `app/` - Store configuration
  - `features/` - Feature slices and RTK Query APIs
- `services/` - API and Socket.IO integration
- `hooks/` - Custom hooks (useAuth, useSocket)
- `layouts/` - Layout wrappers
- `router/` - Route configuration
- `theme/` - MUI customization
- `utils/` - Shared utilities and constants

### Complete Frontend File Structure

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
│   │   │   ├── CustomDataGridToolbar.jsx  # DataGrid toolbar (export, filter, columns)
│   │   │   ├── CustomIcons.jsx            # Custom icons
│   │   │   ├── ErrorBoundary.jsx          # Error boundary component
│   │   │   ├── FilterChipGroup.jsx        # Active filters display
│   │   │   ├── FilterDateRange.jsx        # Date range filter
│   │   │   ├── FilterSelect.jsx           # Select filter
│   │   │   ├── FilterTextField.jsx        # Text filter with debouncing
│   │   │   ├── GlobalSearch.jsx           # Global search bar (Ctrl+K)
│   │   │   ├── index.js                   # Common exports
│   │   │   ├── MuiActionColumn.jsx        # DataGrid action column (View/Edit/Delete/Restore)
│   │   │   ├── MuiCheckbox.jsx            # Checkbox input
│   │   │   ├── MuiDataGrid.jsx            # DataGrid wrapper (auto pagination conversion)
│   │   │   ├── MuiDatePicker.jsx          # Date picker (UTC conversion)
│   │   │   ├── MuiDateRangePicker.jsx     # Date range picker
│   │   │   ├── MuiDialog.jsx              # Dialog wrapper (accessibility props)
│   │   │   ├── MuiDialogConfirm.jsx       # Confirmation dialog
│   │   │   ├── MuiFileUpload.jsx          # File upload (Cloudinary)
│   │   │   ├── MuiLoading.jsx             # Loading spinner
│   │   │   ├── MuiMultiSelect.jsx         # Multi-select autocomplete
│   │   │   ├── MuiNumberField.jsx         # Number input
│   │   │   ├── MuiRadioGroup.jsx          # Radio group
│   │   │   ├── MuiResourceSelect.jsx      # Resource select (users/departments/materials/vendors)
│   │   │   ├── MuiSelectAutocomplete.jsx  # Autocomplete select
│   │   │   ├── MuiTextArea.jsx            # Text area with character counter
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
│   │   ├── DashboardLayout.jsx    # Protected layout (Header, Sidebar, Footer)
│   │   ├── PublicLayout.jsx       # Public layout
│   │   └── RootLayout.jsx         # Root layout
│   ├── pages/
│   │   ├── Dashboard.jsx          # Dashboard page (widgets, statistics)
│   │   ├── Departments.jsx        # Departments page (DataGrid pattern)
│   │   ├── ForgotPassword.jsx     # Forgot password page
│   │   ├── Home.jsx               # Home page
│   │   ├── Materials.jsx          # Materials page (DataGrid pattern)
│   │   ├── NotFound.jsx           # 404 page
│   │   ├── Organization.jsx       # Organization detail page
│   │   ├── Organizations.jsx      # Organizations list page (Platform SuperAdmin)
│   │   ├── Tasks.jsx              # Tasks page (Three-Layer pattern)
│   │   ├── Users.jsx              # Users page (Three-Layer pattern)
│   │   └── Vendors.jsx            # Vendors page (DataGrid pattern)
│   ├── redux/
│   │   ├── app/
│   │   │   └── store.js           # Redux store configuration (persist auth)
│   │   └── features/
│   │       ├── api.js             # Base API configuration (RTK Query)
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
│   │   └── routes.jsx             # Route configuration (lazy loading)
│   ├── services/
│   │   ├── socketEvents.js        # Socket.IO event handlers (cache invalidation)
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
│   │   ├── AppTheme.jsx           # Theme provider (light/dark mode)
│   │   └── themePrimitives.js     # Theme primitives (colors, spacing)
│   ├── utils/
│   │   ├── constants.js           # ALL constants (MUST mirror backend exactly)
│   │   └── errorHandler.js        # Custom error class
│   ├── App.jsx                    # Root component
│   └── main.jsx                   # Application entry point
├── .env                           # Environment variables
├── eslint.config.js               # ESLint configuration
├── index.html                     # HTML template
├── package.json                   # Dependencies and scripts
└── vite.config.js                 # Vite configuration (code splitting, terser)
```

### Frontend Code Patterns

#### Admin Views (DataGrid Pattern)

```
Page → MuiDataGrid → Columns + Filter + Form
```

- **Page**: RTK Query data fetching
- **Columns**: Column configuration
- **Filter**: Filtering UI
- **Form**: Create/Update dialog

**Use For**: Organizations, Departments, Materials, Vendors, Users (admin view)

**When to Use**:

- Resource management pages requiring CRUD operations
- Pages with complex filtering, sorting, and pagination
- Admin-level views with bulk operations
- Data-heavy interfaces with many columns

#### User Views (Three-Layer Pattern)

```
Page → List → Card
```

- **Page**: Data fetching and state
- **List**: Collection renderer
- **Card**: Individual item

**Use For**: Tasks, Users (user view), Dashboard widgets

**When to Use**:

- Card-based layouts for better visual hierarchy
- User-facing views (non-admin)
- Mobile-responsive designs
- Content-heavy displays

#### Form Handling

```javascript
// Use react-hook-form with controlled components
const { control, handleSubmit } = useForm();

// NEVER use watch() method
// ❌ const values = watch();
// ✅ Use controlled components with Controller
<Controller
  name="fieldName"
  control={control}
  render={({ field }) => <TextField {...field} />}
/>;
```

### Critical Frontend Rules

- RTK Query for ALL API calls (automatic caching, invalidation)
- react-hook-form with controlled components ONLY
- **NEVER use `watch()` method** - use controlled components
- MUI v7 Grid: Use `size` prop, NOT `item` prop
- Dialogs: Include `disableEnforceFocus`, `disableRestoreFocus`, ARIA attributes
- Socket.IO connects on auth, room-based subscriptions
- Token refresh on 401 with automatic retry
- Error boundaries for graceful error handling
- React.memo for Card components
- useCallback for event handlers
- useMemo for computed values

## API Conventions

### RESTful Endpoints

```
GET    /api/{resource}              # List (paginated)
GET    /api/{resource}/:id          # Get single
POST   /api/{resource}              # Create
PUT    /api/{resource}/:id          # Update
DELETE /api/{resource}/:id          # Soft delete
PATCH  /api/{resource}/:id/restore  # Restore
```

### Query Parameters

- `page` - Page number (1-based on backend, 0-based on frontend DataGrid - auto-converted)
- `limit` - Items per page (default: 10, max: 100)
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - asc/desc (default: desc)
- `search` - Search query
- `deleted` - Include soft-deleted (true/false)

### Response Format

```json
{
  "success": true,
  "data": {...},
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "message": "Error message",
  "errorCode": "ERROR_CODE",
  "context": {}
}
```

## Testing

### Backend Testing

**Framework**: Jest with ES modules

**Test Types**:

- `tests/unit/` - Unit tests
- `tests/property/` - Property-based tests (fast-check)

**Database**: Use real MongoDB instance (NOT mongodb-memory-server)

**Run with**: `--runInBand` to prevent race conditions

**Tools**: supertest for API testing

**Commands**:

```bash
npm test              # All tests
npm run test:unit     # Unit only
npm run test:property # Property-based only
```

**Coverage Goals**:

- Statements: 80%+
- Branches: 75%+
- Functions: 80%+
- Lines: 80%+

### Frontend Testing (Optional)

- Vitest + React Testing Library
- E2E: Playwright or Cypress

## Critical Rules (MUST FOLLOW)

1. **Field Names**: Backend validators (`middlewares/validators/*`) are the ONLY source of truth
2. **Constants**: Import from `utils/constants.js` - NEVER hardcode values
3. **React Hook Form**: NEVER use `watch()` - use controlled components only
4. **MUI v7 Grid**: Use `size` prop, NOT `item` prop
5. **Pagination**: Backend 1-based, frontend DataGrid 0-based (auto-converted)
6. **Transactions**: Use sessions for cascade operations
7. **Soft Delete**: Never hard delete - use soft delete with cascade
8. **Multi-Tenancy**: Always filter by organization to prevent cross-tenant access
9. **Authorization**: Check permissions via middleware before controller
10. **Layer Separation**: Never skip layers - maintain Routes → Controllers → Services → Models
11. **Socket.IO**: Singleton pattern, room-based broadcasting
12. **Error Handling**: Use CustomError class with typed methods
13. **Logging**: Use winston logger (not console.log)
14. **Performance**: React.memo, useCallback, useMemo for optimization
15. **Security**: JWT in HTTP-only cookies, bcrypt ≥12 salt rounds

## Implementation Order

### Phase 1: Backend Foundation

1. **Core Foundation** (FIRST):

   - Configuration files (db, cors, authorization matrix)
   - Error handling infrastructure
   - Utility functions (constants FIRST, then logger, helpers, tokens)
   - Middleware (auth, authorization, rate limiter)
   - Services (email, notification)
   - Email templates
   - Socket.IO infrastructure
   - Soft delete plugin (CRITICAL)
   - App and server setup

2. **Models** (SECOND):

   - Create all 13 models in dependency order
   - Organization → Department → User → Vendor → Material → BaseTask → ProjectTask/RoutineTask/AssignedTask → TaskActivity → TaskComment → Attachment → Notification

3. **Routes → Validators → Controllers** (THIRD):

   - For EACH resource, implement in order: Routes → Validators → Controllers
   - Auth → Organization → Department → User → Vendor → Material → Task → TaskActivity → TaskComment → Attachment → Notification

4. **Route Aggregation** (FOURTH):
   - Aggregate all routes in routes/index.js
   - Test all endpoints

### Phase 2: Frontend Foundation

1. **Core Foundation** (FIRST):

   - Project setup
   - Constants (MUST mirror backend exactly)
   - Utility functions (errorHandler, dateUtils)
   - Services (socket, cloudinary)
   - Hooks (useSocket, useAuth)
   - Theme infrastructure

2. **Redux Store** (SECOND):

   - Base API configuration
   - Auth slice
   - Store configuration with persistence

3. **Redux API Endpoints** (THIRD):

   - Create all 11 API endpoints in dependency order
   - Auth → Organization → Department → User → Vendor → Material → Task → TaskActivity → TaskComment → Attachment → Notification

4. **Common Components** (FOURTH):

   - Form components
   - DataGrid components
   - Filter components
   - Dialog components
   - Loading components
   - Utility components

5. **Resource-Specific Components** (FIFTH):

   - For each resource: Columns → Cards → Lists → Filters → Forms

6. **Layouts** (SIXTH):

   - RootLayout, PublicLayout, DashboardLayout
   - ProtectedRoute, PublicRoute

7. **Pages** (SEVENTH):

   - Public pages: Home, Login, Register, ForgotPassword, ResetPassword
   - Protected pages: Dashboard, Organizations, Departments, Users, Materials, Vendors, Tasks, TaskDetail, NotFound

8. **Routing** (EIGHTH):

   - Route configuration with lazy loading

9. **App Entry Point** (NINTH):
   - App.jsx with theme, Redux, router, Socket.IO, toast, error boundary
   - main.jsx with React DOM render

## Architecture Principles

### Separation of Concerns

- **Routes**: Define endpoints, apply middleware
- **Controllers**: Handle HTTP requests/responses
- **Services**: Contain business logic
- **Models**: Define data structure and validation

### Single Responsibility

Each file/function has one clear purpose

### DRY (Don't Repeat Yourself)

- Constants in `utils/constants.js`
- Reusable components in `components/common/`
- Shared utilities in `utils/`

### Dependency Injection

Pass dependencies as parameters, not global imports

### Error Handling

- Consistent error responses
- CustomError class with typed methods
- Global error handler middleware

### Security First

- Authentication before authorization
- Input validation before business logic
- SQL/NoSQL injection prevention
- XSS protection
- CSRF protection

### Performance Optimization

- Database indexing
- Query optimization
- Caching with RTK Query
- React.memo, useCallback, useMemo
- Lazy loading
- Code splitting

### Scalability

- Modular architecture
- Horizontal scaling support
- Stateless authentication (JWT)
- Database connection pooling
- Load balancing ready
