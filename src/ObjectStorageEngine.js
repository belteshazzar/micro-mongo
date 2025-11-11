import { StorageEngine } from './StorageEngine.js';

/**
 * In-memory storage engine (default)
 * Does not persist data between sessions
 */
export class ObjectStorageEngine extends StorageEngine {
	constructor() {
		super();
		this.databases = {};
	}

	/**
	 * Initialize the storage engine
	 * @returns {Promise<void>}
	 */
	async initialize() {
		// No initialization needed for in-memory storage
	}

	/**
	 * Save the entire database state
	 * @param {Object} dbState - The database state to save
	 * @returns {Promise<void>}
	 */
	async saveDatabase(dbState) {
		this.databases[dbState.name] = JSON.parse(JSON.stringify(dbState));
	}

	/**
	 * Load the entire database state
	 * @param {string} dbName - The database name
	 * @returns {Promise<Object|null>} The database state or null if not found
	 */
	async loadDatabase(dbName) {
		if (this.databases[dbName]) {
			return JSON.parse(JSON.stringify(this.databases[dbName]));
		}
		return null;
	}

	/**
	 * Save a single collection's state
	 * @param {string} dbName - The database name
	 * @param {string} collectionName - The collection name
	 * @param {Object} collectionState - The collection state to save
	 * @returns {Promise<void>}
	 */
	async saveCollection(dbName, collectionName, collectionState) {
		if (!this.databases[dbName]) {
			this.databases[dbName] = {
				name: dbName,
				collections: {}
			};
		}
		this.databases[dbName].collections[collectionName] = JSON.parse(JSON.stringify(collectionState));
	}

	/**
	 * Load a single collection's state
	 * @param {string} dbName - The database name
	 * @param {string} collectionName - The collection name
	 * @returns {Promise<Object|null>} The collection state or null if not found
	 */
	async loadCollection(dbName, collectionName) {
		if (this.databases[dbName] && this.databases[dbName].collections[collectionName]) {
			return JSON.parse(JSON.stringify(this.databases[dbName].collections[collectionName]));
		}
		return null;
	}

	/**
	 * Delete a collection
	 * @param {string} dbName - The database name
	 * @param {string} collectionName - The collection name
	 * @returns {Promise<void>}
	 */
	async deleteCollection(dbName, collectionName) {
		if (this.databases[dbName] && this.databases[dbName].collections) {
			delete this.databases[dbName].collections[collectionName];
		}
	}

	/**
	 * Delete the entire database
	 * @param {string} dbName - The database name
	 * @returns {Promise<void>}
	 */
	async deleteDatabase(dbName) {
		delete this.databases[dbName];
	}

	/**
	 * Close/cleanup the storage engine
	 * @returns {Promise<void>}
	 */
	async close() {
		// No cleanup needed for in-memory storage
	}
}
