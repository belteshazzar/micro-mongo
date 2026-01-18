import { ProxyCollection } from './ProxyCollection.js';
import { ProxyChangeStream } from './ProxyChangeStream.js';

/**
 * ProxyDB lives on the main thread and forwards operations to the worker Server.
 */
export class ProxyDB {
  constructor({ dbName, bridge, options = {} }) {
    this.dbName = dbName;
    this.bridge = bridge;
    this.options = options;
    this.collections = new Map();

    // Proxy to auto-create collections on property access
    const dbMethodNames = new Set([
      'getCollectionNames',
      'getCollectionInfos',
      'createCollection',
      'dropCollection',
      'dropDatabase',
      'collection',
      'getCollection',
      'watch'
    ]);

    this._methodNames = dbMethodNames;

    return new Proxy(this, {
      get: (target, prop, receiver) => {
        if (prop in target) return Reflect.get(target, prop, receiver);
        if (typeof prop === 'symbol' || String(prop).startsWith('_')) return undefined;

        if (dbMethodNames.has(prop)) {
          // Special handling for collection management methods
          if (prop === 'createCollection') {
            return (...args) => {
              const collName = args[0];
              target.collection(collName, receiver); // Pass proxy receiver
              return target._call(String(prop), args); // Still send to worker
            };
          }
          if (prop === 'dropCollection') {
            return (...args) => {
              const collName = args[0];
              target.collections.delete(collName); // Remove synchronously
              return target._call(String(prop), args); // Still send to worker
            };
          }
          if (prop === 'dropDatabase') {
            return (...args) => {
              target.collections.clear(); // Clear all collections synchronously
              return target._call(String(prop), args); // Still send to worker
            };
          }
          return (...args) => target._call(String(prop), args);
        }

        // Dynamic collection access
        return target.collection(prop, receiver); // Pass proxy receiver
      }
    });
  }

  collection(name, dbProxy) {
    if (this.collections.has(name)) return this.collections.get(name);
    const col = new ProxyCollection({
      dbName: this.dbName,
      name,
      bridge: this.bridge,
      db: dbProxy || this // Pass DB proxy if available, otherwise this
    });
    this.collections.set(name, col);
    return col;
  }

  getCollectionNames() {
    // Return collection names from local cache
    return Array.from(this.collections.keys());
  }

  async close() {
    // No-op on proxy; the worker owns lifecycle
    return undefined;
  }

  // Direct forwarding for DB-level methods
  _call(method, args = []) {
    const promise = this.bridge.sendRequest({
      target: 'db',
      database: this.dbName,
      method,
      args
    }).then((res) => {
      // Note: Do NOT re-add createCollection here - it's already added synchronously in the proxy handler
      // Same for dropCollection - already removed in proxy handler
      
      if (res && res.streamId) {
        return ProxyChangeStream.create({
          bridge: this.bridge,
          database: this.dbName,
          collection: null,
          streamId: res.streamId
        });
      }
      return res;
    });
    return promise;
  }
}
