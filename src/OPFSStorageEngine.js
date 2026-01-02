import { CollectionStore } from './CollectionStore.js';

/**
 * OPFS-based storage engine for persistent storage using bjson's BJsonFile
 * Stores each collection and its indexes separately in OPFS with a folder structure
 */
export class OPFSStorageEngine {
	constructor(dbName = 'micro-mongo', baseFolder = '/micro-mongo', options = {}) {
		this.collections = new Map();
		this.rootPath = options.rootPath || null;
		this.dbName = dbName;
		this.baseFolder = this.rootPath || baseFolder;
		this.dbFolder = `${this.baseFolder}/${dbName}`;
		this.initialized = false;
	}

	setRootPath(rootPath) {
		this.rootPath = rootPath;
		if (rootPath) {
			this.baseFolder = rootPath;
			this.dbFolder = `${this.baseFolder}/${this.dbName}`;
		}
	}

	collectionsCount() {
		return this.collections.size;
	}

	collectionStoreKeys() {
		return this.collections.keys();
	}

	getCollectionStore(collectionName) {
		return this.collections.get(collectionName);
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

		await this._ensureDirectory(this.dbFolder);
		this.initialized = true;
	}

	getCollectionDir(collectionName) {
		return `${this.dbFolder}/collections/${collectionName}`;
	}

	getCollectionFilePath(collectionName) {
		const collectionDir = this.getCollectionDir(collectionName);
		// Ensure directory exists synchronously before returning path
		this._ensureDirectory(collectionDir);
		return `${collectionDir}/data.bjson`;
	}

	async getIndexFilePath(collectionName, indexName, indexType = 'regular') {
		const collectionDir = this.getCollectionDir(collectionName);
		await this._ensureDirectory(`${collectionDir}/indexes`);
		const baseIndexPath = `${collectionDir}/indexes/${indexName}`;
		if (indexType === 'text') {
			// TextIndex expects a base filename and appends its own suffixes
			return baseIndexPath;
		}
		return `${baseIndexPath}.bjson`;
	}

	async _ensureDirectory(path) {
		if (!path) return;
		if (!globalThis.navigator || !globalThis.navigator.storage || typeof globalThis.navigator.storage.getDirectory !== 'function') {
			// In environments without OPFS, skip directory creation
			return;
		}
		try {
			let dir = await globalThis.navigator.storage.getDirectory();
			const parts = path.split('/').filter(Boolean);
			for (const part of parts) {
				dir = await dir.getDirectoryHandle(part, { create: true });
			}
			return dir;
		} catch (error) {
			// Ignore EEXIST errors - directory already exists
			if (error.code !== 'EEXIST') {
				throw error;
			}
		}
	}

	async _getDirectoryHandle(path, { create = false } = {}) {
		if (!path) return null;
		if (!globalThis.navigator || !globalThis.navigator.storage || typeof globalThis.navigator.storage.getDirectory !== 'function') {
			return null;
		}
		let dir = await globalThis.navigator.storage.getDirectory();
		const parts = path.split('/').filter(Boolean);
		for (const part of parts) {
			dir = await dir.getDirectoryHandle(part, { create });
		}
		return dir;
	}

	/**
	 * Get the file path for a collection's main data store
	 * @param {string} collectionName - The collection name
	 * @returns {string} File path
	 */
	/**
	 * Create a collection's state
	 * @param {string} collectionName - The collection name
	 * @returns {CollectionStore} The collection store
	 */
	createCollectionStore(collectionName) {
		if (this.collections.has(collectionName)) {
			return this.collections.get(collectionName);
		}
		// Ensure collection folder exists before creating store
		const collectionDir = this.getCollectionDir(collectionName);
		this._ensureDirectory(collectionDir).then(() => {
			// Directory created, store can now hydrate safely
		}).catch(err => {
			console.error(`Failed to create collection directory for ${collectionName}:`, err);
		});
		
		const collectionStore = new CollectionStore({
			documentPath: this.getCollectionFilePath(collectionName)
		});
		collectionStore.basePath = collectionDir;
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

	async loadCollectionsFromDisk() {
		await this.initialize();
		const collectionsDir = await this._getDirectoryHandle(`${this.dbFolder}/collections`, { create: true });
		if (!collectionsDir || typeof collectionsDir.entries !== 'function') return;
		for await (const [name, handle] of collectionsDir.entries()) {
			if (handle && handle.kind === 'directory') {
				// Always hydrate the store, even if it was created earlier
				const store = this.createCollectionStore(name);
				if (typeof store.ready === 'function') {
					await store.ready();
				}
				await this._loadIndexesForCollection(name, store);
			}
		}
	}

	_parseKeysFromIndexName(indexName) {
		const parts = indexName.split('_');
		const keys = {};
		for (let i = 0; i < parts.length - 1; i += 2) {
			const field = parts[i];
			const dir = parts[i + 1];
			if (!field || dir === undefined) continue;
			if (dir === 'text') {
				keys[field] = 'text';
			} else if (dir === '2dsphere' || dir === '2d') {
				keys[field] = dir;
			} else {
				const num = Number(dir);
				keys[field] = Number.isNaN(num) ? dir : num;
			}
		}
		if (Object.keys(keys).length === 0 && parts.length === 2) {
			const dir = parts[1];
			const num = Number(dir);
			keys[parts[0]] = Number.isNaN(num) ? dir : num;
		}
		return keys;
	}

	_inferIndexType(keys, explicitType) {
		if (explicitType) return explicitType;
		const values = Object.values(keys);
		if (values.includes('text')) return 'text';
		if (values.some(v => v === '2dsphere' || v === '2d')) return 'geospatial';
		return 'regular';
	}

	async _loadIndexesForCollection(collectionName, collectionStore) {
		const indexesDir = await this._getDirectoryHandle(`${this.getCollectionDir(collectionName)}/indexes`, { create: true });
		if (!indexesDir || typeof indexesDir.entries !== 'function') return;
		const textBases = new Set();
		const regularFiles = [];
		for await (const [name, handle] of indexesDir.entries()) {
			if (!handle || handle.kind !== 'file') continue;
			if (name.endsWith('-terms.bjson')) {
				textBases.add(name.replace(/-terms\.bjson$/, ''));
			} else if (name.endsWith('-documents.bjson')) {
				textBases.add(name.replace(/-documents\.bjson$/, ''));
			} else if (name.endsWith('-lengths.bjson')) {
				textBases.add(name.replace(/-lengths\.bjson$/, ''));
			} else if (name.endsWith('.bjson')) {
				regularFiles.push(name);
			}
		}

		for (const base of textBases) {
			if (collectionStore.indexes.has(base)) continue;
			const keys = this._parseKeysFromIndexName(base);
			const type = this._inferIndexType(keys, 'text');
			collectionStore.createIndexStore(base, {
				name: base,
				keys,
				type,
				storage: `${this.getCollectionDir(collectionName)}/indexes/${base}`
			});
		}

		for (const file of regularFiles) {
			const base = file.replace(/\.bjson$/, '');
			if (textBases.has(base)) continue; // already handled as text
			if (collectionStore.indexes.has(base)) continue;
			const keys = this._parseKeysFromIndexName(base);
			const type = this._inferIndexType(keys);
			collectionStore.createIndexStore(base, {
				name: base,
				keys,
				type,
				storage: `${this.getCollectionDir(collectionName)}/indexes/${file}`
			});
		}
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
