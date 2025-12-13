// client/src/components/cards/NotificationCard.jsx
import PropTypes from "prop-types";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const NotificationCard = ({ notification, onView, onDelete }) => {
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

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.2s",
        "&:hover": {
          boxShadow: 3,
          transform: "translateY(-4px)",
        },
        bgcolor: notification.isRead ? "background.paper" : "action.hover",
      }}
    >
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 1 }}>
          <Chip
            label={notification.type}
            size="small"
            color={getTypeColor(notification.type)}
          />
          <Chip
            label={notification.isRead ? "Read" : "Unread"}
            size="small"
            color={notification.isRead ? "default" : "primary"}
            variant={notification.isRead ? "outlined" : "filled"}
          />
        </Box>

        <Typography variant="h6" sx={{ mb: 1 }}>
          {notification.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {notification.message}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          {dayjs(notification.createdAt).fromNow()}
        </Typography>
      </CardContent>

      <CardActions sx={{ justifyContent: "flex-end" }}>
        <Tooltip title="View">
          <IconButton size="small" onClick={() => onView(notification)} color="primary">
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" onClick={() => onDelete(notification)} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

NotificationCard.propTypes = {
  notification: PropTypes.object.isRequired,
  onView: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default NotificationCard;
