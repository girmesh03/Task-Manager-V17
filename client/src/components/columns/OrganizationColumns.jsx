// client/src/components/columns/OrganizationColumns.jsx
import { Avatar, Chip } from "@mui/material";
import dayjs from "dayjs";
import MuiActionColumn from "../common/MuiActionColumn";

/**
 * Get Organization Column Definitions
 * 
 * @param {Object} actions - Action handlers {onView, onEdit, onDelete, onRestore}
 * @returns {Array} Column definitions for MuiDataGrid
 */
export const getOrganizationColumns = (actions = {}) => [
  {
    field: "logoUrl",
    headerName: "Logo",
    width: 80,
    sortable: false,
    renderCell: (params) => (
      <Avatar
        src={params.row.logoUrl?.url || ""}
        alt={params.row.name}
        sx={{ width: 36, height: 36 }}
      >
        {params.row.name?.[0]}
      </Avatar>
    ),
  },
  {
    field: "name",
    headerName: "Organization Name",
    flex: 1,
    minWidth: 200,
  },
  {
    field: "industry",
    headerName: "Industry",
    width: 150,
    renderCell: (params) => (
      <Chip label={params.value} size="small" color="primary" variant="outlined" />
    ),
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
    field: "departmentCount",
    headerName: "Departments",
    width: 120,
    align: "center",
    headerAlign: "center",
  },
  {
    field: "userCount",
    headerName: "Users",
    width: 100,
    align: "center",
    headerAlign: "center",
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
