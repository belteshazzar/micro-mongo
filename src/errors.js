/**
 * MongoDB Error Classes
 * 
 * Structured error hierarchy compatible with MongoDB driver
 */

/**
 * Error codes matching MongoDB error codes
 */
export const ErrorCodes = {
	// General errors
	OK: 0,
	INTERNAL_ERROR: 1,
	BAD_VALUE: 2,
	NO_SUCH_KEY: 4,
	GRAPH_CONTAINS_CYCLE: 5,
	HOST_UNREACHABLE: 6,
	HOST_NOT_FOUND: 7,
	UNKNOWN_ERROR: 8,
	FAILED_TO_PARSE: 17287, // Using test-compatible error code
	CANNOT_MUTATE_OBJECT: 10,
	USER_NOT_FOUND: 11,
	UNSUPPORTED_FORMAT: 12,
	UNAUTHORIZED: 13,
	TYPE_MISMATCH: 14,
	OVERFLOW: 15,
	INVALID_LENGTH: 16,
	PROTOCOL_ERROR: 17,
	AUTHENTICATION_FAILED: 18,
	ILLEGAL_OPERATION: 20,
	NAMESPACE_NOT_FOUND: 26,
	INDEX_NOT_FOUND: 27,
	PATH_NOT_VIABLE: 28,
	CANNOT_CREATE_INDEX: 67,
	INDEX_ALREADY_EXISTS: 68,
	INDEX_EXISTS: 68,
	COMMAND_NOT_FOUND: 59,
	NAMESPACE_EXISTS: 48,
	INVALID_NAMESPACE: 73,
	INDEX_OPTIONS_CONFLICT: 85,
	INVALID_INDEX_SPECIFICATION_OPTION: 197,
	
	// Write errors
	WRITE_CONFLICT: 112,
	DUPLICATE_KEY: 11000,
	DUPLICATE_KEY_UPDATE: 11001,
	
	// Validation errors
	DOCUMENT_VALIDATION_FAILURE: 121,
	
	// Query errors
	BAD_QUERY: 2,
	CANNOT_INDEX_PARALLEL_ARRAYS: 171,
	
	// Cursor errors
	CURSOR_NOT_FOUND: 43,
	
	// Collection errors
	COLLECTION_IS_EMPTY: 26,
	
	// Not implemented (custom code)
	NOT_IMPLEMENTED: 999,
	OPERATION_NOT_SUPPORTED: 998
};

/**
 * Base class for all MongoDB errors
 */
