// src/components/forms/auth/UserDetailsStep.jsx
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import Grid from "@mui/material/Grid";
import MuiTextField from "../../common/MuiTextField";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import WorkIcon from "@mui/icons-material/Work";
import DepartmentIcon from "@mui/icons-material/AccountTree";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { IconButton } from "@mui/material";
import {
  MAX_USER_NAME_LENGTH,
  MAX_POSITION_LENGTH,
  MAX_DEPT_NAME_LENGTH,
  MAX_DEPT_DESCRIPTION_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "../../../utils/constants.js";

const UserDetailsStep = () => {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    formState: { errors },
    getValues,
  } = useFormContext();

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiTextField
          {...register("firstName", {
            required: "First name is required",
            minLength: { value: 2, message: "Minimum 2 characters" },
            maxLength: {
              value: MAX_USER_NAME_LENGTH,
              message: `Maximum ${MAX_USER_NAME_LENGTH} characters`,
            },
            pattern: {
              value: /^[a-zA-Z]+$/,
              message: "Only letters  without space allowed",
            },
          })}
          error={errors.firstName}
          label="First Name"
          fullWidth
          size="small"
          startAdornment={<PersonIcon fontSize="small" color="primary" />}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiTextField
          {...register("lastName", {
            required: "Last name is required",
            minLength: { value: 2, message: "Minimum 2 characters" },
            maxLength: {
              value: MAX_USER_NAME_LENGTH,
              message: `Maximum ${MAX_USER_NAME_LENGTH} characters`,
            },
            pattern: {
              value: /^[a-zA-Z]+$/,
              message: "Only letters without space allowed",
            },
          })}
          error={errors.lastName}
          label="Last Name"
          fullWidth
          size="small"
          startAdornment={<PersonIcon fontSize="small" color="primary" />}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <MuiTextField
          {...register("userEmail", {
            required: "Email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Invalid email address",
            },
            validate: (value) => {
              const orgEmail = getValues("organizationEmail");
              if (
                value &&
                orgEmail &&
                value.toLowerCase() === orgEmail.toLowerCase()
              ) {
                return "User email cannot be the same as organization email";
              }
              return true;
            },
          })}
          error={errors.userEmail}
          label="Email Address"
          type="email"
          fullWidth
          size="small"
          autoComplete="email"
          startAdornment={<EmailIcon fontSize="small" color="primary" />}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiTextField
          {...register("password", {
            required: "Password is required",
            minLength: {
              value: MIN_PASSWORD_LENGTH,
              message: `Minimum ${MIN_PASSWORD_LENGTH} characters`,
            },
          })}
          error={errors.password}
          label="Password"
          type={showPassword ? "text" : "password"}
          fullWidth
          size="small"
          startAdornment={<LockIcon fontSize="small" color="primary" />}
          endAdornment={
            <IconButton
              aria-label="toggle password visibility"
              onClick={handleClickShowPassword}
              onMouseDown={handleMouseDownPassword}
              edge="end"
              size="small"
            >
              {showPassword ? (
                <VisibilityOff fontSize="small" />
              ) : (
                <Visibility fontSize="small" />
              )}
            </IconButton>
          }
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiTextField
          {...register("confirmPassword", {
            required: "Please confirm your password",
            validate: (value) => {
              const password = getValues("password");
              return value === password || "Passwords do not match";
            },
          })}
          error={errors.confirmPassword}
          label="Confirm Password"
          type={showPassword ? "text" : "password"}
          fullWidth
          size="small"
          startAdornment={<LockIcon fontSize="small" color="primary" />}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiTextField
          {...register("position", {
            required: "Position is required",
            minLength: { value: 2, message: "Minimum 2 characters" },
            maxLength: {
              value: MAX_POSITION_LENGTH,
              message: `Maximum ${MAX_POSITION_LENGTH} characters`,
            },
            pattern: {
              value: /^[a-zA-Z\s]+$/,
              message: "Only letters and spaces allowed",
            },
          })}
          error={errors.position}
          label="Position"
          fullWidth
          size="small"
          startAdornment={<WorkIcon fontSize="small" color="primary" />}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiTextField
          {...register("departmentName", {
            required: "Department name is required",
            minLength: { value: 2, message: "Minimum 2 characters" },
            maxLength: {
              value: MAX_DEPT_NAME_LENGTH,
              message: `Maximum ${MAX_DEPT_NAME_LENGTH} characters`,
            },
          })}
          error={errors.departmentName}
          label="Department Name"
          fullWidth
          size="small"
          startAdornment={<DepartmentIcon fontSize="small" color="primary" />}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <MuiTextField
          {...register("departmentDesc", {
            required: "Department description is required",
            maxLength: {
              value: MAX_DEPT_DESCRIPTION_LENGTH,
              message: `Maximum ${MAX_DEPT_DESCRIPTION_LENGTH} characters`,
            },
          })}
          error={errors.departmentDesc}
          label="Department Description"
          fullWidth
          size="small"
          multiline
          rows={3}
        />
      </Grid>
    </Grid>
  );
};

export default UserDetailsStep;
