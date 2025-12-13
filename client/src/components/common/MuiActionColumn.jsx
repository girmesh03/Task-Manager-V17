// client/src/components/common/MuiActionColumn.jsx
import PropTypes from "prop-types";
import { Box, IconButton, Tooltip } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RestoreIcon from "@mui/icons-material/Restore";

/**
 * MuiActionColumn Component
 * 
 * MANDATORY action column component for all data grids.
 * Provides consistent view, edit, delete, and restore actions.
 * 
 * @param {Object} props
 * @param {Object} props.row - Data row object
 * @param {Function} [props.onView] - View action handler
 * @param {Function} [props.onEdit] - Edit action handler
 * @param {Function} [props.onDelete] - Delete action handler
 * @param {Function} [props.onRestore] - Restore action handler
 * @param {boolean} [props.hideView] - Hide view button
 * @param {boolean} [props.hideEdit] - Hide edit button
 * @param {boolean} [props.hideDelete] - Hide delete button
 * @param {boolean} [props.hideRestore] - Hide restore button
 * @param {boolean} [props.disabled] - Disable all actions
 * @returns {JSX.Element}
 */
const MuiActionColumn = ({
  row,
  onView,
  onEdit,
  onDelete,
  onRestore,
  hideView = false,
  hideEdit = false,
  hideDelete = false,
  hideRestore = false,
  disabled = false,
}) => {
  const isDeleted = row.isDeleted || row.deleted;

  return (
    <Box
      sx={{
        display: "flex",
        gap: 0.5,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* View Button */}
      {!hideView && onView && (
        <Tooltip title="View">
          <IconButton
            size="small"
            onClick={() => onView(row)}
            disabled={disabled}
            color="primary"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Edit Button */}
      {!hideEdit && onEdit && !isDeleted && (
        <Tooltip title="Edit">
          <IconButton
            size="small"
            onClick={() => onEdit(row)}
            disabled={disabled}
            color="primary"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Delete Button (for active rows) */}
      {!hideDelete && onDelete && !isDeleted && (
        <Tooltip title="Delete">
          <IconButton
            size="small"
            onClick={() => onDelete(row)}
            disabled={disabled}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Restore Button (for deleted rows) */}
      {!hideRestore && onRestore && isDeleted && (
        <Tooltip title="Restore">
          <IconButton
            size="small"
            onClick={() => onRestore(row)}
            disabled={disabled}
            color="success"
          >
            <RestoreIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

MuiActionColumn.propTypes = {
  row: PropTypes.object.isRequired,
  onView: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onRestore: PropTypes.func,
  hideView: PropTypes.bool,
  hideEdit: PropTypes.bool,
  hideDelete: PropTypes.bool,
  hideRestore: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default MuiActionColumn;
