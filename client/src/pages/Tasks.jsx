// client/src/pages/Tasks.jsx
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useGetTasksQuery } from "../redux/features/task/taskApi";
import {
  selectTaskFilters,
  selectTaskPagination,
} from "../redux/features/task/taskSlice";
import { LoadingFallback } from "../components/common/MuiLoading";
import RouteError from "../components/common/RouteError";
import { handleRTKError } from "../utils/errorHandler";
import { Box, Typography, Paper } from "@mui/material";

const Tasks = () => {
  const filters = useSelector(selectTaskFilters);
  const pagination = useSelector(selectTaskPagination);

  const queryParams = {
    page: pagination.page,
    limit: pagination.limit,
    sortBy: pagination.sortBy,
    sortOrder: pagination.sortOrder,
    ...(filters.taskType && { taskType: filters.taskType }),
    ...(filters.status && { status: filters.status }),
    ...(filters.priority && { priority: filters.priority }),
    ...(filters.departmentId && { departmentId: filters.departmentId }),
    ...(filters.assigneeId && { assigneeId: filters.assigneeId }),
    ...(filters.vendorId && { vendorId: filters.vendorId }),
    ...(filters.watcherId && { watcherId: filters.watcherId }),
    ...(filters.createdBy && { createdBy: filters.createdBy }),
    ...(filters.dueDateFrom && { dueDateFrom: filters.dueDateFrom }),
    ...(filters.dueDateTo && { dueDateTo: filters.dueDateTo }),
    ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
    ...(filters.dateTo && { dateTo: filters.dateTo }),
    ...(filters.search && { search: filters.search }),
    ...(filters.tags && filters.tags.length > 0 && { tags: filters.tags }),
    ...(filters.deleted !== undefined && { deleted: filters.deleted }),
  };

  const { data, error, isLoading, isError, refetch } =
    useGetTasksQuery(queryParams);

  useEffect(() => {
    if (error) {
      handleRTKError(error, "Failed to load tasks");
    }
  }, [error]);

  // Show RouteError for API errors
  if (isError) {
    return (
      <RouteError
        error={error}
        isError={isError}
        isLoading={isLoading}
        onRetry={refetch}
      />
    );
  }

  // Show loading state
  if (isLoading) {
    return <LoadingFallback message="Loading tasks..." height="100%" />;
  }

  return <Box>Tasks</Box>;
};

export default Tasks;
