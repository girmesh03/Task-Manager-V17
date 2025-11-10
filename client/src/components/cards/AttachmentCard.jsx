// client/src/components/cards/AttachmentCard.jsx
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
import DownloadIcon from "@mui/icons-material/Download";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ImageIcon from "@mui/icons-material/Image";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import dayjs from "dayjs";

const AttachmentCard = ({ attachment, onView, onDelete }) => {
  const getTypeIcon = (type) => {
    const iconMap = {
      image: <ImageIcon sx={{ fontSize: 48 }} color="primary" />,
      video: <VideoLibraryIcon sx={{ fontSize: 48 }} color="secondary" />,
      audio: <AudiotrackIcon sx={{ fontSize: 48 }} color="info" />,
      document: <InsertDriveFileIcon sx={{ fontSize: 48 }} color="action" />,
      other: <InsertDriveFileIcon sx={{ fontSize: 48 }} color="disabled" />,
    };
    return iconMap[type] || iconMap.other;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
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
      }}
    >
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          {attachment.type === "image" && attachment.url ? (
            <Box
              component="img"
              src={attachment.url}
              alt={attachment.filename}
              sx={{
                width: "100%",
                height: 150,
                objectFit: "cover",
                borderRadius: 1,
              }}
            />
          ) : (
            getTypeIcon(attachment.type)
          )}
        </Box>

        <Typography
          variant="h6"
          sx={{
            mb: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {attachment.filename}
        </Typography>

        <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
          <Chip label={attachment.type} size="small" color="primary" variant="outlined" />
          <Chip label={formatFileSize(attachment.size)} size="small" variant="outlined" />
        </Box>

        {attachment.parentModel && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Attached to: {attachment.parentModel.replace("Task", "")}
          </Typography>
        )}

        {attachment.uploadedBy && (
          <Typography variant="caption" color="text.secondary" display="block">
            Uploaded by {attachment.uploadedBy.fullName}
          </Typography>
        )}

        <Typography variant="caption" color="text.secondary">
          {dayjs(attachment.createdAt).format("MMM DD, YYYY")}
        </Typography>
      </CardContent>

      <CardActions sx={{ justifyContent: "flex-end" }}>
        <Tooltip title="Download">
          <IconButton
            size="small"
            onClick={() => window.open(attachment.url, "_blank")}
            color="primary"
          >
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="View">
          <IconButton size="small" onClick={() => onView(attachment)} color="primary">
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" onClick={() => onDelete(attachment)} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

AttachmentCard.propTypes = {
  attachment: PropTypes.object.isRequired,
  onView: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default AttachmentCard;
