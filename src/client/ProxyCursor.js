/**
 * ProxyCursor lives on the main thread and batches getMore calls to the worker.
 */
export class ProxyCursor {
  constructor({ bridge, cursorId, batch = [], exhausted = false, batchSize = 100, requestPromise }) {
    this.bridge = bridge;
    this.cursorId = cursorId;
    this.buffer = Array.isArray(batch) ? batch : [];
    this.exhausted = exhausted || false;
    this._batchSize = batchSize;
    this._requestPromise = requestPromise || null;
    this._initialized = !requestPromise; // If no requestPromise, already initialized
  }

  async _ensureInitialized() {
    if (this._initialized) return;
    if (this._requestPromise) {
      const res = await this._requestPromise;
      this.cursorId = res.cursorId;
      this.buffer = res.batch || [];
      this.exhausted = res.exhausted || false;
      this._batchSize = res.batchSize || 100;
      this._requestPromise = null;
      this._initialized = true;
    }
  }

  async hasNext() {
    await this._ensureInitialized();
    if (this.buffer.length > 0) return true;
    if (this.exhausted) return false;
    await this._getMore();
    return this.buffer.length > 0;
  }

  async next() {
    const has = await this.hasNext();
    if (!has) return null;
    return this.buffer.shift();
  }

  async toArray() {
    await this._ensureInitialized();
    const results = [...this.buffer];
    this.buffer = [];
    while (!this.exhausted) {
      await this._getMore();
      results.push(...this.buffer);
      this.buffer = [];
    }
    return results;
  }

  async count() {
    // Fetch all documents and return count
    const arr = await this.toArray();
    return arr.length;
  }

  // Cursor modifiers that return this for chaining
  limit(n) {
    this._limit = n;
    return this;
  }

  skip(n) {
    this._skip = n;
    return this;
  }

  sort(spec) {
    this._sort = spec;
    return this;
  }

  batchSize(n) {
    this._batchSize = n;
    return this;
  }

  // Cursor metadata methods
  close() {
    this._closed = true;
    return this;
  }

  isClosed() {
    return this._closed || false;
  }

  comment(str) {
    this._comment = str;
    return this;
  }

  hint(spec) {
    this._hint = spec;
    return this;
  }

  explain(verbosity = 'queryPlanner') {
    return {
      queryPlanner: {
        plannerVersion: 1,
        namespace: `unknown`,
        indexFilterSet: false,
        winningPlan: {
          stage: 'COLLSCAN'
        }
      },
      ok: 1
    };
  }

  async itcount() {
    // Iterate and count - must be called async
    return this.count();
  }

  size() {
    // Return count of documents remaining in current batch (after any fetches/iterations)
    return this.buffer.length;
  }

  min(spec) {
    this._min = spec;
    return this;
  }

  max(spec) {
    this._max = spec;
    return this;
  }

  maxTimeMS(ms) {
    this._maxTimeMS = ms;
    return this;
  }

  maxScan(n) {
    this._maxScan = n;
    return this;
  }

  noCursorTimeout() {
    this._noCursorTimeout = true;
    return this;
  }

  objsLeftInBatch() {
    return this.buffer.length;
  }

  pretty() {
    this._pretty = true;
    return this;
  }

  readConcern(level) {
    this._readConcern = level;
    return this;
  }

  readPref(mode, tagSet) {
    this._readPref = { mode, tagSet };
    return this;
  }

  returnKey(bool = true) {
    this._returnKey = bool;
    return this;
  }

  showRecordId(bool = true) {
    this._showRecordId = bool;
    return this;
  }

  allowDiskUse(bool = true) {
    this._allowDiskUse = bool;
    return this;
  }

  collation(spec) {
    this._collation = spec;
    return this;
  }

  async forEach(fn) {
    while (await this.hasNext()) {
      const doc = await this.next();
      await fn(doc);
    }
  }

  async map(fn) {
    const results = [];
    while (await this.hasNext()) {
      const doc = await this.next();
      results.push(await fn(doc));
    }
    return results;
  }

  // Support async iteration
  async *[Symbol.asyncIterator]() {
    while (await this.hasNext()) {
      yield await this.next();
    }
  }

  async _getMore() {
    if (this.exhausted) return;
    const resp = await this.bridge.sendRequest({
      target: 'cursor',
      cursorId: this.cursorId,
      method: 'getMore',
      args: [{ batchSize: this._batchSize }]
    });
    this.buffer = resp?.batch || [];
    this.exhausted = !!resp?.exhausted;
    if (this.exhausted) {
      // Optionally inform worker to clean up (close)
      await this._closeRemote();
    }
  }

  async _closeRemote() {
    if (!this.cursorId) return;
    try {
      await this.bridge.sendRequest({
        target: 'cursor',
        cursorId: this.cursorId,
        method: 'close'
      });
    } catch (_) {
      // Swallow cleanup errors
    }
    this.cursorId = null;
  }
}
