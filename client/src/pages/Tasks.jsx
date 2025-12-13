// client/src/pages/Tasks.jsx
import { useState, useCallback, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  IconButton,
  Typography,
  Tooltip,
  Stack,
  Paper,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BusinessIcon from "@mui/icons-material/Business";
import InventoryIcon from "@mui/icons-material/Inventory";
import { toast } from "react-toastify";
import { LoadingFallback } from "../components/common/MuiLoading";
import RouteError from "../components/common/RouteError";
import MuiDialog from "../components/common/MuiDialog";
import MuiDialogConfirm from "../components/common/MuiDialogConfirm";
import TasksList from "../components/lists/TasksList";
import TaskFilter from "../components/filters/TaskFilter";
import CreateUpdateTask from "../components/forms/tasks/CreateUpdateTask";
import {
  useGetTasksQuery,
  useDeleteTaskMutation,
  useRestoreTaskMutation,
} from "../redux/features/task/taskApi";
import {
  selectTaskFilters,
  selectTaskPagination,
  setFilters,
  clearFilters,
  setPage,
} from "../redux/features/task/taskSlice";
import { handleRTKError } from "../utils/errorHandler";
import { useNavigate } from "react-router";

/**
 * Tasks Page Component
 *
 * Responsibilities:
 * - Manage page-level state (dialogs, selected task, task type)
 * - Handle API calls and mutations
 * - Coordinate between filter, list, and form components
 * - Handle loading and error states
 * - Manage task type selection menu
 *
 * Delegation:
 * - TasksList: Renders grid and pagination
 * - TaskCard: Renders individual task cards (memoized)
 * - TaskFilter: Handles filter UI
 * - CreateUpdateTask: Handles form UI (to be implemented)
 */

const Tasks = () => {
  const dispatch = useDispatch();
  const filters = useSelector(selectTaskFilters);
  const pagination = useSelector(selectTaskPagination);
  const navigate = useNavigate();

  // Dialog states
  const [filterOpen, setFilterOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedTaskType, setSelectedTaskType] = useState("");

  // Ref for filter handlers
  const filterHandlersRef = useRef(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [createMenuAnchor, setCreateMenuAnchor] = useState(null);

  // Build query params - properly filter out empty values
  const queryParams = useMemo(() => {
    const filteredFilters = Object.fromEntries(
      Object.entries(filters).filter(([key, v]) => {
        // Keep 'deleted' even if false (it's a valid filter value)
        if (key === "deleted") return true;
        // Filter out empty values
        return (
          v !== "" &&
          v !== null &&
          v !== undefined &&
          !(Array.isArray(v) && v.length === 0)
        );
      })
    );

    return {
      ...filteredFilters,
      page: pagination.page,
      limit: pagination.limit,
    };
  }, [filters, pagination]);

  // Fetch tasks data with error handling
  const { data, isLoading, isError, error, refetch, isFetching } =
    useGetTasksQuery(queryParams);

  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
  const [restoreTask, { isLoading: isRestoring }] = useRestoreTaskMutation();

  const tasks = data?.tasks || [];
  const totalTasks = data?.pagination?.totalCount || 0;
  const totalPages = data?.pagination?.totalPages || 1;
  const hasNext = data?.pagination?.hasNext || false;
  const hasPrev = data?.pagination?.hasPrev || false;

  // Memoized handlers to prevent unnecessary re-renders
  const handleFilterChange = useCallback(
    (field, value) => {
      // Filter out empty values before setting filters (same logic as queryParams)
      // Keep 'deleted' even if false (it's a valid filter value)
      const shouldSet =
        field === "deleted" ||
        (value !== "" &&
          value !== null &&
          value !== undefined &&
          !(Array.isArray(value) && value.length === 0));

      if (shouldSet) {
        dispatch(setFilters({ [field]: value }));
      } else {
        // Remove the filter if value is empty
        dispatch(setFilters({ [field]: null }));
      }
    },
    [dispatch]
  );

  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  const handlePaginationChange = useCallback(
    (_e, page) => {
      dispatch(setPage(page));
    },
    [dispatch]
  );

  // Retry handler for error state
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // CRUD handlers with optimization
  const handleCreateMenuOpen = useCallback((event) => {
    setCreateMenuAnchor(event.currentTarget);
  }, []);

  const handleCreateMenuClose = useCallback(() => {
    setCreateMenuAnchor(null);
  }, []);

  const handleCreateTask = useCallback((taskType) => {
    setSelectedTask(null);
    setSelectedTaskType(taskType);
    setCreateDialogOpen(true);
    setCreateMenuAnchor(null);
  }, []);

  const handleView = useCallback(
    (task) => {
      // Pass deleted flag in URL if task is deleted
      const isDeleted = task.isDeleted || task.deleted;
      if (isDeleted) {
        navigate(`/tasks/${task._id}?deleted=true`);
      } else {
        navigate(`/tasks/${task._id}`);
      }
    },
    [navigate]
  );

  const handleEdit = useCallback((task) => {
    setSelectedTask(task);
    setSelectedTaskType(task.taskType || task.__t);
    setEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback((task) => {
    setSelectedTask(task);
    setDeleteConfirmOpen(true);
  }, []);

  const handleRestore = useCallback((task) => {
    setSelectedTask(task);
    setRestoreConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    try {
      await deleteTask(selectedTask._id).unwrap();
      toast.success("Task deleted successfully");
      setDeleteConfirmOpen(false);
      setSelectedTask(null);
    } catch (error) {
      handleRTKError(error, "Failed to delete task");
    }
  }, [deleteTask, selectedTask]);

  const confirmRestore = useCallback(async () => {
    try {
      await restoreTask(selectedTask._id).unwrap();
      toast.success("Task restored successfully");
      setRestoreConfirmOpen(false);
      setSelectedTask(null);
    } catch (error) {
      handleRTKError(error, "Failed to restore task");
    }
  }, [restoreTask, selectedTask]);

  // Success handler for form submission
  const handleCreateSuccess = useCallback(() => {
    setCreateDialogOpen(false);
    setSelectedTaskType("");
    toast.success("Task created successfully");
  }, []);

  const handleUpdateSuccess = useCallback(() => {
    setEditDialogOpen(false);
    setSelectedTask(null);
    setSelectedTaskType("");
    toast.success("Task updated successfully");
  }, []);

  // Filter dialog handlers
  const handleApplyFilters = useCallback(() => {
    setFilterOpen(false);
  }, []);

  const handleClearFiltersFromDialog = useCallback(() => {
    handleClearFilters();
  }, [handleClearFilters]);

  // Count active filters for badge
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(
      (value) =>
        value !== "" &&
        value !== null &&
        value !== false &&
        !(Array.isArray(value) && value.length === 0)
    ).length;
  }, [filters]);

  // Task type options for create menu
  const taskTypeOptions = useMemo(
    () => [
      {
        type: "AssignedTask",
        label: "Assigned Task",
        icon: <AssignmentIcon />,
        description: "Task assigned to specific users",
      },
      {
        type: "ProjectTask",
        label: "Project Task",
        icon: <BusinessIcon />,
        description: "Task for external vendors",
      },
      {
        type: "RoutineTask",
        label: "Routine Task",
        icon: <InventoryIcon />,
        description: "Task with material usage",
      },
    ],
    []
  );

  // Show loading state on initial load
  if (isLoading && !data) {
    return <LoadingFallback message="Loading tasks..." height="100%" />;
  }

  // Show error state with retry option
  if (isError && !data) {
    return (
      <RouteError
        error={error}
        isError={isError}
        isLoading={isLoading}
        onRetry={handleRetry}
      />
    );
  }

  // console.log("tasks", tasks);
  return (
    <Box>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={1}
        mb={2}
      >
        <Typography variant="h5" fontWeight={600}>
          Tasks
        </Typography>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {/* Filter Button */}
          <Tooltip title="Filter">
            <IconButton
              onClick={() => setFilterOpen(true)}
              color="primary"
              sx={{ border: "none" }}
            >
              <Badge badgeContent={activeFiltersCount} color="error">
                <FilterListIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {activeFiltersCount > 0 && (
            <Button size="small" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          )}

          {/* Create Button */}
          <Button
            startIcon={<AddIcon />}
            endIcon={<ExpandMoreIcon />}
            onClick={handleCreateMenuOpen}
            size="small"
            sx={(theme) => ({
              bgcolor: (theme.vars || theme).palette.success.main,
            })}
          >
            Create Task
          </Button>
        </Box>
      </Stack>

      {/* Content */}
      {totalTasks === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No tasks found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {activeFiltersCount > 0
              ? "Try adjusting your filters to see more results."
              : "Get started by creating your first task."}
          </Typography>
          <Button
            startIcon={<AddIcon />}
            endIcon={<ExpandMoreIcon />}
            onClick={handleCreateMenuOpen}
            sx={(theme) => ({
              bgcolor: (theme.vars || theme).palette.success.main,
            })}
          >
            Create First Task
          </Button>
        </Paper>
      ) : (
        <TasksList
          tasks={tasks}
          pagination={{
            page: pagination.page,
            totalPages,
            hasNext,
            hasPrev,
          }}
          onPageChange={handlePaginationChange}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRestore={handleRestore}
          isFetching={isFetching}
        />
      )}

      {/* Create Task Type Menu */}
      <Menu
        anchorEl={createMenuAnchor}
        open={Boolean(createMenuAnchor)}
        onClose={handleCreateMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        {taskTypeOptions.map((option) => (
          <MenuItem
            key={option.type}
            onClick={() => handleCreateTask(option.type)}
            sx={{ minWidth: 250 }}
          >
            <ListItemIcon>{option.icon}</ListItemIcon>
            <ListItemText
              primary={option.label}
              secondary={option.description}
            />
          </MenuItem>
        ))}
      </Menu>

      {/* Filter Modal */}
      <MuiDialog
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Tasks"
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => filterHandlersRef.current?.clear()}>
              Clear All
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                filterHandlersRef.current?.apply();
                setFilterOpen(false);
              }}
            >
              Apply Filters
            </Button>
          </>
        }
      >
        <TaskFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          onApply={handleApplyFilters}
          onClear={handleClearFiltersFromDialog}
          filterHandlers={filterHandlersRef}
        />
      </MuiDialog>

      {/* Create Task Dialog */}
      <MuiDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title={`Create ${selectedTaskType?.replace("Task", "")} Task`}
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button type="submit" form="task-form" variant="contained">
              Create
            </Button>
          </>
        }
      >
        <CreateUpdateTask
          taskType={selectedTaskType}
          onSuccess={handleCreateSuccess}
        />
      </MuiDialog>

      {/* Edit Task Dialog */}
      <MuiDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        title={`Edit ${selectedTaskType?.replace("Task", "")} Task`}
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button type="submit" form="task-form" variant="contained">
              Update
            </Button>
          </>
        }
      >
        <RTKQueryErrorBoundary>
          <CreateUpdateTask task={selectedTask} onSuccess={handleUpdateSuccess} />
        </RTKQueryErrorBoundary>
      </MuiDialog>

      {/* Delete Confirmation */}
      <MuiDialogConfirm
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${selectedTask?.title}"? This action can be undone later.`}
        confirmText="Delete"
        severity="error"
        loading={isDeleting}
      />

      {/* Restore Confirmation */}
      <MuiDialogConfirm
        open={restoreConfirmOpen}
        onClose={() => setRestoreConfirmOpen(false)}
        onConfirm={confirmRestore}
        title="Restore Task"
        message={`Are you sure you want to restore "${selectedTask?.title}"?`}
        confirmText="Restore"
        severity="info"
        loading={isRestoring}
      />
    </Box>
  );
};

export default Tasks;
