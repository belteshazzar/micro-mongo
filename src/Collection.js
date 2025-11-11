import { Cursor } from './Cursor.js';
import { SortedCursor } from './SortedCursor.js';
import { isArray, getProp, applyProjection, copy } from './utils.js';
import { matches } from './queryMatcher.js';
import { applyUpdates, createDocFromUpdate } from './updates.js';
import { RegularCollectionIndex } from './RegularCollectionIndex.js';
import { TextCollectionIndex } from './TextCollectionIndex.js';
import { GeospatialCollectionIndex } from './GeospatialCollectionIndex.js';

/**
 * Collection class
 */
export class Collection {
	constructor(db, storage, idGenerator) {
		this.db = db;
		this.storage = storage;
		this.idGenerator = idGenerator;
		this.indexes = {}; // Index storage - map of index name to index structure
		this.isCollection = true; // TODO used by dropDatabase, ugly
	}

	/**
	 * Generate index name from keys
	 */
	generateIndexName(keys) {
		const parts = [];
		for (const field in keys) {
			if (keys.hasOwnProperty(field)) {
				parts.push(field + '_' + keys[field]);
			}
		}
		return parts.join('_');
	}

	/**
	 * Determine if keys specify a text index
	 */
	isTextIndex(keys) {
		for (const field in keys) {
			if (keys[field] === 'text') {
				return true;
			}
		}
		return false;
	}

	/**
	 * Determine if keys specify a geospatial index
	 */
	isGeospatialIndex(keys) {
		for (const field in keys) {
			if (keys[field] === '2dsphere' || keys[field] === '2d') {
				return true;
			}
		}
		return false;
	}

	/**
	 * Build/rebuild an index
	 */
	buildIndex(indexName, keys, options = {}) {
		let index;
		
		// Create appropriate index type
		if (this.isTextIndex(keys)) {
			index = new TextCollectionIndex(keys, { ...options, name: indexName });
		} else if (this.isGeospatialIndex(keys)) {
			index = new GeospatialCollectionIndex(keys, { ...options, name: indexName });
		} else {
			index = new RegularCollectionIndex(keys, { ...options, name: indexName });
		}

		// Build index by scanning all documents
		for (let i = 0; i < this.storage.size(); i++) {
			const doc = this.storage.get(i);
			if (doc) {
				index.add(doc);
			}
		}

		this.indexes[indexName] = index;
		return index;
	}

	/**
	 * Update indexes when a document is inserted
	 */
	updateIndexesOnInsert(doc) {
		for (const indexName in this.indexes) {
			if (this.indexes.hasOwnProperty(indexName)) {
				const index = this.indexes[indexName];
				index.add(doc);
			}
		}
	}

	/**
	 * Update indexes when a document is deleted
	 */
	updateIndexesOnDelete(doc) {
		for (const indexName in this.indexes) {
			if (this.indexes.hasOwnProperty(indexName)) {
				const index = this.indexes[indexName];
				index.remove(doc);
			}
		}
	}

	/**
	 * Query planner - analyze query and determine if an index can be used
	 */
	planQuery(query) {
		// Simple query planner - look for equality queries on indexed fields
		const queryKeys = Object.keys(query);

		for (const indexName in this.indexes) {
			if (this.indexes.hasOwnProperty(indexName)) {
				const index = this.indexes[indexName];
				
				// Skip text indexes - they are handled separately
				if (index instanceof TextCollectionIndex) {
					continue;
				}

				// Try geospatial indexes
				if (index instanceof GeospatialCollectionIndex) {
					const docIds = index.query(query);
					if (docIds !== null) {
						return {
							useIndex: true,
							indexName: indexName,
							docIds: docIds
						};
					}
					continue;
				}
				
				const indexFields = Object.keys(index.keys);

				// Check if query matches index (simple case: single field equality)
				// Note: Compound indexes are created but only single-field equality queries use them
				if (indexFields.length === 1) {
					const field = indexFields[0];
					// Check for simple equality
					if (queryKeys.indexOf(field) !== -1) {
						const queryValue = query[field];
						// Only use index for simple equality (not operators like $gt, $lt, etc.)
						if (typeof queryValue !== 'object' || queryValue === null) {
							const docIds = index.query(query);
							if (docIds !== null) {
								return {
									useIndex: true,
									indexName: indexName,
									docIds: docIds
								};
							}
						}
					}
				}
			}
		}

		return null;
	}

