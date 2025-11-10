// client/src/components/cards/MaterialCard.jsx
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
import InventoryIcon from "@mui/icons-material/Inventory";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

const MaterialCard = ({ material, onView, onEdit, onDelete, onRestore }) => {
  const isDeleted = material.isDeleted || material.deleted;

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
          <InventoryIcon color="primary" />
          <Typography variant="h6">{material.name}</Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
          <Chip label={material.category} size="small" color="primary" variant="outlined" />
          <Chip label={material.unit} size="small" variant="outlined" />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
          <AttachMoneyIcon fontSize="small" color="action" />
          <Typography variant="h6" color="primary">
            ${material.price?.toFixed(2) || "0.00"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            per {material.unit}
          </Typography>
        </Box>

        {material.department && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {material.department.name}
          </Typography>
        )}

        {isDeleted && <Chip label="Deleted" size="small" color="error" />}
      </CardContent>

      <CardActions sx={{ justifyContent: "flex-end" }}>
        <Tooltip title="View">
          <IconButton size="small" onClick={() => onView(material)} color="primary">
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {!isDeleted && (
          <>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => onEdit(material)} color="primary">
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => onDelete(material)} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
        {isDeleted && onRestore && (
          <Tooltip title="Restore">
            <IconButton size="small" onClick={() => onRestore(material)} color="success">
              <RestoreIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
};

MaterialCard.propTypes = {
  material: PropTypes.object.isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRestore: PropTypes.func,
};

export default MaterialCard;
