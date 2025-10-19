// client/src/components/tasks/TaskList.jsx
import {
  Box,
  Grid,
  Pagination,
  Typography,
  CircularProgress,
} from "@mui/material";
import TaskCard from "./TaskCard";

const TaskList = ({
  tasks = [],
  isLoading,
  error,
  pagination,
  onPageChange,
  onEdit,
  onDelete,
}) => {
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <Typography color="error">
          Error loading tasks: {error.message || "Unknown error"}
        </Typography>
      </Box>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <Typography color="text.secondary">No tasks found</Typography>
      </Box>
    );
  }

  return (
    <>
      <Grid container spacing={3}>
        {tasks.map((task) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={task._id}>
            <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} />
          </Grid>
        ))}
      </Grid>

      {pagination && pagination.totalPages > 1 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 4,
          }}
        >
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={(_event, page) => onPageChange(page)}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </>
  );
};

export default TaskList;
