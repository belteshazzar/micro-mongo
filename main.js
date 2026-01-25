/**
 * MicroMongoDB - Lightweight MongoDB-compatible database
 */

// Export classes
export { MongoClient } from './src/client/MongoClient.js';
export { ObjectId } from '@belteshazzar/binjson';
export { ChangeStream } from './src/server/ChangeStream.js';
export { WorkerBridge } from './src/client/WorkerBridge.js';

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

