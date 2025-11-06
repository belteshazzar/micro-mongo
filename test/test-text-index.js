import { expect } from 'chai';
import { TextIndex } from '../text-index.js';

describe('TextIndex', function() {
  let index;

  beforeEach(function() {
    index = new TextIndex();
  });

  afterEach(function() {
    index = null;
  });

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
      expect(index.getTermCount()).to.equal(5); // hello, world, how, ar (from 'are'), you
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
      const results = index.query('fox jump dog');
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
      const results = index.query('hello');
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
      const results = index.query('world');
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
      const results = index.query('fox');
      expect(results).to.have.lengthOf(2);
      expect(results).to.include('doc1');
      expect(results).to.include('doc2');
    });

    it('should find documents with multiple terms (AND)', function() {
      const results = index.query('brown fox');
      expect(results).to.have.lengthOf(2);
      expect(results).to.include('doc1');
      expect(results).to.include('doc2');
    });

    it('should apply stemming to query terms', function() {
      // 'jumping' should stem to 'jump', matching 'jumps'
      const results = index.query('jumping');
      expect(results).to.include('doc1');
    });

    it('should return empty array when no matches found', function() {
      const results = index.query('elephant');
      expect(results).to.be.an('array').that.is.empty;
    });

    it('should handle case-insensitive queries', function() {
      const results = index.query('FOX');
      expect(results).to.have.lengthOf(2);
    });

    it('should handle empty query', function() {
      const results = index.query('');
      expect(results).to.be.an('array').that.is.empty;
    });

    it('should handle query with punctuation', function() {
      const results = index.query('fox!');
      expect(results).to.have.lengthOf(2);
    });

    it('should return only documents matching ALL terms', function() {
      const results = index.query('lazy dog');
      expect(results).to.have.lengthOf(1);
      expect(results).to.include('doc1');
    });

    it('should handle queries with stemming variations', function() {
      // 'dogs' should stem to 'dog'
      const results = index.query('dogs');
      expect(results).to.have.lengthOf(2);
      expect(results).to.include('doc1');
      expect(results).to.include('doc4');
    });

    it('should handle complex queries', function() {
      const results = index.query('the lazy');
      expect(results).to.have.lengthOf(2);
      expect(results).to.include('doc1');
      expect(results).to.include('doc3');
    });

    it('should return empty when one term does not match', function() {
      const results = index.query('fox elephant');
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
      let results = index.query('JavaScript programming');
      expect(results).to.have.lengthOf(2);
      expect(results).to.include('blog1');
      expect(results).to.include('blog2');
      
      // Query for learning
      results = index.query('learning');
      expect(results).to.have.lengthOf(2);
      expect(results).to.include('blog1');
      expect(results).to.include('blog3');
      
      // Remove a document and query again
      index.remove('blog1');
      results = index.query('learning');
      expect(results).to.have.lengthOf(1);
      expect(results).to.include('blog3');
    });

    it('should handle documents with overlapping terms', function() {
      index.add('doc1', 'apple orange banana');
      index.add('doc2', 'orange banana grape');
      index.add('doc3', 'banana grape mango');
      
      const results = index.query('banana');
      expect(results).to.have.lengthOf(3);
      
      const results2 = index.query('orange banana');
      expect(results2).to.have.lengthOf(2);
      expect(results2).to.include('doc1');
      expect(results2).to.include('doc2');
    });

    it('should handle adding, querying, removing, and re-adding', function() {
      index.add('doc1', 'test document');
      let results = index.query('test');
      expect(results).to.include('doc1');
      
      index.remove('doc1');
      results = index.query('test');
      expect(results).to.be.empty;
      
      index.add('doc1', 'new test content');
      results = index.query('test');
      expect(results).to.include('doc1');
      
      results = index.query('document');
      expect(results).to.be.empty; // old content removed
    });
  });
});
