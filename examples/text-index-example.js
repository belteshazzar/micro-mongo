#!/usr/bin/env node
/**
 * Example usage of the TextIndex class
 * 
 * This script demonstrates how to use the TextIndex for full-text search
 * Run with: node examples/text-index-example.js
 */

import { TextIndex } from '../text-index.js';

console.log('='.repeat(60));
console.log('TextIndex Example - Porter Stemmer Algorithm');
console.log('='.repeat(60));

// Create a new index
const index = new TextIndex();

// Example 1: Indexing blog posts
console.log('\n📚 Example 1: Blog Post Search\n');

const blogPosts = {
  'post-1': 'Introduction to JavaScript: A Beginner Guide',
  'post-2': 'Advanced JavaScript Techniques for Experts',
  'post-3': 'Python vs JavaScript: Which to Learn First?',
  'post-4': 'Building Web Applications with JavaScript',
  'post-5': 'Getting Started with Python Programming'
};

// Index all blog posts
Object.entries(blogPosts).forEach(([id, content]) => {
  index.add(id, content);
  console.log(`✓ Indexed: ${id} - "${content}"`);
});

console.log(`\n📊 Statistics:`);
console.log(`   - Documents indexed: ${index.getDocumentCount()}`);
console.log(`   - Unique terms: ${index.getTermCount()}`);

// Search examples
console.log('\n🔍 Search Examples:\n');

const searches = [
  'JavaScript',
  'JavaScript programming',
  'learning',  // Will match 'learn' via stemming
  'building applications',
  'Python'
];

searches.forEach(query => {
  const results = index.query(query);
  console.log(`Query: "${query}"`);
  console.log(`Results: ${results.length > 0 ? results.join(', ') : 'No matches'}`);
  if (results.length > 0) {
    results.forEach(id => {
      console.log(`  → ${id}: ${blogPosts[id]}`);
    });
  }
  console.log();
});

// Example 2: Document removal and update
console.log('\n📝 Example 2: Updating Content\n');

console.log('Removing post-1...');
index.remove('post-1');
console.log(`✓ Documents after removal: ${index.getDocumentCount()}`);

console.log('\nAdding updated version of post-1...');
index.add('post-1', 'Complete TypeScript Guide for Beginners');
console.log('✓ Updated post-1');

const tsResults = index.query('TypeScript');
console.log(`\nSearch for "TypeScript": ${tsResults.join(', ')}`);
console.log(`  → ${tsResults[0]}: ${blogPosts['post-1'] = 'Complete TypeScript Guide for Beginners'}`);

// Example 3: Stemming demonstration
console.log('\n🌿 Example 3: Stemming Demonstration\n');

index.clear();
index.add('doc1', 'running quickly');
index.add('doc2', 'runs fast');
index.add('doc3', 'run slowly');

console.log('Indexed documents:');
console.log('  - doc1: "running quickly"');
console.log('  - doc2: "runs fast"');
console.log('  - doc3: "run slowly"');

console.log('\nSearching for different forms of "run":');
['run', 'runs', 'running'].forEach(form => {
  const results = index.query(form);
  console.log(`  "${form}" → ${results.join(', ')}`);
});

// Example 4: Complex queries
console.log('\n🎯 Example 4: Complex Queries (AND operation)\n');

index.clear();
index.add('recipe1', 'Chocolate cake with vanilla frosting');
index.add('recipe2', 'Vanilla ice cream with chocolate chips');
index.add('recipe3', 'Strawberry cake with cream');
index.add('recipe4', 'Chocolate cookies');

console.log('Indexed recipes:');
console.log('  - recipe1: "Chocolate cake with vanilla frosting"');
console.log('  - recipe2: "Vanilla ice cream with chocolate chips"');
console.log('  - recipe3: "Strawberry cake with cream"');
console.log('  - recipe4: "Chocolate cookies"');

console.log('\nComplex searches:');
const complexQueries = [
  { query: 'chocolate', desc: 'Single term' },
  { query: 'chocolate cake', desc: 'Multiple terms (AND)' },
  { query: 'vanilla chocolate', desc: 'Both terms required' },
  { query: 'strawberry chocolate', desc: 'No match (different recipes)' }
];

complexQueries.forEach(({ query, desc }) => {
  const results = index.query(query);
  console.log(`  "${query}" (${desc})`);
  console.log(`    → ${results.length > 0 ? results.join(', ') : 'No matches'}`);
});

console.log('\n' + '='.repeat(60));
console.log('✅ Example completed successfully!');
console.log('='.repeat(60));
