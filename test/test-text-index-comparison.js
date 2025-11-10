import { expect } from 'chai';
import { TextIndex } from '../src/text-index.js';
import { Txi } from 'txi';

describe('TextIndex vs TXI Comparison', function() {
  
  describe('Basic functionality comparison', function() {
    const sampleDocs = [
      { _id: 'doc1', text: 'The quick brown fox jumps over the lazy dog' },
      { _id: 'doc2', text: 'A quick brown dog runs through the forest' },
      { _id: 'doc3', text: 'The lazy cat sleeps under the tree' },
      { _id: 'doc4', text: 'Foxes are quick and clever animals' },
      { _id: 'doc5', text: 'Dogs and cats are popular pets' }
    ];

    it('should compare indexing and querying for "quick"', async function() {
      // TextIndex implementation
      const textIndex = new TextIndex();
      sampleDocs.forEach(doc => {
        textIndex.add(doc._id, doc.text);
      });
      const textIndexResultsScored = textIndex.query('quick');
      const textIndexResults = textIndexResultsScored.map(r => r.id);
      
      // TXI implementation
      const txiIndex = Txi();
      for (const doc of sampleDocs) {
        await txiIndex.index(doc._id, doc.text);
      }
      const txiResultsRaw = await txiIndex.search('quick');
      const txiResults = txiResultsRaw.map(r => r.id);
      
      console.log('\n--- Query: "quick" ---');
      console.log('TextIndex results:', textIndexResults);
      console.log('TextIndex scores: ', textIndexResultsScored.map(r => ({ id: r.id, score: r.score.toFixed(3) })));
      console.log('TXI results:      ', txiResults);
      console.log('TXI scores:       ', txiResultsRaw.map(r => ({ id: r.id, score: r.score })));
      console.log('Match:', JSON.stringify(textIndexResults.sort()) === JSON.stringify(txiResults.sort()));
    });

    it('should compare indexing and querying for "fox"', async function() {
      // TextIndex implementation
      const textIndex = new TextIndex();
      sampleDocs.forEach(doc => {
        textIndex.add(doc._id, doc.text);
      });
      const textIndexResultsScored = textIndex.query('fox');
      const textIndexResults = textIndexResultsScored.map(r => r.id);
      
      // TXI implementation
      const txiIndex = Txi();
      for (const doc of sampleDocs) {
        await txiIndex.index(doc._id, doc.text);
      }
      const txiResultsRaw = await txiIndex.search('fox');
      const txiResults = txiResultsRaw.map(r => r.id);
      
      console.log('\n--- Query: "fox" ---');
      console.log('TextIndex results:', textIndexResults);
      console.log('TextIndex scores: ', textIndexResultsScored.map(r => ({ id: r.id, score: r.score.toFixed(3) })));
      console.log('TXI results:      ', txiResults);
      console.log('TXI scores:       ', txiResultsRaw.map(r => ({ id: r.id, score: r.score })));
      console.log('Match:', JSON.stringify(textIndexResults.sort()) === JSON.stringify(txiResults.sort()));
    });

    it('should compare multi-term query "lazy dog"', async function() {
      // TextIndex implementation
      const textIndex = new TextIndex();
      sampleDocs.forEach(doc => {
        textIndex.add(doc._id, doc.text);
      });
      const textIndexResultsScored = textIndex.query('lazy dog');
      const textIndexResults = textIndexResultsScored.map(r => r.id);
      
      // TXI implementation
      const txiIndex = Txi();
      for (const doc of sampleDocs) {
        await txiIndex.index(doc._id, doc.text);
      }
      const txiResultsRaw = await txiIndex.search('lazy dog');
      const txiResults = txiResultsRaw.map(r => r.id);
      
      console.log('\n--- Query: "lazy dog" (Scored/Ranked search) ---');
      console.log('TextIndex results:', textIndexResults);
      console.log('TextIndex scores: ', textIndexResultsScored.map(r => ({ id: r.id, score: r.score.toFixed(3) })));
      console.log('TXI results:      ', txiResults);
      console.log('TXI scores:       ', txiResultsRaw.map(r => ({ id: r.id, score: r.score })));
      console.log('  (Both now use scored results - ranked by relevance)');
    });
  });

  describe('Stemming behavior comparison', function() {
    it('should compare stemming of plural words', async function() {
      const docs = [
        { _id: 'doc1', text: 'I have a cat' },
        { _id: 'doc2', text: 'I have many cats' },
        { _id: 'doc3', text: 'Dogs are loyal' },
        { _id: 'doc4', text: 'My dog is friendly' }
      ];

      // TextIndex implementation
      const textIndex = new TextIndex();
      docs.forEach(doc => textIndex.add(doc._id, doc.text));
      
      console.log('\n--- Stemming: "cat" vs "cats" ---');
      const textIndexCat = textIndex.query('cat', { scored: false });
      console.log('TextIndex query "cat": ', textIndexCat.sort());
      
      const textIndexCats = textIndex.query('cats', { scored: false });
      console.log('TextIndex query "cats":', textIndexCats.sort());

      // TXI implementation
      const txiIndex = Txi();
      for (const doc of docs) {
        await txiIndex.index(doc._id, doc.text);
      }
      
      const txiCatRaw = await txiIndex.search('cat');
      const txiCat = txiCatRaw.map(r => r.id);
      console.log('TXI query "cat":       ', txiCat.sort());
      
      const txiCatsRaw = await txiIndex.search('cats');
      const txiCats = txiCatsRaw.map(r => r.id);
      console.log('TXI query "cats":      ', txiCats.sort());
      
      console.log('\n--- Stemming: "dog" vs "dogs" ---');
      const textIndexDog = textIndex.query('dog', { scored: false });
      console.log('TextIndex query "dog": ', textIndexDog.sort());
      
      const textIndexDogs = textIndex.query('dogs', { scored: false });
      console.log('TextIndex query "dogs":', textIndexDogs.sort());

      const txiDogRaw = await txiIndex.search('dog');
      const txiDog = txiDogRaw.map(r => r.id);
      console.log('TXI query "dog":       ', txiDog.sort());
      
      const txiDogsRaw = await txiIndex.search('dogs');
      const txiDogs = txiDogsRaw.map(r => r.id);
      console.log('TXI query "dogs":      ', txiDogs.sort());
    });
  });

  describe('Performance comparison', function() {
    it('should compare indexing performance', async function() {
      const largeDataset = [];
      for (let i = 0; i < 1000; i++) {
        largeDataset.push({
          _id: `doc${i}`,
          text: `Document ${i} contains some sample text about topic ${i % 10}`
        });
      }

      // TextIndex performance
      const textIndex = new TextIndex();
      const textIndexStart = Date.now();
      largeDataset.forEach(doc => textIndex.add(doc._id, doc.text));
      const textIndexTime = Date.now() - textIndexStart;

      // TXI performance
      const txiIndex = Txi();
      const txiStart = Date.now();
      for (const doc of largeDataset) {
        await txiIndex.index(doc._id, doc.text);
      }
      const txiTime = Date.now() - txiStart;

      console.log('\n--- Performance: Indexing 1000 documents ---');
      console.log(`TextIndex: ${textIndexTime}ms`);
      console.log(`TXI:       ${txiTime}ms`);
      console.log(`Ratio:     ${(textIndexTime / txiTime).toFixed(2)}x`);
    });

    it('should compare query performance', async function() {
      const largeDataset = [];
      for (let i = 0; i < 1000; i++) {
        largeDataset.push({
          _id: `doc${i}`,
          text: `Document ${i} contains some sample text about topic ${i % 10}`
        });
      }

      const textIndex = new TextIndex();
      const txiIndex = Txi();
      
      largeDataset.forEach(doc => textIndex.add(doc._id, doc.text));
      for (const doc of largeDataset) {
        await txiIndex.index(doc._id, doc.text);
      }

      // TextIndex query performance
      const textIndexStart = Date.now();
      for (let i = 0; i < 100; i++) {
        textIndex.query('sample text');
      }
      const textIndexTime = Date.now() - textIndexStart;

      // TXI query performance
      const txiStart = Date.now();
      for (let i = 0; i < 100; i++) {
        await txiIndex.search('sample text');
      }
      const txiTime = Date.now() - txiStart;

      console.log('\n--- Performance: 100 queries on 1000 documents ---');
      console.log(`TextIndex: ${textIndexTime}ms`);
      console.log(`TXI:       ${txiTime}ms`);
      console.log(`Ratio:     ${(textIndexTime / txiTime).toFixed(2)}x`);
    });
  });
});
