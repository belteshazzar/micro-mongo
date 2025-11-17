# Change Streams

Change streams allow applications to watch for data changes in real-time. This is particularly useful for building reactive user interfaces in the browser where the UI needs to update automatically when data changes.

## Overview

Change streams in micro-mongo work similarly to MongoDB's change streams, emitting events when documents are inserted, updated, replaced, or deleted. They can be opened on:
- Collections (watch specific collection)
- Databases (watch all collections in database)
- Clients (watch all databases and collections)

## Basic Usage

### Watching a Collection

```javascript
import { MongoClient } from 'micro-mongo';

const client = new MongoClient();
await client.connect();
const db = client.db('myapp');
const collection = db.collection('users');

// Watch for changes
const changeStream = collection.watch();

changeStream.on('change', (change) => {
  console.log('Change detected:', change);
  // Change object contains:
  // - operationType: 'insert', 'update', 'replace', or 'delete'
  // - fullDocument: The full document (for inserts/replaces)
  // - documentKey: { _id: ... }
  // - updateDescription: Details of what changed (for updates)
});

// Make some changes
await collection.insertOne({ name: 'Alice', age: 30 });
await collection.updateOne({ name: 'Alice' }, { $set: { age: 31 } });
await collection.deleteOne({ name: 'Alice' });

// Close the change stream when done
changeStream.close();
```

### Watching a Database

Watch all collections in a database:

```javascript
const db = client.db('myapp');
const changeStream = db.watch();

changeStream.on('change', (change) => {
  console.log('Collection:', change.ns.coll);
  console.log('Operation:', change.operationType);
});

// Changes in any collection will trigger events
await db.collection('users').insertOne({ name: 'Alice' });
await db.collection('posts').insertOne({ title: 'Hello' });

changeStream.close();
```

### Watching the Client

Watch all databases and collections:

```javascript
const client = new MongoClient();
await client.connect();
const changeStream = client.watch();

changeStream.on('change', (change) => {
  console.log('Database:', change.ns.db);
  console.log('Collection:', change.ns.coll);
});

await client.db('db1').collection('col1').insertOne({ x: 1 });
await client.db('db2').collection('col2').insertOne({ y: 2 });

changeStream.close();
```

## Filtering with Pipelines

Use aggregation pipelines to filter which changes you want to see:

### Filter by Operation Type

```javascript
// Only watch for inserts
const changeStream = collection.watch([
  { $match: { operationType: 'insert' } }
]);
```

### Filter by Document Fields

```javascript
// Only watch for users with age >= 30
const changeStream = collection.watch([
  { $match: { 'fullDocument.age': { $gte: 30 } } }
]);
```

### Multiple Filters

```javascript
// Watch for updates to active users
const changeStream = collection.watch([
  { 
    $match: { 
      operationType: 'update',
      'fullDocument.status': 'active'
    } 
  }
]);
```

## Async Iteration

Change streams support async iteration using `for-await-of`:

```javascript
const changeStream = collection.watch();

for await (const change of changeStream) {
  console.log('Change:', change);
  
  if (change.fullDocument?.name === 'stop') {
    changeStream.close();
    break;
  }
}
```

Or use the `next()` method:

```javascript
const changeStream = collection.watch();

const change1 = await changeStream.next();
console.log('First change:', change1);

const change2 = await changeStream.next();
console.log('Second change:', change2);

changeStream.close();
```

## Options

### fullDocument

For update operations, you can request the full updated document:

```javascript
const changeStream = collection.watch([], { 
  fullDocument: 'updateLookup' 
});

changeStream.on('change', (change) => {
  if (change.operationType === 'update') {
    console.log('Full updated document:', change.fullDocument);
    console.log('What changed:', change.updateDescription);
  }
});
```

Without this option, update events only include the `updateDescription` (what fields changed), not the full document.

## Change Event Structure

### Insert Events

```javascript
{
  _id: '...',                    // Unique event ID
  operationType: 'insert',
  clusterTime: 1234567890,       // Timestamp
  ns: {
    db: 'myapp',                 // Database name
    coll: 'users'                // Collection name
  },
  documentKey: {
    _id: ObjectId('...')         // Document _id
  },
  fullDocument: {                // The inserted document
    _id: ObjectId('...'),
    name: 'Alice',
    age: 30
  }
}
```

### Update Events

