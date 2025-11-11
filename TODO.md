# micro-mongo Feature Roadmap

This document tracks the features needed to make micro-mongo more compatible with real MongoDB.

## Legend
- 🔴 **HIGH PRIORITY** - Critical for MongoDB compatibility
- 🟡 **MEDIUM PRIORITY** - Important but not critical
- 🟢 **LOW PRIORITY** - Nice to have
- ✅ **COMPLETED**
- 🚧 **IN PROGRESS**
- ⏸️ **NOT APPLICABLE** - For in-memory/browser DB

---

## 1. ObjectId Support ✅ **COMPLETED**

**Current State:** ✅ Uses ObjectId (12-byte identifier with timestamp)  
**MongoDB:** Uses ObjectId (12-byte identifier with timestamp)  
**Impact:** Full MongoDB compatibility for _id fields

### Tasks:
- [x] Create ObjectId class with timestamp, machine ID, process ID, counter
- [x] Implement ObjectId.toString() and ObjectId.toHexString()
- [x] Implement ObjectId.getTimestamp() method
- [x] Support ObjectId equality comparison
- [x] Make _id default to ObjectId instead of UUID
- [x] Support ObjectId in queries and updates
- [x] Add ObjectId constructor from hex string
- [x] Add tests for ObjectId functionality

**Status:** ✅ COMPLETED (November 10, 2025)  
**Test Results:** 29 ObjectId tests passing, all 158 existing tests passing  
**Changes Made:**
- Created `src/ObjectId.js` with full ObjectId implementation
- Updated `DB._id()` to return ObjectId instead of UUID
- Updated `queryMatcher.js` to handle ObjectId comparisons
- Updated `utils.js` to handle ObjectId in deep comparisons
- Added 29 comprehensive tests in `test/test-objectid.js`
- Updated `example-usage.js` to demonstrate ObjectId usage

---

## 2. Promise-Based API ✅ **COMPLETED**

**Current State:** ✅ All operations return Promises  
**MongoDB:** All operations return Promises  
**Impact:** Fully compatible with async/await patterns in real MongoDB driver

### Tasks:
- [x] Make Collection methods async (insertOne, insertMany, find, etc.)
- [x] Update Cursor to support async iteration (`for await...of`)
- [x] Make cursor.toArray() return Promise
- [x] Make cursor.forEach() accept async callback
- [x] Update MongoClient.connect() to be properly async
- [x] Update DB methods to be async where appropriate
- [x] Refactor all tests to use async/await
- [ ] Add async session support for future transaction work
- [x] Update example-usage.js with proper async patterns
- [x] Update README with async examples

**Status:** ✅ COMPLETED (November 10, 2025)  
**Test Results:** All 158 tests passing with async/await patterns  
**Changes Made:**
- Made all Collection CRUD methods async (insertOne, insertMany, findOne, updateOne, updateMany, deleteOne, deleteMany, replaceOne, findOneAndUpdate, findOneAndReplace, findOneAndDelete)
- Made Collection utility methods async (count, distinct, copyTo, createIndex, insert)
- Made Cursor methods async (toArray, forEach)
- Added Symbol.asyncIterator support to Cursor and SortedCursor for `for await...of` loops
- Fixed Cursor._findNext to use storage.size() directly instead of async collection.count()
- Converted all 158 tests to use async/await
- Updated example-usage.js with comprehensive async/await examples
- Updated README.md with async/await usage section and examples
- MongoClient.connect() was already async

**Breaking Change:** Yes - major version bump to 2.0.0 required
**Estimated Effort:** 3-5 days ✅ **ACTUAL: 1 day**

---

## 3. Better Index Support � IN PROGRESS

**Current State:** ✅ Enhanced with range queries, query planning, and index combination  
**MongoDB:** Indexes work with ranges, sorts, and complex queries

