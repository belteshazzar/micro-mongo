# Workers in Micro-Mongo

## Overview

Micro-Mongo requires running the database in a worker thread (Web Worker in browsers, Worker Thread in Node.js). The `MongoClient` runs on the main thread and communicates with the DB running in the worker via message passing.

**All production code must use explicit `WorkerBridge` instances.**

## Creating and Using Workers

### Basic Usage

```javascript
import { MongoClient, WorkerBridge } from 'micro-mongo';

// 1. Create a worker
const bridge = await WorkerBridge.create();

// 2. Create client with the worker
const client = new MongoClient('mongodb://localhost/mydb', { workerBridge: bridge });

// 3. Connect and use
await client.connect();
const db = client.db();
await db.users.insertOne({ name: 'Alice' });

// 4. Cleanup
await client.close();
await bridge.terminate();
```

## Shared vs Individual Workers

### Shared Worker (Recommended for Multiple Databases)

Share one worker between multiple clients:

```javascript
import { WorkerBridge } from 'micro-mongo';

// Create a worker explicitly
const bridge = await WorkerBridge.create();

// Connect multiple clients to it
const client1 = new MongoClient('mongodb://localhost/db1', { workerBridge: bridge });
const client2 = new MongoClient('mongodb://localhost/db2', { workerBridge: bridge });

await client1.connect();
await client2.connect();

// When done, terminate the shared worker
await bridge.terminate();
```

### Shared Worker (Recommended for Multiple Databases)

Share one worker between multiple clients:

```javascript
const bridge = await WorkerBridge.create();

const client1 = new MongoClient('mongodb://localhost/db1', { workerBridge: bridge });
const client2 = new MongoClient('mongodb://localhost/db2', { workerBridge: bridge });

await client1.connect();
await client2.connect();

// When done, terminate the shared worker
await bridge.terminate();
```

### Individual Workers (Recommended for Isolation)

Each database gets its own worker:

```javascript
// Create separate workers
const bridge1 = await WorkerBridge.create();
const bridge2 = await WorkerBridge.create();

const client1 = new MongoClient('mongodb://localhost/db1', { workerBridge: bridge1 });
const client2 = new MongoClient('mongodb://localhost/db2', { workerBridge: bridge2 });

await client1.connect();
await client2.connect();

// Terminate each worker separately
await bridge1.terminate();
await bridge2.terminate();
```

## When to Use Shared Workers

### ✅ Use Shared Workers When:

1. **Resource Efficiency**: You have many clients and want to minimize worker overhead
2. **Cross-Database Operations**: You need to coordinate operations across multiple databases
3. **Centralized Control**: You want explicit control over worker lifecycle
4. **Single Process**: All clients are in the same process/thread

### ❌ Use Individual Workers When:

1. **Isolation**: Each database needs complete independence
2. **Different Configurations**: Databases need different worker settings
3. **Lifecycle Management**: Workers should be tied to client lifecycle
4. **Simplicity**: Default behavior with automatic cleanup

## Important Considerations

### Storage Isolation

When using **shared workers**, all databases on the same worker share the same storage context:
- In **OPFS-based storage**: Databases share the same directory structure
- Collections with the same name may conflict across databases
- Use unique collection names or different storage paths

When using **individual workers**, each has its own isolated storage.

### Worker Lifecycle

**Shared Workers:**
```javascript
const bridge = await WorkerBridge.create();
const client = new MongoClient('mongodb://localhost/db', { workerBridge: bridge });
await client.connect();

// client.close() does NOT terminate the shared worker
await client.close();

// Must terminate explicitly
await bridge.terminate();
```

**Individual Workers:**
```javascript
const client = new MongoClient('mongodb://localhost/db?useWorker=true');
await client.connect();

// client.close() DOES terminate its worker
await client.close();
```

### Performance

- **Shared Worker**: Lower memory overhead, potential contention on single worker thread
- **Individual Workers**: Higher memory overhead, better parallelism

## Examples

### Example 1: Shared Worker for Multiple Databases

```javascript
import { MongoClient, WorkerBridge } from 'micro-mongo';

const bridge = await WorkerBridge.create();

// Multiple databases on one worker
const salesClient = new MongoClient('mongodb://localhost/sales', { workerBridge: bridge });
const inventoryClient = new MongoClient('mongodb://localhost/inventory', { workerBridge: bridge });

await salesClient.connect();
await inventoryClient.connect();

const salesDB = salesClient.db();
const inventoryDB = inventoryClient.db();

// Both run in the same worker
await salesDB.users.insertOne({ name: 'Alice' });
await inventoryDB.products.insertOne({ sku: 'ABC123' });

// Cleanup
await salesClient.close();
await inventoryClient.close();
await bridge.terminate();
```

### Example 2: Mixed Approach

```javascript
// Shared worker for related databases
const sharedBridge = await WorkerBridge.create();
const mainClient = new MongoClient('mongodb://localhost/main', { workerBridge: sharedBridge });
const cacheClient = new MongoClient('mongodb://localhost/cache', { workerBridge: sharedBridge });

// Individual worker for isolated database
const analyticsClient = new MongoClient('mongodb://localhost/analytics?useWorker=true');

await Promise.all([
  mainClient.connect(),
  cacheClient.connect(),
  analyticsClient.connect()
]);

// ... use databases ...

// Cleanup
await mainClient.close();
await cacheClient.close();
await sharedBridge.terminate(); // Terminate shared worker

await analyticsClient.close(); // Automatically terminates its worker
```

## Browser vs Node.js

The `WorkerBridge` API works identically in both environments:
- **Browser**: Uses `Worker` (Web Worker API)
- **Node.js**: Uses `Worker` from `worker_threads` module

The worker bundle (`server-worker.js`) is environment-aware and works in both contexts.

## See Also

- [test-shared-worker.js](../test-shared-worker.js) - Working examples
- [WorkerBridge.js](../src/WorkerBridge.js) - Implementation details
- [Server.js](../src/Server.js) - Worker-side request handler