```javascript
{
  _id: '...',
  operationType: 'update',
  clusterTime: 1234567890,
  ns: { db: 'myapp', coll: 'users' },
  documentKey: { _id: ObjectId('...') },
  updateDescription: {
    updatedFields: {             // Fields that were added/changed
      age: 31,
      city: 'NYC'
    },
    removedFields: ['temp'],     // Fields that were removed
    truncatedArrays: []
  },
  fullDocument: {                // Only if fullDocument: 'updateLookup'
    _id: ObjectId('...'),
    name: 'Alice',
    age: 31,
    city: 'NYC'
  }
}
```

### Replace Events

```javascript
{
  _id: '...',
  operationType: 'replace',
  clusterTime: 1234567890,
  ns: { db: 'myapp', coll: 'users' },
  documentKey: { _id: ObjectId('...') },
  fullDocument: {                // The replacement document
    _id: ObjectId('...'),
    name: 'Alice Smith',
    age: 31
  }
}
```

### Delete Events

```javascript
{
  _id: '...',
  operationType: 'delete',
  clusterTime: 1234567890,
  ns: { db: 'myapp', coll: 'users' },
  documentKey: { _id: ObjectId('...') }
  // Note: fullDocument is NOT included for deletes
}
```

## Browser Reactivity Pattern

Change streams are perfect for building reactive UIs in the browser:

```javascript
// React example
function UserList() {
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    const collection = db.collection('users');
    const changeStream = collection.watch();
    
    changeStream.on('change', async (change) => {
      switch (change.operationType) {
        case 'insert':
          setUsers(prev => [...prev, change.fullDocument]);
          break;
          
        case 'update':
        case 'replace':
          setUsers(prev => prev.map(user => 
            user._id === change.documentKey._id 
              ? change.fullDocument 
              : user
          ));
          break;
          
        case 'delete':
          setUsers(prev => prev.filter(user => 
            user._id !== change.documentKey._id
          ));
          break;
      }
    });
    
    // Load initial data
    collection.find().toArray().then(setUsers);
    
    return () => changeStream.close();
  }, []);
  
  return (
    <ul>
      {users.map(user => (
        <li key={user._id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## Event Handlers

Change streams extend EventEmitter and support these events:

- `change` - Emitted when a change occurs
- `close` - Emitted when the stream is closed
- `error` - Emitted when an error occurs

```javascript
const changeStream = collection.watch();

changeStream.on('change', (change) => {
  console.log('Change:', change);
});

changeStream.on('close', () => {
  console.log('Stream closed');
});

changeStream.on('error', (error) => {
  console.error('Stream error:', error);
});
```

## Closing Streams

Always close change streams when you're done to clean up event listeners:

```javascript
const changeStream = collection.watch();

// ... use the stream ...

changeStream.close();
```

When a stream is closed:
- No more change events will be emitted
- The `close` event is emitted
- Any pending `next()` calls resolve with `null`
- Event listeners are removed

## Limitations

Compared to MongoDB's change streams, micro-mongo has these limitations:

1. **No resume tokens**: Cannot resume from a specific point in time
2. **No sharding support**: Single-instance only
3. **Pipeline operators**: Only basic `$match` is supported
4. **No transaction events**: Transactions are not implemented
5. **Memory-based**: Events are only emitted for the current session
6. **No oplog**: Changes are not persisted to an operation log

## Performance Considerations

- Change streams use in-process event emitters, so they're very fast
- Each change stream adds event listeners to collections
- Close streams when not needed to prevent memory leaks
- For many concurrent streams, consider using a single stream with filtering

## Examples

See the `examples/` directory for complete working examples:
- `basic-change-stream.js` - Simple change stream usage
- `reactive-ui.js` - Browser UI reactivity pattern
- `filtered-changes.js` - Using pipelines to filter changes
- `multi-collection.js` - Watching multiple collections

## API Reference

### Collection.watch(pipeline, options)
### DB.watch(pipeline, options)
### MongoClient.watch(pipeline, options)

**Parameters:**
- `pipeline` (Array) - Optional aggregation pipeline to filter changes
- `options` (Object) - Optional configuration
  - `fullDocument` (String) - 'updateLookup' to include full document in updates

**Returns:** ChangeStream

### ChangeStream Methods

#### on(event, listener)
Register event handler ('change', 'close', 'error')

#### next()
Returns a Promise that resolves with the next change event

#### close()
Close the stream and clean up listeners

#### [Symbol.asyncIterator]()
Enables `for-await-of` iteration
