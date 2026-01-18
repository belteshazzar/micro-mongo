import { ProxyChangeStream } from './ProxyChangeStream.js';
import { ProxyCursor } from './ProxyCursor.js';
import { NotImplementedError } from '../errors.js';

/**
 * ProxyCollection lives on the main thread and forwards operations to the worker Server.
 */
export class ProxyCollection {
  constructor({ dbName, name, bridge }) {
    this.dbName = dbName;
    this.name = name;
    this.bridge = bridge;
    this.indexes = []; // Track indexes locally

    return new Proxy(this, {
      get: (target, prop, receiver) => {
        if (prop in target) return Reflect.get(target, prop, receiver);
        if (typeof prop === 'symbol' || String(prop).startsWith('_')) return undefined;
        if (prop === 'watch') {
          return (...args) => target._watch(...args);
        }
        // Special handling for methods that return cursors - return cursor immediately
        if (prop === 'find' || prop === 'aggregate') {
          return (...args) => target._cursorMethod(String(prop), args);
        }
        return (...args) => target._call(String(prop), args);
      }
    });
  }

  _cursorMethod(method, args = []) {
    // Return cursor immediately - it will fetch data asynchronously
    const requestPromise = this.bridge.sendRequest({
      target: 'collection',
      database: this.dbName,
      collection: this.name,
      method,
      args
    });

    const cursor = new ProxyCursor({
      bridge: this.bridge,
      requestPromise
    });

    // For aggregate, also make the cursor thenable so await works like in older API
    if (method === 'aggregate') {
      cursor.then = function(onFulfilled, onRejected) {
        return this.toArray().then(onFulfilled, onRejected);
      };
    }

    return cursor;
  }

  _call(method, args = []) {
    const promise = this.bridge.sendRequest({
      target: 'collection',
      database: this.dbName,
      collection: this.name,
      method,
      args
    }).then((res) => {
      if (res && res.cursorId) {
        return new ProxyCursor({
          bridge: this.bridge,
          cursorId: res.cursorId,
          batch: res.batch,
          exhausted: res.exhausted,
          batchSize: res.batchSize
        });
      }
      // If createIndex, cache the index info
      if (method === 'createIndex') {
        const indexSpec = args[0];
        const indexOptions = args[1] || {};
        const indexName = indexOptions.name || Object.entries(indexSpec)
          .map(([k, v]) => `${k}_${v}`)
          .join('_');
        
        this.indexes.push({
          name: indexName,
          key: indexSpec,
          ...indexOptions
        });
      }
      return res;
    });
    return promise;
  }

  getIndexes() {
    // Return cached indexes synchronously
    return this.indexes;
  }

  _watch(pipeline = [], options = {}) {
    return ProxyChangeStream.create({
      bridge: this.bridge,
      database: this.dbName,
      collection: this.name,
      pipeline,
      options
    });
  }
}
