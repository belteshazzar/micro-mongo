/**
 * IndexStore - In-memory index storage for collections
 * 
 * Simple key-value store using a plain JavaScript object
 */
export class IndexStore {
	constructor() {
		this.data = {};
	}

	clear() {
		this.data = {};
	}

	get(index) {
		return this.data[Object.keys(this.data)[index]];
	}

	getStore() {
		return this.data;
	}

	remove(key) {
		delete this.data[key];
	}

	set(key, value) {
		this.data[key] = value;
	}

	size() {
		return Object.keys(this.data).length;
	}
}
