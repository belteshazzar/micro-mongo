# Performance Improvement Opportunities for Micro-Mongo

This document outlines three key areas where performance improvements could be made to enhance execution time and reduce memory usage in the Micro-Mongo database implementation.

## Area 1: Optimize Aggregation Pipeline Execution

### Current Implementation

The aggregation pipeline currently loads all documents into memory before processing and creates deep copies of the entire result set at each stage:

**Location**: `src/server/Collection.js` (lines 459-468, 556-567)

```javascript
// Loads all documents upfront
let results = [];
const cursor = this.find({});
await cursor._ensureInitialized();
while (await cursor.hasNext()) {
  results.push(await cursor.next());
}

// Each stage processes and copies the entire result set
for (let i = 0; i < pipeline.length; i++) {
  const stage = pipeline[i];
  // ... stage processing with extensive use of copy()
}
```

The `copy()` function in `src/utils.js` (lines 32-44) performs recursive deep cloning for every document at each pipeline stage:

```javascript
export function copy(o) {
  if (o instanceof ObjectId) {
    return new ObjectId(o.id);
  }
  var out, v, key;
  out = Array.isArray(o) ? [] : {};
  for (key in o) {
    v = o[key];
    out[key] = (typeof v === "object" && v !== null) ? copy(v) : v;
  }
  return out;
}
```

### Performance Issues

1. **Excessive Memory Copying**: A 5-stage pipeline processing 10,000 documents would create 50,000 document copies (10K × 5 stages), each requiring recursive object traversal. For documents averaging 1KB, this creates 50MB of intermediate allocations.

2. **No Lazy Evaluation**: All documents are loaded into memory before any filtering occurs. A pipeline starting with `$match` filtering 99% of documents still loads 100% into memory first.

3. **Missed Optimization Opportunities**: The code contains a TODO comment (line 464) acknowledging this issue: `// TODO: Optimize by applying $match stages during iteration`

4. **Pipeline Stage Ordering**: Stages are processed in the order specified, even when reordering could dramatically improve performance (e.g., `$match` before `$group` or `$sort`).

### Proposed Improvements

#### 1.1 Implement Lazy Evaluation with Generator/Iterator Pattern

Replace eager array allocation with lazy iterators that yield documents on-demand:

```javascript
// Proposed approach
function* lazyPipeline(cursor, stages) {
  for (const doc of cursor) {
    let current = doc;
    for (const stage of stages) {
      current = applyStage(stage, current);
      if (current === null) break; // $match filtered out
    }
    if (current !== null) yield current;
  }
}
```

**Expected Impact**:
- **Memory**: Reduce from O(n × s) to O(1) for document-level stages, where n = document count, s = stage count
- **Time**: Enable early termination for `$limit` stages without processing all documents
- **Garbage Collection**: Reduce GC pressure by avoiding intermediate array allocations

#### 1.2 Copy-on-Write Document References

Instead of deep copying every document, use immutable references until mutations are needed:

```javascript
// Current: Always copies
results = results.map(doc => applyProjection(copy(doc), projection));

// Proposed: Copy only when necessary
results = results.map(doc => {
  if (needsMutation(projection)) {
    return applyProjection(copyMinimal(doc, projection), projection);
  }
  return doc; // Reuse unchanged documents
});
```

**Expected Impact**:
- **Memory**: 50-80% reduction for read-heavy pipelines (no `$set`, `$addFields`)
- **Time**: 3-5x faster for stages that don't modify documents

#### 1.3 Automatic Pipeline Stage Reordering

Analyze and reorder pipeline stages to execute filters early:

```javascript
function optimizePipeline(stages) {
  // Move $match stages to the front
  const matches = stages.filter(s => s.$match);
  const others = stages.filter(s => !s.$match);
  
  // Move $project (projection-only, no computed fields) early
  const simpleProjections = others.filter(s => s.$project && isSimpleProjection(s.$project));
  const remaining = others.filter(s => !simpleProjections.includes(s));
  
  return [...matches, ...simpleProjections, ...remaining];
}
```

