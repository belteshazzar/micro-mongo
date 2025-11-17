/**
 * Basic Change Stream Example
 * 
 * Demonstrates basic usage of change streams to watch for data changes
 */

import { MongoClient } from '../main.js';

async function basicExample() {
  console.log('=== Basic Change Stream Example ===\n');

  // Create client and connect
  const client = new MongoClient();
  await client.connect();
  const db = client.db('example');
  const collection = db.collection('users');

  // Create a change stream
  const changeStream = collection.watch();

  // Listen for changes
  changeStream.on('change', (change) => {
    console.log('\n--- Change Detected ---');
    console.log('Operation:', change.operationType);
    console.log('Collection:', change.ns.coll);
    
    switch (change.operationType) {
      case 'insert':
        console.log('Inserted document:', change.fullDocument);
        break;
      case 'update':
        console.log('Document ID:', change.documentKey._id);
        console.log('Updated fields:', change.updateDescription.updatedFields);
        console.log('Removed fields:', change.updateDescription.removedFields);
        break;
      case 'replace':
        console.log('Replaced with:', change.fullDocument);
        break;
      case 'delete':
        console.log('Deleted document ID:', change.documentKey._id);
        break;
    }
  });

  changeStream.on('close', () => {
    console.log('\n--- Change Stream Closed ---');
  });

  // Perform various operations
  console.log('\n1. Inserting documents...');
  await collection.insertOne({ _id: 1, name: 'Alice', age: 30, city: 'NYC' });
  await collection.insertOne({ _id: 2, name: 'Bob', age: 25, city: 'SF' });

  // Wait for events to propagate
  await new Promise(resolve => setTimeout(resolve, 100));

  console.log('\n2. Updating a document...');
  await collection.updateOne({ _id: 1 }, { $set: { age: 31, status: 'active' } });

  await new Promise(resolve => setTimeout(resolve, 100));

  console.log('\n3. Replacing a document...');
  await collection.replaceOne({ _id: 2 }, { name: 'Bob Smith', age: 26 });

  await new Promise(resolve => setTimeout(resolve, 100));

  console.log('\n4. Deleting a document...');
  await collection.deleteOne({ _id: 1 });

  await new Promise(resolve => setTimeout(resolve, 100));

  // Close the change stream
  changeStream.close();

  console.log('\n=== Example Complete ===\n');
}

// Run the example
basicExample().catch(console.error);
