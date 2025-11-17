/**
 * Update operations module
 */

import { setProp, getProp } from './utils.js';

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
export function applyUpdates(updates, doc, setOnInsert, arrayFilters) {
	var keys = Object.keys(updates);
	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		var value = updates[key];
		if (key == "$inc") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = replacePositionalOperator(fields[j], arrayFilters);
				var amount = value[fields[j]];
				var currentValue = getProp(doc, field);
				if (currentValue == undefined) currentValue = 0;
				setProp(doc, field, currentValue + amount);
			}
		} else if (key == "$mul") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = replacePositionalOperator(fields[j], arrayFilters);
				var amount = value[fields[j]];
				doc[field] = doc[field] * amount;
			}
		} else if (key == "$rename") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = replacePositionalOperator(fields[j], arrayFilters);
				var newName = replacePositionalOperator(value[fields[j]], arrayFilters);
				doc[newName] = doc[field];
				delete doc[field];
			}
		} else if (key == "$setOnInsert" && setOnInsert) {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = replacePositionalOperator(fields[j], arrayFilters);
				doc[field] = value[fields[j]];
			}
		} else if (key == "$set") {
			var fields = Object.keys(value);
			for (var j = 0; j < fields.length; j++) {
				var field = replacePositionalOperator(fields[j], arrayFilters);
				setProp(doc, field, value[fields[j]]);
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
