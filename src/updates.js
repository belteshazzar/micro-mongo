/**
 * Update operations module
 */

import { setProp, getProp, isArray } from './utils.js';
import { opMatches, matches } from './queryMatcher.js';
import { Timestamp } from './Timestamp.js';

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
 * Deep equality check for objects
 */
function objectEquals(a, b) {
	if (a === b) return true;
	if (a == null || b == null) return false;
	if (typeof a !== 'object' || typeof b !== 'object') return false;
	
	// Handle arrays
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		for (var i = 0; i < a.length; i++) {
			if (!objectEquals(a[i], b[i])) return false;
		}
		return true;
	}
	
	// Handle dates
	if (a instanceof Date && b instanceof Date) {
		return a.getTime() === b.getTime();
	}
	
	// One is array, the other is not
	if (Array.isArray(a) !== Array.isArray(b)) return false;
	
	var keysA = Object.keys(a);
	var keysB = Object.keys(b);
	
	if (keysA.length !== keysB.length) return false;
	
	for (var i = 0; i < keysA.length; i++) {
		var key = keysA[i];
		if (!keysB.includes(key)) return false;
		if (!objectEquals(a[key], b[key])) return false;
	}
	
	return true;
}

/**
 * Check if a field path contains the $[] positional operator
 */
function hasAllPositional(field) {
	return field.indexOf('$[]') !== -1;
}

/**
 * Apply an update function to all elements matching $[] operator
 * This is used for operators like $inc, $mul that need to read-modify-write
 */
function applyToAllPositional(doc, field, updateFn) {
	var path = field.split(".");
	var current = doc;
	
	// Navigate to the first $[] operator
	for (var i = 0; i < path.length; i++) {
		var pathSegment = path[i];
		
		if (pathSegment === '$[]') {
			// Current should be an array
			if (!Array.isArray(current)) {
				return; // Skip if not an array
			}
			
			// Build the remaining path after this $[]
			var remainingPath = path.slice(i + 1).join('.');
			
			// Process each array element
			for (var j = 0; j < current.length; j++) {
				if (remainingPath) {
					// There's more path after $[], recursively apply
					if (remainingPath.indexOf('$[]') !== -1) {
						// Nested $[] operator
						applyToAllPositional(current[j], remainingPath, updateFn);
					} else {
						// No more $[], apply the update function
						var currentValue = getProp(current[j], remainingPath);
						var newValue = updateFn(currentValue);
						setProp(current[j], remainingPath, newValue);
					}
				} else {
					// $[] is the last segment, apply to each element directly
					current[j] = updateFn(current[j]);
				}
			}
			return;
		}
		
		// Navigate to next level
		if (current == null || current == undefined) return;
		current = current[pathSegment];
	}
}

/**
 * Replace $ positional operator in a field path with the matched array index
 * 
 * @param {string} fieldPath - The field path potentially containing $
 * @param {object} arrayFilters - Map of field paths to matched array indices
 * @returns {string} The field path with $ replaced by the matched index
 */
function replacePositionalOperator(fieldPath, arrayFilters) {
	if (!arrayFilters || !fieldPath.includes('$')) {
		return fieldPath;
	}
	
	// Split the path to find the $ placeholder
	const parts = fieldPath.split('.');
	const dollarIndex = parts.indexOf('$');
	
	if (dollarIndex === -1) {
		return fieldPath;
	}
	
	// Build the field path up to the $
	const pathBeforeDollar = parts.slice(0, dollarIndex).join('.');
	
	// Find the matched index for this field path
	// We need to check if we have a match for the field before $
	let matchedIndex = null;
	
	// Try to find a matching filter by checking various possible field paths
	// The query could be on the array itself or a nested field
	for (const filterPath in arrayFilters) {
		// Check if the filter path matches the beginning of our field path
		if (filterPath === pathBeforeDollar || filterPath.startsWith(pathBeforeDollar + '.')) {
			matchedIndex = arrayFilters[filterPath];
			break;
		}
	}
	
	// If we found a matched index, replace $ with it
	if (matchedIndex !== null && matchedIndex !== undefined) {
		parts[dollarIndex] = matchedIndex.toString();
		return parts.join('.');
	}
	
	// If no matched index found, return original path (update will likely be a no-op)
	return fieldPath;
}

/**
 * Apply update operators to a document
 * 
 * @param {object} updates - The update operators to apply
 * @param {object} doc - The document to update
 * @param {boolean} setOnInsert - Whether to apply $setOnInsert
 * @param {object} arrayFilters - Optional map of field paths to matched array indices for $ operator
 */
