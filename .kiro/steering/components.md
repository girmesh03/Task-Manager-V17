---
inclusion: always
---

# Component Usage Guidelines

## MuiDataGrid Component

**Location**: `client/src/components/common/MuiDataGrid.jsx`

**When to Use**: Organizations, Departments, Materials, Vendors, Users (admin view)

**Critical Rules**:

1. ✅ ALWAYS use server-side pagination (never client-side)
2. ✅ ALWAYS pass `loading={isLoading || isFetching}`
3. ✅ ALWAYS convert pagination: 0-based (MUI) ↔ 1-based (backend)
4. ✅ ALWAYS use `PAGINATION.PAGE_SIZE_OPTIONS` constant
5. ✅ ALWAYS provide meaningful `emptyMessage`
6. ✅ ALWAYS use `getRowClassName` for row styling (not inline styles)

**Default Props**:

```javascript
{
  autoHeight: true,
  disableRowSelectionOnClick: true,
  pageSizeOptions: PAGINATION.PAGE_SIZE_OPTIONS,
  paginationMode: "server",
  sortingMode: "server",
  filterMode: "server"
}
```

## MuiActionColumn Component

**Location**: `client/src/components/common/MuiActionColumn.jsx`

**Purpose**: Standardized action buttons for DataGrid rows

**Critical Rules**:

1. ✅ ALWAYS use in action columns (never create custom action buttons)
2. ✅ ALWAYS pass all four handlers: `onView`, `onEdit`, `onDelete`, `onRestore`
3. ✅ ALWAYS set on action column: `sortable: false`, `filterable: false`, `disableColumnMenu: true`
4. ✅ Auto-detects soft delete via `row.isDeleted` or `row.deleted`

**Props**:

```javascript
{
  row: any;              // Row data
  onView?: (row) => void;
  onEdit?: (row) => void;
  onDelete?: (row) => void;
  onRestore?: (row) => void;
  hideView?: boolean;
  hideEdit?: boolean;
  hideDelete?: boolean;
  hideRestore?: boolean;
  disabled?: boolean;
}
```

**Action Logic**:

- **View**: Always visible (unless `hideView` or no handler)
- **Edit**: Visible only for active rows (not deleted)
- **Delete**: Visible only for active rows (not deleted)
- **Restore**: Visible only for deleted rows

**Usage Example**:

```javascript
import MuiActionColumn from "../common/MuiActionColumn";

export const getUserColumns = (actions) => {
  const { onView, onEdit, onDelete, onRestore } = actions;

  return [
    { field: "firstName", headerName: "First Name", flex: 1 },
    { field: "lastName", headerName: "Last Name", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
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
```

## CustomDataGridToolbar Component

**Location**: `client/src/components/common/CustomDataGridToolbar.jsx`

**Purpose**: Optional toolbar for MuiDataGrid with export, filter, and column controls

**When to Use**: Pages that need export functionality

**Props**:

```javascript
{
  items?: Array<any>;        // Data for export
  fileName?: string;         // Export filename (default: "export")
  showExport?: boolean;      // Show export button (default: true)
  showFilters?: boolean;     // Show filter button (default: true)
  showColumns?: boolean;     // Show column visibility (default: true)
  showDensity?: boolean;     // Show density selector (default: true)
  onExport?: (data) => void; // Custom export handler
}
```

**Usage**:

```javascript
<MuiDataGrid
  slots={{
    toolbar: CustomDataGridToolbar,
  }}
  slotProps={{
    toolbar: {
      items: materials,
      fileName: "materials-export",
      showExport: true,
      showFilters: true,
      showColumns: true,
      showDensity: true,
    },
  }}
/>
```

## Form Components

### MuiTextField

**Location**: `client/src/components/common/MuiTextField.jsx`

**Purpose**: Text input with validation and adornments

**Props**:

