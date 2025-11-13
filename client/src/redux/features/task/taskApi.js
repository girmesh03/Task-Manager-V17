// client/src/redux/features/task/taskApi.js
import { apiSlice } from "../api";
import { API_ENDPOINTS } from "../../../utils/constants";

/**
 * Task API Slice
 *
 * RTK Query API slice for task-related endpoints.
 * Provides hooks for CRUD operations on tasks, activities, and comments.
 *
 * Backend Reference:
 * - Controller: backend/controllers/taskControllers.js
 * - Validators: backend/middlewares/validators/taskValidators.js
 *
 * Endpoints:
 * - getTasks: List tasks with pagination and filters
 * - getTaskById: Get single task details
 * - createTask: Create new task
 * - updateTask: Update task details
 * - deleteTask: Soft delete task
 * - restoreTask: Restore soft-deleted task
 * - getTaskActivities: List task activities
 * - getTaskActivityById: Get single activity details
 * - createTaskActivity: Create new activity
 * - updateTaskActivity: Update activity details
 * - deleteTaskActivity: Soft delete activity
 * - restoreTaskActivity: Restore soft-deleted activity
 * - getTaskComments: List task comments
 * - getTaskCommentById: Get single comment details
 * - createTaskComment: Create new comment
 * - updateTaskComment: Update comment details
 * - deleteTaskComment: Soft delete comment
 * - restoreTaskComment: Restore soft-deleted comment
 */
