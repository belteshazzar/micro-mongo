import * as path from 'path';
import { fileURLToPath } from 'url';
import { expect } from 'chai';
import { StorageManager } from 'node-opfs';
import { GeospatialIndex } from '../src/GeospatialIndex.js';
import { ObjectId } from 'bjson';

// Set up OPFS shim for bjson/rtree in Node
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const opfsDir = path.join(projectRoot, '.opfs');

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

function uniqueCollectionName() {
	return `geo-test-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

describe('GeospatialIndex (unit)', function() {
	this.timeout(10000);

	it('indexes and queries bounding boxes with string _id', async function() {
		const collectionName = uniqueCollectionName();
		const index = new GeospatialIndex('location_2dsphere', {location: '2dsphere'}, `${collectionName}_location.rtree.bjson`);
		await index.open();

    const loc1 = new ObjectId();
		await index.add({ _id: loc1, location: { type: 'Point', coordinates: [10, 20] } });

		const results = await index.query({ location: { $geoWithin: [[5, 25], [15, 15]] } });
		expect(results).to.deep.equal([loc1.toString()]);
		await index.close();
	});

	it('removes entries using the same string _id', async function() {
		const collectionName = uniqueCollectionName();
		const index = new GeospatialIndex('location_2dsphere',  {location: '2dsphere'}, `${collectionName}_location.rtree.bjson`);
		await index.open();

    const loc1 = new ObjectId();
    const loc2 = new ObjectId();
		await index.add({ _id: loc1, location: { type: 'Point', coordinates: [10, 20] } });
		await index.add({ _id: loc2, location: { type: 'Point', coordinates: [11, 21] } });

		await index.remove({ _id: loc1 });

		const results = await index.query({ location: { $geoWithin: [[5, 25], [15, 15]] } });
		expect(results).to.deep.equal([loc2.toString()]);

		await index.close();
	});

	it('persists to OPFS via bjson and can be reopened', async function() {
		const collectionName = uniqueCollectionName();
		const index = new GeospatialIndex('location_2dsphere', {location: '2dsphere'}, `${collectionName}_location.rtree.bjson`);
		await index.open();

    const loc1 = new ObjectId();
		await index.add({ _id: loc1, location: { type: 'Point', coordinates: [10, 20] } });
		await index.close();

		const reopened = new GeospatialIndex('location_2dsphere', {location: '2dsphere'}, `${collectionName}_location.rtree.bjson`);
		await reopened.open();
		const results = await reopened.query({ location: { $geoWithin: [[5, 25], [15, 15]] } });
		expect(results).to.deep.equal([loc1.toString()]);
		await reopened.close();
	});

	it('clears underlying bjson file and rebuilds empty tree', async function() {
		const collectionName = uniqueCollectionName();
		const index = new GeospatialIndex('location_2dsphere', {location: '2dsphere'}, `${collectionName}_location.rtree.bjson`);
		await index.open();

    const loc1 = new ObjectId();
		await index.add({ _id: loc1, location: { type: 'Point', coordinates: [10, 20] } });
		expect(await index.rtree.file.exists()).to.equal(true);

		await index.clear();

		const results = await index.query({ location: { $geoWithin: [[5, 25], [15, 15]] } });
		expect(results).to.deep.equal([]);
		expect(await index.rtree.file.exists()).to.equal(true);

		await index.close();
	});
});
