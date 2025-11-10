
import { DB } from './DB.js'
// https://mongodb.github.io/node-mongodb-native/6.20/classes/MongoClient.html
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
    const dbOptions = { ...this.options, ...opts };
    return new DB(dbOptions);
  }

  async close() {
    /* no-op for in-memory */ 
  }
}