export function applyUpdates(updates, doc, setOnInsert, positionalMatchInfo, userArrayFilters) {
	var keys = Object.keys(updates);
	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		var value = updates[key];
		if (key == "$inc") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = replacePositionalOperator(fields[j], positionalMatchInfo);
				var amount = value[fields[j]];
				
				// Check if this field uses filtered positional operator
				if (hasFilteredPositionalOperator(field)) {
					const parsedPath = parseFieldPath(field);
					applyToFilteredArrayElements(doc, parsedPath, amount, '$inc', userArrayFilters);
				} else if (hasAllPositional(field)) {
					// Handle $[] all-positional operator
					applyToAllPositional(doc, field, function(val) {
						return (val === undefined ? 0 : val) + amount;
					});
				} else {
					var currentValue = getProp(doc, field);
					if (currentValue == undefined) currentValue = 0;
					setProp(doc, field, currentValue + amount);
				}
			}
		} else if (key == "$mul") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = replacePositionalOperator(fields[j], positionalMatchInfo);
				var amount = value[fields[j]];
				
				// Check if this field uses filtered positional operator
				if (hasFilteredPositionalOperator(field)) {
					const parsedPath = parseFieldPath(field);
					applyToFilteredArrayElements(doc, parsedPath, amount, '$mul', userArrayFilters);
				} else if (hasAllPositional(field)) {
					// Handle $[] all-positional operator
					applyToAllPositional(doc, field, function(val) {
						return val * amount;
					});
				} else {
					var currentValue = getProp(doc, field);
					if (currentValue == undefined) currentValue = 0;
					setProp(doc, field, currentValue * amount);
				}
			}
		} else if (key == "$rename") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = replacePositionalOperator(fields[j], positionalMatchInfo);
				var newName = replacePositionalOperator(value[fields[j]], positionalMatchInfo);
				doc[newName] = doc[field];
				delete doc[field];
			}
		} else if (key == "$setOnInsert" && setOnInsert) {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = replacePositionalOperator(fields[j], positionalMatchInfo);
				doc[field] = value[fields[j]];
			}
		} else if (key == "$set") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = replacePositionalOperator(fields[j], positionalMatchInfo);
				
				// Check if this field uses filtered positional operator
				if (hasFilteredPositionalOperator(field)) {
					const parsedPath = parseFieldPath(field);
					applyToFilteredArrayElements(doc, parsedPath, value[fields[j]], '$set', userArrayFilters);
				} else {
					setProp(doc, field, value[fields[j]]);
				}
			}
		} else if (key == "$unset") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = replacePositionalOperator(fields[j], positionalMatchInfo);
				delete doc[field];
			}
		} else if (key == "$min") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = replacePositionalOperator(fields[j], positionalMatchInfo);
				var amount = value[fields[j]];
				
				// Check if this field uses filtered positional operator
				if (hasFilteredPositionalOperator(field)) {
					const parsedPath = parseFieldPath(field);
					applyToFilteredArrayElements(doc, parsedPath, amount, '$min', userArrayFilters);
				} else if (hasAllPositional(field)) {
					// Handle $[] all-positional operator
					applyToAllPositional(doc, field, function(val) {
						return Math.min(val, amount);
					});
				} else {
					var currentValue = getProp(doc, field);
					setProp(doc, field, Math.min(currentValue, amount));
				}
			}
		} else if (key == "$max") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = replacePositionalOperator(fields[j], positionalMatchInfo);
				var amount = value[fields[j]];
				
				// Check if this field uses filtered positional operator
				if (hasFilteredPositionalOperator(field)) {
					const parsedPath = parseFieldPath(field);
					applyToFilteredArrayElements(doc, parsedPath, amount, '$max', userArrayFilters);
				} else if (hasAllPositional(field)) {
					// Handle $[] all-positional operator
					applyToAllPositional(doc, field, function(val) {
						return Math.max(val, amount);
					});
				} else {
					var currentValue = getProp(doc, field);
					setProp(doc, field, Math.max(currentValue, amount));
				}
			}
		} else if (key == "$currentDate") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = replacePositionalOperator(fields[j], positionalMatchInfo);
				var typeSpec = value[fields[j]];
				
				// Handle boolean true or { $type: "date" }
				if (typeSpec === true || (typeof typeSpec === 'object' && typeSpec.$type === 'date')) {
					setProp(doc, field, new Date());
				}
				// Handle { $type: "timestamp" }
				else if (typeof typeSpec === 'object' && typeSpec.$type === 'timestamp') {
					setProp(doc, field, new Timestamp());
				}
				// Default to Date for backwards compatibility
				else {
					setProp(doc, field, new Date());
				}
			}
		} else if (key == "$addToSet") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = replacePositionalOperator(fields[j], positionalMatchInfo);
				var addValue = value[fields[j]];
				var currentArray = getProp(doc, field);
				if (currentArray && Array.isArray(currentArray)) {
					currentArray.push(addValue);
				}
			}
		} else if (key == "$pop") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = replacePositionalOperator(fields[j], positionalMatchInfo);
				var popValue = value[fields[j]];
				var currentArray = getProp(doc, field);
				if (currentArray && Array.isArray(currentArray)) {
					if (popValue == 1) {
						currentArray.pop();
					} else if (popValue == -1) {
						currentArray.shift();
					}
				}
			}
		} else if (key == "$pull") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = replacePositionalOperator(fields[j], positionalMatchInfo);
				var condition = value[fields[j]];
				var src = getProp(doc, field);
				
				// Skip if field doesn't exist or is not an array
				if (src == undefined || !Array.isArray(src)) continue;
				
				var notRemoved = [];
				for (var k = 0; k < src.length; k++) {
					var element = src[k];
					var shouldRemove = false;
					
					// Determine how to match the condition against the element
					if (typeof condition === 'object' && condition !== null && !Array.isArray(condition)) {
						// Condition is an object (could be a query or a value to match)
						if (typeof element === 'object' && element !== null && !Array.isArray(element)) {
							// Element is also an object - use query matching
							// This handles both {price: null}, {name: "test"}, and {price: {$gte: 10}}
							shouldRemove = matches(element, condition);
						} else {
							// Element is a primitive but condition is an object with operators like {$gte: 5}
							var tempDoc = { __temp: element };
							shouldRemove = opMatches(tempDoc, "__temp", condition);
						}
					} else {
						// Condition is a simple value (string, number, boolean, null, etc.)
						// Do direct comparison
						shouldRemove = element == condition;
					}
					
					if (!shouldRemove) notRemoved.push(element);
				}
				setProp(doc, field, notRemoved);
			}
		} else if (key == "$pullAll") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = replacePositionalOperator(fields[j], positionalMatchInfo);
				var src = getProp(doc, field);
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
				setProp(doc, field, notRemoved);
			}
		} else if (key == "$pushAll") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = replacePositionalOperator(fields[j], positionalMatchInfo);
				var values = value[fields[j]];
				var currentArray = getProp(doc, field);
				if (currentArray && Array.isArray(currentArray)) {
					for (var k = 0; k < values.length; k++) {
						currentArray.push(values[k]);
					}
				}
			}
		} else if (key == "$push") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = replacePositionalOperator(fields[j], positionalMatchInfo);
				var pushValue = value[fields[j]];
				
				// Check if this is a modifier-based push
				var isModifierPush = pushValue !== null && typeof pushValue === 'object' && 
					(pushValue.$each !== undefined || pushValue.$position !== undefined || 
					 pushValue.$slice !== undefined || pushValue.$sort !== undefined);
				
				if (isModifierPush) {
					// Initialize array if it doesn't exist
					var currentArray = getProp(doc, field);
					if (!currentArray) {
						currentArray = [];
						setProp(doc, field, currentArray);
					}
					
					// Get the values to push (either from $each or wrap single value)
					var valuesToPush = pushValue.$each !== undefined ? pushValue.$each : [pushValue];
					
					// Get position (default to end of array)
					var position = pushValue.$position !== undefined ? pushValue.$position : currentArray.length;
					
					// Handle negative position (from end)
					if (position < 0) {
						position = Math.max(0, currentArray.length + position);
					}
					
					// Insert values at specified position
					currentArray.splice(position, 0, ...valuesToPush);
					
					// Apply $sort if specified
					if (pushValue.$sort !== undefined) {
						var sortSpec = pushValue.$sort;
						if (typeof sortSpec === 'number') {
							// Simple numeric sort
							currentArray.sort(function(a, b) {
								if (a < b) return sortSpec > 0 ? -1 : 1;
								if (a > b) return sortSpec > 0 ? 1 : -1;
								return 0;
							});
						} else if (typeof sortSpec === 'object') {
							// Sort by subdocument fields
							currentArray.sort(function(a, b) {
								var sortKeys = Object.keys(sortSpec);
								for (var k = 0; k < sortKeys.length; k++) {
									var sortKey = sortKeys[k];
									var sortDir = sortSpec[sortKey];
									var aVal = getProp(a, sortKey);
									var bVal = getProp(b, sortKey);
									if (aVal < bVal) return sortDir > 0 ? -1 : 1;
									if (aVal > bVal) return sortDir > 0 ? 1 : -1;
								}
								return 0;
							});
						}
					}
					
					// Apply $slice if specified
					if (pushValue.$slice !== undefined) {
						var sliceValue = pushValue.$slice;
						if (sliceValue < 0) {
							// Keep last N elements
							var sliced = currentArray.slice(sliceValue);
							setProp(doc, field, sliced);
						} else if (sliceValue === 0) {
							// Empty the array
							setProp(doc, field, []);
						} else {
							// Keep first N elements
							var sliced = currentArray.slice(0, sliceValue);
							setProp(doc, field, sliced);
						}
					}
				} else {
					// Simple push (original behavior)
					var currentArray = getProp(doc, field);
					if (currentArray && Array.isArray(currentArray)) {
						currentArray.push(pushValue);
					}
				}
			}
		} else if (key == "$bit") {
			var fields = Object.keys(value);
			var field = replacePositionalOperator(fields[0], positionalMatchInfo);
			var operation = value[fields[0]];
			var operator = Object.keys(operation)[0];
			var operand = operation[operator];
			var currentValue = getProp(doc, field);
			if (operator == "and") {
				setProp(doc, field, currentValue & operand);
			} else if (operator == "or") {
				setProp(doc, field, currentValue | operand);
			} else if (operator == "xor") {
				setProp(doc, field, currentValue ^ operand);
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
export function createDocFromUpdate(query, updates, id) {
	var newDoc = { _id: id };
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
