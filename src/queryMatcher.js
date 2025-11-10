import { getProp, isArray, arrayMatches, objectMatches, toArray, isIn, bboxToGeojson } from './utils.js';
import { TextIndex } from './TextIndex.js';
import { ObjectId } from './ObjectId.js';

/**
 * Compare two values for equality, handling ObjectId instances
 */
function valuesEqual(a, b) {
	// Handle ObjectId comparison
	if (a instanceof ObjectId || b instanceof ObjectId) {
		if (a instanceof ObjectId && b instanceof ObjectId) {
			return a.equals(b);
		}
		if (a instanceof ObjectId && typeof b === 'string') {
			return a.equals(b);
		}
		if (b instanceof ObjectId && typeof a === 'string') {
			return b.equals(a);
		}
		return false;
	}
	
	// Regular equality
	return a == b;
}

/**
 * Compare two values with a comparison operator, handling ObjectId instances
 */
function compareValues(a, b, operator) {
	// Convert ObjectIds to comparable values (use timestamp for ordering)
	let aVal = a;
	let bVal = b;
	
	if (a instanceof ObjectId) {
		aVal = a.toString();
	}
	if (b instanceof ObjectId) {
		bVal = b.toString();
	}
	
	switch(operator) {
		case '>': return aVal > bVal;
		case '>=': return aVal >= bVal;
		case '<': return aVal < bVal;
		case '<=': return aVal <= bVal;
		default: return false;
	}
}

/**
 * Text search helper
 * Creates a temporary TextIndex to check if the text matches the query
 */
export function text(prop, query) {
	const textIndex = new TextIndex();
	textIndex.add('id', prop);
	const results = textIndex.query(query, { scored: false });
	return results.length === 1;
}

/**
 * Geo within helper - using bounding box logic instead of de9im
 * This is a simpler implementation that doesn't require de9im dependency
 */
export function geoWithin(prop, query) {
	try {
		// bbox format: [[minLon, maxLat], [maxLon, minLat]]
		if (!Array.isArray(query) || query.length !== 2) {
			return false;
		}

		const minLon = query[0][0];
		const maxLat = query[0][1];
		const maxLon = query[1][0];
		const minLat = query[1][1];

		// Check if geometry is within bounding box
		return isGeometryWithinBBox(prop, minLon, maxLon, minLat, maxLat);
	} catch (e) {
		return false;
	}
}

/**
 * Check if a GeoJSON geometry is within a bounding box
 * For Points: checks if the point is within the bbox
 * For Polygons: checks if ALL vertices are within the bbox
 */
function isGeometryWithinBBox(geoJson, minLon, maxLon, minLat, maxLat) {
	if (!geoJson) return false;

	// Handle GeoJSON FeatureCollection
	if (geoJson.type === 'FeatureCollection' && geoJson.features && geoJson.features.length > 0) {
		// All features must be within the bbox
		for (const feature of geoJson.features) {
			if (feature.geometry) {
				if (!isGeometryWithinBBox(feature.geometry, minLon, maxLon, minLat, maxLat)) {
					return false;
				}
			}
		}
		return true;
	}

	// Handle GeoJSON Feature
	if (geoJson.type === 'Feature' && geoJson.geometry) {
		return isGeometryWithinBBox(geoJson.geometry, minLon, maxLon, minLat, maxLat);
	}

	// Handle GeoJSON Point
	if (geoJson.type === 'Point' && geoJson.coordinates) {
		const [lng, lat] = geoJson.coordinates;
		if (typeof lng === 'number' && typeof lat === 'number') {
			return lng >= minLon && lng <= maxLon && lat >= minLat && lat <= maxLat;
		}
	}

	// Handle GeoJSON Polygon - ALL vertices must be within the bbox
	if (geoJson.type === 'Polygon' && geoJson.coordinates && geoJson.coordinates.length > 0) {
		for (const ring of geoJson.coordinates) {
			for (const coord of ring) {
				const lng = coord[0];
				const lat = coord[1];
				if (lng < minLon || lng > maxLon || lat < minLat || lat > maxLat) {
					return false;
				}
			}
		}
		return true;
	}

	return false;
}

