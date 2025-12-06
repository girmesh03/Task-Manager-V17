---
inclusion: always
---

# Frontend Patterns & Conventions

Complete documentation of all frontend UI patterns, conventions, and implementation details for the Multi-Tenant SaaS Task Manager.

## Critical Rules

- **Constants Synchronization**: `client/src/utils/constants.js` MUST mirror `backend/utils/constants.js` exactly
- **Field Names**: Frontend MUST match backend validator field names exactly (case-sensitive)
- **React Hook Form**: NEVER use `watch()` method, ALWAYS use controlled components
- **MUI v7 Syntax**: Use `size` prop for Grid, NOT `item` prop
- **Dialogs**: ALL dialogs MUST include accessibility props (disableEnforceFocus, disableRestoreFocus, aria-labelledby, aria-describedby)
- **Performance**: Wrap list/card components with React.memo, use useCallback for event handlers, useMemo for computed values

## UI Patterns

### DataGrid Pattern (Admin Views)

**Use For**: Organizations, Departments, Materials, Vendors, Users (admin view)

**When to Use**:

- Resource management pages requiring CRUD operations
- Pages with complex filtering, sorting, and pagination
- Admin-level views with bulk operations
- Data-heavy interfaces with many columns

**Required Files**:

- `*Page.jsx` - Data fetching, state management, filters
- `*Columns.jsx` - Column definitions for DataGrid
- `*Filter.jsx` - Filter UI components (optional)
- `CreateUpdate*.jsx` - Form modal for create/edit operations

**Required Components**:

- `MuiDataGrid` - Auto-converts pagination (0-based MUI ↔ 1-based backend)
- `MuiActionColumn` - Actions (View/Edit/Delete/Restore), auto-detects soft delete
- `CustomDataGridToolbar` - Optional toolbar with export, filters, columns

**Pattern Structure**:

```jsx
// MaterialsPage.jsx
import { useState } from 'react';
import { useGetMaterialsQuery } from '../redux/features/material/materialApi';
import MuiDataGrid from '../components/common/MuiDataGrid';
import { getMaterialColumns } from '../components/columns/MaterialColumns';
import MaterialFilter from '../components/filters/MaterialFilter';
import CreateUpdateMaterial from '../components/forms/materials/CreateUpdateMaterial';

const MaterialsPage = () => {
  // State management
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({ page: 0, pageSize: 10 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // Data fetching with RTK Query
  const { data, isLoading, isFetching } = useGetMaterialsQuery({
```

    page: pagination.page + 1, // Convert to 1-based for backend
    limit: pagination.pageSize,
    ...filters,

});

// Event handlers
const handleView = (material) => {
// Navigate to detail view or show details dialog
};

const handleEdit = (material) => {
setSelectedMaterial(material);
setDialogOpen(true);
};

const handleDelete = async (material) => {
// Show confirmation dialog, then delete
};

const handleRestore = async (material) => {
// Restore soft-deleted material
};

// Column configuration
const columns = getMaterialColumns({
onView: handleView,
onEdit: handleEdit,
onDelete: handleDelete,
onRestore: handleRestore,
});

return (
<Box>
{/_ Filters _/}
<MaterialFilter filters={filters} onFiltersChange={setFilters} />

      {/* DataGrid */}
      <MuiDataGrid
        rows={data?.materials || []}
        columns={columns}
        loading={isLoading || isFetching}
        rowCount={data?.pagination?.totalCount || 0}
        paginationModel={pagination}
        onPaginationModelChange={setPagination}
        emptyMessage="No materials found"
      />

      {/* Create/Edit Dialog */}
      <CreateUpdateMaterial
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        material={selectedMaterial}
      />
    </Box>

);
};

````

**Column Definition Pattern**:

```jsx
// MaterialColumns.jsx
import MuiActionColumn from '../common/MuiActionColumn';

export const getMaterialColumns = (actions) => {
  const { onView, onEdit, onDelete, onRestore } = actions;

  return [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 150,
    },
    {
      field: 'quantity',
      headerName: 'Quantity',
      width: 100,
      type: 'number',
    },
    {
      field: 'unitType',
      headerName: 'Unit',
      width: 100,
    },
    {
      field: 'cost',
      headerName: 'Cost',
      width: 120,
      type: 'number',
      valueFormatter: (value) => `$${value.toFixed(2)}`,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <MuiActionColumn
          row={params.row}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onRestore={onRestore}
        />
      ),
    },
  ];
};
````

**Critical DataGrid Rules**:

1. ✅ ALWAYS use server-side pagination (`paginationMode: "server"`)
2. ✅ ALWAYS convert pagination: `page + 1` when sending to backend
3. ✅ ALWAYS pass `loading={isLoading || isFetching}` to show loading state
4. ✅ ALWAYS provide meaningful `emptyMessage`
5. ✅ ALWAYS use `MuiActionColumn` for action buttons (never custom)
6. ✅ ALWAYS set action column: `sortable: false`, `filterable: false`, `disableColumnMenu: true`

### Three-Layer Pattern (User Views)

**Use For**: Tasks, Users (user view), Dashboard widgets

**When to Use**:

- Card-based layouts for better visual hierarchy
- User-facing views (non-admin)
- Mobile-responsive designs
- Content-heavy displays

**Structure**: Page → List → Card

**Layer Responsibilities**:

- **Page**: Data fetching, state management, event handling, routing
- **List**: Layout, mapping items, delegating events to cards
- **Card**: Display single item, memoized for performance

**Pattern Structure**:

```jsx
// TasksPage.jsx (Layer 1: Page)
import { useState } from "react";
import { useGetTasksQuery } from "../redux/features/task/taskApi";
import TasksList from "../components/lists/TasksList";
import TaskFilter from "../components/filters/TaskFilter";

const TasksPage = () => {
  const [filters, setFilters] = useState({});
  const { data, isLoading } = useGetTasksQuery(filters);

  const handleTaskClick = (task) => {
    // Navigate to task details
    navigate(`/tasks/${task._id}`);
  };

  const handleTaskUpdate = (task) => {
    // Open edit dialog
  };

  return (
    <Box>
      <TaskFilter filters={filters} onFiltersChange={setFilters} />
      {isLoading ? (
        <MuiLoading />
      ) : (
        <TasksList
          tasks={data?.tasks || []}
          onTaskClick={handleTaskClick}
          onTaskUpdate={handleTaskUpdate}
        />
      )}
    </Box>
  );
};

