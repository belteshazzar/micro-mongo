
import {Txi} from 'txi'
import * as de9im from 'de9im';

/**
 * MicroMongoDB.copy (Private Function)
 */
function copy(o) {
   var out, v, key;
   out = Array.isArray(o) ? [] : {};
   for (key in o) {
       v = o[key];
       out[key] = (typeof v === "object") ? copy(v) : v;
   }
   return out;
}

/**
 * MicroMongoDB.getProp (Private Function)
 */
function getProp(obj,name) {
	var path = name.split("\.");
	var result = obj[path[0]];
	for (var i=1 ; i<path.length ; i++) {
		if (result==undefined || result==null) return result;
		result = result[path[i]];
	}
	return result;
}

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

/**
 * MicroMongoDB.DB (Public Constructor)
 */
export function DB(options) {

	/**
	 * MicroMongoDB.DB.log (Private Function)
	 * 
	 * @param {String} msg The message to display.
	 */
	function log(msg) {
		if (options && options.print) options.print(msg);
		else console.log(msg);
	}

	/**
	 * MicroMongoDB.DB.id (Private Function)
	 */
	function id() {
		if (options && options.id) return options.id();
		else return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
	}

	/**
	 * MicroMongoDB.DB.toArray (Private Function)
	 */
	function toArray(obj) {
		var arr = [];
		for (var key in obj) {
			if (obj.hasOwnProperty(key)) {
				var el = {};
				el[key] = obj[key];
				arr.push(el);
			}
		}
		return arr;
	}

	/**
	 * MicroMongoDB.DB.tlMatches
	 * 
	 * Private Function
	 */
	function tlMatches(doc,query) {
		var key = Object.keys(query)[0];
		var value = query[key];
		if (key.charAt(0)=="$") {
			if (key=="$and") return and(doc,value);
			else if (key=="$or") return or(doc,value);
			else if (key=="$not") return not(doc,value);
			else if (key=="$nor") return nor(doc,value);
			else if (key=="$where") return where(doc,value);
			else throw { $err : "Can't canonicalize query: BadValue unknown top level operator: " + key, code: 17287 };
		} else {
			return opMatches(doc,key,value);
		}
	}

	/**
	 * MicroMongoDB.DB.opMatches
	 * 
	 * Private Function
	 */
	function opMatches(doc,key,value) {
		if (typeof(value)=="string") return getProp(doc,key)==value;
		else if (typeof(value)=="number") return getProp(doc,key)==value;
		else if (typeof(value)=="boolean") return getProp(doc,key)==value;
		else if (typeof(value)=="object") {
			if (value instanceof RegExp) return getProp(doc,key) && getProp(doc,key).match(value);
			else if (isArray(value)) return getProp(doc,key) && arrayMatches(getProp(doc,key),value);
			else {
				var keys = Object.keys(value);
				if (keys[0].charAt(0)=="$") {
					for (var i=0 ; i<keys.length ; i++) {
						var operator = Object.keys(value)[i];
						var operand = value[operator];
						if (operator=="$eq") {
							if (getProp(doc,key)==undefined || !(getProp(doc,key) == operand)) return false;
						} else if (operator=="$gt") {
							if (getProp(doc,key)==undefined || !(getProp(doc,key) > operand)) return false;
						} else if (operator=="$gte") {
							if (getProp(doc,key)==undefined || !(getProp(doc,key) >= operand)) return false;
						} else if (operator=="$lt") {
							if (getProp(doc,key)==undefined || !(getProp(doc,key) < operand)) return false;
						} else if (operator=="$lte") {
							if (getProp(doc,key)==undefined || !(getProp(doc,key) <= operand)) return false;
						} else if (operator=="$ne") {
							if (getProp(doc,key)==undefined || !(getProp(doc,key) != operand)) return false;
						} else if (operator=="$in") {
							if (getProp(doc,key)==undefined || !isIn(getProp(doc,key),operand)) return false;
						} else if (operator=="$nin") {
							if (getProp(doc,key)==undefined ||  isIn(getProp(doc,key),operand)) return false;
						} else if (operator=="$exists") {
							if (operand?getProp(doc,key)==undefined:getProp(doc,key)!=undefined) return false;
						} else if (operator=="$type") {
							if (typeof(getProp(doc,key))!=operand) return false;
						} else if (operator=="$mod") {
							if (operand.length!=2) throw { $err : "Can't canonicalize query: BadValue malformed mod, not enough elements", code : 17287 };
							if (getProp(doc,key)==undefined || (getProp(doc,key) % operand[0] != operand[1])) return false;
						} else if (operator=="$regex") {
							if (getProp(doc,key)==undefined || !getProp(doc,key).match(operand)) return false;
						} else if (operator=="$text") {
							if (getProp(doc,key)==undefined ||  !text(getProp(doc,key),operand)) return false;
						} else if (operator=="$geoWithin") {
							if (getProp(doc,key)==undefined ||  !geoWithin(getProp(doc,key),operand)) return false;
						} else if (operator=="$not") {
							if (opMatches(doc,key,operand)) return false;
						} else {
							throw { $err : "Can't canonicalize query: BadValue unknown operator: " + operator, code : 17287 };
						}
					}
					return true;
				} else {
					return getProp(doc,key) && objectMatches(getProp(doc,key),value);
				}
			}
		}
	} // MicroMongoDB.DB.opMatches

	/**
	 * MicroMongoDB.DB.text
	 * 
	 * Private Function
	 */
	function text(prop,query) {
		const txi = new Txi().index('id',prop)
		const search = txi.search(query)
		return search.length == 1
	}

	//   { "type": "Feature",
	//   "geometry": {
	// 	"type": "Polygon",
	// 	"coordinates": [[
	// 	  [-10.0, -10.0], [10.0, -10.0], [10.0, 10.0], [-10.0, 10.0]
	// 	  ]]
	// 	}
	//   ...
	//   }

	function bboxToGeojson(bbox) {
		const minLon = bbox[0][0]
		const maxLat = bbox[0][1]
		const maxLon = bbox[1][0]
		const minLat = bbox[1][1]
		return {
			type: 'FeatureCollection',
			features: [{
				type: 'Feature',
				properties: {},
				geometry: {
					type: 'Polygon',
					coordinates: [[
						[minLon,maxLat],
						[minLon,minLat],
						[maxLon,minLat],
						[maxLon,maxLat],
						[minLon,maxLat]
					]]
				}
			}]
		}
	}

	/**
	 * MicroMongoDB.DB.geoWithin
	 * 
	 * Private Function
	 */
	 function geoWithin(prop,query) {
		try {
			return de9im.default.within(prop,bboxToGeojson(query),false)
		} catch (e) {
			return false
		}
	}

	/**
	 * MicroMongoDB.DB.and
	 * 
	 * Private Function
	 */
	function and(doc,els) {
		for (var i=0 ; i<els.length ; i++) {
			if (!tlMatches(doc,els[i])) {
				return false;
			}
		}
		return true;
	}

	/**
	 * MicroMongoDB.DB.or
	 * 
	 * Private Function
	 */
	function or(doc,els) {
		for (var i=0 ; i<els.length ; i++) {
			if (tlMatches(doc,els[i])) return true;
		}
		return false;
	}

	/**
	 * MicroMongoDB.DB.nor
	 * 
	 * Private Function
	 */
	function nor(doc,els) {
		for (var i=0 ; i<operand.length ; i++) {
			if (tlMatches(doc,els[i])) return false;
		}
		return true;
	}
	
	/**
	 * MicroMongoDB.DB.isArray
	 * 
	 * Private Function
	 */
	function isArray(o) {
		return Array == o.constructor;
	}

	/**
	 * MicroMongoDB.DB.matches
	 * 
	 * Private Function
	 */
	// query structure: (top level operators ( "age" : (operators) ))
	// top,top level query, implicit $and
	function matches(doc,query) {
		return and(doc,toArray(query));
	}

	/**
	 * MicroMongoDB.DB.isIn
	 * 
	 * Private Function
	 */
	function isIn(val,values) {
		for (var i=0 ; i<values.length ; i++) if (values[i]==val) return true;
		return false;
	}

	/**
	 * MicroMongoDB.DB.arrayMatches
	 * 
	 * Private Function
	 */
	function arrayMatches(x,y) {
		if (x.length!=y.length) return false;
		for (var i=0 ; i<x.length ; i++) {
			if (x[i]===y[i]) continue;
			if (typeof(x[i])!=typeof(y[i])) return false;
			if (typeof(x[i]=="object")) {
				if (isArray(x[i])) {
					if (!arrayMatches(x,y)) return false;
				} else {
					if (!objectMatches(x[i],y[i])) return false;
				}
			} else {
				if (x[i] != y[i]) return false;
			}
		}
		return true;
	}

	/**
	 * MicroMongoDB.DB.objectMatches
	 * 
	 * Private Function
	 */
	function objectMatches( x, y ) {
		  for ( var p in x ) {
		    if ( ! x.hasOwnProperty( p ) ) continue;
		    if ( ! y.hasOwnProperty( p ) ) return false;
		    if ( x[ p ] === y[ p ] ) continue;
		    if (typeof(x[p]) != typeof(y[p])) return false;
		    if (typeof(x[i])=="object") {
		    	if (isArray(x[i])) {
		    		if (!arrayMatches(x[i],y[i])) return false;
		    	} else {
		    		if (!objectMatches(x[i],y[i])) return false;
		    	}
		    } else {
		    	if (x[i]!=y[i]) return false;
		    }
		  }
		  for ( p in y ) {
		    if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) ) return false;
		  }
		  return true;
	}

	/**
	 * MicroMongoDB.DB.applyProjection
	 * 
	 * Private Function
	 */
	function applyProjection(projection, doc) {
		var result = {};
		var keys = Object.keys(projection);
		if (keys.length==0) return doc;
		else if (projection[keys[0]]) {
			// inclusion with _id
			result._id = doc._id;
			for (var i=0 ; i<keys.length ; i++) {
				if (!projection[keys[i]]) throw { $err: "Can't canonicalize query: BadValue Projection cannot have a mix of inclusion and exclusion.", code: 17287 };
				result[keys[i]] = doc[keys[i]];
			}
		} else {
			// exclusion
			for (var key in doc) {
				result[key] = doc[key];
			}
			for (var i=0 ; i<keys.length ; i++) {
				if (projection[keys[i]]) throw { $err: "Can't canonicalize query: BadValue Projection cannot have a mix of inclusion and exclusion.", code: 17287 };
				delete result[keys[i]];
			}
		}
		return result;
	} // MicroMongoDB.DB.applyProjection

	/**
	 * MicroMongoDB.DB.applyUpdates
	 * 
	 * Private Function
	 */
	// TODO support dot notation eg: "metrics.orders" and '$'
	function applyUpdates(updates,doc,setOnInsert) {
		var keys = Object.keys(updates);
		for (var i=0 ; i<keys.length ; i++) {
			var key = keys[i];
			var value = updates[key];
			if (key=="$inc") {
				var fields = Object.keys(value);
				for (var j=0 ; j<fields.length ; j++) {
					var field = fields[j];
					var amount = value[field];
					doc[field] = doc[field] + amount;
				}
			} else if (key=="$mul") {
				var fields = Object.keys(value);
				for (var j=0 ; j<fields.length ; j++) {
					var field = fields[j];
					var amount = value[field];
					doc[field] = doc[field] * amount;
				}
			} else if (key=="$rename") {
				var fields = Object.keys(value);
				for (var j=0 ; j<fields.length ; j++) {
					var field = fields[j];
					var newName = value[field];
					doc[newName] = doc[field];
					delete doc[field];
				}
			} else if (key=="$setOnInsert" && setOnInsert) {
				var fields = Object.keys(value);
				for (var j=0 ; j<fields.length ; j++) {
					doc[fields[j]] = value[fields[j]];
				}
			} else if (key=="$set") {
				var fields = Object.keys(value);
				for (var j=0 ; j<fields.length ; j++) {
					doc[fields[j]] = value[fields[j]];
				}
			} else if (key=="$unset") {
				var fields = Object.keys(value);
				for (var j=0 ; j<fields.length ; j++) {
					delete doc[fields[j]];
				}
			} else if (key=="$min") {
				var fields = Object.keys(value);
				for (var j=0 ; j<fields.length ; j++) {
					var field = fields[j];
					var amount = value[field];
					doc[field] = Math.min(doc[field],amount);
				}
			} else if (key=="$max") {
				var fields = Object.keys(value);
				for (var j=0 ; j<fields.length ; j++) {
					var field = fields[j];
					var amount = value[field];
					doc[field] = Math.max(doc[field],amount);
				}
			} else if (key=="$currentDate") {  // TODO not the same as mongo
				var fields = Object.keys(value);
				for (var j=0 ; j<fields.length ; j++) {
					doc[fields[j]] = new Date();
				}
			} else if (key=="$addToSet") {
				var fields = Object.keys(value);
				for (var j=0 ; j<fields.length ; j++) {
					var field = fields[j];
					var value = value[field];
					doc[field].push(value);
				}
			} else if (key=="$pop") {
				var fields = Object.keys(value);
				for (var j=0 ; j<fields.length ; j++) {
					var field = fields[j];
					var value = value[field];
					if (value==1) {
						doc[field].pop();
					} else if (value==-1) {
						doc[field].shift();
					}
				}
			} else if (key=="$pullAll") {
				var fields = Object.keys(value);
				for (var j=0 ; j<fields.length ; j++) {
					var src = doc[fields[j]];
					var toRemove = value[fields[j]];
					var notRemoved = [];
					for (var k=0 ; k<src.length ; k++) {
						var removed = false;
						for (var l=0 ; l<toRemove.length ; l++) {
							if (src[k]==toRemove[l]) {
								removed = true;
								break;
							}
						}
						if (!removed) notRemoved.push(src[k]);
					}
					doc[fields[j]] = notRemoved;
				}
			} else if (key=="$pushAll") {
				var fields = Object.keys(value);
				for (var j=0 ; j<fields.length ; j++) {
					var field = fields[j];
					var values = value[field];
					for (var k=0 ; k<values.length ; k++) {
						doc[field].push(values[k]);
					}
				}
			} else if (key=="$push") {
				var fields = Object.keys(value);
				for (var j=0 ; j<fields.length ; j++) {
					var field = fields[j];
					doc[field].push(value[field]);
				}
			} else if (key=="$bit") {
				var field = Object.keys(value)[0];
				var operation = value[field];
				var operator = Object.keys(operation)[0];
				var operand = operation[operator];
				if (operator=="and") {
					doc[field] = doc[field] & operand;
				} else if (operator=="or") {
					doc[field] = doc[field] | operand;
				} else if (operator=="xor") {
					doc[field] = doc[field] ^ operand;
				} else {
					throw "unknown $bit operator: " + operator;
				}
			} else {
				throw "unknown update operator: " + key;
			}
		}
	} // MicroMongoDB.DB.applyUpdates

	/**
	 * MicroMongoDB.DB.createDocFromUpdate
	 * 
	 * Private Function
	 */
	function createDocFromUpdate(query,updates) {
		var newDoc = { _id : id() };
		var onlyFields = true;
		var updateKeys = Object.keys(updates);
		for (var i=0 ; i<updateKeys.length ; i++) {
			if (updateKeys[i].charAt(0)=="$") {
				onlyFields = false;
				break;
			}
		}
		if (onlyFields) {
			for (var i=0 ; i<updateKeys.length ; i++) {
				newDoc[updateKeys[i]] = updates[updateKeys[i]];
			}
		} else {
			var queryKeys = Object.keys(query);
			for (var i=0 ; i<queryKeys.length ; i++) {
				newDoc[queryKeys[i]] = query[queryKeys[i]];
			}  
			applyUpdates(updates,newDoc,true);
		}
		return newDoc;
	} // MicroMongoDB.DB.createDocFromUpdate


	/**
	 * MicroMongoDB.DB.Collection
	 * 
	 * Private Constructor Function 
	 */
	function Collection(db,storage) {

		/**
		 * MicroMongoDB.DB.Collection.Cursor
		 * 
		 * Private Constructor Function
		 */
		function Cursor(collection,query,projection) {
			var pos = 0;
			var max = 0;

			// false == unknown
			// null == no more
			// !null == next
			var next = false;

			function findNext() {
				while (pos<collection.count() && (max==0 || pos<max)) {
					var cur = storage.get(pos++);
					if (matches(cur,query)) {
						next = cur;
						return;
					}
				}
				next = null;
			}

			this.batchSize = function() { throw "Not Implemented"; };
			this.close = function() { throw "Not Implemented"; };
			this.comment = function() { throw "Not Implemented"; };
			this.count = function() {
				var num = 0;
				var c = new Cursor(collection,query);
				while (c.hasNext()) {
					num++;
					c.next();
				}
				return num;
			};
			this.explain = function() { throw "Not Implemented"; };
			this.forEach = function(fn) {
				while (this.hasNext()) {
					fn(this.next());
				}
			};
			this.hasNext = function() {
				if (next===false) findNext();
				return next != null;
			};
			this.hint = function() { throw "Not Implemented"; };
			this.itcount = function() { throw "Not Implemented"; };
			this.limit = function(_max) {
				max = _max;
				return this;
			};
			this.map = function(fn) {
				var results = [];
				while (this.hasNext()) {
					results.push(fn(this.next()));
				}
				return results;
			};
			this.maxScan = function() { throw "Not Implemented"; };
			this.maxTimeMS = function() { throw "Not Implemented"; };
			this.max = function() { throw "Not Implemented"; };
			this.min = function() { throw "Not Implemented"; };
			this.next = function() {
				if (next==null) throw "Error: error hasNext: false";
				var result = next;
				findNext();
				if (projection) return applyProjection(projection,result);
				else return result;
			};
			this.noCursorTimeout = function() { throw "Not Implemented"; };
			this.objsLeftInBatch = function() { throw "Not Implemented"; };
			this.pretty = function() { throw "Not Implemented"; };
			this.readConcern = function() { throw "Not Implemented"; };
			this.readPref = function() { throw "Not Implemented"; };
			this.returnKey = function() { throw "Not Implemented"; };
			this.showRecordId = function() { throw "Not Implemented"; };
			this.size = function() { throw "Not Implemented"; };
			this.skip = function(num) {
				while (num>0) {
					this.next();
					num--;
				}
				return this;
			};
			this.snapshot = function() { throw "Not Implemented"; };
			this.sort = function(s) {
				return new SortedCursor(collection,query,this,s);
			};
			this.tailable = function() { throw "Not Implemented"; };
			this.toArray = function() {
				var results = [];
				while (this.hasNext()) {
					results.push(this.next());
				}
				return results;
			};

			this.next();
		} // MicroMongoDB.DB.Collection.Cursor

		/**
		 * MicroMongoDB.DB.Collection.SortedCursor
		 * 
		 * Private Constructor Function
		 */
		function SortedCursor(collection,query,cursor,sort) {
			var pos = 0;
			var items = [];
			while (cursor.hasNext()) {
				items.push(cursor.next());
			}
			var sortKeys = Object.keys(sort);
			items.sort(function(a,b) {
				for (var i=0 ; i<sortKeys.length ; i++) {
					if (a[sortKeys[i]]==undefined && b[sortKeys[i]]!=undefined) return -1*sort[sortKeys[i]]; 
					if (a[sortKeys[i]]!=undefined && b[sortKeys[i]]==undefined) return  1*sort[sortKeys[i]]; 
					if (a[sortKeys[i]] < b[sortKeys[i]]) return -1*sort[sortKeys[i]];
					if (a[sortKeys[i]] > b[sortKeys[i]]) return 1*sort[sortKeys[i]];
				}
				return 0;
			});
			this.batchSize = function() { throw "Not Implemented"; };
			this.close = function() { throw "Not Implemented"; };
			this.comment  = function() { throw "Not Implemented"; };
			this.count = function() {
				return items.length;
			};
			this.explain = function() { throw "Not Implemented"; };
			this.forEach = function(fn) {
				while (this.hasNext()) {
					fn(this.next());
				}
			};
			this.hasNext = function() {
				return pos<items.length;
			};
			this.hint = function() { throw "Not Implemented"; };
			this.itcount = function() { throw "Not Implemented"; };
			this.limit = function(max) {
				items = items.slice(0,max);
				return this;
			};
			this.map = function(fn) {
				var results = [];
				while (this.hasNext()) {
					results.push(fn(this.next()));
				}
				return results;
			};
			this.maxScan = function() { throw "Not Implemented"; };
			this.maxTimeMS = function() { throw "Not Implemented"; };
			this.max = function() { throw "Not Implemented"; };
			this.min = function() { throw "Not Implemented"; };
			this.next = function() {
				return items[pos++];
			};
			this.noCursorTimeout = function() { throw "Not Implemented"; };
			this.objsLeftInBatch = function() { throw "Not Implemented"; };
			this.pretty = function() { throw "Not Implemented"; };
			this.readConcern = function() { throw "Not Implemented"; };
			this.readPref = function() { throw "Not Implemented"; };
			this.returnKey = function() { throw "Not Implemented"; };
			this.showRecordId = function() { throw "Not Implemented"; };
			this.size = function() { throw "Not Implemented"; };
			this.skip = function(num) {
				while (num>0) {
					this.next();
					num--;
				}
				return this;
			};
			this.snapshot = function() { throw "Not Implemented"; };
			this.sort = function(s) {
				return new SortedCursor(collection,query,this,s);
			};
			this.tailable = function() { throw "Not Implemented"; };
			this.toArray = function() {
				var results = [];
				while (this.hasNext()) {
					results.push(this.next());
				}
				return results;
			};
		} // MicroMongoDB.DB.Collection.SortedCursor

		/**
		 * MicroMongoDB.DB.Collection
		 * 
		 * Public Members
		 */
		return {
			isCollection : true, // TODO used by dropDatabase, ugly
			aggregate : function() { throw "Not Implemented"; },
			bulkWrite : function() { throw "Not Implemented"; },
			count : function() {
				return storage.size();
			},
			copyTo : function(destCollectionName) {
				if (!db[destCollectionName]) {
					db.createCollection(destCollectionName);
				}
				var destCol = db[destCollectionName];
				var numCopied = 0;
				var c = this.find({});
				while (c.hasNext()) {
					destCol.insertOne(c.next());
					numCopied++;
				}
				return numCopied;
			},
			createIndex : function() { throw "Not Implemented"; },
			dataSize : function() { throw "Not Implemented"; },
			deleteOne : function(query) {
				var doc = this.findOne(query);
				if (doc) {
					storage.remove(doc._id);
					return { deletedCount : 1 };
				} else {
					return { deletedCount : 0 };
				}
			},
			deleteMany : function(query) {
				var c = this.find(query);
				var ids = [];
				while (c.hasNext()) {
					ids.push(c.next()._id);
				}
				var deletedCount = ids.length;
				for (var i=0 ; i<ids.length ; i++) {
					storage.remove(ids[i]);
				}
				return { deletedCount : deletedCount };
			},
			distinct : function(field,query) {
				var vals = {};
				var c = this.find(query);
				while (c.hasNext()) {
					var d = c.next();
					if (d[field]) {
						vals[d[field]] = true;
					}
				}
				return Object.keys(vals);
			},
			drop : function() {
				storage.clear();
			},
			dropIndex : function() { throw "Not Implemented"; },
			dropIndexes : function() { throw "Not Implemented"; },
			ensureIndex : function() { throw "Not Implemented"; },
			explain : function() { throw "Not Implemented"; },
			find : function(query,projection) {
				return new Cursor(this,(query==undefined?{}:query),projection)
			},
			findAndModify : function() { throw "Not Implemented"; },
			findOne : function(query,projection) {
				var cursor = this.find(query,projection);
				if (cursor.hasNext()) {
					return cursor.next();
				} else {
					return null;
				}
			},
			findOneAndDelete : function(filter,options) {
				var c = this.find(filter);
				if (options && options.sort) c = c.sort(options.sort);
				if (!c.hasNext()) return null;
				var doc = c.next();
				storage.remove(doc._id);
				if (options && options.projection) return applyProjection(options.projection,doc);
				else return doc;
			},
			findOneAndReplace : function(filter,replacement,options) {
				var c = this.find(filter);
				if (options && options.sort) c = c.sort(options.sort);
				if (!c.hasNext()) return null;
				var doc = c.next();
				replacement._id = doc._id;
				storage.set(doc._id,replacement);
				if (options && options.returnNewDocument) doc = replacement;
				if (options && options.projection) return applyProjection(options.projection,doc);
				else return doc;
			},
			findOneAndUpdate : function(filter,update,options) {
				var c = this.find(filter);
				if (options && options.sort) c = c.sort(options.sort);
				if (!c.hasNext()) return null;
				var doc = c.next();
				var clone = Object.assign({},doc);
				applyUpdates(update,clone);
				storage.set(doc._id,clone);
				if (options && options.returnNewDocument) doc = clone;
				if (options && options.projection) return applyProjection(options.projection,doc);
				else return doc;
			},
			getIndexes : function() { throw "Not Implemented"; },
			getShardDistribution : function() { throw "Not Implemented"; },
			getShardVersion : function() { throw "Not Implemented"; },
			// non-mongo
			getStore : function() {
				return storage.getStore();
			},
			group : function() { throw "Not Implemented"; },
			insert : function(doc) {
				if (Array == doc.constructor) {
					this.insertMany(doc);
				} else {
					this.insertOne(doc);
				}
			},
			insertOne : function(doc) {
				if (doc._id==undefined) doc._id = id();
				storage.set(doc._id,doc);
			},
			insertMany : function(docs) {
				for (var i=0 ; i<docs.length ; i++) {
					this.insertOne(docs[i]);
				}
			},
			isCapped : function() { throw "Not Implemented"; },
			mapReduce : function() { throw "Not Implemented"; },
			reIndex : function() { throw "Not Implemented"; },
			replaceOne : function(query,replacement,options) { // only replace
				// first
				var result = {};
				var c = this.find(query);
				result.matchedCount = c.count();
				if (result.matchedCount==0) {
					result.modifiedCount = 0;
					if (options && options.upsert) {
						replacement._id = id();
						storage.set(replacement._id,replacement);
						result.upsertedId = replacement._id;
					}
				} else {
					result.modifiedCount = 1;
					var doc = c.next();
					replacement._id = doc._id;
					storage.set(doc._id,replacement);
				}
				return result;
			},
			remove : function(query,options) {
				var c = this.find(query);
				if (!c.hasNext()) return;
				if (options===true || (options && options.justOne)) {
					var doc = c.next();
					storage.remove(doc._id);
				} else {
					while (c.hasNext()) {
						storage.remove(c.next()._id);
					}
				}
			},
			renameCollection : function() { throw "Not Implemented"; },
			save : function() { throw "Not Implemented"; },
			stats : function() { throw "Not Implemented"; },
			storageSize : function() { throw "Not Implemented"; },
			totalSize : function() { throw "Not Implemented"; },
			totalIndexSize : function() { throw "Not Implemented"; },
			update : function(query,updates,options) {
				var c = this.find(query);
				if (c.hasNext()) {
					if (options && options.multi) {
						while (c.hasNext()) {
							var doc = c.next();
							applyUpdates(updates,doc);
							storage.set(doc._id,doc);
						}
					} else {
						var doc = c.next();
						applyUpdates(updates,doc);
						storage.set(doc._id,doc);
					}
				} else {
					if (options && options.upsert) {
						var doc = createDocFromUpdate(query,updates);
						storage.set(doc._id,doc);
					}
				}
			},
			updateOne : function(query,updates,options) {
				var c = this.find(query);
				if (c.hasNext()) {
					var doc = c.next();
					applyUpdates(updates,doc);
					storage.set(doc._id,doc);
				} else {
					if (options && options.upsert) {
						var doc = createDocFromUpdate(query,updates);
						storage.set(doc._id,doc);
					}
				}
			},
			updateMany : function(query,updates,options) {
				var c = this.find(query);
				if (c.hasNext()) {
					while (c.hasNext()) {
						var doc = c.next();
						applyUpdates(updates,doc);
						storage.set(doc._id,doc);
					}
				} else {
					if (options && options.upsert) {
						var doc = createDocFromUpdate(query,updates);
						storage.set(doc._id,doc);
					}
				}
			},
			validate : function() { throw "Not Implemented"; }
		}; // MicroMongoDB.DB.Collection return
	}; // MicroMongoDB.DB.Collection

	/**
	 * MicroMongoDB.DB
	 * 
	 * Public Members
	 */
	return {
		cloneCollection : function() { throw "Not Implemented"; },
		cloneDatabase : function() { throw "Not Implemented"; },
		commandHelp : function() { throw "Not Implemented"; },
		copyDatabase : function() { throw "Not Implemented"; },
		createCollection : function(name) {
			if (!name) return;
			if (name=="localStorage") this.localStorage = new Collection(this,(options.localStorage?options.localStorage:LocalStorageStore));
			else this[name] = new Collection(this,(options && options.storage?new options.storage():new ObjectStore()));
		},
		currentOp : function() { throw "Not Implemented"; },
		dropDatabase : function() {
			for (var key in this) {
				if (this[key]!=null && this[key].isCollection) {
					this[key].drop(); // drop the contents
					delete this[key];
				}
			}
		},
		eval : function() { throw "Not Implemented"; },
		fsyncLock : function() { throw "Not Implemented"; },
		fsyncUnlock : function() { throw "Not Implemented"; },
		getCollection : function() { throw "Not Implemented"; },
		getCollectionInfos : function() { throw "Not Implemented"; },
		getCollectionNames : function() {
			var names = [];
			for (var key in this) {
				if (this[key]!=null && this[key].isCollection) {
					names.push(key);
				}
			}
			return names;
		},
		getLastError : function() { throw "Not Implemented"; },
		getLastErrorObj : function() { throw "Not Implemented"; },
		getLogComponents : function() { throw "Not Implemented"; },
		getMongo : function() { throw "Not Implemented"; },
		getName : function() { throw "Not Implemented"; },
		getPrevError : function() { throw "Not Implemented"; },
		getProfilingLevel : function() { throw "Not Implemented"; },
		getProfilingStatus : function() { throw "Not Implemented"; },
		getReplicationInfo : function() { throw "Not Implemented"; },
		getSiblingDB : function() { throw "Not Implemented"; },
		help : function() {
			log("        help mr                      mapreduce");
			log("        db.foo.find()                list objects in collection foo");
			log("        db.foo.find( { a : 1 } )     list objects in foo where a == 1");
			log("        it                           result of the last line evaluated; use to further iterate");
		},
		hostInfo : function() { throw "Not Implemented"; },
		isMaster : function() { throw "Not Implemented"; },
		killOp : function() { throw "Not Implemented"; },
		listCommands : function() { throw "Not Implemented"; },
		loadServerScripts : function() { throw "Not Implemented"; },
		localStorage : (typeof localStorage!="undefined"?new Collection(this,LocalStorageStore):null),
		logout : function() { throw "Not Implemented"; },
		printCollectionStats : function() { throw "Not Implemented"; },
		printReplicationInfo : function() { throw "Not Implemented"; },
		printShardingStatus : function() { throw "Not Implemented"; },
		printSlaveReplicationInfo : function() { throw "Not Implemented"; },
		repairDatabase : function() { throw "Not Implemented"; },
		resetError : function() { throw "Not Implemented"; },
		runCommand : function() { throw "Not Implemented"; },
		serverBuildInfo : function() { throw "Not Implemented"; },
		serverCmdLineOpts : function() { throw "Not Implemented"; },
		serverStatus : function() { throw "Not Implemented"; },
		setLogLevel : function() { throw "Not Implemented"; },
		setProfilingLevel : function() { throw "Not Implemented"; },
		shutdownServer : function() { throw "Not Implemented"; },
		stats : function() { throw "Not Implemented"; },
		version : function() { throw "Not Implemented"; },
		upgradeCheck : function() { throw "Not Implemented"; },
		upgradeCheckAllDBs : function() { throw "Not Implemented"; }
	}; // MicroMongoDB.DB return

}; // MicroMongoDB.DB