/**
 * Extract coordinates from a GeoJSON object for indexing purposes
 * This uses centroid for polygons to get a single point to index
 * @param {Object} geoJson - The GeoJSON object
 * @returns {Object|null} Object with lat and lng, or null if invalid
 */
function extractCoordinatesFromGeoJSON(geoJson) {
	if (!geoJson) return null;

	// Handle GeoJSON FeatureCollection
	if (geoJson.type === 'FeatureCollection' && geoJson.features && geoJson.features.length > 0) {
		const feature = geoJson.features[0];
		if (feature.geometry) {
			return extractCoordinatesFromGeoJSON(feature.geometry);
		}
	}

	// Handle GeoJSON Feature
	if (geoJson.type === 'Feature' && geoJson.geometry) {
		return extractCoordinatesFromGeoJSON(geoJson.geometry);
	}

	// Handle GeoJSON Point
	if (geoJson.type === 'Point' && geoJson.coordinates) {
		const [lng, lat] = geoJson.coordinates;
		if (typeof lng === 'number' && typeof lat === 'number') {
			return { lat, lng };
		}
	}

	// Handle GeoJSON Polygon - use centroid of first coordinate ring
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
 * $where operator implementation
 * SECURITY NOTE: This uses Function constructor which can execute arbitrary code.
 * This is acceptable for a local/in-memory database but should NOT be used
 * in environments where untrusted user input is processed.
 */
export function where(doc, value) {
	if (typeof value === 'function') {
		try {
			return value.call(doc);
		} catch (e) {
			return false;
		}
	} else if (typeof value === 'string') {
		// Evaluate the string as a function
		try {
			var fn = new Function('return ' + value);
			return fn.call(doc);
		} catch (e) {
			return false;
		}
	}
	return false;
}

/**
 * Top-level match function
 */
export function tlMatches(doc, query) {
	var key = Object.keys(query)[0];
	var value = query[key];
	if (key.charAt(0) == "$") {
		if (key == "$and") return and(doc, value);
		else if (key == "$or") return or(doc, value);
		else if (key == "$not") return not(doc, value);
		else if (key == "$nor") return nor(doc, value);
		else if (key == "$where") return where(doc, value);
		else throw { $err: "Can't canonicalize query: BadValue unknown top level operator: " + key, code: 17287 };
	} else {
		return opMatches(doc, key, value);
	}
}

/**
 * Operator match function
 */
export function opMatches(doc, key, value) {
	if (typeof (value) == "string") return valuesEqual(getProp(doc, key), value);
	else if (typeof (value) == "number") return valuesEqual(getProp(doc, key), value);
	else if (typeof (value) == "boolean") return valuesEqual(getProp(doc, key), value);
	else if (value instanceof ObjectId) return valuesEqual(getProp(doc, key), value);
	else if (typeof (value) == "object") {
		if (value instanceof RegExp) return getProp(doc, key) && getProp(doc, key).match(value);
		else if (isArray(value)) return getProp(doc, key) && arrayMatches(getProp(doc, key), value);
		else {
			var keys = Object.keys(value);
			if (keys[0].charAt(0) == "$") {
				for (var i = 0; i < keys.length; i++) {
					var operator = Object.keys(value)[i];
					var operand = value[operator];
					if (operator == "$eq") {
						if (getProp(doc, key) == undefined || !valuesEqual(getProp(doc, key), operand)) return false;
					} else if (operator == "$gt") {
						if (getProp(doc, key) == undefined || !compareValues(getProp(doc, key), operand, '>')) return false;
					} else if (operator == "$gte") {
						if (getProp(doc, key) == undefined || !compareValues(getProp(doc, key), operand, '>=')) return false;
					} else if (operator == "$lt") {
						if (getProp(doc, key) == undefined || !compareValues(getProp(doc, key), operand, '<')) return false;
					} else if (operator == "$lte") {
						if (getProp(doc, key) == undefined || !compareValues(getProp(doc, key), operand, '<=')) return false;
					} else if (operator == "$ne") {
						if (getProp(doc, key) == undefined || !(!valuesEqual(getProp(doc, key), operand))) return false;
					} else if (operator == "$in") {
						if (getProp(doc, key) == undefined || !isIn(getProp(doc, key), operand)) return false;
					} else if (operator == "$nin") {
						if (getProp(doc, key) == undefined || isIn(getProp(doc, key), operand)) return false;
					} else if (operator == "$exists") {
						if (operand ? getProp(doc, key) == undefined : getProp(doc, key) != undefined) return false;
					} else if (operator == "$type") {
						if (typeof (getProp(doc, key)) != operand) return false;
					} else if (operator == "$mod") {
						if (operand.length != 2) throw { $err: "Can't canonicalize query: BadValue malformed mod, not enough elements", code: 17287 };
						if (getProp(doc, key) == undefined || (getProp(doc, key) % operand[0] != operand[1])) return false;
					} else if (operator == "$regex") {
						if (getProp(doc, key) == undefined || !getProp(doc, key).match(operand)) return false;
					} else if (operator == "$text") {
						if (getProp(doc, key) == undefined || !text(getProp(doc, key), operand)) return false;
					} else if (operator == "$geoWithin") {
						if (getProp(doc, key) == undefined || !geoWithin(getProp(doc, key), operand)) return false;
					} else if (operator == "$not") {
						if (opMatches(doc, key, operand)) return false;
					} else if (operator == "$all") {
						var fieldValue = getProp(doc, key);
						if (fieldValue == undefined || !isArray(fieldValue)) return false;
						for (var j = 0; j < operand.length; j++) {
							if (!isIn(operand[j], fieldValue)) return false;
						}
					} else if (operator == "$elemMatch") {
						var fieldValue = getProp(doc, key);
						if (fieldValue == undefined || !isArray(fieldValue)) return false;
						var found = false;
						for (var j = 0; j < fieldValue.length; j++) {
							var element = fieldValue[j];
							// Check if element matches the query
							if (typeof element === 'object' && !isArray(element)) {
								// For objects, use matches
								if (matches(element, operand)) {
									found = true;
									break;
								}
							} else {
								// For primitive values, check operators directly
								var matchesPrimitive = true;
								var opKeys = Object.keys(operand);
								for (var k = 0; k < opKeys.length; k++) {
									var op = opKeys[k];
									var opValue = operand[op];
									if (op == "$gte" && !(element >= opValue)) matchesPrimitive = false;
									else if (op == "$gt" && !(element > opValue)) matchesPrimitive = false;
									else if (op == "$lte" && !(element <= opValue)) matchesPrimitive = false;
									else if (op == "$lt" && !(element < opValue)) matchesPrimitive = false;
									else if (op == "$eq" && !(element == opValue)) matchesPrimitive = false;
									else if (op == "$ne" && !(element != opValue)) matchesPrimitive = false;
									else if (op == "$in" && !isIn(element, opValue)) matchesPrimitive = false;
									else if (op == "$nin" && isIn(element, opValue)) matchesPrimitive = false;
								}
								if (matchesPrimitive) {
									found = true;
									break;
								}
							}
						}
						if (!found) return false;
					} else if (operator == "$size") {
						var fieldValue = getProp(doc, key);
						if (fieldValue == undefined || !isArray(fieldValue)) return false;
						if (fieldValue.length != operand) return false;
					} else {
						throw { $err: "Can't canonicalize query: BadValue unknown operator: " + operator, code: 17287 };
					}
				}
				return true;
			} else {
				return getProp(doc, key) && objectMatches(getProp(doc, key), value);
			}
		}
	}
}

/**
 * $not operator
 */
export function not(doc, value) {
	return !tlMatches(doc, value);
}

/**
 * $and operator
 */
export function and(doc, els) {
	for (var i = 0; i < els.length; i++) {
		if (!tlMatches(doc, els[i])) {
			return false;
		}
	}
	return true;
}

/**
 * $or operator
 */
export function or(doc, els) {
	for (var i = 0; i < els.length; i++) {
		if (tlMatches(doc, els[i])) return true;
	}
	return false;
}

/**
 * $nor operator
 */
export function nor(doc, els) {
	for (var i = 0; i < els.length; i++) {
		if (tlMatches(doc, els[i])) return false;
	}
	return true;
}

/**
 * Main matches function - query structure: (top level operators ( "age" : (operators) ))
 * top, top level query, implicit $and
 */
export function matches(doc, query) {
	return and(doc, toArray(query));
}
