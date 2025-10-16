// src/pages/Register.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Box,
  Typography,
  Alert,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Grid,
  IconButton,
  CircularProgress,
} from "@mui/material";
import MuiTextField from "../components/common/MuiTextField";
import MuiSelectAutocomplete from "../components/common/MuiSelectAutocomplete";
import BusinessIcon from "@mui/icons-material/Business";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import WorkIcon from "@mui/icons-material/Work";
import DepartmentIcon from "@mui/icons-material/AccountTree";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";

import { registerUser } from "../redux/features/auth/authApi";
import { clearError, selectAuth } from "../redux/features/auth/authSlice";

const ORGANIZATION_SIZES = [
  { id: "small", label: "Small", icon: <HomeWorkIcon fontSize="small" /> },
  {
    id: "medium",
    label: "Medium",
    icon: <BusinessCenterIcon fontSize="small" />,
  },
  { id: "large", label: "Large", icon: <CorporateFareIcon fontSize="small" /> },
];

const INDUSTRIES = [
  { id: "hospitality", label: "Hospitality" },
  { id: "technology", label: "Technology" },
  { id: "healthcare", label: "Healthcare" },
  { id: "finance", label: "Finance" },
  { id: "education", label: "Education" },
  { id: "manufacturing", label: "Manufacturing" },
  { id: "retail", label: "Retail" },
  { id: "construction", label: "Construction" },
  { id: "transportation", label: "Transportation" },
  { id: "energy", label: "Energy" },
  { id: "agriculture", label: "Agriculture" },
  { id: "real-estate", label: "Real Estate" },
  { id: "media", label: "Media" },
  { id: "telecommunications", label: "Telecommunications" },
  { id: "automotive", label: "Automotive" },
  { id: "aerospace", label: "Aerospace" },
  { id: "pharmaceuticals", label: "Pharmaceuticals" },
  { id: "consulting", label: "Consulting" },
  { id: "legal", label: "Legal" },
  { id: "non-profit", label: "Non-Profit" },
  { id: "government", label: "Government" },
  { id: "entertainment", label: "Entertainment" },
  { id: "sports", label: "Sports" },
  { id: "other", label: "Other" },
];

const steps = [
  "Organization Details",
  "Admin User Details",
  "Review",
  "Submit",
];