### Tasks:
- [x] Support range queries on indexed fields ($gt, $lt, $gte, $lte, $in, $ne, $eq) ✅
- [x] Improve query planner to choose best index ✅
- [x] Implement index intersection for $and queries ✅
- [x] Implement index union for $or queries ✅
- [x] Integrate text indexes into query planner ✅
- [x] Integrate geospatial indexes into query planner ✅
- [x] Add cost-based plan selection ✅
- [ ] Support sorting using indexes (avoid in-memory sort)
- [ ] Add unique index support with constraint enforcement
- [ ] Add sparse index support (skip null/missing values)
- [ ] Add TTL index support (time-to-live, auto-delete old docs)
- [ ] Add index options: background, partialFilterExpression
- [ ] Support compound index prefix matching
- [ ] Add multikey index support (arrays)
- [ ] Add hashed indexes
- [ ] Implement covered queries (return from index only)

**Status:** 🚧 IN PROGRESS (November 10, 2025)  
**Test Results:** All 203 tests passing (180 original + 23 new advanced index tests)  
**Changes Made:**
- Enhanced `src/RegularCollectionIndex.js`:
  - Added `_queryWithOperators()` method for range query support
  - Support for $gt, $gte, $lt, $lte, $eq, $ne, $in operators
  - Range scan implementation that filters index entries
  - Maintains backward compatibility with simple equality queries
- Created `src/QueryPlanner.js`:
  - QueryPlan class to represent execution plans
  - Query analysis to detect simple/and/or/complex query structures
  - Text index integration via `_planTextSearch()`
  - Geospatial index integration via `_planGeoQuery()`
  - Index intersection for $and queries (docs in ALL indexes)
  - Index union for $or queries (docs in ANY index)
  - Cost-based plan selection with estimatedCost
  - Plan types: full_scan, index_scan, index_intersection, index_union
- Updated `src/Collection.js`:
  - Replaced old simple `planQuery()` with QueryPlanner-based implementation
  - Returns detailed plan with type, indexes used, docIds, cost estimate
- Updated `src/Cursor.js`:
  - Works with new query plan structure
  - Maintains backward compatibility
- Added comprehensive test suite in `test/test-advanced-indexes.js`:
  - Range query tests (6 tests)
  - $and query with index intersection (3 tests)
  - $or query with index union (3 tests)
  - Complex mixed operator queries (2 tests)
  - Index selection tests (2 tests)
  - Text and geospatial index integration (2 tests)
  - Performance tests with large datasets (2 tests)
  - Edge case handling (3 tests)

**Estimated Effort:** 5-7 days for full completion  
**Completed So Far:** Query planning, range queries, index combination - 2 days

**Estimated Effort:** 5-7 days  
**Dependencies:** None

---

## 4. Aggregation Pipeline Improvements 🟡 MEDIUM PRIORITY

**Current State:** Basic stages ($match, $project, $group, $sort, $limit, $skip, $count, $unwind)  
**MongoDB:** 40+ aggregation stages with rich expression language

### Core Stages:
- [ ] Add $lookup (left outer join)
- [ ] Add $graphLookup (recursive/graph queries)
- [ ] Add $facet (multi-faceted aggregation)
- [ ] Add $bucket (histogram buckets)
- [ ] Add $bucketAuto (auto histogram)
- [ ] Add $sortByCount (group and count)
- [ ] Add $replaceRoot / $replaceWith (promote embedded doc)
- [ ] Add $merge (output to collection, MongoDB 4.2+)
- [ ] Add $out (replace collection)
- [ ] Add $geoNear (geospatial aggregation)
- [ ] Add $sample (random document sampling)
- [ ] Add $redact (conditional filtering)
- [ ] Add $addFields / $set (add computed fields)
- [ ] Add $unset (remove fields)

### Group Accumulators:
- [ ] Add $stdDevPop and $stdDevSamp
- [ ] Add $mergeObjects (merge objects in group)
- [ ] Improve existing accumulators ($sum, $avg, etc.)

