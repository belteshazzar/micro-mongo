import { strict as assert } from 'assert';
import {
	ErrorCodes,
	MongoError,
	MongoServerError,
	MongoDriverError,
	WriteError,
	DuplicateKeyError,
	ValidationError,
	IndexError,
	IndexExistsError,
	IndexNotFoundError,
	CannotCreateIndexError,
	QueryError,
	TypeMismatchError,
	NamespaceError,
	NamespaceNotFoundError,
	InvalidNamespaceError,
	CursorError,
	CursorNotFoundError,
	NotImplementedError,
	OperationNotSupportedError,
	BadValueError,
	BulkWriteError,
	MongoNetworkError
} from '../src/errors.js';

describe('Error Classes', function() {
	describe('ErrorCodes', function() {
		it('should have MongoDB-compatible error codes', function() {
			assert.strictEqual(ErrorCodes.OK, 0);
			assert.strictEqual(ErrorCodes.BAD_VALUE, 2);
			assert.strictEqual(ErrorCodes.INDEX_NOT_FOUND, 27);
			assert.strictEqual(ErrorCodes.CURSOR_NOT_FOUND, 43);
			assert.strictEqual(ErrorCodes.CANNOT_CREATE_INDEX, 67);
			assert.strictEqual(ErrorCodes.INDEX_EXISTS, 68);
			assert.strictEqual(ErrorCodes.INDEX_OPTIONS_CONFLICT, 85);
			assert.strictEqual(ErrorCodes.DOCUMENT_VALIDATION_FAILURE, 121);
			assert.strictEqual(ErrorCodes.DUPLICATE_KEY, 11000);
			assert.strictEqual(ErrorCodes.NOT_IMPLEMENTED, 999);
			assert.strictEqual(ErrorCodes.OPERATION_NOT_SUPPORTED, 998);
		});
	});

	describe('MongoError', function() {
		it('should create basic error with message', function() {
			const error = new MongoError('Test error message');
			assert.strictEqual(error.message, 'Test error message');
			assert.strictEqual(error.name, 'MongoError');
			assert(error instanceof Error);
		});

		it('should include error code and codeName', function() {
			const error = new MongoError('Test error', { code: 27 });
			assert.strictEqual(error.code, 27);
			assert.strictEqual(error.codeName, 'IndexNotFound');
		});

		it('should include context information', function() {
			const error = new MongoError('Test error', { 
				collection: 'users',
				database: 'test',
				operation: 'find'
			});
			assert.strictEqual(error.collection, 'users');
			assert.strictEqual(error.database, 'test');
			assert.strictEqual(error.operation, 'find');
		});

		it('should serialize to JSON', function() {
			const error = new MongoError('Test error', { 
				code: 27,
				collection: 'users'
			});
			const json = error.toJSON();
			assert.strictEqual(json.name, 'MongoError');
			assert.strictEqual(json.message, 'Test error');
			assert.strictEqual(json.code, 27);
			assert.strictEqual(json.codeName, 'IndexNotFound');
			assert.strictEqual(json.collection, 'users');
		});
	});

	describe('MongoServerError', function() {
		it('should extend MongoError', function() {
			const error = new MongoServerError('Server error');
			assert(error instanceof MongoError);
			assert(error instanceof MongoServerError);
			assert.strictEqual(error.name, 'MongoServerError');
		});
	});

	describe('MongoDriverError', function() {
		it('should extend MongoError', function() {
			const error = new MongoDriverError('Driver error');
			assert(error instanceof MongoError);
			assert(error instanceof MongoDriverError);
			assert.strictEqual(error.name, 'MongoDriverError');
		});
	});

	describe('WriteError', function() {
		it('should create write error with details', function() {
			const error = new WriteError('Write failed', { 
				operation: 'insert',
				document: { _id: 1 }
			});
			assert(error instanceof MongoError);
			assert.strictEqual(error.name, 'WriteError');
			assert.strictEqual(error.operation, 'insert');
			assert.deepStrictEqual(error.document, { _id: 1 });
		});
	});

	describe('DuplicateKeyError', function() {
		it('should create duplicate key error', function() {
			const error = new DuplicateKeyError({ email: 'test@example.com' }, {
				collection: 'users'
			});
			assert(error instanceof WriteError);
			assert.strictEqual(error.name, 'DuplicateKeyError');
			assert.strictEqual(error.code, ErrorCodes.DUPLICATE_KEY);
			assert(error.message.includes('test@example.com'));
		});
	});

	describe('ValidationError', function() {
		it('should create validation error', function() {
			const error = new ValidationError('age must be positive', {
				field: 'age',
				document: { age: -5 }
			});
			assert(error instanceof MongoError);
			assert.strictEqual(error.name, 'ValidationError');
			assert.strictEqual(error.code, ErrorCodes.DOCUMENT_VALIDATION_FAILURE);
			assert.strictEqual(error.field, 'age');
		});
	});

	describe('IndexError', function() {
		it('should create index error', function() {
			const error = new IndexError('Index error message', {
				index: 'email_1',
				collection: 'users'
			});
			assert(error instanceof MongoError);
			assert.strictEqual(error.name, 'IndexError');
			assert.strictEqual(error.index, 'email_1');
		});
	});

	describe('IndexExistsError', function() {
		it('should create index exists error', function() {
			const error = new IndexExistsError('email_1', {
				collection: 'users'
			});
			assert(error instanceof IndexError);
			assert.strictEqual(error.name, 'IndexExistsError');
			assert.strictEqual(error.code, ErrorCodes.INDEX_EXISTS);
			assert(error.message.includes('email_1'));
		});
	});

	describe('IndexNotFoundError', function() {
		it('should create index not found error', function() {
			const error = new IndexNotFoundError('missing_index', {
				collection: 'users'
			});
			assert(error instanceof IndexError);
			assert.strictEqual(error.name, 'IndexNotFoundError');
			assert.strictEqual(error.code, ErrorCodes.INDEX_NOT_FOUND);
			assert(error.message.includes('missing_index'));
		});
	});

	describe('CannotCreateIndexError', function() {
		it('should create cannot create index error', function() {
			const error = new CannotCreateIndexError('Reason for failure', {
				index: 'test_index',
				collection: 'users'
			});
			assert(error instanceof IndexError);
			assert.strictEqual(error.name, 'CannotCreateIndexError');
			assert.strictEqual(error.code, ErrorCodes.CANNOT_CREATE_INDEX);
		});
	});

	describe('QueryError', function() {
		it('should create query error', function() {
			const error = new QueryError('Invalid query', {
				query: { $invalid: true },
				collection: 'users'
			});
			assert(error instanceof MongoError);
			assert.strictEqual(error.name, 'QueryError');
			assert.deepStrictEqual(error.query, { $invalid: true });
		});
	});

	describe('TypeMismatchError', function() {
		it('should create type mismatch error', function() {
			const error = new TypeMismatchError('age', 'number', 'string', {
				field: 'age'
			});
			assert(error instanceof MongoError);
			assert.strictEqual(error.name, 'TypeMismatchError');
			assert.strictEqual(error.code, ErrorCodes.TYPE_MISMATCH);
			assert(error.message.includes('age'));
			assert(error.message.includes('number'));
			assert(error.message.includes('string'));
		});
	});

	describe('NamespaceError', function() {
		it('should create namespace error', function() {
			const error = new NamespaceError('Invalid namespace', {
				database: 'test',
				collection: 'users'
			});
			assert(error instanceof MongoError);
			assert.strictEqual(error.name, 'NamespaceError');
		});
	});

	describe('NamespaceNotFoundError', function() {
		it('should create namespace not found error', function() {
			const error = new NamespaceNotFoundError('test.missing');
			assert(error instanceof NamespaceError);
			assert.strictEqual(error.name, 'NamespaceNotFoundError');
			assert.strictEqual(error.code, ErrorCodes.NAMESPACE_NOT_FOUND);
			assert(error.message.includes('test.missing'));
		});
	});

	describe('InvalidNamespaceError', function() {
		it('should create invalid namespace error', function() {
			const error = new InvalidNamespaceError('invalid..namespace');
			assert(error instanceof NamespaceError);
			assert.strictEqual(error.name, 'InvalidNamespaceError');
			assert.strictEqual(error.code, ErrorCodes.INVALID_NAMESPACE);
		});
	});

	describe('CursorError', function() {
		it('should create cursor error', function() {
			const error = new CursorError('Cursor error message');
			assert(error instanceof MongoError);
			assert.strictEqual(error.name, 'CursorError');
		});
	});

	describe('CursorNotFoundError', function() {
		it('should create cursor not found error', function() {
			const error = new CursorNotFoundError(12345);
			assert(error instanceof CursorError);
			assert.strictEqual(error.name, 'CursorNotFoundError');
			assert.strictEqual(error.code, ErrorCodes.CURSOR_NOT_FOUND);
			assert(error.message.includes('12345'));
		});
	});

	describe('NotImplementedError', function() {
		it('should create not implemented error', function() {
			const error = new NotImplementedError('mapReduce', {
				collection: 'users'
			});
			assert(error instanceof MongoError);
			assert.strictEqual(error.name, 'NotImplementedError');
			assert.strictEqual(error.code, ErrorCodes.NOT_IMPLEMENTED);
			assert(error.message.includes('mapReduce'));
			assert(error.message.includes('not implemented'));
		});
	});

	describe('OperationNotSupportedError', function() {
		it('should create operation not supported error', function() {
			const error = new OperationNotSupportedError('$geoNear', {
				operation: 'aggregate'
			});
			assert(error instanceof MongoError);
			assert.strictEqual(error.name, 'OperationNotSupportedError');
			assert.strictEqual(error.code, ErrorCodes.OPERATION_NOT_SUPPORTED);
			assert(error.message.includes('$geoNear'));
		});
	});

	describe('BadValueError', function() {
		it('should create bad value error', function() {
			const error = new BadValueError('limit', -1, 'Limit must be positive');
			assert(error instanceof MongoError);
			assert.strictEqual(error.name, 'BadValueError');
			assert.strictEqual(error.code, ErrorCodes.BAD_VALUE);
			assert(error.message.includes('limit'));
			assert(error.message.includes('positive'));
		});
	});

	describe('BulkWriteError', function() {
		it('should create bulk write error', function() {
			const writeErrors = [
				{ index: 0, code: 11000, errmsg: 'Duplicate key' }
			];
			const error = new BulkWriteError(writeErrors, {
				collection: 'users'
			});
			assert(error instanceof MongoError);
			assert.strictEqual(error.name, 'BulkWriteError');
			assert.deepStrictEqual(error.writeErrors, writeErrors);
		});
	});

	describe('MongoNetworkError', function() {
		it('should create network error', function() {
			const error = new MongoNetworkError('Connection timeout');
			assert(error instanceof MongoError);
			assert.strictEqual(error.name, 'MongoNetworkError');
		});
	});

	describe('Error context and debugging', function() {
		it('should include stack trace', function() {
			const error = new MongoError('Test error');
			assert(error.stack);
			assert(error.stack.includes('MongoError'));
		});

		it('should preserve context through serialization', function() {
			const error = new IndexNotFoundError('test_index', {
				collection: 'users',
				database: 'mydb',
				operation: 'dropIndex'
			});
			const json = error.toJSON();
			assert.strictEqual(json.collection, 'users');
			assert.strictEqual(json.database, 'mydb');
			assert.strictEqual(json.operation, 'dropIndex');
			assert.strictEqual(json.index, 'test_index');
		});

		it('should work with instanceof checks', function() {
			const error = new DuplicateKeyError({ _id: 1 });
			assert(error instanceof Error);
			assert(error instanceof MongoError);
			assert(error instanceof WriteError);
			assert(error instanceof DuplicateKeyError);
		});
	});
});
