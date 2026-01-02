import { strict as assert } from 'assert';
import { MongoClient } from '../src/MongoClient.js';

describe('Cursor Methods', function() {
	let client, db, collection;

	beforeEach(async function() {
		client = new MongoClient();
		await client.connect();
		db = client.db('test');
		collection = db.collection('cursorTest');
		
		// Insert test data
		await collection.insertMany([
			{ _id: 1, name: 'Alice', age: 30 },
			{ _id: 2, name: 'Bob', age: 25 },
			{ _id: 3, name: 'Charlie', age: 35 },
			{ _id: 4, name: 'David', age: 28 },
			{ _id: 5, name: 'Eve', age: 32 }
		]);
	});

	describe('batchSize()', function() {
		it('should set batch size and return cursor for chaining', async function() {
			const cursor = await collection.find({});
			cursor.batchSize(2);
			assert(cursor._batchSize === 2);
			const docs = await cursor.toArray();
			assert.strictEqual(docs.length, 5);
		});
	});

	describe('close()', function() {
		it('', async function() {
			const cursor = await collection.find({});
			assert.strictEqual(cursor.isClosed(), false);
			cursor.close();
			assert.strictEqual(cursor.isClosed(), true);
			assert.strictEqual(cursor.hasNext(), false);
		});
	});

	describe('isClosed()', function() {
		it('', async function() {
			const cursor = await collection.find({});
			assert.strictEqual(cursor.isClosed(), false);
		});

		it('', async function() {
			const cursor = await collection.find({});
			cursor.close();
			assert.strictEqual(cursor.isClosed(), true);
		});
	});

	describe('comment()', function() {
		it('should set comment and return cursor for chaining', async function() {
			const cursor = await collection.find({});
			cursor.comment('Test query');
			assert.strictEqual(cursor._comment, 'Test query');
			const docs = await cursor.toArray();
			assert.strictEqual(docs.length, 5);
		});
	});

	describe('explain()', function() {
		it('', async function() {
			const cursor = await collection.find({ age: { $gt: 30 } });
			const explanation = cursor.explain();
			assert(explanation.queryPlanner);
			assert(explanation.queryPlanner.parsedQuery);
			assert.strictEqual(explanation.ok, 1);
		});

		it('', async function() {
			const cursor = await collection.find({ age: { $gt: 30 } });
			const explanation = cursor.explain('executionStats');
			assert(explanation.queryPlanner);
			assert(explanation.executionStats);
			assert.strictEqual(explanation.executionStats.executionSuccess, true);
		});
	});

	describe('hint()', function() {
		it('should set index hint and return cursor for chaining', async function() {
			const cursor = await collection.find({});
			cursor.hint({ age: 1 });
			assert.deepStrictEqual(cursor._hint, { age: 1 });
			const docs = await cursor.toArray();
			assert.strictEqual(docs.length, 5);
		});
	});

	describe('itcount()', function() {
		it('', async function() {
			const cursor = await collection.find({});
			const count = cursor.itcount();
			assert.strictEqual(count, 5);
		});

		it('', async function() {
			const cursor = await collection.find({});
			cursor.limit(3);
			const count = cursor.itcount();
			assert.strictEqual(count, 3);
		});
	});

	describe('size()', function() {
		it('', async function() {
			const cursor = await collection.find({});
			assert.strictEqual(cursor.size(), 5);
		});

		it('', async function() {
			const cursor = await collection.find({});
			cursor.limit(3);
			assert.strictEqual(cursor.size(), 3);
		});

		it('', async function() {
			const cursor = await collection.find({});
			cursor.next();
			cursor.next();
			assert.strictEqual(cursor.size(), 3);
		});
	});

	describe('max() and min()', function() {
		it('should set index bounds', async function() {
			const cursor = await collection.find({});
			cursor.min({ age: 25 })
				.max({ age: 35 });
			assert.deepStrictEqual(cursor._minIndexBounds, { age: 25 });
			assert.deepStrictEqual(cursor._maxIndexBounds, { age: 35 });
			const docs = await cursor.toArray();
			assert.strictEqual(docs.length, 5);
		});
	});

	describe('maxTimeMS()', function() {
		it('should set maximum execution time', async function() {
			const cursor = await collection.find({});
			cursor.maxTimeMS(1000);
			assert.strictEqual(cursor._maxTimeMS, 1000);
			const docs = await cursor.toArray();
			assert.strictEqual(docs.length, 5);
		});
	});

	describe('maxScan()', function() {
		it('should set maximum documents to scan', async function() {
			const cursor = await collection.find({});
			cursor.maxScan(100);
			assert.strictEqual(cursor._maxScan, 100);
			const docs = await cursor.toArray();
			assert.strictEqual(docs.length, 5);
		});
	});

	describe('noCursorTimeout()', function() {
		it('should prevent cursor timeout', async function() {
			const cursor = await collection.find({});
			cursor.noCursorTimeout();
			assert.strictEqual(cursor._noCursorTimeout, true);
			const docs = await cursor.toArray();
			assert.strictEqual(docs.length, 5);
		});
	});

	describe('objsLeftInBatch()', function() {
		it('', async function() {
			const cursor = await collection.find({});
			assert.strictEqual(cursor.objsLeftInBatch(), 5);
			cursor.next();
			assert.strictEqual(cursor.objsLeftInBatch(), 4);
		});
	});

	describe('pretty()', function() {
		it('should enable pretty printing', async function() {
			const cursor = await collection.find({});
			cursor.pretty();
			assert.strictEqual(cursor._pretty, true);
			const docs = await cursor.toArray();
			assert.strictEqual(docs.length, 5);
		});
	});

	describe('readConcern()', function() {
		it('should set read concern level', async function() {
			const cursor = await collection.find({});
			cursor.readConcern('majority');
			assert.strictEqual(cursor._readConcern, 'majority');
			const docs = await cursor.toArray();
			assert.strictEqual(docs.length, 5);
		});
	});

	describe('readPref()', function() {
		it('should set read preference', async function() {
			const cursor = await collection.find({});
			cursor.readPref('secondary', { dc: 'east' });
			assert.deepStrictEqual(cursor._readPref, { mode: 'secondary', tagSet: { dc: 'east' } });
			const docs = await cursor.toArray();
			assert.strictEqual(docs.length, 5);
		});
	});

	describe('returnKey()', function() {
		it('should enable returnKey mode', async function() {
			const cursor = await collection.find({});
			cursor.returnKey();
			assert.strictEqual(cursor._returnKey, true);
			const docs = await cursor.toArray();
			assert.strictEqual(docs.length, 5);
		});

		it('should accept boolean parameter', async function() {
			const cursor = await collection.find({});
			cursor.returnKey(false);
			assert.strictEqual(cursor._returnKey, false);
		});
	});

	describe('showRecordId()', function() {
		it('should enable showRecordId mode', async function() {
			const cursor = await collection.find({});
			cursor.showRecordId();
			assert.strictEqual(cursor._showRecordId, true);
			const docs = await cursor.toArray();
			assert.strictEqual(docs.length, 5);
		});

		it('should accept boolean parameter', async function() {
			const cursor = await collection.find({});
			cursor.showRecordId(false);
			assert.strictEqual(cursor._showRecordId, false);
		});
	});

	describe('allowDiskUse()', function() {
		it('should enable disk use for sorts', async function() {
			const cursor = await collection.find({});
			cursor.allowDiskUse();
			assert.strictEqual(cursor._allowDiskUse, true);
			const docs = await cursor.toArray();
			assert.strictEqual(docs.length, 5);
		});
	});

	describe('collation()', function() {
		it('should set collation document', async function() {
			const collation = { locale: 'en', strength: 2 };
			const cursor = await collection.find({});
			cursor.collation(collation);
			assert.deepStrictEqual(cursor._collation, collation);
			const docs = await cursor.toArray();
			assert.strictEqual(docs.length, 5);
		});
	});

	describe('Method chaining', function() {
		it('should support chaining multiple methods', async function() {
			const cursor = await collection.find({ age: { $gt: 25 } });
			cursor
				.limit(3)
				.skip(1)
				.comment('Complex query')
				.hint({ age: 1 })
				.maxTimeMS(5000)
				.batchSize(10);
			
			assert.strictEqual(cursor._comment, 'Complex query');
			assert.deepStrictEqual(cursor._hint, { age: 1 });
			assert.strictEqual(cursor._maxTimeMS, 5000);
			assert.strictEqual(cursor._batchSize, 10);
			
			const docs = await cursor.toArray();
			assert.strictEqual(docs.length, 3);
		});
	});
});
