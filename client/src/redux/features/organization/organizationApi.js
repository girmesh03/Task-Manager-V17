// client/src/redux/features/organization/organizationApi.js
import { apiSlice } from "../api";
import { API_ENDPOINTS } from "../../../utils/constants";

/**
 * Organization API Slice
 *
 * RTK Query API slice for organization-related endpoints.
 * Provides hooks for CRUD operations on organizations.
 *
 * Backend Reference:
 * - Controller: backend/controllers/organizationControllers.js
 * - Validators: backend/middlewares/validators/organizationValidators.js
 *
 * Endpoints:
 * - getOrganizations: List organizations with pagination and filters
 * - getOrganizationById: Get single organization details
 * - createOrganization: Create new organization
 * - updateOrganization: Update organization details
 * - deleteOrganization: Soft delete organization
 * - restoreOrganization: Restore soft-deleted organization
 * - getOrganizationDashboard: Get organization dashboard with stats
 */

export const organizationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get all organizations with pagination and filters
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (default: 1)
     * @param {number} params.limit - Items per page (default: 10)
     * @param {string} params.search - Search term for name, email, address
     * @param {boolean} params.deleted - Include deleted organizations
     * @param {string} params.industry - Filter by industry
     * @param {string} params.sortBy - Sort field (default: createdAt)
     * @param {string} params.sortOrder - Sort order: asc/desc (default: desc)
     * @returns {Object} Paginated organizations list
     */
    getOrganizations: builder.query({
      query: (params) => ({
        url: API_ENDPOINTS.ORGANIZATIONS,
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({
                type: "Organization",
                id: _id,
              })),
              { type: "Organization", id: "LIST" },
            ]
          : [{ type: "Organization", id: "LIST" }],
    }),

    /**
     * Get single organization by ID
     * @param {string} organizationId - Organization ID
     * @returns {Object} Organization details
     */
    getOrganizationById: builder.query({
      query: (organizationId) =>
        `${API_ENDPOINTS.ORGANIZATIONS}/${organizationId}`,
      providesTags: (result, error, id) => [{ type: "Organization", id }],
    }),

    /**
     * Create new organization
     * @param {Object} data - Organization data
     * @param {string} data.name - Organization name
     * @param {string} data.email - Organization email
     * @param {string} data.phone - Organization phone
     * @param {string} data.address - Organization address
     * @param {string} data.industry - Organization industry
     * @param {string} data.logoUrl - Organization logo URL
     * @returns {Object} Created organization
     */
    createOrganization: builder.mutation({
      query: (data) => ({
        url: API_ENDPOINTS.ORGANIZATIONS,
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Organization", id: "LIST" }],
    }),

    /**
     * Update organization
     * @param {Object} params - Update parameters
     * @param {string} params.organizationId - Organization ID
     * @param {Object} params.data - Updated organization data
     * @returns {Object} Updated organization
     */
    updateOrganization: builder.mutation({
      query: ({ organizationId, ...data }) => ({
        url: `${API_ENDPOINTS.ORGANIZATIONS}/${organizationId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { organizationId }) => [
        { type: "Organization", id: organizationId },
        { type: "Organization", id: "LIST" },
      ],
    }),

    /**
     * Soft delete organization
     * @param {string} organizationId - Organization ID
     * @returns {Object} Deletion confirmation
     */
    deleteOrganization: builder.mutation({
      query: (organizationId) => ({
        url: `${API_ENDPOINTS.ORGANIZATIONS}/${organizationId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, organizationId) => [
        { type: "Organization", id: organizationId },
        { type: "Organization", id: "LIST" },
        { type: "Department", id: "LIST" },
        { type: "User", id: "LIST" },
      ],
    }),

    /**
     * Restore soft-deleted organization
     * @param {string} organizationId - Organization ID
     * @returns {Object} Restored organization
     */
    restoreOrganization: builder.mutation({
      query: (organizationId) => ({
        url: `${API_ENDPOINTS.ORGANIZATIONS}/${organizationId}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, organizationId) => [
        { type: "Organization", id: organizationId },
        { type: "Organization", id: "LIST" },
      ],
    }),

    /**
     * Get organization dashboard with statistics
     * @param {string} organizationId - Organization ID
     * @returns {Object} Organization dashboard data with stats
     */
    getOrganizationDashboard: builder.query({
      query: (organizationId) =>
        `${API_ENDPOINTS.ORGANIZATIONS}/${organizationId}/dashboard`,
      providesTags: (result, error, id) => [
        { type: "Organization", id },
        { type: "Department", id: "LIST" },
        { type: "User", id: "LIST" },
        { type: "Task", id: "LIST" },
      ],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetOrganizationsQuery,
  useGetOrganizationByIdQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
  useRestoreOrganizationMutation,
  useGetOrganizationDashboardQuery,
} = organizationApi;
