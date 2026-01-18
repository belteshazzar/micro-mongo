/**
 * ProxyCursor lives on the main thread and batches getMore calls to the worker.
 */
export class ProxyCursor {
  constructor({ bridge, cursorId, batch = [], exhausted = false, batchSize = 100, requestPromise, requestPayload }) {
    this.bridge = bridge;
    this.cursorId = cursorId;
    this.buffer = Array.isArray(batch) ? batch : [];
    this.exhausted = exhausted || false;
    this._batchSize = batchSize;
    this._requestPromise = requestPromise || null;
    this._requestPayload = requestPayload || null; // Store payload for delayed execution
    this._initialized = !requestPromise && !requestPayload; // If no requestPromise or payload, already initialized
  }

  async _ensureInitialized() {
    if (this._initialized) return;
    
    // If we have a payload (delayed execution), build the request with cursor modifiers
    if (this._requestPayload) {
      const cursorOpts = {};
      if (this._limit !== undefined) cursorOpts.limit = this._limit;
      if (this._skip !== undefined) cursorOpts.skip = this._skip;
      if (this._sort !== undefined) cursorOpts.sort = this._sort;
      if (this._min !== undefined) cursorOpts.min = this._min;
      if (this._max !== undefined) cursorOpts.max = this._max;
      if (this._hint !== undefined) cursorOpts.hint = this._hint;
      if (this._comment !== undefined) cursorOpts.comment = this._comment;
      if (this._maxTimeMS !== undefined) cursorOpts.maxTimeMS = this._maxTimeMS;
      if (this._maxScan !== undefined) cursorOpts.maxScan = this._maxScan;
      if (this._returnKey !== undefined) cursorOpts.returnKey = this._returnKey;
      if (this._showRecordId !== undefined) cursorOpts.showRecordId = this._showRecordId;
      if (this._collation !== undefined) cursorOpts.collation = this._collation;
      
      // Attach cursor options to the payload
      this._requestPayload.cursorOpts = cursorOpts;
      
      const res = await this.bridge.sendRequest(this._requestPayload);
      this.cursorId = res.cursorId;
      this.buffer = res.batch || [];
      this.exhausted = res.exhausted || false;
      this._batchSize = res.batchSize || 100;
      this._requestPayload = null;
      this._initialized = true;
    } else if (this._requestPromise) {
      // Legacy path for already-initiated requests
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
    if (this._closed) return false;
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
  async close() {
    this._closed = true;
    await this._closeRemote();
    // Return false to match MongoDB behavior (false means not already closed)
    return false;
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
    // Return a basic explanation without sending to worker
    // Since we already have the cursor initialized, we can provide basic info
    const result = {
      queryPlanner: {
        plannerVersion: 1,
        namespace: `unknown`,
        indexFilterSet: false,
        parsedQuery: {},
        winningPlan: {
          stage: 'COLLSCAN'
        }
      },
      ok: 1
    };
    
    if (verbosity === 'executionStats' || verbosity === 'allPlansExecution') {
      result.executionStats = {
        executionSuccess: true,
        nReturned: 0,
        executionTimeMillis: 0
      };
    }
    
    return result;
  }

  async itcount() {
    // Iterate and count - must respect limit/skip
    let count = 0;
    while (await this.hasNext()) {
      await this.next();
      count++;
    }
    return count;
  }

  size() {
    // Return count of documents currently in buffer (without fetching more)
    return this.buffer.length;
  }

  min(spec) {
    this._min = spec;
    this._minIndexBounds = spec;
    return this;
  }

  max(spec) {
    this._max = spec;
    this._maxIndexBounds = spec;
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
