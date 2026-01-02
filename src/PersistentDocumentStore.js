import { BPlusTree } from 'bjson/bplustree';

/**
 * PersistentDocumentStore - BPlusTree-backed document storage with in-memory cache
 *
 * Keeps a Map cache for fast reads while persisting to OPFS via BPlusTree.
 */
export class PersistentDocumentStore {
	constructor(filePath, order = 50) {
		this.filePath = filePath;
		this.order = order;
		this.tree = null;
		this.cache = new Map();
		this.isOpen = false;
		this.readyPromise = this._openAndHydrate();
	}

	async _openAndHydrate() {
		if (!this.filePath) {
			throw new Error('PersistentDocumentStore requires a filePath');
		}
		if (!globalThis.navigator || !globalThis.navigator.storage || typeof globalThis.navigator.storage.getDirectory !== 'function') {
			throw new Error('OPFS not available: navigator.storage.getDirectory is missing');
		}
		
		// Ensure directory exists before opening file
		await this._ensureDirectoryForFile(this.filePath);
		
		this.tree = new BPlusTree(this.filePath, this.order);
		try {
			await this.tree.open();
			this.isOpen = true;
			const entries = await this.tree.toArray();
			for (const entry of entries) {
				this.cache.set(entry.key, entry.value);
			}
		} catch (error) {
			// Handle empty/new files or missing directories
			if (error.code === 'ENOENT' ||
					(error.message && (error.message.includes('Failed to read metadata') ||
					error.message.includes('missing required fields') ||
					error.message.includes('Unknown type byte') ||
					error.message.includes('Invalid tree file')))) {
				// This is a new file or directory doesn't exist yet, just mark as open
				this.isOpen = true;
			} else {
				throw error;
			}
		}
	}

	async _ensureDirectoryForFile(filePath) {
		if (!filePath) return;
		const pathParts = filePath.split('/').filter(Boolean);
		// Remove filename, keep only directory parts
		pathParts.pop();
		
		if (pathParts.length === 0) return;
		
		try {
			let dir = await globalThis.navigator.storage.getDirectory();
			for (const part of pathParts) {
				dir = await dir.getDirectoryHandle(part, { create: true });
			}
		} catch (error) {
			// Ignore EEXIST - directory already exists
			if (error.code !== 'EEXIST') {
				throw error;
			}
		}
	}

	async ready() {
		if (this.readyPromise) {
			await this.readyPromise;
		}
	}

	async close() {
		if (this.tree && this.isOpen) {
			await this.tree.close();
			this.isOpen = false;
		}
	}

	async clear() {
		await this.ready();
		this.cache.clear();
		if (this.tree) {
			this.tree = new BPlusTree(this.filePath, this.order);
			await this.tree.open();
		}
	}

	keys() {
		return this.cache.keys();
	}

	get(key) {
		return this.cache.get(key);
	}

	set(key, value) {
		this.cache.set(key, value);
		if (this.tree) {
			this.ready().then(() => this.tree.add(key, value)).catch(err => {
				console.error('PersistentDocumentStore set failed', err);
			});
		}
	}

	remove(key) {
		this.cache.delete(key);
		if (this.tree) {
			this.ready().then(() => this.tree.delete(key)).catch(err => {
				console.error('PersistentDocumentStore remove failed', err);
			});
		}
	}

	size() {
		return this.cache.size;
	}

	getAllDocuments() {
		return Array.from(this.cache.values());
	}
}
