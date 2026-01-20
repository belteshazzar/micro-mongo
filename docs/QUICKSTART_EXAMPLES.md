# Quick Start: Updated Documentation Examples

## The New Pattern

All documentation examples now follow this pattern:

```javascript
import { MongoClient, WorkerBridge } from '../main.js';

async function main() {
  // Step 1: Create the worker bridge
  const bridge = await WorkerBridge.create();

  // Step 2: Create client with the bridge
  const client = new MongoClient('mongodb://localhost:27017', { workerBridge: bridge });
  await client.connect();

  // Step 3: Use the client normally
  const db = client.db('mydb');
  const collection = db.collection('users');
  
  // ... your code here
}

main().catch(console.error);
```

## Running the Examples

All examples are ready to run:

```bash
# Basic change stream example
node docs/basic-change-stream.js

# Quick start guide
node docs/quick-start.js

# Full usage example
node docs/example-usage.js

# Query examples
node docs/example-query.js

# Filtered changes
node docs/filtered-changes.js

# Multi-collection watching
node docs/multi-collection.js

# Reactive UI patterns
node docs/reactive-ui.js
```

## Common Patterns

### Single Client
```javascript
const bridge = await WorkerBridge.create();
const client = new MongoClient('mongodb://localhost/db1', { workerBridge: bridge });
await client.connect();
```

### Multiple Clients (Shared Worker)
```javascript
const bridge = await WorkerBridge.create();

const client1 = new MongoClient('mongodb://localhost/db1', { workerBridge: bridge });
const client2 = new MongoClient('mongodb://localhost/db2', { workerBridge: bridge });
const client3 = new MongoClient('mongodb://localhost/db3', { workerBridge: bridge });

await client1.connect();
await client2.connect();
await client3.connect();

// All three clients share the same worker thread
```

### Change Streams: Collection vs DB-level

- Collection-level streams are returned synchronously.
- DB-level streams are returned via a Promise and must be awaited.

Collection-level (no `await`):
```javascript
const bridge = await WorkerBridge.create();
const client = new MongoClient('mongodb://localhost:27017', { workerBridge: bridge });
await client.connect();

const users = client.db('mydb').collection('users');
const stream = users.watch(/* optional pipeline, options */);

stream.on('change', (change) => {
  console.log('users change:', change);
});
// ... later
stream.close();
```

DB-level (must `await`):
```javascript
const bridge = await WorkerBridge.create();
const client = new MongoClient('mongodb://localhost:27017', { workerBridge: bridge });
await client.connect();

const db = client.db('mydb');
const dbStream = await db.watch(/* optional pipeline, options */);

dbStream.on('change', (change) => {
  console.log(`[${change.ns.db}.${change.ns.coll}]`, change.operationType);
});
// ... later
dbStream.close();
```

Multi-database watch pattern (compose DB-level streams):
```javascript
const bridge = await WorkerBridge.create();
const client = new MongoClient('mongodb://localhost:27017', { workerBridge: bridge });
await client.connect();

const db1 = client.db('db1');
const db2 = client.db('db2');
const db3 = client.db('db3');

const s1 = await db1.watch();
const s2 = await db2.watch();
const s3 = await db3.watch();

const onChange = (c) => console.log(`[${c.ns.db}.${c.ns.coll}]`, c.operationType);
s1.on('change', onChange);
s2.on('change', onChange);
s3.on('change', onChange);

// ... perform operations across databases

// cleanup
s1.close();
s2.close();
s3.close();
```

Note: Client-level `watch()` is not exposed on the proxy client in Node/browser contexts. Use DB-level streams for cross-database monitoring.

## Updated Documentation Files

All these files have been updated:

| File | Purpose |
|------|---------|
| `basic-change-stream.js` | Simple change stream example |
| `quick-start.js` | Quick guide to change streams |
| `example-usage.js` | General usage patterns |
| `example-query.js` | Query and index examples |
| `filtered-changes.js` | Filtered change streams |
| `multi-collection.js` | Watching multiple collections |
| `reactive-ui.js` | React/Vue/Vanilla patterns |

## See Also

- [../README.md](../README.md) - Main documentation
