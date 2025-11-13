// client/src/components/columns/AttachmentColumns.jsx
import { Chip, IconButton, Tooltip, Box } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ImageIcon from "@mui/icons-material/Image";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import dayjs from "dayjs";
import MuiActionColumn from "../common/MuiActionColumn";

/**
 * Get Attachment Column Definitions
 * 
 * @param {Object} actions - Action handlers {onView, onEdit, onDelete, onRestore}
 * @returns {Array} Column definitions for MuiDataGrid
 */
export const getAttachmentColumns = (actions = {}) => [
  {
    field: "type",
    headerName: "Type",
    width: 80,
    sortable: false,
    renderCell: (params) => {
      const iconMap = {
        image: <ImageIcon color="primary" />,
        video: <VideoLibraryIcon color="secondary" />,
        audio: <AudiotrackIcon color="info" />,
        document: <InsertDriveFileIcon color="action" />,
        other: <InsertDriveFileIcon color="disabled" />,
      };
      return (
        <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
          {iconMap[params.value] || iconMap.other}
        </Box>
      );
    },
  },
  {
    field: "filename",
    headerName: "File Name",
    flex: 1,
    minWidth: 200,
  },
  {
    field: "size",
    headerName: "Size",
    width: 100,
    valueFormatter: (value) => {
      if (!value) return "N/A";
      const kb = value / 1024;
      if (kb < 1024) return `${kb.toFixed(2)} KB`;
      const mb = kb / 1024;
      return `${mb.toFixed(2)} MB`;
    },
  },
  {
    field: "parentModel",
    headerName: "Attached To",
    width: 140,
    renderCell: (params) => (
      <Chip
        label={params.value?.replace("Task", "")}
        size="small"
        color="default"
        variant="outlined"
      />
    ),
  },
  {
    field: "uploadedBy",
    headerName: "Uploaded By",
    width: 150,
    valueGetter: (value, row) => row.uploadedBy?.fullName || "N/A",
  },
  {
    field: "createdAt",
    headerName: "Uploaded",
    width: 120,
    valueFormatter: (value) => (value ? formatDate(value) : "N/A"),
  },
  {
    field: "download",
    headerName: "Download",
    width: 100,
    sortable: false,
    renderCell: (params) => (
      <Tooltip title="Download">
        <IconButton
          size="small"
          color="primary"
          onClick={() => window.open(params.row.url, "_blank")}
        >
          <DownloadIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    ),
  },
  {
    field: "actions",
    headerName: "Actions",
    width: 120,
    sortable: false,
    renderCell: (params) => (
      <MuiActionColumn
        row={params.row}
        onView={actions.onView}
        onDelete={actions.onDelete}
        hideEdit
        hideRestore
      />
    ),
  },
];
