// client/src/components/lists/TasksList.jsx
import { memo } from "react";
import { Grid, Stack, Box, Pagination } from "@mui/material";
import TaskCard from "../cards/TaskCard";

/**
 * TasksList Component - Optimized list rendering for tasks
 *
 * Responsibilities:
 * - Render grid of task cards
 * - Handle pagination UI
 * - Memoized to prevent unnecessary re-renders
 *
 * @param {Object} props
 * @param {Array} props.tasks - Array of task objects
 * @param {Object} props.pagination - Pagination state { page, totalPages }
 * @param {Function} props.onPageChange - Page change handler
 * @param {Function} props.onView - View task handler
 * @param {Function} props.onEdit - Edit task handler
 * @param {Function} props.onDelete - Delete task handler
 * @param {Function} props.onRestore - Restore task handler
 * @param {boolean} props.isFetching - Loading state for pagination
 * @returns {JSX.Element}
 */
const TasksList = ({
  tasks,
  pagination,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  onRestore,
  isFetching,
}) => {
  return (
    <Stack direction="column" spacing={2}>
      {/* Tasks Grid */}
      <Grid container spacing={2}>
        {tasks.map((task) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={task._id}>
            <TaskCard
              task={task}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onRestore={onRestore}
            />
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={onPageChange}
            color="primary"
            size="large"
            disabled={isFetching}
          />
        </Box>
      )}
    </Stack>
  );
};

// Memoize to prevent re-renders when props haven't changed
export default memo(TasksList);
