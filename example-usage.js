/**
 * Example usage of micro-mongo with MongoClient (similar to MongoDB driver)
 */

import { MongoClient } from './main.js';

// Create and connect to a client (async pattern like real MongoDB)
const client = await MongoClient.connect('mongodb://localhost:27017');

// Get a database reference
const db = client.db('myapp');

// ===== Dynamic Collection Creation (NEW!) =====
// Collections are now created automatically when you access them
// No need to call db.createCollection() first!

// Just start using db.users - it will be created automatically
db.users.insertOne({ name: 'Alice', age: 30 });
db.users.insertMany([
  { name: 'Bob', age: 25 },
  { name: 'Charlie', age: 35 }
]);

// Same with db.products - auto-created on first access
db.products.insertMany([
  { name: 'Laptop', price: 999 },
  { name: 'Mouse', price: 25 },
  { name: 'Keyboard', price: 75 }
]);

// Query documents
console.log('Users aged 30 or older:');
const users = db.users.find({ age: { $gte: 30 } });
while (users.hasNext()) {
  console.log(users.next());
}

// Query with chaining (like real MongoDB)
console.log('\nProducts over $50:');
const expensiveProducts = db.products.find({ price: { $gt: 50 } }).toArray();
console.log(expensiveProducts);

// Update documents
db.users.updateOne({ name: 'Alice' }, { $set: { age: 31 } });

// Delete documents
db.users.deleteOne({ name: 'Bob' });

// Aggregation pipeline
console.log('\nAverage product price:');
const avgPrice = db.products.aggregate([
  { $group: { _id: null, avgPrice: { $avg: '$price' } } }
]);
console.log(avgPrice);

// List all collections
console.log('\nAll collections:', db.getCollectionNames());

// Close the connection
await client.close();

console.log('\nDone!');
