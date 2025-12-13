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
     * @param {string} params.departmentId - Filter by department
     * @param {string} params.role - Filter by role
     * @param {string} params.position - Filter by position
     * @param {boolean} params.deleted - Include deleted users
     * @param {string} params.sortBy - Sort field (default: createdAt)
     * @param {string} params.sortOrder - Sort order: asc/desc (default: desc)
     * @returns {Object} Paginated users list
     */
    getUsers: builder.query({
      query: (params) => ({
        url: API_ENDPOINTS.USERS,
        params,
      }),
      transformResponse: (response) => ({
        users: response.users,
        pagination: response.pagination,
      }),
      providesTags: (result) =>
        result?.users
          ? [
              ...result.users.map(({ _id }) => ({ type: "User", id: _id })),
              { type: "User", id: "LIST" },
            ]
          : [{ type: "User", id: "LIST" }],
    }),

    /**
     * Get single user by ID with complete profile, assigned tasks, and performance metrics
     * @param {string} userId - User ID
     * @returns {Object} User details with related data
     */
    getUserById: builder.query({
      query: (userId) => `${API_ENDPOINTS.USERS}/${userId}`,
      transformResponse: (response) => response.user,
      providesTags: (result, error, id) => [{ type: "User", id }],
    }),

    /**
     * Create new user within a specific department
     * @param {Object} data - User data
     * @param {string} data.firstName - User first name
     * @param {string} data.lastName - User last name
     * @param {string} data.position - User position
     * @param {string} data.role - User role
     * @param {string} data.email - User email
     * @param {string} data.password - User password
     * @param {string} data.departmentId - Department ID
     * @param {Object} data.profilePicture - Profile picture object with url and publicId (optional)
     * @param {Array} data.skills - User skills array (optional)
     * @param {number} data.employeeId - Employee ID (optional)
     * @param {Date} data.dateOfBirth - Date of birth (optional)
     * @param {Date} data.joinedAt - Joined date
     * @returns {Object} Created user
     */
    createUser: builder.mutation({
      query: (data) => ({
        url: API_ENDPOINTS.USERS,
        method: "POST",
        body: data,
      }),
      transformResponse: (response) => response.user,
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),

    /**
     * Update user by SuperAdmin - can update any user fields including role changes and department transfers
     * @param {Object} params - Update parameters
     * @param {string} params.userId - User ID
     * @param {string} params.firstName - Updated first name (optional)
     * @param {string} params.lastName - Updated last name (optional)
     * @param {string} params.position - Updated position (optional)
     * @param {string} params.role - Updated role (optional)
     * @param {string} params.departmentId - Updated department ID (optional)
     * @param {Object} params.profilePicture - Updated profile picture object (optional)
     * @param {Array} params.skills - Updated skills array (optional)
     * @param {number} params.employeeId - Updated employee ID (optional)
     * @param {Date} params.dateOfBirth - Updated date of birth (optional)
     * @param {Date} params.joinedAt - Updated joined date (optional)
     * @returns {Object} Updated user
     */
    updateUser: builder.mutation({
      query: ({ userId, ...data }) => ({
        url: `${API_ENDPOINTS.USERS}/${userId}`,
        method: "PUT",
        body: data,
      }),
      transformResponse: (response) => response.user,
      invalidatesTags: (result, error, { userId }) => [
        { type: "User", id: userId },
        { type: "User", id: "LIST" },
      ],
    }),

    /**
     * Soft delete user with cascade deletion
     * @param {string} userId - User ID
     * @returns {Object} Deletion confirmation
     */
    deleteUser: builder.mutation({
      query: (userId) => ({
        url: `${API_ENDPOINTS.USERS}/${userId}`,
        method: "DELETE",
      }),
      transformResponse: (response) => response.user,
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
        method: "POST",
      }),
      transformResponse: (response) => response.user,
      invalidatesTags: (result, error, userId) => [
        { type: "User", id: userId },
        { type: "User", id: "LIST" },
      ],
    }),

    /**
     * Update own user profile with role-based field restrictions
     * @param {Object} params - Update parameters
     * @param {string} params.userId - User ID (must match authenticated user)
     * @param {string} params.firstName - Updated first name (optional)
     * @param {string} params.lastName - Updated last name (optional)
     * @param {string} params.position - Updated position (optional)
     * @param {string} params.role - Updated role (optional)
     * @param {string} params.email - Updated email (optional)
     * @param {string} params.password - Updated password (optional)
     * @param {Object} params.profilePicture - Updated profile picture object (optional)
     * @param {Array} params.skills - Updated skills array (optional)
     * @param {number} params.employeeId - Updated employee ID (optional)
     * @param {Date} params.dateOfBirth - Updated date of birth (optional)
     * @param {Date} params.joinedAt - Updated joined date (optional)
     * @returns {Object} Updated user profile
     */
    updateProfile: builder.mutation({
      query: ({ userId, ...data }) => ({
        url: `${API_ENDPOINTS.USERS}/${userId}/profile`,
        method: "PUT",
        body: data,
      }),
      transformResponse: (response) => response.user,
      invalidatesTags: (result, error, { userId }) => [
        { type: "User", id: userId },
        { type: "User", id: "LIST" },
      ],
    }),

    /**
     * Get current authenticated user's account information
     * @param {string} userId - User ID (must match authenticated user)
     * @returns {Object} User account object with security-related information
     */
    getMyAccount: builder.query({
      query: (userId) => `${API_ENDPOINTS.USERS}/${userId}/account`,
      transformResponse: (response) => response.user,
      providesTags: (result, error, userId) => [{ type: "User", id: userId }],
    }),

    /**
     * Get current authenticated user's complete profile
     * @param {Object} params - Query parameters
     * @param {string} params.userId - User ID (must match authenticated user)
     * @param {boolean} params.includeSkills - Include skills in response
     * @param {boolean} params.includeStats - Include performance stats
     * @returns {Object} User profile object with personal data
     */
    getMyProfile: builder.query({
      query: ({ userId, ...params }) => ({
        url: `${API_ENDPOINTS.USERS}/${userId}/profile`,
        params,
      }),
      transformResponse: (response) => response.user,
      providesTags: (result, error, { userId }) => [
        { type: "User", id: userId },
      ],
    }),

    /**
     * Get user's email notification preferences
     * @param {string} userId - User ID
     * @returns {Object} User email preferences object
     */
    getEmailPreferences: builder.query({
      query: (userId) => `${API_ENDPOINTS.USERS}/${userId}/email-preferences`,
      transformResponse: (response) => response.user,
      providesTags: (result, error, userId) => [{ type: "User", id: userId }],
    }),

    /**
     * Update user's email notification preferences
     * @param {Object} params - Update parameters
     * @param {string} params.userId - User ID
     * @param {boolean} params.enabled - Enable/disable all email notifications (optional)
     * @param {boolean} params.taskNotifications - Task notifications (optional)
     * @param {boolean} params.taskReminders - Task reminders (optional)
     * @param {boolean} params.mentions - Mention notifications (optional)
     * @param {boolean} params.announcements - Announcement notifications (optional)
     * @param {boolean} params.welcomeEmails - Welcome emails (optional)
     * @param {boolean} params.passwordReset - Password reset emails (optional)
     * @returns {Object} Updated email preferences object
     */
    updateEmailPreferences: builder.mutation({
      query: ({ userId, ...preferences }) => ({
        url: `${API_ENDPOINTS.USERS}/${userId}/email-preferences`,
        method: "PUT",
        body: preferences,
      }),
      transformResponse: (response) => response.user,
      invalidatesTags: (result, error, { userId }) => [
        { type: "User", id: userId },
        { type: "User", id: "LIST" },
      ],
    }),

    /**
     * Get current user's email notification preferences
     * @returns {Object} Current user's email preferences object
     */
    getMyEmailPreferences: builder.query({
      query: () => `${API_ENDPOINTS.USERS}/me/email-preferences`,
      transformResponse: (response) => response.user,
      providesTags: [{ type: "User", id: "ME" }],
    }),

    /**
     * Update current user's email notification preferences
     * @param {Object} preferences - Email preferences
     * @param {boolean} preferences.enabled - Enable/disable all email notifications (optional)
     * @param {boolean} preferences.taskNotifications - Task notifications (optional)
     * @param {boolean} preferences.taskReminders - Task reminders (optional)
     * @param {boolean} preferences.mentions - Mention notifications (optional)
     * @param {boolean} preferences.announcements - Announcement notifications (optional)
     * @param {boolean} preferences.welcomeEmails - Welcome emails (optional)
     * @param {boolean} preferences.passwordReset - Password reset emails (optional)
     * @returns {Object} Updated email preferences object
     */
    updateMyEmailPreferences: builder.mutation({
      query: (preferences) => ({
        url: `${API_ENDPOINTS.USERS}/me/email-preferences`,
        method: "PUT",
        body: preferences,
      }),
      transformResponse: (response) => response.user,
      invalidatesTags: [{ type: "User", id: "ME" }],
    }),

    /**
     * Send bulk announcement email to organization or department users
     * @param {Object} data - Announcement data
     * @param {string} data.title - Announcement title
     * @param {string} data.message - Announcement message
     * @param {string} data.targetType - Target type: 'organization' or 'department'
     * @param {string} data.targetDepartmentId - Target department ID (required if targetType is 'department')
     * @returns {Object} Announcement confirmation
     */
    sendBulkAnnouncement: builder.mutation({
      query: (data) => ({
        url: `${API_ENDPOINTS.USERS}/bulk-announcement`,
        method: "POST",
        body: data,
      }),
      transformResponse: (response) => response.notification,
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
  useGetMyAccountQuery,
  useGetMyProfileQuery,
  useGetEmailPreferencesQuery,
  useUpdateEmailPreferencesMutation,
  useGetMyEmailPreferencesQuery,
  useUpdateMyEmailPreferencesMutation,
  useSendBulkAnnouncementMutation,
} = userApi;