export const taskApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get list of tasks with pagination and filtering
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (default: 1)
     * @param {number} params.limit - Items per page (default: 10)
     * @param {string} params.taskType - Filter by task type
     * @param {string} params.status - Filter by status
     * @param {string} params.priority - Filter by priority
     * @param {string} params.departmentId - Filter by department
     * @param {string} params.assigneeId - Filter by assignee
     * @param {string} params.vendorId - Filter by vendor
     * @param {string} params.dueDateFrom - Filter by due date from
     * @param {string} params.dueDateTo - Filter by due date to
     * @param {string} params.dateFrom - Filter by date from (routine tasks)
     * @param {string} params.dateTo - Filter by date to (routine tasks)
     * @param {string} params.search - Search term for title, description, tags
     * @param {string} params.sortBy - Sort field (default: createdAt)
     * @param {string} params.sortOrder - Sort order: asc/desc (default: desc)
     * @param {boolean} params.deleted - Include deleted tasks
     * @param {string} params.createdBy - Filter by creator
     * @param {string} params.watcherId - Filter by watcher
     * @param {Array} params.tags - Filter by tags
     * @returns {Object} { tasks: [], pagination: {} }
     */
    getTasks: builder.query({
      query: (params) => ({
        url: API_ENDPOINTS.TASKS,
        params,
      }),
      transformResponse: (response) => ({
        tasks: response.tasks,
        pagination: response.pagination,
      }),
      providesTags: (result) =>
        result?.tasks
          ? [
              ...result.tasks.map(({ _id }) => ({ type: "Task", id: _id })),
              { type: "Task", id: "LIST" },
            ]
          : [{ type: "Task", id: "LIST" }],
    }),

    /**
     * Get single task by ID with complete details including all activities, comments, attachments, assignees, vendor information, materials, and cost history
     * @param {string|Object} params - Task ID string or object with taskId and deleted flag
     * @returns {Object} Comprehensive task document with activities and comments collections
     * Backend response: { success, message, task: { task, activities, comments } }
     */
    getTaskById: builder.query({
      query: (params) => {
        const taskId = typeof params === "string" ? params : params.taskId;
        const deleted = typeof params === "object" ? params.deleted : false;
        return {
          url: `${API_ENDPOINTS.TASKS}/${taskId}`,
          params: { deleted },
        };
      },
      transformResponse: (response) => response,
      providesTags: (_result, _error, params) => {
        const taskId = typeof params === "string" ? params : params.taskId;
        return [{ type: "Task", id: taskId }];
      },
    }),

    /**
     * Create new task of any type (RoutineTask, AssignedTask, ProjectTask) based on taskType field
     * @param {Object} taskData - Task data
     * @param {string} taskData.taskType - Task type (RoutineTask, AssignedTask, ProjectTask)
     * @param {string} taskData.title - Task title
     * @param {string} taskData.description - Task description
     * @param {string} taskData.status - Task status (optional)
     * @param {string} taskData.priority - Task priority (optional)
     * @param {Array} taskData.watcherIds - Watcher user IDs (optional)
     * @param {Array} taskData.tags - Task tags (optional)
     * @param {Array} taskData.attachments - Task attachments (optional)
     * @param {Date} taskData.startDate - Start date (AssignedTask, ProjectTask)
     * @param {Date} taskData.dueDate - Due date (AssignedTask, ProjectTask)
     * @param {Array} taskData.assigneeIds - Assignee user IDs (AssignedTask)
     * @param {string} taskData.vendorId - Vendor ID (ProjectTask)
     * @param {number} taskData.estimatedCost - Estimated cost (ProjectTask)
     * @param {number} taskData.actualCost - Actual cost (ProjectTask)
     * @param {string} taskData.currency - Currency (ProjectTask)
     * @param {Date} taskData.date - Task date (RoutineTask)
     * @param {Array} taskData.materials - Materials array (RoutineTask)
     * @returns {Object} Created task with all relationships populated
     */
    createTask: builder.mutation({
      query: (taskData) => ({
        url: API_ENDPOINTS.TASKS,
        method: "POST",
        body: taskData,
      }),
      transformResponse: (response) => response.task,
      invalidatesTags: [{ type: "Task", id: "LIST" }],
    }),

    /**
     * Update existing task
     * @param {Object} { taskId, ...updateData } - Task ID and update data
     * @returns {Object} Updated task
     */
    updateTask: builder.mutation({
      query: ({ taskId, ...updateData }) => ({
        url: `${API_ENDPOINTS.TASKS}/${taskId}`,
        method: "PUT",
        body: updateData,
      }),
      transformResponse: (response) => response.task,
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "Task", id: taskId },
        { type: "Task", id: "LIST" },
      ],
    }),

    /**
     * Soft delete task
     * @param {string} taskId - Task ID
     * @returns {Object} Success message
     */
    deleteTask: builder.mutation({
      query: (taskId) => ({
        url: `${API_ENDPOINTS.TASKS}/${taskId}`,
        method: "DELETE",
      }),
      transformResponse: (response) => response.task,
      invalidatesTags: (_result, _error, taskId) => [
        { type: "Task", id: taskId },
        { type: "Task", id: "LIST" },
        { type: "TaskActivity", id: "LIST" },
        { type: "TaskComment", id: "LIST" },
        { type: "Attachment", id: "LIST" },
        { type: "Notification", id: "LIST" },
      ],
    }),

    /**
     * Restore soft-deleted task
     * @param {string} taskId - Task ID
     * @returns {Object} Restored task
     */
    restoreTask: builder.mutation({
      query: (taskId) => ({
        url: `${API_ENDPOINTS.TASKS}/${taskId}/restore`,
        method: "POST",
      }),
      transformResponse: (response) => response.task,
      invalidatesTags: (_result, _error, taskId) => [
        { type: "Task", id: taskId },
        { type: "Task", id: "LIST" },
      ],
    }),

    /**
     * Get list of activities for a task
     * @param {Object} { taskId, ...params } - Task ID and query parameters
     * @returns {Object} { activities: [], pagination: {} }
     */
    getTaskActivities: builder.query({
      query: ({ taskId, ...params }) => ({
        url: `${API_ENDPOINTS.TASKS}/${taskId}/activities`,
        params,
      }),
      transformResponse: (response) => ({
        activities: response.activities,
        pagination: response.pagination,
      }),
      providesTags: (result) =>
        result?.activities
          ? [
              ...result.activities.map(({ _id }) => ({
                type: "TaskActivity",
                id: _id,
              })),
              { type: "TaskActivity", id: "LIST" },
            ]
          : [{ type: "TaskActivity", id: "LIST" }],
    }),

    /**
     * Get single activity by ID
     * @param {Object} { taskId, activityId } - Task ID and Activity ID
     * @returns {Object} Activity object with populated relationships
     */
    getTaskActivityById: builder.query({
      query: ({ taskId, activityId }) =>
        `${API_ENDPOINTS.TASKS}/${taskId}/activities/${activityId}`,
      transformResponse: (response) => response.activity,
      providesTags: (_result, _error, { activityId }) => [
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
        url: `${API_ENDPOINTS.TASKS}/${taskId}/activities`,
        method: "POST",
        body: activityData,
      }),
      transformResponse: (response) => response.activity,
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "TaskActivity", id: "LIST" },
        { type: "Task", id: taskId },
        { type: "Material", id: "LIST" },
      ],
    }),

    /**
     * Update existing task activity
     * @param {Object} { taskId, activityId, ...updateData } - IDs and update data
     * @returns {Object} Updated activity
     */
    updateTaskActivity: builder.mutation({
      query: ({ taskId, activityId, ...updateData }) => ({
        url: `${API_ENDPOINTS.TASKS}/${taskId}/activities/${activityId}`,
        method: "PUT",
        body: updateData,
      }),
      transformResponse: (response) => response.activity,
      invalidatesTags: (_result, _error, { taskId, activityId }) => [
        { type: "TaskActivity", id: activityId },
        { type: "TaskActivity", id: "LIST" },
        { type: "Task", id: taskId },
        { type: "Material", id: "LIST" },
      ],
    }),

    /**
     * Soft delete task activity
     * @param {Object} { taskId, activityId } - Task ID and Activity ID
     * @returns {Object} Success message
     */
    deleteTaskActivity: builder.mutation({
      query: ({ taskId, activityId }) => ({
        url: `${API_ENDPOINTS.TASKS}/${taskId}/activities/${activityId}`,
        method: "DELETE",
      }),
      transformResponse: (response) => response.activity,
      invalidatesTags: (_result, _error, { taskId, activityId }) => [
        { type: "TaskActivity", id: activityId },
        { type: "TaskActivity", id: "LIST" },
        { type: "Task", id: taskId },
      ],
    }),

    /**
     * Restore soft-deleted task activity
     * @param {Object} { taskId, activityId } - Task ID and Activity ID
     * @returns {Object} Restored activity
     */
    restoreTaskActivity: builder.mutation({
      query: ({ taskId, activityId }) => ({
        url: `${API_ENDPOINTS.TASKS}/${taskId}/activities/${activityId}/restore`,
        method: "POST",
      }),
      transformResponse: (response) => response.activity,
      invalidatesTags: (_result, _error, { taskId, activityId }) => [
        { type: "TaskActivity", id: activityId },
        { type: "TaskActivity", id: "LIST" },
        { type: "Task", id: taskId },
      ],
    }),

    /**
     * Get list of comments for a task
     * @param {Object} { taskId, ...params } - Task ID and query parameters
     * @returns {Object} { comments: [], pagination: {} }
     */
    getTaskComments: builder.query({
      query: ({ taskId, ...params }) => ({
        url: `${API_ENDPOINTS.TASKS}/${taskId}/comments`,
        params,
      }),
      transformResponse: (response) => ({
        comments: response.comments,
        pagination: response.pagination,
      }),
      providesTags: (result) =>
        result?.comments
          ? [
              ...result.comments.map(({ _id }) => ({
                type: "TaskComment",
                id: _id,
              })),
              { type: "TaskComment", id: "LIST" },
            ]
          : [{ type: "TaskComment", id: "LIST" }],
    }),

    /**
     * Get single comment by ID
     * @param {Object} { taskId, commentId } - Task ID and Comment ID
     * @returns {Object} Comment object with populated relationships
     */
    getTaskCommentById: builder.query({
      query: ({ taskId, commentId }) =>
        `${API_ENDPOINTS.TASKS}/${taskId}/comments/${commentId}`,
      transformResponse: (response) => response.comment,
      providesTags: (_result, _error, { commentId }) => [
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
        url: `${API_ENDPOINTS.TASKS}/${taskId}/comments`,
        method: "POST",
        body: commentData,
      }),
      transformResponse: (response) => response.comment,
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "TaskComment", id: "LIST" },
        { type: "Task", id: taskId },
        { type: "User", id: "LIST" },
        { type: "Notification", id: "LIST" },
      ],
    }),

    /**
     * Update existing task comment
     * @param {Object} { taskId, commentId, ...updateData } - IDs and update data
     * @returns {Object} Updated comment
     */
    updateTaskComment: builder.mutation({
      query: ({ taskId, commentId, ...updateData }) => ({
        url: `${API_ENDPOINTS.TASKS}/${taskId}/comments/${commentId}`,
        method: "PUT",
        body: updateData,
      }),
      transformResponse: (response) => response.comment,
      invalidatesTags: (_result, _error, { taskId, commentId }) => [
        { type: "TaskComment", id: commentId },
        { type: "TaskComment", id: "LIST" },
        { type: "Task", id: taskId },
        { type: "User", id: "LIST" },
        { type: "Notification", id: "LIST" },
      ],
    }),

    /**
     * Soft delete task comment
     * @param {Object} { taskId, commentId } - Task ID and Comment ID
     * @returns {Object} Success message
     */
    deleteTaskComment: builder.mutation({
      query: ({ taskId, commentId }) => ({
        url: `${API_ENDPOINTS.TASKS}/${taskId}/comments/${commentId}`,
        method: "DELETE",
      }),
      transformResponse: (response) => response.comment,
      invalidatesTags: (_result, _error, { taskId, commentId }) => [
        { type: "TaskComment", id: commentId },
        { type: "TaskComment", id: "LIST" },
        { type: "Task", id: taskId },
      ],
    }),

    /**
     * Restore soft-deleted task comment
     * @param {Object} { taskId, commentId } - Task ID and Comment ID
     * @returns {Object} Restored comment
     */
    restoreTaskComment: builder.mutation({
      query: ({ taskId, commentId }) => ({
        url: `${API_ENDPOINTS.TASKS}/${taskId}/comments/${commentId}/restore`,
        method: "POST",
      }),
      transformResponse: (response) => response.comment,
      invalidatesTags: (_result, _error, { taskId, commentId }) => [
        { type: "TaskComment", id: commentId },
        { type: "TaskComment", id: "LIST" },
        { type: "Task", id: taskId },
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
