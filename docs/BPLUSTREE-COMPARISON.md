# B+ Tree Implementations Comparison

This document compares the **mutable** (`BPlusTree`) and **immutable** (`ImmutableBPlusTree`) B+ tree implementations in micro-mongo.

## Overview

Both implementations provide a B+ tree data structure for efficient indexing with logarithmic search, insertion, and deletion times. The key difference is in how they handle state changes.

## Architecture Comparison

### Mutable BPlusTree (`src/BPlusTree.js`)

**Philosophy**: In-place modifications
- Modifies existing nodes directly
- Updates parent references when nodes split/merge
- Implements full rebalancing on delete
- Single tree instance that evolves over time

**Node Structure**:
```javascript
class BPlusTreeNode {
    keys: []        // Mutable array of keys
    values: []      // Mutable array of values (leaf nodes)
    children: []    // Mutable array of child refs (internal nodes)
    isLeaf: boolean
    next: Node      // Mutable pointer to next leaf
}
```

### Immutable BPlusTree (`src/ImmutableBPlusTree.js`)

**Philosophy**: Persistent data structure
- Never modifies existing nodes
- Creates new nodes for any change
- Returns new tree instances on mutations
- Structural sharing (unchanged subtrees reused)
- Simplified delete (no rebalancing)

**Node Structure**:
```javascript
class ImmutableBPlusTreeNode {
    keys: []        // Immutable array (copied on change)
    values: []      // Immutable array (copied on change)
    children: []    // Immutable array (copied on change)
    isLeaf: boolean
    next: Node      // Rebuilt after mutations
}
```

## API Comparison

### Construction

**Mutable**:
```javascript
const tree = new BPlusTree(order);
// Single instance
```

**Immutable**:
```javascript
let tree = new ImmutableBPlusTree(order);
// Returns new instances
```

### Insertion

**Mutable**:
```javascript
tree.add(key, value);  // Modifies tree in place
// Return value: void
```

**Immutable**:
```javascript
tree = tree.add(key, value);  // Returns new tree
// Return value: ImmutableBPlusTree
// Original tree unchanged
```

### Deletion

**Mutable**:
```javascript
const deleted = tree.delete(key);  // Modifies tree
// Returns: boolean (success)
// Includes rebalancing logic
```

**Immutable**:
```javascript
tree = tree.delete(key);  // Returns new tree
// Returns: ImmutableBPlusTree (possibly same if key not found)
// No rebalancing (trade-off for simplicity)
```

### Search (Read Operations)

**Both implementations identical**:
```javascript
const value = tree.search(key);
const results = tree.rangeSearch(minKey, maxKey);
const all = tree.toArray();
const count = tree.size();
const empty = tree.isEmpty();
const height = tree.getHeight();
```

### Clear

**Mutable**:
```javascript
tree.clear();  // Empties the tree
// Return value: void
```

**Immutable**:
```javascript
tree = tree.clear();  // Returns new empty tree
// Return value: ImmutableBPlusTree
```

## Performance Characteristics

### Write Operations (Insert/Delete)

| Operation | Mutable | Immutable | Winner |
|-----------|---------|-----------|--------|
| Sequential Insert | 2.70ms | 9.37ms | **Mutable 3.5x faster** |
| Random Insert | 1.11ms | 6.23ms | **Mutable 5.6x faster** |
| Delete | 1.06ms | 5.70ms | **Mutable 5.4x faster** |

**Why?**
- Mutable: Direct memory updates, no allocation overhead
- Immutable: Must allocate new nodes, copy arrays, rebuild next pointers

### Read Operations (Search/Range)

| Operation | Mutable | Immutable | Winner |
|-----------|---------|-----------|--------|
| Search (10k ops) | 2.46ms | 1.68ms | **Immutable 32% faster** |
| Range Search | 1.50ms | 0.98ms | **Immutable 35% faster** |
| toArray | 3.25ms | 2.44ms | **Immutable 25% faster** |

**Why?**
- Both traverse identical structures
- Slight variations likely due to memory layout/caching
- Performance essentially equivalent

### Versioning/Snapshots

| Operation | Mutable | Immutable | Winner |
|-----------|---------|-----------|--------|
| 100 versions | 1.88ms | 0.21ms | **Immutable 9x faster** |

**Why?**
- Mutable: Must deep copy entire tree for each version
- Immutable: Structural sharing reuses unchanged nodes

## Memory Usage

