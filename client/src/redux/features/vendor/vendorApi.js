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
      transformResponse: (response) => ({
        vendors: response.vendors,
        pagination: response.pagination,
      }),
      providesTags: (result) =>
        result?.vendors
          ? [
              ...result.vendors.map(({ _id }) => ({ type: "Vendor", id: _id })),
              { type: "Vendor", id: "LIST" },
            ]
          : [{ type: "Vendor", id: "LIST" }],
    }),

    /**
     * Get single vendor by ID with project tasks, cost statistics, performance metrics, and contact info
     * @param {string} vendorId - Vendor ID
     * @returns {Object} Vendor details with tasks and statistics
     */
    getVendorById: builder.query({
      query: (vendorId) => `${API_ENDPOINTS.VENDORS}/${vendorId}`,
      transformResponse: (response) => response.vendor,
      providesTags: (result, error, id) => [{ type: "Vendor", id }],
    }),

    /**
     * Create new vendor for the organization
     * @param {Object} data - Vendor data
     * @param {string} data.name - Vendor name
     * @param {string} data.email - Vendor email (optional)
     * @param {string} data.phone - Vendor phone
     * @returns {Object} Created vendor
     */
    createVendor: builder.mutation({
      query: (data) => ({
        url: API_ENDPOINTS.VENDORS,
        method: "POST",
        body: data,
      }),
      transformResponse: (response) => response.vendor,
      invalidatesTags: [{ type: "Vendor", id: "LIST" }],
    }),

    /**
     * Update vendor details
     * @param {Object} params - Update parameters
     * @param {string} params.vendorId - Vendor ID
     * @param {string} params.name - Updated vendor name (optional)
     * @param {string} params.email - Updated vendor email (optional)
     * @param {string} params.phone - Updated vendor phone (optional)
     * @returns {Object} Updated vendor
     */
    updateVendor: builder.mutation({
      query: ({ vendorId, ...data }) => ({
        url: `${API_ENDPOINTS.VENDORS}/${vendorId}`,
        method: "PUT",
        body: data,
      }),
      transformResponse: (response) => response.vendor,
      invalidatesTags: (result, error, { vendorId }) => [
        { type: "Vendor", id: vendorId },
        { type: "Vendor", id: "LIST" },
      ],
    }),

    /**
     * Soft delete vendor with reassignment option for active project tasks
     * @param {Object} params - Delete parameters
     * @param {string} params.vendorId - Vendor ID
     * @param {string} params.reassignToVendorId - New vendor ID for reassignment (optional)
     * @returns {Object} Deletion confirmation with reassignment details
     */
    deleteVendor: builder.mutation({
      query: ({ vendorId, reassignToVendorId }) => ({
        url: `${API_ENDPOINTS.VENDORS}/${vendorId}`,
        method: "DELETE",
        body: reassignToVendorId ? { reassignToVendorId } : {},
      }),
      transformResponse: (response) => response.vendor,
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
        method: "POST",
      }),
      transformResponse: (response) => response.vendor,
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
