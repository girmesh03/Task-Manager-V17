// client/src/services/cloudinaryService.js
import axios from "axios";

/**
 * Cloudinary Upload Service
 *
 * Handles file uploads to Cloudinary using unsigned upload presets.
 * Supports three upload types: attachment, organization, and profile.
 *
 * Features:
 * - Uses axios for HTTP requests (not fetch)
 * - Upload progress tracking via onUploadProgress callback
 * - Proper error handling with descriptive messages
 * - Environment variable configuration via import.meta.env
 * - Support for single and multiple file uploads
 * - Returns comprehensive upload result data
 *
 * Upload Types:
 * - attachment: For task/activity/comment attachments
 * - organization: For organization logos
 * - profile: For user profile pictures
 */

/**
 * Upload a single file to Cloudinary
 *
 * @param {File} file - File object to upload
 * @param {string} uploadType - Type of upload: 'attachment', 'organization', or 'profile'
 * @param {Function} [onProgress] - Optional progress callback (percentCompleted) => void
 * @returns {Promise<Object>} Upload result with url, publicId, format, dimensions, and size
 * @throws {Error} If upload fails or invalid upload type
 */
export const uploadToCloudinary = async (file, uploadType, onProgress) => {
  // Map upload types to presets
  const presetMap = {
    attachment: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_ATTACHMENTS,
    organization: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_ORGANIZATIONS,
    profile: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_PROFILE,
  };

  // Map upload types to folders
  const folderMap = {
    attachment: import.meta.env.VITE_CLOUDINARY_FOLDER_ATTACHMENTS,
    organization: import.meta.env.VITE_CLOUDINARY_FOLDER_ORGANIZATIONS,
    profile: import.meta.env.VITE_CLOUDINARY_FOLDER_PROFILE,
  };

  // Validate upload type
  if (!presetMap[uploadType]) {
    throw new Error(
      `Invalid upload type: ${uploadType}. Must be 'attachment', 'organization', or 'profile'.`
    );
  }

  // Validate file
  if (!file) {
    throw new Error("No file provided for upload");
  }

  // Prepare form data
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", presetMap[uploadType]);
  formData.append("folder", folderMap[uploadType]);

  // Cloudinary upload URL
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    throw new Error("Cloudinary cloud name not configured");
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

  try {
    const response = await axios.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );

          // Call progress callback if provided
          if (onProgress && typeof onProgress === "function") {
            onProgress(percentCompleted);
          }

          // Log progress for debugging
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      },
    });

    // Return comprehensive upload result
    return {
      url: response.data.secure_url,
      publicId: response.data.public_id,
      format: response.data.format,
      width: response.data.width,
      height: response.data.height,
      bytes: response.data.bytes,
      resourceType: response.data.resource_type,
      createdAt: response.data.created_at,
    };
  } catch (error) {
    // Extract error message from response or use generic message
    const errorMessage =
      error.response?.data?.error?.message ||
      error.message ||
      "Upload failed. Please try again.";

    console.error("Cloudinary upload error:", error);
    throw new Error(errorMessage);
  }
};

/**
 * Upload multiple files to Cloudinary
 *
 * @param {File[]} files - Array of File objects to upload
 * @param {string} uploadType - Type of upload: 'attachment', 'organization', or 'profile'
 * @param {Function} [onProgress] - Optional progress callback (percentCompleted, fileIndex) => void
 * @returns {Promise<Array>} Array of upload results
 * @throws {Error} If any upload fails
 */
export const uploadMultipleToCloudinary = async (
  files,
  uploadType,
  onProgress
) => {
  // Validate files array
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("No files provided for upload");
  }

  try {
    // Upload all files in parallel with individual progress tracking
    const uploadPromises = files.map((file, index) =>
      uploadToCloudinary(file, uploadType, (percentCompleted) => {
        if (onProgress && typeof onProgress === "function") {
          onProgress(percentCompleted, index);
        }
      })
    );

    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    const errorMessage = error.message || "Multiple upload failed";
    console.error("Multiple upload error:", error);
    throw new Error(`Multiple upload failed: ${errorMessage}`);
  }
};

/**
 * Validate file before upload
 *
 * @param {File} file - File to validate
 * @param {string} uploadType - Type of upload
 * @param {number} maxSize - Maximum file size in bytes
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
export const validateFile = (file, uploadType, maxSize, allowedTypes) => {
  // Check if file exists
  if (!file) {
    throw new Error("No file provided");
  }

  // Check file size
  if (maxSize && file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
  }

  // Check file type
  if (allowedTypes && allowedTypes.length > 0) {
    const isAllowed = allowedTypes.some((type) => {
      // Handle wildcard types (e.g., "image/*")
      if (type.endsWith("/*")) {
        const baseType = type.replace("/*", "");
        return file.type.startsWith(baseType);
      }
      // Exact match
      return file.type === type;
    });

    if (!isAllowed) {
      throw new Error(
        `File type "${
          file.type
        }" is not allowed. Allowed types: ${allowedTypes.join(", ")}`
      );
    }
  }

  return true;
};

/**
 * Get Cloudinary configuration for a specific upload type
 *
 * @param {string} uploadType - Type of upload
 * @returns {Object} Configuration object with preset and folder
 */
export const getCloudinaryConfig = (uploadType) => {
  const presetMap = {
    attachment: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_ATTACHMENTS,
    organization: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_ORGANIZATIONS,
    profile: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_PROFILE,
  };

  const folderMap = {
    attachment: import.meta.env.VITE_CLOUDINARY_FOLDER_ATTACHMENTS,
    organization: import.meta.env.VITE_CLOUDINARY_FOLDER_ORGANIZATIONS,
    profile: import.meta.env.VITE_CLOUDINARY_FOLDER_PROFILE,
  };

  return {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
    uploadPreset: presetMap[uploadType],
    folder: folderMap[uploadType],
  };
};

/**
 * Example usage:
 *
 * // Single file upload with progress tracking
 * const handleUpload = async (file) => {
 *   try {
 *     const result = await uploadToCloudinary(
 *       file,
 *       'profile',
 *       (progress) => console.log(`Progress: ${progress}%`)
 *     );
 *     console.log('Upload successful:', result.url);
 *   } catch (error) {
 *     console.error('Upload failed:', error.message);
 *   }
 * };
 *
 * // Multiple files upload
 * const handleMultipleUpload = async (files) => {
 *   try {
 *     const results = await uploadMultipleToCloudinary(
 *       files,
 *       'attachment',
 *       (progress, index) => console.log(`File ${index}: ${progress}%`)
 *     );
 *     console.log('All uploads successful:', results);
 *   } catch (error) {
 *     console.error('Upload failed:', error.message);
 *   }
 * };
 *
 * // File validation before upload
 * try {
 *   validateFile(file, 'profile', 10 * 1024 * 1024, ['image/jpeg', 'image/png']);
 *   await uploadToCloudinary(file, 'profile');
 * } catch (error) {
 *   console.error('Validation or upload failed:', error.message);
 * }
 */
