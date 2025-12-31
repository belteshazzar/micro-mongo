import { expect } from 'chai';
import { MongoClient } from '../main.js';

describe('Advanced Index Support', function() {
	let client, db;
	const collectionName = 'test_advanced_indexes';

	beforeEach(async function() {
		client = await new MongoClient().connect();
		db = await client.db('test_db_advanced');
		await db.createCollection(collectionName);
	});

	afterEach(async function() {
		if (db && db[collectionName]) {
			db[collectionName].drop();
		}
	});

	describe('Range Queries on Indexed Fields', function() {
		it('should use index for $gt queries', async function() {
			await db[collectionName].createIndex({ age: 1 });
			
			await db[collectionName].insertMany([
				{ name: 'Alice', age: 25 },
				{ name: 'Bob', age: 30 },
				{ name: 'Charlie', age: 35 },
				{ name: 'David', age: 40 }
			]);

			const results = await db[collectionName].find({ age: { $gt: 30 } }).toArray();
			expect(results).to.have.lengthOf(2);
			expect(results.map(r => r.name)).to.have.members(['Charlie', 'David']);
		});

		it('should use index for $gte queries', async function() {
			await db[collectionName].createIndex({ age: 1 });
			
			await db[collectionName].insertMany([
				{ name: 'Alice', age: 25 },
				{ name: 'Bob', age: 30 },
				{ name: 'Charlie', age: 35 }
			]);

			const results = await db[collectionName].find({ age: { $gte: 30 } }).toArray();
			expect(results).to.have.lengthOf(2);
			expect(results.map(r => r.name)).to.have.members(['Bob', 'Charlie']);
		});

		it('should use index for $lt queries', async function() {
			await db[collectionName].createIndex({ age: 1 });
			
			await db[collectionName].insertMany([
				{ name: 'Alice', age: 25 },
				{ name: 'Bob', age: 30 },
				{ name: 'Charlie', age: 35 }
			]);

			const results = await db[collectionName].find({ age: { $lt: 30 } }).toArray();
			expect(results).to.have.lengthOf(1);
			expect(results[0].name).to.equal('Alice');
		});

		it('should use index for $lte queries', async function() {
			await db[collectionName].createIndex({ age: 1 });
			
			await db[collectionName].insertMany([
				{ name: 'Alice', age: 25 },
				{ name: 'Bob', age: 30 },
				{ name: 'Charlie', age: 35 }
			]);

			const results = await db[collectionName].find({ age: { $lte: 30 } }).toArray();
			expect(results).to.have.lengthOf(2);
			expect(results.map(r => r.name)).to.have.members(['Alice', 'Bob']);
		});

		it('should use index for range queries with both bounds', async function() {
			await db[collectionName].createIndex({ age: 1 });
			
			await db[collectionName].insertMany([
				{ name: 'Alice', age: 20 },
				{ name: 'Bob', age: 25 },
				{ name: 'Charlie', age: 30 },
				{ name: 'David', age: 35 },
				{ name: 'Eve', age: 40 }
			]);

			const results = await db[collectionName].find({ age: { $gte: 25, $lte: 35 } }).toArray();
			expect(results).to.have.lengthOf(3);
			expect(results.map(r => r.name)).to.have.members(['Bob', 'Charlie', 'David']);
		});

		it('should use index for $in queries', async function() {
			await db[collectionName].createIndex({ status: 1 });
			
			await db[collectionName].insertMany([
				{ name: 'Task 1', status: 'pending' },
				{ name: 'Task 2', status: 'active' },
				{ name: 'Task 3', status: 'completed' },
				{ name: 'Task 4', status: 'active' },
				{ name: 'Task 5', status: 'archived' }
			]);

			const results = await db[collectionName].find({ status: { $in: ['active', 'completed'] } }).toArray();
			expect(results).to.have.lengthOf(3);
			expect(results.map(r => r.name)).to.have.members(['Task 2', 'Task 3', 'Task 4']);
		});
	});

	describe('$and Queries with Multiple Indexes (Intersection)', function() {
		it('should use index intersection for $and with two indexed fields', async function() {
			await db[collectionName].createIndex({ age: 1 });
			await db[collectionName].createIndex({ status: 1 });
			
			await db[collectionName].insertMany([
				{ name: 'Alice', age: 25, status: 'active' },
				{ name: 'Bob', age: 30, status: 'active' },
				{ name: 'Charlie', age: 25, status: 'inactive' },
				{ name: 'David', age: 30, status: 'inactive' }
			]);

			const results = await db[collectionName].find({ 
				$and: [{ age: 25 }, { status: 'active' }] 
			}).toArray();
			
			expect(results).to.have.lengthOf(1);
			expect(results[0].name).to.equal('Alice');
		});

		it('should use index intersection for implicit $and', async function() {
			await db[collectionName].createIndex({ age: 1 });
			await db[collectionName].createIndex({ city: 1 });
			
			await db[collectionName].insertMany([
				{ name: 'Alice', age: 25, city: 'NYC' },
				{ name: 'Bob', age: 30, city: 'NYC' },
				{ name: 'Charlie', age: 25, city: 'LA' },
				{ name: 'David', age: 30, city: 'LA' }
			]);

			// Implicit AND
			const results = await db[collectionName].find({ age: 25, city: 'NYC' }).toArray();
			
			expect(results).to.have.lengthOf(1);
			expect(results[0].name).to.equal('Alice');
		});

		it('should handle $and with range queries on indexed fields', async function() {
			await db[collectionName].createIndex({ age: 1 });
			await db[collectionName].createIndex({ salary: 1 });
			
			await db[collectionName].insertMany([
				{ name: 'Alice', age: 25, salary: 50000 },
				{ name: 'Bob', age: 30, salary: 60000 },
				{ name: 'Charlie', age: 35, salary: 70000 },
				{ name: 'David', age: 40, salary: 80000 }
			]);

			const results = await db[collectionName].find({ 
				$and: [
					{ age: { $gte: 30 } }, 
					{ salary: { $lte: 70000 } }
				] 
			}).toArray();
			
			expect(results).to.have.lengthOf(2);
			expect(results.map(r => r.name)).to.have.members(['Bob', 'Charlie']);
		});
	});

	describe('$or Queries with Indexes (Union)', function() {
		it('should use index union for $or with indexed fields', async function() {
			await db[collectionName].createIndex({ age: 1 });
			await db[collectionName].createIndex({ status: 1 });
			
			await db[collectionName].insertMany([
				{ name: 'Alice', age: 25, status: 'active' },
				{ name: 'Bob', age: 30, status: 'inactive' },
				{ name: 'Charlie', age: 35, status: 'active' },
				{ name: 'David', age: 40, status: 'inactive' }
			]);

			const results = await db[collectionName].find({ 
				$or: [{ age: 25 }, { status: 'active' }] 
			}).toArray();
			
			expect(results).to.have.lengthOf(2);
			expect(results.map(r => r.name)).to.have.members(['Alice', 'Charlie']);
		});

		it('should handle $or with range queries', async function() {
			await db[collectionName].createIndex({ age: 1 });
			await db[collectionName].createIndex({ salary: 1 });
			
			await db[collectionName].insertMany([
				{ name: 'Alice', age: 25, salary: 50000 },
				{ name: 'Bob', age: 30, salary: 60000 },
				{ name: 'Charlie', age: 35, salary: 70000 },
				{ name: 'David', age: 40, salary: 80000 }
			]);

			const results = await db[collectionName].find({ 
				$or: [
					{ age: { $lt: 30 } }, 
					{ salary: { $gte: 75000 } }
				] 
			}).toArray();
			
			expect(results).to.have.lengthOf(2);
			expect(results.map(r => r.name)).to.have.members(['Alice', 'David']);
		});

		it('should handle $or with multiple conditions on same field', async function() {
			await db[collectionName].createIndex({ age: 1 });
			
			await db[collectionName].insertMany([
				{ name: 'Alice', age: 25 },
				{ name: 'Bob', age: 30 },
				{ name: 'Charlie', age: 35 },
				{ name: 'David', age: 40 }
			]);

			const results = await db[collectionName].find({ 
				$or: [{ age: 25 }, { age: 40 }] 
			}).toArray();
			
			expect(results).to.have.lengthOf(2);
			expect(results.map(r => r.name)).to.have.members(['Alice', 'David']);
		});
	});

	describe('Complex Queries with Mixed Operators', function() {
		it('should handle $and with $or using indexes', async function() {
			await db[collectionName].createIndex({ age: 1 });
			await db[collectionName].createIndex({ status: 1 });
			await db[collectionName].createIndex({ city: 1 });
			
			await db[collectionName].insertMany([
				{ name: 'Alice', age: 25, status: 'active', city: 'NYC' },
				{ name: 'Bob', age: 30, status: 'active', city: 'LA' },
				{ name: 'Charlie', age: 25, status: 'inactive', city: 'NYC' },
				{ name: 'David', age: 30, status: 'inactive', city: 'LA' }
			]);

			const results = await db[collectionName].find({ 
				city: 'NYC',
				$or: [{ age: 25 }, { status: 'active' }] 
			}).toArray();
			
			// Should find Alice (both age 25 and active in NYC) and Charlie (age 25 in NYC)
			expect(results).to.have.lengthOf(2);
			expect(results.map(r => r.name)).to.have.members(['Alice', 'Charlie']);
		});

		it('should handle nested $and and $or', async function() {
			await db[collectionName].createIndex({ age: 1 });
			await db[collectionName].createIndex({ salary: 1 });
			
			await db[collectionName].insertMany([
				{ name: 'Alice', age: 25, salary: 50000, dept: 'engineering' },
				{ name: 'Bob', age: 30, salary: 60000, dept: 'sales' },
				{ name: 'Charlie', age: 35, salary: 70000, dept: 'engineering' },
				{ name: 'David', age: 40, salary: 80000, dept: 'sales' }
			]);

			const results = await db[collectionName].find({ 
				$and: [
					{ $or: [{ age: { $lt: 30 } }, { age: { $gt: 35 } }] },
					{ salary: { $gte: 50000 } }
				]
			}).toArray();
			
			// Should find Alice (age 25, salary 50k) and David (age 40, salary 80k)
			expect(results).to.have.lengthOf(2);
			expect(results.map(r => r.name)).to.have.members(['Alice', 'David']);
		});
	});

	describe('Index Selection', function() {
		it('should choose most selective index', async function() {
			await db[collectionName].createIndex({ status: 1 }); // Less selective (few values)
			await db[collectionName].createIndex({ age: 1 }); // More selective (many values)
			
			await db[collectionName].insertMany([
				{ name: 'Alice', age: 25, status: 'active' },
				{ name: 'Bob', age: 26, status: 'active' },
				{ name: 'Charlie', age: 27, status: 'active' },
				{ name: 'David', age: 28, status: 'inactive' }
			]);

			// Query that could use either index
			const results = await db[collectionName].find({ age: 25, status: 'active' }).toArray();
			
			expect(results).to.have.lengthOf(1);
			expect(results[0].name).to.equal('Alice');
		});

		it('should use single best index for simple query', async function() {
			await db[collectionName].createIndex({ age: 1 });
			await db[collectionName].createIndex({ name: 1 });
			
			await db[collectionName].insertMany([
				{ name: 'Alice', age: 25 },
				{ name: 'Bob', age: 30 },
				{ name: 'Charlie', age: 25 }
			]);

			// Query that only uses one field
			const results = await db[collectionName].find({ age: 25 }).toArray();
			
			expect(results).to.have.lengthOf(2);
			expect(results.map(r => r.name)).to.have.members(['Alice', 'Charlie']);
		});
	});

	describe('Text Index Integration', function() {
		it('should use text index with $and queries', async function() {
			await db[collectionName].createIndex({ title: 'text', content: 'text' });
			await db[collectionName].createIndex({ category: 1 });
			
			await db[collectionName].insertMany([
				{ title: 'JavaScript Tutorial', content: 'Learn JavaScript basics', category: 'programming' },
				{ title: 'Python Guide', content: 'Learn Python programming', category: 'programming' },
				{ title: 'Cooking with JavaScript', content: 'Not about programming', category: 'cooking' }
			]);

			// Find programming articles about JavaScript
			const results = await db[collectionName].find({ 
				category: 'programming',
				title: { $text: 'JavaScript' }
			}).toArray();
			
			expect(results).to.have.lengthOf(1);
			expect(results[0].title).to.equal('JavaScript Tutorial');
		});
	});

	describe('Geospatial Index Integration', function() {
		it('should use geospatial index with $and queries', async function() {
			await db[collectionName].createIndex({ location: '2dsphere' });
			await db[collectionName].createIndex({ type: 1 });
			
			await db[collectionName].insertMany([
				{ 
					name: 'Central Park',
					type: 'park',
					location: { type: 'Point', coordinates: [-73.9654, 40.7829] }
				},
				{ 
					name: 'Starbucks',
					type: 'cafe',
					location: { type: 'Point', coordinates: [-73.9851, 40.7589] }
				},
				{ 
					name: 'Brooklyn Park',
					type: 'park',
					location: { type: 'Point', coordinates: [-73.9442, 40.6782] }
				}
			]);

			// Find parks in Manhattan (simplified bbox)
			const results = await db[collectionName].find({ 
				type: 'park',
				location: { $geoWithin: [[-74.0, 40.8], [-73.9, 40.7]] }
			}).toArray();
			
			expect(results).to.have.lengthOf(1);
			expect(results[0].name).to.equal('Central Park');
		});
	});

	describe('Performance with Large Datasets', function() {
		it('should efficiently handle range queries on large indexed dataset', async function() {
			this.timeout(5000);
			
			await db[collectionName].createIndex({ value: 1 });
			
			// Insert 1000 documents
			const docs = [];
			for (let i = 0; i < 1000; i++) {
				docs.push({ value: i, category: i % 10 });
			}
			await db[collectionName].insertMany(docs);

			// Query should use index
			const start = Date.now();
			const results = await db[collectionName].find({ 
				value: { $gte: 100, $lt: 200 } 
			}).toArray();
			const duration = Date.now() - start;

			expect(results).to.have.lengthOf(100);
			expect(duration).to.be.lessThan(200); // Should be very fast with index
		});

		it('should efficiently handle $or queries on large indexed dataset', async function() {
			this.timeout(5000);
			
			await db[collectionName].createIndex({ category: 1 });
			await db[collectionName].createIndex({ value: 1 });
			
			// Insert 1000 documents
			const docs = [];
			for (let i = 0; i < 1000; i++) {
				docs.push({ value: i, category: i % 10 });
			}
			await db[collectionName].insertMany(docs);

			// Query with $or should use index union
			const start = Date.now();
			const results = await db[collectionName].find({ 
				$or: [{ category: 0 }, { category: 1 }] 
			}).toArray();
			const duration = Date.now() - start;

			expect(results).to.have.lengthOf(200); // 100 for each category
			expect(duration).to.be.lessThan(200); // Should be very fast with indexes
		});
	});

	describe('Edge Cases', function() {
		it('should handle queries with no matching index', async function() {
			await db[collectionName].createIndex({ age: 1 });
			
			await db[collectionName].insertMany([
				{ name: 'Alice', age: 25 },
				{ name: 'Bob', age: 30 }
			]);

			// Query on non-indexed field should still work (full scan)
			const results = await db[collectionName].find({ name: 'Alice' }).toArray();
			
			expect(results).to.have.lengthOf(1);
			expect(results[0].age).to.equal(25);
		});

		it('should handle empty result sets', async function() {
			await db[collectionName].createIndex({ age: 1 });
			
			await db[collectionName].insertMany([
				{ name: 'Alice', age: 25 },
				{ name: 'Bob', age: 30 }
			]);

			const results = await db[collectionName].find({ age: { $gt: 100 } }).toArray();
			
			expect(results).to.have.lengthOf(0);
		});

		it('should handle $and with mixed indexed and non-indexed fields', async function() {
			await db[collectionName].createIndex({ age: 1 });
			
			await db[collectionName].insertMany([
				{ name: 'Alice', age: 25, city: 'NYC' },
				{ name: 'Bob', age: 30, city: 'NYC' },
				{ name: 'Charlie', age: 25, city: 'LA' }
			]);

			// age is indexed, city is not
			const results = await db[collectionName].find({ 
				age: 25, 
				city: 'NYC' 
			}).toArray();
			
			expect(results).to.have.lengthOf(1);
			expect(results[0].name).to.equal('Alice');
		});
	});
});
