/**
 * Comparison harness for testing micro-mongo against real MongoDB.
 * 
 * This module provides utilities to execute the same commands against both
 * micro-mongo and real MongoDB, then compare the results to ensure compatibility.
 */

import { strict as assert } from 'assert';
import { MongoClient as MicroMongoClient, WorkerBridge } from '../main.js';

/**
 * Deep comparison utility that handles MongoDB-specific types
 */
function deepCompare(actual, expected, path = 'root') {
	// Handle null/undefined
	if (actual === null || expected === null || actual === undefined || expected === undefined) {
		if (actual !== expected) {
			throw new Error(`Mismatch at ${path}: ${actual} !== ${expected}`);
		}
		return;
	}

	// Handle ObjectId comparison (both as strings)
	if (actual._id && expected._id) {
		if (actual._id.toString() !== expected._id.toString()) {
			throw new Error(`ObjectId mismatch at ${path}._id: ${actual._id} !== ${expected._id}`);
		}
	}

	// Handle Date objects
	if (actual instanceof Date && expected instanceof Date) {
		if (actual.getTime() !== expected.getTime()) {
			throw new Error(`Date mismatch at ${path}: ${actual} !== ${expected}`);
		}
		return;
	}

	// Handle arrays
	if (Array.isArray(actual) && Array.isArray(expected)) {
		if (actual.length !== expected.length) {
			throw new Error(`Array length mismatch at ${path}: ${actual.length} !== ${expected.length}`);
		}
		for (let i = 0; i < actual.length; i++) {
			deepCompare(actual[i], expected[i], `${path}[${i}]`);
		}
		return;
	}

	// Handle objects
	if (typeof actual === 'object' && typeof expected === 'object') {
		const actualKeys = Object.keys(actual).filter(k => k !== '_id').sort();
		const expectedKeys = Object.keys(expected).filter(k => k !== '_id').sort();
		
		if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
			throw new Error(`Object keys mismatch at ${path}: ${actualKeys.join(',')} !== ${expectedKeys.join(',')}`);
		}
		
		for (const key of actualKeys) {
			deepCompare(actual[key], expected[key], `${path}.${key}`);
		}
		return;
	}

	// Primitive comparison
	if (actual !== expected) {
		throw new Error(`Value mismatch at ${path}: ${actual} !== ${expected}`);
	}
}

/**
 * Normalize results for comparison.
 * Handles differences in result format between micro-mongo and MongoDB.
 */
function normalizeResult(result, type) {
	if (result === null || result === undefined) {
		return result;
	}

	// For arrays of documents, sort by _id for consistent comparison
	if (Array.isArray(result)) {
		return result.map(doc => {
			if (doc && typeof doc === 'object' && doc._id) {
				// Convert ObjectId to string for comparison
				return {
					...doc,
					_id: doc._id.toString()
				};
			}
			return doc;
		}).sort((a, b) => {
			if (a._id && b._id) {
				return a._id.localeCompare(b._id);
			}
			return 0;
		});
	}

	// For single documents
	if (result && typeof result === 'object' && result._id) {
		return {
			...result,
			_id: result._id.toString()
		};
	}

	return result;
}

/**
 * ComparisonHarness class for running parallel tests
 */
export class ComparisonHarness {
	constructor() {
		this.mongoClient = null;
		this.microMongoClient = null;
		this.mongoDB = null;
		this.microMongoDB = null;
		this.bridge = null;
		this.differences = [];
	}

	/**
	 * Connect to both MongoDB and micro-mongo
	 * @param {string} mongoUrl - MongoDB connection URL (e.g., 'mongodb://localhost:27017')
	 * @param {string} dbName - Database name to use
	 */
	async connect(mongoUrl = 'mongodb://localhost:27017', dbName = 'test-comparison') {
		// Try to connect to real MongoDB
		try {
			// Dynamic import to make MongoDB optional
			const mongodb = await import('mongodb');
			const RealMongoClient = mongodb.MongoClient;
			
			this.mongoClient = new RealMongoClient(mongoUrl);
			await this.mongoClient.connect();
			this.mongoDB = this.mongoClient.db(dbName);
			console.log('✓ Connected to real MongoDB');
		} catch (error) {
			throw new Error(
				`Failed to connect to MongoDB at ${mongoUrl}. ` +
				`Please ensure MongoDB is running and the 'mongodb' package is installed.\n` +
				`Install with: npm install mongodb\n` +
				`Error: ${error.message}`
			);
		}

		// Connect to micro-mongo
		try {
			this.bridge = await WorkerBridge.create();
			this.microMongoClient = new MicroMongoClient(`mongodb://localhost/${dbName}`, {
				workerBridge: this.bridge
			});
			await this.microMongoClient.connect();
			this.microMongoDB = this.microMongoClient.db(dbName);
			console.log('✓ Connected to micro-mongo');
		} catch (error) {
			// Clean up MongoDB connection if micro-mongo fails
			if (this.mongoClient) {
				await this.mongoClient.close();
			}
			throw error;
		}
	}

