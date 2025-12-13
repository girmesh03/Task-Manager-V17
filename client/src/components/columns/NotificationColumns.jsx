// client/src/components/columns/NotificationColumns.jsx
import { Chip, Box, Typography } from "@mui/material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import MuiActionColumn from "../common/MuiActionColumn";

dayjs.extend(relativeTime);

/**
 * Get Notification Column Definitions
 * 
 * @param {Object} actions - Action handlers {onView, onEdit, onDelete, onRestore}
 * @returns {Array} Column definitions for MuiDataGrid
 */
export const getNotificationColumns = (actions = {}) => [
  {
    field: "type",
    headerName: "Type",
    width: 120,
    renderCell: (params) => {
      const typeColors = {
        Created: "success",
        Updated: "info",
        Deleted: "error",
        Restored: "warning",
        Mention: "secondary",
        Welcome: "primary",
        Announcement: "default",
      };
      return (
        <Chip
          label={params.value}
          size="small"
          color={typeColors[params.value] || "default"}
        />
      );
    },
  },
  {
    field: "title",
    headerName: "Title",
    flex: 1,
    minWidth: 200,
  },
  {
    field: "message",
    headerName: "Message",
    flex: 2,
    minWidth: 300,
    renderCell: (params) => (
      <Typography
        variant="body2"
        sx={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {params.value}
      </Typography>
    ),
  },
  {
    field: "isRead",
    headerName: "Read",
    width: 100,
    renderCell: (params) => (
      <Chip
        label={params.value ? "Read" : "Unread"}
        size="small"
        color={params.value ? "default" : "primary"}
        variant={params.value ? "outlined" : "filled"}
      />
    ),
  },
  {
    field: "createdAt",
    headerName: "Time",
    width: 150,
    valueFormatter: (value) => (value ? formatRelativeTime(value) : "N/A"),
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
        onDelete={actions.onDelete}
        hideEdit
        hideRestore
      />
    ),
  },
];
