/**
 * MicroMongoDB - Lightweight MongoDB-compatible database
 * Refactored into separate class files
 */

/**
 * MicroMongoDB.LocalStorageStore
 * 
 * Singleton
 */
export const LocalStorageStore = (function() {

	return {
		clear : function() {
			localStorage.clear();
		},
		get : function(i) {
			return JSON.parse(localStorage.getItem(localStorage.key(i)));
		},
		getStore : function() {
			return localStorage;
		},
		remove : function(key) {
			localStorage.removeItem(key);
		},
		set : async function(key,val) {
			localStorage.setItem(key,JSON.stringify(val));
		},
		size : function() {
			return localStorage.length;
		}
	};

})(); // MicroMongoDB.LocalStorageStore

/**
 * MicroMongoDB.ObjectStore
 * 
 * Public Constructor Function
 */
export const ObjectStore = function() {

	var objs = {};

	return {
		clear : function() {
			objs = {};
		},
		get : function(i) {
			return objs[Object.keys(objs)[i]];
		},
		getStore : function() {
			return objs;
		},
		remove : function(key) {
			delete objs[key];
		},
		set : function(key,val) {
			objs[key] = val;
		},
		size : function() {
			return Object.keys(objs).length;
		}
	}; // MicroMongoDB.ObjectStore return
}; // MicroMongoDB.ObjectStore

// Export refactored classes
export { MongoClient } from './src/MongoClient.js';
