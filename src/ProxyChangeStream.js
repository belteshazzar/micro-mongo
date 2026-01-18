import { EventEmitter } from 'events';
import { NotImplementedError } from './errors.js';

/**
 * ProxyChangeStream listens for forwarded events from the worker.
 */
export class ProxyChangeStream extends EventEmitter {
  static async create({ bridge, database, collection, streamId }) {
    if (!streamId) {
      // Request a change stream from worker
      const resp = await bridge.sendRequest({
        target: 'collection',
        database,
        collection,
        method: 'watch',
        args: []
      });

      if (!resp || !resp.streamId) {
        throw new NotImplementedError('change streams over WorkerBridge');
      }

      streamId = resp.streamId;
    }

    return new ProxyChangeStream({ bridge, streamId });
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
}
