// client/src/components/common/MuiCheckbox.jsx
import PropTypes from "prop-types";
import { Controller } from "react-hook-form";
import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  Checkbox,
} from "@mui/material";

/**
 * MuiCheckbox Component
 * 
 * Checkbox with React Hook Form integration.
 * 
 * @param {Object} props
 * @param {string} props.name - Field name for React Hook Form
 * @param {Object} props.control - React Hook Form control object
 * @param {string} props.label - Checkbox label
 * @param {string} [props.helperText] - Helper text below checkbox
 * @param {boolean} [props.disabled] - Disable the checkbox
 * @returns {JSX.Element}
 */
const MuiCheckbox = ({
  name,
  control,
  label,
  helperText,
  disabled = false,
  ...muiProps
}) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
        <FormControl error={!!error} disabled={disabled} sx={{ my: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                {...muiProps}
                checked={!!value}
                onChange={(e) => onChange(e.target.checked)}
                inputRef={ref}
              />
            }
            label={label}
          />
          {(error?.message || helperText) && (
            <FormHelperText>{error?.message || helperText}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
};

MuiCheckbox.propTypes = {
  name: PropTypes.string.isRequired,
  control: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  helperText: PropTypes.string,
  disabled: PropTypes.bool,
};

export default MuiCheckbox;
