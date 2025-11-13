/**
 * IndexStore - In-memory index storage for collections
 * 
 * Simple key-value store using a plain JavaScript object
 */
export class IndexStore {
	constructor() {
		this.data = new Map();
	}

	clear() {
		this.data.clear();
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
