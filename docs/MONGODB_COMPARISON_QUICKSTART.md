# MongoDB Comparison Test Harness - Quick Start

This is a quick reference for the MongoDB comparison test harness. For full documentation, see [docs/MONGODB_COMPARISON.md](docs/MONGODB_COMPARISON.md).

## What is it?

A test harness that runs the same operations on both micro-mongo and real MongoDB, then compares the results to ensure compatibility.

## Quick Start

### 1. Setup MongoDB

**Using Docker (Easiest)**:
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Or install locally**: See platform-specific instructions in [docs/MONGODB_COMPARISON.md](docs/MONGODB_COMPARISON.md#1-install-mongodb)

### 2. Install Dependencies

```bash
npm install mongodb
```

### 3. Run Tests

```bash
npm run test:comparison
```

## Example Output

```
MongoDB Comparison Tests
  ✓ Connected to real MongoDB
  ✓ Connected to micro-mongo

  Basic CRUD Operations
    ✓ should insert and find documents identically (234ms)
    ✓ should insert multiple documents identically (156ms)
    ✓ should update documents identically (189ms)

  Query Operators
    ✓ should handle $gt operator (123ms)
    ✓ should handle $in operator (145ms)
    ✓ should handle $and operator (178ms)

  35 passing (8s)
```

## What's Tested?

- ✅ CRUD operations (insert, find, update, delete)
- ✅ Query operators ($gt, $lt, $in, $and, $or, etc.)
- ✅ Update operators ($set, $inc, $push, $unset, etc.)
- ✅ Aggregation pipelines ($match, $group, $sort, $project, etc.)
- ✅ Complex queries (nested fields, arrays, $elemMatch, etc.)

## Writing Your Own Tests

```javascript
import { ComparisonHarness } from './test/comparison-harness.js';

describe('My Custom Tests', function() {
    let harness;
    
    beforeEach(async function() {
        harness = new ComparisonHarness();
        await harness.connect();
    });
    
    afterEach(async function() {
        await harness.close();
    });

    it('should match MongoDB behavior', async function() {
        // Insert data (skip result comparison for write ops)
        await harness.compareOperation('users', 'insertOne', [
            { name: 'Alice', age: 30 }
        ], { skipComparison: true });
        
        // Compare query results
        await harness.compareOperation('users', 'find', [
            { age: { $gte: 25 } }
        ]);
        
        // Clean up
        await harness.cleanup('users');
    });
});
```

## Learn More

See [docs/MONGODB_COMPARISON.md](docs/MONGODB_COMPARISON.md) for:
- Detailed setup instructions for all platforms
- Troubleshooting guide
- Advanced configuration options
- CI/CD integration examples
- Complete API reference
