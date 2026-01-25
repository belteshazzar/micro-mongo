/**
 * Utility functions for MicroMongoDB
 */

import { ObjectId } from '@belteshazzar/binjson';

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
 * Deep copy an object or array
 */
export function copy(o) {
	// Handle primitives that shouldn't be deep-copied
	if (typeof o !== 'object' || o === null) {
		return o;
	}
	
	// Handle ObjectId
	if (o instanceof ObjectId) {
		return new ObjectId(o.id);
	}
	
	// Handle Date
	if (o instanceof Date) {
		return new Date(o.getTime());
	}
	
	var out, v, key;
	out = Array.isArray(o) ? [] : {};
	for (key in o) {
		v = o[key];
		out[key] = (typeof v === "object" && v !== null) ? copy(v) : v;
	}
	return out;
}

/**
 * Get a property from an object using dot notation
 * Supports array element access via numeric indices (e.g., "items.0.name")
 */
export function getProp(obj, name) {
	var path = name.split(".");
	var result = obj[path[0]];
	for (var i = 1; i < path.length; i++) {
		if (result == undefined || result == null) return result;
		
		// Check if this path segment is a numeric index
		var pathSegment = path[i];
		var numericIndex = parseInt(pathSegment, 10);
		
		// If it's a valid array index, use it
		if (isArray(result) && !isNaN(numericIndex) && numericIndex >= 0 && numericIndex < result.length) {
			result = result[numericIndex];
		} else {
			result = result[pathSegment];
		}
	}
	return result;
}

/**
 * Get field values for query matching, handling MongoDB-style array traversal
 * When a path traverses an array, this returns all matching values from array elements
 * Returns an array of values if array traversal occurred, otherwise the single value
 * 
 * Example:
 *   doc = { items: [{ price: 10 }, { price: 20 }] }
 *   getFieldValues(doc, 'items.price') -> [10, 20]
 */
export function getFieldValues(obj, name) {
	var path = name.split(".");
	var results = [obj];
	
	for (var i = 0; i < path.length; i++) {
		var pathSegment = path[i];
		var numericIndex = parseInt(pathSegment, 10);
		var newResults = [];
		
		for (var j = 0; j < results.length; j++) {
			var current = results[j];
			if (current == undefined || current == null) continue;
			
			// If this is a numeric index and current is an array, access that element
			if (isArray(current) && !isNaN(numericIndex) && numericIndex >= 0) {
				if (numericIndex < current.length) {
					newResults.push(current[numericIndex]);
				}
			}
			// If current is an array but path segment is not numeric, traverse all elements
			else if (isArray(current)) {
				for (var k = 0; k < current.length; k++) {
					if (current[k] != undefined && current[k] != null && typeof current[k] === 'object') {
						newResults.push(current[k][pathSegment]);
					}
				}
			}
			// Otherwise, normal property access
			else if (typeof current === 'object') {
				newResults.push(current[pathSegment]);
			}
		}
		
		results = newResults;
	}
	
	// Filter out undefined values
	results = results.filter(function(v) { return v !== undefined; });
	
	// If we have multiple values, return the array
	// If we have exactly one, return it directly
	// If we have none, return undefined
	if (results.length === 0) return undefined;
	if (results.length === 1) return results[0];
	return results;
}

/**
 * Set a property on an object using dot notation
 * Creates intermediate objects as needed
 * Supports array element access via numeric indices
 * Supports $[] operator to update all array elements
 */
