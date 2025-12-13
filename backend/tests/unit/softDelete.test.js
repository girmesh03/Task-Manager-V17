// backend/tests/unit/softDelete.test.js
/**
 * Soft Delete Plugin Tests
 * Tests for the soft delete plugin functionality including:
 * - Hard delete prevention
 * - Query filtering
 * - Restore functionality
 * - TTL index creation
 * - Audit trail
 * - Transaction support
 *
 * **Feature: production-readiness-validation, Property 1: Soft Delete Plugin Prevents Hard Deletes**
 * **Feature: production-readiness-validation, Property 2: Soft Delete Query Filtering**
 * **Feature: production-readiness-validation, Property 3: Soft Delete State Transitions**
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import mongoose from "mongoose";
import softDeletePlugin from "../../models/plugins/softDelete.js";

// Test schema with soft delete plugin - use unique name to avoid conflicts
const TestSoftDeleteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: Number, default: 0 },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
});

TestSoftDeleteSchema.plugin(softDeletePlugin);

// Create model only if it doesn't exist
let TestModel;
try {
  TestModel = mongoose.model("TestSoftDeleteModel");
} catch {
  TestModel = mongoose.model("TestSoftDeleteModel", TestSoftDeleteSchema);
}

describe("Soft Delete Plugin", () => {
  beforeEach(async () => {
    // Clean up using collection method that bypasses hooks
    if (mongoose.connection.readyState === 1) {
      try {
        await TestModel.collection.deleteMany({});
      } catch (e) {
        // Collection might not exist yet
      }
    }
  });

  afterEach(async () => {
    // Clean up after each test
    if (mongoose.connection.readyState === 1) {
      try {
        await TestModel.collection.deleteMany({});
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  describe("Schema Fields", () => {
    it("should add isDeleted, deletedAt, deletedBy fields to schema", async () => {
      const doc = await TestModel.create({ name: "test" });

      // Fetch with soft delete fields
      const fetched = await TestModel.findById(doc._id)
        .select("+isDeleted +deletedAt +deletedBy")
        .setOptions({ withDeleted: true });

      expect(fetched.isDeleted).toBe(false);
      expect(fetched.deletedAt).toBeNull();
      expect(fetched.deletedBy).toBeNull();
    });

    it("should add restore audit fields to schema", async () => {
      const doc = await TestModel.create({ name: "test" });

      const fetched = await TestModel.findById(doc._id)
        .select("+restoredAt +restoredBy +restoreCount")
        .setOptions({ withDeleted: true });

      expect(fetched.restoredAt).toBeNull();
      expect(fetched.restoredBy).toBeNull();
      expect(fetched.restoreCount).toBe(0);
    });
  });

  describe("Hard Delete Prevention", () => {
    /**
     * **Feature: production-readiness-validation, Property 1: Soft Delete Plugin Prevents Hard Deletes**
     * For any model using the soft delete plugin, calling native delete methods
     * (remove, deleteOne, deleteMany, findByIdAndDelete) SHALL throw an error
     */
    it("Property 1: should block deleteOne query", async () => {
      const doc = await TestModel.create({ name: "test" });

      await expect(TestModel.deleteOne({ _id: doc._id })).rejects.toThrow(
        "Hard delete is disabled"
      );

      // Verify document still exists
      const exists = await TestModel.findById(doc._id).setOptions({
        withDeleted: true,
      });
      expect(exists).not.toBeNull();
    });

    it("Property 1: should block deleteMany query", async () => {
      await TestModel.create({ name: "test1" });
      await TestModel.create({ name: "test2" });

      await expect(TestModel.deleteMany({})).rejects.toThrow(
        "Hard delete is disabled"
      );

      // Verify documents still exist
      const count = await TestModel.countDocuments().setOptions({
        withDeleted: true,
      });
      expect(count).toBe(2);
    });

    it("Property 1: should block findOneAndDelete", async () => {
      const doc = await TestModel.create({ name: "test" });

      await expect(
        TestModel.findOneAndDelete({ _id: doc._id })
      ).rejects.toThrow("Hard delete is disabled");

      // Verify document still exists
      const exists = await TestModel.findById(doc._id).setOptions({
        withDeleted: true,
      });
      expect(exists).not.toBeNull();
    });

    it("Property 1: should block document remove method", async () => {
      const doc = await TestModel.create({ name: "test" });

      await expect(doc.deleteOne()).rejects.toThrow("Hard delete is disabled");

      // Verify document still exists
      const exists = await TestModel.findById(doc._id).setOptions({
        withDeleted: true,
      });
      expect(exists).not.toBeNull();
    });
  });

  describe("Query Filtering", () => {
    /**
     * **Feature: production-readiness-validation, Property 2: Soft Delete Query Filtering**
     * For any model using the soft delete plugin and any find query without withDeleted(),
     * the result SHALL NOT include documents where isDeleted is true
     */
    it("Property 2: should exclude soft-deleted documents from find queries", async () => {
      const doc1 = await TestModel.create({ name: "active" });
      const doc2 = await TestModel.create({ name: "deleted" });

      // Soft delete doc2
      await TestModel.softDeleteById(doc2._id);

      // Normal find should only return active document
      const results = await TestModel.find({});
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("active");
    });

    it("Property 2: should exclude soft-deleted documents from findOne", async () => {
      const doc = await TestModel.create({ name: "test" });
      await TestModel.softDeleteById(doc._id);

      const result = await TestModel.findOne({ name: "test" });
      expect(result).toBeNull();
    });

    it("Property 2: should exclude soft-deleted documents from countDocuments", async () => {
      await TestModel.create({ name: "active1" });
      await TestModel.create({ name: "active2" });
      const deleted = await TestModel.create({ name: "deleted" });

      await TestModel.softDeleteById(deleted._id);

      const count = await TestModel.countDocuments({});
      expect(count).toBe(2);
    });

    it("should include soft-deleted documents with withDeleted()", async () => {
      const doc1 = await TestModel.create({ name: "active" });
      const doc2 = await TestModel.create({ name: "deleted" });

      await TestModel.softDeleteById(doc2._id);

      const results = await TestModel.find({}).withDeleted();
      expect(results).toHaveLength(2);
    });

    it("should return only soft-deleted documents with onlyDeleted()", async () => {
      const doc1 = await TestModel.create({ name: "active" });
      const doc2 = await TestModel.create({ name: "deleted" });

      await TestModel.softDeleteById(doc2._id);

      const results = await TestModel.find({}).onlyDeleted();
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("deleted");
    });
  });

  describe("Soft Delete Operations", () => {
    /**
     * **Feature: production-readiness-validation, Property 3: Soft Delete State Transitions**
     * For any document, calling softDeleteById SHALL set isDeleted to true and deletedAt to a timestamp
     */
    it("Property 3: softDeleteById should set isDeleted and deletedAt", async () => {
      const doc = await TestModel.create({ name: "test" });
      const userId = new mongoose.Types.ObjectId();

      const beforeDelete = new Date();
      await TestModel.softDeleteById(doc._id, { deletedBy: userId });
      const afterDelete = new Date();

      const deleted = await TestModel.findById(doc._id)
        .select("+isDeleted +deletedAt +deletedBy")
        .setOptions({ withDeleted: true });

      expect(deleted.isDeleted).toBe(true);
      expect(deleted.deletedAt).not.toBeNull();
      expect(deleted.deletedAt.getTime()).toBeGreaterThanOrEqual(
        beforeDelete.getTime()
      );
      expect(deleted.deletedAt.getTime()).toBeLessThanOrEqual(
        afterDelete.getTime()
      );
      expect(deleted.deletedBy.toString()).toBe(userId.toString());
    });

    it("softDeleteMany should soft delete multiple documents", async () => {
      await TestModel.create({ name: "test1", value: 1 });
      await TestModel.create({ name: "test2", value: 1 });
      await TestModel.create({ name: "test3", value: 2 });

      const result = await TestModel.softDeleteMany({ value: 1 });

      expect(result.modifiedCount).toBe(2);

      const remaining = await TestModel.find({});
      expect(remaining).toHaveLength(1);
      expect(remaining[0].name).toBe("test3");
    });
  });

  describe("Restore Operations", () => {
    /**
     * **Feature: production-readiness-validation, Property 3: Soft Delete State Transitions**
     * Calling restoreById SHALL set isDeleted to false and deletedAt to null
     */
    it("Property 3: restoreById should clear soft-delete fields and set audit trail", async () => {
      const doc = await TestModel.create({ name: "test" });
      const deletedBy = new mongoose.Types.ObjectId();
      const restoredBy = new mongoose.Types.ObjectId();

      await TestModel.softDeleteById(doc._id, { deletedBy });

      const beforeRestore = new Date();
      await TestModel.restoreById(doc._id, { restoredBy });
      const afterRestore = new Date();

      const restored = await TestModel.findById(doc._id).select(
        "+isDeleted +deletedAt +deletedBy +restoredAt +restoredBy +restoreCount"
      );

      expect(restored.isDeleted).toBe(false);
      // After $unset, fields may be null or undefined depending on selection
      expect(restored.deletedAt == null).toBe(true);
      expect(restored.deletedBy == null).toBe(true);
      expect(restored.restoredAt).not.toBeNull();
      expect(restored.restoredAt.getTime()).toBeGreaterThanOrEqual(
        beforeRestore.getTime()
      );
      expect(restored.restoredAt.getTime()).toBeLessThanOrEqual(
        afterRestore.getTime()
      );
      expect(restored.restoredBy.toString()).toBe(restoredBy.toString());
      expect(restored.restoreCount).toBe(1);
    });

    it("restoreMany should restore multiple documents", async () => {
      const doc1 = await TestModel.create({ name: "test1", value: 1 });
      const doc2 = await TestModel.create({ name: "test2", value: 1 });
      const doc3 = await TestModel.create({ name: "test3", value: 2 });

      await TestModel.softDeleteMany({ value: 1 });

      const result = await TestModel.restoreMany({ value: 1 });

      expect(result.modifiedCount).toBe(2);

      const all = await TestModel.find({});
      expect(all).toHaveLength(3);
    });

    it("should increment restoreCount on each restore", async () => {
      const doc = await TestModel.create({ name: "test" });

      // First delete and restore
      await TestModel.softDeleteById(doc._id);
      await TestModel.restoreById(doc._id);

      let restored = await TestModel.findById(doc._id).select("+restoreCount");
      expect(restored.restoreCount).toBe(1);

      // Second delete and restore
      await TestModel.softDeleteById(doc._id);
      await TestModel.restoreById(doc._id);

      restored = await TestModel.findById(doc._id).select("+restoreCount");
      expect(restored.restoreCount).toBe(2);
    });
  });

  describe("Validation Hooks", () => {
    it("should prevent direct isDeleted manipulation via updateOne", async () => {
      const doc = await TestModel.create({ name: "test" });

      await expect(
        TestModel.updateOne({ _id: doc._id }, { $set: { isDeleted: true } })
      ).rejects.toThrow(
        "Direct manipulation of isDeleted field is not allowed"
      );
    });

    it("should prevent direct isDeleted manipulation via updateMany", async () => {
      await TestModel.create({ name: "test" });

      await expect(
        TestModel.updateMany({}, { $set: { isDeleted: true } })
      ).rejects.toThrow(
        "Direct manipulation of isDeleted field is not allowed"
      );
    });

    it("should prevent direct isDeleted manipulation via findOneAndUpdate", async () => {
      const doc = await TestModel.create({ name: "test" });

      await expect(
        TestModel.findOneAndUpdate(
          { _id: doc._id },
          { $set: { isDeleted: true } }
        )
      ).rejects.toThrow(
        "Direct manipulation of isDeleted field is not allowed"
      );
    });
  });

  describe("Aggregate Pipeline Filtering", () => {
    it("should filter soft-deleted documents in aggregate", async () => {
      await TestModel.create({ name: "active", value: 10 });
      const deleted = await TestModel.create({ name: "deleted", value: 20 });

      await TestModel.softDeleteById(deleted._id);

      const results = await TestModel.aggregate([
        { $group: { _id: null, total: { $sum: "$value" } } },
      ]);

      expect(results[0].total).toBe(10);
    });

    it("should include soft-deleted documents in aggregate with withDeleted option", async () => {
      await TestModel.create({ name: "active", value: 10 });
      const deleted = await TestModel.create({ name: "deleted", value: 20 });

      await TestModel.softDeleteById(deleted._id);

      const results = await TestModel.aggregate([
        { $group: { _id: null, total: { $sum: "$value" } } },
      ]).option({ withDeleted: true });

      expect(results[0].total).toBe(30);
    });
  });

  describe("Instance Methods", () => {
    it("softDelete instance method should soft delete document", async () => {
      const doc = await TestModel.create({ name: "test" });
      const userId = new mongoose.Types.ObjectId();

      await doc.softDelete(userId);

      const deleted = await TestModel.findById(doc._id)
        .select("+isDeleted +deletedBy")
        .setOptions({ withDeleted: true });

      expect(deleted.isDeleted).toBe(true);
      expect(deleted.deletedBy.toString()).toBe(userId.toString());
    });

    it("restore instance method should restore document", async () => {
      const doc = await TestModel.create({ name: "test" });
      const userId = new mongoose.Types.ObjectId();

      await doc.softDelete(userId);

      // Fetch the deleted document
      const deletedDoc = await TestModel.findById(doc._id)
        .select(
          "+isDeleted +deletedAt +deletedBy +restoredAt +restoredBy +restoreCount"
        )
        .setOptions({ withDeleted: true });

      await deletedDoc.restore(userId);

      const restored = await TestModel.findById(doc._id).select(
        "+isDeleted +restoredBy +restoreCount"
      );

      expect(restored.isDeleted).toBe(false);
      expect(restored.restoredBy.toString()).toBe(userId.toString());
      expect(restored.restoreCount).toBe(1);
    });

    it("should throw error when soft deleting already deleted document", async () => {
      const doc = await TestModel.create({ name: "test" });
      await doc.softDelete();

      // Fetch the deleted document
      const deletedDoc = await TestModel.findById(doc._id)
        .select("+isDeleted")
        .setOptions({ withDeleted: true });

      await expect(deletedDoc.softDelete()).rejects.toThrow(
        "Document is already soft-deleted"
      );
    });

    it("should throw error when restoring non-deleted document", async () => {
      const doc = await TestModel.create({ name: "test" });

      await expect(doc.restore()).rejects.toThrow(
        "Document is not soft-deleted"
      );
    });
  });

  describe("Helper Methods", () => {
    it("findDeletedByIds should return soft-deleted documents", async () => {
      const doc1 = await TestModel.create({ name: "test1" });
      const doc2 = await TestModel.create({ name: "test2" });
      const doc3 = await TestModel.create({ name: "test3" });

      await TestModel.softDeleteById(doc1._id);
      await TestModel.softDeleteById(doc2._id);

      const deleted = await TestModel.findDeletedByIds([
        doc1._id,
        doc2._id,
        doc3._id,
      ]);

      expect(deleted).toHaveLength(2);
      expect(deleted.map((d) => d.name).sort()).toEqual(["test1", "test2"]);
    });

    it("countDeleted should count soft-deleted documents", async () => {
      await TestModel.create({ name: "active" });
      const doc1 = await TestModel.create({ name: "deleted1" });
      const doc2 = await TestModel.create({ name: "deleted2" });

      await TestModel.softDeleteById(doc1._id);
      await TestModel.softDeleteById(doc2._id);

      const count = await TestModel.countDeleted({});
      expect(count).toBe(2);
    });

    it("getRestoreAudit should return audit information", async () => {
      const doc = await TestModel.create({ name: "test" });
      const deletedBy = new mongoose.Types.ObjectId();
      const restoredBy = new mongoose.Types.ObjectId();

      await TestModel.softDeleteById(doc._id, { deletedBy });
      await TestModel.restoreById(doc._id, { restoredBy });

      const audit = await TestModel.getRestoreAudit(doc._id);

      expect(audit.isDeleted).toBe(false);
      expect(audit.restoredBy.toString()).toBe(restoredBy.toString());
      expect(audit.restoreCount).toBe(1);
    });
  });

  describe("Transaction Support", () => {
    // Note: Transactions require replica set which MongoDB Memory Server doesn't support by default
    // These tests verify the API accepts session parameter correctly
    it("should accept session parameter for softDeleteById", async () => {
      const doc = await TestModel.create({ name: "test" });

      // Test that the method accepts session parameter without error
      // (actual transaction behavior requires replica set)
      const result = await TestModel.softDeleteById(doc._id, { session: null });

      expect(result.modifiedCount).toBe(1);

      const deleted = await TestModel.findById(doc._id)
        .select("+isDeleted")
        .setOptions({ withDeleted: true });

      expect(deleted.isDeleted).toBe(true);
    });

    it("should accept session parameter for restoreById", async () => {
      const doc = await TestModel.create({ name: "test" });
      await TestModel.softDeleteById(doc._id);

      // Test that the method accepts session parameter without error
      const result = await TestModel.restoreById(doc._id, { session: null });

      expect(result.modifiedCount).toBe(1);

      const restored = await TestModel.findById(doc._id)
        .select("+isDeleted")
        .setOptions({ withDeleted: true });

      expect(restored.isDeleted).toBe(false);
    });
  });
});
