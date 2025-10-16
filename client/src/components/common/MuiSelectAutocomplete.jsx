// src/components/common/MuiSelectAutocomplete.jsx
import { memo, forwardRef } from "react";
import PropTypes from "prop-types";
import {
	Autocomplete,
	TextField,
	InputAdornment,
} from "@mui/material";

const MuiSelectAutocomplete = memo(
	forwardRef(
		(
			{
				options = [],
				placeholder = "Select an option",
				startAdornment,
				error,
				helperText,
				value,
				onChange,
				name,
				...muiProps
			},
			ref
		) => {
			// Find the current value object from options
			const selectedOption = options.find(option => option.label === value) || null;

			const handleChange = (event, newValue) => {
				// Create a proper react-hook-form change event
				if (onChange) {
					const syntheticEvent = {
						target: {
							name: name,
							value: newValue ? newValue.label : ""
						}
					};
					onChange(syntheticEvent);
				}
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
							name={name}
							placeholder={placeholder}
							inputRef={ref}
							error={error}
							helperText={helperText}
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
							sx={{
								"& .MuiButtonBase-root.MuiIconButton-root": {
									border: 'none',
									bgcolor: 'transparent'
								}
							}}
						/>
					)}
				/>
			);
		}
	)
);

MuiSelectAutocomplete.displayName = "MuiSelectAutocomplete";

MuiSelectAutocomplete.propTypes = {
	options: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			label: PropTypes.string.isRequired,
		})
	).isRequired,
	placeholder: PropTypes.string,
	startAdornment: PropTypes.node,
	error: PropTypes.bool,
	helperText: PropTypes.string,
	value: PropTypes.string,
	onChange: PropTypes.func,
	name: PropTypes.string,
};

export default MuiSelectAutocomplete;
