
import { IndexStore } from './IndexStore.js';

/**
 * R-tree implementation for geospatial indexing
 * 
 * This implementation supports:
 * - Adding points with lat/lng coordinates
 * - Removing points
 * - Bounding box queries
 * - Location + radius queries (converted to bounding box)
 */

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
	const R = 6371; // Earth's radius in kilometers
	const dLat = (lat2 - lat1) * Math.PI / 180;
	const dLng = (lng2 - lng1) * Math.PI / 180;
	const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
		Math.sin(dLng / 2) * Math.sin(dLng / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

/**
 * Convert radius query to bounding box
 * Approximation: 1 degree latitude ≈ 111 km
 * @param {number} lat - Center latitude
 * @param {number} lng - Center longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Object} Bounding box {minLat, maxLat, minLng, maxLng}
 */
function radiusToBoundingBox(lat, lng, radiusKm) {
	const latDelta = radiusKm / 111; // degrees
	const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180)); // degrees
	
	return {
		minLat: lat - latDelta,
		maxLat: lat + latDelta,
		minLng: lng - lngDelta,
		maxLng: lng + lngDelta
	};
}

/**
 * Check if two bounding boxes intersect
 */
function intersects(bbox1, bbox2) {
	return !(bbox1.maxLat < bbox2.minLat ||
		bbox1.minLat > bbox2.maxLat ||
		bbox1.maxLng < bbox2.minLng ||
		bbox1.minLng > bbox2.maxLng);
}

/**
 * Check if bbox1 contains bbox2
 */
function contains(bbox1, bbox2) {
	return bbox1.minLat <= bbox2.minLat &&
		bbox1.maxLat >= bbox2.maxLat &&
		bbox1.minLng <= bbox2.minLng &&
		bbox1.maxLng >= bbox2.maxLng;
}

/**
 * Calculate the area of a bounding box
 */
function area(bbox) {
	return (bbox.maxLat - bbox.minLat) * (bbox.maxLng - bbox.minLng);
}

/**
 * Calculate the bounding box that contains both input boxes
 */
function union(bbox1, bbox2) {
	return {
		minLat: Math.min(bbox1.minLat, bbox2.minLat),
		maxLat: Math.max(bbox1.maxLat, bbox2.maxLat),
		minLng: Math.min(bbox1.minLng, bbox2.minLng),
		maxLng: Math.max(bbox1.maxLng, bbox2.maxLng)
	};
}

/**
 * Calculate the enlargement needed to include bbox2 in bbox1
 */
function enlargement(bbox1, bbox2) {
	const unionBox = union(bbox1, bbox2);
	return area(unionBox) - area(bbox1);
}

/**
 * R-tree Node class
 */
class RTreeNode {
	constructor(isLeaf = false, indexStore) {
    if (!(indexStore instanceof IndexStore)) {
      throw new Error('IndexStore is required to create RTreeNode');
    }

    this.indexStore = indexStore;

    if (typeof isLeaf === 'object') {
      this._data = isLeaf;
      this.id = this._data.id;
      this.isLeaf = this._data.isLeaf;
      this.children = [];
      this.bbox = Object.assign({}, this._data.bbox);

      // leaf nodes will have data entries as children
      // internal nodes will have child node IDs
      if (!this.isLeaf) {
        for (const childId of this._data.children) {
          const childData = indexStore.get(childId);
          if (!childData) {
            throw new Error(`RTreeNode: Child node with id ${childId} not found in IndexStore`);
          }
          const childNode = new RTreeNode(childData, indexStore);
          this.children.push(childNode);
        }
      } else {
        this.children = [...this._data.children];
      }

    } else {
      this._data = {
        id: indexStore.getMeta('nextId'),
        isLeaf: isLeaf,
        children: [],
        bbox: null
      };
      indexStore.setMeta('nextId', this._data.id + 1);
      indexStore.set(this._data.id, this._data);
      this.id = this._data.id;
      this.isLeaf = isLeaf;
      this.children = []; // For internal nodes: child nodes; For leaf nodes: data entries
      this.bbox = null;
    }

    return new Proxy(this, {
      set(target, prop, value) {
        if (prop === 'children') {
          // console.warn('Directly modifying children', value);
          target.children = value;
          // Update the stored children IDs
          if (!target.isLeaf) {
            target._data.children = target.children.map(child => child.id);
          } else {
            target._data.children = [...target.children];
          }
          indexStore.set(target.id, target._data);
          return true;
        }
        target[prop] = value;
        return true;
      },
      get(target, prop) {
        if (prop === 'children') {
          return new Proxy(target.children, {
            set(childTarget, childProp, childValue) {
              childTarget[childProp] = childValue;
              // Update the stored children IDs
              if (!target.isLeaf) {
                target._data.children = target.children.map(child => child.id);
              } else {
                target._data.children = [...target.children];
              }
              indexStore.set(target.id, target._data);
              return true;
            }
          });
        }
        return target[prop];
      }
    });
	}

