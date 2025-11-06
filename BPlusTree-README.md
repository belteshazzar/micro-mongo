# B+ Tree Implementation

This is a complete B+ tree data structure implementation that can be used for indexing in databases. The B+ tree is a self-balancing tree that maintains sorted data and allows searches, sequential access, insertions, and deletions in logarithmic time.

## Features

- **Add (Insert)**: Insert key-value pairs with automatic tree balancing
- **Search**: Fast O(log n) search for values by key
- **Delete**: Remove keys with automatic rebalancing
- **Range Search**: Find all keys within a specified range
- **Sequential Access**: Efficiently iterate through all values in sorted order
- **Configurable Order**: Set the maximum number of children per node

## Usage

### Importing

```javascript
import { BPlusTree } from './BPlusTree.js';
// or from main.js
import { BPlusTree } from './main.js';
```

### Creating a Tree

```javascript
// Create with default order (3)
const tree = new BPlusTree();

// Create with custom order (must be >= 3)
const tree = new BPlusTree(5);
```

### Adding Data

```javascript
tree.add(10, 'value for 10');
tree.add(5, 'value for 5');
tree.add(15, 'value for 15');
tree.add(3, 'value for 3');
```

### Searching

```javascript
const value = tree.search(10);
console.log(value); // 'value for 10'

const notFound = tree.search(100);
console.log(notFound); // undefined
```

### Deleting

```javascript
const deleted = tree.delete(10);
console.log(deleted); // true if found and deleted, false otherwise
```

### Range Search

```javascript
// Find all keys between 5 and 15 (inclusive)
const results = tree.rangeSearch(5, 15);
// Returns: [{key: 5, value: 'value for 5'}, {key: 10, value: 'value for 10'}, ...]
```

### Getting All Data (Sorted)

```javascript
const allData = tree.toArray();
// Returns all key-value pairs in sorted order
```

### Other Operations

```javascript
// Check if tree is empty
tree.isEmpty(); // true or false

// Get number of elements
tree.size(); // number

// Get tree height
tree.getHeight(); // number of levels (0 for single level)

// Clear all elements
tree.clear();
```

## API Reference

### Constructor

- `new BPlusTree(order = 3)` - Creates a new B+ tree with specified order (minimum 3)

### Methods

- `add(key, value)` - Inserts a key-value pair
- `search(key)` - Returns the value for a key, or undefined if not found
- `delete(key)` - Deletes a key, returns true if deleted, false if not found
- `rangeSearch(minKey, maxKey)` - Returns array of {key, value} objects in range
- `toArray()` - Returns all {key, value} objects in sorted order
- `isEmpty()` - Returns true if tree is empty
- `size()` - Returns number of key-value pairs
- `getHeight()` - Returns height of the tree
- `clear()` - Removes all elements

## Key Features

### Automatic Balancing

The tree automatically balances itself during insertions and deletions by:
- Splitting nodes when they become full
- Merging or redistributing nodes when they become too empty
- Maintaining the B+ tree properties

### Leaf Node Linking

All data is stored in leaf nodes, which are linked together for efficient sequential access and range queries.

### Logarithmic Performance

All operations (search, insert, delete) run in O(log n) time, where n is the number of elements.

## Use Cases

- **Database Indexing**: Primary use case for efficient data retrieval
- **Sorted Data Storage**: Maintain sorted data with efficient insertions/deletions
- **Range Queries**: Efficiently find all values within a range
- **Sequential Access**: Iterate through data in sorted order

## Example: Using for Indexing

```javascript
import { BPlusTree } from './BPlusTree.js';

// Create an index for user IDs
const userIndex = new BPlusTree(4);

// Add users
userIndex.add(1001, { name: 'Alice', email: 'alice@example.com' });
userIndex.add(1005, { name: 'Bob', email: 'bob@example.com' });
userIndex.add(1003, { name: 'Charlie', email: 'charlie@example.com' });

// Look up a user
const user = userIndex.search(1005);
console.log(user); // { name: 'Bob', email: 'bob@example.com' }

// Find users in ID range
const usersInRange = userIndex.rangeSearch(1002, 1010);
console.log(usersInRange);
// [
//   { key: 1003, value: { name: 'Charlie', ... } },
//   { key: 1005, value: { name: 'Bob', ... } }
// ]

// Remove a user
userIndex.delete(1003);
```

## Testing

The implementation includes comprehensive unit tests covering:
- Basic operations (add, search, delete)
- Edge cases (empty tree, single element, duplicates)
- Stress tests (large datasets, rapid operations)
- Different key types (numbers, strings, negative values, floats)
- Tree structure integrity after operations

Run tests with:
```bash
npm test -- test/test-bplustree.js
```

## Implementation Details

- Written in modern JavaScript (ES6+)
- Fully documented with JSDoc comments
- Pure JavaScript with no external dependencies
- All data stored in leaf nodes for B+ tree compliance
- Internal nodes contain only routing keys
