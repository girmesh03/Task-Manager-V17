// backend/utils/responseTransform.js

/**
 * Utility functions for transforming response data
 * Removes sensitive/internal fields from all responses
 */

/**
 * Fields to exclude from all responses
 */
const EXCLUDED_FIELDS = ["deleted", "deleteAt", "deletedBy", "id", "__v"];

/**
 * Transform a single document by removing excluded fields
 * @param {Object} doc - Document to transform (plain object or Mongoose doc)
 * @returns {Object} Transformed document
 */
export const transformDocument = (doc) => {
  if (!doc) return doc;

  // Convert to plain object if it's a Mongoose document
  const obj = doc.toObject ? doc.toObject() : { ...doc };

  // Remove excluded fields
  EXCLUDED_FIELDS.forEach((field) => {
    delete obj[field];
  });

  return obj;
};

/**
 * Transform an array of documents
 * @param {Array} docs - Array of documents to transform
 * @returns {Array} Transformed documents
 */
export const transformDocuments = (docs) => {
  if (!Array.isArray(docs)) return docs;
  return docs.map((doc) => transformDocument(doc));
};

/**
 * Transform paginated response data
 * @param {Object} paginatedResult - Result from mongoose-paginate-v2
 * @returns {Object} Transformed paginated result
 */
export const transformPaginatedResponse = (paginatedResult) => {
  if (!paginatedResult) return paginatedResult;

  return {
    ...paginatedResult,
    docs: transformDocuments(paginatedResult.docs),
  };
};

/**
 * Create standard toJSON transform function for schemas
 * @returns {Function} Transform function for schema options
 */
export const createToJSONTransform = () => {
  return function (doc, ret) {
    // Remove excluded fields
    EXCLUDED_FIELDS.forEach((field) => {
      delete ret[field];
    });
    return ret;
  };
};
