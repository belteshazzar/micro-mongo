import { TextIndex } from '../text-index.js';

// Test with stop words enabled (default)
const index1 = new TextIndex();
index1.add('doc1', 'The quick brown fox jumps over the lazy dog');
console.log('With stop words filtering:');
console.log('  Terms indexed:', index1.getTermCount());
console.log('  Document length:', index1.documentLengths.get('doc1'));

// Test without stop words
const index2 = new TextIndex({ useStopWords: false });
index2.add('doc1', 'The quick brown fox jumps over the lazy dog');
console.log('\nWithout stop words filtering:');
console.log('  Terms indexed:', index2.getTermCount());
console.log('  Document length:', index2.documentLengths.get('doc1'));

// Show what terms were indexed
console.log('\nWith stop words - indexed terms:');
console.log(' ', Array.from(index1.index.keys()).sort());

console.log('\nWithout stop words - indexed terms:');
console.log(' ', Array.from(index2.index.keys()).sort());

// Test querying
const results1 = index1.query('the quick brown fox', { scored: false });
const results2 = index2.query('the quick brown fox', { scored: false });
console.log('\nQuery "the quick brown fox":');
console.log('  With stop words:', results1);
console.log('  Without stop words:', results2);
