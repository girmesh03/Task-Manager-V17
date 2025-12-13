// client/src/pages/TaskDetails.jsx
import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Chip,
  Grid,
  Avatar,
  AvatarGroup,
  Tooltip,
  Stack,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  CalendarToday as CalendarIcon,
  AttachFile as AttachmentIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import { LoadingFallback } from "../components/common/MuiLoading";
import RouteError from "../components/common/RouteError";
import { useGetTaskByIdQuery } from "../redux/features/task/taskApi";
import { TASK_STATUS, TASK_PRIORITY } from "../utils/constants";
import TaskActivityList from "../components/common/TaskActivityList";
import TaskCommentList from "../components/common/TaskCommentList";

/**
 * TaskDetails Page Component
 * Displays task details with tabs for Details, Activities, and Comments
 */
const TaskDetails = () => {
  const { taskId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  // Check if viewing deleted task from URL params
  const isDeleted = searchParams.get("deleted") === "true";

  // Fetch task details with deleted flag
  const queryParams = useMemo(
    () => ({
      taskId,
      deleted: isDeleted,
    }),
    [taskId, isDeleted]
  );

  const { data, isLoading, isError, error, refetch } =
    useGetTaskByIdQuery(queryParams);

  const handleTabChange = useCallback((_event, newValue) => {
    setActiveTab(newValue);
  }, []);

  const handleBack = useCallback(() => {
    navigate("/tasks");
  }, [navigate]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // Get status color - memoized
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case TASK_STATUS[0]: // To Do
        return "default";
      case TASK_STATUS[1]: // In Progress
        return "info";
      case TASK_STATUS[2]: // Completed
        return "success";
      case TASK_STATUS[3]: // Pending
        return "warning";
      default:
        return "default";
    }
  }, []);

  // Get priority color - memoized
  const getPriorityColor = useCallback((priority) => {
    switch (priority) {
      case TASK_PRIORITY[0]: // Low
        return "default";
      case TASK_PRIORITY[1]: // Medium
        return "info";
      case TASK_PRIORITY[2]: // High
        return "warning";
      case TASK_PRIORITY[3]: // Urgent
        return "error";
      default:
        return "default";
    }
  }, []);

  // Format date - memoized
  const formatDate = useCallback((dateValue) => {
    return dateValue ? dayjs(dateValue).format("MMM DD, YYYY") : "N/A";
  }, []);

  // Backend response structure: { success, message, task: { task, activities, comments } }
  // Memoize to prevent re-renders - MUST be before conditional returns
  const taskData = useMemo(() => data?.task || {}, [data]);
  const task = useMemo(() => taskData.task || taskData, [taskData]);
  const activities = useMemo(() => taskData.activities || [], [taskData]);
  const comments = useMemo(() => taskData.comments || [], [taskData]);

  // Show loading state
  if (isLoading && !data) {
    return <LoadingFallback message="Loading task details..." height="100%" />;
  }

  // Show error state
  if (isError && !data) {
    return (
      <RouteError
        error={error}
        isError={isError}
        isLoading={isLoading}
        onRetry={handleRetry}
      />
    );
  }

  if (!task) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Task not found</Typography>
        <Button onClick={handleBack} sx={{ mt: 2 }}>
          Back to Tasks
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={1}
        mb={3}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button startIcon={<BackIcon />} onClick={handleBack}>
            Back
          </Button>
          <Typography variant="h5" fontWeight={600}>
            Task Details
          </Typography>
        </Box>
      </Stack>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Details" />
        <Tab label={`Activities (${activities.length})`} />
        <Tab label={`Comments (${comments.length})`} />
      </Tabs>

      {/* Tab Panels */}
      {/* Details Tab */}
      {activeTab === 0 && (
        <Box>
          <Grid container spacing={3}>
            {/* Task Type */}
            <Grid size={{ xs: 12 }}>
              <Chip label={task.taskType} color="primary" variant="outlined" />
            </Grid>

            {/* Title */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h5" gutterBottom>
                {task.title}
              </Typography>
            </Grid>

            {/* Description */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="body1" color="text.secondary">
                {task.description}
              </Typography>
            </Grid>

            {/* Status and Priority */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" gutterBottom>
                Status
              </Typography>
              <Chip label={task.status} color={getStatusColor(task.status)} />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" gutterBottom>
                Priority
              </Typography>
              <Chip
                label={task.priority}
                color={getPriorityColor(task.priority)}
              />
            </Grid>

            {/* Dates */}
            {task.startDate && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CalendarIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    Start: {formatDate(task.startDate)}
                  </Typography>
                </Box>
              </Grid>
            )}

            {task.dueDate && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CalendarIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    Due: {formatDate(task.dueDate)}
                  </Typography>
                </Box>
              </Grid>
            )}

            {task.date && (
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CalendarIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    Date: {formatDate(task.date)}
                  </Typography>
                </Box>
              </Grid>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {task.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>
            )}

            {/* Attachments */}
            {task.attachments && task.attachments.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AttachmentIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {task.attachments.length} attachment
                    {task.attachments.length !== 1 ? "s" : ""}
                  </Typography>
                </Box>
              </Grid>
            )}

            {/* Assignees */}
            {task.assignees && task.assignees.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Assignees
                </Typography>
                <AvatarGroup max={10}>
                  {task.assignees.map((assignee) => (
                    <Tooltip
                      key={assignee._id}
                      title={assignee.fullName || "Unknown"}
                    >
                      <Avatar
                        src={assignee.profilePicture}
                        alt={assignee.fullName}
                      >
                        {assignee.firstName?.[0]}
                      </Avatar>
                    </Tooltip>
                  ))}
                </AvatarGroup>
              </Grid>
            )}

            {/* Watchers */}
            {task.watchers && task.watchers.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Watchers
                </Typography>
                <AvatarGroup max={10}>
                  {task.watchers.map((watcher) => (
                    <Tooltip
                      key={watcher._id}
                      title={watcher.fullName || "Unknown"}
                    >
                      <Avatar
                        src={watcher.profilePicture}
                        alt={watcher.fullName}
                      >
                        {watcher.firstName?.[0]}
                      </Avatar>
                    </Tooltip>
                  ))}
                </AvatarGroup>
              </Grid>
            )}

            {/* Vendor (ProjectTask) */}
            {task.vendor && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Vendor
                </Typography>
                <Typography variant="body2">{task.vendor.name}</Typography>
              </Grid>
            )}

            {/* Cost Information (ProjectTask) */}
            {(task.estimatedCost || task.actualCost) && (
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Estimated Cost
                  </Typography>
                  <Typography variant="body2">
                    {task.estimatedCost
                      ? `${task.currency || "USD"} ${task.estimatedCost}`
                      : "N/A"}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Actual Cost
                  </Typography>
                  <Typography variant="body2">
                    {task.actualCost
                      ? `${task.currency || "USD"} ${task.actualCost}`
                      : "N/A"}
                  </Typography>
                </Grid>
              </>
            )}

            {/* Materials (RoutineTask) */}
            {task.materials && task.materials.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Materials
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {task.materials.map((material, index) => (
                    <Typography key={index} variant="body2">
                      {material.material?.name} - Quantity: {material.quantity}
                    </Typography>
                  ))}
                </Box>
              </Grid>
            )}

            {/* Created By */}
            {task.createdBy && (
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PersonIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Created by {task.createdBy.fullName || "Unknown"} on{" "}
                    {formatDate(task.createdAt)}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Activities Tab */}
      {activeTab === 1 && (
        <TaskActivityList taskId={taskId} activities={activities} />
      )}

      {/* Comments Tab */}
      {activeTab === 2 && (
        <TaskCommentList taskId={taskId} comments={comments} />
      )}
    </Box>
  );
};

export default TaskDetails;
