# MongoDB Comparison Test Harness

This test harness allows you to compare micro-mongo's behavior against a real MongoDB instance to ensure API compatibility and correctness.

## Overview

The comparison test harness executes the same operations against both micro-mongo and real MongoDB, then compares the results to verify that micro-mongo behaves identically to MongoDB. This helps ensure that:

1. **API Compatibility**: Operations work the same way in both implementations
2. **Result Accuracy**: Query results match between implementations
3. **Feature Parity**: New features work consistently with MongoDB behavior

## Architecture

The test harness consists of two main components:

### 1. ComparisonHarness (`test/comparison-harness.js`)

A utility class that:
- Manages connections to both MongoDB and micro-mongo
- Executes operations on both databases in parallel
- Normalizes and compares results
- Reports differences found during testing

### 2. Test Suite (`test/test-mongodb-comparison.js`)

A comprehensive test suite covering:
- Basic CRUD operations (insert, find, update, delete)
- Query operators ($gt, $lt, $in, $and, $or, etc.)
- Update operators ($set, $inc, $push, $unset, etc.)
- Aggregation pipelines ($match, $group, $sort, $project, etc.)
- Complex queries (nested fields, arrays, $elemMatch, $exists, etc.)

## Prerequisites

### 1. Install MongoDB

You need a local MongoDB instance running. Here are platform-specific instructions:

#### macOS (using Homebrew)
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community
```

#### Linux (Ubuntu/Debian)
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Windows
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Run the installer
3. Start MongoDB service from Services panel or run:
   ```cmd
   net start MongoDB
   ```

#### Docker (All Platforms)
```bash
# Pull and run MongoDB in a container
docker run -d -p 27017:27017 --name mongodb mongo:latest

# To stop: docker stop mongodb
# To start again: docker start mongodb
# To remove: docker rm mongodb
```

### 2. Verify MongoDB is Running

```bash
# Check if MongoDB is accepting connections
mongosh --eval "db.version()"

# Or try connecting with the mongo shell
mongosh mongodb://localhost:27017
```

You should see output showing the MongoDB version (e.g., "6.0.x" or "7.0.x").

### 3. Install Required Dependencies

The comparison tests require the official MongoDB Node.js driver:

```bash
# Install the mongodb driver package
npm install mongodb

# Install micro-mongo dependencies (if not already done)
npm install
```

## Running the Tests

### Option 1: Using the npm Script (Recommended)

Add this script to your `package.json`:

```json
{
  "scripts": {
    "test:comparison": "mocha --reporter spec test/test-mongodb-comparison.js"
  }
}
```

Then run:

```bash
npm run test:comparison
```

### Option 2: Direct Mocha Command

```bash
npx mocha --reporter spec test/test-mongodb-comparison.js
```

### Option 3: Include in Regular Test Suite

To run comparison tests alongside regular tests:

```bash
npm test && npm run test:comparison
```

## Test Output

### Successful Run

When tests pass, you'll see output like:

```
MongoDB Comparison Tests
  ✓ Connected to real MongoDB
  ✓ Connected to micro-mongo

  Basic CRUD Operations
    ✓ should insert and find documents identically (234ms)
    ✓ should insert multiple documents identically (156ms)
    ✓ should update documents identically (189ms)
    ✓ should delete documents identically (167ms)

  Query Operators
    ✓ should handle $gt operator (123ms)
    ✓ should handle $lt operator (98ms)
    ✓ should handle $in operator (145ms)
    ...

  35 passing (8s)
```

### Failed Comparison

If results differ between MongoDB and micro-mongo:

```
MongoDB Comparison Tests
  Basic CRUD Operations
    1) should handle $gt operator

  1) MongoDB Comparison Tests
       Basic CRUD Operations
         should handle $gt operator:
     
     Comparison test failed
     
     Differences found:
     
     query_test.find:
       MongoDB: [
         { "_id": "...", "age": 35, "name": "Charlie" }
       ]
       Micro-mongo: [
         { "_id": "...", "age": 35, "name": "Charlie" },
         { "_id": "...", "age": 32, "name": "Eve" }
       ]
       Error: Array length mismatch at root: 2 !== 1
```

## Configuration

### Custom MongoDB URL

By default, tests connect to `mongodb://localhost:27017`. To use a different URL:

```javascript
// In your test file
beforeEach(async function() {
    harness = new ComparisonHarness();
    await harness.connect('mongodb://username:password@host:port', 'test-comparison');
});
```

### Custom Database Name

The default test database is `test-comparison`. To use a different database:

```javascript
await harness.connect('mongodb://localhost:27017', 'my-test-db');
```

### Timeout Configuration

For slow operations or large datasets, increase the Mocha timeout:

```javascript
describe('My Test Suite', function() {
    this.timeout(30000); // 30 seconds
    // ... tests
});
```

## Writing Your Own Comparison Tests

### Basic Pattern

```javascript
import { ComparisonHarness } from './comparison-harness.js';

describe('My Test Suite', function() {
    let harness;
    
    beforeEach(async function() {
        harness = new ComparisonHarness();
        await harness.connect();
    });
    
    afterEach(async function() {
        if (harness) {
            await harness.close();
        }
    });

    it('should do something', async function() {
        const collectionName = 'test_collection';
        
        // Insert test data
        await harness.compareOperation(collectionName, 'insertOne', [
            { name: 'Test', value: 123 }
        ], { skipComparison: true });
        
        // Compare query results
        await harness.compareOperation(collectionName, 'find', [
            { name: 'Test' }
        ]);
        
        // Clean up
        await harness.cleanup(collectionName);
    });
});
```

