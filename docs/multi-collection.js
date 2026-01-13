/**
 * Multi-Collection Watching Example
 * 
 * Demonstrates watching multiple collections and databases simultaneously
 */

import * as path from 'path';
import { fileURLToPath } from 'url';
import { StorageManager } from 'node-opfs';

// Setup OPFS for Node.js environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const opfsDir = path.join(projectRoot, '.opfs');

const customStorage = new StorageManager(opfsDir);
const opfsNavigator = {
  storage: {
    getDirectory: () => customStorage.getDirectory()
  }
};

if (typeof globalThis.navigator === 'undefined') {
  globalThis.navigator = opfsNavigator;
} else {
  globalThis.navigator.storage = opfsNavigator.storage;
}

import { MongoClient } from '../main.js';

async function multiCollectionExample() {
  console.log('=== Multi-Collection Watching Example ===\n');

  const client = new MongoClient();
  await client.connect();
  const db = client.db('multiapp');

  // Example 1: Watch all collections in a database
  console.log('Example 1: Watch all collections in a database\n');

  const dbStream = db.watch();
  const dbChanges = [];

  dbStream.on('change', (change) => {
    console.log(`[${change.ns.coll}] ${change.operationType}:`, 
                change.fullDocument?.name || change.documentKey._id);
    dbChanges.push(change);
  });

  // Make changes to different collections
  await db.collection('users').insertOne({ name: 'Alice' });
  await db.collection('posts').insertOne({ name: 'First Post' });
  await db.collection('comments').insertOne({ name: 'Great post!' });

  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log(`\nTotal changes detected: ${dbChanges.length}\n`);
  dbStream.close();

  // Example 2: Watch all databases and collections (client level)
  console.log('Example 2: Watch all databases\n');

  const clientStream = client.watch();
  const clientChanges = [];

  clientStream.on('change', (change) => {
    console.log(`[${change.ns.db}.${change.ns.coll}] ${change.operationType}`);
    clientChanges.push(change);
  });

  // Make changes to different databases
  await client.db('db1').collection('col1').insertOne({ x: 1 });
  await client.db('db2').collection('col2').insertOne({ y: 2 });
  await client.db('db3').collection('col3').insertOne({ z: 3 });

  await new Promise(resolve => setTimeout(resolve, 100));

  console.log(`\nTotal changes across all databases: ${clientChanges.length}\n`);
  clientStream.close();

  // Example 3: Watch multiple specific collections
  console.log('Example 3: Watch multiple specific collections with separate streams\n');

  const usersStream = db.collection('users').watch();
  const postsStream = db.collection('posts').watch();

  usersStream.on('change', (change) => {
    console.log('[Users]', change.operationType, '-', change.fullDocument?.name);
  });

  postsStream.on('change', (change) => {
    console.log('[Posts]', change.operationType, '-', change.fullDocument?.title);
  });

  await db.collection('users').insertOne({ name: 'Bob' });
  await db.collection('posts').insertOne({ title: 'Second Post' });
  await db.collection('users').insertOne({ name: 'Charlie' });
  await db.collection('posts').insertOne({ title: 'Third Post' });

  await new Promise(resolve => setTimeout(resolve, 100));

  usersStream.close();
  postsStream.close();

  // Example 4: Aggregate changes from multiple collections
  console.log('\nExample 4: Aggregate statistics from multiple collections\n');

  const stats = {
    userInserts: 0,
    postInserts: 0,
    totalChanges: 0
  };

  const aggregateStream = db.watch();

  aggregateStream.on('change', (change) => {
    stats.totalChanges++;
    
    if (change.operationType === 'insert') {
      if (change.ns.coll === 'users') stats.userInserts++;
      if (change.ns.coll === 'posts') stats.postInserts++;
    }
  });

  // Generate some activity
  for (let i = 0; i < 5; i++) {
    await db.collection('users').insertOne({ name: `User ${i}` });
    await db.collection('posts').insertOne({ title: `Post ${i}` });
  }

  await new Promise(resolve => setTimeout(resolve, 100));

  console.log('Statistics:');
  console.log('  User inserts:', stats.userInserts);
  console.log('  Post inserts:', stats.postInserts);
  console.log('  Total changes:', stats.totalChanges);

  aggregateStream.close();

  console.log('\n=== Example Complete ===\n');
}

async function crossDatabaseExample() {
  console.log('=== Cross-Database Coordination Example ===\n');

  const client = new MongoClient();
  await client.connect();

  // Watch for changes across all databases
  const changeStream = client.watch();

  // Track activity across databases
  const activity = new Map();

  changeStream.on('change', (change) => {
    const dbName = change.ns.db;
    
    if (!activity.has(dbName)) {
      activity.set(dbName, { inserts: 0, updates: 0, deletes: 0 });
    }

    const stats = activity.get(dbName);
    stats[change.operationType + 's'] = (stats[change.operationType + 's'] || 0) + 1;

    console.log(`[${dbName}] ${change.operationType} in ${change.ns.coll}`);
  });

  // Simulate multi-database application
  const analytics = client.db('analytics');
  const sales = client.db('sales');
  const inventory = client.db('inventory');

  await analytics.collection('events').insertOne({ event: 'page_view' });
  await sales.collection('orders').insertOne({ amount: 100 });
  await inventory.collection('products').insertOne({ sku: 'ABC123' });

  await sales.collection('orders').updateOne({}, { $set: { status: 'shipped' } });
  await inventory.collection('products').deleteOne({ sku: 'ABC123' });

  await new Promise(resolve => setTimeout(resolve, 100));

  console.log('\nActivity Summary:');
  for (const [dbName, stats] of activity.entries()) {
    console.log(`  ${dbName}:`, JSON.stringify(stats));
  }

  changeStream.close();

  console.log('\n=== Example Complete ===\n');
}

// Run examples
if (import.meta.url === `file://${process.argv[1]}`) {
  multiCollectionExample()
    .then(() => crossDatabaseExample())
    .catch(console.error);
}

export { multiCollectionExample, crossDatabaseExample };
