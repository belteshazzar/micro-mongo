import * as path from 'path';
import { fileURLToPath } from 'url';
import { StorageManager } from 'node-opfs';
import { expect } from 'chai';
import * as mongo from '../main.js';
import { createMongoClientSetup } from './test-utils.js';

/**
 * Comprehensive test suite for dot notation support in queries
 * Tests MongoDB-compatible behavior for nested field access
 */
describe('Dot Notation in Queries', function() {
	const setup = createMongoClientSetup('testdb');
	const collectionName = 'dotNotationTest';
	let collection;
	let db;

	beforeEach(async function() {
		await setup.beforeEach();
		db = setup.db;
		await db.dropCollection(collectionName);
		collection = db[collectionName];
	});

	afterEach(async function() {
		if (db) {
			await db.dropCollection(collectionName);
		}
		await setup.afterEach();
	});

	describe('Basic Nested Field Access', function() {
		it('should query nested fields with dot notation', async function() {
			await db[collectionName].insertMany([
				{ name: 'Alice', address: { city: 'NYC', zip: '10001' } },
				{ name: 'Bob', address: { city: 'LA', zip: '90001' } },
				{ name: 'Charlie', address: { city: 'NYC', zip: '10002' } }
			]);

			const results = await (await db[collectionName].find({ 'address.city': 'NYC' })).toArray();
			expect(results).to.have.lengthOf(2);
			expect(results.map(r => r.name)).to.include('Alice');
			expect(results.map(r => r.name)).to.include('Charlie');
		});

		it('should query deeply nested fields', async function() {
			await db[collectionName].insertMany([
				{ user: { profile: { name: 'Alice', age: 30 } } },
				{ user: { profile: { name: 'Bob', age: 25 } } },
				{ user: { profile: { name: 'Charlie', age: 30 } } }
			]);

			const results = await (await db[collectionName].find({ 'user.profile.age': 30 })).toArray();
			expect(results).to.have.lengthOf(2);
		});

		it('should return undefined for non-existent nested paths', async function() {
			await db[collectionName].insertOne({ name: 'Alice', age: 30 });

			const results = await (await db[collectionName].find({ 'address.city': 'NYC' })).toArray();
			expect(results).to.have.lengthOf(0);
		});
	});

	describe('Dot Notation with Query Operators', function() {
		beforeEach(async function() {
			await db[collectionName].insertMany([
				{ name: 'Product A', details: { price: 100, stock: 50 } },
				{ name: 'Product B', details: { price: 200, stock: 30 } },
				{ name: 'Product C', details: { price: 150, stock: 0 } }
			]);
		});

		it('should support $gt with dot notation', async function() {
			const results = await (await db[collectionName].find({ 'details.price': { $gt: 100 } })).toArray();
			expect(results).to.have.lengthOf(2);
			expect(results.map(r => r.name)).to.include('Product B');
			expect(results.map(r => r.name)).to.include('Product C');
		});

		it('should support $gte with dot notation', async function() {
			const results = await (await db[collectionName].find({ 'details.price': { $gte: 150 } })).toArray();
			expect(results).to.have.lengthOf(2);
		});

		it('should support $lt with dot notation', async function() {
			const results = await (await db[collectionName].find({ 'details.price': { $lt: 150 } })).toArray();
			expect(results).to.have.lengthOf(1);
			expect(results[0].name).to.equal('Product A');
		});

		it('should support $lte with dot notation', async function() {
			const results = await (await db[collectionName].find({ 'details.price': { $lte: 150 } })).toArray();
			expect(results).to.have.lengthOf(2);
		});

		it('should support $eq with dot notation', async function() {
			const results = await (await db[collectionName].find({ 'details.stock': { $eq: 0 } })).toArray();
			expect(results).to.have.lengthOf(1);
			expect(results[0].name).to.equal('Product C');
		});

		it('should support $ne with dot notation', async function() {
			const results = await (await db[collectionName].find({ 'details.stock': { $ne: 0 } })).toArray();
			expect(results).to.have.lengthOf(2);
		});

		it('should support $in with dot notation', async function() {
			const results = await (await db[collectionName].find({ 'details.price': { $in: [100, 200] } })).toArray();
			expect(results).to.have.lengthOf(2);
		});

		it('should support $nin with dot notation', async function() {
			const results = await (await db[collectionName].find({ 'details.price': { $nin: [100, 200] } })).toArray();
			expect(results).to.have.lengthOf(1);
			expect(results[0].name).to.equal('Product C');
		});

		it('should support $exists with dot notation', async function() {
			await db[collectionName].insertOne({ name: 'Product D' });
			
			const withDetails = await (await db[collectionName].find({ 'details.price': { $exists: true } })).toArray();
			expect(withDetails).to.have.lengthOf(3);

			const withoutDetails = await (await db[collectionName].find({ 'details.price': { $exists: false } })).toArray();
			expect(withoutDetails).to.have.lengthOf(1);
			expect(withoutDetails[0].name).to.equal('Product D');
		});
	});

	describe('Dot Notation with Arrays', function() {
		it('should query array elements by index', async function() {
			await db[collectionName].insertMany([
				{ name: 'Alice', tags: ['javascript', 'nodejs', 'react'] },
				{ name: 'Bob', tags: ['python', 'django', 'flask'] },
				{ name: 'Charlie', tags: ['javascript', 'vue', 'angular'] }
			]);

			const results = await (await db[collectionName].find({ 'tags.0': 'javascript' })).toArray();
			expect(results).to.have.lengthOf(2);
			expect(results.map(r => r.name)).to.include('Alice');
			expect(results.map(r => r.name)).to.include('Charlie');
		});

		it('should query nested objects within arrays', async function() {
			await db[collectionName].insertMany([
				{ 
					name: 'Order 1', 
					items: [
						{ product: 'Laptop', price: 999 },
						{ product: 'Mouse', price: 25 }
					]
				},
				{ 
					name: 'Order 2', 
					items: [
						{ product: 'Keyboard', price: 75 },
						{ product: 'Monitor', price: 300 }
					]
				}
			]);

			// Query for orders containing an item with specific price
			const results = await (await db[collectionName].find({ 'items.price': 999 })).toArray();
			expect(results).to.have.lengthOf(1);
			expect(results[0].name).to.equal('Order 1');
		});

		it('should query array element by index and nested field', async function() {
			await db[collectionName].insertMany([
				{ 
					name: 'Order 1', 
					items: [
						{ product: 'Laptop', price: 999 },
						{ product: 'Mouse', price: 25 }
					]
				},
				{ 
					name: 'Order 2', 
					items: [
						{ product: 'Keyboard', price: 75 },
						{ product: 'Monitor', price: 300 }
					]
				}
			]);

			const results = await (await db[collectionName].find({ 'items.0.price': 999 })).toArray();
			expect(results).to.have.lengthOf(1);
			expect(results[0].name).to.equal('Order 1');
		});
	});

	describe('Dot Notation with $elemMatch', function() {
		beforeEach(async function() {
			await db[collectionName].insertMany([
				{
					name: 'Student A',
					scores: [
						{ subject: 'math', grade: 85 },
						{ subject: 'english', grade: 90 }
					]
				},
				{
					name: 'Student B',
					scores: [
						{ subject: 'math', grade: 95 },
						{ subject: 'english', grade: 75 }
					]
				},
				{
					name: 'Student C',
					scores: [
						{ subject: 'math', grade: 70 },
						{ subject: 'english', grade: 85 }
					]
				}
			]);
		});

		it('should use $elemMatch with nested fields', async function() {
			const results = await (await db[collectionName].find({
				scores: { $elemMatch: { subject: 'math', grade: { $gte: 90 } } }
			})).toArray();

			expect(results).to.have.lengthOf(1);
			expect(results[0].name).to.equal('Student B');
		});
	});

	describe('Dot Notation in Updates', function() {
		it('should update nested fields with dot notation', async function() {
			await db[collectionName].insertOne({
				name: 'Alice',
				address: { city: 'NYC', zip: '10001' }
			});

			await db[collectionName].updateOne(
				{ name: 'Alice' },
				{ $set: { 'address.city': 'LA' } }
			);

			const updated = db[collectionName].findOne({ name: 'Alice' });
			expect(updated.address.city).to.equal('LA');
			expect(updated.address.zip).to.equal('10001'); // Other fields preserved
		});

		it('should update deeply nested fields', async function() {
			await db[collectionName].insertOne({
				user: {
					profile: {
						name: 'Alice',
						settings: {
							theme: 'dark',
							language: 'en'
						}
					}
				}
			});

			await db[collectionName].updateOne(
				{},
				{ $set: { 'user.profile.settings.theme': 'light' } }
			);

			const updated = db[collectionName].findOne({});
			expect(updated.user.profile.settings.theme).to.equal('light');
			expect(updated.user.profile.settings.language).to.equal('en');
		});

		it('should increment nested numeric fields', async function() {
			await db[collectionName].insertOne({
				name: 'Product A',
				stats: { views: 100, likes: 50 }
			});

			await db[collectionName].updateOne(
				{ name: 'Product A' },
				{ $inc: { 'stats.views': 10, 'stats.likes': 5 } }
			);

			const updated = db[collectionName].findOne({ name: 'Product A' });
			expect(updated.stats.views).to.equal(110);
			expect(updated.stats.likes).to.equal(55);
		});

		it('should create nested structure if it does not exist', async function() {
			await db[collectionName].insertOne({ name: 'Alice' });

			await db[collectionName].updateOne(
				{ name: 'Alice' },
				{ $set: { 'address.city': 'NYC', 'address.zip': '10001' } }
			);

			const updated = db[collectionName].findOne({ name: 'Alice' });
			expect(updated.address).to.exist;
			expect(updated.address.city).to.equal('NYC');
			expect(updated.address.zip).to.equal('10001');
		});
	});

	describe('Dot Notation with Indexes', function() {
		it('should support indexing on nested fields', async function() {
			await db[collectionName].createIndex({ 'address.city': 1 });

			await db[collectionName].insertMany([
				{ name: 'Alice', address: { city: 'NYC', zip: '10001' } },
				{ name: 'Bob', address: { city: 'LA', zip: '90001' } },
				{ name: 'Charlie', address: { city: 'NYC', zip: '10002' } }
			]);

			const results = await (await db[collectionName].find({ 'address.city': 'NYC' })).toArray();
			expect(results).to.have.lengthOf(2);
		});

		it('should use nested field index for range queries', async function() {
			await db[collectionName].createIndex({ 'details.price': 1 });

			await db[collectionName].insertMany([
				{ name: 'Product A', details: { price: 100 } },
				{ name: 'Product B', details: { price: 200 } },
				{ name: 'Product C', details: { price: 150 } }
			]);

			const results = await (await db[collectionName].find({ 'details.price': { $gt: 100 } })).toArray();
			expect(results).to.have.lengthOf(2);
		});
	});

	describe('Dot Notation Edge Cases', function() {
		this.timeout(5000);

		it('should handle null values in nested paths', async function() {
			// Ensure nested index exists to exercise indexed lookups safely
			await db[collectionName].createIndex({ 'address.city': 1 });
			await db[collectionName].insertMany([
				{ name: 'Alice', address: null },
				{ name: 'Bob', address: { city: 'NYC' } }
			]);

			const results = await (await db[collectionName].find({ 'address.city': 'NYC' })).toArray();
			expect(results).to.have.lengthOf(1);
			expect(results[0].name).to.equal('Bob');
		});

		it('should handle undefined values in nested paths', async function() {
			// Ensure nested index exists to exercise indexed lookups safely
			await db[collectionName].createIndex({ 'address.city': 1 });
			await db[collectionName].insertMany([
				{ name: 'Alice', address: { zip: '10001' } },
				{ name: 'Bob', address: { city: 'NYC', zip: '10002' } }
			]);

			const results = await (await db[collectionName].find({ 'address.city': { $exists: false } })).toArray();
			expect(results).to.have.lengthOf(1);
			expect(results[0].name).to.equal('Alice');
		});

		it('should handle empty objects in nested paths', async function() {
			// Ensure nested index exists to exercise indexed lookups safely
			await db[collectionName].createIndex({ 'address.city': 1 });
			await db[collectionName].insertMany([
				{ name: 'Alice', address: {} },
				{ name: 'Bob', address: { city: 'NYC' } }
			]);

			const results = await (await db[collectionName].find({ 'address.city': { $exists: true } })).toArray();
			expect(results).to.have.lengthOf(1);
			expect(results[0].name).to.equal('Bob');
		});
	});

	describe('Dot Notation in Projections', function() {
		it('should project specific nested fields', async function() {
			await db[collectionName].insertOne({
				name: 'Alice',
				address: { city: 'NYC', zip: '10001', country: 'USA' },
				age: 30
			});

			const result = db[collectionName].findOne({}, { 'address.city': 1 });
			expect(result).to.have.property('_id');
			expect(result).to.have.property('address');
			expect(result.address).to.have.property('city');
			expect(result.address.city).to.equal('NYC');
			// Note: MongoDB behavior - when projecting nested fields, 
			// only those fields are included in the nested object
			expect(result.address).to.not.have.property('zip');
			expect(result.address).to.not.have.property('country');
			expect(result).to.not.have.property('age');
		});

		it('should exclude specific nested fields', async function() {
			await db[collectionName].insertOne({
				name: 'Alice',
				address: { city: 'NYC', zip: '10001', country: 'USA' },
				age: 30
			});

			const result = db[collectionName].findOne({}, { 'address.zip': 0 });
			expect(result).to.have.property('name');
			expect(result).to.have.property('address');
			expect(result.address).to.have.property('city');
			expect(result.address).to.have.property('country');
			expect(result.address).to.not.have.property('zip');
			expect(result).to.have.property('age');
		});
	});
});
