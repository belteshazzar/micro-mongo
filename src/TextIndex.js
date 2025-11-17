import { stemmer } from 'stemmer';
import { IndexStore } from './IndexStore.js';

// Common English stop words that don't add semantic value to searches
const STOPWORDS = new Set([
  'a', 'about', 'after', 'all', 'also', 'am', 'an', 'and', 'another', 'any', 'are', 
  'around', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'between', 'both', 
  'but', 'by', 'came', 'can', 'come', 'could', 'did', 'do', 'each', 'for', 'from', 
  'get', 'got', 'has', 'had', 'he', 'have', 'her', 'here', 'him', 'himself', 'his', 
  'how', 'i', 'if', 'in', 'into', 'is', 'it', 'like', 'make', 'many', 'me', 'might', 
  'more', 'most', 'much', 'must', 'my', 'never', 'now', 'of', 'on', 'only', 'or', 
  'other', 'our', 'out', 'over', 'said', 'same', 'see', 'should', 'since', 'some', 
  'still', 'such', 'take', 'than', 'that', 'the', 'their', 'them', 'then', 'there', 
  'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'up', 'very', 
  'was', 'way', 'we', 'well', 'were', 'what', 'where', 'which', 'while', 'who', 
  'with', 'would', 'you', 'your'
]);

/**
 * TextIndex - A text index implementation using Porter stemmer algorithm
 * 
 * This class provides full-text search capabilities by indexing terms
 * and associating them with document IDs. It uses the Porter stemmer
 * algorithm to normalize words to their root forms.
 */
export class TextIndex {
  constructor(storage = new IndexStore()) {
    // Storage for persistence
    this.storage = storage;
    // Map from stemmed term to Map of document IDs to term frequency
    // Structure: term -> { docId: frequency }
    this.index = this.storage.getDataMap('index');
    // Map from document ID to Map of stemmed terms to their frequency
    // Structure: docId -> { term: frequency }
    this.documentTerms = this.storage.getDataMap('documentTerms');
    // Map from document ID to total term count (for normalization)
    this.documentLengths = this.storage.getDataMap('documentLengths');
  }

  /**
   * Tokenize text into individual words
   * @param {string} text - The text to tokenize
   * @returns {string[]} Array of words
   */
  _tokenize(text) {
    if (typeof text !== 'string') {
      return [];
    }
    // Split on non-word characters and filter out empty strings
    const words = text.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 0);
    
