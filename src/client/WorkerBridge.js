import { EventEmitter } from 'events';

/**
 * WorkerBridge provides a unified message-based transport between the main thread
 * and a worker (Web Worker in browsers, Worker Thread in Node.js).
 */
export class WorkerBridge extends EventEmitter {
  constructor(worker) {
    super();
    this.worker = worker;
    this._nextId = 1;
    this._pending = new Map();
    this._terminating = false;

    this._handleMessage = this._handleMessage.bind(this);
    this._handleError = this._handleError.bind(this);

    this._attach();
  }

  static async create(options = {}) {
    // Check if running in browser
    if (typeof window !== 'undefined' && typeof globalThis.Worker !== 'undefined') {
      return new BrowserWorkerBridge(options);
    }

    // Node.js environment - dynamically import to avoid browser compatibility issues
    const { Worker: NodeWorker } = await import('worker_threads');
    const { fileURLToPath } = await import('url');
    
    // Default to built worker artifact; use proper absolute path for Node worker
    let workerPath = options.workerPath;
    if (!workerPath) {
      const buildUrl = new URL('../build/server-worker.js', import.meta.url);
      workerPath = fileURLToPath(buildUrl);
    }
    const worker = new NodeWorker(workerPath, {
      workerData: options.workerData,
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
    const message = { type: 'request', id, payload };

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
   * Terminate the worker and reject pending requests.
   */
  async terminate() {
    this._terminating = true;
    for (const [id, pending] of this._pending.entries()) {
      clearTimeout(pending.timeoutHandle);
      pending.reject(new Error('Worker terminated'));
    }
    this._pending.clear();
    await this._terminateImpl();
  }

  _handleMessage(event) {
    const data = event?.data ?? event; // Browser sends { data }, Node sends the raw object
    if (!data) return;

    if (data.type === 'response') {
      const pending = this._pending.get(data.id);
      if (!pending) return;
      this._pending.delete(data.id);
      clearTimeout(pending.timeoutHandle);
      if (data.success) {
        pending.resolve(data.result);
      } else {
        const error = new Error(data.error?.message || 'Worker error');
        if (data.error?.name) error.name = data.error.name;
        if (data.error?.stack) error.stack = data.error.stack;
        if (data.error?.code) error.code = data.error.code;
        pending.reject(error);
      }
      return;
    }

    // Forward events (e.g., change streams)
    if (data.type === 'event') {
      this.emit('event', data.event, data.payload);
    }
  }

  _handleError(error) {
    // Don't emit errors if we're intentionally terminating
    if (this._terminating) return;
    
    // Reject all pending requests on fatal worker error
    for (const [id, pending] of this._pending.entries()) {
      clearTimeout(pending.timeoutHandle);
      pending.reject(error);
    }
    this._pending.clear();
    this.emit('error', error);
  }

  // Abstract hooks per environment
  _attach() { throw new Error('Not implemented'); }
  _post() { throw new Error('Not implemented'); }
  _terminateImpl() { throw new Error('Not implemented'); }
}

class BrowserWorkerBridge extends WorkerBridge {
  constructor(options = {}) {
    // Use globalThis.Worker to explicitly reference the Web Worker API
    const WebWorkerCtor = globalThis.Worker;
    if (!WebWorkerCtor) {
      throw new Error('Worker API is not available in this environment');
    }
    
    // Default to built worker artifact; allow override for custom hosting
    const workerUrl = options.workerUrl || new URL('../build/server-worker.js', import.meta.url);
    const worker = new WebWorkerCtor(workerUrl, { type: 'module' });
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
    this.worker.on('message', this._handleMessage);
    this.worker.on('error', this._handleError);
    this.worker.on('exit', (code) => {
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
