// src/components/auth/LoginForm.jsx
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { useForm } from "react-hook-form";
import {
  Button,
  Box,
  Typography,
  Alert,
  IconButton,
  Divider,
  CircularProgress,
  Card,
  CardContent,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import EmailIcon from "@mui/icons-material/Email";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LoginIcon from "@mui/icons-material/Login";

import { useAuth } from "../../../hooks/useAuth";
import MuiTextField from "../../common/MuiTextField";
import { handleRTKError } from "../../../utils/errorHandler";
import { MIN_PASSWORD_LENGTH, UI_MESSAGES } from "../../../utils/constants.js";

const LoginForm = () => {
  const { isLoading, error, login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid, isSubmitting },
  } = useForm({
    mode: "onTouched",
    reValidateMode: "onBlur",
    defaultValues: { email: "", password: "" },
  });

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  // Sanitize and validate return URLs to prevent open redirect vulnerabilities
  const getValidReturnUrl = (returnUrl) => {
    if (!returnUrl || typeof returnUrl !== "string") {
      return "/dashboard";
    }

    // Ensure the URL starts with '/' (relative URL) to prevent external redirects
    if (!returnUrl.startsWith("/")) {
      return "/dashboard";
    }

    // Prevent redirects to public routes after login
    const publicRoutes = [
      "/",
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
    ];
    if (publicRoutes.includes(returnUrl)) {
      return "/dashboard";
    }

    // Additional validation: ensure no protocol or domain
    if (returnUrl.includes("://") || returnUrl.includes("//")) {
      return "/dashboard";
    }

    return returnUrl;
  };

  const onSubmit = async (data) => {
    try {
      await login(data).unwrap();

      // Get return URL from location state (set by ProtectedRoute)
      const returnUrl = location.state?.returnUrl;
      const validReturnUrl = getValidReturnUrl(returnUrl);

      // Navigate to the intended destination or dashboard default
      // Using replace to maintain proper browser history during redirects
      navigate(validReturnUrl, { replace: true });
    } catch (err) {
      // console.log("login error", err);
      // Use global error handler for consistent error handling
      handleRTKError(err, "Login failed. Please check your credentials.");
    }
  };

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
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <LoginIcon
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
            Welcome Back
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Sign in to your account to continue
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          sx={{ mt: 2 }}
        >
          {/* Email Field */}
          <MuiTextField
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Please enter a valid email address",
              },
            })}
            error={errors.email}
            label="Email Address"
            type="email"
            fullWidth
            size="small"
            margin="normal"
            autoComplete="email"
            autoFocus
            startAdornment={<EmailIcon fontSize="small" color="primary" />}
          />

          {/* Password Field */}
          <MuiTextField
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: MIN_PASSWORD_LENGTH,
                message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
              },
            })}
            error={errors.password}
            label="Password"
            type={showPassword ? "text" : "password"}
            fullWidth
            size="small"
            margin="normal"
            autoComplete="current-password"
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

          {/* Login Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {typeof error === "string"
                ? error
                : error?.message || UI_MESSAGES.ERRORS.SOMETHING_WENT_WRONG}
            </Alert>
          )}

          {/* Forgot Password Link */}
          <Box sx={{ textAlign: "right", mt: 1, mb: 2 }}>
            <Link
              to="/forgot-password"
              style={{
                color: "inherit",
                textDecoration: "none",
                fontSize: "0.875rem",
              }}
            >
              <Typography
                variant="body2"
                color="primary.main"
                sx={{
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                Forgot your password?
              </Typography>
            </Link>
          </Box>

          {/* Submit Button */}
          <Button
            fullWidth
            variant="contained"
            color="secondary"
            type="submit"
            disabled={isSubmitting || isLoading || !isDirty || !isValid}
            sx={{
              mt: 2,
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
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            OR
          </Typography>
        </Divider>

        {/* Register Link */}
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{" "}
            <Link
              to="/register"
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
                Create an organization
              </Typography>
            </Link>
          </Typography>
        </Box>

        {/* Additional Help */}
        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">
            Having trouble signing in? Contact your organization administrator.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
