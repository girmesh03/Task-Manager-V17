// client/src/redux/features/tasks/tasksSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  filters: {
    status: "",
    priority: "",
    taskType: "",
    search: "",
  },
  pagination: {
    page: 1,
    limit: 10,
  },
  selectedTask: null,
};

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Reset to first page on filter change
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.page = 1;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1; // Reset to first page on limit change
    },
    setSelectedTask: (state, action) => {
      state.selectedTask = action.payload;
    },
    clearSelectedTask: (state) => {
      state.selectedTask = null;
    },
  },
});

export const {
  setFilters,
  clearFilters,
  setPage,
  setLimit,
  setSelectedTask,
  clearSelectedTask,
} = tasksSlice.actions;

export default tasksSlice.reducer;

// Selectors
export const selectTaskFilters = (state) => state.tasks.filters;
export const selectTaskPagination = (state) => state.tasks.pagination;
export const selectSelectedTask = (state) => state.tasks.selectedTask;
