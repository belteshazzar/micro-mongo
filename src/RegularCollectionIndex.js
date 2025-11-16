import { Index } from './Index.js';
import { getProp } from './utils.js';
import { BPlusTree } from './BPlusTree.js';

/**
 * Uses B+ tree for efficient storage and range queries
 */
export class RegularCollectionIndex extends Index {
	constructor(name, keys, storage, options = {}) {
		super(name, keys, storage, options);
		// B+ tree mapping index key to array of document _ids
		// Order 50 provides good balance between node size and tree height
		this.data = new BPlusTree(50,storage);
		
		// Load existing data from storage if present
		this._loadFromStorage();
	}

	/**
	 * Load index data from IndexStore
	 * @private
	 */
	_loadFromStorage() {
		if (!this.storage || !this.storage.data) return;
		
		// IndexStore data is a Map, iterate and load into B+ tree
		for (const [key, value] of this.storage.data) {
			if (key !== '_meta') {
				this.data.add(key, value);
			}
		}
	}

	/**
	 * Save a key-value pair to storage
	 * @private
	 */
	_saveToStorage(key, value) {
		if (this.storage) {
			this.storage.set(key, value);
		}
	}

	/**
	 * Remove a key from storage
	 * @private
	 */
	_removeFromStorage(key) {
		if (this.storage) {
			this.storage.remove(key);
		}
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
   * 
	 * @param {Object} doc - The document to index
	 */
	add(doc) {
		const indexKey = this.extractIndexKey(doc);
		if (indexKey !== null) {
			// Get existing array or create new one
			let idArray = this.data.search(indexKey);
			if (!idArray) {
				idArray = [];
			}
			idArray.push(doc._id);
			this.data.add(indexKey, idArray);
			// Persist to storage
			this._saveToStorage(indexKey, idArray);
		}
	}

	/**
	 * Remove a document from the index
   * 
	 * @param {Object} doc - The document to remove
	 */
	remove(doc) {
		const indexKey = this.extractIndexKey(doc);
		if (indexKey !== null) {
			const idArray = this.data.search(indexKey);
			if (idArray) {
				const idx = idArray.indexOf(doc._id);
				if (idx !== -1) {
					idArray.splice(idx, 1);
				}
				if (idArray.length === 0) {
					this.data.delete(indexKey);
					// Remove from storage
					this._removeFromStorage(indexKey);
				} else {
					this.data.add(indexKey, idArray);
					// Update storage
					this._saveToStorage(indexKey, idArray);
				}
			}
		}
	}

	/**
	 * Query the index
   * 
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
			const result = this.data.search(indexKey);
			return result || [];
		}

		// Case 2: Query with operators
		if (typeof queryValue === 'object' && !Array.isArray(queryValue)) {
			return this._queryWithOperators(field, queryValue);
		}

		return null;
	}

	/**
	 * Query index with comparison operators
   * 
	 * @private
	 */
	_queryWithOperators(field, operators) {
		const ops = Object.keys(operators);
		const results = new Set();

		// Handle range queries: $gt, $gte, $lt, $lte
		const hasRangeOp = ops.some(op => ['$gt', '$gte', '$lt', '$lte'].includes(op));
		
		if (hasRangeOp) {
			// Use B+ tree's efficient range search if we have both bounds
			const hasGt = ops.includes('$gt') || ops.includes('$gte');
			const hasLt = ops.includes('$lt') || ops.includes('$lte');
			
			if (hasGt && hasLt) {
				// Determine min and max bounds
				const minValue = ops.includes('$gte') ? operators['$gte'] : 
				                ops.includes('$gt') ? operators['$gt'] : -Infinity;
				const maxValue = ops.includes('$lte') ? operators['$lte'] : 
				                ops.includes('$lt') ? operators['$lt'] : Infinity;
				
				const minKey = JSON.stringify({ t: typeof minValue, v: minValue });
				const maxKey = JSON.stringify({ t: typeof maxValue, v: maxValue });
				
				// Use B+ tree range search
				const rangeResults = this.data.rangeSearch(minKey, maxKey);
				
				for (const {key, value} of rangeResults) {
					try {
						const parsed = JSON.parse(key);
						const keyValue = parsed.v;
						
						// Apply exact operator semantics
						let matches = true;
						if (ops.includes('$gt') && !(keyValue > operators['$gt'])) matches = false;
						if (ops.includes('$gte') && !(keyValue >= operators['$gte'])) matches = false;
						if (ops.includes('$lt') && !(keyValue < operators['$lt'])) matches = false;
						if (ops.includes('$lte') && !(keyValue <= operators['$lte'])) matches = false;
						
						if (matches && value) {
							value.forEach(id => results.add(id));
						}
					} catch (e) {
						// Skip malformed entries
					}
				}
				return Array.from(results);
			} else {
				// Scan all entries if we don't have both bounds
				const allEntries = this.data.toArray();
				for (const {key, value} of allEntries) {
					try {
						const parsed = JSON.parse(key);
						const keyValue = parsed.v;
						
						// Check if value matches all operators
						let matches = true;
						for (const op of ops) {
							const operand = operators[op];
							if (op === '$gt' && !(keyValue > operand)) matches = false;
							else if (op === '$gte' && !(keyValue >= operand)) matches = false;
							else if (op === '$lt' && !(keyValue < operand)) matches = false;
							else if (op === '$lte' && !(keyValue <= operand)) matches = false;
							else if (op === '$eq' && !(keyValue === operand)) matches = false;
							else if (op === '$ne' && !(keyValue !== operand)) matches = false;
						}
						
						if (matches && value) {
							value.forEach(id => results.add(id));
						}
					} catch (e) {
						// Skip malformed entries
					}
				}
				return Array.from(results);
			}
		}

		// Handle $in operator
		if (ops.includes('$in')) {
			const values = operators['$in'];
			if (Array.isArray(values)) {
				for (const value of values) {
					const indexKey = JSON.stringify({ t: typeof value, v: value });
					const idArray = this.data.search(indexKey);
					if (idArray) {
						idArray.forEach(id => results.add(id));
					}
				}
				return Array.from(results);
			}
		}

		// Handle $eq operator
		if (ops.includes('$eq')) {
			const value = operators['$eq'];
			const indexKey = JSON.stringify({ t: typeof value, v: value });
			const result = this.data.search(indexKey);
			return result || [];
		}

		// Handle $ne operator (requires full scan, not optimal)
		if (ops.includes('$ne')) {
			const excludeValue = operators['$ne'];
			const excludeKey = JSON.stringify({ t: typeof excludeValue, v: excludeValue });
			const allEntries = this.data.toArray();
			for (const {key, value} of allEntries) {
				if (key !== excludeKey && value) {
					value.forEach(id => results.add(id));
				}
			}
			return Array.from(results);
		}

		return null;
	}

	/**
	 * Clear all entries from the index
	 */
	clear() {
		this.data.clear();
		// Clear storage
		if (this.storage) {
			this.storage.clear();
		}
	}

	/**
	 * Serialize index state for storage
   * 
	 * @returns {Object} Serializable index state
	 */
	serialize() {
		// Data is already in IndexStore, no need to serialize separately
		return {
			type: 'regular',
			keys: this.keys,
			options: this.options
		};
	}

	/**
	 * Restore index state from serialized data
   * 
	 * @param {Object} state - Serialized index state
	 */
	deserialize(state) {
		// Data is loaded from IndexStore in constructor
		// This method is kept for compatibility but doesn't need to do anything
	}
}
