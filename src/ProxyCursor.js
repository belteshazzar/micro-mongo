/**
 * ProxyCursor lives on the main thread and batches getMore calls to the worker.
 */
export class ProxyCursor {
  constructor({ bridge, cursorId, batch = [], exhausted = false, batchSize = 100, requestPromise }) {
    this.bridge = bridge;
    this.cursorId = cursorId;
    this.buffer = Array.isArray(batch) ? batch : [];
    this.exhausted = exhausted || false;
    this.batchSize = batchSize;
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
      this.batchSize = res.batchSize || 100;
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
      args: [{ batchSize: this.batchSize }]
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
