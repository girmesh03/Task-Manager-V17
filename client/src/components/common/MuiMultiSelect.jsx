// client/src/components/common/MuiMultiSelect.jsx
import PropTypes from "prop-types";
import { Controller } from "react-hook-form";
import { Autocomplete, TextField, Chip, InputAdornment } from "@mui/material";
import { UI_MESSAGES } from "../../utils/constants.js";

/**
 * MuiMultiSelect Component
 *
 * Multi-select autocomplete with chips display.
 * Similar to MuiSelectAutocomplete but for multiple values.
 *
 * @param {Object} props
 * @param {string} props.name - Field name for React Hook Form
 * @param {Object} props.control - React Hook Form control object
 * @param {Object} [props.rules] - Validation rules
 * @param {Array} props.options - Array of {id, label} objects
 * @param {string} props.label - Input label
 * @param {string} [props.placeholder] - Placeholder text
 * @param {number} [props.maxSelections] - Maximum number of selections allowed
 * @param {React.ReactNode} [props.startAdornment] - Icon or element at start
 * @param {boolean} [props.disabled] - Disable the input
 * @returns {JSX.Element}
 */
const MuiMultiSelect = ({
  name,
  control,
  rules,
  options = [],
  label,
  placeholder = UI_MESSAGES.PLACEHOLDERS.SELECT_OPTIONS,
  maxSelections,
  startAdornment,
  disabled = false,
  ...muiProps
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field: { onChange, value, ref }, fieldState: { error } }) => {
        // Convert value array to option objects
        const selectedOptions = Array.isArray(value)
          ? options.filter((option) => value.includes(option.id))
          : [];

        const handleChange = (_event, newValue) => {
          // Check max selections limit
          if (maxSelections && newValue.length > maxSelections) {
            return;
          }
          // Pass array of IDs to react-hook-form
          onChange(newValue.map((option) => option.id));
        };

        return (
          <Autocomplete
            {...muiProps}
            multiple
            options={options}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={selectedOptions}
            onChange={handleChange}
            disabled={disabled}
            slots={{
              tag: (props) => <Chip {...props} size="small" />,
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                placeholder={selectedOptions.length === 0 ? placeholder : ""}
                inputRef={ref}
                error={!!error}
                helperText={
                  error?.message ||
                  (maxSelections
                    ? `Max ${maxSelections} selections (${selectedOptions.length}/${maxSelections})`
                    : "")
                }
                slotProps={{
                  input: {
                    ...params.InputProps,
                    startAdornment: startAdornment ? (
                      <>
                        <InputAdornment position="start">
                          {startAdornment}
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ) : (
                      params.InputProps.startAdornment
                    ),
                  },
                }}
                sx={(theme) => ({
                  "& .MuiButtonBase-root.MuiIconButton-root": {
                    border: "none",
                    backgroundColor: "transparent",
                    color: (theme.vars || theme).palette.text.secondary,
                    "&:hover": {
                      backgroundColor: (theme.vars || theme).palette.action
                        .hover,
                      color: (theme.vars || theme).palette.text.primary,
                    },
                  },
                })}
              />
            )}
          />
        );
      }}
    />
  );
};

MuiMultiSelect.propTypes = {
  name: PropTypes.string.isRequired,
  control: PropTypes.object.isRequired,
  rules: PropTypes.object,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  maxSelections: PropTypes.number,
  startAdornment: PropTypes.node,
  disabled: PropTypes.bool,
};

export default MuiMultiSelect;
