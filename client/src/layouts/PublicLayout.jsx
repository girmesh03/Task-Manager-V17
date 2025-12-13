import { Outlet } from "react-router";
import { useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link } from "react-router";
import { PlatformIconLogo } from "../components/common/CustomIcons";
import { ROUTES, UI_MESSAGES } from "../utils/constants.js";

const PublicLayout = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isPortrait = useMediaQuery("(orientation: portrait)");
  const showText = !isMobile || !isPortrait;

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ flex: 1, display: "flex", height: "100%" }}>
      {/* Header */}
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          backgroundImage: "none",
          backgroundColor: "background.paper",
          color: "text.primary",
          borderBottom: 1,
          borderColor: "divider",
          zIndex: theme.zIndex.appBar,
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          {/* Logo and Brand */}
          <Box
            component={Link}
            to="/"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              textDecoration: "none",
              color: "inherit",
              "&:hover": {
                opacity: 0.8,
              },
            }}
          >
            <PlatformIconLogo />
            {showText && (
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "primary.main",
                  background:
                    "linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                TaskManager
              </Typography>
            )}
          </Box>

          {/* Navigation */}
          {isMobile && isPortrait ? (
            <>
              <IconButton
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={handleMenuOpen}
                size="small"
              >
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
              >
                <MenuItem
                  component={Link}
                  to={ROUTES.LOGIN}
                  onClick={handleMenuClose}
                  sx={{ fontWeight: 500 }}
                >
                  Sign In
                </MenuItem>
                <MenuItem
                  component={Link}
                  to={ROUTES.REGISTER}
                  onClick={handleMenuClose}
                  sx={{ fontWeight: 600, color: "primary.main" }}
                >
                  Get Started
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                component={Link}
                to={ROUTES.LOGIN}
                variant="text"
                color="primary"
                size="small"
                sx={{
                  textTransform: "none",
                  fontWeight: 500,
                  "&:hover": {
                    backgroundColor: "primary.main",
                    color: "primary.contrastText",
                  },
                }}
              >
                Sign In
              </Button>
              <Button
                component={Link}
                to={ROUTES.REGISTER}
                variant="contained"
                color="primary"
                size="small"
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  boxShadow: 2,
                  "&:hover": {
                    boxShadow: 4,
                  },
                }}
              >
                Get Started
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Main Content Area - scrollable content */}
      <Box
        component="main"
        sx={{ flex: 1, display: "flex", flexDirection: "column" }}
      >
        <Toolbar />
        <Box sx={{ flex: 1, overflow: "auto", p: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default PublicLayout;
