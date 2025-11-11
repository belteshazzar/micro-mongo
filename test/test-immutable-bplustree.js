import {expect} from 'chai';
import {ImmutableBPlusTree} from '../src/ImmutableBPlusTree.js';

describe('ImmutableBPlusTree', function() {

    describe('Constructor', function() {
        it('should create an empty tree with default order', function() {
            const tree = new ImmutableBPlusTree();
            expect(tree.isEmpty()).to.be.true;
            expect(tree.size()).to.equal(0);
        });

        it('should create an empty tree with custom order', function() {
            const tree = new ImmutableBPlusTree(5);
            expect(tree.isEmpty()).to.be.true;
            expect(tree.order).to.equal(5);
        });

        it('should throw error for invalid order', function() {
            expect(() => new ImmutableBPlusTree(2)).to.throw('B+ tree order must be at least 3');
            expect(() => new ImmutableBPlusTree(1)).to.throw('B+ tree order must be at least 3');
        });
    });

    describe('Add and Search', function() {
        let tree;

        beforeEach(function() {
            tree = new ImmutableBPlusTree(3);
        });

        it('should add a single key-value pair', function() {
            const newTree = tree.add(10, 'ten');
            expect(newTree.size()).to.equal(1);
            expect(newTree.search(10)).to.equal('ten');
            // Original tree should be unchanged
            expect(tree.size()).to.equal(0);
        });

        it('should add multiple key-value pairs', function() {
            let newTree = tree;
            newTree = newTree.add(10, 'ten');
            newTree = newTree.add(20, 'twenty');
            newTree = newTree.add(5, 'five');
            newTree = newTree.add(15, 'fifteen');

            expect(newTree.size()).to.equal(4);
            expect(newTree.search(10)).to.equal('ten');
            expect(newTree.search(20)).to.equal('twenty');
            expect(newTree.search(5)).to.equal('five');
            expect(newTree.search(15)).to.equal('fifteen');
            // Original tree should be unchanged
            expect(tree.size()).to.equal(0);
        });

        it('should return undefined for non-existent keys', function() {
            const newTree = tree.add(10, 'ten');
            expect(newTree.search(20)).to.be.undefined;
            expect(newTree.search(5)).to.be.undefined;
        });

        it('should handle adding keys in ascending order', function() {
            let newTree = tree;
            for (let i = 1; i <= 10; i++) {
                newTree = newTree.add(i, `value${i}`);
            }

            expect(newTree.size()).to.equal(10);
            for (let i = 1; i <= 10; i++) {
                expect(newTree.search(i)).to.equal(`value${i}`);
            }
        });

        it('should handle adding keys in descending order', function() {
            let newTree = tree;
            for (let i = 10; i >= 1; i--) {
                newTree = newTree.add(i, `value${i}`);
            }

            expect(newTree.size()).to.equal(10);
            for (let i = 1; i <= 10; i++) {
                expect(newTree.search(i)).to.equal(`value${i}`);
            }
        });

        it('should handle adding keys in random order', function() {
            const keys = [5, 2, 8, 1, 9, 3, 7, 4, 6, 10];
            let newTree = tree;
            keys.forEach(key => {
                newTree = newTree.add(key, `value${key}`);
            });

            expect(newTree.size()).to.equal(10);
            keys.forEach(key => {
                expect(newTree.search(key)).to.equal(`value${key}`);
            });
        });

        it('should handle adding duplicate keys (update value)', function() {
            let newTree = tree.add(10, 'ten');
            newTree = newTree.add(10, 'TEN');
            
            // When a duplicate key is added, it should update the value
            const result = newTree.search(10);
            expect(result).to.equal('TEN');
            // Size should still be 1 since we updated, not added
            expect(newTree.size()).to.equal(1);
        });

        it('should handle string keys', function() {
            let newTree = tree;
            newTree = newTree.add('apple', 1);
            newTree = newTree.add('banana', 2);
            newTree = newTree.add('cherry', 3);

            expect(newTree.search('apple')).to.equal(1);
            expect(newTree.search('banana')).to.equal(2);
            expect(newTree.search('cherry')).to.equal(3);
        });

        it('should handle large number of insertions', function() {
            const count = 100;
            let newTree = tree;
            for (let i = 0; i < count; i++) {
                newTree = newTree.add(i, `value${i}`);
            }

            expect(newTree.size()).to.equal(count);
            for (let i = 0; i < count; i++) {
                expect(newTree.search(i)).to.equal(`value${i}`);
            }
        });
    });

    describe('Delete', function() {
        let tree;

        beforeEach(function() {
            tree = new ImmutableBPlusTree(3);
        });

        it('should delete a key from tree with single element', function() {
            let newTree = tree.add(10, 'ten');
            const afterDelete = newTree.delete(10);
            expect(afterDelete.size()).to.equal(0);
            expect(afterDelete.search(10)).to.be.undefined;
            // Original tree with element should be unchanged
            expect(newTree.size()).to.equal(1);
        });

        it('should delete a key from tree with multiple elements', function() {
            let newTree = tree;
            newTree = newTree.add(10, 'ten');
            newTree = newTree.add(20, 'twenty');
            newTree = newTree.add(5, 'five');

            const afterDelete = newTree.delete(10);
            expect(afterDelete.size()).to.equal(2);
            expect(afterDelete.search(10)).to.be.undefined;
            expect(afterDelete.search(20)).to.equal('twenty');
            expect(afterDelete.search(5)).to.equal('five');
            // Original tree should be unchanged
            expect(newTree.size()).to.equal(3);
        });

        it('should return same tree when deleting non-existent key', function() {
            const newTree = tree.add(10, 'ten');
            const afterDelete = newTree.delete(20);
            expect(afterDelete.size()).to.equal(1);
            // Should return the same tree instance
            expect(afterDelete).to.equal(newTree);
        });

        it('should handle deleting all elements one by one', function() {
            const keys = [5, 2, 8, 1, 9, 3, 7, 4, 6, 10];
            let newTree = tree;
            keys.forEach(key => {
                newTree = newTree.add(key, `value${key}`);
            });

            keys.forEach(key => {
                newTree = newTree.delete(key);
                expect(newTree.search(key)).to.be.undefined;
            });

            expect(newTree.isEmpty()).to.be.true;
        });

        it('should handle deleting from large tree', function() {
            const count = 50;
            let newTree = tree;
            for (let i = 0; i < count; i++) {
                newTree = newTree.add(i, `value${i}`);
            }

            // Delete every other element
            for (let i = 0; i < count; i += 2) {
                newTree = newTree.delete(i);
            }

            expect(newTree.size()).to.equal(count / 2);

            // Verify remaining elements
            for (let i = 1; i < count; i += 2) {
                expect(newTree.search(i)).to.equal(`value${i}`);
            }
        });
    });

    describe('toArray', function() {
        let tree;

        beforeEach(function() {
            tree = new ImmutableBPlusTree(3);
        });

        it('should return empty array for empty tree', function() {
            expect(tree.toArray()).to.deep.equal([]);
        });

        it('should return all elements in sorted order', function() {
            const keys = [5, 2, 8, 1, 9, 3];
            let newTree = tree;
            keys.forEach(key => {
                newTree = newTree.add(key, `value${key}`);
            });

            const result = newTree.toArray();
            expect(result.length).to.equal(6);

            // Verify sorted order
            for (let i = 0; i < result.length - 1; i++) {
                expect(result[i].key).to.be.lessThan(result[i + 1].key);
            }

            // Verify content
            expect(result).to.deep.equal([
                {key: 1, value: 'value1'},
                {key: 2, value: 'value2'},
                {key: 3, value: 'value3'},
                {key: 5, value: 'value5'},
                {key: 8, value: 'value8'},
                {key: 9, value: 'value9'}
            ]);
        });
    });

    describe('rangeSearch', function() {
        let tree;

        beforeEach(function() {
            tree = new ImmutableBPlusTree(3);
            for (let i = 1; i <= 10; i++) {
                tree = tree.add(i, `value${i}`);
            }
        });

        it('should find all elements in range', function() {
            const result = tree.rangeSearch(3, 7);
            expect(result.length).to.equal(5);
            expect(result.map(r => r.key)).to.deep.equal([3, 4, 5, 6, 7]);
        });

        it('should find single element range', function() {
            const result = tree.rangeSearch(5, 5);
            expect(result.length).to.equal(1);
            expect(result[0].key).to.equal(5);
        });

        it('should return empty array for range with no elements', function() {
            const result = tree.rangeSearch(15, 20);
            expect(result.length).to.equal(0);
        });

        it('should find all elements when range covers entire tree', function() {
            const result = tree.rangeSearch(1, 10);
            expect(result.length).to.equal(10);
        });

        it('should handle range starting before first element', function() {
            const result = tree.rangeSearch(0, 5);
            expect(result.length).to.equal(5);
            expect(result.map(r => r.key)).to.deep.equal([1, 2, 3, 4, 5]);
        });

        it('should handle range ending after last element', function() {
            const result = tree.rangeSearch(8, 15);
            expect(result.length).to.equal(3);
            expect(result.map(r => r.key)).to.deep.equal([8, 9, 10]);
        });
    });

    describe('clear', function() {
        it('should clear all elements from tree', function() {
            let newTree = new ImmutableBPlusTree(3);
            for (let i = 1; i <= 10; i++) {
                newTree = newTree.add(i, `value${i}`);
            }

            expect(newTree.size()).to.equal(10);
            const cleared = newTree.clear();
            expect(cleared.isEmpty()).to.be.true;
            expect(cleared.size()).to.equal(0);
            // Original tree should be unchanged
            expect(newTree.size()).to.equal(10);
        });
    });

    describe('getHeight', function() {
        it('should return 0 for single-level tree', function() {
            const tree = new ImmutableBPlusTree(3);
            const newTree = tree.add(1, 'one');
            expect(newTree.getHeight()).to.equal(0);
        });

        it('should return correct height for multi-level tree', function() {
            let tree = new ImmutableBPlusTree(3);
            // Add enough elements to create multiple levels
            for (let i = 1; i <= 20; i++) {
                tree = tree.add(i, `value${i}`);
            }
            expect(tree.getHeight()).to.be.greaterThan(0);
        });
    });

    describe('Edge Cases', function() {
        it('should handle negative numbers', function() {
            let newTree = new ImmutableBPlusTree(3);
            newTree = newTree.add(-5, 'negative five');
            newTree = newTree.add(-10, 'negative ten');
            newTree = newTree.add(0, 'zero');
            newTree = newTree.add(5, 'positive five');

            expect(newTree.search(-5)).to.equal('negative five');
            expect(newTree.search(-10)).to.equal('negative ten');
            expect(newTree.search(0)).to.equal('zero');
            expect(newTree.search(5)).to.equal('positive five');
        });

        it('should handle floating point numbers', function() {
            let newTree = new ImmutableBPlusTree(3);
            newTree = newTree.add(1.5, 'one point five');
            newTree = newTree.add(2.7, 'two point seven');
            newTree = newTree.add(3.2, 'three point two');

            expect(newTree.search(1.5)).to.equal('one point five');
            expect(newTree.search(2.7)).to.equal('two point seven');
            expect(newTree.search(3.2)).to.equal('three point two');
        });

        it('should handle complex object values', function() {
            let newTree = new ImmutableBPlusTree(3);
            const obj1 = {name: 'Alice', age: 30};
            const obj2 = {name: 'Bob', age: 25};

            newTree = newTree.add(1, obj1);
            newTree = newTree.add(2, obj2);

            expect(newTree.search(1)).to.deep.equal(obj1);
            expect(newTree.search(2)).to.deep.equal(obj2);
        });

        it('should maintain tree properties with higher order', function() {
            let newTree = new ImmutableBPlusTree(5);
            for (let i = 1; i <= 50; i++) {
                newTree = newTree.add(i, `value${i}`);
            }

            expect(newTree.size()).to.equal(50);
            for (let i = 1; i <= 50; i++) {
                expect(newTree.search(i)).to.equal(`value${i}`);
            }
        });
    });

    describe('Stress Tests', function() {
        it('should handle rapid insertions and deletions', function() {
            let newTree = new ImmutableBPlusTree(4);
            const operations = 100;

            // Insert
            for (let i = 0; i < operations; i++) {
                newTree = newTree.add(i, `value${i}`);
            }

            // Delete half
            for (let i = 0; i < operations / 2; i++) {
                newTree = newTree.delete(i);
            }

            // Verify remaining
            expect(newTree.size()).to.equal(operations / 2);
            for (let i = operations / 2; i < operations; i++) {
                expect(newTree.search(i)).to.equal(`value${i}`);
            }
        });

        it('should maintain correctness with mixed operations', function() {
            let newTree = new ImmutableBPlusTree(3);

            newTree = newTree.add(5, 'five');
            newTree = newTree.add(3, 'three');
            newTree = newTree.add(7, 'seven');
            newTree = newTree.delete(3);
            newTree = newTree.add(1, 'one');
            newTree = newTree.add(9, 'nine');
            newTree = newTree.delete(5);
            newTree = newTree.add(2, 'two');

            const result = newTree.toArray();
            expect(result.map(r => r.key)).to.deep.equal([1, 2, 7, 9]);
        });
    });

    describe('Immutability Tests', function() {
        it('should preserve previous versions after add', function() {
            const v1 = new ImmutableBPlusTree(3);
            const v2 = v1.add(1, 'one');
            const v3 = v2.add(2, 'two');
            const v4 = v3.add(3, 'three');

            // Each version should be independent
            expect(v1.size()).to.equal(0);
            expect(v2.size()).to.equal(1);
            expect(v3.size()).to.equal(2);
            expect(v4.size()).to.equal(3);

            expect(v2.search(1)).to.equal('one');
            expect(v2.search(2)).to.be.undefined;

            expect(v3.search(1)).to.equal('one');
            expect(v3.search(2)).to.equal('two');
            expect(v3.search(3)).to.be.undefined;
        });

        it('should preserve previous versions after delete', function() {
            let tree = new ImmutableBPlusTree(3);
            tree = tree.add(1, 'one');
            tree = tree.add(2, 'two');
            tree = tree.add(3, 'three');

            const v1 = tree;
            const v2 = v1.delete(2);
            const v3 = v2.delete(1);

            // Each version should be independent
            expect(v1.size()).to.equal(3);
            expect(v2.size()).to.equal(2);
            expect(v3.size()).to.equal(1);

            expect(v1.search(2)).to.equal('two');
            expect(v2.search(2)).to.be.undefined;
            expect(v2.search(1)).to.equal('one');
            expect(v3.search(1)).to.be.undefined;
        });

        it('should support branching histories', function() {
            let base = new ImmutableBPlusTree(3);
            base = base.add(1, 'one');
            base = base.add(2, 'two');

            // Create two different branches
            const branch1 = base.add(3, 'three');
            const branch2 = base.add(4, 'four');

            expect(base.size()).to.equal(2);
            expect(branch1.size()).to.equal(3);
            expect(branch2.size()).to.equal(3);

            expect(branch1.search(3)).to.equal('three');
            expect(branch1.search(4)).to.be.undefined;

            expect(branch2.search(3)).to.be.undefined;
            expect(branch2.search(4)).to.equal('four');
        });

        it('should handle clear immutably', function() {
            let tree = new ImmutableBPlusTree(3);
            tree = tree.add(1, 'one');
            tree = tree.add(2, 'two');

            const cleared = tree.clear();

            expect(tree.size()).to.equal(2);
            expect(cleared.size()).to.equal(0);
            expect(tree.search(1)).to.equal('one');
            expect(cleared.search(1)).to.be.undefined;
        });
    });
});
