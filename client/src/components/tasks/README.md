# Task Components

This directory contains all task-related components for the Task Manager application.

## Components

### TaskCard

A reusable card component that displays task information with:

- Task title and description
- Status and priority chips with color coding
- Task type badge
- Assigned user avatar
- Edit and delete action buttons
- Hover effects and smooth transitions

### TaskList

Container component that manages the display of multiple tasks:

- Grid layout (responsive: 1 column on mobile, 2 on tablet, 3 on desktop)
- Loading state with spinner
- Error state handling
- Empty state message
- Integrated MUI Pagination component

### TaskFilters

Filter bar component with:

- Search input with icon
- Status dropdown (All, Pending, In Progress, Completed, Cancelled)
- Priority dropdown (All, Low, Medium, High)
- Type dropdown (All, Project, Routine)
- Clear filters button

## Redux Integration

### tasksSlice

State management for:

- Filter state (status, priority, type, search)
- Pagination state (page, limit)
- Selected task state
- Actions: setFilters, clearFilters, setPage, setLimit
- Selectors: selectTaskFilters, selectTaskPagination, selectSelectedTask

### tasksApi

RTK Query endpoints for:

- `getTasks` - Fetch paginated tasks with filters
- `getTaskById` - Fetch single task details
- `createTask` - Create new task
- `updateTask` - Update existing task
- `deleteTask` - Delete task

## Theming

All components use the existing MUI theme customizations:

- Card styling from `theme/customizations/surfaces.js`
- Color palette from `theme/themePrimitives.js`
- Consistent spacing and typography

## Usage Example

```jsx
import { Tasks } from "../pages/Tasks";

// The Tasks page component handles all the integration
// Individual components can be imported from:
import { TaskCard, TaskList, TaskFilters } from "../components/tasks";
```

## Features

- Fully responsive design
- Real-time filtering without page reload
- Optimistic UI updates with RTK Query
- Automatic cache invalidation
- Accessible components with proper ARIA labels
- Smooth animations and transitions