// TasksList.jsx (Layer 2: List)
import { Grid } from "@mui/material";
import TaskCard from "../cards/TaskCard";

const TasksList = ({ tasks, onTaskClick, onTaskUpdate }) => {
  if (tasks.length === 0) {
    return <EmptyState message="No tasks found" />;
  }

  return (
    <Grid container spacing={2}>
      {tasks.map((task) => (
        <Grid key={task._id} size={{ xs: 12, sm: 6, md: 4 }}>
          <TaskCard task={task} onClick={onTaskClick} onUpdate={onTaskUpdate} />
        </Grid>
      ))}
    </Grid>
  );
};

// TaskCard.jsx (Layer 3: Card)
import React, { useCallback, useMemo } from "react";
import { Card, CardContent, Typography, Chip } from "@mui/material";
import dayjs from "dayjs";

const TaskCard = React.memo(({ task, onClick, onUpdate }) => {
  // Memoize event handlers
  const handleClick = useCallback(() => {
    onClick(task);
  }, [task, onClick]);

  const handleUpdate = useCallback(
    (e) => {
      e.stopPropagation(); // Prevent card click
      onUpdate(task);
    },
    [task, onUpdate]
  );

  // Memoize computed values
  const formattedDate = useMemo(() => {
    return dayjs(task.createdAt).format("MMM DD, YYYY");
  }, [task.createdAt]);

  const statusColor = useMemo(() => {
    const colors = {
      "To Do": "default",
      "In Progress": "primary",
      Completed: "success",
      Pending: "warning",
    };
    return colors[task.status] || "default";
  }, [task.status]);

  return (
    <Card onClick={handleClick} sx={{ cursor: "pointer", height: "100%" }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {task.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {task.description}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
          <Chip label={task.status} color={statusColor} size="small" />
          <Chip label={task.priority} size="small" />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          {formattedDate}
        </Typography>
      </CardContent>
    </Card>
  );
});

TaskCard.displayName = "TaskCard";

export default TaskCard;
```

**Critical Three-Layer Rules**:

1. ✅ ALWAYS wrap Card components with `React.memo`
2. ✅ ALWAYS use `useCallback` for event handlers passed to children
3. ✅ ALWAYS use `useMemo` for computed values (dates, colors, etc.)
4. ✅ ALWAYS set `displayName` for memoized components (debugging)
5. ✅ ALWAYS handle empty states in List component
6. ✅ ALWAYS use MUI Grid with `size` prop (NOT `item` prop)

### Form Pattern (Create/Update)

**Use For**: All resource creation and editing

**When to Use**:

- Creating new resources
- Editing existing resources
- Multi-step forms (registration)
- Complex validation requirements

**Required Libraries**:

- `react-hook-form` - Form state management
- `@mui/material` - UI components
- Controller from react-hook-form for MUI integration

**Pattern Structure**:

```jsx
// CreateUpdateMaterial.jsx
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
} from "../../redux/features/material/materialApi";
import MuiDialog from "../common/MuiDialog";
import MuiTextField from "../common/MuiTextField";
import MuiSelectAutocomplete from "../common/MuiSelectAutocomplete";
import { MATERIAL_CATEGORIES, UNIT_TYPES } from "../../utils/constants";
import { toast } from "react-toastify";

const CreateUpdateMaterial = ({ open, onClose, material }) => {
  const isEditMode = Boolean(material);

  // RTK Query mutations
  const [createMaterial, { isLoading: isCreating }] =
    useCreateMaterialMutation();
  const [updateMaterial, { isLoading: isUpdating }] =
    useUpdateMaterialMutation();

  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      category: "",
      quantity: 0,
      unitType: "",
      cost: 0,
      price: 0,
      vendorId: "",
    },
  });

  // Reset form when material changes
  useEffect(() => {
    if (material) {
      reset({
        name: material.name || "",
        description: material.description || "",
        category: material.category || "",
        quantity: material.quantity || 0,
        unitType: material.unitType || "",
        cost: material.cost || 0,
        price: material.price || 0,
        vendorId: material.vendorId || "",
      });
    } else {
      reset();
    }
  }, [material, reset]);

  // Submit handler
  const onSubmit = async (data) => {
    try {
      if (isEditMode) {
        await updateMaterial({ id: material._id, ...data }).unwrap();
        toast.success("Material updated successfully");
      } else {
        await createMaterial(data).unwrap();
        toast.success("Material created successfully");
      }
      onClose();
    } catch (error) {
      toast.error(error.data?.message || "Operation failed");
    }
  };

  return (
    <MuiDialog
      open={open}
      onClose={onClose}
      title={isEditMode ? "Edit Material" : "Create Material"}
      onSubmit={handleSubmit(onSubmit)}
      submitText={isEditMode ? "Update" : "Create"}
      loading={isCreating || isUpdating}
    >
      <Controller
        name="name"
        control={control}
        rules={{
          required: "Name is required",
          maxLength: { value: 100, message: "Max 100 characters" },
        }}
        render={({ field }) => (
          <MuiTextField
            {...field}
            label="Name"
            required
            error={!!errors.name}
            helperText={errors.name?.message}
          />
        )}
      />

      <Controller
        name="description"
        control={control}
        rules={{ maxLength: { value: 2000, message: "Max 2000 characters" } }}
        render={({ field }) => (
          <MuiTextArea
            {...field}
            label="Description"
            rows={4}
            error={!!errors.description}
            helperText={errors.description?.message}
          />
        )}
      />

      <Controller
        name="category"
        control={control}
        rules={{ required: "Category is required" }}
        render={({ field }) => (
          <MuiSelectAutocomplete
            {...field}
            label="Category"
            options={MATERIAL_CATEGORIES}
            required
            error={!!errors.category}
            helperText={errors.category?.message}
          />
        )}
      />

      <Controller
        name="quantity"
        control={control}
        rules={{
          required: "Quantity is required",
          min: { value: 0, message: "Must be positive" },
        }}
        render={({ field }) => (
          <MuiNumberField
            {...field}
            label="Quantity"
            required
            error={!!errors.quantity}
            helperText={errors.quantity?.message}
          />
        )}
      />

      <Controller
        name="unitType"
        control={control}
        rules={{ required: "Unit type is required" }}
        render={({ field }) => (
          <MuiSelectAutocomplete
            {...field}
            label="Unit Type"
            options={UNIT_TYPES}
            required
            error={!!errors.unitType}
            helperText={errors.unitType?.message}
          />
        )}
      />
    </MuiDialog>
  );
};

