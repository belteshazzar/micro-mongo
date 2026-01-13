/**
 * Example usage of micro-mongo with MongoClient (similar to MongoDB driver)
 */

import { MongoClient, ObjectId } from './main.js';
import { StorageManager } from 'node-opfs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Set up OPFS polyfill for Node.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const opfsDir = path.join(__dirname, '.opfs');

const storageManager = new StorageManager(opfsDir);
const opfsNavigator = {
  storage: {
    getDirectory: () => storageManager.getDirectory()
  }
};

if (typeof globalThis.navigator === 'undefined') {
  globalThis.navigator = opfsNavigator;
} else {
  globalThis.navigator.storage = opfsNavigator.storage;
}

async function main() {

  console.time('connect');
  // Create and connect to a client (async pattern like real MongoDB)
  let client = await MongoClient.connect('mongodb://localhost:27017');
  // Get a database reference
  let db = client.db('myapp');
  await db.posts.createIndex({ body: "text" });
  await db.posts.createIndex({ category: 1 });
  await db.posts.createIndex({ likes: 1 });
  console.timeEnd('connect');

  console.time('inserts');
  await db.posts.insertOne({
    title: "Post Title 1",
    body: "Body of post.",
    category: "News",
    likes: 1,
    tags: ["news", "events"],
    date: new Date()
  })
  await db.posts.insertMany([
    {
      title: "Post Title 2",
      body: "Body of post.",
      category: "Event",
      likes: 2,
      tags: ["news", "events"],
      date: new Date()
    },
    {
      title: "Post Title 3",
      body: "Body of post.",
      category: "Technology",
      likes: 3,
      tags: ["news", "events"],
      date: new Date()
    },
    {
      title: "Post Title 4",
      body: "Body of post.",
      category: "Event",
      likes: 4,
      tags: ["news", "events"],
      date: new Date()
    }
  ])
  console.timeEnd('inserts');

  console.time('queries');
  console.log((await (await db.posts.find({})).toArray()).length);
  console.log((await (await db.posts.find({ $text: { $search: "post" } })).toArray()).length);
  console.log((await (await db.posts.find({ likes: { $gt: 2 } })).toArray()).length);
  console.timeEnd('queries');

  await client.close();

}

// Run the main function
main().catch(console.error);

