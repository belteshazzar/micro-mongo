/**
 * Aggregation Expression Evaluator
 * 
 * Implements MongoDB aggregation expression operators for use in
 * $project, $addFields, $set, $group, and other pipeline stages.
 */

import { getProp } from '../utils.js';

/**
 * Evaluate an aggregation expression against a document
 * @param {*} expr - The expression to evaluate (can be literal, field reference, or expression object)
 * @param {Object} doc - The document to evaluate against
 * @returns {*} The evaluated result
 */
export function evaluateExpression(expr, doc) {
	// Literal values (strings not starting with $, numbers, booleans, null)
	if (expr === null || expr === undefined) {
		return expr;
	}
	
	if (typeof expr === 'boolean' || typeof expr === 'number') {
		return expr;
	}
	
	// Field reference ($fieldName) or variable reference ($$variableName)
	if (typeof expr === 'string') {
		if (expr.startsWith('$$')) {
			// Special system variables for $redact
			if (expr === '$$KEEP' || expr === '$$PRUNE' || expr === '$$DESCEND') {
				return expr;
			}
			// Variable reference ($$var)
			return getProp(doc, expr.substring(2));
		} else if (expr.charAt(0) === '$') {
			// Field reference ($field)
			return getProp(doc, expr.substring(1));
		}
		return expr; // Literal string
	}
	
	// Expression object
	if (typeof expr === 'object') {
		// Check if it's an array literal
		if (Array.isArray(expr)) {
			return expr.map(item => evaluateExpression(item, doc));
		}
		
		// Expression operator
		const keys = Object.keys(expr);
		if (keys.length === 0) {
			return expr; // Empty object literal
		}
		
		const operator = keys[0];
		
		// Check if this is an operator (starts with $) or an object literal
		if (operator.charAt(0) === '$') {
			// This is an expression operator
			const operand = expr[operator];
			return evaluateOperator(operator, operand, doc);
		} else {
			// This is an object literal - evaluate each field
			const result = {};
			for (const key of keys) {
				result[key] = evaluateExpression(expr[key], doc);
			}
			return result;
		}
	}
	
	return expr;
}

/**
 * Evaluate a specific operator
 */
