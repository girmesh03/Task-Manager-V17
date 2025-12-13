// client/src/components/cards/TaskCard.jsx
import { memo } from "react";
import PropTypes from "prop-types";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip,
  AvatarGroup,
  Avatar,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RestoreIcon from "@mui/icons-material/Restore";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import InventoryIcon from "@mui/icons-material/Inventory";
import dayjs from "dayjs";
import {
  formatDate,
  formatRelativeTime,
  isPast,
  utcToLocal,
} from "../../utils/dateUtils";
import { TASK_STATUS, TASK_PRIORITY } from "../../utils/constants";

/**
 * TaskCard Component - Memoized for performance
 *
 * Display task information in a card format with type-specific fields.
 * Memoized to prevent unnecessary re-renders when parent updates.
 *
 * @param {Object} props
 * @param {Object} props.task - Task object
 * @param {Function} props.onView - View task handler
 * @param {Function} props.onEdit - Edit task handler
 * @param {Function} props.onDelete - Delete task handler
 * @param {Function} [props.onRestore] - Restore task handler (if deleted)
 * @returns {JSX.Element}
 */
const TaskCard = ({ task, onView, onEdit, onDelete, onRestore }) => {
  const isDeleted = task.isDeleted || task.deleted;
  const taskType = task.taskType || task.__t;

  const getStatusColor = (status) => {
    const statusIndex = TASK_STATUS.indexOf(status);
    const colors = ["default", "info", "success", "warning"];
    return colors[statusIndex] || "default";
  };

  const getPriorityColor = (priority) => {
    const priorityIndex = TASK_PRIORITY.indexOf(priority);
    const colors = ["default", "info", "warning", "error"];
    return colors[priorityIndex] || "default";
  };

  const getTypeColor = (type) => {
    return type === "ProjectTask"
      ? "primary"
      : type === "AssignedTask"
      ? "secondary"
      : "default";
  };

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;

    const now = dayjs().startOf("day");
    const due = utcToLocal(dueDate).startOf("day");
    const diff = due.diff(now, "day");

    if (diff < 0) return `${Math.abs(diff)} days overdue`;
    if (diff === 0) return "Due today";
    if (diff === 1) return "Due tomorrow";
    return `${diff} days left`;
  };

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.2s",
        "&:hover": {
          boxShadow: 3,
          transform: "translateY(-4px)",
        },
        opacity: isDeleted ? 0.6 : 1,
      }}
    >
      <CardContent sx={{ flex: 1, pb: 1 }}>
        {/* Task Type Badge */}
        <Box sx={{ mb: 2 }}>
          <Chip
            label={taskType?.replace("Task", "") || "Task"}
            size="small"
            color={getTypeColor(taskType)}
          />
        </Box>

        {/* Title */}
        <Typography
          variant="h6"
          sx={{
            mb: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {task.title}
        </Typography>

        {/* Description */}
        {task.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {task.description}
          </Typography>
        )}

        {/* Status and Priority */}
        <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
          <Chip
            label={task.status}
            size="small"
            color={getStatusColor(task.status)}
          />
          <Chip
            label={task.priority}
            size="small"
            color={getPriorityColor(task.priority)}
          />
        </Box>

        {/* Type-specific Information */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {/* AssignedTask or ProjectTask - Due Date */}
          {(taskType === "AssignedTask" || taskType === "ProjectTask") &&
            task.dueDate && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CalendarTodayIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  {formatDate(task.dueDate)}
                </Typography>
                <Tooltip title={formatRelativeTime(task.dueDate)}>
                  <Chip
                    label={getDaysUntilDue(task.dueDate)}
                    size="small"
                    color={isPast(task.dueDate) ? "error" : "default"}
                    variant="outlined"
                  />
                </Tooltip>
              </Box>
            )}

          {/* RoutineTask - Date */}
          {taskType === "RoutineTask" && task.date && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CalendarTodayIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {formatDate(task.date)}
              </Typography>
            </Box>
          )}

          {/* AssignedTask - Assignees */}
          {taskType === "AssignedTask" &&
            task.assignees &&
            task.assignees.length > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PersonIcon fontSize="small" color="action" />
                <AvatarGroup max={3} sx={{ justifyContent: "flex-start" }}>
                  {task.assignees.map((assignee) => (
                    <Tooltip key={assignee._id} title={assignee.fullName}>
                      <Avatar
                        src={assignee.profilePicture?.url}
                        alt={assignee.fullName}
                        sx={{ width: 24, height: 24 }}
                      >
                        {assignee.firstName?.[0]}
                      </Avatar>
                    </Tooltip>
                  ))}
                </AvatarGroup>
              </Box>
            )}

          {/* ProjectTask - Vendor */}
          {taskType === "ProjectTask" && task.vendor && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <BusinessIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {task.vendor.name}
              </Typography>
            </Box>
          )}

          {/* RoutineTask - Materials Count */}
          {taskType === "RoutineTask" &&
            task.materials &&
            task.materials.length > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <InventoryIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  {task.materials.length} material
                  {task.materials.length !== 1 ? "s" : ""}
                </Typography>
              </Box>
            )}
        </Box>

        {/* Status */}
        {isDeleted && (
          <Chip label="Deleted" size="small" color="error" sx={{ mt: 2 }} />
        )}
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ justifyContent: "flex-end", pt: 0 }}>
        <Tooltip title="View">
          <IconButton size="small" onClick={() => onView(task)} color="primary">
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {!isDeleted && (
          <>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => onEdit(task)}
                color="primary"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => onDelete(task)}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
        {isDeleted && onRestore && (
          <Tooltip title="Restore">
            <IconButton
              size="small"
              onClick={() => onRestore(task)}
              color="success"
            >
              <RestoreIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
};

TaskCard.propTypes = {
  task: PropTypes.object.isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRestore: PropTypes.func,
};

// Memoize to prevent re-renders when props haven't changed
export default memo(TaskCard);
