// client/src/components/cards/VendorCard.jsx
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
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RestoreIcon from "@mui/icons-material/Restore";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BusinessIcon from "@mui/icons-material/Business";

const VendorCard = ({ vendor, onView, onEdit, onDelete, onRestore }) => {
  const isDeleted = vendor.isDeleted || vendor.deleted;

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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <BusinessIcon color="primary" />
          <Typography variant="h6">{vendor.name}</Typography>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
          {vendor.email && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <EmailIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {vendor.email}
              </Typography>
            </Box>
          )}
          {vendor.phone && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <PhoneIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {vendor.phone}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Projects
            </Typography>
            <Typography variant="h6">{vendor.projectCount || 0}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Total Cost
            </Typography>
            <Typography variant="h6" color="primary">
              ${vendor.totalCost?.toFixed(2) || "0.00"}
            </Typography>
          </Box>
        </Box>

        {isDeleted && <Chip label="Deleted" size="small" color="error" />}
      </CardContent>

      <CardActions sx={{ justifyContent: "flex-end" }}>
        <Tooltip title="View">
          <IconButton size="small" onClick={() => onView(vendor)} color="primary">
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {!isDeleted && (
          <>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => onEdit(vendor)} color="primary">
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => onDelete(vendor)} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
        {isDeleted && onRestore && (
          <Tooltip title="Restore">
            <IconButton size="small" onClick={() => onRestore(vendor)} color="success">
              <RestoreIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
};

VendorCard.propTypes = {
  vendor: PropTypes.object.isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRestore: PropTypes.func,
};

export default VendorCard;