    // Filter stop words
    return words.filter(word => !STOPWORDS.has(word));
  }

  /**
   * Add terms from text to the index for a given document ID
   * @param {string} docId - The document identifier
   * @param {string} text - The text content to index
   */
  add(docId, text) {
    if (!docId) {
      throw new Error('Document ID is required');
    }

    const words = this._tokenize(text);
    const termFrequency = new Map();

    // Count term frequencies
    words.forEach(word => {
      const stem = stemmer(word);
      termFrequency.set(stem, (termFrequency.get(stem) || 0) + 1);
    });

    // Add to index
    termFrequency.forEach((frequency, stem) => {
      if (!this.index.has(stem)) {
        this.index.set(stem, new Map());
      }
      this.index.get(stem).set(docId, frequency);
    });

    // Track document terms and frequencies
    this.documentTerms.set(docId, termFrequency);
    this.documentLengths.set(docId, words.length);
  }

  /**
   * Remove all indexed terms for a given document ID
   * @param {string} docId - The document identifier to remove
   * @returns {boolean} True if document was found and removed, false otherwise
   */
  remove(docId) {
    if (!this.documentTerms.has(docId)) {
      return false;
    }

    // Get all terms associated with this document
    const terms = this.documentTerms.get(docId);

    // Remove document ID from each term's posting list
    terms.forEach((frequency, term) => {
      if (this.index.has(term)) {
        this.index.get(term).delete(docId);
        // Clean up empty term entries
        if (this.index.get(term).size === 0) {
          this.index.delete(term);
        }
      }
    });

    // Remove document from tracking
    this.documentTerms.delete(docId);
    this.documentLengths.delete(docId);
    return true;
  }

  /**
   * Query the index for documents containing the given terms with relevance scoring
   * @param {string} queryText - The search query text
   * @param {Object} options - Query options
   * @param {boolean} options.scored - If true, return scored results; if false, return just IDs (default: true)
   * @param {boolean} options.requireAll - If true, require ALL terms; if false, rank by relevance (default: false)
   * @returns {Array} Array of document IDs (if scored=false) or objects with {id, score} (if scored=true)
   */
  query(queryText, options = { scored: true, requireAll: false }) {
    const words = this._tokenize(queryText);
    if (words.length === 0) {
      return [];
    }

    // Get stemmed versions of query terms
    const stemmedTerms = words.map(word => stemmer(word));
    const uniqueTerms = [...new Set(stemmedTerms)];

    if (options.requireAll) {
      // Strict AND logic - document must contain ALL terms
      const docSets = uniqueTerms.map(term => {
        const termDocs = this.index.get(term);
        return termDocs ? new Set(termDocs.keys()) : new Set();
      });

      if (docSets.length === 0) {
        return [];
      }

      // Compute intersection of all document sets
      const intersection = new Set(docSets[0]);
      for (let i = 1; i < docSets.length; i++) {
        for (const docId of intersection) {
          if (!docSets[i].has(docId)) {
            intersection.delete(docId);
          }
        }
      }

      return Array.from(intersection);
    }

    // Relevance-based scoring (OR logic with ranking)
    // Calculate IDF (Inverse Document Frequency) for each term
    const totalDocs = this.documentLengths.size;
    const idf = new Map();
    
    uniqueTerms.forEach(term => {
      const docsWithTerm = this.index.get(term)?.size || 0;
      if (docsWithTerm > 0) {
        // IDF = log(totalDocs / docsWithTerm)
        idf.set(term, Math.log(totalDocs / docsWithTerm));
      }
    });

    // Collect all documents that contain at least one query term
    const docScores = new Map();

    uniqueTerms.forEach(term => {
      const termDocs = this.index.get(term);
      if (!termDocs) return;

      termDocs.forEach((termFreq, docId) => {
        if (!docScores.has(docId)) {
          docScores.set(docId, 0);
        }

        // Calculate TF-IDF score
        // TF = term frequency in document / total terms in document
        const docLength = this.documentLengths.get(docId) || 1;
        const tf = termFreq / docLength;
        
        // Add to document's total score
        const termIdf = idf.get(term) || 0;
        const tfIdf = tf * termIdf;
        
        docScores.set(docId, docScores.get(docId) + tfIdf);
      });
    });

    // Bonus for documents containing multiple query terms
    docScores.forEach((score, docId) => {
      const docTerms = this.documentTerms.get(docId);
      if (docTerms) {
        const matchingTerms = uniqueTerms.filter(term => docTerms.has(term)).length;
        // Boost score based on term coverage (what % of query terms are present)
        const coverage = matchingTerms / uniqueTerms.length;
        docScores.set(docId, score * (1 + coverage));
      }
    });

    // Sort by score (highest first)
    const results = Array.from(docScores.entries())
      .map(([id, score]) => ({ id, score }))
      .sort((a, b) => b.score - a.score);

    // Return based on options
    if (options.scored === false) {
      return results.map(r => r.id);
    }
    
    return results;
  }

  /**
   * Get the number of unique terms in the index
   * @returns {number} Number of unique terms
   */
  getTermCount() {
    return this.index.size;
  }

  /**
   * Get the number of documents in the index
   * @returns {number} Number of indexed documents
   */
  getDocumentCount() {
    return this.documentTerms.size;
  }

  /**
   * Clear all data from the index
   */
  clear() {
    this.index.clear();
    this.documentTerms.clear();
    this.documentLengths.clear();
  }

}
