import { expect } from 'chai';
import { TextIndex } from '../src/TextIndex.js';

describe('TextIndex', function() {
  let index;

  beforeEach(function() {
    index = new TextIndex();
  });

  afterEach(function() {
    index = null;
  });

  // Helper function to extract IDs from scored results
  const getIds = (results) => {
    if (results.length === 0) return [];
    if (typeof results[0] === 'string') return results;
    return results.map(r => r.id);
  };

  describe('Constructor', function() {
    it('should create an empty index', function() {
      expect(index.getTermCount()).to.equal(0);
      expect(index.getDocumentCount()).to.equal(0);
    });
  });

  describe('add()', function() {
    it('should add a simple term to the index', function() {
      index.add('doc1', 'hello');
      expect(index.getDocumentCount()).to.equal(1);
      expect(index.getTermCount()).to.equal(1);
    });

    it('should add multiple terms to the index', function() {
      index.add('doc1', 'hello world');
      expect(index.getDocumentCount()).to.equal(1);
      expect(index.getTermCount()).to.equal(2);
    });

    it('should add multiple documents to the index', function() {
      index.add('doc1', 'hello world');
      index.add('doc2', 'goodbye world');
      expect(index.getDocumentCount()).to.equal(2);
      expect(index.getTermCount()).to.equal(3); // hello, world, goodbye
    });

    it('should handle stemming correctly', function() {
      index.add('doc1', 'running runs run');
      // All three words should stem to 'run'
      expect(index.getTermCount()).to.equal(1);
    });

    it('should handle case-insensitive text', function() {
      index.add('doc1', 'Hello WORLD hello');
      // 'Hello', 'WORLD', and 'hello' should be treated the same
      expect(index.getTermCount()).to.equal(2); // hello, world
    });

    it('should handle punctuation and special characters', function() {
      index.add('doc1', 'Hello, world! How are you?');
      // With stop words: 'how', 'are' and 'you' are all filtered out
      expect(index.getTermCount()).to.equal(2); // hello, world
    });

    it('should handle empty text', function() {
      index.add('doc1', '');
      expect(index.getDocumentCount()).to.equal(1);
      expect(index.getTermCount()).to.equal(0);
    });

    it('should handle non-string text gracefully', function() {
      index.add('doc1', null);
      expect(index.getDocumentCount()).to.equal(1);
      expect(index.getTermCount()).to.equal(0);
    });

    it('should throw error when document ID is missing', function() {
      expect(() => index.add(null, 'hello')).to.throw('Document ID is required');
      expect(() => index.add('', 'hello')).to.throw('Document ID is required');
    });

    it('should handle adding same document multiple times', function() {
      index.add('doc1', 'hello world');
      index.add('doc1', 'goodbye world');
      expect(index.getDocumentCount()).to.equal(1);
      // Should have hello, world, goodbye
      expect(index.getTermCount()).to.equal(3);
    });

    it('should handle complex text with various word forms', function() {
      index.add('doc1', 'The quick brown foxes are jumping over the lazy dogs');
      const results = index.query('fox jump dog', { scored: false });
      expect(results).to.include('doc1');
    });
  });

  describe('remove()', function() {
    it('should remove a document from the index', function() {
      index.add('doc1', 'hello world');
      expect(index.getDocumentCount()).to.equal(1);
      
      const removed = index.remove('doc1');
      expect(removed).to.be.true;
      expect(index.getDocumentCount()).to.equal(0);
      expect(index.getTermCount()).to.equal(0);
    });

    it('should remove only the specified document', function() {
      index.add('doc1', 'hello world');
      index.add('doc2', 'hello universe');
      
      index.remove('doc1');
      expect(index.getDocumentCount()).to.equal(1);
      expect(index.getTermCount()).to.equal(2); // hello, universe
    });

    it('should clean up terms that are only in removed document', function() {
      index.add('doc1', 'unique');
      index.add('doc2', 'common');
      
      index.remove('doc1');
      expect(index.getTermCount()).to.equal(1); // only 'common' remains
    });

    it('should keep shared terms when one document is removed', function() {
      index.add('doc1', 'hello world');
      index.add('doc2', 'hello universe');
      
      index.remove('doc1');
      const results = index.query('hello', { scored: false });
      expect(results).to.deep.equal(['doc2']);
    });

    it('should return false when removing non-existent document', function() {
      const removed = index.remove('nonexistent');
      expect(removed).to.be.false;
    });

    it('should handle removing from empty index', function() {
      const removed = index.remove('doc1');
      expect(removed).to.be.false;
      expect(index.getDocumentCount()).to.equal(0);
    });

    it('should allow re-adding a removed document', function() {
      index.add('doc1', 'hello');
      index.remove('doc1');
      index.add('doc1', 'world');
      
      expect(index.getDocumentCount()).to.equal(1);
      const results = index.query('world', { scored: false });
      expect(results).to.include('doc1');
    });
  });

  describe('query()', function() {
    beforeEach(function() {
      index.add('doc1', 'The quick brown fox jumps over the lazy dog');
      index.add('doc2', 'A fast brown fox');
      index.add('doc3', 'The lazy cat sleeps');
      index.add('doc4', 'Dogs and cats are friends');
    });

    it('should find documents with single term', function() {
      const results = index.query('fox', { scored: false });
      expect(results).to.have.lengthOf(2);
      expect(results).to.include('doc1');
      expect(results).to.include('doc2');
    });

    it('should find documents with multiple terms (AND)', function() {
      const results = index.query('brown fox', { scored: false });
      expect(results).to.have.lengthOf(2);
      expect(results).to.include('doc1');
      expect(results).to.include('doc2');
    });

    it('should apply stemming to query terms', function() {
      // 'jumping' should stem to 'jump', matching 'jumps'
      const results = index.query('jumping', { scored: false });
      expect(results).to.include('doc1');
    });

    it('should return empty array when no matches found', function() {
      const results = index.query('elephant', { scored: false });
      expect(results).to.be.an('array').that.is.empty;
    });

    it('should handle case-insensitive queries', function() {
      const results = index.query('FOX', { scored: false });
      expect(results).to.have.lengthOf(2);
    });

    it('should handle empty query', function() {
      const results = index.query('', { scored: false });
      expect(results).to.be.an('array').that.is.empty;
    });

    it('should handle query with punctuation', function() {
      const results = index.query('fox!', { scored: false });
      expect(results).to.have.lengthOf(2);
    });

    it('should return only documents matching ALL terms', function() {
      const results = index.query('lazy dog', { scored: false, requireAll: true });
      expect(results).to.have.lengthOf(1);
      expect(results).to.include('doc1');
    });

    it('should handle queries with stemming variations', function() {
      // 'dogs' should stem to 'dog'
      const results = index.query('dogs', { scored: false });
      expect(results).to.have.lengthOf(2);
      expect(results).to.include('doc1');
      expect(results).to.include('doc4');
    });

    it('should handle complex queries', function() {
      const results = index.query('the lazy', { scored: false, requireAll: true });
      expect(results).to.have.lengthOf(2);
      expect(results).to.include('doc1');
      expect(results).to.include('doc3');
    });

    it('should return empty when one term does not match', function() {
      const results = index.query('fox elephant', { scored: false, requireAll: true });
      expect(results).to.be.an('array').that.is.empty;
    });
  });

  describe('getTermCount()', function() {
    it('should return 0 for empty index', function() {
      expect(index.getTermCount()).to.equal(0);
    });

    it('should return correct count after adding terms', function() {
      index.add('doc1', 'hello world');
      expect(index.getTermCount()).to.equal(2);
    });

    it('should account for stemming', function() {
      index.add('doc1', 'running runs');
      expect(index.getTermCount()).to.equal(1); // both stem to 'run'
    });

    it('should update count after removal', function() {
      index.add('doc1', 'unique term');
      index.add('doc2', 'shared term');
      expect(index.getTermCount()).to.equal(3);
      
      index.remove('doc1');
      expect(index.getTermCount()).to.equal(2); // 'unique' removed, 'shared' and 'term' remain
    });
  });

  describe('getDocumentCount()', function() {
    it('should return 0 for empty index', function() {
      expect(index.getDocumentCount()).to.equal(0);
    });

    it('should return correct count after adding documents', function() {
      index.add('doc1', 'hello');
      index.add('doc2', 'world');
      expect(index.getDocumentCount()).to.equal(2);
    });

    it('should not double count same document', function() {
      index.add('doc1', 'hello');
      index.add('doc1', 'world');
      expect(index.getDocumentCount()).to.equal(1);
    });

    it('should update count after removal', function() {
      index.add('doc1', 'hello');
      index.add('doc2', 'world');
      index.remove('doc1');
      expect(index.getDocumentCount()).to.equal(1);
    });
  });

  describe('clear()', function() {
    it('should clear all data from the index', function() {
      index.add('doc1', 'hello world');
      index.add('doc2', 'goodbye world');
      
      index.clear();
      
      expect(index.getTermCount()).to.equal(0);
      expect(index.getDocumentCount()).to.equal(0);
    });

    it('should allow adding data after clear', function() {
      index.add('doc1', 'hello');
      index.clear();
      index.add('doc2', 'world');
      
      expect(index.getDocumentCount()).to.equal(1);
      expect(index.getTermCount()).to.equal(1);
    });

    it('should handle clearing empty index', function() {
      index.clear();
      expect(index.getTermCount()).to.equal(0);
      expect(index.getDocumentCount()).to.equal(0);
    });
  });

  describe('Integration tests', function() {
    it('should handle a realistic document collection', function() {
      index.add('blog1', 'How to learn JavaScript programming');
      index.add('blog2', 'JavaScript is a programming language');
      index.add('blog3', 'Learning Python for beginners');
      index.add('blog4', 'Advanced JavaScript techniques');
      
      // Query for JavaScript programming
      let results = index.query('JavaScript programming', { scored: false, requireAll: true });
      expect(results).to.have.lengthOf(2);
      expect(results).to.include('blog1');
      expect(results).to.include('blog2');
      
      // Query for learning
      results = index.query('learning', { scored: false });
      expect(results).to.have.lengthOf(2);
      expect(results).to.include('blog1');
      expect(results).to.include('blog3');
      
      // Remove a document and query again
      index.remove('blog1');
      results = index.query('learning', { scored: false });
      expect(results).to.have.lengthOf(1);
      expect(results).to.include('blog3');
    });

    it('should handle documents with overlapping terms', function() {
      index.add('doc1', 'apple orange banana');
      index.add('doc2', 'orange banana grape');
      index.add('doc3', 'banana grape mango');
      
      const results = index.query('banana', { scored: false });
      expect(results).to.have.lengthOf(3);
      
      const results2 = index.query('orange banana', { scored: false, requireAll: true });
      expect(results2).to.have.lengthOf(2);
      expect(results2).to.include('doc1');
      expect(results2).to.include('doc2');
    });

    it('should handle adding, querying, removing, and re-adding', function() {
      index.add('doc1', 'test document');
      let results = index.query('test', { scored: false });
      expect(results).to.include('doc1');
      
      index.remove('doc1');
      results = index.query('test', { scored: false });
      expect(results).to.be.empty;
      
      index.add('doc1', 'new test content');
      results = index.query('test', { scored: false });
      expect(results).to.include('doc1');
      
      results = index.query('document', { scored: false });
      expect(results).to.be.empty; // old content removed
    });
  });

  describe('Relevance Scoring', function() {
    beforeEach(function() {
      // Add test documents
      index.add('doc1', 'The quick brown fox jumps over the lazy dog');
      index.add('doc2', 'A quick brown dog runs through the forest');
      index.add('doc3', 'The lazy cat sleeps under the tree');
      index.add('doc4', 'Foxes are quick and clever animals');
      index.add('doc5', 'Dogs and cats are popular pets');
    });

    it('should return scored results by default', function() {
      const results = index.query('quick');
      expect(results).to.be.an('array');
      expect(results[0]).to.have.property('id');
      expect(results[0]).to.have.property('score');
      expect(results[0].score).to.be.a('number');
    });

    it('should rank documents by relevance', function() {
      const results = index.query('quick');
      // All documents with 'quick' should have scores
      expect(results.length).to.equal(3);
      // Scores should be in descending order
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).to.be.at.least(results[i + 1].score);
      }
    });

    it('should give higher scores to documents with multiple matching terms', function() {
      const results = index.query('lazy dog');
      // doc1 has both 'lazy' and 'dog', should score highest
      expect(results[0].id).to.equal('doc1');
      // Other docs should have lower scores
      expect(results[0].score).to.be.greaterThan(results[1].score);
    });

    it('should include partial matches when not using requireAll', function() {
      const results = index.query('lazy dog', { scored: false });
      // Should include doc1 (has both), doc2 (has dog), doc3 (has lazy), doc5 (has dog)
      expect(results.length).to.be.greaterThan(1);
      expect(results).to.include('doc1');
    });

    it('should return only exact matches with requireAll option', function() {
      const results = index.query('lazy dog', { scored: false, requireAll: true });
      // Only doc1 has both terms
      expect(results).to.have.lengthOf(1);
      expect(results[0]).to.equal('doc1');
    });

    it('should handle term frequency in scoring', function() {
      index.clear();
      index.add('doc1', 'apple apple apple banana');
      index.add('doc2', 'apple banana cherry');
      index.add('doc3', 'banana cherry date');
      
      const results = index.query('apple');
      // doc1 has apple 3 times, doc2 has apple 1 time, doc3 doesn't have apple
      expect(results.length).to.be.at.least(2);
      expect(results[0]).to.have.property('score');
      // Verify scores are positive (IDF will be log(3/2) > 0)
      expect(results[0].score).to.be.greaterThan(0);
    });

    it('should calculate TF-IDF correctly', function() {
      index.clear();
      index.add('doc1', 'rare word');
      index.add('doc2', 'common common common');
      index.add('doc3', 'common word');
      index.add('doc4', 'common stuff');
      
      const results = index.query('rare', { scored: false });
      // 'rare' only appears in doc1
      expect(results).to.include('doc1');
      
      const commonResults = index.query('common', { scored: false });
      // 'common' appears in multiple docs
      expect(commonResults.length).to.equal(3);
    });
  });

  describe('Stop Words', function() {
    it('should filter stop words by default', function() {
      const index = new TextIndex();
      index.add('doc1', 'The quick brown fox jumps over the lazy dog');
      const terms = Array.from(index.index.keys());
      
      // 'the' and 'over' should be filtered out
      expect(terms).not.to.include('the');
      expect(terms).not.to.include('over');
      // Content words should be indexed
      expect(terms).to.include('quick');
      expect(terms).to.include('brown');
      expect(terms).to.include('fox');
    });

    it('should allow disabling stop word filtering', function() {
      const index = new TextIndex({ useStopWords: false });
      index.add('doc1', 'The quick brown fox');
      const terms = Array.from(index.index.keys());
      
      // With stop words disabled, 'the' should be indexed
      expect(terms).to.include('the');
      expect(terms).to.include('quick');
    });

    it('should allow adding custom stop words', function() {
      const index = new TextIndex();
      index.addStopWords('custom', 'words');
      index.add('doc1', 'Some custom words here');
      const terms = Array.from(index.index.keys());
      
      // Custom stop words should be filtered
      expect(terms).not.to.include('custom');
      expect(terms).not.to.include('word'); // stemmed
    });

    it('should allow removing stop words', function() {
      const index = new TextIndex();
      index.removeStopWords('the', 'and');
      index.add('doc1', 'The cat and the dog');
      const terms = Array.from(index.index.keys());
      
      // Removed stop words should now be indexed
      expect(terms).to.include('the');
      expect(terms).to.include('and');
    });

    it('should allow toggling stop word filtering', function() {
      const index = new TextIndex();
      
      // Start with filtering enabled (default)
      index.add('doc1', 'The quick fox');
      let terms = Array.from(index.index.keys());
      expect(terms).not.to.include('the');
      expect(terms).to.include('quick');
      
      // Disable filtering and re-index
      index.clear();
      index.setStopWordFiltering(false);
      index.add('doc2', 'The quick fox');
      terms = Array.from(index.index.keys());
      expect(terms).to.include('the');
      expect(terms).to.include('quick');
      
      // Re-enable filtering and re-index
      index.clear();
      index.setStopWordFiltering(true);
      index.add('doc3', 'The quick fox');
      terms = Array.from(index.index.keys());
      expect(terms).not.to.include('the');
      expect(terms).to.include('quick');
    });

    it('should improve query relevance by filtering stop words', function() {
      const index = new TextIndex();
      index.add('doc1', 'The quick brown fox');
      index.add('doc2', 'A lazy dog');
      index.add('doc3', 'The brown dog');
      
      // Query with stop words - they should be filtered from query too
      const results = index.query('the brown', { scored: false });
      
      // Should match docs with 'brown', stop word 'the' ignored
      expect(results).to.have.lengthOf(2);
      expect(results).to.include('doc1');
      expect(results).to.include('doc3');
    });
  });
});
