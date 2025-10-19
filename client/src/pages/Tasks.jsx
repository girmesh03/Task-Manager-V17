// client/src/pages/Tasks.jsx
import { Box, Button } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { useGetTasksQuery } from "../redux/features/tasks/tasksApi";
import {
  selectTaskFilters,
  selectTaskPagination,
  setFilters,
  clearFilters,
  setPage,
} from "../redux/features/tasks/tasksSlice";
import TaskList from "../components/tasks/TaskList";
import TaskFilters from "../components/tasks/TaskFilters";

const Tasks = () => {
  const dispatch = useDispatch();
  const filters = useSelector(selectTaskFilters);
  const pagination = useSelector(selectTaskPagination);

  const { data, isLoading, error } = useGetTasksQuery({
    ...filters,
    ...pagination,
  });

  const handleFilterChange = (newFilters) => {
    dispatch(setFilters(newFilters));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  const handlePageChange = (page) => {
    dispatch(setPage(page));
  };

  const handleEdit = (task) => {
    console.log("Edit task:", task);
    // TODO: Open edit dialog/modal
  };

  const handleDelete = (task) => {
    console.log("Delete task:", task);
    // TODO: Show confirmation dialog
  };

  const handleCreateTask = () => {
    console.log("Create new task");
    // TODO: Open create task dialog/modal
  };

  return (
    <Box sx={{ py: 4, px: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateTask}
          sx={{
            bgcolor: (theme) => theme.palette.success.main,
            "&:hover": {
              bgcolor: (theme) => theme.palette.success.dark,
            },
          }}
        >
          New Task
        </Button>
      </Box>

      <TaskFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      <TaskList
        tasks={data?.docs}
        isLoading={isLoading}
        error={error}
        pagination={
          data
            ? {
                page: data.page,
                totalPages: data.totalPages,
                totalDocs: data.totalDocs,
              }
            : null
        }
        onPageChange={handlePageChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </Box>
  );
};

export default Tasks;
