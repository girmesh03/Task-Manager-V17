// client/src/pages/Users.jsx
import { useState, useCallback, useMemo } from "react";
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import { toast } from "react-toastify";
import { LoadingFallback } from "../components/common/MuiLoading";
import RouteError from "../components/common/RouteError";
import MuiDialog from "../components/common/MuiDialog";
import MuiDialogConfirm from "../components/common/MuiDialogConfirm";
import UsersList from "../components/lists/UsersList";
import CreateUpdateUser from "../components/forms/users/CreateUpdateUser";
import UserFilter from "../components/filters/UserFilter";
import {
  useGetUsersQuery,
  useDeleteUserMutation,
  useRestoreUserMutation,
} from "../redux/features/user/userApi";
import {
  selectUserFilters,
  selectUserPagination,
  setFilters,
  clearFilters,
  setPage,
} from "../redux/features/user/userSlice";
import { handleRTKError } from "../utils/errorHandler";

/**
 * Users Page Component
 *
 * Responsibilities:
 * - Manage page-level state (dialogs, selected user)
 * - Handle API calls and mutations
 * - Coordinate between filter, list, and form components
 * - Handle loading and error states
 *
 * Delegation:
 * - UsersList: Renders grid and pagination
 * - UserCard: Renders individual user cards (memoized)
 * - UserFilter: Handles filter UI
 * - CreateUpdateUser: Handles form UI
 */

const Users = () => {
  const dispatch = useDispatch();
  const filters = useSelector(selectUserFilters);
  const pagination = useSelector(selectUserPagination);

  // Dialog states
  const [filterOpen, setFilterOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);

  // Build query params
  const queryParams = useMemo(
    () => ({
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([, v]) =>
            v !== "" &&
            v !== null &&
            v !== false &&
            !(Array.isArray(v) && v.length === 0)
        )
      ),
      ...pagination,
    }),
    [filters, pagination]
  );

  // Fetch users data with error handling
  const { data, isLoading, isError, error, refetch, isFetching } =
    useGetUsersQuery(queryParams);

  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [restoreUser, { isLoading: isRestoring }] = useRestoreUserMutation();

  const users = data?.users || [];
  const totalUsers = data?.pagination?.totalCount || 0;
  const totalPages = data?.pagination?.totalPages || 1;
  const hasNext = data?.pagination?.hasNext || false;
  const hasPrev = data?.pagination?.hasPrev || false;

  // Memoized handlers to prevent unnecessary re-renders
  const handleFilterChange = useCallback(
    (field, value) => {
      dispatch(setFilters({ [field]: value }));
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
  const handleCreate = useCallback(() => {
    setSelectedUser(null);
    setCreateDialogOpen(true);
  }, []);

  const handleView = useCallback((user) => {
    // Navigate to user detail page (to be implemented in Phase 12)
    console.log("View user:", user);
    toast.info("User detail page coming soon!");
  }, []);

  const handleEdit = useCallback((user) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback((user) => {
    setSelectedUser(user);
    setDeleteConfirmOpen(true);
  }, []);

  const handleRestore = useCallback((user) => {
    setSelectedUser(user);
    setRestoreConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    try {
      await deleteUser(selectedUser._id).unwrap();
      toast.success("User deleted successfully");
      setDeleteConfirmOpen(false);
      setSelectedUser(null);
    } catch (error) {
      handleRTKError(error, "Failed to delete user");
    }
  }, [deleteUser, selectedUser]);

  const confirmRestore = useCallback(async () => {
    try {
      await restoreUser(selectedUser._id).unwrap();
      toast.success("User restored successfully");
      setRestoreConfirmOpen(false);
      setSelectedUser(null);
    } catch (error) {
      handleRTKError(error, "Failed to restore user");
    }
  }, [restoreUser, selectedUser]);

  const handleSuccess = useCallback(() => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setSelectedUser(null);
  }, []);

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

  // Show loading state on initial load
  if (isLoading && !data) {
    return <LoadingFallback message="Loading users..." height="100%" />;
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

  return (
    <>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={1}
        mb={2}
      >
        <Typography variant="h5" fontWeight={600}>
          Users
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
            onClick={handleCreate}
            size="small"
            sx={(theme) => ({
              bgcolor: (theme.vars || theme).palette.success.main,
            })}
          >
            Create User
          </Button>
        </Box>
      </Stack>

      {/* Content */}
      {totalUsers === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No users found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {activeFiltersCount > 0
              ? "Try adjusting your filters to see more results."
              : "Get started by creating your first user."}
          </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={handleCreate}
            sx={(theme) => ({
              bgcolor: (theme.vars || theme).palette.success.main,
            })}
          >
            Create First User
          </Button>
        </Paper>
      ) : (
        <UsersList
          users={users}
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

      {/* Filter Modal */}
      <MuiDialog
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Users"
        maxWidth="sm"
        actions={
          <>
            <Button onClick={handleClearFilters}>Clear All</Button>
            <Button variant="contained" onClick={() => setFilterOpen(false)}>
              Apply
            </Button>
          </>
        }
      >
        <UserFilter filters={filters} onFilterChange={handleFilterChange} />
      </MuiDialog>

      {/* Create User Dialog */}
      <MuiDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title="Create User"
        maxWidth="sm"
      >
        <CreateUpdateUser
          onSuccess={handleSuccess}
          onCancel={() => setCreateDialogOpen(false)}
        />
      </MuiDialog>

      {/* Edit User Dialog */}
      <MuiDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        title="Edit User"
        maxWidth="sm"
      >
        <CreateUpdateUser
          user={selectedUser}
          onSuccess={handleSuccess}
          onCancel={() => setEditDialogOpen(false)}
        />
      </MuiDialog>

      {/* Delete Confirmation */}
      <MuiDialogConfirm
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${selectedUser?.fullName}"? This action can be undone later.`}
        confirmText="Delete"
        severity="error"
        loading={isDeleting}
      />

      {/* Restore Confirmation */}
      <MuiDialogConfirm
        open={restoreConfirmOpen}
        onClose={() => setRestoreConfirmOpen(false)}
        onConfirm={confirmRestore}
        title="Restore User"
        message={`Are you sure you want to restore "${selectedUser?.fullName}"?`}
        confirmText="Restore"
        severity="info"
        loading={isRestoring}
      />
    </>
  );
};

export default Users;
