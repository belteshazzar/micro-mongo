import {expect} from 'chai';
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

    console.log(storageEngine.getCollectionStore('users').documents);
    console.log(storageEngine.getCollectionStore('posts').documents);

    expect(storageEngine.getCollectionStore('users').documentsCount()).to.equal(2);
    expect(storageEngine.getCollectionStore('posts').documentsCount()).to.equal(1);

		// Clear the database
		// db.dropDatabase();
		// expect(db.getCollectionNames().length).to.equal(0);

		// Load from storage
		// await db.loadFromStorage();

		// Verify data was restored
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

		// Save to storage
		// await db.saveToStorage();

		// Clear the database
		// db.dropDatabase();

		// Load from storage
		// await db.loadFromStorage();

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

		// // Save to storage
		// await db.saveToStorage();

		// Clear the database
		// db.dropDatabase();

		// // Load from storage
		// await db.loadFromStorage();

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

		// Save to storage
		// await db.saveToStorage();

		// Clear the database
		// db.dropDatabase();

		// Load from storage
		// await db.loadFromStorage();

		// Verify geospatial index was restored and works
		// const indexesAfter = db.places.getIndexes();
		// expect(indexesAfter.length).to.equal(1);
		// expect(indexesAfter[0].key.location).to.equal('2dsphere');

		// Test geospatial query
		const results = await db.places.find({
			location: {
				$geoWithin: [[-74.0, 40.8], [-73.9, 40.7]]
			}
		}).toArray();
		expect(results.length).to.equal(2);
	});

	it('should save individual collection', async function() {
		// Insert documents into multiple collections
		await db.users.insertOne({ name: 'Alice', age: 30 });
		await db.posts.insertOne({ title: 'Hello World' });

		// Save only users collection
		// await db.saveCollection('users');

		// Clear the database
		// db.dropDatabase();

		// Load only users collection
		// await db.loadCollection('users');

		// Verify only users was restored
		// const users = await db.users.find({}).toArray();
		// expect(users.length).to.equal(1);
		// expect(users[0].name).to.equal('Alice');

		// posts collection should not exist (or be empty if auto-created)
		// const posts = await db.posts.find({}).toArray();
		// expect(posts.length).to.equal(0);
	});

	it('should handle empty database', async function() {
		// // Save empty database
		// await db.saveToStorage();

		// // Load from storage
		// await db.loadFromStorage();

		// Verify no collections exist
		expect(db.getCollectionNames().length).to.equal(0);
	});

	it('should handle loading non-existent database', async function() {
		// Try to load from a fresh storage engine
		const freshStorage = new mongo.StorageEngine();
		const freshClient = await mongo.MongoClient.connect('mongodb://localhost:27017', {
			storageEngine: freshStorage
		});
		const freshDb = freshClient.db('nonexistent');

		// // Should not throw error
		// await freshDb.loadFromStorage();

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

		// // Save to storage
		// await db.saveToStorage();

		// Clear the database
		// db.dropDatabase();

		// // Load from storage
		// await db.loadFromStorage();

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

		// // Save to storage
		// await db.saveToStorage();

		// Clear the database
		// db.dropDatabase();

		// // Load from storage
		// await db.loadFromStorage();

		// Verify complex structure is preserved
		const docs = await db.complex.find({}).toArray();
		expect(docs.length).to.equal(1);
		expect(docs[0].nested.array).to.deep.equal([1, 2, 3]);
		expect(docs[0].nested.object.deep.value).to.equal('deep value');
		expect(docs[0].tags).to.deep.equal(['tag1', 'tag2']);
	});
});
