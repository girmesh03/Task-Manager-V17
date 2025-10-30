// client/src/layouts/RootLayout.jsx
import { Outlet } from "react-router";
import { useTheme } from "@mui/material/styles";
import { ToastContainer } from "react-toastify";
import { Box } from "@mui/material";

const RootLayout = () => {
  const theme = useTheme();

  return (
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
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme.palette.mode === "dark" ? "dark" : "light"}
        toastStyle={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.875rem",
          borderRadius: "4px",
        }}
      />
    </Box>
  );
};

export default RootLayout;
