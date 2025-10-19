// client/src/redux/features/tasks/tasksApi.js
import { apiSlice } from "../api";

export const tasksApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTasks: builder.query({
      query: ({
        page = 1,
        limit = 10,
        status,
        priority,
        taskType,
        search,
      } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (status) params.append("status", status);
        if (priority) params.append("priority", priority);
        if (taskType) params.append("taskType", taskType);
        if (search) params.append("search", search);

        return `/tasks?${params.toString()}`;
      },
      transformResponse: (response) => {
        return {
          docs: response.data || [],
          page: response.pagination?.page || 1,
          limit: response.pagination?.limit || 10,
          totalPages: response.pagination?.totalPages || 0,
          totalDocs: response.pagination?.totalCount || 0,
          hasNextPage: response.pagination?.hasNext || false,
          hasPrevPage: response.pagination?.hasPrev || false,
        };
      },
      providesTags: (result) =>
        result?.docs
          ? [
              ...result.docs.map(({ _id }) => ({ type: "Task", id: _id })),
              { type: "Task", id: "LIST" },
            ]
          : [{ type: "Task", id: "LIST" }],
    }),

    getTaskById: builder.query({
      query: (id) => `/tasks/${id}`,
      transformResponse: (response) => {
        return response.data || null;
      },
      providesTags: (_result, _error, id) => [{ type: "Task", id }],
    }),

    createTask: builder.mutation({
      query: (taskData) => ({
        url: "/tasks",
        method: "POST",
        body: taskData,
      }),
      transformResponse: (response) => {
        return response.data || null;
      },
      invalidatesTags: [{ type: "Task", id: "LIST" }],
    }),

    updateTask: builder.mutation({
      query: ({ id, ...taskData }) => ({
        url: `/tasks/${id}`,
        method: "PUT",
        body: taskData,
      }),
      transformResponse: (response) => {
        return response.data || null;
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Task", id },
        { type: "Task", id: "LIST" },
      ],
    }),

    deleteTask: builder.mutation({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response) => {
        return response.data || null;
      },
      invalidatesTags: [{ type: "Task", id: "LIST" }],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = tasksApi;
