# R-tree Geospatial Index

A JavaScript implementation of an R-tree data structure for efficient geospatial indexing and querying. This implementation is optimized for latitude/longitude coordinates and supports both bounding box and radius queries.

## Features

- **Point Insertion**: Add geospatial points with associated data
- **Point Removal**: Remove points from the index
- **Bounding Box Queries**: Find all points within a rectangular region
- **Radius Queries**: Find all points within a specified distance from a location
- **Haversine Distance**: Accurate distance calculations using Earth's curvature
- **Automatic Tree Balancing**: Efficient node splitting for optimal performance

## Installation

The R-tree is implemented as an ES6 module. Import it into your project:

```javascript
import { RTree } from './rtree.js';
```

## Usage

### Creating an R-tree

```javascript
const rtree = new RTree();
// Or specify max entries per node (default: 9)
const rtree = new RTree(15);
```

### Inserting Points

Add latitude/longitude points with associated data:

```javascript
rtree.insert(40.7128, -74.0060, { city: 'New York', country: 'USA' });
rtree.insert(51.5074, -0.1278, { city: 'London', country: 'UK' });
rtree.insert(35.6762, 139.6503, { city: 'Tokyo', country: 'Japan' });
```

### Bounding Box Queries

Find all points within a rectangular region:

```javascript
const results = rtree.searchBBox({
    minLat: 25,
    maxLat: 50,
    minLng: -125,
    maxLng: -70
});

results.forEach(entry => {
    console.log(entry.data.city); // Access the associated data
    console.log(entry.lat, entry.lng); // Access coordinates
});
```

### Radius Queries

Find all points within a radius (in kilometers) from a location:

```javascript
// Find all points within 500 km of New York
const nearbyPoints = rtree.searchRadius(40.7128, -74.0060, 500);

nearbyPoints.forEach(entry => {
    console.log(entry.data.city);
});
```

### Removing Points

Remove a point by its coordinates:

```javascript
// Remove by coordinates only
rtree.remove(40.7128, -74.0060);

// Remove specific point with matching data
rtree.remove(40.7128, -74.0060, { city: 'New York', country: 'USA' });
```

### Other Operations

```javascript
// Get total number of points
const count = rtree.size();

// Get all points
const allPoints = rtree.getAll();

// Clear all points
rtree.clear();
```

## Real-world Examples

### Restaurant Finder

```javascript
const rtree = new RTree();

// Add restaurants
rtree.insert(40.7580, -73.9855, { name: 'Italian Place', cuisine: 'Italian' });
rtree.insert(40.7589, -73.9851, { name: 'Sushi Bar', cuisine: 'Japanese' });
rtree.insert(40.7570, -73.9860, { name: 'Taco Shop', cuisine: 'Mexican' });

// Find restaurants within 1km
const nearby = rtree.searchRadius(40.7580, -73.9855, 1);
console.log(`Found ${nearby.length} nearby restaurants`);
```

### Ride-sharing App

```javascript
const drivers = new RTree();

// Add driver locations
drivers.insert(37.7749, -122.4194, { driver: 'Alice', available: true });
drivers.insert(37.7750, -122.4195, { driver: 'Bob', available: true });
drivers.insert(37.8000, -122.4500, { driver: 'Charlie', available: true });

// Find drivers near user (37.7749, -122.4194) within 2km
const nearbyDrivers = drivers.searchRadius(37.7749, -122.4194, 2);
```

### Store Locator

```javascript
const stores = new RTree();

// Add store locations
stores.insert(34.0522, -118.2437, { store: 'Store #1', chain: 'SuperMart' });
stores.insert(34.0530, -118.2440, { store: 'Store #2', chain: 'SuperMart' });

// Find stores in a region
const storesInArea = stores.searchBBox({
    minLat: 34.0,
    maxLat: 34.1,
    minLng: -118.3,
    maxLng: -118.2
});
```

## API Reference

### Constructor

#### `new RTree(maxEntries = 9)`

Creates a new R-tree instance.

- `maxEntries` (optional): Maximum number of entries per node (default: 9)

### Methods

#### `insert(lat, lng, data)`

Inserts a point into the R-tree.

- `lat`: Latitude (-90 to 90)
- `lng`: Longitude (-180 to 180)
- `data`: Associated data object

#### `remove(lat, lng, data = null)`

Removes a point from the R-tree.

- `lat`: Latitude
- `lng`: Longitude
- `data` (optional): Data object for exact matching
- Returns: `true` if removed, `false` if not found

#### `searchBBox(bbox)`

Searches for points within a bounding box.

- `bbox`: Object with `{minLat, maxLat, minLng, maxLng}`
- Returns: Array of matching entries

#### `searchRadius(lat, lng, radiusKm)`

Searches for points within a radius.

- `lat`: Center latitude
- `lng`: Center longitude
- `radiusKm`: Radius in kilometers
- Returns: Array of matching entries

#### `getAll()`

Returns all entries in the tree.

- Returns: Array of all entries

#### `size()`

Returns the number of entries in the tree.

- Returns: Number of entries

#### `clear()`

Removes all entries from the tree.

## Performance

The R-tree provides efficient spatial queries with the following characteristics:

- **Insertion**: O(log n) average case
- **Deletion**: O(log n) average case
- **Search**: O(log n + k) where k is the number of results
- **Memory**: O(n)

Benchmarks on a typical laptop:
- Insert 1,000 points: ~10-15ms
- Query with 1,000 points: <1ms for typical queries
- Insert 10,000 points: ~100-150ms

## Testing

Run the comprehensive test suite:

```bash
npm test test/test-rtree.js
```

The test suite includes:
- 35 unit tests covering all functionality
- Real-world geospatial scenarios
- Performance benchmarks
- Edge case handling
- Latitude/longitude specific tests

## Implementation Details

This R-tree implementation uses:

- **Linear split algorithm** for node overflow
- **Haversine formula** for accurate distance calculations on a sphere
- **Bounding box approximation** for radius queries (with precise distance filtering)
- **Automatic rebalancing** on deletion to maintain tree efficiency

## License

MIT License - Same as the parent project (mongo-local-db)

## Credits

Part of the [mongo-local-db](https://github.com/belteshazzar/mongo-local-db) project.
