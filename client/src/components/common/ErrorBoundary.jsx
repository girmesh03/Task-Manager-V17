// src/components/common/ErrorBoundary.jsx
import { Component } from "react";
import { Box, Typography, Button, Alert, Collapse, Chip } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import HomeIcon from "@mui/icons-material/Home";
import { handleError, ERROR_CODES } from "../../utils/errorHandler";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      appError: null,
      showDetails: false,
      errorCount: 0,
    };
  }

  // eslint-disable-next-line no-unused-vars
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Normalize error using global error handler
    const appError = handleError(error, {
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    });

    this.setState((prevState) => ({
      error,
      errorInfo,
      appError,
      errorCount: prevState.errorCount + 1,
    }));

    // Prevent infinite error loops
    if (this.state.errorCount > 3) {
      console.error(
        "Too many errors caught by ErrorBoundary. Stopping error handling."
      );
      return;
    }

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      appError: null,
      showDetails: false,
    });

    // Call optional retry callback
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  toggleDetails = () => {
    this.setState((prevState) => ({
      showDetails: !prevState.showDetails,
    }));
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isDevelopment = import.meta.env.DEV;
    const { error, errorInfo, appError, showDetails, errorCount } = this.state;
    const {
      title,
      fallbackMessage,
      showHomeButton = true,
      showReloadButton = true,
    } = this.props;

    // If too many errors, show critical error screen
    if (errorCount > 3) {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "400px",
            padding: 3,
            gap: 2,
          }}
        >
          <Alert severity="error" sx={{ maxWidth: 600 }}>
            <Typography variant="h6" gutterBottom>
              Critical Error
            </Typography>
            <Typography variant="body2">
              Multiple errors have occurred. Please reload the application.
            </Typography>
          </Alert>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Reload Application
          </Button>
        </Box>
      );
    }

    // Get user-friendly message
    const displayTitle =
      title || appError?.getUserMessage() || "Something went wrong";
    const displayMessage =
      fallbackMessage ||
      "An unexpected error occurred. Please try again or contact support if the problem persists.";

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
          padding: 3,
          gap: 2,
        }}
      >
        {/* Error Code Chip */}
        {appError && (
          <Chip
            label={`Error: ${appError.errorCode}`}
            color="error"
            variant="outlined"
            size="small"
          />
        )}

        <Alert
          severity="error"
          sx={{
            width: "100%",
            maxWidth: 600,
            "& .MuiAlert-message": { width: "100%" },
          }}
        >
          <Typography variant="h6" gutterBottom>
            {displayTitle}
          </Typography>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            {displayMessage}
          </Typography>

          {/* Error Metadata */}
          {appError && isDevelopment && (
            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
              >
                Type: {appError.type} | Severity: {appError.severity}
              </Typography>
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
              >
                Timestamp: {new Date(appError.timestamp).toLocaleString()}
              </Typography>
            </Box>
          )}

          {/* Development Error Details */}
          {isDevelopment && error && (
            <Box sx={{ mt: 2 }}>
              <Button
                size="small"
                onClick={this.toggleDetails}
                startIcon={
                  showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />
                }
                sx={{ mb: 1 }}
              >
                {showDetails ? "Hide" : "Show"} Error Details
              </Button>

              <Collapse in={showDetails}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.default",
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Error Message:
                  </Typography>
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{
                      display: "block",
                      mb: 2,
                      fontSize: "0.75rem",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {error.toString()}
                  </Typography>

                  {appError?.context &&
                    Object.keys(appError.context).length > 0 && (
                      <>
                        <Typography variant="subtitle2" gutterBottom>
                          Error Context:
                        </Typography>
                        <Typography
                          variant="caption"
                          component="pre"
                          sx={{
                            display: "block",
                            mb: 2,
                            fontSize: "0.75rem",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {JSON.stringify(appError.context, null, 2)}
                        </Typography>
                      </>
                    )}

                  {errorInfo?.componentStack && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        Component Stack:
                      </Typography>
                      <Typography
                        variant="caption"
                        component="pre"
                        sx={{
                          display: "block",
                          fontSize: "0.75rem",
                          fontFamily: "monospace",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          maxHeight: "200px",
                          overflow: "auto",
                        }}
                      >
                        {errorInfo.componentStack}
                      </Typography>
                    </>
                  )}

                  {error?.stack && (
                    <>
                      <Typography
                        variant="subtitle2"
                        gutterBottom
                        sx={{ mt: 2 }}
                      >
                        Stack Trace:
                      </Typography>
                      <Typography
                        variant="caption"
                        component="pre"
                        sx={{
                          display: "block",
                          fontSize: "0.75rem",
                          fontFamily: "monospace",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          maxHeight: "200px",
                          overflow: "auto",
                        }}
                      >
                        {error.stack}
                      </Typography>
                    </>
                  )}
                </Box>
              </Collapse>
            </Box>
          )}
        </Alert>

        {/* Action Buttons */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={this.handleRetry}
          >
            Try Again
          </Button>

          {showReloadButton && (
            <Button variant="outlined" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          )}

          {showHomeButton && (
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={this.handleGoHome}
            >
              Go Home
            </Button>
          )}
        </Box>
      </Box>
    );
  }
}

export default ErrorBoundary;
