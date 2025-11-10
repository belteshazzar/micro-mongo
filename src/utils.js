/**
 * Utility functions for MicroMongoDB
 */

/**
 * Deep copy an object or array
 */
export function copy(o) {
	var out, v, key;
	out = Array.isArray(o) ? [] : {};
	for (key in o) {
		v = o[key];
		out[key] = (typeof v === "object") ? copy(v) : v;
	}
	return out;
}

/**
 * Get a property from an object using dot notation
 */
export function getProp(obj, name) {
	var path = name.split(".");
	var result = obj[path[0]];
	for (var i = 1; i < path.length; i++) {
		if (result == undefined || result == null) return result;
		result = result[path[i]];
	}
	return result;
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
	for (var i = 0; i < values.length; i++) if (values[i] == val) return true;
	return false;
}

/**
 * Check if two arrays match
 */
export function arrayMatches(x, y) {
	if (x.length != y.length) return false;
	for (var i = 0; i < x.length; i++) {
		if (x[i] === y[i]) continue;
		if (typeof (x[i]) != typeof (y[i])) return false;
		if (typeof (x[i] == "object")) {
			if (isArray(x[i])) {
				if (!arrayMatches(x, y)) return false;
			} else {
				if (!objectMatches(x[i], y[i])) return false;
			}
		} else {
			if (x[i] != y[i]) return false;
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
		if (x[p] === y[p]) continue;
		if (typeof (x[p]) != typeof (y[p])) return false;
		if (typeof (x[i]) == "object") {
			if (isArray(x[i])) {
				if (!arrayMatches(x[i], y[i])) return false;
			} else {
				if (!objectMatches(x[i], y[i])) return false;
			}
		} else {
			if (x[i] != y[i]) return false;
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
		// inclusion with _id (unless explicitly excluded)
		if (projection._id !== 0) {
			result._id = doc._id;
		}
		for (var i = 0; i < keys.length; i++) {
			if (keys[i] === '_id') continue;
			if (!projection[keys[i]]) continue;
			result[keys[i]] = doc[keys[i]];
		}
	} else {
		// exclusion
		for (var key in doc) {
			result[key] = doc[key];
		}
		for (var i = 0; i < keys.length; i++) {
			if (projection[keys[i]]) continue;
			delete result[keys[i]];
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
