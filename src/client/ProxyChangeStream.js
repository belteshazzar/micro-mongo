import { EventEmitter } from 'events';
import { NotImplementedError } from '../errors.js';

/**
 * ProxyChangeStream listens for forwarded events from the worker.
 */
export class ProxyChangeStream extends EventEmitter {
  static create({ bridge, database, collection, streamId, pipeline = [], options = {} }) {
    const stream = new ProxyChangeStream({ bridge, streamId });
    
    if (!streamId) {
      // Determine target type based on what we're watching
      let target, method;
      if (database === null || database === undefined) {
        // Client-level watch (all databases and collections)
        target = 'client';
        method = 'watch';
      } else if (collection === null || collection === undefined) {
        // Database-level watch
        target = 'db';
        method = 'watch';
      } else {
        // Collection-level watch
        target = 'collection';
        method = 'watch';
      }
      
      // Request a change stream from worker asynchronously
      bridge.sendRequest({
        target,
        database,
        collection,
        method,
        args: [pipeline, options]
      }).then((resp) => {
        if (resp && resp.streamId) {
          stream.streamId = resp.streamId; // Update stream with the ID
        }
      }).catch(() => {
        // Ignore errors during async initialization
      });
    }

    return stream;
  }

  constructor({ bridge, streamId }) {
    super();
    this.bridge = bridge;
    this.streamId = streamId;
    this.closed = false;
    this._pendingNext = []; // Track pending next() promises

    this._onEvent = this._onEvent.bind(this);
    this.bridge.on('event', this._onEvent);
  }

  _onEvent(eventName, payload) {
    if (eventName !== 'changeStream') return;
    if (!payload || payload.streamId !== this.streamId) return;

    const { type, data } = payload;
    if (type === 'change') this.emit('change', data);
    if (type === 'error') this.emit('error', data);
    if (type === 'close') {
      this.emit('close');
      this._cleanup();
    }
  }

  _cleanup() {
    this.bridge.off('event', this._onEvent);
  }

  async close() {
    if (this.closed) return;
    this.closed = true;
    
    // Resolve all pending next() calls with null
    for (const pending of this._pendingNext) {
      pending.resolve(null);
    }
    this._pendingNext = [];
    
    // Send close request to server (don't await to avoid blocking)
    this.bridge.sendRequest({
      target: 'changestream',
      streamId: this.streamId,
      method: 'close'
    }).catch(() => {
      // Ignore errors from server-side close
    });
    
    // Emit close event locally
    this.emit('close');
    
    // Cleanup
    this._cleanup();
  }

  async next() {
    // If already closed, return null immediately
    if (this.closed) {
      return null;
    }
    
    // Return a promise that resolves when the next change event arrives
    return new Promise((resolve, reject) => {
      const onChange = (change) => {
        this._removePending(pending);
        this.off('change', onChange);
        this.off('error', onError);
        this.off('close', onClose);
        resolve(change);
      };
      const onError = (error) => {
        this._removePending(pending);
        this.off('change', onChange);
        this.off('error', onError);
        this.off('close', onClose);
        reject(error);
      };
      const onClose = () => {
        this._removePending(pending);
        this.off('change', onChange);
        this.off('error', onError);
        this.off('close', onClose);
        resolve(null);
      };
      
      // Track this pending promise
      const pending = { resolve, reject };
      this._pendingNext.push(pending);
      
      this.on('change', onChange);
      this.on('error', onError);
      this.on('close', onClose);
    });
  }
  
  _removePending(pending) {
    const index = this._pendingNext.indexOf(pending);
    if (index !== -1) {
      this._pendingNext.splice(index, 1);
    }
  }
}
