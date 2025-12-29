import { getProp, getFieldValues, isArray, arrayMatches, objectMatches, toArray, isIn, bboxToGeojson } from './utils.js';
import { TextIndex } from './TextIndex.js';
import { ObjectId } from 'bjson';
import { evaluateExpression } from './aggregationExpressions.js';

/**
 * BSON type mappings for $type operator
 */
const BSON_TYPES = {
	1: 'double',
	2: 'string',
	3: 'object',
	4: 'array',
	5: 'binData',
	6: 'undefined',
	7: 'objectId',
	8: 'bool',
	9: 'date',
	10: 'null',
	11: 'regex',
	13: 'javascript',
	15: 'javascriptWithScope',
	16: 'int',
	17: 'timestamp',
	18: 'long',
	19: 'decimal',
	127: 'maxKey',
	'-1': 'minKey'
};

// Reverse mapping from alias to code
const TYPE_ALIASES = Object.entries(BSON_TYPES).reduce((acc, [code, name]) => {
	acc[name] = parseInt(code);
	return acc;
}, {});

/**
 * Check if a value matches a BSON type or type code
 */
function matchesType(value, typeSpec) {
	// Handle array of types
	if (isArray(typeSpec)) {
		for (let i = 0; i < typeSpec.length; i++) {
			if (matchesType(value, typeSpec[i])) return true;
		}
		return false;
	}
	
	// Get type code from spec (can be number or string alias)
	const typeCode = typeof typeSpec === 'number' ? typeSpec : TYPE_ALIASES[typeSpec];
	const typeName = BSON_TYPES[typeCode] || typeSpec;
	
	// Check value type
	if (value === null) return typeName === 'null' || typeCode === 10;
	if (value === undefined) return typeName === 'undefined' || typeCode === 6;
	if (typeof value === 'number') {
		if (Number.isInteger(value)) return typeName === 'int' || typeCode === 16;
		return typeName === 'double' || typeCode === 1;
	}
	if (typeof value === 'string') return typeName === 'string' || typeCode === 2;
	if (typeof value === 'boolean') return typeName === 'bool' || typeCode === 8;
	if (value instanceof Date) return typeName === 'date' || typeCode === 9;
	if (value instanceof ObjectId) return typeName === 'objectId' || typeCode === 7;
	if (value instanceof RegExp) return typeName === 'regex' || typeCode === 11;
	if (isArray(value)) return typeName === 'array' || typeCode === 4;
	if (typeof value === 'object') return typeName === 'object' || typeCode === 3;
	
	// Fallback to simple type check
	return typeof value === typeSpec;
}

/**
 * Bit query operator helpers
 */
function toBitMask(positions) {
	if (isArray(positions)) {
		// Array of bit positions
		let mask = 0;
		for (let i = 0; i < positions.length; i++) {
			mask |= (1 << positions[i]);
		}
		return mask;
	} else if (typeof positions === 'number') {
		// Bitmask directly
		return positions;
	}
	return 0;
}

function matchesBitsAllSet(value, positions) {
	if (typeof value !== 'number') return false;
	const mask = toBitMask(positions);
	return (value & mask) === mask;
}

function matchesBitsAllClear(value, positions) {
	if (typeof value !== 'number') return false;
	const mask = toBitMask(positions);
	return (value & mask) === 0;
}

function matchesBitsAnySet(value, positions) {
	if (typeof value !== 'number') return false;
	const mask = toBitMask(positions);
	return (value & mask) !== 0;
}

function matchesBitsAnyClear(value, positions) {
	if (typeof value !== 'number') return false;
	const mask = toBitMask(positions);
	return (value & mask) !== mask;
}

/**
 * JSON Schema validator (simplified)
 */
