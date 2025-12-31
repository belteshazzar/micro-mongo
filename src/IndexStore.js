/**
 * IndexStore - In-memory index storage for collections
 * 
 * Simple key-value store using a plain JavaScript object
 */
export class IndexStore {
	constructor(meta) {
    this._meta = new Map();
		this._data = new Map();
    
    if (meta) {
      for (const [key, value] of Object.entries(meta)) {
        this._meta.set(key, value);
      }
    }
	}

  /**
   * Return all metadata as a plain object
   */
  getAllMeta() {
    const meta = {};
    for (const [key, value] of this._meta) {
      meta[key] = value;
    }
    return meta;
  }

	setMeta(key, value) {
		this._meta.set(key, value);
	}

  hasMeta(key) {
    return this._meta.has(key);
  }

  getMeta(key) {
		return this._meta.get(key);
	}

  hasDataMap(name) {
    return this._data.has(name);
  }

  getDataMap(name) {
    if (!this._data.has(name)) {
      this._data.set(name, new Map());
    }
    return this._data.get(name);
  }

	// clear() {
	// 	this._data.clear();
	// }

  // keys() {
  //   return this._data.keys();
  // }

  // has(index) {
  //   return this._data.has(index);
  // }

	// get(index) {
	// 	return this._data.get(index);
	// }

	// remove(key) {
	// 	this._data.delete(key);
	// }

	// set(key, value) {
	// 	this._data.set(key, value);
	// }

	// size() {
	// 	return this._data.size;
	// }
}
