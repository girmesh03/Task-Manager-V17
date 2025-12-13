// client/src/components/forms/tasks/CreateUpdateTaskActivity.jsx
import { useEffect } from "react";
import PropTypes from "prop-types";
import { useForm } from "react-hook-form";
import { Box, Button, Grid } from "@mui/material";
import MuiTextArea from "../../common/MuiTextArea";
import MuiResourceSelect from "../../common/MuiResourceSelect";
import {
  useCreateTaskActivityMutation,
  useUpdateTaskActivityMutation,
  useGetTaskActivityByIdQuery,
} from "../../../redux/features/task/taskApi";
import { handleRTKError } from "../../../utils/errorHandler";

/**
 * CreateUpdateTaskActivity Component
 * Form for creating/updating task activities
 * Field names match taskActivityValidators exactly
 */
const CreateUpdateTaskActivity = ({ taskId, activityId, onSuccess }) => {
  const isEditMode = !!activityId;

  // RTK Query hooks
  const { data: activityData } = useGetTaskActivityByIdQuery(
    { taskId, activityId },
    {
      skip: !activityId,
    }
  );

  const [createActivity] = useCreateTaskActivityMutation();
  const [updateActivity] = useUpdateTaskActivityMutation();

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
      activity: "",
      materials: [],
    },
  });

  // Load activity data in edit mode
  useEffect(() => {
    if (activityData) {
      reset({
        activity: activityData.activity,
        materials:
          activityData.materials?.map((m) => ({
            materialId: m.material?._id,
            quantity: m.quantity,
          })) || [],
      });
    }
  }, [activityData, reset]);

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      const payload = {
        taskId,
        activity: data.activity,
        // Materials should be array of {materialId, quantity}
        materials:
          Array.isArray(data.materials) && data.materials.length > 0
            ? data.materials.map((m) => ({
                materialId: typeof m === "string" ? m : m.materialId || m,
                quantity: typeof m === "object" && m.quantity ? m.quantity : 1,
              }))
            : undefined,
      };

      if (isEditMode) {
        await updateActivity({ ...payload, activityId }).unwrap();
      } else {
        await createActivity(payload).unwrap();
      }

      onSuccess();
    } catch (error) {
      handleRTKError(
        error,
        `Failed to ${isEditMode ? "update" : "create"} activity`
      );
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} id="activity-form">
      <Grid container spacing={2}>
        {/* Activity */}
        <Grid size={{ xs: 12 }}>
          <MuiTextArea
            {...register("activity", {
              required: "Activity is required",
              maxLength: {
                value: 2000,
                message: "Activity cannot exceed 2000 characters",
              },
            })}
            label="Activity"
            error={errors.activity}
            required
            rows={4}
            maxLength={2000}
          />
        </Grid>

        {/* Materials - Backend expects array of {materialId, quantity} */}
        <Grid size={{ xs: 12 }}>
          <MuiResourceSelect
            name="materials"
            control={control}
            label="Materials"
            resourceType="materials"
            multiple
          />
        </Grid>

        {/* Note: Attachments support will be added in future phase */}
      </Grid>
    </Box>
  );
};

CreateUpdateTaskActivity.propTypes = {
  taskId: PropTypes.string.isRequired,
  activityId: PropTypes.string,
  onSuccess: PropTypes.func.isRequired,
};

export default CreateUpdateTaskActivity;
