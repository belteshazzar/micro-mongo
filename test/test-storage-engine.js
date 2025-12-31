import * as path from 'path';
import { fileURLToPath } from 'url';
import { StorageManager } from 'node-opfs';
import { expect } from 'chai';

// Get project root directory for .opfs location
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const opfsDir = path.join(projectRoot, '.opfs');

// Configure node-opfs to use project-local .opfs directory
const customStorage = new StorageManager(opfsDir);
if (typeof globalThis.navigator === 'undefined') {
	globalThis.navigator = {};
}
globalThis.navigator.storage = {
	getDirectory: () => customStorage.getDirectory()
};

import * as mongo from '../main.js'

// TODO: Uncomment save/load calls once implemented in storage engine
describe("Storage Engine", function() {

	let client;
	let db;
	let storageEngine;
	
	beforeEach(async function() {
		storageEngine = new mongo.StorageEngine();
		client = await mongo.MongoClient.connect('mongodb://localhost:27017', {
			storageEngine: storageEngine
		});
		db = client.db('testdb');
	});

	afterEach(async function() {
		await client.close();
		db = null;
		storageEngine = null;
	});

	it('should save and load database state', async function() {
		// Insert some documents
		await db.users.insertOne({ name: 'Alice', age: 30 });
		await db.users.insertOne({ name: 'Bob', age: 25 });
		await db.posts.insertOne({ title: 'Hello World', content: 'First post' });

    expect(storageEngine.getCollectionStore('users').size()).to.equal(2);
    expect(storageEngine.getCollectionStore('posts').size()).to.equal(1);

    // double check by using a temp storage engine
    let emptyStorage = new mongo.StorageEngine();
    client = await mongo.MongoClient.connect('mongodb://localhost:27017', {
			storageEngine: emptyStorage
		});
		db = client.db('testdb');
		expect(db.getCollectionNames().length).to.equal(0);
  
		// Close and load with previous storage engine
		await client.close();

		// Load with previous storage engine

    client = await mongo.MongoClient.connect('mongodb://localhost:27017', {
			storageEngine: storageEngine
		});
		db = client.db('testdb');

		expect(db.getCollectionNames().length).to.equal(2);
		
		const users = await db.users.find({}).toArray();
		expect(users.length).to.equal(2);
		expect(users.find(u => u.name === 'Alice')).to.not.be.undefined;
		expect(users.find(u => u.name === 'Bob')).to.not.be.undefined;

		const posts = await db.posts.find({}).toArray();
		expect(posts.length).to.equal(1);
		expect(posts[0].title).to.equal('Hello World');
	});

	it('should save and load indexes', async function() {
		// Insert documents and create index
		await db.users.insertOne({ name: 'Alice', age: 30 });
		await db.users.insertOne({ name: 'Bob', age: 25 });
		await db.users.createIndex({ age: 1 });

		// Verify index exists
		const indexesBefore = db.users.getIndexes();
		expect(indexesBefore.length).to.equal(1);
		expect(indexesBefore[0].key.age).to.equal(1);

		// Close and load with previous storage engine
		await client.close();

		// Load with previous storage engine

    client = await mongo.MongoClient.connect('mongodb://localhost:27017', {
			storageEngine: storageEngine
		});
		db = client.db('testdb');

		// Verify index was restored
		const indexesAfter = db.users.getIndexes();
		expect(indexesAfter.length).to.equal(1);
		expect(indexesAfter[0].key.age).to.equal(1);

		// Verify index works
		const results = await db.users.find({ age: 30 }).toArray();
		expect(results.length).to.equal(1);
		expect(results[0].name).to.equal('Alice');
	});

	it('should save and load text indexes', async function() {
		// Insert documents and create text index
		await db.articles.insertOne({ title: 'Introduction to JavaScript', content: 'JavaScript is a programming language' });
		await db.articles.insertOne({ title: 'Advanced Python', content: 'Python is also a programming language' });
		await db.articles.createIndex({ title: 'text', content: 'text' });

		// Close and load with previous storage engine
		await client.close();

    client = await mongo.MongoClient.connect('mongodb://localhost:27017', {
			storageEngine: storageEngine
		});
		db = client.db('testdb');


		// Verify text index was restored and works
		const indexesAfter = db.articles.getIndexes();
		expect(indexesAfter.length).to.equal(1);
		expect(indexesAfter[0].key.title).to.equal('text');

		// Test text search (using the correct syntax: field: {$text: "query"})
		const results = await db.articles.find({ title: { $text: 'JavaScript' } }).toArray();
		expect(results.length).to.equal(1);
		expect(results[0].title).to.equal('Introduction to JavaScript');
	});

	it('should save and load geospatial indexes', async function() {
		// Insert documents and create geospatial index
		await db.places.insertOne({ 
			name: 'Central Park', 
			location: { type: 'Point', coordinates: [-73.968285, 40.785091] }
		});
		await db.places.insertOne({ 
			name: 'Times Square', 
			location: { type: 'Point', coordinates: [-73.985130, 40.758896] }
		});
		await db.places.createIndex({ location: '2dsphere' });

		// Close and load with previous storage engine
		await client.close();

		// Load with previous storage engine

    client = await mongo.MongoClient.connect('mongodb://localhost:27017', {
			storageEngine: storageEngine
		});
		db = client.db('testdb');

		// Verify geospatial index was restored and works
		const indexesAfter = db.places.getIndexes();
		expect(indexesAfter.length).to.equal(1);
		expect(indexesAfter[0].key.location).to.equal('2dsphere');

		// Test geospatial query
		const results = await db.places.find({
			location: {
				$geoWithin: [[-74.0, 40.8], [-73.9, 40.7]]
			}
		}).toArray();
		expect(results.length).to.equal(2);
	});

	it('should persist regular index data across reloads', async function() {
		// Create a fresh storage engine and populate it
		const testStorage = new mongo.StorageEngine();
		let testClient = await mongo.MongoClient.connect('mongodb://localhost:27017', {
			storageEngine: testStorage
		});
		let testDb = testClient.db('testdb');
		
		// Insert many documents
		for (let i = 0; i < 100; i++) {
			await testDb.products.insertOne({ sku: `PROD-${i}`, price: i * 10 });
		}
		
		// Create index
		await testDb.products.createIndex({ price: 1 });
		
		// Query using index
		const beforeResults = await testDb.products.find({ price: { $gte: 500, $lte: 600 } }).toArray();
		expect(beforeResults.length).to.equal(11); // 50-60 inclusive
		
		await testClient.close();
		
		// Reload with same storage engine
		testClient = await mongo.MongoClient.connect('mongodb://localhost:27017', {
			storageEngine: testStorage
		});
		testDb = testClient.db('testdb');
		
		// Verify index still works with same data
		const afterResults = await testDb.products.find({ price: { $gte: 500, $lte: 600 } }).toArray();
		expect(afterResults.length).to.equal(11);
		expect(afterResults[0].sku).to.match(/^PROD-/);
		
		await testClient.close();
	});

	it('should persist text index data across reloads', async function() {
		// Create a fresh storage engine and populate it
		const testStorage = new mongo.StorageEngine();
		let testClient = await mongo.MongoClient.connect('mongodb://localhost:27017', {
			storageEngine: testStorage
		});
		let testDb = testClient.db('testdb');
		
		// Insert documents with text content
		await testDb.articles.insertOne({ title: 'MongoDB Tutorial', body: 'Learn about NoSQL databases' });
		await testDb.articles.insertOne({ title: 'JavaScript Basics', body: 'Introduction to JavaScript programming' });
		await testDb.articles.insertOne({ title: 'Node.js Guide', body: 'Building servers with Node.js' });
		await testDb.articles.insertOne({ title: 'React Tutorial', body: 'Frontend development with React' });
		
		// Create text index
		await testDb.articles.createIndex({ title: 'text', body: 'text' });
		
		// Search before reload
		const beforeResults = await testDb.articles.find({ title: { $text: 'JavaScript' } }).toArray();
		expect(beforeResults.length).to.equal(1);
		expect(beforeResults[0].title).to.equal('JavaScript Basics');
		
		await testClient.close();
		
		// Reload with same storage engine
		testClient = await mongo.MongoClient.connect('mongodb://localhost:27017', {
			storageEngine: testStorage
		});
		testDb = testClient.db('testdb');
		
		// Verify text index still works
		const afterResults = await testDb.articles.find({ title: { $text: 'JavaScript' } }).toArray();
		expect(afterResults.length).to.equal(1);
		expect(afterResults[0].title).to.equal('JavaScript Basics');
		
		// Test different search
		const nodeResults = await testDb.articles.find({ body: { $text: 'servers' } }).toArray();
		expect(nodeResults.length).to.equal(1);
		expect(nodeResults[0].title).to.equal('Node.js Guide');
		
		await testClient.close();
	});

	it('should persist geospatial index data across reloads', async function() {
		// Create a fresh storage engine and populate it
		const testStorage = new mongo.StorageEngine();
		let testClient = await mongo.MongoClient.connect('mongodb://localhost:27017', {
			storageEngine: testStorage
		});
		let testDb = testClient.db('testdb');
		
		// Insert locations
		await testDb.locations.insertOne({ 
			name: 'Empire State Building',
			location: { type: 'Point', coordinates: [-73.9857, 40.7484] }
		});
		await testDb.locations.insertOne({ 
			name: 'Statue of Liberty',
			location: { type: 'Point', coordinates: [-74.0445, 40.6892] }
		});
		await testDb.locations.insertOne({ 
			name: 'Brooklyn Bridge',
			location: { type: 'Point', coordinates: [-73.9969, 40.7061] }
		});
		
		// Create geospatial index
		await testDb.locations.createIndex({ location: '2dsphere' });
		
		// Query before reload
		const beforeResults = await testDb.locations.find({
			location: {
				$geoWithin: [[-74.1, 40.8], [-73.9, 40.6]]
			}
		}).toArray();
		expect(beforeResults.length).to.equal(3);
		
		await testClient.close();
		
		// Reload with same storage engine
		testClient = await mongo.MongoClient.connect('mongodb://localhost:27017', {
			storageEngine: testStorage
		});
		testDb = testClient.db('testdb');
		
		// Verify geospatial index still works
		const afterResults = await testDb.locations.find({
			location: {
				$geoWithin: [[-74.1, 40.8], [-73.9, 40.6]]
			}
		}).toArray();
		expect(afterResults.length).to.equal(3);
		expect(afterResults.map(r => r.name).sort()).to.deep.equal([
			'Brooklyn Bridge',
			'Empire State Building',
			'Statue of Liberty'
		]);
		
		await testClient.close();
	});

	it('should save individual collection', async function() {
		// Insert documents into multiple collections
		await db.users.insertOne({ name: 'Alice', age: 30 });
		await db.posts.insertOne({ title: 'Hello World' });

		// Close and load with previous storage engine
		await client.close();

		// Load with previous storage engine

    client = await mongo.MongoClient.connect('mongodb://localhost:27017', {
			storageEngine: storageEngine
		});
		db = client.db('testdb');

		// Verify only users was restored
		const users = await db.users.find({}).toArray();
		expect(users.length).to.equal(1);
		expect(users[0].name).to.equal('Alice');

	});

	it('should handle loading non-existent database', async function() {
		// Try to load from a fresh storage engine
		const freshStorage = new mongo.StorageEngine();
		const freshClient = await mongo.MongoClient.connect('mongodb://localhost:27017', {
			storageEngine: freshStorage
		});
		const freshDb = freshClient.db('nonexistent');

		// Should have no collections
		expect(freshDb.getCollectionNames().length).to.equal(0);

		await freshClient.close();
	});

	it('should preserve ObjectId types', async function() {
		// Insert documents
		const id1 = new mongo.ObjectId();
		const id2 = new mongo.ObjectId();
		await db.docs.insertOne({ _id: id1, name: 'Doc1' });
		await db.docs.insertOne({ _id: id2, name: 'Doc2' });

		// Close and load with previous storage engine
		await client.close();

		// Load with previous storage engine

    client = await mongo.MongoClient.connect('mongodb://localhost:27017', {
			storageEngine: storageEngine
		});
		db = client.db('testdb');

		// Verify ObjectIds are preserved
		const docs = await db.docs.find({}).toArray();
		expect(docs.length).to.equal(2);
		expect(docs[0]._id.toString()).to.equal(id1.toString());
		expect(docs[1]._id.toString()).to.equal(id2.toString());
	});

	it('should handle complex nested documents', async function() {
		// Insert complex document
		await db.complex.insertOne({
			name: 'Test',
			nested: {
				array: [1, 2, 3],
				object: {
					deep: {
						value: 'deep value'
					}
				}
			},
			tags: ['tag1', 'tag2']
		});

		// Close and load with previous storage engine
		await client.close();

		// Load with previous storage engine

    client = await mongo.MongoClient.connect('mongodb://localhost:27017', {
			storageEngine: storageEngine
		});
		db = client.db('testdb');

		// Verify complex structure is preserved
		const docs = await db.complex.find({}).toArray();
		expect(docs.length).to.equal(1);
		expect(docs[0].nested.array).to.deep.equal([1, 2, 3]);
		expect(docs[0].nested.object.deep.value).to.equal('deep value');
		expect(docs[0].tags).to.deep.equal(['tag1', 'tag2']);
	});
});