### Expression Operators:
- [ ] String operators: $concat, $substr, $toLower, $toUpper, $trim, $split, $strLenCP
- [ ] Date operators: $dateToString, $year, $month, $dayOfMonth, $hour, $minute, $second
- [ ] Conditional operators: $cond, $ifNull, $switch
- [ ] Array operators: $filter, $map, $reduce, $zip, $arrayElemAt, $slice, $concatArrays
- [ ] Comparison operators: $cmp, $eq, $ne, $gt, $gte, $lt, $lte
- [ ] Arithmetic operators: $add, $subtract, $multiply, $divide, $mod, $pow, $sqrt
- [ ] Type operators: $type, $convert, $toBool, $toDate, $toDecimal, $toInt, $toString
- [ ] Object operators: $objectToArray, $arrayToObject, $mergeObjects

**Estimated Effort:** 10-15 days (staged implementation)  
**Dependencies:** Promise-based API recommended first

---

## 5. Missing Query Operators 🟡 MEDIUM PRIORITY

### Tasks:
- [ ] Add $expr (use aggregation expressions in queries)
- [ ] Add $jsonSchema (JSON Schema validation in queries)
- [ ] Add $comment (attach comments to queries)
- [ ] Add geospatial operators: $near, $nearSphere
- [ ] Add $geoIntersects (geospatial intersection)
- [ ] Add $bitsAllClear, $bitsAllSet, $bitsAnyClear, $bitsAnySet
- [ ] Improve dot notation support in query operators
- [ ] Add $rand (random number for sampling)
- [ ] Better support for querying arrays with embedded documents

**Estimated Effort:** 3-4 days  
**Dependencies:** None

---

## 6. Missing Update Operators 🟡 MEDIUM PRIORITY

### Tasks:
- [ ] Fix $currentDate to support { $type: "timestamp" } and { $type: "date" }
- [ ] Add $pull with query conditions (not just value matching)
- [ ] Add $[] (update all array elements)
- [ ] Add $[<identifier>] (filtered positional operator)
- [ ] Add $.$ (update first matching array element)
- [ ] Properly implement $each, $position, $slice, $sort for $push
- [ ] Add pipeline-based updates (MongoDB 4.2+)
- [ ] Add $setOnInsert proper isolation (only on insert during upsert)
- [ ] Improve $addToSet to check for duplicates properly
- [ ] Add field update validators

**Estimated Effort:** 3-4 days  
**Dependencies:** None

---

## 7. Bulk Operations 🟡 MEDIUM PRIORITY

**Current State:** Not implemented  
**MongoDB:** BulkWrite for efficient batch operations

### Tasks:
- [ ] Implement bulkWrite() method
- [ ] Support insertOne, updateOne, updateMany, replaceOne, deleteOne, deleteMany in bulk
- [ ] Add ordered bulk operations (stop on first error)
- [ ] Add unordered bulk operations (continue on errors)
- [ ] Add Bulk API: initializeOrderedBulkOp()
- [ ] Add Bulk API: initializeUnorderedBulkOp()
- [ ] Return BulkWriteResult with detailed results
- [ ] Add write concern options (API compatibility)
- [ ] Add bulk operation batching
- [ ] Handle bulk errors properly with BulkWriteError

**Estimated Effort:** 2-3 days  
**Dependencies:** Promise-based API, Better error handling

---

## 8. Transactions ⏸️ LOW PRIORITY (Complex)

**Current State:** Not supported  
**MongoDB:** Multi-document ACID transactions  
**Note:** Complex for in-memory DB, may not be realistic

### Tasks:
- [ ] Add Session class
- [ ] Implement startSession()
- [ ] Implement startTransaction(), commitTransaction(), abortTransaction()
- [ ] Add transaction isolation (in-memory snapshot)
- [ ] Add rollback support (keep undo log)
- [ ] Support read/write concerns in transactions
- [ ] Handle transaction errors
- [ ] Add withTransaction() helper

**Estimated Effort:** 7-10 days  
**Dependencies:** Promise-based API  
**Note:** May defer indefinitely for in-memory use case

---

## 9. Change Streams 🟢 LOW PRIORITY

**Current State:** Not supported  
**MongoDB:** Watch for real-time changes

### Tasks:
- [ ] Implement watch() method on Collection
- [ ] Implement watch() method on DB
- [ ] Add EventEmitter for insert/update/delete operations
- [ ] Support change stream events (insert, update, replace, delete, drop, etc.)
- [ ] Add resumeToken support for resuming streams
- [ ] Support fullDocument option (return full doc on update)
- [ ] Add pipeline filtering for change streams
- [ ] Handle change stream errors and reconnection

