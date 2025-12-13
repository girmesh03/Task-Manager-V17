// client/src/components/common/MuiDialog.jsx
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  useMediaQuery,
  useTheme,
  Box,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

/**
 * Reusable Dialog Component
 *
 * A flexible, accessible dialog wrapper for all CRUD operations across resources.
 *
 * CRITICAL - Focus Management:
 * Includes disableEnforceFocus, disableAutoFocus, and disableRestoreFocus
 * to prevent MUI's focus trap from making the rest of the page inert.
 * This allows floating widgets, chat windows, or background controls to remain interactive.
 *
 * @param {Object} props
 * @param {boolean} props.open - Dialog open state
 * @param {Function} props.onClose - Close handler
 * @param {string} props.title - Dialog title
 * @param {React.ReactNode} props.children - Dialog content
 * @param {React.ReactNode} [props.actions] - Custom action buttons
 * @param {boolean} [props.fullScreen] - Force full-screen mode
 * @param {boolean} [props.disableBackdropClick] - Prevent closing on backdrop click
 * @param {boolean} [props.disableEscapeKeyDown] - Prevent closing on Escape key
 * @param {string} [props.maxWidth] - Dialog max width ("xs" | "sm" | "md" | "lg" | "xl")
 * @param {boolean} [props.isLoading] - Show loading state
 * @returns {JSX.Element}
 */
const MuiDialog = ({
  open,
  onClose,
  title,
  children,
  actions,
  fullScreen: forceFullScreen = false,
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
  maxWidth = "sm",
  isLoading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const fullScreen = forceFullScreen || isMobile;

  const handleClose = (_event, reason) => {
    // Prevent closing on backdrop click if disabled
    if (disableBackdropClick && reason === "backdropClick") {
      return;
    }
    // Prevent closing on escape key if disabled
    if (disableEscapeKeyDown && reason === "escapeKeyDown") {
      return;
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={fullScreen}
      maxWidth={maxWidth}
      fullWidth
      scroll="paper"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
      disableEnforceFocus
      disableRestoreFocus
      sx={(theme) => ({
        "& .MuiDialog-paper": {
          backgroundImage: "none",
          display: "flex",
          flexDirection: "column",
          maxHeight: fullScreen ? "100vh" : "90vh",
          overflow: "hidden",
        },
        [theme.breakpoints.down("sm")]: {
          "& .MuiDialog-paper": {
            borderRadius: 0,
            maxHeight: "100vh",
          },
        },
      })}
    >
      {/* Dialog Title - Fixed at top */}
      <DialogTitle
        id="dialog-title"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
          flexShrink: 0,
        }}
      >
        <Box component="span" sx={{ fontWeight: 600 }}>
          {title}
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          size="small"
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Dialog Content - Scrollable */}
      <DialogContent
        id="dialog-description"
        dividers
        sx={{
          position: "relative",
          minHeight: isLoading ? 200 : "auto",
          flex: "1 1 auto",
          overflow: "auto",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 200,
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          children
        )}
      </DialogContent>

      {/* Dialog Actions - Fixed at bottom */}
      {actions && (
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            gap: 1,
            flexShrink: 0,
          }}
        >
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

MuiDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  actions: PropTypes.node,
  fullScreen: PropTypes.bool,
  disableBackdropClick: PropTypes.bool,
  disableEscapeKeyDown: PropTypes.bool,
  maxWidth: PropTypes.oneOf(["xs", "sm", "md", "lg", "xl"]),
  isLoading: PropTypes.bool,
};

export default MuiDialog;
