// client/src/components/common/MuiResourceSelect.jsx
import { useMemo } from "react";
import PropTypes from "prop-types";
import { Controller } from "react-hook-form";
import {
  Autocomplete,
  TextField,
  Chip,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import {
  UI_MESSAGES,
  PAGINATION,
  HEAD_OF_DEPARTMENT_ROLES,
} from "../../utils/constants.js";
import { useGetDepartmentsQuery } from "../../redux/features/department/departmentApi";
import { useGetUsersQuery } from "../../redux/features/user/userApi";
import { useGetMaterialsQuery } from "../../redux/features/material/materialApi";
import { useGetVendorsQuery } from "../../redux/features/vendor/vendorApi";

/**
 * MuiResourceSelect Component
 *
 * Reusable component that fetches and displays resources for selection.
 * Supports single and multiple selection modes.
 *
 * @param {Object} props
 * @param {string} props.name - Field name for React Hook Form
 * @param {Object} props.control - React Hook Form control object
 * @param {Object} [props.rules] - Validation rules
 * @param {string} props.resourceType - Type of resource (departments, users, materials, vendors)
 * @param {string} props.label - Input label
 * @param {boolean} [props.multiple] - Enable multiple selection
 * @param {number} [props.maxSelections] - Maximum selections for multiple mode
 * @param {string} [props.placeholder] - Placeholder text
 * @param {React.ReactNode} [props.startAdornment] - Icon or element at start
 * @param {boolean} [props.disabled] - Disable the input
 * @param {Object} [props.queryParams] - Additional query parameters for API
 * @param {boolean} [props.watchersOnly] - For users: filter only SuperAdmin/Admin roles (for watchers)
 * @returns {JSX.Element}
 */
const MuiResourceSelect = ({
  name,
  control,
  rules,
  resourceType,
  label,
  multiple = false,
  maxSelections,
  placeholder = UI_MESSAGES.PLACEHOLDERS.SELECT_OPTION,
  startAdornment,
  disabled = false,
  queryParams = {},
  watchersOnly = false,
  ...muiProps
}) => {
  // Determine if this is a watchers field based on field name
  const isWatchersField = name === "watcherIds" || watchersOnly;
  // Select appropriate query hook based on resource type
  const useResourceQuery = useMemo(() => {
    switch (resourceType) {
      case "departments":
        return useGetDepartmentsQuery;
      case "users":
        return useGetUsersQuery;
      case "materials":
        return useGetMaterialsQuery;
      case "vendors":
        return useGetVendorsQuery;
      default:
        throw new Error(`Unsupported resource type: ${resourceType}`);
    }
  }, [resourceType]);

  // Fetch data with query params
  const { data, isLoading, isError } = useResourceQuery({
    limit: PAGINATION.MAX_LIMIT,
    deleted: false,
    ...queryParams,
  });

  // Extract resources from response
  const resources = useMemo(() => {
    if (!data) return [];

    let items = [];
    switch (resourceType) {
      case "departments":
        items = data.departments || [];
        break;
      case "users":
        items = data.users || [];
        // Filter for watchers: only SuperAdmin and Admin
        if (isWatchersField) {
          items = items.filter((user) =>
            HEAD_OF_DEPARTMENT_ROLES.includes(user.role)
          );
        }
        break;
      case "materials":
        items = data.materials || [];
        break;
      case "vendors":
        items = data.vendors || [];
        break;
      default:
        items = [];
    }
    return items;
  }, [data, resourceType, isWatchersField]);

  // Transform resources to options format with proper labels
  const options = useMemo(() => {
    return resources.map((resource) => {
      let label;

      // Determine label based on resource type
      switch (resourceType) {
        case "users":
          // Use fullName for users, fallback to firstName + lastName
          label =
            resource.fullName ||
            `${resource.firstName || ""} ${resource.lastName || ""}`.trim() ||
            resource.email ||
            resource._id;
          break;
        case "departments":
        case "materials":
        case "vendors":
          label = resource.name || resource._id;
          break;
        default:
          label = resource.name || resource.title || resource._id;
      }

      return {
        id: resource._id,
        label,
        resource, // Keep full resource for additional data
      };
    });
  }, [resources, resourceType]);

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field: { onChange, value, ref }, fieldState: { error } }) => {
        // Convert value to option objects
        let selectedOptions;
        if (!value) {
          selectedOptions = multiple ? [] : null;
        } else if (multiple) {
          // Multiple selection - value is array of IDs
          const valueArray = Array.isArray(value) ? value : [];
          selectedOptions = options.filter((option) =>
            valueArray.includes(option.id)
          );
        } else {
          // Single selection - value is single ID or label
          selectedOptions =
            options.find(
              (option) => option.id === value || option.label === value
            ) || null;
        }

        const handleChange = (_event, newValue) => {
          if (multiple) {
            // Check max selections limit
            if (maxSelections && newValue.length > maxSelections) {
              return;
            }
            // Pass array of IDs
            onChange(newValue.map((option) => option.id));
          } else {
            // Pass single ID or label
            onChange(newValue ? newValue.id : "");
          }
        };

        return (
          <Autocomplete
            {...muiProps}
            multiple={multiple}
            options={options}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={selectedOptions}
            onChange={handleChange}
            disabled={disabled || isLoading}
            loading={isLoading}
            slots={{
              tag: multiple
                ? (props) => <Chip {...props} size="small" />
                : undefined,
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                placeholder={selectedOptions?.length === 0 ? placeholder : ""}
                fullWidth
                size="small"
                inputRef={ref}
                error={!!error}
                helperText={
                  error?.message ||
                  (isError ? "Failed to load options" : "") ||
                  (maxSelections && multiple
                    ? `Max ${maxSelections} selections (${
                        selectedOptions?.length || 0
                      }/${maxSelections})`
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
                    endAdornment: (
                      <>
                        {isLoading ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  },
                }}
                sx={(theme) => ({
                  "& .MuiInputBase-root": {
                    // Allow vertical expansion for multiple chips
                    minHeight: "40px",
                    height: "auto",
                    alignItems: "flex-start",
                    paddingTop: multiple ? "8px" : undefined,
                    paddingBottom: multiple ? "8px" : undefined,
                  },
                  "& .MuiInputBase-input": {
                    // Ensure input field aligns properly with chips
                    minHeight: "24px",
                  },
                  "& .MuiAutocomplete-tag": {
                    // Proper spacing for chips
                    margin: "2px",
                  },
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

MuiResourceSelect.propTypes = {
  name: PropTypes.string.isRequired,
  control: PropTypes.object.isRequired,
  rules: PropTypes.object,
  resourceType: PropTypes.oneOf([
    "departments",
    "users",
    "materials",
    "vendors",
  ]).isRequired,
  label: PropTypes.string.isRequired,
  multiple: PropTypes.bool,
  maxSelections: PropTypes.number,
  placeholder: PropTypes.string,
  startAdornment: PropTypes.node,
  disabled: PropTypes.bool,
  queryParams: PropTypes.object,
  watchersOnly: PropTypes.bool,
};

export default MuiResourceSelect;