export function setProp(obj, name, value) {
	// Check if path contains $[] operator
	if (name.indexOf('$[]') !== -1) {
		return setPropWithAllPositional(obj, name, value);
	}
	
	var path = name.split(".");
	var current = obj;
	
	for (var i = 0; i < path.length - 1; i++) {
		var pathSegment = path[i];
		var numericIndex = parseInt(pathSegment, 10);
		
		// If this is a numeric index and current is an array
		if (isArray(current) && !isNaN(numericIndex) && numericIndex >= 0) {
			// Ensure the array is large enough
			while (current.length <= numericIndex) {
				current.push(undefined);
			}
			// If the element doesn't exist, create an object
			if (current[numericIndex] == undefined || current[numericIndex] == null) {
				// Look ahead to see if next segment is numeric (array) or not (object)
				var nextSegment = path[i + 1];
				var nextNumeric = parseInt(nextSegment, 10);
				if (!isNaN(nextNumeric) && nextNumeric >= 0) {
					current[numericIndex] = [];
				} else {
					current[numericIndex] = {};
				}
			}
			current = current[numericIndex];
		}
		// Regular property access
		else {
			if (current[pathSegment] == undefined || current[pathSegment] == null) {
				// Look ahead to see if next segment is numeric (array) or not (object)
				var nextSegment = path[i + 1];
				var nextNumeric = parseInt(nextSegment, 10);
				if (!isNaN(nextNumeric) && nextNumeric >= 0) {
					current[pathSegment] = [];
				} else {
					current[pathSegment] = {};
				}
			}
			current = current[pathSegment];
		}
	}
	
	// Set the final value
	var lastSegment = path[path.length - 1];
	var lastNumericIndex = parseInt(lastSegment, 10);
	
	if (isArray(current) && !isNaN(lastNumericIndex) && lastNumericIndex >= 0) {
		while (current.length <= lastNumericIndex) {
			current.push(undefined);
		}
		current[lastNumericIndex] = value;
	} else {
		current[lastSegment] = value;
	}
}

/**
 * Set a property using the $[] all positional operator
 * Updates all elements in an array
 */
function setPropWithAllPositional(obj, name, value) {
	var path = name.split(".");
	var current = obj;
	
	// Navigate to the $[] operator
	for (var i = 0; i < path.length; i++) {
		var pathSegment = path[i];
		
		if (pathSegment === '$[]') {
			// Current should be an array - update all elements
			if (!Array.isArray(current)) {
				throw new Error("The positional operator did not find the match needed from the query.");
			}
			
			// Build the remaining path after $[]
			var remainingPath = path.slice(i + 1).join('.');
			
			// Update all array elements
			for (var j = 0; j < current.length; j++) {
				if (remainingPath) {
					// There's more path after $[], recursively set on each element
					setProp(current[j], remainingPath, value);
				} else {
					// $[] is the last segment, replace each element with value
					current[j] = value;
				}
			}
			return;
		}
		
		// Navigate to the next level
		var numericIndex = parseInt(pathSegment, 10);
		
		if (isArray(current) && !isNaN(numericIndex) && numericIndex >= 0) {
			current = current[numericIndex];
		} else {
			if (current[pathSegment] == undefined || current[pathSegment] == null) {
				// Create intermediate object or array
				var nextSegment = i + 1 < path.length ? path[i + 1] : null;
				if (nextSegment === '$[]') {
					current[pathSegment] = [];
				} else {
					var nextNumeric = parseInt(nextSegment, 10);
					if (!isNaN(nextNumeric) && nextNumeric >= 0) {
						current[pathSegment] = [];
					} else {
						current[pathSegment] = {};
					}
				}
			}
			current = current[pathSegment];
		}
	}
}

/**
 * Check if value is an array
 */
export function isArray(o) {
	return Array == o.constructor;
}

/**
 * Convert object to array of key-value pairs
 */
export function toArray(obj) {
	var arr = [];
	for (var key in obj) {
		if (obj.hasOwnProperty(key)) {
			var el = {};
			el[key] = obj[key];
			arr.push(el);
		}
	}
	return arr;
}

/**
 * Check if a value is in an array
 */
export function isIn(val, values) {
	for (var i = 0; i < values.length; i++) {
		if (valuesEqual(values[i], val)) return true;
	}
	return false;
}

/**
 * Check if two arrays match
 */
export function arrayMatches(x, y) {
	if (x.length != y.length) return false;
	for (var i = 0; i < x.length; i++) {
		if (valuesEqual(x[i], y[i])) continue;
		if (typeof (x[i]) != typeof (y[i])) return false;
		if (typeof (x[i]) == "object" && x[i] !== null) {
			if (isArray(x[i])) {
				if (!arrayMatches(x[i], y[i])) return false;
			} else {
				if (!objectMatches(x[i], y[i])) return false;
			}
		} else {
			if (!valuesEqual(x[i], y[i])) return false;
		}
	}
	return true;
}