```javascript
{
  name: string;                    // Required - Field name
  type?: string;                   // Input type (default: "text")
  startAdornment?: React.ReactNode; // Icon/text at start
  endAdornment?: React.ReactNode;   // Icon/text at end
  error?: object;                  // Error object from React Hook Form
  helperText?: string;             // Helper text below input
  onChange?: Function;             // Change handler
  onBlur?: Function;               // Blur handler
  ...muiProps                      // All MUI TextField props
}
```

**Usage with React Hook Form**:

```javascript
<Controller
  name="email"
  control={control}
  rules={{ required: "Email is required" }}
  render={({ field }) => (
    <MuiTextField
      {...field}
      label="Email"
      type="email"
      error={errors.email}
      startAdornment={<EmailIcon />}
    />
  )}
/>
```

### MuiTextArea

**Location**: `client/src/components/common/MuiTextArea.jsx`

**Purpose**: Multi-line text input with character counter

**Props**:

```javascript
{
  name: string;              // Required - Field name
  error?: object;            // Error object from React Hook Form
  label?: string;            // Input label
  maxLength?: number;        // Max characters (shows counter)
  rows?: number;             // Number of rows (default: 4)
  minRows?: number;          // Min rows for auto-resize
  maxRows?: number;          // Max rows for auto-resize
  helperText?: string;       // Helper text below input
  onChange?: Function;       // Change handler
  onBlur?: Function;         // Blur handler
  ...muiProps                // All MUI TextField props
}
```

**Usage**:

```javascript
<Controller
  name="description"
  control={control}
  render={({ field }) => (
    <MuiTextArea
      {...field}
      label="Description"
      maxLength={2000}
      rows={4}
      error={errors.description}
    />
  )}
/>
```

### MuiNumberField

**Location**: `client/src/components/common/MuiNumberField.jsx`

**Purpose**: Number input with validation and prefix/suffix

**Props**:

```javascript
{
  name: string;              // Required - Field name
  error?: object;            // Error object from React Hook Form
  label: string;             // Required - Input label
  min?: number;              // Minimum value
  max?: number;              // Maximum value
  step?: number;             // Step increment (default: 1)
  prefix?: string;           // Prefix text (e.g., "$")
  suffix?: string;           // Suffix text (e.g., "kg")
  helperText?: string;       // Helper text below input
  ...muiProps                // All MUI TextField props
}
```

**Usage**:

```javascript
<Controller
  name="cost"
  control={control}
  render={({ field }) => (
    <MuiNumberField
      {...field}
      label="Cost"
      prefix="$"
      min={0}
      step={0.01}
      error={errors.cost}
    />
  )}
/>
```

### MuiSelectAutocomplete

**Location**: `client/src/components/common/MuiSelectAutocomplete.jsx`

**Purpose**: Single-select autocomplete with search

**Props**:

```javascript
{
  name: string;                    // Required - Field name
  control: object;                 // Required - React Hook Form control
  rules?: object;                  // Validation rules
  options: Array<{id, label}>;     // Required - Selection options
  label?: string;                  // Input label
  required?: boolean;              // Mark as required
  placeholder?: string;            // Placeholder text
  startAdornment?: React.ReactNode; // Icon at start
  onValueChange?: Function;        // Callback on value change
  ...muiProps                      // All MUI Autocomplete props
}
```

**Usage**:

```javascript
<MuiSelectAutocomplete
  name="category"
  control={control}
  rules={{ required: "Category is required" }}
  options={[
    { id: "1", label: "Electrical" },
    { id: "2", label: "Mechanical" },
  ]}
  label="Category"
  required
/>
```

### MuiMultiSelect

**Location**: `client/src/components/common/MuiMultiSelect.jsx`

**Purpose**: Multi-select autocomplete with chips

**Props**:

```javascript
{
  name: string;                    // Required - Field name
  control: object;                 // Required - React Hook Form control
  rules?: object;                  // Validation rules
  options: Array<{id, label}>;     // Required - Selection options
  label: string;                   // Required - Input label
  placeholder?: string;            // Placeholder text
  maxSelections?: number;          // Max selections allowed
  startAdornment?: React.ReactNode; // Icon at start
  disabled?: boolean;              // Disable input
  ...muiProps                      // All MUI Autocomplete props
}
```

