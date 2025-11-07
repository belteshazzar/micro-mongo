import { stemmer } from 'stemmer';

/**
 * TextIndex - A text index implementation using Porter stemmer algorithm
 * 
 * This class provides full-text search capabilities by indexing terms
 * and associating them with document IDs. It uses the Porter stemmer
 * algorithm to normalize words to their root forms.
 */
export class TextIndex {
  constructor() {
    // Map from stemmed term to Set of document IDs
    this.index = new Map();
    // Map from document ID to Set of stemmed terms in that document
    this.documentTerms = new Map();
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
    return text.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 0);
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
    const stemmedTerms = new Set();

    words.forEach(word => {
      const stem = stemmer(word);
      stemmedTerms.add(stem);

      // Add document ID to the term's set
      if (!this.index.has(stem)) {
        this.index.set(stem, new Set());
      }
      this.index.get(stem).add(docId);
    });

    // Track which terms are in this document
    if (!this.documentTerms.has(docId)) {
      this.documentTerms.set(docId, new Set());
    }
    stemmedTerms.forEach(term => {
      this.documentTerms.get(docId).add(term);
    });
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
    terms.forEach(term => {
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
    return true;
  }

  /**
   * Query the index for documents containing the given terms
   * @param {string} queryText - The search query text
   * @returns {string[]} Array of document IDs that match the query
   */
  query(queryText) {
    const words = this._tokenize(queryText);
    if (words.length === 0) {
      return [];
    }

    // Get stemmed versions of query terms
    const stemmedTerms = words.map(word => stemmer(word));

    // Find documents that contain ALL query terms (AND operation)
    const docSets = stemmedTerms.map(term => {
      return this.index.get(term) || new Set();
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
  }
}
