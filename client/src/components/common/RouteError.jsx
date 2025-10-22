// src/components/common/RouteError.jsx
import { useRouteError, useNavigate, Link as RouterLink } from "react-router";
import { useMemo, useEffect } from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";

import HomeIcon from "@mui/icons-material/Home";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";
import InfoIcon from "@mui/icons-material/Info";

import { handleError, ERROR_CODES } from "../../utils/errorHandler";

// Error type configurations based on status codes
const ERROR_CONFIGS = {
  // 4xx Client Errors
  400: {
    title: "Bad Request",
    message:
      "The request could not be understood or was missing required parameters.",
    severity: "warning",
    icon: <WarningIcon />,
    actions: { showHome: true, showBack: true },
  },
  401: {
    title: "Unauthorized Access",
    message: "You need to log in to access this page.",
    severity: "error",
    icon: <ErrorIcon />,
    actions: {
      showHome: true,
      customAction: { label: "Go to Login", path: "/login" },
    },
  },
  403: {
    title: "Access Forbidden",
    message: "You don't have permission to access this resource.",
    severity: "error",
    icon: <ErrorIcon />,
    actions: { showHome: true, showBack: true },
  },
  404: {
    title: "Page Not Found",
    message: "The page you're looking for doesn't exist or has been moved.",
    severity: "warning",
    icon: <WarningIcon />,
    actions: { showHome: true, showBack: true },
  },
  409: {
    title: "Conflict Error",
    message: "The request conflicts with the current state of the resource.",
    severity: "warning",
    icon: <WarningIcon />,
    actions: { showHome: true, showBack: true },
  },
  429: {
    title: "Too Many Requests",
    message:
      "You've made too many requests. Please wait a moment and try again.",
    severity: "warning",
    icon: <WarningIcon />,
    actions: { showRetry: true, showHome: true },
  },

  // 5xx Server Errors
  500: {
    title: "Server Error",
    message: "Something went wrong on our end. Please try again later.",
    severity: "error",
    icon: <ErrorIcon />,
    actions: { showRetry: true, showHome: true, showBack: true },
  },
  502: {
    title: "Bad Gateway",
    message: "The server received an invalid response. Please try again later.",
    severity: "error",
    icon: <ErrorIcon />,
    actions: { showRetry: true, showHome: true },
  },
  503: {
    title: "Service Unavailable",
    message: "The service is temporarily unavailable. Please try again later.",
    severity: "error",
    icon: <ErrorIcon />,
    actions: { showRetry: true, showHome: true },
  },
  504: {
    title: "Gateway Timeout",
    message: "The server took too long to respond. Please try again.",
    severity: "error",
    icon: <ErrorIcon />,
    actions: { showRetry: true, showHome: true },
  },
};

// Error code specific configurations
const ERROR_CODE_CONFIGS = {
  [ERROR_CODES.CHUNK_LOAD_ERROR]: {
    title: "Loading Error",
    message:
      "Failed to load application resources. This might be due to a network issue or an app update.",
    severity: "warning",
    icon: <WarningIcon />,
    actions: {
      showRetry: true,
      showHome: true,
      customAction: {
        label: "Reload Application",
        action: () => window.location.reload(),
      },
    },
  },
  [ERROR_CODES.NETWORK_ERROR]: {
    title: "Network Error",
    message:
      "Unable to connect to the server. Please check your internet connection.",
    severity: "error",
    icon: <ErrorIcon />,
    actions: { showRetry: true, showHome: true },
  },
  [ERROR_CODES.TIMEOUT_ERROR]: {
    title: "Request Timeout",
    message: "The request took too long to complete. Please try again.",
    severity: "warning",
    icon: <WarningIcon />,
    actions: { showRetry: true, showHome: true },
  },
  [ERROR_CODES.VALIDATION_ERROR]: {
    title: "Validation Error",
    message:
      "The provided data is invalid. Please check your input and try again.",
    severity: "warning",
    icon: <WarningIcon />,
    actions: { showBack: true },
  },
};

const DEFAULT_ERROR_CONFIG = {
  title: "Something Went Wrong",
  message: "An unexpected error occurred while loading this page.",
  severity: "error",
  icon: <ErrorIcon />,
  actions: { showRetry: true, showHome: true, showBack: true },
};

