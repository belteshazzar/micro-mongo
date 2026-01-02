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
		// Chain writes to avoid overlapping mutations on the underlying file
		this.writeQueue = Promise.resolve();
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
					error.message.includes('Invalid tree file') ||
					error.message.includes('File is empty')))) {
				// Delete corrupted file and ensure directory exists
				await this._deleteFile(this.filePath);
				await this._ensureDirectoryForFile(this.filePath);

				// Create fresh BPlusTree
				this.tree = new BPlusTree(this.filePath, this.order);
				await this.tree.open();
				this.isOpen = true;
			} else {
				throw error;
			}
		}
	}

	async _deleteFile(filePath) {
		if (!filePath) return;
		try {
			const pathParts = filePath.split('/').filter(Boolean);
			const filename = pathParts.pop();

			let dir = await globalThis.navigator.storage.getDirectory();
			for (const part of pathParts) {
				dir = await dir.getDirectoryHandle(part, { create: false });
			}
			await dir.removeEntry(filename);
		} catch (error) {
			// Ignore errors - file might not exist
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
			await this._deleteFile(this.filePath);
			await this._ensureDirectoryForFile(this.filePath);
			this.tree = new BPlusTree(this.filePath, this.order);
			try {
				await this.tree.open();
			} catch (error) {
				if (error.code === 'ENOENT' ||
						(error.message && (error.message.includes('Failed to read metadata') ||
						error.message.includes('missing required fields') ||
						error.message.includes('Unknown type byte') ||
						error.message.includes('Invalid tree') ||
						error.message.includes('Invalid tree file') ||
						error.message.includes('File is empty')))) {
					// Retry with a fresh file
					await this._deleteFile(this.filePath);
					await this._ensureDirectoryForFile(this.filePath);
					this.tree = new BPlusTree(this.filePath, this.order);
					await this.tree.open();
				} else {
					throw error;
				}
			}
		}
	}

	keys() {
		return this.cache.keys();
	}

	get(key) {
		return this.cache.get(key);
	}

	async set(key, value) {
		this.cache.set(key, value);
		if (!this.tree) {
			return;
		}

		this.writeQueue = this.writeQueue.then(async () => {
			await this.ready();
			try {
				await this.tree.add(key, value);
			} catch (err) {
				console.error('PersistentDocumentStore set failed', err);
				// If write fails with corruption error, try to recover
				if (err.message && (err.message.includes('Expected Pointer') ||
						err.message.includes('Invalid tree') ||
						err.message.includes('ENOENT') ||
						err.message.includes('File is empty'))) {
					console.warn('Attempting to recover from tree corruption...');
					await this._recover();
				}
			}
		});

		return this.writeQueue;
	}

	async remove(key) {
		this.cache.delete(key);
		if (!this.tree) {
			return;
		}

		this.writeQueue = this.writeQueue.then(async () => {
			await this.ready();
			try {
				await this.tree.delete(key);
			} catch (err) {
				console.error('PersistentDocumentStore remove failed', err);
				// If delete fails with corruption error, try to recover
				if (err.message && (err.message.includes('Expected Pointer') ||
						err.message.includes('Invalid tree') ||
						err.message.includes('ENOENT') ||
						err.message.includes('File is empty'))) {
					console.warn('Attempting to recover from tree corruption...');
					await this._recover();
				}
			}
		});

		return this.writeQueue;
	}

	async _recover() {
		try {
			// Close corrupted tree
			if (this.isOpen && this.tree) {
				try {
					await this.tree.close();
				} catch (e) {
					// Ignore close errors
				}
			}

			// Delete corrupted file and recreate
			await this._deleteFile(this.filePath);
			await this._ensureDirectoryForFile(this.filePath);

			// Create fresh tree
			this.tree = new BPlusTree(this.filePath, this.order);
			await this.tree.open();

			// Repopulate from cache
			for (const [key, value] of this.cache.entries()) {
				await this.tree.add(key, value);
			}

			this.isOpen = true;
			console.log('Successfully recovered from tree corruption');
		} catch (err) {
			console.error('Failed to recover from tree corruption:', err);
		}
	}

	size() {
		return this.cache.size;
	}

	getAllDocuments() {
		return Array.from(this.cache.values());
	}
}