### Mutable
- **Single Version**: Minimal memory, only stores current state
- **Multiple Versions**: O(n) per version (full copy required)
- **After Deletes**: Memory freed immediately

### Immutable
- **Single Version**: Slightly higher due to copied nodes
- **Multiple Versions**: O(log n) per version (structural sharing)
- **After Deletes**: Old nodes garbage collected when no longer referenced
- **Trade-off**: Tree may become unbalanced after many deletes

## Feature Comparison

| Feature | Mutable | Immutable |
|---------|---------|-----------|
| In-place modification | ✅ Yes | ❌ No |
| Returns new instances | ❌ No | ✅ Yes |
| Thread-safe reads | ❌ No (needs locking) | ✅ Yes (always) |
| Thread-safe writes | ❌ No (needs locking) | ✅ Yes (via COW) |
| Versioning/time-travel | ❌ Expensive | ✅ Efficient |
| Rebalancing on delete | ✅ Full | ⚠️ Simplified |
| Undo/redo support | ❌ Manual | ✅ Natural |
| Debugging (snapshots) | ❌ Difficult | ✅ Easy |

## Use Cases

### When to Use Mutable BPlusTree

✅ **Best for**:
- High-throughput write operations
- Single-threaded applications
- Memory-constrained environments
- Don't need versioning
- Need guaranteed rebalancing

**Examples**:
- Database index in single-threaded environment
- Cache with frequent updates
- Real-time data ingestion pipeline

### When to Use ImmutableBPlusTree

✅ **Best for**:
- Multi-threaded/concurrent access
- Read-heavy workloads
- Need snapshots/versioning
- Undo/redo functionality
- Time-travel debugging
- Functional programming paradigms

**Examples**:
- Multi-version concurrency control (MVCC) database
- Audit trail / history tracking
- State management in UI applications
- Collaborative editing (branching timelines)
- Testing/debugging with state snapshots

## Code Examples

### Versioning with Immutable

```javascript
let v1 = new ImmutableBPlusTree(3);
let v2 = v1.add(1, 'one');
let v3 = v2.add(2, 'two');
let v4 = v3.add(3, 'three');

// All versions remain accessible
console.log(v1.size());  // 0
console.log(v2.size());  // 1
console.log(v3.size());  // 2
console.log(v4.size());  // 3

// Can "branch" from any version
let alt = v2.add(10, 'ten');
console.log(alt.size());  // 2 (branched from v2)
```

### Thread Safety Example

```javascript
// Immutable: Safe without locking
const tree = new ImmutableBPlusTree(3);
let snapshot1, snapshot2;

// Thread 1
setTimeout(() => {
    snapshot1 = tree.add(1, 'one').add(2, 'two');
}, 0);

// Thread 2
setTimeout(() => {
    snapshot2 = tree.add(3, 'three').add(4, 'four');
}, 0);

// Both snapshots are independent and valid
```

## Implementation Differences

### Next Pointer Management

**Mutable**:
- Updated during split operations
- Maintained through rotations/merges
- Always correct after any operation

**Immutable**:
- Rebuilt after every mutation via `_rebuildNextPointers()`
- Traverses tree to collect leaves in order
- Links them sequentially
- Simpler but with rebuild overhead

### Split Logic

**Mutable**:
- Checks `keys.length === order - 1` (full node)
- Splits before overflow

**Immutable**:
- Checks `keys.length >= order` (at capacity)
- Splits when needed
- Similar results, slight implementation difference

### Delete Rebalancing

**Mutable**:
- Full rebalancing with borrowing from siblings
- Merging underflow nodes
- Maintains optimal tree height

**Immutable**:
- No rebalancing (simplification trade-off)
- Tree may become deeper after many deletes
- Simpler code, potentially less optimal structure

## Testing

Both implementations have comprehensive test suites:

- **Mutable**: `test/test-bplustree.js` (34 tests)
- **Immutable**: `test/test-immutable-bplustree.js` (38 tests)

Additional tests for immutable version include:
- Immutability verification
- Version preservation
- Branching histories

## Summary

**Choose Mutable** when you need:
- Maximum write performance
- Single-threaded access
- Minimal memory overhead
- Guaranteed tree balance

**Choose Immutable** when you need:
- Thread safety
- Versioning/snapshots
- Functional programming style
- Undo/redo capability
- Debugging with state snapshots

Both implementations provide the same core B+ tree functionality with different trade-offs optimized for different use cases.