const RouteError = () => {
  const error = useRouteError();
  const navigate = useNavigate();
  const isDevelopment = import.meta.env.DEV;

  console.log("RouteError error", error);

  // Normalize error using global error handler
  const appError = useMemo(() => {
    return handleError(error, {
      url: window.location.href,
      pathname: window.location.pathname,
      type: "route",
    });
  }, [error]);

  // Log error once when component mounts
  useEffect(() => {
    // Error is already logged by handleError
    console.log("Route error caught:", appError.toJSON());
  }, [appError]);

  // Determine error configuration
  const errorConfig = useMemo(() => {
    // Check error code first
    if (appError.errorCode && ERROR_CODE_CONFIGS[appError.errorCode]) {
      return ERROR_CODE_CONFIGS[appError.errorCode];
    }

    // Check status code
    if (appError.statusCode && ERROR_CONFIGS[appError.statusCode]) {
      return ERROR_CONFIGS[appError.statusCode];
    }

    // Check for chunk loading errors
    if (
      error?.message?.includes("Loading chunk") ||
      error?.message?.includes("ChunkLoadError") ||
      appError.errorCode === ERROR_CODES.CHUNK_LOAD_ERROR
    ) {
      return ERROR_CODE_CONFIGS[ERROR_CODES.CHUNK_LOAD_ERROR];
    }

    // Default configuration with custom message
    return {
      ...DEFAULT_ERROR_CONFIG,
      message: appError.getUserMessage() || DEFAULT_ERROR_CONFIG.message,
    };
  }, [error, appError]);

  const handleRetry = () => window.location.reload();
  const handleBack = () => navigate(-1);
  const handleHome = () => navigate("/");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 1,
        gap: 3,
      }}
    >
      <Paper elevation={1} sx={{ p: 1, maxWidth: 600, width: "100%" }}>
        {/* Error Status and Code Chips */}
        <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
          {appError.statusCode > 0 && (
            <Chip
              label={`Status ${appError.statusCode}`}
              color={errorConfig.severity}
              variant="outlined"
              icon={errorConfig.icon}
              size="small"
            />
          )}
          {appError.errorCode && (
            <Chip
              label={appError.errorCode}
              color={errorConfig.severity}
              variant="outlined"
              size="small"
            />
          )}
          {appError.type && (
            <Chip
              label={`Type: ${appError.type}`}
              variant="outlined"
              size="small"
            />
          )}
        </Box>

        <Alert
          severity={errorConfig.severity}
          icon={errorConfig.icon}
          sx={{
            mb: 3,
            textAlign: "left",
            "& .MuiAlert-message": { width: "100%" },
          }}
        >
          <Typography variant="h6" gutterBottom>
            {errorConfig.title}
          </Typography>
          <Typography variant="body2">{errorConfig.message}</Typography>

          {/* Error Metadata */}
          {isDevelopment && (
            <Box sx={{ mt: 2 }}>
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
              >
                Severity: {appError.severity} | Timestamp:{" "}
                {new Date(appError.timestamp).toLocaleString()}
              </Typography>
            </Box>
          )}
        </Alert>

        {/* Development Error Details */}
        {isDevelopment && error && (
          <Box sx={{ mb: 3 }}>
            <Divider sx={{ mb: 2 }}>
              <Chip label="Development Info" size="small" />
            </Divider>
            <Alert severity="info" icon={<InfoIcon />}>
              <Typography variant="subtitle2" gutterBottom>
                Error Details:
              </Typography>

              {/* Error Message */}
              <Typography
                variant="caption"
                component="pre"
                sx={{
                  display: "block",
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  p: 1,
                  borderRadius: 1,
                  mt: 1,
                  mb: 2,
                  bgcolor: "background.paper",
                }}
              >
                {error.message || error.toString()}
              </Typography>

              {/* Error Context */}
              {appError.context && Object.keys(appError.context).length > 0 && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Context:
                  </Typography>
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{
                      display: "block",
                      fontFamily: "monospace",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      p: 1,
                      borderRadius: 1,
                      mb: 2,
                      bgcolor: "background.paper",
                    }}
                  >
                    {JSON.stringify(appError.context, null, 2)}
                  </Typography>
                </>
              )}

              {/* Stack Trace */}
              {error.stack && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Stack Trace:
                  </Typography>
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{
                      display: "block",
                      fontFamily: "monospace",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      p: 1,
                      borderRadius: 1,
                      bgcolor: "background.paper",
                      maxHeight: "200px",
                      overflow: "auto",
                    }}
                  >
                    {error.stack}
                  </Typography>
                </>
              )}
            </Alert>
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {errorConfig.actions.showRetry && (
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleRetry}
              size="small"
            >
              Try Again
            </Button>
          )}

          {errorConfig.actions.customAction && (
            <Button
              variant="contained"
              onClick={
                errorConfig.actions.customAction.action ||
                (() => navigate(errorConfig.actions.customAction.path))
              }
              size="small"
            >
              {errorConfig.actions.customAction.label}
            </Button>
          )}

          {errorConfig.actions.showBack && (
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              size="small"
            >
              Go Back
            </Button>
          )}

          {errorConfig.actions.showHome && (
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              component={RouterLink}
              to="/"
              onClick={handleHome}
              size="small"
            >
              Home
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default RouteError;