function evaluateOperator(operator, operand, doc) {
	switch (operator) {
		// Arithmetic operators
		case '$add': return evalAdd(operand, doc);
		case '$subtract': return evalSubtract(operand, doc);
		case '$multiply': return evalMultiply(operand, doc);
		case '$divide': return evalDivide(operand, doc);
		case '$mod': return evalMod(operand, doc);
		case '$pow': return evalPow(operand, doc);
		case '$sqrt': return evalSqrt(operand, doc);
		case '$abs': return evalAbs(operand, doc);
		case '$ceil': return evalCeil(operand, doc);
		case '$floor': return evalFloor(operand, doc);
		case '$trunc': return evalTrunc(operand, doc);
		case '$round': return evalRound(operand, doc);
		
		// String operators
		case '$concat': return evalConcat(operand, doc);
		case '$substr': return evalSubstr(operand, doc);
		case '$toLower': return evalToLower(operand, doc);
		case '$toUpper': return evalToUpper(operand, doc);
		case '$trim': return evalTrim(operand, doc);
		case '$ltrim': return evalLtrim(operand, doc);
		case '$rtrim': return evalRtrim(operand, doc);
		case '$split': return evalSplit(operand, doc);
		case '$strLenCP': return evalStrLenCP(operand, doc);
		case '$strcasecmp': return evalStrcasecmp(operand, doc);
		case '$indexOfCP': return evalIndexOfCP(operand, doc);
		case '$replaceOne': return evalReplaceOne(operand, doc);
		case '$replaceAll': return evalReplaceAll(operand, doc);
		
		// Comparison operators
		case '$cmp': return evalCmp(operand, doc);
		case '$eq': return evalEq(operand, doc);
		case '$ne': return evalNe(operand, doc);
		case '$gt': return evalGt(operand, doc);
		case '$gte': return evalGte(operand, doc);
		case '$lt': return evalLt(operand, doc);
		case '$lte': return evalLte(operand, doc);
		
		// Logical operators
		case '$and': return evalAnd(operand, doc);
		case '$or': return evalOr(operand, doc);
		case '$not': return evalNot(operand, doc);
		
		// Conditional operators
		case '$cond': return evalCond(operand, doc);
		case '$ifNull': return evalIfNull(operand, doc);
		case '$switch': return evalSwitch(operand, doc);
		
		// Date operators
		case '$year': return evalYear(operand, doc);
		case '$month': return evalMonth(operand, doc);
		case '$dayOfMonth': return evalDayOfMonth(operand, doc);
		case '$dayOfWeek': return evalDayOfWeek(operand, doc);
		case '$dayOfYear': return evalDayOfYear(operand, doc);
		case '$hour': return evalHour(operand, doc);
		case '$minute': return evalMinute(operand, doc);
		case '$second': return evalSecond(operand, doc);
		case '$millisecond': return evalMillisecond(operand, doc);
		case '$week': return evalWeek(operand, doc);
		case '$isoWeek': return evalIsoWeek(operand, doc);
		case '$isoWeekYear': return evalIsoWeekYear(operand, doc);
		case '$dateToString': return evalDateToString(operand, doc);
		case '$toDate': return evalToDate(operand, doc);
		
		// Array operators
		case '$arrayElemAt': return evalArrayElemAt(operand, doc);
		case '$concatArrays': return evalConcatArrays(operand, doc);
		case '$filter': return evalFilter(operand, doc);
		case '$in': return evalIn(operand, doc);
		case '$indexOfArray': return evalIndexOfArray(operand, doc);
		case '$isArray': return evalIsArray(operand, doc);
		case '$map': return evalMap(operand, doc);
		case '$reduce': return evalReduce(operand, doc);
		case '$size': return evalSize(operand, doc);
		case '$slice': return evalSlice(operand, doc);
		case '$reverseArray': return evalReverseArray(operand, doc);
		case '$zip': return evalZip(operand, doc);
		
		// Type operators
		case '$type': return evalType(operand, doc);
		case '$convert': return evalConvert(operand, doc);
		case '$toBool': return evalToBool(operand, doc);
		case '$toDecimal': return evalToDecimal(operand, doc);
		case '$toDouble': return evalToDouble(operand, doc);
		case '$toInt': return evalToInt(operand, doc);
		case '$toLong': return evalToLong(operand, doc);
		case '$toString': return evalToString(operand, doc);
		
		// Object operators
		case '$objectToArray': return evalObjectToArray(operand, doc);
		case '$arrayToObject': return evalArrayToObject(operand, doc);
		case '$mergeObjects': return evalMergeObjects(operand, doc);
		
		// Literal operator
		case '$literal': return operand;
		
		default:
			throw new Error(`Unsupported aggregation operator: ${operator}`);
	}
}

// ============================================================================
// ARITHMETIC OPERATORS
// ============================================================================

function evalAdd(operands, doc) {
	if (!Array.isArray(operands)) return null;
	let sum = 0;
	for (const operand of operands) {
		const val = evaluateExpression(operand, doc);
		if (val instanceof Date) {
			sum += val.getTime();
		} else if (typeof val === 'number') {
			sum += val;
		}
	}
	return sum;
}

function evalSubtract(operands, doc) {
	if (!Array.isArray(operands) || operands.length !== 2) return null;
	const val1 = evaluateExpression(operands[0], doc);
	const val2 = evaluateExpression(operands[1], doc);
	
	if (val1 instanceof Date && val2 instanceof Date) {
		return val1.getTime() - val2.getTime();
	} else if (val1 instanceof Date && typeof val2 === 'number') {
		return new Date(val1.getTime() - val2);
	} else if (typeof val1 === 'number' && typeof val2 === 'number') {
		return val1 - val2;
	}
	return null;
}

