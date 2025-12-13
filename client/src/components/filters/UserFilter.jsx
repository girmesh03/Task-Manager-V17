// client/src/components/filters/UserFilter.jsx
import { useMemo } from "react";
import PropTypes from "prop-types";
import { Box, FormControlLabel, Switch } from "@mui/material";
import FilterTextField from "../common/FilterTextField";
import FilterSelect from "../common/FilterSelect";
import { USER_ROLES, PAGINATION } from "../../utils/constants";
import { useGetDepartmentsQuery } from "../../redux/features/department/departmentApi";

/**
 * UserFilter Component
 *
 * Filter component for Users resource.
 * Matches backend validator: backend/middlewares/validators/userValidators.js (validateGetAllUsers)
 *
 * Backend Query Parameters:
 * - search: string (searches name, email, position)
 * - departmentId: MongoDB ObjectId
 * - role: string (from USER_ROLES)
 * - position: string
 * - deleted: boolean
 * - sortBy: string
 * - sortOrder: 'asc' | 'desc'
 *
 * @param {Object} props
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.onFilterChange - Filter change handler
 * @returns {JSX.Element}
 */
const UserFilter = ({ filters, onFilterChange }) => {
  // Fetch departments with error handling
  const { data: departmentsData, isError: isDepartmentsError } =
    useGetDepartmentsQuery({
      limit: PAGINATION.MAX_LIMIT,
      deleted: false,
    });

  // Safely handle departments data with error state
  const departments = useMemo(() => {
    if (isDepartmentsError) return [];
    return departmentsData?.departments || [];
  }, [departmentsData, isDepartmentsError]);

  // Role options from constants (consistent with backend)
  const roleOptions = useMemo(
    () =>
      Object.values(USER_ROLES).map((role) => ({
        value: role,
        label: role,
      })),
    []
  );

  // Department options from API
  const departmentOptions = useMemo(
    () =>
      departments.map((dept) => ({
        value: dept._id,
        label: dept.name,
      })),
    [departments]
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Search Field */}
      <FilterTextField
        label="Search"
        value={filters.search || ""}
        onChange={(value) => onFilterChange("search", value)}
        placeholder="Search by name, email, position..."
      />

      {/* Role Filter */}
      <FilterSelect
        label="Role"
        value={filters.role || ""}
        onChange={(value) => onFilterChange("role", value)}
        options={roleOptions}
      />

      {/* Department Filter - FIXED: Changed from 'department' to 'departmentId' */}
      <FilterSelect
        label="Department"
        value={filters.departmentId || ""}
        onChange={(value) => onFilterChange("departmentId", value)}
        options={departmentOptions}
        disabled={isDepartmentsError}
      />

      {/* Position Filter */}
      <FilterTextField
        label="Position"
        value={filters.position || ""}
        onChange={(value) => onFilterChange("position", value)}
        placeholder="Enter position..."
      />

      {/* Deleted Filter */}
      <FormControlLabel
        control={
          <Switch
            checked={filters.deleted || false}
            onChange={(e) => onFilterChange("deleted", e.target.checked)}
          />
        }
        label="Show Deleted Users"
      />
    </Box>
  );
};

UserFilter.propTypes = {
  filters: PropTypes.object.isRequired,
  onFilterChange: PropTypes.func.isRequired,
};

export default UserFilter;
