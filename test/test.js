
import {expect} from 'chai';
import * as mongo from '../main.js'

describe("DB no options", function() {

	var client;
	var db;
	
	before(function() {
	});

	after(function() {
	});

	beforeEach(async function() {
		client = await mongo.MongoClient.connect('mongodb://localhost:27017');
		db = client.db('testdb');
	});

	afterEach(async function() {
		await client.close();
		db = null;
	});

	it('should have no collections by default', async function() {			
		expect(db.getCollectionNames().length).to.equal(0);
	});

	it('should be able to create a collection with default store', async function() {			
		db.createCollection("myCollection");
		expect(db.getCollectionNames().length).to.equal(1);
		expect(db.myCollection).to.not.be.undefined;
	});

	it('should be able to create a collection with the provided store', async function() {			
		db.createCollection("myCollection");
		expect(db.getCollectionNames().length).to.equal(1);
		expect(db.myCollection).to.not.be.undefined;
	});

	it('should be able to drop collection', async function() {			
		db.createCollection("myCollection");
		expect(db.getCollectionNames().length).to.equal(1);
		expect(db.myCollection).to.not.be.undefined;
		db.dropDatabase();
		expect(db.getCollectionNames().length).to.equal(0);
		// After dropping, accessing the collection will auto-create it (like real MongoDB)
		// So we check getCollectionNames() to verify it's truly gone
		expect(db.getCollectionNames()).to.not.include('myCollection');
	});
});

