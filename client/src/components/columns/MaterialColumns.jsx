// client/src/components/columns/MaterialColumns.jsx
import { Chip } from "@mui/material";
import dayjs from "dayjs";
import MuiActionColumn from "../common/MuiActionColumn";

/**
 * Get Material Column Definitions
 * 
 * @param {Object} actions - Action handlers {onView, onEdit, onDelete, onRestore}
 * @returns {Array} Column definitions for MuiDataGrid
 */
export const getMaterialColumns = (actions = {}) => [
  {
    field: "name",
    headerName: "Material Name",
    flex: 1,
    minWidth: 180,
  },
  {
    field: "category",
    headerName: "Category",
    width: 140,
    renderCell: (params) => (
      <Chip label={params.value} size="small" color="primary" variant="outlined" />
    ),
  },
  {
    field: "unit",
    headerName: "Unit",
    width: 100,
  },
  {
    field: "price",
    headerName: "Price",
    width: 120,
    align: "right",
    headerAlign: "right",
    valueFormatter: (value) => (value ? `$${value.toFixed(2)}` : "N/A"),
  },
  {
    field: "department",
    headerName: "Department",
    flex: 1,
    minWidth: 150,
    valueGetter: (value, row) => row.department?.name || "N/A",
  },
  {
    field: "addedBy",
    headerName: "Added By",
    width: 150,
    valueGetter: (value, row) => row.addedBy?.fullName || "N/A",
  },
  {
    field: "createdAt",
    headerName: "Added",
    width: 120,
    valueFormatter: (value) => (value ? formatDate(value) : "N/A"),
  },
  {
    field: "isDeleted",
    headerName: "Status",
    width: 100,
    renderCell: (params) => (
      <Chip
        label={params.value ? "Deleted" : "Active"}
        size="small"
        color={params.value ? "error" : "success"}
        variant="outlined"
      />
    ),
  },
  {
    field: "actions",
    headerName: "Actions",
    width: 150,
    sortable: false,
    renderCell: (params) => (
      <MuiActionColumn
        row={params.row}
        onView={actions.onView}
        onEdit={actions.onEdit}
        onDelete={actions.onDelete}
        onRestore={actions.onRestore}
      />
    ),
  },
];
