import { EventEmitter } from 'events';
import { ProxyDB } from './ProxyDB.js';

export class MongoClient extends EventEmitter {
  constructor(uri = 'mongodb://localhost:27017', options = {}) {
    super();
    this.uri = uri;
    this.options = Object.freeze({ ...options }); // Make immutable
    this._isConnected = false;
    this._defaultDb = this._parseDefaultDbName(uri);
    this._databases = new Map(); // Track database instances
    
    // workerBridge is required
    if (!options.workerBridge) {
      throw new Error('workerBridge is required. Create one with: const bridge = await WorkerBridge.create()');
    }
    
    this._bridge = options.workerBridge;
    this._ownsBridge = false; // Never own the bridge - user manages lifecycle
  }

  static async connect(uri, options = {}) {
    const client = new MongoClient(uri, options);
    await client.connect();
    return client;
  }

  async connect() {
    if (this._isConnected) return this;
    this._isConnected = true;
    this.emit('open', this);
    return this;
  }

  // Note that db on real MongoClient is synchronous
  db(name, opts = {}) {
    // Use default from URI if no name provided
    const dbName = name || this._defaultDb;
    if (!dbName) {
      throw new Error('No database name provided and no default in connection string');
    }
    
    // Return cached database instance if it exists
    if (this._databases.has(dbName)) {
      return this._databases.get(dbName);
    }

    // Always use ProxyDB with worker
    const database = new ProxyDB({
      dbName,
      bridge: this._bridge,
      options: { ...this.options, ...opts }
    });

    this._databases.set(dbName, database);
    return database;
  }

  async close() {
    if (this._bridge && this._ownsBridge) {
      // Only terminate if we own the bridge (not shared)
      await this._bridge.terminate();
      this._bridge = null;
    }
    this._isConnected = false;
    this.emit('close');
  }

  // async _loadExistingDatabases() {
  //   const discoveredNames = await this._discoverDatabases();
  //   console.log('Discovered databases:', discoveredNames);
  //   const names = new Set(discoveredNames);

  //   // Ensure default DB from URI is loaded when provided
  //   if (this._defaultDb) {
  //     names.add(this._defaultDb);
  //   }

  //   for (const dbName of names) {
  //     if (this._databases.has(dbName)) continue;
  //     const database = new DB({ ...this.options, dbName });
  //     this._databases.set(dbName, database);
  //   }
  // }

  // async _discoverDatabases() {
  //   const dbNames = new Set();
  //   const baseFolder = this.options.rootPath || '/micro-mongo';

  //   const hasOPFS = !!(globalThis.navigator && globalThis.navigator.storage && typeof globalThis.navigator.storage.getDirectory === 'function');
  //   if (!hasOPFS) {
  //     return Array.from(dbNames);
  //   }

  //   try {
  //     let dir = await globalThis.navigator.storage.getDirectory();
  //     const parts = baseFolder.split('/').filter(Boolean);
  //     for (const part of parts) {
  //       dir = await dir.getDirectoryHandle(part, { create: true });
  //     }

  //     for await (const [name, handle] of dir.entries()) {
  //       if (handle && handle.kind === 'directory') {
  //         dbNames.add(name);
  //       }
  //     }
  //   } catch (err) {
  //     console.warn('Failed to discover databases', err);
  //   }

  //   return Array.from(dbNames);
  // }

  async close(force = false) {
    if (!this._isConnected) return;
    
    // Close all database connections (which closes all collections and indexes)
    for (const [_, database] of this._databases) {
      await database.close();
    }
    this._databases.clear();
    
    this._isConnected = false;
    this.emit('close');
  }

  // Session management stubs
  startSession(options = {}) {
    // Return minimal session object for compatibility
    return {
      id: crypto.randomUUID(),
      endSession: () => {},
      withTransaction: async (fn) => await fn(this)
    };
  }

  async withSession(optionsOrExecutor, executor) {
    const session = this.startSession(
      typeof optionsOrExecutor === 'function' ? {} : optionsOrExecutor
    );
    const fn = typeof optionsOrExecutor === 'function' ? optionsOrExecutor : executor;
    
    try {
      return await fn(session);
    } finally {
      session.endSession();
    }
  }

  // Configuration getters
  get readConcern() { return this.options.readConcern; }
  get writeConcern() { return this.options.writeConcern; }
  get readPreference() { return this.options.readPreference; }

  /**
   * Watch for changes across all databases and collections
   * @param {Array} pipeline - Aggregation pipeline to filter changes
   * @param {Object} options - Watch options
   * @returns {ChangeStream} A change stream instance
   */
  watch(pipeline = [], options = {}) {
    return new ChangeStream(this, pipeline, options);
  }

  _parseDefaultDbName(uri) {
    // Parse mongodb://host:port/dbname format
    const match = uri.match(/\/([^/?]+)/);
    return match ? match[1] : null;
  }

  _parseUriParams(uri) {
    // Parse query parameters from URI
    // e.g., ?useWorker=true becomes { useWorker: true }
    const params = {};
    const queryIndex = uri.indexOf('?');
    if (queryIndex === -1) return params;
    
    const queryString = uri.substring(queryIndex + 1);
    const pairs = queryString.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key) {
        // Convert string booleans to actual booleans
        if (value === 'true') params[key] = true;
        else if (value === 'false') params[key] = false;
        else if (!isNaN(value)) params[key] = Number(value);
        else params[key] = decodeURIComponent(value || '');
      }
    }
    return params;
  }
}