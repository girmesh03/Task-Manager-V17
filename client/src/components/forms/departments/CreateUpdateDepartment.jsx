// client/src/components/forms/departments/CreateUpdateDepartment.jsx
import { useEffect } from "react";
import PropTypes from "prop-types";
import { useForm } from "react-hook-form";
import { Box, Button, Grid } from "@mui/material";
import { toast } from "react-toastify";
import MuiTextField from "../../common/MuiTextField";
import MuiTextArea from "../../common/MuiTextArea";
import { handleRTKError } from "../../../utils/errorHandler";
import {
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
} from "../../../redux/features/department/departmentApi";
import {
  MAX_DEPT_NAME_LENGTH,
  MAX_DEPT_DESCRIPTION_LENGTH,
} from "../../../utils/constants";

/**
 * CreateUpdateDepartment Component
 * 
 * Form for creating or editing departments.
 * 
 * @param {Object} props
 * @param {Object} [props.department] - Department object for editing (null for create)
 * @param {Function} props.onSuccess - Success callback
 * @param {Function} props.onCancel - Cancel callback
 * @returns {JSX.Element}
 */
const CreateUpdateDepartment = ({ department, onSuccess, onCancel }) => {
  const isEditMode = !!department;
  const [createDepartment, { isLoading: isCreating }] = useCreateDepartmentMutation();
  const [updateDepartment, { isLoading: isUpdating }] = useUpdateDepartmentMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm({
    mode: "onTouched",
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (department) {
      reset({
        name: department.name || "",
        description: department.description || "",
      });
    }
  }, [department, reset]);

  const onSubmit = async (data) => {
    try {
      if (isEditMode) {
        await updateDepartment({ departmentId: department._id, data }).unwrap();
        toast.success("Department updated successfully");
      } else {
        await createDepartment(data).unwrap();
        toast.success("Department created successfully");
      }
      onSuccess();
    } catch (error) {
      handleRTKError(error, `Failed to ${isEditMode ? "update" : "create"} department`);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        {/* Department Name */}
        <Grid size={{ xs: 12 }}>
          <MuiTextField
            {...register("name", {
              required: "Department name is required",
              maxLength: {
                value: MAX_DEPT_NAME_LENGTH,
                message: `Maximum ${MAX_DEPT_NAME_LENGTH} characters`,
              },
            })}
            label="Department Name"
            error={errors.name}
            fullWidth
            size="small"
            margin="normal"
          />
        </Grid>

        {/* Description */}
        <Grid size={{ xs: 12 }}>
          <MuiTextArea
            {...register("description", {
              maxLength: {
                value: MAX_DEPT_DESCRIPTION_LENGTH,
                message: `Maximum ${MAX_DEPT_DESCRIPTION_LENGTH} characters`,
              },
            })}
            label="Description"
            error={errors.description}
            maxLength={MAX_DEPT_DESCRIPTION_LENGTH}
            rows={4}
          />
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 3 }}>
        <Button onClick={onCancel} variant="outlined" color="inherit">
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isCreating || isUpdating || (!isDirty && isEditMode)}
        >
          {isCreating || isUpdating
            ? "Saving..."
            : isEditMode
            ? "Update Department"
            : "Create Department"}
        </Button>
      </Box>
    </Box>
  );
};

CreateUpdateDepartment.propTypes = {
  department: PropTypes.object,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default CreateUpdateDepartment;
