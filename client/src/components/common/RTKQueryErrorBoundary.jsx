// client/src/components/common/RTKQueryErrorBoundary.jsx
import { Component } from "react";
import { handleAuthError, isAuthError, isRTKQueryError } from "../../utils/errorHandler";
import { Box, Typography, Button, Alert, CircularProgress } from "@mui/material";
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

/**
 * RTK Query Error Boundary Component
 * 
 * Specifically designed to catch and handle errors from RTK Query operations.
 * This should wrap components that use RTK Query hooks to ensure proper
 * error handling and authentication error processing.
 */
class RTKQueryErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error information
    console.error("RTK Query Error Boundary caught an error:", {
      error,
      errorInfo,
    });

    this.setState({
      errorInfo,
    });

    // Check if this is an RTK Query error
    const isRTKError = isRTKQueryError(error);
    
    if (!isRTKError) {
      console.warn("Non-RTK Query error caught by RTKQueryErrorBoundary:", error);
    }

    // Handle authentication errors
    if (isAuthError(error)) {
      console.log("🔐 Authentication error detected in RTK Query");
      handleAuthError(error, "rtk-query");
      
      // Don't show error UI for auth errors - they're handled by redirect
      this.setState({
        hasError: false,
      });
      return;
    }
  }

  handleRetry = async () => {
    this.setState({ isRetrying: true });
    
    try {
      // Call the onRetry prop if provided
      if (this.props.onRetry) {
        await this.props.onRetry();
      }
      
      // Reset error state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRetrying: false,
      });
    } catch (retryError) {
      console.error("Retry failed:", retryError);
      this.setState({ isRetrying: false });
    }
  };

  render() {
    const { hasError, error, errorInfo, isRetrying } = this.state;
    const { children, fallback, showRetry = true } = this.props;

    if (hasError && error) {
      // If custom fallback is provided, use it
      if (fallback) {
        return typeof fallback === 'function' ? fallback(error, this.handleRetry) : fallback;
      }

      // Default error UI for RTK Query errors
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
            minHeight: 200,
          }}
        >
          <ErrorIcon
            sx={{
              fontSize: 48,
              color: "error.main",
              mb: 2,
            }}
          />

          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            color="text.primary"
            fontWeight={600}
          >
            Something went wrong
          </Typography>

          <Alert
            severity="error"
            sx={{ mb: 2, textAlign: "center", maxWidth: 400 }}
          >
            <Typography variant="body2">
              {error?.message || "An error occurred while loading data. Please try again."}
            </Typography>
          </Alert>

          {showRetry && (
            <Button
              variant="contained"
              startIcon={isRetrying ? <CircularProgress size={20} /> : <RefreshIcon />}
              onClick={this.handleRetry}
              disabled={isRetrying}
              size="small"
            >
              {isRetrying ? "Retrying..." : "Try Again"}
            </Button>
          )}

          {/* Development-only error details */}
          {import.meta.env.DEV && errorInfo && (
            <Box sx={{ mt: 2, maxWidth: "100%", overflow: "auto" }}>
              <Typography variant="caption" color="text.secondary">
                Component Stack:
              </Typography>
              <Typography
                variant="caption"
                component="pre"
                sx={{
                  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                  fontSize: "0.7rem",
                  backgroundColor: "grey.100",
                  p: 1,
                  borderRadius: 1,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  mt: 0.5,
                }}
              >
                {errorInfo.componentStack}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }

    return children;
  }
}

export default RTKQueryErrorBoundary;