	/**
	 * Get a text index for the given field
	 * @param {string} field - The field name
	 * @returns {TextCollectionIndex|null} The text index or null if not found
	 */
	getTextIndex(field) {
		for (const indexName in this.indexes) {
			if (this.indexes.hasOwnProperty(indexName)) {
				const index = this.indexes[indexName];
				if (index instanceof TextCollectionIndex) {
					// Check if this field is indexed
					if (index.indexedFields.includes(field)) {
						return index;
					}
				}
			}
		}
		return null;
	}

	// Collection methods
	aggregate(pipeline) {
		if (!pipeline || !isArray(pipeline)) {
			throw { $err: "Pipeline must be an array", code: 17287 };
		}

		// Start with all documents
		let results = [];
		const cursor = this.find({});
		while (cursor.hasNext()) {
			results.push(cursor.next());
		}

		// Process each stage in the pipeline
		for (let i = 0; i < pipeline.length; i++) {
			const stage = pipeline[i];
			const stageKeys = Object.keys(stage);
			if (stageKeys.length !== 1) {
				throw { $err: "Each pipeline stage must have exactly one key", code: 17287 };
			}
			const stageType = stageKeys[0];
			const stageSpec = stage[stageType];

			if (stageType === "$match") {
				// Filter documents based on query
				const matched = [];
				for (let j = 0; j < results.length; j++) {
					if (matches(results[j], stageSpec)) {
						matched.push(results[j]);
					}
				}
				results = matched;
			} else if (stageType === "$project") {
				// Reshape documents
				const projected = [];
				for (let j = 0; j < results.length; j++) {
					projected.push(applyProjection(stageSpec, results[j]));
				}
				results = projected;
			} else if (stageType === "$sort") {
				// Sort documents
				const sortKeys = Object.keys(stageSpec);
				results.sort(function (a, b) {
					for (let k = 0; k < sortKeys.length; k++) {
						const key = sortKeys[k];
						if (a[key] === undefined && b[key] !== undefined) return -1 * stageSpec[key];
						if (a[key] !== undefined && b[key] === undefined) return 1 * stageSpec[key];
						if (a[key] < b[key]) return -1 * stageSpec[key];
						if (a[key] > b[key]) return 1 * stageSpec[key];
					}
					return 0;
				});
			} else if (stageType === "$limit") {
				// Limit number of documents
				results = results.slice(0, stageSpec);
			} else if (stageType === "$skip") {
				// Skip documents
				results = results.slice(stageSpec);
			} else if (stageType === "$group") {
				// Group documents
				const groups = {};
				const groupId = stageSpec._id;

				for (let j = 0; j < results.length; j++) {
					const doc = results[j];
					let key;

					// Compute group key
					if (groupId === null || groupId === undefined) {
						key = null;
					} else if (typeof groupId === 'string' && groupId.charAt(0) === '$') {
						// Field reference
						key = getProp(doc, groupId.substring(1));
					} else if (typeof groupId === 'object') {
						// Computed key
						key = JSON.stringify(groupId);
					} else {
						key = groupId;
					}

					const keyStr = JSON.stringify(key);

					// Initialize group
					if (!groups[keyStr]) {
						groups[keyStr] = {
							_id: key,
							docs: [],
							accumulators: {}
						};
					}

					groups[keyStr].docs.push(doc);
				}

				// Apply accumulators
				const grouped = [];
				for (const groupKey in groups) {
					const group = groups[groupKey];
					const result = { _id: group._id };

					// Process each accumulator field
					for (const field in stageSpec) {
						if (field === '_id') continue;

						const accumulator = stageSpec[field];
						const accKeys = Object.keys(accumulator);
						if (accKeys.length !== 1) continue;

						const accType = accKeys[0];
						const accExpr = accumulator[accType];

						if (accType === '$sum') {
							let sum = 0;
							for (let k = 0; k < group.docs.length; k++) {
								if (typeof accExpr === 'number') {
									sum += accExpr;
								} else if (typeof accExpr === 'string' && accExpr.charAt(0) === '$') {
									const val = getProp(group.docs[k], accExpr.substring(1));
									sum += val || 0;
								}
							}
							result[field] = sum;
						} else if (accType === '$avg') {
							let sum = 0;
							let count = 0;
							for (let k = 0; k < group.docs.length; k++) {
								if (typeof accExpr === 'string' && accExpr.charAt(0) === '$') {
									const val = getProp(group.docs[k], accExpr.substring(1));
									if (val !== undefined && val !== null) {
										sum += val;
										count++;
									}
								}
							}
							result[field] = count > 0 ? sum / count : 0;
						} else if (accType === '$min') {
							let min = undefined;
							for (let k = 0; k < group.docs.length; k++) {
								if (typeof accExpr === 'string' && accExpr.charAt(0) === '$') {
									const val = getProp(group.docs[k], accExpr.substring(1));
									if (val !== undefined && (min === undefined || val < min)) {
										min = val;
									}
								}
							}
							result[field] = min;
						} else if (accType === '$max') {
							let max = undefined;
							for (let k = 0; k < group.docs.length; k++) {
								if (typeof accExpr === 'string' && accExpr.charAt(0) === '$') {
									const val = getProp(group.docs[k], accExpr.substring(1));
									if (val !== undefined && (max === undefined || val > max)) {
										max = val;
									}
								}
							}
							result[field] = max;
						} else if (accType === '$push') {
							const arr = [];
							for (let k = 0; k < group.docs.length; k++) {
								if (typeof accExpr === 'string' && accExpr.charAt(0) === '$') {
									const val = getProp(group.docs[k], accExpr.substring(1));
									arr.push(val);
								}
							}
							result[field] = arr;
						} else if (accType === '$addToSet') {
							const set = {};
							for (let k = 0; k < group.docs.length; k++) {
								if (typeof accExpr === 'string' && accExpr.charAt(0) === '$') {
									const val = getProp(group.docs[k], accExpr.substring(1));
									set[JSON.stringify(val)] = val;
								}
							}
							const arr = [];
							for (const valKey in set) {
								arr.push(set[valKey]);
							}
							result[field] = arr;
						} else if (accType === '$first') {
							if (group.docs.length > 0) {
								if (typeof accExpr === 'string' && accExpr.charAt(0) === '$') {
									result[field] = getProp(group.docs[0], accExpr.substring(1));
								}
							}
						} else if (accType === '$last') {
							if (group.docs.length > 0) {
								if (typeof accExpr === 'string' && accExpr.charAt(0) === '$') {
									result[field] = getProp(group.docs[group.docs.length - 1], accExpr.substring(1));
								}
							}
						}
					}

					grouped.push(result);
				}
				results = grouped;
			} else if (stageType === "$count") {
				// Count documents and return single document with count
				results = [{ [stageSpec]: results.length }];
			} else if (stageType === "$unwind") {
				// Unwind array field
				const unwound = [];
				let fieldPath = stageSpec;
				if (typeof fieldPath === 'string' && fieldPath.charAt(0) === '$') {
					fieldPath = fieldPath.substring(1);
				}

				for (let j = 0; j < results.length; j++) {
					const doc = results[j];
					const arr = getProp(doc, fieldPath);

					if (arr && isArray(arr) && arr.length > 0) {
						for (let k = 0; k < arr.length; k++) {
							const unwoundDoc = copy(doc);
							// Set the unwound value
							const parts = fieldPath.split('.');
							let target = unwoundDoc;
							for (let l = 0; l < parts.length - 1; l++) {
								if (!target[parts[l]]) {
									target[parts[l]] = {};
								}
								target = target[parts[l]];
							}
							target[parts[parts.length - 1]] = arr[k];
							unwound.push(unwoundDoc);
						}
					}
					// MongoDB's default behavior: skip documents where field is missing, null, empty array, or not an array
				}
				results = unwound;
			} else {
				throw { $err: "Unsupported aggregation stage: " + stageType, code: 17287 };
			}
		}

		return results;
	}

