/**
 * BPlusTree - A B+ tree implementation for indexing
 * 
 * A B+ tree is a self-balancing tree data structure that maintains sorted data
 * and allows searches, sequential access, insertions, and deletions in logarithmic time.
 * All values are stored in leaf nodes, and internal nodes only store keys for navigation.
 * 
 * @class BPlusTree
 */

import { IndexStore } from "./IndexStore.js";

function isNumericString(str) {
  if (typeof str !== 'string' || str.trim() === '') {
    return false; // Not a string or empty string
  }
  return Number.isFinite(+str);
}

/**
 * Node class representing a node in the B+ tree
 * @private
 */
class BPlusTreeNode {
  /**
   * Creates a new B+ tree node
   * @param {boolean} isLeaf - Whether this node is a leaf node
   */
  constructor(isLeaf, indexStore, nodeCache) {
    if (!(indexStore instanceof IndexStore)) {
      throw new Error('IndexStore is required to create BPlusTreeNode');
    }

    if (typeof isLeaf === 'object') {
      // Load existing node from indexStore
      this._data = isLeaf;
      this.id = this._data.id;
      this.keys = [...this._data.keys];
      this.values = this._data.isLeaf ? [...this._data.values] : [];
      this.children = [];
      for (const childId of this._data.children) {
        if (nodeCache.has(childId)) {
          this.children.push(nodeCache.get(childId));
          continue;
        }
        const childData = indexStore.getDataMap('nodes').get(childId);
        if (!childData) {
          throw new Error(`BPlusTreeNode: Child node with id ${childId} not found in IndexStore`);
        }
        const childNode = new BPlusTreeNode(childData, indexStore, nodeCache);
        this.children.push(childNode);
        nodeCache.set(childId, childNode);
      }
      this.isLeaf = this._data.isLeaf;
      if (this._data.next) {
        if (nodeCache.has(this._data.next)) {
          this.next = nodeCache.get(this._data.next);
        } else {
          const nextData = indexStore.getDataMap('nodes').get(this._data.next);
          if (!nextData) {
            throw new Error(`BPlusTreeNode: Next leaf node with id ${this._data.next} not found in IndexStore`);
          }
          this.next = new BPlusTreeNode(nextData, indexStore, nodeCache);
          nodeCache.set(this.next.id, this.next);
        }
      } else {
        this.next = null;
      }
    } else {
      this._data = {
        id: indexStore.getMeta('nextId'),
        keys: [],      // Array of keys
        values: [],    // Array of values (only used in leaf nodes)
        children: [],  // Array of child nodes (only used in internal nodes)
        isLeaf: isLeaf,
        next : null,    // Pointer to next leaf node (only used in leaf nodes)
      };
      indexStore.setMeta('nextId', this._data.id + 1);
      indexStore.getDataMap('nodes').set(this._data.id, this._data);
      this.id = this._data.id;
      this.keys = [...this._data.keys];
      this.values = [...this._data.values];
      this.children = [];
      this.isLeaf = this._data.isLeaf;
      this.next = null;
    }
    const self = this;

    return new Proxy(this, {
      get(target, prop) {
        if (prop === 'children') {
          return new Proxy(target.children, {
            get(target, property, receiver) {
              if (!isNumericString(property)) {
                if (property === 'length') {
                  return Reflect.get(target, property, receiver);
                } else if (property === 'splice') {
                  return function(...args) {
                    if (args.length == 3) {
                      if (args[2] instanceof BPlusTreeNode) {
                        self._data.children.splice(args[0], args[1], args[2].id);
                        indexStore.getDataMap('nodes').set(self._data.id, self._data);
                      } else {
                        throw new Error('BPlusTreeNode: children array can only store BPlusTreeNode instances',args[2]);
                      }
                    }
                    return Reflect.apply(target[property], target, args);
                  };
                } else if (property === 'push') {
                  return function(...args) {
                    if (args.length !== 1) {
                      throw new Error('BPlusTreeNode: children.push only supports single argument');
                    }
                    if (args[0] instanceof BPlusTreeNode) {
                      self._data.children.push(args[0].id);
                      indexStore.getDataMap('nodes').set(self._data.id, self._data);
                      return self.children.push(args[0]);
                    } else {
                      throw new Error('BPlusTreeNode: children array can only store BPlusTreeNode instances',args[2]);
                    }
                  };
                }
              }
              // Custom logic for getting properties
              return Reflect.get(target, property, receiver); // Forward the operation to the original array
            },
            set(target, property, value, receiver) {
              if (isNumericString(property) && value instanceof BPlusTreeNode) {
                Reflect.set(self._data.children, property, value.id, receiver);
              } else {
                Reflect.set(self._data.children, property, value, receiver);
              }
              indexStore.getDataMap('nodes').set(self._data.id, self._data);
              return Reflect.set(target, property, value, receiver); // Forward the operation to the original array
            }
          });
        }
        return Reflect.get(target, prop);
      },
      set(target, prop, value) {
          if (prop === 'next') {
            if (value instanceof BPlusTreeNode) {
              target.next = value;
              target._data.next = value.id;
              indexStore.getDataMap('nodes').set(target._data.id, target._data);
            } else if (value === null) {
              target.next = null;
              target._data.next = null;
              indexStore.getDataMap('nodes').set(target._data.id, target._data);
            } else {
              throw new Error('BPlusTreeNode: next pointer must be a BPlusTreeNode or null');
            }
          } else if (prop === 'isLeaf') {
            target.isLeaf = value;
            target._data.isLeaf = value;
            indexStore.getDataMap('nodes').set(target._data.id, target._data);
          } else if (prop === 'children') {
            target.children = value;
            target._data.children = value.map(child => child.id);
            indexStore.getDataMap('nodes').set(target._data.id, target._data);
          } else {
            target[prop] = value;
            target._data[prop] = value;
            indexStore.getDataMap('nodes').set(target._data.id, target._data);
          }
        return true;
      }
    });
  }
}