**Estimated Effort:** 3-4 days  
**Dependencies:** Promise-based API

---

## 10. Schema Validation 🟡 MEDIUM PRIORITY

**Current State:** Not supported  
**MongoDB:** Collection-level schema validation

### Tasks:
- [ ] Add validator option to createCollection()
- [ ] Support JSON Schema validation
- [ ] Add validationLevel option (strict, moderate, off)
- [ ] Add validationAction option (error, warn)
- [ ] Validate on insert
- [ ] Validate on update
- [ ] Add collMod command to update validator
- [ ] Support $jsonSchema operator
- [ ] Add validation error messages
- [ ] Add tests for schema validation

**Estimated Effort:** 2-3 days  
**Dependencies:** None

---

## 11. Collection Methods 🟢 LOW-MEDIUM PRIORITY

### Missing Methods:
- [ ] Implement findAndModify() (wrapper for findOneAndUpdate/Replace/Delete)
- [ ] Implement mapReduce() (legacy, but still supported)
- [ ] Implement group() (legacy aggregation)
- [ ] Implement save() (upsert by _id)
- [ ] Implement renameCollection()
- [ ] Implement stats() (collection statistics)
- [ ] Implement dataSize() (approximate size in bytes)
- [ ] Implement storageSize() (allocated storage)
- [ ] Implement totalSize() (total size including indexes)
- [ ] Implement totalIndexSize() (index size)
- [ ] Implement validate() (collection validation)
- [ ] Implement reIndex() (rebuild all indexes)
- [ ] Implement ensureIndex() (deprecated alias for createIndex)
- [ ] Implement getShardDistribution() (N/A but for API compat)
- [ ] Implement getShardVersion() (N/A but for API compat)

**Estimated Effort:** 2-3 days  
**Dependencies:** Various depending on method

---

## 12. Database Methods 🟢 LOW PRIORITY

### Missing Methods:
- [ ] Implement getCollection(name) - get collection reference
- [ ] Implement getCollectionInfos() - detailed collection metadata
- [ ] Implement getName() - return database name
- [ ] Implement stats() - database statistics
- [ ] Implement runCommand() - execute database commands
- [ ] Implement adminCommand() - admin commands
- [ ] Implement listCollections() - alternative to getCollectionNames
- [ ] Store database name in DB class

**Estimated Effort:** 1-2 days  
**Dependencies:** None

---

## 13. Cursor Improvements 🟡 LOW-MEDIUM PRIORITY

### Missing Methods:
- [ ] Implement cursor.size() - count without iterating
- [ ] Implement cursor.itcount() - count by iterating
- [ ] Implement cursor.explain() - query execution plan
- [ ] Implement cursor.hint() - force index usage
- [ ] Implement cursor.min() - set min index bound
- [ ] Implement cursor.max() - set max index bound
- [ ] Implement cursor.comment() - add query comment
- [ ] Implement cursor.clone() - copy cursor state
- [ ] Implement cursor.close() - close cursor
- [ ] Implement cursor.isClosed() - check if closed

### Enhancements:
- [ ] Add cursor.batchSize() (may be no-op for in-memory)
- [ ] Support cursor.maxTimeMS() for timeout
- [ ] Better async iteration support
- [ ] Cursor state management
- [ ] Lazy evaluation where possible

**Estimated Effort:** 2-3 days  
**Dependencies:** Promise-based API for async methods

---

## 14. Write Concerns & Read Preferences ⏸️ LOW PRIORITY

**Current State:** Not applicable (in-memory, single-node)  
**MongoDB:** Important for distributed systems  
**Note:** Add for API compatibility, may not have functional impact

### Tasks:
- [ ] Add WriteConcern class
- [ ] Add ReadPreference class
- [ ] Support write concern options in operations (w, j, wtimeout)
- [ ] Support read preference options (primary, secondary, etc.)
- [ ] Add to MongoClient, DB, and Collection
- [ ] Document that these are for API compatibility only

