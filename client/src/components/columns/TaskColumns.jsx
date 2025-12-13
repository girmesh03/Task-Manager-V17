// client/src/components/columns/TaskColumns.jsx
import { Chip, Box, AvatarGroup, Avatar, Tooltip } from "@mui/material";
import dayjs from "dayjs";
import MuiActionColumn from "../common/MuiActionColumn";
import { TASK_STATUS, TASK_PRIORITY } from "../../utils/constants";

/**
 * Get Task Column Definitions
 * 
 * @param {Object} actions - Action handlers {onView, onEdit, onDelete, onRestore}
 * @returns {Array} Column definitions for MuiDataGrid
 */
export const getTaskColumns = (actions = {}) => [
  {
    field: "taskType",
    headerName: "Type",
    width: 130,
    renderCell: (params) => (
      <Chip
        label={params.value?.replace("Task", "")}
        size="small"
        color={
          params.value === "ProjectTask"
            ? "primary"
            : params.value === "AssignedTask"
            ? "secondary"
            : "default"
        }
      />
    ),
  },
  {
    field: "title",
    headerName: "Title",
    flex: 1,
    minWidth: 200,
  },
  {
    field: "status",
    headerName: "Status",
    width: 130,
    renderCell: (params) => {
      const statusIndex = TASK_STATUS.indexOf(params.value);
      const colors = ["default", "info", "success", "warning"];
      return (
        <Chip
          label={params.value}
          size="small"
          color={colors[statusIndex] || "default"}
        />
      );
    },
  },
  {
    field: "priority",
    headerName: "Priority",
    width: 110,
    renderCell: (params) => {
      const priorityIndex = TASK_PRIORITY.indexOf(params.value);
      const colors = ["default", "info", "warning", "error"];
      return (
        <Chip
          label={params.value}
          size="small"
          color={colors[priorityIndex] || "default"}
        />
      );
    },
  },
  {
    field: "assignees",
    headerName: "Assignees",
    width: 130,
    sortable: false,
    renderCell: (params) => {
      if (!params.value || params.value.length === 0) return "N/A";
      return (
        <AvatarGroup max={3} sx={{ justifyContent: "flex-start" }}>
          {params.value.map((assignee) => (
            <Tooltip key={assignee._id} title={assignee.fullName}>
              <Avatar
                src={assignee.profilePicture?.url}
                alt={assignee.fullName}
                sx={{ width: 28, height: 28 }}
              >
                {assignee.firstName?.[0]}
              </Avatar>
            </Tooltip>
          ))}
        </AvatarGroup>
      );
    },
  },
  {
     field: "dueDate",
     headerName: "Due Date",
     width: 120,
     valueFormatter: (value) => (value ? formatDate(value) : "N/A"),
   },
   {
     field: "date",
     headerName: "Date",
     width: 120,
     valueFormatter: (value) => (value ? formatDate(value) : "N/A"),
   },
  {
    field: "department",
    headerName: "Department",
    width: 150,
    valueGetter: (value, row) => row.department?.name || "N/A",
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
