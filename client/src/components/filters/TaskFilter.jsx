// client/src/components/filters/TaskFilter.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { Box, FormControlLabel, Switch } from "@mui/material";
import FilterTextField from "../common/FilterTextField";
import FilterSelect from "../common/FilterSelect";
import FilterDateRange from "../common/FilterDateRange";
import {
  TASK_STATUS,
  TASK_PRIORITY,
  TASK_TYPES,
  PAGINATION,
} from "../../utils/constants";
import { useGetDepartmentsQuery } from "../../redux/features/department/departmentApi";
import { useGetUsersQuery } from "../../redux/features/user/userApi";
import { useGetVendorsQuery } from "../../redux/features/vendor/vendorApi";

/**
 * TaskFilter Component
 *
 * Filter component for Tasks resource.
 * Matches backend validator: backend/middlewares/validators/taskValidators.js (validateGetAllTasks)
 *
 * Backend Query Parameters:
 * - search: string (searches title, description, tags)
 * - taskType: string (from TASK_TYPES)
 * - status: string (from TASK_STATUS)
 * - priority: string (from TASK_PRIORITY)
 * - departmentId: MongoDB ObjectId
 * - assigneeId: MongoDB ObjectId
 * - vendorId: MongoDB ObjectId
 * - dueDateFrom: ISO 8601 date
 * - dueDateTo: ISO 8601 date
 * - dateFrom: ISO 8601 date (for RoutineTask)
 * - dateTo: ISO 8601 date (for RoutineTask)
 * - deleted: boolean
 * - createdBy: MongoDB ObjectId
 * - watcherId: MongoDB ObjectId
 * - tags: array of strings
 * - sortBy: string
 * - sortOrder: 'asc' | 'desc'
 *
 * @param {Object} props
 * @param {Object} props.filters - Current filter values from Redux
 * @param {Function} props.onFilterChange - Filter change handler (updates Redux)
 * @param {Function} props.onApply - Apply filters handler
 * @param {Function} props.onClear - Clear filters handler
 * @returns {JSX.Element}
 */
