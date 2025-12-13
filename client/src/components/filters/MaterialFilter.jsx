// client/src/components/filters/MaterialFilter.jsx
import { useMemo } from "react";
import PropTypes from "prop-types";
import { Box, FormControlLabel, Switch } from "@mui/material";
import FilterTextField from "../common/FilterTextField";
import FilterSelect from "../common/FilterSelect";
import { MATERIAL_CATEGORIES, PAGINATION } from "../../utils/constants";
import { useGetDepartmentsQuery } from "../../redux/features/department/departmentApi";

/**
 * MaterialFilter Component
 *
 * Filter component for Materials resource.
 * Matches backend validator: backend/middlewares/validators/materialValidators.js (validateGetAllMaterials)
 *
 * Backend Query Parameters:
 * - search: string (searches name)
 * - category: string (from MATERIAL_CATEGORIES)
 * - departmentId: MongoDB ObjectId
 * - priceMin: number
 * - priceMax: number
 * - deleted: boolean
 * - sortBy: string
 * - sortOrder: 'asc' | 'desc'
 *
 * @param {Object} props
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.onFilterChange - Filter change handler
 * @returns {JSX.Element}
 */
const MaterialFilter = ({ filters, onFilterChange }) => {
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

  // Category options from constants (consistent with backend)
  const categoryOptions = useMemo(
    () =>
      MATERIAL_CATEGORIES.map((category) => ({
        value: category,
        label: category,
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
        placeholder="Search by material name..."
      />

      {/* Category Filter */}
      <FilterSelect
        label="Category"
        value={filters.category || ""}
        onChange={(value) => onFilterChange("category", value)}
        options={categoryOptions}
      />

      {/* Department Filter */}
      <FilterSelect
        label="Department"
        value={filters.departmentId || ""}
        onChange={(value) => onFilterChange("departmentId", value)}
        options={departmentOptions}
        disabled={isDepartmentsError}
      />

      {/* Price Range Filters */}
      <FilterTextField
        label="Minimum Price"
        value={filters.priceMin || ""}
        onChange={(value) => onFilterChange("priceMin", value)}
        placeholder="Enter minimum price..."
        type="number"
      />

      <FilterTextField
        label="Maximum Price"
        value={filters.priceMax || ""}
        onChange={(value) => onFilterChange("priceMax", value)}
        placeholder="Enter maximum price..."
        type="number"
      />

      {/* Deleted Filter */}
      <FormControlLabel
        control={
          <Switch
            checked={filters.deleted || false}
            onChange={(e) => onFilterChange("deleted", e.target.checked)}
          />
        }
        label="Show Deleted Materials"
      />
    </Box>
  );
};

MaterialFilter.propTypes = {
  filters: PropTypes.object.isRequired,
  onFilterChange: PropTypes.func.isRequired,
};

export default MaterialFilter;