**Expected Impact**:
- **Time**: 10-100x improvement when early `$match` filters 90%+ of documents
- **Memory**: Proportional reduction based on filter selectivity

---

## Area 2: Improve Index Utilization and Query Planning

### Current Implementation

The query planner in `src/server/QueryPlanner.js` (lines 356-365, 437-444) iterates through all indexes linearly and has limited ability to leverage indexes for aggregation pipelines:

**Location**: `src/server/Collection.js` (line 462)

```javascript
// Aggregation always starts with find({}) - a full collection scan
const cursor = this.find({});
```

**Location**: `src/server/QueryPlanner.js` (lines 350-368)

```javascript
async _executeIndexScan(scan) {
  // Linear search through all indexes
  const index = this.indexes.get(scan.indexName);
  if (!index) return [];
  
  // ... execute scan
  const docIds = await index.query(query);
  return docIds !== null ? docIds : [];
}
```

### Performance Issues

1. **Index Lookup Overhead**: With n indexes, finding applicable indexes is O(n) for each query component. For complex queries with multiple fields, this multiplies.

2. **Aggregation Pipeline Ignores Indexes**: The aggregation pipeline always loads all documents (line 462) even when the first stage is `$match` with indexed fields. Example:
   ```javascript
   // This does a full scan despite having an index on 'age'
   db.users.aggregate([
     { $match: { age: 30 } }
   ])
   ```

3. **No Index Statistics**: The planner lacks cardinality estimates, preventing it from choosing between multiple applicable indexes.

4. **Grouping Key Serialization**: `$group` uses `JSON.stringify()` for keys (line 592):
   ```javascript
   const keyStr = JSON.stringify(key);
   groups[keyStr] = { ... };
   ```
   This adds serialization overhead for every document.

### Proposed Improvements

#### 2.1 Index Metadata Cache with Hash-Based Lookup

Create an index registry with O(1) lookup by field name:

```javascript
class IndexRegistry {
  constructor() {
    this.byField = new Map(); // field -> Set<Index>
    this.byPattern = new Map(); // pattern hash -> Index
  }
  
  addIndex(index) {
    for (const field of index.fields) {
      if (!this.byField.has(field)) {
        this.byField.set(field, new Set());
      }
      this.byField.get(field).add(index);
    }
  }
  
  findIndexesForField(field) {
    return this.byField.get(field) || new Set();
  }
}
```

**Expected Impact**:
- **Time**: Reduce index lookup from O(n) to O(1)
- **Scalability**: Performance remains constant as index count grows

#### 2.2 Aggregation Pipeline Index Integration

Detect and optimize `$match` stages at the beginning of aggregation pipelines:

```javascript
async aggregate(pipeline) {
  // Detect leading $match stages that can use indexes
  const leadingMatches = [];
  for (const stage of pipeline) {
    if (stage.$match) {
      leadingMatches.push(stage.$match);
    } else {
      break; // Stop at first non-$match
    }
  }
  
  // Combine $match filters and query with indexes
  let cursor;
  if (leadingMatches.length > 0) {
    const combinedQuery = { $and: leadingMatches };
    cursor = this.find(combinedQuery); // Uses indexes!
  } else {
    cursor = this.find({});
  }
  
  // Process remaining stages...
}
```

**Expected Impact**:
- **Time**: For queries with high selectivity (e.g., filtering 99% of docs), improvement from O(n) to O(log n) or O(k) where k = result count
- **Memory**: Only matching documents loaded into memory
- **Example**: A collection with 1M documents and an indexed `$match` filtering to 100 results would process 100 documents instead of 1M (10,000x improvement)

#### 2.3 Replace JSON.stringify with Native Map for Grouping

Use JavaScript Map with composite key objects for `$group` operations:

