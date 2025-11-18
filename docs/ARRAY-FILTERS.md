# Filtered Positional Operator with arrayFilters

Micro-Mongo now supports MongoDB's filtered positional operator `$[<identifier>]` with the `arrayFilters` option, allowing you to update array elements that match specific filter conditions.

## Overview

The filtered positional operator `$[<identifier>]` identifies array elements that match the `arrayFilters` conditions for an update operation. This is useful when you need to update specific elements in an array based on their values or properties.

## Syntax

```javascript
db.collection.updateOne(
  { <query> },
  { <update operator>: { "<array>.$[<identifier>].<field>": <value> } },
  { arrayFilters: [ { "<identifier>.<field>": <condition> } ] }
)
```

## Basic Usage

### Updating Object Array Elements

Update items with quantity less than or equal to 5:

```javascript
await db.products.insertOne({
  _id: 1,
  items: [
    { name: 'apple', quantity: 5 },
    { name: 'banana', quantity: 0 },
    { name: 'orange', quantity: 10 }
  ]
});

await db.products.updateOne(
  { _id: 1 },
  { $set: { 'items.$[elem].quantity': 100 } },
  { arrayFilters: [{ 'elem.quantity': { $lte: 5 } }] }
);

// Result: apple and banana quantity set to 100, orange remains 10
```

### Updating Simple Arrays

Update values in a simple array:

```javascript
await db.scores.insertOne({
  _id: 1,
  scores: [85, 92, 78, 95, 88]
});

await db.scores.updateOne(
  { _id: 1 },
  { $set: { 'scores.$[score]': 90 } },
  { arrayFilters: [{ 'score': { $lt: 90 } }] }
);

// Result: [90, 92, 90, 95, 90]
```

## Advanced Features

### Multiple Identifiers

Use multiple identifiers to update different arrays with different conditions:

```javascript
await db.school.updateOne(
  { _id: 1 },
  { 
    $set: { 
      'students.$[student].grade': 100,
      'courses.$[course].difficulty': 'medium'
    } 
  },
  { 
    arrayFilters: [
      { 'student.active': true },
      { 'course.difficulty': 'easy' }
    ] 
  }
);
```

### Complex Filter Conditions

Combine multiple conditions in a single filter:

```javascript
await db.inventory.updateOne(
  { _id: 1 },
  { $set: { 'items.$[elem].status': 'restock' } },
  { 
    arrayFilters: [{ 
      'elem.quantity': { $lt: 5 }, 
      'elem.price': { $gte: 5 } 
    }] 
  }
);

// Only items with quantity < 5 AND price >= 5 are updated
```

### Nested Arrays

Update elements in nested arrays:

```javascript
await db.students.insertOne({
  _id: 1,
  students: [
    {
      name: 'Alice',
      grades: [
        { subject: 'Math', score: 85 },
        { subject: 'English', score: 92 }
      ]
    },
    {
      name: 'Bob',
      grades: [
        { subject: 'Math', score: 78 },
        { subject: 'English', score: 88 }
      ]
    }
  ]
});

await db.students.updateOne(
  { _id: 1 },
  { $inc: { 'students.$[student].grades.$[grade].score': 5 } },
  { 
    arrayFilters: [
      { 'student.name': 'Alice' },
      { 'grade.score': { $lt: 90 } }
    ] 
  }
);

// Only Alice's Math grade is incremented (85 + 5 = 90)
```

## Supported Update Operators

The filtered positional operator works with all standard update operators:

- `$set`: Set field values
- `$inc`: Increment numeric values
- `$mul`: Multiply numeric values
- `$min`: Set to minimum value
- `$max`: Set to maximum value
- `$unset`: Remove fields
- And more...

### Example with $inc

```javascript
await db.products.updateOne(
  { _id: 1 },
  { $inc: { 'items.$[elem].price': 2 } },
  { arrayFilters: [{ 'elem.price': { $lte: 5 } }] }
);
```

### Example with $mul

```javascript
await db.products.updateOne(
  { _id: 1 },
  { $mul: { 'items.$[elem].price': 2 } },
  { arrayFilters: [{ 'elem.price': { $lte: 5 } }] }
);
```

## updateMany Support

The filtered positional operator also works with `updateMany`:

```javascript
await db.products.updateMany(
  {},
  { $set: { 'items.$[elem].quantity': 1 } },
  { arrayFilters: [{ 'elem.quantity': 0 }] }
);

// Updates matching array elements in ALL documents
```

## Supported Query Operators in arrayFilters

You can use any MongoDB query operators in your arrayFilters:

- Comparison: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`
- Logical: `$and`, `$or`, `$not`, `$nor`
- Element: `$exists`, `$type`
- Array: `$in`, `$nin`, `$all`
- And more...

Example:

```javascript
await db.products.updateOne(
  { _id: 1 },
  { $set: { 'items.$[elem].featured': true } },
  { arrayFilters: [{ 
    'elem.category': { $in: ['electronics', 'computers'] },
    'elem.price': { $gte: 100 }
  }] }
);
```

## Edge Cases

### No Matching Elements

If no array elements match the filter, no updates are performed:

```javascript
await db.products.updateOne(
  { _id: 1 },
  { $set: { 'items.$[elem].quantity': 0 } },
  { arrayFilters: [{ 'elem.quantity': { $lt: 0 } }] }
);

// No elements match, so no updates occur
```

### Empty Arrays

Empty arrays are handled gracefully:

```javascript
await db.products.insertOne({ _id: 1, items: [] });
await db.products.updateOne(
  { _id: 1 },
  { $set: { 'items.$[elem].quantity': 0 } },
  { arrayFilters: [{ 'elem.quantity': { $lt: 5 } }] }
);

// No error, items remains []
```

### Missing arrayFilters Option

If `arrayFilters` is not provided, the `$[identifier]` pattern is treated as a literal field name (for backward compatibility):

```javascript
await db.products.updateOne(
  { _id: 1 },
  { $set: { 'items.$[elem].quantity': 100 } }
  // No arrayFilters option
);

// Creates a literal field: items["$[elem]"].quantity = 100
```

## Best Practices

1. **Use descriptive identifiers**: Choose meaningful names like `$[item]`, `$[student]`, etc.
2. **Keep filters specific**: More specific filters prevent unintended updates
3. **Test with small datasets**: Verify your filters match the expected elements
4. **Combine with regular queries**: Use the query parameter to limit which documents are updated

## Comparison with Other Positional Operators

MongoDB has three types of positional operators:

1. **`$` (positional operator)**: Updates the first matching array element
2. **`$[]` (all positional operator)**: Updates all array elements
3. **`$[<identifier>]` (filtered positional operator)**: Updates array elements matching arrayFilters

Micro-Mongo now supports the filtered positional operator `$[<identifier>]`, providing fine-grained control over array updates.

## Performance Considerations

- The filtered positional operator iterates through array elements and applies the filter condition
- For large arrays, this may be slower than direct index access
- Consider creating indexes on frequently queried fields for better performance

## Limitations

- The identifier in `$[identifier]` must match an identifier in the arrayFilters
- Nested arrayFilters with the same identifier are not supported
- The arrayFilters option is only available for update operations

## Examples

See the test file `test/test-arrayfilters.js` for comprehensive examples of the filtered positional operator in action.
