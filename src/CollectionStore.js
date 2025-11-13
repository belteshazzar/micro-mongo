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
		this.indexes = new Map();
	}

	// ==========================================
	// Document Storage Interface
	// (delegates to DocumentStore)
	// ==========================================

	/**
	 * Clear all documents and indexes
	 */
	clear() {
		this.documents.clear();
    this.indexes.clear();
	}

  documentsCount() {
    return this.documents.size();
  }

  /**
   * Get all document keys
   * @returns {[string]} Array of document keys
   */
  documentKeys() {
    return this.documents.keys();
  }

	/**
	 * Get document by key position
	 * @param {*} key - Document ID
	 * @returns {Object} Document at that position
	 */
	getDocumentStorage(key) {
    if (typeof key !== 'string') throw new Error("Document key must be a string");
		return this.documents.get(key);
	}

	/**
	 * Remove a document by key (_id)
	 * @param {*} key - Document ID
	 */
	removeDocumentStorage(key) {
    if (typeof key !== 'string') throw new Error("Document key must be a string");
		this.documents.remove(key);
	}

	/**
	 * Add a document
	 * @param {*} key - Document ID
	 * @param {Object} value - Document to store
	 */
	addDocumentStorage(key, value) {
    if (typeof key !== 'string') throw new Error("Document key must be a string");
		this.documents.set(key, value);
	}

  updateDocumentStorage(key, value) {
    if (typeof key !== 'string') throw new Error("Document key must be a string");
    this.documents.set(key, value);
  }

	/**
	 * Get the number of documents
	 * @returns {number} Document count
	 */
	documentsCount() {
		return this.documents.size();
	}

	// ==========================================
	// Index Storage Interface
	// ==========================================

  indexesCount() {
    return this.indexes.size;
  }

  indexKeys() {
    return this.indexes.keys();
  }

	/**
	 * Get index data for a specific index
	 * @param {string} indexName - Name of the index
	 * @returns {Object} Index data object (or creates empty one if doesn't exist)
	 */
	createIndexStore(name) {
		if (!this.indexes.has(name)) {
			this.indexes.set(name, new IndexStore());
		}
		return this.indexes.get(name);
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
