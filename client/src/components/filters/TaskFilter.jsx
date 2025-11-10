// client/src/components/filters/TaskFilter.jsx
import { useMemo } from "react";
import PropTypes from "prop-types";
import { Box, FormControlLabel, Switch } from "@mui/material";
import FilterTextField from "../common/FilterTextField";
import FilterSelect from "../common/FilterSelect";
import { TASK_STATUS, TASK_PRIORITY, TASK_TYPES } from "../../utils/constants";
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
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.onFilterChange - Filter change handler
 * @returns {JSX.Element}
 */
const TaskFilter = ({ filters, onFilterChange }) => {
  // Fetch departments with error handling
  const { data: departmentsData, isError: isDepartmentsError } =
    useGetDepartmentsQuery({
      limit: 100,
      deleted: false,
    });

  // Fetch users with error handling
  const { data: usersData, isError: isUsersError } = useGetUsersQuery({
    limit: 100,
    deleted: false,
  });

  // Fetch vendors with error handling
  const { data: vendorsData, isError: isVendorsError } = useGetVendorsQuery({
    limit: 100,
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
        value={filters.search || ""}
        onChange={(value) => onFilterChange("search", value)}
        placeholder="Search by title, description, tags..."
      />

      {/* Task Type Filter */}
      <FilterSelect
        label="Task Type"
        value={filters.taskType || ""}
        onChange={(value) => onFilterChange("taskType", value)}
        options={taskTypeOptions}
      />

      {/* Status Filter */}
      <FilterSelect
        label="Status"
        value={filters.status || ""}
        onChange={(value) => onFilterChange("status", value)}
        options={statusOptions}
      />

      {/* Priority Filter */}
      <FilterSelect
        label="Priority"
        value={filters.priority || ""}
        onChange={(value) => onFilterChange("priority", value)}
        options={priorityOptions}
      />

      {/* Department Filter */}
      <FilterSelect
        label="Department"
        value={filters.departmentId || ""}
        onChange={(value) => onFilterChange("departmentId", value)}
        options={departmentOptions}
        disabled={isDepartmentsError}
      />

      {/* Assignee Filter */}
      <FilterSelect
        label="Assignee"
        value={filters.assigneeId || ""}
        onChange={(value) => onFilterChange("assigneeId", value)}
        options={assigneeOptions}
        disabled={isUsersError}
      />

      {/* Vendor Filter */}
      <FilterSelect
        label="Vendor"
        value={filters.vendorId || ""}
        onChange={(value) => onFilterChange("vendorId", value)}
        options={vendorOptions}
        disabled={isVendorsError}
      />

      {/* Deleted Filter */}
      <FormControlLabel
        control={
          <Switch
            checked={filters.deleted || false}
            onChange={(e) => onFilterChange("deleted", e.target.checked)}
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
};

export default TaskFilter;
