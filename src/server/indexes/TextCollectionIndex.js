import { Index } from './Index.js';
import { TextIndex } from 'bjson/textindex';
import { BPlusTree } from 'bjson/bplustree';
import { getProp } from '../../utils.js';
import {
	acquireVersionedPath,
	buildVersionedPath,
	createSyncAccessHandle,
	DEFAULT_COMPACTION_MIN_BYTES,
	getCurrentVersion,
	promoteVersion,
	releaseVersionedPath
} from '../opfsVersioning.js';

const TEXT_INDEX_SUFFIXES = ['-terms.bjson', '-documents.bjson', '-lengths.bjson'];

/**
 * Text index implementation
 * OPFS-backed async implementation using bjson TextIndex
 */
export class TextCollectionIndex extends Index {
	constructor(name, keys, storage, options = {}) {
		super(name, keys, storage);
		this.storageBasePath = storage;
		this.storageVersion = 0;
		this.versionedBasePath = null;
		this._releaseStorage = null;
		this.textIndex = null;
		this.syncHandles = [];
		this.isOpen = false;
		// Track which fields are indexed
		this.indexedFields = [];
		for (const field in keys) {
			if (keys[field] === 'text') {
				this.indexedFields.push(field);
			}
		}
		if (this.indexedFields.length === 0) {
			throw new Error('Text index must have at least one field with type "text"');
		}
	}

	/**
	 * Open the index files
	 * Must be called before using the index
	 */
	async open() {
		if (this.isOpen) {
			return;
		}
		try {
			const { version, path: versionedBasePath } = await acquireVersionedPath(this.storageBasePath);
			this.storageVersion = version;
			this.versionedBasePath = versionedBasePath;
			this._releaseStorage = () => releaseVersionedPath(this.storageBasePath, version, { suffixes: TEXT_INDEX_SUFFIXES });

			// Create three BPlusTree instances for the TextIndex
			const indexTree = await this._createBPlusTree(this._getActiveBasePath() + '-terms.bjson');
			const docTermsTree = await this._createBPlusTree(this._getActiveBasePath() + '-documents.bjson');
			const lengthsTree = await this._createBPlusTree(this._getActiveBasePath() + '-lengths.bjson');
			
			this.textIndex = new TextIndex({
				order: 16,
				trees: {
					index: indexTree,
					documentTerms: docTermsTree,
					documentLengths: lengthsTree
				}
			});
			
			await this.textIndex.open();
			this.isOpen = true;
		} catch (error) {
			// Handle missing or corrupted files
			if (error.code === 'ENOENT' ||
					(error.message && (error.message.includes('Failed to read metadata') ||
					error.message.includes('missing required fields') ||
					error.message.includes('Unknown type byte') ||
					error.message.includes('Invalid') ||
					error.message.includes('file too small')))) {
				// Close any open sync handles
				await this._closeSyncHandles();
				
				// Delete corrupted files and ensure directory exists
				await this._deleteIndexFiles();
				await this._ensureDirectoryForFile(this._getActiveBasePath() + '-terms.bjson');
				
				// Create fresh TextIndex for new/corrupted files
				const indexTree = await this._createBPlusTree(this._getActiveBasePath() + '-terms.bjson');
				const docTermsTree = await this._createBPlusTree(this._getActiveBasePath() + '-documents.bjson');
				const lengthsTree = await this._createBPlusTree(this._getActiveBasePath() + '-lengths.bjson');
				
				this.textIndex = new TextIndex({
					order: 16,
					trees: {
						index: indexTree,
						documentTerms: docTermsTree,
						documentLengths: lengthsTree
					}
				});
				
				await this.textIndex.open();
				this.isOpen = true;
			} else {
				throw error;
			}
		}
	}
	
	async _createBPlusTree(filePath) {
		// Parse path to get directory and filename
		const pathParts = filePath.split('/').filter(Boolean);
		const filename = pathParts.pop();
		
		if (!filename) {
			throw new Error(`Invalid storage path: ${filePath}`);
		}
		
		// Navigate to directory
		let dirHandle = await globalThis.navigator.storage.getDirectory();
		for (const part of pathParts) {
			dirHandle = await dirHandle.getDirectoryHandle(part, { create: true });
		}
		
		// Get file handle and create sync access handle using native OPFS
		const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
		const syncHandle = await fileHandle.createSyncAccessHandle();
		
		// Store sync handle for cleanup
		this.syncHandles.push(syncHandle);
		
		// Create BPlusTree with sync handle
		return new BPlusTree(syncHandle, 16);
	}
	
	async _closeSyncHandles() {
		for (const handle of this.syncHandles) {
			try {
				await handle.close();
			} catch (e) {
				// Ignore errors
			}
		}
		this.syncHandles = [];
	}
	
	_getActiveBasePath() {
		return this.versionedBasePath || this.storageBasePath;
	}

	async _deleteIndexFiles(basePath = this._getActiveBasePath()) {
		// TextIndex creates multiple files: -terms.bjson, -documents.bjson, -lengths.bjson
		for (const suffix of TEXT_INDEX_SUFFIXES) {
			await this._deleteFile(basePath + suffix);
		}
	}

	async _deleteFile(filePath) {
		if (!filePath) return;
		try {
			const pathParts = filePath.split('/').filter(Boolean);
			const filename = pathParts.pop();
			
			if (!filename) {
				throw new Error(`Invalid storage path: ${filePath}`);
			}
			
			let dir = await globalThis.navigator.storage.getDirectory();
			for (const part of pathParts) {
				dir = await dir.getDirectoryHandle(part, { create: false });
			}
			await dir.removeEntry(filename);
		} catch (error) {
			// Ignore errors - file might not exist
		}
	}