export class MongoError extends Error {
	constructor(message, options = {}) {
		super(message);
		this.name = 'MongoError';
		this.code = options.code || ErrorCodes.UNKNOWN_ERROR;
		this.codeName = this._getCodeName(this.code);
		
		// Backward compatibility: add $err property matching old error format
		this.$err = message;
		
		// Additional context
		if (options.collection) this.collection = options.collection;
		if (options.database) this.database = options.database;
		if (options.operation) this.operation = options.operation;
		if (options.query) this.query = options.query;
		if (options.document) this.document = options.document;
		if (options.field) this.field = options.field;
		if (options.index) this.index = options.index;
		
		// Capture stack trace
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
	
	_getCodeName(code) {
		const codeToName = {
			0: 'OK',
			1: 'InternalError',
			2: 'BadValue',
			4: 'NoSuchKey',
			5: 'GraphContainsCycle',
			6: 'HostUnreachable',
			7: 'HostNotFound',
			8: 'UnknownError',
			10: 'CannotMutateObject',
			11: 'UserNotFound',
			12: 'UnsupportedFormat',
			13: 'Unauthorized',
			14: 'TypeMismatch',
			15: 'Overflow',
			16: 'InvalidLength',
			17: 'ProtocolError',
			18: 'AuthenticationFailed',
			20: 'IllegalOperation',
			26: 'NamespaceNotFound',
			27: 'IndexNotFound',
			28: 'PathNotViable',
			43: 'CursorNotFound',
			48: 'NamespaceExists',
			59: 'CommandNotFound',
			67: 'CannotCreateIndex',
			68: 'IndexExists',
			73: 'InvalidNamespace',
			85: 'IndexOptionsConflict',
			112: 'WriteConflict',
			121: 'DocumentValidationFailure',
			171: 'CannotIndexParallelArrays',
			197: 'InvalidIndexSpecificationOption',
			998: 'OperationNotSupported',
			999: 'NotImplemented',
			11000: 'DuplicateKey',
			11001: 'DuplicateKeyUpdate',
			17287: 'FailedToParse'
		};
		return codeToName[code] || 'UnknownError';
	}
	
	toJSON() {
		const json = {
			name: this.name,
			message: this.message,
			code: this.code,
			codeName: this.codeName
		};
		
		// Include all enumerable properties
		if (this.collection) json.collection = this.collection;
		if (this.database) json.database = this.database;
		if (this.operation) json.operation = this.operation;
		if (this.index) json.index = this.index;
		if (this.indexName) json.indexName = this.indexName;
		if (this.field) json.field = this.field;
		if (this.query) json.query = this.query;
		if (this.document) json.document = this.document;
		if (this.namespace) json.namespace = this.namespace;
		if (this.cursorId) json.cursorId = this.cursorId;
		if (this.feature) json.feature = this.feature;
		if (this.keyPattern) json.keyPattern = this.keyPattern;
		if (this.keyValue) json.keyValue = this.keyValue;
		if (this.writeErrors) json.writeErrors = this.writeErrors;
		
		return json;
	}
}

/**
 * Server-side errors
 */
export class MongoServerError extends MongoError {
	constructor(message, options = {}) {
		super(message, options);
		this.name = 'MongoServerError';
	}
}

/**
 * Driver-side errors (client errors)
 */
export class MongoDriverError extends MongoError {
	constructor(message, options = {}) {
		super(message, options);
		this.name = 'MongoDriverError';
		this.code = options.code || ErrorCodes.INTERNAL_ERROR;
	}
}

/**
 * Write operation errors
 */
export class WriteError extends MongoError {
	constructor(message, options = {}) {
		super(message, options);
		this.name = 'WriteError';
		this.code = options.code || ErrorCodes.WRITE_CONFLICT;
	}
}

/**
 * Duplicate key error
 */
export class DuplicateKeyError extends WriteError {
	constructor(key, options = {}) {
		const keyStr = JSON.stringify(key);
		const message = `E11000 duplicate key error${options.collection ? ` collection: ${options.collection}` : ''} index: ${keyStr} dup key: ${keyStr}`;
		super(message, { ...options, code: ErrorCodes.DUPLICATE_KEY });
		this.name = 'DuplicateKeyError';
		this.keyPattern = key;
		this.keyValue = options.keyValue || key;
	}
}

/**
 * Document validation errors
 */
export class ValidationError extends MongoError {
	constructor(message, options = {}) {
		super(message, options);
		this.name = 'ValidationError';
		this.code = options.code || ErrorCodes.DOCUMENT_VALIDATION_FAILURE;
		this.validationErrors = options.validationErrors || [];
	}
}

/**
 * Index-related errors
 */
export class IndexError extends MongoError {
	constructor(message, options = {}) {
		super(message, options);
		this.name = 'IndexError';
	}
}

/**
 * Index already exists error
 */
export class IndexExistsError extends IndexError {
	constructor(indexName, options = {}) {
		super(`Index with name '${indexName}' already exists`, {
			...options,
			code: ErrorCodes.INDEX_EXISTS
		});
		this.name = 'IndexExistsError';
		this.indexName = indexName;
	}
}

/**
 * Index not found error
 */
export class IndexNotFoundError extends IndexError {
	constructor(indexName, options = {}) {
		super(`Index '${indexName}' not found`, {
			...options,
			code: ErrorCodes.INDEX_NOT_FOUND,
			index: indexName
		});
		this.name = 'IndexNotFoundError';
		this.indexName = indexName;
	}
}

/**
 * Cannot create index error
 */
export class CannotCreateIndexError extends IndexError {
	constructor(reason, options = {}) {
		super(`Cannot create index: ${reason}`, {
			...options,
			code: ErrorCodes.CANNOT_CREATE_INDEX
		});
		this.name = 'CannotCreateIndexError';
	}
}

/**
 * Query errors
 */
export class QueryError extends MongoError {
	constructor(message, options = {}) {
		super(message, options);
		this.name = 'QueryError';
		this.code = options.code || ErrorCodes.BAD_QUERY;
	}
}

/**
 * Type mismatch error
 */
export class TypeMismatchError extends MongoError {
	constructor(field, expectedType, actualType, options = {}) {
		super(
			`Type mismatch for field '${field}': expected ${expectedType}, got ${actualType}`,
			{ ...options, code: ErrorCodes.TYPE_MISMATCH, field }
		);
		this.name = 'TypeMismatchError';
		this.expectedType = expectedType;
		this.actualType = actualType;
	}
}

/**
 * Namespace errors
 */
export class NamespaceError extends MongoError {
	constructor(message, options = {}) {
		super(message, options);
		this.name = 'NamespaceError';
	}
}

/**
 * Namespace not found
 */
export class NamespaceNotFoundError extends NamespaceError {
	constructor(namespace, options = {}) {
		super(`Namespace '${namespace}' not found`, {
			...options,
			code: ErrorCodes.NAMESPACE_NOT_FOUND
		});
		this.name = 'NamespaceNotFoundError';
		this.namespace = namespace;
	}
}

/**
 * Invalid namespace
 */
export class InvalidNamespaceError extends NamespaceError {
	constructor(namespace, reason, options = {}) {
		// Handle case where reason is actually options
		if (typeof reason === 'object' && !options) {
			options = reason;
			reason = undefined;
		}
		const msg = reason ? `Invalid namespace '${namespace}': ${reason}` : `Invalid namespace '${namespace}'`;
		super(msg, {
			...options,
			code: ErrorCodes.INVALID_NAMESPACE
		});
		this.name = 'InvalidNamespaceError';
		this.namespace = namespace;
	}
}

/**
 * Cursor errors
 */
export class CursorError extends MongoError {
	constructor(message, options = {}) {
		super(message, options);
		this.name = 'CursorError';
	}
}

/**
 * Cursor not found
 */
export class CursorNotFoundError extends CursorError {
	constructor(cursorId, options = {}) {
		super(`Cursor ${cursorId} not found`, {
			...options,
			code: ErrorCodes.CURSOR_NOT_FOUND
		});
		this.name = 'CursorNotFoundError';
		this.cursorId = cursorId;
	}
}

/**
 * Not implemented error
 */
export class NotImplementedError extends MongoError {
	constructor(feature, options = {}) {
		super(`${feature} is not implemented in micro-mongo`, {
			...options,
			code: ErrorCodes.NOT_IMPLEMENTED
		});
		this.name = 'NotImplementedError';
		this.feature = feature;
	}
}

/**
 * Operation not supported
 */
export class OperationNotSupportedError extends MongoError {
	constructor(operation, reason, options = {}) {
		// Handle case where reason is actually options
		if (typeof reason === 'object' && !options) {
			options = reason;
			reason = undefined;
		}
		const msg = reason ? `Operation '${operation}' is not supported: ${reason}` : `Operation '${operation}' is not supported`;
		super(msg, {
			...options,
			code: ErrorCodes.OPERATION_NOT_SUPPORTED,
			operation
		});
		this.name = 'OperationNotSupportedError';
	}
}

/**
 * Bad value error
 */
export class BadValueError extends MongoError {
	constructor(field, value, reason, options = {}) {
		super(`Bad value for field '${field}': ${reason}`, {
			...options,
			code: ErrorCodes.BAD_VALUE,
			field
		});
		this.name = 'BadValueError';
		this.value = value;
	}
}

/**
 * Bulk write error
 */
export class BulkWriteError extends MongoError {
	constructor(writeErrors = [], options = {}) {
		const message = `Bulk write operation error: ${writeErrors.length} error(s)`;
		super(message, options);
		this.name = 'BulkWriteError';
		this.writeErrors = writeErrors;
		this.code = options.code || ErrorCodes.WRITE_CONFLICT;
	}
}

/**
 * Network error (for API compatibility, not functional in micro-mongo)
 */
export class MongoNetworkError extends MongoError {
	constructor(message, options = {}) {
		super(message, options);
		this.name = 'MongoNetworkError';
		this.code = options.code || ErrorCodes.HOST_UNREACHABLE;
	}
}

/**
 * Helper function to create appropriate error
 */
export function createError(type, ...args) {
	switch (type) {
		case 'duplicate_key':
			return new DuplicateKeyError(...args);
		case 'validation':
			return new ValidationError(...args);
		case 'index_exists':
			return new IndexExistsError(...args);
		case 'index_not_found':
			return new IndexNotFoundError(...args);
		case 'cannot_create_index':
			return new CannotCreateIndexError(...args);
		case 'query':
			return new QueryError(...args);
		case 'type_mismatch':
			return new TypeMismatchError(...args);
		case 'namespace_not_found':
			return new NamespaceNotFoundError(...args);
		case 'invalid_namespace':
			return new InvalidNamespaceError(...args);
		case 'cursor_not_found':
			return new CursorNotFoundError(...args);
		case 'not_implemented':
			return new NotImplementedError(...args);
		case 'operation_not_supported':
			return new OperationNotSupportedError(...args);
		case 'bad_value':
			return new BadValueError(...args);
		case 'write':
			return new WriteError(...args);
		default:
			return new MongoError(...args);
	}
}
