// src/components/common/MuiSelectAutocomplete.jsx
import PropTypes from "prop-types";
import { Controller } from "react-hook-form";
import { Autocomplete, TextField, InputAdornment } from "@mui/material";

const MuiSelectAutocomplete = ({
  name,
  control,
  rules,
  options = [],
  label,
  required,
  placeholder = "Select an option",
  startAdornment,
  ...muiProps
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field: { onChange, value, ref }, fieldState: { error } }) => {
        // Find the current value object from options
        const selectedOption =
          options.find((option) => option.label === value) || null;

        const handleChange = (_event, newValue) => {
          // Pass the label value to react-hook-form
          onChange(newValue ? newValue.label : "");
        };

        return (
          <Autocomplete
            {...muiProps}
            options={options}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) =>
              option.id === value?.id || option.label === value
            }
            value={selectedOption}
            onChange={handleChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                placeholder={placeholder}
                inputRef={ref}
                required={required}
                error={!!error}
                helperText={error?.message}
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

MuiSelectAutocomplete.propTypes = {
  name: PropTypes.string.isRequired,
  control: PropTypes.object.isRequired,
  rules: PropTypes.object,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  startAdornment: PropTypes.node,
};

export default MuiSelectAutocomplete;
