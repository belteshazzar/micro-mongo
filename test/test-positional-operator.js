/**
 * Tests for $ positional operator
 */

import { expect } from 'chai';
import { createMongoClientSetup } from './test-utils.js';

describe('$ Positional Operator', function() {
	const setup = createMongoClientSetup('positional-operator-test');
	const collectionName = 'testCollection';
	let db;

	beforeEach(async function() {
		await setup.beforeEach();
		db = setup.db;
		await db.dropDatabase();
	});

	afterEach(setup.afterEach);

	describe('Basic $ operator functionality', function() {
		it('should update first matching array element with $set', async function() {
			await db[collectionName].insertOne({ 
				_id: 1, 
				grades: [80, 85, 90] 
			});
			
			// Update first element >= 85
			await db[collectionName].updateOne(
				{ grades: { $gte: 85 } },
				{ $set: { "grades.$": 87 } }
			);
			
			const doc = await db[collectionName].findOne({ _id: 1 });
			expect(doc.grades).to.deep.equal([80, 87, 90]);
		});

		it('should update nested field in first matching array element', async function() {
			await db[collectionName].insertOne({
				_id: 1,
				students: [
					{ name: 'Alice', grade: 80 },
					{ name: 'Bob', grade: 90 },
					{ name: 'Charlie', grade: 85 }
				]
			});
			
			// Update grade of first student with grade >= 85
			await db[collectionName].updateOne(
				{ 'students.grade': { $gte: 85 } },
				{ $set: { 'students.$.grade': 95 } }
			);
			
			const doc = await db[collectionName].findOne({ _id: 1 });
			expect(doc.students[0].grade).to.equal(80);
			expect(doc.students[1].grade).to.equal(95); // Bob's grade updated
			expect(doc.students[2].grade).to.equal(85);
		});

		it('should update only first matching element when multiple match', async function() {
			await db[collectionName].insertOne({
				_id: 1,
				scores: [75, 88, 92, 85]
			});
			
			// Update first element >= 85 (should update 88, not 92 or 85)
			await db[collectionName].updateOne(
				{ scores: { $gte: 85 } },
				{ $set: { "scores.$": 100 } }
			);
			
			const doc = await db[collectionName].findOne({ _id: 1 });
			expect(doc.scores).to.deep.equal([75, 100, 92, 85]);
		});

		it('should work with $inc operator', async function() {
			await db[collectionName].insertOne({
				_id: 1,
				numbers: [10, 20, 30]
			});
			
			await db[collectionName].updateOne(
				{ numbers: { $gt: 15 } },
				{ $inc: { "numbers.$": 5 } }
			);
			
			const doc = await db[collectionName].findOne({ _id: 1 });
			expect(doc.numbers).to.deep.equal([10, 25, 30]);
		});
	});

	describe('$ operator with exact match queries', function() {
		it('should work with exact value match', async function() {
			await db[collectionName].insertOne({
				_id: 1,
				tags: ['javascript', 'mongodb', 'nodejs']
			});
			
			await db[collectionName].updateOne(
				{ tags: 'mongodb' },
				{ $set: { 'tags.$': 'database' } }
			);
			
			const doc = await db[collectionName].findOne({ _id: 1 });
			expect(doc.tags).to.deep.equal(['javascript', 'database', 'nodejs']);
		});

		it('should work with $elemMatch', async function() {
			await db[collectionName].insertOne({
				_id: 1,
				items: [
					{ name: 'apple', quantity: 5 },
					{ name: 'banana', quantity: 10 },
					{ name: 'orange', quantity: 3 }
				]
			});
			
			await db[collectionName].updateOne(
				{ items: { $elemMatch: { quantity: { $gte: 10 } } } },
				{ $set: { 'items.$.quantity': 15 } }
			);
			
			const doc = await db[collectionName].findOne({ _id: 1 });
			expect(doc.items[0].quantity).to.equal(5);
			expect(doc.items[1].quantity).to.equal(15); // banana updated
			expect(doc.items[2].quantity).to.equal(3);
		});
	});

	describe('$ operator with multiple fields', function() {
		it('should update multiple fields in matched array element', async function() {
			await db[collectionName].insertOne({
				_id: 1,
				products: [
					{ name: 'laptop', price: 1000, stock: 5 },
					{ name: 'phone', price: 500, stock: 10 },
					{ name: 'tablet', price: 300, stock: 8 }
				]
			});
			
			await db[collectionName].updateOne(
				{ 'products.name': 'phone' },
				{ 
					$set: { 
						'products.$.price': 550,
						'products.$.stock': 12
					} 
				}
			);
			
			const doc = await db[collectionName].findOne({ _id: 1 });
			expect(doc.products[1].price).to.equal(550);
			expect(doc.products[1].stock).to.equal(12);
		});
	});

	describe('Edge cases', function() {
		it('should not update if no array element matches', async function() {
			await db[collectionName].insertOne({
				_id: 1,
				grades: [70, 75, 80]
			});
			
			await db[collectionName].updateOne(
				{ grades: { $gt: 90 } },
				{ $set: { 'grades.$': 100 } }
			);
			
			const doc = await db[collectionName].findOne({ _id: 1 });
			expect(doc.grades).to.deep.equal([70, 75, 80]); // No change
		});

		it('should work with nested arrays', async function() {
			await db[collectionName].insertOne({
				_id: 1,
				matrix: [
					[1, 2, 3],
					[4, 5, 6],
					[7, 8, 9]
				]
			});
			
			// This is testing array element matching at first level
			await db[collectionName].updateOne(
				{ 'matrix': [4, 5, 6] },
				{ $set: { 'matrix.$': [4, 5, 10] } }
			);
			
			const doc = await db[collectionName].findOne({ _id: 1 });
			expect(doc.matrix[1]).to.deep.equal([4, 5, 10]);
		});

		it('should handle empty arrays', async function() {
			await db[collectionName].insertOne({
				_id: 1,
				items: []
			});
			
			await db[collectionName].updateOne(
				{ items: 'test' },
				{ $set: { 'items.$': 'updated' } }
			);
			
			const doc = await db[collectionName].findOne({ _id: 1 });
			expect(doc.items).to.deep.equal([]); // No change
		});
	});

	describe('updateMany with $ operator', function() {
		it('should update first matching element in each document', async function() {
			await db[collectionName].insertMany([
				{ _id: 1, scores: [75, 88, 92] },
				{ _id: 2, scores: [65, 95, 82] },
				{ _id: 3, scores: [85, 78, 90] }
			]);
			
			await db[collectionName].updateMany(
				{ scores: { $gte: 85 } },
				{ $set: { 'scores.$': 100 } }
			);
			
			const docs = await db[collectionName].find({}).toArray();
			expect(docs[0].scores).to.deep.equal([75, 100, 92]); // 88 -> 100
			expect(docs[1].scores).to.deep.equal([65, 100, 82]); // 95 -> 100
			expect(docs[2].scores).to.deep.equal([100, 78, 90]); // 85 -> 100
		});
	});
});
