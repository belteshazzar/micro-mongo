import { ProxyChangeStream } from './ProxyChangeStream.js';
import { ProxyCursor } from './ProxyCursor.js';
import { NotImplementedError } from './errors.js';

/**
 * ProxyCollection lives on the main thread and forwards operations to the worker Server.
 */
export class ProxyCollection {
  constructor({ dbName, name, bridge }) {
    this.dbName = dbName;
    this.name = name;
    this.bridge = bridge;

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

    return new ProxyCursor({
      bridge: this.bridge,
      requestPromise
    });
  }

  _call(method, args = []) {
    return this.bridge.sendRequest({
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
      return res;
    });
  }

  _watch() {
    return ProxyChangeStream.create({
      bridge: this.bridge,
      database: this.dbName,
      collection: this.name
    });
  }
}
