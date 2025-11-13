// client/src/components/columns/VendorColumns.jsx
import { Chip } from "@mui/material";
import dayjs from "dayjs";
import MuiActionColumn from "../common/MuiActionColumn";

/**
 * Get Vendor Column Definitions
 * 
 * @param {Object} actions - Action handlers {onView, onEdit, onDelete, onRestore}
 * @returns {Array} Column definitions for MuiDataGrid
 */
export const getVendorColumns = (actions = {}) => [
  {
    field: "name",
    headerName: "Vendor Name",
    flex: 1,
    minWidth: 200,
  },
  {
    field: "email",
    headerName: "Email",
    flex: 1,
    minWidth: 200,
  },
  {
    field: "phone",
    headerName: "Phone",
    width: 150,
  },
  {
    field: "projectCount",
    headerName: "Projects",
    width: 100,
    align: "center",
    headerAlign: "center",
  },
  {
    field: "totalCost",
    headerName: "Total Cost",
    width: 130,
    align: "right",
    headerAlign: "right",
    valueFormatter: (value) => (value ? `$${value.toFixed(2)}` : "$0.00"),
  },
  {
    field: "createdBy",
    headerName: "Created By",
    width: 150,
    valueGetter: (value, row) => row.createdBy?.fullName || "N/A",
  },
  {
    field: "createdAt",
    headerName: "Created",
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