function validateJsonSchema(doc, schema) {
	// Basic JSON Schema validation
	if (schema.type) {
		const docType = isArray(doc) ? 'array' : (doc === null ? 'null' : typeof doc);
		if (schema.type !== docType) return false;
	}
	
	if (schema.required && isArray(schema.required)) {
		for (let i = 0; i < schema.required.length; i++) {
			if (!(schema.required[i] in doc)) return false;
		}
	}
	
	if (schema.properties) {
		for (const key in schema.properties) {
			// When using $jsonSchema as a query operator, properties must exist to match
			// (This is different from standard JSON Schema validation where properties are optional)
			if (!(key in doc)) return false;
			
			const propSchema = schema.properties[key];
			if (!validateJsonSchema(doc[key], propSchema)) return false;
		}
	}
	
	if (schema.minimum !== undefined && typeof doc === 'number') {
		if (doc < schema.minimum) return false;
	}
	
	if (schema.maximum !== undefined && typeof doc === 'number') {
		if (doc > schema.maximum) return false;
	}
	
	if (schema.minLength !== undefined && typeof doc === 'string') {
		if (doc.length < schema.minLength) return false;
	}
	
	if (schema.maxLength !== undefined && typeof doc === 'string') {
		if (doc.length > schema.maxLength) return false;
	}
	
	if (schema.pattern && typeof doc === 'string') {
		const regex = new RegExp(schema.pattern);
		if (!regex.test(doc)) return false;
	}
	
	if (schema.enum && isArray(schema.enum)) {
		if (!schema.enum.includes(doc)) return false;
	}
	
	return true;
}

/**
 * Compare two values for equality, handling ObjectId instances
 */
