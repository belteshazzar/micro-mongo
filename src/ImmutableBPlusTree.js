/**
 * ImmutableBPlusTree - An immutable B+ tree implementation for indexing
 * 
 * This is an immutable variant where operations return new tree instances
 * instead of modifying existing nodes. This provides several benefits:
 * - Thread safety (multiple readers without locks)
 * - Time-travel / versioning capability
 * - Simpler reasoning about state changes
 * - Persistent data structures with structural sharing
 * 
 * Trade-offs:
 * - Higher memory usage (creates new nodes on writes)
 * - Slightly slower write performance (node allocation overhead)
 * - Better for read-heavy workloads with occasional snapshots
 * 
 * Note: This implementation prioritizes correctness and immutability over
 * the full performance optimizations of the mutable version. It does not
 * implement rebalancing on delete to keep the immutable logic simpler.
 * 
 * @class ImmutableBPlusTree
 */

/**
 * Node class representing a node in the immutable B+ tree
 * @private
 */
class ImmutableBPlusTreeNode {
    /**
     * Creates a new B+ tree node
     * @param {boolean} isLeaf - Whether this node is a leaf node
     * @param {Array} keys - Array of keys
     * @param {Array} values - Array of values (only used in leaf nodes)
     * @param {Array} children - Array of child nodes (only used in internal nodes)
     * @param {ImmutableBPlusTreeNode} next - Pointer to next leaf node (only used in leaf nodes)
     */
    constructor(isLeaf = false, keys = [], values = [], children = [], next = null) {
        this.keys = keys;
        this.values = values;
        this.children = children;
        this.isLeaf = isLeaf;
        this.next = next;
    }
}

/**
 * Immutable B+ Tree implementation
 */
export class ImmutableBPlusTree {
    /**
     * Creates a new immutable B+ tree
     * @param {number} order - The maximum number of children per node (default: 3)
     * @param {ImmutableBPlusTreeNode} root - The root node (used internally for creating new versions)
     */
    constructor(order = 3, root = null) {
        if (order < 3) {
            throw new Error('B+ tree order must be at least 3');
        }
        this.order = order;
        this.root = root || new ImmutableBPlusTreeNode(true);
        this.minKeys = Math.ceil(order / 2) - 1;
    }

    /**
     * Searches for a value by key in the B+ tree
     * @param {*} key - The key to search for
     * @returns {*} The value associated with the key, or undefined if not found
     */
    search(key) {
        return this._searchNode(this.root, key);
    }

    /**
     * Internal method to search for a key in a node
     * @private
     * @param {ImmutableBPlusTreeNode} node - The node to search in
     * @param {*} key - The key to search for
     * @returns {*} The value if found, undefined otherwise
     */
    _searchNode(node, key) {
        if (node.isLeaf) {
            // In a leaf node, check if we found the exact key
            for (let i = 0; i < node.keys.length; i++) {
                if (key === node.keys[i]) {
                    return node.values[i];
                }
            }
            return undefined;
        } else {
            // In an internal node, find the appropriate child
            let i = 0;
            while (i < node.keys.length && key >= node.keys[i]) {
                i++;
            }
            return this._searchNode(node.children[i], key);
        }
    }

    /**
     * Inserts a key-value pair into the B+ tree.
     * Returns a new tree instance with the key-value pair added.
     * If the key already exists, its value will be updated.
     * @param {*} key - The key to insert
     * @param {*} value - The value to associate with the key
     * @returns {ImmutableBPlusTree} New tree with the insertion applied
     */
    add(key, value) {
        const result = this._addToNode(this.root, key, value);
        
        let newRoot;
        if (result.newNode) {
            // Normal insert without split at root level
            newRoot = result.newNode;
        } else {
            // Root was split
            newRoot = new ImmutableBPlusTreeNode(
                false,
                [result.splitKey],
                [],
                [result.left, result.right]
            );
        }
        
        // Rebuild next pointers for all leaf nodes
        this._rebuildNextPointers(newRoot);
        
        return new ImmutableBPlusTree(this.order, newRoot);
    }

