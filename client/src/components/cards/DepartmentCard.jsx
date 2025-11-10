// client/src/components/cards/DepartmentCard.jsx
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
import PeopleIcon from "@mui/icons-material/People";
import AssignmentIcon from "@mui/icons-material/Assignment";

const DepartmentCard = ({ department, onView, onEdit, onDelete, onRestore }) => {
  const isDeleted = department.isDeleted || department.deleted;

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
        <Typography variant="h6" sx={{ mb: 1 }}>
          {department.name}
        </Typography>
        
        {department.description && (
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
            {department.description}
          </Typography>
        )}

        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <PeopleIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {department.userCount || 0} users
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <AssignmentIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {department.taskCount || 0} tasks
            </Typography>
          </Box>
        </Box>

        {isDeleted && <Chip label="Deleted" size="small" color="error" />}
      </CardContent>

      <CardActions sx={{ justifyContent: "flex-end" }}>
        <Tooltip title="View">
          <IconButton size="small" onClick={() => onView(department)} color="primary">
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {!isDeleted && (
          <>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => onEdit(department)} color="primary">
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => onDelete(department)} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
        {isDeleted && onRestore && (
          <Tooltip title="Restore">
            <IconButton size="small" onClick={() => onRestore(department)} color="success">
              <RestoreIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
};

DepartmentCard.propTypes = {
  department: PropTypes.object.isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRestore: PropTypes.func,
};

export default DepartmentCard;