/**
 * B+ Tree implementation
 */
export class BPlusTree {
  /**
   * Creates a new B+ tree
    * @param {number} order - The maximum number of children per node (default: 3)
    */
  constructor(order = 3, indexStore = new IndexStore()) {
    if (order < 3) {
      throw new Error('B+ tree order must be at least 3');
    }
    this.order = order;
    this.minKeys = Math.ceil(order / 2) - 1;
    this.indexStore = indexStore;
  
    if (indexStore.hasMeta('order')) {
      if (indexStore.getMeta('order') !== this.order) {
        throw new Error(`B+ tree order does not match stored index metadata ${indexStore.getMeta('order')} != ${this.order}`);
      }
      if (indexStore.getMeta('minKeys') != this.minKeys) {
        throw new Error(`B+ tree minKeys does not match stored index metadata ${indexStore.getMeta('minKeys')} != ${this.minKeys}`);
      }

      this._buildTreeFromStorage();

    } else {
      this.indexStore.setMeta('order', this.order);
      this.indexStore.setMeta('minKeys', this.minKeys);
      this.indexStore.setMeta('nextId', 1);
      this.root = new BPlusTreeNode(true, this.indexStore);
      this.indexStore.setMeta('rootId', this.root.id);
    }
  }

  /**
   * Builds the B+ tree from existing data in the IndexStore
   * @private
   */
  _buildTreeFromStorage() {
    const nodeCache = new Map();
    const rootData = this.indexStore.getDataMap('nodes').get(this.indexStore.getMeta('rootId'));
    if (!rootData) {
      throw new Error('BPlusTree: Root node not found in IndexStore');
    }
    this.root = new BPlusTreeNode(rootData,this.indexStore, nodeCache);
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
     * @param {BPlusTreeNode} node - The node to search in
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
            // Keys in internal nodes are separators - go right if key >= separator
            let i = 0;
            while (i < node.keys.length && key >= node.keys[i]) {
                i++;
            }
            return this._searchNode(node.children[i], key);
        }
    }

    /**
     * Inserts a key-value pair into the B+ tree.
     * If the key already exists, its value will be updated.
     * @param {*} key - The key to insert
     * @param {*} value - The value to associate with the key
     */
    add(key, value) {
        const root = this.root;

        // If root is full, split it
        if (root.keys.length === this.indexStore.getMeta('order') - 1) {
            const newRoot = new BPlusTreeNode(false, this.indexStore);
            newRoot.children.push(this.root);
            this._splitChild(newRoot, 0);
            this.root = newRoot;
            this.indexStore.setMeta('rootId', this.root.id);
        }

        this._insertNonFull(this.root, key, value);
    }

    /**
     * Inserts a key-value pair into a node that is not full
     * @private
     * @param {BPlusTreeNode} node - The node to insert into
     * @param {*} key - The key to insert
     * @param {*} value - The value to insert
     */
    _insertNonFull(node, key, value) {
        let i = node.keys.length - 1;

        if (node.isLeaf) {
            // Check if key already exists and update its value
            for (let j = 0; j < node.keys.length; j++) {
                if (node.keys[j] === key) {
                    node.values[j] = value;
                    return;
                }
            }

            // Insert into leaf node in sorted order
            node.keys.push(null);
            node.values.push(null);

            while (i >= 0 && key < node.keys[i]) {
                node.keys[i + 1] = node.keys[i];
                node.values[i + 1] = node.values[i];
                i--;
            }

            node.keys[i + 1] = key;
            node.values[i + 1] = value;

            console.log(`Inserted key '${key}', value '${value}' into leaf node.`);
            console.dir(node);

        } else {
            // Find the child to insert into
            // In internal nodes, go right if key >= separator
            i = 0;
            while (i < node.keys.length && key >= node.keys[i]) {
                i++;
            }

            // If child is full, split it
            if (node.children[i].keys.length === this.indexStore.getMeta('order') - 1) {
                this._splitChild(node, i);
                // After split, re-check which child to insert into
                if (key >= node.keys[i]) {
                    i++;
                }
            }

            this._insertNonFull(node.children[i], key, value);
        }
    }

    /**
     * Splits a full child node
     * @private
     * @param {BPlusTreeNode} parent - The parent node
     * @param {number} index - The index of the child to split
     */
    _splitChild(parent, index) {
        const fullChild = parent.children[index];
        const newChild = new BPlusTreeNode(fullChild.isLeaf, this.indexStore);
        const midIndex = Math.floor((this.indexStore.getMeta('order') - 1) / 2);

        if (fullChild.isLeaf) {
            // For leaf nodes, copy the upper half to new node
            newChild.keys = fullChild.keys.splice(midIndex);
            newChild.values = fullChild.values.splice(midIndex);

            // Link leaf nodes
            newChild.next = fullChild.next;
            fullChild.next = newChild;

            // Promote a copy of the first key of newChild to parent
            parent.keys.splice(index, 0, newChild.keys[0]);
        } else {
            // For internal nodes, split children
            newChild.keys = fullChild.keys.splice(midIndex + 1);
            const promotedKey = fullChild.keys.pop();
            newChild.children = fullChild.children.splice(midIndex + 1);

            // Promote the middle key to parent
            parent.keys.splice(index, 0, promotedKey);
        }

        parent.children.splice(index + 1, 0, newChild);
    }

    /**
     * Deletes a key from the B+ tree
     * @param {*} key - The key to delete
     * @returns {boolean} True if the key was found and deleted, false otherwise
     */
    delete(key) {
        const deleted = this._delete(this.root, key);

        // If root is now empty after deletion, make its only child the new root
        if (this.root.keys.length === 0) {
            if (!this.root.isLeaf && this.root.children.length > 0) {
                this.root = this.root.children[0];
                this.indexStore.setMeta('rootId', this.root.id);
            }
        }

        return deleted;
    }

    /**
     * Internal method to delete a key from a node
     * @private
     * @param {BPlusTreeNode} node - The node to delete from
     * @param {*} key - The key to delete
     * @returns {boolean} True if deleted, false otherwise
     */
    _delete(node, key) {
        if (node.isLeaf) {
            // Found the key in a leaf node
            for (let i = 0; i < node.keys.length; i++) {
                if (key === node.keys[i]) {
                    node.keys.splice(i, 1);
                    node.values.splice(i, 1);
                    return true;
                }
            }
            return false;
        } else {
            // Find the appropriate child to delete from
            let i = 0;
            while (i < node.keys.length && key >= node.keys[i]) {
                i++;
            }

            // Recursively delete from the appropriate child
            const deleted = this._delete(node.children[i], key);

            if (deleted) {
                // After deletion, check if child needs rebalancing
                this._rebalanceAfterDelete(node, i);
            }

            return deleted;
        }
    }

    /**
     * Rebalances the tree after a deletion
     * @private
     * @param {BPlusTreeNode} parent - The parent node
     * @param {number} index - The index of the child that was modified
     */
    _rebalanceAfterDelete(parent, index) {
        const child = parent.children[index];

        // If child has enough keys, no rebalancing needed
        if (child.keys.length >= this.indexStore.getMeta('minKeys')) {
            return;
        }

        // Try to borrow from left sibling
        if (index > 0) {
            const leftSibling = parent.children[index - 1];
            if (leftSibling.keys.length > this.indexStore.getMeta('minKeys')) {
                this._borrowFromLeft(parent, index);
                return;
            }
        }

        // Try to borrow from right sibling
        if (index < parent.children.length - 1) {
            const rightSibling = parent.children[index + 1];
            if (rightSibling.keys.length > this.indexStore.getMeta('minKeys')) {
                this._borrowFromRight(parent, index);
                return;
            }
        }

        // Merge with a sibling
        if (index > 0) {
            this._merge(parent, index - 1);
        } else {
            this._merge(parent, index);
        }
    }

    /**
     * Borrows a key from the left sibling
     * @private
     * @param {BPlusTreeNode} parent - The parent node
     * @param {number} index - The index of the child
     */
    _borrowFromLeft(parent, index) {
        const child = parent.children[index];
        const leftSibling = parent.children[index - 1];

        if (child.isLeaf) {
            // Move the last key-value from left sibling to child
            child.keys.unshift(leftSibling.keys.pop());
            child.values.unshift(leftSibling.values.pop());

            // Update parent key
            parent.keys[index - 1] = child.keys[0];
        } else {
            // Move parent key down and left sibling's last key up
            child.keys.unshift(parent.keys[index - 1]);
            parent.keys[index - 1] = leftSibling.keys.pop();
            child.children.unshift(leftSibling.children.pop());
        }
    }

    /**
     * Borrows a key from the right sibling
     * @private
     * @param {BPlusTreeNode} parent - The parent node
     * @param {number} index - The index of the child
     */
    _borrowFromRight(parent, index) {
        const child = parent.children[index];
        const rightSibling = parent.children[index + 1];

        if (child.isLeaf) {
            // Move the first key-value from right sibling to child
            child.keys.push(rightSibling.keys.shift());
            child.values.push(rightSibling.values.shift());

            // Update parent key
            parent.keys[index] = rightSibling.keys[0];
        } else {
            // Move parent key down and right sibling's first key up
            child.keys.push(parent.keys[index]);
            parent.keys[index] = rightSibling.keys.shift();
            child.children.push(rightSibling.children.shift());
        }
    }

    /**
     * Merges a child with its right sibling
     * @private
     * @param {BPlusTreeNode} parent - The parent node
     * @param {number} index - The index of the left child to merge
     */
    _merge(parent, index) {
        const leftChild = parent.children[index];
        const rightChild = parent.children[index + 1];

        if (leftChild.isLeaf) {
            // Merge leaf nodes
            leftChild.keys = leftChild.keys.concat(rightChild.keys);
            leftChild.values = leftChild.values.concat(rightChild.values);
            leftChild.next = rightChild.next;

            // Remove the parent key
            parent.keys.splice(index, 1);
        } else {
            // Merge internal nodes
            leftChild.keys.push(parent.keys[index]);
            leftChild.keys = leftChild.keys.concat(rightChild.keys);
            leftChild.children = leftChild.children.concat(rightChild.children);

            // Remove the parent key
            parent.keys.splice(index, 1);
        }

        // Remove the right child
        parent.children.splice(index + 1, 1);
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
     * @param {BPlusTreeNode} node - The node to start from
     * @returns {BPlusTreeNode} The leftmost leaf node
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
        return this.root.keys.length === 0;
    }

    /**
     * Clears all entries from the tree
     */
    clear() {
      this.indexStore.getDataMap('nodes').clear();
      this.root = new BPlusTreeNode(true, this.indexStore);
      this.indexStore.setMeta('rootId', this.root.id);
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
