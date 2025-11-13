import { applyProjection } from './utils.js';

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
				throw { $err: "Can't canonicalize query: BadValue Projection cannot have a mix of inclusion and exclusion.", code: 17287 };
			}
		}
		
		this.pos = 0;
		this.max = 0;
	}

	batchSize() { throw "Not Implemented"; }
	close() { throw "Not Implemented"; }
	comment() { throw "Not Implemented"; }
	
	count() {
		// Return total count without considering skip/limit applied to this cursor
		return this.documents.length;
	}
	
	explain() { throw "Not Implemented"; }
	
	async forEach(fn) {
		while (this.hasNext()) {
			await fn(this.next());
		}
	}
	
	hasNext() {
		const effectiveMax = this.max > 0 ? Math.min(this.max, this.documents.length) : this.documents.length;
		return this.pos < effectiveMax;
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
		if (!this.hasNext()) {
			throw "Error: error hasNext: false";
		}
		const result = this.documents[this.pos++];
		if (this.projection) {
			return applyProjection(this.projection, result);
		}
		return result;
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
		this.pos = Math.min(this.pos + num, this.documents.length);
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
