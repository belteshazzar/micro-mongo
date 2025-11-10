/**
 * SortedCursor class for iterating over sorted query results
 */
export class SortedCursor {
	constructor(collection, query, cursor, sort) {
		this.collection = collection;
		this.query = query;
		this.sortSpec = sort;
		this.pos = 0;
		this.items = [];
		
		// Collect all items from the cursor
		while (cursor.hasNext()) {
			this.items.push(cursor.next());
		}
		
		// Sort the items
		const sortKeys = Object.keys(sort);
		this.items.sort(function(a, b) {
			for (let i = 0; i < sortKeys.length; i++) {
				if (a[sortKeys[i]] == undefined && b[sortKeys[i]] != undefined) return -1 * sort[sortKeys[i]];
				if (a[sortKeys[i]] != undefined && b[sortKeys[i]] == undefined) return 1 * sort[sortKeys[i]];
				if (a[sortKeys[i]] < b[sortKeys[i]]) return -1 * sort[sortKeys[i]];
				if (a[sortKeys[i]] > b[sortKeys[i]]) return 1 * sort[sortKeys[i]];
			}
			return 0;
		});
	}

	batchSize() { throw "Not Implemented"; }
	close() { throw "Not Implemented"; }
	comment() { throw "Not Implemented"; }
	
	count() {
		return this.items.length;
	}
	
	explain() { throw "Not Implemented"; }
	
	forEach(fn) {
		while (this.hasNext()) {
			fn(this.next());
		}
	}
	
	hasNext() {
		return this.pos < this.items.length;
	}
	
	hint() { throw "Not Implemented"; }
	itcount() { throw "Not Implemented"; }
	
	limit(max) {
		this.items = this.items.slice(0, max);
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
	
	skip(num) {
		while (num > 0) {
			this.next();
			num--;
		}
		return this;
	}
	
	snapshot() { throw "Not Implemented"; }
	
	sort(s) {
		return new SortedCursor(this.collection, this.query, this, s);
	}
	
	tailable() { throw "Not Implemented"; }
	
	toArray() {
		const results = [];
		while (this.hasNext()) {
			results.push(this.next());
		}
		return results;
	}
}
