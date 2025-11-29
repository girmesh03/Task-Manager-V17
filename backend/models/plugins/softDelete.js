// backend/models/plugins/softDelete.js
/**
 * Soft delete plugin for Mongoose schemas
 * Adds isDeleted, deletedAt, and deletedBy fields with proper validation and hooks
 * Provides automatic filtering of deleted documents and prevents hard deletes
 *
 * Features:
 * - Prevents hard deletes completely (override remove, deleteOne, deleteMany, findOneAndDelete)
 * - Query helpers: withDeleted(), onlyDeleted()
 * - Aggregate pipeline filtering for isDeleted
 * - deletedBy tracks user who deleted
 * - Restore functionality clears all soft-delete fields
 * - TTL index creation for auto-cleanup
 * - Audit trail for restore operations
 * - Bulk restore method (restoreMany)
 * - Transaction support for all operations
 * - Validation hooks to prevent isDeleted manipulation outside methods
 */

// Track documents being modified by plugin methods to allow isDeleted changes
const pluginModifiedDocs = new WeakSet();

export default function softDeletePlugin(schema, options = {}) {
  // ==================== FIELDS ====================
  schema.add({
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: {
      type: schema.constructor.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    // Audit trail for restore operations
    restoredAt: { type: Date, default: null },
    restoredBy: {
      type: schema.constructor.Types.ObjectId,
      ref: "User",
      default: null,
    },
    restoreCount: { type: Number, default: 0 },
  });

  // ==================== VALIDATION HOOKS ====================
  /**
   * Prevent direct manipulation of isDeleted field outside plugin methods
   * This ensures data integrity by forcing use of softDelete/restore methods
   */
  schema.pre("save", function (next) {
    // Allow if document is being modified by plugin methods
    if (pluginModifiedDocs.has(this)) {
      pluginModifiedDocs.delete(this);
      return next();
    }

    // Check if isDeleted is being modified directly
    if (this.isModified("isDeleted") && !this.isNew) {
      // Allow setting isDeleted to false during restore (handled by restore methods)
      // Block direct manipulation
      const error = new Error(
        "Direct manipulation of isDeleted field is not allowed. Use softDelete() or restore() methods."
      );
      error.name = "SoftDeleteValidationError";
      return next(error);
    }

    // Sync deletedAt with isDeleted state for new documents
    if (this.isNew) {
      if (this.isDeleted && !this.deletedAt) {
        this.deletedAt = new Date();
      }
      if (!this.isDeleted) {
        this.deletedAt = null;
        this.deletedBy = null;
      }
    }

    next();
  });

  /**
   * Prevent direct update of isDeleted via updateOne/updateMany
   */
  schema.pre(["updateOne", "updateMany", "findOneAndUpdate"], function (next) {
    const update = this.getUpdate();
    const opts = this.getOptions();

    // Allow if explicitly marked as plugin operation
    if (opts._softDeletePluginOperation) {
      return next();
    }

    // Check for direct isDeleted manipulation in $set
    if (update?.$set?.isDeleted !== undefined) {
      const error = new Error(
        "Direct manipulation of isDeleted field is not allowed. Use softDeleteById/softDeleteMany or restoreById/restoreMany methods."
      );
      error.name = "SoftDeleteValidationError";
      return next(error);
    }

    // Check for direct isDeleted manipulation at root level
    if (update?.isDeleted !== undefined && !update.$set && !update.$unset) {
      const error = new Error(
        "Direct manipulation of isDeleted field is not allowed. Use softDeleteById/softDeleteMany or restoreById/restoreMany methods."
      );
      error.name = "SoftDeleteValidationError";
      return next(error);
    }

    next();
  });

  // ==================== QUERY HELPERS ====================
  /**
   * Include soft-deleted documents in query results
   * @returns {Query} Modified query
   */
  schema.query.withDeleted = function () {
    this.setOptions({ withDeleted: true });
    return this;
  };

  /**
   * Return only soft-deleted documents
   * @returns {Query} Modified query
   */
  schema.query.onlyDeleted = function () {
    this.setOptions({ withDeleted: true });
    this.where({ isDeleted: true });
    return this;
  };

  /**
   * Add isDeleted: false filter to queries unless withDeleted option is set
   */
  const addNotDeletedFilter = function () {
    const opts = this.getOptions();
    if (opts.withDeleted) return;
    const q = this.getQuery();
    if (q.isDeleted === undefined) this.setQuery({ ...q, isDeleted: false });
  };

  schema.pre("find", addNotDeletedFilter);
  schema.pre("findOne", addNotDeletedFilter);
  schema.pre("countDocuments", addNotDeletedFilter);
  schema.pre("findOneAndUpdate", addNotDeletedFilter);
  schema.pre("updateOne", addNotDeletedFilter);
  schema.pre("updateMany", addNotDeletedFilter);

  /**
   * Add isDeleted filter to aggregate pipelines
   */
  schema.pre("aggregate", function (next) {
    // Check options using the correct method for Mongoose aggregation
    const opts = this.options || {};
    if (opts.withDeleted) return next();
    const hasIsDeletedMatch = this.pipeline().some((stage) => {
      if (stage.$match && "isDeleted" in stage.$match) return true;
      const sub = stage.$lookup || stage.$facet;
      if (sub && Array.isArray(sub.pipeline)) {
        return sub.pipeline.some((s) => s.$match && "isDeleted" in s.$match);
      }
      return false;
    });
    if (!hasIsDeletedMatch)
      this.pipeline().unshift({ $match: { isDeleted: false } });
    next();
  });

  // ==================== HARD DELETE BLOCKING ====================
  /**
   * Block all hard delete operations
   * Forces use of soft delete methods
   */
  const blockHardDelete = function (next) {
    const error = new Error(
      "Hard delete is disabled. Use softDeleteById/softDeleteMany or set isDeleted=true within a transaction."
    );
    error.name = "HardDeleteBlockedError";
    next(error);
  };

  schema.pre("deleteOne", { document: false, query: true }, blockHardDelete);
  schema.pre("deleteMany", { document: false, query: true }, blockHardDelete);
  schema.pre("findOneAndDelete", blockHardDelete);
  schema.pre("remove", { document: true, query: false }, blockHardDelete);

  // ==================== INSTANCE METHODS ====================
  /**
   * Soft delete this document
   * @param {ObjectId} deletedBy - User ID who is deleting
   * @param {Object} options - Options including session
   * @returns {Promise<Document>} Updated document
   */
  schema.methods.softDelete = async function (deletedBy, { session } = {}) {
    if (this.isDeleted) {
      throw new Error("Document is already soft-deleted");
    }

    // Mark document as being modified by plugin
    pluginModifiedDocs.add(this);

    this.isDeleted = true;
    this.deletedAt = new Date();
    if (deletedBy) {
      this.deletedBy = deletedBy;
    }

    return this.save({ session });
  };

  /**
   * Restore this soft-deleted document
   * @param {ObjectId} restoredBy - User ID who is restoring
   * @param {Object} options - Options including session
   * @returns {Promise<Document>} Updated document
   */
  schema.methods.restore = async function (restoredBy, { session } = {}) {
    if (!this.isDeleted) {
      throw new Error("Document is not soft-deleted");
    }

    // Mark document as being modified by plugin
    pluginModifiedDocs.add(this);

    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    this.restoredAt = new Date();
    if (restoredBy) {
      this.restoredBy = restoredBy;
    }
    this.restoreCount = (this.restoreCount || 0) + 1;

    return this.save({ session });
  };

  // ==================== STATIC METHODS ====================
  /**
   * Soft delete a document by ID
   * @param {ObjectId} id - Document ID
   * @param {Object} options - Options including session and deletedBy
   * @returns {Promise<UpdateResult>} Update result
   */
  schema.statics.softDeleteById = async function (
    id,
    { session, deletedBy } = {}
  ) {
    const updateFields = { isDeleted: true, deletedAt: new Date() };
    if (deletedBy) {
      updateFields.deletedBy = deletedBy;
    }
    return this.updateOne(
      { _id: id, isDeleted: false },
      { $set: updateFields },
      { session, _softDeletePluginOperation: true }
    );
  };

  /**
   * Soft delete multiple documents matching filter
   * @param {Object} filter - Query filter
   * @param {Object} options - Options including session and deletedBy
   * @returns {Promise<UpdateResult>} Update result
   */
  schema.statics.softDeleteMany = async function (
    filter = {},
    { session, deletedBy } = {}
  ) {
    const updateFields = { isDeleted: true, deletedAt: new Date() };
    if (deletedBy) {
      updateFields.deletedBy = deletedBy;
    }
    return this.updateMany(
      { ...filter, isDeleted: false },
      { $set: updateFields },
      { session, _softDeletePluginOperation: true }
    );
  };

  /**
   * Restore a soft-deleted document by ID
   * @param {ObjectId} id - Document ID
   * @param {Object} options - Options including session and restoredBy
   * @returns {Promise<UpdateResult>} Update result
   */
  schema.statics.restoreById = async function (
    id,
    { session, restoredBy } = {}
  ) {
    const updateFields = {
      isDeleted: false,
      restoredAt: new Date(),
    };
    if (restoredBy) {
      updateFields.restoredBy = restoredBy;
    }
    return this.updateOne(
      { _id: id, isDeleted: true },
      {
        $set: updateFields,
        $unset: { deletedAt: 1, deletedBy: 1 },
        $inc: { restoreCount: 1 },
      },
      { session, _softDeletePluginOperation: true }
    );
  };

  /**
   * Restore multiple soft-deleted documents matching filter
   * @param {Object} filter - Query filter
   * @param {Object} options - Options including session and restoredBy
   * @returns {Promise<UpdateResult>} Update result
   */
  schema.statics.restoreMany = async function (
    filter = {},
    { session, restoredBy } = {}
  ) {
    const updateFields = {
      isDeleted: false,
      restoredAt: new Date(),
    };
    if (restoredBy) {
      updateFields.restoredBy = restoredBy;
    }
    return this.updateMany(
      { ...filter, isDeleted: true },
      {
        $set: updateFields,
        $unset: { deletedAt: 1, deletedBy: 1 },
        $inc: { restoreCount: 1 },
      },
      { session, _softDeletePluginOperation: true }
    );
  };

  /**
   * Find soft-deleted documents by IDs
   * @param {ObjectId[]} ids - Array of document IDs
   * @param {Object} options - Options including session
   * @returns {Promise<Document[]>} Array of soft-deleted documents
   */
  schema.statics.findDeletedByIds = async function (ids, { session } = {}) {
    return this.find({ _id: { $in: ids }, isDeleted: true })
      .setOptions({ withDeleted: true })
      .session(session);
  };

  /**
   * Count soft-deleted documents matching filter
   * @param {Object} filter - Query filter
   * @param {Object} options - Options including session
   * @returns {Promise<number>} Count of soft-deleted documents
   */
  schema.statics.countDeleted = async function (filter = {}, { session } = {}) {
    return this.countDocuments({ ...filter, isDeleted: true })
      .setOptions({ withDeleted: true })
      .session(session);
  };

  /**
   * Ensure TTL index exists for automatic cleanup of soft-deleted documents
   * @param {number} expireAfterSeconds - TTL in seconds (0 or null to skip)
   * @returns {Promise<void>}
   */
  schema.statics.ensureTTLIndex = async function (expireAfterSeconds = 0) {
    if (!this.db) return;

    // Skip TTL index creation if expireAfterSeconds is 0 or null (e.g., Organizations)
    if (!expireAfterSeconds || expireAfterSeconds <= 0) {
      return;
    }

    const coll = this.db.collection(this.collection.name);
    const existing = await coll.indexes();
    const hasTTL = existing.some(
      (idx) => idx.key && idx.key.deletedAt === 1 && idx.expireAfterSeconds
    );
    if (!hasTTL) {
      await coll.createIndex(
        { deletedAt: 1 },
        {
          expireAfterSeconds,
          partialFilterExpression: { isDeleted: true },
          background: true,
        }
      );
    }
  };

  /**
   * Get restore audit trail for a document
   * @param {ObjectId} id - Document ID
   * @param {Object} options - Options including session
   * @returns {Promise<Object>} Restore audit information
   */
  schema.statics.getRestoreAudit = async function (id, { session } = {}) {
    const doc = await this.findById(id)
      .select(
        "restoredAt restoredBy restoreCount isDeleted deletedAt deletedBy"
      )
      .setOptions({ withDeleted: true })
      .session(session);

    if (!doc) return null;

    return {
      id: doc._id,
      isDeleted: doc.isDeleted,
      deletedAt: doc.deletedAt,
      deletedBy: doc.deletedBy,
      restoredAt: doc.restoredAt,
      restoredBy: doc.restoredBy,
      restoreCount: doc.restoreCount || 0,
    };
  };
}
