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
			return value; //JSON.stringify({ t: typeof value, v: value });
		}

		// For compound index, concatenate values with type preservation
		const keyParts = [];
		for (let i = 0; i < keyFields.length; i++) {
			const value = getProp(doc, keyFields[i]);
			if (value === undefined) return null;
			keyParts.push(value /*JSON.stringify(value) */);
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
			this.data.add(indexKey, doc._id.toString());
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
      this.data.delete(indexKey, doc._id.toString());
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
			const indexKey = queryValue; //JSON.stringify({ t: typeof queryValue, v: queryValue });
			return this.data.search(indexKey);
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
				
				const minKey = minValue; //JSON.stringify({ t: typeof minValue, v: minValue });
				const maxKey = maxValue; //JSON.stringify({ t: typeof maxValue, v: maxValue });
				
				// Use B+ tree range search
				const rangeResults = this.data.rangeSearch(minKey, maxKey);
				
				for (const {key, value} of rangeResults) {
					try {
						//const parsed = JSON.parse(key);
						const keyValue = key; //parsed.v;
						
						// Apply exact operator semantics
						let matches = true;
						if (ops.includes('$gt') && !(keyValue > operators['$gt'])) matches = false;
						if (ops.includes('$gte') && !(keyValue >= operators['$gte'])) matches = false;
						if (ops.includes('$lt') && !(keyValue < operators['$lt'])) matches = false;
						if (ops.includes('$lte') && !(keyValue <= operators['$lte'])) matches = false;
						
						if (matches && value) {
							// value is now a single document ID (from the flattened array)
							results.add(value);
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
						//const parsed = JSON.parse(key);
						const keyValue = key; //parsed.v;
						
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
							// value is now a single document ID (from the flattened array)
							results.add(value);
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
					const indexKey = value; //JSON.stringify({ t: typeof value, v: value });
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
			const indexKey = value; //JSON.stringify({ t: typeof value, v: value });
			const result = this.data.search(indexKey);
			return result || [];
		}

		// Handle $ne operator (requires full scan, not optimal)
		if (ops.includes('$ne')) {
			const excludeValue = operators['$ne'];
			const excludeKey = excludeValue; //JSON.stringify({ t: typeof excludeValue, v: excludeValue });
			const allEntries = this.data.toArray();
			for (const {key, value} of allEntries) {
				if (key !== excludeKey && value) {
					// value is now a single document ID (from the flattened array)
					results.add(value);
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
	}
}
