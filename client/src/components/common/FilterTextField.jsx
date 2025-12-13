// client/src/components/common/FilterTextField.jsx
import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { TextField, InputAdornment, IconButton } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { UI_MESSAGES } from "../../utils/constants";

/**
 * Filter Text Field Component
 * 
 * Text input optimized for filtering with debouncing and clear functionality.
 * 
 * @param {Object} props
 * @param {string} props.value - Current value
 * @param {Function} props.onChange - Change handler
 * @param {string} [props.label] - Field label
 * @param {string} [props.placeholder] - Placeholder text
 * @param {React.ReactNode} [props.startAdornment] - Start adornment icon
 * @param {number} [props.debounceMs] - Debounce delay in milliseconds (default: 300)
 * @returns {JSX.Element}
 */
const FilterTextField = ({
  value,
  onChange,
  label,
  placeholder = UI_MESSAGES.PLACEHOLDERS.SEARCH,
  startAdornment,
  debounceMs = 300,
}) => {
  const [localValue, setLocalValue] = useState(value || "");

  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  // Debounced onChange
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, value, onChange, debounceMs]);

  const handleChange = (event) => {
    setLocalValue(event.target.value);
  };

  const handleClear = useCallback(() => {
    setLocalValue("");
    onChange("");
  }, [onChange]);

  return (
    <TextField
      fullWidth
      size="small"
      label={label}
      placeholder={placeholder}
      value={localValue}
      onChange={handleChange}
      slotProps={{
        input: {
          startAdornment: startAdornment ? (
            <InputAdornment position="start">{startAdornment}</InputAdornment>
          ) : null,
          endAdornment: localValue ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={handleClear}
                edge="end"
                aria-label="clear"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
        },
      }}
    />
  );
};

FilterTextField.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  startAdornment: PropTypes.node,
  debounceMs: PropTypes.number,
};

export default FilterTextField;