export default CreateUpdateMaterial;
```

**Critical Form Rules**:

1. ❌ NEVER use `watch()` method from react-hook-form
2. ✅ ALWAYS use `Controller` for MUI components
3. ✅ ALWAYS use `control` prop from useForm
4. ✅ ALWAYS reset form when material/resource changes
5. ✅ ALWAYS handle both create and edit modes in same component
6. ✅ ALWAYS show loading state during submission
7. ✅ ALWAYS show toast notifications for success/error
8. ✅ ALWAYS validate on submit (not on change for better UX)
9. ✅ ALWAYS match backend validator field names exactly
10. ✅ ALWAYS import constants from utils/constants.js

## Validation Patterns

### Client-Side Validation

**Purpose**: Provide immediate feedback to users before submitting to backend

**Rules**:

1. ✅ ALWAYS match backend validation rules exactly
2. ✅ ALWAYS check backend validators for field requirements
3. ✅ ALWAYS use same error messages as backend when possible
4. ✅ ALWAYS validate on submit (not on change for better UX)

**Common Validation Rules**:

```jsx
// Text fields
{
  required: 'Field is required',
  minLength: { value: 3, message: 'Minimum 3 characters' },
  maxLength: { value: 100, message: 'Maximum 100 characters' },
  pattern: { value: /^[a-zA-Z0-9]+$/, message: 'Alphanumeric only' }
}

// Email
{
  required: 'Email is required',
  pattern: {
    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: 'Invalid email address'
  }
}

// Number fields
{
  required: 'Field is required',
  min: { value: 0, message: 'Must be positive' },
  max: { value: 100, message: 'Maximum 100' },
  validate: (value) => value > 0 || 'Must be greater than 0'
}

