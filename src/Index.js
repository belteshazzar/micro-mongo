/**
 * Base class for collection indexes
 * Provides a common interface for different types of indexes (e.g., regular, text, geo)
 */
export class Index {
	constructor(name, keys, storage, options = {}) {
    // TODO: remove and put into subclasses
		this.name = name;
		this.keys = keys;
		this.storage = storage;
		this.options = options;
	}

	/**
	 * Add a document to the index
	 * @param {Object} doc - The document to index
	 */
	add(doc) {
		throw new Error('add() must be implemented by subclass');
	}

	/**
	 * Remove a document from the index
	 * @param {Object} doc - The document to remove
	 */
	remove(doc) {
		throw new Error('remove() must be implemented by subclass');
	}

	/**
	 * Update a document in the index (remove old, add new)
	 * @param {Object} oldDoc - The old document
	 * @param {Object} newDoc - The new document
	 */
	update(oldDoc, newDoc) {
		this.remove(oldDoc);
		this.add(newDoc);
	}

	/**
	 * Query the index
	 * @param {*} query - The query to execute
	 * @returns {Array} Array of document IDs or null if index cannot satisfy query
	 */
	query(query) {
		throw new Error('query() must be implemented by subclass');
	}

	/**
	 * Clear all data from the index
	 */
	clear() {
		throw new Error('clear() must be implemented by subclass');
	}

	/**
	 * Get index specification (for getIndexes())
	 */
	getSpec() {
    // TODO: remove and put into subclasses
		return {
			name: this.name,
			key: this.keys
		};
	}

}
