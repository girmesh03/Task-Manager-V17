// client/src/components/filters/VendorFilter.jsx
import PropTypes from "prop-types";
import { Box, FormControlLabel, Switch } from "@mui/material";
import FilterTextField from "../common/FilterTextField";

/**
 * VendorFilter Component
 *
 * Filter component for Vendors resource.
 * Matches backend validator: backend/middlewares/validators/vendorValidators.js (validateGetAllVendors)
 *
 * Backend Query Parameters:
 * - search: string (searches name, email, phone)
 * - deleted: boolean
 * - sortBy: string
 * - sortOrder: 'asc' | 'desc'
 *
 * @param {Object} props
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.onFilterChange - Filter change handler
 * @returns {JSX.Element}
 */
const VendorFilter = ({ filters, onFilterChange }) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Search Field */}
      <FilterTextField
        label="Search"
        value={filters.search || ""}
        onChange={(value) => onFilterChange("search", value)}
        placeholder="Search by name, email, or phone..."
      />

      {/* Deleted Filter */}
      <FormControlLabel
        control={
          <Switch
            checked={filters.deleted || false}
            onChange={(e) => onFilterChange("deleted", e.target.checked)}
          />
        }
        label="Show Deleted Vendors"
      />
    </Box>
  );
};

VendorFilter.propTypes = {
  filters: PropTypes.object.isRequired,
  onFilterChange: PropTypes.func.isRequired,
};

export default VendorFilter;
