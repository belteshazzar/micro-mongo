# Changes: Synchronous find() API

## Summary

The `Collection.find()` method has been changed from async (returning `Promise<Cursor>`) to synchronous (returning `Cursor` directly), aligning with the MongoDB driver API.

## What Changed

### Before
```javascript
const cursor = await collection.find({});  // Returns Promise<Cursor>
while (cursor.hasNext()) {
  console.log(cursor.next());
}
```

### After
```javascript
// Option 1: Use toArray() (simplest)
const docs = await collection.find({}).toArray();

// Option 2: Async iteration
for await (const doc of collection.find({})) {
  console.log(doc);
}

// Option 3: Manual initialization + sync iteration
const cursor = collection.find({});
await cursor._ensureDocuments();
while (cursor.hasNext()) {
  console.log(cursor.next());
}
```

## Implementation Details

1. **Collection.find()** now returns a `Cursor` synchronously
2. The Cursor holds a promise (`_documentsPromise`) that resolves to documents
3. Async cursor methods (`toArray()`, `forEach()`, `map()`, `count()`) automatically call `await this._ensureDocuments()`
4. Sync cursor methods (`hasNext()`, `next()`) require documents to be loaded first (throw error otherwise)
5. All internal Collection methods have been updated

## What's Complete

✅ Collection.find() returns Cursor synchronously  
✅ Cursor lazy-loads documents via `_ensureDocuments()`  
✅ toArray(), forEach(), map(), count() are async  
✅ hasNext(), next() are sync (require initialization)  
✅ SortedCursor updated similarly  
✅ All internal Collection methods updated:
  - findOne
  - findOneAndDelete
  - findOneAndReplace  
  - findOneAndUpdate
  - aggregate
  - copyTo
  - deleteMany
  - distinct
  - remove
  - update
  - updateOne
  - updateMany

## What Remains

❌ Update all test files to use new API pattern
❌ Remove double-await: `await (await find()).toArray()` → `await find().toArray()`
❌ Run full test suite to verify

## Test Updates Needed

All tests currently use the old pattern and need updating:

### Pattern 1: Simple toArray()
```javascript
// Old
const results = await (await db.collection.find({ age: { $gt: 30 } })).toArray();

// New
const results = await db.collection.find({ age: { $gt: 30 } }).toArray();
```

### Pattern 2: Cursor + count
```javascript
// Old
const cursor = await collection.find({});
const count = cursor.count();

// New  
const cursor = collection.find({});
const count = await cursor.count();
```

### Pattern 3: Cursor iteration
```javascript
// Old
const cursor = await collection.find({});
while (cursor.hasNext()) {
  console.log(cursor.next());
}

// New (Option A - initialize first)
const cursor = collection.find({});
await cursor._ensureDocuments();
while (cursor.hasNext()) {
  console.log(cursor.next());
}

// New (Option B - use async iteration)
for await (const doc of collection.find({})) {
  console.log(doc);
}
```

## Files Requiring Test Updates

- test/test.js
- test/test-advanced-indexes.js
- test/test-aggregation-stages.js  
- test/test-change-streams.js
- test/test-cursor-methods.js
- test/test-dot-notation.js
- test/test-geospatial-collection-index.js
- test/test-positional-operator.js
- test/test-queryoperators.js
- test/test-arrayfilters.js

## MongoDB API Compliance

This change aligns with the real MongoDB Node.js driver where:
- `collection.find()` returns a cursor synchronously
- Cursor methods like `toArray()` are async
- Cursor iteration can be done with `for await...of`
- Sync iteration is possible after initialization

## Breaking Changes

⚠️ **This is a breaking change**

Code using `await collection.find()` will no longer work as expected. Update to:
- `await collection.find().toArray()` for arrays
- `for await (const doc of collection.find()) {}` for iteration
- Manual `await cursor._ensureDocuments()` for sync iteration