	/**
	 * Update the bounding box to contain all children
	 */
	updateBBox() {
		if (this.children.length === 0) {
			this.bbox = null;
			return;
		}

		let minLat = Infinity, maxLat = -Infinity;
		let minLng = Infinity, maxLng = -Infinity;

		for (const child of this.children) {
			const bbox = child.bbox;
			minLat = Math.min(minLat, bbox.minLat);
			maxLat = Math.max(maxLat, bbox.maxLat);
			minLng = Math.min(minLng, bbox.minLng);
			maxLng = Math.max(maxLng, bbox.maxLng);
		}

		this.bbox = { minLat, maxLat, minLng, maxLng };
    this._data.bbox = Object.assign({}, this.bbox);
    this.indexStore.set(this.id, this._data);
	}
}

/**
 * R-tree implementation
 */
export class RTree {
	constructor(maxEntries = 9, indexStore = new IndexStore()) {
		this.maxEntries = maxEntries;
		this.minEntries = Math.max(2, Math.ceil(maxEntries / 2));
    this.indexStore = indexStore;

    if (indexStore.hasMeta('maxEntries')) {
      if (indexStore.getMeta('maxEntries') !== maxEntries) {
        throw new Error(`R-tree maxEntries does not match stored index metadata ${indexStore.getMeta('maxEntries')} != ${maxEntries}`);
      }
      if (indexStore.getMeta('minEntries') !== this.minEntries) {
        throw new Error(`R-tree minEntries does not match stored index metadata ${indexStore.getMeta('minEntries')} != ${this.minEntries}`);
      }

      this._size = this.indexStore.getMeta('size');
      this.root = new RTreeNode(this.indexStore.get(this.indexStore.getMeta('rootId')), this.indexStore);
    } else {
      this.indexStore.setMeta('maxEntries', this.maxEntries);
      this.indexStore.setMeta('minEntries', this.minEntries);
      this.indexStore.setMeta('nextId', 1);
      this.root = new RTreeNode(true, this.indexStore);
      this.indexStore.setMeta('rootId', this.root.id);
      this.indexStore.setMeta('size', 0);
      this._size = 0;
    }
	}

	/**
	 * Insert a point into the R-tree
	 * @param {number} lat - Latitude
	 * @param {number} lng - Longitude
	 * @param {*} data - Associated data
	 */
	insert(lat, lng, data) {
		// Create a point bounding box (bbox with zero area)
		const bbox = {
			minLat: lat,
			maxLat: lat,
			minLng: lng,
			maxLng: lng
		};

		const entry = { bbox, lat, lng, data };
		this._insert(entry, this.root, 1);
		this._size++;
    this.indexStore.setMeta('size', this._size);
	}

	/**
	 * Internal insert method
	 */
	_insert(entry, node, level) {
		if (node.isLeaf) {
			node.children.push(entry);
			node.updateBBox();

			if (node.children.length > this.maxEntries) {
				return this._split(node);
			}
		} else {
			// Choose subtree
			const target = this._chooseSubtree(entry.bbox, node);
			const splitNode = this._insert(entry, target, level + 1);

			if (splitNode) {
				node.children.push(splitNode);
				node.updateBBox();

				if (node.children.length > this.maxEntries) {
					return this._split(node);
				}
			} else {
				node.updateBBox();
			}
		}
		return null;
	}