**Usage**:

```javascript
<MuiMultiSelect
  name="tags"
  control={control}
  options={tagOptions}
  label="Tags"
  maxSelections={5}
  placeholder="Select tags"
/>
```

### MuiResourceSelect

**Location**: `client/src/components/common/MuiResourceSelect.jsx`

**Purpose**: Fetch and select resources (users, departments, materials, vendors)

**Props**:

```javascript
{
  name: string;                    // Required - Field name
  control: object;                 // Required - React Hook Form control
  rules?: object;                  // Validation rules
  resourceType: string;            // Required - "departments" | "users" | "materials" | "vendors"
  label: string;                   // Required - Input label
  multiple?: boolean;              // Enable multiple selection
  maxSelections?: number;          // Max selections for multiple mode
  placeholder?: string;            // Placeholder text
  startAdornment?: React.ReactNode; // Icon at start
  disabled?: boolean;              // Disable input
  queryParams?: object;            // Additional API query params
  watchersOnly?: boolean;          // For users: filter only HOD roles
  ...muiProps                      // All MUI Autocomplete props
}
```

**Usage**:

```javascript
// Single user selection
<MuiResourceSelect
  name="assignedTo"
  control={control}
  resourceType="users"
  label="Assigned To"
  rules={{ required: "Assignee is required" }}
/>

// Multiple watchers (HOD only)
<MuiResourceSelect
  name="watcherIds"
  control={control}
  resourceType="users"
  label="Watchers"
  multiple
  maxSelections={20}
  watchersOnly
/>
```

### MuiDatePicker

**Location**: `client/src/components/common/MuiDatePicker.jsx`

**Purpose**: Single date picker with timezone conversion

**Props**:

```javascript
{
  name: string;              // Required - Field name
  control: object;           // Required - React Hook Form control
  rules?: object;            // Validation rules
  label: string;             // Required - Input label
  minDate?: Date|string;     // Minimum selectable date
  maxDate?: Date|string;     // Maximum selectable date
  disabled?: boolean;        // Disable picker
  helperText?: string;       // Helper text below input
  format?: string;           // Date format (default: "MM/DD/YYYY")
  ...muiProps                // All MUI DatePicker props
}
```

**Usage**:

```javascript
<MuiDatePicker
  name="dueDate"
  control={control}
  label="Due Date"
  minDate={new Date()}
  rules={{ required: "Due date is required" }}
/>
```

**Note**: Automatically converts between UTC (API) and local time (UI)

### MuiDateRangePicker

**Location**: `client/src/components/common/MuiDateRangePicker.jsx`

**Purpose**: Start/end date pickers with validation

**Props**:

```javascript
{
  startName: string;         // Required - Start date field name
  endName: string;           // Required - End date field name
  control: object;           // Required - React Hook Form control
  rules?: object;            // Validation rules
  label?: string;            // Field label (default: "Date Range")
  disabled?: boolean;        // Disable pickers
  format?: string;           // Date format (default: "MM/DD/YYYY")
  minDate?: Date|string;     // Minimum selectable date
  maxDate?: Date|string;     // Maximum selectable date
  ...muiProps                // All MUI DatePicker props
}
```

**Usage**:

```javascript
<MuiDateRangePicker
  startName="startDate"
  endName="dueDate"
  control={control}
  label="Task Duration"
/>
```

**Note**: Automatically validates end date is after start date

### MuiCheckbox

**Location**: `client/src/components/common/MuiCheckbox.jsx`

**Purpose**: Checkbox with label and validation

**Props**:

