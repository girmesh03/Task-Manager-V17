// client/src/pages/TaskDetail.jsx
import { useParams, useNavigate } from "react-router";
import {
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  AvatarGroup,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachFile as AttachFileIcon,
  CalendarToday as CalendarIcon,
  AccountCircle as AccountCircleIcon,
} from "@mui/icons-material";
import { useGetTaskByIdQuery } from "../redux/features/tasks/tasksApi";

const TaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetTaskByIdQuery(taskId);

  const task = data?.task;
  const activities = data?.activities || [];
  const comments = data?.comments || [];

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

  const handleBack = () => {
    navigate("/tasks");
  };

  const handleEdit = () => {
    console.log("Edit task:", task);
    // TODO: Open edit dialog/modal
  };

  const handleDelete = () => {
    console.log("Delete task:", task);
    // TODO: Show confirmation dialog
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !task) {
    return (
      <Box sx={{ py: 4, px: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 3 }}
        >
          Back to Tasks
        </Button>
        <Typography color="error">
          {error?.message || "Task not found"}
        </Typography>
      </Box>
    );
  }

  const getAvatarUsers = () => {
    const users = [];
    if (task.taskType === "AssignedTask" && task.assignees?.length > 0) {
      users.push(...task.assignees);
    }
    if (task.watchers?.length > 0) {
      users.push(...task.watchers);
    }
    const uniqueUsers = users.filter(
      (user, index, self) => index === self.findIndex((u) => u._id === user._id)
    );
    return uniqueUsers;
  };

  const avatarUsers = getAvatarUsers();
  const attachmentCount = task.attachments?.length || 0;

  return (
    <Box sx={{ py: 4, px: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          variant="outlined"
        >
          Back to Tasks
        </Button>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Edit Task">
            <IconButton color="primary" onClick={handleEdit}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Task">
            <IconButton color="error" onClick={handleDelete}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <Chip
            label={getTaskTypeLabel(task.taskType)}
            color={getTaskTypeColor(task.taskType)}
            sx={{ fontWeight: 600 }}
          />
          <Chip
            label={task.status || "Pending"}
            color={getStatusColor(task.status)}
            sx={{ textTransform: "capitalize" }}
          />
          <Chip
            label={task.priority || "Medium"}
            color={getPriorityColor(task.priority)}
            variant="outlined"
            sx={{ textTransform: "capitalize" }}
          />
          {attachmentCount > 0 && (
            <Chip
              icon={<AttachFileIcon />}
              label={`${attachmentCount} attachment${
                attachmentCount > 1 ? "s" : ""
              }`}
              variant="outlined"
            />
          )}
        </Box>

        <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
          {task.title}
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 3, lineHeight: 1.8 }}
        >
          {task.description || "No description provided"}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {task.createdBy && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AccountCircleIcon sx={{ color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                Created by:
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {task.createdBy.firstName} {task.createdBy.lastName}
              </Typography>
            </Box>
          )}

          {(task.dueDate || task.date) && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CalendarIcon sx={{ color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                {task.dueDate ? "Due Date:" : "Date:"}
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString()
                  : new Date(task.date).toLocaleDateString()}
              </Typography>
            </Box>
          )}

          {avatarUsers.length > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Team Members:
              </Typography>
              <AvatarGroup max={10}>
                {avatarUsers.map((user) => (
                  <Tooltip
                    key={user._id}
                    title={`${user.firstName} ${user.lastName}`}
                  >
                    <Avatar alt={`${user.firstName} ${user.lastName}`}>
                      {user.firstName?.charAt(0).toUpperCase()}
                    </Avatar>
                  </Tooltip>
                ))}
              </AvatarGroup>
            </Box>
          )}
        </Box>
      </Paper>

      {activities.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Activities ({activities.length})
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Activity list will be implemented here
          </Typography>
        </Paper>
      )}

      {comments.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Comments ({comments.length})
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Comments section will be implemented here
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default TaskDetail;
