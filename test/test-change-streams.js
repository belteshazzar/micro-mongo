import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import { MongoClient } from '../src/MongoClient.js';

describe('Change Streams', () => {
	let client;
	let db;
	let collection;

	beforeEach(async () => {
		client = new MongoClient();
		await client.connect();
		db = client.db('test-change-streams');
		collection = db.collection('users');
	});

	describe('Collection Watch', () => {
		it('should emit insert events when documents are inserted', async () => {
			const changes = [];
			const changeStream = collection.watch();

			changeStream.on('change', (change) => {
				changes.push(change);
			});

			await collection.insertOne({ name: 'Alice', age: 30 });
			await collection.insertOne({ name: 'Bob', age: 25 });

			// Give events time to propagate
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(changes).to.have.lengthOf(2);
			expect(changes[0].operationType).to.equal('insert');
			expect(changes[0].fullDocument.name).to.equal('Alice');
			expect(changes[0].ns.coll).to.equal('users');
			expect(changes[1].fullDocument.name).to.equal('Bob');

			changeStream.close();
		});

		it('should emit update events when documents are updated', async () => {
			const changes = [];
			await collection.insertOne({ _id: 1, name: 'Alice', age: 30 });

			const changeStream = collection.watch();
			changeStream.on('change', (change) => {
				changes.push(change);
			});

			await collection.updateOne({ _id: 1 }, { $set: { age: 31, city: 'NYC' } });

			await new Promise(resolve => setTimeout(resolve, 10));

			expect(changes).to.have.lengthOf(1);
			expect(changes[0].operationType).to.equal('update');
			expect(changes[0].documentKey._id).to.equal(1);
			expect(changes[0].updateDescription.updatedFields.age).to.equal(31);
			expect(changes[0].updateDescription.updatedFields.city).to.equal('NYC');

			changeStream.close();
		});

		it('should emit replace events when documents are replaced', async () => {
			const changes = [];
			await collection.insertOne({ _id: 1, name: 'Alice', age: 30 });

			const changeStream = collection.watch();
			changeStream.on('change', (change) => {
				changes.push(change);
			});

			await collection.replaceOne({ _id: 1 }, { name: 'Alice Smith', age: 31 });

			await new Promise(resolve => setTimeout(resolve, 10));

			expect(changes).to.have.lengthOf(1);
			expect(changes[0].operationType).to.equal('replace');
			expect(changes[0].fullDocument.name).to.equal('Alice Smith');
			expect(changes[0].fullDocument.age).to.equal(31);

			changeStream.close();
		});

		it('should emit delete events when documents are deleted', async () => {
			const changes = [];
			await collection.insertOne({ _id: 1, name: 'Alice', age: 30 });

			const changeStream = collection.watch();
			changeStream.on('change', (change) => {
				changes.push(change);
			});

			await collection.deleteOne({ _id: 1 });

			await new Promise(resolve => setTimeout(resolve, 10));

			expect(changes).to.have.lengthOf(1);
			expect(changes[0].operationType).to.equal('delete');
			expect(changes[0].documentKey._id).to.equal(1);
			expect(changes[0].fullDocument).to.be.undefined;

			changeStream.close();
		});

		it('should emit multiple events for insertMany', async () => {
			const changes = [];
			const changeStream = collection.watch();

			changeStream.on('change', (change) => {
				changes.push(change);
			});

			await collection.insertMany([
				{ name: 'Alice' },
				{ name: 'Bob' },
				{ name: 'Charlie' }
			]);

			await new Promise(resolve => setTimeout(resolve, 10));

			expect(changes).to.have.lengthOf(3);
			expect(changes[0].fullDocument.name).to.equal('Alice');
			expect(changes[1].fullDocument.name).to.equal('Bob');
			expect(changes[2].fullDocument.name).to.equal('Charlie');

			changeStream.close();
		});

		it('should emit multiple events for updateMany', async () => {
			const changes = [];
			await collection.insertMany([
				{ name: 'Alice', status: 'active' },
				{ name: 'Bob', status: 'active' }
			]);

			const changeStream = collection.watch();
			changeStream.on('change', (change) => {
				changes.push(change);
			});

			await collection.updateMany({ status: 'active' }, { $set: { status: 'inactive' } });

			await new Promise(resolve => setTimeout(resolve, 10));

			expect(changes).to.have.lengthOf(2);
			expect(changes[0].operationType).to.equal('update');
			expect(changes[1].operationType).to.equal('update');

			changeStream.close();
		});

		it('should emit multiple events for deleteMany', async () => {
			const changes = [];
			await collection.insertMany([
				{ name: 'Alice', status: 'inactive' },
				{ name: 'Bob', status: 'inactive' }
			]);

			const changeStream = collection.watch();
			changeStream.on('change', (change) => {
				changes.push(change);
			});

			await collection.deleteMany({ status: 'inactive' });

			await new Promise(resolve => setTimeout(resolve, 10));

			expect(changes).to.have.lengthOf(2);
			expect(changes[0].operationType).to.equal('delete');
			expect(changes[1].operationType).to.equal('delete');

			changeStream.close();
		});
	});

	describe('Pipeline Filtering', () => {
		it('should filter changes using $match pipeline', async () => {
			const changes = [];
			const changeStream = collection.watch([
				{ $match: { 'fullDocument.age': { $gte: 30 } } }
			]);

			changeStream.on('change', (change) => {
				changes.push(change);
			});

			await collection.insertOne({ name: 'Alice', age: 30 });
			await collection.insertOne({ name: 'Bob', age: 25 });
			await collection.insertOne({ name: 'Charlie', age: 35 });

			await new Promise(resolve => setTimeout(resolve, 10));

			// Should only see Alice (30) and Charlie (35), not Bob (25)
			expect(changes).to.have.lengthOf(2);
			expect(changes[0].fullDocument.name).to.equal('Alice');
			expect(changes[1].fullDocument.name).to.equal('Charlie');

			changeStream.close();
		});

		it('should filter by operation type', async () => {
			const changes = [];
			const changeStream = collection.watch([
				{ $match: { operationType: 'insert' } }
			]);

			changeStream.on('change', (change) => {
				changes.push(change);
			});

			await collection.insertOne({ _id: 1, name: 'Alice' });
			await collection.updateOne({ _id: 1 }, { $set: { name: 'Alice Updated' } });
			await collection.deleteOne({ _id: 1 });

			await new Promise(resolve => setTimeout(resolve, 10));

			// Should only see insert event
			expect(changes).to.have.lengthOf(1);
			expect(changes[0].operationType).to.equal('insert');

			changeStream.close();
		});
	});

	describe('Async Iteration', () => {
		it('should support for-await-of iteration', async () => {
			const changeStream = collection.watch();
			const changes = [];

			// Start consuming changes in background
			(async () => {
				for await (const change of changeStream) {
					changes.push(change);
					if (changes.length === 2) {
						changeStream.close();
						break;
					}
				}
			})();

			// Give the async iterator time to start
			await new Promise(resolve => setTimeout(resolve, 10));

			await collection.insertOne({ name: 'Alice' });
			await collection.insertOne({ name: 'Bob' });

			// Wait for changes to be processed
			await new Promise(resolve => setTimeout(resolve, 50));

			expect(changes).to.have.lengthOf(2);
			expect(changes[0].fullDocument.name).to.equal('Alice');
			expect(changes[1].fullDocument.name).to.equal('Bob');
		});

		it('should support next() method', async () => {
			const changeStream = collection.watch();

			// Insert in background after a delay
			setTimeout(async () => {
				await collection.insertOne({ name: 'Alice' });
			}, 10);

			const change = await changeStream.next();
			expect(change.operationType).to.equal('insert');
			expect(change.fullDocument.name).to.equal('Alice');

			changeStream.close();
		});
	});

	describe('Database Watch', () => {
		it('should watch all collections in database', async () => {
			const changes = [];
			const changeStream = db.watch();

			changeStream.on('change', (change) => {
				changes.push(change);
			});

			const col1 = db.collection('collection1');
			const col2 = db.collection('collection2');

			await col1.insertOne({ name: 'Alice' });
			await col2.insertOne({ name: 'Bob' });

			await new Promise(resolve => setTimeout(resolve, 10));

			expect(changes).to.have.lengthOf(2);
			expect(changes[0].ns.coll).to.equal('collection1');
			expect(changes[1].ns.coll).to.equal('collection2');

			changeStream.close();
		});
	});

	describe('Client Watch', () => {
		it('should watch all databases and collections', async () => {
			const changes = [];
			const changeStream = client.watch();

			changeStream.on('change', (change) => {
				changes.push(change);
			});

			const db1 = client.db('database1');
			const db2 = client.db('database2');

			await db1.collection('col1').insertOne({ name: 'Alice' });
			await db2.collection('col2').insertOne({ name: 'Bob' });

			await new Promise(resolve => setTimeout(resolve, 10));

			expect(changes).to.have.lengthOf(2);
			expect(changes[0].ns.db).to.equal('database1');
			expect(changes[1].ns.db).to.equal('database2');

			changeStream.close();
		});
	});

	describe('Options', () => {
		it('should support fullDocument option for updates', async () => {
			const changes = [];
			await collection.insertOne({ _id: 1, name: 'Alice', age: 30 });

			const changeStream = collection.watch([], { fullDocument: 'updateLookup' });
			changeStream.on('change', (change) => {
				changes.push(change);
			});

			await collection.updateOne({ _id: 1 }, { $set: { age: 31 } });

			await new Promise(resolve => setTimeout(resolve, 10));

			expect(changes).to.have.lengthOf(1);
			expect(changes[0].fullDocument).to.exist;
			expect(changes[0].fullDocument.name).to.equal('Alice');
			expect(changes[0].fullDocument.age).to.equal(31);

			changeStream.close();
		});
	});

	describe('Close and Cleanup', () => {
		it('should stop emitting events after close', async () => {
			const changes = [];
			const changeStream = collection.watch();

			changeStream.on('change', (change) => {
				changes.push(change);
			});

			await collection.insertOne({ name: 'Alice' });
			await new Promise(resolve => setTimeout(resolve, 10));

			changeStream.close();

			await collection.insertOne({ name: 'Bob' });
			await new Promise(resolve => setTimeout(resolve, 10));

			// Should only have 1 change (Alice), not Bob
			expect(changes).to.have.lengthOf(1);
		});

		it('should emit close event when closed', (done) => {
			const changeStream = collection.watch();

			changeStream.on('close', () => {
				done();
			});

			changeStream.close();
		});

		it('should resolve pending next() calls when closed', async () => {
			const changeStream = collection.watch();

			// Start next() call
			const nextPromise = changeStream.next();

			// Close stream immediately
			changeStream.close();

			// next() should resolve with null
			const result = await nextPromise;
			expect(result).to.be.null;
		});
	});

	describe('Error Handling', () => {
		it('should emit error events', (done) => {
			const changeStream = collection.watch();

			changeStream.on('error', (error) => {
				expect(error.message).to.include('Test error');
				done();
			});

			// Manually trigger an error
			changeStream.emit('error', new Error('Test error'));
		});
	});

	describe('Change Event Structure', () => {
		it('should have correct structure for insert events', async () => {
			const changes = [];
			const changeStream = collection.watch();

			changeStream.on('change', (change) => {
				changes.push(change);
			});

			await collection.insertOne({ name: 'Alice', age: 30 });
			await new Promise(resolve => setTimeout(resolve, 10));

			const change = changes[0];
			expect(change).to.have.property('_id');
			expect(change).to.have.property('operationType', 'insert');
			expect(change).to.have.property('clusterTime');
			expect(change).to.have.property('ns');
			expect(change.ns).to.have.property('db');
			expect(change.ns).to.have.property('coll', 'users');
			expect(change).to.have.property('documentKey');
			expect(change.documentKey).to.have.property('_id');
			expect(change).to.have.property('fullDocument');
			expect(change.fullDocument.name).to.equal('Alice');

			changeStream.close();
		});

		it('should have correct structure for update events', async () => {
			const changes = [];
			await collection.insertOne({ _id: 1, name: 'Alice', age: 30 });

			const changeStream = collection.watch();
			changeStream.on('change', (change) => {
				changes.push(change);
			});

			await collection.updateOne({ _id: 1 }, { $set: { age: 31 } });
			await new Promise(resolve => setTimeout(resolve, 10));

			const change = changes[0];
			expect(change).to.have.property('_id');
			expect(change).to.have.property('operationType', 'update');
			expect(change).to.have.property('clusterTime');
			expect(change).to.have.property('ns');
			expect(change).to.have.property('documentKey');
			expect(change).to.have.property('updateDescription');
			expect(change.updateDescription).to.have.property('updatedFields');
			expect(change.updateDescription).to.have.property('removedFields');
			expect(change.updateDescription).to.have.property('truncatedArrays');

			changeStream.close();
		});

		it('should have correct structure for delete events', async () => {
			const changes = [];
			await collection.insertOne({ _id: 1, name: 'Alice' });

			const changeStream = collection.watch();
			changeStream.on('change', (change) => {
				changes.push(change);
			});

			await collection.deleteOne({ _id: 1 });
			await new Promise(resolve => setTimeout(resolve, 10));

			const change = changes[0];
			expect(change).to.have.property('_id');
			expect(change).to.have.property('operationType', 'delete');
			expect(change).to.have.property('clusterTime');
			expect(change).to.have.property('ns');
			expect(change).to.have.property('documentKey');
			expect(change.documentKey._id).to.equal(1);
			expect(change.fullDocument).to.be.undefined;

			changeStream.close();
		});
	});
});
