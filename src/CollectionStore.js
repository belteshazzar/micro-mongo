// import { PersistentDocumentStore } from './PersistentDocumentStore.js';
// import { IndexStore } from './IndexStore.js';

// /**
//  * CollectionStore - Unified storage for collection documents and indexes
//  * 
//  * Provides:
//  * - Document storage (via PersistentDocumentStore)
//  * - Index data storage (plain objects for each index)
//  * - Unified interface for Collection to manage all its data
//  */
// export class CollectionStore {
// 	constructor(options = {}) {
		
// 		// Index storage - plain object to store index data
// 		// Structure: { indexName: indexDataObject }
// 		this.indexes = new Map();
// 	}

// 	async ready() {
// 		if (typeof this.documents.ready === 'function') {
// 			await this.documents.ready();
// 		}
// 	}

// 	/**
// 	 * Clear all documents and indexes
// 	 */
// 	async clear() {
// 		if (this.documents && typeof this.documents.clear === 'function') {
// 			await this.documents.clear();
// 		}
// 		this.indexes.clear();
// 	}

//   /**
//    * Get all document keys
//    * @returns {[string]} Array of document keys
//    */
// 	async documentKeys() {
// 		return await this.documents.keys();
// 	}

// 	/**
// 	 * Get all documents as an array
// 	 * @returns {Array} Array of all documents
// 	 */
// 	async getAllDocuments() {
// 		if (typeof this.documents.getAllDocuments === 'function') {
// 			return await this.documents.getAllDocuments();
// 		}
// 		return [];
// 	}

// 	/**
// 	 * Get document by ID
// 	 * @param {string} docId - Document ID
// 	 * @returns {Object|undefined} Document or undefined
// 	 */
// 	async get(key) {
//     if (typeof key !== 'string') throw new Error("Document key must be a string");
// 		return await this.documents.get(key);
// 	}

// 	/**
// 	 * 
// 	 */
// 	async set(key, value) {
//     if (typeof key !== 'string') throw new Error("Document key must be a string");
//     return await this.documents.set(key, value);
// 	}

// 	/**
// 	 * 
// 	 */
// 	async remove(key) {
//     if (typeof key !== 'string') throw new Error("Document key must be a string");
// 		return await this.documents.remove(key);
// 	}

// 	/**
// 	 *
// 	 */
// 	async size() {
// 		return await this.documents.size();
// 	}

// 	/**
// 	 * Get entire document store (for export/save)
// 	 * @returns {Object} Document store object
// 	 */
// 	async getStore() {
// 		const store = {};
// 		if (!this.documents || typeof this.documents.keys !== 'function') return store;
// 		const keys = await this.documents.keys();
// 		for (const key of keys) {
// 			store[key] = await this.documents.get(key);
// 		}
// 		return store;
// 	}

// 	// ==========================================
// 	// Index Storage Interface
// 	// ==========================================

//   indexesCount() {
//     return this.indexes.size;
//   }

//   indexKeys() {
//     return this.indexes.keys();
//   }

// 	/**
// 	 * Get index data for a specific index
// 	 * @param {string} indexName - Name of the index
// 	 * @returns {Object} Index data object (or creates empty one if doesn't exist)
// 	 */
// 	createIndexStore(name,meta) {
// 		if (!this.indexes.has(name)) {
// 			this.indexes.set(name, new IndexStore(meta));
// 		}
// 		return this.indexes.get(name);
// 	}

// }