	bulkWrite() { throw "Not Implemented"; }

	async count() {
		return this.storage.size();
	}

	async copyTo(destCollectionName) {
		if (!this.db[destCollectionName]) {
			this.db.createCollection(destCollectionName);
		}
		const destCol = this.db[destCollectionName];
		let numCopied = 0;
		const c = this.find({});
		while (c.hasNext()) {
			await destCol.insertOne(c.next());
			numCopied++;
		}
		return numCopied;
	}

	async createIndex(keys, options) {
		// MongoDB-compliant createIndex
		// keys: { fieldName: 1 } for ascending, { fieldName: -1 } for descending, { fieldName: 'text' } for text
		// options: { name: "indexName", unique: true, ... }

		if (!keys || typeof keys !== 'object' || Array.isArray(keys)) {
			throw { $err: "createIndex requires a key specification object", code: 2 };
		}

		const indexName = (options && options.name) ? options.name : this.generateIndexName(keys);

		// Check if index already exists
		if (this.indexes[indexName]) {
			// MongoDB checks for key specification conflicts
			const existingIndex = this.indexes[indexName];
			const existingKeys = JSON.stringify(existingIndex.keys);
			const newKeys = JSON.stringify(keys);
			if (existingKeys !== newKeys) {
				throw { $err: "Index with name '" + indexName + "' already exists with a different key specification", code: 85 };
			}
			// Same index, return without error
			return indexName;
		}

		// Build the index
		this.buildIndex(indexName, keys, options);

		return indexName;
	}

