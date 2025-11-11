import { Collection } from './Collection.js';
import { LocalStorageStore, ObjectStore } from '../main.js';
import { ObjectId } from './ObjectId.js';
import { ObjectStorageEngine } from './ObjectStorageEngine.js';

/**
 * DB class
 */
export class DB {
	constructor(options) {
		this.options = options || {};
		this.dbName = this.options.dbName || 'default';
		
		// Initialize storage engine if provided
		this.storageEngine = this.options.storageEngine || null;
		
		// Initialize localStorage collection if available
		if (typeof localStorage !== "undefined") {
			this.localStorage = new Collection(
				this,
				(this.options.localStorage ? this.options.localStorage : LocalStorageStore),
				this._id.bind(this)
			);
		} else {
			this.localStorage = null;
		}

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

				// For collection names, create the collection if it doesn't exist
				// Only auto-create if it's a valid collection name and doesn't already exist
				if (typeof property === 'string' && property !== 'localStorage') {
					// Don't auto-create if property was explicitly deleted
					if (Object.prototype.hasOwnProperty.call(target, property)) {
						return target[property];
					}
					// Auto-create the collection
					target.createCollection(property);
					return target[property];
				}

				return undefined;
			}
		});
	}

	/**
	 * Log function
	 */
	_log(msg) {
		if (this.options && this.options.print) this.options.print(msg);
		else console.log(msg);
	}

	/**
	 * ID generator function
	 */
	_id() {
		if (this.options && this.options.id) return this.options.id();
		else return new ObjectId();
	}

	// DB Methods
	cloneCollection() { throw "Not Implemented"; }
	cloneDatabase() { throw "Not Implemented"; }
	commandHelp() { throw "Not Implemented"; }
	copyDatabase() { throw "Not Implemented"; }

	createCollection(name) {
		if (!name) return;
		if (name == "localStorage") {
			this.localStorage = new Collection(
				this,
				(this.options.localStorage ? this.options.localStorage : LocalStorageStore),
				this._id.bind(this)
			);
		} else {
			this[name] = new Collection(
				this,
				(this.options && this.options.storage ? new this.options.storage() : new ObjectStore()),
				this._id.bind(this)
			);
		}
	}

	currentOp() { throw "Not Implemented"; }

	dropDatabase() {
		for (const key in this) {
			if (this[key] != null && this[key].isCollection) {
				this[key].drop(); // drop the contents
				delete this[key];
			}
		}
	}

	eval() { throw "Not Implemented"; }
	fsyncLock() { throw "Not Implemented"; }
	fsyncUnlock() { throw "Not Implemented"; }
	getCollection() { throw "Not Implemented"; }
	getCollectionInfos() { throw "Not Implemented"; }

	getCollectionNames() {
		const names = [];
		for (const key in this) {
			if (this[key] != null && this[key].isCollection) {
				names.push(key);
			}
		}
		return names;
	}

	getLastError() { throw "Not Implemented"; }
	getLastErrorObj() { throw "Not Implemented"; }
	getLogComponents() { throw "Not Implemented"; }
	getMongo() { throw "Not Implemented"; }
	getName() { throw "Not Implemented"; }
	getPrevError() { throw "Not Implemented"; }
	getProfilingLevel() { throw "Not Implemented"; }
	getProfilingStatus() { throw "Not Implemented"; }
	getReplicationInfo() { throw "Not Implemented"; }
	getSiblingDB() { throw "Not Implemented"; }

	help() {
		this._log("        help mr                      mapreduce");
		this._log("        db.foo.find()                list objects in collection foo");
		this._log("        db.foo.find( { a : 1 } )     list objects in foo where a == 1");
		this._log("        it                           result of the last line evaluated; use to further iterate");
	}

	hostInfo() { throw "Not Implemented"; }
	isMaster() { throw "Not Implemented"; }
	killOp() { throw "Not Implemented"; }
	listCommands() { throw "Not Implemented"; }
	loadServerScripts() { throw "Not Implemented"; }
	logout() { throw "Not Implemented"; }
	printCollectionStats() { throw "Not Implemented"; }
	printReplicationInfo() { throw "Not Implemented"; }
	printShardingStatus() { throw "Not Implemented"; }
	printSlaveReplicationInfo() { throw "Not Implemented"; }
	repairDatabase() { throw "Not Implemented"; }
	resetError() { throw "Not Implemented"; }
	runCommand() { throw "Not Implemented"; }
	serverBuildInfo() { throw "Not Implemented"; }
	serverCmdLineOpts() { throw "Not Implemented"; }
	serverStatus() { throw "Not Implemented"; }
	setLogLevel() { throw "Not Implemented"; }
	setProfilingLevel() { throw "Not Implemented"; }
	shutdownServer() { throw "Not Implemented"; }
	stats() { throw "Not Implemented"; }
	version() { throw "Not Implemented"; }
	upgradeCheck() { throw "Not Implemented"; }
	upgradeCheckAllDBs() { throw "Not Implemented"; }

	/**
	 * Save database state to storage engine
	 * @returns {Promise<void>}
	 */
	async saveToStorage() {
		if (!this.storageEngine) {
			throw new Error('No storage engine configured. Pass a storageEngine option when creating the DB.');
		}

		// Initialize storage engine if needed
		if (this.storageEngine.initialize) {
			await this.storageEngine.initialize();
		}

		// Collect all collections and their states
		const collections = {};
		for (const key in this) {
			if (this[key] != null && this[key].isCollection) {
				collections[key] = this[key].exportState();
			}
		}

		// Save to storage engine
		await this.storageEngine.saveDatabase({
			name: this.dbName,
			collections: collections
		});
	}

	/**
	 * Load database state from storage engine
	 * @returns {Promise<void>}
	 */
	async loadFromStorage() {
		if (!this.storageEngine) {
			throw new Error('No storage engine configured. Pass a storageEngine option when creating the DB.');
		}

		// Initialize storage engine if needed
		if (this.storageEngine.initialize) {
			await this.storageEngine.initialize();
		}

		// Load from storage engine
		const dbState = await this.storageEngine.loadDatabase(this.dbName);
		
		if (!dbState || !dbState.collections) {
			return; // No saved state
		}

		// Drop existing collections
		this.dropDatabase();

		// Restore collections
		for (const collectionName in dbState.collections) {
			if (dbState.collections.hasOwnProperty(collectionName)) {
				this.createCollection(collectionName);
				await this[collectionName].importState(dbState.collections[collectionName]);
			}
		}
	}

	/**
	 * Save a specific collection to storage engine
	 * @param {string} collectionName - Name of the collection to save
	 * @returns {Promise<void>}
	 */
	async saveCollection(collectionName) {
		if (!this.storageEngine) {
			throw new Error('No storage engine configured. Pass a storageEngine option when creating the DB.');
		}

		if (!this[collectionName] || !this[collectionName].isCollection) {
			throw new Error(`Collection '${collectionName}' does not exist`);
		}

		// Initialize storage engine if needed
		if (this.storageEngine.initialize) {
			await this.storageEngine.initialize();
		}

		const collectionState = this[collectionName].exportState();
		await this.storageEngine.saveCollection(this.dbName, collectionName, collectionState);
	}

	/**
	 * Load a specific collection from storage engine
	 * @param {string} collectionName - Name of the collection to load
	 * @returns {Promise<void>}
	 */
	async loadCollection(collectionName) {
		if (!this.storageEngine) {
			throw new Error('No storage engine configured. Pass a storageEngine option when creating the DB.');
		}

		// Initialize storage engine if needed
		if (this.storageEngine.initialize) {
			await this.storageEngine.initialize();
		}

		const collectionState = await this.storageEngine.loadCollection(this.dbName, collectionName);
		
		if (!collectionState) {
			return; // No saved state for this collection
		}

		// Create or recreate the collection
		if (!this[collectionName]) {
			this.createCollection(collectionName);
		}

		await this[collectionName].importState(collectionState);
	}
}