```javascript
{
  name: string;              // Required - Field name
  control: object;           // Required - React Hook Form control
  label: string;             // Required - Checkbox label
  helperText?: string;       // Helper text below checkbox
  disabled?: boolean;        // Disable checkbox
  ...muiProps                // All MUI Checkbox props
}
```

**Usage**:

```javascript
<MuiCheckbox
  name="emailNotifications"
  control={control}
  label="Enable email notifications"
/>
```

### MuiRadioGroup

**Location**: `client/src/components/common/MuiRadioGroup.jsx`

**Purpose**: Radio button group with validation

**Props**:

```javascript
{
  name: string;                    // Required - Field name
  control: object;                 // Required - React Hook Form control
  rules?: object;                  // Validation rules
  options: Array<{value, label}>;  // Required - Radio options
  label: string;                   // Required - Group label
  row?: boolean;                   // Display horizontally
  ...muiProps                      // All MUI RadioGroup props
}
```

**Usage**:

```javascript
<MuiRadioGroup
  name="priority"
  control={control}
  options={[
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
  ]}
  label="Priority"
  row
/>
```

### MuiFileUpload

**Location**: `client/src/components/common/MuiFileUpload.jsx`

**Purpose**: File upload with preview and validation

**Props**:

```javascript
{
  name: string;              // Required - Field name
  control: object;           // Required - React Hook Form control
  accept?: string;           // Accepted file types (e.g., "image/*")
  maxSize?: number;          // Max file size in bytes
  multiple?: boolean;        // Allow multiple files
  onUpload?: Function;       // Upload handler function
  ...muiProps                // Additional props
}
```

**Usage**:

```javascript
<MuiFileUpload
  name="attachments"
  control={control}
  accept="image/*,.pdf"
  maxSize={10 * 1024 * 1024} // 10MB
  multiple
  onUpload={handleUpload}
/>
```

**Features**:

- Image preview for image files
- File size display
- Remove individual files
- Automatic size validation

## Filter Components

### FilterTextField

**Location**: `client/src/components/common/FilterTextField.jsx`

**Purpose**: Text input optimized for filtering with debouncing

**Props**:

```javascript
{
  value: string;             // Current value
  onChange: Function;        // Required - Change handler
  label?: string;            // Field label
  placeholder?: string;      // Placeholder text
  startAdornment?: React.ReactNode; // Start icon
  debounceMs?: number;       // Debounce delay (default: 300ms)
}
```

**Usage**:

```javascript
<FilterTextField
  value={filters.search}
  onChange={(value) => setFilters({ ...filters, search: value })}
  label="Search"
  placeholder="Search materials..."
  startAdornment={<SearchIcon />}
/>
```

### FilterSelect

**Location**: `client/src/components/common/FilterSelect.jsx`

**Purpose**: Single or multiple select for filtering

**Props**:

```javascript
{
  value: string|string[];    // Current value(s)
  onChange: Function;        // Required - Change handler
  options: Array<{value, label}>; // Required - Selection options
  label?: string;            // Field label
  placeholder?: string;      // Placeholder text
  multiple?: boolean;        // Enable multiple selection
  startAdornment?: React.ReactNode; // Start icon
}
```

**Usage**:

```javascript
<FilterSelect
  value={filters.category}
  onChange={(value) => setFilters({ ...filters, category: value })}
  options={[
    { value: "Electrical", label: "Electrical" },
    { value: "Mechanical", label: "Mechanical" },
  ]}
  label="Category"
/>
```

### FilterDateRange

**Location**: `client/src/components/common/FilterDateRange.jsx`

**Purpose**: Date range picker for filtering

**Props**:

```javascript
{
  startDate: string;         // Start date (ISO string)
  endDate: string;           // End date (ISO string)
  onStartDateChange: Function; // Required - Start date handler
  onEndDateChange: Function;   // Required - End date handler
  label?: string;            // Field label (default: "Date Range")
}
```

**Usage**:

```javascript
<FilterDateRange
  startDate={filters.startDate}
  endDate={filters.endDate}
  onStartDateChange={(date) => setFilters({ ...filters, startDate: date })}
  onEndDateChange={(date) => setFilters({ ...filters, endDate: date })}
  label="Created Date"
/>
```

### FilterChipGroup

**Location**: `client/src/components/common/FilterChipGroup.jsx`

**Purpose**: Chip-based multi-select filter

**Props**:

```javascript
{
  value: string[];           // Selected values array
  onChange: Function;        // Required - Change handler
  options: Array<{value, label}>; // Required - Selection options
  label?: string;            // Field label
}
```

**Usage**:

```javascript
<FilterChipGroup
  value={filters.statuses}
  onChange={(value) => setFilters({ ...filters, statuses: value })}
  options={[
    { value: "To Do", label: "To Do" },
    { value: "In Progress", label: "In Progress" },
    { value: "Completed", label: "Completed" },
  ]}
  label="Status"
/>
```

## Dialog Components

### MuiDialog

**Location**: `client/src/components/common/MuiDialog.jsx`

**Purpose**: Base dialog wrapper for all CRUD operations

**Props**:

```javascript
{
  open: boolean;             // Required - Dialog open state
  onClose: Function;         // Required - Close handler
  title: string;             // Required - Dialog title
  children: React.ReactNode; // Required - Dialog content
  actions?: React.ReactNode; // Custom action buttons
  fullScreen?: boolean;      // Force full-screen mode
  disableBackdropClick?: boolean; // Prevent closing on backdrop click
  disableEscapeKeyDown?: boolean; // Prevent closing on Escape key
  maxWidth?: string;         // Dialog max width ("xs"|"sm"|"md"|"lg"|"xl")
  isLoading?: boolean;       // Show loading state
}
```

**Usage**:

```javascript
<MuiDialog
  open={dialogOpen}
  onClose={() => setDialogOpen(false)}
  title="Create Material"
  maxWidth="md"
  actions={
    <>
      <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
      <Button variant="contained" onClick={handleSubmit}>
        Save
      </Button>
    </>
  }
>
  <FormContent />
</MuiDialog>
```

**Critical Features**:

- `disableEnforceFocus` and `disableRestoreFocus` prevent focus trap
- Responsive (full-screen on mobile)
- Scrollable content area
- Fixed header and footer

### MuiDialogConfirm

**Location**: `client/src/components/common/MuiDialogConfirm.jsx`

**Purpose**: Confirmation dialog for destructive actions

**Props**:

```javascript
{
  open: boolean;             // Required - Dialog open state
  onClose: Function;         // Required - Close handler
  onConfirm: Function;       // Required - Confirm action handler
  title: string;             // Required - Dialog title
  message: string;           // Required - Confirmation message
  confirmText?: string;      // Confirm button text (default: "Confirm")
  cancelText?: string;       // Cancel button text (default: "Cancel")
  severity?: string;         // "error"|"warning"|"info" (default: "warning")
  isLoading?: boolean;       // Show loading state
}
```

**Usage**:

```javascript
<MuiDialogConfirm
  open={confirmOpen}
  onClose={() => setConfirmOpen(false)}
  onConfirm={handleDelete}
  title="Delete Material"
  message="Are you sure you want to delete this material? This action cannot be undone."
  confirmText="Delete"
  severity="error"
  isLoading={isDeleting}
/>
```

**Dialog Requirements**: ALL dialogs MUST include:

```javascript
<Dialog
  disableEnforceFocus
  disableRestoreFocus
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
```

## Loading Components

### MuiLoading (LoadingFallback)

**Location**: `client/src/components/common/MuiLoading.jsx`

**Purpose**: Loading spinner with message

**Props**:

```javascript
{
  message?: string;          // Loading message
  height?: string;           // Container height (default: "100vh")
  sx?: object;               // Additional styles
}
```

**Usage**:

```javascript
<LoadingFallback message="Loading materials..." height="400px" />
```

### BackdropFallback

**Purpose**: Full-screen loading overlay

