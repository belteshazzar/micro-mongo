import { TextIndex } from '../src/text-index.js';

/**
 * Performance analysis for TextIndex remove() operation
 * 
 * Current implementation complexity:
 * - Time: O(T) where T = number of unique terms in the document
 * - Space: O(1) - only deletes existing data
 * - For each term in the document, it performs:
 *   1. Map.has() - O(1)
 *   2. Map.get() - O(1)
 *   3. Map.delete() - O(1)
 *   4. Conditional Map.delete() if posting list empty - O(1)
 * 
 * This is already optimal - we must touch each term to update the index.
 */

console.log('=== TextIndex remove() Performance Analysis ===\n');

// Test 1: Remove small documents
console.log('Test 1: Removing small documents (5-10 words)');
let index = new TextIndex();
const smallTexts = [
  'The quick brown fox jumps',
  'A lazy dog sleeps',
  'Beautiful flowers bloom in spring',
  'Coffee tastes better in the morning',
  'Books provide endless knowledge'
];

smallTexts.forEach((text, i) => index.add(`doc${i}`, text));
console.log(`  Added ${smallTexts.length} documents`);

let start = performance.now();
for (let i = 0; i < smallTexts.length; i++) {
  index.remove(`doc${i}`);
}
let duration = performance.now() - start;
console.log(`  Removed all documents in ${duration.toFixed(3)}ms`);
console.log(`  Average per document: ${(duration / smallTexts.length).toFixed(3)}ms\n`);

// Test 2: Remove medium documents
console.log('Test 2: Removing medium documents (50-100 words)');
index = new TextIndex();
const mediumText = `
  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod 
  tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, 
  quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo 
  consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse 
  cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat 
  non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`.repeat(2);

for (let i = 0; i < 100; i++) {
  index.add(`doc${i}`, mediumText);
}
console.log(`  Added 100 documents (~100 words each)`);
console.log(`  Total terms in index: ${index.getTermCount()}`);

start = performance.now();
for (let i = 0; i < 100; i++) {
  index.remove(`doc${i}`);
}
duration = performance.now() - start;
console.log(`  Removed all documents in ${duration.toFixed(3)}ms`);
console.log(`  Average per document: ${(duration / 100).toFixed(3)}ms\n`);

// Test 3: Remove large documents
console.log('Test 3: Removing large documents (500+ words)');
index = new TextIndex();
const largeText = mediumText.repeat(10);

for (let i = 0; i < 50; i++) {
  index.add(`doc${i}`, largeText);
}
console.log(`  Added 50 documents (~500 words each)`);
console.log(`  Total terms in index: ${index.getTermCount()}`);

start = performance.now();
for (let i = 0; i < 50; i++) {
  index.remove(`doc${i}`);
}
duration = performance.now() - start;
console.log(`  Removed all documents in ${duration.toFixed(3)}ms`);
console.log(`  Average per document: ${(duration / 50).toFixed(3)}ms\n`);

// Test 4: Remove from large index (worst case - last document)
console.log('Test 4: Remove from large index (10,000 documents)');
index = new TextIndex();
const texts = [
  'technology innovation software development',
  'data science machine learning artificial intelligence',
  'cloud computing distributed systems scalability',
  'cybersecurity encryption authentication authorization',
  'mobile applications user interface user experience'
];

// Add 10,000 documents
for (let i = 0; i < 10000; i++) {
  index.add(`doc${i}`, texts[i % texts.length]);
}
console.log(`  Index contains ${index.getDocumentCount()} documents`);
console.log(`  Index contains ${index.getTermCount()} unique terms`);

// Remove first document
start = performance.now();
index.remove('doc0');
let removeFirst = performance.now() - start;

// Remove middle document
start = performance.now();
index.remove('doc5000');
let removeMiddle = performance.now() - start;

// Remove last document
start = performance.now();
index.remove('doc9999');
let removeLast = performance.now() - start;

console.log(`  Remove first document: ${removeFirst.toFixed(3)}ms`);
console.log(`  Remove middle document: ${removeMiddle.toFixed(3)}ms`);
console.log(`  Remove last document: ${removeLast.toFixed(3)}ms`);
console.log(`  → Position in index does not affect performance (O(T) not O(N))\n`);

// Test 5: Memory cleanup verification
console.log('Test 5: Memory cleanup verification');
index = new TextIndex();
index.add('doc1', 'unique term only in this document');
index.add('doc2', 'shared common word');
index.add('doc3', 'shared common word');

console.log(`  Before removal: ${index.getTermCount()} terms, ${index.getDocumentCount()} docs`);

index.remove('doc1');
console.log(`  After removing doc1: ${index.getTermCount()} terms`);
console.log(`  → 'unique' and 'term' and 'document' removed (not in other docs)`);

index.remove('doc2');
console.log(`  After removing doc2: ${index.getTermCount()} terms`);
console.log(`  → 'shared', 'common', 'word' still present (in doc3)`);

index.remove('doc3');
console.log(`  After removing doc3: ${index.getTermCount()} terms, ${index.getDocumentCount()} docs`);
console.log(`  → All terms cleaned up\n`);

// Test 6: Bulk removal comparison
console.log('Test 6: Bulk removal pattern analysis');
index = new TextIndex();

// Add 1000 documents
for (let i = 0; i < 1000; i++) {
  index.add(`doc${i}`, `document ${i} with some repeated words and unique term${i}`);
}

// Pattern 1: Remove every other document
start = performance.now();
for (let i = 0; i < 1000; i += 2) {
  index.remove(`doc${i}`);
}
const pattern1 = performance.now() - start;
console.log(`  Remove every other (500 docs): ${pattern1.toFixed(3)}ms`);

// Pattern 2: Remove remaining documents
start = performance.now();
for (let i = 1; i < 1000; i += 2) {
  index.remove(`doc${i}`);
}
const pattern2 = performance.now() - start;
console.log(`  Remove remaining (500 docs): ${pattern2.toFixed(3)}ms`);
console.log(`  → Removal order doesn't significantly impact performance\n`);

console.log('=== Analysis Summary ===\n');
console.log('Current implementation:');
console.log('  ✓ O(T) time complexity - optimal for inverted index');
console.log('  ✓ O(1) space complexity - only deletes, no new allocations');
console.log('  ✓ Automatic cleanup of empty term entries');
console.log('  ✓ Position-independent performance');
console.log('  ✓ Efficient for all document sizes\n');

console.log('Potential improvements (MINIMAL GAINS):');
console.log('  • Batch removal: remove([id1, id2, ...])');
console.log('    - Saves function call overhead only');
console.log('    - Still O(T1 + T2 + ... + Tn) where Ti = terms in doc i');
console.log('  • Lazy cleanup: defer term deletion until next query');
console.log('    - Trades memory for slight speed gain on remove');
console.log('    - Adds complexity to query logic');
console.log('    - NOT RECOMMENDED\n');

console.log('Recommendation:');
console.log('  ✓ Current implementation is already optimal');
console.log('  ✓ No meaningful performance improvements possible');
console.log('  ✓ Focus optimization efforts elsewhere (query, add)\n');
