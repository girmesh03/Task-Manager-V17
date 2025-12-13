// client/src/components/columns/UserColumns.jsx
import { Avatar, Chip, Box } from "@mui/material";
import dayjs from "dayjs";
import MuiActionColumn from "../common/MuiActionColumn";
import { USER_ROLES } from "../../utils/constants";

/**
 * Get User Column Definitions
 *
 * @param {Object} actions - Action handlers {onView, onEdit, onDelete, onRestore}
 * @returns {Array} Column definitions for MuiDataGrid
 */
export const getUserColumns = (actions = {}) => [
  {
    field: "profilePicture",
    headerName: "Avatar",
    width: 80,
    sortable: false,
    renderCell: (params) => (
      <Avatar
        src={params.row.profilePicture?.url || ""}
        alt={params.row.fullName}
        sx={{ width: 36, height: 36 }}
      >
        {params.row.firstName?.[0]}
        {params.row.lastName?.[0]}
      </Avatar>
    ),
  },
  {
    field: "fullName",
    headerName: "Name",
    flex: 1,
    minWidth: 180,
  },
  {
    field: "email",
    headerName: "Email",
    flex: 1,
    minWidth: 200,
  },
  {
    field: "role",
    headerName: "Role",
    width: 130,
    renderCell: (params) => (
      <Chip
        label={params.value}
        size="small"
        color={
          params.value === USER_ROLES.SUPER_ADMIN
            ? "error"
            : params.value === USER_ROLES.ADMIN
            ? "warning"
            : params.value === USER_ROLES.MANAGER
            ? "info"
            : "default"
        }
      />
    ),
  },
  {
    field: "department",
    headerName: "Department",
    flex: 1,
    minWidth: 150,
    valueGetter: (value, row) => row.department?.name || "N/A",
  },
  {
    field: "position",
    headerName: "Position",
    width: 150,
  },
  {
    field: "joinedAt",
    headerName: "Joined",
    width: 120,
    valueFormatter: (value) =>
      value ? formatDate(value) : "N/A",
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
