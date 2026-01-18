// Web Worker for running database tests
import { MongoClient, ObjectId } from './build/micro-mongo-2.0.0.js';

self.onmessage = async function(e) {
  try {
    const { action } = e.data;
    
    if (action === 'runBasicTest') {
      await runBasicTest();
    } else if (action === 'runObjectIdTest') {
      await runObjectIdTest();
    } else if (action === 'runQueryTest') {
      await runQueryTest();
    } else if (action === 'runAggregationTest') {
      await runAggregationTest();
    }
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message });
  }
};

async function runBasicTest() {
  self.postMessage({ type: 'log', message: 'Running basic CRUD operations...', level: 'info' });

  const root = await navigator.storage.getDirectory();
  const subDirHandle = await root.getDirectoryHandle('micro-mongo', { create: true });
  const fileHandle = await subDirHandle.getFileHandle('myfile.bjson', { create: true });

  // Send progress updates back to main thread
  self.postMessage({ type: 'log', message: fileHandle.name, level: 'info' });
  
  const client = await MongoClient.connect();
  const db = client.db('testdb');
  
  // Insert
  await db.users.insertOne({ name: 'Alice', age: 30 });
  await db.users.insertOne({ name: 'Bob', age: 25 });
  await db.users.insertOne({ name: 'Charlie', age: 35 });
  
  self.postMessage({ type: 'log', message: '✓ Inserted 3 documents', level: 'success' });
  
  // Find
  const users = await db.users.find().toArray();
  self.postMessage({ type: 'logObject', label: 'All users', data: users });
  
  // Update
  await db.users.updateOne({ name: 'Bob' }, { $set: { age: 26 } });
  self.postMessage({ type: 'log', message: '✓ Updated Bob\'s age', level: 'success' });
  
  // Find updated
  const bob = await db.users.findOne({ name: 'Bob' });
  self.postMessage({ type: 'logObject', label: 'Updated Bob', data: bob });
  
  // Delete
  await db.users.deleteOne({ name: 'Charlie' });
  self.postMessage({ type: 'log', message: '✓ Deleted Charlie', level: 'success' });
  
  // Count
  const count = await db.users.count();
  self.postMessage({ type: 'log', message: `Final count: ${count} users`, level: 'success' });
  
  await client.close();
  
  self.postMessage({ type: 'complete' });
}

async function runObjectIdTest() {
  self.postMessage({ type: 'log', message: 'Testing ObjectId functionality...', level: 'info' });
  
  const client = await MongoClient.connect();
  const db = client.db('testdb');
  
  // Create custom ObjectId
  const customId = new ObjectId();
  self.postMessage({ type: 'log', message: `Generated ObjectId: ${customId.toString()}`, level: 'info' });
  self.postMessage({ type: 'log', message: `Timestamp: ${customId.getTimestamp().toISOString()}`, level: 'info' });
  
  // Insert with custom ID
  await db.items.insertOne({ _id: customId, name: 'Test Item' });
  
  // Query by ObjectId
  const found = await db.items.findOne({ _id: customId });
  self.postMessage({ type: 'logObject', label: 'Found by ObjectId', data: found });
  
  // Query by hex string
  const found2 = await db.items.findOne({ _id: customId.toString() });
  self.postMessage({ type: 'logObject', label: 'Found by hex string', data: found2 });
  
  self.postMessage({ type: 'log', message: '✓ ObjectId tests passed', level: 'success' });
  
  await client.close();
  self.postMessage({ type: 'complete' });
}

async function runQueryTest() {
  self.postMessage({ type: 'log', message: 'Testing query operators...', level: 'info' });
  
  const client = await MongoClient.connect();
  const db = client.db('testdb');
  
  // Insert test data
  await db.products.insertMany([
    { name: 'Laptop', price: 999, category: 'electronics' },
    { name: 'Mouse', price: 25, category: 'electronics' },
    { name: 'Keyboard', price: 75, category: 'electronics' },
    { name: 'Desk', price: 300, category: 'furniture' },
    { name: 'Chair', price: 150, category: 'furniture' }
  ]);
  
  self.postMessage({ type: 'log', message: '✓ Inserted 5 products', level: 'success' });
  
  // Test $gt
  const expensive = await db.products.find({ price: { $gt: 100 } }).toArray();
  self.postMessage({ type: 'logObject', label: 'Products > $100', data: expensive });
  
  // Test $in
  const electronics = await db.products.find({ 
    category: { $in: ['electronics'] } 
  }).toArray();
  self.postMessage({ type: 'logObject', label: 'Electronics', data: electronics });
  
  // Test $and
  const result = await db.products.find({ 
    $and: [
      { price: { $gte: 50 } },
      { price: { $lte: 200 } }
    ]
  }).toArray();
  self.postMessage({ type: 'logObject', label: 'Price between $50 and $200', data: result });
  
  self.postMessage({ type: 'log', message: '✓ Query tests passed', level: 'success' });
  
  await client.close();
  self.postMessage({ type: 'complete' });
}

async function runAggregationTest() {
  self.postMessage({ type: 'log', message: 'Testing aggregation pipeline...', level: 'info' });
  
  const client = await MongoClient.connect();
  const db = client.db('testdb');
  
  await db.sales.insertMany([
    { product: 'Laptop', amount: 999, quantity: 2 },
    { product: 'Mouse', amount: 25, quantity: 10 },
    { product: 'Laptop', amount: 999, quantity: 1 },
    { product: 'Keyboard', amount: 75, quantity: 3 }
  ]);
  
  self.postMessage({ type: 'log', message: '✓ Inserted sales data', level: 'success' });
  
  // Aggregation pipeline
  const result = await db.sales.aggregate([
    { $group: { 
      _id: '$product', 
      totalQuantity: { $sum: '$quantity' },
      avgAmount: { $avg: '$amount' }
    }},
    { $sort: { totalQuantity: -1 } }
  ]);
  
  self.postMessage({ type: 'logObject', label: 'Aggregation result', data: result });
  
  self.postMessage({ type: 'log', message: '✓ Aggregation tests passed', level: 'success' });
  
  await client.close();
  self.postMessage({ type: 'complete' });
}
