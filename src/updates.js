/**
 * Update operations module
 */

import { setProp, getProp } from './utils.js';

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
						if (currentValue == undefined) currentValue = 0;
						return currentValue * amount;
					});
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
