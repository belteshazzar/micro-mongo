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
	}		this.pos = 0;
		this.max = 0;
	}

	batchSize() { throw new NotImplementedError('batchSize'); }
	close() { throw new NotImplementedError('close'); }
	comment() { throw new NotImplementedError('comment'); }
	
	count() {
		// Return total count without considering skip/limit applied to this cursor
		return this.documents.length;
	}
	
	explain() { throw new NotImplementedError('explain'); }
	
	async forEach(fn) {
		while (this.hasNext()) {
			await fn(this.next());
		}
	}
	
	hasNext() {
		const effectiveMax = this.max > 0 ? Math.min(this.max, this.documents.length) : this.documents.length;
		return this.pos < effectiveMax;
	}
	
	hint() { throw new NotImplementedError('hint'); }
	itcount() { throw new NotImplementedError('itcount'); }
	
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
	
	maxScan() { throw new NotImplementedError('maxScan'); }
	maxTimeMS() { throw new NotImplementedError('maxTimeMS'); }
	max() { throw new NotImplementedError('max'); }
	min() { throw new NotImplementedError('min'); }
	
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
	
	noCursorTimeout() { throw new NotImplementedError('noCursorTimeout'); }
	objsLeftInBatch() { throw new NotImplementedError('objsLeftInBatch'); }
	pretty() { throw new NotImplementedError('pretty'); }
	readConcern() { throw new NotImplementedError('readConcern'); }
	readPref() { throw new NotImplementedError('readPref'); }
	returnKey() { throw new NotImplementedError('returnKey'); }
	showRecordId() { throw new NotImplementedError('showRecordId'); }
	size() { throw new NotImplementedError('size'); }
	
	skip(num) {
		this.pos = Math.min(this.pos + num, this.documents.length);
		return this;
	}
	
	snapshot() { throw new NotImplementedError('snapshot'); }
	
	sort(s) {
		return new this.SortedCursor(this.collection, this.query, this, s);
	}
	
	tailable() { throw new NotImplementedError('tailable'); }
	
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
