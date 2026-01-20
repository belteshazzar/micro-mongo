import { Server } from './Server.js';
import { ObjectId } from 'bjson';

/**
 * Serialize ObjectId and Date instances for worker communication
 */
function serializePayload(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'function') {
    return { __function: obj.toString() };
  }
  
  // Check for ObjectId instances - try toString() first as it's the most reliable way
  if (obj && typeof obj === 'object' && typeof obj.toString === 'function') {
    try {
      const str = obj.toString();
      // bjson ObjectIds produce 24-character hex strings
      if (str && str.length === 24 && /^[0-9a-f]{24}$/i.test(str) && obj.constructor && obj.constructor.name === 'ObjectId') {
        return { __objectId: str };
      }
    } catch (e) {
      // toString() failed, continue to next check
    }
  }
  
  // Traditional instanceof check (may fail across worker boundaries in some cases)
  if (obj instanceof ObjectId) {
    return { __objectId: obj.toString() };
  }
  
  if (obj instanceof Date) {
    return { __date: obj.toISOString() };
  }
  if (Array.isArray(obj)) {
    return obj.map(serializePayload);
  }
  if (typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializePayload(value);
    }
    return result;
  }
  return obj;
}

/**
 * Deserialize ObjectId and Date instances from worker communication
 */
function deserializePayload(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'object' && obj.__function) {
    return typeof obj.__function === 'string' ? `(${obj.__function}).call(this)` : undefined;
  }
  if (typeof obj === 'object' && obj.__objectId) {
    return new ObjectId(obj.__objectId);
  }
  if (typeof obj === 'object' && obj.__date) {
    return new Date(obj.__date);
  }
  if (Array.isArray(obj)) {
    return obj.map(deserializePayload);
  }
  if (typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = deserializePayload(value);
    }
    return result;
  }
  return obj;
}

const isNode = typeof process !== 'undefined' && !!process.versions?.node;
let server;
let initPromise = null;

// Set up OPFS polyfill for Node.js worker threads
if (isNode) {
  initPromise = Promise.resolve().then(() => {
    // Dynamically construct import to avoid static analysis by Vite
    const importFunc = new Function('spec', 'return import(spec)');
    return Promise.all([
      importFunc('path'),
      importFunc('url'),
      importFunc('node-opfs')
    ]);
  }).then(([pathModule, urlModule, opfsModule]) => {
    const path = pathModule.default;
    const { fileURLToPath } = urlModule;
    const { StorageManager } = opfsModule;
    
    // Get project root directory for .opfs location
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const projectRoot = path.resolve(__dirname, '..');
    const opfsDir = path.join(projectRoot, '.opfs');
    
    // Configure node-opfs to use project-local .opfs directory
    const customStorage = new StorageManager(opfsDir);
    const opfsNavigator = {
      storage: {
        getDirectory: () => customStorage.getDirectory()
      }
    };
    
    // Ensure bjson sees OPFS APIs in Node worker
    if (typeof globalThis.navigator === 'undefined') {
      globalThis.navigator = opfsNavigator;
    } else {
      globalThis.navigator.storage = opfsNavigator.storage;
    }
  }).catch(() => {
    // Ignore - likely dependencies not available or browser environment
  });
}

function createServer(post) {
  if (!server) {
    // Use empty options - will default to in-memory storage
    server = new Server({}, post);
  }
  return server;
}

async function handleMessage(message, post) {
  if (!message || message.type !== 'request') return;
  
  // Wait for OPFS initialization in Node.js before processing
  if (initPromise) {
    await initPromise;
  }
  
  const { id, payload } = message;
  const deserializedPayload = deserializePayload(payload);
  const srv = createServer(post);

  try {
    const result = await srv.dispatch(deserializedPayload);
    const serializedResult = serializePayload(result);
    post({ type: 'response', id, success: true, result: serializedResult });
  } catch (error) {
    post({
      type: 'response',
      id,
      success: false,
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        $err: error?.$err
      }
    });
  }
}

async function initializeWorker() {
  if (isNode) {
    const { parentPort } = await import('worker_threads');
    const post = (resp) => parentPort.postMessage(resp);
    parentPort.on('message', (msg) => handleMessage(msg, post));
  } else {
    const post = (resp) => self.postMessage(resp);
    self.onmessage = (event) => handleMessage(event.data, post);
  }
}

// Initialize on load
initializeWorker().catch(err => {
  console.error('Worker initialization failed:', err);
  if (typeof process !== 'undefined') {
    process.exit(1);
  } else {
    self.postMessage({ type: 'error', error: err.message });
  }
});
