// client/src/redux/features/task/taskSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { PAGINATION } from "../../../utils/constants";

/**
 * Initial state for task UI management
 * Handles filters, pagination, and selected task tracking
 */
const initialState = {
  filters: {
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
  },
  pagination: {
    page: PAGINATION.DEFAULT_PAGE,
    limit: PAGINATION.DEFAULT_LIMIT,
    sortBy: PAGINATION.DEFAULT_SORT_BY,
    sortOrder: PAGINATION.DEFAULT_SORT_ORDER,
  },
  selectedTaskId: null,
};

const taskSlice = createSlice({
  name: "task",
  initialState,
  reducers: {
    /**
     * Update one or more filter values
     * @param {Object} action.payload - Object containing filter key-value pairs
     */
    setFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },

    /**
     * Reset all filters to default values
     */
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },

    /**
     * Update current page number
     * @param {number} action.payload - Page number
     */
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },

    /**
     * Update items per page
     * @param {number} action.payload - Items per page
     */
    setLimit: (state, action) => {
      state.pagination.limit = action.payload;
      // Reset to first page when changing limit
      state.pagination.page = 1;
    },

    /**
     * Update sort field and order
     * @param {Object} action.payload - Object with sortBy and sortOrder
     */
    setSortBy: (state, action) => {
      state.pagination.sortBy = action.payload.sortBy;
      state.pagination.sortOrder = action.payload.sortOrder;
    },

    /**
     * Set the currently selected task ID
     * @param {string|null} action.payload - Task ID or null
     */
    setSelectedTaskId: (state, action) => {
      state.selectedTaskId = action.payload;
    },

    /**
     * Reset pagination to initial state
     */
    resetPagination: (state) => {
      state.pagination = initialState.pagination;
    },

    /**
     * Reset entire task UI state
     */
    resetTaskState: () => {
      return initialState;
    },
  },
});

// Export actions
export const {
  setFilters,
  clearFilters,
  setPage,
  setLimit,
  setSortBy,
  setSelectedTaskId,
  resetPagination,
  resetTaskState,
} = taskSlice.actions;

// Export reducer
export default taskSlice.reducer;

// Export selectors
export const selectTaskFilters = (state) => state.task.filters;
export const selectTaskPagination = (state) => state.task.pagination;
export const selectSelectedTaskId = (state) => state.task.selectedTaskId;
export const selectTaskState = (state) => state.task;