	async _ensureDirectoryForFile(filePath) {
		if (!filePath) return;
		const pathParts = filePath.split('/').filter(Boolean);
		// Remove filename, keep only directory parts
		pathParts.pop();
		
		if (pathParts.length === 0) return;
		
		try {
			let dir = await globalThis.navigator.storage.getDirectory();
			for (const part of pathParts) {
				dir = await dir.getDirectoryHandle(part, { create: true });
			}
		} catch (error) {
			// Ignore EEXIST - directory already exists
			if (error.code !== 'EEXIST') {
				throw error;
			}
		}
	}

	/**
	 * Close the index files
	 */
	async close() {
		if (this.isOpen) {
			await this._maybeCompact();
			if (this.textIndex?.isOpen) {
				try {
					await this.textIndex.close();
				} catch (error) {
					// Ignore errors from already-closed files
					if (!error.message || !error.message.includes('File is not open')) {
						throw error;
					}
				}
			}
			this.isOpen = false;
		}
		if (this._releaseStorage) {
			await this._releaseStorage();
			this._releaseStorage = null;
		}
	}

	async _maybeCompact() {
		if (!this.textIndex?.index?.file || !this.textIndex?.documentTerms?.file || !this.textIndex?.documentLengths?.file) {
			return false;
		}
		const currentVersion = await getCurrentVersion(this.storageBasePath);
		if (currentVersion !== this.storageVersion) return false;

		const totalSize = this.textIndex.index.file.getFileSize()
			+ this.textIndex.documentTerms.file.getFileSize()
			+ this.textIndex.documentLengths.file.getFileSize();
		if (!totalSize || totalSize < DEFAULT_COMPACTION_MIN_BYTES) return false;

		const nextVersion = currentVersion + 1;
		const compactBase = buildVersionedPath(this.storageBasePath, nextVersion);
		const indexHandle = await createSyncAccessHandle(`${compactBase}-terms.bjson`, { reset: true });
		const docTermsHandle = await createSyncAccessHandle(`${compactBase}-documents.bjson`, { reset: true });
		const lengthsHandle = await createSyncAccessHandle(`${compactBase}-lengths.bjson`, { reset: true });
		const indexTree = new BPlusTree(indexHandle, 16);
		const docTermsTree = new BPlusTree(docTermsHandle, 16);
		const lengthsTree = new BPlusTree(lengthsHandle, 16);

		await this.textIndex.compact({
			index: indexTree,
			documentTerms: docTermsTree,
			documentLengths: lengthsTree
		});
		// Note: textIndex.compact() closes the underlying trees and leaves the index in a closed state.
		await promoteVersion(this.storageBasePath, nextVersion, currentVersion, { suffixes: TEXT_INDEX_SUFFIXES });
		await this._closeSyncHandles();
		return true;
	}

	/**
	 * Extract text content from a document for the indexed fields
	 * @param {Object} doc - The document
	 * @returns {string} Combined text from all indexed fields
	 */
	_extractText(doc) {
		const textParts = [];
		for (const field of this.indexedFields) {
			const value = getProp(doc, field);
			if (value !== undefined && value !== null) {
				textParts.push(String(value));
			}
		}
		return textParts.join(' ');
	}

	/**
	 * Add a document to the text index
	 * @param {Object} doc - The document to index
	 */
	async add(doc) {
		if (!doc._id) {
			throw new Error('Document must have an _id field');
		}
		const text = this._extractText(doc);
		if (text) {
			await this.textIndex.add(String(doc._id), text);
		}
	}

	/**
	 * Remove a document from the text index
	 * @param {Object} doc - The document to remove
	 */
	async remove(doc) {
		if (!doc._id) {
			return;
		}
		await this.textIndex.remove(String(doc._id));
	}

	/**
	 * Query the text index
	 * @param {*} query - The query object
	 * @returns {Array|null} Array of document IDs or null if query is not a text search
	 */
	query(query) {
		// This method is used for query planning
		// Text queries are handled separately in queryMatcher
		return null;
	}

	/**
	 * Search the text index
	 * @param {string} searchText - The text to search for
	 * @param {Object} options - Search options
	 * @returns {Promise<Array>} Array of document IDs
	 */
	async search(searchText, options = {}) {
		const results = await this.textIndex.query(searchText, { scored: false, ...options });
		return results;
	}

	/**
	 * Clear all data from the index
	 */
  // TODO: Recreate the index empty or delete
	async clear() {
		// Recreate the index by closing and reopening
		if (this.isOpen) {
			await this.close();
		}

		const currentVersion = await getCurrentVersion(this.storageBasePath);
		const basePath = buildVersionedPath(this.storageBasePath, currentVersion);
		
		// Delete old files
		await this._deleteIndexFiles(basePath);
		
		// Reopen (will create new files)
		await this.open();
	}

	/**
	 * Get index specification
	 */
	getSpec() {
		return {
			name: this.name,
			key: this.keys,
			textIndexVersion: 3,
			weights: this._getWeights()
		};
	}

	/**
	 * Get field weights (all default to 1 for now)
	 */
	_getWeights() {
		const weights = {};
		for (const field of this.indexedFields) {
			weights[field] = 1;
		}
		return weights;
	}

}
