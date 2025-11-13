---
inclusion: manual
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

## Common Reusable Components

**Location**: `client/src/components/common/`

### Form Components

- `MuiTextField` - Text input with validation
- `MuiTextArea` - Multi-line text input
- `MuiNumberField` - Number input with formatting
- `MuiSelectAutocomplete` - Autocomplete select
- `MuiMultiSelect` - Multiple selection
- `MuiResourceSelect` - Resource selection (users, departments, etc.)
- `MuiDatePicker` - Single date picker
- `MuiDateRangePicker` - Date range picker
- `MuiCheckbox` - Checkbox with label
- `MuiRadioGroup` - Radio button group
- `MuiFileUpload` - File upload with preview

### Filter Components

- `FilterTextField` - Text filter input
- `FilterSelect` - Select filter dropdown
- `FilterDateRange` - Date range filter
- `FilterChipGroup` - Active filter chips display

### Dialog Components

- `MuiDialog` - Base dialog wrapper
- `MuiDialogConfirm` - Confirmation dialog

**Dialog Requirements**: ALL dialogs MUST include:

```javascript
<Dialog
  disableEnforceFocus
  disableRestoreFocus
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
```

### Other Components

- `MuiLoading` - Loading spinner
- `ErrorBoundary` - Error boundary wrapper
- `RouteError` - Route error display
- `NotificationMenu` - Notification dropdown
- `GlobalSearch` - Global search bar
- `CustomIcons` - Custom icon components (PlatformIconLogo)

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

Organization, Department, Task, User, TaskActivity, TaskComment, Material, Vendor, Attachment, Notification