function evalMultiply(operands, doc) {
	if (!Array.isArray(operands)) return null;
	let product = 1;
	for (const operand of operands) {
		const val = evaluateExpression(operand, doc);
		if (typeof val === 'number') {
			product *= val;
		}
	}
	return product;
}

function evalDivide(operands, doc) {
	if (!Array.isArray(operands) || operands.length !== 2) return null;
	const val1 = evaluateExpression(operands[0], doc);
	const val2 = evaluateExpression(operands[1], doc);
	if (typeof val1 === 'number' && typeof val2 === 'number' && val2 !== 0) {
		return val1 / val2;
	}
	return null;
}

function evalMod(operands, doc) {
	if (!Array.isArray(operands) || operands.length !== 2) return null;
	const val1 = evaluateExpression(operands[0], doc);
	const val2 = evaluateExpression(operands[1], doc);
	if (typeof val1 === 'number' && typeof val2 === 'number' && val2 !== 0) {
		return val1 % val2;
	}
	return null;
}

function evalPow(operands, doc) {
	if (!Array.isArray(operands) || operands.length !== 2) return null;
	const base = evaluateExpression(operands[0], doc);
	const exponent = evaluateExpression(operands[1], doc);
	if (typeof base === 'number' && typeof exponent === 'number') {
		return Math.pow(base, exponent);
	}
	return null;
}

function evalSqrt(operand, doc) {
	const val = evaluateExpression(operand, doc);
	if (typeof val === 'number' && val >= 0) {
		return Math.sqrt(val);
	}
	return null;
}

function evalAbs(operand, doc) {
	const val = evaluateExpression(operand, doc);
	if (typeof val === 'number') {
		return Math.abs(val);
	}
	return null;
}

function evalCeil(operand, doc) {
	const val = evaluateExpression(operand, doc);
	if (typeof val === 'number') {
		return Math.ceil(val);
	}
	return null;
}

function evalFloor(operand, doc) {
	const val = evaluateExpression(operand, doc);
	if (typeof val === 'number') {
		return Math.floor(val);
	}
	return null;
}

function evalTrunc(operand, doc) {
	const val = evaluateExpression(operand, doc);
	if (typeof val === 'number') {
		return Math.trunc(val);
	}
	return null;
}

function evalRound(operands, doc) {
	const val = evaluateExpression(Array.isArray(operands) ? operands[0] : operands, doc);
	const place = Array.isArray(operands) && operands[1] !== undefined 
		? evaluateExpression(operands[1], doc) 
		: 0;
	
	if (typeof val === 'number' && typeof place === 'number') {
		const multiplier = Math.pow(10, place);
		return Math.round(val * multiplier) / multiplier;
	}
	return null;
}

// ============================================================================
// STRING OPERATORS
// ============================================================================

function evalConcat(operands, doc) {
	if (!Array.isArray(operands)) return null;
	let result = '';
	for (const operand of operands) {
		const val = evaluateExpression(operand, doc);
		if (val !== null && val !== undefined) {
			result += String(val);
		}
	}
	return result;
}

function evalSubstr(operands, doc) {
	if (!Array.isArray(operands) || operands.length < 3) return null;
	const str = String(evaluateExpression(operands[0], doc) || '');
	const start = evaluateExpression(operands[1], doc);
	const length = evaluateExpression(operands[2], doc);
	if (typeof start === 'number' && typeof length === 'number') {
		return str.substr(start, length);
	}
	return null;
}

function evalToLower(operand, doc) {
	const val = evaluateExpression(operand, doc);
	return val !== null && val !== undefined ? String(val).toLowerCase() : '';
}

function evalToUpper(operand, doc) {
	const val = evaluateExpression(operand, doc);
	return val !== null && val !== undefined ? String(val).toUpperCase() : '';
}

