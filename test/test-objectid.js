import {expect} from 'chai';
import * as mongo from '../main.js';

describe("ObjectId", function() {

	describe('Constructor', function() {
		
		it('should generate new ObjectId when called without arguments', function() {
			const id = new mongo.ObjectId();
			expect(id).to.not.be.undefined;
			expect(id.toString()).to.have.lengthOf(24);
		});

		it('should create ObjectId from valid hex string', function() {
			const hexString = '507f1f77bcf86cd799439011';
			const id = new mongo.ObjectId(hexString);
			expect(id.toString()).to.equal(hexString);
		});

		it('should normalize hex string to lowercase', function() {
			const hexString = '507F1F77BCF86CD799439011';
			const id = new mongo.ObjectId(hexString);
			expect(id.toString()).to.equal(hexString.toLowerCase());
		});

		it('should throw error for invalid hex string length', function() {
			expect(() => new mongo.ObjectId('123')).to.throw();
			expect(() => new mongo.ObjectId('507f1f77bcf86cd79943901')).to.throw(); // 23 chars
			expect(() => new mongo.ObjectId('507f1f77bcf86cd7994390111')).to.throw(); // 25 chars
		});

		it('should throw error for invalid hex characters', function() {
			expect(() => new mongo.ObjectId('507f1f77bcf86cd79943901g')).to.throw();
			expect(() => new mongo.ObjectId('507f1f77bcf86cd79943901!')).to.throw();
		});

		it('should create copy from another ObjectId', function() {
			const id1 = new mongo.ObjectId();
			const id2 = new mongo.ObjectId(id1);
			expect(id1.toString()).to.equal(id2.toString());
			expect(id1).to.not.equal(id2); // Different instances
		});
	});

	describe('Static Methods', function() {
		
		it('should validate valid ObjectId hex strings', function() {
			expect(mongo.ObjectId.isValid('507f1f77bcf86cd799439011')).to.be.true;
			expect(mongo.ObjectId.isValid('000000000000000000000000')).to.be.true;
			expect(mongo.ObjectId.isValid('ffffffffffffffffffffffff')).to.be.true;
		});

		it('should reject invalid ObjectId hex strings', function() {
			expect(mongo.ObjectId.isValid('123')).to.be.false;
			expect(mongo.ObjectId.isValid('507f1f77bcf86cd79943901')).to.be.false; // too short
			expect(mongo.ObjectId.isValid('507f1f77bcf86cd79943901g')).to.be.false; // invalid char
			expect(mongo.ObjectId.isValid(null)).to.be.false;
			expect(mongo.ObjectId.isValid(undefined)).to.be.false;
			expect(mongo.ObjectId.isValid(123)).to.be.false;
		});

		it('should generate unique ObjectIds', function() {
			const id1 = mongo.ObjectId.generate();
			const id2 = mongo.ObjectId.generate();
			expect(id1).to.not.equal(id2);
		});

		it('should create ObjectId from timestamp', function() {
			const timestamp = new Date('2023-01-01T00:00:00Z').getTime();
			const id = mongo.ObjectId.createFromTime(timestamp);
			expect(id.toString()).to.have.lengthOf(24);
			expect(id.getTimestamp().getTime()).to.equal(timestamp);
		});
	});

	describe('Instance Methods', function() {
		
		it('should return hex string from toString()', function() {
			const id = new mongo.ObjectId();
			const str = id.toString();
			expect(str).to.be.a('string');
			expect(str).to.have.lengthOf(24);
			expect(mongo.ObjectId.isValid(str)).to.be.true;
		});

		it('should return hex string from toHexString()', function() {
			const id = new mongo.ObjectId();
			expect(id.toHexString()).to.equal(id.toString());
		});

		it('should return Date from getTimestamp()', function() {
			const beforeTime = Date.now();
			const id = new mongo.ObjectId();
			const afterTime = Date.now();
			
			const timestamp = id.getTimestamp();
			expect(timestamp).to.be.instanceOf(Date);
			expect(timestamp.getTime()).to.be.at.least(beforeTime - 1000);
			expect(timestamp.getTime()).to.be.at.most(afterTime + 1000);
		});

		it('should compare ObjectIds with equals()', function() {
			const id1 = new mongo.ObjectId('507f1f77bcf86cd799439011');
			const id2 = new mongo.ObjectId('507f1f77bcf86cd799439011');
			const id3 = new mongo.ObjectId('507f1f77bcf86cd799439012');
			
			expect(id1.equals(id2)).to.be.true;
			expect(id1.equals(id3)).to.be.false;
		});

		it('should compare ObjectId with hex string', function() {
			const id = new mongo.ObjectId('507f1f77bcf86cd799439011');
			expect(id.equals('507f1f77bcf86cd799439011')).to.be.true;
			expect(id.equals('507F1F77BCF86CD799439011')).to.be.true; // case insensitive
			expect(id.equals('507f1f77bcf86cd799439012')).to.be.false;
		});

		it('should return hex string from toJSON()', function() {
			const id = new mongo.ObjectId();
			expect(id.toJSON()).to.equal(id.toString());
		});

		it('should have inspect method for console.log', function() {
			const id = new mongo.ObjectId('507f1f77bcf86cd799439011');
			expect(id.inspect()).to.include('ObjectId');
			expect(id.inspect()).to.include('507f1f77bcf86cd799439011');
		});
	});

	describe('Timestamp Ordering', function() {
		
		it('should generate ObjectIds in chronological order', function(done) {
			const id1 = new mongo.ObjectId();
			setTimeout(() => {
				const id2 = new mongo.ObjectId();
				
				// Compare timestamps
				expect(id2.getTimestamp().getTime()).to.be.at.least(id1.getTimestamp().getTime());
				
				// Hex strings should be comparable
				expect(id2.toString() >= id1.toString()).to.be.true;
				done();
			}, 10);
		});

		it('should extract correct timestamp', function() {
			// Create an ObjectId with a known timestamp
			const expectedDate = new Date('2012-07-14T23:04:39.000Z');
			const testId = mongo.ObjectId.createFromTime(expectedDate.getTime());
			
			const actualTimestamp = testId.getTimestamp();
			// Compare in seconds to avoid millisecond precision issues
			expect(Math.floor(actualTimestamp.getTime() / 1000)).to.equal(
				Math.floor(expectedDate.getTime() / 1000)
			);
		});
	});

	describe('Usage in Database Operations', function() {

		let client;
		let db;

		beforeEach(async function() {
			client = await mongo.MongoClient.connect('mongodb://localhost:27017');
			db = client.db('testdb');
		});

		afterEach(async function() {
			await client.close();
		});

		it('should automatically generate ObjectId for _id', function() {
			db.createCollection('users');
			db.users.insertOne({ name: 'Alice' });
			
			const doc = db.users.findOne({ name: 'Alice' });
			expect(doc._id).to.be.instanceOf(mongo.ObjectId);
			expect(doc._id.toString()).to.have.lengthOf(24);
		});

		it('should allow manual ObjectId assignment', function() {
			db.createCollection('users');
			const customId = new mongo.ObjectId();
			db.users.insertOne({ _id: customId, name: 'Bob' });
			
			const doc = db.users.findOne({ name: 'Bob' });
			expect(doc._id.equals(customId)).to.be.true;
		});

		it('should query by ObjectId', function() {
			db.createCollection('users');
			const id = new mongo.ObjectId();
			db.users.insertOne({ _id: id, name: 'Charlie' });
			
			const doc = db.users.findOne({ _id: id });
			expect(doc).to.not.be.null;
			expect(doc.name).to.equal('Charlie');
		});

		it('should query by ObjectId hex string', function() {
			db.createCollection('users');
			const id = new mongo.ObjectId();
			db.users.insertOne({ _id: id, name: 'David' });
			
			const doc = db.users.findOne({ _id: id.toString() });
			expect(doc).to.not.be.null;
			expect(doc.name).to.equal('David');
		});

		it('should support $eq operator with ObjectId', function() {
			db.createCollection('users');
			const id = new mongo.ObjectId();
			db.users.insertOne({ _id: id, name: 'Eve' });
			
			const doc = db.users.findOne({ _id: { $eq: id } });
			expect(doc).to.not.be.null;
			expect(doc.name).to.equal('Eve');
		});

		it('should support $ne operator with ObjectId', function() {
			db.createCollection('users');
			const id1 = new mongo.ObjectId();
			const id2 = new mongo.ObjectId();
			db.users.insertOne({ _id: id1, name: 'Frank' });
			db.users.insertOne({ _id: id2, name: 'Grace' });
			
			const docs = db.users.find({ _id: { $ne: id1 } }).toArray();
			expect(docs.length).to.equal(1);
			expect(docs[0].name).to.equal('Grace');
		});

		it('should support $in operator with ObjectIds', function() {
			db.createCollection('users');
			const id1 = new mongo.ObjectId();
			const id2 = new mongo.ObjectId();
			const id3 = new mongo.ObjectId();
			
			db.users.insertMany([
				{ _id: id1, name: 'User1' },
				{ _id: id2, name: 'User2' },
				{ _id: id3, name: 'User3' }
			]);
			
			const docs = db.users.find({ _id: { $in: [id1, id3] } }).toArray();
			expect(docs.length).to.equal(2);
			expect(docs.map(d => d.name).sort()).to.deep.equal(['User1', 'User3']);
		});

		it('should support sorting by ObjectId (_id)', function() {
			db.createCollection('messages');
			
			// Insert in random order but with timestamps that increase
			const ids = [];
			for (let i = 0; i < 3; i++) {
				const id = new mongo.ObjectId();
				ids.push(id);
				db.messages.insertOne({ _id: id, text: `Message ${i}` });
			}
			
			const sorted = db.messages.find().sort({ _id: 1 }).toArray();
			expect(sorted.length).to.equal(3);
			
			// Should be in chronological order (roughly, if created close together)
			for (let i = 0; i < sorted.length - 1; i++) {
				expect(sorted[i]._id.toString() <= sorted[i + 1]._id.toString()).to.be.true;
			}
		});

		it('should handle ObjectId in updates', function() {
			db.createCollection('users');
			const id = new mongo.ObjectId();
			db.users.insertOne({ _id: id, name: 'Original' });
			
			db.users.updateOne({ _id: id }, { $set: { name: 'Updated' } });
			
			const doc = db.users.findOne({ _id: id });
			expect(doc.name).to.equal('Updated');
		});

		it('should handle ObjectId in deletes', function() {
			db.createCollection('users');
			const id = new mongo.ObjectId();
			db.users.insertOne({ _id: id, name: 'ToDelete' });
			
			db.users.deleteOne({ _id: id });
			
			const doc = db.users.findOne({ _id: id });
			expect(doc).to.be.null;
		});
	});
});