    /**
     * Rebuilds the next pointers for all leaf nodes in the tree
     * @private
     */
    _rebuildNextPointers(root) {
        // Collect all leaf nodes in order
        const leaves = [];
        this._collectLeaves(root, leaves);
        
        // Link them together
        for (let i = 0; i < leaves.length - 1; i++) {
            leaves[i].next = leaves[i + 1];
        }
        if (leaves.length > 0) {
            leaves[leaves.length - 1].next = null;
        }
    }

    /**
     * Collects all leaf nodes in sorted order
     * @private
     */
    _collectLeaves(node, leaves) {
        if (node.isLeaf) {
            leaves.push(node);
        } else {
            for (const child of node.children) {
                this._collectLeaves(child, leaves);
            }
        }
    }

    /**
     * Adds a key-value pair to a node, returning either a new node or split result
     * @private
     */
    _addToNode(node, key, value) {
        if (node.isLeaf) {
            // Handle leaf node insertion
            const keys = [...node.keys];
            const values = [...node.values];
            
            // Check if key exists
            const existingIdx = keys.indexOf(key);
            if (existingIdx !== -1) {
                // Update existing
                values[existingIdx] = value;
                return {
                    newNode: new ImmutableBPlusTreeNode(true, keys, values, [], null)
                };
            }
            
            // Insert new key in sorted position
            let insertIdx = 0;
            while (insertIdx < keys.length && key > keys[insertIdx]) {
                insertIdx++;
            }
            keys.splice(insertIdx, 0, key);
            values.splice(insertIdx, 0, value);
            
            // Check if split needed
            if (keys.length < this.order) {
                // No split
                return {
                    newNode: new ImmutableBPlusTreeNode(true, keys, values, [], null)
                };
            } else {
                // Split leaf
                const mid = Math.ceil(keys.length / 2);
                const leftKeys = keys.slice(0, mid);
                const leftValues = values.slice(0, mid);
                const rightKeys = keys.slice(mid);
                const rightValues = values.slice(mid);
                
                const rightNode = new ImmutableBPlusTreeNode(true, rightKeys, rightValues, [], null);
                const leftNode = new ImmutableBPlusTreeNode(true, leftKeys, leftValues, [], null);
                
                return {
                    left: leftNode,
                    right: rightNode,
                    splitKey: rightKeys[0]
                };
            }
        } else {
            // Handle internal node
            const keys = [...node.keys];
            const children = [...node.children];
            
            // Find which child to insert into
            let childIdx = 0;
            while (childIdx < keys.length && key >= keys[childIdx]) {
                childIdx++;
            }
            
            // Recursively insert
            const result = this._addToNode(children[childIdx], key, value);
            
            if (result.newNode) {
                // Child didn't split, just update reference
                children[childIdx] = result.newNode;
                return {
                    newNode: new ImmutableBPlusTreeNode(false, keys, [], children)
                };
            } else {
                // Child split, need to add splitKey and both children
                keys.splice(childIdx, 0, result.splitKey);
                children.splice(childIdx, 1, result.left, result.right);
                
                // Check if this node needs to split
                if (keys.length < this.order) {
                    return {
                        newNode: new ImmutableBPlusTreeNode(false, keys, [], children)
                    };
                } else {
                    // Split internal node
                    const mid = Math.ceil(keys.length / 2) - 1;
                    const splitKey = keys[mid];
                    const leftKeys = keys.slice(0, mid);
                    const rightKeys = keys.slice(mid + 1);
                    const leftChildren = children.slice(0, mid + 1);
                    const rightChildren = children.slice(mid + 1);
                    
                    const leftNode = new ImmutableBPlusTreeNode(false, leftKeys, [], leftChildren);
                    const rightNode = new ImmutableBPlusTreeNode(false, rightKeys, [], rightChildren);
                    
                    return {
                        left: leftNode,
                        right: rightNode,
                        splitKey: splitKey
                    };
                }
            }
        }
    }

    /**
     * Deletes a key from the B+ tree
     * Returns a new tree instance with the key removed.
     * @param {*} key - The key to delete
     * @returns {ImmutableBPlusTree} New tree with the deletion applied
     */
    delete(key) {
        const newRoot = this._deleteFromNode(this.root, key);
        
        if (!newRoot) {
            // Key not found, return same tree
            return this;
        }
        
        // If root is now empty after deletion, make its only child the new root
        let finalRoot = newRoot;
        if (finalRoot.keys.length === 0) {
            if (!finalRoot.isLeaf && finalRoot.children.length > 0) {
                finalRoot = finalRoot.children[0];
            }
        }
        
        // Rebuild next pointers
        this._rebuildNextPointers(finalRoot);
        
        return new ImmutableBPlusTree(this.order, finalRoot);
    }

