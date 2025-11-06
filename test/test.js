
import {expect} from 'chai';
import * as mongo from '../main.js'

describe("DB no options", function() {

	var db;
	
	before(function() {
	});

	after(function() {
	});

	beforeEach(function() {
		db = new mongo.DB();
	});

	afterEach(function() {
		db = null;
	});

	it('should have no collections by default', function() {			
		expect(db.getCollectionNames().length).to.equal(0);
	});

	it('should be able to create a collection with default store', function() {			
		db.createCollection("myCollection");
		expect(db.getCollectionNames().length).to.equal(1);
		expect(db.myCollection).to.not.be.undefined;
	});

	it('should be able to create a collection with the provided store', function() {			
		db.createCollection("myCollection");
		expect(db.getCollectionNames().length).to.equal(1);
		expect(db.myCollection).to.not.be.undefined;
	});

	it('should be able to drop collection', function() {			
		db.createCollection("myCollection");
		expect(db.getCollectionNames().length).to.equal(1);
		expect(db.myCollection).to.not.be.undefined;
		db.dropDatabase();
		expect(db.getCollectionNames().length).to.equal(0);
		expect(db.myCollection).to.be.undefined;
	});
});

describe("DB", function() {

	var db;
	
	before(function() {
	});

	after(function() {
	});

	beforeEach(function() {
		db = new mongo.DB({
			print : console.log
		});
	});

	afterEach(function() {
		db = null;
	});

	it('should have no collections by default', function() {			
		expect(db.getCollectionNames().length).to.equal(0);
	});

	it('should be able to create a collection with default store', function() {			
		db.createCollection("myCollection");
		expect(db.getCollectionNames().length).to.equal(1);
		expect(db.myCollection).to.not.be.undefined;
	});

	it('should be able to create a collection with the provided store', function() {			
		db.createCollection("myCollection");
		expect(db.getCollectionNames().length).to.equal(1);
		expect(db.myCollection).to.not.be.undefined;
	});

	it('should be able to drop collection', function() {			
		db.createCollection("myCollection");
		expect(db.getCollectionNames().length).to.equal(1);
		expect(db.myCollection).to.not.be.undefined;
		db.dropDatabase();
		expect(db.getCollectionNames().length).to.equal(0);
		expect(db.myCollection).to.be.undefined;
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

		function initDB() {
			db.createCollection(collectionName);
			db[collectionName].insert({ age: 4,	legs: 0, geojson: polygonInBox });
			db[collectionName].insert([{ age: 4, legs: 5, geojson: pointInBox },{ age: 54, legs: 2, geojson: pointNotInBox }]);
			db[collectionName].insertMany([{ age: 54, legs: 12 },{ age: 16, geojson: partiallyInBox }]);
			db[collectionName].insertOne({ name: "steve", text: "this is a text string with paris and london", geojson: pointInBox });

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
	
		function reset() {
			db.dropDatabase();
			initDB();
		}
			
		before(function() {
		});
	
		after(function() {
		});
	
		beforeEach(initDB);
	
		afterEach(function() {
			db = null;
		});
			
		it('should testCount', function() {
			var q = { age : { $gt:3, $lt:7 }};
			if (db[collectionName].find(q).count()!=2) throw "should be 2";
			if (db[collectionName].find().count()!=6) throw "db should have 6 docs";
		});

		it('should testCopyTo', function() {
			var dest = "backup";
			if (db[dest]) throw "backup collection shouldn't exist";
			if (db[collectionName].copyTo(dest)!=6) throw "should have copied all 6 docs";
			if (!db[dest]) throw "backup collection should have been created";
			if (db[dest].find().count()!=6) throw "failed to copy all content";
			if (db[collectionName].find().count()!=6) throw "original collection should still have 6 docs";
			if (db[collectionName].copyTo(dest)!=6) throw "should have copied all 6 docs";
			if (db[dest].find().count()!=6) throw "failed to copy all content";
		});

		it('should testDeleteOne', function() {
			var q = { age : { $gt:3, $lt:7 }};
			if (db[collectionName].find(q).count()!=2) throw "should be 2";
			if (db[collectionName].find().count()!=6) throw "db should have 6 docs";
			if (db[collectionName].deleteOne(q).deletedCount!=1) throw "didn't delete single doc";
			if (db[collectionName].find(q).count()!=1) throw "should be 1 after deletion";
			if (db[collectionName].find().count()!=5) throw "db should have 5 docs in db after deleteion";
		});

		it('should testDeleteMany', function() {
			var q = { age : { $gt:3, $lt:7 }};
			if (db[collectionName].find(q).count()!=2) throw "should be 2";
			if (db[collectionName].find().count()!=6) throw "db should have 6 docs";
			if (db[collectionName].deleteMany(q).deletedCount!=2) throw "didn't delete 2 docs";
			if (db[collectionName].find(q).count()!=0) throw "should be 0 after deletion";
			if (db[collectionName].find().count()!=4) throw "db should have 4 docs in db after deleteion";
		});

		it('should testDistinct', function() {
			var vals = db[collectionName].distinct("age"); // [4,16,54]
			if (vals.length!=3) throw "3 distinct values of age";
			if (vals[0]!=4) throw "fail";
			if (vals[1]!=16) throw "fail";
			if (vals[2]!=54) throw "fail";
			var vals = db[collectionName].distinct("age",{legs:2}); // [54]
			if (vals.length!=1) throw "fail";
			if (vals[0]!=54) throw "fail";
		});

		it('should testDrop', function() {
			if (db[collectionName].find().count()!=6) throw "db should have 6 docs";
			db[collectionName].drop();
			if (db[collectionName].find().count()!=0) throw "db should have no docs";
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
		it('should testFind1', function() {
			var docs = testFind();
			expect(docs.length).to.equal(6);
		});

		/************************************************************************
		 * > db.peep.find({age:54,legs:2})
		 * { "_id" : ObjectId("5695be6aadb5303f33363148"), "age" : 54, "legs" : 2 }
		 */
		it('should testFind2', function() {
			var docs = testFind({ age : 54,	legs: 2 });
			if (docs.length!=1) throw "fail";
		});


		/************************************************************************
		 * > db.peep.find({ $and: [{ age : 54},{ legs: 2 }] })
		 * { "_id" : ObjectId("5695be6aadb5303f33363148"), "age" : 54, "legs" : 2 }
		 */
		it('should testFind3', function() {
			var docs = testFind({ $and: [{ age : 54},{ legs: 2 }] });
			if (docs.length!=1) throw "fail";
		});


		/************************************************************************
		 * > db.peep.find({ age: { $and: [{ $eq : 54}] }, legs: 2 })
		 * Error: error: {
		 *				 "$err" : "Can't canonicalize query: BadValue unknown operator: $and",
		 *				 "code" : 17287
		 */
		it('should testFind4', function() {
			var docs = testFind({ age: { $and: [{ $eq : 54}] }, legs: 2 });
			if (docs.$err!="Can't canonicalize query: BadValue unknown operator: $and") throw "fail";		
		});


		/************************************************************************
		 * > db.peep.find({ age: {$gt:3, $lt: 7}})
		 * { "_id" : ObjectId("5695be58adb5303f33363146"), "age" : 4, "legs" : 0 }
		 * { "_id" : ObjectId("5695be62adb5303f33363147"), "age" : 4, "legs" : 5 }
		 */
		it('should testFind5', function() {
			var docs = testFind({ age : { $gt:3, $lt:7 }});
			if (docs.length!=2) throw "fail";
		});

		/************************************************************************
		 * > db.peep.find({ age: {$gt:{t:3}, $lt: 7}})
		 * 
		 * No Error produced by mongo (?)
		 */
		it('should testFind6', function() {
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
		it('should testFind7', function() {
			var docs = testFind({ age: {$gt:3, lt: 7}});
			if (docs.$err!="Can't canonicalize query: BadValue unknown operator: lt") throw "fail";
		});

		/************************************************************************
		 * > db.peep.find({ age: {gt:3, $lt: 7}})	// object comparison as no first '$'
		 */
		it('should testFind8', function() {
			var docs = testFind({ age: {gt:3, $lt: 7}});
			if (docs.length!=0) throw "fail";
		});

		/************************************************************************
		 * > db.peep.find({ age: {gt:3, lt: 7}}) // object comparison
		 */
		it('should testFind9', function() {
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
		it('should testFind10', function() {
			var docs = testFind({ age: {$gt:3, lt: 7}});
			if (docs.$err!="Can't canonicalize query: BadValue unknown operator: lt") throw "fail";
		});

		/************************************************************************
		 * 
		 */

		it('should find text', function() {
			var docs = testFind({ text: {$text: "pari" }})
			expect(docs).to.not.be.null
			expect(docs.$err).to.be.undefined
			expect(docs.length).to.equal(1)
		})

		it('should not find text', function() {
			var docs = testFind({ text: {$text: "fred"} })
			expect(docs).to.not.be.null
			expect(docs.$err).to.be.undefined
			expect(docs.length).to.equal(0)
		})

		it('should find text in and', function() {
			var docs = testFind({ $and: [ { text: { $text: "pari"} },{ text: { $text: "lond" }} ]})
			expect(docs).to.not.be.null
			expect(docs.$err).to.be.undefined
			expect(docs.length).to.equal(1)
		})

		/************************************************************************
		 * 
		 */
		  
		 it('should geo within bbox', function() {
			var docs = testFind({ geojson: { $geoWithin: [ topLeft, bottomRight ] }})
			expect(docs).to.not.be.null
			expect(docs.$err).to.be.undefined
			expect(docs.length).to.equal(3)
		})

		it('should geo witin in and', function() {
			var docs = testFind({ $and: [ { text: {$text: "pari" }},{ geojson: { $geoWithin: [ topLeft, bottomRight ] }} ]})
			expect(docs).to.not.be.null
			expect(docs.$err).to.be.undefined
			expect(docs.length).to.equal(1)
		})
		
		/************************************************************************
		 * 
		 */
		it('should testFindArray01', function() {
				db[collectionName].insert({ scores: [4,5,6] });
				db[collectionName].insert({ scores: [3,5,7] });
			var docs = testFind({ "scores.2" : 7});
			if (docs.length!=1) throw "fail";
			if (docs[0].scores[2]!=7) throw "Fail";
		});

		/************************************************************************
		 * 
		 */
		it('should testFindArray02', function() {
				db[collectionName].insert({ scores: [4,5,6] });
				db[collectionName].insert({ scores: [3,5,7] });
			var docs = testFind({ "scores.0" : { $lt : 4 }});
			if (docs.length!=1) throw "fail";
			if (docs[0].scores[2]!=7) throw "Fail";
		});
		
		/************************************************************************
		 * 
		 */
		it('should testFindDocument01', function() {
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
			it('should testFind_Projection', function() {

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

			it('should testFindAndModify', function() {
			});

			it('should testFindOne', function() {
				var q = { age : { $gt:3, $lt:7 }};
				if (db[collectionName].find(q).count()!=2) throw "should be 2";
				if (!db[collectionName].findOne(q)) throw "should have found 1";
				if (db[collectionName].find().count()!=6) throw "db should have 6 docs";
			});

			it('should testFindOne_Projection', function() {

				function testInclusion(doc,id,age,legs) {
					if (!id != !doc._id) throw "id isn't correct";
					if (!age != !doc.age) throw "age isn't correct";
					if (!legs != !doc.legs) throw "legs isn't correct";
				}

				var q = { age:54, legs: 2 };
				if (!db[collectionName].findOne(q)) throw "should be 1 doc";
				testInclusion(db[collectionName].findOne(q,{age:1}),true,true,false);
				testInclusion(db[collectionName].findOne(q,{age:0}),true,false,true);
				try {
					db[collectionName].findOne(q,{age:1,legs:0});
					throw "should have raised exception";
				} catch (e) {
					if (e.code!=17287) throw "wrong error code";
					if (e.$err!="Can't canonicalize query: BadValue Projection cannot have a mix of inclusion and exclusion.") throw "wrong error message";
				}
				testInclusion(db[collectionName].findOne(q,{age:1,_id:1}),true,true,false);
				testInclusion(db[collectionName].findOne(q,{age:0,_id:0}),false,false,true);
				testInclusion(db[collectionName].findOne(q,{}),true,true,true);	 

			});

			it('should testFindOneAndDelete', function() {
				if (db[collectionName].find().count()!=6) throw "fail";
				if (db[collectionName].find({age:54}).count()!=2) throw "need 2";
				var doc = db[collectionName].findOneAndDelete({age:54});
				if (!doc) throw "didn't return deleted doc";
				if (db[collectionName].find().count()!=5) throw "fail";
			});

			it('should testFindOneAndDelete_NotFound', function() {
				if (db[collectionName].find().count()!=6) throw "fail";
				if (db[collectionName].find({age:74}).count()!=0) throw "need 0";
				var doc = db[collectionName].findOneAndDelete({age:74});
				if (doc) throw "shouldn't have found anything to delete";
				if (db[collectionName].find().count()!=6) throw "fail";
			});

			it('should testFindOneAndDelete_Sort', function() {
				if (db[collectionName].find().count()!=6) throw "fail";
				if (db[collectionName].find({age:54}).count()!=2) throw "need 2";
				var first = db[collectionName].findOne({age:54});

				var doc = db[collectionName].findOneAndDelete({age:54});
				if (!doc) throw "should have found something to delete";
				if (db[collectionName].find().count()!=5) throw "fail";
				if (doc._id!=first._id) throw "shoudl have deleted the first doc";

				reset();
				
				var doc = db[collectionName].findOneAndDelete({age:54},{ sort : { legs :1 }});
				if (!doc) throw "should have found something to delete";
				if (db[collectionName].find().count()!=5) throw "fail";
				if (doc._id==first._id) throw "shouldnt have deleted the first doc";
			 
			});

			it('should testFindOneAndDelete_Projection', function() {
				if (db[collectionName].find({age:54}).count()!=2) throw "need 2";
				var first = db[collectionName].findOneAndDelete({age:54},{ projection : { _id: 0, legs: 0}});
				if (!first.age) throw "age should be in projection";
				if (first._id) throw "age shouldn't be included";
				if (first.legs) throw "legs shouldn't be included";
			});

			it('should testFindOneAndReplace', function() {
				if (db[collectionName].findOne({age:76,legs:17})) throw "this shouldn't exist yet";
				var orig = db[collectionName].findOne({age:54});
				if (db[collectionName].find({age:54}).count()!=2) throw "there should be 2";
				var replaced = db[collectionName].findOneAndReplace({age:54},{age:76,legs:17});
				if (orig._id!=replaced._id) throw "replaced doc incorrect";
				if (!db[collectionName].findOne({age:76,legs:17})) throw "this doc should exist now";
				if (db[collectionName].find({age:54}).count()!=1) throw "there should only be one now";
			});

			it('should testFindOneAndReplace_NotFound', function() {
				if (db[collectionName].findOne({age:76,legs:17})) throw "this shouldn't exist";
				if (db[collectionName].findOneAndReplace({age:76,legs:17},{})) throw "nothing should have been found to replace";
			});

			it('should testFindOneAndReplace_Projection', function() {
				var replaced = db[collectionName].findOneAndReplace({age:54},{age:76,legs:17}, { projection : {age:0}});
				if (replaced.age) throw "age should not be in projected result";
			});

			it('should testFindOneAndReplace_Sort', function() {
				var unsorted = db[collectionName].findOne({age:54});
				var sortOrder = 1;
				var sorted = db[collectionName].find({age:54}).sort({legs:sortOrder}).next();
				if (unsorted._id==sorted._id) {
					sortOrder = -1;
					sorted = db[collectionName].find({age:54}).sort({legs:sortOrder}).next();
					if (unsorted._id==sorted._id) throw "sorting should have returned a different doc";
				}
				var unsortedReplaced = db[collectionName].findOneAndReplace({age:54},{age:76,legs:17});
				if (unsortedReplaced._id!=unsorted._id) throw "replaced incorrect doc when not sorting";
				var sortedReplaced = db[collectionName].findOneAndReplace({age:54},{age:76,legs:17}, { sort : {legs:sortOrder}});
				if (sortedReplaced._id!=sorted._id) throw "replaced incorrect doc when sorting";
			});

			it('should testFindOneAndReplace_ReturnNewDocument', function() {
				var orig = db[collectionName].findOne({age:54});
				var replaced = db[collectionName].findOneAndReplace({age:54},{age:76,legs:17},{returnNewDocument: false});
				if (orig._id!=replaced._id) throw "should have the returned the doc being replaced";
				var newDoc = db[collectionName].findOne({age:76,legs:17});
				var replacement = db[collectionName].findOneAndReplace({age:76,legs:17},{age:16,legs:47},{returnNewDocument: true});
				if (!replacement._id) throw "id should have been set";
				if (newDoc._id!=replacement._id) throw "the replacement/new doc should have the same id as the one replaced";
				if (replacement.age!=16) throw "doesn't appear to be the new doc (age)";
				if (replacement.legs!=47) throw "doesn't appear to be the new doc (legs)";
			});

			it('should testFindOneAndUpdate', function() {
				var orig = db[collectionName].findOne({age:54});
				var original = db[collectionName].findOneAndUpdate({age:54},{ $inc : { age:2 }});
				if (orig._id!=original._id) throw "orig and original id's should be teh same";
				var updated = db[collectionName].findOne({_id:original._id});
				if (updated._id!=orig._id) throw "doesn't appear to be teh same doc";
				if (orig.legs!=updated.legs) throw "legs should be the same";
				if (updated.age!=56) throw "age should ahve been incremented by 2";		
			});

			it('should testFindOneAndUpdate_NotFound', function() {
				if (db[collectionName].findOne({age:79})) throw "this shouldn't exist";
				if (db[collectionName].findOneAndUpdate({age:79},{ $inc : { age:2 }})) throw "should return null";
			});

			it('should testFindOneAndUpdate_Projection', function() {
				var original = db[collectionName].findOneAndUpdate({age:54},{ $inc : { age:2 }},{ projection: { _id:0,legs:0 }});
				if (original._id) throw "_id shouldn't be in projection";		
				if (original.legs) throw "legs shouldn't be in projection";		
				if (!original.age) throw "age should be in projection";
				if (original.age!=54) throw "age should be 54 as per the original";
				var updated = db[collectionName].findOneAndUpdate({age:56},{ $inc : { age:2 }},{ projection: { _id:0,legs:0 },returnNewDocument: true});
				if (updated._id) throw "_id shouldn't be in projection";		
				if (updated.legs) throw "legs shouldn't be in projection";		
				if (!updated.age) throw "age should be in projection";
				if (updated.age!=58) throw "age should be 58 after updates";
			});

			it('should testFindOneAndUpdate_Sort', function() {
				var unsorted = db[collectionName].findOne({age:54});
				var sortOrder = 1;
				var sorted = db[collectionName].find({age:54}).sort({legs:sortOrder}).next();
				if (unsorted._id==sorted._id) {
					sortOrder = -1;
					sorted = db[collectionName].find({age:54}).sort({legs:sortOrder}).next();
					if (unsorted._id==sorted._id) throw "sorting should have returned a different doc";
				}
				var unsortedUpdated = db[collectionName].findOneAndUpdate({age:54},{ $inc : { age:2 }});
				if (unsortedUpdated._id!=unsorted._id) throw "updated incorrect doc when not sorting";
				var sortedUpdated = db[collectionName].findOneAndUpdate({age:54},{ $inc : { age:2 }}, { sort : {legs:sortOrder}});
				if (sortedUpdated._id!=sorted._id) throw "updated incorrect doc when sorting";
			});

			it('should testFindOneAndUpdate_ReturnNewDocument', function() {
				var orig = db[collectionName].findOneAndUpdate({age:54},{ $inc : { age:2 }});
				if (orig.age!=54) throw "should have returned original";
				var orig2 = db[collectionName].findOneAndUpdate({age:56},{ $inc : { age:2 }},{ returnNewDocument: false});
				if (orig2.age!=56) throw "should have returned original";
				var updated = db[collectionName].findOneAndUpdate({age:58},{ $inc : { age:2 }},{ returnNewDocument: true});
				if (updated.age!=60) throw "should have returned updated";
			});

			it('should testGroup', function() {
			});

			it('should testInsert', function() {
				if (db[collectionName].find().count()!=6) throw "insert doesn't seem to be working in reset()";
			});

			it('should testInsertOne', function() {
				if (db[collectionName].find().count()!=6) throw "insert doesn't seem to be working in reset()";
			});

			it('should testInsertMany', function() {
				if (db[collectionName].find().count()!=6) throw "insert doesn't seem to be working in reset()";
			});

			it('should testMapReduce', function() {
			});

			it('should testReplaceOne', function() {
				if (db[collectionName].find({age:54}).count()!=2) throw "should be 2 docs";
				var result = db[collectionName].replaceOne({age:54},{ cars : 3 });
				if (result.matchedCount!=2) throw "should have matched 2 documents";
				if (result.modifiedCount!=1) throw "should have replaced 1 document";
				var replaced = db[collectionName].findOne({cars:3});
				if (replaced.cars!=3) throw "doc doesn't look like replacement";
			});

			it('should testReplaceOne_NotFound', function() {
				if (db[collectionName].find({age:57}).count()!=0) throw "should be no docs";
				var result = db[collectionName].replaceOne({age:57},{ cars : 3 });
				if (result.matchedCount!=0) throw "should have matched 0 documents";
				if (result.modifiedCount!=0) throw "should have replaced 0 document";
			});

			it('should testReplaceOne_Upsert', function() {
				if (db[collectionName].find({age:57}).count()!=0) throw "should be no docs";
				var result = db[collectionName].replaceOne({age:57},{ cars : 3 },{upsert: true});
				if (result.matchedCount!=0) throw "should have matched 0 documents";
				if (result.modifiedCount!=0) throw "should have replaced 0 documents";
				if (!result.upsertedId) throw "should have created new document";
				var newDoc = db[collectionName].findOne({_id:result.upsertedId});
				if (newDoc.cars!=3) throw "new doc doesn't look like replaced doc";
			});

			it('should testRemove', function() {
				if (db[collectionName].find({age:54}).count()!=2) throw "should be 2 docs";
				db[collectionName].remove({age:54});
				if (db[collectionName].find({age:54}).count()!=0) throw "should be no docs";			 
			});

			it('should testRemove_JustOneTrue', function() {
				if (db[collectionName].find({age:54}).count()!=2) throw "should be 2 docs";
				db[collectionName].remove({age:54},true);
				if (db[collectionName].find({age:54}).count()!=1) throw "should be 1 doc";
			});

			it('should testRemove_JustOneFalse', function() {
				if (db[collectionName].find({age:54}).count()!=2) throw "should be 2 docs";
				db[collectionName].remove({age:54},false);
				if (db[collectionName].find({age:54}).count()!=0) throw "should be no docs";
			});

			it('should testRemove_JustOneDocTrue', function() {
				if (db[collectionName].find({age:54}).count()!=2) throw "should be 2 docs";
				db[collectionName].remove({age:54},{ justOne : true } );
				if (db[collectionName].find({age:54}).count()!=1) throw "should be 1 doc";
			});

			it('should testRemove_JustOneDocFalse', function() {
				if (db[collectionName].find({age:54}).count()!=2) throw "should be 2 docs";
				db[collectionName].remove({age:54},{ justOne : false } );
				if (db[collectionName].find({age:54}).count()!=0) throw "should be no docs";
			});

			it('should testUpdate', function() {
				if (db[collectionName].find({age:54}).count()!=2) throw "should be 2 docs to start with";
				db[collectionName].update({age:54},{ $inc : { age:2 }});
				if (db[collectionName].find({age:54}).count()!=1) throw "one doc should have been updated from 54";
				if (db[collectionName].find({age:56}).count()!=1) throw "one doc should have been updated to 56";
			});

			it('should testUpdate_Op_Inc', function() {
				var orig = db[collectionName].findOne({legs:12});
				db[collectionName].update({legs:12},{ $inc : { age:2, legs:2 }});
				var updated = db[collectionName].findOne({_id:orig._id});
				if (orig._id!=updated._id) throw "couldn't find updated doc";
				if (updated.age!=56) throw "age didn't get updated";
				if (updated.legs!=14) throw "legs didn't get updated";
			});

			it('should testUpdate_Op_Mul', function() {
				var orig = db[collectionName].findOne({legs:12});
				db[collectionName].update({legs:12},{ $mul : { age:2, legs:2 }});
				var updated = db[collectionName].findOne({_id:orig._id});
				if (orig._id!=updated._id) throw "couldn't find updated doc";
				if (updated.age!=(54*2)) throw "age didn't get updated";
				if (updated.legs!=(12*2)) throw "legs didn't get updated";
			});

			it('should testUpdate_Op_Rename', function() {
				var orig = db[collectionName].findOne({legs:12});
				db[collectionName].update({legs:12},{ $rename : { age:"cats", legs:"dogs" }});
				var updated = db[collectionName].findOne({_id:orig._id});
				if (orig._id!=updated._id) throw "couldn't find updated doc";
				if (updated.age) throw "age shouldnt exist";
				if (updated.legs) throw "legs shouldnt exist";
				if (updated.cats!=54) throw "cats should have value of age";
				if (updated.dogs!=12) throw "dogs should have value of legs";
			});

			it('should testUpdate_Op_SetOnInsert', function() {
				if (db[collectionName].find({age:57}).count()!=0) throw "should be no docs to start with";
				db[collectionName].update({age:57},{ $setOnInsert: { dogs: 2, cats: 3}},{upsert:true});
				if (db[collectionName].find({dogs:2,cats:3}).count()!=1) throw "one doc should have been created";
			});

			it('should testUpdate_Op_Set', function() {
				if (db[collectionName].find({age:54}).count()!=2) throw "should be 2 docs to start with";
				if (db[collectionName].find({age:54,dogs:2,cats:3}).count()!=0) throw "should be no docs";
				db[collectionName].updateMany({age:54},{ $set: { dogs: 2, cats: 3}});
				if (db[collectionName].find({age:54,dogs:2,cats:3}).count()!=2) throw "should be 2 docs";
			});

			it('should testUpdate_Op_Unset', function() {
				if (db[collectionName].find({age:54}).count()!=2) throw "should be 2 docs to start with";
				db[collectionName].updateMany({age:54},{ $unset: { age: 2}});
				if (db[collectionName].find({age:54}).count()!=0) throw "no docs should be returned";
			});

			it('should testUpdate_Op_Min', function() {
				if (db[collectionName].find({legs:10}).count()!=0) throw "should be no docs to start with";
				db[collectionName].updateMany({legs:12},{ $min: { legs: 10}});
				if (db[collectionName].find({legs:10}).count()!=1) throw "should have been udpated";
			});

			it('should testUpdate_Op_Max', function() {
				if (db[collectionName].find({legs:24}).count()!=0) throw "should be no docs to start with";
				db[collectionName].updateMany({legs:12},{ $max: { legs: 24}});
				if (db[collectionName].find({legs:24}).count()!=1) throw "should have been udpated";
			});

			it('should testUpdate_Op_CurrentDate', function() {
				if (db[collectionName].find({legs:12}).count()!=1) throw "should be 1 doc to start with";
				db[collectionName].updateMany({legs:12},{ $currentDate: { now: 24}});
				var doc = db[collectionName].findOne({legs:12});
				if (!doc.now) throw "now should have been set to date";
			});

			it('should testUpdate_Op_AddToSet', function() {
				db[collectionName].insert({ me: 7, nums: [3] });
				var orig = db[collectionName].findOne({me:7});
				if (orig.nums.length!=1) throw "array of length 1 should exist";
				db[collectionName].update({me:7},{ $addToSet : { nums : [4,5] }});
				var updated = db[collectionName].findOne({me:7});
				if (updated.nums.length!=2) throw "array of length 2 should exist";
				if (updated.nums[1].length!=2) throw "array of length 2 should exist";
			});

			it('should testUpdate_Op_Pop', function() {
				db[collectionName].insert({ me: 7, nums: [1,2,3,4,5,6] });
				db[collectionName].update({me:7},{ $pop : {nums:1} });
				var doc = db[collectionName].findOne({me:7});
				if (doc.nums.length!=5) throw "incorrect length";
				if (doc.nums[0]!=1) throw "first element should be 1";
				if (doc.nums[doc.nums.length-1]!=5) throw "last element should be 5";
				db[collectionName].update({me:7},{ $pop : {nums:-1} });
				var doc = db[collectionName].findOne({me:7});
				if (doc.nums.length!=4) throw "incorrect length";
				if (doc.nums[0]!=2) throw "first element should be 2";
				if (doc.nums[doc.nums.length-1]!=5) throw "last element should be 5";
			});

			it('should testUpdate_Op_PullAll', function() {
				db[collectionName].insert({ me: 7, nums: [3,5,2,3,4,5,2,5] });
				db[collectionName].update({me:7},{ $pullAll : {nums:[3,5]} });
				var doc = db[collectionName].findOne({me:7});	// nums = [2,4,2]
				if (doc.nums.length!=3) throw "incorrect length";
				if (doc.nums[0]!=2) throw "[0] element should be 2";
				if (doc.nums[1]!=4) throw "[1] element should be 4";
				if (doc.nums[2]!=2) throw "[2] element should be 2";
			});

			it('should testUpdate_Op_Pull', function() {
			});

			it('should testUpdate_Op_PushAll', function() {
				db[collectionName].insert({ me: 7, nums: [3] });
				db[collectionName].update({me:7},{ $pushAll : {nums:[4,5]} });
				var doc = db[collectionName].findOne({me:7});
				if (doc.nums.length!=3) throw "incorrect length";
				if (doc.nums[0]!=3) throw "[0] element should be 3";
				if (doc.nums[1]!=4) throw "[1] element should be 4";
				if (doc.nums[2]!=5) throw "[2] element should be 5";
			});

			it('should testUpdate_Op_Push', function() {
				db[collectionName].insert({ me: 7, nums: [3] });
				db[collectionName].update({me:7},{ $push : {nums:4} });
				var doc = db[collectionName].findOne({me:7});
				if (doc.nums.length!=2) throw "incorrect length";
				if (doc.nums[0]!=3) throw "[0] element should be 3";
				if (doc.nums[1]!=4) throw "[1] element should be 4";
			});

			it('should testUpdate_Op_Each', function() {
			});

			it('should testUpdate_Op_Slice', function() {
			});

			it('should testUpdate_Op_Sort', function() {
			});

			it('should testUpdate_Op_Position', function() {
			});

			it('should testUpdate_Op_Bit', function() {
				db[collectionName].insert({ me: 7, val : 4 });
				db[collectionName].update({me:7},{$bit:{val: {or:3}}});
				var doc = db[collectionName].findOne({me:7});
				if (doc.val!=7) throw "4 or 3 = 7";
				db[collectionName].update({me:7},{$bit:{val: {and:14}}});
				var doc = db[collectionName].findOne({me:7});
				if (doc.val!=6) throw "7 and 14 = 6";
				db[collectionName].update({me:7},{$bit:{val: {xor:10}}});
				var doc = db[collectionName].findOne({me:7});
				if (doc.val!=12) throw "6 xor 10 = 12";
			});

			it('should testUpdate_Op_Isolated', function() {
			});

			it('should testUpdate_Multi', function() {
				if (db[collectionName].find({age:54}).count()!=2) throw "should be 2 docs to start with";
				db[collectionName].update({age:54},{ $inc : { age:2 }},{multi:true});
				if (db[collectionName].find({age:54}).count()!=0) throw "all docs should have been updated from 54";
				if (db[collectionName].find({age:56}).count()!=2) throw "all docs should have been updated to 56";
			});

			it('should testUpdate_Upsert', function() {
				if (db[collectionName].find({age:57}).count()!=0) throw "should be no docs to start with";
				db[collectionName].update({age:57},{ $inc : { age:2 }},{upsert:true});
				if (db[collectionName].find({age:59}).count()!=1) throw "one doc should have been created with age:59";
			});

			it('should testUpdateOne', function() {
				if (db[collectionName].find({age:54}).count()!=2) throw "should be 2 docs to start with";
				db[collectionName].updateOne({age:54},{ $inc : { age:2 }});
				if (db[collectionName].find({age:54}).count()!=1) throw "one doc should have been updated from 54";
				if (db[collectionName].find({age:56}).count()!=1) throw "one doc should have been updated to 56";
			});
	
			it('should testUpdateOne_Upsert', function() {
				if (db[collectionName].find({age:57}).count()!=0) throw "should be no docs to start with";
				db[collectionName].updateOne({age:57},{ $inc : { age:2 }},{ upsert: true});
				if (db[collectionName].find({age:59}).count()!=1) throw "new doc should have been created with age:59";
			});

			it('should testUpdateMany', function() {
				if (db[collectionName].find({age:54}).count()!=2) throw "should be 2 docs to start with";
				db[collectionName].updateMany({age:54},{ $inc : { age:2 }});
				if (db[collectionName].find({age:54}).count()!=0) throw "these docs should have been updated from 54";
				if (db[collectionName].find({age:56}).count()!=2) throw "these docs should have been updated to 56";
			});

			it('should testUpdateMany_Upsert', function() {
				if (db[collectionName].find({age:57}).count()!=0) throw "should be no docs to start with";
				db[collectionName].updateMany({age:57},{ $inc : { age:2 }},{ upsert: true});
				if (db[collectionName].find({age:59}).count()!=1) throw "new doc should have been created with age:59";
			});
			
			describe('Cursor', function() {

			it('should testCount', function() {
				var c = db[collectionName].find();
				if (c.count()!=6) throw "incorrect count";
				while (c.hasNext()) {
					c.next();
					if (c.count()!=6) throw "incorrect count";
				}
			});
				
			it('should testForEach', function() {
				var numLegs = 0;
				var numDocs = 0;
				db[collectionName].find().forEach(function(doc) {
					numDocs++;
					if (doc.legs) numLegs += doc.legs;
				});
				if (numDocs!=6) throw "total number of docs != 6";
				if (numLegs!=19) throw "total number of legs != 19";
			});

			it('should testHasNext', function() {
				var c = db[collectionName].find();
				while (c.hasNext()) {
					c.next();
				}
			});

			it('should testLimit', function() {
				var count = 0;
				var c = db[collectionName].find().limit(3);
				while (c.hasNext()) {
					c.next();
					count++;
				}
				if (count!=3) throw "should only have max 3 when limited";
			});

			it('should testMap', function() {
				var i = 0;
				var numDocs = 0;
				var result = db[collectionName].find().map(function(doc) {
					return i++;
				});
				if (result.length!=6) throw "result should have entry for each doc";
				if (result[2]!=2) throw "result array not correct";
			});

			it('should testNext', function() {
				var c = db[collectionName].find();
				while (c.hasNext()) {
					c.next();
				}
			});

			it('should testSkip', function() {
				var count = 0;
				var c = db[collectionName].find().skip(3);
				while (c.hasNext()) {
					c.next();
					count++;
				}
				if (count!=3) throw "should have skipped 3 and return 3";
			});

			it('should testSort', function() {
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

			it('should testToArray', function() {
				var c = db[collectionName].find();
				c.next();
				c.next();
				var arr = c.toArray();
				if (arr.length!=4) throw "should be 4 elements in results array";
			});

			it('should testSortCount', function() {
				var c = db[collectionName].find().sort({legs:1});
				if (c.count()!=6) throw "incorrect count";
				while (c.hasNext()) {
					c.next();
					if (c.count()!=6) throw "incorrect count";
				}
			});

			it('should testSortForEach', function() {
				var numLegs = 0;
				var numDocs = 0;
				db[collectionName].find().sort({legs:-1}).forEach(function(doc) {
					numDocs++;
					if (doc.legs) numLegs += doc.legs;
				});
				if (numDocs!=6) throw "total number of docs != 6";
				if (numLegs!=19) throw "total number of legs != 19"; 
			});
				
			it('should testSortHasNext', function() {
				var c = db[collectionName].find().sort({legs:1});
				while (c.hasNext()) {
					c.next();
				}
			});

			it('should testSortLimit', function() {
				var count = 0;
				var c = db[collectionName].find().sort({legs:1}).limit(3);
				while (c.hasNext()) {
					c.next();
					count++;
				}
				if (count!=3) throw "should only have max 3 when limited";
			});
				
			it('should testSortMap', function() {
				var i = 0;
				var numDocs = 0;
				var result = db[collectionName].find().sort({legs:1}).map(function(doc) {
					return i++;
				});
				if (result.length!=6) throw "result should have entry for each doc";
				if (result[2]!=2) throw "result array not correct";
			});
				
			it('should testSortNext', function() {
				var c = db[collectionName].find().sort({legs:1});
				while (c.hasNext()) {
					c.next();
				}
			});
				
			it('should testSortSkip', function() {
				var count = 0;
				var c = db[collectionName].find().sort({legs:1}).skip(3);
				while (c.hasNext()) {
					c.next();
					count++;
				}
				if (count!=3) throw "should have skipped 3 and return 3";
			});

			it('should testSortSort', function() {
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

			it('should testSortToArray', function() {
				var c = db[collectionName].find().sort({legs:1});
				c.next();
				c.next();
				var arr = c.toArray();
				if (arr.length!=4) throw "should be 4 elements in results array";
			});
		});

		describe("Indexes", function() {
			
			it('should create a single-field index', function() {
				var indexName = db[collectionName].createIndex({ age: 1 });
				expect(indexName).to.equal('age_1');
				var indexes = db[collectionName].getIndexes();
				expect(indexes.length).to.equal(1);
				expect(indexes[0].name).to.equal('age_1');
				expect(indexes[0].key).to.deep.equal({ age: 1 });
			});

			it('should create a named index', function() {
				var indexName = db[collectionName].createIndex({ legs: 1 }, { name: 'legs_index' });
				expect(indexName).to.equal('legs_index');
				var indexes = db[collectionName].getIndexes();
				expect(indexes.length).to.equal(1);
				expect(indexes[0].name).to.equal('legs_index');
			});

			it('should create multiple indexes', function() {
				db[collectionName].createIndex({ age: 1 });
				db[collectionName].createIndex({ legs: -1 });
				var indexes = db[collectionName].getIndexes();
				expect(indexes.length).to.equal(2);
			});

			it('should not create duplicate index', function() {
				db[collectionName].createIndex({ age: 1 });
				db[collectionName].createIndex({ age: 1 });
				var indexes = db[collectionName].getIndexes();
				expect(indexes.length).to.equal(1);
			});

			it('should use index for simple equality query', function() {
				// Create index on age field
				db[collectionName].createIndex({ age: 1 });
				
				// Query using indexed field
				var results = db[collectionName].find({ age: 54 }).toArray();
				expect(results.length).to.equal(2);
				
				// Verify we got the right documents
				results.forEach(function(doc) {
					expect(doc.age).to.equal(54);
				});
			});

			it('should still work with non-indexed queries', function() {
				// Create index on age field
				db[collectionName].createIndex({ age: 1 });
				
				// Query using non-indexed field
				var results = db[collectionName].find({ legs: 5 }).toArray();
				expect(results.length).to.equal(1);
				expect(results[0].legs).to.equal(5);
			});

			it('should maintain index on insert', function() {
				db[collectionName].createIndex({ age: 1 });
				
				// Insert a new document
				db[collectionName].insertOne({ age: 25, legs: 2 });
				
				// Query should find the new document
				var results = db[collectionName].find({ age: 25 }).toArray();
				expect(results.length).to.equal(1);
				expect(results[0].age).to.equal(25);
			});

			it('should maintain index on delete', function() {
				db[collectionName].createIndex({ age: 1 });
				
				// Delete documents with age 54
				var deleteResult = db[collectionName].deleteMany({ age: 54 });
				expect(deleteResult.deletedCount).to.equal(2);
				
				// Query should not find deleted documents
				var results = db[collectionName].find({ age: 54 }).toArray();
				expect(results.length).to.equal(0);
			});

			it('should handle complex queries with index', function() {
				db[collectionName].createIndex({ age: 1 });
				
				// Complex query with indexed and non-indexed fields
				var results = db[collectionName].find({ age: 4, legs: 5 }).toArray();
				expect(results.length).to.equal(1);
				expect(results[0].age).to.equal(4);
				expect(results[0].legs).to.equal(5);
			});

			it('should handle queries with operators on indexed fields', function() {
				db[collectionName].createIndex({ age: 1 });
				
				// Query with operators falls back to full scan
				var results = db[collectionName].find({ age: { $gt: 50 } }).toArray();
				expect(results.length).to.equal(2);
			});

			it('should create compound index', function() {
				var indexName = db[collectionName].createIndex({ age: 1, legs: 1 });
				expect(indexName).to.equal('age_1_legs_1');
				
				var indexes = db[collectionName].getIndexes();
				expect(indexes.length).to.equal(1);
				expect(indexes[0].key).to.deep.equal({ age: 1, legs: 1 });
			});

			it('should handle empty result set with index', function() {
				db[collectionName].createIndex({ age: 1 });
				
				// Query for non-existent value
				var results = db[collectionName].find({ age: 999 }).toArray();
				expect(results.length).to.equal(0);
			});

			it('should maintain index on update', function() {
				db[collectionName].createIndex({ age: 1 });
				
				// Update a document's age
				db[collectionName].updateOne({ age: 54 }, { $set: { age: 55 } });
				
				// Old value should not be found
				var oldResults = db[collectionName].find({ age: 54 }).toArray();
				expect(oldResults.length).to.equal(1); // Only one doc with age 54 left
				
				// New value should be found
				var newResults = db[collectionName].find({ age: 55 }).toArray();
				expect(newResults.length).to.equal(1);
				expect(newResults[0].age).to.equal(55);
			});

			it('should maintain index on replaceOne', function() {
				db[collectionName].createIndex({ age: 1 });
				
				// Replace a document
				db[collectionName].replaceOne({ age: 16 }, { age: 17, legs: 4 });
				
				// Old value should not be found
				var oldResults = db[collectionName].find({ age: 16 }).toArray();
				expect(oldResults.length).to.equal(0);
				
				// New value should be found
				var newResults = db[collectionName].find({ age: 17 }).toArray();
				expect(newResults.length).to.equal(1);
				expect(newResults[0].legs).to.equal(4);
			});

			it('should maintain index on remove', function() {
				db[collectionName].createIndex({ age: 1 });
				
				// Remove one document
				db[collectionName].remove({ age: 4 }, true);
				
				// Should have one less document with age 4
				var results = db[collectionName].find({ age: 4 }).toArray();
				expect(results.length).to.equal(1);
			});
		});
	});
});