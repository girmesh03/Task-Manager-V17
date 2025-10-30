// client/src/redux/features/user/userApi.js
import { apiSlice } from "../api";
import { API_ENDPOINTS } from "../../../utils/constants";

/**
 * User API Slice
 *
 * RTK Query API slice for user-related endpoints.
 * Provides hooks for CRUD operations on users.
 *
 * Backend Reference:
 * - Controller: backend/controllers/userControllers.js
 * - Validators: backend/middlewares/validators/userValidators.js
 *
 * Endpoints:
 * - getUsers: List users with pagination and filters
 * - getUserById: Get single user details
 * - createUser: Create new user
 * - updateUser: Update user details
 * - deleteUser: Soft delete user
 * - restoreUser: Restore soft-deleted user
 * - updateProfile: Update own profile
 * - updateEmailPreferences: Update email notification preferences
 * - sendBulkAnnouncement: Send bulk announcement to users
 */

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get all users with pagination and filters
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (default: 1)
     * @param {number} params.limit - Items per page (default: 10)
     * @param {string} params.search - Search term for name, email, position
     * @param {boolean} params.deleted - Include deleted users
     * @param {string} params.role - Filter by role
     * @param {string} params.departmentId - Filter by department
     * @param {string} params.sortBy - Sort field (default: createdAt)
     * @param {string} params.sortOrder - Sort order: asc/desc (default: desc)
     * @returns {Object} Paginated users list
     */
    getUsers: builder.query({
      query: (params) => ({
        url: API_ENDPOINTS.USERS,
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: "User", id: _id })),
              { type: "User", id: "LIST" },
            ]
          : [{ type: "User", id: "LIST" }],
    }),

    /**
     * Get single user by ID
     * @param {string} userId - User ID
     * @returns {Object} User details
     */
    getUserById: builder.query({
      query: (userId) => `${API_ENDPOINTS.USERS}/${userId}`,
      providesTags: (result, error, id) => [{ type: "User", id }],
    }),

    /**
     * Create new user
     * @param {Object} data - User data
     * @param {string} data.firstName - User first name
     * @param {string} data.lastName - User last name
     * @param {string} data.email - User email
     * @param {string} data.password - User password
     * @param {string} data.role - User role
     * @param {string} data.position - User position
     * @param {string} data.departmentId - Department ID
     * @param {string} data.profilePicture - Profile picture URL
     * @param {Array} data.skills - User skills
     * @param {string} data.employeeId - Employee ID
     * @param {Date} data.dateOfBirth - Date of birth
     * @param {Date} data.joinedAt - Joined date
     * @returns {Object} Created user
     */
    createUser: builder.mutation({
      query: (data) => ({
        url: API_ENDPOINTS.USERS,
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),

    /**
     * Update user
     * @param {Object} params - Update parameters
     * @param {string} params.userId - User ID
     * @param {Object} params.data - Updated user data
     * @returns {Object} Updated user
     */
    updateUser: builder.mutation({
      query: ({ userId, ...data }) => ({
        url: `${API_ENDPOINTS.USERS}/${userId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "User", id: userId },
        { type: "User", id: "LIST" },
      ],
    }),

    /**
     * Soft delete user
     * @param {string} userId - User ID
     * @returns {Object} Deletion confirmation
     */
    deleteUser: builder.mutation({
      query: (userId) => ({
        url: `${API_ENDPOINTS.USERS}/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, userId) => [
        { type: "User", id: userId },
        { type: "User", id: "LIST" },
        { type: "Task", id: "LIST" },
        { type: "Notification", id: "LIST" },
      ],
    }),

    /**
     * Restore soft-deleted user
     * @param {string} userId - User ID
     * @returns {Object} Restored user
     */
    restoreUser: builder.mutation({
      query: (userId) => ({
        url: `${API_ENDPOINTS.USERS}/${userId}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, userId) => [
        { type: "User", id: userId },
        { type: "User", id: "LIST" },
      ],
    }),

    /**
     * Update own profile
     * @param {Object} data - Profile data to update
     * @param {string} data.firstName - First name
     * @param {string} data.lastName - Last name
     * @param {string} data.position - Position
     * @param {string} data.profilePicture - Profile picture URL
     * @param {Array} data.skills - Skills array
     * @returns {Object} Updated user profile
     */
    updateProfile: builder.mutation({
      query: (data) => ({
        url: `${API_ENDPOINTS.USERS}/profile`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result) =>
        result?.data?._id
          ? [
              { type: "User", id: result.data._id },
              { type: "User", id: "LIST" },
            ]
          : [{ type: "User", id: "LIST" }],
    }),

    /**
     * Update email notification preferences
     * @param {Object} preferences - Email preferences
     * @param {boolean} preferences.emailNotifications - Enable/disable all email notifications
     * @param {boolean} preferences.taskNotifications - Task notifications
     * @param {boolean} preferences.taskReminders - Task reminders
     * @param {boolean} preferences.mentions - Mention notifications
     * @param {boolean} preferences.announcements - Announcement notifications
     * @param {boolean} preferences.welcomeEmails - Welcome emails
     * @param {boolean} preferences.passwordReset - Password reset emails
     * @returns {Object} Updated user with preferences
     */
    updateEmailPreferences: builder.mutation({
      query: (preferences) => ({
        url: `${API_ENDPOINTS.USERS}/email-preferences`,
        method: "PATCH",
        body: preferences,
      }),
      invalidatesTags: (result) =>
        result?.data?._id
          ? [
              { type: "User", id: result.data._id },
              { type: "User", id: "LIST" },
            ]
          : [{ type: "User", id: "LIST" }],
    }),

    /**
     * Send bulk announcement to users
     * @param {Object} data - Announcement data
     * @param {string} data.title - Announcement title
     * @param {string} data.message - Announcement message
     * @param {string} data.departmentId - Target department ID (optional)
     * @returns {Object} Announcement confirmation
     */
    sendBulkAnnouncement: builder.mutation({
      query: (data) => ({
        url: `${API_ENDPOINTS.USERS}/bulk-announcement`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useRestoreUserMutation,
  useUpdateProfileMutation,
  useUpdateEmailPreferencesMutation,
  useSendBulkAnnouncementMutation,
} = userApi;
