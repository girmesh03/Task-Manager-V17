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
      transformResponse: (response) => ({
        organizations: response.organizations,
        pagination: response.pagination,
      }),
      providesTags: (result) =>
        result?.organizations
          ? [
              ...result.organizations.map(({ _id }) => ({
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
      transformResponse: (response) => response.organization,
      providesTags: (result, error, id) => [{ type: "Organization", id }],
    }),

    /**
     * Create new organization
     * @param {Object} data - Organization data
     * @param {string} data.name - Organization name
     * @param {string} data.description - Organization description
     * @param {string} data.email - Organization email
     * @param {string} data.phone - Organization phone
     * @param {string} data.address - Organization address
     * @param {string} data.industry - Organization industry
     * @param {Object} data.logoUrl - Organization logo URL object with url and publicId
     * @returns {Object} Created organization
     */
    createOrganization: builder.mutation({
      query: (data) => ({
        url: API_ENDPOINTS.ORGANIZATIONS,
        method: "POST",
        body: data,
      }),
      transformResponse: (response) => response.organization,
      invalidatesTags: [{ type: "Organization", id: "LIST" }],
    }),

    /**
     * Update organization
     * @param {Object} params - Update parameters
     * @param {string} params.organizationId - Organization ID
     * @param {string} params.name - Updated organization name (optional)
     * @param {string} params.description - Updated organization description (optional)
     * @param {string} params.email - Updated organization email (optional)
     * @param {string} params.phone - Updated organization phone (optional)
     * @param {string} params.address - Updated organization address (optional)
     * @param {string} params.industry - Updated organization industry (optional)
     * @param {Object} params.logoUrl - Updated organization logo URL object (optional)
     * @returns {Object} Updated organization
     */
    updateOrganization: builder.mutation({
      query: ({ organizationId, ...data }) => ({
        url: `${API_ENDPOINTS.ORGANIZATIONS}/${organizationId}`,
        method: "PUT",
        body: data,
      }),
      transformResponse: (response) => response.organization,
      invalidatesTags: (result, error, { organizationId }) => [
        { type: "Organization", id: organizationId },
        { type: "Organization", id: "LIST" },
      ],
    }),

    /**
     * Soft delete organization with full cascade deletion
     * @param {string} organizationId - Organization ID
     * @returns {Object} Deletion confirmation
     */
    deleteOrganization: builder.mutation({
      query: (organizationId) => ({
        url: `${API_ENDPOINTS.ORGANIZATIONS}/${organizationId}`,
        method: "DELETE",
      }),
      transformResponse: (response) => response.organization,
      invalidatesTags: (result, error, organizationId) => [
        { type: "Organization", id: organizationId },
        { type: "Organization", id: "LIST" },
        { type: "Department", id: "LIST" },
        { type: "User", id: "LIST" },
        { type: "Task", id: "LIST" },
        { type: "Material", id: "LIST" },
        { type: "Vendor", id: "LIST" },
        { type: "Notification", id: "LIST" },
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
        method: "POST",
      }),
      transformResponse: (response) => response.organization,
      invalidatesTags: (result, error, organizationId) => [
        { type: "Organization", id: organizationId },
        { type: "Organization", id: "LIST" },
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
} = organizationApi;
