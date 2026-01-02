import { strict as assert } from 'assert';
import { MongoClient } from '../src/MongoClient.js';

describe('Advanced Query Operators', function() {
	let client, db, collection;
	const collectionName = 'testQueryOps';

	beforeEach(async function() {
		client = new MongoClient();
		await client.connect();
		db = client.db('test');
		collection = db[collectionName];
		
		// Clear collection
		await collection.deleteMany({});
	});

	afterEach(async function() {
		await collection.deleteMany({});
	});

	describe('$regex with $options', function() {
		beforeEach(async function() {
			await collection.insertMany([
				{ name: 'Alice', email: 'alice@example.com' },
				{ name: 'Bob', email: 'BOB@EXAMPLE.COM' },
				{ name: 'Charlie', email: 'charlie@test.org' }
			]);
		});

		it('should match with case-sensitive regex', async function() {
			const docs = await (await collection.find({ 
				name: { $regex: '^A' } 
			})).toArray();
			assert.strictEqual(docs.length, 1);
			assert.strictEqual(docs[0].name, 'Alice');
		});

		it('should match with case-insensitive regex using $options', async function() {
			const docs = await (await collection.find({ 
				name: { $regex: '^a', $options: 'i' } 
			})).toArray();
			assert.strictEqual(docs.length, 1);
			assert.strictEqual(docs[0].name, 'Alice');
		});

		it('should match email domains with regex', async function() {
			const docs = await (await collection.find({ 
				email: { $regex: '@example\\.com$', $options: 'i' } 
			})).toArray();
			assert.strictEqual(docs.length, 2);
		});

		it('should support multiline mode', async function() {
			await collection.insertOne({ text: 'Line 1\nLine 2\nLine 3' });
			const docs = await (await collection.find({ 
				text: { $regex: '^Line 2', $options: 'm' } 
			})).toArray();
			assert.strictEqual(docs.length, 1);
		});
	});

	describe('$type operator with BSON types', function() {
		beforeEach(async function() {
			await collection.insertMany([
				{ field: 'string value', type: 'string' },
				{ field: 42, type: 'number' },
				{ field: 3.14, type: 'double' },
				{ field: true, type: 'boolean' },
				{ field: null, type: 'null' },
				{ field: [1, 2, 3], type: 'array' },
				{ field: { nested: true }, type: 'object' },
				{ field: new Date(), type: 'date' }
			]);
		});

		it('should match string type by name', async function() {
			const docs = await (await (await collection.find({ field: { $type: 'string' } }))).toArray();
			assert.strictEqual(docs.length, 1);
			assert.strictEqual(docs[0].type, 'string');
		});

		it('should match string type by BSON code', async function() {
			const docs = await (await (await collection.find({ field: { $type: 2 } }))).toArray();
			assert.strictEqual(docs.length, 1);
			assert.strictEqual(docs[0].type, 'string');
		});

		it('should match number types', async function() {
			const docs = await (await (await collection.find({ field: { $type: 'int' } }))).toArray();
			assert.strictEqual(docs.length, 1);
			assert.strictEqual(docs[0].type, 'number');
		});

		it('should match double types', async function() {
			const docs = await (await (await collection.find({ field: { $type: 'double' } }))).toArray();
			assert.strictEqual(docs.length, 1);
			assert.strictEqual(docs[0].type, 'double');
		});

		it('should match boolean type', async function() {
			const docs = await (await (await collection.find({ field: { $type: 'bool' } }))).toArray();
			assert.strictEqual(docs.length, 1);
			assert.strictEqual(docs[0].type, 'boolean');
		});

		it('should match null type', async function() {
			const docs = await (await (await collection.find({ field: { $type: 'null' } }))).toArray();
			assert.strictEqual(docs.length, 1);
			assert.strictEqual(docs[0].type, 'null');
		});

		it('should match array type', async function() {
			const docs = await (await (await collection.find({ field: { $type: 'array' } }))).toArray();
			assert.strictEqual(docs.length, 1);
			assert.strictEqual(docs[0].type, 'array');
		});

		it('should match object type', async function() {
			const docs = await (await (await collection.find({ field: { $type: 'object' } }))).toArray();
			assert.strictEqual(docs.length, 1);
			assert.strictEqual(docs[0].type, 'object');
		});

		it('should match date type', async function() {
			const docs = await (await (await collection.find({ field: { $type: 'date' } }))).toArray();
			assert.strictEqual(docs.length, 1);
			assert.strictEqual(docs[0].type, 'date');
		});

		it('should match multiple types with array', async function() {
			const docs = await (await collection.find({ 
				field: { $type: ['string', 'int'] } 
			})).toArray();
			assert.strictEqual(docs.length, 2);
		});
	});

	describe('$expr operator', function() {
		beforeEach(async function() {
			await collection.insertMany([
				{ price: 100, qty: 5, total: 500 },
				{ price: 50, qty: 10, total: 500 },
				{ price: 200, qty: 2, total: 400 },
				{ price: 75, qty: 8, total: 600 }
			]);
		});

		it('should compare two fields with $expr', async function() {
			const docs = await (await collection.find({
				$expr: { $eq: ['$total', { $multiply: ['$price', '$qty'] }] }
			})).toArray();
			assert.strictEqual(docs.length, 4); // All should match
		});

		it('should filter with $expr using $gt comparison', async function() {
			const docs = await (await collection.find({
				$expr: { $gt: ['$total', 450] }
			})).toArray();
			assert.strictEqual(docs.length, 3);
		});

		it('should use complex expressions in $expr', async function() {
			const docs = await (await collection.find({
				$expr: { 
					$and: [
						{ $gte: ['$price', 50] },
						{ $lte: ['$price', 100] }
					]
				}
			})).toArray();
			assert.strictEqual(docs.length, 3); // price 50, 75, and 100
		});
	});

	describe('$jsonSchema operator', function() {
		beforeEach(async function() {
			await collection.insertMany([
				{ name: 'Alice', age: 30, email: 'alice@example.com' },
				{ name: 'Bob', age: 25 }, // Missing email
				{ name: 'Charlie', age: 'thirty', email: 'charlie@test.org' }, // Wrong type
				{ name: 'David', age: 35, email: 'david@example.com' }
			]);
		});

		it('should validate type with $jsonSchema', async function() {
			const docs = await (await collection.find({
				$jsonSchema: {
					properties: {
						age: { type: 'number' }
					}
				}
			})).toArray();
			assert.strictEqual(docs.length, 3); // Excludes Charlie with string age
		});

		it('should validate required fields with $jsonSchema', async function() {
			const docs = await (await collection.find({
				$jsonSchema: {
					required: ['email']
				}
			})).toArray();
			assert.strictEqual(docs.length, 3); // Excludes Bob without email
		});

		it('should validate with minimum constraint', async function() {
			const docs = await (await collection.find({
				$jsonSchema: {
					properties: {
						age: { type: 'number', minimum: 30 }
					}
				}
			})).toArray();
			assert.strictEqual(docs.length, 2); // Alice and David
		});

		it('should validate with pattern constraint', async function() {
			const docs = await (await collection.find({
				$jsonSchema: {
					properties: {
						email: { type: 'string', pattern: '@example\\.com$' }
					}
				}
			})).toArray();
			assert.strictEqual(docs.length, 2); // Alice and David
		});

		it('should validate with enum constraint', async function() {
			await collection.insertMany([
				{ status: 'active' },
				{ status: 'inactive' },
				{ status: 'pending' }
			]);
			
			const docs = await (await collection.find({
				$jsonSchema: {
					properties: {
						status: { enum: ['active', 'inactive'] }
					}
				}
			})).toArray();
			assert.strictEqual(docs.length, 2);
		});
	});

	describe('Bit Query Operators', function() {
		beforeEach(async function() {
			await collection.insertMany([
				{ flags: 0b1010, name: 'A' },  // 10 in decimal
				{ flags: 0b1111, name: 'B' },  // 15 in decimal
				{ flags: 0b0101, name: 'C' },  // 5 in decimal
				{ flags: 0b0000, name: 'D' },  // 0 in decimal
				{ flags: 0b1000, name: 'E' }   // 8 in decimal
			]);
		});

		describe('$bitsAllSet', function() {
			it('should match when all specified bits are set (bitmask)', async function() {
				const docs = await (await collection.find({ 
					flags: { $bitsAllSet: 0b1010 } 
				})).toArray();
				assert.strictEqual(docs.length, 2); // A (1010) and B (1111)
			});

			it('should match when all specified bits are set (position array)', async function() {
				const docs = await (await collection.find({ 
					flags: { $bitsAllSet: [1, 3] }  // Bits 1 and 3
				})).toArray();
				assert.strictEqual(docs.length, 2); // A and B
			});

			it('should not match when not all bits are set', async function() {
				const docs = await (await collection.find({ 
					flags: { $bitsAllSet: 0b1111 } 
				})).toArray();
				assert.strictEqual(docs.length, 1); // Only B
			});
		});

		describe('$bitsAllClear', function() {
			it('should match when all specified bits are clear (bitmask)', async function() {
				const docs = await (await collection.find({ 
					flags: { $bitsAllClear: 0b0101 } 
				})).toArray();
				assert.strictEqual(docs.length, 3); // A (1010), D (0000), and E (1000)
			});

			it('should match when all specified bits are clear (position array)', async function() {
				const docs = await (await collection.find({ 
					flags: { $bitsAllClear: [0, 2] }  // Bits 0 and 2 must be clear
				})).toArray();
				assert.strictEqual(docs.length, 3); // A, D, and E
			});

			it('should match zero when all bits clear', async function() {
				const docs = await (await collection.find({ 
					flags: { $bitsAllClear: 0b1111 } 
				})).toArray();
				assert.strictEqual(docs.length, 1); // Only D (0000)
			});
		});

		describe('$bitsAnySet', function() {
			it('should match when any specified bit is set (bitmask)', async function() {
				const docs = await (await collection.find({ 
					flags: { $bitsAnySet: 0b0001 }  // Bit 0
				})).toArray();
				assert.strictEqual(docs.length, 2); // C (0101) and B (1111)
			});

			it('should match when any specified bit is set (position array)', async function() {
				const docs = await (await collection.find({ 
					flags: { $bitsAnySet: [0, 1] }  // Bits 0 or 1
				})).toArray();
				assert.strictEqual(docs.length, 3); // A, B, C
			});
		});

		describe('$bitsAnyClear', function() {
			it('should match when any specified bit is clear (bitmask)', async function() {
				const docs = await (await collection.find({ 
					flags: { $bitsAnyClear: 0b1111 } 
				})).toArray();
				assert.strictEqual(docs.length, 4); // All except B
			});

			it('should match when any specified bit is clear (position array)', async function() {
				const docs = await (await collection.find({ 
					flags: { $bitsAnyClear: [0, 1, 2, 3] } 
				})).toArray();
				assert.strictEqual(docs.length, 4); // All except B (1111)
			});
		});

		it('should not match non-numeric values', async function() {
			await collection.insertOne({ flags: 'not a number', name: 'F' });
			const docs = await (await collection.find({ 
				flags: { $bitsAllSet: 0b0001 } 
			})).toArray();
			// Should only match numeric values
			assert(docs.every(doc => typeof doc.flags === 'number'));
		});
	});

	describe('$comment operator', function() {
		beforeEach(async function() {
			await collection.insertMany([
				{ value: 1 },
				{ value: 2 },
				{ value: 3 }
			]);
		});

		it('should not affect query results', async function() {
			const docs = await (await collection.find({ 
				value: { $gt: 1 },
				$comment: 'This is a comment explaining the query' 
			})).toArray();
			assert.strictEqual(docs.length, 2);
		});

		it('should work with empty query and comment', async function() {
			const docs = await (await collection.find({ 
				$comment: 'Find all documents' 
			})).toArray();
			assert.strictEqual(docs.length, 3);
		});
	});

	describe('Combined Operators', function() {
		beforeEach(async function() {
			await collection.insertMany([
				{ name: 'Alice', age: 30, status: 'active', flags: 0b1010 },
				{ name: 'Bob', age: 25, status: 'inactive', flags: 0b0101 },
				{ name: 'Charlie', age: 35, status: 'active', flags: 0b1111 },
				{ name: 'David', age: 28, status: 'active', flags: 0b1000 }
			]);
		});

		it('should combine $regex with $expr', async function() {
			const docs = await (await collection.find({
				name: { $regex: '^[AC]', $options: 'i' },
				$expr: { $gte: ['$age', 30] }
			})).toArray();
			assert.strictEqual(docs.length, 2); // Alice and Charlie
		});

		it('should combine $type with bit operators', async function() {
			const docs = await (await collection.find({
				age: { $type: 'int' },
				flags: { $bitsAnySet: [3] }  // Bit 3 set
			})).toArray();
			assert.strictEqual(docs.length, 3); // Alice, Charlie, David
		});

		it('should use $comment with complex query', async function() {
			const docs = await (await collection.find({
				$and: [
					{ status: 'active' },
					{ age: { $gte: 28 } },
					{ name: { $regex: '^[A-D]' } }
				],
				$comment: 'Find active users aged 28+ with names A-D'
			})).toArray();
			assert.strictEqual(docs.length, 3); // Alice, Charlie, David
		});

		it('should combine $jsonSchema with other operators', async function() {
			const docs = await (await collection.find({
				$jsonSchema: {
					required: ['status'],
					properties: {
						age: { type: 'number', minimum: 25, maximum: 30 }
					}
				},
				status: 'active'
			})).toArray();
			assert.strictEqual(docs.length, 2); // Alice and David
		});
	});

	describe('Edge Cases', function() {
		it('should handle $type with undefined fields', async function() {
			await collection.insertMany([
				{ a: 1 },
				{ a: 'string' },
				{ b: 2 } // 'a' is undefined
			]);
			
			const docs = await (await (await collection.find({ a: { $type: 'undefined' } }))).toArray();
			assert.strictEqual(docs.length, 1);
		});

		it('should handle $regex with special characters', async function() {
			await collection.insertMany([
				{ text: 'hello.world' },
				{ text: 'hello-world' },
				{ text: 'hello world' }
			]);
			
			const docs = await (await collection.find({ 
				text: { $regex: 'hello\\.world' } 
			})).toArray();
			assert.strictEqual(docs.length, 1);
		});

		it('should handle bit operators with zero', async function() {
			await collection.insertOne({ flags: 0 });
			const docs = await (await collection.find({ 
				flags: { $bitsAllClear: 0b1111 } 
			})).toArray();
			assert.strictEqual(docs.length, 1);
		});

		it('should handle $jsonSchema with nested objects', async function() {
			await collection.insertMany([
				{ user: { name: 'Alice', age: 30 } },
				{ user: { name: 'Bob', age: 'twenty' } },
				{ user: { name: 'Charlie' } }
			]);
			
			const docs = await (await collection.find({
				$jsonSchema: {
					properties: {
						user: {
							type: 'object',
							required: ['age'],
							properties: {
								age: { type: 'number' }
							}
						}
					}
				}
			})).toArray();
			assert.strictEqual(docs.length, 1); // Only Alice
		});
	});
});
