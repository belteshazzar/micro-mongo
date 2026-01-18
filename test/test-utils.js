/**
 * Shared test utilities for standardized setup/teardown across test suites.
 * Provides reusable hooks and factories to manage MongoClient and DB lifecycle.
 */

/**
 * Create a MongoClient setup with automatic cleanup.
 * Exposes getters for client and db that are populated in beforeEach.
 *
 * @param {string} dbName - Database name to connect to (default: 'testdb')
 * @returns {object} Setup object with beforeEach/afterEach hooks and client/db getters
 *
 * @example
 * describe('My Suite', () => {
 *   const setup = createMongoClientSetup('testdb');
 *   
 *   beforeEach(setup.beforeEach);
 *   afterEach(setup.afterEach);
 *   
 *   it('should do something', async () => {
 *     const { client, db } = setup;
 *     await db.collection.insertOne({ name: 'test' });
 *   });
 * });
 */
export function createMongoClientSetup(dbName = 'testdb') {
	let _client, _db, _bridge;
	
	return {
		get client() {
			return _client;
		},
		get db() {
			return _db;
		},
		get bridge() {
			return _bridge;
		},
		
		beforeEach: async () => {
			const { MongoClient, WorkerBridge } = await import('../main.js');
			// Create WorkerBridge for all tests to use proxy/worker architecture
			_bridge = await WorkerBridge.create();
			_client = new MongoClient('mongodb://localhost/test', { workerBridge: _bridge });
			await _client.connect();
			_db = _client.db(dbName);
			return { client: _client, db: _db };
		},
		
		afterEach: async () => {
			if (_client) {
				await _client.close();
				_client = null;
				_db = null;
			}
			if (_bridge) {
				await _bridge.terminate();
				_bridge = null;
			}
		}
	};
}

/**
 * Create a DB setup with automatic cleanup.
 * Exposes getter for db that is populated in beforeEach.
 *
 * @returns {object} Setup object with beforeEach/afterEach hooks and db getter
 *
 * @example
 * describe('My Suite', () => {
 *   const setup = createDBSetup();
 *   
 *   beforeEach(setup.beforeEach);
 *   afterEach(setup.afterEach);
 *   
 *   it('should do something', async () => {
 *     const { db } = setup;
 *     db.createCollection('users');
 *   });
 * });
 */
export function createDBSetup() {
	let _db;
	
	return {
		get db() {
			return _db;
		},
		
		beforeEach: async () => {
			const { DB } = await import('../src/server/DB.js');
			_db = new DB();
			return { db: _db };
		},
		
		afterEach: async () => {
			if (_db && typeof _db.close === 'function') {
				await _db.close();
				_db = null;
			}
		}
	};
}

/**
 * Create a factory function to establish MongoClient connection for a single test.
 * Useful when you need fresh client per test without reusing across suite.
 *
 * @param {string} dbName - Database name to connect to (default: 'testdb')
 * @returns {Function} Async function that returns { client, db }
 *
 * @example
 * describe('My Suite', () => {
 *   const createClient = createMongoClientFactory('testdb');
 *   
 *   it('should do something', async () => {
 *     const { client, db } = await createClient();
 *     try {
 *       await db.collection.insertOne({ name: 'test' });
 *     } finally {
 *       await client.close();
 *     }
 *   });
 * });
 */
export function createMongoClientFactory(dbName = 'testdb') {
	return async () => {
		const { MongoClient, WorkerBridge } = await import('../main.js');
		// Create WorkerBridge for all tests to use proxy/worker architecture
		const bridge = await WorkerBridge.create();
		const client = new MongoClient('mongodb://localhost/test', { workerBridge: bridge });
		await client.connect();
		const db = client.db(dbName);
		return { client, db, bridge };
	};
}

/**
 * Create a factory function to instantiate a fresh DB for a single test.
 *
 * @returns {Function} Async function that returns { db }
 *
 * @example
 * describe('My Suite', () => {
 *   const createDB = createDBFactory();
 *   
 *   it('should do something', async () => {
 *     const { db } = await createDB();
 *     db.createCollection('users');
 *   });
 * });
 */
export function createDBFactory() {
	return async () => {
		const { DB } = await import('../src/server/DB.js');
		const db = new DB();
		return { db };
	};
}
