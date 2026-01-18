/**
 * Tests for filtered positional operator $[<identifier>] with arrayFilters
 */

import { DB } from '../src/server/DB.js';
import { expect } from 'chai';
import { createDBSetup } from './test-utils.js';

describe('Filtered Positional Operator with arrayFilters', function() {
	const setup = createDBSetup();
	let db, collectionName;
	let testNum = 0;

	beforeEach(async function() {
		await setup.beforeEach();
		db = setup.db;
		testNum++;
		collectionName = 'test-arrayfilters-' + testNum;
		// Drop collection if it exists from previous test
		try {
			await db.dropCollection(collectionName);
		} catch (e) {
			// Collection might not exist yet, that's fine
		}
		db.createCollection(collectionName);
	});

	afterEach(setup.afterEach);

	describe('Basic $[<identifier>] operator', function() {
		it('should update matching array elements using $[elem] with arrayFilters', async function() {
			await db[collectionName].insertOne({
				_id: 1,
				items: [
					{ name: 'apple', quantity: 5 },
					{ name: 'banana', quantity: 0 },
					{ name: 'orange', quantity: 10 }
				]
			});

			await db[collectionName].updateOne(
				{ _id: 1 },
				{ $set: { 'items.$[elem].quantity': 100 } },
				{ arrayFilters: [{ 'elem.quantity': { $lte: 5 } }] }
			);

			const doc = await db[collectionName].findOne({ _id: 1 });
			expect(doc.items[0].quantity).to.equal(100); // apple: 5 -> 100
			expect(doc.items[1].quantity).to.equal(100); // banana: 0 -> 100
			expect(doc.items[2].quantity).to.equal(10);  // orange: unchanged
		});

		it('should update simple array elements using $[elem] with arrayFilters', async function() {
			await db[collectionName].insertOne({
				_id: 1,
				scores: [85, 92, 78, 95, 88]
			});

			await db[collectionName].updateOne(
				{ _id: 1 },
				{ $set: { 'scores.$[score]': 90 } },
				{ arrayFilters: [{ 'score': { $lt: 90 } }] }
			);

			const doc = await db[collectionName].findOne({ _id: 1 });
			expect(doc.scores).to.deep.equal([90, 92, 90, 95, 90]);
		});

		it('should increment matching array elements', async function() {
			await db[collectionName].insertOne({
				_id: 1,
				items: [
					{ name: 'apple', price: 5 },
					{ name: 'banana', price: 3 },
					{ name: 'orange', price: 7 }
				]
			});

			await db[collectionName].updateOne(
				{ _id: 1 },
				{ $inc: { 'items.$[elem].price': 2 } },
				{ arrayFilters: [{ 'elem.price': { $lte: 5 } }] }
			);

			const doc = await db[collectionName].findOne({ _id: 1 });
			expect(doc.items[0].price).to.equal(7);  // apple: 5 + 2
			expect(doc.items[1].price).to.equal(5);  // banana: 3 + 2
			expect(doc.items[2].price).to.equal(7);  // orange: unchanged
		});
	});

	describe('Multiple arrayFilters', function() {
		it('should support multiple identifiers in different fields', async function() {
			await db[collectionName].insertOne({
				_id: 1,
				students: [
					{ name: 'Alice', grade: 85, active: true },
					{ name: 'Bob', grade: 92, active: false },
					{ name: 'Charlie', grade: 78, active: true }
				],
				courses: [
					{ title: 'Math', difficulty: 'hard' },
					{ title: 'English', difficulty: 'easy' }
				]
			});

			await db[collectionName].updateOne(
				{ _id: 1 },
				{ 
					$set: { 
						'students.$[student].grade': 100,
						'courses.$[course].difficulty': 'medium'
					} 
				},
				{ 
					arrayFilters: [
						{ 'student.active': true },
						{ 'course.difficulty': 'easy' }
					] 
				}
			);

			const doc = await db[collectionName].findOne({ _id: 1 });
			expect(doc.students[0].grade).to.equal(100); // Alice: active
			expect(doc.students[1].grade).to.equal(92);  // Bob: not active
			expect(doc.students[2].grade).to.equal(100); // Charlie: active
			expect(doc.courses[0].difficulty).to.equal('hard');   // Math: hard stays hard
			expect(doc.courses[1].difficulty).to.equal('medium'); // English: easy -> medium
		});

		it('should support complex filter conditions', async function() {
			await db[collectionName].insertOne({
				_id: 1,
				items: [
					{ name: 'apple', quantity: 5, price: 10 },
					{ name: 'banana', quantity: 0, price: 5 },
					{ name: 'orange', quantity: 10, price: 8 },
					{ name: 'grape', quantity: 3, price: 12 }
				]
			});

			await db[collectionName].updateOne(
				{ _id: 1 },
				{ $set: { 'items.$[elem].status': 'restock' } },
				{ arrayFilters: [{ 'elem.quantity': { $lt: 5 }, 'elem.price': { $gte: 5 } }] }
			);

			const doc = await db[collectionName].findOne({ _id: 1 });
			expect(doc.items[0].status).to.be.undefined;        // apple: quantity 5, not < 5
			expect(doc.items[1].status).to.equal('restock');     // banana: quantity 0, price 5
			expect(doc.items[2].status).to.be.undefined;        // orange: quantity 10
			expect(doc.items[3].status).to.equal('restock');     // grape: quantity 3, price 12
		});
	});

	describe('Nested arrays', function() {
		it('should update nested array elements', async function() {
			await db[collectionName].insertOne({
				_id: 1,
				students: [
					{
						name: 'Alice',
						grades: [
							{ subject: 'Math', score: 85 },
							{ subject: 'English', score: 92 }
						]
					},
					{
						name: 'Bob',
						grades: [
							{ subject: 'Math', score: 78 },
							{ subject: 'English', score: 88 }
						]
					}
				]
			});

			await db[collectionName].updateOne(
				{ _id: 1 },
				{ $inc: { 'students.$[student].grades.$[grade].score': 5 } },
				{ 
					arrayFilters: [
						{ 'student.name': 'Alice' },
						{ 'grade.score': { $lt: 90 } }
					] 
				}
			);

			const doc = await db[collectionName].findOne({ _id: 1 });
			// Alice's Math grade should be incremented (85 + 5 = 90)
			expect(doc.students[0].grades[0].score).to.equal(90);
			// Alice's English grade should not be incremented (92 >= 90)
			expect(doc.students[0].grades[1].score).to.equal(92);
			// Bob's grades should not be affected
			expect(doc.students[1].grades[0].score).to.equal(78);
			expect(doc.students[1].grades[1].score).to.equal(88);
		});
	});

	describe('updateMany with arrayFilters', function() {
		it('should update matching documents with arrayFilters', async function() {
			await db[collectionName].insertMany([
				{
					_id: 1,
					items: [
						{ name: 'apple', quantity: 5 },
						{ name: 'banana', quantity: 0 }
					]
				},
				{
					_id: 2,
					items: [
						{ name: 'orange', quantity: 0 },
						{ name: 'grape', quantity: 10 }
					]
				}
			]);

			await db[collectionName].updateMany(
				{},
				{ $set: { 'items.$[elem].quantity': 1 } },
				{ arrayFilters: [{ 'elem.quantity': 0 }] }
			);

			const docs = await db[collectionName].find({}).toArray();
			expect(docs[0].items[0].quantity).to.equal(5); // apple: unchanged
			expect(docs[0].items[1].quantity).to.equal(1); // banana: 0 -> 1
			expect(docs[1].items[0].quantity).to.equal(1); // orange: 0 -> 1
			expect(docs[1].items[1].quantity).to.equal(10); // grape: unchanged
		});
	});

	describe('Edge cases', function() {
		it('should handle no matching elements', async function() {
			await db[collectionName].insertOne({
				_id: 1,
				items: [
					{ name: 'apple', quantity: 10 },
					{ name: 'banana', quantity: 20 }
				]
			});

			await db[collectionName].updateOne(
				{ _id: 1 },
				{ $set: { 'items.$[elem].quantity': 0 } },
				{ arrayFilters: [{ 'elem.quantity': { $lt: 5 } }] }
			);

			const doc = await db[collectionName].findOne({ _id: 1 });
			// No elements match, so nothing should change
			expect(doc.items[0].quantity).to.equal(10);
			expect(doc.items[1].quantity).to.equal(20);
		});

		it('should handle empty arrays', async function() {
			await db[collectionName].insertOne({
				_id: 1,
				items: []
			});

			await db[collectionName].updateOne(
				{ _id: 1 },
				{ $set: { 'items.$[elem].quantity': 0 } },
				{ arrayFilters: [{ 'elem.quantity': { $lt: 5 } }] }
			);

			const doc = await db[collectionName].findOne({ _id: 1 });
			expect(doc.items).to.deep.equal([]);
		});

		it('should handle missing arrayFilters option', async function() {
			await db[collectionName].insertOne({
				_id: 1,
				items: [
					{ name: 'apple', quantity: 5 }
				]
			});

      try {
        await db[collectionName].updateOne(
          { _id: 1 },
          { $set: { 'items.$[elem].quantity': 100 } }
        );
        throw new Error('Expected error for missing arrayFilters');
      } catch (err) {
        expect(err.message).to.include('arrayFilters option is required when using filtered positional operator $[<identifier>]');
      }
		});
	});

	describe('Different update operators', function() {
		it('should support $mul with arrayFilters', async function() {
			await db[collectionName].insertOne({
				_id: 1,
				items: [
					{ name: 'apple', price: 5 },
					{ name: 'banana', price: 3 },
					{ name: 'orange', price: 7 }
				]
			});

			await db[collectionName].updateOne(
				{ _id: 1 },
				{ $mul: { 'items.$[elem].price': 2 } },
				{ arrayFilters: [{ 'elem.price': { $lte: 5 } }] }
			);

			const doc = await db[collectionName].findOne({ _id: 1 });
			expect(doc.items[0].price).to.equal(10); // apple: 5 * 2
			expect(doc.items[1].price).to.equal(6);  // banana: 3 * 2
			expect(doc.items[2].price).to.equal(7);  // orange: unchanged
		});

		it('should support $min with arrayFilters', async function() {
			await db[collectionName].insertOne({
				_id: 1,
				items: [
					{ name: 'apple', price: 15 },
					{ name: 'banana', price: 8 },
					{ name: 'orange', price: 20 }
				]
			});

			await db[collectionName].updateOne(
				{ _id: 1 },
				{ $min: { 'items.$[elem].price': 10 } },
				{ arrayFilters: [{ 'elem.price': { $gte: 10 } }] }
			);

			const doc = await db[collectionName].findOne({ _id: 1 });
			expect(doc.items[0].price).to.equal(10); // apple: min(15, 10)
			expect(doc.items[1].price).to.equal(8);  // banana: unchanged (< 10)
			expect(doc.items[2].price).to.equal(10); // orange: min(20, 10)
		});

		it('should support $max with arrayFilters', async function() {
			await db[collectionName].insertOne({
				_id: 1,
				items: [
					{ name: 'apple', price: 5 },
					{ name: 'banana', price: 8 },
					{ name: 'orange', price: 3 }
				]
			});

			await db[collectionName].updateOne(
				{ _id: 1 },
				{ $max: { 'items.$[elem].price': 7 } },
				{ arrayFilters: [{ 'elem.price': { $lte: 7 } }] }
			);

			const doc = await db[collectionName].findOne({ _id: 1 });
			expect(doc.items[0].price).to.equal(7);  // apple: max(5, 7)
			expect(doc.items[1].price).to.equal(8);  // banana: unchanged (> 7)
			expect(doc.items[2].price).to.equal(7);  // orange: max(3, 7)
		});
	});
});