function evalTrim(operand, doc) {
	const val = evaluateExpression(typeof operand === 'object' && operand.input ? operand.input : operand, doc);
	const chars = operand.chars ? evaluateExpression(operand.chars, doc) : null;
	
	let str = val !== null && val !== undefined ? String(val) : '';
	
	if (chars) {
		const charsRegex = new RegExp(`^[${escapeRegex(chars)}]+|[${escapeRegex(chars)}]+$`, 'g');
		return str.replace(charsRegex, '');
	}
	return str.trim();
}

function evalLtrim(operand, doc) {
	const val = evaluateExpression(typeof operand === 'object' && operand.input ? operand.input : operand, doc);
	const chars = operand.chars ? evaluateExpression(operand.chars, doc) : null;
	
	let str = val !== null && val !== undefined ? String(val) : '';
	
	if (chars) {
		const charsRegex = new RegExp(`^[${escapeRegex(chars)}]+`, 'g');
		return str.replace(charsRegex, '');
	}
	return str.replace(/^\s+/, '');
}

function evalRtrim(operand, doc) {
	const val = evaluateExpression(typeof operand === 'object' && operand.input ? operand.input : operand, doc);
	const chars = operand.chars ? evaluateExpression(operand.chars, doc) : null;
	
	let str = val !== null && val !== undefined ? String(val) : '';
	
	if (chars) {
		const charsRegex = new RegExp(`[${escapeRegex(chars)}]+$`, 'g');
		return str.replace(charsRegex, '');
	}
	return str.replace(/\s+$/, '');
}

function evalSplit(operands, doc) {
	if (!Array.isArray(operands) || operands.length !== 2) return null;
	const str = String(evaluateExpression(operands[0], doc) || '');
	const delimiter = String(evaluateExpression(operands[1], doc) || '');
	return str.split(delimiter);
}

function evalStrLenCP(operand, doc) {
	const val = evaluateExpression(operand, doc);
	return val !== null && val !== undefined ? String(val).length : 0;
}

function evalStrcasecmp(operands, doc) {
	if (!Array.isArray(operands) || operands.length !== 2) return null;
	const str1 = String(evaluateExpression(operands[0], doc) || '').toLowerCase();
	const str2 = String(evaluateExpression(operands[1], doc) || '').toLowerCase();
	
	if (str1 < str2) return -1;
	if (str1 > str2) return 1;
	return 0;
}

function evalIndexOfCP(operands, doc) {
	if (!Array.isArray(operands) || operands.length < 2) return null;
	const str = String(evaluateExpression(operands[0], doc) || '');
	const substr = String(evaluateExpression(operands[1], doc) || '');
	const start = operands[2] !== undefined ? evaluateExpression(operands[2], doc) : 0;
	const end = operands[3] !== undefined ? evaluateExpression(operands[3], doc) : str.length;
	
	const searchStr = str.substring(start, end);
	const index = searchStr.indexOf(substr);
	return index === -1 ? -1 : index + start;
}

function evalReplaceOne(operand, doc) {
	const input = String(evaluateExpression(operand.input, doc) || '');
	const find = String(evaluateExpression(operand.find, doc) || '');
	const replacement = String(evaluateExpression(operand.replacement, doc) || '');
	
	return input.replace(find, replacement);
}

function evalReplaceAll(operand, doc) {
	const input = String(evaluateExpression(operand.input, doc) || '');
	const find = String(evaluateExpression(operand.find, doc) || '');
	const replacement = String(evaluateExpression(operand.replacement, doc) || '');
	
	return input.split(find).join(replacement);
}

function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================================
// COMPARISON OPERATORS
// ============================================================================

function evalCmp(operands, doc) {
	if (!Array.isArray(operands) || operands.length !== 2) return null;
	const val1 = evaluateExpression(operands[0], doc);
	const val2 = evaluateExpression(operands[1], doc);
	
	if (val1 < val2) return -1;
	if (val1 > val2) return 1;
	return 0;
}

