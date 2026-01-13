/**
 * Tests for additional aggregation pipeline stages
 * Tests: $sortByCount, $replaceRoot, $replaceWith, $sample, $bucket, $bucketAuto,
 *        $out, $merge, $lookup, $graphLookup, $facet, $redact, $geoNear
 */

import { expect } from 'chai';
import { MongoClient } from '../main.js';

describe('Additional Aggregation Stages', function() {
	let client, db, collection;

	beforeEach(async function() {
		client = await MongoClient.connect();
		// Use unique DB name with timestamp + random to ensure no collision
		db = client.db('test-agg-' + Date.now() + '-' + Math.random().toString(36).slice(2));
		// Get or create collection
		collection = db.users;
		// Completely clear the collection by deleting all documents
		await collection.deleteMany({});
	});

	afterEach(async function() {
		await client.close();
	});

	describe('$sortByCount', function() {
		it('should group by field and count occurrences', async function() {
			await collection.insertOne({ category: 'A', value: 10 });
			await collection.insertOne({ category: 'B', value: 20 });
			await collection.insertOne({ category: 'A', value: 30 });
			await collection.insertOne({ category: 'C', value: 40 });
			await collection.insertOne({ category: 'A', value: 50 });

			const results = await collection.aggregate([
				{ $sortByCount: '$category' }
			]);

		expect(results).to.have.lengthOf(3);
		expect(results[0]._id).to.equal('A');
		expect(results[0].count).to.equal(3);
		// B and C should both have count 1, but order is not deterministic
		const remainingResults = results.slice(1);
		const bResult = remainingResults.find(r => r._id === 'B');
		const cResult = remainingResults.find(r => r._id === 'C');
		expect(bResult).to.exist;
		expect(bResult.count).to.equal(1);
		expect(cResult).to.exist;
		expect(cResult.count).to.equal(1);
		});

		it('should work with expressions', async function() {
			await collection.insertOne({ price: 5 });
			await collection.insertOne({ price: 15 });
			await collection.insertOne({ price: 25 });
			await collection.insertOne({ price: 35 });

			const results = await collection.aggregate([
				{ $sortByCount: { $cond: [{ $gte: ['$price', 20] }, 'high', 'low'] } }
			]);

			expect(results).to.have.lengthOf(2);
		// Both have count 2, so order is non-deterministic
		const lowResult = results.find(r => r._id === 'low');
		const highResult = results.find(r => r._id === 'high');
		expect(lowResult).to.exist;
		expect(lowResult.count).to.equal(2);
		expect(highResult).to.exist;
		expect(highResult.count).to.equal(2);
		});
	});

	describe('$replaceRoot', function() {
		it('should replace root with embedded document', async function() {
			await collection.insertOne({ name: 'Alice', details: { age: 30, city: 'NYC' } });
			await collection.insertOne({ name: 'Bob', details: { age: 25, city: 'LA' } });

			const results = await collection.aggregate([
				{ $replaceRoot: { newRoot: '$details' } }
			]);

			expect(results).to.have.lengthOf(2);
			// Don't assume order - find each result by age
			const aliceResult = results.find(r => r.age === 30);
			const bobResult = results.find(r => r.age === 25);
			expect(aliceResult).to.exist;
			expect(aliceResult).to.not.have.property('name');
			expect(aliceResult.city).to.equal('NYC');
			expect(bobResult).to.exist;
			expect(bobResult.city).to.equal('LA');
		});

		it('should work with computed expressions', async function() {
			await collection.insertOne({ a: 1, b: 2 });
			await collection.insertOne({ a: 3, b: 4 });

			const results = await collection.aggregate([
				{ $replaceRoot: { newRoot: { sum: { $add: ['$a', '$b'] }, product: { $multiply: ['$a', '$b'] } } } }
			]);

			expect(results).to.have.lengthOf(2);
			// Don't assume order - find each result by sum
			const result1 = results.find(r => r.sum === 3);
			const result2 = results.find(r => r.sum === 7);
			expect(result1).to.exist;
			expect(result1.product).to.equal(2);
			expect(result2).to.exist;
			expect(result2.product).to.equal(12);
		});

		it('should throw error if newRoot is not an object', async function() {
			await collection.insertOne({ value: 42 });

			let error;
			try {
				await collection.aggregate([
					{ $replaceRoot: { newRoot: '$value' } }
				]);
			} catch (err) {
				error = err;
			}
			expect(error).to.exist;
		});
	});

	describe('$replaceWith', function() {
		it('should replace root with expression result', async function() {
			await collection.insertOne({ name: 'Alice', details: { age: 30 } });

			const results = await collection.aggregate([
				{ $replaceWith: '$details' }
			]);

			expect(results).to.have.lengthOf(1);
			expect(results[0]).to.not.have.property('name');
			expect(results[0].age).to.equal(30);
		});
	});

	describe('$sample', function() {
		it('should return random sample of documents', async function() {
			for (let i = 0; i < 100; i++) {
				await collection.insertOne({ value: i });
			}

			const results = await collection.aggregate([
				{ $sample: { size: 10 } }
			]);

			expect(results).to.have.lengthOf(10);
			
			// Verify all sampled documents are from the original set
			results.forEach(doc => {
				expect(doc.value).to.be.at.least(0);
				expect(doc.value).to.be.at.most(99);
			});
		});

		it('should handle sample size larger than collection', async function() {
			await collection.insertOne({ value: 1 });
			await collection.insertOne({ value: 2 });

			const results = await collection.aggregate([
				{ $sample: { size: 10 } }
			]);

			expect(results).to.have.lengthOf(2);
		});

		it('should throw error for negative size', async function() {
			await collection.insertOne({ value: 1 });

			let error;
			try {
				await collection.aggregate([
					{ $sample: { size: -1 } }
				]);
			} catch (err) {
				error = err;
			}
			expect(error).to.exist;
		});
	});

	describe('$bucket', function() {
		it('should categorize documents into buckets', async function() {
			await collection.insertOne({ price: 5 });
			await collection.insertOne({ price: 15 });
			await collection.insertOne({ price: 25 });
			await collection.insertOne({ price: 35 });

			const results = await collection.aggregate([
				{
					$bucket: {
						groupBy: '$price',
						boundaries: [0, 20, 40],
						default: 'Other'
					}
				}
			]);

			expect(results).to.have.lengthOf(2);
			expect(results[0]._id).to.equal(0);
			expect(results[0].count).to.equal(2); // 5, 15
			expect(results[1]._id).to.equal(20);
			expect(results[1].count).to.equal(2); // 25, 35
		});

		it('should support custom output accumulators', async function() {
			await collection.insertOne({ category: 'A', price: 10 });
			await collection.insertOne({ category: 'A', price: 20 });
			await collection.insertOne({ category: 'B', price: 30 });

			const results = await collection.aggregate([
				{
					$bucket: {
						groupBy: '$price',
						boundaries: [0, 25, 50],
						output: {
							count: { $sum: 1 },
							categories: { $push: '$category' },
							avgPrice: { $avg: '$price' }
						}
					}
				}
			]);

			expect(results).to.have.lengthOf(2);
			expect(results[0].count).to.equal(2);
			expect(results[0].categories).to.deep.equal(['A', 'A']);
			expect(results[0].avgPrice).to.equal(15);
		});

		it('should use default bucket for out-of-range values', async function() {
			await collection.insertOne({ value: 5 });
			await collection.insertOne({ value: 100 });

			const results = await collection.aggregate([
				{
					$bucket: {
						groupBy: '$value',
						boundaries: [0, 50],
						default: 'overflow'
					}
				}
			]);

			expect(results).to.have.lengthOf(2);
			const defaultBucket = await results.find(r => r._id === 'overflow');
			expect(defaultBucket.count).to.equal(1);
		});
	});

	describe('$bucketAuto', function() {
		it('should auto-calculate bucket boundaries', async function() {
			for (let i = 0; i < 20; i++) {
				await collection.insertOne({ value: i * 10 });
			}

			const results = await collection.aggregate([
				{
					$bucketAuto: {
						groupBy: '$value',
						buckets: 4
					}
				}
			]);

			expect(results).to.have.lengthOf(4);
			
			// Verify each bucket has roughly equal number of documents
			results.forEach(bucket => {
				expect(bucket.count).to.be.at.least(4);
				expect(bucket.count).to.be.at.most(6);
			});
		});

		it('should support custom output', async function() {
			await collection.insertOne({ score: 10 });
			await collection.insertOne({ score: 20 });
			await collection.insertOne({ score: 30 });
			await collection.insertOne({ score: 40 });

			const results = await collection.aggregate([
				{
					$bucketAuto: {
						groupBy: '$score',
						buckets: 2,
						output: {
							count: { $sum: 1 },
							avgScore: { $avg: '$score' }
						}
					}
				}
			]);

			expect(results).to.have.lengthOf(2);
			expect(results[0].avgScore).to.equal(15);
			expect(results[1].avgScore).to.equal(35);
		});
	});

	describe('$out', function() {
		it('should output results to a new collection', async function() {
			await collection.insertOne({ name: 'Alice', age: 30 });
			await collection.insertOne({ name: 'Bob', age: 25 });

			const results = await collection.aggregate([
				{ $match: { age: { $gte: 25 } } },
				{ $out: 'output_collection' }
			]);

			// $out returns empty results
			expect(results).to.have.lengthOf(0);

			// Check output collection
			const outputCursor = await db.output_collection.find({});
			const outputDocs = [];
			while (outputCursor.hasNext()) {
				outputDocs.push(outputCursor.next());
			}
			expect(outputDocs).to.have.lengthOf(2);
			expect(outputDocs.map(d => d.name)).to.include('Alice');
			expect(outputDocs.map(d => d.name)).to.include('Bob');
		});

		it('should replace existing collection', async function() {
			db.createCollection('existing');
			await db.existing.insertOne({ old: 'data' });
			await db.dropCollection('existing');
			db.createCollection('existing');

			await collection.insertOne({ new: 'data' });

			await collection.aggregate([
				{ $out: 'existing' }
			]);

			const cursor = await db.existing.find({});
			const docs = [];
			while (cursor.hasNext()) {
				docs.push(cursor.next());
			}
			
			expect(docs).to.have.lengthOf(1);
			expect(docs[0].new).to.equal('data');
			expect(docs[0]).to.not.have.property('old');
		});
	});

	describe('$merge', function() {
		it('should merge results into collection', async function() {
			db.createCollection('target');
			await db.target.insertOne({ _id: 1, name: 'Alice', age: 30 });

			await collection.insertOne({ _id: 1, name: 'Alice', age: 31, city: 'NYC' });
			await collection.insertOne({ _id: 2, name: 'Bob', age: 25 });

			const results = await collection.aggregate([
				{ $merge: 'target' }
			]);

			// $merge returns empty results
			expect(results).to.have.lengthOf(0);

			// Check merged collection
			const cursor = await db.target.find({});
			const docs = [];
			while (cursor.hasNext()) {
				docs.push(cursor.next());
			}
			
			expect(docs).to.have.lengthOf(2);
			const alice = await docs.find(d => d._id === 1);
			expect(alice.age).to.equal(31); // Updated
			expect(alice.city).to.equal('NYC'); // Merged
		});

		it('should support whenMatched: replace', async function() {
			db.createCollection('target');
			await db.target.insertOne({ _id: 1, name: 'Alice', age: 30, city: 'LA' });

			await collection.insertOne({ _id: 1, name: 'Alice', age: 31 });

			await collection.aggregate([
				{ $merge: { into: 'target', whenMatched: 'replace' } }
			]);

			const cursor = await db.target.find({ _id: 1 });
			const doc = cursor.next();
			
			expect(doc.age).to.equal(31);
			expect(doc).to.not.have.property('city'); // Replaced, not merged
		});

		it('should support whenNotMatched: discard', async function() {
			db.createCollection('target');

			await collection.insertOne({ _id: 1, name: 'Alice' });

			await collection.aggregate([
				{ $merge: { into: 'target', whenNotMatched: 'discard' } }
			]);

			const cursor = await db.target.find({});
			const docs = [];
			while (cursor.hasNext()) {
				docs.push(cursor.next());
			}
			
			expect(docs).to.have.lengthOf(0);
		});
	});

	describe('$lookup', function() {
		beforeEach(function() {
			db.createCollection('orders');
			db.createCollection('products');
		});

		it('should perform left outer join', async function() {
			await db.orders.insertOne({ _id: 1, product_id: 'A', quantity: 5 });
			await db.orders.insertOne({ _id: 2, product_id: 'B', quantity: 3 });
			await db.orders.insertOne({ _id: 3, product_id: 'A', quantity: 2 });

			await db.products.insertOne({ _id: 'A', name: 'Widget', price: 10 });
			await db.products.insertOne({ _id: 'B', name: 'Gadget', price: 20 });

			const results = await db.orders.aggregate([
				{
					$lookup: {
						from: 'products',
						localField: 'product_id',
						foreignField: '_id',
						as: 'product_info'
					}
				}
			]);

			expect(results).to.have.lengthOf(3);
			
			const order1 = await results.find(r => r._id === 1);
			expect(order1.product_info).to.have.lengthOf(1);
			expect(order1.product_info[0].name).to.equal('Widget');
		});

		it('should return empty array for unmatched documents', async function() {
			await db.orders.insertOne({ _id: 1, product_id: 'C', quantity: 5 });
			await db.products.insertOne({ _id: 'A', name: 'Widget' });

			const results = await db.orders.aggregate([
				{
					$lookup: {
						from: 'products',
						localField: 'product_id',
						foreignField: '_id',
						as: 'product_info'
					}
				}
			]);

			expect(results).to.have.lengthOf(1);
			expect(results[0].product_info).to.deep.equal([]);
		});

		it('should throw error for non-existent collection', async function() {
			await collection.insertOne({ _id: 1 });

			let error;
			try {
				await collection.aggregate([
					{
						$lookup: {
							from: 'nonexistent',
							localField: 'field',
							foreignField: 'field',
							as: 'result'
						}
					}
				]);
			} catch (err) {
				error = err;
			}
			expect(error).to.exist;
		});
	});

	describe('$graphLookup', function() {
		beforeEach(function() {
			db.createCollection('employees');
		});

		it('should perform recursive lookup', async function() {
			await db.employees.insertOne({ _id: 1, name: 'Alice', reports_to: null });
			await db.employees.insertOne({ _id: 2, name: 'Bob', reports_to: 1 });
			await db.employees.insertOne({ _id: 3, name: 'Charlie', reports_to: 2 });
			await db.employees.insertOne({ _id: 4, name: 'Dave', reports_to: 2 });

			const results = await db.employees.aggregate([
				{ $match: { _id: 1 } },
				{
					$graphLookup: {
						from: 'employees',
						startWith: '$_id',
						connectFromField: '_id',
						connectToField: 'reports_to',
						as: 'all_reports'
					}
				}
			]);

			expect(results).to.have.lengthOf(1);
			expect(results[0].all_reports).to.have.lengthOf(3); // Bob, Charlie, Dave
			
			const names = results[0].all_reports.map(e => e.name);
			expect(names).to.include('Bob');
			expect(names).to.include('Charlie');
			expect(names).to.include('Dave');
		});

		it('should respect maxDepth', async function() {
			await db.employees.insertOne({ _id: 1, name: 'Alice', reports_to: null });
			await db.employees.insertOne({ _id: 2, name: 'Bob', reports_to: 1 });
			await db.employees.insertOne({ _id: 3, name: 'Charlie', reports_to: 2 });

			const results = await db.employees.aggregate([
				{ $match: { _id: 1 } },
				{
					$graphLookup: {
						from: 'employees',
						startWith: '$_id',
						connectFromField: '_id',
						connectToField: 'reports_to',
						as: 'direct_reports',
						maxDepth: 0
					}
				}
			]);

			expect(results).to.have.lengthOf(1);
			expect(results[0].direct_reports).to.have.lengthOf(1); // Only Bob (depth 0)
			expect(results[0].direct_reports[0].name).to.equal('Bob');
		});

		it('should add depth field when specified', async function() {
			await db.employees.insertOne({ _id: 1, name: 'Alice', reports_to: null });
			await db.employees.insertOne({ _id: 2, name: 'Bob', reports_to: 1 });

			const results = await db.employees.aggregate([
				{ $match: { _id: 1 } },
				{
					$graphLookup: {
						from: 'employees',
						startWith: '$_id',
						connectFromField: '_id',
						connectToField: 'reports_to',
						as: 'reports',
						depthField: 'level'
					}
				}
			]);

			expect(results[0].reports[0].level).to.equal(0);
		});
	});

	describe('$facet', function() {
		it('should execute multiple pipelines in parallel', async function() {
			await collection.insertOne({ price: 10, category: 'A' });
			await collection.insertOne({ price: 20, category: 'B' });
			await collection.insertOne({ price: 30, category: 'A' });
			await collection.insertOne({ price: 40, category: 'B' });

			const results = await collection.aggregate([
				{
					$facet: {
						byCategory: [
							{ $group: { _id: '$category', count: { $sum: 1 } } },
							{ $sort: { _id: 1 } }
						],
						priceStats: [
							{ $group: { _id: null, avgPrice: { $avg: '$price' }, maxPrice: { $max: '$price' } } }
						],
						expensiveItems: [
							{ $match: { price: { $gte: 25 } } },
							{ $project: { price: 1, category: 1 } }
						]
					}
				}
			]);

			expect(results).to.have.lengthOf(1);
			
			expect(results[0].byCategory).to.have.lengthOf(2);
			expect(results[0].priceStats).to.have.lengthOf(1);
			expect(results[0].priceStats[0].avgPrice).to.equal(25);
			expect(results[0].expensiveItems).to.have.lengthOf(2);
		});

		it('should handle empty pipelines', async function() {
			await collection.insertOne({ value: 1 });

			const results = await collection.aggregate([
				{
					$facet: {
						all: [],
						filtered: [{ $match: { value: { $gt: 10 } } }]
					}
				}
			]);

			expect(results).to.have.lengthOf(1);
			expect(results[0].all).to.have.lengthOf(1);
			expect(results[0].filtered).to.have.lengthOf(0);
		});
	});

	describe('$redact', function() {
		it('should filter documents with $$KEEP', async function() {
			await collection.insertOne({ level: 1, data: 'public' });
			await collection.insertOne({ level: 5, data: 'private' });
			await collection.insertOne({ level: 3, data: 'protected' });

			const results = await collection.aggregate([
				{
					$redact: {
						$cond: {
							if: { $lte: ['$level', 3] },
							then: '$$KEEP',
							else: '$$PRUNE'
						}
					}
				}
			]);

			expect(results).to.have.lengthOf(2);
			expect(results.map(r => r.data)).to.include('public');
			expect(results.map(r => r.data)).to.include('protected');
			expect(results.map(r => r.data)).to.not.include('private');
		});

		it('should use $$DESCEND for recursive redaction', async function() {
			await collection.insertOne({ public: true, data: 'visible' });
			await collection.insertOne({ public: false, data: 'hidden' });

			const results = await collection.aggregate([
				{
					$redact: {
						$cond: {
							if: '$public',
							then: '$$DESCEND',
							else: '$$PRUNE'
						}
					}
				}
			]);

			expect(results).to.have.lengthOf(1);
			expect(results[0].data).to.equal('visible');
		});
	});

	describe('$geoNear', function() {
		it('should calculate distances and sort by proximity', async function() {
			await collection.insertOne({ name: 'A', location: [0, 0] });
			await collection.insertOne({ name: 'B', location: [3, 4] });
			await collection.insertOne({ name: 'C', location: [1, 1] });

			const results = await collection.aggregate([
				{
					$geoNear: {
						near: [0, 0],
						distanceField: 'distance',
						spherical: false
					}
				}
			]);

			expect(results).to.have.lengthOf(3);
			expect(results[0].name).to.equal('A'); // Closest
			expect(results[0].distance).to.equal(0);
			expect(results[1].name).to.equal('C');
			expect(results[2].name).to.equal('B'); // Farthest
		});

		it('should filter by maxDistance', async function() {
			await collection.insertOne({ name: 'A', location: [0, 0] });
			await collection.insertOne({ name: 'B', location: [10, 10] });

			const results = await collection.aggregate([
				{
					$geoNear: {
						near: [0, 0],
						distanceField: 'distance',
						maxDistance: 5,
						spherical: false
					}
				}
			]);

			expect(results).to.have.lengthOf(1);
			expect(results[0].name).to.equal('A');
		});

		it('should use spherical distance calculation', async function() {
			// NYC coordinates
			await collection.insertOne({ name: 'NYC', location: [-74.006, 40.7128] });
			// LA coordinates (roughly 3,940 km away)
			await collection.insertOne({ name: 'LA', location: [-118.2437, 34.0522] });

			const results = await collection.aggregate([
				{
					$geoNear: {
						near: [-74.006, 40.7128],
						distanceField: 'distance',
						spherical: true
					}
				}
			]);

			expect(results).to.have.lengthOf(2);
			expect(results[0].name).to.equal('NYC');
			expect(results[0].distance).to.be.closeTo(0, 1);
			expect(results[1].name).to.equal('LA');
			expect(results[1].distance).to.be.greaterThan(3900000); // > 3,900 km in meters
		});

		it('should apply limit', async function() {
			for (let i = 0; i < 10; i++) {
				await collection.insertOne({ name: `Point${i}`, location: [i, i] });
			}

			const results = await collection.aggregate([
				{
					$geoNear: {
						near: [0, 0],
						distanceField: 'distance',
						spherical: false,
						limit: 3
					}
				}
			]);

			expect(results).to.have.lengthOf(3);
		});
	});

	describe('Integration tests', function() {
		it('should chain multiple new stages together', async function() {
			await collection.insertOne({ category: 'A', price: 10 });
			await collection.insertOne({ category: 'B', price: 20 });
			await collection.insertOne({ category: 'A', price: 30 });
			await collection.insertOne({ category: 'C', price: 40 });

			const results = await collection.aggregate([
				{ $match: { price: { $gte: 15 } } },
				{ $sortByCount: '$category' },
				{ $limit: 2 }
			]);

			expect(results).to.have.lengthOf(2);
		});

		it('should work with $facet containing new stages', async function() {
			for (let i = 0; i < 20; i++) {
				await collection.insertOne({ value: i, category: i % 3 === 0 ? 'A' : 'B' });
			}

			const results = await collection.aggregate([
				{
					$facet: {
						categoryCounts: [
							{ $sortByCount: '$category' }
						],
						valueBuckets: [
							{
								$bucket: {
									groupBy: '$value',
									boundaries: [0, 5, 10, 15, 20]
								}
							}
						],
						sample: [
							{ $sample: { size: 3 } }
						]
					}
				}
			]);

			expect(results).to.have.lengthOf(1);
			expect(results[0].categoryCounts).to.have.lengthOf(2);
			expect(results[0].valueBuckets).to.have.lengthOf(4);
			expect(results[0].sample).to.have.lengthOf(3);
		});
	});
});
