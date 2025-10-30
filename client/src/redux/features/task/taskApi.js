// client/src/redux/features/task/taskApi.js
import { apiSlice } from "../api.js";

/**
 * Task API endpoints
 * Extends the base apiSlice with task-related endpoints
 * All endpoints inherit automatic token refresh from baseQueryWithReauth
 */
export const taskApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================
    // TASK ENDPOINTS
    // ============================================

    /**
     * Get list of tasks with pagination and filtering
     * @param {Object} params - Query parameters
     * @returns {Object} { tasks: [], pagination: {} }
     */
    getTasks: builder.query({
      query: (params) => ({
        url: "/tasks",
        params,
      }),
      transformResponse: (response) => ({
        tasks: response.data,
        pagination: response.pagination,
      }),
      providesTags: (result) =>
        result?.tasks
          ? [
              "Task",
              ...result.tasks.map((task) => ({ type: "Task", id: task._id })),
            ]
          : ["Task"],
    }),

    /**
     * Get single task by ID
     * @param {string} taskId - Task ID
     * @returns {Object} Task object with populated relationships
     */
    getTaskById: builder.query({
      query: (taskId) => `/tasks/${taskId}`,
      providesTags: (result, error, taskId) => [{ type: "Task", id: taskId }],
    }),

    /**
     * Create new task
     * @param {Object} taskData - Task data
     * @returns {Object} Created task
     */
    createTask: builder.mutation({
      query: (taskData) => ({
        url: "/tasks",
        method: "POST",
        body: taskData,
      }),
      invalidatesTags: ["Task"],
    }),

    /**
     * Update existing task
     * @param {Object} { taskId, ...updateData } - Task ID and update data
     * @returns {Object} Updated task
     */
    updateTask: builder.mutation({
      query: ({ taskId, ...updateData }) => ({
        url: `/tasks/${taskId}`,
        method: "PUT",
        body: updateData,
      }),
      invalidatesTags: (result, error, arg) => [
        "Task",
        { type: "Task", id: arg.taskId },
      ],
    }),

    /**
     * Soft delete task
     * @param {string} taskId - Task ID
     * @returns {Object} Success message
     */
    deleteTask: builder.mutation({
      query: (taskId) => ({
        url: `/tasks/${taskId}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        "Task",
        "TaskActivity",
        "TaskComment",
        "Attachment",
        "Notification",
      ],
    }),

    /**
     * Restore soft-deleted task
     * @param {string} taskId - Task ID
     * @returns {Object} Restored task
     */
    restoreTask: builder.mutation({
      query: (taskId) => ({
        url: `/tasks/${taskId}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: ["Task"],
    }),

    // ============================================
    // TASK ACTIVITY ENDPOINTS
    // ============================================

    /**
     * Get list of activities for a task
     * @param {Object} { taskId, ...params } - Task ID and query parameters
     * @returns {Object} { activities: [], pagination: {} }
     */
    getTaskActivities: builder.query({
      query: ({ taskId, ...params }) => ({
        url: `/tasks/${taskId}/activities`,
        params,
      }),
      transformResponse: (response) => ({
        activities: response.data,
        pagination: response.pagination,
      }),
      providesTags: (result) =>
        result?.activities
          ? [
              "TaskActivity",
              ...result.activities.map((activity) => ({
                type: "TaskActivity",
                id: activity._id,
              })),
            ]
          : ["TaskActivity"],
    }),

    /**
     * Get single activity by ID
     * @param {Object} { taskId, activityId } - Task ID and Activity ID
     * @returns {Object} Activity object with populated relationships
     */
    getTaskActivityById: builder.query({
      query: ({ taskId, activityId }) =>
        `/tasks/${taskId}/activities/${activityId}`,
      providesTags: (result, error, { activityId }) => [
        { type: "TaskActivity", id: activityId },
      ],
    }),

    /**
     * Create new task activity
     * @param {Object} { taskId, ...activityData } - Task ID and activity data
     * @returns {Object} Created activity
     */
    createTaskActivity: builder.mutation({
      query: ({ taskId, ...activityData }) => ({
        url: `/tasks/${taskId}/activities`,
        method: "POST",
        body: activityData,
      }),
      invalidatesTags: (result, error, arg) => [
        "TaskActivity",
        { type: "Task", id: arg.taskId },
        "Material",
      ],
    }),

    /**
     * Update existing task activity
     * @param {Object} { taskId, activityId, ...updateData } - IDs and update data
     * @returns {Object} Updated activity
     */
    updateTaskActivity: builder.mutation({
      query: ({ taskId, activityId, ...updateData }) => ({
        url: `/tasks/${taskId}/activities/${activityId}`,
        method: "PUT",
        body: updateData,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "TaskActivity", id: arg.activityId },
        { type: "Task", id: arg.taskId },
        "Material",
      ],
    }),

    /**
     * Soft delete task activity
     * @param {Object} { taskId, activityId } - Task ID and Activity ID
     * @returns {Object} Success message
     */
    deleteTaskActivity: builder.mutation({
      query: ({ taskId, activityId }) => ({
        url: `/tasks/${taskId}/activities/${activityId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, arg) => [
        "TaskActivity",
        { type: "Task", id: arg.taskId },
      ],
    }),

    /**
     * Restore soft-deleted task activity
     * @param {Object} { taskId, activityId } - Task ID and Activity ID
     * @returns {Object} Restored activity
     */
    restoreTaskActivity: builder.mutation({
      query: ({ taskId, activityId }) => ({
        url: `/tasks/${taskId}/activities/${activityId}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, arg) => [
        "TaskActivity",
        { type: "Task", id: arg.taskId },
      ],
    }),

    // ============================================
    // TASK COMMENT ENDPOINTS
    // ============================================

    /**
     * Get list of comments for a task
     * @param {Object} { taskId, ...params } - Task ID and query parameters
     * @returns {Object} { comments: [], pagination: {} }
     */
    getTaskComments: builder.query({
      query: ({ taskId, ...params }) => ({
        url: `/tasks/${taskId}/comments`,
        params,
      }),
      transformResponse: (response) => ({
        comments: response.data,
        pagination: response.pagination,
      }),
      providesTags: (result) =>
        result?.comments
          ? [
              "TaskComment",
              ...result.comments.map((comment) => ({
                type: "TaskComment",
                id: comment._id,
              })),
            ]
          : ["TaskComment"],
    }),

    /**
     * Get single comment by ID
     * @param {Object} { taskId, commentId } - Task ID and Comment ID
     * @returns {Object} Comment object with populated relationships
     */
    getTaskCommentById: builder.query({
      query: ({ taskId, commentId }) =>
        `/tasks/${taskId}/comments/${commentId}`,
      providesTags: (result, error, { commentId }) => [
        { type: "TaskComment", id: commentId },
      ],
    }),

    /**
     * Create new task comment
     * @param {Object} { taskId, ...commentData } - Task ID and comment data
     * @returns {Object} Created comment
     */
    createTaskComment: builder.mutation({
      query: ({ taskId, ...commentData }) => ({
        url: `/tasks/${taskId}/comments`,
        method: "POST",
        body: commentData,
      }),
      invalidatesTags: (result, error, arg) => [
        "TaskComment",
        { type: "Task", id: arg.taskId },
        "User",
        "Notification",
      ],
    }),

    /**
     * Update existing task comment
     * @param {Object} { taskId, commentId, ...updateData } - IDs and update data
     * @returns {Object} Updated comment
     */
    updateTaskComment: builder.mutation({
      query: ({ taskId, commentId, ...updateData }) => ({
        url: `/tasks/${taskId}/comments/${commentId}`,
        method: "PUT",
        body: updateData,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "TaskComment", id: arg.commentId },
        { type: "Task", id: arg.taskId },
        "User",
        "Notification",
      ],
    }),

    /**
     * Soft delete task comment
     * @param {Object} { taskId, commentId } - Task ID and Comment ID
     * @returns {Object} Success message
     */
    deleteTaskComment: builder.mutation({
      query: ({ taskId, commentId }) => ({
        url: `/tasks/${taskId}/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, arg) => [
        "TaskComment",
        { type: "Task", id: arg.taskId },
      ],
    }),

    /**
     * Restore soft-deleted task comment
     * @param {Object} { taskId, commentId } - Task ID and Comment ID
     * @returns {Object} Restored comment
     */
    restoreTaskComment: builder.mutation({
      query: ({ taskId, commentId }) => ({
        url: `/tasks/${taskId}/comments/${commentId}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, arg) => [
        "TaskComment",
        { type: "Task", id: arg.taskId },
      ],
    }),
  }),
});

// Export hooks for usage in components
export const {
  // Task hooks
  useGetTasksQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useRestoreTaskMutation,

  // Task Activity hooks
  useGetTaskActivitiesQuery,
  useGetTaskActivityByIdQuery,
  useCreateTaskActivityMutation,
  useUpdateTaskActivityMutation,
  useDeleteTaskActivityMutation,
  useRestoreTaskActivityMutation,

  // Task Comment hooks
  useGetTaskCommentsQuery,
  useGetTaskCommentByIdQuery,
  useCreateTaskCommentMutation,
  useUpdateTaskCommentMutation,
  useDeleteTaskCommentMutation,
  useRestoreTaskCommentMutation,
} = taskApi;
