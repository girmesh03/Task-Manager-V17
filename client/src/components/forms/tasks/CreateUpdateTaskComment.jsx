// client/src/components/forms/tasks/CreateUpdateTaskComment.jsx
import { useEffect } from "react";
import PropTypes from "prop-types";
import { useForm } from "react-hook-form";
import { Box, Button, Grid } from "@mui/material";
import MuiTextArea from "../../common/MuiTextArea";
import MuiResourceSelect from "../../common/MuiResourceSelect";
import {
  useCreateTaskCommentMutation,
  useUpdateTaskCommentMutation,
  useGetTaskCommentByIdQuery,
} from "../../../redux/features/task/taskApi";
import { handleRTKError } from "../../../utils/errorHandler";

/**
 * CreateUpdateTaskComment Component
 * Form for creating/updating task comments with mention support
 * Field names match taskCommentValidators exactly
 */
const CreateUpdateTaskComment = ({
  taskId,
  commentId,
  parentId,
  parentModel,
  onSuccess,
}) => {
  const isEditMode = !!commentId;
  const isReply = !!parentId;

  // RTK Query hooks
  const { data: commentData } = useGetTaskCommentByIdQuery(
    { taskId, commentId },
    {
      skip: !commentId,
    }
  );

  const [createComment] = useCreateTaskCommentMutation();
  const [updateComment] = useUpdateTaskCommentMutation();

  // Form state
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    mode: "onTouched",
    defaultValues: {
      comment: "",
      mentionIds: [],
    },
  });

  // Load comment data in edit mode
  useEffect(() => {
    if (commentData) {
      reset({
        comment: commentData.comment,
        mentionIds: commentData.mentions?.map((m) => m._id) || [],
      });
    }
  }, [commentData, reset]);

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      const payload = {
        taskId,
        comment: data.comment,
        mentionIds:
          Array.isArray(data.mentionIds) && data.mentionIds.length > 0
            ? data.mentionIds
            : undefined,
      };

      // Add parent info for replies
      if (isReply && !isEditMode) {
        payload.parentId = parentId;
        payload.parentModel = parentModel;
      }

      if (isEditMode) {
        await updateComment({ ...payload, commentId }).unwrap();
      } else {
        await createComment(payload).unwrap();
      }

      onSuccess();
    } catch (error) {
      handleRTKError(
        error,
        `Failed to ${isEditMode ? "update" : "create"} comment`
      );
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} id="comment-form">
      <Grid container spacing={2}>
        {/* Comment */}
        <Grid size={{ xs: 12 }}>
          <MuiTextArea
            {...register("comment", {
              required: "Comment is required",
              maxLength: {
                value: 2000,
                message: "Comment cannot exceed 2000 characters",
              },
            })}
            label="Comment"
            error={errors.comment}
            required
            rows={4}
            maxLength={2000}
          />
        </Grid>

        {/* Mentions */}
        <Grid size={{ xs: 12 }}>
          <MuiResourceSelect
            name="mentionIds"
            control={control}
            label="Mention Users"
            resourceType="users"
            multiple
          />
        </Grid>

        {/* Note: Attachments support will be added in future phase */}
      </Grid>
    </Box>
  );
};

CreateUpdateTaskComment.propTypes = {
  taskId: PropTypes.string.isRequired,
  commentId: PropTypes.string,
  parentId: PropTypes.string,
  parentModel: PropTypes.string,
  onSuccess: PropTypes.func.isRequired,
};

export default CreateUpdateTaskComment;
