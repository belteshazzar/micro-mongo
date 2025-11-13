/**
 * DocumentStore - In-memory document storage for collections
 * Simple key-value store using a plain JavaScript object
 */
export class DocumentStore {
	constructor() {
		this.data = new Map();
	}

	clear() {
		this.data = new Map();
	}

  keys() {
    return this.data.keys();
  }

	get(index) {
		return this.data.get(index);
	}

	remove(key) {
		this.data.delete(key);
	}

	set(key, value) {
		this.data.set(key, value);
	}

	size() {
		return this.data.size;
	}
}
