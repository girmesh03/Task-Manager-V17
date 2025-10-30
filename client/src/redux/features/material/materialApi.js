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
     * @param {boolean} params.deleted - Include deleted materials
     * @param {string} params.category - Filter by category
     * @param {string} params.sortBy - Sort field (default: createdAt)
     * @param {string} params.sortOrder - Sort order: asc/desc (default: desc)
     * @returns {Object} Paginated materials list
     */
    getMaterials: builder.query({
      query: (params) => ({
        url: API_ENDPOINTS.MATERIALS,
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: "Material", id: _id })),
              { type: "Material", id: "LIST" },
            ]
          : [{ type: "Material", id: "LIST" }],
    }),

    /**
     * Get single material by ID
     * @param {string} materialId - Material ID
     * @returns {Object} Material details with usage statistics
     */
    getMaterialById: builder.query({
      query: (materialId) => `${API_ENDPOINTS.MATERIALS}/${materialId}`,
      providesTags: (result, error, id) => [{ type: "Material", id }],
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
      invalidatesTags: [{ type: "Material", id: "LIST" }],
    }),

    /**
     * Update material
     * @param {Object} params - Update parameters
     * @param {string} params.materialId - Material ID
     * @param {Object} params.data - Updated material data
     * @returns {Object} Updated material
     */
    updateMaterial: builder.mutation({
      query: ({ materialId, ...data }) => ({
        url: `${API_ENDPOINTS.MATERIALS}/${materialId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { materialId }) => [
        { type: "Material", id: materialId },
        { type: "Material", id: "LIST" },
      ],
    }),

    /**
     * Soft delete material with unlinking from tasks
     * @param {string} materialId - Material ID
     * @returns {Object} Deletion confirmation
     */
    deleteMaterial: builder.mutation({
      query: (materialId) => ({
        url: `${API_ENDPOINTS.MATERIALS}/${materialId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, materialId) => [
        { type: "Material", id: materialId },
        { type: "Material", id: "LIST" },
        { type: "Task", id: "LIST" },
        { type: "TaskActivity", id: "LIST" },
      ],
    }),

    /**
     * Restore soft-deleted material with relinking to tasks
     * @param {string} materialId - Material ID
     * @returns {Object} Restored material
     */
    restoreMaterial: builder.mutation({
      query: (materialId) => ({
        url: `${API_ENDPOINTS.MATERIALS}/${materialId}/restore`,
        method: "PATCH",
      }),
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