function valuesEqual(a, b) {
	// Handle ObjectId comparison
	if (a instanceof ObjectId && b instanceof ObjectId) {
    return a.equals(b);
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
 * Check if a field value (possibly from array traversal) matches a condition
 * Handles both single values and arrays of values (from array traversal)
 */
function fieldValueMatches(fieldValue, checkFn) {
	// Use strict equality to allow null values through
	if (fieldValue === undefined) return false;
	
	// Check for null before isArray to avoid crash
	if (fieldValue === null) return checkFn(fieldValue);
	
	// If fieldValue is an array (from array traversal), check if ANY element matches
	if (isArray(fieldValue)) {
		for (var i = 0; i < fieldValue.length; i++) {
			if (checkFn(fieldValue[i])) return true;
		}
		return false;
	}
	
	// Otherwise check the single value
	return checkFn(fieldValue);
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
		else if (key == "$comment") return true; // $comment is metadata, doesn't filter
		else if (key == "$jsonSchema") return validateJsonSchema(doc, value); // Top-level schema validation
		else if (key == "$expr") {
			// Handle $expr at top level
			try {
				return evaluateExpression(value, doc);
			} catch (e) {
				return false;
			}
		}
		else throw { $err: "Can't canonicalize query: BadValue unknown top level operator: " + key, code: 17287 };
	} else {
		return opMatches(doc, key, value);
	}
}

/**
 * Operator match function
 */
export function opMatches(doc, key, value) {
	// Get field value using array-aware traversal
	var fieldValue = getFieldValues(doc, key);
	
	if (typeof (value) == "string") return fieldValueMatches(fieldValue, function(v) { return valuesEqual(v, value); });
	else if (typeof (value) == "number") return fieldValueMatches(fieldValue, function(v) { return valuesEqual(v, value); });
	else if (typeof (value) == "boolean") return fieldValueMatches(fieldValue, function(v) { return valuesEqual(v, value); });
	else if (value instanceof ObjectId) return fieldValueMatches(fieldValue, function(v) { return valuesEqual(v, value); });
	else if (typeof (value) == "object") {
		if (value instanceof RegExp) return fieldValue != undefined && fieldValueMatches(fieldValue, function(v) { return v && v.match(value); });
		else if (isArray(value)) return fieldValue != undefined && fieldValueMatches(fieldValue, function(v) { return v && arrayMatches(v, value); });
		else {
			var keys = Object.keys(value);
			if (keys[0].charAt(0) == "$") {
				for (var i = 0; i < keys.length; i++) {
					var operator = Object.keys(value)[i];
					var operand = value[operator];
					if (operator == "$eq") {
						if (!fieldValueMatches(fieldValue, function(v) { return valuesEqual(v, operand); })) return false;
					} else if (operator == "$gt") {
						if (!fieldValueMatches(fieldValue, function(v) { return compareValues(v, operand, '>'); })) return false;
					} else if (operator == "$gte") {
						if (!fieldValueMatches(fieldValue, function(v) { return compareValues(v, operand, '>='); })) return false;
					} else if (operator == "$lt") {
						if (!fieldValueMatches(fieldValue, function(v) { return compareValues(v, operand, '<'); })) return false;
					} else if (operator == "$lte") {
						if (!fieldValueMatches(fieldValue, function(v) { return compareValues(v, operand, '<='); })) return false;
					} else if (operator == "$ne") {
						if (!fieldValueMatches(fieldValue, function(v) { return !valuesEqual(v, operand); })) return false;
					} else if (operator == "$in") {
						if (!fieldValueMatches(fieldValue, function(v) { return isIn(v, operand); })) return false;
					} else if (operator == "$nin") {
						if (fieldValueMatches(fieldValue, function(v) { return isIn(v, operand); })) return false;
					} else if (operator == "$exists") {
						// For $exists, we need to use getProp which returns undefined if field doesn't exist
						// getFieldValues might return an array which would be truthy
					var rawValue = getProp(doc, key);
					if (operand ? rawValue == undefined : rawValue != undefined) return false;
				} else if (operator == "$type") {
					// Support both BSON type codes and aliases
					// Note: $type checks the field value itself, not array elements
					// If field doesn't exist (undefined), it can only match type 'undefined' (6)
					if (fieldValue === undefined) {
						const expectedTypeCode = typeof operand === 'number' ? operand : TYPE_ALIASES[operand];
						if (expectedTypeCode !== 6) return false;
					} else {
						if (!matchesType(fieldValue, operand)) return false;
					}
				} else if (operator == "$mod") {
					if (operand.length != 2) throw { $err: "Can't canonicalize query: BadValue malformed mod, not enough elements", code: 17287 };
					if (!fieldValueMatches(fieldValue, function(v) { return v != undefined && (v % operand[0] == operand[1]); })) return false;
				} else if (operator == "$regex") {
					// Support string pattern with optional $options
					var pattern = operand;
					var flags = value.$options || '';
					var regex = (typeof pattern === 'string') ? new RegExp(pattern, flags) : pattern;
					if (!fieldValueMatches(fieldValue, function(v) { return v != undefined && regex.test(v); })) return false;
				} else if (operator == "$options") {
					// $options is handled with $regex, skip here
					continue;
				} else if (operator == "$text") {
					if (!fieldValueMatches(fieldValue, function(v) { return v != undefined && text(v, operand); })) return false;
				} else if (operator == "$expr") {
					// Evaluate aggregation expression against the document
					try {
						const result = evaluateExpression(operand, doc);
						if (!result) return false;
					} catch (e) {
						// If expression evaluation fails, don't match
						return false;
					}
				} else if (operator == "$geoWithin") {
						if (!fieldValueMatches(fieldValue, function(v) { return v != undefined && geoWithin(v, operand); })) return false;
					} else if (operator == "$near" || operator == "$nearSphere" || operator == "$geoIntersects") {
						// These operators MUST be handled by an index
						// They should never reach the matcher level
						// If they do, the query planner should have already filtered documents via the index
						// So we just skip validation here - the index already did the work
						// Don't return false, as that would exclude documents that the index already selected
					} else if (operator == "$not") {
						if (opMatches(doc, key, operand)) return false;
					} else if (operator == "$all") {
						// $all requires the field to be an array, use getProp not getFieldValues
						var arrayFieldValue = getProp(doc, key);
						if (arrayFieldValue == undefined || !isArray(arrayFieldValue)) return false;
						for (var j = 0; j < operand.length; j++) {
							if (!isIn(operand[j], arrayFieldValue)) return false;
						}
					} else if (operator == "$elemMatch") {
						// $elemMatch requires the field to be an array, use getProp not getFieldValues
						var arrayFieldValue = getProp(doc, key);
						if (arrayFieldValue == undefined || !isArray(arrayFieldValue)) return false;
						var found = false;
						for (var j = 0; j < arrayFieldValue.length; j++) {
							var element = arrayFieldValue[j];
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
					var sizeFieldValue = getProp(doc, key);
					if (sizeFieldValue == undefined || !isArray(sizeFieldValue)) return false;
					if (sizeFieldValue.length != operand) return false;
				} else if (operator == "$bitsAllSet") {
					if (!fieldValueMatches(fieldValue, function(v) { return matchesBitsAllSet(v, operand); })) return false;
				} else if (operator == "$bitsAllClear") {
					if (!fieldValueMatches(fieldValue, function(v) { return matchesBitsAllClear(v, operand); })) return false;
				} else if (operator == "$bitsAnySet") {
					if (!fieldValueMatches(fieldValue, function(v) { return matchesBitsAnySet(v, operand); })) return false;
				} else if (operator == "$bitsAnyClear") {
					if (!fieldValueMatches(fieldValue, function(v) { return matchesBitsAnyClear(v, operand); })) return false;
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

/**
 * Enhanced matching function that also tracks which array index matched for positional operator ($)
 * Returns an object with:
 *   - matched: boolean indicating if the query matched
 *   - arrayFilters: object mapping field paths to the first matched array index
 * 
 * Example: if query is { "grades": { $gte: 85 } } and doc is { grades: [80, 90, 85] }
 * Returns: { matched: true, arrayFilters: { "grades": 1 } } (index 1 is 90, first to match)
 */
export function matchWithArrayIndices(doc, query) {
	const arrayFilters = {};
	const matched = andWithTracking(doc, toArray(query), arrayFilters);
	return { matched, arrayFilters };
}

/**
 * Helper to track array indices during AND matching
 */
function andWithTracking(doc, els, arrayFilters) {
	for (var i = 0; i < els.length; i++) {
		if (!tlMatchesWithTracking(doc, els[i], arrayFilters)) {
			return false;
		}
	}
	return true;
}

/**
 * Top level match with tracking
 */
function tlMatchesWithTracking(doc, query, arrayFilters) {
	var key = Object.keys(query)[0];
	var value = query[key];
	if (key.charAt(0) == "$") {
		if (key == "$and") return andWithTracking(doc, value, arrayFilters);
		else if (key == "$or") return orWithTracking(doc, value, arrayFilters);
		else if (key == "$not") {
			// For $not, we don't track positions as it's a negation
			return !tlMatches(doc, value);
		}
		else if (key == "$nor") return norWithTracking(doc, value, arrayFilters);
		else if (key == "$where") return where(doc, value);
		else if (key == "$comment") return true;
		else if (key == "$jsonSchema") return validateJsonSchema(doc, value);
		else if (key == "$expr") {
			try {
				return evaluateExpression(value, doc);
			} catch (e) {
				return false;
			}
		}
		else throw { $err: "Can't canonicalize query: BadValue unknown top level operator: " + key, code: 17287 };
	} else {
		return opMatchesWithTracking(doc, key, value, arrayFilters);
	}
}

/**
 * OR operator with tracking - track positions from the first matching clause
 */
function orWithTracking(doc, els, arrayFilters) {
	for (var i = 0; i < els.length; i++) {
		if (tlMatchesWithTracking(doc, els[i], arrayFilters)) {
			return true;
		}
	}
	return false;
}

/**
 * NOR operator with tracking
 */
function norWithTracking(doc, els, arrayFilters) {
	for (var i = 0; i < els.length; i++) {
		if (tlMatchesWithTracking(doc, els[i], arrayFilters)) {
			return false;
		}
	}
	return true;
}

/**
 * Operator match with array index tracking
 */
function opMatchesWithTracking(doc, key, value, arrayFilters) {
	// Get the base field (before any dots)
	const baseField = key.split('.')[0];
	const fieldValue = getFieldValues(doc, key);
	
	// Helper to track which index matched
	const trackMatchingIndex = (fieldValue, checkFn) => {
		if (fieldValue === undefined) return false;
		if (fieldValue === null) return checkFn(fieldValue);
		
		// If fieldValue is an array from array traversal
		if (isArray(fieldValue)) {
			// Check if the base field itself is an array in the document
			const baseValue = getProp(doc, baseField);
			if (isArray(baseValue)) {
				// Find first matching index
				for (var i = 0; i < fieldValue.length; i++) {
					if (checkFn(fieldValue[i])) {
						// Track this as the matched index for this field
						arrayFilters[key] = i;
						return true;
					}
				}
				return false;
			}
		}
		
		// Otherwise use regular matching
		return fieldValueMatches(fieldValue, checkFn);
	};
	
	// Now perform the actual matching with tracking
	if (typeof (value) == "string") return trackMatchingIndex(fieldValue, function(v) { return valuesEqual(v, value); });
	else if (typeof (value) == "number") return trackMatchingIndex(fieldValue, function(v) { return valuesEqual(v, value); });
	else if (typeof (value) == "boolean") return trackMatchingIndex(fieldValue, function(v) { return valuesEqual(v, value); });
	else if (value instanceof ObjectId) return trackMatchingIndex(fieldValue, function(v) { return valuesEqual(v, value); });
	else if (typeof (value) == "object") {
		if (value instanceof RegExp) return fieldValue != undefined && trackMatchingIndex(fieldValue, function(v) { return v && v.match(value); });
		else if (isArray(value)) return fieldValue != undefined && trackMatchingIndex(fieldValue, function(v) { return v && arrayMatches(v, value); });
		else {
			var keys = Object.keys(value);
			if (keys[0].charAt(0) == "$") {
				// Handle operators
				for (var i = 0; i < keys.length; i++) {
					var operator = keys[i];
					var operand = value[operator];
					if (operator == "$eq") {
						if (!trackMatchingIndex(fieldValue, function(v) { return valuesEqual(v, operand); })) return false;
					} else if (operator == "$gt") {
						if (!trackMatchingIndex(fieldValue, function(v) { return compareValues(v, operand, '>'); })) return false;
					} else if (operator == "$gte") {
						if (!trackMatchingIndex(fieldValue, function(v) { return compareValues(v, operand, '>='); })) return false;
					} else if (operator == "$lt") {
						if (!trackMatchingIndex(fieldValue, function(v) { return compareValues(v, operand, '<'); })) return false;
					} else if (operator == "$lte") {
						if (!trackMatchingIndex(fieldValue, function(v) { return compareValues(v, operand, '<='); })) return false;
					} else if (operator == "$ne") {
						if (!trackMatchingIndex(fieldValue, function(v) { return !valuesEqual(v, operand); })) return false;
					} else if (operator == "$in") {
						if (!trackMatchingIndex(fieldValue, function(v) { return isIn(v, operand); })) return false;
					} else if (operator == "$nin") {
						if (trackMatchingIndex(fieldValue, function(v) { return isIn(v, operand); })) return false;
					} else if (operator == "$elemMatch") {
						// Special handling for $elemMatch
						var arrayFieldValue = getProp(doc, key);
						if (arrayFieldValue == undefined || !isArray(arrayFieldValue)) return false;
						for (var j = 0; j < arrayFieldValue.length; j++) {
							var element = arrayFieldValue[j];
							// Check if element matches the query
							if (typeof element === 'object' && !isArray(element)) {
								// For objects, use matches
								if (matches(element, operand)) {
									arrayFilters[key] = j;
									return true;
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
									else if (op == "$eq" && element != opValue) matchesPrimitive = false;
									else if (op == "$ne" && element == opValue) matchesPrimitive = false;
								}
								if (matchesPrimitive) {
									arrayFilters[key] = j;
									return true;
								}
							}
						}
						return false;
					} else {
						// For other operators, use standard matching
						if (!opMatches(doc, key, value)) return false;
					}
				}
				return true;
			} else {
				// Object equality
				return fieldValue != undefined && trackMatchingIndex(fieldValue, function(v) { return objectMatches(v, value); });
			}
		}
	}
	return false;
}
