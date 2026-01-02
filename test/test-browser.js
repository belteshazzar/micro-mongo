import { chromium } from 'playwright';
import { expect } from 'chai';

describe("Browser Tests", function() {
	this.timeout(30000); // Increase timeout for browser tests

	const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
	let browser;
	let context;
	let page;

	before(async function() {
		browser = await chromium.launch({ 
			headless: true,
			timeout: 60000
		});
	});

	after(async function() {
		if (browser) {
			await browser.close();
		}
	});

	beforeEach(async function() {
		context = await browser.newContext();
		page = await context.newPage();
		
		// Listen to console messages for debugging
		page.on('console', msg => {
			if (msg.type() === 'error') {
				console.log('Browser console error:', msg.text());
			}
		});
		
		// Listen to page errors
		page.on('pageerror', error => {
			console.log('Browser page error:', error.message);
		});
	});

	afterEach(async function() {
		if (page) {
			await page.close();
		}
		if (context) {
			await context.close();
		}
	});

	it('should have localStorage collection by default', async function() {
		try {
			await page.goto(`${BASE_URL}/test-browser-simple.html`, { 
				waitUntil: 'domcontentloaded',
				timeout: 15000 
			});
			
			// Wait a bit for the script to execute
			await page.waitForTimeout(1000);
			
			// Wait for the result to be populated
			const pre = await page.locator('body pre#result');
			const txt = await pre.textContent();
			expect(txt).to.equal('{"localStorage":{"isCollection":true}}');
		} catch (error) {
			console.log('Error in test:', error.message);
			const content = await page.content();
			console.log('Page content:', content.substring(0, 1000));
			throw error;
		}
	});

	it('should perform basic CRUD operations', async function() {
		await page.goto(`${BASE_URL}/index.html`);
		
		// Execute a test in the browser context
		const result = await page.evaluate(async () => {
			const { MongoClient, ObjectId } = window;
			
			const client = await MongoClient.connect();
			const db = client.db('testdb');
			
			// Insert
			await db.users.insertOne({ name: 'Alice', age: 30 });
			await db.users.insertOne({ name: 'Bob', age: 25 });
			
			// Find
			const users = await (await db.users.find()).toArray();
			
			// Update
			await db.users.updateOne({ name: 'Bob' }, { $set: { age: 26 } });
			const bob = await db.users.findOne({ name: 'Bob' });
			
			// Delete
			await db.users.deleteOne({ name: 'Alice' });
			const count = await db.users.count();
			
			await client.close();
			
			return {
				insertedCount: users.length,
				bobAge: bob.age,
				finalCount: count
			};
		});
		
		expect(result.insertedCount).to.equal(2);
		expect(result.bobAge).to.equal(26);
		expect(result.finalCount).to.equal(1);
	});

	it('should support ObjectId operations', async function() {
		await page.goto(`${BASE_URL}/index.html`);
		
		const result = await page.evaluate(async () => {
			const { MongoClient, ObjectId } = window;
			
			const client = await MongoClient.connect();
			const db = client.db('testdb');
			
			// Create custom ObjectId
			const customId = new ObjectId();
			
			// Insert with custom ID
			await db.items.insertOne({ _id: customId, name: 'Test Item' });
			
			// Query by ObjectId
			const found = await db.items.findOne({ _id: customId });
			
			// Query by hex string
			const found2 = await db.items.findOne({ _id: customId.toString() });
			
			await client.close();
			
			return {
				hasId: !!found._id,
				idMatches: found._id.toString() === customId.toString(),
				foundByHex: !!found2,
				name: found.name
			};
		});
		
		expect(result.hasId).to.be.true;
		expect(result.idMatches).to.be.true;
		expect(result.foundByHex).to.be.true;
		expect(result.name).to.equal('Test Item');
	});

	it('should support query operators', async function() {
		await page.goto(`${BASE_URL}/index.html`);
		
		const result = await page.evaluate(async () => {
			const { MongoClient } = window;
			
			const client = await MongoClient.connect();
			const db = client.db('testdb');
			
			// Insert test data
			await db.products.insertMany([
				{ name: 'Laptop', price: 999 },
				{ name: 'Mouse', price: 25 },
				{ name: 'Keyboard', price: 75 }
			]);
			
			// Test $gt
			const expensive = await (await db.products.find({ price: { $gt: 100 } })).toArray();
			
			// Test $in
			const cheap = await (await db.products.find({ 
				price: { $in: [25, 75] } 
			})).toArray();
			
			// Test $and
			const midRange = await (await db.products.find({ 
				$and: [
					{ price: { $gte: 50 } },
					{ price: { $lte: 200 } }
				]
			})).toArray();
			
			await client.close();
			
			return {
				expensiveCount: expensive.length,
				cheapCount: cheap.length,
				midRangeCount: midRange.length
			};
		});
		
		expect(result.expensiveCount).to.equal(1);
		expect(result.cheapCount).to.equal(2);
		expect(result.midRangeCount).to.equal(1);
	});

	it('should support aggregation pipeline', async function() {
		await page.goto(`${BASE_URL}/index.html`);
		
		const result = await page.evaluate(async () => {
			const { MongoClient } = window;
			
			const client = await MongoClient.connect();
			const db = client.db('testdb');
			
			await db.sales.insertMany([
				{ product: 'Laptop', amount: 999, quantity: 2 },
				{ product: 'Mouse', amount: 25, quantity: 10 },
				{ product: 'Laptop', amount: 999, quantity: 1 }
			]);
			
			const aggregated = await db.sales.aggregate([
				{ $group: { 
					_id: '$product', 
					totalQuantity: { $sum: '$quantity' }
				}},
				{ $sort: { totalQuantity: -1 } }
			]);
			
			await client.close();
			
			return {
				groupCount: aggregated.length,
				firstProduct: aggregated[0]._id,
				firstQuantity: aggregated[0].totalQuantity
			};
		});
		
		expect(result.groupCount).to.equal(2);
		expect(result.firstProduct).to.equal('Mouse');
		expect(result.firstQuantity).to.equal(10);
	});

	it('should support indexes', async function() {
		await page.goto(`${BASE_URL}/index.html`);
		
		const result = await page.evaluate(async () => {
			const { MongoClient } = window;
			
			const client = await MongoClient.connect();
			const db = client.db('testdb');
			
			// Create index
			await db.indexed_collection.createIndex({ age: 1 });
			
			// Insert data
			await db.indexed_collection.insertMany([
				{ name: 'Alice', age: 30 },
				{ name: 'Bob', age: 25 },
				{ name: 'Charlie', age: 35 }
			]);
			
			// Query with index
			const results = await (await db.indexed_collection.find({ age: { $gt: 28 } })).toArray();
			
			// Get indexes
			const indexes = db.indexed_collection.getIndexes();
			
			await client.close();
			
			return {
				resultCount: results.length,
				indexCount: indexes.length,
				hasAgeIndex: indexes.some(idx => idx.key.age === 1)
			};
		});
		
		expect(result.resultCount).to.equal(2);
		expect(result.indexCount).to.equal(1);
		expect(result.hasAgeIndex).to.be.true;
	});
});

