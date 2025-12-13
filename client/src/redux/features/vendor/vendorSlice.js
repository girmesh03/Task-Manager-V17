// client/src/redux/features/vendor/vendorSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { PAGINATION } from "../../../utils/constants";

const initialState = {
  filters: {
    search: "",
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

const vendorSlice = createSlice({
  name: "vendor",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = PAGINATION.DEFAULT_PAGE;
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
      state.pagination.page = PAGINATION.DEFAULT_PAGE;
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
} = vendorSlice.actions;

// Selectors
export const selectVendorFilters = (state) => state.vendor.filters;
export const selectVendorPagination = (state) => state.vendor.pagination;
export const selectSelectedVendorId = (state) => state.vendor.selectedId;

export default vendorSlice.reducer;
