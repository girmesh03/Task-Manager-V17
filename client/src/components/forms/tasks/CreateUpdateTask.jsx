// client/src/components/forms/tasks/CreateUpdateTask.jsx
import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useForm, Controller } from "react-hook-form";
import { Box, Grid, Autocomplete, TextField } from "@mui/material";
import MuiTextField from "../../common/MuiTextField";
import MuiTextArea from "../../common/MuiTextArea";
import MuiSelectAutocomplete from "../../common/MuiSelectAutocomplete";
import MuiResourceSelect from "../../common/MuiResourceSelect";
import MuiDatePicker from "../../common/MuiDatePicker";
import MuiNumberField from "../../common/MuiNumberField";
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
} from "../../../redux/features/task/taskApi";
import {
  TASK_TYPES,
  TASK_STATUS,
  TASK_PRIORITY,
  ROUTINE_TASK_STATUS,
  ROUTINE_TASK_PRIORITY,
  SUPPORTED_CURRENCIES,
} from "../../../utils/constants";
import { handleRTKError } from "../../../utils/errorHandler";
import dayjs from "dayjs";

/**
 * CreateUpdateTask Component
 * Adaptive form for creating/updating tasks with type-specific fields
 */
const CreateUpdateTask = ({ task, taskType, onSuccess }) => {
  const isEditMode = !!task;

  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();

  // Local state for task type to control conditional rendering
  const [selectedTaskType, setSelectedTaskType] = useState(taskType || "");

  // Form state
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    mode: "onTouched",
    defaultValues: {
      taskType: taskType || "",
      title: "",
      description: "",
      status: "",
      priority: "",
      tags: [],
      watcherIds: [],
      // AssignedTask fields
      startDate: null,
      dueDate: null,
      assigneeIds: [],
      // ProjectTask fields
      vendorId: "",
      estimatedCost: "",
      actualCost: "",
      currency: "USD",
      // RoutineTask fields
      date: null,
      materials: [],
    },
  });

  // Handle taskType change via callback
  const handleTaskTypeChange = (value) => {
    if (value) {
      setSelectedTaskType(value);
    }
  };

  // Load task data in edit mode or set taskType in create mode
  useEffect(() => {
    if (task) {
      setSelectedTaskType(task.taskType);
      reset({
        taskType: task.taskType,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        tags: task.tags || [],
        watcherIds: task.watchers?.map((w) => w._id) || [],
        // AssignedTask fields
        startDate: task.startDate || null,
        dueDate: task.dueDate || null,
        assigneeIds: task.assignees?.map((a) => a._id) || [],
        // ProjectTask fields
        vendorId: task.vendor?._id || "",
        estimatedCost: task.estimatedCost || "",
        actualCost: task.actualCost || "",
        currency: task.currency || "USD",
        // RoutineTask fields
        date: task.date || null,
        materials:
          task.materials?.map((m) => ({
            materialId: m.material?._id,
            quantity: m.quantity,
          })) || [],
      });
    } else if (taskType) {
      // Set taskType in create mode
      setSelectedTaskType(taskType);
      setValue("taskType", taskType);
    }
  }, [task, taskType, reset, setValue]);

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      // Prepare payload based on task type
      const payload = {
        taskType: data.taskType,
        title: data.title,
        description: data.description,
        status: data.status || undefined,
        priority: data.priority || undefined,
        tags: Array.isArray(data.tags) && data.tags.length > 0 ? data.tags : [],
        watcherIds:
          Array.isArray(data.watcherIds) && data.watcherIds.length > 0
            ? data.watcherIds
            : [],
      };

      // Add type-specific fields
      if (data.taskType === "AssignedTask") {
        payload.startDate = dayjs(data.startDate).format();
        payload.dueDate = dayjs(data.dueDate).format();
        payload.assigneeIds = Array.isArray(data.assigneeIds)
          ? data.assigneeIds
          : [];
      } else if (data.taskType === "ProjectTask") {
        payload.startDate = dayjs(data.startDate).format();
        payload.dueDate = dayjs(data.dueDate).format();
        payload.vendorId = data.vendorId;
        payload.estimatedCost = data.estimatedCost
          ? Number(data.estimatedCost)
          : undefined;
        payload.actualCost = data.actualCost
          ? Number(data.actualCost)
          : undefined;
        payload.currency = data.currency;
      } else if (data.taskType === "RoutineTask") {
        payload.date = dayjs(data.date).format();
        // Materials should be array of {materialId, quantity}
        payload.materials =
          Array.isArray(data.materials) && data.materials.length > 0
            ? data.materials.map((m) => ({
                materialId: typeof m === "string" ? m : m.materialId,
                quantity: m.quantity || 1,
              }))
            : [];
      }

      // console.log("payload", payload);
      // console.log(
      //   "dayjs(startDate)",
      //   dayjs(data.startDate).format("[YYYYescape] YYYY-MM-DDTHH:mm:ssZ[Z]")
      // );
      // console.log(
      //   "data.dueDate",
      //   dayjs(data.dueDate).format("[YYYYescape] YYYY-MM-DDTHH:mm:ssZ[Z]")
      // );

      // // const now = dayjs();
      // //     const due = dayjs(dueDate);
      // //     const diff = due.diff(now, "day");
      if (isEditMode) {
        await updateTask({ taskId: task._id, ...payload }).unwrap();
      } else {
        await createTask(payload).unwrap();
      }

      onSuccess();
    } catch (error) {
      console.log("error", error);
      handleRTKError(
        error,
        `Failed to ${isEditMode ? "update" : "create"} task`
      );
    }
  };

  // Get status options based on task type
  const getStatusOptions = (taskType) => {
    if (taskType === "RoutineTask") {
      return ROUTINE_TASK_STATUS.map((status) => ({
        id: status,
        label: status,
      }));
    }
    return TASK_STATUS.map((status) => ({ id: status, label: status }));
  };

  // Get priority options based on task type
  const getPriorityOptions = (taskType) => {
    if (taskType === "RoutineTask") {
      return ROUTINE_TASK_PRIORITY.map((priority) => ({
        id: priority,
        label: priority,
      }));
    }
    return TASK_PRIORITY.map((priority) => ({
      id: priority,
      label: priority,
    }));
  };

  const taskTypeOptions = TASK_TYPES.map((type) => ({
    id: type,
    label: type,
  }));

  const currencyOptions = SUPPORTED_CURRENCIES.map((curr) => ({
    id: curr,
    label: curr,
  }));

  // isLoading used by parent via form submission state
  // const isLoading = isCreating || isUpdating;

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} id="task-form">
      <Grid container spacing={2}>
        {/* Task Type */}
        <Grid size={{ xs: 12 }}>
          <MuiSelectAutocomplete
            name="taskType"
            control={control}
            rules={{ required: "Task type is required" }}
            options={taskTypeOptions}
            label="Task Type"
            required
            disabled={isEditMode || !!taskType}
            onValueChange={handleTaskTypeChange}
          />
        </Grid>

        {/* Title */}
        <Grid size={{ xs: 12 }}>
          <MuiTextField
            {...register("title", {
              required: "Title is required",
              maxLength: {
                value: 50,
                message: "Title cannot exceed 50 characters",
              },
            })}
            label="Title"
            error={errors.title}
            required
            fullWidth
            size="small"
          />
        </Grid>

        {/* Description */}
        <Grid size={{ xs: 12 }}>
          <MuiTextArea
            {...register("description", {
              required: "Description is required",
              maxLength: {
                value: 2000,
                message: "Description cannot exceed 2000 characters",
              },
            })}
            label="Description"
            error={errors.description}
            required
            rows={4}
            maxLength={2000}
          />
        </Grid>

        {/* Status */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <MuiSelectAutocomplete
            name="status"
            control={control}
            options={getStatusOptions(selectedTaskType)}
            label="Status"
          />
        </Grid>

        {/* Priority */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <MuiSelectAutocomplete
            name="priority"
            control={control}
            options={getPriorityOptions(selectedTaskType)}
            label="Priority"
          />
        </Grid>

        {/* Watchers - Multiple selection returns array of IDs */}
        <Grid size={{ xs: 12 }}>
          <MuiResourceSelect
            name="watcherIds"
            control={control}
            label="Watchers"
            resourceType="users"
            multiple
          />
        </Grid>

        {/* Tags - Using Controller directly for freeSolo multiple */}
        <Grid size={{ xs: 12 }}>
          <Controller
            name="tags"
            control={control}
            render={({
              field: { onChange, value, ref },
              fieldState: { error },
            }) => (
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={value || []}
                onChange={(_event, newValue) => onChange(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tags"
                    placeholder="Add tags..."
                    inputRef={ref}
                    error={!!error}
                    helperText={error?.message || "Press Enter to add a tag"}
                    size="small"
                    sx={{
                      "& .MuiInputBase-root": {
                        // Allow vertical expansion for multiple chips
                        minHeight: "40px",
                        height: "auto",
                        alignItems: "flex-start",
                        paddingTop: "8px",
                        paddingBottom: "8px",
                      },
                      "& .MuiInputBase-input": {
                        // Ensure input field aligns properly with chips
                        minHeight: "24px",
                      },
                      "& .MuiAutocomplete-tag": {
                        // Proper spacing for chips
                        margin: "2px",
                      },
                    }}
                  />
                )}
              />
            )}
          />
        </Grid>

        {/* AssignedTask specific fields */}
        {selectedTaskType === "AssignedTask" && (
          <>
            <Grid size={{ xs: 12, sm: 6 }}>
              <MuiDatePicker
                name="startDate"
                control={control}
                rules={{ required: "Start date is required" }}
                label="Start Date"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <MuiDatePicker
                name="dueDate"
                control={control}
                rules={{ required: "Due date is required" }}
                label="Due Date"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <MuiResourceSelect
                name="assigneeIds"
                control={control}
                rules={{ required: "At least one assignee is required" }}
                label="Assignees"
                resourceType="users"
                multiple
              />
            </Grid>
          </>
        )}

        {/* ProjectTask specific fields */}
        {selectedTaskType === "ProjectTask" && (
          <>
            <Grid size={{ xs: 12, sm: 6 }}>
              <MuiDatePicker
                name="startDate"
                control={control}
                rules={{ required: "Start date is required" }}
                label="Start Date"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <MuiDatePicker
                name="dueDate"
                control={control}
                rules={{ required: "Due date is required" }}
                label="Due Date"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <MuiResourceSelect
                name="vendorId"
                control={control}
                rules={{ required: "Vendor is required" }}
                label="Vendor"
                resourceType="vendors"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <MuiNumberField
                {...register("estimatedCost")}
                label="Estimated Cost"
                error={errors.estimatedCost}
                min={0}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <MuiNumberField
                {...register("actualCost")}
                label="Actual Cost"
                error={errors.actualCost}
                min={0}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <MuiSelectAutocomplete
                name="currency"
                control={control}
                options={currencyOptions}
                label="Currency"
              />
            </Grid>
          </>
        )}

        {/* RoutineTask specific fields */}
        {selectedTaskType === "RoutineTask" && (
          <>
            <Grid size={{ xs: 12 }}>
              <MuiDatePicker
                name="date"
                control={control}
                rules={{ required: "Date is required" }}
                label="Date"
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
          </>
        )}

        {/* Note: Attachments support will be added in future phase */}
      </Grid>
    </Box>
  );
};

CreateUpdateTask.propTypes = {
  task: PropTypes.object,
  taskType: PropTypes.string,
  onSuccess: PropTypes.func.isRequired,
};

export default CreateUpdateTask;
