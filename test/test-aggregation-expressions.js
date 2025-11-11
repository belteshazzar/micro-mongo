import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { MongoClient } from '../src/MongoClient.js';

describe('Aggregation Expression Operators', function() {
	let client, db, collection;

	beforeEach(async function() {
		client = await MongoClient.connect('mongodb://localhost:27017');
		db = client.db('testdb');
		collection = db.test;
		await collection.deleteMany({});
	});

	afterEach(async function() {
		await client.close();
		db = null;
	});

	// ========================================================================
	// ARITHMETIC OPERATORS
	// ========================================================================

	describe('Arithmetic Operators', function() {
		beforeEach(async function() {
			await collection.insertMany([
				{ _id: 1, price: 10, quantity: 2, tax: 0.5 },
				{ _id: 2, price: 20, quantity: 3, tax: 1.0 },
				{ _id: 3, price: 15, quantity: 1, tax: 0.75 }
			]);
		});

		it('should support $add operator', async function() {
			const results = await collection.aggregate([
				{ $project: { total: { $add: ['$price', '$tax'] } } }
			]);

			expect(results).to.have.lengthOf(3);
			expect(results[0].total).to.equal(10.5);
			expect(results[1].total).to.equal(21);
			expect(results[2].total).to.equal(15.75);
		});

		it('should support $multiply operator', async function() {
			const results = await collection.aggregate([
				{ $project: { subtotal: { $multiply: ['$price', '$quantity'] } } }
			]);

			expect(results).to.have.lengthOf(3);
			expect(results[0].subtotal).to.equal(20);
			expect(results[1].subtotal).to.equal(60);
			expect(results[2].subtotal).to.equal(15);
		});

		it('should support $subtract operator', async function() {
			const results = await collection.aggregate([
				{ $project: { diff: { $subtract: ['$price', '$tax'] } } }
			]);

			expect(results).to.have.lengthOf(3);
			expect(results[0].diff).to.equal(9.5);
			expect(results[1].diff).to.equal(19);
			expect(results[2].diff).to.equal(14.25);
		});

		it('should support $divide operator', async function() {
			const results = await collection.aggregate([
				{ $project: { unitPrice: { $divide: ['$price', '$quantity'] } } }
			]);

			expect(results).to.have.lengthOf(3);
			expect(results[0].unitPrice).to.equal(5);
			expect(results[1].unitPrice).to.equal(20 / 3);
			expect(results[2].unitPrice).to.equal(15);
		});

		it('should support $mod operator', async function() {
			const results = await collection.aggregate([
				{ $project: { remainder: { $mod: ['$price', 3] } } }
			]);

			expect(results).to.have.lengthOf(3);
			expect(results[0].remainder).to.equal(1);
			expect(results[1].remainder).to.equal(2);
			expect(results[2].remainder).to.equal(0);
		});

		it('should support $pow operator', async function() {
			const results = await collection.aggregate([
				{ $project: { squared: { $pow: ['$quantity', 2] } } }
			]);

			expect(results).to.have.lengthOf(3);
			expect(results[0].squared).to.equal(4);
			expect(results[1].squared).to.equal(9);
			expect(results[2].squared).to.equal(1);
		});

		it('should support $sqrt operator', async function() {
			await collection.deleteMany({});
			await collection.insertOne({ _id: 1, value: 16 });

			const results = await collection.aggregate([
				{ $project: { root: { $sqrt: '$value' } } }
			]);

			expect(results[0].root).to.equal(4);
		});

		it('should support $abs operator', async function() {
			await collection.deleteMany({});
			await collection.insertMany([
				{ _id: 1, value: -5 },
				{ _id: 2, value: 10 }
			]);

			const results = await collection.aggregate([
				{ $project: { absolute: { $abs: '$value' } } }
			]);

			expect(results[0].absolute).to.equal(5);
			expect(results[1].absolute).to.equal(10);
		});

		it('should support $ceil, $floor, $trunc operators', async function() {
			await collection.deleteMany({});
			await collection.insertOne({ _id: 1, value: 3.7 });

			const results = await collection.aggregate([
				{
					$project: {
						ceiling: { $ceil: '$value' },
						floor: { $floor: '$value' },
						truncated: { $trunc: '$value' }
					}
				}
			]);

			expect(results[0].ceiling).to.equal(4);
			expect(results[0].floor).to.equal(3);
			expect(results[0].truncated).to.equal(3);
		});

		it('should support $round operator', async function() {
			await collection.deleteMany({});
			await collection.insertOne({ _id: 1, value: 3.14159 });

			const results = await collection.aggregate([
				{ $project: { rounded: { $round: ['$value', 2] } } }
			]);

			expect(results[0].rounded).to.equal(3.14);
		});
	});

	// ========================================================================
	// STRING OPERATORS
	// ========================================================================

	describe('String Operators', function() {
		beforeEach(async function() {
			await collection.insertMany([
				{ _id: 1, firstName: 'John', lastName: 'Doe', title: 'Mr.' },
				{ _id: 2, firstName: 'Jane', lastName: 'Smith', title: 'Ms.' },
				{ _id: 3, firstName: 'Bob', lastName: 'Johnson', title: 'Dr.' }
			]);
		});

		it('should support $concat operator', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						fullName: { $concat: ['$title', ' ', '$firstName', ' ', '$lastName'] }
					}
				}
			]);

			expect(results).to.have.lengthOf(3);
			expect(results[0].fullName).to.equal('Mr. John Doe');
			expect(results[1].fullName).to.equal('Ms. Jane Smith');
			expect(results[2].fullName).to.equal('Dr. Bob Johnson');
		});

		it('should support $toLower and $toUpper operators', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						lower: { $toLower: '$firstName' },
						upper: { $toUpper: '$firstName' }
					}
				}
			]);

			expect(results[0].lower).to.equal('john');
			expect(results[0].upper).to.equal('JOHN');
		});

		it('should support $substr operator', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						initial: { $substr: ['$firstName', 0, 1] }
					}
				}
			]);

			expect(results[0].initial).to.equal('J');
			expect(results[1].initial).to.equal('J');
			expect(results[2].initial).to.equal('B');
		});

		it('should support $split operator', async function() {
			await collection.deleteMany({});
			await collection.insertOne({ _id: 1, text: 'a,b,c' });

			const results = await collection.aggregate([
				{ $project: { parts: { $split: ['$text', ','] } } }
			]);

			expect(results[0].parts).to.deep.equal(['a', 'b', 'c']);
		});

		it('should support $strLenCP operator', async function() {
			const results = await collection.aggregate([
				{ $project: { length: { $strLenCP: '$firstName' } } }
			]);

			expect(results[0].length).to.equal(4); // "John"
			expect(results[1].length).to.equal(4); // "Jane"
			expect(results[2].length).to.equal(3); // "Bob"
		});

		it('should support $trim operator', async function() {
			await collection.deleteMany({});
			await collection.insertOne({ _id: 1, text: '  hello  ' });

			const results = await collection.aggregate([
				{ $project: { trimmed: { $trim: { input: '$text' } } } }
			]);

			expect(results[0].trimmed).to.equal('hello');
		});

		it('should support $replaceOne and $replaceAll operators', async function() {
			await collection.deleteMany({});
			await collection.insertOne({ _id: 1, text: 'hello world hello' });

			const results = await collection.aggregate([
				{
					$project: {
						replaceOne: { $replaceOne: { input: '$text', find: 'hello', replacement: 'hi' } },
						replaceAll: { $replaceAll: { input: '$text', find: 'hello', replacement: 'hi' } }
					}
				}
			]);

			expect(results[0].replaceOne).to.equal('hi world hello');
			expect(results[0].replaceAll).to.equal('hi world hi');
		});
	});

	// ========================================================================
	// COMPARISON AND LOGICAL OPERATORS
	// ========================================================================

	describe('Comparison and Logical Operators', function() {
		beforeEach(async function() {
			await collection.insertMany([
				{ _id: 1, age: 25, active: true },
				{ _id: 2, age: 30, active: false },
				{ _id: 3, age: 35, active: true }
			]);
		});

		it('should support $eq, $ne, $gt, $gte, $lt, $lte operators', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						is25: { $eq: ['$age', 25] },
						notActive: { $ne: ['$active', true] },
						over30: { $gt: ['$age', 30] },
						atLeast30: { $gte: ['$age', 30] },
						under30: { $lt: ['$age', 30] },
						atMost30: { $lte: ['$age', 30] }
					}
				}
			]);

			expect(results[0].is25).to.be.true;
			expect(results[0].notActive).to.be.false;
			expect(results[0].over30).to.be.false;
			expect(results[0].atLeast30).to.be.false;
			expect(results[0].under30).to.be.true;
			expect(results[0].atMost30).to.be.true;
		});

		it('should support $and operator', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						qualified: { $and: [{ $gte: ['$age', 30] }, '$active'] }
					}
				}
			]);

			expect(results[0].qualified).to.be.false; // age < 30
			expect(results[1].qualified).to.be.false; // not active
			expect(results[2].qualified).to.be.true; // age >= 30 and active
		});

		it('should support $or operator', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						eligible: { $or: [{ $gte: ['$age', 30] }, '$active'] }
					}
				}
			]);

			expect(results[0].eligible).to.be.true; // active
			expect(results[1].eligible).to.be.true; // age >= 30
			expect(results[2].eligible).to.be.true; // both
		});

		it('should support $not operator', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						notActive: { $not: ['$active'] }
					}
				}
			]);

			expect(results[0].notActive).to.be.false;
			expect(results[1].notActive).to.be.true;
			expect(results[2].notActive).to.be.false;
		});
	});

	// ========================================================================
	// CONDITIONAL OPERATORS
	// ========================================================================

	describe('Conditional Operators', function() {
		beforeEach(async function() {
			await collection.insertMany([
				{ _id: 1, score: 85, bonus: null },
				{ _id: 2, score: 92, bonus: 5 },
				{ _id: 3, score: 78 }
			]);
		});

		it('should support $cond operator (array form)', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						grade: {
							$cond: [
								{ $gte: ['$score', 90] },
								'A',
								'B'
							]
						}
					}
				}
			]);

			expect(results[0].grade).to.equal('B');
			expect(results[1].grade).to.equal('A');
			expect(results[2].grade).to.equal('B');
		});

		it('should support $cond operator (object form)', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						grade: {
							$cond: {
								if: { $gte: ['$score', 90] },
								then: 'A',
								else: 'B'
							}
						}
					}
				}
			]);

			expect(results[0].grade).to.equal('B');
			expect(results[1].grade).to.equal('A');
			expect(results[2].grade).to.equal('B');
		});

		it('should support $ifNull operator', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						effectiveBonus: { $ifNull: ['$bonus', 0] }
					}
				}
			]);

			expect(results[0].effectiveBonus).to.equal(0);
			expect(results[1].effectiveBonus).to.equal(5);
			expect(results[2].effectiveBonus).to.equal(0);
		});

		it('should support $switch operator', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						grade: {
							$switch: {
								branches: [
									{ case: { $gte: ['$score', 90] }, then: 'A' },
									{ case: { $gte: ['$score', 80] }, then: 'B' },
									{ case: { $gte: ['$score', 70] }, then: 'C' }
								],
								default: 'F'
							}
						}
					}
				}
			]);

			expect(results[0].grade).to.equal('B');
			expect(results[1].grade).to.equal('A');
			expect(results[2].grade).to.equal('C');
		});
	});

	// ========================================================================
	// DATE OPERATORS
	// ========================================================================

	describe('Date Operators', function() {
		beforeEach(async function() {
			const date = new Date('2024-03-15T14:30:45.123Z');
			await collection.insertOne({ _id: 1, timestamp: date });
		});

		it('should support date extraction operators', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						year: { $year: '$timestamp' },
						month: { $month: '$timestamp' },
						day: { $dayOfMonth: '$timestamp' },
						hour: { $hour: '$timestamp' },
						minute: { $minute: '$timestamp' },
						second: { $second: '$timestamp' },
						millisecond: { $millisecond: '$timestamp' }
					}
				}
			]);

			expect(results[0].year).to.equal(2024);
			expect(results[0].month).to.equal(3);
			expect(results[0].day).to.equal(15);
			expect(results[0].hour).to.equal(14);
			expect(results[0].minute).to.equal(30);
			expect(results[0].second).to.equal(45);
			expect(results[0].millisecond).to.equal(123);
		});

		it('should support $dateToString operator', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						formatted: {
							$dateToString: {
								format: '%Y-%m-%d %H:%M:%S',
								date: '$timestamp'
							}
						}
					}
				}
			]);

			expect(results[0].formatted).to.equal('2024-03-15 14:30:45');
		});

		it('should support $toDate operator', async function() {
			await collection.deleteMany({});
			await collection.insertOne({ _id: 1, dateString: '2024-03-15' });

			const results = await collection.aggregate([
				{
					$project: {
						date: { $toDate: '$dateString' }
					}
				}
			]);

			expect(results[0].date).to.be.instanceOf(Date);
			expect(results[0].date.getFullYear()).to.equal(2024);
		});
	});

	// ========================================================================
	// ARRAY OPERATORS
	// ========================================================================

	describe('Array Operators', function() {
		beforeEach(async function() {
			await collection.insertMany([
				{ _id: 1, items: [1, 2, 3, 4, 5] },
				{ _id: 2, items: [10, 20, 30] },
				{ _id: 3, items: [] }
			]);
		});

		it('should support $arrayElemAt operator', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						first: { $arrayElemAt: ['$items', 0] },
						last: { $arrayElemAt: ['$items', -1] }
					}
				}
			]);

			expect(results[0].first).to.equal(1);
			expect(results[0].last).to.equal(5);
			expect(results[1].first).to.equal(10);
			expect(results[1].last).to.equal(30);
		});

		it('should support $concatArrays operator', async function() {
			await collection.deleteMany({});
			await collection.insertOne({ _id: 1, arr1: [1, 2], arr2: [3, 4] });

			const results = await collection.aggregate([
				{
					$project: {
						combined: { $concatArrays: ['$arr1', '$arr2'] }
					}
				}
			]);

			expect(results[0].combined).to.deep.equal([1, 2, 3, 4]);
		});

		it('should support $filter operator', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						filtered: {
							$filter: {
								input: '$items',
								as: 'item',
								cond: { $gte: ['$$item', 3] }
							}
						}
					}
				}
			]);

			expect(results[0].filtered).to.deep.equal([3, 4, 5]);
			expect(results[1].filtered).to.deep.equal([10, 20, 30]);
		});

		it('should support $map operator', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						doubled: {
							$map: {
								input: '$items',
								as: 'item',
								in: { $multiply: ['$$item', 2] }
							}
						}
					}
				}
			]);

			expect(results[0].doubled).to.deep.equal([2, 4, 6, 8, 10]);
			expect(results[1].doubled).to.deep.equal([20, 40, 60]);
		});

		it('should support $reduce operator', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						sum: {
							$reduce: {
								input: '$items',
								initialValue: 0,
								in: { $add: ['$$value', '$$this'] }
							}
						}
					}
				}
			]);

			expect(results[0].sum).to.equal(15); // 1+2+3+4+5
			expect(results[1].sum).to.equal(60); // 10+20+30
		});

		it('should support $size operator', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						count: { $size: '$items' }
					}
				}
			]);

			expect(results[0].count).to.equal(5);
			expect(results[1].count).to.equal(3);
			expect(results[2].count).to.equal(0);
		});

		it('should support $slice operator', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						firstTwo: { $slice: ['$items', 2] },
						lastTwo: { $slice: ['$items', -2] }
					}
				}
			]);

			expect(results[0].firstTwo).to.deep.equal([1, 2]);
			expect(results[0].lastTwo).to.deep.equal([4, 5]);
		});

		it('should support $reverseArray operator', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						reversed: { $reverseArray: '$items' }
					}
				}
			]);

			expect(results[0].reversed).to.deep.equal([5, 4, 3, 2, 1]);
		});

		it('should support $in operator', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						hasThree: { $in: [3, '$items'] }
					}
				}
			]);

			expect(results[0].hasThree).to.be.true;
			expect(results[1].hasThree).to.be.false;
		});

		it('should support $isArray operator', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						isArray: { $isArray: '$items' }
					}
				}
			]);

			expect(results[0].isArray).to.be.true;
			expect(results[1].isArray).to.be.true;
		});
	});

	// ========================================================================
	// TYPE OPERATORS
	// ========================================================================

	describe('Type Operators', function() {
		beforeEach(async function() {
			await collection.insertMany([
				{ _id: 1, value: 42 },
				{ _id: 2, value: '42' },
				{ _id: 3, value: true },
				{ _id: 4, value: null },
				{ _id: 5, value: [1, 2, 3] }
			]);
		});

		it('should support $type operator', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						type: { $type: '$value' }
					}
				}
			]);

			expect(results[0].type).to.equal('int');
			expect(results[1].type).to.equal('string');
			expect(results[2].type).to.equal('bool');
			expect(results[3].type).to.equal('null');
			expect(results[4].type).to.equal('array');
		});

		it('should support $toInt operator', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						asInt: { $toInt: '$value' }
					}
				}
			]);

			expect(results[0].asInt).to.equal(42);
			expect(results[1].asInt).to.equal(42);
		});

		it('should support $toString operator', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						asString: { $toString: '$value' }
					}
				}
			]);

			expect(results[0].asString).to.equal('42');
			expect(results[1].asString).to.equal('42');
			expect(results[2].asString).to.equal('true');
		});

		it('should support $toBool operator', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						asBool: { $toBool: '$value' }
					}
				}
			]);

			expect(results[0].asBool).to.be.true;
			expect(results[1].asBool).to.be.true;
			expect(results[2].asBool).to.be.true;
			expect(results[3].asBool).to.be.false;
		});
	});

	// ========================================================================
	// OBJECT OPERATORS
	// ========================================================================

	describe('Object Operators', function() {
		it('should support $objectToArray operator', async function() {
			await collection.insertOne({ _id: 1, obj: { a: 1, b: 2, c: 3 } });

			const results = await collection.aggregate([
				{
					$project: {
						array: { $objectToArray: '$obj' }
					}
				}
			]);

			expect(results[0].array).to.deep.equal([
				{ k: 'a', v: 1 },
				{ k: 'b', v: 2 },
				{ k: 'c', v: 3 }
			]);
		});

		it('should support $arrayToObject operator', async function() {
			await collection.insertOne({
				_id: 1,
				array: [
					{ k: 'a', v: 1 },
					{ k: 'b', v: 2 }
				]
			});

			const results = await collection.aggregate([
				{
					$project: {
						obj: { $arrayToObject: '$array' }
					}
				}
			]);

			expect(results[0].obj).to.deep.equal({ a: 1, b: 2 });
		});

		it('should support $mergeObjects operator', async function() {
			await collection.insertOne({
				_id: 1,
				obj1: { a: 1, b: 2 },
				obj2: { b: 3, c: 4 }
			});

			const results = await collection.aggregate([
				{
					$project: {
						merged: { $mergeObjects: ['$obj1', '$obj2'] }
					}
				}
			]);

			expect(results[0].merged).to.deep.equal({ a: 1, b: 3, c: 4 });
		});
	});

	// ========================================================================
	// $addFields / $set STAGE
	// ========================================================================

	describe('$addFields and $set stages', function() {
		beforeEach(async function() {
			await collection.insertMany([
				{ _id: 1, name: 'Product A', price: 10, quantity: 5 },
				{ _id: 2, name: 'Product B', price: 20, quantity: 3 }
			]);
		});

		it('should support $addFields stage', async function() {
			const results = await collection.aggregate([
				{
					$addFields: {
						total: { $multiply: ['$price', '$quantity'] },
						taxRate: 0.1
					}
				}
			]);

			expect(results).to.have.lengthOf(2);
			expect(results[0].name).to.equal('Product A');
			expect(results[0].total).to.equal(50);
			expect(results[0].taxRate).to.equal(0.1);
			expect(results[1].total).to.equal(60);
		});

		it('should support $set stage (alias for $addFields)', async function() {
			const results = await collection.aggregate([
				{
					$set: {
						discount: { $multiply: ['$price', 0.1] }
					}
				}
			]);

			expect(results[0].discount).to.equal(1);
			expect(results[1].discount).to.equal(2);
		});
	});

	// ========================================================================
	// ENHANCED $group WITH NEW ACCUMULATORS
	// ========================================================================

	describe('Enhanced $group with new accumulators', function() {
		beforeEach(async function() {
			await collection.insertMany([
				{ _id: 1, category: 'A', value: 10, data: { x: 1 } },
				{ _id: 2, category: 'A', value: 20, data: { y: 2 } },
				{ _id: 3, category: 'B', value: 15, data: { z: 3 } },
				{ _id: 4, category: 'A', value: 30, data: { w: 4 } },
				{ _id: 5, category: 'B', value: 25, data: { v: 5 } }
			]);
		});

		it('should support expressions in group accumulators', async function() {
			const results = await collection.aggregate([
				{
					$group: {
						_id: '$category',
						doubled: { $sum: { $multiply: ['$value', 2] } },
						avgSquared: { $avg: { $pow: ['$value', 2] } }
					}
				},
				{ $sort: { _id: 1 } }
			]);

			expect(results).to.have.lengthOf(2);
			expect(results[0]._id).to.equal('A');
			expect(results[0].doubled).to.equal(120); // (10+20+30) * 2
			expect(results[0].avgSquared).to.equal((100 + 400 + 900) / 3);
		});

		it('should support $stdDevPop accumulator', async function() {
			const results = await collection.aggregate([
				{
					$group: {
						_id: '$category',
						stdDev: { $stdDevPop: '$value' }
					}
				},
				{ $sort: { _id: 1 } }
			]);

			expect(results).to.have.lengthOf(2);
			expect(results[0]._id).to.equal('A');
			// Values: 10, 20, 30 -> mean: 20, variance: ((100+0+100)/3) = 66.67, stdDev: ~8.165
			expect(results[0].stdDev).to.be.closeTo(8.165, 0.01);
		});

		it('should support $stdDevSamp accumulator', async function() {
			const results = await collection.aggregate([
				{
					$group: {
						_id: '$category',
						stdDev: { $stdDevSamp: '$value' }
					}
				},
				{ $sort: { _id: 1 } }
			]);

			expect(results).to.have.lengthOf(2);
			expect(results[0]._id).to.equal('A');
			// Sample stdDev divides by (n-1) instead of n
			expect(results[0].stdDev).to.be.closeTo(10, 0.01);
		});

		it('should support $mergeObjects accumulator', async function() {
			const results = await collection.aggregate([
				{
					$group: {
						_id: '$category',
						mergedData: { $mergeObjects: '$data' }
					}
				},
				{ $sort: { _id: 1 } }
			]);

			expect(results).to.have.lengthOf(2);
			expect(results[0]._id).to.equal('A');
			expect(results[0].mergedData).to.deep.equal({ x: 1, y: 2, w: 4 });
			expect(results[1].mergedData).to.deep.equal({ z: 3, v: 5 });
		});
	});

	// ========================================================================
	// COMPLEX NESTED EXPRESSIONS
	// ========================================================================

	describe('Complex Nested Expressions', function() {
		beforeEach(async function() {
			await collection.insertMany([
				{ _id: 1, a: 10, b: 5, c: 2 },
				{ _id: 2, a: 20, b: 8, c: 3 }
			]);
		});

		it('should handle deeply nested expressions', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						// ((a + b) * c) - (a / b)
						complex: {
							$subtract: [
								{ $multiply: [{ $add: ['$a', '$b'] }, '$c'] },
								{ $divide: ['$a', '$b'] }
							]
						}
					}
				}
			]);

			expect(results[0].complex).to.equal(((10 + 5) * 2) - (10 / 5));
			expect(results[1].complex).to.equal(((20 + 8) * 3) - (20 / 8));
		});

		it('should handle expressions with conditionals and arithmetic', async function() {
			const results = await collection.aggregate([
				{
					$project: {
						result: {
							$cond: [
								{ $gt: ['$a', 15] },
								{ $multiply: ['$a', '$b'] },
								{ $add: ['$a', '$c'] }
							]
						}
					}
				}
			]);

			expect(results[0].result).to.equal(12); // a <= 15, so a + c = 10 + 2
			expect(results[1].result).to.equal(160); // a > 15, so a * b = 20 * 8
		});
	});

	// ========================================================================
	// $UNSET STAGE
	// ========================================================================

	describe('$unset Stage', function() {
		beforeEach(async function() {
			await collection.insertMany([
				{ _id: 1, name: 'Alice', age: 30, city: 'NYC', country: 'USA', score: 95 },
				{ _id: 2, name: 'Bob', age: 25, city: 'LA', country: 'USA', score: 88 },
				{ _id: 3, name: 'Charlie', age: 35, city: 'Chicago', country: 'USA', score: 92 }
			]);
		});

		it('should remove a single field using string syntax', async function() {
			const results = await collection.aggregate([
				{ $unset: 'score' }
			]);

			expect(results).to.have.lengthOf(3);
			expect(results[0]).to.have.property('name');
			expect(results[0]).to.have.property('age');
			expect(results[0]).to.not.have.property('score');
			expect(results[1]).to.not.have.property('score');
			expect(results[2]).to.not.have.property('score');
		});

		it('should remove multiple fields using array syntax', async function() {
			const results = await collection.aggregate([
				{ $unset: ['city', 'country'] }
			]);

			expect(results).to.have.lengthOf(3);
			expect(results[0]).to.have.property('name');
			expect(results[0]).to.have.property('age');
			expect(results[0]).to.have.property('score');
			expect(results[0]).to.not.have.property('city');
			expect(results[0]).to.not.have.property('country');
		});

		it('should remove fields using object syntax', async function() {
			const results = await collection.aggregate([
				{ $unset: { age: '', score: '' } }
			]);

			expect(results).to.have.lengthOf(3);
			expect(results[0]).to.have.property('name');
			expect(results[0]).to.have.property('city');
			expect(results[0]).to.not.have.property('age');
			expect(results[0]).to.not.have.property('score');
		});

		it('should work with nested documents', async function() {
			await collection.deleteMany({});
			await collection.insertMany([
				{ _id: 1, name: 'Alice', address: { city: 'NYC', zip: '10001', country: 'USA' } },
				{ _id: 2, name: 'Bob', address: { city: 'LA', zip: '90001', country: 'USA' } }
			]);

			const results = await collection.aggregate([
				{ $unset: 'address.zip' }
			]);

			expect(results).to.have.lengthOf(2);
			expect(results[0].address).to.have.property('city');
			expect(results[0].address).to.have.property('country');
			expect(results[0].address).to.not.have.property('zip');
		});

		it('should combine with other aggregation stages', async function() {
			const results = await collection.aggregate([
				{ $match: { age: { $gte: 30 } } },
				{ $unset: ['city', 'country'] },
				{ $project: { name: 1, age: 1, score: 1 } }
			]);

			expect(results).to.have.lengthOf(2);
			expect(results[0].name).to.equal('Alice');
			expect(results[0]).to.have.property('age');
			expect(results[0]).to.have.property('score');
			expect(results[0]).to.not.have.property('city');
			expect(results[1].name).to.equal('Charlie');
		});

		it('should not error when removing non-existent fields', async function() {
			const results = await collection.aggregate([
				{ $unset: 'nonexistent' }
			]);

			expect(results).to.have.lengthOf(3);
			expect(results[0]).to.have.property('name');
		});

		it('should work with $addFields and $unset together', async function() {
			const results = await collection.aggregate([
				{ $addFields: { fullName: '$name', total: { $add: ['$age', '$score'] } } },
				{ $unset: ['name', 'age', 'score'] }
			]);

			expect(results).to.have.lengthOf(3);
			expect(results[0]).to.have.property('fullName', 'Alice');
			expect(results[0]).to.have.property('total', 125);
			expect(results[0]).to.not.have.property('name');
			expect(results[0]).to.not.have.property('age');
			expect(results[0]).to.not.have.property('score');
		});
	});
});
