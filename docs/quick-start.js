/**
 * Quick Start Example for Change Streams
 * 
 * Run this file to see change streams in action!
 * Usage: node docs/quick-start.js
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

import { MongoClient, WorkerBridge } from '../main.js';

async function quickStart() {
  console.log('🚀 Change Streams Quick Start\n');

  // Create and connect the worker bridge first
  const bridge = await WorkerBridge.create();

  try {
    // Setup
    const client = new MongoClient('mongodb://localhost:27017', { workerBridge: bridge });
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
  } finally {
    await bridge.terminate();
  }
}

quickStart()
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
