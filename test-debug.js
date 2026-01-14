import * as path from 'path';
import { fileURLToPath } from 'url';
import { StorageManager } from 'node-opfs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname);
const opfsDir = path.join(projectRoot, '.opfs-test-debug');

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
const db = client.db('test-debug');
const collection = db.collection('testcol');

console.log('2. Inserting...');
await collection.insertOne({ _id: 1, name: 'Alice' });

console.log('3. Calling find()...');
const cursor = collection.find({});
console.log('4. Got cursor:', typeof cursor);

console.log('5. Awaiting cursor...');
const awaitedCursor = await cursor;
console.log('6. Cursor awaited:', typeof awaitedCursor);

console.log('7. Calling hasNext()...');
const hasNext = awaitedCursor.hasNext();
console.log('8. hasNext:', hasNext);

console.log('9. Calling next()...');
const doc = awaitedCursor.next();
console.log('10. Got doc:', doc);

await client.close();
console.log('Done!');
}

test().catch(err => {
console.error('Error:', err);
process.exit(1);
});
