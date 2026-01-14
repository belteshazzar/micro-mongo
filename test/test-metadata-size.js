import * as path from 'path';
import { fileURLToPath } from 'url';
import { StorageManager } from 'node-opfs';
import { expect } from 'chai';
import * as fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const opfsDir = path.join(projectRoot, '.opfs-metadata-test');

// Configure node-opfs
const customStorage = new StorageManager(opfsDir);
if (typeof globalThis.navigator === 'undefined') {
	globalThis.navigator = {};
}
globalThis.navigator.storage = {
	getDirectory: () => customStorage.getDirectory()
};

import { BPlusTree } from 'bjson/bplustree';
import { RTree } from 'bjson/rtree';
import { ObjectId } from 'bjson';

describe('BPlusTree Metadata Size Verification', function() {
	before(async function() {
		// Clean test directory
		try {
			await fs.rm(opfsDir, { recursive: true, force: true });
		} catch (e) {
			// Ignore
		}
	});

	after(async function() {
		// Clean up
		try {
			await fs.rm(opfsDir, { recursive: true, force: true });
		} catch (e) {
			// Ignore
		}
	});

	it('should verify BPlusTree metadata size', async function() {
		const tree = new BPlusTree('test-bplustree.bjson', 50);
		await tree.open();
		
		// Add some data
		await tree.add('key1', 'value1');
		await tree.add('key2', 'value2');
		
		// Close to ensure metadata is written
		await tree.close();
		
		// Check file size
		const filePath = path.join(opfsDir, 'test-bplustree.bjson');
		const stats = await fs.stat(filePath);
		const fileSize = stats.size;
		
		console.log(`\n  BPlusTree file size: ${fileSize} bytes`);
		
		// Read the last 111 bytes (claimed metadata size)
		const buffer = Buffer.alloc(111);
		const fd = await fs.open(filePath, 'r');
		await fd.read(buffer, 0, 111, fileSize - 111);
		await fd.close();
		
		console.log(`  Last 111 bytes (hex): ${buffer.toString('hex').substring(0, 100)}...`);
		console.log(`  Last 111 bytes (utf8): ${buffer.toString('utf8', 0, 50).replace(/[^\x20-\x7E]/g, '.')}`);
		
		// Try to read metadata at different offsets
		const testOffsets = [111, 110, 112, 120, 100];
		for (const size of testOffsets) {
			try {
				const testBuffer = Buffer.alloc(size);
				const testFd = await fs.open(filePath, 'r');
				await testFd.read(testBuffer, 0, size, fileSize - size);
				await testFd.close();
				
				// Check if it looks like valid bjson object (starts with 0x11 for OBJECT)
				if (testBuffer[0] === 0x11) {
					console.log(`  ✓ Offset ${size}: Looks like valid object (starts with 0x11)`);
					const sizeBytes = testBuffer.readUInt32LE(1);
					console.log(`    Object size from header: ${sizeBytes} bytes`);
				}
			} catch (e) {
				// Ignore
			}
		}
	});

	it('should verify RTree metadata size', async function() {
		const tree = new RTree('test-rtree.bjson', 9);
		await tree.open();
		
		// Add some data
		await tree.insert(10, 20, new ObjectId());
		await tree.insert(11, 21, new ObjectId());
		
		// Close to ensure metadata is written
		await tree.close();
		
		// Check file size
		const filePath = path.join(opfsDir, 'test-rtree.bjson');
		const stats = await fs.stat(filePath);
		const fileSize = stats.size;
		
		console.log(`\n  RTree file size: ${fileSize} bytes`);
		
		// Read the last 111 bytes
		const buffer = Buffer.alloc(111);
		const fd = await fs.open(filePath, 'r');
		await fd.read(buffer, 0, 111, fileSize - 111);
		await fd.close();
		
		console.log(`  Last 111 bytes (hex): ${buffer.toString('hex').substring(0, 100)}...`);
	});

	it('should compare metadata structures', async function() {
		// Create both trees
		const bptree = new BPlusTree('compare-bplustree.bjson', 50);
		const rtree = new RTree('compare-rtree.bjson', 9);
		
		await bptree.open();
		await rtree.open();
		
		await bptree.add('test', 'data');
		await rtree.insert(10, 20, new ObjectId());
		
		await bptree.close();
		await rtree.close();
		
		// Get file sizes
		const bpPath = path.join(opfsDir, 'compare-bplustree.bjson');
		const rtPath = path.join(opfsDir, 'compare-rtree.bjson');
		
		const bpSize = (await fs.stat(bpPath)).size;
		const rtSize = (await fs.stat(rtPath)).size;
		
		console.log(`\n  BPlusTree total size: ${bpSize} bytes`);
		console.log(`  RTree total size: ${rtSize} bytes`);
		
		// Read last 150 bytes from both to compare
		const bpBuffer = Buffer.alloc(150);
		const rtBuffer = Buffer.alloc(150);
		
		const bpFd = await fs.open(bpPath, 'r');
		const rtFd = await fs.open(rtPath, 'r');
		
		await bpFd.read(bpBuffer, 0, 150, Math.max(0, bpSize - 150));
		await rtFd.read(rtBuffer, 0, 150, Math.max(0, rtSize - 150));
		
		await bpFd.close();
		await rtFd.close();
		
		console.log(`\n  BPlusTree last 150 bytes:`);
		console.log(`    ${bpBuffer.toString('hex')}`);
		console.log(`\n  RTree last 150 bytes:`);
		console.log(`    ${rtBuffer.toString('hex')}`);
	});
});
