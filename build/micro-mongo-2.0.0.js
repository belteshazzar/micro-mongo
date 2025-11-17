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
    var copy2 = new Array(n);
    for (var i = 0; i < n; ++i)
      copy2[i] = arr[i];
    return copy2;
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
class ObjectId {
  constructor(id) {
    if (id === void 0 || id === null) {
      this.id = ObjectId.generate();
    } else if (typeof id === "string") {
      if (!ObjectId.isValid(id)) {
        throw new Error(`Argument passed in must be a string of 24 hex characters, got: ${id}`);
      }
      this.id = id.toLowerCase();
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
  /**
   * Compares this ObjectId with another for equality
   */
  equals(other) {
    if (!other) return false;
    if (other instanceof ObjectId) {
      return this.id === other.id;
    }
    if (typeof other === "string") {
      return this.id === other.toLowerCase();
    }
    if (other.id) {
      return this.id === other.id;
    }
    return false;
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
function copy(o) {
  if (o instanceof ObjectId) {
    return new ObjectId(o.id);
  }
  var out, v, key;
  out = Array.isArray(o) ? [] : {};
  for (key in o) {
    v = o[key];
    out[key] = typeof v === "object" && v !== null ? copy(v) : v;
  }
  return out;
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
function setProp(obj, name, value) {
  var path = name.split(".");
  var current = obj;
  for (var i = 0; i < path.length - 1; i++) {
    var pathSegment = path[i];
    var numericIndex = parseInt(pathSegment, 10);
    if (isArray(current) && !isNaN(numericIndex) && numericIndex >= 0) {
      while (current.length <= numericIndex) {
        current.push(void 0);
      }
      if (current[numericIndex] == void 0 || current[numericIndex] == null) {
        var nextSegment = path[i + 1];
        var nextNumeric = parseInt(nextSegment, 10);
        if (!isNaN(nextNumeric) && nextNumeric >= 0) {
          current[numericIndex] = [];
        } else {
          current[numericIndex] = {};
        }
      }
      current = current[numericIndex];
    } else {
      if (current[pathSegment] == void 0 || current[pathSegment] == null) {
        var nextSegment = path[i + 1];
        var nextNumeric = parseInt(nextSegment, 10);
        if (!isNaN(nextNumeric) && nextNumeric >= 0) {
          current[pathSegment] = [];
        } else {
          current[pathSegment] = {};
        }
      }
      current = current[pathSegment];
    }
  }
  var lastSegment = path[path.length - 1];
  var lastNumericIndex = parseInt(lastSegment, 10);
  if (isArray(current) && !isNaN(lastNumericIndex) && lastNumericIndex >= 0) {
    while (current.length <= lastNumericIndex) {
      current.push(void 0);
    }
    current[lastNumericIndex] = value;
  } else {
    current[lastSegment] = value;
  }
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
function applyProjection(projection, doc) {
  var result = {};
  var keys = Object.keys(projection);
  if (keys.length == 0) return doc;
  var hasInclusion = false;
  var hasExclusion = false;
  for (var i = 0; i < keys.length; i++) {
    if (keys[i] === "_id") continue;
    if (projection[keys[i]]) hasInclusion = true;
    else hasExclusion = true;
  }
  if (hasInclusion && hasExclusion) {
    throw { $err: "Can't canonicalize query: BadValue Projection cannot have a mix of inclusion and exclusion.", code: 17287 };
  }
  if (projection[keys[0]] || hasInclusion) {
    if (projection._id !== 0) {
      result._id = doc._id;
    }
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] === "_id") continue;
      if (!projection[keys[i]]) continue;
      var fieldPath = keys[i];
      var value = getProp(doc, fieldPath);
      if (value !== void 0) {
        setProp(result, fieldPath, value);
      }
    }
  } else {
    for (var key in doc) {
      if (doc.hasOwnProperty(key)) {
        var val = doc[key];
        if (typeof val === "object" && val !== null && !isArray(val)) {
          result[key] = copy(val);
        } else if (isArray(val)) {
          result[key] = val.slice();
        } else {
          result[key] = val;
        }
      }
    }
    for (var i = 0; i < keys.length; i++) {
      if (projection[keys[i]]) continue;
      var fieldPath = keys[i];
      var pathParts = fieldPath.split(".");
      if (pathParts.length === 1) {
        delete result[fieldPath];
      } else {
        var parent = result;
        for (var j = 0; j < pathParts.length - 1; j++) {
          if (parent == void 0 || parent == null) break;
          parent = parent[pathParts[j]];
        }
        if (parent != void 0 && parent != null) {
          delete parent[pathParts[pathParts.length - 1]];
        }
      }
    }
  }
  return result;
}
class Cursor {
  constructor(collection, query, projection, documents, SortedCursor2) {
    this.collection = collection;
    this.query = query;
    this.projection = projection;
    this.documents = documents;
    this.SortedCursor = SortedCursor2;
    if (projection && Object.keys(projection).length > 0) {
      const keys = Object.keys(projection);
      let hasInclusion = false;
      let hasExclusion = false;
      for (let i = 0; i < keys.length; i++) {
        if (keys[i] === "_id") continue;
        if (projection[keys[i]]) hasInclusion = true;
        else hasExclusion = true;
      }
      if (hasInclusion && hasExclusion) {
        throw { $err: "Can't canonicalize query: BadValue Projection cannot have a mix of inclusion and exclusion.", code: 17287 };
      }
    }
    this.pos = 0;
    this.max = 0;
  }
  batchSize() {
    throw "Not Implemented";
  }
  close() {
    throw "Not Implemented";
  }
  comment() {
    throw "Not Implemented";
  }
  count() {
    return this.documents.length;
  }
  explain() {
    throw "Not Implemented";
  }
  async forEach(fn) {
    while (this.hasNext()) {
      await fn(this.next());
    }
  }
  hasNext() {
    const effectiveMax = this.max > 0 ? Math.min(this.max, this.documents.length) : this.documents.length;
    return this.pos < effectiveMax;
  }
  hint() {
    throw "Not Implemented";
  }
  itcount() {
    throw "Not Implemented";
  }
  limit(_max) {
    this.max = _max;
    return this;
  }
  map(fn) {
    const results = [];
    while (this.hasNext()) {
      results.push(fn(this.next()));
    }
    return results;
  }
  maxScan() {
    throw "Not Implemented";
  }
  maxTimeMS() {
    throw "Not Implemented";
  }
  max() {
    throw "Not Implemented";
  }
  min() {
    throw "Not Implemented";
  }
  next() {
    if (!this.hasNext()) {
      throw "Error: error hasNext: false";
    }
    const result = this.documents[this.pos++];
    if (this.projection) {
      return applyProjection(this.projection, result);
    }
    return result;
  }
  noCursorTimeout() {
    throw "Not Implemented";
  }
  objsLeftInBatch() {
    throw "Not Implemented";
  }
  pretty() {
    throw "Not Implemented";
  }
  readConcern() {
    throw "Not Implemented";
  }
  readPref() {
    throw "Not Implemented";
  }
  returnKey() {
    throw "Not Implemented";
  }
  showRecordId() {
    throw "Not Implemented";
  }
  size() {
    throw "Not Implemented";
  }
  skip(num) {
    this.pos = Math.min(this.pos + num, this.documents.length);
    return this;
  }
  snapshot() {
    throw "Not Implemented";
  }
  sort(s) {
    return new this.SortedCursor(this.collection, this.query, this, s);
  }
  tailable() {
    throw "Not Implemented";
  }
  async toArray() {
    const results = [];
    while (this.hasNext()) {
      results.push(this.next());
    }
    return results;
  }
  // Support for async iteration (for await...of)
  async *[Symbol.asyncIterator]() {
    while (this.hasNext()) {
      yield this.next();
    }
  }
}
class SortedCursor {
  constructor(collection, query, cursor, sort) {
    this.collection = collection;
    this.query = query;
    this.sortSpec = sort;
    this.pos = 0;
    this.items = [];
    while (cursor.hasNext()) {
      this.items.push(cursor.next());
    }
    const sortKeys = Object.keys(sort);
    this.items.sort(function(a, b) {
      for (let i = 0; i < sortKeys.length; i++) {
        if (a[sortKeys[i]] == void 0 && b[sortKeys[i]] != void 0) return -1 * sort[sortKeys[i]];
        if (a[sortKeys[i]] != void 0 && b[sortKeys[i]] == void 0) return 1 * sort[sortKeys[i]];
        if (a[sortKeys[i]] < b[sortKeys[i]]) return -1 * sort[sortKeys[i]];
        if (a[sortKeys[i]] > b[sortKeys[i]]) return 1 * sort[sortKeys[i]];
      }
      return 0;
    });
  }
  batchSize() {
    throw "Not Implemented";
  }
  close() {
    throw "Not Implemented";
  }
  comment() {
    throw "Not Implemented";
  }
  count() {
    return this.items.length;
  }
  explain() {
    throw "Not Implemented";
  }
  async forEach(fn) {
    while (this.hasNext()) {
      await fn(this.next());
    }
  }
  hasNext() {
    return this.pos < this.items.length;
  }
  hint() {
    throw "Not Implemented";
  }
  itcount() {
    throw "Not Implemented";
  }
  limit(max) {
    this.items = this.items.slice(0, max);
    return this;
  }
  map(fn) {
    const results = [];
    while (this.hasNext()) {
      results.push(fn(this.next()));
    }
    return results;
  }
  maxScan() {
    throw "Not Implemented";
  }
  maxTimeMS() {
    throw "Not Implemented";
  }
  max() {
    throw "Not Implemented";
  }
  min() {
    throw "Not Implemented";
  }
  next() {
    return this.items[this.pos++];
  }
  noCursorTimeout() {
    throw "Not Implemented";
  }
  objsLeftInBatch() {
    throw "Not Implemented";
  }
  pretty() {
    throw "Not Implemented";
  }
  readConcern() {
    throw "Not Implemented";
  }
  readPref() {
    throw "Not Implemented";
  }
  returnKey() {
    throw "Not Implemented";
  }
  showRecordId() {
    throw "Not Implemented";
  }
  size() {
    throw "Not Implemented";
  }
  skip(num) {
    while (num > 0) {
      this.next();
      num--;
    }
    return this;
  }
  snapshot() {
    throw "Not Implemented";
  }
  sort(s) {
    return new SortedCursor(this.collection, this.query, this, s);
  }
  tailable() {
    throw "Not Implemented";
  }
  async toArray() {
    const results = [];
    while (this.hasNext()) {
      results.push(this.next());
    }
    return results;
  }
  // Support for async iteration (for await...of)
  async *[Symbol.asyncIterator]() {
    while (this.hasNext()) {
      yield this.next();
    }
  }
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
class IndexStore {
  constructor(meta) {
    this._meta = /* @__PURE__ */ new Map();
    this._data = /* @__PURE__ */ new Map();
    if (meta) {
      for (const [key, value] of Object.entries(meta)) {
        this._meta.set(key, value);
      }
    }
  }
  setMeta(key, value) {
    this._meta.set(key, value);
  }
  hasMeta(key) {
    return this._meta.has(key);
  }
  getMeta(key) {
    return this._meta.get(key);
  }
  hasDataMap(name) {
    return this._data.has(name);
  }
  getDataMap(name) {
    if (!this._data.has(name)) {
      this._data.set(name, /* @__PURE__ */ new Map());
    }
    return this._data.get(name);
  }
  // clear() {
  // 	this._data.clear();
  // }
  // keys() {
  //   return this._data.keys();
  // }
  // has(index) {
  //   return this._data.has(index);
  // }
  // get(index) {
  // 	return this._data.get(index);
  // }
  // remove(key) {
  // 	this._data.delete(key);
  // }
  // set(key, value) {
  // 	this._data.set(key, value);
  // }
  // size() {
  // 	return this._data.size;
  // }
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
class TextIndex {
  constructor(storage = new IndexStore()) {
    this.storage = storage;
    this.index = this.storage.getDataMap("index");
    this.documentTerms = this.storage.getDataMap("documentTerms");
    this.documentLengths = this.storage.getDataMap("documentLengths");
  }
  /**
   * Tokenize text into individual words
   * @param {string} text - The text to tokenize
   * @returns {string[]} Array of words
   */
  _tokenize(text2) {
    if (typeof text2 !== "string") {
      return [];
    }
    const words = text2.toLowerCase().split(/\W+/).filter((word) => word.length > 0);
    return words.filter((word) => !STOPWORDS.has(word));
  }
  /**
   * Add terms from text to the index for a given document ID
   * @param {string} docId - The document identifier
   * @param {string} text - The text content to index
   */
  add(docId, text2) {
    if (!docId) {
      throw new Error("Document ID is required");
    }
    const words = this._tokenize(text2);
    const termFrequency = /* @__PURE__ */ new Map();
    words.forEach((word) => {
      const stem = stemmer(word);
      termFrequency.set(stem, (termFrequency.get(stem) || 0) + 1);
    });
    termFrequency.forEach((frequency, stem) => {
      if (!this.index.has(stem)) {
        this.index.set(stem, /* @__PURE__ */ new Map());
      }
      this.index.get(stem).set(docId, frequency);
    });
    this.documentTerms.set(docId, termFrequency);
    this.documentLengths.set(docId, words.length);
  }
  /**
   * Remove all indexed terms for a given document ID
   * @param {string} docId - The document identifier to remove
   * @returns {boolean} True if document was found and removed, false otherwise
   */
  remove(docId) {
    if (!this.documentTerms.has(docId)) {
      return false;
    }
    const terms = this.documentTerms.get(docId);
    terms.forEach((frequency, term) => {
      if (this.index.has(term)) {
        this.index.get(term).delete(docId);
        if (this.index.get(term).size === 0) {
          this.index.delete(term);
        }
      }
    });
    this.documentTerms.delete(docId);
    this.documentLengths.delete(docId);
    return true;
  }
  /**
   * Query the index for documents containing the given terms with relevance scoring
   * @param {string} queryText - The search query text
   * @param {Object} options - Query options
   * @param {boolean} options.scored - If true, return scored results; if false, return just IDs (default: true)
   * @param {boolean} options.requireAll - If true, require ALL terms; if false, rank by relevance (default: false)
   * @returns {Array} Array of document IDs (if scored=false) or objects with {id, score} (if scored=true)
   */
  query(queryText, options = { scored: true, requireAll: false }) {
    const words = this._tokenize(queryText);
    if (words.length === 0) {
      return [];
    }
    const stemmedTerms = words.map((word) => stemmer(word));
    const uniqueTerms = [...new Set(stemmedTerms)];
    if (options.requireAll) {
      const docSets = uniqueTerms.map((term) => {
        const termDocs = this.index.get(term);
        return termDocs ? new Set(termDocs.keys()) : /* @__PURE__ */ new Set();
      });
      if (docSets.length === 0) {
        return [];
      }
      const intersection = new Set(docSets[0]);
      for (let i = 1; i < docSets.length; i++) {
        for (const docId of intersection) {
          if (!docSets[i].has(docId)) {
            intersection.delete(docId);
          }
        }
      }
      return Array.from(intersection);
    }
    const totalDocs = this.documentLengths.size;
    const idf = /* @__PURE__ */ new Map();
    uniqueTerms.forEach((term) => {
      const docsWithTerm = this.index.get(term)?.size || 0;
      if (docsWithTerm > 0) {
        idf.set(term, Math.log(totalDocs / docsWithTerm));
      }
    });
    const docScores = /* @__PURE__ */ new Map();
    uniqueTerms.forEach((term) => {
      const termDocs = this.index.get(term);
      if (!termDocs) return;
      termDocs.forEach((termFreq, docId) => {
        if (!docScores.has(docId)) {
          docScores.set(docId, 0);
        }
        const docLength = this.documentLengths.get(docId) || 1;
        const tf = termFreq / docLength;
        const termIdf = idf.get(term) || 0;
        const tfIdf = tf * termIdf;
        docScores.set(docId, docScores.get(docId) + tfIdf);
      });
    });
    docScores.forEach((score, docId) => {
      const docTerms = this.documentTerms.get(docId);
      if (docTerms) {
        const matchingTerms = uniqueTerms.filter((term) => docTerms.has(term)).length;
        const coverage = matchingTerms / uniqueTerms.length;
        docScores.set(docId, score * (1 + coverage));
      }
    });
    const results = Array.from(docScores.entries()).map(([id, score]) => ({ id, score })).sort((a, b) => b.score - a.score);
    if (options.scored === false) {
      return results.map((r) => r.id);
    }
    return results;
  }
  /**
   * Get the number of unique terms in the index
   * @returns {number} Number of unique terms
   */
  getTermCount() {
    return this.index.size;
  }
  /**
   * Get the number of documents in the index
   * @returns {number} Number of indexed documents
   */
  getDocumentCount() {
    return this.documentTerms.size;
  }
  /**
   * Clear all data from the index
   */
  clear() {
    this.index.clear();
    this.documentTerms.clear();
    this.documentLengths.clear();
  }
}
function valuesEqual(a, b) {
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
  if (fieldValue == void 0) return false;
  if (isArray(fieldValue)) {
    for (var i = 0; i < fieldValue.length; i++) {
      if (checkFn(fieldValue[i])) return true;
    }
    return false;
  }
  return checkFn(fieldValue);
}
function text(prop, query) {
  const textIndex = new TextIndex();
  textIndex.add("id", prop);
  const results = textIndex.query(query, { scored: false });
  return results.length === 1;
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
    else throw { $err: "Can't canonicalize query: BadValue unknown top level operator: " + key, code: 17287 };
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
            if (!fieldValueMatches(fieldValue, function(v) {
              return typeof v == operand;
            })) return false;
          } else if (operator == "$mod") {
            if (operand.length != 2) throw { $err: "Can't canonicalize query: BadValue malformed mod, not enough elements", code: 17287 };
            if (!fieldValueMatches(fieldValue, function(v) {
              return v != void 0 && v % operand[0] == operand[1];
            })) return false;
          } else if (operator == "$regex") {
            if (!fieldValueMatches(fieldValue, function(v) {
              return v != void 0 && v.match(operand);
            })) return false;
          } else if (operator == "$text") {
            if (!fieldValueMatches(fieldValue, function(v) {
              return v != void 0 && text(v, operand);
            })) return false;
          } else if (operator == "$geoWithin") {
            if (!fieldValueMatches(fieldValue, function(v) {
              return v != void 0 && geoWithin(v, operand);
            })) return false;
          } else if (operator == "$near" || operator == "$nearSphere" || operator == "$geoIntersects") ;
          else if (operator == "$not") {
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
function applyUpdates(updates, doc, setOnInsert) {
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
        if (currentValue == void 0) currentValue = 0;
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
    } else if (key == "$currentDate") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        doc[fields[j]] = /* @__PURE__ */ new Date();
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
function createDocFromUpdate(query, updates, idGenerator) {
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
class Index {
  constructor(name, keys, storage, options = {}) {
    this.name = name;
    this.keys = keys;
    this.storage = storage;
    this.options = options;
  }
  /**
   * Add a document to the index
   * @param {Object} doc - The document to index
   */
  add(doc) {
    throw new Error("add() must be implemented by subclass");
  }
  /**
   * Remove a document from the index
   * @param {Object} doc - The document to remove
   */
  remove(doc) {
    throw new Error("remove() must be implemented by subclass");
  }
  /**
   * Update a document in the index (remove old, add new)
   * @param {Object} oldDoc - The old document
   * @param {Object} newDoc - The new document
   */
  update(oldDoc, newDoc) {
    this.remove(oldDoc);
    this.add(newDoc);
  }
  /**
   * Query the index
   * @param {*} query - The query to execute
   * @returns {Array} Array of document IDs or null if index cannot satisfy query
   */
  query(query) {
    throw new Error("query() must be implemented by subclass");
  }
  /**
   * Clear all data from the index
   */
  clear() {
    throw new Error("clear() must be implemented by subclass");
  }
  /**
   * Get index specification (for getIndexes())
   */
  getSpec() {
    return {
      name: this.name,
      key: this.keys
    };
  }
  /**
   * Serialize index state for storage
   * @returns {Object} Serializable index state
   */
  serialize() {
    throw new Error("serialize() must be implemented by subclass");
  }
  /**
   * Restore index state from serialized data
   * @param {Object} data - Serialized index state
   */
  deserialize(data) {
    throw new Error("deserialize() must be implemented by subclass");
  }
}
function isNumericString(str) {
  if (typeof str !== "string" || str.trim() === "") {
    return false;
  }
  return Number.isFinite(+str);
}
class BPlusTreeNode {
  /**
   * Creates a new B+ tree node
   * @param {boolean} isLeaf - Whether this node is a leaf node
   */
  constructor(isLeaf, indexStore, nodeCache) {
    if (!(indexStore instanceof IndexStore)) {
      throw new Error("IndexStore is required to create BPlusTreeNode");
    }
    if (typeof isLeaf === "object") {
      this._data = isLeaf;
      this.id = this._data.id;
      this.keys = this._data.keys;
      this.values = this._data.values;
      this.children = [];
      for (const childId of this._data.children) {
        if (nodeCache.has(childId)) {
          this.children.push(nodeCache.get(childId));
          continue;
        }
        const childData = indexStore.getDataMap("nodes").get(childId);
        if (!childData) {
          throw new Error(`BPlusTreeNode: Child node with id ${childId} not found in IndexStore`);
        }
        const childNode = new BPlusTreeNode(childData, indexStore, nodeCache);
        this.children.push(childNode);
        nodeCache.set(childId, childNode);
      }
      this.isLeaf = this._data.isLeaf;
      if (this._data.next) {
        if (nodeCache.has(this._data.next)) {
          this.next = nodeCache.get(this._data.next);
        } else {
          const nextData = indexStore.getDataMap("nodes").get(this._data.next);
          if (!nextData) {
            throw new Error(`BPlusTreeNode: Next leaf node with id ${this._data.next} not found in IndexStore`);
          }
          this.next = new BPlusTreeNode(nextData, indexStore, nodeCache);
          nodeCache.set(this.next.id, this.next);
        }
      } else {
        this.next = null;
      }
    } else {
      this._data = {
        id: indexStore.getMeta("nextId"),
        keys: [],
        // Array of keys
        values: [],
        // Array of values (only used in leaf nodes)
        children: [],
        // Array of child nodes (only used in internal nodes)
        isLeaf,
        next: null
        // Pointer to next leaf node (only used in leaf nodes)
      };
      indexStore.setMeta("nextId", this._data.id + 1);
      indexStore.getDataMap("nodes").set(this._data.id, this._data);
      this.id = this._data.id;
      this.keys = this._data.keys;
      this.values = this._data.values;
      this.children = [];
      this.isLeaf = this._data.isLeaf;
      this.next = null;
    }
    const self = this;
    return new Proxy(this, {
      get(target, prop) {
        if (prop === "children") {
          return new Proxy(target.children, {
            get(target2, property, receiver) {
              if (!isNumericString(property)) {
                if (property === "length") {
                  return Reflect.get(target2, property, receiver);
                } else if (property === "splice") {
                  return function(...args) {
                    if (args.length == 3) {
                      if (args[2] instanceof BPlusTreeNode) {
                        self._data.children.splice(args[0], args[1], args[2].id);
                        indexStore.getDataMap("nodes").set(self._data.id, self._data);
                      } else {
                        throw new Error("BPlusTreeNode: children array can only store BPlusTreeNode instances", args[2]);
                      }
                    }
                    return Reflect.apply(target2[property], target2, args);
                  };
                } else if (property === "push") {
                  return function(...args) {
                    if (args.length !== 1) {
                      throw new Error("BPlusTreeNode: children.push only supports single argument");
                    }
                    if (args[0] instanceof BPlusTreeNode) {
                      self._data.children.push(args[0].id);
                      indexStore.getDataMap("nodes").set(self._data.id, self._data);
                      return self.children.push(args[0]);
                    } else {
                      throw new Error("BPlusTreeNode: children array can only store BPlusTreeNode instances", args[2]);
                    }
                  };
                }
              }
              return Reflect.get(target2, property, receiver);
            },
            set(target2, property, value, receiver) {
              if (isNumericString(property) && value instanceof BPlusTreeNode) {
                Reflect.set(self._data.children, property, value.id, receiver);
              } else {
                Reflect.set(self._data.children, property, value, receiver);
              }
              indexStore.getDataMap("nodes").set(self._data.id, self._data);
              return Reflect.set(target2, property, value, receiver);
            }
          });
        }
        return Reflect.get(target, prop);
      },
      set(target, prop, value) {
        if (prop === "next") {
          if (value instanceof BPlusTreeNode) {
            target.next = value;
            target._data.next = value.id;
            indexStore.getDataMap("nodes").set(target._data.id, target._data);
          } else if (value === null) {
            target.next = null;
            target._data.next = null;
            indexStore.getDataMap("nodes").set(target._data.id, target._data);
          } else {
            throw new Error("BPlusTreeNode: next pointer must be a BPlusTreeNode or null");
          }
        } else if (prop === "isLeaf") {
          target.isLeaf = value;
          target._data.isLeaf = value;
          indexStore.getDataMap("nodes").set(target._data.id, target._data);
        } else if (prop === "children") {
          target.children = value;
          target._data.children = value.map((child) => child.id);
          indexStore.getDataMap("nodes").set(target._data.id, target._data);
        } else {
          target[prop] = value;
          target._data[prop] = value;
          indexStore.getDataMap("nodes").set(target._data.id, target._data);
        }
        return true;
      }
    });
  }
}
class BPlusTree {
  /**
   * Creates a new B+ tree
    * @param {number} order - The maximum number of children per node (default: 3)
    */
  constructor(order = 3, indexStore = new IndexStore()) {
    if (order < 3) {
      throw new Error("B+ tree order must be at least 3");
    }
    this.order = order;
    this.minKeys = Math.ceil(order / 2) - 1;
    this.indexStore = indexStore;
    if (indexStore.hasMeta("order")) {
      if (indexStore.getMeta("order") !== this.order) {
        throw new Error(`B+ tree order does not match stored index metadata ${indexStore.getMeta("order")} != ${this.order}`);
      }
      if (indexStore.getMeta("minKeys") != this.minKeys) {
        throw new Error(`B+ tree minKeys does not match stored index metadata ${indexStore.getMeta("minKeys")} != ${this.minKeys}`);
      }
      this._buildTreeFromStorage();
    } else {
      this.indexStore.setMeta("order", this.order);
      this.indexStore.setMeta("minKeys", this.minKeys);
      this.indexStore.setMeta("nextId", 1);
      this.root = new BPlusTreeNode(true, this.indexStore);
      this.indexStore.setMeta("rootId", this.root.id);
    }
  }
  /**
   * Builds the B+ tree from existing data in the IndexStore
   * @private
   */
  _buildTreeFromStorage() {
    const nodeCache = /* @__PURE__ */ new Map();
    const rootData = this.indexStore.getDataMap("nodes").get(this.indexStore.getMeta("rootId"));
    if (!rootData) {
      throw new Error("BPlusTree: Root node not found in IndexStore");
    }
    this.root = new BPlusTreeNode(rootData, this.indexStore, nodeCache);
  }
  /**
   * Searches for a value by key in the B+ tree
   * @param {*} key - The key to search for
   * @returns {Array} Array of values associated with the key, or undefined if not found
   */
  search(key) {
    return this._searchNode(this.root, key);
  }
  /**
   * Internal method to search for a key in a node
   * @private
   * @param {BPlusTreeNode} node - The node to search in
   * @param {*} key - The key to search for
   * @returns {Array} Array of values if found, undefined otherwise
   */
  _searchNode(node, key) {
    if (node.isLeaf) {
      const values = [];
      for (let i = 0; i < node.keys.length; i++) {
        if (key === node.keys[i]) {
          values.push(...node.values[i]);
        }
      }
      return values;
    } else {
      let i = 0;
      while (i < node.keys.length && key >= node.keys[i]) {
        i++;
      }
      return this._searchNode(node.children[i], key);
    }
  }
  /**
   * Inserts a key-value pair into the B+ tree.
   * If the key already exists, its value will be updated.
   * @param {*} key - The key to insert
   * @param {*} value - The value to associate with the key
   */
  add(key, value) {
    const root = this.root;
    if (root.keys.length === this.indexStore.getMeta("order") - 1) {
      const newRoot = new BPlusTreeNode(false, this.indexStore);
      newRoot.children.push(this.root);
      this._splitChild(newRoot, 0);
      this.root = newRoot;
      this.indexStore.setMeta("rootId", this.root.id);
    }
    this._insertNonFull(this.root, key, value);
  }
  /**
   * Inserts a key-value pair into a node that is not full
   * @private
   * @param {BPlusTreeNode} node - The node to insert into
   * @param {*} key - The key to insert
   * @param {*} value - The value to insert
   */
  _insertNonFull(node, key, value) {
    let i = node.keys.length - 1;
    if (node.isLeaf) {
      for (let j = 0; j < node.keys.length; j++) {
        if (node.keys[j] === key) {
          node.values[j].push(value);
          return;
        }
      }
      node.keys.push(null);
      node.values.push(null);
      while (i >= 0 && key < node.keys[i]) {
        node.keys[i + 1] = node.keys[i];
        node.values[i + 1] = node.values[i];
        i--;
      }
      node.keys[i + 1] = key;
      node.values[i + 1] = [value];
    } else {
      i = 0;
      while (i < node.keys.length && key >= node.keys[i]) {
        i++;
      }
      if (node.children[i].keys.length === this.indexStore.getMeta("order") - 1) {
        this._splitChild(node, i);
        if (key >= node.keys[i]) {
          i++;
        }
      }
      this._insertNonFull(node.children[i], key, value);
    }
  }
  /**
   * Splits a full child node
   * @private
   * @param {BPlusTreeNode} parent - The parent node
   * @param {number} index - The index of the child to split
   */
  _splitChild(parent, index) {
    const fullChild = parent.children[index];
    const newChild = new BPlusTreeNode(fullChild.isLeaf, this.indexStore);
    const midIndex = Math.floor((this.indexStore.getMeta("order") - 1) / 2);
    if (fullChild.isLeaf) {
      newChild.keys = fullChild.keys.splice(midIndex);
      newChild.values = fullChild.values.splice(midIndex);
      newChild.next = fullChild.next;
      fullChild.next = newChild;
      parent.keys.splice(index, 0, newChild.keys[0]);
    } else {
      newChild.keys = fullChild.keys.splice(midIndex + 1);
      const promotedKey = fullChild.keys.pop();
      newChild.children = fullChild.children.splice(midIndex + 1);
      parent.keys.splice(index, 0, promotedKey);
    }
    parent.children.splice(index + 1, 0, newChild);
  }
  /**
   * Deletes a specific value from a key in the B+ tree
   * @param {*} key - The key to delete from
   * @param {*} value - The specific value to remove
   * @returns {boolean} True if the value was found and deleted, false otherwise
   */
  deleteValue(key, value) {
    const deleted = this._deleteValue(this.root, key, value);
    if (this.root.keys.length === 0) {
      if (!this.root.isLeaf && this.root.children.length > 0) {
        this.root = this.root.children[0];
        this.indexStore.setMeta("rootId", this.root.id);
      }
    }
    return deleted;
  }
  /**
   * Deletes all values for a key from the B+ tree
   * @param {*} key - The key to delete
   * @returns {boolean} True if the key was found and deleted, false otherwise
   */
  delete(key) {
    const deleted = this._delete(this.root, key);
    if (this.root.keys.length === 0) {
      if (!this.root.isLeaf && this.root.children.length > 0) {
        this.root = this.root.children[0];
        this.indexStore.setMeta("rootId", this.root.id);
      }
    }
    return deleted;
  }
  /**
   * Internal method to delete a specific value from a key
   * @private
   * @param {BPlusTreeNode} node - The node to delete from
   * @param {*} key - The key to delete from
   * @param {*} value - The value to delete
   * @returns {boolean} True if deleted, false otherwise
   */
  _deleteValue(node, key, value) {
    if (node.isLeaf) {
      for (let i = 0; i < node.keys.length; i++) {
        if (key === node.keys[i]) {
          const values = node.values[i];
          const valueIndex = values.indexOf(value);
          if (valueIndex === -1) {
            return false;
          }
          values.splice(valueIndex, 1);
          if (values.length === 0) {
            node.keys.splice(i, 1);
            node.values.splice(i, 1);
          }
          return true;
        }
      }
      return false;
    } else {
      let i = 0;
      while (i < node.keys.length && key >= node.keys[i]) {
        i++;
      }
      const deleted = this._deleteValue(node.children[i], key, value);
      if (deleted) {
        this._rebalanceAfterDelete(node, i);
      }
      return deleted;
    }
  }
  /**
   * Internal method to delete a key from a node
   * @private
   * @param {BPlusTreeNode} node - The node to delete from
   * @param {*} key - The key to delete
   * @returns {boolean} True if deleted, false otherwise
   */
  _delete(node, key) {
    if (node.isLeaf) {
      for (let i = 0; i < node.keys.length; i++) {
        if (key === node.keys[i]) {
          node.keys.splice(i, 1);
          node.values.splice(i, 1);
          return true;
        }
      }
      return false;
    } else {
      let i = 0;
      while (i < node.keys.length && key >= node.keys[i]) {
        i++;
      }
      const deleted = this._delete(node.children[i], key);
      if (deleted) {
        this._rebalanceAfterDelete(node, i);
      }
      return deleted;
    }
  }
  /**
   * Rebalances the tree after a deletion
   * @private
   * @param {BPlusTreeNode} parent - The parent node
   * @param {number} index - The index of the child that was modified
   */
  _rebalanceAfterDelete(parent, index) {
    const child = parent.children[index];
    if (child.keys.length >= this.indexStore.getMeta("minKeys")) {
      return;
    }
    if (index > 0) {
      const leftSibling = parent.children[index - 1];
      if (leftSibling.keys.length > this.indexStore.getMeta("minKeys")) {
        this._borrowFromLeft(parent, index);
        return;
      }
    }
    if (index < parent.children.length - 1) {
      const rightSibling = parent.children[index + 1];
      if (rightSibling.keys.length > this.indexStore.getMeta("minKeys")) {
        this._borrowFromRight(parent, index);
        return;
      }
    }
    if (index > 0) {
      this._merge(parent, index - 1);
    } else {
      this._merge(parent, index);
    }
  }
  /**
   * Borrows a key from the left sibling
   * @private
   * @param {BPlusTreeNode} parent - The parent node
   * @param {number} index - The index of the child
   */
  _borrowFromLeft(parent, index) {
    const child = parent.children[index];
    const leftSibling = parent.children[index - 1];
    if (child.isLeaf) {
      child.keys.unshift(leftSibling.keys.pop());
      child.values.unshift(leftSibling.values.pop());
      parent.keys[index - 1] = child.keys[0];
    } else {
      child.keys.unshift(parent.keys[index - 1]);
      parent.keys[index - 1] = leftSibling.keys.pop();
      child.children.unshift(leftSibling.children.pop());
    }
  }
  /**
   * Borrows a key from the right sibling
   * @private
   * @param {BPlusTreeNode} parent - The parent node
   * @param {number} index - The index of the child
   */
  _borrowFromRight(parent, index) {
    const child = parent.children[index];
    const rightSibling = parent.children[index + 1];
    if (child.isLeaf) {
      child.keys.push(rightSibling.keys.shift());
      child.values.push(rightSibling.values.shift());
      parent.keys[index] = rightSibling.keys[0];
    } else {
      child.keys.push(parent.keys[index]);
      parent.keys[index] = rightSibling.keys.shift();
      child.children.push(rightSibling.children.shift());
    }
  }
  /**
   * Merges a child with its right sibling
   * @private
   * @param {BPlusTreeNode} parent - The parent node
   * @param {number} index - The index of the left child to merge
   */
  _merge(parent, index) {
    const leftChild = parent.children[index];
    const rightChild = parent.children[index + 1];
    if (leftChild.isLeaf) {
      leftChild.keys = leftChild.keys.concat(rightChild.keys);
      leftChild.values = leftChild.values.concat(rightChild.values);
      leftChild.next = rightChild.next;
      parent.keys.splice(index, 1);
    } else {
      leftChild.keys.push(parent.keys[index]);
      leftChild.keys = leftChild.keys.concat(rightChild.keys);
      leftChild.children = leftChild.children.concat(rightChild.children);
      parent.keys.splice(index, 1);
    }
    parent.children.splice(index + 1, 1);
  }
  /**
   * Returns all key-value pairs in sorted order
   * @returns {Array} Array of {key, value} objects
   */
  toArray() {
    const result = [];
    let current = this._getFirstLeaf(this.root);
    while (current) {
      for (let i = 0; i < current.keys.length; i++) {
        const values = current.values[i];
        for (let j = 0; j < values.length; j++) {
          result.push({
            key: current.keys[i],
            value: values[j]
          });
        }
      }
      current = current.next;
    }
    return result;
  }
  /**
   * Gets the first (leftmost) leaf node
   * @private
   * @param {BPlusTreeNode} node - The node to start from
   * @returns {BPlusTreeNode} The leftmost leaf node
   */
  _getFirstLeaf(node) {
    if (node.isLeaf) {
      return node;
    }
    return this._getFirstLeaf(node.children[0]);
  }
  /**
   * Returns the number of key-value pairs in the tree
   * @returns {number} The size of the tree
   */
  size() {
    let count = 0;
    let current = this._getFirstLeaf(this.root);
    while (current) {
      for (let i = 0; i < current.values.length; i++) {
        count += current.values[i].length;
      }
      current = current.next;
    }
    return count;
  }
  /**
   * Checks if the tree is empty
   * @returns {boolean} True if the tree is empty
   */
  isEmpty() {
    return this.root.keys.length === 0;
  }
  /**
   * Clears all entries from the tree
   */
  clear() {
    this.indexStore.getDataMap("nodes").clear();
    this.root = new BPlusTreeNode(true, this.indexStore);
    this.indexStore.setMeta("rootId", this.root.id);
  }
  /**
   * Performs a range search for all keys between min and max (inclusive)
   * @param {*} minKey - The minimum key (inclusive)
   * @param {*} maxKey - The maximum key (inclusive)
   * @returns {Array} Array of {key, value} objects in range
   */
  rangeSearch(minKey, maxKey) {
    const result = [];
    let current = this._getFirstLeaf(this.root);
    while (current && current.keys[current.keys.length - 1] < minKey) {
      current = current.next;
    }
    while (current) {
      for (let i = 0; i < current.keys.length; i++) {
        if (current.keys[i] >= minKey && current.keys[i] <= maxKey) {
          const values = current.values[i];
          for (let j = 0; j < values.length; j++) {
            result.push({
              key: current.keys[i],
              value: values[j]
            });
          }
        } else if (current.keys[i] > maxKey) {
          return result;
        }
      }
      current = current.next;
    }
    return result;
  }
  /**
   * Gets the height of the tree
   * @returns {number} The height of the tree
   */
  getHeight() {
    let height = 0;
    let current = this.root;
    while (!current.isLeaf) {
      height++;
      current = current.children[0];
    }
    return height;
  }
}
class RegularCollectionIndex extends Index {
  constructor(name, keys, storage, options = {}) {
    super(name, keys, storage, options);
    this.data = new BPlusTree(50, storage);
  }
  /**
   * Extract index key value from a document
   */
  extractIndexKey(doc) {
    const keyFields = Object.keys(this.keys);
    if (keyFields.length === 0) return null;
    if (keyFields.length === 1) {
      const field = keyFields[0];
      const value = getProp(doc, field);
      if (value === void 0) return null;
      return value;
    }
    const keyParts = [];
    for (let i = 0; i < keyFields.length; i++) {
      const value = getProp(doc, keyFields[i]);
      if (value === void 0) return null;
      keyParts.push(
        value
        /*JSON.stringify(value) */
      );
    }
    return keyParts.join("\0");
  }
  /**
   * Add a document to the index
    * 
   * @param {Object} doc - The document to index
   */
  add(doc) {
    const indexKey = this.extractIndexKey(doc);
    if (indexKey !== null) {
      this.data.add(indexKey, doc._id.toString());
    }
  }
  /**
   * Remove a document from the index
    * 
   * @param {Object} doc - The document to remove
   */
  remove(doc) {
    const indexKey = this.extractIndexKey(doc);
    if (indexKey !== null) {
      this.data.delete(indexKey, doc._id.toString());
    }
  }
  /**
   * Query the index
    * 
   * @param {*} query - The query object
   * @returns {Array|null} Array of document IDs or null if index cannot satisfy query
   */
  query(query) {
    const queryKeys = Object.keys(query);
    const indexFields = Object.keys(this.keys);
    if (indexFields.length !== 1) {
      return null;
    }
    const field = indexFields[0];
    if (queryKeys.indexOf(field) === -1) {
      return null;
    }
    const queryValue = query[field];
    if (typeof queryValue !== "object" || queryValue === null) {
      const indexKey = queryValue;
      return this.data.search(indexKey);
    }
    if (typeof queryValue === "object" && !Array.isArray(queryValue)) {
      return this._queryWithOperators(field, queryValue);
    }
    return null;
  }
  /**
   * Query index with comparison operators
    * 
   * @private
   */
  _queryWithOperators(field, operators) {
    const ops = Object.keys(operators);
    const results = /* @__PURE__ */ new Set();
    const hasRangeOp = ops.some((op) => ["$gt", "$gte", "$lt", "$lte"].includes(op));
    if (hasRangeOp) {
      const hasGt = ops.includes("$gt") || ops.includes("$gte");
      const hasLt = ops.includes("$lt") || ops.includes("$lte");
      if (hasGt && hasLt) {
        const minValue = ops.includes("$gte") ? operators["$gte"] : ops.includes("$gt") ? operators["$gt"] : -Infinity;
        const maxValue = ops.includes("$lte") ? operators["$lte"] : ops.includes("$lt") ? operators["$lt"] : Infinity;
        const minKey = minValue;
        const maxKey = maxValue;
        const rangeResults = this.data.rangeSearch(minKey, maxKey);
        for (const { key, value } of rangeResults) {
          try {
            const keyValue = key;
            let matches2 = true;
            if (ops.includes("$gt") && !(keyValue > operators["$gt"])) matches2 = false;
            if (ops.includes("$gte") && !(keyValue >= operators["$gte"])) matches2 = false;
            if (ops.includes("$lt") && !(keyValue < operators["$lt"])) matches2 = false;
            if (ops.includes("$lte") && !(keyValue <= operators["$lte"])) matches2 = false;
            if (matches2 && value) {
              results.add(value);
            }
          } catch (e) {
          }
        }
        return Array.from(results);
      } else {
        const allEntries = this.data.toArray();
        for (const { key, value } of allEntries) {
          try {
            const keyValue = key;
            let matches2 = true;
            for (const op of ops) {
              const operand = operators[op];
              if (op === "$gt" && !(keyValue > operand)) matches2 = false;
              else if (op === "$gte" && !(keyValue >= operand)) matches2 = false;
              else if (op === "$lt" && !(keyValue < operand)) matches2 = false;
              else if (op === "$lte" && !(keyValue <= operand)) matches2 = false;
              else if (op === "$eq" && !(keyValue === operand)) matches2 = false;
              else if (op === "$ne" && !(keyValue !== operand)) matches2 = false;
            }
            if (matches2 && value) {
              results.add(value);
            }
          } catch (e) {
          }
        }
        return Array.from(results);
      }
    }
    if (ops.includes("$in")) {
      const values = operators["$in"];
      if (Array.isArray(values)) {
        for (const value of values) {
          const indexKey = value;
          const idArray = this.data.search(indexKey);
          if (idArray) {
            idArray.forEach((id) => results.add(id));
          }
        }
        return Array.from(results);
      }
    }
    if (ops.includes("$eq")) {
      const value = operators["$eq"];
      const indexKey = value;
      const result = this.data.search(indexKey);
      return result || [];
    }
    if (ops.includes("$ne")) {
      const excludeValue = operators["$ne"];
      const excludeKey = excludeValue;
      const allEntries = this.data.toArray();
      for (const { key, value } of allEntries) {
        if (key !== excludeKey && value) {
          results.add(value);
        }
      }
      return Array.from(results);
    }
    return null;
  }
  /**
   * Clear all entries from the index
   */
  clear() {
    this.data.clear();
  }
}
class TextCollectionIndex extends Index {
  constructor(name, keys, storage, options = {}) {
    super(name, keys, storage, options);
    this.textIndex = new TextIndex(storage);
    this.indexedFields = [];
    for (const field in keys) {
      if (keys[field] === "text") {
        this.indexedFields.push(field);
      }
    }
    if (this.indexedFields.length === 0) {
      throw new Error('Text index must have at least one field with type "text"');
    }
  }
  /**
   * Extract text content from a document for the indexed fields
   * @param {Object} doc - The document
   * @returns {string} Combined text from all indexed fields
   */
  _extractText(doc) {
    const textParts = [];
    for (const field of this.indexedFields) {
      const value = getProp(doc, field);
      if (value !== void 0 && value !== null) {
        textParts.push(String(value));
      }
    }
    return textParts.join(" ");
  }
  /**
   * Add a document to the text index
   * @param {Object} doc - The document to index
   */
  add(doc) {
    if (!doc._id) {
      throw new Error("Document must have an _id field");
    }
    const text2 = this._extractText(doc);
    if (text2) {
      this.textIndex.add(String(doc._id), text2);
    }
  }
  /**
   * Remove a document from the text index
   * @param {Object} doc - The document to remove
   */
  remove(doc) {
    if (!doc._id) {
      return;
    }
    this.textIndex.remove(String(doc._id));
  }
  /**
   * Query the text index
   * @param {*} query - The query object
   * @returns {Array|null} Array of document IDs or null if query is not a text search
   */
  query(query) {
    return null;
  }
  /**
   * Search the text index
   * @param {string} searchText - The text to search for
   * @param {Object} options - Search options
   * @returns {Array} Array of document IDs
   */
  search(searchText, options = {}) {
    const results = this.textIndex.query(searchText, { scored: false, ...options });
    return results;
  }
  /**
   * Clear all data from the index
   */
  clear() {
    this.textIndex.clear();
  }
  /**
   * Get index specification
   */
  getSpec() {
    return {
      name: this.name,
      key: this.keys,
      textIndexVersion: 3,
      weights: this._getWeights()
    };
  }
  /**
   * Get field weights (all default to 1 for now)
   */
  _getWeights() {
    const weights = {};
    for (const field of this.indexedFields) {
      weights[field] = 1;
    }
    return weights;
  }
}
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function radiusToBoundingBox(lat, lng, radiusKm) {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta
  };
}
function intersects(bbox1, bbox2) {
  return !(bbox1.maxLat < bbox2.minLat || bbox1.minLat > bbox2.maxLat || bbox1.maxLng < bbox2.minLng || bbox1.minLng > bbox2.maxLng);
}
function area(bbox) {
  return (bbox.maxLat - bbox.minLat) * (bbox.maxLng - bbox.minLng);
}
function union(bbox1, bbox2) {
  return {
    minLat: Math.min(bbox1.minLat, bbox2.minLat),
    maxLat: Math.max(bbox1.maxLat, bbox2.maxLat),
    minLng: Math.min(bbox1.minLng, bbox2.minLng),
    maxLng: Math.max(bbox1.maxLng, bbox2.maxLng)
  };
}
function enlargement(bbox1, bbox2) {
  const unionBox = union(bbox1, bbox2);
  return area(unionBox) - area(bbox1);
}
class RTreeNode {
  constructor(isLeaf = false, indexStore) {
    if (!(indexStore instanceof IndexStore)) {
      throw new Error("IndexStore is required to create RTreeNode");
    }
    this.indexStore = indexStore;
    if (typeof isLeaf === "object") {
      this._data = isLeaf;
      this.id = this._data.id;
      this.isLeaf = this._data.isLeaf;
      this.children = [];
      this.bbox = Object.assign({}, this._data.bbox);
      if (!this.isLeaf) {
        for (const childId of this._data.children) {
          const childData = indexStore.getDataMap("nodes").get(childId);
          if (!childData) {
            throw new Error(`RTreeNode: Child node with id ${childId} not found in IndexStore`);
          }
          const childNode = new RTreeNode(childData, indexStore);
          this.children.push(childNode);
        }
      } else {
        this.children = [...this._data.children];
      }
    } else {
      this._data = {
        id: indexStore.getMeta("nextId"),
        isLeaf,
        children: [],
        bbox: null
      };
      indexStore.setMeta("nextId", this._data.id + 1);
      indexStore.getDataMap("nodes").set(this._data.id, this._data);
      this.id = this._data.id;
      this.isLeaf = isLeaf;
      this.children = [];
      this.bbox = null;
    }
    return new Proxy(this, {
      set(target, prop, value) {
        if (prop === "children") {
          target.children = value;
          if (!target.isLeaf) {
            target._data.children = target.children.map((child) => child.id);
          } else {
            target._data.children = [...target.children];
          }
          indexStore.getDataMap("nodes").set(target.id, target._data);
          return true;
        }
        target[prop] = value;
        return true;
      },
      get(target, prop) {
        if (prop === "children") {
          return new Proxy(target.children, {
            set(childTarget, childProp, childValue) {
              childTarget[childProp] = childValue;
              if (!target.isLeaf) {
                target._data.children = target.children.map((child) => child.id);
              } else {
                target._data.children = [...target.children];
              }
              indexStore.getDataMap("nodes").set(target.id, target._data);
              return true;
            }
          });
        }
        return target[prop];
      }
    });
  }
  /**
   * Update the bounding box to contain all children
   */
  updateBBox() {
    if (this.children.length === 0) {
      this.bbox = null;
      return;
    }
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    for (const child of this.children) {
      const bbox = child.bbox;
      minLat = Math.min(minLat, bbox.minLat);
      maxLat = Math.max(maxLat, bbox.maxLat);
      minLng = Math.min(minLng, bbox.minLng);
      maxLng = Math.max(maxLng, bbox.maxLng);
    }
    this.bbox = { minLat, maxLat, minLng, maxLng };
    this._data.bbox = Object.assign({}, this.bbox);
    this.indexStore.getDataMap("nodes").set(this.id, this._data);
  }
}
class RTree {
  constructor(maxEntries = 9, indexStore = new IndexStore()) {
    this.maxEntries = maxEntries;
    this.minEntries = Math.max(2, Math.ceil(maxEntries / 2));
    this.indexStore = indexStore;
    if (indexStore.hasMeta("maxEntries")) {
      if (indexStore.getMeta("maxEntries") !== maxEntries) {
        throw new Error(`R-tree maxEntries does not match stored index metadata ${indexStore.getMeta("maxEntries")} != ${maxEntries}`);
      }
      if (indexStore.getMeta("minEntries") !== this.minEntries) {
        throw new Error(`R-tree minEntries does not match stored index metadata ${indexStore.getMeta("minEntries")} != ${this.minEntries}`);
      }
      this._size = this.indexStore.getMeta("size");
      this.root = new RTreeNode(this.indexStore.getDataMap("nodes").get(this.indexStore.getMeta("rootId")), this.indexStore);
    } else {
      this.indexStore.setMeta("maxEntries", this.maxEntries);
      this.indexStore.setMeta("minEntries", this.minEntries);
      this.indexStore.setMeta("nextId", 1);
      this.root = new RTreeNode(true, this.indexStore);
      this.indexStore.setMeta("rootId", this.root.id);
      this.indexStore.setMeta("size", 0);
      this._size = 0;
    }
  }
  /**
   * Insert a point into the R-tree
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {*} data - Associated data
   */
  insert(lat, lng, data) {
    const bbox = {
      minLat: lat,
      maxLat: lat,
      minLng: lng,
      maxLng: lng
    };
    const entry = { bbox, lat, lng, data };
    this._insert(entry, this.root, 1);
    this._size++;
    this.indexStore.setMeta("size", this._size);
  }
  /**
   * Internal insert method
   */
  _insert(entry, node, level) {
    if (node.isLeaf) {
      node.children.push(entry);
      node.updateBBox();
      if (node.children.length > this.maxEntries) {
        return this._split(node);
      }
    } else {
      const target = this._chooseSubtree(entry.bbox, node);
      const splitNode = this._insert(entry, target, level + 1);
      if (splitNode) {
        node.children.push(splitNode);
        node.updateBBox();
        if (node.children.length > this.maxEntries) {
          return this._split(node);
        }
      } else {
        node.updateBBox();
      }
    }
    return null;
  }
  /**
   * Choose the best subtree to insert an entry
   */
  _chooseSubtree(bbox, node) {
    let minEnlargement = Infinity;
    let minArea = Infinity;
    let targetNode = null;
    for (const child of node.children) {
      const enl = enlargement(child.bbox, bbox);
      const ar = area(child.bbox);
      if (enl < minEnlargement || enl === minEnlargement && ar < minArea) {
        minEnlargement = enl;
        minArea = ar;
        targetNode = child;
      }
    }
    return targetNode;
  }
  /**
   * Split an overflowing node
   */
  _split(node) {
    const children = node.children;
    const isLeaf = node.isLeaf;
    let maxDist = -Infinity;
    let seed1Idx = 0, seed2Idx = 1;
    for (let i = 0; i < children.length; i++) {
      for (let j = i + 1; j < children.length; j++) {
        const bbox1 = children[i].bbox;
        const bbox2 = children[j].bbox;
        const combinedBox = union(bbox1, bbox2);
        const waste = area(combinedBox) - area(bbox1) - area(bbox2);
        if (waste > maxDist) {
          maxDist = waste;
          seed1Idx = i;
          seed2Idx = j;
        }
      }
    }
    const node1 = new RTreeNode(isLeaf, this.indexStore);
    const node2 = new RTreeNode(isLeaf, this.indexStore);
    node1.children.push(children[seed1Idx]);
    node2.children.push(children[seed2Idx]);
    for (let i = 0; i < children.length; i++) {
      if (i === seed1Idx || i === seed2Idx) continue;
      const child = children[i];
      const bbox = child.bbox;
      const enl1 = node1.children.length === 0 ? Infinity : enlargement(node1.bbox || bbox, bbox);
      const enl2 = node2.children.length === 0 ? Infinity : enlargement(node2.bbox || bbox, bbox);
      if (node1.children.length < this.minEntries && children.length - i + node1.children.length <= this.minEntries) {
        node1.children.push(child);
      } else if (node2.children.length < this.minEntries && children.length - i + node2.children.length <= this.minEntries) {
        node2.children.push(child);
      } else if (enl1 < enl2) {
        node1.children.push(child);
      } else if (enl2 < enl1) {
        node2.children.push(child);
      } else {
        const area1 = node1.bbox ? area(node1.bbox) : 0;
        const area2 = node2.bbox ? area(node2.bbox) : 0;
        if (area1 < area2) {
          node1.children.push(child);
        } else {
          node2.children.push(child);
        }
      }
      node1.updateBBox();
      node2.updateBBox();
    }
    node.children = node1.children;
    node.updateBBox();
    if (node === this.root) {
      const newRoot = new RTreeNode(false, this.indexStore);
      newRoot.children = [node1, node2];
      newRoot.updateBBox();
      this.root = newRoot;
      this.indexStore.setMeta("rootId", this.root.id);
      return null;
    }
    return node2;
  }
  /**
   * Search for points within a bounding box
   * @param {Object} bbox - Bounding box {minLat, maxLat, minLng, maxLng}
   * @returns {Array} Array of matching entries
   */
  searchBBox(bbox) {
    const results = [];
    this._searchBBox(bbox, this.root, results);
    return results;
  }
  /**
   * Internal bounding box search
   */
  _searchBBox(bbox, node, results) {
    if (!node.bbox || !intersects(bbox, node.bbox)) {
      return;
    }
    if (node.isLeaf) {
      for (const entry of node.children) {
        if (intersects(bbox, entry.bbox)) {
          results.push(entry);
        }
      }
    } else {
      for (const child of node.children) {
        this._searchBBox(bbox, child, results);
      }
    }
  }
  /**
   * Search for points within a radius of a location
   * @param {number} lat - Center latitude
   * @param {number} lng - Center longitude
   * @param {number} radiusKm - Radius in kilometers
   * @returns {Array} Array of matching entries
   */
  searchRadius(lat, lng, radiusKm) {
    const bbox = radiusToBoundingBox(lat, lng, radiusKm);
    const candidates = this.searchBBox(bbox);
    const results = [];
    for (const entry of candidates) {
      const dist = haversineDistance(lat, lng, entry.lat, entry.lng);
      if (dist <= radiusKm) {
        results.push(entry);
      }
    }
    return results;
  }
  /**
   * Remove a point from the R-tree
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {*} data - Associated data (optional, for exact match)
   * @returns {boolean} True if removed, false if not found
   */
  remove(lat, lng, data = null) {
    const bbox = {
      minLat: lat,
      maxLat: lat,
      minLng: lng,
      maxLng: lng
    };
    const removed = this._remove(bbox, data, this.root, null, -1);
    if (removed) {
      this._size--;
      this.indexStore.setMeta("size", this._size);
    }
    if (this.root.children.length === 1 && !this.root.isLeaf) {
      this.root = this.root.children[0];
      this.indexStore.setMeta("rootId", this.root.id);
    }
    return removed;
  }
  /**
   * Internal remove method
   */
  _remove(bbox, data, node, parent, indexInParent) {
    if (!node.bbox || !intersects(bbox, node.bbox)) {
      return false;
    }
    if (node.isLeaf) {
      for (let i = 0; i < node.children.length; i++) {
        const entry = node.children[i];
        if (entry.lat === bbox.minLat && entry.lng === bbox.minLng) {
          const dataMatches = data === null || JSON.stringify(entry.data) === JSON.stringify(data);
          if (dataMatches) {
            node.children.splice(i, 1);
            node.updateBBox();
            if (node.children.length < this.minEntries && node !== this.root) {
              const entries = node.children.slice();
              node.children = [];
              node.updateBBox();
              if (parent) {
                parent.children.splice(indexInParent, 1);
                parent.updateBBox();
              }
              for (const e of entries) {
                this._insert(e, this.root, 1);
              }
            }
            return true;
          }
        }
      }
    } else {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (this._remove(bbox, data, child, node, i)) {
          node.updateBBox();
          return true;
        }
      }
    }
    return false;
  }
  /**
   * Get all entries in the tree
   * @returns {Array} All entries
   */
  getAll() {
    const results = [];
    this._getAll(this.root, results);
    return results;
  }
  /**
   * Internal method to get all entries
   */
  _getAll(node, results) {
    if (node.isLeaf) {
      results.push(...node.children);
    } else {
      for (const child of node.children) {
        this._getAll(child, results);
      }
    }
  }
  /**
   * Get the number of entries in the tree
   * @returns {number} Number of entries
   */
  size() {
    return this._size;
  }
  /**
   * Clear all entries from the tree
   */
  clear() {
    this.root = new RTreeNode(true, this.indexStore);
    this.indexStore.setMeta("rootId", this.root.id);
    this._size = 0;
    this.indexStore.setMeta("size", 0);
  }
}
class GeospatialCollectionIndex extends Index {
  constructor(name, keys, storage, options = {}) {
    super(name, keys, storage, options);
    this.rtree = new RTree(9, storage);
    this.geoField = null;
    for (const field in keys) {
      if (keys[field] === "2dsphere" || keys[field] === "2d") {
        this.geoField = field;
        break;
      }
    }
    if (!this.geoField) {
      throw new Error('Geospatial index must have at least one field with type "2dsphere" or "2d"');
    }
  }
  /**
   * Extract coordinates from a GeoJSON object
   * @param {Object} geoJson - The GeoJSON object
   * @returns {Object|null} Object with lat and lng, or null if invalid
   */
  _extractCoordinates(geoJson) {
    if (!geoJson) return null;
    if (geoJson.type === "FeatureCollection" && geoJson.features && geoJson.features.length > 0) {
      const feature = geoJson.features[0];
      if (feature.geometry) {
        return this._extractCoordinates(feature.geometry);
      }
    }
    if (geoJson.type === "Feature" && geoJson.geometry) {
      return this._extractCoordinates(geoJson.geometry);
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
  /**
   * Add a document to the geospatial index
   * @param {Object} doc - The document to index
   */
  add(doc) {
    if (!doc._id) {
      throw new Error("Document must have an _id field");
    }
    const geoValue = getProp(doc, this.geoField);
    const coords = this._extractCoordinates(geoValue);
    if (coords) {
      this.rtree.insert(coords.lat, coords.lng, {
        _id: doc._id,
        geoJson: geoValue
      });
    }
  }
  /**
   * Remove a document from the geospatial index
   * @param {Object} doc - The document to remove
   */
  remove(doc) {
    if (!doc._id) {
      return;
    }
    const geoValue = getProp(doc, this.geoField);
    const coords = this._extractCoordinates(geoValue);
    if (coords) {
      this.rtree.remove(coords.lat, coords.lng, {
        _id: doc._id,
        geoJson: geoValue
      });
    }
  }
  /**
   * Query the geospatial index
   * @param {*} query - The query object
   * @returns {Array|null} Array of document IDs or null if query is not a geospatial query
   */
  query(query) {
    if (!query[this.geoField]) {
      return null;
    }
    const geoQuery = query[this.geoField];
    if (geoQuery.$geoWithin) {
      const bbox = geoQuery.$geoWithin;
      if (Array.isArray(bbox) && bbox.length === 2) {
        const minLon = bbox[0][0];
        const maxLat = bbox[0][1];
        const maxLon = bbox[1][0];
        const minLat = bbox[1][1];
        const results = this.rtree.searchBBox({
          minLat,
          maxLat,
          minLng: minLon,
          maxLng: maxLon
        });
        return results.map((entry) => entry.data._id);
      }
    }
    if (geoQuery.$near) {
      const nearQuery = geoQuery.$near;
      let coordinates;
      if (nearQuery.$geometry) {
        coordinates = nearQuery.$geometry.coordinates;
      } else if (nearQuery.coordinates) {
        coordinates = nearQuery.coordinates;
      } else if (Array.isArray(nearQuery)) {
        coordinates = nearQuery;
      } else {
        return null;
      }
      if (!coordinates || coordinates.length < 2) {
        return null;
      }
      const [lng, lat] = coordinates;
      const maxDistanceMeters = nearQuery.$maxDistance || 1e6;
      const maxDistanceKm = maxDistanceMeters / 1e3;
      const results = this.rtree.searchRadius(lat, lng, maxDistanceKm);
      const withDistances = results.map((entry) => {
        const dist = this._haversineDistance(lat, lng, entry.lat, entry.lng);
        return {
          _id: entry.data._id,
          distance: dist
        };
      });
      withDistances.sort((a, b) => a.distance - b.distance);
      return withDistances.map((entry) => entry._id);
    }
    if (geoQuery.$nearSphere) {
      const nearQuery = geoQuery.$nearSphere;
      let coordinates;
      if (nearQuery.$geometry) {
        coordinates = nearQuery.$geometry.coordinates;
      } else if (nearQuery.coordinates) {
        coordinates = nearQuery.coordinates;
      } else if (Array.isArray(nearQuery)) {
        coordinates = nearQuery;
      } else {
        return null;
      }
      if (!coordinates || coordinates.length < 2) {
        return null;
      }
      const [lng, lat] = coordinates;
      const maxDistanceMeters = nearQuery.$maxDistance || 1e6;
      const maxDistanceKm = maxDistanceMeters / 1e3;
      const results = this.rtree.searchRadius(lat, lng, maxDistanceKm);
      const withDistances = results.map((entry) => {
        const dist = this._haversineDistance(lat, lng, entry.lat, entry.lng);
        return {
          _id: entry.data._id,
          distance: dist
        };
      });
      withDistances.sort((a, b) => a.distance - b.distance);
      return withDistances.map((entry) => entry._id);
    }
    if (geoQuery.$geoIntersects) {
      const intersectsQuery = geoQuery.$geoIntersects;
      let geometry;
      if (intersectsQuery.$geometry) {
        geometry = intersectsQuery.$geometry;
      } else {
        return null;
      }
      if (!geometry || !geometry.type) {
        return null;
      }
      if (geometry.type === "Point") {
        const [lng, lat] = geometry.coordinates;
        const epsilon = 1e-4;
        const results = this.rtree.searchBBox({
          minLat: lat - epsilon,
          maxLat: lat + epsilon,
          minLng: lng - epsilon,
          maxLng: lng + epsilon
        });
        return results.map((entry) => entry.data._id);
      } else if (geometry.type === "Polygon") {
        const coordinates = geometry.coordinates;
        if (!coordinates || coordinates.length === 0) {
          return null;
        }
        const ring = coordinates[0];
        if (!ring || ring.length < 3) {
          return null;
        }
        let minLat = Infinity, maxLat = -Infinity;
        let minLng = Infinity, maxLng = -Infinity;
        for (const coord of ring) {
          const [lng, lat] = coord;
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
        }
        const candidates = this.rtree.searchBBox({
          minLat,
          maxLat,
          minLng,
          maxLng
        });
        const results = candidates.filter((entry) => {
          return this._pointInPolygon(entry.lat, entry.lng, ring);
        });
        return results.map((entry) => entry.data._id);
      }
      return null;
    }
    return null;
  }
  /**
   * Calculate distance between two points using Haversine formula
   * @param {number} lat1 - Latitude of first point
   * @param {number} lng1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lng2 - Longitude of second point
   * @returns {number} Distance in kilometers
   */
  _haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  /**
   * Test if a point is inside a polygon using ray casting algorithm
   * @param {number} lat - Point latitude
   * @param {number} lng - Point longitude
   * @param {Array} ring - Polygon ring as array of [lng, lat] coordinates
   * @returns {boolean} True if point is inside polygon
   */
  _pointInPolygon(lat, lng, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      const intersect = yi > lat !== yj > lat && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi;
      if (intersect) {
        inside = !inside;
      }
    }
    return inside;
  }
  /**
   * Clear all data from the index
   */
  clear() {
    this.rtree.clear();
  }
  /**
   * Get index specification
   */
  getSpec() {
    return {
      name: this.name,
      key: this.keys,
      "2dsphereIndexVersion": 3
    };
  }
}
class QueryPlan {
  constructor() {
    this.type = "full_scan";
    this.indexes = [];
    this.indexScans = [];
    this.estimatedCost = Infinity;
    this.indexOnly = false;
  }
}
class QueryPlanner {
  constructor(indexes) {
    this.indexes = indexes;
  }
  /**
   * Generate an execution plan for a query
   * @param {Object} query - MongoDB query object
   * @returns {QueryPlan} Execution plan
   */
  plan(query) {
    const plan = new QueryPlan();
    if (!query || Object.keys(query).length === 0) {
      return plan;
    }
    const analysis = this._analyzeQuery(query);
    if (analysis.hasTextSearch) {
      const textPlan = this._planTextSearch(query, analysis);
      if (textPlan) {
        return textPlan;
      }
    }
    if (analysis.hasGeoQuery) {
      const geoPlan = this._planGeoQuery(query, analysis);
      if (geoPlan) {
        return geoPlan;
      }
    }
    if (analysis.type === "and") {
      const andPlan = this._planAndQuery(query, analysis);
      if (andPlan.type !== "full_scan") {
        return andPlan;
      }
    }
    if (analysis.type === "or") {
      const orPlan = this._planOrQuery(query, analysis);
      if (orPlan.type !== "full_scan") {
        return orPlan;
      }
    }
    const simplePlan = this._planSimpleQuery(query);
    if (simplePlan.type !== "full_scan") {
      return simplePlan;
    }
    return plan;
  }
  /**
   * Analyze query structure
   * @private
   */
  _analyzeQuery(query) {
    const analysis = {
      type: "simple",
      // 'simple', 'and', 'or', 'complex'
      fields: [],
      operators: {},
      hasTextSearch: false,
      hasGeoQuery: false,
      conditions: []
    };
    const keys = Object.keys(query);
    if (keys.length === 1) {
      const key = keys[0];
      if (key === "$and") {
        analysis.type = "and";
        analysis.conditions = query.$and;
        for (const condition of analysis.conditions) {
          const subAnalysis = this._analyzeQuery(condition);
          analysis.fields.push(...subAnalysis.fields);
          if (subAnalysis.hasTextSearch) analysis.hasTextSearch = true;
          if (subAnalysis.hasGeoQuery) analysis.hasGeoQuery = true;
        }
        return analysis;
      } else if (key === "$or") {
        analysis.type = "or";
        analysis.conditions = query.$or;
        for (const condition of analysis.conditions) {
          const subAnalysis = this._analyzeQuery(condition);
          analysis.fields.push(...subAnalysis.fields);
          if (subAnalysis.hasTextSearch) analysis.hasTextSearch = true;
          if (subAnalysis.hasGeoQuery) analysis.hasGeoQuery = true;
        }
        return analysis;
      }
    }
    for (const field of keys) {
      if (field.startsWith("$")) {
        continue;
      }
      analysis.fields.push(field);
      const value = query[field];
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        const ops = Object.keys(value);
        analysis.operators[field] = ops;
        if (ops.includes("$text")) {
          analysis.hasTextSearch = true;
        }
        if (ops.some((op) => ["$geoWithin", "$geoIntersects", "$near", "$nearSphere"].includes(op))) {
          analysis.hasGeoQuery = true;
        }
      }
    }
    if (keys.length > 1) {
      analysis.type = "and";
    }
    return analysis;
  }
  /**
   * Plan for text search queries
   * @private
   */
  _planTextSearch(query, analysis) {
    for (const [indexName, index] of this.indexes) {
      if (index instanceof TextCollectionIndex) {
        const textQuery = this._extractTextQuery(query);
        if (textQuery) {
          const plan = new QueryPlan();
          plan.type = "index_scan";
          plan.indexes = [indexName];
          const docIds = index.search(textQuery);
          plan.indexScans = [{ indexName, docIds }];
          plan.estimatedCost = docIds.length;
          plan.indexOnly = true;
          return plan;
        }
      }
    }
    return null;
  }
  /**
   * Extract $text query from query object
   * @private
   */
  _extractTextQuery(query) {
    for (const field in query) {
      const value = query[field];
      if (typeof value === "object" && value !== null && value.$text) {
        return typeof value.$text === "string" ? value.$text : value.$text.$search;
      }
    }
    return null;
  }
  /**
   * Plan for geospatial queries
   * @private
   */
  _planGeoQuery(query, analysis) {
    for (const [indexName, index] of this.indexes) {
      if (index instanceof GeospatialCollectionIndex) {
        const docIds = index.query(query);
        if (docIds !== null) {
          const plan = new QueryPlan();
          plan.type = "index_scan";
          plan.indexes = [indexName];
          plan.indexScans = [{ indexName, docIds }];
          plan.estimatedCost = docIds.length;
          plan.indexOnly = true;
          return plan;
        }
      }
    }
    return null;
  }
  /**
   * Plan for $and queries (index intersection)
   * @private
   */
  _planAndQuery(query, analysis) {
    const plan = new QueryPlan();
    let conditions;
    if (query.$and) {
      conditions = query.$and;
    } else {
      conditions = Object.keys(query).map((field) => ({ [field]: query[field] }));
    }
    const indexableConditions = [];
    for (const condition of conditions) {
      const conditionPlan = this._planSimpleQuery(condition);
      if (conditionPlan.type === "index_scan") {
        indexableConditions.push(conditionPlan.indexScans[0]);
      }
    }
    if (indexableConditions.length > 1) {
      plan.type = "index_intersection";
      plan.indexScans = indexableConditions;
      plan.indexes = indexableConditions.map((scan) => scan.indexName);
      plan.estimatedCost = Math.min(...indexableConditions.map((scan) => scan.docIds.length));
      return plan;
    }
    if (indexableConditions.length === 1) {
      plan.type = "index_scan";
      plan.indexScans = [indexableConditions[0]];
      plan.indexes = [indexableConditions[0].indexName];
      plan.estimatedCost = indexableConditions[0].docIds.length;
      return plan;
    }
    return plan;
  }
  /**
   * Plan for $or queries (index union)
   * @private
   */
  _planOrQuery(query, analysis) {
    const plan = new QueryPlan();
    if (!query.$or) {
      return plan;
    }
    const conditions = query.$or;
    const indexableConditions = [];
    for (const condition of conditions) {
      const conditionPlan = this._planSimpleQuery(condition);
      if (conditionPlan.type === "index_scan") {
        indexableConditions.push(conditionPlan.indexScans[0]);
      }
    }
    if (indexableConditions.length > 0) {
      plan.type = "index_union";
      plan.indexScans = indexableConditions;
      plan.indexes = indexableConditions.map((scan) => scan.indexName);
      plan.estimatedCost = indexableConditions.reduce((sum, scan) => sum + scan.docIds.length, 0);
      return plan;
    }
    return plan;
  }
  /**
   * Plan for simple single-field queries
   * @private
   */
  _planSimpleQuery(query) {
    const plan = new QueryPlan();
    const queryKeys = Object.keys(query);
    if (queryKeys.length === 0) {
      return plan;
    }
    for (const [indexName, index] of this.indexes) {
      if (index instanceof TextCollectionIndex || index instanceof GeospatialCollectionIndex) {
        continue;
      }
      const docIds = index.query(query);
      if (docIds !== null && docIds.length >= 0) {
        plan.type = "index_scan";
        plan.indexes = [indexName];
        plan.indexScans = [{ indexName, docIds }];
        plan.estimatedCost = docIds.length;
        return plan;
      }
    }
    return plan;
  }
  /**
   * Execute a query plan and return document IDs
   * @param {QueryPlan} plan - The execution plan
   * @returns {Array|null} Array of document IDs or null for full scan
   */
  execute(plan) {
    if (plan.type === "full_scan") {
      return null;
    }
    if (plan.type === "index_scan") {
      return plan.indexScans[0].docIds;
    }
    if (plan.type === "index_intersection") {
      if (plan.indexScans.length === 0) return null;
      const sorted = plan.indexScans.slice().sort((a, b) => a.docIds.length - b.docIds.length);
      let result = new Set(sorted[0].docIds);
      for (let i = 1; i < sorted.length; i++) {
        const currentSet = new Set(sorted[i].docIds);
        result = new Set([...result].filter((id) => currentSet.has(id)));
        if (result.size === 0) break;
      }
      return Array.from(result);
    }
    if (plan.type === "index_union") {
      const result = /* @__PURE__ */ new Set();
      for (const scan of plan.indexScans) {
        scan.docIds.forEach((id) => result.add(id));
      }
      return Array.from(result);
    }
    return null;
  }
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
    const operand = expr[operator];
    return evaluateOperator(operator, operand, doc);
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
class Collection extends eventsExports.EventEmitter {
  constructor(db, name, storage, idGenerator) {
    super();
    this.db = db;
    this.name = name;
    this.storage = storage;
    this.idGenerator = idGenerator;
    this.indexes = /* @__PURE__ */ new Map();
    this.queryPlanner = new QueryPlanner(this.indexes);
    this.isCollection = true;
    for (const [indexName, indexStore] of this.storage.indexes) {
      let index;
      if (indexStore.getMeta("type") === "text") {
        index = new TextCollectionIndex(indexName, indexStore.getMeta("keys"), indexStore);
      } else if (indexStore.getMeta("type") === "geospatial") {
        index = new GeospatialCollectionIndex(indexName, indexStore.getMeta("keys"), indexStore);
      } else if (indexStore.getMeta("type") === "regular") {
        index = new RegularCollectionIndex(indexName, indexStore.getMeta("keys"), indexStore);
      }
      if (index) {
        this.indexes.set(index.name, index);
      }
    }
  }
  /**
   * Generate index name from keys
   */
  generateIndexName(keys) {
    const parts = [];
    for (const field in keys) {
      if (keys.hasOwnProperty(field)) {
        parts.push(field + "_" + keys[field]);
      }
    }
    return parts.join("_");
  }
  /**
   * Determine if keys specify a text index
   */
  isTextIndex(keys) {
    for (const field in keys) {
      if (keys[field] === "text") {
        return true;
      }
    }
    return false;
  }
  /**
   * Determine if keys specify a geospatial index
   */
  isGeospatialIndex(keys) {
    for (const field in keys) {
      if (keys[field] === "2dsphere" || keys[field] === "2d") {
        return true;
      }
    }
    return false;
  }
  /**
   * Build/rebuild an index
   */
  buildIndex(indexName, keys, options = {}) {
    let index;
    if (this.isTextIndex(keys)) {
      const meta = { type: "text", keys };
      index = new TextCollectionIndex(indexName, keys, this.storage.createIndexStore(indexName, meta), options);
    } else if (this.isGeospatialIndex(keys)) {
      const meta = { type: "geospatial", keys };
      index = new GeospatialCollectionIndex(indexName, keys, this.storage.createIndexStore(indexName, meta), options);
    } else {
      const meta = { type: "regular", keys };
      index = new RegularCollectionIndex(indexName, keys, this.storage.createIndexStore(indexName, meta), options);
    }
    const allDocs = this.storage.getAllDocuments();
    for (const doc of allDocs) {
      if (doc) {
        index.add(doc);
      }
    }
    this.indexes.set(indexName, index);
    return index;
  }
  /**
   * Update indexes when a document is inserted
   */
  updateIndexesOnInsert(doc) {
    for (const [indexName, index] of this.indexes) {
      index.add(doc);
    }
  }
  /**
   * Update indexes when a document is deleted
   */
  updateIndexesOnDelete(doc) {
    for (const [indexName, index] of this.indexes) {
      index.remove(doc);
    }
  }
  /**
   * Query planner - analyze query and determine optimal execution plan
   */
  planQuery(query) {
    const plan = this.queryPlanner.plan(query);
    const docIds = this.queryPlanner.execute(plan);
    return {
      useIndex: plan.type !== "full_scan",
      planType: plan.type,
      indexNames: plan.indexes,
      docIds,
      estimatedCost: plan.estimatedCost,
      indexOnly: plan.indexOnly || false
    };
  }
  /**
   * Get a text index for the given field
   * @param {string} field - The field name
   * @returns {TextCollectionIndex|null} The text index or null if not found
   */
  getTextIndex(field) {
    for (const [indexName, index] of this.indexes) {
      if (index instanceof TextCollectionIndex) {
        if (index.indexedFields.includes(field)) {
          return index;
        }
      }
    }
    return null;
  }
  // Collection methods
  aggregate(pipeline) {
    if (!pipeline || !isArray(pipeline)) {
      throw { $err: "Pipeline must be an array", code: 17287 };
    }
    let results = [];
    const cursor = this.find({});
    while (cursor.hasNext()) {
      results.push(cursor.next());
    }
    for (let i = 0; i < pipeline.length; i++) {
      const stage = pipeline[i];
      const stageKeys = Object.keys(stage);
      if (stageKeys.length !== 1) {
        throw { $err: "Each pipeline stage must have exactly one key", code: 17287 };
      }
      const stageType = stageKeys[0];
      const stageSpec = stage[stageType];
      if (stageType === "$match") {
        const matched = [];
        for (let j = 0; j < results.length; j++) {
          if (matches(results[j], stageSpec)) {
            matched.push(results[j]);
          }
        }
        results = matched;
      } else if (stageType === "$project") {
        const projected = [];
        for (let j = 0; j < results.length; j++) {
          projected.push(applyProjectionWithExpressions(stageSpec, results[j]));
        }
        results = projected;
      } else if (stageType === "$addFields" || stageType === "$set") {
        const modified = [];
        for (let j = 0; j < results.length; j++) {
          const doc = copy(results[j]);
          for (const field in stageSpec) {
            const expr = stageSpec[field];
            doc[field] = evaluateExpression(expr, results[j]);
          }
          modified.push(doc);
        }
        results = modified;
      } else if (stageType === "$unset") {
        const modified = [];
        let fieldsToRemove = [];
        if (typeof stageSpec === "string") {
          fieldsToRemove = [stageSpec];
        } else if (Array.isArray(stageSpec)) {
          fieldsToRemove = stageSpec;
        } else if (typeof stageSpec === "object") {
          fieldsToRemove = Object.keys(stageSpec);
        }
        for (let j = 0; j < results.length; j++) {
          const doc = copy(results[j]);
          for (let k = 0; k < fieldsToRemove.length; k++) {
            const field = fieldsToRemove[k];
            const pathParts = field.split(".");
            if (pathParts.length === 1) {
              delete doc[field];
            } else {
              let parent = doc;
              for (let m = 0; m < pathParts.length - 1; m++) {
                if (parent == void 0 || parent == null) break;
                parent = parent[pathParts[m]];
              }
              if (parent != void 0 && parent != null) {
                delete parent[pathParts[pathParts.length - 1]];
              }
            }
          }
          modified.push(doc);
        }
        results = modified;
      } else if (stageType === "$sort") {
        const sortKeys = Object.keys(stageSpec);
        results.sort(function(a, b) {
          for (let k = 0; k < sortKeys.length; k++) {
            const key = sortKeys[k];
            if (a[key] === void 0 && b[key] !== void 0) return -1 * stageSpec[key];
            if (a[key] !== void 0 && b[key] === void 0) return 1 * stageSpec[key];
            if (a[key] < b[key]) return -1 * stageSpec[key];
            if (a[key] > b[key]) return 1 * stageSpec[key];
          }
          return 0;
        });
      } else if (stageType === "$limit") {
        results = results.slice(0, stageSpec);
      } else if (stageType === "$skip") {
        results = results.slice(stageSpec);
      } else if (stageType === "$group") {
        const groups = {};
        const groupId = stageSpec._id;
        for (let j = 0; j < results.length; j++) {
          const doc = results[j];
          let key;
          if (groupId === null || groupId === void 0) {
            key = null;
          } else {
            key = evaluateExpression(groupId, doc);
          }
          const keyStr = JSON.stringify(key);
          if (!groups[keyStr]) {
            groups[keyStr] = {
              _id: key,
              docs: [],
              accumulators: {}
            };
          }
          groups[keyStr].docs.push(doc);
        }
        const grouped = [];
        for (const groupKey in groups) {
          const group = groups[groupKey];
          const result = { _id: group._id };
          for (const field in stageSpec) {
            if (field === "_id") continue;
            const accumulator = stageSpec[field];
            const accKeys = Object.keys(accumulator);
            if (accKeys.length !== 1) continue;
            const accType = accKeys[0];
            const accExpr = accumulator[accType];
            if (accType === "$sum") {
              let sum = 0;
              for (let k = 0; k < group.docs.length; k++) {
                const val = evaluateExpression(accExpr, group.docs[k]);
                if (typeof val === "number") {
                  sum += val;
                } else if (val !== null && val !== void 0) {
                  sum += Number(val) || 0;
                }
              }
              result[field] = sum;
            } else if (accType === "$avg") {
              let sum = 0;
              let count = 0;
              for (let k = 0; k < group.docs.length; k++) {
                const val = evaluateExpression(accExpr, group.docs[k]);
                if (val !== void 0 && val !== null) {
                  sum += Number(val) || 0;
                  count++;
                }
              }
              result[field] = count > 0 ? sum / count : 0;
            } else if (accType === "$min") {
              let min = void 0;
              for (let k = 0; k < group.docs.length; k++) {
                const val = evaluateExpression(accExpr, group.docs[k]);
                if (val !== void 0 && (min === void 0 || val < min)) {
                  min = val;
                }
              }
              result[field] = min;
            } else if (accType === "$max") {
              let max = void 0;
              for (let k = 0; k < group.docs.length; k++) {
                const val = evaluateExpression(accExpr, group.docs[k]);
                if (val !== void 0 && (max === void 0 || val > max)) {
                  max = val;
                }
              }
              result[field] = max;
            } else if (accType === "$push") {
              const arr = [];
              for (let k = 0; k < group.docs.length; k++) {
                const val = evaluateExpression(accExpr, group.docs[k]);
                arr.push(val);
              }
              result[field] = arr;
            } else if (accType === "$addToSet") {
              const set = {};
              for (let k = 0; k < group.docs.length; k++) {
                const val = evaluateExpression(accExpr, group.docs[k]);
                set[JSON.stringify(val)] = val;
              }
              const arr = [];
              for (const valKey in set) {
                arr.push(set[valKey]);
              }
              result[field] = arr;
            } else if (accType === "$first") {
              if (group.docs.length > 0) {
                result[field] = evaluateExpression(accExpr, group.docs[0]);
              }
            } else if (accType === "$last") {
              if (group.docs.length > 0) {
                result[field] = evaluateExpression(accExpr, group.docs[group.docs.length - 1]);
              }
            } else if (accType === "$stdDevPop") {
              const values = [];
              for (let k = 0; k < group.docs.length; k++) {
                const val = evaluateExpression(accExpr, group.docs[k]);
                if (typeof val === "number") {
                  values.push(val);
                }
              }
              if (values.length > 0) {
                const mean = values.reduce((a, b) => a + b, 0) / values.length;
                const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
                result[field] = Math.sqrt(variance);
              } else {
                result[field] = 0;
              }
            } else if (accType === "$stdDevSamp") {
              const values = [];
              for (let k = 0; k < group.docs.length; k++) {
                const val = evaluateExpression(accExpr, group.docs[k]);
                if (typeof val === "number") {
                  values.push(val);
                }
              }
              if (values.length > 1) {
                const mean = values.reduce((a, b) => a + b, 0) / values.length;
                const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
                result[field] = Math.sqrt(variance);
              } else {
                result[field] = 0;
              }
            } else if (accType === "$mergeObjects") {
              const merged = {};
              for (let k = 0; k < group.docs.length; k++) {
                const val = evaluateExpression(accExpr, group.docs[k]);
                if (typeof val === "object" && val !== null && !Array.isArray(val)) {
                  Object.assign(merged, val);
                }
              }
              result[field] = merged;
            }
          }
          grouped.push(result);
        }
        results = grouped;
      } else if (stageType === "$count") {
        results = [{ [stageSpec]: results.length }];
      } else if (stageType === "$unwind") {
        const unwound = [];
        let fieldPath = stageSpec;
        if (typeof fieldPath === "string" && fieldPath.charAt(0) === "$") {
          fieldPath = fieldPath.substring(1);
        }
        for (let j = 0; j < results.length; j++) {
          const doc = results[j];
          const arr = getProp(doc, fieldPath);
          if (arr && isArray(arr) && arr.length > 0) {
            for (let k = 0; k < arr.length; k++) {
              const unwoundDoc = copy(doc);
              const parts = fieldPath.split(".");
              let target = unwoundDoc;
              for (let l = 0; l < parts.length - 1; l++) {
                if (!target[parts[l]]) {
                  target[parts[l]] = {};
                }
                target = target[parts[l]];
              }
              target[parts[parts.length - 1]] = arr[k];
              unwound.push(unwoundDoc);
            }
          }
        }
        results = unwound;
      } else {
        throw { $err: "Unsupported aggregation stage: " + stageType, code: 17287 };
      }
    }
    return results;
  }
  bulkWrite() {
    throw "Not Implemented";
  }
  async count() {
    return this.storage.size();
  }
  async copyTo(destCollectionName) {
    if (!this.db[destCollectionName]) {
      this.db.createCollection(destCollectionName);
    }
    const destCol = this.db[destCollectionName];
    let numCopied = 0;
    const c = this.find({});
    while (c.hasNext()) {
      await destCol.insertOne(c.next());
      numCopied++;
    }
    return numCopied;
  }
  async createIndex(keys, options) {
    if (!keys || typeof keys !== "object" || Array.isArray(keys)) {
      throw { $err: "createIndex requires a key specification object", code: 2 };
    }
    const indexName = options && options.name ? options.name : this.generateIndexName(keys);
    if (this.indexes.has(indexName)) {
      const existingIndex = this.indexes.get(indexName);
      const existingKeys = JSON.stringify(existingIndex.keys);
      const newKeys = JSON.stringify(keys);
      if (existingKeys !== newKeys) {
        throw { $err: "Index with name '" + indexName + "' already exists with a different key specification", code: 85 };
      }
      return indexName;
    }
    this.buildIndex(indexName, keys, options);
    return indexName;
  }
  dataSize() {
    throw "Not Implemented";
  }
  async deleteOne(query) {
    const doc = await this.findOne(query);
    if (doc) {
      this.updateIndexesOnDelete(doc);
      this.storage.remove(doc._id.toString());
      this.emit("delete", { _id: doc._id });
      return { deletedCount: 1 };
    } else {
      return { deletedCount: 0 };
    }
  }
  async deleteMany(query) {
    const c = this.find(query);
    const ids = [];
    const docs = [];
    while (c.hasNext()) {
      const doc = c.next();
      ids.push(doc._id);
      docs.push(doc);
    }
    const deletedCount = ids.length;
    for (let i = 0; i < ids.length; i++) {
      this.updateIndexesOnDelete(docs[i]);
      this.storage.remove(ids[i].toString());
      this.emit("delete", { _id: ids[i] });
    }
    return { deletedCount };
  }
  async distinct(field, query) {
    const vals = {};
    const c = this.find(query);
    while (c.hasNext()) {
      const d = c.next();
      if (d[field]) {
        vals[d[field]] = true;
      }
    }
    return Object.keys(vals);
  }
  drop() {
    for (const [indexName, index] of this.indexes) {
      index.clear();
    }
    this.storage.clear();
  }
  dropIndex(indexName) {
    if (!this.indexes.has(indexName)) {
      throw { $err: "Index not found with name: " + indexName, code: 27 };
    }
    this.indexes.get(indexName).clear();
    this.indexes.delete(indexName);
    return { nIndexesWas: this.indexes.size + 1, ok: 1 };
  }
  dropIndexes() {
    const count = this.indexes.size;
    for (const [indexName, index] of this.indexes) {
      index.clear();
    }
    this.indexes.clear();
    return { nIndexesWas: count, msg: "non-_id indexes dropped", ok: 1 };
  }
  ensureIndex() {
    throw "Not Implemented";
  }
  explain() {
    throw "Not Implemented";
  }
  find(query, projection) {
    const normalizedQuery = query == void 0 ? {} : query;
    const queryPlan = this.planQuery(normalizedQuery);
    const documents = [];
    const seen = {};
    if (queryPlan.useIndex && queryPlan.docIds) {
      for (const docId of queryPlan.docIds) {
        const doc = this.storage.get(docId.toString());
        if (doc && matches(doc, normalizedQuery)) {
          seen[doc._id] = true;
          documents.push(doc);
        }
      }
    }
    if (!queryPlan.indexOnly) {
      const allDocs = this.storage.getAllDocuments();
      for (const doc of allDocs) {
        if (!seen[doc._id] && matches(doc, normalizedQuery)) {
          seen[doc._id] = true;
          documents.push(doc);
        }
      }
    }
    return new Cursor(
      this,
      normalizedQuery,
      projection,
      documents,
      SortedCursor
    );
  }
  findAndModify() {
    throw "Not Implemented";
  }
  async findOne(query, projection) {
    const cursor = this.find(query, projection);
    if (cursor.hasNext()) {
      return cursor.next();
    } else {
      return null;
    }
  }
  async findOneAndDelete(filter, options) {
    let c = this.find(filter);
    if (options && options.sort) c = c.sort(options.sort);
    if (!c.hasNext()) return null;
    const doc = c.next();
    this.storage.remove(doc._id.toString());
    if (options && options.projection) return applyProjection(options.projection, doc);
    else return doc;
  }
  async findOneAndReplace(filter, replacement, options) {
    let c = this.find(filter);
    if (options && options.sort) c = c.sort(options.sort);
    if (!c.hasNext()) return null;
    const doc = c.next();
    replacement._id = doc._id;
    this.storage.set(doc._id.toString(), replacement);
    if (options && options.returnNewDocument) {
      if (options && options.projection) return applyProjection(options.projection, replacement);
      else return replacement;
    } else {
      if (options && options.projection) return applyProjection(options.projection, doc);
      else return doc;
    }
  }
  async findOneAndUpdate(filter, update, options) {
    let c = this.find(filter);
    if (options && options.sort) c = c.sort(options.sort);
    if (!c.hasNext()) return null;
    const doc = c.next();
    const clone = Object.assign({}, doc);
    applyUpdates(update, clone);
    this.storage.set(doc._id.toString(), clone);
    if (options && options.returnNewDocument) {
      if (options && options.projection) return applyProjection(options.projection, clone);
      else return clone;
    } else {
      if (options && options.projection) return applyProjection(options.projection, doc);
      else return doc;
    }
  }
  getIndexes() {
    const result = [];
    for (const [indexName, index] of this.indexes) {
      result.push(index.getSpec());
    }
    return result;
  }
  getShardDistribution() {
    throw "Not Implemented";
  }
  getShardVersion() {
    throw "Not Implemented";
  }
  // non-mongo
  getStore() {
    return this.storage.getStore();
  }
  group() {
    throw "Not Implemented";
  }
  async insert(doc) {
    if (Array == doc.constructor) {
      return await this.insertMany(doc);
    } else {
      return await this.insertOne(doc);
    }
  }
  async insertOne(doc) {
    if (doc._id == void 0) doc._id = this.idGenerator();
    this.storage.set(doc._id.toString(), doc);
    this.updateIndexesOnInsert(doc);
    this.emit("insert", doc);
    return { insertedId: doc._id };
  }
  async insertMany(docs) {
    const insertedIds = [];
    for (let i = 0; i < docs.length; i++) {
      const result = await this.insertOne(docs[i]);
      insertedIds.push(result.insertedId);
    }
    return { insertedIds };
  }
  isCapped() {
    throw "Not Implemented";
  }
  mapReduce() {
    throw "Not Implemented";
  }
  reIndex() {
    throw "Not Implemented";
  }
  async replaceOne(query, replacement, options) {
    const result = {};
    const c = this.find(query);
    result.matchedCount = c.count();
    if (result.matchedCount == 0) {
      result.modifiedCount = 0;
      if (options && options.upsert) {
        const newDoc = replacement;
        newDoc._id = this.idGenerator();
        this.storage.set(newDoc._id.toString(), newDoc);
        this.updateIndexesOnInsert(newDoc);
        this.emit("insert", newDoc);
        result.upsertedId = newDoc._id;
      }
    } else {
      result.modifiedCount = 1;
      const doc = c.next();
      this.updateIndexesOnDelete(doc);
      replacement._id = doc._id;
      this.storage.set(doc._id.toString(), replacement);
      this.updateIndexesOnInsert(replacement);
      this.emit("replace", replacement);
    }
    return result;
  }
  remove(query, options) {
    const c = this.find(query);
    if (!c.hasNext()) return;
    if (options === true || options && options.justOne) {
      const doc = c.next();
      this.updateIndexesOnDelete(doc);
      this.storage.remove(doc._id.toString());
    } else {
      while (c.hasNext()) {
        const doc = c.next();
        this.updateIndexesOnDelete(doc);
        this.storage.remove(doc._id.toString());
      }
    }
  }
  renameCollection() {
    throw "Not Implemented";
  }
  save() {
    throw "Not Implemented";
  }
  stats() {
    throw "Not Implemented";
  }
  storageSize() {
    throw "Not Implemented";
  }
  totalSize() {
    throw "Not Implemented";
  }
  totalIndexSize() {
    throw "Not Implemented";
  }
  update(query, updates, options) {
    const c = this.find(query);
    if (c.hasNext()) {
      if (options && options.multi) {
        while (c.hasNext()) {
          const doc = c.next();
          this.updateIndexesOnDelete(doc);
          applyUpdates(updates, doc);
          this.storage.set(doc._id.toString(), doc);
          this.updateIndexesOnInsert(doc);
        }
      } else {
        const doc = c.next();
        this.updateIndexesOnDelete(doc);
        applyUpdates(updates, doc);
        this.storage.set(doc._id.toString(), doc);
        this.updateIndexesOnInsert(doc);
      }
    } else {
      if (options && options.upsert) {
        const newDoc = createDocFromUpdate(query, updates, this.idGenerator);
        this.storage.set(newDoc._id.toString(), newDoc);
        this.updateIndexesOnInsert(newDoc);
      }
    }
  }
  async updateOne(query, updates, options) {
    const c = this.find(query);
    if (c.hasNext()) {
      const doc = c.next();
      const originalDoc = JSON.parse(JSON.stringify(doc));
      this.updateIndexesOnDelete(doc);
      applyUpdates(updates, doc);
      this.storage.set(doc._id.toString(), doc);
      this.updateIndexesOnInsert(doc);
      const updateDescription = this._getUpdateDescription(originalDoc, doc);
      this.emit("update", doc, updateDescription);
    } else {
      if (options && options.upsert) {
        const newDoc = createDocFromUpdate(query, updates, this.idGenerator);
        this.storage.set(newDoc._id.toString(), newDoc);
        this.updateIndexesOnInsert(newDoc);
        this.emit("insert", newDoc);
      }
    }
  }
  async updateMany(query, updates, options) {
    const c = this.find(query);
    if (c.hasNext()) {
      while (c.hasNext()) {
        const doc = c.next();
        const originalDoc = JSON.parse(JSON.stringify(doc));
        this.updateIndexesOnDelete(doc);
        applyUpdates(updates, doc);
        this.storage.set(doc._id.toString(), doc);
        this.updateIndexesOnInsert(doc);
        const updateDescription = this._getUpdateDescription(originalDoc, doc);
        this.emit("update", doc, updateDescription);
      }
    } else {
      if (options && options.upsert) {
        const newDoc = createDocFromUpdate(query, updates, this.idGenerator);
        this.storage.set(newDoc._id.toString(), newDoc);
        this.updateIndexesOnInsert(newDoc);
        this.emit("insert", newDoc);
      }
    }
  }
  validate() {
    throw "Not Implemented";
  }
  /**
   * Generate updateDescription for change events
   * Compares original and updated documents to track changes
   */
  _getUpdateDescription(originalDoc, updatedDoc) {
    const updatedFields = {};
    const removedFields = [];
    for (const key in updatedDoc) {
      if (key === "_id") continue;
      if (JSON.stringify(originalDoc[key]) !== JSON.stringify(updatedDoc[key])) {
        updatedFields[key] = updatedDoc[key];
      }
    }
    for (const key in originalDoc) {
      if (key === "_id") continue;
      if (!(key in updatedDoc)) {
        removedFields.push(key);
      }
    }
    return {
      updatedFields,
      removedFields,
      truncatedArrays: []
      // Not implemented in micro-mongo
    };
  }
  /**
   * Watch for changes to this collection
   * @param {Array} pipeline - Aggregation pipeline to filter changes
   * @param {Object} options - Watch options (fullDocument, etc.)
   * @returns {ChangeStream} A change stream instance
   */
  watch(pipeline = [], options = {}) {
    return new ChangeStream(this, pipeline, options);
  }
}
function applyProjectionWithExpressions(projection, doc) {
  const result = {};
  const keys = Object.keys(projection);
  let isInclusion = false;
  let hasComputedFields = false;
  for (const key of keys) {
    if (key === "_id") continue;
    const value = projection[key];
    if (value === 1 || value === true) {
      isInclusion = true;
    } else if (value === 0 || value === false) ;
    else {
      hasComputedFields = true;
    }
  }
  if (hasComputedFields || isInclusion) {
    if (projection._id !== 0 && projection._id !== false) {
      result._id = doc._id;
    }
    for (const key of keys) {
      const value = projection[key];
      if (key === "_id") {
        if (value === 0 || value === false) {
          delete result._id;
        }
      } else if (value === 1 || value === true) {
        result[key] = getProp(doc, key);
      } else {
        result[key] = evaluateExpression(value, doc);
      }
    }
  } else {
    for (const key in doc) {
      if (doc.hasOwnProperty(key)) {
        result[key] = doc[key];
      }
    }
    for (const key of keys) {
      if (projection[key] === 0 || projection[key] === false) {
        delete result[key];
      }
    }
  }
  return result;
}
class DocumentStore {
  constructor() {
    this.data = /* @__PURE__ */ new Map();
  }
  clear() {
    this.data = /* @__PURE__ */ new Map();
  }
  keys() {
    return this.data.keys();
  }
  get(index) {
    return this.data.get(index);
  }
  remove(key) {
    this.data.delete(key);
  }
  set(key, value) {
    this.data.set(key, value);
  }
  size() {
    return this.data.size;
  }
}
class CollectionStore {
  constructor() {
    this.documents = new DocumentStore();
    this.indexes = /* @__PURE__ */ new Map();
  }
  /**
   * Clear all documents and indexes
   */
  clear() {
    this.documents.clear();
    this.indexes.clear();
  }
  /**
   * Get all document keys
   * @returns {[string]} Array of document keys
   */
  documentKeys() {
    return this.documents.keys();
  }
  /**
   * Get all documents as an array
   * @returns {Array} Array of all documents
   */
  getAllDocuments() {
    return Array.from(this.documents.data.values());
  }
  /**
   * Get document by ID
   * @param {string} docId - Document ID
   * @returns {Object|undefined} Document or undefined
   */
  get(key) {
    if (typeof key !== "string") throw new Error("Document key must be a string");
    return this.documents.get(key);
  }
  /**
   * 
   */
  set(key, value) {
    if (typeof key !== "string") throw new Error("Document key must be a string");
    this.documents.set(key, value);
  }
  /**
   * 
   */
  remove(key) {
    if (typeof key !== "string") throw new Error("Document key must be a string");
    this.documents.remove(key);
  }
  /**
   *
   */
  size() {
    return this.documents.size();
  }
  /**
   * Get entire document store (for export/save)
   * @returns {Object} Document store object
   */
  getStore() {
    const store = {};
    for (const key of this.documents.keys()) {
      store[key] = this.documents.get(key);
    }
    return store;
  }
  // ==========================================
  // Index Storage Interface
  // ==========================================
  indexesCount() {
    return this.indexes.size;
  }
  indexKeys() {
    return this.indexes.keys();
  }
  /**
   * Get index data for a specific index
   * @param {string} indexName - Name of the index
   * @returns {Object} Index data object (or creates empty one if doesn't exist)
   */
  createIndexStore(name, meta) {
    if (!this.indexes.has(name)) {
      this.indexes.set(name, new IndexStore(meta));
    }
    return this.indexes.get(name);
  }
}
class StorageEngine {
  constructor() {
    this.collections = /* @__PURE__ */ new Map();
  }
  collectionsCount() {
    return this.collections.size;
  }
  /**
   * 
   * @returns {[string]} list of collection names
   */
  collectionStoreKeys() {
    return this.collections.keys();
  }
  /**
   * 
   * @param {*} collectionName 
   * @returns 
   */
  getCollectionStore(collectionName) {
    return this.collections.get(collectionName);
  }
  /**
   * Create a collection's state
   * @param {string} collectionName - The collection name
   * @returns {CollectionStore} The collection store
   */
  createCollectionStore(collectionName) {
    if (this.collections.has(collectionName)) {
      return this.collections.get(collectionName);
    }
    const collectionStore = new CollectionStore();
    this.collections.set(collectionName, collectionStore);
    return collectionStore;
  }
  /**
   * Delete a collection
   * @param {string} collectionName - The collection name
   */
  removeCollectionStore(collectionName) {
    this.collections.delete(collectionName);
  }
  /**
   * Save the entire database state
   * @returns {Promise<void>}
   */
  save() {
  }
}
class DB {
  constructor(options) {
    this.options = options || {};
    this.dbName = this.options.dbName || "default";
    this.storageEngine = this.options.storageEngine || new StorageEngine();
    this._loadExistingCollections();
    return new Proxy(this, {
      get(target, property, receiver) {
        if (property in target) {
          return Reflect.get(target, property, receiver);
        }
        if (typeof property === "symbol" || property.startsWith("_")) {
          return void 0;
        }
        if (typeof property === "string") {
          if (Object.prototype.hasOwnProperty.call(target, property)) {
            return target[property];
          }
          target.createCollection(property);
          return target[property];
        }
        return void 0;
      }
    });
  }
  /**
   * Log function
   */
  _log(msg) {
    if (this.options && this.options.print) this.options.print(msg);
    else console.log(msg);
  }
  /**
   * ID generator function
   */
  _id() {
    if (this.options && this.options.id) return this.options.id();
    else return new ObjectId();
  }
  /**
   * Load existing collections from storage engine
   * @private
   */
  _loadExistingCollections() {
    for (const collectionName of this.storageEngine.collectionStoreKeys()) {
      const collectionStore = this.storageEngine.getCollectionStore(collectionName);
      this[collectionName] = new Collection(
        this,
        collectionName,
        collectionStore,
        this._id.bind(this)
      );
    }
  }
  // DB Methods
  cloneCollection() {
    throw "Not Implemented";
  }
  cloneDatabase() {
    throw "Not Implemented";
  }
  commandHelp() {
    throw "Not Implemented";
  }
  copyDatabase() {
    throw "Not Implemented";
  }
  createCollection(name) {
    if (!name) return;
    this[name] = new Collection(
      this,
      name,
      this.storageEngine.createCollectionStore(name),
      this._id.bind(this)
    );
  }
  /**
   * Get or create a collection by name (MongoDB-compatible method)
   * @param {string} name - Collection name
   * @returns {Collection} The collection instance
   */
  collection(name) {
    if (!name) throw new Error("Collection name is required");
    if (this[name] && this[name].isCollection) {
      return this[name];
    }
    this.createCollection(name);
    return this[name];
  }
  currentOp() {
    throw "Not Implemented";
  }
  dropDatabase() {
    const collectionNames = this.getCollectionNames();
    for (const name of collectionNames) {
      this.storageEngine.removeCollectionStore(name);
      delete this[name];
    }
  }
  eval() {
    throw "Not Implemented";
  }
  fsyncLock() {
    throw "Not Implemented";
  }
  fsyncUnlock() {
    throw "Not Implemented";
  }
  getCollection() {
    throw "Not Implemented";
  }
  getCollectionInfos() {
    throw "Not Implemented";
  }
  getCollectionNames() {
    const names = [];
    for (const key in this) {
      if (this[key] != null && this[key].isCollection) {
        names.push(key);
      }
    }
    return names;
  }
  getLastError() {
    throw "Not Implemented";
  }
  getLastErrorObj() {
    throw "Not Implemented";
  }
  getLogComponents() {
    throw "Not Implemented";
  }
  getMongo() {
    throw "Not Implemented";
  }
  getName() {
    throw "Not Implemented";
  }
  getPrevError() {
    throw "Not Implemented";
  }
  getProfilingLevel() {
    throw "Not Implemented";
  }
  getProfilingStatus() {
    throw "Not Implemented";
  }
  getReplicationInfo() {
    throw "Not Implemented";
  }
  getSiblingDB() {
    throw "Not Implemented";
  }
  help() {
    this._log("        help mr                      mapreduce");
    this._log("        db.foo.find()                list objects in collection foo");
    this._log("        db.foo.find( { a : 1 } )     list objects in foo where a == 1");
    this._log("        it                           result of the last line evaluated; use to further iterate");
  }
  hostInfo() {
    throw "Not Implemented";
  }
  isMaster() {
    throw "Not Implemented";
  }
  killOp() {
    throw "Not Implemented";
  }
  listCommands() {
    throw "Not Implemented";
  }
  loadServerScripts() {
    throw "Not Implemented";
  }
  logout() {
    throw "Not Implemented";
  }
  printCollectionStats() {
    throw "Not Implemented";
  }
  printReplicationInfo() {
    throw "Not Implemented";
  }
  printShardingStatus() {
    throw "Not Implemented";
  }
  printSlaveReplicationInfo() {
    throw "Not Implemented";
  }
  repairDatabase() {
    throw "Not Implemented";
  }
  resetError() {
    throw "Not Implemented";
  }
  runCommand() {
    throw "Not Implemented";
  }
  serverBuildInfo() {
    throw "Not Implemented";
  }
  serverCmdLineOpts() {
    throw "Not Implemented";
  }
  serverStatus() {
    throw "Not Implemented";
  }
  setLogLevel() {
    throw "Not Implemented";
  }
  setProfilingLevel() {
    throw "Not Implemented";
  }
  shutdownServer() {
    throw "Not Implemented";
  }
  stats() {
    throw "Not Implemented";
  }
  version() {
    throw "Not Implemented";
  }
  upgradeCheck() {
    throw "Not Implemented";
  }
  upgradeCheckAllDBs() {
    throw "Not Implemented";
  }
  /**
   * Watch for changes across all collections in this database
   * @param {Array} pipeline - Aggregation pipeline to filter changes
   * @param {Object} options - Watch options
   * @returns {ChangeStream} A change stream instance
   */
  watch(pipeline = [], options = {}) {
    return new ChangeStream(this, pipeline, options);
  }
}
class MongoClient extends eventsExports.EventEmitter {
  constructor(uri = "mongodb://localhost:27017", options = {}) {
    super();
    this.uri = uri;
    this.options = Object.freeze({ ...options });
    this._isConnected = false;
    this._defaultDb = this._parseDefaultDbName(uri);
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
  db(name, opts = {}) {
    const dbName = name || this._defaultDb;
    if (!dbName) {
      throw new Error("No database name provided and no default in connection string");
    }
    const dbOptions = { ...this.options, ...opts, dbName };
    return new DB(dbOptions);
  }
  async close(force = false) {
    if (!this._isConnected) return;
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
}
class IndexedDbStorageEngine extends StorageEngine {
  constructor(dbName = "micro-mongo") {
    super();
    this.dbName = dbName;
    this.db = null;
    this.indexedDBName = `micro-mongo-${dbName}`;
  }
  /**
   * Initialize the IndexedDB connection
   * @returns {Promise<void>}
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.indexedDBName, 1);
      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB: " + request.error));
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("collections")) {
          db.createObjectStore("collections", { keyPath: "name" });
        }
        if (!db.objectStoreNames.contains("metadata")) {
          db.createObjectStore("metadata", { keyPath: "key" });
        }
      };
    });
  }
  /**
   * Save the entire database state
   * @param {Object} dbState - The database state to save
   * @returns {Promise<void>}
   */
  async saveDatabase(dbState) {
    if (!this.db) {
      await this.initialize();
    }
    const transaction = this.db.transaction(["metadata"], "readwrite");
    const metadataStore = transaction.objectStore("metadata");
    await new Promise((resolve, reject) => {
      const request = metadataStore.put({
        key: "dbName",
        value: dbState.name
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    for (const collectionName in dbState.collections) {
      if (dbState.collections.hasOwnProperty(collectionName)) {
        await this.saveCollection(dbState.name, collectionName, dbState.collections[collectionName]);
      }
    }
  }
  /**
   * Load the entire database state
   * @param {string} dbName - The database name
   * @returns {Promise<Object|null>} The database state or null if not found
   */
  async loadDatabase(dbName) {
    if (!this.db) {
      await this.initialize();
    }
    const transaction = this.db.transaction(["collections"], "readonly");
    const collectionsStore = transaction.objectStore("collections");
    return new Promise((resolve, reject) => {
      const request = collectionsStore.getAll();
      request.onsuccess = () => {
        const collections = {};
        for (const collectionData of request.result) {
          collections[collectionData.name] = {
            documents: collectionData.documents || [],
            indexes: collectionData.indexes || []
          };
        }
        resolve({
          name: dbName,
          collections
        });
      };
      request.onerror = () => reject(request.error);
    });
  }
  /**
   * Save a single collection's state
   * @param {string} dbName - The database name
   * @param {string} collectionName - The collection name
   * @param {Object} collectionState - The collection state to save
   * @returns {Promise<void>}
   */
  async saveCollection(dbName, collectionName, collectionState) {
    if (!this.db) {
      await this.initialize();
    }
    const transaction = this.db.transaction(["collections"], "readwrite");
    const collectionsStore = transaction.objectStore("collections");
    return new Promise((resolve, reject) => {
      const request = collectionsStore.put({
        name: collectionName,
        documents: collectionState.documents || [],
        indexes: collectionState.indexes || []
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  /**
   * Load a single collection's state
   * @param {string} dbName - The database name
   * @param {string} collectionName - The collection name
   * @returns {Promise<Object|null>} The collection state or null if not found
   */
  async loadCollection(dbName, collectionName) {
    if (!this.db) {
      await this.initialize();
    }
    const transaction = this.db.transaction(["collections"], "readonly");
    const collectionsStore = transaction.objectStore("collections");
    return new Promise((resolve, reject) => {
      const request = collectionsStore.get(collectionName);
      request.onsuccess = () => {
        if (request.result) {
          resolve({
            documents: request.result.documents || [],
            indexes: request.result.indexes || []
          });
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
  /**
   * Delete a collection
   * @param {string} dbName - The database name
   * @param {string} collectionName - The collection name
   * @returns {Promise<void>}
   */
  async deleteCollection(dbName, collectionName) {
    if (!this.db) {
      await this.initialize();
    }
    const transaction = this.db.transaction(["collections"], "readwrite");
    const collectionsStore = transaction.objectStore("collections");
    return new Promise((resolve, reject) => {
      const request = collectionsStore.delete(collectionName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  /**
   * Delete the entire database
   * @param {string} dbName - The database name
   * @returns {Promise<void>}
   */
  async deleteDatabase(dbName) {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.indexedDBName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  /**
   * Close/cleanup the storage engine
   * @returns {Promise<void>}
   */
  async close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
export {
  ChangeStream,
  IndexedDbStorageEngine,
  MongoClient,
  ObjectId,
  StorageEngine
};
//# sourceMappingURL=micro-mongo-2.0.0.js.map
