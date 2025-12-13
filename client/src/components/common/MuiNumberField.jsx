// client/src/components/common/MuiNumberField.jsx
import { forwardRef } from "react";
import PropTypes from "prop-types";
import { TextField, InputAdornment } from "@mui/material";

/**
 * MuiNumberField Component
 *
 * Number input with validation and optional prefix/suffix.
 * Supports currency prefix (e.g., "$") and unit suffix (e.g., "kg").
 *
 * @param {Object} props
 * @param {string} props.name - Field name
 * @param {Object} props.error - Error object from React Hook Form
 * @param {string} props.label - Input label
 * @param {number} [props.min] - Minimum value
 * @param {number} [props.max] - Maximum value
 * @param {number} [props.step] - Step increment (default: 1)
 * @param {string} [props.prefix] - Prefix text (e.g., "$")
 * @param {string} [props.suffix] - Suffix text (e.g., "kg")
 * @param {string} [props.helperText] - Helper text below input
 * @returns {JSX.Element}
 */
const MuiNumberField = forwardRef(
  (
    {
      name,
      error,
      label,
      min,
      max,
      step = 1,
      prefix,
      suffix,
      helperText,
      ...muiProps
    },
    ref
  ) => {
    return (
      <TextField
        {...muiProps}
        name={name}
        label={label}
        type="number"
        inputRef={ref}
        error={!!error}
        helperText={error?.message || helperText}
        slotProps={{
          input: {
            startAdornment: prefix ? (
              <InputAdornment position="start">{prefix}</InputAdornment>
            ) : null,
            endAdornment: suffix ? (
              <InputAdornment position="end">{suffix}</InputAdornment>
            ) : null,
          },
          htmlInput: {
            min,
            max,
            step,
          },
        }}
        fullWidth
        size="small"
        sx={{
          "& input[type=number]": {
            MozAppearance: "textfield",
          },
          "& input[type=number]::-webkit-outer-spin-button": {
            WebkitAppearance: "none",
            margin: 0,
          },
          "& input[type=number]::-webkit-inner-spin-button": {
            WebkitAppearance: "none",
            margin: 0,
          },
        }}
      />
    );
  }
);

MuiNumberField.displayName = "MuiNumberField";

MuiNumberField.propTypes = {
  name: PropTypes.string.isRequired,
  error: PropTypes.object,
  label: PropTypes.string.isRequired,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  prefix: PropTypes.string,
  suffix: PropTypes.string,
  helperText: PropTypes.string,
};

export default MuiNumberField;
