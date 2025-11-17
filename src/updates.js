/**
 * Update operations module
 */

import { setProp, getProp, isArray } from './utils.js';
import { matches } from './queryMatcher.js';

/**
 * Extract identifier from a filtered positional operator pattern like $[identifier]
 * Returns null if not a filtered positional operator
 */
function extractFilteredPositionalIdentifier(pathSegment) {
	const match = pathSegment.match(/^\$\[([^\]]+)\]$/);
	return match ? match[1] : null;
}

/**
 * Parse a field path and extract filtered positional identifiers
 * Returns an array of path segments with metadata about which are filtered positional operators
 */
function parseFieldPath(fieldPath) {
	const segments = fieldPath.split('.');
	return segments.map(segment => {
		const identifier = extractFilteredPositionalIdentifier(segment);
		return {
			segment: segment,
			isFilteredPositional: identifier !== null,
			identifier: identifier
		};
	});
}

/**
 * Apply an update operation to array elements matching arrayFilters
 */
function applyToFilteredArrayElements(doc, parsedPath, value, operation, arrayFilters) {
	// Navigate through the path and apply updates to matching array elements
	function traverse(current, pathIndex, filterContext) {
		if (pathIndex >= parsedPath.length) {
			return;
		}

		const pathInfo = parsedPath[pathIndex];
		const isLastSegment = pathIndex === parsedPath.length - 1;

		if (pathInfo.isFilteredPositional) {
			// This is a filtered positional operator like $[elem]
			const identifier = pathInfo.identifier;
			const filter = arrayFilters ? arrayFilters.find(f => {
				// Find the filter that uses this identifier
				const filterKeys = Object.keys(f);
				return filterKeys.some(key => key.startsWith(identifier + '.') || key === identifier);
			}) : null;

			// If arrayFilters is not provided, treat $[identifier] as a literal field name
			if (!arrayFilters) {
				if (!current[pathInfo.segment]) {
					// Create intermediate object/array as needed
					const nextPath = parsedPath[pathIndex + 1];
					if (nextPath && nextPath.isFilteredPositional) {
						current[pathInfo.segment] = [];
					} else {
						current[pathInfo.segment] = {};
					}
				}
				if (isLastSegment) {
					applyOperationToValue(current, pathInfo.segment, value, operation);
				} else {
					traverse(current[pathInfo.segment], pathIndex + 1, filterContext);
				}
				return;
			}

			if (!isArray(current)) {
				// If current is not an array, create it as an object property
				if (!current[pathInfo.segment]) {
					current[pathInfo.segment] = {};
				}
				if (isLastSegment) {
					applyOperationToValue(current, pathInfo.segment, value, operation);
				} else {
					traverse(current[pathInfo.segment], pathIndex + 1, filterContext);
				}
				return;
			}

			// Iterate through array elements and apply to matching ones
			for (let i = 0; i < current.length; i++) {
				const element = current[i];
				
				// Check if this element matches the filter
				let shouldUpdate = true;
				if (filter) {
					// Transform filter to check against the element
					// If filter has identifier.field, check element.field
					// If filter has just identifier, check element directly
					let transformedFilter = {};
					let hasDirectMatch = false;
					
					Object.keys(filter).forEach(key => {
						if (key.startsWith(identifier + '.')) {
							// Replace "identifier.field" with just "field" for matching against element
							const fieldPath = key.substring(identifier.length + 1);
							transformedFilter[fieldPath] = filter[key];
						} else if (key === identifier) {
							// Direct identifier match - the filter condition applies to the element value itself
							transformedFilter = filter[key];
							hasDirectMatch = true;
						}
					});
					
					// Check if element matches the filter
					if (hasDirectMatch) {
						// For primitive values, we need to check against the condition directly
						// Create a wrapper to use the matches function
						const testDoc = { value: element };
						const testFilter = { value: transformedFilter };
						shouldUpdate = matches(testDoc, testFilter);
					} else {
						// For object properties, match against the element as a document
						shouldUpdate = matches(element, transformedFilter);
					}
				}

				if (shouldUpdate) {
					if (isLastSegment) {
						// Apply the operation to this array element
						applyOperationToValue(current, i, value, operation);
					} else {
						// Continue traversing deeper
						if (element !== null && element !== undefined) {
							traverse(current[i], pathIndex + 1, filterContext);
						}
					}
				}
			}
		} else {
			// Regular path segment
			if (current[pathInfo.segment] === undefined || current[pathInfo.segment] === null) {
				if (!isLastSegment) {
					// Create intermediate object/array
					const nextPath = parsedPath[pathIndex + 1];
					if (nextPath && nextPath.isFilteredPositional) {
						current[pathInfo.segment] = [];
					} else {
						current[pathInfo.segment] = {};
					}
				}
			}

			if (isLastSegment) {
				applyOperationToValue(current, pathInfo.segment, value, operation);
			} else {
				if (current[pathInfo.segment] !== undefined && current[pathInfo.segment] !== null) {
					traverse(current[pathInfo.segment], pathIndex + 1, filterContext);
				}
			}
		}
	}

	traverse(doc, 0, {});
}

/**
 * Apply a specific operation to a value (for use with filtered positional operators)
 */
function applyOperationToValue(container, key, value, operation) {
	switch (operation) {
		case '$set':
			container[key] = value;
			break;
		case '$inc':
			if (container[key] === undefined) container[key] = 0;
			container[key] += value;
			break;
		case '$mul':
			container[key] = container[key] * value;
			break;
		case '$min':
			container[key] = Math.min(container[key], value);
			break;
		case '$max':
			container[key] = Math.max(container[key], value);
			break;
		case '$unset':
			delete container[key];
			break;
		default:
			container[key] = value;
	}
}

