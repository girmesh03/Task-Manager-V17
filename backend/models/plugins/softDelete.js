import CustomError from "../errorHandler/CustomError.js";

/**
 * Soft Delete Plugin for Mongoose Models
 * Provides universal soft delete functionality with TTL support
 *
 * Features:
 * - Automatic soft delete instead of hard delete
 * - Query helpers to include/exclude deleted documents
 * - Restore functionality with audit trail
 * - TTL (Time To Live) index for auto-expiry
 * - Hard delete protection
 *
 * @param {Object} schema - Mongoose schema
 * @param {Object} options - Plugin options
 * @param {number} options.ttl - TTL in seconds (null = never expire)
 */
const softDeletePlugin = (schema, options = {}) => {
  // Add soft delete fields to schema
  schema.add({
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
    deletedBy: {
      type: schema.path("createdBy")?.instance === "ObjectID"
        ? schema.obj.createdBy
        : { type: schema.Types.ObjectId, ref: "User" },
      default: null,
      index: true,
    },
    restoredAt: {
      type: Date,
      default: null,
    },
    restoredBy: {
      type: schema.path("createdBy")?.instance === "ObjectID"
        ? schema.obj.createdBy
        : { type: schema.Types.ObjectId, ref: "User" },
      default: null,
    },
    restoreCount: {
      type: Number,
      default: 0,
    },
  });

  // Create TTL index if specified
  if (options.ttl !== null && options.ttl !== undefined) {
    schema.index(
      { deletedAt: 1 },
      {
        expireAfterSeconds: options.ttl,
        partialFilterExpression: { isDeleted: true },
      }
    );
  }

  /**
   * Query Helper: Include soft-deleted documents in query
   * Usage: Model.find().withDeleted()
   */
  schema.query.withDeleted = function () {
    return this.where({});
  };

  /**
   * Query Helper: Return only soft-deleted documents  * Usage: Model.find().onlyDeleted()
   */
  schema.query.onlyDeleted = function () {
    return this.where({ isDeleted: true });
  };

  /**
   * Instance Method: Soft delete this document
   * @param {ObjectId} deletedBy - User ID who deleted the document
   * @param {Object} options - Transaction options
   * @returns {Promise<Document>}
   */
  schema.methods.softDelete = async function (deletedBy, options = {}) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    return await this.save(options);
  };

  /**
   * Instance Method: Restore this soft-deleted document
   * @param {ObjectId} restoredBy - User ID who restored the document
   * @param {Object} options - Transaction options
   * @returns {Promise<Document>}
   */
  schema.methods.restore = async function (restoredBy, options = {}) {
    if (!this.isDeleted) {
      throw CustomError.badRequest("Document is not deleted");
    }

    this.isDeleted = false;
    this.restoredAt = new Date();
    this.restoredBy = restoredBy;
    this.restoreCount += 1;

    // Keep deletion history but mark as restored
    return await this.save(options);
  };

  /**
   * Static Method: Soft delete by ID
   * @param {ObjectId} id - Document ID
   * @param {Object} options - Options with session and deletedBy
   * @returns {Promise<Document>}
   */
  schema.statics.softDeleteById = async function (id, options = {}) {
    const { session, deletedBy } = options;

    const doc = await this.findById(id).session(session || null);
    if (!doc) {
      throw CustomError.notFound(`${this.modelName} not found`);
    }

    return await doc.softDelete(deletedBy, { session });
  };

  /**
   * Static Method: Soft delete multiple documents
   * @param {Object} filter - Query filter
   * @param {Object} options - Options with session and deletedBy
   * @returns {Promise<Object>} Result with count
   */
  schema.statics.softDeleteMany = async function (filter, options = {}) {
    const { session, deletedBy } = options;

    const result = await this.updateMany(
      { ...filter, isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: deletedBy,
        },
      },
      { session: session || null }
    );

    return {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
    };
  };

  /**
   * Static Method: Restore by ID
   * @param {ObjectId} id - Document ID
   * @param {Object} options - Options with session and restoredBy
   * @returns {Promise<Document>}
   */
  schema.statics.restoreById = async function (id, options = {}) {
    const { session, restoredBy } = options;

    const doc = await this.findById(id).withDeleted().session(session || null);
    if (!doc) {
      throw CustomError.notFound(`${this.modelName} not found`);
    }

    return await doc.restore(restoredBy, { session });
  };

  /**
   * Static Method: Restore multiple documents
   * @param {Object} filter - Query filter
   * @param {Object} options - Options with session and restoredBy
   * @returns {Promise<Object>} Result with count
   */
  schema.statics.restoreMany = async function (filter, options = {}) {
    const { session, restoredBy } = options;

    const result = await this.updateMany(
      { ...filter, isDeleted: true },
      {
        $set: {
          isDeleted: false,
          restoredAt: new Date(),
          restoredBy: restoredBy,
        },
        $inc: { restoreCount: 1 },
      },
      { session: session || null }
    );

    return {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
    };
  };

  /**
   * Static Method: Find soft-deleted documents by IDs
   * @param {Array<ObjectId>} ids - Document IDs
   * @param {Object} options - Options with session
   * @returns {Promise<Array<Document>>}
   */
  schema.statics.findDeletedByIds = async function (ids, options = {}) {
    const { session } = options;

    return await this.find({
      _id: { $in: ids },
      isDeleted: true,
    }).session(session || null);
  };

  /**
   * Static Method: Count soft-deleted documents
   * @param {Object} filter - Query filter
   * @param {Object} options - Options with session
   * @returns {Promise<number>}
   */
  schema.statics.countDeleted = async function (filter = {}, options = {}) {
    const { session } = options;

    return await this.countDocuments({
      ...filter,
      isDeleted: true,
    }).session(session || null);
  };

  /**
   * Static Method: Get restore audit trail
   * @param {ObjectId} id - Document ID
   * @param {Object} options - Options with session
   * @returns {Promise<Object>} Audit information
   */
  schema.statics.getRestoreAudit = async function (id, options = {}) {
    const { session } = options;

    const doc = await this.findById(id)
      .withDeleted()
      .select("isDeleted deletedAt deletedBy restoredAt restoredBy restoreCount")
      .populate("deletedBy", "firstName lastName email")
      .populate("restoredBy", "firstName lastName email")
      .session(session || null);

    if (!doc) {
      throw CustomError.notFound(`${this.modelName} not found`);
    }

    return {
      isDeleted: doc.isDeleted,
      deletedAt: doc.deletedAt,
      deletedBy: doc.deletedBy,
      restoredAt: doc.restoredAt,
      restoredBy: doc.restoredBy,
      restoreCount: doc.restoreCount,
    };
  };

  // Automatically filter out soft-deleted documents in queries
  schema.pre(/^find/, function (next) {
    // Only apply filter if not using withDeleted() or onlyDeleted()
    if (!this.getOptions().withDeleted && !this.getOptions().onlyDeleted) {
      this.where({ isDeleted: { $ne: true } });
    }
    next();
  });

  // Block hard delete operations
  const blockedOperations = [
    "remove",
    "deleteOne",
    "deleteMany",
    "findOneAndDelete",
    "findByIdAndDelete",
    "findOneAndRemove",
    "findByIdAndRemove",
  ];

  blockedOperations.forEach((operation) => {
    schema.pre(operation, function (next) {
      next(
        CustomError.forbidden(
          `Hard delete is not allowed. Use softDelete() instead.`
        )
      );
    });
  });
};

export default softDeletePlugin;
