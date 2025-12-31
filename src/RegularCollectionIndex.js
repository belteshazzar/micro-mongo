import { Index } from './Index.js';
import { getProp } from './utils.js';
import { BPlusTree } from 'bjson/bplustree';

/**
 * Regular index using bjson's persistent BPlusTree with OPFS backing
 * All operations are async
 */
export class RegularCollectionIndex extends Index {
	constructor(name, keys, storageFilePath, options = {}) {
		super(name, keys, storageFilePath, options);
		// Use OPFS-backed B+ tree for persistent index storage
		this.data = new BPlusTree(storageFilePath, 50);
		this.isOpen = false;
	}

	/**
	 * Open the index file
	 * Must be called before using the index
	 */
	async open() {
		if (this.isOpen) {
			return;
		}
		await this.data.open();
		this.isOpen = true;
	}

	/**
	 * Close the index file
	 */
	async close() {
		if (this.isOpen) {
			await this.data.close();
			this.isOpen = false;
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
	async add(doc) {
		const indexKey = this.extractIndexKey(doc);
		if (indexKey !== null) {
			const docId = doc._id.toString();
			// Get existing doc IDs for this key (if any)
			const existing = await this.data.search(indexKey);
			let docIds;
			if (Array.isArray(existing)) {
				// Avoid duplicates
				if (!existing.includes(docId)) {
					docIds = [...existing, docId];
				} else {
					return; // Already indexed
				}
			} else if (existing) {
				// Single value, convert to array
				docIds = existing === docId ? [existing] : [existing, docId];
			} else {
				// No existing value
				docIds = [docId];
			}
			await this.data.add(indexKey, docIds);
		}
	}

	/**
	 * Remove a document from the index
   * 
	 * @param {Object} doc - The document to remove
	 */
	async remove(doc) {
		const indexKey = this.extractIndexKey(doc);
		if (indexKey !== null) {
			const docId = doc._id.toString();
			const existing = await this.data.search(indexKey);
			if (Array.isArray(existing)) {
				const filtered = existing.filter(id => id !== docId);
				if (filtered.length > 0) {
					await this.data.add(indexKey, filtered);
				} else {
					await this.data.delete(indexKey);
				}
			} else if (existing === docId) {
				await this.data.delete(indexKey);
			}
		}
	}

	/**
	 * Query the index
   * 
	 * @param {*} query - The query object
	 * @returns {Promise<Array|null>} Array of document IDs or null if index cannot satisfy query
	 */
	async query(query) {
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
			const indexKey = queryValue;
			const result = await this.data.search(indexKey);
			// Result might be an array of doc IDs or undefined
			return result || [];
		}

		// Case 2: Query with operators
		if (typeof queryValue === 'object' && !Array.isArray(queryValue)) {
			return await this._queryWithOperators(field, queryValue);
		}

		return null;
	}

	/**
	 * Query index with comparison operators
   * 
	 * @private
	 */
	async _queryWithOperators(field, operators) {
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
				
				const rangeResults = await this.data.rangeSearch(minValue, maxValue);
				
				for (const entry of rangeResults) {
					const keyValue = entry.key;
					const value = entry.value;
					
					// Apply exact operator semantics
					let matches = true;
					if (ops.includes('$gt') && !(keyValue > operators['$gt'])) matches = false;
					if (ops.includes('$gte') && !(keyValue >= operators['$gte'])) matches = false;
					if (ops.includes('$lt') && !(keyValue < operators['$lt'])) matches = false;
					if (ops.includes('$lte') && !(keyValue <= operators['$lte'])) matches = false;
					
					if (matches && value) {
						// value is an array of document IDs
						if (Array.isArray(value)) {
							value.forEach(id => results.add(id));
						} else {
							results.add(value);
						}
					}
				}
				return Array.from(results);
			} else {
				// Scan all entries if we don't have both bounds
				const allEntries = await this.data.toArray();
				
				for (const entry of allEntries) {
					const keyValue = entry.key;
					const value = entry.value;
					
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
						// value is an array of document IDs
						if (Array.isArray(value)) {
							value.forEach(id => results.add(id));
						} else {
							results.add(value);
						}
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
					const result = await this.data.search(value);
					if (result) {
						if (Array.isArray(result)) {
							result.forEach(id => results.add(id));
						} else {
							results.add(result);
						}
					}
				}
				return Array.from(results);
			}
		}

		// Handle $eq operator
		if (ops.includes('$eq')) {
			const value = operators['$eq'];
			const result = await this.data.search(value);
			if (result) {
				return Array.isArray(result) ? result : [result];
			}
			return [];
		}

		// Handle $ne operator (requires full scan, not optimal)
		if (ops.includes('$ne')) {
			const excludeValue = operators['$ne'];
			const allEntries = await this.data.toArray();
			
			for (const entry of allEntries) {
				if (entry.key !== excludeValue && entry.value) {
					// value is an array of document IDs
					if (Array.isArray(entry.value)) {
						entry.value.forEach(id => results.add(id));
					} else {
						results.add(entry.value);
					}
				}
			}
			return Array.from(results);
		}

		return null;
	}

	/**
	 * Clear all entries from the index
	 */
	async clear() {
		// For persistent storage, close and recreate the tree
		if (this.isOpen) {
			await this.close();
		}
		// BPlusTree will be recreated when we open again
		this.data = new BPlusTree(this.data.filename, 50);
		await this.open();
	}
}
