# Micro-Mongo

A JavaScript implementation of the MongoDB query API with persistent storage using the Origin Private File System (OPFS). Micro-Mongo runs database operations in a Web Worker (browser) or Worker Thread (Node.js) for optimal performance.

**Key Features:**
- 🚀 **Web Worker Architecture:** Database operations run in a separate thread, keeping your UI responsive
- 💾 **OPFS Persistent Storage:** Automatic persistence using the Origin Private File System (browser) with a Node.js polyfill for development
- 🔄 **MongoDB-Compatible API:** Familiar MongoDB syntax for queries, updates, aggregations, and change streams
- 📦 **Zero Configuration:** Works out of the box in both browser and Node.js environments
- 🔍 **Advanced Features:** Indexes, text search, geospatial queries, aggregation pipelines, and real-time change streams

[![Tests](https://github.com/belteshazzar/micro-mongo/actions/workflows/test.yml/badge.svg)](https://github.com/belteshazzar/micro-mongo/actions/workflows/test.yml) [![codecov](https://codecov.io/gh/belteshazzar/micro-mongo/branch/master/graph/badge.svg)](https://codecov.io/gh/belteshazzar/micro-mongo)

## In Node.js

### Installation

  `npm install micro-mongo`

### Usage with Web Worker (Recommended)

Micro-Mongo uses a web worker architecture to keep database operations off the main thread. The `WorkerBridge` manages communication between your application and the database worker:

```javascript
import { MongoClient, WorkerBridge } from 'micro-mongo';

async function main() {
    // Step 1: Create the worker bridge
    const bridge = await WorkerBridge.create();
    
    // Step 2: Connect to database with the bridge
    const client = new MongoClient('mongodb://localhost:27017/myapp', { 
        workerBridge: bridge 
    });
    await client.connect();
    
    const db = client.db('myapp');
    
    // Insert documents (async)
    await db.sample.insertOne({ age: 4, legs: 0 });
    await db.sample.insertMany([
        { age: 4, legs: 5 },
        { age: 54, legs: 2 }
    ]);
    
    // Query documents with toArray() (async)
    const results = await db.sample.find({ age: 54 }).toArray();
    console.log(results);
    
    // Or use async iteration
    for await (const doc of db.sample.find({ legs: 2 })) {
        console.log(doc);
    }
    
    // Update (async)
    await db.sample.updateOne({ age: 4 }, { $set: { legs: 4 } });
    
    // Delete (async)
    await db.sample.deleteOne({ age: 54 });
    
    // Count (async)
    const count = await db.sample.count();
    console.log(`Total documents: ${count}`);
    
    // Close connection
    await client.close();
}

main().catch(console.error);
```

**Why Web Workers?**
- ✅ Non-blocking operations keep your UI responsive
- ✅ Efficient isolation of database logic
- ✅ Better performance for large datasets
- ✅ Works seamlessly in both browser and Node.js

### Legacy Synchronous Usage (Deprecated)

For backwards compatibility, synchronous usage is still supported but not recommended:

```javascript
// Note: This pattern is deprecated. Use WorkerBridge + MongoClient instead.
var mongo = require('micro-mongo');
var db = new mongo.DB()
db.createCollection("sample")
db.sample.insert({ age: 4,	legs: 0	});
var cur = db.sample.find({ age: 4 })
cur.next()
```

**Note:** The synchronous pattern is maintained for backwards compatibility but will not benefit from web worker architecture or OPFS persistence. New applications should use the WorkerBridge pattern shown above.

### Using Indexes

Indexes can significantly improve query performance for large collections:

```javascript
import { MongoClient, WorkerBridge } from 'micro-mongo';

async function main() {
    const bridge = await WorkerBridge.create();
    const client = new MongoClient('mongodb://localhost:27017', { 
        workerBridge: bridge 
    });
    await client.connect();
    const db = client.db('myapp');
    
    // Insert some data
    await db.users.insertMany([
        { name: "Alice", age: 30, city: "NYC" },
        { name: "Bob", age: 25, city: "LA" },
        { name: "Charlie", age: 30, city: "SF" }
    ]);
    
    // Create an index on the age field
    await db.users.createIndex({ age: 1 });
    
    // Create a named index on city
    await db.users.createIndex({ city: 1 }, { name: "city_index" });
    
    // Create a compound index
    await db.users.createIndex({ age: 1, city: 1 });
    
    // List all indexes
    const indexes = await db.users.getIndexes();
    
    // Queries will automatically use indexes when possible
    const results = await db.users.find({ age: 30 }).toArray();
    
    await client.close();
}

main().catch(console.error);
```

The query planner automatically uses indexes for simple equality queries. For complex queries, it combines index lookups with full collection scans to ensure complete and correct results.

### Persistent Storage with OPFS

Micro-Mongo uses the **Origin Private File System (OPFS)** for automatic data persistence. OPFS is a modern web standard that provides fast, private storage for web applications.

**In the Browser:**

Data is automatically persisted to the OPFS when you use the WorkerBridge pattern. No additional configuration needed!

```javascript
import { MongoClient, WorkerBridge } from 'micro-mongo';

async function main() {
    const bridge = await WorkerBridge.create();
    const client = new MongoClient('mongodb://localhost:27017/myapp', { 
        workerBridge: bridge 
    });
    await client.connect();
    const db = client.db('myapp');
    
    // Data is automatically persisted to OPFS
    await db.users.insertOne({ name: 'Alice', age: 30 });
    await db.users.createIndex({ age: 1 });
    
    // On page reload, your data and indexes are automatically restored!
    
    await client.close();
}

main().catch(console.error);
```

**In Node.js:**

Micro-Mongo includes the [node-opfs](https://github.com/belteshazzar/node-opfs) polyfill, which implements the OPFS API using the file system. Data is stored in a `.opfs` directory in your project root.

```javascript
// Same code works in Node.js!
import { MongoClient, WorkerBridge } from 'micro-mongo';

async function main() {
    const bridge = await WorkerBridge.create();
    const client = new MongoClient('mongodb://localhost:27017/myapp', { 
        workerBridge: bridge 
    });
    await client.connect();
    const db = client.db('myapp');
    
    // Data is persisted to .opfs/micro-mongo/myapp/
    await db.products.insertMany([
        { name: 'Widget', price: 10.99 },
        { name: 'Gadget', price: 24.99 }
    ]);
    
    await client.close();
}

main().catch(console.error);
```

**Storage Location:**
- **Browser:** Data stored in OPFS (private to your origin, not accessible via DevTools)
- **Node.js:** Data stored in `.opfs/micro-mongo/{database-name}/{collection-name}/` directory
- **Format:** Binary JSON (BJSON) with B+ tree indexing for efficient queries

**Benefits of OPFS:**
- ✅ **Fast:** Synchronous file access in workers for better performance
- ✅ **Private:** Data is isolated and secure
- ✅ **Automatic:** No manual save/load calls needed
- ✅ **Cross-platform:** Works identically in browser and Node.js (via polyfill)
- ✅ **Versioned:** Supports compaction and versioning to prevent data corruption

### Aggregation Pipelines

Micro-Mongo supports MongoDB's powerful aggregation framework for data transformation and analysis:

```javascript
import { MongoClient, WorkerBridge } from 'micro-mongo';

async function main() {
    const bridge = await WorkerBridge.create();
    const client = new MongoClient('mongodb://localhost:27017', {
        workerBridge: bridge
    });
    await client.connect();
    const db = client.db('myapp');
    
    // Sample data
    await db.sales.insertMany([
        { product: 'Widget', price: 10, quantity: 5, category: 'Tools' },
        { product: 'Gadget', price: 20, quantity: 3, category: 'Electronics' },
        { product: 'Doohickey', price: 15, quantity: 2, category: 'Tools' }
    ]);
    
    // Aggregation pipeline
    const results = await db.sales.aggregate([
        { $match: { category: 'Tools' } },
        { $addFields: { total: { $multiply: ['$price', '$quantity'] } } },
        { $group: { 
            _id: '$category', 
            totalSales: { $sum: '$total' },
            avgPrice: { $avg: '$price' }
        }},
        { $sort: { totalSales: -1 } }
    ]).toArray();
    
    console.log(results);
    // [{ _id: 'Tools', totalSales: 80, avgPrice: 12.5 }]
    
    await client.close();
}

main().catch(console.error);
```

**Supported Stages:**
- `$match` - Filter documents
- `$project` - Reshape documents with expressions
- `$addFields` / `$set` - Add computed fields
- `$unset` - Remove fields
- `$group` - Group and aggregate
- `$sort` - Sort results
- `$limit` / `$skip` - Pagination
- `$lookup` - Join collections
- `$graphLookup` - Recursive joins
- `$facet` - Multiple pipelines
- `$bucket` / `$bucketAuto` - Histogram grouping
- `$sortByCount` - Group and count
- `$geoNear` - Geospatial aggregation
- `$merge` - Write results to collection

**Aggregation Expressions:**
Supports arithmetic (`$add`, `$multiply`), comparison (`$eq`, `$gt`), logical (`$and`, `$or`), string (`$concat`, `$substr`), date (`$year`, `$month`), and array operators (`$size`, `$filter`, `$map`).

### Tests

  `npm test`

## In the Browser

Micro-Mongo works seamlessly in modern browsers with automatic OPFS persistence.

### Installation

You can use Micro-Mongo from a CDN or build it yourself:

**Option 1: Use pre-built files**

Download the built files:
- Client: https://raw.githubusercontent.com/belteshazzar/micro-mongo/master/build/micro-mongo-client.js
- Worker: https://raw.githubusercontent.com/belteshazzar/micro-mongo/master/build/micro-mongo-server-worker.js

**Option 2: Build from source**

```bash
npm install
npm run build
```

### Usage in Browser

```html
<!DOCTYPE html>
<html>
<head>
    <title>Micro-Mongo Browser Example</title>
</head>
<body>
    <h1>Micro-Mongo in Browser</h1>
    <button id="insert">Insert Data</button>
    <button id="query">Query Data</button>
    <pre id="output"></pre>

    <script type="module">
        import { MongoClient, WorkerBridge } from './build/micro-mongo-client.js';

        async function main() {
            // Create worker bridge
            const bridge = await WorkerBridge.create();
            
            // Connect to database
            const client = new MongoClient('mongodb://localhost:27017/browserdb', {
                workerBridge: bridge
            });
            await client.connect();
            const db = client.db('browserdb');
            
            // Insert button handler
            document.getElementById('insert').addEventListener('click', async () => {
                await db.items.insertOne({ 
                    name: 'Item ' + Date.now(), 
                    timestamp: new Date() 
                });
                output.textContent = 'Data inserted and persisted to OPFS!';
            });
            
            // Query button handler
            document.getElementById('query').addEventListener('click', async () => {
                const items = await db.items.find({}).toArray();
                output.textContent = JSON.stringify(items, null, 2);
            });
        }

        main().catch(console.error);
    </script>
</body>
</html>
```

### Browser Features

- **Automatic Persistence:** All data is saved to OPFS and survives page reloads
- **Web Worker:** Database operations run in a worker thread for responsive UI
- **Full MongoDB API:** Query, update, aggregate, indexes, change streams
- **Developer-Friendly:** Check `.opfs` directory in Node.js for debugging

## Architecture

### Web Worker Design

Micro-Mongo uses a **dual-thread architecture** for optimal performance:

```
┌─────────────────────────────────┐
│      Main Thread (Your App)     │
│  ┌───────────────────────────┐  │
│  │      MongoClient          │  │
│  │      ProxyDB              │  │
│  │      ProxyCollection      │  │
│  └───────────┬───────────────┘  │
│              │ WorkerBridge     │
└──────────────┼──────────────────┘
               │ postMessage()
┌──────────────┼──────────────────┐
│              ▼                   │
│  ┌───────────────────────────┐  │
│  │      Server               │  │
│  │      DB                   │  │
│  │      Collection           │  │
│  │      Indexes              │  │
│  │      OPFS Storage         │  │
│  └───────────────────────────┘  │
│   Worker Thread (Web Worker/    │
│   Worker Thread in Node.js)     │
└─────────────────────────────────┘
```

**How It Works:**

1. **Main Thread:** Your application code runs here. All MongoDB operations are proxied through `WorkerBridge`
2. **Worker Thread:** The actual database engine runs here with direct OPFS access
3. **Communication:** WorkerBridge serializes/deserializes messages between threads
4. **Benefits:** 
   - UI stays responsive during heavy database operations
   - OPFS synchronous APIs available in worker context (fast!)
   - Clean separation of concerns

### Storage with OPFS

The **Origin Private File System** provides fast, persistent storage:

**File Structure:**
```
.opfs/                           # Root (Node.js) or OPFS root (Browser)
└── micro-mongo/                 # Base folder
    └── {database}/              # Database name
        └── {collection}/        # Collection name
            ├── documents.bjson  # B+ tree of documents
            ├── documents.bjson.version.json  # Version metadata
            ├── documents.bjson.v1            # Old version (during compaction)
            └── {index-name}.bjson            # Index B+ trees
```

**Key Features:**

- **Binary JSON (BJSON):** Efficient binary format with ObjectId and Date support
- **B+ Tree Indexes:** Self-balancing trees for fast queries
- **Versioning:** Safe compaction without data loss
- **Reference Counting:** Old versions kept until all readers close
- **Automatic Cleanup:** Old versions deleted when no longer needed

**Example Storage:**

```javascript
// After this code runs:
const db = client.db('store');
await db.products.insertOne({ name: 'Widget', price: 10.99 });
await db.products.createIndex({ name: 1 });

// Storage structure:
// .opfs/micro-mongo/store/products/documents.bjson
// .opfs/micro-mongo/store/products/name_1.bjson
```

### Multiple Clients Sharing a Worker

You can create multiple clients that share the same worker:

```javascript
const bridge = await WorkerBridge.create();

const client1 = new MongoClient('mongodb://localhost/app1', { workerBridge: bridge });
const client2 = new MongoClient('mongodb://localhost/app2', { workerBridge: bridge });

await client1.connect();
await client2.connect();

// Both clients use the same worker thread
// Changes in one client are visible to the other
```

# API Status

The following table summarises the API implementation status.

## Database Methods

| Name                         | Implemented     |
|------------------------------|-----------------|
| db.cloneCollection           | no              |
| db.cloneDatabase             | no              |
| db.commandHelp               | no              |
| db.copyDatabase              | no              |
| db.createCollection          | Yes             |
| db.currentOp                 | N/A             |
| db.dropDatabase              | Yes             |
| db.eval                      | N/A             |
| db.fsyncLock                 | N/A             |
| db.fsyncUnlock               | N/A             |
| db.getCollection             | no              |
| db.getCollectionInfos        | no              |
| db.getCollectionNames        | Yes             |
| db.getLastError              | no              |
| db.getLastErrorObj           | no              |
| db.getLogComponents          | N/A             |
| db.getMongo                  | N/A             |
| db.getName                   | no              |
| db.getPrevError              | no              |
| db.getProfilingLevel         | N/A             |
| db.getProfilingStatus        | N/A             |
| db.getReplicationInfo        | N/A             |
| db.getSiblingDB              | N/A             |
| db.help                      | Yes             |
| db.hostInfo                  | N/A             |
| db.isMaster                  | N/A             |
| db.killOp                    | N/A             |
| db.listCommands              | N/A             |
| db.loadServerScripts         | N/A             |
| db.printCollectionStats      | N/A             |
| db.printReplicationInfo      | N/A             |
| db.printShardingStatus       | N/A             |
| db.printSlaveReplicationInfo | N/A             |
| db.repairDatabase            | N/A             |
| db.resetError                | N/A             |
| db.runCommand                | N/A             |
| db.serverBuildInfo           | N/A             |
| db.serverCmdLineOpts         | N/A             |
| db.serverStatus              | N/A             |
| db.setLogLevel               | N/A             |
| db.setProfilingLevel         | N/A             |
| db.shutdownServer            | N/A             |
| db.stats                     | no              |
| db.version                   | no              |
| db.upgradeCheck              | N/A             |

## Collection Methods

| Name                               | Implemented |
|------------------------------------|-------------|
| db.collection.aggregate            | yes         | 
| db.collection.bulkWrite            | no          | 
| db.collection.count                | yes         |
| db.collection.copyTo               | yes         |
| db.collection.createIndex          | yes         | 
| db.collection.dataSize             | no          | 
| db.collection.deleteOne            | yes         |
| db.collection.deleteMany           | yes         |
| db.collection.distinct             | yes         |
| db.collection.drop                 | yes         |
| db.collection.dropIndex            | no          | 
| db.collection.dropIndexes          | no          | 
| db.collection.ensureIndex          | no          | 
| db.collection.explain              | no          | 
| db.collection.find                 | yes         |
| db.collection.findAndModify        | no          | 
| db.collection.findOne              | yes         |
| db.collection.findOneAndDelete     | yes         |
| db.collection.findOneAndReplace    | yes         |
| db.collection.findOneAndUpdate     | yes         |
| db.collection.getIndexes           | yes         |
| db.collection.getShardDistribution | N/A         | 
| db.collection.getShardVersion      | N/A         | 
| db.collection.group                | no          | 
| db.collection.insert               | yes         |
| db.collection.insertOne            | yes         |
| db.collection.insertMany           | yes         |
| db.collection.isCapped             | no          | 
| db.collection.mapReduce            | no          | 
| db.collection.reIndex              | no          | 
| db.collection.replaceOne           | yes         |
| db.collection.remove               | yes         |
| db.collection.renameCollection     | no          | 
| db.collection.save                 | no          | 
| db.collection.stats                | no          | 
| db.collection.storageSize          | no          | 
| db.collection.totalSize            | no          | 
| db.collection.totalIndexSize       | no          | 
| db.collection.update               | yes         |
| db.collection.updateOne            | yes         |
| db.collection.updateMany           | yes         |
| db.collection.validate             | no          |
| db.collection.watch                | yes         |

## Change Streams

**NEW:** Micro-Mongo supports change streams for reactive programming! Watch for real-time data changes at the collection, database, or client level.

```javascript
import { MongoClient, WorkerBridge } from 'micro-mongo';

async function main() {
    const bridge = await WorkerBridge.create();
    const client = new MongoClient('mongodb://localhost:27017', {
        workerBridge: bridge
    });
    await client.connect();
    const db = client.db('myapp');
    const collection = db.collection('users');

    // Watch for changes to a collection
    const changeStream = collection.watch();
    
    changeStream.on('change', (change) => {
        console.log('Change detected:', change.operationType);
        console.log('Document:', change.fullDocument);
    });
    
    // Make changes - they'll trigger the change stream
    await collection.insertOne({ name: 'Alice', age: 30 });
    await collection.updateOne({ name: 'Alice' }, { $set: { age: 31 } });
    await collection.deleteOne({ name: 'Alice' });
    
    // Filter changes using aggregation pipelines
    const filtered = collection.watch([
        { $match: { 'fullDocument.age': { $gte: 30 } } }
    ]);
    
    // Watch at database level (all collections)
    const dbStream = await db.watch();
    
    // Close when done
    changeStream.close();
    
    await client.close();
}

main().catch(console.error);
```

See [CHANGE-STREAMS.md](CHANGE-STREAMS.md) for complete documentation, examples, and browser reactivity patterns.

## Filtered Positional Operator with arrayFilters

**NEW:** Micro-Mongo supports the filtered positional operator `$[<identifier>]` with `arrayFilters`, allowing you to update specific array elements that match filter conditions!

```javascript
import { MongoClient, WorkerBridge } from 'micro-mongo';

async function main() {
    const bridge = await WorkerBridge.create();
    const client = new MongoClient('mongodb://localhost:27017', {
        workerBridge: bridge
    });
    await client.connect();
    const db = client.db('myapp');

    // Update items with quantity <= 5
    await db.products.insertOne({
        _id: 1,
        items: [
            { name: 'apple', quantity: 5 },
            { name: 'banana', quantity: 0 },
            { name: 'orange', quantity: 10 }
        ]
    });
    
    await db.products.updateOne(
        { _id: 1 },
        { $set: { 'items.$[elem].quantity': 100 } },
        { arrayFilters: [{ 'elem.quantity': { $lte: 5 } }] }
    );
    // Result: apple and banana quantity set to 100, orange remains 10
    
    // Update simple arrays
    await db.scores.updateOne(
        { _id: 1 },
        { $set: { 'scores.$[score]': 90 } },
        { arrayFilters: [{ 'score': { $lt: 90 } }] }
    );
    
    // Nested arrays with multiple filters
    await db.students.updateOne(
        { _id: 1 },
        { $inc: { 'students.$[student].grades.$[grade].score': 5 } },
        { 
            arrayFilters: [
                { 'student.name': 'Alice' },
                { 'grade.score': { $lt: 90 } }
            ] 
        }
    );
    
    await client.close();
}

main().catch(console.error);
```

See [docs/ARRAY-FILTERS.md](docs/ARRAY-FILTERS.md) for complete documentation and examples.

## Cursor Methods

| Name                    | Implemented     |
|-------------------------|-----------------|
| cursor.batchSize        | N/A             |
| cursor.close            | N/A             |
| cursor.comment          | no              |
| cursor.count            | yes             |
| cursor.explain          | N/A             |
| cursor.forEach          | yes             |
| cursor.hasNext          | yes             |
| cursor.hint             | N/A             |
| cursor.itcount          | no              |
| cursor.limit            | yes             |
| cursor.map              | yes             |
| cursor.maxScan          | N/A             |
| cursor.maxTimeMS        | N/A             |
| cursor.max              | no              |
| cursor.min              | no              |
| cursor.next             | yes             |
| cursor.noCursorTimeout  | N/A             |
| cursor.objsLeftInBatch  | N/A             |
| cursor.pretty           | no              |
| cursor.readConcern      | N/A             |
| cursor.readPref         | N/A             |
| cursor.returnKey        | N/A             |
| cursor.showRecordId     | N/A             |
| cursor.size             | no              |
| cursor.skip             | yes             |
| cursor.snapshot         | no              |
| cursor.sort             | yes             |
| cursor.tailable         | no              |
| cursor.toArray          | yes             |
| cursor.next()           | yes             |