const Register = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector(selectAuth);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm({
    defaultValues: {
      // step 1
      organizationName: "",
      organizationEmail: "",
      organizationPhone: "",
      organizationAddress: "",
      organizationSize: "",
      organizationIndustry: "",
      // step 2
      departmentName: "",
      position: "",
      departmentDesc: "",
      // step 3
      firstName: "",
      lastName: "",
      userEmail: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const onSubmit = async (data) => {
    try {
      dispatch(clearError());
      const registrationData = {
        organizationData: {
          name: data.organizationName,
          email: data.organizationEmail,
          phone: data.organizationPhone,
          address: data.organizationAddress,
          size: data.organizationSize,
          industry: data.organizationIndustry,
        },
        userData: {
          firstName: data.firstName,
          lastName: data.lastName,
          position: data.position,
          email: data.userEmail,
          password: data.password,
          departmentName: data.departmentName,
          departmentDesc: data.departmentDesc,
        },
      };

      await dispatch(registerUser(registrationData)).unwrap();
      toast.success(
        "Organization registered successfully! Please login to continue."
      );
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Registration error:", err);
      toast.error(err || "Registration failed");
    }
  };

  const renderOrganizationStep = () => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <MuiTextField
          label="Organization Name"
          fullWidth
          size="small"
          startAdornment={<BusinessIcon fontSize="small" color="primary" />}
          error={!!errors.organizationName}
          helperText={errors.organizationName?.message}
          {...registerField("organizationName", {
            required: "Organization name is required",
            minLength: { value: 2, message: "Minimum 2 characters" },
            maxLength: { value: 100, message: "Maximum 100 characters" },
            pattern: {
              value: /^[a-zA-Z\s'-]+$/,
              message: "Only letters, spaces, hyphens and apostrophes allowed",
            },
          })}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiTextField
          label="Organization Email"
          type="email"
          fullWidth
          size="small"
          startAdornment={<EmailIcon fontSize="small" color="primary" />}
          error={!!errors.organizationEmail}
          helperText={errors.organizationEmail?.message}
          {...registerField("organizationEmail", {
            required: "Organization email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Invalid email address",
            },
          })}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiTextField
          label="Phone Number"
          fullWidth
          size="small"
          startAdornment={<PhoneIcon fontSize="small" color="primary" />}
          error={!!errors.organizationPhone}
          helperText={errors.organizationPhone?.message}
          {...registerField("organizationPhone", {
            required: "Phone number is required",
            pattern: {
              value: /^(\+251[0-9]{9}|0[0-9]{9})$/,
              message:
                "Phone number must be in format: +2510123456789, +251123456789, or 0123456789",
            },
          })}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <MuiTextField
          label="Address"
          fullWidth
          size="small"
          multiline
          rows={2}
          startAdornment={<LocationOnIcon fontSize="small" color="primary" />}
          error={!!errors.organizationAddress}
          helperText={errors.organizationAddress?.message}
          {...registerField("organizationAddress", {
            required: "Address is required",
            minLength: { value: 2, message: "Minimum 2 characters" },
            maxLength: { value: 200, message: "Maximum 200 characters" },
          })}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiSelectAutocomplete
          label="Organization Size"
          options={ORGANIZATION_SIZES}
          fullWidth
          size="small"
          startAdornment={<BusinessIcon fontSize="small" color="primary" />}
          error={!!errors.organizationSize}
          helperText={errors.organizationSize?.message}
          value={getValues("organizationSize") || ""}
          {...registerField("organizationSize", {
            required: "Organization size is required",
          })}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiSelectAutocomplete
          label="Industry"
          options={INDUSTRIES}
          fullWidth
          size="small"
          startAdornment={<WorkIcon fontSize="small" color="primary" />}
          error={!!errors.organizationIndustry}
          helperText={errors.organizationIndustry?.message}
          value={getValues("organizationIndustry") || ""}
          {...registerField("organizationIndustry", {
            required: "Industry is required",
          })}
        />
      </Grid>
    </Grid>
  );

  const renderUserStep = () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiTextField
          label="First Name"
          fullWidth
          size="small"
          startAdornment={<PersonIcon fontSize="small" color="primary" />}
          error={!!errors.firstName}
          helperText={errors.firstName?.message}
          {...registerField("firstName", {
            required: "First name is required",
            minLength: { value: 2, message: "Minimum 2 characters" },
            maxLength: { value: 50, message: "Maximum 50 characters" },
            pattern: {
              value: /^[a-zA-Z]+$/,
              message: "Only letters allowed",
            },
          })}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiTextField
          label="Last Name"
          fullWidth
          size="small"
          startAdornment={<PersonIcon fontSize="small" color="primary" />}
          error={!!errors.lastName}
          helperText={errors.lastName?.message}
          {...registerField("lastName", {
            required: "Last name is required",
            minLength: { value: 2, message: "Minimum 2 characters" },
            maxLength: { value: 50, message: "Maximum 50 characters" },
            pattern: {
              value: /^[a-zA-Z]+$/,
              message: "Only letters allowed",
            },
          })}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <MuiTextField
          label="Email Address"
          type="email"
          fullWidth
          size="small"
          autoComplete="email"
          startAdornment={<EmailIcon fontSize="small" color="primary" />}
          error={!!errors.userEmail}
          helperText={errors.userEmail?.message}
          {...registerField("userEmail", {
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
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiTextField
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
          error={!!errors.password}
          helperText={errors.password?.message}
          {...registerField("password", {
            required: "Password is required",
            minLength: { value: 8, message: "Minimum 8 characters" },
          })}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiTextField
          label="Confirm Password"
          type={showPassword ? "text" : "password"}
          fullWidth
          size="small"
          startAdornment={<LockIcon fontSize="small" color="primary" />}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword?.message}
          {...registerField("confirmPassword", {
            required: "Please confirm your password",
            validate: (value) => {
              const password = getValues("password");
              return value === password || "Passwords do not match";
            },
          })}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiTextField
          label="Position"
          fullWidth
          size="small"
          startAdornment={<WorkIcon fontSize="small" color="primary" />}
          error={!!errors.position}
          helperText={errors.position?.message}
          {...registerField("position", {
            required: "Position is required",
            minLength: { value: 2, message: "Minimum 2 characters" },
            maxLength: { value: 50, message: "Maximum 50 characters" },
            pattern: {
              value: /^[a-zA-Z\s]+$/,
              message: "Only letters and spaces allowed",
            },
          })}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <MuiTextField
          label="Department Name"
          fullWidth
          size="small"
          startAdornment={<DepartmentIcon fontSize="small" color="primary" />}
          error={!!errors.departmentName}
          helperText={errors.departmentName?.message}
          {...registerField("departmentName", {
            required: "Department name is required",
            minLength: { value: 2, message: "Minimum 2 characters" },
            maxLength: { value: 50, message: "Maximum 50 characters" },
          })}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <MuiTextField
          label="Department Description"
          fullWidth
          size="small"
          multiline
          rows={3}
          error={!!errors.departmentDesc}
          helperText={errors.departmentDesc?.message}
          {...registerField("departmentDesc", {
            required: "Department description is required",
            maxLength: { value: 200, message: "Maximum 200 characters" },
          })}
        />
      </Grid>
    </Grid>
  );

  const renderReviewStep = () => {
    const values = getValues();
    return (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }} justifyItems="center">
          <Typography variant="h6" gutterBottom>
            Organization Details
          </Typography>
          <Box sx={{ pl: 2, mb: 2 }}>
            <Typography variant="body2">
              <strong>Name:</strong> {values.organizationName}
            </Typography>
            <Typography variant="body2">
              <strong>Email:</strong> {values.organizationEmail}
            </Typography>
            <Typography variant="body2">
              <strong>Phone:</strong> {values.organizationPhone}
            </Typography>
            <Typography variant="body2">
              <strong>Address:</strong> {values.organizationAddress}
            </Typography>
            <Typography variant="body2">
              <strong>Size:</strong> {values.organizationSize}
            </Typography>
            <Typography variant="body2">
              <strong>Industry:</strong> {values.organizationIndustry}
            </Typography>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }} justifyItems="center">
          <Typography variant="h6" gutterBottom>
            Admin User Details
          </Typography>
          <Box sx={{ pl: 2, mb: 2 }}>
            <Typography variant="body2">
              <strong>Name:</strong> {values.firstName} {values.lastName}
            </Typography>
            <Typography variant="body2">
              <strong>Position:</strong> {values.position}
            </Typography>
            <Typography variant="body2">
              <strong>Email:</strong> {values.userEmail}
            </Typography>
            <Typography variant="body2">
              <strong>Department:</strong> {values.departmentName}
            </Typography>
            <Typography variant="body2">
              <strong>Department Description:</strong> {values.departmentDesc}
            </Typography>
          </Box>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Alert severity="info">
            By registering, you will become the SuperAdmin of your organization
            with full administrative privileges.
          </Alert>
        </Grid>
      </Grid>
    );
  };

  const renderSubmitStep = () => {
    return (
      <Grid container spacing={3} justifyContent="center">
        <Grid size={{ xs: 12 }}>
          <Box textAlign="center" py={4}>
            <Typography variant="h5" gutterBottom color="primary.main">
              Ready to Create Your Organization
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Click the button below to create your organization and admin
              account.
            </Typography>
            <Alert severity="success" sx={{ mb: 3 }}>
              Your organization will be created with the details you provided.
              You will become the SuperAdmin with full access.
            </Alert>
          </Box>
        </Grid>
      </Grid>
    );
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return renderOrganizationStep();
      case 1:
        return renderUserStep();
      case 2:
        return renderReviewStep();
      case 3:
        return renderSubmitStep();
      default:
        return "Unknown step";
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "background.default",
        py: 4,
        px: 1,
      }}
    >
      <Card
        variant="outlined"
        sx={{
          maxWidth: 800,
          width: "100%",
          boxShadow: 2,
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <BusinessIcon
              sx={{
                fontSize: 48,
                color: "primary.main",
                mb: 2,
              }}
            />
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              color="text.primary"
              fontWeight={600}
            >
              Create Organization
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Set up your organization and create your admin account
            </Typography>
          </Box>

          <Stepper
            activeStep={activeStep}
            sx={{
              mb: 4,
              "& .MuiStepLabel-root .Mui-completed": {
                color: "success.main",
              },
              "& .MuiStepLabel-root .Mui-active": {
                color: "primary.main",
              },
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            {getStepContent(activeStep)}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: "flex", flexDirection: "row", pt: 3 }}>
              <Button
                color="inherit"
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{
                  mr: 1,
                  py: 1.5,
                  px: 3,
                  fontSize: "1rem",
                }}
              >
                Back
              </Button>
              <Box sx={{ flex: "1 1 auto" }} />
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  color="secondary"
                  type="submit"
                  disabled={isLoading}
                  startIcon={
                    isLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : null
                  }
                  sx={{
                    py: 1.5,
                    px: 4,
                    fontSize: "1rem",
                    fontWeight: 600,
                  }}
                >
                  {isLoading
                    ? "Creating Organization..."
                    : "Create Organization"}
                </Button>
              ) : activeStep === 2 ? (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleNext}
                  sx={{
                    py: 1.5,
                    px: 3,
                    fontSize: "1rem",
                    fontWeight: 600,
                  }}
                >
                  Proceed to Submit
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleNext}
                  sx={{
                    py: 1.5,
                    px: 3,
                    fontSize: "1rem",
                    fontWeight: 600,
                  }}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>

          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{" "}
              <Link
                to="/login"
                style={{
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                <Typography
                  component="span"
                  variant="body2"
                  color="primary.main"
                  sx={{
                    fontWeight: 600,
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  Sign in here
                </Typography>
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Register;
