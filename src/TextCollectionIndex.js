import { CollectionIndex } from './CollectionIndex.js';
import { TextIndex } from './TextIndex.js';
import { getProp } from './utils.js';

/**
 * Text index implementation using TextIndex
 * Supports full-text search on one or more fields
 */
export class TextCollectionIndex extends CollectionIndex {
	constructor(keys, options = {}) {
		super(keys, options);
		// Create the underlying TextIndex
		this.textIndex = new TextIndex(options);
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
	add(doc) {
		if (!doc._id) {
			throw new Error('Document must have an _id field');
		}
		const text = this._extractText(doc);
		if (text) {
			this.textIndex.add(String(doc._id), text);
		}
	}

	/**
	 * Remove a document from the text index
	 * @param {Object} doc - The document to remove
	 */
	remove(doc) {
		if (!doc._id) {
			return;
		}
		this.textIndex.remove(String(doc._id));
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
	 * @returns {Array} Array of document IDs
	 */
	search(searchText, options = {}) {
		const results = this.textIndex.query(searchText, { scored: false, ...options });
		return results;
	}

	/**
	 * Clear all data from the index
	 */
	clear() {
		this.textIndex.clear();
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
