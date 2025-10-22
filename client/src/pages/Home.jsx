import { Card, CardContent, Typography, Button, Box } from "@mui/material";
import { Link } from "react-router";

const Home = () => {
  console.log("Home");
  return (
    <Card
      variant="outlined"
      sx={{
        maxWidth: 600,
        width: "100%",
        boxShadow: 2,
        mx: "auto",
      }}
    >
      <CardContent sx={{ p: { xs: 3, sm: 4 }, textAlign: "center" }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          color="text.primary"
          fontWeight={600}
        >
          Task Manager
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Streamline your workflow with powerful task management
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Button
            component={Link}
            to="/login"
            variant="contained"
            color="primary"
            size="large"
          >
            Sign In
          </Button>
          <Button
            component={Link}
            to="/register"
            variant="outlined"
            color="primary"
            size="large"
          >
            Create Organization
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Home;
