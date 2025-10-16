// client/src/layouts/RootLayout.jsx
import { Outlet } from "react-router";
import { useTheme } from "@mui/material/styles";
import { ToastContainer } from "react-toastify";
import Container from "@mui/material/Container";

const RootLayout = () => {
  console.log("RootLayout");
  const theme = useTheme();

  return (
    <Container maxWidth="lg" disableGutters>
      <Outlet />
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
    </Container>
  );
};

export default RootLayout;