```javascript
// Current approach (slow)
const keyStr = JSON.stringify(key);
groups[keyStr] = { _id: key, docs: [] };

// Proposed approach using Map
class CompositeKey {
  constructor(values) {
    this.values = values;
    this._hash = this._computeHash();
  }
  
  _computeHash() {
    // Fast hash for primitive values
    return this.values.map(v => typeof v + ':' + v).join('|');
  }
}

const groups = new Map();
const compositeKey = new CompositeKey([field1, field2, field3]);
const hash = compositeKey._hash;

if (!groups.has(hash)) {
  groups.set(hash, { _id: key, docs: [] });
}
```

**Expected Impact**:
- **Time**: 2-3x faster grouping operations by avoiding JSON serialization
- **Memory**: Reduced string allocation overhead
- **Scalability**: Better performance with complex nested group keys

---

## Area 3: Optimize Worker Communication Serialization

### Current Implementation

The WorkerBridge in `src/client/WorkerBridge.js` (lines 8-73) serializes and deserializes every payload for communication between the main thread and worker:

**Location**: `src/client/WorkerBridge.js` (lines 8-46, 51-73)

```javascript
function serializePayload(obj) {
  // Recursively processes entire object tree
  if (Array.isArray(obj)) {
    return obj.map(serializePayload);
  }
  if (typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializePayload(value);
    }
    return result;
  }
  return obj;
}

function deserializePayload(obj) {
  // Mirrors serialization - another full tree traversal
  if (Array.isArray(obj)) {
    return obj.map(deserializePayload);
  }
  if (typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = deserializePayload(value);
    }
    return result;
  }
  return obj;
}
```

**Location**: `src/client/WorkerBridge.js` (lines 121-125)

```javascript
sendRequest(payload, opts = {}) {
  const serializeTimer = globalTimer.start('ipc', 'serialize');
  const id = this._nextId++;
  const serializedPayload = serializePayload(payload);
  globalTimer.end(serializeTimer);
  // ... send to worker
}
```

### Performance Issues

1. **Recursive Traversal Overhead**: Every request/response requires complete recursive traversal of the object tree. For a query returning 1,000 documents with 20 fields each, this means 20,000+ recursive function calls in each direction (serialize + deserialize).

2. **Redundant Object Creation**: Each traversal creates new objects/arrays even when most data (like queries or small results) could be passed directly via structured cloning.

3. **No Batching**: Each operation sends individual messages. Bulk operations like `insertMany([1000 docs])` serialize 1,000 documents individually rather than as a batch.

4. **Special Type Detection**: ObjectId detection (lines 15-30) uses multiple checks (`toString()`, `instanceof`, regex) for every object, adding overhead.

### Proposed Improvements

#### 3.1 Structured Clone API with Selective Serialization

Modern browsers and Node.js support `structuredClone()` which is faster than manual recursion:

```javascript
function serializePayload(obj) {
  // Fast path: if no special types, use structured clone
  if (!hasSpecialTypes(obj)) {
    return obj; // postMessage handles it natively
  }
  
  // Slow path: only traverse objects with ObjectId/Date
  return traverseSpecialTypes(obj);
}

function hasSpecialTypes(obj, depth = 0, maxDepth = 3) {
  // Quick check at shallow depth
  if (depth > maxDepth) return false;
  
  if (obj instanceof ObjectId || obj instanceof Date) return true;
  if (Array.isArray(obj)) {
    return obj.some(item => hasSpecialTypes(item, depth + 1, maxDepth));
  }
  if (typeof obj === 'object' && obj !== null) {
    return Object.values(obj).some(val => hasSpecialTypes(val, depth + 1, maxDepth));
  }
  return false;
}
```

**Expected Impact**:
- **Time**: 5-10x faster for plain objects (queries, simple results) using native structured clone
- **CPU**: Reduced JavaScript execution time in main thread
- **Scalability**: Performance improvement scales with data size

#### 3.2 Request/Response Batching

Combine multiple operations into single messages:

