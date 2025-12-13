// backend/tests/property/softDelete.property.test.js
/**
 * Property-Based Tests for Soft Delete Plugin
 * Uses fast-check to verify correctness properties across many random inputs
 *
 * **Feature: production-readiness-validation, Property 1: Soft Delete Plugin Prevents Hard Deletes**
 * **Feature: production-readiness-validation, Property 2: Soft Delete Query Filtering**
 * **Feature: production-readiness-validation, Property 3: Soft Delete State Transitions**
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import mongoose from "mongoose";
import fc from "fast-check";
import softDeletePlugin from "../../models/plugins/softDelete.js";

// Test schema with soft delete plugin - use unique name to avoid conflicts
const PropertyTestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: Number, default: 0 },
  category: { type: String, default: "default" },
});

PropertyTestSchema.plugin(softDeletePlugin);

// Create model only if it doesn't exist
let PropertyTestModel;
try {
  PropertyTestModel = mongoose.model("PropertyTestModel");
} catch {
  PropertyTestModel = mongoose.model("PropertyTestModel", PropertyTestSchema);
}

// Arbitrary for generating valid document data
const documentArb = fc.record({
  name: fc
    .string({ minLength: 1, maxLength: 50 })
    .filter((s) => s.trim().length > 0),
  value: fc.integer({ min: 0, max: 1000000 }),
  category: fc.constantFrom("A", "B", "C", "D"),
});

// Arbitrary for generating arrays of documents
const documentsArb = fc.array(documentArb, { minLength: 1, maxLength: 10 });

describe("Soft Delete Plugin - Property-Based Tests", () => {
  beforeEach(async () => {
    // Clean up using collection method that bypasses hooks
    if (mongoose.connection.readyState === 1) {
      try {
        await PropertyTestModel.collection.deleteMany({});
      } catch (e) {
        // Collection might not exist yet
      }
    }
  });

  afterEach(async () => {
    // Clean up after each test
    if (mongoose.connection.readyState === 1) {
      try {
        await PropertyTestModel.collection.deleteMany({});
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  describe("Property 1: Hard Delete Prevention", () => {
    /**
     * **Feature: production-readiness-validation, Property 1: Soft Delete Plugin Prevents Hard Deletes**
     * For any model using the soft delete plugin, calling native delete methods
     * SHALL throw an error, and the document SHALL remain in the database
     */
    it("Property 1: deleteOne should always throw and preserve document", async () => {
      await fc.assert(
        fc.asyncProperty(documentArb, async (docData) => {
          // Create document
          const doc = await PropertyTestModel.create(docData);
          const docId = doc._id;

          // Attempt hard delete - should throw
          let threwError = false;
          try {
            await PropertyTestModel.deleteOne({ _id: docId });
          } catch (error) {
            threwError = true;
            expect(error.message).toContain("Hard delete is disabled");
          }

          // Verify error was thrown
          expect(threwError).toBe(true);

          // Verify document still exists
          const exists = await PropertyTestModel.findById(docId).setOptions({
            withDeleted: true,
          });
          expect(exists).not.toBeNull();
          expect(exists.name).toBe(docData.name);

          // Cleanup
          await PropertyTestModel.collection.deleteOne({ _id: docId });
        }),
        { numRuns: 100 }
      );
    });

    it("Property 1: deleteMany should always throw and preserve all documents", async () => {
      await fc.assert(
        fc.asyncProperty(documentsArb, async (docsData) => {
          // Create documents
          const docs = await PropertyTestModel.insertMany(docsData);
          const docIds = docs.map((d) => d._id);

          // Attempt hard delete - should throw
          let threwError = false;
          try {
            await PropertyTestModel.deleteMany({ _id: { $in: docIds } });
          } catch (error) {
            threwError = true;
            expect(error.message).toContain("Hard delete is disabled");
          }

          // Verify error was thrown
          expect(threwError).toBe(true);

          // Verify all documents still exist
          const count = await PropertyTestModel.countDocuments({
            _id: { $in: docIds },
          }).setOptions({ withDeleted: true });
          expect(count).toBe(docsData.length);

          // Cleanup
          await PropertyTestModel.collection.deleteMany({
            _id: { $in: docIds },
          });
        }),
        { numRuns: 50 }
      );
    });
  });

  describe("Property 2: Query Filtering", () => {
    /**
     * **Feature: production-readiness-validation, Property 2: Soft Delete Query Filtering**
     * For any find query without withDeleted(), the result SHALL NOT include
     * documents where isDeleted is true
     */
    it("Property 2: soft-deleted documents should never appear in normal queries", async () => {
      await fc.assert(
        fc.asyncProperty(
          documentsArb,
          fc.integer({ min: 0, max: 9 }),
          async (docsData, deleteIndex) => {
            // Create documents
            const docs = await PropertyTestModel.insertMany(docsData);
            const docIds = docs.map((d) => d._id);

            // Soft delete one document (use modulo to ensure valid index)
            const indexToDelete = deleteIndex % docsData.length;
            const deletedDocId = docIds[indexToDelete];
            await PropertyTestModel.softDeleteById(deletedDocId);

            // Normal find should not include deleted document
            const results = await PropertyTestModel.find({
              _id: { $in: docIds },
            });

            // Verify deleted document is not in results
            const resultIds = results.map((r) => r._id.toString());
            expect(resultIds).not.toContain(deletedDocId.toString());

            // Verify count is correct
            expect(results.length).toBe(docsData.length - 1);

            // Cleanup
            await PropertyTestModel.collection.deleteMany({
              _id: { $in: docIds },
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it("Property 2: withDeleted() should include all documents regardless of isDeleted", async () => {
      await fc.assert(
        fc.asyncProperty(
          documentsArb,
          fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
          async (docsData, deleteFlags) => {
            // Create documents
            const docs = await PropertyTestModel.insertMany(docsData);
            const docIds = docs.map((d) => d._id);

            // Soft delete some documents based on flags
            for (
              let i = 0;
              i < Math.min(docsData.length, deleteFlags.length);
              i++
            ) {
              if (deleteFlags[i]) {
                await PropertyTestModel.softDeleteById(docIds[i]);
              }
            }

            // withDeleted() should return all documents
            const results = await PropertyTestModel.find({
              _id: { $in: docIds },
            }).withDeleted();

            expect(results.length).toBe(docsData.length);

            // Cleanup
            await PropertyTestModel.collection.deleteMany({
              _id: { $in: docIds },
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it("Property 2: onlyDeleted() should return only soft-deleted documents", async () => {
      await fc.assert(
        fc.asyncProperty(
          documentsArb,
          fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
          async (docsData, deleteFlags) => {
            // Create documents
            const docs = await PropertyTestModel.insertMany(docsData);
            const docIds = docs.map((d) => d._id);

            // Soft delete some documents based on flags
            const deletedIds = [];
            for (
              let i = 0;
              i < Math.min(docsData.length, deleteFlags.length);
              i++
            ) {
              if (deleteFlags[i]) {
                await PropertyTestModel.softDeleteById(docIds[i]);
                deletedIds.push(docIds[i].toString());
              }
            }

            // onlyDeleted() should return only deleted documents
            const results = await PropertyTestModel.find({
              _id: { $in: docIds },
            }).onlyDeleted();

            expect(results.length).toBe(deletedIds.length);

            // All results should be in deletedIds
            for (const result of results) {
              expect(deletedIds).toContain(result._id.toString());
            }

            // Cleanup
            await PropertyTestModel.collection.deleteMany({
              _id: { $in: docIds },
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe("Property 3: State Transitions", () => {
    /**
     * **Feature: production-readiness-validation, Property 3: Soft Delete State Transitions**
     * softDeleteById SHALL set isDeleted=true and deletedAt to timestamp
     * restoreById SHALL set isDeleted=false and clear deletedAt
     */
    it("Property 3: softDeleteById should always set correct state", async () => {
      await fc.assert(
        fc.asyncProperty(documentArb, async (docData) => {
          // Create document
          const doc = await PropertyTestModel.create(docData);
          const docId = doc._id;
          const userId = new mongoose.Types.ObjectId();

          const beforeDelete = new Date();
          await PropertyTestModel.softDeleteById(docId, { deletedBy: userId });
          const afterDelete = new Date();

          // Verify state
          const deleted = await PropertyTestModel.findById(docId)
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

          // Cleanup
          await PropertyTestModel.collection.deleteOne({ _id: docId });
        }),
        { numRuns: 100 }
      );
    });

    it("Property 3: restoreById should always clear soft-delete state", async () => {
      await fc.assert(
        fc.asyncProperty(documentArb, async (docData) => {
          // Create and soft delete document
          const doc = await PropertyTestModel.create(docData);
          const docId = doc._id;
          const deletedBy = new mongoose.Types.ObjectId();
          const restoredBy = new mongoose.Types.ObjectId();

          await PropertyTestModel.softDeleteById(docId, { deletedBy });

          const beforeRestore = new Date();
          await PropertyTestModel.restoreById(docId, { restoredBy });
          const afterRestore = new Date();

          // Verify state
          const restored = await PropertyTestModel.findById(docId)
            .select(
              "+isDeleted +deletedAt +deletedBy +restoredAt +restoredBy +restoreCount"
            )
            .setOptions({ withDeleted: true });

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

          // Cleanup
          await PropertyTestModel.collection.deleteOne({ _id: docId });
        }),
        { numRuns: 100 }
      );
    });

    it("Property 3: delete-restore cycle should be idempotent for isDeleted state", async () => {
      await fc.assert(
        fc.asyncProperty(
          documentArb,
          fc.integer({ min: 1, max: 5 }),
          async (docData, cycles) => {
            // Create document
            const doc = await PropertyTestModel.create(docData);
            const docId = doc._id;

            // Perform multiple delete-restore cycles
            for (let i = 0; i < cycles; i++) {
              await PropertyTestModel.softDeleteById(docId);

              // Verify deleted state
              let current = await PropertyTestModel.findById(docId)
                .select("+isDeleted")
                .setOptions({ withDeleted: true });
              expect(current.isDeleted).toBe(true);

              await PropertyTestModel.restoreById(docId);

              // Verify restored state
              current = await PropertyTestModel.findById(docId)
                .select("+isDeleted +restoreCount")
                .setOptions({ withDeleted: true });
              expect(current.isDeleted).toBe(false);
              expect(current.restoreCount).toBe(i + 1);
            }

            // Cleanup
            await PropertyTestModel.collection.deleteOne({ _id: docId });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe("Validation Hooks", () => {
    it("Property: direct isDeleted manipulation should always be blocked", async () => {
      await fc.assert(
        fc.asyncProperty(
          documentArb,
          fc.boolean(),
          async (docData, newValue) => {
            // Create document
            const doc = await PropertyTestModel.create(docData);
            const docId = doc._id;

            // Attempt direct manipulation - should throw
            let threwError = false;
            try {
              await PropertyTestModel.updateOne(
                { _id: docId },
                { $set: { isDeleted: newValue } }
              );
            } catch (error) {
              threwError = true;
              expect(error.message).toContain(
                "Direct manipulation of isDeleted field is not allowed"
              );
            }

            expect(threwError).toBe(true);

            // Verify state unchanged
            const unchanged = await PropertyTestModel.findById(docId)
              .select("+isDeleted")
              .setOptions({ withDeleted: true });
            expect(unchanged.isDeleted).toBe(false);

            // Cleanup
            await PropertyTestModel.collection.deleteOne({ _id: docId });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe("Aggregate Pipeline", () => {
    it("Property 2: aggregate should filter soft-deleted documents by default", async () => {
      await fc.assert(
        fc.asyncProperty(
          documentsArb,
          fc.integer({ min: 0, max: 9 }),
          async (docsData, deleteIndex) => {
            // Create documents
            const docs = await PropertyTestModel.insertMany(docsData);
            const docIds = docs.map((d) => d._id);

            // Soft delete one document
            const indexToDelete = deleteIndex % docsData.length;
            await PropertyTestModel.softDeleteById(docIds[indexToDelete]);

            // Aggregate should not include deleted document
            const results = await PropertyTestModel.aggregate([
              { $match: { _id: { $in: docIds } } },
              { $count: "total" },
            ]);

            const expectedCount = docsData.length - 1;
            if (expectedCount > 0) {
              expect(results[0].total).toBe(expectedCount);
            } else {
              expect(results).toHaveLength(0);
            }

            // Cleanup
            await PropertyTestModel.collection.deleteMany({
              _id: { $in: docIds },
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
