// src/pages/Register.jsx
import { Link } from "react-router";
import { Box, Card, CardContent, Typography } from "@mui/material";
import RegisterForm from "../components/forms/auth/RegisterForm";

const Register = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "background.default",
        py: 4,
        px: 1,
        position: "relative",
      }}
    >
      <Card
        variant="outlined"
        sx={{
          maxWidth: 800,
          width: "100%",
          boxShadow: 2,
          mb: { xs: 8, sm: 0 },
        }}
      >
        <CardContent sx={{ p: { sm: 2 } }}>
          <RegisterForm />

          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{" "}
              <Link
                to="/login"
                style={{
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                <Typography
                  component="span"
                  variant="body2"
                  color="primary.main"
                  sx={{
                    fontWeight: 600,
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  Sign in here
                </Typography>
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Register;
