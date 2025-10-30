///redux/features/attachment/attachmentApi.js
import { apiSlice } from "../api";
import { API_ENDPOINTS } from "../../../utils/constants";

/**
 * Attachment API Slice
 *
 * RTK Query API slice for attachment-related endpoints.
 * Provides hooks for CRUD operations on attachments.
 *
 * Backend Reference:
 * - Controller: backend/controllers/attachmentControllers.js
 * - Validators: backend/middlewares/validators/attachmentValidators.js
 *
 * Endpoints:
 * - getAttachments: List attachments with pagination and filters
 * - getAttachmentById: Get single attachment details
 * - createAttachment: Create new attachment (file upload)
 * - deleteAttachment: Soft delete attachment
 */

export const attachmentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get all attachments with pagination and filters
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (default: 1)
     * @param {number} params.limit - Items per page (default: 10)
     * @param {string} params.parentId - Filter by parent entity ID
     * @param {string} params.parentModel - Filter by parent model type
     * @param {boolean} params.deleted - Include deleted attachments
     * @param {string} params.sortBy - Sort field (default: createdAt)
     * @param {string} params.sortOrder - Sort order: asc/desc (default: desc)
     * @returns {Object} Paginated attachments list
     */
    getAttachments: builder.query({
      query: (params) => ({
        url: API_ENDPOINTS.ATTACHMENTS,
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({
                type: "Attachment",
                id: _id,
              })),
              { type: "Attachment", id: "LIST" },
            ]
          : [{ type: "Attachment", id: "LIST" }],
    }),

    /**
     * Get single attachment by ID
     * @param {string} attachmentId - Attachment ID
     * @returns {Object} Attachment details
     */
    getAttachmentById: builder.query({
      query: (attachmentId) => `${API_ENDPOINTS.ATTACHMENTS}/${attachmentId}`,
      providesTags: (result, error, id) => [{ type: "Attachment", id }],
    }),

    /**
     * Create new attachment (file upload)
     * @param {Object} data - Attachment data
     * @param {string} data.originalName - Original file name
     * @param {string} data.storedName - Stored file name
     * @param {string} data.mimeType - File MIME type
     * @param {number} data.size - File size in bytes
     * @param {string} data.url - File URL (Cloudinary)
     * @param {string} data.publicId - Cloudinary public ID
     * @param {string} data.parent - Parent entity ID
     * @param {string} data.parentModel - Parent model type (BaseTask, TaskActivity, TaskComment)
     * @param {number} data.width - Image width (optional)
     * @param {number} data.height - Image height (optional)
     * @returns {Object} Created attachment
     */
    createAttachment: builder.mutation({
      query: (data) => ({
        url: API_ENDPOINTS.ATTACHMENTS,
        method: "POST",
        body: data,
        // Note: For actual file uploads, you may need to use FormData
        // and set Content-Type to multipart/form-data
        // This depends on your backend implementation
      }),
      invalidatesTags: (result, error, data) => [
        { type: "Attachment", id: "LIST" },
        // Invalidate parent entity cache
        ...(data.parentModel === "BaseTask"
          ? [{ type: "Task", id: data.parent }]
          : []),
        ...(data.parentModel === "TaskActivity"
          ? [{ type: "TaskActivity", id: data.parent }]
          : []),
        ...(data.parentModel === "TaskComment"
          ? [{ type: "TaskComment", id: data.parent }]
          : []),
      ],
    }),

    /**
     * Upload file attachment (multipart/form-data)
     * @param {FormData} formData - Form data with file and metadata
     * @returns {Object} Created attachment
     */
    uploadAttachment: builder.mutation({
      query: (formData) => ({
        url: API_ENDPOINTS.ATTACHMENTS,
        method: "POST",
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary
        prepareHeaders: (headers) => {
          headers.delete("Content-Type");
          return headers;
        },
      }),
      invalidatesTags: [{ type: "Attachment", id: "LIST" }],
    }),

    /**
     * Soft delete attachment
     * @param {string} attachmentId - Attachment ID
     * @returns {Object} Deletion confirmation
     */
    deleteAttachment: builder.mutation({
      query: (attachmentId) => ({
        url: `${API_ENDPOINTS.ATTACHMENTS}/${attachmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, attachmentId) => [
        { type: "Attachment", id: attachmentId },
        { type: "Attachment", id: "LIST" },
      ],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetAttachmentsQuery,
  useGetAttachmentByIdQuery,
  useCreateAttachmentMutation,
  useUploadAttachmentMutation,
  useDeleteAttachmentMutation,
} = attachmentApi;
