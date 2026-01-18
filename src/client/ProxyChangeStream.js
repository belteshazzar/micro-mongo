import { EventEmitter } from 'events';
import { NotImplementedError } from '../errors.js';

/**
 * ProxyChangeStream listens for forwarded events from the worker.
 */
export class ProxyChangeStream extends EventEmitter {
  static create({ bridge, database, collection, streamId, pipeline = [], options = {} }) {
    const stream = new ProxyChangeStream({ bridge, streamId });
    
    if (!streamId) {
      // Request a change stream from worker asynchronously
      bridge.sendRequest({
        target: 'collection',
        database,
        collection,
        method: 'watch',
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
    await this.bridge.sendRequest({
      target: 'changestream',
      streamId: this.streamId,
      method: 'close'
    });
    this._cleanup();
  }

  async next() {
    // Return a promise that resolves when the next change event arrives
    return new Promise((resolve, reject) => {
      const onChange = (change) => {
        this.off('change', onChange);
        this.off('error', onError);
        resolve(change);
      };
      const onError = (error) => {
        this.off('change', onChange);
        this.off('error', onError);
        reject(error);
      };
      this.on('change', onChange);
      this.on('error', onError);
    });
  }
}