function evalEq(operands, doc) {
	if (!Array.isArray(operands) || operands.length !== 2) return null;
	const val1 = evaluateExpression(operands[0], doc);
	const val2 = evaluateExpression(operands[1], doc);
	return val1 === val2;
}

function evalNe(operands, doc) {
	if (!Array.isArray(operands) || operands.length !== 2) return null;
	const val1 = evaluateExpression(operands[0], doc);
	const val2 = evaluateExpression(operands[1], doc);
	return val1 !== val2;
}

function evalGt(operands, doc) {
	if (!Array.isArray(operands) || operands.length !== 2) return null;
	const val1 = evaluateExpression(operands[0], doc);
	const val2 = evaluateExpression(operands[1], doc);
	return val1 > val2;
}

function evalGte(operands, doc) {
	if (!Array.isArray(operands) || operands.length !== 2) return null;
	const val1 = evaluateExpression(operands[0], doc);
	const val2 = evaluateExpression(operands[1], doc);
	return val1 >= val2;
}

function evalLt(operands, doc) {
	if (!Array.isArray(operands) || operands.length !== 2) return null;
	const val1 = evaluateExpression(operands[0], doc);
	const val2 = evaluateExpression(operands[1], doc);
	return val1 < val2;
}

function evalLte(operands, doc) {
	if (!Array.isArray(operands) || operands.length !== 2) return null;
	const val1 = evaluateExpression(operands[0], doc);
	const val2 = evaluateExpression(operands[1], doc);
	return val1 <= val2;
}

// ============================================================================
// LOGICAL OPERATORS
// ============================================================================

function evalAnd(operands, doc) {
	if (!Array.isArray(operands)) return null;
	for (const operand of operands) {
		const val = evaluateExpression(operand, doc);
		if (!val) return false;
	}
	return true;
}

function evalOr(operands, doc) {
	if (!Array.isArray(operands)) return null;
	for (const operand of operands) {
		const val = evaluateExpression(operand, doc);
		if (val) return true;
	}
	return false;
}

function evalNot(operand, doc) {
	const val = evaluateExpression(Array.isArray(operand) ? operand[0] : operand, doc);
	return !val;
}

// ============================================================================
// CONDITIONAL OPERATORS
// ============================================================================

function evalCond(operand, doc) {
	// Supports both array form [if, then, else] and object form {if, then, else}
	let ifExpr, thenExpr, elseExpr;
	
	if (Array.isArray(operand)) {
		if (operand.length !== 3) return null;
		[ifExpr, thenExpr, elseExpr] = operand;
	} else if (typeof operand === 'object') {
		ifExpr = operand.if;
		thenExpr = operand.then;
		elseExpr = operand.else;
	} else {
		return null;
	}
	
	const condition = evaluateExpression(ifExpr, doc);
	return condition ? evaluateExpression(thenExpr, doc) : evaluateExpression(elseExpr, doc);
}

function evalIfNull(operands, doc) {
	if (!Array.isArray(operands) || operands.length < 2) return null;
	
	for (let i = 0; i < operands.length; i++) {
		const val = evaluateExpression(operands[i], doc);
		if (val !== null && val !== undefined) {
			return val;
		}
	}
	return null;
}

function evalSwitch(operand, doc) {
	if (typeof operand !== 'object' || !Array.isArray(operand.branches)) {
		return null;
	}
	
	for (const branch of operand.branches) {
		const caseResult = evaluateExpression(branch.case, doc);
		if (caseResult) {
			return evaluateExpression(branch.then, doc);
		}
	}
	
	return operand.default !== undefined ? evaluateExpression(operand.default, doc) : null;
}

// ============================================================================
// DATE OPERATORS
// ============================================================================

function evalYear(operand, doc) {
	const date = evaluateExpression(operand, doc);
	if (date instanceof Date) {
		return date.getUTCFullYear();
	}
	return null;
}

function evalMonth(operand, doc) {
	const date = evaluateExpression(operand, doc);
	if (date instanceof Date) {
		return date.getUTCMonth() + 1; // MongoDB returns 1-12
	}
	return null;
}

