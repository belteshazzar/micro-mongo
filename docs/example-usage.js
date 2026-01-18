/**
 * Example usage of micro-mongo with MongoClient (similar to MongoDB driver)
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

import { MongoClient, ObjectId, WorkerBridge } from '../main.js';

async function main() {
  // Create and connect the worker bridge first
  const bridge = await WorkerBridge.create();

  try {
    // Create and connect to a client (pass the bridge as an option)
    const client = new MongoClient('mongodb://localhost:27017', { workerBridge: bridge });
    await client.connect();

  // Get a database reference
  const db = client.db('myapp');

  // ===== Dynamic Collection Creation (NEW!) =====
  // Collections are now created automatically when you access them
  // No need to call db.createCollection() first!

  // ===== ObjectId Support (NEW!) =====
  // ObjectIds are now used for _id fields by default (like real MongoDB)

  // ===== Async/Await Pattern (NEW!) =====
  // All CRUD operations now return Promises for async/await compatibility

  // Just start using db.users - it will be created automatically
  // _id will be automatically generated as an ObjectId
  await db.users.insertOne({ name: 'Alice', age: 30 });
  await db.users.insertMany([
    { name: 'Bob', age: 25 },
    { name: 'Charlie', age: 35 }
  ]);

  // You can also create custom ObjectIds
  const customId = new ObjectId();
  await db.users.insertOne({ _id: customId, name: 'Diana', age: 28 });

  // Query by ObjectId (now async!)
  console.log('\nQuery by ObjectId:');
  const diana = await db.users.findOne({ _id: customId });
  console.log(diana);

  // ObjectId has useful methods
  console.log('\nObjectId methods:');
  console.log('Hex String:', customId.toHexString());
  console.log('Timestamp:', customId.getTimestamp());
// TODO: how should this work?
//   console.log('Equals:', customId.equals(diana._id));

  // Same with db.products - auto-created on first access
  await db.products.insertMany([
    { name: 'Laptop', price: 999 },
    { name: 'Mouse', price: 25 },
    { name: 'Keyboard', price: 75 }
  ]);

  // Query documents (cursor iteration after awaiting find)
  console.log('\nUsers aged 30 or older:');
  const users = db.users.find({ age: { $gte: 30 } });
  while (await users.hasNext()) {
    const user = await users.next();
    console.log(`${user.name} (ID: ${user._id.toString()})`);
  }

  // Query with toArray() - now async!
  console.log('\nProducts over $50:');
  const expensiveProducts = await db.products.find({ price: { $gt: 50 } }).toArray();
  expensiveProducts.forEach(p => {
    console.log(`${p.name}: $${p.price} (ID: ${p._id})`);
  });

  // Async iterator support (for await...of)
  console.log('\nAll users (using async iteration):');
  for await (const user of db.users.find({})) {
    console.log(`${user.name} - ${user.age} years old`);
  }

  // Update documents (now async!)
  await db.users.updateOne({ name: 'Alice' }, { $set: { age: 31 } });

  // Delete documents (now async!)
  await db.users.deleteOne({ name: 'Bob' });

  // Aggregation pipeline (now async!)
  console.log('\nAverage product price:');
  const avgPrice = await db.products.aggregate([
    { $group: { _id: null, avgPrice: { $avg: '$price' } } }
  ]);
  console.log(avgPrice);

  // Create ObjectId from hex string
  const hexId = '507f1f77bcf86cd799439011';
  const oid = new ObjectId(hexId);
  console.log('\nCreated ObjectId from hex:', oid.toString());

  // Create ObjectId from timestamp
  const timestamp = new Date('2023-01-01').getTime();
  const timeBasedId = ObjectId.createFromTime(timestamp);
  console.log('ObjectId from timestamp:', timeBasedId.toString());
  console.log('Extracted timestamp:', timeBasedId.getTimestamp());

  // Count documents (now async!)
  const userCount = await db.users.count();
  console.log('\nTotal users:', userCount);

  // Distinct values (now async!)
  const ages = await db.users.distinct('age');
  console.log('Distinct ages:', ages);

  // List all collections
  console.log('\nAll collections:', db.getCollectionNames());

    // Close the connection
    await client.close();

    console.log('\nDone!');
  } finally {
    await bridge.terminate();
  }
}

// Run the main function
main()
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  })
  .finally(() => process.exit(0));

