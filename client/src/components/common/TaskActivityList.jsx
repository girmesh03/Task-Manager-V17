// client/src/components/common/TaskActivityList.jsx
import { useState, useCallback, memo } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Tooltip,
  Chip,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachFile as AttachmentIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { useDeleteTaskActivityMutation } from "../../redux/features/task/taskApi";
import MuiDialog from "./MuiDialog";
import MuiDialogConfirm from "./MuiDialogConfirm";
import CreateUpdateTaskActivity from "../forms/tasks/CreateUpdateTaskActivity";
import { handleRTKError } from "../../utils/errorHandler";

/**
 * TaskActivityList Component
 * Displays and manages task activities with create, update, delete operations
 */
const TaskActivityList = memo(({ taskId, activities }) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const [deleteActivity, { isLoading: isDeleting }] =
    useDeleteTaskActivityMutation();

  const handleEdit = useCallback((activity) => {
    setSelectedActivity(activity);
    setEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback((activity) => {
    setSelectedActivity(activity);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    try {
      await deleteActivity({
        taskId,
        activityId: selectedActivity._id,
      }).unwrap();
      toast.success("Activity deleted successfully");
      setDeleteConfirmOpen(false);
      setSelectedActivity(null);
    } catch (error) {
      handleRTKError(error, "Failed to delete activity");
    }
  }, [deleteActivity, taskId, selectedActivity]);

  const handleCreateSuccess = useCallback(() => {
    setCreateDialogOpen(false);
    toast.success("Activity created successfully");
  }, []);

  const handleUpdateSuccess = useCallback(() => {
    setEditDialogOpen(false);
    setSelectedActivity(null);
    toast.success("Activity updated successfully");
  }, []);

  return (
    <Box>
      {/* Add Activity Button */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          fullWidth
        >
          Add Activity
        </Button>
      </Box>

      {/* Activities List */}
      {activities.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "200px",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No activities yet
          </Typography>
        </Box>
      ) : (
        <List>
          {activities.map((activity, index) => (
            <Box key={activity._id}>
              <ListItem
                alignItems="flex-start"
                secondaryAction={
                  <Box>
                    <Tooltip title="Edit">
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleEdit(activity)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        edge="end"
                        size="small"
                        color="error"
                        onClick={() => handleDelete(activity)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              >
                <ListItemAvatar>
                  <Avatar
                    src={activity.createdBy?.profilePicture}
                    alt={activity.createdBy?.fullName}
                  >
                    {activity.createdBy?.firstName?.[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box>
                      <Typography variant="body1" component="span">
                        {activity.activity}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        component="div"
                      >
                        By {activity.createdBy?.fullName || "Unknown"} •{" "}
                        {dayjs(activity.createdAt).format("MMM DD, YYYY HH:mm")}
                      </Typography>

                      {/* Materials */}
                      {activity.materials && activity.materials.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Materials:
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              gap: 0.5,
                              flexWrap: "wrap",
                              mt: 0.5,
                            }}
                          >
                            {activity.materials.map((material, idx) => (
                              <Chip
                                key={idx}
                                label={`${material.material?.name} (${material.quantity})`}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* Attachments */}
                      {activity.attachments &&
                        activity.attachments.length > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              mt: 1,
                            }}
                          >
                            <AttachmentIcon fontSize="small" />
                            <Typography variant="caption">
                              {activity.attachments.length} attachment
                              {activity.attachments.length !== 1 ? "s" : ""}
                            </Typography>
                          </Box>
                        )}
                    </Box>
                  }
                />
              </ListItem>
              {index < activities.length - 1 && (
                <Divider variant="inset" component="li" />
              )}
            </Box>
          ))}
        </List>
      )}

      {/* Create Activity Dialog */}
      <MuiDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title="Add Activity"
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button type="submit" form="activity-form" variant="contained">
              Add
            </Button>
          </>
        }
      >
        <CreateUpdateTaskActivity
          taskId={taskId}
          onSuccess={handleCreateSuccess}
        />
      </MuiDialog>

      {/* Edit Activity Dialog */}
      <MuiDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        title="Edit Activity"
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button type="submit" form="activity-form" variant="contained">
              Update
            </Button>
          </>
        }
      >
        <CreateUpdateTaskActivity
          taskId={taskId}
          activityId={selectedActivity?._id}
          onSuccess={handleUpdateSuccess}
        />
      </MuiDialog>

      {/* Delete Confirmation */}
      <MuiDialogConfirm
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Activity"
        message="Are you sure you want to delete this activity?"
        confirmText="Delete"
        severity="error"
        loading={isDeleting}
      />
    </Box>
  );
});

TaskActivityList.displayName = "TaskActivityList";

TaskActivityList.propTypes = {
  taskId: PropTypes.string.isRequired,
  activities: PropTypes.array.isRequired,
};

export default TaskActivityList;
