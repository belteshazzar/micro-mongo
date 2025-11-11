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

		// Only support single-field index queries for now
		if (indexFields.length !== 1) {
			return null;
		}

		const field = indexFields[0];
		
		// Check if query has this field
		if (queryKeys.indexOf(field) === -1) {
			return null;
		}

		const queryValue = query[field];

		// Case 1: Simple equality
		if (typeof queryValue !== 'object' || queryValue === null) {
			const indexKey = JSON.stringify({ t: typeof queryValue, v: queryValue });
			return this.data[indexKey] || [];
		}

		// Case 2: Query with operators
		if (typeof queryValue === 'object' && !Array.isArray(queryValue)) {
			return this._queryWithOperators(field, queryValue);
		}

		return null;
	}

	/**
	 * Query index with comparison operators
	 * @private
	 */
	_queryWithOperators(field, operators) {
		const ops = Object.keys(operators);
		const results = new Set();

		// Handle range queries: $gt, $gte, $lt, $lte
		const hasRangeOp = ops.some(op => ['$gt', '$gte', '$lt', '$lte'].includes(op));
		
		if (hasRangeOp) {
			// Scan all entries and filter by range
			for (const indexKey in this.data) {
				try {
					const parsed = JSON.parse(indexKey);
					const value = parsed.v;
					const type = parsed.t;
					
					// Check if value matches all operators
					let matches = true;
					for (const op of ops) {
						const operand = operators[op];
						if (op === '$gt' && !(value > operand)) matches = false;
						else if (op === '$gte' && !(value >= operand)) matches = false;
						else if (op === '$lt' && !(value < operand)) matches = false;
						else if (op === '$lte' && !(value <= operand)) matches = false;
						else if (op === '$eq' && !(value === operand)) matches = false;
						else if (op === '$ne' && !(value !== operand)) matches = false;
					}
					
					if (matches) {
						// Add all document IDs for this index entry
						this.data[indexKey].forEach(id => results.add(id));
					}
				} catch (e) {
					// Skip malformed entries
				}
			}
			return Array.from(results);
		}

		// Handle $in operator
		if (ops.includes('$in')) {
			const values = operators['$in'];
			if (Array.isArray(values)) {
				for (const value of values) {
					const indexKey = JSON.stringify({ t: typeof value, v: value });
					if (this.data[indexKey]) {
						this.data[indexKey].forEach(id => results.add(id));
					}
				}
				return Array.from(results);
			}
		}

		// Handle $eq operator
		if (ops.includes('$eq')) {
			const value = operators['$eq'];
			const indexKey = JSON.stringify({ t: typeof value, v: value });
			return this.data[indexKey] || [];
		}

		// Handle $ne operator (requires full scan, not optimal)
		if (ops.includes('$ne')) {
			const excludeValue = operators['$ne'];
			const excludeKey = JSON.stringify({ t: typeof excludeValue, v: excludeValue });
			for (const indexKey in this.data) {
				if (indexKey !== excludeKey) {
					this.data[indexKey].forEach(id => results.add(id));
				}
			}
			return Array.from(results);
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
