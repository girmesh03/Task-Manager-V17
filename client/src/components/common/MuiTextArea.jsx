// client/src/components/common/MuiTextArea.jsx
import { forwardRef } from "react";
import PropTypes from "prop-types";
import { TextField, Box, Typography } from "@mui/material";

/**
 * MuiTextArea Component
 *
 * Multi-line text input with character counter.
 *
 * @param {Object} props
 * @param {string} props.name - Field name
 * @param {Object} props.error - Error object from React Hook Form
 * @param {string} props.label - Input label
 * @param {number} [props.maxLength] - Maximum character length
 * @param {number} [props.rows] - Number of rows (default: 4)
 * @param {number} [props.minRows] - Minimum rows for auto-resize
 * @param {number} [props.maxRows] - Maximum rows for auto-resize
 * @param {string} [props.helperText] - Helper text below input
 * @returns {JSX.Element}
 */
const MuiTextArea = forwardRef(
  (
    {
      name,
      error,
      label,
      maxLength,
      rows = 4,
      minRows,
      maxRows,
      helperText,
      value = "",
      ...muiProps
    },
    ref
  ) => {
    const currentLength = value?.length || 0;
    const showCounter = !!maxLength;

    return (
      <Box sx={{ width: "100%" }}>
        <TextField
          {...muiProps}
          name={name}
          label={label}
          value={value}
          inputRef={ref}
          multiline
          rows={minRows || maxRows ? undefined : rows}
          minRows={minRows}
          maxRows={maxRows}
          error={!!error}
          helperText={error?.message || helperText}
          slotProps={{
            htmlInput: {
              maxLength: maxLength,
            },
          }}
          fullWidth
          size="small"
          margin="normal"
        />
        {showCounter && (
          <Typography
            variant="caption"
            sx={{
              display: "block",
              textAlign: "right",
              mt: 0.5,
              color:
                currentLength >= maxLength ? "error.main" : "text.secondary",
            }}
          >
            {currentLength}/{maxLength}
          </Typography>
        )}
      </Box>
    );
  }
);

MuiTextArea.displayName = "MuiTextArea";

MuiTextArea.propTypes = {
  name: PropTypes.string.isRequired,
  error: PropTypes.object,
  label: PropTypes.string.isRequired,
  maxLength: PropTypes.number,
  rows: PropTypes.number,
  minRows: PropTypes.number,
  maxRows: PropTypes.number,
  helperText: PropTypes.string,
  value: PropTypes.string,
};

export default MuiTextArea;
