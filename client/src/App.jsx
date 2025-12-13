// client/src/App.jsx
import { RouterProvider } from "react-router";
import CssBaseline from "@mui/material/CssBaseline";
import { Box } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import router from "./router/routes.jsx";
import AppTheme from "./theme/AppTheme.jsx";
import AuthProvider from "./components/auth/AuthProvider";

const App = () => {
  return (
    <AppTheme>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CssBaseline />
        <AuthProvider>
          <Box
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "background.default",
            }}
          >
            <RouterProvider router={router} />
          </Box>
        </AuthProvider>
      </LocalizationProvider>
    </AppTheme>
  );
};

export default App;
