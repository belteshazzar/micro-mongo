/**
 * Filtered Changes Example
 * 
 * Demonstrates using aggregation pipelines to filter change events
 */

import { MongoClient } from '../main.js';

async function filteredExample() {
  console.log('=== Filtered Change Stream Example ===\n');

  const client = new MongoClient();
  await client.connect();
  const db = client.db('example');
  const collection = db.collection('users');

  // Example 1: Filter by operation type
  console.log('Example 1: Only watch for INSERT operations\n');
  const insertStream = collection.watch([
    { $match: { operationType: 'insert' } }
  ]);

  insertStream.on('change', (change) => {
    console.log('New user inserted:', change.fullDocument.name);
  });

  await collection.insertOne({ name: 'Alice' });
  await collection.insertOne({ name: 'Bob' });
  await collection.updateOne({ name: 'Alice' }, { $set: { age: 30 } }); // Won't be seen
  await collection.deleteOne({ name: 'Bob' }); // Won't be seen

  await new Promise(resolve => setTimeout(resolve, 100));
  insertStream.close();

  // Example 2: Filter by document fields
  console.log('\nExample 2: Only watch for users with age >= 30\n');
  const ageStream = collection.watch([
    { $match: { 'fullDocument.age': { $gte: 30 } } }
  ]);

  ageStream.on('change', (change) => {
    console.log('Mature user detected:', change.fullDocument.name, '- age:', change.fullDocument.age);
  });

  await collection.insertOne({ name: 'Charlie', age: 35 });
  await collection.insertOne({ name: 'David', age: 25 }); // Won't be seen
  await collection.insertOne({ name: 'Eve', age: 40 });

  await new Promise(resolve => setTimeout(resolve, 100));
  ageStream.close();

  // Example 3: Filter updates to specific fields
  console.log('\nExample 3: Only watch for status changes\n');
  const statusStream = collection.watch([
    { 
      $match: { 
        operationType: 'update',
        'updateDescription.updatedFields.status': { $exists: true }
      } 
    }
  ]);

  statusStream.on('change', (change) => {
    console.log('Status changed for user:', change.documentKey._id);
    console.log('New status:', change.updateDescription.updatedFields.status);
  });

  await collection.insertOne({ _id: 1, name: 'Frank', status: 'active' });
  await collection.updateOne({ _id: 1 }, { $set: { age: 30 } }); // Won't be seen
  await collection.updateOne({ _id: 1 }, { $set: { status: 'inactive' } }); // Will be seen

  await new Promise(resolve => setTimeout(resolve, 100));
  statusStream.close();

  // Example 4: Complex filter
  console.log('\nExample 4: Watch for active users being updated\n');
  const complexStream = collection.watch([
    { 
      $match: { 
        operationType: { $in: ['insert', 'update'] },
        'fullDocument.status': 'active'
      } 
    }
  ]);

  complexStream.on('change', (change) => {
    console.log(`Active user ${change.operationType}:`, change.fullDocument.name);
  });

  await collection.insertOne({ name: 'Grace', status: 'active' }); // Will be seen
  await collection.insertOne({ name: 'Henry', status: 'inactive' }); // Won't be seen
  await collection.updateOne({ name: 'Grace' }, { $set: { age: 28, status: 'active' } }); // Will be seen

  await new Promise(resolve => setTimeout(resolve, 100));
  complexStream.close();

  console.log('\n=== Example Complete ===\n');
}

filteredExample().catch(console.error);
