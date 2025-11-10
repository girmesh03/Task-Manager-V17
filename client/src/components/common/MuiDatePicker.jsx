// client/src/components/common/MuiDatePicker.jsx
import PropTypes from "prop-types";
import { Controller } from "react-hook-form";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import "dayjs/locale/en";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import localizedFormat from "dayjs/plugin/localizedFormat";

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);

/**
 * MuiDatePicker Component
 *
 * Wraps MUI X DatePicker with React Hook Form integration.
 * Uses dayjs for date h[prling with proper localization support.
 *
 * Features:
 * - Localized date formats
 * - Timezone support
 * - React Hook Form integration
 * - Validation support
 * - Min/Max date constraints
 *
 * @param {Object} props
 * @param {string} props.name - Field name for React Hook Form
 * @param {Object} props.control - React Hook Form control object
 * @param {Object} [props.rules] - Validation rules
 * @param {string} props.label - Input label
 * @param {Date|string} [props.minDate] - Minimum selectable date
 * @param {Date|string} [props.maxDate] - Maximum selectable date
 * @param {boolean} [props.disabled] - Disable the picker
 * @param {string} [props.helperText] - Helper text below input
 * @param {string} [props.format] - Date format (default: "MM/DD/YYYY")
 * @returns {JSX.Element}
 */
const MuiDatePicker = ({
  name,
  control,
  rules,
  label,
  minDate,
  maxDate,
  disabled = false,
  helperText,
  format = "MM/DD/YYYY",
  ...muiProps
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field: { onChange, value, ref }, fieldState: { error } }) => {
        // Convert value to dayjs object if it exists
        // Handle both ISO strings and Date objects
        const dayjsValue = value ? dayjs(value) : null;

        const handleChange = (newValue) => {
          // Convert dayjs object to ISO string for form state
          // This ensures consistent date storage regardless of timezone
          onChange(
            newValue && newValue.isValid() ? newValue.toISOString() : null
          );
        };

        return (
          <DatePicker
            {...muiProps}
            label={label}
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
                helperText: error?.message || helperText,
              },
              actionBar: {
                actions: ["clear", "today"],
              },
            }}
          />
        );
      }}
    />
  );
};

MuiDatePicker.propTypes = {
  name: PropTypes.string.isRequired,
  control: PropTypes.object.isRequired,
  rules: PropTypes.object,
  label: PropTypes.string.isRequired,
  minDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
  maxDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
  disabled: PropTypes.bool,
  helperText: PropTypes.string,
  format: PropTypes.string,
};

export default MuiDatePicker;
