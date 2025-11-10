/**
 * Example usage of micro-mongo with MongoClient (similar to MongoDB driver)
 */

import { MongoClient, ObjectId } from './main.js';

// Create and connect to a client (async pattern like real MongoDB)
const client = await MongoClient.connect('mongodb://localhost:27017');

// Get a database reference
const db = client.db('myapp');

// ===== Dynamic Collection Creation (NEW!) =====
// Collections are now created automatically when you access them
// No need to call db.createCollection() first!

// ===== ObjectId Support (NEW!) =====
// ObjectIds are now used for _id fields by default (like real MongoDB)

// Just start using db.users - it will be created automatically
// _id will be automatically generated as an ObjectId
db.users.insertOne({ name: 'Alice', age: 30 });
db.users.insertMany([
  { name: 'Bob', age: 25 },
  { name: 'Charlie', age: 35 }
]);

// You can also create custom ObjectIds
const customId = new ObjectId();
db.users.insertOne({ _id: customId, name: 'Diana', age: 28 });

// Query by ObjectId
console.log('\nQuery by ObjectId:');
const diana = db.users.findOne({ _id: customId });
console.log(diana);

// ObjectId has useful methods
console.log('\nObjectId methods:');
console.log('Hex String:', customId.toHexString());
console.log('Timestamp:', customId.getTimestamp());
console.log('Equals:', customId.equals(diana._id));

// Same with db.products - auto-created on first access
db.products.insertMany([
  { name: 'Laptop', price: 999 },
  { name: 'Mouse', price: 25 },
  { name: 'Keyboard', price: 75 }
]);

// Query documents
console.log('\nUsers aged 30 or older:');
const users = db.users.find({ age: { $gte: 30 } });
while (users.hasNext()) {
  const user = users.next();
  console.log(`${user.name} (ID: ${user._id.toString()})`);
}

// Query with chaining (like real MongoDB)
console.log('\nProducts over $50:');
const expensiveProducts = db.products.find({ price: { $gt: 50 } }).toArray();
expensiveProducts.forEach(p => {
  console.log(`${p.name}: $${p.price} (ID: ${p._id})`);
});

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

// Create ObjectId from hex string
const hexId = '507f1f77bcf86cd799439011';
const oid = new ObjectId(hexId);
console.log('\nCreated ObjectId from hex:', oid.toString());

// Create ObjectId from timestamp
const timestamp = new Date('2023-01-01').getTime();
const timeBasedId = ObjectId.createFromTime(timestamp);
console.log('ObjectId from timestamp:', timeBasedId.toString());
console.log('Extracted timestamp:', timeBasedId.getTimestamp());

// List all collections
console.log('\nAll collections:', db.getCollectionNames());

// Close the connection
await client.close();

console.log('\nDone!');
