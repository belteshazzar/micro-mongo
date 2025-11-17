/**
 * MicroMongoDB - Lightweight MongoDB-compatible database
 */

// Export classes
export { MongoClient } from './src/MongoClient.js';
export { ObjectId } from './src/ObjectId.js';
export { IndexedDbStorageEngine } from './src/IndexedDbStorageEngine.js';
export { StorageEngine } from './src/StorageEngine.js';
export { ChangeStream } from './src/ChangeStream.js';

// Export error classes and codes
export { 
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
} from './src/errors.js';

