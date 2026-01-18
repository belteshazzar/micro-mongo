/**
 * SortedCursor class for iterating over sorted query results
 */
import { QueryError } from '../errors.js';

export class SortedCursor {
	constructor(collection, query, cursor, sort) {
		this.collection = collection;
		this.query = query;
		this.sortSpec = sort;
		this.pos = 0;
		this._cursor = cursor;
		this._sort = sort;
		this._initialized = false;
		// Items will be populated lazily when first accessed
		this.items = null;
	}

	async _ensureInitialized() {
		if (this._initialized) return;
		
		// Ensure parent cursor is initialized
		await this._cursor._ensureInitialized();
		
		this.items = [];
		// Collect all items from the cursor
		while (await this._cursor.hasNext()) {
			this.items.push(await this._cursor.next());
		}
		
		// Sort the items
		const sortKeys = Object.keys(this._sort);
		this.items.sort(function(a, b) {
			for (let i = 0; i < sortKeys.length; i++) {
				if (a[sortKeys[i]] == undefined && b[sortKeys[i]] != undefined) return -1 * this._sort[sortKeys[i]];
				if (a[sortKeys[i]] != undefined && b[sortKeys[i]] == undefined) return 1 * this._sort[sortKeys[i]];
				if (a[sortKeys[i]] < b[sortKeys[i]]) return -1 * this._sort[sortKeys[i]];
				if (a[sortKeys[i]] > b[sortKeys[i]]) return 1 * this._sort[sortKeys[i]];
			}
			return 0;
		}.bind(this));
		
		this._initialized = true;
	}

	batchSize() { throw "Not Implemented"; }
	close() { throw "Not Implemented"; }
	comment() { throw "Not Implemented"; }
	
	async count() {
		await this._ensureInitialized();
		return this.items.length;
	}
	
	explain() { throw "Not Implemented"; }
	
	async forEach(fn) {
		await this._ensureInitialized();
		while (await this.hasNext()) {
			await fn(await this.next());
		}
	}
	
	async hasNext() {
		await this._ensureInitialized();
		return this.pos < this.items.length;
	}
	
	hint() { throw "Not Implemented"; }
	itcount() { throw "Not Implemented"; }
	
	async limit(max) {
		await this._ensureInitialized();
		this.items = this.items.slice(0, max);
		return this;
	}
	
	async map(fn) {
		await this._ensureInitialized();
		const results = [];
		while (await this.hasNext()) {
			results.push(await fn(await this.next()));
		}
		return results;
	}
	
	maxScan() { throw "Not Implemented"; }
	maxTimeMS() { throw "Not Implemented"; }
	max() { throw "Not Implemented"; }
	min() { throw "Not Implemented"; }
	
	async next() {
		await this._ensureInitialized();
		return this.items[this.pos++];
	}
	
	noCursorTimeout() { throw "Not Implemented"; }
	objsLeftInBatch() { throw "Not Implemented"; }
	pretty() { throw "Not Implemented"; }
	readConcern() { throw "Not Implemented"; }
	readPref() { throw "Not Implemented"; }
	returnKey() { throw "Not Implemented"; }
	showRecordId() { throw "Not Implemented"; }
	size() { throw "Not Implemented"; }
	
	async skip(num) {
		await this._ensureInitialized();
		while (num > 0) {
			await this.next();
			num--;
		}
		return this;
	}
	
	snapshot() { throw "Not Implemented"; }
	
	sort(s) {
		return new SortedCursor(this.collection, this.query, this, s);
	}
	
	tailable() { throw "Not Implemented"; }
	
	async toArray() {
		await this._ensureInitialized();
		const results = [];
		while (await this.hasNext()) {
			results.push(this.next());
		}
		return results;
	}
	
	// Support for async iteration (for await...of)
	async *[Symbol.asyncIterator]() {
		await this._ensureInitialized();
		while (await this.hasNext()) {
			yield await this.next();
		}
	}
}