const TaskFilter = ({
  filters,
  onFilterChange,
  onApply,
  onClear,
  filterHandlers,
}) => {
  // Local state for filter values (only applied when "Apply" is clicked)
  const [localFilters, setLocalFilters] = useState(filters);

  // Sync local filters with Redux filters when dialog opens
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Handle local filter changes
  const handleLocalChange = (field, value) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Apply filters to Redux
  const handleApply = useCallback(() => {
    // Update all filters at once
    Object.entries(localFilters).forEach(([key, value]) => {
      onFilterChange(key, value);
    });
    if (onApply) onApply();
  }, [localFilters, onFilterChange, onApply]);

  // Clear all filters
  const handleClear = useCallback(() => {
    const clearedFilters = {
      status: null,
      priority: null,
      taskType: null,
      search: "",
      departmentId: null,
      assigneeId: null,
      vendorId: null,
      watcherId: null,
      createdBy: null,
      tags: [],
      dueDateFrom: null,
      dueDateTo: null,
      dateFrom: null,
      dateTo: null,
      deleted: false,
    };
    setLocalFilters(clearedFilters);
    if (onClear) onClear();
  }, [onClear]);

  // Expose handlers to parent via ref
  useEffect(() => {
    if (filterHandlers) {
      filterHandlers.current = {
        apply: handleApply,
        clear: handleClear,
      };
    }
  }, [filterHandlers, handleApply, handleClear]);

  // Fetch departments with error handling
  const { data: departmentsData, isError: isDepartmentsError } =
    useGetDepartmentsQuery({
      limit: PAGINATION.MAX_LIMIT,
      deleted: false,
    });

  // Fetch users with error handling
  const { data: usersData, isError: isUsersError } = useGetUsersQuery({
    limit: PAGINATION.MAX_LIMIT,
    deleted: false,
  });

  // Fetch vendors with error handling
  const { data: vendorsData, isError: isVendorsError } = useGetVendorsQuery({
    limit: PAGINATION.MAX_LIMIT,
    deleted: false,
  });

  // Safely handle departments data with error state
  const departments = useMemo(() => {
    if (isDepartmentsError) return [];
    return departmentsData?.departments || [];
  }, [departmentsData, isDepartmentsError]);

  // Safely handle users data with error state
  const users = useMemo(() => {
    if (isUsersError) return [];
    return usersData?.users || [];
  }, [usersData, isUsersError]);

  // Safely handle vendors data with error state
  const vendors = useMemo(() => {
    if (isVendorsError) return [];
    return vendorsData?.vendors || [];
  }, [vendorsData, isVendorsError]);

  // Task type options from constants (consistent with backend)
  const taskTypeOptions = useMemo(
    () =>
      TASK_TYPES.map((type) => ({
        value: type,
        label: type.replace("Task", " Task"),
      })),
    []
  );

  // Status options from constants (consistent with backend)
  const statusOptions = useMemo(
    () =>
      TASK_STATUS.map((status) => ({
        value: status,
        label: status,
      })),
    []
  );

  // Priority options from constants (consistent with backend)
  const priorityOptions = useMemo(
    () =>
      TASK_PRIORITY.map((priority) => ({
        value: priority,
        label: priority,
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

  // Assignee options from API
  const assigneeOptions = useMemo(
    () =>
      users.map((user) => ({
        value: user._id,
        label: user.fullName || `${user.firstName} ${user.lastName}`,
      })),
    [users]
  );

  // Vendor options from API
  const vendorOptions = useMemo(
    () =>
      vendors.map((vendor) => ({
        value: vendor._id,
        label: vendor.name,
      })),
    [vendors]
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Search Field */}
      <FilterTextField
        label="Search"
        value={localFilters.search || ""}
        onChange={(value) => handleLocalChange("search", value)}
        placeholder="Search by title, description, tags..."
      />

      {/* Task Type Filter */}
      <FilterSelect
        label="Task Type"
        value={localFilters.taskType || ""}
        onChange={(value) => handleLocalChange("taskType", value)}
        options={taskTypeOptions}
      />

      {/* Status Filter */}
      <FilterSelect
        label="Status"
        value={localFilters.status || ""}
        onChange={(value) => handleLocalChange("status", value)}
        options={statusOptions}
      />

      {/* Priority Filter */}
      <FilterSelect
        label="Priority"
        value={localFilters.priority || ""}
        onChange={(value) => handleLocalChange("priority", value)}
        options={priorityOptions}
      />

      {/* Department Filter */}
      <FilterSelect
        label="Department"
        value={localFilters.departmentId || ""}
        onChange={(value) => handleLocalChange("departmentId", value)}
        options={departmentOptions}
        disabled={isDepartmentsError}
      />

      {/* Assignee Filter */}
      <FilterSelect
        label="Assignee"
        value={localFilters.assigneeId || ""}
        onChange={(value) => handleLocalChange("assigneeId", value)}
        options={assigneeOptions}
        disabled={isUsersError}
      />

      {/* Watcher Filter */}
      <FilterSelect
        label="Watcher"
        value={localFilters.watcherId || ""}
        onChange={(value) => handleLocalChange("watcherId", value)}
        options={assigneeOptions}
        disabled={isUsersError}
      />

      {/* Created By Filter */}
      <FilterSelect
        label="Created By"
        value={localFilters.createdBy || ""}
        onChange={(value) => handleLocalChange("createdBy", value)}
        options={assigneeOptions}
        disabled={isUsersError}
      />

      {/* Vendor Filter */}
      <FilterSelect
        label="Vendor"
        value={localFilters.vendorId || ""}
        onChange={(value) => handleLocalChange("vendorId", value)}
        options={vendorOptions}
        disabled={isVendorsError}
      />

      {/* Due Date Range (for AssignedTask and ProjectTask) */}
      <FilterDateRange
        label="Due Date Range"
        fromValue={localFilters.dueDateFrom || null}
        toValue={localFilters.dueDateTo || null}
        onFromChange={(value) => handleLocalChange("dueDateFrom", value)}
        onToChange={(value) => handleLocalChange("dueDateTo", value)}
      />

      {/* Date Range (for RoutineTask) */}
      <FilterDateRange
        label="Date Range (Routine Tasks)"
        fromValue={localFilters.dateFrom || null}
        toValue={localFilters.dateTo || null}
        onFromChange={(value) => handleLocalChange("dateFrom", value)}
        onToChange={(value) => handleLocalChange("dateTo", value)}
      />

      {/* Deleted Filter */}
      <FormControlLabel
        control={
          <Switch
            checked={localFilters.deleted || false}
            onChange={(e) => handleLocalChange("deleted", e.target.checked)}
          />
        }
        label="Show Deleted Tasks"
      />
    </Box>
  );
};

TaskFilter.propTypes = {
  filters: PropTypes.object.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onApply: PropTypes.func,
  onClear: PropTypes.func,
};

export default TaskFilter;
