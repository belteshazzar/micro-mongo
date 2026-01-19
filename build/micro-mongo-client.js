var events = { exports: {} };
var hasRequiredEvents;
function requireEvents() {
  if (hasRequiredEvents) return events.exports;
  hasRequiredEvents = 1;
  var R = typeof Reflect === "object" ? Reflect : null;
  var ReflectApply = R && typeof R.apply === "function" ? R.apply : function ReflectApply2(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  };
  var ReflectOwnKeys;
  if (R && typeof R.ownKeys === "function") {
    ReflectOwnKeys = R.ownKeys;
  } else if (Object.getOwnPropertySymbols) {
    ReflectOwnKeys = function ReflectOwnKeys2(target) {
      return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));
    };
  } else {
    ReflectOwnKeys = function ReflectOwnKeys2(target) {
      return Object.getOwnPropertyNames(target);
    };
  }
  function ProcessEmitWarning(warning) {
    if (console && console.warn) console.warn(warning);
  }
  var NumberIsNaN = Number.isNaN || function NumberIsNaN2(value) {
    return value !== value;
  };
  function EventEmitter() {
    EventEmitter.init.call(this);
  }
  events.exports = EventEmitter;
  events.exports.once = once;
  EventEmitter.EventEmitter = EventEmitter;
  EventEmitter.prototype._events = void 0;
  EventEmitter.prototype._eventsCount = 0;
  EventEmitter.prototype._maxListeners = void 0;
  var defaultMaxListeners = 10;
  function checkListener(listener) {
    if (typeof listener !== "function") {
      throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
    }
  }
  Object.defineProperty(EventEmitter, "defaultMaxListeners", {
    enumerable: true,
    get: function() {
      return defaultMaxListeners;
    },
    set: function(arg) {
      if (typeof arg !== "number" || arg < 0 || NumberIsNaN(arg)) {
        throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + ".");
      }
      defaultMaxListeners = arg;
    }
  });
  EventEmitter.init = function() {
    if (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) {
      this._events = /* @__PURE__ */ Object.create(null);
      this._eventsCount = 0;
    }
    this._maxListeners = this._maxListeners || void 0;
  };
  EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
    if (typeof n !== "number" || n < 0 || NumberIsNaN(n)) {
      throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + ".");
    }
    this._maxListeners = n;
    return this;
  };
  function _getMaxListeners(that) {
    if (that._maxListeners === void 0)
      return EventEmitter.defaultMaxListeners;
    return that._maxListeners;
  }
  EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
    return _getMaxListeners(this);
  };
  EventEmitter.prototype.emit = function emit(type) {
    var args = [];
    for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
    var doError = type === "error";
    var events2 = this._events;
    if (events2 !== void 0)
      doError = doError && events2.error === void 0;
    else if (!doError)
      return false;
    if (doError) {
      var er;
      if (args.length > 0)
        er = args[0];
      if (er instanceof Error) {
        throw er;
      }
      var err = new Error("Unhandled error." + (er ? " (" + er.message + ")" : ""));
      err.context = er;
      throw err;
    }
    var handler = events2[type];
    if (handler === void 0)
      return false;
    if (typeof handler === "function") {
      ReflectApply(handler, this, args);
    } else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        ReflectApply(listeners[i], this, args);
    }
    return true;
  };
  function _addListener(target, type, listener, prepend) {
    var m;
    var events2;
    var existing;
    checkListener(listener);
    events2 = target._events;
    if (events2 === void 0) {
      events2 = target._events = /* @__PURE__ */ Object.create(null);
      target._eventsCount = 0;
    } else {
      if (events2.newListener !== void 0) {
        target.emit(
          "newListener",
          type,
          listener.listener ? listener.listener : listener
        );
        events2 = target._events;
      }
      existing = events2[type];
    }
    if (existing === void 0) {
      existing = events2[type] = listener;
      ++target._eventsCount;
    } else {
      if (typeof existing === "function") {
        existing = events2[type] = prepend ? [listener, existing] : [existing, listener];
      } else if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
      m = _getMaxListeners(target);
      if (m > 0 && existing.length > m && !existing.warned) {
        existing.warned = true;
        var w = new Error("Possible EventEmitter memory leak detected. " + existing.length + " " + String(type) + " listeners added. Use emitter.setMaxListeners() to increase limit");
        w.name = "MaxListenersExceededWarning";
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        ProcessEmitWarning(w);
      }
    }
    return target;
  }
  EventEmitter.prototype.addListener = function addListener(type, listener) {
    return _addListener(this, type, listener, false);
  };
  EventEmitter.prototype.on = EventEmitter.prototype.addListener;
  EventEmitter.prototype.prependListener = function prependListener(type, listener) {
    return _addListener(this, type, listener, true);
  };
  function onceWrapper() {
    if (!this.fired) {
      this.target.removeListener(this.type, this.wrapFn);
      this.fired = true;
      if (arguments.length === 0)
        return this.listener.call(this.target);
      return this.listener.apply(this.target, arguments);
    }
  }
  function _onceWrap(target, type, listener) {
    var state = { fired: false, wrapFn: void 0, target, type, listener };
    var wrapped = onceWrapper.bind(state);
    wrapped.listener = listener;
    state.wrapFn = wrapped;
    return wrapped;
  }
  EventEmitter.prototype.once = function once2(type, listener) {
    checkListener(listener);
    this.on(type, _onceWrap(this, type, listener));
    return this;
  };
  EventEmitter.prototype.prependOnceListener = function prependOnceListener(type, listener) {
    checkListener(listener);
    this.prependListener(type, _onceWrap(this, type, listener));
    return this;
  };
  EventEmitter.prototype.removeListener = function removeListener(type, listener) {
    var list, events2, position, i, originalListener;
    checkListener(listener);
    events2 = this._events;
    if (events2 === void 0)
      return this;
    list = events2[type];
    if (list === void 0)
      return this;
    if (list === listener || list.listener === listener) {
      if (--this._eventsCount === 0)
        this._events = /* @__PURE__ */ Object.create(null);
      else {
        delete events2[type];
        if (events2.removeListener)
          this.emit("removeListener", type, list.listener || listener);
      }
    } else if (typeof list !== "function") {
      position = -1;
      for (i = list.length - 1; i >= 0; i--) {
        if (list[i] === listener || list[i].listener === listener) {
          originalListener = list[i].listener;
          position = i;
          break;
        }
      }
      if (position < 0)
        return this;
      if (position === 0)
        list.shift();
      else {
        spliceOne(list, position);
      }
      if (list.length === 1)
        events2[type] = list[0];
      if (events2.removeListener !== void 0)
        this.emit("removeListener", type, originalListener || listener);
    }
    return this;
  };
  EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
  EventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {
    var listeners, events2, i;
    events2 = this._events;
    if (events2 === void 0)
      return this;
    if (events2.removeListener === void 0) {
      if (arguments.length === 0) {
        this._events = /* @__PURE__ */ Object.create(null);
        this._eventsCount = 0;
      } else if (events2[type] !== void 0) {
        if (--this._eventsCount === 0)
          this._events = /* @__PURE__ */ Object.create(null);
        else
          delete events2[type];
      }
      return this;
    }
    if (arguments.length === 0) {
      var keys = Object.keys(events2);
      var key;
      for (i = 0; i < keys.length; ++i) {
        key = keys[i];
        if (key === "removeListener") continue;
        this.removeAllListeners(key);
      }
      this.removeAllListeners("removeListener");
      this._events = /* @__PURE__ */ Object.create(null);
      this._eventsCount = 0;
      return this;
    }
    listeners = events2[type];
    if (typeof listeners === "function") {
      this.removeListener(type, listeners);
    } else if (listeners !== void 0) {
      for (i = listeners.length - 1; i >= 0; i--) {
        this.removeListener(type, listeners[i]);
      }
    }
    return this;
  };
  function _listeners(target, type, unwrap) {
    var events2 = target._events;
    if (events2 === void 0)
      return [];
    var evlistener = events2[type];
    if (evlistener === void 0)
      return [];
    if (typeof evlistener === "function")
      return unwrap ? [evlistener.listener || evlistener] : [evlistener];
    return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
  }
  EventEmitter.prototype.listeners = function listeners(type) {
    return _listeners(this, type, true);
  };
  EventEmitter.prototype.rawListeners = function rawListeners(type) {
    return _listeners(this, type, false);
  };
  EventEmitter.listenerCount = function(emitter, type) {
    if (typeof emitter.listenerCount === "function") {
      return emitter.listenerCount(type);
    } else {
      return listenerCount.call(emitter, type);
    }
  };
  EventEmitter.prototype.listenerCount = listenerCount;
  function listenerCount(type) {
    var events2 = this._events;
    if (events2 !== void 0) {
      var evlistener = events2[type];
      if (typeof evlistener === "function") {
        return 1;
      } else if (evlistener !== void 0) {
        return evlistener.length;
      }
    }
    return 0;
  }
  EventEmitter.prototype.eventNames = function eventNames() {
    return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
  };
  function arrayClone(arr, n) {
    var copy = new Array(n);
    for (var i = 0; i < n; ++i)
      copy[i] = arr[i];
    return copy;
  }
  function spliceOne(list, index) {
    for (; index + 1 < list.length; index++)
      list[index] = list[index + 1];
    list.pop();
  }
  function unwrapListeners(arr) {
    var ret = new Array(arr.length);
    for (var i = 0; i < ret.length; ++i) {
      ret[i] = arr[i].listener || arr[i];
    }
    return ret;
  }
  function once(emitter, name) {
    return new Promise(function(resolve, reject) {
      function errorListener(err) {
        emitter.removeListener(name, resolver);
        reject(err);
      }
      function resolver() {
        if (typeof emitter.removeListener === "function") {
          emitter.removeListener("error", errorListener);
        }
        resolve([].slice.call(arguments));
      }
      eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
      if (name !== "error") {
        addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
      }
    });
  }
  function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
    if (typeof emitter.on === "function") {
      eventTargetAgnosticAddListener(emitter, "error", handler, flags);
    }
  }
  function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
    if (typeof emitter.on === "function") {
      if (flags.once) {
        emitter.once(name, listener);
      } else {
        emitter.on(name, listener);
      }
    } else if (typeof emitter.addEventListener === "function") {
      emitter.addEventListener(name, function wrapListener(arg) {
        if (flags.once) {
          emitter.removeEventListener(name, wrapListener);
        }
        listener(arg);
      });
    } else {
      throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
    }
  }
  return events.exports;
}
var eventsExports = requireEvents();
const ErrorCodes = {
  // General errors
  OK: 0,
  INTERNAL_ERROR: 1,
  BAD_VALUE: 2,
  NO_SUCH_KEY: 4,
  GRAPH_CONTAINS_CYCLE: 5,
  HOST_UNREACHABLE: 6,
  HOST_NOT_FOUND: 7,
  UNKNOWN_ERROR: 8,
  FAILED_TO_PARSE: 17287,
  // Using test-compatible error code
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
  DUPLICATE_KEY: 11e3,
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
  CANNOT_DO_EXCLUSION_ON_FIELD_ID_IN_INCLUSION_PROJECTION: 31254,
  // Not implemented (custom code)
  NOT_IMPLEMENTED: 999,
  OPERATION_NOT_SUPPORTED: 998
};
class MongoError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "MongoError";
    this.code = options.code || ErrorCodes.UNKNOWN_ERROR;
    this.codeName = this._getCodeName(this.code);
    this.$err = message;
    if (options.collection) this.collection = options.collection;
    if (options.database) this.database = options.database;
    if (options.operation) this.operation = options.operation;
    if (options.query) this.query = options.query;
    if (options.document) this.document = options.document;
    if (options.field) this.field = options.field;
    if (options.index) this.index = options.index;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  _getCodeName(code) {
    const codeToName = {
      0: "OK",
      1: "InternalError",
      2: "BadValue",
      4: "NoSuchKey",
      5: "GraphContainsCycle",
      6: "HostUnreachable",
      7: "HostNotFound",
      8: "UnknownError",
      10: "CannotMutateObject",
      11: "UserNotFound",
      12: "UnsupportedFormat",
      13: "Unauthorized",
      14: "TypeMismatch",
      15: "Overflow",
      16: "InvalidLength",
      17: "ProtocolError",
      18: "AuthenticationFailed",
      20: "IllegalOperation",
      26: "NamespaceNotFound",
      27: "IndexNotFound",
      28: "PathNotViable",
      43: "CursorNotFound",
      48: "NamespaceExists",
      59: "CommandNotFound",
      67: "CannotCreateIndex",
      68: "IndexExists",
      73: "InvalidNamespace",
      85: "IndexOptionsConflict",
      112: "WriteConflict",
      121: "DocumentValidationFailure",
      171: "CannotIndexParallelArrays",
      197: "InvalidIndexSpecificationOption",
      998: "OperationNotSupported",
      999: "NotImplemented",
      11e3: "DuplicateKey",
      11001: "DuplicateKeyUpdate",
      17287: "FailedToParse"
    };
    return codeToName[code] || "UnknownError";
  }
  toJSON() {
    const json = {
      name: this.name,
      message: this.message,
      code: this.code,
      codeName: this.codeName
    };
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
class MongoServerError extends MongoError {
  constructor(message, options = {}) {
    super(message, options);
    this.name = "MongoServerError";
  }
}
class MongoDriverError extends MongoError {
  constructor(message, options = {}) {
    super(message, options);
    this.name = "MongoDriverError";
    this.code = options.code || ErrorCodes.INTERNAL_ERROR;
  }
}
class WriteError extends MongoError {
  constructor(message, options = {}) {
    super(message, options);
    this.name = "WriteError";
    this.code = options.code || ErrorCodes.WRITE_CONFLICT;
  }
}
class DuplicateKeyError extends WriteError {
  constructor(key, options = {}) {
    const keyStr = JSON.stringify(key);
    const message = `E11000 duplicate key error${options.collection ? ` collection: ${options.collection}` : ""} index: ${keyStr} dup key: ${keyStr}`;
    super(message, { ...options, code: ErrorCodes.DUPLICATE_KEY });
    this.name = "DuplicateKeyError";
    this.keyPattern = key;
    this.keyValue = options.keyValue || key;
  }
}
class ValidationError extends MongoError {
  constructor(message, options = {}) {
    super(message, options);
    this.name = "ValidationError";
    this.code = options.code || ErrorCodes.DOCUMENT_VALIDATION_FAILURE;
    this.validationErrors = options.validationErrors || [];
  }
}
class IndexError extends MongoError {
  constructor(message, options = {}) {
    super(message, options);
    this.name = "IndexError";
  }
}
class IndexExistsError extends IndexError {
  constructor(indexName, options = {}) {
    super(`Index with name '${indexName}' already exists`, {
      ...options,
      code: ErrorCodes.INDEX_EXISTS
    });
    this.name = "IndexExistsError";
    this.indexName = indexName;
  }
}
class IndexNotFoundError extends IndexError {
  constructor(indexName, options = {}) {
    super(`Index '${indexName}' not found`, {
      ...options,
      code: ErrorCodes.INDEX_NOT_FOUND,
      index: indexName
    });
    this.name = "IndexNotFoundError";
    this.indexName = indexName;
  }
}
class CannotCreateIndexError extends IndexError {
  constructor(reason, options = {}) {
    super(`Cannot create index: ${reason}`, {
      ...options,
      code: ErrorCodes.CANNOT_CREATE_INDEX
    });
    this.name = "CannotCreateIndexError";
  }
}
class QueryError extends MongoError {
  constructor(message, options = {}) {
    super(message, options);
    this.name = "QueryError";
    this.code = options.code || ErrorCodes.BAD_QUERY;
  }
}
class TypeMismatchError extends MongoError {
  constructor(field, expectedType, actualType, options = {}) {
    super(
      `Type mismatch for field '${field}': expected ${expectedType}, got ${actualType}`,
      { ...options, code: ErrorCodes.TYPE_MISMATCH, field }
    );
    this.name = "TypeMismatchError";
    this.expectedType = expectedType;
    this.actualType = actualType;
  }
}
class NamespaceError extends MongoError {
  constructor(message, options = {}) {
    super(message, options);
    this.name = "NamespaceError";
  }
}
class NamespaceNotFoundError extends NamespaceError {
  constructor(namespace, options = {}) {
    super(`Namespace '${namespace}' not found`, {
      ...options,
      code: ErrorCodes.NAMESPACE_NOT_FOUND
    });
    this.name = "NamespaceNotFoundError";
    this.namespace = namespace;
  }
}
class InvalidNamespaceError extends NamespaceError {
  constructor(namespace, reason, options = {}) {
    if (typeof reason === "object" && !options) {
      options = reason;
      reason = void 0;
    }
    const msg = reason ? `Invalid namespace '${namespace}': ${reason}` : `Invalid namespace '${namespace}'`;
    super(msg, {
      ...options,
      code: ErrorCodes.INVALID_NAMESPACE
    });
    this.name = "InvalidNamespaceError";
    this.namespace = namespace;
  }
}
class CursorError extends MongoError {
  constructor(message, options = {}) {
    super(message, options);
    this.name = "CursorError";
  }
}
class CursorNotFoundError extends CursorError {
  constructor(cursorId, options = {}) {
    super(`Cursor ${cursorId} not found`, {
      ...options,
      code: ErrorCodes.CURSOR_NOT_FOUND
    });
    this.name = "CursorNotFoundError";
    this.cursorId = cursorId;
  }
}
class NotImplementedError extends MongoError {
  constructor(feature, options = {}) {
    super(`${feature} is not implemented in micro-mongo`, {
      ...options,
      code: ErrorCodes.NOT_IMPLEMENTED
    });
    this.name = "NotImplementedError";
    this.feature = feature;
  }
}
class OperationNotSupportedError extends MongoError {
  constructor(operation, reason, options = {}) {
    if (typeof reason === "object" && !options) {
      options = reason;
      reason = void 0;
    }
    const msg = reason ? `Operation '${operation}' is not supported: ${reason}` : `Operation '${operation}' is not supported`;
    super(msg, {
      ...options,
      code: ErrorCodes.OPERATION_NOT_SUPPORTED,
      operation
    });
    this.name = "OperationNotSupportedError";
  }
}
class BadValueError extends MongoError {
  constructor(field, value, reason, options = {}) {
    super(`Bad value for field '${field}': ${reason}`, {
      ...options,
      code: ErrorCodes.BAD_VALUE,
      field
    });
    this.name = "BadValueError";
    this.value = value;
  }
}
class BulkWriteError extends MongoError {
  constructor(writeErrors = [], options = {}) {
    const message = `Bulk write operation error: ${writeErrors.length} error(s)`;
    super(message, options);
    this.name = "BulkWriteError";
    this.writeErrors = writeErrors;
    this.code = options.code || ErrorCodes.WRITE_CONFLICT;
  }
}
class MongoNetworkError extends MongoError {
  constructor(message, options = {}) {
    super(message, options);
    this.name = "MongoNetworkError";
    this.code = options.code || ErrorCodes.HOST_UNREACHABLE;
  }
}
class ProxyChangeStream extends eventsExports.EventEmitter {
  static create({ bridge, database, collection, streamId, pipeline = [], options = {} }) {
    const stream = new ProxyChangeStream({ bridge, streamId });
    if (!streamId) {
      let target, method;
      if (database === null || database === void 0) {
        target = "client";
        method = "watch";
      } else if (collection === null || collection === void 0) {
        target = "db";
        method = "watch";
      } else {
        target = "collection";
        method = "watch";
      }
      bridge.sendRequest({
        target,
        database,
        collection,
        method,
        args: [pipeline, options]
      }).then((resp) => {
        if (resp && resp.streamId) {
          stream.streamId = resp.streamId;
        }
      }).catch(() => {
      });
    }
    return stream;
  }
  constructor({ bridge, streamId }) {
    super();
    this.bridge = bridge;
    this.streamId = streamId;
    this.closed = false;
    this._pendingNext = [];
    this._onEvent = this._onEvent.bind(this);
    this.bridge.on("event", this._onEvent);
  }
  _onEvent(eventName, payload) {
    if (eventName !== "changeStream") return;
    if (!payload || payload.streamId !== this.streamId) return;
    const { type, data } = payload;
    if (type === "change") this.emit("change", data);
    if (type === "error") this.emit("error", data);
    if (type === "close") {
      this.emit("close");
      this._cleanup();
    }
  }
  _cleanup() {
    this.bridge.off("event", this._onEvent);
  }
  async close() {
    if (this.closed) return;
    this.closed = true;
    for (const pending of this._pendingNext) {
      pending.resolve(null);
    }
    this._pendingNext = [];
    this.bridge.sendRequest({
      target: "changestream",
      streamId: this.streamId,
      method: "close"
    }).catch(() => {
    });
    this.emit("close");
    this._cleanup();
  }
  async next() {
    if (this.closed) {
      return null;
    }
    return new Promise((resolve, reject) => {
      const onChange = (change) => {
        this._removePending(pending);
        this.off("change", onChange);
        this.off("error", onError);
        this.off("close", onClose);
        resolve(change);
      };
      const onError = (error) => {
        this._removePending(pending);
        this.off("change", onChange);
        this.off("error", onError);
        this.off("close", onClose);
        reject(error);
      };
      const onClose = () => {
        this._removePending(pending);
        this.off("change", onChange);
        this.off("error", onError);
        this.off("close", onClose);
        resolve(null);
      };
      const pending = { resolve, reject };
      this._pendingNext.push(pending);
      this.on("change", onChange);
      this.on("error", onError);
      this.on("close", onClose);
    });
  }
  _removePending(pending) {
    const index = this._pendingNext.indexOf(pending);
    if (index !== -1) {
      this._pendingNext.splice(index, 1);
    }
  }
  /**
   * Async iterator support for for-await-of loops
   */
  async *[Symbol.asyncIterator]() {
    while (!this.closed) {
      const change = await this.next();
      if (change === null) {
        break;
      }
      yield change;
    }
  }
}
class ProxyCursor {
  constructor({ bridge, cursorId, batch = [], exhausted = false, batchSize = 100, requestPromise, requestPayload }) {
    this.bridge = bridge;
    this.cursorId = cursorId;
    this.buffer = Array.isArray(batch) ? batch : [];
    this.exhausted = exhausted || false;
    this._batchSize = batchSize;
    this._requestPromise = requestPromise || null;
    this._requestPayload = requestPayload || null;
    this._initialized = !requestPromise && !requestPayload;
  }
  async _ensureInitialized() {
    if (this._initialized) return;
    if (this._requestPayload) {
      const cursorOpts = {};
      if (this._limit !== void 0) cursorOpts.limit = this._limit;
      if (this._skip !== void 0) cursorOpts.skip = this._skip;
      if (this._sort !== void 0) cursorOpts.sort = this._sort;
      if (this._min !== void 0) cursorOpts.min = this._min;
      if (this._max !== void 0) cursorOpts.max = this._max;
      if (this._hint !== void 0) cursorOpts.hint = this._hint;
      if (this._comment !== void 0) cursorOpts.comment = this._comment;
      if (this._maxTimeMS !== void 0) cursorOpts.maxTimeMS = this._maxTimeMS;
      if (this._maxScan !== void 0) cursorOpts.maxScan = this._maxScan;
      if (this._returnKey !== void 0) cursorOpts.returnKey = this._returnKey;
      if (this._showRecordId !== void 0) cursorOpts.showRecordId = this._showRecordId;
      if (this._collation !== void 0) cursorOpts.collation = this._collation;
      this._requestPayload.cursorOpts = cursorOpts;
      const res = await this.bridge.sendRequest(this._requestPayload);
      this.cursorId = res.cursorId;
      this.buffer = res.batch || [];
      this.exhausted = res.exhausted || false;
      this._batchSize = res.batchSize || 100;
      this._requestPayload = null;
      this._initialized = true;
    } else if (this._requestPromise) {
      const res = await this._requestPromise;
      this.cursorId = res.cursorId;
      this.buffer = res.batch || [];
      this.exhausted = res.exhausted || false;
      this._batchSize = res.batchSize || 100;
      this._requestPromise = null;
      this._initialized = true;
    }
  }
  async hasNext() {
    if (this._closed) return false;
    await this._ensureInitialized();
    if (this.buffer.length > 0) return true;
    if (this.exhausted) return false;
    await this._getMore();
    return this.buffer.length > 0;
  }
  async next() {
    const has = await this.hasNext();
    if (!has) return null;
    return this.buffer.shift();
  }
  async toArray() {
    await this._ensureInitialized();
    const results = [...this.buffer];
    this.buffer = [];
    while (!this.exhausted) {
      await this._getMore();
      results.push(...this.buffer);
      this.buffer = [];
    }
    return results;
  }
  async count() {
    const arr = await this.toArray();
    return arr.length;
  }
  // Cursor modifiers that return this for chaining
  limit(n) {
    this._limit = n;
    return this;
  }
  skip(n) {
    this._skip = n;
    return this;
  }
  sort(spec) {
    this._sort = spec;
    return this;
  }
  batchSize(n) {
    this._batchSize = n;
    return this;
  }
  // Cursor metadata methods
  async close() {
    this._closed = true;
    await this._closeRemote();
    return false;
  }
  isClosed() {
    return this._closed || false;
  }
  comment(str) {
    this._comment = str;
    return this;
  }
  hint(spec) {
    this._hint = spec;
    return this;
  }
  explain(verbosity = "queryPlanner") {
    const result = {
      queryPlanner: {
        plannerVersion: 1,
        namespace: `unknown`,
        indexFilterSet: false,
        parsedQuery: {},
        winningPlan: {
          stage: "COLLSCAN"
        }
      },
      ok: 1
    };
    if (verbosity === "executionStats" || verbosity === "allPlansExecution") {
      result.executionStats = {
        executionSuccess: true,
        nReturned: 0,
        executionTimeMillis: 0
      };
    }
    return result;
  }
  async itcount() {
    let count = 0;
    while (await this.hasNext()) {
      await this.next();
      count++;
    }
    return count;
  }
  size() {
    return this.buffer.length;
  }
  min(spec) {
    this._min = spec;
    this._minIndexBounds = spec;
    return this;
  }
  max(spec) {
    this._max = spec;
    this._maxIndexBounds = spec;
    return this;
  }
  maxTimeMS(ms) {
    this._maxTimeMS = ms;
    return this;
  }
  maxScan(n) {
    this._maxScan = n;
    return this;
  }
  noCursorTimeout() {
    this._noCursorTimeout = true;
    return this;
  }
  objsLeftInBatch() {
    return this.buffer.length;
  }
  pretty() {
    this._pretty = true;
    return this;
  }
  readConcern(level) {
    this._readConcern = level;
    return this;
  }
  readPref(mode, tagSet) {
    this._readPref = { mode, tagSet };
    return this;
  }
  returnKey(bool = true) {
    this._returnKey = bool;
    return this;
  }
  showRecordId(bool = true) {
    this._showRecordId = bool;
    return this;
  }
  allowDiskUse(bool = true) {
    this._allowDiskUse = bool;
    return this;
  }
  collation(spec) {
    this._collation = spec;
    return this;
  }
  async forEach(fn) {
    while (await this.hasNext()) {
      const doc = await this.next();
      await fn(doc);
    }
  }
  async map(fn) {
    const results = [];
    while (await this.hasNext()) {
      const doc = await this.next();
      results.push(await fn(doc));
    }
    return results;
  }
  // Support async iteration
  async *[Symbol.asyncIterator]() {
    while (await this.hasNext()) {
      yield await this.next();
    }
  }
  async _getMore() {
    if (this.exhausted) return;
    const resp = await this.bridge.sendRequest({
      target: "cursor",
      cursorId: this.cursorId,
      method: "getMore",
      args: [{ batchSize: this._batchSize }]
    });
    this.buffer = resp?.batch || [];
    this.exhausted = !!resp?.exhausted;
    if (this.exhausted) {
      await this._closeRemote();
    }
  }
  async _closeRemote() {
    if (!this.cursorId) return;
    try {
      await this.bridge.sendRequest({
        target: "cursor",
        cursorId: this.cursorId,
        method: "close"
      });
    } catch (_) {
    }
    this.cursorId = null;
  }
}
class ProxyCollection {
  constructor({ dbName, name, bridge, db }) {
    this.dbName = dbName;
    this.name = name;
    this.bridge = bridge;
    this._db = db;
    this.indexes = [];
    return new Proxy(this, {
      get: (target, prop, receiver) => {
        if (prop in target) return Reflect.get(target, prop, receiver);
        if (typeof prop === "symbol" || String(prop).startsWith("_")) return void 0;
        if (prop === "watch") {
          return (...args) => target._watch(...args);
        }
        if (prop === "find" || prop === "aggregate") {
          return (...args) => target._cursorMethod(String(prop), args);
        }
        return (...args) => target._call(String(prop), args);
      }
    });
  }
  _cursorMethod(method, args = []) {
    if (method === "find" && args.length >= 2) {
      this._validateProjection(args[1]);
    }
    const requestPayload = {
      target: "collection",
      database: this.dbName,
      collection: this.name,
      method,
      args
    };
    const cursor = new ProxyCursor({
      bridge: this.bridge,
      requestPayload
    });
    if (method === "aggregate") {
      cursor.then = function(onFulfilled, onRejected) {
        return this.toArray().then(onFulfilled, onRejected);
      };
    }
    return cursor;
  }
  _validateProjection(projection) {
    if (!projection || Object.keys(projection).length === 0) return;
    const keys = Object.keys(projection);
    let hasInclusion = false;
    let hasExclusion = false;
    for (const key of keys) {
      if (key === "_id") continue;
      if (projection[key]) hasInclusion = true;
      else hasExclusion = true;
      if (hasInclusion && hasExclusion) break;
    }
    if (hasInclusion && hasExclusion) {
      throw new QueryError("Cannot do exclusion on field in inclusion projection", {
        code: ErrorCodes.CANNOT_DO_EXCLUSION_ON_FIELD_ID_IN_INCLUSION_PROJECTION,
        collection: this.name
      });
    }
  }
  _call(method, args = []) {
    const promise = this.bridge.sendRequest({
      target: "collection",
      database: this.dbName,
      collection: this.name,
      method,
      args
    }).then((res) => {
      if (res && res.cursorId) {
        return new ProxyCursor({
          bridge: this.bridge,
          cursorId: res.cursorId,
          batch: res.batch,
          exhausted: res.exhausted,
          batchSize: res.batchSize
        });
      }
      if (method === "copyTo" && args.length > 0) {
        if (this._db) {
          this._db.collection(args[0]);
        }
      }
      if (method === "createIndex") {
        const indexSpec = args[0];
        const indexOptions = args[1] || {};
        const indexName = indexOptions.name || Object.entries(indexSpec).map(([k, v]) => `${k}_${v}`).join("_");
        if (!this.indexes.find((idx) => idx.name === indexName)) {
          this.indexes.push({
            name: indexName,
            key: indexSpec,
            ...indexOptions
          });
        }
      }
      if (method === "dropIndex") {
        const indexName = args[0];
        this.indexes = this.indexes.filter((idx) => idx.name !== indexName);
      }
      if (method === "dropIndexes") {
        this.indexes = [];
      }
      if (method === "drop") {
        this.indexes = [];
      }
      return res;
    });
    return promise;
  }
  getIndexes() {
    return this.indexes;
  }
  _watch(pipeline = [], options = {}) {
    return ProxyChangeStream.create({
      bridge: this.bridge,
      database: this.dbName,
      collection: this.name,
      pipeline,
      options
    });
  }
}
class ProxyDB {
  constructor({ dbName, bridge, options = {} }) {
    this.dbName = dbName;
    this.bridge = bridge;
    this.options = options;
    this.collections = /* @__PURE__ */ new Map();
    const dbMethodNames = /* @__PURE__ */ new Set([
      "getCollectionNames",
      "getCollectionInfos",
      "createCollection",
      "dropCollection",
      "dropDatabase",
      "collection",
      "getCollection",
      "watch"
    ]);
    this._methodNames = dbMethodNames;
    return new Proxy(this, {
      get: (target, prop, receiver) => {
        if (prop in target) return Reflect.get(target, prop, receiver);
        if (typeof prop === "symbol" || String(prop).startsWith("_")) return void 0;
        if (dbMethodNames.has(prop)) {
          if (prop === "createCollection") {
            return (...args) => {
              const collName = args[0];
              target.collection(collName, receiver);
              return target._call(String(prop), args);
            };
          }
          if (prop === "dropCollection") {
            return (...args) => {
              const collName = args[0];
              target.collections.delete(collName);
              return target._call(String(prop), args);
            };
          }
          if (prop === "dropDatabase") {
            return (...args) => {
              target.collections.clear();
              return target._call(String(prop), args);
            };
          }
          if (prop === "watch") {
            return (...args) => target._watch(...args);
          }
          return (...args) => target._call(String(prop), args);
        }
        return target.collection(prop, receiver);
      }
    });
  }
  collection(name, dbProxy) {
    if (this.collections.has(name)) return this.collections.get(name);
    const col = new ProxyCollection({
      dbName: this.dbName,
      name,
      bridge: this.bridge,
      db: dbProxy || this
      // Pass DB proxy if available, otherwise this
    });
    this.collections.set(name, col);
    return col;
  }
  getCollectionNames() {
    return Array.from(this.collections.keys());
  }
  async close() {
    return void 0;
  }
  // Direct forwarding for DB-level methods
  _call(method, args = []) {
    const promise = this.bridge.sendRequest({
      target: "db",
      database: this.dbName,
      method,
      args
    }).then((res) => {
      if (res && res.streamId) {
        return ProxyChangeStream.create({
          bridge: this.bridge,
          database: this.dbName,
          collection: null,
          streamId: res.streamId
        });
      }
      return res;
    });
    return promise;
  }
  _watch(pipeline = [], options = {}) {
    return ProxyChangeStream.create({
      bridge: this.bridge,
      database: this.dbName,
      collection: null,
      pipeline,
      options
    });
  }
}
class MongoClient extends eventsExports.EventEmitter {
  constructor(uri = "mongodb://localhost:27017", options = {}) {
    super();
    this.uri = uri;
    this.options = Object.freeze({ ...options });
    this._isConnected = false;
    this._defaultDb = this._parseDefaultDbName(uri);
    this._databases = /* @__PURE__ */ new Map();
    if (!options.workerBridge) {
      throw new Error("workerBridge is required. Create one with: const bridge = await WorkerBridge.create()");
    }
    this._bridge = options.workerBridge;
    this._ownsBridge = false;
  }
  static async connect(uri, options = {}) {
    const client = new MongoClient(uri, options);
    await client.connect();
    return client;
  }
  async connect() {
    if (this._isConnected) return this;
    this._isConnected = true;
    this.emit("open", this);
    return this;
  }
  // Note that db on real MongoClient is synchronous
  db(name, opts = {}) {
    const dbName = name || this._defaultDb;
    if (!dbName) {
      throw new Error("No database name provided and no default in connection string");
    }
    if (this._databases.has(dbName)) {
      return this._databases.get(dbName);
    }
    const database = new ProxyDB({
      dbName,
      bridge: this._bridge,
      options: { ...this.options, ...opts }
    });
    this._databases.set(dbName, database);
    return database;
  }
  async close() {
    if (this._bridge && this._ownsBridge) {
      await this._bridge.terminate();
      this._bridge = null;
    }
    this._isConnected = false;
    this.emit("close");
  }
  // async _loadExistingDatabases() {
  //   const discoveredNames = await this._discoverDatabases();
  //   console.log('Discovered databases:', discoveredNames);
  //   const names = new Set(discoveredNames);
  //   // Ensure default DB from URI is loaded when provided
  //   if (this._defaultDb) {
  //     names.add(this._defaultDb);
  //   }
  //   for (const dbName of names) {
  //     if (this._databases.has(dbName)) continue;
  //     const database = new DB({ ...this.options, dbName });
  //     this._databases.set(dbName, database);
  //   }
  // }
  // async _discoverDatabases() {
  //   const dbNames = new Set();
  //   const baseFolder = this.options.rootPath || '/micro-mongo';
  //   const hasOPFS = !!(globalThis.navigator && globalThis.navigator.storage && typeof globalThis.navigator.storage.getDirectory === 'function');
  //   if (!hasOPFS) {
  //     return Array.from(dbNames);
  //   }
  //   try {
  //     let dir = await globalThis.navigator.storage.getDirectory();
  //     const parts = baseFolder.split('/').filter(Boolean);
  //     for (const part of parts) {
  //       dir = await dir.getDirectoryHandle(part, { create: true });
  //     }
  //     for await (const [name, handle] of dir.entries()) {
  //       if (handle && handle.kind === 'directory') {
  //         dbNames.add(name);
  //       }
  //     }
  //   } catch (err) {
  //     console.warn('Failed to discover databases', err);
  //   }
  //   return Array.from(dbNames);
  // }
  async close(force = false) {
    if (!this._isConnected) return;
    for (const [_, database] of this._databases) {
      await database.close();
    }
    this._databases.clear();
    this._isConnected = false;
    this.emit("close");
  }
  // Session management stubs
  startSession(options = {}) {
    return {
      id: crypto.randomUUID(),
      endSession: () => {
      },
      withTransaction: async (fn) => await fn(this)
    };
  }
  async withSession(optionsOrExecutor, executor) {
    const session = this.startSession(
      typeof optionsOrExecutor === "function" ? {} : optionsOrExecutor
    );
    const fn = typeof optionsOrExecutor === "function" ? optionsOrExecutor : executor;
    try {
      return await fn(session);
    } finally {
      session.endSession();
    }
  }
  // Configuration getters
  get readConcern() {
    return this.options.readConcern;
  }
  get writeConcern() {
    return this.options.writeConcern;
  }
  get readPreference() {
    return this.options.readPreference;
  }
  /**
   * Watch for changes across all databases and collections
   * @param {Array} pipeline - Aggregation pipeline to filter changes
   * @param {Object} options - Watch options
   * @returns {ProxyChangeStream} A change stream instance
   */
  watch(pipeline = [], options = {}) {
    return ProxyChangeStream.create({
      bridge: this._bridge,
      database: null,
      // null means watch all databases
      collection: null,
      pipeline,
      options
    });
  }
  _parseDefaultDbName(uri) {
    const match = uri.match(/\/([^/?]+)/);
    return match ? match[1] : null;
  }
  _parseUriParams(uri) {
    const params = {};
    const queryIndex = uri.indexOf("?");
    if (queryIndex === -1) return params;
    const queryString = uri.substring(queryIndex + 1);
    const pairs = queryString.split("&");
    for (const pair of pairs) {
      const [key, value] = pair.split("=");
      if (key) {
        if (value === "true") params[key] = true;
        else if (value === "false") params[key] = false;
        else if (!isNaN(value)) params[key] = Number(value);
        else params[key] = decodeURIComponent(value || "");
      }
    }
    return params;
  }
}
class ObjectId {
  constructor(id) {
    if (id === void 0 || id === null) {
      this.id = ObjectId.generate();
    } else if (typeof id === "string") {
      if (!ObjectId.isValid(id)) {
        throw new Error(`Argument passed in must be a string of 24 hex characters, got: ${id}`);
      }
      this.id = id.toLowerCase();
    } else if (id instanceof Uint8Array && id.length === 12) {
      this.id = Array.from(id).map((b) => b.toString(16).padStart(2, "0")).join("");
    } else if (id instanceof ObjectId) {
      this.id = id.id;
    } else {
      throw new Error(`Argument passed in must be a string of 24 hex characters or an ObjectId`);
    }
  }
  /**
   * Returns the ObjectId as a 24-character hex string
   */
  toString() {
    return this.id;
  }
  /**
   * Returns the ObjectId as a 24-character hex string (alias for toString)
   */
  toHexString() {
    return this.id;
  }
  /**
   * Returns the timestamp portion of the ObjectId as a Date
   */
  getTimestamp() {
    const timestamp = parseInt(this.id.substring(0, 8), 16);
    return new Date(timestamp * 1e3);
  }
  equals(other) {
    if (!(other instanceof ObjectId)) {
      throw new Error("Can only compare with another ObjectId");
    }
    return this.id === other.id;
  }
  /**
   * Compares this ObjectId with another for equality
   */
  compare(other) {
    if (!(other instanceof ObjectId)) {
      throw new Error("Can only compare with another ObjectId");
    }
    return this.id.localeCompare(other.id);
  }
  /**
   * Returns the ObjectId in JSON format (as hex string)
   */
  toJSON() {
    return this.id;
  }
  /**
   * Custom inspect for Node.js console.log
   */
  inspect() {
    return `ObjectId("${this.id}")`;
  }
  toBytes() {
    const bytes = new Uint8Array(12);
    for (let i = 0; i < 12; i++) {
      bytes[i] = parseInt(this.id.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }
  /**
   * Validates if a string is a valid ObjectId hex string
   */
  static isValid(id) {
    if (!id) return false;
    if (typeof id !== "string") return false;
    if (id.length !== 24) return false;
    return /^[0-9a-fA-F]{24}$/.test(id);
  }
  /**
   * Creates an ObjectId from a timestamp
   */
  static createFromTime(timestamp) {
    const ts = Math.floor(timestamp / 1e3);
    const tsHex = ("00000000" + ts.toString(16)).slice(-8);
    const tail = "0000000000000000";
    return new ObjectId(tsHex + tail);
  }
  /**
   * Generates a new ObjectId hex string
   * Format: 8-char timestamp (4 bytes) + 16-char random data (8 bytes)
   */
  static generate() {
    const ts = Math.floor(Date.now() / 1e3);
    const rand = typeof crypto !== "undefined" && crypto.getRandomValues ? new Uint8Array(8) : null;
    let tail = "";
    if (rand) {
      crypto.getRandomValues(rand);
      for (let i = 0; i < rand.length; i++) {
        tail += ("0" + rand[i].toString(16)).slice(-2);
      }
    } else {
      tail = Math.random().toString(16).slice(2).padEnd(8, "0").slice(0, 8) + Math.random().toString(16).slice(2).padEnd(8, "0").slice(0, 8);
    }
    const tsHex = ("00000000" + ts.toString(16)).slice(-8);
    return (tsHex + tail).slice(0, 24);
  }
}
function valuesEqual$1(a, b) {
  if (a instanceof ObjectId || b instanceof ObjectId) {
    if (a instanceof ObjectId && b instanceof ObjectId) {
      return a.equals(b);
    }
    if (a instanceof ObjectId && typeof b === "string") {
      return a.equals(b);
    }
    if (b instanceof ObjectId && typeof a === "string") {
      return b.equals(a);
    }
    return false;
  }
  return a == b;
}
function getProp(obj, name) {
  var path = name.split(".");
  var result = obj[path[0]];
  for (var i = 1; i < path.length; i++) {
    if (result == void 0 || result == null) return result;
    var pathSegment = path[i];
    var numericIndex = parseInt(pathSegment, 10);
    if (isArray(result) && !isNaN(numericIndex) && numericIndex >= 0 && numericIndex < result.length) {
      result = result[numericIndex];
    } else {
      result = result[pathSegment];
    }
  }
  return result;
}
function getFieldValues(obj, name) {
  var path = name.split(".");
  var results = [obj];
  for (var i = 0; i < path.length; i++) {
    var pathSegment = path[i];
    var numericIndex = parseInt(pathSegment, 10);
    var newResults = [];
    for (var j = 0; j < results.length; j++) {
      var current = results[j];
      if (current == void 0 || current == null) continue;
      if (isArray(current) && !isNaN(numericIndex) && numericIndex >= 0) {
        if (numericIndex < current.length) {
          newResults.push(current[numericIndex]);
        }
      } else if (isArray(current)) {
        for (var k = 0; k < current.length; k++) {
          if (current[k] != void 0 && current[k] != null && typeof current[k] === "object") {
            newResults.push(current[k][pathSegment]);
          }
        }
      } else if (typeof current === "object") {
        newResults.push(current[pathSegment]);
      }
    }
    results = newResults;
  }
  results = results.filter(function(v) {
    return v !== void 0;
  });
  if (results.length === 0) return void 0;
  if (results.length === 1) return results[0];
  return results;
}
function isArray(o) {
  return Array == o.constructor;
}
function toArray(obj) {
  var arr = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      var el = {};
      el[key] = obj[key];
      arr.push(el);
    }
  }
  return arr;
}
function isIn(val, values) {
  for (var i = 0; i < values.length; i++) {
    if (valuesEqual$1(values[i], val)) return true;
  }
  return false;
}
function arrayMatches(x, y) {
  if (x.length != y.length) return false;
  for (var i = 0; i < x.length; i++) {
    if (valuesEqual$1(x[i], y[i])) continue;
    if (typeof x[i] != typeof y[i]) return false;
    if (typeof x[i] == "object" && x[i] !== null) {
      if (isArray(x[i])) {
        if (!arrayMatches(x[i], y[i])) return false;
      } else {
        if (!objectMatches(x[i], y[i])) return false;
      }
    } else {
      if (!valuesEqual$1(x[i], y[i])) return false;
    }
  }
  return true;
}
function objectMatches(x, y) {
  for (var p in x) {
    if (!x.hasOwnProperty(p)) continue;
    if (!y.hasOwnProperty(p)) return false;
    if (valuesEqual$1(x[p], y[p])) continue;
    if (typeof x[p] != typeof y[p]) return false;
    if (typeof x[p] == "object" && x[p] !== null) {
      if (isArray(x[p])) {
        if (!arrayMatches(x[p], y[p])) return false;
      } else {
        if (!objectMatches(x[p], y[p])) return false;
      }
    } else {
      if (!valuesEqual$1(x[p], y[p])) return false;
    }
  }
  for (var p in y) {
    if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) return false;
  }
  return true;
}
const step2list = {
  ational: "ate",
  tional: "tion",
  enci: "ence",
  anci: "ance",
  izer: "ize",
  bli: "ble",
  alli: "al",
  entli: "ent",
  eli: "e",
  ousli: "ous",
  ization: "ize",
  ation: "ate",
  ator: "ate",
  alism: "al",
  iveness: "ive",
  fulness: "ful",
  ousness: "ous",
  aliti: "al",
  iviti: "ive",
  biliti: "ble",
  logi: "log"
};
const step3list = {
  icate: "ic",
  ative: "",
  alize: "al",
  iciti: "ic",
  ical: "ic",
  ful: "",
  ness: ""
};
const consonant = "[^aeiou]";
const vowel = "[aeiouy]";
const consonants = "(" + consonant + "[^aeiouy]*)";
const vowels = "(" + vowel + "[aeiou]*)";
const gt0 = new RegExp("^" + consonants + "?" + vowels + consonants);
const eq1 = new RegExp(
  "^" + consonants + "?" + vowels + consonants + vowels + "?$"
);
const gt1 = new RegExp("^" + consonants + "?(" + vowels + consonants + "){2,}");
const vowelInStem = new RegExp("^" + consonants + "?" + vowel);
const consonantLike = new RegExp("^" + consonants + vowel + "[^aeiouwxy]$");
const sfxLl = /ll$/;
const sfxE = /^(.+?)e$/;
const sfxY = /^(.+?)y$/;
const sfxIon = /^(.+?(s|t))(ion)$/;
const sfxEdOrIng = /^(.+?)(ed|ing)$/;
const sfxAtOrBlOrIz = /(at|bl|iz)$/;
const sfxEED = /^(.+?)eed$/;
const sfxS = /^.+?[^s]s$/;
const sfxSsesOrIes = /^.+?(ss|i)es$/;
const sfxMultiConsonantLike = /([^aeiouylsz])\1$/;
const step2 = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
const step3 = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
const step4 = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
function stemmer(value) {
  let result = String(value).toLowerCase();
  if (result.length < 3) {
    return result;
  }
  let firstCharacterWasLowerCaseY = false;
  if (result.codePointAt(0) === 121) {
    firstCharacterWasLowerCaseY = true;
    result = "Y" + result.slice(1);
  }
  if (sfxSsesOrIes.test(result)) {
    result = result.slice(0, -2);
  } else if (sfxS.test(result)) {
    result = result.slice(0, -1);
  }
  let match;
  if (match = sfxEED.exec(result)) {
    if (gt0.test(match[1])) {
      result = result.slice(0, -1);
    }
  } else if ((match = sfxEdOrIng.exec(result)) && vowelInStem.test(match[1])) {
    result = match[1];
    if (sfxAtOrBlOrIz.test(result)) {
      result += "e";
    } else if (sfxMultiConsonantLike.test(result)) {
      result = result.slice(0, -1);
    } else if (consonantLike.test(result)) {
      result += "e";
    }
  }
  if ((match = sfxY.exec(result)) && vowelInStem.test(match[1])) {
    result = match[1] + "i";
  }
  if ((match = step2.exec(result)) && gt0.test(match[1])) {
    result = match[1] + step2list[match[2]];
  }
  if ((match = step3.exec(result)) && gt0.test(match[1])) {
    result = match[1] + step3list[match[2]];
  }
  if (match = step4.exec(result)) {
    if (gt1.test(match[1])) {
      result = match[1];
    }
  } else if ((match = sfxIon.exec(result)) && gt1.test(match[1])) {
    result = match[1];
  }
  if ((match = sfxE.exec(result)) && (gt1.test(match[1]) || eq1.test(match[1]) && !consonantLike.test(match[1]))) {
    result = match[1];
  }
  if (sfxLl.test(result) && gt1.test(result)) {
    result = result.slice(0, -1);
  }
  if (firstCharacterWasLowerCaseY) {
    result = "y" + result.slice(1);
  }
  return result;
}
const STOPWORDS = /* @__PURE__ */ new Set([
  "a",
  "about",
  "after",
  "all",
  "also",
  "am",
  "an",
  "and",
  "another",
  "any",
  "are",
  "around",
  "as",
  "at",
  "be",
  "because",
  "been",
  "before",
  "being",
  "between",
  "both",
  "but",
  "by",
  "came",
  "can",
  "come",
  "could",
  "did",
  "do",
  "each",
  "for",
  "from",
  "get",
  "got",
  "has",
  "had",
  "he",
  "have",
  "her",
  "here",
  "him",
  "himself",
  "his",
  "how",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "like",
  "make",
  "many",
  "me",
  "might",
  "more",
  "most",
  "much",
  "must",
  "my",
  "never",
  "now",
  "of",
  "on",
  "only",
  "or",
  "other",
  "our",
  "out",
  "over",
  "said",
  "same",
  "see",
  "should",
  "since",
  "some",
  "still",
  "such",
  "take",
  "than",
  "that",
  "the",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "through",
  "to",
  "too",
  "under",
  "up",
  "very",
  "was",
  "way",
  "we",
  "well",
  "were",
  "what",
  "where",
  "which",
  "while",
  "who",
  "with",
  "would",
  "you",
  "your"
]);
function tokenize(text2) {
  if (typeof text2 !== "string") {
    return [];
  }
  const words = text2.toLowerCase().split(/\W+/).filter((word) => word.length > 0);
  return words.filter((word) => !STOPWORDS.has(word));
}
function evaluateExpression(expr, doc) {
  if (expr === null || expr === void 0) {
    return expr;
  }
  if (typeof expr === "boolean" || typeof expr === "number") {
    return expr;
  }
  if (typeof expr === "string") {
    if (expr.startsWith("$$")) {
      if (expr === "$$KEEP" || expr === "$$PRUNE" || expr === "$$DESCEND") {
        return expr;
      }
      return getProp(doc, expr.substring(2));
    } else if (expr.charAt(0) === "$") {
      return getProp(doc, expr.substring(1));
    }
    return expr;
  }
  if (typeof expr === "object") {
    if (Array.isArray(expr)) {
      return expr.map((item) => evaluateExpression(item, doc));
    }
    const keys = Object.keys(expr);
    if (keys.length === 0) {
      return expr;
    }
    const operator = keys[0];
    if (operator.charAt(0) === "$") {
      const operand = expr[operator];
      return evaluateOperator(operator, operand, doc);
    } else {
      const result = {};
      for (const key of keys) {
        result[key] = evaluateExpression(expr[key], doc);
      }
      return result;
    }
  }
  return expr;
}
function evaluateOperator(operator, operand, doc) {
  switch (operator) {
    // Arithmetic operators
    case "$add":
      return evalAdd(operand, doc);
    case "$subtract":
      return evalSubtract(operand, doc);
    case "$multiply":
      return evalMultiply(operand, doc);
    case "$divide":
      return evalDivide(operand, doc);
    case "$mod":
      return evalMod(operand, doc);
    case "$pow":
      return evalPow(operand, doc);
    case "$sqrt":
      return evalSqrt(operand, doc);
    case "$abs":
      return evalAbs(operand, doc);
    case "$ceil":
      return evalCeil(operand, doc);
    case "$floor":
      return evalFloor(operand, doc);
    case "$trunc":
      return evalTrunc(operand, doc);
    case "$round":
      return evalRound(operand, doc);
    // String operators
    case "$concat":
      return evalConcat(operand, doc);
    case "$substr":
      return evalSubstr(operand, doc);
    case "$toLower":
      return evalToLower(operand, doc);
    case "$toUpper":
      return evalToUpper(operand, doc);
    case "$trim":
      return evalTrim(operand, doc);
    case "$ltrim":
      return evalLtrim(operand, doc);
    case "$rtrim":
      return evalRtrim(operand, doc);
    case "$split":
      return evalSplit(operand, doc);
    case "$strLenCP":
      return evalStrLenCP(operand, doc);
    case "$strcasecmp":
      return evalStrcasecmp(operand, doc);
    case "$indexOfCP":
      return evalIndexOfCP(operand, doc);
    case "$replaceOne":
      return evalReplaceOne(operand, doc);
    case "$replaceAll":
      return evalReplaceAll(operand, doc);
    // Comparison operators
    case "$cmp":
      return evalCmp(operand, doc);
    case "$eq":
      return evalEq(operand, doc);
    case "$ne":
      return evalNe(operand, doc);
    case "$gt":
      return evalGt(operand, doc);
    case "$gte":
      return evalGte(operand, doc);
    case "$lt":
      return evalLt(operand, doc);
    case "$lte":
      return evalLte(operand, doc);
    // Logical operators
    case "$and":
      return evalAnd(operand, doc);
    case "$or":
      return evalOr(operand, doc);
    case "$not":
      return evalNot(operand, doc);
    // Conditional operators
    case "$cond":
      return evalCond(operand, doc);
    case "$ifNull":
      return evalIfNull(operand, doc);
    case "$switch":
      return evalSwitch(operand, doc);
    // Date operators
    case "$year":
      return evalYear(operand, doc);
    case "$month":
      return evalMonth(operand, doc);
    case "$dayOfMonth":
      return evalDayOfMonth(operand, doc);
    case "$dayOfWeek":
      return evalDayOfWeek(operand, doc);
    case "$dayOfYear":
      return evalDayOfYear(operand, doc);
    case "$hour":
      return evalHour(operand, doc);
    case "$minute":
      return evalMinute(operand, doc);
    case "$second":
      return evalSecond(operand, doc);
    case "$millisecond":
      return evalMillisecond(operand, doc);
    case "$week":
      return evalWeek(operand, doc);
    case "$isoWeek":
      return evalIsoWeek(operand, doc);
    case "$isoWeekYear":
      return evalIsoWeekYear(operand, doc);
    case "$dateToString":
      return evalDateToString(operand, doc);
    case "$toDate":
      return evalToDate(operand, doc);
    // Array operators
    case "$arrayElemAt":
      return evalArrayElemAt(operand, doc);
    case "$concatArrays":
      return evalConcatArrays(operand, doc);
    case "$filter":
      return evalFilter(operand, doc);
    case "$in":
      return evalIn(operand, doc);
    case "$indexOfArray":
      return evalIndexOfArray(operand, doc);
    case "$isArray":
      return evalIsArray(operand, doc);
    case "$map":
      return evalMap(operand, doc);
    case "$reduce":
      return evalReduce(operand, doc);
    case "$size":
      return evalSize(operand, doc);
    case "$slice":
      return evalSlice(operand, doc);
    case "$reverseArray":
      return evalReverseArray(operand, doc);
    case "$zip":
      return evalZip(operand, doc);
    // Type operators
    case "$type":
      return evalType(operand, doc);
    case "$convert":
      return evalConvert(operand, doc);
    case "$toBool":
      return evalToBool(operand, doc);
    case "$toDecimal":
      return evalToDecimal(operand, doc);
    case "$toDouble":
      return evalToDouble(operand, doc);
    case "$toInt":
      return evalToInt(operand, doc);
    case "$toLong":
      return evalToLong(operand, doc);
    case "$toString":
      return evalToString(operand, doc);
    // Object operators
    case "$objectToArray":
      return evalObjectToArray(operand, doc);
    case "$arrayToObject":
      return evalArrayToObject(operand, doc);
    case "$mergeObjects":
      return evalMergeObjects(operand, doc);
    // Literal operator
    case "$literal":
      return operand;
    default:
      throw new Error(`Unsupported aggregation operator: ${operator}`);
  }
}
function evalAdd(operands, doc) {
  if (!Array.isArray(operands)) return null;
  let sum = 0;
  for (const operand of operands) {
    const val = evaluateExpression(operand, doc);
    if (val instanceof Date) {
      sum += val.getTime();
    } else if (typeof val === "number") {
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
  } else if (val1 instanceof Date && typeof val2 === "number") {
    return new Date(val1.getTime() - val2);
  } else if (typeof val1 === "number" && typeof val2 === "number") {
    return val1 - val2;
  }
  return null;
}
function evalMultiply(operands, doc) {
  if (!Array.isArray(operands)) return null;
  let product = 1;
  for (const operand of operands) {
    const val = evaluateExpression(operand, doc);
    if (typeof val === "number") {
      product *= val;
    }
  }
  return product;
}
function evalDivide(operands, doc) {
  if (!Array.isArray(operands) || operands.length !== 2) return null;
  const val1 = evaluateExpression(operands[0], doc);
  const val2 = evaluateExpression(operands[1], doc);
  if (typeof val1 === "number" && typeof val2 === "number" && val2 !== 0) {
    return val1 / val2;
  }
  return null;
}
function evalMod(operands, doc) {
  if (!Array.isArray(operands) || operands.length !== 2) return null;
  const val1 = evaluateExpression(operands[0], doc);
  const val2 = evaluateExpression(operands[1], doc);
  if (typeof val1 === "number" && typeof val2 === "number" && val2 !== 0) {
    return val1 % val2;
  }
  return null;
}
function evalPow(operands, doc) {
  if (!Array.isArray(operands) || operands.length !== 2) return null;
  const base = evaluateExpression(operands[0], doc);
  const exponent = evaluateExpression(operands[1], doc);
  if (typeof base === "number" && typeof exponent === "number") {
    return Math.pow(base, exponent);
  }
  return null;
}
function evalSqrt(operand, doc) {
  const val = evaluateExpression(operand, doc);
  if (typeof val === "number" && val >= 0) {
    return Math.sqrt(val);
  }
  return null;
}
function evalAbs(operand, doc) {
  const val = evaluateExpression(operand, doc);
  if (typeof val === "number") {
    return Math.abs(val);
  }
  return null;
}
function evalCeil(operand, doc) {
  const val = evaluateExpression(operand, doc);
  if (typeof val === "number") {
    return Math.ceil(val);
  }
  return null;
}
function evalFloor(operand, doc) {
  const val = evaluateExpression(operand, doc);
  if (typeof val === "number") {
    return Math.floor(val);
  }
  return null;
}
function evalTrunc(operand, doc) {
  const val = evaluateExpression(operand, doc);
  if (typeof val === "number") {
    return Math.trunc(val);
  }
  return null;
}
function evalRound(operands, doc) {
  const val = evaluateExpression(Array.isArray(operands) ? operands[0] : operands, doc);
  const place = Array.isArray(operands) && operands[1] !== void 0 ? evaluateExpression(operands[1], doc) : 0;
  if (typeof val === "number" && typeof place === "number") {
    const multiplier = Math.pow(10, place);
    return Math.round(val * multiplier) / multiplier;
  }
  return null;
}
function evalConcat(operands, doc) {
  if (!Array.isArray(operands)) return null;
  let result = "";
  for (const operand of operands) {
    const val = evaluateExpression(operand, doc);
    if (val !== null && val !== void 0) {
      result += String(val);
    }
  }
  return result;
}
function evalSubstr(operands, doc) {
  if (!Array.isArray(operands) || operands.length < 3) return null;
  const str = String(evaluateExpression(operands[0], doc) || "");
  const start = evaluateExpression(operands[1], doc);
  const length = evaluateExpression(operands[2], doc);
  if (typeof start === "number" && typeof length === "number") {
    return str.substr(start, length);
  }
  return null;
}
function evalToLower(operand, doc) {
  const val = evaluateExpression(operand, doc);
  return val !== null && val !== void 0 ? String(val).toLowerCase() : "";
}
function evalToUpper(operand, doc) {
  const val = evaluateExpression(operand, doc);
  return val !== null && val !== void 0 ? String(val).toUpperCase() : "";
}
function evalTrim(operand, doc) {
  const val = evaluateExpression(typeof operand === "object" && operand.input ? operand.input : operand, doc);
  const chars = operand.chars ? evaluateExpression(operand.chars, doc) : null;
  let str = val !== null && val !== void 0 ? String(val) : "";
  if (chars) {
    const charsRegex = new RegExp(`^[${escapeRegex(chars)}]+|[${escapeRegex(chars)}]+$`, "g");
    return str.replace(charsRegex, "");
  }
  return str.trim();
}
function evalLtrim(operand, doc) {
  const val = evaluateExpression(typeof operand === "object" && operand.input ? operand.input : operand, doc);
  const chars = operand.chars ? evaluateExpression(operand.chars, doc) : null;
  let str = val !== null && val !== void 0 ? String(val) : "";
  if (chars) {
    const charsRegex = new RegExp(`^[${escapeRegex(chars)}]+`, "g");
    return str.replace(charsRegex, "");
  }
  return str.replace(/^\s+/, "");
}
function evalRtrim(operand, doc) {
  const val = evaluateExpression(typeof operand === "object" && operand.input ? operand.input : operand, doc);
  const chars = operand.chars ? evaluateExpression(operand.chars, doc) : null;
  let str = val !== null && val !== void 0 ? String(val) : "";
  if (chars) {
    const charsRegex = new RegExp(`[${escapeRegex(chars)}]+$`, "g");
    return str.replace(charsRegex, "");
  }
  return str.replace(/\s+$/, "");
}
function evalSplit(operands, doc) {
  if (!Array.isArray(operands) || operands.length !== 2) return null;
  const str = String(evaluateExpression(operands[0], doc) || "");
  const delimiter = String(evaluateExpression(operands[1], doc) || "");
  return str.split(delimiter);
}
function evalStrLenCP(operand, doc) {
  const val = evaluateExpression(operand, doc);
  return val !== null && val !== void 0 ? String(val).length : 0;
}
function evalStrcasecmp(operands, doc) {
  if (!Array.isArray(operands) || operands.length !== 2) return null;
  const str1 = String(evaluateExpression(operands[0], doc) || "").toLowerCase();
  const str2 = String(evaluateExpression(operands[1], doc) || "").toLowerCase();
  if (str1 < str2) return -1;
  if (str1 > str2) return 1;
  return 0;
}
function evalIndexOfCP(operands, doc) {
  if (!Array.isArray(operands) || operands.length < 2) return null;
  const str = String(evaluateExpression(operands[0], doc) || "");
  const substr = String(evaluateExpression(operands[1], doc) || "");
  const start = operands[2] !== void 0 ? evaluateExpression(operands[2], doc) : 0;
  const end = operands[3] !== void 0 ? evaluateExpression(operands[3], doc) : str.length;
  const searchStr = str.substring(start, end);
  const index = searchStr.indexOf(substr);
  return index === -1 ? -1 : index + start;
}
function evalReplaceOne(operand, doc) {
  const input = String(evaluateExpression(operand.input, doc) || "");
  const find = String(evaluateExpression(operand.find, doc) || "");
  const replacement = String(evaluateExpression(operand.replacement, doc) || "");
  return input.replace(find, replacement);
}
function evalReplaceAll(operand, doc) {
  const input = String(evaluateExpression(operand.input, doc) || "");
  const find = String(evaluateExpression(operand.find, doc) || "");
  const replacement = String(evaluateExpression(operand.replacement, doc) || "");
  return input.split(find).join(replacement);
}
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
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
function evalCond(operand, doc) {
  let ifExpr, thenExpr, elseExpr;
  if (Array.isArray(operand)) {
    if (operand.length !== 3) return null;
    [ifExpr, thenExpr, elseExpr] = operand;
  } else if (typeof operand === "object") {
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
    if (val !== null && val !== void 0) {
      return val;
    }
  }
  return null;
}
function evalSwitch(operand, doc) {
  if (typeof operand !== "object" || !Array.isArray(operand.branches)) {
    return null;
  }
  for (const branch of operand.branches) {
    const caseResult = evaluateExpression(branch.case, doc);
    if (caseResult) {
      return evaluateExpression(branch.then, doc);
    }
  }
  return operand.default !== void 0 ? evaluateExpression(operand.default, doc) : null;
}
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
    return date.getUTCMonth() + 1;
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
    return date.getUTCDay() + 1;
  }
  return null;
}
function evalDayOfYear(operand, doc) {
  const date = evaluateExpression(operand, doc);
  if (date instanceof Date) {
    const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
    const diff = date - start;
    const oneDay = 1e3 * 60 * 60 * 24;
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
    const week = Math.ceil(((date - onejan) / 864e5 + onejan.getUTCDay() + 1) / 7);
    return week - 1;
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
      target.setUTCMonth(0, 1 + (4 - target.getUTCDay() + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target) / 6048e5);
  }
  return null;
}
function evalIsoWeekYear(operand, doc) {
  const date = evaluateExpression(operand, doc);
  if (date instanceof Date) {
    const target = new Date(date.valueOf());
    target.setUTCDate(target.getUTCDate() - (date.getUTCDay() + 6) % 7 + 3);
    return target.getUTCFullYear();
  }
  return null;
}
function evalDateToString(operand, doc) {
  const format = operand.format ? evaluateExpression(operand.format, doc) : "%Y-%m-%dT%H:%M:%S.%LZ";
  const date = evaluateExpression(operand.date, doc);
  if (!(date instanceof Date)) return null;
  return format.replace("%Y", date.getUTCFullYear()).replace("%m", String(date.getUTCMonth() + 1).padStart(2, "0")).replace("%d", String(date.getUTCDate()).padStart(2, "0")).replace("%H", String(date.getUTCHours()).padStart(2, "0")).replace("%M", String(date.getUTCMinutes()).padStart(2, "0")).replace("%S", String(date.getUTCSeconds()).padStart(2, "0")).replace("%L", String(date.getUTCMilliseconds()).padStart(3, "0"));
}
function evalToDate(operand, doc) {
  const val = evaluateExpression(operand, doc);
  if (val instanceof Date) return val;
  if (typeof val === "string" || typeof val === "number") {
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}
function evalArrayElemAt(operands, doc) {
  if (!Array.isArray(operands) || operands.length !== 2) return null;
  const arr = evaluateExpression(operands[0], doc);
  const idx = evaluateExpression(operands[1], doc);
  if (!Array.isArray(arr) || typeof idx !== "number") return null;
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
  const asVar = operand.as || "this";
  const cond = operand.cond;
  if (!Array.isArray(input)) return null;
  return input.filter((item) => {
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
  const start = operands[2] !== void 0 ? evaluateExpression(operands[2], doc) : 0;
  const end = operands[3] !== void 0 ? evaluateExpression(operands[3], doc) : arr.length;
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
  const asVar = operand.as || "this";
  const inExpr = operand.in;
  if (!Array.isArray(input)) return null;
  return input.map((item) => {
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
  const arrays = inputs.map((input) => evaluateExpression(input, doc));
  if (!arrays.every((arr) => Array.isArray(arr))) return null;
  const maxLength = Math.max(...arrays.map((arr) => arr.length));
  const length = useLongestLength ? maxLength : Math.min(...arrays.map((arr) => arr.length));
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
function evalType(operand, doc) {
  const val = evaluateExpression(operand, doc);
  if (val === null) return "null";
  if (val === void 0) return "missing";
  if (typeof val === "boolean") return "bool";
  if (typeof val === "number") return Number.isInteger(val) ? "int" : "double";
  if (typeof val === "string") return "string";
  if (val instanceof Date) return "date";
  if (Array.isArray(val)) return "array";
  if (typeof val === "object") return "object";
  return "unknown";
}
function evalConvert(operand, doc) {
  const input = evaluateExpression(operand.input, doc);
  const to = operand.to;
  const onError = operand.onError;
  const onNull = operand.onNull;
  if (input === null) {
    return onNull !== void 0 ? evaluateExpression(onNull, doc) : null;
  }
  try {
    switch (to) {
      case "double":
      case "decimal":
        return parseFloat(input);
      case "int":
      case "long":
        return parseInt(input);
      case "bool":
        return Boolean(input);
      case "string":
        return String(input);
      case "date":
        return new Date(input);
      default:
        return input;
    }
  } catch (e) {
    return onError !== void 0 ? evaluateExpression(onError, doc) : null;
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
  if (val === null || val === void 0) return null;
  return String(val);
}
function evalObjectToArray(operand, doc) {
  const obj = evaluateExpression(operand, doc);
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return null;
  }
  return Object.keys(obj).map((key) => ({ k: key, v: obj[key] }));
}
function evalArrayToObject(operand, doc) {
  const arr = evaluateExpression(operand, doc);
  if (!Array.isArray(arr)) return null;
  const result = {};
  for (const item of arr) {
    if (Array.isArray(item) && item.length === 2) {
      result[item[0]] = item[1];
    } else if (typeof item === "object" && item.k !== void 0 && item.v !== void 0) {
      result[item.k] = item.v;
    }
  }
  return result;
}
function evalMergeObjects(operands, doc) {
  if (!Array.isArray(operands)) {
    return evaluateExpression(operands, doc);
  }
  const result = {};
  for (const operand of operands) {
    const obj = evaluateExpression(operand, doc);
    if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
      Object.assign(result, obj);
    }
  }
  return result;
}
const BSON_TYPES = {
  1: "double",
  2: "string",
  3: "object",
  4: "array",
  5: "binData",
  6: "undefined",
  7: "objectId",
  8: "bool",
  9: "date",
  10: "null",
  11: "regex",
  13: "javascript",
  15: "javascriptWithScope",
  16: "int",
  17: "timestamp",
  18: "long",
  19: "decimal",
  127: "maxKey",
  "-1": "minKey"
};
const TYPE_ALIASES = Object.entries(BSON_TYPES).reduce((acc, [code, name]) => {
  acc[name] = parseInt(code);
  return acc;
}, {});
function matchesType(value, typeSpec) {
  if (isArray(typeSpec)) {
    for (let i = 0; i < typeSpec.length; i++) {
      if (matchesType(value, typeSpec[i])) return true;
    }
    return false;
  }
  const typeCode = typeof typeSpec === "number" ? typeSpec : TYPE_ALIASES[typeSpec];
  const typeName = BSON_TYPES[typeCode] || typeSpec;
  if (value === null) return typeName === "null" || typeCode === 10;
  if (value === void 0) return typeName === "undefined" || typeCode === 6;
  if (typeof value === "number") {
    if (Number.isInteger(value)) return typeName === "int" || typeCode === 16;
    return typeName === "double" || typeCode === 1;
  }
  if (typeof value === "string") return typeName === "string" || typeCode === 2;
  if (typeof value === "boolean") return typeName === "bool" || typeCode === 8;
  if (value instanceof Date) return typeName === "date" || typeCode === 9;
  if (value instanceof ObjectId) return typeName === "objectId" || typeCode === 7;
  if (value instanceof RegExp) return typeName === "regex" || typeCode === 11;
  if (isArray(value)) return typeName === "array" || typeCode === 4;
  if (typeof value === "object") return typeName === "object" || typeCode === 3;
  return typeof value === typeSpec;
}
function toBitMask(positions) {
  if (isArray(positions)) {
    let mask = 0;
    for (let i = 0; i < positions.length; i++) {
      mask |= 1 << positions[i];
    }
    return mask;
  } else if (typeof positions === "number") {
    return positions;
  }
  return 0;
}
function matchesBitsAllSet(value, positions) {
  if (typeof value !== "number") return false;
  const mask = toBitMask(positions);
  return (value & mask) === mask;
}
function matchesBitsAllClear(value, positions) {
  if (typeof value !== "number") return false;
  const mask = toBitMask(positions);
  return (value & mask) === 0;
}
function matchesBitsAnySet(value, positions) {
  if (typeof value !== "number") return false;
  const mask = toBitMask(positions);
  return (value & mask) !== 0;
}
function matchesBitsAnyClear(value, positions) {
  if (typeof value !== "number") return false;
  const mask = toBitMask(positions);
  return (value & mask) !== mask;
}
function validateJsonSchema(doc, schema) {
  if (schema.type) {
    const docType = isArray(doc) ? "array" : doc === null ? "null" : typeof doc;
    if (schema.type !== docType) return false;
  }
  if (schema.required && isArray(schema.required)) {
    for (let i = 0; i < schema.required.length; i++) {
      if (!(schema.required[i] in doc)) return false;
    }
  }
  if (schema.properties) {
    for (const key in schema.properties) {
      if (!(key in doc)) return false;
      const propSchema = schema.properties[key];
      if (!validateJsonSchema(doc[key], propSchema)) return false;
    }
  }
  if (schema.minimum !== void 0 && typeof doc === "number") {
    if (doc < schema.minimum) return false;
  }
  if (schema.maximum !== void 0 && typeof doc === "number") {
    if (doc > schema.maximum) return false;
  }
  if (schema.minLength !== void 0 && typeof doc === "string") {
    if (doc.length < schema.minLength) return false;
  }
  if (schema.maxLength !== void 0 && typeof doc === "string") {
    if (doc.length > schema.maxLength) return false;
  }
  if (schema.pattern && typeof doc === "string") {
    const regex = new RegExp(schema.pattern);
    if (!regex.test(doc)) return false;
  }
  if (schema.enum && isArray(schema.enum)) {
    if (!schema.enum.includes(doc)) return false;
  }
  return true;
}
function valuesEqual(a, b) {
  if (a instanceof ObjectId && b instanceof ObjectId) {
    return a.equals(b);
  }
  return a == b;
}
function compareValues(a, b, operator) {
  let aVal = a;
  let bVal = b;
  if (a instanceof ObjectId) {
    aVal = a.toString();
  }
  if (b instanceof ObjectId) {
    bVal = b.toString();
  }
  switch (operator) {
    case ">":
      return aVal > bVal;
    case ">=":
      return aVal >= bVal;
    case "<":
      return aVal < bVal;
    case "<=":
      return aVal <= bVal;
    default:
      return false;
  }
}
function fieldValueMatches(fieldValue, checkFn) {
  if (fieldValue === void 0) return false;
  if (fieldValue === null) return checkFn(fieldValue);
  if (isArray(fieldValue)) {
    for (var i = 0; i < fieldValue.length; i++) {
      if (checkFn(fieldValue[i])) return true;
    }
    return false;
  }
  return checkFn(fieldValue);
}
function tokenizeText(text2) {
  if (typeof text2 !== "string") return [];
  const words = tokenize(text2);
  return words.map((w) => stemmer(w));
}
function text(prop, queryText) {
  if (typeof prop !== "string") return false;
  const propTokens = new Set(tokenizeText(prop));
  const queryTokens = tokenizeText(queryText);
  return queryTokens.some((term) => propTokens.has(term));
}
function textSearchDocument(doc, searchText) {
  if (!doc || typeof doc !== "object") return false;
  function searchObject(obj) {
    if (typeof obj === "string") {
      return text(obj, searchText);
    }
    if (typeof obj !== "object" || obj === null) {
      return false;
    }
    if (isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        if (searchObject(obj[i])) return true;
      }
      return false;
    }
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (searchObject(obj[key])) return true;
      }
    }
    return false;
  }
  return searchObject(doc);
}
function geoWithin(prop, query) {
  try {
    if (!Array.isArray(query) || query.length !== 2) {
      return false;
    }
    const minLon = query[0][0];
    const maxLat = query[0][1];
    const maxLon = query[1][0];
    const minLat = query[1][1];
    return isGeometryWithinBBox(prop, minLon, maxLon, minLat, maxLat);
  } catch (e) {
    return false;
  }
}
function isGeometryWithinBBox(geoJson, minLon, maxLon, minLat, maxLat) {
  if (!geoJson) return false;
  if (geoJson.type === "FeatureCollection" && geoJson.features && geoJson.features.length > 0) {
    for (const feature of geoJson.features) {
      if (feature.geometry) {
        if (!isGeometryWithinBBox(feature.geometry, minLon, maxLon, minLat, maxLat)) {
          return false;
        }
      }
    }
    return true;
  }
  if (geoJson.type === "Feature" && geoJson.geometry) {
    return isGeometryWithinBBox(geoJson.geometry, minLon, maxLon, minLat, maxLat);
  }
  if (geoJson.type === "Point" && geoJson.coordinates) {
    const [lng, lat] = geoJson.coordinates;
    if (typeof lng === "number" && typeof lat === "number") {
      return lng >= minLon && lng <= maxLon && lat >= minLat && lat <= maxLat;
    }
  }
  if (geoJson.type === "Polygon" && geoJson.coordinates && geoJson.coordinates.length > 0) {
    for (const ring of geoJson.coordinates) {
      for (const coord of ring) {
        const lng = coord[0];
        const lat = coord[1];
        if (lng < minLon || lng > maxLon || lat < minLat || lat > maxLat) {
          return false;
        }
      }
    }
    return true;
  }
  return false;
}
function extractCoordinatesFromGeoJSON(geoJson) {
  if (!geoJson) return null;
  if (geoJson.type === "FeatureCollection" && geoJson.features && geoJson.features.length > 0) {
    const feature = geoJson.features[0];
    if (feature.geometry) {
      return extractCoordinatesFromGeoJSON(feature.geometry);
    }
  }
  if (geoJson.type === "Feature" && geoJson.geometry) {
    return extractCoordinatesFromGeoJSON(geoJson.geometry);
  }
  if (geoJson.type === "Point" && geoJson.coordinates) {
    const [lng, lat] = geoJson.coordinates;
    if (typeof lng === "number" && typeof lat === "number") {
      return { lat, lng };
    }
  }
  if (geoJson.type === "Polygon" && geoJson.coordinates && geoJson.coordinates.length > 0) {
    const ring = geoJson.coordinates[0];
    if (ring.length > 0) {
      let sumLat = 0, sumLng = 0;
      for (const coord of ring) {
        sumLng += coord[0];
        sumLat += coord[1];
      }
      return {
        lat: sumLat / ring.length,
        lng: sumLng / ring.length
      };
    }
  }
  return null;
}
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function isNear(geoJson, refLng, refLat, maxDistanceMeters) {
  const coords = extractCoordinatesFromGeoJSON(geoJson);
  if (!coords) return false;
  const distanceKm = haversineDistance(coords.lat, coords.lng, refLat, refLng);
  const distanceM = distanceKm * 1e3;
  return distanceM <= maxDistanceMeters;
}
function geoIntersects(geoJson, queryGeo) {
  if (!geoJson || !queryGeo) return false;
  const queryCoords = extractCoordinatesFromGeoJSON(queryGeo);
  if (!queryCoords) return false;
  const docCoords = extractCoordinatesFromGeoJSON(geoJson);
  if (!docCoords) return false;
  if (queryGeo.type === "Polygon" && geoJson.type === "Point") {
    return pointInPolygon(docCoords.lng, docCoords.lat, queryGeo.coordinates[0]);
  }
  if (geoJson.type === "Polygon" && queryGeo.type === "Point") {
    const queryPt = queryGeo.coordinates;
    return pointInPolygon(queryPt[0], queryPt[1], geoJson.coordinates[0]);
  }
  if (geoJson.type === "Point" && queryGeo.type === "Point") {
    const dist = haversineDistance(docCoords.lat, docCoords.lng, queryCoords.lat, queryCoords.lng);
    return dist < 1e-3;
  }
  return false;
}
function pointInPolygon(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = yi > lat !== yj > lat && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
function where(doc, value) {
  if (typeof value === "function") {
    try {
      return value.call(doc);
    } catch (e) {
      return false;
    }
  } else if (typeof value === "string") {
    try {
      var fn = new Function("return " + value);
      return fn.call(doc);
    } catch (e) {
      return false;
    }
  }
  return false;
}
function tlMatches(doc, query) {
  var key = Object.keys(query)[0];
  var value = query[key];
  if (key.charAt(0) == "$") {
    if (key == "$and") return and(doc, value);
    else if (key == "$or") return or(doc, value);
    else if (key == "$not") return not(doc, value);
    else if (key == "$nor") return nor(doc, value);
    else if (key == "$where") return where(doc, value);
    else if (key == "$comment") return true;
    else if (key == "$jsonSchema") return validateJsonSchema(doc, value);
    else if (key == "$text") {
      const searchText = value.$search || value;
      return textSearchDocument(doc, searchText);
    } else if (key == "$expr") {
      try {
        return evaluateExpression(value, doc);
      } catch (e) {
        return false;
      }
    } else throw { $err: "Can't canonicalize query: BadValue unknown top level operator: " + key, code: 17287 };
  } else {
    return opMatches(doc, key, value);
  }
}
function opMatches(doc, key, value) {
  var fieldValue = getFieldValues(doc, key);
  if (typeof value == "string") return fieldValueMatches(fieldValue, function(v) {
    return valuesEqual(v, value);
  });
  else if (typeof value == "number") return fieldValueMatches(fieldValue, function(v) {
    return valuesEqual(v, value);
  });
  else if (typeof value == "boolean") return fieldValueMatches(fieldValue, function(v) {
    return valuesEqual(v, value);
  });
  else if (value instanceof ObjectId) return fieldValueMatches(fieldValue, function(v) {
    return valuesEqual(v, value);
  });
  else if (typeof value == "object") {
    if (value instanceof RegExp) return fieldValue != void 0 && fieldValueMatches(fieldValue, function(v) {
      return v && v.match(value);
    });
    else if (isArray(value)) return fieldValue != void 0 && fieldValueMatches(fieldValue, function(v) {
      return v && arrayMatches(v, value);
    });
    else {
      var keys = Object.keys(value);
      if (keys[0].charAt(0) == "$") {
        for (var i = 0; i < keys.length; i++) {
          var operator = Object.keys(value)[i];
          var operand = value[operator];
          if (operator == "$eq") {
            if (!fieldValueMatches(fieldValue, function(v) {
              return valuesEqual(v, operand);
            })) return false;
          } else if (operator == "$gt") {
            if (!fieldValueMatches(fieldValue, function(v) {
              return compareValues(v, operand, ">");
            })) return false;
          } else if (operator == "$gte") {
            if (!fieldValueMatches(fieldValue, function(v) {
              return compareValues(v, operand, ">=");
            })) return false;
          } else if (operator == "$lt") {
            if (!fieldValueMatches(fieldValue, function(v) {
              return compareValues(v, operand, "<");
            })) return false;
          } else if (operator == "$lte") {
            if (!fieldValueMatches(fieldValue, function(v) {
              return compareValues(v, operand, "<=");
            })) return false;
          } else if (operator == "$ne") {
            if (!fieldValueMatches(fieldValue, function(v) {
              return !valuesEqual(v, operand);
            })) return false;
          } else if (operator == "$in") {
            if (!fieldValueMatches(fieldValue, function(v) {
              return isIn(v, operand);
            })) return false;
          } else if (operator == "$nin") {
            if (fieldValueMatches(fieldValue, function(v) {
              return isIn(v, operand);
            })) return false;
          } else if (operator == "$exists") {
            var rawValue = getProp(doc, key);
            if (operand ? rawValue == void 0 : rawValue != void 0) return false;
          } else if (operator == "$type") {
            if (fieldValue === void 0) {
              const expectedTypeCode = typeof operand === "number" ? operand : TYPE_ALIASES[operand];
              if (expectedTypeCode !== 6) return false;
            } else {
              if (!matchesType(fieldValue, operand)) return false;
            }
          } else if (operator == "$mod") {
            if (operand.length != 2) throw { $err: "Can't canonicalize query: BadValue malformed mod, not enough elements", code: 17287 };
            if (!fieldValueMatches(fieldValue, function(v) {
              return v != void 0 && v % operand[0] == operand[1];
            })) return false;
          } else if (operator == "$regex") {
            var pattern = operand;
            var flags = value.$options || "";
            var regex = typeof pattern === "string" ? new RegExp(pattern, flags) : pattern;
            if (!fieldValueMatches(fieldValue, function(v) {
              return v != void 0 && regex.test(v);
            })) return false;
          } else if (operator == "$options") {
            continue;
          } else if (operator == "$text") {
            if (!fieldValueMatches(fieldValue, function(v) {
              return v != void 0 && text(v, operand);
            })) return false;
          } else if (operator == "$expr") {
            try {
              const result = evaluateExpression(operand, doc);
              if (!result) return false;
            } catch (e) {
              return false;
            }
          } else if (operator == "$geoWithin") {
            if (!fieldValueMatches(fieldValue, function(v) {
              return v != void 0 && geoWithin(v, operand);
            })) return false;
          } else if (operator == "$near" || operator == "$nearSphere") {
            let coordinates;
            if (operand.$geometry) {
              coordinates = operand.$geometry.coordinates;
            } else if (operand.coordinates) {
              coordinates = operand.coordinates;
            } else if (Array.isArray(operand)) {
              coordinates = operand;
            }
            if (coordinates && coordinates.length >= 2) {
              const [lng, lat] = coordinates;
              const maxDistanceMeters = operand.$maxDistance || 1e6;
              if (!fieldValueMatches(fieldValue, function(v) {
                return v != void 0 && isNear(v, lng, lat, maxDistanceMeters);
              })) return false;
            } else {
              return false;
            }
          } else if (operator == "$geoIntersects") {
            const geometry = operand.$geometry || operand;
            if (!fieldValueMatches(fieldValue, function(v) {
              return v != void 0 && geoIntersects(v, geometry);
            })) return false;
          } else if (operator == "$not") {
            if (opMatches(doc, key, operand)) return false;
          } else if (operator == "$all") {
            var arrayFieldValue = getProp(doc, key);
            if (arrayFieldValue == void 0 || !isArray(arrayFieldValue)) return false;
            for (var j = 0; j < operand.length; j++) {
              if (!isIn(operand[j], arrayFieldValue)) return false;
            }
          } else if (operator == "$elemMatch") {
            var arrayFieldValue = getProp(doc, key);
            if (arrayFieldValue == void 0 || !isArray(arrayFieldValue)) return false;
            var found = false;
            for (var j = 0; j < arrayFieldValue.length; j++) {
              var element = arrayFieldValue[j];
              if (typeof element === "object" && !isArray(element)) {
                if (matches(element, operand)) {
                  found = true;
                  break;
                }
              } else {
                var matchesPrimitive = true;
                var opKeys = Object.keys(operand);
                for (var k = 0; k < opKeys.length; k++) {
                  var op = opKeys[k];
                  var opValue = operand[op];
                  if (op == "$gte" && !(element >= opValue)) matchesPrimitive = false;
                  else if (op == "$gt" && !(element > opValue)) matchesPrimitive = false;
                  else if (op == "$lte" && !(element <= opValue)) matchesPrimitive = false;
                  else if (op == "$lt" && !(element < opValue)) matchesPrimitive = false;
                  else if (op == "$eq" && !(element == opValue)) matchesPrimitive = false;
                  else if (op == "$ne" && !(element != opValue)) matchesPrimitive = false;
                  else if (op == "$in" && !isIn(element, opValue)) matchesPrimitive = false;
                  else if (op == "$nin" && isIn(element, opValue)) matchesPrimitive = false;
                }
                if (matchesPrimitive) {
                  found = true;
                  break;
                }
              }
            }
            if (!found) return false;
          } else if (operator == "$size") {
            var sizeFieldValue = getProp(doc, key);
            if (sizeFieldValue == void 0 || !isArray(sizeFieldValue)) return false;
            if (sizeFieldValue.length != operand) return false;
          } else if (operator == "$bitsAllSet") {
            if (!fieldValueMatches(fieldValue, function(v) {
              return matchesBitsAllSet(v, operand);
            })) return false;
          } else if (operator == "$bitsAllClear") {
            if (!fieldValueMatches(fieldValue, function(v) {
              return matchesBitsAllClear(v, operand);
            })) return false;
          } else if (operator == "$bitsAnySet") {
            if (!fieldValueMatches(fieldValue, function(v) {
              return matchesBitsAnySet(v, operand);
            })) return false;
          } else if (operator == "$bitsAnyClear") {
            if (!fieldValueMatches(fieldValue, function(v) {
              return matchesBitsAnyClear(v, operand);
            })) return false;
          } else {
            throw { $err: "Can't canonicalize query: BadValue unknown operator: " + operator, code: 17287 };
          }
        }
        return true;
      } else {
        return getProp(doc, key) && objectMatches(getProp(doc, key), value);
      }
    }
  }
}
function not(doc, value) {
  return !tlMatches(doc, value);
}
function and(doc, els) {
  for (var i = 0; i < els.length; i++) {
    if (!tlMatches(doc, els[i])) {
      return false;
    }
  }
  return true;
}
function or(doc, els) {
  for (var i = 0; i < els.length; i++) {
    if (tlMatches(doc, els[i])) return true;
  }
  return false;
}
function nor(doc, els) {
  for (var i = 0; i < els.length; i++) {
    if (tlMatches(doc, els[i])) return false;
  }
  return true;
}
function matches(doc, query) {
  return and(doc, toArray(query));
}
class ChangeStream extends eventsExports.EventEmitter {
  constructor(target, pipeline = [], options = {}) {
    super();
    this.target = target;
    this.pipeline = pipeline;
    this.options = options;
    this.closed = false;
    this._listeners = /* @__PURE__ */ new Map();
    this._changeCounter = 0;
    this._startWatching();
  }
  /**
   * Start watching for changes
   * @private
   */
  _startWatching() {
    if (this.closed) return;
    const collections = this._getCollectionsToWatch();
    for (const collection of collections) {
      this._watchCollection(collection);
    }
    if (this.target.constructor.name === "Server") {
      this._interceptServerDBCreation();
    }
    if (this.target.constructor.name === "DB") {
      this._interceptDBCollectionCreation();
    }
    if (this.target.constructor.name === "MongoClient") {
      this._interceptClientDBCreation();
    }
  }
  /**
   * Get collections to watch based on target type
   * @private
   */
  _getCollectionsToWatch() {
    const collections = [];
    if (this.target.constructor.name === "Server") {
      for (const [dbName, db] of this.target.databases) {
        const collectionNames = db.getCollectionNames();
        for (const name of collectionNames) {
          const collection = db[name];
          if (collection && collection.isCollection) {
            collections.push(collection);
          }
        }
      }
      return collections;
    }
    if (this.target.constructor.name === "MongoClient") {
      this._monitorClient();
      return collections;
    }
    if (this.target.constructor.name === "DB") {
      const collectionNames = this.target.getCollectionNames();
      for (const name of collectionNames) {
        const collection = this.target[name];
        if (collection && collection.isCollection) {
          collections.push(collection);
        }
      }
      this._monitorDB();
    }
    if (this.target.isCollection) {
      collections.push(this.target);
    }
    return collections;
  }
  /**
   * Watch a specific collection for changes
   * @private
   */
  _watchCollection(collection) {
    if (this.closed) return;
    if (!collection) return;
    if (typeof collection.on !== "function") return;
    if (!collection.isCollection) return;
    if (this._listeners.has(collection)) return;
    const handlers = {
      insert: (doc) => this._emitChange("insert", collection, doc),
      update: (doc, updateDescription) => this._emitChange("update", collection, doc, updateDescription),
      replace: (doc) => this._emitChange("replace", collection, doc),
      delete: (doc) => this._emitChange("delete", collection, doc)
    };
    this._listeners.set(collection, handlers);
    collection.on("insert", handlers.insert);
    collection.on("update", handlers.update);
    collection.on("replace", handlers.replace);
    collection.on("delete", handlers.delete);
  }
  /**
   * Emit a change event
   * @private
   */
  _emitChange(operationType, collection, doc, updateDescription = null) {
    if (this.closed) return;
    const changeEvent = this._createChangeEvent(
      operationType,
      collection,
      doc,
      updateDescription
    );
    if (!this._matchesPipeline(changeEvent)) {
      return;
    }
    this.emit("change", changeEvent);
  }
  /**
   * Create a MongoDB-compatible change event document
   * @private
   */
  _createChangeEvent(operationType, collection, doc, updateDescription) {
    const event = {
      _id: {
        _data: btoa(String(++this._changeCounter))
      },
      operationType,
      clusterTime: /* @__PURE__ */ new Date(),
      ns: {
        db: collection.db.dbName,
        coll: collection.name
      },
      documentKey: {
        _id: doc._id
      }
    };
    switch (operationType) {
      case "insert":
        event.fullDocument = doc;
        break;
      case "update":
        event.updateDescription = updateDescription || {
          updatedFields: {},
          removedFields: [],
          truncatedArrays: []
        };
        if (this.options.fullDocument === "updateLookup") {
          event.fullDocument = doc;
        }
        break;
      case "replace":
        event.fullDocument = doc;
        break;
    }
    return event;
  }
  /**
   * Check if change event matches pipeline filters
   * @private
   */
  _matchesPipeline(changeEvent) {
    if (!this.pipeline || this.pipeline.length === 0) {
      return true;
    }
    for (const stage of this.pipeline) {
      if (stage.$match) {
        if (!matches(changeEvent, stage.$match)) {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * Get nested value from object using dot notation
   * @private
   */
  _getNestedValue(obj, path) {
    return path.split(".").reduce((current, part) => current?.[part], obj);
  }
  /**
   * Monitor client for new databases/collections (simplified)
   * @private
   */
  _monitorClient() {
  }
  /**
   * Intercept DB creation on a MongoClient
   * @private
   */
  _interceptClientDBCreation() {
    const client = this.target;
    const originalDb = client.db.bind(client);
    const self = this;
    this._watchedDBs = /* @__PURE__ */ new Map();
    client.db = function(name, opts) {
      const database = originalDb(name, opts);
      const dbName = database.dbName;
      if (!self._watchedDBs.has(dbName)) {
        self._watchedDBs.set(dbName, database);
        const collectionNames = database.getCollectionNames();
        for (const colName of collectionNames) {
          const col = database[colName];
          if (col && col.isCollection && !self._listeners.has(col)) {
            self._watchCollection(col);
          }
        }
        self._interceptDBCollectionCreationForClient(database);
      }
      return database;
    };
    this._originalClientMethods = { db: originalDb };
  }
  /**
   * Intercept DB creation on a Server
   * @private
   */
  _interceptServerDBCreation() {
    const server = this.target;
    const originalGetDB = server._getDB.bind(server);
    const self = this;
    this._watchedDBs = /* @__PURE__ */ new Map();
    server._getDB = function(dbName) {
      const db = originalGetDB(dbName);
      if (!self._watchedDBs.has(dbName)) {
        self._watchedDBs.set(dbName, db);
        const collectionNames = db.getCollectionNames();
        for (const colName of collectionNames) {
          const col = db[colName];
          if (col && col.isCollection && !self._listeners.has(col)) {
            self._watchCollection(col);
          }
        }
        self._interceptDBCollectionCreationForServer(db);
      }
      return db;
    };
    this._originalServerMethods = { _getDB: originalGetDB };
  }
  /**
   * Intercept collection creation for a database in server watch mode
   * @private
   */
  _interceptDBCollectionCreationForServer(db) {
    const originalCollection = db.collection.bind(db);
    const originalCreateCollection = db.createCollection.bind(db);
    const self = this;
    db.collection = function(name) {
      const col = originalCollection(name);
      if (col && col.isCollection && !self._listeners.has(col)) {
        self._watchCollection(col);
      }
      return col;
    };
    db.createCollection = function(name) {
      originalCreateCollection(name);
      const col = db[name];
      if (col && col.isCollection && !self._listeners.has(col)) {
        self._watchCollection(col);
      }
    };
  }
  /**
   * Intercept collection creation for a database in client watch mode
   * @private
   */
  _interceptDBCollectionCreationForClient(db) {
    const originalCollection = db.collection.bind(db);
    const originalCreateCollection = db.createCollection.bind(db);
    const self = this;
    db.collection = function(name) {
      const col = originalCollection(name);
      if (col && col.isCollection && !self._listeners.has(col)) {
        self._watchCollection(col);
      }
      return col;
    };
    db.createCollection = function(name) {
      originalCreateCollection(name);
      const col = db[name];
      if (col && col.isCollection && !self._listeners.has(col)) {
        self._watchCollection(col);
      }
    };
  }
  /**
   * Monitor database for new collections
   * @private
   */
  _monitorDB() {
  }
  /**
   * Intercept new collection creation on a DB
   * @private
   */
  _interceptDBCollectionCreation() {
    const db = this.target;
    const originalCollection = db.collection.bind(db);
    const originalCreateCollection = db.createCollection.bind(db);
    const self = this;
    db.collection = function(name) {
      const col = originalCollection(name);
      if (col && col.isCollection && !self._listeners.has(col)) {
        self._watchCollection(col);
      }
      return col;
    };
    db.createCollection = function(name) {
      originalCreateCollection(name);
      const col = db[name];
      if (col && col.isCollection && !self._listeners.has(col)) {
        self._watchCollection(col);
      }
    };
    this._originalDBMethods = { collection: originalCollection, createCollection: originalCreateCollection };
  }
  /**
   * Close the change stream
   */
  close() {
    if (this.closed) return;
    this.closed = true;
    for (const [collection, handlers] of this._listeners) {
      collection.off("insert", handlers.insert);
      collection.off("update", handlers.update);
      collection.off("replace", handlers.replace);
      collection.off("delete", handlers.delete);
    }
    this._listeners.clear();
    if (this._originalServerMethods && this.target.constructor.name === "Server") {
      this.target._getDB = this._originalServerMethods._getDB;
    }
    if (this._originalDBMethods && this.target.constructor.name === "DB") {
      this.target.collection = this._originalDBMethods.collection;
      this.target.createCollection = this._originalDBMethods.createCollection;
    }
    if (this._originalClientMethods && this.target.constructor.name === "MongoClient") {
      this.target.db = this._originalClientMethods.db;
    }
    this.emit("close");
    this.removeAllListeners();
  }
  /**
   * Check if the stream is closed
   */
  get isClosed() {
    return this.closed;
  }
  /**
   * Async iterator support for for-await-of loops
   */
  async *[Symbol.asyncIterator]() {
    const queue = [];
    let resolveNext = null;
    let streamClosed = false;
    const onChange = (change) => {
      if (resolveNext) {
        resolveNext({ value: change, done: false });
        resolveNext = null;
      } else {
        queue.push(change);
      }
    };
    const onClose = () => {
      streamClosed = true;
      if (resolveNext) {
        resolveNext({ done: true });
        resolveNext = null;
      }
    };
    const onError = (error) => {
      if (resolveNext) {
        resolveNext(Promise.reject(error));
        resolveNext = null;
      }
    };
    this.on("change", onChange);
    this.on("close", onClose);
    this.on("error", onError);
    try {
      while (!streamClosed) {
        if (queue.length > 0) {
          yield queue.shift();
        } else {
          const next = await new Promise((resolve) => {
            resolveNext = resolve;
            if (streamClosed) {
              resolve({ done: true });
            }
          });
          if (next.done) break;
          yield next.value;
        }
      }
    } finally {
      this.off("change", onChange);
      this.off("close", onClose);
      this.off("error", onError);
    }
  }
  /**
   * Get next change (for compatibility)
   */
  async next() {
    return new Promise((resolve, reject) => {
      const onChange = (change) => {
        cleanup();
        resolve(change);
      };
      const onClose = () => {
        cleanup();
        resolve(null);
      };
      const onError = (error) => {
        cleanup();
        reject(error);
      };
      const cleanup = () => {
        this.off("change", onChange);
        this.off("close", onClose);
        this.off("error", onError);
      };
      if (this.closed) {
        resolve(null);
        return;
      }
      this.once("change", onChange);
      this.once("close", onClose);
      this.once("error", onError);
    });
  }
}
function serializePayload(obj) {
  if (obj === null || obj === void 0) return obj;
  if (typeof obj === "function") {
    return { __function: obj.toString() };
  }
  if (obj instanceof ObjectId) {
    return { __objectId: obj.toString() };
  }
  if (obj instanceof Date) {
    return { __date: obj.toISOString() };
  }
  if (Array.isArray(obj)) {
    return obj.map(serializePayload);
  }
  if (typeof obj === "object") {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializePayload(value);
    }
    return result;
  }
  return obj;
}
function deserializePayload(obj) {
  if (obj === null || obj === void 0) return obj;
  if (typeof obj === "object" && obj.__function) {
    return typeof obj.__function === "string" ? `(${obj.__function}).call(this)` : void 0;
  }
  if (typeof obj === "object" && obj.__objectId) {
    return new ObjectId(obj.__objectId);
  }
  if (typeof obj === "object" && obj.__date) {
    return new Date(obj.__date);
  }
  if (Array.isArray(obj)) {
    return obj.map(deserializePayload);
  }
  if (typeof obj === "object") {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = deserializePayload(value);
    }
    return result;
  }
  return obj;
}
class WorkerBridge extends eventsExports.EventEmitter {
  constructor(worker) {
    super();
    this.worker = worker;
    this._nextId = 1;
    this._pending = /* @__PURE__ */ new Map();
    this._terminating = false;
    this._handleMessage = this._handleMessage.bind(this);
    this._handleError = this._handleError.bind(this);
    this._attach();
  }
  static async create(options = {}) {
    if (typeof window !== "undefined" && typeof globalThis.Worker !== "undefined") {
      return new BrowserWorkerBridge(options);
    }
    const { Worker: NodeWorker } = await import("worker_threads");
    const { fileURLToPath } = await import("url");
    let workerPath = options.workerPath;
    if (!workerPath) {
      const buildUrl = new URL("data:text/javascript;base64,dmFyIGV2ZW50cyA9IHsgZXhwb3J0czoge30gfTsKdmFyIGhhc1JlcXVpcmVkRXZlbnRzOwpmdW5jdGlvbiByZXF1aXJlRXZlbnRzKCkgewogIGlmIChoYXNSZXF1aXJlZEV2ZW50cykgcmV0dXJuIGV2ZW50cy5leHBvcnRzOwogIGhhc1JlcXVpcmVkRXZlbnRzID0gMTsKICB2YXIgUiA9IHR5cGVvZiBSZWZsZWN0ID09PSAib2JqZWN0IiA/IFJlZmxlY3QgOiBudWxsOwogIHZhciBSZWZsZWN0QXBwbHkgPSBSICYmIHR5cGVvZiBSLmFwcGx5ID09PSAiZnVuY3Rpb24iID8gUi5hcHBseSA6IGZ1bmN0aW9uIFJlZmxlY3RBcHBseTIodGFyZ2V0LCByZWNlaXZlciwgYXJncykgewogICAgcmV0dXJuIEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseS5jYWxsKHRhcmdldCwgcmVjZWl2ZXIsIGFyZ3MpOwogIH07CiAgdmFyIFJlZmxlY3RPd25LZXlzOwogIGlmIChSICYmIHR5cGVvZiBSLm93bktleXMgPT09ICJmdW5jdGlvbiIpIHsKICAgIFJlZmxlY3RPd25LZXlzID0gUi5vd25LZXlzOwogIH0gZWxzZSBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykgewogICAgUmVmbGVjdE93bktleXMgPSBmdW5jdGlvbiBSZWZsZWN0T3duS2V5czIodGFyZ2V0KSB7CiAgICAgIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0YXJnZXQpLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKHRhcmdldCkpOwogICAgfTsKICB9IGVsc2UgewogICAgUmVmbGVjdE93bktleXMgPSBmdW5jdGlvbiBSZWZsZWN0T3duS2V5czIodGFyZ2V0KSB7CiAgICAgIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0YXJnZXQpOwogICAgfTsKICB9CiAgZnVuY3Rpb24gUHJvY2Vzc0VtaXRXYXJuaW5nKHdhcm5pbmcpIHsKICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUud2FybikgY29uc29sZS53YXJuKHdhcm5pbmcpOwogIH0KICB2YXIgTnVtYmVySXNOYU4gPSBOdW1iZXIuaXNOYU4gfHwgZnVuY3Rpb24gTnVtYmVySXNOYU4yKHZhbHVlKSB7CiAgICByZXR1cm4gdmFsdWUgIT09IHZhbHVlOwogIH07CiAgZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkgewogICAgRXZlbnRFbWl0dGVyLmluaXQuY2FsbCh0aGlzKTsKICB9CiAgZXZlbnRzLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7CiAgZXZlbnRzLmV4cG9ydHMub25jZSA9IG9uY2U7CiAgRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjsKICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB2b2lkIDA7CiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzQ291bnQgPSAwOwogIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHZvaWQgMDsKICB2YXIgZGVmYXVsdE1heExpc3RlbmVycyA9IDEwOwogIGZ1bmN0aW9uIGNoZWNrTGlzdGVuZXIobGlzdGVuZXIpIHsKICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICJmdW5jdGlvbiIpIHsKICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlICJsaXN0ZW5lciIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIEZ1bmN0aW9uLiBSZWNlaXZlZCB0eXBlICcgKyB0eXBlb2YgbGlzdGVuZXIpOwogICAgfQogIH0KICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXZlbnRFbWl0dGVyLCAiZGVmYXVsdE1heExpc3RlbmVycyIsIHsKICAgIGVudW1lcmFibGU6IHRydWUsCiAgICBnZXQ6IGZ1bmN0aW9uKCkgewogICAgICByZXR1cm4gZGVmYXVsdE1heExpc3RlbmVyczsKICAgIH0sCiAgICBzZXQ6IGZ1bmN0aW9uKGFyZykgewogICAgICBpZiAodHlwZW9mIGFyZyAhPT0gIm51bWJlciIgfHwgYXJnIDwgMCB8fCBOdW1iZXJJc05hTihhcmcpKSB7CiAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RoZSB2YWx1ZSBvZiAiZGVmYXVsdE1heExpc3RlbmVycyIgaXMgb3V0IG9mIHJhbmdlLiBJdCBtdXN0IGJlIGEgbm9uLW5lZ2F0aXZlIG51bWJlci4gUmVjZWl2ZWQgJyArIGFyZyArICIuIik7CiAgICAgIH0KICAgICAgZGVmYXVsdE1heExpc3RlbmVycyA9IGFyZzsKICAgIH0KICB9KTsKICBFdmVudEVtaXR0ZXIuaW5pdCA9IGZ1bmN0aW9uKCkgewogICAgaWYgKHRoaXMuX2V2ZW50cyA9PT0gdm9pZCAwIHx8IHRoaXMuX2V2ZW50cyA9PT0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpLl9ldmVudHMpIHsKICAgICAgdGhpcy5fZXZlbnRzID0gLyogQF9fUFVSRV9fICovIE9iamVjdC5jcmVhdGUobnVsbCk7CiAgICAgIHRoaXMuX2V2ZW50c0NvdW50ID0gMDsKICAgIH0KICAgIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB2b2lkIDA7CiAgfTsKICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uIHNldE1heExpc3RlbmVycyhuKSB7CiAgICBpZiAodHlwZW9mIG4gIT09ICJudW1iZXIiIHx8IG4gPCAwIHx8IE51bWJlcklzTmFOKG4pKSB7CiAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdUaGUgdmFsdWUgb2YgIm4iIGlzIG91dCBvZiByYW5nZS4gSXQgbXVzdCBiZSBhIG5vbi1uZWdhdGl2ZSBudW1iZXIuIFJlY2VpdmVkICcgKyBuICsgIi4iKTsKICAgIH0KICAgIHRoaXMuX21heExpc3RlbmVycyA9IG47CiAgICByZXR1cm4gdGhpczsKICB9OwogIGZ1bmN0aW9uIF9nZXRNYXhMaXN0ZW5lcnModGhhdCkgewogICAgaWYgKHRoYXQuX21heExpc3RlbmVycyA9PT0gdm9pZCAwKQogICAgICByZXR1cm4gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7CiAgICByZXR1cm4gdGhhdC5fbWF4TGlzdGVuZXJzOwogIH0KICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmdldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uIGdldE1heExpc3RlbmVycygpIHsKICAgIHJldHVybiBfZ2V0TWF4TGlzdGVuZXJzKHRoaXMpOwogIH07CiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gZW1pdCh0eXBlKSB7CiAgICB2YXIgYXJncyA9IFtdOwogICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIGFyZ3MucHVzaChhcmd1bWVudHNbaV0pOwogICAgdmFyIGRvRXJyb3IgPSB0eXBlID09PSAiZXJyb3IiOwogICAgdmFyIGV2ZW50czIgPSB0aGlzLl9ldmVudHM7CiAgICBpZiAoZXZlbnRzMiAhPT0gdm9pZCAwKQogICAgICBkb0Vycm9yID0gZG9FcnJvciAmJiBldmVudHMyLmVycm9yID09PSB2b2lkIDA7CiAgICBlbHNlIGlmICghZG9FcnJvcikKICAgICAgcmV0dXJuIGZhbHNlOwogICAgaWYgKGRvRXJyb3IpIHsKICAgICAgdmFyIGVyOwogICAgICBpZiAoYXJncy5sZW5ndGggPiAwKQogICAgICAgIGVyID0gYXJnc1swXTsKICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHsKICAgICAgICB0aHJvdyBlcjsKICAgICAgfQogICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCJVbmhhbmRsZWQgZXJyb3IuIiArIChlciA/ICIgKCIgKyBlci5tZXNzYWdlICsgIikiIDogIiIpKTsKICAgICAgZXJyLmNvbnRleHQgPSBlcjsKICAgICAgdGhyb3cgZXJyOwogICAgfQogICAgdmFyIGhhbmRsZXIgPSBldmVudHMyW3R5cGVdOwogICAgaWYgKGhhbmRsZXIgPT09IHZvaWQgMCkKICAgICAgcmV0dXJuIGZhbHNlOwogICAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSAiZnVuY3Rpb24iKSB7CiAgICAgIFJlZmxlY3RBcHBseShoYW5kbGVyLCB0aGlzLCBhcmdzKTsKICAgIH0gZWxzZSB7CiAgICAgIHZhciBsZW4gPSBoYW5kbGVyLmxlbmd0aDsKICAgICAgdmFyIGxpc3RlbmVycyA9IGFycmF5Q2xvbmUoaGFuZGxlciwgbGVuKTsKICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkKICAgICAgICBSZWZsZWN0QXBwbHkobGlzdGVuZXJzW2ldLCB0aGlzLCBhcmdzKTsKICAgIH0KICAgIHJldHVybiB0cnVlOwogIH07CiAgZnVuY3Rpb24gX2FkZExpc3RlbmVyKHRhcmdldCwgdHlwZSwgbGlzdGVuZXIsIHByZXBlbmQpIHsKICAgIHZhciBtOwogICAgdmFyIGV2ZW50czI7CiAgICB2YXIgZXhpc3Rpbmc7CiAgICBjaGVja0xpc3RlbmVyKGxpc3RlbmVyKTsKICAgIGV2ZW50czIgPSB0YXJnZXQuX2V2ZW50czsKICAgIGlmIChldmVudHMyID09PSB2b2lkIDApIHsKICAgICAgZXZlbnRzMiA9IHRhcmdldC5fZXZlbnRzID0gLyogQF9fUFVSRV9fICovIE9iamVjdC5jcmVhdGUobnVsbCk7CiAgICAgIHRhcmdldC5fZXZlbnRzQ291bnQgPSAwOwogICAgfSBlbHNlIHsKICAgICAgaWYgKGV2ZW50czIubmV3TGlzdGVuZXIgIT09IHZvaWQgMCkgewogICAgICAgIHRhcmdldC5lbWl0KAogICAgICAgICAgIm5ld0xpc3RlbmVyIiwKICAgICAgICAgIHR5cGUsCiAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA/IGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIKICAgICAgICApOwogICAgICAgIGV2ZW50czIgPSB0YXJnZXQuX2V2ZW50czsKICAgICAgfQogICAgICBleGlzdGluZyA9IGV2ZW50czJbdHlwZV07CiAgICB9CiAgICBpZiAoZXhpc3RpbmcgPT09IHZvaWQgMCkgewogICAgICBleGlzdGluZyA9IGV2ZW50czJbdHlwZV0gPSBsaXN0ZW5lcjsKICAgICAgKyt0YXJnZXQuX2V2ZW50c0NvdW50OwogICAgfSBlbHNlIHsKICAgICAgaWYgKHR5cGVvZiBleGlzdGluZyA9PT0gImZ1bmN0aW9uIikgewogICAgICAgIGV4aXN0aW5nID0gZXZlbnRzMlt0eXBlXSA9IHByZXBlbmQgPyBbbGlzdGVuZXIsIGV4aXN0aW5nXSA6IFtleGlzdGluZywgbGlzdGVuZXJdOwogICAgICB9IGVsc2UgaWYgKHByZXBlbmQpIHsKICAgICAgICBleGlzdGluZy51bnNoaWZ0KGxpc3RlbmVyKTsKICAgICAgfSBlbHNlIHsKICAgICAgICBleGlzdGluZy5wdXNoKGxpc3RlbmVyKTsKICAgICAgfQogICAgICBtID0gX2dldE1heExpc3RlbmVycyh0YXJnZXQpOwogICAgICBpZiAobSA+IDAgJiYgZXhpc3RpbmcubGVuZ3RoID4gbSAmJiAhZXhpc3Rpbmcud2FybmVkKSB7CiAgICAgICAgZXhpc3Rpbmcud2FybmVkID0gdHJ1ZTsKICAgICAgICB2YXIgdyA9IG5ldyBFcnJvcigiUG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSBsZWFrIGRldGVjdGVkLiAiICsgZXhpc3RpbmcubGVuZ3RoICsgIiAiICsgU3RyaW5nKHR5cGUpICsgIiBsaXN0ZW5lcnMgYWRkZWQuIFVzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0Iik7CiAgICAgICAgdy5uYW1lID0gIk1heExpc3RlbmVyc0V4Y2VlZGVkV2FybmluZyI7CiAgICAgICAgdy5lbWl0dGVyID0gdGFyZ2V0OwogICAgICAgIHcudHlwZSA9IHR5cGU7CiAgICAgICAgdy5jb3VudCA9IGV4aXN0aW5nLmxlbmd0aDsKICAgICAgICBQcm9jZXNzRW1pdFdhcm5pbmcodyk7CiAgICAgIH0KICAgIH0KICAgIHJldHVybiB0YXJnZXQ7CiAgfQogIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbiBhZGRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcikgewogICAgcmV0dXJuIF9hZGRMaXN0ZW5lcih0aGlzLCB0eXBlLCBsaXN0ZW5lciwgZmFsc2UpOwogIH07CiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7CiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5wcmVwZW5kTGlzdGVuZXIgPSBmdW5jdGlvbiBwcmVwZW5kTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIpIHsKICAgIHJldHVybiBfYWRkTGlzdGVuZXIodGhpcywgdHlwZSwgbGlzdGVuZXIsIHRydWUpOwogIH07CiAgZnVuY3Rpb24gb25jZVdyYXBwZXIoKSB7CiAgICBpZiAoIXRoaXMuZmlyZWQpIHsKICAgICAgdGhpcy50YXJnZXQucmVtb3ZlTGlzdGVuZXIodGhpcy50eXBlLCB0aGlzLndyYXBGbik7CiAgICAgIHRoaXMuZmlyZWQgPSB0cnVlOwogICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkKICAgICAgICByZXR1cm4gdGhpcy5saXN0ZW5lci5jYWxsKHRoaXMudGFyZ2V0KTsKICAgICAgcmV0dXJuIHRoaXMubGlzdGVuZXIuYXBwbHkodGhpcy50YXJnZXQsIGFyZ3VtZW50cyk7CiAgICB9CiAgfQogIGZ1bmN0aW9uIF9vbmNlV3JhcCh0YXJnZXQsIHR5cGUsIGxpc3RlbmVyKSB7CiAgICB2YXIgc3RhdGUgPSB7IGZpcmVkOiBmYWxzZSwgd3JhcEZuOiB2b2lkIDAsIHRhcmdldCwgdHlwZSwgbGlzdGVuZXIgfTsKICAgIHZhciB3cmFwcGVkID0gb25jZVdyYXBwZXIuYmluZChzdGF0ZSk7CiAgICB3cmFwcGVkLmxpc3RlbmVyID0gbGlzdGVuZXI7CiAgICBzdGF0ZS53cmFwRm4gPSB3cmFwcGVkOwogICAgcmV0dXJuIHdyYXBwZWQ7CiAgfQogIEV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uIG9uY2UyKHR5cGUsIGxpc3RlbmVyKSB7CiAgICBjaGVja0xpc3RlbmVyKGxpc3RlbmVyKTsKICAgIHRoaXMub24odHlwZSwgX29uY2VXcmFwKHRoaXMsIHR5cGUsIGxpc3RlbmVyKSk7CiAgICByZXR1cm4gdGhpczsKICB9OwogIEV2ZW50RW1pdHRlci5wcm90b3R5cGUucHJlcGVuZE9uY2VMaXN0ZW5lciA9IGZ1bmN0aW9uIHByZXBlbmRPbmNlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIpIHsKICAgIGNoZWNrTGlzdGVuZXIobGlzdGVuZXIpOwogICAgdGhpcy5wcmVwZW5kTGlzdGVuZXIodHlwZSwgX29uY2VXcmFwKHRoaXMsIHR5cGUsIGxpc3RlbmVyKSk7CiAgICByZXR1cm4gdGhpczsKICB9OwogIEV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcikgewogICAgdmFyIGxpc3QsIGV2ZW50czIsIHBvc2l0aW9uLCBpLCBvcmlnaW5hbExpc3RlbmVyOwogICAgY2hlY2tMaXN0ZW5lcihsaXN0ZW5lcik7CiAgICBldmVudHMyID0gdGhpcy5fZXZlbnRzOwogICAgaWYgKGV2ZW50czIgPT09IHZvaWQgMCkKICAgICAgcmV0dXJuIHRoaXM7CiAgICBsaXN0ID0gZXZlbnRzMlt0eXBlXTsKICAgIGlmIChsaXN0ID09PSB2b2lkIDApCiAgICAgIHJldHVybiB0aGlzOwogICAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8IGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSB7CiAgICAgIGlmICgtLXRoaXMuX2V2ZW50c0NvdW50ID09PSAwKQogICAgICAgIHRoaXMuX2V2ZW50cyA9IC8qIEBfX1BVUkVfXyAqLyBPYmplY3QuY3JlYXRlKG51bGwpOwogICAgICBlbHNlIHsKICAgICAgICBkZWxldGUgZXZlbnRzMlt0eXBlXTsKICAgICAgICBpZiAoZXZlbnRzMi5yZW1vdmVMaXN0ZW5lcikKICAgICAgICAgIHRoaXMuZW1pdCgicmVtb3ZlTGlzdGVuZXIiLCB0eXBlLCBsaXN0Lmxpc3RlbmVyIHx8IGxpc3RlbmVyKTsKICAgICAgfQogICAgfSBlbHNlIGlmICh0eXBlb2YgbGlzdCAhPT0gImZ1bmN0aW9uIikgewogICAgICBwb3NpdGlvbiA9IC0xOwogICAgICBmb3IgKGkgPSBsaXN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7CiAgICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8IGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSB7CiAgICAgICAgICBvcmlnaW5hbExpc3RlbmVyID0gbGlzdFtpXS5saXN0ZW5lcjsKICAgICAgICAgIHBvc2l0aW9uID0gaTsKICAgICAgICAgIGJyZWFrOwogICAgICAgIH0KICAgICAgfQogICAgICBpZiAocG9zaXRpb24gPCAwKQogICAgICAgIHJldHVybiB0aGlzOwogICAgICBpZiAocG9zaXRpb24gPT09IDApCiAgICAgICAgbGlzdC5zaGlmdCgpOwogICAgICBlbHNlIHsKICAgICAgICBzcGxpY2VPbmUobGlzdCwgcG9zaXRpb24pOwogICAgICB9CiAgICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkKICAgICAgICBldmVudHMyW3R5cGVdID0gbGlzdFswXTsKICAgICAgaWYgKGV2ZW50czIucmVtb3ZlTGlzdGVuZXIgIT09IHZvaWQgMCkKICAgICAgICB0aGlzLmVtaXQoInJlbW92ZUxpc3RlbmVyIiwgdHlwZSwgb3JpZ2luYWxMaXN0ZW5lciB8fCBsaXN0ZW5lcik7CiAgICB9CiAgICByZXR1cm4gdGhpczsKICB9OwogIEV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lcjsKICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUFsbExpc3RlbmVycyh0eXBlKSB7CiAgICB2YXIgbGlzdGVuZXJzLCBldmVudHMyLCBpOwogICAgZXZlbnRzMiA9IHRoaXMuX2V2ZW50czsKICAgIGlmIChldmVudHMyID09PSB2b2lkIDApCiAgICAgIHJldHVybiB0aGlzOwogICAgaWYgKGV2ZW50czIucmVtb3ZlTGlzdGVuZXIgPT09IHZvaWQgMCkgewogICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgewogICAgICAgIHRoaXMuX2V2ZW50cyA9IC8qIEBfX1BVUkVfXyAqLyBPYmplY3QuY3JlYXRlKG51bGwpOwogICAgICAgIHRoaXMuX2V2ZW50c0NvdW50ID0gMDsKICAgICAgfSBlbHNlIGlmIChldmVudHMyW3R5cGVdICE9PSB2b2lkIDApIHsKICAgICAgICBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMCkKICAgICAgICAgIHRoaXMuX2V2ZW50cyA9IC8qIEBfX1BVUkVfXyAqLyBPYmplY3QuY3JlYXRlKG51bGwpOwogICAgICAgIGVsc2UKICAgICAgICAgIGRlbGV0ZSBldmVudHMyW3R5cGVdOwogICAgICB9CiAgICAgIHJldHVybiB0aGlzOwogICAgfQogICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHsKICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhldmVudHMyKTsKICAgICAgdmFyIGtleTsKICAgICAgZm9yIChpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIHsKICAgICAgICBrZXkgPSBrZXlzW2ldOwogICAgICAgIGlmIChrZXkgPT09ICJyZW1vdmVMaXN0ZW5lciIpIGNvbnRpbnVlOwogICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7CiAgICAgIH0KICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoInJlbW92ZUxpc3RlbmVyIik7CiAgICAgIHRoaXMuX2V2ZW50cyA9IC8qIEBfX1BVUkVfXyAqLyBPYmplY3QuY3JlYXRlKG51bGwpOwogICAgICB0aGlzLl9ldmVudHNDb3VudCA9IDA7CiAgICAgIHJldHVybiB0aGlzOwogICAgfQogICAgbGlzdGVuZXJzID0gZXZlbnRzMlt0eXBlXTsKICAgIGlmICh0eXBlb2YgbGlzdGVuZXJzID09PSAiZnVuY3Rpb24iKSB7CiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTsKICAgIH0gZWxzZSBpZiAobGlzdGVuZXJzICE9PSB2b2lkIDApIHsKICAgICAgZm9yIChpID0gbGlzdGVuZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7CiAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbaV0pOwogICAgICB9CiAgICB9CiAgICByZXR1cm4gdGhpczsKICB9OwogIGZ1bmN0aW9uIF9saXN0ZW5lcnModGFyZ2V0LCB0eXBlLCB1bndyYXApIHsKICAgIHZhciBldmVudHMyID0gdGFyZ2V0Ll9ldmVudHM7CiAgICBpZiAoZXZlbnRzMiA9PT0gdm9pZCAwKQogICAgICByZXR1cm4gW107CiAgICB2YXIgZXZsaXN0ZW5lciA9IGV2ZW50czJbdHlwZV07CiAgICBpZiAoZXZsaXN0ZW5lciA9PT0gdm9pZCAwKQogICAgICByZXR1cm4gW107CiAgICBpZiAodHlwZW9mIGV2bGlzdGVuZXIgPT09ICJmdW5jdGlvbiIpCiAgICAgIHJldHVybiB1bndyYXAgPyBbZXZsaXN0ZW5lci5saXN0ZW5lciB8fCBldmxpc3RlbmVyXSA6IFtldmxpc3RlbmVyXTsKICAgIHJldHVybiB1bndyYXAgPyB1bndyYXBMaXN0ZW5lcnMoZXZsaXN0ZW5lcikgOiBhcnJheUNsb25lKGV2bGlzdGVuZXIsIGV2bGlzdGVuZXIubGVuZ3RoKTsKICB9CiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbiBsaXN0ZW5lcnModHlwZSkgewogICAgcmV0dXJuIF9saXN0ZW5lcnModGhpcywgdHlwZSwgdHJ1ZSk7CiAgfTsKICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJhd0xpc3RlbmVycyA9IGZ1bmN0aW9uIHJhd0xpc3RlbmVycyh0eXBlKSB7CiAgICByZXR1cm4gX2xpc3RlbmVycyh0aGlzLCB0eXBlLCBmYWxzZSk7CiAgfTsKICBFdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHsKICAgIGlmICh0eXBlb2YgZW1pdHRlci5saXN0ZW5lckNvdW50ID09PSAiZnVuY3Rpb24iKSB7CiAgICAgIHJldHVybiBlbWl0dGVyLmxpc3RlbmVyQ291bnQodHlwZSk7CiAgICB9IGVsc2UgewogICAgICByZXR1cm4gbGlzdGVuZXJDb3VudC5jYWxsKGVtaXR0ZXIsIHR5cGUpOwogICAgfQogIH07CiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lckNvdW50ID0gbGlzdGVuZXJDb3VudDsKICBmdW5jdGlvbiBsaXN0ZW5lckNvdW50KHR5cGUpIHsKICAgIHZhciBldmVudHMyID0gdGhpcy5fZXZlbnRzOwogICAgaWYgKGV2ZW50czIgIT09IHZvaWQgMCkgewogICAgICB2YXIgZXZsaXN0ZW5lciA9IGV2ZW50czJbdHlwZV07CiAgICAgIGlmICh0eXBlb2YgZXZsaXN0ZW5lciA9PT0gImZ1bmN0aW9uIikgewogICAgICAgIHJldHVybiAxOwogICAgICB9IGVsc2UgaWYgKGV2bGlzdGVuZXIgIT09IHZvaWQgMCkgewogICAgICAgIHJldHVybiBldmxpc3RlbmVyLmxlbmd0aDsKICAgICAgfQogICAgfQogICAgcmV0dXJuIDA7CiAgfQogIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZXZlbnROYW1lcyA9IGZ1bmN0aW9uIGV2ZW50TmFtZXMoKSB7CiAgICByZXR1cm4gdGhpcy5fZXZlbnRzQ291bnQgPiAwID8gUmVmbGVjdE93bktleXModGhpcy5fZXZlbnRzKSA6IFtdOwogIH07CiAgZnVuY3Rpb24gYXJyYXlDbG9uZShhcnIsIG4pIHsKICAgIHZhciBjb3B5MiA9IG5ldyBBcnJheShuKTsKICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKQogICAgICBjb3B5MltpXSA9IGFycltpXTsKICAgIHJldHVybiBjb3B5MjsKICB9CiAgZnVuY3Rpb24gc3BsaWNlT25lKGxpc3QsIGluZGV4KSB7CiAgICBmb3IgKDsgaW5kZXggKyAxIDwgbGlzdC5sZW5ndGg7IGluZGV4KyspCiAgICAgIGxpc3RbaW5kZXhdID0gbGlzdFtpbmRleCArIDFdOwogICAgbGlzdC5wb3AoKTsKICB9CiAgZnVuY3Rpb24gdW53cmFwTGlzdGVuZXJzKGFycikgewogICAgdmFyIHJldCA9IG5ldyBBcnJheShhcnIubGVuZ3RoKTsKICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmV0Lmxlbmd0aDsgKytpKSB7CiAgICAgIHJldFtpXSA9IGFycltpXS5saXN0ZW5lciB8fCBhcnJbaV07CiAgICB9CiAgICByZXR1cm4gcmV0OwogIH0KICBmdW5jdGlvbiBvbmNlKGVtaXR0ZXIsIG5hbWUpIHsKICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHsKICAgICAgZnVuY3Rpb24gZXJyb3JMaXN0ZW5lcihlcnIpIHsKICAgICAgICBlbWl0dGVyLnJlbW92ZUxpc3RlbmVyKG5hbWUsIHJlc29sdmVyKTsKICAgICAgICByZWplY3QoZXJyKTsKICAgICAgfQogICAgICBmdW5jdGlvbiByZXNvbHZlcigpIHsKICAgICAgICBpZiAodHlwZW9mIGVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIgPT09ICJmdW5jdGlvbiIpIHsKICAgICAgICAgIGVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoImVycm9yIiwgZXJyb3JMaXN0ZW5lcik7CiAgICAgICAgfQogICAgICAgIHJlc29sdmUoW10uc2xpY2UuY2FsbChhcmd1bWVudHMpKTsKICAgICAgfQogICAgICBldmVudFRhcmdldEFnbm9zdGljQWRkTGlzdGVuZXIoZW1pdHRlciwgbmFtZSwgcmVzb2x2ZXIsIHsgb25jZTogdHJ1ZSB9KTsKICAgICAgaWYgKG5hbWUgIT09ICJlcnJvciIpIHsKICAgICAgICBhZGRFcnJvckhhbmRsZXJJZkV2ZW50RW1pdHRlcihlbWl0dGVyLCBlcnJvckxpc3RlbmVyLCB7IG9uY2U6IHRydWUgfSk7CiAgICAgIH0KICAgIH0pOwogIH0KICBmdW5jdGlvbiBhZGRFcnJvckhhbmRsZXJJZkV2ZW50RW1pdHRlcihlbWl0dGVyLCBoYW5kbGVyLCBmbGFncykgewogICAgaWYgKHR5cGVvZiBlbWl0dGVyLm9uID09PSAiZnVuY3Rpb24iKSB7CiAgICAgIGV2ZW50VGFyZ2V0QWdub3N0aWNBZGRMaXN0ZW5lcihlbWl0dGVyLCAiZXJyb3IiLCBoYW5kbGVyLCBmbGFncyk7CiAgICB9CiAgfQogIGZ1bmN0aW9uIGV2ZW50VGFyZ2V0QWdub3N0aWNBZGRMaXN0ZW5lcihlbWl0dGVyLCBuYW1lLCBsaXN0ZW5lciwgZmxhZ3MpIHsKICAgIGlmICh0eXBlb2YgZW1pdHRlci5vbiA9PT0gImZ1bmN0aW9uIikgewogICAgICBpZiAoZmxhZ3Mub25jZSkgewogICAgICAgIGVtaXR0ZXIub25jZShuYW1lLCBsaXN0ZW5lcik7CiAgICAgIH0gZWxzZSB7CiAgICAgICAgZW1pdHRlci5vbihuYW1lLCBsaXN0ZW5lcik7CiAgICAgIH0KICAgIH0gZWxzZSBpZiAodHlwZW9mIGVtaXR0ZXIuYWRkRXZlbnRMaXN0ZW5lciA9PT0gImZ1bmN0aW9uIikgewogICAgICBlbWl0dGVyLmFkZEV2ZW50TGlzdGVuZXIobmFtZSwgZnVuY3Rpb24gd3JhcExpc3RlbmVyKGFyZykgewogICAgICAgIGlmIChmbGFncy5vbmNlKSB7CiAgICAgICAgICBlbWl0dGVyLnJlbW92ZUV2ZW50TGlzdGVuZXIobmFtZSwgd3JhcExpc3RlbmVyKTsKICAgICAgICB9CiAgICAgICAgbGlzdGVuZXIoYXJnKTsKICAgICAgfSk7CiAgICB9IGVsc2UgewogICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgImVtaXR0ZXIiIGFyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSBFdmVudEVtaXR0ZXIuIFJlY2VpdmVkIHR5cGUgJyArIHR5cGVvZiBlbWl0dGVyKTsKICAgIH0KICB9CiAgcmV0dXJuIGV2ZW50cy5leHBvcnRzOwp9CnZhciBldmVudHNFeHBvcnRzID0gcmVxdWlyZUV2ZW50cygpOwpjb25zdCBUWVBFID0gewogIE5VTEw6IDAsCiAgRkFMU0U6IDEsCiAgVFJVRTogMiwKICBJTlQ6IDMsCiAgRkxPQVQ6IDQsCiAgU1RSSU5HOiA1LAogIE9JRDogNiwKICBEQVRFOiA3LAogIFBPSU5URVI6IDgsCiAgQklOQVJZOiA5LAogIEFSUkFZOiAxNiwKICBPQkpFQ1Q6IDE3Cn07CmNsYXNzIE9iamVjdElkIHsKICBjb25zdHJ1Y3RvcihpZCkgewogICAgaWYgKGlkID09PSB2b2lkIDAgfHwgaWQgPT09IG51bGwpIHsKICAgICAgdGhpcy5pZCA9IE9iamVjdElkLmdlbmVyYXRlKCk7CiAgICB9IGVsc2UgaWYgKHR5cGVvZiBpZCA9PT0gInN0cmluZyIpIHsKICAgICAgaWYgKCFPYmplY3RJZC5pc1ZhbGlkKGlkKSkgewogICAgICAgIHRocm93IG5ldyBFcnJvcihgQXJndW1lbnQgcGFzc2VkIGluIG11c3QgYmUgYSBzdHJpbmcgb2YgMjQgaGV4IGNoYXJhY3RlcnMsIGdvdDogJHtpZH1gKTsKICAgICAgfQogICAgICB0aGlzLmlkID0gaWQudG9Mb3dlckNhc2UoKTsKICAgIH0gZWxzZSBpZiAoaWQgaW5zdGFuY2VvZiBVaW50OEFycmF5ICYmIGlkLmxlbmd0aCA9PT0gMTIpIHsKICAgICAgdGhpcy5pZCA9IEFycmF5LmZyb20oaWQpLm1hcCgoYikgPT4gYi50b1N0cmluZygxNikucGFkU3RhcnQoMiwgIjAiKSkuam9pbigiIik7CiAgICB9IGVsc2UgaWYgKGlkIGluc3RhbmNlb2YgT2JqZWN0SWQpIHsKICAgICAgdGhpcy5pZCA9IGlkLmlkOwogICAgfSBlbHNlIHsKICAgICAgdGhyb3cgbmV3IEVycm9yKGBBcmd1bWVudCBwYXNzZWQgaW4gbXVzdCBiZSBhIHN0cmluZyBvZiAyNCBoZXggY2hhcmFjdGVycyBvciBhbiBPYmplY3RJZGApOwogICAgfQogIH0KICAvKioKICAgKiBSZXR1cm5zIHRoZSBPYmplY3RJZCBhcyBhIDI0LWNoYXJhY3RlciBoZXggc3RyaW5nCiAgICovCiAgdG9TdHJpbmcoKSB7CiAgICByZXR1cm4gdGhpcy5pZDsKICB9CiAgLyoqCiAgICogUmV0dXJucyB0aGUgT2JqZWN0SWQgYXMgYSAyNC1jaGFyYWN0ZXIgaGV4IHN0cmluZyAoYWxpYXMgZm9yIHRvU3RyaW5nKQogICAqLwogIHRvSGV4U3RyaW5nKCkgewogICAgcmV0dXJuIHRoaXMuaWQ7CiAgfQogIC8qKgogICAqIFJldHVybnMgdGhlIHRpbWVzdGFtcCBwb3J0aW9uIG9mIHRoZSBPYmplY3RJZCBhcyBhIERhdGUKICAgKi8KICBnZXRUaW1lc3RhbXAoKSB7CiAgICBjb25zdCB0aW1lc3RhbXAgPSBwYXJzZUludCh0aGlzLmlkLnN1YnN0cmluZygwLCA4KSwgMTYpOwogICAgcmV0dXJuIG5ldyBEYXRlKHRpbWVzdGFtcCAqIDFlMyk7CiAgfQogIGVxdWFscyhvdGhlcikgewogICAgaWYgKCEob3RoZXIgaW5zdGFuY2VvZiBPYmplY3RJZCkpIHsKICAgICAgdGhyb3cgbmV3IEVycm9yKCJDYW4gb25seSBjb21wYXJlIHdpdGggYW5vdGhlciBPYmplY3RJZCIpOwogICAgfQogICAgcmV0dXJuIHRoaXMuaWQgPT09IG90aGVyLmlkOwogIH0KICAvKioKICAgKiBDb21wYXJlcyB0aGlzIE9iamVjdElkIHdpdGggYW5vdGhlciBmb3IgZXF1YWxpdHkKICAgKi8KICBjb21wYXJlKG90aGVyKSB7CiAgICBpZiAoIShvdGhlciBpbnN0YW5jZW9mIE9iamVjdElkKSkgewogICAgICB0aHJvdyBuZXcgRXJyb3IoIkNhbiBvbmx5IGNvbXBhcmUgd2l0aCBhbm90aGVyIE9iamVjdElkIik7CiAgICB9CiAgICByZXR1cm4gdGhpcy5pZC5sb2NhbGVDb21wYXJlKG90aGVyLmlkKTsKICB9CiAgLyoqCiAgICogUmV0dXJucyB0aGUgT2JqZWN0SWQgaW4gSlNPTiBmb3JtYXQgKGFzIGhleCBzdHJpbmcpCiAgICovCiAgdG9KU09OKCkgewogICAgcmV0dXJuIHRoaXMuaWQ7CiAgfQogIC8qKgogICAqIEN1c3RvbSBpbnNwZWN0IGZvciBOb2RlLmpzIGNvbnNvbGUubG9nCiAgICovCiAgaW5zcGVjdCgpIHsKICAgIHJldHVybiBgT2JqZWN0SWQoIiR7dGhpcy5pZH0iKWA7CiAgfQogIHRvQnl0ZXMoKSB7CiAgICBjb25zdCBieXRlcyA9IG5ldyBVaW50OEFycmF5KDEyKTsKICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTI7IGkrKykgewogICAgICBieXRlc1tpXSA9IHBhcnNlSW50KHRoaXMuaWQuc3Vic3RyaW5nKGkgKiAyLCBpICogMiArIDIpLCAxNik7CiAgICB9CiAgICByZXR1cm4gYnl0ZXM7CiAgfQogIC8qKgogICAqIFZhbGlkYXRlcyBpZiBhIHN0cmluZyBpcyBhIHZhbGlkIE9iamVjdElkIGhleCBzdHJpbmcKICAgKi8KICBzdGF0aWMgaXNWYWxpZChpZCkgewogICAgaWYgKCFpZCkgcmV0dXJuIGZhbHNlOwogICAgaWYgKHR5cGVvZiBpZCAhPT0gInN0cmluZyIpIHJldHVybiBmYWxzZTsKICAgIGlmIChpZC5sZW5ndGggIT09IDI0KSByZXR1cm4gZmFsc2U7CiAgICByZXR1cm4gL15bMC05YS1mQS1GXXsyNH0kLy50ZXN0KGlkKTsKICB9CiAgLyoqCiAgICogQ3JlYXRlcyBhbiBPYmplY3RJZCBmcm9tIGEgdGltZXN0YW1wCiAgICovCiAgc3RhdGljIGNyZWF0ZUZyb21UaW1lKHRpbWVzdGFtcCkgewogICAgY29uc3QgdHMgPSBNYXRoLmZsb29yKHRpbWVzdGFtcCAvIDFlMyk7CiAgICBjb25zdCB0c0hleCA9ICgiMDAwMDAwMDAiICsgdHMudG9TdHJpbmcoMTYpKS5zbGljZSgtOCk7CiAgICBjb25zdCB0YWlsID0gIjAwMDAwMDAwMDAwMDAwMDAiOwogICAgcmV0dXJuIG5ldyBPYmplY3RJZCh0c0hleCArIHRhaWwpOwogIH0KICAvKioKICAgKiBHZW5lcmF0ZXMgYSBuZXcgT2JqZWN0SWQgaGV4IHN0cmluZwogICAqIEZvcm1hdDogOC1jaGFyIHRpbWVzdGFtcCAoNCBieXRlcykgKyAxNi1jaGFyIHJhbmRvbSBkYXRhICg4IGJ5dGVzKQogICAqLwogIHN0YXRpYyBnZW5lcmF0ZSgpIHsKICAgIGNvbnN0IHRzID0gTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMWUzKTsKICAgIGNvbnN0IHJhbmQgPSB0eXBlb2YgY3J5cHRvICE9PSAidW5kZWZpbmVkIiAmJiBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzID8gbmV3IFVpbnQ4QXJyYXkoOCkgOiBudWxsOwogICAgbGV0IHRhaWwgPSAiIjsKICAgIGlmIChyYW5kKSB7CiAgICAgIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMocmFuZCk7CiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmFuZC5sZW5ndGg7IGkrKykgewogICAgICAgIHRhaWwgKz0gKCIwIiArIHJhbmRbaV0udG9TdHJpbmcoMTYpKS5zbGljZSgtMik7CiAgICAgIH0KICAgIH0gZWxzZSB7CiAgICAgIHRhaWwgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zbGljZSgyKS5wYWRFbmQoOCwgIjAiKS5zbGljZSgwLCA4KSArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMTYpLnNsaWNlKDIpLnBhZEVuZCg4LCAiMCIpLnNsaWNlKDAsIDgpOwogICAgfQogICAgY29uc3QgdHNIZXggPSAoIjAwMDAwMDAwIiArIHRzLnRvU3RyaW5nKDE2KSkuc2xpY2UoLTgpOwogICAgcmV0dXJuICh0c0hleCArIHRhaWwpLnNsaWNlKDAsIDI0KTsKICB9Cn0KY2xhc3MgUG9pbnRlciB7CiAgY29uc3RydWN0b3Iob2Zmc2V0KSB7CiAgICBpZiAob2Zmc2V0ID09PSB2b2lkIDAgfHwgb2Zmc2V0ID09PSBudWxsKSB7CiAgICAgIHRocm93IG5ldyBFcnJvcigiUG9pbnRlciBvZmZzZXQgbXVzdCBiZSBhIG51bWJlciIpOwogICAgfQogICAgaWYgKHR5cGVvZiBvZmZzZXQgIT09ICJudW1iZXIiKSB7CiAgICAgIHRocm93IG5ldyBFcnJvcigiUG9pbnRlciBvZmZzZXQgbXVzdCBiZSBhIG51bWJlciIpOwogICAgfQogICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKG9mZnNldCkpIHsKICAgICAgdGhyb3cgbmV3IEVycm9yKCJQb2ludGVyIG9mZnNldCBtdXN0IGJlIGFuIGludGVnZXIiKTsKICAgIH0KICAgIGlmIChvZmZzZXQgPCAwKSB7CiAgICAgIHRocm93IG5ldyBFcnJvcigiUG9pbnRlciBvZmZzZXQgbXVzdCBiZSBub24tbmVnYXRpdmUiKTsKICAgIH0KICAgIGlmIChvZmZzZXQgPiBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUikgewogICAgICB0aHJvdyBuZXcgRXJyb3IoIlBvaW50ZXIgb2Zmc2V0IGV4Y2VlZHMgbWF4aW11bSBzYWZlIGludGVnZXIiKTsKICAgIH0KICAgIHRoaXMub2Zmc2V0ID0gb2Zmc2V0OwogIH0KICAvKioKICAgKiBSZXR1cm5zIHRoZSBwb2ludGVyIG9mZnNldCBhcyBhIG51bWJlcgogICAqLwogIHZhbHVlT2YoKSB7CiAgICByZXR1cm4gdGhpcy5vZmZzZXQ7CiAgfQogIC8qKgogICAqIFJldHVybnMgdGhlIHBvaW50ZXIgb2Zmc2V0IGFzIGEgc3RyaW5nCiAgICovCiAgdG9TdHJpbmcoKSB7CiAgICByZXR1cm4gdGhpcy5vZmZzZXQudG9TdHJpbmcoKTsKICB9CiAgLyoqCiAgICogUmV0dXJucyB0aGUgcG9pbnRlciBpbiBKU09OIGZvcm1hdCAoYXMgbnVtYmVyKQogICAqLwogIHRvSlNPTigpIHsKICAgIHJldHVybiB0aGlzLm9mZnNldDsKICB9CiAgLyoqCiAgICogQ3VzdG9tIGluc3BlY3QgZm9yIE5vZGUuanMgY29uc29sZS5sb2cKICAgKi8KICBpbnNwZWN0KCkgewogICAgcmV0dXJuIGBQb2ludGVyKCR7dGhpcy5vZmZzZXR9KWA7CiAgfQogIC8qKgogICAqIENvbXBhcmVzIHRoaXMgUG9pbnRlciB3aXRoIGFub3RoZXIgZm9yIGVxdWFsaXR5CiAgICovCiAgZXF1YWxzKG90aGVyKSB7CiAgICBpZiAoIShvdGhlciBpbnN0YW5jZW9mIFBvaW50ZXIpKSB7CiAgICAgIHJldHVybiBmYWxzZTsKICAgIH0KICAgIHJldHVybiB0aGlzLm9mZnNldCA9PT0gb3RoZXIub2Zmc2V0OwogIH0KfQpmdW5jdGlvbiBlbmNvZGUodmFsdWUpIHsKICBjb25zdCBidWZmZXJzID0gW107CiAgZnVuY3Rpb24gZW5jb2RlVmFsdWUodmFsKSB7CiAgICBpZiAodmFsID09PSBudWxsKSB7CiAgICAgIGJ1ZmZlcnMucHVzaChuZXcgVWludDhBcnJheShbVFlQRS5OVUxMXSkpOwogICAgfSBlbHNlIGlmICh2YWwgPT09IGZhbHNlKSB7CiAgICAgIGJ1ZmZlcnMucHVzaChuZXcgVWludDhBcnJheShbVFlQRS5GQUxTRV0pKTsKICAgIH0gZWxzZSBpZiAodmFsID09PSB0cnVlKSB7CiAgICAgIGJ1ZmZlcnMucHVzaChuZXcgVWludDhBcnJheShbVFlQRS5UUlVFXSkpOwogICAgfSBlbHNlIGlmICh2YWwgaW5zdGFuY2VvZiBPYmplY3RJZCkgewogICAgICBidWZmZXJzLnB1c2gobmV3IFVpbnQ4QXJyYXkoW1RZUEUuT0lEXSkpOwogICAgICBidWZmZXJzLnB1c2godmFsLnRvQnl0ZXMoKSk7CiAgICB9IGVsc2UgaWYgKHZhbCBpbnN0YW5jZW9mIERhdGUpIHsKICAgICAgYnVmZmVycy5wdXNoKG5ldyBVaW50OEFycmF5KFtUWVBFLkRBVEVdKSk7CiAgICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcig4KTsKICAgICAgY29uc3QgdmlldyA9IG5ldyBEYXRhVmlldyhidWZmZXIpOwogICAgICB2aWV3LnNldEJpZ0ludDY0KDAsIEJpZ0ludCh2YWwuZ2V0VGltZSgpKSwgdHJ1ZSk7CiAgICAgIGJ1ZmZlcnMucHVzaChuZXcgVWludDhBcnJheShidWZmZXIpKTsKICAgIH0gZWxzZSBpZiAodmFsIGluc3RhbmNlb2YgUG9pbnRlcikgewogICAgICBidWZmZXJzLnB1c2gobmV3IFVpbnQ4QXJyYXkoW1RZUEUuUE9JTlRFUl0pKTsKICAgICAgY29uc3QgYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKDgpOwogICAgICBjb25zdCB2aWV3ID0gbmV3IERhdGFWaWV3KGJ1ZmZlcik7CiAgICAgIHZpZXcuc2V0QmlnVWludDY0KDAsIEJpZ0ludCh2YWwub2Zmc2V0KSwgdHJ1ZSk7CiAgICAgIGJ1ZmZlcnMucHVzaChuZXcgVWludDhBcnJheShidWZmZXIpKTsKICAgIH0gZWxzZSBpZiAodmFsIGluc3RhbmNlb2YgVWludDhBcnJheSkgewogICAgICBidWZmZXJzLnB1c2gobmV3IFVpbnQ4QXJyYXkoW1RZUEUuQklOQVJZXSkpOwogICAgICBjb25zdCBsZW5ndGhCdWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIoNCk7CiAgICAgIGNvbnN0IGxlbmd0aFZpZXcgPSBuZXcgRGF0YVZpZXcobGVuZ3RoQnVmZmVyKTsKICAgICAgbGVuZ3RoVmlldy5zZXRVaW50MzIoMCwgdmFsLmxlbmd0aCwgdHJ1ZSk7CiAgICAgIGJ1ZmZlcnMucHVzaChuZXcgVWludDhBcnJheShsZW5ndGhCdWZmZXIpKTsKICAgICAgYnVmZmVycy5wdXNoKHZhbCk7CiAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICJudW1iZXIiKSB7CiAgICAgIGlmIChOdW1iZXIuaXNJbnRlZ2VyKHZhbCkgJiYgTnVtYmVyLmlzU2FmZUludGVnZXIodmFsKSkgewogICAgICAgIGJ1ZmZlcnMucHVzaChuZXcgVWludDhBcnJheShbVFlQRS5JTlRdKSk7CiAgICAgICAgY29uc3QgYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKDgpOwogICAgICAgIGNvbnN0IHZpZXcgPSBuZXcgRGF0YVZpZXcoYnVmZmVyKTsKICAgICAgICB2aWV3LnNldEJpZ0ludDY0KDAsIEJpZ0ludCh2YWwpLCB0cnVlKTsKICAgICAgICBidWZmZXJzLnB1c2gobmV3IFVpbnQ4QXJyYXkoYnVmZmVyKSk7CiAgICAgIH0gZWxzZSB7CiAgICAgICAgYnVmZmVycy5wdXNoKG5ldyBVaW50OEFycmF5KFtUWVBFLkZMT0FUXSkpOwogICAgICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcig4KTsKICAgICAgICBjb25zdCB2aWV3ID0gbmV3IERhdGFWaWV3KGJ1ZmZlcik7CiAgICAgICAgdmlldy5zZXRGbG9hdDY0KDAsIHZhbCwgdHJ1ZSk7CiAgICAgICAgYnVmZmVycy5wdXNoKG5ldyBVaW50OEFycmF5KGJ1ZmZlcikpOwogICAgICB9CiAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICJzdHJpbmciKSB7CiAgICAgIGJ1ZmZlcnMucHVzaChuZXcgVWludDhBcnJheShbVFlQRS5TVFJJTkddKSk7CiAgICAgIGNvbnN0IGVuY29kZWQgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUodmFsKTsKICAgICAgY29uc3QgbGVuZ3RoQnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKDQpOwogICAgICBjb25zdCBsZW5ndGhWaWV3ID0gbmV3IERhdGFWaWV3KGxlbmd0aEJ1ZmZlcik7CiAgICAgIGxlbmd0aFZpZXcuc2V0VWludDMyKDAsIGVuY29kZWQubGVuZ3RoLCB0cnVlKTsKICAgICAgYnVmZmVycy5wdXNoKG5ldyBVaW50OEFycmF5KGxlbmd0aEJ1ZmZlcikpOwogICAgICBidWZmZXJzLnB1c2goZW5jb2RlZCk7CiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsKSkgewogICAgICBjb25zdCB0ZW1wQnVmZmVycyA9IFtdOwogICAgICBjb25zdCBsZW5ndGhCdWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIoNCk7CiAgICAgIGNvbnN0IGxlbmd0aFZpZXcgPSBuZXcgRGF0YVZpZXcobGVuZ3RoQnVmZmVyKTsKICAgICAgbGVuZ3RoVmlldy5zZXRVaW50MzIoMCwgdmFsLmxlbmd0aCwgdHJ1ZSk7CiAgICAgIHRlbXBCdWZmZXJzLnB1c2gobmV3IFVpbnQ4QXJyYXkobGVuZ3RoQnVmZmVyKSk7CiAgICAgIGNvbnN0IHN0YXJ0TGVuZ3RoID0gYnVmZmVycy5sZW5ndGg7CiAgICAgIGZvciAoY29uc3QgaXRlbSBvZiB2YWwpIHsKICAgICAgICBlbmNvZGVWYWx1ZShpdGVtKTsKICAgICAgfQogICAgICBjb25zdCBlbGVtZW50QnVmZmVycyA9IGJ1ZmZlcnMuc3BsaWNlKHN0YXJ0TGVuZ3RoKTsKICAgICAgdGVtcEJ1ZmZlcnMucHVzaCguLi5lbGVtZW50QnVmZmVycyk7CiAgICAgIGNvbnN0IGNvbnRlbnRTaXplID0gdGVtcEJ1ZmZlcnMucmVkdWNlKChzdW0sIGJ1ZikgPT4gc3VtICsgYnVmLmxlbmd0aCwgMCk7CiAgICAgIGJ1ZmZlcnMucHVzaChuZXcgVWludDhBcnJheShbVFlQRS5BUlJBWV0pKTsKICAgICAgY29uc3Qgc2l6ZUJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcig0KTsKICAgICAgY29uc3Qgc2l6ZVZpZXcgPSBuZXcgRGF0YVZpZXcoc2l6ZUJ1ZmZlcik7CiAgICAgIHNpemVWaWV3LnNldFVpbnQzMigwLCBjb250ZW50U2l6ZSwgdHJ1ZSk7CiAgICAgIGJ1ZmZlcnMucHVzaChuZXcgVWludDhBcnJheShzaXplQnVmZmVyKSk7CiAgICAgIGJ1ZmZlcnMucHVzaCguLi50ZW1wQnVmZmVycyk7CiAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICJvYmplY3QiKSB7CiAgICAgIGNvbnN0IHRlbXBCdWZmZXJzID0gW107CiAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyh2YWwpOwogICAgICBjb25zdCBsZW5ndGhCdWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIoNCk7CiAgICAgIGNvbnN0IGxlbmd0aFZpZXcgPSBuZXcgRGF0YVZpZXcobGVuZ3RoQnVmZmVyKTsKICAgICAgbGVuZ3RoVmlldy5zZXRVaW50MzIoMCwga2V5cy5sZW5ndGgsIHRydWUpOwogICAgICB0ZW1wQnVmZmVycy5wdXNoKG5ldyBVaW50OEFycmF5KGxlbmd0aEJ1ZmZlcikpOwogICAgICBjb25zdCBzdGFydExlbmd0aCA9IGJ1ZmZlcnMubGVuZ3RoOwogICAgICBmb3IgKGNvbnN0IGtleSBvZiBrZXlzKSB7CiAgICAgICAgY29uc3QgZW5jb2RlZCA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShrZXkpOwogICAgICAgIGNvbnN0IGtleUxlbmd0aEJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcig0KTsKICAgICAgICBjb25zdCBrZXlMZW5ndGhWaWV3ID0gbmV3IERhdGFWaWV3KGtleUxlbmd0aEJ1ZmZlcik7CiAgICAgICAga2V5TGVuZ3RoVmlldy5zZXRVaW50MzIoMCwgZW5jb2RlZC5sZW5ndGgsIHRydWUpOwogICAgICAgIGJ1ZmZlcnMucHVzaChuZXcgVWludDhBcnJheShrZXlMZW5ndGhCdWZmZXIpKTsKICAgICAgICBidWZmZXJzLnB1c2goZW5jb2RlZCk7CiAgICAgICAgZW5jb2RlVmFsdWUodmFsW2tleV0pOwogICAgICB9CiAgICAgIGNvbnN0IGt2QnVmZmVycyA9IGJ1ZmZlcnMuc3BsaWNlKHN0YXJ0TGVuZ3RoKTsKICAgICAgdGVtcEJ1ZmZlcnMucHVzaCguLi5rdkJ1ZmZlcnMpOwogICAgICBjb25zdCBjb250ZW50U2l6ZSA9IHRlbXBCdWZmZXJzLnJlZHVjZSgoc3VtLCBidWYpID0+IHN1bSArIGJ1Zi5sZW5ndGgsIDApOwogICAgICBidWZmZXJzLnB1c2gobmV3IFVpbnQ4QXJyYXkoW1RZUEUuT0JKRUNUXSkpOwogICAgICBjb25zdCBzaXplQnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKDQpOwogICAgICBjb25zdCBzaXplVmlldyA9IG5ldyBEYXRhVmlldyhzaXplQnVmZmVyKTsKICAgICAgc2l6ZVZpZXcuc2V0VWludDMyKDAsIGNvbnRlbnRTaXplLCB0cnVlKTsKICAgICAgYnVmZmVycy5wdXNoKG5ldyBVaW50OEFycmF5KHNpemVCdWZmZXIpKTsKICAgICAgYnVmZmVycy5wdXNoKC4uLnRlbXBCdWZmZXJzKTsKICAgIH0gZWxzZSB7CiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgdHlwZTogJHt0eXBlb2YgdmFsfWApOwogICAgfQogIH0KICBlbmNvZGVWYWx1ZSh2YWx1ZSk7CiAgY29uc3QgdG90YWxMZW5ndGggPSBidWZmZXJzLnJlZHVjZSgoc3VtLCBidWYpID0+IHN1bSArIGJ1Zi5sZW5ndGgsIDApOwogIGNvbnN0IHJlc3VsdCA9IG5ldyBVaW50OEFycmF5KHRvdGFsTGVuZ3RoKTsKICBsZXQgb2Zmc2V0ID0gMDsKICBmb3IgKGNvbnN0IGJ1ZiBvZiBidWZmZXJzKSB7CiAgICByZXN1bHQuc2V0KGJ1Ziwgb2Zmc2V0KTsKICAgIG9mZnNldCArPSBidWYubGVuZ3RoOwogIH0KICByZXR1cm4gcmVzdWx0Owp9CmZ1bmN0aW9uIGRlY29kZShkYXRhKSB7CiAgbGV0IG9mZnNldCA9IDA7CiAgZnVuY3Rpb24gZGVjb2RlVmFsdWUoKSB7CiAgICBpZiAob2Zmc2V0ID49IGRhdGEubGVuZ3RoKSB7CiAgICAgIHRocm93IG5ldyBFcnJvcigiVW5leHBlY3RlZCBlbmQgb2YgZGF0YSIpOwogICAgfQogICAgY29uc3QgdHlwZSA9IGRhdGFbb2Zmc2V0KytdOwogICAgc3dpdGNoICh0eXBlKSB7CiAgICAgIGNhc2UgVFlQRS5OVUxMOgogICAgICAgIHJldHVybiBudWxsOwogICAgICBjYXNlIFRZUEUuRkFMU0U6CiAgICAgICAgcmV0dXJuIGZhbHNlOwogICAgICBjYXNlIFRZUEUuVFJVRToKICAgICAgICByZXR1cm4gdHJ1ZTsKICAgICAgY2FzZSBUWVBFLklOVDogewogICAgICAgIGlmIChvZmZzZXQgKyA0ID4gZGF0YS5sZW5ndGgpIHsKICAgICAgICAgIHRocm93IG5ldyBFcnJvcigiVW5leHBlY3RlZCBlbmQgb2YgZGF0YSBmb3IgSU5UIik7CiAgICAgICAgfQogICAgICAgIGNvbnN0IHZpZXcgPSBuZXcgRGF0YVZpZXcoZGF0YS5idWZmZXIsIGRhdGEuYnl0ZU9mZnNldCArIG9mZnNldCwgOCk7CiAgICAgICAgY29uc3QgdmFsdWUgPSB2aWV3LmdldEJpZ0ludDY0KDAsIHRydWUpOwogICAgICAgIG9mZnNldCArPSA4OwogICAgICAgIGlmICh2YWx1ZSA8IEJpZ0ludChOdW1iZXIuTUlOX1NBRkVfSU5URUdFUikgfHwgdmFsdWUgPiBCaWdJbnQoTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIpKSB7CiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoIkRlY29kZWQgaW50ZWdlciBleGNlZWRzIHNhZmUgcmFuZ2UiKTsKICAgICAgICB9CiAgICAgICAgcmV0dXJuIE51bWJlcih2YWx1ZSk7CiAgICAgIH0KICAgICAgY2FzZSBUWVBFLkZMT0FUOiB7CiAgICAgICAgaWYgKG9mZnNldCArIDggPiBkYXRhLmxlbmd0aCkgewogICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCJVbmV4cGVjdGVkIGVuZCBvZiBkYXRhIGZvciBGTE9BVCIpOwogICAgICAgIH0KICAgICAgICBjb25zdCB2aWV3ID0gbmV3IERhdGFWaWV3KGRhdGEuYnVmZmVyLCBkYXRhLmJ5dGVPZmZzZXQgKyBvZmZzZXQsIDgpOwogICAgICAgIGNvbnN0IHZhbHVlID0gdmlldy5nZXRGbG9hdDY0KDAsIHRydWUpOwogICAgICAgIG9mZnNldCArPSA4OwogICAgICAgIHJldHVybiB2YWx1ZTsKICAgICAgfQogICAgICBjYXNlIFRZUEUuU1RSSU5HOiB7CiAgICAgICAgaWYgKG9mZnNldCArIDQgPiBkYXRhLmxlbmd0aCkgewogICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCJVbmV4cGVjdGVkIGVuZCBvZiBkYXRhIGZvciBTVFJJTkcgbGVuZ3RoIik7CiAgICAgICAgfQogICAgICAgIGNvbnN0IGxlbmd0aFZpZXcgPSBuZXcgRGF0YVZpZXcoZGF0YS5idWZmZXIsIGRhdGEuYnl0ZU9mZnNldCArIG9mZnNldCwgNCk7CiAgICAgICAgY29uc3QgbGVuZ3RoID0gbGVuZ3RoVmlldy5nZXRVaW50MzIoMCwgdHJ1ZSk7CiAgICAgICAgb2Zmc2V0ICs9IDQ7CiAgICAgICAgaWYgKG9mZnNldCArIGxlbmd0aCA+IGRhdGEubGVuZ3RoKSB7CiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoIlVuZXhwZWN0ZWQgZW5kIG9mIGRhdGEgZm9yIFNUUklORyBjb250ZW50Iik7CiAgICAgICAgfQogICAgICAgIGNvbnN0IHN0cmluZ0RhdGEgPSBkYXRhLnNsaWNlKG9mZnNldCwgb2Zmc2V0ICsgbGVuZ3RoKTsKICAgICAgICBvZmZzZXQgKz0gbGVuZ3RoOwogICAgICAgIHJldHVybiBuZXcgVGV4dERlY29kZXIoKS5kZWNvZGUoc3RyaW5nRGF0YSk7CiAgICAgIH0KICAgICAgY2FzZSBUWVBFLk9JRDogewogICAgICAgIGlmIChvZmZzZXQgKyAxMiA+IGRhdGEubGVuZ3RoKSB7CiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoIlVuZXhwZWN0ZWQgZW5kIG9mIGRhdGEgZm9yIE9JRCIpOwogICAgICAgIH0KICAgICAgICBjb25zdCBvaWRCeXRlcyA9IGRhdGEuc2xpY2Uob2Zmc2V0LCBvZmZzZXQgKyAxMik7CiAgICAgICAgb2Zmc2V0ICs9IDEyOwogICAgICAgIHJldHVybiBuZXcgT2JqZWN0SWQob2lkQnl0ZXMpOwogICAgICB9CiAgICAgIGNhc2UgVFlQRS5EQVRFOiB7CiAgICAgICAgaWYgKG9mZnNldCArIDggPiBkYXRhLmxlbmd0aCkgewogICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCJVbmV4cGVjdGVkIGVuZCBvZiBkYXRhIGZvciBEQVRFIik7CiAgICAgICAgfQogICAgICAgIGNvbnN0IHZpZXcgPSBuZXcgRGF0YVZpZXcoZGF0YS5idWZmZXIsIGRhdGEuYnl0ZU9mZnNldCArIG9mZnNldCwgOCk7CiAgICAgICAgY29uc3QgdGltZXN0YW1wID0gdmlldy5nZXRCaWdJbnQ2NCgwLCB0cnVlKTsKICAgICAgICBvZmZzZXQgKz0gODsKICAgICAgICByZXR1cm4gbmV3IERhdGUoTnVtYmVyKHRpbWVzdGFtcCkpOwogICAgICB9CiAgICAgIGNhc2UgVFlQRS5QT0lOVEVSOiB7CiAgICAgICAgaWYgKG9mZnNldCArIDggPiBkYXRhLmxlbmd0aCkgewogICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCJVbmV4cGVjdGVkIGVuZCBvZiBkYXRhIGZvciBQT0lOVEVSIik7CiAgICAgICAgfQogICAgICAgIGNvbnN0IHZpZXcgPSBuZXcgRGF0YVZpZXcoZGF0YS5idWZmZXIsIGRhdGEuYnl0ZU9mZnNldCArIG9mZnNldCwgOCk7CiAgICAgICAgY29uc3QgcG9pbnRlck9mZnNldCA9IHZpZXcuZ2V0QmlnVWludDY0KDAsIHRydWUpOwogICAgICAgIG9mZnNldCArPSA4OwogICAgICAgIGlmIChwb2ludGVyT2Zmc2V0ID4gQmlnSW50KE51bWJlci5NQVhfU0FGRV9JTlRFR0VSKSkgewogICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCJQb2ludGVyIG9mZnNldCBvdXQgb2YgdmFsaWQgcmFuZ2UiKTsKICAgICAgICB9CiAgICAgICAgcmV0dXJuIG5ldyBQb2ludGVyKE51bWJlcihwb2ludGVyT2Zmc2V0KSk7CiAgICAgIH0KICAgICAgY2FzZSBUWVBFLkJJTkFSWTogewogICAgICAgIGlmIChvZmZzZXQgKyA0ID4gZGF0YS5sZW5ndGgpIHsKICAgICAgICAgIHRocm93IG5ldyBFcnJvcigiVW5leHBlY3RlZCBlbmQgb2YgZGF0YSBmb3IgQklOQVJZIGxlbmd0aCIpOwogICAgICAgIH0KICAgICAgICBjb25zdCBsZW5ndGhWaWV3ID0gbmV3IERhdGFWaWV3KGRhdGEuYnVmZmVyLCBkYXRhLmJ5dGVPZmZzZXQgKyBvZmZzZXQsIDQpOwogICAgICAgIGNvbnN0IGxlbmd0aCA9IGxlbmd0aFZpZXcuZ2V0VWludDMyKDAsIHRydWUpOwogICAgICAgIG9mZnNldCArPSA0OwogICAgICAgIGlmIChvZmZzZXQgKyBsZW5ndGggPiBkYXRhLmxlbmd0aCkgewogICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCJVbmV4cGVjdGVkIGVuZCBvZiBkYXRhIGZvciBCSU5BUlkgY29udGVudCIpOwogICAgICAgIH0KICAgICAgICBjb25zdCBiaW5hcnlEYXRhID0gZGF0YS5zbGljZShvZmZzZXQsIG9mZnNldCArIGxlbmd0aCk7CiAgICAgICAgb2Zmc2V0ICs9IGxlbmd0aDsKICAgICAgICByZXR1cm4gYmluYXJ5RGF0YTsKICAgICAgfQogICAgICBjYXNlIFRZUEUuQVJSQVk6IHsKICAgICAgICBpZiAob2Zmc2V0ICsgNCA+IGRhdGEubGVuZ3RoKSB7CiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoIlVuZXhwZWN0ZWQgZW5kIG9mIGRhdGEgZm9yIEFSUkFZIHNpemUiKTsKICAgICAgICB9CiAgICAgICAgY29uc3Qgc2l6ZVZpZXcgPSBuZXcgRGF0YVZpZXcoZGF0YS5idWZmZXIsIGRhdGEuYnl0ZU9mZnNldCArIG9mZnNldCwgNCk7CiAgICAgICAgY29uc3Qgc2l6ZSA9IHNpemVWaWV3LmdldFVpbnQzMigwLCB0cnVlKTsKICAgICAgICBvZmZzZXQgKz0gNDsKICAgICAgICBpZiAob2Zmc2V0ICsgc2l6ZSA+IGRhdGEubGVuZ3RoKSB7CiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoIlVuZXhwZWN0ZWQgZW5kIG9mIGRhdGEgZm9yIEFSUkFZIGNvbnRlbnQiKTsKICAgICAgICB9CiAgICAgICAgY29uc3QgbGVuZ3RoVmlldyA9IG5ldyBEYXRhVmlldyhkYXRhLmJ1ZmZlciwgZGF0YS5ieXRlT2Zmc2V0ICsgb2Zmc2V0LCA0KTsKICAgICAgICBjb25zdCBsZW5ndGggPSBsZW5ndGhWaWV3LmdldFVpbnQzMigwLCB0cnVlKTsKICAgICAgICBvZmZzZXQgKz0gNDsKICAgICAgICBjb25zdCBhcnIgPSBbXTsKICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7CiAgICAgICAgICBhcnIucHVzaChkZWNvZGVWYWx1ZSgpKTsKICAgICAgICB9CiAgICAgICAgcmV0dXJuIGFycjsKICAgICAgfQogICAgICBjYXNlIFRZUEUuT0JKRUNUOiB7CiAgICAgICAgaWYgKG9mZnNldCArIDQgPiBkYXRhLmxlbmd0aCkgewogICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCJVbmV4cGVjdGVkIGVuZCBvZiBkYXRhIGZvciBPQkpFQ1Qgc2l6ZSIpOwogICAgICAgIH0KICAgICAgICBjb25zdCBzaXplVmlldyA9IG5ldyBEYXRhVmlldyhkYXRhLmJ1ZmZlciwgZGF0YS5ieXRlT2Zmc2V0ICsgb2Zmc2V0LCA0KTsKICAgICAgICBjb25zdCBzaXplID0gc2l6ZVZpZXcuZ2V0VWludDMyKDAsIHRydWUpOwogICAgICAgIG9mZnNldCArPSA0OwogICAgICAgIGlmIChvZmZzZXQgKyBzaXplID4gZGF0YS5sZW5ndGgpIHsKICAgICAgICAgIHRocm93IG5ldyBFcnJvcigiVW5leHBlY3RlZCBlbmQgb2YgZGF0YSBmb3IgT0JKRUNUIGNvbnRlbnQiKTsKICAgICAgICB9CiAgICAgICAgY29uc3QgbGVuZ3RoVmlldyA9IG5ldyBEYXRhVmlldyhkYXRhLmJ1ZmZlciwgZGF0YS5ieXRlT2Zmc2V0ICsgb2Zmc2V0LCA0KTsKICAgICAgICBjb25zdCBsZW5ndGggPSBsZW5ndGhWaWV3LmdldFVpbnQzMigwLCB0cnVlKTsKICAgICAgICBvZmZzZXQgKz0gNDsKICAgICAgICBjb25zdCBvYmogPSB7fTsKICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7CiAgICAgICAgICBpZiAob2Zmc2V0ICsgNCA+IGRhdGEubGVuZ3RoKSB7CiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigiVW5leHBlY3RlZCBlbmQgb2YgZGF0YSBmb3IgT0JKRUNUIGtleSBsZW5ndGgiKTsKICAgICAgICAgIH0KICAgICAgICAgIGNvbnN0IGtleUxlbmd0aFZpZXcgPSBuZXcgRGF0YVZpZXcoZGF0YS5idWZmZXIsIGRhdGEuYnl0ZU9mZnNldCArIG9mZnNldCwgNCk7CiAgICAgICAgICBjb25zdCBrZXlMZW5ndGggPSBrZXlMZW5ndGhWaWV3LmdldFVpbnQzMigwLCB0cnVlKTsKICAgICAgICAgIG9mZnNldCArPSA0OwogICAgICAgICAgaWYgKG9mZnNldCArIGtleUxlbmd0aCA+IGRhdGEubGVuZ3RoKSB7CiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigiVW5leHBlY3RlZCBlbmQgb2YgZGF0YSBmb3IgT0JKRUNUIGtleSIpOwogICAgICAgICAgfQogICAgICAgICAgY29uc3Qga2V5RGF0YSA9IGRhdGEuc2xpY2Uob2Zmc2V0LCBvZmZzZXQgKyBrZXlMZW5ndGgpOwogICAgICAgICAgb2Zmc2V0ICs9IGtleUxlbmd0aDsKICAgICAgICAgIGNvbnN0IGtleSA9IG5ldyBUZXh0RGVjb2RlcigpLmRlY29kZShrZXlEYXRhKTsKICAgICAgICAgIG9ialtrZXldID0gZGVjb2RlVmFsdWUoKTsKICAgICAgICB9CiAgICAgICAgcmV0dXJuIG9iajsKICAgICAgfQogICAgICBkZWZhdWx0OgogICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biB0eXBlIGJ5dGU6IDB4JHt0eXBlLnRvU3RyaW5nKDE2KX1gKTsKICAgIH0KICB9CiAgcmV0dXJuIGRlY29kZVZhbHVlKCk7Cn0KY2xhc3MgQkpzb25GaWxlIHsKICBjb25zdHJ1Y3RvcihzeW5jQWNjZXNzSGFuZGxlKSB7CiAgICBpZiAoIXN5bmNBY2Nlc3NIYW5kbGUpIHsKICAgICAgdGhyb3cgbmV3IEVycm9yKCJGaWxlU3lzdGVtU3luY0FjY2Vzc0hhbmRsZSBpcyByZXF1aXJlZCIpOwogICAgfQogICAgdGhpcy5zeW5jQWNjZXNzSGFuZGxlID0gc3luY0FjY2Vzc0hhbmRsZTsKICB9CiAgLyoqCiAgICogUmVhZCBhIHJhbmdlIG9mIGJ5dGVzIGZyb20gdGhlIGZpbGUKICAgKi8KICAjcmVhZFJhbmdlKHN0YXJ0LCBsZW5ndGgpIHsKICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KGxlbmd0aCk7CiAgICBjb25zdCBieXRlc1JlYWQgPSB0aGlzLnN5bmNBY2Nlc3NIYW5kbGUucmVhZChidWZmZXIsIHsgYXQ6IHN0YXJ0IH0pOwogICAgaWYgKGJ5dGVzUmVhZCA8IGxlbmd0aCkgewogICAgICByZXR1cm4gYnVmZmVyLnNsaWNlKDAsIGJ5dGVzUmVhZCk7CiAgICB9CiAgICByZXR1cm4gYnVmZmVyOwogIH0KICAvKioKICAgKiBHZXQgdGhlIGN1cnJlbnQgZmlsZSBzaXplCiAgICovCiAgZ2V0RmlsZVNpemUoKSB7CiAgICByZXR1cm4gdGhpcy5zeW5jQWNjZXNzSGFuZGxlLmdldFNpemUoKTsKICB9CiAgLyoqCiAgICogV3JpdGUgZGF0YSB0byBmaWxlLCB0cnVuY2F0aW5nIGV4aXN0aW5nIGNvbnRlbnQKICAgKiBAcGFyYW0geyp9IGRhdGEgLSBEYXRhIHRvIGVuY29kZSBhbmQgd3JpdGUKICAgKi8KICB3cml0ZShkYXRhKSB7CiAgICBjb25zdCBiaW5hcnlEYXRhID0gZW5jb2RlKGRhdGEpOwogICAgdGhpcy5zeW5jQWNjZXNzSGFuZGxlLnRydW5jYXRlKDApOwogICAgdGhpcy5zeW5jQWNjZXNzSGFuZGxlLndyaXRlKGJpbmFyeURhdGEsIHsgYXQ6IDAgfSk7CiAgfQogIC8qKgogICAqIFJlYWQgYW5kIGRlY29kZSBkYXRhIGZyb20gZmlsZSBzdGFydGluZyBhdCBvcHRpb25hbCBwb2ludGVyIG9mZnNldAogICAqIEBwYXJhbSB7UG9pbnRlcn0gcG9pbnRlciAtIE9wdGlvbmFsIG9mZnNldCB0byBzdGFydCByZWFkaW5nIGZyb20gKGRlZmF1bHQ6IDApCiAgICogQHJldHVybnMgeyp9IC0gRGVjb2RlZCBkYXRhCiAgICovCiAgcmVhZChwb2ludGVyID0gbmV3IFBvaW50ZXIoMCkpIHsKICAgIGNvbnN0IGZpbGVTaXplID0gdGhpcy5nZXRGaWxlU2l6ZSgpOwogICAgaWYgKGZpbGVTaXplID09PSAwKSB7CiAgICAgIHRocm93IG5ldyBFcnJvcigiRmlsZSBpcyBlbXB0eSIpOwogICAgfQogICAgY29uc3QgcG9pbnRlclZhbHVlID0gcG9pbnRlci52YWx1ZU9mKCk7CiAgICBpZiAocG9pbnRlclZhbHVlIDwgMCB8fCBwb2ludGVyVmFsdWUgPj0gZmlsZVNpemUpIHsKICAgICAgdGhyb3cgbmV3IEVycm9yKGBQb2ludGVyIG9mZnNldCAke3BvaW50ZXJ9IG91dCBvZiBmaWxlIGJvdW5kcyBbMCwgJHtmaWxlU2l6ZX0pYCk7CiAgICB9CiAgICBjb25zdCBiaW5hcnlEYXRhID0gdGhpcy4jcmVhZFJhbmdlKHBvaW50ZXJWYWx1ZSwgZmlsZVNpemUgLSBwb2ludGVyVmFsdWUpOwogICAgcmV0dXJuIGRlY29kZShiaW5hcnlEYXRhKTsKICB9CiAgLyoqCiAgICogQXBwZW5kIGRhdGEgdG8gZmlsZSB3aXRob3V0IHRydW5jYXRpbmcgZXhpc3RpbmcgY29udGVudAogICAqIEBwYXJhbSB7Kn0gZGF0YSAtIERhdGEgdG8gZW5jb2RlIGFuZCBhcHBlbmQKICAgKi8KICBhcHBlbmQoZGF0YSkgewogICAgY29uc3QgYmluYXJ5RGF0YSA9IGVuY29kZShkYXRhKTsKICAgIGNvbnN0IGV4aXN0aW5nU2l6ZSA9IHRoaXMuZ2V0RmlsZVNpemUoKTsKICAgIHRoaXMuc3luY0FjY2Vzc0hhbmRsZS53cml0ZShiaW5hcnlEYXRhLCB7IGF0OiBleGlzdGluZ1NpemUgfSk7CiAgfQogIC8qKgogICAqIEV4cGxpY2l0bHkgZmx1c2ggYW55IHBlbmRpbmcgd3JpdGVzIHRvIGRpc2sKICAgKi8KICBmbHVzaCgpIHsKICAgIHRoaXMuc3luY0FjY2Vzc0hhbmRsZS5mbHVzaCgpOwogIH0KICAvKioKICAgKiBHZW5lcmF0b3IgdG8gc2NhbiB0aHJvdWdoIGFsbCByZWNvcmRzIGluIHRoZSBmaWxlCiAgICogRWFjaCByZWNvcmQgaXMgZGVjb2RlZCBhbmQgeWllbGRlZCBvbmUgYXQgYSB0aW1lCiAgICovCiAgKnNjYW4oKSB7CiAgICBjb25zdCBmaWxlU2l6ZSA9IHRoaXMuZ2V0RmlsZVNpemUoKTsKICAgIGlmIChmaWxlU2l6ZSA9PT0gMCkgewogICAgICByZXR1cm47CiAgICB9CiAgICBsZXQgb2Zmc2V0ID0gMDsKICAgIHdoaWxlIChvZmZzZXQgPCBmaWxlU2l6ZSkgewogICAgICBjb25zdCBnZXRWYWx1ZVNpemUgPSAocmVhZFBvc2l0aW9uKSA9PiB7CiAgICAgICAgbGV0IHRlbXBEYXRhID0gdGhpcy4jcmVhZFJhbmdlKHJlYWRQb3NpdGlvbiwgMSk7CiAgICAgICAgY29uc3QgdHlwZSA9IHRlbXBEYXRhWzBdOwogICAgICAgIHN3aXRjaCAodHlwZSkgewogICAgICAgICAgY2FzZSBUWVBFLk5VTEw6CiAgICAgICAgICBjYXNlIFRZUEUuRkFMU0U6CiAgICAgICAgICBjYXNlIFRZUEUuVFJVRToKICAgICAgICAgICAgcmV0dXJuIDE7CiAgICAgICAgICBjYXNlIFRZUEUuSU5UOgogICAgICAgICAgY2FzZSBUWVBFLkZMT0FUOgogICAgICAgICAgY2FzZSBUWVBFLkRBVEU6CiAgICAgICAgICBjYXNlIFRZUEUuUE9JTlRFUjoKICAgICAgICAgICAgcmV0dXJuIDEgKyA4OwogICAgICAgICAgY2FzZSBUWVBFLk9JRDoKICAgICAgICAgICAgcmV0dXJuIDEgKyAxMjsKICAgICAgICAgIGNhc2UgVFlQRS5TVFJJTkc6IHsKICAgICAgICAgICAgdGVtcERhdGEgPSB0aGlzLiNyZWFkUmFuZ2UocmVhZFBvc2l0aW9uICsgMSwgNCk7CiAgICAgICAgICAgIGNvbnN0IHZpZXcgPSBuZXcgRGF0YVZpZXcodGVtcERhdGEuYnVmZmVyLCB0ZW1wRGF0YS5ieXRlT2Zmc2V0LCA0KTsKICAgICAgICAgICAgY29uc3QgbGVuZ3RoID0gdmlldy5nZXRVaW50MzIoMCwgdHJ1ZSk7CiAgICAgICAgICAgIHJldHVybiAxICsgNCArIGxlbmd0aDsKICAgICAgICAgIH0KICAgICAgICAgIGNhc2UgVFlQRS5CSU5BUlk6IHsKICAgICAgICAgICAgdGVtcERhdGEgPSB0aGlzLiNyZWFkUmFuZ2UocmVhZFBvc2l0aW9uICsgMSwgNCk7CiAgICAgICAgICAgIGNvbnN0IHZpZXcgPSBuZXcgRGF0YVZpZXcodGVtcERhdGEuYnVmZmVyLCB0ZW1wRGF0YS5ieXRlT2Zmc2V0LCA0KTsKICAgICAgICAgICAgY29uc3QgbGVuZ3RoID0gdmlldy5nZXRVaW50MzIoMCwgdHJ1ZSk7CiAgICAgICAgICAgIHJldHVybiAxICsgNCArIGxlbmd0aDsKICAgICAgICAgIH0KICAgICAgICAgIGNhc2UgVFlQRS5BUlJBWTogewogICAgICAgICAgICB0ZW1wRGF0YSA9IHRoaXMuI3JlYWRSYW5nZShyZWFkUG9zaXRpb24gKyAxLCA0KTsKICAgICAgICAgICAgY29uc3QgdmlldyA9IG5ldyBEYXRhVmlldyh0ZW1wRGF0YS5idWZmZXIsIHRlbXBEYXRhLmJ5dGVPZmZzZXQsIDQpOwogICAgICAgICAgICBjb25zdCBzaXplID0gdmlldy5nZXRVaW50MzIoMCwgdHJ1ZSk7CiAgICAgICAgICAgIHJldHVybiAxICsgNCArIHNpemU7CiAgICAgICAgICB9CiAgICAgICAgICBjYXNlIFRZUEUuT0JKRUNUOiB7CiAgICAgICAgICAgIHRlbXBEYXRhID0gdGhpcy4jcmVhZFJhbmdlKHJlYWRQb3NpdGlvbiArIDEsIDQpOwogICAgICAgICAgICBjb25zdCB2aWV3ID0gbmV3IERhdGFWaWV3KHRlbXBEYXRhLmJ1ZmZlciwgdGVtcERhdGEuYnl0ZU9mZnNldCwgNCk7CiAgICAgICAgICAgIGNvbnN0IHNpemUgPSB2aWV3LmdldFVpbnQzMigwLCB0cnVlKTsKICAgICAgICAgICAgcmV0dXJuIDEgKyA0ICsgc2l6ZTsKICAgICAgICAgIH0KICAgICAgICAgIGRlZmF1bHQ6CiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biB0eXBlIGJ5dGU6IDB4JHt0eXBlLnRvU3RyaW5nKDE2KX1gKTsKICAgICAgICB9CiAgICAgIH07CiAgICAgIGNvbnN0IHZhbHVlU2l6ZSA9IGdldFZhbHVlU2l6ZShvZmZzZXQpOwogICAgICBjb25zdCB2YWx1ZURhdGEgPSB0aGlzLiNyZWFkUmFuZ2Uob2Zmc2V0LCB2YWx1ZVNpemUpOwogICAgICBvZmZzZXQgKz0gdmFsdWVTaXplOwogICAgICB5aWVsZCBkZWNvZGUodmFsdWVEYXRhKTsKICAgIH0KICB9Cn0KZnVuY3Rpb24gdmFsdWVzRXF1YWwkMShhLCBiKSB7CiAgaWYgKGEgaW5zdGFuY2VvZiBPYmplY3RJZCB8fCBiIGluc3RhbmNlb2YgT2JqZWN0SWQpIHsKICAgIGlmIChhIGluc3RhbmNlb2YgT2JqZWN0SWQgJiYgYiBpbnN0YW5jZW9mIE9iamVjdElkKSB7CiAgICAgIHJldHVybiBhLmVxdWFscyhiKTsKICAgIH0KICAgIGlmIChhIGluc3RhbmNlb2YgT2JqZWN0SWQgJiYgdHlwZW9mIGIgPT09ICJzdHJpbmciKSB7CiAgICAgIHJldHVybiBhLmVxdWFscyhiKTsKICAgIH0KICAgIGlmIChiIGluc3RhbmNlb2YgT2JqZWN0SWQgJiYgdHlwZW9mIGEgPT09ICJzdHJpbmciKSB7CiAgICAgIHJldHVybiBiLmVxdWFscyhhKTsKICAgIH0KICAgIHJldHVybiBmYWxzZTsKICB9CiAgcmV0dXJuIGEgPT0gYjsKfQpmdW5jdGlvbiBjb3B5KG8pIHsKICBpZiAobyBpbnN0YW5jZW9mIE9iamVjdElkKSB7CiAgICByZXR1cm4gbmV3IE9iamVjdElkKG8uaWQpOwogIH0KICB2YXIgb3V0LCB2LCBrZXk7CiAgb3V0ID0gQXJyYXkuaXNBcnJheShvKSA/IFtdIDoge307CiAgZm9yIChrZXkgaW4gbykgewogICAgdiA9IG9ba2V5XTsKICAgIG91dFtrZXldID0gdHlwZW9mIHYgPT09ICJvYmplY3QiICYmIHYgIT09IG51bGwgPyBjb3B5KHYpIDogdjsKICB9CiAgcmV0dXJuIG91dDsKfQpmdW5jdGlvbiBnZXRQcm9wKG9iaiwgbmFtZSkgewogIHZhciBwYXRoID0gbmFtZS5zcGxpdCgiLiIpOwogIHZhciByZXN1bHQgPSBvYmpbcGF0aFswXV07CiAgZm9yICh2YXIgaSA9IDE7IGkgPCBwYXRoLmxlbmd0aDsgaSsrKSB7CiAgICBpZiAocmVzdWx0ID09IHZvaWQgMCB8fCByZXN1bHQgPT0gbnVsbCkgcmV0dXJuIHJlc3VsdDsKICAgIHZhciBwYXRoU2VnbWVudCA9IHBhdGhbaV07CiAgICB2YXIgbnVtZXJpY0luZGV4ID0gcGFyc2VJbnQocGF0aFNlZ21lbnQsIDEwKTsKICAgIGlmIChpc0FycmF5KHJlc3VsdCkgJiYgIWlzTmFOKG51bWVyaWNJbmRleCkgJiYgbnVtZXJpY0luZGV4ID49IDAgJiYgbnVtZXJpY0luZGV4IDwgcmVzdWx0Lmxlbmd0aCkgewogICAgICByZXN1bHQgPSByZXN1bHRbbnVtZXJpY0luZGV4XTsKICAgIH0gZWxzZSB7CiAgICAgIHJlc3VsdCA9IHJlc3VsdFtwYXRoU2VnbWVudF07CiAgICB9CiAgfQogIHJldHVybiByZXN1bHQ7Cn0KZnVuY3Rpb24gZ2V0RmllbGRWYWx1ZXMob2JqLCBuYW1lKSB7CiAgdmFyIHBhdGggPSBuYW1lLnNwbGl0KCIuIik7CiAgdmFyIHJlc3VsdHMgPSBbb2JqXTsKICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGgubGVuZ3RoOyBpKyspIHsKICAgIHZhciBwYXRoU2VnbWVudCA9IHBhdGhbaV07CiAgICB2YXIgbnVtZXJpY0luZGV4ID0gcGFyc2VJbnQocGF0aFNlZ21lbnQsIDEwKTsKICAgIHZhciBuZXdSZXN1bHRzID0gW107CiAgICBmb3IgKHZhciBqID0gMDsgaiA8IHJlc3VsdHMubGVuZ3RoOyBqKyspIHsKICAgICAgdmFyIGN1cnJlbnQgPSByZXN1bHRzW2pdOwogICAgICBpZiAoY3VycmVudCA9PSB2b2lkIDAgfHwgY3VycmVudCA9PSBudWxsKSBjb250aW51ZTsKICAgICAgaWYgKGlzQXJyYXkoY3VycmVudCkgJiYgIWlzTmFOKG51bWVyaWNJbmRleCkgJiYgbnVtZXJpY0luZGV4ID49IDApIHsKICAgICAgICBpZiAobnVtZXJpY0luZGV4IDwgY3VycmVudC5sZW5ndGgpIHsKICAgICAgICAgIG5ld1Jlc3VsdHMucHVzaChjdXJyZW50W251bWVyaWNJbmRleF0pOwogICAgICAgIH0KICAgICAgfSBlbHNlIGlmIChpc0FycmF5KGN1cnJlbnQpKSB7CiAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBjdXJyZW50Lmxlbmd0aDsgaysrKSB7CiAgICAgICAgICBpZiAoY3VycmVudFtrXSAhPSB2b2lkIDAgJiYgY3VycmVudFtrXSAhPSBudWxsICYmIHR5cGVvZiBjdXJyZW50W2tdID09PSAib2JqZWN0IikgewogICAgICAgICAgICBuZXdSZXN1bHRzLnB1c2goY3VycmVudFtrXVtwYXRoU2VnbWVudF0pOwogICAgICAgICAgfQogICAgICAgIH0KICAgICAgfSBlbHNlIGlmICh0eXBlb2YgY3VycmVudCA9PT0gIm9iamVjdCIpIHsKICAgICAgICBuZXdSZXN1bHRzLnB1c2goY3VycmVudFtwYXRoU2VnbWVudF0pOwogICAgICB9CiAgICB9CiAgICByZXN1bHRzID0gbmV3UmVzdWx0czsKICB9CiAgcmVzdWx0cyA9IHJlc3VsdHMuZmlsdGVyKGZ1bmN0aW9uKHYpIHsKICAgIHJldHVybiB2ICE9PSB2b2lkIDA7CiAgfSk7CiAgaWYgKHJlc3VsdHMubGVuZ3RoID09PSAwKSByZXR1cm4gdm9pZCAwOwogIGlmIChyZXN1bHRzLmxlbmd0aCA9PT0gMSkgcmV0dXJuIHJlc3VsdHNbMF07CiAgcmV0dXJuIHJlc3VsdHM7Cn0KZnVuY3Rpb24gc2V0UHJvcChvYmosIG5hbWUsIHZhbHVlKSB7CiAgaWYgKG5hbWUuaW5kZXhPZigiJFtdIikgIT09IC0xKSB7CiAgICByZXR1cm4gc2V0UHJvcFdpdGhBbGxQb3NpdGlvbmFsKG9iaiwgbmFtZSwgdmFsdWUpOwogIH0KICB2YXIgcGF0aCA9IG5hbWUuc3BsaXQoIi4iKTsKICB2YXIgY3VycmVudCA9IG9iajsKICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGgubGVuZ3RoIC0gMTsgaSsrKSB7CiAgICB2YXIgcGF0aFNlZ21lbnQgPSBwYXRoW2ldOwogICAgdmFyIG51bWVyaWNJbmRleCA9IHBhcnNlSW50KHBhdGhTZWdtZW50LCAxMCk7CiAgICBpZiAoaXNBcnJheShjdXJyZW50KSAmJiAhaXNOYU4obnVtZXJpY0luZGV4KSAmJiBudW1lcmljSW5kZXggPj0gMCkgewogICAgICB3aGlsZSAoY3VycmVudC5sZW5ndGggPD0gbnVtZXJpY0luZGV4KSB7CiAgICAgICAgY3VycmVudC5wdXNoKHZvaWQgMCk7CiAgICAgIH0KICAgICAgaWYgKGN1cnJlbnRbbnVtZXJpY0luZGV4XSA9PSB2b2lkIDAgfHwgY3VycmVudFtudW1lcmljSW5kZXhdID09IG51bGwpIHsKICAgICAgICB2YXIgbmV4dFNlZ21lbnQgPSBwYXRoW2kgKyAxXTsKICAgICAgICB2YXIgbmV4dE51bWVyaWMgPSBwYXJzZUludChuZXh0U2VnbWVudCwgMTApOwogICAgICAgIGlmICghaXNOYU4obmV4dE51bWVyaWMpICYmIG5leHROdW1lcmljID49IDApIHsKICAgICAgICAgIGN1cnJlbnRbbnVtZXJpY0luZGV4XSA9IFtdOwogICAgICAgIH0gZWxzZSB7CiAgICAgICAgICBjdXJyZW50W251bWVyaWNJbmRleF0gPSB7fTsKICAgICAgICB9CiAgICAgIH0KICAgICAgY3VycmVudCA9IGN1cnJlbnRbbnVtZXJpY0luZGV4XTsKICAgIH0gZWxzZSB7CiAgICAgIGlmIChjdXJyZW50W3BhdGhTZWdtZW50XSA9PSB2b2lkIDAgfHwgY3VycmVudFtwYXRoU2VnbWVudF0gPT0gbnVsbCkgewogICAgICAgIHZhciBuZXh0U2VnbWVudCA9IHBhdGhbaSArIDFdOwogICAgICAgIHZhciBuZXh0TnVtZXJpYyA9IHBhcnNlSW50KG5leHRTZWdtZW50LCAxMCk7CiAgICAgICAgaWYgKCFpc05hTihuZXh0TnVtZXJpYykgJiYgbmV4dE51bWVyaWMgPj0gMCkgewogICAgICAgICAgY3VycmVudFtwYXRoU2VnbWVudF0gPSBbXTsKICAgICAgICB9IGVsc2UgewogICAgICAgICAgY3VycmVudFtwYXRoU2VnbWVudF0gPSB7fTsKICAgICAgICB9CiAgICAgIH0KICAgICAgY3VycmVudCA9IGN1cnJlbnRbcGF0aFNlZ21lbnRdOwogICAgfQogIH0KICB2YXIgbGFzdFNlZ21lbnQgPSBwYXRoW3BhdGgubGVuZ3RoIC0gMV07CiAgdmFyIGxhc3ROdW1lcmljSW5kZXggPSBwYXJzZUludChsYXN0U2VnbWVudCwgMTApOwogIGlmIChpc0FycmF5KGN1cnJlbnQpICYmICFpc05hTihsYXN0TnVtZXJpY0luZGV4KSAmJiBsYXN0TnVtZXJpY0luZGV4ID49IDApIHsKICAgIHdoaWxlIChjdXJyZW50Lmxlbmd0aCA8PSBsYXN0TnVtZXJpY0luZGV4KSB7CiAgICAgIGN1cnJlbnQucHVzaCh2b2lkIDApOwogICAgfQogICAgY3VycmVudFtsYXN0TnVtZXJpY0luZGV4XSA9IHZhbHVlOwogIH0gZWxzZSB7CiAgICBjdXJyZW50W2xhc3RTZWdtZW50XSA9IHZhbHVlOwogIH0KfQpmdW5jdGlvbiBzZXRQcm9wV2l0aEFsbFBvc2l0aW9uYWwob2JqLCBuYW1lLCB2YWx1ZSkgewogIHZhciBwYXRoID0gbmFtZS5zcGxpdCgiLiIpOwogIHZhciBjdXJyZW50ID0gb2JqOwogIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aC5sZW5ndGg7IGkrKykgewogICAgdmFyIHBhdGhTZWdtZW50ID0gcGF0aFtpXTsKICAgIGlmIChwYXRoU2VnbWVudCA9PT0gIiRbXSIpIHsKICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGN1cnJlbnQpKSB7CiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCJUaGUgcG9zaXRpb25hbCBvcGVyYXRvciBkaWQgbm90IGZpbmQgdGhlIG1hdGNoIG5lZWRlZCBmcm9tIHRoZSBxdWVyeS4iKTsKICAgICAgfQogICAgICB2YXIgcmVtYWluaW5nUGF0aCA9IHBhdGguc2xpY2UoaSArIDEpLmpvaW4oIi4iKTsKICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjdXJyZW50Lmxlbmd0aDsgaisrKSB7CiAgICAgICAgaWYgKHJlbWFpbmluZ1BhdGgpIHsKICAgICAgICAgIHNldFByb3AoY3VycmVudFtqXSwgcmVtYWluaW5nUGF0aCwgdmFsdWUpOwogICAgICAgIH0gZWxzZSB7CiAgICAgICAgICBjdXJyZW50W2pdID0gdmFsdWU7CiAgICAgICAgfQogICAgICB9CiAgICAgIHJldHVybjsKICAgIH0KICAgIHZhciBudW1lcmljSW5kZXggPSBwYXJzZUludChwYXRoU2VnbWVudCwgMTApOwogICAgaWYgKGlzQXJyYXkoY3VycmVudCkgJiYgIWlzTmFOKG51bWVyaWNJbmRleCkgJiYgbnVtZXJpY0luZGV4ID49IDApIHsKICAgICAgY3VycmVudCA9IGN1cnJlbnRbbnVtZXJpY0luZGV4XTsKICAgIH0gZWxzZSB7CiAgICAgIGlmIChjdXJyZW50W3BhdGhTZWdtZW50XSA9PSB2b2lkIDAgfHwgY3VycmVudFtwYXRoU2VnbWVudF0gPT0gbnVsbCkgewogICAgICAgIHZhciBuZXh0U2VnbWVudCA9IGkgKyAxIDwgcGF0aC5sZW5ndGggPyBwYXRoW2kgKyAxXSA6IG51bGw7CiAgICAgICAgaWYgKG5leHRTZWdtZW50ID09PSAiJFtdIikgewogICAgICAgICAgY3VycmVudFtwYXRoU2VnbWVudF0gPSBbXTsKICAgICAgICB9IGVsc2UgewogICAgICAgICAgdmFyIG5leHROdW1lcmljID0gcGFyc2VJbnQobmV4dFNlZ21lbnQsIDEwKTsKICAgICAgICAgIGlmICghaXNOYU4obmV4dE51bWVyaWMpICYmIG5leHROdW1lcmljID49IDApIHsKICAgICAgICAgICAgY3VycmVudFtwYXRoU2VnbWVudF0gPSBbXTsKICAgICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgIGN1cnJlbnRbcGF0aFNlZ21lbnRdID0ge307CiAgICAgICAgICB9CiAgICAgICAgfQogICAgICB9CiAgICAgIGN1cnJlbnQgPSBjdXJyZW50W3BhdGhTZWdtZW50XTsKICAgIH0KICB9Cn0KZnVuY3Rpb24gaXNBcnJheShvKSB7CiAgcmV0dXJuIEFycmF5ID09IG8uY29uc3RydWN0b3I7Cn0KZnVuY3Rpb24gdG9BcnJheShvYmopIHsKICB2YXIgYXJyID0gW107CiAgZm9yICh2YXIga2V5IGluIG9iaikgewogICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7CiAgICAgIHZhciBlbCA9IHt9OwogICAgICBlbFtrZXldID0gb2JqW2tleV07CiAgICAgIGFyci5wdXNoKGVsKTsKICAgIH0KICB9CiAgcmV0dXJuIGFycjsKfQpmdW5jdGlvbiBpc0luKHZhbCwgdmFsdWVzKSB7CiAgZm9yICh2YXIgaSA9IDA7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpKyspIHsKICAgIGlmICh2YWx1ZXNFcXVhbCQxKHZhbHVlc1tpXSwgdmFsKSkgcmV0dXJuIHRydWU7CiAgfQogIHJldHVybiBmYWxzZTsKfQpmdW5jdGlvbiBhcnJheU1hdGNoZXMoeCwgeSkgewogIGlmICh4Lmxlbmd0aCAhPSB5Lmxlbmd0aCkgcmV0dXJuIGZhbHNlOwogIGZvciAodmFyIGkgPSAwOyBpIDwgeC5sZW5ndGg7IGkrKykgewogICAgaWYgKHZhbHVlc0VxdWFsJDEoeFtpXSwgeVtpXSkpIGNvbnRpbnVlOwogICAgaWYgKHR5cGVvZiB4W2ldICE9IHR5cGVvZiB5W2ldKSByZXR1cm4gZmFsc2U7CiAgICBpZiAodHlwZW9mIHhbaV0gPT0gIm9iamVjdCIgJiYgeFtpXSAhPT0gbnVsbCkgewogICAgICBpZiAoaXNBcnJheSh4W2ldKSkgewogICAgICAgIGlmICghYXJyYXlNYXRjaGVzKHhbaV0sIHlbaV0pKSByZXR1cm4gZmFsc2U7CiAgICAgIH0gZWxzZSB7CiAgICAgICAgaWYgKCFvYmplY3RNYXRjaGVzKHhbaV0sIHlbaV0pKSByZXR1cm4gZmFsc2U7CiAgICAgIH0KICAgIH0gZWxzZSB7CiAgICAgIGlmICghdmFsdWVzRXF1YWwkMSh4W2ldLCB5W2ldKSkgcmV0dXJuIGZhbHNlOwogICAgfQogIH0KICByZXR1cm4gdHJ1ZTsKfQpmdW5jdGlvbiBvYmplY3RNYXRjaGVzKHgsIHkpIHsKICBmb3IgKHZhciBwIGluIHgpIHsKICAgIGlmICgheC5oYXNPd25Qcm9wZXJ0eShwKSkgY29udGludWU7CiAgICBpZiAoIXkuaGFzT3duUHJvcGVydHkocCkpIHJldHVybiBmYWxzZTsKICAgIGlmICh2YWx1ZXNFcXVhbCQxKHhbcF0sIHlbcF0pKSBjb250aW51ZTsKICAgIGlmICh0eXBlb2YgeFtwXSAhPSB0eXBlb2YgeVtwXSkgcmV0dXJuIGZhbHNlOwogICAgaWYgKHR5cGVvZiB4W3BdID09ICJvYmplY3QiICYmIHhbcF0gIT09IG51bGwpIHsKICAgICAgaWYgKGlzQXJyYXkoeFtwXSkpIHsKICAgICAgICBpZiAoIWFycmF5TWF0Y2hlcyh4W3BdLCB5W3BdKSkgcmV0dXJuIGZhbHNlOwogICAgICB9IGVsc2UgewogICAgICAgIGlmICghb2JqZWN0TWF0Y2hlcyh4W3BdLCB5W3BdKSkgcmV0dXJuIGZhbHNlOwogICAgICB9CiAgICB9IGVsc2UgewogICAgICBpZiAoIXZhbHVlc0VxdWFsJDEoeFtwXSwgeVtwXSkpIHJldHVybiBmYWxzZTsKICAgIH0KICB9CiAgZm9yICh2YXIgcCBpbiB5KSB7CiAgICBpZiAoeS5oYXNPd25Qcm9wZXJ0eShwKSAmJiAheC5oYXNPd25Qcm9wZXJ0eShwKSkgcmV0dXJuIGZhbHNlOwogIH0KICByZXR1cm4gdHJ1ZTsKfQpmdW5jdGlvbiBhcHBseVByb2plY3Rpb24ocHJvamVjdGlvbiwgZG9jKSB7CiAgdmFyIHJlc3VsdCA9IHt9OwogIHZhciBrZXlzID0gT2JqZWN0LmtleXMocHJvamVjdGlvbik7CiAgaWYgKGtleXMubGVuZ3RoID09IDApIHJldHVybiBkb2M7CiAgdmFyIGhhc0luY2x1c2lvbiA9IGZhbHNlOwogIHZhciBoYXNFeGNsdXNpb24gPSBmYWxzZTsKICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHsKICAgIGlmIChrZXlzW2ldID09PSAiX2lkIikgY29udGludWU7CiAgICBpZiAocHJvamVjdGlvbltrZXlzW2ldXSkgaGFzSW5jbHVzaW9uID0gdHJ1ZTsKICAgIGVsc2UgaGFzRXhjbHVzaW9uID0gdHJ1ZTsKICB9CiAgaWYgKGhhc0luY2x1c2lvbiAmJiBoYXNFeGNsdXNpb24pIHsKICAgIHRocm93IHsgJGVycjogIkNhbid0IGNhbm9uaWNhbGl6ZSBxdWVyeTogQmFkVmFsdWUgUHJvamVjdGlvbiBjYW5ub3QgaGF2ZSBhIG1peCBvZiBpbmNsdXNpb24gYW5kIGV4Y2x1c2lvbi4iLCBjb2RlOiAxNzI4NyB9OwogIH0KICBpZiAocHJvamVjdGlvbltrZXlzWzBdXSB8fCBoYXNJbmNsdXNpb24pIHsKICAgIGlmIChwcm9qZWN0aW9uLl9pZCAhPT0gMCkgewogICAgICByZXN1bHQuX2lkID0gZG9jLl9pZDsKICAgIH0KICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykgewogICAgICBpZiAoa2V5c1tpXSA9PT0gIl9pZCIpIGNvbnRpbnVlOwogICAgICBpZiAoIXByb2plY3Rpb25ba2V5c1tpXV0pIGNvbnRpbnVlOwogICAgICB2YXIgZmllbGRQYXRoID0ga2V5c1tpXTsKICAgICAgdmFyIHZhbHVlID0gZ2V0UHJvcChkb2MsIGZpZWxkUGF0aCk7CiAgICAgIGlmICh2YWx1ZSAhPT0gdm9pZCAwKSB7CiAgICAgICAgc2V0UHJvcChyZXN1bHQsIGZpZWxkUGF0aCwgdmFsdWUpOwogICAgICB9CiAgICB9CiAgfSBlbHNlIHsKICAgIGZvciAodmFyIGtleSBpbiBkb2MpIHsKICAgICAgaWYgKGRvYy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7CiAgICAgICAgdmFyIHZhbCA9IGRvY1trZXldOwogICAgICAgIGlmICh0eXBlb2YgdmFsID09PSAib2JqZWN0IiAmJiB2YWwgIT09IG51bGwgJiYgIWlzQXJyYXkodmFsKSkgewogICAgICAgICAgcmVzdWx0W2tleV0gPSBjb3B5KHZhbCk7CiAgICAgICAgfSBlbHNlIGlmIChpc0FycmF5KHZhbCkpIHsKICAgICAgICAgIHJlc3VsdFtrZXldID0gdmFsLnNsaWNlKCk7CiAgICAgICAgfSBlbHNlIHsKICAgICAgICAgIHJlc3VsdFtrZXldID0gdmFsOwogICAgICAgIH0KICAgICAgfQogICAgfQogICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7CiAgICAgIGlmIChwcm9qZWN0aW9uW2tleXNbaV1dKSBjb250aW51ZTsKICAgICAgdmFyIGZpZWxkUGF0aCA9IGtleXNbaV07CiAgICAgIHZhciBwYXRoUGFydHMgPSBmaWVsZFBhdGguc3BsaXQoIi4iKTsKICAgICAgaWYgKHBhdGhQYXJ0cy5sZW5ndGggPT09IDEpIHsKICAgICAgICBkZWxldGUgcmVzdWx0W2ZpZWxkUGF0aF07CiAgICAgIH0gZWxzZSB7CiAgICAgICAgdmFyIHBhcmVudCA9IHJlc3VsdDsKICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHBhdGhQYXJ0cy5sZW5ndGggLSAxOyBqKyspIHsKICAgICAgICAgIGlmIChwYXJlbnQgPT0gdm9pZCAwIHx8IHBhcmVudCA9PSBudWxsKSBicmVhazsKICAgICAgICAgIHBhcmVudCA9IHBhcmVudFtwYXRoUGFydHNbal1dOwogICAgICAgIH0KICAgICAgICBpZiAocGFyZW50ICE9IHZvaWQgMCAmJiBwYXJlbnQgIT0gbnVsbCkgewogICAgICAgICAgZGVsZXRlIHBhcmVudFtwYXRoUGFydHNbcGF0aFBhcnRzLmxlbmd0aCAtIDFdXTsKICAgICAgICB9CiAgICAgIH0KICAgIH0KICB9CiAgcmV0dXJuIHJlc3VsdDsKfQpjb25zdCBFcnJvckNvZGVzID0gewogIEJBRF9WQUxVRTogMiwKICBVTktOT1dOX0VSUk9SOiA4LAogIEZBSUxFRF9UT19QQVJTRTogMTcyODcsCiAgLy8gVXNpbmcgdGVzdC1jb21wYXRpYmxlIGVycm9yIGNvZGUKICBOQU1FU1BBQ0VfTk9UX0ZPVU5EOiAyNiwKICBJTkRFWF9OT1RfRk9VTkQ6IDI3LAogIElOREVYX09QVElPTlNfQ09ORkxJQ1Q6IDg1LAogIERVUExJQ0FURV9LRVk6IDExZTMsCiAgLy8gUXVlcnkgZXJyb3JzCiAgQkFEX1FVRVJZOiAyLAogIENBTk5PVF9ET19FWENMVVNJT05fT05fRklFTERfSURfSU5fSU5DTFVTSU9OX1BST0pFQ1RJT046IDMxMjU0LAogIC8vIE5vdCBpbXBsZW1lbnRlZCAoY3VzdG9tIGNvZGUpCiAgTk9UX0lNUExFTUVOVEVEOiA5OTkKfTsKY2xhc3MgTW9uZ29FcnJvciBleHRlbmRzIEVycm9yIHsKICBjb25zdHJ1Y3RvcihtZXNzYWdlLCBvcHRpb25zID0ge30pIHsKICAgIHN1cGVyKG1lc3NhZ2UpOwogICAgdGhpcy5uYW1lID0gIk1vbmdvRXJyb3IiOwogICAgdGhpcy5jb2RlID0gb3B0aW9ucy5jb2RlIHx8IEVycm9yQ29kZXMuVU5LTk9XTl9FUlJPUjsKICAgIHRoaXMuY29kZU5hbWUgPSB0aGlzLl9nZXRDb2RlTmFtZSh0aGlzLmNvZGUpOwogICAgdGhpcy4kZXJyID0gbWVzc2FnZTsKICAgIGlmIChvcHRpb25zLmNvbGxlY3Rpb24pIHRoaXMuY29sbGVjdGlvbiA9IG9wdGlvbnMuY29sbGVjdGlvbjsKICAgIGlmIChvcHRpb25zLmRhdGFiYXNlKSB0aGlzLmRhdGFiYXNlID0gb3B0aW9ucy5kYXRhYmFzZTsKICAgIGlmIChvcHRpb25zLm9wZXJhdGlvbikgdGhpcy5vcGVyYXRpb24gPSBvcHRpb25zLm9wZXJhdGlvbjsKICAgIGlmIChvcHRpb25zLnF1ZXJ5KSB0aGlzLnF1ZXJ5ID0gb3B0aW9ucy5xdWVyeTsKICAgIGlmIChvcHRpb25zLmRvY3VtZW50KSB0aGlzLmRvY3VtZW50ID0gb3B0aW9ucy5kb2N1bWVudDsKICAgIGlmIChvcHRpb25zLmZpZWxkKSB0aGlzLmZpZWxkID0gb3B0aW9ucy5maWVsZDsKICAgIGlmIChvcHRpb25zLmluZGV4KSB0aGlzLmluZGV4ID0gb3B0aW9ucy5pbmRleDsKICAgIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkgewogICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yKTsKICAgIH0KICB9CiAgX2dldENvZGVOYW1lKGNvZGUpIHsKICAgIGNvbnN0IGNvZGVUb05hbWUgPSB7CiAgICAgIDA6ICJPSyIsCiAgICAgIDE6ICJJbnRlcm5hbEVycm9yIiwKICAgICAgMjogIkJhZFZhbHVlIiwKICAgICAgNDogIk5vU3VjaEtleSIsCiAgICAgIDU6ICJHcmFwaENvbnRhaW5zQ3ljbGUiLAogICAgICA2OiAiSG9zdFVucmVhY2hhYmxlIiwKICAgICAgNzogIkhvc3ROb3RGb3VuZCIsCiAgICAgIDg6ICJVbmtub3duRXJyb3IiLAogICAgICAxMDogIkNhbm5vdE11dGF0ZU9iamVjdCIsCiAgICAgIDExOiAiVXNlck5vdEZvdW5kIiwKICAgICAgMTI6ICJVbnN1cHBvcnRlZEZvcm1hdCIsCiAgICAgIDEzOiAiVW5hdXRob3JpemVkIiwKICAgICAgMTQ6ICJUeXBlTWlzbWF0Y2giLAogICAgICAxNTogIk92ZXJmbG93IiwKICAgICAgMTY6ICJJbnZhbGlkTGVuZ3RoIiwKICAgICAgMTc6ICJQcm90b2NvbEVycm9yIiwKICAgICAgMTg6ICJBdXRoZW50aWNhdGlvbkZhaWxlZCIsCiAgICAgIDIwOiAiSWxsZWdhbE9wZXJhdGlvbiIsCiAgICAgIDI2OiAiTmFtZXNwYWNlTm90Rm91bmQiLAogICAgICAyNzogIkluZGV4Tm90Rm91bmQiLAogICAgICAyODogIlBhdGhOb3RWaWFibGUiLAogICAgICA0MzogIkN1cnNvck5vdEZvdW5kIiwKICAgICAgNDg6ICJOYW1lc3BhY2VFeGlzdHMiLAogICAgICA1OTogIkNvbW1hbmROb3RGb3VuZCIsCiAgICAgIDY3OiAiQ2Fubm90Q3JlYXRlSW5kZXgiLAogICAgICA2ODogIkluZGV4RXhpc3RzIiwKICAgICAgNzM6ICJJbnZhbGlkTmFtZXNwYWNlIiwKICAgICAgODU6ICJJbmRleE9wdGlvbnNDb25mbGljdCIsCiAgICAgIDExMjogIldyaXRlQ29uZmxpY3QiLAogICAgICAxMjE6ICJEb2N1bWVudFZhbGlkYXRpb25GYWlsdXJlIiwKICAgICAgMTcxOiAiQ2Fubm90SW5kZXhQYXJhbGxlbEFycmF5cyIsCiAgICAgIDE5NzogIkludmFsaWRJbmRleFNwZWNpZmljYXRpb25PcHRpb24iLAogICAgICA5OTg6ICJPcGVyYXRpb25Ob3RTdXBwb3J0ZWQiLAogICAgICA5OTk6ICJOb3RJbXBsZW1lbnRlZCIsCiAgICAgIDExZTM6ICJEdXBsaWNhdGVLZXkiLAogICAgICAxMTAwMTogIkR1cGxpY2F0ZUtleVVwZGF0ZSIsCiAgICAgIDE3Mjg3OiAiRmFpbGVkVG9QYXJzZSIKICAgIH07CiAgICByZXR1cm4gY29kZVRvTmFtZVtjb2RlXSB8fCAiVW5rbm93bkVycm9yIjsKICB9CiAgdG9KU09OKCkgewogICAgY29uc3QganNvbiA9IHsKICAgICAgbmFtZTogdGhpcy5uYW1lLAogICAgICBtZXNzYWdlOiB0aGlzLm1lc3NhZ2UsCiAgICAgIGNvZGU6IHRoaXMuY29kZSwKICAgICAgY29kZU5hbWU6IHRoaXMuY29kZU5hbWUKICAgIH07CiAgICBpZiAodGhpcy5jb2xsZWN0aW9uKSBqc29uLmNvbGxlY3Rpb24gPSB0aGlzLmNvbGxlY3Rpb247CiAgICBpZiAodGhpcy5kYXRhYmFzZSkganNvbi5kYXRhYmFzZSA9IHRoaXMuZGF0YWJhc2U7CiAgICBpZiAodGhpcy5vcGVyYXRpb24pIGpzb24ub3BlcmF0aW9uID0gdGhpcy5vcGVyYXRpb247CiAgICBpZiAodGhpcy5pbmRleCkganNvbi5pbmRleCA9IHRoaXMuaW5kZXg7CiAgICBpZiAodGhpcy5pbmRleE5hbWUpIGpzb24uaW5kZXhOYW1lID0gdGhpcy5pbmRleE5hbWU7CiAgICBpZiAodGhpcy5maWVsZCkganNvbi5maWVsZCA9IHRoaXMuZmllbGQ7CiAgICBpZiAodGhpcy5xdWVyeSkganNvbi5xdWVyeSA9IHRoaXMucXVlcnk7CiAgICBpZiAodGhpcy5kb2N1bWVudCkganNvbi5kb2N1bWVudCA9IHRoaXMuZG9jdW1lbnQ7CiAgICBpZiAodGhpcy5uYW1lc3BhY2UpIGpzb24ubmFtZXNwYWNlID0gdGhpcy5uYW1lc3BhY2U7CiAgICBpZiAodGhpcy5jdXJzb3JJZCkganNvbi5jdXJzb3JJZCA9IHRoaXMuY3Vyc29ySWQ7CiAgICBpZiAodGhpcy5mZWF0dXJlKSBqc29uLmZlYXR1cmUgPSB0aGlzLmZlYXR1cmU7CiAgICBpZiAodGhpcy5rZXlQYXR0ZXJuKSBqc29uLmtleVBhdHRlcm4gPSB0aGlzLmtleVBhdHRlcm47CiAgICBpZiAodGhpcy5rZXlWYWx1ZSkganNvbi5rZXlWYWx1ZSA9IHRoaXMua2V5VmFsdWU7CiAgICBpZiAodGhpcy53cml0ZUVycm9ycykganNvbi53cml0ZUVycm9ycyA9IHRoaXMud3JpdGVFcnJvcnM7CiAgICByZXR1cm4ganNvbjsKICB9Cn0KY2xhc3MgSW5kZXhFcnJvciBleHRlbmRzIE1vbmdvRXJyb3IgewogIGNvbnN0cnVjdG9yKG1lc3NhZ2UsIG9wdGlvbnMgPSB7fSkgewogICAgc3VwZXIobWVzc2FnZSwgb3B0aW9ucyk7CiAgICB0aGlzLm5hbWUgPSAiSW5kZXhFcnJvciI7CiAgfQp9CmNsYXNzIEluZGV4Tm90Rm91bmRFcnJvciBleHRlbmRzIEluZGV4RXJyb3IgewogIGNvbnN0cnVjdG9yKGluZGV4TmFtZSwgb3B0aW9ucyA9IHt9KSB7CiAgICBzdXBlcihgSW5kZXggJyR7aW5kZXhOYW1lfScgbm90IGZvdW5kYCwgewogICAgICAuLi5vcHRpb25zLAogICAgICBjb2RlOiBFcnJvckNvZGVzLklOREVYX05PVF9GT1VORCwKICAgICAgaW5kZXg6IGluZGV4TmFtZQogICAgfSk7CiAgICB0aGlzLm5hbWUgPSAiSW5kZXhOb3RGb3VuZEVycm9yIjsKICAgIHRoaXMuaW5kZXhOYW1lID0gaW5kZXhOYW1lOwogIH0KfQpjbGFzcyBRdWVyeUVycm9yIGV4dGVuZHMgTW9uZ29FcnJvciB7CiAgY29uc3RydWN0b3IobWVzc2FnZSwgb3B0aW9ucyA9IHt9KSB7CiAgICBzdXBlcihtZXNzYWdlLCBvcHRpb25zKTsKICAgIHRoaXMubmFtZSA9ICJRdWVyeUVycm9yIjsKICAgIHRoaXMuY29kZSA9IG9wdGlvbnMuY29kZSB8fCBFcnJvckNvZGVzLkJBRF9RVUVSWTsKICB9Cn0KY2xhc3MgTm90SW1wbGVtZW50ZWRFcnJvciBleHRlbmRzIE1vbmdvRXJyb3IgewogIGNvbnN0cnVjdG9yKGZlYXR1cmUsIG9wdGlvbnMgPSB7fSkgewogICAgc3VwZXIoYCR7ZmVhdHVyZX0gaXMgbm90IGltcGxlbWVudGVkIGluIG1pY3JvLW1vbmdvYCwgewogICAgICAuLi5vcHRpb25zLAogICAgICBjb2RlOiBFcnJvckNvZGVzLk5PVF9JTVBMRU1FTlRFRAogICAgfSk7CiAgICB0aGlzLm5hbWUgPSAiTm90SW1wbGVtZW50ZWRFcnJvciI7CiAgICB0aGlzLmZlYXR1cmUgPSBmZWF0dXJlOwogIH0KfQpjbGFzcyBCYWRWYWx1ZUVycm9yIGV4dGVuZHMgTW9uZ29FcnJvciB7CiAgY29uc3RydWN0b3IoZmllbGQsIHZhbHVlLCByZWFzb24sIG9wdGlvbnMgPSB7fSkgewogICAgc3VwZXIoYEJhZCB2YWx1ZSBmb3IgZmllbGQgJyR7ZmllbGR9JzogJHtyZWFzb259YCwgewogICAgICAuLi5vcHRpb25zLAogICAgICBjb2RlOiBFcnJvckNvZGVzLkJBRF9WQUxVRSwKICAgICAgZmllbGQKICAgIH0pOwogICAgdGhpcy5uYW1lID0gIkJhZFZhbHVlRXJyb3IiOwogICAgdGhpcy52YWx1ZSA9IHZhbHVlOwogIH0KfQpjbGFzcyBDdXJzb3IgewogIGNvbnN0cnVjdG9yKGNvbGxlY3Rpb24sIHF1ZXJ5LCBwcm9qZWN0aW9uLCBkb2N1bWVudHNPclByb21pc2UsIFNvcnRlZEN1cnNvcjIpIHsKICAgIHRoaXMuY29sbGVjdGlvbiA9IGNvbGxlY3Rpb247CiAgICB0aGlzLnF1ZXJ5ID0gcXVlcnk7CiAgICB0aGlzLnByb2plY3Rpb24gPSBwcm9qZWN0aW9uOwogICAgdGhpcy5fZG9jdW1lbnRzUHJvbWlzZSA9IGRvY3VtZW50c09yUHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UgPyBkb2N1bWVudHNPclByb21pc2UgOiBQcm9taXNlLnJlc29sdmUoZG9jdW1lbnRzT3JQcm9taXNlKTsKICAgIHRoaXMuZG9jdW1lbnRzID0gbnVsbDsKICAgIHRoaXMuX2luaXRpYWxpemVkID0gZmFsc2U7CiAgICB0aGlzLlNvcnRlZEN1cnNvciA9IFNvcnRlZEN1cnNvcjI7CiAgICBpZiAocHJvamVjdGlvbiAmJiBPYmplY3Qua2V5cyhwcm9qZWN0aW9uKS5sZW5ndGggPiAwKSB7CiAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhwcm9qZWN0aW9uKTsKICAgICAgbGV0IGhhc0luY2x1c2lvbiA9IGZhbHNlOwogICAgICBsZXQgaGFzRXhjbHVzaW9uID0gZmFsc2U7CiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykgewogICAgICAgIGlmIChrZXlzW2ldID09PSAiX2lkIikgY29udGludWU7CiAgICAgICAgaWYgKHByb2plY3Rpb25ba2V5c1tpXV0pIGhhc0luY2x1c2lvbiA9IHRydWU7CiAgICAgICAgZWxzZSBoYXNFeGNsdXNpb24gPSB0cnVlOwogICAgICB9CiAgICAgIGlmIChoYXNJbmNsdXNpb24gJiYgaGFzRXhjbHVzaW9uKSB7CiAgICAgICAgdGhyb3cgbmV3IFF1ZXJ5RXJyb3IoIkNhbid0IGNhbm9uaWNhbGl6ZSBxdWVyeTogQmFkVmFsdWUgUHJvamVjdGlvbiBjYW5ub3QgaGF2ZSBhIG1peCBvZiBpbmNsdXNpb24gYW5kIGV4Y2x1c2lvbi4iLCB7CiAgICAgICAgICBjb2RlOiBFcnJvckNvZGVzLkZBSUxFRF9UT19QQVJTRSwKICAgICAgICAgIGNvbGxlY3Rpb246IGNvbGxlY3Rpb24ubmFtZQogICAgICAgIH0pOwogICAgICB9CiAgICB9CiAgICB0aGlzLnBvcyA9IDA7CiAgICB0aGlzLl9saW1pdCA9IDA7CiAgICB0aGlzLl9za2lwID0gMDsKICAgIHRoaXMuX2Nsb3NlZCA9IGZhbHNlOwogIH0KICAvKioKICAgKiBFbnN1cmUgZG9jdW1lbnRzIGFyZSBsb2FkZWQgZnJvbSB0aGUgcHJvbWlzZQogICAqIEBwcml2YXRlCiAgICovCiAgYXN5bmMgX2Vuc3VyZUluaXRpYWxpemVkKCkgewogICAgaWYgKCF0aGlzLl9pbml0aWFsaXplZCkgewogICAgICB0aGlzLmRvY3VtZW50cyA9IGF3YWl0IHRoaXMuX2RvY3VtZW50c1Byb21pc2U7CiAgICAgIHRoaXMuX2luaXRpYWxpemVkID0gdHJ1ZTsKICAgIH0KICB9CiAgYmF0Y2hTaXplKHNpemUpIHsKICAgIHRoaXMuX2JhdGNoU2l6ZSA9IHNpemU7CiAgICByZXR1cm4gdGhpczsKICB9CiAgY2xvc2UoKSB7CiAgICB0aGlzLl9jbG9zZWQgPSB0cnVlOwogICAgaWYgKHRoaXMuZG9jdW1lbnRzKSB7CiAgICAgIHRoaXMucG9zID0gdGhpcy5kb2N1bWVudHMubGVuZ3RoOwogICAgfQogICAgcmV0dXJuIHZvaWQgMDsKICB9CiAgY29tbWVudChjb21tZW50U3RyaW5nKSB7CiAgICB0aGlzLl9jb21tZW50ID0gY29tbWVudFN0cmluZzsKICAgIHJldHVybiB0aGlzOwogIH0KICBhc3luYyBjb3VudCgpIHsKICAgIGF3YWl0IHRoaXMuX2Vuc3VyZUluaXRpYWxpemVkKCk7CiAgICByZXR1cm4gdGhpcy5kb2N1bWVudHMubGVuZ3RoOwogIH0KICBleHBsYWluKHZlcmJvc2l0eSA9ICJxdWVyeVBsYW5uZXIiKSB7CiAgICByZXR1cm4gewogICAgICBxdWVyeVBsYW5uZXI6IHsKICAgICAgICBwbGFubmVyVmVyc2lvbjogMSwKICAgICAgICBuYW1lc3BhY2U6IGAke3RoaXMuY29sbGVjdGlvbi5kYj8ubmFtZSB8fCAiZGIifS4ke3RoaXMuY29sbGVjdGlvbi5uYW1lfWAsCiAgICAgICAgaW5kZXhGaWx0ZXJTZXQ6IGZhbHNlLAogICAgICAgIHBhcnNlZFF1ZXJ5OiB0aGlzLnF1ZXJ5LAogICAgICAgIHdpbm5pbmdQbGFuOiB7CiAgICAgICAgICBzdGFnZTogIkNPTExTQ0FOIiwKICAgICAgICAgIGZpbHRlcjogdGhpcy5xdWVyeSwKICAgICAgICAgIGRpcmVjdGlvbjogImZvcndhcmQiCiAgICAgICAgfQogICAgICB9LAogICAgICBleGVjdXRpb25TdGF0czogdmVyYm9zaXR5ID09PSAiZXhlY3V0aW9uU3RhdHMiIHx8IHZlcmJvc2l0eSA9PT0gImFsbFBsYW5zRXhlY3V0aW9uIiA/IHsKICAgICAgICBleGVjdXRpb25TdWNjZXNzOiB0cnVlLAogICAgICAgIG5SZXR1cm5lZDogdGhpcy5kb2N1bWVudHMgPyB0aGlzLmRvY3VtZW50cy5sZW5ndGggOiAwLAogICAgICAgIGV4ZWN1dGlvblRpbWVNaWxsaXM6IDAsCiAgICAgICAgdG90YWxLZXlzRXhhbWluZWQ6IDAsCiAgICAgICAgdG90YWxEb2NzRXhhbWluZWQ6IHRoaXMuZG9jdW1lbnRzID8gdGhpcy5kb2N1bWVudHMubGVuZ3RoIDogMAogICAgICB9IDogdm9pZCAwLAogICAgICBvazogMQogICAgfTsKICB9CiAgYXN5bmMgZm9yRWFjaChmbikgewogICAgYXdhaXQgdGhpcy5fZW5zdXJlSW5pdGlhbGl6ZWQoKTsKICAgIHdoaWxlIChhd2FpdCB0aGlzLmhhc05leHQoKSkgewogICAgICBhd2FpdCBmbihhd2FpdCB0aGlzLm5leHQoKSk7CiAgICB9CiAgfQogIGFzeW5jIGhhc05leHQoKSB7CiAgICBpZiAodGhpcy5fY2xvc2VkKSByZXR1cm4gZmFsc2U7CiAgICBhd2FpdCB0aGlzLl9lbnN1cmVJbml0aWFsaXplZCgpOwogICAgaWYgKHRoaXMucG9zID09PSAwICYmIHRoaXMuX3NraXAgPiAwKSB7CiAgICAgIHRoaXMucG9zID0gTWF0aC5taW4odGhpcy5fc2tpcCwgdGhpcy5kb2N1bWVudHMubGVuZ3RoKTsKICAgIH0KICAgIGxldCBlZmZlY3RpdmVNYXg7CiAgICBpZiAodGhpcy5fbGltaXQgPiAwKSB7CiAgICAgIGVmZmVjdGl2ZU1heCA9IE1hdGgubWluKHRoaXMuX3NraXAgKyB0aGlzLl9saW1pdCwgdGhpcy5kb2N1bWVudHMubGVuZ3RoKTsKICAgIH0gZWxzZSB7CiAgICAgIGVmZmVjdGl2ZU1heCA9IHRoaXMuZG9jdW1lbnRzLmxlbmd0aDsKICAgIH0KICAgIHJldHVybiB0aGlzLnBvcyA8IGVmZmVjdGl2ZU1heDsKICB9CiAgaGludChpbmRleCkgewogICAgdGhpcy5faGludCA9IGluZGV4OwogICAgcmV0dXJuIHRoaXM7CiAgfQogIGFzeW5jIGl0Y291bnQoKSB7CiAgICBhd2FpdCB0aGlzLl9lbnN1cmVJbml0aWFsaXplZCgpOwogICAgbGV0IGNvdW50ID0gMDsKICAgIHdoaWxlIChhd2FpdCB0aGlzLmhhc05leHQoKSkgewogICAgICBhd2FpdCB0aGlzLm5leHQoKTsKICAgICAgY291bnQrKzsKICAgIH0KICAgIHJldHVybiBjb3VudDsKICB9CiAgbGltaXQoX21heCkgewogICAgdGhpcy5fbGltaXQgPSBfbWF4OwogICAgcmV0dXJuIHRoaXM7CiAgfQogIGFzeW5jIG1hcChmbikgewogICAgYXdhaXQgdGhpcy5fZW5zdXJlSW5pdGlhbGl6ZWQoKTsKICAgIGNvbnN0IHJlc3VsdHMgPSBbXTsKICAgIHdoaWxlIChhd2FpdCB0aGlzLmhhc05leHQoKSkgewogICAgICByZXN1bHRzLnB1c2goYXdhaXQgZm4oYXdhaXQgdGhpcy5uZXh0KCkpKTsKICAgIH0KICAgIHJldHVybiByZXN1bHRzOwogIH0KICBtYXhTY2FuKG1heFNjYW4pIHsKICAgIHRoaXMuX21heFNjYW4gPSBtYXhTY2FuOwogICAgcmV0dXJuIHRoaXM7CiAgfQogIG1heFRpbWVNUyhtcykgewogICAgdGhpcy5fbWF4VGltZU1TID0gbXM7CiAgICByZXR1cm4gdGhpczsKICB9CiAgbWF4KGluZGV4Qm91bmRzKSB7CiAgICB0aGlzLl9tYXhJbmRleEJvdW5kcyA9IGluZGV4Qm91bmRzOwogICAgcmV0dXJuIHRoaXM7CiAgfQogIG1pbihpbmRleEJvdW5kcykgewogICAgdGhpcy5fbWluSW5kZXhCb3VuZHMgPSBpbmRleEJvdW5kczsKICAgIHJldHVybiB0aGlzOwogIH0KICBhc3luYyBuZXh0KCkgewogICAgaWYgKCFhd2FpdCB0aGlzLmhhc05leHQoKSkgewogICAgICB0aHJvdyBuZXcgUXVlcnlFcnJvcigiRXJyb3I6IGVycm9yIGhhc05leHQ6IGZhbHNlIiwgewogICAgICAgIGNvbGxlY3Rpb246IHRoaXMuY29sbGVjdGlvbi5uYW1lCiAgICAgIH0pOwogICAgfQogICAgY29uc3QgcmVzdWx0ID0gdGhpcy5kb2N1bWVudHNbdGhpcy5wb3MrK107CiAgICBpZiAodGhpcy5wcm9qZWN0aW9uKSB7CiAgICAgIHJldHVybiBhcHBseVByb2plY3Rpb24odGhpcy5wcm9qZWN0aW9uLCByZXN1bHQpOwogICAgfQogICAgcmV0dXJuIHJlc3VsdDsKICB9CiAgbm9DdXJzb3JUaW1lb3V0KCkgewogICAgdGhpcy5fbm9DdXJzb3JUaW1lb3V0ID0gdHJ1ZTsKICAgIHJldHVybiB0aGlzOwogIH0KICBvYmpzTGVmdEluQmF0Y2goKSB7CiAgICBpZiAoIXRoaXMuZG9jdW1lbnRzKSByZXR1cm4gMDsKICAgIHJldHVybiB0aGlzLnNpemUoKTsKICB9CiAgcHJldHR5KCkgewogICAgdGhpcy5fcHJldHR5ID0gdHJ1ZTsKICAgIHJldHVybiB0aGlzOwogIH0KICByZWFkQ29uY2VybihsZXZlbCkgewogICAgdGhpcy5fcmVhZENvbmNlcm4gPSBsZXZlbDsKICAgIHJldHVybiB0aGlzOwogIH0KICByZWFkUHJlZihtb2RlLCB0YWdTZXQpIHsKICAgIHRoaXMuX3JlYWRQcmVmID0geyBtb2RlLCB0YWdTZXQgfTsKICAgIHJldHVybiB0aGlzOwogIH0KICByZXR1cm5LZXkoZW5hYmxlZCA9IHRydWUpIHsKICAgIHRoaXMuX3JldHVybktleSA9IGVuYWJsZWQ7CiAgICByZXR1cm4gdGhpczsKICB9CiAgc2hvd1JlY29yZElkKGVuYWJsZWQgPSB0cnVlKSB7CiAgICB0aGlzLl9zaG93UmVjb3JkSWQgPSBlbmFibGVkOwogICAgcmV0dXJuIHRoaXM7CiAgfQogIHNpemUoKSB7CiAgICBpZiAoIXRoaXMuZG9jdW1lbnRzKSByZXR1cm4gMDsKICAgIGNvbnN0IHJlbWFpbmluZyA9IHRoaXMuZG9jdW1lbnRzLmxlbmd0aCAtIHRoaXMucG9zOwogICAgaWYgKHRoaXMuX2xpbWl0ID4gMCkgewogICAgICBjb25zdCBtYXhQb3MgPSB0aGlzLl9za2lwICsgdGhpcy5fbGltaXQ7CiAgICAgIHJldHVybiBNYXRoLm1pbihtYXhQb3MgLSB0aGlzLnBvcywgcmVtYWluaW5nKTsKICAgIH0KICAgIHJldHVybiByZW1haW5pbmc7CiAgfQogIHNraXAobnVtKSB7CiAgICB0aGlzLl9za2lwID0gbnVtOwogICAgaWYgKHRoaXMucG9zID09PSAwKSB7CiAgICAgIGlmICh0aGlzLmRvY3VtZW50cykgewogICAgICAgIHRoaXMucG9zID0gTWF0aC5taW4obnVtLCB0aGlzLmRvY3VtZW50cy5sZW5ndGgpOwogICAgICB9CiAgICB9CiAgICByZXR1cm4gdGhpczsKICB9CiAgaXNDbG9zZWQoKSB7CiAgICByZXR1cm4gdGhpcy5fY2xvc2VkID09PSB0cnVlOwogIH0KICBzbmFwc2hvdCgpIHsKICAgIHRocm93IG5ldyBOb3RJbXBsZW1lbnRlZEVycm9yKCJzbmFwc2hvdCIpOwogIH0KICBzb3J0KHMpIHsKICAgIHJldHVybiBuZXcgdGhpcy5Tb3J0ZWRDdXJzb3IodGhpcy5jb2xsZWN0aW9uLCB0aGlzLnF1ZXJ5LCB0aGlzLCBzKTsKICB9CiAgYWxsb3dEaXNrVXNlKGVuYWJsZWQgPSB0cnVlKSB7CiAgICB0aGlzLl9hbGxvd0Rpc2tVc2UgPSBlbmFibGVkOwogICAgcmV0dXJuIHRoaXM7CiAgfQogIGNvbGxhdGlvbihjb2xsYXRpb25Eb2N1bWVudCkgewogICAgdGhpcy5fY29sbGF0aW9uID0gY29sbGF0aW9uRG9jdW1lbnQ7CiAgICByZXR1cm4gdGhpczsKICB9CiAgdGFpbGFibGUoKSB7CiAgICB0aHJvdyBuZXcgTm90SW1wbGVtZW50ZWRFcnJvcigidGFpbGFibGUiKTsKICB9CiAgYXN5bmMgdG9BcnJheSgpIHsKICAgIGF3YWl0IHRoaXMuX2Vuc3VyZUluaXRpYWxpemVkKCk7CiAgICBjb25zdCByZXN1bHRzID0gW107CiAgICB3aGlsZSAoYXdhaXQgdGhpcy5oYXNOZXh0KCkpIHsKICAgICAgcmVzdWx0cy5wdXNoKGF3YWl0IHRoaXMubmV4dCgpKTsKICAgIH0KICAgIHJldHVybiByZXN1bHRzOwogIH0KICAvLyBTdXBwb3J0IGZvciBhc3luYyBpdGVyYXRpb24gKGZvciBhd2FpdC4uLm9mKQogIGFzeW5jICpbU3ltYm9sLmFzeW5jSXRlcmF0b3JdKCkgewogICAgYXdhaXQgdGhpcy5fZW5zdXJlSW5pdGlhbGl6ZWQoKTsKICAgIHdoaWxlIChhd2FpdCB0aGlzLmhhc05leHQoKSkgewogICAgICB5aWVsZCBhd2FpdCB0aGlzLm5leHQoKTsKICAgIH0KICB9Cn0KY2xhc3MgU29ydGVkQ3Vyc29yIHsKICBjb25zdHJ1Y3Rvcihjb2xsZWN0aW9uLCBxdWVyeSwgY3Vyc29yLCBzb3J0KSB7CiAgICB0aGlzLmNvbGxlY3Rpb24gPSBjb2xsZWN0aW9uOwogICAgdGhpcy5xdWVyeSA9IHF1ZXJ5OwogICAgdGhpcy5zb3J0U3BlYyA9IHNvcnQ7CiAgICB0aGlzLnBvcyA9IDA7CiAgICB0aGlzLl9jdXJzb3IgPSBjdXJzb3I7CiAgICB0aGlzLl9zb3J0ID0gc29ydDsKICAgIHRoaXMuX2luaXRpYWxpemVkID0gZmFsc2U7CiAgICB0aGlzLml0ZW1zID0gbnVsbDsKICB9CiAgYXN5bmMgX2Vuc3VyZUluaXRpYWxpemVkKCkgewogICAgaWYgKHRoaXMuX2luaXRpYWxpemVkKSByZXR1cm47CiAgICBhd2FpdCB0aGlzLl9jdXJzb3IuX2Vuc3VyZUluaXRpYWxpemVkKCk7CiAgICB0aGlzLml0ZW1zID0gW107CiAgICB3aGlsZSAoYXdhaXQgdGhpcy5fY3Vyc29yLmhhc05leHQoKSkgewogICAgICB0aGlzLml0ZW1zLnB1c2goYXdhaXQgdGhpcy5fY3Vyc29yLm5leHQoKSk7CiAgICB9CiAgICBjb25zdCBzb3J0S2V5cyA9IE9iamVjdC5rZXlzKHRoaXMuX3NvcnQpOwogICAgdGhpcy5pdGVtcy5zb3J0KChmdW5jdGlvbihhLCBiKSB7CiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc29ydEtleXMubGVuZ3RoOyBpKyspIHsKICAgICAgICBpZiAoYVtzb3J0S2V5c1tpXV0gPT0gdm9pZCAwICYmIGJbc29ydEtleXNbaV1dICE9IHZvaWQgMCkgcmV0dXJuIC0xICogdGhpcy5fc29ydFtzb3J0S2V5c1tpXV07CiAgICAgICAgaWYgKGFbc29ydEtleXNbaV1dICE9IHZvaWQgMCAmJiBiW3NvcnRLZXlzW2ldXSA9PSB2b2lkIDApIHJldHVybiAxICogdGhpcy5fc29ydFtzb3J0S2V5c1tpXV07CiAgICAgICAgaWYgKGFbc29ydEtleXNbaV1dIDwgYltzb3J0S2V5c1tpXV0pIHJldHVybiAtMSAqIHRoaXMuX3NvcnRbc29ydEtleXNbaV1dOwogICAgICAgIGlmIChhW3NvcnRLZXlzW2ldXSA+IGJbc29ydEtleXNbaV1dKSByZXR1cm4gMSAqIHRoaXMuX3NvcnRbc29ydEtleXNbaV1dOwogICAgICB9CiAgICAgIHJldHVybiAwOwogICAgfSkuYmluZCh0aGlzKSk7CiAgICB0aGlzLl9pbml0aWFsaXplZCA9IHRydWU7CiAgfQogIGJhdGNoU2l6ZSgpIHsKICAgIHRocm93ICJOb3QgSW1wbGVtZW50ZWQiOwogIH0KICBjbG9zZSgpIHsKICAgIHRocm93ICJOb3QgSW1wbGVtZW50ZWQiOwogIH0KICBjb21tZW50KCkgewogICAgdGhyb3cgIk5vdCBJbXBsZW1lbnRlZCI7CiAgfQogIGFzeW5jIGNvdW50KCkgewogICAgYXdhaXQgdGhpcy5fZW5zdXJlSW5pdGlhbGl6ZWQoKTsKICAgIHJldHVybiB0aGlzLml0ZW1zLmxlbmd0aDsKICB9CiAgZXhwbGFpbigpIHsKICAgIHRocm93ICJOb3QgSW1wbGVtZW50ZWQiOwogIH0KICBhc3luYyBmb3JFYWNoKGZuKSB7CiAgICBhd2FpdCB0aGlzLl9lbnN1cmVJbml0aWFsaXplZCgpOwogICAgd2hpbGUgKGF3YWl0IHRoaXMuaGFzTmV4dCgpKSB7CiAgICAgIGF3YWl0IGZuKGF3YWl0IHRoaXMubmV4dCgpKTsKICAgIH0KICB9CiAgYXN5bmMgaGFzTmV4dCgpIHsKICAgIGF3YWl0IHRoaXMuX2Vuc3VyZUluaXRpYWxpemVkKCk7CiAgICByZXR1cm4gdGhpcy5wb3MgPCB0aGlzLml0ZW1zLmxlbmd0aDsKICB9CiAgaGludCgpIHsKICAgIHRocm93ICJOb3QgSW1wbGVtZW50ZWQiOwogIH0KICBpdGNvdW50KCkgewogICAgdGhyb3cgIk5vdCBJbXBsZW1lbnRlZCI7CiAgfQogIGFzeW5jIGxpbWl0KG1heCkgewogICAgYXdhaXQgdGhpcy5fZW5zdXJlSW5pdGlhbGl6ZWQoKTsKICAgIHRoaXMuaXRlbXMgPSB0aGlzLml0ZW1zLnNsaWNlKDAsIG1heCk7CiAgICByZXR1cm4gdGhpczsKICB9CiAgYXN5bmMgbWFwKGZuKSB7CiAgICBhd2FpdCB0aGlzLl9lbnN1cmVJbml0aWFsaXplZCgpOwogICAgY29uc3QgcmVzdWx0cyA9IFtdOwogICAgd2hpbGUgKGF3YWl0IHRoaXMuaGFzTmV4dCgpKSB7CiAgICAgIHJlc3VsdHMucHVzaChhd2FpdCBmbihhd2FpdCB0aGlzLm5leHQoKSkpOwogICAgfQogICAgcmV0dXJuIHJlc3VsdHM7CiAgfQogIG1heFNjYW4oKSB7CiAgICB0aHJvdyAiTm90IEltcGxlbWVudGVkIjsKICB9CiAgbWF4VGltZU1TKCkgewogICAgdGhyb3cgIk5vdCBJbXBsZW1lbnRlZCI7CiAgfQogIG1heCgpIHsKICAgIHRocm93ICJOb3QgSW1wbGVtZW50ZWQiOwogIH0KICBtaW4oKSB7CiAgICB0aHJvdyAiTm90IEltcGxlbWVudGVkIjsKICB9CiAgYXN5bmMgbmV4dCgpIHsKICAgIGF3YWl0IHRoaXMuX2Vuc3VyZUluaXRpYWxpemVkKCk7CiAgICByZXR1cm4gdGhpcy5pdGVtc1t0aGlzLnBvcysrXTsKICB9CiAgbm9DdXJzb3JUaW1lb3V0KCkgewogICAgdGhyb3cgIk5vdCBJbXBsZW1lbnRlZCI7CiAgfQogIG9ianNMZWZ0SW5CYXRjaCgpIHsKICAgIHRocm93ICJOb3QgSW1wbGVtZW50ZWQiOwogIH0KICBwcmV0dHkoKSB7CiAgICB0aHJvdyAiTm90IEltcGxlbWVudGVkIjsKICB9CiAgcmVhZENvbmNlcm4oKSB7CiAgICB0aHJvdyAiTm90IEltcGxlbWVudGVkIjsKICB9CiAgcmVhZFByZWYoKSB7CiAgICB0aHJvdyAiTm90IEltcGxlbWVudGVkIjsKICB9CiAgcmV0dXJuS2V5KCkgewogICAgdGhyb3cgIk5vdCBJbXBsZW1lbnRlZCI7CiAgfQogIHNob3dSZWNvcmRJZCgpIHsKICAgIHRocm93ICJOb3QgSW1wbGVtZW50ZWQiOwogIH0KICBzaXplKCkgewogICAgdGhyb3cgIk5vdCBJbXBsZW1lbnRlZCI7CiAgfQogIGFzeW5jIHNraXAobnVtKSB7CiAgICBhd2FpdCB0aGlzLl9lbnN1cmVJbml0aWFsaXplZCgpOwogICAgd2hpbGUgKG51bSA+IDApIHsKICAgICAgYXdhaXQgdGhpcy5uZXh0KCk7CiAgICAgIG51bS0tOwogICAgfQogICAgcmV0dXJuIHRoaXM7CiAgfQogIHNuYXBzaG90KCkgewogICAgdGhyb3cgIk5vdCBJbXBsZW1lbnRlZCI7CiAgfQogIHNvcnQocykgewogICAgcmV0dXJuIG5ldyBTb3J0ZWRDdXJzb3IodGhpcy5jb2xsZWN0aW9uLCB0aGlzLnF1ZXJ5LCB0aGlzLCBzKTsKICB9CiAgdGFpbGFibGUoKSB7CiAgICB0aHJvdyAiTm90IEltcGxlbWVudGVkIjsKICB9CiAgYXN5bmMgdG9BcnJheSgpIHsKICAgIGF3YWl0IHRoaXMuX2Vuc3VyZUluaXRpYWxpemVkKCk7CiAgICBjb25zdCByZXN1bHRzID0gW107CiAgICB3aGlsZSAoYXdhaXQgdGhpcy5oYXNOZXh0KCkpIHsKICAgICAgcmVzdWx0cy5wdXNoKHRoaXMubmV4dCgpKTsKICAgIH0KICAgIHJldHVybiByZXN1bHRzOwogIH0KICAvLyBTdXBwb3J0IGZvciBhc3luYyBpdGVyYXRpb24gKGZvciBhd2FpdC4uLm9mKQogIGFzeW5jICpbU3ltYm9sLmFzeW5jSXRlcmF0b3JdKCkgewogICAgYXdhaXQgdGhpcy5fZW5zdXJlSW5pdGlhbGl6ZWQoKTsKICAgIHdoaWxlIChhd2FpdCB0aGlzLmhhc05leHQoKSkgewogICAgICB5aWVsZCBhd2FpdCB0aGlzLm5leHQoKTsKICAgIH0KICB9Cn0KY29uc3Qgc3RlcDJsaXN0ID0gewogIGF0aW9uYWw6ICJhdGUiLAogIHRpb25hbDogInRpb24iLAogIGVuY2k6ICJlbmNlIiwKICBhbmNpOiAiYW5jZSIsCiAgaXplcjogIml6ZSIsCiAgYmxpOiAiYmxlIiwKICBhbGxpOiAiYWwiLAogIGVudGxpOiAiZW50IiwKICBlbGk6ICJlIiwKICBvdXNsaTogIm91cyIsCiAgaXphdGlvbjogIml6ZSIsCiAgYXRpb246ICJhdGUiLAogIGF0b3I6ICJhdGUiLAogIGFsaXNtOiAiYWwiLAogIGl2ZW5lc3M6ICJpdmUiLAogIGZ1bG5lc3M6ICJmdWwiLAogIG91c25lc3M6ICJvdXMiLAogIGFsaXRpOiAiYWwiLAogIGl2aXRpOiAiaXZlIiwKICBiaWxpdGk6ICJibGUiLAogIGxvZ2k6ICJsb2ciCn07CmNvbnN0IHN0ZXAzbGlzdCA9IHsKICBpY2F0ZTogImljIiwKICBhdGl2ZTogIiIsCiAgYWxpemU6ICJhbCIsCiAgaWNpdGk6ICJpYyIsCiAgaWNhbDogImljIiwKICBmdWw6ICIiLAogIG5lc3M6ICIiCn07CmNvbnN0IGNvbnNvbmFudCA9ICJbXmFlaW91XSI7CmNvbnN0IHZvd2VsID0gIlthZWlvdXldIjsKY29uc3QgY29uc29uYW50cyA9ICIoIiArIGNvbnNvbmFudCArICJbXmFlaW91eV0qKSI7CmNvbnN0IHZvd2VscyA9ICIoIiArIHZvd2VsICsgIlthZWlvdV0qKSI7CmNvbnN0IGd0MCA9IG5ldyBSZWdFeHAoIl4iICsgY29uc29uYW50cyArICI/IiArIHZvd2VscyArIGNvbnNvbmFudHMpOwpjb25zdCBlcTEgPSBuZXcgUmVnRXhwKAogICJeIiArIGNvbnNvbmFudHMgKyAiPyIgKyB2b3dlbHMgKyBjb25zb25hbnRzICsgdm93ZWxzICsgIj8kIgopOwpjb25zdCBndDEgPSBuZXcgUmVnRXhwKCJeIiArIGNvbnNvbmFudHMgKyAiPygiICsgdm93ZWxzICsgY29uc29uYW50cyArICIpezIsfSIpOwpjb25zdCB2b3dlbEluU3RlbSA9IG5ldyBSZWdFeHAoIl4iICsgY29uc29uYW50cyArICI/IiArIHZvd2VsKTsKY29uc3QgY29uc29uYW50TGlrZSA9IG5ldyBSZWdFeHAoIl4iICsgY29uc29uYW50cyArIHZvd2VsICsgIlteYWVpb3V3eHldJCIpOwpjb25zdCBzZnhMbCA9IC9sbCQvOwpjb25zdCBzZnhFID0gL14oLis/KWUkLzsKY29uc3Qgc2Z4WSA9IC9eKC4rPyl5JC87CmNvbnN0IHNmeElvbiA9IC9eKC4rPyhzfHQpKShpb24pJC87CmNvbnN0IHNmeEVkT3JJbmcgPSAvXiguKz8pKGVkfGluZykkLzsKY29uc3Qgc2Z4QXRPckJsT3JJeiA9IC8oYXR8Ymx8aXopJC87CmNvbnN0IHNmeEVFRCA9IC9eKC4rPyllZWQkLzsKY29uc3Qgc2Z4UyA9IC9eLis/W15zXXMkLzsKY29uc3Qgc2Z4U3Nlc09ySWVzID0gL14uKz8oc3N8aSllcyQvOwpjb25zdCBzZnhNdWx0aUNvbnNvbmFudExpa2UgPSAvKFteYWVpb3V5bHN6XSlcMSQvOwpjb25zdCBzdGVwMiA9IC9eKC4rPykoYXRpb25hbHx0aW9uYWx8ZW5jaXxhbmNpfGl6ZXJ8YmxpfGFsbGl8ZW50bGl8ZWxpfG91c2xpfGl6YXRpb258YXRpb258YXRvcnxhbGlzbXxpdmVuZXNzfGZ1bG5lc3N8b3VzbmVzc3xhbGl0aXxpdml0aXxiaWxpdGl8bG9naSkkLzsKY29uc3Qgc3RlcDMgPSAvXiguKz8pKGljYXRlfGF0aXZlfGFsaXplfGljaXRpfGljYWx8ZnVsfG5lc3MpJC87CmNvbnN0IHN0ZXA0ID0gL14oLis/KShhbHxhbmNlfGVuY2V8ZXJ8aWN8YWJsZXxpYmxlfGFudHxlbWVudHxtZW50fGVudHxvdXxpc218YXRlfGl0aXxvdXN8aXZlfGl6ZSkkLzsKZnVuY3Rpb24gc3RlbW1lcih2YWx1ZSkgewogIGxldCByZXN1bHQgPSBTdHJpbmcodmFsdWUpLnRvTG93ZXJDYXNlKCk7CiAgaWYgKHJlc3VsdC5sZW5ndGggPCAzKSB7CiAgICByZXR1cm4gcmVzdWx0OwogIH0KICBsZXQgZmlyc3RDaGFyYWN0ZXJXYXNMb3dlckNhc2VZID0gZmFsc2U7CiAgaWYgKHJlc3VsdC5jb2RlUG9pbnRBdCgwKSA9PT0gMTIxKSB7CiAgICBmaXJzdENoYXJhY3Rlcldhc0xvd2VyQ2FzZVkgPSB0cnVlOwogICAgcmVzdWx0ID0gIlkiICsgcmVzdWx0LnNsaWNlKDEpOwogIH0KICBpZiAoc2Z4U3Nlc09ySWVzLnRlc3QocmVzdWx0KSkgewogICAgcmVzdWx0ID0gcmVzdWx0LnNsaWNlKDAsIC0yKTsKICB9IGVsc2UgaWYgKHNmeFMudGVzdChyZXN1bHQpKSB7CiAgICByZXN1bHQgPSByZXN1bHQuc2xpY2UoMCwgLTEpOwogIH0KICBsZXQgbWF0Y2g7CiAgaWYgKG1hdGNoID0gc2Z4RUVELmV4ZWMocmVzdWx0KSkgewogICAgaWYgKGd0MC50ZXN0KG1hdGNoWzFdKSkgewogICAgICByZXN1bHQgPSByZXN1bHQuc2xpY2UoMCwgLTEpOwogICAgfQogIH0gZWxzZSBpZiAoKG1hdGNoID0gc2Z4RWRPckluZy5leGVjKHJlc3VsdCkpICYmIHZvd2VsSW5TdGVtLnRlc3QobWF0Y2hbMV0pKSB7CiAgICByZXN1bHQgPSBtYXRjaFsxXTsKICAgIGlmIChzZnhBdE9yQmxPckl6LnRlc3QocmVzdWx0KSkgewogICAgICByZXN1bHQgKz0gImUiOwogICAgfSBlbHNlIGlmIChzZnhNdWx0aUNvbnNvbmFudExpa2UudGVzdChyZXN1bHQpKSB7CiAgICAgIHJlc3VsdCA9IHJlc3VsdC5zbGljZSgwLCAtMSk7CiAgICB9IGVsc2UgaWYgKGNvbnNvbmFudExpa2UudGVzdChyZXN1bHQpKSB7CiAgICAgIHJlc3VsdCArPSAiZSI7CiAgICB9CiAgfQogIGlmICgobWF0Y2ggPSBzZnhZLmV4ZWMocmVzdWx0KSkgJiYgdm93ZWxJblN0ZW0udGVzdChtYXRjaFsxXSkpIHsKICAgIHJlc3VsdCA9IG1hdGNoWzFdICsgImkiOwogIH0KICBpZiAoKG1hdGNoID0gc3RlcDIuZXhlYyhyZXN1bHQpKSAmJiBndDAudGVzdChtYXRjaFsxXSkpIHsKICAgIHJlc3VsdCA9IG1hdGNoWzFdICsgc3RlcDJsaXN0W21hdGNoWzJdXTsKICB9CiAgaWYgKChtYXRjaCA9IHN0ZXAzLmV4ZWMocmVzdWx0KSkgJiYgZ3QwLnRlc3QobWF0Y2hbMV0pKSB7CiAgICByZXN1bHQgPSBtYXRjaFsxXSArIHN0ZXAzbGlzdFttYXRjaFsyXV07CiAgfQogIGlmIChtYXRjaCA9IHN0ZXA0LmV4ZWMocmVzdWx0KSkgewogICAgaWYgKGd0MS50ZXN0KG1hdGNoWzFdKSkgewogICAgICByZXN1bHQgPSBtYXRjaFsxXTsKICAgIH0KICB9IGVsc2UgaWYgKChtYXRjaCA9IHNmeElvbi5leGVjKHJlc3VsdCkpICYmIGd0MS50ZXN0KG1hdGNoWzFdKSkgewogICAgcmVzdWx0ID0gbWF0Y2hbMV07CiAgfQogIGlmICgobWF0Y2ggPSBzZnhFLmV4ZWMocmVzdWx0KSkgJiYgKGd0MS50ZXN0KG1hdGNoWzFdKSB8fCBlcTEudGVzdChtYXRjaFsxXSkgJiYgIWNvbnNvbmFudExpa2UudGVzdChtYXRjaFsxXSkpKSB7CiAgICByZXN1bHQgPSBtYXRjaFsxXTsKICB9CiAgaWYgKHNmeExsLnRlc3QocmVzdWx0KSAmJiBndDEudGVzdChyZXN1bHQpKSB7CiAgICByZXN1bHQgPSByZXN1bHQuc2xpY2UoMCwgLTEpOwogIH0KICBpZiAoZmlyc3RDaGFyYWN0ZXJXYXNMb3dlckNhc2VZKSB7CiAgICByZXN1bHQgPSAieSIgKyByZXN1bHQuc2xpY2UoMSk7CiAgfQogIHJldHVybiByZXN1bHQ7Cn0KY2xhc3MgTm9kZURhdGEgewogIC8qKgogICAqIENyZWF0ZXMgYSBub2RlIGRhdGEgb2JqZWN0IGZvciBzZXJpYWxpemF0aW9uCiAgICogQHBhcmFtIHtudW1iZXJ9IGlkIC0gVW5pcXVlIG5vZGUgSUQKICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzTGVhZiAtIExlYWYgZmxhZwogICAqIEBwYXJhbSB7QXJyYXl9IGtleXMgLSBLZXkgYXJyYXkKICAgKiBAcGFyYW0ge0FycmF5fSB2YWx1ZXMgLSBWYWx1ZSBhcnJheSAobGVhZiBub2RlcykKICAgKiBAcGFyYW0ge0FycmF5fSBjaGlsZHJlbiAtIENoaWxkIHBvaW50ZXJzIChpbnRlcm5hbCBub2RlcykKICAgKiBAcGFyYW0ge1BvaW50ZXJ9IG5leHQgLSBQb2ludGVyIHRvIG5leHQgbGVhZgogICAqLwogIGNvbnN0cnVjdG9yKGlkLCBpc0xlYWYsIGtleXMsIHZhbHVlcywgY2hpbGRyZW4sIG5leHQpIHsKICAgIHRoaXMuaWQgPSBpZDsKICAgIHRoaXMuaXNMZWFmID0gaXNMZWFmOwogICAgdGhpcy5rZXlzID0ga2V5czsKICAgIHRoaXMudmFsdWVzID0gdmFsdWVzOwogICAgdGhpcy5jaGlsZHJlbiA9IGNoaWxkcmVuOwogICAgZm9yIChsZXQgdiBvZiBjaGlsZHJlbikgewogICAgICBpZiAoISh2IGluc3RhbmNlb2YgUG9pbnRlcikpIHsKICAgICAgICB0aHJvdyBuZXcgRXJyb3IoIkNoaWxkcmVuIG11c3QgYmUgUG9pbnRlciBvYmplY3RzIik7CiAgICAgIH0KICAgIH0KICAgIHRoaXMubmV4dCA9IG5leHQ7CiAgfQp9CmNsYXNzIEJQbHVzVHJlZSB7CiAgLyoqCiAgICogQ3JlYXRlcyBhIG5ldyBwZXJzaXN0ZW50IEIrIHRyZWUKICAgKiBAcGFyYW0ge0ZpbGVTeXN0ZW1TeW5jQWNjZXNzSGFuZGxlfSBzeW5jSGFuZGxlIC0gU3luYyBhY2Nlc3MgaGFuZGxlIHRvIHN0b3JhZ2UgZmlsZQogICAqIEBwYXJhbSB7bnVtYmVyfSBvcmRlciAtIFRyZWUgb3JkZXIgKGRlZmF1bHQ6IDMpCiAgICovCiAgY29uc3RydWN0b3Ioc3luY0hhbmRsZSwgb3JkZXIgPSAzKSB7CiAgICBpZiAob3JkZXIgPCAzKSB7CiAgICAgIHRocm93IG5ldyBFcnJvcigiQisgdHJlZSBvcmRlciBtdXN0IGJlIGF0IGxlYXN0IDMiKTsKICAgIH0KICAgIHRoaXMuZmlsZSA9IG5ldyBCSnNvbkZpbGUoc3luY0hhbmRsZSk7CiAgICB0aGlzLm9yZGVyID0gb3JkZXI7CiAgICB0aGlzLm1pbktleXMgPSBNYXRoLmNlaWwob3JkZXIgLyAyKSAtIDE7CiAgICB0aGlzLmlzT3BlbiA9IGZhbHNlOwogICAgdGhpcy5yb290UG9pbnRlciA9IG51bGw7CiAgICB0aGlzLm5leHROb2RlSWQgPSAwOwogICAgdGhpcy5fc2l6ZSA9IDA7CiAgfQogIC8qKgogICAqIE9wZW4gdGhlIHRyZWUgKGxvYWQgb3IgaW5pdGlhbGl6ZSBtZXRhZGF0YSkKICAgKi8KICBhc3luYyBvcGVuKCkgewogICAgaWYgKHRoaXMuaXNPcGVuKSB7CiAgICAgIHRocm93IG5ldyBFcnJvcigiVHJlZSBpcyBhbHJlYWR5IG9wZW4iKTsKICAgIH0KICAgIGNvbnN0IGZpbGVTaXplID0gdGhpcy5maWxlLmdldEZpbGVTaXplKCk7CiAgICBjb25zdCBleGlzdHMgPSBmaWxlU2l6ZSA+IDA7CiAgICBpZiAoZXhpc3RzKSB7CiAgICAgIHRoaXMuX2xvYWRNZXRhZGF0YSgpOwogICAgfSBlbHNlIHsKICAgICAgdGhpcy5faW5pdGlhbGl6ZU5ld1RyZWUoKTsKICAgIH0KICAgIHRoaXMuaXNPcGVuID0gdHJ1ZTsKICB9CiAgLyoqCiAgICogQ2xvc2UgdGhlIHRyZWUgYW5kIHNhdmUgbWV0YWRhdGEKICAgKi8KICBhc3luYyBjbG9zZSgpIHsKICAgIGlmICh0aGlzLmlzT3BlbikgewogICAgICBpZiAodGhpcy5maWxlICYmIHRoaXMuZmlsZS5zeW5jQWNjZXNzSGFuZGxlKSB7CiAgICAgICAgdGhpcy5maWxlLmZsdXNoKCk7CiAgICAgICAgYXdhaXQgdGhpcy5maWxlLnN5bmNBY2Nlc3NIYW5kbGUuY2xvc2UoKTsKICAgICAgfQogICAgICB0aGlzLmlzT3BlbiA9IGZhbHNlOwogICAgfQogIH0KICAvKioKICAgKiBJbml0aWFsaXplIGEgbmV3IGVtcHR5IHRyZWUKICAgKi8KICBfaW5pdGlhbGl6ZU5ld1RyZWUoKSB7CiAgICBjb25zdCByb290Tm9kZSA9IG5ldyBOb2RlRGF0YSgwLCB0cnVlLCBbXSwgW10sIFtdLCBudWxsKTsKICAgIHRoaXMubmV4dE5vZGVJZCA9IDE7CiAgICB0aGlzLl9zaXplID0gMDsKICAgIGNvbnN0IHJvb3RQb2ludGVyID0gdGhpcy5fc2F2ZU5vZGUocm9vdE5vZGUpOwogICAgdGhpcy5yb290UG9pbnRlciA9IHJvb3RQb2ludGVyOwogICAgdGhpcy5fc2F2ZU1ldGFkYXRhKCk7CiAgfQogIC8qKgogICAqIFNhdmUgbWV0YWRhdGEgdG8gZmlsZQogICAqLwogIF9zYXZlTWV0YWRhdGEoKSB7CiAgICBjb25zdCBtZXRhZGF0YSA9IHsKICAgICAgdmVyc2lvbjogMSwKICAgICAgbWF4RW50cmllczogdGhpcy5vcmRlciwKICAgICAgLy8gUmVuYW1lZCB0byBtYXRjaCBSVHJlZSBzaXplCiAgICAgIG1pbkVudHJpZXM6IHRoaXMubWluS2V5cywKICAgICAgLy8gUmVuYW1lZCB0byBtYXRjaCBSVHJlZSBzaXplCiAgICAgIHNpemU6IHRoaXMuX3NpemUsCiAgICAgIHJvb3RQb2ludGVyOiB0aGlzLnJvb3RQb2ludGVyLAogICAgICBuZXh0SWQ6IHRoaXMubmV4dE5vZGVJZAogICAgICAvLyBSZW5hbWVkIHRvIG1hdGNoIFJUcmVlIHNpemUKICAgIH07CiAgICB0aGlzLmZpbGUuYXBwZW5kKG1ldGFkYXRhKTsKICB9CiAgLyoqCiAgICogTG9hZCBtZXRhZGF0YSBmcm9tIGZpbGUKICAgKi8KICBfbG9hZE1ldGFkYXRhKCkgewogICAgY29uc3QgZmlsZVNpemUgPSB0aGlzLmZpbGUuZ2V0RmlsZVNpemUoKTsKICAgIGNvbnN0IE1FVEFEQVRBX1NJWkUgPSAxMzU7CiAgICBpZiAoZmlsZVNpemUgPCBNRVRBREFUQV9TSVpFKSB7CiAgICAgIHRocm93IG5ldyBFcnJvcigiSW52YWxpZCB0cmVlIGZpbGUiKTsKICAgIH0KICAgIGNvbnN0IG1ldGFkYXRhT2Zmc2V0ID0gZmlsZVNpemUgLSBNRVRBREFUQV9TSVpFOwogICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLmZpbGUucmVhZChtZXRhZGF0YU9mZnNldCk7CiAgICBpZiAoIW1ldGFkYXRhIHx8IHR5cGVvZiBtZXRhZGF0YS5tYXhFbnRyaWVzID09PSAidW5kZWZpbmVkIikgewogICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byByZWFkIG1ldGFkYXRhOiBtaXNzaW5nIHJlcXVpcmVkIGZpZWxkc2ApOwogICAgfQogICAgdGhpcy5vcmRlciA9IG1ldGFkYXRhLm1heEVudHJpZXM7CiAgICB0aGlzLm1pbktleXMgPSBtZXRhZGF0YS5taW5FbnRyaWVzOwogICAgdGhpcy5fc2l6ZSA9IG1ldGFkYXRhLnNpemU7CiAgICB0aGlzLm5leHROb2RlSWQgPSBtZXRhZGF0YS5uZXh0SWQ7CiAgICB0aGlzLnJvb3RQb2ludGVyID0gbWV0YWRhdGEucm9vdFBvaW50ZXI7CiAgfQogIC8qKgogICAqIFNhdmUgYSBub2RlIHRvIGRpc2sKICAgKi8KICBfc2F2ZU5vZGUobm9kZSkgewogICAgY29uc3Qgb2Zmc2V0ID0gdGhpcy5maWxlLmdldEZpbGVTaXplKCk7CiAgICB0aGlzLmZpbGUuYXBwZW5kKG5vZGUpOwogICAgcmV0dXJuIG5ldyBQb2ludGVyKG9mZnNldCk7CiAgfQogIC8qKgogICAqIExvYWQgYSBub2RlIGZyb20gZGlzawogICAqLwogIF9sb2FkTm9kZShwb2ludGVyKSB7CiAgICBpZiAoIShwb2ludGVyIGluc3RhbmNlb2YgUG9pbnRlcikpIHsKICAgICAgdGhyb3cgbmV3IEVycm9yKCJFeHBlY3RlZCBQb2ludGVyIG9iamVjdCIpOwogICAgfQogICAgY29uc3QgZGF0YSA9IHRoaXMuZmlsZS5yZWFkKHBvaW50ZXIpOwogICAgcmV0dXJuIG5ldyBOb2RlRGF0YSgKICAgICAgZGF0YS5pZCwKICAgICAgZGF0YS5pc0xlYWYsCiAgICAgIGRhdGEua2V5cywKICAgICAgZGF0YS52YWx1ZXMsCiAgICAgIGRhdGEuY2hpbGRyZW4sCiAgICAgIGRhdGEubmV4dAogICAgKTsKICB9CiAgLyoqCiAgICogTG9hZCByb290IG5vZGUKICAgKi8KICBfbG9hZFJvb3QoKSB7CiAgICByZXR1cm4gdGhpcy5fbG9hZE5vZGUodGhpcy5yb290UG9pbnRlcik7CiAgfQogIC8qKgogICAqIFNlYXJjaCBmb3IgYSBrZXkKICAgKi8KICBzZWFyY2goa2V5KSB7CiAgICBjb25zdCByb290ID0gdGhpcy5fbG9hZFJvb3QoKTsKICAgIHJldHVybiB0aGlzLl9zZWFyY2hOb2RlKHJvb3QsIGtleSk7CiAgfQogIC8qKgogICAqIEludGVybmFsIHNlYXJjaAogICAqLwogIF9zZWFyY2hOb2RlKG5vZGUsIGtleSkgewogICAgaWYgKG5vZGUuaXNMZWFmKSB7CiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZS5rZXlzLmxlbmd0aDsgaSsrKSB7CiAgICAgICAgaWYgKGtleSA9PT0gbm9kZS5rZXlzW2ldKSB7CiAgICAgICAgICByZXR1cm4gbm9kZS52YWx1ZXNbaV07CiAgICAgICAgfQogICAgICB9CiAgICAgIHJldHVybiB2b2lkIDA7CiAgICB9IGVsc2UgewogICAgICBsZXQgaSA9IDA7CiAgICAgIHdoaWxlIChpIDwgbm9kZS5rZXlzLmxlbmd0aCAmJiBrZXkgPj0gbm9kZS5rZXlzW2ldKSB7CiAgICAgICAgaSsrOwogICAgICB9CiAgICAgIGNvbnN0IGNoaWxkID0gdGhpcy5fbG9hZE5vZGUobm9kZS5jaGlsZHJlbltpXSk7CiAgICAgIHJldHVybiB0aGlzLl9zZWFyY2hOb2RlKGNoaWxkLCBrZXkpOwogICAgfQogIH0KICAvKioKICAgKiBJbnNlcnQgYSBrZXktdmFsdWUgcGFpcgogICAqLwogIGFkZChrZXksIHZhbHVlKSB7CiAgICBjb25zdCByb290ID0gdGhpcy5fbG9hZFJvb3QoKTsKICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX2FkZFRvTm9kZShyb290LCBrZXksIHZhbHVlKTsKICAgIGxldCBuZXdSb290OwogICAgaWYgKHJlc3VsdC5uZXdOb2RlKSB7CiAgICAgIG5ld1Jvb3QgPSByZXN1bHQubmV3Tm9kZTsKICAgIH0gZWxzZSB7CiAgICAgIGNvbnN0IGxlZnRQb2ludGVyID0gdGhpcy5fc2F2ZU5vZGUocmVzdWx0LmxlZnQpOwogICAgICBjb25zdCByaWdodFBvaW50ZXIgPSB0aGlzLl9zYXZlTm9kZShyZXN1bHQucmlnaHQpOwogICAgICBuZXdSb290ID0gbmV3IE5vZGVEYXRhKAogICAgICAgIHRoaXMubmV4dE5vZGVJZCsrLAogICAgICAgIGZhbHNlLAogICAgICAgIFtyZXN1bHQuc3BsaXRLZXldLAogICAgICAgIFtdLAogICAgICAgIFtsZWZ0UG9pbnRlciwgcmlnaHRQb2ludGVyXSwKICAgICAgICBudWxsCiAgICAgICk7CiAgICB9CiAgICBjb25zdCByb290UG9pbnRlciA9IHRoaXMuX3NhdmVOb2RlKG5ld1Jvb3QpOwogICAgdGhpcy5yb290UG9pbnRlciA9IHJvb3RQb2ludGVyOwogICAgdGhpcy5fc2l6ZSsrOwogICAgdGhpcy5fc2F2ZU1ldGFkYXRhKCk7CiAgfQogIC8qKgogICAqIEludGVybmFsIGFkZAogICAqLwogIF9hZGRUb05vZGUobm9kZSwga2V5LCB2YWx1ZSkgewogICAgaWYgKG5vZGUuaXNMZWFmKSB7CiAgICAgIGNvbnN0IGtleXMgPSBbLi4ubm9kZS5rZXlzXTsKICAgICAgY29uc3QgdmFsdWVzID0gWy4uLm5vZGUudmFsdWVzXTsKICAgICAgY29uc3QgZXhpc3RpbmdJZHggPSBrZXlzLmluZGV4T2Yoa2V5KTsKICAgICAgaWYgKGV4aXN0aW5nSWR4ICE9PSAtMSkgewogICAgICAgIHZhbHVlc1tleGlzdGluZ0lkeF0gPSB2YWx1ZTsKICAgICAgICByZXR1cm4gewogICAgICAgICAgbmV3Tm9kZTogbmV3IE5vZGVEYXRhKG5vZGUuaWQsIHRydWUsIGtleXMsIHZhbHVlcywgW10sIG51bGwpCiAgICAgICAgfTsKICAgICAgfQogICAgICBsZXQgaW5zZXJ0SWR4ID0gMDsKICAgICAgd2hpbGUgKGluc2VydElkeCA8IGtleXMubGVuZ3RoICYmIGtleSA+IGtleXNbaW5zZXJ0SWR4XSkgewogICAgICAgIGluc2VydElkeCsrOwogICAgICB9CiAgICAgIGtleXMuc3BsaWNlKGluc2VydElkeCwgMCwga2V5KTsKICAgICAgdmFsdWVzLnNwbGljZShpbnNlcnRJZHgsIDAsIHZhbHVlKTsKICAgICAgaWYgKGtleXMubGVuZ3RoIDwgdGhpcy5vcmRlcikgewogICAgICAgIHJldHVybiB7CiAgICAgICAgICBuZXdOb2RlOiBuZXcgTm9kZURhdGEobm9kZS5pZCwgdHJ1ZSwga2V5cywgdmFsdWVzLCBbXSwgbnVsbCkKICAgICAgICB9OwogICAgICB9IGVsc2UgewogICAgICAgIGNvbnN0IG1pZCA9IE1hdGguY2VpbChrZXlzLmxlbmd0aCAvIDIpOwogICAgICAgIGNvbnN0IGxlZnRLZXlzID0ga2V5cy5zbGljZSgwLCBtaWQpOwogICAgICAgIGNvbnN0IGxlZnRWYWx1ZXMgPSB2YWx1ZXMuc2xpY2UoMCwgbWlkKTsKICAgICAgICBjb25zdCByaWdodEtleXMgPSBrZXlzLnNsaWNlKG1pZCk7CiAgICAgICAgY29uc3QgcmlnaHRWYWx1ZXMgPSB2YWx1ZXMuc2xpY2UobWlkKTsKICAgICAgICBjb25zdCByaWdodE5vZGUgPSBuZXcgTm9kZURhdGEodGhpcy5uZXh0Tm9kZUlkKyssIHRydWUsIHJpZ2h0S2V5cywgcmlnaHRWYWx1ZXMsIFtdLCBudWxsKTsKICAgICAgICBjb25zdCBsZWZ0Tm9kZSA9IG5ldyBOb2RlRGF0YShub2RlLmlkLCB0cnVlLCBsZWZ0S2V5cywgbGVmdFZhbHVlcywgW10sIG51bGwpOwogICAgICAgIHJldHVybiB7CiAgICAgICAgICBsZWZ0OiBsZWZ0Tm9kZSwKICAgICAgICAgIHJpZ2h0OiByaWdodE5vZGUsCiAgICAgICAgICBzcGxpdEtleTogcmlnaHRLZXlzWzBdCiAgICAgICAgfTsKICAgICAgfQogICAgfSBlbHNlIHsKICAgICAgY29uc3Qga2V5cyA9IFsuLi5ub2RlLmtleXNdOwogICAgICBjb25zdCBjaGlsZHJlbiA9IFsuLi5ub2RlLmNoaWxkcmVuXTsKICAgICAgbGV0IGNoaWxkSWR4ID0gMDsKICAgICAgd2hpbGUgKGNoaWxkSWR4IDwga2V5cy5sZW5ndGggJiYga2V5ID49IGtleXNbY2hpbGRJZHhdKSB7CiAgICAgICAgY2hpbGRJZHgrKzsKICAgICAgfQogICAgICBjb25zdCBjaGlsZE5vZGUgPSB0aGlzLl9sb2FkTm9kZShjaGlsZHJlbltjaGlsZElkeF0pOwogICAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9hZGRUb05vZGUoY2hpbGROb2RlLCBrZXksIHZhbHVlKTsKICAgICAgaWYgKHJlc3VsdC5uZXdOb2RlKSB7CiAgICAgICAgY29uc3QgbmV3Q2hpbGRQb2ludGVyID0gdGhpcy5fc2F2ZU5vZGUocmVzdWx0Lm5ld05vZGUpOwogICAgICAgIGNoaWxkcmVuW2NoaWxkSWR4XSA9IG5ld0NoaWxkUG9pbnRlcjsKICAgICAgICByZXR1cm4gewogICAgICAgICAgbmV3Tm9kZTogbmV3IE5vZGVEYXRhKG5vZGUuaWQsIGZhbHNlLCBrZXlzLCBbXSwgY2hpbGRyZW4sIG51bGwpCiAgICAgICAgfTsKICAgICAgfSBlbHNlIHsKICAgICAgICBjb25zdCBsZWZ0UG9pbnRlciA9IHRoaXMuX3NhdmVOb2RlKHJlc3VsdC5sZWZ0KTsKICAgICAgICBjb25zdCByaWdodFBvaW50ZXIgPSB0aGlzLl9zYXZlTm9kZShyZXN1bHQucmlnaHQpOwogICAgICAgIGtleXMuc3BsaWNlKGNoaWxkSWR4LCAwLCByZXN1bHQuc3BsaXRLZXkpOwogICAgICAgIGNoaWxkcmVuLnNwbGljZShjaGlsZElkeCwgMSwgbGVmdFBvaW50ZXIsIHJpZ2h0UG9pbnRlcik7CiAgICAgICAgaWYgKGtleXMubGVuZ3RoIDwgdGhpcy5vcmRlcikgewogICAgICAgICAgcmV0dXJuIHsKICAgICAgICAgICAgbmV3Tm9kZTogbmV3IE5vZGVEYXRhKG5vZGUuaWQsIGZhbHNlLCBrZXlzLCBbXSwgY2hpbGRyZW4sIG51bGwpCiAgICAgICAgICB9OwogICAgICAgIH0gZWxzZSB7CiAgICAgICAgICBjb25zdCBtaWQgPSBNYXRoLmNlaWwoa2V5cy5sZW5ndGggLyAyKSAtIDE7CiAgICAgICAgICBjb25zdCBzcGxpdEtleSA9IGtleXNbbWlkXTsKICAgICAgICAgIGNvbnN0IGxlZnRLZXlzID0ga2V5cy5zbGljZSgwLCBtaWQpOwogICAgICAgICAgY29uc3QgcmlnaHRLZXlzID0ga2V5cy5zbGljZShtaWQgKyAxKTsKICAgICAgICAgIGNvbnN0IGxlZnRDaGlsZHJlbiA9IGNoaWxkcmVuLnNsaWNlKDAsIG1pZCArIDEpOwogICAgICAgICAgY29uc3QgcmlnaHRDaGlsZHJlbiA9IGNoaWxkcmVuLnNsaWNlKG1pZCArIDEpOwogICAgICAgICAgY29uc3QgbGVmdE5vZGUgPSBuZXcgTm9kZURhdGEobm9kZS5pZCwgZmFsc2UsIGxlZnRLZXlzLCBbXSwgbGVmdENoaWxkcmVuLCBudWxsKTsKICAgICAgICAgIGNvbnN0IHJpZ2h0Tm9kZSA9IG5ldyBOb2RlRGF0YSh0aGlzLm5leHROb2RlSWQrKywgZmFsc2UsIHJpZ2h0S2V5cywgW10sIHJpZ2h0Q2hpbGRyZW4sIG51bGwpOwogICAgICAgICAgcmV0dXJuIHsKICAgICAgICAgICAgbGVmdDogbGVmdE5vZGUsCiAgICAgICAgICAgIHJpZ2h0OiByaWdodE5vZGUsCiAgICAgICAgICAgIHNwbGl0S2V5CiAgICAgICAgICB9OwogICAgICAgIH0KICAgICAgfQogICAgfQogIH0KICAvKioKICAgKiBEZWxldGUgYSBrZXkKICAgKi8KICBkZWxldGUoa2V5KSB7CiAgICBjb25zdCByb290ID0gdGhpcy5fbG9hZFJvb3QoKTsKICAgIGNvbnN0IG5ld1Jvb3QgPSB0aGlzLl9kZWxldGVGcm9tTm9kZShyb290LCBrZXkpOwogICAgaWYgKCFuZXdSb290KSB7CiAgICAgIHJldHVybjsKICAgIH0KICAgIGxldCBmaW5hbFJvb3QgPSBuZXdSb290OwogICAgaWYgKGZpbmFsUm9vdC5rZXlzLmxlbmd0aCA9PT0gMCAmJiAhZmluYWxSb290LmlzTGVhZiAmJiBmaW5hbFJvb3QuY2hpbGRyZW4ubGVuZ3RoID4gMCkgewogICAgICBmaW5hbFJvb3QgPSB0aGlzLl9sb2FkTm9kZShmaW5hbFJvb3QuY2hpbGRyZW5bMF0pOwogICAgfQogICAgY29uc3Qgcm9vdFBvaW50ZXIgPSB0aGlzLl9zYXZlTm9kZShmaW5hbFJvb3QpOwogICAgdGhpcy5yb290UG9pbnRlciA9IHJvb3RQb2ludGVyOwogICAgdGhpcy5fc2l6ZS0tOwogICAgdGhpcy5fc2F2ZU1ldGFkYXRhKCk7CiAgfQogIC8qKgogICAqIEludGVybmFsIGRlbGV0ZQogICAqLwogIF9kZWxldGVGcm9tTm9kZShub2RlLCBrZXkpIHsKICAgIGlmIChub2RlLmlzTGVhZikgewogICAgICBjb25zdCBrZXlJbmRleCA9IG5vZGUua2V5cy5pbmRleE9mKGtleSk7CiAgICAgIGlmIChrZXlJbmRleCA9PT0gLTEpIHsKICAgICAgICByZXR1cm4gbnVsbDsKICAgICAgfQogICAgICBjb25zdCBuZXdLZXlzID0gWy4uLm5vZGUua2V5c107CiAgICAgIGNvbnN0IG5ld1ZhbHVlcyA9IFsuLi5ub2RlLnZhbHVlc107CiAgICAgIG5ld0tleXMuc3BsaWNlKGtleUluZGV4LCAxKTsKICAgICAgbmV3VmFsdWVzLnNwbGljZShrZXlJbmRleCwgMSk7CiAgICAgIHJldHVybiBuZXcgTm9kZURhdGEobm9kZS5pZCwgdHJ1ZSwgbmV3S2V5cywgbmV3VmFsdWVzLCBbXSwgbm9kZS5uZXh0KTsKICAgIH0gZWxzZSB7CiAgICAgIGxldCBpID0gMDsKICAgICAgd2hpbGUgKGkgPCBub2RlLmtleXMubGVuZ3RoICYmIGtleSA+PSBub2RlLmtleXNbaV0pIHsKICAgICAgICBpKys7CiAgICAgIH0KICAgICAgY29uc3QgY2hpbGROb2RlID0gdGhpcy5fbG9hZE5vZGUobm9kZS5jaGlsZHJlbltpXSk7CiAgICAgIGNvbnN0IG5ld0NoaWxkID0gdGhpcy5fZGVsZXRlRnJvbU5vZGUoY2hpbGROb2RlLCBrZXkpOwogICAgICBpZiAoIW5ld0NoaWxkKSB7CiAgICAgICAgcmV0dXJuIG51bGw7CiAgICAgIH0KICAgICAgY29uc3QgbmV3Q2hpbGRyZW4gPSBbLi4ubm9kZS5jaGlsZHJlbl07CiAgICAgIGNvbnN0IG5ld0NoaWxkUG9pbnRlciA9IHRoaXMuX3NhdmVOb2RlKG5ld0NoaWxkKTsKICAgICAgbmV3Q2hpbGRyZW5baV0gPSBuZXdDaGlsZFBvaW50ZXI7CiAgICAgIHJldHVybiBuZXcgTm9kZURhdGEobm9kZS5pZCwgZmFsc2UsIFsuLi5ub2RlLmtleXNdLCBbXSwgbmV3Q2hpbGRyZW4sIG51bGwpOwogICAgfQogIH0KICAvKioKICAgKiBHZXQgYWxsIGVudHJpZXMgYXMgYXJyYXkKICAgKi8KICB0b0FycmF5KCkgewogICAgY29uc3QgcmVzdWx0ID0gW107CiAgICB0aGlzLl9jb2xsZWN0QWxsRW50cmllcyh0aGlzLl9sb2FkUm9vdCgpLCByZXN1bHQpOwogICAgcmV0dXJuIHJlc3VsdDsKICB9CiAgLyoqCiAgICogQXN5bmMgaXRlcmF0b3IgZm9yIGVmZmljaWVudGx5IHRyYXZlcnNpbmcgYWxsIGVudHJpZXMgd2l0aG91dCBsb2FkaW5nIGV2ZXJ5dGhpbmcgaW50byBtZW1vcnkKICAgKiBFbmFibGVzIHVzYWdlOiBgZm9yIGF3YWl0IChjb25zdCBlbnRyeSBvZiB0cmVlKSB7IC4uLiB9YAogICAqIEVhY2ggZW50cnkgaGFzIHNoYXBlOiB7IGtleSwgdmFsdWUgfQogICAqLwogIGFzeW5jICpbU3ltYm9sLmFzeW5jSXRlcmF0b3JdKCkgewogICAgaWYgKCF0aGlzLmlzT3BlbikgewogICAgICB0aHJvdyBuZXcgRXJyb3IoIlRyZWUgbXVzdCBiZSBvcGVuIGJlZm9yZSBpdGVyYXRpb24iKTsKICAgIH0KICAgIGlmICh0aGlzLl9zaXplID09PSAwKSB7CiAgICAgIHJldHVybjsKICAgIH0KICAgIHlpZWxkKiB0aGlzLl9pdGVyYXRlTm9kZSh0aGlzLl9sb2FkUm9vdCgpKTsKICB9CiAgLyoqCiAgICogSGVscGVyIGdlbmVyYXRvciB0byByZWN1cnNpdmVseSBpdGVyYXRlIHRocm91Z2ggYSBub2RlCiAgICogQHByaXZhdGUKICAgKi8KICAqX2l0ZXJhdGVOb2RlKG5vZGUpIHsKICAgIGlmIChub2RlLmlzTGVhZikgewogICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGUua2V5cy5sZW5ndGg7IGkrKykgewogICAgICAgIHlpZWxkIHsKICAgICAgICAgIGtleTogbm9kZS5rZXlzW2ldLAogICAgICAgICAgdmFsdWU6IG5vZGUudmFsdWVzW2ldCiAgICAgICAgfTsKICAgICAgfQogICAgfSBlbHNlIHsKICAgICAgZm9yIChjb25zdCBjaGlsZFBvaW50ZXIgb2Ygbm9kZS5jaGlsZHJlbikgewogICAgICAgIGNvbnN0IGNoaWxkID0gdGhpcy5fbG9hZE5vZGUoY2hpbGRQb2ludGVyKTsKICAgICAgICB5aWVsZCogdGhpcy5faXRlcmF0ZU5vZGUoY2hpbGQpOwogICAgICB9CiAgICB9CiAgfQogIC8qKgogICAqIENvbGxlY3QgYWxsIGVudHJpZXMgaW4gc29ydGVkIG9yZGVyIGJ5IHRyYXZlcnNpbmcgdHJlZQogICAqIEBwcml2YXRlCiAgICovCiAgX2NvbGxlY3RBbGxFbnRyaWVzKG5vZGUsIHJlc3VsdCkgewogICAgaWYgKG5vZGUuaXNMZWFmKSB7CiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZS5rZXlzLmxlbmd0aDsgaSsrKSB7CiAgICAgICAgcmVzdWx0LnB1c2goewogICAgICAgICAga2V5OiBub2RlLmtleXNbaV0sCiAgICAgICAgICB2YWx1ZTogbm9kZS52YWx1ZXNbaV0KICAgICAgICB9KTsKICAgICAgfQogICAgfSBlbHNlIHsKICAgICAgZm9yIChjb25zdCBjaGlsZFBvaW50ZXIgb2Ygbm9kZS5jaGlsZHJlbikgewogICAgICAgIGNvbnN0IGNoaWxkID0gdGhpcy5fbG9hZE5vZGUoY2hpbGRQb2ludGVyKTsKICAgICAgICB0aGlzLl9jb2xsZWN0QWxsRW50cmllcyhjaGlsZCwgcmVzdWx0KTsKICAgICAgfQogICAgfQogIH0KICAvKioKICAgKiBHZXQgdHJlZSBzaXplCiAgICovCiAgc2l6ZSgpIHsKICAgIHJldHVybiB0aGlzLl9zaXplOwogIH0KICAvKioKICAgKiBDaGVjayBpZiBlbXB0eQogICAqLwogIGlzRW1wdHkoKSB7CiAgICByZXR1cm4gdGhpcy5fc2l6ZSA9PT0gMDsKICB9CiAgLyoqCiAgICogUmFuZ2Ugc2VhcmNoCiAgICovCiAgcmFuZ2VTZWFyY2gobWluS2V5LCBtYXhLZXkpIHsKICAgIGNvbnN0IHJlc3VsdCA9IFtdOwogICAgdGhpcy5fcmFuZ2VTZWFyY2hOb2RlKHRoaXMuX2xvYWRSb290KCksIG1pbktleSwgbWF4S2V5LCByZXN1bHQpOwogICAgcmV0dXJuIHJlc3VsdDsKICB9CiAgLyoqCiAgICogUmFuZ2Ugc2VhcmNoIGhlbHBlciB0aGF0IHRyYXZlcnNlcyB0cmVlCiAgICogQHByaXZhdGUKICAgKi8KICBfcmFuZ2VTZWFyY2hOb2RlKG5vZGUsIG1pbktleSwgbWF4S2V5LCByZXN1bHQpIHsKICAgIGlmIChub2RlLmlzTGVhZikgewogICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGUua2V5cy5sZW5ndGg7IGkrKykgewogICAgICAgIGlmIChub2RlLmtleXNbaV0gPj0gbWluS2V5ICYmIG5vZGUua2V5c1tpXSA8PSBtYXhLZXkpIHsKICAgICAgICAgIHJlc3VsdC5wdXNoKHsKICAgICAgICAgICAga2V5OiBub2RlLmtleXNbaV0sCiAgICAgICAgICAgIHZhbHVlOiBub2RlLnZhbHVlc1tpXQogICAgICAgICAgfSk7CiAgICAgICAgfQogICAgICB9CiAgICB9IGVsc2UgewogICAgICBmb3IgKGNvbnN0IGNoaWxkUG9pbnRlciBvZiBub2RlLmNoaWxkcmVuKSB7CiAgICAgICAgY29uc3QgY2hpbGQgPSB0aGlzLl9sb2FkTm9kZShjaGlsZFBvaW50ZXIpOwogICAgICAgIHRoaXMuX3JhbmdlU2VhcmNoTm9kZShjaGlsZCwgbWluS2V5LCBtYXhLZXksIHJlc3VsdCk7CiAgICAgIH0KICAgIH0KICB9CiAgLyoqCiAgICogR2V0IHRyZWUgaGVpZ2h0CiAgICovCiAgZ2V0SGVpZ2h0KCkgewogICAgbGV0IGhlaWdodCA9IDA7CiAgICBsZXQgY3VycmVudCA9IHRoaXMuX2xvYWRSb290KCk7CiAgICB3aGlsZSAoIWN1cnJlbnQuaXNMZWFmKSB7CiAgICAgIGhlaWdodCsrOwogICAgICBjdXJyZW50ID0gdGhpcy5fbG9hZE5vZGUoY3VycmVudC5jaGlsZHJlblswXSk7CiAgICB9CiAgICByZXR1cm4gaGVpZ2h0OwogIH0KICAvKioKICAgKiBDb21wYWN0IHRoZSB0cmVlIGJ5IGNvcHlpbmcgYWxsIGxpdmUgZW50cmllcyBpbnRvIGEgbmV3IGZpbGUuCiAgICogUmV0dXJucyBzaXplIG1ldHJpY3Mgc28gY2FsbGVycyBjYW4gc2VlIGhvdyBtdWNoIHNwYWNlIHdhcyByZWNsYWltZWQuCiAgICogQHBhcmFtIHtGaWxlU3lzdGVtU3luY0FjY2Vzc0hhbmRsZX0gZGVzdFN5bmNIYW5kbGUgLSBTeW5jIGhhbmRsZSBmb3IgZGVzdGluYXRpb24gZmlsZQogICAqIEByZXR1cm5zIHtQcm9taXNlPHtvbGRTaXplOm51bWJlcixuZXdTaXplOm51bWJlcixieXRlc1NhdmVkOm51bWJlcn0+fQogICAqLwogIGFzeW5jIGNvbXBhY3QoZGVzdFN5bmNIYW5kbGUpIHsKICAgIGlmICghdGhpcy5pc09wZW4pIHsKICAgICAgdGhyb3cgbmV3IEVycm9yKCJUcmVlIGZpbGUgaXMgbm90IG9wZW4iKTsKICAgIH0KICAgIGlmICghZGVzdFN5bmNIYW5kbGUpIHsKICAgICAgdGhyb3cgbmV3IEVycm9yKCJEZXN0aW5hdGlvbiBzeW5jIGhhbmRsZSBpcyByZXF1aXJlZCBmb3IgY29tcGFjdGlvbiIpOwogICAgfQogICAgY29uc3Qgb2xkU2l6ZSA9IHRoaXMuZmlsZS5nZXRGaWxlU2l6ZSgpOwogICAgY29uc3QgZW50cmllcyA9IHRoaXMudG9BcnJheSgpOwogICAgY29uc3QgbmV3VHJlZSA9IG5ldyBCUGx1c1RyZWUoZGVzdFN5bmNIYW5kbGUsIHRoaXMub3JkZXIpOwogICAgYXdhaXQgbmV3VHJlZS5vcGVuKCk7CiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHsKICAgICAgYXdhaXQgbmV3VHJlZS5hZGQoZW50cnkua2V5LCBlbnRyeS52YWx1ZSk7CiAgICB9CiAgICBjb25zdCBuZXdTaXplID0gbmV3VHJlZS5maWxlLmdldEZpbGVTaXplKCk7CiAgICBhd2FpdCBuZXdUcmVlLmNsb3NlKCk7CiAgICByZXR1cm4gewogICAgICBvbGRTaXplLAogICAgICBuZXdTaXplLAogICAgICBieXRlc1NhdmVkOiBNYXRoLm1heCgwLCBvbGRTaXplIC0gbmV3U2l6ZSkKICAgIH07CiAgfQp9CmNvbnN0IFNUT1BXT1JEUyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgU2V0KFsKICAiYSIsCiAgImFib3V0IiwKICAiYWZ0ZXIiLAogICJhbGwiLAogICJhbHNvIiwKICAiYW0iLAogICJhbiIsCiAgImFuZCIsCiAgImFub3RoZXIiLAogICJhbnkiLAogICJhcmUiLAogICJhcm91bmQiLAogICJhcyIsCiAgImF0IiwKICAiYmUiLAogICJiZWNhdXNlIiwKICAiYmVlbiIsCiAgImJlZm9yZSIsCiAgImJlaW5nIiwKICAiYmV0d2VlbiIsCiAgImJvdGgiLAogICJidXQiLAogICJieSIsCiAgImNhbWUiLAogICJjYW4iLAogICJjb21lIiwKICAiY291bGQiLAogICJkaWQiLAogICJkbyIsCiAgImVhY2giLAogICJmb3IiLAogICJmcm9tIiwKICAiZ2V0IiwKICAiZ290IiwKICAiaGFzIiwKICAiaGFkIiwKICAiaGUiLAogICJoYXZlIiwKICAiaGVyIiwKICAiaGVyZSIsCiAgImhpbSIsCiAgImhpbXNlbGYiLAogICJoaXMiLAogICJob3ciLAogICJpIiwKICAiaWYiLAogICJpbiIsCiAgImludG8iLAogICJpcyIsCiAgIml0IiwKICAibGlrZSIsCiAgIm1ha2UiLAogICJtYW55IiwKICAibWUiLAogICJtaWdodCIsCiAgIm1vcmUiLAogICJtb3N0IiwKICAibXVjaCIsCiAgIm11c3QiLAogICJteSIsCiAgIm5ldmVyIiwKICAibm93IiwKICAib2YiLAogICJvbiIsCiAgIm9ubHkiLAogICJvciIsCiAgIm90aGVyIiwKICAib3VyIiwKICAib3V0IiwKICAib3ZlciIsCiAgInNhaWQiLAogICJzYW1lIiwKICAic2VlIiwKICAic2hvdWxkIiwKICAic2luY2UiLAogICJzb21lIiwKICAic3RpbGwiLAogICJzdWNoIiwKICAidGFrZSIsCiAgInRoYW4iLAogICJ0aGF0IiwKICAidGhlIiwKICAidGhlaXIiLAogICJ0aGVtIiwKICAidGhlbiIsCiAgInRoZXJlIiwKICAidGhlc2UiLAogICJ0aGV5IiwKICAidGhpcyIsCiAgInRob3NlIiwKICAidGhyb3VnaCIsCiAgInRvIiwKICAidG9vIiwKICAidW5kZXIiLAogICJ1cCIsCiAgInZlcnkiLAogICJ3YXMiLAogICJ3YXkiLAogICJ3ZSIsCiAgIndlbGwiLAogICJ3ZXJlIiwKICAid2hhdCIsCiAgIndoZXJlIiwKICAid2hpY2giLAogICJ3aGlsZSIsCiAgIndobyIsCiAgIndpdGgiLAogICJ3b3VsZCIsCiAgInlvdSIsCiAgInlvdXIiCl0pOwpmdW5jdGlvbiB0b2tlbml6ZSh0ZXh0MikgewogIGlmICh0eXBlb2YgdGV4dDIgIT09ICJzdHJpbmciKSB7CiAgICByZXR1cm4gW107CiAgfQogIGNvbnN0IHdvcmRzID0gdGV4dDIudG9Mb3dlckNhc2UoKS5zcGxpdCgvXFcrLykuZmlsdGVyKCh3b3JkKSA9PiB3b3JkLmxlbmd0aCA+IDApOwogIHJldHVybiB3b3Jkcy5maWx0ZXIoKHdvcmQpID0+ICFTVE9QV09SRFMuaGFzKHdvcmQpKTsKfQpjbGFzcyBUZXh0SW5kZXggewogIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkgewogICAgY29uc3QgewogICAgICBvcmRlciA9IDE2LAogICAgICB0cmVlcwogICAgfSA9IG9wdGlvbnM7CiAgICB0aGlzLm9yZGVyID0gb3JkZXI7CiAgICB0aGlzLmluZGV4ID0gdHJlZXM/LmluZGV4IHx8IG51bGw7CiAgICB0aGlzLmRvY3VtZW50VGVybXMgPSB0cmVlcz8uZG9jdW1lbnRUZXJtcyB8fCBudWxsOwogICAgdGhpcy5kb2N1bWVudExlbmd0aHMgPSB0cmVlcz8uZG9jdW1lbnRMZW5ndGhzIHx8IG51bGw7CiAgICB0aGlzLmlzT3BlbiA9IGZhbHNlOwogIH0KICBhc3luYyBvcGVuKCkgewogICAgaWYgKHRoaXMuaXNPcGVuKSB7CiAgICAgIHRocm93IG5ldyBFcnJvcigiVGV4dEluZGV4IGlzIGFscmVhZHkgb3BlbiIpOwogICAgfQogICAgaWYgKCF0aGlzLmluZGV4IHx8ICF0aGlzLmRvY3VtZW50VGVybXMgfHwgIXRoaXMuZG9jdW1lbnRMZW5ndGhzKSB7CiAgICAgIHRocm93IG5ldyBFcnJvcigiVHJlZXMgbXVzdCBiZSBpbml0aWFsaXplZCBiZWZvcmUgb3BlbmluZyIpOwogICAgfQogICAgYXdhaXQgUHJvbWlzZS5hbGwoWwogICAgICB0aGlzLmluZGV4Lm9wZW4oKSwKICAgICAgdGhpcy5kb2N1bWVudFRlcm1zLm9wZW4oKSwKICAgICAgdGhpcy5kb2N1bWVudExlbmd0aHMub3BlbigpCiAgICBdKTsKICAgIHRoaXMuaXNPcGVuID0gdHJ1ZTsKICB9CiAgYXN5bmMgY2xvc2UoKSB7CiAgICBpZiAoIXRoaXMuaXNPcGVuKSB7CiAgICAgIHJldHVybjsKICAgIH0KICAgIGF3YWl0IFByb21pc2UuYWxsKFsKICAgICAgdGhpcy5pbmRleC5jbG9zZSgpLAogICAgICB0aGlzLmRvY3VtZW50VGVybXMuY2xvc2UoKSwKICAgICAgdGhpcy5kb2N1bWVudExlbmd0aHMuY2xvc2UoKQogICAgXSk7CiAgICB0aGlzLmlzT3BlbiA9IGZhbHNlOwogIH0KICBfZW5zdXJlT3BlbigpIHsKICAgIGlmICghdGhpcy5pc09wZW4pIHsKICAgICAgdGhyb3cgbmV3IEVycm9yKCJUZXh0SW5kZXggaXMgbm90IG9wZW4iKTsKICAgIH0KICB9CiAgLyoqCiAgICogQWRkIHRlcm1zIGZyb20gdGV4dCB0byB0aGUgaW5kZXggZm9yIGEgZ2l2ZW4gZG9jdW1lbnQgSUQKICAgKiBAcGFyYW0ge3N0cmluZ30gZG9jSWQgLSBUaGUgZG9jdW1lbnQgaWRlbnRpZmllcgogICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IC0gVGhlIHRleHQgY29udGVudCB0byBpbmRleAogICAqLwogIGFzeW5jIGFkZChkb2NJZCwgdGV4dDIpIHsKICAgIHRoaXMuX2Vuc3VyZU9wZW4oKTsKICAgIGlmICghZG9jSWQpIHsKICAgICAgdGhyb3cgbmV3IEVycm9yKCJEb2N1bWVudCBJRCBpcyByZXF1aXJlZCIpOwogICAgfQogICAgY29uc3Qgd29yZHMgPSB0b2tlbml6ZSh0ZXh0Mik7CiAgICBjb25zdCB0ZXJtRnJlcXVlbmN5ID0gLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKTsKICAgIHdvcmRzLmZvckVhY2goKHdvcmQpID0+IHsKICAgICAgY29uc3Qgc3RlbSA9IHN0ZW1tZXIod29yZCk7CiAgICAgIHRlcm1GcmVxdWVuY3kuc2V0KHN0ZW0sICh0ZXJtRnJlcXVlbmN5LmdldChzdGVtKSB8fCAwKSArIDEpOwogICAgfSk7CiAgICBmb3IgKGNvbnN0IFtzdGVtLCBmcmVxdWVuY3ldIG9mIHRlcm1GcmVxdWVuY3kuZW50cmllcygpKSB7CiAgICAgIGNvbnN0IHBvc3RpbmdzID0gYXdhaXQgdGhpcy5pbmRleC5zZWFyY2goc3RlbSkgfHwge307CiAgICAgIHBvc3RpbmdzW2RvY0lkXSA9IGZyZXF1ZW5jeTsKICAgICAgYXdhaXQgdGhpcy5pbmRleC5hZGQoc3RlbSwgcG9zdGluZ3MpOwogICAgfQogICAgY29uc3QgZXhpc3RpbmdUZXJtcyA9IGF3YWl0IHRoaXMuZG9jdW1lbnRUZXJtcy5zZWFyY2goZG9jSWQpIHx8IHt9OwogICAgY29uc3QgbWVyZ2VkVGVybXMgPSB7IC4uLmV4aXN0aW5nVGVybXMgfTsKICAgIHRlcm1GcmVxdWVuY3kuZm9yRWFjaCgoZnJlcXVlbmN5LCBzdGVtKSA9PiB7CiAgICAgIG1lcmdlZFRlcm1zW3N0ZW1dID0gZnJlcXVlbmN5OwogICAgfSk7CiAgICBjb25zdCBkb2NMZW5ndGggPSBPYmplY3QudmFsdWVzKG1lcmdlZFRlcm1zKS5yZWR1Y2UoKHN1bSwgY291bnQpID0+IHN1bSArIGNvdW50LCAwKTsKICAgIGF3YWl0IHRoaXMuZG9jdW1lbnRUZXJtcy5hZGQoZG9jSWQsIG1lcmdlZFRlcm1zKTsKICAgIGF3YWl0IHRoaXMuZG9jdW1lbnRMZW5ndGhzLmFkZChkb2NJZCwgZG9jTGVuZ3RoKTsKICB9CiAgLyoqCiAgICogUmVtb3ZlIGFsbCBpbmRleGVkIHRlcm1zIGZvciBhIGdpdmVuIGRvY3VtZW50IElECiAgICogQHBhcmFtIHtzdHJpbmd9IGRvY0lkIC0gVGhlIGRvY3VtZW50IGlkZW50aWZpZXIgdG8gcmVtb3ZlCiAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgZG9jdW1lbnQgd2FzIGZvdW5kIGFuZCByZW1vdmVkLCBmYWxzZSBvdGhlcndpc2UKICAgKi8KICBhc3luYyByZW1vdmUoZG9jSWQpIHsKICAgIHRoaXMuX2Vuc3VyZU9wZW4oKTsKICAgIGNvbnN0IHRlcm1zID0gYXdhaXQgdGhpcy5kb2N1bWVudFRlcm1zLnNlYXJjaChkb2NJZCk7CiAgICBpZiAoIXRlcm1zKSB7CiAgICAgIHJldHVybiBmYWxzZTsKICAgIH0KICAgIGZvciAoY29uc3QgW3Rlcm1dIG9mIE9iamVjdC5lbnRyaWVzKHRlcm1zKSkgewogICAgICBjb25zdCBwb3N0aW5ncyA9IGF3YWl0IHRoaXMuaW5kZXguc2VhcmNoKHRlcm0pIHx8IHt9OwogICAgICBkZWxldGUgcG9zdGluZ3NbZG9jSWRdOwogICAgICBpZiAoT2JqZWN0LmtleXMocG9zdGluZ3MpLmxlbmd0aCA9PT0gMCkgewogICAgICAgIGF3YWl0IHRoaXMuaW5kZXguZGVsZXRlKHRlcm0pOwogICAgICB9IGVsc2UgewogICAgICAgIGF3YWl0IHRoaXMuaW5kZXguYWRkKHRlcm0sIHBvc3RpbmdzKTsKICAgICAgfQogICAgfQogICAgYXdhaXQgdGhpcy5kb2N1bWVudFRlcm1zLmRlbGV0ZShkb2NJZCk7CiAgICBhd2FpdCB0aGlzLmRvY3VtZW50TGVuZ3Rocy5kZWxldGUoZG9jSWQpOwogICAgcmV0dXJuIHRydWU7CiAgfQogIC8qKgogICAqIFF1ZXJ5IHRoZSBpbmRleCBmb3IgZG9jdW1lbnRzIGNvbnRhaW5pbmcgdGhlIGdpdmVuIHRlcm1zIHdpdGggcmVsZXZhbmNlIHNjb3JpbmcKICAgKiBAcGFyYW0ge3N0cmluZ30gcXVlcnlUZXh0IC0gVGhlIHNlYXJjaCBxdWVyeSB0ZXh0CiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBRdWVyeSBvcHRpb25zCiAgICogQHBhcmFtIHtib29sZWFufSBvcHRpb25zLnNjb3JlZCAtIElmIHRydWUsIHJldHVybiBzY29yZWQgcmVzdWx0czsgaWYgZmFsc2UsIHJldHVybiBqdXN0IElEcyAoZGVmYXVsdDogdHJ1ZSkKICAgKiBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbnMucmVxdWlyZUFsbCAtIElmIHRydWUsIHJlcXVpcmUgQUxMIHRlcm1zOyBpZiBmYWxzZSwgcmFuayBieSByZWxldmFuY2UgKGRlZmF1bHQ6IGZhbHNlKQogICAqIEByZXR1cm5zIHtBcnJheX0gQXJyYXkgb2YgZG9jdW1lbnQgSURzIChpZiBzY29yZWQ9ZmFsc2UpIG9yIG9iamVjdHMgd2l0aCB7aWQsIHNjb3JlfSAoaWYgc2NvcmVkPXRydWUpCiAgICovCiAgYXN5bmMgcXVlcnkocXVlcnlUZXh0LCBvcHRpb25zID0geyBzY29yZWQ6IHRydWUsIHJlcXVpcmVBbGw6IGZhbHNlIH0pIHsKICAgIHRoaXMuX2Vuc3VyZU9wZW4oKTsKICAgIGNvbnN0IHdvcmRzID0gdG9rZW5pemUocXVlcnlUZXh0KTsKICAgIGlmICh3b3Jkcy5sZW5ndGggPT09IDApIHsKICAgICAgcmV0dXJuIFtdOwogICAgfQogICAgY29uc3Qgc3RlbW1lZFRlcm1zID0gd29yZHMubWFwKCh3b3JkKSA9PiBzdGVtbWVyKHdvcmQpKTsKICAgIGNvbnN0IHVuaXF1ZVRlcm1zID0gWy4uLm5ldyBTZXQoc3RlbW1lZFRlcm1zKV07CiAgICBpZiAob3B0aW9ucy5yZXF1aXJlQWxsKSB7CiAgICAgIGNvbnN0IGRvY1NldHMgPSBbXTsKICAgICAgZm9yIChjb25zdCB0ZXJtIG9mIHVuaXF1ZVRlcm1zKSB7CiAgICAgICAgY29uc3QgdGVybURvY3MgPSBhd2FpdCB0aGlzLmluZGV4LnNlYXJjaCh0ZXJtKTsKICAgICAgICBkb2NTZXRzLnB1c2gobmV3IFNldChPYmplY3Qua2V5cyh0ZXJtRG9jcyB8fCB7fSkpKTsKICAgICAgfQogICAgICBpZiAoZG9jU2V0cy5sZW5ndGggPT09IDApIHsKICAgICAgICByZXR1cm4gW107CiAgICAgIH0KICAgICAgY29uc3QgaW50ZXJzZWN0aW9uID0gbmV3IFNldChkb2NTZXRzWzBdKTsKICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBkb2NTZXRzLmxlbmd0aDsgaSsrKSB7CiAgICAgICAgZm9yIChjb25zdCBkb2NJZCBvZiBbLi4uaW50ZXJzZWN0aW9uXSkgewogICAgICAgICAgaWYgKCFkb2NTZXRzW2ldLmhhcyhkb2NJZCkpIHsKICAgICAgICAgICAgaW50ZXJzZWN0aW9uLmRlbGV0ZShkb2NJZCk7CiAgICAgICAgICB9CiAgICAgICAgfQogICAgICB9CiAgICAgIHJldHVybiBBcnJheS5mcm9tKGludGVyc2VjdGlvbik7CiAgICB9CiAgICBjb25zdCBkb2NMZW5ndGhFbnRyaWVzID0gYXdhaXQgdGhpcy5kb2N1bWVudExlbmd0aHMudG9BcnJheSgpOwogICAgY29uc3QgZG9jTGVuZ3RoTWFwID0gbmV3IE1hcChkb2NMZW5ndGhFbnRyaWVzLm1hcCgoeyBrZXksIHZhbHVlIH0pID0+IFtTdHJpbmcoa2V5KSwgdmFsdWUgfHwgMV0pKTsKICAgIGNvbnN0IHRvdGFsRG9jcyA9IGRvY0xlbmd0aEVudHJpZXMubGVuZ3RoOwogICAgY29uc3QgaWRmID0gLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKTsKICAgIGZvciAoY29uc3QgdGVybSBvZiB1bmlxdWVUZXJtcykgewogICAgICBjb25zdCB0ZXJtRG9jcyA9IGF3YWl0IHRoaXMuaW5kZXguc2VhcmNoKHRlcm0pOwogICAgICBjb25zdCBkb2NzV2l0aFRlcm0gPSB0ZXJtRG9jcyA/IE9iamVjdC5rZXlzKHRlcm1Eb2NzKS5sZW5ndGggOiAwOwogICAgICBpZiAoZG9jc1dpdGhUZXJtID4gMCkgewogICAgICAgIGlkZi5zZXQodGVybSwgTWF0aC5sb2codG90YWxEb2NzIC8gZG9jc1dpdGhUZXJtKSk7CiAgICAgIH0KICAgIH0KICAgIGNvbnN0IGRvY1Njb3JlcyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCk7CiAgICBmb3IgKGNvbnN0IHRlcm0gb2YgdW5pcXVlVGVybXMpIHsKICAgICAgY29uc3QgdGVybURvY3MgPSBhd2FpdCB0aGlzLmluZGV4LnNlYXJjaCh0ZXJtKTsKICAgICAgaWYgKCF0ZXJtRG9jcykgewogICAgICAgIGNvbnRpbnVlOwogICAgICB9CiAgICAgIGZvciAoY29uc3QgW2RvY0lkLCB0ZXJtRnJlcV0gb2YgT2JqZWN0LmVudHJpZXModGVybURvY3MpKSB7CiAgICAgICAgY29uc3QgZG9jTGVuZ3RoID0gZG9jTGVuZ3RoTWFwLmdldChkb2NJZCkgfHwgMTsKICAgICAgICBjb25zdCB0ZiA9IHRlcm1GcmVxIC8gZG9jTGVuZ3RoOwogICAgICAgIGNvbnN0IHRlcm1JZGYgPSBpZGYuZ2V0KHRlcm0pIHx8IDA7CiAgICAgICAgY29uc3QgcHJldiA9IGRvY1Njb3Jlcy5nZXQoZG9jSWQpIHx8IDA7CiAgICAgICAgZG9jU2NvcmVzLnNldChkb2NJZCwgcHJldiArIHRmICogdGVybUlkZik7CiAgICAgIH0KICAgIH0KICAgIGZvciAoY29uc3QgW2RvY0lkLCBzY29yZV0gb2YgZG9jU2NvcmVzLmVudHJpZXMoKSkgewogICAgICBjb25zdCBkb2NUZXJtcyA9IGF3YWl0IHRoaXMuZG9jdW1lbnRUZXJtcy5zZWFyY2goZG9jSWQpIHx8IHt9OwogICAgICBjb25zdCBtYXRjaGluZ1Rlcm1zID0gdW5pcXVlVGVybXMuZmlsdGVyKCh0ZXJtKSA9PiAhIWRvY1Rlcm1zW3Rlcm1dKS5sZW5ndGg7CiAgICAgIGNvbnN0IGNvdmVyYWdlID0gbWF0Y2hpbmdUZXJtcyAvIHVuaXF1ZVRlcm1zLmxlbmd0aDsKICAgICAgZG9jU2NvcmVzLnNldChkb2NJZCwgc2NvcmUgKiAoMSArIGNvdmVyYWdlKSk7CiAgICB9CiAgICBjb25zdCByZXN1bHRzID0gQXJyYXkuZnJvbShkb2NTY29yZXMuZW50cmllcygpKS5tYXAoKFtpZCwgc2NvcmVdKSA9PiAoeyBpZCwgc2NvcmUgfSkpLnNvcnQoKGEsIGIpID0+IGIuc2NvcmUgLSBhLnNjb3JlKTsKICAgIGlmIChvcHRpb25zLnNjb3JlZCA9PT0gZmFsc2UpIHsKICAgICAgcmV0dXJuIHJlc3VsdHMubWFwKChyKSA9PiByLmlkKTsKICAgIH0KICAgIHJldHVybiByZXN1bHRzOwogIH0KICAvKioKICAgKiBHZXQgdGhlIG51bWJlciBvZiB1bmlxdWUgdGVybXMgaW4gdGhlIGluZGV4CiAgICogQHJldHVybnMge251bWJlcn0gTnVtYmVyIG9mIHVuaXF1ZSB0ZXJtcwogICAqLwogIGFzeW5jIGdldFRlcm1Db3VudCgpIHsKICAgIHRoaXMuX2Vuc3VyZU9wZW4oKTsKICAgIGNvbnN0IHRlcm1zID0gYXdhaXQgdGhpcy5pbmRleC50b0FycmF5KCk7CiAgICByZXR1cm4gdGVybXMubGVuZ3RoOwogIH0KICAvKioKICAgKiBHZXQgdGhlIG51bWJlciBvZiBkb2N1bWVudHMgaW4gdGhlIGluZGV4CiAgICogQHJldHVybnMge251bWJlcn0gTnVtYmVyIG9mIGluZGV4ZWQgZG9jdW1lbnRzCiAgICovCiAgYXN5bmMgZ2V0RG9jdW1lbnRDb3VudCgpIHsKICAgIHRoaXMuX2Vuc3VyZU9wZW4oKTsKICAgIGNvbnN0IGRvY3MgPSBhd2FpdCB0aGlzLmRvY3VtZW50VGVybXMudG9BcnJheSgpOwogICAgcmV0dXJuIGRvY3MubGVuZ3RoOwogIH0KICAvKioKICAgKiBDbGVhciBhbGwgZGF0YSBmcm9tIHRoZSBpbmRleAogICAqLwogIGFzeW5jIGNsZWFyKCkgewogICAgdGhpcy5fZW5zdXJlT3BlbigpOwogICAgY29uc3QgW3Rlcm1zLCBkb2NzLCBsZW5ndGhzXSA9IGF3YWl0IFByb21pc2UuYWxsKFsKICAgICAgdGhpcy5pbmRleC50b0FycmF5KCksCiAgICAgIHRoaXMuZG9jdW1lbnRUZXJtcy50b0FycmF5KCksCiAgICAgIHRoaXMuZG9jdW1lbnRMZW5ndGhzLnRvQXJyYXkoKQogICAgXSk7CiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIHRlcm1zKSB7CiAgICAgIGF3YWl0IHRoaXMuaW5kZXguZGVsZXRlKGVudHJ5LmtleSk7CiAgICB9CiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGRvY3MpIHsKICAgICAgYXdhaXQgdGhpcy5kb2N1bWVudFRlcm1zLmRlbGV0ZShlbnRyeS5rZXkpOwogICAgfQogICAgZm9yIChjb25zdCBlbnRyeSBvZiBsZW5ndGhzKSB7CiAgICAgIGF3YWl0IHRoaXMuZG9jdW1lbnRMZW5ndGhzLmRlbGV0ZShlbnRyeS5rZXkpOwogICAgfQogIH0KICAvKioKICAgKiBDb21wYWN0IGFsbCBpbnRlcm5hbCBCKyB0cmVlcyB1c2luZyBwcm92aWRlZCBkZXN0aW5hdGlvbiB0cmVlIGluc3RhbmNlcy4KICAgKiBUaGUgZGVzdGluYXRpb24gdHJlZXMgc2hvdWxkIGJlIGZyZXNobHkgY3JlYXRlZCAodW5vcGVuZWQpIHdpdGggbmV3IHN5bmMgaGFuZGxlcy4KICAgKiBBZnRlciBjb21wYWN0aW9uIGNvbXBsZXRlcywgdGhlIGRlc3RpbmF0aW9uIHN5bmMgaGFuZGxlcyB3aWxsIGJlIGNsb3NlZC4KICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIENvbXBhY3Rpb24gb3B0aW9ucyAgCiAgICogQHBhcmFtIHtCUGx1c1RyZWV9IG9wdGlvbnMuaW5kZXggLSBGcmVzaCBkZXN0aW5hdGlvbiB0cmVlIGZvciBpbmRleCBkYXRhCiAgICogQHBhcmFtIHtCUGx1c1RyZWV9IG9wdGlvbnMuZG9jdW1lbnRUZXJtcyAtIEZyZXNoIGRlc3RpbmF0aW9uIHRyZWUgZm9yIGRvY3VtZW50IHRlcm1zCiAgICogQHBhcmFtIHtCUGx1c1RyZWV9IG9wdGlvbnMuZG9jdW1lbnRMZW5ndGhzIC0gRnJlc2ggZGVzdGluYXRpb24gdHJlZSBmb3IgZG9jdW1lbnQgbGVuZ3RocwogICAqIEByZXR1cm5zIHtQcm9taXNlPHt0ZXJtczogb2JqZWN0LCBkb2N1bWVudHM6IG9iamVjdCwgbGVuZ3Roczogb2JqZWN0fT59CiAgICovCiAgYXN5bmMgY29tcGFjdCh7IGluZGV4OiBkZXN0SW5kZXgsIGRvY3VtZW50VGVybXM6IGRlc3REb2NUZXJtcywgZG9jdW1lbnRMZW5ndGhzOiBkZXN0RG9jTGVuZ3RocyB9KSB7CiAgICB0aGlzLl9lbnN1cmVPcGVuKCk7CiAgICBpZiAoIWRlc3RJbmRleCB8fCAhZGVzdERvY1Rlcm1zIHx8ICFkZXN0RG9jTGVuZ3RocykgewogICAgICB0aHJvdyBuZXcgRXJyb3IoIkRlc3RpbmF0aW9uIHRyZWVzIG11c3QgYmUgcHJvdmlkZWQgZm9yIGNvbXBhY3Rpb24iKTsKICAgIH0KICAgIGNvbnN0IHRlcm1zUmVzdWx0ID0gYXdhaXQgdGhpcy5pbmRleC5jb21wYWN0KGRlc3RJbmRleC5maWxlLnN5bmNBY2Nlc3NIYW5kbGUpOwogICAgY29uc3QgZG9jdW1lbnRzUmVzdWx0ID0gYXdhaXQgdGhpcy5kb2N1bWVudFRlcm1zLmNvbXBhY3QoZGVzdERvY1Rlcm1zLmZpbGUuc3luY0FjY2Vzc0hhbmRsZSk7CiAgICBjb25zdCBsZW5ndGhzUmVzdWx0ID0gYXdhaXQgdGhpcy5kb2N1bWVudExlbmd0aHMuY29tcGFjdChkZXN0RG9jTGVuZ3Rocy5maWxlLnN5bmNBY2Nlc3NIYW5kbGUpOwogICAgYXdhaXQgdGhpcy5jbG9zZSgpOwogICAgdGhpcy5pc09wZW4gPSBmYWxzZTsKICAgIHJldHVybiB7CiAgICAgIHRlcm1zOiB0ZXJtc1Jlc3VsdCwKICAgICAgZG9jdW1lbnRzOiBkb2N1bWVudHNSZXN1bHQsCiAgICAgIGxlbmd0aHM6IGxlbmd0aHNSZXN1bHQKICAgIH07CiAgfQp9CmZ1bmN0aW9uIGV2YWx1YXRlRXhwcmVzc2lvbihleHByLCBkb2MpIHsKICBpZiAoZXhwciA9PT0gbnVsbCB8fCBleHByID09PSB2b2lkIDApIHsKICAgIHJldHVybiBleHByOwogIH0KICBpZiAodHlwZW9mIGV4cHIgPT09ICJib29sZWFuIiB8fCB0eXBlb2YgZXhwciA9PT0gIm51bWJlciIpIHsKICAgIHJldHVybiBleHByOwogIH0KICBpZiAodHlwZW9mIGV4cHIgPT09ICJzdHJpbmciKSB7CiAgICBpZiAoZXhwci5zdGFydHNXaXRoKCIkJCIpKSB7CiAgICAgIGlmIChleHByID09PSAiJCRLRUVQIiB8fCBleHByID09PSAiJCRQUlVORSIgfHwgZXhwciA9PT0gIiQkREVTQ0VORCIpIHsKICAgICAgICByZXR1cm4gZXhwcjsKICAgICAgfQogICAgICByZXR1cm4gZ2V0UHJvcChkb2MsIGV4cHIuc3Vic3RyaW5nKDIpKTsKICAgIH0gZWxzZSBpZiAoZXhwci5jaGFyQXQoMCkgPT09ICIkIikgewogICAgICByZXR1cm4gZ2V0UHJvcChkb2MsIGV4cHIuc3Vic3RyaW5nKDEpKTsKICAgIH0KICAgIHJldHVybiBleHByOwogIH0KICBpZiAodHlwZW9mIGV4cHIgPT09ICJvYmplY3QiKSB7CiAgICBpZiAoQXJyYXkuaXNBcnJheShleHByKSkgewogICAgICByZXR1cm4gZXhwci5tYXAoKGl0ZW0pID0+IGV2YWx1YXRlRXhwcmVzc2lvbihpdGVtLCBkb2MpKTsKICAgIH0KICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhleHByKTsKICAgIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkgewogICAgICByZXR1cm4gZXhwcjsKICAgIH0KICAgIGNvbnN0IG9wZXJhdG9yID0ga2V5c1swXTsKICAgIGlmIChvcGVyYXRvci5jaGFyQXQoMCkgPT09ICIkIikgewogICAgICBjb25zdCBvcGVyYW5kID0gZXhwcltvcGVyYXRvcl07CiAgICAgIHJldHVybiBldmFsdWF0ZU9wZXJhdG9yKG9wZXJhdG9yLCBvcGVyYW5kLCBkb2MpOwogICAgfSBlbHNlIHsKICAgICAgY29uc3QgcmVzdWx0ID0ge307CiAgICAgIGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHsKICAgICAgICByZXN1bHRba2V5XSA9IGV2YWx1YXRlRXhwcmVzc2lvbihleHByW2tleV0sIGRvYyk7CiAgICAgIH0KICAgICAgcmV0dXJuIHJlc3VsdDsKICAgIH0KICB9CiAgcmV0dXJuIGV4cHI7Cn0KZnVuY3Rpb24gZXZhbHVhdGVPcGVyYXRvcihvcGVyYXRvciwgb3BlcmFuZCwgZG9jKSB7CiAgc3dpdGNoIChvcGVyYXRvcikgewogICAgLy8gQXJpdGhtZXRpYyBvcGVyYXRvcnMKICAgIGNhc2UgIiRhZGQiOgogICAgICByZXR1cm4gZXZhbEFkZChvcGVyYW5kLCBkb2MpOwogICAgY2FzZSAiJHN1YnRyYWN0IjoKICAgICAgcmV0dXJuIGV2YWxTdWJ0cmFjdChvcGVyYW5kLCBkb2MpOwogICAgY2FzZSAiJG11bHRpcGx5IjoKICAgICAgcmV0dXJuIGV2YWxNdWx0aXBseShvcGVyYW5kLCBkb2MpOwogICAgY2FzZSAiJGRpdmlkZSI6CiAgICAgIHJldHVybiBldmFsRGl2aWRlKG9wZXJhbmQsIGRvYyk7CiAgICBjYXNlICIkbW9kIjoKICAgICAgcmV0dXJuIGV2YWxNb2Qob3BlcmFuZCwgZG9jKTsKICAgIGNhc2UgIiRwb3ciOgogICAgICByZXR1cm4gZXZhbFBvdyhvcGVyYW5kLCBkb2MpOwogICAgY2FzZSAiJHNxcnQiOgogICAgICByZXR1cm4gZXZhbFNxcnQob3BlcmFuZCwgZG9jKTsKICAgIGNhc2UgIiRhYnMiOgogICAgICByZXR1cm4gZXZhbEFicyhvcGVyYW5kLCBkb2MpOwogICAgY2FzZSAiJGNlaWwiOgogICAgICByZXR1cm4gZXZhbENlaWwob3BlcmFuZCwgZG9jKTsKICAgIGNhc2UgIiRmbG9vciI6CiAgICAgIHJldHVybiBldmFsRmxvb3Iob3BlcmFuZCwgZG9jKTsKICAgIGNhc2UgIiR0cnVuYyI6CiAgICAgIHJldHVybiBldmFsVHJ1bmMob3BlcmFuZCwgZG9jKTsKICAgIGNhc2UgIiRyb3VuZCI6CiAgICAgIHJldHVybiBldmFsUm91bmQob3BlcmFuZCwgZG9jKTsKICAgIC8vIFN0cmluZyBvcGVyYXRvcnMKICAgIGNhc2UgIiRjb25jYXQiOgogICAgICByZXR1cm4gZXZhbENvbmNhdChvcGVyYW5kLCBkb2MpOwogICAgY2FzZSAiJHN1YnN0ciI6CiAgICAgIHJldHVybiBldmFsU3Vic3RyKG9wZXJhbmQsIGRvYyk7CiAgICBjYXNlICIkdG9Mb3dlciI6CiAgICAgIHJldHVybiBldmFsVG9Mb3dlcihvcGVyYW5kLCBkb2MpOwogICAgY2FzZSAiJHRvVXBwZXIiOgogICAgICByZXR1cm4gZXZhbFRvVXBwZXIob3BlcmFuZCwgZG9jKTsKICAgIGNhc2UgIiR0cmltIjoKICAgICAgcmV0dXJuIGV2YWxUcmltKG9wZXJhbmQsIGRvYyk7CiAgICBjYXNlICIkbHRyaW0iOgogICAgICByZXR1cm4gZXZhbEx0cmltKG9wZXJhbmQsIGRvYyk7CiAgICBjYXNlICIkcnRyaW0iOgogICAgICByZXR1cm4gZXZhbFJ0cmltKG9wZXJhbmQsIGRvYyk7CiAgICBjYXNlICIkc3BsaXQiOgogICAgICByZXR1cm4gZXZhbFNwbGl0KG9wZXJhbmQsIGRvYyk7CiAgICBjYXNlICIkc3RyTGVuQ1AiOgogICAgICByZXR1cm4gZXZhbFN0ckxlbkNQKG9wZXJhbmQsIGRvYyk7CiAgICBjYXNlICIkc3RyY2FzZWNtcCI6CiAgICAgIHJldHVybiBldmFsU3RyY2FzZWNtcChvcGVyYW5kLCBkb2MpOwogICAgY2FzZSAiJGluZGV4T2ZDUCI6CiAgICAgIHJldHVybiBldmFsSW5kZXhPZkNQKG9wZXJhbmQsIGRvYyk7CiAgICBjYXNlICIkcmVwbGFjZU9uZSI6CiAgICAgIHJldHVybiBldmFsUmVwbGFjZU9uZShvcGVyYW5kLCBkb2MpOwogICAgY2FzZSAiJHJlcGxhY2VBbGwiOgogICAgICByZXR1cm4gZXZhbFJlcGxhY2VBbGwob3BlcmFuZCwgZG9jKTsKICAgIC8vIENvbXBhcmlzb24gb3BlcmF0b3JzCiAgICBjYXNlICIkY21wIjoKICAgICAgcmV0dXJuIGV2YWxDbXAob3BlcmFuZCwgZG9jKTsKICAgIGNhc2UgIiRlcSI6CiAgICAgIHJldHVybiBldmFsRXEob3BlcmFuZCwgZG9jKTsKICAgIGNhc2UgIiRuZSI6CiAgICAgIHJldHVybiBldmFsTmUob3BlcmFuZCwgZG9jKTsKICAgIGNhc2UgIiRndCI6CiAgICAgIHJldHVybiBldmFsR3Qob3BlcmFuZCwgZG9jKTsKICAgIGNhc2UgIiRndGUiOgogICAgICByZXR1cm4gZXZhbEd0ZShvcGVyYW5kLCBkb2MpOwogICAgY2FzZSAiJGx0IjoKICAgICAgcmV0dXJuIGV2YWxMdChvcGVyYW5kLCBkb2MpOwogICAgY2FzZSAiJGx0ZSI6CiAgICAgIHJldHVybiBldmFsTHRlKG9wZXJhbmQsIGRvYyk7CiAgICAvLyBMb2dpY2FsIG9wZXJhdG9ycwogICAgY2FzZSAiJGFuZCI6CiAgICAgIHJldHVybiBldmFsQW5kKG9wZXJhbmQsIGRvYyk7CiAgICBjYXNlICIkb3IiOgogICAgICByZXR1cm4gZXZhbE9yKG9wZXJhbmQsIGRvYyk7CiAgICBjYXNlICIkbm90IjoKICAgICAgcmV0dXJuIGV2YWxOb3Qob3BlcmFuZCwgZG9jKTsKICAgIC8vIENvbmRpdGlvbmFsIG9wZXJhdG9ycwogICAgY2FzZSAiJGNvbmQiOgogICAgICByZXR1cm4gZXZhbENvbmQob3BlcmFuZCwgZG9jKTsKICAgIGNhc2UgIiRpZk51bGwiOgogICAgICByZXR1cm4gZXZhbElmTnVsbChvcGVyYW5kLCBkb2MpOwogICAgY2FzZSAiJHN3aXRjaCI6CiAgICAgIHJldHVybiBldmFsU3dpdGNoKG9wZXJhbmQsIGRvYyk7CiAgICAvLyBEYXRlIG9wZXJhdG9ycwogICAgY2FzZSAiJHllYXIiOgogICAgICByZXR1cm4gZXZhbFllYXIob3BlcmFuZCwgZG9jKTsKICAgIGNhc2UgIiRtb250aCI6CiAgICAgIHJldHVybiBldmFsTW9udGgob3BlcmFuZCwgZG9jKTsKICAgIGNhc2UgIiRkYXlPZk1vbnRoIjoKICAgICAgcmV0dXJuIGV2YWxEYXlPZk1vbnRoKG9wZXJhbmQsIGRvYyk7CiAgICBjYXNlICIkZGF5T2ZXZWVrIjoKICAgICAgcmV0dXJuIGV2YWxEYXlPZldlZWsob3BlcmFuZCwgZG9jKTsKICAgIGNhc2UgIiRkYXlPZlllYXIiOgogICAgICByZXR1cm4gZXZhbERheU9mWWVhcihvcGVyYW5kLCBkb2MpOwogICAgY2FzZSAiJGhvdXIiOgogICAgICByZXR1cm4gZXZhbEhvdXIob3BlcmFuZCwgZG9jKTsKICAgIGNhc2UgIiRtaW51dGUiOgogICAgICByZXR1cm4gZXZhbE1pbnV0ZShvcGVyYW5kLCBkb2MpOwogICAgY2FzZSAiJHNlY29uZCI6CiAgICAgIHJldHVybiBldmFsU2Vjb25kKG9wZXJhbmQsIGRvYyk7CiAgICBjYXNlICIkbWlsbGlzZWNvbmQiOgogICAgICByZXR1cm4gZXZhbE1pbGxpc2Vjb25kKG9wZXJhbmQsIGRvYyk7CiAgICBjYXNlICIkd2VlayI6CiAgICAgIHJldHVybiBldmFsV2VlayhvcGVyYW5kLCBkb2MpOwogICAgY2FzZSAiJGlzb1dlZWsiOgogICAgICByZXR1cm4gZXZhbElzb1dlZWsob3BlcmFuZCwgZG9jKTsKICAgIGNhc2UgIiRpc29XZWVrWWVhciI6CiAgICAgIHJldHVybiBldmFsSXNvV2Vla1llYXIob3BlcmFuZCwgZG9jKTsKICAgIGNhc2UgIiRkYXRlVG9TdHJpbmciOgogICAgICByZXR1cm4gZXZhbERhdGVUb1N0cmluZyhvcGVyYW5kLCBkb2MpOwogICAgY2FzZSAiJHRvRGF0ZSI6CiAgICAgIHJldHVybiBldmFsVG9EYXRlKG9wZXJhbmQsIGRvYyk7CiAgICAvLyBBcnJheSBvcGVyYXRvcnMKICAgIGNhc2UgIiRhcnJheUVsZW1BdCI6CiAgICAgIHJldHVybiBldmFsQXJyYXlFbGVtQXQob3BlcmFuZCwgZG9jKTsKICAgIGNhc2UgIiRjb25jYXRBcnJheXMiOgogICAgICByZXR1cm4gZXZhbENvbmNhdEFycmF5cyhvcGVyYW5kLCBkb2MpOwogICAgY2FzZSAiJGZpbHRlciI6CiAgICAgIHJldHVybiBldmFsRmlsdGVyKG9wZXJhbmQsIGRvYyk7CiAgICBjYXNlICIkaW4iOgogICAgICByZXR1cm4gZXZhbEluKG9wZXJhbmQsIGRvYyk7CiAgICBjYXNlICIkaW5kZXhPZkFycmF5IjoKICAgICAgcmV0dXJuIGV2YWxJbmRleE9mQXJyYXkob3BlcmFuZCwgZG9jKTsKICAgIGNhc2UgIiRpc0FycmF5IjoKICAgICAgcmV0dXJuIGV2YWxJc0FycmF5KG9wZXJhbmQsIGRvYyk7CiAgICBjYXNlICIkbWFwIjoKICAgICAgcmV0dXJuIGV2YWxNYXAob3BlcmFuZCwgZG9jKTsKICAgIGNhc2UgIiRyZWR1Y2UiOgogICAgICByZXR1cm4gZXZhbFJlZHVjZShvcGVyYW5kLCBkb2MpOwogICAgY2FzZSAiJHNpemUiOgogICAgICByZXR1cm4gZXZhbFNpemUob3BlcmFuZCwgZG9jKTsKICAgIGNhc2UgIiRzbGljZSI6CiAgICAgIHJldHVybiBldmFsU2xpY2Uob3BlcmFuZCwgZG9jKTsKICAgIGNhc2UgIiRyZXZlcnNlQXJyYXkiOgogICAgICByZXR1cm4gZXZhbFJldmVyc2VBcnJheShvcGVyYW5kLCBkb2MpOwogICAgY2FzZSAiJHppcCI6CiAgICAgIHJldHVybiBldmFsWmlwKG9wZXJhbmQsIGRvYyk7CiAgICAvLyBUeXBlIG9wZXJhdG9ycwogICAgY2FzZSAiJHR5cGUiOgogICAgICByZXR1cm4gZXZhbFR5cGUob3BlcmFuZCwgZG9jKTsKICAgIGNhc2UgIiRjb252ZXJ0IjoKICAgICAgcmV0dXJuIGV2YWxDb252ZXJ0KG9wZXJhbmQsIGRvYyk7CiAgICBjYXNlICIkdG9Cb29sIjoKICAgICAgcmV0dXJuIGV2YWxUb0Jvb2wob3BlcmFuZCwgZG9jKTsKICAgIGNhc2UgIiR0b0RlY2ltYWwiOgogICAgICByZXR1cm4gZXZhbFRvRGVjaW1hbChvcGVyYW5kLCBkb2MpOwogICAgY2FzZSAiJHRvRG91YmxlIjoKICAgICAgcmV0dXJuIGV2YWxUb0RvdWJsZShvcGVyYW5kLCBkb2MpOwogICAgY2FzZSAiJHRvSW50IjoKICAgICAgcmV0dXJuIGV2YWxUb0ludChvcGVyYW5kLCBkb2MpOwogICAgY2FzZSAiJHRvTG9uZyI6CiAgICAgIHJldHVybiBldmFsVG9Mb25nKG9wZXJhbmQsIGRvYyk7CiAgICBjYXNlICIkdG9TdHJpbmciOgogICAgICByZXR1cm4gZXZhbFRvU3RyaW5nKG9wZXJhbmQsIGRvYyk7CiAgICAvLyBPYmplY3Qgb3BlcmF0b3JzCiAgICBjYXNlICIkb2JqZWN0VG9BcnJheSI6CiAgICAgIHJldHVybiBldmFsT2JqZWN0VG9BcnJheShvcGVyYW5kLCBkb2MpOwogICAgY2FzZSAiJGFycmF5VG9PYmplY3QiOgogICAgICByZXR1cm4gZXZhbEFycmF5VG9PYmplY3Qob3BlcmFuZCwgZG9jKTsKICAgIGNhc2UgIiRtZXJnZU9iamVjdHMiOgogICAgICByZXR1cm4gZXZhbE1lcmdlT2JqZWN0cyhvcGVyYW5kLCBkb2MpOwogICAgLy8gTGl0ZXJhbCBvcGVyYXRvcgogICAgY2FzZSAiJGxpdGVyYWwiOgogICAgICByZXR1cm4gb3BlcmFuZDsKICAgIGRlZmF1bHQ6CiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgYWdncmVnYXRpb24gb3BlcmF0b3I6ICR7b3BlcmF0b3J9YCk7CiAgfQp9CmZ1bmN0aW9uIGV2YWxBZGQob3BlcmFuZHMsIGRvYykgewogIGlmICghQXJyYXkuaXNBcnJheShvcGVyYW5kcykpIHJldHVybiBudWxsOwogIGxldCBzdW0gPSAwOwogIGZvciAoY29uc3Qgb3BlcmFuZCBvZiBvcGVyYW5kcykgewogICAgY29uc3QgdmFsID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmQsIGRvYyk7CiAgICBpZiAodmFsIGluc3RhbmNlb2YgRGF0ZSkgewogICAgICBzdW0gKz0gdmFsLmdldFRpbWUoKTsKICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gIm51bWJlciIpIHsKICAgICAgc3VtICs9IHZhbDsKICAgIH0KICB9CiAgcmV0dXJuIHN1bTsKfQpmdW5jdGlvbiBldmFsU3VidHJhY3Qob3BlcmFuZHMsIGRvYykgewogIGlmICghQXJyYXkuaXNBcnJheShvcGVyYW5kcykgfHwgb3BlcmFuZHMubGVuZ3RoICE9PSAyKSByZXR1cm4gbnVsbDsKICBjb25zdCB2YWwxID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmRzWzBdLCBkb2MpOwogIGNvbnN0IHZhbDIgPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZHNbMV0sIGRvYyk7CiAgaWYgKHZhbDEgaW5zdGFuY2VvZiBEYXRlICYmIHZhbDIgaW5zdGFuY2VvZiBEYXRlKSB7CiAgICByZXR1cm4gdmFsMS5nZXRUaW1lKCkgLSB2YWwyLmdldFRpbWUoKTsKICB9IGVsc2UgaWYgKHZhbDEgaW5zdGFuY2VvZiBEYXRlICYmIHR5cGVvZiB2YWwyID09PSAibnVtYmVyIikgewogICAgcmV0dXJuIG5ldyBEYXRlKHZhbDEuZ2V0VGltZSgpIC0gdmFsMik7CiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsMSA9PT0gIm51bWJlciIgJiYgdHlwZW9mIHZhbDIgPT09ICJudW1iZXIiKSB7CiAgICByZXR1cm4gdmFsMSAtIHZhbDI7CiAgfQogIHJldHVybiBudWxsOwp9CmZ1bmN0aW9uIGV2YWxNdWx0aXBseShvcGVyYW5kcywgZG9jKSB7CiAgaWYgKCFBcnJheS5pc0FycmF5KG9wZXJhbmRzKSkgcmV0dXJuIG51bGw7CiAgbGV0IHByb2R1Y3QgPSAxOwogIGZvciAoY29uc3Qgb3BlcmFuZCBvZiBvcGVyYW5kcykgewogICAgY29uc3QgdmFsID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmQsIGRvYyk7CiAgICBpZiAodHlwZW9mIHZhbCA9PT0gIm51bWJlciIpIHsKICAgICAgcHJvZHVjdCAqPSB2YWw7CiAgICB9CiAgfQogIHJldHVybiBwcm9kdWN0Owp9CmZ1bmN0aW9uIGV2YWxEaXZpZGUob3BlcmFuZHMsIGRvYykgewogIGlmICghQXJyYXkuaXNBcnJheShvcGVyYW5kcykgfHwgb3BlcmFuZHMubGVuZ3RoICE9PSAyKSByZXR1cm4gbnVsbDsKICBjb25zdCB2YWwxID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmRzWzBdLCBkb2MpOwogIGNvbnN0IHZhbDIgPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZHNbMV0sIGRvYyk7CiAgaWYgKHR5cGVvZiB2YWwxID09PSAibnVtYmVyIiAmJiB0eXBlb2YgdmFsMiA9PT0gIm51bWJlciIgJiYgdmFsMiAhPT0gMCkgewogICAgcmV0dXJuIHZhbDEgLyB2YWwyOwogIH0KICByZXR1cm4gbnVsbDsKfQpmdW5jdGlvbiBldmFsTW9kKG9wZXJhbmRzLCBkb2MpIHsKICBpZiAoIUFycmF5LmlzQXJyYXkob3BlcmFuZHMpIHx8IG9wZXJhbmRzLmxlbmd0aCAhPT0gMikgcmV0dXJuIG51bGw7CiAgY29uc3QgdmFsMSA9IGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kc1swXSwgZG9jKTsKICBjb25zdCB2YWwyID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmRzWzFdLCBkb2MpOwogIGlmICh0eXBlb2YgdmFsMSA9PT0gIm51bWJlciIgJiYgdHlwZW9mIHZhbDIgPT09ICJudW1iZXIiICYmIHZhbDIgIT09IDApIHsKICAgIHJldHVybiB2YWwxICUgdmFsMjsKICB9CiAgcmV0dXJuIG51bGw7Cn0KZnVuY3Rpb24gZXZhbFBvdyhvcGVyYW5kcywgZG9jKSB7CiAgaWYgKCFBcnJheS5pc0FycmF5KG9wZXJhbmRzKSB8fCBvcGVyYW5kcy5sZW5ndGggIT09IDIpIHJldHVybiBudWxsOwogIGNvbnN0IGJhc2UgPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZHNbMF0sIGRvYyk7CiAgY29uc3QgZXhwb25lbnQgPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZHNbMV0sIGRvYyk7CiAgaWYgKHR5cGVvZiBiYXNlID09PSAibnVtYmVyIiAmJiB0eXBlb2YgZXhwb25lbnQgPT09ICJudW1iZXIiKSB7CiAgICByZXR1cm4gTWF0aC5wb3coYmFzZSwgZXhwb25lbnQpOwogIH0KICByZXR1cm4gbnVsbDsKfQpmdW5jdGlvbiBldmFsU3FydChvcGVyYW5kLCBkb2MpIHsKICBjb25zdCB2YWwgPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZCwgZG9jKTsKICBpZiAodHlwZW9mIHZhbCA9PT0gIm51bWJlciIgJiYgdmFsID49IDApIHsKICAgIHJldHVybiBNYXRoLnNxcnQodmFsKTsKICB9CiAgcmV0dXJuIG51bGw7Cn0KZnVuY3Rpb24gZXZhbEFicyhvcGVyYW5kLCBkb2MpIHsKICBjb25zdCB2YWwgPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZCwgZG9jKTsKICBpZiAodHlwZW9mIHZhbCA9PT0gIm51bWJlciIpIHsKICAgIHJldHVybiBNYXRoLmFicyh2YWwpOwogIH0KICByZXR1cm4gbnVsbDsKfQpmdW5jdGlvbiBldmFsQ2VpbChvcGVyYW5kLCBkb2MpIHsKICBjb25zdCB2YWwgPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZCwgZG9jKTsKICBpZiAodHlwZW9mIHZhbCA9PT0gIm51bWJlciIpIHsKICAgIHJldHVybiBNYXRoLmNlaWwodmFsKTsKICB9CiAgcmV0dXJuIG51bGw7Cn0KZnVuY3Rpb24gZXZhbEZsb29yKG9wZXJhbmQsIGRvYykgewogIGNvbnN0IHZhbCA9IGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kLCBkb2MpOwogIGlmICh0eXBlb2YgdmFsID09PSAibnVtYmVyIikgewogICAgcmV0dXJuIE1hdGguZmxvb3IodmFsKTsKICB9CiAgcmV0dXJuIG51bGw7Cn0KZnVuY3Rpb24gZXZhbFRydW5jKG9wZXJhbmQsIGRvYykgewogIGNvbnN0IHZhbCA9IGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kLCBkb2MpOwogIGlmICh0eXBlb2YgdmFsID09PSAibnVtYmVyIikgewogICAgcmV0dXJuIE1hdGgudHJ1bmModmFsKTsKICB9CiAgcmV0dXJuIG51bGw7Cn0KZnVuY3Rpb24gZXZhbFJvdW5kKG9wZXJhbmRzLCBkb2MpIHsKICBjb25zdCB2YWwgPSBldmFsdWF0ZUV4cHJlc3Npb24oQXJyYXkuaXNBcnJheShvcGVyYW5kcykgPyBvcGVyYW5kc1swXSA6IG9wZXJhbmRzLCBkb2MpOwogIGNvbnN0IHBsYWNlID0gQXJyYXkuaXNBcnJheShvcGVyYW5kcykgJiYgb3BlcmFuZHNbMV0gIT09IHZvaWQgMCA/IGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kc1sxXSwgZG9jKSA6IDA7CiAgaWYgKHR5cGVvZiB2YWwgPT09ICJudW1iZXIiICYmIHR5cGVvZiBwbGFjZSA9PT0gIm51bWJlciIpIHsKICAgIGNvbnN0IG11bHRpcGxpZXIgPSBNYXRoLnBvdygxMCwgcGxhY2UpOwogICAgcmV0dXJuIE1hdGgucm91bmQodmFsICogbXVsdGlwbGllcikgLyBtdWx0aXBsaWVyOwogIH0KICByZXR1cm4gbnVsbDsKfQpmdW5jdGlvbiBldmFsQ29uY2F0KG9wZXJhbmRzLCBkb2MpIHsKICBpZiAoIUFycmF5LmlzQXJyYXkob3BlcmFuZHMpKSByZXR1cm4gbnVsbDsKICBsZXQgcmVzdWx0ID0gIiI7CiAgZm9yIChjb25zdCBvcGVyYW5kIG9mIG9wZXJhbmRzKSB7CiAgICBjb25zdCB2YWwgPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZCwgZG9jKTsKICAgIGlmICh2YWwgIT09IG51bGwgJiYgdmFsICE9PSB2b2lkIDApIHsKICAgICAgcmVzdWx0ICs9IFN0cmluZyh2YWwpOwogICAgfQogIH0KICByZXR1cm4gcmVzdWx0Owp9CmZ1bmN0aW9uIGV2YWxTdWJzdHIob3BlcmFuZHMsIGRvYykgewogIGlmICghQXJyYXkuaXNBcnJheShvcGVyYW5kcykgfHwgb3BlcmFuZHMubGVuZ3RoIDwgMykgcmV0dXJuIG51bGw7CiAgY29uc3Qgc3RyID0gU3RyaW5nKGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kc1swXSwgZG9jKSB8fCAiIik7CiAgY29uc3Qgc3RhcnQgPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZHNbMV0sIGRvYyk7CiAgY29uc3QgbGVuZ3RoID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmRzWzJdLCBkb2MpOwogIGlmICh0eXBlb2Ygc3RhcnQgPT09ICJudW1iZXIiICYmIHR5cGVvZiBsZW5ndGggPT09ICJudW1iZXIiKSB7CiAgICByZXR1cm4gc3RyLnN1YnN0cihzdGFydCwgbGVuZ3RoKTsKICB9CiAgcmV0dXJuIG51bGw7Cn0KZnVuY3Rpb24gZXZhbFRvTG93ZXIob3BlcmFuZCwgZG9jKSB7CiAgY29uc3QgdmFsID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmQsIGRvYyk7CiAgcmV0dXJuIHZhbCAhPT0gbnVsbCAmJiB2YWwgIT09IHZvaWQgMCA/IFN0cmluZyh2YWwpLnRvTG93ZXJDYXNlKCkgOiAiIjsKfQpmdW5jdGlvbiBldmFsVG9VcHBlcihvcGVyYW5kLCBkb2MpIHsKICBjb25zdCB2YWwgPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZCwgZG9jKTsKICByZXR1cm4gdmFsICE9PSBudWxsICYmIHZhbCAhPT0gdm9pZCAwID8gU3RyaW5nKHZhbCkudG9VcHBlckNhc2UoKSA6ICIiOwp9CmZ1bmN0aW9uIGV2YWxUcmltKG9wZXJhbmQsIGRvYykgewogIGNvbnN0IHZhbCA9IGV2YWx1YXRlRXhwcmVzc2lvbih0eXBlb2Ygb3BlcmFuZCA9PT0gIm9iamVjdCIgJiYgb3BlcmFuZC5pbnB1dCA/IG9wZXJhbmQuaW5wdXQgOiBvcGVyYW5kLCBkb2MpOwogIGNvbnN0IGNoYXJzID0gb3BlcmFuZC5jaGFycyA/IGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kLmNoYXJzLCBkb2MpIDogbnVsbDsKICBsZXQgc3RyID0gdmFsICE9PSBudWxsICYmIHZhbCAhPT0gdm9pZCAwID8gU3RyaW5nKHZhbCkgOiAiIjsKICBpZiAoY2hhcnMpIHsKICAgIGNvbnN0IGNoYXJzUmVnZXggPSBuZXcgUmVnRXhwKGBeWyR7ZXNjYXBlUmVnZXgoY2hhcnMpfV0rfFske2VzY2FwZVJlZ2V4KGNoYXJzKX1dKyRgLCAiZyIpOwogICAgcmV0dXJuIHN0ci5yZXBsYWNlKGNoYXJzUmVnZXgsICIiKTsKICB9CiAgcmV0dXJuIHN0ci50cmltKCk7Cn0KZnVuY3Rpb24gZXZhbEx0cmltKG9wZXJhbmQsIGRvYykgewogIGNvbnN0IHZhbCA9IGV2YWx1YXRlRXhwcmVzc2lvbih0eXBlb2Ygb3BlcmFuZCA9PT0gIm9iamVjdCIgJiYgb3BlcmFuZC5pbnB1dCA/IG9wZXJhbmQuaW5wdXQgOiBvcGVyYW5kLCBkb2MpOwogIGNvbnN0IGNoYXJzID0gb3BlcmFuZC5jaGFycyA/IGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kLmNoYXJzLCBkb2MpIDogbnVsbDsKICBsZXQgc3RyID0gdmFsICE9PSBudWxsICYmIHZhbCAhPT0gdm9pZCAwID8gU3RyaW5nKHZhbCkgOiAiIjsKICBpZiAoY2hhcnMpIHsKICAgIGNvbnN0IGNoYXJzUmVnZXggPSBuZXcgUmVnRXhwKGBeWyR7ZXNjYXBlUmVnZXgoY2hhcnMpfV0rYCwgImciKTsKICAgIHJldHVybiBzdHIucmVwbGFjZShjaGFyc1JlZ2V4LCAiIik7CiAgfQogIHJldHVybiBzdHIucmVwbGFjZSgvXlxzKy8sICIiKTsKfQpmdW5jdGlvbiBldmFsUnRyaW0ob3BlcmFuZCwgZG9jKSB7CiAgY29uc3QgdmFsID0gZXZhbHVhdGVFeHByZXNzaW9uKHR5cGVvZiBvcGVyYW5kID09PSAib2JqZWN0IiAmJiBvcGVyYW5kLmlucHV0ID8gb3BlcmFuZC5pbnB1dCA6IG9wZXJhbmQsIGRvYyk7CiAgY29uc3QgY2hhcnMgPSBvcGVyYW5kLmNoYXJzID8gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmQuY2hhcnMsIGRvYykgOiBudWxsOwogIGxldCBzdHIgPSB2YWwgIT09IG51bGwgJiYgdmFsICE9PSB2b2lkIDAgPyBTdHJpbmcodmFsKSA6ICIiOwogIGlmIChjaGFycykgewogICAgY29uc3QgY2hhcnNSZWdleCA9IG5ldyBSZWdFeHAoYFske2VzY2FwZVJlZ2V4KGNoYXJzKX1dKyRgLCAiZyIpOwogICAgcmV0dXJuIHN0ci5yZXBsYWNlKGNoYXJzUmVnZXgsICIiKTsKICB9CiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9ccyskLywgIiIpOwp9CmZ1bmN0aW9uIGV2YWxTcGxpdChvcGVyYW5kcywgZG9jKSB7CiAgaWYgKCFBcnJheS5pc0FycmF5KG9wZXJhbmRzKSB8fCBvcGVyYW5kcy5sZW5ndGggIT09IDIpIHJldHVybiBudWxsOwogIGNvbnN0IHN0ciA9IFN0cmluZyhldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZHNbMF0sIGRvYykgfHwgIiIpOwogIGNvbnN0IGRlbGltaXRlciA9IFN0cmluZyhldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZHNbMV0sIGRvYykgfHwgIiIpOwogIHJldHVybiBzdHIuc3BsaXQoZGVsaW1pdGVyKTsKfQpmdW5jdGlvbiBldmFsU3RyTGVuQ1Aob3BlcmFuZCwgZG9jKSB7CiAgY29uc3QgdmFsID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmQsIGRvYyk7CiAgcmV0dXJuIHZhbCAhPT0gbnVsbCAmJiB2YWwgIT09IHZvaWQgMCA/IFN0cmluZyh2YWwpLmxlbmd0aCA6IDA7Cn0KZnVuY3Rpb24gZXZhbFN0cmNhc2VjbXAob3BlcmFuZHMsIGRvYykgewogIGlmICghQXJyYXkuaXNBcnJheShvcGVyYW5kcykgfHwgb3BlcmFuZHMubGVuZ3RoICE9PSAyKSByZXR1cm4gbnVsbDsKICBjb25zdCBzdHIxID0gU3RyaW5nKGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kc1swXSwgZG9jKSB8fCAiIikudG9Mb3dlckNhc2UoKTsKICBjb25zdCBzdHIyID0gU3RyaW5nKGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kc1sxXSwgZG9jKSB8fCAiIikudG9Mb3dlckNhc2UoKTsKICBpZiAoc3RyMSA8IHN0cjIpIHJldHVybiAtMTsKICBpZiAoc3RyMSA+IHN0cjIpIHJldHVybiAxOwogIHJldHVybiAwOwp9CmZ1bmN0aW9uIGV2YWxJbmRleE9mQ1Aob3BlcmFuZHMsIGRvYykgewogIGlmICghQXJyYXkuaXNBcnJheShvcGVyYW5kcykgfHwgb3BlcmFuZHMubGVuZ3RoIDwgMikgcmV0dXJuIG51bGw7CiAgY29uc3Qgc3RyID0gU3RyaW5nKGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kc1swXSwgZG9jKSB8fCAiIik7CiAgY29uc3Qgc3Vic3RyID0gU3RyaW5nKGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kc1sxXSwgZG9jKSB8fCAiIik7CiAgY29uc3Qgc3RhcnQgPSBvcGVyYW5kc1syXSAhPT0gdm9pZCAwID8gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmRzWzJdLCBkb2MpIDogMDsKICBjb25zdCBlbmQgPSBvcGVyYW5kc1szXSAhPT0gdm9pZCAwID8gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmRzWzNdLCBkb2MpIDogc3RyLmxlbmd0aDsKICBjb25zdCBzZWFyY2hTdHIgPSBzdHIuc3Vic3RyaW5nKHN0YXJ0LCBlbmQpOwogIGNvbnN0IGluZGV4ID0gc2VhcmNoU3RyLmluZGV4T2Yoc3Vic3RyKTsKICByZXR1cm4gaW5kZXggPT09IC0xID8gLTEgOiBpbmRleCArIHN0YXJ0Owp9CmZ1bmN0aW9uIGV2YWxSZXBsYWNlT25lKG9wZXJhbmQsIGRvYykgewogIGNvbnN0IGlucHV0ID0gU3RyaW5nKGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kLmlucHV0LCBkb2MpIHx8ICIiKTsKICBjb25zdCBmaW5kID0gU3RyaW5nKGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kLmZpbmQsIGRvYykgfHwgIiIpOwogIGNvbnN0IHJlcGxhY2VtZW50ID0gU3RyaW5nKGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kLnJlcGxhY2VtZW50LCBkb2MpIHx8ICIiKTsKICByZXR1cm4gaW5wdXQucmVwbGFjZShmaW5kLCByZXBsYWNlbWVudCk7Cn0KZnVuY3Rpb24gZXZhbFJlcGxhY2VBbGwob3BlcmFuZCwgZG9jKSB7CiAgY29uc3QgaW5wdXQgPSBTdHJpbmcoZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmQuaW5wdXQsIGRvYykgfHwgIiIpOwogIGNvbnN0IGZpbmQgPSBTdHJpbmcoZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmQuZmluZCwgZG9jKSB8fCAiIik7CiAgY29uc3QgcmVwbGFjZW1lbnQgPSBTdHJpbmcoZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmQucmVwbGFjZW1lbnQsIGRvYykgfHwgIiIpOwogIHJldHVybiBpbnB1dC5zcGxpdChmaW5kKS5qb2luKHJlcGxhY2VtZW50KTsKfQpmdW5jdGlvbiBlc2NhcGVSZWdleChzdHIpIHsKICByZXR1cm4gc3RyLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXVxcXS9nLCAiXFwkJiIpOwp9CmZ1bmN0aW9uIGV2YWxDbXAob3BlcmFuZHMsIGRvYykgewogIGlmICghQXJyYXkuaXNBcnJheShvcGVyYW5kcykgfHwgb3BlcmFuZHMubGVuZ3RoICE9PSAyKSByZXR1cm4gbnVsbDsKICBjb25zdCB2YWwxID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmRzWzBdLCBkb2MpOwogIGNvbnN0IHZhbDIgPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZHNbMV0sIGRvYyk7CiAgaWYgKHZhbDEgPCB2YWwyKSByZXR1cm4gLTE7CiAgaWYgKHZhbDEgPiB2YWwyKSByZXR1cm4gMTsKICByZXR1cm4gMDsKfQpmdW5jdGlvbiBldmFsRXEob3BlcmFuZHMsIGRvYykgewogIGlmICghQXJyYXkuaXNBcnJheShvcGVyYW5kcykgfHwgb3BlcmFuZHMubGVuZ3RoICE9PSAyKSByZXR1cm4gbnVsbDsKICBjb25zdCB2YWwxID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmRzWzBdLCBkb2MpOwogIGNvbnN0IHZhbDIgPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZHNbMV0sIGRvYyk7CiAgcmV0dXJuIHZhbDEgPT09IHZhbDI7Cn0KZnVuY3Rpb24gZXZhbE5lKG9wZXJhbmRzLCBkb2MpIHsKICBpZiAoIUFycmF5LmlzQXJyYXkob3BlcmFuZHMpIHx8IG9wZXJhbmRzLmxlbmd0aCAhPT0gMikgcmV0dXJuIG51bGw7CiAgY29uc3QgdmFsMSA9IGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kc1swXSwgZG9jKTsKICBjb25zdCB2YWwyID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmRzWzFdLCBkb2MpOwogIHJldHVybiB2YWwxICE9PSB2YWwyOwp9CmZ1bmN0aW9uIGV2YWxHdChvcGVyYW5kcywgZG9jKSB7CiAgaWYgKCFBcnJheS5pc0FycmF5KG9wZXJhbmRzKSB8fCBvcGVyYW5kcy5sZW5ndGggIT09IDIpIHJldHVybiBudWxsOwogIGNvbnN0IHZhbDEgPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZHNbMF0sIGRvYyk7CiAgY29uc3QgdmFsMiA9IGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kc1sxXSwgZG9jKTsKICByZXR1cm4gdmFsMSA+IHZhbDI7Cn0KZnVuY3Rpb24gZXZhbEd0ZShvcGVyYW5kcywgZG9jKSB7CiAgaWYgKCFBcnJheS5pc0FycmF5KG9wZXJhbmRzKSB8fCBvcGVyYW5kcy5sZW5ndGggIT09IDIpIHJldHVybiBudWxsOwogIGNvbnN0IHZhbDEgPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZHNbMF0sIGRvYyk7CiAgY29uc3QgdmFsMiA9IGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kc1sxXSwgZG9jKTsKICByZXR1cm4gdmFsMSA+PSB2YWwyOwp9CmZ1bmN0aW9uIGV2YWxMdChvcGVyYW5kcywgZG9jKSB7CiAgaWYgKCFBcnJheS5pc0FycmF5KG9wZXJhbmRzKSB8fCBvcGVyYW5kcy5sZW5ndGggIT09IDIpIHJldHVybiBudWxsOwogIGNvbnN0IHZhbDEgPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZHNbMF0sIGRvYyk7CiAgY29uc3QgdmFsMiA9IGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kc1sxXSwgZG9jKTsKICByZXR1cm4gdmFsMSA8IHZhbDI7Cn0KZnVuY3Rpb24gZXZhbEx0ZShvcGVyYW5kcywgZG9jKSB7CiAgaWYgKCFBcnJheS5pc0FycmF5KG9wZXJhbmRzKSB8fCBvcGVyYW5kcy5sZW5ndGggIT09IDIpIHJldHVybiBudWxsOwogIGNvbnN0IHZhbDEgPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZHNbMF0sIGRvYyk7CiAgY29uc3QgdmFsMiA9IGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kc1sxXSwgZG9jKTsKICByZXR1cm4gdmFsMSA8PSB2YWwyOwp9CmZ1bmN0aW9uIGV2YWxBbmQob3BlcmFuZHMsIGRvYykgewogIGlmICghQXJyYXkuaXNBcnJheShvcGVyYW5kcykpIHJldHVybiBudWxsOwogIGZvciAoY29uc3Qgb3BlcmFuZCBvZiBvcGVyYW5kcykgewogICAgY29uc3QgdmFsID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmQsIGRvYyk7CiAgICBpZiAoIXZhbCkgcmV0dXJuIGZhbHNlOwogIH0KICByZXR1cm4gdHJ1ZTsKfQpmdW5jdGlvbiBldmFsT3Iob3BlcmFuZHMsIGRvYykgewogIGlmICghQXJyYXkuaXNBcnJheShvcGVyYW5kcykpIHJldHVybiBudWxsOwogIGZvciAoY29uc3Qgb3BlcmFuZCBvZiBvcGVyYW5kcykgewogICAgY29uc3QgdmFsID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmQsIGRvYyk7CiAgICBpZiAodmFsKSByZXR1cm4gdHJ1ZTsKICB9CiAgcmV0dXJuIGZhbHNlOwp9CmZ1bmN0aW9uIGV2YWxOb3Qob3BlcmFuZCwgZG9jKSB7CiAgY29uc3QgdmFsID0gZXZhbHVhdGVFeHByZXNzaW9uKEFycmF5LmlzQXJyYXkob3BlcmFuZCkgPyBvcGVyYW5kWzBdIDogb3BlcmFuZCwgZG9jKTsKICByZXR1cm4gIXZhbDsKfQpmdW5jdGlvbiBldmFsQ29uZChvcGVyYW5kLCBkb2MpIHsKICBsZXQgaWZFeHByLCB0aGVuRXhwciwgZWxzZUV4cHI7CiAgaWYgKEFycmF5LmlzQXJyYXkob3BlcmFuZCkpIHsKICAgIGlmIChvcGVyYW5kLmxlbmd0aCAhPT0gMykgcmV0dXJuIG51bGw7CiAgICBbaWZFeHByLCB0aGVuRXhwciwgZWxzZUV4cHJdID0gb3BlcmFuZDsKICB9IGVsc2UgaWYgKHR5cGVvZiBvcGVyYW5kID09PSAib2JqZWN0IikgewogICAgaWZFeHByID0gb3BlcmFuZC5pZjsKICAgIHRoZW5FeHByID0gb3BlcmFuZC50aGVuOwogICAgZWxzZUV4cHIgPSBvcGVyYW5kLmVsc2U7CiAgfSBlbHNlIHsKICAgIHJldHVybiBudWxsOwogIH0KICBjb25zdCBjb25kaXRpb24gPSBldmFsdWF0ZUV4cHJlc3Npb24oaWZFeHByLCBkb2MpOwogIHJldHVybiBjb25kaXRpb24gPyBldmFsdWF0ZUV4cHJlc3Npb24odGhlbkV4cHIsIGRvYykgOiBldmFsdWF0ZUV4cHJlc3Npb24oZWxzZUV4cHIsIGRvYyk7Cn0KZnVuY3Rpb24gZXZhbElmTnVsbChvcGVyYW5kcywgZG9jKSB7CiAgaWYgKCFBcnJheS5pc0FycmF5KG9wZXJhbmRzKSB8fCBvcGVyYW5kcy5sZW5ndGggPCAyKSByZXR1cm4gbnVsbDsKICBmb3IgKGxldCBpID0gMDsgaSA8IG9wZXJhbmRzLmxlbmd0aDsgaSsrKSB7CiAgICBjb25zdCB2YWwgPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZHNbaV0sIGRvYyk7CiAgICBpZiAodmFsICE9PSBudWxsICYmIHZhbCAhPT0gdm9pZCAwKSB7CiAgICAgIHJldHVybiB2YWw7CiAgICB9CiAgfQogIHJldHVybiBudWxsOwp9CmZ1bmN0aW9uIGV2YWxTd2l0Y2gob3BlcmFuZCwgZG9jKSB7CiAgaWYgKHR5cGVvZiBvcGVyYW5kICE9PSAib2JqZWN0IiB8fCAhQXJyYXkuaXNBcnJheShvcGVyYW5kLmJyYW5jaGVzKSkgewogICAgcmV0dXJuIG51bGw7CiAgfQogIGZvciAoY29uc3QgYnJhbmNoIG9mIG9wZXJhbmQuYnJhbmNoZXMpIHsKICAgIGNvbnN0IGNhc2VSZXN1bHQgPSBldmFsdWF0ZUV4cHJlc3Npb24oYnJhbmNoLmNhc2UsIGRvYyk7CiAgICBpZiAoY2FzZVJlc3VsdCkgewogICAgICByZXR1cm4gZXZhbHVhdGVFeHByZXNzaW9uKGJyYW5jaC50aGVuLCBkb2MpOwogICAgfQogIH0KICByZXR1cm4gb3BlcmFuZC5kZWZhdWx0ICE9PSB2b2lkIDAgPyBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZC5kZWZhdWx0LCBkb2MpIDogbnVsbDsKfQpmdW5jdGlvbiBldmFsWWVhcihvcGVyYW5kLCBkb2MpIHsKICBjb25zdCBkYXRlID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmQsIGRvYyk7CiAgaWYgKGRhdGUgaW5zdGFuY2VvZiBEYXRlKSB7CiAgICByZXR1cm4gZGF0ZS5nZXRVVENGdWxsWWVhcigpOwogIH0KICByZXR1cm4gbnVsbDsKfQpmdW5jdGlvbiBldmFsTW9udGgob3BlcmFuZCwgZG9jKSB7CiAgY29uc3QgZGF0ZSA9IGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kLCBkb2MpOwogIGlmIChkYXRlIGluc3RhbmNlb2YgRGF0ZSkgewogICAgcmV0dXJuIGRhdGUuZ2V0VVRDTW9udGgoKSArIDE7CiAgfQogIHJldHVybiBudWxsOwp9CmZ1bmN0aW9uIGV2YWxEYXlPZk1vbnRoKG9wZXJhbmQsIGRvYykgewogIGNvbnN0IGRhdGUgPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZCwgZG9jKTsKICBpZiAoZGF0ZSBpbnN0YW5jZW9mIERhdGUpIHsKICAgIHJldHVybiBkYXRlLmdldFVUQ0RhdGUoKTsKICB9CiAgcmV0dXJuIG51bGw7Cn0KZnVuY3Rpb24gZXZhbERheU9mV2VlayhvcGVyYW5kLCBkb2MpIHsKICBjb25zdCBkYXRlID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmQsIGRvYyk7CiAgaWYgKGRhdGUgaW5zdGFuY2VvZiBEYXRlKSB7CiAgICByZXR1cm4gZGF0ZS5nZXRVVENEYXkoKSArIDE7CiAgfQogIHJldHVybiBudWxsOwp9CmZ1bmN0aW9uIGV2YWxEYXlPZlllYXIob3BlcmFuZCwgZG9jKSB7CiAgY29uc3QgZGF0ZSA9IGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kLCBkb2MpOwogIGlmIChkYXRlIGluc3RhbmNlb2YgRGF0ZSkgewogICAgY29uc3Qgc3RhcnQgPSBuZXcgRGF0ZShEYXRlLlVUQyhkYXRlLmdldFVUQ0Z1bGxZZWFyKCksIDAsIDApKTsKICAgIGNvbnN0IGRpZmYgPSBkYXRlIC0gc3RhcnQ7CiAgICBjb25zdCBvbmVEYXkgPSAxZTMgKiA2MCAqIDYwICogMjQ7CiAgICByZXR1cm4gTWF0aC5mbG9vcihkaWZmIC8gb25lRGF5KTsKICB9CiAgcmV0dXJuIG51bGw7Cn0KZnVuY3Rpb24gZXZhbEhvdXIob3BlcmFuZCwgZG9jKSB7CiAgY29uc3QgZGF0ZSA9IGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kLCBkb2MpOwogIGlmIChkYXRlIGluc3RhbmNlb2YgRGF0ZSkgewogICAgcmV0dXJuIGRhdGUuZ2V0VVRDSG91cnMoKTsKICB9CiAgcmV0dXJuIG51bGw7Cn0KZnVuY3Rpb24gZXZhbE1pbnV0ZShvcGVyYW5kLCBkb2MpIHsKICBjb25zdCBkYXRlID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmQsIGRvYyk7CiAgaWYgKGRhdGUgaW5zdGFuY2VvZiBEYXRlKSB7CiAgICByZXR1cm4gZGF0ZS5nZXRVVENNaW51dGVzKCk7CiAgfQogIHJldHVybiBudWxsOwp9CmZ1bmN0aW9uIGV2YWxTZWNvbmQob3BlcmFuZCwgZG9jKSB7CiAgY29uc3QgZGF0ZSA9IGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kLCBkb2MpOwogIGlmIChkYXRlIGluc3RhbmNlb2YgRGF0ZSkgewogICAgcmV0dXJuIGRhdGUuZ2V0VVRDU2Vjb25kcygpOwogIH0KICByZXR1cm4gbnVsbDsKfQpmdW5jdGlvbiBldmFsTWlsbGlzZWNvbmQob3BlcmFuZCwgZG9jKSB7CiAgY29uc3QgZGF0ZSA9IGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kLCBkb2MpOwogIGlmIChkYXRlIGluc3RhbmNlb2YgRGF0ZSkgewogICAgcmV0dXJuIGRhdGUuZ2V0VVRDTWlsbGlzZWNvbmRzKCk7CiAgfQogIHJldHVybiBudWxsOwp9CmZ1bmN0aW9uIGV2YWxXZWVrKG9wZXJhbmQsIGRvYykgewogIGNvbnN0IGRhdGUgPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZCwgZG9jKTsKICBpZiAoZGF0ZSBpbnN0YW5jZW9mIERhdGUpIHsKICAgIGNvbnN0IG9uZWphbiA9IG5ldyBEYXRlKERhdGUuVVRDKGRhdGUuZ2V0VVRDRnVsbFllYXIoKSwgMCwgMSkpOwogICAgY29uc3Qgd2VlayA9IE1hdGguY2VpbCgoKGRhdGUgLSBvbmVqYW4pIC8gODY0ZTUgKyBvbmVqYW4uZ2V0VVRDRGF5KCkgKyAxKSAvIDcpOwogICAgcmV0dXJuIHdlZWsgLSAxOwogIH0KICByZXR1cm4gbnVsbDsKfQpmdW5jdGlvbiBldmFsSXNvV2VlayhvcGVyYW5kLCBkb2MpIHsKICBjb25zdCBkYXRlID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmQsIGRvYyk7CiAgaWYgKGRhdGUgaW5zdGFuY2VvZiBEYXRlKSB7CiAgICBjb25zdCB0YXJnZXQgPSBuZXcgRGF0ZShkYXRlLnZhbHVlT2YoKSk7CiAgICBjb25zdCBkYXlOciA9IChkYXRlLmdldFVUQ0RheSgpICsgNikgJSA3OwogICAgdGFyZ2V0LnNldFVUQ0RhdGUodGFyZ2V0LmdldFVUQ0RhdGUoKSAtIGRheU5yICsgMyk7CiAgICBjb25zdCBmaXJzdFRodXJzZGF5ID0gdGFyZ2V0LnZhbHVlT2YoKTsKICAgIHRhcmdldC5zZXRVVENNb250aCgwLCAxKTsKICAgIGlmICh0YXJnZXQuZ2V0VVRDRGF5KCkgIT09IDQpIHsKICAgICAgdGFyZ2V0LnNldFVUQ01vbnRoKDAsIDEgKyAoNCAtIHRhcmdldC5nZXRVVENEYXkoKSArIDcpICUgNyk7CiAgICB9CiAgICByZXR1cm4gMSArIE1hdGguY2VpbCgoZmlyc3RUaHVyc2RheSAtIHRhcmdldCkgLyA2MDQ4ZTUpOwogIH0KICByZXR1cm4gbnVsbDsKfQpmdW5jdGlvbiBldmFsSXNvV2Vla1llYXIob3BlcmFuZCwgZG9jKSB7CiAgY29uc3QgZGF0ZSA9IGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kLCBkb2MpOwogIGlmIChkYXRlIGluc3RhbmNlb2YgRGF0ZSkgewogICAgY29uc3QgdGFyZ2V0ID0gbmV3IERhdGUoZGF0ZS52YWx1ZU9mKCkpOwogICAgdGFyZ2V0LnNldFVUQ0RhdGUodGFyZ2V0LmdldFVUQ0RhdGUoKSAtIChkYXRlLmdldFVUQ0RheSgpICsgNikgJSA3ICsgMyk7CiAgICByZXR1cm4gdGFyZ2V0LmdldFVUQ0Z1bGxZZWFyKCk7CiAgfQogIHJldHVybiBudWxsOwp9CmZ1bmN0aW9uIGV2YWxEYXRlVG9TdHJpbmcob3BlcmFuZCwgZG9jKSB7CiAgY29uc3QgZm9ybWF0ID0gb3BlcmFuZC5mb3JtYXQgPyBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZC5mb3JtYXQsIGRvYykgOiAiJVktJW0tJWRUJUg6JU06JVMuJUxaIjsKICBjb25zdCBkYXRlID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmQuZGF0ZSwgZG9jKTsKICBpZiAoIShkYXRlIGluc3RhbmNlb2YgRGF0ZSkpIHJldHVybiBudWxsOwogIHJldHVybiBmb3JtYXQucmVwbGFjZSgiJVkiLCBkYXRlLmdldFVUQ0Z1bGxZZWFyKCkpLnJlcGxhY2UoIiVtIiwgU3RyaW5nKGRhdGUuZ2V0VVRDTW9udGgoKSArIDEpLnBhZFN0YXJ0KDIsICIwIikpLnJlcGxhY2UoIiVkIiwgU3RyaW5nKGRhdGUuZ2V0VVRDRGF0ZSgpKS5wYWRTdGFydCgyLCAiMCIpKS5yZXBsYWNlKCIlSCIsIFN0cmluZyhkYXRlLmdldFVUQ0hvdXJzKCkpLnBhZFN0YXJ0KDIsICIwIikpLnJlcGxhY2UoIiVNIiwgU3RyaW5nKGRhdGUuZ2V0VVRDTWludXRlcygpKS5wYWRTdGFydCgyLCAiMCIpKS5yZXBsYWNlKCIlUyIsIFN0cmluZyhkYXRlLmdldFVUQ1NlY29uZHMoKSkucGFkU3RhcnQoMiwgIjAiKSkucmVwbGFjZSgiJUwiLCBTdHJpbmcoZGF0ZS5nZXRVVENNaWxsaXNlY29uZHMoKSkucGFkU3RhcnQoMywgIjAiKSk7Cn0KZnVuY3Rpb24gZXZhbFRvRGF0ZShvcGVyYW5kLCBkb2MpIHsKICBjb25zdCB2YWwgPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZCwgZG9jKTsKICBpZiAodmFsIGluc3RhbmNlb2YgRGF0ZSkgcmV0dXJuIHZhbDsKICBpZiAodHlwZW9mIHZhbCA9PT0gInN0cmluZyIgfHwgdHlwZW9mIHZhbCA9PT0gIm51bWJlciIpIHsKICAgIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZSh2YWwpOwogICAgcmV0dXJuIGlzTmFOKGRhdGUuZ2V0VGltZSgpKSA/IG51bGwgOiBkYXRlOwogIH0KICByZXR1cm4gbnVsbDsKfQpmdW5jdGlvbiBldmFsQXJyYXlFbGVtQXQob3BlcmFuZHMsIGRvYykgewogIGlmICghQXJyYXkuaXNBcnJheShvcGVyYW5kcykgfHwgb3BlcmFuZHMubGVuZ3RoICE9PSAyKSByZXR1cm4gbnVsbDsKICBjb25zdCBhcnIgPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZHNbMF0sIGRvYyk7CiAgY29uc3QgaWR4ID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmRzWzFdLCBkb2MpOwogIGlmICghQXJyYXkuaXNBcnJheShhcnIpIHx8IHR5cGVvZiBpZHggIT09ICJudW1iZXIiKSByZXR1cm4gbnVsbDsKICBjb25zdCBpbmRleCA9IGlkeCA8IDAgPyBhcnIubGVuZ3RoICsgaWR4IDogaWR4OwogIHJldHVybiBhcnJbaW5kZXhdOwp9CmZ1bmN0aW9uIGV2YWxDb25jYXRBcnJheXMob3BlcmFuZHMsIGRvYykgewogIGlmICghQXJyYXkuaXNBcnJheShvcGVyYW5kcykpIHJldHVybiBudWxsOwogIGNvbnN0IHJlc3VsdCA9IFtdOwogIGZvciAoY29uc3Qgb3BlcmFuZCBvZiBvcGVyYW5kcykgewogICAgY29uc3QgYXJyID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmQsIGRvYyk7CiAgICBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7CiAgICAgIHJlc3VsdC5wdXNoKC4uLmFycik7CiAgICB9CiAgfQogIHJldHVybiByZXN1bHQ7Cn0KZnVuY3Rpb24gZXZhbEZpbHRlcihvcGVyYW5kLCBkb2MpIHsKICBjb25zdCBpbnB1dCA9IGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kLmlucHV0LCBkb2MpOwogIGNvbnN0IGFzVmFyID0gb3BlcmFuZC5hcyB8fCAidGhpcyI7CiAgY29uc3QgY29uZCA9IG9wZXJhbmQuY29uZDsKICBpZiAoIUFycmF5LmlzQXJyYXkoaW5wdXQpKSByZXR1cm4gbnVsbDsKICByZXR1cm4gaW5wdXQuZmlsdGVyKChpdGVtKSA9PiB7CiAgICBjb25zdCBpdGVtRG9jID0geyAuLi5kb2MsIFthc1Zhcl06IGl0ZW0gfTsKICAgIHJldHVybiBldmFsdWF0ZUV4cHJlc3Npb24oY29uZCwgaXRlbURvYyk7CiAgfSk7Cn0KZnVuY3Rpb24gZXZhbEluKG9wZXJhbmRzLCBkb2MpIHsKICBpZiAoIUFycmF5LmlzQXJyYXkob3BlcmFuZHMpIHx8IG9wZXJhbmRzLmxlbmd0aCAhPT0gMikgcmV0dXJuIG51bGw7CiAgY29uc3QgdmFsdWUgPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZHNbMF0sIGRvYyk7CiAgY29uc3QgYXJyID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmRzWzFdLCBkb2MpOwogIGlmICghQXJyYXkuaXNBcnJheShhcnIpKSByZXR1cm4gZmFsc2U7CiAgcmV0dXJuIGFyci5pbmNsdWRlcyh2YWx1ZSk7Cn0KZnVuY3Rpb24gZXZhbEluZGV4T2ZBcnJheShvcGVyYW5kcywgZG9jKSB7CiAgaWYgKCFBcnJheS5pc0FycmF5KG9wZXJhbmRzKSB8fCBvcGVyYW5kcy5sZW5ndGggPCAyKSByZXR1cm4gbnVsbDsKICBjb25zdCBhcnIgPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZHNbMF0sIGRvYyk7CiAgY29uc3Qgc2VhcmNoID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmRzWzFdLCBkb2MpOwogIGNvbnN0IHN0YXJ0ID0gb3BlcmFuZHNbMl0gIT09IHZvaWQgMCA/IGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kc1syXSwgZG9jKSA6IDA7CiAgY29uc3QgZW5kID0gb3BlcmFuZHNbM10gIT09IHZvaWQgMCA/IGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kc1szXSwgZG9jKSA6IGFyci5sZW5ndGg7CiAgaWYgKCFBcnJheS5pc0FycmF5KGFycikpIHJldHVybiBudWxsOwogIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZCAmJiBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7CiAgICBpZiAoYXJyW2ldID09PSBzZWFyY2gpIHJldHVybiBpOwogIH0KICByZXR1cm4gLTE7Cn0KZnVuY3Rpb24gZXZhbElzQXJyYXkob3BlcmFuZCwgZG9jKSB7CiAgY29uc3QgdmFsID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmQsIGRvYyk7CiAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsKTsKfQpmdW5jdGlvbiBldmFsTWFwKG9wZXJhbmQsIGRvYykgewogIGNvbnN0IGlucHV0ID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmQuaW5wdXQsIGRvYyk7CiAgY29uc3QgYXNWYXIgPSBvcGVyYW5kLmFzIHx8ICJ0aGlzIjsKICBjb25zdCBpbkV4cHIgPSBvcGVyYW5kLmluOwogIGlmICghQXJyYXkuaXNBcnJheShpbnB1dCkpIHJldHVybiBudWxsOwogIHJldHVybiBpbnB1dC5tYXAoKGl0ZW0pID0+IHsKICAgIGNvbnN0IGl0ZW1Eb2MgPSB7IC4uLmRvYywgW2FzVmFyXTogaXRlbSB9OwogICAgcmV0dXJuIGV2YWx1YXRlRXhwcmVzc2lvbihpbkV4cHIsIGl0ZW1Eb2MpOwogIH0pOwp9CmZ1bmN0aW9uIGV2YWxSZWR1Y2Uob3BlcmFuZCwgZG9jKSB7CiAgY29uc3QgaW5wdXQgPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZC5pbnB1dCwgZG9jKTsKICBjb25zdCBpbml0aWFsVmFsdWUgPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZC5pbml0aWFsVmFsdWUsIGRvYyk7CiAgY29uc3QgaW5FeHByID0gb3BlcmFuZC5pbjsKICBpZiAoIUFycmF5LmlzQXJyYXkoaW5wdXQpKSByZXR1cm4gbnVsbDsKICBsZXQgdmFsdWUgPSBpbml0aWFsVmFsdWU7CiAgZm9yIChjb25zdCBpdGVtIG9mIGlucHV0KSB7CiAgICBjb25zdCBpdGVtRG9jID0geyAuLi5kb2MsIHZhbHVlLCB0aGlzOiBpdGVtIH07CiAgICB2YWx1ZSA9IGV2YWx1YXRlRXhwcmVzc2lvbihpbkV4cHIsIGl0ZW1Eb2MpOwogIH0KICByZXR1cm4gdmFsdWU7Cn0KZnVuY3Rpb24gZXZhbFNpemUob3BlcmFuZCwgZG9jKSB7CiAgY29uc3QgYXJyID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmQsIGRvYyk7CiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXJyKSA/IGFyci5sZW5ndGggOiBudWxsOwp9CmZ1bmN0aW9uIGV2YWxTbGljZShvcGVyYW5kcywgZG9jKSB7CiAgaWYgKCFBcnJheS5pc0FycmF5KG9wZXJhbmRzKSB8fCBvcGVyYW5kcy5sZW5ndGggPCAyKSByZXR1cm4gbnVsbDsKICBjb25zdCBhcnIgPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZHNbMF0sIGRvYyk7CiAgaWYgKCFBcnJheS5pc0FycmF5KGFycikpIHJldHVybiBudWxsOwogIGlmIChvcGVyYW5kcy5sZW5ndGggPT09IDIpIHsKICAgIGNvbnN0IG4gPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZHNbMV0sIGRvYyk7CiAgICByZXR1cm4gbiA+PSAwID8gYXJyLnNsaWNlKDAsIG4pIDogYXJyLnNsaWNlKG4pOwogIH0gZWxzZSB7CiAgICBjb25zdCBwb3NpdGlvbiA9IGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kc1sxXSwgZG9jKTsKICAgIGNvbnN0IG4gPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZHNbMl0sIGRvYyk7CiAgICByZXR1cm4gYXJyLnNsaWNlKHBvc2l0aW9uLCBwb3NpdGlvbiArIG4pOwogIH0KfQpmdW5jdGlvbiBldmFsUmV2ZXJzZUFycmF5KG9wZXJhbmQsIGRvYykgewogIGNvbnN0IGFyciA9IGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kLCBkb2MpOwogIHJldHVybiBBcnJheS5pc0FycmF5KGFycikgPyBhcnIuc2xpY2UoKS5yZXZlcnNlKCkgOiBudWxsOwp9CmZ1bmN0aW9uIGV2YWxaaXAob3BlcmFuZCwgZG9jKSB7CiAgY29uc3QgaW5wdXRzID0gb3BlcmFuZC5pbnB1dHMgPyBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZC5pbnB1dHMsIGRvYykgOiBudWxsOwogIGNvbnN0IHVzZUxvbmdlc3RMZW5ndGggPSBvcGVyYW5kLnVzZUxvbmdlc3RMZW5ndGggfHwgZmFsc2U7CiAgY29uc3QgZGVmYXVsdHMgPSBvcGVyYW5kLmRlZmF1bHRzOwogIGlmICghQXJyYXkuaXNBcnJheShpbnB1dHMpKSByZXR1cm4gbnVsbDsKICBjb25zdCBhcnJheXMgPSBpbnB1dHMubWFwKChpbnB1dCkgPT4gZXZhbHVhdGVFeHByZXNzaW9uKGlucHV0LCBkb2MpKTsKICBpZiAoIWFycmF5cy5ldmVyeSgoYXJyKSA9PiBBcnJheS5pc0FycmF5KGFycikpKSByZXR1cm4gbnVsbDsKICBjb25zdCBtYXhMZW5ndGggPSBNYXRoLm1heCguLi5hcnJheXMubWFwKChhcnIpID0+IGFyci5sZW5ndGgpKTsKICBjb25zdCBsZW5ndGggPSB1c2VMb25nZXN0TGVuZ3RoID8gbWF4TGVuZ3RoIDogTWF0aC5taW4oLi4uYXJyYXlzLm1hcCgoYXJyKSA9PiBhcnIubGVuZ3RoKSk7CiAgY29uc3QgcmVzdWx0ID0gW107CiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykgewogICAgY29uc3QgdHVwbGUgPSBbXTsKICAgIGZvciAobGV0IGogPSAwOyBqIDwgYXJyYXlzLmxlbmd0aDsgaisrKSB7CiAgICAgIGlmIChpIDwgYXJyYXlzW2pdLmxlbmd0aCkgewogICAgICAgIHR1cGxlLnB1c2goYXJyYXlzW2pdW2ldKTsKICAgICAgfSBlbHNlIGlmIChkZWZhdWx0cyAmJiBqIDwgZGVmYXVsdHMubGVuZ3RoKSB7CiAgICAgICAgdHVwbGUucHVzaChkZWZhdWx0c1tqXSk7CiAgICAgIH0gZWxzZSB7CiAgICAgICAgdHVwbGUucHVzaChudWxsKTsKICAgICAgfQogICAgfQogICAgcmVzdWx0LnB1c2godHVwbGUpOwogIH0KICByZXR1cm4gcmVzdWx0Owp9CmZ1bmN0aW9uIGV2YWxUeXBlKG9wZXJhbmQsIGRvYykgewogIGNvbnN0IHZhbCA9IGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kLCBkb2MpOwogIGlmICh2YWwgPT09IG51bGwpIHJldHVybiAibnVsbCI7CiAgaWYgKHZhbCA9PT0gdm9pZCAwKSByZXR1cm4gIm1pc3NpbmciOwogIGlmICh0eXBlb2YgdmFsID09PSAiYm9vbGVhbiIpIHJldHVybiAiYm9vbCI7CiAgaWYgKHR5cGVvZiB2YWwgPT09ICJudW1iZXIiKSByZXR1cm4gTnVtYmVyLmlzSW50ZWdlcih2YWwpID8gImludCIgOiAiZG91YmxlIjsKICBpZiAodHlwZW9mIHZhbCA9PT0gInN0cmluZyIpIHJldHVybiAic3RyaW5nIjsKICBpZiAodmFsIGluc3RhbmNlb2YgRGF0ZSkgcmV0dXJuICJkYXRlIjsKICBpZiAoQXJyYXkuaXNBcnJheSh2YWwpKSByZXR1cm4gImFycmF5IjsKICBpZiAodHlwZW9mIHZhbCA9PT0gIm9iamVjdCIpIHJldHVybiAib2JqZWN0IjsKICByZXR1cm4gInVua25vd24iOwp9CmZ1bmN0aW9uIGV2YWxDb252ZXJ0KG9wZXJhbmQsIGRvYykgewogIGNvbnN0IGlucHV0ID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmQuaW5wdXQsIGRvYyk7CiAgY29uc3QgdG8gPSBvcGVyYW5kLnRvOwogIGNvbnN0IG9uRXJyb3IgPSBvcGVyYW5kLm9uRXJyb3I7CiAgY29uc3Qgb25OdWxsID0gb3BlcmFuZC5vbk51bGw7CiAgaWYgKGlucHV0ID09PSBudWxsKSB7CiAgICByZXR1cm4gb25OdWxsICE9PSB2b2lkIDAgPyBldmFsdWF0ZUV4cHJlc3Npb24ob25OdWxsLCBkb2MpIDogbnVsbDsKICB9CiAgdHJ5IHsKICAgIHN3aXRjaCAodG8pIHsKICAgICAgY2FzZSAiZG91YmxlIjoKICAgICAgY2FzZSAiZGVjaW1hbCI6CiAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoaW5wdXQpOwogICAgICBjYXNlICJpbnQiOgogICAgICBjYXNlICJsb25nIjoKICAgICAgICByZXR1cm4gcGFyc2VJbnQoaW5wdXQpOwogICAgICBjYXNlICJib29sIjoKICAgICAgICByZXR1cm4gQm9vbGVhbihpbnB1dCk7CiAgICAgIGNhc2UgInN0cmluZyI6CiAgICAgICAgcmV0dXJuIFN0cmluZyhpbnB1dCk7CiAgICAgIGNhc2UgImRhdGUiOgogICAgICAgIHJldHVybiBuZXcgRGF0ZShpbnB1dCk7CiAgICAgIGRlZmF1bHQ6CiAgICAgICAgcmV0dXJuIGlucHV0OwogICAgfQogIH0gY2F0Y2ggKGUpIHsKICAgIHJldHVybiBvbkVycm9yICE9PSB2b2lkIDAgPyBldmFsdWF0ZUV4cHJlc3Npb24ob25FcnJvciwgZG9jKSA6IG51bGw7CiAgfQp9CmZ1bmN0aW9uIGV2YWxUb0Jvb2wob3BlcmFuZCwgZG9jKSB7CiAgY29uc3QgdmFsID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmQsIGRvYyk7CiAgcmV0dXJuIEJvb2xlYW4odmFsKTsKfQpmdW5jdGlvbiBldmFsVG9EZWNpbWFsKG9wZXJhbmQsIGRvYykgewogIGNvbnN0IHZhbCA9IGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kLCBkb2MpOwogIHJldHVybiBwYXJzZUZsb2F0KHZhbCk7Cn0KZnVuY3Rpb24gZXZhbFRvRG91YmxlKG9wZXJhbmQsIGRvYykgewogIGNvbnN0IHZhbCA9IGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kLCBkb2MpOwogIHJldHVybiBwYXJzZUZsb2F0KHZhbCk7Cn0KZnVuY3Rpb24gZXZhbFRvSW50KG9wZXJhbmQsIGRvYykgewogIGNvbnN0IHZhbCA9IGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kLCBkb2MpOwogIHJldHVybiBwYXJzZUludCh2YWwpOwp9CmZ1bmN0aW9uIGV2YWxUb0xvbmcob3BlcmFuZCwgZG9jKSB7CiAgY29uc3QgdmFsID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmQsIGRvYyk7CiAgcmV0dXJuIHBhcnNlSW50KHZhbCk7Cn0KZnVuY3Rpb24gZXZhbFRvU3RyaW5nKG9wZXJhbmQsIGRvYykgewogIGNvbnN0IHZhbCA9IGV2YWx1YXRlRXhwcmVzc2lvbihvcGVyYW5kLCBkb2MpOwogIGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSB2b2lkIDApIHJldHVybiBudWxsOwogIHJldHVybiBTdHJpbmcodmFsKTsKfQpmdW5jdGlvbiBldmFsT2JqZWN0VG9BcnJheShvcGVyYW5kLCBkb2MpIHsKICBjb25zdCBvYmogPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZCwgZG9jKTsKICBpZiAodHlwZW9mIG9iaiAhPT0gIm9iamVjdCIgfHwgb2JqID09PSBudWxsIHx8IEFycmF5LmlzQXJyYXkob2JqKSkgewogICAgcmV0dXJuIG51bGw7CiAgfQogIHJldHVybiBPYmplY3Qua2V5cyhvYmopLm1hcCgoa2V5KSA9PiAoeyBrOiBrZXksIHY6IG9ialtrZXldIH0pKTsKfQpmdW5jdGlvbiBldmFsQXJyYXlUb09iamVjdChvcGVyYW5kLCBkb2MpIHsKICBjb25zdCBhcnIgPSBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZCwgZG9jKTsKICBpZiAoIUFycmF5LmlzQXJyYXkoYXJyKSkgcmV0dXJuIG51bGw7CiAgY29uc3QgcmVzdWx0ID0ge307CiAgZm9yIChjb25zdCBpdGVtIG9mIGFycikgewogICAgaWYgKEFycmF5LmlzQXJyYXkoaXRlbSkgJiYgaXRlbS5sZW5ndGggPT09IDIpIHsKICAgICAgcmVzdWx0W2l0ZW1bMF1dID0gaXRlbVsxXTsKICAgIH0gZWxzZSBpZiAodHlwZW9mIGl0ZW0gPT09ICJvYmplY3QiICYmIGl0ZW0uayAhPT0gdm9pZCAwICYmIGl0ZW0udiAhPT0gdm9pZCAwKSB7CiAgICAgIHJlc3VsdFtpdGVtLmtdID0gaXRlbS52OwogICAgfQogIH0KICByZXR1cm4gcmVzdWx0Owp9CmZ1bmN0aW9uIGV2YWxNZXJnZU9iamVjdHMob3BlcmFuZHMsIGRvYykgewogIGlmICghQXJyYXkuaXNBcnJheShvcGVyYW5kcykpIHsKICAgIHJldHVybiBldmFsdWF0ZUV4cHJlc3Npb24ob3BlcmFuZHMsIGRvYyk7CiAgfQogIGNvbnN0IHJlc3VsdCA9IHt9OwogIGZvciAoY29uc3Qgb3BlcmFuZCBvZiBvcGVyYW5kcykgewogICAgY29uc3Qgb2JqID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmQsIGRvYyk7CiAgICBpZiAodHlwZW9mIG9iaiA9PT0gIm9iamVjdCIgJiYgb2JqICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KG9iaikpIHsKICAgICAgT2JqZWN0LmFzc2lnbihyZXN1bHQsIG9iaik7CiAgICB9CiAgfQogIHJldHVybiByZXN1bHQ7Cn0KY29uc3QgQlNPTl9UWVBFUyA9IHsKICAxOiAiZG91YmxlIiwKICAyOiAic3RyaW5nIiwKICAzOiAib2JqZWN0IiwKICA0OiAiYXJyYXkiLAogIDU6ICJiaW5EYXRhIiwKICA2OiAidW5kZWZpbmVkIiwKICA3OiAib2JqZWN0SWQiLAogIDg6ICJib29sIiwKICA5OiAiZGF0ZSIsCiAgMTA6ICJudWxsIiwKICAxMTogInJlZ2V4IiwKICAxMzogImphdmFzY3JpcHQiLAogIDE1OiAiamF2YXNjcmlwdFdpdGhTY29wZSIsCiAgMTY6ICJpbnQiLAogIDE3OiAidGltZXN0YW1wIiwKICAxODogImxvbmciLAogIDE5OiAiZGVjaW1hbCIsCiAgMTI3OiAibWF4S2V5IiwKICAiLTEiOiAibWluS2V5Igp9Owpjb25zdCBUWVBFX0FMSUFTRVMgPSBPYmplY3QuZW50cmllcyhCU09OX1RZUEVTKS5yZWR1Y2UoKGFjYywgW2NvZGUsIG5hbWVdKSA9PiB7CiAgYWNjW25hbWVdID0gcGFyc2VJbnQoY29kZSk7CiAgcmV0dXJuIGFjYzsKfSwge30pOwpmdW5jdGlvbiBtYXRjaGVzVHlwZSh2YWx1ZSwgdHlwZVNwZWMpIHsKICBpZiAoaXNBcnJheSh0eXBlU3BlYykpIHsKICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdHlwZVNwZWMubGVuZ3RoOyBpKyspIHsKICAgICAgaWYgKG1hdGNoZXNUeXBlKHZhbHVlLCB0eXBlU3BlY1tpXSkpIHJldHVybiB0cnVlOwogICAgfQogICAgcmV0dXJuIGZhbHNlOwogIH0KICBjb25zdCB0eXBlQ29kZSA9IHR5cGVvZiB0eXBlU3BlYyA9PT0gIm51bWJlciIgPyB0eXBlU3BlYyA6IFRZUEVfQUxJQVNFU1t0eXBlU3BlY107CiAgY29uc3QgdHlwZU5hbWUgPSBCU09OX1RZUEVTW3R5cGVDb2RlXSB8fCB0eXBlU3BlYzsKICBpZiAodmFsdWUgPT09IG51bGwpIHJldHVybiB0eXBlTmFtZSA9PT0gIm51bGwiIHx8IHR5cGVDb2RlID09PSAxMDsKICBpZiAodmFsdWUgPT09IHZvaWQgMCkgcmV0dXJuIHR5cGVOYW1lID09PSAidW5kZWZpbmVkIiB8fCB0eXBlQ29kZSA9PT0gNjsKICBpZiAodHlwZW9mIHZhbHVlID09PSAibnVtYmVyIikgewogICAgaWYgKE51bWJlci5pc0ludGVnZXIodmFsdWUpKSByZXR1cm4gdHlwZU5hbWUgPT09ICJpbnQiIHx8IHR5cGVDb2RlID09PSAxNjsKICAgIHJldHVybiB0eXBlTmFtZSA9PT0gImRvdWJsZSIgfHwgdHlwZUNvZGUgPT09IDE7CiAgfQogIGlmICh0eXBlb2YgdmFsdWUgPT09ICJzdHJpbmciKSByZXR1cm4gdHlwZU5hbWUgPT09ICJzdHJpbmciIHx8IHR5cGVDb2RlID09PSAyOwogIGlmICh0eXBlb2YgdmFsdWUgPT09ICJib29sZWFuIikgcmV0dXJuIHR5cGVOYW1lID09PSAiYm9vbCIgfHwgdHlwZUNvZGUgPT09IDg7CiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRGF0ZSkgcmV0dXJuIHR5cGVOYW1lID09PSAiZGF0ZSIgfHwgdHlwZUNvZGUgPT09IDk7CiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgT2JqZWN0SWQpIHJldHVybiB0eXBlTmFtZSA9PT0gIm9iamVjdElkIiB8fCB0eXBlQ29kZSA9PT0gNzsKICBpZiAodmFsdWUgaW5zdGFuY2VvZiBSZWdFeHApIHJldHVybiB0eXBlTmFtZSA9PT0gInJlZ2V4IiB8fCB0eXBlQ29kZSA9PT0gMTE7CiAgaWYgKGlzQXJyYXkodmFsdWUpKSByZXR1cm4gdHlwZU5hbWUgPT09ICJhcnJheSIgfHwgdHlwZUNvZGUgPT09IDQ7CiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gIm9iamVjdCIpIHJldHVybiB0eXBlTmFtZSA9PT0gIm9iamVjdCIgfHwgdHlwZUNvZGUgPT09IDM7CiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gdHlwZVNwZWM7Cn0KZnVuY3Rpb24gdG9CaXRNYXNrKHBvc2l0aW9ucykgewogIGlmIChpc0FycmF5KHBvc2l0aW9ucykpIHsKICAgIGxldCBtYXNrID0gMDsKICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcG9zaXRpb25zLmxlbmd0aDsgaSsrKSB7CiAgICAgIG1hc2sgfD0gMSA8PCBwb3NpdGlvbnNbaV07CiAgICB9CiAgICByZXR1cm4gbWFzazsKICB9IGVsc2UgaWYgKHR5cGVvZiBwb3NpdGlvbnMgPT09ICJudW1iZXIiKSB7CiAgICByZXR1cm4gcG9zaXRpb25zOwogIH0KICByZXR1cm4gMDsKfQpmdW5jdGlvbiBtYXRjaGVzQml0c0FsbFNldCh2YWx1ZSwgcG9zaXRpb25zKSB7CiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gIm51bWJlciIpIHJldHVybiBmYWxzZTsKICBjb25zdCBtYXNrID0gdG9CaXRNYXNrKHBvc2l0aW9ucyk7CiAgcmV0dXJuICh2YWx1ZSAmIG1hc2spID09PSBtYXNrOwp9CmZ1bmN0aW9uIG1hdGNoZXNCaXRzQWxsQ2xlYXIodmFsdWUsIHBvc2l0aW9ucykgewogIGlmICh0eXBlb2YgdmFsdWUgIT09ICJudW1iZXIiKSByZXR1cm4gZmFsc2U7CiAgY29uc3QgbWFzayA9IHRvQml0TWFzayhwb3NpdGlvbnMpOwogIHJldHVybiAodmFsdWUgJiBtYXNrKSA9PT0gMDsKfQpmdW5jdGlvbiBtYXRjaGVzQml0c0FueVNldCh2YWx1ZSwgcG9zaXRpb25zKSB7CiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gIm51bWJlciIpIHJldHVybiBmYWxzZTsKICBjb25zdCBtYXNrID0gdG9CaXRNYXNrKHBvc2l0aW9ucyk7CiAgcmV0dXJuICh2YWx1ZSAmIG1hc2spICE9PSAwOwp9CmZ1bmN0aW9uIG1hdGNoZXNCaXRzQW55Q2xlYXIodmFsdWUsIHBvc2l0aW9ucykgewogIGlmICh0eXBlb2YgdmFsdWUgIT09ICJudW1iZXIiKSByZXR1cm4gZmFsc2U7CiAgY29uc3QgbWFzayA9IHRvQml0TWFzayhwb3NpdGlvbnMpOwogIHJldHVybiAodmFsdWUgJiBtYXNrKSAhPT0gbWFzazsKfQpmdW5jdGlvbiB2YWxpZGF0ZUpzb25TY2hlbWEoZG9jLCBzY2hlbWEpIHsKICBpZiAoc2NoZW1hLnR5cGUpIHsKICAgIGNvbnN0IGRvY1R5cGUgPSBpc0FycmF5KGRvYykgPyAiYXJyYXkiIDogZG9jID09PSBudWxsID8gIm51bGwiIDogdHlwZW9mIGRvYzsKICAgIGlmIChzY2hlbWEudHlwZSAhPT0gZG9jVHlwZSkgcmV0dXJuIGZhbHNlOwogIH0KICBpZiAoc2NoZW1hLnJlcXVpcmVkICYmIGlzQXJyYXkoc2NoZW1hLnJlcXVpcmVkKSkgewogICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzY2hlbWEucmVxdWlyZWQubGVuZ3RoOyBpKyspIHsKICAgICAgaWYgKCEoc2NoZW1hLnJlcXVpcmVkW2ldIGluIGRvYykpIHJldHVybiBmYWxzZTsKICAgIH0KICB9CiAgaWYgKHNjaGVtYS5wcm9wZXJ0aWVzKSB7CiAgICBmb3IgKGNvbnN0IGtleSBpbiBzY2hlbWEucHJvcGVydGllcykgewogICAgICBpZiAoIShrZXkgaW4gZG9jKSkgcmV0dXJuIGZhbHNlOwogICAgICBjb25zdCBwcm9wU2NoZW1hID0gc2NoZW1hLnByb3BlcnRpZXNba2V5XTsKICAgICAgaWYgKCF2YWxpZGF0ZUpzb25TY2hlbWEoZG9jW2tleV0sIHByb3BTY2hlbWEpKSByZXR1cm4gZmFsc2U7CiAgICB9CiAgfQogIGlmIChzY2hlbWEubWluaW11bSAhPT0gdm9pZCAwICYmIHR5cGVvZiBkb2MgPT09ICJudW1iZXIiKSB7CiAgICBpZiAoZG9jIDwgc2NoZW1hLm1pbmltdW0pIHJldHVybiBmYWxzZTsKICB9CiAgaWYgKHNjaGVtYS5tYXhpbXVtICE9PSB2b2lkIDAgJiYgdHlwZW9mIGRvYyA9PT0gIm51bWJlciIpIHsKICAgIGlmIChkb2MgPiBzY2hlbWEubWF4aW11bSkgcmV0dXJuIGZhbHNlOwogIH0KICBpZiAoc2NoZW1hLm1pbkxlbmd0aCAhPT0gdm9pZCAwICYmIHR5cGVvZiBkb2MgPT09ICJzdHJpbmciKSB7CiAgICBpZiAoZG9jLmxlbmd0aCA8IHNjaGVtYS5taW5MZW5ndGgpIHJldHVybiBmYWxzZTsKICB9CiAgaWYgKHNjaGVtYS5tYXhMZW5ndGggIT09IHZvaWQgMCAmJiB0eXBlb2YgZG9jID09PSAic3RyaW5nIikgewogICAgaWYgKGRvYy5sZW5ndGggPiBzY2hlbWEubWF4TGVuZ3RoKSByZXR1cm4gZmFsc2U7CiAgfQogIGlmIChzY2hlbWEucGF0dGVybiAmJiB0eXBlb2YgZG9jID09PSAic3RyaW5nIikgewogICAgY29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKHNjaGVtYS5wYXR0ZXJuKTsKICAgIGlmICghcmVnZXgudGVzdChkb2MpKSByZXR1cm4gZmFsc2U7CiAgfQogIGlmIChzY2hlbWEuZW51bSAmJiBpc0FycmF5KHNjaGVtYS5lbnVtKSkgewogICAgaWYgKCFzY2hlbWEuZW51bS5pbmNsdWRlcyhkb2MpKSByZXR1cm4gZmFsc2U7CiAgfQogIHJldHVybiB0cnVlOwp9CmZ1bmN0aW9uIHZhbHVlc0VxdWFsKGEsIGIpIHsKICBpZiAoYSBpbnN0YW5jZW9mIE9iamVjdElkICYmIGIgaW5zdGFuY2VvZiBPYmplY3RJZCkgewogICAgcmV0dXJuIGEuZXF1YWxzKGIpOwogIH0KICByZXR1cm4gYSA9PSBiOwp9CmZ1bmN0aW9uIGNvbXBhcmVWYWx1ZXMoYSwgYiwgb3BlcmF0b3IpIHsKICBsZXQgYVZhbCA9IGE7CiAgbGV0IGJWYWwgPSBiOwogIGlmIChhIGluc3RhbmNlb2YgT2JqZWN0SWQpIHsKICAgIGFWYWwgPSBhLnRvU3RyaW5nKCk7CiAgfQogIGlmIChiIGluc3RhbmNlb2YgT2JqZWN0SWQpIHsKICAgIGJWYWwgPSBiLnRvU3RyaW5nKCk7CiAgfQogIHN3aXRjaCAob3BlcmF0b3IpIHsKICAgIGNhc2UgIj4iOgogICAgICByZXR1cm4gYVZhbCA+IGJWYWw7CiAgICBjYXNlICI+PSI6CiAgICAgIHJldHVybiBhVmFsID49IGJWYWw7CiAgICBjYXNlICI8IjoKICAgICAgcmV0dXJuIGFWYWwgPCBiVmFsOwogICAgY2FzZSAiPD0iOgogICAgICByZXR1cm4gYVZhbCA8PSBiVmFsOwogICAgZGVmYXVsdDoKICAgICAgcmV0dXJuIGZhbHNlOwogIH0KfQpmdW5jdGlvbiBmaWVsZFZhbHVlTWF0Y2hlcyhmaWVsZFZhbHVlLCBjaGVja0ZuKSB7CiAgaWYgKGZpZWxkVmFsdWUgPT09IHZvaWQgMCkgcmV0dXJuIGZhbHNlOwogIGlmIChmaWVsZFZhbHVlID09PSBudWxsKSByZXR1cm4gY2hlY2tGbihmaWVsZFZhbHVlKTsKICBpZiAoaXNBcnJheShmaWVsZFZhbHVlKSkgewogICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmaWVsZFZhbHVlLmxlbmd0aDsgaSsrKSB7CiAgICAgIGlmIChjaGVja0ZuKGZpZWxkVmFsdWVbaV0pKSByZXR1cm4gdHJ1ZTsKICAgIH0KICAgIHJldHVybiBmYWxzZTsKICB9CiAgcmV0dXJuIGNoZWNrRm4oZmllbGRWYWx1ZSk7Cn0KZnVuY3Rpb24gdG9rZW5pemVUZXh0KHRleHQyKSB7CiAgaWYgKHR5cGVvZiB0ZXh0MiAhPT0gInN0cmluZyIpIHJldHVybiBbXTsKICBjb25zdCB3b3JkcyA9IHRva2VuaXplKHRleHQyKTsKICByZXR1cm4gd29yZHMubWFwKCh3KSA9PiBzdGVtbWVyKHcpKTsKfQpmdW5jdGlvbiB0ZXh0KHByb3AsIHF1ZXJ5VGV4dCkgewogIGlmICh0eXBlb2YgcHJvcCAhPT0gInN0cmluZyIpIHJldHVybiBmYWxzZTsKICBjb25zdCBwcm9wVG9rZW5zID0gbmV3IFNldCh0b2tlbml6ZVRleHQocHJvcCkpOwogIGNvbnN0IHF1ZXJ5VG9rZW5zID0gdG9rZW5pemVUZXh0KHF1ZXJ5VGV4dCk7CiAgcmV0dXJuIHF1ZXJ5VG9rZW5zLnNvbWUoKHRlcm0pID0+IHByb3BUb2tlbnMuaGFzKHRlcm0pKTsKfQpmdW5jdGlvbiB0ZXh0U2VhcmNoRG9jdW1lbnQoZG9jLCBzZWFyY2hUZXh0KSB7CiAgaWYgKCFkb2MgfHwgdHlwZW9mIGRvYyAhPT0gIm9iamVjdCIpIHJldHVybiBmYWxzZTsKICBmdW5jdGlvbiBzZWFyY2hPYmplY3Qob2JqKSB7CiAgICBpZiAodHlwZW9mIG9iaiA9PT0gInN0cmluZyIpIHsKICAgICAgcmV0dXJuIHRleHQob2JqLCBzZWFyY2hUZXh0KTsKICAgIH0KICAgIGlmICh0eXBlb2Ygb2JqICE9PSAib2JqZWN0IiB8fCBvYmogPT09IG51bGwpIHsKICAgICAgcmV0dXJuIGZhbHNlOwogICAgfQogICAgaWYgKGlzQXJyYXkob2JqKSkgewogICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9iai5sZW5ndGg7IGkrKykgewogICAgICAgIGlmIChzZWFyY2hPYmplY3Qob2JqW2ldKSkgcmV0dXJuIHRydWU7CiAgICAgIH0KICAgICAgcmV0dXJuIGZhbHNlOwogICAgfQogICAgZm9yIChjb25zdCBrZXkgaW4gb2JqKSB7CiAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkgewogICAgICAgIGlmIChzZWFyY2hPYmplY3Qob2JqW2tleV0pKSByZXR1cm4gdHJ1ZTsKICAgICAgfQogICAgfQogICAgcmV0dXJuIGZhbHNlOwogIH0KICByZXR1cm4gc2VhcmNoT2JqZWN0KGRvYyk7Cn0KZnVuY3Rpb24gZ2VvV2l0aGluKHByb3AsIHF1ZXJ5KSB7CiAgdHJ5IHsKICAgIGlmICghQXJyYXkuaXNBcnJheShxdWVyeSkgfHwgcXVlcnkubGVuZ3RoICE9PSAyKSB7CiAgICAgIHJldHVybiBmYWxzZTsKICAgIH0KICAgIGNvbnN0IG1pbkxvbiA9IHF1ZXJ5WzBdWzBdOwogICAgY29uc3QgbWF4TGF0ID0gcXVlcnlbMF1bMV07CiAgICBjb25zdCBtYXhMb24gPSBxdWVyeVsxXVswXTsKICAgIGNvbnN0IG1pbkxhdCA9IHF1ZXJ5WzFdWzFdOwogICAgcmV0dXJuIGlzR2VvbWV0cnlXaXRoaW5CQm94KHByb3AsIG1pbkxvbiwgbWF4TG9uLCBtaW5MYXQsIG1heExhdCk7CiAgfSBjYXRjaCAoZSkgewogICAgcmV0dXJuIGZhbHNlOwogIH0KfQpmdW5jdGlvbiBpc0dlb21ldHJ5V2l0aGluQkJveChnZW9Kc29uLCBtaW5Mb24sIG1heExvbiwgbWluTGF0LCBtYXhMYXQpIHsKICBpZiAoIWdlb0pzb24pIHJldHVybiBmYWxzZTsKICBpZiAoZ2VvSnNvbi50eXBlID09PSAiRmVhdHVyZUNvbGxlY3Rpb24iICYmIGdlb0pzb24uZmVhdHVyZXMgJiYgZ2VvSnNvbi5mZWF0dXJlcy5sZW5ndGggPiAwKSB7CiAgICBmb3IgKGNvbnN0IGZlYXR1cmUgb2YgZ2VvSnNvbi5mZWF0dXJlcykgewogICAgICBpZiAoZmVhdHVyZS5nZW9tZXRyeSkgewogICAgICAgIGlmICghaXNHZW9tZXRyeVdpdGhpbkJCb3goZmVhdHVyZS5nZW9tZXRyeSwgbWluTG9uLCBtYXhMb24sIG1pbkxhdCwgbWF4TGF0KSkgewogICAgICAgICAgcmV0dXJuIGZhbHNlOwogICAgICAgIH0KICAgICAgfQogICAgfQogICAgcmV0dXJuIHRydWU7CiAgfQogIGlmIChnZW9Kc29uLnR5cGUgPT09ICJGZWF0dXJlIiAmJiBnZW9Kc29uLmdlb21ldHJ5KSB7CiAgICByZXR1cm4gaXNHZW9tZXRyeVdpdGhpbkJCb3goZ2VvSnNvbi5nZW9tZXRyeSwgbWluTG9uLCBtYXhMb24sIG1pbkxhdCwgbWF4TGF0KTsKICB9CiAgaWYgKGdlb0pzb24udHlwZSA9PT0gIlBvaW50IiAmJiBnZW9Kc29uLmNvb3JkaW5hdGVzKSB7CiAgICBjb25zdCBbbG5nLCBsYXRdID0gZ2VvSnNvbi5jb29yZGluYXRlczsKICAgIGlmICh0eXBlb2YgbG5nID09PSAibnVtYmVyIiAmJiB0eXBlb2YgbGF0ID09PSAibnVtYmVyIikgewogICAgICByZXR1cm4gbG5nID49IG1pbkxvbiAmJiBsbmcgPD0gbWF4TG9uICYmIGxhdCA+PSBtaW5MYXQgJiYgbGF0IDw9IG1heExhdDsKICAgIH0KICB9CiAgaWYgKGdlb0pzb24udHlwZSA9PT0gIlBvbHlnb24iICYmIGdlb0pzb24uY29vcmRpbmF0ZXMgJiYgZ2VvSnNvbi5jb29yZGluYXRlcy5sZW5ndGggPiAwKSB7CiAgICBmb3IgKGNvbnN0IHJpbmcgb2YgZ2VvSnNvbi5jb29yZGluYXRlcykgewogICAgICBmb3IgKGNvbnN0IGNvb3JkIG9mIHJpbmcpIHsKICAgICAgICBjb25zdCBsbmcgPSBjb29yZFswXTsKICAgICAgICBjb25zdCBsYXQgPSBjb29yZFsxXTsKICAgICAgICBpZiAobG5nIDwgbWluTG9uIHx8IGxuZyA+IG1heExvbiB8fCBsYXQgPCBtaW5MYXQgfHwgbGF0ID4gbWF4TGF0KSB7CiAgICAgICAgICByZXR1cm4gZmFsc2U7CiAgICAgICAgfQogICAgICB9CiAgICB9CiAgICByZXR1cm4gdHJ1ZTsKICB9CiAgcmV0dXJuIGZhbHNlOwp9CmZ1bmN0aW9uIGV4dHJhY3RDb29yZGluYXRlc0Zyb21HZW9KU09OKGdlb0pzb24pIHsKICBpZiAoIWdlb0pzb24pIHJldHVybiBudWxsOwogIGlmIChnZW9Kc29uLnR5cGUgPT09ICJGZWF0dXJlQ29sbGVjdGlvbiIgJiYgZ2VvSnNvbi5mZWF0dXJlcyAmJiBnZW9Kc29uLmZlYXR1cmVzLmxlbmd0aCA+IDApIHsKICAgIGNvbnN0IGZlYXR1cmUgPSBnZW9Kc29uLmZlYXR1cmVzWzBdOwogICAgaWYgKGZlYXR1cmUuZ2VvbWV0cnkpIHsKICAgICAgcmV0dXJuIGV4dHJhY3RDb29yZGluYXRlc0Zyb21HZW9KU09OKGZlYXR1cmUuZ2VvbWV0cnkpOwogICAgfQogIH0KICBpZiAoZ2VvSnNvbi50eXBlID09PSAiRmVhdHVyZSIgJiYgZ2VvSnNvbi5nZW9tZXRyeSkgewogICAgcmV0dXJuIGV4dHJhY3RDb29yZGluYXRlc0Zyb21HZW9KU09OKGdlb0pzb24uZ2VvbWV0cnkpOwogIH0KICBpZiAoZ2VvSnNvbi50eXBlID09PSAiUG9pbnQiICYmIGdlb0pzb24uY29vcmRpbmF0ZXMpIHsKICAgIGNvbnN0IFtsbmcsIGxhdF0gPSBnZW9Kc29uLmNvb3JkaW5hdGVzOwogICAgaWYgKHR5cGVvZiBsbmcgPT09ICJudW1iZXIiICYmIHR5cGVvZiBsYXQgPT09ICJudW1iZXIiKSB7CiAgICAgIHJldHVybiB7IGxhdCwgbG5nIH07CiAgICB9CiAgfQogIGlmIChnZW9Kc29uLnR5cGUgPT09ICJQb2x5Z29uIiAmJiBnZW9Kc29uLmNvb3JkaW5hdGVzICYmIGdlb0pzb24uY29vcmRpbmF0ZXMubGVuZ3RoID4gMCkgewogICAgY29uc3QgcmluZyA9IGdlb0pzb24uY29vcmRpbmF0ZXNbMF07CiAgICBpZiAocmluZy5sZW5ndGggPiAwKSB7CiAgICAgIGxldCBzdW1MYXQgPSAwLCBzdW1MbmcgPSAwOwogICAgICBmb3IgKGNvbnN0IGNvb3JkIG9mIHJpbmcpIHsKICAgICAgICBzdW1MbmcgKz0gY29vcmRbMF07CiAgICAgICAgc3VtTGF0ICs9IGNvb3JkWzFdOwogICAgICB9CiAgICAgIHJldHVybiB7CiAgICAgICAgbGF0OiBzdW1MYXQgLyByaW5nLmxlbmd0aCwKICAgICAgICBsbmc6IHN1bUxuZyAvIHJpbmcubGVuZ3RoCiAgICAgIH07CiAgICB9CiAgfQogIHJldHVybiBudWxsOwp9CmZ1bmN0aW9uIGhhdmVyc2luZURpc3RhbmNlJDEobGF0MSwgbG5nMSwgbGF0MiwgbG5nMikgewogIGNvbnN0IFIgPSA2MzcxOwogIGNvbnN0IGRMYXQgPSAobGF0MiAtIGxhdDEpICogTWF0aC5QSSAvIDE4MDsKICBjb25zdCBkTG5nID0gKGxuZzIgLSBsbmcxKSAqIE1hdGguUEkgLyAxODA7CiAgY29uc3QgYSA9IE1hdGguc2luKGRMYXQgLyAyKSAqIE1hdGguc2luKGRMYXQgLyAyKSArIE1hdGguY29zKGxhdDEgKiBNYXRoLlBJIC8gMTgwKSAqIE1hdGguY29zKGxhdDIgKiBNYXRoLlBJIC8gMTgwKSAqIE1hdGguc2luKGRMbmcgLyAyKSAqIE1hdGguc2luKGRMbmcgLyAyKTsKICBjb25zdCBjID0gMiAqIE1hdGguYXRhbjIoTWF0aC5zcXJ0KGEpLCBNYXRoLnNxcnQoMSAtIGEpKTsKICByZXR1cm4gUiAqIGM7Cn0KZnVuY3Rpb24gaXNOZWFyKGdlb0pzb24sIHJlZkxuZywgcmVmTGF0LCBtYXhEaXN0YW5jZU1ldGVycykgewogIGNvbnN0IGNvb3JkcyA9IGV4dHJhY3RDb29yZGluYXRlc0Zyb21HZW9KU09OKGdlb0pzb24pOwogIGlmICghY29vcmRzKSByZXR1cm4gZmFsc2U7CiAgY29uc3QgZGlzdGFuY2VLbSA9IGhhdmVyc2luZURpc3RhbmNlJDEoY29vcmRzLmxhdCwgY29vcmRzLmxuZywgcmVmTGF0LCByZWZMbmcpOwogIGNvbnN0IGRpc3RhbmNlTSA9IGRpc3RhbmNlS20gKiAxZTM7CiAgcmV0dXJuIGRpc3RhbmNlTSA8PSBtYXhEaXN0YW5jZU1ldGVyczsKfQpmdW5jdGlvbiBnZW9JbnRlcnNlY3RzKGdlb0pzb24sIHF1ZXJ5R2VvKSB7CiAgaWYgKCFnZW9Kc29uIHx8ICFxdWVyeUdlbykgcmV0dXJuIGZhbHNlOwogIGNvbnN0IHF1ZXJ5Q29vcmRzID0gZXh0cmFjdENvb3JkaW5hdGVzRnJvbUdlb0pTT04ocXVlcnlHZW8pOwogIGlmICghcXVlcnlDb29yZHMpIHJldHVybiBmYWxzZTsKICBjb25zdCBkb2NDb29yZHMgPSBleHRyYWN0Q29vcmRpbmF0ZXNGcm9tR2VvSlNPTihnZW9Kc29uKTsKICBpZiAoIWRvY0Nvb3JkcykgcmV0dXJuIGZhbHNlOwogIGlmIChxdWVyeUdlby50eXBlID09PSAiUG9seWdvbiIgJiYgZ2VvSnNvbi50eXBlID09PSAiUG9pbnQiKSB7CiAgICByZXR1cm4gcG9pbnRJblBvbHlnb24oZG9jQ29vcmRzLmxuZywgZG9jQ29vcmRzLmxhdCwgcXVlcnlHZW8uY29vcmRpbmF0ZXNbMF0pOwogIH0KICBpZiAoZ2VvSnNvbi50eXBlID09PSAiUG9seWdvbiIgJiYgcXVlcnlHZW8udHlwZSA9PT0gIlBvaW50IikgewogICAgY29uc3QgcXVlcnlQdCA9IHF1ZXJ5R2VvLmNvb3JkaW5hdGVzOwogICAgcmV0dXJuIHBvaW50SW5Qb2x5Z29uKHF1ZXJ5UHRbMF0sIHF1ZXJ5UHRbMV0sIGdlb0pzb24uY29vcmRpbmF0ZXNbMF0pOwogIH0KICBpZiAoZ2VvSnNvbi50eXBlID09PSAiUG9pbnQiICYmIHF1ZXJ5R2VvLnR5cGUgPT09ICJQb2ludCIpIHsKICAgIGNvbnN0IGRpc3QgPSBoYXZlcnNpbmVEaXN0YW5jZSQxKGRvY0Nvb3Jkcy5sYXQsIGRvY0Nvb3Jkcy5sbmcsIHF1ZXJ5Q29vcmRzLmxhdCwgcXVlcnlDb29yZHMubG5nKTsKICAgIHJldHVybiBkaXN0IDwgMWUtMzsKICB9CiAgcmV0dXJuIGZhbHNlOwp9CmZ1bmN0aW9uIHBvaW50SW5Qb2x5Z29uKGxuZywgbGF0LCByaW5nKSB7CiAgbGV0IGluc2lkZSA9IGZhbHNlOwogIGZvciAobGV0IGkgPSAwLCBqID0gcmluZy5sZW5ndGggLSAxOyBpIDwgcmluZy5sZW5ndGg7IGogPSBpKyspIHsKICAgIGNvbnN0IHhpID0gcmluZ1tpXVswXSwgeWkgPSByaW5nW2ldWzFdOwogICAgY29uc3QgeGogPSByaW5nW2pdWzBdLCB5aiA9IHJpbmdbal1bMV07CiAgICBjb25zdCBpbnRlcnNlY3QgPSB5aSA+IGxhdCAhPT0geWogPiBsYXQgJiYgbG5nIDwgKHhqIC0geGkpICogKGxhdCAtIHlpKSAvICh5aiAtIHlpKSArIHhpOwogICAgaWYgKGludGVyc2VjdCkgaW5zaWRlID0gIWluc2lkZTsKICB9CiAgcmV0dXJuIGluc2lkZTsKfQpmdW5jdGlvbiB3aGVyZShkb2MsIHZhbHVlKSB7CiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gImZ1bmN0aW9uIikgewogICAgdHJ5IHsKICAgICAgcmV0dXJuIHZhbHVlLmNhbGwoZG9jKTsKICAgIH0gY2F0Y2ggKGUpIHsKICAgICAgcmV0dXJuIGZhbHNlOwogICAgfQogIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAic3RyaW5nIikgewogICAgdHJ5IHsKICAgICAgdmFyIGZuID0gbmV3IEZ1bmN0aW9uKCJyZXR1cm4gIiArIHZhbHVlKTsKICAgICAgcmV0dXJuIGZuLmNhbGwoZG9jKTsKICAgIH0gY2F0Y2ggKGUpIHsKICAgICAgcmV0dXJuIGZhbHNlOwogICAgfQogIH0KICByZXR1cm4gZmFsc2U7Cn0KZnVuY3Rpb24gdGxNYXRjaGVzKGRvYywgcXVlcnkpIHsKICB2YXIga2V5ID0gT2JqZWN0LmtleXMocXVlcnkpWzBdOwogIHZhciB2YWx1ZSA9IHF1ZXJ5W2tleV07CiAgaWYgKGtleS5jaGFyQXQoMCkgPT0gIiQiKSB7CiAgICBpZiAoa2V5ID09ICIkYW5kIikgcmV0dXJuIGFuZChkb2MsIHZhbHVlKTsKICAgIGVsc2UgaWYgKGtleSA9PSAiJG9yIikgcmV0dXJuIG9yKGRvYywgdmFsdWUpOwogICAgZWxzZSBpZiAoa2V5ID09ICIkbm90IikgcmV0dXJuIG5vdChkb2MsIHZhbHVlKTsKICAgIGVsc2UgaWYgKGtleSA9PSAiJG5vciIpIHJldHVybiBub3IoZG9jLCB2YWx1ZSk7CiAgICBlbHNlIGlmIChrZXkgPT0gIiR3aGVyZSIpIHJldHVybiB3aGVyZShkb2MsIHZhbHVlKTsKICAgIGVsc2UgaWYgKGtleSA9PSAiJGNvbW1lbnQiKSByZXR1cm4gdHJ1ZTsKICAgIGVsc2UgaWYgKGtleSA9PSAiJGpzb25TY2hlbWEiKSByZXR1cm4gdmFsaWRhdGVKc29uU2NoZW1hKGRvYywgdmFsdWUpOwogICAgZWxzZSBpZiAoa2V5ID09ICIkdGV4dCIpIHsKICAgICAgY29uc3Qgc2VhcmNoVGV4dCA9IHZhbHVlLiRzZWFyY2ggfHwgdmFsdWU7CiAgICAgIHJldHVybiB0ZXh0U2VhcmNoRG9jdW1lbnQoZG9jLCBzZWFyY2hUZXh0KTsKICAgIH0gZWxzZSBpZiAoa2V5ID09ICIkZXhwciIpIHsKICAgICAgdHJ5IHsKICAgICAgICByZXR1cm4gZXZhbHVhdGVFeHByZXNzaW9uKHZhbHVlLCBkb2MpOwogICAgICB9IGNhdGNoIChlKSB7CiAgICAgICAgcmV0dXJuIGZhbHNlOwogICAgICB9CiAgICB9IGVsc2UgdGhyb3cgeyAkZXJyOiAiQ2FuJ3QgY2Fub25pY2FsaXplIHF1ZXJ5OiBCYWRWYWx1ZSB1bmtub3duIHRvcCBsZXZlbCBvcGVyYXRvcjogIiArIGtleSwgY29kZTogMTcyODcgfTsKICB9IGVsc2UgewogICAgcmV0dXJuIG9wTWF0Y2hlcyhkb2MsIGtleSwgdmFsdWUpOwogIH0KfQpmdW5jdGlvbiBvcE1hdGNoZXMoZG9jLCBrZXksIHZhbHVlKSB7CiAgdmFyIGZpZWxkVmFsdWUgPSBnZXRGaWVsZFZhbHVlcyhkb2MsIGtleSk7CiAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAic3RyaW5nIikgcmV0dXJuIGZpZWxkVmFsdWVNYXRjaGVzKGZpZWxkVmFsdWUsIGZ1bmN0aW9uKHYpIHsKICAgIHJldHVybiB2YWx1ZXNFcXVhbCh2LCB2YWx1ZSk7CiAgfSk7CiAgZWxzZSBpZiAodHlwZW9mIHZhbHVlID09ICJudW1iZXIiKSByZXR1cm4gZmllbGRWYWx1ZU1hdGNoZXMoZmllbGRWYWx1ZSwgZnVuY3Rpb24odikgewogICAgcmV0dXJuIHZhbHVlc0VxdWFsKHYsIHZhbHVlKTsKICB9KTsKICBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT0gImJvb2xlYW4iKSByZXR1cm4gZmllbGRWYWx1ZU1hdGNoZXMoZmllbGRWYWx1ZSwgZnVuY3Rpb24odikgewogICAgcmV0dXJuIHZhbHVlc0VxdWFsKHYsIHZhbHVlKTsKICB9KTsKICBlbHNlIGlmICh2YWx1ZSBpbnN0YW5jZW9mIE9iamVjdElkKSByZXR1cm4gZmllbGRWYWx1ZU1hdGNoZXMoZmllbGRWYWx1ZSwgZnVuY3Rpb24odikgewogICAgcmV0dXJuIHZhbHVlc0VxdWFsKHYsIHZhbHVlKTsKICB9KTsKICBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT0gIm9iamVjdCIpIHsKICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFJlZ0V4cCkgcmV0dXJuIGZpZWxkVmFsdWUgIT0gdm9pZCAwICYmIGZpZWxkVmFsdWVNYXRjaGVzKGZpZWxkVmFsdWUsIGZ1bmN0aW9uKHYpIHsKICAgICAgcmV0dXJuIHYgJiYgdi5tYXRjaCh2YWx1ZSk7CiAgICB9KTsKICAgIGVsc2UgaWYgKGlzQXJyYXkodmFsdWUpKSByZXR1cm4gZmllbGRWYWx1ZSAhPSB2b2lkIDAgJiYgZmllbGRWYWx1ZU1hdGNoZXMoZmllbGRWYWx1ZSwgZnVuY3Rpb24odikgewogICAgICByZXR1cm4gdiAmJiBhcnJheU1hdGNoZXModiwgdmFsdWUpOwogICAgfSk7CiAgICBlbHNlIHsKICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7CiAgICAgIGlmIChrZXlzWzBdLmNoYXJBdCgwKSA9PSAiJCIpIHsKICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHsKICAgICAgICAgIHZhciBvcGVyYXRvciA9IE9iamVjdC5rZXlzKHZhbHVlKVtpXTsKICAgICAgICAgIHZhciBvcGVyYW5kID0gdmFsdWVbb3BlcmF0b3JdOwogICAgICAgICAgaWYgKG9wZXJhdG9yID09ICIkZXEiKSB7CiAgICAgICAgICAgIGlmICghZmllbGRWYWx1ZU1hdGNoZXMoZmllbGRWYWx1ZSwgZnVuY3Rpb24odikgewogICAgICAgICAgICAgIHJldHVybiB2YWx1ZXNFcXVhbCh2LCBvcGVyYW5kKTsKICAgICAgICAgICAgfSkpIHJldHVybiBmYWxzZTsKICAgICAgICAgIH0gZWxzZSBpZiAob3BlcmF0b3IgPT0gIiRndCIpIHsKICAgICAgICAgICAgaWYgKCFmaWVsZFZhbHVlTWF0Y2hlcyhmaWVsZFZhbHVlLCBmdW5jdGlvbih2KSB7CiAgICAgICAgICAgICAgcmV0dXJuIGNvbXBhcmVWYWx1ZXModiwgb3BlcmFuZCwgIj4iKTsKICAgICAgICAgICAgfSkpIHJldHVybiBmYWxzZTsKICAgICAgICAgIH0gZWxzZSBpZiAob3BlcmF0b3IgPT0gIiRndGUiKSB7CiAgICAgICAgICAgIGlmICghZmllbGRWYWx1ZU1hdGNoZXMoZmllbGRWYWx1ZSwgZnVuY3Rpb24odikgewogICAgICAgICAgICAgIHJldHVybiBjb21wYXJlVmFsdWVzKHYsIG9wZXJhbmQsICI+PSIpOwogICAgICAgICAgICB9KSkgcmV0dXJuIGZhbHNlOwogICAgICAgICAgfSBlbHNlIGlmIChvcGVyYXRvciA9PSAiJGx0IikgewogICAgICAgICAgICBpZiAoIWZpZWxkVmFsdWVNYXRjaGVzKGZpZWxkVmFsdWUsIGZ1bmN0aW9uKHYpIHsKICAgICAgICAgICAgICByZXR1cm4gY29tcGFyZVZhbHVlcyh2LCBvcGVyYW5kLCAiPCIpOwogICAgICAgICAgICB9KSkgcmV0dXJuIGZhbHNlOwogICAgICAgICAgfSBlbHNlIGlmIChvcGVyYXRvciA9PSAiJGx0ZSIpIHsKICAgICAgICAgICAgaWYgKCFmaWVsZFZhbHVlTWF0Y2hlcyhmaWVsZFZhbHVlLCBmdW5jdGlvbih2KSB7CiAgICAgICAgICAgICAgcmV0dXJuIGNvbXBhcmVWYWx1ZXModiwgb3BlcmFuZCwgIjw9Iik7CiAgICAgICAgICAgIH0pKSByZXR1cm4gZmFsc2U7CiAgICAgICAgICB9IGVsc2UgaWYgKG9wZXJhdG9yID09ICIkbmUiKSB7CiAgICAgICAgICAgIGlmICghZmllbGRWYWx1ZU1hdGNoZXMoZmllbGRWYWx1ZSwgZnVuY3Rpb24odikgewogICAgICAgICAgICAgIHJldHVybiAhdmFsdWVzRXF1YWwodiwgb3BlcmFuZCk7CiAgICAgICAgICAgIH0pKSByZXR1cm4gZmFsc2U7CiAgICAgICAgICB9IGVsc2UgaWYgKG9wZXJhdG9yID09ICIkaW4iKSB7CiAgICAgICAgICAgIGlmICghZmllbGRWYWx1ZU1hdGNoZXMoZmllbGRWYWx1ZSwgZnVuY3Rpb24odikgewogICAgICAgICAgICAgIHJldHVybiBpc0luKHYsIG9wZXJhbmQpOwogICAgICAgICAgICB9KSkgcmV0dXJuIGZhbHNlOwogICAgICAgICAgfSBlbHNlIGlmIChvcGVyYXRvciA9PSAiJG5pbiIpIHsKICAgICAgICAgICAgaWYgKGZpZWxkVmFsdWVNYXRjaGVzKGZpZWxkVmFsdWUsIGZ1bmN0aW9uKHYpIHsKICAgICAgICAgICAgICByZXR1cm4gaXNJbih2LCBvcGVyYW5kKTsKICAgICAgICAgICAgfSkpIHJldHVybiBmYWxzZTsKICAgICAgICAgIH0gZWxzZSBpZiAob3BlcmF0b3IgPT0gIiRleGlzdHMiKSB7CiAgICAgICAgICAgIHZhciByYXdWYWx1ZSA9IGdldFByb3AoZG9jLCBrZXkpOwogICAgICAgICAgICBpZiAob3BlcmFuZCA/IHJhd1ZhbHVlID09IHZvaWQgMCA6IHJhd1ZhbHVlICE9IHZvaWQgMCkgcmV0dXJuIGZhbHNlOwogICAgICAgICAgfSBlbHNlIGlmIChvcGVyYXRvciA9PSAiJHR5cGUiKSB7CiAgICAgICAgICAgIGlmIChmaWVsZFZhbHVlID09PSB2b2lkIDApIHsKICAgICAgICAgICAgICBjb25zdCBleHBlY3RlZFR5cGVDb2RlID0gdHlwZW9mIG9wZXJhbmQgPT09ICJudW1iZXIiID8gb3BlcmFuZCA6IFRZUEVfQUxJQVNFU1tvcGVyYW5kXTsKICAgICAgICAgICAgICBpZiAoZXhwZWN0ZWRUeXBlQ29kZSAhPT0gNikgcmV0dXJuIGZhbHNlOwogICAgICAgICAgICB9IGVsc2UgewogICAgICAgICAgICAgIGlmICghbWF0Y2hlc1R5cGUoZmllbGRWYWx1ZSwgb3BlcmFuZCkpIHJldHVybiBmYWxzZTsKICAgICAgICAgICAgfQogICAgICAgICAgfSBlbHNlIGlmIChvcGVyYXRvciA9PSAiJG1vZCIpIHsKICAgICAgICAgICAgaWYgKG9wZXJhbmQubGVuZ3RoICE9IDIpIHRocm93IHsgJGVycjogIkNhbid0IGNhbm9uaWNhbGl6ZSBxdWVyeTogQmFkVmFsdWUgbWFsZm9ybWVkIG1vZCwgbm90IGVub3VnaCBlbGVtZW50cyIsIGNvZGU6IDE3Mjg3IH07CiAgICAgICAgICAgIGlmICghZmllbGRWYWx1ZU1hdGNoZXMoZmllbGRWYWx1ZSwgZnVuY3Rpb24odikgewogICAgICAgICAgICAgIHJldHVybiB2ICE9IHZvaWQgMCAmJiB2ICUgb3BlcmFuZFswXSA9PSBvcGVyYW5kWzFdOwogICAgICAgICAgICB9KSkgcmV0dXJuIGZhbHNlOwogICAgICAgICAgfSBlbHNlIGlmIChvcGVyYXRvciA9PSAiJHJlZ2V4IikgewogICAgICAgICAgICB2YXIgcGF0dGVybiA9IG9wZXJhbmQ7CiAgICAgICAgICAgIHZhciBmbGFncyA9IHZhbHVlLiRvcHRpb25zIHx8ICIiOwogICAgICAgICAgICB2YXIgcmVnZXggPSB0eXBlb2YgcGF0dGVybiA9PT0gInN0cmluZyIgPyBuZXcgUmVnRXhwKHBhdHRlcm4sIGZsYWdzKSA6IHBhdHRlcm47CiAgICAgICAgICAgIGlmICghZmllbGRWYWx1ZU1hdGNoZXMoZmllbGRWYWx1ZSwgZnVuY3Rpb24odikgewogICAgICAgICAgICAgIHJldHVybiB2ICE9IHZvaWQgMCAmJiByZWdleC50ZXN0KHYpOwogICAgICAgICAgICB9KSkgcmV0dXJuIGZhbHNlOwogICAgICAgICAgfSBlbHNlIGlmIChvcGVyYXRvciA9PSAiJG9wdGlvbnMiKSB7CiAgICAgICAgICAgIGNvbnRpbnVlOwogICAgICAgICAgfSBlbHNlIGlmIChvcGVyYXRvciA9PSAiJHRleHQiKSB7CiAgICAgICAgICAgIGlmICghZmllbGRWYWx1ZU1hdGNoZXMoZmllbGRWYWx1ZSwgZnVuY3Rpb24odikgewogICAgICAgICAgICAgIHJldHVybiB2ICE9IHZvaWQgMCAmJiB0ZXh0KHYsIG9wZXJhbmQpOwogICAgICAgICAgICB9KSkgcmV0dXJuIGZhbHNlOwogICAgICAgICAgfSBlbHNlIGlmIChvcGVyYXRvciA9PSAiJGV4cHIiKSB7CiAgICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gZXZhbHVhdGVFeHByZXNzaW9uKG9wZXJhbmQsIGRvYyk7CiAgICAgICAgICAgICAgaWYgKCFyZXN1bHQpIHJldHVybiBmYWxzZTsKICAgICAgICAgICAgfSBjYXRjaCAoZSkgewogICAgICAgICAgICAgIHJldHVybiBmYWxzZTsKICAgICAgICAgICAgfQogICAgICAgICAgfSBlbHNlIGlmIChvcGVyYXRvciA9PSAiJGdlb1dpdGhpbiIpIHsKICAgICAgICAgICAgaWYgKCFmaWVsZFZhbHVlTWF0Y2hlcyhmaWVsZFZhbHVlLCBmdW5jdGlvbih2KSB7CiAgICAgICAgICAgICAgcmV0dXJuIHYgIT0gdm9pZCAwICYmIGdlb1dpdGhpbih2LCBvcGVyYW5kKTsKICAgICAgICAgICAgfSkpIHJldHVybiBmYWxzZTsKICAgICAgICAgIH0gZWxzZSBpZiAob3BlcmF0b3IgPT0gIiRuZWFyIiB8fCBvcGVyYXRvciA9PSAiJG5lYXJTcGhlcmUiKSB7CiAgICAgICAgICAgIGxldCBjb29yZGluYXRlczsKICAgICAgICAgICAgaWYgKG9wZXJhbmQuJGdlb21ldHJ5KSB7CiAgICAgICAgICAgICAgY29vcmRpbmF0ZXMgPSBvcGVyYW5kLiRnZW9tZXRyeS5jb29yZGluYXRlczsKICAgICAgICAgICAgfSBlbHNlIGlmIChvcGVyYW5kLmNvb3JkaW5hdGVzKSB7CiAgICAgICAgICAgICAgY29vcmRpbmF0ZXMgPSBvcGVyYW5kLmNvb3JkaW5hdGVzOwogICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob3BlcmFuZCkpIHsKICAgICAgICAgICAgICBjb29yZGluYXRlcyA9IG9wZXJhbmQ7CiAgICAgICAgICAgIH0KICAgICAgICAgICAgaWYgKGNvb3JkaW5hdGVzICYmIGNvb3JkaW5hdGVzLmxlbmd0aCA+PSAyKSB7CiAgICAgICAgICAgICAgY29uc3QgW2xuZywgbGF0XSA9IGNvb3JkaW5hdGVzOwogICAgICAgICAgICAgIGNvbnN0IG1heERpc3RhbmNlTWV0ZXJzID0gb3BlcmFuZC4kbWF4RGlzdGFuY2UgfHwgMWU2OwogICAgICAgICAgICAgIGlmICghZmllbGRWYWx1ZU1hdGNoZXMoZmllbGRWYWx1ZSwgZnVuY3Rpb24odikgewogICAgICAgICAgICAgICAgcmV0dXJuIHYgIT0gdm9pZCAwICYmIGlzTmVhcih2LCBsbmcsIGxhdCwgbWF4RGlzdGFuY2VNZXRlcnMpOwogICAgICAgICAgICAgIH0pKSByZXR1cm4gZmFsc2U7CiAgICAgICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlOwogICAgICAgICAgICB9CiAgICAgICAgICB9IGVsc2UgaWYgKG9wZXJhdG9yID09ICIkZ2VvSW50ZXJzZWN0cyIpIHsKICAgICAgICAgICAgY29uc3QgZ2VvbWV0cnkgPSBvcGVyYW5kLiRnZW9tZXRyeSB8fCBvcGVyYW5kOwogICAgICAgICAgICBpZiAoIWZpZWxkVmFsdWVNYXRjaGVzKGZpZWxkVmFsdWUsIGZ1bmN0aW9uKHYpIHsKICAgICAgICAgICAgICByZXR1cm4gdiAhPSB2b2lkIDAgJiYgZ2VvSW50ZXJzZWN0cyh2LCBnZW9tZXRyeSk7CiAgICAgICAgICAgIH0pKSByZXR1cm4gZmFsc2U7CiAgICAgICAgICB9IGVsc2UgaWYgKG9wZXJhdG9yID09ICIkbm90IikgewogICAgICAgICAgICBpZiAob3BNYXRjaGVzKGRvYywga2V5LCBvcGVyYW5kKSkgcmV0dXJuIGZhbHNlOwogICAgICAgICAgfSBlbHNlIGlmIChvcGVyYXRvciA9PSAiJGFsbCIpIHsKICAgICAgICAgICAgdmFyIGFycmF5RmllbGRWYWx1ZSA9IGdldFByb3AoZG9jLCBrZXkpOwogICAgICAgICAgICBpZiAoYXJyYXlGaWVsZFZhbHVlID09IHZvaWQgMCB8fCAhaXNBcnJheShhcnJheUZpZWxkVmFsdWUpKSByZXR1cm4gZmFsc2U7CiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgb3BlcmFuZC5sZW5ndGg7IGorKykgewogICAgICAgICAgICAgIGlmICghaXNJbihvcGVyYW5kW2pdLCBhcnJheUZpZWxkVmFsdWUpKSByZXR1cm4gZmFsc2U7CiAgICAgICAgICAgIH0KICAgICAgICAgIH0gZWxzZSBpZiAob3BlcmF0b3IgPT0gIiRlbGVtTWF0Y2giKSB7CiAgICAgICAgICAgIHZhciBhcnJheUZpZWxkVmFsdWUgPSBnZXRQcm9wKGRvYywga2V5KTsKICAgICAgICAgICAgaWYgKGFycmF5RmllbGRWYWx1ZSA9PSB2b2lkIDAgfHwgIWlzQXJyYXkoYXJyYXlGaWVsZFZhbHVlKSkgcmV0dXJuIGZhbHNlOwogICAgICAgICAgICB2YXIgZm91bmQgPSBmYWxzZTsKICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBhcnJheUZpZWxkVmFsdWUubGVuZ3RoOyBqKyspIHsKICAgICAgICAgICAgICB2YXIgZWxlbWVudCA9IGFycmF5RmllbGRWYWx1ZVtqXTsKICAgICAgICAgICAgICBpZiAodHlwZW9mIGVsZW1lbnQgPT09ICJvYmplY3QiICYmICFpc0FycmF5KGVsZW1lbnQpKSB7CiAgICAgICAgICAgICAgICBpZiAobWF0Y2hlcyhlbGVtZW50LCBvcGVyYW5kKSkgewogICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7CiAgICAgICAgICAgICAgICAgIGJyZWFrOwogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgICAgICB2YXIgbWF0Y2hlc1ByaW1pdGl2ZSA9IHRydWU7CiAgICAgICAgICAgICAgICB2YXIgb3BLZXlzID0gT2JqZWN0LmtleXMob3BlcmFuZCk7CiAgICAgICAgICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IG9wS2V5cy5sZW5ndGg7IGsrKykgewogICAgICAgICAgICAgICAgICB2YXIgb3AgPSBvcEtleXNba107CiAgICAgICAgICAgICAgICAgIHZhciBvcFZhbHVlID0gb3BlcmFuZFtvcF07CiAgICAgICAgICAgICAgICAgIGlmIChvcCA9PSAiJGd0ZSIgJiYgIShlbGVtZW50ID49IG9wVmFsdWUpKSBtYXRjaGVzUHJpbWl0aXZlID0gZmFsc2U7CiAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9wID09ICIkZ3QiICYmICEoZWxlbWVudCA+IG9wVmFsdWUpKSBtYXRjaGVzUHJpbWl0aXZlID0gZmFsc2U7CiAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9wID09ICIkbHRlIiAmJiAhKGVsZW1lbnQgPD0gb3BWYWx1ZSkpIG1hdGNoZXNQcmltaXRpdmUgPSBmYWxzZTsKICAgICAgICAgICAgICAgICAgZWxzZSBpZiAob3AgPT0gIiRsdCIgJiYgIShlbGVtZW50IDwgb3BWYWx1ZSkpIG1hdGNoZXNQcmltaXRpdmUgPSBmYWxzZTsKICAgICAgICAgICAgICAgICAgZWxzZSBpZiAob3AgPT0gIiRlcSIgJiYgIShlbGVtZW50ID09IG9wVmFsdWUpKSBtYXRjaGVzUHJpbWl0aXZlID0gZmFsc2U7CiAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9wID09ICIkbmUiICYmICEoZWxlbWVudCAhPSBvcFZhbHVlKSkgbWF0Y2hlc1ByaW1pdGl2ZSA9IGZhbHNlOwogICAgICAgICAgICAgICAgICBlbHNlIGlmIChvcCA9PSAiJGluIiAmJiAhaXNJbihlbGVtZW50LCBvcFZhbHVlKSkgbWF0Y2hlc1ByaW1pdGl2ZSA9IGZhbHNlOwogICAgICAgICAgICAgICAgICBlbHNlIGlmIChvcCA9PSAiJG5pbiIgJiYgaXNJbihlbGVtZW50LCBvcFZhbHVlKSkgbWF0Y2hlc1ByaW1pdGl2ZSA9IGZhbHNlOwogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgaWYgKG1hdGNoZXNQcmltaXRpdmUpIHsKICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlOwogICAgICAgICAgICAgICAgICBicmVhazsKICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0KICAgICAgICAgICAgaWYgKCFmb3VuZCkgcmV0dXJuIGZhbHNlOwogICAgICAgICAgfSBlbHNlIGlmIChvcGVyYXRvciA9PSAiJHNpemUiKSB7CiAgICAgICAgICAgIHZhciBzaXplRmllbGRWYWx1ZSA9IGdldFByb3AoZG9jLCBrZXkpOwogICAgICAgICAgICBpZiAoc2l6ZUZpZWxkVmFsdWUgPT0gdm9pZCAwIHx8ICFpc0FycmF5KHNpemVGaWVsZFZhbHVlKSkgcmV0dXJuIGZhbHNlOwogICAgICAgICAgICBpZiAoc2l6ZUZpZWxkVmFsdWUubGVuZ3RoICE9IG9wZXJhbmQpIHJldHVybiBmYWxzZTsKICAgICAgICAgIH0gZWxzZSBpZiAob3BlcmF0b3IgPT0gIiRiaXRzQWxsU2V0IikgewogICAgICAgICAgICBpZiAoIWZpZWxkVmFsdWVNYXRjaGVzKGZpZWxkVmFsdWUsIGZ1bmN0aW9uKHYpIHsKICAgICAgICAgICAgICByZXR1cm4gbWF0Y2hlc0JpdHNBbGxTZXQodiwgb3BlcmFuZCk7CiAgICAgICAgICAgIH0pKSByZXR1cm4gZmFsc2U7CiAgICAgICAgICB9IGVsc2UgaWYgKG9wZXJhdG9yID09ICIkYml0c0FsbENsZWFyIikgewogICAgICAgICAgICBpZiAoIWZpZWxkVmFsdWVNYXRjaGVzKGZpZWxkVmFsdWUsIGZ1bmN0aW9uKHYpIHsKICAgICAgICAgICAgICByZXR1cm4gbWF0Y2hlc0JpdHNBbGxDbGVhcih2LCBvcGVyYW5kKTsKICAgICAgICAgICAgfSkpIHJldHVybiBmYWxzZTsKICAgICAgICAgIH0gZWxzZSBpZiAob3BlcmF0b3IgPT0gIiRiaXRzQW55U2V0IikgewogICAgICAgICAgICBpZiAoIWZpZWxkVmFsdWVNYXRjaGVzKGZpZWxkVmFsdWUsIGZ1bmN0aW9uKHYpIHsKICAgICAgICAgICAgICByZXR1cm4gbWF0Y2hlc0JpdHNBbnlTZXQodiwgb3BlcmFuZCk7CiAgICAgICAgICAgIH0pKSByZXR1cm4gZmFsc2U7CiAgICAgICAgICB9IGVsc2UgaWYgKG9wZXJhdG9yID09ICIkYml0c0FueUNsZWFyIikgewogICAgICAgICAgICBpZiAoIWZpZWxkVmFsdWVNYXRjaGVzKGZpZWxkVmFsdWUsIGZ1bmN0aW9uKHYpIHsKICAgICAgICAgICAgICByZXR1cm4gbWF0Y2hlc0JpdHNBbnlDbGVhcih2LCBvcGVyYW5kKTsKICAgICAgICAgICAgfSkpIHJldHVybiBmYWxzZTsKICAgICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgIHRocm93IHsgJGVycjogIkNhbid0IGNhbm9uaWNhbGl6ZSBxdWVyeTogQmFkVmFsdWUgdW5rbm93biBvcGVyYXRvcjogIiArIG9wZXJhdG9yLCBjb2RlOiAxNzI4NyB9OwogICAgICAgICAgfQogICAgICAgIH0KICAgICAgICByZXR1cm4gdHJ1ZTsKICAgICAgfSBlbHNlIHsKICAgICAgICByZXR1cm4gZ2V0UHJvcChkb2MsIGtleSkgJiYgb2JqZWN0TWF0Y2hlcyhnZXRQcm9wKGRvYywga2V5KSwgdmFsdWUpOwogICAgICB9CiAgICB9CiAgfQp9CmZ1bmN0aW9uIG5vdChkb2MsIHZhbHVlKSB7CiAgcmV0dXJuICF0bE1hdGNoZXMoZG9jLCB2YWx1ZSk7Cn0KZnVuY3Rpb24gYW5kKGRvYywgZWxzKSB7CiAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbHMubGVuZ3RoOyBpKyspIHsKICAgIGlmICghdGxNYXRjaGVzKGRvYywgZWxzW2ldKSkgewogICAgICByZXR1cm4gZmFsc2U7CiAgICB9CiAgfQogIHJldHVybiB0cnVlOwp9CmZ1bmN0aW9uIG9yKGRvYywgZWxzKSB7CiAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbHMubGVuZ3RoOyBpKyspIHsKICAgIGlmICh0bE1hdGNoZXMoZG9jLCBlbHNbaV0pKSByZXR1cm4gdHJ1ZTsKICB9CiAgcmV0dXJuIGZhbHNlOwp9CmZ1bmN0aW9uIG5vcihkb2MsIGVscykgewogIGZvciAodmFyIGkgPSAwOyBpIDwgZWxzLmxlbmd0aDsgaSsrKSB7CiAgICBpZiAodGxNYXRjaGVzKGRvYywgZWxzW2ldKSkgcmV0dXJuIGZhbHNlOwogIH0KICByZXR1cm4gdHJ1ZTsKfQpmdW5jdGlvbiBtYXRjaGVzKGRvYywgcXVlcnkpIHsKICByZXR1cm4gYW5kKGRvYywgdG9BcnJheShxdWVyeSkpOwp9CmZ1bmN0aW9uIG1hdGNoV2l0aEFycmF5SW5kaWNlcyhkb2MsIHF1ZXJ5KSB7CiAgY29uc3QgYXJyYXlGaWx0ZXJzID0ge307CiAgY29uc3QgbWF0Y2hlZCA9IGFuZFdpdGhUcmFja2luZyhkb2MsIHRvQXJyYXkocXVlcnkpLCBhcnJheUZpbHRlcnMpOwogIHJldHVybiB7IG1hdGNoZWQsIGFycmF5RmlsdGVycyB9Owp9CmZ1bmN0aW9uIGFuZFdpdGhUcmFja2luZyhkb2MsIGVscywgYXJyYXlGaWx0ZXJzKSB7CiAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbHMubGVuZ3RoOyBpKyspIHsKICAgIGlmICghdGxNYXRjaGVzV2l0aFRyYWNraW5nKGRvYywgZWxzW2ldLCBhcnJheUZpbHRlcnMpKSB7CiAgICAgIHJldHVybiBmYWxzZTsKICAgIH0KICB9CiAgcmV0dXJuIHRydWU7Cn0KZnVuY3Rpb24gdGxNYXRjaGVzV2l0aFRyYWNraW5nKGRvYywgcXVlcnksIGFycmF5RmlsdGVycykgewogIHZhciBrZXkgPSBPYmplY3Qua2V5cyhxdWVyeSlbMF07CiAgdmFyIHZhbHVlID0gcXVlcnlba2V5XTsKICBpZiAoa2V5LmNoYXJBdCgwKSA9PSAiJCIpIHsKICAgIGlmIChrZXkgPT0gIiRhbmQiKSByZXR1cm4gYW5kV2l0aFRyYWNraW5nKGRvYywgdmFsdWUsIGFycmF5RmlsdGVycyk7CiAgICBlbHNlIGlmIChrZXkgPT0gIiRvciIpIHJldHVybiBvcldpdGhUcmFja2luZyhkb2MsIHZhbHVlLCBhcnJheUZpbHRlcnMpOwogICAgZWxzZSBpZiAoa2V5ID09ICIkbm90IikgewogICAgICByZXR1cm4gIXRsTWF0Y2hlcyhkb2MsIHZhbHVlKTsKICAgIH0gZWxzZSBpZiAoa2V5ID09ICIkbm9yIikgcmV0dXJuIG5vcldpdGhUcmFja2luZyhkb2MsIHZhbHVlLCBhcnJheUZpbHRlcnMpOwogICAgZWxzZSBpZiAoa2V5ID09ICIkd2hlcmUiKSByZXR1cm4gd2hlcmUoZG9jLCB2YWx1ZSk7CiAgICBlbHNlIGlmIChrZXkgPT0gIiRjb21tZW50IikgcmV0dXJuIHRydWU7CiAgICBlbHNlIGlmIChrZXkgPT0gIiRqc29uU2NoZW1hIikgcmV0dXJuIHZhbGlkYXRlSnNvblNjaGVtYShkb2MsIHZhbHVlKTsKICAgIGVsc2UgaWYgKGtleSA9PSAiJGV4cHIiKSB7CiAgICAgIHRyeSB7CiAgICAgICAgcmV0dXJuIGV2YWx1YXRlRXhwcmVzc2lvbih2YWx1ZSwgZG9jKTsKICAgICAgfSBjYXRjaCAoZSkgewogICAgICAgIHJldHVybiBmYWxzZTsKICAgICAgfQogICAgfSBlbHNlIHRocm93IHsgJGVycjogIkNhbid0IGNhbm9uaWNhbGl6ZSBxdWVyeTogQmFkVmFsdWUgdW5rbm93biB0b3AgbGV2ZWwgb3BlcmF0b3I6ICIgKyBrZXksIGNvZGU6IDE3Mjg3IH07CiAgfSBlbHNlIHsKICAgIHJldHVybiBvcE1hdGNoZXNXaXRoVHJhY2tpbmcoZG9jLCBrZXksIHZhbHVlLCBhcnJheUZpbHRlcnMpOwogIH0KfQpmdW5jdGlvbiBvcldpdGhUcmFja2luZyhkb2MsIGVscywgYXJyYXlGaWx0ZXJzKSB7CiAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbHMubGVuZ3RoOyBpKyspIHsKICAgIGlmICh0bE1hdGNoZXNXaXRoVHJhY2tpbmcoZG9jLCBlbHNbaV0sIGFycmF5RmlsdGVycykpIHsKICAgICAgcmV0dXJuIHRydWU7CiAgICB9CiAgfQogIHJldHVybiBmYWxzZTsKfQpmdW5jdGlvbiBub3JXaXRoVHJhY2tpbmcoZG9jLCBlbHMsIGFycmF5RmlsdGVycykgewogIGZvciAodmFyIGkgPSAwOyBpIDwgZWxzLmxlbmd0aDsgaSsrKSB7CiAgICBpZiAodGxNYXRjaGVzV2l0aFRyYWNraW5nKGRvYywgZWxzW2ldLCBhcnJheUZpbHRlcnMpKSB7CiAgICAgIHJldHVybiBmYWxzZTsKICAgIH0KICB9CiAgcmV0dXJuIHRydWU7Cn0KZnVuY3Rpb24gb3BNYXRjaGVzV2l0aFRyYWNraW5nKGRvYywga2V5LCB2YWx1ZSwgYXJyYXlGaWx0ZXJzKSB7CiAgY29uc3QgYmFzZUZpZWxkID0ga2V5LnNwbGl0KCIuIilbMF07CiAgY29uc3QgZmllbGRWYWx1ZSA9IGdldEZpZWxkVmFsdWVzKGRvYywga2V5KTsKICBjb25zdCB0cmFja01hdGNoaW5nSW5kZXggPSAoZmllbGRWYWx1ZTIsIGNoZWNrRm4pID0+IHsKICAgIGlmIChmaWVsZFZhbHVlMiA9PT0gdm9pZCAwKSByZXR1cm4gZmFsc2U7CiAgICBpZiAoZmllbGRWYWx1ZTIgPT09IG51bGwpIHJldHVybiBjaGVja0ZuKGZpZWxkVmFsdWUyKTsKICAgIGlmIChpc0FycmF5KGZpZWxkVmFsdWUyKSkgewogICAgICBjb25zdCBiYXNlVmFsdWUgPSBnZXRQcm9wKGRvYywgYmFzZUZpZWxkKTsKICAgICAgaWYgKGlzQXJyYXkoYmFzZVZhbHVlKSkgewogICAgICAgIGZvciAodmFyIGkyID0gMDsgaTIgPCBmaWVsZFZhbHVlMi5sZW5ndGg7IGkyKyspIHsKICAgICAgICAgIGlmIChjaGVja0ZuKGZpZWxkVmFsdWUyW2kyXSkpIHsKICAgICAgICAgICAgYXJyYXlGaWx0ZXJzW2tleV0gPSBpMjsKICAgICAgICAgICAgcmV0dXJuIHRydWU7CiAgICAgICAgICB9CiAgICAgICAgfQogICAgICAgIHJldHVybiBmYWxzZTsKICAgICAgfQogICAgfQogICAgcmV0dXJuIGZpZWxkVmFsdWVNYXRjaGVzKGZpZWxkVmFsdWUyLCBjaGVja0ZuKTsKICB9OwogIGlmICh0eXBlb2YgdmFsdWUgPT0gInN0cmluZyIpIHJldHVybiB0cmFja01hdGNoaW5nSW5kZXgoZmllbGRWYWx1ZSwgZnVuY3Rpb24odikgewogICAgcmV0dXJuIHZhbHVlc0VxdWFsKHYsIHZhbHVlKTsKICB9KTsKICBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT0gIm51bWJlciIpIHJldHVybiB0cmFja01hdGNoaW5nSW5kZXgoZmllbGRWYWx1ZSwgZnVuY3Rpb24odikgewogICAgcmV0dXJuIHZhbHVlc0VxdWFsKHYsIHZhbHVlKTsKICB9KTsKICBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT0gImJvb2xlYW4iKSByZXR1cm4gdHJhY2tNYXRjaGluZ0luZGV4KGZpZWxkVmFsdWUsIGZ1bmN0aW9uKHYpIHsKICAgIHJldHVybiB2YWx1ZXNFcXVhbCh2LCB2YWx1ZSk7CiAgfSk7CiAgZWxzZSBpZiAodmFsdWUgaW5zdGFuY2VvZiBPYmplY3RJZCkgcmV0dXJuIHRyYWNrTWF0Y2hpbmdJbmRleChmaWVsZFZhbHVlLCBmdW5jdGlvbih2KSB7CiAgICByZXR1cm4gdmFsdWVzRXF1YWwodiwgdmFsdWUpOwogIH0pOwogIGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PSAib2JqZWN0IikgewogICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgUmVnRXhwKSByZXR1cm4gZmllbGRWYWx1ZSAhPSB2b2lkIDAgJiYgdHJhY2tNYXRjaGluZ0luZGV4KGZpZWxkVmFsdWUsIGZ1bmN0aW9uKHYpIHsKICAgICAgcmV0dXJuIHYgJiYgdi5tYXRjaCh2YWx1ZSk7CiAgICB9KTsKICAgIGVsc2UgaWYgKGlzQXJyYXkodmFsdWUpKSByZXR1cm4gZmllbGRWYWx1ZSAhPSB2b2lkIDAgJiYgdHJhY2tNYXRjaGluZ0luZGV4KGZpZWxkVmFsdWUsIGZ1bmN0aW9uKHYpIHsKICAgICAgcmV0dXJuIHYgJiYgYXJyYXlNYXRjaGVzKHYsIHZhbHVlKTsKICAgIH0pOwogICAgZWxzZSB7CiAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpOwogICAgICBpZiAoa2V5c1swXS5jaGFyQXQoMCkgPT0gIiQiKSB7CiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7CiAgICAgICAgICB2YXIgb3BlcmF0b3IgPSBrZXlzW2ldOwogICAgICAgICAgdmFyIG9wZXJhbmQgPSB2YWx1ZVtvcGVyYXRvcl07CiAgICAgICAgICBpZiAob3BlcmF0b3IgPT0gIiRlcSIpIHsKICAgICAgICAgICAgaWYgKCF0cmFja01hdGNoaW5nSW5kZXgoZmllbGRWYWx1ZSwgZnVuY3Rpb24odikgewogICAgICAgICAgICAgIHJldHVybiB2YWx1ZXNFcXVhbCh2LCBvcGVyYW5kKTsKICAgICAgICAgICAgfSkpIHJldHVybiBmYWxzZTsKICAgICAgICAgIH0gZWxzZSBpZiAob3BlcmF0b3IgPT0gIiRndCIpIHsKICAgICAgICAgICAgaWYgKCF0cmFja01hdGNoaW5nSW5kZXgoZmllbGRWYWx1ZSwgZnVuY3Rpb24odikgewogICAgICAgICAgICAgIHJldHVybiBjb21wYXJlVmFsdWVzKHYsIG9wZXJhbmQsICI+Iik7CiAgICAgICAgICAgIH0pKSByZXR1cm4gZmFsc2U7CiAgICAgICAgICB9IGVsc2UgaWYgKG9wZXJhdG9yID09ICIkZ3RlIikgewogICAgICAgICAgICBpZiAoIXRyYWNrTWF0Y2hpbmdJbmRleChmaWVsZFZhbHVlLCBmdW5jdGlvbih2KSB7CiAgICAgICAgICAgICAgcmV0dXJuIGNvbXBhcmVWYWx1ZXModiwgb3BlcmFuZCwgIj49Iik7CiAgICAgICAgICAgIH0pKSByZXR1cm4gZmFsc2U7CiAgICAgICAgICB9IGVsc2UgaWYgKG9wZXJhdG9yID09ICIkbHQiKSB7CiAgICAgICAgICAgIGlmICghdHJhY2tNYXRjaGluZ0luZGV4KGZpZWxkVmFsdWUsIGZ1bmN0aW9uKHYpIHsKICAgICAgICAgICAgICByZXR1cm4gY29tcGFyZVZhbHVlcyh2LCBvcGVyYW5kLCAiPCIpOwogICAgICAgICAgICB9KSkgcmV0dXJuIGZhbHNlOwogICAgICAgICAgfSBlbHNlIGlmIChvcGVyYXRvciA9PSAiJGx0ZSIpIHsKICAgICAgICAgICAgaWYgKCF0cmFja01hdGNoaW5nSW5kZXgoZmllbGRWYWx1ZSwgZnVuY3Rpb24odikgewogICAgICAgICAgICAgIHJldHVybiBjb21wYXJlVmFsdWVzKHYsIG9wZXJhbmQsICI8PSIpOwogICAgICAgICAgICB9KSkgcmV0dXJuIGZhbHNlOwogICAgICAgICAgfSBlbHNlIGlmIChvcGVyYXRvciA9PSAiJG5lIikgewogICAgICAgICAgICBpZiAoIXRyYWNrTWF0Y2hpbmdJbmRleChmaWVsZFZhbHVlLCBmdW5jdGlvbih2KSB7CiAgICAgICAgICAgICAgcmV0dXJuICF2YWx1ZXNFcXVhbCh2LCBvcGVyYW5kKTsKICAgICAgICAgICAgfSkpIHJldHVybiBmYWxzZTsKICAgICAgICAgIH0gZWxzZSBpZiAob3BlcmF0b3IgPT0gIiRpbiIpIHsKICAgICAgICAgICAgaWYgKCF0cmFja01hdGNoaW5nSW5kZXgoZmllbGRWYWx1ZSwgZnVuY3Rpb24odikgewogICAgICAgICAgICAgIHJldHVybiBpc0luKHYsIG9wZXJhbmQpOwogICAgICAgICAgICB9KSkgcmV0dXJuIGZhbHNlOwogICAgICAgICAgfSBlbHNlIGlmIChvcGVyYXRvciA9PSAiJG5pbiIpIHsKICAgICAgICAgICAgaWYgKHRyYWNrTWF0Y2hpbmdJbmRleChmaWVsZFZhbHVlLCBmdW5jdGlvbih2KSB7CiAgICAgICAgICAgICAgcmV0dXJuIGlzSW4odiwgb3BlcmFuZCk7CiAgICAgICAgICAgIH0pKSByZXR1cm4gZmFsc2U7CiAgICAgICAgICB9IGVsc2UgaWYgKG9wZXJhdG9yID09ICIkZWxlbU1hdGNoIikgewogICAgICAgICAgICB2YXIgYXJyYXlGaWVsZFZhbHVlID0gZ2V0UHJvcChkb2MsIGtleSk7CiAgICAgICAgICAgIGlmIChhcnJheUZpZWxkVmFsdWUgPT0gdm9pZCAwIHx8ICFpc0FycmF5KGFycmF5RmllbGRWYWx1ZSkpIHJldHVybiBmYWxzZTsKICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBhcnJheUZpZWxkVmFsdWUubGVuZ3RoOyBqKyspIHsKICAgICAgICAgICAgICB2YXIgZWxlbWVudCA9IGFycmF5RmllbGRWYWx1ZVtqXTsKICAgICAgICAgICAgICBpZiAodHlwZW9mIGVsZW1lbnQgPT09ICJvYmplY3QiICYmICFpc0FycmF5KGVsZW1lbnQpKSB7CiAgICAgICAgICAgICAgICBpZiAobWF0Y2hlcyhlbGVtZW50LCBvcGVyYW5kKSkgewogICAgICAgICAgICAgICAgICBhcnJheUZpbHRlcnNba2V5XSA9IGo7CiAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlOwogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgICAgICB2YXIgbWF0Y2hlc1ByaW1pdGl2ZSA9IHRydWU7CiAgICAgICAgICAgICAgICB2YXIgb3BLZXlzID0gT2JqZWN0LmtleXMob3BlcmFuZCk7CiAgICAgICAgICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IG9wS2V5cy5sZW5ndGg7IGsrKykgewogICAgICAgICAgICAgICAgICB2YXIgb3AgPSBvcEtleXNba107CiAgICAgICAgICAgICAgICAgIHZhciBvcFZhbHVlID0gb3BlcmFuZFtvcF07CiAgICAgICAgICAgICAgICAgIGlmIChvcCA9PSAiJGd0ZSIgJiYgIShlbGVtZW50ID49IG9wVmFsdWUpKSBtYXRjaGVzUHJpbWl0aXZlID0gZmFsc2U7CiAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9wID09ICIkZ3QiICYmICEoZWxlbWVudCA+IG9wVmFsdWUpKSBtYXRjaGVzUHJpbWl0aXZlID0gZmFsc2U7CiAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9wID09ICIkbHRlIiAmJiAhKGVsZW1lbnQgPD0gb3BWYWx1ZSkpIG1hdGNoZXNQcmltaXRpdmUgPSBmYWxzZTsKICAgICAgICAgICAgICAgICAgZWxzZSBpZiAob3AgPT0gIiRsdCIgJiYgIShlbGVtZW50IDwgb3BWYWx1ZSkpIG1hdGNoZXNQcmltaXRpdmUgPSBmYWxzZTsKICAgICAgICAgICAgICAgICAgZWxzZSBpZiAob3AgPT0gIiRlcSIgJiYgZWxlbWVudCAhPSBvcFZhbHVlKSBtYXRjaGVzUHJpbWl0aXZlID0gZmFsc2U7CiAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9wID09ICIkbmUiICYmIGVsZW1lbnQgPT0gb3BWYWx1ZSkgbWF0Y2hlc1ByaW1pdGl2ZSA9IGZhbHNlOwogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgaWYgKG1hdGNoZXNQcmltaXRpdmUpIHsKICAgICAgICAgICAgICAgICAgYXJyYXlGaWx0ZXJzW2tleV0gPSBqOwogICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTsKICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0KICAgICAgICAgICAgcmV0dXJuIGZhbHNlOwogICAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgaWYgKCFvcE1hdGNoZXMoZG9jLCBrZXksIHZhbHVlKSkgcmV0dXJuIGZhbHNlOwogICAgICAgICAgfQogICAgICAgIH0KICAgICAgICByZXR1cm4gdHJ1ZTsKICAgICAgfSBlbHNlIHsKICAgICAgICByZXR1cm4gZmllbGRWYWx1ZSAhPSB2b2lkIDAgJiYgdHJhY2tNYXRjaGluZ0luZGV4KGZpZWxkVmFsdWUsIGZ1bmN0aW9uKHYpIHsKICAgICAgICAgIHJldHVybiBvYmplY3RNYXRjaGVzKHYsIHZhbHVlKTsKICAgICAgICB9KTsKICAgICAgfQogICAgfQogIH0KICByZXR1cm4gZmFsc2U7Cn0KZnVuY3Rpb24gZXh0cmFjdEZpbHRlcmVkUG9zaXRpb25hbElkZW50aWZpZXIocGF0aFNlZ21lbnQpIHsKICBjb25zdCBtYXRjaCA9IHBhdGhTZWdtZW50Lm1hdGNoKC9eXCRcWyhbXlxdXSspXF0kLyk7CiAgcmV0dXJuIG1hdGNoID8gbWF0Y2hbMV0gOiBudWxsOwp9CmZ1bmN0aW9uIHBhcnNlRmllbGRQYXRoKGZpZWxkUGF0aCkgewogIGNvbnN0IHNlZ21lbnRzID0gZmllbGRQYXRoLnNwbGl0KCIuIik7CiAgcmV0dXJuIHNlZ21lbnRzLm1hcCgoc2VnbWVudCkgPT4gewogICAgY29uc3QgaWRlbnRpZmllciA9IGV4dHJhY3RGaWx0ZXJlZFBvc2l0aW9uYWxJZGVudGlmaWVyKHNlZ21lbnQpOwogICAgcmV0dXJuIHsKICAgICAgc2VnbWVudCwKICAgICAgaXNGaWx0ZXJlZFBvc2l0aW9uYWw6IGlkZW50aWZpZXIgIT09IG51bGwsCiAgICAgIGlkZW50aWZpZXIKICAgIH07CiAgfSk7Cn0KZnVuY3Rpb24gYXBwbHlUb0ZpbHRlcmVkQXJyYXlFbGVtZW50cyhkb2MsIHBhcnNlZFBhdGgsIHZhbHVlLCBvcGVyYXRpb24sIGFycmF5RmlsdGVycykgewogIGZ1bmN0aW9uIHRyYXZlcnNlKGN1cnJlbnQsIHBhdGhJbmRleCwgZmlsdGVyQ29udGV4dCkgewogICAgaWYgKHBhdGhJbmRleCA+PSBwYXJzZWRQYXRoLmxlbmd0aCkgewogICAgICByZXR1cm47CiAgICB9CiAgICBjb25zdCBwYXRoSW5mbyA9IHBhcnNlZFBhdGhbcGF0aEluZGV4XTsKICAgIGNvbnN0IGlzTGFzdFNlZ21lbnQgPSBwYXRoSW5kZXggPT09IHBhcnNlZFBhdGgubGVuZ3RoIC0gMTsKICAgIGlmIChwYXRoSW5mby5pc0ZpbHRlcmVkUG9zaXRpb25hbCkgewogICAgICBjb25zdCBpZGVudGlmaWVyID0gcGF0aEluZm8uaWRlbnRpZmllcjsKICAgICAgY29uc3QgZmlsdGVyID0gYXJyYXlGaWx0ZXJzID8gYXJyYXlGaWx0ZXJzLmZpbmQoKGYpID0+IHsKICAgICAgICBjb25zdCBmaWx0ZXJLZXlzID0gT2JqZWN0LmtleXMoZik7CiAgICAgICAgcmV0dXJuIGZpbHRlcktleXMuc29tZSgoa2V5KSA9PiBrZXkuc3RhcnRzV2l0aChpZGVudGlmaWVyICsgIi4iKSB8fCBrZXkgPT09IGlkZW50aWZpZXIpOwogICAgICB9KSA6IG51bGw7CiAgICAgIGlmICghYXJyYXlGaWx0ZXJzKSB7CiAgICAgICAgaWYgKCFjdXJyZW50W3BhdGhJbmZvLnNlZ21lbnRdKSB7CiAgICAgICAgICBjb25zdCBuZXh0UGF0aCA9IHBhcnNlZFBhdGhbcGF0aEluZGV4ICsgMV07CiAgICAgICAgICBpZiAobmV4dFBhdGggJiYgbmV4dFBhdGguaXNGaWx0ZXJlZFBvc2l0aW9uYWwpIHsKICAgICAgICAgICAgY3VycmVudFtwYXRoSW5mby5zZWdtZW50XSA9IFtdOwogICAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgY3VycmVudFtwYXRoSW5mby5zZWdtZW50XSA9IHt9OwogICAgICAgICAgfQogICAgICAgIH0KICAgICAgICBpZiAoaXNMYXN0U2VnbWVudCkgewogICAgICAgICAgYXBwbHlPcGVyYXRpb25Ub1ZhbHVlKGN1cnJlbnQsIHBhdGhJbmZvLnNlZ21lbnQsIHZhbHVlLCBvcGVyYXRpb24pOwogICAgICAgIH0gZWxzZSB7CiAgICAgICAgICB0cmF2ZXJzZShjdXJyZW50W3BhdGhJbmZvLnNlZ21lbnRdLCBwYXRoSW5kZXggKyAxKTsKICAgICAgICB9CiAgICAgICAgcmV0dXJuOwogICAgICB9CiAgICAgIGlmICghaXNBcnJheShjdXJyZW50KSkgewogICAgICAgIGlmICghY3VycmVudFtwYXRoSW5mby5zZWdtZW50XSkgewogICAgICAgICAgY3VycmVudFtwYXRoSW5mby5zZWdtZW50XSA9IHt9OwogICAgICAgIH0KICAgICAgICBpZiAoaXNMYXN0U2VnbWVudCkgewogICAgICAgICAgYXBwbHlPcGVyYXRpb25Ub1ZhbHVlKGN1cnJlbnQsIHBhdGhJbmZvLnNlZ21lbnQsIHZhbHVlLCBvcGVyYXRpb24pOwogICAgICAgIH0gZWxzZSB7CiAgICAgICAgICB0cmF2ZXJzZShjdXJyZW50W3BhdGhJbmZvLnNlZ21lbnRdLCBwYXRoSW5kZXggKyAxKTsKICAgICAgICB9CiAgICAgICAgcmV0dXJuOwogICAgICB9CiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY3VycmVudC5sZW5ndGg7IGkrKykgewogICAgICAgIGNvbnN0IGVsZW1lbnQgPSBjdXJyZW50W2ldOwogICAgICAgIGxldCBzaG91bGRVcGRhdGUgPSB0cnVlOwogICAgICAgIGlmIChmaWx0ZXIpIHsKICAgICAgICAgIGxldCB0cmFuc2Zvcm1lZEZpbHRlciA9IHt9OwogICAgICAgICAgbGV0IGhhc0RpcmVjdE1hdGNoID0gZmFsc2U7CiAgICAgICAgICBPYmplY3Qua2V5cyhmaWx0ZXIpLmZvckVhY2goKGtleSkgPT4gewogICAgICAgICAgICBpZiAoa2V5LnN0YXJ0c1dpdGgoaWRlbnRpZmllciArICIuIikpIHsKICAgICAgICAgICAgICBjb25zdCBmaWVsZFBhdGggPSBrZXkuc3Vic3RyaW5nKGlkZW50aWZpZXIubGVuZ3RoICsgMSk7CiAgICAgICAgICAgICAgdHJhbnNmb3JtZWRGaWx0ZXJbZmllbGRQYXRoXSA9IGZpbHRlcltrZXldOwogICAgICAgICAgICB9IGVsc2UgaWYgKGtleSA9PT0gaWRlbnRpZmllcikgewogICAgICAgICAgICAgIHRyYW5zZm9ybWVkRmlsdGVyID0gZmlsdGVyW2tleV07CiAgICAgICAgICAgICAgaGFzRGlyZWN0TWF0Y2ggPSB0cnVlOwogICAgICAgICAgICB9CiAgICAgICAgICB9KTsKICAgICAgICAgIGlmIChoYXNEaXJlY3RNYXRjaCkgewogICAgICAgICAgICBjb25zdCB0ZXN0RG9jID0geyB2YWx1ZTogZWxlbWVudCB9OwogICAgICAgICAgICBjb25zdCB0ZXN0RmlsdGVyID0geyB2YWx1ZTogdHJhbnNmb3JtZWRGaWx0ZXIgfTsKICAgICAgICAgICAgc2hvdWxkVXBkYXRlID0gbWF0Y2hlcyh0ZXN0RG9jLCB0ZXN0RmlsdGVyKTsKICAgICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgIHNob3VsZFVwZGF0ZSA9IG1hdGNoZXMoZWxlbWVudCwgdHJhbnNmb3JtZWRGaWx0ZXIpOwogICAgICAgICAgfQogICAgICAgIH0KICAgICAgICBpZiAoc2hvdWxkVXBkYXRlKSB7CiAgICAgICAgICBpZiAoaXNMYXN0U2VnbWVudCkgewogICAgICAgICAgICBhcHBseU9wZXJhdGlvblRvVmFsdWUoY3VycmVudCwgaSwgdmFsdWUsIG9wZXJhdGlvbik7CiAgICAgICAgICB9IGVsc2UgewogICAgICAgICAgICBpZiAoZWxlbWVudCAhPT0gbnVsbCAmJiBlbGVtZW50ICE9PSB2b2lkIDApIHsKICAgICAgICAgICAgICB0cmF2ZXJzZShjdXJyZW50W2ldLCBwYXRoSW5kZXggKyAxKTsKICAgICAgICAgICAgfQogICAgICAgICAgfQogICAgICAgIH0KICAgICAgfQogICAgfSBlbHNlIHsKICAgICAgaWYgKGN1cnJlbnRbcGF0aEluZm8uc2VnbWVudF0gPT09IHZvaWQgMCB8fCBjdXJyZW50W3BhdGhJbmZvLnNlZ21lbnRdID09PSBudWxsKSB7CiAgICAgICAgaWYgKCFpc0xhc3RTZWdtZW50KSB7CiAgICAgICAgICBjb25zdCBuZXh0UGF0aCA9IHBhcnNlZFBhdGhbcGF0aEluZGV4ICsgMV07CiAgICAgICAgICBpZiAobmV4dFBhdGggJiYgbmV4dFBhdGguaXNGaWx0ZXJlZFBvc2l0aW9uYWwpIHsKICAgICAgICAgICAgY3VycmVudFtwYXRoSW5mby5zZWdtZW50XSA9IFtdOwogICAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgY3VycmVudFtwYXRoSW5mby5zZWdtZW50XSA9IHt9OwogICAgICAgICAgfQogICAgICAgIH0KICAgICAgfQogICAgICBpZiAoaXNMYXN0U2VnbWVudCkgewogICAgICAgIGFwcGx5T3BlcmF0aW9uVG9WYWx1ZShjdXJyZW50LCBwYXRoSW5mby5zZWdtZW50LCB2YWx1ZSwgb3BlcmF0aW9uKTsKICAgICAgfSBlbHNlIHsKICAgICAgICBpZiAoY3VycmVudFtwYXRoSW5mby5zZWdtZW50XSAhPT0gdm9pZCAwICYmIGN1cnJlbnRbcGF0aEluZm8uc2VnbWVudF0gIT09IG51bGwpIHsKICAgICAgICAgIHRyYXZlcnNlKGN1cnJlbnRbcGF0aEluZm8uc2VnbWVudF0sIHBhdGhJbmRleCArIDEpOwogICAgICAgIH0KICAgICAgfQogICAgfQogIH0KICB0cmF2ZXJzZShkb2MsIDApOwp9CmZ1bmN0aW9uIGFwcGx5T3BlcmF0aW9uVG9WYWx1ZShjb250YWluZXIsIGtleSwgdmFsdWUsIG9wZXJhdGlvbikgewogIHN3aXRjaCAob3BlcmF0aW9uKSB7CiAgICBjYXNlICIkc2V0IjoKICAgICAgY29udGFpbmVyW2tleV0gPSB2YWx1ZTsKICAgICAgYnJlYWs7CiAgICBjYXNlICIkaW5jIjoKICAgICAgaWYgKGNvbnRhaW5lcltrZXldID09PSB2b2lkIDApIGNvbnRhaW5lcltrZXldID0gMDsKICAgICAgY29udGFpbmVyW2tleV0gKz0gdmFsdWU7CiAgICAgIGJyZWFrOwogICAgY2FzZSAiJG11bCI6CiAgICAgIGNvbnRhaW5lcltrZXldID0gY29udGFpbmVyW2tleV0gKiB2YWx1ZTsKICAgICAgYnJlYWs7CiAgICBjYXNlICIkbWluIjoKICAgICAgY29udGFpbmVyW2tleV0gPSBNYXRoLm1pbihjb250YWluZXJba2V5XSwgdmFsdWUpOwogICAgICBicmVhazsKICAgIGNhc2UgIiRtYXgiOgogICAgICBjb250YWluZXJba2V5XSA9IE1hdGgubWF4KGNvbnRhaW5lcltrZXldLCB2YWx1ZSk7CiAgICAgIGJyZWFrOwogICAgY2FzZSAiJHVuc2V0IjoKICAgICAgZGVsZXRlIGNvbnRhaW5lcltrZXldOwogICAgICBicmVhazsKICAgIGRlZmF1bHQ6CiAgICAgIGNvbnRhaW5lcltrZXldID0gdmFsdWU7CiAgfQp9CmZ1bmN0aW9uIGhhc0ZpbHRlcmVkUG9zaXRpb25hbE9wZXJhdG9yKGZpZWxkUGF0aCkgewogIHJldHVybiAvXCRcW1teXF1dK1xdLy50ZXN0KGZpZWxkUGF0aCk7Cn0KZnVuY3Rpb24gaGFzQWxsUG9zaXRpb25hbChmaWVsZCkgewogIHJldHVybiBmaWVsZC5pbmRleE9mKCIkW10iKSAhPT0gLTE7Cn0KZnVuY3Rpb24gYXBwbHlUb0FsbFBvc2l0aW9uYWwoZG9jLCBmaWVsZCwgdXBkYXRlRm4pIHsKICB2YXIgcGF0aCA9IGZpZWxkLnNwbGl0KCIuIik7CiAgdmFyIGN1cnJlbnQgPSBkb2M7CiAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aDsgaSsrKSB7CiAgICB2YXIgcGF0aFNlZ21lbnQgPSBwYXRoW2ldOwogICAgaWYgKHBhdGhTZWdtZW50ID09PSAiJFtdIikgewogICAgICBpZiAoIUFycmF5LmlzQXJyYXkoY3VycmVudCkpIHsKICAgICAgICByZXR1cm47CiAgICAgIH0KICAgICAgdmFyIHJlbWFpbmluZ1BhdGggPSBwYXRoLnNsaWNlKGkgKyAxKS5qb2luKCIuIik7CiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY3VycmVudC5sZW5ndGg7IGorKykgewogICAgICAgIGlmIChyZW1haW5pbmdQYXRoKSB7CiAgICAgICAgICBpZiAocmVtYWluaW5nUGF0aC5pbmRleE9mKCIkW10iKSAhPT0gLTEpIHsKICAgICAgICAgICAgYXBwbHlUb0FsbFBvc2l0aW9uYWwoY3VycmVudFtqXSwgcmVtYWluaW5nUGF0aCwgdXBkYXRlRm4pOwogICAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgdmFyIGN1cnJlbnRWYWx1ZSA9IGdldFByb3AoY3VycmVudFtqXSwgcmVtYWluaW5nUGF0aCk7CiAgICAgICAgICAgIHZhciBuZXdWYWx1ZSA9IHVwZGF0ZUZuKGN1cnJlbnRWYWx1ZSk7CiAgICAgICAgICAgIHNldFByb3AoY3VycmVudFtqXSwgcmVtYWluaW5nUGF0aCwgbmV3VmFsdWUpOwogICAgICAgICAgfQogICAgICAgIH0gZWxzZSB7CiAgICAgICAgICBjdXJyZW50W2pdID0gdXBkYXRlRm4oY3VycmVudFtqXSk7CiAgICAgICAgfQogICAgICB9CiAgICAgIHJldHVybjsKICAgIH0KICAgIGlmIChjdXJyZW50ID09IG51bGwgfHwgY3VycmVudCA9PSB2b2lkIDApIHJldHVybjsKICAgIGN1cnJlbnQgPSBjdXJyZW50W3BhdGhTZWdtZW50XTsKICB9Cn0KZnVuY3Rpb24gcmVwbGFjZVBvc2l0aW9uYWxPcGVyYXRvcihmaWVsZFBhdGgsIGFycmF5RmlsdGVycykgewogIGlmICghYXJyYXlGaWx0ZXJzIHx8ICFmaWVsZFBhdGguaW5jbHVkZXMoIiQiKSkgewogICAgcmV0dXJuIGZpZWxkUGF0aDsKICB9CiAgY29uc3QgcGFydHMgPSBmaWVsZFBhdGguc3BsaXQoIi4iKTsKICBjb25zdCBkb2xsYXJJbmRleCA9IHBhcnRzLmluZGV4T2YoIiQiKTsKICBpZiAoZG9sbGFySW5kZXggPT09IC0xKSB7CiAgICByZXR1cm4gZmllbGRQYXRoOwogIH0KICBjb25zdCBwYXRoQmVmb3JlRG9sbGFyID0gcGFydHMuc2xpY2UoMCwgZG9sbGFySW5kZXgpLmpvaW4oIi4iKTsKICBsZXQgbWF0Y2hlZEluZGV4ID0gbnVsbDsKICBmb3IgKGNvbnN0IGZpbHRlclBhdGggaW4gYXJyYXlGaWx0ZXJzKSB7CiAgICBpZiAoZmlsdGVyUGF0aCA9PT0gcGF0aEJlZm9yZURvbGxhciB8fCBmaWx0ZXJQYXRoLnN0YXJ0c1dpdGgocGF0aEJlZm9yZURvbGxhciArICIuIikpIHsKICAgICAgbWF0Y2hlZEluZGV4ID0gYXJyYXlGaWx0ZXJzW2ZpbHRlclBhdGhdOwogICAgICBicmVhazsKICAgIH0KICB9CiAgaWYgKG1hdGNoZWRJbmRleCAhPT0gbnVsbCAmJiBtYXRjaGVkSW5kZXggIT09IHZvaWQgMCkgewogICAgcGFydHNbZG9sbGFySW5kZXhdID0gbWF0Y2hlZEluZGV4LnRvU3RyaW5nKCk7CiAgICByZXR1cm4gcGFydHMuam9pbigiLiIpOwogIH0KICByZXR1cm4gZmllbGRQYXRoOwp9CmZ1bmN0aW9uIGFwcGx5VXBkYXRlcyh1cGRhdGVzLCBkb2MsIHNldE9uSW5zZXJ0LCBwb3NpdGlvbmFsTWF0Y2hJbmZvLCB1c2VyQXJyYXlGaWx0ZXJzKSB7CiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh1cGRhdGVzKTsKICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHsKICAgIHZhciBrZXkgPSBrZXlzW2ldOwogICAgdmFyIHZhbHVlID0gdXBkYXRlc1trZXldOwogICAgaWYgKGtleSA9PSAiJGluYyIpIHsKICAgICAgdmFyIGZpZWxkcyA9IE9iamVjdC5rZXlzKHZhbHVlKTsKICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBmaWVsZHMubGVuZ3RoOyBqKyspIHsKICAgICAgICB2YXIgZmllbGQgPSByZXBsYWNlUG9zaXRpb25hbE9wZXJhdG9yKGZpZWxkc1tqXSwgcG9zaXRpb25hbE1hdGNoSW5mbyk7CiAgICAgICAgdmFyIGFtb3VudCA9IHZhbHVlW2ZpZWxkc1tqXV07CiAgICAgICAgaWYgKGhhc0ZpbHRlcmVkUG9zaXRpb25hbE9wZXJhdG9yKGZpZWxkKSkgewogICAgICAgICAgaWYgKCF1c2VyQXJyYXlGaWx0ZXJzKSB7CiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigiYXJyYXlGaWx0ZXJzIG9wdGlvbiBpcyByZXF1aXJlZCB3aGVuIHVzaW5nIGZpbHRlcmVkIHBvc2l0aW9uYWwgb3BlcmF0b3IgJFs8aWRlbnRpZmllcj5dIik7CiAgICAgICAgICB9CiAgICAgICAgICBjb25zdCBwYXJzZWRQYXRoID0gcGFyc2VGaWVsZFBhdGgoZmllbGQpOwogICAgICAgICAgYXBwbHlUb0ZpbHRlcmVkQXJyYXlFbGVtZW50cyhkb2MsIHBhcnNlZFBhdGgsIGFtb3VudCwgIiRpbmMiLCB1c2VyQXJyYXlGaWx0ZXJzKTsKICAgICAgICB9IGVsc2UgaWYgKGhhc0FsbFBvc2l0aW9uYWwoZmllbGQpKSB7CiAgICAgICAgICBhcHBseVRvQWxsUG9zaXRpb25hbChkb2MsIGZpZWxkLCBmdW5jdGlvbih2YWwpIHsKICAgICAgICAgICAgcmV0dXJuICh2YWwgPT09IHZvaWQgMCA/IDAgOiB2YWwpICsgYW1vdW50OwogICAgICAgICAgfSk7CiAgICAgICAgfSBlbHNlIHsKICAgICAgICAgIHZhciBjdXJyZW50VmFsdWUgPSBnZXRQcm9wKGRvYywgZmllbGQpOwogICAgICAgICAgaWYgKGN1cnJlbnRWYWx1ZSA9PSB2b2lkIDApIGN1cnJlbnRWYWx1ZSA9IDA7CiAgICAgICAgICBzZXRQcm9wKGRvYywgZmllbGQsIGN1cnJlbnRWYWx1ZSArIGFtb3VudCk7CiAgICAgICAgfQogICAgICB9CiAgICB9IGVsc2UgaWYgKGtleSA9PSAiJG11bCIpIHsKICAgICAgdmFyIGZpZWxkcyA9IE9iamVjdC5rZXlzKHZhbHVlKTsKICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBmaWVsZHMubGVuZ3RoOyBqKyspIHsKICAgICAgICB2YXIgZmllbGQgPSByZXBsYWNlUG9zaXRpb25hbE9wZXJhdG9yKGZpZWxkc1tqXSwgcG9zaXRpb25hbE1hdGNoSW5mbyk7CiAgICAgICAgdmFyIGFtb3VudCA9IHZhbHVlW2ZpZWxkc1tqXV07CiAgICAgICAgaWYgKGhhc0ZpbHRlcmVkUG9zaXRpb25hbE9wZXJhdG9yKGZpZWxkKSkgewogICAgICAgICAgaWYgKCF1c2VyQXJyYXlGaWx0ZXJzKSB7CiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigiYXJyYXlGaWx0ZXJzIG9wdGlvbiBpcyByZXF1aXJlZCB3aGVuIHVzaW5nIGZpbHRlcmVkIHBvc2l0aW9uYWwgb3BlcmF0b3IgJFs8aWRlbnRpZmllcj5dIik7CiAgICAgICAgICB9CiAgICAgICAgICBjb25zdCBwYXJzZWRQYXRoID0gcGFyc2VGaWVsZFBhdGgoZmllbGQpOwogICAgICAgICAgYXBwbHlUb0ZpbHRlcmVkQXJyYXlFbGVtZW50cyhkb2MsIHBhcnNlZFBhdGgsIGFtb3VudCwgIiRtdWwiLCB1c2VyQXJyYXlGaWx0ZXJzKTsKICAgICAgICB9IGVsc2UgaWYgKGhhc0FsbFBvc2l0aW9uYWwoZmllbGQpKSB7CiAgICAgICAgICBhcHBseVRvQWxsUG9zaXRpb25hbChkb2MsIGZpZWxkLCBmdW5jdGlvbih2YWwpIHsKICAgICAgICAgICAgcmV0dXJuIHZhbCAqIGFtb3VudDsKICAgICAgICAgIH0pOwogICAgICAgIH0gZWxzZSB7CiAgICAgICAgICB2YXIgY3VycmVudFZhbHVlID0gZ2V0UHJvcChkb2MsIGZpZWxkKTsKICAgICAgICAgIGlmIChjdXJyZW50VmFsdWUgPT0gdm9pZCAwKSBjdXJyZW50VmFsdWUgPSAwOwogICAgICAgICAgc2V0UHJvcChkb2MsIGZpZWxkLCBjdXJyZW50VmFsdWUgKiBhbW91bnQpOwogICAgICAgIH0KICAgICAgfQogICAgfSBlbHNlIGlmIChrZXkgPT0gIiRyZW5hbWUiKSB7CiAgICAgIHZhciBmaWVsZHMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7CiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZmllbGRzLmxlbmd0aDsgaisrKSB7CiAgICAgICAgdmFyIGZpZWxkID0gcmVwbGFjZVBvc2l0aW9uYWxPcGVyYXRvcihmaWVsZHNbal0sIHBvc2l0aW9uYWxNYXRjaEluZm8pOwogICAgICAgIHZhciBuZXdOYW1lID0gcmVwbGFjZVBvc2l0aW9uYWxPcGVyYXRvcih2YWx1ZVtmaWVsZHNbal1dLCBwb3NpdGlvbmFsTWF0Y2hJbmZvKTsKICAgICAgICBkb2NbbmV3TmFtZV0gPSBkb2NbZmllbGRdOwogICAgICAgIGRlbGV0ZSBkb2NbZmllbGRdOwogICAgICB9CiAgICB9IGVsc2UgaWYgKGtleSA9PSAiJHNldE9uSW5zZXJ0IiAmJiBzZXRPbkluc2VydCkgewogICAgICB2YXIgZmllbGRzID0gT2JqZWN0LmtleXModmFsdWUpOwogICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGZpZWxkcy5sZW5ndGg7IGorKykgewogICAgICAgIHZhciBmaWVsZCA9IHJlcGxhY2VQb3NpdGlvbmFsT3BlcmF0b3IoZmllbGRzW2pdLCBwb3NpdGlvbmFsTWF0Y2hJbmZvKTsKICAgICAgICBkb2NbZmllbGRdID0gdmFsdWVbZmllbGRzW2pdXTsKICAgICAgfQogICAgfSBlbHNlIGlmIChrZXkgPT0gIiRzZXQiKSB7CiAgICAgIHZhciBmaWVsZHMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7CiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZmllbGRzLmxlbmd0aDsgaisrKSB7CiAgICAgICAgdmFyIGZpZWxkID0gcmVwbGFjZVBvc2l0aW9uYWxPcGVyYXRvcihmaWVsZHNbal0sIHBvc2l0aW9uYWxNYXRjaEluZm8pOwogICAgICAgIGlmIChoYXNGaWx0ZXJlZFBvc2l0aW9uYWxPcGVyYXRvcihmaWVsZCkpIHsKICAgICAgICAgIGlmICghdXNlckFycmF5RmlsdGVycykgewogICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoImFycmF5RmlsdGVycyBvcHRpb24gaXMgcmVxdWlyZWQgd2hlbiB1c2luZyBmaWx0ZXJlZCBwb3NpdGlvbmFsIG9wZXJhdG9yICRbPGlkZW50aWZpZXI+XSIpOwogICAgICAgICAgfQogICAgICAgICAgY29uc3QgcGFyc2VkUGF0aCA9IHBhcnNlRmllbGRQYXRoKGZpZWxkKTsKICAgICAgICAgIGFwcGx5VG9GaWx0ZXJlZEFycmF5RWxlbWVudHMoZG9jLCBwYXJzZWRQYXRoLCB2YWx1ZVtmaWVsZHNbal1dLCAiJHNldCIsIHVzZXJBcnJheUZpbHRlcnMpOwogICAgICAgIH0gZWxzZSB7CiAgICAgICAgICBzZXRQcm9wKGRvYywgZmllbGQsIHZhbHVlW2ZpZWxkc1tqXV0pOwogICAgICAgIH0KICAgICAgfQogICAgfSBlbHNlIGlmIChrZXkgPT0gIiR1bnNldCIpIHsKICAgICAgdmFyIGZpZWxkcyA9IE9iamVjdC5rZXlzKHZhbHVlKTsKICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBmaWVsZHMubGVuZ3RoOyBqKyspIHsKICAgICAgICB2YXIgZmllbGQgPSByZXBsYWNlUG9zaXRpb25hbE9wZXJhdG9yKGZpZWxkc1tqXSwgcG9zaXRpb25hbE1hdGNoSW5mbyk7CiAgICAgICAgZGVsZXRlIGRvY1tmaWVsZF07CiAgICAgIH0KICAgIH0gZWxzZSBpZiAoa2V5ID09ICIkbWluIikgewogICAgICB2YXIgZmllbGRzID0gT2JqZWN0LmtleXModmFsdWUpOwogICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGZpZWxkcy5sZW5ndGg7IGorKykgewogICAgICAgIHZhciBmaWVsZCA9IHJlcGxhY2VQb3NpdGlvbmFsT3BlcmF0b3IoZmllbGRzW2pdLCBwb3NpdGlvbmFsTWF0Y2hJbmZvKTsKICAgICAgICB2YXIgYW1vdW50ID0gdmFsdWVbZmllbGRzW2pdXTsKICAgICAgICBpZiAoaGFzRmlsdGVyZWRQb3NpdGlvbmFsT3BlcmF0b3IoZmllbGQpKSB7CiAgICAgICAgICBpZiAoIXVzZXJBcnJheUZpbHRlcnMpIHsKICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCJhcnJheUZpbHRlcnMgb3B0aW9uIGlzIHJlcXVpcmVkIHdoZW4gdXNpbmcgZmlsdGVyZWQgcG9zaXRpb25hbCBvcGVyYXRvciAkWzxpZGVudGlmaWVyPl0iKTsKICAgICAgICAgIH0KICAgICAgICAgIGNvbnN0IHBhcnNlZFBhdGggPSBwYXJzZUZpZWxkUGF0aChmaWVsZCk7CiAgICAgICAgICBhcHBseVRvRmlsdGVyZWRBcnJheUVsZW1lbnRzKGRvYywgcGFyc2VkUGF0aCwgYW1vdW50LCAiJG1pbiIsIHVzZXJBcnJheUZpbHRlcnMpOwogICAgICAgIH0gZWxzZSBpZiAoaGFzQWxsUG9zaXRpb25hbChmaWVsZCkpIHsKICAgICAgICAgIGFwcGx5VG9BbGxQb3NpdGlvbmFsKGRvYywgZmllbGQsIGZ1bmN0aW9uKHZhbCkgewogICAgICAgICAgICByZXR1cm4gTWF0aC5taW4odmFsLCBhbW91bnQpOwogICAgICAgICAgfSk7CiAgICAgICAgfSBlbHNlIHsKICAgICAgICAgIHZhciBjdXJyZW50VmFsdWUgPSBnZXRQcm9wKGRvYywgZmllbGQpOwogICAgICAgICAgc2V0UHJvcChkb2MsIGZpZWxkLCBNYXRoLm1pbihjdXJyZW50VmFsdWUsIGFtb3VudCkpOwogICAgICAgIH0KICAgICAgfQogICAgfSBlbHNlIGlmIChrZXkgPT0gIiRtYXgiKSB7CiAgICAgIHZhciBmaWVsZHMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7CiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZmllbGRzLmxlbmd0aDsgaisrKSB7CiAgICAgICAgdmFyIGZpZWxkID0gcmVwbGFjZVBvc2l0aW9uYWxPcGVyYXRvcihmaWVsZHNbal0sIHBvc2l0aW9uYWxNYXRjaEluZm8pOwogICAgICAgIHZhciBhbW91bnQgPSB2YWx1ZVtmaWVsZHNbal1dOwogICAgICAgIGlmIChoYXNGaWx0ZXJlZFBvc2l0aW9uYWxPcGVyYXRvcihmaWVsZCkpIHsKICAgICAgICAgIGlmICghdXNlckFycmF5RmlsdGVycykgewogICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoImFycmF5RmlsdGVycyBvcHRpb24gaXMgcmVxdWlyZWQgd2hlbiB1c2luZyBmaWx0ZXJlZCBwb3NpdGlvbmFsIG9wZXJhdG9yICRbPGlkZW50aWZpZXI+XSIpOwogICAgICAgICAgfQogICAgICAgICAgY29uc3QgcGFyc2VkUGF0aCA9IHBhcnNlRmllbGRQYXRoKGZpZWxkKTsKICAgICAgICAgIGFwcGx5VG9GaWx0ZXJlZEFycmF5RWxlbWVudHMoZG9jLCBwYXJzZWRQYXRoLCBhbW91bnQsICIkbWF4IiwgdXNlckFycmF5RmlsdGVycyk7CiAgICAgICAgfSBlbHNlIGlmIChoYXNBbGxQb3NpdGlvbmFsKGZpZWxkKSkgewogICAgICAgICAgYXBwbHlUb0FsbFBvc2l0aW9uYWwoZG9jLCBmaWVsZCwgZnVuY3Rpb24odmFsKSB7CiAgICAgICAgICAgIHJldHVybiBNYXRoLm1heCh2YWwsIGFtb3VudCk7CiAgICAgICAgICB9KTsKICAgICAgICB9IGVsc2UgewogICAgICAgICAgdmFyIGN1cnJlbnRWYWx1ZSA9IGdldFByb3AoZG9jLCBmaWVsZCk7CiAgICAgICAgICBzZXRQcm9wKGRvYywgZmllbGQsIE1hdGgubWF4KGN1cnJlbnRWYWx1ZSwgYW1vdW50KSk7CiAgICAgICAgfQogICAgICB9CiAgICB9IGVsc2UgaWYgKGtleSA9PSAiJGN1cnJlbnREYXRlIikgewogICAgICB2YXIgZmllbGRzID0gT2JqZWN0LmtleXModmFsdWUpOwogICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGZpZWxkcy5sZW5ndGg7IGorKykgewogICAgICAgIHZhciBmaWVsZCA9IHJlcGxhY2VQb3NpdGlvbmFsT3BlcmF0b3IoZmllbGRzW2pdLCBwb3NpdGlvbmFsTWF0Y2hJbmZvKTsKICAgICAgICB2YXIgdHlwZVNwZWMgPSB2YWx1ZVtmaWVsZHNbal1dOwogICAgICAgIGlmICh0eXBlU3BlYyA9PT0gdHJ1ZSB8fCB0eXBlb2YgdHlwZVNwZWMgPT09ICJvYmplY3QiICYmIHR5cGVTcGVjLiR0eXBlID09PSAiZGF0ZSIpIHsKICAgICAgICAgIHNldFByb3AoZG9jLCBmaWVsZCwgLyogQF9fUFVSRV9fICovIG5ldyBEYXRlKCkpOwogICAgICAgIH0gZWxzZSB7CiAgICAgICAgICBzZXRQcm9wKGRvYywgZmllbGQsIC8qIEBfX1BVUkVfXyAqLyBuZXcgRGF0ZSgpKTsKICAgICAgICB9CiAgICAgIH0KICAgIH0gZWxzZSBpZiAoa2V5ID09ICIkYWRkVG9TZXQiKSB7CiAgICAgIHZhciBmaWVsZHMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7CiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZmllbGRzLmxlbmd0aDsgaisrKSB7CiAgICAgICAgdmFyIGZpZWxkID0gcmVwbGFjZVBvc2l0aW9uYWxPcGVyYXRvcihmaWVsZHNbal0sIHBvc2l0aW9uYWxNYXRjaEluZm8pOwogICAgICAgIHZhciBhZGRWYWx1ZSA9IHZhbHVlW2ZpZWxkc1tqXV07CiAgICAgICAgdmFyIGN1cnJlbnRBcnJheSA9IGdldFByb3AoZG9jLCBmaWVsZCk7CiAgICAgICAgaWYgKGN1cnJlbnRBcnJheSAmJiBBcnJheS5pc0FycmF5KGN1cnJlbnRBcnJheSkpIHsKICAgICAgICAgIGN1cnJlbnRBcnJheS5wdXNoKGFkZFZhbHVlKTsKICAgICAgICB9CiAgICAgIH0KICAgIH0gZWxzZSBpZiAoa2V5ID09ICIkcG9wIikgewogICAgICB2YXIgZmllbGRzID0gT2JqZWN0LmtleXModmFsdWUpOwogICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGZpZWxkcy5sZW5ndGg7IGorKykgewogICAgICAgIHZhciBmaWVsZCA9IHJlcGxhY2VQb3NpdGlvbmFsT3BlcmF0b3IoZmllbGRzW2pdLCBwb3NpdGlvbmFsTWF0Y2hJbmZvKTsKICAgICAgICB2YXIgcG9wVmFsdWUgPSB2YWx1ZVtmaWVsZHNbal1dOwogICAgICAgIHZhciBjdXJyZW50QXJyYXkgPSBnZXRQcm9wKGRvYywgZmllbGQpOwogICAgICAgIGlmIChjdXJyZW50QXJyYXkgJiYgQXJyYXkuaXNBcnJheShjdXJyZW50QXJyYXkpKSB7CiAgICAgICAgICBpZiAocG9wVmFsdWUgPT0gMSkgewogICAgICAgICAgICBjdXJyZW50QXJyYXkucG9wKCk7CiAgICAgICAgICB9IGVsc2UgaWYgKHBvcFZhbHVlID09IC0xKSB7CiAgICAgICAgICAgIGN1cnJlbnRBcnJheS5zaGlmdCgpOwogICAgICAgICAgfQogICAgICAgIH0KICAgICAgfQogICAgfSBlbHNlIGlmIChrZXkgPT0gIiRwdWxsIikgewogICAgICB2YXIgZmllbGRzID0gT2JqZWN0LmtleXModmFsdWUpOwogICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGZpZWxkcy5sZW5ndGg7IGorKykgewogICAgICAgIHZhciBmaWVsZCA9IHJlcGxhY2VQb3NpdGlvbmFsT3BlcmF0b3IoZmllbGRzW2pdLCBwb3NpdGlvbmFsTWF0Y2hJbmZvKTsKICAgICAgICB2YXIgY29uZGl0aW9uID0gdmFsdWVbZmllbGRzW2pdXTsKICAgICAgICB2YXIgc3JjID0gZ2V0UHJvcChkb2MsIGZpZWxkKTsKICAgICAgICBpZiAoc3JjID09IHZvaWQgMCB8fCAhQXJyYXkuaXNBcnJheShzcmMpKSBjb250aW51ZTsKICAgICAgICB2YXIgbm90UmVtb3ZlZCA9IFtdOwogICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgc3JjLmxlbmd0aDsgaysrKSB7CiAgICAgICAgICB2YXIgZWxlbWVudCA9IHNyY1trXTsKICAgICAgICAgIHZhciBzaG91bGRSZW1vdmUgPSBmYWxzZTsKICAgICAgICAgIGlmICh0eXBlb2YgY29uZGl0aW9uID09PSAib2JqZWN0IiAmJiBjb25kaXRpb24gIT09IG51bGwgJiYgIUFycmF5LmlzQXJyYXkoY29uZGl0aW9uKSkgewogICAgICAgICAgICBpZiAodHlwZW9mIGVsZW1lbnQgPT09ICJvYmplY3QiICYmIGVsZW1lbnQgIT09IG51bGwgJiYgIUFycmF5LmlzQXJyYXkoZWxlbWVudCkpIHsKICAgICAgICAgICAgICBzaG91bGRSZW1vdmUgPSBtYXRjaGVzKGVsZW1lbnQsIGNvbmRpdGlvbik7CiAgICAgICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgICAgdmFyIHRlbXBEb2MgPSB7IF9fdGVtcDogZWxlbWVudCB9OwogICAgICAgICAgICAgIHNob3VsZFJlbW92ZSA9IG9wTWF0Y2hlcyh0ZW1wRG9jLCAiX190ZW1wIiwgY29uZGl0aW9uKTsKICAgICAgICAgICAgfQogICAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgc2hvdWxkUmVtb3ZlID0gZWxlbWVudCA9PSBjb25kaXRpb247CiAgICAgICAgICB9CiAgICAgICAgICBpZiAoIXNob3VsZFJlbW92ZSkgbm90UmVtb3ZlZC5wdXNoKGVsZW1lbnQpOwogICAgICAgIH0KICAgICAgICBzZXRQcm9wKGRvYywgZmllbGQsIG5vdFJlbW92ZWQpOwogICAgICB9CiAgICB9IGVsc2UgaWYgKGtleSA9PSAiJHB1bGxBbGwiKSB7CiAgICAgIHZhciBmaWVsZHMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7CiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZmllbGRzLmxlbmd0aDsgaisrKSB7CiAgICAgICAgdmFyIGZpZWxkID0gcmVwbGFjZVBvc2l0aW9uYWxPcGVyYXRvcihmaWVsZHNbal0sIHBvc2l0aW9uYWxNYXRjaEluZm8pOwogICAgICAgIHZhciBzcmMgPSBnZXRQcm9wKGRvYywgZmllbGQpOwogICAgICAgIHZhciB0b1JlbW92ZSA9IHZhbHVlW2ZpZWxkc1tqXV07CiAgICAgICAgdmFyIG5vdFJlbW92ZWQgPSBbXTsKICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IHNyYy5sZW5ndGg7IGsrKykgewogICAgICAgICAgdmFyIHJlbW92ZWQgPSBmYWxzZTsKICAgICAgICAgIGZvciAodmFyIGwgPSAwOyBsIDwgdG9SZW1vdmUubGVuZ3RoOyBsKyspIHsKICAgICAgICAgICAgaWYgKHNyY1trXSA9PSB0b1JlbW92ZVtsXSkgewogICAgICAgICAgICAgIHJlbW92ZWQgPSB0cnVlOwogICAgICAgICAgICAgIGJyZWFrOwogICAgICAgICAgICB9CiAgICAgICAgICB9CiAgICAgICAgICBpZiAoIXJlbW92ZWQpIG5vdFJlbW92ZWQucHVzaChzcmNba10pOwogICAgICAgIH0KICAgICAgICBzZXRQcm9wKGRvYywgZmllbGQsIG5vdFJlbW92ZWQpOwogICAgICB9CiAgICB9IGVsc2UgaWYgKGtleSA9PSAiJHB1c2hBbGwiKSB7CiAgICAgIHZhciBmaWVsZHMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7CiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZmllbGRzLmxlbmd0aDsgaisrKSB7CiAgICAgICAgdmFyIGZpZWxkID0gcmVwbGFjZVBvc2l0aW9uYWxPcGVyYXRvcihmaWVsZHNbal0sIHBvc2l0aW9uYWxNYXRjaEluZm8pOwogICAgICAgIHZhciB2YWx1ZXMgPSB2YWx1ZVtmaWVsZHNbal1dOwogICAgICAgIHZhciBjdXJyZW50QXJyYXkgPSBnZXRQcm9wKGRvYywgZmllbGQpOwogICAgICAgIGlmIChjdXJyZW50QXJyYXkgJiYgQXJyYXkuaXNBcnJheShjdXJyZW50QXJyYXkpKSB7CiAgICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IHZhbHVlcy5sZW5ndGg7IGsrKykgewogICAgICAgICAgICBjdXJyZW50QXJyYXkucHVzaCh2YWx1ZXNba10pOwogICAgICAgICAgfQogICAgICAgIH0KICAgICAgfQogICAgfSBlbHNlIGlmIChrZXkgPT0gIiRwdXNoIikgewogICAgICB2YXIgZmllbGRzID0gT2JqZWN0LmtleXModmFsdWUpOwogICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGZpZWxkcy5sZW5ndGg7IGorKykgewogICAgICAgIHZhciBmaWVsZCA9IHJlcGxhY2VQb3NpdGlvbmFsT3BlcmF0b3IoZmllbGRzW2pdLCBwb3NpdGlvbmFsTWF0Y2hJbmZvKTsKICAgICAgICB2YXIgcHVzaFZhbHVlID0gdmFsdWVbZmllbGRzW2pdXTsKICAgICAgICB2YXIgaXNNb2RpZmllclB1c2ggPSBwdXNoVmFsdWUgIT09IG51bGwgJiYgdHlwZW9mIHB1c2hWYWx1ZSA9PT0gIm9iamVjdCIgJiYgKHB1c2hWYWx1ZS4kZWFjaCAhPT0gdm9pZCAwIHx8IHB1c2hWYWx1ZS4kcG9zaXRpb24gIT09IHZvaWQgMCB8fCBwdXNoVmFsdWUuJHNsaWNlICE9PSB2b2lkIDAgfHwgcHVzaFZhbHVlLiRzb3J0ICE9PSB2b2lkIDApOwogICAgICAgIGlmIChpc01vZGlmaWVyUHVzaCkgewogICAgICAgICAgdmFyIGN1cnJlbnRBcnJheSA9IGdldFByb3AoZG9jLCBmaWVsZCk7CiAgICAgICAgICBpZiAoIWN1cnJlbnRBcnJheSkgewogICAgICAgICAgICBjdXJyZW50QXJyYXkgPSBbXTsKICAgICAgICAgICAgc2V0UHJvcChkb2MsIGZpZWxkLCBjdXJyZW50QXJyYXkpOwogICAgICAgICAgfQogICAgICAgICAgdmFyIHZhbHVlc1RvUHVzaCA9IHB1c2hWYWx1ZS4kZWFjaCAhPT0gdm9pZCAwID8gcHVzaFZhbHVlLiRlYWNoIDogW3B1c2hWYWx1ZV07CiAgICAgICAgICB2YXIgcG9zaXRpb24gPSBwdXNoVmFsdWUuJHBvc2l0aW9uICE9PSB2b2lkIDAgPyBwdXNoVmFsdWUuJHBvc2l0aW9uIDogY3VycmVudEFycmF5Lmxlbmd0aDsKICAgICAgICAgIGlmIChwb3NpdGlvbiA8IDApIHsKICAgICAgICAgICAgcG9zaXRpb24gPSBNYXRoLm1heCgwLCBjdXJyZW50QXJyYXkubGVuZ3RoICsgcG9zaXRpb24pOwogICAgICAgICAgfQogICAgICAgICAgY3VycmVudEFycmF5LnNwbGljZShwb3NpdGlvbiwgMCwgLi4udmFsdWVzVG9QdXNoKTsKICAgICAgICAgIGlmIChwdXNoVmFsdWUuJHNvcnQgIT09IHZvaWQgMCkgewogICAgICAgICAgICB2YXIgc29ydFNwZWMgPSBwdXNoVmFsdWUuJHNvcnQ7CiAgICAgICAgICAgIGlmICh0eXBlb2Ygc29ydFNwZWMgPT09ICJudW1iZXIiKSB7CiAgICAgICAgICAgICAgY3VycmVudEFycmF5LnNvcnQoZnVuY3Rpb24oYSwgYikgewogICAgICAgICAgICAgICAgaWYgKGEgPCBiKSByZXR1cm4gc29ydFNwZWMgPiAwID8gLTEgOiAxOwogICAgICAgICAgICAgICAgaWYgKGEgPiBiKSByZXR1cm4gc29ydFNwZWMgPiAwID8gMSA6IC0xOwogICAgICAgICAgICAgICAgcmV0dXJuIDA7CiAgICAgICAgICAgICAgfSk7CiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHNvcnRTcGVjID09PSAib2JqZWN0IikgewogICAgICAgICAgICAgIGN1cnJlbnRBcnJheS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsKICAgICAgICAgICAgICAgIHZhciBzb3J0S2V5cyA9IE9iamVjdC5rZXlzKHNvcnRTcGVjKTsKICAgICAgICAgICAgICAgIGZvciAodmFyIGsyID0gMDsgazIgPCBzb3J0S2V5cy5sZW5ndGg7IGsyKyspIHsKICAgICAgICAgICAgICAgICAgdmFyIHNvcnRLZXkgPSBzb3J0S2V5c1trMl07CiAgICAgICAgICAgICAgICAgIHZhciBzb3J0RGlyID0gc29ydFNwZWNbc29ydEtleV07CiAgICAgICAgICAgICAgICAgIHZhciBhVmFsID0gZ2V0UHJvcChhLCBzb3J0S2V5KTsKICAgICAgICAgICAgICAgICAgdmFyIGJWYWwgPSBnZXRQcm9wKGIsIHNvcnRLZXkpOwogICAgICAgICAgICAgICAgICBpZiAoYVZhbCA8IGJWYWwpIHJldHVybiBzb3J0RGlyID4gMCA/IC0xIDogMTsKICAgICAgICAgICAgICAgICAgaWYgKGFWYWwgPiBiVmFsKSByZXR1cm4gc29ydERpciA+IDAgPyAxIDogLTE7CiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICByZXR1cm4gMDsKICAgICAgICAgICAgICB9KTsKICAgICAgICAgICAgfQogICAgICAgICAgfQogICAgICAgICAgaWYgKHB1c2hWYWx1ZS4kc2xpY2UgIT09IHZvaWQgMCkgewogICAgICAgICAgICB2YXIgc2xpY2VWYWx1ZSA9IHB1c2hWYWx1ZS4kc2xpY2U7CiAgICAgICAgICAgIGlmIChzbGljZVZhbHVlIDwgMCkgewogICAgICAgICAgICAgIHZhciBzbGljZWQgPSBjdXJyZW50QXJyYXkuc2xpY2Uoc2xpY2VWYWx1ZSk7CiAgICAgICAgICAgICAgc2V0UHJvcChkb2MsIGZpZWxkLCBzbGljZWQpOwogICAgICAgICAgICB9IGVsc2UgaWYgKHNsaWNlVmFsdWUgPT09IDApIHsKICAgICAgICAgICAgICBzZXRQcm9wKGRvYywgZmllbGQsIFtdKTsKICAgICAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgICB2YXIgc2xpY2VkID0gY3VycmVudEFycmF5LnNsaWNlKDAsIHNsaWNlVmFsdWUpOwogICAgICAgICAgICAgIHNldFByb3AoZG9jLCBmaWVsZCwgc2xpY2VkKTsKICAgICAgICAgICAgfQogICAgICAgICAgfQogICAgICAgIH0gZWxzZSB7CiAgICAgICAgICB2YXIgY3VycmVudEFycmF5ID0gZ2V0UHJvcChkb2MsIGZpZWxkKTsKICAgICAgICAgIGlmIChjdXJyZW50QXJyYXkgJiYgQXJyYXkuaXNBcnJheShjdXJyZW50QXJyYXkpKSB7CiAgICAgICAgICAgIGN1cnJlbnRBcnJheS5wdXNoKHB1c2hWYWx1ZSk7CiAgICAgICAgICB9CiAgICAgICAgfQogICAgICB9CiAgICB9IGVsc2UgaWYgKGtleSA9PSAiJGJpdCIpIHsKICAgICAgdmFyIGZpZWxkcyA9IE9iamVjdC5rZXlzKHZhbHVlKTsKICAgICAgdmFyIGZpZWxkID0gcmVwbGFjZVBvc2l0aW9uYWxPcGVyYXRvcihmaWVsZHNbMF0sIHBvc2l0aW9uYWxNYXRjaEluZm8pOwogICAgICB2YXIgb3BlcmF0aW9uID0gdmFsdWVbZmllbGRzWzBdXTsKICAgICAgdmFyIG9wZXJhdG9yID0gT2JqZWN0LmtleXMob3BlcmF0aW9uKVswXTsKICAgICAgdmFyIG9wZXJhbmQgPSBvcGVyYXRpb25bb3BlcmF0b3JdOwogICAgICB2YXIgY3VycmVudFZhbHVlID0gZ2V0UHJvcChkb2MsIGZpZWxkKTsKICAgICAgaWYgKG9wZXJhdG9yID09ICJhbmQiKSB7CiAgICAgICAgc2V0UHJvcChkb2MsIGZpZWxkLCBjdXJyZW50VmFsdWUgJiBvcGVyYW5kKTsKICAgICAgfSBlbHNlIGlmIChvcGVyYXRvciA9PSAib3IiKSB7CiAgICAgICAgc2V0UHJvcChkb2MsIGZpZWxkLCBjdXJyZW50VmFsdWUgfCBvcGVyYW5kKTsKICAgICAgfSBlbHNlIGlmIChvcGVyYXRvciA9PSAieG9yIikgewogICAgICAgIHNldFByb3AoZG9jLCBmaWVsZCwgY3VycmVudFZhbHVlIF4gb3BlcmFuZCk7CiAgICAgIH0gZWxzZSB7CiAgICAgICAgdGhyb3cgInVua25vd24gJGJpdCBvcGVyYXRvcjogIiArIG9wZXJhdG9yOwogICAgICB9CiAgICB9IGVsc2UgewogICAgICB0aHJvdyAidW5rbm93biB1cGRhdGUgb3BlcmF0b3I6ICIgKyBrZXk7CiAgICB9CiAgfQp9CmZ1bmN0aW9uIGNyZWF0ZURvY0Zyb21VcGRhdGUocXVlcnksIHVwZGF0ZXMsIGlkKSB7CiAgdmFyIG5ld0RvYyA9IHsgX2lkOiBpZCB9OwogIHZhciBvbmx5RmllbGRzID0gdHJ1ZTsKICB2YXIgdXBkYXRlS2V5cyA9IE9iamVjdC5rZXlzKHVwZGF0ZXMpOwogIGZvciAodmFyIGkgPSAwOyBpIDwgdXBkYXRlS2V5cy5sZW5ndGg7IGkrKykgewogICAgaWYgKHVwZGF0ZUtleXNbaV0uY2hhckF0KDApID09ICIkIikgewogICAgICBvbmx5RmllbGRzID0gZmFsc2U7CiAgICAgIGJyZWFrOwogICAgfQogIH0KICBpZiAob25seUZpZWxkcykgewogICAgZm9yICh2YXIgaSA9IDA7IGkgPCB1cGRhdGVLZXlzLmxlbmd0aDsgaSsrKSB7CiAgICAgIG5ld0RvY1t1cGRhdGVLZXlzW2ldXSA9IHVwZGF0ZXNbdXBkYXRlS2V5c1tpXV07CiAgICB9CiAgfSBlbHNlIHsKICAgIHZhciBxdWVyeUtleXMgPSBPYmplY3Qua2V5cyhxdWVyeSk7CiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHF1ZXJ5S2V5cy5sZW5ndGg7IGkrKykgewogICAgICBuZXdEb2NbcXVlcnlLZXlzW2ldXSA9IHF1ZXJ5W3F1ZXJ5S2V5c1tpXV07CiAgICB9CiAgICBhcHBseVVwZGF0ZXModXBkYXRlcywgbmV3RG9jLCB0cnVlKTsKICB9CiAgcmV0dXJuIG5ld0RvYzsKfQpjbGFzcyBJbmRleCB7CiAgY29uc3RydWN0b3IobmFtZSwga2V5cywgc3RvcmFnZSwgb3B0aW9ucyA9IHt9KSB7CiAgICB0aGlzLm5hbWUgPSBuYW1lOwogICAgdGhpcy5rZXlzID0ga2V5czsKICAgIHRoaXMuc3RvcmFnZSA9IHN0b3JhZ2U7CiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zOwogIH0KICAvKioKICAgKiBBZGQgYSBkb2N1bWVudCB0byB0aGUgaW5kZXgKICAgKiBAcGFyYW0ge09iamVjdH0gZG9jIC0gVGhlIGRvY3VtZW50IHRvIGluZGV4CiAgICovCiAgYWRkKGRvYykgewogICAgdGhyb3cgbmV3IEVycm9yKCJhZGQoKSBtdXN0IGJlIGltcGxlbWVudGVkIGJ5IHN1YmNsYXNzIik7CiAgfQogIC8qKgogICAqIFJlbW92ZSBhIGRvY3VtZW50IGZyb20gdGhlIGluZGV4CiAgICogQHBhcmFtIHtPYmplY3R9IGRvYyAtIFRoZSBkb2N1bWVudCB0byByZW1vdmUKICAgKi8KICByZW1vdmUoZG9jKSB7CiAgICB0aHJvdyBuZXcgRXJyb3IoInJlbW92ZSgpIG11c3QgYmUgaW1wbGVtZW50ZWQgYnkgc3ViY2xhc3MiKTsKICB9CiAgLyoqCiAgICogVXBkYXRlIGEgZG9jdW1lbnQgaW4gdGhlIGluZGV4IChyZW1vdmUgb2xkLCBhZGQgbmV3KQogICAqIEBwYXJhbSB7T2JqZWN0fSBvbGREb2MgLSBUaGUgb2xkIGRvY3VtZW50CiAgICogQHBhcmFtIHtPYmplY3R9IG5ld0RvYyAtIFRoZSBuZXcgZG9jdW1lbnQKICAgKi8KICB1cGRhdGUob2xkRG9jLCBuZXdEb2MpIHsKICAgIHRoaXMucmVtb3ZlKG9sZERvYyk7CiAgICB0aGlzLmFkZChuZXdEb2MpOwogIH0KICAvKioKICAgKiBRdWVyeSB0aGUgaW5kZXgKICAgKiBAcGFyYW0geyp9IHF1ZXJ5IC0gVGhlIHF1ZXJ5IHRvIGV4ZWN1dGUKICAgKiBAcmV0dXJucyB7QXJyYXl9IEFycmF5IG9mIGRvY3VtZW50IElEcyBvciBudWxsIGlmIGluZGV4IGNhbm5vdCBzYXRpc2Z5IHF1ZXJ5CiAgICovCiAgcXVlcnkocXVlcnkpIHsKICAgIHRocm93IG5ldyBFcnJvcigicXVlcnkoKSBtdXN0IGJlIGltcGxlbWVudGVkIGJ5IHN1YmNsYXNzIik7CiAgfQogIC8qKgogICAqIENsZWFyIGFsbCBkYXRhIGZyb20gdGhlIGluZGV4CiAgICovCiAgY2xlYXIoKSB7CiAgICB0aHJvdyBuZXcgRXJyb3IoImNsZWFyKCkgbXVzdCBiZSBpbXBsZW1lbnRlZCBieSBzdWJjbGFzcyIpOwogIH0KICAvKioKICAgKiBHZXQgaW5kZXggc3BlY2lmaWNhdGlvbiAoZm9yIGdldEluZGV4ZXMoKSkKICAgKi8KICBnZXRTcGVjKCkgewogICAgcmV0dXJuIHsKICAgICAgbmFtZTogdGhpcy5uYW1lLAogICAgICBrZXk6IHRoaXMua2V5cwogICAgfTsKICB9Cn0KY29uc3QgVkVSU0lPTl9NRVRBREFUQV9TVUZGSVggPSAiLnZlcnNpb24uanNvbiI7CmNvbnN0IFZFUlNJT05fU1VGRklYID0gIi52IjsKY29uc3QgREVGQVVMVF9DT01QQUNUSU9OX01JTl9CWVRFUyA9IDE2ICogMTAyNDsKZnVuY3Rpb24gYnVpbGRWZXJzaW9uZWRQYXRoKGJhc2VQYXRoLCB2ZXJzaW9uKSB7CiAgY29uc3QgbnVtZXJpY1ZlcnNpb24gPSBOdW1iZXIodmVyc2lvbik7CiAgaWYgKCFOdW1iZXIuaXNGaW5pdGUobnVtZXJpY1ZlcnNpb24pKSB7CiAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdmVyc2lvbiB2YWx1ZTogJHt2ZXJzaW9ufWApOwogIH0KICBpZiAobnVtZXJpY1ZlcnNpb24gPCAwKSB7CiAgICB0aHJvdyBuZXcgRXJyb3IoYFZlcnNpb24gbXVzdCBiZSBub24tbmVnYXRpdmU6ICR7bnVtZXJpY1ZlcnNpb259YCk7CiAgfQogIGlmIChudW1lcmljVmVyc2lvbiA9PT0gMCkgewogICAgcmV0dXJuIGJhc2VQYXRoOwogIH0KICByZXR1cm4gYCR7YmFzZVBhdGh9JHtWRVJTSU9OX1NVRkZJWH0ke251bWVyaWNWZXJzaW9ufWA7Cn0KZnVuY3Rpb24gbm9ybWFsaXplTWV0YWRhdGEoZGF0YSkgewogIGNvbnN0IG1ldGFkYXRhID0geyBjdXJyZW50VmVyc2lvbjogMCwgcmVmQ291bnRzOiB7fSB9OwogIGlmICghZGF0YSB8fCB0eXBlb2YgZGF0YSAhPT0gIm9iamVjdCIpIHJldHVybiBtZXRhZGF0YTsKICBjb25zdCB2ZXJzaW9uID0gTnVtYmVyKGRhdGEuY3VycmVudFZlcnNpb24pOwogIG1ldGFkYXRhLmN1cnJlbnRWZXJzaW9uID0gTnVtYmVyLmlzRmluaXRlKHZlcnNpb24pID8gdmVyc2lvbiA6IDA7CiAgaWYgKGRhdGEucmVmQ291bnRzICYmIHR5cGVvZiBkYXRhLnJlZkNvdW50cyA9PT0gIm9iamVjdCIpIHsKICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKGRhdGEucmVmQ291bnRzKSkgewogICAgICBjb25zdCBjb3VudCA9IE51bWJlcih2YWx1ZSk7CiAgICAgIGlmIChOdW1iZXIuaXNGaW5pdGUoY291bnQpICYmIGNvdW50ID4gMCkgewogICAgICAgIG1ldGFkYXRhLnJlZkNvdW50c1tTdHJpbmcoa2V5KV0gPSBjb3VudDsKICAgICAgfSBlbHNlIGlmICghTnVtYmVyLmlzRmluaXRlKGNvdW50KSB8fCBjb3VudCA8IDApIHsKICAgICAgICBjb25zb2xlLndhcm4oYElnbm9yaW5nIGludmFsaWQgcmVmIGNvdW50IGZvciB2ZXJzaW9uICR7a2V5fTogJHt2YWx1ZX1gKTsKICAgICAgfQogICAgfQogIH0KICByZXR1cm4gbWV0YWRhdGE7Cn0KZnVuY3Rpb24gc3BsaXRQYXRoKGZpbGVQYXRoKSB7CiAgY29uc3QgcGFydHMgPSBmaWxlUGF0aC5zcGxpdCgiLyIpLmZpbHRlcihCb29sZWFuKTsKICBjb25zdCBmaWxlbmFtZSA9IHBhcnRzLnBvcCgpOwogIGlmICghZmlsZW5hbWUpIHsKICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBzdG9yYWdlIHBhdGg6ICR7ZmlsZVBhdGh9YCk7CiAgfQogIHJldHVybiB7IHBhcnRzLCBmaWxlbmFtZSB9Owp9CmFzeW5jIGZ1bmN0aW9uIGdldERpcmVjdG9yeUhhbmRsZShwYXRoUGFydHMsIGNyZWF0ZSkgewogIGxldCBkaXIgPSBhd2FpdCBnbG9iYWxUaGlzLm5hdmlnYXRvci5zdG9yYWdlLmdldERpcmVjdG9yeSgpOwogIGZvciAoY29uc3QgcGFydCBvZiBwYXRoUGFydHMpIHsKICAgIGRpciA9IGF3YWl0IGRpci5nZXREaXJlY3RvcnlIYW5kbGUocGFydCwgeyBjcmVhdGUgfSk7CiAgfQogIHJldHVybiBkaXI7Cn0KYXN5bmMgZnVuY3Rpb24gZW5zdXJlRGlyZWN0b3J5Rm9yRmlsZShmaWxlUGF0aCkgewogIGNvbnN0IHsgcGFydHMgfSA9IHNwbGl0UGF0aChmaWxlUGF0aCk7CiAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuOwogIGF3YWl0IGdldERpcmVjdG9yeUhhbmRsZShwYXJ0cywgdHJ1ZSk7Cn0KYXN5bmMgZnVuY3Rpb24gZ2V0RmlsZUhhbmRsZShmaWxlUGF0aCwgeyBjcmVhdGUgfSA9IHt9KSB7CiAgY29uc3QgeyBwYXJ0cywgZmlsZW5hbWUgfSA9IHNwbGl0UGF0aChmaWxlUGF0aCk7CiAgY29uc3QgZGlyID0gYXdhaXQgZ2V0RGlyZWN0b3J5SGFuZGxlKHBhcnRzLCAhIWNyZWF0ZSk7CiAgcmV0dXJuIGRpci5nZXRGaWxlSGFuZGxlKGZpbGVuYW1lLCB7IGNyZWF0ZSB9KTsKfQphc3luYyBmdW5jdGlvbiByZWFkTWV0YWRhdGEoYmFzZVBhdGgpIHsKICBjb25zdCBtZXRhZGF0YVBhdGggPSBgJHtiYXNlUGF0aH0ke1ZFUlNJT05fTUVUQURBVEFfU1VGRklYfWA7CiAgdHJ5IHsKICAgIGNvbnN0IGZpbGVIYW5kbGUgPSBhd2FpdCBnZXRGaWxlSGFuZGxlKG1ldGFkYXRhUGF0aCwgeyBjcmVhdGU6IGZhbHNlIH0pOwogICAgY29uc3QgZmlsZSA9IGF3YWl0IGZpbGVIYW5kbGUuZ2V0RmlsZSgpOwogICAgY29uc3QgdGV4dDIgPSBhd2FpdCBmaWxlLnRleHQoKTsKICAgIGlmICghdGV4dDIgfHwgdGV4dDIudHJpbSgpID09PSAiIikgewogICAgICByZXR1cm4gbm9ybWFsaXplTWV0YWRhdGEoKTsKICAgIH0KICAgIHJldHVybiBub3JtYWxpemVNZXRhZGF0YShKU09OLnBhcnNlKHRleHQyKSk7CiAgfSBjYXRjaCAoZXJyb3IpIHsKICAgIGlmIChlcnJvcj8ubmFtZSA9PT0gIk5vdEZvdW5kRXJyb3IiIHx8IGVycm9yPy5jb2RlID09PSAiRU5PRU5UIikgewogICAgICByZXR1cm4gbm9ybWFsaXplTWV0YWRhdGEoKTsKICAgIH0KICAgIHRocm93IGVycm9yOwogIH0KfQphc3luYyBmdW5jdGlvbiB3cml0ZU1ldGFkYXRhKGJhc2VQYXRoLCBtZXRhZGF0YSkgewogIGNvbnN0IG1ldGFkYXRhUGF0aCA9IGAke2Jhc2VQYXRofSR7VkVSU0lPTl9NRVRBREFUQV9TVUZGSVh9YDsKICBhd2FpdCBlbnN1cmVEaXJlY3RvcnlGb3JGaWxlKG1ldGFkYXRhUGF0aCk7CiAgY29uc3QgZmlsZUhhbmRsZSA9IGF3YWl0IGdldEZpbGVIYW5kbGUobWV0YWRhdGFQYXRoLCB7IGNyZWF0ZTogdHJ1ZSB9KTsKICBjb25zdCB3cml0YWJsZSA9IGF3YWl0IGZpbGVIYW5kbGUuY3JlYXRlV3JpdGFibGUoKTsKICBhd2FpdCB3cml0YWJsZS53cml0ZShKU09OLnN0cmluZ2lmeShtZXRhZGF0YSkpOwogIGF3YWl0IHdyaXRhYmxlLmNsb3NlKCk7Cn0KYXN5bmMgZnVuY3Rpb24gZGVsZXRlVmVyc2lvbmVkRmlsZXMoYmFzZVBhdGgsIHZlcnNpb24sIHN1ZmZpeGVzKSB7CiAgY29uc3QgdmVyc2lvbmVkQmFzZSA9IGJ1aWxkVmVyc2lvbmVkUGF0aChiYXNlUGF0aCwgdmVyc2lvbik7CiAgZm9yIChjb25zdCBzdWZmaXggb2Ygc3VmZml4ZXMpIHsKICAgIGNvbnN0IGZpbGVQYXRoID0gc3VmZml4ID8gYCR7dmVyc2lvbmVkQmFzZX0ke3N1ZmZpeH1gIDogdmVyc2lvbmVkQmFzZTsKICAgIGF3YWl0IHJlbW92ZUZpbGUoZmlsZVBhdGgpOwogIH0KfQphc3luYyBmdW5jdGlvbiBjbGVhbnVwVmVyc2lvbklmVW5yZWZlcmVuY2VkKGJhc2VQYXRoLCB2ZXJzaW9uLCBtZXRhZGF0YSwgc3VmZml4ZXMpIHsKICBpZiAodmVyc2lvbiA9PT0gbWV0YWRhdGEuY3VycmVudFZlcnNpb24pIHJldHVybjsKICBjb25zdCBrZXkgPSBTdHJpbmcodmVyc2lvbik7CiAgaWYgKG1ldGFkYXRhLnJlZkNvdW50c1trZXldKSByZXR1cm47CiAgYXdhaXQgZGVsZXRlVmVyc2lvbmVkRmlsZXMoYmFzZVBhdGgsIHZlcnNpb24sIHN1ZmZpeGVzKTsKfQphc3luYyBmdW5jdGlvbiBhY3F1aXJlVmVyc2lvbmVkUGF0aChiYXNlUGF0aCkgewogIGNvbnN0IG1ldGFkYXRhID0gYXdhaXQgcmVhZE1ldGFkYXRhKGJhc2VQYXRoKTsKICBjb25zdCBjdXJyZW50VmVyc2lvbiA9IG1ldGFkYXRhLmN1cnJlbnRWZXJzaW9uOwogIGNvbnN0IGtleSA9IFN0cmluZyhjdXJyZW50VmVyc2lvbik7CiAgbWV0YWRhdGEucmVmQ291bnRzW2tleV0gPSAobWV0YWRhdGEucmVmQ291bnRzW2tleV0gfHwgMCkgKyAxOwogIGF3YWl0IHdyaXRlTWV0YWRhdGEoYmFzZVBhdGgsIG1ldGFkYXRhKTsKICByZXR1cm4gewogICAgdmVyc2lvbjogY3VycmVudFZlcnNpb24sCiAgICBwYXRoOiBidWlsZFZlcnNpb25lZFBhdGgoYmFzZVBhdGgsIGN1cnJlbnRWZXJzaW9uKQogIH07Cn0KYXN5bmMgZnVuY3Rpb24gcmVsZWFzZVZlcnNpb25lZFBhdGgoYmFzZVBhdGgsIHZlcnNpb24sIHsgc3VmZml4ZXMgPSBbIiJdIH0gPSB7fSkgewogIGNvbnN0IG1ldGFkYXRhID0gYXdhaXQgcmVhZE1ldGFkYXRhKGJhc2VQYXRoKTsKICBjb25zdCBrZXkgPSBTdHJpbmcodmVyc2lvbik7CiAgaWYgKG1ldGFkYXRhLnJlZkNvdW50c1trZXldKSB7CiAgICBtZXRhZGF0YS5yZWZDb3VudHNba2V5XSAtPSAxOwogICAgaWYgKG1ldGFkYXRhLnJlZkNvdW50c1trZXldIDw9IDApIHsKICAgICAgZGVsZXRlIG1ldGFkYXRhLnJlZkNvdW50c1trZXldOwogICAgfQogIH0KICBhd2FpdCBjbGVhbnVwVmVyc2lvbklmVW5yZWZlcmVuY2VkKGJhc2VQYXRoLCB2ZXJzaW9uLCBtZXRhZGF0YSwgc3VmZml4ZXMpOwogIGF3YWl0IHdyaXRlTWV0YWRhdGEoYmFzZVBhdGgsIG1ldGFkYXRhKTsKfQphc3luYyBmdW5jdGlvbiBwcm9tb3RlVmVyc2lvbihiYXNlUGF0aCwgbmV3VmVyc2lvbiwgb2xkVmVyc2lvbiwgeyBzdWZmaXhlcyA9IFsiIl0gfSA9IHt9KSB7CiAgY29uc3QgbWV0YWRhdGEgPSBhd2FpdCByZWFkTWV0YWRhdGEoYmFzZVBhdGgpOwogIGNvbnN0IG5leHRWZXJzaW9uID0gTnVtYmVyKG5ld1ZlcnNpb24pOwogIG1ldGFkYXRhLmN1cnJlbnRWZXJzaW9uID0gTnVtYmVyLmlzRmluaXRlKG5leHRWZXJzaW9uKSA/IG5leHRWZXJzaW9uIDogbWV0YWRhdGEuY3VycmVudFZlcnNpb247CiAgY29uc3Qga2V5ID0gU3RyaW5nKG1ldGFkYXRhLmN1cnJlbnRWZXJzaW9uKTsKICBpZiAoIW1ldGFkYXRhLnJlZkNvdW50c1trZXldKSB7CiAgICBtZXRhZGF0YS5yZWZDb3VudHNba2V5XSA9IDA7CiAgfQogIGF3YWl0IGNsZWFudXBWZXJzaW9uSWZVbnJlZmVyZW5jZWQoYmFzZVBhdGgsIG9sZFZlcnNpb24sIG1ldGFkYXRhLCBzdWZmaXhlcyk7CiAgYXdhaXQgd3JpdGVNZXRhZGF0YShiYXNlUGF0aCwgbWV0YWRhdGEpOwp9CmFzeW5jIGZ1bmN0aW9uIGdldEN1cnJlbnRWZXJzaW9uKGJhc2VQYXRoKSB7CiAgY29uc3QgbWV0YWRhdGEgPSBhd2FpdCByZWFkTWV0YWRhdGEoYmFzZVBhdGgpOwogIHJldHVybiBtZXRhZGF0YS5jdXJyZW50VmVyc2lvbjsKfQphc3luYyBmdW5jdGlvbiByZW1vdmVGaWxlKGZpbGVQYXRoKSB7CiAgdHJ5IHsKICAgIGNvbnN0IHsgcGFydHMsIGZpbGVuYW1lIH0gPSBzcGxpdFBhdGgoZmlsZVBhdGgpOwogICAgY29uc3QgZGlyID0gYXdhaXQgZ2V0RGlyZWN0b3J5SGFuZGxlKHBhcnRzLCBmYWxzZSk7CiAgICBhd2FpdCBkaXIucmVtb3ZlRW50cnkoZmlsZW5hbWUpOwogIH0gY2F0Y2ggKGVycm9yKSB7CiAgICBpZiAoZXJyb3I/Lm5hbWUgPT09ICJOb3RGb3VuZEVycm9yIiB8fCBlcnJvcj8uY29kZSA9PT0gIkVOT0VOVCIpIHsKICAgICAgcmV0dXJuOwogICAgfQogICAgdGhyb3cgZXJyb3I7CiAgfQp9CmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVN5bmNBY2Nlc3NIYW5kbGUoZmlsZVBhdGgsIHsgcmVzZXQgPSBmYWxzZSB9ID0ge30pIHsKICBpZiAocmVzZXQpIHsKICAgIGF3YWl0IHJlbW92ZUZpbGUoZmlsZVBhdGgpOwogIH0KICBhd2FpdCBlbnN1cmVEaXJlY3RvcnlGb3JGaWxlKGZpbGVQYXRoKTsKICBjb25zdCBmaWxlSGFuZGxlID0gYXdhaXQgZ2V0RmlsZUhhbmRsZShmaWxlUGF0aCwgeyBjcmVhdGU6IHRydWUgfSk7CiAgcmV0dXJuIGZpbGVIYW5kbGUuY3JlYXRlU3luY0FjY2Vzc0hhbmRsZSgpOwp9CmNsYXNzIFJlZ3VsYXJDb2xsZWN0aW9uSW5kZXggZXh0ZW5kcyBJbmRleCB7CiAgY29uc3RydWN0b3IobmFtZSwga2V5cywgc3RvcmFnZUZpbGVQYXRoLCBvcHRpb25zID0ge30pIHsKICAgIHN1cGVyKG5hbWUsIGtleXMsIHN0b3JhZ2VGaWxlUGF0aCwgb3B0aW9ucyk7CiAgICB0aGlzLnN0b3JhZ2VGaWxlUGF0aCA9IHN0b3JhZ2VGaWxlUGF0aDsKICAgIHRoaXMuc3RvcmFnZVZlcnNpb25lZFBhdGggPSBudWxsOwogICAgdGhpcy5zdG9yYWdlVmVyc2lvbiA9IDA7CiAgICB0aGlzLl9yZWxlYXNlU3RvcmFnZSA9IG51bGw7CiAgICB0aGlzLmRhdGEgPSBudWxsOwogICAgdGhpcy5zeW5jSGFuZGxlID0gbnVsbDsKICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7CiAgfQogIC8qKgogICAqIE9wZW4gdGhlIGluZGV4IGZpbGUKICAgKiBNdXN0IGJlIGNhbGxlZCBiZWZvcmUgdXNpbmcgdGhlIGluZGV4CiAgICovCiAgYXN5bmMgb3BlbigpIHsKICAgIGlmICh0aGlzLmlzT3BlbikgewogICAgICByZXR1cm47CiAgICB9CiAgICB0cnkgewogICAgICBjb25zdCB7IHZlcnNpb24sIHBhdGg6IHZlcnNpb25lZFBhdGggfSA9IGF3YWl0IGFjcXVpcmVWZXJzaW9uZWRQYXRoKHRoaXMuc3RvcmFnZUZpbGVQYXRoKTsKICAgICAgdGhpcy5zdG9yYWdlVmVyc2lvbiA9IHZlcnNpb247CiAgICAgIHRoaXMuc3RvcmFnZVZlcnNpb25lZFBhdGggPSB2ZXJzaW9uZWRQYXRoOwogICAgICB0aGlzLl9yZWxlYXNlU3RvcmFnZSA9ICgpID0+IHJlbGVhc2VWZXJzaW9uZWRQYXRoKHRoaXMuc3RvcmFnZUZpbGVQYXRoLCB2ZXJzaW9uKTsKICAgICAgY29uc3QgcGF0aFBhcnRzID0gdGhpcy5zdG9yYWdlVmVyc2lvbmVkUGF0aC5zcGxpdCgiLyIpLmZpbHRlcihCb29sZWFuKTsKICAgICAgY29uc3QgZmlsZW5hbWUgPSBwYXRoUGFydHMucG9wKCk7CiAgICAgIGlmICghZmlsZW5hbWUpIHsKICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgc3RvcmFnZSBwYXRoOiAke3RoaXMuc3RvcmFnZVZlcnNpb25lZFBhdGh9YCk7CiAgICAgIH0KICAgICAgbGV0IGRpckhhbmRsZSA9IGF3YWl0IGdsb2JhbFRoaXMubmF2aWdhdG9yLnN0b3JhZ2UuZ2V0RGlyZWN0b3J5KCk7CiAgICAgIGZvciAoY29uc3QgcGFydCBvZiBwYXRoUGFydHMpIHsKICAgICAgICBkaXJIYW5kbGUgPSBhd2FpdCBkaXJIYW5kbGUuZ2V0RGlyZWN0b3J5SGFuZGxlKHBhcnQsIHsgY3JlYXRlOiB0cnVlIH0pOwogICAgICB9CiAgICAgIGNvbnN0IGZpbGVIYW5kbGUgPSBhd2FpdCBkaXJIYW5kbGUuZ2V0RmlsZUhhbmRsZShmaWxlbmFtZSwgeyBjcmVhdGU6IHRydWUgfSk7CiAgICAgIHRoaXMuc3luY0hhbmRsZSA9IGF3YWl0IGZpbGVIYW5kbGUuY3JlYXRlU3luY0FjY2Vzc0hhbmRsZSgpOwogICAgICB0aGlzLmRhdGEgPSBuZXcgQlBsdXNUcmVlKHRoaXMuc3luY0hhbmRsZSwgNTApOwogICAgICBhd2FpdCB0aGlzLmRhdGEub3BlbigpOwogICAgICB0aGlzLmlzT3BlbiA9IHRydWU7CiAgICB9IGNhdGNoIChlcnJvcikgewogICAgICBpZiAoZXJyb3IubWVzc2FnZSAmJiAoZXJyb3IubWVzc2FnZS5pbmNsdWRlcygiVW5rbm93biB0eXBlIGJ5dGUiKSB8fCBlcnJvci5tZXNzYWdlLmluY2x1ZGVzKCJGYWlsZWQgdG8gcmVhZCBtZXRhZGF0YSIpIHx8IGVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoIkludmFsaWQgdHJlZSBmaWxlIikpKSB7CiAgICAgICAgaWYgKHRoaXMuc3luY0hhbmRsZSkgewogICAgICAgICAgdHJ5IHsKICAgICAgICAgICAgYXdhaXQgdGhpcy5zeW5jSGFuZGxlLmNsb3NlKCk7CiAgICAgICAgICB9IGNhdGNoIChlKSB7CiAgICAgICAgICB9CiAgICAgICAgICB0aGlzLnN5bmNIYW5kbGUgPSBudWxsOwogICAgICAgIH0KICAgICAgICBjb25zdCBwYXRoUGFydHMgPSB0aGlzLnN0b3JhZ2VWZXJzaW9uZWRQYXRoLnNwbGl0KCIvIikuZmlsdGVyKEJvb2xlYW4pOwogICAgICAgIGNvbnN0IGZpbGVuYW1lID0gcGF0aFBhcnRzLnBvcCgpOwogICAgICAgIGlmICghZmlsZW5hbWUpIHsKICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBzdG9yYWdlIHBhdGg6ICR7dGhpcy5zdG9yYWdlVmVyc2lvbmVkUGF0aH1gKTsKICAgICAgICB9CiAgICAgICAgbGV0IGRpckhhbmRsZSA9IGF3YWl0IGdsb2JhbFRoaXMubmF2aWdhdG9yLnN0b3JhZ2UuZ2V0RGlyZWN0b3J5KCk7CiAgICAgICAgZm9yIChjb25zdCBwYXJ0IG9mIHBhdGhQYXJ0cykgewogICAgICAgICAgZGlySGFuZGxlID0gYXdhaXQgZGlySGFuZGxlLmdldERpcmVjdG9yeUhhbmRsZShwYXJ0LCB7IGNyZWF0ZTogdHJ1ZSB9KTsKICAgICAgICB9CiAgICAgICAgdHJ5IHsKICAgICAgICAgIGF3YWl0IGRpckhhbmRsZS5yZW1vdmVFbnRyeShmaWxlbmFtZSk7CiAgICAgICAgfSBjYXRjaCAoZSkgewogICAgICAgIH0KICAgICAgICBjb25zdCBmaWxlSGFuZGxlID0gYXdhaXQgZGlySGFuZGxlLmdldEZpbGVIYW5kbGUoZmlsZW5hbWUsIHsgY3JlYXRlOiB0cnVlIH0pOwogICAgICAgIHRoaXMuc3luY0hhbmRsZSA9IGF3YWl0IGZpbGVIYW5kbGUuY3JlYXRlU3luY0FjY2Vzc0hhbmRsZSgpOwogICAgICAgIHRoaXMuZGF0YSA9IG5ldyBCUGx1c1RyZWUodGhpcy5zeW5jSGFuZGxlLCA1MCk7CiAgICAgICAgYXdhaXQgdGhpcy5kYXRhLm9wZW4oKTsKICAgICAgICB0aGlzLmlzT3BlbiA9IHRydWU7CiAgICAgIH0gZWxzZSB7CiAgICAgICAgdGhyb3cgZXJyb3I7CiAgICAgIH0KICAgIH0KICB9CiAgLyoqCiAgICogQ2xvc2UgdGhlIGluZGV4IGZpbGUKICAgKi8KICBhc3luYyBjbG9zZSgpIHsKICAgIGlmICghdGhpcy5pc09wZW4pIHsKICAgICAgaWYgKHRoaXMuX3JlbGVhc2VTdG9yYWdlKSB7CiAgICAgICAgYXdhaXQgdGhpcy5fcmVsZWFzZVN0b3JhZ2UoKTsKICAgICAgICB0aGlzLl9yZWxlYXNlU3RvcmFnZSA9IG51bGw7CiAgICAgIH0KICAgICAgcmV0dXJuOwogICAgfQogICAgdHJ5IHsKICAgICAgYXdhaXQgdGhpcy5fbWF5YmVDb21wYWN0KCk7CiAgICAgIGF3YWl0IHRoaXMuZGF0YS5jbG9zZSgpOwogICAgfSBjYXRjaCAoZXJyb3IpIHsKICAgICAgaWYgKCFlcnJvci5tZXNzYWdlIHx8ICFlcnJvci5tZXNzYWdlLmluY2x1ZGVzKCJGaWxlIGlzIG5vdCBvcGVuIikpIHsKICAgICAgICB0aHJvdyBlcnJvcjsKICAgICAgfQogICAgfQogICAgdGhpcy5pc09wZW4gPSBmYWxzZTsKICAgIGlmICh0aGlzLl9yZWxlYXNlU3RvcmFnZSkgewogICAgICBhd2FpdCB0aGlzLl9yZWxlYXNlU3RvcmFnZSgpOwogICAgICB0aGlzLl9yZWxlYXNlU3RvcmFnZSA9IG51bGw7CiAgICB9CiAgfQogIGFzeW5jIF9tYXliZUNvbXBhY3QoKSB7CiAgICBpZiAoIXRoaXMuZGF0YSB8fCAhdGhpcy5kYXRhLmZpbGUpIHJldHVybjsKICAgIGNvbnN0IGN1cnJlbnRWZXJzaW9uID0gYXdhaXQgZ2V0Q3VycmVudFZlcnNpb24odGhpcy5zdG9yYWdlRmlsZVBhdGgpOwogICAgaWYgKGN1cnJlbnRWZXJzaW9uICE9PSB0aGlzLnN0b3JhZ2VWZXJzaW9uKSByZXR1cm47CiAgICBjb25zdCBmaWxlU2l6ZSA9IHRoaXMuZGF0YS5maWxlLmdldEZpbGVTaXplKCk7CiAgICBpZiAoIWZpbGVTaXplIHx8IGZpbGVTaXplIDwgREVGQVVMVF9DT01QQUNUSU9OX01JTl9CWVRFUykgcmV0dXJuOwogICAgY29uc3QgbmV4dFZlcnNpb24gPSBjdXJyZW50VmVyc2lvbiArIDE7CiAgICBjb25zdCBjb21wYWN0UGF0aCA9IGJ1aWxkVmVyc2lvbmVkUGF0aCh0aGlzLnN0b3JhZ2VGaWxlUGF0aCwgbmV4dFZlcnNpb24pOwogICAgY29uc3QgZGVzdFN5bmNIYW5kbGUgPSBhd2FpdCBjcmVhdGVTeW5jQWNjZXNzSGFuZGxlKGNvbXBhY3RQYXRoLCB7IHJlc2V0OiB0cnVlIH0pOwogICAgYXdhaXQgdGhpcy5kYXRhLmNvbXBhY3QoZGVzdFN5bmNIYW5kbGUpOwogICAgYXdhaXQgcHJvbW90ZVZlcnNpb24odGhpcy5zdG9yYWdlRmlsZVBhdGgsIG5leHRWZXJzaW9uLCBjdXJyZW50VmVyc2lvbik7CiAgfQogIC8qKgogICAqIEV4dHJhY3QgaW5kZXgga2V5IHZhbHVlIGZyb20gYSBkb2N1bWVudAogICAqLwogIGV4dHJhY3RJbmRleEtleShkb2MpIHsKICAgIGNvbnN0IGtleUZpZWxkcyA9IE9iamVjdC5rZXlzKHRoaXMua2V5cyk7CiAgICBpZiAoa2V5RmllbGRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7CiAgICBpZiAoa2V5RmllbGRzLmxlbmd0aCA9PT0gMSkgewogICAgICBjb25zdCBmaWVsZCA9IGtleUZpZWxkc1swXTsKICAgICAgY29uc3QgdmFsdWUgPSBnZXRQcm9wKGRvYywgZmllbGQpOwogICAgICBpZiAodmFsdWUgPT09IHZvaWQgMCkgcmV0dXJuIG51bGw7CiAgICAgIHJldHVybiB2YWx1ZTsKICAgIH0KICAgIGNvbnN0IGtleVBhcnRzID0gW107CiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleUZpZWxkcy5sZW5ndGg7IGkrKykgewogICAgICBjb25zdCB2YWx1ZSA9IGdldFByb3AoZG9jLCBrZXlGaWVsZHNbaV0pOwogICAgICBpZiAodmFsdWUgPT09IHZvaWQgMCkgcmV0dXJuIG51bGw7CiAgICAgIGtleVBhcnRzLnB1c2goCiAgICAgICAgdmFsdWUKICAgICAgICAvKkpTT04uc3RyaW5naWZ5KHZhbHVlKSAqLwogICAgICApOwogICAgfQogICAgcmV0dXJuIGtleVBhcnRzLmpvaW4oIlwwIik7CiAgfQogIC8qKgogICAqIEFkZCBhIGRvY3VtZW50IHRvIHRoZSBpbmRleAogICAgKiAKICAgKiBAcGFyYW0ge09iamVjdH0gZG9jIC0gVGhlIGRvY3VtZW50IHRvIGluZGV4CiAgICovCiAgYXN5bmMgYWRkKGRvYykgewogICAgaWYgKCF0aGlzLmlzT3BlbikgewogICAgICBhd2FpdCB0aGlzLm9wZW4oKTsKICAgIH0KICAgIGNvbnN0IGluZGV4S2V5ID0gdGhpcy5leHRyYWN0SW5kZXhLZXkoZG9jKTsKICAgIGlmIChpbmRleEtleSAhPT0gbnVsbCkgewogICAgICBjb25zdCBkb2NJZCA9IGRvYy5faWQudG9TdHJpbmcoKTsKICAgICAgY29uc3QgZXhpc3RpbmcgPSBhd2FpdCB0aGlzLmRhdGEuc2VhcmNoKGluZGV4S2V5KTsKICAgICAgbGV0IGRvY0lkczsKICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZXhpc3RpbmcpKSB7CiAgICAgICAgaWYgKCFleGlzdGluZy5pbmNsdWRlcyhkb2NJZCkpIHsKICAgICAgICAgIGRvY0lkcyA9IFsuLi5leGlzdGluZywgZG9jSWRdOwogICAgICAgIH0gZWxzZSB7CiAgICAgICAgICByZXR1cm47CiAgICAgICAgfQogICAgICB9IGVsc2UgaWYgKGV4aXN0aW5nKSB7CiAgICAgICAgZG9jSWRzID0gZXhpc3RpbmcgPT09IGRvY0lkID8gW2V4aXN0aW5nXSA6IFtleGlzdGluZywgZG9jSWRdOwogICAgICB9IGVsc2UgewogICAgICAgIGRvY0lkcyA9IFtkb2NJZF07CiAgICAgIH0KICAgICAgYXdhaXQgdGhpcy5kYXRhLmFkZChpbmRleEtleSwgZG9jSWRzKTsKICAgIH0KICB9CiAgLyoqCiAgICogUmVtb3ZlIGEgZG9jdW1lbnQgZnJvbSB0aGUgaW5kZXgKICAgICogCiAgICogQHBhcmFtIHtPYmplY3R9IGRvYyAtIFRoZSBkb2N1bWVudCB0byByZW1vdmUKICAgKi8KICBhc3luYyByZW1vdmUoZG9jKSB7CiAgICBpZiAoIXRoaXMuaXNPcGVuKSB7CiAgICAgIGF3YWl0IHRoaXMub3BlbigpOwogICAgfQogICAgY29uc3QgaW5kZXhLZXkgPSB0aGlzLmV4dHJhY3RJbmRleEtleShkb2MpOwogICAgaWYgKGluZGV4S2V5ICE9PSBudWxsKSB7CiAgICAgIGNvbnN0IGRvY0lkID0gZG9jLl9pZC50b1N0cmluZygpOwogICAgICBjb25zdCBleGlzdGluZyA9IGF3YWl0IHRoaXMuZGF0YS5zZWFyY2goaW5kZXhLZXkpOwogICAgICBpZiAoQXJyYXkuaXNBcnJheShleGlzdGluZykpIHsKICAgICAgICBjb25zdCBmaWx0ZXJlZCA9IGV4aXN0aW5nLmZpbHRlcigoaWQpID0+IGlkICE9PSBkb2NJZCk7CiAgICAgICAgaWYgKGZpbHRlcmVkLmxlbmd0aCA+IDApIHsKICAgICAgICAgIGF3YWl0IHRoaXMuZGF0YS5hZGQoaW5kZXhLZXksIGZpbHRlcmVkKTsKICAgICAgICB9IGVsc2UgewogICAgICAgICAgYXdhaXQgdGhpcy5kYXRhLmRlbGV0ZShpbmRleEtleSk7CiAgICAgICAgfQogICAgICB9IGVsc2UgaWYgKGV4aXN0aW5nID09PSBkb2NJZCkgewogICAgICAgIGF3YWl0IHRoaXMuZGF0YS5kZWxldGUoaW5kZXhLZXkpOwogICAgICB9CiAgICB9CiAgfQogIC8qKgogICAqIFF1ZXJ5IHRoZSBpbmRleAogICAgKiAKICAgKiBAcGFyYW0geyp9IHF1ZXJ5IC0gVGhlIHF1ZXJ5IG9iamVjdAogICAqIEByZXR1cm5zIHtQcm9taXNlPEFycmF5fG51bGw+fSBBcnJheSBvZiBkb2N1bWVudCBJRHMgb3IgbnVsbCBpZiBpbmRleCBjYW5ub3Qgc2F0aXNmeSBxdWVyeQogICAqLwogIGFzeW5jIHF1ZXJ5KHF1ZXJ5KSB7CiAgICBjb25zdCBxdWVyeUtleXMgPSBPYmplY3Qua2V5cyhxdWVyeSk7CiAgICBjb25zdCBpbmRleEZpZWxkcyA9IE9iamVjdC5rZXlzKHRoaXMua2V5cyk7CiAgICBpZiAoaW5kZXhGaWVsZHMubGVuZ3RoICE9PSAxKSB7CiAgICAgIHJldHVybiBudWxsOwogICAgfQogICAgY29uc3QgZmllbGQgPSBpbmRleEZpZWxkc1swXTsKICAgIGlmIChxdWVyeUtleXMuaW5kZXhPZihmaWVsZCkgPT09IC0xKSB7CiAgICAgIHJldHVybiBudWxsOwogICAgfQogICAgY29uc3QgcXVlcnlWYWx1ZSA9IHF1ZXJ5W2ZpZWxkXTsKICAgIGlmICh0eXBlb2YgcXVlcnlWYWx1ZSAhPT0gIm9iamVjdCIgfHwgcXVlcnlWYWx1ZSA9PT0gbnVsbCkgewogICAgICBjb25zdCBpbmRleEtleSA9IHF1ZXJ5VmFsdWU7CiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuZGF0YS5zZWFyY2goaW5kZXhLZXkpOwogICAgICByZXR1cm4gcmVzdWx0IHx8IFtdOwogICAgfQogICAgaWYgKHR5cGVvZiBxdWVyeVZhbHVlID09PSAib2JqZWN0IiAmJiAhQXJyYXkuaXNBcnJheShxdWVyeVZhbHVlKSkgewogICAgICByZXR1cm4gYXdhaXQgdGhpcy5fcXVlcnlXaXRoT3BlcmF0b3JzKGZpZWxkLCBxdWVyeVZhbHVlKTsKICAgIH0KICAgIHJldHVybiBudWxsOwogIH0KICAvKioKICAgKiBRdWVyeSBpbmRleCB3aXRoIGNvbXBhcmlzb24gb3BlcmF0b3JzCiAgICAqIAogICAqIEBwcml2YXRlCiAgICovCiAgYXN5bmMgX3F1ZXJ5V2l0aE9wZXJhdG9ycyhmaWVsZCwgb3BlcmF0b3JzKSB7CiAgICBjb25zdCBvcHMgPSBPYmplY3Qua2V5cyhvcGVyYXRvcnMpOwogICAgY29uc3QgcmVzdWx0cyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgU2V0KCk7CiAgICBjb25zdCBoYXNSYW5nZU9wID0gb3BzLnNvbWUoKG9wKSA9PiBbIiRndCIsICIkZ3RlIiwgIiRsdCIsICIkbHRlIl0uaW5jbHVkZXMob3ApKTsKICAgIGlmIChoYXNSYW5nZU9wKSB7CiAgICAgIGNvbnN0IGhhc0d0ID0gb3BzLmluY2x1ZGVzKCIkZ3QiKSB8fCBvcHMuaW5jbHVkZXMoIiRndGUiKTsKICAgICAgY29uc3QgaGFzTHQgPSBvcHMuaW5jbHVkZXMoIiRsdCIpIHx8IG9wcy5pbmNsdWRlcygiJGx0ZSIpOwogICAgICBpZiAoaGFzR3QgJiYgaGFzTHQpIHsKICAgICAgICBjb25zdCBtaW5WYWx1ZSA9IG9wcy5pbmNsdWRlcygiJGd0ZSIpID8gb3BlcmF0b3JzWyIkZ3RlIl0gOiBvcHMuaW5jbHVkZXMoIiRndCIpID8gb3BlcmF0b3JzWyIkZ3QiXSA6IC1JbmZpbml0eTsKICAgICAgICBjb25zdCBtYXhWYWx1ZSA9IG9wcy5pbmNsdWRlcygiJGx0ZSIpID8gb3BlcmF0b3JzWyIkbHRlIl0gOiBvcHMuaW5jbHVkZXMoIiRsdCIpID8gb3BlcmF0b3JzWyIkbHQiXSA6IEluZmluaXR5OwogICAgICAgIGNvbnN0IHJhbmdlUmVzdWx0cyA9IGF3YWl0IHRoaXMuZGF0YS5yYW5nZVNlYXJjaChtaW5WYWx1ZSwgbWF4VmFsdWUpOwogICAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgcmFuZ2VSZXN1bHRzKSB7CiAgICAgICAgICBjb25zdCBrZXlWYWx1ZSA9IGVudHJ5LmtleTsKICAgICAgICAgIGNvbnN0IHZhbHVlID0gZW50cnkudmFsdWU7CiAgICAgICAgICBsZXQgbWF0Y2hlczIgPSB0cnVlOwogICAgICAgICAgaWYgKG9wcy5pbmNsdWRlcygiJGd0IikgJiYgIShrZXlWYWx1ZSA+IG9wZXJhdG9yc1siJGd0Il0pKSBtYXRjaGVzMiA9IGZhbHNlOwogICAgICAgICAgaWYgKG9wcy5pbmNsdWRlcygiJGd0ZSIpICYmICEoa2V5VmFsdWUgPj0gb3BlcmF0b3JzWyIkZ3RlIl0pKSBtYXRjaGVzMiA9IGZhbHNlOwogICAgICAgICAgaWYgKG9wcy5pbmNsdWRlcygiJGx0IikgJiYgIShrZXlWYWx1ZSA8IG9wZXJhdG9yc1siJGx0Il0pKSBtYXRjaGVzMiA9IGZhbHNlOwogICAgICAgICAgaWYgKG9wcy5pbmNsdWRlcygiJGx0ZSIpICYmICEoa2V5VmFsdWUgPD0gb3BlcmF0b3JzWyIkbHRlIl0pKSBtYXRjaGVzMiA9IGZhbHNlOwogICAgICAgICAgaWYgKG1hdGNoZXMyICYmIHZhbHVlKSB7CiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkgewogICAgICAgICAgICAgIHZhbHVlLmZvckVhY2goKGlkKSA9PiByZXN1bHRzLmFkZChpZCkpOwogICAgICAgICAgICB9IGVsc2UgewogICAgICAgICAgICAgIHJlc3VsdHMuYWRkKHZhbHVlKTsKICAgICAgICAgICAgfQogICAgICAgICAgfQogICAgICAgIH0KICAgICAgICByZXR1cm4gQXJyYXkuZnJvbShyZXN1bHRzKTsKICAgICAgfSBlbHNlIHsKICAgICAgICBjb25zdCBhbGxFbnRyaWVzID0gYXdhaXQgdGhpcy5kYXRhLnRvQXJyYXkoKTsKICAgICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGFsbEVudHJpZXMpIHsKICAgICAgICAgIGNvbnN0IGtleVZhbHVlID0gZW50cnkua2V5OwogICAgICAgICAgY29uc3QgdmFsdWUgPSBlbnRyeS52YWx1ZTsKICAgICAgICAgIGxldCBtYXRjaGVzMiA9IHRydWU7CiAgICAgICAgICBmb3IgKGNvbnN0IG9wIG9mIG9wcykgewogICAgICAgICAgICBjb25zdCBvcGVyYW5kID0gb3BlcmF0b3JzW29wXTsKICAgICAgICAgICAgaWYgKG9wID09PSAiJGd0IiAmJiAhKGtleVZhbHVlID4gb3BlcmFuZCkpIG1hdGNoZXMyID0gZmFsc2U7CiAgICAgICAgICAgIGVsc2UgaWYgKG9wID09PSAiJGd0ZSIgJiYgIShrZXlWYWx1ZSA+PSBvcGVyYW5kKSkgbWF0Y2hlczIgPSBmYWxzZTsKICAgICAgICAgICAgZWxzZSBpZiAob3AgPT09ICIkbHQiICYmICEoa2V5VmFsdWUgPCBvcGVyYW5kKSkgbWF0Y2hlczIgPSBmYWxzZTsKICAgICAgICAgICAgZWxzZSBpZiAob3AgPT09ICIkbHRlIiAmJiAhKGtleVZhbHVlIDw9IG9wZXJhbmQpKSBtYXRjaGVzMiA9IGZhbHNlOwogICAgICAgICAgICBlbHNlIGlmIChvcCA9PT0gIiRlcSIgJiYgIShrZXlWYWx1ZSA9PT0gb3BlcmFuZCkpIG1hdGNoZXMyID0gZmFsc2U7CiAgICAgICAgICAgIGVsc2UgaWYgKG9wID09PSAiJG5lIiAmJiAhKGtleVZhbHVlICE9PSBvcGVyYW5kKSkgbWF0Y2hlczIgPSBmYWxzZTsKICAgICAgICAgIH0KICAgICAgICAgIGlmIChtYXRjaGVzMiAmJiB2YWx1ZSkgewogICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHsKICAgICAgICAgICAgICB2YWx1ZS5mb3JFYWNoKChpZCkgPT4gcmVzdWx0cy5hZGQoaWQpKTsKICAgICAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgICByZXN1bHRzLmFkZCh2YWx1ZSk7CiAgICAgICAgICAgIH0KICAgICAgICAgIH0KICAgICAgICB9CiAgICAgICAgcmV0dXJuIEFycmF5LmZyb20ocmVzdWx0cyk7CiAgICAgIH0KICAgIH0KICAgIGlmIChvcHMuaW5jbHVkZXMoIiRpbiIpKSB7CiAgICAgIGNvbnN0IHZhbHVlcyA9IG9wZXJhdG9yc1siJGluIl07CiAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlcykpIHsKICAgICAgICBmb3IgKGNvbnN0IHZhbHVlIG9mIHZhbHVlcykgewogICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5kYXRhLnNlYXJjaCh2YWx1ZSk7CiAgICAgICAgICBpZiAocmVzdWx0KSB7CiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlc3VsdCkpIHsKICAgICAgICAgICAgICByZXN1bHQuZm9yRWFjaCgoaWQpID0+IHJlc3VsdHMuYWRkKGlkKSk7CiAgICAgICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgICAgcmVzdWx0cy5hZGQocmVzdWx0KTsKICAgICAgICAgICAgfQogICAgICAgICAgfQogICAgICAgIH0KICAgICAgICByZXR1cm4gQXJyYXkuZnJvbShyZXN1bHRzKTsKICAgICAgfQogICAgfQogICAgaWYgKG9wcy5pbmNsdWRlcygiJGVxIikpIHsKICAgICAgY29uc3QgdmFsdWUgPSBvcGVyYXRvcnNbIiRlcSJdOwogICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmRhdGEuc2VhcmNoKHZhbHVlKTsKICAgICAgaWYgKHJlc3VsdCkgewogICAgICAgIHJldHVybiBBcnJheS5pc0FycmF5KHJlc3VsdCkgPyByZXN1bHQgOiBbcmVzdWx0XTsKICAgICAgfQogICAgICByZXR1cm4gW107CiAgICB9CiAgICBpZiAob3BzLmluY2x1ZGVzKCIkbmUiKSkgewogICAgICBjb25zdCBleGNsdWRlVmFsdWUgPSBvcGVyYXRvcnNbIiRuZSJdOwogICAgICBjb25zdCBhbGxFbnRyaWVzID0gYXdhaXQgdGhpcy5kYXRhLnRvQXJyYXkoKTsKICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBhbGxFbnRyaWVzKSB7CiAgICAgICAgaWYgKGVudHJ5LmtleSAhPT0gZXhjbHVkZVZhbHVlICYmIGVudHJ5LnZhbHVlKSB7CiAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShlbnRyeS52YWx1ZSkpIHsKICAgICAgICAgICAgZW50cnkudmFsdWUuZm9yRWFjaCgoaWQpID0+IHJlc3VsdHMuYWRkKGlkKSk7CiAgICAgICAgICB9IGVsc2UgewogICAgICAgICAgICByZXN1bHRzLmFkZChlbnRyeS52YWx1ZSk7CiAgICAgICAgICB9CiAgICAgICAgfQogICAgICB9CiAgICAgIHJldHVybiBBcnJheS5mcm9tKHJlc3VsdHMpOwogICAgfQogICAgcmV0dXJuIG51bGw7CiAgfQogIC8qKgogICAqIENsZWFyIGFsbCBlbnRyaWVzIGZyb20gdGhlIGluZGV4CiAgICovCiAgYXN5bmMgY2xlYXIoKSB7CiAgICBpZiAodGhpcy5pc09wZW4pIHsKICAgICAgYXdhaXQgdGhpcy5jbG9zZSgpOwogICAgfQogICAgY29uc3QgY3VycmVudFZlcnNpb24gPSBhd2FpdCBnZXRDdXJyZW50VmVyc2lvbih0aGlzLnN0b3JhZ2VGaWxlUGF0aCk7CiAgICBjb25zdCB0YXJnZXRQYXRoID0gYnVpbGRWZXJzaW9uZWRQYXRoKHRoaXMuc3RvcmFnZUZpbGVQYXRoLCBjdXJyZW50VmVyc2lvbik7CiAgICBjb25zdCBwYXRoUGFydHMgPSB0YXJnZXRQYXRoLnNwbGl0KCIvIikuZmlsdGVyKEJvb2xlYW4pOwogICAgY29uc3QgZmlsZW5hbWUgPSBwYXRoUGFydHMucG9wKCk7CiAgICBsZXQgZGlySGFuZGxlID0gYXdhaXQgZ2xvYmFsVGhpcy5uYXZpZ2F0b3Iuc3RvcmFnZS5nZXREaXJlY3RvcnkoKTsKICAgIGZvciAoY29uc3QgcGFydCBvZiBwYXRoUGFydHMpIHsKICAgICAgZGlySGFuZGxlID0gYXdhaXQgZGlySGFuZGxlLmdldERpcmVjdG9yeUhhbmRsZShwYXJ0LCB7IGNyZWF0ZTogdHJ1ZSB9KTsKICAgIH0KICAgIHRyeSB7CiAgICAgIGF3YWl0IGRpckhhbmRsZS5yZW1vdmVFbnRyeShmaWxlbmFtZSk7CiAgICB9IGNhdGNoIChlKSB7CiAgICB9CiAgICBhd2FpdCB0aGlzLm9wZW4oKTsKICB9Cn0KY29uc3QgVEVYVF9JTkRFWF9TVUZGSVhFUyA9IFsiLXRlcm1zLmJqc29uIiwgIi1kb2N1bWVudHMuYmpzb24iLCAiLWxlbmd0aHMuYmpzb24iXTsKY2xhc3MgVGV4dENvbGxlY3Rpb25JbmRleCBleHRlbmRzIEluZGV4IHsKICBjb25zdHJ1Y3RvcihuYW1lLCBrZXlzLCBzdG9yYWdlLCBvcHRpb25zID0ge30pIHsKICAgIHN1cGVyKG5hbWUsIGtleXMsIHN0b3JhZ2UpOwogICAgdGhpcy5zdG9yYWdlQmFzZVBhdGggPSBzdG9yYWdlOwogICAgdGhpcy5zdG9yYWdlVmVyc2lvbiA9IDA7CiAgICB0aGlzLnZlcnNpb25lZEJhc2VQYXRoID0gbnVsbDsKICAgIHRoaXMuX3JlbGVhc2VTdG9yYWdlID0gbnVsbDsKICAgIHRoaXMudGV4dEluZGV4ID0gbnVsbDsKICAgIHRoaXMuc3luY0hhbmRsZXMgPSBbXTsKICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7CiAgICB0aGlzLmluZGV4ZWRGaWVsZHMgPSBbXTsKICAgIGZvciAoY29uc3QgZmllbGQgaW4ga2V5cykgewogICAgICBpZiAoa2V5c1tmaWVsZF0gPT09ICJ0ZXh0IikgewogICAgICAgIHRoaXMuaW5kZXhlZEZpZWxkcy5wdXNoKGZpZWxkKTsKICAgICAgfQogICAgfQogICAgaWYgKHRoaXMuaW5kZXhlZEZpZWxkcy5sZW5ndGggPT09IDApIHsKICAgICAgdGhyb3cgbmV3IEVycm9yKCdUZXh0IGluZGV4IG11c3QgaGF2ZSBhdCBsZWFzdCBvbmUgZmllbGQgd2l0aCB0eXBlICJ0ZXh0IicpOwogICAgfQogIH0KICAvKioKICAgKiBPcGVuIHRoZSBpbmRleCBmaWxlcwogICAqIE11c3QgYmUgY2FsbGVkIGJlZm9yZSB1c2luZyB0aGUgaW5kZXgKICAgKi8KICBhc3luYyBvcGVuKCkgewogICAgaWYgKHRoaXMuaXNPcGVuKSB7CiAgICAgIHJldHVybjsKICAgIH0KICAgIHRyeSB7CiAgICAgIGNvbnN0IHsgdmVyc2lvbiwgcGF0aDogdmVyc2lvbmVkQmFzZVBhdGggfSA9IGF3YWl0IGFjcXVpcmVWZXJzaW9uZWRQYXRoKHRoaXMuc3RvcmFnZUJhc2VQYXRoKTsKICAgICAgdGhpcy5zdG9yYWdlVmVyc2lvbiA9IHZlcnNpb247CiAgICAgIHRoaXMudmVyc2lvbmVkQmFzZVBhdGggPSB2ZXJzaW9uZWRCYXNlUGF0aDsKICAgICAgdGhpcy5fcmVsZWFzZVN0b3JhZ2UgPSAoKSA9PiByZWxlYXNlVmVyc2lvbmVkUGF0aCh0aGlzLnN0b3JhZ2VCYXNlUGF0aCwgdmVyc2lvbiwgeyBzdWZmaXhlczogVEVYVF9JTkRFWF9TVUZGSVhFUyB9KTsKICAgICAgY29uc3QgaW5kZXhUcmVlID0gYXdhaXQgdGhpcy5fY3JlYXRlQlBsdXNUcmVlKHRoaXMuX2dldEFjdGl2ZUJhc2VQYXRoKCkgKyAiLXRlcm1zLmJqc29uIik7CiAgICAgIGNvbnN0IGRvY1Rlcm1zVHJlZSA9IGF3YWl0IHRoaXMuX2NyZWF0ZUJQbHVzVHJlZSh0aGlzLl9nZXRBY3RpdmVCYXNlUGF0aCgpICsgIi1kb2N1bWVudHMuYmpzb24iKTsKICAgICAgY29uc3QgbGVuZ3Roc1RyZWUgPSBhd2FpdCB0aGlzLl9jcmVhdGVCUGx1c1RyZWUodGhpcy5fZ2V0QWN0aXZlQmFzZVBhdGgoKSArICItbGVuZ3Rocy5ianNvbiIpOwogICAgICB0aGlzLnRleHRJbmRleCA9IG5ldyBUZXh0SW5kZXgoewogICAgICAgIG9yZGVyOiAxNiwKICAgICAgICB0cmVlczogewogICAgICAgICAgaW5kZXg6IGluZGV4VHJlZSwKICAgICAgICAgIGRvY3VtZW50VGVybXM6IGRvY1Rlcm1zVHJlZSwKICAgICAgICAgIGRvY3VtZW50TGVuZ3RoczogbGVuZ3Roc1RyZWUKICAgICAgICB9CiAgICAgIH0pOwogICAgICBhd2FpdCB0aGlzLnRleHRJbmRleC5vcGVuKCk7CiAgICAgIHRoaXMuaXNPcGVuID0gdHJ1ZTsKICAgIH0gY2F0Y2ggKGVycm9yKSB7CiAgICAgIGlmIChlcnJvci5jb2RlID09PSAiRU5PRU5UIiB8fCBlcnJvci5tZXNzYWdlICYmIChlcnJvci5tZXNzYWdlLmluY2x1ZGVzKCJGYWlsZWQgdG8gcmVhZCBtZXRhZGF0YSIpIHx8IGVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoIm1pc3NpbmcgcmVxdWlyZWQgZmllbGRzIikgfHwgZXJyb3IubWVzc2FnZS5pbmNsdWRlcygiVW5rbm93biB0eXBlIGJ5dGUiKSB8fCBlcnJvci5tZXNzYWdlLmluY2x1ZGVzKCJJbnZhbGlkIikgfHwgZXJyb3IubWVzc2FnZS5pbmNsdWRlcygiZmlsZSB0b28gc21hbGwiKSkpIHsKICAgICAgICBhd2FpdCB0aGlzLl9jbG9zZVN5bmNIYW5kbGVzKCk7CiAgICAgICAgYXdhaXQgdGhpcy5fZGVsZXRlSW5kZXhGaWxlcygpOwogICAgICAgIGF3YWl0IHRoaXMuX2Vuc3VyZURpcmVjdG9yeUZvckZpbGUodGhpcy5fZ2V0QWN0aXZlQmFzZVBhdGgoKSArICItdGVybXMuYmpzb24iKTsKICAgICAgICBjb25zdCBpbmRleFRyZWUgPSBhd2FpdCB0aGlzLl9jcmVhdGVCUGx1c1RyZWUodGhpcy5fZ2V0QWN0aXZlQmFzZVBhdGgoKSArICItdGVybXMuYmpzb24iKTsKICAgICAgICBjb25zdCBkb2NUZXJtc1RyZWUgPSBhd2FpdCB0aGlzLl9jcmVhdGVCUGx1c1RyZWUodGhpcy5fZ2V0QWN0aXZlQmFzZVBhdGgoKSArICItZG9jdW1lbnRzLmJqc29uIik7CiAgICAgICAgY29uc3QgbGVuZ3Roc1RyZWUgPSBhd2FpdCB0aGlzLl9jcmVhdGVCUGx1c1RyZWUodGhpcy5fZ2V0QWN0aXZlQmFzZVBhdGgoKSArICItbGVuZ3Rocy5ianNvbiIpOwogICAgICAgIHRoaXMudGV4dEluZGV4ID0gbmV3IFRleHRJbmRleCh7CiAgICAgICAgICBvcmRlcjogMTYsCiAgICAgICAgICB0cmVlczogewogICAgICAgICAgICBpbmRleDogaW5kZXhUcmVlLAogICAgICAgICAgICBkb2N1bWVudFRlcm1zOiBkb2NUZXJtc1RyZWUsCiAgICAgICAgICAgIGRvY3VtZW50TGVuZ3RoczogbGVuZ3Roc1RyZWUKICAgICAgICAgIH0KICAgICAgICB9KTsKICAgICAgICBhd2FpdCB0aGlzLnRleHRJbmRleC5vcGVuKCk7CiAgICAgICAgdGhpcy5pc09wZW4gPSB0cnVlOwogICAgICB9IGVsc2UgewogICAgICAgIHRocm93IGVycm9yOwogICAgICB9CiAgICB9CiAgfQogIGFzeW5jIF9jcmVhdGVCUGx1c1RyZWUoZmlsZVBhdGgpIHsKICAgIGNvbnN0IHBhdGhQYXJ0cyA9IGZpbGVQYXRoLnNwbGl0KCIvIikuZmlsdGVyKEJvb2xlYW4pOwogICAgY29uc3QgZmlsZW5hbWUgPSBwYXRoUGFydHMucG9wKCk7CiAgICBpZiAoIWZpbGVuYW1lKSB7CiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBzdG9yYWdlIHBhdGg6ICR7ZmlsZVBhdGh9YCk7CiAgICB9CiAgICBsZXQgZGlySGFuZGxlID0gYXdhaXQgZ2xvYmFsVGhpcy5uYXZpZ2F0b3Iuc3RvcmFnZS5nZXREaXJlY3RvcnkoKTsKICAgIGZvciAoY29uc3QgcGFydCBvZiBwYXRoUGFydHMpIHsKICAgICAgZGlySGFuZGxlID0gYXdhaXQgZGlySGFuZGxlLmdldERpcmVjdG9yeUhhbmRsZShwYXJ0LCB7IGNyZWF0ZTogdHJ1ZSB9KTsKICAgIH0KICAgIGNvbnN0IGZpbGVIYW5kbGUgPSBhd2FpdCBkaXJIYW5kbGUuZ2V0RmlsZUhhbmRsZShmaWxlbmFtZSwgeyBjcmVhdGU6IHRydWUgfSk7CiAgICBjb25zdCBzeW5jSGFuZGxlID0gYXdhaXQgZmlsZUhhbmRsZS5jcmVhdGVTeW5jQWNjZXNzSGFuZGxlKCk7CiAgICB0aGlzLnN5bmNIYW5kbGVzLnB1c2goc3luY0hhbmRsZSk7CiAgICByZXR1cm4gbmV3IEJQbHVzVHJlZShzeW5jSGFuZGxlLCAxNik7CiAgfQogIGFzeW5jIF9jbG9zZVN5bmNIYW5kbGVzKCkgewogICAgZm9yIChjb25zdCBoYW5kbGUgb2YgdGhpcy5zeW5jSGFuZGxlcykgewogICAgICB0cnkgewogICAgICAgIGF3YWl0IGhhbmRsZS5jbG9zZSgpOwogICAgICB9IGNhdGNoIChlKSB7CiAgICAgIH0KICAgIH0KICAgIHRoaXMuc3luY0hhbmRsZXMgPSBbXTsKICB9CiAgX2dldEFjdGl2ZUJhc2VQYXRoKCkgewogICAgcmV0dXJuIHRoaXMudmVyc2lvbmVkQmFzZVBhdGggfHwgdGhpcy5zdG9yYWdlQmFzZVBhdGg7CiAgfQogIGFzeW5jIF9kZWxldGVJbmRleEZpbGVzKGJhc2VQYXRoID0gdGhpcy5fZ2V0QWN0aXZlQmFzZVBhdGgoKSkgewogICAgZm9yIChjb25zdCBzdWZmaXggb2YgVEVYVF9JTkRFWF9TVUZGSVhFUykgewogICAgICBhd2FpdCB0aGlzLl9kZWxldGVGaWxlKGJhc2VQYXRoICsgc3VmZml4KTsKICAgIH0KICB9CiAgYXN5bmMgX2RlbGV0ZUZpbGUoZmlsZVBhdGgpIHsKICAgIGlmICghZmlsZVBhdGgpIHJldHVybjsKICAgIHRyeSB7CiAgICAgIGNvbnN0IHBhdGhQYXJ0cyA9IGZpbGVQYXRoLnNwbGl0KCIvIikuZmlsdGVyKEJvb2xlYW4pOwogICAgICBjb25zdCBmaWxlbmFtZSA9IHBhdGhQYXJ0cy5wb3AoKTsKICAgICAgaWYgKCFmaWxlbmFtZSkgewogICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBzdG9yYWdlIHBhdGg6ICR7ZmlsZVBhdGh9YCk7CiAgICAgIH0KICAgICAgbGV0IGRpciA9IGF3YWl0IGdsb2JhbFRoaXMubmF2aWdhdG9yLnN0b3JhZ2UuZ2V0RGlyZWN0b3J5KCk7CiAgICAgIGZvciAoY29uc3QgcGFydCBvZiBwYXRoUGFydHMpIHsKICAgICAgICBkaXIgPSBhd2FpdCBkaXIuZ2V0RGlyZWN0b3J5SGFuZGxlKHBhcnQsIHsgY3JlYXRlOiBmYWxzZSB9KTsKICAgICAgfQogICAgICBhd2FpdCBkaXIucmVtb3ZlRW50cnkoZmlsZW5hbWUpOwogICAgfSBjYXRjaCAoZXJyb3IpIHsKICAgIH0KICB9CiAgYXN5bmMgX2Vuc3VyZURpcmVjdG9yeUZvckZpbGUoZmlsZVBhdGgpIHsKICAgIGlmICghZmlsZVBhdGgpIHJldHVybjsKICAgIGNvbnN0IHBhdGhQYXJ0cyA9IGZpbGVQYXRoLnNwbGl0KCIvIikuZmlsdGVyKEJvb2xlYW4pOwogICAgcGF0aFBhcnRzLnBvcCgpOwogICAgaWYgKHBhdGhQYXJ0cy5sZW5ndGggPT09IDApIHJldHVybjsKICAgIHRyeSB7CiAgICAgIGxldCBkaXIgPSBhd2FpdCBnbG9iYWxUaGlzLm5hdmlnYXRvci5zdG9yYWdlLmdldERpcmVjdG9yeSgpOwogICAgICBmb3IgKGNvbnN0IHBhcnQgb2YgcGF0aFBhcnRzKSB7CiAgICAgICAgZGlyID0gYXdhaXQgZGlyLmdldERpcmVjdG9yeUhhbmRsZShwYXJ0LCB7IGNyZWF0ZTogdHJ1ZSB9KTsKICAgICAgfQogICAgfSBjYXRjaCAoZXJyb3IpIHsKICAgICAgaWYgKGVycm9yLmNvZGUgIT09ICJFRVhJU1QiKSB7CiAgICAgICAgdGhyb3cgZXJyb3I7CiAgICAgIH0KICAgIH0KICB9CiAgLyoqCiAgICogQ2xvc2UgdGhlIGluZGV4IGZpbGVzCiAgICovCiAgYXN5bmMgY2xvc2UoKSB7CiAgICBpZiAodGhpcy5pc09wZW4pIHsKICAgICAgYXdhaXQgdGhpcy5fbWF5YmVDb21wYWN0KCk7CiAgICAgIGlmICh0aGlzLnRleHRJbmRleD8uaXNPcGVuKSB7CiAgICAgICAgdHJ5IHsKICAgICAgICAgIGF3YWl0IHRoaXMudGV4dEluZGV4LmNsb3NlKCk7CiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHsKICAgICAgICAgIGlmICghZXJyb3IubWVzc2FnZSB8fCAhZXJyb3IubWVzc2FnZS5pbmNsdWRlcygiRmlsZSBpcyBub3Qgb3BlbiIpKSB7CiAgICAgICAgICAgIHRocm93IGVycm9yOwogICAgICAgICAgfQogICAgICAgIH0KICAgICAgfQogICAgICB0aGlzLmlzT3BlbiA9IGZhbHNlOwogICAgfQogICAgaWYgKHRoaXMuX3JlbGVhc2VTdG9yYWdlKSB7CiAgICAgIGF3YWl0IHRoaXMuX3JlbGVhc2VTdG9yYWdlKCk7CiAgICAgIHRoaXMuX3JlbGVhc2VTdG9yYWdlID0gbnVsbDsKICAgIH0KICB9CiAgYXN5bmMgX21heWJlQ29tcGFjdCgpIHsKICAgIGlmICghdGhpcy50ZXh0SW5kZXg/LmluZGV4Py5maWxlIHx8ICF0aGlzLnRleHRJbmRleD8uZG9jdW1lbnRUZXJtcz8uZmlsZSB8fCAhdGhpcy50ZXh0SW5kZXg/LmRvY3VtZW50TGVuZ3Rocz8uZmlsZSkgewogICAgICByZXR1cm4gZmFsc2U7CiAgICB9CiAgICBjb25zdCBjdXJyZW50VmVyc2lvbiA9IGF3YWl0IGdldEN1cnJlbnRWZXJzaW9uKHRoaXMuc3RvcmFnZUJhc2VQYXRoKTsKICAgIGlmIChjdXJyZW50VmVyc2lvbiAhPT0gdGhpcy5zdG9yYWdlVmVyc2lvbikgcmV0dXJuIGZhbHNlOwogICAgY29uc3QgdG90YWxTaXplID0gdGhpcy50ZXh0SW5kZXguaW5kZXguZmlsZS5nZXRGaWxlU2l6ZSgpICsgdGhpcy50ZXh0SW5kZXguZG9jdW1lbnRUZXJtcy5maWxlLmdldEZpbGVTaXplKCkgKyB0aGlzLnRleHRJbmRleC5kb2N1bWVudExlbmd0aHMuZmlsZS5nZXRGaWxlU2l6ZSgpOwogICAgaWYgKCF0b3RhbFNpemUgfHwgdG90YWxTaXplIDwgREVGQVVMVF9DT01QQUNUSU9OX01JTl9CWVRFUykgcmV0dXJuIGZhbHNlOwogICAgY29uc3QgbmV4dFZlcnNpb24gPSBjdXJyZW50VmVyc2lvbiArIDE7CiAgICBjb25zdCBjb21wYWN0QmFzZSA9IGJ1aWxkVmVyc2lvbmVkUGF0aCh0aGlzLnN0b3JhZ2VCYXNlUGF0aCwgbmV4dFZlcnNpb24pOwogICAgY29uc3QgaW5kZXhIYW5kbGUgPSBhd2FpdCBjcmVhdGVTeW5jQWNjZXNzSGFuZGxlKGAke2NvbXBhY3RCYXNlfS10ZXJtcy5ianNvbmAsIHsgcmVzZXQ6IHRydWUgfSk7CiAgICBjb25zdCBkb2NUZXJtc0hhbmRsZSA9IGF3YWl0IGNyZWF0ZVN5bmNBY2Nlc3NIYW5kbGUoYCR7Y29tcGFjdEJhc2V9LWRvY3VtZW50cy5ianNvbmAsIHsgcmVzZXQ6IHRydWUgfSk7CiAgICBjb25zdCBsZW5ndGhzSGFuZGxlID0gYXdhaXQgY3JlYXRlU3luY0FjY2Vzc0hhbmRsZShgJHtjb21wYWN0QmFzZX0tbGVuZ3Rocy5ianNvbmAsIHsgcmVzZXQ6IHRydWUgfSk7CiAgICBjb25zdCBpbmRleFRyZWUgPSBuZXcgQlBsdXNUcmVlKGluZGV4SGFuZGxlLCAxNik7CiAgICBjb25zdCBkb2NUZXJtc1RyZWUgPSBuZXcgQlBsdXNUcmVlKGRvY1Rlcm1zSGFuZGxlLCAxNik7CiAgICBjb25zdCBsZW5ndGhzVHJlZSA9IG5ldyBCUGx1c1RyZWUobGVuZ3Roc0hhbmRsZSwgMTYpOwogICAgYXdhaXQgdGhpcy50ZXh0SW5kZXguY29tcGFjdCh7CiAgICAgIGluZGV4OiBpbmRleFRyZWUsCiAgICAgIGRvY3VtZW50VGVybXM6IGRvY1Rlcm1zVHJlZSwKICAgICAgZG9jdW1lbnRMZW5ndGhzOiBsZW5ndGhzVHJlZQogICAgfSk7CiAgICBhd2FpdCBwcm9tb3RlVmVyc2lvbih0aGlzLnN0b3JhZ2VCYXNlUGF0aCwgbmV4dFZlcnNpb24sIGN1cnJlbnRWZXJzaW9uLCB7IHN1ZmZpeGVzOiBURVhUX0lOREVYX1NVRkZJWEVTIH0pOwogICAgYXdhaXQgdGhpcy5fY2xvc2VTeW5jSGFuZGxlcygpOwogICAgcmV0dXJuIHRydWU7CiAgfQogIC8qKgogICAqIEV4dHJhY3QgdGV4dCBjb250ZW50IGZyb20gYSBkb2N1bWVudCBmb3IgdGhlIGluZGV4ZWQgZmllbGRzCiAgICogQHBhcmFtIHtPYmplY3R9IGRvYyAtIFRoZSBkb2N1bWVudAogICAqIEByZXR1cm5zIHtzdHJpbmd9IENvbWJpbmVkIHRleHQgZnJvbSBhbGwgaW5kZXhlZCBmaWVsZHMKICAgKi8KICBfZXh0cmFjdFRleHQoZG9jKSB7CiAgICBjb25zdCB0ZXh0UGFydHMgPSBbXTsKICAgIGZvciAoY29uc3QgZmllbGQgb2YgdGhpcy5pbmRleGVkRmllbGRzKSB7CiAgICAgIGNvbnN0IHZhbHVlID0gZ2V0UHJvcChkb2MsIGZpZWxkKTsKICAgICAgaWYgKHZhbHVlICE9PSB2b2lkIDAgJiYgdmFsdWUgIT09IG51bGwpIHsKICAgICAgICB0ZXh0UGFydHMucHVzaChTdHJpbmcodmFsdWUpKTsKICAgICAgfQogICAgfQogICAgcmV0dXJuIHRleHRQYXJ0cy5qb2luKCIgIik7CiAgfQogIC8qKgogICAqIEFkZCBhIGRvY3VtZW50IHRvIHRoZSB0ZXh0IGluZGV4CiAgICogQHBhcmFtIHtPYmplY3R9IGRvYyAtIFRoZSBkb2N1bWVudCB0byBpbmRleAogICAqLwogIGFzeW5jIGFkZChkb2MpIHsKICAgIGlmICghZG9jLl9pZCkgewogICAgICB0aHJvdyBuZXcgRXJyb3IoIkRvY3VtZW50IG11c3QgaGF2ZSBhbiBfaWQgZmllbGQiKTsKICAgIH0KICAgIGNvbnN0IHRleHQyID0gdGhpcy5fZXh0cmFjdFRleHQoZG9jKTsKICAgIGlmICh0ZXh0MikgewogICAgICBhd2FpdCB0aGlzLnRleHRJbmRleC5hZGQoU3RyaW5nKGRvYy5faWQpLCB0ZXh0Mik7CiAgICB9CiAgfQogIC8qKgogICAqIFJlbW92ZSBhIGRvY3VtZW50IGZyb20gdGhlIHRleHQgaW5kZXgKICAgKiBAcGFyYW0ge09iamVjdH0gZG9jIC0gVGhlIGRvY3VtZW50IHRvIHJlbW92ZQogICAqLwogIGFzeW5jIHJlbW92ZShkb2MpIHsKICAgIGlmICghZG9jLl9pZCkgewogICAgICByZXR1cm47CiAgICB9CiAgICBhd2FpdCB0aGlzLnRleHRJbmRleC5yZW1vdmUoU3RyaW5nKGRvYy5faWQpKTsKICB9CiAgLyoqCiAgICogUXVlcnkgdGhlIHRleHQgaW5kZXgKICAgKiBAcGFyYW0geyp9IHF1ZXJ5IC0gVGhlIHF1ZXJ5IG9iamVjdAogICAqIEByZXR1cm5zIHtBcnJheXxudWxsfSBBcnJheSBvZiBkb2N1bWVudCBJRHMgb3IgbnVsbCBpZiBxdWVyeSBpcyBub3QgYSB0ZXh0IHNlYXJjaAogICAqLwogIHF1ZXJ5KHF1ZXJ5KSB7CiAgICByZXR1cm4gbnVsbDsKICB9CiAgLyoqCiAgICogU2VhcmNoIHRoZSB0ZXh0IGluZGV4CiAgICogQHBhcmFtIHtzdHJpbmd9IHNlYXJjaFRleHQgLSBUaGUgdGV4dCB0byBzZWFyY2ggZm9yCiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBTZWFyY2ggb3B0aW9ucwogICAqIEByZXR1cm5zIHtQcm9taXNlPEFycmF5Pn0gQXJyYXkgb2YgZG9jdW1lbnQgSURzCiAgICovCiAgYXN5bmMgc2VhcmNoKHNlYXJjaFRleHQsIG9wdGlvbnMgPSB7fSkgewogICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHRoaXMudGV4dEluZGV4LnF1ZXJ5KHNlYXJjaFRleHQsIHsgc2NvcmVkOiBmYWxzZSwgLi4ub3B0aW9ucyB9KTsKICAgIHJldHVybiByZXN1bHRzOwogIH0KICAvKioKICAgKiBDbGVhciBhbGwgZGF0YSBmcm9tIHRoZSBpbmRleAogICAqLwogIC8vIFRPRE86IFJlY3JlYXRlIHRoZSBpbmRleCBlbXB0eSBvciBkZWxldGUKICBhc3luYyBjbGVhcigpIHsKICAgIGlmICh0aGlzLmlzT3BlbikgewogICAgICBhd2FpdCB0aGlzLmNsb3NlKCk7CiAgICB9CiAgICBjb25zdCBjdXJyZW50VmVyc2lvbiA9IGF3YWl0IGdldEN1cnJlbnRWZXJzaW9uKHRoaXMuc3RvcmFnZUJhc2VQYXRoKTsKICAgIGNvbnN0IGJhc2VQYXRoID0gYnVpbGRWZXJzaW9uZWRQYXRoKHRoaXMuc3RvcmFnZUJhc2VQYXRoLCBjdXJyZW50VmVyc2lvbik7CiAgICBhd2FpdCB0aGlzLl9kZWxldGVJbmRleEZpbGVzKGJhc2VQYXRoKTsKICAgIGF3YWl0IHRoaXMub3BlbigpOwogIH0KICAvKioKICAgKiBHZXQgaW5kZXggc3BlY2lmaWNhdGlvbgogICAqLwogIGdldFNwZWMoKSB7CiAgICByZXR1cm4gewogICAgICBuYW1lOiB0aGlzLm5hbWUsCiAgICAgIGtleTogdGhpcy5rZXlzLAogICAgICB0ZXh0SW5kZXhWZXJzaW9uOiAzLAogICAgICB3ZWlnaHRzOiB0aGlzLl9nZXRXZWlnaHRzKCkKICAgIH07CiAgfQogIC8qKgogICAqIEdldCBmaWVsZCB3ZWlnaHRzIChhbGwgZGVmYXVsdCB0byAxIGZvciBub3cpCiAgICovCiAgX2dldFdlaWdodHMoKSB7CiAgICBjb25zdCB3ZWlnaHRzID0ge307CiAgICBmb3IgKGNvbnN0IGZpZWxkIG9mIHRoaXMuaW5kZXhlZEZpZWxkcykgewogICAgICB3ZWlnaHRzW2ZpZWxkXSA9IDE7CiAgICB9CiAgICByZXR1cm4gd2VpZ2h0czsKICB9Cn0KZnVuY3Rpb24gaGF2ZXJzaW5lRGlzdGFuY2UobGF0MSwgbG5nMSwgbGF0MiwgbG5nMikgewogIGNvbnN0IFIgPSA2MzcxOwogIGNvbnN0IGRMYXQgPSAobGF0MiAtIGxhdDEpICogTWF0aC5QSSAvIDE4MDsKICBjb25zdCBkTG5nID0gKGxuZzIgLSBsbmcxKSAqIE1hdGguUEkgLyAxODA7CiAgY29uc3QgYSA9IE1hdGguc2luKGRMYXQgLyAyKSAqIE1hdGguc2luKGRMYXQgLyAyKSArIE1hdGguY29zKGxhdDEgKiBNYXRoLlBJIC8gMTgwKSAqIE1hdGguY29zKGxhdDIgKiBNYXRoLlBJIC8gMTgwKSAqIE1hdGguc2luKGRMbmcgLyAyKSAqIE1hdGguc2luKGRMbmcgLyAyKTsKICBjb25zdCBjID0gMiAqIE1hdGguYXRhbjIoTWF0aC5zcXJ0KGEpLCBNYXRoLnNxcnQoMSAtIGEpKTsKICByZXR1cm4gUiAqIGM7Cn0KZnVuY3Rpb24gcmFkaXVzVG9Cb3VuZGluZ0JveChsYXQsIGxuZywgcmFkaXVzS20pIHsKICBjb25zdCBsYXREZWx0YSA9IHJhZGl1c0ttIC8gMTExOwogIGNvbnN0IGxuZ0RlbHRhID0gcmFkaXVzS20gLyAoMTExICogTWF0aC5jb3MobGF0ICogTWF0aC5QSSAvIDE4MCkpOwogIHJldHVybiB7CiAgICBtaW5MYXQ6IGxhdCAtIGxhdERlbHRhLAogICAgbWF4TGF0OiBsYXQgKyBsYXREZWx0YSwKICAgIG1pbkxuZzogbG5nIC0gbG5nRGVsdGEsCiAgICBtYXhMbmc6IGxuZyArIGxuZ0RlbHRhCiAgfTsKfQpmdW5jdGlvbiBpbnRlcnNlY3RzKGJib3gxLCBiYm94MikgewogIHJldHVybiAhKGJib3gxLm1heExhdCA8IGJib3gyLm1pbkxhdCB8fCBiYm94MS5taW5MYXQgPiBiYm94Mi5tYXhMYXQgfHwgYmJveDEubWF4TG5nIDwgYmJveDIubWluTG5nIHx8IGJib3gxLm1pbkxuZyA+IGJib3gyLm1heExuZyk7Cn0KZnVuY3Rpb24gYXJlYShiYm94KSB7CiAgcmV0dXJuIChiYm94Lm1heExhdCAtIGJib3gubWluTGF0KSAqIChiYm94Lm1heExuZyAtIGJib3gubWluTG5nKTsKfQpmdW5jdGlvbiB1bmlvbihiYm94MSwgYmJveDIpIHsKICByZXR1cm4gewogICAgbWluTGF0OiBNYXRoLm1pbihiYm94MS5taW5MYXQsIGJib3gyLm1pbkxhdCksCiAgICBtYXhMYXQ6IE1hdGgubWF4KGJib3gxLm1heExhdCwgYmJveDIubWF4TGF0KSwKICAgIG1pbkxuZzogTWF0aC5taW4oYmJveDEubWluTG5nLCBiYm94Mi5taW5MbmcpLAogICAgbWF4TG5nOiBNYXRoLm1heChiYm94MS5tYXhMbmcsIGJib3gyLm1heExuZykKICB9Owp9CmZ1bmN0aW9uIGVubGFyZ2VtZW50KGJib3gxLCBiYm94MikgewogIGNvbnN0IHVuaW9uQm94ID0gdW5pb24oYmJveDEsIGJib3gyKTsKICByZXR1cm4gYXJlYSh1bmlvbkJveCkgLSBhcmVhKGJib3gxKTsKfQpjbGFzcyBSVHJlZU5vZGUgewogIGNvbnN0cnVjdG9yKHJ0cmVlLCBub2RlRGF0YSkgewogICAgdGhpcy5ydHJlZSA9IHJ0cmVlOwogICAgdGhpcy5pZCA9IG5vZGVEYXRhLmlkOwogICAgdGhpcy5pc0xlYWYgPSBub2RlRGF0YS5pc0xlYWY7CiAgICB0aGlzLmNoaWxkcmVuID0gbm9kZURhdGEuY2hpbGRyZW4gfHwgW107CiAgICB0aGlzLmJib3ggPSBub2RlRGF0YS5iYm94OwogIH0KICAvKioKICAgKiBVcGRhdGUgdGhlIGJvdW5kaW5nIGJveCB0byBjb250YWluIGFsbCBjaGlsZHJlbgogICAqLwogIHVwZGF0ZUJCb3goKSB7CiAgICBpZiAodGhpcy5jaGlsZHJlbi5sZW5ndGggPT09IDApIHsKICAgICAgdGhpcy5iYm94ID0gbnVsbDsKICAgICAgcmV0dXJuOwogICAgfQogICAgbGV0IG1pbkxhdCA9IEluZmluaXR5LCBtYXhMYXQgPSAtSW5maW5pdHk7CiAgICBsZXQgbWluTG5nID0gSW5maW5pdHksIG1heExuZyA9IC1JbmZpbml0eTsKICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jaGlsZHJlbikgewogICAgICBsZXQgYmJveDsKICAgICAgaWYgKHRoaXMuaXNMZWFmKSB7CiAgICAgICAgYmJveCA9IGNoaWxkLmJib3g7CiAgICAgIH0gZWxzZSB7CiAgICAgICAgY29uc3QgY2hpbGROb2RlID0gdGhpcy5ydHJlZS5fbG9hZE5vZGUoY2hpbGQpOwogICAgICAgIGJib3ggPSBjaGlsZE5vZGUuYmJveDsKICAgICAgfQogICAgICBpZiAoYmJveCkgewogICAgICAgIG1pbkxhdCA9IE1hdGgubWluKG1pbkxhdCwgYmJveC5taW5MYXQpOwogICAgICAgIG1heExhdCA9IE1hdGgubWF4KG1heExhdCwgYmJveC5tYXhMYXQpOwogICAgICAgIG1pbkxuZyA9IE1hdGgubWluKG1pbkxuZywgYmJveC5taW5MbmcpOwogICAgICAgIG1heExuZyA9IE1hdGgubWF4KG1heExuZywgYmJveC5tYXhMbmcpOwogICAgICB9CiAgICB9CiAgICB0aGlzLmJib3ggPSB7IG1pbkxhdCwgbWF4TGF0LCBtaW5MbmcsIG1heExuZyB9OwogICAgdGhpcy5ydHJlZS5fc2F2ZU5vZGUodGhpcyk7CiAgfQogIC8qKgogICAqIENvbnZlcnQgbm9kZSB0byBwbGFpbiBvYmplY3QgZm9yIHNlcmlhbGl6YXRpb24KICAgKi8KICB0b0pTT04oKSB7CiAgICByZXR1cm4gewogICAgICBpZDogdGhpcy5pZCwKICAgICAgaXNMZWFmOiB0aGlzLmlzTGVhZiwKICAgICAgY2hpbGRyZW46IHRoaXMuY2hpbGRyZW4sCiAgICAgIGJib3g6IHRoaXMuYmJveAogICAgfTsKICB9Cn0KY2xhc3MgUlRyZWUgewogIGNvbnN0cnVjdG9yKHN5bmNIYW5kbGUsIG1heEVudHJpZXMgPSA5KSB7CiAgICB0aGlzLmZpbGUgPSBuZXcgQkpzb25GaWxlKHN5bmNIYW5kbGUpOwogICAgdGhpcy5tYXhFbnRyaWVzID0gbWF4RW50cmllczsKICAgIHRoaXMubWluRW50cmllcyA9IE1hdGgubWF4KDIsIE1hdGguY2VpbChtYXhFbnRyaWVzIC8gMikpOwogICAgdGhpcy5yb290UG9pbnRlciA9IG51bGw7CiAgICB0aGlzLm5leHRJZCA9IDE7CiAgICB0aGlzLl9zaXplID0gMDsKICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7CiAgfQogIC8qKgogICAqIE9wZW4gdGhlIFItdHJlZSAobG9hZCBvciBpbml0aWFsaXplIG1ldGFkYXRhKQogICAqLwogIGFzeW5jIG9wZW4oKSB7CiAgICBpZiAodGhpcy5pc09wZW4pIHsKICAgICAgdGhyb3cgbmV3IEVycm9yKCJSLXRyZWUgaXMgYWxyZWFkeSBvcGVuIik7CiAgICB9CiAgICBjb25zdCBmaWxlU2l6ZSA9IHRoaXMuZmlsZS5nZXRGaWxlU2l6ZSgpOwogICAgY29uc3QgZXhpc3RzID0gZmlsZVNpemUgPiAwOwogICAgaWYgKGV4aXN0cykgewogICAgICB0aGlzLl9sb2FkRnJvbUZpbGUoKTsKICAgIH0gZWxzZSB7CiAgICAgIHRoaXMuX2luaXRpYWxpemVOZXdUcmVlKCk7CiAgICB9CiAgICB0aGlzLmlzT3BlbiA9IHRydWU7CiAgfQogIC8qKgogICAqIENsb3NlIHRoZSBSLXRyZWUKICAgKi8KICBhc3luYyBjbG9zZSgpIHsKICAgIGlmICh0aGlzLmlzT3BlbikgewogICAgICB0aGlzLl93cml0ZU1ldGFkYXRhKCk7CiAgICAgIGlmICh0aGlzLmZpbGUgJiYgdGhpcy5maWxlLnN5bmNBY2Nlc3NIYW5kbGUpIHsKICAgICAgICB0aGlzLmZpbGUuZmx1c2goKTsKICAgICAgICBhd2FpdCB0aGlzLmZpbGUuc3luY0FjY2Vzc0hhbmRsZS5jbG9zZSgpOwogICAgICB9CiAgICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7CiAgICB9CiAgfQogIC8qKgogICAqIEluaXRpYWxpemUgYSBuZXcgZW1wdHkgdHJlZQogICAqLwogIF9pbml0aWFsaXplTmV3VHJlZSgpIHsKICAgIGNvbnN0IHJvb3ROb2RlID0gbmV3IFJUcmVlTm9kZSh0aGlzLCB7CiAgICAgIGlkOiAwLAogICAgICBpc0xlYWY6IHRydWUsCiAgICAgIGNoaWxkcmVuOiBbXSwKICAgICAgYmJveDogbnVsbAogICAgfSk7CiAgICB0aGlzLm5leHRJZCA9IDE7CiAgICB0aGlzLl9zaXplID0gMDsKICAgIHRoaXMucm9vdFBvaW50ZXIgPSB0aGlzLl9zYXZlTm9kZShyb290Tm9kZSk7CiAgICB0aGlzLl93cml0ZU1ldGFkYXRhKCk7CiAgfQogIC8qKgogICAqIFdyaXRlIG1ldGFkYXRhIHJlY29yZCB0byBmaWxlCiAgICovCiAgX3dyaXRlTWV0YWRhdGEoKSB7CiAgICBjb25zdCBtZXRhZGF0YSA9IHsKICAgICAgdmVyc2lvbjogMSwKICAgICAgbWF4RW50cmllczogdGhpcy5tYXhFbnRyaWVzLAogICAgICBtaW5FbnRyaWVzOiB0aGlzLm1pbkVudHJpZXMsCiAgICAgIHNpemU6IHRoaXMuX3NpemUsCiAgICAgIHJvb3RQb2ludGVyOiB0aGlzLnJvb3RQb2ludGVyLAogICAgICBuZXh0SWQ6IHRoaXMubmV4dElkCiAgICB9OwogICAgdGhpcy5maWxlLmFwcGVuZChtZXRhZGF0YSk7CiAgfQogIC8qKgogICAqIExvYWQgdHJlZSBmcm9tIGV4aXN0aW5nIGZpbGUKICAgKi8KICBfbG9hZEZyb21GaWxlKCkgewogICAgY29uc3QgTUVUQURBVEFfU0laRSA9IDEzNTsKICAgIGNvbnN0IGZpbGVTaXplID0gdGhpcy5maWxlLmdldEZpbGVTaXplKCk7CiAgICBpZiAoZmlsZVNpemUgPCBNRVRBREFUQV9TSVpFKSB7CiAgICAgIHRocm93IG5ldyBFcnJvcigiSW52YWxpZCBSLXRyZWUgZmlsZSBmb3JtYXQ6IGZpbGUgdG9vIHNtYWxsIGZvciBtZXRhZGF0YSIpOwogICAgfQogICAgY29uc3QgbWV0YWRhdGFPZmZzZXQgPSBmaWxlU2l6ZSAtIE1FVEFEQVRBX1NJWkU7CiAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMuZmlsZS5yZWFkKG1ldGFkYXRhT2Zmc2V0KTsKICAgIHRoaXMubWF4RW50cmllcyA9IG1ldGFkYXRhLm1heEVudHJpZXM7CiAgICB0aGlzLm1pbkVudHJpZXMgPSBtZXRhZGF0YS5taW5FbnRyaWVzOwogICAgdGhpcy5fc2l6ZSA9IG1ldGFkYXRhLnNpemU7CiAgICB0aGlzLnJvb3RQb2ludGVyID0gbWV0YWRhdGEucm9vdFBvaW50ZXI7CiAgICB0aGlzLm5leHRJZCA9IG1ldGFkYXRhLm5leHRJZDsKICB9CiAgLyoqCiAgICogU2F2ZSBhIG5vZGUgdG8gZGlzayBhbmQgcmV0dXJuIGl0cyBQb2ludGVyCiAgICovCiAgX3NhdmVOb2RlKG5vZGUpIHsKICAgIGNvbnN0IG5vZGVEYXRhID0gbm9kZS50b0pTT04oKTsKICAgIGNvbnN0IG9mZnNldCA9IHRoaXMuZmlsZS5nZXRGaWxlU2l6ZSgpOwogICAgdGhpcy5maWxlLmFwcGVuZChub2RlRGF0YSk7CiAgICByZXR1cm4gbmV3IFBvaW50ZXIob2Zmc2V0KTsKICB9CiAgLyoqCiAgICogTG9hZCBhIG5vZGUgZnJvbSBkaXNrIGJ5IFBvaW50ZXIKICAgKi8KICBfbG9hZE5vZGUocG9pbnRlcikgewogICAgaWYgKCEocG9pbnRlciBpbnN0YW5jZW9mIFBvaW50ZXIpKSB7CiAgICAgIHRocm93IG5ldyBFcnJvcigiRXhwZWN0ZWQgUG9pbnRlciBvYmplY3QiKTsKICAgIH0KICAgIGNvbnN0IG9mZnNldCA9IHBvaW50ZXIudmFsdWVPZigpOwogICAgY29uc3Qgbm9kZURhdGEgPSB0aGlzLmZpbGUucmVhZChvZmZzZXQpOwogICAgcmV0dXJuIG5ldyBSVHJlZU5vZGUodGhpcywgbm9kZURhdGEpOwogIH0KICAvKioKICAgKiBMb2FkIHRoZSByb290IG5vZGUKICAgKi8KICBfbG9hZFJvb3QoKSB7CiAgICByZXR1cm4gdGhpcy5fbG9hZE5vZGUodGhpcy5yb290UG9pbnRlcik7CiAgfQogIC8qKgogICAqIEluc2VydCBhIHBvaW50IGludG8gdGhlIFItdHJlZSB3aXRoIGFuIE9iamVjdElkCiAgICovCiAgaW5zZXJ0KGxhdCwgbG5nLCBvYmplY3RJZCkgewogICAgaWYgKCF0aGlzLmlzT3BlbikgewogICAgICB0aHJvdyBuZXcgRXJyb3IoIlItdHJlZSBmaWxlIG11c3QgYmUgb3BlbmVkIGJlZm9yZSB1c2UiKTsKICAgIH0KICAgIGlmICghKG9iamVjdElkIGluc3RhbmNlb2YgT2JqZWN0SWQpKSB7CiAgICAgIHRocm93IG5ldyBFcnJvcigib2JqZWN0SWQgbXVzdCBiZSBhbiBpbnN0YW5jZSBvZiBPYmplY3RJZCB0byBpbnNlcnQgaW50byBydHJlZSIpOwogICAgfQogICAgY29uc3QgYmJveCA9IHsKICAgICAgbWluTGF0OiBsYXQsCiAgICAgIG1heExhdDogbGF0LAogICAgICBtaW5Mbmc6IGxuZywKICAgICAgbWF4TG5nOiBsbmcKICAgIH07CiAgICBjb25zdCBlbnRyeSA9IHsgYmJveCwgbGF0LCBsbmcsIG9iamVjdElkIH07CiAgICBjb25zdCByb290ID0gdGhpcy5fbG9hZFJvb3QoKTsKICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX2luc2VydChlbnRyeSwgcm9vdCwgMSk7CiAgICBpZiAocmVzdWx0LnNwbGl0KSB7CiAgICAgIGNvbnN0IG5ld1Jvb3QgPSBuZXcgUlRyZWVOb2RlKHRoaXMsIHsKICAgICAgICBpZDogdGhpcy5uZXh0SWQrKywKICAgICAgICBpc0xlYWY6IGZhbHNlLAogICAgICAgIGNoaWxkcmVuOiByZXN1bHQucG9pbnRlcnMsCiAgICAgICAgYmJveDogbnVsbAogICAgICB9KTsKICAgICAgbmV3Um9vdC51cGRhdGVCQm94KCk7CiAgICAgIHRoaXMucm9vdFBvaW50ZXIgPSB0aGlzLl9zYXZlTm9kZShuZXdSb290KTsKICAgIH0gZWxzZSB7CiAgICAgIHRoaXMucm9vdFBvaW50ZXIgPSByZXN1bHQucG9pbnRlcjsKICAgIH0KICAgIHRoaXMuX3NpemUrKzsKICAgIHRoaXMuX3dyaXRlTWV0YWRhdGEoKTsKICB9CiAgLyoqCiAgICogSW50ZXJuYWwgaW5zZXJ0IG1ldGhvZCAtIHJldHVybnMgc3BsaXRQb2ludGVycyBpZiBzcGxpdCBvY2N1cnJlZCwgZWxzZSByZXR1cm5zIHVwZGF0ZWQgbm9kZSBwb2ludGVyCiAgICovCiAgX2luc2VydChlbnRyeSwgbm9kZSwgbGV2ZWwpIHsKICAgIGlmIChub2RlLmlzTGVhZikgewogICAgICBub2RlLmNoaWxkcmVuLnB1c2goZW50cnkpOwogICAgICBub2RlLnVwZGF0ZUJCb3goKTsKICAgICAgaWYgKG5vZGUuY2hpbGRyZW4ubGVuZ3RoID4gdGhpcy5tYXhFbnRyaWVzKSB7CiAgICAgICAgY29uc3QgW3BvaW50ZXIxLCBwb2ludGVyMl0gPSB0aGlzLl9zcGxpdChub2RlKTsKICAgICAgICByZXR1cm4geyBzcGxpdDogdHJ1ZSwgcG9pbnRlcnM6IFtwb2ludGVyMSwgcG9pbnRlcjJdIH07CiAgICAgIH0KICAgICAgY29uc3QgcG9pbnRlciA9IHRoaXMuX3NhdmVOb2RlKG5vZGUpOwogICAgICByZXR1cm4geyBzcGxpdDogZmFsc2UsIHBvaW50ZXIgfTsKICAgIH0gZWxzZSB7CiAgICAgIGNvbnN0IHRhcmdldFBvaW50ZXIgPSB0aGlzLl9jaG9vc2VTdWJ0cmVlKGVudHJ5LmJib3gsIG5vZGUpOwogICAgICBjb25zdCB0YXJnZXROb2RlID0gdGhpcy5fbG9hZE5vZGUodGFyZ2V0UG9pbnRlcik7CiAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX2luc2VydChlbnRyeSwgdGFyZ2V0Tm9kZSwgbGV2ZWwgKyAxKTsKICAgICAgaWYgKHJlc3VsdC5zcGxpdCkgewogICAgICAgIGxldCBjaGlsZEluZGV4ID0gLTE7CiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2RlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7CiAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbltpXS52YWx1ZU9mKCkgPT09IHRhcmdldFBvaW50ZXIudmFsdWVPZigpKSB7CiAgICAgICAgICAgIGNoaWxkSW5kZXggPSBpOwogICAgICAgICAgICBicmVhazsKICAgICAgICAgIH0KICAgICAgICB9CiAgICAgICAgaWYgKGNoaWxkSW5kZXggIT09IC0xKSB7CiAgICAgICAgICBub2RlLmNoaWxkcmVuW2NoaWxkSW5kZXhdID0gcmVzdWx0LnBvaW50ZXJzWzBdOwogICAgICAgICAgbm9kZS5jaGlsZHJlbi5wdXNoKHJlc3VsdC5wb2ludGVyc1sxXSk7CiAgICAgICAgfSBlbHNlIHsKICAgICAgICAgIG5vZGUuY2hpbGRyZW4ucHVzaChyZXN1bHQucG9pbnRlcnNbMF0pOwogICAgICAgICAgbm9kZS5jaGlsZHJlbi5wdXNoKHJlc3VsdC5wb2ludGVyc1sxXSk7CiAgICAgICAgfQogICAgICAgIG5vZGUudXBkYXRlQkJveCgpOwogICAgICAgIGlmIChub2RlLmNoaWxkcmVuLmxlbmd0aCA+IHRoaXMubWF4RW50cmllcykgewogICAgICAgICAgY29uc3QgW3BvaW50ZXIxLCBwb2ludGVyMl0gPSB0aGlzLl9zcGxpdChub2RlKTsKICAgICAgICAgIHJldHVybiB7IHNwbGl0OiB0cnVlLCBwb2ludGVyczogW3BvaW50ZXIxLCBwb2ludGVyMl0gfTsKICAgICAgICB9CiAgICAgIH0gZWxzZSB7CiAgICAgICAgbGV0IGNoaWxkSW5kZXggPSAtMTsKICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHsKICAgICAgICAgIGlmIChub2RlLmNoaWxkcmVuW2ldLnZhbHVlT2YoKSA9PT0gdGFyZ2V0UG9pbnRlci52YWx1ZU9mKCkpIHsKICAgICAgICAgICAgY2hpbGRJbmRleCA9IGk7CiAgICAgICAgICAgIGJyZWFrOwogICAgICAgICAgfQogICAgICAgIH0KICAgICAgICBpZiAoY2hpbGRJbmRleCAhPT0gLTEpIHsKICAgICAgICAgIG5vZGUuY2hpbGRyZW5bY2hpbGRJbmRleF0gPSByZXN1bHQucG9pbnRlcjsKICAgICAgICB9CiAgICAgICAgbm9kZS51cGRhdGVCQm94KCk7CiAgICAgIH0KICAgICAgY29uc3QgcG9pbnRlciA9IHRoaXMuX3NhdmVOb2RlKG5vZGUpOwogICAgICByZXR1cm4geyBzcGxpdDogZmFsc2UsIHBvaW50ZXIgfTsKICAgIH0KICB9CiAgLyoqCiAgICogQ2hvb3NlIHRoZSBiZXN0IHN1YnRyZWUgdG8gaW5zZXJ0IGFuIGVudHJ5CiAgICovCiAgX2Nob29zZVN1YnRyZWUoYmJveCwgbm9kZSkgewogICAgbGV0IG1pbkVubGFyZ2VtZW50ID0gSW5maW5pdHk7CiAgICBsZXQgbWluQXJlYSA9IEluZmluaXR5OwogICAgbGV0IHRhcmdldFBvaW50ZXIgPSBudWxsOwogICAgZm9yIChjb25zdCBjaGlsZFBvaW50ZXIgb2Ygbm9kZS5jaGlsZHJlbikgewogICAgICBpZiAoIShjaGlsZFBvaW50ZXIgaW5zdGFuY2VvZiBQb2ludGVyKSkgewogICAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgUG9pbnRlciBpbiBfY2hvb3NlU3VidHJlZSwgZ290OiAke3R5cGVvZiBjaGlsZFBvaW50ZXJ9YCk7CiAgICAgIH0KICAgICAgY29uc3QgY2hpbGROb2RlID0gdGhpcy5fbG9hZE5vZGUoY2hpbGRQb2ludGVyKTsKICAgICAgY29uc3QgZW5sID0gZW5sYXJnZW1lbnQoY2hpbGROb2RlLmJib3gsIGJib3gpOwogICAgICBjb25zdCBhciA9IGFyZWEoY2hpbGROb2RlLmJib3gpOwogICAgICBpZiAoZW5sIDwgbWluRW5sYXJnZW1lbnQgfHwgZW5sID09PSBtaW5FbmxhcmdlbWVudCAmJiBhciA8IG1pbkFyZWEpIHsKICAgICAgICBtaW5FbmxhcmdlbWVudCA9IGVubDsKICAgICAgICBtaW5BcmVhID0gYXI7CiAgICAgICAgdGFyZ2V0UG9pbnRlciA9IGNoaWxkUG9pbnRlcjsKICAgICAgfQogICAgfQogICAgcmV0dXJuIHRhcmdldFBvaW50ZXI7CiAgfQogIC8qKgogICAqIFNwbGl0IGFuIG92ZXJmbG93aW5nIG5vZGUKICAgKi8KICBfc3BsaXQobm9kZSkgewogICAgY29uc3QgY2hpbGRyZW4gPSBub2RlLmNoaWxkcmVuOwogICAgY29uc3QgaXNMZWFmID0gbm9kZS5pc0xlYWY7CiAgICBsZXQgbWF4RGlzdCA9IC1JbmZpbml0eTsKICAgIGxldCBzZWVkMUlkeCA9IDAsIHNlZWQySWR4ID0gMTsKICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHsKICAgICAgZm9yIChsZXQgaiA9IGkgKyAxOyBqIDwgY2hpbGRyZW4ubGVuZ3RoOyBqKyspIHsKICAgICAgICBsZXQgYmJveDEsIGJib3gyOwogICAgICAgIGlmIChpc0xlYWYpIHsKICAgICAgICAgIGJib3gxID0gY2hpbGRyZW5baV0uYmJveDsKICAgICAgICAgIGJib3gyID0gY2hpbGRyZW5bal0uYmJveDsKICAgICAgICB9IGVsc2UgewogICAgICAgICAgY29uc3Qgbm9kZTEyID0gdGhpcy5fbG9hZE5vZGUoY2hpbGRyZW5baV0pOwogICAgICAgICAgY29uc3Qgbm9kZTIyID0gdGhpcy5fbG9hZE5vZGUoY2hpbGRyZW5bal0pOwogICAgICAgICAgYmJveDEgPSBub2RlMTIuYmJveDsKICAgICAgICAgIGJib3gyID0gbm9kZTIyLmJib3g7CiAgICAgICAgfQogICAgICAgIGNvbnN0IGRpc3QgPSBhcmVhKHVuaW9uKGJib3gxLCBiYm94MikpOwogICAgICAgIGlmIChkaXN0ID4gbWF4RGlzdCkgewogICAgICAgICAgbWF4RGlzdCA9IGRpc3Q7CiAgICAgICAgICBzZWVkMUlkeCA9IGk7CiAgICAgICAgICBzZWVkMklkeCA9IGo7CiAgICAgICAgfQogICAgICB9CiAgICB9CiAgICBjb25zdCBub2RlMSA9IG5ldyBSVHJlZU5vZGUodGhpcywgewogICAgICBpZDogdGhpcy5uZXh0SWQrKywKICAgICAgaXNMZWFmLAogICAgICBjaGlsZHJlbjogW2NoaWxkcmVuW3NlZWQxSWR4XV0sCiAgICAgIGJib3g6IG51bGwKICAgIH0pOwogICAgY29uc3Qgbm9kZTIgPSBuZXcgUlRyZWVOb2RlKHRoaXMsIHsKICAgICAgaWQ6IHRoaXMubmV4dElkKyssCiAgICAgIGlzTGVhZiwKICAgICAgY2hpbGRyZW46IFtjaGlsZHJlbltzZWVkMklkeF1dLAogICAgICBiYm94OiBudWxsCiAgICB9KTsKICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHsKICAgICAgaWYgKGkgPT09IHNlZWQxSWR4IHx8IGkgPT09IHNlZWQySWR4KSBjb250aW51ZTsKICAgICAgY29uc3QgY2hpbGQgPSBjaGlsZHJlbltpXTsKICAgICAgbGV0IGJib3g7CiAgICAgIGlmIChpc0xlYWYpIHsKICAgICAgICBiYm94ID0gY2hpbGQuYmJveDsKICAgICAgfSBlbHNlIHsKICAgICAgICBjb25zdCBjaGlsZE5vZGUgPSB0aGlzLl9sb2FkTm9kZShjaGlsZCk7CiAgICAgICAgYmJveCA9IGNoaWxkTm9kZS5iYm94OwogICAgICB9CiAgICAgIG5vZGUxLnVwZGF0ZUJCb3goKTsKICAgICAgbm9kZTIudXBkYXRlQkJveCgpOwogICAgICBjb25zdCBlbmwxID0gbm9kZTEuYmJveCA/IGVubGFyZ2VtZW50KG5vZGUxLmJib3gsIGJib3gpIDogMDsKICAgICAgY29uc3QgZW5sMiA9IG5vZGUyLmJib3ggPyBlbmxhcmdlbWVudChub2RlMi5iYm94LCBiYm94KSA6IDA7CiAgICAgIGlmIChlbmwxIDwgZW5sMikgewogICAgICAgIG5vZGUxLmNoaWxkcmVuLnB1c2goY2hpbGQpOwogICAgICB9IGVsc2UgaWYgKGVubDIgPCBlbmwxKSB7CiAgICAgICAgbm9kZTIuY2hpbGRyZW4ucHVzaChjaGlsZCk7CiAgICAgIH0gZWxzZSB7CiAgICAgICAgaWYgKG5vZGUxLmNoaWxkcmVuLmxlbmd0aCA8PSBub2RlMi5jaGlsZHJlbi5sZW5ndGgpIHsKICAgICAgICAgIG5vZGUxLmNoaWxkcmVuLnB1c2goY2hpbGQpOwogICAgICAgIH0gZWxzZSB7CiAgICAgICAgICBub2RlMi5jaGlsZHJlbi5wdXNoKGNoaWxkKTsKICAgICAgICB9CiAgICAgIH0KICAgIH0KICAgIG5vZGUxLnVwZGF0ZUJCb3goKTsKICAgIG5vZGUyLnVwZGF0ZUJCb3goKTsKICAgIGNvbnN0IHBvaW50ZXIxID0gdGhpcy5fc2F2ZU5vZGUobm9kZTEpOwogICAgY29uc3QgcG9pbnRlcjIgPSB0aGlzLl9zYXZlTm9kZShub2RlMik7CiAgICByZXR1cm4gW3BvaW50ZXIxLCBwb2ludGVyMl07CiAgfQogIC8qKgogICAqIFNlYXJjaCBmb3IgcG9pbnRzIHdpdGhpbiBhIGJvdW5kaW5nIGJveCwgcmV0dXJuaW5nIGVudHJpZXMgd2l0aCBjb29yZHMKICAgKi8KICBzZWFyY2hCQm94KGJib3gpIHsKICAgIGlmICghdGhpcy5pc09wZW4pIHsKICAgICAgdGhyb3cgbmV3IEVycm9yKCJSLXRyZWUgZmlsZSBtdXN0IGJlIG9wZW5lZCBiZWZvcmUgdXNlIik7CiAgICB9CiAgICBjb25zdCByZXN1bHRzID0gW107CiAgICBjb25zdCByb290ID0gdGhpcy5fbG9hZFJvb3QoKTsKICAgIHRoaXMuX3NlYXJjaEJCb3goYmJveCwgcm9vdCwgcmVzdWx0cyk7CiAgICByZXR1cm4gcmVzdWx0czsKICB9CiAgLyoqCiAgICogSW50ZXJuYWwgYm91bmRpbmcgYm94IHNlYXJjaAogICAqLwogIF9zZWFyY2hCQm94KGJib3gsIG5vZGUsIHJlc3VsdHMpIHsKICAgIGlmICghbm9kZS5iYm94IHx8ICFpbnRlcnNlY3RzKGJib3gsIG5vZGUuYmJveCkpIHsKICAgICAgcmV0dXJuOwogICAgfQogICAgaWYgKG5vZGUuaXNMZWFmKSB7CiAgICAgIGZvciAoY29uc3QgZW50cnkgb2Ygbm9kZS5jaGlsZHJlbikgewogICAgICAgIGlmIChpbnRlcnNlY3RzKGJib3gsIGVudHJ5LmJib3gpKSB7CiAgICAgICAgICByZXN1bHRzLnB1c2goewogICAgICAgICAgICBvYmplY3RJZDogZW50cnkub2JqZWN0SWQsCiAgICAgICAgICAgIGxhdDogZW50cnkubGF0LAogICAgICAgICAgICBsbmc6IGVudHJ5LmxuZwogICAgICAgICAgfSk7CiAgICAgICAgfQogICAgICB9CiAgICB9IGVsc2UgewogICAgICBmb3IgKGNvbnN0IGNoaWxkUG9pbnRlciBvZiBub2RlLmNoaWxkcmVuKSB7CiAgICAgICAgY29uc3QgY2hpbGROb2RlID0gdGhpcy5fbG9hZE5vZGUoY2hpbGRQb2ludGVyKTsKICAgICAgICB0aGlzLl9zZWFyY2hCQm94KGJib3gsIGNoaWxkTm9kZSwgcmVzdWx0cyk7CiAgICAgIH0KICAgIH0KICB9CiAgLyoqCiAgICogU2VhcmNoIGZvciBwb2ludHMgd2l0aGluIGEgcmFkaXVzIG9mIGEgbG9jYXRpb24sIHJldHVybmluZyBPYmplY3RJZHMgd2l0aCBkaXN0YW5jZXMKICAgKi8KICBzZWFyY2hSYWRpdXMobGF0LCBsbmcsIHJhZGl1c0ttKSB7CiAgICBjb25zdCBiYm94ID0gcmFkaXVzVG9Cb3VuZGluZ0JveChsYXQsIGxuZywgcmFkaXVzS20pOwogICAgY29uc3Qgcm9vdCA9IHRoaXMuX2xvYWRSb290KCk7CiAgICBjb25zdCBlbnRyaWVzID0gW107CiAgICB0aGlzLl9zZWFyY2hCQm94RW50cmllcyhiYm94LCByb290LCBlbnRyaWVzKTsKICAgIGNvbnN0IHJlc3VsdHMgPSBbXTsKICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykgewogICAgICBjb25zdCBkaXN0ID0gaGF2ZXJzaW5lRGlzdGFuY2UobGF0LCBsbmcsIGVudHJ5LmxhdCwgZW50cnkubG5nKTsKICAgICAgaWYgKGRpc3QgPD0gcmFkaXVzS20pIHsKICAgICAgICByZXN1bHRzLnB1c2goewogICAgICAgICAgb2JqZWN0SWQ6IGVudHJ5Lm9iamVjdElkLAogICAgICAgICAgbGF0OiBlbnRyeS5sYXQsCiAgICAgICAgICBsbmc6IGVudHJ5LmxuZywKICAgICAgICAgIGRpc3RhbmNlOiBkaXN0CiAgICAgICAgfSk7CiAgICAgIH0KICAgIH0KICAgIHJldHVybiByZXN1bHRzOwogIH0KICAvKioKICAgKiBJbnRlcm5hbCBib3VuZGluZyBib3ggc2VhcmNoIHRoYXQgcmV0dXJucyBmdWxsIGVudHJpZXMgKHVzZWQgYnkgcmFkaXVzIHNlYXJjaCkKICAgKi8KICBfc2VhcmNoQkJveEVudHJpZXMoYmJveCwgbm9kZSwgcmVzdWx0cykgewogICAgaWYgKCFub2RlLmJib3ggfHwgIWludGVyc2VjdHMoYmJveCwgbm9kZS5iYm94KSkgewogICAgICByZXR1cm47CiAgICB9CiAgICBpZiAobm9kZS5pc0xlYWYpIHsKICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBub2RlLmNoaWxkcmVuKSB7CiAgICAgICAgaWYgKGludGVyc2VjdHMoYmJveCwgZW50cnkuYmJveCkpIHsKICAgICAgICAgIHJlc3VsdHMucHVzaChlbnRyeSk7CiAgICAgICAgfQogICAgICB9CiAgICB9IGVsc2UgewogICAgICBmb3IgKGNvbnN0IGNoaWxkUG9pbnRlciBvZiBub2RlLmNoaWxkcmVuKSB7CiAgICAgICAgY29uc3QgY2hpbGROb2RlID0gdGhpcy5fbG9hZE5vZGUoY2hpbGRQb2ludGVyKTsKICAgICAgICB0aGlzLl9zZWFyY2hCQm94RW50cmllcyhiYm94LCBjaGlsZE5vZGUsIHJlc3VsdHMpOwogICAgICB9CiAgICB9CiAgfQogIC8qKgogICAqIFJlbW92ZSBhbiBlbnRyeSBmcm9tIHRoZSBSLXRyZWUgYnkgT2JqZWN0SWQKICAgKi8KICByZW1vdmUob2JqZWN0SWQpIHsKICAgIGlmICghdGhpcy5pc09wZW4pIHsKICAgICAgdGhyb3cgbmV3IEVycm9yKCJSLXRyZWUgZmlsZSBtdXN0IGJlIG9wZW5lZCBiZWZvcmUgdXNlIik7CiAgICB9CiAgICBpZiAoIShvYmplY3RJZCBpbnN0YW5jZW9mIE9iamVjdElkKSkgewogICAgICB0aHJvdyBuZXcgRXJyb3IoIm9iamVjdElkIG11c3QgYmUgYW4gaW5zdGFuY2Ugb2YgT2JqZWN0SWQgdG8gcmVtb3ZlIGZyb20gcnRyZWUiKTsKICAgIH0KICAgIGNvbnN0IHJvb3QgPSB0aGlzLl9sb2FkUm9vdCgpOwogICAgY29uc3QgcmVzdWx0ID0gdGhpcy5fcmVtb3ZlKG9iamVjdElkLCByb290KTsKICAgIGlmICghcmVzdWx0LmZvdW5kKSB7CiAgICAgIHJldHVybiBmYWxzZTsKICAgIH0KICAgIGlmIChyZXN1bHQudW5kZXJmbG93ICYmIHJlc3VsdC5jaGlsZHJlbikgewogICAgICBpZiAocmVzdWx0LmNoaWxkcmVuLmxlbmd0aCA9PT0gMCkgewogICAgICAgIGNvbnN0IG5ld1Jvb3QgPSBuZXcgUlRyZWVOb2RlKHRoaXMsIHsKICAgICAgICAgIGlkOiB0aGlzLm5leHRJZCsrLAogICAgICAgICAgaXNMZWFmOiB0cnVlLAogICAgICAgICAgY2hpbGRyZW46IFtdLAogICAgICAgICAgYmJveDogbnVsbAogICAgICAgIH0pOwogICAgICAgIHRoaXMucm9vdFBvaW50ZXIgPSB0aGlzLl9zYXZlTm9kZShuZXdSb290KTsKICAgICAgfSBlbHNlIGlmIChyZXN1bHQuY2hpbGRyZW4ubGVuZ3RoID09PSAxICYmICFyZXN1bHQuaXNMZWFmKSB7CiAgICAgICAgdGhpcy5yb290UG9pbnRlciA9IHJlc3VsdC5jaGlsZHJlblswXTsKICAgICAgfSBlbHNlIHsKICAgICAgICBjb25zdCBuZXdSb290ID0gbmV3IFJUcmVlTm9kZSh0aGlzLCB7CiAgICAgICAgICBpZDogcm9vdC5pZCwKICAgICAgICAgIGlzTGVhZjogcmVzdWx0LmlzTGVhZiwKICAgICAgICAgIGNoaWxkcmVuOiByZXN1bHQuY2hpbGRyZW4sCiAgICAgICAgICBiYm94OiBudWxsCiAgICAgICAgfSk7CiAgICAgICAgbmV3Um9vdC51cGRhdGVCQm94KCk7CiAgICAgICAgdGhpcy5yb290UG9pbnRlciA9IHRoaXMuX3NhdmVOb2RlKG5ld1Jvb3QpOwogICAgICB9CiAgICB9IGVsc2UgaWYgKHJlc3VsdC5wb2ludGVyKSB7CiAgICAgIHRoaXMucm9vdFBvaW50ZXIgPSByZXN1bHQucG9pbnRlcjsKICAgIH0KICAgIHRoaXMuX3NpemUtLTsKICAgIHRoaXMuX3dyaXRlTWV0YWRhdGEoKTsKICAgIHJldHVybiB0cnVlOwogIH0KICAvKioKICAgKiBJbnRlcm5hbCByZW1vdmUgbWV0aG9kCiAgICogUmV0dXJuczogeyBmb3VuZDogYm9vbGVhbiwgdW5kZXJmbG93OiBib29sZWFuLCBwb2ludGVyOiBQb2ludGVyLCBjaGlsZHJlbjogQXJyYXksIGlzTGVhZjogYm9vbGVhbiB9CiAgICovCiAgX3JlbW92ZShvYmplY3RJZCwgbm9kZSkgewogICAgaWYgKG5vZGUuaXNMZWFmKSB7CiAgICAgIGNvbnN0IGluaXRpYWxMZW5ndGggPSBub2RlLmNoaWxkcmVuLmxlbmd0aDsKICAgICAgbm9kZS5jaGlsZHJlbiA9IG5vZGUuY2hpbGRyZW4uZmlsdGVyKAogICAgICAgIChlbnRyeSkgPT4gIWVudHJ5Lm9iamVjdElkLmVxdWFscyhvYmplY3RJZCkKICAgICAgKTsKICAgICAgaWYgKG5vZGUuY2hpbGRyZW4ubGVuZ3RoID09PSBpbml0aWFsTGVuZ3RoKSB7CiAgICAgICAgcmV0dXJuIHsgZm91bmQ6IGZhbHNlIH07CiAgICAgIH0KICAgICAgbm9kZS51cGRhdGVCQm94KCk7CiAgICAgIGNvbnN0IHBvaW50ZXIgPSB0aGlzLl9zYXZlTm9kZShub2RlKTsKICAgICAgY29uc3QgdW5kZXJmbG93ID0gbm9kZS5jaGlsZHJlbi5sZW5ndGggPCB0aGlzLm1pbkVudHJpZXMgJiYgbm9kZS5jaGlsZHJlbi5sZW5ndGggPiAwOwogICAgICByZXR1cm4gewogICAgICAgIGZvdW5kOiB0cnVlLAogICAgICAgIHVuZGVyZmxvdywKICAgICAgICBwb2ludGVyLAogICAgICAgIGNoaWxkcmVuOiBub2RlLmNoaWxkcmVuLAogICAgICAgIGlzTGVhZjogdHJ1ZQogICAgICB9OwogICAgfSBlbHNlIHsKICAgICAgbGV0IHVwZGF0ZWRDaGlsZHJlbiA9IFsuLi5ub2RlLmNoaWxkcmVuXTsKICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB1cGRhdGVkQ2hpbGRyZW4ubGVuZ3RoOyBpKyspIHsKICAgICAgICBjb25zdCBjaGlsZFBvaW50ZXIgPSB1cGRhdGVkQ2hpbGRyZW5baV07CiAgICAgICAgY29uc3QgY2hpbGROb2RlID0gdGhpcy5fbG9hZE5vZGUoY2hpbGRQb2ludGVyKTsKICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9yZW1vdmUob2JqZWN0SWQsIGNoaWxkTm9kZSk7CiAgICAgICAgaWYgKHJlc3VsdC5mb3VuZCkgewogICAgICAgICAgaWYgKHJlc3VsdC51bmRlcmZsb3cpIHsKICAgICAgICAgICAgY29uc3QgaGFuZGxlZCA9IHRoaXMuX2hhbmRsZVVuZGVyZmxvdyhub2RlLCBpLCBjaGlsZE5vZGUsIHJlc3VsdCk7CiAgICAgICAgICAgIGlmIChoYW5kbGVkLm1lcmdlZCkgewogICAgICAgICAgICAgIHVwZGF0ZWRDaGlsZHJlbiA9IGhhbmRsZWQuY2hpbGRyZW47CiAgICAgICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgICAgdXBkYXRlZENoaWxkcmVuW2ldID0gcmVzdWx0LnBvaW50ZXI7CiAgICAgICAgICAgIH0KICAgICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgIHVwZGF0ZWRDaGlsZHJlbltpXSA9IHJlc3VsdC5wb2ludGVyOwogICAgICAgICAgfQogICAgICAgICAgY29uc3QgdXBkYXRlZE5vZGUgPSBuZXcgUlRyZWVOb2RlKHRoaXMsIHsKICAgICAgICAgICAgaWQ6IG5vZGUuaWQsCiAgICAgICAgICAgIGlzTGVhZjogZmFsc2UsCiAgICAgICAgICAgIGNoaWxkcmVuOiB1cGRhdGVkQ2hpbGRyZW4sCiAgICAgICAgICAgIGJib3g6IG51bGwKICAgICAgICAgIH0pOwogICAgICAgICAgdXBkYXRlZE5vZGUudXBkYXRlQkJveCgpOwogICAgICAgICAgY29uc3QgcG9pbnRlciA9IHRoaXMuX3NhdmVOb2RlKHVwZGF0ZWROb2RlKTsKICAgICAgICAgIGNvbnN0IHVuZGVyZmxvdyA9IHVwZGF0ZWRDaGlsZHJlbi5sZW5ndGggPCB0aGlzLm1pbkVudHJpZXMgJiYgdXBkYXRlZENoaWxkcmVuLmxlbmd0aCA+IDA7CiAgICAgICAgICByZXR1cm4gewogICAgICAgICAgICBmb3VuZDogdHJ1ZSwKICAgICAgICAgICAgdW5kZXJmbG93LAogICAgICAgICAgICBwb2ludGVyLAogICAgICAgICAgICBjaGlsZHJlbjogdXBkYXRlZENoaWxkcmVuLAogICAgICAgICAgICBpc0xlYWY6IGZhbHNlCiAgICAgICAgICB9OwogICAgICAgIH0KICAgICAgfQogICAgICByZXR1cm4geyBmb3VuZDogZmFsc2UgfTsKICAgIH0KICB9CiAgLyoqCiAgICogSGFuZGxlIHVuZGVyZmxvdyBpbiBhIGNoaWxkIG5vZGUgYnkgbWVyZ2luZyBvciByZWRpc3RyaWJ1dGluZwogICAqLwogIF9oYW5kbGVVbmRlcmZsb3cocGFyZW50Tm9kZSwgY2hpbGRJbmRleCwgY2hpbGROb2RlLCBjaGlsZFJlc3VsdCkgewogICAgY29uc3Qgc2libGluZ3MgPSBbXTsKICAgIGlmIChjaGlsZEluZGV4ID4gMCkgewogICAgICBjb25zdCBwcmV2UG9pbnRlciA9IHBhcmVudE5vZGUuY2hpbGRyZW5bY2hpbGRJbmRleCAtIDFdOwogICAgICBjb25zdCBwcmV2Tm9kZSA9IHRoaXMuX2xvYWROb2RlKHByZXZQb2ludGVyKTsKICAgICAgc2libGluZ3MucHVzaCh7IGluZGV4OiBjaGlsZEluZGV4IC0gMSwgbm9kZTogcHJldk5vZGUsIHBvaW50ZXI6IHByZXZQb2ludGVyIH0pOwogICAgfQogICAgaWYgKGNoaWxkSW5kZXggPCBwYXJlbnROb2RlLmNoaWxkcmVuLmxlbmd0aCAtIDEpIHsKICAgICAgY29uc3QgbmV4dFBvaW50ZXIgPSBwYXJlbnROb2RlLmNoaWxkcmVuW2NoaWxkSW5kZXggKyAxXTsKICAgICAgY29uc3QgbmV4dE5vZGUgPSB0aGlzLl9sb2FkTm9kZShuZXh0UG9pbnRlcik7CiAgICAgIHNpYmxpbmdzLnB1c2goeyBpbmRleDogY2hpbGRJbmRleCArIDEsIG5vZGU6IG5leHROb2RlLCBwb2ludGVyOiBuZXh0UG9pbnRlciB9KTsKICAgIH0KICAgIGZvciAoY29uc3Qgc2libGluZyBvZiBzaWJsaW5ncykgewogICAgICBpZiAoc2libGluZy5ub2RlLmNoaWxkcmVuLmxlbmd0aCA+IHRoaXMubWluRW50cmllcykgewogICAgICAgIGNvbnN0IGFsbENoaWxkcmVuID0gWwogICAgICAgICAgLi4uY2hpbGRSZXN1bHQuY2hpbGRyZW4sCiAgICAgICAgICAuLi5zaWJsaW5nLm5vZGUuY2hpbGRyZW4KICAgICAgICBdOwogICAgICAgIGNvbnN0IG1pZCA9IE1hdGguY2VpbChhbGxDaGlsZHJlbi5sZW5ndGggLyAyKTsKICAgICAgICBjb25zdCBuZXdDaGlsZDFDaGlsZHJlbiA9IGFsbENoaWxkcmVuLnNsaWNlKDAsIG1pZCk7CiAgICAgICAgY29uc3QgbmV3Q2hpbGQyQ2hpbGRyZW4gPSBhbGxDaGlsZHJlbi5zbGljZShtaWQpOwogICAgICAgIGNvbnN0IG5ld0NoaWxkMSA9IG5ldyBSVHJlZU5vZGUodGhpcywgewogICAgICAgICAgaWQ6IGNoaWxkTm9kZS5pZCwKICAgICAgICAgIGlzTGVhZjogY2hpbGRSZXN1bHQuaXNMZWFmLAogICAgICAgICAgY2hpbGRyZW46IG5ld0NoaWxkMUNoaWxkcmVuLAogICAgICAgICAgYmJveDogbnVsbAogICAgICAgIH0pOwogICAgICAgIG5ld0NoaWxkMS51cGRhdGVCQm94KCk7CiAgICAgICAgY29uc3QgbmV3Q2hpbGQyID0gbmV3IFJUcmVlTm9kZSh0aGlzLCB7CiAgICAgICAgICBpZDogc2libGluZy5ub2RlLmlkLAogICAgICAgICAgaXNMZWFmOiBzaWJsaW5nLm5vZGUuaXNMZWFmLAogICAgICAgICAgY2hpbGRyZW46IG5ld0NoaWxkMkNoaWxkcmVuLAogICAgICAgICAgYmJveDogbnVsbAogICAgICAgIH0pOwogICAgICAgIG5ld0NoaWxkMi51cGRhdGVCQm94KCk7CiAgICAgICAgY29uc3QgcG9pbnRlcjEgPSB0aGlzLl9zYXZlTm9kZShuZXdDaGlsZDEpOwogICAgICAgIGNvbnN0IHBvaW50ZXIyID0gdGhpcy5fc2F2ZU5vZGUobmV3Q2hpbGQyKTsKICAgICAgICBjb25zdCBuZXdDaGlsZHJlbiA9IFsuLi5wYXJlbnROb2RlLmNoaWxkcmVuXTsKICAgICAgICBjb25zdCBtaW5JbmRleCA9IE1hdGgubWluKGNoaWxkSW5kZXgsIHNpYmxpbmcuaW5kZXgpOwogICAgICAgIGNvbnN0IG1heEluZGV4ID0gTWF0aC5tYXgoY2hpbGRJbmRleCwgc2libGluZy5pbmRleCk7CiAgICAgICAgbmV3Q2hpbGRyZW5bbWluSW5kZXhdID0gcG9pbnRlcjE7CiAgICAgICAgbmV3Q2hpbGRyZW5bbWF4SW5kZXhdID0gcG9pbnRlcjI7CiAgICAgICAgcmV0dXJuIHsgbWVyZ2VkOiB0cnVlLCBjaGlsZHJlbjogbmV3Q2hpbGRyZW4gfTsKICAgICAgfQogICAgfQogICAgaWYgKHNpYmxpbmdzLmxlbmd0aCA+IDApIHsKICAgICAgY29uc3Qgc2libGluZyA9IHNpYmxpbmdzWzBdOwogICAgICBjb25zdCBtZXJnZWRDaGlsZHJlbiA9IFsKICAgICAgICAuLi5jaGlsZFJlc3VsdC5jaGlsZHJlbiwKICAgICAgICAuLi5zaWJsaW5nLm5vZGUuY2hpbGRyZW4KICAgICAgXTsKICAgICAgY29uc3QgbWVyZ2VkTm9kZSA9IG5ldyBSVHJlZU5vZGUodGhpcywgewogICAgICAgIGlkOiB0aGlzLm5leHRJZCsrLAogICAgICAgIGlzTGVhZjogY2hpbGRSZXN1bHQuaXNMZWFmLAogICAgICAgIGNoaWxkcmVuOiBtZXJnZWRDaGlsZHJlbiwKICAgICAgICBiYm94OiBudWxsCiAgICAgIH0pOwogICAgICBtZXJnZWROb2RlLnVwZGF0ZUJCb3goKTsKICAgICAgY29uc3QgbWVyZ2VkUG9pbnRlciA9IHRoaXMuX3NhdmVOb2RlKG1lcmdlZE5vZGUpOwogICAgICBjb25zdCBuZXdDaGlsZHJlbiA9IHBhcmVudE5vZGUuY2hpbGRyZW4uZmlsdGVyKAogICAgICAgIChfLCBpKSA9PiBpICE9PSBjaGlsZEluZGV4ICYmIGkgIT09IHNpYmxpbmcuaW5kZXgKICAgICAgKTsKICAgICAgbmV3Q2hpbGRyZW4ucHVzaChtZXJnZWRQb2ludGVyKTsKICAgICAgcmV0dXJuIHsgbWVyZ2VkOiB0cnVlLCBjaGlsZHJlbjogbmV3Q2hpbGRyZW4gfTsKICAgIH0KICAgIHJldHVybiB7IG1lcmdlZDogZmFsc2UgfTsKICB9CiAgLyoqCiAgICogR2V0IHRoZSBudW1iZXIgb2YgZW50cmllcyBpbiB0aGUgdHJlZQogICAqLwogIHNpemUoKSB7CiAgICByZXR1cm4gdGhpcy5fc2l6ZTsKICB9CiAgLyoqCiAgICogQ2xlYXIgYWxsIGVudHJpZXMgZnJvbSB0aGUgdHJlZSBieSBhcHBlbmRpbmcgYSBuZXcgZW1wdHkgcm9vdCBub2RlCiAgICogUHJlc2VydmVzIHRoZSBhcHBlbmQtb25seSBmaWxlIHN0cnVjdHVyZQogICAqLwogIGFzeW5jIGNsZWFyKCkgewogICAgY29uc3QgbmV3Um9vdCA9IG5ldyBSVHJlZU5vZGUodGhpcywgewogICAgICBpZDogdGhpcy5uZXh0SWQrKywKICAgICAgaXNMZWFmOiB0cnVlLAogICAgICBjaGlsZHJlbjogW10sCiAgICAgIGJib3g6IG51bGwKICAgIH0pOwogICAgdGhpcy5yb290UG9pbnRlciA9IHRoaXMuX3NhdmVOb2RlKG5ld1Jvb3QpOwogICAgdGhpcy5fc2l6ZSA9IDA7CiAgICB0aGlzLl93cml0ZU1ldGFkYXRhKCk7CiAgfQogIC8qKgogICAqIENvbXBhY3QgdGhlIFItdHJlZSBieSBjb3B5aW5nIHRoZSBjdXJyZW50IHJvb3QgYW5kIGFsbCByZWFjaGFibGUgbm9kZXMgaW50byBhIG5ldyBmaWxlLgogICAqIFJldHVybnMgc2l6ZSBtZXRyaWNzIHRvIHNob3cgcmVjbGFpbWVkIHNwYWNlLgogICAqIEBwYXJhbSB7RmlsZVN5c3RlbVN5bmNBY2Nlc3NIYW5kbGV9IGRlc3RTeW5jSGFuZGxlIC0gU3luYyBoYW5kbGUgZm9yIGRlc3RpbmF0aW9uIGZpbGUKICAgKi8KICBhc3luYyBjb21wYWN0KGRlc3RTeW5jSGFuZGxlKSB7CiAgICBpZiAoIXRoaXMuaXNPcGVuKSB7CiAgICAgIHRocm93IG5ldyBFcnJvcigiUi10cmVlIGZpbGUgbXVzdCBiZSBvcGVuZWQgYmVmb3JlIHVzZSIpOwogICAgfQogICAgaWYgKCFkZXN0U3luY0hhbmRsZSkgewogICAgICB0aHJvdyBuZXcgRXJyb3IoIkRlc3RpbmF0aW9uIHN5bmMgaGFuZGxlIGlzIHJlcXVpcmVkIGZvciBjb21wYWN0aW9uIik7CiAgICB9CiAgICB0aGlzLl93cml0ZU1ldGFkYXRhKCk7CiAgICBjb25zdCBvbGRTaXplID0gdGhpcy5maWxlLmdldEZpbGVTaXplKCk7CiAgICBjb25zdCBkZXN0ID0gbmV3IFJUcmVlKGRlc3RTeW5jSGFuZGxlLCB0aGlzLm1heEVudHJpZXMpOwogICAgYXdhaXQgZGVzdC5vcGVuKCk7CiAgICBkZXN0Lm1pbkVudHJpZXMgPSB0aGlzLm1pbkVudHJpZXM7CiAgICBkZXN0Lm5leHRJZCA9IHRoaXMubmV4dElkOwogICAgZGVzdC5fc2l6ZSA9IHRoaXMuX3NpemU7CiAgICBjb25zdCBwb2ludGVyTWFwID0gLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKTsKICAgIGNvbnN0IGNsb25lTm9kZSA9IChwb2ludGVyKSA9PiB7CiAgICAgIGNvbnN0IG9mZnNldCA9IHBvaW50ZXIudmFsdWVPZigpOwogICAgICBpZiAocG9pbnRlck1hcC5oYXMob2Zmc2V0KSkgewogICAgICAgIHJldHVybiBwb2ludGVyTWFwLmdldChvZmZzZXQpOwogICAgICB9CiAgICAgIGNvbnN0IHNvdXJjZU5vZGUgPSB0aGlzLl9sb2FkTm9kZShwb2ludGVyKTsKICAgICAgY29uc3QgY2xvbmVkQ2hpbGRyZW4gPSBbXTsKICAgICAgaWYgKHNvdXJjZU5vZGUuaXNMZWFmKSB7CiAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBzb3VyY2VOb2RlLmNoaWxkcmVuKSB7CiAgICAgICAgICBjbG9uZWRDaGlsZHJlbi5wdXNoKGNoaWxkKTsKICAgICAgICB9CiAgICAgIH0gZWxzZSB7CiAgICAgICAgZm9yIChjb25zdCBjaGlsZFBvaW50ZXIgb2Ygc291cmNlTm9kZS5jaGlsZHJlbikgewogICAgICAgICAgY29uc3QgbmV3Q2hpbGRQdHIgPSBjbG9uZU5vZGUoY2hpbGRQb2ludGVyKTsKICAgICAgICAgIGNsb25lZENoaWxkcmVuLnB1c2gobmV3Q2hpbGRQdHIpOwogICAgICAgIH0KICAgICAgfQogICAgICBjb25zdCBjbG9uZWROb2RlID0gbmV3IFJUcmVlTm9kZShkZXN0LCB7CiAgICAgICAgaWQ6IHNvdXJjZU5vZGUuaWQsCiAgICAgICAgaXNMZWFmOiBzb3VyY2VOb2RlLmlzTGVhZiwKICAgICAgICBjaGlsZHJlbjogY2xvbmVkQ2hpbGRyZW4sCiAgICAgICAgYmJveDogc291cmNlTm9kZS5iYm94CiAgICAgIH0pOwogICAgICBjb25zdCBuZXdQb2ludGVyID0gZGVzdC5fc2F2ZU5vZGUoY2xvbmVkTm9kZSk7CiAgICAgIHBvaW50ZXJNYXAuc2V0KG9mZnNldCwgbmV3UG9pbnRlcik7CiAgICAgIHJldHVybiBuZXdQb2ludGVyOwogICAgfTsKICAgIGNvbnN0IG5ld1Jvb3RQb2ludGVyID0gY2xvbmVOb2RlKHRoaXMucm9vdFBvaW50ZXIpOwogICAgZGVzdC5yb290UG9pbnRlciA9IG5ld1Jvb3RQb2ludGVyOwogICAgZGVzdC5fd3JpdGVNZXRhZGF0YSgpOwogICAgY29uc3QgbmV3U2l6ZSA9IGRlc3QuZmlsZS5nZXRGaWxlU2l6ZSgpOwogICAgYXdhaXQgZGVzdC5jbG9zZSgpOwogICAgcmV0dXJuIHsKICAgICAgb2xkU2l6ZSwKICAgICAgbmV3U2l6ZSwKICAgICAgYnl0ZXNTYXZlZDogTWF0aC5tYXgoMCwgb2xkU2l6ZSAtIG5ld1NpemUpCiAgICB9OwogIH0KfQpjbGFzcyBHZW9zcGF0aWFsSW5kZXggZXh0ZW5kcyBJbmRleCB7CiAgY29uc3RydWN0b3IoaW5kZXhOYW1lLCBrZXlzLCBzdG9yYWdlRmlsZSwgb3B0aW9ucyA9IHt9KSB7CiAgICBzdXBlcihpbmRleE5hbWUsIGtleXMsIHN0b3JhZ2VGaWxlLCBvcHRpb25zKTsKICAgIHRoaXMuZ2VvRmllbGQgPSBPYmplY3Qua2V5cyhrZXlzKVswXTsKICAgIHRoaXMuc3RvcmFnZUZpbGVQYXRoID0gc3RvcmFnZUZpbGU7CiAgICB0aGlzLnJ0cmVlID0gbnVsbDsKICAgIHRoaXMuc3luY0hhbmRsZSA9IG51bGw7CiAgICB0aGlzLmlzT3BlbiA9IGZhbHNlOwogIH0KICAvKioKICAgKiBPcGVuIHRoZSBpbmRleCBmaWxlCiAgICogTXVzdCBiZSBjYWxsZWQgYmVmb3JlIHVzaW5nIHRoZSBpbmRleAogICAqLwogIGFzeW5jIG9wZW4oKSB7CiAgICBpZiAodGhpcy5pc09wZW4pIHsKICAgICAgcmV0dXJuOwogICAgfQogICAgdHJ5IHsKICAgICAgY29uc3QgcGF0aFBhcnRzID0gdGhpcy5zdG9yYWdlRmlsZVBhdGguc3BsaXQoIi8iKS5maWx0ZXIoQm9vbGVhbik7CiAgICAgIGNvbnN0IGZpbGVuYW1lID0gcGF0aFBhcnRzLnBvcCgpOwogICAgICBpZiAoIWZpbGVuYW1lKSB7CiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHN0b3JhZ2UgcGF0aDogJHt0aGlzLnN0b3JhZ2VGaWxlUGF0aH1gKTsKICAgICAgfQogICAgICBsZXQgZGlySGFuZGxlID0gYXdhaXQgZ2xvYmFsVGhpcy5uYXZpZ2F0b3Iuc3RvcmFnZS5nZXREaXJlY3RvcnkoKTsKICAgICAgZm9yIChjb25zdCBwYXJ0IG9mIHBhdGhQYXJ0cykgewogICAgICAgIGRpckhhbmRsZSA9IGF3YWl0IGRpckhhbmRsZS5nZXREaXJlY3RvcnlIYW5kbGUocGFydCwgeyBjcmVhdGU6IHRydWUgfSk7CiAgICAgIH0KICAgICAgY29uc3QgZmlsZUhhbmRsZSA9IGF3YWl0IGRpckhhbmRsZS5nZXRGaWxlSGFuZGxlKGZpbGVuYW1lLCB7IGNyZWF0ZTogdHJ1ZSB9KTsKICAgICAgdGhpcy5zeW5jSGFuZGxlID0gYXdhaXQgZmlsZUhhbmRsZS5jcmVhdGVTeW5jQWNjZXNzSGFuZGxlKCk7CiAgICAgIHRoaXMucnRyZWUgPSBuZXcgUlRyZWUodGhpcy5zeW5jSGFuZGxlLCA5KTsKICAgICAgYXdhaXQgdGhpcy5ydHJlZS5vcGVuKCk7CiAgICAgIHRoaXMuaXNPcGVuID0gdHJ1ZTsKICAgIH0gY2F0Y2ggKGVycm9yKSB7CiAgICAgIGlmIChlcnJvci5jb2RlID09PSAiRU5PRU5UIiB8fCBlcnJvci5tZXNzYWdlICYmIChlcnJvci5tZXNzYWdlLmluY2x1ZGVzKCJJbnZhbGlkIFItdHJlZSIpIHx8IGVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoImZpbGUgdG9vIHNtYWxsIikgfHwgZXJyb3IubWVzc2FnZS5pbmNsdWRlcygiRmFpbGVkIHRvIHJlYWQgbWV0YWRhdGEiKSB8fCBlcnJvci5tZXNzYWdlLmluY2x1ZGVzKCJVbmtub3duIHR5cGUgYnl0ZSIpKSkgewogICAgICAgIGlmICh0aGlzLnN5bmNIYW5kbGUpIHsKICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgIGF3YWl0IHRoaXMuc3luY0hhbmRsZS5jbG9zZSgpOwogICAgICAgICAgfSBjYXRjaCAoZSkgewogICAgICAgICAgfQogICAgICAgICAgdGhpcy5zeW5jSGFuZGxlID0gbnVsbDsKICAgICAgICB9CiAgICAgICAgY29uc3QgcGF0aFBhcnRzID0gdGhpcy5zdG9yYWdlRmlsZVBhdGguc3BsaXQoIi8iKS5maWx0ZXIoQm9vbGVhbik7CiAgICAgICAgY29uc3QgZmlsZW5hbWUgPSBwYXRoUGFydHMucG9wKCk7CiAgICAgICAgaWYgKCFmaWxlbmFtZSkgewogICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHN0b3JhZ2UgcGF0aDogJHt0aGlzLnN0b3JhZ2VGaWxlUGF0aH1gKTsKICAgICAgICB9CiAgICAgICAgbGV0IGRpckhhbmRsZSA9IGF3YWl0IGdsb2JhbFRoaXMubmF2aWdhdG9yLnN0b3JhZ2UuZ2V0RGlyZWN0b3J5KCk7CiAgICAgICAgZm9yIChjb25zdCBwYXJ0IG9mIHBhdGhQYXJ0cykgewogICAgICAgICAgZGlySGFuZGxlID0gYXdhaXQgZGlySGFuZGxlLmdldERpcmVjdG9yeUhhbmRsZShwYXJ0LCB7IGNyZWF0ZTogdHJ1ZSB9KTsKICAgICAgICB9CiAgICAgICAgdHJ5IHsKICAgICAgICAgIGF3YWl0IGRpckhhbmRsZS5yZW1vdmVFbnRyeShmaWxlbmFtZSk7CiAgICAgICAgfSBjYXRjaCAoZSkgewogICAgICAgIH0KICAgICAgICBjb25zdCBmaWxlSGFuZGxlID0gYXdhaXQgZGlySGFuZGxlLmdldEZpbGVIYW5kbGUoZmlsZW5hbWUsIHsgY3JlYXRlOiB0cnVlIH0pOwogICAgICAgIHRoaXMuc3luY0hhbmRsZSA9IGF3YWl0IGZpbGVIYW5kbGUuY3JlYXRlU3luY0FjY2Vzc0hhbmRsZSgpOwogICAgICAgIHRoaXMucnRyZWUgPSBuZXcgUlRyZWUodGhpcy5zeW5jSGFuZGxlLCA5KTsKICAgICAgICBhd2FpdCB0aGlzLnJ0cmVlLm9wZW4oKTsKICAgICAgICB0aGlzLmlzT3BlbiA9IHRydWU7CiAgICAgIH0gZWxzZSB7CiAgICAgICAgdGhyb3cgZXJyb3I7CiAgICAgIH0KICAgIH0KICB9CiAgLyoqCiAgICogQ2xvc2UgdGhlIGluZGV4IGZpbGUKICAgKi8KICBhc3luYyBjbG9zZSgpIHsKICAgIGlmICh0aGlzLmlzT3BlbikgewogICAgICB0cnkgewogICAgICAgIGF3YWl0IHRoaXMucnRyZWUuY2xvc2UoKTsKICAgICAgfSBjYXRjaCAoZXJyb3IpIHsKICAgICAgICBpZiAoIWVycm9yLm1lc3NhZ2UgfHwgIWVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoIkZpbGUgaXMgbm90IG9wZW4iKSkgewogICAgICAgICAgdGhyb3cgZXJyb3I7CiAgICAgICAgfQogICAgICB9CiAgICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7CiAgICB9CiAgfQogIC8qKgogICAqIEV4dHJhY3QgY29vcmRpbmF0ZXMgZnJvbSBhIEdlb0pTT04gb2JqZWN0CiAgICogQHBhcmFtIHtPYmplY3R9IGdlb0pzb24gLSBUaGUgR2VvSlNPTiBvYmplY3QKICAgKiBAcmV0dXJucyB7T2JqZWN0fG51bGx9IE9iamVjdCB3aXRoIGxhdCBhbmQgbG5nLCBvciBudWxsIGlmIGludmFsaWQKICAgKi8KICBfZXh0cmFjdENvb3JkaW5hdGVzKGdlb0pzb24pIHsKICAgIGlmICghZ2VvSnNvbikgcmV0dXJuIG51bGw7CiAgICBpZiAoZ2VvSnNvbi50eXBlID09PSAiRmVhdHVyZUNvbGxlY3Rpb24iICYmIGdlb0pzb24uZmVhdHVyZXMgJiYgZ2VvSnNvbi5mZWF0dXJlcy5sZW5ndGggPiAwKSB7CiAgICAgIGNvbnN0IGZlYXR1cmUgPSBnZW9Kc29uLmZlYXR1cmVzWzBdOwogICAgICBpZiAoZmVhdHVyZS5nZW9tZXRyeSkgewogICAgICAgIHJldHVybiB0aGlzLl9leHRyYWN0Q29vcmRpbmF0ZXMoZmVhdHVyZS5nZW9tZXRyeSk7CiAgICAgIH0KICAgIH0KICAgIGlmIChnZW9Kc29uLnR5cGUgPT09ICJGZWF0dXJlIiAmJiBnZW9Kc29uLmdlb21ldHJ5KSB7CiAgICAgIHJldHVybiB0aGlzLl9leHRyYWN0Q29vcmRpbmF0ZXMoZ2VvSnNvbi5nZW9tZXRyeSk7CiAgICB9CiAgICBpZiAoZ2VvSnNvbi50eXBlID09PSAiUG9pbnQiICYmIGdlb0pzb24uY29vcmRpbmF0ZXMpIHsKICAgICAgY29uc3QgW2xuZywgbGF0XSA9IGdlb0pzb24uY29vcmRpbmF0ZXM7CiAgICAgIGlmICh0eXBlb2YgbG5nID09PSAibnVtYmVyIiAmJiB0eXBlb2YgbGF0ID09PSAibnVtYmVyIikgewogICAgICAgIHJldHVybiB7IGxhdCwgbG5nIH07CiAgICAgIH0KICAgIH0KICAgIGlmIChnZW9Kc29uLnR5cGUgPT09ICJQb2x5Z29uIiAmJiBnZW9Kc29uLmNvb3JkaW5hdGVzICYmIGdlb0pzb24uY29vcmRpbmF0ZXMubGVuZ3RoID4gMCkgewogICAgICBjb25zdCByaW5nID0gZ2VvSnNvbi5jb29yZGluYXRlc1swXTsKICAgICAgaWYgKHJpbmcubGVuZ3RoID4gMCkgewogICAgICAgIGxldCBzdW1MYXQgPSAwLCBzdW1MbmcgPSAwOwogICAgICAgIGZvciAoY29uc3QgY29vcmQgb2YgcmluZykgewogICAgICAgICAgc3VtTG5nICs9IGNvb3JkWzBdOwogICAgICAgICAgc3VtTGF0ICs9IGNvb3JkWzFdOwogICAgICAgIH0KICAgICAgICByZXR1cm4gewogICAgICAgICAgbGF0OiBzdW1MYXQgLyByaW5nLmxlbmd0aCwKICAgICAgICAgIGxuZzogc3VtTG5nIC8gcmluZy5sZW5ndGgKICAgICAgICB9OwogICAgICB9CiAgICB9CiAgICByZXR1cm4gbnVsbDsKICB9CiAgLyoqCiAgICogQWRkIGEgZG9jdW1lbnQgdG8gdGhlIGdlb3NwYXRpYWwgaW5kZXgKICAgKiBAcGFyYW0ge09iamVjdH0gZG9jIC0gVGhlIGRvY3VtZW50IHRvIGluZGV4CiAgICovCiAgYXN5bmMgYWRkKGRvYykgewogICAgaWYgKCFkb2MuX2lkKSB7CiAgICAgIHRocm93IG5ldyBFcnJvcigiRG9jdW1lbnQgbXVzdCBoYXZlIGFuIF9pZCBmaWVsZCIpOwogICAgfQogICAgY29uc3QgZ2VvVmFsdWUgPSBnZXRQcm9wKGRvYywgdGhpcy5nZW9GaWVsZCk7CiAgICBjb25zdCBjb29yZHMgPSB0aGlzLl9leHRyYWN0Q29vcmRpbmF0ZXMoZ2VvVmFsdWUpOwogICAgaWYgKGNvb3JkcykgewogICAgICBhd2FpdCB0aGlzLnJ0cmVlLmluc2VydChjb29yZHMubGF0LCBjb29yZHMubG5nLCBkb2MuX2lkKTsKICAgIH0KICB9CiAgLyoqCiAgICogUmVtb3ZlIGEgZG9jdW1lbnQgZnJvbSB0aGUgZ2Vvc3BhdGlhbCBpbmRleAogICAqIEBwYXJhbSB7T2JqZWN0fSBkb2MgLSBUaGUgZG9jdW1lbnQgdG8gcmVtb3ZlCiAgICovCiAgYXN5bmMgcmVtb3ZlKGRvYykgewogICAgaWYgKCFkb2MuX2lkKSB7CiAgICAgIHJldHVybjsKICAgIH0KICAgIGlmICghKGRvYy5faWQgaW5zdGFuY2VvZiBPYmplY3RJZCkpIHsKICAgICAgY29uc29sZS5lcnJvcihkb2MpOwogICAgICB0aHJvdyBuZXcgRXJyb3IoIkRvY3VtZW50IF9pZCBtdXN0IGJlIGFuIE9iamVjdElkIHRvIHJlbW92ZSBmcm9tIGdlb3NwYXRpYWwgaW5kZXgiKTsKICAgIH0KICAgIGF3YWl0IHRoaXMucnRyZWUucmVtb3ZlKGRvYy5faWQpOwogIH0KICAvKioKICAgKiBRdWVyeSB0aGUgZ2Vvc3BhdGlhbCBpbmRleAogICAqIEBwYXJhbSB7Kn0gcXVlcnkgLSBUaGUgcXVlcnkgb2JqZWN0CiAgICogQHJldHVybnMge1Byb21pc2U8QXJyYXl8bnVsbD59IEFycmF5IG9mIGRvY3VtZW50IElEcyBvciBudWxsIGlmIHF1ZXJ5IGlzIG5vdCBhIGdlb3NwYXRpYWwgcXVlcnkKICAgKi8KICBhc3luYyBxdWVyeShxdWVyeSkgewogICAgaWYgKCF0aGlzLmlzT3BlbikgewogICAgICBhd2FpdCB0aGlzLm9wZW4oKTsKICAgIH0KICAgIGlmICghcXVlcnlbdGhpcy5nZW9GaWVsZF0pIHsKICAgICAgcmV0dXJuIG51bGw7CiAgICB9CiAgICBjb25zdCBnZW9RdWVyeSA9IHF1ZXJ5W3RoaXMuZ2VvRmllbGRdOwogICAgaWYgKGdlb1F1ZXJ5LiRnZW9XaXRoaW4pIHsKICAgICAgY29uc3QgYmJveCA9IGdlb1F1ZXJ5LiRnZW9XaXRoaW47CiAgICAgIGlmIChBcnJheS5pc0FycmF5KGJib3gpICYmIGJib3gubGVuZ3RoID09PSAyKSB7CiAgICAgICAgY29uc3QgbWluTG9uID0gYmJveFswXVswXTsKICAgICAgICBjb25zdCBtYXhMYXQgPSBiYm94WzBdWzFdOwogICAgICAgIGNvbnN0IG1heExvbiA9IGJib3hbMV1bMF07CiAgICAgICAgY29uc3QgbWluTGF0ID0gYmJveFsxXVsxXTsKICAgICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgdGhpcy5ydHJlZS5zZWFyY2hCQm94KHsKICAgICAgICAgIG1pbkxhdCwKICAgICAgICAgIG1heExhdCwKICAgICAgICAgIG1pbkxuZzogbWluTG9uLAogICAgICAgICAgbWF4TG5nOiBtYXhMb24KICAgICAgICB9KTsKICAgICAgICByZXR1cm4gcmVzdWx0cy5tYXAoKGVudHJ5KSA9PiBlbnRyeS5vYmplY3RJZC50b1N0cmluZygpKTsKICAgICAgfQogICAgfQogICAgaWYgKGdlb1F1ZXJ5LiRuZWFyKSB7CiAgICAgIGNvbnN0IG5lYXJRdWVyeSA9IGdlb1F1ZXJ5LiRuZWFyOwogICAgICBsZXQgY29vcmRpbmF0ZXM7CiAgICAgIGlmIChuZWFyUXVlcnkuJGdlb21ldHJ5KSB7CiAgICAgICAgY29vcmRpbmF0ZXMgPSBuZWFyUXVlcnkuJGdlb21ldHJ5LmNvb3JkaW5hdGVzOwogICAgICB9IGVsc2UgaWYgKG5lYXJRdWVyeS5jb29yZGluYXRlcykgewogICAgICAgIGNvb3JkaW5hdGVzID0gbmVhclF1ZXJ5LmNvb3JkaW5hdGVzOwogICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkobmVhclF1ZXJ5KSkgewogICAgICAgIGNvb3JkaW5hdGVzID0gbmVhclF1ZXJ5OwogICAgICB9IGVsc2UgewogICAgICAgIHJldHVybiBudWxsOwogICAgICB9CiAgICAgIGlmICghY29vcmRpbmF0ZXMgfHwgY29vcmRpbmF0ZXMubGVuZ3RoIDwgMikgewogICAgICAgIHJldHVybiBudWxsOwogICAgICB9CiAgICAgIGNvbnN0IFtsbmcsIGxhdF0gPSBjb29yZGluYXRlczsKICAgICAgY29uc3QgbWF4RGlzdGFuY2VNZXRlcnMgPSBuZWFyUXVlcnkuJG1heERpc3RhbmNlIHx8IDFlNjsKICAgICAgY29uc3QgbWF4RGlzdGFuY2VLbSA9IG1heERpc3RhbmNlTWV0ZXJzIC8gMWUzOwogICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgdGhpcy5ydHJlZS5zZWFyY2hSYWRpdXMobGF0LCBsbmcsIG1heERpc3RhbmNlS20pOwogICAgICByZXN1bHRzLnNvcnQoKGEsIGIpID0+IGEuZGlzdGFuY2UgLSBiLmRpc3RhbmNlKTsKICAgICAgcmV0dXJuIHJlc3VsdHMubWFwKChlbnRyeSkgPT4gZW50cnkub2JqZWN0SWQudG9TdHJpbmcoKSk7CiAgICB9CiAgICBpZiAoZ2VvUXVlcnkuJG5lYXJTcGhlcmUpIHsKICAgICAgY29uc3QgbmVhclF1ZXJ5ID0gZ2VvUXVlcnkuJG5lYXJTcGhlcmU7CiAgICAgIGxldCBjb29yZGluYXRlczsKICAgICAgaWYgKG5lYXJRdWVyeS4kZ2VvbWV0cnkpIHsKICAgICAgICBjb29yZGluYXRlcyA9IG5lYXJRdWVyeS4kZ2VvbWV0cnkuY29vcmRpbmF0ZXM7CiAgICAgIH0gZWxzZSBpZiAobmVhclF1ZXJ5LmNvb3JkaW5hdGVzKSB7CiAgICAgICAgY29vcmRpbmF0ZXMgPSBuZWFyUXVlcnkuY29vcmRpbmF0ZXM7CiAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShuZWFyUXVlcnkpKSB7CiAgICAgICAgY29vcmRpbmF0ZXMgPSBuZWFyUXVlcnk7CiAgICAgIH0gZWxzZSB7CiAgICAgICAgcmV0dXJuIG51bGw7CiAgICAgIH0KICAgICAgaWYgKCFjb29yZGluYXRlcyB8fCBjb29yZGluYXRlcy5sZW5ndGggPCAyKSB7CiAgICAgICAgcmV0dXJuIG51bGw7CiAgICAgIH0KICAgICAgY29uc3QgW2xuZywgbGF0XSA9IGNvb3JkaW5hdGVzOwogICAgICBjb25zdCBtYXhEaXN0YW5jZU1ldGVycyA9IG5lYXJRdWVyeS4kbWF4RGlzdGFuY2UgfHwgMWU2OwogICAgICBjb25zdCBtYXhEaXN0YW5jZUttID0gbWF4RGlzdGFuY2VNZXRlcnMgLyAxZTM7CiAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCB0aGlzLnJ0cmVlLnNlYXJjaFJhZGl1cyhsYXQsIGxuZywgbWF4RGlzdGFuY2VLbSk7CiAgICAgIHJlc3VsdHMuc29ydCgoYSwgYikgPT4gYS5kaXN0YW5jZSAtIGIuZGlzdGFuY2UpOwogICAgICByZXR1cm4gcmVzdWx0cy5tYXAoKGVudHJ5KSA9PiBlbnRyeS5vYmplY3RJZC50b1N0cmluZygpKTsKICAgIH0KICAgIGlmIChnZW9RdWVyeS4kZ2VvSW50ZXJzZWN0cykgewogICAgICBjb25zdCBpbnRlcnNlY3RzUXVlcnkgPSBnZW9RdWVyeS4kZ2VvSW50ZXJzZWN0czsKICAgICAgbGV0IGdlb21ldHJ5OwogICAgICBpZiAoaW50ZXJzZWN0c1F1ZXJ5LiRnZW9tZXRyeSkgewogICAgICAgIGdlb21ldHJ5ID0gaW50ZXJzZWN0c1F1ZXJ5LiRnZW9tZXRyeTsKICAgICAgfSBlbHNlIHsKICAgICAgICByZXR1cm4gbnVsbDsKICAgICAgfQogICAgICBpZiAoIWdlb21ldHJ5IHx8ICFnZW9tZXRyeS50eXBlKSB7CiAgICAgICAgcmV0dXJuIG51bGw7CiAgICAgIH0KICAgICAgaWYgKGdlb21ldHJ5LnR5cGUgPT09ICJQb2ludCIpIHsKICAgICAgICBjb25zdCBbbG5nLCBsYXRdID0gZ2VvbWV0cnkuY29vcmRpbmF0ZXM7CiAgICAgICAgY29uc3QgZXBzaWxvbiA9IDFlLTQ7CiAgICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHRoaXMucnRyZWUuc2VhcmNoQkJveCh7CiAgICAgICAgICBtaW5MYXQ6IGxhdCAtIGVwc2lsb24sCiAgICAgICAgICBtYXhMYXQ6IGxhdCArIGVwc2lsb24sCiAgICAgICAgICBtaW5Mbmc6IGxuZyAtIGVwc2lsb24sCiAgICAgICAgICBtYXhMbmc6IGxuZyArIGVwc2lsb24KICAgICAgICB9KTsKICAgICAgICByZXR1cm4gcmVzdWx0cy5tYXAoKGVudHJ5KSA9PiBlbnRyeS5vYmplY3RJZC50b1N0cmluZygpKTsKICAgICAgfSBlbHNlIGlmIChnZW9tZXRyeS50eXBlID09PSAiUG9seWdvbiIpIHsKICAgICAgICBjb25zdCBjb29yZGluYXRlcyA9IGdlb21ldHJ5LmNvb3JkaW5hdGVzOwogICAgICAgIGlmICghY29vcmRpbmF0ZXMgfHwgY29vcmRpbmF0ZXMubGVuZ3RoID09PSAwKSB7CiAgICAgICAgICByZXR1cm4gbnVsbDsKICAgICAgICB9CiAgICAgICAgY29uc3QgcmluZyA9IGNvb3JkaW5hdGVzWzBdOwogICAgICAgIGlmICghcmluZyB8fCByaW5nLmxlbmd0aCA8IDMpIHsKICAgICAgICAgIHJldHVybiBudWxsOwogICAgICAgIH0KICAgICAgICBsZXQgbWluTGF0ID0gSW5maW5pdHksIG1heExhdCA9IC1JbmZpbml0eTsKICAgICAgICBsZXQgbWluTG5nID0gSW5maW5pdHksIG1heExuZyA9IC1JbmZpbml0eTsKICAgICAgICBmb3IgKGNvbnN0IGNvb3JkIG9mIHJpbmcpIHsKICAgICAgICAgIGNvbnN0IFtsbmcsIGxhdF0gPSBjb29yZDsKICAgICAgICAgIG1pbkxhdCA9IE1hdGgubWluKG1pbkxhdCwgbGF0KTsKICAgICAgICAgIG1heExhdCA9IE1hdGgubWF4KG1heExhdCwgbGF0KTsKICAgICAgICAgIG1pbkxuZyA9IE1hdGgubWluKG1pbkxuZywgbG5nKTsKICAgICAgICAgIG1heExuZyA9IE1hdGgubWF4KG1heExuZywgbG5nKTsKICAgICAgICB9CiAgICAgICAgY29uc3QgY2FuZGlkYXRlcyA9IGF3YWl0IHRoaXMucnRyZWUuc2VhcmNoQkJveCh7CiAgICAgICAgICBtaW5MYXQsCiAgICAgICAgICBtYXhMYXQsCiAgICAgICAgICBtaW5MbmcsCiAgICAgICAgICBtYXhMbmcKICAgICAgICB9KTsKICAgICAgICBjb25zdCByZXN1bHRzID0gY2FuZGlkYXRlcy5maWx0ZXIoKGVudHJ5KSA9PiB0aGlzLl9wb2ludEluUG9seWdvbihlbnRyeS5sYXQsIGVudHJ5LmxuZywgcmluZykpOwogICAgICAgIHJldHVybiByZXN1bHRzLm1hcCgoZW50cnkpID0+IGVudHJ5Lm9iamVjdElkLnRvU3RyaW5nKCkpOwogICAgICB9CiAgICAgIHJldHVybiBudWxsOwogICAgfQogICAgcmV0dXJuIG51bGw7CiAgfQogIC8vIC8qKgogIC8vICAqIENhbGN1bGF0ZSBkaXN0YW5jZSBiZXR3ZWVuIHR3byBwb2ludHMgdXNpbmcgSGF2ZXJzaW5lIGZvcm11bGEKICAvLyAgKiBAcGFyYW0ge251bWJlcn0gbGF0MSAtIExhdGl0dWRlIG9mIGZpcnN0IHBvaW50CiAgLy8gICogQHBhcmFtIHtudW1iZXJ9IGxuZzEgLSBMb25naXR1ZGUgb2YgZmlyc3QgcG9pbnQKICAvLyAgKiBAcGFyYW0ge251bWJlcn0gbGF0MiAtIExhdGl0dWRlIG9mIHNlY29uZCBwb2ludAogIC8vICAqIEBwYXJhbSB7bnVtYmVyfSBsbmcyIC0gTG9uZ2l0dWRlIG9mIHNlY29uZCBwb2ludAogIC8vICAqIEByZXR1cm5zIHtudW1iZXJ9IERpc3RhbmNlIGluIGtpbG9tZXRlcnMKICAvLyAgKi8KICAvLyBfaGF2ZXJzaW5lRGlzdGFuY2UobGF0MSwgbG5nMSwgbGF0MiwgbG5nMikgewogIC8vIAljb25zdCBSID0gNjM3MTsgLy8gRWFydGgncyByYWRpdXMgaW4ga2lsb21ldGVycwogIC8vIAljb25zdCBkTGF0ID0gKGxhdDIgLSBsYXQxKSAqIE1hdGguUEkgLyAxODA7CiAgLy8gCWNvbnN0IGRMbmcgPSAobG5nMiAtIGxuZzEpICogTWF0aC5QSSAvIDE4MDsKICAvLyAJY29uc3QgYSA9IE1hdGguc2luKGRMYXQgLyAyKSAqIE1hdGguc2luKGRMYXQgLyAyKSArCiAgLy8gCQlNYXRoLmNvcyhsYXQxICogTWF0aC5QSSAvIDE4MCkgKiBNYXRoLmNvcyhsYXQyICogTWF0aC5QSSAvIDE4MCkgKgogIC8vIAkJTWF0aC5zaW4oZExuZyAvIDIpICogTWF0aC5zaW4oZExuZyAvIDIpOwogIC8vIAljb25zdCBjID0gMiAqIE1hdGguYXRhbjIoTWF0aC5zcXJ0KGEpLCBNYXRoLnNxcnQoMSAtIGEpKTsKICAvLyAJcmV0dXJuIFIgKiBjOwogIC8vIH0KICAvKioKICAgKiBUZXN0IGlmIGEgcG9pbnQgaXMgaW5zaWRlIGEgcG9seWdvbiB1c2luZyByYXkgY2FzdGluZyBhbGdvcml0aG0KICAgKiBAcGFyYW0ge251bWJlcn0gbGF0IC0gUG9pbnQgbGF0aXR1ZGUKICAgKiBAcGFyYW0ge251bWJlcn0gbG5nIC0gUG9pbnQgbG9uZ2l0dWRlCiAgICogQHBhcmFtIHtBcnJheX0gcmluZyAtIFBvbHlnb24gcmluZyBhcyBhcnJheSBvZiBbbG5nLCBsYXRdIGNvb3JkaW5hdGVzCiAgICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgcG9pbnQgaXMgaW5zaWRlIHBvbHlnb24KICAgKi8KICBfcG9pbnRJblBvbHlnb24obGF0LCBsbmcsIHJpbmcpIHsKICAgIGxldCBpbnNpZGUgPSBmYWxzZTsKICAgIGZvciAobGV0IGkgPSAwLCBqID0gcmluZy5sZW5ndGggLSAxOyBpIDwgcmluZy5sZW5ndGg7IGogPSBpKyspIHsKICAgICAgY29uc3QgW3hpLCB5aV0gPSByaW5nW2ldOwogICAgICBjb25zdCBbeGosIHlqXSA9IHJpbmdbal07CiAgICAgIGNvbnN0IGludGVyc2VjdCA9IHlpID4gbGF0ICE9PSB5aiA+IGxhdCAmJiBsbmcgPCAoeGogLSB4aSkgKiAobGF0IC0geWkpIC8gKHlqIC0geWkpICsgeGk7CiAgICAgIGlmIChpbnRlcnNlY3QpIHsKICAgICAgICBpbnNpZGUgPSAhaW5zaWRlOwogICAgICB9CiAgICB9CiAgICByZXR1cm4gaW5zaWRlOwogIH0KICAvKioKICAgKiBDbGVhciBhbGwgZGF0YSBmcm9tIHRoZSBpbmRleAogICAqLwogIC8vIFRPRE86IGRvbnQnIGRlbGV0ZSB0aGUgZmlsZSBvciBqdXN0IGNsZWFyIHRoZSBSVHJlZSBjb250ZW50cwogIGFzeW5jIGNsZWFyKCkgewogICAgYXdhaXQgdGhpcy5jbG9zZSgpOwogICAgdHJ5IHsKICAgICAgY29uc3QgcGF0aFBhcnRzID0gdGhpcy5zdG9yYWdlRmlsZVBhdGguc3BsaXQoIi8iKS5maWx0ZXIoQm9vbGVhbik7CiAgICAgIGNvbnN0IGZpbGVuYW1lID0gcGF0aFBhcnRzLnBvcCgpOwogICAgICBsZXQgZGlySGFuZGxlID0gYXdhaXQgZ2xvYmFsVGhpcy5uYXZpZ2F0b3Iuc3RvcmFnZS5nZXREaXJlY3RvcnkoKTsKICAgICAgZm9yIChjb25zdCBwYXJ0IG9mIHBhdGhQYXJ0cykgewogICAgICAgIGRpckhhbmRsZSA9IGF3YWl0IGRpckhhbmRsZS5nZXREaXJlY3RvcnlIYW5kbGUocGFydCwgeyBjcmVhdGU6IGZhbHNlIH0pOwogICAgICB9CiAgICAgIGF3YWl0IGRpckhhbmRsZS5yZW1vdmVFbnRyeShmaWxlbmFtZSk7CiAgICB9IGNhdGNoIChlcnIpIHsKICAgICAgaWYgKCFlcnIgfHwgZXJyLm5hbWUgIT09ICJOb3RGb3VuZEVycm9yIikgewogICAgICAgIHRocm93IGVycjsKICAgICAgfQogICAgfQogICAgYXdhaXQgdGhpcy5vcGVuKCk7CiAgfQogIC8qKgogICAqIEdldCBpbmRleCBzcGVjaWZpY2F0aW9uCiAgICovCiAgZ2V0U3BlYygpIHsKICAgIHJldHVybiB7CiAgICAgIG5hbWU6IHRoaXMubmFtZSwKICAgICAga2V5OiB0aGlzLmtleXMsCiAgICAgICIyZHNwaGVyZUluZGV4VmVyc2lvbiI6IDMKICAgIH07CiAgfQp9CmNsYXNzIFF1ZXJ5UGxhbiB7CiAgY29uc3RydWN0b3IoKSB7CiAgICB0aGlzLnR5cGUgPSAiZnVsbF9zY2FuIjsKICAgIHRoaXMuaW5kZXhlcyA9IFtdOwogICAgdGhpcy5pbmRleFNjYW5zID0gW107CiAgICB0aGlzLmVzdGltYXRlZENvc3QgPSBJbmZpbml0eTsKICAgIHRoaXMuaW5kZXhPbmx5ID0gZmFsc2U7CiAgfQp9CmNsYXNzIFF1ZXJ5UGxhbm5lciB7CiAgY29uc3RydWN0b3IoaW5kZXhlcykgewogICAgdGhpcy5pbmRleGVzID0gaW5kZXhlczsKICB9CiAgLyoqCiAgICogR2VuZXJhdGUgYW4gZXhlY3V0aW9uIHBsYW4gZm9yIGEgcXVlcnkKICAgKiBAcGFyYW0ge09iamVjdH0gcXVlcnkgLSBNb25nb0RCIHF1ZXJ5IG9iamVjdAogICAqIEByZXR1cm5zIHtRdWVyeVBsYW59IEV4ZWN1dGlvbiBwbGFuCiAgICovCiAgcGxhbihxdWVyeSkgewogICAgY29uc3QgcGxhbiA9IG5ldyBRdWVyeVBsYW4oKTsKICAgIGlmICghcXVlcnkgfHwgT2JqZWN0LmtleXMocXVlcnkpLmxlbmd0aCA9PT0gMCkgewogICAgICByZXR1cm4gcGxhbjsKICAgIH0KICAgIGNvbnN0IGFuYWx5c2lzID0gdGhpcy5fYW5hbHl6ZVF1ZXJ5KHF1ZXJ5KTsKICAgIGlmIChhbmFseXNpcy5oYXNUZXh0U2VhcmNoKSB7CiAgICAgIGNvbnN0IHRleHRQbGFuID0gdGhpcy5fcGxhblRleHRTZWFyY2gocXVlcnksIGFuYWx5c2lzKTsKICAgICAgaWYgKHRleHRQbGFuKSB7CiAgICAgICAgcmV0dXJuIHRleHRQbGFuOwogICAgICB9CiAgICB9CiAgICBpZiAoYW5hbHlzaXMuaGFzR2VvUXVlcnkpIHsKICAgICAgY29uc3QgZ2VvUGxhbiA9IHRoaXMuX3BsYW5HZW9RdWVyeShxdWVyeSwgYW5hbHlzaXMpOwogICAgICBpZiAoZ2VvUGxhbikgewogICAgICAgIHJldHVybiBnZW9QbGFuOwogICAgICB9CiAgICB9CiAgICBpZiAoYW5hbHlzaXMudHlwZSA9PT0gImFuZCIpIHsKICAgICAgY29uc3QgYW5kUGxhbiA9IHRoaXMuX3BsYW5BbmRRdWVyeShxdWVyeSwgYW5hbHlzaXMpOwogICAgICBpZiAoYW5kUGxhbi50eXBlICE9PSAiZnVsbF9zY2FuIikgewogICAgICAgIHJldHVybiBhbmRQbGFuOwogICAgICB9CiAgICB9CiAgICBpZiAoYW5hbHlzaXMudHlwZSA9PT0gIm9yIikgewogICAgICBjb25zdCBvclBsYW4gPSB0aGlzLl9wbGFuT3JRdWVyeShxdWVyeSwgYW5hbHlzaXMpOwogICAgICBpZiAob3JQbGFuLnR5cGUgIT09ICJmdWxsX3NjYW4iKSB7CiAgICAgICAgcmV0dXJuIG9yUGxhbjsKICAgICAgfQogICAgfQogICAgY29uc3Qgc2ltcGxlUGxhbiA9IHRoaXMuX3BsYW5TaW1wbGVRdWVyeShxdWVyeSk7CiAgICBpZiAoc2ltcGxlUGxhbi50eXBlICE9PSAiZnVsbF9zY2FuIikgewogICAgICByZXR1cm4gc2ltcGxlUGxhbjsKICAgIH0KICAgIHJldHVybiBwbGFuOwogIH0KICAvKioKICAgKiBBbmFseXplIHF1ZXJ5IHN0cnVjdHVyZQogICAqIEBwcml2YXRlCiAgICovCiAgX2FuYWx5emVRdWVyeShxdWVyeSkgewogICAgY29uc3QgYW5hbHlzaXMgPSB7CiAgICAgIHR5cGU6ICJzaW1wbGUiLAogICAgICAvLyAnc2ltcGxlJywgJ2FuZCcsICdvcicsICdjb21wbGV4JwogICAgICBmaWVsZHM6IFtdLAogICAgICBvcGVyYXRvcnM6IHt9LAogICAgICBoYXNUZXh0U2VhcmNoOiBmYWxzZSwKICAgICAgaGFzR2VvUXVlcnk6IGZhbHNlLAogICAgICBjb25kaXRpb25zOiBbXQogICAgfTsKICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhxdWVyeSk7CiAgICBpZiAoa2V5cy5sZW5ndGggPT09IDEpIHsKICAgICAgY29uc3Qga2V5ID0ga2V5c1swXTsKICAgICAgaWYgKGtleSA9PT0gIiRhbmQiKSB7CiAgICAgICAgYW5hbHlzaXMudHlwZSA9ICJhbmQiOwogICAgICAgIGFuYWx5c2lzLmNvbmRpdGlvbnMgPSBxdWVyeS4kYW5kOwogICAgICAgIGZvciAoY29uc3QgY29uZGl0aW9uIG9mIGFuYWx5c2lzLmNvbmRpdGlvbnMpIHsKICAgICAgICAgIGNvbnN0IHN1YkFuYWx5c2lzID0gdGhpcy5fYW5hbHl6ZVF1ZXJ5KGNvbmRpdGlvbik7CiAgICAgICAgICBhbmFseXNpcy5maWVsZHMucHVzaCguLi5zdWJBbmFseXNpcy5maWVsZHMpOwogICAgICAgICAgaWYgKHN1YkFuYWx5c2lzLmhhc1RleHRTZWFyY2gpIGFuYWx5c2lzLmhhc1RleHRTZWFyY2ggPSB0cnVlOwogICAgICAgICAgaWYgKHN1YkFuYWx5c2lzLmhhc0dlb1F1ZXJ5KSBhbmFseXNpcy5oYXNHZW9RdWVyeSA9IHRydWU7CiAgICAgICAgfQogICAgICAgIHJldHVybiBhbmFseXNpczsKICAgICAgfSBlbHNlIGlmIChrZXkgPT09ICIkb3IiKSB7CiAgICAgICAgYW5hbHlzaXMudHlwZSA9ICJvciI7CiAgICAgICAgYW5hbHlzaXMuY29uZGl0aW9ucyA9IHF1ZXJ5LiRvcjsKICAgICAgICBmb3IgKGNvbnN0IGNvbmRpdGlvbiBvZiBhbmFseXNpcy5jb25kaXRpb25zKSB7CiAgICAgICAgICBjb25zdCBzdWJBbmFseXNpcyA9IHRoaXMuX2FuYWx5emVRdWVyeShjb25kaXRpb24pOwogICAgICAgICAgYW5hbHlzaXMuZmllbGRzLnB1c2goLi4uc3ViQW5hbHlzaXMuZmllbGRzKTsKICAgICAgICAgIGlmIChzdWJBbmFseXNpcy5oYXNUZXh0U2VhcmNoKSBhbmFseXNpcy5oYXNUZXh0U2VhcmNoID0gdHJ1ZTsKICAgICAgICAgIGlmIChzdWJBbmFseXNpcy5oYXNHZW9RdWVyeSkgYW5hbHlzaXMuaGFzR2VvUXVlcnkgPSB0cnVlOwogICAgICAgIH0KICAgICAgICByZXR1cm4gYW5hbHlzaXM7CiAgICAgIH0KICAgIH0KICAgIGZvciAoY29uc3QgZmllbGQgb2Yga2V5cykgewogICAgICBpZiAoZmllbGQuc3RhcnRzV2l0aCgiJCIpKSB7CiAgICAgICAgY29udGludWU7CiAgICAgIH0KICAgICAgYW5hbHlzaXMuZmllbGRzLnB1c2goZmllbGQpOwogICAgICBjb25zdCB2YWx1ZSA9IHF1ZXJ5W2ZpZWxkXTsKICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gIm9iamVjdCIgJiYgdmFsdWUgIT09IG51bGwgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUpKSB7CiAgICAgICAgY29uc3Qgb3BzID0gT2JqZWN0LmtleXModmFsdWUpOwogICAgICAgIGFuYWx5c2lzLm9wZXJhdG9yc1tmaWVsZF0gPSBvcHM7CiAgICAgICAgaWYgKG9wcy5pbmNsdWRlcygiJHRleHQiKSkgewogICAgICAgICAgYW5hbHlzaXMuaGFzVGV4dFNlYXJjaCA9IHRydWU7CiAgICAgICAgfQogICAgICAgIGlmIChvcHMuc29tZSgob3ApID0+IFsiJGdlb1dpdGhpbiIsICIkZ2VvSW50ZXJzZWN0cyIsICIkbmVhciIsICIkbmVhclNwaGVyZSJdLmluY2x1ZGVzKG9wKSkpIHsKICAgICAgICAgIGFuYWx5c2lzLmhhc0dlb1F1ZXJ5ID0gdHJ1ZTsKICAgICAgICB9CiAgICAgIH0KICAgIH0KICAgIGlmIChrZXlzLmxlbmd0aCA+IDEpIHsKICAgICAgYW5hbHlzaXMudHlwZSA9ICJhbmQiOwogICAgfQogICAgcmV0dXJuIGFuYWx5c2lzOwogIH0KICAvKioKICAgKiBQbGFuIGZvciB0ZXh0IHNlYXJjaCBxdWVyaWVzCiAgICogQHByaXZhdGUKICAgKi8KICBfcGxhblRleHRTZWFyY2gocXVlcnksIGFuYWx5c2lzKSB7CiAgICBmb3IgKGNvbnN0IFtpbmRleE5hbWUsIGluZGV4XSBvZiB0aGlzLmluZGV4ZXMpIHsKICAgICAgaWYgKGluZGV4IGluc3RhbmNlb2YgVGV4dENvbGxlY3Rpb25JbmRleCkgewogICAgICAgIGNvbnN0IHRleHRRdWVyeSA9IHRoaXMuX2V4dHJhY3RUZXh0UXVlcnkocXVlcnkpOwogICAgICAgIGlmICh0ZXh0UXVlcnkpIHsKICAgICAgICAgIGNvbnN0IHBsYW4gPSBuZXcgUXVlcnlQbGFuKCk7CiAgICAgICAgICBwbGFuLnR5cGUgPSAiaW5kZXhfc2NhbiI7CiAgICAgICAgICBwbGFuLmluZGV4ZXMgPSBbaW5kZXhOYW1lXTsKICAgICAgICAgIHBsYW4uaW5kZXhTY2FucyA9IFt7IGluZGV4TmFtZSwgaW5kZXgsIHRleHRRdWVyeSB9XTsKICAgICAgICAgIHBsYW4uZXN0aW1hdGVkQ29zdCA9IDEwMDsKICAgICAgICAgIHBsYW4uaW5kZXhPbmx5ID0gdHJ1ZTsKICAgICAgICAgIHJldHVybiBwbGFuOwogICAgICAgIH0KICAgICAgfQogICAgfQogICAgcmV0dXJuIG51bGw7CiAgfQogIC8qKgogICAqIEV4dHJhY3QgJHRleHQgcXVlcnkgZnJvbSBxdWVyeSBvYmplY3QKICAgKiBAcHJpdmF0ZQogICAqLwogIF9leHRyYWN0VGV4dFF1ZXJ5KHF1ZXJ5KSB7CiAgICBmb3IgKGNvbnN0IGZpZWxkIGluIHF1ZXJ5KSB7CiAgICAgIGNvbnN0IHZhbHVlID0gcXVlcnlbZmllbGRdOwogICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAib2JqZWN0IiAmJiB2YWx1ZSAhPT0gbnVsbCAmJiB2YWx1ZS4kdGV4dCkgewogICAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUuJHRleHQgPT09ICJzdHJpbmciID8gdmFsdWUuJHRleHQgOiB2YWx1ZS4kdGV4dC4kc2VhcmNoOwogICAgICB9CiAgICB9CiAgICByZXR1cm4gbnVsbDsKICB9CiAgLyoqCiAgICogUGxhbiBmb3IgZ2Vvc3BhdGlhbCBxdWVyaWVzCiAgICogQHByaXZhdGUKICAgKi8KICBfcGxhbkdlb1F1ZXJ5KHF1ZXJ5LCBhbmFseXNpcykgewogICAgZm9yIChjb25zdCBbaW5kZXhOYW1lLCBpbmRleF0gb2YgdGhpcy5pbmRleGVzKSB7CiAgICAgIGlmIChpbmRleCBpbnN0YW5jZW9mIEdlb3NwYXRpYWxJbmRleCkgewogICAgICAgIGNvbnN0IHBsYW4gPSBuZXcgUXVlcnlQbGFuKCk7CiAgICAgICAgcGxhbi50eXBlID0gImluZGV4X3NjYW4iOwogICAgICAgIHBsYW4uaW5kZXhlcyA9IFtpbmRleE5hbWVdOwogICAgICAgIHBsYW4uaW5kZXhTY2FucyA9IFt7IGluZGV4TmFtZSwgaW5kZXgsIHF1ZXJ5IH1dOwogICAgICAgIHBsYW4uZXN0aW1hdGVkQ29zdCA9IDEwMDsKICAgICAgICBwbGFuLmluZGV4T25seSA9IHRydWU7CiAgICAgICAgcmV0dXJuIHBsYW47CiAgICAgIH0KICAgIH0KICAgIHJldHVybiBudWxsOwogIH0KICAvKioKICAgKiBQbGFuIGZvciAkYW5kIHF1ZXJpZXMgKGluZGV4IGludGVyc2VjdGlvbikKICAgKiBAcHJpdmF0ZQogICAqLwogIF9wbGFuQW5kUXVlcnkocXVlcnksIGFuYWx5c2lzKSB7CiAgICBjb25zdCBwbGFuID0gbmV3IFF1ZXJ5UGxhbigpOwogICAgbGV0IGNvbmRpdGlvbnM7CiAgICBpZiAocXVlcnkuJGFuZCkgewogICAgICBjb25kaXRpb25zID0gcXVlcnkuJGFuZDsKICAgIH0gZWxzZSB7CiAgICAgIGNvbmRpdGlvbnMgPSBPYmplY3Qua2V5cyhxdWVyeSkubWFwKChmaWVsZCkgPT4gKHsgW2ZpZWxkXTogcXVlcnlbZmllbGRdIH0pKTsKICAgIH0KICAgIGNvbnN0IGluZGV4YWJsZUNvbmRpdGlvbnMgPSBbXTsKICAgIGZvciAoY29uc3QgY29uZGl0aW9uIG9mIGNvbmRpdGlvbnMpIHsKICAgICAgY29uc3QgY29uZGl0aW9uUGxhbiA9IHRoaXMuX3BsYW5TaW1wbGVRdWVyeShjb25kaXRpb24pOwogICAgICBpZiAoY29uZGl0aW9uUGxhbi50eXBlID09PSAiaW5kZXhfc2NhbiIpIHsKICAgICAgICBpbmRleGFibGVDb25kaXRpb25zLnB1c2goY29uZGl0aW9uUGxhbi5pbmRleFNjYW5zWzBdKTsKICAgICAgfQogICAgfQogICAgaWYgKGluZGV4YWJsZUNvbmRpdGlvbnMubGVuZ3RoID4gMSkgewogICAgICBwbGFuLnR5cGUgPSAiaW5kZXhfaW50ZXJzZWN0aW9uIjsKICAgICAgcGxhbi5pbmRleFNjYW5zID0gaW5kZXhhYmxlQ29uZGl0aW9uczsKICAgICAgcGxhbi5pbmRleGVzID0gaW5kZXhhYmxlQ29uZGl0aW9ucy5tYXAoKHNjYW4pID0+IHNjYW4uaW5kZXhOYW1lKTsKICAgICAgcGxhbi5lc3RpbWF0ZWRDb3N0ID0gNTA7CiAgICAgIHJldHVybiBwbGFuOwogICAgfQogICAgaWYgKGluZGV4YWJsZUNvbmRpdGlvbnMubGVuZ3RoID09PSAxKSB7CiAgICAgIHBsYW4udHlwZSA9ICJpbmRleF9zY2FuIjsKICAgICAgcGxhbi5pbmRleFNjYW5zID0gW2luZGV4YWJsZUNvbmRpdGlvbnNbMF1dOwogICAgICBwbGFuLmluZGV4ZXMgPSBbaW5kZXhhYmxlQ29uZGl0aW9uc1swXS5pbmRleE5hbWVdOwogICAgICBwbGFuLmVzdGltYXRlZENvc3QgPSA1MDsKICAgICAgcmV0dXJuIHBsYW47CiAgICB9CiAgICByZXR1cm4gcGxhbjsKICB9CiAgLyoqCiAgICogUGxhbiBmb3IgJG9yIHF1ZXJpZXMgKGluZGV4IHVuaW9uKQogICAqIEBwcml2YXRlCiAgICovCiAgX3BsYW5PclF1ZXJ5KHF1ZXJ5LCBhbmFseXNpcykgewogICAgY29uc3QgcGxhbiA9IG5ldyBRdWVyeVBsYW4oKTsKICAgIGlmICghcXVlcnkuJG9yKSB7CiAgICAgIHJldHVybiBwbGFuOwogICAgfQogICAgY29uc3QgY29uZGl0aW9ucyA9IHF1ZXJ5LiRvcjsKICAgIGNvbnN0IGluZGV4YWJsZUNvbmRpdGlvbnMgPSBbXTsKICAgIGZvciAoY29uc3QgY29uZGl0aW9uIG9mIGNvbmRpdGlvbnMpIHsKICAgICAgY29uc3QgY29uZGl0aW9uUGxhbiA9IHRoaXMuX3BsYW5TaW1wbGVRdWVyeShjb25kaXRpb24pOwogICAgICBpZiAoY29uZGl0aW9uUGxhbi50eXBlID09PSAiaW5kZXhfc2NhbiIpIHsKICAgICAgICBpbmRleGFibGVDb25kaXRpb25zLnB1c2goY29uZGl0aW9uUGxhbi5pbmRleFNjYW5zWzBdKTsKICAgICAgfQogICAgfQogICAgaWYgKGluZGV4YWJsZUNvbmRpdGlvbnMubGVuZ3RoID4gMCkgewogICAgICBwbGFuLnR5cGUgPSAiaW5kZXhfdW5pb24iOwogICAgICBwbGFuLmluZGV4U2NhbnMgPSBpbmRleGFibGVDb25kaXRpb25zOwogICAgICBwbGFuLmluZGV4ZXMgPSBpbmRleGFibGVDb25kaXRpb25zLm1hcCgoc2NhbikgPT4gc2Nhbi5pbmRleE5hbWUpOwogICAgICBwbGFuLmVzdGltYXRlZENvc3QgPSAxMDAgKiBpbmRleGFibGVDb25kaXRpb25zLmxlbmd0aDsKICAgICAgcmV0dXJuIHBsYW47CiAgICB9CiAgICByZXR1cm4gcGxhbjsKICB9CiAgLyoqCiAgICogUGxhbiBmb3Igc2ltcGxlIHNpbmdsZS1maWVsZCBxdWVyaWVzCiAgICogQHByaXZhdGUKICAgKi8KICBfcGxhblNpbXBsZVF1ZXJ5KHF1ZXJ5KSB7CiAgICBjb25zdCBwbGFuID0gbmV3IFF1ZXJ5UGxhbigpOwogICAgY29uc3QgcXVlcnlLZXlzID0gT2JqZWN0LmtleXMocXVlcnkpOwogICAgaWYgKHF1ZXJ5S2V5cy5sZW5ndGggPT09IDApIHsKICAgICAgcmV0dXJuIHBsYW47CiAgICB9CiAgICBmb3IgKGNvbnN0IFtpbmRleE5hbWUsIGluZGV4XSBvZiB0aGlzLmluZGV4ZXMpIHsKICAgICAgaWYgKGluZGV4IGluc3RhbmNlb2YgVGV4dENvbGxlY3Rpb25JbmRleCB8fCBpbmRleCBpbnN0YW5jZW9mIEdlb3NwYXRpYWxJbmRleCkgewogICAgICAgIGNvbnRpbnVlOwogICAgICB9CiAgICAgIGlmICh0aGlzLl9jYW5JbmRleEhhbmRsZVF1ZXJ5KGluZGV4LCBxdWVyeSkpIHsKICAgICAgICBwbGFuLnR5cGUgPSAiaW5kZXhfc2NhbiI7CiAgICAgICAgcGxhbi5pbmRleGVzID0gW2luZGV4TmFtZV07CiAgICAgICAgcGxhbi5pbmRleFNjYW5zID0gW3sgaW5kZXhOYW1lLCBpbmRleCwgcXVlcnkgfV07CiAgICAgICAgcGxhbi5lc3RpbWF0ZWRDb3N0ID0gNTA7CiAgICAgICAgcmV0dXJuIHBsYW47CiAgICAgIH0KICAgIH0KICAgIHJldHVybiBwbGFuOwogIH0KICAvKioKICAgKiBFeGVjdXRlIGEgc2luZ2xlIGluZGV4IHNjYW4gdGhhdCB3YXMgZGVmZXJyZWQgZnJvbSBwbGFubmluZwogICAqIEBwcml2YXRlCiAgICovCiAgYXN5bmMgX2V4ZWN1dGVJbmRleFNjYW4oc2NhbikgewogICAgY29uc3QgeyBpbmRleCwgcXVlcnksIHRleHRRdWVyeSB9ID0gc2NhbjsKICAgIGlmICh0eXBlb2YgaW5kZXgub3BlbiA9PT0gImZ1bmN0aW9uIiAmJiB0eXBlb2YgaW5kZXguaXNPcGVuICE9PSAidW5kZWZpbmVkIiAmJiAhaW5kZXguaXNPcGVuKSB7CiAgICAgIGF3YWl0IGluZGV4Lm9wZW4oKTsKICAgIH0KICAgIGlmICh0ZXh0UXVlcnkgIT09IHZvaWQgMCkgewogICAgICByZXR1cm4gYXdhaXQgaW5kZXguc2VhcmNoKHRleHRRdWVyeSk7CiAgICB9CiAgICBpZiAocXVlcnkgIT09IHZvaWQgMCkgewogICAgICBjb25zdCBkb2NJZHMgPSBhd2FpdCBpbmRleC5xdWVyeShxdWVyeSk7CiAgICAgIHJldHVybiBkb2NJZHMgIT09IG51bGwgPyBkb2NJZHMgOiBbXTsKICAgIH0KICAgIGlmIChzY2FuLmRvY0lkcyAhPT0gdm9pZCAwKSB7CiAgICAgIHJldHVybiBzY2FuLmRvY0lkczsKICAgIH0KICAgIHJldHVybiBbXTsKICB9CiAgLyoqCiAgICogQ2hlY2sgaWYgYW4gaW5kZXggY2FuIGhhbmRsZSBhIHF1ZXJ5ICh3aXRob3V0IGV4ZWN1dGluZyBpdCkKICAgKiBAcHJpdmF0ZQogICAqLwogIF9jYW5JbmRleEhhbmRsZVF1ZXJ5KGluZGV4LCBxdWVyeSkgewogICAgY29uc3QgcXVlcnlLZXlzID0gT2JqZWN0LmtleXMocXVlcnkpOwogICAgY29uc3QgaW5kZXhGaWVsZHMgPSBPYmplY3Qua2V5cyhpbmRleC5rZXlzKTsKICAgIGlmIChpbmRleEZpZWxkcy5sZW5ndGggIT09IDEpIHsKICAgICAgcmV0dXJuIGZhbHNlOwogICAgfQogICAgY29uc3QgZmllbGQgPSBpbmRleEZpZWxkc1swXTsKICAgIGlmIChxdWVyeUtleXMuaW5kZXhPZihmaWVsZCkgPT09IC0xKSB7CiAgICAgIHJldHVybiBmYWxzZTsKICAgIH0KICAgIHJldHVybiB0cnVlOwogIH0KICAvKioKICAgKiBFeGVjdXRlIGEgcXVlcnkgcGxhbiBhbmQgcmV0dXJuIGRvY3VtZW50IElEcwogICAqIEBwYXJhbSB7UXVlcnlQbGFufSBwbGFuIC0gVGhlIGV4ZWN1dGlvbiBwbGFuCiAgICogQHJldHVybnMge1Byb21pc2U8QXJyYXl8bnVsbD59IEFycmF5IG9mIGRvY3VtZW50IElEcyBvciBudWxsIGZvciBmdWxsIHNjYW4KICAgKi8KICBhc3luYyBleGVjdXRlKHBsYW4pIHsKICAgIGlmIChwbGFuLnR5cGUgPT09ICJmdWxsX3NjYW4iKSB7CiAgICAgIHJldHVybiBudWxsOwogICAgfQogICAgaWYgKHBsYW4udHlwZSA9PT0gImluZGV4X3NjYW4iKSB7CiAgICAgIGNvbnN0IHNjYW4gPSBwbGFuLmluZGV4U2NhbnNbMF07CiAgICAgIHJldHVybiBhd2FpdCB0aGlzLl9leGVjdXRlSW5kZXhTY2FuKHNjYW4pOwogICAgfQogICAgaWYgKHBsYW4udHlwZSA9PT0gImluZGV4X2ludGVyc2VjdGlvbiIpIHsKICAgICAgaWYgKHBsYW4uaW5kZXhTY2Fucy5sZW5ndGggPT09IDApIHJldHVybiBudWxsOwogICAgICBjb25zdCByZXN1bHRzID0gW107CiAgICAgIGZvciAoY29uc3Qgc2NhbiBvZiBwbGFuLmluZGV4U2NhbnMpIHsKICAgICAgICByZXN1bHRzLnB1c2goewogICAgICAgICAgZG9jSWRzOiBhd2FpdCB0aGlzLl9leGVjdXRlSW5kZXhTY2FuKHNjYW4pLAogICAgICAgICAgaW5kZXhOYW1lOiBzY2FuLmluZGV4TmFtZQogICAgICAgIH0pOwogICAgICB9CiAgICAgIGNvbnN0IHNvcnRlZCA9IHJlc3VsdHMuc2xpY2UoKS5zb3J0KChhLCBiKSA9PiBhLmRvY0lkcy5sZW5ndGggLSBiLmRvY0lkcy5sZW5ndGgpOwogICAgICBsZXQgcmVzdWx0ID0gbmV3IFNldChzb3J0ZWRbMF0uZG9jSWRzKTsKICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBzb3J0ZWQubGVuZ3RoOyBpKyspIHsKICAgICAgICBjb25zdCBjdXJyZW50U2V0ID0gbmV3IFNldChzb3J0ZWRbaV0uZG9jSWRzKTsKICAgICAgICByZXN1bHQgPSBuZXcgU2V0KFsuLi5yZXN1bHRdLmZpbHRlcigoaWQpID0+IGN1cnJlbnRTZXQuaGFzKGlkKSkpOwogICAgICAgIGlmIChyZXN1bHQuc2l6ZSA9PT0gMCkgYnJlYWs7CiAgICAgIH0KICAgICAgcmV0dXJuIEFycmF5LmZyb20ocmVzdWx0KTsKICAgIH0KICAgIGlmIChwbGFuLnR5cGUgPT09ICJpbmRleF91bmlvbiIpIHsKICAgICAgY29uc3QgcmVzdWx0ID0gLyogQF9fUFVSRV9fICovIG5ldyBTZXQoKTsKICAgICAgZm9yIChjb25zdCBzY2FuIG9mIHBsYW4uaW5kZXhTY2FucykgewogICAgICAgIGNvbnN0IGRvY0lkcyA9IGF3YWl0IHRoaXMuX2V4ZWN1dGVJbmRleFNjYW4oc2Nhbik7CiAgICAgICAgZG9jSWRzLmZvckVhY2goKGlkKSA9PiByZXN1bHQuYWRkKGlkKSk7CiAgICAgIH0KICAgICAgcmV0dXJuIEFycmF5LmZyb20ocmVzdWx0KTsKICAgIH0KICAgIHJldHVybiBudWxsOwogIH0KfQpjbGFzcyBDaGFuZ2VTdHJlYW0gZXh0ZW5kcyBldmVudHNFeHBvcnRzLkV2ZW50RW1pdHRlciB7CiAgY29uc3RydWN0b3IodGFyZ2V0LCBwaXBlbGluZSA9IFtdLCBvcHRpb25zID0ge30pIHsKICAgIHN1cGVyKCk7CiAgICB0aGlzLnRhcmdldCA9IHRhcmdldDsKICAgIHRoaXMucGlwZWxpbmUgPSBwaXBlbGluZTsKICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7CiAgICB0aGlzLmNsb3NlZCA9IGZhbHNlOwogICAgdGhpcy5fbGlzdGVuZXJzID0gLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKTsKICAgIHRoaXMuX2NoYW5nZUNvdW50ZXIgPSAwOwogICAgdGhpcy5fc3RhcnRXYXRjaGluZygpOwogIH0KICAvKioKICAgKiBTdGFydCB3YXRjaGluZyBmb3IgY2hhbmdlcwogICAqIEBwcml2YXRlCiAgICovCiAgX3N0YXJ0V2F0Y2hpbmcoKSB7CiAgICBpZiAodGhpcy5jbG9zZWQpIHJldHVybjsKICAgIGNvbnN0IGNvbGxlY3Rpb25zID0gdGhpcy5fZ2V0Q29sbGVjdGlvbnNUb1dhdGNoKCk7CiAgICBmb3IgKGNvbnN0IGNvbGxlY3Rpb24gb2YgY29sbGVjdGlvbnMpIHsKICAgICAgdGhpcy5fd2F0Y2hDb2xsZWN0aW9uKGNvbGxlY3Rpb24pOwogICAgfQogICAgaWYgKHRoaXMudGFyZ2V0LmNvbnN0cnVjdG9yLm5hbWUgPT09ICJTZXJ2ZXIiKSB7CiAgICAgIHRoaXMuX2ludGVyY2VwdFNlcnZlckRCQ3JlYXRpb24oKTsKICAgIH0KICAgIGlmICh0aGlzLnRhcmdldC5jb25zdHJ1Y3Rvci5uYW1lID09PSAiREIiKSB7CiAgICAgIHRoaXMuX2ludGVyY2VwdERCQ29sbGVjdGlvbkNyZWF0aW9uKCk7CiAgICB9CiAgICBpZiAodGhpcy50YXJnZXQuY29uc3RydWN0b3IubmFtZSA9PT0gIk1vbmdvQ2xpZW50IikgewogICAgICB0aGlzLl9pbnRlcmNlcHRDbGllbnREQkNyZWF0aW9uKCk7CiAgICB9CiAgfQogIC8qKgogICAqIEdldCBjb2xsZWN0aW9ucyB0byB3YXRjaCBiYXNlZCBvbiB0YXJnZXQgdHlwZQogICAqIEBwcml2YXRlCiAgICovCiAgX2dldENvbGxlY3Rpb25zVG9XYXRjaCgpIHsKICAgIGNvbnN0IGNvbGxlY3Rpb25zID0gW107CiAgICBpZiAodGhpcy50YXJnZXQuY29uc3RydWN0b3IubmFtZSA9PT0gIlNlcnZlciIpIHsKICAgICAgZm9yIChjb25zdCBbZGJOYW1lLCBkYl0gb2YgdGhpcy50YXJnZXQuZGF0YWJhc2VzKSB7CiAgICAgICAgY29uc3QgY29sbGVjdGlvbk5hbWVzID0gZGIuZ2V0Q29sbGVjdGlvbk5hbWVzKCk7CiAgICAgICAgZm9yIChjb25zdCBuYW1lIG9mIGNvbGxlY3Rpb25OYW1lcykgewogICAgICAgICAgY29uc3QgY29sbGVjdGlvbiA9IGRiW25hbWVdOwogICAgICAgICAgaWYgKGNvbGxlY3Rpb24gJiYgY29sbGVjdGlvbi5pc0NvbGxlY3Rpb24pIHsKICAgICAgICAgICAgY29sbGVjdGlvbnMucHVzaChjb2xsZWN0aW9uKTsKICAgICAgICAgIH0KICAgICAgICB9CiAgICAgIH0KICAgICAgcmV0dXJuIGNvbGxlY3Rpb25zOwogICAgfQogICAgaWYgKHRoaXMudGFyZ2V0LmNvbnN0cnVjdG9yLm5hbWUgPT09ICJNb25nb0NsaWVudCIpIHsKICAgICAgdGhpcy5fbW9uaXRvckNsaWVudCgpOwogICAgICByZXR1cm4gY29sbGVjdGlvbnM7CiAgICB9CiAgICBpZiAodGhpcy50YXJnZXQuY29uc3RydWN0b3IubmFtZSA9PT0gIkRCIikgewogICAgICBjb25zdCBjb2xsZWN0aW9uTmFtZXMgPSB0aGlzLnRhcmdldC5nZXRDb2xsZWN0aW9uTmFtZXMoKTsKICAgICAgZm9yIChjb25zdCBuYW1lIG9mIGNvbGxlY3Rpb25OYW1lcykgewogICAgICAgIGNvbnN0IGNvbGxlY3Rpb24gPSB0aGlzLnRhcmdldFtuYW1lXTsKICAgICAgICBpZiAoY29sbGVjdGlvbiAmJiBjb2xsZWN0aW9uLmlzQ29sbGVjdGlvbikgewogICAgICAgICAgY29sbGVjdGlvbnMucHVzaChjb2xsZWN0aW9uKTsKICAgICAgICB9CiAgICAgIH0KICAgICAgdGhpcy5fbW9uaXRvckRCKCk7CiAgICB9CiAgICBpZiAodGhpcy50YXJnZXQuaXNDb2xsZWN0aW9uKSB7CiAgICAgIGNvbGxlY3Rpb25zLnB1c2godGhpcy50YXJnZXQpOwogICAgfQogICAgcmV0dXJuIGNvbGxlY3Rpb25zOwogIH0KICAvKioKICAgKiBXYXRjaCBhIHNwZWNpZmljIGNvbGxlY3Rpb24gZm9yIGNoYW5nZXMKICAgKiBAcHJpdmF0ZQogICAqLwogIF93YXRjaENvbGxlY3Rpb24oY29sbGVjdGlvbikgewogICAgaWYgKHRoaXMuY2xvc2VkKSByZXR1cm47CiAgICBpZiAoIWNvbGxlY3Rpb24pIHJldHVybjsKICAgIGlmICh0eXBlb2YgY29sbGVjdGlvbi5vbiAhPT0gImZ1bmN0aW9uIikgcmV0dXJuOwogICAgaWYgKCFjb2xsZWN0aW9uLmlzQ29sbGVjdGlvbikgcmV0dXJuOwogICAgaWYgKHRoaXMuX2xpc3RlbmVycy5oYXMoY29sbGVjdGlvbikpIHJldHVybjsKICAgIGNvbnN0IGhhbmRsZXJzID0gewogICAgICBpbnNlcnQ6IChkb2MpID0+IHRoaXMuX2VtaXRDaGFuZ2UoImluc2VydCIsIGNvbGxlY3Rpb24sIGRvYyksCiAgICAgIHVwZGF0ZTogKGRvYywgdXBkYXRlRGVzY3JpcHRpb24pID0+IHRoaXMuX2VtaXRDaGFuZ2UoInVwZGF0ZSIsIGNvbGxlY3Rpb24sIGRvYywgdXBkYXRlRGVzY3JpcHRpb24pLAogICAgICByZXBsYWNlOiAoZG9jKSA9PiB0aGlzLl9lbWl0Q2hhbmdlKCJyZXBsYWNlIiwgY29sbGVjdGlvbiwgZG9jKSwKICAgICAgZGVsZXRlOiAoZG9jKSA9PiB0aGlzLl9lbWl0Q2hhbmdlKCJkZWxldGUiLCBjb2xsZWN0aW9uLCBkb2MpCiAgICB9OwogICAgdGhpcy5fbGlzdGVuZXJzLnNldChjb2xsZWN0aW9uLCBoYW5kbGVycyk7CiAgICBjb2xsZWN0aW9uLm9uKCJpbnNlcnQiLCBoYW5kbGVycy5pbnNlcnQpOwogICAgY29sbGVjdGlvbi5vbigidXBkYXRlIiwgaGFuZGxlcnMudXBkYXRlKTsKICAgIGNvbGxlY3Rpb24ub24oInJlcGxhY2UiLCBoYW5kbGVycy5yZXBsYWNlKTsKICAgIGNvbGxlY3Rpb24ub24oImRlbGV0ZSIsIGhhbmRsZXJzLmRlbGV0ZSk7CiAgfQogIC8qKgogICAqIEVtaXQgYSBjaGFuZ2UgZXZlbnQKICAgKiBAcHJpdmF0ZQogICAqLwogIF9lbWl0Q2hhbmdlKG9wZXJhdGlvblR5cGUsIGNvbGxlY3Rpb24sIGRvYywgdXBkYXRlRGVzY3JpcHRpb24gPSBudWxsKSB7CiAgICBpZiAodGhpcy5jbG9zZWQpIHJldHVybjsKICAgIGNvbnN0IGNoYW5nZUV2ZW50ID0gdGhpcy5fY3JlYXRlQ2hhbmdlRXZlbnQoCiAgICAgIG9wZXJhdGlvblR5cGUsCiAgICAgIGNvbGxlY3Rpb24sCiAgICAgIGRvYywKICAgICAgdXBkYXRlRGVzY3JpcHRpb24KICAgICk7CiAgICBpZiAoIXRoaXMuX21hdGNoZXNQaXBlbGluZShjaGFuZ2VFdmVudCkpIHsKICAgICAgcmV0dXJuOwogICAgfQogICAgdGhpcy5lbWl0KCJjaGFuZ2UiLCBjaGFuZ2VFdmVudCk7CiAgfQogIC8qKgogICAqIENyZWF0ZSBhIE1vbmdvREItY29tcGF0aWJsZSBjaGFuZ2UgZXZlbnQgZG9jdW1lbnQKICAgKiBAcHJpdmF0ZQogICAqLwogIF9jcmVhdGVDaGFuZ2VFdmVudChvcGVyYXRpb25UeXBlLCBjb2xsZWN0aW9uLCBkb2MsIHVwZGF0ZURlc2NyaXB0aW9uKSB7CiAgICBjb25zdCBldmVudCA9IHsKICAgICAgX2lkOiB7CiAgICAgICAgX2RhdGE6IEJ1ZmZlci5mcm9tKFN0cmluZygrK3RoaXMuX2NoYW5nZUNvdW50ZXIpKS50b1N0cmluZygiYmFzZTY0IikKICAgICAgfSwKICAgICAgb3BlcmF0aW9uVHlwZSwKICAgICAgY2x1c3RlclRpbWU6IC8qIEBfX1BVUkVfXyAqLyBuZXcgRGF0ZSgpLAogICAgICBuczogewogICAgICAgIGRiOiBjb2xsZWN0aW9uLmRiLmRiTmFtZSwKICAgICAgICBjb2xsOiBjb2xsZWN0aW9uLm5hbWUKICAgICAgfSwKICAgICAgZG9jdW1lbnRLZXk6IHsKICAgICAgICBfaWQ6IGRvYy5faWQKICAgICAgfQogICAgfTsKICAgIHN3aXRjaCAob3BlcmF0aW9uVHlwZSkgewogICAgICBjYXNlICJpbnNlcnQiOgogICAgICAgIGV2ZW50LmZ1bGxEb2N1bWVudCA9IGRvYzsKICAgICAgICBicmVhazsKICAgICAgY2FzZSAidXBkYXRlIjoKICAgICAgICBldmVudC51cGRhdGVEZXNjcmlwdGlvbiA9IHVwZGF0ZURlc2NyaXB0aW9uIHx8IHsKICAgICAgICAgIHVwZGF0ZWRGaWVsZHM6IHt9LAogICAgICAgICAgcmVtb3ZlZEZpZWxkczogW10sCiAgICAgICAgICB0cnVuY2F0ZWRBcnJheXM6IFtdCiAgICAgICAgfTsKICAgICAgICBpZiAodGhpcy5vcHRpb25zLmZ1bGxEb2N1bWVudCA9PT0gInVwZGF0ZUxvb2t1cCIpIHsKICAgICAgICAgIGV2ZW50LmZ1bGxEb2N1bWVudCA9IGRvYzsKICAgICAgICB9CiAgICAgICAgYnJlYWs7CiAgICAgIGNhc2UgInJlcGxhY2UiOgogICAgICAgIGV2ZW50LmZ1bGxEb2N1bWVudCA9IGRvYzsKICAgICAgICBicmVhazsKICAgIH0KICAgIHJldHVybiBldmVudDsKICB9CiAgLyoqCiAgICogQ2hlY2sgaWYgY2hhbmdlIGV2ZW50IG1hdGNoZXMgcGlwZWxpbmUgZmlsdGVycwogICAqIEBwcml2YXRlCiAgICovCiAgX21hdGNoZXNQaXBlbGluZShjaGFuZ2VFdmVudCkgewogICAgaWYgKCF0aGlzLnBpcGVsaW5lIHx8IHRoaXMucGlwZWxpbmUubGVuZ3RoID09PSAwKSB7CiAgICAgIHJldHVybiB0cnVlOwogICAgfQogICAgZm9yIChjb25zdCBzdGFnZSBvZiB0aGlzLnBpcGVsaW5lKSB7CiAgICAgIGlmIChzdGFnZS4kbWF0Y2gpIHsKICAgICAgICBpZiAoIW1hdGNoZXMoY2hhbmdlRXZlbnQsIHN0YWdlLiRtYXRjaCkpIHsKICAgICAgICAgIHJldHVybiBmYWxzZTsKICAgICAgICB9CiAgICAgIH0KICAgIH0KICAgIHJldHVybiB0cnVlOwogIH0KICAvKioKICAgKiBHZXQgbmVzdGVkIHZhbHVlIGZyb20gb2JqZWN0IHVzaW5nIGRvdCBub3RhdGlvbgogICAqIEBwcml2YXRlCiAgICovCiAgX2dldE5lc3RlZFZhbHVlKG9iaiwgcGF0aCkgewogICAgcmV0dXJuIHBhdGguc3BsaXQoIi4iKS5yZWR1Y2UoKGN1cnJlbnQsIHBhcnQpID0+IGN1cnJlbnQ/LltwYXJ0XSwgb2JqKTsKICB9CiAgLyoqCiAgICogTW9uaXRvciBjbGllbnQgZm9yIG5ldyBkYXRhYmFzZXMvY29sbGVjdGlvbnMgKHNpbXBsaWZpZWQpCiAgICogQHByaXZhdGUKICAgKi8KICBfbW9uaXRvckNsaWVudCgpIHsKICB9CiAgLyoqCiAgICogSW50ZXJjZXB0IERCIGNyZWF0aW9uIG9uIGEgTW9uZ29DbGllbnQKICAgKiBAcHJpdmF0ZQogICAqLwogIF9pbnRlcmNlcHRDbGllbnREQkNyZWF0aW9uKCkgewogICAgY29uc3QgY2xpZW50ID0gdGhpcy50YXJnZXQ7CiAgICBjb25zdCBvcmlnaW5hbERiID0gY2xpZW50LmRiLmJpbmQoY2xpZW50KTsKICAgIGNvbnN0IHNlbGYyID0gdGhpczsKICAgIHRoaXMuX3dhdGNoZWREQnMgPSAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpOwogICAgY2xpZW50LmRiID0gZnVuY3Rpb24obmFtZSwgb3B0cykgewogICAgICBjb25zdCBkYXRhYmFzZSA9IG9yaWdpbmFsRGIobmFtZSwgb3B0cyk7CiAgICAgIGNvbnN0IGRiTmFtZSA9IGRhdGFiYXNlLmRiTmFtZTsKICAgICAgaWYgKCFzZWxmMi5fd2F0Y2hlZERCcy5oYXMoZGJOYW1lKSkgewogICAgICAgIHNlbGYyLl93YXRjaGVkREJzLnNldChkYk5hbWUsIGRhdGFiYXNlKTsKICAgICAgICBjb25zdCBjb2xsZWN0aW9uTmFtZXMgPSBkYXRhYmFzZS5nZXRDb2xsZWN0aW9uTmFtZXMoKTsKICAgICAgICBmb3IgKGNvbnN0IGNvbE5hbWUgb2YgY29sbGVjdGlvbk5hbWVzKSB7CiAgICAgICAgICBjb25zdCBjb2wgPSBkYXRhYmFzZVtjb2xOYW1lXTsKICAgICAgICAgIGlmIChjb2wgJiYgY29sLmlzQ29sbGVjdGlvbiAmJiAhc2VsZjIuX2xpc3RlbmVycy5oYXMoY29sKSkgewogICAgICAgICAgICBzZWxmMi5fd2F0Y2hDb2xsZWN0aW9uKGNvbCk7CiAgICAgICAgICB9CiAgICAgICAgfQogICAgICAgIHNlbGYyLl9pbnRlcmNlcHREQkNvbGxlY3Rpb25DcmVhdGlvbkZvckNsaWVudChkYXRhYmFzZSk7CiAgICAgIH0KICAgICAgcmV0dXJuIGRhdGFiYXNlOwogICAgfTsKICAgIHRoaXMuX29yaWdpbmFsQ2xpZW50TWV0aG9kcyA9IHsgZGI6IG9yaWdpbmFsRGIgfTsKICB9CiAgLyoqCiAgICogSW50ZXJjZXB0IERCIGNyZWF0aW9uIG9uIGEgU2VydmVyCiAgICogQHByaXZhdGUKICAgKi8KICBfaW50ZXJjZXB0U2VydmVyREJDcmVhdGlvbigpIHsKICAgIGNvbnN0IHNlcnZlcjIgPSB0aGlzLnRhcmdldDsKICAgIGNvbnN0IG9yaWdpbmFsR2V0REIgPSBzZXJ2ZXIyLl9nZXREQi5iaW5kKHNlcnZlcjIpOwogICAgY29uc3Qgc2VsZjIgPSB0aGlzOwogICAgdGhpcy5fd2F0Y2hlZERCcyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCk7CiAgICBzZXJ2ZXIyLl9nZXREQiA9IGZ1bmN0aW9uKGRiTmFtZSkgewogICAgICBjb25zdCBkYiA9IG9yaWdpbmFsR2V0REIoZGJOYW1lKTsKICAgICAgaWYgKCFzZWxmMi5fd2F0Y2hlZERCcy5oYXMoZGJOYW1lKSkgewogICAgICAgIHNlbGYyLl93YXRjaGVkREJzLnNldChkYk5hbWUsIGRiKTsKICAgICAgICBjb25zdCBjb2xsZWN0aW9uTmFtZXMgPSBkYi5nZXRDb2xsZWN0aW9uTmFtZXMoKTsKICAgICAgICBmb3IgKGNvbnN0IGNvbE5hbWUgb2YgY29sbGVjdGlvbk5hbWVzKSB7CiAgICAgICAgICBjb25zdCBjb2wgPSBkYltjb2xOYW1lXTsKICAgICAgICAgIGlmIChjb2wgJiYgY29sLmlzQ29sbGVjdGlvbiAmJiAhc2VsZjIuX2xpc3RlbmVycy5oYXMoY29sKSkgewogICAgICAgICAgICBzZWxmMi5fd2F0Y2hDb2xsZWN0aW9uKGNvbCk7CiAgICAgICAgICB9CiAgICAgICAgfQogICAgICAgIHNlbGYyLl9pbnRlcmNlcHREQkNvbGxlY3Rpb25DcmVhdGlvbkZvclNlcnZlcihkYik7CiAgICAgIH0KICAgICAgcmV0dXJuIGRiOwogICAgfTsKICAgIHRoaXMuX29yaWdpbmFsU2VydmVyTWV0aG9kcyA9IHsgX2dldERCOiBvcmlnaW5hbEdldERCIH07CiAgfQogIC8qKgogICAqIEludGVyY2VwdCBjb2xsZWN0aW9uIGNyZWF0aW9uIGZvciBhIGRhdGFiYXNlIGluIHNlcnZlciB3YXRjaCBtb2RlCiAgICogQHByaXZhdGUKICAgKi8KICBfaW50ZXJjZXB0REJDb2xsZWN0aW9uQ3JlYXRpb25Gb3JTZXJ2ZXIoZGIpIHsKICAgIGNvbnN0IG9yaWdpbmFsQ29sbGVjdGlvbiA9IGRiLmNvbGxlY3Rpb24uYmluZChkYik7CiAgICBjb25zdCBvcmlnaW5hbENyZWF0ZUNvbGxlY3Rpb24gPSBkYi5jcmVhdGVDb2xsZWN0aW9uLmJpbmQoZGIpOwogICAgY29uc3Qgc2VsZjIgPSB0aGlzOwogICAgZGIuY29sbGVjdGlvbiA9IGZ1bmN0aW9uKG5hbWUpIHsKICAgICAgY29uc3QgY29sID0gb3JpZ2luYWxDb2xsZWN0aW9uKG5hbWUpOwogICAgICBpZiAoY29sICYmIGNvbC5pc0NvbGxlY3Rpb24gJiYgIXNlbGYyLl9saXN0ZW5lcnMuaGFzKGNvbCkpIHsKICAgICAgICBzZWxmMi5fd2F0Y2hDb2xsZWN0aW9uKGNvbCk7CiAgICAgIH0KICAgICAgcmV0dXJuIGNvbDsKICAgIH07CiAgICBkYi5jcmVhdGVDb2xsZWN0aW9uID0gZnVuY3Rpb24obmFtZSkgewogICAgICBvcmlnaW5hbENyZWF0ZUNvbGxlY3Rpb24obmFtZSk7CiAgICAgIGNvbnN0IGNvbCA9IGRiW25hbWVdOwogICAgICBpZiAoY29sICYmIGNvbC5pc0NvbGxlY3Rpb24gJiYgIXNlbGYyLl9saXN0ZW5lcnMuaGFzKGNvbCkpIHsKICAgICAgICBzZWxmMi5fd2F0Y2hDb2xsZWN0aW9uKGNvbCk7CiAgICAgIH0KICAgIH07CiAgfQogIC8qKgogICAqIEludGVyY2VwdCBjb2xsZWN0aW9uIGNyZWF0aW9uIGZvciBhIGRhdGFiYXNlIGluIGNsaWVudCB3YXRjaCBtb2RlCiAgICogQHByaXZhdGUKICAgKi8KICBfaW50ZXJjZXB0REJDb2xsZWN0aW9uQ3JlYXRpb25Gb3JDbGllbnQoZGIpIHsKICAgIGNvbnN0IG9yaWdpbmFsQ29sbGVjdGlvbiA9IGRiLmNvbGxlY3Rpb24uYmluZChkYik7CiAgICBjb25zdCBvcmlnaW5hbENyZWF0ZUNvbGxlY3Rpb24gPSBkYi5jcmVhdGVDb2xsZWN0aW9uLmJpbmQoZGIpOwogICAgY29uc3Qgc2VsZjIgPSB0aGlzOwogICAgZGIuY29sbGVjdGlvbiA9IGZ1bmN0aW9uKG5hbWUpIHsKICAgICAgY29uc3QgY29sID0gb3JpZ2luYWxDb2xsZWN0aW9uKG5hbWUpOwogICAgICBpZiAoY29sICYmIGNvbC5pc0NvbGxlY3Rpb24gJiYgIXNlbGYyLl9saXN0ZW5lcnMuaGFzKGNvbCkpIHsKICAgICAgICBzZWxmMi5fd2F0Y2hDb2xsZWN0aW9uKGNvbCk7CiAgICAgIH0KICAgICAgcmV0dXJuIGNvbDsKICAgIH07CiAgICBkYi5jcmVhdGVDb2xsZWN0aW9uID0gZnVuY3Rpb24obmFtZSkgewogICAgICBvcmlnaW5hbENyZWF0ZUNvbGxlY3Rpb24obmFtZSk7CiAgICAgIGNvbnN0IGNvbCA9IGRiW25hbWVdOwogICAgICBpZiAoY29sICYmIGNvbC5pc0NvbGxlY3Rpb24gJiYgIXNlbGYyLl9saXN0ZW5lcnMuaGFzKGNvbCkpIHsKICAgICAgICBzZWxmMi5fd2F0Y2hDb2xsZWN0aW9uKGNvbCk7CiAgICAgIH0KICAgIH07CiAgfQogIC8qKgogICAqIE1vbml0b3IgZGF0YWJhc2UgZm9yIG5ldyBjb2xsZWN0aW9ucwogICAqIEBwcml2YXRlCiAgICovCiAgX21vbml0b3JEQigpIHsKICB9CiAgLyoqCiAgICogSW50ZXJjZXB0IG5ldyBjb2xsZWN0aW9uIGNyZWF0aW9uIG9uIGEgREIKICAgKiBAcHJpdmF0ZQogICAqLwogIF9pbnRlcmNlcHREQkNvbGxlY3Rpb25DcmVhdGlvbigpIHsKICAgIGNvbnN0IGRiID0gdGhpcy50YXJnZXQ7CiAgICBjb25zdCBvcmlnaW5hbENvbGxlY3Rpb24gPSBkYi5jb2xsZWN0aW9uLmJpbmQoZGIpOwogICAgY29uc3Qgb3JpZ2luYWxDcmVhdGVDb2xsZWN0aW9uID0gZGIuY3JlYXRlQ29sbGVjdGlvbi5iaW5kKGRiKTsKICAgIGNvbnN0IHNlbGYyID0gdGhpczsKICAgIGRiLmNvbGxlY3Rpb24gPSBmdW5jdGlvbihuYW1lKSB7CiAgICAgIGNvbnN0IGNvbCA9IG9yaWdpbmFsQ29sbGVjdGlvbihuYW1lKTsKICAgICAgaWYgKGNvbCAmJiBjb2wuaXNDb2xsZWN0aW9uICYmICFzZWxmMi5fbGlzdGVuZXJzLmhhcyhjb2wpKSB7CiAgICAgICAgc2VsZjIuX3dhdGNoQ29sbGVjdGlvbihjb2wpOwogICAgICB9CiAgICAgIHJldHVybiBjb2w7CiAgICB9OwogICAgZGIuY3JlYXRlQ29sbGVjdGlvbiA9IGZ1bmN0aW9uKG5hbWUpIHsKICAgICAgb3JpZ2luYWxDcmVhdGVDb2xsZWN0aW9uKG5hbWUpOwogICAgICBjb25zdCBjb2wgPSBkYltuYW1lXTsKICAgICAgaWYgKGNvbCAmJiBjb2wuaXNDb2xsZWN0aW9uICYmICFzZWxmMi5fbGlzdGVuZXJzLmhhcyhjb2wpKSB7CiAgICAgICAgc2VsZjIuX3dhdGNoQ29sbGVjdGlvbihjb2wpOwogICAgICB9CiAgICB9OwogICAgdGhpcy5fb3JpZ2luYWxEQk1ldGhvZHMgPSB7IGNvbGxlY3Rpb246IG9yaWdpbmFsQ29sbGVjdGlvbiwgY3JlYXRlQ29sbGVjdGlvbjogb3JpZ2luYWxDcmVhdGVDb2xsZWN0aW9uIH07CiAgfQogIC8qKgogICAqIENsb3NlIHRoZSBjaGFuZ2Ugc3RyZWFtCiAgICovCiAgY2xvc2UoKSB7CiAgICBpZiAodGhpcy5jbG9zZWQpIHJldHVybjsKICAgIHRoaXMuY2xvc2VkID0gdHJ1ZTsKICAgIGZvciAoY29uc3QgW2NvbGxlY3Rpb24sIGhhbmRsZXJzXSBvZiB0aGlzLl9saXN0ZW5lcnMpIHsKICAgICAgY29sbGVjdGlvbi5vZmYoImluc2VydCIsIGhhbmRsZXJzLmluc2VydCk7CiAgICAgIGNvbGxlY3Rpb24ub2ZmKCJ1cGRhdGUiLCBoYW5kbGVycy51cGRhdGUpOwogICAgICBjb2xsZWN0aW9uLm9mZigicmVwbGFjZSIsIGhhbmRsZXJzLnJlcGxhY2UpOwogICAgICBjb2xsZWN0aW9uLm9mZigiZGVsZXRlIiwgaGFuZGxlcnMuZGVsZXRlKTsKICAgIH0KICAgIHRoaXMuX2xpc3RlbmVycy5jbGVhcigpOwogICAgaWYgKHRoaXMuX29yaWdpbmFsU2VydmVyTWV0aG9kcyAmJiB0aGlzLnRhcmdldC5jb25zdHJ1Y3Rvci5uYW1lID09PSAiU2VydmVyIikgewogICAgICB0aGlzLnRhcmdldC5fZ2V0REIgPSB0aGlzLl9vcmlnaW5hbFNlcnZlck1ldGhvZHMuX2dldERCOwogICAgfQogICAgaWYgKHRoaXMuX29yaWdpbmFsREJNZXRob2RzICYmIHRoaXMudGFyZ2V0LmNvbnN0cnVjdG9yLm5hbWUgPT09ICJEQiIpIHsKICAgICAgdGhpcy50YXJnZXQuY29sbGVjdGlvbiA9IHRoaXMuX29yaWdpbmFsREJNZXRob2RzLmNvbGxlY3Rpb247CiAgICAgIHRoaXMudGFyZ2V0LmNyZWF0ZUNvbGxlY3Rpb24gPSB0aGlzLl9vcmlnaW5hbERCTWV0aG9kcy5jcmVhdGVDb2xsZWN0aW9uOwogICAgfQogICAgaWYgKHRoaXMuX29yaWdpbmFsQ2xpZW50TWV0aG9kcyAmJiB0aGlzLnRhcmdldC5jb25zdHJ1Y3Rvci5uYW1lID09PSAiTW9uZ29DbGllbnQiKSB7CiAgICAgIHRoaXMudGFyZ2V0LmRiID0gdGhpcy5fb3JpZ2luYWxDbGllbnRNZXRob2RzLmRiOwogICAgfQogICAgdGhpcy5lbWl0KCJjbG9zZSIpOwogICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoKTsKICB9CiAgLyoqCiAgICogQ2hlY2sgaWYgdGhlIHN0cmVhbSBpcyBjbG9zZWQKICAgKi8KICBnZXQgaXNDbG9zZWQoKSB7CiAgICByZXR1cm4gdGhpcy5jbG9zZWQ7CiAgfQogIC8qKgogICAqIEFzeW5jIGl0ZXJhdG9yIHN1cHBvcnQgZm9yIGZvci1hd2FpdC1vZiBsb29wcwogICAqLwogIGFzeW5jICpbU3ltYm9sLmFzeW5jSXRlcmF0b3JdKCkgewogICAgY29uc3QgcXVldWUgPSBbXTsKICAgIGxldCByZXNvbHZlTmV4dCA9IG51bGw7CiAgICBsZXQgc3RyZWFtQ2xvc2VkID0gZmFsc2U7CiAgICBjb25zdCBvbkNoYW5nZSA9IChjaGFuZ2UpID0+IHsKICAgICAgaWYgKHJlc29sdmVOZXh0KSB7CiAgICAgICAgcmVzb2x2ZU5leHQoeyB2YWx1ZTogY2hhbmdlLCBkb25lOiBmYWxzZSB9KTsKICAgICAgICByZXNvbHZlTmV4dCA9IG51bGw7CiAgICAgIH0gZWxzZSB7CiAgICAgICAgcXVldWUucHVzaChjaGFuZ2UpOwogICAgICB9CiAgICB9OwogICAgY29uc3Qgb25DbG9zZSA9ICgpID0+IHsKICAgICAgc3RyZWFtQ2xvc2VkID0gdHJ1ZTsKICAgICAgaWYgKHJlc29sdmVOZXh0KSB7CiAgICAgICAgcmVzb2x2ZU5leHQoeyBkb25lOiB0cnVlIH0pOwogICAgICAgIHJlc29sdmVOZXh0ID0gbnVsbDsKICAgICAgfQogICAgfTsKICAgIGNvbnN0IG9uRXJyb3IgPSAoZXJyb3IpID0+IHsKICAgICAgaWYgKHJlc29sdmVOZXh0KSB7CiAgICAgICAgcmVzb2x2ZU5leHQoUHJvbWlzZS5yZWplY3QoZXJyb3IpKTsKICAgICAgICByZXNvbHZlTmV4dCA9IG51bGw7CiAgICAgIH0KICAgIH07CiAgICB0aGlzLm9uKCJjaGFuZ2UiLCBvbkNoYW5nZSk7CiAgICB0aGlzLm9uKCJjbG9zZSIsIG9uQ2xvc2UpOwogICAgdGhpcy5vbigiZXJyb3IiLCBvbkVycm9yKTsKICAgIHRyeSB7CiAgICAgIHdoaWxlICghc3RyZWFtQ2xvc2VkKSB7CiAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHsKICAgICAgICAgIHlpZWxkIHF1ZXVlLnNoaWZ0KCk7CiAgICAgICAgfSBlbHNlIHsKICAgICAgICAgIGNvbnN0IG5leHQgPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gewogICAgICAgICAgICByZXNvbHZlTmV4dCA9IHJlc29sdmU7CiAgICAgICAgICAgIGlmIChzdHJlYW1DbG9zZWQpIHsKICAgICAgICAgICAgICByZXNvbHZlKHsgZG9uZTogdHJ1ZSB9KTsKICAgICAgICAgICAgfQogICAgICAgICAgfSk7CiAgICAgICAgICBpZiAobmV4dC5kb25lKSBicmVhazsKICAgICAgICAgIHlpZWxkIG5leHQudmFsdWU7CiAgICAgICAgfQogICAgICB9CiAgICB9IGZpbmFsbHkgewogICAgICB0aGlzLm9mZigiY2hhbmdlIiwgb25DaGFuZ2UpOwogICAgICB0aGlzLm9mZigiY2xvc2UiLCBvbkNsb3NlKTsKICAgICAgdGhpcy5vZmYoImVycm9yIiwgb25FcnJvcik7CiAgICB9CiAgfQogIC8qKgogICAqIEdldCBuZXh0IGNoYW5nZSAoZm9yIGNvbXBhdGliaWxpdHkpCiAgICovCiAgYXN5bmMgbmV4dCgpIHsKICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7CiAgICAgIGNvbnN0IG9uQ2hhbmdlID0gKGNoYW5nZSkgPT4gewogICAgICAgIGNsZWFudXAoKTsKICAgICAgICByZXNvbHZlKGNoYW5nZSk7CiAgICAgIH07CiAgICAgIGNvbnN0IG9uQ2xvc2UgPSAoKSA9PiB7CiAgICAgICAgY2xlYW51cCgpOwogICAgICAgIHJlc29sdmUobnVsbCk7CiAgICAgIH07CiAgICAgIGNvbnN0IG9uRXJyb3IgPSAoZXJyb3IpID0+IHsKICAgICAgICBjbGVhbnVwKCk7CiAgICAgICAgcmVqZWN0KGVycm9yKTsKICAgICAgfTsKICAgICAgY29uc3QgY2xlYW51cCA9ICgpID0+IHsKICAgICAgICB0aGlzLm9mZigiY2hhbmdlIiwgb25DaGFuZ2UpOwogICAgICAgIHRoaXMub2ZmKCJjbG9zZSIsIG9uQ2xvc2UpOwogICAgICAgIHRoaXMub2ZmKCJlcnJvciIsIG9uRXJyb3IpOwogICAgICB9OwogICAgICBpZiAodGhpcy5jbG9zZWQpIHsKICAgICAgICByZXNvbHZlKG51bGwpOwogICAgICAgIHJldHVybjsKICAgICAgfQogICAgICB0aGlzLm9uY2UoImNoYW5nZSIsIG9uQ2hhbmdlKTsKICAgICAgdGhpcy5vbmNlKCJjbG9zZSIsIG9uQ2xvc2UpOwogICAgICB0aGlzLm9uY2UoImVycm9yIiwgb25FcnJvcik7CiAgICB9KTsKICB9Cn0KY2xhc3MgQ29sbGVjdGlvbiBleHRlbmRzIGV2ZW50c0V4cG9ydHMuRXZlbnRFbWl0dGVyIHsKICBjb25zdHJ1Y3RvcihkYiwgbmFtZSwgb3B0aW9ucyA9IHt9KSB7CiAgICBzdXBlcigpOwogICAgdGhpcy5kYiA9IGRiOwogICAgdGhpcy5uYW1lID0gbmFtZTsKICAgIHRoaXMucGF0aCA9IGAke3RoaXMuZGIuYmFzZUZvbGRlcn0vJHt0aGlzLmRiLmRiTmFtZX0vJHt0aGlzLm5hbWV9YDsKICAgIHRoaXMuZG9jdW1lbnRzUGF0aCA9IGAke3RoaXMucGF0aH0vZG9jdW1lbnRzLmJqc29uYDsKICAgIHRoaXMuZG9jdW1lbnRzVmVyc2lvbmVkUGF0aCA9IG51bGw7CiAgICB0aGlzLmRvY3VtZW50c1ZlcnNpb24gPSAwOwogICAgdGhpcy5fcmVsZWFzZURvY3VtZW50cyA9IG51bGw7CiAgICB0aGlzLm9yZGVyID0gb3B0aW9ucy5iUGx1c1RyZWVPcmRlciB8fCA1MDsKICAgIHRoaXMuZG9jdW1lbnRzID0gbnVsbDsKICAgIHRoaXMuaW5kZXhlcyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCk7CiAgICB0aGlzLl9pbml0aWFsaXplZCA9IGZhbHNlOwogICAgdGhpcy5pc0NvbGxlY3Rpb24gPSB0cnVlOwogICAgdGhpcy5xdWVyeVBsYW5uZXIgPSBuZXcgUXVlcnlQbGFubmVyKHRoaXMuaW5kZXhlcyk7CiAgfQogIGFzeW5jIF9pbml0aWFsaXplKCkgewogICAgaWYgKHRoaXMuX2luaXRpYWxpemVkKSByZXR1cm47CiAgICBpZiAoIWdsb2JhbFRoaXMubmF2aWdhdG9yIHx8ICFnbG9iYWxUaGlzLm5hdmlnYXRvci5zdG9yYWdlIHx8IHR5cGVvZiBnbG9iYWxUaGlzLm5hdmlnYXRvci5zdG9yYWdlLmdldERpcmVjdG9yeSAhPT0gImZ1bmN0aW9uIikgewogICAgICB0aHJvdyBuZXcgRXJyb3IoIk9QRlMgbm90IGF2YWlsYWJsZTogbmF2aWdhdG9yLnN0b3JhZ2UuZ2V0RGlyZWN0b3J5IGlzIG1pc3NpbmciKTsKICAgIH0KICAgIGNvbnN0IHsgdmVyc2lvbiwgcGF0aDogdmVyc2lvbmVkUGF0aCB9ID0gYXdhaXQgYWNxdWlyZVZlcnNpb25lZFBhdGgodGhpcy5kb2N1bWVudHNQYXRoKTsKICAgIHRoaXMuZG9jdW1lbnRzVmVyc2lvbiA9IHZlcnNpb247CiAgICB0aGlzLmRvY3VtZW50c1ZlcnNpb25lZFBhdGggPSB2ZXJzaW9uZWRQYXRoOwogICAgdGhpcy5fcmVsZWFzZURvY3VtZW50cyA9ICgpID0+IHJlbGVhc2VWZXJzaW9uZWRQYXRoKHRoaXMuZG9jdW1lbnRzUGF0aCwgdmVyc2lvbik7CiAgICBsZXQgZGlySGFuZGxlID0gYXdhaXQgdGhpcy5fZW5zdXJlRGlyZWN0b3J5Rm9yRmlsZSh0aGlzLmRvY3VtZW50c1ZlcnNpb25lZFBhdGgpOwogICAgaWYgKCFkaXJIYW5kbGUpIHsKICAgICAgZGlySGFuZGxlID0gYXdhaXQgZ2xvYmFsVGhpcy5uYXZpZ2F0b3Iuc3RvcmFnZS5nZXREaXJlY3RvcnkoKTsKICAgIH0KICAgIGNvbnN0IHBhdGhQYXJ0cyA9IHRoaXMuZG9jdW1lbnRzVmVyc2lvbmVkUGF0aC5zcGxpdCgiLyIpLmZpbHRlcihCb29sZWFuKTsKICAgIGNvbnN0IGZpbGVuYW1lID0gcGF0aFBhcnRzW3BhdGhQYXJ0cy5sZW5ndGggLSAxXTsKICAgIGlmICghZmlsZW5hbWUpIHsKICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGRvY3VtZW50cyBwYXRoOiAke3RoaXMuZG9jdW1lbnRzVmVyc2lvbmVkUGF0aH1gKTsKICAgIH0KICAgIGNvbnN0IGZpbGVIYW5kbGUgPSBhd2FpdCBkaXJIYW5kbGUuZ2V0RmlsZUhhbmRsZShmaWxlbmFtZSwgeyBjcmVhdGU6IHRydWUgfSk7CiAgICBjb25zdCBzeW5jSGFuZGxlID0gYXdhaXQgZmlsZUhhbmRsZS5jcmVhdGVTeW5jQWNjZXNzSGFuZGxlKCk7CiAgICB0aGlzLmRvY3VtZW50cyA9IG5ldyBCUGx1c1RyZWUoc3luY0hhbmRsZSwgdGhpcy5vcmRlcik7CiAgICBhd2FpdCB0aGlzLmRvY3VtZW50cy5vcGVuKCk7CiAgICBhd2FpdCB0aGlzLl9sb2FkSW5kZXhlcygpOwogICAgdGhpcy5faW5pdGlhbGl6ZWQgPSB0cnVlOwogIH0KICBhc3luYyBfZW5zdXJlRGlyZWN0b3J5Rm9yRmlsZShmaWxlUGF0aCkgewogICAgaWYgKCFmaWxlUGF0aCkgcmV0dXJuOwogICAgY29uc3QgcGF0aFBhcnRzID0gZmlsZVBhdGguc3BsaXQoIi8iKS5maWx0ZXIoQm9vbGVhbik7CiAgICBwYXRoUGFydHMucG9wKCk7CiAgICBpZiAocGF0aFBhcnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuOwogICAgdHJ5IHsKICAgICAgbGV0IGRpciA9IGF3YWl0IGdsb2JhbFRoaXMubmF2aWdhdG9yLnN0b3JhZ2UuZ2V0RGlyZWN0b3J5KCk7CiAgICAgIGZvciAoY29uc3QgcGFydCBvZiBwYXRoUGFydHMpIHsKICAgICAgICBkaXIgPSBhd2FpdCBkaXIuZ2V0RGlyZWN0b3J5SGFuZGxlKHBhcnQsIHsgY3JlYXRlOiB0cnVlIH0pOwogICAgICB9CiAgICAgIHJldHVybiBkaXI7CiAgICB9IGNhdGNoIChlcnJvcikgewogICAgICBpZiAoZXJyb3IuY29kZSAhPT0gIkVFWElTVCIpIHsKICAgICAgICB0aHJvdyBlcnJvcjsKICAgICAgfQogICAgfQogIH0KICBhc3luYyBfbG9hZEluZGV4ZXMoKSB7CiAgICBjb25zb2xlLmxvZyhgW0xPQURfSU5ERVhFU10gTG9hZGluZyBpbmRleGVzIGZvciBjb2xsZWN0aW9uIGF0IHBhdGg6ICR7dGhpcy5wYXRofWApOwogICAgbGV0IGRpckhhbmRsZTsKICAgIHRyeSB7CiAgICAgIGNvbnN0IHBhcnRzID0gdGhpcy5wYXRoLnNwbGl0KCIvIikuZmlsdGVyKEJvb2xlYW4pOwogICAgICBsZXQgaGFuZGxlID0gYXdhaXQgZ2xvYmFsVGhpcy5uYXZpZ2F0b3Iuc3RvcmFnZS5nZXREaXJlY3RvcnkoKTsKICAgICAgZm9yIChjb25zdCBwYXJ0IG9mIHBhcnRzKSB7CiAgICAgICAgaGFuZGxlID0gYXdhaXQgaGFuZGxlLmdldERpcmVjdG9yeUhhbmRsZShwYXJ0LCB7IGNyZWF0ZTogZmFsc2UgfSk7CiAgICAgIH0KICAgICAgZGlySGFuZGxlID0gaGFuZGxlOwogICAgfSBjYXRjaCAoZXJyKSB7CiAgICAgIGlmIChlcnI/Lm5hbWUgPT09ICJOb3RGb3VuZEVycm9yIiB8fCBlcnI/LmNvZGUgPT09ICJFTk9FTlQiKSB7CiAgICAgICAgY29uc29sZS5sb2coYFtMT0FEX0lOREVYRVNdIENvbGxlY3Rpb24gZGlyZWN0b3J5IGRvZXNuJ3QgZXhpc3QsIG5vIGluZGV4ZXMgdG8gbG9hZGApOwogICAgICAgIHJldHVybjsKICAgICAgfQogICAgICB0aHJvdyBlcnI7CiAgICB9CiAgICBjb25zb2xlLmxvZyhgW0xPQURfSU5ERVhFU10gRm91bmQgY29sbGVjdGlvbiBkaXJlY3RvcnksIHNjYW5uaW5nIGZvciBpbmRleCBmaWxlcy4uLmApOwogICAgZm9yIGF3YWl0IChjb25zdCBbZW50cnlOYW1lLCBlbnRyeUhhbmRsZV0gb2YgZGlySGFuZGxlLmVudHJpZXMoKSkgewogICAgICBjb25zb2xlLmxvZyhgW0xPQURfSU5ERVhFU10gRm91bmQgZW50cnk6ICR7ZW50cnlOYW1lfSAoa2luZDogJHtlbnRyeUhhbmRsZS5raW5kfSlgKTsKICAgICAgaWYgKGVudHJ5SGFuZGxlLmtpbmQgIT09ICJmaWxlIikgY29udGludWU7CiAgICAgIGNvbnN0IHZlcnNpb25TdWZmaXhQYXR0ZXJuID0gL1wudlxkKyg/PS18JCkvOwogICAgICBjb25zdCBub3JtYWxpemVkTmFtZSA9IGVudHJ5TmFtZS5yZXBsYWNlKHZlcnNpb25TdWZmaXhQYXR0ZXJuLCAiIik7CiAgICAgIGxldCB0eXBlOwogICAgICBpZiAobm9ybWFsaXplZE5hbWUuZW5kc1dpdGgoIi50ZXh0aW5kZXgtZG9jdW1lbnRzLmJqc29uIikpIHsKICAgICAgICB0eXBlID0gInRleHQiOwogICAgICB9IGVsc2UgaWYgKG5vcm1hbGl6ZWROYW1lLmVuZHNXaXRoKCIucnRyZWUuYmpzb24iKSkgewogICAgICAgIHR5cGUgPSAiZ2Vvc3BhdGlhbCI7CiAgICAgIH0gZWxzZSBpZiAobm9ybWFsaXplZE5hbWUuZW5kc1dpdGgoIi5icGx1c3RyZWUuYmpzb24iKSkgewogICAgICAgIHR5cGUgPSAicmVndWxhciI7CiAgICAgIH0gZWxzZSB7CiAgICAgICAgY29uc29sZS5sb2coYFtMT0FEX0lOREVYRVNdIFNraXBwaW5nIG5vbi1pbmRleCBmaWxlOiAke2VudHJ5TmFtZX1gKTsKICAgICAgICBjb250aW51ZTsKICAgICAgfQogICAgICBjb25zdCBpbmRleE5hbWUgPSBub3JtYWxpemVkTmFtZS5yZXBsYWNlKC9cLnRleHRpbmRleC1kb2N1bWVudHNcLmJqc29uJC8sICIiKS5yZXBsYWNlKC9cLnJ0cmVlXC5ianNvbiQvLCAiIikucmVwbGFjZSgvXC5icGx1c3RyZWVcLmJqc29uJC8sICIiKTsKICAgICAgY29uc29sZS5sb2coYFtMT0FEX0lOREVYRVNdIFByb2Nlc3NpbmcgaW5kZXg6ICR7aW5kZXhOYW1lfSAodHlwZTogJHt0eXBlfSlgKTsKICAgICAgaWYgKHRoaXMuaW5kZXhlcy5oYXMoaW5kZXhOYW1lKSkgewogICAgICAgIGNvbnNvbGUubG9nKGBbTE9BRF9JTkRFWEVTXSBJbmRleCAke2luZGV4TmFtZX0gYWxyZWFkeSBsb2FkZWQsIHNraXBwaW5nYCk7CiAgICAgICAgY29udGludWU7CiAgICAgIH0KICAgICAgY29uc3Qga2V5cyA9IHRoaXMuX3BhcnNlSW5kZXhOYW1lKGluZGV4TmFtZSwgdHlwZSk7CiAgICAgIGlmICgha2V5cykgewogICAgICAgIGNvbnNvbGUubG9nKGBbTE9BRF9JTkRFWEVTXSBDb3VsZCBub3QgcGFyc2UgaW5kZXggbmFtZTogJHtpbmRleE5hbWV9LCBza2lwcGluZ2ApOwogICAgICAgIGNvbnRpbnVlOwogICAgICB9CiAgICAgIGxldCBpbmRleDsKICAgICAgaWYgKHR5cGUgPT09ICJ0ZXh0IikgewogICAgICAgIGNvbnN0IHN0b3JhZ2VGaWxlID0gYXdhaXQgdGhpcy5fZ2V0SW5kZXhQYXRoKGluZGV4TmFtZSwgdHlwZSk7CiAgICAgICAgaW5kZXggPSBuZXcgVGV4dENvbGxlY3Rpb25JbmRleChpbmRleE5hbWUsIGtleXMsIHN0b3JhZ2VGaWxlLCB7fSk7CiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gImdlb3NwYXRpYWwiKSB7CiAgICAgICAgY29uc3Qgc3RvcmFnZUZpbGUgPSBhd2FpdCB0aGlzLl9nZXRJbmRleFBhdGgoaW5kZXhOYW1lLCB0eXBlKTsKICAgICAgICBpbmRleCA9IG5ldyBHZW9zcGF0aWFsSW5kZXgoaW5kZXhOYW1lLCBrZXlzLCBzdG9yYWdlRmlsZSwge30pOwogICAgICB9IGVsc2UgewogICAgICAgIGNvbnN0IHN0b3JhZ2VGaWxlID0gYXdhaXQgdGhpcy5fZ2V0SW5kZXhQYXRoKGluZGV4TmFtZSwgdHlwZSk7CiAgICAgICAgaW5kZXggPSBuZXcgUmVndWxhckNvbGxlY3Rpb25JbmRleChpbmRleE5hbWUsIGtleXMsIHN0b3JhZ2VGaWxlLCB7fSk7CiAgICAgIH0KICAgICAgdHJ5IHsKICAgICAgICBhd2FpdCBpbmRleC5vcGVuKCk7CiAgICAgICAgdGhpcy5pbmRleGVzLnNldChpbmRleE5hbWUsIGluZGV4KTsKICAgICAgICBjb25zb2xlLmxvZyhgW0xPQURfSU5ERVhFU10gU3VjY2Vzc2Z1bGx5IGxvYWRlZCBpbmRleDogJHtpbmRleE5hbWV9YCk7CiAgICAgIH0gY2F0Y2ggKGVycikgewogICAgICAgIGNvbnNvbGUud2FybihgW0xPQURfSU5ERVhFU10gRmFpbGVkIHRvIG9wZW4gaW5kZXggJHtpbmRleE5hbWV9OmAsIGVycik7CiAgICAgIH0KICAgIH0KICAgIGNvbnNvbGUubG9nKGBbTE9BRF9JTkRFWEVTXSBGaW5pc2hlZCBsb2FkaW5nIGluZGV4ZXMuIFRvdGFsIGxvYWRlZDogJHt0aGlzLmluZGV4ZXMuc2l6ZX1gKTsKICB9CiAgX3BhcnNlSW5kZXhOYW1lKGluZGV4TmFtZSwgdHlwZSkgewogICAgY29uc3QgdG9rZW5zID0gaW5kZXhOYW1lLnNwbGl0KCJfIik7CiAgICBpZiAodG9rZW5zLmxlbmd0aCA8IDIgfHwgdG9rZW5zLmxlbmd0aCAlIDIgIT09IDApIHJldHVybiBudWxsOwogICAgY29uc3Qga2V5cyA9IHt9OwogICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpICs9IDIpIHsKICAgICAgY29uc3QgZmllbGQgPSB0b2tlbnNbaV07CiAgICAgIGNvbnN0IGRpciA9IHRva2Vuc1tpICsgMV07CiAgICAgIGlmICghZmllbGQgfHwgZGlyID09PSB2b2lkIDApIHJldHVybiBudWxsOwogICAgICBpZiAodHlwZSA9PT0gInRleHQiIHx8IGRpciA9PT0gInRleHQiKSB7CiAgICAgICAga2V5c1tmaWVsZF0gPSAidGV4dCI7CiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gImdlb3NwYXRpYWwiIHx8IGRpciA9PT0gIjJkc3BoZXJlIiB8fCBkaXIgPT09ICIyZCIpIHsKICAgICAgICBrZXlzW2ZpZWxkXSA9IGRpciA9PT0gIjJkIiA/ICIyZCIgOiAiMmRzcGhlcmUiOwogICAgICB9IGVsc2UgewogICAgICAgIGNvbnN0IG51bSA9IE51bWJlcihkaXIpOwogICAgICAgIGlmIChOdW1iZXIuaXNOYU4obnVtKSB8fCBudW0gIT09IDEgJiYgbnVtICE9PSAtMSkgewogICAgICAgICAgcmV0dXJuIG51bGw7CiAgICAgICAgfQogICAgICAgIGtleXNbZmllbGRdID0gbnVtOwogICAgICB9CiAgICB9CiAgICByZXR1cm4ga2V5czsKICB9CiAgLyoqCiAgICogQ2xvc2UgYWxsIGluZGV4ZXMKICAgKi8KICBhc3luYyBjbG9zZSgpIHsKICAgIGlmICghdGhpcy5faW5pdGlhbGl6ZWQpIHJldHVybjsKICAgIGZvciAoY29uc3QgW2luZGV4TmFtZSwgaW5kZXhdIG9mIHRoaXMuaW5kZXhlcykgewogICAgICBhd2FpdCBpbmRleC5jbG9zZSgpOwogICAgfQogICAgYXdhaXQgdGhpcy5fbWF5YmVDb21wYWN0RG9jdW1lbnRzKCk7CiAgICBhd2FpdCB0aGlzLmRvY3VtZW50cy5jbG9zZSgpOwogICAgaWYgKHRoaXMuX3JlbGVhc2VEb2N1bWVudHMpIHsKICAgICAgYXdhaXQgdGhpcy5fcmVsZWFzZURvY3VtZW50cygpOwogICAgICB0aGlzLl9yZWxlYXNlRG9jdW1lbnRzID0gbnVsbDsKICAgIH0KICB9CiAgYXN5bmMgX21heWJlQ29tcGFjdERvY3VtZW50cygpIHsKICAgIGlmICghdGhpcy5kb2N1bWVudHMgfHwgIXRoaXMuZG9jdW1lbnRzLmZpbGUpIHJldHVybjsKICAgIGNvbnN0IGN1cnJlbnRWZXJzaW9uID0gYXdhaXQgZ2V0Q3VycmVudFZlcnNpb24odGhpcy5kb2N1bWVudHNQYXRoKTsKICAgIGlmIChjdXJyZW50VmVyc2lvbiAhPT0gdGhpcy5kb2N1bWVudHNWZXJzaW9uKSByZXR1cm47CiAgICBjb25zdCBmaWxlU2l6ZSA9IHRoaXMuZG9jdW1lbnRzLmZpbGUuZ2V0RmlsZVNpemUoKTsKICAgIGlmICghZmlsZVNpemUgfHwgZmlsZVNpemUgPCBERUZBVUxUX0NPTVBBQ1RJT05fTUlOX0JZVEVTKSByZXR1cm47CiAgICBjb25zdCBuZXh0VmVyc2lvbiA9IGN1cnJlbnRWZXJzaW9uICsgMTsKICAgIGNvbnN0IGNvbXBhY3RQYXRoID0gYnVpbGRWZXJzaW9uZWRQYXRoKHRoaXMuZG9jdW1lbnRzUGF0aCwgbmV4dFZlcnNpb24pOwogICAgY29uc3QgZGVzdFN5bmNIYW5kbGUgPSBhd2FpdCBjcmVhdGVTeW5jQWNjZXNzSGFuZGxlKGNvbXBhY3RQYXRoLCB7IHJlc2V0OiB0cnVlIH0pOwogICAgYXdhaXQgdGhpcy5kb2N1bWVudHMuY29tcGFjdChkZXN0U3luY0hhbmRsZSk7CiAgICBhd2FpdCBwcm9tb3RlVmVyc2lvbih0aGlzLmRvY3VtZW50c1BhdGgsIG5leHRWZXJzaW9uLCBjdXJyZW50VmVyc2lvbik7CiAgfQogIC8qKgogICAqIEdlbmVyYXRlIGluZGV4IG5hbWUgZnJvbSBrZXlzCiAgICovCiAgZ2VuZXJhdGVJbmRleE5hbWUoa2V5cykgewogICAgY29uc3QgcGFydHMgPSBbXTsKICAgIGZvciAoY29uc3QgZmllbGQgaW4ga2V5cykgewogICAgICBpZiAoa2V5cy5oYXNPd25Qcm9wZXJ0eShmaWVsZCkpIHsKICAgICAgICBwYXJ0cy5wdXNoKGZpZWxkICsgIl8iICsga2V5c1tmaWVsZF0pOwogICAgICB9CiAgICB9CiAgICByZXR1cm4gcGFydHMuam9pbigiXyIpOwogIH0KICAvKioKICAgKiBEZXRlcm1pbmUgaWYga2V5cyBzcGVjaWZ5IGEgdGV4dCBpbmRleAogICAqLwogIGlzVGV4dEluZGV4KGtleXMpIHsKICAgIGZvciAoY29uc3QgZmllbGQgaW4ga2V5cykgewogICAgICBpZiAoa2V5c1tmaWVsZF0gPT09ICJ0ZXh0IikgewogICAgICAgIHJldHVybiB0cnVlOwogICAgICB9CiAgICB9CiAgICByZXR1cm4gZmFsc2U7CiAgfQogIC8qKgogICAqIERldGVybWluZSBpZiBrZXlzIHNwZWNpZnkgYSBnZW9zcGF0aWFsIGluZGV4CiAgICovCiAgaXNHZW9zcGF0aWFsSW5kZXgoa2V5cykgewogICAgZm9yIChjb25zdCBmaWVsZCBpbiBrZXlzKSB7CiAgICAgIGlmIChrZXlzW2ZpZWxkXSA9PT0gIjJkc3BoZXJlIiB8fCBrZXlzW2ZpZWxkXSA9PT0gIjJkIikgewogICAgICAgIHJldHVybiB0cnVlOwogICAgICB9CiAgICB9CiAgICByZXR1cm4gZmFsc2U7CiAgfQogIGFzeW5jIF9nZXRJbmRleFBhdGgoaW5kZXhOYW1lLCB0eXBlKSB7CiAgICBjb25zdCBzYW5pdGl6ZSA9ICh2YWx1ZSkgPT4gU3RyaW5nKHZhbHVlKS5yZXBsYWNlKC9bXmEtekEtWjAtOV8tXS9nLCAiXyIpOwogICAgY29uc3Qgc2FuaXRpemVkSW5kZXhOYW1lID0gc2FuaXRpemUoaW5kZXhOYW1lKTsKICAgIGlmICh0eXBlID09PSAidGV4dCIpIHsKICAgICAgcmV0dXJuIGAke3RoaXMucGF0aH0vJHtzYW5pdGl6ZWRJbmRleE5hbWV9LnRleHRpbmRleGA7CiAgICB9CiAgICBpZiAodHlwZSA9PT0gImdlb3NwYXRpYWwiKSB7CiAgICAgIHJldHVybiBgJHt0aGlzLnBhdGh9LyR7c2FuaXRpemVkSW5kZXhOYW1lfS5ydHJlZS5ianNvbmA7CiAgICB9CiAgICByZXR1cm4gYCR7dGhpcy5wYXRofS8ke3Nhbml0aXplZEluZGV4TmFtZX0uYnBsdXN0cmVlLmJqc29uYDsKICB9CiAgLyoqCiAgICogQnVpbGQvcmVidWlsZCBhbiBpbmRleAogICAqLwogIGFzeW5jIF9idWlsZEluZGV4KGluZGV4TmFtZSwga2V5cywgb3B0aW9ucyA9IHt9KSB7CiAgICBpZiAoIXRoaXMuX2luaXRpYWxpemVkKSBhd2FpdCB0aGlzLl9pbml0aWFsaXplKCk7CiAgICBsZXQgaW5kZXg7CiAgICBsZXQgc3RvcmFnZUZpbGU7CiAgICBsZXQgdHlwZTsKICAgIGlmICh0aGlzLmlzVGV4dEluZGV4KGtleXMpKSB7CiAgICAgIHR5cGUgPSAidGV4dCI7CiAgICAgIHN0b3JhZ2VGaWxlID0gYXdhaXQgdGhpcy5fZ2V0SW5kZXhQYXRoKGluZGV4TmFtZSwgdHlwZSk7CiAgICAgIGluZGV4ID0gbmV3IFRleHRDb2xsZWN0aW9uSW5kZXgoaW5kZXhOYW1lLCBrZXlzLCBzdG9yYWdlRmlsZSwgb3B0aW9ucyk7CiAgICB9IGVsc2UgaWYgKHRoaXMuaXNHZW9zcGF0aWFsSW5kZXgoa2V5cykpIHsKICAgICAgdHlwZSA9ICJnZW9zcGF0aWFsIjsKICAgICAgc3RvcmFnZUZpbGUgPSBhd2FpdCB0aGlzLl9nZXRJbmRleFBhdGgoaW5kZXhOYW1lLCB0eXBlKTsKICAgICAgaW5kZXggPSBuZXcgR2Vvc3BhdGlhbEluZGV4KGluZGV4TmFtZSwga2V5cywgc3RvcmFnZUZpbGUsIG9wdGlvbnMpOwogICAgfSBlbHNlIHsKICAgICAgdHlwZSA9ICJyZWd1bGFyIjsKICAgICAgc3RvcmFnZUZpbGUgPSBhd2FpdCB0aGlzLl9nZXRJbmRleFBhdGgoaW5kZXhOYW1lLCB0eXBlKTsKICAgICAgaW5kZXggPSBuZXcgUmVndWxhckNvbGxlY3Rpb25JbmRleChpbmRleE5hbWUsIGtleXMsIHN0b3JhZ2VGaWxlLCBvcHRpb25zKTsKICAgIH0KICAgIGF3YWl0IGluZGV4Lm9wZW4oKTsKICAgIGlmICh0eXBlb2YgaW5kZXguY2xlYXIgPT09ICJmdW5jdGlvbiIpIHsKICAgICAgYXdhaXQgaW5kZXguY2xlYXIoKTsKICAgIH0KICAgIGZvciBhd2FpdCAoY29uc3QgZW50cnkgb2YgdGhpcy5kb2N1bWVudHMpIHsKICAgICAgaWYgKGVudHJ5ICYmIGVudHJ5LnZhbHVlKSB7CiAgICAgICAgYXdhaXQgaW5kZXguYWRkKGVudHJ5LnZhbHVlKTsKICAgICAgfQogICAgfQogICAgdGhpcy5pbmRleGVzLnNldChpbmRleE5hbWUsIGluZGV4KTsKICAgIHJldHVybiBpbmRleDsKICB9CiAgLyoqCiAgICogVXBkYXRlIGluZGV4ZXMgd2hlbiBhIGRvY3VtZW50IGlzIGluc2VydGVkCiAgICovCiAgYXN5bmMgdXBkYXRlSW5kZXhlc09uSW5zZXJ0KGRvYykgewogICAgY29uc3QgcHJvbWlzZXMgPSBbXTsKICAgIGZvciAoY29uc3QgW2luZGV4TmFtZSwgaW5kZXhdIG9mIHRoaXMuaW5kZXhlcykgewogICAgICBwcm9taXNlcy5wdXNoKChhc3luYyAoKSA9PiB7CiAgICAgICAgYXdhaXQgdGhpcy5fZW5zdXJlSW5kZXhPcGVuKGluZGV4KTsKICAgICAgICBhd2FpdCBpbmRleC5hZGQoZG9jKTsKICAgICAgfSkoKSk7CiAgICB9CiAgICBpZiAocHJvbWlzZXMubGVuZ3RoID4gMCkgewogICAgICBhd2FpdCBQcm9taXNlLmFsbChwcm9taXNlcyk7CiAgICB9CiAgfQogIC8qKgogICAqIFVwZGF0ZSBpbmRleGVzIHdoZW4gYSBkb2N1bWVudCBpcyBkZWxldGVkCiAgICovCiAgYXN5bmMgdXBkYXRlSW5kZXhlc09uRGVsZXRlKGRvYykgewogICAgY29uc3QgcHJvbWlzZXMgPSBbXTsKICAgIGZvciAoY29uc3QgW2luZGV4TmFtZSwgaW5kZXhdIG9mIHRoaXMuaW5kZXhlcykgewogICAgICBwcm9taXNlcy5wdXNoKChhc3luYyAoKSA9PiB7CiAgICAgICAgYXdhaXQgdGhpcy5fZW5zdXJlSW5kZXhPcGVuKGluZGV4KTsKICAgICAgICBhd2FpdCBpbmRleC5yZW1vdmUoZG9jKTsKICAgICAgfSkoKSk7CiAgICB9CiAgICBpZiAocHJvbWlzZXMubGVuZ3RoID4gMCkgewogICAgICBhd2FpdCBQcm9taXNlLmFsbChwcm9taXNlcyk7CiAgICB9CiAgfQogIC8qKgogICAqIEVuc3VyZSBhbiBpbmRleCBpcyBvcGVuIGJlZm9yZSB1c2luZyBpdAogICAqIEBwcml2YXRlCiAgICovCiAgYXN5bmMgX2Vuc3VyZUluZGV4T3BlbihpbmRleCkgewogICAgaWYgKGluZGV4ICYmIHR5cGVvZiBpbmRleC5vcGVuID09PSAiZnVuY3Rpb24iICYmICFpbmRleC5pc09wZW4pIHsKICAgICAgYXdhaXQgaW5kZXgub3BlbigpOwogICAgfQogIH0KICAvKioKICAgKiBRdWVyeSBwbGFubmVyIC0gYW5hbHl6ZSBxdWVyeSBhbmQgZGV0ZXJtaW5lIG9wdGltYWwgZXhlY3V0aW9uIHBsYW4KICAgKi8KICBwbGFuUXVlcnkocXVlcnkpIHsKICAgIGNvbnN0IHBsYW4gPSB0aGlzLnF1ZXJ5UGxhbm5lci5wbGFuKHF1ZXJ5KTsKICAgIHJldHVybiB7CiAgICAgIHVzZUluZGV4OiBwbGFuLnR5cGUgIT09ICJmdWxsX3NjYW4iLAogICAgICBwbGFuVHlwZTogcGxhbi50eXBlLAogICAgICBpbmRleE5hbWVzOiBwbGFuLmluZGV4ZXMsCiAgICAgIGRvY0lkczogbnVsbCwKICAgICAgLy8gRm9yY2UgZnVsbCBzY2FuIGZvciBub3cgLSB1c2UgcGxhblF1ZXJ5QXN5bmMgZm9yIGluZGV4IHJlc3VsdHMKICAgICAgZXN0aW1hdGVkQ29zdDogcGxhbi5lc3RpbWF0ZWRDb3N0LAogICAgICBpbmRleE9ubHk6IHBsYW4uaW5kZXhPbmx5IHx8IGZhbHNlCiAgICB9OwogIH0KICAvKioKICAgKiBBc3luYyB2ZXJzaW9uIG9mIHF1ZXJ5IHBsYW5uZXIgLSBmb3IgdXNlIHdpdGggYXN5bmMgaW5kZXhlcwogICAqLwogIGFzeW5jIHBsYW5RdWVyeUFzeW5jKHF1ZXJ5KSB7CiAgICBjb25zdCBwbGFuID0gdGhpcy5xdWVyeVBsYW5uZXIucGxhbihxdWVyeSk7CiAgICBjb25zdCBkb2NJZHMgPSBhd2FpdCB0aGlzLnF1ZXJ5UGxhbm5lci5leGVjdXRlKHBsYW4pOwogICAgcmV0dXJuIHsKICAgICAgdXNlSW5kZXg6IHBsYW4udHlwZSAhPT0gImZ1bGxfc2NhbiIsCiAgICAgIHBsYW5UeXBlOiBwbGFuLnR5cGUsCiAgICAgIGluZGV4TmFtZXM6IHBsYW4uaW5kZXhlcywKICAgICAgZG9jSWRzLAogICAgICBlc3RpbWF0ZWRDb3N0OiBwbGFuLmVzdGltYXRlZENvc3QsCiAgICAgIGluZGV4T25seTogcGxhbi5pbmRleE9ubHkgfHwgZmFsc2UKICAgIH07CiAgfQogIC8qKgogICAqIEdldCBhIHRleHQgaW5kZXggZm9yIHRoZSBnaXZlbiBmaWVsZAogICAqIEBwYXJhbSB7c3RyaW5nfSBmaWVsZCAtIFRoZSBmaWVsZCBuYW1lCiAgICogQHJldHVybnMge1RleHRDb2xsZWN0aW9uSW5kZXh8bnVsbH0gVGhlIHRleHQgaW5kZXggb3IgbnVsbCBpZiBub3QgZm91bmQKICAgKi8KICBnZXRUZXh0SW5kZXgoZmllbGQpIHsKICAgIGZvciAoY29uc3QgW2luZGV4TmFtZSwgaW5kZXhdIG9mIHRoaXMuaW5kZXhlcykgewogICAgICBpZiAoaW5kZXggaW5zdGFuY2VvZiBUZXh0Q29sbGVjdGlvbkluZGV4KSB7CiAgICAgICAgaWYgKGluZGV4LmluZGV4ZWRGaWVsZHMuaW5jbHVkZXMoZmllbGQpKSB7CiAgICAgICAgICByZXR1cm4gaW5kZXg7CiAgICAgICAgfQogICAgICB9CiAgICB9CiAgICByZXR1cm4gbnVsbDsKICB9CiAgLy8gQ29sbGVjdGlvbiBtZXRob2RzCiAgYXN5bmMgYWdncmVnYXRlKHBpcGVsaW5lKSB7CiAgICBpZiAoIXBpcGVsaW5lIHx8ICFpc0FycmF5KHBpcGVsaW5lKSkgewogICAgICB0aHJvdyBuZXcgUXVlcnlFcnJvcigiUGlwZWxpbmUgbXVzdCBiZSBhbiBhcnJheSIsIHsKICAgICAgICBjb2xsZWN0aW9uOiB0aGlzLm5hbWUsCiAgICAgICAgY29kZTogRXJyb3JDb2Rlcy5GQUlMRURfVE9fUEFSU0UKICAgICAgfSk7CiAgICB9CiAgICBsZXQgcmVzdWx0cyA9IFtdOwogICAgY29uc3QgY3Vyc29yID0gdGhpcy5maW5kKHt9KTsKICAgIGF3YWl0IGN1cnNvci5fZW5zdXJlSW5pdGlhbGl6ZWQoKTsKICAgIHdoaWxlIChhd2FpdCBjdXJzb3IuaGFzTmV4dCgpKSB7CiAgICAgIHJlc3VsdHMucHVzaChhd2FpdCBjdXJzb3IubmV4dCgpKTsKICAgIH0KICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGlwZWxpbmUubGVuZ3RoOyBpKyspIHsKICAgICAgY29uc3Qgc3RhZ2UgPSBwaXBlbGluZVtpXTsKICAgICAgY29uc3Qgc3RhZ2VLZXlzID0gT2JqZWN0LmtleXMoc3RhZ2UpOwogICAgICBpZiAoc3RhZ2VLZXlzLmxlbmd0aCAhPT0gMSkgewogICAgICAgIHRocm93IG5ldyBRdWVyeUVycm9yKCJFYWNoIHBpcGVsaW5lIHN0YWdlIG11c3QgaGF2ZSBleGFjdGx5IG9uZSBrZXkiLCB7CiAgICAgICAgICBjb2xsZWN0aW9uOiB0aGlzLm5hbWUsCiAgICAgICAgICBjb2RlOiBFcnJvckNvZGVzLkZBSUxFRF9UT19QQVJTRQogICAgICAgIH0pOwogICAgICB9CiAgICAgIGNvbnN0IHN0YWdlVHlwZSA9IHN0YWdlS2V5c1swXTsKICAgICAgY29uc3Qgc3RhZ2VTcGVjID0gc3RhZ2Vbc3RhZ2VUeXBlXTsKICAgICAgaWYgKHN0YWdlVHlwZSA9PT0gIiRtYXRjaCIpIHsKICAgICAgICBjb25zdCBtYXRjaGVkID0gW107CiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCByZXN1bHRzLmxlbmd0aDsgaisrKSB7CiAgICAgICAgICBpZiAobWF0Y2hlcyhyZXN1bHRzW2pdLCBzdGFnZVNwZWMpKSB7CiAgICAgICAgICAgIG1hdGNoZWQucHVzaChyZXN1bHRzW2pdKTsKICAgICAgICAgIH0KICAgICAgICB9CiAgICAgICAgcmVzdWx0cyA9IG1hdGNoZWQ7CiAgICAgIH0gZWxzZSBpZiAoc3RhZ2VUeXBlID09PSAiJHByb2plY3QiKSB7CiAgICAgICAgY29uc3QgcHJvamVjdGVkID0gW107CiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCByZXN1bHRzLmxlbmd0aDsgaisrKSB7CiAgICAgICAgICBwcm9qZWN0ZWQucHVzaChhcHBseVByb2plY3Rpb25XaXRoRXhwcmVzc2lvbnMoc3RhZ2VTcGVjLCByZXN1bHRzW2pdKSk7CiAgICAgICAgfQogICAgICAgIHJlc3VsdHMgPSBwcm9qZWN0ZWQ7CiAgICAgIH0gZWxzZSBpZiAoc3RhZ2VUeXBlID09PSAiJGFkZEZpZWxkcyIgfHwgc3RhZ2VUeXBlID09PSAiJHNldCIpIHsKICAgICAgICBjb25zdCBtb2RpZmllZCA9IFtdOwogICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcmVzdWx0cy5sZW5ndGg7IGorKykgewogICAgICAgICAgY29uc3QgZG9jID0gY29weShyZXN1bHRzW2pdKTsKICAgICAgICAgIGZvciAoY29uc3QgZmllbGQgaW4gc3RhZ2VTcGVjKSB7CiAgICAgICAgICAgIGNvbnN0IGV4cHIgPSBzdGFnZVNwZWNbZmllbGRdOwogICAgICAgICAgICBkb2NbZmllbGRdID0gZXZhbHVhdGVFeHByZXNzaW9uKGV4cHIsIHJlc3VsdHNbal0pOwogICAgICAgICAgfQogICAgICAgICAgbW9kaWZpZWQucHVzaChkb2MpOwogICAgICAgIH0KICAgICAgICByZXN1bHRzID0gbW9kaWZpZWQ7CiAgICAgIH0gZWxzZSBpZiAoc3RhZ2VUeXBlID09PSAiJHVuc2V0IikgewogICAgICAgIGNvbnN0IG1vZGlmaWVkID0gW107CiAgICAgICAgbGV0IGZpZWxkc1RvUmVtb3ZlID0gW107CiAgICAgICAgaWYgKHR5cGVvZiBzdGFnZVNwZWMgPT09ICJzdHJpbmciKSB7CiAgICAgICAgICBmaWVsZHNUb1JlbW92ZSA9IFtzdGFnZVNwZWNdOwogICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShzdGFnZVNwZWMpKSB7CiAgICAgICAgICBmaWVsZHNUb1JlbW92ZSA9IHN0YWdlU3BlYzsKICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBzdGFnZVNwZWMgPT09ICJvYmplY3QiKSB7CiAgICAgICAgICBmaWVsZHNUb1JlbW92ZSA9IE9iamVjdC5rZXlzKHN0YWdlU3BlYyk7CiAgICAgICAgfQogICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcmVzdWx0cy5sZW5ndGg7IGorKykgewogICAgICAgICAgY29uc3QgZG9jID0gY29weShyZXN1bHRzW2pdKTsKICAgICAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgZmllbGRzVG9SZW1vdmUubGVuZ3RoOyBrKyspIHsKICAgICAgICAgICAgY29uc3QgZmllbGQgPSBmaWVsZHNUb1JlbW92ZVtrXTsKICAgICAgICAgICAgY29uc3QgcGF0aFBhcnRzID0gZmllbGQuc3BsaXQoIi4iKTsKICAgICAgICAgICAgaWYgKHBhdGhQYXJ0cy5sZW5ndGggPT09IDEpIHsKICAgICAgICAgICAgICBkZWxldGUgZG9jW2ZpZWxkXTsKICAgICAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgICBsZXQgcGFyZW50ID0gZG9jOwogICAgICAgICAgICAgIGZvciAobGV0IG0gPSAwOyBtIDwgcGF0aFBhcnRzLmxlbmd0aCAtIDE7IG0rKykgewogICAgICAgICAgICAgICAgaWYgKHBhcmVudCA9PSB2b2lkIDAgfHwgcGFyZW50ID09IG51bGwpIGJyZWFrOwogICAgICAgICAgICAgICAgcGFyZW50ID0gcGFyZW50W3BhdGhQYXJ0c1ttXV07CiAgICAgICAgICAgICAgfQogICAgICAgICAgICAgIGlmIChwYXJlbnQgIT0gdm9pZCAwICYmIHBhcmVudCAhPSBudWxsKSB7CiAgICAgICAgICAgICAgICBkZWxldGUgcGFyZW50W3BhdGhQYXJ0c1twYXRoUGFydHMubGVuZ3RoIC0gMV1dOwogICAgICAgICAgICAgIH0KICAgICAgICAgICAgfQogICAgICAgICAgfQogICAgICAgICAgbW9kaWZpZWQucHVzaChkb2MpOwogICAgICAgIH0KICAgICAgICByZXN1bHRzID0gbW9kaWZpZWQ7CiAgICAgIH0gZWxzZSBpZiAoc3RhZ2VUeXBlID09PSAiJHNvcnQiKSB7CiAgICAgICAgY29uc3Qgc29ydEtleXMgPSBPYmplY3Qua2V5cyhzdGFnZVNwZWMpOwogICAgICAgIHJlc3VsdHMuc29ydChmdW5jdGlvbihhLCBiKSB7CiAgICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IHNvcnRLZXlzLmxlbmd0aDsgaysrKSB7CiAgICAgICAgICAgIGNvbnN0IGtleSA9IHNvcnRLZXlzW2tdOwogICAgICAgICAgICBpZiAoYVtrZXldID09PSB2b2lkIDAgJiYgYltrZXldICE9PSB2b2lkIDApIHJldHVybiAtMSAqIHN0YWdlU3BlY1trZXldOwogICAgICAgICAgICBpZiAoYVtrZXldICE9PSB2b2lkIDAgJiYgYltrZXldID09PSB2b2lkIDApIHJldHVybiAxICogc3RhZ2VTcGVjW2tleV07CiAgICAgICAgICAgIGlmIChhW2tleV0gPCBiW2tleV0pIHJldHVybiAtMSAqIHN0YWdlU3BlY1trZXldOwogICAgICAgICAgICBpZiAoYVtrZXldID4gYltrZXldKSByZXR1cm4gMSAqIHN0YWdlU3BlY1trZXldOwogICAgICAgICAgfQogICAgICAgICAgcmV0dXJuIDA7CiAgICAgICAgfSk7CiAgICAgIH0gZWxzZSBpZiAoc3RhZ2VUeXBlID09PSAiJGxpbWl0IikgewogICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLnNsaWNlKDAsIHN0YWdlU3BlYyk7CiAgICAgIH0gZWxzZSBpZiAoc3RhZ2VUeXBlID09PSAiJHNraXAiKSB7CiAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuc2xpY2Uoc3RhZ2VTcGVjKTsKICAgICAgfSBlbHNlIGlmIChzdGFnZVR5cGUgPT09ICIkZ3JvdXAiKSB7CiAgICAgICAgY29uc3QgZ3JvdXBzID0ge307CiAgICAgICAgY29uc3QgZ3JvdXBJZCA9IHN0YWdlU3BlYy5faWQ7CiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCByZXN1bHRzLmxlbmd0aDsgaisrKSB7CiAgICAgICAgICBjb25zdCBkb2MgPSByZXN1bHRzW2pdOwogICAgICAgICAgbGV0IGtleTsKICAgICAgICAgIGlmIChncm91cElkID09PSBudWxsIHx8IGdyb3VwSWQgPT09IHZvaWQgMCkgewogICAgICAgICAgICBrZXkgPSBudWxsOwogICAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAga2V5ID0gZXZhbHVhdGVFeHByZXNzaW9uKGdyb3VwSWQsIGRvYyk7CiAgICAgICAgICB9CiAgICAgICAgICBjb25zdCBrZXlTdHIgPSBKU09OLnN0cmluZ2lmeShrZXkpOwogICAgICAgICAgaWYgKCFncm91cHNba2V5U3RyXSkgewogICAgICAgICAgICBncm91cHNba2V5U3RyXSA9IHsKICAgICAgICAgICAgICBfaWQ6IGtleSwKICAgICAgICAgICAgICBkb2NzOiBbXSwKICAgICAgICAgICAgICBhY2N1bXVsYXRvcnM6IHt9CiAgICAgICAgICAgIH07CiAgICAgICAgICB9CiAgICAgICAgICBncm91cHNba2V5U3RyXS5kb2NzLnB1c2goZG9jKTsKICAgICAgICB9CiAgICAgICAgY29uc3QgZ3JvdXBlZCA9IFtdOwogICAgICAgIGZvciAoY29uc3QgZ3JvdXBLZXkgaW4gZ3JvdXBzKSB7CiAgICAgICAgICBjb25zdCBncm91cCA9IGdyb3Vwc1tncm91cEtleV07CiAgICAgICAgICBjb25zdCByZXN1bHQgPSB7IF9pZDogZ3JvdXAuX2lkIH07CiAgICAgICAgICBmb3IgKGNvbnN0IGZpZWxkIGluIHN0YWdlU3BlYykgewogICAgICAgICAgICBpZiAoZmllbGQgPT09ICJfaWQiKSBjb250aW51ZTsKICAgICAgICAgICAgY29uc3QgYWNjdW11bGF0b3IgPSBzdGFnZVNwZWNbZmllbGRdOwogICAgICAgICAgICBjb25zdCBhY2NLZXlzID0gT2JqZWN0LmtleXMoYWNjdW11bGF0b3IpOwogICAgICAgICAgICBpZiAoYWNjS2V5cy5sZW5ndGggIT09IDEpIGNvbnRpbnVlOwogICAgICAgICAgICBjb25zdCBhY2NUeXBlID0gYWNjS2V5c1swXTsKICAgICAgICAgICAgY29uc3QgYWNjRXhwciA9IGFjY3VtdWxhdG9yW2FjY1R5cGVdOwogICAgICAgICAgICBpZiAoYWNjVHlwZSA9PT0gIiRzdW0iKSB7CiAgICAgICAgICAgICAgbGV0IHN1bSA9IDA7CiAgICAgICAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBncm91cC5kb2NzLmxlbmd0aDsgaysrKSB7CiAgICAgICAgICAgICAgICBjb25zdCB2YWwgPSBldmFsdWF0ZUV4cHJlc3Npb24oYWNjRXhwciwgZ3JvdXAuZG9jc1trXSk7CiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbCA9PT0gIm51bWJlciIpIHsKICAgICAgICAgICAgICAgICAgc3VtICs9IHZhbDsKICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsICE9PSBudWxsICYmIHZhbCAhPT0gdm9pZCAwKSB7CiAgICAgICAgICAgICAgICAgIHN1bSArPSBOdW1iZXIodmFsKSB8fCAwOwogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgIH0KICAgICAgICAgICAgICByZXN1bHRbZmllbGRdID0gc3VtOwogICAgICAgICAgICB9IGVsc2UgaWYgKGFjY1R5cGUgPT09ICIkYXZnIikgewogICAgICAgICAgICAgIGxldCBzdW0gPSAwOwogICAgICAgICAgICAgIGxldCBjb3VudCA9IDA7CiAgICAgICAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBncm91cC5kb2NzLmxlbmd0aDsgaysrKSB7CiAgICAgICAgICAgICAgICBjb25zdCB2YWwgPSBldmFsdWF0ZUV4cHJlc3Npb24oYWNjRXhwciwgZ3JvdXAuZG9jc1trXSk7CiAgICAgICAgICAgICAgICBpZiAodmFsICE9PSB2b2lkIDAgJiYgdmFsICE9PSBudWxsKSB7CiAgICAgICAgICAgICAgICAgIHN1bSArPSBOdW1iZXIodmFsKSB8fCAwOwogICAgICAgICAgICAgICAgICBjb3VudCsrOwogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgIH0KICAgICAgICAgICAgICByZXN1bHRbZmllbGRdID0gY291bnQgPiAwID8gc3VtIC8gY291bnQgOiAwOwogICAgICAgICAgICB9IGVsc2UgaWYgKGFjY1R5cGUgPT09ICIkbWluIikgewogICAgICAgICAgICAgIGxldCBtaW4gPSB2b2lkIDA7CiAgICAgICAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBncm91cC5kb2NzLmxlbmd0aDsgaysrKSB7CiAgICAgICAgICAgICAgICBjb25zdCB2YWwgPSBldmFsdWF0ZUV4cHJlc3Npb24oYWNjRXhwciwgZ3JvdXAuZG9jc1trXSk7CiAgICAgICAgICAgICAgICBpZiAodmFsICE9PSB2b2lkIDAgJiYgKG1pbiA9PT0gdm9pZCAwIHx8IHZhbCA8IG1pbikpIHsKICAgICAgICAgICAgICAgICAgbWluID0gdmFsOwogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgIH0KICAgICAgICAgICAgICByZXN1bHRbZmllbGRdID0gbWluOwogICAgICAgICAgICB9IGVsc2UgaWYgKGFjY1R5cGUgPT09ICIkbWF4IikgewogICAgICAgICAgICAgIGxldCBtYXggPSB2b2lkIDA7CiAgICAgICAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBncm91cC5kb2NzLmxlbmd0aDsgaysrKSB7CiAgICAgICAgICAgICAgICBjb25zdCB2YWwgPSBldmFsdWF0ZUV4cHJlc3Npb24oYWNjRXhwciwgZ3JvdXAuZG9jc1trXSk7CiAgICAgICAgICAgICAgICBpZiAodmFsICE9PSB2b2lkIDAgJiYgKG1heCA9PT0gdm9pZCAwIHx8IHZhbCA+IG1heCkpIHsKICAgICAgICAgICAgICAgICAgbWF4ID0gdmFsOwogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgIH0KICAgICAgICAgICAgICByZXN1bHRbZmllbGRdID0gbWF4OwogICAgICAgICAgICB9IGVsc2UgaWYgKGFjY1R5cGUgPT09ICIkcHVzaCIpIHsKICAgICAgICAgICAgICBjb25zdCBhcnIgPSBbXTsKICAgICAgICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IGdyb3VwLmRvY3MubGVuZ3RoOyBrKyspIHsKICAgICAgICAgICAgICAgIGNvbnN0IHZhbCA9IGV2YWx1YXRlRXhwcmVzc2lvbihhY2NFeHByLCBncm91cC5kb2NzW2tdKTsKICAgICAgICAgICAgICAgIGFyci5wdXNoKHZhbCk7CiAgICAgICAgICAgICAgfQogICAgICAgICAgICAgIHJlc3VsdFtmaWVsZF0gPSBhcnI7CiAgICAgICAgICAgIH0gZWxzZSBpZiAoYWNjVHlwZSA9PT0gIiRhZGRUb1NldCIpIHsKICAgICAgICAgICAgICBjb25zdCBzZXQgPSB7fTsKICAgICAgICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IGdyb3VwLmRvY3MubGVuZ3RoOyBrKyspIHsKICAgICAgICAgICAgICAgIGNvbnN0IHZhbCA9IGV2YWx1YXRlRXhwcmVzc2lvbihhY2NFeHByLCBncm91cC5kb2NzW2tdKTsKICAgICAgICAgICAgICAgIHNldFtKU09OLnN0cmluZ2lmeSh2YWwpXSA9IHZhbDsKICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgY29uc3QgYXJyID0gW107CiAgICAgICAgICAgICAgZm9yIChjb25zdCB2YWxLZXkgaW4gc2V0KSB7CiAgICAgICAgICAgICAgICBhcnIucHVzaChzZXRbdmFsS2V5XSk7CiAgICAgICAgICAgICAgfQogICAgICAgICAgICAgIHJlc3VsdFtmaWVsZF0gPSBhcnI7CiAgICAgICAgICAgIH0gZWxzZSBpZiAoYWNjVHlwZSA9PT0gIiRmaXJzdCIpIHsKICAgICAgICAgICAgICBpZiAoZ3JvdXAuZG9jcy5sZW5ndGggPiAwKSB7CiAgICAgICAgICAgICAgICByZXN1bHRbZmllbGRdID0gZXZhbHVhdGVFeHByZXNzaW9uKGFjY0V4cHIsIGdyb3VwLmRvY3NbMF0pOwogICAgICAgICAgICAgIH0KICAgICAgICAgICAgfSBlbHNlIGlmIChhY2NUeXBlID09PSAiJGxhc3QiKSB7CiAgICAgICAgICAgICAgaWYgKGdyb3VwLmRvY3MubGVuZ3RoID4gMCkgewogICAgICAgICAgICAgICAgcmVzdWx0W2ZpZWxkXSA9IGV2YWx1YXRlRXhwcmVzc2lvbihhY2NFeHByLCBncm91cC5kb2NzW2dyb3VwLmRvY3MubGVuZ3RoIC0gMV0pOwogICAgICAgICAgICAgIH0KICAgICAgICAgICAgfSBlbHNlIGlmIChhY2NUeXBlID09PSAiJHN0ZERldlBvcCIpIHsKICAgICAgICAgICAgICBjb25zdCB2YWx1ZXMgPSBbXTsKICAgICAgICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IGdyb3VwLmRvY3MubGVuZ3RoOyBrKyspIHsKICAgICAgICAgICAgICAgIGNvbnN0IHZhbCA9IGV2YWx1YXRlRXhwcmVzc2lvbihhY2NFeHByLCBncm91cC5kb2NzW2tdKTsKICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsID09PSAibnVtYmVyIikgewogICAgICAgICAgICAgICAgICB2YWx1ZXMucHVzaCh2YWwpOwogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgIH0KICAgICAgICAgICAgICBpZiAodmFsdWVzLmxlbmd0aCA+IDApIHsKICAgICAgICAgICAgICAgIGNvbnN0IG1lYW4gPSB2YWx1ZXMucmVkdWNlKChhLCBiKSA9PiBhICsgYiwgMCkgLyB2YWx1ZXMubGVuZ3RoOwogICAgICAgICAgICAgICAgY29uc3QgdmFyaWFuY2UgPSB2YWx1ZXMucmVkdWNlKChzdW0sIHZhbCkgPT4gc3VtICsgTWF0aC5wb3codmFsIC0gbWVhbiwgMiksIDApIC8gdmFsdWVzLmxlbmd0aDsKICAgICAgICAgICAgICAgIHJlc3VsdFtmaWVsZF0gPSBNYXRoLnNxcnQodmFyaWFuY2UpOwogICAgICAgICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgICAgICByZXN1bHRbZmllbGRdID0gMDsKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0gZWxzZSBpZiAoYWNjVHlwZSA9PT0gIiRzdGREZXZTYW1wIikgewogICAgICAgICAgICAgIGNvbnN0IHZhbHVlcyA9IFtdOwogICAgICAgICAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgZ3JvdXAuZG9jcy5sZW5ndGg7IGsrKykgewogICAgICAgICAgICAgICAgY29uc3QgdmFsID0gZXZhbHVhdGVFeHByZXNzaW9uKGFjY0V4cHIsIGdyb3VwLmRvY3Nba10pOwogICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWwgPT09ICJudW1iZXIiKSB7CiAgICAgICAgICAgICAgICAgIHZhbHVlcy5wdXNoKHZhbCk7CiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgfQogICAgICAgICAgICAgIGlmICh2YWx1ZXMubGVuZ3RoID4gMSkgewogICAgICAgICAgICAgICAgY29uc3QgbWVhbiA9IHZhbHVlcy5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKSAvIHZhbHVlcy5sZW5ndGg7CiAgICAgICAgICAgICAgICBjb25zdCB2YXJpYW5jZSA9IHZhbHVlcy5yZWR1Y2UoKHN1bSwgdmFsKSA9PiBzdW0gKyBNYXRoLnBvdyh2YWwgLSBtZWFuLCAyKSwgMCkgLyAodmFsdWVzLmxlbmd0aCAtIDEpOwogICAgICAgICAgICAgICAgcmVzdWx0W2ZpZWxkXSA9IE1hdGguc3FydCh2YXJpYW5jZSk7CiAgICAgICAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgICAgIHJlc3VsdFtmaWVsZF0gPSAwOwogICAgICAgICAgICAgIH0KICAgICAgICAgICAgfSBlbHNlIGlmIChhY2NUeXBlID09PSAiJG1lcmdlT2JqZWN0cyIpIHsKICAgICAgICAgICAgICBjb25zdCBtZXJnZWQgPSB7fTsKICAgICAgICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IGdyb3VwLmRvY3MubGVuZ3RoOyBrKyspIHsKICAgICAgICAgICAgICAgIGNvbnN0IHZhbCA9IGV2YWx1YXRlRXhwcmVzc2lvbihhY2NFeHByLCBncm91cC5kb2NzW2tdKTsKICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsID09PSAib2JqZWN0IiAmJiB2YWwgIT09IG51bGwgJiYgIUFycmF5LmlzQXJyYXkodmFsKSkgewogICAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKG1lcmdlZCwgdmFsKTsKICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgcmVzdWx0W2ZpZWxkXSA9IG1lcmdlZDsKICAgICAgICAgICAgfQogICAgICAgICAgfQogICAgICAgICAgZ3JvdXBlZC5wdXNoKHJlc3VsdCk7CiAgICAgICAgfQogICAgICAgIHJlc3VsdHMgPSBncm91cGVkOwogICAgICB9IGVsc2UgaWYgKHN0YWdlVHlwZSA9PT0gIiRjb3VudCIpIHsKICAgICAgICByZXN1bHRzID0gW3sgW3N0YWdlU3BlY106IHJlc3VsdHMubGVuZ3RoIH1dOwogICAgICB9IGVsc2UgaWYgKHN0YWdlVHlwZSA9PT0gIiR1bndpbmQiKSB7CiAgICAgICAgY29uc3QgdW53b3VuZCA9IFtdOwogICAgICAgIGxldCBmaWVsZFBhdGggPSBzdGFnZVNwZWM7CiAgICAgICAgaWYgKHR5cGVvZiBmaWVsZFBhdGggPT09ICJzdHJpbmciICYmIGZpZWxkUGF0aC5jaGFyQXQoMCkgPT09ICIkIikgewogICAgICAgICAgZmllbGRQYXRoID0gZmllbGRQYXRoLnN1YnN0cmluZygxKTsKICAgICAgICB9CiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCByZXN1bHRzLmxlbmd0aDsgaisrKSB7CiAgICAgICAgICBjb25zdCBkb2MgPSByZXN1bHRzW2pdOwogICAgICAgICAgY29uc3QgYXJyID0gZ2V0UHJvcChkb2MsIGZpZWxkUGF0aCk7CiAgICAgICAgICBpZiAoYXJyICYmIGlzQXJyYXkoYXJyKSAmJiBhcnIubGVuZ3RoID4gMCkgewogICAgICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IGFyci5sZW5ndGg7IGsrKykgewogICAgICAgICAgICAgIGNvbnN0IHVud291bmREb2MgPSBjb3B5KGRvYyk7CiAgICAgICAgICAgICAgY29uc3QgcGFydHMgPSBmaWVsZFBhdGguc3BsaXQoIi4iKTsKICAgICAgICAgICAgICBsZXQgdGFyZ2V0ID0gdW53b3VuZERvYzsKICAgICAgICAgICAgICBmb3IgKGxldCBsID0gMDsgbCA8IHBhcnRzLmxlbmd0aCAtIDE7IGwrKykgewogICAgICAgICAgICAgICAgaWYgKCF0YXJnZXRbcGFydHNbbF1dKSB7CiAgICAgICAgICAgICAgICAgIHRhcmdldFtwYXJ0c1tsXV0gPSB7fTsKICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIHRhcmdldCA9IHRhcmdldFtwYXJ0c1tsXV07CiAgICAgICAgICAgICAgfQogICAgICAgICAgICAgIHRhcmdldFtwYXJ0c1twYXJ0cy5sZW5ndGggLSAxXV0gPSBhcnJba107CiAgICAgICAgICAgICAgdW53b3VuZC5wdXNoKHVud291bmREb2MpOwogICAgICAgICAgICB9CiAgICAgICAgICB9CiAgICAgICAgfQogICAgICAgIHJlc3VsdHMgPSB1bndvdW5kOwogICAgICB9IGVsc2UgaWYgKHN0YWdlVHlwZSA9PT0gIiRzb3J0QnlDb3VudCIpIHsKICAgICAgICBjb25zdCBncm91cHMgPSB7fTsKICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHJlc3VsdHMubGVuZ3RoOyBqKyspIHsKICAgICAgICAgIGNvbnN0IGRvYyA9IHJlc3VsdHNbal07CiAgICAgICAgICBjb25zdCB2YWx1ZSA9IGV2YWx1YXRlRXhwcmVzc2lvbihzdGFnZVNwZWMsIGRvYyk7CiAgICAgICAgICBjb25zdCBrZXkgPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7CiAgICAgICAgICBpZiAoIWdyb3Vwc1trZXldKSB7CiAgICAgICAgICAgIGdyb3Vwc1trZXldID0gewogICAgICAgICAgICAgIF9pZDogdmFsdWUsCiAgICAgICAgICAgICAgY291bnQ6IDAKICAgICAgICAgICAgfTsKICAgICAgICAgIH0KICAgICAgICAgIGdyb3Vwc1trZXldLmNvdW50Kys7CiAgICAgICAgfQogICAgICAgIHJlc3VsdHMgPSBPYmplY3QudmFsdWVzKGdyb3Vwcykuc29ydCgoYSwgYikgPT4gYi5jb3VudCAtIGEuY291bnQpOwogICAgICB9IGVsc2UgaWYgKHN0YWdlVHlwZSA9PT0gIiRyZXBsYWNlUm9vdCIgfHwgc3RhZ2VUeXBlID09PSAiJHJlcGxhY2VXaXRoIikgewogICAgICAgIGNvbnN0IG1vZGlmaWVkID0gW107CiAgICAgICAgY29uc3QgbmV3Um9vdFNwZWMgPSBzdGFnZVR5cGUgPT09ICIkcmVwbGFjZVJvb3QiID8gc3RhZ2VTcGVjLm5ld1Jvb3QgOiBzdGFnZVNwZWM7CiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCByZXN1bHRzLmxlbmd0aDsgaisrKSB7CiAgICAgICAgICBjb25zdCBuZXdSb290ID0gZXZhbHVhdGVFeHByZXNzaW9uKG5ld1Jvb3RTcGVjLCByZXN1bHRzW2pdKTsKICAgICAgICAgIGlmICh0eXBlb2YgbmV3Um9vdCA9PT0gIm9iamVjdCIgJiYgbmV3Um9vdCAhPT0gbnVsbCAmJiAhQXJyYXkuaXNBcnJheShuZXdSb290KSkgewogICAgICAgICAgICBtb2RpZmllZC5wdXNoKG5ld1Jvb3QpOwogICAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgdGhyb3cgbmV3IFF1ZXJ5RXJyb3IoIiRyZXBsYWNlUm9vdCBleHByZXNzaW9uIG11c3QgZXZhbHVhdGUgdG8gYW4gb2JqZWN0IiwgewogICAgICAgICAgICAgIGNvbGxlY3Rpb246IHRoaXMubmFtZSwKICAgICAgICAgICAgICBjb2RlOiBFcnJvckNvZGVzLkZBSUxFRF9UT19QQVJTRQogICAgICAgICAgICB9KTsKICAgICAgICAgIH0KICAgICAgICB9CiAgICAgICAgcmVzdWx0cyA9IG1vZGlmaWVkOwogICAgICB9IGVsc2UgaWYgKHN0YWdlVHlwZSA9PT0gIiRzYW1wbGUiKSB7CiAgICAgICAgY29uc3Qgc2l6ZSA9IHN0YWdlU3BlYy5zaXplIHx8IDE7CiAgICAgICAgaWYgKHR5cGVvZiBzaXplICE9PSAibnVtYmVyIiB8fCBzaXplIDwgMCkgewogICAgICAgICAgdGhyb3cgbmV3IFF1ZXJ5RXJyb3IoIiRzYW1wbGUgc2l6ZSBtdXN0IGJlIGEgbm9uLW5lZ2F0aXZlIG51bWJlciIsIHsKICAgICAgICAgICAgY29sbGVjdGlvbjogdGhpcy5uYW1lLAogICAgICAgICAgICBjb2RlOiBFcnJvckNvZGVzLkZBSUxFRF9UT19QQVJTRQogICAgICAgICAgfSk7CiAgICAgICAgfQogICAgICAgIGNvbnN0IHNodWZmbGVkID0gWy4uLnJlc3VsdHNdOwogICAgICAgIGZvciAobGV0IGogPSBzaHVmZmxlZC5sZW5ndGggLSAxOyBqID4gMDsgai0tKSB7CiAgICAgICAgICBjb25zdCBrID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKGogKyAxKSk7CiAgICAgICAgICBbc2h1ZmZsZWRbal0sIHNodWZmbGVkW2tdXSA9IFtzaHVmZmxlZFtrXSwgc2h1ZmZsZWRbal1dOwogICAgICAgIH0KICAgICAgICByZXN1bHRzID0gc2h1ZmZsZWQuc2xpY2UoMCwgTWF0aC5taW4oc2l6ZSwgc2h1ZmZsZWQubGVuZ3RoKSk7CiAgICAgIH0gZWxzZSBpZiAoc3RhZ2VUeXBlID09PSAiJGJ1Y2tldCIpIHsKICAgICAgICBpZiAoIXN0YWdlU3BlYy5ncm91cEJ5IHx8ICFzdGFnZVNwZWMuYm91bmRhcmllcykgewogICAgICAgICAgdGhyb3cgbmV3IFF1ZXJ5RXJyb3IoIiRidWNrZXQgcmVxdWlyZXMgZ3JvdXBCeSBhbmQgYm91bmRhcmllcyIsIHsKICAgICAgICAgICAgY29sbGVjdGlvbjogdGhpcy5uYW1lLAogICAgICAgICAgICBjb2RlOiBFcnJvckNvZGVzLkZBSUxFRF9UT19QQVJTRQogICAgICAgICAgfSk7CiAgICAgICAgfQogICAgICAgIGNvbnN0IGJvdW5kYXJpZXMgPSBzdGFnZVNwZWMuYm91bmRhcmllczsKICAgICAgICBjb25zdCBkZWZhdWx0QnVja2V0ID0gc3RhZ2VTcGVjLmRlZmF1bHQ7CiAgICAgICAgY29uc3Qgb3V0cHV0ID0gc3RhZ2VTcGVjLm91dHB1dCB8fCB7IGNvdW50OiB7ICRzdW06IDEgfSB9OwogICAgICAgIGNvbnN0IGJ1Y2tldHMgPSB7fTsKICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGJvdW5kYXJpZXMubGVuZ3RoIC0gMTsgaisrKSB7CiAgICAgICAgICBjb25zdCBrZXkgPSBKU09OLnN0cmluZ2lmeShib3VuZGFyaWVzW2pdKTsKICAgICAgICAgIGJ1Y2tldHNba2V5XSA9IHsKICAgICAgICAgICAgX2lkOiBib3VuZGFyaWVzW2pdLAogICAgICAgICAgICBkb2NzOiBbXQogICAgICAgICAgfTsKICAgICAgICB9CiAgICAgICAgaWYgKGRlZmF1bHRCdWNrZXQgIT09IHZvaWQgMCkgewogICAgICAgICAgYnVja2V0c1siZGVmYXVsdCJdID0gewogICAgICAgICAgICBfaWQ6IGRlZmF1bHRCdWNrZXQsCiAgICAgICAgICAgIGRvY3M6IFtdCiAgICAgICAgICB9OwogICAgICAgIH0KICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHJlc3VsdHMubGVuZ3RoOyBqKyspIHsKICAgICAgICAgIGNvbnN0IGRvYyA9IHJlc3VsdHNbal07CiAgICAgICAgICBjb25zdCB2YWx1ZSA9IGV2YWx1YXRlRXhwcmVzc2lvbihzdGFnZVNwZWMuZ3JvdXBCeSwgZG9jKTsKICAgICAgICAgIGxldCBwbGFjZWQgPSBmYWxzZTsKICAgICAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgYm91bmRhcmllcy5sZW5ndGggLSAxOyBrKyspIHsKICAgICAgICAgICAgaWYgKHZhbHVlID49IGJvdW5kYXJpZXNba10gJiYgdmFsdWUgPCBib3VuZGFyaWVzW2sgKyAxXSkgewogICAgICAgICAgICAgIGNvbnN0IGtleSA9IEpTT04uc3RyaW5naWZ5KGJvdW5kYXJpZXNba10pOwogICAgICAgICAgICAgIGJ1Y2tldHNba2V5XS5kb2NzLnB1c2goZG9jKTsKICAgICAgICAgICAgICBwbGFjZWQgPSB0cnVlOwogICAgICAgICAgICAgIGJyZWFrOwogICAgICAgICAgICB9CiAgICAgICAgICB9CiAgICAgICAgICBpZiAoIXBsYWNlZCAmJiBkZWZhdWx0QnVja2V0ICE9PSB2b2lkIDApIHsKICAgICAgICAgICAgYnVja2V0c1siZGVmYXVsdCJdLmRvY3MucHVzaChkb2MpOwogICAgICAgICAgfQogICAgICAgIH0KICAgICAgICBjb25zdCBidWNrZXRlZCA9IFtdOwogICAgICAgIGZvciAoY29uc3QgYnVja2V0S2V5IGluIGJ1Y2tldHMpIHsKICAgICAgICAgIGNvbnN0IGJ1Y2tldCA9IGJ1Y2tldHNbYnVja2V0S2V5XTsKICAgICAgICAgIGlmIChidWNrZXQuZG9jcy5sZW5ndGggPT09IDApIGNvbnRpbnVlOwogICAgICAgICAgY29uc3QgcmVzdWx0ID0geyBfaWQ6IGJ1Y2tldC5faWQgfTsKICAgICAgICAgIGZvciAoY29uc3QgZmllbGQgaW4gb3V0cHV0KSB7CiAgICAgICAgICAgIGNvbnN0IGFjY3VtdWxhdG9yID0gb3V0cHV0W2ZpZWxkXTsKICAgICAgICAgICAgY29uc3QgYWNjS2V5cyA9IE9iamVjdC5rZXlzKGFjY3VtdWxhdG9yKTsKICAgICAgICAgICAgaWYgKGFjY0tleXMubGVuZ3RoICE9PSAxKSBjb250aW51ZTsKICAgICAgICAgICAgY29uc3QgYWNjVHlwZSA9IGFjY0tleXNbMF07CiAgICAgICAgICAgIGNvbnN0IGFjY0V4cHIgPSBhY2N1bXVsYXRvclthY2NUeXBlXTsKICAgICAgICAgICAgaWYgKGFjY1R5cGUgPT09ICIkc3VtIikgewogICAgICAgICAgICAgIGxldCBzdW0gPSAwOwogICAgICAgICAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgYnVja2V0LmRvY3MubGVuZ3RoOyBrKyspIHsKICAgICAgICAgICAgICAgIGNvbnN0IHZhbCA9IGV2YWx1YXRlRXhwcmVzc2lvbihhY2NFeHByLCBidWNrZXQuZG9jc1trXSk7CiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbCA9PT0gIm51bWJlciIpIHsKICAgICAgICAgICAgICAgICAgc3VtICs9IHZhbDsKICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsICE9PSBudWxsICYmIHZhbCAhPT0gdm9pZCAwKSB7CiAgICAgICAgICAgICAgICAgIHN1bSArPSBOdW1iZXIodmFsKSB8fCAwOwogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgIH0KICAgICAgICAgICAgICByZXN1bHRbZmllbGRdID0gc3VtOwogICAgICAgICAgICB9IGVsc2UgaWYgKGFjY1R5cGUgPT09ICIkYXZnIikgewogICAgICAgICAgICAgIGxldCBzdW0gPSAwOwogICAgICAgICAgICAgIGxldCBjb3VudCA9IDA7CiAgICAgICAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBidWNrZXQuZG9jcy5sZW5ndGg7IGsrKykgewogICAgICAgICAgICAgICAgY29uc3QgdmFsID0gZXZhbHVhdGVFeHByZXNzaW9uKGFjY0V4cHIsIGJ1Y2tldC5kb2NzW2tdKTsKICAgICAgICAgICAgICAgIGlmICh2YWwgIT09IHZvaWQgMCAmJiB2YWwgIT09IG51bGwpIHsKICAgICAgICAgICAgICAgICAgc3VtICs9IE51bWJlcih2YWwpIHx8IDA7CiAgICAgICAgICAgICAgICAgIGNvdW50Kys7CiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgfQogICAgICAgICAgICAgIHJlc3VsdFtmaWVsZF0gPSBjb3VudCA+IDAgPyBzdW0gLyBjb3VudCA6IDA7CiAgICAgICAgICAgIH0gZWxzZSBpZiAoYWNjVHlwZSA9PT0gIiRwdXNoIikgewogICAgICAgICAgICAgIGNvbnN0IGFyciA9IFtdOwogICAgICAgICAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgYnVja2V0LmRvY3MubGVuZ3RoOyBrKyspIHsKICAgICAgICAgICAgICAgIGNvbnN0IHZhbCA9IGV2YWx1YXRlRXhwcmVzc2lvbihhY2NFeHByLCBidWNrZXQuZG9jc1trXSk7CiAgICAgICAgICAgICAgICBhcnIucHVzaCh2YWwpOwogICAgICAgICAgICAgIH0KICAgICAgICAgICAgICByZXN1bHRbZmllbGRdID0gYXJyOwogICAgICAgICAgICB9IGVsc2UgaWYgKGFjY1R5cGUgPT09ICIkYWRkVG9TZXQiKSB7CiAgICAgICAgICAgICAgY29uc3Qgc2V0ID0ge307CiAgICAgICAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBidWNrZXQuZG9jcy5sZW5ndGg7IGsrKykgewogICAgICAgICAgICAgICAgY29uc3QgdmFsID0gZXZhbHVhdGVFeHByZXNzaW9uKGFjY0V4cHIsIGJ1Y2tldC5kb2NzW2tdKTsKICAgICAgICAgICAgICAgIHNldFtKU09OLnN0cmluZ2lmeSh2YWwpXSA9IHZhbDsKICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgcmVzdWx0W2ZpZWxkXSA9IE9iamVjdC52YWx1ZXMoc2V0KTsKICAgICAgICAgICAgfQogICAgICAgICAgfQogICAgICAgICAgYnVja2V0ZWQucHVzaChyZXN1bHQpOwogICAgICAgIH0KICAgICAgICByZXN1bHRzID0gYnVja2V0ZWQuc29ydCgoYSwgYikgPT4gewogICAgICAgICAgaWYgKGEuX2lkIDwgYi5faWQpIHJldHVybiAtMTsKICAgICAgICAgIGlmIChhLl9pZCA+IGIuX2lkKSByZXR1cm4gMTsKICAgICAgICAgIHJldHVybiAwOwogICAgICAgIH0pOwogICAgICB9IGVsc2UgaWYgKHN0YWdlVHlwZSA9PT0gIiRidWNrZXRBdXRvIikgewogICAgICAgIGlmICghc3RhZ2VTcGVjLmdyb3VwQnkgfHwgIXN0YWdlU3BlYy5idWNrZXRzKSB7CiAgICAgICAgICB0aHJvdyBuZXcgUXVlcnlFcnJvcigiJGJ1Y2tldEF1dG8gcmVxdWlyZXMgZ3JvdXBCeSBhbmQgYnVja2V0cyIsIHsKICAgICAgICAgICAgY29sbGVjdGlvbjogdGhpcy5uYW1lLAogICAgICAgICAgICBjb2RlOiBFcnJvckNvZGVzLkZBSUxFRF9UT19QQVJTRQogICAgICAgICAgfSk7CiAgICAgICAgfQogICAgICAgIGNvbnN0IG51bUJ1Y2tldHMgPSBzdGFnZVNwZWMuYnVja2V0czsKICAgICAgICBjb25zdCBvdXRwdXQgPSBzdGFnZVNwZWMub3V0cHV0IHx8IHsgY291bnQ6IHsgJHN1bTogMSB9IH07CiAgICAgICAgaWYgKHJlc3VsdHMubGVuZ3RoID09PSAwKSB7CiAgICAgICAgICByZXN1bHRzID0gW107CiAgICAgICAgfSBlbHNlIHsKICAgICAgICAgIGNvbnN0IHZhbHVlcyA9IHJlc3VsdHMubWFwKChkb2MpID0+ICh7CiAgICAgICAgICAgIHZhbHVlOiBldmFsdWF0ZUV4cHJlc3Npb24oc3RhZ2VTcGVjLmdyb3VwQnksIGRvYyksCiAgICAgICAgICAgIGRvYwogICAgICAgICAgfSkpLnNvcnQoKGEsIGIpID0+IHsKICAgICAgICAgICAgaWYgKGEudmFsdWUgPCBiLnZhbHVlKSByZXR1cm4gLTE7CiAgICAgICAgICAgIGlmIChhLnZhbHVlID4gYi52YWx1ZSkgcmV0dXJuIDE7CiAgICAgICAgICAgIHJldHVybiAwOwogICAgICAgICAgfSk7CiAgICAgICAgICBjb25zdCBidWNrZXRTaXplID0gTWF0aC5jZWlsKHZhbHVlcy5sZW5ndGggLyBudW1CdWNrZXRzKTsKICAgICAgICAgIGNvbnN0IGJ1Y2tldHMgPSBbXTsKICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgbnVtQnVja2V0cyAmJiBqICogYnVja2V0U2l6ZSA8IHZhbHVlcy5sZW5ndGg7IGorKykgewogICAgICAgICAgICBjb25zdCBzdGFydElkeCA9IGogKiBidWNrZXRTaXplOwogICAgICAgICAgICBjb25zdCBlbmRJZHggPSBNYXRoLm1pbigoaiArIDEpICogYnVja2V0U2l6ZSwgdmFsdWVzLmxlbmd0aCk7CiAgICAgICAgICAgIGNvbnN0IGJ1Y2tldERvY3MgPSB2YWx1ZXMuc2xpY2Uoc3RhcnRJZHgsIGVuZElkeCk7CiAgICAgICAgICAgIGlmIChidWNrZXREb2NzLmxlbmd0aCA9PT0gMCkgY29udGludWU7CiAgICAgICAgICAgIGNvbnN0IGJ1Y2tldCA9IHsKICAgICAgICAgICAgICBfaWQ6IHsKICAgICAgICAgICAgICAgIG1pbjogYnVja2V0RG9jc1swXS52YWx1ZSwKICAgICAgICAgICAgICAgIG1heDogZW5kSWR4IDwgdmFsdWVzLmxlbmd0aCA/IGJ1Y2tldERvY3NbYnVja2V0RG9jcy5sZW5ndGggLSAxXS52YWx1ZSA6IGJ1Y2tldERvY3NbYnVja2V0RG9jcy5sZW5ndGggLSAxXS52YWx1ZQogICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAgZG9jczogYnVja2V0RG9jcy5tYXAoKHYpID0+IHYuZG9jKQogICAgICAgICAgICB9OwogICAgICAgICAgICBidWNrZXRzLnB1c2goYnVja2V0KTsKICAgICAgICAgIH0KICAgICAgICAgIGNvbnN0IGJ1Y2tldGVkID0gW107CiAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGJ1Y2tldHMubGVuZ3RoOyBqKyspIHsKICAgICAgICAgICAgY29uc3QgYnVja2V0ID0gYnVja2V0c1tqXTsKICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0geyBfaWQ6IGJ1Y2tldC5faWQgfTsKICAgICAgICAgICAgZm9yIChjb25zdCBmaWVsZCBpbiBvdXRwdXQpIHsKICAgICAgICAgICAgICBjb25zdCBhY2N1bXVsYXRvciA9IG91dHB1dFtmaWVsZF07CiAgICAgICAgICAgICAgY29uc3QgYWNjS2V5cyA9IE9iamVjdC5rZXlzKGFjY3VtdWxhdG9yKTsKICAgICAgICAgICAgICBpZiAoYWNjS2V5cy5sZW5ndGggIT09IDEpIGNvbnRpbnVlOwogICAgICAgICAgICAgIGNvbnN0IGFjY1R5cGUgPSBhY2NLZXlzWzBdOwogICAgICAgICAgICAgIGNvbnN0IGFjY0V4cHIgPSBhY2N1bXVsYXRvclthY2NUeXBlXTsKICAgICAgICAgICAgICBpZiAoYWNjVHlwZSA9PT0gIiRzdW0iKSB7CiAgICAgICAgICAgICAgICBsZXQgc3VtID0gMDsKICAgICAgICAgICAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgYnVja2V0LmRvY3MubGVuZ3RoOyBrKyspIHsKICAgICAgICAgICAgICAgICAgY29uc3QgdmFsID0gZXZhbHVhdGVFeHByZXNzaW9uKGFjY0V4cHIsIGJ1Y2tldC5kb2NzW2tdKTsKICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWwgPT09ICJudW1iZXIiKSB7CiAgICAgICAgICAgICAgICAgICAgc3VtICs9IHZhbDsKICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWwgIT09IG51bGwgJiYgdmFsICE9PSB2b2lkIDApIHsKICAgICAgICAgICAgICAgICAgICBzdW0gKz0gTnVtYmVyKHZhbCkgfHwgMDsKICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgcmVzdWx0W2ZpZWxkXSA9IHN1bTsKICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFjY1R5cGUgPT09ICIkYXZnIikgewogICAgICAgICAgICAgICAgbGV0IHN1bSA9IDA7CiAgICAgICAgICAgICAgICBsZXQgY291bnQgPSAwOwogICAgICAgICAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBidWNrZXQuZG9jcy5sZW5ndGg7IGsrKykgewogICAgICAgICAgICAgICAgICBjb25zdCB2YWwgPSBldmFsdWF0ZUV4cHJlc3Npb24oYWNjRXhwciwgYnVja2V0LmRvY3Nba10pOwogICAgICAgICAgICAgICAgICBpZiAodmFsICE9PSB2b2lkIDAgJiYgdmFsICE9PSBudWxsKSB7CiAgICAgICAgICAgICAgICAgICAgc3VtICs9IE51bWJlcih2YWwpIHx8IDA7CiAgICAgICAgICAgICAgICAgICAgY291bnQrKzsKICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgcmVzdWx0W2ZpZWxkXSA9IGNvdW50ID4gMCA/IHN1bSAvIGNvdW50IDogMDsKICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFjY1R5cGUgPT09ICIkcHVzaCIpIHsKICAgICAgICAgICAgICAgIGNvbnN0IGFyciA9IFtdOwogICAgICAgICAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBidWNrZXQuZG9jcy5sZW5ndGg7IGsrKykgewogICAgICAgICAgICAgICAgICBjb25zdCB2YWwgPSBldmFsdWF0ZUV4cHJlc3Npb24oYWNjRXhwciwgYnVja2V0LmRvY3Nba10pOwogICAgICAgICAgICAgICAgICBhcnIucHVzaCh2YWwpOwogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgcmVzdWx0W2ZpZWxkXSA9IGFycjsKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0KICAgICAgICAgICAgYnVja2V0ZWQucHVzaChyZXN1bHQpOwogICAgICAgICAgfQogICAgICAgICAgcmVzdWx0cyA9IGJ1Y2tldGVkOwogICAgICAgIH0KICAgICAgfSBlbHNlIGlmIChzdGFnZVR5cGUgPT09ICIkb3V0IikgewogICAgICAgIGNvbnN0IHRhcmdldENvbGxlY3Rpb25OYW1lID0gc3RhZ2VTcGVjOwogICAgICAgIGlmICh0eXBlb2YgdGFyZ2V0Q29sbGVjdGlvbk5hbWUgIT09ICJzdHJpbmciKSB7CiAgICAgICAgICB0aHJvdyBuZXcgUXVlcnlFcnJvcigiJG91dCByZXF1aXJlcyBhIHN0cmluZyBjb2xsZWN0aW9uIG5hbWUiLCB7CiAgICAgICAgICAgIGNvbGxlY3Rpb246IHRoaXMubmFtZSwKICAgICAgICAgICAgY29kZTogRXJyb3JDb2Rlcy5GQUlMRURfVE9fUEFSU0UKICAgICAgICAgIH0pOwogICAgICAgIH0KICAgICAgICBpZiAodGhpcy5kYi5jb2xsZWN0aW9ucy5oYXModGFyZ2V0Q29sbGVjdGlvbk5hbWUpKSB7CiAgICAgICAgICBhd2FpdCB0aGlzLmRiLmRyb3BDb2xsZWN0aW9uKHRhcmdldENvbGxlY3Rpb25OYW1lKTsKICAgICAgICB9CiAgICAgICAgY29uc3QgdGFyZ2V0Q29sbGVjdGlvbiA9IHRoaXMuZGJbdGFyZ2V0Q29sbGVjdGlvbk5hbWVdOwogICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcmVzdWx0cy5sZW5ndGg7IGorKykgewogICAgICAgICAgY29uc3QgZG9jID0gcmVzdWx0c1tqXTsKICAgICAgICAgIGNvbnN0IGRvY0lkID0gZG9jLl9pZDsKICAgICAgICAgIHR5cGVvZiBkb2NJZCA9PT0gIm9iamVjdCIgJiYgZG9jSWQudG9TdHJpbmcgPyBkb2NJZC50b1N0cmluZygpIDogU3RyaW5nKGRvY0lkKTsKICAgICAgICAgIGF3YWl0IHRhcmdldENvbGxlY3Rpb24uaW5zZXJ0T25lKGRvYyk7CiAgICAgICAgfQogICAgICAgIHJlc3VsdHMgPSBbXTsKICAgICAgfSBlbHNlIGlmIChzdGFnZVR5cGUgPT09ICIkbWVyZ2UiKSB7CiAgICAgICAgbGV0IHRhcmdldENvbGxlY3Rpb25OYW1lOwogICAgICAgIGxldCBvbiA9ICJfaWQiOwogICAgICAgIGxldCB3aGVuTWF0Y2hlZCA9ICJtZXJnZSI7CiAgICAgICAgbGV0IHdoZW5Ob3RNYXRjaGVkID0gImluc2VydCI7CiAgICAgICAgaWYgKHR5cGVvZiBzdGFnZVNwZWMgPT09ICJzdHJpbmciKSB7CiAgICAgICAgICB0YXJnZXRDb2xsZWN0aW9uTmFtZSA9IHN0YWdlU3BlYzsKICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBzdGFnZVNwZWMgPT09ICJvYmplY3QiKSB7CiAgICAgICAgICB0YXJnZXRDb2xsZWN0aW9uTmFtZSA9IHN0YWdlU3BlYy5pbnRvOwogICAgICAgICAgb24gPSBzdGFnZVNwZWMub24gfHwgb247CiAgICAgICAgICB3aGVuTWF0Y2hlZCA9IHN0YWdlU3BlYy53aGVuTWF0Y2hlZCB8fCB3aGVuTWF0Y2hlZDsKICAgICAgICAgIHdoZW5Ob3RNYXRjaGVkID0gc3RhZ2VTcGVjLndoZW5Ob3RNYXRjaGVkIHx8IHdoZW5Ob3RNYXRjaGVkOwogICAgICAgIH0KICAgICAgICBpZiAoIXRhcmdldENvbGxlY3Rpb25OYW1lKSB7CiAgICAgICAgICB0aHJvdyBuZXcgUXVlcnlFcnJvcigiJG1lcmdlIHJlcXVpcmVzIGEgdGFyZ2V0IGNvbGxlY3Rpb24iLCB7CiAgICAgICAgICAgIGNvbGxlY3Rpb246IHRoaXMubmFtZSwKICAgICAgICAgICAgY29kZTogRXJyb3JDb2Rlcy5GQUlMRURfVE9fUEFSU0UKICAgICAgICAgIH0pOwogICAgICAgIH0KICAgICAgICBjb25zdCB0YXJnZXRDb2xsZWN0aW9uID0gdGhpcy5kYlt0YXJnZXRDb2xsZWN0aW9uTmFtZV07CiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCByZXN1bHRzLmxlbmd0aDsgaisrKSB7CiAgICAgICAgICBjb25zdCBkb2MgPSByZXN1bHRzW2pdOwogICAgICAgICAgY29uc3QgbWF0Y2hGaWVsZCA9IHR5cGVvZiBvbiA9PT0gInN0cmluZyIgPyBvbiA6IG9uWzBdOwogICAgICAgICAgY29uc3QgbWF0Y2hWYWx1ZSA9IGdldFByb3AoZG9jLCBtYXRjaEZpZWxkKTsKICAgICAgICAgIGNvbnN0IGV4aXN0aW5nQ3Vyc29yID0gdGFyZ2V0Q29sbGVjdGlvbi5maW5kKHsgW21hdGNoRmllbGRdOiBtYXRjaFZhbHVlIH0pOwogICAgICAgICAgYXdhaXQgZXhpc3RpbmdDdXJzb3IuX2Vuc3VyZUluaXRpYWxpemVkKCk7CiAgICAgICAgICBjb25zdCBleGlzdGluZyA9IGF3YWl0IGV4aXN0aW5nQ3Vyc29yLmhhc05leHQoKSA/IGF3YWl0IGV4aXN0aW5nQ3Vyc29yLm5leHQoKSA6IG51bGw7CiAgICAgICAgICBpZiAoZXhpc3RpbmcpIHsKICAgICAgICAgICAgaWYgKHdoZW5NYXRjaGVkID09PSAicmVwbGFjZSIpIHsKICAgICAgICAgICAgICBhd2FpdCB0YXJnZXRDb2xsZWN0aW9uLnJlcGxhY2VPbmUoeyBfaWQ6IGV4aXN0aW5nLl9pZCB9LCBkb2MpOwogICAgICAgICAgICB9IGVsc2UgaWYgKHdoZW5NYXRjaGVkID09PSAibWVyZ2UiKSB7CiAgICAgICAgICAgICAgY29uc3QgbWVyZ2VkID0gT2JqZWN0LmFzc2lnbih7fSwgZXhpc3RpbmcsIGRvYyk7CiAgICAgICAgICAgICAgYXdhaXQgdGFyZ2V0Q29sbGVjdGlvbi5yZXBsYWNlT25lKHsgX2lkOiBleGlzdGluZy5faWQgfSwgbWVyZ2VkKTsKICAgICAgICAgICAgfSBlbHNlIGlmICh3aGVuTWF0Y2hlZCA9PT0gImtlZXBFeGlzdGluZyIpIDsKICAgICAgICAgICAgZWxzZSBpZiAod2hlbk1hdGNoZWQgPT09ICJmYWlsIikgewogICAgICAgICAgICAgIHRocm93IG5ldyBRdWVyeUVycm9yKCIkbWVyZ2UgZmFpbGVkOiBkdXBsaWNhdGUga2V5IiwgewogICAgICAgICAgICAgICAgY29sbGVjdGlvbjogdGhpcy5uYW1lLAogICAgICAgICAgICAgICAgY29kZTogRXJyb3JDb2Rlcy5EVVBMSUNBVEVfS0VZCiAgICAgICAgICAgICAgfSk7CiAgICAgICAgICAgIH0KICAgICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgIGlmICh3aGVuTm90TWF0Y2hlZCA9PT0gImluc2VydCIpIHsKICAgICAgICAgICAgICBhd2FpdCB0YXJnZXRDb2xsZWN0aW9uLmluc2VydE9uZShkb2MpOwogICAgICAgICAgICB9IGVsc2UgaWYgKHdoZW5Ob3RNYXRjaGVkID09PSAiZGlzY2FyZCIpIDsKICAgICAgICAgICAgZWxzZSBpZiAod2hlbk5vdE1hdGNoZWQgPT09ICJmYWlsIikgewogICAgICAgICAgICAgIHRocm93IG5ldyBRdWVyeUVycm9yKCIkbWVyZ2UgZmFpbGVkOiBkb2N1bWVudCBub3QgZm91bmQiLCB7CiAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiB0aGlzLm5hbWUsCiAgICAgICAgICAgICAgICBjb2RlOiBFcnJvckNvZGVzLkZBSUxFRF9UT19QQVJTRQogICAgICAgICAgICAgIH0pOwogICAgICAgICAgICB9CiAgICAgICAgICB9CiAgICAgICAgfQogICAgICAgIHJlc3VsdHMgPSBbXTsKICAgICAgfSBlbHNlIGlmIChzdGFnZVR5cGUgPT09ICIkbG9va3VwIikgewogICAgICAgIGlmICghc3RhZ2VTcGVjLmZyb20gfHwgIXN0YWdlU3BlYy5sb2NhbEZpZWxkIHx8ICFzdGFnZVNwZWMuZm9yZWlnbkZpZWxkIHx8ICFzdGFnZVNwZWMuYXMpIHsKICAgICAgICAgIHRocm93IG5ldyBRdWVyeUVycm9yKCIkbG9va3VwIHJlcXVpcmVzIGZyb20sIGxvY2FsRmllbGQsIGZvcmVpZ25GaWVsZCwgYW5kIGFzIiwgewogICAgICAgICAgICBjb2xsZWN0aW9uOiB0aGlzLm5hbWUsCiAgICAgICAgICAgIGNvZGU6IEVycm9yQ29kZXMuRkFJTEVEX1RPX1BBUlNFCiAgICAgICAgICB9KTsKICAgICAgICB9CiAgICAgICAgY29uc3QgY29sbGVjdGlvbk5hbWVzID0gdGhpcy5kYi5nZXRDb2xsZWN0aW9uTmFtZXMoKTsKICAgICAgICBpZiAoIWNvbGxlY3Rpb25OYW1lcy5pbmNsdWRlcyhzdGFnZVNwZWMuZnJvbSkpIHsKICAgICAgICAgIHRocm93IG5ldyBRdWVyeUVycm9yKCIkbG9va3VwOiBjb2xsZWN0aW9uIG5vdCBmb3VuZDogIiArIHN0YWdlU3BlYy5mcm9tLCB7CiAgICAgICAgICAgIGNvbGxlY3Rpb246IHRoaXMubmFtZSwKICAgICAgICAgICAgY29kZTogRXJyb3JDb2Rlcy5OQU1FU1BBQ0VfTk9UX0ZPVU5ECiAgICAgICAgICB9KTsKICAgICAgICB9CiAgICAgICAgY29uc3QgZnJvbUNvbGxlY3Rpb24gPSB0aGlzLmRiW3N0YWdlU3BlYy5mcm9tXTsKICAgICAgICBjb25zdCBqb2luZWQgPSBbXTsKICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHJlc3VsdHMubGVuZ3RoOyBqKyspIHsKICAgICAgICAgIGNvbnN0IGRvYyA9IGNvcHkocmVzdWx0c1tqXSk7CiAgICAgICAgICBjb25zdCBsb2NhbFZhbHVlID0gZ2V0UHJvcChkb2MsIHN0YWdlU3BlYy5sb2NhbEZpZWxkKTsKICAgICAgICAgIGNvbnN0IG1hdGNoZXMyID0gW107CiAgICAgICAgICBjb25zdCBmb3JlaWduQ3Vyc29yID0gZnJvbUNvbGxlY3Rpb24uZmluZCh7IFtzdGFnZVNwZWMuZm9yZWlnbkZpZWxkXTogbG9jYWxWYWx1ZSB9KTsKICAgICAgICAgIGF3YWl0IGZvcmVpZ25DdXJzb3IuX2Vuc3VyZUluaXRpYWxpemVkKCk7CiAgICAgICAgICB3aGlsZSAoYXdhaXQgZm9yZWlnbkN1cnNvci5oYXNOZXh0KCkpIHsKICAgICAgICAgICAgbWF0Y2hlczIucHVzaChhd2FpdCBmb3JlaWduQ3Vyc29yLm5leHQoKSk7CiAgICAgICAgICB9CiAgICAgICAgICBkb2Nbc3RhZ2VTcGVjLmFzXSA9IG1hdGNoZXMyOwogICAgICAgICAgam9pbmVkLnB1c2goZG9jKTsKICAgICAgICB9CiAgICAgICAgcmVzdWx0cyA9IGpvaW5lZDsKICAgICAgfSBlbHNlIGlmIChzdGFnZVR5cGUgPT09ICIkZ3JhcGhMb29rdXAiKSB7CiAgICAgICAgaWYgKCFzdGFnZVNwZWMuZnJvbSB8fCAhc3RhZ2VTcGVjLnN0YXJ0V2l0aCB8fCAhc3RhZ2VTcGVjLmNvbm5lY3RGcm9tRmllbGQgfHwgIXN0YWdlU3BlYy5jb25uZWN0VG9GaWVsZCB8fCAhc3RhZ2VTcGVjLmFzKSB7CiAgICAgICAgICB0aHJvdyBuZXcgUXVlcnlFcnJvcigiJGdyYXBoTG9va3VwIHJlcXVpcmVzIGZyb20sIHN0YXJ0V2l0aCwgY29ubmVjdEZyb21GaWVsZCwgY29ubmVjdFRvRmllbGQsIGFuZCBhcyIsIHsKICAgICAgICAgICAgY29sbGVjdGlvbjogdGhpcy5uYW1lLAogICAgICAgICAgICBjb2RlOiBFcnJvckNvZGVzLkZBSUxFRF9UT19QQVJTRQogICAgICAgICAgfSk7CiAgICAgICAgfQogICAgICAgIGNvbnN0IGNvbGxlY3Rpb25OYW1lcyA9IHRoaXMuZGIuZ2V0Q29sbGVjdGlvbk5hbWVzKCk7CiAgICAgICAgaWYgKCFjb2xsZWN0aW9uTmFtZXMuaW5jbHVkZXMoc3RhZ2VTcGVjLmZyb20pKSB7CiAgICAgICAgICB0aHJvdyBuZXcgUXVlcnlFcnJvcigiJGdyYXBoTG9va3VwOiBjb2xsZWN0aW9uIG5vdCBmb3VuZDogIiArIHN0YWdlU3BlYy5mcm9tLCB7CiAgICAgICAgICAgIGNvbGxlY3Rpb246IHRoaXMubmFtZSwKICAgICAgICAgICAgY29kZTogRXJyb3JDb2Rlcy5OQU1FU1BBQ0VfTk9UX0ZPVU5ECiAgICAgICAgICB9KTsKICAgICAgICB9CiAgICAgICAgY29uc3QgZnJvbUNvbGxlY3Rpb24gPSB0aGlzLmRiW3N0YWdlU3BlYy5mcm9tXTsKICAgICAgICBjb25zdCBtYXhEZXB0aCA9IHN0YWdlU3BlYy5tYXhEZXB0aCAhPT0gdm9pZCAwID8gc3RhZ2VTcGVjLm1heERlcHRoIDogTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVI7CiAgICAgICAgY29uc3QgZGVwdGhGaWVsZCA9IHN0YWdlU3BlYy5kZXB0aEZpZWxkOwogICAgICAgIGNvbnN0IHJlc3RyaWN0U2VhcmNoV2l0aE1hdGNoID0gc3RhZ2VTcGVjLnJlc3RyaWN0U2VhcmNoV2l0aE1hdGNoOwogICAgICAgIGNvbnN0IGdyYXBoZWQgPSBbXTsKICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHJlc3VsdHMubGVuZ3RoOyBqKyspIHsKICAgICAgICAgIGNvbnN0IGRvYyA9IGNvcHkocmVzdWx0c1tqXSk7CiAgICAgICAgICBjb25zdCBzdGFydFZhbHVlID0gZXZhbHVhdGVFeHByZXNzaW9uKHN0YWdlU3BlYy5zdGFydFdpdGgsIHJlc3VsdHNbal0pOwogICAgICAgICAgY29uc3QgdmlzaXRlZCA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgU2V0KCk7CiAgICAgICAgICBjb25zdCBtYXRjaGVzMiA9IFtdOwogICAgICAgICAgY29uc3QgcXVldWUgPSBbeyB2YWx1ZTogc3RhcnRWYWx1ZSwgZGVwdGg6IDAgfV07CiAgICAgICAgICB3aGlsZSAocXVldWUubGVuZ3RoID4gMCkgewogICAgICAgICAgICBjb25zdCB7IHZhbHVlLCBkZXB0aCB9ID0gcXVldWUuc2hpZnQoKTsKICAgICAgICAgICAgaWYgKGRlcHRoID4gbWF4RGVwdGgpIGNvbnRpbnVlOwogICAgICAgICAgICBjb25zdCB2YWx1ZUtleSA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKTsKICAgICAgICAgICAgaWYgKHZpc2l0ZWQuaGFzKHZhbHVlS2V5KSkgY29udGludWU7CiAgICAgICAgICAgIHZpc2l0ZWQuYWRkKHZhbHVlS2V5KTsKICAgICAgICAgICAgbGV0IHF1ZXJ5ID0geyBbc3RhZ2VTcGVjLmNvbm5lY3RUb0ZpZWxkXTogdmFsdWUgfTsKICAgICAgICAgICAgaWYgKHJlc3RyaWN0U2VhcmNoV2l0aE1hdGNoKSB7CiAgICAgICAgICAgICAgcXVlcnkgPSB7ICRhbmQ6IFtxdWVyeSwgcmVzdHJpY3RTZWFyY2hXaXRoTWF0Y2hdIH07CiAgICAgICAgICAgIH0KICAgICAgICAgICAgY29uc3QgY3Vyc29yMiA9IGZyb21Db2xsZWN0aW9uLmZpbmQocXVlcnkpOwogICAgICAgICAgICBhd2FpdCBjdXJzb3IyLl9lbnN1cmVJbml0aWFsaXplZCgpOwogICAgICAgICAgICB3aGlsZSAoYXdhaXQgY3Vyc29yMi5oYXNOZXh0KCkpIHsKICAgICAgICAgICAgICBjb25zdCBtYXRjaCA9IGF3YWl0IGN1cnNvcjIubmV4dCgpOwogICAgICAgICAgICAgIGNvbnN0IG1hdGNoQ29weSA9IGNvcHkobWF0Y2gpOwogICAgICAgICAgICAgIGlmIChkZXB0aEZpZWxkKSB7CiAgICAgICAgICAgICAgICBtYXRjaENvcHlbZGVwdGhGaWVsZF0gPSBkZXB0aDsKICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgbWF0Y2hlczIucHVzaChtYXRjaENvcHkpOwogICAgICAgICAgICAgIGNvbnN0IG5leHRWYWx1ZSA9IGdldFByb3AobWF0Y2gsIHN0YWdlU3BlYy5jb25uZWN0RnJvbUZpZWxkKTsKICAgICAgICAgICAgICBpZiAobmV4dFZhbHVlICE9PSB2b2lkIDAgJiYgbmV4dFZhbHVlICE9PSBudWxsKSB7CiAgICAgICAgICAgICAgICBxdWV1ZS5wdXNoKHsgdmFsdWU6IG5leHRWYWx1ZSwgZGVwdGg6IGRlcHRoICsgMSB9KTsKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0KICAgICAgICAgIH0KICAgICAgICAgIGRvY1tzdGFnZVNwZWMuYXNdID0gbWF0Y2hlczI7CiAgICAgICAgICBncmFwaGVkLnB1c2goZG9jKTsKICAgICAgICB9CiAgICAgICAgcmVzdWx0cyA9IGdyYXBoZWQ7CiAgICAgIH0gZWxzZSBpZiAoc3RhZ2VUeXBlID09PSAiJGZhY2V0IikgewogICAgICAgIGlmICh0eXBlb2Ygc3RhZ2VTcGVjICE9PSAib2JqZWN0IiB8fCBBcnJheS5pc0FycmF5KHN0YWdlU3BlYykpIHsKICAgICAgICAgIHRocm93IG5ldyBRdWVyeUVycm9yKCIkZmFjZXQgcmVxdWlyZXMgYW4gb2JqZWN0IHdpdGggcGlwZWxpbmUgZGVmaW5pdGlvbnMiLCB7CiAgICAgICAgICAgIGNvbGxlY3Rpb246IHRoaXMubmFtZSwKICAgICAgICAgICAgY29kZTogRXJyb3JDb2Rlcy5GQUlMRURfVE9fUEFSU0UKICAgICAgICAgIH0pOwogICAgICAgIH0KICAgICAgICBjb25zdCBmYWNldFJlc3VsdCA9IHt9OwogICAgICAgIGZvciAoY29uc3QgZmFjZXROYW1lIGluIHN0YWdlU3BlYykgewogICAgICAgICAgY29uc3QgZmFjZXRQaXBlbGluZSA9IHN0YWdlU3BlY1tmYWNldE5hbWVdOwogICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGZhY2V0UGlwZWxpbmUpKSB7CiAgICAgICAgICAgIHRocm93IG5ldyBRdWVyeUVycm9yKCIkZmFjZXQgcGlwZWxpbmUgbXVzdCBiZSBhbiBhcnJheSIsIHsKICAgICAgICAgICAgICBjb2xsZWN0aW9uOiB0aGlzLm5hbWUsCiAgICAgICAgICAgICAgY29kZTogRXJyb3JDb2Rlcy5GQUlMRURfVE9fUEFSU0UKICAgICAgICAgICAgfSk7CiAgICAgICAgICB9CiAgICAgICAgICBsZXQgZmFjZXRSZXN1bHRzID0gcmVzdWx0cy5tYXAoKHIpID0+IGNvcHkocikpOwogICAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBmYWNldFBpcGVsaW5lLmxlbmd0aDsgaysrKSB7CiAgICAgICAgICAgIGNvbnN0IGZhY2V0U3RhZ2UgPSBmYWNldFBpcGVsaW5lW2tdOwogICAgICAgICAgICBjb25zdCBmYWNldFN0YWdlS2V5cyA9IE9iamVjdC5rZXlzKGZhY2V0U3RhZ2UpOwogICAgICAgICAgICBpZiAoZmFjZXRTdGFnZUtleXMubGVuZ3RoICE9PSAxKSB7CiAgICAgICAgICAgICAgdGhyb3cgbmV3IFF1ZXJ5RXJyb3IoIkVhY2ggcGlwZWxpbmUgc3RhZ2UgbXVzdCBoYXZlIGV4YWN0bHkgb25lIGtleSIsIHsKICAgICAgICAgICAgICAgIGNvbGxlY3Rpb246IHRoaXMubmFtZSwKICAgICAgICAgICAgICAgIGNvZGU6IEVycm9yQ29kZXMuRkFJTEVEX1RPX1BBUlNFCiAgICAgICAgICAgICAgfSk7CiAgICAgICAgICAgIH0KICAgICAgICAgICAgY29uc3QgZmFjZXRTdGFnZVR5cGUgPSBmYWNldFN0YWdlS2V5c1swXTsKICAgICAgICAgICAgY29uc3QgZmFjZXRTdGFnZVNwZWMgPSBmYWNldFN0YWdlW2ZhY2V0U3RhZ2VUeXBlXTsKICAgICAgICAgICAgaWYgKGZhY2V0U3RhZ2VUeXBlID09PSAiJG1hdGNoIikgewogICAgICAgICAgICAgIGNvbnN0IG1hdGNoZWQgPSBbXTsKICAgICAgICAgICAgICBmb3IgKGxldCBtID0gMDsgbSA8IGZhY2V0UmVzdWx0cy5sZW5ndGg7IG0rKykgewogICAgICAgICAgICAgICAgaWYgKG1hdGNoZXMoZmFjZXRSZXN1bHRzW21dLCBmYWNldFN0YWdlU3BlYykpIHsKICAgICAgICAgICAgICAgICAgbWF0Y2hlZC5wdXNoKGZhY2V0UmVzdWx0c1ttXSk7CiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgfQogICAgICAgICAgICAgIGZhY2V0UmVzdWx0cyA9IG1hdGNoZWQ7CiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmFjZXRTdGFnZVR5cGUgPT09ICIkcHJvamVjdCIpIHsKICAgICAgICAgICAgICBjb25zdCBwcm9qZWN0ZWQgPSBbXTsKICAgICAgICAgICAgICBmb3IgKGxldCBtID0gMDsgbSA8IGZhY2V0UmVzdWx0cy5sZW5ndGg7IG0rKykgewogICAgICAgICAgICAgICAgcHJvamVjdGVkLnB1c2goYXBwbHlQcm9qZWN0aW9uV2l0aEV4cHJlc3Npb25zKGZhY2V0U3RhZ2VTcGVjLCBmYWNldFJlc3VsdHNbbV0pKTsKICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgZmFjZXRSZXN1bHRzID0gcHJvamVjdGVkOwogICAgICAgICAgICB9IGVsc2UgaWYgKGZhY2V0U3RhZ2VUeXBlID09PSAiJGxpbWl0IikgewogICAgICAgICAgICAgIGZhY2V0UmVzdWx0cyA9IGZhY2V0UmVzdWx0cy5zbGljZSgwLCBmYWNldFN0YWdlU3BlYyk7CiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmFjZXRTdGFnZVR5cGUgPT09ICIkc2tpcCIpIHsKICAgICAgICAgICAgICBmYWNldFJlc3VsdHMgPSBmYWNldFJlc3VsdHMuc2xpY2UoZmFjZXRTdGFnZVNwZWMpOwogICAgICAgICAgICB9IGVsc2UgaWYgKGZhY2V0U3RhZ2VUeXBlID09PSAiJHNvcnQiKSB7CiAgICAgICAgICAgICAgY29uc3Qgc29ydEtleXMgPSBPYmplY3Qua2V5cyhmYWNldFN0YWdlU3BlYyk7CiAgICAgICAgICAgICAgZmFjZXRSZXN1bHRzLnNvcnQoZnVuY3Rpb24oYSwgYikgewogICAgICAgICAgICAgICAgZm9yIChsZXQgbiA9IDA7IG4gPCBzb3J0S2V5cy5sZW5ndGg7IG4rKykgewogICAgICAgICAgICAgICAgICBjb25zdCBrZXkgPSBzb3J0S2V5c1tuXTsKICAgICAgICAgICAgICAgICAgaWYgKGFba2V5XSA9PT0gdm9pZCAwICYmIGJba2V5XSAhPT0gdm9pZCAwKSByZXR1cm4gLTEgKiBmYWNldFN0YWdlU3BlY1trZXldOwogICAgICAgICAgICAgICAgICBpZiAoYVtrZXldICE9PSB2b2lkIDAgJiYgYltrZXldID09PSB2b2lkIDApIHJldHVybiAxICogZmFjZXRTdGFnZVNwZWNba2V5XTsKICAgICAgICAgICAgICAgICAgaWYgKGFba2V5XSA8IGJba2V5XSkgcmV0dXJuIC0xICogZmFjZXRTdGFnZVNwZWNba2V5XTsKICAgICAgICAgICAgICAgICAgaWYgKGFba2V5XSA+IGJba2V5XSkgcmV0dXJuIDEgKiBmYWNldFN0YWdlU3BlY1trZXldOwogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgcmV0dXJuIDA7CiAgICAgICAgICAgICAgfSk7CiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmFjZXRTdGFnZVR5cGUgPT09ICIkY291bnQiKSB7CiAgICAgICAgICAgICAgZmFjZXRSZXN1bHRzID0gW3sgW2ZhY2V0U3RhZ2VTcGVjXTogZmFjZXRSZXN1bHRzLmxlbmd0aCB9XTsKICAgICAgICAgICAgfSBlbHNlIGlmIChmYWNldFN0YWdlVHlwZSA9PT0gIiRncm91cCIpIHsKICAgICAgICAgICAgICBjb25zdCBncm91cHMgPSB7fTsKICAgICAgICAgICAgICBjb25zdCBncm91cElkID0gZmFjZXRTdGFnZVNwZWMuX2lkOwogICAgICAgICAgICAgIGZvciAobGV0IG0gPSAwOyBtIDwgZmFjZXRSZXN1bHRzLmxlbmd0aDsgbSsrKSB7CiAgICAgICAgICAgICAgICBjb25zdCBkb2MgPSBmYWNldFJlc3VsdHNbbV07CiAgICAgICAgICAgICAgICBsZXQga2V5OwogICAgICAgICAgICAgICAgaWYgKGdyb3VwSWQgPT09IG51bGwgfHwgZ3JvdXBJZCA9PT0gdm9pZCAwKSB7CiAgICAgICAgICAgICAgICAgIGtleSA9IG51bGw7CiAgICAgICAgICAgICAgICB9IGVsc2UgewogICAgICAgICAgICAgICAgICBrZXkgPSBldmFsdWF0ZUV4cHJlc3Npb24oZ3JvdXBJZCwgZG9jKTsKICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIGNvbnN0IGtleVN0ciA9IEpTT04uc3RyaW5naWZ5KGtleSk7CiAgICAgICAgICAgICAgICBpZiAoIWdyb3Vwc1trZXlTdHJdKSB7CiAgICAgICAgICAgICAgICAgIGdyb3Vwc1trZXlTdHJdID0gewogICAgICAgICAgICAgICAgICAgIF9pZDoga2V5LAogICAgICAgICAgICAgICAgICAgIGRvY3M6IFtdLAogICAgICAgICAgICAgICAgICAgIGFjY3VtdWxhdG9yczoge30KICAgICAgICAgICAgICAgICAgfTsKICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIGdyb3Vwc1trZXlTdHJdLmRvY3MucHVzaChkb2MpOwogICAgICAgICAgICAgIH0KICAgICAgICAgICAgICBjb25zdCBncm91cGVkID0gW107CiAgICAgICAgICAgICAgZm9yIChjb25zdCBncm91cEtleSBpbiBncm91cHMpIHsKICAgICAgICAgICAgICAgIGNvbnN0IGdyb3VwID0gZ3JvdXBzW2dyb3VwS2V5XTsKICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHsgX2lkOiBncm91cC5faWQgfTsKICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZmllbGQgaW4gZmFjZXRTdGFnZVNwZWMpIHsKICAgICAgICAgICAgICAgICAgaWYgKGZpZWxkID09PSAiX2lkIikgY29udGludWU7CiAgICAgICAgICAgICAgICAgIGNvbnN0IGFjY3VtdWxhdG9yID0gZmFjZXRTdGFnZVNwZWNbZmllbGRdOwogICAgICAgICAgICAgICAgICBjb25zdCBhY2NLZXlzID0gT2JqZWN0LmtleXMoYWNjdW11bGF0b3IpOwogICAgICAgICAgICAgICAgICBpZiAoYWNjS2V5cy5sZW5ndGggIT09IDEpIGNvbnRpbnVlOwogICAgICAgICAgICAgICAgICBjb25zdCBhY2NUeXBlID0gYWNjS2V5c1swXTsKICAgICAgICAgICAgICAgICAgY29uc3QgYWNjRXhwciA9IGFjY3VtdWxhdG9yW2FjY1R5cGVdOwogICAgICAgICAgICAgICAgICBpZiAoYWNjVHlwZSA9PT0gIiRzdW0iKSB7CiAgICAgICAgICAgICAgICAgICAgbGV0IHN1bSA9IDA7CiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgbiA9IDA7IG4gPCBncm91cC5kb2NzLmxlbmd0aDsgbisrKSB7CiAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWwgPSBldmFsdWF0ZUV4cHJlc3Npb24oYWNjRXhwciwgZ3JvdXAuZG9jc1tuXSk7CiAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbCA9PT0gIm51bWJlciIpIHsKICAgICAgICAgICAgICAgICAgICAgICAgc3VtICs9IHZhbDsKICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsICE9PSBudWxsICYmIHZhbCAhPT0gdm9pZCAwKSB7CiAgICAgICAgICAgICAgICAgICAgICAgIHN1bSArPSBOdW1iZXIodmFsKSB8fCAwOwogICAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgICAgICByZXN1bHRbZmllbGRdID0gc3VtOwogICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFjY1R5cGUgPT09ICIkYXZnIikgewogICAgICAgICAgICAgICAgICAgIGxldCBzdW0gPSAwOwogICAgICAgICAgICAgICAgICAgIGxldCBjb3VudCA9IDA7CiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgbiA9IDA7IG4gPCBncm91cC5kb2NzLmxlbmd0aDsgbisrKSB7CiAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWwgPSBldmFsdWF0ZUV4cHJlc3Npb24oYWNjRXhwciwgZ3JvdXAuZG9jc1tuXSk7CiAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsICE9PSB2b2lkIDAgJiYgdmFsICE9PSBudWxsKSB7CiAgICAgICAgICAgICAgICAgICAgICAgIHN1bSArPSBOdW1iZXIodmFsKSB8fCAwOwogICAgICAgICAgICAgICAgICAgICAgICBjb3VudCsrOwogICAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgICAgICByZXN1bHRbZmllbGRdID0gY291bnQgPiAwID8gc3VtIC8gY291bnQgOiAwOwogICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFjY1R5cGUgPT09ICIkbWF4IikgewogICAgICAgICAgICAgICAgICAgIGxldCBtYXggPSB2b2lkIDA7CiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgbiA9IDA7IG4gPCBncm91cC5kb2NzLmxlbmd0aDsgbisrKSB7CiAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWwgPSBldmFsdWF0ZUV4cHJlc3Npb24oYWNjRXhwciwgZ3JvdXAuZG9jc1tuXSk7CiAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsICE9PSB2b2lkIDAgJiYgKG1heCA9PT0gdm9pZCAwIHx8IHZhbCA+IG1heCkpIHsKICAgICAgICAgICAgICAgICAgICAgICAgbWF4ID0gdmFsOwogICAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgICAgICByZXN1bHRbZmllbGRdID0gbWF4OwogICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICBncm91cGVkLnB1c2gocmVzdWx0KTsKICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgZmFjZXRSZXN1bHRzID0gZ3JvdXBlZDsKICAgICAgICAgICAgfSBlbHNlIGlmIChmYWNldFN0YWdlVHlwZSA9PT0gIiRzb3J0QnlDb3VudCIpIHsKICAgICAgICAgICAgICBjb25zdCBncm91cHMgPSB7fTsKICAgICAgICAgICAgICBmb3IgKGxldCBtID0gMDsgbSA8IGZhY2V0UmVzdWx0cy5sZW5ndGg7IG0rKykgewogICAgICAgICAgICAgICAgY29uc3QgZG9jID0gZmFjZXRSZXN1bHRzW21dOwogICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBldmFsdWF0ZUV4cHJlc3Npb24oZmFjZXRTdGFnZVNwZWMsIGRvYyk7CiAgICAgICAgICAgICAgICBjb25zdCBrZXkgPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7CiAgICAgICAgICAgICAgICBpZiAoIWdyb3Vwc1trZXldKSB7CiAgICAgICAgICAgICAgICAgIGdyb3Vwc1trZXldID0gewogICAgICAgICAgICAgICAgICAgIF9pZDogdmFsdWUsCiAgICAgICAgICAgICAgICAgICAgY291bnQ6IDAKICAgICAgICAgICAgICAgICAgfTsKICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIGdyb3Vwc1trZXldLmNvdW50Kys7CiAgICAgICAgICAgICAgfQogICAgICAgICAgICAgIGZhY2V0UmVzdWx0cyA9IE9iamVjdC52YWx1ZXMoZ3JvdXBzKS5zb3J0KChhLCBiKSA9PiBiLmNvdW50IC0gYS5jb3VudCk7CiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmFjZXRTdGFnZVR5cGUgPT09ICIkc2FtcGxlIikgewogICAgICAgICAgICAgIGNvbnN0IHNpemUgPSBmYWNldFN0YWdlU3BlYy5zaXplIHx8IDE7CiAgICAgICAgICAgICAgY29uc3Qgc2h1ZmZsZWQgPSBbLi4uZmFjZXRSZXN1bHRzXTsKICAgICAgICAgICAgICBmb3IgKGxldCBtID0gc2h1ZmZsZWQubGVuZ3RoIC0gMTsgbSA+IDA7IG0tLSkgewogICAgICAgICAgICAgICAgY29uc3QgazIgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobSArIDEpKTsKICAgICAgICAgICAgICAgIFtzaHVmZmxlZFttXSwgc2h1ZmZsZWRbazJdXSA9IFtzaHVmZmxlZFtrMl0sIHNodWZmbGVkW21dXTsKICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgZmFjZXRSZXN1bHRzID0gc2h1ZmZsZWQuc2xpY2UoMCwgTWF0aC5taW4oc2l6ZSwgc2h1ZmZsZWQubGVuZ3RoKSk7CiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmFjZXRTdGFnZVR5cGUgPT09ICIkYnVja2V0IikgewogICAgICAgICAgICAgIGNvbnN0IGJvdW5kYXJpZXMgPSBmYWNldFN0YWdlU3BlYy5ib3VuZGFyaWVzOwogICAgICAgICAgICAgIGNvbnN0IGRlZmF1bHRCdWNrZXQgPSBmYWNldFN0YWdlU3BlYy5kZWZhdWx0OwogICAgICAgICAgICAgIGNvbnN0IG91dHB1dCA9IGZhY2V0U3RhZ2VTcGVjLm91dHB1dCB8fCB7IGNvdW50OiB7ICRzdW06IDEgfSB9OwogICAgICAgICAgICAgIGNvbnN0IGJ1Y2tldHMgPSB7fTsKICAgICAgICAgICAgICBmb3IgKGxldCBtID0gMDsgbSA8IGJvdW5kYXJpZXMubGVuZ3RoIC0gMTsgbSsrKSB7CiAgICAgICAgICAgICAgICBjb25zdCBrZXkgPSBKU09OLnN0cmluZ2lmeShib3VuZGFyaWVzW21dKTsKICAgICAgICAgICAgICAgIGJ1Y2tldHNba2V5XSA9IHsKICAgICAgICAgICAgICAgICAgX2lkOiBib3VuZGFyaWVzW21dLAogICAgICAgICAgICAgICAgICBkb2NzOiBbXQogICAgICAgICAgICAgICAgfTsKICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgaWYgKGRlZmF1bHRCdWNrZXQgIT09IHZvaWQgMCkgewogICAgICAgICAgICAgICAgYnVja2V0c1siZGVmYXVsdCJdID0gewogICAgICAgICAgICAgICAgICBfaWQ6IGRlZmF1bHRCdWNrZXQsCiAgICAgICAgICAgICAgICAgIGRvY3M6IFtdCiAgICAgICAgICAgICAgICB9OwogICAgICAgICAgICAgIH0KICAgICAgICAgICAgICBmb3IgKGxldCBtID0gMDsgbSA8IGZhY2V0UmVzdWx0cy5sZW5ndGg7IG0rKykgewogICAgICAgICAgICAgICAgY29uc3QgZG9jID0gZmFjZXRSZXN1bHRzW21dOwogICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBldmFsdWF0ZUV4cHJlc3Npb24oZmFjZXRTdGFnZVNwZWMuZ3JvdXBCeSwgZG9jKTsKICAgICAgICAgICAgICAgIGxldCBwbGFjZWQgPSBmYWxzZTsKICAgICAgICAgICAgICAgIGZvciAobGV0IG4gPSAwOyBuIDwgYm91bmRhcmllcy5sZW5ndGggLSAxOyBuKyspIHsKICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID49IGJvdW5kYXJpZXNbbl0gJiYgdmFsdWUgPCBib3VuZGFyaWVzW24gKyAxXSkgewogICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleSA9IEpTT04uc3RyaW5naWZ5KGJvdW5kYXJpZXNbbl0pOwogICAgICAgICAgICAgICAgICAgIGJ1Y2tldHNba2V5XS5kb2NzLnB1c2goZG9jKTsKICAgICAgICAgICAgICAgICAgICBwbGFjZWQgPSB0cnVlOwogICAgICAgICAgICAgICAgICAgIGJyZWFrOwogICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICBpZiAoIXBsYWNlZCAmJiBkZWZhdWx0QnVja2V0ICE9PSB2b2lkIDApIHsKICAgICAgICAgICAgICAgICAgYnVja2V0c1siZGVmYXVsdCJdLmRvY3MucHVzaChkb2MpOwogICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgIH0KICAgICAgICAgICAgICBjb25zdCBidWNrZXRlZCA9IFtdOwogICAgICAgICAgICAgIGZvciAoY29uc3QgYnVja2V0S2V5IGluIGJ1Y2tldHMpIHsKICAgICAgICAgICAgICAgIGNvbnN0IGJ1Y2tldCA9IGJ1Y2tldHNbYnVja2V0S2V5XTsKICAgICAgICAgICAgICAgIGlmIChidWNrZXQuZG9jcy5sZW5ndGggPT09IDApIGNvbnRpbnVlOwogICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0geyBfaWQ6IGJ1Y2tldC5faWQgfTsKICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZmllbGQgaW4gb3V0cHV0KSB7CiAgICAgICAgICAgICAgICAgIGNvbnN0IGFjY3VtdWxhdG9yID0gb3V0cHV0W2ZpZWxkXTsKICAgICAgICAgICAgICAgICAgY29uc3QgYWNjS2V5cyA9IE9iamVjdC5rZXlzKGFjY3VtdWxhdG9yKTsKICAgICAgICAgICAgICAgICAgaWYgKGFjY0tleXMubGVuZ3RoICE9PSAxKSBjb250aW51ZTsKICAgICAgICAgICAgICAgICAgY29uc3QgYWNjVHlwZSA9IGFjY0tleXNbMF07CiAgICAgICAgICAgICAgICAgIGNvbnN0IGFjY0V4cHIgPSBhY2N1bXVsYXRvclthY2NUeXBlXTsKICAgICAgICAgICAgICAgICAgaWYgKGFjY1R5cGUgPT09ICIkc3VtIikgewogICAgICAgICAgICAgICAgICAgIGxldCBzdW0gPSAwOwogICAgICAgICAgICAgICAgICAgIGZvciAobGV0IG4gPSAwOyBuIDwgYnVja2V0LmRvY3MubGVuZ3RoOyBuKyspIHsKICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbCA9IGV2YWx1YXRlRXhwcmVzc2lvbihhY2NFeHByLCBidWNrZXQuZG9jc1tuXSk7CiAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbCA9PT0gIm51bWJlciIpIHsKICAgICAgICAgICAgICAgICAgICAgICAgc3VtICs9IHZhbDsKICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsICE9PSBudWxsICYmIHZhbCAhPT0gdm9pZCAwKSB7CiAgICAgICAgICAgICAgICAgICAgICAgIHN1bSArPSBOdW1iZXIodmFsKSB8fCAwOwogICAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgICAgICByZXN1bHRbZmllbGRdID0gc3VtOwogICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICBidWNrZXRlZC5wdXNoKHJlc3VsdCk7CiAgICAgICAgICAgICAgfQogICAgICAgICAgICAgIGZhY2V0UmVzdWx0cyA9IGJ1Y2tldGVkLnNvcnQoKGEsIGIpID0+IHsKICAgICAgICAgICAgICAgIGlmIChhLl9pZCA8IGIuX2lkKSByZXR1cm4gLTE7CiAgICAgICAgICAgICAgICBpZiAoYS5faWQgPiBiLl9pZCkgcmV0dXJuIDE7CiAgICAgICAgICAgICAgICByZXR1cm4gMDsKICAgICAgICAgICAgICB9KTsKICAgICAgICAgICAgfQogICAgICAgICAgfQogICAgICAgICAgZmFjZXRSZXN1bHRbZmFjZXROYW1lXSA9IGZhY2V0UmVzdWx0czsKICAgICAgICB9CiAgICAgICAgcmVzdWx0cyA9IFtmYWNldFJlc3VsdF07CiAgICAgIH0gZWxzZSBpZiAoc3RhZ2VUeXBlID09PSAiJHJlZGFjdCIpIHsKICAgICAgICBjb25zdCByZWRhY3RlZCA9IFtdOwogICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcmVzdWx0cy5sZW5ndGg7IGorKykgewogICAgICAgICAgY29uc3QgZG9jID0gcmVzdWx0c1tqXTsKICAgICAgICAgIGNvbnN0IGRlY2lzaW9uID0gZXZhbHVhdGVFeHByZXNzaW9uKHN0YWdlU3BlYywgZG9jKTsKICAgICAgICAgIGlmIChkZWNpc2lvbiA9PT0gIiQkREVTQ0VORCIpIHsKICAgICAgICAgICAgcmVkYWN0ZWQucHVzaChkb2MpOwogICAgICAgICAgfSBlbHNlIGlmIChkZWNpc2lvbiA9PT0gIiQkUFJVTkUiKSB7CiAgICAgICAgICAgIGNvbnRpbnVlOwogICAgICAgICAgfSBlbHNlIGlmIChkZWNpc2lvbiA9PT0gIiQkS0VFUCIpIHsKICAgICAgICAgICAgcmVkYWN0ZWQucHVzaChkb2MpOwogICAgICAgICAgfSBlbHNlIHsKICAgICAgICAgICAgaWYgKGRlY2lzaW9uKSB7CiAgICAgICAgICAgICAgcmVkYWN0ZWQucHVzaChkb2MpOwogICAgICAgICAgICB9CiAgICAgICAgICB9CiAgICAgICAgfQogICAgICAgIHJlc3VsdHMgPSByZWRhY3RlZDsKICAgICAgfSBlbHNlIGlmIChzdGFnZVR5cGUgPT09ICIkZ2VvTmVhciIpIHsKICAgICAgICBpZiAoIXN0YWdlU3BlYy5uZWFyIHx8ICFzdGFnZVNwZWMuZGlzdGFuY2VGaWVsZCkgewogICAgICAgICAgdGhyb3cgbmV3IFF1ZXJ5RXJyb3IoIiRnZW9OZWFyIHJlcXVpcmVzIG5lYXIgYW5kIGRpc3RhbmNlRmllbGQiLCB7CiAgICAgICAgICAgIGNvbGxlY3Rpb246IHRoaXMubmFtZSwKICAgICAgICAgICAgY29kZTogRXJyb3JDb2Rlcy5GQUlMRURfVE9fUEFSU0UKICAgICAgICAgIH0pOwogICAgICAgIH0KICAgICAgICBjb25zdCBuZWFyID0gc3RhZ2VTcGVjLm5lYXI7CiAgICAgICAgY29uc3QgZGlzdGFuY2VGaWVsZCA9IHN0YWdlU3BlYy5kaXN0YW5jZUZpZWxkOwogICAgICAgIGNvbnN0IG1heERpc3RhbmNlID0gc3RhZ2VTcGVjLm1heERpc3RhbmNlOwogICAgICAgIGNvbnN0IG1pbkRpc3RhbmNlID0gc3RhZ2VTcGVjLm1pbkRpc3RhbmNlIHx8IDA7CiAgICAgICAgY29uc3Qgc3BoZXJpY2FsID0gc3RhZ2VTcGVjLnNwaGVyaWNhbCAhPT0gZmFsc2U7CiAgICAgICAgY29uc3Qga2V5ID0gc3RhZ2VTcGVjLmtleSB8fCAibG9jYXRpb24iOwogICAgICAgIGNvbnN0IHdpdGhEaXN0YW5jZXMgPSBbXTsKICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHJlc3VsdHMubGVuZ3RoOyBqKyspIHsKICAgICAgICAgIGNvbnN0IGRvYyA9IGNvcHkocmVzdWx0c1tqXSk7CiAgICAgICAgICBjb25zdCBsb2NhdGlvbiA9IGdldFByb3AoZG9jLCBrZXkpOwogICAgICAgICAgaWYgKCFsb2NhdGlvbiB8fCAhQXJyYXkuaXNBcnJheShsb2NhdGlvbikgfHwgbG9jYXRpb24ubGVuZ3RoIDwgMikgewogICAgICAgICAgICBjb250aW51ZTsKICAgICAgICAgIH0KICAgICAgICAgIGxldCBkaXN0YW5jZTsKICAgICAgICAgIGlmIChzcGhlcmljYWwpIHsKICAgICAgICAgICAgY29uc3QgUiA9IDYzNzFlMzsKICAgICAgICAgICAgY29uc3QgbGF0MSA9IG5lYXJbMV0gKiBNYXRoLlBJIC8gMTgwOwogICAgICAgICAgICBjb25zdCBsYXQyID0gbG9jYXRpb25bMV0gKiBNYXRoLlBJIC8gMTgwOwogICAgICAgICAgICBjb25zdCBkZWx0YUxhdCA9IChsb2NhdGlvblsxXSAtIG5lYXJbMV0pICogTWF0aC5QSSAvIDE4MDsKICAgICAgICAgICAgY29uc3QgZGVsdGFMb24gPSAobG9jYXRpb25bMF0gLSBuZWFyWzBdKSAqIE1hdGguUEkgLyAxODA7CiAgICAgICAgICAgIGNvbnN0IGEgPSBNYXRoLnNpbihkZWx0YUxhdCAvIDIpICogTWF0aC5zaW4oZGVsdGFMYXQgLyAyKSArIE1hdGguY29zKGxhdDEpICogTWF0aC5jb3MobGF0MikgKiBNYXRoLnNpbihkZWx0YUxvbiAvIDIpICogTWF0aC5zaW4oZGVsdGFMb24gLyAyKTsKICAgICAgICAgICAgY29uc3QgYyA9IDIgKiBNYXRoLmF0YW4yKE1hdGguc3FydChhKSwgTWF0aC5zcXJ0KDEgLSBhKSk7CiAgICAgICAgICAgIGRpc3RhbmNlID0gUiAqIGM7CiAgICAgICAgICB9IGVsc2UgewogICAgICAgICAgICBjb25zdCBkeCA9IGxvY2F0aW9uWzBdIC0gbmVhclswXTsKICAgICAgICAgICAgY29uc3QgZHkgPSBsb2NhdGlvblsxXSAtIG5lYXJbMV07CiAgICAgICAgICAgIGRpc3RhbmNlID0gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTsKICAgICAgICAgIH0KICAgICAgICAgIGlmIChkaXN0YW5jZSA+PSBtaW5EaXN0YW5jZSAmJiAoIW1heERpc3RhbmNlIHx8IGRpc3RhbmNlIDw9IG1heERpc3RhbmNlKSkgewogICAgICAgICAgICBkb2NbZGlzdGFuY2VGaWVsZF0gPSBkaXN0YW5jZTsKICAgICAgICAgICAgd2l0aERpc3RhbmNlcy5wdXNoKGRvYyk7CiAgICAgICAgICB9CiAgICAgICAgfQogICAgICAgIHdpdGhEaXN0YW5jZXMuc29ydCgoYSwgYikgPT4gYVtkaXN0YW5jZUZpZWxkXSAtIGJbZGlzdGFuY2VGaWVsZF0pOwogICAgICAgIGlmIChzdGFnZVNwZWMubGltaXQpIHsKICAgICAgICAgIHJlc3VsdHMgPSB3aXRoRGlzdGFuY2VzLnNsaWNlKDAsIHN0YWdlU3BlYy5saW1pdCk7CiAgICAgICAgfSBlbHNlIHsKICAgICAgICAgIHJlc3VsdHMgPSB3aXRoRGlzdGFuY2VzOwogICAgICAgIH0KICAgICAgfSBlbHNlIHsKICAgICAgICB0aHJvdyBuZXcgUXVlcnlFcnJvcigiVW5zdXBwb3J0ZWQgYWdncmVnYXRpb24gc3RhZ2U6ICIgKyBzdGFnZVR5cGUsIHsKICAgICAgICAgIGNvbGxlY3Rpb246IHRoaXMubmFtZSwKICAgICAgICAgIGNvZGU6IEVycm9yQ29kZXMuRkFJTEVEX1RPX1BBUlNFCiAgICAgICAgfSk7CiAgICAgIH0KICAgIH0KICAgIHJldHVybiByZXN1bHRzOwogIH0KICBhc3luYyBidWxrV3JpdGUoKSB7CiAgICB0aHJvdyBuZXcgTm90SW1wbGVtZW50ZWRFcnJvcigiYnVsa1dyaXRlIiwgeyBjb2xsZWN0aW9uOiB0aGlzLm5hbWUgfSk7CiAgfQogIGFzeW5jIGNvdW50KCkgewogICAgaWYgKCF0aGlzLl9pbml0aWFsaXplZCkgYXdhaXQgdGhpcy5faW5pdGlhbGl6ZSgpOwogICAgbGV0IGNvdW50ID0gMDsKICAgIGZvciBhd2FpdCAoY29uc3QgXyBvZiB0aGlzLmRvY3VtZW50cykgewogICAgICBjb3VudCsrOwogICAgfQogICAgcmV0dXJuIGNvdW50OwogIH0KICBhc3luYyBjb3B5VG8oZGVzdENvbGxlY3Rpb25OYW1lKSB7CiAgICB0aGlzLmRiLmNyZWF0ZUNvbGxlY3Rpb24oZGVzdENvbGxlY3Rpb25OYW1lKTsKICAgIGNvbnN0IGRlc3RDb2wgPSB0aGlzLmRiLmdldENvbGxlY3Rpb24oZGVzdENvbGxlY3Rpb25OYW1lKTsKICAgIGxldCBudW1Db3BpZWQgPSAwOwogICAgY29uc3QgYyA9IHRoaXMuZmluZCh7fSk7CiAgICBhd2FpdCBjLl9lbnN1cmVJbml0aWFsaXplZCgpOwogICAgd2hpbGUgKGF3YWl0IGMuaGFzTmV4dCgpKSB7CiAgICAgIGF3YWl0IGRlc3RDb2wuaW5zZXJ0T25lKGF3YWl0IGMubmV4dCgpKTsKICAgICAgbnVtQ29waWVkKys7CiAgICB9CiAgICByZXR1cm4gbnVtQ29waWVkOwogIH0KICBhc3luYyBjcmVhdGVJbmRleChrZXlzLCBvcHRpb25zKSB7CiAgICBpZiAoIXRoaXMuX2luaXRpYWxpemVkKSBhd2FpdCB0aGlzLl9pbml0aWFsaXplKCk7CiAgICBpZiAoIWtleXMgfHwgdHlwZW9mIGtleXMgIT09ICJvYmplY3QiIHx8IEFycmF5LmlzQXJyYXkoa2V5cykpIHsKICAgICAgdGhyb3cgbmV3IEJhZFZhbHVlRXJyb3IoImtleXMiLCBrZXlzLCAiY3JlYXRlSW5kZXggcmVxdWlyZXMgYSBrZXkgc3BlY2lmaWNhdGlvbiBvYmplY3QiLCB7CiAgICAgICAgY29sbGVjdGlvbjogdGhpcy5uYW1lCiAgICAgIH0pOwogICAgfQogICAgY29uc3QgaW5kZXhOYW1lID0gb3B0aW9ucyAmJiBvcHRpb25zLm5hbWUgPyBvcHRpb25zLm5hbWUgOiB0aGlzLmdlbmVyYXRlSW5kZXhOYW1lKGtleXMpOwogICAgaWYgKHRoaXMuaW5kZXhlcy5oYXMoaW5kZXhOYW1lKSkgewogICAgICBjb25zdCBleGlzdGluZ0luZGV4ID0gdGhpcy5pbmRleGVzLmdldChpbmRleE5hbWUpOwogICAgICBjb25zdCBleGlzdGluZ0tleXMgPSBKU09OLnN0cmluZ2lmeShleGlzdGluZ0luZGV4LmtleXMpOwogICAgICBjb25zdCBuZXdLZXlzID0gSlNPTi5zdHJpbmdpZnkoa2V5cyk7CiAgICAgIGlmIChleGlzdGluZ0tleXMgIT09IG5ld0tleXMpIHsKICAgICAgICB0aHJvdyBuZXcgSW5kZXhFcnJvcigKICAgICAgICAgICJJbmRleCB3aXRoIG5hbWUgJyIgKyBpbmRleE5hbWUgKyAiJyBhbHJlYWR5IGV4aXN0cyB3aXRoIGEgZGlmZmVyZW50IGtleSBzcGVjaWZpY2F0aW9uIiwKICAgICAgICAgIHsKICAgICAgICAgICAgY29kZTogRXJyb3JDb2Rlcy5JTkRFWF9PUFRJT05TX0NPTkZMSUNULAogICAgICAgICAgICBpbmRleDogaW5kZXhOYW1lLAogICAgICAgICAgICBjb2xsZWN0aW9uOiB0aGlzLm5hbWUKICAgICAgICAgIH0KICAgICAgICApOwogICAgICB9CiAgICAgIHJldHVybiBpbmRleE5hbWU7CiAgICB9CiAgICBhd2FpdCB0aGlzLl9idWlsZEluZGV4KGluZGV4TmFtZSwga2V5cywgb3B0aW9ucyk7CiAgICByZXR1cm4gaW5kZXhOYW1lOwogIH0KICBkYXRhU2l6ZSgpIHsKICAgIHRocm93IG5ldyBOb3RJbXBsZW1lbnRlZEVycm9yKCJkYXRhU2l6ZSIsIHsgY29sbGVjdGlvbjogdGhpcy5uYW1lIH0pOwogIH0KICBhc3luYyBkZWxldGVPbmUocXVlcnkpIHsKICAgIGNvbnN0IGRvYyA9IGF3YWl0IHRoaXMuZmluZE9uZShxdWVyeSk7CiAgICBpZiAoZG9jKSB7CiAgICAgIGF3YWl0IHRoaXMudXBkYXRlSW5kZXhlc09uRGVsZXRlKGRvYyk7CiAgICAgIGF3YWl0IHRoaXMuZG9jdW1lbnRzLmRlbGV0ZShkb2MuX2lkLnRvU3RyaW5nKCkpOwogICAgICB0aGlzLmVtaXQoImRlbGV0ZSIsIHsgX2lkOiBkb2MuX2lkIH0pOwogICAgICByZXR1cm4geyBkZWxldGVkQ291bnQ6IDEgfTsKICAgIH0gZWxzZSB7CiAgICAgIHJldHVybiB7IGRlbGV0ZWRDb3VudDogMCB9OwogICAgfQogIH0KICBhc3luYyBkZWxldGVNYW55KHF1ZXJ5KSB7CiAgICBjb25zdCBjID0gdGhpcy5maW5kKHF1ZXJ5KTsKICAgIGF3YWl0IGMuX2Vuc3VyZUluaXRpYWxpemVkKCk7CiAgICBjb25zdCBpZHMgPSBbXTsKICAgIGNvbnN0IGRvY3MgPSBbXTsKICAgIHdoaWxlIChhd2FpdCBjLmhhc05leHQoKSkgewogICAgICBjb25zdCBkb2MgPSBhd2FpdCBjLm5leHQoKTsKICAgICAgaWRzLnB1c2goZG9jLl9pZCk7CiAgICAgIGRvY3MucHVzaChkb2MpOwogICAgfQogICAgY29uc3QgZGVsZXRlZENvdW50ID0gaWRzLmxlbmd0aDsKICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaWRzLmxlbmd0aDsgaSsrKSB7CiAgICAgIGF3YWl0IHRoaXMudXBkYXRlSW5kZXhlc09uRGVsZXRlKGRvY3NbaV0pOwogICAgICB0aGlzLmRvY3VtZW50cy5kZWxldGUoaWRzW2ldLnRvU3RyaW5nKCkpOwogICAgICB0aGlzLmVtaXQoImRlbGV0ZSIsIHsgX2lkOiBpZHNbaV0gfSk7CiAgICB9CiAgICByZXR1cm4geyBkZWxldGVkQ291bnQgfTsKICB9CiAgYXN5bmMgZGlzdGluY3QoZmllbGQsIHF1ZXJ5KSB7CiAgICBjb25zdCB2YWxzID0ge307CiAgICBjb25zdCBjID0gdGhpcy5maW5kKHF1ZXJ5KTsKICAgIGF3YWl0IGMuX2Vuc3VyZUluaXRpYWxpemVkKCk7CiAgICB3aGlsZSAoYXdhaXQgYy5oYXNOZXh0KCkpIHsKICAgICAgY29uc3QgZCA9IGF3YWl0IGMubmV4dCgpOwogICAgICBpZiAoZFtmaWVsZF0pIHsKICAgICAgICB2YWxzW2RbZmllbGRdXSA9IHRydWU7CiAgICAgIH0KICAgIH0KICAgIHJldHVybiBPYmplY3Qua2V5cyh2YWxzKTsKICB9CiAgYXN5bmMgZHJvcCgpIHsKICAgIGlmICghdGhpcy5faW5pdGlhbGl6ZWQpIGF3YWl0IHRoaXMuX2luaXRpYWxpemUoKTsKICAgIGNvbnNvbGUubG9nKGBbRFJPUF0gU3RhcnRpbmcgZHJvcCBvZiBjb2xsZWN0aW9uICR7dGhpcy5uYW1lfSBhdCBwYXRoICR7dGhpcy5wYXRofWApOwogICAgY29uc29sZS5sb2coYFtEUk9QXSBJbmRleGVzIHRvIGNsb3NlOmAsIEFycmF5LmZyb20odGhpcy5pbmRleGVzLmtleXMoKSkpOwogICAgZm9yIChjb25zdCBbaW5kZXhOYW1lLCBpbmRleF0gb2YgdGhpcy5pbmRleGVzKSB7CiAgICAgIGlmIChpbmRleCAmJiB0eXBlb2YgaW5kZXguY2xvc2UgPT09ICJmdW5jdGlvbiIpIHsKICAgICAgICBjb25zb2xlLmxvZyhgW0RST1BdIENsb3NpbmcgaW5kZXg6ICR7aW5kZXhOYW1lfWApOwogICAgICAgIGF3YWl0IGluZGV4LmNsb3NlKCk7CiAgICAgIH0KICAgIH0KICAgIGlmICh0aGlzLmRvY3VtZW50cyAmJiB0eXBlb2YgdGhpcy5kb2N1bWVudHMuY2xvc2UgPT09ICJmdW5jdGlvbiIpIHsKICAgICAgY29uc29sZS5sb2coYFtEUk9QXSBDbG9zaW5nIGRvY3VtZW50cyBCKyB0cmVlYCk7CiAgICAgIGF3YWl0IHRoaXMuZG9jdW1lbnRzLmNsb3NlKCk7CiAgICB9CiAgICBpZiAodGhpcy5fcmVsZWFzZURvY3VtZW50cykgewogICAgICBhd2FpdCB0aGlzLl9yZWxlYXNlRG9jdW1lbnRzKCk7CiAgICAgIHRoaXMuX3JlbGVhc2VEb2N1bWVudHMgPSBudWxsOwogICAgfQogICAgdHJ5IHsKICAgICAgY29uc3QgcGF0aFBhcnRzMiA9IHRoaXMucGF0aC5zcGxpdCgiLyIpLmZpbHRlcihCb29sZWFuKTsKICAgICAgbGV0IGNvbGxlY3Rpb25EaXIgPSBhd2FpdCBnbG9iYWxUaGlzLm5hdmlnYXRvci5zdG9yYWdlLmdldERpcmVjdG9yeSgpOwogICAgICBmb3IgKGNvbnN0IHBhcnQgb2YgcGF0aFBhcnRzMikgewogICAgICAgIGNvbGxlY3Rpb25EaXIgPSBhd2FpdCBjb2xsZWN0aW9uRGlyLmdldERpcmVjdG9yeUhhbmRsZShwYXJ0LCB7IGNyZWF0ZTogZmFsc2UgfSk7CiAgICAgIH0KICAgICAgY29uc29sZS5sb2coYFtEUk9QXSBGb3VuZCBjb2xsZWN0aW9uIGRpcmVjdG9yeSwgbGlzdGluZyBmaWxlcy4uLmApOwogICAgICBjb25zdCBlbnRyaWVzVG9EZWxldGUgPSBbXTsKICAgICAgZm9yIGF3YWl0IChjb25zdCBbZW50cnlOYW1lLCBlbnRyeUhhbmRsZV0gb2YgY29sbGVjdGlvbkRpci5lbnRyaWVzKCkpIHsKICAgICAgICBjb25zb2xlLmxvZyhgW0RST1BdIEZvdW5kIGZpbGU6ICR7ZW50cnlOYW1lfWApOwogICAgICAgIGVudHJpZXNUb0RlbGV0ZS5wdXNoKGVudHJ5TmFtZSk7CiAgICAgIH0KICAgICAgY29uc29sZS5sb2coYFtEUk9QXSBEZWxldGluZyAke2VudHJpZXNUb0RlbGV0ZS5sZW5ndGh9IGZpbGVzLi4uYCk7CiAgICAgIGZvciAoY29uc3QgZW50cnlOYW1lIG9mIGVudHJpZXNUb0RlbGV0ZSkgewogICAgICAgIHRyeSB7CiAgICAgICAgICBhd2FpdCBjb2xsZWN0aW9uRGlyLnJlbW92ZUVudHJ5KGVudHJ5TmFtZSwgeyByZWN1cnNpdmU6IGZhbHNlIH0pOwogICAgICAgICAgY29uc29sZS5sb2coYFtEUk9QXSBEZWxldGVkOiAke2VudHJ5TmFtZX1gKTsKICAgICAgICB9IGNhdGNoIChlKSB7CiAgICAgICAgICBjb25zb2xlLndhcm4oYFtEUk9QXSBGYWlsZWQgdG8gZGVsZXRlICR7ZW50cnlOYW1lfTpgLCBlKTsKICAgICAgICB9CiAgICAgIH0KICAgIH0gY2F0Y2ggKGVycm9yKSB7CiAgICAgIGlmIChlcnJvci5uYW1lICE9PSAiTm90Rm91bmRFcnJvciIgJiYgZXJyb3IuY29kZSAhPT0gIkVOT0VOVCIpIHsKICAgICAgICBjb25zb2xlLndhcm4oIltEUk9QXSBFcnJvciBkdXJpbmcgZmlsZSBjbGVhbnVwOiIsIGVycm9yKTsKICAgICAgfSBlbHNlIHsKICAgICAgICBjb25zb2xlLmxvZyhgW0RST1BdIENvbGxlY3Rpb24gZGlyZWN0b3J5IGRvZXNuJ3QgZXhpc3QgeWV0YCk7CiAgICAgIH0KICAgIH0KICAgIGNvbnN0IHBhdGhQYXJ0cyA9IHRoaXMucGF0aC5zcGxpdCgiLyIpLmZpbHRlcihCb29sZWFuKTsKICAgIGNvbnN0IGZpbGVuYW1lID0gcGF0aFBhcnRzLnBvcCgpOwogICAgdHJ5IHsKICAgICAgbGV0IGRpciA9IGF3YWl0IGdsb2JhbFRoaXMubmF2aWdhdG9yLnN0b3JhZ2UuZ2V0RGlyZWN0b3J5KCk7CiAgICAgIGZvciAoY29uc3QgcGFydCBvZiBwYXRoUGFydHMpIHsKICAgICAgICBkaXIgPSBhd2FpdCBkaXIuZ2V0RGlyZWN0b3J5SGFuZGxlKHBhcnQsIHsgY3JlYXRlOiBmYWxzZSB9KTsKICAgICAgfQogICAgICB0cnkgewogICAgICAgIGNvbnNvbGUubG9nKGBbRFJPUF0gQXR0ZW1wdGluZyByZWN1cnNpdmUgcmVtb3ZhbCBvZiBkaXJlY3Rvcnk6ICR7ZmlsZW5hbWV9YCk7CiAgICAgICAgYXdhaXQgZGlyLnJlbW92ZUVudHJ5KGZpbGVuYW1lLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTsKICAgICAgICBjb25zb2xlLmxvZyhgW0RST1BdIFN1Y2Nlc3NmdWxseSByZW1vdmVkIGRpcmVjdG9yeSB3aXRoIHJlY3Vyc2l2ZSBmbGFnYCk7CiAgICAgIH0gY2F0Y2ggKGUpIHsKICAgICAgICBpZiAoZS5uYW1lID09PSAiVHlwZUVycm9yIiB8fCBlLm1lc3NhZ2U/LmluY2x1ZGVzKCJyZWN1cnNpdmUiKSkgewogICAgICAgICAgY29uc29sZS5sb2coYFtEUk9QXSBSZWN1cnNpdmUgbm90IHN1cHBvcnRlZCwgdHJ5aW5nIG5vbi1yZWN1cnNpdmUgcmVtb3ZhbGApOwogICAgICAgICAgYXdhaXQgZGlyLnJlbW92ZUVudHJ5KGZpbGVuYW1lKTsKICAgICAgICAgIGNvbnNvbGUubG9nKGBbRFJPUF0gU3VjY2Vzc2Z1bGx5IHJlbW92ZWQgZW1wdHkgZGlyZWN0b3J5YCk7CiAgICAgICAgfSBlbHNlIHsKICAgICAgICAgIHRocm93IGU7CiAgICAgICAgfQogICAgICB9CiAgICB9IGNhdGNoIChlcnJvcikgewogICAgICBpZiAoZXJyb3IubmFtZSAhPT0gIk5vdEZvdW5kRXJyb3IiICYmIGVycm9yLmNvZGUgIT09ICJFTk9FTlQiKSB7CiAgICAgICAgdGhyb3cgZXJyb3I7CiAgICAgIH0gZWxzZSB7CiAgICAgICAgY29uc29sZS5sb2coYFtEUk9QXSBQYXJlbnQgZGlyZWN0b3J5IGRvZXNuJ3QgZXhpc3RgKTsKICAgICAgfQogICAgfQogICAgdGhpcy5kb2N1bWVudHMgPSBudWxsOwogICAgdGhpcy5pbmRleGVzLmNsZWFyKCk7CiAgICB0aGlzLl9pbml0aWFsaXplZCA9IGZhbHNlOwogICAgdGhpcy5kYi5jb2xsZWN0aW9ucy5kZWxldGUodGhpcy5uYW1lKTsKICAgIGNvbnNvbGUubG9nKGBbRFJPUF0gQ29sbGVjdGlvbiAke3RoaXMubmFtZX0gZHJvcHBlZCBzdWNjZXNzZnVsbHlgKTsKICAgIHRoaXMuZW1pdCgiZHJvcCIsIHsgY29sbGVjdGlvbjogdGhpcy5uYW1lIH0pOwogICAgcmV0dXJuIHsgb2s6IDEgfTsKICB9CiAgYXN5bmMgZHJvcEluZGV4KGluZGV4TmFtZSkgewogICAgaWYgKCF0aGlzLmluZGV4ZXMuaGFzKGluZGV4TmFtZSkpIHsKICAgICAgdGhyb3cgbmV3IEluZGV4Tm90Rm91bmRFcnJvcihpbmRleE5hbWUsIHsgY29sbGVjdGlvbjogdGhpcy5uYW1lIH0pOwogICAgfQogICAgY29uc3QgaW5kZXggPSB0aGlzLmluZGV4ZXMuZ2V0KGluZGV4TmFtZSk7CiAgICBpZiAoaW5kZXggJiYgdHlwZW9mIGluZGV4LmNsZWFyID09PSAiZnVuY3Rpb24iKSB7CiAgICAgIGF3YWl0IGluZGV4LmNsZWFyKCk7CiAgICB9CiAgICBpZiAoaW5kZXggJiYgdHlwZW9mIGluZGV4LmNsb3NlID09PSAiZnVuY3Rpb24iKSB7CiAgICAgIGF3YWl0IGluZGV4LmNsb3NlKCk7CiAgICB9CiAgICB0aGlzLmluZGV4ZXMuZGVsZXRlKGluZGV4TmFtZSk7CiAgICByZXR1cm4geyBuSW5kZXhlc1dhczogdGhpcy5pbmRleGVzLnNpemUgKyAxLCBvazogMSB9OwogIH0KICBhc3luYyBkcm9wSW5kZXhlcygpIHsKICAgIGNvbnN0IGNvdW50ID0gdGhpcy5pbmRleGVzLnNpemU7CiAgICBmb3IgKGNvbnN0IFtfLCBpbmRleF0gb2YgdGhpcy5pbmRleGVzKSB7CiAgICAgIGlmIChpbmRleCAmJiB0eXBlb2YgaW5kZXguY2xlYXIgPT09ICJmdW5jdGlvbiIpIHsKICAgICAgICBhd2FpdCBpbmRleC5jbGVhcigpOwogICAgICB9CiAgICAgIGlmIChpbmRleCAmJiB0eXBlb2YgaW5kZXguY2xvc2UgPT09ICJmdW5jdGlvbiIpIHsKICAgICAgICBhd2FpdCBpbmRleC5jbG9zZSgpOwogICAgICB9CiAgICB9CiAgICB0aGlzLmluZGV4ZXMuY2xlYXIoKTsKICAgIHJldHVybiB7IG5JbmRleGVzV2FzOiBjb3VudCwgbXNnOiAibm9uLV9pZCBpbmRleGVzIGRyb3BwZWQiLCBvazogMSB9OwogIH0KICBlbnN1cmVJbmRleCgpIHsKICAgIHRocm93IG5ldyBOb3RJbXBsZW1lbnRlZEVycm9yKCJlbnN1cmVJbmRleCIsIHsgY29sbGVjdGlvbjogdGhpcy5uYW1lIH0pOwogIH0KICBleHBsYWluKCkgewogICAgdGhyb3cgbmV3IE5vdEltcGxlbWVudGVkRXJyb3IoImV4cGxhaW4iLCB7IGNvbGxlY3Rpb246IHRoaXMubmFtZSB9KTsKICB9CiAgZmluZChxdWVyeSwgcHJvamVjdGlvbikgewogICAgdGhpcy5fdmFsaWRhdGVQcm9qZWN0aW9uKHByb2plY3Rpb24pOwogICAgY29uc3QgZG9jdW1lbnRzUHJvbWlzZSA9IHRoaXMuX2ZpbmRJbnRlcm5hbChxdWVyeSwgcHJvamVjdGlvbik7CiAgICByZXR1cm4gbmV3IEN1cnNvcigKICAgICAgdGhpcywKICAgICAgcXVlcnksCiAgICAgIHByb2plY3Rpb24sCiAgICAgIGRvY3VtZW50c1Byb21pc2UsCiAgICAgIFNvcnRlZEN1cnNvcgogICAgKTsKICB9CiAgX3ZhbGlkYXRlUHJvamVjdGlvbihwcm9qZWN0aW9uKSB7CiAgICBpZiAoIXByb2plY3Rpb24gfHwgT2JqZWN0LmtleXMocHJvamVjdGlvbikubGVuZ3RoID09PSAwKSByZXR1cm47CiAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMocHJvamVjdGlvbik7CiAgICBsZXQgaGFzSW5jbHVzaW9uID0gZmFsc2U7CiAgICBsZXQgaGFzRXhjbHVzaW9uID0gZmFsc2U7CiAgICBmb3IgKGNvbnN0IGtleSBvZiBrZXlzKSB7CiAgICAgIGlmIChrZXkgPT09ICJfaWQiKSBjb250aW51ZTsKICAgICAgaWYgKHByb2plY3Rpb25ba2V5XSkgaGFzSW5jbHVzaW9uID0gdHJ1ZTsKICAgICAgZWxzZSBoYXNFeGNsdXNpb24gPSB0cnVlOwogICAgICBpZiAoaGFzSW5jbHVzaW9uICYmIGhhc0V4Y2x1c2lvbikgYnJlYWs7CiAgICB9CiAgICBpZiAoaGFzSW5jbHVzaW9uICYmIGhhc0V4Y2x1c2lvbikgewogICAgICB0aHJvdyBuZXcgUXVlcnlFcnJvcigiQ2Fubm90IGRvIGV4Y2x1c2lvbiBvbiBmaWVsZCBpbiBpbmNsdXNpb24gcHJvamVjdGlvbiIsIHsKICAgICAgICBjb2RlOiBFcnJvckNvZGVzLkNBTk5PVF9ET19FWENMVVNJT05fT05fRklFTERfSURfSU5fSU5DTFVTSU9OX1BST0pFQ1RJT04sCiAgICAgICAgY29sbGVjdGlvbjogdGhpcy5uYW1lCiAgICAgIH0pOwogICAgfQogIH0KICBhc3luYyBfZmluZEludGVybmFsKHF1ZXJ5LCBwcm9qZWN0aW9uKSB7CiAgICBpZiAoIXRoaXMuX2luaXRpYWxpemVkKSBhd2FpdCB0aGlzLl9pbml0aWFsaXplKCk7CiAgICBjb25zdCBub3JtYWxpemVkUXVlcnkgPSBxdWVyeSA9PSB2b2lkIDAgPyB7fSA6IHF1ZXJ5OwogICAgY29uc3QgbmVhclNwZWMgPSB0aGlzLl9leHRyYWN0TmVhclNwZWMobm9ybWFsaXplZFF1ZXJ5KTsKICAgIGNvbnN0IGRvY3VtZW50cyA9IFtdOwogICAgY29uc3Qgc2VlbiA9IHt9OwogICAgaWYgKHRoaXMuaW5kZXhlcy5zaXplID4gMCkgewogICAgICBjb25zdCBxdWVyeVBsYW4gPSBhd2FpdCB0aGlzLnBsYW5RdWVyeUFzeW5jKG5vcm1hbGl6ZWRRdWVyeSk7CiAgICAgIGlmIChxdWVyeVBsYW4udXNlSW5kZXggJiYgcXVlcnlQbGFuLmRvY0lkcyAmJiBxdWVyeVBsYW4uZG9jSWRzLmxlbmd0aCA+IDApIHsKICAgICAgICBmb3IgKGNvbnN0IGRvY0lkIG9mIHF1ZXJ5UGxhbi5kb2NJZHMpIHsKICAgICAgICAgIGlmICghc2Vlbltkb2NJZF0pIHsKICAgICAgICAgICAgY29uc3QgZG9jID0gYXdhaXQgdGhpcy5kb2N1bWVudHMuc2VhcmNoKGRvY0lkKTsKICAgICAgICAgICAgaWYgKGRvYyAmJiBtYXRjaGVzKGRvYywgbm9ybWFsaXplZFF1ZXJ5KSkgewogICAgICAgICAgICAgIHNlZW5bZG9jSWRdID0gdHJ1ZTsKICAgICAgICAgICAgICBkb2N1bWVudHMucHVzaChkb2MpOwogICAgICAgICAgICB9CiAgICAgICAgICB9CiAgICAgICAgfQogICAgICB9IGVsc2UgewogICAgICAgIGZvciBhd2FpdCAoY29uc3QgZW50cnkgb2YgdGhpcy5kb2N1bWVudHMpIHsKICAgICAgICAgIGlmIChlbnRyeSAmJiBlbnRyeS52YWx1ZSAmJiAhc2VlbltlbnRyeS52YWx1ZS5faWRdICYmIG1hdGNoZXMoZW50cnkudmFsdWUsIG5vcm1hbGl6ZWRRdWVyeSkpIHsKICAgICAgICAgICAgc2VlbltlbnRyeS52YWx1ZS5faWRdID0gdHJ1ZTsKICAgICAgICAgICAgZG9jdW1lbnRzLnB1c2goZW50cnkudmFsdWUpOwogICAgICAgICAgfQogICAgICAgIH0KICAgICAgfQogICAgfSBlbHNlIHsKICAgICAgZm9yIGF3YWl0IChjb25zdCBlbnRyeSBvZiB0aGlzLmRvY3VtZW50cykgewogICAgICAgIGlmIChlbnRyeSAmJiBlbnRyeS52YWx1ZSAmJiAhc2VlbltlbnRyeS52YWx1ZS5faWRdICYmIG1hdGNoZXMoZW50cnkudmFsdWUsIG5vcm1hbGl6ZWRRdWVyeSkpIHsKICAgICAgICAgIHNlZW5bZW50cnkudmFsdWUuX2lkXSA9IHRydWU7CiAgICAgICAgICBkb2N1bWVudHMucHVzaChlbnRyeS52YWx1ZSk7CiAgICAgICAgfQogICAgICB9CiAgICB9CiAgICBpZiAobmVhclNwZWMpIHsKICAgICAgdGhpcy5fc29ydEJ5TmVhckRpc3RhbmNlKGRvY3VtZW50cywgbmVhclNwZWMpOwogICAgfQogICAgcmV0dXJuIGRvY3VtZW50czsKICB9CiAgX2V4dHJhY3ROZWFyU3BlYyhxdWVyeSkgewogICAgZm9yIChjb25zdCBmaWVsZCBvZiBPYmplY3Qua2V5cyhxdWVyeSB8fCB7fSkpIHsKICAgICAgaWYgKGZpZWxkLnN0YXJ0c1dpdGgoIiQiKSkgY29udGludWU7CiAgICAgIGNvbnN0IHZhbHVlID0gcXVlcnlbZmllbGRdOwogICAgICBpZiAoIXZhbHVlIHx8IHR5cGVvZiB2YWx1ZSAhPT0gIm9iamVjdCIpIGNvbnRpbnVlOwogICAgICBpZiAodmFsdWUuJG5lYXIpIHsKICAgICAgICBjb25zdCBjb29yZHMgPSB0aGlzLl9wYXJzZU5lYXJDb29yZGluYXRlcyh2YWx1ZS4kbmVhcik7CiAgICAgICAgaWYgKGNvb3JkcykgcmV0dXJuIHsgZmllbGQsIC4uLmNvb3JkcyB9OwogICAgICB9CiAgICAgIGlmICh2YWx1ZS4kbmVhclNwaGVyZSkgewogICAgICAgIGNvbnN0IGNvb3JkcyA9IHRoaXMuX3BhcnNlTmVhckNvb3JkaW5hdGVzKHZhbHVlLiRuZWFyU3BoZXJlKTsKICAgICAgICBpZiAoY29vcmRzKSByZXR1cm4geyBmaWVsZCwgLi4uY29vcmRzIH07CiAgICAgIH0KICAgIH0KICAgIHJldHVybiBudWxsOwogIH0KICBfcGFyc2VOZWFyQ29vcmRpbmF0ZXMoc3BlYykgewogICAgbGV0IGNvb3JkaW5hdGVzOwogICAgaWYgKHNwZWMgJiYgdHlwZW9mIHNwZWMgPT09ICJvYmplY3QiKSB7CiAgICAgIGlmIChzcGVjLiRnZW9tZXRyeSAmJiBzcGVjLiRnZW9tZXRyeS5jb29yZGluYXRlcykgewogICAgICAgIGNvb3JkaW5hdGVzID0gc3BlYy4kZ2VvbWV0cnkuY29vcmRpbmF0ZXM7CiAgICAgIH0gZWxzZSBpZiAoc3BlYy5jb29yZGluYXRlcykgewogICAgICAgIGNvb3JkaW5hdGVzID0gc3BlYy5jb29yZGluYXRlczsKICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHNwZWMpKSB7CiAgICAgICAgY29vcmRpbmF0ZXMgPSBzcGVjOwogICAgICB9CiAgICB9CiAgICBpZiAoIWNvb3JkaW5hdGVzIHx8IGNvb3JkaW5hdGVzLmxlbmd0aCA8IDIpIHsKICAgICAgcmV0dXJuIG51bGw7CiAgICB9CiAgICBjb25zdCBbbG5nLCBsYXRdID0gY29vcmRpbmF0ZXM7CiAgICBpZiAodHlwZW9mIGxhdCAhPT0gIm51bWJlciIgfHwgdHlwZW9mIGxuZyAhPT0gIm51bWJlciIpIHsKICAgICAgcmV0dXJuIG51bGw7CiAgICB9CiAgICByZXR1cm4geyBsYXQsIGxuZyB9OwogIH0KICBfZXh0cmFjdFBvaW50Q29vcmRpbmF0ZXModmFsdWUpIHsKICAgIGlmICghdmFsdWUpIHJldHVybiBudWxsOwogICAgaWYgKHZhbHVlLnR5cGUgPT09ICJGZWF0dXJlQ29sbGVjdGlvbiIgJiYgQXJyYXkuaXNBcnJheSh2YWx1ZS5mZWF0dXJlcykgJiYgdmFsdWUuZmVhdHVyZXMubGVuZ3RoID4gMCkgewogICAgICByZXR1cm4gdGhpcy5fZXh0cmFjdFBvaW50Q29vcmRpbmF0ZXModmFsdWUuZmVhdHVyZXNbMF0uZ2VvbWV0cnkpOwogICAgfQogICAgaWYgKHZhbHVlLnR5cGUgPT09ICJGZWF0dXJlIiAmJiB2YWx1ZS5nZW9tZXRyeSkgewogICAgICByZXR1cm4gdGhpcy5fZXh0cmFjdFBvaW50Q29vcmRpbmF0ZXModmFsdWUuZ2VvbWV0cnkpOwogICAgfQogICAgaWYgKHZhbHVlLnR5cGUgPT09ICJQb2ludCIgJiYgQXJyYXkuaXNBcnJheSh2YWx1ZS5jb29yZGluYXRlcykgJiYgdmFsdWUuY29vcmRpbmF0ZXMubGVuZ3RoID49IDIpIHsKICAgICAgY29uc3QgW2xuZywgbGF0XSA9IHZhbHVlLmNvb3JkaW5hdGVzOwogICAgICBpZiAodHlwZW9mIGxhdCA9PT0gIm51bWJlciIgJiYgdHlwZW9mIGxuZyA9PT0gIm51bWJlciIpIHsKICAgICAgICByZXR1cm4geyBsYXQsIGxuZyB9OwogICAgICB9CiAgICB9CiAgICByZXR1cm4gbnVsbDsKICB9CiAgX3NvcnRCeU5lYXJEaXN0YW5jZShkb2N1bWVudHMsIG5lYXJTcGVjKSB7CiAgICBjb25zdCB7IGZpZWxkLCBsYXQ6IHRhcmdldExhdCwgbG5nOiB0YXJnZXRMbmcgfSA9IG5lYXJTcGVjOwogICAgZG9jdW1lbnRzLnNvcnQoKGEsIGIpID0+IHsKICAgICAgY29uc3QgYVBvaW50ID0gdGhpcy5fZXh0cmFjdFBvaW50Q29vcmRpbmF0ZXMoZ2V0UHJvcChhLCBmaWVsZCkpOwogICAgICBjb25zdCBiUG9pbnQgPSB0aGlzLl9leHRyYWN0UG9pbnRDb29yZGluYXRlcyhnZXRQcm9wKGIsIGZpZWxkKSk7CiAgICAgIGNvbnN0IGFEaXN0ID0gYVBvaW50ID8gdGhpcy5faGF2ZXJzaW5lRGlzdGFuY2UoYVBvaW50LmxhdCwgYVBvaW50LmxuZywgdGFyZ2V0TGF0LCB0YXJnZXRMbmcpIDogSW5maW5pdHk7CiAgICAgIGNvbnN0IGJEaXN0ID0gYlBvaW50ID8gdGhpcy5faGF2ZXJzaW5lRGlzdGFuY2UoYlBvaW50LmxhdCwgYlBvaW50LmxuZywgdGFyZ2V0TGF0LCB0YXJnZXRMbmcpIDogSW5maW5pdHk7CiAgICAgIHJldHVybiBhRGlzdCAtIGJEaXN0OwogICAgfSk7CiAgfQogIF9oYXZlcnNpbmVEaXN0YW5jZShsYXQxLCBsbmcxLCBsYXQyLCBsbmcyKSB7CiAgICBjb25zdCBSID0gNjM3MTsKICAgIGNvbnN0IGRMYXQgPSAobGF0MiAtIGxhdDEpICogTWF0aC5QSSAvIDE4MDsKICAgIGNvbnN0IGRMbmcgPSAobG5nMiAtIGxuZzEpICogTWF0aC5QSSAvIDE4MDsKICAgIGNvbnN0IGEgPSBNYXRoLnNpbihkTGF0IC8gMikgKiBNYXRoLnNpbihkTGF0IC8gMikgKyBNYXRoLmNvcyhsYXQxICogTWF0aC5QSSAvIDE4MCkgKiBNYXRoLmNvcyhsYXQyICogTWF0aC5QSSAvIDE4MCkgKiBNYXRoLnNpbihkTG5nIC8gMikgKiBNYXRoLnNpbihkTG5nIC8gMik7CiAgICBjb25zdCBjID0gMiAqIE1hdGguYXRhbjIoTWF0aC5zcXJ0KGEpLCBNYXRoLnNxcnQoMSAtIGEpKTsKICAgIHJldHVybiBSICogYzsKICB9CiAgZmluZEFuZE1vZGlmeSgpIHsKICAgIHRocm93IG5ldyBOb3RJbXBsZW1lbnRlZEVycm9yKCJmaW5kQW5kTW9kaWZ5IiwgeyBjb2xsZWN0aW9uOiB0aGlzLm5hbWUgfSk7CiAgfQogIGFzeW5jIGZpbmRPbmUocXVlcnksIHByb2plY3Rpb24pIHsKICAgIGNvbnN0IGN1cnNvciA9IHRoaXMuZmluZChxdWVyeSwgcHJvamVjdGlvbik7CiAgICBhd2FpdCBjdXJzb3IuX2Vuc3VyZUluaXRpYWxpemVkKCk7CiAgICBpZiAoYXdhaXQgY3Vyc29yLmhhc05leHQoKSkgewogICAgICByZXR1cm4gYXdhaXQgY3Vyc29yLm5leHQoKTsKICAgIH0gZWxzZSB7CiAgICAgIHJldHVybiBudWxsOwogICAgfQogIH0KICBhc3luYyBmaW5kT25lQW5kRGVsZXRlKGZpbHRlciwgb3B0aW9ucykgewogICAgbGV0IGMgPSB0aGlzLmZpbmQoZmlsdGVyKTsKICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuc29ydCkgewogICAgICBjID0gYy5zb3J0KG9wdGlvbnMuc29ydCk7CiAgICAgIGF3YWl0IGMuX2Vuc3VyZUluaXRpYWxpemVkKCk7CiAgICB9IGVsc2UgewogICAgICBhd2FpdCBjLl9lbnN1cmVJbml0aWFsaXplZCgpOwogICAgfQogICAgaWYgKCFhd2FpdCBjLmhhc05leHQoKSkgcmV0dXJuIG51bGw7CiAgICBjb25zdCBkb2MgPSBhd2FpdCBjLm5leHQoKTsKICAgIGF3YWl0IHRoaXMuZG9jdW1lbnRzLmRlbGV0ZShkb2MuX2lkLnRvU3RyaW5nKCkpOwogICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5wcm9qZWN0aW9uKSByZXR1cm4gYXBwbHlQcm9qZWN0aW9uKG9wdGlvbnMucHJvamVjdGlvbiwgZG9jKTsKICAgIGVsc2UgcmV0dXJuIGRvYzsKICB9CiAgYXN5bmMgZmluZE9uZUFuZFJlcGxhY2UoZmlsdGVyLCByZXBsYWNlbWVudCwgb3B0aW9ucykgewogICAgbGV0IGMgPSB0aGlzLmZpbmQoZmlsdGVyKTsKICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuc29ydCkgewogICAgICBjID0gYy5zb3J0KG9wdGlvbnMuc29ydCk7CiAgICAgIGF3YWl0IGMuX2Vuc3VyZUluaXRpYWxpemVkKCk7CiAgICB9IGVsc2UgewogICAgICBhd2FpdCBjLl9lbnN1cmVJbml0aWFsaXplZCgpOwogICAgfQogICAgaWYgKCFhd2FpdCBjLmhhc05leHQoKSkgcmV0dXJuIG51bGw7CiAgICBjb25zdCBkb2MgPSBhd2FpdCBjLm5leHQoKTsKICAgIHJlcGxhY2VtZW50Ll9pZCA9IGRvYy5faWQ7CiAgICBhd2FpdCB0aGlzLmRvY3VtZW50cy5hZGQoZG9jLl9pZC50b1N0cmluZygpLCByZXBsYWNlbWVudCk7CiAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnJldHVybk5ld0RvY3VtZW50KSB7CiAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMucHJvamVjdGlvbikgcmV0dXJuIGFwcGx5UHJvamVjdGlvbihvcHRpb25zLnByb2plY3Rpb24sIHJlcGxhY2VtZW50KTsKICAgICAgZWxzZSByZXR1cm4gcmVwbGFjZW1lbnQ7CiAgICB9IGVsc2UgewogICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnByb2plY3Rpb24pIHJldHVybiBhcHBseVByb2plY3Rpb24ob3B0aW9ucy5wcm9qZWN0aW9uLCBkb2MpOwogICAgICBlbHNlIHJldHVybiBkb2M7CiAgICB9CiAgfQogIGFzeW5jIGZpbmRPbmVBbmRVcGRhdGUoZmlsdGVyLCB1cGRhdGUsIG9wdGlvbnMpIHsKICAgIGxldCBjID0gdGhpcy5maW5kKGZpbHRlcik7CiAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnNvcnQpIHsKICAgICAgYyA9IGMuc29ydChvcHRpb25zLnNvcnQpOwogICAgICBhd2FpdCBjLl9lbnN1cmVJbml0aWFsaXplZCgpOwogICAgfSBlbHNlIHsKICAgICAgYXdhaXQgYy5fZW5zdXJlSW5pdGlhbGl6ZWQoKTsKICAgIH0KICAgIGlmICghYXdhaXQgYy5oYXNOZXh0KCkpIHJldHVybiBudWxsOwogICAgY29uc3QgZG9jID0gYXdhaXQgYy5uZXh0KCk7CiAgICBjb25zdCBjbG9uZSA9IE9iamVjdC5hc3NpZ24oe30sIGRvYyk7CiAgICBjb25zdCBtYXRjaEluZm8gPSBtYXRjaFdpdGhBcnJheUluZGljZXMoZG9jLCBmaWx0ZXIpOwogICAgY29uc3QgcG9zaXRpb25hbE1hdGNoSW5mbyA9IG1hdGNoSW5mby5hcnJheUZpbHRlcnM7CiAgICBjb25zdCB1c2VyQXJyYXlGaWx0ZXJzID0gb3B0aW9ucyAmJiBvcHRpb25zLmFycmF5RmlsdGVyczsKICAgIGFwcGx5VXBkYXRlcyh1cGRhdGUsIGNsb25lLCBmYWxzZSwgcG9zaXRpb25hbE1hdGNoSW5mbywgdXNlckFycmF5RmlsdGVycyk7CiAgICBhd2FpdCB0aGlzLmRvY3VtZW50cy5hZGQoZG9jLl9pZC50b1N0cmluZygpLCBjbG9uZSk7CiAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnJldHVybk5ld0RvY3VtZW50KSB7CiAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMucHJvamVjdGlvbikgcmV0dXJuIGFwcGx5UHJvamVjdGlvbihvcHRpb25zLnByb2plY3Rpb24sIGNsb25lKTsKICAgICAgZWxzZSByZXR1cm4gY2xvbmU7CiAgICB9IGVsc2UgewogICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnByb2plY3Rpb24pIHJldHVybiBhcHBseVByb2plY3Rpb24ob3B0aW9ucy5wcm9qZWN0aW9uLCBkb2MpOwogICAgICBlbHNlIHJldHVybiBkb2M7CiAgICB9CiAgfQogIGdldEluZGV4ZXMoKSB7CiAgICBjb25zdCByZXN1bHQgPSBbXTsKICAgIGZvciAoY29uc3QgW2luZGV4TmFtZSwgaW5kZXhdIG9mIHRoaXMuaW5kZXhlcykgewogICAgICByZXN1bHQucHVzaChpbmRleC5nZXRTcGVjKCkpOwogICAgfQogICAgcmV0dXJuIHJlc3VsdDsKICB9CiAgZ2V0U2hhcmREaXN0cmlidXRpb24oKSB7CiAgICB0aHJvdyBuZXcgTm90SW1wbGVtZW50ZWRFcnJvcigiZ2V0U2hhcmREaXN0cmlidXRpb24iLCB7IGNvbGxlY3Rpb246IHRoaXMubmFtZSB9KTsKICB9CiAgZ2V0U2hhcmRWZXJzaW9uKCkgewogICAgdGhyb3cgbmV3IE5vdEltcGxlbWVudGVkRXJyb3IoImdldFNoYXJkVmVyc2lvbiIsIHsgY29sbGVjdGlvbjogdGhpcy5uYW1lIH0pOwogIH0KICAvLyBub24tbW9uZ28KICBnZXRTdG9yZSgpIHsKICAgIHJldHVybiB0aGlzLmRvY3VtZW50czsKICB9CiAgZ3JvdXAoKSB7CiAgICB0aHJvdyBuZXcgTm90SW1wbGVtZW50ZWRFcnJvcigiZ3JvdXAiLCB7IGNvbGxlY3Rpb246IHRoaXMubmFtZSB9KTsKICB9CiAgYXN5bmMgaW5zZXJ0KGRvYykgewogICAgaWYgKEFycmF5ID09IGRvYy5jb25zdHJ1Y3RvcikgewogICAgICByZXR1cm4gYXdhaXQgdGhpcy5pbnNlcnRNYW55KGRvYyk7CiAgICB9IGVsc2UgewogICAgICByZXR1cm4gYXdhaXQgdGhpcy5pbnNlcnRPbmUoZG9jKTsKICAgIH0KICB9CiAgYXN5bmMgaW5zZXJ0T25lKGRvYykgewogICAgaWYgKCF0aGlzLl9pbml0aWFsaXplZCkgYXdhaXQgdGhpcy5faW5pdGlhbGl6ZSgpOwogICAgaWYgKGRvYy5faWQgPT0gdm9pZCAwKSBkb2MuX2lkID0gbmV3IE9iamVjdElkKCk7CiAgICBhd2FpdCB0aGlzLmRvY3VtZW50cy5hZGQoZG9jLl9pZC50b1N0cmluZygpLCBkb2MpOwogICAgYXdhaXQgdGhpcy51cGRhdGVJbmRleGVzT25JbnNlcnQoZG9jKTsKICAgIHRoaXMuZW1pdCgiaW5zZXJ0IiwgZG9jKTsKICAgIHJldHVybiB7IGluc2VydGVkSWQ6IGRvYy5faWQgfTsKICB9CiAgYXN5bmMgaW5zZXJ0TWFueShkb2NzKSB7CiAgICBpZiAoIXRoaXMuX2luaXRpYWxpemVkKSBhd2FpdCB0aGlzLl9pbml0aWFsaXplKCk7CiAgICBjb25zdCBpbnNlcnRlZElkcyA9IFtdOwogICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkb2NzLmxlbmd0aDsgaSsrKSB7CiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuaW5zZXJ0T25lKGRvY3NbaV0pOwogICAgICBpbnNlcnRlZElkcy5wdXNoKHJlc3VsdC5pbnNlcnRlZElkKTsKICAgIH0KICAgIHJldHVybiB7IGluc2VydGVkSWRzIH07CiAgfQogIGlzQ2FwcGVkKCkgewogICAgdGhyb3cgbmV3IE5vdEltcGxlbWVudGVkRXJyb3IoImlzQ2FwcGVkIiwgeyBjb2xsZWN0aW9uOiB0aGlzLm5hbWUgfSk7CiAgfQogIG1hcFJlZHVjZSgpIHsKICAgIHRocm93IG5ldyBOb3RJbXBsZW1lbnRlZEVycm9yKCJtYXBSZWR1Y2UiLCB7IGNvbGxlY3Rpb246IHRoaXMubmFtZSB9KTsKICB9CiAgcmVJbmRleCgpIHsKICAgIHRocm93IG5ldyBOb3RJbXBsZW1lbnRlZEVycm9yKCJyZUluZGV4IiwgeyBjb2xsZWN0aW9uOiB0aGlzLm5hbWUgfSk7CiAgfQogIGFzeW5jIHJlcGxhY2VPbmUocXVlcnksIHJlcGxhY2VtZW50LCBvcHRpb25zKSB7CiAgICBjb25zdCByZXN1bHQgPSB7fTsKICAgIGNvbnN0IGMgPSB0aGlzLmZpbmQocXVlcnkpOwogICAgYXdhaXQgYy5fZW5zdXJlSW5pdGlhbGl6ZWQoKTsKICAgIHJlc3VsdC5tYXRjaGVkQ291bnQgPSBhd2FpdCBjLmNvdW50KCk7CiAgICBpZiAocmVzdWx0Lm1hdGNoZWRDb3VudCA9PSAwKSB7CiAgICAgIHJlc3VsdC5tb2RpZmllZENvdW50ID0gMDsKICAgICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy51cHNlcnQpIHsKICAgICAgICBjb25zdCBuZXdEb2MgPSByZXBsYWNlbWVudDsKICAgICAgICBuZXdEb2MuX2lkID0gbmV3IE9iamVjdElkKCk7CiAgICAgICAgYXdhaXQgdGhpcy5kb2N1bWVudHMuYWRkKG5ld0RvYy5faWQudG9TdHJpbmcoKSwgbmV3RG9jKTsKICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZUluZGV4ZXNPbkluc2VydChuZXdEb2MpOwogICAgICAgIHRoaXMuZW1pdCgiaW5zZXJ0IiwgbmV3RG9jKTsKICAgICAgICByZXN1bHQudXBzZXJ0ZWRJZCA9IG5ld0RvYy5faWQ7CiAgICAgIH0KICAgIH0gZWxzZSB7CiAgICAgIHJlc3VsdC5tb2RpZmllZENvdW50ID0gMTsKICAgICAgY29uc3QgZG9jID0gYXdhaXQgYy5uZXh0KCk7CiAgICAgIGF3YWl0IHRoaXMudXBkYXRlSW5kZXhlc09uRGVsZXRlKGRvYyk7CiAgICAgIHJlcGxhY2VtZW50Ll9pZCA9IGRvYy5faWQ7CiAgICAgIHRoaXMuZG9jdW1lbnRzLmFkZChkb2MuX2lkLnRvU3RyaW5nKCksIHJlcGxhY2VtZW50KTsKICAgICAgYXdhaXQgdGhpcy51cGRhdGVJbmRleGVzT25JbnNlcnQocmVwbGFjZW1lbnQpOwogICAgICB0aGlzLmVtaXQoInJlcGxhY2UiLCByZXBsYWNlbWVudCk7CiAgICB9CiAgICByZXR1cm4gcmVzdWx0OwogIH0KICBhc3luYyByZW1vdmUocXVlcnksIG9wdGlvbnMpIHsKICAgIGNvbnN0IGMgPSB0aGlzLmZpbmQocXVlcnkpOwogICAgYXdhaXQgYy5fZW5zdXJlSW5pdGlhbGl6ZWQoKTsKICAgIGlmICghYXdhaXQgYy5oYXNOZXh0KCkpIHJldHVybjsKICAgIGlmIChvcHRpb25zID09PSB0cnVlIHx8IG9wdGlvbnMgJiYgb3B0aW9ucy5qdXN0T25lKSB7CiAgICAgIGNvbnN0IGRvYyA9IGF3YWl0IGMubmV4dCgpOwogICAgICBhd2FpdCB0aGlzLnVwZGF0ZUluZGV4ZXNPbkRlbGV0ZShkb2MpOwogICAgICB0aGlzLmRvY3VtZW50cy5kZWxldGUoZG9jLl9pZC50b1N0cmluZygpKTsKICAgIH0gZWxzZSB7CiAgICAgIHdoaWxlIChhd2FpdCBjLmhhc05leHQoKSkgewogICAgICAgIGNvbnN0IGRvYyA9IGF3YWl0IGMubmV4dCgpOwogICAgICAgIGF3YWl0IHRoaXMudXBkYXRlSW5kZXhlc09uRGVsZXRlKGRvYyk7CiAgICAgICAgdGhpcy5kb2N1bWVudHMuZGVsZXRlKGRvYy5faWQudG9TdHJpbmcoKSk7CiAgICAgIH0KICAgIH0KICB9CiAgcmVuYW1lQ29sbGVjdGlvbigpIHsKICAgIHRocm93IG5ldyBOb3RJbXBsZW1lbnRlZEVycm9yKCJyZW5hbWVDb2xsZWN0aW9uIiwgeyBjb2xsZWN0aW9uOiB0aGlzLm5hbWUgfSk7CiAgfQogIHNhdmUoKSB7CiAgICB0aHJvdyBuZXcgTm90SW1wbGVtZW50ZWRFcnJvcigic2F2ZSIsIHsgY29sbGVjdGlvbjogdGhpcy5uYW1lIH0pOwogIH0KICBzdGF0cygpIHsKICAgIHRocm93IG5ldyBOb3RJbXBsZW1lbnRlZEVycm9yKCJzdGF0cyIsIHsgY29sbGVjdGlvbjogdGhpcy5uYW1lIH0pOwogIH0KICBzdG9yYWdlU2l6ZSgpIHsKICAgIHRocm93IG5ldyBOb3RJbXBsZW1lbnRlZEVycm9yKCJzdG9yYWdlU2l6ZSIsIHsgY29sbGVjdGlvbjogdGhpcy5uYW1lIH0pOwogIH0KICB0b3RhbFNpemUoKSB7CiAgICB0aHJvdyBuZXcgTm90SW1wbGVtZW50ZWRFcnJvcigidG90YWxTaXplIiwgeyBjb2xsZWN0aW9uOiB0aGlzLm5hbWUgfSk7CiAgfQogIHRvdGFsSW5kZXhTaXplKCkgewogICAgdGhyb3cgbmV3IE5vdEltcGxlbWVudGVkRXJyb3IoInRvdGFsSW5kZXhTaXplIiwgeyBjb2xsZWN0aW9uOiB0aGlzLm5hbWUgfSk7CiAgfQogIGFzeW5jIHVwZGF0ZShxdWVyeSwgdXBkYXRlcywgb3B0aW9ucykgewogICAgY29uc3QgYyA9IHRoaXMuZmluZChxdWVyeSk7CiAgICBhd2FpdCBjLl9lbnN1cmVJbml0aWFsaXplZCgpOwogICAgaWYgKGF3YWl0IGMuaGFzTmV4dCgpKSB7CiAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMubXVsdGkpIHsKICAgICAgICB3aGlsZSAoYXdhaXQgYy5oYXNOZXh0KCkpIHsKICAgICAgICAgIGNvbnN0IGRvYyA9IGF3YWl0IGMubmV4dCgpOwogICAgICAgICAgY29uc3QgbWF0Y2hJbmZvID0gbWF0Y2hXaXRoQXJyYXlJbmRpY2VzKGRvYywgcXVlcnkpOwogICAgICAgICAgY29uc3QgcG9zaXRpb25hbE1hdGNoSW5mbyA9IG1hdGNoSW5mby5hcnJheUZpbHRlcnM7CiAgICAgICAgICBjb25zdCB1c2VyQXJyYXlGaWx0ZXJzID0gb3B0aW9ucyAmJiBvcHRpb25zLmFycmF5RmlsdGVyczsKICAgICAgICAgIGF3YWl0IHRoaXMudXBkYXRlSW5kZXhlc09uRGVsZXRlKGRvYyk7CiAgICAgICAgICBhcHBseVVwZGF0ZXModXBkYXRlcywgZG9jLCBmYWxzZSwgcG9zaXRpb25hbE1hdGNoSW5mbywgdXNlckFycmF5RmlsdGVycyk7CiAgICAgICAgICBhd2FpdCB0aGlzLmRvY3VtZW50cy5hZGQoZG9jLl9pZC50b1N0cmluZygpLCBkb2MpOwogICAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVJbmRleGVzT25JbnNlcnQoZG9jKTsKICAgICAgICB9CiAgICAgIH0gZWxzZSB7CiAgICAgICAgY29uc3QgZG9jID0gYXdhaXQgYy5uZXh0KCk7CiAgICAgICAgY29uc3QgbWF0Y2hJbmZvID0gbWF0Y2hXaXRoQXJyYXlJbmRpY2VzKGRvYywgcXVlcnkpOwogICAgICAgIGNvbnN0IHBvc2l0aW9uYWxNYXRjaEluZm8gPSBtYXRjaEluZm8uYXJyYXlGaWx0ZXJzOwogICAgICAgIGNvbnN0IHVzZXJBcnJheUZpbHRlcnMgPSBvcHRpb25zICYmIG9wdGlvbnMuYXJyYXlGaWx0ZXJzOwogICAgICAgIGF3YWl0IHRoaXMudXBkYXRlSW5kZXhlc09uRGVsZXRlKGRvYyk7CiAgICAgICAgYXBwbHlVcGRhdGVzKHVwZGF0ZXMsIGRvYywgZmFsc2UsIHBvc2l0aW9uYWxNYXRjaEluZm8sIHVzZXJBcnJheUZpbHRlcnMpOwogICAgICAgIGF3YWl0IHRoaXMuZG9jdW1lbnRzLmFkZChkb2MuX2lkLnRvU3RyaW5nKCksIGRvYyk7CiAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVJbmRleGVzT25JbnNlcnQoZG9jKTsKICAgICAgfQogICAgfSBlbHNlIHsKICAgICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy51cHNlcnQpIHsKICAgICAgICBjb25zdCBuZXdEb2MgPSBjcmVhdGVEb2NGcm9tVXBkYXRlKHF1ZXJ5LCB1cGRhdGVzLCBuZXcgT2JqZWN0SWQoKSk7CiAgICAgICAgYXdhaXQgdGhpcy5kb2N1bWVudHMuYWRkKG5ld0RvYy5faWQudG9TdHJpbmcoKSwgbmV3RG9jKTsKICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZUluZGV4ZXNPbkluc2VydChuZXdEb2MpOwogICAgICB9CiAgICB9CiAgfQogIGFzeW5jIHVwZGF0ZU9uZShxdWVyeSwgdXBkYXRlcywgb3B0aW9ucykgewogICAgY29uc3QgYyA9IHRoaXMuZmluZChxdWVyeSk7CiAgICBhd2FpdCBjLl9lbnN1cmVJbml0aWFsaXplZCgpOwogICAgaWYgKGF3YWl0IGMuaGFzTmV4dCgpKSB7CiAgICAgIGNvbnN0IGRvYyA9IGF3YWl0IGMubmV4dCgpOwogICAgICBjb25zdCBvcmlnaW5hbERvYyA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZG9jKSk7CiAgICAgIGNvbnN0IG1hdGNoSW5mbyA9IG1hdGNoV2l0aEFycmF5SW5kaWNlcyhkb2MsIHF1ZXJ5KTsKICAgICAgY29uc3QgcG9zaXRpb25hbE1hdGNoSW5mbyA9IG1hdGNoSW5mby5hcnJheUZpbHRlcnM7CiAgICAgIGNvbnN0IHVzZXJBcnJheUZpbHRlcnMgPSBvcHRpb25zICYmIG9wdGlvbnMuYXJyYXlGaWx0ZXJzOwogICAgICBhd2FpdCB0aGlzLnVwZGF0ZUluZGV4ZXNPbkRlbGV0ZShkb2MpOwogICAgICBhcHBseVVwZGF0ZXModXBkYXRlcywgZG9jLCBmYWxzZSwgcG9zaXRpb25hbE1hdGNoSW5mbywgdXNlckFycmF5RmlsdGVycyk7CiAgICAgIHRoaXMuZG9jdW1lbnRzLmFkZChkb2MuX2lkLnRvU3RyaW5nKCksIGRvYyk7CiAgICAgIGF3YWl0IHRoaXMudXBkYXRlSW5kZXhlc09uSW5zZXJ0KGRvYyk7CiAgICAgIGNvbnN0IHVwZGF0ZURlc2NyaXB0aW9uID0gdGhpcy5fZ2V0VXBkYXRlRGVzY3JpcHRpb24ob3JpZ2luYWxEb2MsIGRvYyk7CiAgICAgIHRoaXMuZW1pdCgidXBkYXRlIiwgZG9jLCB1cGRhdGVEZXNjcmlwdGlvbik7CiAgICB9IGVsc2UgewogICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnVwc2VydCkgewogICAgICAgIGNvbnN0IG5ld0RvYyA9IGNyZWF0ZURvY0Zyb21VcGRhdGUocXVlcnksIHVwZGF0ZXMsIG5ldyBPYmplY3RJZCgpKTsKICAgICAgICB0aGlzLmRvY3VtZW50cy5hZGQobmV3RG9jLl9pZC50b1N0cmluZygpLCBuZXdEb2MpOwogICAgICAgIGF3YWl0IHRoaXMudXBkYXRlSW5kZXhlc09uSW5zZXJ0KG5ld0RvYyk7CiAgICAgICAgdGhpcy5lbWl0KCJpbnNlcnQiLCBuZXdEb2MpOwogICAgICB9CiAgICB9CiAgfQogIGFzeW5jIHVwZGF0ZU1hbnkocXVlcnksIHVwZGF0ZXMsIG9wdGlvbnMpIHsKICAgIGNvbnN0IGMgPSB0aGlzLmZpbmQocXVlcnkpOwogICAgYXdhaXQgYy5fZW5zdXJlSW5pdGlhbGl6ZWQoKTsKICAgIGlmIChhd2FpdCBjLmhhc05leHQoKSkgewogICAgICB3aGlsZSAoYXdhaXQgYy5oYXNOZXh0KCkpIHsKICAgICAgICBjb25zdCBkb2MgPSBhd2FpdCBjLm5leHQoKTsKICAgICAgICBjb25zdCBvcmlnaW5hbERvYyA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZG9jKSk7CiAgICAgICAgY29uc3QgbWF0Y2hJbmZvID0gbWF0Y2hXaXRoQXJyYXlJbmRpY2VzKGRvYywgcXVlcnkpOwogICAgICAgIGNvbnN0IHBvc2l0aW9uYWxNYXRjaEluZm8gPSBtYXRjaEluZm8uYXJyYXlGaWx0ZXJzOwogICAgICAgIGNvbnN0IHVzZXJBcnJheUZpbHRlcnMgPSBvcHRpb25zICYmIG9wdGlvbnMuYXJyYXlGaWx0ZXJzOwogICAgICAgIGF3YWl0IHRoaXMudXBkYXRlSW5kZXhlc09uRGVsZXRlKGRvYyk7CiAgICAgICAgYXBwbHlVcGRhdGVzKHVwZGF0ZXMsIGRvYywgZmFsc2UsIHBvc2l0aW9uYWxNYXRjaEluZm8sIHVzZXJBcnJheUZpbHRlcnMpOwogICAgICAgIHRoaXMuZG9jdW1lbnRzLmFkZChkb2MuX2lkLnRvU3RyaW5nKCksIGRvYyk7CiAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVJbmRleGVzT25JbnNlcnQoZG9jKTsKICAgICAgICBjb25zdCB1cGRhdGVEZXNjcmlwdGlvbiA9IHRoaXMuX2dldFVwZGF0ZURlc2NyaXB0aW9uKG9yaWdpbmFsRG9jLCBkb2MpOwogICAgICAgIHRoaXMuZW1pdCgidXBkYXRlIiwgZG9jLCB1cGRhdGVEZXNjcmlwdGlvbik7CiAgICAgIH0KICAgIH0gZWxzZSB7CiAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMudXBzZXJ0KSB7CiAgICAgICAgY29uc3QgbmV3RG9jID0gY3JlYXRlRG9jRnJvbVVwZGF0ZShxdWVyeSwgdXBkYXRlcywgbmV3IE9iamVjdElkKCkpOwogICAgICAgIHRoaXMuZG9jdW1lbnRzLmFkZChuZXdEb2MuX2lkLnRvU3RyaW5nKCksIG5ld0RvYyk7CiAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVJbmRleGVzT25JbnNlcnQobmV3RG9jKTsKICAgICAgICB0aGlzLmVtaXQoImluc2VydCIsIG5ld0RvYyk7CiAgICAgIH0KICAgIH0KICB9CiAgdmFsaWRhdGUoKSB7CiAgICB0aHJvdyBuZXcgTm90SW1wbGVtZW50ZWRFcnJvcigidmFsaWRhdGUiLCB7IGNvbGxlY3Rpb246IHRoaXMubmFtZSB9KTsKICB9CiAgLyoqCiAgICogR2VuZXJhdGUgdXBkYXRlRGVzY3JpcHRpb24gZm9yIGNoYW5nZSBldmVudHMKICAgKiBDb21wYXJlcyBvcmlnaW5hbCBhbmQgdXBkYXRlZCBkb2N1bWVudHMgdG8gdHJhY2sgY2hhbmdlcwogICAqLwogIF9nZXRVcGRhdGVEZXNjcmlwdGlvbihvcmlnaW5hbERvYywgdXBkYXRlZERvYykgewogICAgY29uc3QgdXBkYXRlZEZpZWxkcyA9IHt9OwogICAgY29uc3QgcmVtb3ZlZEZpZWxkcyA9IFtdOwogICAgZm9yIChjb25zdCBrZXkgaW4gdXBkYXRlZERvYykgewogICAgICBpZiAoa2V5ID09PSAiX2lkIikgY29udGludWU7CiAgICAgIGlmIChKU09OLnN0cmluZ2lmeShvcmlnaW5hbERvY1trZXldKSAhPT0gSlNPTi5zdHJpbmdpZnkodXBkYXRlZERvY1trZXldKSkgewogICAgICAgIHVwZGF0ZWRGaWVsZHNba2V5XSA9IHVwZGF0ZWREb2Nba2V5XTsKICAgICAgfQogICAgfQogICAgZm9yIChjb25zdCBrZXkgaW4gb3JpZ2luYWxEb2MpIHsKICAgICAgaWYgKGtleSA9PT0gIl9pZCIpIGNvbnRpbnVlOwogICAgICBpZiAoIShrZXkgaW4gdXBkYXRlZERvYykpIHsKICAgICAgICByZW1vdmVkRmllbGRzLnB1c2goa2V5KTsKICAgICAgfQogICAgfQogICAgcmV0dXJuIHsKICAgICAgdXBkYXRlZEZpZWxkcywKICAgICAgcmVtb3ZlZEZpZWxkcywKICAgICAgdHJ1bmNhdGVkQXJyYXlzOiBbXQogICAgICAvLyBOb3QgaW1wbGVtZW50ZWQgaW4gbWljcm8tbW9uZ28KICAgIH07CiAgfQogIC8qKgogICAqIFdhdGNoIGZvciBjaGFuZ2VzIHRvIHRoaXMgY29sbGVjdGlvbgogICAqIEBwYXJhbSB7QXJyYXl9IHBpcGVsaW5lIC0gQWdncmVnYXRpb24gcGlwZWxpbmUgdG8gZmlsdGVyIGNoYW5nZXMKICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIFdhdGNoIG9wdGlvbnMgKGZ1bGxEb2N1bWVudCwgZXRjLikKICAgKiBAcmV0dXJucyB7Q2hhbmdlU3RyZWFtfSBBIGNoYW5nZSBzdHJlYW0gaW5zdGFuY2UKICAgKi8KICB3YXRjaChwaXBlbGluZSA9IFtdLCBvcHRpb25zID0ge30pIHsKICAgIHJldHVybiBuZXcgQ2hhbmdlU3RyZWFtKHRoaXMsIHBpcGVsaW5lLCBvcHRpb25zKTsKICB9Cn0KZnVuY3Rpb24gYXBwbHlQcm9qZWN0aW9uV2l0aEV4cHJlc3Npb25zKHByb2plY3Rpb24sIGRvYykgewogIGNvbnN0IHJlc3VsdCA9IHt9OwogIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhwcm9qZWN0aW9uKTsKICBsZXQgaXNJbmNsdXNpb24gPSBmYWxzZTsKICBsZXQgaGFzQ29tcHV0ZWRGaWVsZHMgPSBmYWxzZTsKICBmb3IgKGNvbnN0IGtleSBvZiBrZXlzKSB7CiAgICBpZiAoa2V5ID09PSAiX2lkIikgY29udGludWU7CiAgICBjb25zdCB2YWx1ZSA9IHByb2plY3Rpb25ba2V5XTsKICAgIGlmICh2YWx1ZSA9PT0gMSB8fCB2YWx1ZSA9PT0gdHJ1ZSkgewogICAgICBpc0luY2x1c2lvbiA9IHRydWU7CiAgICB9IGVsc2UgaWYgKHZhbHVlID09PSAwIHx8IHZhbHVlID09PSBmYWxzZSkgOwogICAgZWxzZSB7CiAgICAgIGhhc0NvbXB1dGVkRmllbGRzID0gdHJ1ZTsKICAgIH0KICB9CiAgaWYgKGhhc0NvbXB1dGVkRmllbGRzIHx8IGlzSW5jbHVzaW9uKSB7CiAgICBpZiAocHJvamVjdGlvbi5faWQgIT09IDAgJiYgcHJvamVjdGlvbi5faWQgIT09IGZhbHNlKSB7CiAgICAgIHJlc3VsdC5faWQgPSBkb2MuX2lkOwogICAgfQogICAgZm9yIChjb25zdCBrZXkgb2Yga2V5cykgewogICAgICBjb25zdCB2YWx1ZSA9IHByb2plY3Rpb25ba2V5XTsKICAgICAgaWYgKGtleSA9PT0gIl9pZCIpIHsKICAgICAgICBpZiAodmFsdWUgPT09IDAgfHwgdmFsdWUgPT09IGZhbHNlKSB7CiAgICAgICAgICBkZWxldGUgcmVzdWx0Ll9pZDsKICAgICAgICB9CiAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT09IDEgfHwgdmFsdWUgPT09IHRydWUpIHsKICAgICAgICByZXN1bHRba2V5XSA9IGdldFByb3AoZG9jLCBrZXkpOwogICAgICB9IGVsc2UgewogICAgICAgIHJlc3VsdFtrZXldID0gZXZhbHVhdGVFeHByZXNzaW9uKHZhbHVlLCBkb2MpOwogICAgICB9CiAgICB9CiAgfSBlbHNlIHsKICAgIGZvciAoY29uc3Qga2V5IGluIGRvYykgewogICAgICBpZiAoZG9jLmhhc093blByb3BlcnR5KGtleSkpIHsKICAgICAgICByZXN1bHRba2V5XSA9IGRvY1trZXldOwogICAgICB9CiAgICB9CiAgICBmb3IgKGNvbnN0IGtleSBvZiBrZXlzKSB7CiAgICAgIGlmIChwcm9qZWN0aW9uW2tleV0gPT09IDAgfHwgcHJvamVjdGlvbltrZXldID09PSBmYWxzZSkgewogICAgICAgIGRlbGV0ZSByZXN1bHRba2V5XTsKICAgICAgfQogICAgfQogIH0KICByZXR1cm4gcmVzdWx0Owp9CmNsYXNzIERCIHsKICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7CiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHt9OwogICAgdGhpcy5iYXNlRm9sZGVyID0gdGhpcy5vcHRpb25zLmJhc2VGb2xkZXIgfHwgIm1pY3JvLW1vbmdvIjsKICAgIHRoaXMuZGJOYW1lID0gdGhpcy5vcHRpb25zLmRiTmFtZSB8fCAiZGVmYXVsdCI7CiAgICB0aGlzLmRiRm9sZGVyID0gYCR7dGhpcy5iYXNlRm9sZGVyfS8ke3RoaXMuZGJOYW1lfWA7CiAgICB0aGlzLmNvbGxlY3Rpb25zID0gLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKTsKICAgIGNvbnN0IHByb3h5ID0gbmV3IFByb3h5KHRoaXMsIHsKICAgICAgZ2V0KHRhcmdldCwgcHJvcGVydHksIHJlY2VpdmVyKSB7CiAgICAgICAgaWYgKHByb3BlcnR5IGluIHRhcmdldCkgewogICAgICAgICAgcmV0dXJuIFJlZmxlY3QuZ2V0KHRhcmdldCwgcHJvcGVydHksIHJlY2VpdmVyKTsKICAgICAgICB9CiAgICAgICAgaWYgKHR5cGVvZiBwcm9wZXJ0eSA9PT0gInN5bWJvbCIgfHwgcHJvcGVydHkuc3RhcnRzV2l0aCgiXyIpKSB7CiAgICAgICAgICByZXR1cm4gdm9pZCAwOwogICAgICAgIH0KICAgICAgICBpZiAodHlwZW9mIHByb3BlcnR5ID09PSAic3RyaW5nIikgewogICAgICAgICAgcmV0dXJuIHRhcmdldC5nZXRDb2xsZWN0aW9uKHByb3BlcnR5KTsKICAgICAgICB9CiAgICAgICAgcmV0dXJuIHZvaWQgMDsKICAgICAgfQogICAgfSk7CiAgICB0aGlzLl9wcm94eSA9IHByb3h5OwogICAgcmV0dXJuIHByb3h5OwogIH0KICAvKioKICAgKiBDbG9zZSBhbGwgY29sbGVjdGlvbnMKICAgKi8KICBhc3luYyBjbG9zZSgpIHsKICAgIGZvciAoY29uc3QgW18sIGNvbGxlY3Rpb25dIG9mIHRoaXMuY29sbGVjdGlvbnMpIHsKICAgICAgYXdhaXQgY29sbGVjdGlvbi5jbG9zZSgpOwogICAgfQogIH0KICAvLyBEQiBNZXRob2RzCiAgY2xvbmVDb2xsZWN0aW9uKCkgewogICAgdGhyb3cgbmV3IE5vdEltcGxlbWVudGVkRXJyb3IoImNsb25lQ29sbGVjdGlvbiIsIHsgZGF0YWJhc2U6IHRoaXMuZGJOYW1lIH0pOwogIH0KICBjbG9uZURhdGFiYXNlKCkgewogICAgdGhyb3cgbmV3IE5vdEltcGxlbWVudGVkRXJyb3IoImNsb25lRGF0YWJhc2UiLCB7IGRhdGFiYXNlOiB0aGlzLmRiTmFtZSB9KTsKICB9CiAgY29tbWFuZEhlbHAoKSB7CiAgICB0aHJvdyBuZXcgTm90SW1wbGVtZW50ZWRFcnJvcigiY29tbWFuZEhlbHAiLCB7IGRhdGFiYXNlOiB0aGlzLmRiTmFtZSB9KTsKICB9CiAgY29weURhdGFiYXNlKCkgewogICAgdGhyb3cgbmV3IE5vdEltcGxlbWVudGVkRXJyb3IoImNvcHlEYXRhYmFzZSIsIHsgZGF0YWJhc2U6IHRoaXMuZGJOYW1lIH0pOwogIH0KICBjcmVhdGVDb2xsZWN0aW9uKG5hbWUpIHsKICAgIGlmICghdGhpcy5jb2xsZWN0aW9ucy5oYXMobmFtZSkpIHsKICAgICAgdGhpcy5jb2xsZWN0aW9ucy5zZXQobmFtZSwgbmV3IENvbGxlY3Rpb24odGhpcywgbmFtZSkpOwogICAgfQogICAgcmV0dXJuIHsgb2s6IDEgfTsKICB9CiAgY3VycmVudE9wKCkgewogICAgdGhyb3cgbmV3IE5vdEltcGxlbWVudGVkRXJyb3IoImN1cnJlbnRPcCIsIHsgZGF0YWJhc2U6IHRoaXMuZGJOYW1lIH0pOwogIH0KICBhc3luYyBkcm9wQ29sbGVjdGlvbihjb2xsZWN0aW9uTmFtZSkgewogICAgaWYgKHRoaXMuY29sbGVjdGlvbnMuaGFzKGNvbGxlY3Rpb25OYW1lKSkgewogICAgICBjb25zdCBjb2xsZWN0aW9uID0gdGhpcy5jb2xsZWN0aW9ucy5nZXQoY29sbGVjdGlvbk5hbWUpOwogICAgICBpZiAodHlwZW9mIGNvbGxlY3Rpb24uZHJvcCA9PT0gImZ1bmN0aW9uIikgewogICAgICAgIGF3YWl0IGNvbGxlY3Rpb24uZHJvcCgpOwogICAgICB9CiAgICAgIHRoaXMuY29sbGVjdGlvbnMuZGVsZXRlKGNvbGxlY3Rpb25OYW1lKTsKICAgIH0KICB9CiAgYXN5bmMgZHJvcERhdGFiYXNlKCkgewogICAgZm9yIChjb25zdCBbXywgY29sbGVjdGlvbl0gb2YgdGhpcy5jb2xsZWN0aW9ucykgewogICAgICBhd2FpdCBjb2xsZWN0aW9uLmRyb3AoKTsKICAgIH0KICAgIHRoaXMuY29sbGVjdGlvbnMuY2xlYXIoKTsKICAgIGNvbnN0IHBhdGhQYXJ0cyA9IHRoaXMuZGJGb2xkZXIuc3BsaXQoIi8iKS5maWx0ZXIoQm9vbGVhbik7CiAgICBjb25zdCBkYkZvbGRlciA9IHBhdGhQYXJ0cy5wb3AoKTsKICAgIHRyeSB7CiAgICAgIGxldCBkaXIgPSBhd2FpdCBnbG9iYWxUaGlzLm5hdmlnYXRvci5zdG9yYWdlLmdldERpcmVjdG9yeSgpOwogICAgICBmb3IgKGNvbnN0IHBhcnQgb2YgcGF0aFBhcnRzKSB7CiAgICAgICAgZGlyID0gYXdhaXQgZGlyLmdldERpcmVjdG9yeUhhbmRsZShwYXJ0LCB7IGNyZWF0ZTogZmFsc2UgfSk7CiAgICAgIH0KICAgICAgYXdhaXQgZGlyLnJlbW92ZUVudHJ5KGRiRm9sZGVyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTsKICAgIH0gY2F0Y2ggKGVycm9yKSB7CiAgICAgIGlmIChlcnJvci5uYW1lICE9PSAiTm90Rm91bmRFcnJvciIgJiYgZXJyb3IuY29kZSAhPT0gIkVOT0VOVCIpIHsKICAgICAgICB0aHJvdyBlcnJvcjsKICAgICAgfQogICAgfQogICAgcmV0dXJuIHsgb2s6IDEgfTsKICB9CiAgZXZhbCgpIHsKICAgIHRocm93IG5ldyBOb3RJbXBsZW1lbnRlZEVycm9yKCJldmFsIiwgeyBkYXRhYmFzZTogdGhpcy5kYk5hbWUgfSk7CiAgfQogIGZzeW5jTG9jaygpIHsKICAgIHRocm93IG5ldyBOb3RJbXBsZW1lbnRlZEVycm9yKCJmc3luY0xvY2siLCB7IGRhdGFiYXNlOiB0aGlzLmRiTmFtZSB9KTsKICB9CiAgZnN5bmNVbmxvY2soKSB7CiAgICB0aHJvdyBuZXcgTm90SW1wbGVtZW50ZWRFcnJvcigiZnN5bmNVbmxvY2siLCB7IGRhdGFiYXNlOiB0aGlzLmRiTmFtZSB9KTsKICB9CiAgZ2V0Q29sbGVjdGlvbihuYW1lKSB7CiAgICBpZiAoIXRoaXMuY29sbGVjdGlvbnMuaGFzKG5hbWUpKSB7CiAgICAgIGNvbnN0IGRiUmVmID0gdGhpcy5fcHJveHkgfHwgdGhpczsKICAgICAgdGhpcy5jb2xsZWN0aW9ucy5zZXQobmFtZSwgbmV3IENvbGxlY3Rpb24oZGJSZWYsIG5hbWUpKTsKICAgIH0KICAgIHJldHVybiB0aGlzLmNvbGxlY3Rpb25zLmdldChuYW1lKTsKICB9CiAgLy8gQWxpYXMgZm9yIGdldENvbGxlY3Rpb24gZm9yIE1vbmdvREIgQVBJIGNvbXBhdGliaWxpdHkKICBjb2xsZWN0aW9uKG5hbWUpIHsKICAgIHJldHVybiB0aGlzLmdldENvbGxlY3Rpb24obmFtZSk7CiAgfQogIGdldENvbGxlY3Rpb25JbmZvcygpIHsKICAgIHRocm93IG5ldyBOb3RJbXBsZW1lbnRlZEVycm9yKCJnZXRDb2xsZWN0aW9uSW5mb3MiLCB7IGRhdGFiYXNlOiB0aGlzLmRiTmFtZSB9KTsKICB9CiAgZ2V0Q29sbGVjdGlvbk5hbWVzKCkgewogICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5jb2xsZWN0aW9ucy5rZXlzKCkpOwogIH0KICBnZXRMYXN0RXJyb3IoKSB7CiAgICB0aHJvdyBuZXcgTm90SW1wbGVtZW50ZWRFcnJvcigiZ2V0TGFzdEVycm9yIiwgeyBkYXRhYmFzZTogdGhpcy5kYk5hbWUgfSk7CiAgfQogIGdldExhc3RFcnJvck9iaigpIHsKICAgIHRocm93IG5ldyBOb3RJbXBsZW1lbnRlZEVycm9yKCJnZXRMYXN0RXJyb3JPYmoiLCB7IGRhdGFiYXNlOiB0aGlzLmRiTmFtZSB9KTsKICB9CiAgZ2V0TG9nQ29tcG9uZW50cygpIHsKICAgIHRocm93IG5ldyBOb3RJbXBsZW1lbnRlZEVycm9yKCJnZXRMb2dDb21wb25lbnRzIiwgeyBkYXRhYmFzZTogdGhpcy5kYk5hbWUgfSk7CiAgfQogIGdldE1vbmdvKCkgewogICAgdGhyb3cgbmV3IE5vdEltcGxlbWVudGVkRXJyb3IoImdldE1vbmdvIiwgeyBkYXRhYmFzZTogdGhpcy5kYk5hbWUgfSk7CiAgfQogIGdldE5hbWUoKSB7CiAgICB0aHJvdyBuZXcgTm90SW1wbGVtZW50ZWRFcnJvcigiZ2V0TmFtZSIsIHsgZGF0YWJhc2U6IHRoaXMuZGJOYW1lIH0pOwogIH0KICBnZXRQcmV2RXJyb3IoKSB7CiAgICB0aHJvdyBuZXcgTm90SW1wbGVtZW50ZWRFcnJvcigiZ2V0UHJldkVycm9yIiwgeyBkYXRhYmFzZTogdGhpcy5kYk5hbWUgfSk7CiAgfQogIGdldFByb2ZpbGluZ0xldmVsKCkgewogICAgdGhyb3cgbmV3IE5vdEltcGxlbWVudGVkRXJyb3IoImdldFByb2ZpbGluZ0xldmVsIiwgeyBkYXRhYmFzZTogdGhpcy5kYk5hbWUgfSk7CiAgfQogIGdldFByb2ZpbGluZ1N0YXR1cygpIHsKICAgIHRocm93IG5ldyBOb3RJbXBsZW1lbnRlZEVycm9yKCJnZXRQcm9maWxpbmdTdGF0dXMiLCB7IGRhdGFiYXNlOiB0aGlzLmRiTmFtZSB9KTsKICB9CiAgZ2V0UmVwbGljYXRpb25JbmZvKCkgewogICAgdGhyb3cgbmV3IE5vdEltcGxlbWVudGVkRXJyb3IoImdldFJlcGxpY2F0aW9uSW5mbyIsIHsgZGF0YWJhc2U6IHRoaXMuZGJOYW1lIH0pOwogIH0KICBnZXRTaWJsaW5nREIoKSB7CiAgICB0aHJvdyBuZXcgTm90SW1wbGVtZW50ZWRFcnJvcigiZ2V0U2libGluZ0RCIiwgeyBkYXRhYmFzZTogdGhpcy5kYk5hbWUgfSk7CiAgfQogIGhlbHAoKSB7CiAgICBjb25zb2xlLmxvZygiICAgICAgICBoZWxwIG1yICAgICAgICAgICAgICAgICAgICAgIG1hcHJlZHVjZSIpOwogICAgY29uc29sZS5sb2coIiAgICAgICAgZGIuZm9vLmZpbmQoKSAgICAgICAgICAgICAgICBsaXN0IG9iamVjdHMgaW4gY29sbGVjdGlvbiBmb28iKTsKICAgIGNvbnNvbGUubG9nKCIgICAgICAgIGRiLmZvby5maW5kKCB7IGEgOiAxIH0gKSAgICAgbGlzdCBvYmplY3RzIGluIGZvbyB3aGVyZSBhID09IDEiKTsKICAgIGNvbnNvbGUubG9nKCIgICAgICAgIGl0ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0IG9mIHRoZSBsYXN0IGxpbmUgZXZhbHVhdGVkOyB1c2UgdG8gZnVydGhlciBpdGVyYXRlIik7CiAgfQogIGhvc3RJbmZvKCkgewogICAgdGhyb3cgbmV3IE5vdEltcGxlbWVudGVkRXJyb3IoImhvc3RJbmZvIiwgeyBkYXRhYmFzZTogdGhpcy5kYk5hbWUgfSk7CiAgfQogIGlzTWFzdGVyKCkgewogICAgdGhyb3cgbmV3IE5vdEltcGxlbWVudGVkRXJyb3IoImlzTWFzdGVyIiwgeyBkYXRhYmFzZTogdGhpcy5kYk5hbWUgfSk7CiAgfQogIGtpbGxPcCgpIHsKICAgIHRocm93IG5ldyBOb3RJbXBsZW1lbnRlZEVycm9yKCJraWxsT3AiLCB7IGRhdGFiYXNlOiB0aGlzLmRiTmFtZSB9KTsKICB9CiAgbGlzdENvbW1hbmRzKCkgewogICAgdGhyb3cgbmV3IE5vdEltcGxlbWVudGVkRXJyb3IoImxpc3RDb21tYW5kcyIsIHsgZGF0YWJhc2U6IHRoaXMuZGJOYW1lIH0pOwogIH0KICBsb2FkU2VydmVyU2NyaXB0cygpIHsKICAgIHRocm93IG5ldyBOb3RJbXBsZW1lbnRlZEVycm9yKCJsb2FkU2VydmVyU2NyaXB0cyIsIHsgZGF0YWJhc2U6IHRoaXMuZGJOYW1lIH0pOwogIH0KICBsb2dvdXQoKSB7CiAgICB0aHJvdyBuZXcgTm90SW1wbGVtZW50ZWRFcnJvcigibG9nb3V0IiwgeyBkYXRhYmFzZTogdGhpcy5kYk5hbWUgfSk7CiAgfQogIHByaW50Q29sbGVjdGlvblN0YXRzKCkgewogICAgdGhyb3cgbmV3IE5vdEltcGxlbWVudGVkRXJyb3IoInByaW50Q29sbGVjdGlvblN0YXRzIiwgeyBkYXRhYmFzZTogdGhpcy5kYk5hbWUgfSk7CiAgfQogIHByaW50UmVwbGljYXRpb25JbmZvKCkgewogICAgdGhyb3cgbmV3IE5vdEltcGxlbWVudGVkRXJyb3IoInByaW50UmVwbGljYXRpb25JbmZvIiwgeyBkYXRhYmFzZTogdGhpcy5kYk5hbWUgfSk7CiAgfQogIHByaW50U2hhcmRpbmdTdGF0dXMoKSB7CiAgICB0aHJvdyBuZXcgTm90SW1wbGVtZW50ZWRFcnJvcigicHJpbnRTaGFyZGluZ1N0YXR1cyIsIHsgZGF0YWJhc2U6IHRoaXMuZGJOYW1lIH0pOwogIH0KICBwcmludFNsYXZlUmVwbGljYXRpb25JbmZvKCkgewogICAgdGhyb3cgbmV3IE5vdEltcGxlbWVudGVkRXJyb3IoInByaW50U2xhdmVSZXBsaWNhdGlvbkluZm8iLCB7IGRhdGFiYXNlOiB0aGlzLmRiTmFtZSB9KTsKICB9CiAgcmVwYWlyRGF0YWJhc2UoKSB7CiAgICB0aHJvdyBuZXcgTm90SW1wbGVtZW50ZWRFcnJvcigicmVwYWlyRGF0YWJhc2UiLCB7IGRhdGFiYXNlOiB0aGlzLmRiTmFtZSB9KTsKICB9CiAgcmVzZXRFcnJvcigpIHsKICAgIHRocm93IG5ldyBOb3RJbXBsZW1lbnRlZEVycm9yKCJyZXNldEVycm9yIiwgeyBkYXRhYmFzZTogdGhpcy5kYk5hbWUgfSk7CiAgfQogIHJ1bkNvbW1hbmQoKSB7CiAgICB0aHJvdyBuZXcgTm90SW1wbGVtZW50ZWRFcnJvcigicnVuQ29tbWFuZCIsIHsgZGF0YWJhc2U6IHRoaXMuZGJOYW1lIH0pOwogIH0KICBzZXJ2ZXJCdWlsZEluZm8oKSB7CiAgICB0aHJvdyBuZXcgTm90SW1wbGVtZW50ZWRFcnJvcigic2VydmVyQnVpbGRJbmZvIiwgeyBkYXRhYmFzZTogdGhpcy5kYk5hbWUgfSk7CiAgfQogIHNlcnZlckNtZExpbmVPcHRzKCkgewogICAgdGhyb3cgbmV3IE5vdEltcGxlbWVudGVkRXJyb3IoInNlcnZlckNtZExpbmVPcHRzIiwgeyBkYXRhYmFzZTogdGhpcy5kYk5hbWUgfSk7CiAgfQogIHNlcnZlclN0YXR1cygpIHsKICAgIHRocm93IG5ldyBOb3RJbXBsZW1lbnRlZEVycm9yKCJzZXJ2ZXJTdGF0dXMiLCB7IGRhdGFiYXNlOiB0aGlzLmRiTmFtZSB9KTsKICB9CiAgc2V0TG9nTGV2ZWwoKSB7CiAgICB0aHJvdyBuZXcgTm90SW1wbGVtZW50ZWRFcnJvcigic2V0TG9nTGV2ZWwiLCB7IGRhdGFiYXNlOiB0aGlzLmRiTmFtZSB9KTsKICB9CiAgc2V0UHJvZmlsaW5nTGV2ZWwoKSB7CiAgICB0aHJvdyBuZXcgTm90SW1wbGVtZW50ZWRFcnJvcigic2V0UHJvZmlsaW5nTGV2ZWwiLCB7IGRhdGFiYXNlOiB0aGlzLmRiTmFtZSB9KTsKICB9CiAgc2h1dGRvd25TZXJ2ZXIoKSB7CiAgICB0aHJvdyBuZXcgTm90SW1wbGVtZW50ZWRFcnJvcigic2h1dGRvd25TZXJ2ZXIiLCB7IGRhdGFiYXNlOiB0aGlzLmRiTmFtZSB9KTsKICB9CiAgc3RhdHMoKSB7CiAgICB0aHJvdyBuZXcgTm90SW1wbGVtZW50ZWRFcnJvcigic3RhdHMiLCB7IGRhdGFiYXNlOiB0aGlzLmRiTmFtZSB9KTsKICB9CiAgdmVyc2lvbigpIHsKICAgIHRocm93IG5ldyBOb3RJbXBsZW1lbnRlZEVycm9yKCJ2ZXJzaW9uIiwgeyBkYXRhYmFzZTogdGhpcy5kYk5hbWUgfSk7CiAgfQogIHVwZ3JhZGVDaGVjaygpIHsKICAgIHRocm93IG5ldyBOb3RJbXBsZW1lbnRlZEVycm9yKCJ1cGdyYWRlQ2hlY2siLCB7IGRhdGFiYXNlOiB0aGlzLmRiTmFtZSB9KTsKICB9CiAgdXBncmFkZUNoZWNrQWxsREJzKCkgewogICAgdGhyb3cgbmV3IE5vdEltcGxlbWVudGVkRXJyb3IoInVwZ3JhZGVDaGVja0FsbERCcyIsIHsgZGF0YWJhc2U6IHRoaXMuZGJOYW1lIH0pOwogIH0KICAvKioKICAgKiBXYXRjaCBmb3IgY2hhbmdlcyBhY3Jvc3MgYWxsIGNvbGxlY3Rpb25zIGluIHRoaXMgZGF0YWJhc2UKICAgKiBAcGFyYW0ge0FycmF5fSBwaXBlbGluZSAtIEFnZ3JlZ2F0aW9uIHBpcGVsaW5lIHRvIGZpbHRlciBjaGFuZ2VzCiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBXYXRjaCBvcHRpb25zCiAgICogQHJldHVybnMge0NoYW5nZVN0cmVhbX0gQSBjaGFuZ2Ugc3RyZWFtIGluc3RhbmNlCiAgICovCiAgd2F0Y2gocGlwZWxpbmUgPSBbXSwgb3B0aW9ucyA9IHt9KSB7CiAgICByZXR1cm4gbmV3IENoYW5nZVN0cmVhbSh0aGlzLCBwaXBlbGluZSwgb3B0aW9ucyk7CiAgfQp9CmNsYXNzIFNlcnZlciB7CiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9LCBwb3N0RXZlbnQgPSAoKSA9PiB7CiAgfSkgewogICAgdGhpcy5vcHRpb25zID0gb3B0aW9uczsKICAgIHRoaXMuZGF0YWJhc2VzID0gLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKTsKICAgIHRoaXMucG9zdEV2ZW50ID0gcG9zdEV2ZW50OwogICAgdGhpcy5jdXJzb3JzID0gLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKTsKICAgIHRoaXMuY3Vyc29yQ291bnRlciA9IDE7CiAgICB0aGlzLnN0cmVhbXMgPSAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpOwogICAgdGhpcy5zdHJlYW1Db3VudGVyID0gMTsKICB9CiAgYXN5bmMgZGlzcGF0Y2gocmVxdWVzdCkgewogICAgY29uc3QgeyB0YXJnZXQsIGRhdGFiYXNlLCBjb2xsZWN0aW9uLCBtZXRob2QsIGFyZ3MgPSBbXSwgY3Vyc29ySWQsIHN0cmVhbUlkLCBjdXJzb3JPcHRzIH0gPSByZXF1ZXN0OwogICAgaWYgKHRhcmdldCA9PT0gImN1cnNvciIpIHsKICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuX2N1cnNvck9wKGN1cnNvcklkLCBtZXRob2QsIGFyZ3MpOwogICAgfQogICAgaWYgKHRhcmdldCA9PT0gImNoYW5nZXN0cmVhbSIpIHsKICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuX2NoYW5nZVN0cmVhbU9wKHN0cmVhbUlkLCBtZXRob2QsIGFyZ3MpOwogICAgfQogICAgaWYgKHRhcmdldCA9PT0gImNsaWVudCIpIHsKICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuX2NhbGwodGhpcywgbWV0aG9kLCBhcmdzKTsKICAgIH0KICAgIGlmICghdGFyZ2V0IHx8ICFkYXRhYmFzZSB8fCAhbWV0aG9kKSB7CiAgICAgIHRocm93IG5ldyBFcnJvcigiSW52YWxpZCByZXF1ZXN0IHBheWxvYWQiKTsKICAgIH0KICAgIGNvbnN0IGRiID0gdGhpcy5fZ2V0REIoZGF0YWJhc2UpOwogICAgaWYgKHRhcmdldCA9PT0gImRiIikgewogICAgICByZXR1cm4gYXdhaXQgdGhpcy5fY2FsbChkYiwgbWV0aG9kLCBhcmdzKTsKICAgIH0KICAgIGlmICh0YXJnZXQgPT09ICJjb2xsZWN0aW9uIikgewogICAgICBpZiAoIWNvbGxlY3Rpb24pIHsKICAgICAgICB0aHJvdyBuZXcgRXJyb3IoIkNvbGxlY3Rpb24gbmFtZSByZXF1aXJlZCBmb3IgY29sbGVjdGlvbiB0YXJnZXQiKTsKICAgICAgfQogICAgICBjb25zdCBjb2wgPSBkYi5jb2xsZWN0aW9uKGNvbGxlY3Rpb24pOwogICAgICByZXR1cm4gYXdhaXQgdGhpcy5fY2FsbChjb2wsIG1ldGhvZCwgYXJncywgY3Vyc29yT3B0cyk7CiAgICB9CiAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gdGFyZ2V0OiAke3RhcmdldH1gKTsKICB9CiAgX2dldERCKGRiTmFtZSkgewogICAgaWYgKHRoaXMuZGF0YWJhc2VzLmhhcyhkYk5hbWUpKSByZXR1cm4gdGhpcy5kYXRhYmFzZXMuZ2V0KGRiTmFtZSk7CiAgICBjb25zdCBkYiA9IG5ldyBEQih7IC4uLnRoaXMub3B0aW9ucywgZGJOYW1lIH0pOwogICAgdGhpcy5kYXRhYmFzZXMuc2V0KGRiTmFtZSwgZGIpOwogICAgcmV0dXJuIGRiOwogIH0KICBhc3luYyBfY2FsbCh0YXJnZXQsIG1ldGhvZCwgYXJncywgY3Vyc29yT3B0cykgewogICAgaWYgKHR5cGVvZiB0YXJnZXRbbWV0aG9kXSAhPT0gImZ1bmN0aW9uIikgewogICAgICB0aHJvdyBuZXcgRXJyb3IoYE1ldGhvZCAke21ldGhvZH0gbm90IGZvdW5kIG9uIHRhcmdldGApOwogICAgfQogICAgY29uc3QgcmVzdWx0ID0gdGFyZ2V0W21ldGhvZF0oLi4uYXJncyB8fCBbXSk7CiAgICBjb25zdCBhd2FpdGVkID0gcmVzdWx0ICYmIHR5cGVvZiByZXN1bHQudGhlbiA9PT0gImZ1bmN0aW9uIiA/IGF3YWl0IHJlc3VsdCA6IHJlc3VsdDsKICAgIGlmIChhd2FpdGVkICYmIHR5cGVvZiBhd2FpdGVkLmhhc05leHQgPT09ICJmdW5jdGlvbiIgJiYgdHlwZW9mIGF3YWl0ZWQubmV4dCA9PT0gImZ1bmN0aW9uIikgewogICAgICByZXR1cm4gYXdhaXQgdGhpcy5fcmVnaXN0ZXJDdXJzb3IoYXdhaXRlZCwgY3Vyc29yT3B0cyk7CiAgICB9CiAgICBpZiAobWV0aG9kID09PSAiYWdncmVnYXRlIiAmJiBBcnJheS5pc0FycmF5KGF3YWl0ZWQpKSB7CiAgICAgIHJldHVybiBhd2FpdCB0aGlzLl9yZWdpc3RlckFycmF5QXNDdXJzb3IoYXdhaXRlZCk7CiAgICB9CiAgICBpZiAoYXdhaXRlZCAmJiBhd2FpdGVkLmNvbnN0cnVjdG9yPy5uYW1lID09PSAiQ2hhbmdlU3RyZWFtIikgewogICAgICByZXR1cm4gdGhpcy5fcmVnaXN0ZXJDaGFuZ2VTdHJlYW0oYXdhaXRlZCk7CiAgICB9CiAgICByZXR1cm4gYXdhaXRlZDsKICB9CiAgYXN5bmMgX3JlZ2lzdGVyQ3Vyc29yKGN1cnNvciwgY3Vyc29yT3B0cyA9IHt9KSB7CiAgICBpZiAoY3Vyc29yT3B0cy5zb3J0KSBjdXJzb3IgPSBjdXJzb3Iuc29ydChjdXJzb3JPcHRzLnNvcnQpOwogICAgaWYgKGN1cnNvck9wdHMuc2tpcCkgY3Vyc29yID0gYXdhaXQgY3Vyc29yLnNraXAoY3Vyc29yT3B0cy5za2lwKTsKICAgIGlmIChjdXJzb3JPcHRzLmxpbWl0KSBjdXJzb3IgPSBhd2FpdCBjdXJzb3IubGltaXQoY3Vyc29yT3B0cy5saW1pdCk7CiAgICBpZiAoY3Vyc29yT3B0cy5taW4gJiYgY3Vyc29yLm1pbikgY3Vyc29yID0gY3Vyc29yLm1pbihjdXJzb3JPcHRzLm1pbik7CiAgICBpZiAoY3Vyc29yT3B0cy5tYXggJiYgY3Vyc29yLm1heCkgY3Vyc29yID0gY3Vyc29yLm1heChjdXJzb3JPcHRzLm1heCk7CiAgICBpZiAoY3Vyc29yT3B0cy5oaW50ICYmIGN1cnNvci5oaW50KSBjdXJzb3IgPSBjdXJzb3IuaGludChjdXJzb3JPcHRzLmhpbnQpOwogICAgaWYgKGN1cnNvck9wdHMuY29tbWVudCAmJiBjdXJzb3IuY29tbWVudCkgY3Vyc29yID0gY3Vyc29yLmNvbW1lbnQoY3Vyc29yT3B0cy5jb21tZW50KTsKICAgIGlmIChjdXJzb3JPcHRzLm1heFRpbWVNUyAmJiBjdXJzb3IubWF4VGltZU1TKSBjdXJzb3IgPSBjdXJzb3IubWF4VGltZU1TKGN1cnNvck9wdHMubWF4VGltZU1TKTsKICAgIGlmIChjdXJzb3JPcHRzLm1heFNjYW4gJiYgY3Vyc29yLm1heFNjYW4pIGN1cnNvciA9IGN1cnNvci5tYXhTY2FuKGN1cnNvck9wdHMubWF4U2Nhbik7CiAgICBpZiAoY3Vyc29yT3B0cy5yZXR1cm5LZXkgJiYgY3Vyc29yLnJldHVybktleSkgY3Vyc29yID0gY3Vyc29yLnJldHVybktleShjdXJzb3JPcHRzLnJldHVybktleSk7CiAgICBpZiAoY3Vyc29yT3B0cy5zaG93UmVjb3JkSWQgJiYgY3Vyc29yLnNob3dSZWNvcmRJZCkgY3Vyc29yID0gY3Vyc29yLnNob3dSZWNvcmRJZChjdXJzb3JPcHRzLnNob3dSZWNvcmRJZCk7CiAgICBpZiAoY3Vyc29yT3B0cy5jb2xsYXRpb24gJiYgY3Vyc29yLmNvbGxhdGlvbikgY3Vyc29yID0gY3Vyc29yLmNvbGxhdGlvbihjdXJzb3JPcHRzLmNvbGxhdGlvbik7CiAgICBjb25zdCBpZCA9IGBjdXJfJHt0aGlzLmN1cnNvckNvdW50ZXIrK31gOwogICAgY29uc3QgYmF0Y2hTaXplID0gdGhpcy5vcHRpb25zLmJhdGNoU2l6ZSB8fCAxMDA7CiAgICBjb25zdCBiYXRjaCA9IFtdOwogICAgd2hpbGUgKGJhdGNoLmxlbmd0aCA8IGJhdGNoU2l6ZSAmJiBhd2FpdCBjdXJzb3IuaGFzTmV4dCgpKSB7CiAgICAgIGJhdGNoLnB1c2goYXdhaXQgY3Vyc29yLm5leHQoKSk7CiAgICB9CiAgICBjb25zdCBleGhhdXN0ZWQgPSAhYXdhaXQgY3Vyc29yLmhhc05leHQoKTsKICAgIGlmICghZXhoYXVzdGVkKSB7CiAgICAgIHRoaXMuY3Vyc29ycy5zZXQoaWQsIGN1cnNvcik7CiAgICB9CiAgICByZXR1cm4geyBjdXJzb3JJZDogaWQsIGJhdGNoLCBleGhhdXN0ZWQsIGJhdGNoU2l6ZSB9OwogIH0KICBhc3luYyBfcmVnaXN0ZXJBcnJheUFzQ3Vyc29yKHJlc3VsdHNBcnJheSkgewogICAgY29uc3QgaWQgPSBgY3VyXyR7dGhpcy5jdXJzb3JDb3VudGVyKyt9YDsKICAgIGNvbnN0IGJhdGNoU2l6ZSA9IHRoaXMub3B0aW9ucy5iYXRjaFNpemUgfHwgMTAwOwogICAgY29uc3QgYmF0Y2ggPSByZXN1bHRzQXJyYXkuc2xpY2UoMCwgYmF0Y2hTaXplKTsKICAgIGNvbnN0IGV4aGF1c3RlZCA9IHJlc3VsdHNBcnJheS5sZW5ndGggPD0gYmF0Y2hTaXplOwogICAgaWYgKCFleGhhdXN0ZWQpIHsKICAgICAgY29uc3QgY3Vyc29yID0gewogICAgICAgIHBvc2l0aW9uOiBiYXRjaFNpemUsCiAgICAgICAgYXJyYXk6IHJlc3VsdHNBcnJheSwKICAgICAgICBhc3luYyBoYXNOZXh0KCkgewogICAgICAgICAgcmV0dXJuIHRoaXMucG9zaXRpb24gPCB0aGlzLmFycmF5Lmxlbmd0aDsKICAgICAgICB9LAogICAgICAgIGFzeW5jIG5leHQoKSB7CiAgICAgICAgICBpZiAodGhpcy5wb3NpdGlvbiA+PSB0aGlzLmFycmF5Lmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKCJObyBtb3JlIGRvY3VtZW50cyIpOwogICAgICAgICAgcmV0dXJuIHRoaXMuYXJyYXlbdGhpcy5wb3NpdGlvbisrXTsKICAgICAgICB9CiAgICAgIH07CiAgICAgIHRoaXMuY3Vyc29ycy5zZXQoaWQsIGN1cnNvcik7CiAgICB9CiAgICByZXR1cm4geyBjdXJzb3JJZDogaWQsIGJhdGNoLCBleGhhdXN0ZWQsIGJhdGNoU2l6ZSB9OwogIH0KICBhc3luYyBfY3Vyc29yT3AoY3Vyc29ySWQsIG1ldGhvZCwgYXJncyA9IFtdKSB7CiAgICBpZiAoIWN1cnNvcklkKSB0aHJvdyBuZXcgRXJyb3IoImN1cnNvcklkIHJlcXVpcmVkIik7CiAgICBjb25zdCBjdXJzb3IgPSB0aGlzLmN1cnNvcnMuZ2V0KGN1cnNvcklkKTsKICAgIGlmICghY3Vyc29yKSB7CiAgICAgIGlmIChtZXRob2QgPT09ICJjbG9zZSIpIHJldHVybiB7IGNsb3NlZDogdHJ1ZSB9OwogICAgICB0aHJvdyBuZXcgRXJyb3IoYEN1cnNvciBub3QgZm91bmQ6ICR7Y3Vyc29ySWR9YCk7CiAgICB9CiAgICBpZiAobWV0aG9kID09PSAiY2xvc2UiKSB7CiAgICAgIHRoaXMuY3Vyc29ycy5kZWxldGUoY3Vyc29ySWQpOwogICAgICByZXR1cm4geyBjbG9zZWQ6IHRydWUgfTsKICAgIH0KICAgIGlmIChtZXRob2QgPT09ICJnZXRNb3JlIikgewogICAgICBjb25zdCBvcHRzID0gYXJncz8uWzBdIHx8IHt9OwogICAgICBjb25zdCBiYXRjaFNpemUgPSBvcHRzLmJhdGNoU2l6ZSB8fCAxMDA7CiAgICAgIGNvbnN0IGJhdGNoID0gW107CiAgICAgIHdoaWxlIChiYXRjaC5sZW5ndGggPCBiYXRjaFNpemUgJiYgYXdhaXQgY3Vyc29yLmhhc05leHQoKSkgewogICAgICAgIGJhdGNoLnB1c2goYXdhaXQgY3Vyc29yLm5leHQoKSk7CiAgICAgIH0KICAgICAgY29uc3QgZXhoYXVzdGVkID0gIWF3YWl0IGN1cnNvci5oYXNOZXh0KCk7CiAgICAgIGlmIChleGhhdXN0ZWQpIHsKICAgICAgICB0aGlzLmN1cnNvcnMuZGVsZXRlKGN1cnNvcklkKTsKICAgICAgfQogICAgICByZXR1cm4geyBiYXRjaCwgZXhoYXVzdGVkLCBiYXRjaFNpemUgfTsKICAgIH0KICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBjdXJzb3IgbWV0aG9kOiAke21ldGhvZH1gKTsKICB9CiAgX3JlZ2lzdGVyQ2hhbmdlU3RyZWFtKHN0cmVhbSkgewogICAgY29uc3QgaWQgPSBgY3NfJHt0aGlzLnN0cmVhbUNvdW50ZXIrK31gOwogICAgY29uc3QgaGFuZGxlcnMgPSB7CiAgICAgIGNoYW5nZTogKGNoYW5nZSkgPT4gdGhpcy5wb3N0RXZlbnQoewogICAgICAgIHR5cGU6ICJldmVudCIsCiAgICAgICAgZXZlbnQ6ICJjaGFuZ2VTdHJlYW0iLAogICAgICAgIHBheWxvYWQ6IHsgc3RyZWFtSWQ6IGlkLCB0eXBlOiAiY2hhbmdlIiwgZGF0YTogY2hhbmdlIH0KICAgICAgfSksCiAgICAgIGVycm9yOiAoZXJyKSA9PiB0aGlzLnBvc3RFdmVudCh7CiAgICAgICAgdHlwZTogImV2ZW50IiwKICAgICAgICBldmVudDogImNoYW5nZVN0cmVhbSIsCiAgICAgICAgcGF5bG9hZDogeyBzdHJlYW1JZDogaWQsIHR5cGU6ICJlcnJvciIsIGRhdGE6IHsKICAgICAgICAgIG5hbWU6IGVycj8ubmFtZSwKICAgICAgICAgIG1lc3NhZ2U6IGVycj8ubWVzc2FnZSwKICAgICAgICAgIHN0YWNrOiBlcnI/LnN0YWNrCiAgICAgICAgfSB9CiAgICAgIH0pLAogICAgICBjbG9zZTogKCkgPT4gdGhpcy5wb3N0RXZlbnQoewogICAgICAgIHR5cGU6ICJldmVudCIsCiAgICAgICAgZXZlbnQ6ICJjaGFuZ2VTdHJlYW0iLAogICAgICAgIHBheWxvYWQ6IHsgc3RyZWFtSWQ6IGlkLCB0eXBlOiAiY2xvc2UiIH0KICAgICAgfSkKICAgIH07CiAgICBzdHJlYW0ub24oImNoYW5nZSIsIGhhbmRsZXJzLmNoYW5nZSk7CiAgICBzdHJlYW0ub24oImVycm9yIiwgaGFuZGxlcnMuZXJyb3IpOwogICAgc3RyZWFtLm9uKCJjbG9zZSIsIGhhbmRsZXJzLmNsb3NlKTsKICAgIHRoaXMuc3RyZWFtcy5zZXQoaWQsIHsgc3RyZWFtLCBoYW5kbGVycyB9KTsKICAgIHJldHVybiB7IHN0cmVhbUlkOiBpZCB9OwogIH0KICBhc3luYyBfY2hhbmdlU3RyZWFtT3Aoc3RyZWFtSWQsIG1ldGhvZCkgewogICAgaWYgKCFzdHJlYW1JZCkgdGhyb3cgbmV3IEVycm9yKCJzdHJlYW1JZCByZXF1aXJlZCIpOwogICAgY29uc3QgZW50cnkgPSB0aGlzLnN0cmVhbXMuZ2V0KHN0cmVhbUlkKTsKICAgIGlmICghZW50cnkpIHJldHVybiB7IGNsb3NlZDogdHJ1ZSB9OwogICAgaWYgKG1ldGhvZCA9PT0gImNsb3NlIikgewogICAgICBjb25zdCB7IHN0cmVhbSwgaGFuZGxlcnMgfSA9IGVudHJ5OwogICAgICBzdHJlYW0ub2ZmKCJjaGFuZ2UiLCBoYW5kbGVycy5jaGFuZ2UpOwogICAgICBzdHJlYW0ub2ZmKCJlcnJvciIsIGhhbmRsZXJzLmVycm9yKTsKICAgICAgc3RyZWFtLm9mZigiY2xvc2UiLCBoYW5kbGVycy5jbG9zZSk7CiAgICAgIGlmICh0eXBlb2Ygc3RyZWFtLmNsb3NlID09PSAiZnVuY3Rpb24iKSB7CiAgICAgICAgYXdhaXQgc3RyZWFtLmNsb3NlKCk7CiAgICAgIH0KICAgICAgdGhpcy5zdHJlYW1zLmRlbGV0ZShzdHJlYW1JZCk7CiAgICAgIHJldHVybiB7IGNsb3NlZDogdHJ1ZSB9OwogICAgfQogICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGNoYW5nZSBzdHJlYW0gbWV0aG9kOiAke21ldGhvZH1gKTsKICB9CiAgLyoqCiAgICogV2F0Y2ggZm9yIGNoYW5nZXMgYWNyb3NzIGFsbCBkYXRhYmFzZXMgYW5kIGNvbGxlY3Rpb25zCiAgICogQHBhcmFtIHtBcnJheX0gcGlwZWxpbmUgLSBBZ2dyZWdhdGlvbiBwaXBlbGluZSB0byBmaWx0ZXIgY2hhbmdlcwogICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gV2F0Y2ggb3B0aW9ucwogICAqIEByZXR1cm5zIHtDaGFuZ2VTdHJlYW19IEEgY2hhbmdlIHN0cmVhbSBpbnN0YW5jZQogICAqLwogIHdhdGNoKHBpcGVsaW5lID0gW10sIG9wdGlvbnMgPSB7fSkgewogICAgcmV0dXJuIG5ldyBDaGFuZ2VTdHJlYW0odGhpcywgcGlwZWxpbmUsIG9wdGlvbnMpOwogIH0KfQpmdW5jdGlvbiBzZXJpYWxpemVQYXlsb2FkKG9iaikgewogIGlmIChvYmogPT09IG51bGwgfHwgb2JqID09PSB2b2lkIDApIHJldHVybiBvYmo7CiAgaWYgKHR5cGVvZiBvYmogPT09ICJmdW5jdGlvbiIpIHsKICAgIHJldHVybiB7IF9fZnVuY3Rpb246IG9iai50b1N0cmluZygpIH07CiAgfQogIGlmIChvYmogaW5zdGFuY2VvZiBPYmplY3RJZCkgewogICAgcmV0dXJuIHsgX19vYmplY3RJZDogb2JqLnRvU3RyaW5nKCkgfTsKICB9CiAgaWYgKG9iaiBpbnN0YW5jZW9mIERhdGUpIHsKICAgIHJldHVybiB7IF9fZGF0ZTogb2JqLnRvSVNPU3RyaW5nKCkgfTsKICB9CiAgaWYgKEFycmF5LmlzQXJyYXkob2JqKSkgewogICAgcmV0dXJuIG9iai5tYXAoc2VyaWFsaXplUGF5bG9hZCk7CiAgfQogIGlmICh0eXBlb2Ygb2JqID09PSAib2JqZWN0IikgewogICAgY29uc3QgcmVzdWx0ID0ge307CiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhvYmopKSB7CiAgICAgIHJlc3VsdFtrZXldID0gc2VyaWFsaXplUGF5bG9hZCh2YWx1ZSk7CiAgICB9CiAgICByZXR1cm4gcmVzdWx0OwogIH0KICByZXR1cm4gb2JqOwp9CmZ1bmN0aW9uIGRlc2VyaWFsaXplUGF5bG9hZChvYmopIHsKICBpZiAob2JqID09PSBudWxsIHx8IG9iaiA9PT0gdm9pZCAwKSByZXR1cm4gb2JqOwogIGlmICh0eXBlb2Ygb2JqID09PSAib2JqZWN0IiAmJiBvYmouX19mdW5jdGlvbikgewogICAgcmV0dXJuIHR5cGVvZiBvYmouX19mdW5jdGlvbiA9PT0gInN0cmluZyIgPyBgKCR7b2JqLl9fZnVuY3Rpb259KS5jYWxsKHRoaXMpYCA6IHZvaWQgMDsKICB9CiAgaWYgKHR5cGVvZiBvYmogPT09ICJvYmplY3QiICYmIG9iai5fX29iamVjdElkKSB7CiAgICByZXR1cm4gbmV3IE9iamVjdElkKG9iai5fX29iamVjdElkKTsKICB9CiAgaWYgKHR5cGVvZiBvYmogPT09ICJvYmplY3QiICYmIG9iai5fX2RhdGUpIHsKICAgIHJldHVybiBuZXcgRGF0ZShvYmouX19kYXRlKTsKICB9CiAgaWYgKEFycmF5LmlzQXJyYXkob2JqKSkgewogICAgcmV0dXJuIG9iai5tYXAoZGVzZXJpYWxpemVQYXlsb2FkKTsKICB9CiAgaWYgKHR5cGVvZiBvYmogPT09ICJvYmplY3QiKSB7CiAgICBjb25zdCByZXN1bHQgPSB7fTsKICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKG9iaikpIHsKICAgICAgcmVzdWx0W2tleV0gPSBkZXNlcmlhbGl6ZVBheWxvYWQodmFsdWUpOwogICAgfQogICAgcmV0dXJuIHJlc3VsdDsKICB9CiAgcmV0dXJuIG9iajsKfQpjb25zdCBpc05vZGUgPSB0eXBlb2YgcHJvY2VzcyAhPT0gInVuZGVmaW5lZCIgJiYgISFwcm9jZXNzLnZlcnNpb25zPy5ub2RlOwpsZXQgc2VydmVyOwpsZXQgaW5pdFByb21pc2UgPSBudWxsOwppZiAoaXNOb2RlKSB7CiAgaW5pdFByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHsKICAgIGNvbnN0IGltcG9ydEZ1bmMgPSBuZXcgRnVuY3Rpb24oInNwZWMiLCAicmV0dXJuIGltcG9ydChzcGVjKSIpOwogICAgcmV0dXJuIFByb21pc2UuYWxsKFsKICAgICAgaW1wb3J0RnVuYygicGF0aCIpLAogICAgICBpbXBvcnRGdW5jKCJ1cmwiKSwKICAgICAgaW1wb3J0RnVuYygibm9kZS1vcGZzIikKICAgIF0pOwogIH0pLnRoZW4oKFtwYXRoTW9kdWxlLCB1cmxNb2R1bGUsIG9wZnNNb2R1bGVdKSA9PiB7CiAgICBjb25zdCBwYXRoID0gcGF0aE1vZHVsZS5kZWZhdWx0OwogICAgY29uc3QgeyBmaWxlVVJMVG9QYXRoIH0gPSB1cmxNb2R1bGU7CiAgICBjb25zdCB7IFN0b3JhZ2VNYW5hZ2VyIH0gPSBvcGZzTW9kdWxlOwogICAgY29uc3QgX19maWxlbmFtZSA9IGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKTsKICAgIGNvbnN0IF9fZGlybmFtZSA9IHBhdGguZGlybmFtZShfX2ZpbGVuYW1lKTsKICAgIGNvbnN0IHByb2plY3RSb290ID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgIi4uIik7CiAgICBjb25zdCBvcGZzRGlyID0gcGF0aC5qb2luKHByb2plY3RSb290LCAiLm9wZnMiKTsKICAgIGNvbnN0IGN1c3RvbVN0b3JhZ2UgPSBuZXcgU3RvcmFnZU1hbmFnZXIob3Bmc0Rpcik7CiAgICBjb25zdCBvcGZzTmF2aWdhdG9yID0gewogICAgICBzdG9yYWdlOiB7CiAgICAgICAgZ2V0RGlyZWN0b3J5OiAoKSA9PiBjdXN0b21TdG9yYWdlLmdldERpcmVjdG9yeSgpCiAgICAgIH0KICAgIH07CiAgICBpZiAodHlwZW9mIGdsb2JhbFRoaXMubmF2aWdhdG9yID09PSAidW5kZWZpbmVkIikgewogICAgICBnbG9iYWxUaGlzLm5hdmlnYXRvciA9IG9wZnNOYXZpZ2F0b3I7CiAgICB9IGVsc2UgewogICAgICBnbG9iYWxUaGlzLm5hdmlnYXRvci5zdG9yYWdlID0gb3Bmc05hdmlnYXRvci5zdG9yYWdlOwogICAgfQogIH0pLmNhdGNoKCgpID0+IHsKICB9KTsKfQpmdW5jdGlvbiBjcmVhdGVTZXJ2ZXIocG9zdCkgewogIGlmICghc2VydmVyKSB7CiAgICBzZXJ2ZXIgPSBuZXcgU2VydmVyKHt9LCBwb3N0KTsKICB9CiAgcmV0dXJuIHNlcnZlcjsKfQphc3luYyBmdW5jdGlvbiBoYW5kbGVNZXNzYWdlKG1lc3NhZ2UsIHBvc3QpIHsKICBpZiAoIW1lc3NhZ2UgfHwgbWVzc2FnZS50eXBlICE9PSAicmVxdWVzdCIpIHJldHVybjsKICBpZiAoaW5pdFByb21pc2UpIHsKICAgIGF3YWl0IGluaXRQcm9taXNlOwogIH0KICBjb25zdCB7IGlkLCBwYXlsb2FkIH0gPSBtZXNzYWdlOwogIGNvbnN0IGRlc2VyaWFsaXplZFBheWxvYWQgPSBkZXNlcmlhbGl6ZVBheWxvYWQocGF5bG9hZCk7CiAgY29uc3Qgc3J2ID0gY3JlYXRlU2VydmVyKHBvc3QpOwogIHRyeSB7CiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzcnYuZGlzcGF0Y2goZGVzZXJpYWxpemVkUGF5bG9hZCk7CiAgICBjb25zdCBzZXJpYWxpemVkUmVzdWx0ID0gc2VyaWFsaXplUGF5bG9hZChyZXN1bHQpOwogICAgcG9zdCh7IHR5cGU6ICJyZXNwb25zZSIsIGlkLCBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IHNlcmlhbGl6ZWRSZXN1bHQgfSk7CiAgfSBjYXRjaCAoZXJyb3IpIHsKICAgIHBvc3QoewogICAgICB0eXBlOiAicmVzcG9uc2UiLAogICAgICBpZCwKICAgICAgc3VjY2VzczogZmFsc2UsCiAgICAgIGVycm9yOiB7CiAgICAgICAgbmFtZTogZXJyb3I/Lm5hbWUsCiAgICAgICAgbWVzc2FnZTogZXJyb3I/Lm1lc3NhZ2UsCiAgICAgICAgc3RhY2s6IGVycm9yPy5zdGFjaywKICAgICAgICBjb2RlOiBlcnJvcj8uY29kZSwKICAgICAgICAkZXJyOiBlcnJvcj8uJGVycgogICAgICB9CiAgICB9KTsKICB9Cn0KYXN5bmMgZnVuY3Rpb24gaW5pdGlhbGl6ZVdvcmtlcigpIHsKICBpZiAoaXNOb2RlKSB7CiAgICBjb25zdCB7IHBhcmVudFBvcnQgfSA9IGF3YWl0IGltcG9ydCgid29ya2VyX3RocmVhZHMiKTsKICAgIGNvbnN0IHBvc3QgPSAocmVzcCkgPT4gcGFyZW50UG9ydC5wb3N0TWVzc2FnZShyZXNwKTsKICAgIHBhcmVudFBvcnQub24oIm1lc3NhZ2UiLCAobXNnKSA9PiBoYW5kbGVNZXNzYWdlKG1zZywgcG9zdCkpOwogIH0gZWxzZSB7CiAgICBjb25zdCBwb3N0ID0gKHJlc3ApID0+IHNlbGYucG9zdE1lc3NhZ2UocmVzcCk7CiAgICBzZWxmLm9ubWVzc2FnZSA9IChldmVudCkgPT4gaGFuZGxlTWVzc2FnZShldmVudC5kYXRhLCBwb3N0KTsKICB9Cn0KaW5pdGlhbGl6ZVdvcmtlcigpLmNhdGNoKChlcnIpID0+IHsKICBjb25zb2xlLmVycm9yKCJXb3JrZXIgaW5pdGlhbGl6YXRpb24gZmFpbGVkOiIsIGVycik7CiAgaWYgKHR5cGVvZiBwcm9jZXNzICE9PSAidW5kZWZpbmVkIikgewogICAgcHJvY2Vzcy5leGl0KDEpOwogIH0gZWxzZSB7CiAgICBzZWxmLnBvc3RNZXNzYWdlKHsgdHlwZTogImVycm9yIiwgZXJyb3I6IGVyci5tZXNzYWdlIH0pOwogIH0KfSk7Ci8vIyBzb3VyY2VNYXBwaW5nVVJMPW1pY3JvLW1vbmdvLXNlcnZlci13b3JrZXIuanMubWFwCg==", import.meta.url);
      workerPath = fileURLToPath(buildUrl);
    }
    const worker = new NodeWorker(workerPath, {
      workerData: options.workerData
    });
    return new NodeWorkerBridge(worker);
  }
  /**
   * Send a request to the worker and await the response.
   * @param {Object} payload - Arbitrary payload for the worker.
   * @param {Object} [opts]
   * @param {number} [opts.timeout] - Optional timeout in ms.
   */
  sendRequest(payload, opts = {}) {
    const id = this._nextId++;
    const serializedPayload = serializePayload(payload);
    const message = { type: "request", id, payload: serializedPayload };
    return new Promise((resolve, reject) => {
      let timeoutHandle;
      if (opts.timeout) {
        timeoutHandle = setTimeout(() => {
          this._pending.delete(id);
          reject(new Error(`Worker request timed out after ${opts.timeout}ms`));
        }, opts.timeout);
      }
      this._pending.set(id, { resolve, reject, timeoutHandle });
      this._post(message);
    });
  }
  /**
   * Gracefully close the worker without rejecting pending requests.
   * Any pending requests will simply be abandoned without error messages.
   */
  async terminate() {
    this._terminating = true;
    for (const [id, pending] of this._pending.entries()) {
      clearTimeout(pending.timeoutHandle);
    }
    this._pending.clear();
    await this._terminateImpl();
  }
  _handleMessage(event) {
    const data = event?.data ?? event;
    if (!data) return;
    if (data.type === "response") {
      const pending = this._pending.get(data.id);
      if (!pending) return;
      this._pending.delete(data.id);
      clearTimeout(pending.timeoutHandle);
      if (data.success) {
        const deserializedResult = deserializePayload(data.result);
        pending.resolve(deserializedResult);
      } else {
        const error = new Error(data.error?.message || "Worker error");
        if (data.error?.name) error.name = data.error.name;
        if (data.error?.stack) error.stack = data.error.stack;
        if (data.error?.code) error.code = data.error.code;
        if (data.error?.$err) error.$err = data.error.$err;
        pending.reject(error);
      }
      return;
    }
    if (data.type === "event") {
      const deserializedPayload = deserializePayload(data.payload);
      this.emit("event", data.event, deserializedPayload);
    }
  }
  _handleError(error) {
    if (this._terminating) return;
    for (const [id, pending] of this._pending.entries()) {
      clearTimeout(pending.timeoutHandle);
      pending.reject(error);
    }
    this._pending.clear();
    this.emit("error", error);
  }
  // Abstract hooks per environment
  _attach() {
    throw new Error("Not implemented");
  }
  _post() {
    throw new Error("Not implemented");
  }
  _terminateImpl() {
    throw new Error("Not implemented");
  }
}
class BrowserWorkerBridge extends WorkerBridge {
  constructor(options = {}) {
    const WebWorkerCtor = globalThis.Worker;
    if (!WebWorkerCtor) {
      throw new Error("Worker API is not available in this environment");
    }
    const workerUrl = options.workerUrl || "/build/micro-mongo-server-worker.js";
    const worker = new WebWorkerCtor(workerUrl, { type: "module" });
    super(worker);
  }
  _attach() {
    this.worker.onmessage = this._handleMessage;
    this.worker.onerror = this._handleError;
  }
  _post(message) {
    this.worker.postMessage(message);
  }
  _terminateImpl() {
    this.worker.terminate();
  }
}
class NodeWorkerBridge extends WorkerBridge {
  constructor(worker) {
    super(worker);
  }
  _attach() {
    this.worker.on("message", this._handleMessage);
    this.worker.on("error", this._handleError);
    this.worker.on("exit", (code) => {
      if (code !== 0 && !this._terminating) {
        this._handleError(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  }
  _post(message) {
    this.worker.postMessage(message);
  }
  _terminateImpl() {
    return this.worker.terminate();
  }
}
export {
  BadValueError,
  BulkWriteError,
  CannotCreateIndexError,
  ChangeStream,
  CursorError,
  CursorNotFoundError,
  DuplicateKeyError,
  ErrorCodes,
  IndexError,
  IndexExistsError,
  IndexNotFoundError,
  InvalidNamespaceError,
  MongoClient,
  MongoDriverError,
  MongoError,
  MongoNetworkError,
  MongoServerError,
  NamespaceError,
  NamespaceNotFoundError,
  NotImplementedError,
  ObjectId,
  OperationNotSupportedError,
  QueryError,
  TypeMismatchError,
  ValidationError,
  WorkerBridge,
  WriteError
};
//# sourceMappingURL=micro-mongo-client.js.map
