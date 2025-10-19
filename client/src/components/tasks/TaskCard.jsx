// client/src/components/tasks/TaskCard.jsx
import { useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  IconButton,
  Avatar,
  AvatarGroup,
  Tooltip,
  Divider,
  Badge,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  AttachFile as AttachFileIcon,
  CalendarToday as CalendarIcon,
  AccountCircle as AccountCircleIcon,
} from "@mui/icons-material";

const TaskCard = ({ task, onEdit, onDelete }) => {
  const navigate = useNavigate();

  const getPriorityColor = (priority) => {
    const colors = {
      Low: "success",
      Medium: "warning",
      High: "error",
    };
    return colors[priority] || "default";
  };

  const getStatusColor = (status) => {
    const colors = {
      "to do": "default",
      "in progress": "info",
      completed: "success",
      cancelled: "error",
      pending: "default",
    };
    return colors[status?.toLowerCase()] || "default";
  };

  const getTaskTypeColor = (taskType) => {
    const colors = {
      ProjectTask: "primary",
      AssignedTask: "info",
      RoutineTask: "secondary",
    };
    return colors[taskType] || "default";
  };

  const getTaskTypeLabel = (taskType) => {
    const labels = {
      ProjectTask: "Project",
      AssignedTask: "Assigned",
      RoutineTask: "Routine",
    };
    return labels[taskType] || "Task";
  };

  const handleView = () => {
    navigate(`/tasks/${task._id}`);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit?.(task);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(task);
  };

  // Get assignees/watchers for avatar group
  const getAvatarUsers = () => {
    const users = [];

    // For AssignedTask, show assignees
    if (task.taskType === "AssignedTask" && task.assignees?.length > 0) {
      users.push(...task.assignees);
    }

    // Add watchers if available
    if (task.watchers?.length > 0) {
      users.push(...task.watchers);
    }

    // Remove duplicates by _id
    const uniqueUsers = users.filter(
      (user, index, self) => index === self.findIndex((u) => u._id === user._id)
    );

    return uniqueUsers;
  };

  const avatarUsers = getAvatarUsers();
  const attachmentCount = task.attachments?.length || 0;
  const hasDate = task.dueDate || task.date;

  return (
    <Card
      sx={{
        // height: "100%",
        // display: "flex",
        // flexDirection: "column",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        overflow: "visible",
        "&:hover": {
          transform: "translateY(-8px)",
          boxShadow: (theme) =>
            `0 12px 24px ${
              theme.palette.mode === "dark"
                ? "rgba(0,0,0,0.4)"
                : "rgba(0,0,0,0.15)"
            }`,
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          bgcolor: (theme) => {
            const color = getTaskTypeColor(task.taskType);
            return theme.palette[color]?.main || theme.palette.grey[400];
          },
          borderRadius: "8px 8px 0 0",
        },
      }}
      onClick={handleView}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Chip
            label={getTaskTypeLabel(task.taskType)}
            size="small"
            color={getTaskTypeColor(task.taskType)}
            sx={{
              fontWeight: 600,
              textTransform: "uppercase",
              fontSize: "0.7rem",
            }}
          />
          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
            {attachmentCount > 0 && (
              <Tooltip
                title={`${attachmentCount} attachment${
                  attachmentCount > 1 ? "s" : ""
                }`}
              >
                <Badge badgeContent={attachmentCount} color="primary" max={99}>
                  <AttachFileIcon
                    sx={{ fontSize: 18, color: "text.secondary" }}
                  />
                </Badge>
              </Tooltip>
            )}
          </Box>
        </Box>

        <Typography
          variant="h6"
          component="h3"
          gutterBottom
          sx={{
            fontWeight: 600,
            fontSize: "1.1rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            minHeight: "2.6rem",
            mb: 1.5,
          }}
        >
          {task.title}
        </Typography>

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
            minHeight: "2.5rem",
            lineHeight: 1.6,
          }}
        >
          {task.description || "No description provided"}
        </Typography>

        <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
          <Chip
            label={task.status || "Pending"}
            size="small"
            color={getStatusColor(task.status)}
            sx={{ textTransform: "capitalize", fontWeight: 500 }}
          />
          <Chip
            label={task.priority || "Medium"}
            size="small"
            color={getPriorityColor(task.priority)}
            variant="outlined"
            sx={{ textTransform: "capitalize", fontWeight: 500 }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
            {task.createdBy && (
              <Tooltip
                title={`Created by: ${task.createdBy.firstName} ${task.createdBy.lastName}`}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <AccountCircleIcon
                    sx={{ fontSize: 16, color: "text.secondary" }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "120px",
                    }}
                  >
                    {task.createdBy.firstName} {task.createdBy.lastName}
                  </Typography>
                </Box>
              </Tooltip>
            )}
          </Box>

          {avatarUsers.length > 0 && (
            <AvatarGroup
              max={4}
              sx={{
                "& .MuiAvatar-root": {
                  width: 28,
                  height: 28,
                  fontSize: "0.75rem",
                  border: "2px solid",
                  borderColor: "background.paper",
                },
              }}
            >
              {avatarUsers.map((user) => (
                <Tooltip
                  key={user._id}
                  title={`${user.firstName} ${user.lastName}`}
                >
                  <Avatar
                    alt={`${user.firstName} ${user.lastName}`}
                    sx={{ bgcolor: "primary.main" }}
                  >
                    {user.firstName?.charAt(0).toUpperCase()}
                  </Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
          )}
        </Box>

        {hasDate && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              mt: 1.5,
              pt: 1.5,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <CalendarIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {task.dueDate
                ? `Due: ${new Date(task.dueDate).toLocaleDateString()}`
                : task.date
                ? `Date: ${new Date(task.date).toLocaleDateString()}`
                : ""}
            </Typography>
          </Box>
        )}
      </CardContent>

      <CardActions
        sx={{
          justifyContent: "flex-end",
          gap: 0.5,
        }}
      >
        <Tooltip title="View Details">
          <IconButton
            size="small"
            color="info"
            onClick={handleView}
            sx={{
              "&:hover": {
                bgcolor: "info.lighter",
              },
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit Task">
          <IconButton
            size="small"
            color="primary"
            onClick={handleEdit}
            sx={{
              "&:hover": {
                bgcolor: "primary.lighter",
              },
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete Task">
          <IconButton
            size="small"
            color="error"
            onClick={handleDelete}
            sx={{
              "&:hover": {
                bgcolor: "error.lighter",
              },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default TaskCard;
