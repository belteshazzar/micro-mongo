# TextIndex

A standalone text index implementation using the Porter stemmer algorithm for English text. This module provides full-text search capabilities with support for adding, removing, and querying indexed terms.

## Features

- **Porter Stemmer Algorithm**: Uses the industry-standard Porter stemmer to normalize words to their root forms
- **Case-Insensitive**: Automatically handles case-insensitive matching
- **Punctuation Handling**: Intelligently parses text and handles punctuation
- **Document Management**: Add, remove, and update indexed documents
- **Efficient Querying**: Fast lookup with AND operation across multiple terms

## Installation

The TextIndex class is included in this repository and uses the `stemmer` npm package:

```bash
npm install stemmer
```

## Usage

### Basic Example

```javascript
import { TextIndex } from './text-index.js';

// Create a new index
const index = new TextIndex();

// Add documents to the index
index.add('doc1', 'The quick brown fox jumps over the lazy dog');
index.add('doc2', 'A fast brown fox');
index.add('doc3', 'The lazy cat sleeps');

// Query the index
const results = index.query('brown fox');
console.log(results); // ['doc1', 'doc2']

// Query with stemming
const results2 = index.query('jumping'); // Stems to 'jump', matches 'jumps'
console.log(results2); // ['doc1']

// Remove a document
index.remove('doc1');

// Query again
const results3 = index.query('brown fox');
console.log(results3); // ['doc2']
```

### API Reference

#### `constructor()`
Creates a new TextIndex instance.

```javascript
const index = new TextIndex();
```

#### `add(docId, text)`
Adds or updates a document in the index.

- `docId` (string): Unique identifier for the document
- `text` (string): The text content to index

```javascript
index.add('blog1', 'How to learn JavaScript programming');
```

#### `remove(docId)`
Removes a document from the index.

- `docId` (string): The document identifier to remove
- Returns: `boolean` - true if document was found and removed, false otherwise

```javascript
const removed = index.remove('blog1');
```

#### `query(queryText)`
Searches the index for documents containing all of the query terms (AND operation).

- `queryText` (string): The search query
- Returns: `string[]` - Array of document IDs that match the query

```javascript
const results = index.query('JavaScript programming');
```

#### `getTermCount()`
Returns the number of unique terms in the index.

```javascript
const count = index.getTermCount();
```

#### `getDocumentCount()`
Returns the number of documents in the index.

```javascript
const count = index.getDocumentCount();
```

#### `clear()`
Removes all documents and terms from the index.

```javascript
index.clear();
```

## How It Works

### Stemming
The TextIndex uses the Porter stemmer algorithm to normalize words. For example:
- "running", "runs", "run" all stem to "run"
- "jumping", "jumps", "jumped" all stem to "jump"

This allows queries to match different forms of the same word.

### Tokenization
Text is tokenized by:
1. Converting to lowercase
2. Splitting on non-word characters
3. Filtering out empty strings

### Query Matching
Queries use an AND operation, meaning all query terms must be present in a document for it to match:

```javascript
index.add('doc1', 'The quick brown fox');
index.add('doc2', 'The lazy brown dog');

// Returns both docs (both have 'brown')
index.query('brown'); // ['doc1', 'doc2']

// Returns only doc1 (only doc1 has both 'brown' AND 'fox')
index.query('brown fox'); // ['doc1']
```

## Example: Blog Search

```javascript
import { TextIndex } from './text-index.js';

const index = new TextIndex();

// Index blog posts
index.add('post-1', 'Introduction to JavaScript: A Beginner Guide');
index.add('post-2', 'Advanced JavaScript Techniques for Experts');
index.add('post-3', 'Python vs JavaScript: Which to Learn First?');
index.add('post-4', 'Building Web Applications with JavaScript');

// Search for JavaScript posts
const jsResults = index.query('JavaScript');
console.log(jsResults); // ['post-1', 'post-2', 'post-3', 'post-4']

// Search for advanced JavaScript content
const advancedResults = index.query('advanced JavaScript');
console.log(advancedResults); // ['post-2']

// Search for learning content
const learnResults = index.query('learn');
console.log(learnResults); // ['post-3'] (matches 'Learn')

// Update a post (remove old, add new)
index.remove('post-1');
index.add('post-1', 'Introduction to TypeScript: A Beginner Guide');

// Search again
const tsResults = index.query('TypeScript');
console.log(tsResults); // ['post-1']
```

## Testing

Run the comprehensive test suite:

```bash
npm test -- test/test-text-index.js
```

The test suite includes:
- Basic add/remove/query operations
- Stemming verification
- Case-insensitive matching
- Punctuation handling
- Edge cases (empty text, null values, etc.)
- Integration tests with realistic scenarios

## Future Enhancements

This is a standalone module designed to be tested independently. Potential future enhancements could include:

- OR query support
- Phrase queries
- Term frequency/relevance scoring
- Support for additional languages
- Stop word filtering
- Integration with the main mongo-local-db collection API

## License

MIT
