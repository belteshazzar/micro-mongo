/**
 * MicroMongoDB - Lightweight MongoDB-compatible database
 */

// Export classes
export { MongoClient } from './src/client/MongoClient.js';
export { ObjectId } from 'bjson';
export { ChangeStream } from './src/server/ChangeStream.js';
export { WorkerBridge } from './src/client/WorkerBridge.js';

// Export performance timing utilities
export { PerformanceTimer, globalTimer } from './src/PerformanceTimer.js';

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

