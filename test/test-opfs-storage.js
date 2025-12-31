import { expect } from 'chai';
import * as path from 'path';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("OPFS Storage Location", function() {
	let opfsNavigator;
	let projectDir;
	let testOpfsDir;

	before(async function() {
		// Get project root directory
		projectDir = path.resolve(__dirname, '..');
		testOpfsDir = path.join(projectDir, '.opfs-test');
		
		// Clean up test directory
		try {
			await fs.rm(testOpfsDir, { recursive: true, force: true });
		} catch (e) {
			// Ignore if doesn't exist
		}
	});

	after(async function() {
		// Clean up test directory
		try {
			await fs.rm(testOpfsDir, { recursive: true, force: true });
		} catch (e) {
			// Ignore
		}
	});

	it('should use custom directory when configured', async function() {
		// Import node-opfs dynamically after setting up globals
		const { StorageManager } = await import('node-opfs');
		
		// Create a custom storage manager with our test directory
		const customStorage = new StorageManager(testOpfsDir);
		
		// Get directory to ensure it's created
		const root = await customStorage.getDirectory();
		
		// Verify the directory was created
		const stats = await fs.stat(testOpfsDir);
		expect(stats.isDirectory()).to.be.true;
		
		// Create a test file
		const fileHandle = await root.getFileHandle('test-file.txt', { create: true });
		const writable = await fileHandle.createWritable();
		await writable.write('test content');
		await writable.close();
		
		// Verify file exists in the correct location
		const filePath = path.join(testOpfsDir, 'test-file.txt');
		const fileContent = await fs.readFile(filePath, 'utf-8');
		expect(fileContent).to.equal('test content');
	});

	it('should show default node-opfs location', async function() {
		const { StorageManager } = await import('node-opfs');
		const defaultStorage = new StorageManager();
		const defaultDir = defaultStorage.getBaseDir();
		
		console.log(`\n  Default node-opfs directory: ${defaultDir}`);
		console.log(`  Project directory: ${projectDir}`);
		console.log(`  Expected .opfs directory: ${path.join(projectDir, '.opfs')}`);
		
		// Show they're different
		expect(defaultDir).to.not.equal(path.join(projectDir, '.opfs'));
	});

	it('should use project .opfs when navigator.storage is properly configured', async function() {
		const opfsDir = path.join(projectDir, '.opfs');
		
		// Clean up
		try {
			await fs.rm(opfsDir, { recursive: true, force: true });
		} catch (e) {
			// Ignore
		}
		
		// Import and configure node-opfs
		const { StorageManager } = await import('node-opfs');
		const customStorage = new StorageManager(opfsDir);
		
		// Set global navigator.storage to use our custom storage
		const customNavigator = {
			storage: {
				getDirectory: () => customStorage.getDirectory()
			}
		};
		
		// Now when bjson uses navigator.storage.getDirectory(), it will use our directory
		const root = await customNavigator.storage.getDirectory();
		
		// Create a file
		const fileHandle = await root.getFileHandle('bjson-test.bjson', { create: true });
		const writable = await fileHandle.createWritable();
		await writable.write('bjson data');
		await writable.close();
		
		// Verify file is in project .opfs directory
		const filePath = path.join(opfsDir, 'bjson-test.bjson');
		const exists = await fs.access(filePath).then(() => true).catch(() => false);
		expect(exists).to.be.true;
		
		const content = await fs.readFile(filePath, 'utf-8');
		expect(content).to.equal('bjson data');
		
		console.log(`\n  ✓ File created in project .opfs: ${filePath}`);
	});
});
