// client/src/App.jsx
import { RouterProvider } from "react-router";
import CssBaseline from "@mui/material/CssBaseline";
import router from "./router/routes.jsx";
import AppTheme from "./theme/AppTheme.jsx";

const App = () => {
  return (
    <AppTheme>
      <CssBaseline />
      <RouterProvider router={router} />
    </AppTheme>
  );
};

export default App;
