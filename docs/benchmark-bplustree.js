/**
 * Performance Benchmark: BPlusTree vs ImmutableBPlusTree
 * 
 * This benchmark compares the performance of the mutable and immutable
 * B+ tree implementations across various operations.
 */

import {BPlusTree} from '../src/BPlusTree.js';
import {ImmutableBPlusTree} from '../src/ImmutableBPlusTree.js';

function benchmark(name, fn) {
    const start = performance.now();
    fn();
    const end = performance.now();
    return end - start;
}

function formatTime(ms) {
    if (ms < 1) {
        return `${(ms * 1000).toFixed(2)}μs`;
    } else if (ms < 1000) {
        return `${ms.toFixed(2)}ms`;
    } else {
        return `${(ms / 1000).toFixed(2)}s`;
    }
}

console.log('='.repeat(80));
console.log('B+ Tree Performance Comparison: Mutable vs Immutable');
console.log('='.repeat(80));
console.log('');

// Test 1: Sequential Insertions
console.log('Test 1: Sequential Insertions (1,000 elements)');
console.log('-'.repeat(80));

let mutableTime = benchmark('Mutable insertions', () => {
    const tree = new BPlusTree(5);
    for (let i = 0; i < 1000; i++) {
        tree.add(i, `value${i}`);
    }
});

let immutableTime = benchmark('Immutable insertions', () => {
    let tree = new ImmutableBPlusTree(5);
    for (let i = 0; i < 1000; i++) {
        tree = tree.add(i, `value${i}`);
    }
});

console.log(`  Mutable:   ${formatTime(mutableTime)}`);
console.log(`  Immutable: ${formatTime(immutableTime)}`);
console.log(`  Ratio:     ${(immutableTime / mutableTime).toFixed(2)}x slower`);
console.log('');

// Test 2: Random Insertions
console.log('Test 2: Random Insertions (1,000 elements)');
console.log('-'.repeat(80));

const randomKeys = [];
for (let i = 0; i < 1000; i++) {
    randomKeys.push(Math.floor(Math.random() * 10000));
}

mutableTime = benchmark('Mutable random insertions', () => {
    const tree = new BPlusTree(5);
    for (const key of randomKeys) {
        tree.add(key, `value${key}`);
    }
});

immutableTime = benchmark('Immutable random insertions', () => {
    let tree = new ImmutableBPlusTree(5);
    for (const key of randomKeys) {
        tree = tree.add(key, `value${key}`);
    }
});

console.log(`  Mutable:   ${formatTime(mutableTime)}`);
console.log(`  Immutable: ${formatTime(immutableTime)}`);
console.log(`  Ratio:     ${(immutableTime / mutableTime).toFixed(2)}x slower`);
console.log('');

// Test 3: Search Performance
console.log('Test 3: Search Performance (10,000 searches)');
console.log('-'.repeat(80));

const mutableTree = new BPlusTree(5);
let immutableTree = new ImmutableBPlusTree(5);

for (let i = 0; i < 1000; i++) {
    mutableTree.add(i, `value${i}`);
    immutableTree = immutableTree.add(i, `value${i}`);
}

mutableTime = benchmark('Mutable searches', () => {
    for (let i = 0; i < 10000; i++) {
        mutableTree.search(i % 1000);
    }
});

immutableTime = benchmark('Immutable searches', () => {
    for (let i = 0; i < 10000; i++) {
        immutableTree.search(i % 1000);
    }
});

console.log(`  Mutable:   ${formatTime(mutableTime)}`);
console.log(`  Immutable: ${formatTime(immutableTime)}`);
console.log(`  Ratio:     ${(immutableTime / mutableTime).toFixed(2)}x`);
console.log('');

// Test 4: Range Search
console.log('Test 4: Range Search (100 ranges of 100 elements each)');
console.log('-'.repeat(80));

