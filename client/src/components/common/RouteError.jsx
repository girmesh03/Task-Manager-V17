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

const RouteError = ({ error, isError, isLoading, onRetry }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

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
    navigate("/");
  };

  const handleGoToLogin = () => {
    navigate("/login");
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
            {isAuth ? "Authentication Required" : "Unable to Load Content"}
          </Typography>

          <Alert
            severity={isAuth ? "error" : "warning"}
            sx={{ mb: 3, justifyContent: "center" }}
          >
            <Typography variant="body2">
              {isAuth
                ? "Your session has expired. Please log in again."
                : isNetwork
                ? "Network connection issue. Please check your internet."
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
                Go to Login
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
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<HomeIcon />}
                  onClick={handleGoHome}
                  size="large"
                >
                  Go Home
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
