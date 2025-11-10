// client/src/components/cards/UserCard.jsx
import { memo } from "react";
import PropTypes from "prop-types";
import {
  Card,
  CardContent,
  CardActions,
  Avatar,
  Typography,
  Chip,
  Box,
  LinearProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RestoreIcon from "@mui/icons-material/Restore";
import EmailIcon from "@mui/icons-material/Email";
import { USER_ROLES } from "../../utils/constants";

/**
 * UserCard Component - Memoized for performance
 *
 * Display user information in a card format.
 * Memoized to prevent unnecessary re-renders when parent updates.
 *
 * @param {Object} props
 * @param {Object} props.user - User object
 * @param {Function} props.onView - View user handler
 * @param {Function} props.onEdit - Edit user handler
 * @param {Function} props.onDelete - Delete user handler
 * @param {Function} [props.onRestore] - Restore user handler (if deleted)
 * @returns {JSX.Element}
 */
const UserCard = ({ user, onView, onEdit, onDelete, onRestore }) => {
  const isDeleted = user?.isDeleted || user?.deleted;

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
        opacity: isDeleted ? 0.6 : 1,
      }}
    >
      <CardContent sx={{ flex: 1, pb: 1 }}>
        {/* Avatar and Name */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Avatar
            src={user.profilePicture?.url || ""}
            alt={user.fullName}
            sx={{ width: 56, height: 56 }}
          >
            {user.firstName?.[0]}
            {user.lastName?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.fullName}
            </Typography>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}
            >
              <EmailIcon fontSize="small" color="action" />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.email}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Role and Department */}
        <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
          <Chip
            label={user.role}
            size="small"
            color={
              user.role === USER_ROLES.SUPER_ADMIN
                ? "error"
                : user.role === USER_ROLES.ADMIN
                ? "warning"
                : user.role === USER_ROLES.MANAGER
                ? "info"
                : "default"
            }
          />
          <Chip
            label={user.department?.name || "No Department"}
            size="small"
            variant="outlined"
          />
        </Box>

        {/* Position */}
        {user.position && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {user.position}
          </Typography>
        )}

        {/* Skills */}
        {user.skills && user.skills.length > 0 && (
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 1, display: "block" }}
            >
              Skills
            </Typography>
            {user.skills.slice(0, 3).map((skill, index) => (
              <Box key={index} sx={{ mb: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 0.5,
                  }}
                >
                  <Typography variant="caption">{skill.skill}</Typography>
                  <Typography variant="caption">{skill.percentage}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={skill.percentage}
                  sx={{ height: 6, borderRadius: 1 }}
                />
              </Box>
            ))}
          </Box>
        )}

        {/* Status */}
        {isDeleted && (
          <Chip label="Deleted" size="small" color="error" sx={{ mt: 1 }} />
        )}
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ justifyContent: "flex-end", pt: 0 }}>
        <Tooltip title="View">
          <IconButton size="small" onClick={() => onView(user)} color="primary">
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {!isDeleted && (
          <>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => onEdit(user)}
                color="primary"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => onDelete(user)}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
        {isDeleted && onRestore && (
          <Tooltip title="Restore">
            <IconButton
              size="small"
              onClick={() => onRestore(user)}
              color="success"
            >
              <RestoreIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
};

UserCard.propTypes = {
  user: PropTypes.object.isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRestore: PropTypes.func,
};

// Memoize to prevent re-renders when props haven't changed
export default memo(UserCard);
