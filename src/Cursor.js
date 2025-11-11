import { applyProjection } from './utils.js';

/**
 * Cursor class for iterating over query results
 */
export class Cursor {
	constructor(collection, query, projection, matches, storage, indexes, planQuery, SortedCursor) {
		this.collection = collection;
		this.query = query;
		this.projection = projection;
		this.matches = matches;
		this.storage = storage;
		this.indexes = indexes;
		this.planQuery = planQuery;
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
				throw { $err: "Can't canonicalize query: BadValue Projection cannot have a mix of inclusion and exclusion.", code: 17287 };
			}
		}
		
		this.pos = 0;
		this.max = 0;
		this._next = false; // false == unknown, null == no more, !null == next
		
		// Query planning - check if we can use an index
		const queryPlan = this.planQuery(this.query);
		this.useIndex = queryPlan && queryPlan.useIndex;
		this.planType = queryPlan ? queryPlan.planType : 'full_scan';
		this.indexDocIds = null;
		this.indexPos = 0;
		this.fullScanDocIds = {}; // Track which docs we've seen to avoid duplicates
		this.indexOnly = queryPlan && queryPlan.indexOnly; // If true, don't fall back to full scan

		// If using index, get the document IDs from the query plan
		if (this.useIndex && queryPlan.docIds) {
			this.indexDocIds = queryPlan.docIds.slice();
		}
		
		// Initialize by finding first document
		this._findNext();
	}

	_findNext() {
		// First, try to get documents from index
		while (this.indexDocIds !== null && this.indexPos < this.indexDocIds.length) {
			const docId = this.indexDocIds[this.indexPos++];
			const doc = this.storage.getStore()[docId];
			if (doc && this.matches(doc, this.query)) {
				this.fullScanDocIds[doc._id] = true;
				this._next = doc;
				return;
			}
			// If doc doesn't match (shouldn't happen with good index), continue to next
		}

		// If index-only query (e.g., text search, geospatial), don't fall back to full scan
		if (this.indexOnly) {
			this._next = null;
			return;
		}

		// Then fall back to full scan for remaining documents
		// This handles complex queries where index only partially matches
		while (this.pos < this.storage.size() && (this.max == 0 || this.pos < this.max)) {
			const cur = this.storage.get(this.pos++);
			// Skip docs we already returned from index
			if (cur && !this.fullScanDocIds[cur._id] && this.matches(cur, this.query)) {
				this.fullScanDocIds[cur._id] = true;
				this._next = cur;
				return;
			}
		}
		this._next = null;
	}

	batchSize() { throw "Not Implemented"; }
	close() { throw "Not Implemented"; }
	comment() { throw "Not Implemented"; }
	
	count() {
		let num = 0;
		const c = new Cursor(this.collection, this.query, null, this.matches, this.storage, this.indexes, this.planQuery, this.SortedCursor);
		while (c.hasNext()) {
			num++;
			c.next();
		}
		return num;
	}
	
	explain() { throw "Not Implemented"; }
	
	async forEach(fn) {
		while (this.hasNext()) {
			await fn(this.next());
		}
	}
	
	hasNext() {
		if (this._next === false) this._findNext();
		return this._next != null;
	}
	
	hint() { throw "Not Implemented"; }
	itcount() { throw "Not Implemented"; }
	
	limit(_max) {
		this.max = _max;
		return this;
	}
	
	map(fn) {
		const results = [];
		while (this.hasNext()) {
			results.push(fn(this.next()));
		}
		return results;
	}
	
	maxScan() { throw "Not Implemented"; }
	maxTimeMS() { throw "Not Implemented"; }
	max() { throw "Not Implemented"; }
	min() { throw "Not Implemented"; }
	
	next() {
		if (this._next == null) throw "Error: error hasNext: false";
		const result = this._next;
		this._findNext();
		if (this.projection) return applyProjection(this.projection, result);
		else return result;
	}
	
	noCursorTimeout() { throw "Not Implemented"; }
	objsLeftInBatch() { throw "Not Implemented"; }
	pretty() { throw "Not Implemented"; }
	readConcern() { throw "Not Implemented"; }
	readPref() { throw "Not Implemented"; }
	returnKey() { throw "Not Implemented"; }
	showRecordId() { throw "Not Implemented"; }
	size() { throw "Not Implemented"; }
	
	skip(num) {
		while (num > 0) {
			this.next();
			num--;
		}
		return this;
	}
	
	snapshot() { throw "Not Implemented"; }
	
	sort(s) {
		return new this.SortedCursor(this.collection, this.query, this, s);
	}
	
	tailable() { throw "Not Implemented"; }
	
	async toArray() {
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
