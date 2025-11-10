// client/src/components/forms/users/CreateUpdateUser.jsx
import { useEffect } from "react";
import PropTypes from "prop-types";
import { useForm } from "react-hook-form";
import { Box, Button, Grid } from "@mui/material";
import { toast } from "react-toastify";
import MuiTextField from "../../common/MuiTextField";
import MuiSelectAutocomplete from "../../common/MuiSelectAutocomplete";
import MuiResourceSelect from "../../common/MuiResourceSelect";
import MuiDatePicker from "../../common/MuiDatePicker";
import MuiFileUpload from "../../common/MuiFileUpload";
import MuiNumberField from "../../common/MuiNumberField";
import { handleRTKError } from "../../../utils/errorHandler";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
} from "../../../redux/features/user/userApi";
import {
  USER_ROLES,
  MAX_USER_NAME_LENGTH,
  MAX_POSITION_LENGTH,
  MAX_EMAIL_LENGTH,
  MIN_PASSWORD_LENGTH,
  MAX_SKILLS_PER_USER,
  MAX_SKILL_NAME_LENGTH,
  MIN_SKILL_PERCENTAGE,
  MAX_SKILL_PERCENTAGE,
  EMPLOYEE_ID_MIN,
  EMPLOYEE_ID_MAX,
} from "../../../utils/constants";

/**
 * CreateUpdateUser Component
 *
 * Form for creating or editing users.
 *
 * @param {Object} props
 * @param {Object} [props.user] - User object for editing (null for create)
 * @param {Function} props.onSuccess - Success callback
 * @param {Function} props.onCancel - Cancel callback
 * @returns {JSX.Element}
 */
const CreateUpdateUser = ({ user, onSuccess, onCancel }) => {
  const isEditMode = !!user;
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    reset,
  } = useForm({
    mode: "onTouched",
    defaultValues: {
      firstName: "",
      lastName: "",
      position: "",
      role: "",
      email: "",
      password: "",
      departmentId: "",
      employeeId: "",
      dateOfBirth: null,
      joinedAt: new Date().toISOString(),
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        position: user.position || "",
        role: user.role || "",
        email: user.email || "",
        departmentId: user.department?._id || user.department || "",
        employeeId: user.employeeId || "",
        dateOfBirth: user.dateOfBirth || null,
        joinedAt: user.joinedAt || new Date().toISOString(),
      });
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    try {
      // Remove password if empty in edit mode
      if (isEditMode && !data.password) {
        delete data.password;
      }

      if (isEditMode) {
        await updateUser({ userId: user._id, data }).unwrap();
        toast.success("User updated successfully");
      } else {
        await createUser(data).unwrap();
        toast.success("User created successfully");
      }
      onSuccess();
    } catch (error) {
      handleRTKError(
        error,
        `Failed to ${isEditMode ? "update" : "create"} user`
      );
    }
  };

  const roleOptions = Object.values(USER_ROLES).map((role) => ({
    id: role,
    label: role,
  }));

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        {/* First Name */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <MuiTextField
            {...register("firstName", {
              required: "First name is required",
              maxLength: {
                value: MAX_USER_NAME_LENGTH,
                message: `Maximum ${MAX_USER_NAME_LENGTH} characters`,
              },
            })}
            label="First Name"
            error={errors.firstName}
            fullWidth
            size="small"
            // margin="normal"
          />
        </Grid>

        {/* Last Name */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <MuiTextField
            {...register("lastName", {
              required: "Last name is required",
              maxLength: {
                value: MAX_USER_NAME_LENGTH,
                message: `Maximum ${MAX_USER_NAME_LENGTH} characters`,
              },
            })}
            label="Last Name"
            error={errors.lastName}
            fullWidth
            size="small"
            // margin="normal"
          />
        </Grid>

        {/* Position */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <MuiTextField
            {...register("position", {
              required: "Position is required",
              maxLength: {
                value: MAX_POSITION_LENGTH,
                message: `Maximum ${MAX_POSITION_LENGTH} characters`,
              },
            })}
            label="Position"
            error={errors.position}
            fullWidth
            size="small"
            // margin="normal"
          />
        </Grid>

        {/* Role */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <MuiSelectAutocomplete
            name="role"
            control={control}
            rules={{ required: "Role is required" }}
            options={roleOptions}
            label="Role"
            required
            fullWidth
            size="small"
            // margin="normal"
          />
        </Grid>

        {/* Email */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <MuiTextField
            {...register("email", {
              required: "Email is required",
              maxLength: {
                value: MAX_EMAIL_LENGTH,
                message: `Maximum ${MAX_EMAIL_LENGTH} characters`,
              },
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Invalid email format",
              },
            })}
            label="Email"
            type="email"
            error={errors.email}
            fullWidth
            size="small"
            // margin="normal"
          />
        </Grid>

        {/* Password */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <MuiTextField
            {...register("password", {
              required: isEditMode ? false : "Password is required",
              minLength: {
                value: MIN_PASSWORD_LENGTH,
                message: `Minimum ${MIN_PASSWORD_LENGTH} characters`,
              },
            })}
            label={
              isEditMode ? "Password (leave blank to keep current)" : "Password"
            }
            type="password"
            error={errors.password}
            fullWidth
            size="small"
            // margin="normal"
          />
        </Grid>

        {/* Department */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <MuiResourceSelect
            name="departmentId"
            control={control}
            rules={{ required: "Department is required" }}
            resourceType="departments"
            label="Department"
          />
        </Grid>

        {/* Employee ID */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <MuiNumberField
            {...register("employeeId", {
              min: {
                value: EMPLOYEE_ID_MIN,
                message: `Minimum ${EMPLOYEE_ID_MIN}`,
              },
              max: {
                value: EMPLOYEE_ID_MAX,
                message: `Maximum ${EMPLOYEE_ID_MAX}`,
              },
            })}
            label="Employee ID (Optional)"
            error={errors.employeeId}
            min={EMPLOYEE_ID_MIN}
            max={EMPLOYEE_ID_MAX}
            fullWidth
            size="small"
            // margin="normal"
          />
        </Grid>

        {/* Date of Birth */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <MuiDatePicker
            name="dateOfBirth"
            control={control}
            label="Date of Birth (Optional)"
            maxDate={new Date()}
          />
        </Grid>

        {/* Joined At */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <MuiDatePicker
            name="joinedAt"
            control={control}
            rules={{ required: "Join date is required" }}
            label="Join Date"
            maxDate={new Date()}
          />
        </Grid>

        {/* Profile Picture Upload */}
        <Grid size={{ xs: 12 }}>
          <MuiFileUpload
            name="profilePicture"
            control={control}
            accept="image/*"
            maxSize={10 * 1024 * 1024}
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
            ? "Update User"
            : "Create User"}
        </Button>
      </Box>
    </Box>
  );
};

CreateUpdateUser.propTypes = {
  user: PropTypes.object,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default CreateUpdateUser;
