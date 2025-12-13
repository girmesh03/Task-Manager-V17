// client/src/components/cards/OrganizationCard.jsx
import PropTypes from "prop-types";
import {
  Card,
  CardContent,
  CardActions,
  Avatar,
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RestoreIcon from "@mui/icons-material/Restore";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import GroupsIcon from "@mui/icons-material/Groups";
import PeopleIcon from "@mui/icons-material/People";

const OrganizationCard = ({ organization, onView, onEdit, onDelete, onRestore }) => {
  const isDeleted = organization.isDeleted || organization.deleted;

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
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Avatar
            src={organization.logoUrl?.url || ""}
            alt={organization.name}
            sx={{ width: 56, height: 56 }}
          >
            {organization.name?.[0]}
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
              {organization.name}
            </Typography>
            {organization.industry && (
              <Chip
                label={organization.industry}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ mt: 0.5 }}
              />
            )}
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
          {organization.email && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
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
                {organization.email}
              </Typography>
            </Box>
          )}
          {organization.phone && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <PhoneIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {organization.phone}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <GroupsIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {organization.departmentCount || 0} depts
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <PeopleIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {organization.userCount || 0} users
            </Typography>
          </Box>
        </Box>

        {isDeleted && <Chip label="Deleted" size="small" color="error" />}
      </CardContent>

      <CardActions sx={{ justifyContent: "flex-end" }}>
        <Tooltip title="View">
          <IconButton size="small" onClick={() => onView(organization)} color="primary">
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {!isDeleted && (
          <>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => onEdit(organization)} color="primary">
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => onDelete(organization)} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
        {isDeleted && onRestore && (
          <Tooltip title="Restore">
            <IconButton size="small" onClick={() => onRestore(organization)} color="success">
              <RestoreIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
};

OrganizationCard.propTypes = {
  organization: PropTypes.object.isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRestore: PropTypes.func,
};

export default OrganizationCard;
