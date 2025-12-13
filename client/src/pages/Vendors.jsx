// client/src/pages/Vendors.jsx
import { useCallback, useMemo, useState } from "react";
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
import { getVendorColumns } from "../components/columns/VendorColumns";
import VendorFilter from "../components/filters/VendorFilter";
import CreateUpdateVendor from "../components/forms/vendors/CreateUpdateVendor";
import {
  useGetVendorsQuery,
  useDeleteVendorMutation,
  useRestoreVendorMutation,
} from "../redux/features/vendor/vendorApi";
import {
  selectVendorFilters,
  selectVendorPagination,
  setFilters,
  clearFilters,
  setPage,
  setLimit,
  setSortBy,
} from "../redux/features/vendor/vendorSlice";
import { handleRTKError } from "../utils/errorHandler";

/**
 * Vendors Page Component
 *
 * ARCHITECTURE: MuiDataGrid (MANDATORY for Vendors resource)
 *
 * Responsibilities:
 * - Manage page-level state (dialogs, selected vendor)
 * - Handle API calls and mutations
 * - Coordinate between filter, grid, and form components
 * - Handle loading and error states
 * - Handle vendor deletion with reassignment option
 * - Use Redux for filters and pagination state
 *
 * Backend Alignment:
 * - Controller: backend/controllers/vendorControllers.js
 * - Validator: backend/middlewares/validators/vendorValidators.js
 */

const Vendors = () => {
  const dispatch = useDispatch();

  // Redux state for filters and pagination
  const filters = useSelector(selectVendorFilters);
  const pagination = useSelector(selectVendorPagination);

  // Local state for dialogs
  const [filterOpen, setFilterOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
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

  // Fetch vendors data
  const { data, isLoading, isError, error, refetch, isFetching } =
    useGetVendorsQuery(queryParams);

  const [deleteVendor, { isLoading: isDeleting }] = useDeleteVendorMutation();
  const [restoreVendor, { isLoading: isRestoring }] =
    useRestoreVendorMutation();

  const vendors = data?.vendors || [];
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
    setSelectedVendor(null);
    setCreateDialogOpen(true);
  }, []);

  const handleView = useCallback((vendor) => {
    // Navigate to vendor detail page (future implementation)
    console.log("View vendor:", vendor);
    toast.info("Vendor detail view coming soon!");
  }, []);

  const handleEdit = useCallback((vendor) => {
    setSelectedVendor(vendor);
    setEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback((vendor) => {
    setSelectedVendor(vendor);
    setDeleteConfirmOpen(true);
  }, []);

  const handleRestore = useCallback((vendor) => {
    setSelectedVendor(vendor);
    setRestoreConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    try {
      // Note: Backend requires reassignToVendorId if vendor has active project tasks
      // For now, we'll attempt deletion without reassignment
      // TODO: Implement reassignment dialog if vendor has active projects
      await deleteVendor({ vendorId: selectedVendor._id }).unwrap();
      toast.success("Vendor deleted successfully");
      setDeleteConfirmOpen(false);
      setSelectedVendor(null);
    } catch (error) {
      handleRTKError(error, "Failed to delete vendor");
    }
  }, [deleteVendor, selectedVendor]);

  const confirmRestore = useCallback(async () => {
    try {
      await restoreVendor(selectedVendor._id).unwrap();
      toast.success("Vendor restored successfully");
      setRestoreConfirmOpen(false);
      setSelectedVendor(null);
    } catch (error) {
      handleRTKError(error, "Failed to restore vendor");
    }
  }, [restoreVendor, selectedVendor]);

  const handleSuccess = useCallback(() => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setSelectedVendor(null);
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
      getVendorColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onRestore: handleRestore,
      }),
    [handleView, handleEdit, handleDelete, handleRestore]
  );

  // Show loading state on initial load
  if (isLoading && !data) {
    return <LoadingFallback message="Loading vendors..." height="100%" />;
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
          Vendors
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
            Add Vendor
          </Button>
        </Box>
      </Stack>

      {/* DataGrid */}
      <MuiDataGrid
        rows={vendors}
        columns={columns}
        loading={isLoading || isFetching}
        pagination={paginationData}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSortChange={handleSortChange}
        emptyMessage="No vendors found. Create your first vendor to get started."
        slots={{
          toolbar: CustomDataGridToolbar,
        }}
        slotProps={{
          toolbar: {
            fileName: "vendors-export",
            showExport: true,
            showFilters: true,
            showColumns: true,
            showQuickFilter: true,
          },
        }}
      />

      {/* Filter Modal */}
      <MuiDialog
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Vendors"
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
        <VendorFilter filters={filters} onFilterChange={handleFilterChange} />
      </MuiDialog>

      {/* Create Vendor Dialog */}
      <MuiDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title="Add New Vendor"
        maxWidth="sm"
      >
        <CreateUpdateVendor
          onSuccess={handleSuccess}
          onCancel={() => setCreateDialogOpen(false)}
        />
      </MuiDialog>

      {/* Edit Vendor Dialog */}
      <MuiDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        title="Edit Vendor"
        maxWidth="sm"
      >
        <CreateUpdateVendor
          vendor={selectedVendor}
          onSuccess={handleSuccess}
          onCancel={() => setEditDialogOpen(false)}
        />
      </MuiDialog>

      {/* Delete Confirmation */}
      <MuiDialogConfirm
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Vendor"
        message={`Are you sure you want to delete "${selectedVendor?.name}"? If this vendor has active project tasks, you'll need to reassign them first.`}
        confirmText="Delete"
        severity="error"
        loading={isDeleting}
      />

      {/* Restore Confirmation */}
      <MuiDialogConfirm
        open={restoreConfirmOpen}
        onClose={() => setRestoreConfirmOpen(false)}
        onConfirm={confirmRestore}
        title="Restore Vendor"
        message={`Are you sure you want to restore "${selectedVendor?.name}"?`}
        confirmText="Restore"
        severity="info"
        loading={isRestoring}
      />
    </Box>
  );
};

export default Vendors;
