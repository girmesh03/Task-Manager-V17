// client/src/components/common/MuiFileUpload.jsx
import { useState } from "react";
import PropTypes from "prop-types";
import { Controller } from "react-hook-form";
import {
  Box,
  Button,
  Typography,
  IconButton,
  Chip,
  Paper,
  FormHelperText,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ImageIcon from "@mui/icons-material/Image";

/**
 * MuiFileUpload Component
 * 
 * File upload with preview, type validation, and size constraints.
 * 
 * @param {Object} props
 * @param {string} props.name - Field name for React Hook Form
 * @param {Object} props.control - React Hook Form control object
 * @param {string} [props.accept] - Accepted file types (e.g., "image/*")
 * @param {number} [props.maxSize] - Maximum file size in bytes
 * @param {boolean} [props.multiple] - Allow multiple files
 * @param {Function} [props.onUpload] - Upload handler function
 * @returns {JSX.Element}
 */
const MuiFileUpload = ({
  name,
  control,
  accept,
  maxSize,
  multiple = false,
  onUpload,
  ...muiProps
}) => {
  const [previews, setPreviews] = useState([]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const isImage = (file) => {
    return file.type.startsWith("image/");
  };

  const handleFileChange = (event, onChange) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file sizes
    if (maxSize) {
      const invalidFiles = files.filter((file) => file.size > maxSize);
      if (invalidFiles.length > 0) {
        alert(`Some files exceed the maximum size of ${formatFileSize(maxSize)}`);
        return;
      }
    }

    // Create previews for images
    const newPreviews = files.map((file) => ({
      file,
      name: file.name,
      size: file.size,
      preview: isImage(file) ? URL.createObjectURL(file) : null,
    }));

    setPreviews(multiple ? [...previews, ...newPreviews] : newPreviews);
    onChange(multiple ? [...(previews.map(p => p.file)), ...files] : files[0]);

    // Call onUpload if provided
    if (onUpload) {
      onUpload(files);
    }
  };

  const handleRemove = (index, onChange) => {
    const newPreviews = previews.filter((_, i) => i !== index);
    setPreviews(newPreviews);
    
    if (multiple) {
      const newFiles = newPreviews.map(p => p.file);
      onChange(newFiles);
    } else {
      onChange(null);
    }

    // Revoke object URL to prevent memory leaks
    if (previews[index].preview) {
      URL.revokeObjectURL(previews[index].preview);
    }
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, ref }, fieldState: { error } }) => (
        <Box sx={{ my: 2 }}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUploadIcon />}
            fullWidth
            sx={{ mb: 2 }}
          >
            {multiple ? "Upload Files" : "Upload File"}
            <input
              {...muiProps}
              type="file"
              hidden
              accept={accept}
              multiple={multiple}
              onChange={(e) => handleFileChange(e, onChange)}
              ref={ref}
            />
          </Button>

          {/* File Previews */}
          {previews.length > 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {previews.map((preview, index) => (
                <Paper
                  key={index}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  {/* Preview Image or Icon */}
                  {preview.preview ? (
                    <Box
                      component="img"
                      src={preview.preview}
                      alt={preview.name}
                      sx={{
                        width: 48,
                        height: 48,
                        objectFit: "cover",
                        borderRadius: 1,
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "action.hover",
                        borderRadius: 1,
                      }}
                    >
                      {preview.file.type.startsWith("image/") ? (
                        <ImageIcon />
                      ) : (
                        <InsertDriveFileIcon />
                      )}
                    </Box>
                  )}

                  {/* File Info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {preview.name}
                    </Typography>
                    <Chip
                      label={formatFileSize(preview.size)}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>

                  {/* Remove Button */}
                  <IconButton
                    size="small"
                    onClick={() => handleRemove(index, onChange)}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Paper>
              ))}
            </Box>
          )}

          {/* Helper Text / Error */}
          {(error?.message || maxSize) && (
            <FormHelperText error={!!error}>
              {error?.message ||
                (maxSize && `Maximum file size: ${formatFileSize(maxSize)}`)}
            </FormHelperText>
          )}
        </Box>
      )}
    />
  );
};

MuiFileUpload.propTypes = {
  name: PropTypes.string.isRequired,
  control: PropTypes.object.isRequired,
  accept: PropTypes.string,
  maxSize: PropTypes.number,
  multiple: PropTypes.bool,
  onUpload: PropTypes.func,
};

export default MuiFileUpload;
