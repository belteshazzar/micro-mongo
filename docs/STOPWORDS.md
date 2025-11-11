# Stop Words in TextIndex

## Overview

Stop words are common words (like "the", "a", "and") that don't add semantic value to text searches. By filtering them out during indexing, we can:
- **Reduce index size** by 20-30%
- **Improve query relevance** by focusing on meaningful terms
- **Speed up searches** with fewer terms to process

## Default Behavior

Stop word filtering is **enabled by default**. The TextIndex uses a curated list of 90+ common English stop words based on the TXI package implementation.

```javascript
const index = new TextIndex();
index.add('doc1', 'The quick brown fox jumps over the lazy dog');

// Only meaningful words are indexed:
// 'quick', 'brown', 'fox', 'jump', 'lazi', 'dog'
// 'the' and 'over' are filtered out
```

## Configuration

### Disable Stop Word Filtering

```javascript
const index = new TextIndex({ useStopWords: false });
// All words will be indexed, including stop words
```

### Custom Stop Words

```javascript
// Start with default stop words
const index = new TextIndex();

// Add custom stop words
index.addStopWords('custom', 'project-specific', 'terms');

// Or provide a custom set
const customStops = new Set(['foo', 'bar', 'baz']);
const index2 = new TextIndex({ stopWords: customStops });
```

### Modify Stop Word List

```javascript
const index = new TextIndex();

// Add words to filter
index.addStopWords('example', 'demo');

// Remove words from filtering
index.removeStopWords('the', 'and');

// Toggle filtering on/off
index.setStopWordFiltering(false); // disable
index.setStopWordFiltering(true);  // enable
```

## Stop Word List

The default stop words include:

**Articles & Determiners:** a, an, the, this, that, these, those

**Conjunctions:** and, or, but, nor, yet, so

**Prepositions:** in, on, at, to, for, of, with, by, from, about, after, before, between, during, through, over, under

**Pronouns:** i, me, my, we, our, you, your, he, him, his, she, her, it, they, them, their

**Auxiliary Verbs:** am, is, are, was, were, be, been, being, have, has, had, do, does, did

**Common Verbs:** get, got, make, come, came, go, said, see

**Quantifiers:** all, some, any, many, much, more, most, few, both, each, every, either, neither, another, other

**Adverbs:** how, when, where, why, here, there, now, then, also, only, just, never, very

**Modals:** can, could, may, might, must, should, would, will

And more...

## Query Behavior

Stop words are filtered from both indexed text AND query text:

```javascript
const index = new TextIndex();
index.add('doc1', 'The quick brown fox');
index.add('doc2', 'A lazy dog');
index.add('doc3', 'The brown dog');

// Query: "the brown" -> filters 'the', searches for 'brown'
const results = index.query('the brown');
// Returns: doc1 and doc3 (both contain 'brown')
```

## Performance Impact

### Index Size
- **With stop words:** ~70-75% of original size
- **Example:** "The quick brown fox jumps over the lazy dog"
  - Without filtering: 8 unique terms
  - With filtering: 6 unique terms (25% reduction)

### Query Speed
- Filtering adds negligible overhead (~microseconds)
- Smaller index means faster searches overall
- Fewer terms to score and rank

### Relevance
- Better precision by focusing on content words
- Reduced noise from common words
- More meaningful TF-IDF scores

## Integration with TF-IDF

Stop word filtering complements TF-IDF scoring:

1. **Term Frequency (TF):** Stop words would have high frequency but low value
2. **Inverse Document Frequency (IDF):** Stop words appear in most documents, lowering IDF
3. **Result:** Even without explicit filtering, stop words naturally score low
4. **With filtering:** Index is cleaner and more efficient

## Implementation Notes

- Each TextIndex instance gets its own copy of the stop word set
- Modifying stop words on one instance doesn't affect others
- Stop words are case-insensitive
- Stemming is applied AFTER stop word filtering
- Stop word changes only affect newly indexed documents (existing documents are not re-indexed)

## Best Practices

1. **Use default filtering** for most text search applications
2. **Disable filtering** for exact phrase matching or when every word matters
3. **Add domain-specific stop words** for specialized applications
4. **Profile before optimizing** - measure actual impact on your data
5. **Document your configuration** when using custom stop words

## Testing

The TextIndex includes comprehensive stop word tests:
- Default filtering behavior
- Disabling stop word filtering  
- Adding custom stop words
- Removing stop words from the list
- Toggling filtering on/off
- Query behavior with stop words

Run tests: `npm test -- test/test-TextIndex.js --grep "Stop Words"`

## See Also

- [TEXT_INDEX.md](./TEXT_INDEX.md) - Full TextIndex documentation
- [TEXTINDEX-COMPARISON.md](./TEXTINDEX-COMPARISON.md) - Comparison with TXI package
- [TF-IDF Scoring](./TEXT_INDEX.md#relevance-scoring) - How relevance is calculated