function evalDayOfMonth(operand, doc) {
	const date = evaluateExpression(operand, doc);
	if (date instanceof Date) {
		return date.getUTCDate();
	}
	return null;
}

function evalDayOfWeek(operand, doc) {
	const date = evaluateExpression(operand, doc);
	if (date instanceof Date) {
		return date.getUTCDay() + 1; // MongoDB returns 1-7 (Sunday is 1)
	}
	return null;
}

function evalDayOfYear(operand, doc) {
	const date = evaluateExpression(operand, doc);
	if (date instanceof Date) {
		const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
		const diff = date - start;
		const oneDay = 1000 * 60 * 60 * 24;
		return Math.floor(diff / oneDay);
	}
	return null;
}

function evalHour(operand, doc) {
	const date = evaluateExpression(operand, doc);
	if (date instanceof Date) {
		return date.getUTCHours();
	}
	return null;
}

function evalMinute(operand, doc) {
	const date = evaluateExpression(operand, doc);
	if (date instanceof Date) {
		return date.getUTCMinutes();
	}
	return null;
}

function evalSecond(operand, doc) {
	const date = evaluateExpression(operand, doc);
	if (date instanceof Date) {
		return date.getUTCSeconds();
	}
	return null;
}

function evalMillisecond(operand, doc) {
	const date = evaluateExpression(operand, doc);
	if (date instanceof Date) {
		return date.getUTCMilliseconds();
	}
	return null;
}

function evalWeek(operand, doc) {
	const date = evaluateExpression(operand, doc);
	if (date instanceof Date) {
		const onejan = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
		const week = Math.ceil((((date - onejan) / 86400000) + onejan.getUTCDay() + 1) / 7);
		return week - 1; // MongoDB weeks are 0-indexed
	}
	return null;
}

function evalIsoWeek(operand, doc) {
	const date = evaluateExpression(operand, doc);
	if (date instanceof Date) {
		const target = new Date(date.valueOf());
		const dayNr = (date.getUTCDay() + 6) % 7;
		target.setUTCDate(target.getUTCDate() - dayNr + 3);
		const firstThursday = target.valueOf();
		target.setUTCMonth(0, 1);
		if (target.getUTCDay() !== 4) {
			target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
		}
		return 1 + Math.ceil((firstThursday - target) / 604800000);
	}
	return null;
}

function evalIsoWeekYear(operand, doc) {
	const date = evaluateExpression(operand, doc);
	if (date instanceof Date) {
		const target = new Date(date.valueOf());
		target.setUTCDate(target.getUTCDate() - ((date.getUTCDay() + 6) % 7) + 3);
		return target.getUTCFullYear();
	}
	return null;
}

function evalDateToString(operand, doc) {
	const format = operand.format ? evaluateExpression(operand.format, doc) : '%Y-%m-%dT%H:%M:%S.%LZ';
	const date = evaluateExpression(operand.date, doc);
	
	if (!(date instanceof Date)) return null;
	
	// Simple format string implementation using UTC methods
	return format
		.replace('%Y', date.getUTCFullYear())
		.replace('%m', String(date.getUTCMonth() + 1).padStart(2, '0'))
		.replace('%d', String(date.getUTCDate()).padStart(2, '0'))
		.replace('%H', String(date.getUTCHours()).padStart(2, '0'))
		.replace('%M', String(date.getUTCMinutes()).padStart(2, '0'))
		.replace('%S', String(date.getUTCSeconds()).padStart(2, '0'))
		.replace('%L', String(date.getUTCMilliseconds()).padStart(3, '0'));
}

function evalToDate(operand, doc) {
	const val = evaluateExpression(operand, doc);
	if (val instanceof Date) return val;
	if (typeof val === 'string' || typeof val === 'number') {
		const date = new Date(val);
		return isNaN(date.getTime()) ? null : date;
	}
	return null;
}

// ============================================================================
// ARRAY OPERATORS
// ============================================================================