### Comparing Different Operations

```javascript
// Find operations (returns cursor -> array)
await harness.compareOperation('users', 'find', [{ age: { $gt: 25 } }]);

// FindOne operations (returns single document)
await harness.compareOperation('users', 'findOne', [{ name: 'Alice' }]);

// Insert operations (skip comparison of result object)
await harness.compareOperation('users', 'insertOne', 
    [{ name: 'Bob' }], 
    { skipComparison: true }
);

// Update operations (skip comparison of result object)
await harness.compareOperation('users', 'updateOne',
    [{ name: 'Bob' }, { $set: { age: 30 } }],
    { skipComparison: true }
);

// Aggregation pipelines
await harness.compareOperation('sales', 'aggregate', [
    [
        { $match: { category: 'Electronics' } },
        { $group: { _id: '$category', total: { $sum: '$price' } } }
    ]
]);
```

### Skipping Result Comparison

For write operations (insert, update, delete), you typically want to skip comparing the result object itself (which contains operation metadata that may differ) and instead verify the data:

```javascript
// Insert and skip result comparison
await harness.compareOperation('users', 'insertOne',
    [{ name: 'Charlie', age: 35 }],
    { skipComparison: true }
);

// Then verify the data was inserted correctly
await harness.compareOperation('users', 'findOne', [{ name: 'Charlie' }]);
```

## Troubleshooting

### "Failed to connect to MongoDB"

**Problem**: Cannot connect to MongoDB instance.

**Solutions**:
1. Verify MongoDB is running: `mongosh --eval "db.version()"`
2. Check MongoDB is listening on the correct port: `netstat -an | grep 27017`
3. Check firewall settings
4. Try Docker: `docker run -d -p 27017:27017 mongo:latest`

### "Cannot find module 'mongodb'"

**Problem**: MongoDB driver not installed.

**Solution**:
```bash
npm install mongodb
```

### Tests Timeout

**Problem**: Tests are taking too long and timing out.

**Solutions**:
1. Increase timeout in test suite:
   ```javascript
   describe('My Suite', function() {
       this.timeout(20000); // 20 seconds
   });
   ```
2. Check MongoDB performance with `mongostat`
3. Reduce test data size

### ObjectId Comparison Failures

**Problem**: ObjectIds are compared as different even though they should match.

**Solution**: The harness automatically normalizes ObjectIds to strings for comparison. If you're still seeing issues, verify both databases are using the same ID generation:

```javascript
// Both should generate IDs
await harness.compareOperation('test', 'insertOne', [
    { name: 'Test' } // No _id - let database generate it
], { skipComparison: true });
```

### Cleanup Between Tests

**Problem**: Previous test data interfering with current tests.

**Solution**: Always clean up in `afterEach`:

```javascript
afterEach(async function() {
    await harness.cleanup('my_collection');
    await harness.close();
});
```

## Test Coverage

Current test coverage includes:

- ✅ Basic CRUD (insertOne, insertMany, find, findOne, updateOne, deleteOne)
- ✅ Query operators ($gt, $lt, $gte, $lte, $in, $nin, $and, $or)
- ✅ Update operators ($set, $inc, $push, $unset)
- ✅ Aggregation stages ($match, $group, $sort, $project)
- ✅ Complex queries (nested fields, arrays, $elemMatch, $exists)

To add more test coverage:

1. Add new test cases to `test/test-mongodb-comparison.js`
2. Run the tests to verify behavior matches
3. Submit a PR with your improvements

## Continuous Integration

To run comparison tests in CI/CD:

### GitHub Actions Example

```yaml
name: MongoDB Comparison Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:latest
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm install mongodb
      - run: npm run test:comparison
```

## FAQ

**Q: Do I need to run these tests regularly?**

A: Run comparison tests when:
- Implementing new MongoDB-compatible features
- Fixing bugs in query/update logic
- Verifying behavior matches MongoDB specifications
- Before releasing a new version

**Q: Can I use a remote MongoDB instance?**

A: Yes! Just provide the connection URL:
```javascript
await harness.connect('mongodb://user:pass@remote-host:27017', 'testdb');
```

**Q: What MongoDB versions are supported?**

A: The test harness works with MongoDB 4.0+. We recommend using the latest stable version (6.0 or 7.0).

**Q: Can I use MongoDB Atlas?**

A: Yes, but local MongoDB is recommended for faster tests. For Atlas:
```javascript
await harness.connect(
    'mongodb+srv://username:password@cluster.mongodb.net',
    'testdb'
);
```

**Q: How do I debug test failures?**

A: The harness logs detailed differences:
1. Check console output for result differences
2. Use `console.log()` in test cases to inspect data
3. Connect to MongoDB directly to verify data state: `mongosh mongodb://localhost:27017/test-comparison`

## Contributing

To contribute new comparison tests:

1. Fork the repository
2. Add tests to `test/test-mongodb-comparison.js`
3. Ensure all tests pass: `npm run test:comparison`
4. Submit a PR with description of what you're testing

## License

Same as micro-mongo (MIT License)
