# TextIndex vs TXI Comparison Results

This document compares our custom `TextIndex` implementation with the `txi` npm package.

## Recent Updates (November 2025)

**TextIndex has been enhanced with relevance scoring!** It now supports both:
- **Scored/Ranked results** (default): Like TXI, returns documents ranked by relevance
- **Strict AND mode** (`requireAll: true`): Only returns documents containing ALL query terms

## API Differences

### TextIndex (Our Implementation)
- **Synchronous** API
- **Dual-mode querying**: Relevance-based OR strict AND
- Methods:
  - `add(docId, text)` - Add document to index
  - `remove(docId)` - Remove document from index
  - `query(queryText, options)` - Search for documents
    - `options.scored` (default: true) - Return scored results or just IDs
    - `options.requireAll` (default: false) - Require ALL terms (AND) or rank by relevance
  - `getTermCount()` - Get number of unique terms
  - `getDocumentCount()` - Get number of indexed documents
  - `clear()` - Clear all index data

### TXI (npm package)
- **Asynchronous** API (returns Promises)
- Methods:
  - `index(id, content)` - Add document to index
  - `remove(id)` - Remove document from index
  - `search(query)` - Search for documents (returns scored results)
- No built-in statistics methods

## Query Behavior

### Default Behavior (Scored/Ranked)
Both implementations now use **relevance-based ranking**:

**TextIndex**: 
```javascript
const results = textIndex.query('lazy dog');
// Returns: [
//   { id: 'doc1', score: 0.317 },  // Has both terms
//   { id: 'doc3', score: 0.196 },  // Has 'lazy'
//   { id: 'doc5', score: 0.128 },  // Has 'dog'
//   { id: 'doc2', score: 0.096 }   // Has 'dog'
// ]
```

**TXI**:
```javascript
const results = await txiIndex.search('lazy dog');
// Returns: [
//   { id: 'doc1', score: 7.5 },   // Has both terms
//   { id: 'doc2', score: 3.75 },  // Has 'dog'
//   { id: 'doc5', score: 3.75 },  // Has 'dog'
//   { id: 'doc3', score: 2.75 }   // Has 'lazy'
// ]
```

### Strict AND Mode (TextIndex only)
TextIndex supports strict AND logic when needed:
```javascript
const results = textIndex.query('lazy dog', { requireAll: true, scored: false });
// Returns: ['doc1']  // Only documents with BOTH terms
```

## Scoring Algorithm

### TextIndex Scoring (TF-IDF)
Uses classic **TF-IDF** (Term Frequency-Inverse Document Frequency):

1. **TF (Term Frequency)**: `termCount / documentLength`
2. **IDF (Inverse Document Frequency)**: `log(totalDocs / docsWithTerm)`
3. **TF-IDF Score**: `TF × IDF`
4. **Coverage Bonus**: Score multiplied by `(1 + matchingTerms/queryTerms)`

Example:
- Document with both query terms gets 2x coverage bonus
- Document with 1 of 2 query terms gets 1.5x coverage bonus

### TXI Scoring
Uses a more complex algorithm incorporating:
- **Stems**: Stemmed word matches
- **Trigrams**: 3-character sequences
- **Compressions**: Disemvoweled versions
- **Misspellings**: Common typo patterns

TXI's scoring is more sophisticated but harder to predict.

## Performance Comparison

### Indexing 1000 Documents
- **TextIndex**: 8ms
- **TXI**: 79ms
- **Result**: TextIndex is ~10x faster for indexing

### 100 Queries on 1000 Documents
- **TextIndex**: 43ms
- **TXI**: 1143ms
- **Result**: TextIndex is ~27x faster for queries (even with scoring!)

## Key Differences Summary

| Feature | TextIndex | TXI |
|---------|-----------|-----|
| API Style | Synchronous | Asynchronous |
| Default Query Logic | Scored ranking (OR with relevance) | Scored ranking |
| Strict AND Support | Yes (`requireAll: true`) | No |
| Return Format | Configurable (scored or IDs) | Always scored objects |
| Scoring Algorithm | TF-IDF | Stems+Trigrams+Compressions+Misspellings |
| Performance | Very fast (optimized) | Slower (richer features) |
| Statistics | Built-in methods | Not available |
| Use Case | Fast, flexible text search | Complex fuzzy matching |

## TXI Scoring Example

When searching for "lazy dog", TXI returns:
```javascript
[
  { id: 'doc1', score: 7.5 },   // Contains both "lazy" and "dog"
  { id: 'doc2', score: 3.75 },  // Contains only "dog"
  { id: 'doc5', score: 3.75 },  // Contains only "dog"
  { id: 'doc3', score: 2.75 }   // Contains only "lazy"
]
```

TextIndex with default settings returns similar results:
```javascript
[
  { id: 'doc1', score: 0.317 },  // Contains both (highest)
  { id: 'doc3', score: 0.196 },  // Contains "lazy"
  { id: 'doc5', score: 0.128 },  // Contains "dog"
  { id: 'doc2', score: 0.096 }   // Contains "dog"
]
```

The scoring takes into account:
- **TF-IDF**: Term frequency weighted by inverse document frequency  
- **Coverage**: Documents matching more query terms score higher

## Recommendations

### Use TextIndex When:
- You need **fast** indexing and queries
- You want **scored relevance ranking** (like search engines)
- You sometimes need **strict AND** search behavior
- You need **synchronous** operations
- You want flexible output formats (scored results or just IDs)
- Performance is critical
- You need simple, predictable TF-IDF scoring

### Use TXI When:
- You need **fuzzy matching** and misspelling tolerance
- You want **trigram-based** partial word matching
- You can work with **async/await**
- You need advanced features beyond basic stemming
- Rich scoring information with multiple signals is valuable
- You're okay with slower performance for better match quality

## Conclusion

TextIndex now provides **the best of both worlds**:
1. **Performance**: Significantly faster than TXI (~10x indexing, ~27x querying)
2. **Flexibility**: Supports both relevance ranking AND strict matching
3. **Simplicity**: Synchronous API, easier to use
4. **Predictability**: Classic TF-IDF scoring is well-understood

For micro-mongo's use case:
- ✅ Fast in-memory operations
- ✅ Relevance scoring like modern search engines  
- ✅ Strict AND mode when needed (MongoDB compatibility)
- ✅ Synchronous API fits the codebase
- ✅ No dependency on external async libraries

TextIndex is the clear choice for micro-mongo's text search needs!