function evalArrayElemAt(operands, doc) {
	if (!Array.isArray(operands) || operands.length !== 2) return null;
	const arr = evaluateExpression(operands[0], doc);
	const idx = evaluateExpression(operands[1], doc);
	
	if (!Array.isArray(arr) || typeof idx !== 'number') return null;
	
	const index = idx < 0 ? arr.length + idx : idx;
	return arr[index];
}

function evalConcatArrays(operands, doc) {
	if (!Array.isArray(operands)) return null;
	const result = [];
	for (const operand of operands) {
		const arr = evaluateExpression(operand, doc);
		if (Array.isArray(arr)) {
			result.push(...arr);
		}
	}
	return result;
}

function evalFilter(operand, doc) {
	const input = evaluateExpression(operand.input, doc);
	const asVar = operand.as || 'this';
	const cond = operand.cond;
	
	if (!Array.isArray(input)) return null;
	
	return input.filter(item => {
		const itemDoc = { ...doc, [asVar]: item };
		return evaluateExpression(cond, itemDoc);
	});
}

function evalIn(operands, doc) {
	if (!Array.isArray(operands) || operands.length !== 2) return null;
	const value = evaluateExpression(operands[0], doc);
	const arr = evaluateExpression(operands[1], doc);
	
	if (!Array.isArray(arr)) return false;
	return arr.includes(value);
}

function evalIndexOfArray(operands, doc) {
	if (!Array.isArray(operands) || operands.length < 2) return null;
	const arr = evaluateExpression(operands[0], doc);
	const search = evaluateExpression(operands[1], doc);
	const start = operands[2] !== undefined ? evaluateExpression(operands[2], doc) : 0;
	const end = operands[3] !== undefined ? evaluateExpression(operands[3], doc) : arr.length;
	
	if (!Array.isArray(arr)) return null;
	
	for (let i = start; i < end && i < arr.length; i++) {
		if (arr[i] === search) return i;
	}
	return -1;
}

function evalIsArray(operand, doc) {
	const val = evaluateExpression(operand, doc);
	return Array.isArray(val);
}

function evalMap(operand, doc) {
	const input = evaluateExpression(operand.input, doc);
	const asVar = operand.as || 'this';
	const inExpr = operand.in;
	
	if (!Array.isArray(input)) return null;
	
	return input.map(item => {
		const itemDoc = { ...doc, [asVar]: item };
		return evaluateExpression(inExpr, itemDoc);
	});
}

function evalReduce(operand, doc) {
	const input = evaluateExpression(operand.input, doc);
	const initialValue = evaluateExpression(operand.initialValue, doc);
	const inExpr = operand.in;
	
	if (!Array.isArray(input)) return null;
	
	let value = initialValue;
	for (const item of input) {
		const itemDoc = { ...doc, value, this: item };
		value = evaluateExpression(inExpr, itemDoc);
	}
	return value;
}

function evalSize(operand, doc) {
	const arr = evaluateExpression(operand, doc);
	return Array.isArray(arr) ? arr.length : null;
}

function evalSlice(operands, doc) {
	if (!Array.isArray(operands) || operands.length < 2) return null;
	const arr = evaluateExpression(operands[0], doc);
	
	if (!Array.isArray(arr)) return null;
	
	if (operands.length === 2) {
		const n = evaluateExpression(operands[1], doc);
		return n >= 0 ? arr.slice(0, n) : arr.slice(n);
	} else {
		const position = evaluateExpression(operands[1], doc);
		const n = evaluateExpression(operands[2], doc);
		return arr.slice(position, position + n);
	}
}

function evalReverseArray(operand, doc) {
	const arr = evaluateExpression(operand, doc);
	return Array.isArray(arr) ? arr.slice().reverse() : null;
}

