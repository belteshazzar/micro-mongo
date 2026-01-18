/**
 * Example: Sharing a Worker Between Multiple MongoClient Instances
 * 
 * This demonstrates how to:
 * 1. Create a single worker that multiple clients can share
 * 2. Connect multiple MongoClient instances to the same worker
 * 3. Properly manage worker lifecycle
 */

import { MongoClient, WorkerBridge } from '../main.js';

async function demonstrateSharedWorker() {
  console.log('=== Shared Worker Demo ===\n');

  // Option 1: Create a shared worker explicitly
  console.log('Creating shared worker...');
  const sharedBridge = await WorkerBridge.create();
  console.log('✓ Worker created\n');

  // Connect multiple clients to the same worker
  const client1 = new MongoClient('mongodb://localhost/db1', { 
    workerBridge: sharedBridge 
  });
  const client2 = new MongoClient('mongodb://localhost/db2', { 
    workerBridge: sharedBridge 
  });
  const client3 = new MongoClient('mongodb://localhost/db3', { 
    workerBridge: sharedBridge 
  });

  await client1.connect();
  await client2.connect();
  await client3.connect();
  console.log('✓ Connected 3 clients to shared worker\n');

  // Each client accesses its own database
  const db1 = client1.db();
  const db2 = client2.db();
  const db3 = client3.db();

  // Perform operations on different databases via the same worker
  await db1.createCollection('users');
  await db2.createCollection('products');
  await db3.createCollection('orders');

  console.log('Collections in db1:', await db1.getCollectionNames());
  console.log('Collections in db2:', await db2.getCollectionNames());
  console.log('Collections in db3:', await db3.getCollectionNames());
  console.log('');

  // Close clients (won't terminate shared bridge since they don't own it)
  await client1.close();
  await client2.close();
  await client3.close();
  console.log('✓ Closed all clients\n');

  // Terminate the shared worker when done
  await sharedBridge.terminate();
  console.log('✓ Worker terminated\n');
}

async function demonstrateIndividualWorkers() {
  console.log('=== Individual Workers Demo ===\n');

  // Option 2: Each client creates its own worker (default behavior)
  const client1 = new MongoClient('mongodb://localhost/db1?useWorker=true');
  const client2 = new MongoClient('mongodb://localhost/db2?useWorker=true');

  await client1.connect();
  await client2.connect();
  console.log('✓ Connected 2 clients with individual workers\n');

  const db1 = client1.db();
  const db2 = client2.db();

  await db1.createCollection('users');
  await db2.createCollection('products');

  console.log('Collections in db1:', await db1.getCollectionNames());
  console.log('Collections in db2:', await db2.getCollectionNames());
  console.log('');

  // Each client terminates its own worker on close
  await client1.close();
  await client2.close();
  console.log('✓ Closed all clients (workers terminated automatically)\n');
}

async function demonstrateHybridApproach() {
  console.log('=== Hybrid Approach Demo ===\n');

  // Mix of shared and individual workers
  const sharedBridge = await WorkerBridge.create();

  const sharedClient1 = new MongoClient('mongodb://localhost/shared1', { 
    workerBridge: sharedBridge 
  });
  const sharedClient2 = new MongoClient('mongodb://localhost/shared2', { 
    workerBridge: sharedBridge 
  });
  const individualClient = new MongoClient('mongodb://localhost/individual?useWorker=true');

  await Promise.all([
    sharedClient1.connect(),
    sharedClient2.connect(),
    individualClient.connect()
  ]);

  console.log('✓ 2 clients sharing one worker, 1 client with its own worker\n');

  const db1 = sharedClient1.db();
  const db2 = sharedClient2.db();
  const db3 = individualClient.db();

  await Promise.all([
    db1.createCollection('users'),
    db2.createCollection('products'),
    db3.createCollection('orders')
  ]);

  console.log('Shared worker databases:');
  console.log('  db1:', await db1.getCollectionNames());
  console.log('  db2:', await db2.getCollectionNames());
  console.log('Individual worker database:');
  console.log('  db3:', await db3.getCollectionNames());
  console.log('');

  // Close clients
  await sharedClient1.close();
  await sharedClient2.close();
  await individualClient.close(); // This terminates its own worker
  
  // Manually terminate the shared bridge
  await sharedBridge.terminate();
  console.log('✓ All workers terminated\n');
}

// Run demos
async function runAll() {
  try {
    await demonstrateSharedWorker();
    await demonstrateIndividualWorkers();
    await demonstrateHybridApproach();
    
    console.log('✓ All demos completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('✗ Error:', err);
    process.exit(1);
  }
}

runAll();