	/**
	 * Close both connections
	 */
	async close() {
		const errors = [];
		
		if (this.microMongoClient) {
			try {
				await this.microMongoClient.close();
			} catch (err) {
				errors.push(`Micro-mongo close error: ${err.message}`);
			}
		}
		
		if (this.bridge) {
			try {
				await this.bridge.terminate();
			} catch (err) {
				errors.push(`Bridge terminate error: ${err.message}`);
			}
		}
		
		if (this.mongoClient) {
			try {
				await this.mongoClient.close();
			} catch (err) {
				errors.push(`MongoDB close error: ${err.message}`);
			}
		}
		
		if (errors.length > 0) {
			throw new Error(errors.join(', '));
		}
	}

	/**
	 * Clean up test data from both databases
	 */
	async cleanup(collectionName) {
		if (this.mongoDB && this.microMongoDB) {
			try {
				await this.mongoDB.collection(collectionName).deleteMany({});
				await this.microMongoDB.collection(collectionName).deleteMany({});
			} catch (err) {
				console.warn(`Cleanup warning: ${err.message}`);
			}
		}
	}

	/**
	 * Execute a command on both databases and compare results
	 * @param {string} collectionName - Collection to operate on
	 * @param {string} operation - Operation name (e.g., 'insertOne', 'find')
	 * @param {Array} args - Arguments to pass to the operation
	 * @param {Object} options - Comparison options
	 * @returns {Object} Results from both databases
	 */
	async compareOperation(collectionName, operation, args = [], options = {}) {
		const mongoCollection = this.mongoDB.collection(collectionName);
		const microMongoCollection = this.microMongoDB.collection(collectionName);

		let mongoResult, microMongoResult;
		let mongoError, microMongoError;

		// Execute on MongoDB
		try {
			const result = await mongoCollection[operation](...args);
			// Handle cursor results
			if (result && typeof result.toArray === 'function') {
				mongoResult = await result.toArray();
			} else {
				mongoResult = result;
			}
		} catch (error) {
			mongoError = error;
		}

		// Execute on micro-mongo
		try {
			const result = await microMongoCollection[operation](...args);
			// Handle cursor results
			if (result && typeof result.toArray === 'function') {
				microMongoResult = await result.toArray();
			} else {
				microMongoResult = result;
			}
		} catch (error) {
			microMongoError = error;
		}

		// Compare errors
		if (mongoError && microMongoError) {
			// Both errored - this is okay as long as they're similar errors
			console.log(`Both databases errored (expected): ${mongoError.message}`);
			return { mongoResult: null, microMongoResult: null, bothErrored: true };
		}

		if (mongoError && !microMongoError) {
			throw new Error(
				`MongoDB errored but micro-mongo succeeded.\n` +
				`MongoDB error: ${mongoError.message}\n` +
				`Micro-mongo result: ${JSON.stringify(microMongoResult)}`
			);
		}

		if (!mongoError && microMongoError) {
			throw new Error(
				`Micro-mongo errored but MongoDB succeeded.\n` +
				`Micro-mongo error: ${microMongoError.message}\n` +
				`MongoDB result: ${JSON.stringify(mongoResult)}`
			);
		}

		// Normalize results for comparison
		const normalizedMongoResult = normalizeResult(mongoResult, operation);
		const normalizedMicroMongoResult = normalizeResult(microMongoResult, operation);

		// Compare results (unless comparison is disabled)
		if (options.skipComparison !== true) {
			try {
				// For operations that return write results, compare specific fields
				if (operation.startsWith('insert') || operation.startsWith('update') || 
				    operation.startsWith('delete') || operation.startsWith('replace')) {
					// Just check that both succeeded
					assert(mongoResult !== null && microMongoResult !== null, 
						'Both operations should return results');
				} else {
					// For queries, do deep comparison
					deepCompare(normalizedMicroMongoResult, normalizedMongoResult);
				}
			} catch (error) {
				this.differences.push({
					collection: collectionName,
					operation,
					args,
					mongoResult: normalizedMongoResult,
					microMongoResult: normalizedMicroMongoResult,
					error: error.message
				});
				throw error;
			}
		}

		return {
			mongoResult: normalizedMongoResult,
			microMongoResult: normalizedMicroMongoResult
		};
	}

	/**
	 * Get summary of differences found during testing
	 */
	getDifferences() {
		return this.differences;
	}

	/**
	 * Assert that both databases are in sync
	 */
	assertNoDifferences() {
		if (this.differences.length > 0) {
			const summary = this.differences.map(d => 
				`${d.collection}.${d.operation}: ${d.error}`
			).join('\n');
			throw new Error(`Found ${this.differences.length} differences:\n${summary}`);
		}
	}
}

/**
 * Helper function to create a comparison test suite
 * @param {string} suiteName - Name of the test suite
 * @param {Function} testFn - Function containing the tests
 */
export function createComparisonSuite(suiteName, testFn) {
	return async function() {
		const harness = new ComparisonHarness();
		
		try {
			await harness.connect();
			await testFn(harness);
			harness.assertNoDifferences();
		} catch (error) {
			console.error(`\nComparison test failed: ${suiteName}`);
			console.error(error.message);
			if (harness.getDifferences().length > 0) {
				console.error('\nDifferences found:');
				harness.getDifferences().forEach(d => {
					console.error(`\n${d.collection}.${d.operation}:`);
					console.error(`  MongoDB: ${JSON.stringify(d.mongoResult, null, 2)}`);
					console.error(`  Micro-mongo: ${JSON.stringify(d.microMongoResult, null, 2)}`);
					console.error(`  Error: ${d.error}`);
				});
			}
			throw error;
		} finally {
			await harness.close();
		}
	};
}
