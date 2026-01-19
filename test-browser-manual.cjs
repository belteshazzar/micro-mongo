const playwright = require('playwright');

(async () => {
const browser = await playwright.chromium.launch({ 
headless: true,
args: ['--enable-file-system', '--enable-file-system-write']
});

try {
const context = await browser.newContext({
permissions: ['storage-access']
});
const page = await context.newPage();

// Capture console messages
page.on('console', msg => {
console.log(`Browser ${msg.type()}:`, msg.text());
});

// Listen to page errors
page.on('pageerror', error => {
console.log('Browser error:', error.message);
});

// Navigate to test page
console.log('Loading test page...');
await page.goto('http://localhost:8080/test-db-watch-demo.html', { 
waitUntil: 'networkidle',
timeout: 30000
});

// Click the run test button
console.log('Running test...');
await page.click('button:has-text("Run Test")');

// Wait for test to complete
await page.waitForFunction(() => {
const output = document.getElementById('output').textContent;
return output.includes('TEST PASSED') || output.includes('TEST FAILED');
}, { timeout: 10000 });

// Take screenshot
await page.screenshot({ path: 'db-watch-test-result.png' });
console.log('Screenshot saved to db-watch-test-result.png');

// Get the final output
const output = await page.evaluate(() => {
return document.getElementById('output').textContent;
});

console.log('\n=== Browser Test Output ===');
console.log(output);
console.log('===========================\n');

// Check if test passed
if (output.includes('TEST PASSED')) {
console.log('✅ Browser test PASSED!');
process.exit(0);
} else {
console.log('❌ Browser test FAILED!');
process.exit(1);
}
} catch (error) {
console.error('Error running browser test:', error);
process.exit(1);
} finally {
await browser.close();
}
})();
