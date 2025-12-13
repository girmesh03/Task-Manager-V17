// client/src/components/columns/DepartmentColumns.jsx
import { Chip } from "@mui/material";
import dayjs from "dayjs";
import MuiActionColumn from "../common/MuiActionColumn";

/**
 * Get Department Column Definitions
 * 
 * @param {Object} actions - Action handlers {onView, onEdit, onDelete, onRestore}
 * @returns {Array} Column definitions for MuiDataGrid
 */
export const getDepartmentColumns = (actions = {}) => [
  {
    field: "name",
    headerName: "Department Name",
    flex: 1,
    minWidth: 200,
  },
  {
    field: "description",
    headerName: "Description",
    flex: 1,
    minWidth: 250,
  },
  {
    field: "userCount",
    headerName: "Users",
    width: 100,
    align: "center",
    headerAlign: "center",
  },
  {
    field: "taskCount",
    headerName: "Tasks",
    width: 100,
    align: "center",
    headerAlign: "center",
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
