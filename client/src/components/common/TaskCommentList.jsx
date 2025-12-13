// client/src/components/common/TaskCommentList.jsx
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
  Reply as ReplyIcon,
  AttachFile as AttachmentIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { useDeleteTaskCommentMutation } from "../../redux/features/task/taskApi";
import MuiDialog from "./MuiDialog";
import MuiDialogConfirm from "./MuiDialogConfirm";
import CreateUpdateTaskComment from "../forms/tasks/CreateUpdateTaskComment";
import { handleRTKError } from "../../utils/errorHandler";

/**
 * TaskCommentList Component
 * Displays and manages task comments with threading (max depth 3) and mentions
 */
const TaskCommentList = memo(({ taskId, comments }) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);
  const [parentComment, setParentComment] = useState(null);

  const [deleteComment, { isLoading: isDeleting }] =
    useDeleteTaskCommentMutation();

  const handleEdit = useCallback((comment) => {
    setSelectedComment(comment);
    setEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback((comment) => {
    setSelectedComment(comment);
    setDeleteConfirmOpen(true);
  }, []);

  const handleReply = useCallback((comment) => {
    setParentComment(comment);
    setReplyDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    try {
      await deleteComment({
        taskId,
        commentId: selectedComment._id,
      }).unwrap();
      toast.success("Comment deleted successfully");
      setDeleteConfirmOpen(false);
      setSelectedComment(null);
    } catch (error) {
      handleRTKError(error, "Failed to delete comment");
    }
  }, [deleteComment, taskId, selectedComment]);

  const handleCreateSuccess = useCallback(() => {
    setCreateDialogOpen(false);
    toast.success("Comment created successfully");
  }, []);

  const handleReplySuccess = useCallback(() => {
    setReplyDialogOpen(false);
    setParentComment(null);
    toast.success("Reply added successfully");
  }, []);

  const handleUpdateSuccess = useCallback(() => {
    setEditDialogOpen(false);
    setSelectedComment(null);
    toast.success("Comment updated successfully");
  }, []);

  // Render a single comment with its replies
  const renderComment = (comment, depth = 0) => {
    const maxDepth = 3;
    const canReply = depth < maxDepth;

    return (
      <Box key={comment._id}>
        <ListItem
          alignItems="flex-start"
          sx={{ pl: depth * 4 }}
          secondaryAction={
            <Box>
              {canReply && (
                <Tooltip title="Reply">
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => handleReply(comment)}
                  >
                    <ReplyIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Edit">
                <IconButton
                  edge="end"
                  size="small"
                  onClick={() => handleEdit(comment)}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton
                  edge="end"
                  size="small"
                  color="error"
                  onClick={() => handleDelete(comment)}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          }
        >
          <ListItemAvatar>
            <Avatar
              src={comment.createdBy?.profilePicture}
              alt={comment.createdBy?.fullName}
            >
              {comment.createdBy?.firstName?.[0]}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Box>
                <Typography variant="body1" component="span">
                  {comment.comment}
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
                  By {comment.createdBy?.fullName || "Unknown"} •{" "}
                  {dayjs(comment.createdAt).format("MMM DD, YYYY HH:mm")}
                </Typography>

                {/* Mentions */}
                {comment.mentions && comment.mentions.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Mentions:
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 0.5,
                        flexWrap: "wrap",
                        mt: 0.5,
                      }}
                    >
                      {comment.mentions.map((mention) => (
                        <Chip
                          key={mention._id}
                          label={`@${mention.fullName}`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Attachments */}
                {comment.attachments && comment.attachments.length > 0 && (
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
                      {comment.attachments.length} attachment
                      {comment.attachments.length !== 1 ? "s" : ""}
                    </Typography>
                  </Box>
                )}
              </Box>
            }
          />
        </ListItem>
        <Divider variant="inset" component="li" />

        {/* Render replies recursively */}
        {comment.replies &&
          comment.replies.length > 0 &&
          comment.replies.map((reply) => renderComment(reply, depth + 1))}
      </Box>
    );
  };

  return (
    <Box>
      {/* Add Comment Button */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          fullWidth
        >
          Add Comment
        </Button>
      </Box>

      {/* Comments List */}
      {comments.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "200px",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No comments yet
          </Typography>
        </Box>
      ) : (
        <List>{comments.map((comment) => renderComment(comment, 0))}</List>
      )}

      {/* Create Comment Dialog */}
      <MuiDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title="Add Comment"
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button type="submit" form="comment-form" variant="contained">
              Add
            </Button>
          </>
        }
      >
        <CreateUpdateTaskComment
          taskId={taskId}
          onSuccess={handleCreateSuccess}
        />
      </MuiDialog>

      {/* Reply Dialog */}
      <MuiDialog
        open={replyDialogOpen}
        onClose={() => setReplyDialogOpen(false)}
        title="Reply to Comment"
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setReplyDialogOpen(false)}>Cancel</Button>
            <Button type="submit" form="comment-form" variant="contained">
              Reply
            </Button>
          </>
        }
      >
        <CreateUpdateTaskComment
          taskId={taskId}
          parentId={parentComment?._id}
          parentModel="TaskComment"
          onSuccess={handleReplySuccess}
        />
      </MuiDialog>

      {/* Edit Comment Dialog */}
      <MuiDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        title="Edit Comment"
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button type="submit" form="comment-form" variant="contained">
              Update
            </Button>
          </>
        }
      >
        <CreateUpdateTaskComment
          taskId={taskId}
          commentId={selectedComment?._id}
          onSuccess={handleUpdateSuccess}
        />
      </MuiDialog>

      {/* Delete Confirmation */}
      <MuiDialogConfirm
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment?"
        confirmText="Delete"
        severity="error"
        loading={isDeleting}
      />
    </Box>
  );
});

TaskCommentList.displayName = "TaskCommentList";

TaskCommentList.propTypes = {
  taskId: PropTypes.string.isRequired,
  comments: PropTypes.array.isRequired,
};

export default TaskCommentList;
