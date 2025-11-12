import { Index } from './Index.js';
import { RTree } from './RTree.js';
import { getProp } from './utils.js';

/**
 * Geospatial index implementation using RTree
 * Supports geospatial queries on GeoJSON fields
 */
export class GeospatialCollectionIndex extends Index {
	constructor(name, keys, storage, options = {}) {
		super(name, keys, storage, options);
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
    console.log("GeospatialCollectionIndex query", query);
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

		// Handle $near with radius
		if (geoQuery.$near) {
			const nearQuery = geoQuery.$near;
			
			// Extract geometry from $geometry or use direct coordinates
			let coordinates;
			if (nearQuery.$geometry) {
				coordinates = nearQuery.$geometry.coordinates;
			} else if (nearQuery.coordinates) {
				coordinates = nearQuery.coordinates;
			} else if (Array.isArray(nearQuery)) {
				coordinates = nearQuery;
			} else {
				return null;
			}

			if (!coordinates || coordinates.length < 2) {
				return null;
			}

			const [lng, lat] = coordinates;
			
			// $maxDistance in meters (default to 1000km if not specified)
			const maxDistanceMeters = nearQuery.$maxDistance || 1000000;
			const maxDistanceKm = maxDistanceMeters / 1000;

			// Use rtree.searchRadius to find points within distance
			const results = this.rtree.searchRadius(lat, lng, maxDistanceKm);

			// Calculate actual distances and sort by distance
			const withDistances = results.map(entry => {
				const dist = this._haversineDistance(lat, lng, entry.lat, entry.lng);
				return {
					_id: entry.data._id,
					distance: dist
				};
			});

			// Sort by distance (ascending)
			withDistances.sort((a, b) => a.distance - b.distance);

			// Return just the document IDs
			return withDistances.map(entry => entry._id);
		}

		// Handle $nearSphere with radius (uses spherical distance, same as $near)
		if (geoQuery.$nearSphere) {
			const nearQuery = geoQuery.$nearSphere;
			
			// Extract geometry from $geometry or use direct coordinates
			let coordinates;
			if (nearQuery.$geometry) {
				coordinates = nearQuery.$geometry.coordinates;
			} else if (nearQuery.coordinates) {
				coordinates = nearQuery.coordinates;
			} else if (Array.isArray(nearQuery)) {
				coordinates = nearQuery;
			} else {
				return null;
			}

			if (!coordinates || coordinates.length < 2) {
				return null;
			}

			const [lng, lat] = coordinates;
			
			// $maxDistance in meters (default to 1000km if not specified)
			const maxDistanceMeters = nearQuery.$maxDistance || 1000000;
			const maxDistanceKm = maxDistanceMeters / 1000;

			// Use rtree.searchRadius to find points within distance (already uses Haversine)
			const results = this.rtree.searchRadius(lat, lng, maxDistanceKm);

			// Calculate actual distances and sort by distance
			const withDistances = results.map(entry => {
				const dist = this._haversineDistance(lat, lng, entry.lat, entry.lng);
				return {
					_id: entry.data._id,
					distance: dist
				};
			});

			// Sort by distance (ascending)
			withDistances.sort((a, b) => a.distance - b.distance);

			// Return just the document IDs
			return withDistances.map(entry => entry._id);
		}

		// Handle $geoIntersects
		if (geoQuery.$geoIntersects) {
			const intersectsQuery = geoQuery.$geoIntersects;
			
			// Extract geometry
			let geometry;
			if (intersectsQuery.$geometry) {
				geometry = intersectsQuery.$geometry;
			} else {
				return null;
			}

			if (!geometry || !geometry.type) {
				return null;
			}

			// For now, support Point and Polygon geometries
			if (geometry.type === 'Point') {
				const [lng, lat] = geometry.coordinates;
				
				// Search for points at this exact location
				// Use a very small bounding box
				const epsilon = 0.0001; // ~11 meters
				const results = this.rtree.searchBBox({
					minLat: lat - epsilon,
					maxLat: lat + epsilon,
					minLng: lng - epsilon,
					maxLng: lng + epsilon
				});

				// Return document IDs
				return results.map(entry => entry.data._id);
			} else if (geometry.type === 'Polygon') {
				const coordinates = geometry.coordinates;
				if (!coordinates || coordinates.length === 0) {
					return null;
				}

				// Get the exterior ring
				const ring = coordinates[0];
				if (!ring || ring.length < 3) {
					return null;
				}

				// Calculate bounding box of the polygon
				let minLat = Infinity, maxLat = -Infinity;
				let minLng = Infinity, maxLng = -Infinity;
				
				for (const coord of ring) {
					const [lng, lat] = coord;
					minLat = Math.min(minLat, lat);
					maxLat = Math.max(maxLat, lat);
					minLng = Math.min(minLng, lng);
					maxLng = Math.max(maxLng, lng);
				}

				// Search for points within the bounding box
				const candidates = this.rtree.searchBBox({
					minLat,
					maxLat,
					minLng,
					maxLng
				});

				// Filter by actual point-in-polygon test
				const results = candidates.filter(entry => {
					return this._pointInPolygon(entry.lat, entry.lng, ring);
				});

				return results.map(entry => entry.data._id);
			}

			return null;
		}

		return null;
	}

	/**
	 * Calculate distance between two points using Haversine formula
	 * @param {number} lat1 - Latitude of first point
	 * @param {number} lng1 - Longitude of first point
	 * @param {number} lat2 - Latitude of second point
	 * @param {number} lng2 - Longitude of second point
	 * @returns {number} Distance in kilometers
	 */
	_haversineDistance(lat1, lng1, lat2, lng2) {
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
	 * Test if a point is inside a polygon using ray casting algorithm
	 * @param {number} lat - Point latitude
	 * @param {number} lng - Point longitude
	 * @param {Array} ring - Polygon ring as array of [lng, lat] coordinates
	 * @returns {boolean} True if point is inside polygon
	 */
	_pointInPolygon(lat, lng, ring) {
		let inside = false;
		
		for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
			const [xi, yi] = ring[i];
			const [xj, yj] = ring[j];
			
			const intersect = ((yi > lat) !== (yj > lat)) &&
				(lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
			
			if (intersect) {
				inside = !inside;
			}
		}
		
		return inside;
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

	/**
	 * Serialize index state for storage
	 * @returns {Object} Serializable index state
	 */
	serialize() {
		return {
			type: 'geospatial',
			keys: this.keys,
			options: this.options,
			geoField: this.geoField,
			rtreeState: this.rtree.serialize()
		};
	}

	/**
	 * Restore index state from serialized data
	 * @param {Object} state - Serialized index state
	 */
	deserialize(state) {
		this.geoField = state.geoField;
		if (state.rtreeState) {
			this.rtree.deserialize(state.rtreeState);
		}
	}
}