**Estimated Effort:** 1 day  
**Dependencies:** None

---

## 15. Better Error Handling 🔴 HIGH PRIORITY

**Current State:** Throws strings or simple objects  
**MongoDB:** Structured error objects with codes

### Tasks:
- [ ] Create MongoError base class
- [ ] Create MongoServerError class
- [ ] Create MongoDriverError class
- [ ] Create WriteError class
- [ ] Create WriteConcernError class
- [ ] Create BulkWriteError class
- [ ] Create MongoNetworkError class (for API compat)
- [ ] Add proper error codes for all conditions
- [ ] Add error code constants/enum
- [ ] Include context in error messages (collection name, operation, etc.)
- [ ] Create error factory functions
- [ ] Update all throw statements to use error classes
- [ ] Add tests for error conditions
- [ ] Document error codes

**Estimated Effort:** 2-3 days  
**Dependencies:** None

---

## 16. Projection Improvements 🟡 MEDIUM PRIORITY

**Current State:** Basic inclusion/exclusion  
**MongoDB:** Computed fields, positional operators, aggregation expressions

### Tasks:
- [ ] Support positional operator $ in projections (first matching array element)
- [ ] Support $elemMatch in projections (project first matching array element)
- [ ] Support $slice in projections (limit array elements returned)
- [ ] Support $meta in projections (for text search scores, sort keys)
- [ ] Support computed fields with aggregation expressions
- [ ] Support nested document projections with dot notation
- [ ] Better handling of _id inclusion/exclusion
- [ ] Add projection validation
- [ ] Optimize projection application

**Estimated Effort:** 2-3 days  
**Dependencies:** Aggregation expression operators

---

## 17. Compatibility & Type Support 🟡 MEDIUM PRIORITY

### Tasks:
- [ ] Improve Date type handling (creation, comparison, storage)
- [ ] Add Decimal128 class (for precise decimal numbers)
- [ ] Add Binary class (for binary data)
- [ ] Add MinKey and MaxKey classes (for range queries)
- [ ] Add Timestamp class (internal replication type)
- [ ] Add Long class (64-bit integers)
- [ ] Add Code class (JavaScript code storage)
- [ ] Add DBRef class (database references)
- [ ] Add Symbol class (deprecated but for compat)
- [ ] Proper null vs undefined handling
- [ ] Add Int32 and Double type wrappers
- [ ] Support MongoDB Extended JSON v2 format
- [ ] Type coercion in queries and updates

**Estimated Effort:** 4-5 days  
**Dependencies:** ObjectId support

---

## 18. Performance & Optimization 🟢 LOW-MEDIUM PRIORITY

### Tasks:
- [ ] Add query result caching (with cache invalidation)
- [ ] Optimize index lookups with B-tree or B+ tree structures
- [ ] Implement covered queries (return data from index only)
- [ ] Memory management for large collections
- [ ] Add pagination helper methods
- [ ] Optimize aggregation pipeline execution
- [ ] Add query execution statistics
- [ ] Lazy evaluation in cursors where possible
- [ ] Optimize document cloning/copying
- [ ] Add benchmarking suite
- [ ] Profile and optimize hot paths

**Estimated Effort:** 5-7 days  
**Dependencies:** Better indexing, profiling tools

---

## 19. Import/Export & Persistence 🟢 LOW PRIORITY

### Tasks:
- [ ] Add exportCollection() - export to JSON
- [ ] Add importCollection() - import from JSON
- [ ] Support MongoDB Extended JSON format
- [ ] Add exportDatabase() - export all collections
- [ ] Add importDatabase() - import all collections
- [ ] Add backup() method (serialize to JSON)
- [ ] Add restore() method (deserialize from JSON)
- [ ] Add localStorage persistence layer improvements
- [ ] Add IndexedDB persistence layer
- [ ] Add compression support for exports
- [ ] Add import/export progress callbacks

**Estimated Effort:** 2-3 days  
**Dependencies:** Extended JSON support

---

## 20. Testing & Documentation 📚 ONGOING

