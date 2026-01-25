# Browser Testing with Playwright

This directory contains browser tests for babymongo using Playwright.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install chromium
```

3. Build the project:
```bash
npm run build
```

4. Start a local HTTP server (in a separate terminal):
```bash
npm run dev
```

Or use any other static file server on port 8080.

## Running Tests

Run browser tests only:
```bash
npm run test:browser
```

Run all tests (Node.js + Browser):
```bash
npm run test:all
```

## Test Files

- `test-browser.js` - Main browser test suite using Playwright
- `../test-browser-simple.html` - Simple test page for basic functionality
- `../index.html` - Full development page with interactive tests

## What's Tested

The browser tests verify that babymongo works correctly in a real browser environment:

1. **Basic Setup** - Collection creation and initialization
2. **CRUD Operations** - Insert, find, update, delete
3. **ObjectId Support** - ObjectId creation and querying
4. **Query Operators** - $gt, $in, $and, etc.
5. **Aggregation Pipeline** - $group, $sort, etc.
6. **Indexes** - Index creation and usage

## Environment Variables

- `BASE_URL` - Base URL for the test server (default: `http://localhost:8080`)

Example:
```bash
BASE_URL=http://localhost:3000 npm run test:browser
```

## Troubleshooting

### Tests timeout
- Make sure the HTTP server is running on the correct port
- Check that the build files exist in `build/` directory
- Verify the browser installed correctly with `npx playwright install chromium`

### Module import errors
- Run `npm run build` to generate the bundled files
- The test pages use the built version from `build/babymongo-1.1.3.js`
- Make sure the simple HTTP server can serve static files

### Port conflicts
- The default port is 8080
- Change it via `BASE_URL` environment variable
- Make sure no other process is using the port
