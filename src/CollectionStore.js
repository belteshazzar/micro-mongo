import { DocumentStore } from './DocumentStore.js';
import { IndexStore } from './IndexStore.js';

/**
 * CollectionStore - Unified storage for collection documents and indexes
 * 
 * Provides:
 * - Document storage (via DocumentStore)
 * - Index data storage (plain objects for each index)
 * - Unified interface for Collection to manage all its data
 */
export class CollectionStore {
	constructor() {
		// Document storage - uses DocumentStore for document CRUD operations
		this.documents = new DocumentStore();
		
		// Index storage - plain object to store index data
		// Structure: { indexName: indexDataObject }
		this.indexes = {};
	}

	// ==========================================
	// Document Storage Interface
	// (delegates to DocumentStore)
	// ==========================================

	/**
	 * Clear all documents
	 */
	clear() {
		this.documents.clear();
	}

	/**
	 * Get document by index position
	 * @param {number} index - Position in storage
	 * @returns {Object} Document at that position
	 */
	get(index) {
		return this.documents.get(index);
	}

	/**
	 * Get the underlying document store
	 * @returns {Object} The document storage object
	 */
	getStore() {
    throw new Error("Getting underlying document store");
		return this.documents.getStore();
	}

	/**
	 * Remove a document by key (_id)
	 * @param {*} key - Document ID
	 */
	remove(key) {
		this.documents.remove(key);
	}

	/**
	 * Set/add a document
	 * @param {*} key - Document ID
	 * @param {Object} value - Document to store
	 */
	set(key, value) {
		this.documents.set(key, value);
	}

	/**
	 * Get the number of documents
	 * @returns {number} Document count
	 */
	size() {
		return this.documents.size();
	}

	// ==========================================
	// Index Storage Interface
	// ==========================================

	/**
	 * Get index data for a specific index
	 * @param {string} indexName - Name of the index
	 * @returns {Object} Index data object (or creates empty one if doesn't exist)
	 */
	createIndexStorage(indexName) {
		if (!this.indexes[indexName]) {
			this.indexes[indexName] = new IndexStore();
		}
		return this.indexes[indexName];
	}

	// /**
	//  * Set index data for a specific index
	//  * @param {string} indexName - Name of the index
	//  * @param {Object} data - Index data to store
	//  */
	// setIndexData(indexName, data) {
  //   throw new Error("Setting index data for index: " + indexName);
	// 	this.indexes[indexName] = data;
	// }

	// /**
	//  * Clear index data for a specific index
	//  * @param {string} indexName - Name of the index
	//  */
	// clearIndexData(indexName) {
  //   throw new Error("Clearing index data for index: " + indexName);
	// 	this.indexes[indexName] = {};
	// }

	// /**
	//  * Remove an index completely
	//  * @param {string} indexName - Name of the index to remove
	//  */
	// removeIndex(indexName) {
  //   throw new Error("Removing index data for index: " + indexName);
	// 	delete this.indexes[indexName];
	// }

	// /**
	//  * Get all index names
	//  * @returns {string[]} Array of index names
	//  */
	// getIndexNames() {
  //   throw new Error("Getting all index names");
	// 	return Object.keys(this.indexes);
	// }

	// /**
	//  * Clear all index data
	//  */
	// clearAllIndexes() {
  //   throw new Error("Clearing all index data");
	// 	this.indexes = {};
	// }

	// /**
	//  * Export the entire store state (documents + indexes)
	//  * @returns {Object} Serializable state
	//  */
	// exportState() {
  //   throw new Error("Exporting entire store state");
	// 	return {
	// 		documents: this.getStore(),
	// 		indexes: this.indexes
	// 	};
	// }

	// /**
	//  * Import store state (documents + indexes)
	//  * @param {Object} state - Previously exported state
	//  */
	// importState(state) {
  //   throw new Error("Importing entire store state");
	// 	// Import documents
	// 	this.documents.clear();
	// 	if (state.documents) {
	// 		for (const key in state.documents) {
	// 			if (state.documents.hasOwnProperty(key)) {
	// 				this.documents.set(key, state.documents[key]);
	// 			}
	// 		}
	// 	}

	// 	// Import indexes
	// 	this.indexes = state.indexes || {};
	// }
}
