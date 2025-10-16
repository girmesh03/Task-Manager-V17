// backend/models/plugins/softDelete.js
/**
 * Soft delete plugin for Mongoose schemas
 * Adds isDeleted, deletedAt, and deletedBy fields with proper validation and hooks
 * Provides automatic filtering of deleted documents and prevents hard deletes
 */

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
  });

  // ==================== HOOKS ====================
  schema.pre("save", function (next) {
    if (this.isModified("isDeleted")) {
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

  // ==================== QUERY HELPERS ====================
  schema.query.withDeleted = function () {
    this.setOptions({ withDeleted: true });
    return this;
  };

  schema.query.onlyDeleted = function () {
    this.setOptions({ withDeleted: true });
    this.where({ isDeleted: true });
    return this;
  };

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

  schema.pre("aggregate", function (next) {
    if (this.options()?.withDeleted) return next();
    const hasIsDeletedMatch = this.pipeline().some((stage) => {
      if (stage.$match && "$isDeleted" in stage.$match) return true;
      const sub = stage.$lookup || stage.$facet;
      if (sub && Array.isArray(sub.pipeline)) {
        return sub.pipeline.some((s) => s.$match && "$isDeleted" in s.$match);
      }
      return false;
    });
    if (!hasIsDeletedMatch)
      this.pipeline().unshift({ $match: { isDeleted: false } });
    next();
  });

  const blockHardDelete = function (next) {
    next(
      new Error(
        "Hard delete is disabled. Use softDeleteById/softDeleteMany or set isDeleted=true within a transaction."
      )
    );
  };

  schema.pre("deleteOne", { document: false, query: true }, blockHardDelete);
  schema.pre("deleteMany", { document: false, query: true }, blockHardDelete);
  schema.pre("findOneAndDelete", blockHardDelete);
  schema.pre("remove", { document: true, query: false }, blockHardDelete);

  // ==================== STATIC METHODS ====================
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
      { session }
    );
  };

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
      { session }
    );
  };

  schema.statics.restoreById = async function (id, { session } = {}) {
    return this.updateOne(
      { _id: id, isDeleted: true },
      { $set: { isDeleted: false }, $unset: { deletedAt: 1, deletedBy: 1 } },
      { session }
    );
  };

  schema.statics.ensureTTLIndex = async function (expireAfterSeconds = 0) {
    if (!this.db) return;
    const coll = this.db.collection(this.collection.name);
    const existing = await coll.indexes();
    const hasTTL = existing.some(
      (idx) => idx.key && idx.key.deletedAt === 1 && idx.expireAfterSeconds
    );
    if (!hasTTL && expireAfterSeconds > 0) {
      await coll.createIndex({ deletedAt: 1 }, { expireAfterSeconds });
    }
  };
}
