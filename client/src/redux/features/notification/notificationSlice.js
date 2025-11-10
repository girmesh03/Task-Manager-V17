// client/src/redux/features/notification/notificationSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { PAGINATION } from "../../../utils/constants";

const initialState = {
  filters: {
    unreadOnly: false,
    type: "",
    deleted: false,
  },
  pagination: {
    page: PAGINATION.DEFAULT_PAGE,
    limit: PAGINATION.DEFAULT_LIMIT,
    sortBy: PAGINATION.DEFAULT_SORT_BY,
    sortOrder: PAGINATION.DEFAULT_SORT_ORDER,
  },
  selectedId: null,
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: "notification",
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
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },
    decrementUnreadCount: (state) => {
      if (state.unreadCount > 0) {
        state.unreadCount -= 1;
      }
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
  setUnreadCount,
  incrementUnreadCount,
  decrementUnreadCount,
} = notificationSlice.actions;

// Selectors
export const selectNotificationFilters = (state) => state.notification.filters;
export const selectNotificationPagination = (state) => state.notification.pagination;
export const selectSelectedNotificationId = (state) => state.notification.selectedId;
export const selectUnreadCount = (state) => state.notification.unreadCount;

export default notificationSlice.reducer;
