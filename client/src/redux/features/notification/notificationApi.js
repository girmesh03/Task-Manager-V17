// client/src/redux/features/notification/notificationApi.js
import { apiSlice } from "../api";
import { API_ENDPOINTS } from "../../../utils/constants";

/**
 * Notification API Slice
 *
 * RTK Query API slice for notification-related endpoints.
 * Provides hooks for CRUD operations on notifications.
 *
 * Backend Reference:
 * - Controller: backend/controllers/notificationControllers.js
 * - Validators: backend/middlewares/validators/notificationValidators.js
 *
 * Endpoints:
 * - getNotifications: List notifications with pagination and filters
 * - getNotificationById: Get single notification details
 * - markAsRead: Mark notification as read
 * - markAllAsRead: Mark all notifications as read
 * - deleteNotification: Soft delete notification
 * - getUnreadCount: Get count of unread notifications
 */

export const notificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get all notifications with pagination and filters
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (default: 1)
     * @param {number} params.limit - Items per page (default: 10)
     * @param {boolean} params.unreadOnly - Show only unread notifications
     * @param {string} params.type - Filter by notification type
     * @param {boolean} params.deleted - Include deleted notifications
     * @param {string} params.sortBy - Sort field (default: sentAt)
     * @param {string} params.sortOrder - Sort order: asc/desc (default: desc)
     * @returns {Object} Paginated notifications list
     */
    getNotifications: builder.query({
      query: (params) => ({
        url: API_ENDPOINTS.NOTIFICATIONS,
        params,
      }),
      transformResponse: (response) => ({
        notifications: response.notifications,
        pagination: response.pagination,
      }),
      providesTags: (result) =>
        result?.notifications
          ? [
              ...result.notifications.map(({ _id }) => ({
                type: "Notification",
                id: _id,
              })),
              { type: "Notification", id: "LIST" },
            ]
          : [{ type: "Notification", id: "LIST" }],
    }),

    /**
     * Get single notification by ID
     * @param {string} notificationId - Notification ID
     * @returns {Object} Notification details
     */
    getNotificationById: builder.query({
      query: (notificationId) =>
        `${API_ENDPOINTS.NOTIFICATIONS}/${notificationId}`,
      transformResponse: (response) => response.notification,
      providesTags: (result, error, id) => [{ type: "Notification", id }],
    }),

    /**
     * Mark notification as read
     * @param {string} notificationId - Notification ID
     * @returns {Object} Updated notification
     */
    markAsRead: builder.mutation({
      query: (notificationId) => ({
        url: `${API_ENDPOINTS.NOTIFICATIONS}/${notificationId}/read`,
        method: "PATCH",
      }),
      transformResponse: (response) => response.notification,
      invalidatesTags: (result, error, notificationId) => [
        { type: "Notification", id: notificationId },
        { type: "Notification", id: "LIST" },
        { type: "Notification", id: "UNREAD_COUNT" },
      ],
      // Optimistic update for better UX
      async onQueryStarted(notificationId, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          notificationApi.util.updateQueryData(
            "getNotifications",
            undefined,
            (draft) => {
              const notification = draft.notifications?.find(
                (n) => n._id === notificationId
              );
              if (notification) {
                notification.isRead = true;
              }
            }
          )
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    /**
     * Mark all notifications as read
     * @returns {Object} Update confirmation
     */
    markAllAsRead: builder.mutation({
      query: () => ({
        url: `${API_ENDPOINTS.NOTIFICATIONS}/read-all`,
        method: "PATCH",
      }),
      transformResponse: (response) => response.notification,
      invalidatesTags: [
        { type: "Notification", id: "LIST" },
        { type: "Notification", id: "UNREAD_COUNT" },
      ],
    }),

    /**
     * Soft delete notification
     * @param {string} notificationId - Notification ID
     * @returns {Object} Deletion confirmation
     */
    deleteNotification: builder.mutation({
      query: (notificationId) => ({
        url: `${API_ENDPOINTS.NOTIFICATIONS}/${notificationId}`,
        method: "DELETE",
      }),
      transformResponse: (response) => response.notification,
      invalidatesTags: (result, error, notificationId) => [
        { type: "Notification", id: notificationId },
        { type: "Notification", id: "LIST" },
      ],
    }),

    /**
     * Get count of unread notifications
     * @param {Object} params - Query parameters
     * @param {string} params.type - Filter by notification type (optional)
     * @returns {Object} Unread count
     */
    getUnreadCount: builder.query({
      query: (params) => ({
        url: `${API_ENDPOINTS.NOTIFICATIONS}/unread-count`,
        params,
      }),
      transformResponse: (response) => response.notification,
      providesTags: [{ type: "Notification", id: "UNREAD_COUNT" }],
      // Poll for updates every 30 seconds
      pollingInterval: 30000,
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetNotificationsQuery,
  useGetNotificationByIdQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useGetUnreadCountQuery,
} = notificationApi;
