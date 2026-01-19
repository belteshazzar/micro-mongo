# Fix for "should watch all collections in database" Test

## Summary
Fixed the failing test "should watch all collections in database" by implementing synchronous return of ProxyChangeStream from `db.watch()`.

## Problem
The test was failing with:
```
TypeError: changeStream.on is not a function
```

This occurred because `db.watch()` was returning a Promise instead of a ProxyChangeStream object, preventing immediate use of EventEmitter methods like `.on()`.

## Root Cause
- ProxyDB's `watch` method was using the generic `_call()` approach which returns a Promise
- ProxyCollection had a specialized `_watch()` method for synchronous return
- The MongoDB API expects `watch()` to return a stream object synchronously

## Solution
Added synchronous watch support to ProxyDB:

### Changes Made
**File: `src/client/ProxyDB.js`**

1. Added watch handler in proxy get trap (line 54-56):
```javascript
if (prop === 'watch') {
  return (...args) => target._watch(...args);
}
```

2. Added `_watch()` method (line 112-119):
```javascript
_watch(pipeline = [], options = {}) {
  return ProxyChangeStream.create({
    bridge: this.bridge,
    database: this.dbName,
    collection: null,
    pipeline,
    options
  });
}
```

## Test Results

### Node.js Tests
- ✅ "should watch all collections in database" - **PASSING**
- ✅ 544 tests passing in total
- Note: 1 unrelated failing test (async iteration) existed before this fix

### Browser Tests
Successfully verified in Chromium:
- ✅ Change stream created successfully
- ✅ `changeStream.on` is a function
- ✅ Collections can be watched
- ✅ Multiple collection insertions detected

## Verification Commands
```bash
# Run specific test
npm test -- --grep "should watch all collections in database"

# Run all tests
npm test

# Run browser tests (requires dev server)
npm run test:browser
```

## Files Modified
- `src/client/ProxyDB.js` - Added `_watch()` method and proxy handler

## Files Created (for testing/demonstration)
- `test-db-watch-demo.html` - Browser demo page
- `test-browser-manual.cjs` - Browser test script
- `db-watch-test-result.png` - Screenshot of browser test

## Impact
- Database-level change streams now work correctly in both Node.js and browser
- No breaking changes to existing functionality
- Aligns with MongoDB API expectations
