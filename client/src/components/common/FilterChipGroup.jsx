// client/src/components/common/FilterChipGroup.jsx
import PropTypes from "prop-types";
import { Box, Chip, Typography, Button } from "@mui/material";

/**
 * Filter Chip Group Component
 * 
 * Chip-based multi-select filter with visual chip display.
 * 
 * @param {Object} props
 * @param {string[]} props.value - Selected values array
 * @param {Function} props.onChange - Change handler
 * @param {Array} props.options - Selection options
 * @param {string} [props.label] - Field label
 * @returns {JSX.Element}
 */
const FilterChipGroup = ({ value = [], onChange, options = [], label }) => {
  const handleChipClick = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        {label && (
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        )}
        {value.length > 0 && (
          <Button size="small" onClick={handleClearAll}>
            Clear All
          </Button>
        )}
      </Box>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            onClick={() => handleChipClick(option.value)}
            color={value.includes(option.value) ? "primary" : "default"}
            variant={value.includes(option.value) ? "filled" : "outlined"}
            clickable
          />
        ))}
      </Box>
    </Box>
  );
};

FilterChipGroup.propTypes = {
  value: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  label: PropTypes.string,
};

export default FilterChipGroup;
