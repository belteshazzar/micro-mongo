/**
 * Quick Start Example for Change Streams
 * 
 * Run this file to see change streams in action!
 * Usage: node examples/quick-start.js
 */

import { MongoClient } from '../main.js';

async function quickStart() {
  console.log('🚀 Change Streams Quick Start\n');

  // Setup
  const client = new MongoClient();
  await client.connect();
  const db = client.db('quickstart');
  const collection = db.collection('todos');

  // Create a change stream
  const changeStream = collection.watch();

  // Listen for changes
  changeStream.on('change', (change) => {
    console.log(`\n📢 ${change.operationType.toUpperCase()} event:`);
    
    switch (change.operationType) {
      case 'insert':
        console.log(`   ✅ New todo: "${change.fullDocument.title}"`);
        break;
      case 'update':
        console.log(`   ✏️  Updated todo ${change.documentKey._id}`);
        console.log(`   Changed fields:`, change.updateDescription.updatedFields);
        break;
      case 'delete':
        console.log(`   🗑️  Deleted todo ${change.documentKey._id}`);
        break;
    }
  });

  console.log('👀 Watching for changes...\n');

  // Simulate some activity
  console.log('1️⃣  Creating todos...');
  await collection.insertOne({ _id: 1, title: 'Learn Change Streams', completed: false });
  await new Promise(resolve => setTimeout(resolve, 100));

  await collection.insertOne({ _id: 2, title: 'Build Reactive UI', completed: false });
  await new Promise(resolve => setTimeout(resolve, 100));

  console.log('\n2️⃣  Completing a todo...');
  await collection.updateOne({ _id: 1 }, { $set: { completed: true } });
  await new Promise(resolve => setTimeout(resolve, 100));

  console.log('\n3️⃣  Deleting a todo...');
  await collection.deleteOne({ _id: 2 });
  await new Promise(resolve => setTimeout(resolve, 100));

  // Cleanup
  console.log('\n✨ Done! Closing change stream...\n');
  changeStream.close();
}

quickStart().catch(console.error);