    /**
     * Internal method to delete a key from a node
     * @private
     * @param {ImmutableBPlusTreeNode} node - The node to delete from
     * @param {*} key - The key to delete
     * @returns {ImmutableBPlusTreeNode|null} New node or null if key not found
     */
    _deleteFromNode(node, key) {
        if (node.isLeaf) {
            const keyIndex = node.keys.indexOf(key);
            
            if (keyIndex === -1) {
                return null; // Key not found
            }
            
            const newKeys = [...node.keys];
            const newValues = [...node.values];
            newKeys.splice(keyIndex, 1);
            newValues.splice(keyIndex, 1);
            
            return new ImmutableBPlusTreeNode(true, newKeys, newValues, [], node.next);
        } else {
            // Find the appropriate child to delete from
            let i = 0;
            while (i < node.keys.length && key >= node.keys[i]) {
                i++;
            }
            
            const newChild = this._deleteFromNode(node.children[i], key);
            
            if (!newChild) {
                return null; // Key not found
            }
            
            const newChildren = [...node.children];
            newChildren[i] = newChild;
            
            // For simplicity in the immutable version, we don't rebalance
            // This is a trade-off: simpler code but potentially deeper trees after many deletions
            return new ImmutableBPlusTreeNode(false, [...node.keys], [], newChildren);
        }
    }

    /**
     * Returns all key-value pairs in sorted order
     * @returns {Array} Array of {key, value} objects
     */
    toArray() {
        const result = [];
        let current = this._getFirstLeaf(this.root);
        
        while (current) {
            for (let i = 0; i < current.keys.length; i++) {
                result.push({
                    key: current.keys[i],
                    value: current.values[i]
                });
            }
            current = current.next;
        }
        
        return result;
    }

    /**
     * Gets the first (leftmost) leaf node
     * @private
     * @param {ImmutableBPlusTreeNode} node - The node to start from
     * @returns {ImmutableBPlusTreeNode} The leftmost leaf node
     */
    _getFirstLeaf(node) {
        if (node.isLeaf) {
            return node;
        }
        return this._getFirstLeaf(node.children[0]);
    }

    /**
     * Returns the number of key-value pairs in the tree
     * @returns {number} The size of the tree
     */
    size() {
        let count = 0;
        let current = this._getFirstLeaf(this.root);
        
        while (current) {
            count += current.keys.length;
            current = current.next;
        }
        
        return count;
    }

    /**
     * Checks if the tree is empty
     * @returns {boolean} True if the tree is empty
     */
    isEmpty() {
        return this.size() === 0;
    }

    /**
     * Clears all entries from the tree
     * Returns a new empty tree instance.
     * @returns {ImmutableBPlusTree} New empty tree
     */
    clear() {
        return new ImmutableBPlusTree(this.order);
    }

    /**
     * Performs a range search for all keys between min and max (inclusive)
     * @param {*} minKey - The minimum key (inclusive)
     * @param {*} maxKey - The maximum key (inclusive)
     * @returns {Array} Array of {key, value} objects in range
     */
    rangeSearch(minKey, maxKey) {
        const result = [];
        let current = this._getFirstLeaf(this.root);
        
        // Skip to the first node that might contain minKey
        while (current && current.keys[current.keys.length - 1] < minKey) {
            current = current.next;
        }
        
        // Collect all keys in range
        while (current) {
            for (let i = 0; i < current.keys.length; i++) {
                if (current.keys[i] >= minKey && current.keys[i] <= maxKey) {
                    result.push({
                        key: current.keys[i],
                        value: current.values[i]
                    });
                } else if (current.keys[i] > maxKey) {
                    return result;
                }
            }
            current = current.next;
        }
        
        return result;
    }

    /**
     * Gets the height of the tree
     * @returns {number} The height of the tree
     */
    getHeight() {
        let height = 0;
        let current = this.root;
        
        while (!current.isLeaf) {
            height++;
            current = current.children[0];
        }
        
        return height;
    }
}