mutableTime = benchmark('Mutable range search', () => {
    for (let i = 0; i < 100; i++) {
        const start = i * 10;
        mutableTree.rangeSearch(start, start + 100);
    }
});

immutableTime = benchmark('Immutable range search', () => {
    for (let i = 0; i < 100; i++) {
        const start = i * 10;
        immutableTree.rangeSearch(start, start + 100);
    }
});

console.log(`  Mutable:   ${formatTime(mutableTime)}`);
console.log(`  Immutable: ${formatTime(immutableTime)}`);
console.log(`  Ratio:     ${(immutableTime / mutableTime).toFixed(2)}x`);
console.log('');

// Test 5: Deletions
console.log('Test 5: Deletions (500 deletions)');
console.log('-'.repeat(80));

const mutableTree2 = new BPlusTree(5);
let immutableTree2 = new ImmutableBPlusTree(5);

for (let i = 0; i < 1000; i++) {
    mutableTree2.add(i, `value${i}`);
    immutableTree2 = immutableTree2.add(i, `value${i}`);
}

mutableTime = benchmark('Mutable deletions', () => {
    for (let i = 0; i < 500; i++) {
        mutableTree2.delete(i);
    }
});

immutableTime = benchmark('Immutable deletions', () => {
    for (let i = 0; i < 500; i++) {
        immutableTree2 = immutableTree2.delete(i);
    }
});

console.log(`  Mutable:   ${formatTime(mutableTime)}`);
console.log(`  Immutable: ${formatTime(immutableTime)}`);
console.log(`  Ratio:     ${(immutableTime / mutableTime).toFixed(2)}x slower`);
console.log('');

// Test 6: toArray Performance
console.log('Test 6: toArray Performance (1,000 elements)');
console.log('-'.repeat(80));

mutableTime = benchmark('Mutable toArray', () => {
    for (let i = 0; i < 100; i++) {
        mutableTree.toArray();
    }
});

immutableTime = benchmark('Immutable toArray', () => {
    for (let i = 0; i < 100; i++) {
        immutableTree.toArray();
    }
});

console.log(`  Mutable:   ${formatTime(mutableTime)}`);
console.log(`  Immutable: ${formatTime(immutableTime)}`);
console.log(`  Ratio:     ${(immutableTime / mutableTime).toFixed(2)}x`);
console.log('');

// Test 7: Memory - Versioning Advantage
console.log('Test 7: Versioning - Creating 100 versions with single additions');
console.log('-'.repeat(80));

mutableTime = benchmark('Mutable (copy on each version)', () => {
    const versions = [];
    for (let i = 0; i < 100; i++) {
        const tree = new BPlusTree(5);
        for (let j = 0; j <= i; j++) {
            tree.add(j, `value${j}`);
        }
        versions.push(tree);
    }
});

immutableTime = benchmark('Immutable (structural sharing)', () => {
    const versions = [];
    let tree = new ImmutableBPlusTree(5);
    for (let i = 0; i < 100; i++) {
        tree = tree.add(i, `value${i}`);
        versions.push(tree);
    }
});

console.log(`  Mutable:   ${formatTime(mutableTime)}`);
console.log(`  Immutable: ${formatTime(immutableTime)}`);
console.log(`  Ratio:     ${(immutableTime / mutableTime).toFixed(2)}x faster`);
console.log('');

console.log('='.repeat(80));
console.log('Summary');
console.log('='.repeat(80));
console.log('');
console.log('Mutable B+ Tree:');
console.log('  • Faster write operations (insert/delete)');
console.log('  • No overhead for node creation');
console.log('  • Best for write-heavy workloads');
console.log('  • Not thread-safe without locking');
console.log('');
console.log('Immutable B+ Tree:');
console.log('  • Similar read performance (search/range)');
console.log('  • Slower write operations due to node copying');
console.log('  • Structural sharing enables efficient versioning');
console.log('  • Thread-safe by default');
console.log('  • Best for read-heavy workloads with snapshots');
console.log('');
