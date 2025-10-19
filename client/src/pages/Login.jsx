// src/pages/Login.jsx
import { Box, Card, CardContent } from "@mui/material";
import LoginForm from "../components/forms/auth/LoginForm";

const Login = () => {
  console.log("Login");

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "background.default",
        px: 1,
        py: 2,
      }}
    >
      <Card
        variant="outlined"
        sx={{
          maxWidth: 420,
          width: "100%",
          boxShadow: 2,
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <LoginForm />
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
