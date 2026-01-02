import { Index } from './Index.js';
import { TextIndex } from 'bjson/textindex';
import { getProp } from './utils.js';

/**
 * Text index implementation
 * OPFS-backed async implementation using bjson TextIndex
 */
export class TextCollectionIndex extends Index {
	constructor(name, keys, storage, options = {}) {
		super(name, keys, storage);
		// Use OPFS-backed TextIndex for persistent full-text search
		this.textIndex = new TextIndex({ baseFilename: storage });
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
				// Delete corrupted files and ensure directory exists
				await this._deleteIndexFiles();
				await this._ensureDirectoryForFile(this.storage + '-terms.bjson');
				
				// Create fresh TextIndex for new/corrupted files
				this.textIndex = new TextIndex({ baseFilename: this.storage });
				await this.textIndex.open();
				this.isOpen = true;
			} else {
				throw error;
			}
		}
	}
	
	async _deleteIndexFiles() {
		// TextIndex creates multiple files: -terms.bjson, -documents.bjson, -lengths.bjson
		const suffixes = ['-terms.bjson', '-documents.bjson', '-lengths.bjson'];
		for (const suffix of suffixes) {
			await this._deleteFile(this.storage + suffix);
		}
	}

	async _deleteFile(filePath) {
		if (!filePath) return;
		try {
			const pathParts = filePath.split('/').filter(Boolean);
			const filename = pathParts.pop();
			
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
			try {
				await this.textIndex.close();
			} catch (error) {
				// Ignore errors from already-closed files
				if (!error.message || !error.message.includes('File is not open')) {
					throw error;
				}
			}
			this.isOpen = false;
		}
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
	async clear() {
		// Recreate the index by closing and reopening
		if (this.isOpen) {
			await this.close();
		}
		this.textIndex = new TextIndex({ baseFilename: this.storage });
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