	dataSize() { throw "Not Implemented"; }

	async deleteOne(query) {
		const doc = await this.findOne(query);
		if (doc) {
			this.updateIndexesOnDelete(doc);
			this.storage.remove(doc._id);
			return { deletedCount: 1 };
		} else {
			return { deletedCount: 0 };
		}
	}

	async deleteMany(query) {
		const c = this.find(query);
		const ids = [];
		const docs = [];
		while (c.hasNext()) {
			const doc = c.next();
			ids.push(doc._id);
			docs.push(doc);
		}
		const deletedCount = ids.length;
		for (let i = 0; i < ids.length; i++) {
			this.updateIndexesOnDelete(docs[i]);
			this.storage.remove(ids[i]);
		}
		return { deletedCount: deletedCount };
	}

	async distinct(field, query) {
		const vals = {};
		const c = this.find(query);
		while (c.hasNext()) {
			const d = c.next();
			if (d[field]) {
				vals[d[field]] = true;
			}
		}
		return Object.keys(vals);
	}

	drop() {
		this.storage.clear();
		// Clear all indexes
		for (const indexName in this.indexes) {
			if (this.indexes.hasOwnProperty(indexName)) {
				this.indexes[indexName].clear();
			}
		}
	}

	dropIndex(indexName) {
		if (!this.indexes[indexName]) {
			throw { $err: "Index not found with name: " + indexName, code: 27 };
		}
		this.indexes[indexName].clear();
		delete this.indexes[indexName];
		return { nIndexesWas: Object.keys(this.indexes).length + 1, ok: 1 };
	}

	dropIndexes() {
		const count = Object.keys(this.indexes).length;
		for (const indexName in this.indexes) {
			if (this.indexes.hasOwnProperty(indexName)) {
				this.indexes[indexName].clear();
			}
		}
		this.indexes = {};
		return { nIndexesWas: count, msg: "non-_id indexes dropped", ok: 1 };
	}
	ensureIndex() { throw "Not Implemented"; }
	explain() { throw "Not Implemented"; }

	find(query, projection) {
		return new Cursor(
			this,
			(query == undefined ? {} : query),
			projection,
			matches,
			this.storage,
			this.indexes,
			this.planQuery.bind(this),
			SortedCursor
		);
	}

	findAndModify() { throw "Not Implemented"; }

