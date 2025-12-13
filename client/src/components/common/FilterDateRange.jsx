// client/src/components/common/FilterDateRange.jsx
import PropTypes from "prop-types";
import { Box, IconButton, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import ClearIcon from "@mui/icons-material/Clear";
import dayjs from "dayjs";

/**
 * Filter Date Range Component
 * 
 * Date range picker optimized for filtering with clear functionality.
 * 
 * @param {Object} props
 * @param {string} props.startDate - Start date value (ISO string)
 * @param {string} props.endDate - End date value (ISO string)
 * @param {Function} props.onStartDateChange - Start date change handler
 * @param {Function} props.onEndDateChange - End date change handler
 * @param {string} [props.label] - Field label
 * @returns {JSX.Element}
 */
const FilterDateRange = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label = "Date Range",
}) => {
  const handleStartDateChange = (newValue) => {
    onStartDateChange(newValue ? newValue.toISOString() : null);
  };

  const handleEndDateChange = (newValue) => {
    onEndDateChange(newValue ? newValue.toISOString() : null);
  };

  const handleClearBoth = () => {
    onStartDateChange(null);
    onEndDateChange(null);
  };

  const hasValue = startDate || endDate;

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
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        {hasValue && (
          <IconButton
            size="small"
            onClick={handleClearBoth}
            aria-label="clear dates"
          >
            <ClearIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <DatePicker
          label="Start Date"
          value={startDate ? dayjs(startDate) : null}
          onChange={handleStartDateChange}
          maxDate={endDate ? dayjs(endDate) : undefined}
          slotProps={{
            textField: {
              size: "small",
              fullWidth: true,
            },
          }}
        />
        <DatePicker
          label="End Date"
          value={endDate ? dayjs(endDate) : null}
          onChange={handleEndDateChange}
          minDate={startDate ? dayjs(startDate) : undefined}
          slotProps={{
            textField: {
              size: "small",
              fullWidth: true,
            },
          }}
        />
      </Box>
    </Box>
  );
};

FilterDateRange.propTypes = {
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  onStartDateChange: PropTypes.func.isRequired,
  onEndDateChange: PropTypes.func.isRequired,
  label: PropTypes.string,
};

export default FilterDateRange;
