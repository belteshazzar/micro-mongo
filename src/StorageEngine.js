/**
 * Abstract base class for storage engines
 * Defines the interface for storing and retrieving database state
 */
export class StorageEngine {
	constructor() {
		if (new.target === StorageEngine) {
			throw new TypeError("Cannot construct StorageEngine instances directly");
		}
	}

	/**
	 * Initialize the storage engine
	 * @returns {Promise<void>}
	 */
	async initialize() {
		throw new Error('initialize() must be implemented by subclass');
	}

	/**
	 * Save the entire database state
	 * @param {Object} dbState - The database state to save
	 * @param {string} dbState.name - The database name
	 * @param {Object} dbState.collections - Map of collection names to collection data
	 * @returns {Promise<void>}
	 */
	async saveDatabase(dbState) {
		throw new Error('saveDatabase() must be implemented by subclass');
	}

	/**
	 * Load the entire database state
	 * @param {string} dbName - The database name
	 * @returns {Promise<Object|null>} The database state or null if not found
	 */
	async loadDatabase(dbName) {
		throw new Error('loadDatabase() must be implemented by subclass');
	}

	/**
	 * Save a single collection's state
	 * @param {string} dbName - The database name
	 * @param {string} collectionName - The collection name
	 * @param {Object} collectionState - The collection state to save
	 * @param {Array} collectionState.documents - The documents in the collection
	 * @param {Array} collectionState.indexes - The indexes in the collection
	 * @returns {Promise<void>}
	 */
	async saveCollection(dbName, collectionName, collectionState) {
		throw new Error('saveCollection() must be implemented by subclass');
	}

	/**
	 * Load a single collection's state
	 * @param {string} dbName - The database name
	 * @param {string} collectionName - The collection name
	 * @returns {Promise<Object|null>} The collection state or null if not found
	 */
	async loadCollection(dbName, collectionName) {
		throw new Error('loadCollection() must be implemented by subclass');
	}

	/**
	 * Delete a collection
	 * @param {string} dbName - The database name
	 * @param {string} collectionName - The collection name
	 * @returns {Promise<void>}
	 */
	async deleteCollection(dbName, collectionName) {
		throw new Error('deleteCollection() must be implemented by subclass');
	}

	/**
	 * Delete the entire database
	 * @param {string} dbName - The database name
	 * @returns {Promise<void>}
	 */
	async deleteDatabase(dbName) {
		throw new Error('deleteDatabase() must be implemented by subclass');
	}

	/**
	 * Close/cleanup the storage engine
	 * @returns {Promise<void>}
	 */
	async close() {
		throw new Error('close() must be implemented by subclass');
	}
}
