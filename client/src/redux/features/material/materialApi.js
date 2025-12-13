// client/src/redux/features/material/materialApi.js
import { apiSlice } from "../api";
import { API_ENDPOINTS } from "../../../utils/constants";

/**
 * Material API Slice
 *
 * RTK Query API slice for material-related endpoints.
 * Provides hooks for CRUD operations on materials.
 *
 * Backend Reference:
 * - Controller: backend/controllers/materialControllers.js
 * - Validators: backend/middlewares/validators/materialValidators.js
 *
 * Endpoints:
 * - getMaterials: List materials with pagination and filters
 * - getMaterialById: Get single material details
 * - createMaterial: Create new material
 * - updateMaterial: Update material details
 * - deleteMaterial: Soft delete material (with unlinking)
 * - restoreMaterial: Restore soft-deleted material (with relinking)
 */

export const materialApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get all materials with pagination and filters
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (default: 1)
     * @param {number} params.limit - Items per page (default: 10)
     * @param {string} params.search - Search term for name
     * @param {string} params.category - Filter by category
     * @param {string} params.departmentId - Filter by department
     * @param {boolean} params.deleted - Include deleted materials
     * @param {number} params.priceMin - Minimum price filter
     * @param {number} params.priceMax - Maximum price filter
     * @param {string} params.sortBy - Sort field (default: createdAt)
     * @param {string} params.sortOrder - Sort order: asc/desc (default: desc)
     * @returns {Object} Paginated materials list
     */
    getMaterials: builder.query({
      query: (params) => ({
        url: API_ENDPOINTS.MATERIALS,
        params,
      }),
      transformResponse: (response) => ({
        materials: response.materials,
        pagination: response.pagination,
      }),
      providesTags: (result) =>
        result?.materials
          ? [
              ...result.materials.map(({ _id }) => ({
                type: "Material",
                id: _id,
              })),
              { type: "Material", id: "LIST" },
            ]
          : [{ type: "Material", id: "LIST" }],
    }),

    /**
     * Get single material by ID with optional usage details
     * @param {Object} params - Query parameters
     * @param {string} params.materialId - Material ID
     * @param {boolean} params.includeUsage - Include usage statistics
     * @param {boolean} params.includeTasks - Include recent tasks
     * @param {boolean} params.includeActivities - Include recent activities
     * @returns {Object} Material details with optional usage statistics
     */
    getMaterialById: builder.query({
      query: ({ materialId, ...params }) => ({
        url: `${API_ENDPOINTS.MATERIALS}/${materialId}`,
        params,
      }),
      transformResponse: (response) => response.material,
      providesTags: (result, error, { materialId }) => [
        { type: "Material", id: materialId },
      ],
    }),

    /**
     * Create new material
     * @param {Object} data - Material data
     * @param {string} data.name - Material name
     * @param {string} data.unit - Unit of measurement
     * @param {number} data.price - Price per unit
     * @param {string} data.category - Material category
     * @returns {Object} Created material
     */
    createMaterial: builder.mutation({
      query: (data) => ({
        url: API_ENDPOINTS.MATERIALS,
        method: "POST",
        body: data,
      }),
      transformResponse: (response) => response.material,
      invalidatesTags: [{ type: "Material", id: "LIST" }],
    }),

    /**
     * Update material
     * @param {Object} params - Update parameters
     * @param {string} params.materialId - Material ID
     * @param {string} params.name - Updated material name (optional)
     * @param {string} params.unit - Updated unit of measurement (optional)
     * @param {number} params.price - Updated price per unit (optional)
     * @param {string} params.category - Updated material category (optional)
     * @returns {Object} Updated material
     */
    updateMaterial: builder.mutation({
      query: ({ materialId, ...data }) => ({
        url: `${API_ENDPOINTS.MATERIALS}/${materialId}`,
        method: "PUT",
        body: data,
      }),
      transformResponse: (response) => response.material,
      invalidatesTags: (result, error, { materialId }) => [
        { type: "Material", id: materialId },
        { type: "Material", id: "LIST" },
      ],
    }),

    /**
     * Soft delete material with unlinking from all tasks and activities
     * @param {string} materialId - Material ID
     * @returns {Object} Deletion confirmation
     */
    deleteMaterial: builder.mutation({
      query: (materialId) => ({
        url: `${API_ENDPOINTS.MATERIALS}/${materialId}`,
        method: "DELETE",
      }),
      transformResponse: (response) => response.material,
      invalidatesTags: (result, error, materialId) => [
        { type: "Material", id: materialId },
        { type: "Material", id: "LIST" },
        { type: "Task", id: "LIST" },
        { type: "TaskActivity", id: "LIST" },
      ],
    }),

    /**
     * Restore soft-deleted material with relinking to all tasks and activities
     * @param {string} materialId - Material ID
     * @returns {Object} Restored material
     */
    restoreMaterial: builder.mutation({
      query: (materialId) => ({
        url: `${API_ENDPOINTS.MATERIALS}/${materialId}/restore`,
        method: "POST",
      }),
      transformResponse: (response) => response.material,
      invalidatesTags: (result, error, materialId) => [
        { type: "Material", id: materialId },
        { type: "Material", id: "LIST" },
        { type: "Task", id: "LIST" },
        { type: "TaskActivity", id: "LIST" },
      ],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetMaterialsQuery,
  useGetMaterialByIdQuery,
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
  useDeleteMaterialMutation,
  useRestoreMaterialMutation,
} = materialApi;
