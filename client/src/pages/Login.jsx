// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
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
  IconButton,
  Divider,
  CircularProgress,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import EmailIcon from "@mui/icons-material/Email";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LoginIcon from "@mui/icons-material/Login";

import { clearError, selectAuth } from "../redux/features/auth/authSlice";
import { loginUser } from "../redux/features/auth/authApi";
import { LoadingFallback } from "../components/common/MuiLoading";
import MuiTextField from "../components/common/MuiTextField";

const Login = () => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector(selectAuth);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid, isSubmitting },
    setFocus,
  } = useForm({
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  // Focus on email field when component mounts
  useEffect(() => {
    setFocus("email");
  }, [setFocus]);

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const onSubmit = async ({ email, password }) => {
    try {
      dispatch(clearError());
      await dispatch(loginUser({ email, password })).unwrap();
      toast.success("Login successful! Welcome back.");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err || "Login failed. Please try again.";
      toast.error(errorMessage);
    }
  };

  // Show loading spinner while checking auth state
  if (isLoading && !isSubmitting) return <LoadingFallback />;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "background.default",
        px: 1,
        py: 2,
      }}
    >
      <Card
        variant="outlined"
        sx={{
          maxWidth: 420,
          width: "100%",
          boxShadow: 2,
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
              label="Email Address"
              type="email"
              fullWidth
              size="small"
              margin="normal"
              autoComplete="email"
              startAdornment={<EmailIcon fontSize="small" color="primary" />}
              error={!!errors.email}
              helperText={errors.email?.message}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Please enter a valid email address",
                },
              })}
            />

            {/* Password Field */}
            <MuiTextField
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
              error={!!errors.password}
              helperText={errors.password?.message}
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              })}
            />

            {/* Login Error Alert */}
            {error && (
              <Alert
                severity="error"
                sx={{ mt: 2 }}
                onClose={() => dispatch(clearError())}
              >
                {error}
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
              disabled={isSubmitting || !isDirty || !isValid}
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
              Having trouble signing in? Contact your organization
              administrator.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