function evalZip(operand, doc) {
	const inputs = operand.inputs ? evaluateExpression(operand.inputs, doc) : null;
	const useLongestLength = operand.useLongestLength || false;
	const defaults = operand.defaults;
	
	if (!Array.isArray(inputs)) return null;
	
	const arrays = inputs.map(input => evaluateExpression(input, doc));
	if (!arrays.every(arr => Array.isArray(arr))) return null;
	
	const maxLength = Math.max(...arrays.map(arr => arr.length));
	const length = useLongestLength ? maxLength : Math.min(...arrays.map(arr => arr.length));
	
	const result = [];
	for (let i = 0; i < length; i++) {
		const tuple = [];
		for (let j = 0; j < arrays.length; j++) {
			if (i < arrays[j].length) {
				tuple.push(arrays[j][i]);
			} else if (defaults && j < defaults.length) {
				tuple.push(defaults[j]);
			} else {
				tuple.push(null);
			}
		}
		result.push(tuple);
	}
	return result;
}

// ============================================================================
// TYPE OPERATORS
// ============================================================================

function evalType(operand, doc) {
	const val = evaluateExpression(operand, doc);
	
	if (val === null) return 'null';
	if (val === undefined) return 'missing';
	if (typeof val === 'boolean') return 'bool';
	if (typeof val === 'number') return Number.isInteger(val) ? 'int' : 'double';
	if (typeof val === 'string') return 'string';
	if (val instanceof Date) return 'date';
	if (Array.isArray(val)) return 'array';
	if (typeof val === 'object') return 'object';
	
	return 'unknown';
}

function evalConvert(operand, doc) {
	const input = evaluateExpression(operand.input, doc);
	const to = operand.to;
	const onError = operand.onError;
	const onNull = operand.onNull;
	
	if (input === null) {
		return onNull !== undefined ? evaluateExpression(onNull, doc) : null;
	}
	
	try {
		switch (to) {
			case 'double':
			case 'decimal':
				return parseFloat(input);
			case 'int':
			case 'long':
				return parseInt(input);
			case 'bool':
				return Boolean(input);
			case 'string':
				return String(input);
			case 'date':
				return new Date(input);
			default:
				return input;
		}
	} catch (e) {
		return onError !== undefined ? evaluateExpression(onError, doc) : null;
	}
}

function evalToBool(operand, doc) {
	const val = evaluateExpression(operand, doc);
	return Boolean(val);
}

function evalToDecimal(operand, doc) {
	const val = evaluateExpression(operand, doc);
	return parseFloat(val);
}

function evalToDouble(operand, doc) {
	const val = evaluateExpression(operand, doc);
	return parseFloat(val);
}

function evalToInt(operand, doc) {
	const val = evaluateExpression(operand, doc);
	return parseInt(val);
}

function evalToLong(operand, doc) {
	const val = evaluateExpression(operand, doc);
	return parseInt(val);
}

function evalToString(operand, doc) {
	const val = evaluateExpression(operand, doc);
	if (val === null || val === undefined) return null;
	return String(val);
}

// ============================================================================
// OBJECT OPERATORS
// ============================================================================

function evalObjectToArray(operand, doc) {
	const obj = evaluateExpression(operand, doc);
	if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
		return null;
	}
	
	return Object.keys(obj).map(key => ({ k: key, v: obj[key] }));
}

function evalArrayToObject(operand, doc) {
	const arr = evaluateExpression(operand, doc);
	if (!Array.isArray(arr)) return null;
	
	const result = {};
	for (const item of arr) {
		if (Array.isArray(item) && item.length === 2) {
			result[item[0]] = item[1];
		} else if (typeof item === 'object' && item.k !== undefined && item.v !== undefined) {
			result[item.k] = item.v;
		}
	}
	return result;
}

function evalMergeObjects(operands, doc) {
	if (!Array.isArray(operands)) {
		// Single object
		return evaluateExpression(operands, doc);
	}
	
	const result = {};
	for (const operand of operands) {
		const obj = evaluateExpression(operand, doc);
		if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
			Object.assign(result, obj);
		}
	}
	return result;
}
