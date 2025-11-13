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

	/**
	 * Clear all documents and indexes
	 */
	clear() {
		this.documents.clear();
    this.indexes.clear();
	}

  /**
   * Get all document keys
   * @returns {[string]} Array of document keys
   */
  documentKeys() {
    return this.documents.keys();
  }

	/**
	 * Get all documents as an array
	 * @returns {Array} Array of all documents
	 */
	getAllDocuments() {
		return Array.from(this.documents.data.values());
	}

	/**
	 * Get document by ID
	 * @param {string} docId - Document ID
	 * @returns {Object|undefined} Document or undefined
	 */
	get(key) {
    if (typeof key !== 'string') throw new Error("Document key must be a string");
		return this.documents.get(key);
	}

	/**
	 * 
	 */
	set(key, value) {
    if (typeof key !== 'string') throw new Error("Document key must be a string");
    this.documents.set(key, value);
	}

	/**
	 * 
	 */
	remove(key) {
    if (typeof key !== 'string') throw new Error("Document key must be a string");
		this.documents.remove(key);
	}

	/**
	 *
	 */
	size() {
		return this.documents.size();
	}

	/**
	 * Get entire document store (for export/save)
	 * @returns {Object} Document store object
	 */
	getStore() {
		const store = {};
		for (const key of this.documents.keys()) {
			store[key] = this.documents.get(key);
		}
		return store;
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
	createIndexStore(name,meta) {
		if (!this.indexes.has(name)) {
			this.indexes.set(name, new IndexStore(meta));
		}
		return this.indexes.get(name);
	}

}
