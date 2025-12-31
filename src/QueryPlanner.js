import { TextCollectionIndex } from './TextCollectionIndex.js';
import { GeospatialCollectionIndex } from './GeospatialCollectionIndex.js';

/**
 * Query execution plan
 */
class QueryPlan {
	constructor() {
		this.type = 'full_scan'; // 'full_scan', 'index_scan', 'index_intersection', 'index_union'
		this.indexes = []; // Indexes to use
		this.indexScans = []; // Array of { indexName, docIds }
		this.estimatedCost = Infinity;
		this.indexOnly = false; // If true, only use index results (no full scan fallback)
	}
}

/**
 * Query planner - analyzes queries and generates optimal execution plans
 */
export class QueryPlanner {
	constructor(indexes) {
		this.indexes = indexes; // Map<string, CollectionIndex>
	}

	/**
	 * Generate an execution plan for a query
	 * @param {Object} query - MongoDB query object
	 * @returns {QueryPlan} Execution plan
	 */
	plan(query) {
		const plan = new QueryPlan();

		// Empty query - full scan
		if (!query || Object.keys(query).length === 0) {
			return plan;
		}

		// Analyze query structure
		const analysis = this._analyzeQuery(query);

		// Check for text search
		if (analysis.hasTextSearch) {
			const textPlan = this._planTextSearch(query, analysis);
			if (textPlan) {
				return textPlan;
			}
		}

		// Check for geospatial query
		if (analysis.hasGeoQuery) {
			const geoPlan = this._planGeoQuery(query, analysis);
			if (geoPlan) {
				return geoPlan;
			}
		}

		// Check for $and queries - can use index intersection
		if (analysis.type === 'and') {
			const andPlan = this._planAndQuery(query, analysis);
			if (andPlan.type !== 'full_scan') {
				return andPlan;
			}
		}

		// Check for $or queries - can use index union
		if (analysis.type === 'or') {
			const orPlan = this._planOrQuery(query, analysis);
			if (orPlan.type !== 'full_scan') {
				return orPlan;
			}
		}

		// Try to find a single index for simple queries
		const simplePlan = this._planSimpleQuery(query);
		if (simplePlan.type !== 'full_scan') {
			return simplePlan;
		}

		// Fall back to full scan
		return plan;
	}

	/**
	 * Analyze query structure
	 * @private
	 */
	_analyzeQuery(query) {
		const analysis = {
			type: 'simple', // 'simple', 'and', 'or', 'complex'
			fields: [],
			operators: {},
			hasTextSearch: false,
			hasGeoQuery: false,
			conditions: []
		};

		const keys = Object.keys(query);

		// Check for top-level logical operators
		if (keys.length === 1) {
			const key = keys[0];
			if (key === '$and') {
				analysis.type = 'and';
				analysis.conditions = query.$and;
				// Analyze each condition
				for (const condition of analysis.conditions) {
					const subAnalysis = this._analyzeQuery(condition);
					analysis.fields.push(...subAnalysis.fields);
					if (subAnalysis.hasTextSearch) analysis.hasTextSearch = true;
					if (subAnalysis.hasGeoQuery) analysis.hasGeoQuery = true;
				}
				return analysis;
			} else if (key === '$or') {
				analysis.type = 'or';
				analysis.conditions = query.$or;
				// Analyze each condition
				for (const condition of analysis.conditions) {
					const subAnalysis = this._analyzeQuery(condition);
					analysis.fields.push(...subAnalysis.fields);
					if (subAnalysis.hasTextSearch) analysis.hasTextSearch = true;
					if (subAnalysis.hasGeoQuery) analysis.hasGeoQuery = true;
				}
				return analysis;
			}
		}

		// Analyze simple field conditions
		for (const field of keys) {
			if (field.startsWith('$')) {
				continue; // Skip top-level operators we don't handle yet
			}

			analysis.fields.push(field);
			const value = query[field];

			// Check for operators
			if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
				const ops = Object.keys(value);
				analysis.operators[field] = ops;

				// Check for text search
				if (ops.includes('$text')) {
					analysis.hasTextSearch = true;
				}

				// Check for geospatial operators
				if (ops.some(op => ['$geoWithin', '$geoIntersects', '$near', '$nearSphere'].includes(op))) {
					analysis.hasGeoQuery = true;
				}
			}
		}

