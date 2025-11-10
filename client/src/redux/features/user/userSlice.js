// client/src/redux/features/user/userSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { PAGINATION } from "../../../utils/constants";

const initialState = {
  filters: {
    search: "",
    role: "",
    departmentId: "", // FIXED: Changed from 'department' to 'departmentId' to match backend
    position: "",
    deleted: false,
  },
  pagination: {
    page: PAGINATION.DEFAULT_PAGE,
    limit: PAGINATION.DEFAULT_LIMIT,
    sortBy: PAGINATION.DEFAULT_SORT_BY,
    sortOrder: PAGINATION.DEFAULT_SORT_ORDER,
  },
  selectedId: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = PAGINATION.DEFAULT_PAGE; // Reset to first page on filter change
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.page = PAGINATION.DEFAULT_PAGE;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action) => {
      state.pagination.limit = action.payload;
      state.pagination.page = PAGINATION.DEFAULT_PAGE; // Reset to first page on limit change
    },
    setSortBy: (state, action) => {
      state.pagination.sortBy = action.payload.sortBy;
      state.pagination.sortOrder = action.payload.sortOrder;
    },
    setSelectedId: (state, action) => {
      state.selectedId = action.payload;
    },
  },
});

export const {
  setFilters,
  clearFilters,
  setPage,
  setLimit,
  setSortBy,
  setSelectedId,
} = userSlice.actions;

// Selectors
export const selectUserFilters = (state) => state.user.filters;
export const selectUserPagination = (state) => state.user.pagination;
export const selectSelectedUserId = (state) => state.user.selectedId;

export default userSlice.reducer;