	async findOne(query, projection) {
		const cursor = this.find(query, projection);
		if (cursor.hasNext()) {
			return cursor.next();
		} else {
			return null;
		}
	}

	async findOneAndDelete(filter, options) {
		let c = this.find(filter);
		if (options && options.sort) c = c.sort(options.sort);
		if (!c.hasNext()) return null;
		const doc = c.next();
		this.storage.remove(doc._id);
		if (options && options.projection) return applyProjection(options.projection, doc);
		else return doc;
	}

	async findOneAndReplace(filter, replacement, options) {
		let c = this.find(filter);
		if (options && options.sort) c = c.sort(options.sort);
		if (!c.hasNext()) return null;
		const doc = c.next();
		replacement._id = doc._id;
		this.storage.set(doc._id, replacement);
		if (options && options.returnNewDocument) {
			if (options && options.projection) return applyProjection(options.projection, replacement);
			else return replacement;
		} else {
			if (options && options.projection) return applyProjection(options.projection, doc);
			else return doc;
		}
	}

	async findOneAndUpdate(filter, update, options) {
		let c = this.find(filter);
		if (options && options.sort) c = c.sort(options.sort);
		if (!c.hasNext()) return null;
		const doc = c.next();
		const clone = Object.assign({}, doc);
		applyUpdates(update, clone);
		this.storage.set(doc._id, clone);
		if (options && options.returnNewDocument) {
			if (options && options.projection) return applyProjection(options.projection, clone);
			else return clone;
		} else {
			if (options && options.projection) return applyProjection(options.projection, doc);
			else return doc;
		}
	}

	getIndexes() {
		// Return array of index specifications
		const result = [];
		for (const indexName in this.indexes) {
			if (this.indexes.hasOwnProperty(indexName)) {
				result.push(this.indexes[indexName].getSpec());
			}
		}
		return result;
	}

	getShardDistribution() { throw "Not Implemented"; }
	getShardVersion() { throw "Not Implemented"; }

	// non-mongo
	getStore() {
		return this.storage.getStore();
	}

	group() { throw "Not Implemented"; }

	async insert(doc) {
		if (Array == doc.constructor) {
			return await this.insertMany(doc);
		} else {
			return await this.insertOne(doc);
		}
	}

	async insertOne(doc) {
		if (doc._id == undefined) doc._id = this.idGenerator();
		this.storage.set(doc._id, doc);
		this.updateIndexesOnInsert(doc);
		return { insertedId: doc._id };
	}

	async insertMany(docs) {
		const insertedIds = [];
		for (let i = 0; i < docs.length; i++) {
			const result = await this.insertOne(docs[i]);
			insertedIds.push(result.insertedId);
		}
		return { insertedIds: insertedIds };
	}

	isCapped() { throw "Not Implemented"; }
	mapReduce() { throw "Not Implemented"; }
	reIndex() { throw "Not Implemented"; }

	async replaceOne(query, replacement, options) { // only replace
		// first
		const result = {};
		const c = this.find(query);
		result.matchedCount = c.count();
		if (result.matchedCount == 0) {
			result.modifiedCount = 0;
			if (options && options.upsert) {
				const newDoc = replacement;
				newDoc._id = this.idGenerator();
				this.storage.set(newDoc._id, newDoc);
				result.upsertedId = newDoc._id;
			}
		} else {
			result.modifiedCount = 1;
			const doc = c.next();
			this.updateIndexesOnDelete(doc);
			replacement._id = doc._id;
			this.storage.set(doc._id, replacement);
			this.updateIndexesOnInsert(replacement);
		}
		return result;
	}

	remove(query, options) {
		const c = this.find(query);
		if (!c.hasNext()) return;
		if (options === true || (options && options.justOne)) {
			const doc = c.next();
			this.updateIndexesOnDelete(doc);
			this.storage.remove(doc._id);
		} else {
			while (c.hasNext()) {
				const doc = c.next();
				this.updateIndexesOnDelete(doc);
				this.storage.remove(doc._id);
			}
		}
	}

