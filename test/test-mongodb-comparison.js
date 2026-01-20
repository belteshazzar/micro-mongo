/**
 * MongoDB Comparison Tests
 * 
 * This test suite runs the same operations against both micro-mongo and real MongoDB,
 * then compares the results to ensure compatibility.
 * 
 * Prerequisites:
 * 1. MongoDB must be running locally on mongodb://localhost:27017
 * 2. The 'mongodb' npm package must be installed: npm install mongodb
 * 
 * Run with: npm run test:comparison
 */

import * as path from 'path';
import { fileURLToPath } from 'url';
import { StorageManager } from 'node-opfs';

// Get project root directory for .opfs location
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const opfsDir = path.join(projectRoot, '.opfs-comparison');

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

import { describe, it, beforeEach, afterEach } from 'mocha';
import { ComparisonHarness } from './comparison-harness.js';

describe('MongoDB Comparison Tests', function() {
	// Increase timeout for external MongoDB operations
	this.timeout(10000);
	
	let harness;
	
	beforeEach(async function() {
		harness = new ComparisonHarness();
		await harness.connect('mongodb://localhost:27017', 'test-comparison');
	});
	
	afterEach(async function() {
		if (harness) {
			await harness.close();
		}
	});

	describe('Basic CRUD Operations', function() {
		const collectionName = 'crud_test';
		
		afterEach(async function() {
			await harness.cleanup(collectionName);
		});

		it('should insert and find documents identically', async function() {
			// Insert a document
			await harness.compareOperation(collectionName, 'insertOne', [
				{ name: 'Alice', age: 30, city: 'NYC' }
			], { skipComparison: true }); // Skip comparison for insert result

			// Find the document
			await harness.compareOperation(collectionName, 'find', [
				{ name: 'Alice' }
			]);
		});

		it('should insert multiple documents identically', async function() {
			await harness.compareOperation(collectionName, 'insertMany', [
				[
					{ name: 'Bob', age: 25 },
					{ name: 'Charlie', age: 35 },
					{ name: 'Diana', age: 28 }
				]
			], { skipComparison: true });

			// Find all documents
			await harness.compareOperation(collectionName, 'find', [{}]);
		});

		it('should update documents identically', async function() {
			await harness.compareOperation(collectionName, 'insertOne', [
				{ name: 'Eve', age: 32 }
			], { skipComparison: true });

			await harness.compareOperation(collectionName, 'updateOne', [
				{ name: 'Eve' },
				{ $set: { age: 33 } }
			], { skipComparison: true });

			// Verify update
			await harness.compareOperation(collectionName, 'findOne', [
				{ name: 'Eve' }
			]);
		});

		it('should delete documents identically', async function() {
			await harness.compareOperation(collectionName, 'insertMany', [
				[
					{ name: 'Frank', age: 40 },
					{ name: 'Grace', age: 45 }
				]
			], { skipComparison: true });

			await harness.compareOperation(collectionName, 'deleteOne', [
				{ name: 'Frank' }
			], { skipComparison: true });

			// Verify deletion
			await harness.compareOperation(collectionName, 'find', [{}]);
		});
	});

	describe('Query Operators', function() {
		const collectionName = 'query_test';
		
		beforeEach(async function() {
			// Set up test data
			await harness.compareOperation(collectionName, 'insertMany', [
				[
					{ name: 'Alice', age: 30, score: 85 },
					{ name: 'Bob', age: 25, score: 92 },
					{ name: 'Charlie', age: 35, score: 78 },
					{ name: 'Diana', age: 28, score: 95 },
					{ name: 'Eve', age: 32, score: 88 }
				]
			], { skipComparison: true });
		});
		
		afterEach(async function() {
			await harness.cleanup(collectionName);
		});

		it('should handle $gt operator', async function() {
			await harness.compareOperation(collectionName, 'find', [
				{ age: { $gt: 30 } }
			]);
		});

		it('should handle $lt operator', async function() {
			await harness.compareOperation(collectionName, 'find', [
				{ score: { $lt: 90 } }
			]);
		});

		it('should handle $gte operator', async function() {
			await harness.compareOperation(collectionName, 'find', [
				{ age: { $gte: 30 } }
			]);
		});

		it('should handle $lte operator', async function() {
			await harness.compareOperation(collectionName, 'find', [
				{ score: { $lte: 90 } }
			]);
		});

		it('should handle $in operator', async function() {
			await harness.compareOperation(collectionName, 'find', [
				{ name: { $in: ['Alice', 'Bob', 'Eve'] } }
			]);
		});

		it('should handle $nin operator', async function() {
			await harness.compareOperation(collectionName, 'find', [
				{ name: { $nin: ['Alice', 'Bob'] } }
			]);
		});

		it('should handle $and operator', async function() {
			await harness.compareOperation(collectionName, 'find', [
				{ $and: [{ age: { $gte: 25 } }, { score: { $gte: 85 } }] }
			]);
		});

		it('should handle $or operator', async function() {
			await harness.compareOperation(collectionName, 'find', [
				{ $or: [{ age: { $lt: 28 } }, { score: { $gt: 90 } }] }
			]);
		});
	});

	describe('Update Operators', function() {
		const collectionName = 'update_test';
		
		afterEach(async function() {
			await harness.cleanup(collectionName);
		});

		it('should handle $set operator', async function() {
			await harness.compareOperation(collectionName, 'insertOne', [
				{ name: 'Test', value: 10 }
			], { skipComparison: true });

			await harness.compareOperation(collectionName, 'updateOne', [
				{ name: 'Test' },
				{ $set: { value: 20 } }
			], { skipComparison: true });

			await harness.compareOperation(collectionName, 'findOne', [
				{ name: 'Test' }
			]);
		});

		it('should handle $inc operator', async function() {
			await harness.compareOperation(collectionName, 'insertOne', [
				{ name: 'Counter', count: 5 }
			], { skipComparison: true });

			await harness.compareOperation(collectionName, 'updateOne', [
				{ name: 'Counter' },
				{ $inc: { count: 3 } }
			], { skipComparison: true });

			await harness.compareOperation(collectionName, 'findOne', [
				{ name: 'Counter' }
			]);
		});

		it('should handle $push operator', async function() {
			await harness.compareOperation(collectionName, 'insertOne', [
				{ name: 'List', items: [1, 2, 3] }
			], { skipComparison: true });

			await harness.compareOperation(collectionName, 'updateOne', [
				{ name: 'List' },
				{ $push: { items: 4 } }
			], { skipComparison: true });

			await harness.compareOperation(collectionName, 'findOne', [
				{ name: 'List' }
			]);
		});

		it('should handle $unset operator', async function() {
			await harness.compareOperation(collectionName, 'insertOne', [
				{ name: 'Remove', field1: 'value1', field2: 'value2' }
			], { skipComparison: true });

			await harness.compareOperation(collectionName, 'updateOne', [
				{ name: 'Remove' },
				{ $unset: { field2: '' } }
			], { skipComparison: true });

			await harness.compareOperation(collectionName, 'findOne', [
				{ name: 'Remove' }
			]);
		});
	});

	describe('Aggregation Pipeline', function() {
		const collectionName = 'agg_test';
		
		beforeEach(async function() {
			await harness.compareOperation(collectionName, 'insertMany', [
				[
					{ product: 'Widget', price: 10, quantity: 5, category: 'Tools' },
					{ product: 'Gadget', price: 20, quantity: 3, category: 'Electronics' },
					{ product: 'Doohickey', price: 15, quantity: 2, category: 'Tools' },
					{ product: 'Gizmo', price: 25, quantity: 4, category: 'Electronics' }
				]
			], { skipComparison: true });
		});
		
		afterEach(async function() {
			await harness.cleanup(collectionName);
		});

		it('should handle $match stage', async function() {
			await harness.compareOperation(collectionName, 'aggregate', [
				[
					{ $match: { category: 'Tools' } }
				]
			]);
		});

		it('should handle $group stage', async function() {
			await harness.compareOperation(collectionName, 'aggregate', [
				[
					{ $group: { 
						_id: '$category',
						count: { $sum: 1 },
						avgPrice: { $avg: '$price' }
					}}
				]
			]);
		});

		it('should handle $sort stage', async function() {
			await harness.compareOperation(collectionName, 'aggregate', [
				[
					{ $sort: { price: -1 } }
				]
			]);
		});

		it('should handle $project stage', async function() {
			await harness.compareOperation(collectionName, 'aggregate', [
				[
					{ $project: { 
						product: 1,
						total: { $multiply: ['$price', '$quantity'] }
					}}
				]
			]);
		});

		it('should handle combined pipeline', async function() {
			await harness.compareOperation(collectionName, 'aggregate', [
				[
					{ $match: { price: { $gte: 15 } } },
					{ $group: { 
						_id: '$category',
						totalQuantity: { $sum: '$quantity' }
					}},
					{ $sort: { totalQuantity: -1 } }
				]
			]);
		});
	});

	describe('Complex Queries', function() {
		const collectionName = 'complex_test';
		
		beforeEach(async function() {
			await harness.compareOperation(collectionName, 'insertMany', [
				[
					{ 
						name: 'John',
						address: { city: 'NYC', zip: '10001' },
						tags: ['developer', 'javascript'],
						scores: [85, 90, 88]
					},
					{
						name: 'Jane',
						address: { city: 'LA', zip: '90001' },
						tags: ['designer', 'css'],
						scores: [92, 87, 95]
					},
					{
						name: 'Bob',
						address: { city: 'NYC', zip: '10002' },
						tags: ['developer', 'python'],
						scores: [78, 82, 80]
					}
				]
			], { skipComparison: true });
		});
		
		afterEach(async function() {
			await harness.cleanup(collectionName);
		});

		it('should handle nested field queries', async function() {
			await harness.compareOperation(collectionName, 'find', [
				{ 'address.city': 'NYC' }
			]);
		});

		it('should handle array queries', async function() {
			await harness.compareOperation(collectionName, 'find', [
				{ tags: 'developer' }
			]);
		});

		it('should handle $elemMatch', async function() {
			await harness.compareOperation(collectionName, 'find', [
				{ scores: { $elemMatch: { $gte: 90 } } }
			]);
		});

		it('should handle $exists', async function() {
			await harness.compareOperation(collectionName, 'find', [
				{ 'address.city': { $exists: true } }
			]);
		});
	});

	describe('Performance: Large Dataset Operations', function() {
		this.timeout(30000); // Increase timeout for large operations
		
		const collectionName = 'performance_test';
		const docCount = 1000;
		
		beforeEach(async function() {
			// Clear collection
			await harness.cleanup(collectionName);
			
			// Insert large dataset
			const docs = Array.from({ length: docCount }, (_, i) => ({
				index: i,
				name: `User ${i}`,
				email: `user${i}@example.com`,
				age: Math.floor(Math.random() * 80) + 18,
				score: Math.random() * 100,
				active: Math.random() > 0.5,
				tags: [`tag${i % 5}`, `tag${i % 7}`, `tag${i % 11}`],
				metadata: {
					created: new Date(2024, 0, 1 + (i % 365)),
					updated: new Date(),
					count: i,
					flag: i % 2 === 0
				}
			}));
			
			console.log(`\n[Performance Test] Inserting ${docCount} documents...`);
			await harness.compareOperation(collectionName, 'insertMany', [docs], { 
				skipComparison: true 
			});
		});
		
		afterEach(async function() {
			await harness.cleanup(collectionName);
		});

		it('should handle bulk find operations on large dataset', async function() {
			await harness.compareOperation(collectionName, 'find', [{}]);
		});

		it('should handle filtered queries on large dataset', async function() {
			await harness.compareOperation(collectionName, 'find', [
				{ active: true, age: { $gte: 30 } }
			]);
		});

		it('should handle complex nested queries on large dataset', async function() {
			await harness.compareOperation(collectionName, 'find', [
				{ 'metadata.flag': true, score: { $gte: 50 } }
			]);
		});

		it('should handle range queries on large dataset', async function() {
			await harness.compareOperation(collectionName, 'find', [
				{ index: { $gte: 200, $lte: 800 } }
			]);
		});

		it('should handle bulk update operations', async function() {
			await harness.compareOperation(collectionName, 'updateMany', [
				{ active: true },
				{ $set: { score: 95 }, $inc: { 'metadata.count': 1 } }
			], { skipComparison: true });
		});

		it('should handle bulk delete operations', async function() {
			await harness.compareOperation(collectionName, 'deleteMany', [
				{ index: { $lt: 100 } }
			], { skipComparison: true });
		});

		it('should handle sequential mixed operations', async function() {
			// Series of alternating operations on the dataset
			console.log(`\n[Performance Test] Running sequential mixed operations...`);
			
			// Find all
			await harness.compareOperation(collectionName, 'find', [{}]);
			
			// Insert one
			await harness.compareOperation(collectionName, 'insertOne', [
				{ index: 9999, name: 'New User', age: 25 }
			], { skipComparison: true });
			
			// Find with filter
			await harness.compareOperation(collectionName, 'find', [
				{ age: { $gt: 50 } }
			]);
			
			// Update
			await harness.compareOperation(collectionName, 'updateOne', [
				{ index: 9999 },
				{ $set: { age: 26 } }
			], { skipComparison: true });
			
			// Find after update
			await harness.compareOperation(collectionName, 'find', [
				{ index: 9999 }
			]);
		});
	});
});
