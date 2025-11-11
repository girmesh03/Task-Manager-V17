// client/src/components/common/MuiDialogConfirm.jsx
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Box,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

/**
 * Confirmation Dialog Component
 *
 * A confirmation dialog for destructive actions (delete, restore, etc.).
 *
 * @param {Object} props
 * @param {boolean} props.open - Dialog open state
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onConfirm - Confirm action handler
 * @param {string} props.title - Dialog title
 * @param {string} props.message - Confirmation message
 * @param {string} [props.confirmText] - Confirm button text (default: "Confirm")
 * @param {string} [props.cancelText] - Cancel button text (default: "Cancel")
 * @param {"error" | "warning" | "info"} [props.severity] - Dialog severity (default: "warning")
 * @param {boolean} [props.isLoading] - Show loading state
 * @returns {JSX.Element}
 */
const MuiDialogConfirm = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  severity = "warning",
  isLoading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleConfirm = () => {
    onConfirm();
  };

  const handleKeyDown = (event) => {
    // Enter key to confirm
    if (event.key === "Enter" && !isLoading) {
      event.preventDefault();
      handleConfirm();
    }
    // Escape key to cancel
    if (event.key === "Escape" && !isLoading) {
      event.preventDefault();
      onClose();
    }
  };

  const getIcon = () => {
    switch (severity) {
      case "error":
        return <ErrorOutlineIcon sx={{ fontSize: 48, color: "error.main" }} />;
      case "warning":
        return (
          <WarningAmberIcon sx={{ fontSize: 48, color: "warning.main" }} />
        );
      case "info":
        return <InfoOutlinedIcon sx={{ fontSize: 48, color: "info.main" }} />;
      default:
        return (
          <WarningAmberIcon sx={{ fontSize: 48, color: "warning.main" }} />
        );
    }
  };

  const getConfirmButtonColor = () => {
    switch (severity) {
      case "error":
        return "error";
      case "warning":
        return "warning";
      case "info":
        return "primary";
      default:
        return "warning";
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      onKeyDown={handleKeyDown}
      maxWidth="xs"
      fullWidth
      fullScreen={isMobile}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      disableEnforceFocus
      disableRestoreFocus
      sx={{
        "& .MuiDialog-paper": {
          backgroundImage: "none",
        },
      }}
    >
      <DialogTitle
        id="confirm-dialog-title"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          pb: 1,
        }}
      >
        {getIcon()}
        <Box component="span" sx={{ fontWeight: 600 }}>
          {title}
        </Box>
      </DialogTitle>

      <DialogContent id="confirm-dialog-content">
        <DialogContentText id="confirm-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          gap: 1,
        }}
      >
        <Button
          onClick={onClose}
          disabled={isLoading}
          variant="outlined"
          color="inherit"
        >
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isLoading}
          variant="contained"
          color={getConfirmButtonColor()}
          autoFocus
        >
          {isLoading ? "Processing..." : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

MuiDialogConfirm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  severity: PropTypes.oneOf(["error", "warning", "info"]),
  isLoading: PropTypes.bool,
};

export default MuiDialogConfirm;
