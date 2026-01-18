(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.MicroMongo = {}));
})(this, (function(exports2) {
  "use strict";
  var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
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
        bridge.sendRequest({
          target: "collection",
          database,
          collection,
          method: "watch",
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
      await this.bridge.sendRequest({
        target: "changestream",
        streamId: this.streamId,
        method: "close"
      });
      this._cleanup();
    }
    async next() {
      return new Promise((resolve, reject) => {
        const onChange = (change) => {
          this.off("change", onChange);
          this.off("error", onError);
          resolve(change);
        };
        const onError = (error) => {
          this.off("change", onChange);
          this.off("error", onError);
          reject(error);
        };
        this.on("change", onChange);
        this.on("error", onError);
      });
    }
  }
  class ProxyCursor {
    constructor({ bridge, cursorId, batch = [], exhausted = false, batchSize = 100, requestPromise }) {
      this.bridge = bridge;
      this.cursorId = cursorId;
      this.buffer = Array.isArray(batch) ? batch : [];
      this.exhausted = exhausted || false;
      this._batchSize = batchSize;
      this._requestPromise = requestPromise || null;
      this._initialized = !requestPromise;
    }
    async _ensureInitialized() {
      if (this._initialized) return;
      if (this._requestPromise) {
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
    close() {
      this._closed = true;
      return this;
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
      return {
        queryPlanner: {
          plannerVersion: 1,
          namespace: `unknown`,
          indexFilterSet: false,
          winningPlan: {
            stage: "COLLSCAN"
          }
        },
        ok: 1
      };
    }
    async itcount() {
      return this.count();
    }
    size() {
      return this.buffer.length;
    }
    min(spec) {
      this._min = spec;
      return this;
    }
    max(spec) {
      this._max = spec;
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
    constructor({ dbName, name, bridge }) {
      this.dbName = dbName;
      this.name = name;
      this.bridge = bridge;
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
      const requestPromise = this.bridge.sendRequest({
        target: "collection",
        database: this.dbName,
        collection: this.name,
        method,
        args
      });
      const cursor = new ProxyCursor({
        bridge: this.bridge,
        requestPromise
      });
      if (method === "aggregate") {
        cursor.then = function(onFulfilled, onRejected) {
          return this.toArray().then(onFulfilled, onRejected);
        };
      }
      return cursor;
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
        if (method === "createIndex") {
          const indexSpec = args[0];
          const indexOptions = args[1] || {};
          const indexName = indexOptions.name || Object.entries(indexSpec).map(([k, v]) => `${k}_${v}`).join("_");
          this.indexes.push({
            name: indexName,
            key: indexSpec,
            ...indexOptions
          });
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
                target.collection(collName);
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
            return (...args) => target._call(String(prop), args);
          }
          return target.collection(prop);
        }
      });
    }
    collection(name) {
      if (this.collections.has(name)) return this.collections.get(name);
      const col = new ProxyCollection({
        dbName: this.dbName,
        name,
        bridge: this.bridge
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
     * @returns {ChangeStream} A change stream instance
     */
    watch(pipeline = [], options = {}) {
      return new ChangeStream(this, pipeline, options);
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
  let ChangeStream$1 = class ChangeStream extends eventsExports.EventEmitter {
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
          _data: Buffer.from(String(++this._changeCounter)).toString("base64")
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
      const self2 = this;
      this._watchedDBs = /* @__PURE__ */ new Map();
      client.db = function(name, opts) {
        const database = originalDb(name, opts);
        const dbName = database.dbName;
        if (!self2._watchedDBs.has(dbName)) {
          self2._watchedDBs.set(dbName, database);
          const collectionNames = database.getCollectionNames();
          for (const colName of collectionNames) {
            const col = database[colName];
            if (col && col.isCollection && !self2._listeners.has(col)) {
              self2._watchCollection(col);
            }
          }
          self2._interceptDBCollectionCreationForClient(database);
        }
        return database;
      };
      this._originalClientMethods = { db: originalDb };
    }
    /**
     * Intercept collection creation for a database in client watch mode
     * @private
     */
    _interceptDBCollectionCreationForClient(db) {
      const originalCollection = db.collection.bind(db);
      const originalCreateCollection = db.createCollection.bind(db);
      const self2 = this;
      db.collection = function(name) {
        const col = originalCollection(name);
        if (col && col.isCollection && !self2._listeners.has(col)) {
          self2._watchCollection(col);
        }
        return col;
      };
      db.createCollection = function(name) {
        originalCreateCollection(name);
        const col = db[name];
        if (col && col.isCollection && !self2._listeners.has(col)) {
          self2._watchCollection(col);
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
      const self2 = this;
      db.collection = function(name) {
        const col = originalCollection(name);
        if (col && col.isCollection && !self2._listeners.has(col)) {
          self2._watchCollection(col);
        }
        return col;
      };
      db.createCollection = function(name) {
        originalCreateCollection(name);
        const col = db[name];
        if (col && col.isCollection && !self2._listeners.has(col)) {
          self2._watchCollection(col);
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
  };
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
        const buildUrl = new URL("../../build/micro-mongo-server-worker.js", typeof document === "undefined" && typeof location === "undefined" ? require("url").pathToFileURL(__filename).href : typeof document === "undefined" ? location.href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("micro-mongo-server.umd.js", document.baseURI).href);
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
      const message = { type: "request", id, payload };
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
          pending.resolve(data.result);
        } else {
          const error = new Error(data.error?.message || "Worker error");
          if (data.error?.name) error.name = data.error.name;
          if (data.error?.stack) error.stack = data.error.stack;
          if (data.error?.code) error.code = data.error.code;
          pending.reject(error);
        }
        return;
      }
      if (data.type === "event") {
        this.emit("event", data.event, data.payload);
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
      const workerUrl = options.workerUrl || new URL("../../build/micro-mongo-server-worker.js", typeof document === "undefined" && typeof location === "undefined" ? require("url").pathToFileURL(__filename).href : typeof document === "undefined" ? location.href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("micro-mongo-server.umd.js", document.baseURI).href);
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
  exports2.BadValueError = BadValueError;
  exports2.BulkWriteError = BulkWriteError;
  exports2.CannotCreateIndexError = CannotCreateIndexError;
  exports2.ChangeStream = ChangeStream$1;
  exports2.CursorError = CursorError;
  exports2.CursorNotFoundError = CursorNotFoundError;
  exports2.DuplicateKeyError = DuplicateKeyError;
  exports2.ErrorCodes = ErrorCodes;
  exports2.IndexError = IndexError;
  exports2.IndexExistsError = IndexExistsError;
  exports2.IndexNotFoundError = IndexNotFoundError;
  exports2.InvalidNamespaceError = InvalidNamespaceError;
  exports2.MongoClient = MongoClient;
  exports2.MongoDriverError = MongoDriverError;
  exports2.MongoError = MongoError;
  exports2.MongoNetworkError = MongoNetworkError;
  exports2.MongoServerError = MongoServerError;
  exports2.NamespaceError = NamespaceError;
  exports2.NamespaceNotFoundError = NamespaceNotFoundError;
  exports2.NotImplementedError = NotImplementedError;
  exports2.ObjectId = ObjectId;
  exports2.OperationNotSupportedError = OperationNotSupportedError;
  exports2.QueryError = QueryError;
  exports2.TypeMismatchError = TypeMismatchError;
  exports2.ValidationError = ValidationError;
  exports2.WorkerBridge = WorkerBridge;
  exports2.WriteError = WriteError;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
}));
//# sourceMappingURL=micro-mongo-server.umd.js.map
