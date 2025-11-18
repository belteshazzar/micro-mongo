/**
 * Update operations module
 */

import { setProp, getProp } from './utils.js';
import { opMatches, matches } from './queryMatcher.js';
import { Timestamp } from './Timestamp.js';

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
 * Apply update operators to a document
 */
export function applyUpdates(updates, doc, setOnInsert) {
	var keys = Object.keys(updates);
	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		var value = updates[key];
		if (key == "$inc") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = fields[j];
				var amount = value[field];
				
				if (hasAllPositional(field)) {
					applyToAllPositional(doc, field, function(currentValue) {
						if (currentValue == undefined) currentValue = 0;
						return currentValue + amount;
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
				var field = fields[j];
				var amount = value[field];
				
				if (hasAllPositional(field)) {
					applyToAllPositional(doc, field, function(currentValue) {
						if (currentValue == undefined || currentValue == null) currentValue = 0;
						return currentValue * amount;
					});
				} else {
					if (doc[field] == undefined || doc[field] == null) doc[field] = 0;
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
				setProp(doc, field, value[field]);
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
				
				if (hasAllPositional(field)) {
					applyToAllPositional(doc, field, function(currentValue) {
						if (currentValue == undefined || currentValue == null) return amount;
						return Math.min(currentValue, amount);
					});
				} else {
					if (doc[field] == undefined || doc[field] == null) {
						doc[field] = amount;
					} else {
						doc[field] = Math.min(doc[field], amount);
					}
				}
			}
		} else if (key == "$max") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = fields[j];
				var amount = value[field];
				
				if (hasAllPositional(field)) {
					applyToAllPositional(doc, field, function(currentValue) {
						if (currentValue == undefined || currentValue == null) return amount;
						return Math.max(currentValue, amount);
					});
				} else {
					if (doc[field] == undefined || doc[field] == null) {
						doc[field] = amount;
					} else {
						doc[field] = Math.max(doc[field], amount);
					}
				}
			}
		} else if (key == "$currentDate") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = fields[j];
				var typeSpec = value[field];
				
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
		} else if (key == "$pull") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = fields[j];
				var condition = value[field];
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
				var pushValue = value[field];
				
				// Check if this is a modifier-based push
				var isModifierPush = pushValue !== null && typeof pushValue === 'object' && 
					(pushValue.$each !== undefined || pushValue.$position !== undefined || 
					 pushValue.$slice !== undefined || pushValue.$sort !== undefined);
				
				if (isModifierPush) {
					// Initialize array if it doesn't exist
					if (!doc[field]) {
						doc[field] = [];
					}
					
					// Get the values to push (either from $each or wrap single value)
					var valuesToPush = pushValue.$each !== undefined ? pushValue.$each : [pushValue];
					
					// Get position (default to end of array)
					var position = pushValue.$position !== undefined ? pushValue.$position : doc[field].length;
					
					// Handle negative position (from end)
					if (position < 0) {
						position = Math.max(0, doc[field].length + position);
					}
					
					// Insert values at specified position
					doc[field].splice(position, 0, ...valuesToPush);
					
					// Apply $sort if specified
					if (pushValue.$sort !== undefined) {
						var sortSpec = pushValue.$sort;
						if (typeof sortSpec === 'number') {
							// Simple numeric sort
							doc[field].sort(function(a, b) {
								if (a < b) return sortSpec > 0 ? -1 : 1;
								if (a > b) return sortSpec > 0 ? 1 : -1;
								return 0;
							});
						} else if (typeof sortSpec === 'object') {
							// Sort by subdocument fields
							doc[field].sort(function(a, b) {
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
							doc[field] = doc[field].slice(sliceValue);
						} else if (sliceValue === 0) {
							// Empty the array
							doc[field] = [];
						} else {
							// Keep first N elements
							doc[field] = doc[field].slice(0, sliceValue);
						}
					}
				} else {
					// Simple push (original behavior)
					doc[field].push(pushValue);
				}
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
