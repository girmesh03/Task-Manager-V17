// client/src/components/common/MuiDataGrid.jsx
import PropTypes from "prop-types";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Typography, Paper } from "@mui/material";
import { LoadingFallback } from "./MuiLoading";
import { PAGINATION } from "../../utils/constants";

/**
 * MuiDataGrid Component
 *
 * Reusable data grid wrapper around MUI X DataGrid v7/v8 with consistent styling,
 * server-side pagination, sorting, and empty state handling.
 *
 * Features:
 * - Server-side pagination (converts between 0-based MUI and 1-based backend)
 * - Server-side sorting with sortBy and sortOrder
 * - Automatic empty state with custom message
 * - Loading overlay with LoadingFallback component
 * - Consistent styling across all data grids
 * - Page size options from PAGINATION.PAGE_SIZE_OPTIONS constant
 * - Row selection support (optional)
 * - Automatic row ID extraction from _id or id field
 * - Compact density by default for better space utilization
 * - Alternating row colors (even/odd) for better readability
 * - Custom toolbar support via slots
 * - Fully customizable via MUI DataGrid slots and slotProps
 * - Column resizing disabled by default for consistent layout
 * - Persistent row selection across data refreshes
 *
 * @param {Object} props
 * @param {Array} props.rows - Data rows
 * @param {Array} props.columns - Column definitions
 * @param {boolean} props.loading - Loading state
 * @param {Object} props.pagination - Pagination object {page, limit, totalPages, totalCount}
 * @param {Function} props.onPageChange - Page change handler
 * @param {Function} props.onPageSizeChange - Page size change handler
 * @param {Function} [props.onSortChange] - Sort change handler
 * @param {string} [props.emptyMessage] - Custom empty state message
 * @param {boolean} [props.checkboxSelection] - Enable row selection
 * @param {Function} [props.onSelectionChange] - Selection change handler
 * @param {string} [props.density] - Grid density (compact/standard/comfortable)
 * @param {Function} [props.getRowId] - Custom row ID getter
 * @param {Function} [props.getRowClassName] - Custom row class name getter
 * @param {boolean} [props.disableColumnResize] - Disable column resizing
 * @param {boolean} [props.keepNonExistentRowsSelected] - Keep selection on data refresh
 * @param {Object} [props.slots] - Custom slots (e.g., toolbar)
 * @param {Object} [props.slotProps] - Custom slot props
 * @param {Object} [props.sx] - Custom styles
 * @returns {JSX.Element}
 */
const MuiDataGrid = ({
  rows = [],
  columns = [],
  loading = false,
  pagination = {},
  onPageChange,
  onPageSizeChange,
  onSortChange,
  emptyMessage = "No data available",
  checkboxSelection = false,
  onSelectionChange,
  density = "compact",
  getRowId,
  getRowClassName,
  disableColumnResize = true,
  keepNonExistentRowsSelected = true,
  slots = {},
  slotProps = {},
  sx = {},
  ...muiProps
}) => {
  const {
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    totalCount = 0,
  } = pagination;

  const handlePageChange = (newPage) => {
    if (onPageChange) {
      onPageChange(newPage + 1); // MUI uses 0-based, backend uses 1-based
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    if (onPageSizeChange) {
      onPageSizeChange(newPageSize);
    }
  };

  const handleSortModelChange = (sortModel) => {
    if (onSortChange && sortModel.length > 0) {
      const { field, sort } = sortModel[0];
      onSortChange({ sortBy: field, sortOrder: sort });
    }
  };

  // Empty state
  if (!loading && rows.length === 0) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 4,
          textAlign: "center",
          minHeight: 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {emptyMessage}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No records found
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Default row ID getter
  const defaultGetRowId = (row) => row._id || row.id;

  // Default row class name getter for alternating colors
  const defaultGetRowClassName = (params) =>
    params.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd";

  return (
    <Paper variant="outlined" sx={{ height: 600, width: "100%" }}>
      <DataGrid
        // Row configuration
        rows={rows}
        columns={columns}
        getRowId={getRowId || defaultGetRowId}
        getRowClassName={getRowClassName || defaultGetRowClassName}
        rowCount={totalCount}
        // Loading state
        loading={loading}
        // Pagination configuration
        paginationMode="server"
        paginationModel={{
          page: page - 1, // Convert to 0-based for MUI
          pageSize: limit,
        }}
        onPaginationModelChange={(model) => {
          handlePageChange(model.page);
          handlePageSizeChange(model.pageSize);
        }}
        pageSizeOptions={PAGINATION.PAGE_SIZE_OPTIONS}
        // Sorting configuration
        sortingMode="server"
        onSortModelChange={handleSortModelChange}
        // Selection configuration
        checkboxSelection={checkboxSelection}
        onRowSelectionModelChange={onSelectionChange}
        disableRowSelectionOnClick
        keepNonExistentRowsSelected={keepNonExistentRowsSelected}
        // Column configuration
        disableColumnResize={disableColumnResize}
        // Density
        density={density}
        // Custom props passed through
        {...muiProps}
        // Slots for custom components
        slots={{
          loadingOverlay: LoadingFallback,
          ...slots,
        }}
        showToolbar
        // Slot props for customization
        slotProps={{
          ...slotProps,
          filterPanel: {
            filterFormProps: {
              logicOperatorInputProps: {
                variant: "outlined",
                size: "small",
              },
              columnInputProps: {
                variant: "outlined",
                size: "small",
                sx: { mt: "auto" },
              },
              operatorInputProps: {
                variant: "outlined",
                size: "small",
                sx: { mt: "auto" },
              },
              valueInputProps: {
                InputComponentProps: {
                  variant: "outlined",
                  size: "small",
                },
              },
            },
            ...slotProps?.filterPanel,
          },
        }}
        // Styling
        sx={{
          border: "none",
          "& .MuiDataGrid-cell:focus": { outline: "none" },
          "& .MuiDataGrid-cell:focus-within": { outline: "none" },
          "& .MuiDataGrid-row:hover": { backgroundColor: "action.hover" },
          // Alternating row colors
          "& .MuiDataGrid-row.even": {
            backgroundColor: "rgba(0, 0, 0, 0.02)",
          },
          "& .MuiDataGrid-row.odd": {
            backgroundColor: "transparent",
          },
          // Dark mode support
          '[data-mui-color-scheme="dark"] & .MuiDataGrid-row.even': {
            backgroundColor: "rgba(255, 255, 255, 0.02)",
          },
          ...sx,
        }}
      />
    </Paper>
  );
};

MuiDataGrid.propTypes = {
  rows: PropTypes.array.isRequired,
  columns: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  pagination: PropTypes.shape({
    page: PropTypes.number,
    limit: PropTypes.number,
    totalPages: PropTypes.number,
    totalCount: PropTypes.number,
  }),
  onPageChange: PropTypes.func,
  onPageSizeChange: PropTypes.func,
  onSortChange: PropTypes.func,
  emptyMessage: PropTypes.string,
  checkboxSelection: PropTypes.bool,
  onSelectionChange: PropTypes.func,
  density: PropTypes.oneOf(["compact", "standard", "comfortable"]),
  getRowId: PropTypes.func,
  getRowClassName: PropTypes.func,
  disableColumnResize: PropTypes.bool,
  keepNonExistentRowsSelected: PropTypes.bool,
  slots: PropTypes.object,
  slotProps: PropTypes.object,
  sx: PropTypes.object,
};

export default MuiDataGrid;
