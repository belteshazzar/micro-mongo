import { Collection } from './Collection.js';
//import { OPFSStorageEngine } from './OPFSStorageEngine.js';
import { ObjectId } from 'bjson';
import { ChangeStream } from './ChangeStream.js';
import { NotImplementedError } from './errors.js';

/**
 * DB class
 */
export class DB {
	constructor(options) {
		this.options = options || {};
    this.baseFolder = options.baseFolder || '/micro-mongo';
		this.dbName = this.options.dbName || 'default';
		this.dbFolder = `${this.baseFolder}/${this.dbName}`;
    this.collections = new Map();

		// Return a Proxy to enable dynamic collection creation
		return new Proxy(this, {
			get(target, property, receiver) {
				// If property exists on target (including undefined values), return it
				if (property in target) {
					return Reflect.get(target, property, receiver);
				}

				// If property is a symbol or special property, return undefined
				if (typeof property === 'symbol' || property.startsWith('_')) {
					return undefined;
				}

        // Only auto-create if it's a valid collection name and doesn't already exist
        if (typeof property === 'string') {

          // For collection names, create the collection if it doesn't exist
          if (!target.collections.has(property)) {
            target.collections.set(property, new Collection(target, property));
          }

          return target.collections.get(property);
        }

        return undefined;
			}
		});
	}

	/**
	 * Close all collections
	 */
	async close() {
		// Iterate through all collection properties and close them
		for (const key of Object.keys(this)) {
			const collection = this[key];
			if (collection && collection.isCollection && typeof collection.close === 'function') {
				await collection.close();
			}
		}
	}

	// DB Methods
	cloneCollection() { throw new NotImplementedError('cloneCollection', { database: this.dbName }); }
	cloneDatabase() { throw new NotImplementedError('cloneDatabase', { database: this.dbName }); }
	commandHelp() { throw new NotImplementedError('commandHelp', { database: this.dbName }); }
	copyDatabase() { throw new NotImplementedError('copyDatabase', { database: this.dbName }); }

	createCollection(name) {
    throw new NotImplementedError('createCollection', { database: this.dbName });
  }

	/**
	 * Get or create a collection by name (MongoDB-compatible method)
	 * @param {string} name - Collection name
	 * @returns {Collection} The collection instance
	 */
	collection(name) {
    throw new NotImplementedError('collection', { database: this.dbName });
	}

	currentOp() { throw new NotImplementedError('currentOp', { database: this.dbName }); }

	async dropCollection(collectionName) {
    throw new NotImplementedError('dropCollection', { database: this.dbName });
	}

	async dropDatabase() {
    throw new NotImplementedError('dropDatabase', { database: this.dbName });
	}

	eval() { throw new NotImplementedError('eval', { database: this.dbName }); }
	fsyncLock() { throw new NotImplementedError('fsyncLock', { database: this.dbName }); }
	fsyncUnlock() { throw new NotImplementedError('fsyncUnlock', { database: this.dbName }); }
	getCollection() { throw new NotImplementedError('getCollection', { database: this.dbName }); }
	getCollectionInfos() { throw new NotImplementedError('getCollectionInfos', { database: this.dbName }); }

	getLastError() { throw new NotImplementedError('getLastError', { database: this.dbName }); }
	getLastErrorObj() { throw new NotImplementedError('getLastErrorObj', { database: this.dbName }); }
	getLogComponents() { throw new NotImplementedError('getLogComponents', { database: this.dbName }); }
	getMongo() { throw new NotImplementedError('getMongo', { database: this.dbName }); }
	getName() { throw new NotImplementedError('getName', { database: this.dbName }); }
	getPrevError() { throw new NotImplementedError('getPrevError', { database: this.dbName }); }
	getProfilingLevel() { throw new NotImplementedError('getProfilingLevel', { database: this.dbName }); }
	getProfilingStatus() { throw new NotImplementedError('getProfilingStatus', { database: this.dbName }); }
	getReplicationInfo() { throw new NotImplementedError('getReplicationInfo', { database: this.dbName }); }
	getSiblingDB() { throw new NotImplementedError('getSiblingDB', { database: this.dbName }); }

	help() {
		console.log("        help mr                      mapreduce");
		console.log("        db.foo.find()                list objects in collection foo");
		console.log("        db.foo.find( { a : 1 } )     list objects in foo where a == 1");
		console.log("        it                           result of the last line evaluated; use to further iterate");
	}

	hostInfo() { throw new NotImplementedError('hostInfo', { database: this.dbName }); }
	isMaster() { throw new NotImplementedError('isMaster', { database: this.dbName }); }
	killOp() { throw new NotImplementedError('killOp', { database: this.dbName }); }
	listCommands() { throw new NotImplementedError('listCommands', { database: this.dbName }); }
	loadServerScripts() { throw new NotImplementedError('loadServerScripts', { database: this.dbName }); }
	logout() { throw new NotImplementedError('logout', { database: this.dbName }); }
	printCollectionStats() { throw new NotImplementedError('printCollectionStats', { database: this.dbName }); }
	printReplicationInfo() { throw new NotImplementedError('printReplicationInfo', { database: this.dbName }); }
	printShardingStatus() { throw new NotImplementedError('printShardingStatus', { database: this.dbName }); }
	printSlaveReplicationInfo() { throw new NotImplementedError('printSlaveReplicationInfo', { database: this.dbName }); }
	repairDatabase() { throw new NotImplementedError('repairDatabase', { database: this.dbName }); }
	resetError() { throw new NotImplementedError('resetError', { database: this.dbName }); }
	runCommand() { throw new NotImplementedError('runCommand', { database: this.dbName }); }
	serverBuildInfo() { throw new NotImplementedError('serverBuildInfo', { database: this.dbName }); }
	serverCmdLineOpts() { throw new NotImplementedError('serverCmdLineOpts', { database: this.dbName }); }
	serverStatus() { throw new NotImplementedError('serverStatus', { database: this.dbName }); }
	setLogLevel() { throw new NotImplementedError('setLogLevel', { database: this.dbName }); }
	setProfilingLevel() { throw new NotImplementedError('setProfilingLevel', { database: this.dbName }); }
	shutdownServer() { throw new NotImplementedError('shutdownServer', { database: this.dbName }); }
	stats() { throw new NotImplementedError('stats', { database: this.dbName }); }
	version() { throw new NotImplementedError('version', { database: this.dbName }); }
	upgradeCheck() { throw new NotImplementedError('upgradeCheck', { database: this.dbName }); }
	upgradeCheckAllDBs() { throw new NotImplementedError('upgradeCheckAllDBs', { database: this.dbName }); }

	/**
	 * Watch for changes across all collections in this database
	 * @param {Array} pipeline - Aggregation pipeline to filter changes
	 * @param {Object} options - Watch options
	 * @returns {ChangeStream} A change stream instance
	 */
	watch(pipeline = [], options = {}) {
		return new ChangeStream(this, pipeline, options);
	}
}
