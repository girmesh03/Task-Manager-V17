// client/src/components/common/MuiDateRangePicker.jsx
import PropTypes from "prop-types";
import { Controller } from "react-hook-form";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Box, Typography } from "@mui/material";
import dayjs from "dayjs";
import "dayjs/locale/en";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import localizedFormat from "dayjs/plugin/localizedFormat";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);
dayjs.extend(isSameOrAfter);

/**
 * MuiDateRangePicker Component
 *
 * Date range selection component with start and end date pickers.
 * Validates that end date is greater than or equal to start date.
 *
 * Features:
 * - Localized date formats
 * - Timezone support
 * - Automatic validation (end >= start)
 * - React Hook Form integration
 * - Min/Max date constraints
 *
 * @param {Object} props
 * @param {string} props.startName - Field name for start date
 * @param {string} props.endName - Field name for end date
 * @param {Object} props.control - React Hook Form control object
 * @param {Object} [props.rules] - Validation rules
 * @param {string} [props.label] - Label for the date range
 * @param {boolean} [props.disabled] - Disable both pickers
 * @param {string} [props.format] - Date format (default: "MM/DD/YYYY")
 * @param {Date|string} [props.minDate] - Minimum selectable date
 * @param {Date|string} [props.maxDate] - Maximum selectable date
 * @returns {JSX.Element}
 */
const MuiDateRangePicker = ({
  startName,
  endName,
  control,
  rules,
  label = "Date Range",
  disabled = false,
  format = "MM/DD/YYYY",
  minDate,
  maxDate,
  ...muiProps
}) => {
  return (
    <Box sx={{ width: "100%" }}>
      {label && (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mb: 1,
            color: "text.secondary",
            fontWeight: 500,
          }}
        >
          {label}
        </Typography>
      )}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        {/* Start Date Picker */}
        <Controller
          name={startName}
          control={control}
          rules={rules}
          render={({
            field: { onChange, value, ref },
            fieldState: { error },
          }) => {
            // Convert UTC value to local timezone for display
            const dayjsValue = value ? utcToLocal(value) : null;

            const handleChange = (newValue) => {
              // Convert local time back to UTC ISO string for storage
              onChange(
                newValue && newValue.isValid() ? localToUtc(newValue) : null
              );
            };

            return (
              <DatePicker
                {...muiProps}
                label="Start Date"
                value={dayjsValue}
                onChange={handleChange}
                format={format}
                minDate={minDate ? dayjs(minDate) : undefined}
                maxDate={maxDate ? dayjs(maxDate) : undefined}
                disabled={disabled}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    margin: "normal",
                    inputRef: ref,
                    error: !!error,
                    helperText: error?.message,
                  },
                  actionBar: {
                    actions: ["clear", "today"],
                  },
                }}
              />
            );
          }}
        />

        {/* End Date Picker */}
        <Controller
          name={endName}
          control={control}
          rules={{
            ...rules,
            validate: {
              ...rules?.validate,
              afterStartDate: (value, formValues) => {
                const startDate = formValues[startName];
                if (!startDate || !value) return true;
                return (
                  dayjs(value).isSameOrAfter(dayjs(startDate), "day") ||
                  "End date must be after or equal to start date"
                );
              },
            },
          }}
          render={({
            field: { onChange, value, ref },
            fieldState: { error },
          }) => {
            // Convert UTC value to local timezone for display
            const dayjsValue = value ? utcToLocal(value) : null;

            const handleChange = (newValue) => {
              // Convert local time back to UTC ISO string for storage
              onChange(
                newValue && newValue.isValid() ? localToUtc(newValue) : null
              );
            };

            return (
              <DatePicker
                {...muiProps}
                label="End Date"
                value={dayjsValue}
                onChange={handleChange}
                format={format}
                minDate={minDate ? dayjs(minDate) : undefined}
                maxDate={maxDate ? dayjs(maxDate) : undefined}
                disabled={disabled}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    margin: "normal",
                    inputRef: ref,
                    error: !!error,
                    helperText: error?.message,
                  },
                  actionBar: {
                    actions: ["clear", "today"],
                  },
                }}
              />
            );
          }}
        />
      </Box>
    </Box>
  );
};

MuiDateRangePicker.propTypes = {
  startName: PropTypes.string.isRequired,
  endName: PropTypes.string.isRequired,
  control: PropTypes.object.isRequired,
  rules: PropTypes.object,
  label: PropTypes.string,
  disabled: PropTypes.bool,
  format: PropTypes.string,
  minDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
  maxDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
};

export default MuiDateRangePicker;
