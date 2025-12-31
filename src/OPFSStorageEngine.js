import { StorageEngine } from './StorageEngine.js';
import { CollectionStore } from './CollectionStore.js';

/**
 * OPFS-based storage engine for persistent storage using bjson's BJsonFile
 * Stores each collection and its indexes separately in OPFS with a folder structure
 */
export class OPFSStorageEngine extends StorageEngine {
	constructor(dbName = 'micro-mongo', baseFolder = '/micro-mongo') {
		super();
		this.dbName = dbName;
		this.baseFolder = baseFolder;
		this.dbFolder = `${baseFolder}/${dbName}`;
		this.initialized = false;
	}

	/**
	 * Initialize the storage engine
	 * Creates the database folder structure if it doesn't exist
	 * @returns {Promise<void>}
	 */
	async initialize() {
		if (this.initialized) {
			return;
		}
		
		// For now, just mark as initialized
		// Actual folder creation happens lazily when collections are created
		this.initialized = true;
	}

	/**
	 * Get the file path for a collection's main data store
	 * @param {string} collectionName - The collection name
	 * @returns {string} File path
	 */
	getCollectionFilePath(collectionName) {
		return `${this.dbFolder}/collections/${collectionName}/data.bjson`;
	}

	/**
	 * Get the file path for an index
	 * @param {string} collectionName - The collection name
	 * @param {string} indexName - The index name
	 * @param {string} indexType - The index type ('regular', 'text', 'geospatial')
	 * @returns {string} File path or object with multiple paths for text indexes
	 */
	getIndexFilePath(collectionName, indexName, indexType = 'regular') {
		const baseIndexPath = `${this.dbFolder}/collections/${collectionName}/indexes/${indexName}`;
		
		if (indexType === 'text') {
			// Text index needs multiple files
			return {
				index: `${baseIndexPath}-terms.bjson`,
				documentTerms: `${baseIndexPath}-documents.bjson`,
				documentLengths: `${baseIndexPath}-lengths.bjson`
			};
		}
		
		// Regular and geospatial indexes use single file
		return `${baseIndexPath}.bjson`;
	}

	/**
	 * Get or create a collection store
	 * @param {string} collectionName - The collection name
	 * @returns {CollectionStore} The collection store
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
		// TODO: In a full implementation, we would also delete the files from OPFS
	}

	/**
	 * Save the entire database state
	 * @returns {Promise<void>}
	 */
	async save() {
		// OPFS storage is persisted automatically through BJsonFile
		// No explicit save operation needed
	}

	/**
	 * Close all open files
	 * @returns {Promise<void>}
	 */
	async close() {
		// Closing is handled by individual BJsonFile instances in indexes
		// This method is here for compatibility with the storage engine interface
	}
}
