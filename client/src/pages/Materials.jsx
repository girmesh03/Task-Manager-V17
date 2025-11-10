// client/src/pages/Materials.jsx
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  IconButton,
  Typography,
  Tooltip,
  Stack,
  Badge,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import { toast } from "react-toastify";
import { LoadingFallback } from "../components/common/MuiLoading";
import RouteError from "../components/common/RouteError";
import MuiDialog from "../components/common/MuiDialog";
import MuiDialogConfirm from "../components/common/MuiDialogConfirm";
import MuiDataGrid from "../components/common/MuiDataGrid";
import CustomDataGridToolbar from "../components/common/CustomDataGridToolbar";
import { getMaterialColumns } from "../components/columns/MaterialColumns";
import MaterialFilter from "../components/filters/MaterialFilter";
import CreateUpdateMaterial from "../components/forms/materials/CreateUpdateMaterial";
import {
  useGetMaterialsQuery,
  useDeleteMaterialMutation,
  useRestoreMaterialMutation,
} from "../redux/features/material/materialApi";
import {
  selectMaterialFilters,
  selectMaterialPagination,
  setFilters,
  clearFilters,
  setPage,
  setLimit,
  setSortBy,
} from "../redux/features/material/materialSlice";
import { handleRTKError } from "../utils/errorHandler";
import { useState } from "react";

/**
 * Materials Page Component
 *
 * ARCHITECTURE: MuiDataGrid (MANDATORY for Materials resource)
 *
 * Responsibilities:
 * - Manage page-level state (dialogs, selected material)
 * - Handle API calls and mutations
 * - Coordinate between filter, grid, and form components
 * - Handle loading and error states
 * - Use Redux for filters and pagination state
 *
 * Backend Alignment:
 * - Controller: backend/controllers/materialControllers.js
 * - Validator: backend/middlewares/validators/materialValidators.js
 */

const Materials = () => {
  const dispatch = useDispatch();

  // Redux state for filters and pagination
  const filters = useSelector(selectMaterialFilters);
  const pagination = useSelector(selectMaterialPagination);

  // Local state for dialogs
  const [filterOpen, setFilterOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);

  // Build query params (remove empty values)
  const queryParams = useMemo(
    () => ({
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([, v]) => v !== "" && v !== null && v !== false
        )
      ),
      ...pagination,
    }),
    [filters, pagination]
  );

  // Fetch materials data
  const { data, isLoading, isError, error, refetch, isFetching } =
    useGetMaterialsQuery(queryParams);

  const [deleteMaterial, { isLoading: isDeleting }] =
    useDeleteMaterialMutation();
  const [restoreMaterial, { isLoading: isRestoring }] =
    useRestoreMaterialMutation();

  const materials = data?.materials || [];
  const paginationData = data?.pagination || {};

  // Filter handlers
  const handleFilterChange = useCallback(
    (field, value) => {
      dispatch(setFilters({ [field]: value }));
    },
    [dispatch]
  );

  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  // Pagination handlers
  const handlePageChange = useCallback(
    (newPage) => {
      dispatch(setPage(newPage));
    },
    [dispatch]
  );

  const handlePageSizeChange = useCallback(
    (newPageSize) => {
      dispatch(setLimit(newPageSize));
    },
    [dispatch]
  );

  const handleSortChange = useCallback(
    ({ sortBy, sortOrder }) => {
      dispatch(setSortBy({ sortBy, sortOrder }));
    },
    [dispatch]
  );

  // Retry handler for error state
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // CRUD handlers
  const handleCreate = useCallback(() => {
    setSelectedMaterial(null);
    setCreateDialogOpen(true);
  }, []);

  const handleView = useCallback((material) => {
    // Navigate to material detail page (future implementation)
    console.log("View material:", material);
    toast.info("Material detail view coming soon!");
  }, []);

  const handleEdit = useCallback((material) => {
    setSelectedMaterial(material);
    setEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback((material) => {
    setSelectedMaterial(material);
    setDeleteConfirmOpen(true);
  }, []);

  const handleRestore = useCallback((material) => {
    setSelectedMaterial(material);
    setRestoreConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    try {
      await deleteMaterial(selectedMaterial._id).unwrap();
      toast.success("Material deleted successfully");
      setDeleteConfirmOpen(false);
      setSelectedMaterial(null);
    } catch (error) {
      handleRTKError(error, "Failed to delete material");
    }
  }, [deleteMaterial, selectedMaterial]);

  const confirmRestore = useCallback(async () => {
    try {
      await restoreMaterial(selectedMaterial._id).unwrap();
      toast.success("Material restored successfully");
      setRestoreConfirmOpen(false);
      setSelectedMaterial(null);
    } catch (error) {
      handleRTKError(error, "Failed to restore material");
    }
  }, [restoreMaterial, selectedMaterial]);

  const handleSuccess = useCallback(() => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setSelectedMaterial(null);
  }, []);

  // Count active filters for badge
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(
      (value) => value !== "" && value !== null && value !== false
    ).length;
  }, [filters]);

  // Column definitions with action handlers
  const columns = useMemo(
    () =>
      getMaterialColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onRestore: handleRestore,
      }),
    [handleView, handleEdit, handleDelete, handleRestore]
  );

  // Show loading state on initial load
  if (isLoading && !data) {
    return <LoadingFallback message="Loading materials..." height="100%" />;
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
          Materials
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
            Add Material
          </Button>
        </Box>
      </Stack>

      {/* DataGrid */}
      <MuiDataGrid
        rows={materials}
        columns={columns}
        loading={isLoading || isFetching}
        pagination={paginationData}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSortChange={handleSortChange}
        emptyMessage="No materials found. Create your first material to get started."
        // slots={{
        //   toolbar: CustomDataGridToolbar,
        // }}
        // slotProps={{
        //   toolbar: {
        //     fileName: "materials-export",
        //     showExport: true,
        //     showFilters: true,
        //     showColumns: true,
        //     showQuickFilter: true,
        //   },
        // }}
      />

      {/* Filter Modal */}
      <MuiDialog
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Materials"
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
        <MaterialFilter filters={filters} onFilterChange={handleFilterChange} />
      </MuiDialog>

      {/* Create Material Dialog */}
      <MuiDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title="Add New Material"
        maxWidth="sm"
      >
        <CreateUpdateMaterial
          onSuccess={handleSuccess}
          onCancel={() => setCreateDialogOpen(false)}
        />
      </MuiDialog>

      {/* Edit Material Dialog */}
      <MuiDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        title="Edit Material"
        maxWidth="sm"
      >
        <CreateUpdateMaterial
          material={selectedMaterial}
          onSuccess={handleSuccess}
          onCancel={() => setEditDialogOpen(false)}
        />
      </MuiDialog>

      {/* Delete Confirmation */}
      <MuiDialogConfirm
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Material"
        message={`Are you sure you want to delete "${selectedMaterial?.name}"? This will unlink it from all tasks and activities.`}
        confirmText="Delete"
        severity="error"
        loading={isDeleting}
      />

      {/* Restore Confirmation */}
      <MuiDialogConfirm
        open={restoreConfirmOpen}
        onClose={() => setRestoreConfirmOpen(false)}
        onConfirm={confirmRestore}
        title="Restore Material"
        message={`Are you sure you want to restore "${selectedMaterial?.name}"? This will relink it to all tasks and activities.`}
        confirmText="Restore"
        severity="info"
        loading={isRestoring}
      />
    </Box>
  );
};

export default Materials;
