# Aggregation Pipeline Stages - Examples

This document provides examples for all aggregation pipeline stages supported by micro-mongo, with a focus on the newly implemented stages.

## Table of Contents

1. [$sortByCount](#sortbycount)
2. [$replaceRoot / $replaceWith](#replaceroot--replacewith)
3. [$sample](#sample)
4. [$bucket](#bucket)
5. [$bucketAuto](#bucketauto)
6. [$out](#out)
7. [$merge](#merge)
8. [$lookup](#lookup)
9. [$graphLookup](#graphlookup)
10. [$facet](#facet)
11. [$redact](#redact)
12. [$geoNear](#geonear)

---

## $sortByCount

Groups documents by a specified expression and counts the number of documents in each group, sorted by count in descending order.

### Basic Example

```javascript
// Count products by category
const results = db.products.aggregate([
  { $sortByCount: '$category' }
]);

// Result:
// [
//   { _id: 'Electronics', count: 45 },
//   { _id: 'Clothing', count: 38 },
//   { _id: 'Books', count: 22 }
// ]
```

### With Expression

```javascript
// Count users by age range
const results = db.users.aggregate([
  {
    $sortByCount: {
      $cond: [
        { $gte: ['$age', 18] },
        'adult',
        'minor'
      ]
    }
  }
]);

// Result:
// [
//   { _id: 'adult', count: 150 },
//   { _id: 'minor', count: 25 }
// ]
```

---

## $replaceRoot / $replaceWith

Promotes a specified document to the top level, replacing all other fields.

### $replaceRoot Example

```javascript
// Extract user details as root document
const results = db.users.aggregate([
  {
    $replaceRoot: {
      newRoot: '$details'
    }
  }
]);

// Input: { name: 'Alice', details: { age: 30, city: 'NYC' } }
// Output: { age: 30, city: 'NYC' }
```

### $replaceWith Example

```javascript
// Replace with computed values
const results = db.orders.aggregate([
  {
    $replaceWith: {
      orderId: '$_id',
      total: { $multiply: ['$price', '$quantity'] },
      customer: '$customerName'
    }
  }
]);
```

---

## $sample

Randomly selects the specified number of documents from the input.

### Basic Example

```javascript
// Get 5 random products
const results = db.products.aggregate([
  { $sample: { size: 5 } }
]);
```

### With Filter

```javascript
// Get 3 random products from Electronics category
const results = db.products.aggregate([
  { $match: { category: 'Electronics' } },
  { $sample: { size: 3 } }
]);
```

---

## $bucket

Categorizes documents into buckets based on a specified expression and bucket boundaries.

### Basic Example

```javascript
// Group products by price ranges
const results = db.products.aggregate([
  {
    $bucket: {
      groupBy: '$price',
      boundaries: [0, 50, 100, 200, 500],
      default: 'Other'
    }
  }
]);

// Result:
// [
//   { _id: 0, count: 15 },     // $0-$49
//   { _id: 50, count: 30 },    // $50-$99
//   { _id: 100, count: 20 },   // $100-$199
//   { _id: 200, count: 5 }     // $200-$499
// ]
```

### With Custom Output

```javascript
// Group with average price per bucket
const results = db.products.aggregate([
  {
    $bucket: {
      groupBy: '$price',
      boundaries: [0, 50, 100, 200],
      output: {
        count: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        products: { $push: '$name' }
      }
    }
  }
]);
```

---

## $bucketAuto

Automatically determines bucket boundaries to evenly distribute documents into a specified number of buckets.

### Basic Example

```javascript
// Auto-create 4 price buckets
const results = db.products.aggregate([
  {
    $bucketAuto: {
      groupBy: '$price',
      buckets: 4
    }
  }
]);

// Result (auto-calculated boundaries):
// [
//   { _id: { min: 5, max: 25 }, count: 10 },
//   { _id: { min: 25, max: 50 }, count: 12 },
//   { _id: { min: 50, max: 100 }, count: 11 },
//   { _id: { min: 100, max: 500 }, count: 9 }
// ]
```

### With Custom Output

```javascript
const results = db.products.aggregate([
  {
    $bucketAuto: {
      groupBy: '$price',
      buckets: 3,
      output: {
        count: { $sum: 1 },
        avgPrice: { $avg: '$price' }
      }
    }
  }
]);
```

---

## $out

Writes the aggregation pipeline results to a specified collection, replacing the collection if it exists.

### Example

```javascript
// Export filtered and transformed data to new collection
db.orders.aggregate([
  { $match: { status: 'completed' } },
  { $project: { customer: 1, total: 1, date: 1 } },
  { $out: 'completed_orders' }
]);

// Results are now in db.completed_orders
// Original pipeline returns empty array
```

---

## $merge

Merges aggregation results into an existing collection with configurable behavior for matched and unmatched documents.

### Basic Merge

```javascript
// Merge updated user data
db.updatedUsers.aggregate([
  {
    $merge: 'users'  // Merges into users collection
  }
]);
```

### With Options

```javascript
db.newProducts.aggregate([
  {
    $merge: {
      into: 'products',
      on: '_id',                    // Match on _id field
      whenMatched: 'replace',       // Replace existing docs
      whenNotMatched: 'insert'      // Insert new docs
    }
  }
]);

// whenMatched options: 'replace', 'merge', 'keepExisting', 'fail'
// whenNotMatched options: 'insert', 'discard', 'fail'
```

---

## $lookup

Performs a left outer join with another collection.

### Basic Example

```javascript
// Join orders with customer details
const results = db.orders.aggregate([
  {
    $lookup: {
      from: 'customers',
      localField: 'customerId',
      foreignField: '_id',
      as: 'customerInfo'
    }
  }
]);

// Result:
// {
//   _id: 1,
//   customerId: 'C123',
//   total: 100,
//   customerInfo: [
//     { _id: 'C123', name: 'Alice', email: 'alice@example.com' }
//   ]
// }
```

### Multiple Matches

```javascript
// Join orders with order items
const results = db.orders.aggregate([
  {
    $lookup: {
      from: 'orderItems',
      localField: '_id',
      foreignField: 'orderId',
      as: 'items'
    }
  }
]);

// items array will contain all matching order items
```

---

## $graphLookup

Performs a recursive search on a collection, following references to build a graph structure.

### Organizational Hierarchy Example

```javascript
// Find all employees reporting to a manager (direct and indirect)
const results = db.employees.aggregate([
  { $match: { name: 'Alice' } },  // Start with Alice
  {
    $graphLookup: {
      from: 'employees',
      startWith: '$_id',
      connectFromField: '_id',
      connectToField: 'reportsTo',
      as: 'allReports'
    }
  }
]);

// Result includes all employees in Alice's reporting chain
```

### With Max Depth

```javascript
// Find only direct reports (1 level)
const results = db.employees.aggregate([
  { $match: { name: 'Alice' } },
  {
    $graphLookup: {
      from: 'employees',
      startWith: '$_id',
      connectFromField: '_id',
      connectToField: 'reportsTo',
      as: 'directReports',
      maxDepth: 0  // Only immediate children
    }
  }
]);
```

### With Depth Field

```javascript
// Track depth level for each employee
const results = db.employees.aggregate([
  { $match: { name: 'CEO' } },
  {
    $graphLookup: {
      from: 'employees',
      startWith: '$_id',
      connectFromField: '_id',
      connectToField: 'reportsTo',
      as: 'orgChart',
      depthField: 'level'  // Adds 'level' field to each doc
    }
  }
]);
```

---

## $facet

Processes multiple aggregation pipelines within a single stage on the same set of input documents.

### Basic Example

```javascript
// Analyze products from multiple perspectives
const results = db.products.aggregate([
  {
    $facet: {
      categoryCounts: [
        { $sortByCount: '$category' }
      ],
      priceStats: [
        {
          $group: {
            _id: null,
            avgPrice: { $avg: '$price' },
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' }
          }
        }
      ],
      topExpensive: [
        { $sort: { price: -1 } },
        { $limit: 5 },
        { $project: { name: 1, price: 1 } }
      ]
    }
  }
]);

// Result:
// [{
//   categoryCounts: [{ _id: 'Electronics', count: 45 }, ...],
//   priceStats: [{ avgPrice: 75.50, minPrice: 5, maxPrice: 500 }],
//   topExpensive: [{ name: 'Laptop', price: 500 }, ...]
// }]
```

### Complex Multi-Facet Analysis

```javascript
const results = db.sales.aggregate([
  { $match: { date: { $gte: new Date('2024-01-01') } } },
  {
    $facet: {
      byRegion: [
        { $group: { _id: '$region', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } }
      ],
      byProduct: [
        { $group: { _id: '$product', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ],
      timeSeries: [
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
            monthlyTotal: { $sum: '$amount' }
          }
        },
        { $sort: { _id: 1 } }
      ]
    }
  }
]);
```

---

## $redact

Restricts the content of documents based on information stored in the documents themselves.

### Security Level Example

```javascript
// Filter documents by security level
const results = db.documents.aggregate([
  {
    $redact: {
      $cond: {
        if: { $lte: ['$securityLevel', 3] },
        then: '$$KEEP',      // Keep this document
        else: '$$PRUNE'      // Remove this document
      }
    }
  }
]);
```

### Visibility Flag Example

```javascript
// Show only public content
const results = db.content.aggregate([
  {
    $redact: {
      $cond: {
        if: '$isPublic',
        then: '$$DESCEND',   // Include and check nested docs
        else: '$$PRUNE'      // Remove this branch
      }
    }
  }
]);
```

### Complex Conditions

```javascript
// Multi-condition redaction
const results = db.records.aggregate([
  {
    $redact: {
      $cond: {
        if: {
          $or: [
            { $eq: ['$status', 'public'] },
            { $eq: ['$owner', currentUserId] }
          ]
        },
        then: '$$KEEP',
        else: '$$PRUNE'
      }
    }
  }
]);
```

---

## $geoNear

Returns documents sorted by distance from a specified point, with distance calculation included.

### Basic Example

```javascript
// Find restaurants near a location
const results = db.restaurants.aggregate([
  {
    $geoNear: {
      near: [-73.9667, 40.78],  // [longitude, latitude]
      distanceField: 'distance',
      spherical: true  // Use spherical distance
    }
  }
]);

// Result (sorted by distance):
// [
//   { name: 'Pizza Place', location: [...], distance: 150 },
//   { name: 'Burger Joint', location: [...], distance: 320 },
//   ...
// ]
```

### With Distance Filters

```javascript
// Find stores within 5km
const results = db.stores.aggregate([
  {
    $geoNear: {
      near: [-122.4194, 37.7749],
      distanceField: 'distanceMeters',
      maxDistance: 5000,     // 5km in meters
      minDistance: 100,      // At least 100m away
      spherical: true
    }
  }
]);
```

### With Limit

```javascript
// Find 10 nearest coffee shops
const results = db.places.aggregate([
  {
    $geoNear: {
      near: [-0.1276, 51.5074],  // London coordinates
      distanceField: 'distance',
      spherical: true,
      limit: 10
    }
  },
  { $match: { type: 'coffee_shop' } }
]);
```

### Planar Distance

```javascript
// Use planar (Euclidean) distance for small areas or game maps
const results = db.gameObjects.aggregate([
  {
    $geoNear: {
      near: [100, 100],  // X, Y coordinates
      distanceField: 'distance',
      spherical: false  // Use Euclidean distance
    }
  }
]);
```

---

## Combining Multiple Stages

### Complex E-commerce Analysis

```javascript
const analysis = db.orders.aggregate([
  // Filter to last 30 days
  {
    $match: {
      date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }
  },
  
  // Join with customer data
  {
    $lookup: {
      from: 'customers',
      localField: 'customerId',
      foreignField: '_id',
      as: 'customer'
    }
  },
  
  // Unwind customer array
  { $unwind: '$customer' },
  
  // Multi-faceted analysis
  {
    $facet: {
      revenueByRegion: [
        { $group: { _id: '$customer.region', revenue: { $sum: '$total' } } },
        { $sort: { revenue: -1 } }
      ],
      topCustomers: [
        { $group: { _id: '$customerId', spent: { $sum: '$total' } } },
        { $sort: { spent: -1 } },
        { $limit: 10 }
      ],
      priceBrackets: [
        {
          $bucketAuto: {
            groupBy: '$total',
            buckets: 5,
            output: {
              count: { $sum: 1 },
              avgOrder: { $avg: '$total' }
            }
          }
        }
      ]
    }
  }
]);
```

---

## MongoDB Compatibility Notes

All stages are implemented according to MongoDB documentation. Key differences for an in-memory browser database:

1. **Performance**: In-memory operations are faster but limited by browser memory
2. **$geoNear**: Supports both spherical (Haversine) and planar (Euclidean) distance
3. **$merge/$out**: Writes to in-memory collections (use storage engines for persistence)
4. **Collection References**: Collections are auto-created on first access via Proxy

For complete MongoDB compatibility details, see the [MongoDB Aggregation Pipeline documentation](https://docs.mongodb.com/manual/core/aggregation-pipeline/).