// Custom validation
{
  validate: {
    positive: (value) => value > 0 || 'Must be positive',
    lessThan100: (value) => value < 100 || 'Must be less than 100',
    unique: async (value) => {
      const exists = await checkUnique(value);
      return !exists || 'Already exists';
    }
  }
}
```

### Backend Validation Matching

**Critical**: Frontend validation MUST match backend validators exactly

**Process**:

1. Open backend validator file: `backend/middlewares/validators/*Validators.js`
2. Identify all validation rules for each field
3. Implement identical rules in frontend form
4. Use same error messages when possible

**Example**:

```javascript
// Backend: backend/middlewares/validators/materialValidators.js
body('name')
  .trim()
  .notEmpty().withMessage('Name is required')
  .isLength({ max: 100 }).withMessage('Name must not exceed 100 characters'),

body('quantity')
  .notEmpty().withMessage('Quantity is required')
  .isFloat({ min: 0 }).withMessage('Quantity must be positive'),

// Frontend: client/src/components/forms/materials/CreateUpdateMaterial.jsx
<Controller
  name="name"
  control={control}
  rules={{
    required: 'Name is required',
    maxLength: { value: 100, message: 'Name must not exceed 100 characters' }
  }}
  render={({ field }) => <MuiTextField {...field} />}
/>

<Controller
  name="quantity"
  control={control}
  rules={{
    required: 'Quantity is required',
    min: { value: 0, message: 'Quantity must be positive' }
  }}
  render={({ field }) => <MuiNumberField {...field} />}
/>
```

## Error Handling Patterns

### Error Boundary Pattern

**Purpose**: Catch React component errors and display fallback UI

**Usage**:

```jsx
// App.jsx
import ErrorBoundary from "./components/common/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes />
      </Router>
    </ErrorBoundary>
  );
}

// ErrorBoundary.jsx
import React from "react";
import { Box, Typography, Button } from "@mui/material";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h4" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {this.state.error?.message}
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Reload Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### RTK Query Error Handling

**Purpose**: Handle API errors consistently across the application

**Pattern**:

```jsx
// Automatic error handling in mutations
const [createMaterial, { isLoading, error }] = useCreateMaterialMutation();

const handleSubmit = async (data) => {
  try {
    await createMaterial(data).unwrap();
    toast.success("Material created successfully");
  } catch (error) {
    // Error structure from backend
    const message = error.data?.message || "Operation failed";
    const errorCode = error.data?.errorCode;
    toast.error(message);
    console.error("Error:", errorCode, error);
  }
};

// Display error in UI
{
  error && (
    <Alert severity="error" sx={{ mb: 2 }}>
      {error.data?.message || "An error occurred"}
    </Alert>
  );
}
```

### Toast Notification Pattern

**Purpose**: Provide user feedback for actions

**Usage**:

```jsx
import { toast } from "react-toastify";

// Success
toast.success("Material created successfully");

// Error
toast.error("Failed to create material");

// Warning
toast.warning("Material already exists");

// Info
toast.info("Processing your request");

// Custom options
toast.success("Material created", {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
});
```

### Route Error Pattern

**Purpose**: Handle routing errors (404, unauthorized, etc.)

**Usage**:

```jsx
// routes.jsx
import RouteError from "./components/common/RouteError";

const routes = [
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      // ... routes
    ],
  },
];

// RouteError.jsx
import { useRouteError, useNavigate } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";

const RouteError = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 4, textAlign: "center" }}>
      <Typography variant="h4" gutterBottom>
        {error.status === 404 ? "Page Not Found" : "Error"}
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        {error.statusText || error.message}
      </Typography>
      <Button variant="contained" onClick={() => navigate("/")} sx={{ mt: 2 }}>
        Go Home
      </Button>
    </Box>
  );
};

export default RouteError;
```

## Loading State Patterns

### Skeleton Loading

**Purpose**: Show placeholder content while data loads

**Usage**:

```jsx
import { Skeleton, Card, CardContent } from "@mui/material";

const TaskCardSkeleton = () => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width="60%" height={32} />
      <Skeleton variant="text" width="100%" height={20} />
      <Skeleton variant="text" width="100%" height={20} />
      <Skeleton variant="rectangular" width="100%" height={40} sx={{ mt: 2 }} />
    </CardContent>
  </Card>
);

// Usage in list
const TasksList = ({ tasks, isLoading }) => {
  if (isLoading) {
    return (
      <Grid container spacing={2}>
        {[1, 2, 3, 4].map((i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
            <TaskCardSkeleton />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={2}>
      {tasks.map((task) => (
        <Grid key={task._id} size={{ xs: 12, sm: 6, md: 4 }}>
          <TaskCard task={task} />
        </Grid>
      ))}
    </Grid>
  );
};
```

### Spinner Loading

**Purpose**: Show loading spinner for full-page or component loading

**Usage**:

```jsx
// MuiLoading.jsx
import { Box, CircularProgress } from "@mui/material";

const MuiLoading = ({ size = 40, fullScreen = false }) => {
  if (fullScreen) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress size={size} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
      <CircularProgress size={size} />
    </Box>
  );
};

// Usage
{
  isLoading ? <MuiLoading /> : <Content />;
}
```

### Button Loading State

**Purpose**: Show loading state on buttons during async operations

**Usage**:

```jsx
import { Button, CircularProgress } from "@mui/material";

<Button
  variant="contained"
  onClick={handleSubmit}
  disabled={isLoading}
  startIcon={isLoading ? <CircularProgress size={20} /> : null}
>
  {isLoading ? "Saving..." : "Save"}
</Button>;
```

## Empty State Patterns

### Empty List State

**Purpose**: Show helpful message when no data exists

**Usage**:

```jsx
import { Box, Typography, Button } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";

const EmptyState = ({ message, actionText, onAction }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 300,
      p: 4,
    }}
  >
    <Typography variant="h6" color="text.secondary" gutterBottom>
      {message}
    </Typography>
    {actionText && onAction && (
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onAction}
        sx={{ mt: 2 }}
      >
        {actionText}
      </Button>
    )}
  </Box>
);

// Usage
const TasksList = ({ tasks, onCreateTask }) => {
  if (tasks.length === 0) {
    return (
      <EmptyState
        message="No tasks found"
        actionText="Create Task"
        onAction={onCreateTask}
      />
    );
  }

  return (
    <Grid container spacing={2}>
      {tasks.map((task) => (
        <Grid key={task._id} size={{ xs: 12, sm: 6, md: 4 }}>
          <TaskCard task={task} />
        </Grid>
      ))}
    </Grid>
  );
};
```

## Pagination Patterns

### Backend Pagination Conversion

**Critical**: Backend uses 1-based pagination, MUI DataGrid uses 0-based

**Conversion Rules**:

- Frontend → Backend: `page + 1`
- Backend → Frontend: `page - 1`

**Pattern**:

```jsx
const MaterialsPage = () => {
  // MUI DataGrid uses 0-based pagination
  const [pagination, setPagination] = useState({ page: 0, pageSize: 10 });

  // Convert to 1-based for backend
  const { data, isLoading } = useGetMaterialsQuery({
    page: pagination.page + 1, // 0 → 1, 1 → 2, etc.
    limit: pagination.pageSize,
  });

  return (
    <MuiDataGrid
      rows={data?.materials || []}
      rowCount={data?.pagination?.totalCount || 0}
      paginationModel={pagination}
      onPaginationModelChange={setPagination}
      pageSizeOptions={[5, 10, 25, 50, 100]}
    />
  );
};
```

**MuiDataGrid Component**: Automatically handles conversion internally

### Manual Pagination (Three-Layer Pattern)

**Pattern**:

```jsx
const TasksPage = () => {
  const [page, setPage] = useState(1); // 1-based for backend
  const [limit, setLimit] = useState(10);

  const { data, isLoading } = useGetTasksQuery({ page, limit });

  const handlePageChange = (event, newPage) => {
    setPage(newPage); // newPage is already 1-based from Pagination component
  };

  return (
    <Box>
      <TasksList tasks={data?.tasks || []} />
      <Pagination
        count={data?.pagination?.totalPages || 0}
        page={page}
        onChange={handlePageChange}
        color="primary"
        sx={{ mt: 2, display: "flex", justifyContent: "center" }}
      />
    </Box>
  );
};
```

## Filtering Patterns

### Filter State Management

**Pattern**:

```jsx
const MaterialsPage = () => {
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    vendorId: "",
    minQuantity: null,
    maxQuantity: null,
  });

  const { data, isLoading } = useGetMaterialsQuery({
    ...filters,
    page: 1,
    limit: 10,
  });

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      category: "",
      vendorId: "",
      minQuantity: null,
      maxQuantity: null,
    });
  };

  return (
    <Box>
      <MaterialFilter
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />
      <MuiDataGrid rows={data?.materials || []} />
    </Box>
  );
};
```

### Filter Component Pattern

**Pattern**:

```jsx
// MaterialFilter.jsx
import { Box, Grid } from "@mui/material";
import FilterTextField from "../common/FilterTextField";
import FilterSelect from "../common/FilterSelect";
import { MATERIAL_CATEGORIES } from "../../utils/constants";

const MaterialFilter = ({ filters, onFilterChange, onClearFilters }) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FilterTextField
            label="Search"
            value={filters.search}
            onChange={(value) => onFilterChange("search", value)}
            placeholder="Search materials..."
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FilterSelect
            label="Category"
            value={filters.category}
            onChange={(value) => onFilterChange("category", value)}
            options={MATERIAL_CATEGORIES}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FilterTextField
            label="Min Quantity"
            type="number"
            value={filters.minQuantity}
            onChange={(value) => onFilterChange("minQuantity", value)}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Button
            variant="outlined"
            onClick={onClearFilters}
            fullWidth
            sx={{ height: "56px" }}
          >
            Clear Filters
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MaterialFilter;
```

### Active Filters Display

**Pattern**:

```jsx
import FilterChipGroup from "../common/FilterChipGroup";

const MaterialsPage = () => {
  const [filters, setFilters] = useState({});

  const activeFilters = Object.entries(filters)
    .filter(([key, value]) => value !== "" && value !== null)
    .map(([key, value]) => ({
      key,
      label: `${key}: ${value}`,
      value,
    }));

  const handleRemoveFilter = (key) => {
    setFilters((prev) => ({
      ...prev,
      [key]: "",
    }));
  };

  return (
    <Box>
      <FilterChipGroup filters={activeFilters} onRemove={handleRemoveFilter} />
      <MuiDataGrid rows={data?.materials || []} />
    </Box>
  );
};
```

## Sorting Patterns

### DataGrid Sorting

**Pattern**:

```jsx
const MaterialsPage = () => {
  const [sortModel, setSortModel] = useState([
    { field: "createdAt", sort: "desc" },
  ]);

  const { data, isLoading } = useGetMaterialsQuery({
    sortBy: sortModel[0]?.field || "createdAt",
    sortOrder: sortModel[0]?.sort || "desc",
  });

  return (
    <MuiDataGrid
      rows={data?.materials || []}
      sortModel={sortModel}
      onSortModelChange={setSortModel}
      sortingMode="server"
    />
  );
};
```

## Real-time Patterns (Socket.IO)

### Socket.IO Connection Management

**Purpose**: Manage WebSocket connection lifecycle

**Pattern**:

```jsx
// hooks/useSocket.js
import { useEffect } from 'react';
import socketService from '../services/socketService';

const useSocket = () => {
  useEffect(() => {
    // Connect on mount
    socketService.connect();

    // Disconnect on unmount
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

// services/socketService.js
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(import.meta.env.VITE_API_URL.replace('/api', ''), {
      withCredentials: true, // Send HTTP-only cookies
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.connect();

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
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

### Event Handling and Cache Invalidation

**Purpose**: Handle real-time events and invalidate RTK Query cache

**Pattern**:

```jsx
// services/socketEvents.js
import { store } from "../redux/app/store";
import { taskApi } from "../redux/features/task/taskApi";
import { notificationApi } from "../redux/features/notification/notificationApi";
import { toast } from "react-toastify";

export const setupSocketEventHandlers = (socket) => {
  // Task events
  socket.on("task:created", (task) => {
    console.log("Task created:", task);
    store.dispatch(taskApi.util.invalidateTags(["Task"]));
    toast.info(`New task created: ${task.title}`);
  });

  socket.on("task:updated", (task) => {
    console.log("Task updated:", task);
    store.dispatch(
      taskApi.util.invalidateTags([{ type: "Task", id: task._id }])
    );
  });

  socket.on("task:deleted", (task) => {
    console.log("Task deleted:", task);
    store.dispatch(taskApi.util.invalidateTags(["Task"]));
    toast.warning(`Task deleted: ${task.title}`);
  });

  socket.on("task:restored", (task) => {
    console.log("Task restored:", task);
    store.dispatch(taskApi.util.invalidateTags(["Task"]));
    toast.success(`Task restored: ${task.title}`);
  });

  // Notification events
  socket.on("notification:created", (notification) => {
    console.log("Notification received:", notification);
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

// Usage in App.jsx
import { useEffect } from "react";
import socketService from "./services/socketService";
import { setupSocketEventHandlers } from "./services/socketEvents";

function App() {
  useEffect(() => {
    socketService.connect();
    setupSocketEventHandlers(socketService.socket);

    return () => {
      socketService.disconnect();
    };
  }, []);

  return <Router />;
}
```

### Room Management

**Purpose**: Join/leave Socket.IO rooms based on user context

**Pattern**:

```jsx
// Automatic room joining on authentication
useEffect(() => {
  if (user && socketService.socket) {
    // User automatically joins rooms on backend after authentication
    // Rooms: user:${userId}, department:${departmentId}, organization:${organizationId}
    console.log("User authenticated, joined rooms");
  }
}, [user]);

// Manual room joining (if needed)
const joinRoom = (roomName) => {
  socketService.emit("join:room", { room: roomName });
};

const leaveRoom = (roomName) => {
  socketService.emit("leave:room", { room: roomName });
};
```

## File Upload Patterns

### Cloudinary Direct Upload

**Purpose**: Upload files directly to Cloudinary, then save metadata to backend

**Flow**: Client → Cloudinary → Backend

**Pattern**:

```jsx
// services/cloudinaryService.js
const CLOUDINARY_UPLOAD_PRESET = "your_upload_preset";
const CLOUDINARY_CLOUD_NAME = "your_cloud_name";

export const uploadToCloudinary = async (file, folder = "attachments") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", folder);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      publicId: data.public_id,
      format: data.format,
      size: data.bytes,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

// components/common/MuiFileUpload.jsx
import { useState } from "react";
import { Box, Button, Typography, LinearProgress } from "@mui/material";
import { CloudUpload as UploadIcon } from "@mui/icons-material";
import { uploadToCloudinary } from "../../services/cloudinaryService";

const MuiFileUpload = ({ onUpload, accept, maxSize = 10 * 1024 * 1024 }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${maxSize / 1024 / 1024}MB`);
      return;
    }

    // Show preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }

    // Upload to Cloudinary
    setUploading(true);
    try {
      const result = await uploadToCloudinary(file);
      onUpload(result);
      toast.success("File uploaded successfully");
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Box>
      <input
        accept={accept}
        style={{ display: "none" }}
        id="file-upload"
        type="file"
        onChange={handleFileChange}
        disabled={uploading}
      />
      <label htmlFor="file-upload">
        <Button
          variant="outlined"
          component="span"
          startIcon={<UploadIcon />}
          disabled={uploading}
          fullWidth
        >
          {uploading ? "Uploading..." : "Upload File"}
        </Button>
      </label>

      {uploading && (
        <LinearProgress variant="determinate" value={progress} sx={{ mt: 1 }} />
      )}

      {preview && (
        <Box sx={{ mt: 2 }}>
          <img
            src={preview}
            alt="Preview"
            style={{ maxWidth: "100%", maxHeight: 200 }}
          />
        </Box>
      )}
    </Box>
  );
};

export default MuiFileUpload;

// Usage in form
const CreateUpdateTask = () => {
  const [attachments, setAttachments] = useState([]);

  const handleFileUpload = (result) => {
    setAttachments((prev) => [...prev, result]);
  };

  return (
    <MuiDialog>
      <MuiFileUpload
        onUpload={handleFileUpload}
        accept="image/*,application/pdf"
        maxSize={10 * 1024 * 1024}
      />
    </MuiDialog>
  );
};
```

### Attachment Management

**Pattern**:

```jsx
// Display attachments
const AttachmentList = ({ attachments, onDelete }) => {
  return (
    <Box>
      {attachments.map((attachment) => (
        <Box
          key={attachment._id}
          sx={{ display: "flex", alignItems: "center", mb: 1 }}
        >
          <Typography variant="body2" sx={{ flex: 1 }}>
            {attachment.filename}
          </Typography>
          <IconButton size="small" onClick={() => onDelete(attachment._id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}
    </Box>
  );
};
```

## Theme Patterns

### Using Theme Tokens

**Purpose**: Use theme tokens for consistent styling

**Pattern**:

```jsx
import { useTheme } from "@mui/material/styles";

const MyComponent = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        // Colors
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderColor: theme.palette.divider,

        // Spacing
        padding: theme.spacing(2), // 16px
        margin: theme.spacing(1, 2), // 8px 16px
        gap: theme.spacing(1),

        // Typography
        ...theme.typography.body1,
        fontSize: theme.typography.h6.fontSize,

        // Breakpoints
        [theme.breakpoints.up("sm")]: {
          padding: theme.spacing(3),
        },
        [theme.breakpoints.down("md")]: {
          display: "none",
        },

        // Shadows
        boxShadow: theme.shadows[2],

        // Transitions
        transition: theme.transitions.create(
          ["background-color", "transform"],
          {
            duration: theme.transitions.duration.standard,
          }
        ),
      }}
    >
      Content
    </Box>
  );
};
```

### Responsive Design

**Breakpoints**:

- `xs`: 0px
- `sm`: 600px
- `md`: 900px
- `lg`: 1200px
- `xl`: 1536px

**Pattern**:

```jsx
// Grid responsive sizing
<Grid container spacing={2}>
  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
    <Card />
  </Grid>
</Grid>;

// Conditional rendering
const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

{
  isMobile ? <MobileView /> : <DesktopView />;
}

// Responsive styles
<Box
  sx={{
    display: { xs: "block", md: "flex" },
    flexDirection: { xs: "column", md: "row" },
    padding: { xs: 2, sm: 3, md: 4 },
  }}
>
  Content
</Box>;
```

### Theme Customization

**Pattern**:

```jsx
// theme/themePrimitives.js
export const brand = {
  50: "#F0F7FF",
  100: "#CEE5FD",
  // ... more shades
};

export const gray = {
  50: "#FBFCFE",
  100: "#EAF0F5",
  // ... more shades
};

// theme/AppTheme.jsx
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { brand, gray } from "./themePrimitives";

const theme = createTheme({
  palette: {
    primary: {
      main: brand[500],
      light: brand[300],
      dark: brand[700],
    },
    background: {
      default: gray[50],
      paper: "#fff",
    },
  },
  typography: {
    fontFamily: "Inter, sans-serif",
    h1: {
      fontSize: "2.5rem",
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
        },
      },
    },
  },
});

export default function AppTheme({ children }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
```

## Performance Optimization Patterns

### React.memo for List Components

**Purpose**: Prevent unnecessary re-renders of list items

**Pattern**:

```jsx
// TaskCard.jsx
import React, { useCallback, useMemo } from "react";

const TaskCard = React.memo(({ task, onClick, onUpdate }) => {
  // Memoize event handlers
  const handleClick = useCallback(() => {
    onClick(task);
  }, [task, onClick]);

  // Memoize computed values
  const formattedDate = useMemo(() => {
    return dayjs(task.createdAt).format("MMM DD, YYYY");
  }, [task.createdAt]);

  return (
    <Card onClick={handleClick}>
      <CardContent>
        <Typography>{task.title}</Typography>
        <Typography variant="caption">{formattedDate}</Typography>
      </CardContent>
    </Card>
  );
});

TaskCard.displayName = "TaskCard";

export default TaskCard;
```

### useCallback for Event Handlers

**Purpose**: Prevent creating new function references on every render

**Pattern**:

```jsx
const TasksList = ({ tasks, onTaskClick }) => {
  // ❌ Wrong: Creates new function on every render
  const handleClick = (task) => {
    onTaskClick(task);
  };

  // ✅ Correct: Memoized function
  const handleClick = useCallback(
    (task) => {
      onTaskClick(task);
    },
    [onTaskClick]
  );

  return (
    <Grid container spacing={2}>
      {tasks.map((task) => (
        <Grid key={task._id} size={{ xs: 12, md: 6 }}>
          <TaskCard task={task} onClick={handleClick} />
        </Grid>
      ))}
    </Grid>
  );
};
```

### useMemo for Computed Values

**Purpose**: Avoid expensive calculations on every render

**Pattern**:

```jsx
const TaskCard = ({ task }) => {
  // ❌ Wrong: Recalculates on every render
  const formattedDate = dayjs(task.createdAt).format("MMM DD, YYYY");
  const statusColor = getStatusColor(task.status);

  // ✅ Correct: Memoized values
  const formattedDate = useMemo(() => {
    return dayjs(task.createdAt).format("MMM DD, YYYY");
  }, [task.createdAt]);

  const statusColor = useMemo(() => {
    return getStatusColor(task.status);
  }, [task.status]);

  return (
    <Card>
      <Typography>{formattedDate}</Typography>
      <Chip label={task.status} color={statusColor} />
    </Card>
  );
};
```

### Code Splitting and Lazy Loading

**Purpose**: Reduce initial bundle size

**Pattern**:

```jsx
// routes.jsx
import { lazy, Suspense } from "react";
import MuiLoading from "./components/common/MuiLoading";

// Lazy load pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Materials = lazy(() => import("./pages/Materials"));

const routes = [
  {
    path: "/dashboard",
    element: (
      <Suspense fallback={<MuiLoading fullScreen />}>
        <Dashboard />
      </Suspense>
    ),
  },
  {
    path: "/tasks",
    element: (
      <Suspense fallback={<MuiLoading fullScreen />}>
        <Tasks />
      </Suspense>
    ),
  },
];
```

## Redux Patterns (RTK Query)

### API Setup

**Purpose**: Configure base API with authentication and error handling

**Pattern**:

```jsx
// redux/features/api.js
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

### Resource API Pattern

**Purpose**: Define CRUD endpoints for a resource

**Pattern**:

```jsx
// redux/features/material/materialApi.js
import { api } from "../api";

export const materialApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // List materials with pagination and filters
    getMaterials: builder.query({
      query: (params) => ({
        url: "/materials",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.materials.map(({ _id }) => ({
                type: "Material",
                id: _id,
              })),
              { type: "Material", id: "LIST" },
            ]
          : [{ type: "Material", id: "LIST" }],
    }),

    // Get single material
    getMaterial: builder.query({
      query: (id) => `/materials/${id}`,
      providesTags: (result, error, id) => [{ type: "Material", id }],
    }),

    // Create material
    createMaterial: builder.mutation({
      query: (body) => ({
        url: "/materials",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Material", id: "LIST" }],
    }),

    // Update material
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

    // Delete material (soft delete)
    deleteMaterial: builder.mutation({
      query: (id) => ({
        url: `/materials/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Material", id: "LIST" }],
    }),

    // Restore material
    restoreMaterial: builder.mutation({
      query: (id) => ({
        url: `/materials/${id}/restore`,
        method: "PATCH",
      }),
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

### Cache Invalidation Strategy

**Purpose**: Invalidate cache when data changes

**Strategies**:

1. **Invalidate List**: When creating, deleting, or restoring
2. **Invalidate Specific Item**: When updating
3. **Invalidate Related Resources**: When relationship changes

**Pattern**:

```jsx
// Create: Invalidate list
createMaterial: builder.mutation({
  invalidatesTags: [{ type: 'Material', id: 'LIST' }],
}),

// Update: Invalidate specific item and list
updateMaterial: builder.mutation({
  invalidatesTags: (result, error, { id }) => [
    { type: 'Material', id },
    { type: 'Material', id: 'LIST' },
  ],
}),

// Delete: Invalidate list
deleteMaterial: builder.mutation({
  invalidatesTags: [{ type: 'Material', id: 'LIST' }],
}),

// Socket.IO: Invalidate from real-time events
socket.on('material:created', () => {
  store.dispatch(materialApi.util.invalidateTags([{ type: 'Material', id: 'LIST' }]));
});
```

### Redux Slice Pattern

**Purpose**: Manage local state (non-API state)

**Pattern**:

```jsx
// redux/features/auth/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
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

export const { setUser, clearUser, setLoading } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
```

### Store Configuration

**Purpose**: Configure Redux store with persistence

**Pattern**:

```jsx
// redux/app/store.js
import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import { api } from "../features/api";
import authReducer from "../features/auth/authSlice";

// Persist config
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

## Routing Patterns

### Route Configuration

**Purpose**: Define all application routes

**Pattern**:

```jsx
// router/routes.jsx
import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../layouts/RootLayout";
import PublicLayout from "../layouts/PublicLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import PublicRoute from "../components/auth/PublicRoute";
import RouteError from "../components/common/RouteError";

// Lazy load pages
const Home = lazy(() => import("../pages/Home"));
const Login = lazy(() => import("../pages/Login"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Tasks = lazy(() => import("../pages/Tasks"));
const Materials = lazy(() => import("../pages/Materials"));
const NotFound = lazy(() => import("../pages/NotFound"));

const router = createBrowserRouter([
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
          {
            path: "materials",
            element: (
              <ProtectedRoute>
                <Materials />
              </ProtectedRoute>
            ),
          },
        ],
      },
      // 404
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);

export default router;
```

### Protected Route Pattern

**Purpose**: Restrict access to authenticated users

**Pattern**:

```jsx
// components/auth/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "../../redux/features/auth/authSlice";
import MuiLoading from "../common/MuiLoading";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector((state) => state.auth.isLoading);

  if (isLoading) {
    return <MuiLoading fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
```

### Public Route Pattern

**Purpose**: Redirect authenticated users away from public pages

**Pattern**:

```jsx
// components/auth/PublicRoute.jsx
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "../../redux/features/auth/authSlice";

const PublicRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
```

### Navigation Pattern

**Purpose**: Programmatic navigation

**Pattern**:

```jsx
import { useNavigate } from "react-router-dom";

const MyComponent = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Navigate to route
    navigate("/tasks");

    // Navigate with state
    navigate("/tasks/123", { state: { from: "dashboard" } });

    // Navigate back
    navigate(-1);

    // Replace current entry
    navigate("/login", { replace: true });
  };

  return <Button onClick={handleClick}>Go to Tasks</Button>;
};
```

## Hook Patterns

### useAuth Hook

**Purpose**: Access authentication state and methods

**Pattern**:

```jsx
// hooks/useAuth.js
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
    try {
      const result = await loginMutation(credentials).unwrap();
      dispatch(setUser(result.user));
      navigate("/dashboard");
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutMutation().unwrap();
      dispatch(clearUser());
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return {
    user,
    isAuthenticated,
    login,
    logout,
  };
};

export default useAuth;

// Usage
const MyComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();

  return (
    <Box>
      {isAuthenticated ? (
        <>
          <Typography>Welcome, {user.firstName}</Typography>
          <Button onClick={logout}>Logout</Button>
        </>
      ) : (
        <Button onClick={() => login({ email, password })}>Login</Button>
      )}
    </Box>
  );
};
```

### useSocket Hook

**Purpose**: Access Socket.IO connection and methods

**Pattern**:

```jsx
// hooks/useSocket.js
import { useEffect } from "react";
import socketService from "../services/socketService";

const useSocket = () => {
  useEffect(() => {
    socketService.connect();

    return () => {
      socketService.disconnect();
    };
  }, []);

  const on = (event, handler) => {
    socketService.on(event, handler);
  };

  const off = (event, handler) => {
    socketService.off(event, handler);
  };

  const emit = (event, data) => {
    socketService.emit(event, data);
  };

  return { on, off, emit };
};

export default useSocket;

// Usage
const TasksPage = () => {
  const { on, off } = useSocket();

  useEffect(() => {
    const handleTaskCreated = (task) => {
      console.log("Task created:", task);
    };

    on("task:created", handleTaskCreated);

    return () => {
      off("task:created", handleTaskCreated);
    };
  }, [on, off]);

  return <TasksList />;
};
```

## Naming Conventions

### File Naming

| Type        | Pattern         | Example                    | Location              |
| ----------- | --------------- | -------------------------- | --------------------- |
| Pages       | PascalCase      | `MaterialsPage.jsx`        | `pages/`              |
| Components  | PascalCase      | `TaskCard.jsx`             | `components/*/`       |
| Forms       | `CreateUpdate*` | `CreateUpdateMaterial.jsx` | `components/forms/*/` |
| Filters     | `*Filter`       | `MaterialFilter.jsx`       | `components/filters/` |
| Columns     | `*Columns`      | `MaterialColumns.jsx`      | `components/columns/` |
| Cards       | `*Card`         | `TaskCard.jsx`             | `components/cards/`   |
| Lists       | `*List`         | `TasksList.jsx`            | `components/lists/`   |
| Hooks       | `use*`          | `useAuth.js`               | `hooks/`              |
| Services    | camelCase       | `socketService.js`         | `services/`           |
| Utils       | camelCase       | `constants.js`             | `utils/`              |
| Redux API   | `*Api`          | `materialApi.js`           | `redux/features/*/`   |
| Redux Slice | `*Slice`        | `authSlice.js`             | `redux/features/*/`   |

### Variable Naming

```jsx
// Boolean variables
const isLoading = true;
const hasError = false;
const canEdit = true;
const shouldShow = false;

// Event handlers
const handleClick = () => {};
const handleSubmit = () => {};
const handleChange = () => {};
const handleDelete = () => {};

// State variables
const [materials, setMaterials] = useState([]);
const [selectedMaterial, setSelectedMaterial] = useState(null);
const [dialogOpen, setDialogOpen] = useState(false);
const [filters, setFilters] = useState({});

// Constants (UPPER_SNAKE_CASE)
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const API_BASE_URL = import.meta.env.VITE_API_URL;
```

## Anti-Patterns to Avoid

### ❌ Using watch() in React Hook Form

```jsx
// ❌ Wrong
const { watch } = useForm();
const watchedValue = watch("fieldName");

// ✅ Correct
const { control } = useForm();
<Controller
  name="fieldName"
  control={control}
  render={({ field }) => <MuiTextField {...field} />}
/>;
```

### ❌ Hardcoding Constants

```jsx
// ❌ Wrong
if (status === "Completed") {
}
if (role === "Admin") {
}

// ✅ Correct
import { TASK_STATUS, USER_ROLES } from "../utils/constants";
if (status === TASK_STATUS[2]) {
}
if (role === USER_ROLES.ADMIN) {
}
```

### ❌ Using MUI v5/v6 Grid Syntax

```jsx
// ❌ Wrong (MUI v5/v6)
<Grid container>
  <Grid item xs={12} md={6}>
    Content
  </Grid>
</Grid>

// ✅ Correct (MUI v7)
<Grid container>
  <Grid size={{ xs: 12, md: 6 }}>
    Content
  </Grid>
</Grid>
```

### ❌ Missing Dialog Accessibility Props

```jsx
// ❌ Wrong
<Dialog open={open} onClose={onClose}>
  <DialogTitle>Title</DialogTitle>
  <DialogContent>Content</DialogContent>
</Dialog>

// ✅ Correct
<Dialog
  open={open}
  onClose={onClose}
  disableEnforceFocus
  disableRestoreFocus
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
  <DialogTitle id="dialog-title">Title</DialogTitle>
  <DialogContent id="dialog-description">Content</DialogContent>
</Dialog>
```

### ❌ Not Memoizing List Components

```jsx
// ❌ Wrong
const TaskCard = ({ task, onClick }) => {
  return <Card onClick={() => onClick(task)}>{task.title}</Card>;
};

// ✅ Correct
const TaskCard = React.memo(({ task, onClick }) => {
  const handleClick = useCallback(() => {
    onClick(task);
  }, [task, onClick]);

  return <Card onClick={handleClick}>{task.title}</Card>;
});

TaskCard.displayName = "TaskCard";
```

### ❌ Ignoring Backend Field Names

```jsx
// ❌ Wrong (using different field names)
const data = {
  department: departmentId, // Backend expects departmentId
  assignee: userId, // Backend expects assigneeId
};

// ✅ Correct (matching backend validators)
const data = {
  departmentId: departmentId,
  assigneeId: userId,
};
```

### ❌ Not Converting Pagination

```jsx
// ❌ Wrong (sending 0-based page to backend)
const { data } = useGetMaterialsQuery({
  page: pagination.page, // 0, 1, 2...
  limit: pagination.pageSize,
});

// ✅ Correct (converting to 1-based for backend)
const { data } = useGetMaterialsQuery({
  page: pagination.page + 1, // 1, 2, 3...
  limit: pagination.pageSize,
});
```

## File Coverage Summary

This documentation covers all 129+ frontend files:

**Components** (60+ files):

- `components/auth/*` (4 files)
- `components/cards/*` (9 files)
- `components/columns/*` (8 files)
- `components/common/*` (26 files)
- `components/filters/*` (4 files)
- `components/forms/*` (9 files)
- `components/lists/*` (2 files)

**Pages** (11 files):

- Dashboard, Departments, ForgotPassword, Home, Materials, NotFound, Organization, Organizations, Tasks, Users, Vendors

**Redux** (20+ files):

- `redux/app/store.js`
- `redux/features/api.js`
- `redux/features/*/` (8 resource APIs + slices)

**Hooks** (2 files):

- `hooks/useAuth.js`
- `hooks/useSocket.js`

**Services** (3 files):

- `services/socketService.js`
- `services/socketEvents.js`
- `services/cloudinaryService.js`

**Utils** (4 files):

- `utils/constants.js`
- `utils/errorHandler.js`
- `utils/dateUtils.js`
- `utils/authorizationHelper.js`

**Theme** (10+ files):

- `theme/AppTheme.jsx`
- `theme/themePrimitives.js`
- `theme/customizations/*` (9 files)

**Router** (1 file):

- `router/routes.jsx`

**Layouts** (3 files):

- `layouts/RootLayout.jsx`
- `layouts/PublicLayout.jsx`
- `layouts/DashboardLayout.jsx`

**Entry Points** (2 files):

- `App.jsx`
- `main.jsx`

**Total**: 129+ frontend files documented

- `utils/dateUtils.js`
- `utils/authorizationHelper.js`

**Theme** (10+ files):

- `theme/AppTheme.jsx`
- `theme/themePrimitives.js`
- `theme/customizations/*` (9 files)

**Router** (1 file):

- `router/routes.jsx`

**Layouts** (3 files):

- `layouts/RootLayout.jsx`
- `layouts/PublicLayout.jsx`
- `layouts/DashboardLayout.jsx`

**Entry Points** (2 files):

- `App.jsx`
- `main.jsx`

**Total**: 129+ frontend files documented