	renameCollection() { throw "Not Implemented"; }
	save() { throw "Not Implemented"; }
	stats() { throw "Not Implemented"; }
	storageSize() { throw "Not Implemented"; }
	totalSize() { throw "Not Implemented"; }
	totalIndexSize() { throw "Not Implemented"; }

	update(query, updates, options) {
		const c = this.find(query);
		if (c.hasNext()) {
			if (options && options.multi) {
				while (c.hasNext()) {
					const doc = c.next();
					this.updateIndexesOnDelete(doc);
					applyUpdates(updates, doc);
					this.storage.set(doc._id, doc);
					this.updateIndexesOnInsert(doc);
				}
			} else {
				const doc = c.next();
				this.updateIndexesOnDelete(doc);
				applyUpdates(updates, doc);
				this.storage.set(doc._id, doc);
				this.updateIndexesOnInsert(doc);
			}
		} else {
			if (options && options.upsert) {
				const newDoc = createDocFromUpdate(query, updates, this.idGenerator);
				this.storage.set(newDoc._id, newDoc);
				this.updateIndexesOnInsert(newDoc);
			}
		}
	}

	async updateOne(query, updates, options) {
		const c = this.find(query);
		if (c.hasNext()) {
			const doc = c.next();
			this.updateIndexesOnDelete(doc);
			applyUpdates(updates, doc);
			this.storage.set(doc._id, doc);
			this.updateIndexesOnInsert(doc);
		} else {
			if (options && options.upsert) {
				const newDoc = createDocFromUpdate(query, updates, this.idGenerator);
				this.storage.set(newDoc._id, newDoc);
				this.updateIndexesOnInsert(newDoc);
			}
		}
	}

	async updateMany(query, updates, options) {
		const c = this.find(query);
		if (c.hasNext()) {
			while (c.hasNext()) {
				const doc = c.next();
				this.updateIndexesOnDelete(doc);
				applyUpdates(updates, doc);
				this.storage.set(doc._id, doc);
				this.updateIndexesOnInsert(doc);
			}
		} else {
			if (options && options.upsert) {
				const newDoc = createDocFromUpdate(query, updates, this.idGenerator);
				this.storage.set(newDoc._id, newDoc);
				this.updateIndexesOnInsert(newDoc);
			}
		}
	}

	validate() { throw "Not Implemented"; }

	/**
	 * Export collection state for storage
	 * @returns {Object} Collection state including documents and indexes
	 */
	exportState() {
		// Export all documents
		const documents = [];
		for (let i = 0; i < this.storage.size(); i++) {
			const doc = this.storage.get(i);
			if (doc) {
				documents.push(doc);
			}
		}

		// Export all indexes
		const indexes = [];
		for (const indexName in this.indexes) {
			if (this.indexes.hasOwnProperty(indexName)) {
				const index = this.indexes[indexName];
				indexes.push(index.serialize());
			}
		}

		return {
			documents: documents,
			indexes: indexes
		};
	}

	/**
	 * Import collection state from storage
	 * @param {Object} state - Collection state including documents and indexes
	 */
	async importState(state) {
		// Clear existing data
		this.storage.clear();
		for (const indexName in this.indexes) {
			if (this.indexes.hasOwnProperty(indexName)) {
				this.indexes[indexName].clear();
			}
		}
		this.indexes = {};

		// Import documents
		if (state.documents && Array.isArray(state.documents)) {
			for (const doc of state.documents) {
				this.storage.set(doc._id, doc);
			}
		}

		// Import indexes
		if (state.indexes && Array.isArray(state.indexes)) {
			for (const indexState of state.indexes) {
				// Recreate the index based on its type
				let index;
				if (indexState.type === 'text') {
					index = new TextCollectionIndex(indexState.keys, indexState.options);
					index.deserialize(indexState);
				} else if (indexState.type === 'geospatial') {
					index = new GeospatialCollectionIndex(indexState.keys, indexState.options);
					index.deserialize(indexState);
				} else {
					// Default to regular index
					index = new RegularCollectionIndex(indexState.keys, indexState.options);
					index.deserialize(indexState);
				}
				this.indexes[index.name] = index;
			}
		}
	}
}