### Testing:
- [ ] Add comprehensive test coverage for all operators
- [ ] Add edge case tests
- [ ] Add performance benchmarks
- [ ] Add stress tests for large collections
- [ ] Add compatibility tests vs real MongoDB
- [ ] Add browser compatibility tests
- [ ] Achieve >90% code coverage

### Documentation:
- [ ] Create detailed API documentation
- [ ] Add JSDoc comments to all public methods
- [ ] Create migration guide from real MongoDB
- [ ] Add usage examples for all features
- [ ] Create tutorial/getting started guide
- [ ] Document differences from real MongoDB
- [ ] Add TypeScript type definitions (.d.ts files)
- [ ] Create playground/interactive examples
- [ ] Document performance characteristics
- [ ] Add troubleshooting guide

**Estimated Effort:** Ongoing  
**Dependencies:** Feature completion

---

## Priority Order for Implementation

### Phase 1: Foundation (Critical for compatibility)
1. **Better Error Handling** (2-3 days) 🔴
2. ~~**ObjectId Support** (1-2 days)~~ ✅ **COMPLETED**
3. ~~**Promise-Based API** (3-5 days)~~ ✅ **COMPLETED**

**Total: ~1.5 weeks** ✅ **COMPLETED**

### Phase 2: Core Features (High value)
4. **Better Index Support** (5-7 days) 🟡
5. **Missing Query Operators** (3-4 days) 🟡
6. **Missing Update Operators** (3-4 days) 🟡
7. **Schema Validation** (2-3 days) 🟡

**Total: ~2.5 weeks**

### Phase 3: Advanced Features
8. **Aggregation Pipeline Improvements** (10-15 days) 🟡
9. **Projection Improvements** (2-3 days) 🟡
10. **Bulk Operations** (2-3 days) 🟡
11. **Compatibility & Type Support** (4-5 days) 🟡

**Total: ~3-4 weeks**

### Phase 4: Polish & Extras
12. **Collection Methods** (2-3 days) 🟢
13. **Database Methods** (1-2 days) 🟢
14. **Cursor Improvements** (2-3 days) 🟢
15. **Change Streams** (3-4 days) 🟢
16. **Import/Export** (2-3 days) 🟢
17. **Performance Optimizations** (5-7 days) 🟢

**Total: ~2-3 weeks**

### Phase 5: Optional/Future
18. **Transactions** (7-10 days) ⏸️
19. **Write Concerns/Read Preferences** (1 day) ⏸️

---

## Quick Wins (Low effort, high impact)

These can be done independently and provide immediate value:

1. **ObjectId support** - 1-2 days, critical for compatibility
2. **Better error handling** - 2-3 days, improves debugging
3. **Schema validation** - 2-3 days, adds safety
4. **Missing update operators** - 3-4 days, commonly needed
5. **Database methods** (getName, stats) - 1 day, easy additions

---

## Breaking Changes to Plan For

These will require a major version bump (2.0.0):

- ~~Promise-based API (all methods become async)~~ ✅ **COMPLETED**
- ~~ObjectId as default _id type~~ ✅ **COMPLETED**
- Proper error classes (no more string throws)
- ~~Async cursor iteration~~ ✅ **COMPLETED**

**Status:** Ready for 2.0.0 release with ObjectId and Promise-based API support. Consider adding proper error classes before releasing.

---

## Notes

- **In-Memory Focus**: Some MongoDB features (replication, sharding, transactions) may not be applicable or practical for an in-memory/browser database
- **Storage Limitations**: Browser localStorage has size limits (~5-10MB), should document this
- **Performance**: For large datasets, consider moving to IndexedDB instead of localStorage
- **Bundle Size**: Adding all features will increase bundle size - consider creating lite/full versions
- **TypeScript**: Strong typing would greatly improve developer experience
- **Testing Strategy**: Each feature should have unit tests before being marked complete

---

## Contributing

If you'd like to contribute to any of these features:

1. Pick an unchecked task from the list
2. Create an issue describing your implementation plan
3. Submit a PR with tests
4. Update this TODO to mark the task complete

---

**Last Updated:** November 10, 2025
