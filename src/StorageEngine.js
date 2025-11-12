import { CollectionStore } from './CollectionStore.js';

/**
 * In-memory storage engine (default)
 * Does not persist data between sessions
 */
export class StorageEngine {
	constructor() {
		this.collections = new Map();
	}

	/**
	 * Initialize the storage engine
	 * @returns {Promise<void>}
	 */
	initialize() {
		// No initialization needed for in-memory storage
	}

	/**
	 * Save the entire database state
	 * @returns {Promise<void>}
	 */
	saveDatabase() {
		// In-memory storage does not persist data
	}

	/**
	 * Create a collection's state
	 * @param {string} collectionName - The collection name
	 * @returns {Promise<CollectionStore>} The collection store
	 */
	createCollectionStore(collectionName) {
    if (this.collections.has(collectionName)) {
      return this.collections.get(collectionName);
    }
    const collectionStore = new CollectionStore();
    this.collections.set(collectionName, collectionStore);
    return collectionStore;
  }

	/**
	 * Delete a collection
	 * @param {string} dbName - The database name
	 * @param {string} collectionName - The collection name
	 * @returns {Promise<void>}
	 */
	deleteCollectionStore(collectionName) {
		if (this.collections.has(collectionName)) {
			this.collections.delete(collectionName);
		}
	}

	/**
	 * Close/cleanup the storage engine
	 * @returns {Promise<void>}
	 */
	close() {
		// No cleanup needed for in-memory storage
	}
}
