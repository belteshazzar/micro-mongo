# Storage Engine

Micro-Mongo now supports persistent storage of database state, including documents and indexes, through a pluggable storage engine architecture.

## Overview

The storage engine allows you to:
- Save database state to persistent storage (IndexedDB in browsers, or custom implementations)
- Restore database state from storage
- Preserve all index types (regular, text, geospatial)
- Save/load individual collections or entire databases

## Storage Engine Types

### ObjectStorageEngine (Default)

In-memory storage that doesn't persist data between sessions. Useful for testing serialization/deserialization logic.

```javascript
import { MongoClient, ObjectStorageEngine } from 'micro-mongo';

const storageEngine = new ObjectStorageEngine();
const client = await MongoClient.connect('mongodb://localhost:27017', {
    storageEngine: storageEngine
});
const db = client.db('myapp');

// Use database normally...
await db.users.insertOne({ name: 'Alice' });

// Save state
await db.saveToStorage();

// Later, restore state
await db.loadFromStorage();
```

### IndexedDbStorageEngine

Browser-based persistent storage using IndexedDB. Data persists across browser sessions.

```javascript
import { MongoClient, IndexedDbStorageEngine } from 'micro-mongo';

const storageEngine = new IndexedDbStorageEngine('my-app-db');
const client = await MongoClient.connect('mongodb://localhost:27017', {
    storageEngine: storageEngine
});
const db = client.db('myapp');

// Use database normally...
await db.users.insertOne({ name: 'Alice' });
await db.users.createIndex({ name: 1 });

// Save to IndexedDB
await db.saveToStorage();

// Data persists across page reloads!
// Next time you load the page:
await db.loadFromStorage();
```

## API

### Database Methods

#### `db.saveToStorage()`

Save the entire database state (all collections and indexes) to the configured storage engine.

```javascript
await db.saveToStorage();
```

**Throws:** Error if no storage engine is configured.

#### `db.loadFromStorage()`

Load the entire database state from the configured storage engine. This will drop all existing collections and restore them from storage.

```javascript
await db.loadFromStorage();
```

**Throws:** Error if no storage engine is configured.

#### `db.saveCollection(collectionName)`

Save a specific collection to the storage engine.

```javascript
await db.saveCollection('users');
```

**Parameters:**
- `collectionName` (string): Name of the collection to save

**Throws:** 
- Error if no storage engine is configured
- Error if collection doesn't exist

#### `db.loadCollection(collectionName)`

Load a specific collection from the storage engine.

```javascript
await db.loadCollection('users');
```

**Parameters:**
- `collectionName` (string): Name of the collection to load

**Throws:** Error if no storage engine is configured.

## Custom Storage Engines

You can create custom storage engines by extending the `StorageEngine` base class:

```javascript
import { StorageEngine } from 'micro-mongo';

class MyCustomStorageEngine extends StorageEngine {
    async initialize() {
        // Setup your storage backend
    }

    async saveDatabase(dbState) {
        // Save dbState to your backend
        // dbState = { name: string, collections: { [name]: { documents, indexes } } }
    }

    async loadDatabase(dbName) {
        // Load and return dbState from your backend
        // Return null if database doesn't exist
    }

    async saveCollection(dbName, collectionName, collectionState) {
        // Save collectionState to your backend
        // collectionState = { documents: [], indexes: [] }
    }

    async loadCollection(dbName, collectionName) {
        // Load and return collectionState from your backend
        // Return null if collection doesn't exist
    }

    async deleteCollection(dbName, collectionName) {
        // Delete collection from your backend
    }

    async deleteDatabase(dbName) {
        // Delete entire database from your backend
    }

    async close() {
        // Cleanup resources
    }
}
```

## Supported Index Types

All index types are fully supported for serialization:

### Regular Indexes

```javascript
await db.users.createIndex({ age: 1 });
await db.saveToStorage();
await db.loadFromStorage();
// Index is restored and functional
```

### Text Indexes

```javascript
await db.articles.createIndex({ title: 'text', content: 'text' });
await db.saveToStorage();
await db.loadFromStorage();
// Text search works immediately after restore
const results = await db.articles.find({ title: { $text: 'search query' } }).toArray();
```

### Geospatial Indexes

```javascript
await db.places.createIndex({ location: '2dsphere' });
await db.saveToStorage();
await db.loadFromStorage();
// Geospatial queries work immediately after restore
const results = await db.places.find({
    location: { $geoWithin: [[-74, 41], [-73, 40]] }
}).toArray();
```

### Compound Indexes

```javascript
await db.users.createIndex({ age: 1, city: 1 });
await db.saveToStorage();
await db.loadFromStorage();
// Compound index is restored
```

## Example: Auto-save on Changes

```javascript
import { MongoClient, IndexedDbStorageEngine } from 'micro-mongo';

const storageEngine = new IndexedDbStorageEngine('my-app');
const client = await MongoClient.connect('mongodb://localhost:27017', {
    storageEngine: storageEngine
});
const db = client.db('myapp');

// Load existing data on startup
await db.loadFromStorage();

// Auto-save after modifications
async function saveUser(user) {
    await db.users.insertOne(user);
    await db.saveCollection('users');
}

async function updateUser(query, update) {
    await db.users.updateOne(query, update);
    await db.saveCollection('users');
}
```

## Example: Multiple Databases

```javascript
// You can have multiple databases with separate storage
const storageEngine1 = new IndexedDbStorageEngine('app1-db');
const client1 = await MongoClient.connect('mongodb://localhost:27017', {
    storageEngine: storageEngine1
});
const db1 = client1.db('app1');

const storageEngine2 = new IndexedDbStorageEngine('app2-db');
const client2 = await MongoClient.connect('mongodb://localhost:27017', {
    storageEngine: storageEngine2
});
const db2 = client2.db('app2');

// Each database saves to its own IndexedDB instance
await db1.saveToStorage();
await db2.saveToStorage();
```

## Performance Considerations

- **Serialization overhead**: Saving large datasets will take time to serialize. Consider saving individual collections frequently rather than the entire database.
- **IndexedDB limits**: Browser IndexedDB implementations have storage limits (typically several hundred MB to GB depending on the browser).
- **Index rebuild**: When loading from storage, indexes are restored with their data intact, so no rebuild is necessary.

## Browser Compatibility

IndexedDB is supported in all modern browsers:
- Chrome 24+
- Firefox 16+
- Safari 10+
- Edge (all versions)

For older browsers, consider using a polyfill or fallback to in-memory storage.

## Testing

See `test/test-storage-engine.js` for comprehensive examples of storage engine usage.

For browser testing with IndexedDB, see `test-indexeddb.html`.
