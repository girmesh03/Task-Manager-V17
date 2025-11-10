// client/src/layouts/DashboardLayout.jsx
import { Outlet, useNavigate, useLocation } from "react-router";
import React, { useState, useCallback } from "react";
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
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SettingsIcon from "@mui/icons-material/Settings";
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
import MuiThemeDropDown from "../components/common/MuiThemeDropDown";
import GlobalSearch from "../components/common/GlobalSearch";
import NotificationMenu from "../components/common/NotificationMenu";
import SearchIcon from "@mui/icons-material/Search";
import EmailIcon from "@mui/icons-material/Email";
import { ROUTES } from "../utils/constants.js";

const drawerWidth = 240;

const DashboardLayout = () => {
  console.log("DashboardLayout");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isHod, isSuperAdmin, isPlatformUser } = useAuth();

  // Keyboard shortcut for global search (Ctrl+K or Cmd+K)
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (error) {
      // Use global error handler for consistent error handling
      // console.log("logout error dashboard", error);
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
        { text: "Dashboard", icon: <DashboardIcon />, path: ROUTES.DASHBOARD },
        { text: "Tasks", icon: <AssignmentIcon />, path: ROUTES.TASKS },
        { text: "Users", icon: <PeopleIcon />, path: ROUTES.USERS },
      ],
    });

    // Section 2: Resource Management (accessible by HODs only)
    if (isHod) {
      sections.push({
        title: "Resources",
        items: [
          {
            text: "Materials",
            icon: <InventoryIcon />,
            path: ROUTES.MATERIALS,
          },
          { text: "Vendors", icon: <StoreIcon />, path: ROUTES.VENDORS },
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
            path: ROUTES.ORGANIZATION,
          },
          {
            text: "Departments",
            icon: <GroupsIcon />,
            path: ROUTES.DEPARTMENTS,
          },
          { text: "Users", icon: <PeopleIcon />, path: ROUTES.ADMIN_USERS },
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
            path: ROUTES.PLATFORM_ORGANIZATIONS,
          },
        ],
      });
    }

    return sections;
  }, [isHod, isSuperAdmin, isPlatformUser]);

  const handleMenuClick = useCallback(
    (path) => {
      // Use startTransition for smoother navigation
      React.startTransition(() => {
        navigate(path);
      });
      if (mobileOpen) {
        setMobileOpen(false);
      }
    },
    [navigate, mobileOpen]
  );

  const handleOrganizationClick = useCallback(() => {
    // Navigate to dashboard and close drawer on mobile
    React.startTransition(() => {
      navigate(ROUTES.DASHBOARD);
    });
    if (mobileOpen) {
      setMobileOpen(false);
    }
  }, [navigate, mobileOpen]);

  const isActive = useCallback(
    (path) => {
      return location.pathname === path;
    },
    [location.pathname]
  );

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
            background:
              "linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(66, 165, 245, 0.05) 100%)",
            "&:hover": {
              backgroundColor: "action.hover",
              background:
                "linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(66, 165, 245, 0.1) 100%)",
            },
            transition: "all 0.2s ease-in-out",
          }}
          onClick={handleOrganizationClick}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Organization Logo */}
            <Avatar
              src={user?.organization?.logoUrl?.url || ""}
              sx={{
                width: 44,
                height: 44,
                bgcolor: "primary.main",
                fontSize: "1.2rem",
                fontWeight: 600,
                boxShadow: 2,
                border: 2,
                borderColor: "background.paper",
              }}
            >
              {user?.organization?.name?.[0]?.toUpperCase() || "O"}
            </Avatar>

            {/* Organization Name */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: "primary.main",
                }}
              >
                {user?.organization?.name
                  ?.split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "block",
                  color: "text.secondary",
                  fontWeight: 500,
                }}
              >
                {user?.role} • {user?.department?.name}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Navigation Menu */}
        <Box sx={{ flex: 1, overflow: "auto", py: 2 }}>
          {menuSections.map((section) => (
            <List
              key={section.title}
              subheader={
                <ListSubheader
                  component="div"
                  disableSticky
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
                      slotProps={{
                        primary: {
                          fontSize: "0.875rem",
                          fontWeight: isActive(item.path) ? 600 : 400,
                        },
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
      // location.pathname,
      handleMenuClick,
      handleOrganizationClick,
      menuSections,
      user,
      isActive,
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
  }, [menuSections, isActive]);

  return (
    <Box sx={{ flex: 1, display: "flex", height: "100%" }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundImage: "none",
          backgroundColor: "background.paper",
          color: "text.primary",
          boxShadow: 2,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={(theme) => ({
              mr: theme.spacing(1),
              display: { md: "none" },
              border: "none",
              color: (theme.vars || theme).palette.text.secondary,
            })}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {pageTitle}
          </Typography>

          {/* Right Side Actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* Global Search Button */}
            <IconButton
              color="inherit"
              onClick={() => setSearchOpen(true)}
              aria-label="search"
              sx={(theme) => ({
                transform: "translateY(2px)",
                border: "none",
                color: (theme.vars || theme).palette.text.secondary,
              })}
            >
              <SearchIcon />
            </IconButton>

            {/* Notification Menu */}
            <NotificationMenu />

            {/* Theme Switcher */}
            <MuiThemeDropDown />

            {/* User Avatar */}
            <IconButton
              color="inherit"
              onClick={handleUserMenuOpen}
              aria-label="user menu"
              // size="small"
              sx={(theme) => ({
                border: "none",
                color: (theme.vars || theme).palette.text.primary,
              })}
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
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
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, py: 1 }}
              >
                <Avatar
                  src={user?.profilePicture?.url || ""}
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: "primary.main",
                    fontSize: "1.2rem",
                    fontWeight: 600,
                  }}
                >
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {user?.fullName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.email}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="primary.main"
                    display="block"
                    fontWeight={500}
                  >
                    {user?.role} • {user?.department?.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    {user?.organization?.name}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                handleUserMenuClose();
                navigate("/profile");
              }}
            >
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Profile</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleUserMenuClose();
                navigate("/account");
              }}
            >
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Account</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleUserMenuClose();
                navigate("/email-preferences");
              }}
            >
              <ListItemIcon>
                <EmailIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Email Preferences</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleUserMenuClose();
                navigate("/settings");
              }}
            >
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>

          {/* Global Search Dialog */}
          <GlobalSearch
            open={searchOpen}
            onClose={() => setSearchOpen(false)}
          />
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
        <Box sx={{ flex: 1, overflow: "auto", p: { xs: 0.5, sm: 1 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
