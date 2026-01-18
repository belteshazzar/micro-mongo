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
          return (...args) => target._call(String(prop), args);
        }

        // Dynamic collection access
        return target.collection(prop);
      }
    });
  }

  collection(name) {
    if (this.collections.has(name)) return this.collections.get(name);
    const col = new ProxyCollection({
      dbName: this.dbName,
      name,
      bridge: this.bridge
    });
    this.collections.set(name, col);
    return col;
  }

  async close() {
    // No-op on proxy; the worker owns lifecycle
    return undefined;
  }

  // Direct forwarding for DB-level methods
  _call(method, args = []) {
    return this.bridge.sendRequest({
      target: 'db',
      database: this.dbName,
      method,
      args
    }).then((res) => {
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
  }
}