	/**
	 * Choose the best subtree to insert an entry
	 */
	_chooseSubtree(bbox, node) {
		let minEnlargement = Infinity;
		let minArea = Infinity;
		let targetNode = null;

		for (const child of node.children) {
			const enl = enlargement(child.bbox, bbox);
			const ar = area(child.bbox);

			if (enl < minEnlargement || (enl === minEnlargement && ar < minArea)) {
				minEnlargement = enl;
				minArea = ar;
				targetNode = child;
			}
		}

		return targetNode;
	}

	/**
	 * Split an overflowing node
	 */
	_split(node) {

    // console.log(`Splitting node ${node.id} with ${node.children.length} children`);
		// Simple linear split algorithm
		const children = node.children;
		const isLeaf = node.isLeaf;

		// Find two seeds (most distant entries)
		let maxDist = -Infinity;
		let seed1Idx = 0, seed2Idx = 1;

		for (let i = 0; i < children.length; i++) {
			for (let j = i + 1; j < children.length; j++) {
				const bbox1 = children[i].bbox;
				const bbox2 = children[j].bbox;
				const combinedBox = union(bbox1, bbox2);
				const waste = area(combinedBox) - area(bbox1) - area(bbox2);
				
				if (waste > maxDist) {
					maxDist = waste;
					seed1Idx = i;
					seed2Idx = j;
				}
			}
		}

		// Create two new nodes
		const node1 = new RTreeNode(isLeaf, this.indexStore);
		const node2 = new RTreeNode(isLeaf, this.indexStore);

		node1.children.push(children[seed1Idx]);
		node2.children.push(children[seed2Idx]);

    // console.log('node1 children after seeds:', node1);
    // console.log('node2 children after seeds:', node2);

		// Distribute remaining entries
		for (let i = 0; i < children.length; i++) {
			if (i === seed1Idx || i === seed2Idx) continue;

			const child = children[i];
			const bbox = child.bbox;
			
			const enl1 = node1.children.length === 0 ? Infinity : enlargement(node1.bbox || bbox, bbox);
			const enl2 = node2.children.length === 0 ? Infinity : enlargement(node2.bbox || bbox, bbox);

			if (node1.children.length < this.minEntries && 
				children.length - i + node1.children.length <= this.minEntries) {
				node1.children.push(child);
			} else if (node2.children.length < this.minEntries && 
				children.length - i + node2.children.length <= this.minEntries) {
				node2.children.push(child);
			} else if (enl1 < enl2) {
				node1.children.push(child);
			} else if (enl2 < enl1) {
				node2.children.push(child);
			} else {
				// Equal enlargement, choose the one with smaller area
				const area1 = node1.bbox ? area(node1.bbox) : 0;
				const area2 = node2.bbox ? area(node2.bbox) : 0;
				if (area1 < area2) {
					node1.children.push(child);
				} else {
					node2.children.push(child);
				}
			}

			node1.updateBBox();
			node2.updateBBox();
		}

		// Update the original node with one group
		node.children = node1.children;
		node.updateBBox();

		// If this was the root, create a new root
		if (node === this.root) {
			const newRoot = new RTreeNode(false, this.indexStore);
			newRoot.children = [node1, node2];
			newRoot.updateBBox();
			this.root = newRoot;
      this.indexStore.setMeta('rootId', this.root.id);
			return null;
		}

		return node2;
	}

	/**
	 * Search for points within a bounding box
	 * @param {Object} bbox - Bounding box {minLat, maxLat, minLng, maxLng}
	 * @returns {Array} Array of matching entries
	 */
	searchBBox(bbox) {
		const results = [];
		this._searchBBox(bbox, this.root, results);
		return results;
	}

