import {expect} from 'chai';
import {BPlusTree} from '../src/BPlusTree.js';

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
            expect(tree.search(10)).to.deep.equal(['ten']);
        });

        it('should add multiple key-value pairs', function() {
            tree.add(10, 'ten');
            tree.add(20, 'twenty');
            tree.add(5, 'five');
            tree.add(15, 'fifteen');

            expect(tree.size()).to.equal(4);
            expect(tree.search(10)).to.deep.equal(['ten']);
            expect(tree.search(20)).to.deep.equal(['twenty']);
            expect(tree.search(5)).to.deep.equal(['five']);
            expect(tree.search(15)).to.deep.equal(['fifteen']);
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
                expect(tree.search(i)).to.deep.equal([`value${i}`]);
            }
        });

        it('should handle adding keys in descending order', function() {
            for (let i = 10; i >= 1; i--) {
                tree.add(i, `value${i}`);
            }

            expect(tree.size()).to.equal(10);
            for (let i = 1; i <= 10; i++) {
                expect(tree.search(i)).to.deep.equal([`value${i}`]);
            }
        });

        it('should handle adding keys in random order', function() {
            const keys = [5, 2, 8, 1, 9, 3, 7, 4, 6, 10];
            keys.forEach(key => tree.add(key, `value${key}`));

            expect(tree.size()).to.equal(10);
            keys.forEach(key => {
                expect(tree.search(key)).to.deep.equal([`value${key}`]);
            });
        });

        it('should handle adding duplicate keys (multiple values)', function() {
            tree.add(10, 'ten');
            tree.add(10, 'TEN');
            
            // When a duplicate key is added, it should add to values array
            const result = tree.search(10);
            expect(result).to.deep.equal(['ten', 'TEN']);
            // Size should be 2 since we added both values
            expect(tree.size()).to.equal(2);
        });


        it('should handle string keys', function() {
            tree.add('apple', 1);
            tree.add('banana', 2);
            tree.add('cherry', 3);

            expect(tree.search('apple')).to.deep.equal([1]);
            expect(tree.search('banana')).to.deep.equal([2]);
            expect(tree.search('cherry')).to.deep.equal([3]);
        });

        it('should handle large number of insertions', function() {
            const count = 100;
            for (let i = 0; i < count; i++) {
                tree.add(i, `value${i}`);
            }

            expect(tree.size()).to.equal(count);
            for (let i = 0; i < count; i++) {
                expect(tree.search(i)).to.deep.equal([`value${i}`]);
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
            expect(tree.search(20)).to.deep.equal(['twenty']);
            expect(tree.search(5)).to.deep.equal(['five']);
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
                expect(tree.search(i)).to.deep.equal([`value${i}`]);
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

            expect(tree.search(-5)).to.deep.equal(['negative five']);
            expect(tree.search(-10)).to.deep.equal(['negative ten']);
            expect(tree.search(0)).to.deep.equal(['zero']);
            expect(tree.search(5)).to.deep.equal(['positive five']);
        });

        it('should handle floating point numbers', function() {
            const tree = new BPlusTree(3);
            tree.add(1.5, 'one point five');
            tree.add(2.7, 'two point seven');
            tree.add(3.2, 'three point two');

            expect(tree.search(1.5)).to.deep.equal(['one point five']);
            expect(tree.search(2.7)).to.deep.equal(['two point seven']);
            expect(tree.search(3.2)).to.deep.equal(['three point two']);
        });

        it('should handle complex object values', function() {
            const tree = new BPlusTree(3);
            const obj1 = {name: 'Alice', age: 30};
            const obj2 = {name: 'Bob', age: 25};

            tree.add(1, obj1);
            tree.add(2, obj2);

            expect(tree.search(1)).to.deep.equal([obj1]);
            expect(tree.search(2)).to.deep.equal([obj2]);
        });

        it('should maintain tree properties with higher order', function() {
            const tree = new BPlusTree(5);
            for (let i = 1; i <= 50; i++) {
                tree.add(i, `value${i}`);
            }

            expect(tree.size()).to.equal(50);
            for (let i = 1; i <= 50; i++) {
                expect(tree.search(i)).to.deep.equal([`value${i}`]);
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
                expect(tree.search(i)).to.deep.equal([`value${i}`]);
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

    describe('Multiple Values Per Key', function() {
        let tree;

        beforeEach(function() {
            tree = new BPlusTree(3);
        });

        it('should store multiple values with the same key', function() {
            tree.add(10, 'value1');
            tree.add(10, 'value2');
            tree.add(10, 'value3');

            const values = tree.search(10);
            expect(values).to.be.an('array');
            expect(values).to.have.lengthOf(3);
            expect(values).to.include('value1');
            expect(values).to.include('value2');
            expect(values).to.include('value3');
        });

        it('should maintain insertion order for multiple values', function() {
            tree.add(10, 'first');
            tree.add(10, 'second');
            tree.add(10, 'third');

            const values = tree.search(10);
            expect(values).to.deep.equal(['first', 'second', 'third']);
        });

        it('should handle mixed single and multiple values', function() {
            tree.add(5, 'single');
            tree.add(10, 'multiple1');
            tree.add(10, 'multiple2');
            tree.add(15, 'another single');

            expect(tree.search(5)).to.deep.equal(['single']);
            expect(tree.search(10)).to.deep.equal(['multiple1', 'multiple2']);
            expect(tree.search(15)).to.deep.equal(['another single']);
        });

        it('should remove a specific value from multiple values with same key', function() {
            tree.add(10, 'value1');
            tree.add(10, 'value2');
            tree.add(10, 'value3');

            const removed = tree.deleteValue(10, 'value2');
            expect(removed).to.be.true;

            const values = tree.search(10);
            expect(values).to.have.lengthOf(2);
            expect(values).to.deep.equal(['value1', 'value3']);
        });

        it('should remove key when last value is deleted', function() {
            tree.add(10, 'value1');
            tree.add(10, 'value2');

            tree.deleteValue(10, 'value1');
            tree.deleteValue(10, 'value2');

            expect(tree.search(10)).to.be.undefined;
            expect(tree.size()).to.equal(0);
        });

        it('should return false when trying to delete non-existent value', function() {
            tree.add(10, 'value1');
            tree.add(10, 'value2');

            const removed = tree.deleteValue(10, 'value3');
            expect(removed).to.be.false;

            const values = tree.search(10);
            expect(values).to.have.lengthOf(2);
        });

        it('should delete all values for a key with delete()', function() {
            tree.add(10, 'value1');
            tree.add(10, 'value2');
            tree.add(10, 'value3');
            tree.add(20, 'other');

            tree.delete(10);

            expect(tree.search(10)).to.be.undefined;
            expect(tree.search(20)).to.deep.equal(['other']);
            expect(tree.size()).to.equal(1);
        });

        it('should handle duplicate values for same key', function() {
            tree.add(10, 'duplicate');
            tree.add(10, 'duplicate');
            tree.add(10, 'unique');

            const values = tree.search(10);
            expect(values).to.have.lengthOf(3);
            expect(values).to.deep.equal(['duplicate', 'duplicate', 'unique']);

            // Remove only first occurrence
            tree.deleteValue(10, 'duplicate');
            const remaining = tree.search(10);
            expect(remaining).to.have.lengthOf(2);
            expect(remaining).to.deep.equal(['duplicate', 'unique']);
        });

        it('should correctly report size with multiple values per key', function() {
            tree.add(10, 'a');
            tree.add(10, 'b');
            tree.add(20, 'c');
            tree.add(20, 'd');
            tree.add(20, 'e');

            // Size should count total key-value pairs
            expect(tree.size()).to.equal(5);
        });

        it('should handle toArray with multiple values per key', function() {
            tree.add(5, 'a');
            tree.add(10, 'b');
            tree.add(10, 'c');
            tree.add(15, 'd');

            const result = tree.toArray();
            expect(result).to.have.lengthOf(4);
            expect(result).to.deep.equal([
                {key: 5, value: 'a'},
                {key: 10, value: 'b'},
                {key: 10, value: 'c'},
                {key: 15, value: 'd'}
            ]);
        });

        it('should handle rangeSearch with multiple values per key', function() {
            tree.add(5, 'a1');
            tree.add(5, 'a2');
            tree.add(10, 'b');
            tree.add(15, 'c1');
            tree.add(15, 'c2');
            tree.add(15, 'c3');

            const result = tree.rangeSearch(5, 15);
            expect(result).to.have.lengthOf(6);
            expect(result.map(r => r.value)).to.deep.equal(['a1', 'a2', 'b', 'c1', 'c2', 'c3']);
        });

        it('should work correctly with complex values', function() {
            const obj1 = {id: 1, name: 'Alice'};
            const obj2 = {id: 2, name: 'Bob'};
            const obj3 = {id: 3, name: 'Charlie'};

            tree.add(10, obj1);
            tree.add(10, obj2);
            tree.add(10, obj3);

            const values = tree.search(10);
            expect(values).to.have.lengthOf(3);
            expect(values).to.deep.equal([obj1, obj2, obj3]);

            // Delete by object reference
            tree.deleteValue(10, obj2);
            const remaining = tree.search(10);
            expect(remaining).to.have.lengthOf(2);
            expect(remaining).to.deep.equal([obj1, obj3]);
        });
    });
});
