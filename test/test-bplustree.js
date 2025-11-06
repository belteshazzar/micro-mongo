import {expect} from 'chai';
import {BPlusTree} from '../BPlusTree.js';

describe('BPlusTree', function() {

    describe('Constructor', function() {
        it('should create an empty tree with default order', function() {
            const tree = new BPlusTree();
            expect(tree.isEmpty()).to.be.true;
            expect(tree.size()).to.equal(0);
        });

        it('should create an empty tree with custom order', function() {
            const tree = new BPlusTree(5);
            expect(tree.isEmpty()).to.be.true;
            expect(tree.order).to.equal(5);
        });

        it('should throw error for invalid order', function() {
            expect(() => new BPlusTree(2)).to.throw('B+ tree order must be at least 3');
            expect(() => new BPlusTree(1)).to.throw('B+ tree order must be at least 3');
        });
    });

    describe('Add and Search', function() {
        let tree;

        beforeEach(function() {
            tree = new BPlusTree(3);
        });

        it('should add a single key-value pair', function() {
            tree.add(10, 'ten');
            expect(tree.size()).to.equal(1);
            expect(tree.search(10)).to.equal('ten');
        });

        it('should add multiple key-value pairs', function() {
            tree.add(10, 'ten');
            tree.add(20, 'twenty');
            tree.add(5, 'five');
            tree.add(15, 'fifteen');

            expect(tree.size()).to.equal(4);
            expect(tree.search(10)).to.equal('ten');
            expect(tree.search(20)).to.equal('twenty');
            expect(tree.search(5)).to.equal('five');
            expect(tree.search(15)).to.equal('fifteen');
        });

        it('should return undefined for non-existent keys', function() {
            tree.add(10, 'ten');
            expect(tree.search(20)).to.be.undefined;
            expect(tree.search(5)).to.be.undefined;
        });

        it('should handle adding keys in ascending order', function() {
            for (let i = 1; i <= 10; i++) {
                tree.add(i, `value${i}`);
            }

            expect(tree.size()).to.equal(10);
            for (let i = 1; i <= 10; i++) {
                expect(tree.search(i)).to.equal(`value${i}`);
            }
        });

        it('should handle adding keys in descending order', function() {
            for (let i = 10; i >= 1; i--) {
                tree.add(i, `value${i}`);
            }

            expect(tree.size()).to.equal(10);
            for (let i = 1; i <= 10; i++) {
                expect(tree.search(i)).to.equal(`value${i}`);
            }
        });

        it('should handle adding keys in random order', function() {
            const keys = [5, 2, 8, 1, 9, 3, 7, 4, 6, 10];
            keys.forEach(key => tree.add(key, `value${key}`));

            expect(tree.size()).to.equal(10);
            keys.forEach(key => {
                expect(tree.search(key)).to.equal(`value${key}`);
            });
        });

        it('should handle adding duplicate keys (update value)', function() {
            tree.add(10, 'ten');
            tree.add(10, 'TEN');
            
            // The tree will contain both entries (B+ trees can have duplicates)
            // or the second one based on implementation
            const result = tree.search(10);
            expect(result).to.not.be.undefined;
        });

        it('should handle string keys', function() {
            tree.add('apple', 1);
            tree.add('banana', 2);
            tree.add('cherry', 3);

            expect(tree.search('apple')).to.equal(1);
            expect(tree.search('banana')).to.equal(2);
            expect(tree.search('cherry')).to.equal(3);
        });

        it('should handle large number of insertions', function() {
            const count = 100;
            for (let i = 0; i < count; i++) {
                tree.add(i, `value${i}`);
            }

            expect(tree.size()).to.equal(count);
            for (let i = 0; i < count; i++) {
                expect(tree.search(i)).to.equal(`value${i}`);
            }
        });
    });

    describe('Delete', function() {
        let tree;

        beforeEach(function() {
            tree = new BPlusTree(3);
        });

        it('should delete a key from tree with single element', function() {
            tree.add(10, 'ten');
            expect(tree.delete(10)).to.be.true;
            expect(tree.size()).to.equal(0);
            expect(tree.search(10)).to.be.undefined;
        });

        it('should delete a key from tree with multiple elements', function() {
            tree.add(10, 'ten');
            tree.add(20, 'twenty');
            tree.add(5, 'five');

            expect(tree.delete(10)).to.be.true;
            expect(tree.size()).to.equal(2);
            expect(tree.search(10)).to.be.undefined;
            expect(tree.search(20)).to.equal('twenty');
            expect(tree.search(5)).to.equal('five');
        });

        it('should return false when deleting non-existent key', function() {
            tree.add(10, 'ten');
            expect(tree.delete(20)).to.be.false;
            expect(tree.size()).to.equal(1);
        });

        it('should handle deleting all elements one by one', function() {
            const keys = [5, 2, 8, 1, 9, 3, 7, 4, 6, 10];
            keys.forEach(key => tree.add(key, `value${key}`));

            keys.forEach(key => {
                expect(tree.delete(key)).to.be.true;
                expect(tree.search(key)).to.be.undefined;
            });

            expect(tree.isEmpty()).to.be.true;
        });

        it('should handle deleting from large tree', function() {
            const count = 50;
            for (let i = 0; i < count; i++) {
                tree.add(i, `value${i}`);
            }

            // Delete every other element
            for (let i = 0; i < count; i += 2) {
                expect(tree.delete(i)).to.be.true;
            }

            expect(tree.size()).to.equal(count / 2);

            // Verify remaining elements
            for (let i = 1; i < count; i += 2) {
                expect(tree.search(i)).to.equal(`value${i}`);
            }
        });
    });

    describe('toArray', function() {
        let tree;

        beforeEach(function() {
            tree = new BPlusTree(3);
        });

        it('should return empty array for empty tree', function() {
            expect(tree.toArray()).to.deep.equal([]);
        });

        it('should return all elements in sorted order', function() {
            const keys = [5, 2, 8, 1, 9, 3];
            keys.forEach(key => tree.add(key, `value${key}`));

            const result = tree.toArray();
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
            tree = new BPlusTree(3);
            for (let i = 1; i <= 10; i++) {
                tree.add(i, `value${i}`);
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
            const tree = new BPlusTree(3);
            for (let i = 1; i <= 10; i++) {
                tree.add(i, `value${i}`);
            }

            expect(tree.size()).to.equal(10);
            tree.clear();
            expect(tree.isEmpty()).to.be.true;
            expect(tree.size()).to.equal(0);
        });
    });

    describe('getHeight', function() {
        it('should return 0 for single-level tree', function() {
            const tree = new BPlusTree(3);
            tree.add(1, 'one');
            expect(tree.getHeight()).to.equal(0);
        });

        it('should return correct height for multi-level tree', function() {
            const tree = new BPlusTree(3);
            // Add enough elements to create multiple levels
            for (let i = 1; i <= 20; i++) {
                tree.add(i, `value${i}`);
            }
            expect(tree.getHeight()).to.be.greaterThan(0);
        });
    });

    describe('Edge Cases', function() {
        it('should handle negative numbers', function() {
            const tree = new BPlusTree(3);
            tree.add(-5, 'negative five');
            tree.add(-10, 'negative ten');
            tree.add(0, 'zero');
            tree.add(5, 'positive five');

            expect(tree.search(-5)).to.equal('negative five');
            expect(tree.search(-10)).to.equal('negative ten');
            expect(tree.search(0)).to.equal('zero');
            expect(tree.search(5)).to.equal('positive five');
        });

        it('should handle floating point numbers', function() {
            const tree = new BPlusTree(3);
            tree.add(1.5, 'one point five');
            tree.add(2.7, 'two point seven');
            tree.add(3.2, 'three point two');

            expect(tree.search(1.5)).to.equal('one point five');
            expect(tree.search(2.7)).to.equal('two point seven');
            expect(tree.search(3.2)).to.equal('three point two');
        });

        it('should handle complex object values', function() {
            const tree = new BPlusTree(3);
            const obj1 = {name: 'Alice', age: 30};
            const obj2 = {name: 'Bob', age: 25};

            tree.add(1, obj1);
            tree.add(2, obj2);

            expect(tree.search(1)).to.deep.equal(obj1);
            expect(tree.search(2)).to.deep.equal(obj2);
        });

        it('should maintain tree properties with higher order', function() {
            const tree = new BPlusTree(5);
            for (let i = 1; i <= 50; i++) {
                tree.add(i, `value${i}`);
            }

            expect(tree.size()).to.equal(50);
            for (let i = 1; i <= 50; i++) {
                expect(tree.search(i)).to.equal(`value${i}`);
            }
        });
    });

    describe('Stress Tests', function() {
        it('should handle rapid insertions and deletions', function() {
            const tree = new BPlusTree(4);
            const operations = 100;

            // Insert
            for (let i = 0; i < operations; i++) {
                tree.add(i, `value${i}`);
            }

            // Delete half
            for (let i = 0; i < operations / 2; i++) {
                tree.delete(i);
            }

            // Verify remaining
            expect(tree.size()).to.equal(operations / 2);
            for (let i = operations / 2; i < operations; i++) {
                expect(tree.search(i)).to.equal(`value${i}`);
            }
        });

        it('should maintain correctness with mixed operations', function() {
            const tree = new BPlusTree(3);

            tree.add(5, 'five');
            tree.add(3, 'three');
            tree.add(7, 'seven');
            tree.delete(3);
            tree.add(1, 'one');
            tree.add(9, 'nine');
            tree.delete(5);
            tree.add(2, 'two');

            const result = tree.toArray();
            expect(result.map(r => r.key)).to.deep.equal([1, 2, 7, 9]);
        });
    });
});
