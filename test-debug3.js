import * as path from 'path';
import { fileURLToPath } from 'url';
import { StorageManager } from 'node-opfs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname);
const opfsDir = path.join(projectRoot, '.opfs-test-debug3');

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
const db = client.db('test-debug3');
const collection = db.collection('testcol');

console.log('2. Inserting...');
await collection.insertOne({ _id: 1, name: 'Alice' });

console.log('3. Calling find()...');
const cursor = collection.find({});

console.log('4. Manually calling _ensureDocuments()...');
await cursor._ensureDocuments();
console.log('5. Documents loaded!');

console.log('6. Calling hasNext()...');
const hasNext = cursor.hasNext();
console.log('7. hasNext:', hasNext);

if (hasNext) {
console.log('8. Calling next()...');
const doc = cursor.next();
console.log('9. Got doc:', doc);
}

await client.close();
console.log('Done!');
}

test().catch(err => {
console.error('Error:', err);
process.exit(1);
});
