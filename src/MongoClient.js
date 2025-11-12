
import { DB } from './DB.js'

export class MongoClient {

  constructor(uri, options = {}) {
    this.uri = uri;
    this.options = options;
  }

  static async connect(uri, options = {}) {
    return new MongoClient(uri, options);
  }

  db(name, opts = {}) {
    // Merge client options with db-specific options
    const dbOptions = { ...this.options, ...opts, dbName: name };
    return new DB(dbOptions);
  }

  async close() {
    /* no-op for in-memory */ 
  }
}