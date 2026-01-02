import { PersistentDocumentStore } from './PersistentDocumentStore.js';
import { IndexStore } from './IndexStore.js';

/**
 * CollectionStore - Unified storage for collection documents and indexes
 * 
 * Provides:
 * - Document storage (via PersistentDocumentStore)
 * - Index data storage (plain objects for each index)
 * - Unified interface for Collection to manage all its data
 */
export class CollectionStore {
	constructor(options = {}) {
		if (!options.documentPath) {
			throw new Error('CollectionStore requires a documentPath for PersistentDocumentStore');
		}

		this.documents = new PersistentDocumentStore(options.documentPath);
		
		// Index storage - plain object to store index data
		// Structure: { indexName: indexDataObject }
		this.indexes = new Map();
	}

	async ready() {
		if (typeof this.documents.ready === 'function') {
			await this.documents.ready();
		}
	}

	/**
	 * Clear all documents and indexes
	 */
	clear() {
		const maybe = this.documents.clear && this.documents.clear();
		if (maybe && typeof maybe.then === 'function') {
			return maybe.then(() => this.indexes.clear());
		}
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
		if (typeof this.documents.getAllDocuments === 'function') {
			return this.documents.getAllDocuments();
		}
		return this.documents && this.documents.data ? Array.from(this.documents.data.values()) : [];
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
