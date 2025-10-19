// client/src/components/tasks/TaskFilters.jsx
import {
  Box,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { Clear as ClearIcon } from "@mui/icons-material";

const TaskFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const statusOptions = [
    { value: "To Do", label: "To Do" },
    { value: "In Progress", label: "In Progress" },
    { value: "Completed", label: "Completed" },
    { value: "Cancelled", label: "Cancelled" },
  ];

  const priorityOptions = [
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
  ];

  const taskTypeOptions = [
    { value: "ProjectTask", label: "Project Task" },
    { value: "AssignedTask", label: "Assigned Task" },
    { value: "RoutineTask", label: "Routine Task" },
  ];

  const hasActiveFilters =
    filters.status || filters.priority || filters.taskType;

  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        mb: 3,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel id="status-select-label">Status</InputLabel>
        <Select
          labelId="status-select-label"
          id="status-select"
          value={filters.status || ""}
          label="Status"
          onChange={(e) => onFilterChange({ status: e.target.value })}
        >
          <MenuItem value="">
            <em>All Statuses</em>
          </MenuItem>
          {statusOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel id="priority-select-label">Priority</InputLabel>
        <Select
          labelId="priority-select-label"
          id="priority-select"
          value={filters.priority || ""}
          label="Priority"
          onChange={(e) => onFilterChange({ priority: e.target.value })}
        >
          <MenuItem value="">
            <em>All Priorities</em>
          </MenuItem>
          {priorityOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel id="tasktype-select-label">Task Type</InputLabel>
        <Select
          labelId="tasktype-select-label"
          id="tasktype-select"
          value={filters.taskType || ""}
          label="Task Type"
          onChange={(e) => onFilterChange({ taskType: e.target.value })}
        >
          <MenuItem value="">
            <em>All Types</em>
          </MenuItem>
          {taskTypeOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        variant="outlined"
        startIcon={<ClearIcon />}
        onClick={onClearFilters}
        size="small"
        disabled={!hasActiveFilters}
      >
        Clear
      </Button>
    </Box>
  );
};

export default TaskFilters;
