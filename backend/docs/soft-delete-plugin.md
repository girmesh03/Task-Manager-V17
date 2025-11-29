# Soft Delete Plugin Documentation

## Overview

The soft delete plugin provides universal soft delete functionality for all Mongoose models in the Task Manager application. Instead of permanently deleting documents, it marks them as deleted while preserving the data for potential recovery.

## Features

### Core Functionality

1. **Hard Delete Prevention**: All native delete methods (deleteOne, deleteMany, findOneAndDelete, remove) are blocked and throw errors
2. **Query Filtering**: Soft-deleted documents are automatically excluded from queries unless explicitly requested
3. **Restore Functionality**: Soft-deleted documents can be restored with full audit trail
4. **TTL Auto-Cleanup**: Configurable TTL indexes for automatic permanent deletion after expiry period

### Schema Fields Added

```javascript
{
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null, index: true },
  deletedBy: { type: ObjectId, ref: 'User', default: null, index: true },
  restoredAt: { type: Date, default: null },
  restoredBy: { type: ObjectId, ref: 'User', default: null },
  restoreCount: { type: Number, default: 0 }
}
```

## API Reference

### Static Methods

#### `softDeleteById(id, options)`

Soft delete a document by ID.

```javascript
await Model.softDeleteById(documentId, {
  session: mongooseSession, // Optional: for transactions
  deletedBy: userId, // Optional: track who deleted
});
```

#### `softDeleteMany(filter, options)`

Soft delete multiple documents matching a filter.

```javascript
await Model.softDeleteMany({ status: "inactive" }, { deletedBy: userId });
```

#### `restoreById(id, options)`

Restore a soft-deleted document by ID.

```javascript
await Model.restoreById(documentId, {
  session: mongooseSession, // Optional: for transactions
  restoredBy: userId, // Optional: track who restored
});
```

#### `restoreMany(filter, options)`

Restore multiple soft-deleted documents matching a filter.

```javascript
await Model.restoreMany({ category: "archived" }, { restoredBy: userId });
```

#### `findDeletedByIds(ids, options)`

Find soft-deleted documents by their IDs.

```javascript
const deletedDocs = await Model.findDeletedByIds([id1, id2, id3]);
```

#### `countDeleted(filter, options)`

Count soft-deleted documents matching a filter.

```javascript
const count = await Model.countDeleted({ organization: orgId });
```

#### `getRestoreAudit(id, options)`

Get restore audit information for a document.

```javascript
const audit = await Model.getRestoreAudit(documentId);
// Returns: { id, isDeleted, deletedAt, deletedBy, restoredAt, restoredBy, restoreCount }
```

#### `ensureTTLIndex(expireAfterSeconds)`

Create TTL index for automatic cleanup of soft-deleted documents.

```javascript
await Model.ensureTTLIndex(90 * 24 * 60 * 60); // 90 days
```

### Instance Methods

#### `softDelete(deletedBy, options)`

Soft delete the current document instance.

```javascript
const doc = await Model.findById(id);
await doc.softDelete(userId);
```

#### `restore(restoredBy, options)`

Restore the current soft-deleted document instance.

```javascript
const doc = await Model.findById(id).withDeleted();
await doc.restore(userId);
```

### Query Helpers

#### `withDeleted()`

Include soft-deleted documents in query results.

```javascript
const allDocs = await Model.find({}).withDeleted();
```

#### `onlyDeleted()`

Return only soft-deleted documents.

```javascript
const deletedDocs = await Model.find({}).onlyDeleted();
```

## TTL Configuration

Each model has a specific TTL expiry period defined in `utils/constants.js`:

| Model             | TTL Period | Notes                                            |
| ----------------- | ---------- | ------------------------------------------------ |
| Materials         | 90 days    |                                                  |
| Vendors           | 90 days    |                                                  |
| Tasks (all types) | 180 days   | BaseTask, ProjectTask, AssignedTask, RoutineTask |
| Users             | 365 days   |                                                  |
| Departments       | 365 days   |                                                  |
| Organizations     | Never      | Organizations are never auto-deleted             |
| Attachments       | 30 days    |                                                  |
| Comments          | 180 days   | TaskComment                                      |
| Activities        | 90 days    | TaskActivity                                     |
| Notifications     | 30 days    |                                                  |

## Validation Hooks

The plugin prevents direct manipulation of the `isDeleted` field:

```javascript
// This will throw an error:
await Model.updateOne({ _id: id }, { $set: { isDeleted: true } });

// Use the proper methods instead:
await Model.softDeleteById(id);
```

## Transaction Support

All soft delete operations support MongoDB transactions:

```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
  await Model.softDeleteById(id, { session, deletedBy: userId });
  await RelatedModel.softDeleteMany({ parentId: id }, { session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

## Aggregate Pipeline Support

The plugin automatically filters soft-deleted documents in aggregate pipelines:

```javascript
// Automatically excludes soft-deleted documents
const results = await Model.aggregate([
  { $match: { status: "active" } },
  { $group: { _id: "$category", count: { $sum: 1 } } },
]);

// Include soft-deleted documents
const allResults = await Model.aggregate([
  { $match: { status: "active" } },
]).option({ withDeleted: true });
```

## Requirements Validated

This implementation validates the following requirements:

- **201**: Verify soft delete prevents hard deletes completely
- **202**: Check withDeleted() and onlyDeleted() query helpers work
- **203**: Validate aggregate pipeline filtering for isDeleted
- **204**: Confirm deletedBy tracks user who deleted
- **205**: Check restore functionality clears all soft-delete fields
- **206**: Validate TTL index creation for auto-cleanup
- **207**: Test cascade soft-delete across ALL relationships
- **208**: Ensure softDeleteMany works with filters
- **209**: Add validation hooks to prevent isDeleted manipulation outside methods
- **210**: Implement audit trail for restore operations
- **211**: Add bulk restore method (restoreMany)
- **212**: Test transaction support for all soft-delete operations

## Correctness Properties Tested

1. **Property 1**: Soft Delete Plugin Prevents Hard Deletes
2. **Property 2**: Soft Delete Query Filtering
3. **Property 3**: Soft Delete State Transitions
