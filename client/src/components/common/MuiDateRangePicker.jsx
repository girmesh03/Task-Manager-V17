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
import { utcToLocal, localToUtc } from "../../utils/dateUtils";

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);
dayjs.extend(isSameOrAfter);

/**
 * MuiDateRangePicker Component
 *
 * Provides timezone-aware start/end date pickers with React Hook Form.
 * Ensures the end date is always the same as or after the start date.
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
        <Controller
          name={startName}
          control={control}
          rules={rules}
          render={({ field: { onChange, value, ref }, fieldState: { error } }) => {
            const dayjsValue = value ? utcToLocal(value) : null;

            const handleChange = (newValue) => {
              if (!newValue || !newValue.isValid()) {
                onChange(null);
                return;
              }

              onChange(localToUtc(newValue));
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

        <Controller
          name={endName}
          control={control}
          rules={{
            ...rules,
            validate: {
              ...rules?.validate,
              afterStartDate: (value, formValues) => {
                const startValue = formValues?.[startName];
                if (!startValue || !value) {
                  return true;
                }

                const start = utcToLocal(startValue);
                const end = utcToLocal(value);

                return (
                  end.isSame(start, "day") ||
                  end.isAfter(start, "day") ||
                  "End date must be after or equal to start date"
                );
              },
            },
          }}
          render={({ field: { onChange, value, ref }, fieldState: { error } }) => {
            const dayjsValue = value ? utcToLocal(value) : null;

            const handleChange = (newValue) => {
              if (!newValue || !newValue.isValid()) {
                onChange(null);
                return;
              }

              onChange(localToUtc(newValue));
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