	/**
	 * Internal bounding box search
	 */
	_searchBBox(bbox, node, results) {
		if (!node.bbox || !intersects(bbox, node.bbox)) {
			return;
		}

		if (node.isLeaf) {
			for (const entry of node.children) {
				if (intersects(bbox, entry.bbox)) {
					results.push(entry);
				}
			}
		} else {
			for (const child of node.children) {
				this._searchBBox(bbox, child, results);
			}
		}
	}

	/**
	 * Search for points within a radius of a location
	 * @param {number} lat - Center latitude
	 * @param {number} lng - Center longitude
	 * @param {number} radiusKm - Radius in kilometers
	 * @returns {Array} Array of matching entries
	 */
	searchRadius(lat, lng, radiusKm) {
		// Convert radius to bounding box for initial filtering
		const bbox = radiusToBoundingBox(lat, lng, radiusKm);
		const candidates = this.searchBBox(bbox);

		// Filter by actual distance
		const results = [];
		for (const entry of candidates) {
			const dist = haversineDistance(lat, lng, entry.lat, entry.lng);
			if (dist <= radiusKm) {
				results.push(entry);
			}
		}

		return results;
	}

	/**
	 * Remove a point from the R-tree
	 * @param {number} lat - Latitude
	 * @param {number} lng - Longitude
	 * @param {*} data - Associated data (optional, for exact match)
	 * @returns {boolean} True if removed, false if not found
	 */
	remove(lat, lng, data = null) {
		const bbox = {
			minLat: lat,
			maxLat: lat,
			minLng: lng,
			maxLng: lng
		};

		const removed = this._remove(bbox, data, this.root, null, -1);
		
		if (removed) {
			this._size--;
      this.indexStore.setMeta('size', this._size);
		}
		
		// If root has only one child after removal, make that child the new root
		if (this.root.children.length === 1 && !this.root.isLeaf) {
			this.root = this.root.children[0];
      this.indexStore.setMeta('rootId', this.root.id);
		}

		return removed;
	}

	/**
	 * Internal remove method
	 */
	_remove(bbox, data, node, parent, indexInParent) {
		if (!node.bbox || !intersects(bbox, node.bbox)) {
			return false;
		}

		if (node.isLeaf) {
			for (let i = 0; i < node.children.length; i++) {
				const entry = node.children[i];
				if (entry.lat === bbox.minLat && entry.lng === bbox.minLng) {
					// If data is specified, check for match
					const dataMatches = data === null || 
						JSON.stringify(entry.data) === JSON.stringify(data);
					
					if (dataMatches) {
						node.children.splice(i, 1);
						node.updateBBox();
						
						// Handle underflow
						if (node.children.length < this.minEntries && node !== this.root) {
							// Simple approach: reinsert all entries from this node
							const entries = node.children.slice();
							node.children = [];
							node.updateBBox();
							
							// Remove this node from parent
							if (parent) {
								parent.children.splice(indexInParent, 1);
								parent.updateBBox();
							}
							
							// Reinsert entries
							for (const e of entries) {
								this._insert(e, this.root, 1);
							}
						}
						
						return true;
					}
				}
			}
		} else {
			for (let i = 0; i < node.children.length; i++) {
				const child = node.children[i];
				if (this._remove(bbox, data, child, node, i)) {
					node.updateBBox();
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Get all entries in the tree
	 * @returns {Array} All entries
	 */
	getAll() {
		const results = [];
		this._getAll(this.root, results);
		return results;
	}

	/**
	 * Internal method to get all entries
	 */
	_getAll(node, results) {
		if (node.isLeaf) {
			results.push(...node.children);
		} else {
			for (const child of node.children) {
				this._getAll(child, results);
			}
		}
	}

	/**
	 * Get the number of entries in the tree
	 * @returns {number} Number of entries
	 */
	size() {
		return this._size;
	}

	/**
	 * Clear all entries from the tree
	 */
	clear() {
		this.root = new RTreeNode(true, this.indexStore);
    this.indexStore.setMeta('rootId', this.root.id);
		this._size = 0;
    this.indexStore.setMeta('size', 0);
	}

}

export default RTree;
