// client/src/redux/features/vendor/vendorApi.js
import { apiSlice } from "../api";
import { API_ENDPOINTS } from "../../../utils/constants";

/**
 * Vendor API Slice
 *
 * RTK Query API slice for vendor-related endpoints.
 * Provides hooks for CRUD operations on vendors.
 *
 * Backend Reference:
 * - Controller: backend/controllers/vendorControllers.js
 * - Validators: backend/middlewares/validators/vendorValidators.js
 *
 * Endpoints:
 * - getVendors: List vendors with pagination and filters
 * - getVendorById: Get single vendor details
 * - createVendor: Create new vendor
 * - updateVendor: Update vendor details
 * - deleteVendor: Soft delete vendor (requires reassignment)
 * - restoreVendor: Restore soft-deleted vendor
 */

export const vendorApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get all vendors with pagination and filters
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (default: 1)
     * @param {number} params.limit - Items per page (default: 10)
     * @param {string} params.search - Search term for name, email, phone
     * @param {boolean} params.deleted - Include deleted vendors
     * @param {string} params.sortBy - Sort field (default: createdAt)
     * @param {string} params.sortOrder - Sort order: asc/desc (default: desc)
     * @returns {Object} Paginated vendors list
     */
    getVendors: builder.query({
      query: (params) => ({
        url: API_ENDPOINTS.VENDORS,
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: "Vendor", id: _id })),
              { type: "Vendor", id: "LIST" },
            ]
          : [{ type: "Vendor", id: "LIST" }],
    }),

    /**
     * Get single vendor by ID
     * @param {string} vendorId - Vendor ID
     * @returns {Object} Vendor details with project statistics
     */
    getVendorById: builder.query({
      query: (vendorId) => `${API_ENDPOINTS.VENDORS}/${vendorId}`,
      providesTags: (result, error, id) => [{ type: "Vendor", id }],
    }),

    /**
     * Create new vendor
     * @param {Object} data - Vendor data
     * @param {string} data.name - Vendor name
     * @param {string} data.email - Vendor email
     * @param {string} data.phone - Vendor phone
     * @param {string} data.description - Vendor description
     * @returns {Object} Created vendor
     */
    createVendor: builder.mutation({
      query: (data) => ({
        url: API_ENDPOINTS.VENDORS,
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Vendor", id: "LIST" }],
    }),

    /**
     * Update vendor
     * @param {Object} params - Update parameters
     * @param {string} params.vendorId - Vendor ID
     * @param {Object} params.data - Updated vendor data
     * @returns {Object} Updated vendor
     */
    updateVendor: builder.mutation({
      query: ({ vendorId, ...data }) => ({
        url: `${API_ENDPOINTS.VENDORS}/${vendorId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { vendorId }) => [
        { type: "Vendor", id: vendorId },
        { type: "Vendor", id: "LIST" },
      ],
    }),

    /**
     * Soft delete vendor (requires reassignment if used in active projects)
     * @param {Object} params - Delete parameters
     * @param {string} params.vendorId - Vendor ID
     * @param {string} params.reassignToVendorId - New vendor ID for reassignment (required if vendor has active projects)
     * @returns {Object} Deletion confirmation
     */
    deleteVendor: builder.mutation({
      query: ({ vendorId, reassignToVendorId }) => ({
        url: `${API_ENDPOINTS.VENDORS}/${vendorId}`,
        method: "DELETE",
        body: reassignToVendorId ? { reassignToVendorId } : undefined,
      }),
      invalidatesTags: (result, error, { vendorId }) => [
        { type: "Vendor", id: vendorId },
        { type: "Vendor", id: "LIST" },
        { type: "Task", id: "LIST" },
      ],
    }),

    /**
     * Restore soft-deleted vendor
     * @param {string} vendorId - Vendor ID
     * @returns {Object} Restored vendor
     */
    restoreVendor: builder.mutation({
      query: (vendorId) => ({
        url: `${API_ENDPOINTS.VENDORS}/${vendorId}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, vendorId) => [
        { type: "Vendor", id: vendorId },
        { type: "Vendor", id: "LIST" },
      ],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetVendorsQuery,
  useGetVendorByIdQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
  useRestoreVendorMutation,
} = vendorApi;
