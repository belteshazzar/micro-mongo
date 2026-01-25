# Performance Profiling Guide

This guide explains how to profile and analyze the performance of babymongo operations.

## Table of Contents

1. [Overview](#overview)
2. [Basic Timing with PerformanceTimer](#basic-timing-with-performancetimer)
3. [Detailed Profiling with NodeProfiler](#detailed-profiling-with-nodeprofiler)
4. [Using the Comparison Harness](#using-the-comparison-harness)
5. [Analyzing Results](#analyzing-results)
6. [Common Performance Patterns](#common-performance-patterns)

## Overview

BabyMongo provides three levels of performance analysis:

1. **PerformanceTimer**: Lightweight timing of internal operations (Collection methods, IPC, etc.)
2. **NodeProfiler**: Comprehensive Node.js profiling with memory tracking and async operation monitoring
3. **Comparison Harness**: Compare babymongo performance against real MongoDB

## Basic Timing with PerformanceTimer

### Enabling Global Timing

```javascript
import { globalTimer } from 'babymongo';

// Enable timing collection
globalTimer.setEnabled(true);

// Your operations...
await collection.find({ name: 'John' }).toArray();
await collection.insertOne({ name: 'Jane', age: 30 });

// Get formatted timing report
console.log(globalTimer.formatTimings());

// Or get raw timing data
const timings = globalTimer.getTimings();
const summary = globalTimer.getSummary();
```

### Using Custom Timer Instances

```javascript
import { PerformanceTimer } from 'babymongo';

const timer = new PerformanceTimer(true); // enabled=true

// Manual timing
const opTimer = timer.start('myOperation', 'customOp', { userId: 123 });
// ... do work ...
timer.end(opTimer, { recordsProcessed: 100 });

// Get summary
const summary = timer.getSummary();
```

### What Gets Timed

When enabled, PerformanceTimer automatically tracks:

**Collection Operations:**
- `find` / `findOne` - query planning, index lookup, full scan, projection
- `insertOne` / `insertMany` - document storage, index updates
- `updateOne` / `updateMany` - find, apply updates, index updates
- `aggregate` - pipeline stages ($match, $project, $sort, $group, etc.)

**IPC (WorkerBridge):**
- `serialize` - Serializing data for worker communication
- `deserialize` - Deserializing responses
- `roundtrip` - Full IPC round-trip time

## Detailed Profiling with NodeProfiler

### Basic Usage

```javascript
import { NodeProfiler, globalProfiler } from 'babymongo/src/NodeProfiler.js';

// Enable the global profiler
globalProfiler.enable();
globalProfiler.config.trackMemory = true;
globalProfiler.config.trackAsync = true;

// Your operations...
await runMyOperations();

// Generate and save report
await globalProfiler.saveReport('profile-report.txt');

// Or print to console
console.log(globalProfiler.formatReport());
```

### Manual Profiling

```javascript
import { NodeProfiler } from 'babymongo/src/NodeProfiler.js';

const profiler = new NodeProfiler({
  enabled: true,
  trackMemory: true,
  trackAsync: true,
  outputFile: 'my-profile.txt'
});

// Mark points in time
profiler.mark('operation-start');
await performOperation();
profiler.mark('operation-end');

// Measure duration
profiler.measure('my-operation', 'operation-start', 'operation-end');

// Take memory snapshots
profiler.takeMemorySnapshot('After bulk insert');

// Track async operations
const opId = 'query-123';
profiler.startAsyncOp(opId, 'complex-query', { filter: { age: { $gt: 30 } } });
const results = await collection.find({ age: { $gt: 30 } }).toArray();
profiler.endAsyncOp(opId, { resultCount: results.length });

// Save complete report
await profiler.saveReport();
```

### Using the Profile Function Wrapper

```javascript
import { profileFunction } from 'babymongo/src/NodeProfiler.js';

const results = await profileFunction('myDatabaseOps', async () => {
  await collection.insertMany(documents);
  return await collection.find({}).toArray();
});

// Timing and memory usage automatically tracked
```

## Using the Comparison Harness

The comparison harness compares babymongo against real MongoDB and includes detailed timing:

### Running Comparison Tests

```javascript
import { ComparisonHarness } from './test/comparison-harness.js';

const harness = new ComparisonHarness({ 
  enableDetailedTiming: true // default is true
});

await harness.connect('mongodb://localhost:27017', 'test-db');

// Run operations - timing automatically collected
await harness.compareOperation('users', 'insertMany', [[
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 }
]], { skipComparison: true });

await harness.compareOperation('users', 'find', [{ age: { $gte: 25 } }]);

await harness.cleanup('users');

// Timing report displayed automatically on close
await harness.close();
```

### Sample Output

```
======================================================================
                      TIMING COMPARISON REPORT
======================================================================

Per-Operation Performance:
----------------------------------------------------------------------
Operation              MongoDB         BabyMongo     Ratio     
----------------------------------------------------------------------
find                   2.145ms         45.328ms        21.13x
insertMany             5.234ms         156.782ms       29.95x
aggregate              8.912ms         203.445ms       22.83x
----------------------------------------------------------------------

Overall Statistics:
  MongoDB Total Time:     16.29ms
  BabyMongo Total Time: 405.56ms
  Operations Compared:    3
  Speed Ratio:            24.89x
======================================================================

================================================================================
                        PERFORMANCE TIMING REPORT
================================================================================

COLLECTION
--------------------------------------------------------------------------------
Operation                      Count   Total(ms)     Avg(ms)     Min(ms)     Max(ms)
--------------------------------------------------------------------------------
find                              5      42.156       8.431       5.234      12.891
find.queryPlanning                5       3.782       0.756       0.523       1.234
find.fullScan                     3      28.934       9.645       8.123      11.234
find.indexLookup                  2       8.123       4.062       3.456       4.667
find.projection                   5       1.317       0.263       0.178       0.456
insertOne                        10      98.234       9.823       8.123      12.456
insertOne.store                  10      45.678       4.568       3.456       6.234
insertOne.updateIndexes          10      52.556       5.256       4.234       7.123
aggregate                         2     203.445     101.723      98.234     105.211
aggregate.loadDocuments           2      45.678      22.839      20.123      25.555
aggregate.$match                  2      12.345       6.173       5.234       7.111
aggregate.$group                  2      89.234      44.617      42.111      47.123
aggregate.$sort                   2      34.567      17.284      16.123      18.444

IPC
--------------------------------------------------------------------------------
serialize                        20       8.234       0.412       0.234       0.678
deserialize                      20       6.789       0.339       0.189       0.567
roundtrip                        20      45.678       2.284       1.567       3.891

================================================================================
```

## Analyzing Results

### Understanding the Metrics

**Duration (ms)**: Time spent in milliseconds
- Collection operations: End-to-end time for the operation
- Sub-operations: Time spent in specific phases (e.g., query planning, full scan)
- IPC operations: Serialization and communication overhead

**Count**: Number of times the operation was called

**Avg/Min/Max**: Statistical distribution of durations

### Common Bottlenecks

Based on timing data, look for:

1. **High `find.fullScan` time** → Add indexes for frequently queried fields
2. **High `insertOne.updateIndexes` time** → Too many indexes, consider consolidating
3. **High `ipc.roundtrip` time** → Consider batching operations
4. **High `aggregate.*` times** → Optimize pipeline (use $match early, add indexes)
5. **High `aggregate.loadDocuments` time** → Use indexes or reduce dataset

### Memory Analysis (NodeProfiler)

```javascript
const report = profiler.getReport();

// Check memory timeline
report.memorySnapshots.forEach(snapshot => {
  console.log(`${snapshot.label}: ${snapshot.memory.heapUsed / 1024 / 1024} MB`);
});

// Check memory deltas in operations
report.measures.forEach(measure => {
  if (measure.memory.delta) {
    console.log(`${measure.name}: ${measure.memory.delta.heapUsed / 1024 / 1024} MB`);
  }
});
```

## Common Performance Patterns

### Pattern 1: Query Optimization

**Problem**: Slow find operations
```javascript
// Before: Full scan
await collection.find({ email: 'user@example.com' }).toArray();
// Timing shows: find.fullScan = 150ms
```

**Solution**: Add index
```javascript
// Create index
await collection.createIndex({ email: 1 });

// After: Index lookup
await collection.find({ email: 'user@example.com' }).toArray();
// Timing shows: find.indexLookup = 5ms
```

### Pattern 2: Batch Operations

**Problem**: Many individual inserts
```javascript
// Before: 100 individual inserts
for (const doc of documents) {
  await collection.insertOne(doc);
}
// Timing shows: Total = 1000ms (10ms each)
```

**Solution**: Batch insert
```javascript
// After: Single batch insert
await collection.insertMany(documents);
// Timing shows: Total = 200ms
```

### Pattern 3: Aggregation Optimization

**Problem**: Slow aggregation
```javascript
// Before: Load all, then filter
await collection.aggregate([
  { $addFields: { fullName: { $concat: ['$firstName', ' ', '$lastName'] } } },
  { $match: { age: { $gte: 30 } } },
  { $sort: { age: -1 } }
]).toArray();
// Timing shows: aggregate.loadDocuments = 200ms, aggregate.$match = 50ms
```

**Solution**: Filter early
```javascript
// After: Filter first, then transform
await collection.aggregate([
  { $match: { age: { $gte: 30 } } },  // Early filtering
  { $addFields: { fullName: { $concat: ['$firstName', ' ', '$lastName'] } } },
  { $sort: { age: -1 } }
]).toArray();
// Timing shows: aggregate.$match = 10ms (works on smaller dataset)
```

### Pattern 4: Index Usage

**Problem**: Update operations are slow
```javascript
// Before: No index on query field
await collection.updateOne({ userId: '12345' }, { $set: { status: 'active' } });
// Timing shows: updateOne.find = 100ms
```

**Solution**: Index query fields
```javascript
// Create index
await collection.createIndex({ userId: 1 });

// After: Fast lookup
await collection.updateOne({ userId: '12345' }, { $set: { status: 'active' } });
// Timing shows: updateOne.find = 5ms
```

## Example: Complete Profiling Session

```javascript
import { globalTimer, globalProfiler } from 'babymongo';
import { MongoClient } from 'babymongo';

// Enable both timing systems
globalTimer.setEnabled(true);
globalProfiler.enable();

const client = new MongoClient('mongodb://localhost/mydb');
await client.connect();
const db = client.db('mydb');
const collection = db.collection('users');

// Profile your operations
globalProfiler.mark('operations-start');

// Bulk insert
await collection.insertMany(generateTestData(1000));
globalProfiler.takeMemorySnapshot('After insert');

// Query operations
await collection.find({ age: { $gte: 30 } }).toArray();
await collection.find({ status: 'active' }).toArray();

// Aggregation
await collection.aggregate([
  { $match: { age: { $gte: 25 } } },
  { $group: { _id: '$status', count: { $sum: 1 } } }
]).toArray();

globalProfiler.mark('operations-end');
globalProfiler.measure('all-operations', 'operations-start', 'operations-end');

// Clean up
await client.close();

// Display results
console.log('=== PerformanceTimer Results ===');
console.log(globalTimer.formatTimings());

console.log('\n=== NodeProfiler Results ===');
console.log(globalProfiler.formatReport());

// Save reports
await globalProfiler.saveReport('profile-results.txt');
```

## Tips for Best Results

1. **Run multiple iterations**: Performance can vary, run tests multiple times
2. **Use realistic data**: Test with data volumes similar to production
3. **Profile incrementally**: Add timing points progressively to narrow down issues
4. **Compare before/after**: Always measure impact of optimizations
5. **Consider the environment**: OPFS performance varies by browser/Node version
6. **Watch for memory**: Large datasets can cause GC pauses affecting timing

## Disabling Profiling

For production use, disable profiling to avoid overhead:

```javascript
import { globalTimer, globalProfiler } from 'babymongo';

// Disable in production
if (process.env.NODE_ENV === 'production') {
  globalTimer.setEnabled(false);
  globalProfiler.disable();
}
```
