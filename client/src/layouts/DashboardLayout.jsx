// client/src/layouts/DashboardLayout.jsx
import { Outlet, useNavigate, useLocation } from "react-router";
import React, { useState } from "react";
import { handleRTKError } from "../utils/errorHandler";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PeopleIcon from "@mui/icons-material/People";
import InventoryIcon from "@mui/icons-material/Inventory";
import StoreIcon from "@mui/icons-material/Store";
import BusinessIcon from "@mui/icons-material/Business";
import GroupsIcon from "@mui/icons-material/Groups";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import { useAuth } from "../hooks/useAuth";
import { LoadingFallback } from "../components/common/MuiLoading";

const drawerWidth = 240;

const DashboardLayout = () => {
  console.log("DashboardLayout");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isHod, isSuperAdmin, isPlatformUser } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      navigate("/", { replace: true });
    } catch (error) {
      // Use global error handler for consistent error handling
      handleRTKError(error, "Logout failed. Please try again.");
    }
    handleUserMenuClose();
  };

  // Define menu sections based on user roles
  const menuSections = React.useMemo(() => {
    const sections = [];

    // Section 1: Core Features (accessible by all users)
    sections.push({
      title: "Workspace",
      items: [
        { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
        { text: "Tasks", icon: <AssignmentIcon />, path: "/tasks" },
        { text: "Users", icon: <PeopleIcon />, path: "/users" },
      ],
    });

    // Section 2: Resource Management (accessible by HODs only)
    if (isHod) {
      sections.push({
        title: "Resources",
        items: [
          { text: "Materials", icon: <InventoryIcon />, path: "/materials" },
          { text: "Vendors", icon: <StoreIcon />, path: "/vendors" },
        ],
      });
    }

    // Section 3: Organization Management (accessible by SuperAdmins)
    if (isSuperAdmin) {
      sections.push({
        title: "Administration",
        items: [
          {
            text: "Organization",
            icon: <BusinessIcon />,
            path: "/organization",
          },
          { text: "Departments", icon: <GroupsIcon />, path: "/departments" },
          { text: "Users", icon: <PeopleIcon />, path: "/admin/users" },
        ],
      });
    }

    // Section 4: Platform Management (accessible by Platform SuperAdmins only)
    if (isPlatformUser && isSuperAdmin) {
      sections.push({
        title: "Platform",
        items: [
          {
            text: "Organizations",
            icon: <CorporateFareIcon />,
            path: "/platform/organizations",
          },
        ],
      });
    }

    return sections;
  }, [isHod, isSuperAdmin, isPlatformUser]);

  const handleMenuClick = (path) => {
    // Use startTransition for smoother navigation
    React.startTransition(() => {
      navigate(path);
    });
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  const handleOrganizationClick = () => {
    // Navigate to dashboard and close drawer on mobile
    React.startTransition(() => {
      navigate("/dashboard");
    });
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const drawer = React.useMemo(
    () => (
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Organization Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: "divider",
            cursor: "pointer",
            "&:hover": {
              backgroundColor: "action.hover",
            },
          }}
          onClick={handleOrganizationClick}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Organization Logo */}
            <Avatar
              src={user?.organization?.logoUrl?.url || ""}
              sx={{
                width: 40,
                height: 40,
                bgcolor: "primary.main",
                fontSize: "1.2rem",
                fontWeight: 600,
              }}
            >
              {user?.organization?.name?.[0]?.toUpperCase() || "O"}
            </Avatar>

            {/* Organization Name */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.organization?.name
                  ?.split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "block",
                }}
              >
                {user?.role}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Navigation Menu */}
        <Box sx={{ flex: 1, overflow: "auto", pt: 2 }}>
          {menuSections.map((section, sectionIndex) => (
            <List
              key={section.title}
              subheader={
                <ListSubheader
                  component="div"
                  sx={{
                    bgcolor: "transparent",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    color: "text.secondary",
                    lineHeight: "32px",
                  }}
                >
                  {section.title}
                </ListSubheader>
              }
              sx={{ py: 0 }}
            >
              {section.items.map((item) => (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    selected={isActive(item.path)}
                    onClick={() => handleMenuClick(item.path)}
                    sx={{
                      mx: 1,
                      borderRadius: 1,
                      "&.MuiListItemButton-root.Mui-selected": {
                        backgroundColor: "primary.main",
                        color: "primary.contrastText",
                        "&:hover": {
                          backgroundColor: "primary.dark",
                        },
                      },
                      "&:not(.Mui-selected):hover": {
                        backgroundColor: "action.hover",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: isActive(item.path)
                          ? "primary.contrastText"
                          : "inherit",
                        minWidth: 40,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: "0.875rem",
                        fontWeight: isActive(item.path) ? 600 : 400,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          ))}
        </Box>
      </Box>
    ),
    [
      location.pathname,
      handleMenuClick,
      handleOrganizationClick,
      menuSections,
      user,
    ]
  );

  const pageTitle = React.useMemo(() => {
    // Find current item across all sections
    for (const section of menuSections) {
      const currentItem = section.items.find((item) => isActive(item.path));
      if (currentItem) {
        return currentItem.text;
      }
    }
    return "Dashboard";
  }, [location.pathname, menuSections]);

  return (
    <Box sx={{ flex: 1, display: "flex", height: "100%" }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {pageTitle}
          </Typography>

          {/* User Menu */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* <Typography
              variant="body2"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              {user?.fullName}
            </Typography> */}
            <IconButton
              color="inherit"
              onClick={handleUserMenuOpen}
              aria-label="user menu"
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.firstName?.[0]}
                {/* {user?.lastName?.[0]} */}
              </Avatar>
            </IconButton>
          </Box>

          {/* User Menu Dropdown */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleUserMenuClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          >
            <MenuItem disabled>
              <Box>
                <Typography variant="subtitle2">{user?.fullName}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  {user?.role} • {user?.organization?.name}
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
          height: "100%",
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              height: "100%",
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              height: "100%",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Toolbar />
        <Box sx={{ flex: 1, overflow: "auto", p: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
