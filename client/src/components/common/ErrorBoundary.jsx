// client/src/components/common/ErrorBoundary.jsx
import { useRouteError } from "react-router";
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Collapse,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import {
  handleError,
  logError,
  isFrontendError,
  isAuthError,
} from "../../utils/errorHandler";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES, UI_MESSAGES } from "../../utils/constants.js";

const ErrorBoundary = () => {
  const error = useRouteError();
  const { isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [expanded, setExpanded] = useState(false);
  const [appError, setAppError] = useState(null);

  useEffect(() => {
    const normalizedError = handleError(error, {
      context: {
        component: "ErrorBoundary",
        boundaryType: "react-router",
        route: window.location.pathname,
        userAuthenticated: isAuthenticated,
      },
    });

    setAppError(normalizedError);
    logError(normalizedError);
  }, [error, isAuthenticated]);

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = ROUTES.HOME;
  };

  const handleExpand = () => {
    setExpanded(!expanded);
  };

  if (!appError) {
    return null;
  }

  const isDevelopment = import.meta.env.DEV;
  const isFrontend = isFrontendError(appError);
  const isAuth = isAuthError(appError);

  // User-friendly messages for production
  const getUserFriendlyMessage = () => {
    if (isAuth) {
      return UI_MESSAGES.ERRORS.SESSION_EXPIRED;
    }

    if (isFrontend) {
      return (
        UI_MESSAGES.ERRORS.SOMETHING_WENT_WRONG +
        ". Please try refreshing the page."
      );
    }

    return (
      "An unexpected error occurred. " + UI_MESSAGES.ERRORS.PLEASE_TRY_AGAIN
    );
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        py: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 600,
          width: "100%",
          boxShadow: 3,
          border: 1,
          borderColor: "error.light",
          m: "auto",
        }}
      >
        <CardContent>
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <ErrorIcon
              sx={{
                fontSize: 64,
                color: "error.main",
                mb: 2,
              }}
            />
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              color="error.main"
              fontWeight={600}
            >
              {isDevelopment
                ? "Application Error"
                : "Oops! " + UI_MESSAGES.ERRORS.SOMETHING_WENT_WRONG}
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {isDevelopment ? appError.message : getUserFriendlyMessage()}
            </Typography>
          </Box>

          {/* Development Details */}
          {isDevelopment && (
            <>
              <Alert
                severity="error"
                sx={{ mb: 2 }}
                action={
                  <IconButton
                    size="small"
                    onClick={handleExpand}
                    aria-expanded={expanded}
                    aria-label="show more"
                  >
                    <ExpandMoreIcon />
                  </IconButton>
                }
              >
                <Typography variant="subtitle2" fontWeight={600}>
                  {appError.errorCode} • {appError.type.toUpperCase()}
                </Typography>
              </Alert>

              <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: 1,
                    borderColor: "divider",
                    mb: 3,
                    maxHeight: 200,
                    overflow: "auto",
                  }}
                >
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{
                      fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                      fontSize: "0.75rem",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {appError.originalError?.stack ||
                      "No stack trace available"}
                  </Typography>
                </Box>

                {/* Error Context */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                    Error Context:
                  </Typography>
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{
                      fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                      fontSize: "0.75rem",
                      p: 1,
                      borderRadius: 1,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {JSON.stringify(appError.context, null, 2)}
                  </Typography>
                </Box>
              </Collapse>
            </>
          )}

          {/* Action Buttons */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "center",
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={handleReload}
              size="large"
              fullWidth={isMobile}
            >
              {UI_MESSAGES.ACTIONS.RELOAD_PAGE}
            </Button>

            <Button
              variant="outlined"
              color="primary"
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
              size="large"
              fullWidth={isMobile}
            >
              {UI_MESSAGES.ACTIONS.GO_HOME}
            </Button>
          </Box>

          {/* Additional Help Text for Production */}
          {!isDevelopment && (
            <Box sx={{ textAlign: "center", mt: 3 }}>
              <Typography variant="caption" color="text.secondary">
                If the problem persists, please contact support.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ErrorBoundary;
