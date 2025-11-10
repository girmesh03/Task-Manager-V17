// client/src/components/common/FilterSelect.jsx
import PropTypes from "prop-types";
import { Autocomplete, TextField, InputAdornment, Chip } from "@mui/material";
import { UI_MESSAGES } from "../../utils/constants";

/**
 * Filter Select Component
 *
 * Single or multiple select optimized for filtering with clear functionality.
 *
 * @param {Object} props
 * @param {string|string[]} props.value - Current value(s)
 * @param {Function} props.onChange - Change handler
 * @param {Array} props.options - Selection options
 * @param {string} [props.label] - Field label
 * @param {string} [props.placeholder] - Placeholder text
 * @param {boolean} [props.multiple] - Enable multiple selection
 * @param {React.ReactNode} [props.startAdornment] - Start adornment icon
 * @returns {JSX.Element}
 */
const FilterSelect = ({
  value,
  onChange,
  options = [],
  label,
  placeholder = UI_MESSAGES.PLACEHOLDERS.SELECT_OPTION,
  multiple = false,
  startAdornment,
}) => {
  const handleChange = (_event, newValue) => {
    if (multiple) {
      // For multiple selection, return array of values
      onChange(newValue ? newValue.map((option) => option.value) : []);
    } else {
      // For single selection, return value or empty string
      onChange(newValue ? newValue.value : "");
    }
  };

  // Convert value to option object(s)
  const selectedValue = multiple
    ? options.filter((option) => value?.includes(option.value))
    : options.find((option) => option.value === value) || null;

  return (
    <Autocomplete
      fullWidth
      size="small"
      multiple={multiple}
      options={options}
      value={selectedValue}
      onChange={handleChange}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, value) => option.value === value.value}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          slotProps={{
            input: {
              ...params.InputProps,
              startAdornment: startAdornment ? (
                <InputAdornment position="start">
                  {startAdornment}
                </InputAdornment>
              ) : null,
            },
          }}
        />
      )}
      slots={{
        tag: (props) => <Chip {...props} size="small" />,
      }}
    />
  );
};

FilterSelect.propTypes = {
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  multiple: PropTypes.bool,
  startAdornment: PropTypes.node,
};

export default FilterSelect;
