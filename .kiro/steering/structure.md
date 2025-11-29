---
inclusion: always
---

# Architecture & Code Patterns

Monorepo structure: `backend/` (Node.js/Express) + `client/` (React/Vite)

## Critical Project Requirements, Design and Tasks:

**To validate, correct, and complete the codebase for production readiness, you must effectively utilize the following resources while respecting the existing codebase:**

*   **All 735 requirements and every other specification** in `backend/docs/codebase-requirements.md` and all documents within `backend/docs/*`.
*   `/.kiro/specs/production-readiness-validation/requirements.md`
*   `/.kiro/specs/production-readiness-validation/design.md`
*   `/.kiro/specs/production-readiness-validation/components.md`
*   `/.kiro/specs/production-readiness-validation/tech.md`

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
- ProjectTask → Materials (many-to-many with quantity)
- ProjectTask → Assignees/Watchers (many-to-many)
- TaskActivity → parent (ProjectTask or AssignedTask)
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

**BaseTask**: title, description, status, priority, dueDate, tags, createdBy, updatedBy, departmentId, organizationId, taskType (discriminator), isDeleted, timestamps

**ProjectTask** (extends BaseTask): estimatedCost, actualCost, currency, costHistory, materials, assignees, watchers

**RoutineTask** (extends BaseTask): (no additional fields, restricted status/priority)

**AssignedTask** (extends BaseTask): assignedTo

**TaskActivity**: content, parentId, parentModel, createdBy, updatedBy, departmentId, organizationId, isDeleted, timestamps

**TaskComment**: content, parentId, parentModel, mentions, createdBy, updatedBy, departmentId, organizationId, isDeleted, timestamps

**Material**: name, description, category, quantity, unitType, cost, price, currency, vendorId, departmentId, organizationId, isDeleted, timestamps

**Vendor**: name, description, contactPerson, email, phone, address, departmentId, organizationId, isDeleted, timestamps

**Attachment**: filename, fileUrl, fileType, fileSize, parentId, parentModel, uploadedBy, departmentId, organizationId, isDeleted, timestamps

**Notification**: title, message, type, isRead, recipientId, entityId, entityModel, organizationId, expiresAt, timestamps

## Route Configuration

### Public Routes (PublicLayout)

- `/` - Home page
- `/login` - Login form
- `/register` - Registration form
- `/forgot-password` - Forgot password form
- `/reset-password` - Reset password form

### Protected Routes (DashboardLayout)

- `/dashboard` - Dashboard page
- `/tasks` - Tasks page (three-layer pattern)
- `/users` - Users page (three-layer pattern)
- `/materials` - Materials page (DataGrid pattern)
- `/vendors` - Vendors page (DataGrid pattern)
- `/admin/organization` - Organization detail page
- `/admin/departments` - Departments page (DataGrid pattern)
- `/admin/users` - Users admin page (DataGrid pattern)
- `/platform/organizations` - Organizations page (DataGrid pattern, platform SuperAdmin only)

### Error Routes

- `*` - 404 Not Found page

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
  }
}
```

### RTK Query Tags

Used for cache invalidation:

- `Task`, `TaskActivity`, `TaskComment`
- `User`, `Organization`, `Department`
- `Material`, `Vendor`
- `Notification`, `Attachment`

### Redux Persist

Persisted slices:

- `auth` - User authentication state
- `user` - User profile data

Not persisted:

- RTK Query cache (auto-managed)
