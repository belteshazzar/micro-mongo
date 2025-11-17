import { EventEmitter } from 'events';
import { DB } from './DB.js';

export class MongoClient extends EventEmitter {
  constructor(uri = 'mongodb://localhost:27017', options = {}) {
    super();
    this.uri = uri;
    this.options = Object.freeze({ ...options }); // Make immutable
    this._isConnected = false;
    this._defaultDb = this._parseDefaultDbName(uri);
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

  db(name, opts = {}) {
    // Use default from URI if no name provided
    const dbName = name || this._defaultDb;
    if (!dbName) {
      throw new Error('No database name provided and no default in connection string');
    }
    
    const dbOptions = { ...this.options, ...opts, dbName };
    return new DB(dbOptions);
  }

  async close(force = false) {
    if (!this._isConnected) return;
    
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

  _parseDefaultDbName(uri) {
    // Parse mongodb://host:port/dbname format
    const match = uri.match(/\/([^/?]+)/);
    return match ? match[1] : null;
  }
}