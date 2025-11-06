import { expect } from 'chai';
import { RTree } from '../rtree.js';

describe('RTree Geospatial Index', function() {
	
	describe('Basic Operations', function() {
		let rtree;

		beforeEach(function() {
			rtree = new RTree();
		});

		it('should create an empty R-tree', function() {
			expect(rtree.size()).to.equal(0);
		});

		it('should insert a single point', function() {
			rtree.insert(0, 0, { id: 1, name: 'Origin' });
			expect(rtree.size()).to.equal(1);
		});

		it('should insert multiple points', function() {
			rtree.insert(0, 0, { id: 1 });
			rtree.insert(10, 10, { id: 2 });
			rtree.insert(20, 20, { id: 3 });
			expect(rtree.size()).to.equal(3);
		});

		it('should retrieve all points', function() {
			rtree.insert(0, 0, { id: 1 });
			rtree.insert(10, 10, { id: 2 });
			const all = rtree.getAll();
			expect(all.length).to.equal(2);
			expect(all[0].data.id).to.be.oneOf([1, 2]);
			expect(all[1].data.id).to.be.oneOf([1, 2]);
		});

		it('should clear all points', function() {
			rtree.insert(0, 0, { id: 1 });
			rtree.insert(10, 10, { id: 2 });
			expect(rtree.size()).to.equal(2);
			rtree.clear();
			expect(rtree.size()).to.equal(0);
		});
	});

	describe('Point Removal', function() {
		let rtree;

		beforeEach(function() {
			rtree = new RTree();
		});

		it('should remove a single point', function() {
			rtree.insert(0, 0, { id: 1 });
			expect(rtree.size()).to.equal(1);
			const removed = rtree.remove(0, 0);
			expect(removed).to.be.true;
			expect(rtree.size()).to.equal(0);
		});

		it('should return false when removing non-existent point', function() {
			rtree.insert(0, 0, { id: 1 });
			const removed = rtree.remove(10, 10);
			expect(removed).to.be.false;
			expect(rtree.size()).to.equal(1);
		});

		it('should remove specific point by data', function() {
			rtree.insert(0, 0, { id: 1 });
			rtree.insert(0, 0, { id: 2 });
			expect(rtree.size()).to.equal(2);
			
			const removed = rtree.remove(0, 0, { id: 1 });
			expect(removed).to.be.true;
			expect(rtree.size()).to.equal(1);
			
			const remaining = rtree.getAll();
			expect(remaining[0].data.id).to.equal(2);
		});

		it('should handle removal from tree with many points', function() {
			// Insert many points to test tree restructuring
			for (let i = 0; i < 50; i++) {
				rtree.insert(i, i, { id: i });
			}
			expect(rtree.size()).to.equal(50);

			// Remove some points
			rtree.remove(25, 25);
			rtree.remove(30, 30);
			rtree.remove(35, 35);

			expect(rtree.size()).to.equal(47);
		});
	});

	describe('Bounding Box Queries', function() {
		let rtree;

		beforeEach(function() {
			rtree = new RTree();
			// Create a grid of points
			rtree.insert(0, 0, { id: 1, name: 'SW' });
			rtree.insert(0, 10, { id: 2, name: 'NW' });
			rtree.insert(10, 0, { id: 3, name: 'SE' });
			rtree.insert(10, 10, { id: 4, name: 'NE' });
			rtree.insert(5, 5, { id: 5, name: 'Center' });
		});

		it('should find points in a bounding box', function() {
			const results = rtree.searchBBox({
				minLat: -1,
				maxLat: 6,
				minLng: -1,
				maxLng: 6
			});
			
			expect(results.length).to.equal(2); // SW and Center
			const ids = results.map(r => r.data.id).sort();
			expect(ids).to.deep.equal([1, 5]);
		});

		it('should find all points in large bounding box', function() {
			const results = rtree.searchBBox({
				minLat: -10,
				maxLat: 20,
				minLng: -10,
				maxLng: 20
			});
			
			expect(results.length).to.equal(5);
		});

		it('should find no points outside bounding box', function() {
			const results = rtree.searchBBox({
				minLat: 20,
				maxLat: 30,
				minLng: 20,
				maxLng: 30
			});
			
			expect(results.length).to.equal(0);
		});

		it('should find points on bounding box edges', function() {
			const results = rtree.searchBBox({
				minLat: 0,
				maxLat: 10,
				minLng: 0,
				maxLng: 10
			});
			
			expect(results.length).to.equal(5); // All points
		});
	});

	describe('Radius Queries', function() {
		let rtree;

		beforeEach(function() {
			rtree = new RTree();
		});

		it('should find points within radius', function() {
			rtree.insert(0, 0, { id: 1 });
			rtree.insert(0.01, 0.01, { id: 2 }); // ~1.5 km away
			rtree.insert(1, 1, { id: 3 }); // ~157 km away
			
			const results = rtree.searchRadius(0, 0, 10); // 10 km radius
			
			expect(results.length).to.equal(2); // Points 1 and 2
			const ids = results.map(r => r.data.id).sort();
			expect(ids).to.deep.equal([1, 2]);
		});

		it('should find no points outside radius', function() {
			rtree.insert(10, 10, { id: 1 });
			rtree.insert(20, 20, { id: 2 });
			
			const results = rtree.searchRadius(0, 0, 10);
			
			expect(results.length).to.equal(0);
		});

		it('should find point at exact center', function() {
			rtree.insert(5, 5, { id: 1 });
			
			const results = rtree.searchRadius(5, 5, 1);
			
			expect(results.length).to.equal(1);
			expect(results[0].data.id).to.equal(1);
		});

		it('should handle large radius query', function() {
			rtree.insert(0, 0, { id: 1 });
			rtree.insert(10, 10, { id: 2 });
			rtree.insert(20, 20, { id: 3 });
			
			const results = rtree.searchRadius(10, 10, 5000); // 5000 km radius
			
			expect(results.length).to.equal(3); // All points within 5000 km
		});
	});

	describe('Latitude/Longitude Geospatial Use Cases', function() {
		let rtree;

		beforeEach(function() {
			rtree = new RTree();
		});

		it('should handle real city locations', function() {
			// Add major cities
			rtree.insert(40.7128, -74.0060, { city: 'New York' });
			rtree.insert(34.0522, -118.2437, { city: 'Los Angeles' });
			rtree.insert(41.8781, -87.6298, { city: 'Chicago' });
			rtree.insert(29.7604, -95.3698, { city: 'Houston' });
			rtree.insert(33.4484, -112.0740, { city: 'Phoenix' });
			
			expect(rtree.size()).to.equal(5);
			
			// Find cities near New York (within 500 km)
			const nearNY = rtree.searchRadius(40.7128, -74.0060, 500);
			expect(nearNY.length).to.be.at.least(1); // At least New York itself
			expect(nearNY.some(r => r.data.city === 'New York')).to.be.true;
		});

		it('should handle points across the equator', function() {
			rtree.insert(-10, 0, { location: 'South' });
			rtree.insert(0, 0, { location: 'Equator' });
			rtree.insert(10, 0, { location: 'North' });
			
			const results = rtree.searchBBox({
				minLat: -5,
				maxLat: 5,
				minLng: -5,
				maxLng: 5
			});
			
			expect(results.length).to.equal(1);
			expect(results[0].data.location).to.equal('Equator');
		});

		it('should handle points near the prime meridian', function() {
			rtree.insert(51.5074, -0.1278, { city: 'London' });
			rtree.insert(48.8566, 2.3522, { city: 'Paris' });
			rtree.insert(52.5200, 13.4050, { city: 'Berlin' });
			
			// Search around London
			const results = rtree.searchRadius(51.5074, -0.1278, 500);
			
			expect(results.length).to.be.at.least(1);
			expect(results.some(r => r.data.city === 'London')).to.be.true;
			expect(results.some(r => r.data.city === 'Paris')).to.be.true;
		});

		it('should find restaurants near a location', function() {
			// Simulate restaurant locations in a city
			rtree.insert(40.7580, -73.9855, { name: 'Restaurant A', type: 'Italian' });
			rtree.insert(40.7589, -73.9851, { name: 'Restaurant B', type: 'Chinese' });
			rtree.insert(40.7570, -73.9860, { name: 'Restaurant C', type: 'Mexican' });
			rtree.insert(40.7600, -73.9800, { name: 'Restaurant D', type: 'French' });
			rtree.insert(40.7500, -73.9900, { name: 'Restaurant E', type: 'Japanese' });
			
			// Find restaurants within 1 km of Times Square (40.7580, -73.9855)
			const nearby = rtree.searchRadius(40.7580, -73.9855, 1);
			
			expect(nearby.length).to.be.at.least(2);
			expect(nearby.some(r => r.data.name === 'Restaurant A')).to.be.true;
			expect(nearby.some(r => r.data.name === 'Restaurant B')).to.be.true;
		});

		it('should handle dense point clusters', function() {
			// Add 100 points in a small area
			for (let i = 0; i < 100; i++) {
				const lat = 40.7 + (Math.random() - 0.5) * 0.1; // ~5km range
				const lng = -74.0 + (Math.random() - 0.5) * 0.1;
				rtree.insert(lat, lng, { id: i });
			}
			
			expect(rtree.size()).to.equal(100);
			
			// Query a small area
			const results = rtree.searchRadius(40.7, -74.0, 2);
			expect(results.length).to.be.greaterThan(0);
		});

		it('should support updating point location via remove and insert', function() {
			rtree.insert(40.7128, -74.0060, { id: 'store-1', name: 'Store' });
			
			expect(rtree.size()).to.equal(1);
			
			// "Move" the store by removing and re-inserting
			rtree.remove(40.7128, -74.0060);
			rtree.insert(40.7500, -73.9900, { id: 'store-1', name: 'Store' });
			
			expect(rtree.size()).to.equal(1);
			
			// Verify new location
			const results = rtree.searchRadius(40.7500, -73.9900, 1);
			expect(results.length).to.equal(1);
			expect(results[0].data.name).to.equal('Store');
		});
	});

	describe('Performance with Large Datasets', function() {
		let rtree;

		beforeEach(function() {
			rtree = new RTree();
		});

		it('should handle 1000 insertions', function() {
			for (let i = 0; i < 1000; i++) {
				rtree.insert(
					Math.random() * 180 - 90,  // lat: -90 to 90
					Math.random() * 360 - 180, // lng: -180 to 180
					{ id: i }
				);
			}
			
			expect(rtree.size()).to.equal(1000);
		});

		it('should perform queries on large dataset efficiently', function() {
			// Insert 1000 random points
			for (let i = 0; i < 1000; i++) {
				rtree.insert(
					Math.random() * 180 - 90,
					Math.random() * 360 - 180,
					{ id: i }
				);
			}
			
			// Perform bounding box query
			const start = Date.now();
			const results = rtree.searchBBox({
				minLat: 0,
				maxLat: 10,
				minLng: 0,
				maxLng: 10
			});
			const elapsed = Date.now() - start;
			
			// Query should complete very quickly
			expect(elapsed).to.be.lessThan(100); // Less than 100ms
			expect(results.length).to.be.greaterThan(0);
		});

		it('should handle mixed operations on large dataset', function() {
			// Insert points
			for (let i = 0; i < 500; i++) {
				rtree.insert(i % 90, i % 180, { id: i });
			}
			
			// Remove some points
			for (let i = 0; i < 100; i += 5) {
				rtree.remove(i % 90, i % 180);
			}
			
			// Insert more points
			for (let i = 500; i < 600; i++) {
				rtree.insert(i % 90, i % 180, { id: i });
			}
			
			expect(rtree.size()).to.be.greaterThan(400);
		});
	});

	describe('Edge Cases', function() {
		let rtree;

		beforeEach(function() {
			rtree = new RTree();
		});

		it('should handle points at extreme latitudes', function() {
			rtree.insert(89.9, 0, { location: 'Near North Pole' });
			rtree.insert(-89.9, 0, { location: 'Near South Pole' });
			
			expect(rtree.size()).to.equal(2);
			
			const northResults = rtree.searchRadius(89.9, 0, 100);
			expect(northResults.length).to.equal(1);
			expect(northResults[0].data.location).to.equal('Near North Pole');
		});

		it('should handle points at extreme longitudes', function() {
			rtree.insert(0, 179.9, { location: 'Near Date Line East' });
			rtree.insert(0, -179.9, { location: 'Near Date Line West' });
			
			expect(rtree.size()).to.equal(2);
		});

		it('should handle duplicate points', function() {
			rtree.insert(10, 10, { id: 1 });
			rtree.insert(10, 10, { id: 2 });
			rtree.insert(10, 10, { id: 3 });
			
			expect(rtree.size()).to.equal(3);
			
			const results = rtree.searchBBox({
				minLat: 9,
				maxLat: 11,
				minLng: 9,
				maxLng: 11
			});
			
			expect(results.length).to.equal(3);
		});

		it('should handle empty tree queries', function() {
			const bboxResults = rtree.searchBBox({
				minLat: 0,
				maxLat: 10,
				minLng: 0,
				maxLng: 10
			});
			expect(bboxResults.length).to.equal(0);
			
			const radiusResults = rtree.searchRadius(0, 0, 100);
			expect(radiusResults.length).to.equal(0);
		});

		it('should handle zero-sized bounding box', function() {
			rtree.insert(5, 5, { id: 1 });
			rtree.insert(10, 10, { id: 2 });
			
			const results = rtree.searchBBox({
				minLat: 5,
				maxLat: 5,
				minLng: 5,
				maxLng: 5
			});
			
			expect(results.length).to.equal(1);
			expect(results[0].data.id).to.equal(1);
		});

		it('should handle very small radius queries', function() {
			rtree.insert(0, 0, { id: 1 });
			rtree.insert(0.0001, 0.0001, { id: 2 });
			
			const results = rtree.searchRadius(0, 0, 0.01); // 10 meters
			
			expect(results.length).to.equal(1);
			expect(results[0].data.id).to.equal(1);
		});
	});

	describe('Real-world Scenarios', function() {
		let rtree;

		beforeEach(function() {
			rtree = new RTree();
		});

		it('should support a ride-sharing app finding nearby drivers', function() {
			// Add driver locations
			rtree.insert(37.7749, -122.4194, { driver: 'Driver 1', available: true });
			rtree.insert(37.7750, -122.4195, { driver: 'Driver 2', available: true });
			rtree.insert(37.7748, -122.4193, { driver: 'Driver 3', available: false });
			rtree.insert(37.8000, -122.4500, { driver: 'Driver 4', available: true });
			
			// User requests ride at (37.7749, -122.4194)
			const nearbyDrivers = rtree.searchRadius(37.7749, -122.4194, 1);
			
			expect(nearbyDrivers.length).to.be.at.least(2);
			expect(nearbyDrivers.some(d => d.data.driver === 'Driver 1')).to.be.true;
		});

		it('should support a delivery app routing', function() {
			// Add delivery locations
			const deliveries = [
				{ lat: 40.7580, lng: -73.9855, order: 'Order 1', address: '123 Main St' },
				{ lat: 40.7589, lng: -73.9851, order: 'Order 2', address: '456 Oak Ave' },
				{ lat: 40.7600, lng: -73.9800, order: 'Order 3', address: '789 Elm St' },
				{ lat: 40.7500, lng: -73.9900, order: 'Order 4', address: '321 Pine St' }
			];
			
			deliveries.forEach(d => rtree.insert(d.lat, d.lng, d));
			
			// Find deliveries in a specific area
			const results = rtree.searchBBox({
				minLat: 40.7570,
				maxLat: 40.7610,
				minLng: -73.9900,
				maxLng: -73.9800
			});
			
			expect(results.length).to.be.greaterThan(0);
		});

		it('should support a store locator app', function() {
			// Add store locations
			rtree.insert(34.0522, -118.2437, { store: 'Store A', chain: 'Coffee Shop' });
			rtree.insert(34.0530, -118.2440, { store: 'Store B', chain: 'Coffee Shop' });
			rtree.insert(34.0600, -118.3000, { store: 'Store C', chain: 'Coffee Shop' });
			
			// User searches for stores near (34.0522, -118.2437)
			const nearbyStores = rtree.searchRadius(34.0522, -118.2437, 2);
			
			expect(nearbyStores.length).to.be.at.least(1);
			expect(nearbyStores.some(s => s.data.store === 'Store A')).to.be.true;
		});
	});
});
