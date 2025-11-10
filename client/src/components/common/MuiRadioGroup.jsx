// client/src/components/common/MuiRadioGroup.jsx
import PropTypes from "prop-types";
import { Controller } from "react-hook-form";
import {
  FormControl,
  FormLabel,
  FormHelperText,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";

/**
 * MuiRadioGroup Component
 * 
 * Radio button group with React Hook Form integration.
 * 
 * @param {Object} props
 * @param {string} props.name - Field name for React Hook Form
 * @param {Object} props.control - React Hook Form control object
 * @param {Object} [props.rules] - Validation rules
 * @param {Array} props.options - Array of {value, label} objects
 * @param {string} props.label - Group label
 * @param {boolean} [props.row] - Display options horizontally
 * @returns {JSX.Element}
 */
const MuiRadioGroup = ({
  name,
  control,
  rules,
  options = [],
  label,
  row = false,
  ...muiProps
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
        <FormControl error={!!error} sx={{ my: 1 }} fullWidth>
          <FormLabel>{label}</FormLabel>
          <RadioGroup
            {...muiProps}
            value={value || ""}
            onChange={onChange}
            row={row}
            ref={ref}
          >
            {options.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={option.label}
              />
            ))}
          </RadioGroup>
          {error?.message && <FormHelperText>{error.message}</FormHelperText>}
        </FormControl>
      )}
    />
  );
};

MuiRadioGroup.propTypes = {
  name: PropTypes.string.isRequired,
  control: PropTypes.object.isRequired,
  rules: PropTypes.object,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  label: PropTypes.string.isRequired,
  row: PropTypes.bool,
};

export default MuiRadioGroup;
