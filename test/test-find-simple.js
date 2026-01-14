import * as path from 'path';
import { fileURLToPath } from 'url';
import { StorageManager } from 'node-opfs';

// Get project root directory for .opfs location
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const opfsDir = path.join(projectRoot, '.opfs-test-simple');

// Configure node-opfs to use project-local .opfs directory
const customStorage = new StorageManager(opfsDir);
const opfsNavigator = {
	storage: {
		getDirectory: () => customStorage.getDirectory()
	}
};

// Ensure bjson sees OPFS APIs in Node
if (typeof globalThis.navigator === 'undefined') {
	globalThis.navigator = opfsNavigator;
} else {
	globalThis.navigator.storage = opfsNavigator.storage;
}

import { MongoClient } from '../main.js';
import { strict as assert } from 'assert';

describe('Simple Find Test', function() {
	let client, db, collection;

	beforeEach(async function() {
		this.timeout(10000);
		client = await MongoClient.connect();
		db = client.db('test-simple');
		collection = db.collection('testcol');
		
		// Insert test data
		await collection.insertOne({ _id: 1, name: 'Alice', age: 30 });
		await collection.insertOne({ _id: 2, name: 'Bob', age: 25 });
	});

	afterEach(async function() {
		this.timeout(10000);
		if (client) {
			await client.close();
		}
	});

	it('should return cursor synchronously from find()', function() {
		const cursor = collection.find({});
		assert(cursor !== null);
		assert(typeof cursor === 'object');
		assert(typeof cursor.hasNext === 'function');
	});

	it('should allow awaiting cursor to initialize it', async function() {
		const cursor = collection.find({});
		assert(cursor !== null);
		const hasNext = cursor.hasNext();
		assert(hasNext === true);
		const doc = cursor.next();
		assert(doc !== null);
		assert(doc.name === 'Alice' || doc.name === 'Bob');
	});

	it('should work with toArray()', async function() {
		const docs = collection.find({}).toArray();
		assert(docs.length === 2);
		assert(docs[0].name === 'Alice' || docs[0].name === 'Bob');
	});

	it('should work with findOne()', async function() {
		const doc = collection.findOne({ name: 'Alice' });
		assert(doc !== null);
		assert(doc.name === 'Alice');
		assert(doc.age === 30);
	});
});
