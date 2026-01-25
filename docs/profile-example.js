#!/usr/bin/env node
/**
 * Example script demonstrating performance profiling capabilities
 * 
 * This script shows how to use both PerformanceTimer and NodeProfiler
 * to analyze babymongo performance.
 * 
 * Usage:
 *   node examples/profile-example.js
 */

import * as path from 'path';
import { fileURLToPath } from 'url';
import { StorageManager } from 'node-opfs';

// Setup OPFS for Node.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const opfsDir = path.join(projectRoot, '.opfs-profile-example');

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

import { MongoClient, globalTimer, WorkerBridge } from '../main.js';
import { NodeProfiler } from '../src/NodeProfiler.js';

// Configuration
const DOCUMENT_COUNT = 100; // Reduced for quick demo
const DB_NAME = 'profile-example';
const COLLECTION_NAME = 'users';

/**
 * Generate test data
 */
function generateTestData(count) {
  const data = [];
  const statuses = ['active', 'inactive', 'pending'];
  const roles = ['user', 'admin', 'moderator'];
  
  for (let i = 0; i < count; i++) {
    data.push({
      userId: `user_${i}`,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      age: Math.floor(Math.random() * 60) + 18,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      role: roles[Math.floor(Math.random() * roles.length)],
      score: Math.floor(Math.random() * 100),
      tags: [`tag${i % 5}`, `tag${i % 7}`]
    });
  }
  
  return data;
}

/**
 * Run example operations with profiling
 */
async function main() {
  console.log('='.repeat(70));
  console.log('Performance Profiling Example');
  console.log('='.repeat(70));
  console.log(`\nGenerating ${DOCUMENT_COUNT} test documents...\n`);
  
  // Enable both profilers
  globalTimer.setEnabled(true);
  const profiler = new NodeProfiler({ enabled: true, trackMemory: true });
  
  try {
    // Connect to babymongo
    profiler.mark('connect-start');
    const bridge = await WorkerBridge.create();
    const client = new MongoClient(`mongodb://localhost/${DB_NAME}`, { workerBridge: bridge });
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    profiler.mark('connect-end');
    profiler.measure('connection', 'connect-start', 'connect-end');
    
    console.log('✓ Connected to babymongo\n');
    
    // Clear any existing data
    await collection.deleteMany({});
    
    // Test 1: Bulk Insert
    console.log('Test 1: Bulk Insert');
    console.log('-'.repeat(70));
    const testData = generateTestData(DOCUMENT_COUNT);
    
    profiler.mark('insert-start');
    console.log(`Inserting ${DOCUMENT_COUNT} documents...`);
    await collection.insertMany(testData);
    profiler.mark('insert-end');
    profiler.measure('bulk-insert', 'insert-start', 'insert-end');
    console.log('✓ Insert complete\n');
    
    // Test 2: Simple Query
    console.log('Test 2: Simple Query');
    console.log('-'.repeat(70));
    
    profiler.mark('query1-start');
    const results1 = await collection.find({ age: { $gte: 30 } }).toArray();
    profiler.mark('query1-end');
    profiler.measure('query', 'query1-start', 'query1-end');
    console.log(`✓ Found ${results1.length} documents\n`);
    
    // Test 3: Aggregation
    console.log('Test 3: Aggregation');
    console.log('-'.repeat(70));
    
    profiler.mark('agg-start');
    const aggResults = await collection.aggregate([
      { $match: { age: { $gte: 25 } } },
      { $group: { 
        _id: '$status', 
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } }
    ]).toArray();
    profiler.mark('agg-end');
    profiler.measure('aggregation', 'agg-start', 'agg-end');
    console.log(`✓ Aggregation complete, ${aggResults.length} groups\n`);
    
    // Close connection
    await client.close();
    await bridge.terminate();
    
    // Display results
    console.log('\n' + '='.repeat(70));
    console.log('PERFORMANCE RESULTS');
    console.log('='.repeat(70) + '\n');
    
    // Show high-level timings from profiler
    const report = profiler.getReport();
    console.log('HIGH-LEVEL TIMINGS:');
    console.log('-'.repeat(70));
    for (const measure of report.measures) {
      console.log(`${measure.name}: ${measure.duration.toFixed(3)}ms`);
    }
    
    console.log('\n');
    
    // Show detailed internal timings
    console.log(globalTimer.formatTimings());
    
    console.log('='.repeat(70));
    console.log('Example complete!');
    console.log('='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('Error during profiling:', error);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
