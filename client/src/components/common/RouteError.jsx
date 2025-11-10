// client/src/components/common/RouteError.jsx
import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Home as HomeIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import {
  handleError,
  displayError,
  isAuthError,
  isNetworkError,
} from "../../utils/errorHandler";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES, UI_MESSAGES } from "../../utils/constants.js";

const RouteError = ({ error, isError, isLoading, onRetry }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  console.log("isLoading", isLoading);

  if (isLoading) {
    return (
      <Box
        sx={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isError || !error) {
    return null;
  }

  const appError = handleError(error, {
    context: {
      component: "RouteError",
      userAuthenticated: isAuthenticated,
    },
  });

  // Display toast notification for operational errors
  if (appError.shouldDisplay()) {
    displayError(appError);
  }

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    navigate(ROUTES.HOME);
  };

  const handleGoToLogin = () => {
    navigate(ROUTES.LOGIN);
  };

  const isAuth = isAuthError(appError);
  const isNetwork = isNetworkError(appError);

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 500,
          width: "100%",
          boxShadow: 2,
          border: 1,
          borderColor: "warning.light",
        }}
      >
        <CardContent sx={{ p: 3, textAlign: "center" }}>
          <WarningIcon
            sx={{
              fontSize: 48,
              color: "warning.main",
              mb: 2,
            }}
          />

          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            color="text.primary"
            fontWeight={600}
          >
            {isAuth
              ? UI_MESSAGES.ERRORS.AUTHENTICATION_REQUIRED
              : UI_MESSAGES.ERRORS.UNABLE_TO_LOAD}
          </Typography>

          <Alert
            severity={isAuth ? "error" : "warning"}
            sx={{ mb: 3, justifyContent: "center" }}
          >
            <Typography variant="body2">
              {isAuth
                ? UI_MESSAGES.ERRORS.SESSION_EXPIRED
                : isNetwork
                ? UI_MESSAGES.ERRORS.NETWORK_ERROR
                : "Failed to load the requested content."}
            </Typography>
          </Alert>

          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            {isAuth ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleGoToLogin}
                size="large"
              >
                {UI_MESSAGES.ACTIONS.GO_TO_LOGIN}
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={handleRetry}
                  size="large"
                >
                  {UI_MESSAGES.ACTIONS.TRY_AGAIN}
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<HomeIcon />}
                  onClick={handleGoHome}
                  size="large"
                >
                  {UI_MESSAGES.ACTIONS.GO_HOME}
                </Button>
              </>
            )}
          </Box>

          {!isAuth && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 2, display: "block" }}
            >
              Error: {appError.message}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default RouteError;