/**
 * Check if two objects match
 */
export function objectMatches(x, y) {
	for (var p in x) {
		if (!x.hasOwnProperty(p)) continue;
		if (!y.hasOwnProperty(p)) return false;
		if (valuesEqual(x[p], y[p])) continue;
		if (typeof (x[p]) != typeof (y[p])) return false;
		if (typeof (x[p]) == "object" && x[p] !== null) {
			if (isArray(x[p])) {
				if (!arrayMatches(x[p], y[p])) return false;
			} else {
				if (!objectMatches(x[p], y[p])) return false;
			}
		} else {
			if (!valuesEqual(x[p], y[p])) return false;
		}
	}
	for (var p in y) {
		if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) return false;
	}
	return true;
}

/**
 * Apply projection to a document
 */
export function applyProjection(projection, doc) {
	var result = {};
	var keys = Object.keys(projection);
	if (keys.length == 0) return doc;
	
	// Check for mixed inclusion/exclusion (except _id which can be excluded in inclusion projection)
	var hasInclusion = false;
	var hasExclusion = false;
	for (var i = 0; i < keys.length; i++) {
		if (keys[i] === '_id') continue; // _id is special
		if (projection[keys[i]]) hasInclusion = true;
		else hasExclusion = true;
	}
	
	if (hasInclusion && hasExclusion) {
		throw { $err: "Can't canonicalize query: BadValue Projection cannot have a mix of inclusion and exclusion.", code: 17287 };
	}
	
	if (projection[keys[0]] || hasInclusion) {
		// Inclusion projection
		// Include _id unless explicitly excluded
		if (projection._id !== 0 && projection._id !== false) {
			result._id = copy(doc._id);
		}
		
		for (var i = 0; i < keys.length; i++) {
			if (keys[i] === '_id') continue;
			if (!projection[keys[i]]) continue;
			
			var fieldPath = keys[i];
			var value = getProp(doc, fieldPath);
			
			if (value !== undefined) {
				// Use setProp to create nested structure
				setProp(result, fieldPath, copy(value));
			}
		}
	} else {
		// Exclusion projection - start with a copy of the document
		for (var key in doc) {
			if (doc.hasOwnProperty(key)) {
				// Deep copy the value
				var val = doc[key];
				if (typeof val === 'object' && val !== null && !isArray(val)) {
					result[key] = copy(val);
				} else if (isArray(val)) {
					result[key] = val.slice(); // shallow copy array
				} else {
					result[key] = val;
				}
			}
		}
		
		// Remove excluded fields
		for (var i = 0; i < keys.length; i++) {
			if (projection[keys[i]]) continue; // Skip if value is truthy
			
			var fieldPath = keys[i];
			var pathParts = fieldPath.split('.');
			
			// Navigate to the parent object and delete the final property
			if (pathParts.length === 1) {
				delete result[fieldPath];
			} else {
				var parent = result;
				for (var j = 0; j < pathParts.length - 1; j++) {
					if (parent == undefined || parent == null) break;
					parent = parent[pathParts[j]];
				}
				if (parent != undefined && parent != null) {
					delete parent[pathParts[pathParts.length - 1]];
				}
			}
		}
	}
	return result;
}

/**
 * Convert bbox to GeoJSON
 */
export function bboxToGeojson(bbox) {
	const minLon = bbox[0][0];
	const maxLat = bbox[0][1];
	const maxLon = bbox[1][0];
	const minLat = bbox[1][1];
	return {
		type: 'FeatureCollection',
		features: [{
			type: 'Feature',
			properties: {},
			geometry: {
				type: 'Polygon',
				coordinates: [[
					[minLon, maxLat],
					[minLon, minLat],
					[maxLon, minLat],
					[maxLon, maxLat],
					[minLon, maxLat]
				]]
			}
		}]
	};
}
