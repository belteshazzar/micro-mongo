import { CollectionIndex } from './CollectionIndex.js';
import { RTree } from './RTree.js';
import { getProp } from './utils.js';

/**
 * Geospatial index implementation using RTree
 * Supports geospatial queries on GeoJSON fields
 */
export class GeospatialCollectionIndex extends CollectionIndex {
	constructor(keys, options = {}) {
		super(keys, options);
		// Create the underlying RTree
		this.rtree = new RTree();
		// Track which field is the geospatial field
		this.geoField = null;
		for (const field in keys) {
			if (keys[field] === '2dsphere' || keys[field] === '2d') {
				this.geoField = field;
				break;
			}
		}
		if (!this.geoField) {
			throw new Error('Geospatial index must have at least one field with type "2dsphere" or "2d"');
		}
	}

	/**
	 * Extract coordinates from a GeoJSON object
	 * @param {Object} geoJson - The GeoJSON object
	 * @returns {Object|null} Object with lat and lng, or null if invalid
	 */
	_extractCoordinates(geoJson) {
		if (!geoJson) return null;

		// Handle GeoJSON FeatureCollection
		if (geoJson.type === 'FeatureCollection' && geoJson.features && geoJson.features.length > 0) {
			const feature = geoJson.features[0];
			if (feature.geometry) {
				return this._extractCoordinates(feature.geometry);
			}
		}

		// Handle GeoJSON Feature
		if (geoJson.type === 'Feature' && geoJson.geometry) {
			return this._extractCoordinates(geoJson.geometry);
		}

		// Handle GeoJSON Point
		if (geoJson.type === 'Point' && geoJson.coordinates) {
			const [lng, lat] = geoJson.coordinates;
			if (typeof lng === 'number' && typeof lat === 'number') {
				return { lat, lng };
			}
		}

		// Handle GeoJSON Polygon - use centroid of first coordinate
		if (geoJson.type === 'Polygon' && geoJson.coordinates && geoJson.coordinates.length > 0) {
			const ring = geoJson.coordinates[0];
			if (ring.length > 0) {
				let sumLat = 0, sumLng = 0;
				for (const coord of ring) {
					sumLng += coord[0];
					sumLat += coord[1];
				}
				return {
					lat: sumLat / ring.length,
					lng: sumLng / ring.length
				};
			}
		}

		return null;
	}

	/**
	 * Add a document to the geospatial index
	 * @param {Object} doc - The document to index
	 */
	add(doc) {
		if (!doc._id) {
			throw new Error('Document must have an _id field');
		}
		const geoValue = getProp(doc, this.geoField);
		const coords = this._extractCoordinates(geoValue);
		if (coords) {
			this.rtree.insert(coords.lat, coords.lng, { 
				_id: doc._id, 
				geoJson: geoValue 
			});
		}
	}

	/**
	 * Remove a document from the geospatial index
	 * @param {Object} doc - The document to remove
	 */
	remove(doc) {
		if (!doc._id) {
			return;
		}
		const geoValue = getProp(doc, this.geoField);
		const coords = this._extractCoordinates(geoValue);
		if (coords) {
			this.rtree.remove(coords.lat, coords.lng, { 
				_id: doc._id, 
				geoJson: geoValue 
			});
		}
	}

	/**
	 * Query the geospatial index
	 * @param {*} query - The query object
	 * @returns {Array|null} Array of document IDs or null if query is not a geospatial query
	 */
	query(query) {
		// Check if this is a geospatial query on our indexed field
		if (!query[this.geoField]) {
			return null;
		}

		const geoQuery = query[this.geoField];

		// Handle $geoWithin with bounding box
		if (geoQuery.$geoWithin) {
			const bbox = geoQuery.$geoWithin;
			// bbox format: [[minLon, maxLat], [maxLon, minLat]]
			if (Array.isArray(bbox) && bbox.length === 2) {
				const minLon = bbox[0][0];
				const maxLat = bbox[0][1];
				const maxLon = bbox[1][0];
				const minLat = bbox[1][1];

				const results = this.rtree.searchBBox({
					minLat: minLat,
					maxLat: maxLat,
					minLng: minLon,
					maxLng: maxLon
				});

				// Extract document IDs
				return results.map(entry => entry.data._id);
			}
		}

		// Handle $near with radius (future enhancement)
		// if (geoQuery.$near) {
		//   const center = geoQuery.$near;
		//   const maxDistance = geoQuery.$maxDistance || 1000; // default 1000km
		//   // Implementation would use rtree.searchRadius
		// }

		return null;
	}

	/**
	 * Clear all data from the index
	 */
	clear() {
		this.rtree.clear();
	}

	/**
	 * Get index specification
	 */
	getSpec() {
		return {
			name: this.name,
			key: this.keys,
			'2dsphereIndexVersion': 3
		};
	}
}
