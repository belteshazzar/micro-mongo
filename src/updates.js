/**
 * Update operations module
 */

import { setProp, getProp } from './utils.js';

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
