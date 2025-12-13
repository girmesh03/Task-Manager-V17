# Task Manager V17

A comprehensive multi-tenant SaaS task management system built with the MERN stack, featuring role-based access control, real-time updates, and advanced task tracking capabilities for hospitality and enterprise environments.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Documentation](#documentation)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Deployment](#deployment)
- [License](#license)

## 🎯 Overview

Task Manager V17 is a full-stack task management application designed for multi-tenant organizations with hierarchical structures. It supports complex workflows including project tasks with cost tracking, routine tasks, and assigned tasks with real-time collaboration features.

> **📚 Complete Documentation Available**: This project includes comprehensive steering documentation covering all 214+ files (85+ backend + 129+ frontend). See the [Documentation](#documentation) section below.

### Key Highlights

- **Multi-tenant Architecture**: Platform organization managing multiple tenant organizations
- **Role-Based Access Control**: Four role levels (SuperAdmin, Admin, Manager, User) with granular permissions
- **Real-time Communication**: Socket.IO integration for live updates and notifications
- **Task Types**: ProjectTask (with costs/materials), RoutineTask (recurring), AssignedTask (user-specific)
- **Material & Vendor Management**: Inventory tracking with vendor associations
- **Soft Delete**: All resources support soft delete and restore functionality
- **Email Notifications**: Queue-based email system with customizable templates

## ✨ Features

### Task Management

- Three task types: ProjectTask, RoutineTask, AssignedTask
- Task lifecycle management (To Do → In Progress → Completed/Pending)
- Priority levels: Low, Medium, High, Urgent
- Task activities and threaded comments (max depth 3)
- File attachments (images, videos, documents, audio)
- Material tracking with quantities
- Multiple assignees and watchers (max 20 each)
- Tags and mentions support
- Cost tracking with history (ProjectTask only)

### User Management

- User profiles with skills tracking
- Online/Offline/Away status
- Department and organization assignment
- Profile pictures via Cloudinary
- Role-based permissions

### Organization & Department Management

- Multi-tenant organization isolation
- 24 predefined industry classifications
- Department structure within organizations
- Contact information management
- Soft delete with restore capability

### Real-time Features

- Socket.IO integration for live updates
- Room-based broadcasting (user, department, organization)
- Real-time notifications with read/unread status
- User status tracking
- Event types: Created, Updated, Deleted, Restored

### Material & Vendor Management

- Material inventory with 9 categories
- 30+ unit types (pcs, kg, l, m, m², m³, etc.)
- Cost and price tracking
- Vendor management with contact information
- Material-vendor associations

## 🛠 Technology Stack

### Backend

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js ^4.21.2
- **Database**: MongoDB with Mongoose ^8.19.1
- **Authentication**: JWT (jsonwebtoken ^9.0.2) + bcrypt ^6.0.0
- **Real-time**: Socket.IO ^4.8.1
- **Email**: Nodemailer ^7.0.9
- **Validation**: express-validator ^7.2.1
- **Security**: helmet ^8.1.0, cors ^2.8.5, express-mongo-sanitize ^2.2.0
- **Utilities**: dayjs ^1.11.18, compression ^1.8.1

### Frontend

- **Framework**: React ^19.1.1
- **Build Tool**: Vite ^7.1.7
- **UI Library**: Material-UI (MUI) v7.3.4
- **State Management**: Redux Toolkit ^2.9.0 with redux-persist ^6.0.0
- **Routing**: React Router ^7.9.4
- **Forms**: react-hook-form ^7.65.0
- **HTTP Client**: axios ^1.12.2
- **Real-time**: socket.io-client ^4.8.1
- **Notifications**: react-toastify ^11.0.5
- **Date Handling**: dayjs ^1.11.18

## 🏗 Architecture

### Monorepo Structure

```
Task-Manager-V17/
├── backend/          # Node.js/Express API server
├── client/           # React/Vite frontend application
└── steering/         # Project documentation and guidelines
```

### Backend Architecture

**Layer Flow**: Routes → Controllers → Services → Models

- **Routes**: Define API endpoints and apply middleware
- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic and external integrations
- **Models**: MongoDB schemas with Mongoose

### Frontend Architecture

**Layer Flow**: Pages → Components → Services (API/Socket.IO)

- **Pages**: Route-level components with data fetching
- **Components**: Reusable UI components
- **Services**: API calls (RTK Query) and Socket.IO
- **Redux Store**: Centralized state management

### Data Flow

1. Client sends HTTP request or Socket.IO event
2. Backend validates request (validators + middleware)
3. Controller processes request
4. Service layer handles business logic
5. Model layer interacts with MongoDB
6. Response sent back to client
7. Socket.IO broadcasts real-time updates to relevant rooms

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd Task-Manager-V17
```

2. **Install backend dependencies**

```bash
cd backend
npm install
```

3. **Install frontend dependencies**

```bash
cd ../client
npm install
```

4. **Configure environment variables**

Create `backend/.env`:

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

Create `client/.env`:

```env
VITE_API_URL=http://localhost:4000/api
VITE_PLATFORM_ORG=000000000000000000000000
```

5. **Start MongoDB**

```bash
mongod
```

6. **Start the backend server**

```bash
cd backend
npm run dev
# Server runs on http://localhost:4000
```

7. **Start the frontend development server**

```bash
cd client
npm run dev
# Application runs on http://localhost:3000
```

8. **Access the application**

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
- Socket.IO: ws://localhost:4000

## 📁 Project Structure

### Backend Structure

```
backend/
├── config/                      # Configuration files
│   ├── allowedOrigins.js        # CORS allowed origins
│   ├── authorizationMatrix.json # Role-based permissions
│   ├── corsOptions.js           # CORS configuration
│   └── db.js                    # MongoDB connection
├── controllers/                 # Request handlers
│   ├── attachmentControllers.js
│   ├── authControllers.js
│   ├── departmentControllers.js
│   ├── materialControllers.js
│   ├── notificationControllers.js
│   ├── organizationControllers.js
│   ├── taskControllers.js
│   ├── userControllers.js
│   └── vendorControllers.js
├── errorHandler/                # Error handling
│   ├── CustomError.js           # Custom error class
│   └── ErrorController.js       # Global error handler
├── middlewares/                 # Express middlewares
│   ├── validators/              # Request validation
│   │   ├── attachmentValidators.js
│   │   ├── authValidators.js
│   │   ├── departmentValidators.js
│   │   ├── materialValidators.js
│   │   ├── notificationValidators.js
│   │   ├── organizationValidators.js
│   │   ├── taskValidators.js
│   │   ├── userValidators.js
│   │   ├── validation.js
│   │   └── vendorValidators.js
│   ├── authMiddleware.js        # JWT verification
│   ├── authorization.js         # Role-based authorization
│   └── rateLimiter.js           # Rate limiting
├── mock/                        # Seed data
│   ├── cleanSeedSetup.js        # Seed initialization
│   └── data.js                  # Mock data
├── models/                      # Mongoose models
│   ├── plugins/
│   │   └── softDelete.js        # Soft delete plugin
│   ├── AssignedTask.js
│   ├── Attachment.js
│   ├── BaseTask.js              # Discriminator base
│   ├── Department.js
│   ├── Material.js
│   ├── Notification.js
│   ├── Organization.js
│   ├── ProjectTask.js
│   ├── RoutineTask.js
│   ├── TaskActivity.js
│   ├── TaskComment.js
│   ├── User.js
│   ├── Vendor.js
│   └── index.js
├── routes/                      # API routes
│   ├── attachmentRoutes.js
│   ├── authRoutes.js
│   ├── departmentRoutes.js
│   ├── materialRoutes.js
│   ├── notificationRoutes.js
│   ├── organizationRoutes.js
│   ├── taskRoutes.js
│   ├── userRoutes.js
│   ├── vendorRoutes.js
│   └── index.js
├── services/                    # Business logic
│   ├── emailService.js          # Email sending
│   └── notificationService.js   # Notification creation
├── templates/                   # Email templates
│   └── emailTemplates.js
├── utils/                       # Utility functions
│   ├── authorizationMatrix.js
│   ├── constants.js
│   ├── generateTokens.js
│   ├── helpers.js
│   ├── materialTransform.js
│   ├── responseTransform.js
│   ├── socket.js                # Socket.IO handlers
│   ├── socketEmitter.js         # Socket.IO emitters
│   ├── socketInstance.js        # Socket.IO singleton
│   └── userStatus.js
├── .env                         # Environment variables
├── app.js                       # Express app setup
├── package.json
└── server.js                    # Server entry point
```

### Frontend Structure

```
client/
├── public/                      # Static assets
├── src/
│   ├── assets/                  # Images and icons
│   │   └── notFound_404.svg
│   ├── components/
│   │   ├── auth/                # Authentication components
│   │   │   ├── AuthProvider.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── PublicRoute.jsx
│   │   │   └── index.js
│   │   ├── cards/               # Card components
│   │   │   ├── AttachmentCard.jsx
│   │   │   ├── DepartmentCard.jsx
│   │   │   ├── MaterialCard.jsx
│   │   │   ├── NotificationCard.jsx
│   │   │   ├── OrganizationCard.jsx
│   │   │   ├── TaskCard.jsx
│   │   │   ├── UserCard.jsx
│   │   │   ├── UsersCardList.jsx
│   │   │   └── VendorCard.jsx
│   │   ├── columns/             # DataGrid column definitions
│   │   │   ├── AttachmentColumns.jsx
│   │   │   ├── DepartmentColumns.jsx
│   │   │   ├── MaterialColumns.jsx
│   │   │   ├── NotificationColumns.jsx
│   │   │   ├── OrganizationColumns.jsx
│   │   │   ├── TaskColumns.jsx
│   │   │   ├── UserColumns.jsx
│   │   │   └── VendorColumns.jsx
│   │   ├── common/              # Reusable components
│   │   │   ├── CustomDataGridToolbar.jsx
│   │   │   ├── CustomIcons.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── FilterChipGroup.jsx
│   │   │   ├── FilterDateRange.jsx
│   │   │   ├── FilterSelect.jsx
│   │   │   ├── FilterTextField.jsx
│   │   │   ├── GlobalSearch.jsx
│   │   │   ├── MuiActionColumn.jsx
│   │   │   ├── MuiCheckbox.jsx
│   │   │   ├── MuiDataGrid.jsx
│   │   │   ├── MuiDatePicker.jsx
│   │   │   ├── MuiDateRangePicker.jsx
│   │   │   ├── MuiDialog.jsx
│   │   │   ├── MuiDialogConfirm.jsx
│   │   │   ├── MuiFileUpload.jsx
│   │   │   ├── MuiLoading.jsx
│   │   │   ├── MuiMultiSelect.jsx
│   │   │   ├── MuiNumberField.jsx
│   │   │   ├── MuiRadioGroup.jsx
│   │   │   ├── MuiResourceSelect.jsx
│   │   │   ├── MuiSelectAutocomplete.jsx
│   │   │   ├── MuiTextArea.jsx
│   │   │   ├── MuiTextField.jsx
│   │   │   ├── MuiThemeDropDown.jsx
│   │   │   ├── NotificationMenu.jsx
│   │   │   ├── RouteError.jsx
│   │   │   └── index.js
│   │   ├── filters/             # Filter components
│   │   │   ├── MaterialFilter.jsx
│   │   │   ├── TaskFilter.jsx
│   │   │   ├── UserFilter.jsx
│   │   │   └── VendorFilter.jsx
│   │   ├── forms/               # Form components
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
│   │   └── lists/               # List components
│   │       ├── TasksList.jsx
│   │       └── UsersList.jsx
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.js
│   │   └── useSocket.js
│   ├── layouts/                 # Layout components
│   │   ├── DashboardLayout.jsx
│   │   ├── PublicLayout.jsx
│   │   └── RootLayout.jsx
│   ├── pages/                   # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Departments.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── Home.jsx
│   │   ├── Materials.jsx
│   │   ├── NotFound.jsx
│   │   ├── Organization.jsx
│   │   ├── Organizations.jsx
│   │   ├── Tasks.jsx
│   │   ├── Users.jsx
│   │   └── Vendors.jsx
│   ├── redux/                   # State management
│   │   ├── app/
│   │   │   └── store.js
│   │   └── features/
│   │       ├── api.js
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
│   ├── router/                  # Route configuration
│   │   └── routes.jsx
│   ├── services/                # API services
│   │   ├── socketEvents.js
│   │   └── socketService.js
│   ├── theme/                   # MUI theme
│   │   ├── customizations/
│   │   │   ├── charts.js
│   │   │   ├── dataDisplay.js
│   │   │   ├── dataGrid.js
│   │   │   ├── datePickers.js
│   │   │   ├── feedback.js
│   │   │   ├── index.js
│   │   │   ├── inputs.js
│   │   │   ├── navigation.js
│   │   │   └── surfaces.js
│   │   ├── AppTheme.jsx
│   │   └── themePrimitives.js
│   ├── utils/                   # Utility functions
│   │   ├── constants.js
│   │   └── errorHandler.js
│   ├── App.jsx                  # Root component
│   └── main.jsx                 # Entry point
├── .env                         # Environment variables
├── eslint.config.js             # ESLint configuration
├── index.html                   # HTML template
├── package.json
└── vite.config.js               # Vite configuration
```

## ⚙️ Configuration

### Backend Environment Variables

| Variable               | Description                          | Required | Default               |
| ---------------------- | ------------------------------------ | -------- | --------------------- |
| `MONGODB_URI`          | MongoDB connection string            | Yes      | -                     |
| `JWT_ACCESS_SECRET`    | Secret for access tokens             | Yes      | -                     |
| `JWT_REFRESH_SECRET`   | Secret for refresh tokens            | Yes      | -                     |
| `PORT`                 | Server port                          | No       | 4000                  |
| `CLIENT_URL`           | Frontend URL for CORS                | No       | http://localhost:3000 |
| `NODE_ENV`             | Environment (development/production) | No       | development           |
| `INITIALIZE_SEED_DATA` | Run seed data on startup             | No       | false                 |
| `EMAIL_USER`           | Gmail email address                  | No       | -                     |
| `EMAIL_PASSWORD`       | Gmail app password                   | No       | -                     |
| `EMAIL_FROM`           | From email address                   | No       | -                     |

### Frontend Environment Variables

| Variable            | Description              | Required |
| ------------------- | ------------------------ | -------- |
| `VITE_API_URL`      | Backend API URL          | Yes      |
| `VITE_PLATFORM_ORG` | Platform organization ID | Yes      |

### Security Configuration

**Middleware Order (Critical)**:

1. helmet - Security headers
2. cors - Cross-origin resource sharing
3. cookieParser - Parse cookies
4. express.json - Parse JSON bodies
5. mongoSanitize - NoSQL injection prevention
6. compression - Response compression
7. rateLimiter - Rate limiting (production only)

**Rate Limiting (Production)**:

- General API: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes

## 📚 API Documentation

### Authentication Endpoints

```
POST   /api/auth/login           # User login
POST   /api/auth/register        # User registration
POST   /api/auth/logout          # User logout
POST   /api/auth/refresh-token   # Refresh access token
POST   /api/auth/forgot-password # Request password reset
POST   /api/auth/reset-password  # Reset password
```

### Resource Endpoints

All resource endpoints follow RESTful conventions:

```
GET    /api/{resource}           # List resources (paginated)
GET    /api/{resource}/:id       # Get single resource
POST   /api/{resource}           # Create resource
PUT    /api/{resource}/:id       # Update resource
DELETE /api/{resource}/:id       # Soft delete resource
PATCH  /api/{resource}/:id/restore # Restore soft-deleted resource
```

**Resources**: organizations, departments, users, tasks, materials, vendors, notifications, attachments

### Pagination

**Backend (1-based)**:

```json
{
  "materials": [...],
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

**Frontend (0-based)**: MuiDataGrid component automatically converts between 0-based and 1-based pagination.

### Query Parameters

- `page` - Page number (1-based)
- `limit` - Items per page (default: 10, max: 100)
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - Sort direction (asc/desc, default: desc)
- `search` - Search query
- `deleted` - Include soft-deleted items (true/false)

## 👨‍💻 Development

### Backend Development

```bash
cd backend
npm run dev          # Start with nodemon (auto-restart)
npm run server       # Alias for dev
npm start            # Production mode
npm run start:prod   # Production with NODE_ENV=production
```

### Frontend Development

```bash
cd client
npm run dev          # Start Vite dev server with HMR
npm run build        # Build for production
npm run build:prod   # Build with NODE_ENV=production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Seed Data

Enable seed data initialization in `backend/.env`:

```env
INITIALIZE_SEED_DATA=true
```

Seed data includes:

- Platform organization
- Sample organizations
- Departments
- Users (all roles)
- Tasks (all types)
- Materials
- Vendors
- Notifications

### Code Patterns

**Backend Pattern**: Routes → Controllers → Services → Models

**Frontend Patterns**:

- **Admin Views (DataGrid)**: Page → Columns → Filter → Form
- **User Views (Three-Layer)**: Page → List → Card

### Critical Rules

1. **Field Names**: Backend validators (`backend/middlewares/validators/*`) are the ONLY source of truth
2. **Constants**: NEVER hardcode values, always import from `utils/constants.js`
3. **React Hook Form**: NEVER use `watch()` method, always use controlled components
4. **MUI v7 Grid**: Use `size` prop, not `item` prop
5. **Dialogs**: Always include `disableEnforceFocus`, `disableRestoreFocus`, and ARIA attributes

## 🚢 Deployment

### Production Build

1. **Build frontend**:

```bash
cd client
npm run build:prod
# Output: client/dist/
```

2. **Backend serves frontend**:
   The backend automatically serves frontend static files in production mode from `../client/dist/`.

3. **Start production server**:

```bash
cd backend
npm run start:prod
# Serves both API and frontend on port 4000
```

### Environment Setup

**Production Environment Variables**:

- Set `NODE_ENV=production`
- Use strong JWT secrets
- Configure production MongoDB URI
- Set up email service credentials
- Configure allowed CORS origins

### Security Checklist

- [ ] Strong JWT secrets configured
- [ ] MongoDB connection secured
- [ ] Rate limiting enabled
- [ ] CORS origins restricted
- [ ] Helmet security headers active
- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Email credentials protected

## 📝 License

This project is licensed under the ISC License.

---

**Version**: 1.0.0
**Last Updated**: 2024

For more detailed documentation, see the `steering/` directory:

- `steering/tech.md` - Technology stack and configuration
- `steering/structure.md` - Architecture and code patterns
- `steering/product.md` - Product domain and business rules
- `steering/components.md` - Component guidelines
