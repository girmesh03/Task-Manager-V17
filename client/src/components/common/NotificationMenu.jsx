// client/src/components/common/NotificationMenu.jsx
import { useState } from "react";
import { useNavigate } from "react-router";
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  Divider,
  Button,
  Chip,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CheckIcon from "@mui/icons-material/Check";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { toast } from "react-toastify";
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "../../redux/features/notification/notificationApi";
import { handleRTKError } from "../../utils/errorHandler";
import { ROUTES, PAGINATION } from "../../utils/constants";

dayjs.extend(relativeTime);

/**
 * NotificationMenu Component
 *
 * Notification menu with bell icon, unread count badge, and dropdown.
 * Displays recent notifications with mark as read functionality.
 *
 * @returns {JSX.Element}
 */
const NotificationMenu = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Fetch recent unread notifications (limit to 5 for menu preview)
  const NOTIFICATION_PREVIEW_LIMIT = 5;

  const { data: notificationsData } = useGetNotificationsQuery({
    unreadOnly: true,
    limit: NOTIFICATION_PREVIEW_LIMIT,
  });

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] =
    useMarkAllAsReadMutation();

  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.pagination?.totalCount || 0;

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      if (!notification.isRead) {
        await markAsRead(notification._id).unwrap();
      }

      // Navigate to related resource if available
      if (notification.relatedEntity && notification.relatedEntityModel) {
        const model = notification.relatedEntityModel;
        const id = notification.relatedEntity;

        // Map model to route
        const routeMap = {
          User: ROUTES.USERS,
          Department: ROUTES.DEPARTMENTS,
          RoutineTask: ROUTES.TASKS,
          AssignedTask: ROUTES.TASKS,
          ProjectTask: ROUTES.TASKS,
          Material: ROUTES.MATERIALS,
          Vendor: ROUTES.VENDORS,
        };

        const baseRoute = routeMap[model];
        if (baseRoute) {
          navigate(`${baseRoute}/${id}`);
        }
      }

      handleClose();
    } catch (error) {
      handleRTKError(error, "Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
      toast.success("All notifications marked as read");
    } catch (error) {
      handleRTKError(error, "Failed to mark all as read");
    }
  };

  const handleViewAll = () => {
    navigate("/notifications");
    handleClose();
  };

  const getTypeColor = (type) => {
    const typeColors = {
      Created: "success",
      Updated: "info",
      Deleted: "error",
      Restored: "warning",
      Mention: "secondary",
      Welcome: "primary",
      Announcement: "default",
    };
    return typeColors[type] || "default";
  };

  const getTypeIcon = (type) => {
    // You can customize icons based on type
    return type?.[0] || "N";
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleOpen}
        aria-label="notifications"
        aria-controls={open ? "notification-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        sx={(theme) => ({
          border: "none",
          color: (theme.vars || theme).palette.text.secondary,
        })}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        id="notification-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              width: 360,
              maxHeight: 480,
            },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<DoneAllIcon />}
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
            >
              Mark all read
            </Button>
          )}
        </Box>
        <Divider />

        {/* Notification List */}
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <NotificationsIcon
              sx={{ fontSize: 48, color: "text.secondary", mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              No new notifications
            </Typography>
          </Box>
        ) : (
          <>
            {notifications.map((notification) => (
              <MenuItem
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  py: 1.5,
                  px: 2,
                  alignItems: "flex-start",
                  bgcolor: notification.isRead ? "transparent" : "action.hover",
                  "&:hover": {
                    bgcolor: notification.isRead
                      ? "action.hover"
                      : "action.selected",
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: `${getTypeColor(notification.type)}.main`,
                      width: 40,
                      height: 40,
                    }}
                  >
                    {getTypeIcon(notification.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: notification.isRead ? 400 : 600 }}
                      >
                        {notification.title}
                      </Typography>
                      {!notification.isRead && (
                        <CheckIcon fontSize="small" color="primary" />
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          mb: 0.5,
                        }}
                      >
                        {notification.message}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          alignItems: "center",
                          mt: 0.5,
                        }}
                      >
                        <Chip
                          label={notification.type}
                          size="small"
                          color={getTypeColor(notification.type)}
                          sx={{ height: 20 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(notification.createdAt).fromNow()}
                        </Typography>
                      </Box>
                    </>
                  }
                />
              </MenuItem>
            ))}
            <Divider />
            <Box sx={{ p: 1, textAlign: "center" }}>
              <Button fullWidth onClick={handleViewAll}>
                View All Notifications
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationMenu;
