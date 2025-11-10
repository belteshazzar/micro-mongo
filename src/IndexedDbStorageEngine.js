import { StorageEngine } from './StorageEngine.js';

/**
 * IndexedDB-based storage engine for persistent storage
 * Stores each collection separately in IndexedDB
 */
export class IndexedDbStorageEngine extends StorageEngine {
	constructor(dbName = 'micro-mongo') {
		super();
		this.dbName = dbName;
		this.db = null;
		this.indexedDBName = `micro-mongo-${dbName}`;
	}

	/**
	 * Initialize the IndexedDB connection
	 * @returns {Promise<void>}
	 */
	async initialize() {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.indexedDBName, 1);

			request.onerror = () => {
				reject(new Error('Failed to open IndexedDB: ' + request.error));
			};

			request.onsuccess = () => {
				this.db = request.result;
				resolve();
			};

			request.onupgradeneeded = (event) => {
				const db = event.target.result;
				
				// Create object stores for collections and metadata
				if (!db.objectStoreNames.contains('collections')) {
					db.createObjectStore('collections', { keyPath: 'name' });
				}
				if (!db.objectStoreNames.contains('metadata')) {
					db.createObjectStore('metadata', { keyPath: 'key' });
				}
			};
		});
	}

	/**
	 * Save the entire database state
	 * @param {Object} dbState - The database state to save
	 * @returns {Promise<void>}
	 */
	async saveDatabase(dbState) {
		if (!this.db) {
			await this.initialize();
		}

		// Save metadata
		const transaction = this.db.transaction(['metadata'], 'readwrite');
		const metadataStore = transaction.objectStore('metadata');
		
		await new Promise((resolve, reject) => {
			const request = metadataStore.put({
				key: 'dbName',
				value: dbState.name
			});
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});

		// Save each collection
		for (const collectionName in dbState.collections) {
			if (dbState.collections.hasOwnProperty(collectionName)) {
				await this.saveCollection(dbState.name, collectionName, dbState.collections[collectionName]);
			}
		}
	}

	/**
	 * Load the entire database state
	 * @param {string} dbName - The database name
	 * @returns {Promise<Object|null>} The database state or null if not found
	 */
	async loadDatabase(dbName) {
		if (!this.db) {
			await this.initialize();
		}

		const transaction = this.db.transaction(['collections'], 'readonly');
		const collectionsStore = transaction.objectStore('collections');

		return new Promise((resolve, reject) => {
			const request = collectionsStore.getAll();
			
			request.onsuccess = () => {
				const collections = {};
				for (const collectionData of request.result) {
					collections[collectionData.name] = {
						documents: collectionData.documents || [],
						indexes: collectionData.indexes || []
					};
				}
				
				resolve({
					name: dbName,
					collections: collections
				});
			};
			
			request.onerror = () => reject(request.error);
		});
	}

	/**
	 * Save a single collection's state
	 * @param {string} dbName - The database name
	 * @param {string} collectionName - The collection name
	 * @param {Object} collectionState - The collection state to save
	 * @returns {Promise<void>}
	 */
	async saveCollection(dbName, collectionName, collectionState) {
		if (!this.db) {
			await this.initialize();
		}

		const transaction = this.db.transaction(['collections'], 'readwrite');
		const collectionsStore = transaction.objectStore('collections');

		return new Promise((resolve, reject) => {
			const request = collectionsStore.put({
				name: collectionName,
				documents: collectionState.documents || [],
				indexes: collectionState.indexes || []
			});
			
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	/**
	 * Load a single collection's state
	 * @param {string} dbName - The database name
	 * @param {string} collectionName - The collection name
	 * @returns {Promise<Object|null>} The collection state or null if not found
	 */
	async loadCollection(dbName, collectionName) {
		if (!this.db) {
			await this.initialize();
		}

		const transaction = this.db.transaction(['collections'], 'readonly');
		const collectionsStore = transaction.objectStore('collections');

		return new Promise((resolve, reject) => {
			const request = collectionsStore.get(collectionName);
			
			request.onsuccess = () => {
				if (request.result) {
					resolve({
						documents: request.result.documents || [],
						indexes: request.result.indexes || []
					});
				} else {
					resolve(null);
				}
			};
			
			request.onerror = () => reject(request.error);
		});
	}

	/**
	 * Delete a collection
	 * @param {string} dbName - The database name
	 * @param {string} collectionName - The collection name
	 * @returns {Promise<void>}
	 */
	async deleteCollection(dbName, collectionName) {
		if (!this.db) {
			await this.initialize();
		}

		const transaction = this.db.transaction(['collections'], 'readwrite');
		const collectionsStore = transaction.objectStore('collections');

		return new Promise((resolve, reject) => {
			const request = collectionsStore.delete(collectionName);
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	/**
	 * Delete the entire database
	 * @param {string} dbName - The database name
	 * @returns {Promise<void>}
	 */
	async deleteDatabase(dbName) {
		if (this.db) {
			this.db.close();
			this.db = null;
		}

		return new Promise((resolve, reject) => {
			const request = indexedDB.deleteDatabase(this.indexedDBName);
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	/**
	 * Close/cleanup the storage engine
	 * @returns {Promise<void>}
	 */
	async close() {
		if (this.db) {
			this.db.close();
			this.db = null;
		}
	}
}