/**
 * Check if a field path contains a filtered positional operator
 */
function hasFilteredPositionalOperator(fieldPath) {
	return /\$\[[^\]]+\]/.test(fieldPath);
}

/**
 * Apply update operators to a document
 */
export function applyUpdates(updates, doc, setOnInsert, arrayFilters) {
	var keys = Object.keys(updates);
	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		var value = updates[key];
		if (key == "$inc") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = fields[j];
				var amount = value[field];
				
				// Check if this field uses filtered positional operator
				if (hasFilteredPositionalOperator(field)) {
					const parsedPath = parseFieldPath(field);
					applyToFilteredArrayElements(doc, parsedPath, amount, '$inc', arrayFilters);
				} else {
					var currentValue = getProp(doc, field);
					if (currentValue == undefined) currentValue = 0;
					setProp(doc, field, currentValue + amount);
				}
			}
		} else if (key == "$mul") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = fields[j];
				var amount = value[field];
				
				// Check if this field uses filtered positional operator
				if (hasFilteredPositionalOperator(field)) {
					const parsedPath = parseFieldPath(field);
					applyToFilteredArrayElements(doc, parsedPath, amount, '$mul', arrayFilters);
				} else {
					doc[field] = doc[field] * amount;
				}
			}
		} else if (key == "$rename") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = fields[j];
				var newName = value[field];
				doc[newName] = doc[field];
				delete doc[field];
			}
		} else if (key == "$setOnInsert" && setOnInsert) {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				doc[fields[j]] = value[fields[j]];
			}
		} else if (key == "$set") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = fields[j];
				
				// Check if this field uses filtered positional operator
				if (hasFilteredPositionalOperator(field)) {
					const parsedPath = parseFieldPath(field);
					applyToFilteredArrayElements(doc, parsedPath, value[field], '$set', arrayFilters);
				} else {
					setProp(doc, field, value[field]);
				}
			}
		} else if (key == "$unset") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				delete doc[fields[j]];
			}
		} else if (key == "$min") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = fields[j];
				var amount = value[field];
				
				// Check if this field uses filtered positional operator
				if (hasFilteredPositionalOperator(field)) {
					const parsedPath = parseFieldPath(field);
					applyToFilteredArrayElements(doc, parsedPath, amount, '$min', arrayFilters);
				} else {
					doc[field] = Math.min(doc[field], amount);
				}
			}
		} else if (key == "$max") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = fields[j];
				var amount = value[field];
				
				// Check if this field uses filtered positional operator
				if (hasFilteredPositionalOperator(field)) {
					const parsedPath = parseFieldPath(field);
					applyToFilteredArrayElements(doc, parsedPath, amount, '$max', arrayFilters);
				} else {
					doc[field] = Math.max(doc[field], amount);
				}
			}
		} else if (key == "$currentDate") {  // TODO not the same as mongo
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				doc[fields[j]] = new Date();
			}
		} else if (key == "$addToSet") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = fields[j];
				var value = value[field];
				doc[field].push(value);
			}
		} else if (key == "$pop") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = fields[j];
				var value = value[field];
				if (value == 1) {
					doc[field].pop();
				} else if (value == -1) {
					doc[field].shift();
				}
			}
		} else if (key == "$pullAll") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var src = doc[fields[j]];
				var toRemove = value[fields[j]];
				var notRemoved = [];
				for (var k = 0; k < src.length; k++) {
					var removed = false;
					for (var l = 0; l < toRemove.length; l++) {
						if (src[k] == toRemove[l]) {
							removed = true;
							break;
						}
					}
					if (!removed) notRemoved.push(src[k]);
				}
				doc[fields[j]] = notRemoved;
			}
		} else if (key == "$pushAll") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = fields[j];
				var values = value[field];
				for (var k = 0; k < values.length; k++) {
					doc[field].push(values[k]);
				}
			}
		} else if (key == "$push") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = fields[j];
				doc[field].push(value[field]);
			}
		} else if (key == "$bit") {
			var field = Object.keys(value)[0];
			var operation = value[field];
			var operator = Object.keys(operation)[0];
			var operand = operation[operator];
			if (operator == "and") {
				doc[field] = doc[field] & operand;
			} else if (operator == "or") {
				doc[field] = doc[field] | operand;
			} else if (operator == "xor") {
				doc[field] = doc[field] ^ operand;
			} else {
				throw "unknown $bit operator: " + operator;
			}
		} else {
			throw "unknown update operator: " + key;
		}
	}
}

/**
 * Create a new document from query and update operators for upsert
 */
export function createDocFromUpdate(query, updates, idGenerator) {
	var newDoc = { _id: idGenerator() };
	var onlyFields = true;
	var updateKeys = Object.keys(updates);
	for (var i = 0; i < updateKeys.length; i++) {
		if (updateKeys[i].charAt(0) == "$") {
			onlyFields = false;
			break;
		}
	}
	if (onlyFields) {
		for (var i = 0; i < updateKeys.length; i++) {
			newDoc[updateKeys[i]] = updates[updateKeys[i]];
		}
	} else {
		var queryKeys = Object.keys(query);
		for (var i = 0; i < queryKeys.length; i++) {
			newDoc[queryKeys[i]] = query[queryKeys[i]];
		}
		applyUpdates(updates, newDoc, true);
	}
	return newDoc;
}
