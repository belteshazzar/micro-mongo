import { applyProjection } from './utils.js';
import { NotImplementedError, QueryError, ErrorCodes } from './errors.js';

/**
 * Cursor class for iterating over query results
 * Now a simple iterator over pre-filtered documents
 */
export class Cursor {
	constructor(collection, query, projection, documents, SortedCursor) {
		this.collection = collection;
		this.query = query;
		this.projection = projection;
		this.documents = documents; // Pre-filtered array of documents
		this.SortedCursor = SortedCursor;

		// Validate projection if provided
		if (projection && Object.keys(projection).length > 0) {
			const keys = Object.keys(projection);
			let hasInclusion = false;
			let hasExclusion = false;
			for (let i = 0; i < keys.length; i++) {
				if (keys[i] === '_id') continue; // _id is special
				if (projection[keys[i]]) hasInclusion = true;
				else hasExclusion = true;
			}
			
			if (hasInclusion && hasExclusion) {
				throw new QueryError("Can't canonicalize query: BadValue Projection cannot have a mix of inclusion and exclusion.", { 
					code: ErrorCodes.FAILED_TO_PARSE,
					collection: collection.name 
				});
			}
		}
		
		this.pos = 0;
		this._limit = 0;
		this._skip = 0;
		this._closed = false;
	}

	batchSize(size) { 
		// No-op for in-memory database, but return this for chaining
		this._batchSize = size;
		return this;
	}
	close() {
		this._closed = true;
		this.pos = this.documents.length; // Move to end
		return undefined;
	}
	comment(commentString) {
		this._comment = commentString;
		return this;
	}
	
	count() {
		// Return total count without considering skip/limit applied to this cursor
		return this.documents.length;
	}
	
	explain(verbosity = 'queryPlanner') {
		// Return basic query execution info
		return {
			queryPlanner: {
				plannerVersion: 1,
				namespace: `${this.collection.db?.name || 'db'}.${this.collection.name}`,
				indexFilterSet: false,
				parsedQuery: this.query,
				winningPlan: {
					stage: 'COLLSCAN',
					filter: this.query,
					direction: 'forward'
				}
			},
			executionStats: verbosity === 'executionStats' || verbosity === 'allPlansExecution' ? {
				executionSuccess: true,
				nReturned: this.documents.length,
				executionTimeMillis: 0,
				totalKeysExamined: 0,
				totalDocsExamined: this.documents.length
			} : undefined,
			ok: 1
		};
	}
	
	async forEach(fn) {
		while (this.hasNext()) {
			await fn(this.next());
		}
	}
	
	hasNext() {
		if (this._closed) return false;
		// Calculate effective max position: skip + limit or total docs
		let effectiveMax;
		if (this._limit > 0) {
			effectiveMax = Math.min(this._skip + this._limit, this.documents.length);
		} else {
			effectiveMax = this.documents.length;
		}
		return this.pos < effectiveMax;
	}
	
	hint(index) {
		// Store hint for query planner (informational in micro-mongo)
		this._hint = index;
		return this;
	}
	itcount() {
		let count = 0;
		while (this.hasNext()) {
			this.next();
			count++;
		}
		return count;
	}
	
	limit(_max) {
		this._limit = _max;
		return this;
	}
	
	map(fn) {
		const results = [];
		while (this.hasNext()) {
			results.push(fn(this.next()));
		}
		return results;
	}
	
	maxScan(maxScan) {
		// Set maximum number of documents to scan (deprecated in MongoDB 4.0)
		this._maxScan = maxScan;
		return this;
	}
	maxTimeMS(ms) {
		// Set maximum execution time (informational in micro-mongo)
		this._maxTimeMS = ms;
		return this;
	}
	max(indexBounds) {
		// Set maximum index bound (informational in micro-mongo)
		this._maxIndexBounds = indexBounds;
		return this;
	}
	min(indexBounds) {
		// Set minimum index bound (informational in micro-mongo)
		this._minIndexBounds = indexBounds;
		return this;
	}
	
	next() {
		if (!this.hasNext()) {
			throw new QueryError("Error: error hasNext: false", { 
				collection: this.collection.name 
			});
		}
		const result = this.documents[this.pos++];
		if (this.projection) {
			return applyProjection(this.projection, result);
		}
		return result;
	}
	
	noCursorTimeout() {
		// Prevent cursor timeout (no-op for in-memory)
		this._noCursorTimeout = true;
		return this;
	}
	objsLeftInBatch() {
		// Return number of objects left in current batch
		// For in-memory, this is same as remaining documents
		return this.size();
	}
	pretty() {
		// Enable pretty printing (no-op but return this for chaining)
		this._pretty = true;
		return this;
	}
	readConcern(level) {
		// Set read concern (no-op for in-memory database)
		this._readConcern = level;
		return this;
	}
	readPref(mode, tagSet) {
		// Set read preference (no-op for in-memory database)
		this._readPref = { mode, tagSet };
		return this;
	}
	returnKey(enabled = true) {
		// Return only the index key (informational in micro-mongo)
		this._returnKey = enabled;
		return this;
	}
	showRecordId(enabled = true) {
		// Show record ID in results
		this._showRecordId = enabled;
		return this;
	}
	size() {
		// Return count considering skip and limit
		const remaining = this.documents.length - this.pos;
		if (this._limit > 0) {
			// Calculate how many docs left based on skip+limit boundary
			const maxPos = this._skip + this._limit;
			return Math.min(maxPos - this.pos, remaining);
		}
		return remaining;
	}
	
	skip(num) {
		this._skip = num;
		// Move initial position to skip point
		if (this.pos === 0) {
			this.pos = Math.min(num, this.documents.length);
		}
		return this;
	}
	
	isClosed() {
		return this._closed === true;
	}
	
	snapshot() { throw new NotImplementedError('snapshot'); }
	
	sort(s) {
		return new this.SortedCursor(this.collection, this.query, this, s);
	}
	
	allowDiskUse(enabled = true) {
		// Allow disk use for sorts (no-op for in-memory)
		this._allowDiskUse = enabled;
		return this;
	}
	
	collation(collationDocument) {
		// Set collation (no-op for micro-mongo)
		this._collation = collationDocument;
		return this;
	}
	
	tailable() { throw new NotImplementedError('tailable'); }
	
	toArray() {
		const results = [];
		while (this.hasNext()) {
			results.push(this.next());
		}
		return results;
	}
	
	// Support for async iteration (for await...of)
	async *[Symbol.asyncIterator]() {
		while (this.hasNext()) {
			yield this.next();
		}
	}
}
