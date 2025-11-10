import { CollectionIndex } from './CollectionIndex.js';
import { getProp } from './utils.js';

/**
 * Regular (B-tree style) index implementation
 * Supports equality queries on indexed fields
 */
export class RegularCollectionIndex extends CollectionIndex {
	constructor(keys, options = {}) {
		super(keys, options);
		// Map of key value to array of document _ids
		this.data = {};
	}

	/**
	 * Extract index key value from a document
	 */
	extractIndexKey(doc) {
		const keyFields = Object.keys(this.keys);
		if (keyFields.length === 0) return null;

		// For simple single-field index
		if (keyFields.length === 1) {
			const field = keyFields[0];
			const value = getProp(doc, field);
			if (value === undefined) return null;
			// Preserve type information in the key
			return JSON.stringify({ t: typeof value, v: value });
		}

		// For compound index, concatenate values with type preservation
		const keyParts = [];
		for (let i = 0; i < keyFields.length; i++) {
			const value = getProp(doc, keyFields[i]);
			if (value === undefined) return null;
			keyParts.push(JSON.stringify(value));
		}
		// Use a separator that won't appear in JSON
		return keyParts.join('\x00');
	}

	/**
	 * Add a document to the index
	 * @param {Object} doc - The document to index
	 */
	add(doc) {
		const indexKey = this.extractIndexKey(doc);
		if (indexKey !== null) {
			if (!this.data[indexKey]) {
				this.data[indexKey] = [];
			}
			this.data[indexKey].push(doc._id);
		}
	}

	/**
	 * Remove a document from the index
	 * @param {Object} doc - The document to remove
	 */
	remove(doc) {
		const indexKey = this.extractIndexKey(doc);
		if (indexKey !== null && this.data[indexKey]) {
			const arr = this.data[indexKey];
			const idx = arr.indexOf(doc._id);
			if (idx !== -1) {
				arr.splice(idx, 1);
			}
			if (arr.length === 0) {
				delete this.data[indexKey];
			}
		}
	}

	/**
	 * Query the index
	 * @param {*} query - The query object
	 * @returns {Array|null} Array of document IDs or null if index cannot satisfy query
	 */
	query(query) {
		const queryKeys = Object.keys(query);
		const indexFields = Object.keys(this.keys);

		// Check if query matches index (simple case: single field equality)
		if (indexFields.length === 1) {
			const field = indexFields[0];
			// Check for simple equality
			if (queryKeys.indexOf(field) !== -1) {
				const queryValue = query[field];
				// Only use index for simple equality (not operators like $gt, $lt, etc.)
				if (typeof queryValue !== 'object' || queryValue === null) {
					const indexKey = JSON.stringify({ t: typeof queryValue, v: queryValue });
					return this.data[indexKey] || [];
				}
			}
		}

		return null;
	}

	/**
	 * Clear all data from the index
	 */
	clear() {
		this.data = {};
	}

	/**
	 * Serialize index state for storage
	 * @returns {Object} Serializable index state
	 */
	serialize() {
		return {
			type: 'regular',
			keys: this.keys,
			options: this.options,
			data: this.data
		};
	}

	/**
	 * Restore index state from serialized data
	 * @param {Object} state - Serialized index state
	 */
	deserialize(state) {
		this.data = state.data || {};
	}
}
