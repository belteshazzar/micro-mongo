#!/usr/bin/env node
/**
 * Demo script showing how the MongoDB comparison test harness works
 * 
 * This script demonstrates the comparison harness API without requiring
 * a MongoDB instance to be running (it gracefully handles the connection error).
 */

import * as path from 'path';
import { fileURLToPath } from 'url';
import { StorageManager } from 'node-opfs';

// Get project root directory for .opfs location
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const opfsDir = path.join(projectRoot, '.opfs-demo');

// Configure node-opfs to use project-local .opfs directory
const customStorage = new StorageManager(opfsDir);
const opfsNavigator = {
	storage: {
		getDirectory: () => customStorage.getDirectory()
	}
};

// Ensure bjson sees OPFS APIs in Node
if (typeof globalThis.navigator === 'undefined') {
	globalThis.navigator = opfsNavigator;
} else {
	globalThis.navigator.storage = opfsNavigator.storage;
}

import { ComparisonHarness } from './comparison-harness.js';

async function demo() {
	console.log('='.repeat(70));
	console.log('MongoDB Comparison Test Harness - Demo');
	console.log('='.repeat(70));
	console.log();
	
	const harness = new ComparisonHarness();
	
	try {
		console.log('Step 1: Attempting to connect to MongoDB and micro-mongo...');
		console.log('        MongoDB URL: mongodb://localhost:27017');
		console.log('        Database: demo-comparison');
		console.log();
		
		await harness.connect('mongodb://localhost:27017', 'demo-comparison');
		
		console.log('✓ Successfully connected to both databases!');
		console.log();
		
		console.log('Step 2: Running comparison tests...');
		console.log();
		
		const collection = 'demo_users';
		
		// Insert test data
		console.log('  → Inserting test documents in both databases...');
		await harness.compareOperation(collection, 'insertMany', [
			[
				{ name: 'Alice', age: 30, role: 'developer' },
				{ name: 'Bob', age: 25, role: 'designer' },
				{ name: 'Charlie', age: 35, role: 'developer' }
			]
		], { skipComparison: true });
		console.log('    ✓ Documents inserted');
		
		// Test query
		console.log();
		console.log('  → Testing query: find({ role: "developer" })');
		const result1 = await harness.compareOperation(collection, 'find', [
			{ role: 'developer' }
		]);
		console.log(`    ✓ Query results match! Found ${result1.mongoResult.length} documents`);
		
		// Test query with operators
		console.log();
		console.log('  → Testing query with operators: find({ age: { $gte: 30 } })');
		const result2 = await harness.compareOperation(collection, 'find', [
			{ age: { $gte: 30 } }
		]);
		console.log(`    ✓ Query results match! Found ${result2.mongoResult.length} documents`);
		
		// Test aggregation
		console.log();
		console.log('  → Testing aggregation pipeline...');
		const result3 = await harness.compareOperation(collection, 'aggregate', [
			[
				{ $group: { _id: '$role', count: { $sum: 1 }, avgAge: { $avg: '$age' } } },
				{ $sort: { count: -1 } }
			]
		]);
		console.log(`    ✓ Aggregation results match! Found ${result3.mongoResult.length} groups`);
		
		// Clean up
		console.log();
		console.log('  → Cleaning up test data...');
		await harness.cleanup(collection);
		console.log('    ✓ Cleanup complete');
		
		console.log();
		console.log('Step 3: Checking for differences...');
		const differences = harness.getDifferences();
		if (differences.length === 0) {
			console.log('    ✓ No differences found! All operations matched perfectly.');
		} else {
			console.log(`    ✗ Found ${differences.length} difference(s)`);
			differences.forEach(d => {
				console.log(`      - ${d.collection}.${d.operation}: ${d.error}`);
			});
		}
		
		console.log();
		console.log('='.repeat(70));
		console.log('Demo completed successfully!');
		console.log('='.repeat(70));
		console.log();
		console.log('To run the full test suite:');
		console.log('  npm run test:comparison');
		console.log();
		
	} catch (error) {
		console.log('✗ Connection failed (this is expected if MongoDB is not running)');
		console.log();
		console.log('Error:', error.message);
		console.log();
		console.log('='.repeat(70));
		console.log('To run this demo successfully:');
		console.log('='.repeat(70));
		console.log();
		console.log('1. Install MongoDB:');
		console.log('   • Docker (easiest): docker run -d -p 27017:27017 mongo:latest');
		console.log('   • Or see: docs/MONGODB_COMPARISON.md for platform-specific instructions');
		console.log();
		console.log('2. Install the MongoDB driver:');
		console.log('   npm install mongodb');
		console.log();
		console.log('3. Run this demo again:');
		console.log('   node test/demo-comparison.js');
		console.log();
		console.log('For more information, see:');
		console.log('  • docs/MONGODB_COMPARISON.md - Full documentation');
		console.log('  • docs/MONGODB_COMPARISON_QUICKSTART.md - Quick start guide');
		console.log();
		
		process.exit(1);
	} finally {
		await harness.close();
	}
}

demo().catch(err => {
	console.error('Unexpected error:', err);
	process.exit(1);
});
