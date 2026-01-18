import { chromium } from 'playwright';
import { expect } from 'chai';

describe("Browser Tests", function() {
	this.timeout(30000); // Increase timeout for browser tests

	// Default to Vite dev server port; override with BASE_URL if running a different server
	const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
	let browser;
	let context;
	let page;

	before(async function() {
		browser = await chromium.launch({ 
			headless: true,
			timeout: 60000,
			args: ['--enable-file-system', '--enable-file-system-write']
		});
	});

	after(async function() {
		if (browser) {
			await browser.close();
		}
	});

	beforeEach(async function() {
		context = await browser.newContext({
			permissions: ['storage-access']
		});
		page = await context.newPage();
		
		// Capture console messages for debugging
		page.on('console', msg => {
			if (msg.type() === 'error') {
				console.log('Browser console error:', msg.text());
			} else if (msg.type() === 'log') {
				console.log('Browser console log:', msg.text());
			}
		});
		
		// Listen to page errors
		page.on('pageerror', error => {
			console.log('Browser page error:', error.message);
		});
		
		// Navigate to index.html
		await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle' });
	});

	afterEach(async function() {
		if (page) {
			await page.close();
		}
		if (context) {
			await context.close();
		}
	});

	// Helper function to run a test via button click and wait for results
	async function runTestViaButton(buttonText, timeout = 10000) {
		// Clear previous output
		await page.evaluate(() => window.clearOutput?.());
		
		// Click the button by its text content
		const buttons = await page.locator('button').all();
		let found = false;
		
		for (const button of buttons) {
			const text = await button.textContent();
			if (text.includes(buttonText)) {
				await button.click();
				found = true;
				break;
			}
		}
		
		if (!found) {
			throw new Error(`Button with text "${buttonText}" not found`);
		}
		
		// Wait for output to appear
		await page.waitForSelector('#output:not([style*="display: none"])', { timeout });
		
		// Wait for the test to complete by polling for completion indicators
		const startTime = Date.now();
		let results;
		while (Date.now() - startTime < timeout) {
			results = await page.evaluate(() => {
				const output = document.getElementById('output');
				const lines = Array.from(output.querySelectorAll('div'))
					.map(div => div.textContent)
					.filter(text => text.trim());
				return {
					lines,
					content: output.innerHTML,
					text: output.textContent
				};
			});
			
			// Check if test has completed (look for success/failure indicators)
			const text = results.text;
			if (text.includes('✓') || text.includes('passed') || 
			    text.includes('Error') || text.includes('failed') ||
			    text.includes('All tests passed')) {
				break;
			}
			
			// Wait a bit before checking again
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		
		return results;
	}

	it('should perform basic CRUD operations', async function() {
		const results = await runTestViaButton('Run Basic Test');
		
		// Check for success indicators in output
		expect(results.text).to.include('✓');
		expect(results.text).to.include('Inserted');
		expect(results.text).to.include('Updated');
		expect(results.text).to.include('Deleted');
		expect(results.text).to.include('Final count');
	});

	it('should support ObjectId operations', async function() {
		const results = await runTestViaButton('Test ObjectId');
		
		// Check for ObjectId test success
		expect(results.text).to.include('ObjectId');
		expect(results.text).to.include('✓');
		expect(results.text).to.include('passed');
	});

	it('should support query operators', async function() {
		const results = await runTestViaButton('Test Queries');
		
		// Check for query test success
		expect(results.text).to.include('query');
		expect(results.text).to.include('✓');
		expect(results.text).to.include('passed');
	});

	it('should support aggregation pipeline', async function() {
		const results = await runTestViaButton('Test Aggregation');
		
		// Check for aggregation test success
		expect(results.text).to.include('aggregation');
		expect(results.text).to.include('✓');
		expect(results.text).to.include('passed');
	});
});