describe("DB", function() {

	var client;
	var db;
	
	before(function() {
	});

	after(function() {
	});

	beforeEach(async function() {
		client = await mongo.MongoClient.connect('mongodb://localhost:27017', {
			print : console.log
		});
		db = client.db('testdb');
	});

	afterEach(async function() {
		await client.close();
		db = null;
	});

	it('should have no collections by default', async function() {			
		expect(db.getCollectionNames().length).to.equal(0);
	});

	it('should be able to create a collection with default store', async function() {			
		db.createCollection("myCollection");
		expect(db.getCollectionNames().length).to.equal(1);
		expect(db.myCollection).to.not.be.undefined;
	});

	it('should be able to create a collection with the provided store', async function() {			
		db.createCollection("myCollection");
		expect(db.getCollectionNames().length).to.equal(1);
		expect(db.myCollection).to.not.be.undefined;
	});

	it('should be able to drop collection', async function() {			
		db.createCollection("myCollection");
		expect(db.getCollectionNames().length).to.equal(1);
		expect(db.myCollection).to.not.be.undefined;
		db.dropDatabase();
		expect(db.getCollectionNames().length).to.equal(0);
		// After dropping, accessing the collection will auto-create it (like real MongoDB)
		// So we check getCollectionNames() to verify it's truly gone
		expect(db.getCollectionNames()).to.not.include('myCollection');
	});

	describe('Dynamic Collection Creation (Proxy)', function() {
		
		it('should auto-create collection when accessing non-existent collection', async function() {
			expect(db.getCollectionNames().length).to.equal(0);
			const col = db.dynamicCollection;
			expect(col).to.not.be.undefined;
			expect(db.getCollectionNames().length).to.equal(1);
			expect(db.getCollectionNames()).to.include('dynamicCollection');
		});

		it('should allow inserting into dynamically created collection', async function() {
			await db.users.insertOne({ name: 'Alice', age: 30 });
			const result = await db.users.findOne({ name: 'Alice' });
			expect(result).to.not.be.null;
			expect(result.name).to.equal('Alice');
			expect(result.age).to.equal(30);
		});

		it('should allow chaining methods on dynamically created collection', async function() {
			await db.products.insertMany([
				{ name: 'Product A', price: 100 },
				{ name: 'Product B', price: 200 },
				{ name: 'Product C', price: 150 }
			]);
			const results = await db.products.find({ price: { $gt: 100 } }).toArray();
			expect(results.length).to.equal(2);
		});

		it('should return same collection instance on repeated access', async function() {
			const col1 = db.testCollection;
			const col2 = db.testCollection;
			expect(col1).to.equal(col2);
		});

		it('should not create collection for internal properties', async function() {
			const options = db.options;
			expect(options).to.not.be.undefined;
			expect(db.getCollectionNames()).to.not.include('options');
		});

		it('should work with multiple dynamically created collections', async function() {
			await db.collection1.insertOne({ value: 1 });
			await db.collection2.insertOne({ value: 2 });
			await db.collection3.insertOne({ value: 3 });
			
			expect(db.getCollectionNames().length).to.equal(3);
			expect((await db.collection1.findOne()).value).to.equal(1);
			expect((await db.collection2.findOne()).value).to.equal(2);
			expect((await db.collection3.findOne()).value).to.equal(3);
		});

		it('should allow find() on non-existent collection without error', async function() {
			const results = await db.emptyCollection.find().toArray();
			expect(results).to.be.an('array');
			expect(results.length).to.equal(0);
		});
	});
	
	describe('Collection', function() {
	
		var collectionName = "myCollection";

		const topLeft = [
			129.64116138266587,
			-26.495442099101886
		  ];

		const bottomRight = [
			140.60850132443136,
			-35.787710083490815
		  ];

		const polygonInBox = {
			"type": "FeatureCollection",
			"features": [
			  {
				"type": "Feature",
				"properties": {},
				"geometry": {
				  "coordinates": [
					[
					  [
						135.35156670215986,
						-28.186307569105537
					  ],
					  [
						134.55964429902428,
						-29.938596403715188
					  ],
					  [
						135.83029451355912,
						-31.81378949724759
					  ],
					  [
						137.75466598994808,
						-31.60617146198912
					  ],
					  [
						138.61178466866698,
						-29.379281194259832
					  ],
					  [
						137.52154925127422,
						-27.656279872961044
					  ],
					  [
						135.35156670215986,
						-28.186307569105537
					  ]
					]
				  ],
				  "type": "Polygon"
				}
			  }
			]
		  };
		const pointInBox = {
			"type": "FeatureCollection",
			"features": [
			  {
				"type": "Feature",
				"properties": {},
				"geometry": {
				  "coordinates": [
					136.0572329703059,
					-33.100968957111704
				  ],
				  "type": "Point"
				}
			  }
			]
		  };

		const pointNotInBox = {
			"type": "FeatureCollection",
			"features": [
			  {
				"type": "Feature",
				"properties": {},
				"geometry": {
				  "coordinates": [
					146.22309564414053,
					-27.353479329645545
				  ],
				  "type": "Point"
				}
			  }
			]
		  };

		const partiallyInBox = {
			"type": "FeatureCollection",
			"features": [
			  {
				"type": "Feature",
				"properties": {},
				"geometry": {
				  "coordinates": [
					[
					  [
						134.77919638975504,
						-30.92126050109725
					  ],
					  [
						134.77919638975504,
						-32.29700946798877
					  ],
					  [
						146.3983598387441,
						-32.29700946798877
					  ],
					  [
						146.3983598387441,
						-30.92126050109725
					  ],
					  [
						134.77919638975504,
						-30.92126050109725
					  ]
					]
				  ],
				  "type": "Polygon"
				}
			  }
			]
		  };

		async function initDB() {
			db.createCollection(collectionName);
			await db[collectionName].insert({ age: 4,	legs: 0, geojson: polygonInBox });
			await db[collectionName].insert([{ age: 4, legs: 5, geojson: pointInBox },{ age: 54, legs: 2, geojson: pointNotInBox }]);
			await db[collectionName].insertMany([{ age: 54, legs: 12 },{ age: 16, geojson: partiallyInBox }]);
			await db[collectionName].insertOne({ name: "steve", text: "this is a text string with paris and london", geojson: pointInBox });

		}
		
		function testFind(q) { 
			try {
				var results = [];
				var docs = db[collectionName].find(q);
				while (docs.hasNext()) {
					results.push(docs.next());
				}
				return results;
			} catch (e) {
				return e;
			}
		}
	
		function dump() {
			var c = db[collectionName].find();
			while (c.hasNext()) {
				console.log(c.next());
			}
		}
	
		async function reset() {
			db.dropDatabase();
			await initDB();
		}
			
		before(function() {
		});
	
		after(function() {
		});
	
		beforeEach(async function() {
			await initDB();
		});
	
		afterEach(function() {
			db = null;
		});
			
		it('should testCount', async function() {
			var q = { age : { $gt:3, $lt:7 }};
			if (db[collectionName].find(q).count()!=2) throw "should be 2";
			if ((await db[collectionName].count())!=6) throw "db should have 6 docs";
		});

		it('should testCopyTo', async function() {
			var dest = "backup";
			if (db.getCollectionNames().includes(dest)) throw "backup collection shouldn't exist";
			if ((await db[collectionName].copyTo(dest))!=6) throw "should have copied all 6 docs";
			if (!db.getCollectionNames().includes(dest)) throw "backup collection should have been created";
			if (db[dest].find().count()!=6) throw "failed to copy all content";
			if (db[collectionName].find().count()!=6) throw "original collection should still have 6 docs";
			if ((await db[collectionName].copyTo(dest))!=6) throw "should have copied all 6 docs";
			if (db[dest].find().count()!=6) throw "failed to copy all content";
		});

		it('should testDeleteOne', async function() {
			var q = { age : { $gt:3, $lt:7 }};
			if (db[collectionName].find(q).count()!=2) throw "should be 2";
			if ((await db[collectionName].count())!=6) throw "db should have 6 docs";
			if ((await db[collectionName].deleteOne(q)).deletedCount!=1) throw "didn't delete single doc";
			if (db[collectionName].find(q).count()!=1) throw "should be 1 after deletion";
			if ((await db[collectionName].count())!=5) throw "db should have 5 docs in db after deleteion";
		});

		it('should testDeleteMany', async function() {
			var q = { age : { $gt:3, $lt:7 }};
			if (db[collectionName].find(q).count()!=2) throw "should be 2";
			if ((await db[collectionName].count())!=6) throw "db should have 6 docs";
			if ((await db[collectionName].deleteMany(q)).deletedCount!=2) throw "didn't delete 2 docs";
			if (db[collectionName].find(q).count()!=0) throw "should be 0 after deletion";
			if ((await db[collectionName].count())!=4) throw "db should have 4 docs in db after deleteion";
		});

		it('should testDistinct', async function() {
			var vals = await db[collectionName].distinct("age"); // [4,16,54]
			if (vals.length!=3) throw "3 distinct values of age";
			if (vals[0]!=4) throw "fail";
			if (vals[1]!=16) throw "fail";
			if (vals[2]!=54) throw "fail";
			var vals = await db[collectionName].distinct("age",{legs:2}); // [54]
			if (vals.length!=1) throw "fail";
			if (vals[0]!=54) throw "fail";
		});

		it('should testDrop', async function() {
			if ((await db[collectionName].count())!=6) throw "db should have 6 docs";
			db[collectionName].drop();
			if ((await db[collectionName].count())!=0) throw "db should have no docs";
		});


		/************************************************************************
		 * > db.peep.find()
		 * { "_id" : ObjectId("5695be58adb5303f33363146"), "age" : 4, "legs" : 0 }
		 * { "_id" : ObjectId("5695be62adb5303f33363147"), "age" : 4, "legs" : 5 }
		 * { "_id" : ObjectId("5695be6aadb5303f33363148"), "age" : 54, "legs" : 2 }
		 * { "_id" : ObjectId("5695be73adb5303f33363149"), "age" : 54, "legs" : 12 }
		 * { "_id" : ObjectId("5695be7dadb5303f3336314a"), "name" : "steve" }
		 * { "_id" : ObjectId("56983fa1396c05c1d83a87dd"), "age" : 16 }
		 */
		it('should testFind1', async function() {
			var docs = testFind();
			expect(docs.length).to.equal(6);
		});

		/************************************************************************
		 * > db.peep.find({age:54,legs:2})
		 * { "_id" : ObjectId("5695be6aadb5303f33363148"), "age" : 54, "legs" : 2 }
		 */
		it('should testFind2', async function() {
			var docs = testFind({ age : 54,	legs: 2 });
			if (docs.length!=1) throw "fail";
		});


		/************************************************************************
		 * > db.peep.find({ $and: [{ age : 54},{ legs: 2 }] })
		 * { "_id" : ObjectId("5695be6aadb5303f33363148"), "age" : 54, "legs" : 2 }
		 */
		it('should testFind3', async function() {
			var docs = testFind({ $and: [{ age : 54},{ legs: 2 }] });
			if (docs.length!=1) throw "fail";
		});


		/************************************************************************
		 * > db.peep.find({ age: { $and: [{ $eq : 54}] }, legs: 2 })
		 * Error: error: {
		 *				 "$err" : "Can't canonicalize query: BadValue unknown operator: $and",
		 *				 "code" : 17287
		 */
		it('should testFind4', async function() {
			var docs = testFind({ age: { $and: [{ $eq : 54}] }, legs: 2 });
			if (docs.$err!="Can't canonicalize query: BadValue unknown operator: $and") throw "fail";		
		});


		/************************************************************************
		 * > db.peep.find({ age: {$gt:3, $lt: 7}})
		 * { "_id" : ObjectId("5695be58adb5303f33363146"), "age" : 4, "legs" : 0 }
		 * { "_id" : ObjectId("5695be62adb5303f33363147"), "age" : 4, "legs" : 5 }
		 */
		it('should testFind5', async function() {
			var docs = testFind({ age : { $gt:3, $lt:7 }});
			if (docs.length!=2) throw "fail";
		});

		/************************************************************************
		 * > db.peep.find({ age: {$gt:{t:3}, $lt: 7}})
		 * 
		 * No Error produced by mongo (?)
		 */
		it('should testFind6', async function() {
			var docs = testFind({ age: {$gt:{t:3}, $lt: 7}});
			if (docs.length!=0) throw "fail";
		});


		/************************************************************************
		 * > db.peep.find({ age: {$gt:3, lt: 7}})
		 * Error: error: {
		 *				 "$err" : "Can't canonicalize query: BadValue unknown operator: lt",
		 *				 "code" : 17287
		 * }
		 */
		it('should testFind7', async function() {
			var docs = testFind({ age: {$gt:3, lt: 7}});
			if (docs.$err!="Can't canonicalize query: BadValue unknown operator: lt") throw "fail";
		});

		/************************************************************************
		 * > db.peep.find({ age: {gt:3, $lt: 7}})	// object comparison as no first '$'
		 */
		it('should testFind8', async function() {
			var docs = testFind({ age: {gt:3, $lt: 7}});
			if (docs.length!=0) throw "fail";
		});

		/************************************************************************
		 * > db.peep.find({ age: {gt:3, lt: 7}}) // object comparison
		 */
		it('should testFind9', async function() {
		 var docs = testFind({ age: {gt:3, lt: 7}});
			if (docs.length!=0) throw "fail";
		});


		/************************************************************************
		 * > db.peep.find({ age: {$gt:3, lt: 7}})
		 * Error: error: {
		 *				 "$err" : "Can't canonicalize query: BadValue unknown operator: lt",
		 *				 "code" : 17287
		 * }
		 */
		it('should testFind10', async function() {
			var docs = testFind({ age: {$gt:3, lt: 7}});
			if (docs.$err!="Can't canonicalize query: BadValue unknown operator: lt") throw "fail";
		});

		/************************************************************************
		 * 
		 */

		it('should find text', async function() {
			var docs = testFind({ text: {$text: "pari" }})
			expect(docs).to.not.be.null
			expect(docs.$err).to.be.undefined
			expect(docs.length).to.equal(1)
		})

		it('should not find text', async function() {
			var docs = testFind({ text: {$text: "fred"} })
			expect(docs).to.not.be.null
			expect(docs.$err).to.be.undefined
			expect(docs.length).to.equal(0)
		})

		it('should find text in and', async function() {
			var docs = testFind({ $and: [ { text: { $text: "paris"} },{ text: { $text: "london" }} ]})
			expect(docs).to.not.be.null
			expect(docs.$err).to.be.undefined
			expect(docs.length).to.equal(1)
		})

		/************************************************************************
		 * 
		 */
		  
		 it('should geo within bbox', async function() {
			var docs = testFind({ geojson: { $geoWithin: [ topLeft, bottomRight ] }})
			expect(docs).to.not.be.null
			expect(docs.$err).to.be.undefined
			expect(docs.length).to.equal(3)
		})

		it('should geo witin in and', async function() {
			var docs = testFind({ $and: [ { text: {$text: "pari" }},{ geojson: { $geoWithin: [ topLeft, bottomRight ] }} ]})
			expect(docs).to.not.be.null
			expect(docs.$err).to.be.undefined
			expect(docs.length).to.equal(1)
		})
		
		/************************************************************************
		 * 
		 */
		it('should testFindArray01', async function() {
				await db[collectionName].insert({ scores: [4,5,6] });
				await db[collectionName].insert({ scores: [3,5,7] });
			var docs = testFind({ "scores.2" : 7});
			if (docs.length!=1) throw "fail";
			if (docs[0].scores[2]!=7) throw "Fail";
		});

		/************************************************************************
		 * 
		 */
		it('should testFindArray02', async function() {
				await db[collectionName].insert({ scores: [4,5,6] });
				await db[collectionName].insert({ scores: [3,5,7] });
			var docs = testFind({ "scores.0" : { $lt : 4 }});
			if (docs.length!=1) throw "fail";
			if (docs[0].scores[2]!=7) throw "Fail";
		});
		
		/************************************************************************
		 * Test $all operator - matches arrays that contain all elements
		 */
		it('should find with $all operator', async function() {
			await db[collectionName].insert({ tags: ["javascript", "mongodb", "database"] });
			await db[collectionName].insert({ tags: ["javascript", "nodejs"] });
			await db[collectionName].insert({ tags: ["mongodb", "database"] });
			
			var docs = testFind({ tags: { $all: ["javascript", "mongodb"] }});
			expect(docs.length).to.equal(1);
			expect(docs[0].tags).to.include("javascript");
			expect(docs[0].tags).to.include("mongodb");
			expect(docs[0].tags).to.include("database");
		});

		it('should not find with $all when not all elements present', async function() {
			await db[collectionName].insert({ tags: ["javascript", "nodejs"] });
			
			var docs = testFind({ tags: { $all: ["javascript", "mongodb", "python"] }});
			expect(docs.length).to.equal(0);
		});

		/************************************************************************
		 * Test $elemMatch operator
		 */
		it('should find with $elemMatch operator', async function() {
			await db[collectionName].insert({ 
				results: [
					{ score: 80, subject: "math" },
					{ score: 90, subject: "english" }
				]
			});
			await db[collectionName].insert({ 
				results: [
					{ score: 70, subject: "math" },
					{ score: 60, subject: "english" }
				]
			});
			
			var docs = testFind({ results: { $elemMatch: { score: { $gte: 80 }, subject: "math" }}});
			expect(docs.length).to.equal(1);
			expect(docs[0].results[0].score).to.equal(80);
		});

		it('should find with $elemMatch on simple array', async function() {
			await db[collectionName].insert({ scores: [85, 90, 75] });
			await db[collectionName].insert({ scores: [60, 70, 65] });
			
			var docs = testFind({ scores: { $elemMatch: { $gte: 80, $lte: 90 }}});
			expect(docs.length).to.equal(1);
		});

		/************************************************************************
		 * Test $size operator
		 */
		it('should find with $size operator', async function() {
			await db[collectionName].insert({ items: ["a", "b", "c"] });
			await db[collectionName].insert({ items: ["x", "y"] });
			await db[collectionName].insert({ items: ["1"] });
			
			var docs = testFind({ items: { $size: 3 }});
			expect(docs.length).to.equal(1);
			expect(docs[0].items.length).to.equal(3);
		});

		it('should find with $size 0 for empty arrays', async function() {
			await db[collectionName].insert({ items: [] });
			await db[collectionName].insert({ items: ["a"] });
			
			var docs = testFind({ items: { $size: 0 }});
			expect(docs.length).to.equal(1);
			expect(docs[0].items.length).to.equal(0);
		});

		/************************************************************************
		 * Test $where operator with function
		 */
		it('should find with $where operator using function', async function() {
			await db[collectionName].insert({ price: 100, quantity: 5 });
			await db[collectionName].insert({ price: 50, quantity: 10 });
			await db[collectionName].insert({ price: 200, quantity: 2 });
			
			var docs = testFind({ $where: function() { return this.price * this.quantity > 400; }});
			expect(docs.length).to.equal(2);
		});

		it('should find with $where operator using string', async function() {
			await db[collectionName].insert({ value: 100 });
			await db[collectionName].insert({ value: 50 });
			
			var docs = testFind({ $where: "this.value > 75" });
			expect(docs.length).to.equal(1);
			expect(docs[0].value).to.equal(100);
		});

		/************************************************************************
		 * Test complex query combinations
		 */
		it('should combine $all with other operators', async function() {
			await db[collectionName].insert({ tags: ["a", "b", "c"], priority: 1 });
			await db[collectionName].insert({ tags: ["a", "b"], priority: 2 });
			await db[collectionName].insert({ tags: ["a", "b", "c"], priority: 3 });
			
			var docs = testFind({ 
				$and: [
					{ tags: { $all: ["a", "b"] }},
					{ priority: { $gte: 2 }}
				]
			});
			expect(docs.length).to.equal(2);
		});

		it('should combine $elemMatch with $or', async function() {
			await db[collectionName].insert({ 
				scores: [{ value: 90 }, { value: 80 }],
				status: "active"
			});
			await db[collectionName].insert({ 
				scores: [{ value: 70 }, { value: 60 }],
				status: "inactive"
			});
			
			var docs = testFind({ 
				$or: [
					{ scores: { $elemMatch: { value: { $gte: 85 }}}},
					{ status: "inactive" }
				]
			});
			expect(docs.length).to.equal(2);
		});
		
		/************************************************************************
		 * 
		 */
		it('should testFindDocument01', async function() {
		});
	
			/*
	
			> db.peep.find({age:54,legs:2},{age:1})
			{ "_id" : ObjectId("5695be6aadb5303f33363148"), "age" : 54 }
	
			> db.peep.find({age:54,legs:2},{age:0})
			{ "_id" : ObjectId("5695be6aadb5303f33363148"), "legs" : 2 }
	
			> db.peep.find({age:54,legs:2},{age:1,legs:0})
			Error: error: {
							"$err" : "Can't canonicalize query: BadValue Projection cannot have a mix of inclusion and exclusion.",
							"code" : 17287
			}
	
			> db.peep.find({age:54,legs:2},{age:1,_id:1})
			{ "_id" : ObjectId("5695be6aadb5303f33363148"), "age" : 54 }
	
			> db.peep.find({age:54,legs:2},{age:0,_id:0})
			{ "legs" : 2 }
	
	
			*/
			it('should testFind_Projection', async function() {

				function testInclusion(doc,id,age,legs) {
					if (!id != !doc._id) throw "id isn't correct";
					if (!age != !doc.age) throw "age isn't correct";
					if (!legs != !doc.legs) throw "legs isn't correct";
				}

				var q = { age:54, legs: 2 };
				if (db[collectionName].find(q).count()!=1) throw "should be 1 doc";
				testInclusion(db[collectionName].find(q,{age:1}).next(),true,true,false);
				testInclusion(db[collectionName].find(q,{age:0}).next(),true,false,true);
				try {
					db[collectionName].find(q,{age:1,legs:0});
					throw "should have raised exception";
				} catch (e) {
					if (e.code!=17287) throw "wrong error code";
					if (e.$err!="Can't canonicalize query: BadValue Projection cannot have a mix of inclusion and exclusion.") throw "wrong error message";
				}
				testInclusion(db[collectionName].find(q,{age:1,_id:1}).next(),true,true,false);
				testInclusion(db[collectionName].find(q,{age:0,_id:0}).next(),false,false,true);
				testInclusion(db[collectionName].find(q,{}).next(),true,true,true);	 
			});

			it('should testFindAndModify', async function() {
			});

			it('should testFindOne', async function() {
				var q = { age : { $gt:3, $lt:7 }};
				if (db[collectionName].find(q).count()!=2) throw "should be 2";
				if (!(await db[collectionName].findOne(q))) throw "should have found 1";
				if (db[collectionName].find().count()!=6) throw "db should have 6 docs";
			});

			it('should testFindOne_Projection', async function() {

				function testInclusion(doc,id,age,legs) {
					if (!id != !doc._id) throw "id isn't correct";
					if (!age != !doc.age) throw "age isn't correct";
					if (!legs != !doc.legs) throw "legs isn't correct";
				}

				var q = { age:54, legs: 2 };
				if (!(await db[collectionName].findOne(q))) throw "should be 1 doc";
				testInclusion(await db[collectionName].findOne(q,{age:1}),true,true,false);
				testInclusion(await db[collectionName].findOne(q,{age:0}),true,false,true);
				try {
					await db[collectionName].findOne(q,{age:1,legs:0});
					throw "should have raised exception";
				} catch (e) {
					if (e.code!=17287) throw "wrong error code";
					if (e.$err!="Can't canonicalize query: BadValue Projection cannot have a mix of inclusion and exclusion.") throw "wrong error message";
				}
				testInclusion(await db[collectionName].findOne(q,{age:1,_id:1}),true,true,false);
				testInclusion(await db[collectionName].findOne(q,{age:0,_id:0}),false,false,true);
				testInclusion(await db[collectionName].findOne(q,{}),true,true,true);	 

			});

			it('should testFindOneAndDelete', async function() {
				if (db[collectionName].find().count()!=6) throw "fail";
				if (db[collectionName].find({age:54}).count()!=2) throw "need 2";
				var doc = await db[collectionName].findOneAndDelete({age:54});
				if (!doc) throw "didn't return deleted doc";
				if (db[collectionName].find().count()!=5) throw "fail";
			});

			it('should testFindOneAndDelete_NotFound', async function() {
				if (db[collectionName].find().count()!=6) throw "fail";
				if (db[collectionName].find({age:74}).count()!=0) throw "need 0";
				var doc = await db[collectionName].findOneAndDelete({age:74});
				if (doc) throw "shouldn't have found anything to delete";
				if (db[collectionName].find().count()!=6) throw "fail";
			});

			it('should testFindOneAndDelete_Sort', async function() {
				if (db[collectionName].find().count()!=6) throw "fail";
				if (db[collectionName].find({age:54}).count()!=2) throw "need 2";
				var first = await db[collectionName].findOne({age:54});

				var doc = await db[collectionName].findOneAndDelete({age:54});
				if (!doc) throw "should have found something to delete";
				if (db[collectionName].find().count()!=5) throw "fail";
				if (doc._id!=first._id) throw "shoudl have deleted the first doc";

				await reset();
				
				var doc = await db[collectionName].findOneAndDelete({age:54},{ sort : { legs :1 }});
				if (!doc) throw "should have found something to delete";
				if (db[collectionName].find().count()!=5) throw "fail";
				if (doc._id==first._id) throw "shouldnt have deleted the first doc";
			 
			});

			it('should testFindOneAndDelete_Projection', async function() {
				if (db[collectionName].find({age:54}).count()!=2) throw "need 2";
				var first = await db[collectionName].findOneAndDelete({age:54},{ projection : { _id: 0, legs: 0}});
				if (!first.age) throw "age should be in projection";
				if (first._id) throw "age shouldn't be included";
				if (first.legs) throw "legs shouldn't be included";
			});

			it('should testFindOneAndReplace', async function() {
				if (await db[collectionName].findOne({age:76,legs:17})) throw "this shouldn't exist yet";
				var orig = await db[collectionName].findOne({age:54});
				if (db[collectionName].find({age:54}).count()!=2) throw "there should be 2";
				var replaced = await db[collectionName].findOneAndReplace({age:54},{age:76,legs:17});
				if (orig._id!=replaced._id) throw "replaced doc incorrect";
				if (!(await db[collectionName].findOne({age:76,legs:17}))) throw "this doc should exist now";
				if (db[collectionName].find({age:54}).count()!=1) throw "there should only be one now";
			});

			it('should testFindOneAndReplace_NotFound', async function() {
				if (await db[collectionName].findOne({age:76,legs:17})) throw "this shouldn't exist";
				if (await db[collectionName].findOneAndReplace({age:76,legs:17},{})) throw "nothing should have been found to replace";
			});

			it('should testFindOneAndReplace_Projection', async function() {
				var replaced = await db[collectionName].findOneAndReplace({age:54},{age:76,legs:17}, { projection : {age:0}});
				if (replaced.age) throw "age should not be in projected result";
			});

			it('should testFindOneAndReplace_Sort', async function() {
				var unsorted = await db[collectionName].findOne({age:54});
				var sortOrder = 1;
				var sorted = db[collectionName].find({age:54}).sort({legs:sortOrder}).next();
				if (unsorted._id==sorted._id) {
					sortOrder = -1;
					sorted = db[collectionName].find({age:54}).sort({legs:sortOrder}).next();
					if (unsorted._id==sorted._id) throw "sorting should have returned a different doc";
				}
				var unsortedReplaced = await db[collectionName].findOneAndReplace({age:54},{age:76,legs:17});
				if (unsortedReplaced._id!=unsorted._id) throw "replaced incorrect doc when not sorting";
				var sortedReplaced = await db[collectionName].findOneAndReplace({age:54},{age:76,legs:17}, { sort : {legs:sortOrder}});
				if (sortedReplaced._id!=sorted._id) throw "replaced incorrect doc when sorting";
			});

			it('should testFindOneAndReplace_ReturnNewDocument', async function() {
				var orig = await db[collectionName].findOne({age:54});
				var replaced = await db[collectionName].findOneAndReplace({age:54},{age:76,legs:17},{returnNewDocument: false});
				if (orig._id!=replaced._id) throw "should have the returned the doc being replaced";
				var newDoc = await db[collectionName].findOne({age:76,legs:17});
				var replacement = await db[collectionName].findOneAndReplace({age:76,legs:17},{age:16,legs:47},{returnNewDocument: true});
				if (!replacement._id) throw "id should have been set";
				if (newDoc._id!=replacement._id) throw "the replacement/new doc should have the same id as the one replaced";
				if (replacement.age!=16) throw "doesn't appear to be the new doc (age)";
				if (replacement.legs!=47) throw "doesn't appear to be the new doc (legs)";
			});

			it('should testFindOneAndUpdate', async function() {
				var orig = await db[collectionName].findOne({age:54});
				var original = await db[collectionName].findOneAndUpdate({age:54},{ $inc : { age:2 }});
				if (orig._id!=original._id) throw "orig and original id's should be teh same";
				var updated = await db[collectionName].findOne({_id:original._id});
				if (updated._id!=orig._id) throw "doesn't appear to be teh same doc";
				if (orig.legs!=updated.legs) throw "legs should be the same";
				if (updated.age!=56) throw "age should ahve been incremented by 2";		
			});

			it('should testFindOneAndUpdate_NotFound', async function() {
				if (await db[collectionName].findOne({age:79})) throw "this shouldn't exist";
				if (await db[collectionName].findOneAndUpdate({age:79},{ $inc : { age:2 }})) throw "should return null";
			});

			it('should testFindOneAndUpdate_Projection', async function() {
				var original = await db[collectionName].findOneAndUpdate({age:54},{ $inc : { age:2 }},{ projection: { _id:0,legs:0 }});
				if (original._id) throw "_id shouldn't be in projection";		
				if (original.legs) throw "legs shouldn't be in projection";		
				if (!original.age) throw "age should be in projection";
				if (original.age!=54) throw "age should be 54 as per the original";
				var updated = await db[collectionName].findOneAndUpdate({age:56},{ $inc : { age:2 }},{ projection: { _id:0,legs:0 },returnNewDocument: true});
				if (updated._id) throw "_id shouldn't be in projection";		
				if (updated.legs) throw "legs shouldn't be in projection";		
				if (!updated.age) throw "age should be in projection";
				if (updated.age!=58) throw "age should be 58 after updates";
			});

			it('should testFindOneAndUpdate_Sort', async function() {
				var unsorted = await db[collectionName].findOne({age:54});
				var sortOrder = 1;
				var sorted = db[collectionName].find({age:54}).sort({legs:sortOrder}).next();
				if (unsorted._id==sorted._id) {
					sortOrder = -1;
					sorted = db[collectionName].find({age:54}).sort({legs:sortOrder}).next();
					if (unsorted._id==sorted._id) throw "sorting should have returned a different doc";
				}
				var unsortedUpdated = await db[collectionName].findOneAndUpdate({age:54},{ $inc : { age:2 }});
				if (unsortedUpdated._id!=unsorted._id) throw "updated incorrect doc when not sorting";
				var sortedUpdated = await db[collectionName].findOneAndUpdate({age:54},{ $inc : { age:2 }}, { sort : {legs:sortOrder}});
				if (sortedUpdated._id!=sorted._id) throw "updated incorrect doc when sorting";
			});

			it('should testFindOneAndUpdate_ReturnNewDocument', async function() {
				var orig = await db[collectionName].findOneAndUpdate({age:54},{ $inc : { age:2 }});
				if (orig.age!=54) throw "should have returned original";
				var orig2 = await db[collectionName].findOneAndUpdate({age:56},{ $inc : { age:2 }},{ returnNewDocument: false});
				if (orig2.age!=56) throw "should have returned original";
				var updated = await db[collectionName].findOneAndUpdate({age:58},{ $inc : { age:2 }},{ returnNewDocument: true});
				if (updated.age!=60) throw "should have returned updated";
			});

			it('should testGroup', async function() {
			});

			it('should testInsert', async function() {
				if (db[collectionName].find().count()!=6) throw "insert doesn't seem to be working in reset()";
			});

			it('should testInsertOne', async function() {
				if (db[collectionName].find().count()!=6) throw "insert doesn't seem to be working in reset()";
			});

			it('should testInsertMany', async function() {
				if (db[collectionName].find().count()!=6) throw "insert doesn't seem to be working in reset()";
			});

			it('should testMapReduce', async function() {
			});

			it('should testReplaceOne', async function() {
				if (db[collectionName].find({age:54}).count()!=2) throw "should be 2 docs";
				var result = await db[collectionName].replaceOne({age:54},{ cars : 3 });
				if (result.matchedCount!=2) throw "should have matched 2 documents";
				if (result.modifiedCount!=1) throw "should have replaced 1 document";
				var replaced = await db[collectionName].findOne({cars:3});
				if (replaced.cars!=3) throw "doc doesn't look like replacement";
			});

			it('should testReplaceOne_NotFound', async function() {
				if (db[collectionName].find({age:57}).count()!=0) throw "should be no docs";
				var result = await db[collectionName].replaceOne({age:57},{ cars : 3 });
				if (result.matchedCount!=0) throw "should have matched 0 documents";
				if (result.modifiedCount!=0) throw "should have replaced 0 document";
			});

			it('should testReplaceOne_Upsert', async function() {
				if (db[collectionName].find({age:57}).count()!=0) throw "should be no docs";
				var result = await db[collectionName].replaceOne({age:57},{ cars : 3 },{upsert: true});
				if (result.matchedCount!=0) throw "should have matched 0 documents";
				if (result.modifiedCount!=0) throw "should have replaced 0 documents";
				if (!result.upsertedId) throw "should have created new document";
				var newDoc = await db[collectionName].findOne({_id:result.upsertedId});
				if (newDoc.cars!=3) throw "new doc doesn't look like replaced doc";
			});

			it('should testRemove', async function() {
				if (db[collectionName].find({age:54}).count()!=2) throw "should be 2 docs";
				db[collectionName].remove({age:54});
				if (db[collectionName].find({age:54}).count()!=0) throw "should be no docs";			 
			});

			it('should testRemove_JustOneTrue', async function() {
				if (db[collectionName].find({age:54}).count()!=2) throw "should be 2 docs";
				db[collectionName].remove({age:54},true);
				if (db[collectionName].find({age:54}).count()!=1) throw "should be 1 doc";
			});

			it('should testRemove_JustOneFalse', async function() {
				if (db[collectionName].find({age:54}).count()!=2) throw "should be 2 docs";
				db[collectionName].remove({age:54},false);
				if (db[collectionName].find({age:54}).count()!=0) throw "should be no docs";
			});

			it('should testRemove_JustOneDocTrue', async function() {
				if (db[collectionName].find({age:54}).count()!=2) throw "should be 2 docs";
				db[collectionName].remove({age:54},{ justOne : true } );
				if (db[collectionName].find({age:54}).count()!=1) throw "should be 1 doc";
			});

			it('should testRemove_JustOneDocFalse', async function() {
				if (db[collectionName].find({age:54}).count()!=2) throw "should be 2 docs";
				db[collectionName].remove({age:54},{ justOne : false } );
				if (db[collectionName].find({age:54}).count()!=0) throw "should be no docs";
			});

			it('should testUpdate', async function() {
				if (db[collectionName].find({age:54}).count()!=2) throw "should be 2 docs to start with";
				db[collectionName].update({age:54},{ $inc : { age:2 }});
				if (db[collectionName].find({age:54}).count()!=1) throw "one doc should have been updated from 54";
				if (db[collectionName].find({age:56}).count()!=1) throw "one doc should have been updated to 56";
			});

			it('should testUpdate_Op_Inc', async function() {
				var orig = await db[collectionName].findOne({legs:12});
				db[collectionName].update({legs:12},{ $inc : { age:2, legs:2 }});
				var updated = await db[collectionName].findOne({_id:orig._id});
				if (orig._id!=updated._id) throw "couldn't find updated doc";
				if (updated.age!=56) throw "age didn't get updated";
				if (updated.legs!=14) throw "legs didn't get updated";
			});

			it('should testUpdate_Op_Mul', async function() {
				var orig = await db[collectionName].findOne({legs:12});
				db[collectionName].update({legs:12},{ $mul : { age:2, legs:2 }});
				var updated = await db[collectionName].findOne({_id:orig._id});
				if (orig._id!=updated._id) throw "couldn't find updated doc";
				if (updated.age!=(54*2)) throw "age didn't get updated";
				if (updated.legs!=(12*2)) throw "legs didn't get updated";
			});

			it('should testUpdate_Op_Rename', async function() {
				var orig = await db[collectionName].findOne({legs:12});
				db[collectionName].update({legs:12},{ $rename : { age:"cats", legs:"dogs" }});
				var updated = await db[collectionName].findOne({_id:orig._id});
				if (orig._id!=updated._id) throw "couldn't find updated doc";
				if (updated.age) throw "age shouldnt exist";
				if (updated.legs) throw "legs shouldnt exist";
				if (updated.cats!=54) throw "cats should have value of age";
				if (updated.dogs!=12) throw "dogs should have value of legs";
			});

			it('should testUpdate_Op_SetOnInsert', async function() {
				if (db[collectionName].find({age:57}).count()!=0) throw "should be no docs to start with";
				db[collectionName].update({age:57},{ $setOnInsert: { dogs: 2, cats: 3}},{upsert:true});
				if (db[collectionName].find({dogs:2,cats:3}).count()!=1) throw "one doc should have been created";
			});

			it('should testUpdate_Op_Set', async function() {
				if (db[collectionName].find({age:54}).count()!=2) throw "should be 2 docs to start with";
				if (db[collectionName].find({age:54,dogs:2,cats:3}).count()!=0) throw "should be no docs";
				await db[collectionName].updateMany({age:54},{ $set: { dogs: 2, cats: 3}});
				if (db[collectionName].find({age:54,dogs:2,cats:3}).count()!=2) throw "should be 2 docs";
			});

			it('should testUpdate_Op_Unset', async function() {
				if (db[collectionName].find({age:54}).count()!=2) throw "should be 2 docs to start with";
				await db[collectionName].updateMany({age:54},{ $unset: { age: 2}});
				if (db[collectionName].find({age:54}).count()!=0) throw "no docs should be returned";
			});

			it('should testUpdate_Op_Min', async function() {
				if (db[collectionName].find({legs:10}).count()!=0) throw "should be no docs to start with";
				await db[collectionName].updateMany({legs:12},{ $min: { legs: 10}});
				if (db[collectionName].find({legs:10}).count()!=1) throw "should have been udpated";
			});

			it('should testUpdate_Op_Max', async function() {
				if (db[collectionName].find({legs:24}).count()!=0) throw "should be no docs to start with";
				await db[collectionName].updateMany({legs:12},{ $max: { legs: 24}});
				if (db[collectionName].find({legs:24}).count()!=1) throw "should have been udpated";
			});

			it('should testUpdate_Op_CurrentDate', async function() {
				if (db[collectionName].find({legs:12}).count()!=1) throw "should be 1 doc to start with";
				await db[collectionName].updateMany({legs:12},{ $currentDate: { now: 24}});
				var doc = await db[collectionName].findOne({legs:12});
				if (!doc.now) throw "now should have been set to date";
			});

			it('should testUpdate_Op_AddToSet', async function() {
				await db[collectionName].insert({ me: 7, nums: [3] });
				var orig = await db[collectionName].findOne({me:7});
				if (orig.nums.length!=1) throw "array of length 1 should exist";
				db[collectionName].update({me:7},{ $addToSet : { nums : [4,5] }});
				var updated = await db[collectionName].findOne({me:7});
				if (updated.nums.length!=2) throw "array of length 2 should exist";
				if (updated.nums[1].length!=2) throw "array of length 2 should exist";
			});

			it('should testUpdate_Op_Pop', async function() {
				await db[collectionName].insert({ me: 7, nums: [1,2,3,4,5,6] });
				db[collectionName].update({me:7},{ $pop : {nums:1} });
				var doc = await db[collectionName].findOne({me:7});
				if (doc.nums.length!=5) throw "incorrect length";
				if (doc.nums[0]!=1) throw "first element should be 1";
				if (doc.nums[doc.nums.length-1]!=5) throw "last element should be 5";
				db[collectionName].update({me:7},{ $pop : {nums:-1} });
				var doc = await db[collectionName].findOne({me:7});
				if (doc.nums.length!=4) throw "incorrect length";
				if (doc.nums[0]!=2) throw "first element should be 2";
				if (doc.nums[doc.nums.length-1]!=5) throw "last element should be 5";
			});

			it('should testUpdate_Op_PullAll', async function() {
				await db[collectionName].insert({ me: 7, nums: [3,5,2,3,4,5,2,5] });
				db[collectionName].update({me:7},{ $pullAll : {nums:[3,5]} });
				var doc = await db[collectionName].findOne({me:7});	// nums = [2,4,2]
				if (doc.nums.length!=3) throw "incorrect length";
				if (doc.nums[0]!=2) throw "[0] element should be 2";
				if (doc.nums[1]!=4) throw "[1] element should be 4";
				if (doc.nums[2]!=2) throw "[2] element should be 2";
			});

			it('should testUpdate_Op_Pull', async function() {
			});

			it('should testUpdate_Op_PushAll', async function() {
				await db[collectionName].insert({ me: 7, nums: [3] });
				db[collectionName].update({me:7},{ $pushAll : {nums:[4,5]} });
				var doc = await db[collectionName].findOne({me:7});
				if (doc.nums.length!=3) throw "incorrect length";
				if (doc.nums[0]!=3) throw "[0] element should be 3";
				if (doc.nums[1]!=4) throw "[1] element should be 4";
				if (doc.nums[2]!=5) throw "[2] element should be 5";
			});

			it('should testUpdate_Op_Push', async function() {
				await db[collectionName].insert({ me: 7, nums: [3] });
				db[collectionName].update({me:7},{ $push : {nums:4} });
				var doc = await db[collectionName].findOne({me:7});
				if (doc.nums.length!=2) throw "incorrect length";
				if (doc.nums[0]!=3) throw "[0] element should be 3";
				if (doc.nums[1]!=4) throw "[1] element should be 4";
			});

			it('should testUpdate_Op_Each', async function() {
			});

			it('should testUpdate_Op_Slice', async function() {
			});

			it('should testUpdate_Op_Sort', async function() {
			});

			it('should testUpdate_Op_Position', async function() {
			});

			it('should testUpdate_Op_Bit', async function() {
				await db[collectionName].insert({ me: 7, val : 4 });
				db[collectionName].update({me:7},{$bit:{val: {or:3}}});
				var doc = await db[collectionName].findOne({me:7});
				if (doc.val!=7) throw "4 or 3 = 7";
				db[collectionName].update({me:7},{$bit:{val: {and:14}}});
				var doc = await db[collectionName].findOne({me:7});
				if (doc.val!=6) throw "7 and 14 = 6";
				db[collectionName].update({me:7},{$bit:{val: {xor:10}}});
				var doc = await db[collectionName].findOne({me:7});
				if (doc.val!=12) throw "6 xor 10 = 12";
			});

			it('should testUpdate_Op_Isolated', async function() {
			});

			it('should testUpdate_Multi', async function() {
				if (db[collectionName].find({age:54}).count()!=2) throw "should be 2 docs to start with";
				db[collectionName].update({age:54},{ $inc : { age:2 }},{multi:true});
				if (db[collectionName].find({age:54}).count()!=0) throw "all docs should have been updated from 54";
				if (db[collectionName].find({age:56}).count()!=2) throw "all docs should have been updated to 56";
			});

			it('should testUpdate_Upsert', async function() {
				if (db[collectionName].find({age:57}).count()!=0) throw "should be no docs to start with";
				db[collectionName].update({age:57},{ $inc : { age:2 }},{upsert:true});
				if (db[collectionName].find({age:59}).count()!=1) throw "one doc should have been created with age:59";
			});

			it('should testUpdateOne', async function() {
				if (db[collectionName].find({age:54}).count()!=2) throw "should be 2 docs to start with";
				await db[collectionName].updateOne({age:54},{ $inc : { age:2 }});
				if (db[collectionName].find({age:54}).count()!=1) throw "one doc should have been updated from 54";
				if (db[collectionName].find({age:56}).count()!=1) throw "one doc should have been updated to 56";
			});
	
			it('should testUpdateOne_Upsert', async function() {
				if (db[collectionName].find({age:57}).count()!=0) throw "should be no docs to start with";
				await db[collectionName].updateOne({age:57},{ $inc : { age:2 }},{ upsert: true});
				if (db[collectionName].find({age:59}).count()!=1) throw "new doc should have been created with age:59";
			});

			it('should testUpdateMany', async function() {
				if (db[collectionName].find({age:54}).count()!=2) throw "should be 2 docs to start with";
				await db[collectionName].updateMany({age:54},{ $inc : { age:2 }});
				if (db[collectionName].find({age:54}).count()!=0) throw "these docs should have been updated from 54";
				if (db[collectionName].find({age:56}).count()!=2) throw "these docs should have been updated to 56";
			});

			it('should testUpdateMany_Upsert', async function() {
				if (db[collectionName].find({age:57}).count()!=0) throw "should be no docs to start with";
				await db[collectionName].updateMany({age:57},{ $inc : { age:2 }},{ upsert: true});
				if (db[collectionName].find({age:59}).count()!=1) throw "new doc should have been created with age:59";
			});

			/************************************************************************
			 * Aggregation Pipeline Tests
			 */
			describe('Aggregation', function() {
				
				it('should aggregate with $match stage', async function() {
					var results = db[collectionName].aggregate([
						{ $match: { age: { $gte: 16 }}}
					]);
					expect(results.length).to.equal(3);
				});

				it('should aggregate with $project stage', async function() {
					var results = db[collectionName].aggregate([
						{ $match: { age: 54 }},
						{ $project: { age: 1 }}
					]);
					expect(results.length).to.equal(2);
					expect(results[0].age).to.equal(54);
					expect(results[0].legs).to.be.undefined;
				});

				it('should aggregate with $sort stage', async function() {
					var results = db[collectionName].aggregate([
						{ $match: { age: { $exists: true }}},
						{ $sort: { age: 1 }}
					]);
					expect(results[0].age).to.equal(4);
					expect(results[results.length - 1].age).to.equal(54);
				});

				it('should aggregate with $limit stage', async function() {
					var results = db[collectionName].aggregate([
						{ $match: {}},
						{ $limit: 3 }
					]);
					expect(results.length).to.equal(3);
				});

				it('should aggregate with $skip stage', async function() {
					var results = db[collectionName].aggregate([
						{ $match: {}},
						{ $sort: { age: 1 }},
						{ $skip: 2 }
					]);
					expect(results.length).to.equal(4);
				});

				it('should aggregate with $group and $sum', async function() {
					var results = db[collectionName].aggregate([
						{ $group: { 
							_id: "$age", 
							count: { $sum: 1 },
							totalLegs: { $sum: "$legs" }
						}}
					]);
					// Find the group with age 54
					var group54 = results.find(r => r._id === 54);
					expect(group54).to.not.be.undefined;
					expect(group54.count).to.equal(2);
				});

				it('should aggregate with $group and $avg', async function() {
					await db[collectionName].insert({ category: "A", value: 10 });
					await db[collectionName].insert({ category: "A", value: 20 });
					await db[collectionName].insert({ category: "B", value: 30 });
					
					var results = db[collectionName].aggregate([
						{ $match: { category: { $exists: true }}},
						{ $group: { 
							_id: "$category", 
							avgValue: { $avg: "$value" }
						}}
					]);
					var groupA = results.find(r => r._id === "A");
					expect(groupA.avgValue).to.equal(15);
				});

				it('should aggregate with $group and $min/$max', async function() {
					await db[collectionName].insert({ type: "test", score: 85 });
					await db[collectionName].insert({ type: "test", score: 92 });
					await db[collectionName].insert({ type: "test", score: 78 });
					
					var results = db[collectionName].aggregate([
						{ $match: { type: "test" }},
						{ $group: { 
							_id: "$type", 
							minScore: { $min: "$score" },
							maxScore: { $max: "$score" }
						}}
					]);
					expect(results[0].minScore).to.equal(78);
					expect(results[0].maxScore).to.equal(92);
				});

				it('should aggregate with $group and $push', async function() {
					await db[collectionName].insert({ team: "A", player: "Alice" });
					await db[collectionName].insert({ team: "A", player: "Bob" });
					await db[collectionName].insert({ team: "B", player: "Charlie" });
					
					var results = db[collectionName].aggregate([
						{ $match: { team: { $exists: true }}},
						{ $group: { 
							_id: "$team", 
							players: { $push: "$player" }
						}}
					]);
					var teamA = results.find(r => r._id === "A");
					expect(teamA.players.length).to.equal(2);
					expect(teamA.players).to.include("Alice");
					expect(teamA.players).to.include("Bob");
				});

				it('should aggregate with $group and $addToSet', async function() {
					await db[collectionName].insert({ dept: "IT", skill: "JavaScript" });
					await db[collectionName].insert({ dept: "IT", skill: "Python" });
					await db[collectionName].insert({ dept: "IT", skill: "JavaScript" });
					
					var results = db[collectionName].aggregate([
						{ $match: { dept: "IT" }},
						{ $group: { 
							_id: "$dept", 
							skills: { $addToSet: "$skill" }
						}}
					]);
					expect(results[0].skills.length).to.equal(2);
				});

				it('should aggregate with $group and $first/$last', async function() {
					await db[collectionName].insert({ order: 1, value: "first" });
					await db[collectionName].insert({ order: 2, value: "second" });
					await db[collectionName].insert({ order: 3, value: "third" });
					
					var results = db[collectionName].aggregate([
						{ $match: { order: { $exists: true }}},
						{ $sort: { order: 1 }},
						{ $group: { 
							_id: null, 
							firstValue: { $first: "$value" },
							lastValue: { $last: "$value" }
						}}
					]);
					expect(results[0].firstValue).to.equal("first");
					expect(results[0].lastValue).to.equal("third");
				});

				it('should aggregate with $count stage', async function() {
					var results = db[collectionName].aggregate([
						{ $match: { age: { $gte: 16 }}},
						{ $count: "total" }
					]);
					expect(results.length).to.equal(1);
					expect(results[0].total).to.equal(3);
				});

				it('should aggregate with $unwind stage', async function() {
					await db[collectionName].insert({ name: "Product1", tags: ["a", "b", "c"] });
					
					var results = db[collectionName].aggregate([
						{ $match: { name: "Product1" }},
						{ $unwind: "$tags" }
					]);
					expect(results.length).to.equal(3);
					expect(results[0].tags).to.equal("a");
					expect(results[1].tags).to.equal("b");
					expect(results[2].tags).to.equal("c");
				});

				it('should aggregate with multiple stages combined', async function() {
					await db[collectionName].insert({ category: "X", price: 100, quantity: 2 });
					await db[collectionName].insert({ category: "X", price: 50, quantity: 5 });
					await db[collectionName].insert({ category: "Y", price: 200, quantity: 1 });
					
					var results = db[collectionName].aggregate([
						{ $match: { category: { $exists: true }}},
						{ $group: { 
							_id: "$category", 
							count: { $sum: 1 },
							avgPrice: { $avg: "$price" }
						}},
						{ $sort: { avgPrice: -1 }},
						{ $limit: 2 }
					]);
					expect(results.length).to.be.lte(2);
					expect(results[0]._id).to.equal("Y");
				});

				it('should handle empty pipeline', async function() {
					var results = db[collectionName].aggregate([]);
					expect(results.length).to.equal(6); // Original docs
				});
			});
			
			describe('Cursor', function() {

			it('should testCount', async function() {
				var c = db[collectionName].find();
				if (c.count()!=6) throw "incorrect count";
				while (c.hasNext()) {
					c.next();
					if (c.count()!=6) throw "incorrect count";
				}
			});
				
			it('should testForEach', async function() {
				var numLegs = 0;
				var numDocs = 0;
				await db[collectionName].find().forEach(function(doc) {
					numDocs++;
					if (doc.legs) numLegs += doc.legs;
				});
				if (numDocs!=6) throw "total number of docs != 6";
				if (numLegs!=19) throw "total number of legs != 19";
			});

			it('should testHasNext', async function() {
				var c = db[collectionName].find();
				while (c.hasNext()) {
					c.next();
				}
			});

			it('should testLimit', async function() {
				var count = 0;
				var c = db[collectionName].find().limit(3);
				while (c.hasNext()) {
					c.next();
					count++;
				}
				if (count!=3) throw "should only have max 3 when limited";
			});

			it('should testMap', async function() {
				var i = 0;
				var numDocs = 0;
				var result = db[collectionName].find().map(function(doc) {
					return i++;
				});
				if (result.length!=6) throw "result should have entry for each doc";
				if (result[2]!=2) throw "result array not correct";
			});

			it('should testNext', async function() {
				var c = db[collectionName].find();
				while (c.hasNext()) {
					c.next();
				}
			});

			it('should testSkip', async function() {
				var count = 0;
				var c = db[collectionName].find().skip(3);
				while (c.hasNext()) {
					c.next();
					count++;
				}
				if (count!=3) throw "should have skipped 3 and return 3";
			});

			it('should testSort', async function() {
				var prev = 0;
				var c = db[collectionName].find({legs:{$gt:1}}).sort({legs:1});
				while (c.hasNext()) {
					var curr = c.next().legs;
					if (curr<prev) throw "should be >= than previous";
					prev = curr;
				}
				prev = 1000;
				var c = db[collectionName].find({legs:{$gt:1}}).sort({legs:-1});
				while (c.hasNext()) {
					var curr = c.next().legs;
					if (curr>prev) throw "should be <= than previous";
					prev = curr;
				}
			});

			it('should testToArray', async function() {
				var c = db[collectionName].find();
				c.next();
				c.next();
				var arr = await c.toArray();
				if (arr.length!=4) throw "should be 4 elements in results array";
			});

			it('should testSortCount', async function() {
				var c = db[collectionName].find().sort({legs:1});
				if (c.count()!=6) throw "incorrect count";
				while (c.hasNext()) {
					c.next();
					if (c.count()!=6) throw "incorrect count";
				}
			});

			it('should testSortForEach', async function() {
				var numLegs = 0;
				var numDocs = 0;
				await db[collectionName].find().sort({legs:-1}).forEach(function(doc) {
					numDocs++;
					if (doc.legs) numLegs += doc.legs;
				});
				if (numDocs!=6) throw "total number of docs != 6";
				if (numLegs!=19) throw "total number of legs != 19"; 
			});
				
			it('should testSortHasNext', async function() {
				var c = db[collectionName].find().sort({legs:1});
				while (c.hasNext()) {
					c.next();
				}
			});

			it('should testSortLimit', async function() {
				var count = 0;
				var c = db[collectionName].find().sort({legs:1}).limit(3);
				while (c.hasNext()) {
					c.next();
					count++;
				}
				if (count!=3) throw "should only have max 3 when limited";
			});
				
			it('should testSortMap', async function() {
				var i = 0;
				var numDocs = 0;
				var result = db[collectionName].find().sort({legs:1}).map(function(doc) {
					return i++;
				});
				if (result.length!=6) throw "result should have entry for each doc";
				if (result[2]!=2) throw "result array not correct";
			});
				
			it('should testSortNext', async function() {
				var c = db[collectionName].find().sort({legs:1});
				while (c.hasNext()) {
					c.next();
				}
			});
				
			it('should testSortSkip', async function() {
				var count = 0;
				var c = db[collectionName].find().sort({legs:1}).skip(3);
				while (c.hasNext()) {
					c.next();
					count++;
				}
				if (count!=3) throw "should have skipped 3 and return 3";
			});

			it('should testSortSort', async function() {
				var prev = 0;
				var c = db[collectionName].find({legs:{$gt:1}}).sort({legs:-1}).sort({legs:1});
				while (c.hasNext()) {
					var curr = c.next().legs;
					if (curr<prev) throw "should be >= than previous";
					prev = curr;
				}
				prev = 1000;
				var c = db[collectionName].find({legs:{$gt:1}}).sort({legs:1}).sort({legs:-1});
				while (c.hasNext()) {
					var curr = c.next().legs;
					if (curr>prev) throw "should be <= than previous";
					prev = curr;
				}
			});

			it('should testSortToArray', async function() {
				var c = db[collectionName].find().sort({legs:1});
				c.next();
				c.next();
				var arr = await c.toArray();
				if (arr.length!=4) throw "should be 4 elements in results array";
			});
		});

		describe("Indexes", function() {
			
			it('should create a single-field index', async function() {
				var indexName = await db[collectionName].createIndex({ age: 1 });
				expect(indexName).to.equal('age_1');
				var indexes = db[collectionName].getIndexes();
				expect(indexes.length).to.equal(1);
				expect(indexes[0].name).to.equal('age_1');
				expect(indexes[0].key).to.deep.equal({ age: 1 });
			});

			it('should create a named index', async function() {
				var indexName = await db[collectionName].createIndex({ legs: 1 }, { name: 'legs_index' });
				expect(indexName).to.equal('legs_index');
				var indexes = db[collectionName].getIndexes();
				expect(indexes.length).to.equal(1);
				expect(indexes[0].name).to.equal('legs_index');
			});

			it('should create multiple indexes', async function() {
				await db[collectionName].createIndex({ age: 1 });
				await db[collectionName].createIndex({ legs: -1 });
				var indexes = db[collectionName].getIndexes();
				expect(indexes.length).to.equal(2);
			});

			it('should not create duplicate index', async function() {
				await db[collectionName].createIndex({ age: 1 });
				await db[collectionName].createIndex({ age: 1 });
				var indexes = db[collectionName].getIndexes();
				expect(indexes.length).to.equal(1);
			});

			it('should throw error when creating index with conflicting name', async function() {
				await db[collectionName].createIndex({ age: 1 }, { name: 'my_index' });
				try {
					await db[collectionName].createIndex({ legs: 1 }, { name: 'my_index' });
					throw new Error('Should have thrown an error');
				} catch(e) {
					expect(e.code).to.equal(85);
				}
			});

			it('should throw error when keys is an array', async function() {
				try {
					await db[collectionName].createIndex([{ age: 1 }]);
					throw new Error('Should have thrown an error');
				} catch(e) {
					expect(e.code).to.equal(2);
				}
			});

			it('should use index for simple equality query', async function() {
				// Create index on age field
				await db[collectionName].createIndex({ age: 1 });
				
				// Query using indexed field
				var results = await db[collectionName].find({ age: 54 }).toArray();
				expect(results.length).to.equal(2);
				
				// Verify we got the right documents
				results.forEach(function(doc) {
					expect(doc.age).to.equal(54);
				});
			});

			it('should still work with non-indexed queries', async function() {
				// Create index on age field
				await db[collectionName].createIndex({ age: 1 });
				
				// Query using non-indexed field
				var results = await db[collectionName].find({ legs: 5 }).toArray();
				expect(results.length).to.equal(1);
				expect(results[0].legs).to.equal(5);
			});

			it('should maintain index on insert', async function() {
				await db[collectionName].createIndex({ age: 1 });
				
				// Insert a new document
				await db[collectionName].insertOne({ age: 25, legs: 2 });
				
				// Query should find the new document
				var results = await db[collectionName].find({ age: 25 }).toArray();
				expect(results.length).to.equal(1);
				expect(results[0].age).to.equal(25);
			});

			it('should maintain index on delete', async function() {
				await db[collectionName].createIndex({ age: 1 });
				
				// Delete documents with age 54
				var deleteResult = await db[collectionName].deleteMany({ age: 54 });
				expect(deleteResult.deletedCount).to.equal(2);
				
				// Query should not find deleted documents
				var results = await db[collectionName].find({ age: 54 }).toArray();
				expect(results.length).to.equal(0);
			});

			it('should handle complex queries with index', async function() {
				await db[collectionName].createIndex({ age: 1 });
				
				// Complex query with indexed and non-indexed fields
				var results = await db[collectionName].find({ age: 4, legs: 5 }).toArray();
				expect(results.length).to.equal(1);
				expect(results[0].age).to.equal(4);
				expect(results[0].legs).to.equal(5);
			});

			it('should handle queries with operators on indexed fields', async function() {
				await db[collectionName].createIndex({ age: 1 });
				
				// Query with operators falls back to full scan
				var results = await db[collectionName].find({ age: { $gt: 50 } }).toArray();
				expect(results.length).to.equal(2);
			});

			it('should create compound index', async function() {
				var indexName = await db[collectionName].createIndex({ age: 1, legs: 1 });
				expect(indexName).to.equal('age_1_legs_1');
				
				var indexes = db[collectionName].getIndexes();
				expect(indexes.length).to.equal(1);
				expect(indexes[0].key).to.deep.equal({ age: 1, legs: 1 });
			});

			it('should handle empty result set with index', async function() {
				await db[collectionName].createIndex({ age: 1 });
				
				// Query for non-existent value
				var results = await db[collectionName].find({ age: 999 }).toArray();
				expect(results.length).to.equal(0);
			});

			it('should maintain index on update', async function() {
				await db[collectionName].createIndex({ age: 1 });
				
				// Update a document's age
				await db[collectionName].updateOne({ age: 54 }, { $set: { age: 55 } });
				
				// Old value should not be found
				var oldResults = await db[collectionName].find({ age: 54 }).toArray();
				expect(oldResults.length).to.equal(1); // Only one doc with age 54 left
				
				// New value should be found
				var newResults = await db[collectionName].find({ age: 55 }).toArray();
				expect(newResults.length).to.equal(1);
				expect(newResults[0].age).to.equal(55);
			});

			it('should maintain index on replaceOne', async function() {
				await db[collectionName].createIndex({ age: 1 });
				
				// Replace a document
				await db[collectionName].replaceOne({ age: 16 }, { age: 17, legs: 4 });
				
				// Old value should not be found
				var oldResults = await db[collectionName].find({ age: 16 }).toArray();
				expect(oldResults.length).to.equal(0);
				
				// New value should be found
				var newResults = await db[collectionName].find({ age: 17 }).toArray();
				expect(newResults.length).to.equal(1);
				expect(newResults[0].legs).to.equal(4);
			});

			it('should maintain index on remove', async function() {
				await db[collectionName].createIndex({ age: 1 });
				
				// Remove one document
				db[collectionName].remove({ age: 4 }, true);
				
				// Should have one less document with age 4
				var results = await db[collectionName].find({ age: 4 }).toArray();
				expect(results.length).to.equal(1);
			});
		});

		describe("Text Indexes", function() {
			const textCollectionName = "textTestCollection";

			beforeEach(async function() {
				db.createCollection(textCollectionName);
			});

			afterEach(async function() {
				db.dropDatabase();
			});

			it('should create a text index', async function() {
				await db[textCollectionName].insertMany([
					{ title: 'MongoDB Tutorial', description: 'Learn MongoDB basics' },
					{ title: 'Node.js Guide', description: 'JavaScript on the server' },
					{ title: 'Database Design', description: 'How to design databases' }
				]);

				const indexName = await db[textCollectionName].createIndex({ description: 'text' });
				expect(indexName).to.equal('description_text');

				const indexes = db[textCollectionName].getIndexes();
				expect(indexes.length).to.equal(1);
				expect(indexes[0].name).to.equal('description_text');
				expect(indexes[0].key).to.deep.equal({ description: 'text' });
			});

			it('should create a named text index', async function() {
				const indexName = await db[textCollectionName].createIndex(
					{ title: 'text' }, 
					{ name: 'title_search' }
				);
				expect(indexName).to.equal('title_search');

				const indexes = db[textCollectionName].getIndexes();
				expect(indexes.length).to.equal(1);
				expect(indexes[0].name).to.equal('title_search');
			});

			it('should create compound text index on multiple fields', async function() {
				const indexName = await db[textCollectionName].createIndex({ 
					title: 'text', 
					description: 'text' 
				});
				expect(indexName).to.equal('title_text_description_text');

				const indexes = db[textCollectionName].getIndexes();
				expect(indexes.length).to.equal(1);
				expect(indexes[0].key).to.deep.equal({ title: 'text', description: 'text' });
			});

			it('should maintain text index on insert', async function() {
				await db[textCollectionName].createIndex({ content: 'text' });
				
				// Insert a document
				await db[textCollectionName].insertOne({ 
					content: 'The quick brown fox jumps over the lazy dog' 
				});

				// The index should be updated automatically
				const docs = await db[textCollectionName].find({ 
					content: { $text: 'fox' } 
				}).toArray();
				expect(docs.length).to.equal(1);
			});

			it('should maintain text index on update', async function() {
				await db[textCollectionName].insertOne({ 
					_id: 'doc1',
					content: 'original text' 
				});
				await db[textCollectionName].createIndex({ content: 'text' });

				// Document should be found with original text
				let docs = await db[textCollectionName].find({ 
					content: { $text: 'original' } 
				}).toArray();
				expect(docs.length).to.equal(1);

				// Update the document
				await db[textCollectionName].updateOne(
					{ _id: 'doc1' },
					{ $set: { content: 'updated text' } }
				);

				// Should not find with old text
				docs = await db[textCollectionName].find({ 
					content: { $text: 'original' } 
				}).toArray();
				expect(docs.length).to.equal(0);

				// Should find with new text
				docs = await db[textCollectionName].find({ 
					content: { $text: 'updated' } 
				}).toArray();
				expect(docs.length).to.equal(1);
			});

			it('should maintain text index on delete', async function() {
				await db[textCollectionName].insertMany([
					{ _id: 'doc1', content: 'first document' },
					{ _id: 'doc2', content: 'second document' }
				]);
				await db[textCollectionName].createIndex({ content: 'text' });

				// Both documents should be found
				let docs = await db[textCollectionName].find({ 
					content: { $text: 'document' } 
				}).toArray();
				expect(docs.length).to.equal(2);

				// Delete one document
				await db[textCollectionName].deleteOne({ _id: 'doc1' });

				// Should only find one document
				docs = await db[textCollectionName].find({ 
					content: { $text: 'document' } 
				}).toArray();
				expect(docs.length).to.equal(1);
				expect(docs[0]._id).to.equal('doc2');
			});

			it('should drop a text index', async function() {
				await db[textCollectionName].createIndex({ content: 'text' });
				
				let indexes = db[textCollectionName].getIndexes();
				expect(indexes.length).to.equal(1);

				// Drop the index
				const result = db[textCollectionName].dropIndex('content_text');
				expect(result.ok).to.equal(1);

				indexes = db[textCollectionName].getIndexes();
				expect(indexes.length).to.equal(0);
			});

			it('should drop all indexes', async function() {
				await db[textCollectionName].createIndex({ title: 'text' });
				await db[textCollectionName].createIndex({ description: 'text' });
				await db[textCollectionName].createIndex({ author: 1 }); // Regular index
				
				let indexes = db[textCollectionName].getIndexes();
				expect(indexes.length).to.equal(3);

				// Drop all indexes
				const result = db[textCollectionName].dropIndexes();
				expect(result.ok).to.equal(1);

				indexes = db[textCollectionName].getIndexes();
				expect(indexes.length).to.equal(0);
			});

			it('should find documents using text search', async function() {
				await db[textCollectionName].insertMany([
					{ title: 'JavaScript Basics', content: 'Learn JavaScript programming' },
					{ title: 'Python Tutorial', content: 'Learn Python programming' },
					{ title: 'Database Design', content: 'Design principles for databases' }
				]);
				await db[textCollectionName].createIndex({ content: 'text' });

				// Search for "programming"
				const docs = await db[textCollectionName].find({ 
					content: { $text: 'programming' } 
				}).toArray();
				expect(docs.length).to.equal(2);
				
				const titles = docs.map(d => d.title).sort();
				expect(titles).to.deep.equal(['JavaScript Basics', 'Python Tutorial']);
			});

			it('should handle stemming in text search', async function() {
				await db[textCollectionName].insertMany([
					{ text: 'I am running fast' },
					{ text: 'He runs every day' },
					{ text: 'We like to run' }
				]);
				await db[textCollectionName].createIndex({ text: 'text' });

				// All should match because of stemming (running, runs, run all stem to "run")
				const docs = await db[textCollectionName].find({ 
					text: { $text: 'run' } 
				}).toArray();
				expect(docs.length).to.equal(3);
			});

			it('should support $and queries with text search', async function() {
				await db[textCollectionName].insertMany([
					{ content: 'JavaScript and Python programming' },
					{ content: 'JavaScript tutorial for beginners' },
					{ content: 'Python programming guide' }
				]);
				await db[textCollectionName].createIndex({ content: 'text' });

				// Find documents with both "JavaScript" and "programming"
				const docs = await db[textCollectionName].find({ 
					$and: [
						{ content: { $text: 'JavaScript' } },
						{ content: { $text: 'programming' } }
					]
				}).toArray();
				expect(docs.length).to.equal(1);
				expect(docs[0].content).to.include('JavaScript and Python programming');
			});

			it('should handle empty text field gracefully', async function() {
				await db[textCollectionName].insertMany([
					{ content: '' },
					{ content: 'some text' },
					{ content: null }
				]);
				await db[textCollectionName].createIndex({ content: 'text' });

				const docs = await db[textCollectionName].find({ 
					content: { $text: 'text' } 
				}).toArray();
				expect(docs.length).to.equal(1);
				expect(docs[0].content).to.equal('some text');
			});
		});

		describe("Geospatial Indexes", function() {
			const geoCollectionName = "geoTestCollection";

			beforeEach(async function() {
				db.createCollection(geoCollectionName);
			});

			afterEach(async function() {
				db.dropDatabase();
			});

			it('should create a 2dsphere index', async function() {
				const indexName = await db[geoCollectionName].createIndex({ location: '2dsphere' });
				expect(indexName).to.equal('location_2dsphere');

				const indexes = db[geoCollectionName].getIndexes();
				expect(indexes.length).to.equal(1);
				expect(indexes[0].name).to.equal('location_2dsphere');
				expect(indexes[0].key).to.deep.equal({ location: '2dsphere' });
			});

			it('should create a named geospatial index', async function() {
				const indexName = await db[geoCollectionName].createIndex(
					{ position: '2dsphere' }, 
					{ name: 'geo_index' }
				);
				expect(indexName).to.equal('geo_index');

				const indexes = db[geoCollectionName].getIndexes();
				expect(indexes.length).to.equal(1);
				expect(indexes[0].name).to.equal('geo_index');
			});

			it('should maintain geospatial index on insert', async function() {
				await db[geoCollectionName].createIndex({ location: '2dsphere' });
				
				// Insert documents with GeoJSON points
				await db[geoCollectionName].insertMany([
					{ 
						name: 'Location A',
						location: { type: 'Point', coordinates: [10, 20] }
					},
					{ 
						name: 'Location B',
						location: { type: 'Point', coordinates: [30, 40] }
					}
				]);

				// Query with $geoWithin
				const docs = await db[geoCollectionName].find({ 
					location: { $geoWithin: [[5, 25], [35, 15]] }
				}).toArray();
				expect(docs.length).to.equal(1);
				expect(docs[0].name).to.equal('Location A');
			});

			it('should use geospatial index for $geoWithin queries', async function() {
				// Insert test documents
				await db[geoCollectionName].insertMany([
					{ name: 'NYC', location: { type: 'Point', coordinates: [-74.0060, 40.7128] } },
					{ name: 'SF', location: { type: 'Point', coordinates: [-122.4194, 37.7749] } },
					{ name: 'LA', location: { type: 'Point', coordinates: [-118.2437, 34.0522] } }
				]);

				// Create geospatial index
				await db[geoCollectionName].createIndex({ location: '2dsphere' });

				// Query for locations on the east coast (roughly)
				const eastCoastBBox = [[-80, 45], [-70, 35]]; // [topLeft, bottomRight]
				const docs = await db[geoCollectionName].find({ 
					location: { $geoWithin: eastCoastBBox }
				}).toArray();

				expect(docs.length).to.equal(1);
				expect(docs[0].name).to.equal('NYC');
			});

			it('should maintain geospatial index on update', async function() {
				await db[geoCollectionName].insertOne({ 
					_id: 'loc1',
					location: { type: 'Point', coordinates: [10, 20] }
				});
				await db[geoCollectionName].createIndex({ location: '2dsphere' });

				// Should find with original location
				let docs = await db[geoCollectionName].find({ 
					location: { $geoWithin: [[5, 25], [15, 15]] }
				}).toArray();
				expect(docs.length).to.equal(1);

				// Update the location
				await db[geoCollectionName].updateOne(
					{ _id: 'loc1' },
					{ $set: { location: { type: 'Point', coordinates: [100, 200] } } }
				);

				// Should not find with old location
				docs = await db[geoCollectionName].find({ 
					location: { $geoWithin: [[5, 25], [15, 15]] }
				}).toArray();
				expect(docs.length).to.equal(0);

				// Should find with new location
				docs = await db[geoCollectionName].find({ 
					location: { $geoWithin: [[95, 205], [105, 195]] }
				}).toArray();
				expect(docs.length).to.equal(1);
			});

			it('should maintain geospatial index on delete', async function() {
				await db[geoCollectionName].insertMany([
					{ _id: 'loc1', location: { type: 'Point', coordinates: [10, 20] } },
					{ _id: 'loc2', location: { type: 'Point', coordinates: [11, 21] } }
				]);
				await db[geoCollectionName].createIndex({ location: '2dsphere' });

				// Both should be found
				let docs = await db[geoCollectionName].find({ 
					location: { $geoWithin: [[5, 25], [15, 15]] }
				}).toArray();
				expect(docs.length).to.equal(2);

				// Delete one location
				await db[geoCollectionName].deleteOne({ _id: 'loc1' });

				// Should only find one
				docs = await db[geoCollectionName].find({ 
					location: { $geoWithin: [[5, 25], [15, 15]] }
				}).toArray();
				expect(docs.length).to.equal(1);
				expect(docs[0]._id).to.equal('loc2');
			});

			it('should drop a geospatial index', async function() {
				await db[geoCollectionName].createIndex({ location: '2dsphere' });
				
				let indexes = db[geoCollectionName].getIndexes();
				expect(indexes.length).to.equal(1);

				// Drop the index
				const result = db[geoCollectionName].dropIndex('location_2dsphere');
				expect(result.ok).to.equal(1);

				indexes = db[geoCollectionName].getIndexes();
				expect(indexes.length).to.equal(0);
			});

			it('should handle GeoJSON FeatureCollection', async function() {
				await db[geoCollectionName].insertOne({
					name: 'Test Feature',
					location: {
						type: 'FeatureCollection',
						features: [{
							type: 'Feature',
							geometry: { type: 'Point', coordinates: [10, 20] }
						}]
					}
				});
				await db[geoCollectionName].createIndex({ location: '2dsphere' });

				const docs = await db[geoCollectionName].find({ 
					location: { $geoWithin: [[5, 25], [15, 15]] }
				}).toArray();
				expect(docs.length).to.equal(1);
				expect(docs[0].name).to.equal('Test Feature');
			});

			it('should handle GeoJSON Polygon', async function() {
				await db[geoCollectionName].insertOne({
					name: 'Polygon Area',
					location: {
						type: 'Polygon',
						coordinates: [[
							[10, 20],
							[11, 20],
							[11, 21],
							[10, 21],
							[10, 20]
						]]
					}
				});
				await db[geoCollectionName].createIndex({ location: '2dsphere' });

				// Polygon should be found when all vertices are within bbox
				const docs = await db[geoCollectionName].find({ 
					location: { $geoWithin: [[9, 22], [12, 19]] }
				}).toArray();
				expect(docs.length).to.equal(1);
				expect(docs[0].name).to.equal('Polygon Area');
			});

			it('should not find polygon partially outside bbox', async function() {
				await db[geoCollectionName].insertOne({
					name: 'Partial Polygon',
					location: {
						type: 'Polygon',
						coordinates: [[
							[10, 20],
							[15, 20],  // This extends outside
							[15, 25],
							[10, 25],
							[10, 20]
						]]
					}
				});
				await db[geoCollectionName].createIndex({ location: '2dsphere' });

				// Polygon should NOT be found when vertices extend outside bbox
				const docs = await db[geoCollectionName].find({ 
					location: { $geoWithin: [[9, 26], [12, 19]] }  // Max lng is 12, but polygon goes to 15
				}).toArray();
				expect(docs.length).to.equal(0);
			});
		});
	});
});