		// If multiple fields, it's an implicit $and
		if (keys.length > 1) {
			analysis.type = 'and';
		}

		return analysis;
	}

	/**
	 * Plan for text search queries
	 * @private
	 */
	_planTextSearch(query, analysis) {
		// Find text index
		for (const [indexName,index] of this.indexes) {
			if (index instanceof TextCollectionIndex) {
				// Look for $text operator in query
				const textQuery = this._extractTextQuery(query);
				if (textQuery) {
					const plan = new QueryPlan();
					plan.type = 'index_scan';
					plan.indexes = [indexName];
					// Store query info for execution phase, don't execute yet
					plan.indexScans = [{ indexName, index, textQuery }];
					plan.estimatedCost = 100; // Rough estimate without executing
					plan.indexOnly = true; // Text search must use index
					return plan;
				}
			}
		}
		return null;
	}

	/**
	 * Extract $text query from query object
	 * @private
	 */
	_extractTextQuery(query) {
		for (const field in query) {
			const value = query[field];
			if (typeof value === 'object' && value !== null && value.$text) {
				return typeof value.$text === 'string' ? value.$text : value.$text.$search;
			}
		}
		return null;
	}

	/**
	 * Plan for geospatial queries
	 * @private
	 */
	_planGeoQuery(query, analysis) {
		// Find geospatial index
		for (const [indexName,index] of this.indexes) {
			if (index instanceof GeospatialCollectionIndex) {
				// Check if this index can handle the query (don't execute yet)
				const plan = new QueryPlan();
				plan.type = 'index_scan';
				plan.indexes = [indexName];
				// Store query info for execution phase, don't execute yet
				plan.indexScans = [{ indexName, index, query }];
				plan.estimatedCost = 100; // Rough estimate without executing
				plan.indexOnly = true; // Geospatial queries must use index
				return plan;
			}
		}
		return null;
	}

	/**
	 * Plan for $and queries (index intersection)
	 * @private
	 */
	_planAndQuery(query, analysis) {
		const plan = new QueryPlan();

		// Extract conditions
		let conditions;
		if (query.$and) {
			conditions = query.$and;
		} else {
			// Implicit AND - convert to array of conditions
			conditions = Object.keys(query).map(field => ({ [field]: query[field] }));
		}

		// Try to find indexes for each condition
		const indexableConditions = [];
		for (const condition of conditions) {
			const conditionPlan = this._planSimpleQuery(condition);
			if (conditionPlan.type === 'index_scan') {
				indexableConditions.push(conditionPlan.indexScans[0]);
			}
		}

		// If we have multiple indexable conditions, use index intersection
		if (indexableConditions.length > 1) {
			plan.type = 'index_intersection';
			plan.indexScans = indexableConditions;
			plan.indexes = indexableConditions.map(scan => scan.indexName);
			
			// Estimate cost (rough estimate without executing)
			plan.estimatedCost = 50; // Intersection typically reduces result set
			return plan;
		}

		// If we have one indexable condition, use it
		if (indexableConditions.length === 1) {
			plan.type = 'index_scan';
			plan.indexScans = [indexableConditions[0]];
			plan.indexes = [indexableConditions[0].indexName];
			plan.estimatedCost = 50; // Rough estimate without executing
			return plan;
		}

		return plan; // full_scan
	}

	/**
	 * Plan for $or queries (index union)
	 * @private
	 */
	_planOrQuery(query, analysis) {
		const plan = new QueryPlan();

		if (!query.$or) {
			return plan;
		}

		const conditions = query.$or;

		// Try to find indexes for each condition
		const indexableConditions = [];
		for (const condition of conditions) {
			const conditionPlan = this._planSimpleQuery(condition);
			if (conditionPlan.type === 'index_scan') {
				indexableConditions.push(conditionPlan.indexScans[0]);
			}
		}

		// If we have at least one indexable condition, use index union
		if (indexableConditions.length > 0) {
			plan.type = 'index_union';
			plan.indexScans = indexableConditions;
			plan.indexes = indexableConditions.map(scan => scan.indexName);
			
			// Estimate cost (rough estimate without executing)
			plan.estimatedCost = 100 * indexableConditions.length; // Union typically increases result set
			return plan;
		}

		return plan; // full_scan
	}

	/**
	 * Plan for simple single-field queries
	 * @private
	 */
	_planSimpleQuery(query) {
		const plan = new QueryPlan();
		const queryKeys = Object.keys(query);

		if (queryKeys.length === 0) {
			return plan;
		}

		// Try each index
		for (const [indexName,index] of this.indexes) {

			// Skip special index types (they have their own planning)
			if (index instanceof TextCollectionIndex || index instanceof GeospatialCollectionIndex) {
				continue;
			}

			// Check if this index CAN handle the query (don't execute yet)
			if (this._canIndexHandleQuery(index, query)) {
				plan.type = 'index_scan';
				plan.indexes = [indexName];
				// Store query info for execution phase, don't execute yet
				plan.indexScans = [{ indexName, index, query }];
				plan.estimatedCost = 50; // Rough estimate without executing
				return plan;
			}
		}

		return plan; // full_scan
	}

	/**
	 * Execute a single index scan that was deferred from planning
	 * @private
	 */
	async _executeIndexScan(scan) {
		const { index, query, textQuery } = scan;
		
		// Handle text search
		if (textQuery !== undefined) {
			return await index.search(textQuery);
		}
		
		// Handle regular index query
		if (query !== undefined) {
			const docIds = await index.query(query);
			return docIds !== null ? docIds : [];
		}
		
		// Fallback: if docIds were already computed (backward compatibility)
		if (scan.docIds !== undefined) {
			return scan.docIds;
		}
		
		return [];
	}

	/**
	 * Check if an index can handle a query (without executing it)
	 * @private
	 */
	_canIndexHandleQuery(index, query) {
		const queryKeys = Object.keys(query);
		const indexFields = Object.keys(index.keys);

		// Only support single-field index queries for now
		if (indexFields.length !== 1) {
			return false;
		}

		const field = indexFields[0];
		
		// Check if query has this field
		if (queryKeys.indexOf(field) === -1) {
			return false;
		}

		return true;
	}

	/**
	 * Execute a query plan and return document IDs
	 * @param {QueryPlan} plan - The execution plan
	 * @returns {Promise<Array|null>} Array of document IDs or null for full scan
	 */
	async execute(plan) {
		if (plan.type === 'full_scan') {
			return null; // Signals cursor to do full scan
		}

		if (plan.type === 'index_scan') {
			// Execute the query now
			const scan = plan.indexScans[0];
			return await this._executeIndexScan(scan);
		}

		if (plan.type === 'index_intersection') {
			// Intersection: docs must be in ALL index results
			if (plan.indexScans.length === 0) return null;
			
			// Execute all scans
			const results = [];
			for (const scan of plan.indexScans) {
				results.push({
					docIds: await this._executeIndexScan(scan),
					indexName: scan.indexName
				});
			}
			
			// Start with the smallest set for efficiency
			const sorted = results.slice().sort((a, b) => a.docIds.length - b.docIds.length);
			let result = new Set(sorted[0].docIds);
			
			// Intersect with each subsequent set
			for (let i = 1; i < sorted.length; i++) {
				const currentSet = new Set(sorted[i].docIds);
				result = new Set([...result].filter(id => currentSet.has(id)));
				
				// Early exit if intersection becomes empty
				if (result.size === 0) break;
			}
			
			return Array.from(result);
		}

		if (plan.type === 'index_union') {
			// Union: docs in ANY index result
			const result = new Set();
			for (const scan of plan.indexScans) {
				const docIds = await this._executeIndexScan(scan);
				docIds.forEach(id => result.add(id));
			}
			return Array.from(result);
		}

		return null;
	}
}
