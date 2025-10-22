// client/src/App.jsx
import { RouterProvider } from "react-router";
import CssBaseline from "@mui/material/CssBaseline";
import { Box } from "@mui/material";
import router from "./router/routes.jsx";
import AppTheme from "./theme/AppTheme.jsx";

const App = () => {
  return (
    <AppTheme>
      <CssBaseline />
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
    </AppTheme>
  );
};

export default App;
