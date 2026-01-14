import * as path from 'path';
import { fileURLToPath } from 'url';
import { StorageManager } from 'node-opfs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname);
const opfsDir = path.join(projectRoot, '.opfs-test-debug2');

const customStorage = new StorageManager(opfsDir);
const opfsNavigator = {
storage: {
getDirectory: () => customStorage.getDirectory()
}
};

if (typeof globalThis.navigator === 'undefined') {
globalThis.navigator = opfsNavigator;
} else {
globalThis.navigator.storage = opfsNavigator.storage;
}

import { MongoClient } from './main.js';

async function test() {
console.log('1. Connecting...');
const client = await MongoClient.connect();
const db = client.db('test-debug2');
const collection = db.collection('testcol');

console.log('2. Inserting...');
const insertResult = await collection.insertOne({ _id: 1, name: 'Alice' });
console.log('2a. Insert result:', insertResult);

console.log('3. Checking collection state...');
console.log('3a. Collection _initialized:', collection._initialized);
console.log('3b. Collection documents:', collection.documents ? 'exists' : 'null');

console.log('4. Calling find()...');
const cursor = collection.find({});
console.log('4a. Cursor created');
console.log('4b. Cursor _documentsPromise:', cursor._documentsPromise ? 'exists' : 'null');

console.log('5. Testing _documentsPromise directly...');
try {
const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 5s')), 5000));
const docs = await Promise.race([cursor._documentsPromise, timeout]);
console.log('5a. Documents loaded:', docs ? docs.length : 'null');
} catch (err) {
console.log('5a. Error loading documents:', err.message);
}

await client.close();
console.log('Done!');
}

test().catch(err => {
console.error('Error:', err);
process.exit(1);
});
