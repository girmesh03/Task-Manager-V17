// client/src/layouts/RootLayout.jsx
import { Outlet } from "react-router";
import { useTheme } from "@mui/material/styles";
import { ToastContainer } from "react-toastify";
import { Box } from "@mui/material";
import { ErrorBoundary } from "react-error-boundary";
import ErrorBoundaryFallback from "../components/common/ErrorBoundary";
import { TOAST_CONFIG } from "../utils/constants.js";

const RootLayout = () => {
  const theme = useTheme();

  const handleError = (error, errorInfo) => {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error("Global Error Boundary caught an error:", error, errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    // logErrorToService(error, errorInfo);
  };

  return (
    <ErrorBoundary
      FallbackComponent={ErrorBoundaryFallback}
      onError={handleError}
      onReset={() => window.location.reload()}
    >
      <Box
        sx={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Outlet />
        </Box>
        <ToastContainer
          {...TOAST_CONFIG.DEFAULT}
          theme={theme.palette.mode === "dark" ? "dark" : "light"}
          toastStyle={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.875rem",
            borderRadius: "4px",
          }}
        />
      </Box>
    </ErrorBoundary>
  );
};

export default RootLayout;
