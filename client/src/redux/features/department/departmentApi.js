// client/src/redux/features/department/departmentApi.js
import { apiSlice } from "../api";
import { API_ENDPOINTS } from "../../../utils/constants";

/**
 * Department API Slice
 *
 * RTK Query API slice for department-related endpoints.
 * Provides hooks for CRUD operations on departments.
 *
 * Backend Reference:
 * - Controller: backend/controllers/departmentControllers.js
 * - Validators: backend/middlewares/validators/departmentValidators.js
 *
 * Endpoints:
 * - getDepartments: List departments with pagination and filters
 * - getDepartmentById: Get single department details
 * - createDepartment: Create new department
 * - updateDepartment: Update department details
 * - deleteDepartment: Soft delete department
 * - restoreDepartment: Restore soft-deleted department
 * - getDepartmentStatistics: Get department statistics
 */

export const departmentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get all departments with pagination and filters
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (default: 1)
     * @param {number} params.limit - Items per page (default: 10)
     * @param {string} params.search - Search term for name, description
     * @param {boolean} params.deleted - Include deleted departments
     * @param {string} params.sortBy - Sort field (default: createdAt)
     * @param {string} params.sortOrder - Sort order: asc/desc (default: desc)
     * @returns {Object} Paginated departments list
     */
    getDepartments: builder.query({
      query: (params) => ({
        url: API_ENDPOINTS.DEPARTMENTS,
        params,
      }),
      transformResponse: (response) => ({
        departments: response.departments,
        pagination: response.pagination,
      }),
      providesTags: (result) =>
        result?.departments
          ? [
              ...result.departments.map(({ _id }) => ({
                type: "Department",
                id: _id,
              })),
              { type: "Department", id: "LIST" },
            ]
          : [{ type: "Department", id: "LIST" }],
    }),

    /**
     * Get single department by ID
     * @param {string} departmentId - Department ID
     * @returns {Object} Department details with users, stats, recent activities, and HOD info
     */
    getDepartmentById: builder.query({
      query: (departmentId) => `${API_ENDPOINTS.DEPARTMENTS}/${departmentId}`,
      transformResponse: (response) => response.department,
      providesTags: (result, error, id) => [{ type: "Department", id }],
    }),

    /**
     * Create new department
     * @param {Object} data - Department data
     * @param {string} data.name - Department name
     * @param {string} data.description - Department description
     * @returns {Object} Created department
     */
    createDepartment: builder.mutation({
      query: (data) => ({
        url: API_ENDPOINTS.DEPARTMENTS,
        method: "POST",
        body: data,
      }),
      transformResponse: (response) => response.department,
      invalidatesTags: [{ type: "Department", id: "LIST" }],
    }),

    /**
     * Update department
     * @param {Object} params - Update parameters
     * @param {string} params.departmentId - Department ID
     * @param {string} params.name - Updated department name (optional)
     * @param {string} params.description - Updated department description (optional)
     * @returns {Object} Updated department
     */
    updateDepartment: builder.mutation({
      query: ({ departmentId, ...data }) => ({
        url: `${API_ENDPOINTS.DEPARTMENTS}/${departmentId}`,
        method: "PUT",
        body: data,
      }),
      transformResponse: (response) => response.department,
      invalidatesTags: (result, error, { departmentId }) => [
        { type: "Department", id: departmentId },
        { type: "Department", id: "LIST" },
      ],
    }),

    /**
     * Soft delete department with full cascade deletion
     * @param {string} departmentId - Department ID
     * @returns {Object} Deletion confirmation
     */
    deleteDepartment: builder.mutation({
      query: (departmentId) => ({
        url: `${API_ENDPOINTS.DEPARTMENTS}/${departmentId}`,
        method: "DELETE",
      }),
      transformResponse: (response) => response.department,
      invalidatesTags: (result, error, departmentId) => [
        { type: "Department", id: departmentId },
        { type: "Department", id: "LIST" },
        { type: "User", id: "LIST" },
        { type: "Task", id: "LIST" },
        { type: "Material", id: "LIST" },
        { type: "Notification", id: "LIST" },
      ],
    }),

    /**
     * Restore soft-deleted department
     * @param {string} departmentId - Department ID
     * @returns {Object} Restored department
     */
    restoreDepartment: builder.mutation({
      query: (departmentId) => ({
        url: `${API_ENDPOINTS.DEPARTMENTS}/${departmentId}/restore`,
        method: "POST",
      }),
      transformResponse: (response) => response.department,
      invalidatesTags: (result, error, departmentId) => [
        { type: "Department", id: departmentId },
        { type: "Department", id: "LIST" },
      ],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useRestoreDepartmentMutation,
} = departmentApi;
