/**
 * Update operations module
 */

import { setProp, getProp } from './utils.js';
import { opMatches, matches } from './queryMatcher.js';

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
				var currentValue = getProp(doc, field);
				if (currentValue == undefined) currentValue = 0;
				setProp(doc, field, currentValue + amount);
			}
		} else if (key == "$mul") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = fields[j];
				var amount = value[field];
				doc[field] = doc[field] * amount;
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
				doc[field] = Math.min(doc[field], amount);
			}
		} else if (key == "$max") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = fields[j];
				var amount = value[field];
				doc[field] = Math.max(doc[field], amount);
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
					
					// Check if condition is a query object with operators or just a value/object to match
					if (typeof condition === 'object' && condition !== null && !Array.isArray(condition)) {
						// Check if ANY key contains query operators
						var hasOperators = false;
						var conditionKeys = Object.keys(condition);
						for (var m = 0; m < conditionKeys.length; m++) {
							var condKey = conditionKeys[m];
							// If the key starts with $, it's an operator
							if (condKey.charAt(0) == "$") {
								hasOperators = true;
								break;
							}
							// If the value is an object with operator keys, it's a nested query
							if (typeof condition[condKey] === 'object' && condition[condKey] !== null) {
								var nestedKeys = Object.keys(condition[condKey]);
								if (nestedKeys.length > 0 && nestedKeys[0].charAt(0) == "$") {
									hasOperators = true;
									break;
								}
							}
						}
						
						if (hasOperators) {
							// Use query matching - treat the element as a document
							// and the condition as a query
							if (typeof element === 'object' && element !== null && !Array.isArray(element)) {
								// For objects, use matches function
								shouldRemove = matches(element, condition);
							} else {
								// For primitives with operators like {$gte: 5}
								var tempDoc = { __temp: element };
								shouldRemove = opMatches(tempDoc, "__temp", condition);
							}
						} else {
							// For plain objects without operators, do deep equality check
							shouldRemove = objectEquals(element, condition);
						}
					} else {
						// For simple values (string, number, boolean, etc.), do direct comparison
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
