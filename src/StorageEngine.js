import { CollectionStore } from './CollectionStore.js';

/**
 * In-memory storage engine (default)
 */
export class StorageEngine {
	constructor() {
		this.collections = new Map();
	}

  collectionsCount() {
    return this.collections.size;
  }
  
  /**
   * 
   * @returns {[string]} list of collection names
   */
  collectionStoreKeys() {
    return this.collections.keys();
  }

  /**
   * 
   * @param {*} collectionName 
   * @returns 
   */
  getCollectionStore(collectionName) {
    return this.collections.get(collectionName);
  }

	/**
	 * Create a collection's state
	 * @param {string} collectionName - The collection name
	 * @returns {CollectionStore} The collection store
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
	 * @param {string} collectionName - The collection name
	 */
	removeCollectionStore(collectionName) {
    this.collections.delete(collectionName);
	}

	/**
	 * Save the entire database state
	 * @returns {Promise<void>}
	 */
	save() {
		// In-memory storage does not persist data
	}

}
