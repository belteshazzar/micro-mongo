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
const TYPE = {
  NULL: 0,
  FALSE: 1,
  TRUE: 2,
  INT: 3,
  FLOAT: 4,
  STRING: 5,
  OID: 6,
  DATE: 7,
  POINTER: 8,
  BINARY: 9,
  ARRAY: 16,
  OBJECT: 17
};
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
class Pointer {
  constructor(offset) {
    if (offset === void 0 || offset === null) {
      throw new Error("Pointer offset must be a number");
    }
    if (typeof offset !== "number") {
      throw new Error("Pointer offset must be a number");
    }
    if (!Number.isInteger(offset)) {
      throw new Error("Pointer offset must be an integer");
    }
    if (offset < 0) {
      throw new Error("Pointer offset must be non-negative");
    }
    if (offset > Number.MAX_SAFE_INTEGER) {
      throw new Error("Pointer offset exceeds maximum safe integer");
    }
    this.offset = offset;
  }
  /**
   * Returns the pointer offset as a number
   */
  valueOf() {
    return this.offset;
  }
  /**
   * Returns the pointer offset as a string
   */
  toString() {
    return this.offset.toString();
  }
  /**
   * Returns the pointer in JSON format (as number)
   */
  toJSON() {
    return this.offset;
  }
  /**
   * Custom inspect for Node.js console.log
   */
  inspect() {
    return `Pointer(${this.offset})`;
  }
  /**
   * Compares this Pointer with another for equality
   */
  equals(other) {
    if (!(other instanceof Pointer)) {
      return false;
    }
    return this.offset === other.offset;
  }
}
function encode(value) {
  const buffers = [];
  function encodeValue(val) {
    if (val === null) {
      buffers.push(new Uint8Array([TYPE.NULL]));
    } else if (val === false) {
      buffers.push(new Uint8Array([TYPE.FALSE]));
    } else if (val === true) {
      buffers.push(new Uint8Array([TYPE.TRUE]));
    } else if (val instanceof ObjectId) {
      buffers.push(new Uint8Array([TYPE.OID]));
      buffers.push(val.toBytes());
    } else if (val instanceof Date) {
      buffers.push(new Uint8Array([TYPE.DATE]));
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      view.setBigInt64(0, BigInt(val.getTime()), true);
      buffers.push(new Uint8Array(buffer));
    } else if (val instanceof Pointer) {
      buffers.push(new Uint8Array([TYPE.POINTER]));
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      view.setBigUint64(0, BigInt(val.offset), true);
      buffers.push(new Uint8Array(buffer));
    } else if (val instanceof Uint8Array) {
      buffers.push(new Uint8Array([TYPE.BINARY]));
      const lengthBuffer = new ArrayBuffer(4);
      const lengthView = new DataView(lengthBuffer);
      lengthView.setUint32(0, val.length, true);
      buffers.push(new Uint8Array(lengthBuffer));
      buffers.push(val);
    } else if (typeof val === "number") {
      if (Number.isInteger(val) && Number.isSafeInteger(val)) {
        buffers.push(new Uint8Array([TYPE.INT]));
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        view.setBigInt64(0, BigInt(val), true);
        buffers.push(new Uint8Array(buffer));
      } else {
        buffers.push(new Uint8Array([TYPE.FLOAT]));
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        view.setFloat64(0, val, true);
        buffers.push(new Uint8Array(buffer));
      }
    } else if (typeof val === "string") {
      buffers.push(new Uint8Array([TYPE.STRING]));
      const encoded = new TextEncoder().encode(val);
      const lengthBuffer = new ArrayBuffer(4);
      const lengthView = new DataView(lengthBuffer);
      lengthView.setUint32(0, encoded.length, true);
      buffers.push(new Uint8Array(lengthBuffer));
      buffers.push(encoded);
    } else if (Array.isArray(val)) {
      const tempBuffers = [];
      const lengthBuffer = new ArrayBuffer(4);
      const lengthView = new DataView(lengthBuffer);
      lengthView.setUint32(0, val.length, true);
      tempBuffers.push(new Uint8Array(lengthBuffer));
      const startLength = buffers.length;
      for (const item of val) {
        encodeValue(item);
      }
      const elementBuffers = buffers.splice(startLength);
      tempBuffers.push(...elementBuffers);
      const contentSize = tempBuffers.reduce((sum, buf) => sum + buf.length, 0);
      buffers.push(new Uint8Array([TYPE.ARRAY]));
      const sizeBuffer = new ArrayBuffer(4);
      const sizeView = new DataView(sizeBuffer);
      sizeView.setUint32(0, contentSize, true);
      buffers.push(new Uint8Array(sizeBuffer));
      buffers.push(...tempBuffers);
    } else if (typeof val === "object") {
      const tempBuffers = [];
      const keys = Object.keys(val);
      const lengthBuffer = new ArrayBuffer(4);
      const lengthView = new DataView(lengthBuffer);
      lengthView.setUint32(0, keys.length, true);
      tempBuffers.push(new Uint8Array(lengthBuffer));
      const startLength = buffers.length;
      for (const key of keys) {
        const encoded = new TextEncoder().encode(key);
        const keyLengthBuffer = new ArrayBuffer(4);
        const keyLengthView = new DataView(keyLengthBuffer);
        keyLengthView.setUint32(0, encoded.length, true);
        buffers.push(new Uint8Array(keyLengthBuffer));
        buffers.push(encoded);
        encodeValue(val[key]);
      }
      const kvBuffers = buffers.splice(startLength);
      tempBuffers.push(...kvBuffers);
      const contentSize = tempBuffers.reduce((sum, buf) => sum + buf.length, 0);
      buffers.push(new Uint8Array([TYPE.OBJECT]));
      const sizeBuffer = new ArrayBuffer(4);
      const sizeView = new DataView(sizeBuffer);
      sizeView.setUint32(0, contentSize, true);
      buffers.push(new Uint8Array(sizeBuffer));
      buffers.push(...tempBuffers);
    } else {
      throw new Error(`Unsupported type: ${typeof val}`);
    }
  }
  encodeValue(value);
  const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    result.set(buf, offset);
    offset += buf.length;
  }
  return result;
}
function decode(data) {
  let offset = 0;
  function decodeValue() {
    if (offset >= data.length) {
      throw new Error("Unexpected end of data");
    }
    const type = data[offset++];
    switch (type) {
      case TYPE.NULL:
        return null;
      case TYPE.FALSE:
        return false;
      case TYPE.TRUE:
        return true;
      case TYPE.INT: {
        if (offset + 4 > data.length) {
          throw new Error("Unexpected end of data for INT");
        }
        const view = new DataView(data.buffer, data.byteOffset + offset, 8);
        const value = view.getBigInt64(0, true);
        offset += 8;
        if (value < BigInt(Number.MIN_SAFE_INTEGER) || value > BigInt(Number.MAX_SAFE_INTEGER)) {
          throw new Error("Decoded integer exceeds safe range");
        }
        return Number(value);
      }
      case TYPE.FLOAT: {
        if (offset + 8 > data.length) {
          throw new Error("Unexpected end of data for FLOAT");
        }
        const view = new DataView(data.buffer, data.byteOffset + offset, 8);
        const value = view.getFloat64(0, true);
        offset += 8;
        return value;
      }
      case TYPE.STRING: {
        if (offset + 4 > data.length) {
          throw new Error("Unexpected end of data for STRING length");
        }
        const lengthView = new DataView(data.buffer, data.byteOffset + offset, 4);
        const length = lengthView.getUint32(0, true);
        offset += 4;
        if (offset + length > data.length) {
          throw new Error("Unexpected end of data for STRING content");
        }
        const stringData = data.slice(offset, offset + length);
        offset += length;
        return new TextDecoder().decode(stringData);
      }
      case TYPE.OID: {
        if (offset + 12 > data.length) {
          throw new Error("Unexpected end of data for OID");
        }
        const oidBytes = data.slice(offset, offset + 12);
        offset += 12;
        return new ObjectId(oidBytes);
      }
      case TYPE.DATE: {
        if (offset + 8 > data.length) {
          throw new Error("Unexpected end of data for DATE");
        }
        const view = new DataView(data.buffer, data.byteOffset + offset, 8);
        const timestamp = view.getBigInt64(0, true);
        offset += 8;
        return new Date(Number(timestamp));
      }
      case TYPE.POINTER: {
        if (offset + 8 > data.length) {
          throw new Error("Unexpected end of data for POINTER");
        }
        const view = new DataView(data.buffer, data.byteOffset + offset, 8);
        const pointerOffset = view.getBigUint64(0, true);
        offset += 8;
        if (pointerOffset > BigInt(Number.MAX_SAFE_INTEGER)) {
          throw new Error("Pointer offset out of valid range");
        }
        return new Pointer(Number(pointerOffset));
      }
      case TYPE.BINARY: {
        if (offset + 4 > data.length) {
          throw new Error("Unexpected end of data for BINARY length");
        }
        const lengthView = new DataView(data.buffer, data.byteOffset + offset, 4);
        const length = lengthView.getUint32(0, true);
        offset += 4;
        if (offset + length > data.length) {
          throw new Error("Unexpected end of data for BINARY content");
        }
        const binaryData = data.slice(offset, offset + length);
        offset += length;
        return binaryData;
      }
      case TYPE.ARRAY: {
        if (offset + 4 > data.length) {
          throw new Error("Unexpected end of data for ARRAY size");
        }
        const sizeView = new DataView(data.buffer, data.byteOffset + offset, 4);
        const size = sizeView.getUint32(0, true);
        offset += 4;
        if (offset + size > data.length) {
          throw new Error("Unexpected end of data for ARRAY content");
        }
        const lengthView = new DataView(data.buffer, data.byteOffset + offset, 4);
        const length = lengthView.getUint32(0, true);
        offset += 4;
        const arr = [];
        for (let i = 0; i < length; i++) {
          arr.push(decodeValue());
        }
        return arr;
      }
      case TYPE.OBJECT: {
        if (offset + 4 > data.length) {
          throw new Error("Unexpected end of data for OBJECT size");
        }
        const sizeView = new DataView(data.buffer, data.byteOffset + offset, 4);
        const size = sizeView.getUint32(0, true);
        offset += 4;
        if (offset + size > data.length) {
          throw new Error("Unexpected end of data for OBJECT content");
        }
        const lengthView = new DataView(data.buffer, data.byteOffset + offset, 4);
        const length = lengthView.getUint32(0, true);
        offset += 4;
        const obj = {};
        for (let i = 0; i < length; i++) {
          if (offset + 4 > data.length) {
            throw new Error("Unexpected end of data for OBJECT key length");
          }
          const keyLengthView = new DataView(data.buffer, data.byteOffset + offset, 4);
          const keyLength = keyLengthView.getUint32(0, true);
          offset += 4;
          if (offset + keyLength > data.length) {
            throw new Error("Unexpected end of data for OBJECT key");
          }
          const keyData = data.slice(offset, offset + keyLength);
          offset += keyLength;
          const key = new TextDecoder().decode(keyData);
          obj[key] = decodeValue();
        }
        return obj;
      }
      default:
        throw new Error(`Unknown type byte: 0x${type.toString(16)}`);
    }
  }
  return decodeValue();
}
class BJsonFile {
  constructor(syncAccessHandle) {
    if (!syncAccessHandle) {
      throw new Error("FileSystemSyncAccessHandle is required");
    }
    this.syncAccessHandle = syncAccessHandle;
  }
  /**
   * Read a range of bytes from the file
   */
  #readRange(start, length) {
    const buffer = new Uint8Array(length);
    const bytesRead = this.syncAccessHandle.read(buffer, { at: start });
    if (bytesRead < length) {
      return buffer.slice(0, bytesRead);
    }
    return buffer;
  }
  /**
   * Get the current file size
   */
  getFileSize() {
    return this.syncAccessHandle.getSize();
  }
  /**
   * Write data to file, truncating existing content
   * @param {*} data - Data to encode and write
   */
  write(data) {
    const binaryData = encode(data);
    this.syncAccessHandle.truncate(0);
    this.syncAccessHandle.write(binaryData, { at: 0 });
  }
  /**
   * Read and decode data from file starting at optional pointer offset
   * @param {Pointer} pointer - Optional offset to start reading from (default: 0)
   * @returns {*} - Decoded data
   */
  read(pointer = new Pointer(0)) {
    const fileSize = this.getFileSize();
    if (fileSize === 0) {
      throw new Error("File is empty");
    }
    const pointerValue = pointer.valueOf();
    if (pointerValue < 0 || pointerValue >= fileSize) {
      throw new Error(`Pointer offset ${pointer} out of file bounds [0, ${fileSize})`);
    }
    const binaryData = this.#readRange(pointerValue, fileSize - pointerValue);
    return decode(binaryData);
  }
  /**
   * Append data to file without truncating existing content
   * @param {*} data - Data to encode and append
   */
  append(data) {
    const binaryData = encode(data);
    const existingSize = this.getFileSize();
    this.syncAccessHandle.write(binaryData, { at: existingSize });
  }
  /**
   * Explicitly flush any pending writes to disk
   */
  flush() {
    this.syncAccessHandle.flush();
  }
  /**
   * Generator to scan through all records in the file
   * Each record is decoded and yielded one at a time
   */
  *scan() {
    const fileSize = this.getFileSize();
    if (fileSize === 0) {
      return;
    }
    let offset = 0;
    while (offset < fileSize) {
      const getValueSize = (readPosition) => {
        let tempData = this.#readRange(readPosition, 1);
        const type = tempData[0];
        switch (type) {
          case TYPE.NULL:
          case TYPE.FALSE:
          case TYPE.TRUE:
            return 1;
          case TYPE.INT:
          case TYPE.FLOAT:
          case TYPE.DATE:
          case TYPE.POINTER:
            return 1 + 8;
          case TYPE.OID:
            return 1 + 12;
          case TYPE.STRING: {
            tempData = this.#readRange(readPosition + 1, 4);
            const view = new DataView(tempData.buffer, tempData.byteOffset, 4);
            const length = view.getUint32(0, true);
            return 1 + 4 + length;
          }
          case TYPE.BINARY: {
            tempData = this.#readRange(readPosition + 1, 4);
            const view = new DataView(tempData.buffer, tempData.byteOffset, 4);
            const length = view.getUint32(0, true);
            return 1 + 4 + length;
          }
          case TYPE.ARRAY: {
            tempData = this.#readRange(readPosition + 1, 4);
            const view = new DataView(tempData.buffer, tempData.byteOffset, 4);
            const size = view.getUint32(0, true);
            return 1 + 4 + size;
          }
          case TYPE.OBJECT: {
            tempData = this.#readRange(readPosition + 1, 4);
            const view = new DataView(tempData.buffer, tempData.byteOffset, 4);
            const size = view.getUint32(0, true);
            return 1 + 4 + size;
          }
          default:
            throw new Error(`Unknown type byte: 0x${type.toString(16)}`);
        }
      };
      const valueSize = getValueSize(offset);
      const valueData = this.#readRange(offset, valueSize);
      offset += valueSize;
      yield decode(valueData);
    }
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
  if (name.indexOf("$[]") !== -1) {
    return setPropWithAllPositional(obj, name, value);
  }
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
function setPropWithAllPositional(obj, name, value) {
  var path = name.split(".");
  var current = obj;
  for (var i = 0; i < path.length; i++) {
    var pathSegment = path[i];
    if (pathSegment === "$[]") {
      if (!Array.isArray(current)) {
        throw new Error("The positional operator did not find the match needed from the query.");
      }
      var remainingPath = path.slice(i + 1).join(".");
      for (var j = 0; j < current.length; j++) {
        if (remainingPath) {
          setProp(current[j], remainingPath, value);
        } else {
          current[j] = value;
        }
      }
      return;
    }
    var numericIndex = parseInt(pathSegment, 10);
    if (isArray(current) && !isNaN(numericIndex) && numericIndex >= 0) {
      current = current[numericIndex];
    } else {
      if (current[pathSegment] == void 0 || current[pathSegment] == null) {
        var nextSegment = i + 1 < path.length ? path[i + 1] : null;
        if (nextSegment === "$[]") {
          current[pathSegment] = [];
        } else {
          var nextNumeric = parseInt(nextSegment, 10);
          if (!isNaN(nextNumeric) && nextNumeric >= 0) {
            current[pathSegment] = [];
          } else {
            current[pathSegment] = {};
          }
        }
      }
      current = current[pathSegment];
    }
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
class Cursor {
  constructor(collection, query, projection, documentsOrPromise, SortedCursor2) {
    this.collection = collection;
    this.query = query;
    this.projection = projection;
    this._documentsPromise = documentsOrPromise instanceof Promise ? documentsOrPromise : Promise.resolve(documentsOrPromise);
    this.documents = null;
    this._initialized = false;
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
        throw new QueryError("Can't canonicalize query: BadValue Projection cannot have a mix of inclusion and exclusion.", {
          code: ErrorCodes.FAILED_TO_PARSE,
          collection: collection.name
        });
      }
    }
    this.pos = 0;
    this._limit = 0;
    this._skip = 0;
    this._closed = false;
  }
  /**
   * Ensure documents are loaded from the promise
   * @private
   */
  async _ensureInitialized() {
    if (!this._initialized) {
      this.documents = await this._documentsPromise;
      this._initialized = true;
    }
  }
  batchSize(size) {
    this._batchSize = size;
    return this;
  }
  close() {
    this._closed = true;
    if (this.documents) {
      this.pos = this.documents.length;
    }
    return void 0;
  }
  comment(commentString) {
    this._comment = commentString;
    return this;
  }
  async count() {
    await this._ensureInitialized();
    return this.documents.length;
  }
  explain(verbosity = "queryPlanner") {
    return {
      queryPlanner: {
        plannerVersion: 1,
        namespace: `${this.collection.db?.name || "db"}.${this.collection.name}`,
        indexFilterSet: false,
        parsedQuery: this.query,
        winningPlan: {
          stage: "COLLSCAN",
          filter: this.query,
          direction: "forward"
        }
      },
      executionStats: verbosity === "executionStats" || verbosity === "allPlansExecution" ? {
        executionSuccess: true,
        nReturned: this.documents ? this.documents.length : 0,
        executionTimeMillis: 0,
        totalKeysExamined: 0,
        totalDocsExamined: this.documents ? this.documents.length : 0
      } : void 0,
      ok: 1
    };
  }
  async forEach(fn) {
    await this._ensureInitialized();
    while (await this.hasNext()) {
      await fn(await this.next());
    }
  }
  async hasNext() {
    if (this._closed) return false;
    await this._ensureInitialized();
    if (this.pos === 0 && this._skip > 0) {
      this.pos = Math.min(this._skip, this.documents.length);
    }
    let effectiveMax;
    if (this._limit > 0) {
      effectiveMax = Math.min(this._skip + this._limit, this.documents.length);
    } else {
      effectiveMax = this.documents.length;
    }
    return this.pos < effectiveMax;
  }
  hint(index) {
    this._hint = index;
    return this;
  }
  async itcount() {
    await this._ensureInitialized();
    let count = 0;
    while (await this.hasNext()) {
      await this.next();
      count++;
    }
    return count;
  }
  limit(_max) {
    this._limit = _max;
    return this;
  }
  async map(fn) {
    await this._ensureInitialized();
    const results = [];
    while (await this.hasNext()) {
      results.push(await fn(await this.next()));
    }
    return results;
  }
  maxScan(maxScan) {
    this._maxScan = maxScan;
    return this;
  }
  maxTimeMS(ms) {
    this._maxTimeMS = ms;
    return this;
  }
  max(indexBounds) {
    this._maxIndexBounds = indexBounds;
    return this;
  }
  min(indexBounds) {
    this._minIndexBounds = indexBounds;
    return this;
  }
  async next() {
    if (!await this.hasNext()) {
      throw new QueryError("Error: error hasNext: false", {
        collection: this.collection.name
      });
    }
    const result = this.documents[this.pos++];
    if (this.projection) {
      return applyProjection(this.projection, result);
    }
    return result;
  }
  noCursorTimeout() {
    this._noCursorTimeout = true;
    return this;
  }
  objsLeftInBatch() {
    if (!this.documents) return 0;
    return this.size();
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
  returnKey(enabled = true) {
    this._returnKey = enabled;
    return this;
  }
  showRecordId(enabled = true) {
    this._showRecordId = enabled;
    return this;
  }
  size() {
    if (!this.documents) return 0;
    const remaining = this.documents.length - this.pos;
    if (this._limit > 0) {
      const maxPos = this._skip + this._limit;
      return Math.min(maxPos - this.pos, remaining);
    }
    return remaining;
  }
  skip(num) {
    this._skip = num;
    if (this.pos === 0) {
      if (this.documents) {
        this.pos = Math.min(num, this.documents.length);
      }
    }
    return this;
  }
  isClosed() {
    return this._closed === true;
  }
  snapshot() {
    throw new NotImplementedError("snapshot");
  }
  sort(s) {
    return new this.SortedCursor(this.collection, this.query, this, s);
  }
  allowDiskUse(enabled = true) {
    this._allowDiskUse = enabled;
    return this;
  }
  collation(collationDocument) {
    this._collation = collationDocument;
    return this;
  }
  tailable() {
    throw new NotImplementedError("tailable");
  }
  async toArray() {
    await this._ensureInitialized();
    const results = [];
    while (await this.hasNext()) {
      results.push(await this.next());
    }
    return results;
  }
  // Support for async iteration (for await...of)
  async *[Symbol.asyncIterator]() {
    await this._ensureInitialized();
    while (await this.hasNext()) {
      yield await this.next();
    }
  }
}
class SortedCursor {
  constructor(collection, query, cursor, sort) {
    this.collection = collection;
    this.query = query;
    this.sortSpec = sort;
    this.pos = 0;
    this._cursor = cursor;
    this._sort = sort;
    this._initialized = false;
    this.items = null;
  }
  async _ensureInitialized() {
    if (this._initialized) return;
    await this._cursor._ensureInitialized();
    this.items = [];
    while (await this._cursor.hasNext()) {
      this.items.push(await this._cursor.next());
    }
    const sortKeys = Object.keys(this._sort);
    this.items.sort((function(a, b) {
      for (let i = 0; i < sortKeys.length; i++) {
        if (a[sortKeys[i]] == void 0 && b[sortKeys[i]] != void 0) return -1 * this._sort[sortKeys[i]];
        if (a[sortKeys[i]] != void 0 && b[sortKeys[i]] == void 0) return 1 * this._sort[sortKeys[i]];
        if (a[sortKeys[i]] < b[sortKeys[i]]) return -1 * this._sort[sortKeys[i]];
        if (a[sortKeys[i]] > b[sortKeys[i]]) return 1 * this._sort[sortKeys[i]];
      }
      return 0;
    }).bind(this));
    this._initialized = true;
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
  async count() {
    await this._ensureInitialized();
    return this.items.length;
  }
  explain() {
    throw "Not Implemented";
  }
  async forEach(fn) {
    await this._ensureInitialized();
    while (await this.hasNext()) {
      await fn(await this.next());
    }
  }
  async hasNext() {
    await this._ensureInitialized();
    return this.pos < this.items.length;
  }
  hint() {
    throw "Not Implemented";
  }
  itcount() {
    throw "Not Implemented";
  }
  async limit(max) {
    await this._ensureInitialized();
    this.items = this.items.slice(0, max);
    return this;
  }
  async map(fn) {
    await this._ensureInitialized();
    const results = [];
    while (await this.hasNext()) {
      results.push(await fn(await this.next()));
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
  async next() {
    await this._ensureInitialized();
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
  async skip(num) {
    await this._ensureInitialized();
    while (num > 0) {
      await this.next();
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
    await this._ensureInitialized();
    const results = [];
    while (await this.hasNext()) {
      results.push(this.next());
    }
    return results;
  }
  // Support for async iteration (for await...of)
  async *[Symbol.asyncIterator]() {
    await this._ensureInitialized();
    while (await this.hasNext()) {
      yield await this.next();
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
class NodeData {
  /**
   * Creates a node data object for serialization
   * @param {number} id - Unique node ID
   * @param {boolean} isLeaf - Leaf flag
   * @param {Array} keys - Key array
   * @param {Array} values - Value array (leaf nodes)
   * @param {Array} children - Child pointers (internal nodes)
   * @param {Pointer} next - Pointer to next leaf
   */
  constructor(id, isLeaf, keys, values, children, next) {
    this.id = id;
    this.isLeaf = isLeaf;
    this.keys = keys;
    this.values = values;
    this.children = children;
    for (let v of children) {
      if (!(v instanceof Pointer)) {
        throw new Error("Children must be Pointer objects");
      }
    }
    this.next = next;
  }
}
class BPlusTree {
  /**
   * Creates a new persistent B+ tree
   * @param {FileSystemSyncAccessHandle} syncHandle - Sync access handle to storage file
   * @param {number} order - Tree order (default: 3)
   */
  constructor(syncHandle, order = 3) {
    if (order < 3) {
      throw new Error("B+ tree order must be at least 3");
    }
    this.file = new BJsonFile(syncHandle);
    this.order = order;
    this.minKeys = Math.ceil(order / 2) - 1;
    this.isOpen = false;
    this.rootPointer = null;
    this.nextNodeId = 0;
    this._size = 0;
  }
  /**
   * Open the tree (load or initialize metadata)
   */
  async open() {
    if (this.isOpen) {
      throw new Error("Tree is already open");
    }
    const fileSize = this.file.getFileSize();
    const exists = fileSize > 0;
    if (exists) {
      this._loadMetadata();
    } else {
      this._initializeNewTree();
    }
    this.isOpen = true;
  }
  /**
   * Close the tree and save metadata
   */
  async close() {
    if (this.isOpen) {
      if (this.file && this.file.syncAccessHandle) {
        this.file.flush();
        await this.file.syncAccessHandle.close();
      }
      this.isOpen = false;
    }
  }
  /**
   * Initialize a new empty tree
   */
  _initializeNewTree() {
    const rootNode = new NodeData(0, true, [], [], [], null);
    this.nextNodeId = 1;
    this._size = 0;
    const rootPointer = this._saveNode(rootNode);
    this.rootPointer = rootPointer;
    this._saveMetadata();
  }
  /**
   * Save metadata to file
   */
  _saveMetadata() {
    const metadata = {
      version: 1,
      maxEntries: this.order,
      // Renamed to match RTree size
      minEntries: this.minKeys,
      // Renamed to match RTree size
      size: this._size,
      rootPointer: this.rootPointer,
      nextId: this.nextNodeId
      // Renamed to match RTree size
    };
    this.file.append(metadata);
  }
  /**
   * Load metadata from file
   */
  _loadMetadata() {
    const fileSize = this.file.getFileSize();
    const METADATA_SIZE = 135;
    if (fileSize < METADATA_SIZE) {
      throw new Error("Invalid tree file");
    }
    const metadataOffset = fileSize - METADATA_SIZE;
    const metadata = this.file.read(metadataOffset);
    if (!metadata || typeof metadata.maxEntries === "undefined") {
      throw new Error(`Failed to read metadata: missing required fields`);
    }
    this.order = metadata.maxEntries;
    this.minKeys = metadata.minEntries;
    this._size = metadata.size;
    this.nextNodeId = metadata.nextId;
    this.rootPointer = metadata.rootPointer;
  }
  /**
   * Save a node to disk
   */
  _saveNode(node) {
    const offset = this.file.getFileSize();
    this.file.append(node);
    return new Pointer(offset);
  }
  /**
   * Load a node from disk
   */
  _loadNode(pointer) {
    if (!(pointer instanceof Pointer)) {
      throw new Error("Expected Pointer object");
    }
    const data = this.file.read(pointer);
    return new NodeData(
      data.id,
      data.isLeaf,
      data.keys,
      data.values,
      data.children,
      data.next
    );
  }
  /**
   * Load root node
   */
  _loadRoot() {
    return this._loadNode(this.rootPointer);
  }
  /**
   * Search for a key
   */
  search(key) {
    const root = this._loadRoot();
    return this._searchNode(root, key);
  }
  /**
   * Internal search
   */
  _searchNode(node, key) {
    if (node.isLeaf) {
      for (let i = 0; i < node.keys.length; i++) {
        if (key === node.keys[i]) {
          return node.values[i];
        }
      }
      return void 0;
    } else {
      let i = 0;
      while (i < node.keys.length && key >= node.keys[i]) {
        i++;
      }
      const child = this._loadNode(node.children[i]);
      return this._searchNode(child, key);
    }
  }
  /**
   * Insert a key-value pair
   */
  add(key, value) {
    const root = this._loadRoot();
    const result = this._addToNode(root, key, value);
    let newRoot;
    if (result.newNode) {
      newRoot = result.newNode;
    } else {
      const leftPointer = this._saveNode(result.left);
      const rightPointer = this._saveNode(result.right);
      newRoot = new NodeData(
        this.nextNodeId++,
        false,
        [result.splitKey],
        [],
        [leftPointer, rightPointer],
        null
      );
    }
    const rootPointer = this._saveNode(newRoot);
    this.rootPointer = rootPointer;
    this._size++;
    this._saveMetadata();
  }
  /**
   * Internal add
   */
  _addToNode(node, key, value) {
    if (node.isLeaf) {
      const keys = [...node.keys];
      const values = [...node.values];
      const existingIdx = keys.indexOf(key);
      if (existingIdx !== -1) {
        values[existingIdx] = value;
        return {
          newNode: new NodeData(node.id, true, keys, values, [], null)
        };
      }
      let insertIdx = 0;
      while (insertIdx < keys.length && key > keys[insertIdx]) {
        insertIdx++;
      }
      keys.splice(insertIdx, 0, key);
      values.splice(insertIdx, 0, value);
      if (keys.length < this.order) {
        return {
          newNode: new NodeData(node.id, true, keys, values, [], null)
        };
      } else {
        const mid = Math.ceil(keys.length / 2);
        const leftKeys = keys.slice(0, mid);
        const leftValues = values.slice(0, mid);
        const rightKeys = keys.slice(mid);
        const rightValues = values.slice(mid);
        const rightNode = new NodeData(this.nextNodeId++, true, rightKeys, rightValues, [], null);
        const leftNode = new NodeData(node.id, true, leftKeys, leftValues, [], null);
        return {
          left: leftNode,
          right: rightNode,
          splitKey: rightKeys[0]
        };
      }
    } else {
      const keys = [...node.keys];
      const children = [...node.children];
      let childIdx = 0;
      while (childIdx < keys.length && key >= keys[childIdx]) {
        childIdx++;
      }
      const childNode = this._loadNode(children[childIdx]);
      const result = this._addToNode(childNode, key, value);
      if (result.newNode) {
        const newChildPointer = this._saveNode(result.newNode);
        children[childIdx] = newChildPointer;
        return {
          newNode: new NodeData(node.id, false, keys, [], children, null)
        };
      } else {
        const leftPointer = this._saveNode(result.left);
        const rightPointer = this._saveNode(result.right);
        keys.splice(childIdx, 0, result.splitKey);
        children.splice(childIdx, 1, leftPointer, rightPointer);
        if (keys.length < this.order) {
          return {
            newNode: new NodeData(node.id, false, keys, [], children, null)
          };
        } else {
          const mid = Math.ceil(keys.length / 2) - 1;
          const splitKey = keys[mid];
          const leftKeys = keys.slice(0, mid);
          const rightKeys = keys.slice(mid + 1);
          const leftChildren = children.slice(0, mid + 1);
          const rightChildren = children.slice(mid + 1);
          const leftNode = new NodeData(node.id, false, leftKeys, [], leftChildren, null);
          const rightNode = new NodeData(this.nextNodeId++, false, rightKeys, [], rightChildren, null);
          return {
            left: leftNode,
            right: rightNode,
            splitKey
          };
        }
      }
    }
  }
  /**
   * Delete a key
   */
  delete(key) {
    const root = this._loadRoot();
    const newRoot = this._deleteFromNode(root, key);
    if (!newRoot) {
      return;
    }
    let finalRoot = newRoot;
    if (finalRoot.keys.length === 0 && !finalRoot.isLeaf && finalRoot.children.length > 0) {
      finalRoot = this._loadNode(finalRoot.children[0]);
    }
    const rootPointer = this._saveNode(finalRoot);
    this.rootPointer = rootPointer;
    this._size--;
    this._saveMetadata();
  }
  /**
   * Internal delete
   */
  _deleteFromNode(node, key) {
    if (node.isLeaf) {
      const keyIndex = node.keys.indexOf(key);
      if (keyIndex === -1) {
        return null;
      }
      const newKeys = [...node.keys];
      const newValues = [...node.values];
      newKeys.splice(keyIndex, 1);
      newValues.splice(keyIndex, 1);
      return new NodeData(node.id, true, newKeys, newValues, [], node.next);
    } else {
      let i = 0;
      while (i < node.keys.length && key >= node.keys[i]) {
        i++;
      }
      const childNode = this._loadNode(node.children[i]);
      const newChild = this._deleteFromNode(childNode, key);
      if (!newChild) {
        return null;
      }
      const newChildren = [...node.children];
      const newChildPointer = this._saveNode(newChild);
      newChildren[i] = newChildPointer;
      return new NodeData(node.id, false, [...node.keys], [], newChildren, null);
    }
  }
  /**
   * Get all entries as array
   */
  toArray() {
    const result = [];
    this._collectAllEntries(this._loadRoot(), result);
    return result;
  }
  /**
   * Async iterator for efficiently traversing all entries without loading everything into memory
   * Enables usage: `for await (const entry of tree) { ... }`
   * Each entry has shape: { key, value }
   */
  async *[Symbol.asyncIterator]() {
    if (!this.isOpen) {
      throw new Error("Tree must be open before iteration");
    }
    if (this._size === 0) {
      return;
    }
    yield* this._iterateNode(this._loadRoot());
  }
  /**
   * Helper generator to recursively iterate through a node
   * @private
   */
  *_iterateNode(node) {
    if (node.isLeaf) {
      for (let i = 0; i < node.keys.length; i++) {
        yield {
          key: node.keys[i],
          value: node.values[i]
        };
      }
    } else {
      for (const childPointer of node.children) {
        const child = this._loadNode(childPointer);
        yield* this._iterateNode(child);
      }
    }
  }
  /**
   * Collect all entries in sorted order by traversing tree
   * @private
   */
  _collectAllEntries(node, result) {
    if (node.isLeaf) {
      for (let i = 0; i < node.keys.length; i++) {
        result.push({
          key: node.keys[i],
          value: node.values[i]
        });
      }
    } else {
      for (const childPointer of node.children) {
        const child = this._loadNode(childPointer);
        this._collectAllEntries(child, result);
      }
    }
  }
  /**
   * Get tree size
   */
  size() {
    return this._size;
  }
  /**
   * Check if empty
   */
  isEmpty() {
    return this._size === 0;
  }
  /**
   * Range search
   */
  rangeSearch(minKey, maxKey) {
    const result = [];
    this._rangeSearchNode(this._loadRoot(), minKey, maxKey, result);
    return result;
  }
  /**
   * Range search helper that traverses tree
   * @private
   */
  _rangeSearchNode(node, minKey, maxKey, result) {
    if (node.isLeaf) {
      for (let i = 0; i < node.keys.length; i++) {
        if (node.keys[i] >= minKey && node.keys[i] <= maxKey) {
          result.push({
            key: node.keys[i],
            value: node.values[i]
          });
        }
      }
    } else {
      for (const childPointer of node.children) {
        const child = this._loadNode(childPointer);
        this._rangeSearchNode(child, minKey, maxKey, result);
      }
    }
  }
  /**
   * Get tree height
   */
  getHeight() {
    let height = 0;
    let current = this._loadRoot();
    while (!current.isLeaf) {
      height++;
      current = this._loadNode(current.children[0]);
    }
    return height;
  }
  /**
   * Compact the tree by copying all live entries into a new file.
   * Returns size metrics so callers can see how much space was reclaimed.
   * @param {FileSystemSyncAccessHandle} destSyncHandle - Sync handle for destination file
   * @returns {Promise<{oldSize:number,newSize:number,bytesSaved:number}>}
   */
  async compact(destSyncHandle) {
    if (!this.isOpen) {
      throw new Error("Tree file is not open");
    }
    if (!destSyncHandle) {
      throw new Error("Destination sync handle is required for compaction");
    }
    const oldSize = this.file.getFileSize();
    const entries = this.toArray();
    const newTree = new BPlusTree(destSyncHandle, this.order);
    await newTree.open();
    for (const entry of entries) {
      await newTree.add(entry.key, entry.value);
    }
    const newSize = newTree.file.getFileSize();
    await newTree.close();
    return {
      oldSize,
      newSize,
      bytesSaved: Math.max(0, oldSize - newSize)
    };
  }
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
class TextIndex {
  constructor(options = {}) {
    const {
      order = 16,
      trees
    } = options;
    this.order = order;
    this.index = trees?.index || null;
    this.documentTerms = trees?.documentTerms || null;
    this.documentLengths = trees?.documentLengths || null;
    this.isOpen = false;
  }
  async open() {
    if (this.isOpen) {
      throw new Error("TextIndex is already open");
    }
    if (!this.index || !this.documentTerms || !this.documentLengths) {
      throw new Error("Trees must be initialized before opening");
    }
    await Promise.all([
      this.index.open(),
      this.documentTerms.open(),
      this.documentLengths.open()
    ]);
    this.isOpen = true;
  }
  async close() {
    if (!this.isOpen) {
      return;
    }
    await Promise.all([
      this.index.close(),
      this.documentTerms.close(),
      this.documentLengths.close()
    ]);
    this.isOpen = false;
  }
  _ensureOpen() {
    if (!this.isOpen) {
      throw new Error("TextIndex is not open");
    }
  }
  /**
   * Add terms from text to the index for a given document ID
   * @param {string} docId - The document identifier
   * @param {string} text - The text content to index
   */
  async add(docId, text2) {
    this._ensureOpen();
    if (!docId) {
      throw new Error("Document ID is required");
    }
    const words = tokenize(text2);
    const termFrequency = /* @__PURE__ */ new Map();
    words.forEach((word) => {
      const stem = stemmer(word);
      termFrequency.set(stem, (termFrequency.get(stem) || 0) + 1);
    });
    for (const [stem, frequency] of termFrequency.entries()) {
      const postings = await this.index.search(stem) || {};
      postings[docId] = frequency;
      await this.index.add(stem, postings);
    }
    const existingTerms = await this.documentTerms.search(docId) || {};
    const mergedTerms = { ...existingTerms };
    termFrequency.forEach((frequency, stem) => {
      mergedTerms[stem] = frequency;
    });
    const docLength = Object.values(mergedTerms).reduce((sum, count) => sum + count, 0);
    await this.documentTerms.add(docId, mergedTerms);
    await this.documentLengths.add(docId, docLength);
  }
  /**
   * Remove all indexed terms for a given document ID
   * @param {string} docId - The document identifier to remove
   * @returns {boolean} True if document was found and removed, false otherwise
   */
  async remove(docId) {
    this._ensureOpen();
    const terms = await this.documentTerms.search(docId);
    if (!terms) {
      return false;
    }
    for (const [term] of Object.entries(terms)) {
      const postings = await this.index.search(term) || {};
      delete postings[docId];
      if (Object.keys(postings).length === 0) {
        await this.index.delete(term);
      } else {
        await this.index.add(term, postings);
      }
    }
    await this.documentTerms.delete(docId);
    await this.documentLengths.delete(docId);
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
  async query(queryText, options = { scored: true, requireAll: false }) {
    this._ensureOpen();
    const words = tokenize(queryText);
    if (words.length === 0) {
      return [];
    }
    const stemmedTerms = words.map((word) => stemmer(word));
    const uniqueTerms = [...new Set(stemmedTerms)];
    if (options.requireAll) {
      const docSets = [];
      for (const term of uniqueTerms) {
        const termDocs = await this.index.search(term);
        docSets.push(new Set(Object.keys(termDocs || {})));
      }
      if (docSets.length === 0) {
        return [];
      }
      const intersection = new Set(docSets[0]);
      for (let i = 1; i < docSets.length; i++) {
        for (const docId of [...intersection]) {
          if (!docSets[i].has(docId)) {
            intersection.delete(docId);
          }
        }
      }
      return Array.from(intersection);
    }
    const docLengthEntries = await this.documentLengths.toArray();
    const docLengthMap = new Map(docLengthEntries.map(({ key, value }) => [String(key), value || 1]));
    const totalDocs = docLengthEntries.length;
    const idf = /* @__PURE__ */ new Map();
    for (const term of uniqueTerms) {
      const termDocs = await this.index.search(term);
      const docsWithTerm = termDocs ? Object.keys(termDocs).length : 0;
      if (docsWithTerm > 0) {
        idf.set(term, Math.log(totalDocs / docsWithTerm));
      }
    }
    const docScores = /* @__PURE__ */ new Map();
    for (const term of uniqueTerms) {
      const termDocs = await this.index.search(term);
      if (!termDocs) {
        continue;
      }
      for (const [docId, termFreq] of Object.entries(termDocs)) {
        const docLength = docLengthMap.get(docId) || 1;
        const tf = termFreq / docLength;
        const termIdf = idf.get(term) || 0;
        const prev = docScores.get(docId) || 0;
        docScores.set(docId, prev + tf * termIdf);
      }
    }
    for (const [docId, score] of docScores.entries()) {
      const docTerms = await this.documentTerms.search(docId) || {};
      const matchingTerms = uniqueTerms.filter((term) => !!docTerms[term]).length;
      const coverage = matchingTerms / uniqueTerms.length;
      docScores.set(docId, score * (1 + coverage));
    }
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
  async getTermCount() {
    this._ensureOpen();
    const terms = await this.index.toArray();
    return terms.length;
  }
  /**
   * Get the number of documents in the index
   * @returns {number} Number of indexed documents
   */
  async getDocumentCount() {
    this._ensureOpen();
    const docs = await this.documentTerms.toArray();
    return docs.length;
  }
  /**
   * Clear all data from the index
   */
  async clear() {
    this._ensureOpen();
    const [terms, docs, lengths] = await Promise.all([
      this.index.toArray(),
      this.documentTerms.toArray(),
      this.documentLengths.toArray()
    ]);
    for (const entry of terms) {
      await this.index.delete(entry.key);
    }
    for (const entry of docs) {
      await this.documentTerms.delete(entry.key);
    }
    for (const entry of lengths) {
      await this.documentLengths.delete(entry.key);
    }
  }
  /**
   * Compact all internal B+ trees using provided destination tree instances.
   * The destination trees should be freshly created (unopened) with new sync handles.
   * After compaction completes, the destination sync handles will be closed.
   * @param {Object} options - Compaction options  
   * @param {BPlusTree} options.index - Fresh destination tree for index data
   * @param {BPlusTree} options.documentTerms - Fresh destination tree for document terms
   * @param {BPlusTree} options.documentLengths - Fresh destination tree for document lengths
   * @returns {Promise<{terms: object, documents: object, lengths: object}>}
   */
  async compact({ index: destIndex, documentTerms: destDocTerms, documentLengths: destDocLengths }) {
    this._ensureOpen();
    if (!destIndex || !destDocTerms || !destDocLengths) {
      throw new Error("Destination trees must be provided for compaction");
    }
    const termsResult = await this.index.compact(destIndex.file.syncAccessHandle);
    const documentsResult = await this.documentTerms.compact(destDocTerms.file.syncAccessHandle);
    const lengthsResult = await this.documentLengths.compact(destDocLengths.file.syncAccessHandle);
    await this.close();
    this.isOpen = false;
    return {
      terms: termsResult,
      documents: documentsResult,
      lengths: lengthsResult
    };
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
function haversineDistance$1(lat1, lng1, lat2, lng2) {
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
  const distanceKm = haversineDistance$1(coords.lat, coords.lng, refLat, refLng);
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
    const dist = haversineDistance$1(docCoords.lat, docCoords.lng, queryCoords.lat, queryCoords.lng);
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
function matchWithArrayIndices(doc, query) {
  const arrayFilters = {};
  const matched = andWithTracking(doc, toArray(query), arrayFilters);
  return { matched, arrayFilters };
}
function andWithTracking(doc, els, arrayFilters) {
  for (var i = 0; i < els.length; i++) {
    if (!tlMatchesWithTracking(doc, els[i], arrayFilters)) {
      return false;
    }
  }
  return true;
}
function tlMatchesWithTracking(doc, query, arrayFilters) {
  var key = Object.keys(query)[0];
  var value = query[key];
  if (key.charAt(0) == "$") {
    if (key == "$and") return andWithTracking(doc, value, arrayFilters);
    else if (key == "$or") return orWithTracking(doc, value, arrayFilters);
    else if (key == "$not") {
      return !tlMatches(doc, value);
    } else if (key == "$nor") return norWithTracking(doc, value, arrayFilters);
    else if (key == "$where") return where(doc, value);
    else if (key == "$comment") return true;
    else if (key == "$jsonSchema") return validateJsonSchema(doc, value);
    else if (key == "$expr") {
      try {
        return evaluateExpression(value, doc);
      } catch (e) {
        return false;
      }
    } else throw { $err: "Can't canonicalize query: BadValue unknown top level operator: " + key, code: 17287 };
  } else {
    return opMatchesWithTracking(doc, key, value, arrayFilters);
  }
}
function orWithTracking(doc, els, arrayFilters) {
  for (var i = 0; i < els.length; i++) {
    if (tlMatchesWithTracking(doc, els[i], arrayFilters)) {
      return true;
    }
  }
  return false;
}
function norWithTracking(doc, els, arrayFilters) {
  for (var i = 0; i < els.length; i++) {
    if (tlMatchesWithTracking(doc, els[i], arrayFilters)) {
      return false;
    }
  }
  return true;
}
function opMatchesWithTracking(doc, key, value, arrayFilters) {
  const baseField = key.split(".")[0];
  const fieldValue = getFieldValues(doc, key);
  const trackMatchingIndex = (fieldValue2, checkFn) => {
    if (fieldValue2 === void 0) return false;
    if (fieldValue2 === null) return checkFn(fieldValue2);
    if (isArray(fieldValue2)) {
      const baseValue = getProp(doc, baseField);
      if (isArray(baseValue)) {
        for (var i2 = 0; i2 < fieldValue2.length; i2++) {
          if (checkFn(fieldValue2[i2])) {
            arrayFilters[key] = i2;
            return true;
          }
        }
        return false;
      }
    }
    return fieldValueMatches(fieldValue2, checkFn);
  };
  if (typeof value == "string") return trackMatchingIndex(fieldValue, function(v) {
    return valuesEqual(v, value);
  });
  else if (typeof value == "number") return trackMatchingIndex(fieldValue, function(v) {
    return valuesEqual(v, value);
  });
  else if (typeof value == "boolean") return trackMatchingIndex(fieldValue, function(v) {
    return valuesEqual(v, value);
  });
  else if (value instanceof ObjectId) return trackMatchingIndex(fieldValue, function(v) {
    return valuesEqual(v, value);
  });
  else if (typeof value == "object") {
    if (value instanceof RegExp) return fieldValue != void 0 && trackMatchingIndex(fieldValue, function(v) {
      return v && v.match(value);
    });
    else if (isArray(value)) return fieldValue != void 0 && trackMatchingIndex(fieldValue, function(v) {
      return v && arrayMatches(v, value);
    });
    else {
      var keys = Object.keys(value);
      if (keys[0].charAt(0) == "$") {
        for (var i = 0; i < keys.length; i++) {
          var operator = keys[i];
          var operand = value[operator];
          if (operator == "$eq") {
            if (!trackMatchingIndex(fieldValue, function(v) {
              return valuesEqual(v, operand);
            })) return false;
          } else if (operator == "$gt") {
            if (!trackMatchingIndex(fieldValue, function(v) {
              return compareValues(v, operand, ">");
            })) return false;
          } else if (operator == "$gte") {
            if (!trackMatchingIndex(fieldValue, function(v) {
              return compareValues(v, operand, ">=");
            })) return false;
          } else if (operator == "$lt") {
            if (!trackMatchingIndex(fieldValue, function(v) {
              return compareValues(v, operand, "<");
            })) return false;
          } else if (operator == "$lte") {
            if (!trackMatchingIndex(fieldValue, function(v) {
              return compareValues(v, operand, "<=");
            })) return false;
          } else if (operator == "$ne") {
            if (!trackMatchingIndex(fieldValue, function(v) {
              return !valuesEqual(v, operand);
            })) return false;
          } else if (operator == "$in") {
            if (!trackMatchingIndex(fieldValue, function(v) {
              return isIn(v, operand);
            })) return false;
          } else if (operator == "$nin") {
            if (trackMatchingIndex(fieldValue, function(v) {
              return isIn(v, operand);
            })) return false;
          } else if (operator == "$elemMatch") {
            var arrayFieldValue = getProp(doc, key);
            if (arrayFieldValue == void 0 || !isArray(arrayFieldValue)) return false;
            for (var j = 0; j < arrayFieldValue.length; j++) {
              var element = arrayFieldValue[j];
              if (typeof element === "object" && !isArray(element)) {
                if (matches(element, operand)) {
                  arrayFilters[key] = j;
                  return true;
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
                  else if (op == "$eq" && element != opValue) matchesPrimitive = false;
                  else if (op == "$ne" && element == opValue) matchesPrimitive = false;
                }
                if (matchesPrimitive) {
                  arrayFilters[key] = j;
                  return true;
                }
              }
            }
            return false;
          } else {
            if (!opMatches(doc, key, value)) return false;
          }
        }
        return true;
      } else {
        return fieldValue != void 0 && trackMatchingIndex(fieldValue, function(v) {
          return objectMatches(v, value);
        });
      }
    }
  }
  return false;
}
function extractFilteredPositionalIdentifier(pathSegment) {
  const match = pathSegment.match(/^\$\[([^\]]+)\]$/);
  return match ? match[1] : null;
}
function parseFieldPath(fieldPath) {
  const segments = fieldPath.split(".");
  return segments.map((segment) => {
    const identifier = extractFilteredPositionalIdentifier(segment);
    return {
      segment,
      isFilteredPositional: identifier !== null,
      identifier
    };
  });
}
function applyToFilteredArrayElements(doc, parsedPath, value, operation, arrayFilters) {
  function traverse(current, pathIndex, filterContext) {
    if (pathIndex >= parsedPath.length) {
      return;
    }
    const pathInfo = parsedPath[pathIndex];
    const isLastSegment = pathIndex === parsedPath.length - 1;
    if (pathInfo.isFilteredPositional) {
      const identifier = pathInfo.identifier;
      const filter = arrayFilters ? arrayFilters.find((f) => {
        const filterKeys = Object.keys(f);
        return filterKeys.some((key) => key.startsWith(identifier + ".") || key === identifier);
      }) : null;
      if (!arrayFilters) {
        if (!current[pathInfo.segment]) {
          const nextPath = parsedPath[pathIndex + 1];
          if (nextPath && nextPath.isFilteredPositional) {
            current[pathInfo.segment] = [];
          } else {
            current[pathInfo.segment] = {};
          }
        }
        if (isLastSegment) {
          applyOperationToValue(current, pathInfo.segment, value, operation);
        } else {
          traverse(current[pathInfo.segment], pathIndex + 1);
        }
        return;
      }
      if (!isArray(current)) {
        if (!current[pathInfo.segment]) {
          current[pathInfo.segment] = {};
        }
        if (isLastSegment) {
          applyOperationToValue(current, pathInfo.segment, value, operation);
        } else {
          traverse(current[pathInfo.segment], pathIndex + 1);
        }
        return;
      }
      for (let i = 0; i < current.length; i++) {
        const element = current[i];
        let shouldUpdate = true;
        if (filter) {
          let transformedFilter = {};
          let hasDirectMatch = false;
          Object.keys(filter).forEach((key) => {
            if (key.startsWith(identifier + ".")) {
              const fieldPath = key.substring(identifier.length + 1);
              transformedFilter[fieldPath] = filter[key];
            } else if (key === identifier) {
              transformedFilter = filter[key];
              hasDirectMatch = true;
            }
          });
          if (hasDirectMatch) {
            const testDoc = { value: element };
            const testFilter = { value: transformedFilter };
            shouldUpdate = matches(testDoc, testFilter);
          } else {
            shouldUpdate = matches(element, transformedFilter);
          }
        }
        if (shouldUpdate) {
          if (isLastSegment) {
            applyOperationToValue(current, i, value, operation);
          } else {
            if (element !== null && element !== void 0) {
              traverse(current[i], pathIndex + 1);
            }
          }
        }
      }
    } else {
      if (current[pathInfo.segment] === void 0 || current[pathInfo.segment] === null) {
        if (!isLastSegment) {
          const nextPath = parsedPath[pathIndex + 1];
          if (nextPath && nextPath.isFilteredPositional) {
            current[pathInfo.segment] = [];
          } else {
            current[pathInfo.segment] = {};
          }
        }
      }
      if (isLastSegment) {
        applyOperationToValue(current, pathInfo.segment, value, operation);
      } else {
        if (current[pathInfo.segment] !== void 0 && current[pathInfo.segment] !== null) {
          traverse(current[pathInfo.segment], pathIndex + 1);
        }
      }
    }
  }
  traverse(doc, 0);
}
function applyOperationToValue(container, key, value, operation) {
  switch (operation) {
    case "$set":
      container[key] = value;
      break;
    case "$inc":
      if (container[key] === void 0) container[key] = 0;
      container[key] += value;
      break;
    case "$mul":
      container[key] = container[key] * value;
      break;
    case "$min":
      container[key] = Math.min(container[key], value);
      break;
    case "$max":
      container[key] = Math.max(container[key], value);
      break;
    case "$unset":
      delete container[key];
      break;
    default:
      container[key] = value;
  }
}
function hasFilteredPositionalOperator(fieldPath) {
  return /\$\[[^\]]+\]/.test(fieldPath);
}
function hasAllPositional(field) {
  return field.indexOf("$[]") !== -1;
}
function applyToAllPositional(doc, field, updateFn) {
  var path = field.split(".");
  var current = doc;
  for (var i = 0; i < path.length; i++) {
    var pathSegment = path[i];
    if (pathSegment === "$[]") {
      if (!Array.isArray(current)) {
        return;
      }
      var remainingPath = path.slice(i + 1).join(".");
      for (var j = 0; j < current.length; j++) {
        if (remainingPath) {
          if (remainingPath.indexOf("$[]") !== -1) {
            applyToAllPositional(current[j], remainingPath, updateFn);
          } else {
            var currentValue = getProp(current[j], remainingPath);
            var newValue = updateFn(currentValue);
            setProp(current[j], remainingPath, newValue);
          }
        } else {
          current[j] = updateFn(current[j]);
        }
      }
      return;
    }
    if (current == null || current == void 0) return;
    current = current[pathSegment];
  }
}
function replacePositionalOperator(fieldPath, arrayFilters) {
  if (!arrayFilters || !fieldPath.includes("$")) {
    return fieldPath;
  }
  const parts = fieldPath.split(".");
  const dollarIndex = parts.indexOf("$");
  if (dollarIndex === -1) {
    return fieldPath;
  }
  const pathBeforeDollar = parts.slice(0, dollarIndex).join(".");
  let matchedIndex = null;
  for (const filterPath in arrayFilters) {
    if (filterPath === pathBeforeDollar || filterPath.startsWith(pathBeforeDollar + ".")) {
      matchedIndex = arrayFilters[filterPath];
      break;
    }
  }
  if (matchedIndex !== null && matchedIndex !== void 0) {
    parts[dollarIndex] = matchedIndex.toString();
    return parts.join(".");
  }
  return fieldPath;
}
function applyUpdates(updates, doc, setOnInsert, positionalMatchInfo, userArrayFilters) {
  var keys = Object.keys(updates);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var value = updates[key];
    if (key == "$inc") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        var field = replacePositionalOperator(fields[j], positionalMatchInfo);
        var amount = value[fields[j]];
        if (hasFilteredPositionalOperator(field)) {
          if (!userArrayFilters) {
            throw new Error("arrayFilters option is required when using filtered positional operator $[<identifier>]");
          }
          const parsedPath = parseFieldPath(field);
          applyToFilteredArrayElements(doc, parsedPath, amount, "$inc", userArrayFilters);
        } else if (hasAllPositional(field)) {
          applyToAllPositional(doc, field, function(val) {
            return (val === void 0 ? 0 : val) + amount;
          });
        } else {
          var currentValue = getProp(doc, field);
          if (currentValue == void 0) currentValue = 0;
          setProp(doc, field, currentValue + amount);
        }
      }
    } else if (key == "$mul") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        var field = replacePositionalOperator(fields[j], positionalMatchInfo);
        var amount = value[fields[j]];
        if (hasFilteredPositionalOperator(field)) {
          if (!userArrayFilters) {
            throw new Error("arrayFilters option is required when using filtered positional operator $[<identifier>]");
          }
          const parsedPath = parseFieldPath(field);
          applyToFilteredArrayElements(doc, parsedPath, amount, "$mul", userArrayFilters);
        } else if (hasAllPositional(field)) {
          applyToAllPositional(doc, field, function(val) {
            return val * amount;
          });
        } else {
          var currentValue = getProp(doc, field);
          if (currentValue == void 0) currentValue = 0;
          setProp(doc, field, currentValue * amount);
        }
      }
    } else if (key == "$rename") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        var field = replacePositionalOperator(fields[j], positionalMatchInfo);
        var newName = replacePositionalOperator(value[fields[j]], positionalMatchInfo);
        doc[newName] = doc[field];
        delete doc[field];
      }
    } else if (key == "$setOnInsert" && setOnInsert) {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        var field = replacePositionalOperator(fields[j], positionalMatchInfo);
        doc[field] = value[fields[j]];
      }
    } else if (key == "$set") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        var field = replacePositionalOperator(fields[j], positionalMatchInfo);
        if (hasFilteredPositionalOperator(field)) {
          if (!userArrayFilters) {
            throw new Error("arrayFilters option is required when using filtered positional operator $[<identifier>]");
          }
          const parsedPath = parseFieldPath(field);
          applyToFilteredArrayElements(doc, parsedPath, value[fields[j]], "$set", userArrayFilters);
        } else {
          setProp(doc, field, value[fields[j]]);
        }
      }
    } else if (key == "$unset") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        var field = replacePositionalOperator(fields[j], positionalMatchInfo);
        delete doc[field];
      }
    } else if (key == "$min") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        var field = replacePositionalOperator(fields[j], positionalMatchInfo);
        var amount = value[fields[j]];
        if (hasFilteredPositionalOperator(field)) {
          if (!userArrayFilters) {
            throw new Error("arrayFilters option is required when using filtered positional operator $[<identifier>]");
          }
          const parsedPath = parseFieldPath(field);
          applyToFilteredArrayElements(doc, parsedPath, amount, "$min", userArrayFilters);
        } else if (hasAllPositional(field)) {
          applyToAllPositional(doc, field, function(val) {
            return Math.min(val, amount);
          });
        } else {
          var currentValue = getProp(doc, field);
          setProp(doc, field, Math.min(currentValue, amount));
        }
      }
    } else if (key == "$max") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        var field = replacePositionalOperator(fields[j], positionalMatchInfo);
        var amount = value[fields[j]];
        if (hasFilteredPositionalOperator(field)) {
          if (!userArrayFilters) {
            throw new Error("arrayFilters option is required when using filtered positional operator $[<identifier>]");
          }
          const parsedPath = parseFieldPath(field);
          applyToFilteredArrayElements(doc, parsedPath, amount, "$max", userArrayFilters);
        } else if (hasAllPositional(field)) {
          applyToAllPositional(doc, field, function(val) {
            return Math.max(val, amount);
          });
        } else {
          var currentValue = getProp(doc, field);
          setProp(doc, field, Math.max(currentValue, amount));
        }
      }
    } else if (key == "$currentDate") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        var field = replacePositionalOperator(fields[j], positionalMatchInfo);
        var typeSpec = value[fields[j]];
        if (typeSpec === true || typeof typeSpec === "object" && typeSpec.$type === "date") {
          setProp(doc, field, /* @__PURE__ */ new Date());
        } else {
          setProp(doc, field, /* @__PURE__ */ new Date());
        }
      }
    } else if (key == "$addToSet") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        var field = replacePositionalOperator(fields[j], positionalMatchInfo);
        var addValue = value[fields[j]];
        var currentArray = getProp(doc, field);
        if (currentArray && Array.isArray(currentArray)) {
          currentArray.push(addValue);
        }
      }
    } else if (key == "$pop") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        var field = replacePositionalOperator(fields[j], positionalMatchInfo);
        var popValue = value[fields[j]];
        var currentArray = getProp(doc, field);
        if (currentArray && Array.isArray(currentArray)) {
          if (popValue == 1) {
            currentArray.pop();
          } else if (popValue == -1) {
            currentArray.shift();
          }
        }
      }
    } else if (key == "$pull") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        var field = replacePositionalOperator(fields[j], positionalMatchInfo);
        var condition = value[fields[j]];
        var src = getProp(doc, field);
        if (src == void 0 || !Array.isArray(src)) continue;
        var notRemoved = [];
        for (var k = 0; k < src.length; k++) {
          var element = src[k];
          var shouldRemove = false;
          if (typeof condition === "object" && condition !== null && !Array.isArray(condition)) {
            if (typeof element === "object" && element !== null && !Array.isArray(element)) {
              shouldRemove = matches(element, condition);
            } else {
              var tempDoc = { __temp: element };
              shouldRemove = opMatches(tempDoc, "__temp", condition);
            }
          } else {
            shouldRemove = element == condition;
          }
          if (!shouldRemove) notRemoved.push(element);
        }
        setProp(doc, field, notRemoved);
      }
    } else if (key == "$pullAll") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        var field = replacePositionalOperator(fields[j], positionalMatchInfo);
        var src = getProp(doc, field);
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
        setProp(doc, field, notRemoved);
      }
    } else if (key == "$pushAll") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        var field = replacePositionalOperator(fields[j], positionalMatchInfo);
        var values = value[fields[j]];
        var currentArray = getProp(doc, field);
        if (currentArray && Array.isArray(currentArray)) {
          for (var k = 0; k < values.length; k++) {
            currentArray.push(values[k]);
          }
        }
      }
    } else if (key == "$push") {
      var fields = Object.keys(value);
      for (var j = 0; j < fields.length; j++) {
        var field = replacePositionalOperator(fields[j], positionalMatchInfo);
        var pushValue = value[fields[j]];
        var isModifierPush = pushValue !== null && typeof pushValue === "object" && (pushValue.$each !== void 0 || pushValue.$position !== void 0 || pushValue.$slice !== void 0 || pushValue.$sort !== void 0);
        if (isModifierPush) {
          var currentArray = getProp(doc, field);
          if (!currentArray) {
            currentArray = [];
            setProp(doc, field, currentArray);
          }
          var valuesToPush = pushValue.$each !== void 0 ? pushValue.$each : [pushValue];
          var position = pushValue.$position !== void 0 ? pushValue.$position : currentArray.length;
          if (position < 0) {
            position = Math.max(0, currentArray.length + position);
          }
          currentArray.splice(position, 0, ...valuesToPush);
          if (pushValue.$sort !== void 0) {
            var sortSpec = pushValue.$sort;
            if (typeof sortSpec === "number") {
              currentArray.sort(function(a, b) {
                if (a < b) return sortSpec > 0 ? -1 : 1;
                if (a > b) return sortSpec > 0 ? 1 : -1;
                return 0;
              });
            } else if (typeof sortSpec === "object") {
              currentArray.sort(function(a, b) {
                var sortKeys = Object.keys(sortSpec);
                for (var k2 = 0; k2 < sortKeys.length; k2++) {
                  var sortKey = sortKeys[k2];
                  var sortDir = sortSpec[sortKey];
                  var aVal = getProp(a, sortKey);
                  var bVal = getProp(b, sortKey);
                  if (aVal < bVal) return sortDir > 0 ? -1 : 1;
                  if (aVal > bVal) return sortDir > 0 ? 1 : -1;
                }
                return 0;
              });
            }
          }
          if (pushValue.$slice !== void 0) {
            var sliceValue = pushValue.$slice;
            if (sliceValue < 0) {
              var sliced = currentArray.slice(sliceValue);
              setProp(doc, field, sliced);
            } else if (sliceValue === 0) {
              setProp(doc, field, []);
            } else {
              var sliced = currentArray.slice(0, sliceValue);
              setProp(doc, field, sliced);
            }
          }
        } else {
          var currentArray = getProp(doc, field);
          if (currentArray && Array.isArray(currentArray)) {
            currentArray.push(pushValue);
          }
        }
      }
    } else if (key == "$bit") {
      var fields = Object.keys(value);
      var field = replacePositionalOperator(fields[0], positionalMatchInfo);
      var operation = value[fields[0]];
      var operator = Object.keys(operation)[0];
      var operand = operation[operator];
      var currentValue = getProp(doc, field);
      if (operator == "and") {
        setProp(doc, field, currentValue & operand);
      } else if (operator == "or") {
        setProp(doc, field, currentValue | operand);
      } else if (operator == "xor") {
        setProp(doc, field, currentValue ^ operand);
      } else {
        throw "unknown $bit operator: " + operator;
      }
    } else {
      throw "unknown update operator: " + key;
    }
  }
}
function createDocFromUpdate(query, updates, id) {
  var newDoc = { _id: id };
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
}
class RegularCollectionIndex extends Index {
  constructor(name, keys, storageFilePath, options = {}) {
    super(name, keys, storageFilePath, options);
    this.storageFilePath = storageFilePath;
    this.data = null;
    this.syncHandle = null;
    this.isOpen = false;
  }
  /**
   * Open the index file
   * Must be called before using the index
   */
  async open() {
    if (this.isOpen) {
      return;
    }
    try {
      const pathParts = this.storageFilePath.split("/").filter(Boolean);
      const filename = pathParts.pop();
      if (!filename) {
        throw new Error(`Invalid storage path: ${this.storageFilePath}`);
      }
      let dirHandle = await globalThis.navigator.storage.getDirectory();
      for (const part of pathParts) {
        dirHandle = await dirHandle.getDirectoryHandle(part, { create: true });
      }
      const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
      this.syncHandle = await fileHandle.createSyncAccessHandle();
      this.data = new BPlusTree(this.syncHandle, 50);
      await this.data.open();
      this.isOpen = true;
    } catch (error) {
      if (error.message && (error.message.includes("Unknown type byte") || error.message.includes("Failed to read metadata") || error.message.includes("Invalid tree file"))) {
        if (this.syncHandle) {
          try {
            await this.syncHandle.close();
          } catch (e) {
          }
          this.syncHandle = null;
        }
        const pathParts = this.storageFilePath.split("/").filter(Boolean);
        const filename = pathParts.pop();
        if (!filename) {
          throw new Error(`Invalid storage path: ${this.storageFilePath}`);
        }
        let dirHandle = await globalThis.navigator.storage.getDirectory();
        for (const part of pathParts) {
          dirHandle = await dirHandle.getDirectoryHandle(part, { create: true });
        }
        try {
          await dirHandle.removeEntry(filename);
        } catch (e) {
        }
        const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
        this.syncHandle = await fileHandle.createSyncAccessHandle();
        this.data = new BPlusTree(this.syncHandle, 50);
        await this.data.open();
        this.isOpen = true;
      } else {
        throw error;
      }
    }
  }
  /**
   * Close the index file
   */
  async close() {
    if (this.isOpen) {
      try {
        await this.data.close();
      } catch (error) {
        if (!error.message || !error.message.includes("File is not open")) {
          throw error;
        }
      }
      this.isOpen = false;
    }
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
  async add(doc) {
    if (!this.isOpen) {
      await this.open();
    }
    const indexKey = this.extractIndexKey(doc);
    if (indexKey !== null) {
      const docId = doc._id.toString();
      const existing = await this.data.search(indexKey);
      let docIds;
      if (Array.isArray(existing)) {
        if (!existing.includes(docId)) {
          docIds = [...existing, docId];
        } else {
          return;
        }
      } else if (existing) {
        docIds = existing === docId ? [existing] : [existing, docId];
      } else {
        docIds = [docId];
      }
      await this.data.add(indexKey, docIds);
    }
  }
  /**
   * Remove a document from the index
    * 
   * @param {Object} doc - The document to remove
   */
  async remove(doc) {
    if (!this.isOpen) {
      await this.open();
    }
    const indexKey = this.extractIndexKey(doc);
    if (indexKey !== null) {
      const docId = doc._id.toString();
      const existing = await this.data.search(indexKey);
      if (Array.isArray(existing)) {
        const filtered = existing.filter((id) => id !== docId);
        if (filtered.length > 0) {
          await this.data.add(indexKey, filtered);
        } else {
          await this.data.delete(indexKey);
        }
      } else if (existing === docId) {
        await this.data.delete(indexKey);
      }
    }
  }
  /**
   * Query the index
    * 
   * @param {*} query - The query object
   * @returns {Promise<Array|null>} Array of document IDs or null if index cannot satisfy query
   */
  async query(query) {
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
      const result = await this.data.search(indexKey);
      return result || [];
    }
    if (typeof queryValue === "object" && !Array.isArray(queryValue)) {
      return await this._queryWithOperators(field, queryValue);
    }
    return null;
  }
  /**
   * Query index with comparison operators
    * 
   * @private
   */
  async _queryWithOperators(field, operators) {
    const ops = Object.keys(operators);
    const results = /* @__PURE__ */ new Set();
    const hasRangeOp = ops.some((op) => ["$gt", "$gte", "$lt", "$lte"].includes(op));
    if (hasRangeOp) {
      const hasGt = ops.includes("$gt") || ops.includes("$gte");
      const hasLt = ops.includes("$lt") || ops.includes("$lte");
      if (hasGt && hasLt) {
        const minValue = ops.includes("$gte") ? operators["$gte"] : ops.includes("$gt") ? operators["$gt"] : -Infinity;
        const maxValue = ops.includes("$lte") ? operators["$lte"] : ops.includes("$lt") ? operators["$lt"] : Infinity;
        const rangeResults = await this.data.rangeSearch(minValue, maxValue);
        for (const entry of rangeResults) {
          const keyValue = entry.key;
          const value = entry.value;
          let matches2 = true;
          if (ops.includes("$gt") && !(keyValue > operators["$gt"])) matches2 = false;
          if (ops.includes("$gte") && !(keyValue >= operators["$gte"])) matches2 = false;
          if (ops.includes("$lt") && !(keyValue < operators["$lt"])) matches2 = false;
          if (ops.includes("$lte") && !(keyValue <= operators["$lte"])) matches2 = false;
          if (matches2 && value) {
            if (Array.isArray(value)) {
              value.forEach((id) => results.add(id));
            } else {
              results.add(value);
            }
          }
        }
        return Array.from(results);
      } else {
        const allEntries = await this.data.toArray();
        for (const entry of allEntries) {
          const keyValue = entry.key;
          const value = entry.value;
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
            if (Array.isArray(value)) {
              value.forEach((id) => results.add(id));
            } else {
              results.add(value);
            }
          }
        }
        return Array.from(results);
      }
    }
    if (ops.includes("$in")) {
      const values = operators["$in"];
      if (Array.isArray(values)) {
        for (const value of values) {
          const result = await this.data.search(value);
          if (result) {
            if (Array.isArray(result)) {
              result.forEach((id) => results.add(id));
            } else {
              results.add(result);
            }
          }
        }
        return Array.from(results);
      }
    }
    if (ops.includes("$eq")) {
      const value = operators["$eq"];
      const result = await this.data.search(value);
      if (result) {
        return Array.isArray(result) ? result : [result];
      }
      return [];
    }
    if (ops.includes("$ne")) {
      const excludeValue = operators["$ne"];
      const allEntries = await this.data.toArray();
      for (const entry of allEntries) {
        if (entry.key !== excludeValue && entry.value) {
          if (Array.isArray(entry.value)) {
            entry.value.forEach((id) => results.add(id));
          } else {
            results.add(entry.value);
          }
        }
      }
      return Array.from(results);
    }
    return null;
  }
  /**
   * Clear all entries from the index
   */
  async clear() {
    if (this.isOpen) {
      await this.close();
    }
    const pathParts = this.storageFilePath.split("/").filter(Boolean);
    const filename = pathParts.pop();
    let dirHandle = await globalThis.navigator.storage.getDirectory();
    for (const part of pathParts) {
      dirHandle = await dirHandle.getDirectoryHandle(part, { create: true });
    }
    try {
      await dirHandle.removeEntry(filename);
    } catch (e) {
    }
    await this.open();
  }
}
class TextCollectionIndex extends Index {
  constructor(name, keys, storage, options = {}) {
    super(name, keys, storage);
    this.storageBasePath = storage;
    this.textIndex = null;
    this.syncHandles = [];
    this.isOpen = false;
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
   * Open the index files
   * Must be called before using the index
   */
  async open() {
    if (this.isOpen) {
      return;
    }
    try {
      const indexTree = await this._createBPlusTree(this.storageBasePath + "-terms.bjson");
      const docTermsTree = await this._createBPlusTree(this.storageBasePath + "-documents.bjson");
      const lengthsTree = await this._createBPlusTree(this.storageBasePath + "-lengths.bjson");
      this.textIndex = new TextIndex({
        order: 16,
        trees: {
          index: indexTree,
          documentTerms: docTermsTree,
          documentLengths: lengthsTree
        }
      });
      await this.textIndex.open();
      this.isOpen = true;
    } catch (error) {
      if (error.code === "ENOENT" || error.message && (error.message.includes("Failed to read metadata") || error.message.includes("missing required fields") || error.message.includes("Unknown type byte") || error.message.includes("Invalid") || error.message.includes("file too small"))) {
        await this._closeSyncHandles();
        await this._deleteIndexFiles();
        await this._ensureDirectoryForFile(this.storageBasePath + "-terms.bjson");
        const indexTree = await this._createBPlusTree(this.storageBasePath + "-terms.bjson");
        const docTermsTree = await this._createBPlusTree(this.storageBasePath + "-documents.bjson");
        const lengthsTree = await this._createBPlusTree(this.storageBasePath + "-lengths.bjson");
        this.textIndex = new TextIndex({
          order: 16,
          trees: {
            index: indexTree,
            documentTerms: docTermsTree,
            documentLengths: lengthsTree
          }
        });
        await this.textIndex.open();
        this.isOpen = true;
      } else {
        throw error;
      }
    }
  }
  async _createBPlusTree(filePath) {
    const pathParts = filePath.split("/").filter(Boolean);
    const filename = pathParts.pop();
    if (!filename) {
      throw new Error(`Invalid storage path: ${filePath}`);
    }
    let dirHandle = await globalThis.navigator.storage.getDirectory();
    for (const part of pathParts) {
      dirHandle = await dirHandle.getDirectoryHandle(part, { create: true });
    }
    const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
    const syncHandle = await fileHandle.createSyncAccessHandle();
    this.syncHandles.push(syncHandle);
    return new BPlusTree(syncHandle, 16);
  }
  async _closeSyncHandles() {
    for (const handle of this.syncHandles) {
      try {
        await handle.close();
      } catch (e) {
      }
    }
    this.syncHandles = [];
  }
  async _deleteIndexFiles() {
    const suffixes = ["-terms.bjson", "-documents.bjson", "-lengths.bjson"];
    for (const suffix of suffixes) {
      await this._deleteFile(this.storageBasePath + suffix);
    }
  }
  async _deleteFile(filePath) {
    if (!filePath) return;
    try {
      const pathParts = filePath.split("/").filter(Boolean);
      const filename = pathParts.pop();
      if (!filename) {
        throw new Error(`Invalid storage path: ${filePath}`);
      }
      let dir = await globalThis.navigator.storage.getDirectory();
      for (const part of pathParts) {
        dir = await dir.getDirectoryHandle(part, { create: false });
      }
      await dir.removeEntry(filename);
    } catch (error) {
    }
  }
  async _ensureDirectoryForFile(filePath) {
    if (!filePath) return;
    const pathParts = filePath.split("/").filter(Boolean);
    pathParts.pop();
    if (pathParts.length === 0) return;
    try {
      let dir = await globalThis.navigator.storage.getDirectory();
      for (const part of pathParts) {
        dir = await dir.getDirectoryHandle(part, { create: true });
      }
    } catch (error) {
      if (error.code !== "EEXIST") {
        throw error;
      }
    }
  }
  /**
   * Close the index files
   */
  async close() {
    if (this.isOpen) {
      try {
        await this.textIndex.close();
      } catch (error) {
        if (!error.message || !error.message.includes("File is not open")) {
          throw error;
        }
      }
      this.isOpen = false;
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
  async add(doc) {
    if (!doc._id) {
      throw new Error("Document must have an _id field");
    }
    const text2 = this._extractText(doc);
    if (text2) {
      await this.textIndex.add(String(doc._id), text2);
    }
  }
  /**
   * Remove a document from the text index
   * @param {Object} doc - The document to remove
   */
  async remove(doc) {
    if (!doc._id) {
      return;
    }
    await this.textIndex.remove(String(doc._id));
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
   * @returns {Promise<Array>} Array of document IDs
   */
  async search(searchText, options = {}) {
    const results = await this.textIndex.query(searchText, { scored: false, ...options });
    return results;
  }
  /**
   * Clear all data from the index
   */
  // TODO: Recreate the index empty or delete
  async clear() {
    if (this.isOpen) {
      await this.close();
    }
    await this._deleteIndexFiles();
    await this.open();
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
  constructor(rtree, nodeData) {
    this.rtree = rtree;
    this.id = nodeData.id;
    this.isLeaf = nodeData.isLeaf;
    this.children = nodeData.children || [];
    this.bbox = nodeData.bbox;
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
      let bbox;
      if (this.isLeaf) {
        bbox = child.bbox;
      } else {
        const childNode = this.rtree._loadNode(child);
        bbox = childNode.bbox;
      }
      if (bbox) {
        minLat = Math.min(minLat, bbox.minLat);
        maxLat = Math.max(maxLat, bbox.maxLat);
        minLng = Math.min(minLng, bbox.minLng);
        maxLng = Math.max(maxLng, bbox.maxLng);
      }
    }
    this.bbox = { minLat, maxLat, minLng, maxLng };
    this.rtree._saveNode(this);
  }
  /**
   * Convert node to plain object for serialization
   */
  toJSON() {
    return {
      id: this.id,
      isLeaf: this.isLeaf,
      children: this.children,
      bbox: this.bbox
    };
  }
}
class RTree {
  constructor(syncHandle, maxEntries = 9) {
    this.file = new BJsonFile(syncHandle);
    this.maxEntries = maxEntries;
    this.minEntries = Math.max(2, Math.ceil(maxEntries / 2));
    this.rootPointer = null;
    this.nextId = 1;
    this._size = 0;
    this.isOpen = false;
  }
  /**
   * Open the R-tree (load or initialize metadata)
   */
  async open() {
    if (this.isOpen) {
      throw new Error("R-tree is already open");
    }
    const fileSize = this.file.getFileSize();
    const exists = fileSize > 0;
    if (exists) {
      this._loadFromFile();
    } else {
      this._initializeNewTree();
    }
    this.isOpen = true;
  }
  /**
   * Close the R-tree
   */
  async close() {
    if (this.isOpen) {
      this._writeMetadata();
      if (this.file && this.file.syncAccessHandle) {
        this.file.flush();
        await this.file.syncAccessHandle.close();
      }
      this.isOpen = false;
    }
  }
  /**
   * Initialize a new empty tree
   */
  _initializeNewTree() {
    const rootNode = new RTreeNode(this, {
      id: 0,
      isLeaf: true,
      children: [],
      bbox: null
    });
    this.nextId = 1;
    this._size = 0;
    this.rootPointer = this._saveNode(rootNode);
    this._writeMetadata();
  }
  /**
   * Write metadata record to file
   */
  _writeMetadata() {
    const metadata = {
      version: 1,
      maxEntries: this.maxEntries,
      minEntries: this.minEntries,
      size: this._size,
      rootPointer: this.rootPointer,
      nextId: this.nextId
    };
    this.file.append(metadata);
  }
  /**
   * Load tree from existing file
   */
  _loadFromFile() {
    const METADATA_SIZE = 135;
    const fileSize = this.file.getFileSize();
    if (fileSize < METADATA_SIZE) {
      throw new Error("Invalid R-tree file format: file too small for metadata");
    }
    const metadataOffset = fileSize - METADATA_SIZE;
    const metadata = this.file.read(metadataOffset);
    this.maxEntries = metadata.maxEntries;
    this.minEntries = metadata.minEntries;
    this._size = metadata.size;
    this.rootPointer = metadata.rootPointer;
    this.nextId = metadata.nextId;
  }
  /**
   * Save a node to disk and return its Pointer
   */
  _saveNode(node) {
    const nodeData = node.toJSON();
    const offset = this.file.getFileSize();
    this.file.append(nodeData);
    return new Pointer(offset);
  }
  /**
   * Load a node from disk by Pointer
   */
  _loadNode(pointer) {
    if (!(pointer instanceof Pointer)) {
      throw new Error("Expected Pointer object");
    }
    const offset = pointer.valueOf();
    const nodeData = this.file.read(offset);
    return new RTreeNode(this, nodeData);
  }
  /**
   * Load the root node
   */
  _loadRoot() {
    return this._loadNode(this.rootPointer);
  }
  /**
   * Insert a point into the R-tree with an ObjectId
   */
  insert(lat, lng, objectId) {
    if (!this.isOpen) {
      throw new Error("R-tree file must be opened before use");
    }
    if (!(objectId instanceof ObjectId)) {
      throw new Error("objectId must be an instance of ObjectId to insert into rtree");
    }
    const bbox = {
      minLat: lat,
      maxLat: lat,
      minLng: lng,
      maxLng: lng
    };
    const entry = { bbox, lat, lng, objectId };
    const root = this._loadRoot();
    const result = this._insert(entry, root, 1);
    if (result.split) {
      const newRoot = new RTreeNode(this, {
        id: this.nextId++,
        isLeaf: false,
        children: result.pointers,
        bbox: null
      });
      newRoot.updateBBox();
      this.rootPointer = this._saveNode(newRoot);
    } else {
      this.rootPointer = result.pointer;
    }
    this._size++;
    this._writeMetadata();
  }
  /**
   * Internal insert method - returns splitPointers if split occurred, else returns updated node pointer
   */
  _insert(entry, node, level) {
    if (node.isLeaf) {
      node.children.push(entry);
      node.updateBBox();
      if (node.children.length > this.maxEntries) {
        const [pointer1, pointer2] = this._split(node);
        return { split: true, pointers: [pointer1, pointer2] };
      }
      const pointer = this._saveNode(node);
      return { split: false, pointer };
    } else {
      const targetPointer = this._chooseSubtree(entry.bbox, node);
      const targetNode = this._loadNode(targetPointer);
      const result = this._insert(entry, targetNode, level + 1);
      if (result.split) {
        let childIndex = -1;
        for (let i = 0; i < node.children.length; i++) {
          if (node.children[i].valueOf() === targetPointer.valueOf()) {
            childIndex = i;
            break;
          }
        }
        if (childIndex !== -1) {
          node.children[childIndex] = result.pointers[0];
          node.children.push(result.pointers[1]);
        } else {
          node.children.push(result.pointers[0]);
          node.children.push(result.pointers[1]);
        }
        node.updateBBox();
        if (node.children.length > this.maxEntries) {
          const [pointer1, pointer2] = this._split(node);
          return { split: true, pointers: [pointer1, pointer2] };
        }
      } else {
        let childIndex = -1;
        for (let i = 0; i < node.children.length; i++) {
          if (node.children[i].valueOf() === targetPointer.valueOf()) {
            childIndex = i;
            break;
          }
        }
        if (childIndex !== -1) {
          node.children[childIndex] = result.pointer;
        }
        node.updateBBox();
      }
      const pointer = this._saveNode(node);
      return { split: false, pointer };
    }
  }
  /**
   * Choose the best subtree to insert an entry
   */
  _chooseSubtree(bbox, node) {
    let minEnlargement = Infinity;
    let minArea = Infinity;
    let targetPointer = null;
    for (const childPointer of node.children) {
      if (!(childPointer instanceof Pointer)) {
        throw new Error(`Expected Pointer in _chooseSubtree, got: ${typeof childPointer}`);
      }
      const childNode = this._loadNode(childPointer);
      const enl = enlargement(childNode.bbox, bbox);
      const ar = area(childNode.bbox);
      if (enl < minEnlargement || enl === minEnlargement && ar < minArea) {
        minEnlargement = enl;
        minArea = ar;
        targetPointer = childPointer;
      }
    }
    return targetPointer;
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
        let bbox1, bbox2;
        if (isLeaf) {
          bbox1 = children[i].bbox;
          bbox2 = children[j].bbox;
        } else {
          const node12 = this._loadNode(children[i]);
          const node22 = this._loadNode(children[j]);
          bbox1 = node12.bbox;
          bbox2 = node22.bbox;
        }
        const dist = area(union(bbox1, bbox2));
        if (dist > maxDist) {
          maxDist = dist;
          seed1Idx = i;
          seed2Idx = j;
        }
      }
    }
    const node1 = new RTreeNode(this, {
      id: this.nextId++,
      isLeaf,
      children: [children[seed1Idx]],
      bbox: null
    });
    const node2 = new RTreeNode(this, {
      id: this.nextId++,
      isLeaf,
      children: [children[seed2Idx]],
      bbox: null
    });
    for (let i = 0; i < children.length; i++) {
      if (i === seed1Idx || i === seed2Idx) continue;
      const child = children[i];
      let bbox;
      if (isLeaf) {
        bbox = child.bbox;
      } else {
        const childNode = this._loadNode(child);
        bbox = childNode.bbox;
      }
      node1.updateBBox();
      node2.updateBBox();
      const enl1 = node1.bbox ? enlargement(node1.bbox, bbox) : 0;
      const enl2 = node2.bbox ? enlargement(node2.bbox, bbox) : 0;
      if (enl1 < enl2) {
        node1.children.push(child);
      } else if (enl2 < enl1) {
        node2.children.push(child);
      } else {
        if (node1.children.length <= node2.children.length) {
          node1.children.push(child);
        } else {
          node2.children.push(child);
        }
      }
    }
    node1.updateBBox();
    node2.updateBBox();
    const pointer1 = this._saveNode(node1);
    const pointer2 = this._saveNode(node2);
    return [pointer1, pointer2];
  }
  /**
   * Search for points within a bounding box, returning entries with coords
   */
  searchBBox(bbox) {
    if (!this.isOpen) {
      throw new Error("R-tree file must be opened before use");
    }
    const results = [];
    const root = this._loadRoot();
    this._searchBBox(bbox, root, results);
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
          results.push({
            objectId: entry.objectId,
            lat: entry.lat,
            lng: entry.lng
          });
        }
      }
    } else {
      for (const childPointer of node.children) {
        const childNode = this._loadNode(childPointer);
        this._searchBBox(bbox, childNode, results);
      }
    }
  }
  /**
   * Search for points within a radius of a location, returning ObjectIds with distances
   */
  searchRadius(lat, lng, radiusKm) {
    const bbox = radiusToBoundingBox(lat, lng, radiusKm);
    const root = this._loadRoot();
    const entries = [];
    this._searchBBoxEntries(bbox, root, entries);
    const results = [];
    for (const entry of entries) {
      const dist = haversineDistance(lat, lng, entry.lat, entry.lng);
      if (dist <= radiusKm) {
        results.push({
          objectId: entry.objectId,
          lat: entry.lat,
          lng: entry.lng,
          distance: dist
        });
      }
    }
    return results;
  }
  /**
   * Internal bounding box search that returns full entries (used by radius search)
   */
  _searchBBoxEntries(bbox, node, results) {
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
      for (const childPointer of node.children) {
        const childNode = this._loadNode(childPointer);
        this._searchBBoxEntries(bbox, childNode, results);
      }
    }
  }
  /**
   * Remove an entry from the R-tree by ObjectId
   */
  remove(objectId) {
    if (!this.isOpen) {
      throw new Error("R-tree file must be opened before use");
    }
    if (!(objectId instanceof ObjectId)) {
      throw new Error("objectId must be an instance of ObjectId to remove from rtree");
    }
    const root = this._loadRoot();
    const result = this._remove(objectId, root);
    if (!result.found) {
      return false;
    }
    if (result.underflow && result.children) {
      if (result.children.length === 0) {
        const newRoot = new RTreeNode(this, {
          id: this.nextId++,
          isLeaf: true,
          children: [],
          bbox: null
        });
        this.rootPointer = this._saveNode(newRoot);
      } else if (result.children.length === 1 && !result.isLeaf) {
        this.rootPointer = result.children[0];
      } else {
        const newRoot = new RTreeNode(this, {
          id: root.id,
          isLeaf: result.isLeaf,
          children: result.children,
          bbox: null
        });
        newRoot.updateBBox();
        this.rootPointer = this._saveNode(newRoot);
      }
    } else if (result.pointer) {
      this.rootPointer = result.pointer;
    }
    this._size--;
    this._writeMetadata();
    return true;
  }
  /**
   * Internal remove method
   * Returns: { found: boolean, underflow: boolean, pointer: Pointer, children: Array, isLeaf: boolean }
   */
  _remove(objectId, node) {
    if (node.isLeaf) {
      const initialLength = node.children.length;
      node.children = node.children.filter(
        (entry) => !entry.objectId.equals(objectId)
      );
      if (node.children.length === initialLength) {
        return { found: false };
      }
      node.updateBBox();
      const pointer = this._saveNode(node);
      const underflow = node.children.length < this.minEntries && node.children.length > 0;
      return {
        found: true,
        underflow,
        pointer,
        children: node.children,
        isLeaf: true
      };
    } else {
      let updatedChildren = [...node.children];
      for (let i = 0; i < updatedChildren.length; i++) {
        const childPointer = updatedChildren[i];
        const childNode = this._loadNode(childPointer);
        const result = this._remove(objectId, childNode);
        if (result.found) {
          if (result.underflow) {
            const handled = this._handleUnderflow(node, i, childNode, result);
            if (handled.merged) {
              updatedChildren = handled.children;
            } else {
              updatedChildren[i] = result.pointer;
            }
          } else {
            updatedChildren[i] = result.pointer;
          }
          const updatedNode = new RTreeNode(this, {
            id: node.id,
            isLeaf: false,
            children: updatedChildren,
            bbox: null
          });
          updatedNode.updateBBox();
          const pointer = this._saveNode(updatedNode);
          const underflow = updatedChildren.length < this.minEntries && updatedChildren.length > 0;
          return {
            found: true,
            underflow,
            pointer,
            children: updatedChildren,
            isLeaf: false
          };
        }
      }
      return { found: false };
    }
  }
  /**
   * Handle underflow in a child node by merging or redistributing
   */
  _handleUnderflow(parentNode, childIndex, childNode, childResult) {
    const siblings = [];
    if (childIndex > 0) {
      const prevPointer = parentNode.children[childIndex - 1];
      const prevNode = this._loadNode(prevPointer);
      siblings.push({ index: childIndex - 1, node: prevNode, pointer: prevPointer });
    }
    if (childIndex < parentNode.children.length - 1) {
      const nextPointer = parentNode.children[childIndex + 1];
      const nextNode = this._loadNode(nextPointer);
      siblings.push({ index: childIndex + 1, node: nextNode, pointer: nextPointer });
    }
    for (const sibling of siblings) {
      if (sibling.node.children.length > this.minEntries) {
        const allChildren = [
          ...childResult.children,
          ...sibling.node.children
        ];
        const mid = Math.ceil(allChildren.length / 2);
        const newChild1Children = allChildren.slice(0, mid);
        const newChild2Children = allChildren.slice(mid);
        const newChild1 = new RTreeNode(this, {
          id: childNode.id,
          isLeaf: childResult.isLeaf,
          children: newChild1Children,
          bbox: null
        });
        newChild1.updateBBox();
        const newChild2 = new RTreeNode(this, {
          id: sibling.node.id,
          isLeaf: sibling.node.isLeaf,
          children: newChild2Children,
          bbox: null
        });
        newChild2.updateBBox();
        const pointer1 = this._saveNode(newChild1);
        const pointer2 = this._saveNode(newChild2);
        const newChildren = [...parentNode.children];
        const minIndex = Math.min(childIndex, sibling.index);
        const maxIndex = Math.max(childIndex, sibling.index);
        newChildren[minIndex] = pointer1;
        newChildren[maxIndex] = pointer2;
        return { merged: true, children: newChildren };
      }
    }
    if (siblings.length > 0) {
      const sibling = siblings[0];
      const mergedChildren = [
        ...childResult.children,
        ...sibling.node.children
      ];
      const mergedNode = new RTreeNode(this, {
        id: this.nextId++,
        isLeaf: childResult.isLeaf,
        children: mergedChildren,
        bbox: null
      });
      mergedNode.updateBBox();
      const mergedPointer = this._saveNode(mergedNode);
      const newChildren = parentNode.children.filter(
        (_, i) => i !== childIndex && i !== sibling.index
      );
      newChildren.push(mergedPointer);
      return { merged: true, children: newChildren };
    }
    return { merged: false };
  }
  /**
   * Get the number of entries in the tree
   */
  size() {
    return this._size;
  }
  /**
   * Clear all entries from the tree by appending a new empty root node
   * Preserves the append-only file structure
   */
  async clear() {
    const newRoot = new RTreeNode(this, {
      id: this.nextId++,
      isLeaf: true,
      children: [],
      bbox: null
    });
    this.rootPointer = this._saveNode(newRoot);
    this._size = 0;
    this._writeMetadata();
  }
  /**
   * Compact the R-tree by copying the current root and all reachable nodes into a new file.
   * Returns size metrics to show reclaimed space.
   * @param {FileSystemSyncAccessHandle} destSyncHandle - Sync handle for destination file
   */
  async compact(destSyncHandle) {
    if (!this.isOpen) {
      throw new Error("R-tree file must be opened before use");
    }
    if (!destSyncHandle) {
      throw new Error("Destination sync handle is required for compaction");
    }
    this._writeMetadata();
    const oldSize = this.file.getFileSize();
    const dest = new RTree(destSyncHandle, this.maxEntries);
    await dest.open();
    dest.minEntries = this.minEntries;
    dest.nextId = this.nextId;
    dest._size = this._size;
    const pointerMap = /* @__PURE__ */ new Map();
    const cloneNode = (pointer) => {
      const offset = pointer.valueOf();
      if (pointerMap.has(offset)) {
        return pointerMap.get(offset);
      }
      const sourceNode = this._loadNode(pointer);
      const clonedChildren = [];
      if (sourceNode.isLeaf) {
        for (const child of sourceNode.children) {
          clonedChildren.push(child);
        }
      } else {
        for (const childPointer of sourceNode.children) {
          const newChildPtr = cloneNode(childPointer);
          clonedChildren.push(newChildPtr);
        }
      }
      const clonedNode = new RTreeNode(dest, {
        id: sourceNode.id,
        isLeaf: sourceNode.isLeaf,
        children: clonedChildren,
        bbox: sourceNode.bbox
      });
      const newPointer = dest._saveNode(clonedNode);
      pointerMap.set(offset, newPointer);
      return newPointer;
    };
    const newRootPointer = cloneNode(this.rootPointer);
    dest.rootPointer = newRootPointer;
    dest._writeMetadata();
    const newSize = dest.file.getFileSize();
    await dest.close();
    return {
      oldSize,
      newSize,
      bytesSaved: Math.max(0, oldSize - newSize)
    };
  }
}
class GeospatialIndex extends Index {
  constructor(indexName, keys, storageFile, options = {}) {
    super(indexName, keys, storageFile, options);
    this.geoField = Object.keys(keys)[0];
    this.storageFilePath = storageFile;
    this.rtree = null;
    this.syncHandle = null;
    this.isOpen = false;
  }
  /**
   * Open the index file
   * Must be called before using the index
   */
  async open() {
    if (this.isOpen) {
      return;
    }
    try {
      const pathParts = this.storageFilePath.split("/").filter(Boolean);
      const filename = pathParts.pop();
      if (!filename) {
        throw new Error(`Invalid storage path: ${this.storageFilePath}`);
      }
      let dirHandle = await globalThis.navigator.storage.getDirectory();
      for (const part of pathParts) {
        dirHandle = await dirHandle.getDirectoryHandle(part, { create: true });
      }
      const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
      this.syncHandle = await fileHandle.createSyncAccessHandle();
      this.rtree = new RTree(this.syncHandle, 9);
      await this.rtree.open();
      this.isOpen = true;
    } catch (error) {
      if (error.code === "ENOENT" || error.message && (error.message.includes("Invalid R-tree") || error.message.includes("file too small") || error.message.includes("Failed to read metadata") || error.message.includes("Unknown type byte"))) {
        if (this.syncHandle) {
          try {
            await this.syncHandle.close();
          } catch (e) {
          }
          this.syncHandle = null;
        }
        const pathParts = this.storageFilePath.split("/").filter(Boolean);
        const filename = pathParts.pop();
        if (!filename) {
          throw new Error(`Invalid storage path: ${this.storageFilePath}`);
        }
        let dirHandle = await globalThis.navigator.storage.getDirectory();
        for (const part of pathParts) {
          dirHandle = await dirHandle.getDirectoryHandle(part, { create: true });
        }
        try {
          await dirHandle.removeEntry(filename);
        } catch (e) {
        }
        const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
        this.syncHandle = await fileHandle.createSyncAccessHandle();
        this.rtree = new RTree(this.syncHandle, 9);
        await this.rtree.open();
        this.isOpen = true;
      } else {
        throw error;
      }
    }
  }
  /**
   * Close the index file
   */
  async close() {
    if (this.isOpen) {
      try {
        await this.rtree.close();
      } catch (error) {
        if (!error.message || !error.message.includes("File is not open")) {
          throw error;
        }
      }
      this.isOpen = false;
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
  async add(doc) {
    if (!doc._id) {
      throw new Error("Document must have an _id field");
    }
    const geoValue = getProp(doc, this.geoField);
    const coords = this._extractCoordinates(geoValue);
    if (coords) {
      await this.rtree.insert(coords.lat, coords.lng, doc._id);
    }
  }
  /**
   * Remove a document from the geospatial index
   * @param {Object} doc - The document to remove
   */
  async remove(doc) {
    if (!doc._id) {
      return;
    }
    if (!(doc._id instanceof ObjectId)) {
      console.error(doc);
      throw new Error("Document _id must be an ObjectId to remove from geospatial index");
    }
    await this.rtree.remove(doc._id);
  }
  /**
   * Query the geospatial index
   * @param {*} query - The query object
   * @returns {Promise<Array|null>} Array of document IDs or null if query is not a geospatial query
   */
  async query(query) {
    if (!this.isOpen) {
      await this.open();
    }
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
        const results = await this.rtree.searchBBox({
          minLat,
          maxLat,
          minLng: minLon,
          maxLng: maxLon
        });
        return results.map((entry) => entry.objectId.toString());
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
      const results = await this.rtree.searchRadius(lat, lng, maxDistanceKm);
      results.sort((a, b) => a.distance - b.distance);
      return results.map((entry) => entry.objectId.toString());
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
      const results = await this.rtree.searchRadius(lat, lng, maxDistanceKm);
      results.sort((a, b) => a.distance - b.distance);
      return results.map((entry) => entry.objectId.toString());
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
        const results = await this.rtree.searchBBox({
          minLat: lat - epsilon,
          maxLat: lat + epsilon,
          minLng: lng - epsilon,
          maxLng: lng + epsilon
        });
        return results.map((entry) => entry.objectId.toString());
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
        const candidates = await this.rtree.searchBBox({
          minLat,
          maxLat,
          minLng,
          maxLng
        });
        const results = candidates.filter((entry) => this._pointInPolygon(entry.lat, entry.lng, ring));
        return results.map((entry) => entry.objectId.toString());
      }
      return null;
    }
    return null;
  }
  // /**
  //  * Calculate distance between two points using Haversine formula
  //  * @param {number} lat1 - Latitude of first point
  //  * @param {number} lng1 - Longitude of first point
  //  * @param {number} lat2 - Latitude of second point
  //  * @param {number} lng2 - Longitude of second point
  //  * @returns {number} Distance in kilometers
  //  */
  // _haversineDistance(lat1, lng1, lat2, lng2) {
  // 	const R = 6371; // Earth's radius in kilometers
  // 	const dLat = (lat2 - lat1) * Math.PI / 180;
  // 	const dLng = (lng2 - lng1) * Math.PI / 180;
  // 	const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
  // 		Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
  // 		Math.sin(dLng / 2) * Math.sin(dLng / 2);
  // 	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // 	return R * c;
  // }
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
  // TODO: dont' delete the file or just clear the RTree contents
  async clear() {
    await this.close();
    try {
      const pathParts = this.storageFilePath.split("/").filter(Boolean);
      const filename = pathParts.pop();
      let dirHandle = await globalThis.navigator.storage.getDirectory();
      for (const part of pathParts) {
        dirHandle = await dirHandle.getDirectoryHandle(part, { create: false });
      }
      await dirHandle.removeEntry(filename);
    } catch (err) {
      if (!err || err.name !== "NotFoundError") {
        throw err;
      }
    }
    await this.open();
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
          plan.indexScans = [{ indexName, index, textQuery }];
          plan.estimatedCost = 100;
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
      if (index instanceof GeospatialIndex) {
        const plan = new QueryPlan();
        plan.type = "index_scan";
        plan.indexes = [indexName];
        plan.indexScans = [{ indexName, index, query }];
        plan.estimatedCost = 100;
        plan.indexOnly = true;
        return plan;
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
      plan.estimatedCost = 50;
      return plan;
    }
    if (indexableConditions.length === 1) {
      plan.type = "index_scan";
      plan.indexScans = [indexableConditions[0]];
      plan.indexes = [indexableConditions[0].indexName];
      plan.estimatedCost = 50;
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
      plan.estimatedCost = 100 * indexableConditions.length;
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
      if (index instanceof TextCollectionIndex || index instanceof GeospatialIndex) {
        continue;
      }
      if (this._canIndexHandleQuery(index, query)) {
        plan.type = "index_scan";
        plan.indexes = [indexName];
        plan.indexScans = [{ indexName, index, query }];
        plan.estimatedCost = 50;
        return plan;
      }
    }
    return plan;
  }
  /**
   * Execute a single index scan that was deferred from planning
   * @private
   */
  async _executeIndexScan(scan) {
    const { index, query, textQuery } = scan;
    if (typeof index.open === "function" && typeof index.isOpen !== "undefined" && !index.isOpen) {
      await index.open();
    }
    if (textQuery !== void 0) {
      return await index.search(textQuery);
    }
    if (query !== void 0) {
      const docIds = await index.query(query);
      return docIds !== null ? docIds : [];
    }
    if (scan.docIds !== void 0) {
      return scan.docIds;
    }
    return [];
  }
  /**
   * Check if an index can handle a query (without executing it)
   * @private
   */
  _canIndexHandleQuery(index, query) {
    const queryKeys = Object.keys(query);
    const indexFields = Object.keys(index.keys);
    if (indexFields.length !== 1) {
      return false;
    }
    const field = indexFields[0];
    if (queryKeys.indexOf(field) === -1) {
      return false;
    }
    return true;
  }
  /**
   * Execute a query plan and return document IDs
   * @param {QueryPlan} plan - The execution plan
   * @returns {Promise<Array|null>} Array of document IDs or null for full scan
   */
  async execute(plan) {
    if (plan.type === "full_scan") {
      return null;
    }
    if (plan.type === "index_scan") {
      const scan = plan.indexScans[0];
      return await this._executeIndexScan(scan);
    }
    if (plan.type === "index_intersection") {
      if (plan.indexScans.length === 0) return null;
      const results = [];
      for (const scan of plan.indexScans) {
        results.push({
          docIds: await this._executeIndexScan(scan),
          indexName: scan.indexName
        });
      }
      const sorted = results.slice().sort((a, b) => a.docIds.length - b.docIds.length);
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
        const docIds = await this._executeIndexScan(scan);
        docIds.forEach((id) => result.add(id));
      }
      return Array.from(result);
    }
    return null;
  }
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
  constructor(db, name, options = {}) {
    super();
    this.db = db;
    this.name = name;
    this.path = `${this.db.baseFolder}/${this.db.dbName}/${this.name}`;
    this.documentsPath = `${this.path}/documents.bjson`;
    this.order = options.bPlusTreeOrder || 50;
    this.documents = null;
    this.indexes = /* @__PURE__ */ new Map();
    this._initialized = false;
    this.isCollection = true;
    this.queryPlanner = new QueryPlanner(this.indexes);
  }
  async _initialize() {
    if (this._initialized) return;
    if (!globalThis.navigator || !globalThis.navigator.storage || typeof globalThis.navigator.storage.getDirectory !== "function") {
      throw new Error("OPFS not available: navigator.storage.getDirectory is missing");
    }
    let dirHandle = await this._ensureDirectoryForFile(this.documentsPath);
    if (!dirHandle) {
      dirHandle = await globalThis.navigator.storage.getDirectory();
    }
    const pathParts = this.documentsPath.split("/").filter(Boolean);
    const filename = pathParts[pathParts.length - 1];
    if (!filename) {
      throw new Error(`Invalid documents path: ${this.documentsPath}`);
    }
    const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
    const syncHandle = await fileHandle.createSyncAccessHandle();
    this.documents = new BPlusTree(syncHandle, this.order);
    await this.documents.open();
    await this._loadIndexes();
    this._initialized = true;
  }
  async _ensureDirectoryForFile(filePath) {
    if (!filePath) return;
    const pathParts = filePath.split("/").filter(Boolean);
    pathParts.pop();
    if (pathParts.length === 0) return;
    try {
      let dir = await globalThis.navigator.storage.getDirectory();
      for (const part of pathParts) {
        dir = await dir.getDirectoryHandle(part, { create: true });
      }
      return dir;
    } catch (error) {
      if (error.code !== "EEXIST") {
        throw error;
      }
    }
  }
  async _loadIndexes() {
    let dirHandle;
    try {
      const parts = this.path.split("/").filter(Boolean);
      let handle = await globalThis.navigator.storage.getDirectory();
      for (const part of parts) {
        handle = await handle.getDirectoryHandle(part, { create: false });
      }
      dirHandle = handle;
    } catch (err) {
      if (err?.name === "NotFoundError" || err?.code === "ENOENT") {
        return;
      }
      throw err;
    }
    for await (const [entryName, entryHandle] of dirHandle.entries()) {
      if (entryHandle.kind !== "file") continue;
      let type;
      if (entryName.endsWith(".textindex-documents.bjson")) {
        type = "text";
      } else if (entryName.endsWith(".rtree.bjson")) {
        type = "geospatial";
      } else if (entryName.endsWith(".bplustree.bjson")) {
        type = "regular";
      } else {
        continue;
      }
      const indexName = entryName.replace(/\.textindex-documents\.bjson$/, "").replace(/\.rtree\.bjson$/, "").replace(/\.bplustree\.bjson$/, "");
      if (this.indexes.has(indexName)) continue;
      const keys = this._parseIndexName(indexName, type);
      if (!keys) {
        continue;
      }
      let index;
      if (type === "text") {
        const storageFile = await this._getIndexPath(indexName, type);
        index = new TextCollectionIndex(indexName, keys, storageFile, {});
      } else if (type === "geospatial") {
        const storageFile = await this._getIndexPath(indexName, type);
        index = new GeospatialIndex(indexName, keys, storageFile, {});
      } else {
        const storageFile = await this._getIndexPath(indexName, type);
        index = new RegularCollectionIndex(indexName, keys, storageFile, {});
      }
      try {
        await index.open();
        this.indexes.set(indexName, index);
      } catch (err) {
        console.warn(`Failed to open index ${indexName}:`, err);
      }
    }
  }
  _parseIndexName(indexName, type) {
    const tokens = indexName.split("_");
    if (tokens.length < 2 || tokens.length % 2 !== 0) return null;
    const keys = {};
    for (let i = 0; i < tokens.length; i += 2) {
      const field = tokens[i];
      const dir = tokens[i + 1];
      if (!field || dir === void 0) return null;
      if (type === "text" || dir === "text") {
        keys[field] = "text";
      } else if (type === "geospatial" || dir === "2dsphere" || dir === "2d") {
        keys[field] = dir === "2d" ? "2d" : "2dsphere";
      } else {
        const num = Number(dir);
        if (Number.isNaN(num) || num !== 1 && num !== -1) {
          return null;
        }
        keys[field] = num;
      }
    }
    return keys;
  }
  /**
   * Close all indexes
   */
  async close() {
    if (!this._initialized) return;
    await this.documents.close();
    for (const [indexName, index] of this.indexes) {
      await index.close();
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
  async _getIndexPath(indexName, type) {
    const sanitize = (value) => String(value).replace(/[^a-zA-Z0-9_-]/g, "_");
    const sanitizedIndexName = sanitize(indexName);
    if (type === "text") {
      return `${this.path}/${sanitizedIndexName}.textindex`;
    }
    if (type === "geospatial") {
      return `${this.path}/${sanitizedIndexName}.rtree.bjson`;
    }
    return `${this.path}/${sanitizedIndexName}.bplustree.bjson`;
  }
  /**
   * Build/rebuild an index
   */
  async _buildIndex(indexName, keys, options = {}) {
    if (!this._initialized) await this._initialize();
    let index;
    let storageFile;
    let type;
    if (this.isTextIndex(keys)) {
      type = "text";
      storageFile = await this._getIndexPath(indexName, type);
      index = new TextCollectionIndex(indexName, keys, storageFile, options);
    } else if (this.isGeospatialIndex(keys)) {
      type = "geospatial";
      storageFile = await this._getIndexPath(indexName, type);
      index = new GeospatialIndex(indexName, keys, storageFile, options);
    } else {
      type = "regular";
      storageFile = await this._getIndexPath(indexName, type);
      index = new RegularCollectionIndex(indexName, keys, storageFile, options);
    }
    await index.open();
    if (typeof index.clear === "function") {
      await index.clear();
    }
    for await (const entry of this.documents) {
      if (entry && entry.value) {
        await index.add(entry.value);
      }
    }
    this.indexes.set(indexName, index);
    return index;
  }
  /**
   * Update indexes when a document is inserted
   */
  async updateIndexesOnInsert(doc) {
    const promises = [];
    for (const [indexName, index] of this.indexes) {
      promises.push((async () => {
        await this._ensureIndexOpen(index);
        await index.add(doc);
      })());
    }
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }
  /**
   * Update indexes when a document is deleted
   */
  async updateIndexesOnDelete(doc) {
    const promises = [];
    for (const [indexName, index] of this.indexes) {
      promises.push((async () => {
        await this._ensureIndexOpen(index);
        await index.remove(doc);
      })());
    }
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }
  /**
   * Ensure an index is open before using it
   * @private
   */
  async _ensureIndexOpen(index) {
    if (index && typeof index.open === "function" && !index.isOpen) {
      await index.open();
    }
  }
  /**
   * Query planner - analyze query and determine optimal execution plan
   */
  planQuery(query) {
    const plan = this.queryPlanner.plan(query);
    return {
      useIndex: plan.type !== "full_scan",
      planType: plan.type,
      indexNames: plan.indexes,
      docIds: null,
      // Force full scan for now - use planQueryAsync for index results
      estimatedCost: plan.estimatedCost,
      indexOnly: plan.indexOnly || false
    };
  }
  /**
   * Async version of query planner - for use with async indexes
   */
  async planQueryAsync(query) {
    const plan = this.queryPlanner.plan(query);
    const docIds = await this.queryPlanner.execute(plan);
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
  async aggregate(pipeline) {
    if (!pipeline || !isArray(pipeline)) {
      throw new QueryError("Pipeline must be an array", {
        collection: this.name,
        code: ErrorCodes.FAILED_TO_PARSE
      });
    }
    let results = [];
    const cursor = this.find({});
    await cursor._ensureInitialized();
    while (await cursor.hasNext()) {
      results.push(await cursor.next());
    }
    for (let i = 0; i < pipeline.length; i++) {
      const stage = pipeline[i];
      const stageKeys = Object.keys(stage);
      if (stageKeys.length !== 1) {
        throw new QueryError("Each pipeline stage must have exactly one key", {
          collection: this.name,
          code: ErrorCodes.FAILED_TO_PARSE
        });
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
      } else if (stageType === "$sortByCount") {
        const groups = {};
        for (let j = 0; j < results.length; j++) {
          const doc = results[j];
          const value = evaluateExpression(stageSpec, doc);
          const key = JSON.stringify(value);
          if (!groups[key]) {
            groups[key] = {
              _id: value,
              count: 0
            };
          }
          groups[key].count++;
        }
        results = Object.values(groups).sort((a, b) => b.count - a.count);
      } else if (stageType === "$replaceRoot" || stageType === "$replaceWith") {
        const modified = [];
        const newRootSpec = stageType === "$replaceRoot" ? stageSpec.newRoot : stageSpec;
        for (let j = 0; j < results.length; j++) {
          const newRoot = evaluateExpression(newRootSpec, results[j]);
          if (typeof newRoot === "object" && newRoot !== null && !Array.isArray(newRoot)) {
            modified.push(newRoot);
          } else {
            throw new QueryError("$replaceRoot expression must evaluate to an object", {
              collection: this.name,
              code: ErrorCodes.FAILED_TO_PARSE
            });
          }
        }
        results = modified;
      } else if (stageType === "$sample") {
        const size = stageSpec.size || 1;
        if (typeof size !== "number" || size < 0) {
          throw new QueryError("$sample size must be a non-negative number", {
            collection: this.name,
            code: ErrorCodes.FAILED_TO_PARSE
          });
        }
        const shuffled = [...results];
        for (let j = shuffled.length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1));
          [shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]];
        }
        results = shuffled.slice(0, Math.min(size, shuffled.length));
      } else if (stageType === "$bucket") {
        if (!stageSpec.groupBy || !stageSpec.boundaries) {
          throw new QueryError("$bucket requires groupBy and boundaries", {
            collection: this.name,
            code: ErrorCodes.FAILED_TO_PARSE
          });
        }
        const boundaries = stageSpec.boundaries;
        const defaultBucket = stageSpec.default;
        const output = stageSpec.output || { count: { $sum: 1 } };
        const buckets = {};
        for (let j = 0; j < boundaries.length - 1; j++) {
          const key = JSON.stringify(boundaries[j]);
          buckets[key] = {
            _id: boundaries[j],
            docs: []
          };
        }
        if (defaultBucket !== void 0) {
          buckets["default"] = {
            _id: defaultBucket,
            docs: []
          };
        }
        for (let j = 0; j < results.length; j++) {
          const doc = results[j];
          const value = evaluateExpression(stageSpec.groupBy, doc);
          let placed = false;
          for (let k = 0; k < boundaries.length - 1; k++) {
            if (value >= boundaries[k] && value < boundaries[k + 1]) {
              const key = JSON.stringify(boundaries[k]);
              buckets[key].docs.push(doc);
              placed = true;
              break;
            }
          }
          if (!placed && defaultBucket !== void 0) {
            buckets["default"].docs.push(doc);
          }
        }
        const bucketed = [];
        for (const bucketKey in buckets) {
          const bucket = buckets[bucketKey];
          if (bucket.docs.length === 0) continue;
          const result = { _id: bucket._id };
          for (const field in output) {
            const accumulator = output[field];
            const accKeys = Object.keys(accumulator);
            if (accKeys.length !== 1) continue;
            const accType = accKeys[0];
            const accExpr = accumulator[accType];
            if (accType === "$sum") {
              let sum = 0;
              for (let k = 0; k < bucket.docs.length; k++) {
                const val = evaluateExpression(accExpr, bucket.docs[k]);
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
              for (let k = 0; k < bucket.docs.length; k++) {
                const val = evaluateExpression(accExpr, bucket.docs[k]);
                if (val !== void 0 && val !== null) {
                  sum += Number(val) || 0;
                  count++;
                }
              }
              result[field] = count > 0 ? sum / count : 0;
            } else if (accType === "$push") {
              const arr = [];
              for (let k = 0; k < bucket.docs.length; k++) {
                const val = evaluateExpression(accExpr, bucket.docs[k]);
                arr.push(val);
              }
              result[field] = arr;
            } else if (accType === "$addToSet") {
              const set = {};
              for (let k = 0; k < bucket.docs.length; k++) {
                const val = evaluateExpression(accExpr, bucket.docs[k]);
                set[JSON.stringify(val)] = val;
              }
              result[field] = Object.values(set);
            }
          }
          bucketed.push(result);
        }
        results = bucketed.sort((a, b) => {
          if (a._id < b._id) return -1;
          if (a._id > b._id) return 1;
          return 0;
        });
      } else if (stageType === "$bucketAuto") {
        if (!stageSpec.groupBy || !stageSpec.buckets) {
          throw new QueryError("$bucketAuto requires groupBy and buckets", {
            collection: this.name,
            code: ErrorCodes.FAILED_TO_PARSE
          });
        }
        const numBuckets = stageSpec.buckets;
        const output = stageSpec.output || { count: { $sum: 1 } };
        if (results.length === 0) {
          results = [];
        } else {
          const values = results.map((doc) => ({
            value: evaluateExpression(stageSpec.groupBy, doc),
            doc
          })).sort((a, b) => {
            if (a.value < b.value) return -1;
            if (a.value > b.value) return 1;
            return 0;
          });
          const bucketSize = Math.ceil(values.length / numBuckets);
          const buckets = [];
          for (let j = 0; j < numBuckets && j * bucketSize < values.length; j++) {
            const startIdx = j * bucketSize;
            const endIdx = Math.min((j + 1) * bucketSize, values.length);
            const bucketDocs = values.slice(startIdx, endIdx);
            if (bucketDocs.length === 0) continue;
            const bucket = {
              _id: {
                min: bucketDocs[0].value,
                max: endIdx < values.length ? bucketDocs[bucketDocs.length - 1].value : bucketDocs[bucketDocs.length - 1].value
              },
              docs: bucketDocs.map((v) => v.doc)
            };
            buckets.push(bucket);
          }
          const bucketed = [];
          for (let j = 0; j < buckets.length; j++) {
            const bucket = buckets[j];
            const result = { _id: bucket._id };
            for (const field in output) {
              const accumulator = output[field];
              const accKeys = Object.keys(accumulator);
              if (accKeys.length !== 1) continue;
              const accType = accKeys[0];
              const accExpr = accumulator[accType];
              if (accType === "$sum") {
                let sum = 0;
                for (let k = 0; k < bucket.docs.length; k++) {
                  const val = evaluateExpression(accExpr, bucket.docs[k]);
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
                for (let k = 0; k < bucket.docs.length; k++) {
                  const val = evaluateExpression(accExpr, bucket.docs[k]);
                  if (val !== void 0 && val !== null) {
                    sum += Number(val) || 0;
                    count++;
                  }
                }
                result[field] = count > 0 ? sum / count : 0;
              } else if (accType === "$push") {
                const arr = [];
                for (let k = 0; k < bucket.docs.length; k++) {
                  const val = evaluateExpression(accExpr, bucket.docs[k]);
                  arr.push(val);
                }
                result[field] = arr;
              }
            }
            bucketed.push(result);
          }
          results = bucketed;
        }
      } else if (stageType === "$out") {
        const targetCollectionName = stageSpec;
        if (typeof targetCollectionName !== "string") {
          throw new QueryError("$out requires a string collection name", {
            collection: this.name,
            code: ErrorCodes.FAILED_TO_PARSE
          });
        }
        if (this.db.collections.has(targetCollectionName)) {
          await this.db.dropCollection(targetCollectionName);
        }
        const targetCollection = this.db[targetCollectionName];
        for (let j = 0; j < results.length; j++) {
          const doc = results[j];
          const docId = doc._id;
          typeof docId === "object" && docId.toString ? docId.toString() : String(docId);
          await targetCollection.insertOne(doc);
        }
        results = [];
      } else if (stageType === "$merge") {
        let targetCollectionName;
        let on = "_id";
        let whenMatched = "merge";
        let whenNotMatched = "insert";
        if (typeof stageSpec === "string") {
          targetCollectionName = stageSpec;
        } else if (typeof stageSpec === "object") {
          targetCollectionName = stageSpec.into;
          on = stageSpec.on || on;
          whenMatched = stageSpec.whenMatched || whenMatched;
          whenNotMatched = stageSpec.whenNotMatched || whenNotMatched;
        }
        if (!targetCollectionName) {
          throw new QueryError("$merge requires a target collection", {
            collection: this.name,
            code: ErrorCodes.FAILED_TO_PARSE
          });
        }
        const targetCollection = this.db[targetCollectionName];
        for (let j = 0; j < results.length; j++) {
          const doc = results[j];
          const matchField = typeof on === "string" ? on : on[0];
          const matchValue = getProp(doc, matchField);
          const existingCursor = targetCollection.find({ [matchField]: matchValue });
          await existingCursor._ensureInitialized();
          const existing = await existingCursor.hasNext() ? await existingCursor.next() : null;
          if (existing) {
            if (whenMatched === "replace") {
              await targetCollection.replaceOne({ _id: existing._id }, doc);
            } else if (whenMatched === "merge") {
              const merged = Object.assign({}, existing, doc);
              await targetCollection.replaceOne({ _id: existing._id }, merged);
            } else if (whenMatched === "keepExisting") ;
            else if (whenMatched === "fail") {
              throw new QueryError("$merge failed: duplicate key", {
                collection: this.name,
                code: ErrorCodes.DUPLICATE_KEY
              });
            }
          } else {
            if (whenNotMatched === "insert") {
              await targetCollection.insertOne(doc);
            } else if (whenNotMatched === "discard") ;
            else if (whenNotMatched === "fail") {
              throw new QueryError("$merge failed: document not found", {
                collection: this.name,
                code: ErrorCodes.FAILED_TO_PARSE
              });
            }
          }
        }
        results = [];
      } else if (stageType === "$lookup") {
        if (!stageSpec.from || !stageSpec.localField || !stageSpec.foreignField || !stageSpec.as) {
          throw new QueryError("$lookup requires from, localField, foreignField, and as", {
            collection: this.name,
            code: ErrorCodes.FAILED_TO_PARSE
          });
        }
        const collectionNames = this.db.getCollectionNames();
        if (!collectionNames.includes(stageSpec.from)) {
          throw new QueryError("$lookup: collection not found: " + stageSpec.from, {
            collection: this.name,
            code: ErrorCodes.NAMESPACE_NOT_FOUND
          });
        }
        const fromCollection = this.db[stageSpec.from];
        const joined = [];
        for (let j = 0; j < results.length; j++) {
          const doc = copy(results[j]);
          const localValue = getProp(doc, stageSpec.localField);
          const matches2 = [];
          const foreignCursor = fromCollection.find({ [stageSpec.foreignField]: localValue });
          await foreignCursor._ensureInitialized();
          while (await foreignCursor.hasNext()) {
            matches2.push(await foreignCursor.next());
          }
          doc[stageSpec.as] = matches2;
          joined.push(doc);
        }
        results = joined;
      } else if (stageType === "$graphLookup") {
        if (!stageSpec.from || !stageSpec.startWith || !stageSpec.connectFromField || !stageSpec.connectToField || !stageSpec.as) {
          throw new QueryError("$graphLookup requires from, startWith, connectFromField, connectToField, and as", {
            collection: this.name,
            code: ErrorCodes.FAILED_TO_PARSE
          });
        }
        const collectionNames = this.db.getCollectionNames();
        if (!collectionNames.includes(stageSpec.from)) {
          throw new QueryError("$graphLookup: collection not found: " + stageSpec.from, {
            collection: this.name,
            code: ErrorCodes.NAMESPACE_NOT_FOUND
          });
        }
        const fromCollection = this.db[stageSpec.from];
        const maxDepth = stageSpec.maxDepth !== void 0 ? stageSpec.maxDepth : Number.MAX_SAFE_INTEGER;
        const depthField = stageSpec.depthField;
        const restrictSearchWithMatch = stageSpec.restrictSearchWithMatch;
        const graphed = [];
        for (let j = 0; j < results.length; j++) {
          const doc = copy(results[j]);
          const startValue = evaluateExpression(stageSpec.startWith, results[j]);
          const visited = /* @__PURE__ */ new Set();
          const matches2 = [];
          const queue = [{ value: startValue, depth: 0 }];
          while (queue.length > 0) {
            const { value, depth } = queue.shift();
            if (depth > maxDepth) continue;
            const valueKey = JSON.stringify(value);
            if (visited.has(valueKey)) continue;
            visited.add(valueKey);
            let query = { [stageSpec.connectToField]: value };
            if (restrictSearchWithMatch) {
              query = { $and: [query, restrictSearchWithMatch] };
            }
            const cursor2 = fromCollection.find(query);
            await cursor2._ensureInitialized();
            while (await cursor2.hasNext()) {
              const match = await cursor2.next();
              const matchCopy = copy(match);
              if (depthField) {
                matchCopy[depthField] = depth;
              }
              matches2.push(matchCopy);
              const nextValue = getProp(match, stageSpec.connectFromField);
              if (nextValue !== void 0 && nextValue !== null) {
                queue.push({ value: nextValue, depth: depth + 1 });
              }
            }
          }
          doc[stageSpec.as] = matches2;
          graphed.push(doc);
        }
        results = graphed;
      } else if (stageType === "$facet") {
        if (typeof stageSpec !== "object" || Array.isArray(stageSpec)) {
          throw new QueryError("$facet requires an object with pipeline definitions", {
            collection: this.name,
            code: ErrorCodes.FAILED_TO_PARSE
          });
        }
        const facetResult = {};
        for (const facetName in stageSpec) {
          const facetPipeline = stageSpec[facetName];
          if (!Array.isArray(facetPipeline)) {
            throw new QueryError("$facet pipeline must be an array", {
              collection: this.name,
              code: ErrorCodes.FAILED_TO_PARSE
            });
          }
          let facetResults = results.map((r) => copy(r));
          for (let k = 0; k < facetPipeline.length; k++) {
            const facetStage = facetPipeline[k];
            const facetStageKeys = Object.keys(facetStage);
            if (facetStageKeys.length !== 1) {
              throw new QueryError("Each pipeline stage must have exactly one key", {
                collection: this.name,
                code: ErrorCodes.FAILED_TO_PARSE
              });
            }
            const facetStageType = facetStageKeys[0];
            const facetStageSpec = facetStage[facetStageType];
            if (facetStageType === "$match") {
              const matched = [];
              for (let m = 0; m < facetResults.length; m++) {
                if (matches(facetResults[m], facetStageSpec)) {
                  matched.push(facetResults[m]);
                }
              }
              facetResults = matched;
            } else if (facetStageType === "$project") {
              const projected = [];
              for (let m = 0; m < facetResults.length; m++) {
                projected.push(applyProjectionWithExpressions(facetStageSpec, facetResults[m]));
              }
              facetResults = projected;
            } else if (facetStageType === "$limit") {
              facetResults = facetResults.slice(0, facetStageSpec);
            } else if (facetStageType === "$skip") {
              facetResults = facetResults.slice(facetStageSpec);
            } else if (facetStageType === "$sort") {
              const sortKeys = Object.keys(facetStageSpec);
              facetResults.sort(function(a, b) {
                for (let n = 0; n < sortKeys.length; n++) {
                  const key = sortKeys[n];
                  if (a[key] === void 0 && b[key] !== void 0) return -1 * facetStageSpec[key];
                  if (a[key] !== void 0 && b[key] === void 0) return 1 * facetStageSpec[key];
                  if (a[key] < b[key]) return -1 * facetStageSpec[key];
                  if (a[key] > b[key]) return 1 * facetStageSpec[key];
                }
                return 0;
              });
            } else if (facetStageType === "$count") {
              facetResults = [{ [facetStageSpec]: facetResults.length }];
            } else if (facetStageType === "$group") {
              const groups = {};
              const groupId = facetStageSpec._id;
              for (let m = 0; m < facetResults.length; m++) {
                const doc = facetResults[m];
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
                for (const field in facetStageSpec) {
                  if (field === "_id") continue;
                  const accumulator = facetStageSpec[field];
                  const accKeys = Object.keys(accumulator);
                  if (accKeys.length !== 1) continue;
                  const accType = accKeys[0];
                  const accExpr = accumulator[accType];
                  if (accType === "$sum") {
                    let sum = 0;
                    for (let n = 0; n < group.docs.length; n++) {
                      const val = evaluateExpression(accExpr, group.docs[n]);
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
                    for (let n = 0; n < group.docs.length; n++) {
                      const val = evaluateExpression(accExpr, group.docs[n]);
                      if (val !== void 0 && val !== null) {
                        sum += Number(val) || 0;
                        count++;
                      }
                    }
                    result[field] = count > 0 ? sum / count : 0;
                  } else if (accType === "$max") {
                    let max = void 0;
                    for (let n = 0; n < group.docs.length; n++) {
                      const val = evaluateExpression(accExpr, group.docs[n]);
                      if (val !== void 0 && (max === void 0 || val > max)) {
                        max = val;
                      }
                    }
                    result[field] = max;
                  }
                }
                grouped.push(result);
              }
              facetResults = grouped;
            } else if (facetStageType === "$sortByCount") {
              const groups = {};
              for (let m = 0; m < facetResults.length; m++) {
                const doc = facetResults[m];
                const value = evaluateExpression(facetStageSpec, doc);
                const key = JSON.stringify(value);
                if (!groups[key]) {
                  groups[key] = {
                    _id: value,
                    count: 0
                  };
                }
                groups[key].count++;
              }
              facetResults = Object.values(groups).sort((a, b) => b.count - a.count);
            } else if (facetStageType === "$sample") {
              const size = facetStageSpec.size || 1;
              const shuffled = [...facetResults];
              for (let m = shuffled.length - 1; m > 0; m--) {
                const k2 = Math.floor(Math.random() * (m + 1));
                [shuffled[m], shuffled[k2]] = [shuffled[k2], shuffled[m]];
              }
              facetResults = shuffled.slice(0, Math.min(size, shuffled.length));
            } else if (facetStageType === "$bucket") {
              const boundaries = facetStageSpec.boundaries;
              const defaultBucket = facetStageSpec.default;
              const output = facetStageSpec.output || { count: { $sum: 1 } };
              const buckets = {};
              for (let m = 0; m < boundaries.length - 1; m++) {
                const key = JSON.stringify(boundaries[m]);
                buckets[key] = {
                  _id: boundaries[m],
                  docs: []
                };
              }
              if (defaultBucket !== void 0) {
                buckets["default"] = {
                  _id: defaultBucket,
                  docs: []
                };
              }
              for (let m = 0; m < facetResults.length; m++) {
                const doc = facetResults[m];
                const value = evaluateExpression(facetStageSpec.groupBy, doc);
                let placed = false;
                for (let n = 0; n < boundaries.length - 1; n++) {
                  if (value >= boundaries[n] && value < boundaries[n + 1]) {
                    const key = JSON.stringify(boundaries[n]);
                    buckets[key].docs.push(doc);
                    placed = true;
                    break;
                  }
                }
                if (!placed && defaultBucket !== void 0) {
                  buckets["default"].docs.push(doc);
                }
              }
              const bucketed = [];
              for (const bucketKey in buckets) {
                const bucket = buckets[bucketKey];
                if (bucket.docs.length === 0) continue;
                const result = { _id: bucket._id };
                for (const field in output) {
                  const accumulator = output[field];
                  const accKeys = Object.keys(accumulator);
                  if (accKeys.length !== 1) continue;
                  const accType = accKeys[0];
                  const accExpr = accumulator[accType];
                  if (accType === "$sum") {
                    let sum = 0;
                    for (let n = 0; n < bucket.docs.length; n++) {
                      const val = evaluateExpression(accExpr, bucket.docs[n]);
                      if (typeof val === "number") {
                        sum += val;
                      } else if (val !== null && val !== void 0) {
                        sum += Number(val) || 0;
                      }
                    }
                    result[field] = sum;
                  }
                }
                bucketed.push(result);
              }
              facetResults = bucketed.sort((a, b) => {
                if (a._id < b._id) return -1;
                if (a._id > b._id) return 1;
                return 0;
              });
            }
          }
          facetResult[facetName] = facetResults;
        }
        results = [facetResult];
      } else if (stageType === "$redact") {
        const redacted = [];
        for (let j = 0; j < results.length; j++) {
          const doc = results[j];
          const decision = evaluateExpression(stageSpec, doc);
          if (decision === "$$DESCEND") {
            redacted.push(doc);
          } else if (decision === "$$PRUNE") {
            continue;
          } else if (decision === "$$KEEP") {
            redacted.push(doc);
          } else {
            if (decision) {
              redacted.push(doc);
            }
          }
        }
        results = redacted;
      } else if (stageType === "$geoNear") {
        if (!stageSpec.near || !stageSpec.distanceField) {
          throw new QueryError("$geoNear requires near and distanceField", {
            collection: this.name,
            code: ErrorCodes.FAILED_TO_PARSE
          });
        }
        const near = stageSpec.near;
        const distanceField = stageSpec.distanceField;
        const maxDistance = stageSpec.maxDistance;
        const minDistance = stageSpec.minDistance || 0;
        const spherical = stageSpec.spherical !== false;
        const key = stageSpec.key || "location";
        const withDistances = [];
        for (let j = 0; j < results.length; j++) {
          const doc = copy(results[j]);
          const location = getProp(doc, key);
          if (!location || !Array.isArray(location) || location.length < 2) {
            continue;
          }
          let distance;
          if (spherical) {
            const R = 6371e3;
            const lat1 = near[1] * Math.PI / 180;
            const lat2 = location[1] * Math.PI / 180;
            const deltaLat = (location[1] - near[1]) * Math.PI / 180;
            const deltaLon = (location[0] - near[0]) * Math.PI / 180;
            const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            distance = R * c;
          } else {
            const dx = location[0] - near[0];
            const dy = location[1] - near[1];
            distance = Math.sqrt(dx * dx + dy * dy);
          }
          if (distance >= minDistance && (!maxDistance || distance <= maxDistance)) {
            doc[distanceField] = distance;
            withDistances.push(doc);
          }
        }
        withDistances.sort((a, b) => a[distanceField] - b[distanceField]);
        if (stageSpec.limit) {
          results = withDistances.slice(0, stageSpec.limit);
        } else {
          results = withDistances;
        }
      } else {
        throw new QueryError("Unsupported aggregation stage: " + stageType, {
          collection: this.name,
          code: ErrorCodes.FAILED_TO_PARSE
        });
      }
    }
    return results;
  }
  async bulkWrite() {
    throw new NotImplementedError("bulkWrite", { collection: this.name });
  }
  async count() {
    if (!this._initialized) await this._initialize();
    let count = 0;
    for await (const _ of this.documents) {
      count++;
    }
    return count;
  }
  async copyTo(destCollectionName) {
    const destCol = this.db.getCollection(destCollectionName);
    let numCopied = 0;
    const c = this.find({});
    await c._ensureInitialized();
    while (await c.hasNext()) {
      await destCol.insertOne(await c.next());
      numCopied++;
    }
    return numCopied;
  }
  async createIndex(keys, options) {
    if (!this._initialized) await this._initialize();
    if (!keys || typeof keys !== "object" || Array.isArray(keys)) {
      throw new BadValueError("keys", keys, "createIndex requires a key specification object", {
        collection: this.name
      });
    }
    const indexName = options && options.name ? options.name : this.generateIndexName(keys);
    if (this.indexes.has(indexName)) {
      const existingIndex = this.indexes.get(indexName);
      const existingKeys = JSON.stringify(existingIndex.keys);
      const newKeys = JSON.stringify(keys);
      if (existingKeys !== newKeys) {
        throw new IndexError(
          "Index with name '" + indexName + "' already exists with a different key specification",
          {
            code: ErrorCodes.INDEX_OPTIONS_CONFLICT,
            index: indexName,
            collection: this.name
          }
        );
      }
      return indexName;
    }
    await this._buildIndex(indexName, keys, options);
    return indexName;
  }
  dataSize() {
    throw new NotImplementedError("dataSize", { collection: this.name });
  }
  async deleteOne(query) {
    const doc = await this.findOne(query);
    if (doc) {
      await this.updateIndexesOnDelete(doc);
      await this.documents.delete(doc._id.toString());
      this.emit("delete", { _id: doc._id });
      return { deletedCount: 1 };
    } else {
      return { deletedCount: 0 };
    }
  }
  async deleteMany(query) {
    const c = this.find(query);
    await c._ensureInitialized();
    const ids = [];
    const docs = [];
    while (await c.hasNext()) {
      const doc = await c.next();
      ids.push(doc._id);
      docs.push(doc);
    }
    const deletedCount = ids.length;
    for (let i = 0; i < ids.length; i++) {
      await this.updateIndexesOnDelete(docs[i]);
      this.documents.delete(ids[i].toString());
      this.emit("delete", { _id: ids[i] });
    }
    return { deletedCount };
  }
  async distinct(field, query) {
    const vals = {};
    const c = this.find(query);
    await c._ensureInitialized();
    while (await c.hasNext()) {
      const d = await c.next();
      if (d[field]) {
        vals[d[field]] = true;
      }
    }
    return Object.keys(vals);
  }
  async drop() {
    if (!this._initialized) await this._initialize();
    for (const [_, index] of this.indexes) {
      if (index && typeof index.close === "function") {
        await index.close();
      }
    }
    if (this.documents && typeof this.documents.close === "function") {
      await this.documents.close();
    }
    const pathParts = this.path.split("/").filter(Boolean);
    const filename = pathParts.pop();
    try {
      let dir = await globalThis.navigator.storage.getDirectory();
      for (const part of pathParts) {
        dir = await dir.getDirectoryHandle(part, { create: false });
      }
      try {
        await dir.removeEntry(filename, { recursive: true });
      } catch (e) {
        if (e.name === "TypeError" || e.message?.includes("recursive")) {
          await dir.removeEntry(filename);
        } else {
          throw e;
        }
      }
    } catch (error) {
      if (error.name !== "NotFoundError" && error.code !== "ENOENT") {
        throw error;
      }
    }
    this.documents = null;
    this.indexes.clear();
    this._initialized = false;
    this.db.collections.delete(this.name);
    this.emit("drop", { collection: this.name });
    return { ok: 1 };
  }
  async dropIndex(indexName) {
    if (!this.indexes.has(indexName)) {
      throw new IndexNotFoundError(indexName, { collection: this.name });
    }
    const index = this.indexes.get(indexName);
    if (index && typeof index.clear === "function") {
      await index.clear();
    }
    if (index && typeof index.close === "function") {
      await index.close();
    }
    this.indexes.delete(indexName);
    return { nIndexesWas: this.indexes.size + 1, ok: 1 };
  }
  async dropIndexes() {
    const count = this.indexes.size;
    for (const [_, index] of this.indexes) {
      if (index && typeof index.clear === "function") {
        await index.clear();
      }
      if (index && typeof index.close === "function") {
        await index.close();
      }
    }
    this.indexes.clear();
    return { nIndexesWas: count, msg: "non-_id indexes dropped", ok: 1 };
  }
  ensureIndex() {
    throw new NotImplementedError("ensureIndex", { collection: this.name });
  }
  explain() {
    throw new NotImplementedError("explain", { collection: this.name });
  }
  find(query, projection) {
    this._validateProjection(projection);
    const documentsPromise = this._findInternal(query, projection);
    return new Cursor(
      this,
      query,
      projection,
      documentsPromise,
      SortedCursor
    );
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
  async _findInternal(query, projection) {
    if (!this._initialized) await this._initialize();
    const normalizedQuery = query == void 0 ? {} : query;
    const nearSpec = this._extractNearSpec(normalizedQuery);
    const documents = [];
    const seen = {};
    if (this.indexes.size > 0) {
      const queryPlan = await this.planQueryAsync(normalizedQuery);
      if (queryPlan.useIndex && queryPlan.docIds && queryPlan.docIds.length > 0) {
        for (const docId of queryPlan.docIds) {
          if (!seen[docId]) {
            const doc = await this.documents.search(docId);
            if (doc && matches(doc, normalizedQuery)) {
              seen[docId] = true;
              documents.push(doc);
            }
          }
        }
      } else {
        for await (const entry of this.documents) {
          if (entry && entry.value && !seen[entry.value._id] && matches(entry.value, normalizedQuery)) {
            seen[entry.value._id] = true;
            documents.push(entry.value);
          }
        }
      }
    } else {
      for await (const entry of this.documents) {
        if (entry && entry.value && !seen[entry.value._id] && matches(entry.value, normalizedQuery)) {
          seen[entry.value._id] = true;
          documents.push(entry.value);
        }
      }
    }
    if (nearSpec) {
      this._sortByNearDistance(documents, nearSpec);
    }
    return documents;
  }
  _extractNearSpec(query) {
    for (const field of Object.keys(query || {})) {
      if (field.startsWith("$")) continue;
      const value = query[field];
      if (!value || typeof value !== "object") continue;
      if (value.$near) {
        const coords = this._parseNearCoordinates(value.$near);
        if (coords) return { field, ...coords };
      }
      if (value.$nearSphere) {
        const coords = this._parseNearCoordinates(value.$nearSphere);
        if (coords) return { field, ...coords };
      }
    }
    return null;
  }
  _parseNearCoordinates(spec) {
    let coordinates;
    if (spec && typeof spec === "object") {
      if (spec.$geometry && spec.$geometry.coordinates) {
        coordinates = spec.$geometry.coordinates;
      } else if (spec.coordinates) {
        coordinates = spec.coordinates;
      } else if (Array.isArray(spec)) {
        coordinates = spec;
      }
    }
    if (!coordinates || coordinates.length < 2) {
      return null;
    }
    const [lng, lat] = coordinates;
    if (typeof lat !== "number" || typeof lng !== "number") {
      return null;
    }
    return { lat, lng };
  }
  _extractPointCoordinates(value) {
    if (!value) return null;
    if (value.type === "FeatureCollection" && Array.isArray(value.features) && value.features.length > 0) {
      return this._extractPointCoordinates(value.features[0].geometry);
    }
    if (value.type === "Feature" && value.geometry) {
      return this._extractPointCoordinates(value.geometry);
    }
    if (value.type === "Point" && Array.isArray(value.coordinates) && value.coordinates.length >= 2) {
      const [lng, lat] = value.coordinates;
      if (typeof lat === "number" && typeof lng === "number") {
        return { lat, lng };
      }
    }
    return null;
  }
  _sortByNearDistance(documents, nearSpec) {
    const { field, lat: targetLat, lng: targetLng } = nearSpec;
    documents.sort((a, b) => {
      const aPoint = this._extractPointCoordinates(getProp(a, field));
      const bPoint = this._extractPointCoordinates(getProp(b, field));
      const aDist = aPoint ? this._haversineDistance(aPoint.lat, aPoint.lng, targetLat, targetLng) : Infinity;
      const bDist = bPoint ? this._haversineDistance(bPoint.lat, bPoint.lng, targetLat, targetLng) : Infinity;
      return aDist - bDist;
    });
  }
  _haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  findAndModify() {
    throw new NotImplementedError("findAndModify", { collection: this.name });
  }
  async findOne(query, projection) {
    const cursor = this.find(query, projection);
    await cursor._ensureInitialized();
    if (await cursor.hasNext()) {
      return await cursor.next();
    } else {
      return null;
    }
  }
  async findOneAndDelete(filter, options) {
    let c = this.find(filter);
    if (options && options.sort) {
      c = c.sort(options.sort);
      await c._ensureInitialized();
    } else {
      await c._ensureInitialized();
    }
    if (!await c.hasNext()) return null;
    const doc = await c.next();
    await this.documents.delete(doc._id.toString());
    if (options && options.projection) return applyProjection(options.projection, doc);
    else return doc;
  }
  async findOneAndReplace(filter, replacement, options) {
    let c = this.find(filter);
    if (options && options.sort) {
      c = c.sort(options.sort);
      await c._ensureInitialized();
    } else {
      await c._ensureInitialized();
    }
    if (!await c.hasNext()) return null;
    const doc = await c.next();
    replacement._id = doc._id;
    await this.documents.add(doc._id.toString(), replacement);
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
    if (options && options.sort) {
      c = c.sort(options.sort);
      await c._ensureInitialized();
    } else {
      await c._ensureInitialized();
    }
    if (!await c.hasNext()) return null;
    const doc = await c.next();
    const clone = Object.assign({}, doc);
    const matchInfo = matchWithArrayIndices(doc, filter);
    const positionalMatchInfo = matchInfo.arrayFilters;
    const userArrayFilters = options && options.arrayFilters;
    applyUpdates(update, clone, false, positionalMatchInfo, userArrayFilters);
    await this.documents.add(doc._id.toString(), clone);
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
    throw new NotImplementedError("getShardDistribution", { collection: this.name });
  }
  getShardVersion() {
    throw new NotImplementedError("getShardVersion", { collection: this.name });
  }
  // non-mongo
  getStore() {
    return this.documents;
  }
  group() {
    throw new NotImplementedError("group", { collection: this.name });
  }
  async insert(doc) {
    if (Array == doc.constructor) {
      return await this.insertMany(doc);
    } else {
      return await this.insertOne(doc);
    }
  }
  async insertOne(doc) {
    if (!this._initialized) await this._initialize();
    if (doc._id == void 0) doc._id = new ObjectId();
    await this.documents.add(doc._id.toString(), doc);
    await this.updateIndexesOnInsert(doc);
    this.emit("insert", doc);
    return { insertedId: doc._id };
  }
  async insertMany(docs) {
    if (!this._initialized) await this._initialize();
    const insertedIds = [];
    for (let i = 0; i < docs.length; i++) {
      const result = await this.insertOne(docs[i]);
      insertedIds.push(result.insertedId);
    }
    return { insertedIds };
  }
  isCapped() {
    throw new NotImplementedError("isCapped", { collection: this.name });
  }
  mapReduce() {
    throw new NotImplementedError("mapReduce", { collection: this.name });
  }
  reIndex() {
    throw new NotImplementedError("reIndex", { collection: this.name });
  }
  async replaceOne(query, replacement, options) {
    const result = {};
    const c = this.find(query);
    await c._ensureInitialized();
    result.matchedCount = await c.count();
    if (result.matchedCount == 0) {
      result.modifiedCount = 0;
      if (options && options.upsert) {
        const newDoc = replacement;
        newDoc._id = new ObjectId();
        await this.documents.add(newDoc._id.toString(), newDoc);
        await this.updateIndexesOnInsert(newDoc);
        this.emit("insert", newDoc);
        result.upsertedId = newDoc._id;
      }
    } else {
      result.modifiedCount = 1;
      const doc = await c.next();
      await this.updateIndexesOnDelete(doc);
      replacement._id = doc._id;
      this.documents.add(doc._id.toString(), replacement);
      await this.updateIndexesOnInsert(replacement);
      this.emit("replace", replacement);
    }
    return result;
  }
  async remove(query, options) {
    const c = this.find(query);
    await c._ensureInitialized();
    if (!await c.hasNext()) return;
    if (options === true || options && options.justOne) {
      const doc = await c.next();
      await this.updateIndexesOnDelete(doc);
      this.documents.delete(doc._id.toString());
    } else {
      while (await c.hasNext()) {
        const doc = await c.next();
        await this.updateIndexesOnDelete(doc);
        this.documents.delete(doc._id.toString());
      }
    }
  }
  renameCollection() {
    throw new NotImplementedError("renameCollection", { collection: this.name });
  }
  save() {
    throw new NotImplementedError("save", { collection: this.name });
  }
  stats() {
    throw new NotImplementedError("stats", { collection: this.name });
  }
  storageSize() {
    throw new NotImplementedError("storageSize", { collection: this.name });
  }
  totalSize() {
    throw new NotImplementedError("totalSize", { collection: this.name });
  }
  totalIndexSize() {
    throw new NotImplementedError("totalIndexSize", { collection: this.name });
  }
  async update(query, updates, options) {
    const c = this.find(query);
    await c._ensureInitialized();
    if (await c.hasNext()) {
      if (options && options.multi) {
        while (await c.hasNext()) {
          const doc = await c.next();
          const matchInfo = matchWithArrayIndices(doc, query);
          const positionalMatchInfo = matchInfo.arrayFilters;
          const userArrayFilters = options && options.arrayFilters;
          await this.updateIndexesOnDelete(doc);
          applyUpdates(updates, doc, false, positionalMatchInfo, userArrayFilters);
          await this.documents.add(doc._id.toString(), doc);
          await this.updateIndexesOnInsert(doc);
        }
      } else {
        const doc = await c.next();
        const matchInfo = matchWithArrayIndices(doc, query);
        const positionalMatchInfo = matchInfo.arrayFilters;
        const userArrayFilters = options && options.arrayFilters;
        await this.updateIndexesOnDelete(doc);
        applyUpdates(updates, doc, false, positionalMatchInfo, userArrayFilters);
        await this.documents.add(doc._id.toString(), doc);
        await this.updateIndexesOnInsert(doc);
      }
    } else {
      if (options && options.upsert) {
        const newDoc = createDocFromUpdate(query, updates, new ObjectId());
        await this.documents.add(newDoc._id.toString(), newDoc);
        await this.updateIndexesOnInsert(newDoc);
      }
    }
  }
  async updateOne(query, updates, options) {
    const c = this.find(query);
    await c._ensureInitialized();
    if (await c.hasNext()) {
      const doc = await c.next();
      const originalDoc = JSON.parse(JSON.stringify(doc));
      const matchInfo = matchWithArrayIndices(doc, query);
      const positionalMatchInfo = matchInfo.arrayFilters;
      const userArrayFilters = options && options.arrayFilters;
      await this.updateIndexesOnDelete(doc);
      applyUpdates(updates, doc, false, positionalMatchInfo, userArrayFilters);
      this.documents.add(doc._id.toString(), doc);
      await this.updateIndexesOnInsert(doc);
      const updateDescription = this._getUpdateDescription(originalDoc, doc);
      this.emit("update", doc, updateDescription);
    } else {
      if (options && options.upsert) {
        const newDoc = createDocFromUpdate(query, updates, new ObjectId());
        this.documents.add(newDoc._id.toString(), newDoc);
        await this.updateIndexesOnInsert(newDoc);
        this.emit("insert", newDoc);
      }
    }
  }
  async updateMany(query, updates, options) {
    const c = this.find(query);
    await c._ensureInitialized();
    if (await c.hasNext()) {
      while (await c.hasNext()) {
        const doc = await c.next();
        const originalDoc = JSON.parse(JSON.stringify(doc));
        const matchInfo = matchWithArrayIndices(doc, query);
        const positionalMatchInfo = matchInfo.arrayFilters;
        const userArrayFilters = options && options.arrayFilters;
        await this.updateIndexesOnDelete(doc);
        applyUpdates(updates, doc, false, positionalMatchInfo, userArrayFilters);
        this.documents.add(doc._id.toString(), doc);
        await this.updateIndexesOnInsert(doc);
        const updateDescription = this._getUpdateDescription(originalDoc, doc);
        this.emit("update", doc, updateDescription);
      }
    } else {
      if (options && options.upsert) {
        const newDoc = createDocFromUpdate(query, updates, new ObjectId());
        this.documents.add(newDoc._id.toString(), newDoc);
        await this.updateIndexesOnInsert(newDoc);
        this.emit("insert", newDoc);
      }
    }
  }
  validate() {
    throw new NotImplementedError("validate", { collection: this.name });
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
class DB {
  constructor(options) {
    this.options = options || {};
    this.baseFolder = this.options.baseFolder || "micro-mongo";
    this.dbName = this.options.dbName || "default";
    this.dbFolder = `${this.baseFolder}/${this.dbName}`;
    this.collections = /* @__PURE__ */ new Map();
    const proxy = new Proxy(this, {
      get(target, property, receiver) {
        if (property in target) {
          return Reflect.get(target, property, receiver);
        }
        if (typeof property === "symbol" || property.startsWith("_")) {
          return void 0;
        }
        if (typeof property === "string") {
          return target.getCollection(property);
        }
        return void 0;
      }
    });
    this._proxy = proxy;
    return proxy;
  }
  /**
   * Close all collections
   */
  async close() {
    for (const [_, collection] of this.collections) {
      await collection.close();
    }
  }
  // DB Methods
  cloneCollection() {
    throw new NotImplementedError("cloneCollection", { database: this.dbName });
  }
  cloneDatabase() {
    throw new NotImplementedError("cloneDatabase", { database: this.dbName });
  }
  commandHelp() {
    throw new NotImplementedError("commandHelp", { database: this.dbName });
  }
  copyDatabase() {
    throw new NotImplementedError("copyDatabase", { database: this.dbName });
  }
  createCollection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Collection(this, name));
    }
    return { ok: 1 };
  }
  currentOp() {
    throw new NotImplementedError("currentOp", { database: this.dbName });
  }
  async dropCollection(collectionName) {
    if (this.collections.has(collectionName)) {
      const collection = this.collections.get(collectionName);
      if (typeof collection.drop === "function") {
        await collection.drop();
      }
      this.collections.delete(collectionName);
    }
  }
  async dropDatabase() {
    for (const [_, collection] of this.collections) {
      await collection.drop();
    }
    this.collections.clear();
    const pathParts = this.dbFolder.split("/").filter(Boolean);
    const dbFolder = pathParts.pop();
    let dir = await globalThis.navigator.storage.getDirectory();
    for (const part of pathParts) {
      dir = await dir.getDirectoryHandle(part, { create: false });
    }
    try {
      await dir.removeEntry(dbFolder, { recursive: true });
    } catch (error) {
      if (error.name !== "NotFoundError" && error.code !== "ENOENT") {
        throw error;
      }
    }
    return { ok: 1 };
  }
  eval() {
    throw new NotImplementedError("eval", { database: this.dbName });
  }
  fsyncLock() {
    throw new NotImplementedError("fsyncLock", { database: this.dbName });
  }
  fsyncUnlock() {
    throw new NotImplementedError("fsyncUnlock", { database: this.dbName });
  }
  getCollection(name) {
    if (!this.collections.has(name)) {
      const dbRef = this._proxy || this;
      this.collections.set(name, new Collection(dbRef, name));
    }
    return this.collections.get(name);
  }
  // Alias for getCollection for MongoDB API compatibility
  collection(name) {
    return this.getCollection(name);
  }
  getCollectionInfos() {
    throw new NotImplementedError("getCollectionInfos", { database: this.dbName });
  }
  getCollectionNames() {
    return Array.from(this.collections.keys());
  }
  getLastError() {
    throw new NotImplementedError("getLastError", { database: this.dbName });
  }
  getLastErrorObj() {
    throw new NotImplementedError("getLastErrorObj", { database: this.dbName });
  }
  getLogComponents() {
    throw new NotImplementedError("getLogComponents", { database: this.dbName });
  }
  getMongo() {
    throw new NotImplementedError("getMongo", { database: this.dbName });
  }
  getName() {
    throw new NotImplementedError("getName", { database: this.dbName });
  }
  getPrevError() {
    throw new NotImplementedError("getPrevError", { database: this.dbName });
  }
  getProfilingLevel() {
    throw new NotImplementedError("getProfilingLevel", { database: this.dbName });
  }
  getProfilingStatus() {
    throw new NotImplementedError("getProfilingStatus", { database: this.dbName });
  }
  getReplicationInfo() {
    throw new NotImplementedError("getReplicationInfo", { database: this.dbName });
  }
  getSiblingDB() {
    throw new NotImplementedError("getSiblingDB", { database: this.dbName });
  }
  help() {
    console.log("        help mr                      mapreduce");
    console.log("        db.foo.find()                list objects in collection foo");
    console.log("        db.foo.find( { a : 1 } )     list objects in foo where a == 1");
    console.log("        it                           result of the last line evaluated; use to further iterate");
  }
  hostInfo() {
    throw new NotImplementedError("hostInfo", { database: this.dbName });
  }
  isMaster() {
    throw new NotImplementedError("isMaster", { database: this.dbName });
  }
  killOp() {
    throw new NotImplementedError("killOp", { database: this.dbName });
  }
  listCommands() {
    throw new NotImplementedError("listCommands", { database: this.dbName });
  }
  loadServerScripts() {
    throw new NotImplementedError("loadServerScripts", { database: this.dbName });
  }
  logout() {
    throw new NotImplementedError("logout", { database: this.dbName });
  }
  printCollectionStats() {
    throw new NotImplementedError("printCollectionStats", { database: this.dbName });
  }
  printReplicationInfo() {
    throw new NotImplementedError("printReplicationInfo", { database: this.dbName });
  }
  printShardingStatus() {
    throw new NotImplementedError("printShardingStatus", { database: this.dbName });
  }
  printSlaveReplicationInfo() {
    throw new NotImplementedError("printSlaveReplicationInfo", { database: this.dbName });
  }
  repairDatabase() {
    throw new NotImplementedError("repairDatabase", { database: this.dbName });
  }
  resetError() {
    throw new NotImplementedError("resetError", { database: this.dbName });
  }
  runCommand() {
    throw new NotImplementedError("runCommand", { database: this.dbName });
  }
  serverBuildInfo() {
    throw new NotImplementedError("serverBuildInfo", { database: this.dbName });
  }
  serverCmdLineOpts() {
    throw new NotImplementedError("serverCmdLineOpts", { database: this.dbName });
  }
  serverStatus() {
    throw new NotImplementedError("serverStatus", { database: this.dbName });
  }
  setLogLevel() {
    throw new NotImplementedError("setLogLevel", { database: this.dbName });
  }
  setProfilingLevel() {
    throw new NotImplementedError("setProfilingLevel", { database: this.dbName });
  }
  shutdownServer() {
    throw new NotImplementedError("shutdownServer", { database: this.dbName });
  }
  stats() {
    throw new NotImplementedError("stats", { database: this.dbName });
  }
  version() {
    throw new NotImplementedError("version", { database: this.dbName });
  }
  upgradeCheck() {
    throw new NotImplementedError("upgradeCheck", { database: this.dbName });
  }
  upgradeCheckAllDBs() {
    throw new NotImplementedError("upgradeCheckAllDBs", { database: this.dbName });
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
    this._databases = /* @__PURE__ */ new Map();
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
  // This is async as it loads from the file system
  db(name, opts = {}) {
    const dbName = name || this._defaultDb;
    if (!dbName) {
      throw new Error("No database name provided and no default in connection string");
    }
    if (this._databases.has(dbName)) {
      return this._databases.get(dbName);
    }
    const dbOptions = { ...this.options, ...opts, dbName };
    const database = new DB(dbOptions);
    this._databases.set(dbName, database);
    return database;
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
  WriteError
};
//# sourceMappingURL=micro-mongo-2.0.0.js.map
