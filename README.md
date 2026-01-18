# Micro-Mongo

A JavaScript implementation of the mongo query api for plain objects and HTML5 localStorage, with optional persistent storage using IndexedDB.

There are three main use cases that Micro-Mongo targets:
- providing a mongo interface to localStorage in HTML5 web browsers
- for use as an in memory mongo database that can be used in the browser or nodejs
- **NEW:** persistent storage using IndexedDB for saving and restoring database state including indexes

[![Tests](https://github.com/belteshazzar/micro-mongo/actions/workflows/test.yml/badge.svg)](https://github.com/belteshazzar/micro-mongo/actions/workflows/test.yml) [![codecov](https://codecov.io/gh/belteshazzar/micro-mongo/branch/master/graph/badge.svg)](https://codecov.io/gh/belteshazzar/micro-mongo)

## In Node.js

### Installation

  `npm install micro-mongo`

### Usage with Async/Await (Recommended)

Micro-Mongo now supports async/await patterns compatible with the real MongoDB driver:

```javascript
import { MongoClient } from 'micro-mongo';

async function main() {
    // Connect to database (async)
    const client = await MongoClient.connect('mongodb://localhost:27017');
    const db = client.db('myapp');
    
    // Insert documents (async)
    await db.sample.insertOne({ age: 4, legs: 0 });
    await db.sample.insertMany([
        { age: 4, legs: 5 },
        { age: 54, legs: 2 }
    ]);
    
    // Query documents (cursor iteration is still synchronous)
    const cursor = db.sample.find({ age: { $gte: 4 } });
    while (cursor.hasNext()) {
        console.log(cursor.next());
    }
    
    // Or use toArray() (async)
    const results = await db.sample.find({ age: 54 }).toArray();
    
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
    
    // Close connection
    await client.close();
}

main().catch(console.error);
```

### Legacy Synchronous Usage (Still Supported)

```javascript
var mongo = require('micro-mongo');
var db = new mongo.DB()
db.createCollection("sample")
db.sample.insert({ age: 4,	legs: 0	});
db.sample.insert([{ age: 4,	legs: 5	},{ age: 54, legs: 2	}]);
db.sample.insertMany([{ age: 54, legs: 12 },{ age: 16					 }]);
db.sample.insertOne({ name: "steve"		 });
var cur = db.sample.find({ $and: [{ age : 54},{ legs: 2 }] })
cur.next()
```

**Note:** While synchronous usage still works for backwards compatibility, the async/await pattern is recommended for new code as it matches the real MongoDB driver API.

### Using Indexes

Indexes can significantly improve query performance for large collections:

    var mongo = require('mongo-local-db');
    var db = new mongo.DB()
    db.createCollection("users")
    
    // Insert some data
    db.users.insertMany([
        { name: "Alice", age: 30, city: "NYC" },
        { name: "Bob", age: 25, city: "LA" },
        { name: "Charlie", age: 30, city: "SF" }
    ]);
    
    // Create an index on the age field
    db.users.createIndex({ age: 1 })
    
    // Create a named index on city
    db.users.createIndex({ city: 1 }, { name: "city_index" })
    
    // Create a compound index
    db.users.createIndex({ age: 1, city: 1 })
    
    // List all indexes
    var indexes = db.users.getIndexes()
    
    // Queries will automatically use indexes when possible
    var results = db.users.find({ age: 30 }).toArray()

The query planner automatically uses indexes for simple equality queries. For complex queries, it combines index lookups with full collection scans to ensure complete and correct results.

### Persistent Storage with IndexedDB

Micro-Mongo supports persistent storage using IndexedDB, allowing you to save and restore your entire database state including all indexes:

```javascript
import { MongoClient, IndexedDbStorageEngine } from 'micro-mongo';

async function main() {
    // Create a storage engine
    const storageEngine = new IndexedDbStorageEngine('my-app-db');
    
    // Connect with storage engine
    const client = await MongoClient.connect('mongodb://localhost:27017', {
        storageEngine: storageEngine
    });
    const db = client.db('myapp');
    
    // Load existing data (if any)
    await db.loadFromStorage();
    
    // Use database normally
    await db.users.insertOne({ name: 'Alice', age: 30 });
    await db.users.createIndex({ age: 1 });
    
    // Save to IndexedDB (persists across page reloads)
    await db.saveToStorage();
    
    // Next time you load the page, data and indexes will be restored!
    await client.close();
}

main().catch(console.error);
```

See [STORAGE-ENGINE.md](STORAGE-ENGINE.md) for complete documentation on storage engines.

### Tests

  `npm test`

## In the Browser

For an example of Micro-Mongo in the browser check out: http://belteshazzar.github.io/micro-mongo/index.html

### Usage

Download from here: https://raw.githubusercontent.com/belteshazzar/micro-mongo/master/micro-mongo.js

Include in your web page:

    <script src="micro-mongo.js"></script>
    
Query localStorage or other collections (note that in the browser the localStorage collection is automatically created and because it is backed by HTML5 localStorage it will persist across multiple sessions):

    <script>
       var db = new MicroMongo.DB()
       db.localStorage.insert({ age: 4,	legs: 0	});
       var cur = db.localStorage.find();
       alert(JSON.stringify(cur.toArray()));
    </script>

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
| db.collection.aggregate            | no          | 
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

**NEW:** Micro-Mongo now supports change streams for reactive programming! Watch for real-time data changes at the collection, database, or client level.

```javascript
import { MongoClient } from 'micro-mongo';

const client = await MongoClient.connect();
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
const dbStream = db.watch();

// Watch at client level (all databases)
const clientStream = client.watch();

// Close when done
changeStream.close();
```

See [CHANGE-STREAMS.md](CHANGE-STREAMS.md) for complete documentation, examples, and browser reactivity patterns.

## Filtered Positional Operator with arrayFilters

**NEW:** Micro-Mongo now supports the filtered positional operator `$[<identifier>]` with `arrayFilters`, allowing you to update specific array elements that match filter conditions!

```javascript
import { MongoClient } from 'micro-mongo';

const client = await MongoClient.connect();
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

