// src/pages/ForgotPassword.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { handleRTKError } from "../utils/errorHandler";
import {
  Button,
  Box,
  Typography,
  Alert,
  Card,
  CardContent,
  IconButton,
  Divider,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import MuiTextField from "../components/common/MuiTextField";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LockResetIcon from "@mui/icons-material/LockReset";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import { useAuth } from "../hooks/useAuth";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const {
    isAuthenticated,
    isLoading,
    error,
    forgotPassword: forgotPasswordAction,
    resetPassword: resetPasswordAction,
  } = useAuth();

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const [activeStep, setActiveStep] = useState(token ? 1 : 0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Form for email step
  const {
    // control: emailControl,
    register: emailControl,
    handleSubmit: handleSubmitEmail,
    formState: { isDirty: emailIsDirty, isValid: emailIsValid, isSubmitting },
    setFocus: setEmailFocus,
  } = useForm({
    mode: "onChange",
    defaultValues: { email: "" },
  });

  // Form for password reset step
  const {
    register: resetControl,
    handleSubmit: handleSubmitReset,
    formState: { isDirty: resetIsDirty, isValid: resetIsValid },
    setFocus: setResetFocus,
    getValues,
  } = useForm({
    mode: "onChange",
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  // Focus management
  useEffect(() => {
    if (activeStep === 0 && !emailSent) {
      setEmailFocus("email");
    } else if (activeStep === 1 && token) {
      setResetFocus("newPassword");
    }
  }, [activeStep, emailSent, token, setEmailFocus, setResetFocus]);

  // Handle password visibility toggles
  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleClickShowConfirmPassword = () =>
    setShowConfirmPassword((show) => !show);
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  // Handle forgot password request
  const onSubmitEmail = async ({ email }) => {
    try {
      const result = await forgotPasswordAction({ email }).unwrap();

      toast.success(
        result.message ||
          "Password reset link has been sent to your email address."
      );
      setEmailSent(true);
      setActiveStep(1);
    } catch (err) {
      // Use global error handler for consistent error handling
      handleRTKError(
        err,
        "Failed to send reset email. Please check your email address and try again."
      );
    }
  };

  // Handle password reset
  const onSubmitReset = async ({ newPassword, confirmPassword }) => {
    try {
      const result = await resetPasswordAction({
        token,
        newPassword,
        confirmPassword,
      }).unwrap();

      toast.success(result.message || "Password has been reset successfully!");
      setResetSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login", {
          state: {
            message:
              "Password reset successful. Please login with your new password.",
          },
        });
      }, 3000);
    } catch (err) {
      // Use global error handler for consistent error handling
      handleRTKError(
        err,
        "Failed to reset password. Please check your token and try again."
      );
    }
  };

  const steps = ["Request Reset", "Reset Password"];

  // Success screen after password reset
  if (resetSuccess) {
    return (
      <Card
        variant="outlined"
        sx={{
          maxWidth: 420,
          width: "100%",
          boxShadow: 2,
          mx: "auto",
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 }, textAlign: "center" }}>
          <CheckCircleIcon
            sx={{
              fontSize: 64,
              color: "success.main",
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
            Password Reset Successful!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Your password has been successfully reset. You will be redirected to
            the login page shortly.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/login")}
            sx={{ mt: 2 }}
          >
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      variant="outlined"
      sx={{
        maxWidth: 480,
        width: "100%",
        boxShadow: 2,
        mx: "auto",
      }}
    >
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <LockResetIcon
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
            {activeStep === 0 ? "Forgot Password?" : "Reset Password"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {activeStep === 0
              ? "Enter your email address and we'll send you a link to reset your password."
              : "Enter your new password below."}
          </Typography>
        </Box>

        {/* Progress Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 0: Email Request Form */}
        {activeStep === 0 && (
          <Box
            component="form"
            onSubmit={handleSubmitEmail(onSubmitEmail)}
            noValidate
          >
            <MuiTextField
              {...emailControl("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Please enter a valid email address",
                },
              })}
              label="Email Address"
              type="email"
              fullWidth
              size="small"
              margin="normal"
              autoComplete="email"
              startAdornment={<EmailIcon fontSize="small" color="primary" />}
            />

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {typeof error === "string"
                  ? error
                  : error?.message || "An error occurred"}
              </Alert>
            )}

            {/* Email Sent Success */}
            {emailSent && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Password reset link has been sent to your email address. Please
                check your inbox and follow the instructions.
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              type="submit"
              disabled={
                isSubmitting || !emailIsDirty || !emailIsValid || emailSent
              }
              sx={{
                mt: 3,
                py: 1.5,
                fontSize: "1rem",
                fontWeight: 600,
              }}
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={20} color="inherit" />
                ) : null
              }
            >
              {isSubmitting
                ? "Sending..."
                : emailSent
                ? "Email Sent"
                : "Send Reset Link"}
            </Button>
          </Box>
        )}

        {/* Step 1: Password Reset Form */}
        {activeStep === 1 && token && (
          <Box
            component="form"
            onSubmit={handleSubmitReset(onSubmitReset)}
            noValidate
          >
            {/* New Password Field */}
            <MuiTextField
              {...resetControl("newPassword", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              })}
              label="New Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              size="small"
              margin="normal"
              autoComplete="new-password"
              startAdornment={<LockIcon fontSize="small" color="primary" />}
              endAdornment={
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                  size="small"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <VisibilityOff fontSize="small" />
                  ) : (
                    <Visibility fontSize="small" />
                  )}
                </IconButton>
              }
            />

            {/* Confirm Password Field */}
            <MuiTextField
              {...resetControl("confirmPassword", {
                required: "confirm password is required",
                minLength: {
                  value: 8,
                  message: "confirm password must be at least 8 characters",
                },
                validate: (value) =>
                  value === getValues("newPassword") ||
                  "Passwords do not match",
              })}
              label="Confirm New Password"
              type={showConfirmPassword ? "text" : "password"}
              fullWidth
              size="small"
              margin="normal"
              autoComplete="new-password"
              startAdornment={<LockIcon fontSize="small" color="primary" />}
              endAdornment={
                <IconButton
                  aria-label="toggle confirm password visibility"
                  onClick={handleClickShowConfirmPassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                  size="small"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <VisibilityOff fontSize="small" />
                  ) : (
                    <Visibility fontSize="small" />
                  )}
                </IconButton>
              }
            />

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {typeof error === "string"
                  ? error
                  : error?.message || "An error occurred"}
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              type="submit"
              disabled={isSubmitting || !resetIsDirty || !resetIsValid}
              sx={{
                mt: 3,
                py: 1.5,
                fontSize: "1rem",
                fontWeight: 600,
              }}
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={20} color="inherit" />
                ) : null
              }
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>
          </Box>
        )}

        {/* Invalid Token Message */}
        {activeStep === 1 && !token && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Invalid or missing reset token. Please request a new password reset
            link.
          </Alert>
        )}

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            OR
          </Typography>
        </Divider>

        {/* Back to Login Link */}
        <Box sx={{ textAlign: "center" }}>
          <Link
            to="/login"
            style={{
              color: "inherit",
              textDecoration: "none",
            }}
          >
            <Button
              variant="text"
              startIcon={<ArrowBackIcon />}
              sx={{
                color: "primary.main",
                "&:hover": {
                  backgroundColor: "primary.light",
                  color: "primary.contrastText",
                },
              }}
            >
              Back to Login
            </Button>
          </Link>
        </Box>

        {/* Additional Help */}
        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">
            Still having trouble? Contact your organization administrator for
            assistance.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ForgotPassword;
