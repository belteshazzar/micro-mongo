/**
 * Example: Custom MongoDB Comparison Tests
 * 
 * This file demonstrates how to write your own comparison tests
 * to verify specific behavior between babymongo and MongoDB.
 * 
 * Copy this template to create your own test suites.
 */

import * as path from 'path';
import { fileURLToPath } from 'url';
import { StorageManager } from 'node-opfs';

// Standard OPFS setup for tests
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const opfsDir = path.join(projectRoot, '.opfs-custom-comparison');

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

import { describe, it, beforeEach, afterEach } from 'mocha';
import { ComparisonHarness } from './comparison-harness.js';

describe('Custom MongoDB Comparison Tests', function() {
	// Increase timeout for external MongoDB operations
	this.timeout(10000);
	
	let harness;
	
	beforeEach(async function() {
		harness = new ComparisonHarness();
		await harness.connect('mongodb://localhost:27017', 'custom-comparison');
	});
	
	afterEach(async function() {
		if (harness) {
			await harness.close();
		}
	});

	describe('Example 1: Testing a Specific Feature', function() {
		const collectionName = 'feature_test';
		
		afterEach(async function() {
			await harness.cleanup(collectionName);
		});

		it('should handle my specific use case', async function() {
			// 1. Insert test data
			await harness.compareOperation(collectionName, 'insertMany', [
				[
					{ category: 'A', value: 10 },
					{ category: 'B', value: 20 },
					{ category: 'A', value: 15 }
				]
			], { skipComparison: true });

			// 2. Test your specific query
			await harness.compareOperation(collectionName, 'find', [
				{ category: 'A' }
			]);

			// 3. Test with aggregation
			await harness.compareOperation(collectionName, 'aggregate', [
				[
					{ $match: { category: 'A' } },
					{ $group: { _id: '$category', total: { $sum: '$value' } } }
				]
			]);
		});
	});

	describe('Example 2: Testing Update Behavior', function() {
		const collectionName = 'update_test';
		
		afterEach(async function() {
			await harness.cleanup(collectionName);
		});

		it('should handle complex update operations', async function() {
			// Insert initial data
			await harness.compareOperation(collectionName, 'insertOne', [
				{ 
					name: 'TestDoc',
					nested: { field: 'value' },
					array: [1, 2, 3]
				}
			], { skipComparison: true });

			// Test nested field update
			await harness.compareOperation(collectionName, 'updateOne', [
				{ name: 'TestDoc' },
				{ $set: { 'nested.field': 'updated' } }
			], { skipComparison: true });

			// Verify the update
			await harness.compareOperation(collectionName, 'findOne', [
				{ name: 'TestDoc' }
			]);

			// Test array update
			await harness.compareOperation(collectionName, 'updateOne', [
				{ name: 'TestDoc' },
				{ $push: { array: 4 } }
			], { skipComparison: true });

			// Verify the array update
			await harness.compareOperation(collectionName, 'findOne', [
				{ name: 'TestDoc' }
			]);
		});
	});

	describe('Example 3: Testing Complex Queries', function() {
		const collectionName = 'complex_query_test';
		
		beforeEach(async function() {
			// Set up test data
			await harness.compareOperation(collectionName, 'insertMany', [
				[
					{ 
						type: 'product',
						tags: ['electronics', 'sale'],
						price: 299,
						specs: { weight: 1.5, color: 'black' }
					},
					{
						type: 'product',
						tags: ['electronics', 'new'],
						price: 499,
						specs: { weight: 2.0, color: 'silver' }
					},
					{
						type: 'service',
						tags: ['support'],
						price: 99,
						specs: null
					}
				]
			], { skipComparison: true });
		});
		
		afterEach(async function() {
			await harness.cleanup(collectionName);
		});

		it('should handle queries with multiple conditions', async function() {
			await harness.compareOperation(collectionName, 'find', [
				{
					$and: [
						{ type: 'product' },
						{ price: { $gte: 300 } },
						{ tags: { $in: ['electronics', 'new'] } }
					]
				}
			]);
		});

		it('should handle nested field queries', async function() {
			await harness.compareOperation(collectionName, 'find', [
				{ 'specs.color': 'black' }
			]);
		});

		it('should handle existence queries', async function() {
			await harness.compareOperation(collectionName, 'find', [
				{ specs: { $ne: null } }
			]);
		});
	});

	describe('Example 4: Testing Edge Cases', function() {
		const collectionName = 'edge_case_test';
		
		afterEach(async function() {
			await harness.cleanup(collectionName);
		});

		it('should handle empty results', async function() {
			// Query empty collection
			await harness.compareOperation(collectionName, 'find', [
				{ nonexistent: 'field' }
			]);
		});

		it('should handle special characters in strings', async function() {
			await harness.compareOperation(collectionName, 'insertOne', [
				{ 
					text: 'Special chars: !@#$%^&*()[]{}',
					unicode: '你好世界 🎉'
				}
			], { skipComparison: true });

			await harness.compareOperation(collectionName, 'findOne', [
				{ unicode: '你好世界 🎉' }
			]);
		});

		it('should handle large numbers', async function() {
			await harness.compareOperation(collectionName, 'insertOne', [
				{ 
					bigNumber: Number.MAX_SAFE_INTEGER,
					smallNumber: Number.MIN_SAFE_INTEGER
				}
			], { skipComparison: true });

			await harness.compareOperation(collectionName, 'findOne', [
				{ bigNumber: { $exists: true } }
			]);
		});
	});
});

/**
 * Tips for Writing Comparison Tests:
 * 
 * 1. Always clean up after tests with afterEach()
 * 2. Use skipComparison for write operations (insert, update, delete)
 * 3. Test the actual data with find/findOne after writes
 * 4. Group related tests in describe blocks
 * 5. Use meaningful collection names for debugging
 * 6. Test both success and edge cases
 * 7. Include timeout increases for slow operations
 * 
 * Run your custom tests with:
 *   mocha --reporter spec test/example-custom-comparison.js
 */