```javascript
class BatchedBridge extends WorkerBridge {
  constructor(worker, options = {}) {
    super(worker);
    this.batchWindow = options.batchWindow || 0; // microseconds
    this.pendingBatch = [];
    this.batchTimer = null;
  }
  
  sendRequest(payload, opts = {}) {
    if (opts.immediate || this.batchWindow === 0) {
      return super.sendRequest(payload, opts);
    }
    
    return new Promise((resolve, reject) => {
      this.pendingBatch.push({ payload, resolve, reject });
      
      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => {
          this._flushBatch();
        }, this.batchWindow);
      }
    });
  }
  
  _flushBatch() {
    if (this.pendingBatch.length === 0) return;
    
    const batch = this.pendingBatch;
    this.pendingBatch = [];
    this.batchTimer = null;
    
    // Send as single message
    const batchId = this._nextId++;
    const message = {
      type: 'batch',
      id: batchId,
      requests: batch.map(b => ({ payload: serializePayload(b.payload) }))
    };
    
    this._postMessage(message);
    // Handle batch response...
  }
}
```

**Expected Impact**:
- **Throughput**: 3-5x improvement for bulk operations (insertMany, updateMany)
- **Latency**: Reduced IPC overhead by combining messages
- **Use Case**: Most beneficial for operations that aren't latency-sensitive

#### 3.3 Lazy ObjectId Detection with Type Caching

Cache type information to avoid repeated checks:

```javascript
const TYPE_CACHE = new WeakMap();

function getObjectType(obj) {
  if (TYPE_CACHE.has(obj)) {
    return TYPE_CACHE.get(obj);
  }
  
  let type = 'plain';
  if (obj instanceof ObjectId) {
    type = 'objectid';
  } else if (obj instanceof Date) {
    type = 'date';
  }
  
  TYPE_CACHE.set(obj, type);
  return type;
}

function serializePayload(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const type = getObjectType(obj);
  switch (type) {
    case 'objectid':
      return { __objectId: obj.toString() };
    case 'date':
      return { __date: obj.toISOString() };
    default:
      // Handle arrays and plain objects
      if (Array.isArray(obj)) {
        return obj.map(serializePayload);
      }
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = serializePayload(value);
      }
      return result;
  }
}
```

**Expected Impact**:
- **Time**: 20-30% faster serialization by caching type checks
- **CPU**: Reduced instanceof and regex checks
- **Memory**: Negligible overhead from WeakMap (automatically GC'd)

---

## Summary and Prioritization

### Quick Wins (High Impact, Low Complexity)
1. **Pipeline Stage Reordering** (Area 1.3): Automatically move `$match` stages early
2. **Aggregation Index Integration** (Area 2.2): Use indexes for leading `$match` in aggregations
3. **Structured Clone Fast Path** (Area 3.1): Use native cloning when no special types present

### Medium-Term Improvements (High Impact, Medium Complexity)
1. **Copy-on-Write Documents** (Area 1.2): Reduce unnecessary deep copies
2. **Index Registry** (Area 2.1): O(1) index lookup by field
3. **Replace JSON.stringify for Grouping** (Area 2.3): Use Map with composite keys

### Long-Term Refactoring (Highest Impact, High Complexity)
1. **Lazy Pipeline Evaluation** (Area 1.1): Generator-based streaming pipeline
2. **Request Batching** (Area 3.2): Combine multiple operations into single messages

### Expected Overall Impact

Implementing all proposed improvements could yield:
- **Aggregation Performance**: 10-100x improvement for filter-heavy pipelines with indexes
- **Memory Usage**: 50-80% reduction for read-heavy aggregation operations
- **Query Performance**: 3-10x improvement when using appropriate indexes
- **IPC Performance**: 5-10x faster communication for plain object transfers
- **Throughput**: 3-5x improvement for bulk operations with batching

These improvements align with modern database optimization techniques including lazy evaluation, index-aware query optimization, copy-on-write semantics, and efficient inter-process communication patterns.
