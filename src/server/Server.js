import { DB } from './DB.js';

/**
 * Server runs inside a worker and routes requests to DB/Collection instances.
 */
export class Server {
  constructor(options = {}, postEvent = () => {}) {
    this.options = options;
    this.databases = new Map();
    this.postEvent = postEvent;

    this.cursors = new Map();
    this.cursorCounter = 1;

    this.streams = new Map();
    this.streamCounter = 1;
  }

  async dispatch(request) {
    const { target, database, collection, method, args = [], cursorId, streamId, cursorOpts } = request;
    if (target === 'cursor') {
      return await this._cursorOp(cursorId, method, args);
    }
    if (target === 'changestream') {
      return await this._changeStreamOp(streamId, method, args);
    }

    if (!target || !database || !method) {
      throw new Error('Invalid request payload');
    }

    const db = this._getDB(database);

    if (target === 'db') {
      return await this._call(db, method, args);
    }

    if (target === 'collection') {
      if (!collection) {
        throw new Error('Collection name required for collection target');
      }
      const col = db.collection(collection);
      return await this._call(col, method, args, cursorOpts);
    }

    throw new Error(`Unknown target: ${target}`);
  }

  _getDB(dbName) {
    if (this.databases.has(dbName)) return this.databases.get(dbName);
    const db = new DB({ ...this.options, dbName });
    this.databases.set(dbName, db);
    return db;
  }

  async _call(target, method, args, cursorOpts) {
    if (typeof target[method] !== 'function') {
      throw new Error(`Method ${method} not found on target`);
    }
    const result = target[method](...(args || []));
    const awaited = (result && typeof result.then === 'function') ? await result : result;

    // Handle cursors (find/aggregate) by registering and returning first batch
    if (awaited && typeof awaited.hasNext === 'function' && typeof awaited.next === 'function') {
      return await this._registerCursor(awaited, cursorOpts);
    }

    // For aggregate(), wrap the array results in a cursor-like object
    if (method === 'aggregate' && Array.isArray(awaited)) {
      return await this._registerArrayAsCursor(awaited);
    }

    // Handle change streams
    if (awaited && awaited.constructor?.name === 'ChangeStream') {
      return this._registerChangeStream(awaited);
    }

    return awaited;
  }

  async _registerCursor(cursor, cursorOpts = {}) {
    // Apply cursor modifiers before fetching results
    // Note: some modifiers like sort() return a new cursor instance
    if (cursorOpts.sort) cursor = cursor.sort(cursorOpts.sort);
    if (cursorOpts.skip) cursor = await cursor.skip(cursorOpts.skip);
    if (cursorOpts.limit) cursor = await cursor.limit(cursorOpts.limit);
    if (cursorOpts.min && cursor.min) cursor = cursor.min(cursorOpts.min);
    if (cursorOpts.max && cursor.max) cursor = cursor.max(cursorOpts.max);
    if (cursorOpts.hint && cursor.hint) cursor = cursor.hint(cursorOpts.hint);
    if (cursorOpts.comment && cursor.comment) cursor = cursor.comment(cursorOpts.comment);
    if (cursorOpts.maxTimeMS && cursor.maxTimeMS) cursor = cursor.maxTimeMS(cursorOpts.maxTimeMS);
    if (cursorOpts.maxScan && cursor.maxScan) cursor = cursor.maxScan(cursorOpts.maxScan);
    if (cursorOpts.returnKey && cursor.returnKey) cursor = cursor.returnKey(cursorOpts.returnKey);
    if (cursorOpts.showRecordId && cursor.showRecordId) cursor = cursor.showRecordId(cursorOpts.showRecordId);
    if (cursorOpts.collation && cursor.collation) cursor = cursor.collation(cursorOpts.collation);
    
    const id = `cur_${this.cursorCounter++}`;
    const batchSize = this.options.batchSize || 100;
    const batch = [];

    while (batch.length < batchSize && await cursor.hasNext()) {
      batch.push(await cursor.next());
    }

    const exhausted = !(await cursor.hasNext());
    if (!exhausted) {
      this.cursors.set(id, cursor);
    }

    return { cursorId: id, batch, exhausted, batchSize };
  }

  async _registerArrayAsCursor(resultsArray) {
    const id = `cur_${this.cursorCounter++}`;
    const batchSize = this.options.batchSize || 100;
    
    // Take first batch from the array
    const batch = resultsArray.slice(0, batchSize);
    const exhausted = resultsArray.length <= batchSize;
    
    // If there are more results, create a cursor-like object to track remaining items
    if (!exhausted) {
      const cursor = {
        position: batchSize,
        array: resultsArray,
        async hasNext() {
          return this.position < this.array.length;
        },
        async next() {
          if (this.position >= this.array.length) throw new Error('No more documents');
          return this.array[this.position++];
        }
      };
      this.cursors.set(id, cursor);
    }
    
    return { cursorId: id, batch, exhausted, batchSize };
  }

  async _cursorOp(cursorId, method, args = []) {
    if (!cursorId) throw new Error('cursorId required');
    const cursor = this.cursors.get(cursorId);
    if (!cursor) {
      if (method === 'close') return { closed: true };
      throw new Error(`Cursor not found: ${cursorId}`);
    }

    if (method === 'close') {
      this.cursors.delete(cursorId);
      return { closed: true };
    }

    if (method === 'getMore') {
      const opts = args?.[0] || {};
      const batchSize = opts.batchSize || 100;
      const batch = [];
      while (batch.length < batchSize && await cursor.hasNext()) {
        batch.push(await cursor.next());
      }
      const exhausted = !(await cursor.hasNext());
      if (exhausted) {
        this.cursors.delete(cursorId);
      }
      return { batch, exhausted, batchSize };
    }

    throw new Error(`Unknown cursor method: ${method}`);
  }

  _registerChangeStream(stream) {
    const id = `cs_${this.streamCounter++}`;
    const handlers = {
      change: (change) => this.postEvent({
        type: 'event',
        event: 'changeStream',
        payload: { streamId: id, type: 'change', data: change }
      }),
      error: (err) => this.postEvent({
        type: 'event',
        event: 'changeStream',
        payload: { streamId: id, type: 'error', data: {
          name: err?.name,
          message: err?.message,
          stack: err?.stack
        }}
      }),
      close: () => this.postEvent({
        type: 'event',
        event: 'changeStream',
        payload: { streamId: id, type: 'close' }
      })
    };

    stream.on('change', handlers.change);
    stream.on('error', handlers.error);
    stream.on('close', handlers.close);

    this.streams.set(id, { stream, handlers });
    return { streamId: id };
  }

  async _changeStreamOp(streamId, method) {
    if (!streamId) throw new Error('streamId required');
    const entry = this.streams.get(streamId);
    if (!entry) return { closed: true };

    if (method === 'close') {
      const { stream, handlers } = entry;
      stream.off('change', handlers.change);
      stream.off('error', handlers.error);
      stream.off('close', handlers.close);
      if (typeof stream.close === 'function') {
        await stream.close();
      }
      this.streams.delete(streamId);
      return { closed: true };
    }

    throw new Error(`Unknown change stream method: ${method}`);
  }
}