**Props**:

```javascript
{
  message?: string;          // Loading message
  open: boolean;             // Required - Open state
  sx?: object;               // Additional styles
}
```

### NavigationLoader

**Purpose**: Top progress bar for page navigation

**Usage**:

```javascript
{
  isNavigating && <NavigationLoader />;
}
```

### ContentLoader

**Purpose**: Loading overlay for content area

**Props**:

```javascript
{
  isLoading: boolean; // Required - Loading state
  children: React.ReactNode; // Required - Content
}
```

**Usage**:

```javascript
<ContentLoader isLoading={isFetching}>
  <MaterialsList materials={materials} />
</ContentLoader>
```

## Utility Components

### NotificationMenu

**Location**: `client/src/components/common/NotificationMenu.jsx`

**Purpose**: Notification dropdown with bell icon and unread count

**Props**: None (self-contained)

**Usage**:

```javascript
<NotificationMenu />
```

**Features**:

- Displays unread count badge
- Shows recent 5 notifications
- Mark as read functionality
- Mark all as read
- Navigate to related resource
- View all notifications link

### GlobalSearch

**Location**: `client/src/components/common/GlobalSearch.jsx`

**Purpose**: Global search across all resources

**Props**:

```javascript
{
  open: boolean; // Required - Dialog open state
  onClose: Function; // Required - Close handler
}
```

**Usage**:

```javascript
const [searchOpen, setSearchOpen] = useState(false);

// Keyboard shortcut
useEffect(() => {
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      setSearchOpen(true);
    }
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, []);

<GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />;
```

**Features**:

- Search across users, tasks, departments, materials, vendors
- Debounced search (300ms)
- Grouped results by resource type
- Navigate to resource on click
- Keyboard shortcut: Ctrl+K or Cmd+K

### ErrorBoundary

**Location**: `client/src/components/common/ErrorBoundary.jsx`

**Purpose**: Catch React component errors

**Usage**:

```javascript
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### RouteError

**Location**: `client/src/components/common/RouteError.jsx`

**Purpose**: Display routing errors (404, etc.)

**Usage**: Automatically used by React Router

### CustomIcons

**Location**: `client/src/components/common/CustomIcons.jsx`

**Purpose**: Custom icon components

**Available Icons**:

- `PlatformIconLogo` - Platform logo icon

### TaskActivityList

**Location**: `client/src/components/common/TaskActivityList.jsx`

**Purpose**: Display list of task activities for ProjectTask and AssignedTask ONLY

**Note**: RoutineTask does NOT have TaskActivity. Materials are added directly to RoutineTask.

### TaskCommentList

**Location**: `client/src/components/common/TaskCommentList.jsx`

**Purpose**: Display threaded task comments (max depth 3) with attachments

## Component Naming Patterns

- **Forms**: `CreateUpdate*` (e.g., `CreateUpdateUser.jsx`)
- **Filters**: `*Filter` (e.g., `UserFilter.jsx`)
- **Columns**: `*Columns` (e.g., `UserColumns.jsx`)
- **Cards**: `*Card` (e.g., `TaskCard.jsx`)
- **Lists**: `*List` (e.g., `TasksList.jsx`)

## Performance Best Practices

1. **List/Card Components**: Wrap with `React.memo`
2. **Event Handlers**: Use `useCallback` when passing to children
3. **Computed Values**: Use `useMemo` for expensive calculations
4. **Avoid Re-renders**: Destructure props at component level

## Resources Managed

Organization, Department, Task (ProjectTask/RoutineTask/AssignedTask), User, TaskActivity (ProjectTask/AssignedTask only), TaskComment, Material, Vendor (external clients), Attachment, Notification

**Task Type Notes**:

- **ProjectTask**: Outsourced to vendors, materials via TaskActivity
- **RoutineTask**: Received from outlets, materials added directly (no TaskActivity)
- **AssignedTask**: Assigned to users, materials via TaskActivity
